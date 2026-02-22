import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {Component, model, provideZonelessChangeDetection, viewChild} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {EditorInitializedEvent, NgxMonacoEditorComponent, StandaloneCodeEditor} from "./ngx-monaco-editor.component";
import {MonacoAPI, NGX_MONACO_LOADER_PROVIDER, MonacoLoader} from "./monaco-loader";
import {NgxMonacoEditorHarness} from "../testing/src";


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
  ngxEditor = viewChild(NgxMonacoEditorComponent);

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

describe("NgxMonacoEditorComponent", () => {

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


  it("should be created", async () => {
    expect(fixture.componentInstance.events.some(evt => evt === "editorInitialized"));
    expect(fixture.componentInstance.editor).toBeDefined();
    expect(fixture.componentInstance.monaco).toBeDefined();
  });

  it("should emit focus event when get focus by click", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBe(true);
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));
    expect(fixture.componentInstance.editor).toBeDefined();
    expect(fixture.componentInstance.monaco).toBeDefined();
  });

  it("should emit focus event when get focus programmatically", async () => {
    fixture.componentInstance.ngxEditor()?.focus()
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    expect(await ngxMonaco.isFocused()).toBe(true);
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));
  });

  it("should emit blur event when lose focus", async () => {
    fixture.componentInstance.ngxEditor()?.focus()
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    expect(await ngxMonaco.isFocused()).toBe(true);
    expect(fixture.componentInstance.events.some(evt => evt === "focus"));

    await ngxMonaco.blur();
    expect(await ngxMonaco.isFocused()).toBe(false);
    expect(fixture.componentInstance.events.some(evt => evt === "blur"));
  });

  it("should emit value when editor value changes", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";

    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.setValue(theCode);
    expect(fixture.componentInstance.code()).toBe(theCode);
  });

  it("should set value on editor when input value changes", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";
    fixture.componentInstance.code.set(theCode)
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    expect(await ngxMonaco.getText()).toBe(theCode);
  });
});
