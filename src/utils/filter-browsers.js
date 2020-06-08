const CHROME = 'chrome';
const FIREFOX = 'firefox';

function filterBrowser (browser) {
    const browserVersion = parseFloat(browser.browser_version);

    if (browserVersion < 53.0 && (browser.browser === CHROME || browser.browser === FIREFOX)) 
        return false;
    return true;
}

export default function (browsers) {
    return browsers.filter((browser) => filterBrowser(browser));
} 
