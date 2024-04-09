import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NgxMonacoEditorComponent, DefaultMonacoLoader, NGX_MONACO_LOADER_PROVIDER} from "@jean-merelis/ngx-monaco-editor";
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
    {provide: NGX_MONACO_LOADER_PROVIDER, useClass: DefaultMonacoLoader}
  ]
})
export class AppComponent {
   code: string = "const helloWorld = () => 'Hello world';"
   events: string[] = [];

  editorInitialized(editor: any){
    this.events.push("editorInitialized");
  }

  onFocus(){
    this.events.push("focus");
  }

  onBlur(){
    this.events.push("blur");
  }

}
