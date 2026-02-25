import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CellClickedEvent,
  CellKeyDownEvent,
  ColDef,
  ExcelExportParams,
  FullWidthCellKeyDownEvent,
  GetContextMenuItemsParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  MenuItemDef,
  RowDoubleClickedEvent,
  SideBarDef
} from 'ag-grid-community';
import {
  Torihikisaki,
  OrderDetailRow,
  OrderStatus,
  SalesRow,
  fetchSalesRows
} from '../../sample-data';
import { AG_GRID_LOCALE_JA_JP } from '../../ag-grid-locale-ja';

@Component({
  selector: 'app-jyucyu-list',
  templateUrl: './jyucyu-list.component.html',
  styleUrls: ['./jyucyu-list.component.scss']
})
export class JyucyuListComponent implements OnInit {
  // 取引先セルクリック時に表示するポップアップの選択状態
  selectedTorihikisaki: Torihikisaki | null = null;

  // データロード中の表示制御
  isLoading = true;
  selectedRowCount = 0;
  private gridApi: GridApi<SalesRow> | null = null;
  private selectionMode: 'range' | 'row' = 'range';

  constructor(private readonly router: Router) {}

  // 親グリッド（受注一覧）の列定義
  readonly columnDefs: ColDef<SalesRow>[] = [
    {
      headerName: '受注状況',
      field: 'jyucyuJyokyo',
      filter: 'agSetColumnFilter',
      hide: false,
      enablePivot: true,
      enableRowGroup: true,
      cellRenderer: (params: ICellRendererParams<SalesRow, OrderStatus>) =>
        this.statusBadgeRenderer(params.value)
    },
    {
      headerName: '受注日',
      field: 'jyucyuDate',
      filter: 'agDateColumnFilter',
      enableRowGroup: true,
      valueFormatter: (params) => this.dateFormatter(params)
    },
    {
      headerName: '受注番号',
      field: 'jyucyuNo',
      filter: 'agTextColumnFilter',
      // Master/Detail の展開アイコンを表示
      cellRenderer: 'agGroupCellRenderer'
    },
    {
      headerName: '取引先コード',
      field: 'customerCode',
      filter: 'agTextColumnFilter',
      enableRowGroup: true
    },
    {
      headerName: '取引先名',
      field: 'customer',
      filter: 'agTextColumnFilter',
      enableRowGroup: true,
      // クリック可能であることを見た目で示す
      cellClass: 'customer-link-cell'
    },
    {
      headerName: '受注金額',
      field: 'jyucyuKingakuGokei',
      filter: 'agNumberColumnFilter',
      enableValue: true,
      valueFormatter: (params) => this.currencyFormatter(params),
      valueGetter: (params) => params.data?.jyucyuKingakuGokei
    },
    {
      headerName: '粗利益',
      field: 'ararieki',
      filter: 'agNumberColumnFilter',
      enableValue: true,
      hide: true,
      valueFormatter: (params) => this.currencyFormatter(params)
    },
    {
      headerName: '粗利益率',
      field: 'arariekiRitsu',
      filter: 'agNumberColumnFilter',
      enableValue: true,
      hide: true,
      valueFormatter: (params) => this.rateFormatter(params.value),
    },
    {
      headerName: '取引形態',
      field: 'torihikiKeitai',
      filter: 'agSetColumnFilter',
      enableRowGroup: true,
      hide: true
    },
    {
      headerName: '内税外税',
      field: 'utizeiSotozei',
      filter: 'agSetColumnFilter',
      enableRowGroup: true,
      hide: true
    },
    {
      headerName: '出荷先コード',
      field: 'shipToCode',
      filter: 'agTextColumnFilter',
      enableRowGroup: true
    },
    {
      headerName: '出荷先名',
      field: 'shipToName',
      filter: 'agTextColumnFilter',
      enableRowGroup: true
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

  // サイドバー（列表示/非表示切替）設定
  readonly sideBar: SideBarDef = {
    toolPanels: ['columns'],
    defaultToolPanel: 'columns'
  };

  // Excel出力時はExcelテーブル形式でエクスポートする
  readonly defaultExcelExportParams: ExcelExportParams = {
    exportAsExcelTable: true
  };

  // AG Gridの表示文言を日本語化
  readonly localeText: Record<string, string> = AG_GRID_LOCALE_JA_JP;

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
      localeText: AG_GRID_LOCALE_JA_JP,
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

  // 選択行数を保持し、ボタン活性制御に利用
  onSelectionChanged(): void {
    this.updateSelectedRowCount();
  }

  // セル範囲選択の変更時も、選択行数判定を更新する
  onRangeSelectionChanged(): void {
    this.updateSelectedRowCount();
  }

  // 行選択/セル範囲選択の両方から、実質的な選択行数を算出
  private updateSelectedRowCount(): void {
    if (!this.gridApi) {
      this.selectedRowCount = 0;
      return;
    }

    const rowSelectedCount = this.gridApi.getSelectedRows().length;
    const rangeSelectedCount = this.getRangeSelectedRowCount();
    this.selectedRowCount = Math.max(rowSelectedCount, rangeSelectedCount);
  }

  // セル範囲選択から、縦方向に選択された行数を算出
  private getRangeSelectedRowCount(): number {
    if (!this.gridApi || !this.isRangeSelectionMode) {
      return 0;
    }

    const apiWithRanges = this.gridApi as unknown as {
      getCellRanges?: () => Array<{
        startRow?: { rowIndex: number | null };
        endRow?: { rowIndex: number | null };
      }>;
    };
    const ranges = apiWithRanges.getCellRanges?.() ?? [];
    if (!ranges.length) {
      return 0;
    }

    const rowIndexes = new Set<number>();
    ranges.forEach((range) => {
      const start = range.startRow?.rowIndex;
      const end = range.endRow?.rowIndex;
      if (start == null || end == null) {
        return;
      }

      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let i = min; i <= max; i++) {
        rowIndexes.add(i);
      }
    });

    return rowIndexes.size;
  }

  // 受注行のダブルクリック時は、編集画面へ受注ID付きで遷移する
  onRowDoubleClicked(event: RowDoubleClickedEvent<SalesRow>): void {
    if (!event.data) {
      return;
    }

    this.router.navigate(['/jyucyu/edit'], {
      queryParams: { id: event.data.jyucyuNo }
    });
  }

  // 新規ボタン押下時に受注登録画面へ遷移
  moveToRegister(): void {
    this.router.navigate(['/jyucyu/register']);
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

  exportAsCsv(): void {
    if (!this.gridApi) {
      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: '受注一覧.csv'
    });
  }

  // 取引先列クリック時に取引先詳細ポップアップを開く
  onCellClicked(event: CellClickedEvent<SalesRow>): void {
    if (event.colDef.field !== 'customer' || !event.data) {
      return;
    }

    this.selectedTorihikisaki = event.data.torihikisaki;
  }

  closeCustomerPopup(): void {
    this.selectedTorihikisaki = null;
  }

  // Ctrl + ←/→ でページネーションを前後移動する
  onCellKeyDown(event: CellKeyDownEvent<SalesRow> | FullWidthCellKeyDownEvent<SalesRow>): void {
    if (!this.gridApi || !(event.event instanceof KeyboardEvent) || !event.event.ctrlKey) {
      return;
    }

    if (event.event.key === 'ArrowRight') {
      this.gridApi.paginationGoToNextPage();
      event.event.preventDefault();
      return;
    }

    if (event.event.key === 'ArrowLeft') {
      this.gridApi.paginationGoToPreviousPage();
      event.event.preventDefault();
    }
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
    this.selectedRowCount = 0;
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

  private rateFormatter(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return `${value.toFixed(1)}%`;
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
