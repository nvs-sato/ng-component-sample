import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NvsPopupService } from '../../shared/nvs-popup/nvs-popup.service';
import { PopupDemoContentComponent } from './popup-demo-content.component';

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
  shubetu = '';
  saishinEvent = '';
  popupResult = '';
  dateControl = new FormControl<Date | null>(new Date(2026, 1, 26));
  yearMonthControl = new FormControl<Date | null>(new Date(2026, 1, 1));

  readonly menuItemList: KomponentoMenuItem[] = [
    { path: 'date-input', label: '日付入力' },
    { path: 'year-month-input', label: '年月入力' },
    { path: 'date-range', label: '日付範囲' },
    { path: 'year-month-range', label: '年月範囲' },
    { path: 'list-box', label: 'リストボックス' },
    { path: 'tab-panel', label: 'タブパネル' },
    { path: 'auto-complete', label: 'オートコンプリート' },
    { path: 'multi-auto-complete', label: 'マルチセレクトオートコンプリート' },
    { path: 'mask', label: 'マスク' },
    { path: 'popup', label: 'ポップアップ' }
  ];

  constructor(private readonly route: ActivatedRoute, private readonly popupService: NvsPopupService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.route.paramMap.subscribe((params) => {
        this.shubetu = params.get('shubetu') ?? '';
        this.hyojiTitle = this.menuItemList.find((item) => item.path === this.shubetu)?.label ?? 'コンポーネント';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onInitialized(): void {
    this.saishinEvent = 'initialized';
  }

  onValueChanged(value: Date | null): void {
    this.saishinEvent = `valueChanged: ${value ? value.toISOString().slice(0, 10) : 'null'}`;
  }

  onGotFocus(): void {
    this.saishinEvent = 'gotFocus';
  }

  onLostFocus(): void {
    this.saishinEvent = 'lostFocus';
  }

  get formControlHyojiText(): string {
    const value = this.dateControl.value;
    if (!value) {
      return 'null';
    }
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }

  get yearMonthControlHyojiText(): string {
    const value = this.yearMonthControl.value;
    if (!value) {
      return 'null';
    }
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }

  openDemoPopup(): void {
    const handle = this.popupService.open(PopupDemoContentComponent, {
      title: 'ポップアップサンプル',
      closeOnBackdrop: true,
      showCloseButton: true,
      data: { popupCd: 'P-001', title: '初期データ' },
      componentInputs: { inputMessage: '初期メッセージ' },
      actions: [
        { id: 'cancel', label: '閉じる', className: 'btn-outline' },
        { id: 'ok', label: 'OK', className: 'btn-primary' }
      ],
      onAction: ({ actionId, componentInstance, close }) => {
        if (actionId === 'cancel') {
          close();
          return;
        }
        if (actionId === 'ok') {
          const message = (componentInstance as PopupDemoContentComponent | null)?.inputMessage ?? '';
          close({ message });
        }
      }
    });

    handle.afterClosed.then((result) => {
      this.popupResult = JSON.stringify(result ?? null);
    });
  }
}
