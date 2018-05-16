import { expect } from 'chai';
import { saveWindowSize, restoreWindowSize } from '../window-helpers';
import { isMobile } from '../browser-helpers';


fixture `Maximize`
    .page('https://google.com')
    .beforeEach(async t => saveWindowSize(t))
    .afterEach(async t => restoreWindowSize(t));

if (process.env.BROWSERSTACK_USE_AUTOMATE === '1') {
    test('Maximize test', async t => {
        if (await isMobile(t))
            return;

        await t.maximizeWindow();

        var windowDimensions = await t.eval(() => ({
            width:     window.outerWidth,
            height:    window.outerHeight,
            maxWidth:  screen.availWidth,
            maxHeight: screen.availHeight
        }));

        expect(windowDimensions.width).to.be.equal(windowDimensions.maxWidth);
        expect(windowDimensions.height).to.be.equal(windowDimensions.maxHeight);
    });
}

