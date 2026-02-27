import { Component } from '@angular/core';
import { ColDef, ColGroupDef, GridApi, GridReadyEvent, ModelUpdatedEvent } from 'ag-grid-community';
import { AG_GRID_LOCALE_JA_JP } from '../../ag-grid-locale-ja';

type TorihikiKbn = '共通' | '得意先' | '仕入先' | '得意先/仕入先';
type TorihikiKeitai = '現金' | '掛売' | '掛仕入' | '相殺';

type TorihikisakiRow = {
  torihikisakiCd: string;
  torihikisakiMei: string;
  invoiceTourokuBangou: string;
  tag: string;
  tokuisakiSeikyuCd: string;
  tokuisakiTantosyaMei: string;
  tokuisakiTorihikiKeitai: TorihikiKeitai;
  siiresakiSiharaiCd: string;
  siiresakiTantosyaMei: string;
  siiresakiTorihikiKeitai: TorihikiKeitai;
  torihikiKbn: TorihikiKbn;
};

@Component({
  selector: 'app-torihikisaki-master',
  templateUrl: './torihikisaki-master.component.html',
  styleUrls: ['./torihikisaki-master.component.scss']
})
export class TorihikisakiMasterComponent {
  // 検索欄に入力されたキーワードを保持する。
  kensakuKeyword = '';
  hyojiKensu = 0;

  private gridApi: GridApi<TorihikisakiRow> | null = null;

  // 画面仕様に合わせて、共通/得意先/仕入先で列グループを分ける。
  readonly columnDefs: Array<ColDef<TorihikisakiRow> | ColGroupDef<TorihikisakiRow>> = [
    {
      headerName: '',
      children: [
        { headerName: '取引先コード', field: 'torihikisakiCd', minWidth: 140 },
        { headerName: '取引先名', field: 'torihikisakiMei', minWidth: 220 },
        { headerName: '区分', field: 'torihikiKbn', minWidth: 120 },
        { headerName: 'インボイス登録番号', field: 'invoiceTourokuBangou', minWidth: 190 },
        { headerName: 'タグ', field: 'tag', minWidth: 150 }
      ]
    },
    {
      headerName: '得意先',
      children: [
        { columnGroupShow: undefined, headerName: '請求先コード', field: 'tokuisakiSeikyuCd', minWidth: 150 },
        { columnGroupShow: 'open', headerName: '得意先担当者名', field: 'tokuisakiTantosyaMei', minWidth: 170 },
        { columnGroupShow: 'open', headerName: '取引形態', field: 'tokuisakiTorihikiKeitai', minWidth: 130 }
      ]
    },
    {
      headerName: '仕入先',
      children: [
        { columnGroupShow: undefined,headerName: '支払先コード', field: 'siiresakiSiharaiCd', minWidth: 150 },
        { columnGroupShow: 'open',headerName: '仕入先担当者', field: 'siiresakiTantosyaMei', minWidth: 170 },
        { columnGroupShow: 'open',headerName: '取引形態', field: 'siiresakiTorihikiKeitai', minWidth: 130 }
      ]
    }
  ];

  readonly defaultColDef: ColDef<TorihikisakiRow> = {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true
  };

  readonly localeText: Record<string, string> = AG_GRID_LOCALE_JA_JP;

  // 一覧確認用のサンプルデータを固定で10件用意する。
  readonly torihikisakiList: TorihikisakiRow[] = [
    this.createRow('TRK-0001', '青葉商事株式会社', 'T1010000000001', '重点,関東', 'SKY-0001', '佐藤 花子', '掛売', 'SIR-0001', '高橋 健一', '掛仕入', '得意先/仕入先'),
    this.createRow('TRK-0002', 'みなと物産', 'T1010000000002', '新規', 'SKY-0002', '鈴木 一郎', '現金', 'SIR-0002', '松田 彩', '現金', '共通'),
    this.createRow('TRK-0003', '東都電材', 'T1010000000003', '電材', 'SKY-0003', '井上 直樹', '掛売', 'SIR-0003', '中村 優子', '掛仕入', '得意先'),
    this.createRow('TRK-0004', '桜井機工', 'T1010000000004', '設備', 'SKY-0004', '加藤 翼', '掛売', 'SIR-0004', '石川 望', '相殺', '得意先/仕入先'),
    this.createRow('TRK-0005', '北星パーツ', 'T1010000000005', '北海道', 'SKY-0005', '阿部 光', '現金', 'SIR-0005', '林 美穂', '掛仕入', '仕入先'),
    this.createRow('TRK-0006', '関西オフィス販売', 'T1010000000006', '文具', 'SKY-0006', '木村 誠', '掛売', 'SIR-0006', '小川 里奈', '掛仕入', '得意先'),
    this.createRow('TRK-0007', '日東フーズ', 'T1010000000007', '食品', 'SKY-0007', '山口 真理', '現金', 'SIR-0007', '前田 拓也', '現金', '共通'),
    this.createRow('TRK-0008', '中央物流サービス', 'T1010000000008', '物流', 'SKY-0008', '岡田 翔', '掛売', 'SIR-0008', '西村 愛', '掛仕入', '仕入先'),
    this.createRow('TRK-0009', '南海メディカル', 'T1010000000009', '医療', 'SKY-0009', '森本 葵', '掛売', 'SIR-0009', '藤田 誠司', '相殺', '得意先/仕入先'),
    this.createRow('TRK-0010', '城南テクノ', 'T1010000000010', '保守', 'SKY-0010', '清水 遥', '現金', 'SIR-0010', '遠藤 大輔', '掛仕入', '得意先')
  ];

  onGridReady(event: GridReadyEvent<TorihikisakiRow>): void {
    this.gridApi = event.api;
    this.hyojiKensu = this.torihikisakiList.length;
    this.applyKeywordFilter();
  }

  // フィルタ結果件数をヘッダーへ反映し、検索後の見え方を分かりやすくする。
  onModelUpdated(event: ModelUpdatedEvent<TorihikisakiRow>): void {
    this.hyojiKensu = event.api.getDisplayedRowCount();
  }

  // 検索ボタン押下時に ag-Grid のクイックフィルタへキーワードを反映する。
  onKensaku(): void {
    this.applyKeywordFilter();
  }

  private applyKeywordFilter(): void {
    if (!this.gridApi) {
      return;
    }

    this.gridApi.setQuickFilter(this.kensakuKeyword.trim());
  }

  private createRow(
    torihikisakiCd: string,
    torihikisakiMei: string,
    invoiceTourokuBangou: string,
    tag: string,
    tokuisakiSeikyuCd: string,
    tokuisakiTantosyaMei: string,
    tokuisakiTorihikiKeitai: TorihikiKeitai,
    siiresakiSiharaiCd: string,
    siiresakiTantosyaMei: string,
    siiresakiTorihikiKeitai: TorihikiKeitai,
    torihikiKbn: TorihikiKbn
  ): TorihikisakiRow {
    return {
      torihikisakiCd,
      torihikisakiMei,
      invoiceTourokuBangou,
      tag,
      tokuisakiSeikyuCd,
      tokuisakiTantosyaMei,
      tokuisakiTorihikiKeitai,
      siiresakiSiharaiCd,
      siiresakiTantosyaMei,
      siiresakiTorihikiKeitai,
      torihikiKbn
    };
  }
}
