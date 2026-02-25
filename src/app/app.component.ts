import { Component } from '@angular/core';
import {
  ColDef,
  GetContextMenuItemsParams,
  ICellRendererParams,
  MenuItemDef
} from 'ag-grid-community';

type OrderStatus = '受注' | '一部出荷' | '出荷完了' | 'キャンセル';
type DetailType = '通常' | '値引' | '送料' | '調整';

interface OrderDetailRow {
  lineNo: string;
  detailType: DetailType;
  product: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks: string;
}

interface SalesRow {
  orderDate: string;
  orderId: string;
  customer: string;
  totalAmount: number;
  status: OrderStatus;
  details: OrderDetailRow[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly columnDefs: ColDef<SalesRow>[] = [
    {
      headerName: '受注日',
      field: 'orderDate',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => this.dateFormatter(params),
      cellRenderer: 'agGroupCellRenderer'
    },
    { headerName: '受注番号', field: 'orderId', filter: 'agTextColumnFilter' },
    { headerName: '取引先', field: 'customer', filter: 'agTextColumnFilter' },
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

  readonly rowData: SalesRow[] = [
    this.createOrder('2026-02-01', 'J-2026-001', '株式会社 山田商事', 294000, '受注'),
    this.createOrder('2026-02-02', 'J-2026-002', '田中工業株式会社', 543200, '一部出荷'),
    this.createOrder('2026-02-03', 'J-2026-003', '鈴木食品株式会社', 179820, '出荷完了'),
    this.createOrder('2026-02-04', 'J-2026-004', '加藤ロジスティクス株式会社', 108000, 'キャンセル'),
    this.createOrder('2026-02-05', 'J-2026-005', '佐藤電機株式会社', 452000, '受注'),
    this.createOrder('2026-02-06', 'J-2026-006', '高橋建材株式会社', 236500, '一部出荷'),
    this.createOrder('2026-02-07', 'J-2026-007', '中村精密工業株式会社', 780000, '出荷完了'),
    this.createOrder('2026-02-08', 'J-2026-008', '小林メディカル株式会社', 128400, 'キャンセル'),
    this.createOrder('2026-02-09', 'J-2026-009', '渡辺トレーディング株式会社', 365900, '受注'),
    this.createOrder('2026-02-10', 'J-2026-010', '伊藤化学株式会社', 92000, '一部出荷'),
    this.createOrder('2026-02-11', 'J-2026-011', '山本機械株式会社', 614300, '出荷完了'),
    this.createOrder('2026-02-12', 'J-2026-012', '松本商運株式会社', 248700, 'キャンセル'),
    this.createOrder('2026-02-13', 'J-2026-013', '井上素材株式会社', 159000, '受注'),
    this.createOrder('2026-02-14', 'J-2026-014', '木村システムズ株式会社', 483600, '一部出荷'),
    this.createOrder('2026-02-15', 'J-2026-015', '清水食品流通株式会社', 337500, '出荷完了'),
    this.createOrder('2026-02-16', 'J-2026-016', '森田総業株式会社', 71000, 'キャンセル'),
    this.createOrder('2026-02-17', 'J-2026-017', '阿部オフィスサービス株式会社', 205400, '受注'),
    this.createOrder('2026-02-18', 'J-2026-018', '石井エンジニアリング株式会社', 669900, '一部出荷'),
    this.createOrder('2026-02-19', 'J-2026-019', '池田商会株式会社', 144800, '出荷完了'),
    this.createOrder('2026-02-20', 'J-2026-020', '橋本ロボティクス株式会社', 556000, 'キャンセル')
  ];

  readonly defaultColDef: ColDef<SalesRow> = {
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 130,
    floatingFilter: true
  };

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
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        flex: 1,
        minWidth: 100
      }
    },
    getDetailRowData: (params: { data: SalesRow; successCallback: (rows: OrderDetailRow[]) => void }) => {
      params.successCallback(params.data.details);
    }
  };

  readonly isRowMaster = (dataItem: SalesRow | undefined): boolean => {
    return !!dataItem?.details?.length;
  };

  readonly getContextMenuItems = (
    params: GetContextMenuItemsParams<SalesRow>
  ): (string | MenuItemDef<SalesRow>)[] => {
    const defaultItems = params.defaultItems ?? [];

    return ['copy', 'copyWithHeaders', 'separator', ...defaultItems];
  };

  private createOrder(
    orderDate: string,
    orderId: string,
    customer: string,
    totalAmount: number,
    status: OrderStatus
  ): SalesRow {
    return {
      orderDate,
      orderId,
      customer,
      totalAmount,
      status,
      details: this.createOrderDetails(orderId, totalAmount)
    };
  }

  private createOrderDetails(orderId: string, totalAmount: number): OrderDetailRow[] {
    const baseUnitPrice = Math.max(Math.round(totalAmount / 30), 1000);
    const detail1Qty = 10;
    const detail2Qty = 5;
    const detail1Amount = baseUnitPrice * detail1Qty;
    const detail2Amount = baseUnitPrice * detail2Qty;
    const adjustment = totalAmount - detail1Amount - detail2Amount;

    return [
      {
        lineNo: `${orderId}-01`,
        detailType: '通常',
        product: '産業用センサー',
        quantity: detail1Qty,
        unitPrice: baseUnitPrice,
        amount: detail1Amount,
        remarks: '通常手配'
      },
      {
        lineNo: `${orderId}-02`,
        detailType: '通常',
        product: '制御モジュール',
        quantity: detail2Qty,
        unitPrice: baseUnitPrice,
        amount: detail2Amount,
        remarks: '優先出荷'
      },
      {
        lineNo: `${orderId}-03`,
        detailType: adjustment >= 0 ? '送料' : '値引',
        product: adjustment >= 0 ? '配送費' : '調整値引き',
        quantity: 1,
        unitPrice: adjustment,
        amount: adjustment,
        remarks: adjustment >= 0 ? '路線便' : 'ボリュームディスカウント'
      }
    ];
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
