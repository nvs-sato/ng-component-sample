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

interface ShohinModel {
  cd: string;
  mei: string;
  yomi?: string;
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
  multiAutoControl = new FormControl<string[]>([]);
  readonly shohinKouhoList: ShohinModel[] = [
    { cd: 'SH-001', mei: 'ボールペン 0.5mm', yomi: 'ぼーるぺん' },
    { cd: 'SH-002', mei: 'ボールペン 0.7mm', yomi: 'ぼーるぺん' },
    { cd: 'SH-003', mei: 'シャープペン 0.5mm', yomi: 'しゃーぷぺん' },
    { cd: 'SH-004', mei: '消しゴム', yomi: 'けしごむ' },
    { cd: 'SH-005', mei: 'ノート B5', yomi: 'のーと' },
    { cd: 'SH-006', mei: 'ノート A4', yomi: 'のーと' },
    { cd: 'SH-007', mei: 'ふせん 75x75', yomi: 'ふせん' },
    { cd: 'SH-008', mei: 'クリアファイル', yomi: 'くりあふぁいる' }
  ];

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

  onMultiAutoValueChanged(value: unknown[]): void {
    // selectedValuePath=cd のため、イベント値は商品コード配列となる。
    const cdList = value.map((item) => String(item)).join(', ');
    this.saishinEvent = `valueChanged: ${value.length}件 [${cdList}]`;
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

  get multiAutoControlHyojiText(): string {
    const value = this.multiAutoControl.value ?? [];
    if (value.length === 0) {
      return '(未選択)';
    }
    return value.join(' / ');
  }

  openDemoPopup(): void {
    // ポップアップ内からさらにポップアップを開く検証用に、階層データを初期化する
    const handle = this.popupService.open(PopupDemoContentComponent, {
      title: 'ポップアップサンプル',
      closeOnBackdrop: true,
      showCloseButton: true,
      data: { popupCd: 'P-001', title: '初期データ', fukasa: 1 },
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
