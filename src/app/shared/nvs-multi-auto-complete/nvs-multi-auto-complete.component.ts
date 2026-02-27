import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'nvs-multi-auto-complete',
  templateUrl: './nvs-multi-auto-complete.component.html',
  styleUrls: ['./nvs-multi-auto-complete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NvsMultiAutoCompleteComponent),
      multi: true
    }
  ]
})
export class NvsMultiAutoCompleteComponent implements ControlValueAccessor, AfterViewInit {
  @Input() isDisabled = false;
  @Input() isReadOnly = false;
  @Input() placeholder = '候補を検索';
  @Input() kouhoList: unknown[] = [];
  // 未設定時はkouhoListを使い、設定時は入力文字列を引数に都度サーバー取得する。
  @Input() itemSourceFunction?: (nyuryokuText: string) => Promise<unknown[]>;
  @Input() maxSentakuCount: number | null = null;
  @Input() displayMemberPath = '';
  @Input() searchMemberPath: string | string[] = [];
  @Input() selectedValuePath = '';
  @Input() displayTextFn?: (model: unknown) => string;

  @Output() initialized = new EventEmitter<void>();
  @Output() valueChanged = new EventEmitter<unknown[]>();
  @Output() gotFocus = new EventEmitter<void>();
  @Output() lostFocus = new EventEmitter<void>();

  @ViewChild('nyuryokuRef') nyuryokuRef?: ElementRef<HTMLInputElement>;

  nyuryokuText = '';
  panelOpen = false;
  activeIndex = 0;
  hyojiKouhoList: unknown[] = [];

  private sentakuZumiModelList: unknown[] = [];
  private saishinKouhoPool: unknown[] = [];
  private kensakuSeq = 0;
  private propagateChange: (value: unknown[]) => void = () => {};
  private propagateTouched: () => void = () => {};

  constructor(private readonly hostRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.initialized.emit();
  }

  writeValue(value: unknown): void {
    // FormControl値はselectedValuePathに従って候補モデルへ逆引きする。
    const valueList = Array.isArray(value) ? value : [];
    this.sentakuZumiModelList = this.resolveSentakuModelList(valueList);
    void this.refreshKouhoList();
  }

  registerOnChange(fn: (value: unknown[]) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.panelOpen = false;
    }
  }

  get hasSentakuMax(): boolean {
    return this.maxSentakuCount != null && this.sentakuZumiModelList.length >= this.maxSentakuCount;
  }

  get sentakuSumiList(): unknown[] {
    return this.sentakuZumiModelList;
  }

  async onInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.nyuryokuText = input.value;
    await this.refreshKouhoList();
    this.panelOpen = this.hyojiKouhoList.length > 0 && !this.hasSentakuMax;
  }

  async onFocus(): Promise<void> {
    this.gotFocus.emit();
    await this.refreshKouhoList();
    this.panelOpen = this.hyojiKouhoList.length > 0 && !!this.nyuryokuText.trim() && !this.hasSentakuMax;
  }

  onBlur(): void {
    this.propagateTouched();
    this.lostFocus.emit();
  }

  async onKeyDown(event: KeyboardEvent): Promise<void> {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    if (event.key === 'Backspace' && this.nyuryokuText.length === 0 && this.sentakuZumiModelList.length > 0) {
      event.preventDefault();
      const saigo = this.sentakuZumiModelList[this.sentakuZumiModelList.length - 1];
      await this.removeSentaku(saigo);
      return;
    }

    if (event.key === 'Escape') {
      this.panelOpen = false;
      return;
    }

    if (!this.panelOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      await this.refreshKouhoList();
      this.panelOpen = this.hyojiKouhoList.length > 0 && !this.hasSentakuMax;
      return;
    }

    if (!this.panelOpen || this.hyojiKouhoList.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.hyojiKouhoList.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.hyojiKouhoList.length) % this.hyojiKouhoList.length;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      await this.selectKouho(this.hyojiKouhoList[this.activeIndex]);
    }
  }

  async onMouseDownKouho(event: MouseEvent, kouho: unknown): Promise<void> {
    // input blurより先に候補選択を確定するため、mousedownで処理する。
    event.preventDefault();
    await this.selectKouho(kouho);
  }

  onClickField(): void {
    this.focusNyuryoku();
  }

  async removeSentaku(model: unknown): Promise<void> {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }
    const targetKey = this.toKey(this.getSelectedValue(model));
    this.sentakuZumiModelList = this.sentakuZumiModelList.filter(
      (item) => this.toKey(this.getSelectedValue(item)) !== targetKey
    );
    this.notifyValueChanged();
    await this.refreshKouhoList();
    this.focusNyuryoku();
  }

  // trackByは呼び出し元thisがDifferになるため、アロー関数でthisをコンポーネントへ束縛する。
  trackBySentaku = (_index: number, item: unknown): string => this.toKey(this.getSelectedValue(item));

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.panelOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.panelOpen = false;
    }
  }

  private async selectKouho(kouho: unknown): Promise<void> {
    if (!kouho || this.hasSentakuMax) {
      return;
    }
    const targetKey = this.toKey(this.getSelectedValue(kouho));
    if (this.sentakuZumiModelList.some((item) => this.toKey(this.getSelectedValue(item)) === targetKey)) {
      this.nyuryokuText = '';
      this.panelOpen = false;
      await this.refreshKouhoList();
      this.focusNyuryoku();
      return;
    }

    // 候補選択後はチップ化して入力欄を空に戻し、連続入力をしやすくする。
    this.sentakuZumiModelList = [...this.sentakuZumiModelList, kouho];
    this.notifyValueChanged();
    this.nyuryokuText = '';
    this.panelOpen = false;
    this.activeIndex = 0;
    await this.refreshKouhoList();
    this.focusNyuryoku();
  }

  private async refreshKouhoList(): Promise<void> {
    const key = this.nyuryokuText.trim().toLowerCase();
    const baseKouhoList = await this.loadKouhoList();
    const sentakuKeySet = new Set(this.sentakuZumiModelList.map((item) => this.toKey(this.getSelectedValue(item))));
    const mikiList = baseKouhoList.filter((item) => !sentakuKeySet.has(this.toKey(this.getSelectedValue(item))));

    this.hyojiKouhoList = mikiList.filter((item) => {
      if (!key) {
        return true;
      }
      return this.buildSearchText(item).includes(key);
    });

    this.activeIndex = Math.min(this.activeIndex, Math.max(this.hyojiKouhoList.length - 1, 0));
    if (this.panelOpen && this.hyojiKouhoList.length === 0) {
      this.panelOpen = false;
    }
  }

  private async loadKouhoList(): Promise<unknown[]> {
    if (!this.itemSourceFunction) {
      this.saishinKouhoPool = this.kouhoList;
      return this.kouhoList;
    }

    // 入力途中の古いレスポンスで候補が巻き戻らないよう、連番で最新応答のみ反映する。
    const currentSeq = ++this.kensakuSeq;
    try {
      const result = await this.itemSourceFunction(this.nyuryokuText);
      if (currentSeq !== this.kensakuSeq) {
        return this.saishinKouhoPool;
      }
      const normalized = Array.isArray(result) ? result : [];
      this.saishinKouhoPool = normalized;
      return normalized;
    } catch {
      if (currentSeq === this.kensakuSeq) {
        this.saishinKouhoPool = [];
      }
      return [];
    }
  }

  // selectedValuePathで指定された値配列を候補モデルへ逆引きし、チップ表示に使う。
  private resolveSentakuModelList(valueList: unknown[]): unknown[] {
    const keySet = new Set(valueList.map((value) => this.toKey(value)));
    const taishoKouhoList = this.itemSourceFunction ? this.saishinKouhoPool : this.kouhoList;
    const hitList = taishoKouhoList.filter((item) => keySet.has(this.toKey(this.getSelectedValue(item))));
    return this.removeJufukuBySelectedValue(hitList);
  }

  private removeJufukuBySelectedValue(modelList: unknown[]): unknown[] {
    const map = new Map<string, unknown>();
    modelList.forEach((item) => {
      const key = this.toKey(this.getSelectedValue(item));
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return [...map.values()];
  }

  getDisplayText(model: unknown): string {
    if (this.displayTextFn) {
      const text = this.displayTextFn(model);
      return text ?? '';
    }
    if (this.displayMemberPath) {
      const text = this.getMemberValue(model, this.displayMemberPath);
      return text == null ? '' : String(text);
    }
    return String(model ?? '');
  }

  private notifyValueChanged(): void {
    const selectedValueList = this.sentakuZumiModelList.map((item) => this.getSelectedValue(item));
    this.propagateChange(selectedValueList);
    this.valueChanged.emit(selectedValueList);
  }

  private focusNyuryoku(): void {
    this.nyuryokuRef?.nativeElement.focus();
  }

  private getSelectedValue(model: unknown): unknown {
    if (!this.selectedValuePath) {
      return model;
    }
    return this.getMemberValue(model, this.selectedValuePath);
  }

  private buildSearchText(model: unknown): string {
    const memberPathList = Array.isArray(this.searchMemberPath)
      ? this.searchMemberPath
      : this.searchMemberPath
        ? [this.searchMemberPath]
        : [];
    if (memberPathList.length === 0) {
      return this.getDisplayText(model).toLowerCase();
    }
    return memberPathList
      .map((path) => this.getMemberValue(model, path))
      .map((value) => String(value ?? '').toLowerCase())
      .join(' ');
  }

  // ドット区切りパスでネストプロパティを取得する。
  private getMemberValue(model: unknown, memberPath: string): unknown {
    if (!memberPath) {
      return undefined;
    }
    return memberPath.split('.').reduce<unknown>((current, key) => {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[key];
    }, model);
  }

  private toKey(value: unknown): string {
    if (value == null) {
      return 'null';
    }
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'bigint') {
      return `${type}:${String(value)}`;
    }
    try {
      return `obj:${JSON.stringify(value)}`;
    } catch {
      return `obj:${String(value)}`;
    }
  }
}
