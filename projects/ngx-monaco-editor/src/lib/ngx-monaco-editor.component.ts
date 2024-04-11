import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  inject,
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
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CommonModule, DOCUMENT} from "@angular/common";
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

@Component({
  selector: 'ngx-monaco-editor',
  standalone: true,
  imports: [
    CommonModule,
  ],
  template: `
    <div class="ngx-editor-container" #editorContainer [ngStyle]="editorStyle()">
      @if (monacoLoadFailed()) {
        Monaco was not loaded correctly.
      }
    </div>`,
  host: {
    "[class.focused]": "focused()"
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

      /* hide this part of monaco so it doesnt add height  */

      .monaco-aria-container {
        display: none;
      }
    }
  `,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMonacoEditorComponent),
      multi: true,
    },
  ],
})
export class NgxMonacoEditorComponent implements OnInit, OnChanges, ControlValueAccessor, OnDestroy {


  readonly value = model<string>('');
  readonly options = model<StandaloneEditorConstructionOptions>({});

  /**
   * language used in editor
   * default: typescript
   */
  readonly language = model<string | undefined>('typescript');
  readonly editorStyle = input<{ [p: string]: any } | null | undefined>({
    width: "100%",
    height: "100%",
    border: "1px solid grey"
  });

  /**
   * Theme to be applied to editor
   * default: vs
   */
  readonly theme = model<string | undefined>('vs');

  /**
   * See here for key bindings https://microsoft.github.io/monaco-editor/api/enums/monaco.keycode.html
   * Sets the KeyCode for shortcutting to Fullscreen mode
   */
  readonly fullScreenKeyBinding = input<number[]>();


  /**
   * Event emitted when editor is first initialized
   */
  readonly editorInitialized = output<EditorInitializedEvent>()
  readonly onFocus = output<void>({alias: "focus"});
  readonly onBlur = output<void>({alias: "blur"});

  protected readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');
  protected readonly focused = signal<boolean>(false);
  protected readonly monacoLoadFailed = signal(false);

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly monacoLoader = inject(NGX_MONACO_LOADER_PROVIDER);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private editor?: StandaloneCodeEditor;
  private resizeObserver?: ResizeObserver;
  private propagateChange = noop;
  private onTouched = noop;
  private _monaco!: MonacoAPI;

  ngOnInit(): void {
    this.monacoLoader.monacoLoaded().then((m) => {
      this._monaco = m;
      const containerDiv: HTMLDivElement = this.editorContainer().nativeElement;

      this.zone.runOutsideAngular(() => {
        this.editor = this._monaco.editor.create(
          containerDiv,
          Object.assign(
            {},
            this.options(),
            {
              value: this.value(),
              language: this.language(),
              theme: this.theme(),
            },
          ));

        this.editor.getModel()?.onDidChangeContent((e: any) => {
          this.zone.run(() => {
            this.value.set(this.editor!.getValue());
            this.propagateChange(this.value())
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
        this.applyLanguage();
        this.applyValue();
        this.editorInitialized.emit({
          editor: this.editor!,
          monaco: this._monaco
        });
      });
      this.addFullScreenModeCommand();
      this.resizeObserver = new ResizeObserver(() => {
        this.layout();
        this.cd.markForCheck();
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

  ngOnChanges(changes: SimpleChanges): void {
    if ('value' in changes) {
      this.applyValue();
    }
    if ('theme' in changes) {
      this.applyTheme();
    }
    if ('language' in changes) {
      this.applyLanguage();
    }
    if ('options' in changes) {
      this.applyOptions();
    }
  }

  private applyOptions() {
    if (this.editor) {
      if (this.options().theme) {
        this.theme.set(this.options().theme);
      }
      if (this.options().language) {
        this.language.set(this.options().language);
      }
      if (this.options().value) {
        this.value.set(this.options().value ?? '');
      }
      this.editor.updateOptions(this.options());
    }
  }

  private applyLanguage(): void {
    this.options.update(opt => {
      opt.language = this.language();
      return opt;
    });
    if (this.editor && this.editor.getModel() && this.language()) {
      this._monaco.editor.setModelLanguage(this.editor.getModel()!, this.language()!);
    }
  }

  private applyValue(): void {
    this.options.update(opt => {
      opt.value = this.value() ?? '';
      return opt;
    });
    if (this.editor) {
      this.editor.setValue(this.value() ?? '');
    }
  }

  private applyTheme() {
    this.options.update(opt => {
      opt.theme = this.theme();
      return opt;
    });
    if (this.editor && this.theme()) {
      this.editor.updateOptions({theme: this.theme()});
    }
  }

  /**
   * Implemented as part of ControlValueAccessor.
   */
  writeValue(value: any): void {
    this.value.set(value);
    this.applyValue();
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
  layout(): void {
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
