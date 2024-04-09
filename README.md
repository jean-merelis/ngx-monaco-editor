# NgxMonacoEditor is a  Monaco Editor Component for Angular.

Supports all the options available in monaco-editor [Monaco Editor Options](https://microsoft.github.io/monaco-editor/api/index.html)


Angular 17 => v17.x.x


## Setup

### Installation

Install from npm repository:
```
npm install monaco-editor @jean-merelis/ngx-monaco-editor --save
 ```

#### Provide a `MonacoLoader`

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
import {NgxMonacoEditorComponent, DefaultMonacoLoader, NGX_MONACO_LOADER_PROVIDER} from "@jean-merelis/ngx-monaco-editor";

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
Output event (editorInitialized) expose editor instance that can be used for performing custom operations on the editor.
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
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code: string = 'function helloWorld() {\nconsole.log("Hello world!");\n}';
  events: string[] = [];
  
  editorInitialized(editor) {
    this.events.push("editorInitialized");
    let line = editor.getPosition();
    console.log(line);
  }

  onFocus() {
    this.events.push("focus");
  }

  onBlur() {
    this.events.push("blur");
  }
}
```

