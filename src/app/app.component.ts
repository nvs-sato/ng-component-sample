import { Component, OnInit } from '@angular/core';
import {
  CellClickedEvent,
  ColDef,
  ExcelExportParams,
  GetContextMenuItemsParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  MenuItemDef
} from 'ag-grid-community';
import {
  CustomerDetail,
  OrderDetailRow,
  OrderStatus,
  SalesRow,
  fetchSalesRows
} from './sample-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // 取引先セルクリック時に表示するポップアップの選択状態
  selectedCustomerDetail: CustomerDetail | null = null;

  // データロード中の表示制御
  isLoading = true;
  private gridApi: GridApi<SalesRow> | null = null;
  private selectionMode: 'range' | 'row' = 'range';

  // 親グリッド（受注一覧）の列定義
  readonly columnDefs: ColDef<SalesRow>[] = [
    {
      headerName: '受注日',
      field: 'orderDate',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => this.dateFormatter(params),
      // Master/Detail の展開アイコンを表示
      cellRenderer: 'agGroupCellRenderer'
    },
    { headerName: '受注番号', field: 'orderId', filter: 'agTextColumnFilter' },
    {
      headerName: '取引先',
      field: 'customer',
      filter: 'agTextColumnFilter',
      // クリック可能であることを見た目で示す
      cellClass: 'customer-link-cell'
    },
    {
      headerName: '受注金額',
      field: 'totalAmount',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => this.currencyFormatter(params)
    },
    {
      headerName: '受注状況',
      field: 'status',
      filter: 'agSetColumnFilter',
      cellRenderer: (params: ICellRendererParams<SalesRow, OrderStatus>) =>
        this.statusBadgeRenderer(params.value)
    }
  ];

  // 初期表示では空配列にして、非同期取得後に反映する
  rowData: SalesRow[] = [];

  // 親グリッド共通の列設定
  readonly defaultColDef: ColDef<SalesRow> = {
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 130,
    floatingFilter: true
  };

  // Excel出力時はExcelテーブル形式でエクスポートする
  readonly defaultExcelExportParams: ExcelExportParams = {
    exportAsExcelTable: true
  };

  // 詳細行（子グリッド）の設定
  readonly detailCellRendererParams = {
    detailGridOptions: {
      columnDefs: [
        { headerName: '明細番号', field: 'lineNo', minWidth: 100 },
        { headerName: '明細区分', field: 'detailType', minWidth: 100 },
        { headerName: '商品', field: 'product', minWidth: 180 },
        {
          headerName: '数量',
          field: 'quantity',
          minWidth: 90,
          valueFormatter: (params: { value: number | null | undefined }) => this.numberFormatter(params.value)
        },
        {
          headerName: '単価',
          field: 'unitPrice',
          minWidth: 120,
          valueFormatter: (params: { value: number | null | undefined }) => this.currencyValue(params.value)
        },
        {
          headerName: '金額',
          field: 'amount',
          minWidth: 120,
          valueFormatter: (params: { value: number | null | undefined }) => this.currencyValue(params.value)
        },
        { headerName: '備考', field: 'remarks', minWidth: 160, flex: 1 }
      ],
      // 詳細行側もセル範囲選択を有効化
      enableRangeSelection: true,
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        flex: 1,
        minWidth: 100
      }
    },
    // 親行データから詳細配列を子グリッドへ受け渡し
    getDetailRowData: (params: { data: SalesRow; successCallback: (rows: OrderDetailRow[]) => void }) => {
      params.successCallback(params.data.details);
    }
  };

  // details を持つ行のみ展開可能にする
  readonly isRowMaster = (dataItem: SalesRow | undefined): boolean => {
    return !!dataItem?.details?.length;
  };

  // 右クリックメニューにコピー系操作を追加
  readonly getContextMenuItems = (
    params: GetContextMenuItemsParams<SalesRow>
  ): (string | MenuItemDef<SalesRow>)[] => {
    const defaultItems = params.defaultItems ?? [];
    const selectionMenu: MenuItemDef<SalesRow> = {
      name: '選択方法',
      subMenu: [
        {
          name: '範囲選択',
          checked: this.selectionMode === 'range',
          action: () => this.setSelectionMode('range')
        },
        {
          name: '行選択',
          checked: this.selectionMode === 'row',
          action: () => this.setSelectionMode('row')
        }
      ]
    };

    return [selectionMenu, 'separator', 'copy', 'copyWithHeaders', 'separator', ...defaultItems];
  };

  // 現在の選択モードに応じてセル範囲選択を切り替える
  get isRangeSelectionMode(): boolean {
    return this.selectionMode === 'range';
  }

  // 現在の選択モードに応じて行選択を切り替える
  get rowSelection(): 'multiple' | undefined {
    return this.selectionMode === 'row' ? 'multiple' : undefined;
  }

  async ngOnInit(): Promise<void> {
    // サーバー取得を模した非同期読み込み
    this.rowData = await fetchSalesRows(1500);
    this.isLoading = false;
  }

  onGridReady(event: GridReadyEvent<SalesRow>): void {
    this.gridApi = event.api;
  }

  exportAsExcelTable(): void {
    if (!this.gridApi) {
      return;
    }

    this.gridApi.exportDataAsExcel({
      fileName: '受注一覧.xlsx',
      sheetName: '受注一覧',
      exportAsExcelTable: true
    });
  }

  // 取引先列クリック時に取引先詳細ポップアップを開く
  onCellClicked(event: CellClickedEvent<SalesRow>): void {
    if (event.colDef.field !== 'customer' || !event.data) {
      return;
    }

    this.selectedCustomerDetail = event.data.customerDetail;
  }

  closeCustomerPopup(): void {
    this.selectedCustomerDetail = null;
  }

  // コンテキストメニューから選択モードを切り替える
  private setSelectionMode(mode: 'range' | 'row'): void {
    this.selectionMode = mode;

    if (!this.gridApi) {
      return;
    }

    // モード変更時に既存選択状態をクリア
    this.gridApi.deselectAll();
    (this.gridApi as unknown as { clearRangeSelection?: () => void }).clearRangeSelection?.();
  }

  private dateFormatter(params: { value: string | null | undefined }): string {
    if (!params.value) {
      return '';
    }

    return new Date(params.value).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private numberFormatter(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return value.toLocaleString('ja-JP');
  }

  // 円表記の共通フォーマッタ
  private currencyValue(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(value);
  }

  private currencyFormatter(params: { value: number | null | undefined }): string {
    return this.currencyValue(params.value);
  }

  // 受注状況に応じた色付きバッジHTMLを返す
  private statusBadgeRenderer(status: OrderStatus | null | undefined): string {
    if (!status) {
      return '';
    }

    const classMap: Record<OrderStatus, string> = {
      受注: 'status-badge status-received',
      一部出荷: 'status-badge status-partial',
      出荷完了: 'status-badge status-complete',
      キャンセル: 'status-badge status-cancelled'
    };

    return `<span class="${classMap[status]}">${status}</span>`;
  }
}
