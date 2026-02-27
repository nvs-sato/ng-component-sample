import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NvsPopupHostComponent } from './nvs-popup-host.component';
import { NvsPopupService } from '../nvs-popup.service';

@Component({
  template: `<div class="dummy-body">popup body</div>`
})
class DummyPopupBodyComponent {}

describe('NvsPopupHostComponent', () => {
  let fixture: ComponentFixture<NvsPopupHostComponent>;
  let service: NvsPopupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NvsPopupHostComponent, DummyPopupBodyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NvsPopupHostComponent);
    service = TestBed.inject(NvsPopupService);
    fixture.detectChanges();
  });

  it('openでモーダルが表示される', async () => {
    service.open(DummyPopupBodyComponent, {
      title: 'popup test'
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.modal.modal-open'))).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('popup test');
    expect(fixture.nativeElement.textContent).toContain('popup body');
  });

  it('後から開いたポップアップが上に重なる', async () => {
    service.open(DummyPopupBodyComponent, {
      title: 'first'
    });
    const secondHandle = service.open(DummyPopupBodyComponent, {
      title: 'second'
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const popupBoxes = fixture.debugElement.queryAll(By.css('.popup-box'));
    expect(popupBoxes.length).toBe(2);
    expect(popupBoxes[1].nativeElement.textContent).toContain('second');

    service.close(undefined, secondHandle.popupRef);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 220));
    fixture.detectChanges();

    const remainedPopupBoxes = fixture.debugElement.queryAll(By.css('.popup-box'));
    expect(remainedPopupBoxes.length).toBe(1);
    expect(remainedPopupBoxes[0].nativeElement.textContent).toContain('first');
  });

  it('多重起動してもバックドロップは1つだけ', async () => {
    service.open(DummyPopupBodyComponent, { title: 'first' });
    service.open(DummyPopupBodyComponent, { title: 'second' });

    await fixture.whenStable();
    fixture.detectChanges();

    const modalElements = fixture.debugElement.queryAll(By.css('.modal'));
    expect(modalElements.length).toBe(1);
  });

  it('closeOnBackdrop=true のときは外側クリックで閉じる', async () => {
    service.open(DummyPopupBodyComponent, {
      title: 'backdrop close',
      closeOnBackdrop: true
    });
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.modal')).nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.popup-box')).length).toBe(0);
  });

  it('closeOnBackdrop=false のときは外側クリックで閉じない', async () => {
    service.open(DummyPopupBodyComponent, {
      title: 'backdrop keep',
      closeOnBackdrop: false
    });
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.modal')).nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.popup-box')).length).toBe(1);
  });

  it('closeOnEsc未指定(デフォルトtrue)のときはEscで閉じる', async () => {
    service.open(DummyPopupBodyComponent, { title: 'esc close' });
    await fixture.whenStable();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.popup-box')).length).toBe(0);
  });

  it('closeOnEsc=false のときはEscで閉じない', async () => {
    service.open(DummyPopupBodyComponent, {
      title: 'esc keep',
      closeOnEsc: false
    });
    await fixture.whenStable();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.popup-box')).length).toBe(1);
  });
});
