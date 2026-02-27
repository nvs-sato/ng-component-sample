import { Type } from '@angular/core';

export interface NvsPopupAction {
  id: string;
  label: string;
  className?: string;
}

export interface NvsPopupOptions<TComponent = unknown, TResult = unknown> {
  title?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  data?: unknown;
  componentInputs?: Partial<TComponent>;
  actions?: NvsPopupAction[];
  onAction?: (ctx: {
    actionId: string;
    componentInstance: TComponent | null;
    close: (result?: TResult) => void;
    data?: unknown;
  }) => void;
}

export interface NvsPopupOpenRequest<TComponent = unknown, TResult = unknown> {
  component: Type<TComponent>;
  options: NvsPopupOptions<TComponent, TResult>;
}
