import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraProctoringComponent } from './camera-proctoring.component';

describe('CameraProctoringComponent', () => {
  let component: CameraProctoringComponent;
  let fixture: ComponentFixture<CameraProctoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameraProctoringComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraProctoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
