import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {Component, model, viewChild} from "@angular/core";
import {NgClass, NgStyle} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

import {
  EditorInitializedEvent,
  MockMonacoEditorConfig,
  NgxMonacoEditorFakeComponent,
  provideMockMonacoEditor,
  StandaloneCodeEditor
} from "./ngx-monaco-editor-fake.component";
import {MonacoAPI} from "../../src/monaco-loader";
import {NgxMonacoEditorFakeHarness} from "./ngx-monaco-editor-fake-harness";
import {NgxMonacoEditorComponent} from "@jean-merelis/ngx-monaco-editor";


@Component({
  selector: 'wrapper',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMonacoEditorComponent,
  ],
  template: `
    <ngx-monaco-editor [(value)]="code"
                       [language]="'typescript'"
                       [options]="{automaticLayout:false,minimap:{enabled:false},lineNumbers: 'off',contextmenu: true,wordBasedSuggestions:'currentDocument', wordWrap:'on'}"
                       [theme]="'vs'"
                       (editorInitialized)="editorInitialized($event)"
                       (focus)="onFocus()"
                       (blur)="onBlur()"
                       style="height: 120px"
    ></ngx-monaco-editor>

  `
})
export class WrapperComponent {
  code = model("");
  events: string[] = [];
  editor?: StandaloneCodeEditor;
  monaco?: MonacoAPI;
  ngxEditor = viewChild.required(NgxMonacoEditorComponent);

  editorInitialized(event: EditorInitializedEvent) {
    this.events.push("editorInitialized");
    this.editor = event.editor;
    this.monaco = event.monaco;
  }

  onFocus() {
    this.events.push("focus");
  }

  onBlur() {
    this.events.push("blur");
  }
}

describe("NgxMonacoEditorFakeComponent", () => {

  // for example purposes only
  const createMock = () => {
    const mockEditor = jasmine.createSpyObj('StandaloneCodeEditor', [
      'getValue',
      'setValue',
      'getModel',
      'updateOptions',
      'layout',
      'dispose',
      'onDidChangeModelContent',
      'focus'
    ]);
    mockEditor.getValue.and.returnValue('');
    mockEditor.getModel.and.returnValue({
      getValue: () => '',
      setValue: () => {
      },
      dispose: () => {
      }
    });
    mockEditor.onDidChangeModelContent.and.returnValue({
      dispose: () => {
      }
    });


    const mockEditorNamespace = jasmine.createSpyObj('editor', [
      'defineTheme',
      'setTheme',
      'create'
    ]);

    mockEditorNamespace.EditorOption = {
      lineNumbers: 'lineNumbers',
      wordWrap: 'wordWrap',
      minimap: 'minimap'
    };

    const mockLanguagesNamespace = jasmine.createSpyObj('languages', [
      'register',
      'setMonarchTokensProvider',
      'registerCompletionItemProvider'
    ]);

    mockLanguagesNamespace.json = {
      jsonDefaults: jasmine.createSpyObj('jsonDefaults', ['setDiagnosticsOptions'])
    };

    const mockMonaco = {
      editor: mockEditorNamespace,
      languages: mockLanguagesNamespace,

      MarkerSeverity: {
        Error: 8,
        Warning: 4,
        Info: 2,
        Hint: 1
      },

      KeyMod: {
        CtrlCmd: 2048,
        Shift: 1024,
        Alt: 512,
        WinCtrl: 256
      },

      KeyCode: {
        KEY_S: 83,
        KEY_F: 70
      }
    };
    mockMonaco.editor.create.and.returnValue(mockEditor);
    mockMonaco.languages.register.and.returnValue(undefined);

    return {initializedEvent: {editor: mockEditor, monaco: mockMonaco}};
  }

  let fixture: ComponentFixture<WrapperComponent>;
  let loader: HarnessLoader;
  let mockConfig: MockMonacoEditorConfig


  beforeEach(async () => {
    mockConfig = createMock();

    await TestBed.configureTestingModule({
      imports: [
        NgClass,
        NgStyle,
        WrapperComponent,
      ],
      providers: [
        // for example purposes only
        provideMockMonacoEditor(mockConfig),
      ]

    })
      .overrideComponent(WrapperComponent, {
        remove: {imports: [NgxMonacoEditorComponent]},
        add: {imports: [NgxMonacoEditorFakeComponent]}
      })
      .compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });


  it("should be created", async () => {
    expect(fixture.componentInstance.events.some(evt => evt === "editorInitialized"));
    expect(fixture.componentInstance.editor).toBeDefined();
    expect(fixture.componentInstance.monaco).toBeDefined();
  });

  it("should emit focus event when get focus by click", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorFakeHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBeTrue();
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));
    expect(fixture.componentInstance.editor).toBeDefined();
    expect(fixture.componentInstance.monaco).toBeDefined();
  });

  it("should emit focus event when get focus programmatically", async () => {
    fixture.componentInstance.ngxEditor()?.focus()
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorFakeHarness);
    expect(await ngxMonaco.isFocused()).toBeTrue();
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));
  });

  it("should emit blur event when lose focus", async () => {
    fixture.componentInstance.ngxEditor()?.focus()
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorFakeHarness);
    expect(await ngxMonaco.isFocused()).toBeTrue();
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));

    await ngxMonaco.blur();
    expect(await ngxMonaco.isFocused()).toBeFalse();
    expect(fixture.componentInstance.events.some(evt => evt === "blur"));
  });

  it("should emit value when editor value changes", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";

    const ngxMonaco = await loader.getHarness(NgxMonacoEditorFakeHarness);
    await ngxMonaco.setValue(theCode);
    expect(fixture.componentInstance.code()).toBe(theCode);
  });

  it("should set value on editor when input value changes", async () => {
    const theCode = "$max(20, 21) + $min(4, 9); const helloWorld = () => 'Hello world';";
    fixture.componentInstance.code.set(theCode)
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorFakeHarness);
    expect(await ngxMonaco.getText()).toBe(theCode);
  });
});
