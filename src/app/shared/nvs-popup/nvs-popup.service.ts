import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NvsPopupOpenRequest, NvsPopupOptions } from './nvs-popup.model';
import { NvsPopupRef } from './nvs-popup-ref';

export interface PopupNaiyo<TComponent = unknown, TResult = unknown> {
  request: NvsPopupOpenRequest<TComponent, TResult>;
  ref: NvsPopupRef<TResult>;
  componentInstance: TComponent | null;
  resolveClosed: (result?: TResult) => void;
  resolveInstance: (instance: TComponent) => void;
}

export interface NvsPopupHandle<TComponent = unknown, TResult = unknown> {
  popupRef: NvsPopupRef<TResult>;
  componentReady: Promise<TComponent>;
  afterClosed: Promise<TResult | undefined>;
}

@Injectable({ providedIn: 'root' })
export class NvsPopupService {
  // 複数ポップアップを上に積むため、配列で状態を管理する
  private readonly naiyoListSubject = new BehaviorSubject<PopupNaiyo<any, any>[]>([]);
  readonly naiyoList$ = this.naiyoListSubject.asObservable();

  open<TComponent, TResult = unknown>(
    component: Type<TComponent>,
    options?: NvsPopupOptions<TComponent, TResult>
  ): NvsPopupHandle<TComponent, TResult> {
    const resolvedOptions: NvsPopupOptions<TComponent, TResult> = {
      title: '',
      showCloseButton: true,
      closeOnBackdrop: true,
      closeOnEsc: true,
      actions: [],
      ...options
    };

    let resolveClosed: (result?: TResult) => void = () => {};
    const afterClosed = new Promise<TResult | undefined>((resolve) => {
      resolveClosed = resolve;
    });

    let resolveInstance: (instance: TComponent) => void = () => {};
    const componentReady = new Promise<TComponent>((resolve) => {
      resolveInstance = resolve;
    });

    const popupRef = new NvsPopupRef<TResult>();
    popupRef.setCloseHandler((result?: TResult) => this.close(result, popupRef));

    const naiyo: PopupNaiyo<TComponent, TResult> = {
      request: { component, options: resolvedOptions },
      ref: popupRef,
      componentInstance: null,
      resolveClosed,
      resolveInstance
    };

    this.naiyoListSubject.next([...this.naiyoListSubject.value, naiyo]);
    return { popupRef, componentReady, afterClosed };
  }

  close<TResult = unknown>(result?: TResult, popupRef?: NvsPopupRef<TResult>): void {
    const currentList = this.naiyoListSubject.value as PopupNaiyo<unknown, TResult>[];
    if (!currentList.length) {
      return;
    }

    const targetIndex = popupRef
      ? currentList.findIndex((naiyo) => naiyo.ref === popupRef)
      : currentList.length - 1;
    if (targetIndex < 0) {
      return;
    }

    const target = currentList[targetIndex];
    target.resolveClosed(result);

    const nextList = currentList.filter((_, index) => index !== targetIndex);
    this.naiyoListSubject.next(nextList);
  }

  setComponentInstance(popupRef: NvsPopupRef<unknown>, instance: unknown): void {
    const currentList = this.naiyoListSubject.value;
    const target = currentList.find((naiyo) => naiyo.ref === popupRef);
    if (!target) {
      return;
    }
    target.componentInstance = instance;
    target.resolveInstance(instance);
  }

  runAction(actionId: string, popupRef?: NvsPopupRef<unknown>): void {
    const currentList = this.naiyoListSubject.value;
    if (!currentList.length) {
      return;
    }

    const target = popupRef
      ? currentList.find((naiyo) => naiyo.ref === popupRef)
      : currentList[currentList.length - 1];
    if (!target) {
      return;
    }

    const options = target.request.options;
    options.onAction?.({
      actionId,
      componentInstance: target.componentInstance,
      close: (result?: unknown) => target.ref.close(result),
      data: options.data
    });
  }
}
