import path from 'path';
import del from 'del';
import { expect } from 'chai';
import { statSync, createWriteStream } from 'fs';
import { tmpNameSync as getTempFileName } from 'tmp';


fixture `Screenshot`
    .page('https://google.com')
    .before(() => del('.screenshots/*'))
    .after(() => del('.screenshots/*'));

test('Take screenshot', async t => {
    var screenshotName = getTempFileName({ template: 'screenshot-XXXXXX.png' });
    var screenshotPath = path.join('.screenshots', screenshotName);

    // Creates the tempfile in path
    createWriteStream(screenshotPath).end();

    await t.takeScreenshot(screenshotPath);

    expect(statSync(screenshotPath).isFile()).to.be.true;
});
