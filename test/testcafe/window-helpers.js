import { isMobile } from './browser-helpers';


export async function saveWindowSize (t) {
    if (await isMobile(t))
        return;

    t.ctx.windowSize = await t.eval(() => ({ width: window.innerWidth, height: window.innerHeight }));
}

export async function restoreWindowSize (t) {
    if (t.ctx.windowSize)
        await t.resizeWindow(t.ctx.windowSize.width, t.ctx.windowSize.height);
}
