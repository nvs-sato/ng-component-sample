import { Component, Inject, Optional } from '@angular/core';
import { NVS_POPUP_DATA } from '../../shared/nvs-popup/nvs-popup.token';
import { NvsPopupRef } from '../../shared/nvs-popup/nvs-popup-ref';
import { NvsPopupService } from '../../shared/nvs-popup/nvs-popup.service';

interface PopupDemoData {
  popupCd?: string;
  title?: string;
  fukasa?: number;
}

@Component({
  selector: 'app-popup-demo-content',
  template: `
    <div class="demo-popup-body">
      <p>親から受け取ったデータ:</p>
      <pre>{{ data | json }}</pre>
      <label class="form-control w-full">
        <span class="label-text">入力値</span>
        <input class="input input-bordered input-sm w-full" [(ngModel)]="inputMessage" />
      </label>
      <div class="flex gap-2 items-center">
        <button type="button" class="btn btn-outline btn-sm" (click)="openKoPopup($event)">子ポップアップを開く</button>
        <span class="text-xs text-slate-500">※ 親ポップアップを閉じずに重ねて表示</span>
      </div>
      <p class="text-sm text-slate-600">子ポップアップ結果: {{ koPopupKekka }}</p>
    </div>
  `,
  styles: [
    `
      .demo-popup-body {
        display: grid;
        gap: 8px;
      }
      pre {
        margin: 0;
        padding: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }
    `
  ]
})
export class PopupDemoContentComponent {
  inputMessage = '';
  koPopupKekka = '(未実行)';

  constructor(
    @Optional() @Inject(NVS_POPUP_DATA) public readonly data: PopupDemoData | null,
    @Optional() private readonly popupRef: NvsPopupRef<{ message: string }>,
    private readonly popupService: NvsPopupService
  ) {}

  closeBySelf(): void {
    this.popupRef?.close({ message: this.inputMessage });
  }

  openKoPopup(event: MouseEvent): void {
    // 親の背景クリック判定に波及しないよう、クリック伝播を明示的に停止する
    event.stopPropagation();

    // 親子関係を見やすくするため、階層番号をデータで引き継いで表示する
    const fukasa = (this.data?.fukasa ?? 1) + 1;
    const handle = this.popupService.open(PopupDemoContentComponent, {
      title: `子ポップアップ (${fukasa}階層目)`,
      closeOnBackdrop: true,
      showCloseButton: true,
      data: { popupCd: `P-${String(fukasa).padStart(3, '0')}`, title: `子階層${fukasa}`, fukasa },
      componentInputs: { inputMessage: `子ポップアップ(${fukasa})` },
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
      this.koPopupKekka = JSON.stringify(result ?? null);
    });
  }
}
