import { Component } from '@angular/core';
import { IToolPanelAngularComp } from 'ag-grid-angular';
import { ColDef, ColumnState, IToolPanelParams } from 'ag-grid-community';
import { SalesRow } from '../../sample-data';

interface ViewHozonItem {
  id: string;
  mei: string;
  colStateList: ColumnState[];
  hozonDateTime: string;
}

type HyojiThemeId = 'compact' | 'modern' | 'classic-like';

interface JyucyuViewToolPanelParams extends IToolPanelParams<SalesRow> {
  getHyojiThemeId?: () => HyojiThemeId;
  onChangeHyojiTheme?: (themeId: HyojiThemeId) => void;
  hozonKey?: string;
}

@Component({
  selector: 'app-jyucyu-view-tool-panel',
  templateUrl: './jyucyu-view-tool-panel.component.html',
  styleUrls: ['./jyucyu-view-tool-panel.component.scss']
})
export class JyucyuViewToolPanelComponent implements IToolPanelAngularComp {
  private static readonly DEFAULT_HOZON_KEY = 'jyucyuListViewHozonV1';

  private params: JyucyuViewToolPanelParams | null = null;
  // 画面ごとにビュー保存先を分離できるよう、キーはパラメータから受け取る。
  private hozonKey = JyucyuViewToolPanelComponent.DEFAULT_HOZON_KEY;

  viewMeiNyuryoku = '';
  viewHozonList: ViewHozonItem[] = [];
  sentakuViewId = 'default';
  hensyuViewId = '';
  hensyuMeiNyuryoku = '';
  hyojiThemeId: HyojiThemeId = 'compact';
  readonly hyojiThemeList: Array<{ id: HyojiThemeId; mei: string }> = [
    { id: 'compact', mei: 'コンパクト（デフォルト）' },
    { id: 'modern', mei: 'モダン' },
    { id: 'classic-like', mei: 'クラシックライク' }
  ];

  agInit(params: IToolPanelParams<SalesRow>): void {
    this.params = params as JyucyuViewToolPanelParams;
    this.hozonKey = this.params.hozonKey ?? JyucyuViewToolPanelComponent.DEFAULT_HOZON_KEY;
    this.loadViewHozon();
    this.hyojiThemeId = this.params.getHyojiThemeId?.() ?? 'compact';
  }

  refresh(params: IToolPanelParams<SalesRow>): boolean {
    this.params = params as JyucyuViewToolPanelParams;
    this.hozonKey = this.params.hozonKey ?? JyucyuViewToolPanelComponent.DEFAULT_HOZON_KEY;
    this.loadViewHozon();
    this.hyojiThemeId = this.params.getHyojiThemeId?.() ?? 'compact';
    return true;
  }

  // サイドパネルで選択した表示テーマを親グリッドへ通知する。
  sentakuHyojiTheme(themeId: HyojiThemeId): void {
    this.hyojiThemeId = themeId;
    this.params?.onChangeHyojiTheme?.(themeId);
  }

  // 現在の列状態を名前付きビューとして保存する。
  hozonGenzaiView(): void {
    const api = this.params?.api;
    const mei = this.viewMeiNyuryoku.trim();
    if (!api || !mei) {
      return;
    }

    const colStateList = api.getColumnState();
    const item: ViewHozonItem = {
      id: `view_${Date.now()}`,
      mei,
      colStateList,
      hozonDateTime: new Date().toISOString()
    };

    this.viewHozonList = [item, ...this.viewHozonList];
    this.viewMeiNyuryoku = '';
    this.saveViewHozon();
    this.sentakuViewId = item.id;
  }

  // 標準ビューまたは保存ビューをグリッドへ反映する。
  tekiyoView(viewId: string): void {
    if (viewId === 'default') {
      this.modosiHyojunView();
      this.sentakuViewId = 'default';
      return;
    }

    const api = this.params?.api;
    const item = this.viewHozonList.find((v) => v.id === viewId);
    if (!api || !item) {
      return;
    }

    api.applyColumnState({
      state: item.colStateList,
      applyOrder: true
    });

    this.sentakuViewId = item.id;
  }

  // 名称編集モードを開始する。
  kaisiHensyu(item: ViewHozonItem, event: Event): void {
    event.stopPropagation();
    this.hensyuViewId = item.id;
    this.hensyuMeiNyuryoku = item.mei;
  }

  // 編集中の名称を保存する。
  hozonHensyu(event: Event): void {
    event.stopPropagation();
    const mei = this.hensyuMeiNyuryoku.trim();
    if (!this.hensyuViewId || !mei) {
      return;
    }

    this.viewHozonList = this.viewHozonList.map((item) =>
      item.id === this.hensyuViewId
        ? {
            ...item,
            mei
          }
        : item
    );

    this.hensyuViewId = '';
    this.hensyuMeiNyuryoku = '';
    this.saveViewHozon();
  }

  torikesiHensyu(event: Event): void {
    event.stopPropagation();
    this.hensyuViewId = '';
    this.hensyuMeiNyuryoku = '';
  }

  // 保存ビューを削除する。
  sakujoView(viewId: string, event: Event): void {
    event.stopPropagation();

    this.viewHozonList = this.viewHozonList.filter((item) => item.id !== viewId);
    if (this.sentakuViewId === viewId) {
      this.sentakuViewId = 'default';
    }

    if (this.hensyuViewId === viewId) {
      this.hensyuViewId = '';
      this.hensyuMeiNyuryoku = '';
    }

    this.saveViewHozon();
  }

  // 初期定義の hide 値へ戻して標準ビューを再現する。
  private modosiHyojunView(): void {
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

  private loadViewHozon(): void {
    try {
      const raw = localStorage.getItem(this.hozonKey);
      if (!raw) {
        this.viewHozonList = [];
        return;
      }

      const parsed = JSON.parse(raw) as ViewHozonItem[];
      this.viewHozonList = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.viewHozonList = [];
    }
  }

  private saveViewHozon(): void {
    localStorage.setItem(
      this.hozonKey,
      JSON.stringify(this.viewHozonList)
    );
  }
}
