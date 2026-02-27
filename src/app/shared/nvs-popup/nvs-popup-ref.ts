export class NvsPopupRef<TResult = unknown> {
  private closeHandler: ((result?: TResult) => void) | null = null;

  setCloseHandler(handler: (result?: TResult) => void): void {
    this.closeHandler = handler;
  }

  close(result?: TResult): void {
    this.closeHandler?.(result);
  }
}
