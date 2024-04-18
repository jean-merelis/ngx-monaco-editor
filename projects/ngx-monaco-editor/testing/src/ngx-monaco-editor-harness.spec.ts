import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {Component, model, viewChild} from "@angular/core";
import {EditorInitializedEvent, NgxMonacoEditorComponent, StandaloneCodeEditor} from "../../src/ngx-monaco-editor.component";
import {DefaultMonacoLoader, MonacoAPI, NGX_MONACO_LOADER_PROVIDER} from "../../src/monaco-loader";
import {NgxMonacoEditorHarness} from "./ngx-monaco-editor-harness";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";


@Component({
  selector: 'wrapper',
  standalone: true,
  imports: [
    CommonModule,
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
        {provide: NGX_MONACO_LOADER_PROVIDER, useClass: DefaultMonacoLoader}
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
    expect(await ngxMonaco.isFocused()).toBeTrue();
  });

  it("should get focus by click", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.click();
    expect(await ngxMonaco.isFocused()).toBeTrue();
  });

  it("should blur", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBeTrue();

    await ngxMonaco.blur();
    expect(await ngxMonaco.isFocused()).toBeFalse();
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
