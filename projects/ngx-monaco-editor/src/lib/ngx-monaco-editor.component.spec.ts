import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxMonacoEditorComponent } from './ngx-monaco-editor.component';

describe('NgxMonacoEditorComponent', () => {
  let component: NgxMonacoEditorComponent;
  let fixture: ComponentFixture<NgxMonacoEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMonacoEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxMonacoEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
