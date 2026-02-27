import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NvsPopupService } from './nvs-popup.service';

@Component({ template: '<div>dummy</div>' })
class DummyPopupComponent {}

describe('NvsPopupService', () => {
  let service: NvsPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NvsPopupService);
  });

  it('open後にafterClosedへ結果を返す', async () => {
    const handle = service.open(DummyPopupComponent, {
      title: 'test'
    });

    service.close({ ok: true });
    const result = await handle.afterClosed;
    expect(result).toEqual({ ok: true });
  });
});

