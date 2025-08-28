import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AkademischComponent } from './akademisch.component';

describe('AkademischComponent', () => {
  let component: AkademischComponent;
  let fixture: ComponentFixture<AkademischComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AkademischComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AkademischComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
