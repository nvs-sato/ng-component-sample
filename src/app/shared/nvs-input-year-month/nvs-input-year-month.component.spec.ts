import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NvsInputYearMonthComponent } from './nvs-input-year-month.component';

@Component({
  template: `<nvs-input-year-month [formControl]="nengetsuCtrl"></nvs-input-year-month>`
})
class HostComponent {
  nengetsuCtrl = new FormControl<Date | null>(new Date(2026, 1, 1, 12, 0, 0, 0));
}

describe('NvsInputYearMonthComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: NvsInputYearMonthComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NvsInputYearMonthComponent, HostComponent],
      imports: [FormsModule, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(By.directive(NvsInputYearMonthComponent)).componentInstance as NvsInputYearMonthComponent;
  });

  it('年変更時にinputが空欄にならずDateが保持される', () => {
    comp.togglePicker();
    fixture.detectChanges();

    comp.onChangeYear(2027);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('2027/02');

    const value = host.nengetsuCtrl.value as Date;
    expect(value instanceof Date).toBeTrue();
    expect(value.getFullYear()).toBe(2027);
    expect(value.getMonth()).toBe(1);
    expect(value.getDate()).toBe(1);
  });

  it('年月ピッカー表示中にEscで閉じる', () => {
    comp.togglePicker();
    fixture.detectChanges();
    expect(comp.pickerOpen).toBeTrue();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(comp.pickerOpen).toBeFalse();
  });
});
