import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteTable } from './complete-table';

describe('CompleteTable', () => {
  let component: CompleteTable;
  let fixture: ComponentFixture<CompleteTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompleteTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
