import { Component } from '@angular/core';

interface DetailRow {
  rowNo: number;
  kubun: string;
  jyokyo: string;
  syohinCd: string;
  syohinMei: string;
  irisu: number | null;
  setto: number | null;
  caseSu: number | null;
  suryo: number | null;
  tani: string;
  zai: string;
  tanka: number | null;
  gentanka: number | null;
  kingaku: number;
  syohizei: number;
  zeiritsu: number;
  bikou: string;
  syukkaYoteiSoko: string;
  kibouNouki: string;
  syukkaYoteibi: string;
}

@Component({
  selector: 'app-jyucyu-register',
  templateUrl: './jyucyu-register.component.html',
  styleUrls: ['./jyucyu-register.component.scss']
})
export class JyucyuRegisterComponent {
  // 明細グリッド初期表示用。要件どおり5行を先に表示する。
  detailRows: DetailRow[] = Array.from({ length: 5 }, (_, i) => this.createEmptyDetailRow(i + 1));

  // 「明細行を追加」で空行を追記する。
  addDetailRow(): void {
    this.detailRows = [...this.detailRows, this.createEmptyDetailRow(this.detailRows.length + 1)];
  }

  private createEmptyDetailRow(rowNo: number): DetailRow {
    return {
      rowNo,
      kubun: '定',
      jyokyo: '',
      syohinCd: '',
      syohinMei: '',
      irisu: null,
      setto: null,
      caseSu: null,
      suryo: null,
      tani: '個',
      zai: '',
      tanka: null,
      gentanka: null,
      kingaku: 0,
      syohizei: 0,
      zeiritsu: 10,
      bikou: '',
      syukkaYoteiSoko: '本社倉庫',
      kibouNouki: '',
      syukkaYoteibi: ''
    };
  }
}

