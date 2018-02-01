import { expect } from 'chai';
import { saveWindowSize, restoreWindowSize } from '../window-helpers';
import { isMobile } from '../browser-helpers';


fixture `Resize`
    .page('https://google.com')
    .beforeEach(async t => saveWindowSize(t))
    .afterEach(async t => restoreWindowSize(t));

if (process.env.BROWSERSTACK_USE_AUTOMATE === '1') {
    test('Resize test', async t => {
        if (await isMobile(t))
            return;

        await t.resizeWindow(500, 500);

        var newSize = await t.eval(() => ({
            width:  window.innerWidth,
            height: window.innerHeight
        }));

        expect(newSize.width).to.be.equal(500);
        expect(newSize.height).to.be.equal(500);
    });
}

