import { Component } from '@angular/core';
import { ColDef, IToolPanelParams } from 'ag-grid-community';
import { IToolPanelAngularComp } from 'ag-grid-angular';
import { SalesRow } from '../../sample-data';

@Component({
  selector: 'app-jyucyu-view-tool-panel',
  templateUrl: './jyucyu-view-tool-panel.component.html',
  styleUrls: ['./jyucyu-view-tool-panel.component.scss']
})
export class JyucyuViewToolPanelComponent implements IToolPanelAngularComp {
  private params: IToolPanelParams<SalesRow> | null = null;

  agInit(params: IToolPanelParams<SalesRow>): void {
    this.params = params;
  }

  refresh(params: IToolPanelParams<SalesRow>): boolean {
    this.params = params;
    return true;
  }

  // ビュー初期化として、非表示列をすべて再表示する。
  hyojiColSubete(): void {
    const api = this.params?.api;
    if (!api) {
      return;
    }

    const allCol = api.getColumns() ?? [];
    api.setColumnsVisible(
      allCol.map((col) => col.getColId()),
      true
    );
  }

  // 初期定義の hide 値へ戻して標準ビューを再現する。
  modosiHyojunView(): void {
    const api = this.params?.api;
    if (!api) {
      return;
    }

    const colDefList = (api.getColumnDefs?.() as ColDef<SalesRow>[] | undefined) ?? [];
    const state = colDefList
      .map((colDef) => ({
        colId: colDef.colId ?? colDef.field ?? '',
        hide: !!colDef.hide
      }))
      .filter((item) => !!item.colId);

    api.applyColumnState({ state, applyOrder: false });
  }
}
