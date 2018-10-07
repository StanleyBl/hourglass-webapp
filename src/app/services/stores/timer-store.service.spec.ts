import { TestBed } from '@angular/core/testing';

import { TimerStoreService } from './timer-store.service';

describe('TimerStoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TimerStoreService = TestBed.get(TimerStoreService);
    expect(service).toBeTruthy();
  });
});
