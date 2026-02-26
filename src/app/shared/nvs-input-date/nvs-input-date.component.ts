import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarCell {
  hiduke: Date;
  tsukiNai: boolean;
  sentaku: boolean;
  muko: boolean;
}

@Component({
  selector: 'nvs-input-date',
  templateUrl: './nvs-input-date.component.html',
  styleUrls: ['./nvs-input-date.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NvsInputDateComponent),
      multi: true
    }
  ]
})
export class NvsInputDateComponent implements ControlValueAccessor, OnInit, OnChanges, AfterViewInit {
  @Input() isRequired = false;
  @Input() isDisabled = false;
  @Input() isReadOnly = false;
  @Input() placeholder = '';
  @Input() minDate: Date | string | null = null;
  @Input() maxDate: Date | string | null = null;

  @Output() initialized = new EventEmitter<void>();
  @Output() valueChanged = new EventEmitter<Date | null>();
  @Output() gotFocus = new EventEmitter<void>();
  @Output() lostFocus = new EventEmitter<void>();

  inputText = '';
  calendarOpen = false;
  // カレンダー描画の基準（月初固定）
  hyojiMonthBase = this.createMonthBase(new Date());
  // カレンダー表示中のキーボード操作対象日
  activeCalendarDate: Date | null = null;

  private internalValue: Date | null = null;
  private minDateObj: Date | null = null;
  private maxDateObj: Date | null = null;
  private propagateChange: (value: Date | null) => void = () => {};
  private propagateTouched: () => void = () => {};

  constructor(private readonly hostRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.minDateObj = this.parseToDate(this.minDate);
    this.maxDateObj = this.parseToDate(this.maxDate);
  }

  ngAfterViewInit(): void {
    this.initialized.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['minDate']) {
      this.minDateObj = this.parseToDate(this.minDate);
    }
    if (changes['maxDate']) {
      this.maxDateObj = this.parseToDate(this.maxDate);
    }
    if (changes['isDisabled'] && this.isDisabled) {
      this.calendarOpen = false;
    }
  }

  writeValue(value: unknown): void {
    // 外部（FormControl）からの値は必ずDateへ寄せて内部反映する。
    const parsed = this.parseToDate(value);
    this.setNaibuValue(parsed, false);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.calendarOpen = false;
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const suji = raw.replace(/\D/g, '').slice(0, 8);

    // 数字のみ入力で年月日をマスク表示する。
    this.inputText = raw.length > 0 ? this.buildMaskText(suji) : '';

    // 8桁揃った時のみ日付確定としてCVAへ通知する。
    if (suji.length === 8) {
      const parsed = this.parseYmdDigits(suji);
      this.setNaibuValue(parsed, true);
      return;
    }

    // 入力途中は未確定扱いでnull通知する。
    this.setNaibuValue(null, true);
  }

  onFocus(): void {
    this.gotFocus.emit();
  }

  onBlur(): void {
    // touchedはフォーカスアウト時に通知する。
    this.propagateTouched();

    // 未確定マスクはフォーカスアウト時にクリアする。
    if (this.inputText.includes('_')) {
      this.inputText = '';
    }

    this.lostFocus.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    // Alt + ↓（macのOption + ↓）でカレンダーをトグルする。
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.toggleCalendar();
      return;
    }

    // カレンダー表示中はカレンダー側のキー操作を優先する。
    if (this.calendarOpen && this.handleCalendarKeyDown(event)) {
      return;
    }

    // 上下キーで日単位のインクリメント/デクリメントを行う。
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.shiftDays(1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.shiftDays(-1);
      return;
    }

    // F4でカレンダーポップアップをトグルする。
    if (event.key === 'F4') {
      event.preventDefault();
      this.toggleCalendar();
    }
  }

  toggleCalendar(): void {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    this.calendarOpen = !this.calendarOpen;
    if (this.calendarOpen) {
      this.hyojiMonthBase = this.createMonthBase(this.internalValue ?? new Date());
      this.activeCalendarDate = this.internalValue ?? new Date();
      this.activeCalendarDate = new Date(
        this.activeCalendarDate.getFullYear(),
        this.activeCalendarDate.getMonth(),
        this.activeCalendarDate.getDate(),
        12, 0, 0, 0
      );
    }
  }

  prevMonth(): void {
    this.hyojiMonthBase = new Date(this.hyojiMonthBase.getFullYear(), this.hyojiMonthBase.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.hyojiMonthBase = new Date(this.hyojiMonthBase.getFullYear(), this.hyojiMonthBase.getMonth() + 1, 1);
  }

  get monthTitle(): string {
    const yyyy = this.hyojiMonthBase.getFullYear();
    const mm = this.hyojiMonthBase.getMonth() + 1;
    return `${yyyy}/${String(mm).padStart(2, '0')}`;
  }

  get weekLabelList(): string[] {
    return ['日', '月', '火', '水', '木', '金', '土'];
  }

  get calendarCellList(): CalendarCell[] {
    const first = this.hyojiMonthBase;
    const firstWeek = first.getDay();
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - firstWeek);

    // 6週(42セル)固定で描画し、月跨ぎ日付も同一グリッド内に並べる。
    return Array.from({ length: 42 }, (_, i) => {
      const hiduke = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return {
        hiduke,
        tsukiNai: hiduke.getMonth() === first.getMonth(),
        sentaku: this.isSameDate(hiduke, this.internalValue),
        muko: this.isOutOfRange(hiduke)
      };
    });
  }

  onClickDate(cell: CalendarCell): void {
    if (cell.muko || this.isDisabled || this.isReadOnly) {
      return;
    }

    this.setNaibuValue(cell.hiduke, true);
    this.calendarOpen = false;
  }

  onMouseDownDate(event: MouseEvent, cell: CalendarCell): void {
    // mousedownで先に適用し、input blurより先に値を確定させる。
    event.preventDefault();
    this.onClickDate(cell);
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.calendarOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.calendarOpen = false;
    }
  }

  private shiftDays(diff: number): void {
    const base = this.internalValue ?? new Date();
    const shifted = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
    this.setNaibuValue(shifted, true);
  }

  private setNaibuValue(value: Date | null, notify: boolean): void {
    const normalized = this.normalizeAndClamp(value);
    this.internalValue = normalized;
    this.inputText = normalized ? this.toDisplayText(normalized) : '';

    // notify=true のときのみControlValueAccessor/EventEmitterへ通知する。
    if (notify) {
      this.propagateChange(normalized);
      this.valueChanged.emit(normalized);
    }
  }

  private normalizeAndClamp(value: Date | null): Date | null {
    if (!value) {
      return null;
    }

    // Date型の時差影響で日付が前後しにくいよう、内部保持はローカル正午で統一する。
    const normalized = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
    if (this.isOutOfRange(normalized)) {
      return null;
    }

    return normalized;
  }

  private isOutOfRange(value: Date): boolean {
    if (this.minDateObj && value < this.minDateObj) {
      return true;
    }
    if (this.maxDateObj && value > this.maxDateObj) {
      return true;
    }
    return false;
  }

  private parseToDate(value: unknown): Date | null {
    if (value == null || value === '') {
      return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) {
        return null;
      }

      // 文字列は業務入力で想定される複数フォーマットを許容する。
      // yyyy/MM/dd, yyyy-MM-dd, yyyyMMdd, yyyy年M月d日 を許容する。
      const p1 = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
      if (p1) {
        return this.buildDate(Number(p1[1]), Number(p1[2]), Number(p1[3]));
      }

      const p2 = text.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (p2) {
        return this.buildDate(Number(p2[1]), Number(p2[2]), Number(p2[3]));
      }

      const p3 = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
      if (p3) {
        return this.buildDate(Number(p3[1]), Number(p3[2]), Number(p3[3]));
      }
    }

    return null;
  }

  private parseYmdDigits(digits: string): Date | null {
    const yyyy = Number(digits.slice(0, 4));
    const mm = Number(digits.slice(4, 6));
    const dd = Number(digits.slice(6, 8));
    return this.buildDate(yyyy, mm, dd);
  }

  private buildDate(yyyy: number, mm: number, dd: number): Date | null {
    // 内部保持はローカル正午に統一し、UTC変換時の前日ズレを抑止する。
    const hiduke = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
    if (
      hiduke.getFullYear() !== yyyy ||
      hiduke.getMonth() !== mm - 1 ||
      hiduke.getDate() !== dd
    ) {
      return null;
    }

    return this.normalizeAndClamp(hiduke);
  }

  private buildMaskText(digits: string): string {
    const y = `${digits.slice(0, 4)}____`.slice(0, 4);
    const m = `${digits.slice(4, 6)}__`.slice(0, 2);
    const d = `${digits.slice(6, 8)}__`.slice(0, 2);
    return `${y}/${m}/${d}`;
  }

  private toDisplayText(hiduke: Date): string {
    const yyyy = hiduke.getFullYear();
    const mm = String(hiduke.getMonth() + 1).padStart(2, '0');
    const dd = String(hiduke.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }

  private createMonthBase(base: Date): Date {
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }

  isSameDate(a: Date | null, b: Date | null): boolean {
    if (!a || !b) {
      return false;
    }

    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private handleCalendarKeyDown(event: KeyboardEvent): boolean {
    const base = this.activeCalendarDate ?? this.internalValue ?? new Date();
    let moved: Date | null = null;

    switch (event.key) {
      case 'ArrowUp':
        moved = this.addDay(base, -7);
        break;
      case 'ArrowDown':
        moved = this.addDay(base, 7);
        break;
      case 'ArrowLeft':
        moved = this.addDay(base, -1);
        break;
      case 'ArrowRight':
        moved = this.addDay(base, 1);
        break;
      case 'PageUp':
        moved = this.addMonth(base, -1);
        break;
      case 'PageDown':
        moved = this.addMonth(base, 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeCalendarDate && !this.isOutOfRange(this.activeCalendarDate)) {
          this.setNaibuValue(this.activeCalendarDate, true);
          this.calendarOpen = false;
        }
        return true;
      case 'Escape':
      case 'F4':
        event.preventDefault();
        this.calendarOpen = false;
        return true;
      default:
        return false;
    }

    event.preventDefault();
    if (!moved) {
      return true;
    }

    if (!this.isOutOfRange(moved)) {
      this.activeCalendarDate = moved;
      // カレンダー上の選択変更を即時に入力欄/CVAへ反映する。
      this.setNaibuValue(this.activeCalendarDate, true);
    }
    this.hyojiMonthBase = this.createMonthBase(this.activeCalendarDate ?? moved);
    return true;
  }

  private addDay(base: Date, diff: number): Date {
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff, 12, 0, 0, 0);
  }

  private addMonth(base: Date, diff: number): Date {
    const moved = new Date(base.getFullYear(), base.getMonth() + diff, base.getDate(), 12, 0, 0, 0);
    return moved;
  }
}
