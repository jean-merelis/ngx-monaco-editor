import {InjectionToken} from "@angular/core";
import {editor, languages} from 'monaco-editor/esm/vs/editor/editor.api';

export interface MonacoAPI {
  editor: typeof editor,
  languages: typeof languages;
}

export interface MonacoLoader {
  monacoLoaded(): Promise<MonacoAPI>;
}


export const NGX_MONACO_LOADER_PROVIDER = new InjectionToken<MonacoLoader>("NGX_MONACO_LOADER_PROVIDER");

export class DefaultMonacoLoader implements MonacoLoader {
  private monacoPromise?: Promise<MonacoAPI>;
  private config: any

  constructor(config: any = {paths: {vs: 'vs'}}, loadOnCreate = true) {
    if (loadOnCreate) {
      this.createPromise();
    }
  }

  monacoLoaded(): Promise<MonacoAPI> {
    if (!this.monacoPromise) {
      this.createPromise();
    }
    return this.monacoPromise!;
  }

  private createPromise(): void {
    this.monacoPromise = new Promise<MonacoAPI>((resolve, reject) => {
      if (typeof ((<any>window).monaco) === 'object') {
        resolve((<any>window).monaco);
        return
      }

      const loadLoader = () => {
        const loaderScript: HTMLScriptElement = document.createElement('script');
        loaderScript.onerror = reject;
        loaderScript.onload = () => {
          setTimeout(() => {
            (<any>window).require.config(this.config);

            (<any>window).require(
              ['vs/editor/editor.main'],
              function (monaco: MonacoAPI) {
                resolve(monaco);
              },
              function (error: any) {
                reject(error);
              },
            );
          }, 100);

        };
        loaderScript.type = 'text/javascript';
        loaderScript.src =  (this.config?.paths?.vs) ? `${this.config.paths.vs}/loader.js` : `/vs/loader.js`;
        document.body.appendChild(loaderScript);
      };

      loadLoader();
    });
  }
}

