import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SalesRow } from '../../sample-data';
import { TorihikisakiPopupService } from '../torihikisaki-popup/torihikisaki-popup.service';

@Component({
  selector: 'app-torihikisaki-link-cell-renderer',
  template: `
    <button type="button" class="torihikisaki-link" (click)="openPopup($event)">
      {{ value }}
    </button>
  `,
  styleUrls: ['./torihikisaki-link-cell-renderer.component.scss']
})
export class TorihikisakiLinkCellRendererComponent implements ICellRendererAngularComp {
  value = '';
  private params: ICellRendererParams<SalesRow, string> | null = null;

  constructor(private readonly torihikisakiPopupService: TorihikisakiPopupService) {}

  // セル描画時に値と行データを保持する
  agInit(params: ICellRendererParams<SalesRow, string>): void {
    this.params = params;
    this.value = params.value ?? '';
  }

  refresh(params: ICellRendererParams<SalesRow, string>): boolean {
    this.agInit(params);
    return true;
  }

  // セル内クリック時は、ポップアップ表示処理を専用サービスへ委譲する
  openPopup(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.params?.data?.torihikisaki) {
      return;
    }

    this.torihikisakiPopupService.open(this.params.data.torihikisaki);
  }
}
