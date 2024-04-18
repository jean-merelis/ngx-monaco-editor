import {ChangeDetectorRef, Component, model} from '@angular/core';
import {
  DefaultMonacoLoader,
  NGX_MONACO_LOADER_PROVIDER,
  NgxMonacoEditorComponent
} from "@jean-merelis/ngx-monaco-editor";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";


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
    {provide: NGX_MONACO_LOADER_PROVIDER, useFactory: () => new DefaultMonacoLoader()}
  ]
})
export class AppComponent {
  code = model("const helloWorld = () => 'Hello world';");
  events: string[] = [];

  constructor(private cd: ChangeDetectorRef) {
  }

  editorInitialized(editor: any) {
    this.events.push("editorInitialized");
  }

  onFocus() {
    this.events.push("focus");
  }

  onBlur() {
    this.events.push("blur");
  }
}
