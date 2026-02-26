import { Component } from '@angular/core';
import { TorihikisakiPopupService } from './torihikisaki-popup.service';

@Component({
  selector: 'app-torihikisaki-popup',
  templateUrl: './torihikisaki-popup.component.html',
  styleUrls: ['./torihikisaki-popup.component.scss']
})
export class TorihikisakiPopupComponent {
  // サービスの表示状態をそのままテンプレートへ公開する
  readonly selectedTorihikisaki$ = this.torihikisakiPopupService.selectedTorihikisaki$;

  constructor(private readonly torihikisakiPopupService: TorihikisakiPopupService) {}

  closePopup(): void {
    this.torihikisakiPopupService.close();
  }
}
