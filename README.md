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
  private languages: any;
  private worker: any;

  editorInitialized(evt: EditorInitializedEvent) {
    this.events.push("editorInitialized");
    this.editor = evt.editor;
    this.languages = evt.languages;
    this.worker = evt.worker;
  }

  onFocus() {
    this.events.push("focus");
  }

  onBlur() {
    this.events.push("blur");
  }
}
```

