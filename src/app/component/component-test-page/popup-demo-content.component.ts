import { Component, Inject, Optional } from '@angular/core';
import { NVS_POPUP_DATA } from '../../shared/nvs-popup/nvs-popup.token';
import { NvsPopupRef } from '../../shared/nvs-popup/nvs-popup-ref';

@Component({
  selector: 'app-popup-demo-content',
  template: `
    <div class="demo-popup-body">
      <p>呼び出し元から受け取った初期値:</p>
      <pre>{{ data | json }}</pre>
      <label class="form-control w-full">
        <span class="label-text">入力値</span>
        <input class="input input-bordered input-sm w-full" [(ngModel)]="inputMessage" />
      </label>
      <p class="text-sm text-slate-600">このコンポーネントは動的に表示されています。</p>
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

  constructor(
    @Optional() @Inject(NVS_POPUP_DATA) public readonly data: unknown,
    @Optional() private readonly popupRef: NvsPopupRef<{ message: string }>
  ) {}

  closeBySelf(): void {
    this.popupRef?.close({ message: this.inputMessage });
  }
}
