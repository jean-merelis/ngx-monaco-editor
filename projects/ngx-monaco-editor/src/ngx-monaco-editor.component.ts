import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken, Injector,
  input,
  model,
  NgZone,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {FormValueControl} from '@angular/forms/signals';
import {DOCUMENT} from "@angular/common";
import {MonacoAPI, NGX_MONACO_LOADER_PROVIDER} from "./monaco-loader";
import {editor as monacoEditor} from 'monaco-editor/esm/vs/editor/editor.api';
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
  monaco: MonacoAPI
}

export interface NgxMonacoEditorConfig {
  defaultOptions?: StandaloneEditorConstructionOptions;
}

export const NGX_MONACO_EDITOR_CONFIG = new InjectionToken<NgxMonacoEditorConfig>("NGX_MONACO_EDITOR_CONFIG");

@Component({
  selector: 'ngx-monaco-editor',
  template: `
    <div class="ngx-editor-container" #editorContainer [style]="editorStyle()">
      @if (monacoLoadFailed()) {
        Monaco was not loaded correctly.
      }
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
      }
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMonacoEditorComponent),
      multi: true,
    },
  ]
})
export class NgxMonacoEditorComponent implements OnInit, OnDestroy, ControlValueAccessor, FormValueControl<string>  {

  readonly value = model<string>('');
  readonly options = input<Omit<StandaloneEditorConstructionOptions, "value" | "language" | "theme">>({});

  /**
   * language used in editor
   * default: typescript
   */
  readonly language = input<string | undefined>('typescript');
  readonly editorStyle = input<{ [p: string]: any } | null | undefined>({
    width: "100%",
    height: "100%",
    border: "1px solid grey"
  });

  /**
   * Theme to be applied to editor
   * default: vs
   */
  readonly theme = input<string | undefined>('vs');

  /**
   * See here for key bindings https://microsoft.github.io/monaco-editor/api/enums/monaco.keycode.html
   * Sets the KeyCode for shortcutting to Fullscreen mode
   */
  readonly fullScreenKeyBinding = input<number[]>();


  readonly editorInitialized = output<EditorInitializedEvent>()
  readonly onFocus = output<void>({alias: "focus"});
  readonly onBlur = output<void>({alias: "blur"});

  protected readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');
  protected readonly focused = signal<boolean>(false);
  protected readonly monacoLoadFailed = signal(false);

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly monacoLoader = inject(NGX_MONACO_LOADER_PROVIDER);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly config = inject(NGX_MONACO_EDITOR_CONFIG, {optional: true})
  private readonly injector = inject(Injector)
  private editor?: StandaloneCodeEditor;
  private resizeObserver?: ResizeObserver;
  private propagateChange = noop;
  private onTouched = noop;
  private _monaco!: MonacoAPI;

  constructor() {
    effect(() => {
      const val = this.value() ?? "";
      if (this.editor && this.editor.getValue() !== val) {
        this.editor.setValue(val);
      }
    });

    effect(() => {
      const theme = this.theme();
      if (this.editor && theme) {
        this.editor.updateOptions({theme});
      }
    });

    effect(() => {
      const language = this.language();
      if (this.editor && this.editor.getModel() && language) {
        this._monaco.editor.setModelLanguage(this.editor.getModel()!, language);
      }
    });

    effect(() => {
      const options = this.options();
      if (this.editor) {
        this.editor.updateOptions(options);
      }
    });
  }

  ngOnInit(): void {
    this.monacoLoader.monacoLoaded().then((m) => {
      this._monaco = m;
      const containerDiv: HTMLDivElement = this.editorContainer().nativeElement;

      const options = Object.assign(
        {},
        this.deepCopyOrEmpty(this.config?.defaultOptions),
        this.options(),
        {
          value: this.value(),
          language: this.language(),
          theme: this.theme(),
        });

      this.zone.runOutsideAngular(() => {
        this.editor = this._monaco.editor.create(containerDiv, options);

        this.editor.getModel()?.onDidChangeContent((e) => {
          this.zone.run(() => {
            const value = this.editor!.getValue();
            this.value.set(value);
            this.propagateChange(value);
          });
        });

        this.editor.onDidFocusEditorWidget(() => {
          this.zone.run(() => {
            this.focused.set(true);
            this.onFocus.emit()
          });
        });
        this.editor.onDidBlurEditorWidget(() => {
          this.zone.run(() => {
            this.focused.set(false);
            this.onTouched();
            this.onBlur.emit()
          });
        });
      });
      Promise.resolve().then(() => {
        this.editorInitialized.emit({
          editor: this.editor!,
          monaco: this._monaco
        });
      });
      this.addFullScreenModeCommand();
      this.resizeObserver = new ResizeObserver(() => {
        this.layout();
      });
      this.resizeObserver.observe(this.document.documentElement);
      this.resizeObserver.observe(this.elementRef.nativeElement);
    })
      .catch(() => this.monacoLoadFailed.set(true));
  }

  focus(): void {
    if (this.editor) {
      this.editor.focus();
    }
  }

  private deepCopyOrEmpty(obj: StandaloneEditorConstructionOptions | undefined): StandaloneEditorConstructionOptions {
    if (!obj) {
      return {};
    }
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Implemented as part of ControlValueAccessor.
   */
  writeValue(value: any): void {
    this.value.set(value ?? "");
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }


  /**
   * layout method that calls layout method of editor and instructs the editor to remeasure its container
   */
  protected layout(): void {
    if (this.editor) {
      this.editor.layout();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.editor) {
      this.editor.dispose();
    }
  }

  public showFullScreenEditor(): void {
    if (this.editor) {
      const codeEditorElement: HTMLDivElement = this.editorContainer().nativeElement as HTMLDivElement;
      codeEditorElement.requestFullscreen();
    }
  }

  /**
   * exitFullScreenEditor request to exit full screen of Code Editor based on its browser type.
   */
  public exitFullScreenEditor(): void {
    if (this.editor) {
      this.document.exitFullscreen();
    }
  }

  /**
   * addFullScreenModeCommand used to add the fullscreen option to the context menu
   */
  private addFullScreenModeCommand(): void {
    this.editor?.addAction({
      // An unique identifier of the contributed action.
      id: 'fullScreen',
      // A label of the action that will be presented to the user.
      label: 'Full Screen',
      // An optional array of keybindings for the action.
      contextMenuGroupId: 'navigation',
      keybindings: this.fullScreenKeyBinding(),
      contextMenuOrder: 1.5,
      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: (ed: any) => {
        this.showFullScreenEditor();
      },
    });
  }


}
