import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {Component, model, provideZonelessChangeDetection, viewChild} from "@angular/core";
import {EditorInitializedEvent, NgxMonacoEditorComponent, StandaloneCodeEditor} from "../../src/ngx-monaco-editor.component";
import {MonacoAPI, NGX_MONACO_LOADER_PROVIDER, MonacoLoader} from "../../src/monaco-loader";
import {NgxMonacoEditorHarness} from "./ngx-monaco-editor-harness";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";


class MockMonacoLoader implements MonacoLoader {
  private _monaco: MonacoAPI;

  constructor() {
    const mockEditorNamespace = {
      create: vi.fn().mockImplementation((container: HTMLElement, options: any) => {
        // Each create() call produces an independent mock editor instance
        const mockModel = {
          onDidChangeContent: vi.fn(),
          getValue: vi.fn().mockReturnValue(''),
          setValue: vi.fn(),
          dispose: vi.fn(),
        };

        let contentChangeCb: ((e: any) => void) | null = null;
        mockModel.onDidChangeContent.mockImplementation((cb: (e: any) => void) => {
          contentChangeCb = cb;
          return {dispose: vi.fn()};
        });

        const mockEditor = {
          getValue: vi.fn().mockReturnValue(''),
          setValue: vi.fn(),
          getModel: vi.fn().mockReturnValue(mockModel),
          updateOptions: vi.fn(),
          layout: vi.fn(),
          dispose: vi.fn(),
          focus: vi.fn(),
          addAction: vi.fn(),
          onDidFocusEditorWidget: vi.fn(),
          onDidBlurEditorWidget: vi.fn(),
        } as any;

        let focusCb: (() => void) | null = null;
        let blurCb: (() => void) | null = null;

        mockEditor.onDidFocusEditorWidget.mockImplementation((cb: () => void) => {
          focusCb = cb;
          return {dispose: vi.fn()};
        });
        mockEditor.onDidBlurEditorWidget.mockImplementation((cb: () => void) => {
          blurCb = cb;
          return {dispose: vi.fn()};
        });

        // Create DOM structure that mimics real Monaco editor
        const editorDiv = document.createElement('div');
        editorDiv.classList.add('monaco-editor');
        const textarea = document.createElement('textarea');

        // Intercept the value property to detect setInputValue vs sendKeys
        let currentValue = options?.value ?? '';
        let isKeyEvent = false;
        let isEditorSet = false;
        const nativeDesc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!;

        textarea.addEventListener('keydown', () => { isKeyEvent = true; });
        textarea.addEventListener('keyup', () => { isKeyEvent = false; });

        Object.defineProperty(textarea, 'value', {
          get() { return currentValue; },
          set(val: string) {
            nativeDesc.set!.call(this, val);
            if (!isKeyEvent && !isEditorSet) {
              // From setInputValue (CDK testbed) - capture value and trigger content change
              currentValue = val;
              mockEditor.getValue.mockReturnValue(val);
              mockModel.getValue.mockReturnValue(val);
              contentChangeCb?.({});
            } else if (isEditorSet) {
              // From mockEditor.setValue - just update currentValue
              currentValue = val;
            }
            // If isKeyEvent: from sendKeys - ignore (don't update currentValue)
            isKeyEvent = false;
          }
        });

        textarea.addEventListener('focus', () => {
          editorDiv.classList.add('focused');
          focusCb?.();
        });
        textarea.addEventListener('blur', () => {
          editorDiv.classList.remove('focused');
          blurCb?.();
        });
        textarea.addEventListener('click', () => {
          textarea.focus();
        });

        editorDiv.appendChild(textarea);
        container.appendChild(editorDiv);

        mockEditor.setValue.mockImplementation((val: string) => {
          isEditorSet = true;
          textarea.value = val;
          isEditorSet = false;
          mockEditor.getValue.mockReturnValue(val);
          mockModel.getValue.mockReturnValue(val);
          contentChangeCb?.({});
        });

        mockEditor.focus.mockImplementation(() => {
          textarea.focus();
        });

        return mockEditor;
      }),
      setModelLanguage: vi.fn(),
    };

    this._monaco = {
      editor: mockEditorNamespace,
      languages: {},
    } as any;
  }

  monacoLoaded(): Promise<MonacoAPI> {
    return Promise.resolve(this._monaco);
  }
}


@Component({
    selector: 'wrapper',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgxMonacoEditorComponent,
    ],
    template: `
    <ngx-monaco-editor #ngx1 data-testid="editor-1"
                       [(value)]="code"
                       [language]="'typescript'"
                       [options]="{automaticLayout:false,minimap:{enabled:false},lineNumbers: 'off',contextmenu: true,wordBasedSuggestions:'currentDocument', wordWrap:'on'}"
                       [theme]="'vs'"
                       (editorInitialized)="editorInitialized($event)"
                       (focus)="onFocus()"
                       (blur)="onBlur()"
                       style="height: 120px"
    ></ngx-monaco-editor>


    <ngx-monaco-editor data-testid="editor-2"
                       style="height: 120px"
    ></ngx-monaco-editor>
  `
})
export class WrapperComponent {
  code = model("");
  events: string[] = [];
  editor?: StandaloneCodeEditor;
  monaco?: MonacoAPI;
  ngxEditor = viewChild<NgxMonacoEditorComponent>("ngx1");

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

describe("NgxMonacoEditorComponent Spec", () => {

  let fixture: ComponentFixture<WrapperComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WrapperComponent,
        NgxMonacoEditorComponent
      ],
      providers: [
        provideZonelessChangeDetection(),
        {provide: NGX_MONACO_LOADER_PROVIDER, useClass: MockMonacoLoader}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WrapperComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    const monacoLoader = TestBed.inject(NGX_MONACO_LOADER_PROVIDER);
    await monacoLoader.monacoLoaded();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should get NgxMonacoEditorHarness by testid", async () => {
    const ngxMonaco = await loader.getHarnessOrNull(NgxMonacoEditorHarness.with({testid: "editor-2"}));
    expect(ngxMonaco).toBeDefined();
  });

  it("should get focus", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBe(true);
  });

  it("should get focus by click", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.click();
    expect(await ngxMonaco.isFocused()).toBe(true);
  });

  it("should blur", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBe(true);

    await ngxMonaco.blur();
    expect(await ngxMonaco.isFocused()).toBe(false);
  });

  it("should send keys", async () => {
    const theCode = `$max(12, 20, 1) + $min(1110, 2, 4) + $avg(324, 32, 342)`;

    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.setValue(theCode);
    expect(fixture.componentInstance.code()).toBe(theCode);
  });

  it("should get text", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.setValue(theCode);
    expect(await ngxMonaco.getText()).toBe(theCode);
  });
});
