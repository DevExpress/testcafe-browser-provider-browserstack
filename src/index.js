import { parse as parseUrl } from 'url';
import Promise from 'pinkie';
import parseCapabilities from 'desired-capabilities';
import BrowserstackConnector from './connector';
import JSTestingBackend from './backends/js-testing';
import AutomateBackend from './backends/automate';
import BrowserProxy from './browser-proxy';


const BUILD_ID           = process.env['BROWSERSTACK_BUILD_ID'];
const PROJECT_NAME       = process.env['BROWSERSTACK_PROJECT_NAME'];
const DISPLAY_RESOLUTION = process.env['BROWSERSTACK_DISPLAY_RESOLUTION'];

const ANDROID_PROXY_RESPONSE_DELAY = 500;

function isAutomateEnabled () {
    return process.env['BROWSERSTACK_USE_AUTOMATE'] && process.env['BROWSERSTACK_USE_AUTOMATE'] !== '0';
}


export default {
    // Multiple browsers support
    isMultiBrowser: true,

    backend: null,

    connectorPromise:    Promise.resolve(null),
    browserProxyPromise: Promise.resolve(null),

    workers:       {},
    platformsInfo: [],
    browserNames:  [],

    _getConnector () {
        this.connectorPromise = this.connectorPromise
            .then(async connector => {
                if (!connector) {
                    connector = new BrowserstackConnector(process.env['BROWSERSTACK_ACCESS_KEY']);

                    await connector.create();
                }

                return connector;
            });

        return this.connectorPromise;
    },

    _disposeConnector () {
        this.connectorPromise = this.connectorPromise
            .then(async connector => {
                if (connector)
                    await connector.destroy();

                return null;
            });

        return this.connectorPromise;
    },

    _getBrowserProxy (host, port) {
        this.browserProxyPromise = this.browserProxyPromise
            .then(async browserProxy => {
                if (!browserProxy) {
                    browserProxy = new BrowserProxy(host, port, { responseDelay: ANDROID_PROXY_RESPONSE_DELAY });

                    await browserProxy.init();
                }

                return browserProxy;
            });

        return this.browserProxyPromise;
    },

    _disposeBrowserProxy () {
        this.browserProxyPromise = this.browserProxyPromise
            .then(async browserProxy => {
                if (browserProxy)
                    await browserProxy.dispose();

                return null;
            });

        return this.browserProxyPromise;
    },

    async _getDeviceList () {
        this.platformsInfo = await this.backend.getBrowsersList();
    },

    _createQuery (capabilities) {
        var { browserName, browserVersion, platform } = parseCapabilities(capabilities)[0];

        browserName = browserName.toLowerCase();

        if (browserName === 'internet explorer')
            browserName = 'ie';

        return {
            name:     browserName,
            version:  browserVersion.toLowerCase(),
            platform: platform.toLowerCase()
        };
    },

    _generateCapabilities (browserName) {
        return this._filterPlatformInfo(this._createQuery(browserName))[0];
    },

    _filterPlatformInfo (query) {
        return this.platformsInfo
            .filter(info => {
                var browserNameMatched = info['browser'] && info['browser'].toLowerCase() === query.name;
                var deviceNameMatched  = info['device'] && info['device'].toLowerCase() === query.name;

                var browserVersionMatched  = info['browser_version'] && Number(info['browser_version']) === Number(query.version);
                var platformVersionMatched = info['os_version'] && Number(info['os_version']) === Number(query.version);
                var platformNameMatched    = info['os'].toLowerCase() === query.platform ||
                    `${info['os'].toLowerCase()} ${info['os_version'].toLowerCase()}` === query.platform;

                var isAnyVersion  = query.version === 'any';
                var isAnyPlatform = query.platform === 'any';

                var desktopBrowserMatched = browserNameMatched &&
                    (browserVersionMatched || isAnyVersion) &&
                    (platformNameMatched || isAnyPlatform);

                var mobileBrowserMatched = deviceNameMatched &&
                    (platformVersionMatched || isAnyVersion);

                return desktopBrowserMatched || mobileBrowserMatched;
            });
    },

    _generateBrowserNames () {
        this.browserNames = this.platformsInfo
            .map(info => {
                var isDesktop = !info['device'];
                var name      = isDesktop ? info['browser'] : info['device'];
                var version   = isDesktop ? info['browser_version'] : info['os_version'];
                var platform  = isDesktop ? `${info['os']} ${info['os_version']}` : '';

                return `${name}@${version}${platform ? ':' + platform : ''}`;
            });
    },

    // Required - must be implemented
    // Browser control
    async openBrowser (id, pageUrl, browserName) {
        var capabilities = this._generateCapabilities(browserName);
        var connector    = await this._getConnector();

        if (capabilities.os.toLowerCase() === 'android') {
            const parsedPageUrl = parseUrl(pageUrl);
            const browserProxy  = await this._getBrowserProxy(parsedPageUrl.hostname, parsedPageUrl.port);

            pageUrl = 'http://' + browserProxy.targetHost + ':' + browserProxy.proxyPort + parsedPageUrl.path;
        }

        if (PROJECT_NAME)
            capabilities.project = PROJECT_NAME;

        if (BUILD_ID)
            capabilities.build = BUILD_ID;

        if (DISPLAY_RESOLUTION)
            capabilities.resolution = DISPLAY_RESOLUTION;

        capabilities.name            = `TestCafe test run ${id}`;
        capabilities.localIdentifier = connector.connectorInstance.localIdentifierFlag;
        capabilities.local           = true;

        await this.backend.openBrowser(id, pageUrl, capabilities);

        this.setUserAgentMetaInfo(id, this.backend.getSessionUrl(id));
    },

    async closeBrowser (id) {
        await this.backend.closeBrowser(id);
    },

    // Optional - implement methods you need, remove other methods
    // Initialization
    async init () {
        var reportWarning = (...args) => this.reportWarning(...args);

        this.backend = isAutomateEnabled() ? new AutomateBackend(reportWarning) : new JSTestingBackend(reportWarning);

        await this._getDeviceList();

        this._generateBrowserNames();
    },

    async dispose () {
        await this._disposeConnector();
        await this._disposeBrowserProxy();
    },


    // Browser names handling
    async getBrowserList () {
        return this.browserNames;
    },

    async isValidBrowserName (browserName) {
        return parseCapabilities(browserName).length === 1 && !!this._filterPlatformInfo(this._createQuery(browserName)).length;
    },


    // Extra methods
    async resizeWindow (id, width, height, currentWidth, currentHeight) {
        await this.backend.resizeWindow(id, width, height, currentWidth, currentHeight);
    },

    async maximizeWindow (id) {
        await this.backend.maximizeWindow(id);
    },


    async takeScreenshot (id, screenshotPath) {
        await this.backend.takeScreenshot(id, screenshotPath);
    },

    async reportJobResult (id, jobResult, jobData) {
        await this.backend.reportJobResult(id, jobResult, jobData, this.JOB_RESULT);
    }
};
