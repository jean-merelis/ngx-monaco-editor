import {BaseHarnessFilters, ComponentHarness, HarnessPredicate, TestKey} from "@angular/cdk/testing"

export interface MonacoEditorFakeHarnessFilters extends BaseHarnessFilters {
  testid?: string | RegExp;
}

export class NgxMonacoEditorFakeHarness extends ComponentHarness {
  static hostSelector = 'ngx-monaco-editor';

  static with(options: MonacoEditorFakeHarnessFilters): HarnessPredicate<NgxMonacoEditorFakeHarness> {
    return new HarnessPredicate(NgxMonacoEditorFakeHarness, options)
      .addOption('testid', options.testid,
        (harness, text) => HarnessPredicate.stringMatches(harness.getTestid(), text));
  }

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
    return (await this.getMonacoInputAreaElement()).isFocused();
  }

  async getText(): Promise<string> {
    return (await this.getMonacoInputAreaElement()).getProperty('value');
  }

  async setValue(value: string): Promise<void> {
    const elem = await this.getMonacoInputAreaElement();
    await elem.focus();
    await elem.sendKeys(value);
  }

}
