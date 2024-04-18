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
  private getMonacoInputAreaElement = this.locatorFor('textarea');

  async getTestid(): Promise<string | null> {
    return (await this.host()).getAttribute("data-testid");
  }

  async click(): Promise<void> {
    return (await this.getMonacoInputAreaElement()).click();
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

  async setValue(value: string): Promise<void> {
    const elem = await this.getMonacoInputAreaElement();
    await elem.focus();
    await elem.setInputValue(value);
    await elem.sendKeys(' ', TestKey.BACKSPACE); // to notify changes
  }

}
