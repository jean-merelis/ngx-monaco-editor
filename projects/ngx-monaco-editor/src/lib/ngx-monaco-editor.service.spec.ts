import { TestBed } from '@angular/core/testing';

import { NgxMonacoEditorService } from './ngx-monaco-editor.service';

describe('NgxMonacoEditorService', () => {
  let service: NgxMonacoEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxMonacoEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
