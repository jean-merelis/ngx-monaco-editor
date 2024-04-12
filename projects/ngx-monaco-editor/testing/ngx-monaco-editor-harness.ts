import {BaseHarnessFilters, ComponentHarness, HarnessPredicate, TestKey} from "@angular/cdk/testing"

export interface MonacoEditorHarnessFilters extends BaseHarnessFilters {
  testid?: string | RegExp;
}

export class NgxMonacoEditorHarness extends ComponentHarness {
  static hostSelector = 'ngx-monaco-editor';

  static with(options: MonacoEditorHarnessFilters): HarnessPredicate<NgxMonacoEditorHarness> {
    return new HarnessPredicate(NgxMonacoEditorHarness, options)
      .addOption('testid', options.testid,
        (harness, text) => HarnessPredicate.stringMatches(harness.getTestid(), text));
  }


  private getMonacoEditorElement = this.locatorFor('.monaco-editor');
  private getMonacoInputAreaElement = this.locatorFor('.inputarea');

  async getTestid(): Promise<string | null> {
    return (await this.host()).getAttribute("data-testid");
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }

  async focus(): Promise<void> {
    return (await this.getMonacoInputAreaElement()).focus();
  }

  async blur(): Promise<void> {
    return (await this.getMonacoInputAreaElement()).blur();
  }

  async isFocused(): Promise<boolean> {
    return (await this.getMonacoEditorElement()).hasClass("focused");
  }

  async getText(): Promise<string> {
    return (await this.getMonacoInputAreaElement()).getProperty('value');
  }

  async sendKeys(...keys: (string | TestKey)[]): Promise<void> {
    const elem = await this.getMonacoInputAreaElement();
    await elem.focus();
    const token = "_&%$@!#_";

    for (let k of keys) {
      if (typeof k === "number") {
        await elem.sendKeys(k);
      } else {
        let s: string = k as string;
        if (
          s.includes('"') ||
          s.includes("'") ||
          s.includes("`") ||
          s.includes("(") ||
          s.includes("{") ||
          s.includes("[")
        ) {

          s = s
            .replaceAll('"', '"' + token)
            .replaceAll("'", "'" + token)
            .replaceAll("`", "`" + token)
            .replaceAll("(", "(" + token)
            .replaceAll("{", "{" + token)
            .replaceAll("[", "[" + token);
          const splited = s.split(token);
          const p = [];
          for (const part of splited) {
            await elem.sendKeys(part, TestKey.DELETE);
          }
        } else {
          await elem.sendKeys(s);
        }
      }
    }
  }
}
