import { stringify as makeQueryString } from 'querystring';
import Promise from 'pinkie';
import request from 'request-promise';
import parseCapabilities from 'desired-capabilities';
import { Local as BrowserstackConnector } from 'browserstack-local';
import jimp from 'jimp';


const TESTS_TIMEOUT                = 1800;
const BROWSERSTACK_CONNECTOR_DELAY = 10000;

function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createBrowserStackConnector (accessKey) {
    return new Promise((resolve, reject) => {
        var connector = new BrowserstackConnector();

        connector.start({ key: accessKey }, err => {
            if (err) {
                reject(err);
                return;
            }

            setTimeout(() => resolve(connector), BROWSERSTACK_CONNECTOR_DELAY);
        });
    });
}

function destroyBrowserStackConnector (connector) {
    return new Promise((resolve, reject) => {
        connector.stop(err => {
            if (err) {
                reject(err);
                return;
            }

            resolve(connector);
        });
    });
}

function doRequest (url, method = 'GET', params = null, binaryStream = false) {
    if (params)
        url += '?' + makeQueryString(params);

    var opts = {
        auth: {
            user: process.env['BROWSERSTACK_USERNAME'],
            pass: process.env['BROWSERSTACK_ACCESS_KEY'],
        },

        method: method,
        json:   !binaryStream
    };

    if (binaryStream)
        opts.encoding = null;

    return request(url, opts);
}

export default {
    // Multiple browsers support
    isMultiBrowser:   true,
    connectorPromise: Promise.resolve(null),
    workers:          {},
    platformsInfo:    [],
    browserNames:     [],

    _getConnector () {
        this.connectorPromise = this.connectorPromise
            .then(async connector => {
                if (!connector)
                    connector = await createBrowserStackConnector(process.env['BROWSERSTACK_ACCESS_KEY']);

                return connector;
            });

        return this.connectorPromise;
    },

    _disposeConnector () {
        this.connectorPromise = this.connectorPromise
            .then(async connector => {
                if (connector)
                    await destroyBrowserStackConnector(connector);

                return null;
            });

        return this.connectorPromise;
    },

    async _getDeviceList () {
        this.platformsInfo = await doRequest('https://api.browserstack.com/4/browsers?flat=true');

        this.platformsInfo.reverse();
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

        capabilities.timeout = TESTS_TIMEOUT;
        capabilities.url     = pageUrl;
        capabilities.name    = `TestCafe test run ${id}`;

        await this._getConnector();

        this.workers[id]         = await doRequest('https://api.browserstack.com/4/worker', 'POST', capabilities);
        this.workers[id].started = Date.now();
    },

    async closeBrowser (id) {
        var workerTime = Date.now() - this.workers[id].started;

        if (workerTime < 30000) {
            if (workerTime < 20000)
                await doRequest(`https://api.browserstack.com/4/worker/${this.workers[id].id}`, 'DELETE');

            await delay(30000 - workerTime);
        }

        await doRequest(`https://api.browserstack.com/4/worker/${this.workers[id].id}`, 'DELETE');
    },


    // Optional - implement methods you need, remove other methods
    // Initialization
    async init () {
        await this._getDeviceList();

        this._generateBrowserNames();
    },

    async dispose () {
        await this._disposeConnector();
    },


    // Browser names handling
    async getBrowserList () {
        return this.browserNames;
    },

    async isValidBrowserName (browserName) {
        return parseCapabilities(browserName).length === 1 && !!this._filterPlatformInfo(this._createQuery(browserName)).length;
    },


    // Extra methods
    async resizeWindow (/* id, width, height, currentWidth, currentHeight */) {
        this.reportWarning('The window resize functionality is not supported by the "browserstack" browser provider.');
    },

    async takeScreenshot (id, screenshotPath) {
        return new Promise(async (resolve, reject) => {
            var url = `https://api.browserstack.com/4/worker/${this.workers[id].id}/screenshot.png`;

            var buffer = await doRequest(url, 'GET', null, true);

            jimp
                .read(buffer)
                .then(image => image.write(screenshotPath, resolve))
                .catch(reject);
        });
    }
};
