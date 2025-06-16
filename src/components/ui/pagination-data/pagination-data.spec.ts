import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationData } from './pagination-data';

describe('PaginationData', () => {
  let component: PaginationData;
  let fixture: ComponentFixture<PaginationData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginationData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
