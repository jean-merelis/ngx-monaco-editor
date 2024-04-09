import {InjectionToken} from "@angular/core";

export interface MonacoLoader {
  monacoLoaded(): Promise<void>;
}

export const NGX_MONACO_LOADER_PROVIDER = new InjectionToken<MonacoLoader>("NGX_MONACO_LOADER_PROVIDER");

export class DefaultMonacoLoader implements MonacoLoader {
  private monacoPromise?: Promise<void>;

  constructor(loadOnCreate = true) {
    if (loadOnCreate) {
      this.createPromise();
    }
  }

  monacoLoaded(): Promise<void> {
    if (!this.monacoPromise) {
      this.createPromise();
    }
    return this.monacoPromise!;
  }

  private createPromise(): void {
    this.monacoPromise = new Promise<void>((resolve, reject) => {
      if (typeof ((<any>window).monaco) === 'object') {
        resolve();
        return
      }

      const onError = (err: any) => reject(err);

      /*
       I'm looking for a better solution.
       I had troubles using require and import()
      */
      const loadEditorMain = () => {
        const editorScript: HTMLScriptElement = document.createElement('script');
        editorScript.onerror = onError;
        editorScript.onload = () => {
          // Necessary to give the script time to execute.
          this.resolveWhenMonacoIsLoaded(resolve, 20);
        };
        editorScript.type = 'text/javascript';
        editorScript.src = `/vs/editor/editor.main.js`;
        document.body.appendChild(editorScript);
      }

      const loadLoader = () => {
        const loaderScript: HTMLScriptElement = document.createElement('script');
        loaderScript.onerror = onError;
        loaderScript.onload = loadEditorMain;
        loaderScript.type = 'text/javascript';
        loaderScript.src = `/vs/loader.js`;
        document.body.appendChild(loaderScript);
      };

      loadLoader();
    });
  }

  private resolveWhenMonacoIsLoaded(resolve: (value?: (PromiseLike<void> | void )) => void, time: number): void {
    time = Math.min(1000, time);
    setTimeout(() => {
      if (!(<any>window).monaco) {
        this.resolveWhenMonacoIsLoaded(resolve, time + 20);
      } else {
        resolve();
      }
    }, time);
  }

}

