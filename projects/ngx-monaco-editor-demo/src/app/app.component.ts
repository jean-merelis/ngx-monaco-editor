import {ChangeDetectorRef, Component, model} from '@angular/core';
import {NgxMonacoEditorComponent, DefaultMonacoLoader, NGX_MONACO_LOADER_PROVIDER} from "@jean-merelis/ngx-monaco-editor";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

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
    {provide: NGX_MONACO_LOADER_PROVIDER, useValue: monacoLoader}
  ]
})
export class AppComponent {
   // code: string = "const helloWorld = () => 'Hello world';"
   code= model("const helloWorld = () => 'Hello world';");
   events: string[] = [];

   constructor(private cd: ChangeDetectorRef) {
   }

  editorInitialized(editor: any){
    this.events.push("editorInitialized");
  }

  onFocus(){
    this.events.push("focus");
  }

  onBlur(){
    this.events.push("blur");
  }

  query: string = '';


  test(): void {
    // const elem = document.querySelector(this.query) as HTMLElement;
    // elem.focus();

    // this.code ="xpto";
    this.code.set(this.query);
    this.cd.markForCheck();
  }
}
