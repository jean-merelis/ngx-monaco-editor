import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {Component, model, viewChild} from "@angular/core";
import {NgClass, NgStyle} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

import {
  EditorInitializedEvent,
  NgxMonacoEditorFakeComponent,
  StandaloneCodeEditor
} from "./ngx-monaco-editor-fake.component";
import {MonacoAPI} from "../src/lib/monaco-loader";
import {NgxMonacoEditorFakeHarness} from "./ngx-monaco-editor-fake-harness";


@Component({
  selector: 'wrapper',
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    FormsModule,
    ReactiveFormsModule,
    NgxMonacoEditorFakeComponent,
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
  ngxEditor = viewChild(NgxMonacoEditorFakeComponent);

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

  let fixture: ComponentFixture<WrapperComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgClass,
        NgStyle,
        WrapperComponent,
        NgxMonacoEditorFakeComponent
      ],

    }).compileComponents();

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
