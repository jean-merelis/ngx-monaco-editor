# NgxMonacoEditor is a  Monaco Editor Component for Angular.

Supports all the options available in monaco-editor [Monaco Editor Options](https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html)

We will try to follow the MAJOR.MINOR versions of Angular to make it easier to identify compatibility. That's why our lib started with version 17 and not 1.

- Angular 17.3 => v17.3.x
- Angular 18 => v18.x.x
- Angular 19 => v19.x.x


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

You can provide your own configuration for `DefaultMonacoLoader`, but don't forget to change angular.json as well.
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
export class AppComponent {
}
```


### Global Editor configuration
You can provide a global configuration for yours editors.

````typescript
export interface NgxMonacoEditorConfig {
  defaultOptions?: StandaloneEditorConstructionOptions;
  runInsideNgZone?: boolean
}
````

```typescript

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    NgxMonacoEditorComponent
  ],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {
        runInsideNgZone: false,
        defaultOptions: {
          minimap: {enabled: true}
        }
      }
    }
  ]
})
export class AppComponent {
}
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
    {provide: NGX_MONACO_LOADER_PROVIDER, useFactory: () => new DefaultMonacoLoader()}
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


## Testing

When testing components that use the Monaco Editor, you have two approaches:


### 1. Testing with NgxMonacoEditorHarness (Real Editor)

This approach uses the actual Monaco Editor in your tests. While it provides complete integration testing, it requires more setup and can make tests slower and more complex due to Monaco Editor's initialization process.


#### Testing with NgxMonacoEditorHarness

```typescript
import { NgxMonacoEditorHarness, MonacoEditorHarnessFilters } from "@jean-merelis/ngx-monaco-editor/testing";
 ```

Harness for interacting with NgxMonacoEditor in tests.

You may want to run your tests with fakeAsync, so you need to configure to run Monaco Editor inside NgZone.
Then, in the last line of the test, call the `discardPeriodicTasks()` function

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
    <ngx-monaco-editor [(value)]="code" data-testid="editor-1"
                       style="height: 120px"
    ></ngx-monaco-editor>

    <ngx-monaco-editor [(value)]="code2" data-testid="editor-2"
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
        {provide: NGX_MONACO_LOADER_PROVIDER, useFactory: () => new DefaultMonacoLoader()},

        // If you need to run your tests with fakeAsync then run inside NgZone
        {provide: NGX_MONACO_EDITOR_CONFIG, useValue: {runInsideNgZone: true}}
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
    await ngxMonaco.setValue(theCode);
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


### 2. Testing with NgxMonacoEditorFakeComponent (Recommended)

Due to Monaco Editor's complexity, we recommend using `NgxMonacoEditorFakeComponent` for most testing scenarios. This fake component provides a lightweight alternative that:

- Reduces test complexity
- Improves test performance
- Eliminates Monaco Editor initialization overhead
- Makes tests more stable and predictable
  
### Advantages of Using the Fake Component

 1. **Faster Tests**: No need to wait for Monaco Editor initialization
 2. **Simpler Setup**: No need to configure Monaco loader or assets
 3. **Better Isolation**: Tests focus on component logic rather than Monaco Editor implementation
 4. **Predictable Behavior**: Mock responses are controlled and consistent
 5. **Easier Debugging**: Less complexity means easier-to-debug tests

Choose `NgxMonacoEditorFakeComponent` when:

 - You're primarily testing component logic
 - You don't need to test Monaco Editor-specific features
 - You want faster, more reliable tests
 - You're writing unit tests

Use `NgxMonacoEditorHarness` when:

 - You need to test specific Monaco Editor features
 - You're writing integration tests
 - You need to verify Monaco Editor-specific behavior

By default, we recommend starting with the fake component for your tests and only using the real editor harness when specifically needed for integration testing.

#### Setup with Fake Component

If your component imports `NgxMonacoEditorComponent` directly, you'll need to override it in your tests to use the fake component instead:

```typescript
import { NgxMonacoEditorComponent, NgxMonacoEditorFakeComponent, NgxMonacoEditorFakeHarness } from "@jean-merelis/ngx-monaco-editor/testing";

@Component({
  selector: 'your-component',
  standalone: true,
  imports: [NgxMonacoEditorComponent], // Real component in production
  template: `
    <ngx-monaco-editor [(value)]="code"></ngx-monaco-editor>
  `
})
class YourComponent {
  code = '';
}
```

Then you need to replace the component using `overrideComponent`

```typescript
describe("YourComponent", () => {
  let fixture: ComponentFixture<YourComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent]
    })
    .overrideComponent(YourComponent, {
      remove: { imports: [NgxMonacoEditorComponent] },
      add: { imports: [NgxMonacoEditorFakeComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });


  it("should handle value changes", async () => {
    const fakeEditor = await loader.getHarness(NgxMonacoEditorFakeHarness);
    const theCode = "const helloWorld = () => 'Hello world';";
    await fakeEditor.setValue(theCode);
    expect(await fakeEditor.getText()).toBe(theCode);
    expect(fixture.componentInstance.code).toBe(theCode);
  });
});
```


### Customizing Mock Behavior

By default, the fake component provides basic functionality for most test scenarios. However, if your component directly interacts with the Monaco Editor instance (through `editorInitialized` event), you might need to customize the mock behavior:

```typescript
import { MOCK_MONACO_EDITOR_CONFIG } from "@jean-merelis/ngx-monaco-editor/testing";

// Example of a component that uses Monaco Editor instance directly
@Component({
  template: `
    <ngx-monaco-editor
      [(ngModel)]="code"
      (editorInitialized)="onEditorInitialized($event)"
    ></ngx-monaco-editor>
  `
})
class EditorComponent {
  onEditorInitialized(event: EditorInitializedEvent) {
    // Direct interaction with Monaco Editor
    event.editor.updateOptions({ readOnly: true });
    event.monaco.languages.register({ id: 'myLang' });
  }
}
```

You can customize the mock behavior by providing a configuration through the MOCK_MONACO_EDITOR_CONFIG token:

```typescript
/**
 * You can see a complete example of how to mock the monaco editor in
 * projects/ngx-monaco-editor/testing/src/ngx-monaco-editor-fake.component.spec.ts
 */

import { MOCK_MONACO_EDITOR_CONFIG } from "@jean-merelis/ngx-monaco-editor/testing";

// Test setup with custom mock configuration
describe("YourComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent, NgxMonacoEditorFakeComponent],
      providers: [{
        provide: MOCK_MONACO_EDITOR_CONFIG,
        useValue: {
          initializedEvent: {
            editor: {
              updateOptions: jasmine.createSpy('updateOptions'),
              // ... other methods used by your component
            },
            monaco: {
              languages: {
                register: jasmine.createSpy('register')
              }
            }
          }
        }
      }]
    }).compileComponents();
  });

  it('should configure editor on initialization', async () => {
    const config = TestBed.inject(MOCK_MONACO_EDITOR_CONFIG);
    expect(config.initializedEvent.editor.updateOptions)
      .toHaveBeenCalledWith({ readOnly: true });
    expect(config.initializedEvent.monaco.languages.register)
      .toHaveBeenCalledWith({ id: 'myLang' });
  });
});


```

Note: If your component only uses the basic editor features (like ngModel or form control integration), you don't need to provide custom mock configuration.
