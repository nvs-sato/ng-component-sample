import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'nvs-input-year-month',
  templateUrl: './nvs-input-year-month.component.html',
  styleUrls: ['./nvs-input-year-month.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NvsInputYearMonthComponent),
      multi: true
    }
  ]
})
export class NvsInputYearMonthComponent implements ControlValueAccessor, OnInit, OnChanges, AfterViewInit {
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
  pickerOpen = false;
  sentakuYear = new Date().getFullYear();
  sentakuMonth = new Date().getMonth() + 1;

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
      this.pickerOpen = false;
    }
  }

  writeValue(value: unknown): void {
    const parsed = this.parseToDate(value);
    this.setInternalValue(parsed, false);
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
      this.pickerOpen = false;
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const suji = input.value.replace(/\D/g, '').slice(0, 6);
    this.inputText = input.value.length > 0 ? this.buildMaskText(suji) : '';

    if (suji.length === 6) {
      const yyyy = Number(suji.slice(0, 4));
      const mm = Number(suji.slice(4, 6));
      this.setInternalValue(this.buildDate(yyyy, mm), true);
      return;
    }

    this.setInternalValue(null, true);
  }

  onFocus(): void {
    this.gotFocus.emit();
  }

  onBlur(): void {
    this.propagateTouched();
    if (this.inputText.includes('_')) {
      this.inputText = '';
    }
    this.lostFocus.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    if (event.key === 'Escape' && this.pickerOpen) {
      event.preventDefault();
      this.pickerOpen = false;
      return;
    }

    if ((event.altKey && event.key === 'ArrowDown') || event.key === 'F4') {
      event.preventDefault();
      this.togglePicker();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.shiftMonth(1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.shiftMonth(-1);
    }
  }

  togglePicker(): void {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    this.pickerOpen = !this.pickerOpen;
    const base = this.internalValue ?? new Date();
    this.sentakuYear = base.getFullYear();
    this.sentakuMonth = base.getMonth() + 1;
  }

  get yearList(): number[] {
    const base = this.internalValue?.getFullYear() ?? new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => base - 10 + i);
  }

  get monthList(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  // 年変更はイベント引数の値を優先して内部状態へ反映する。
  onChangeYear(year: number): void {
    this.sentakuYear = Number(year);
    this.onChangeYearMonth();
  }

  // 月変更はイベント引数の値を優先して内部状態へ反映する。
  onChangeMonth(month: number): void {
    this.sentakuMonth = Number(month);
    this.onChangeYearMonth();
  }

  private onChangeYearMonth(): void {
    this.setInternalValue(this.buildDate(this.sentakuYear, this.sentakuMonth), true);
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.pickerOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.pickerOpen = false;
    }
  }

  private shiftMonth(diff: number): void {
    const base = this.internalValue ?? new Date();
    const moved = new Date(base.getFullYear(), base.getMonth() + diff, 1, 12, 0, 0, 0);
    this.setInternalValue(moved, true);
  }

  private setInternalValue(value: Date | null, notify: boolean): void {
    const normalized = this.normalizeAndClamp(value);
    this.internalValue = normalized;
    this.inputText = normalized ? this.toDisplayText(normalized) : '';
    this.sentakuYear = normalized?.getFullYear() ?? this.sentakuYear;
    this.sentakuMonth = normalized ? normalized.getMonth() + 1 : this.sentakuMonth;

    if (notify) {
      this.propagateChange(normalized);
      this.valueChanged.emit(normalized);
    }
  }

  private normalizeAndClamp(value: Date | null): Date | null {
    if (!value) {
      return null;
    }
    const normalized = new Date(value.getFullYear(), value.getMonth(), 1, 12, 0, 0, 0);
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
      return this.buildDate(value.getFullYear(), value.getMonth() + 1);
    }

    if (typeof value === 'string') {
      const text = value.trim();
      const p1 = text.match(/^(\d{4})[\/-](\d{1,2})$/);
      if (p1) {
        return this.buildDate(Number(p1[1]), Number(p1[2]));
      }
      const p2 = text.match(/^(\d{4})(\d{2})$/);
      if (p2) {
        return this.buildDate(Number(p2[1]), Number(p2[2]));
      }
      const p3 = text.match(/^(\d{4})年(\d{1,2})月$/);
      if (p3) {
        return this.buildDate(Number(p3[1]), Number(p3[2]));
      }
    }
    return null;
  }

  private buildDate(yyyy: number, mm: number): Date | null {
    const hiduke = new Date(yyyy, mm - 1, 1, 12, 0, 0, 0);
    if (hiduke.getFullYear() !== yyyy || hiduke.getMonth() !== mm - 1) {
      return null;
    }
    return this.normalizeAndClamp(hiduke);
  }

  private buildMaskText(digits: string): string {
    const y = `${digits.slice(0, 4)}____`.slice(0, 4);
    const m = `${digits.slice(4, 6)}__`.slice(0, 2);
    return `${y}/${m}`;
  }

  private toDisplayText(value: Date): string {
    return `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, '0')}`;
  }
}
