import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormErrorBlock } from './form-error-block';

describe('FormErrorBlock', () => {
  let component: FormErrorBlock;
  let fixture: ComponentFixture<FormErrorBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormErrorBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormErrorBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
