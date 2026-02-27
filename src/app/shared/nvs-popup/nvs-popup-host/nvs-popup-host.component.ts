import {
  AfterViewInit,
  Component,
  HostListener,
  Injector,
  OnDestroy,
  QueryList,
  Type,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NvsPopupAction } from '../nvs-popup.model';
import { NvsPopupRef } from '../nvs-popup-ref';
import { NVS_POPUP_DATA } from '../nvs-popup.token';
import { NvsPopupService, PopupNaiyo } from '../nvs-popup.service';

interface PopupHyojiLayer {
  naiyo: PopupNaiyo;
  isHeisaji: boolean;
  isEscHeisa?: boolean;
}

@Component({
  selector: 'app-nvs-popup-host',
  templateUrl: './nvs-popup-host.component.html',
  styleUrls: ['./nvs-popup-host.component.scss']
})
export class NvsPopupHostComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('popupBodyHost', { read: ViewContainerRef })
  private popupBodyHostList!: QueryList<ViewContainerRef>;

  private readonly subscription = new Subscription();
  private popupBodyBuildTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly heisaAnimationMs = 180;
  private readonly heisaTimerMap = new Map<NvsPopupRef<unknown>, ReturnType<typeof setTimeout>>();
  private readonly escHeisaRefSet = new Set<NvsPopupRef<unknown>>();
  private saigoEscHeisaJikoku = 0;

  isOpen = false;
  naiyoList: PopupNaiyo[] = [];
  hyojiLayerList: PopupHyojiLayer[] = [];

  constructor(private readonly popupService: NvsPopupService, private readonly injector: Injector) {}

  ngAfterViewInit(): void {
    this.subscription.add(
      this.popupService.naiyoList$.subscribe((naiyoList) => {
        this.naiyoList = naiyoList;
        this.koshinHyojiLayerList(naiyoList);
        this.isOpen = this.hyojiLayerList.length > 0;
        this.saichikuPopupBodyYoyaku();
      })
    );

    this.subscription.add(
      this.popupBodyHostList.changes.subscribe(() => {
        this.saichikuPopupBody();
      })
    );
  }

  ngOnDestroy(): void {
    if (this.popupBodyBuildTimerId) {
      clearTimeout(this.popupBodyBuildTimerId);
      this.popupBodyBuildTimerId = null;
    }
    this.heisaTimerMap.forEach((timerId) => clearTimeout(timerId));
    this.heisaTimerMap.clear();
    this.escHeisaRefSet.clear();
    this.subscription.unsubscribe();
  }

  getSaijoNaiyo(): PopupNaiyo | null {
    if (!this.naiyoList.length) {
      return null;
    }
    return this.naiyoList[this.naiyoList.length - 1];
  }

  isTopLayer(index: number): boolean {
    return index === this.hyojiLayerList.length - 1;
  }

  getPopupActions(naiyo: PopupNaiyo): NvsPopupAction[] {
    return naiyo.request.options.actions ?? [];
  }

  onClickBackdrop(): void {
    const saijoNaiyo = this.getSaijoNaiyo();
    if (!saijoNaiyo) {
      return;
    }

    if (saijoNaiyo.request.options.closeOnBackdrop === false) {
      return;
    }
    this.popupService.close(undefined, saijoNaiyo.ref);
  }

  onClickClose(popupRef: NvsPopupRef<unknown>): void {
    this.popupService.close(undefined, popupRef);
  }

  onClickAction(actionId: string, popupRef: NvsPopupRef<unknown>): void {
    this.popupService.runAction(actionId, popupRef);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }
    if (event.repeat) {
      return;
    }

    const saijoNaiyo = this.getSaijoNaiyo();
    if (!saijoNaiyo) {
      return;
    }
    if (saijoNaiyo.request.options.closeOnEsc === false) {
      return;
    }

    // Escは最上位ポップアップだけを閉じる
    const ima = Date.now();
    if (ima - this.saigoEscHeisaJikoku < 120) {
      return;
    }
    this.saigoEscHeisaJikoku = ima;
    this.escHeisaRefSet.add(saijoNaiyo.ref);
    this.popupService.close(undefined, saijoNaiyo.ref);
    event.preventDefault();
    event.stopPropagation();
  }

  private saichikuPopupBodyYoyaku(): void {
    // 初回チェック後に差し込むため、1ティック遅延で実行する
    if (this.popupBodyBuildTimerId) {
      clearTimeout(this.popupBodyBuildTimerId);
    }
    this.popupBodyBuildTimerId = setTimeout(() => {
      this.saichikuPopupBody();
      this.popupBodyBuildTimerId = null;
    }, 0);
  }

  private saichikuPopupBody(): void {
    if (!this.popupBodyHostList) {
      return;
    }

    const popupBodyHosts = this.popupBodyHostList.toArray();
    this.hyojiLayerList.forEach((layer, index) => {
      const popupBodyHost = popupBodyHosts[index];
      if (!popupBodyHost) {
        return;
      }

      popupBodyHost.clear();

      const options = layer.naiyo.request.options;
      const childInjector = Injector.create({
        providers: [
          { provide: NvsPopupRef, useValue: layer.naiyo.ref },
          { provide: NVS_POPUP_DATA, useValue: options.data }
        ],
        parent: this.injector
      });

      const componentRef = popupBodyHost.createComponent(layer.naiyo.request.component as Type<unknown>, {
        injector: childInjector
      });

      if (options.componentInputs) {
        Object.entries(options.componentInputs).forEach(([key, value]) => {
          componentRef.setInput(key, value);
        });
      }

      this.popupService.setComponentInstance(layer.naiyo.ref, componentRef.instance);
    });
  }

  // 表示中レイヤーを更新し、閉じたポップアップはアニメーション完了後に削除する
  private koshinHyojiLayerList(naiyoList: PopupNaiyo[]): void {
    const genzaiMap = new Map(this.hyojiLayerList.map((layer) => [layer.naiyo.ref, layer] as const));
    const nextRefSet = new Set(naiyoList.map((naiyo) => naiyo.ref));

    const nextLayerList: PopupHyojiLayer[] = naiyoList.map((naiyo) => {
      const genzaiLayer = genzaiMap.get(naiyo.ref);
      if (genzaiLayer) {
        if (this.heisaTimerMap.has(naiyo.ref)) {
          clearTimeout(this.heisaTimerMap.get(naiyo.ref)!);
          this.heisaTimerMap.delete(naiyo.ref);
        }
        return { naiyo, isHeisaji: false };
      }
      return { naiyo, isHeisaji: false };
    });

    this.hyojiLayerList.forEach((layer) => {
      if (nextRefSet.has(layer.naiyo.ref)) {
        return;
      }

      const isEscHeisa = this.escHeisaRefSet.has(layer.naiyo.ref);
      nextLayerList.push({ ...layer, isHeisaji: true, isEscHeisa });
      if (this.heisaTimerMap.has(layer.naiyo.ref)) {
        return;
      }

      const timerId = setTimeout(() => {
        this.heisaTimerMap.delete(layer.naiyo.ref);
        this.escHeisaRefSet.delete(layer.naiyo.ref);
        this.hyojiLayerList = this.hyojiLayerList.filter((item) => item.naiyo.ref !== layer.naiyo.ref);
        this.isOpen = this.hyojiLayerList.length > 0;
        this.saichikuPopupBodyYoyaku();
      }, this.heisaAnimationMs);
      this.heisaTimerMap.set(layer.naiyo.ref, timerId);
    });

    this.hyojiLayerList = nextLayerList;
  }
}
