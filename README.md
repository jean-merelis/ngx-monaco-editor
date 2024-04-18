# NgxMonacoEditor is a  Monaco Editor Component for Angular.

Supports all the options available in monaco-editor [Monaco Editor Options](https://microsoft.github.io/monaco-editor/api/index.html)

We will try to follow the MAJOR.MINOR versions of Angular to make it easier to identify compatibility. That's why our lib started with version 17 and not 1.

Angular 17.3 => v17.3.x


## Setup

### Installation

Install from npm repository:
```
npm install monaco-editor @jean-merelis/ngx-monaco-editor --save
 ```

### Provide a `MonacoLoader`

You can use `DefaultMonacoLoader` or create your own loader implementing the `MonacoLoader` interface.

`DefaultMonacoLoader` expects Monaco to be in the 'vs' folder of your domain. Ie. `http://localhost:4200/vs/`
For that add the following snipt in `angular.json`

```json
{
  "apps": [
    {
      "assets": [
        { "glob": "**/*",
          "input": "node_modules/monaco-editor/min/vs",
          "output": "vs"
        },
      ],
    }
  ],
}
 ```

You can provide your own configuration for `DefaultMonacoLoader`, but don't forget to change angular.js as well.
```typescript
// providing your own configuration
const monacoLoader = new DefaultMonacoLoader({paths: {vs: 'path/to/vs'}});

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    FormsModule, ReactiveFormsModule,
    NgxMonacoEditorComponent
  ],
  providers: [
    {provide: NGX_MONACO_LOADER_PROVIDER, useValue: monacoLoader} // <<<
  ]
})
export class AppComponent {}
```


### Sample
Include NgxMonacoEditorComponent in the `imports` of the component or module where you want to use the editor. (eg: app.module.ts). Add the provide the `MonacoLoader`:

```typescript
import {Component} from '@angular/core';
import {
  DefaultMonacoLoader,
  EditorInitializedEvent,
  NgxMonacoEditorComponent,
  NGX_MONACO_LOADER_PROVIDER
} from "@jean-merelis/ngx-monaco-editor";

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    NgxMonacoEditorComponent
  ],
  providers: [
    {provide: NGX_MONACO_LOADER_PROVIDER, useClass: DefaultMonacoLoader}
  ]
})
export class AppComponent {
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code: string = 'function helloWorld() {\nconsole.log("Hello world!");\n}';
}
```

```html
 <ngx-monaco-editor [options]="editorOptions" [(ngModel)]="code"></ngx-monaco-editor>
```



### Events
The output event (editorInitialized) emits an EditorInitializedEvent that exposes the editor instance, languages, and worker objects from Monaco API
which can be used to perform custom operations in the editor.
```html
<ngx-monaco-editor #editor [options]="editorOptions" [(ngModel)]="code"
                   (editorInitialized)="editorInitialized($event)"
                   (focus)="onFocus()"
                   (blur)="onBlur()"
></ngx-monaco-editor>

<button type="button" (click)="editor.focus()">Set focus in the editor</button>
```

```typescript
export class AppComponent {
  editorOptions = {theme: 'vs-dark', language: 'typescript'};
  code: string = "const helloWorld = () => 'Hello world';"
  events: string[] = [];

  // Object from Monaco API
  private editor: any;
  private monaco: any;

  editorInitialized(evt: EditorInitializedEvent) {
    this.events.push("editorInitialized");
    this.editor = evt.editor;
    this.monaco = evt.monaco;
  }

  onFocus() {
    this.events.push("focus");
  }

  onBlur() {
    this.events.push("blur");
  }
}
```


## Testing with NgxMonacoEditorHarness

```typescript
import { NgxMonacoEditorHarness, MonacoEditorHarnessFilters } from "@jean-merelis/ngx-monaco-editor/testing";
 ```

Harness for interacting with NgxMonacoEditor in tests.

Configure your test to wait for monacoLoader to complete. See the example below:

```typescript

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
    <ngx-monaco-editor [(value)]="code"
                       style="height: 120px"
    ></ngx-monaco-editor>

    <ngx-monaco-editor [(value)]="code2"
                       style="height: 120px"
    ></ngx-monaco-editor>
  `
})
export class YourWrapperComponent {
  code = model("");
  code2 = model("");
}

describe("NgxMonacoEditorComponent", () => {

  let fixture: ComponentFixture<YourWrapperComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        YourWrapperComponent,
        NgxMonacoEditorComponent
      ],
      providers: [
        {provide: NGX_MONACO_LOADER_PROVIDER, useClass: DefaultMonacoLoader}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YourWrapperComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    
    // get MonacoLoader instance and wait to complete.
    const monacoLoader = TestBed.inject(NGX_MONACO_LOADER_PROVIDER);
    await monacoLoader.monacoLoaded();
    fixture.detectChanges();
  });

  it("should get NgxMonacoEditorHarness by testid", async () => {
    const ngxMonaco = await loader.getHarnessOrNull(NgxMonacoEditorHarness.with({testid: "editor-2"}));
    expect(ngxMonaco).toBeDefined();
  });

  it("should emit focus event when get focus by click", async () => {
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.focus();
    expect(await ngxMonaco.isFocused()).toBeTrue();
  });

  it("should emit blur event when lose focus", async () => {
    fixture.componentInstance.ngxEditor()?.focus()
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    expect(await ngxMonaco.isFocused()).toBeTrue();

    await ngxMonaco.blur();
    expect(await ngxMonaco.isFocused()).toBeFalse();
  });

  it("should emit value when editor value changes", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";

    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    await ngxMonaco.setVale(theCode);
    expect(fixture.componentInstance.code()).toBe(theCode);
  });

  it("should get text from editor", async () => {
    const theCode = "const helloWorld = () => 'Hello world';";
    fixture.componentInstance.code.set(theCode)
    const ngxMonaco = await loader.getHarness(NgxMonacoEditorHarness);
    expect(await ngxMonaco.getText()).toBe(theCode);
  });
});

```

#### Alternative
You can also use the NxMonacoEditorFakeComponent in your tests. This component does not create a real Monaco editor.
For that, configure the NxMonacoEditorFakeComponent in TestBed, instead NxMonacoEditorComponent.

NxMonacoEditorFakeComponent has your own harness, NxMonacoEditorFakeHarness

```typescript
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        YourWrapperComponent,
        NgxMonacoEditorFakeComponent
      ],

      // >>> this is not necessary for NgxMonacoEditorFakeComponent <<<
      // providers: [
      //   {provide: NGX_MONACO_LOADER_PROVIDER, useClass: DefaultMonacoLoader}
      // ]
    }).compileComponents();

    fixture = TestBed.createComponent(YourWrapperComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    
    // >>> this is not necessary for NgxMonacoEditorFakeComponent <<<
    // const monacoLoader = TestBed.inject(NGX_MONACO_LOADER_PROVIDER);
    // await monacoLoader.monacoLoaded();

    fixture.detectChanges();
  });
```
