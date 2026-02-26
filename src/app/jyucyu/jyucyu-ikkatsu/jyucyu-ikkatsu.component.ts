import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { AG_GRID_LOCALE_JA_JP } from '../../ag-grid-locale-ja';

interface TorikomiKamoku {
  key: string;
  label: string;
}

interface HimozukeSettei {
  torikomiKey: string;
  torikomiLabel: string;
  fairuKamoku: string;
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
  fairuMei = '';
  fairuKamokuList: string[] = [];
  fairuGyoList: FairuGyo[] = [];
  himozukeSetteiList: HimozukeSettei[] = [];
  purebyuGyoList: PurebyuGyo[] = [];
  purebyuColDefs: ColDef<PurebyuGyo>[] = [];
  readonly localeText: Record<string, string> = AG_GRID_LOCALE_JA_JP;

  readonly sampleFairuMei = 'jyucyu_ikkatsu_sample.csv';
  // 埋め込みサンプルはヘッダー + 10行データで用意する。
  readonly sampleCsvText = [
    'jyucyuDate,jyucyuNo,torihikisakiCd,torihikisakiMei,shipToCode,shipToName,summary,jyucyuKingakuGokei,ararieki,arariekiRitsu,jyucyuJyokyo,torihikiKeitai,utizeiSotozei,lineNo,detailType,shohin,quantity,unitPrice,amount,remarks',
    '2026-02-26,J-2026-901,CUST-0901,Yamada Shouji,SHIP-0901,Yamada Tokyo DC,Shinki Anken,88000,17600,20.0,受注,掛売上,外税,J-2026-901-01,通常,Sensor,8,11000,88000,AM Nouhin',
    '2026-02-26,J-2026-902,CUST-0902,Tanaka Kougyo,SHIP-0902,Tanaka Kansai Soko,Teiki Hojyu,56000,11200,20.0,受注,都度請求,内税,J-2026-902-01,通常,Module,4,14000,56000,Isogi',
    '2026-02-25,J-2026-903,CUST-0903,Suzuki Foods,SHIP-0903,Suzuki Chubu Center,Hojyu,120000,22800,19.0,一部出荷,掛売上,外税,J-2026-903-01,通常,Valve,12,10000,120000,Bin1',
    '2026-02-25,J-2026-904,CUST-0904,Kato Logi,SHIP-0904,Kato West Hub,Shinki,45000,9000,20.0,受注,現金売上,外税,J-2026-904-01,通常,Cable,30,1500,45000,PM',
    '2026-02-24,J-2026-905,CUST-0905,Sato Denki,SHIP-0905,Sato Main Soko,Tokubetu,77000,13860,18.0,出荷完了,掛売上,内税,J-2026-905-01,通常,PowerUnit,7,11000,77000,LotA',
    '2026-02-24,J-2026-906,CUST-0906,Takahashi Kenzai,SHIP-0906,Takahashi East Soko,Saityumon,98000,19600,20.0,受注,都度請求,外税,J-2026-906-01,通常,Panel,14,7000,98000,Check',
    '2026-02-23,J-2026-907,CUST-0907,Nakamura Seimitsu,SHIP-0907,Nakamura Plant,Antei,63000,12600,20.0,一部出荷,掛売上,内税,J-2026-907-01,通常,Gear,9,7000,63000,Line2',
    '2026-02-23,J-2026-908,CUST-0908,Kobayashi Medical,SHIP-0908,Kobayashi Med Ctr,Iryo,150000,27000,18.0,受注,掛売上,外税,J-2026-908-01,通常,Filter,50,3000,150000,Cold',
    '2026-02-22,J-2026-909,CUST-0909,Watanabe Trading,SHIP-0909,Watanabe Port,Gaityo,39000,7800,20.0,キャンセル,都度請求,外税,J-2026-909-01,通常,Bracket,13,3000,39000,Cancel',
    '2026-02-22,J-2026-910,CUST-0910,Ito Kagaku,SHIP-0910,Ito RnD Soko,Kenkyu,112000,22400,20.0,受注,現金売上,内税,J-2026-910-01,通常,ChemPack,16,7000,112000,Sample'
  ].join('\n');
  readonly sampleHyoiLineList = this.sampleCsvText.split('\n');

  readonly torikomiKamokuList: TorikomiKamoku[] = [
    { key: 'jyucyuDate', label: '受注日' },
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
    const fairu = input.files?.[0];
    if (!fairu) {
      return;
    }

    this.yomikomiFairu(fairu).finally(() => {
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

    const fairu = event.dataTransfer?.files?.[0];
    if (!fairu) {
      return;
    }

    void this.yomikomiFairu(fairu);
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
    return this.fairuKamokuList.length > 0 && this.fairuGyoList.length > 0;
  }

  canGoStep3(): boolean {
    return this.himozukeSetteiList.some((item) => item.fairuKamoku);
  }

  canGoStep4(): boolean {
    return this.purebyuGyoList.length > 0;
  }

  // ステップ2表示用に、選択列の先頭5行のみを返す。
  getSyoTo5GyoValueList(fairuKamoku: string): string[] {
    if (!fairuKamoku) {
      return [];
    }

    return this.fairuGyoList
      .slice(0, 5)
      .map((gyo, idx) => gyo[fairuKamoku] || `(空) [${idx + 1}行目]`);
  }

  startTorikomi(): void {
    window.alert(`取り込み開始: ${this.purebyuGyoList.length}件`);
  }

  private async yomikomiFairu(fairu: File): Promise<void> {
    this.eraaMessage = '';
    this.fairuMei = fairu.name;

    try {
      const kakutyoshi = fairu.name.split('.').pop()?.toLowerCase() ?? '';
      if (kakutyoshi === 'csv') {
        const csvText = await fairu.text();
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

  private yomikomiNaibuCsv(csvText: string, fairuMei: string): void {
    this.eraaMessage = '';
    this.fairuMei = fairuMei;

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

    this.fairuKamokuList = hedder;
    this.fairuGyoList = seikeiGyoList;
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
    this.fairuKamokuList.forEach((kamoku) => {
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
        fairuKamoku: match
      };
    });
  }

  private normalizeKamoku(value: string): string {
    return value.toLowerCase().replace(/[ _\-　]/g, '');
  }

  private sakuseiPurebyu(): void {
    const map = new Map(this.himozukeSetteiList.map((item) => [item.torikomiKey, item.fairuKamoku]));
    this.purebyuColDefs = this.torikomiKamokuList.map((kamoku) => ({
      headerName: kamoku.label,
      field: kamoku.key,
      editable: true,
      minWidth: 140,
      flex: 1
    }));

    this.purebyuGyoList = this.fairuGyoList.map((gyo) => {
      const row: PurebyuGyo = {};
      this.torikomiKamokuList.forEach((kamoku) => {
        const sentaku = map.get(kamoku.key) ?? '';
        row[kamoku.key] = sentaku ? (gyo[sentaku] ?? '') : '';
      });
      return row;
    });
  }
}
