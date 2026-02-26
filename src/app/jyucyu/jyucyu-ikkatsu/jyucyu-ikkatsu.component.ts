import { Component } from '@angular/core';
import { ColDef, ValueParserParams } from 'ag-grid-community';
import { AG_GRID_LOCALE_JA_JP } from '../../ag-grid-locale-ja';

interface TorikomiKamoku {
  key: string;
  label: string;
  cellDataType?: string;
}

interface HimozukeSettei {
  torikomiKey: string;
  torikomiLabel: string;
  fileKamoku: string;
}

type FairuGyo = Record<string, string>;
type PurebyuGyo = Record<string, string>;

@Component({
  selector: 'app-jyucyu-ikkatsu',
  templateUrl: './jyucyu-ikkatsu.component.html',
  styleUrls: ['./jyucyu-ikkatsu.component.scss']
})
export class JyucyuIkkatsuComponent {
  // ステップ番号は 1 開始で管理する。
  sutepuNo = 1;
  dragActive = false;
  eraaMessage = '';
  fileMei = '';
  fileKamokuList: string[] = [];
  fileGyoList: FairuGyo[] = [];
  himozukeSetteiList: HimozukeSettei[] = [];
  purebyuGyoList: PurebyuGyo[] = [];
  purebyuColDefs: ColDef<PurebyuGyo>[] = [];
  readonly localeText: Record<string, string> = AG_GRID_LOCALE_JA_JP;
  readonly torihikiKeitaiSentakuList = ['', '掛売上', '都度請求', '現金売上'];
  readonly utizeiSotozeiSentakuList = ['', '内税', '外税'];

  readonly sampleFairuMei = 'jyucyu_ikkatsu_sample.csv';
  // 埋め込みサンプルはヘッダー + 10行データで用意する。
  readonly sampleCsvText = [
    'jyucyuDate,jyucyuNo,torihikisakiCd,torihikisakiMei,shipToCode,shipToName,summary,jyucyuKingakuGokei,ararieki,arariekiRitsu,jyucyuJyokyo,torihikiKeitai,utizeiSotozei,lineNo,detailType,shohin,quantity,unitPrice,amount,remarks',
    '2026/02/26,J-2026-901,CUST-0901,Yamada Shouji,SHIP-0901,Yamada Tokyo DC,Shinki Anken,88000,17600,20.0,受注,掛売上,外税,J-2026-901-01,通常,Sensor,8,11000,88000,AM Nouhin',
    '2026/02/26,J-2026-902,CUST-0902,Tanaka Kougyo,SHIP-0902,Tanaka Kansai Soko,Teiki Hojyu,56000,11200,20.0,受注,都度請求,内税,J-2026-902-01,通常,Module,4,14000,56000,Isogi',
    '2026/02/25,J-2026-903,CUST-0903,Suzuki Foods,SHIP-0903,Suzuki Chubu Center,Hojyu,120000,22800,19.0,一部出荷,掛売上,外税,J-2026-903-01,通常,Valve,12,10000,120000,Bin1',
    '2026/02/25,J-2026-904,CUST-0904,Kato Logi,SHIP-0904,Kato West Hub,Shinki,45000,9000,20.0,受注,現金売上,外税,J-2026-904-01,通常,Cable,30,1500,45000,PM',
    '2026/02/24,J-2026-905,CUST-0905,Sato Denki,SHIP-0905,Sato Main Soko,Tokubetu,77000,13860,18.0,出荷完了,掛売上,内税,J-2026-905-01,通常,PowerUnit,7,11000,77000,LotA',
    '2026/02/24,J-2026-906,CUST-0906,Takahashi Kenzai,SHIP-0906,Takahashi East Soko,Saityumon,98000,19600,20.0,受注,都度請求,外税,J-2026-906-01,通常,Panel,14,7000,98000,Check',
    '2026/02/23,J-2026-907,CUST-0907,Nakamura Seimitsu,SHIP-0907,Nakamura Plant,Antei,63000,12600,20.0,一部出荷,掛売上,内税,J-2026-907-01,通常,Gear,9,7000,63000,Line2',
    '2026/02/23,J-2026-908,CUST-0908,Kobayashi Medical,SHIP-0908,Kobayashi Med Ctr,Iryo,150000,27000,18.0,受注,掛売上,外税,J-2026-908-01,通常,Filter,50,3000,150000,Cold',
    '2026/02/22,J-2026-909,CUST-0909,Watanabe Trading,SHIP-0909,Watanabe Port,Gaityo,39000,7800,20.0,キャンセル,都度請求,外税,J-2026-909-01,通常,Bracket,13,3000,39000,Cancel',
    '2026/02/22,J-2026-910,CUST-0910,Ito Kagaku,SHIP-0910,Ito RnD Soko,Kenkyu,112000,22400,20.0,受注,現金売上,内税,J-2026-910-01,通常,ChemPack,16,7000,112000,Sample'
  ].join('\n');
  readonly sampleHyoiLineList = this.sampleCsvText.split('\n');

  readonly torikomiKamokuList: TorikomiKamoku[] = [
    { key: 'jyucyuDate', label: '受注日', cellDataType: 'date' },
    { key: 'jyucyuNo', label: '受注番号' },
    { key: 'torihikisakiCd', label: '取引先コード' },
    { key: 'torihikisakiMei', label: '取引先名' },
    { key: 'shipToCode', label: '出荷先コード' },
    { key: 'shipToName', label: '出荷先名' },
    { key: 'summary', label: '摘要' },
    { key: 'jyucyuKingakuGokei', label: '受注金額合計' },
    { key: 'ararieki', label: '粗利益' },
    { key: 'arariekiRitsu', label: '粗利益率' },
    { key: 'jyucyuJyokyo', label: '受注状況' },
    { key: 'torihikiKeitai', label: '取引形態' },
    { key: 'utizeiSotozei', label: '内税外税' },
    { key: 'lineNo', label: '明細番号' },
    { key: 'detailType', label: '明細区分' },
    { key: 'shohin', label: '商品' },
    { key: 'quantity', label: '数量' },
    { key: 'unitPrice', label: '単価' },
    { key: 'amount', label: '金額' },
    { key: 'remarks', label: '備考' }
  ];

  onFairuSentaku(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.yomikomiFairu(file).finally(() => {
      // 同一ファイルを再選択できるようにクリアする。
      input.value = '';
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;

    const meikomiCsvText = event.dataTransfer?.getData('text/x-jyucyu-csv') ?? '';
    const meikomiFairuMei = event.dataTransfer?.getData('text/x-jyucyu-csv-name') ?? '';
    if (meikomiCsvText) {
      this.yomikomiNaibuCsv(meikomiCsvText, meikomiFairuMei || this.sampleFairuMei);
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    void this.yomikomiFairu(file);
  }

  onSampleDragStart(event: DragEvent): void {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/x-jyucyu-csv', this.sampleCsvText);
    event.dataTransfer.setData('text/x-jyucyu-csv-name', this.sampleFairuMei);
    event.dataTransfer.setData('text/plain', this.sampleFairuMei);
  }

  torikomiSampleCsv(): void {
    this.yomikomiNaibuCsv(this.sampleCsvText, this.sampleFairuMei);
  }

  goNext(): void {
    if (this.sutepuNo === 2) {
      this.sakuseiPurebyu();
    }
    this.sutepuNo = Math.min(this.sutepuNo + 1, 4);
  }

  goPrev(): void {
    this.sutepuNo = Math.max(this.sutepuNo - 1, 1);
  }

  canGoStep2(): boolean {
    return this.fileKamokuList.length > 0 && this.fileGyoList.length > 0;
  }

  canGoStep3(): boolean {
    return this.himozukeSetteiList.some((item) => item.fileKamoku);
  }

  canGoStep4(): boolean {
    return this.purebyuGyoList.length > 0;
  }

  // ステップ2表示用に、選択列の先頭5行のみを返す。
  getSyoTo5GyoValueList(fileKamoku: string): string[] {
    if (!fileKamoku) {
      return [];
    }

    return this.fileGyoList
      .slice(0, 5)
      .map((gyo, idx) => gyo[fileKamoku] || `(空) [${idx + 1}行目]`);
  }

  startTorikomi(): void {
    window.alert(`取り込み開始: ${this.purebyuGyoList.length}件`);
  }

  private async yomikomiFairu(file: File): Promise<void> {
    this.eraaMessage = '';
    this.fileMei = file.name;

    try {
      const kakutyoshi = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (kakutyoshi === 'csv') {
        const csvText = await file.text();
        this.haneiCsv(csvText);
      } else if (kakutyoshi === 'xlsx' || kakutyoshi === 'xls') {
        this.eraaMessage = 'Excelファイルの直接読込は未対応です。CSV形式で保存して取り込んでください。';
        return;
      } else {
        this.eraaMessage = '対応拡張子は .csv / .xlsx / .xls です。';
        return;
      }

      this.syokikaHimozuke();
      this.sutepuNo = 2;
    } catch {
      this.eraaMessage = 'ファイル読み取りに失敗しました。形式を確認してください。';
    }
  }

  private yomikomiNaibuCsv(csvText: string, fileMei: string): void {
    this.eraaMessage = '';
    this.fileMei = fileMei;

    try {
      this.haneiCsv(csvText);
      this.syokikaHimozuke();
      this.sutepuNo = 2;
    } catch {
      this.eraaMessage = 'サンプルCSVの読み取りに失敗しました。';
    }
  }

  private haneiCsv(csvText: string): void {
    const lineList = csvText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.length > 0);
    if (lineList.length < 2) {
      throw new Error('no-data');
    }

    const hedder = this.bunkatuCsvIchiGyo(lineList[0]);
    const gyoList = lineList.slice(1).map((line) => this.bunkatuCsvIchiGyo(line));
    const seikeiGyoList: FairuGyo[] = gyoList.map((cells) => {
      const rec: FairuGyo = {};
      hedder.forEach((kamoku, idx) => {
        rec[kamoku] = cells[idx] ?? '';
      });
      return rec;
    });

    this.fileKamokuList = hedder;
    this.fileGyoList = seikeiGyoList;
  }

  // ダブルクォート内カンマを考慮した最小CSVパーサー。
  private bunkatuCsvIchiGyo(line: string): string[] {
    const kekka: string[] = [];
    let i = 0;
    let current = '';
    let inQuote = false;

    while (i < line.length) {
      const moji = line[i];
      if (moji === '"') {
        const next = line[i + 1];
        if (inQuote && next === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuote = !inQuote;
        i++;
        continue;
      }

      if (moji === ',' && !inQuote) {
        kekka.push(current);
        current = '';
        i++;
        continue;
      }

      current += moji;
      i++;
    }

    kekka.push(current);
    return kekka.map((item) => item.trim());
  }

  private syokikaHimozuke(): void {
    const normalizedMap = new Map<string, string>();
    this.fileKamokuList.forEach((kamoku) => {
      normalizedMap.set(this.normalizeKamoku(kamoku), kamoku);
    });

    this.himozukeSetteiList = this.torikomiKamokuList.map((kamoku) => {
      const match =
        normalizedMap.get(this.normalizeKamoku(kamoku.key)) ??
        normalizedMap.get(this.normalizeKamoku(kamoku.label)) ??
        '';
      return {
        torikomiKey: kamoku.key,
        torikomiLabel: kamoku.label,
        fileKamoku: match
      };
    });
  }

  private normalizeKamoku(value: string): string {
    return value.toLowerCase().replace(/[ _\-　]/g, '');
  }

  private sakuseiPurebyu(): void {
    const map = new Map(this.himozukeSetteiList.map((item) => [item.torikomiKey, item.fileKamoku]));
    this.purebyuColDefs = this.torikomiKamokuList.map((kamoku) => ({
      headerName: kamoku.label,
      field: kamoku.key,
      cellDataType: kamoku.cellDataType,
      editable: true,
      minWidth: 140,
      flex: 1,
      // 取引形態・内税外税は未選択を含む選択式にする。
      cellEditor:
        kamoku.key === 'torihikiKeitai' || kamoku.key === 'utizeiSotozei'
          ? 'agSelectCellEditor'
          : undefined,
      cellEditorParams:
        kamoku.key === 'torihikiKeitai'
          ? { values: this.torihikiKeitaiSentakuList }
          : kamoku.key === 'utizeiSotozei'
            ? { values: this.utizeiSotozeiSentakuList }
          : undefined,
      // 日付項目は貼り付け入力を正規化して保存する。
      valueParser: this.isHidukeKamoku(kamoku.key)
        ? (params) => this.hidukeValueParser(params)
        : undefined
    }));

    this.purebyuGyoList = this.fileGyoList.map((gyo) => {
      const row: PurebyuGyo = {};
      this.torikomiKamokuList.forEach((kamoku) => {
        const sentaku = map.get(kamoku.key) ?? '';
        row[kamoku.key] = sentaku ? (gyo[sentaku] ?? '') : '';
      });
      return row;
    });
  }

  private isHidukeKamoku(kamokuKey: string): boolean {
    return kamokuKey.toLowerCase().endsWith('date');
  }

  // 8桁数字・スラッシュ・ハイフン・年月日区切りを YYYY-MM-DD に統一する。
  private hidukeValueParser(params: ValueParserParams<PurebyuGyo>): Date | unknown {
    const seikeiZumi = this.seikeiHidukeValue(params.newValue);
    return seikeiZumi == null ? params.oldValue : seikeiZumi;
  }

  private seikeiHidukeValue(value: unknown): Date | null {
    const moto = String(value ?? '').trim();
    if (!moto) {
      return null;
    }

    // YYYYMMDD
    let match = moto.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
      return this.buildHiduke(match[1], match[2], match[3]);
    }

    // YYYY/MM/DD or YYYY-MM-DD
    match = moto.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (match) {
      return this.buildHiduke(match[1], match[2], match[3]);
    }

    // YYYY年M月D日
    match = moto.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (match) {
      return this.buildHiduke(match[1], match[2], match[3]);
    }

    return null;
  }

  private buildHiduke(year: string, month: string, day: string): Date | null {
    const yyyy = Number(year);
    const mm = Number(month);
    const dd = Number(day);
    if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) {
      return null;
    }

    const hiduke = new Date(yyyy, mm - 1, dd);
    if (
      hiduke.getFullYear() !== yyyy ||
      hiduke.getMonth() !== mm - 1 ||
      hiduke.getDate() !== dd
    ) {
      return null;
    }

    return hiduke;
  }
}
