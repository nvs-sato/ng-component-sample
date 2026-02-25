export type OrderStatus = '受注' | '一部出荷' | '出荷完了' | 'キャンセル';
export type DetailType = '通常' | '値引' | '送料' | '調整';
export type TradingType = '掛売上' | '都度請求' | '現金売上';
export type TaxPosting = '明細' | '伝票' | '一括';
export type TaxType = '内税' | '外税';

export interface Torihikisaki {
  torihikisakiCd: string;
  torihikisakiMei: string;
  invoiceRegistrationNumber: string;
  postalCode: string;
  address: string;
  tanto: string;
  tags: string;
  email: string;
  torihikiKeitai: TradingType;
  utizeiSotozei: TaxPosting;
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
  jyucyuDate: string;
  jyucyuNo: string;
  customerCode: string;
  customer: string;
  shipToCode: string;
  shipToName: string;
  summary: string;
  jyucyuKingakuGokei: number;
  ararieki: number;
  arariekiRitsu: number;
  jyucyuJyokyo: OrderStatus;
  torihikiKeitai: TradingType;
  utizeiSotozei: TaxType;
  details: OrderDetailRow[];
  torihikisaki: Torihikisaki;
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
  const customers = [
    '株式会社 山田商事',
    '田中工業株式会社',
    '鈴木食品株式会社',
    '加藤ロジスティクス株式会社',
    '佐藤電機株式会社',
    '高橋建材株式会社',
    '中村精密工業株式会社',
    '小林メディカル株式会社',
    '渡辺トレーディング株式会社',
    '伊藤化学株式会社',
    '山本機械株式会社',
    '松本商運株式会社',
    '井上素材株式会社',
    '木村システムズ株式会社',
    '清水食品流通株式会社',
    '森田総業株式会社',
    '阿部オフィスサービス株式会社',
    '石井エンジニアリング株式会社',
    '池田商会株式会社',
    '橋本ロボティクス株式会社'
  ];
  const statuses: OrderStatus[] = ['受注', '一部出荷', '出荷完了', 'キャンセル'];
  const rows: SalesRow[] = [];

  // 受注データを100件生成
  for (let seq = 1; seq <= 10000; seq++) {
    const day = ((seq - 1) % 28) + 1;
    const orderDate = `2026-02-${day.toString().padStart(2, '0')}`;
    const orderId = `J-2026-${seq.toString().padStart(3, '0')}`;
    const customer = customers[(seq - 1) % customers.length];
    const totalAmount = 90000 + ((seq * 13791) % 700000);
    const status = statuses[(seq - 1) % statuses.length];

    rows.push(createOrder(orderDate, orderId, customer, totalAmount, status, seq));
  }

  return rows;
}

function createOrder(
  orderDate: string,
  orderId: string,
  customer: string,
  totalAmount: number,
  status: OrderStatus,
  seq: number
): SalesRow {
  // 粗利益と粗利益率はサンプル用に一定ルールで計算
  const grossProfit = Math.round(totalAmount * (0.18 + (seq % 5) * 0.02));
  const grossProfitRate = Number(((grossProfit / totalAmount) * 100).toFixed(1));
  const tradingTypeList: TradingType[] = ['掛売上', '都度請求', '現金売上'];
  const taxTypeList: TaxType[] = ['外税', '内税'];

  return {
    jyucyuDate: orderDate,
    jyucyuNo: orderId,
    customerCode: `CUST-${seq.toString().padStart(4, '0')}`,
    customer,
    shipToCode: `SHIP-${seq.toString().padStart(4, '0')}`,
    shipToName: `${customer} 納品センター`,
    summary: seq % 2 === 0 ? '定期補充分' : '新規案件分',
    jyucyuKingakuGokei: totalAmount,
    ararieki: grossProfit,
    arariekiRitsu: grossProfitRate,
    jyucyuJyokyo: status,
    torihikiKeitai: tradingTypeList[(seq - 1) % 3],
    utizeiSotozei: taxTypeList[(seq - 1) % 2],
    details: createOrderDetails(orderId, totalAmount),
    torihikisaki: createTorihikisaki(customer, seq)
  };
}

function createTorihikisaki(customerName: string, seq: number): Torihikisaki {
  const tradingTypeList: TradingType[] = ['掛売上', '都度請求', '現金売上'];
  const taxPostingList: TaxPosting[] = ['明細', '伝票', '一括'];
  const idx = (seq - 1) % 3;
  const zipHead = 100 + ((seq - 1) % 30);
  const zipTail = 1 + seq;

  return {
    torihikisakiCd: `CUST-${seq.toString().padStart(4, '0')}`,
    torihikisakiMei: customerName,
    invoiceRegistrationNumber: `T${(1000000000000 + seq).toString()}`,
    postalCode: `${zipHead}-${zipTail.toString().padStart(4, '0')}`,
    address: `東京都千代田区丸の内${seq}-1-${(seq % 9) + 1}`,
    tanto: `担当 太郎 ${seq}`,
    tags: seq % 2 === 0 ? '優良, 関東, 法人' : '新規, 法人',
    email: `sales${seq}@example.co.jp`,
    torihikiKeitai: tradingTypeList[idx],
    utizeiSotozei: taxPostingList[idx]
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
