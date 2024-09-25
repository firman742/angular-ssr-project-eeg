import { TestBed } from '@angular/core/testing';

import { DataClassificationService } from './data-classification.service';

describe('DataClassificationService', () => {
  let service: DataClassificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataClassificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
