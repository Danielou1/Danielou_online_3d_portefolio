import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiantScreenComponent } from './giant-screen.component';

describe('GiantScreenComponent', () => {
  let component: GiantScreenComponent;
  let fixture: ComponentFixture<GiantScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GiantScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GiantScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
