import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Torihikisaki } from '../../sample-data';

@Injectable({ providedIn: 'root' })
export class TorihikisakiPopupService {
  // 取引先ポップアップの表示対象を保持する
  private readonly selectedTorihikisakiSubject = new BehaviorSubject<Torihikisaki | null>(null);
  readonly selectedTorihikisaki$ = this.selectedTorihikisakiSubject.asObservable();

  open(torihikisaki: Torihikisaki): void {
    this.selectedTorihikisakiSubject.next(torihikisaki);
  }

  close(): void {
    this.selectedTorihikisakiSubject.next(null);
  }
}
