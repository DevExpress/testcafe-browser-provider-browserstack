import path from 'path';
import del from 'del';
import { expect } from 'chai';
import { statSync } from 'fs';
import { tmpNameSync as getTempFileName } from 'tmp';


fixture `Screenshot`
    .page('https://google.com')
    .beforeEach(() => del('.screenshots/*'))
    .afterEach(() => del('.screenshots/*'));

test('Take screenshot', async t => {
    var screenshotName = getTempFileName({ template: 'screenshot-XXXXXX.png' });
    var screenshotPath = path.join('.screenshots', screenshotName);

    await t.takeScreenshot(screenshotName);

    expect(statSync(screenshotPath).isFile()).to.be.true;
});
