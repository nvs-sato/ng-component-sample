import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NvsInputDateComponent } from './nvs-input-date.component';

@Component({
  template: `<nvs-input-date [formControl]="hidukeCtrl"></nvs-input-date>`
})
class HostComponent {
  hidukeCtrl = new FormControl<Date | null>(null);
}

describe('NvsInputDateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NvsInputDateComponent, HostComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('8桁数字入力でFormControlへ同じ年月日のDateを反映する', () => {
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = '20260226';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const value = host.hidukeCtrl.value as Date;
    expect(value instanceof Date).toBeTrue();
    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(1);
    expect(value.getDate()).toBe(26);
  });

  it('writeValueへ日付文字列を渡した場合に表示を正規化する', () => {
    const comp = fixture.debugElement.query(By.directive(NvsInputDateComponent)).componentInstance as NvsInputDateComponent;
    comp.writeValue('2026/02/26');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('2026/02/26');
  });

  it('カレンダーの日付mousedownでFormControlに反映される', () => {
    const comp = fixture.debugElement.query(By.directive(NvsInputDateComponent)).componentInstance as NvsInputDateComponent;
    comp.toggleCalendar();
    fixture.detectChanges();

    const target = comp.calendarCellList.find((c) => c.tsukiNai && c.hiduke.getDate() === 26);
    expect(target).toBeTruthy();

    comp.onMouseDownDate(new MouseEvent('mousedown'), target!);
    fixture.detectChanges();

    const value = host.hidukeCtrl.value as Date;
    expect(value instanceof Date).toBeTrue();
    expect(value.getDate()).toBe(26);
  });

  it('カレンダー表示中のPageDownで翌月へ移動する', () => {
    const comp = fixture.debugElement.query(By.directive(NvsInputDateComponent)).componentInstance as NvsInputDateComponent;
    comp.writeValue('2026/02/26');
    comp.toggleCalendar();
    fixture.detectChanges();

    const before = comp.hyojiMonthBase.getMonth();
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    fixture.detectChanges();

    expect(comp.hyojiMonthBase.getMonth()).toBe((before + 1) % 12);
    expect(input.value).toBe('2026/03/26');
    const value = host.hidukeCtrl.value as Date;
    expect(value.getMonth()).toBe(2);
    expect(value.getDate()).toBe(26);
  });

  it('カレンダーアイコンにフォーカス時もF4で開閉できる', () => {
    const comp = fixture.debugElement.query(By.directive(NvsInputDateComponent)).componentInstance as NvsInputDateComponent;
    const btn = fixture.debugElement.query(By.css('.calendar-icon-btn')).nativeElement as HTMLButtonElement;

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }));
    fixture.detectChanges();
    expect(comp.calendarOpen).toBeTrue();

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }));
    fixture.detectChanges();
    expect(comp.calendarOpen).toBeFalse();
  });

  it('Alt+ArrowDown（Option+ArrowDown）で開閉できる', () => {
    const comp = fixture.debugElement.query(By.directive(NvsInputDateComponent)).componentInstance as NvsInputDateComponent;
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true }));
    fixture.detectChanges();
    expect(comp.calendarOpen).toBeTrue();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true }));
    fixture.detectChanges();
    expect(comp.calendarOpen).toBeFalse();
  });
});
