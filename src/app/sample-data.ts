export type OrderStatus = '受注' | '一部出荷' | '出荷完了' | 'キャンセル';
export type DetailType = '通常' | '値引' | '送料' | '調整';
export type TradingType = '掛売上' | '都度請求' | '現金売上';
export type TaxPosting = '明細' | '伝票' | '一括';

export interface CustomerDetail {
  customerCode: string;
  customerName: string;
  invoiceRegistrationNumber: string;
  postalCode: string;
  address: string;
  contactPerson: string;
  tags: string;
  email: string;
  tradingType: TradingType;
  taxPosting: TaxPosting;
}

export interface OrderDetailRow {
  lineNo: string;
  detailType: DetailType;
  product: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks: string;
}

export interface SalesRow {
  orderDate: string;
  orderId: string;
  customer: string;
  totalAmount: number;
  status: OrderStatus;
  details: OrderDetailRow[];
  customerDetail: CustomerDetail;
}

// サーバーAPI呼び出しを模したサンプル取得関数（短い遅延あり）
export async function fetchSalesRows(delayMs = 450): Promise<SalesRow[]> {
  await wait(delayMs);
  return createSalesRows();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createSalesRows(): SalesRow[] {
  return [
    createOrder('2026-02-01', 'J-2026-001', '株式会社 山田商事', 294000, '受注', 1),
    createOrder('2026-02-02', 'J-2026-002', '田中工業株式会社', 543200, '一部出荷', 2),
    createOrder('2026-02-03', 'J-2026-003', '鈴木食品株式会社', 179820, '出荷完了', 3),
    createOrder('2026-02-04', 'J-2026-004', '加藤ロジスティクス株式会社', 108000, 'キャンセル', 4),
    createOrder('2026-02-05', 'J-2026-005', '佐藤電機株式会社', 452000, '受注', 5),
    createOrder('2026-02-06', 'J-2026-006', '高橋建材株式会社', 236500, '一部出荷', 6),
    createOrder('2026-02-07', 'J-2026-007', '中村精密工業株式会社', 780000, '出荷完了', 7),
    createOrder('2026-02-08', 'J-2026-008', '小林メディカル株式会社', 128400, 'キャンセル', 8),
    createOrder('2026-02-09', 'J-2026-009', '渡辺トレーディング株式会社', 365900, '受注', 9),
    createOrder('2026-02-10', 'J-2026-010', '伊藤化学株式会社', 92000, '一部出荷', 10),
    createOrder('2026-02-11', 'J-2026-011', '山本機械株式会社', 614300, '出荷完了', 11),
    createOrder('2026-02-12', 'J-2026-012', '松本商運株式会社', 248700, 'キャンセル', 12),
    createOrder('2026-02-13', 'J-2026-013', '井上素材株式会社', 159000, '受注', 13),
    createOrder('2026-02-14', 'J-2026-014', '木村システムズ株式会社', 483600, '一部出荷', 14),
    createOrder('2026-02-15', 'J-2026-015', '清水食品流通株式会社', 337500, '出荷完了', 15),
    createOrder('2026-02-16', 'J-2026-016', '森田総業株式会社', 71000, 'キャンセル', 16),
    createOrder('2026-02-17', 'J-2026-017', '阿部オフィスサービス株式会社', 205400, '受注', 17),
    createOrder('2026-02-18', 'J-2026-018', '石井エンジニアリング株式会社', 669900, '一部出荷', 18),
    createOrder('2026-02-19', 'J-2026-019', '池田商会株式会社', 144800, '出荷完了', 19),
    createOrder('2026-02-20', 'J-2026-020', '橋本ロボティクス株式会社', 556000, 'キャンセル', 20)
  ];
}

function createOrder(
  orderDate: string,
  orderId: string,
  customer: string,
  totalAmount: number,
  status: OrderStatus,
  seq: number
): SalesRow {
  return {
    orderDate,
    orderId,
    customer,
    totalAmount,
    status,
    details: createOrderDetails(orderId, totalAmount),
    customerDetail: createCustomerDetail(customer, seq)
  };
}

function createCustomerDetail(customerName: string, seq: number): CustomerDetail {
  const tradingTypeList: TradingType[] = ['掛売上', '都度請求', '現金売上'];
  const taxPostingList: TaxPosting[] = ['明細', '伝票', '一括'];
  const idx = (seq - 1) % 3;
  const zipHead = 100 + ((seq - 1) % 30);
  const zipTail = 1 + seq;

  return {
    customerCode: `CUST-${seq.toString().padStart(4, '0')}`,
    customerName,
    invoiceRegistrationNumber: `T${(1000000000000 + seq).toString()}`,
    postalCode: `${zipHead}-${zipTail.toString().padStart(4, '0')}`,
    address: `東京都千代田区丸の内${seq}-1-${(seq % 9) + 1}`,
    contactPerson: `担当 太郎 ${seq}`,
    tags: seq % 2 === 0 ? '優良, 関東, 法人' : '新規, 法人',
    email: `sales${seq}@example.co.jp`,
    tradingType: tradingTypeList[idx],
    taxPosting: taxPostingList[idx]
  };
}

function createOrderDetails(orderId: string, totalAmount: number): OrderDetailRow[] {
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
