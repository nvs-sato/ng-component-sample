import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

interface KomponentoMenuItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-component-test-page',
  templateUrl: './component-test-page.component.html',
  styleUrls: ['./component-test-page.component.scss']
})
export class ComponentTestPageComponent implements OnInit, OnDestroy {
  private readonly subscription = new Subscription();

  hyojiTitle = '';

  // サブメニューと同じ定義を持ち、URLパラメータから表示名を引く。
  readonly menuItemList: KomponentoMenuItem[] = [
    { path: 'date-input', label: '日付入力' },
    { path: 'year-month-input', label: '年月入力' },
    { path: 'date-range', label: '日付範囲' },
    { path: 'year-month-range', label: '年月範囲' },
    { path: 'list-box', label: 'リストボックス' },
    { path: 'tab-panel', label: 'タブパネル' },
    { path: 'auto-complete', label: 'オートコンプリート' },
    { path: 'multi-auto-complete', label: 'マルチセレクトオートコンプリート' },
    { path: 'popup', label: 'ポップアップ' }
  ];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscription.add(
      this.route.paramMap.subscribe((params) => {
        const shubetu = params.get('shubetu') ?? '';
        this.hyojiTitle = this.menuItemList.find((item) => item.path === shubetu)?.label ?? 'コンポーネント';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
