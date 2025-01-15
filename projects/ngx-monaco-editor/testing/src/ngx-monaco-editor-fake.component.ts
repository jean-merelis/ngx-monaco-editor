import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  inject, InjectionToken,
  input,
  model,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CommonModule, DOCUMENT, NgStyle} from "@angular/common";
import {editor as monacoEditor} from 'monaco-editor/esm/vs/editor/editor.api';
import {NGX_MONACO_LOADER_PROVIDER, NgxMonacoEditorComponent} from "@jean-merelis/ngx-monaco-editor";
import IStandaloneCodeEditor = monacoEditor.IStandaloneCodeEditor;
import IStandaloneEditorConstructionOptions = monacoEditor.IStandaloneEditorConstructionOptions;

export type StandaloneCodeEditor = IStandaloneCodeEditor;
export type StandaloneEditorConstructionOptions = IStandaloneEditorConstructionOptions;

const noop: any = () => {
  // empty method
};

/**
 * Monaco Editor API objects - editor, languages e worker.
 */
export interface EditorInitializedEvent {
  editor: StandaloneCodeEditor;
  monaco: any
}

export interface MockMonacoEditorConfig {
  initializedEvent: EditorInitializedEvent
}

export const MOCK_MONACO_EDITOR_CONFIG = new InjectionToken<MockMonacoEditorConfig>("MOCK_MONACO_EDITOR_CONFIG",
  {
    factory: () => ({initializedEvent: {editor: {} as any, monaco: {} as any}})
  }
);

export function provideMockMonacoEditor(config: MockMonacoEditorConfig = {
  initializedEvent: {
    editor: {} as any,
    monaco: {} as any
  }
}) {
  return {
    provide: MOCK_MONACO_EDITOR_CONFIG,
    useValue: config
  };
}

@Component({
  selector: 'ngx-monaco-editor',
  imports: [
    CommonModule,
    NgStyle,
    FormsModule,
  ],
  template: `
    <div class="ngx-editor-container" #editorContainer [ngStyle]="editorStyle()">
      <textarea #editor [ngModel]="value()" (ngModelChange)="setValue($event)"
                (focus)="changedFocus(true)"
                (blur)="changedFocus(false)">
      </textarea>
    </div>`,
  host: {
    "[class.focused]": "focused()",
    "(click)": "focus()"
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    ngx-monaco-editor {
      display: block;
      position: relative;

      .ngx-editor-container {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;

        textarea {
          height: 100%;
          width: 100%;
        }
      }
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMonacoEditorFakeComponent),
      multi: true,
    },
    {provide: NgxMonacoEditorComponent, useExisting: NgxMonacoEditorFakeComponent}
  ],
  viewProviders: [
    {provide: NgxMonacoEditorComponent, useExisting: NgxMonacoEditorFakeComponent}
  ]
})
export class NgxMonacoEditorFakeComponent implements OnInit, OnChanges, ControlValueAccessor, OnDestroy {


  readonly value = model<string>('');
  readonly options = input<Omit<StandaloneEditorConstructionOptions, "value" | "language" | "theme">>({});
  readonly language = input<string | undefined>('typescript');
  readonly editorStyle = input<{ [p: string]: any } | null | undefined>({
    width: "100%",
    height: "100%",
    border: "1px solid grey"
  });
  readonly theme = input<string | undefined>('vs');
  readonly fullScreenKeyBinding = input<number[]>();


  /**
   * Event emitted when editor is first initialized
   */
  readonly editorInitialized = output<EditorInitializedEvent>()
  readonly onFocus = output<void>({alias: "focus"});
  readonly onBlur = output<void>({alias: "blur"});

  protected readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');
  protected readonly focused = signal<boolean>(false);

  private readonly document = inject(DOCUMENT);
  private editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');
  private propagateChange = noop;
  private onTouched = noop;
  private mockConfig = inject(MOCK_MONACO_EDITOR_CONFIG);

  ngOnInit(): void {
    this.editorInitialized.emit(this.mockConfig.initializedEvent);
  }

  focus(): void {
    this.editor()?.nativeElement?.focus();
  }

  ngOnChanges(changes: SimpleChanges): void {

  }

  protected setValue(value: string): void {
    this.propagateChange(value);
    this.value.set(value);
  }

  writeValue(value: any): void {
    value = value ?? "";
    this.value.set(value);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {

  }

  public showFullScreenEditor(): void {
    const codeEditorElement: HTMLDivElement = this.editorContainer().nativeElement as HTMLDivElement;
    codeEditorElement.requestFullscreen();
  }

  public exitFullScreenEditor(): void {
    this.document.exitFullscreen();
  }

  protected changedFocus(focused: boolean): void {
    if (focused) {
      this.onFocus.emit();
    } else {
      this.onBlur.emit();
    }
    this.focused.set(true);
  }

}
