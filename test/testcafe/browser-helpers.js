export async function isMobile (t) {
    const userAgent = await t.eval(() => navigator.userAgent);

    return userAgent.match(/Mobile/i);
}
