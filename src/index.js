import { stringify as makeQueryString } from 'querystring';
import Promise from 'pinkie';
import request from 'request-promise';
import parseCapabilities from 'desired-capabilities';
import { Local as BrowserstackConnector } from 'browserstack-local';
import jimp from 'jimp';
import OS from 'os-family';
import nodeUrl from 'url';

const TESTS_TIMEOUT                = process.env['BROWSERSTACK_TEST_TIMEOUT'] || 1800;
const BROWSERSTACK_CONNECTOR_DELAY = 10000;

const MINIMAL_WORKER_TIME        = 30000;
const TESTCAFE_CLOSING_TIMEOUT   = 10000;
const TOO_SMALL_TIME_FOR_WAITING = MINIMAL_WORKER_TIME - TESTCAFE_CLOSING_TIMEOUT;

const AUTH_FAILED_ERROR = 'Authentication failed. Please assign the correct username and access key ' +
    'to the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.';

const PROXY_AUTH_RE = /^([^:]*):(.*)$/;

const BROWSERSTACK_API_PATHS = {
    browserList: {
        url: 'https://api.browserstack.com/4/browsers?flat=true'
    },

    newWorker: {
        url:    'https://api.browserstack.com/4/worker',
        method: 'POST'
    },

    deleteWorker: id => ({
        url:    `https://api.browserstack.com/4/worker/${id}`,
        method: 'DELETE'
    }),

    screenshot: id => ({
        url:          `https://api.browserstack.com/4/worker/${id}/screenshot.png`,
        binaryStream: true
    })
};

const identity = x => x;

const capitalize = str => str[0].toUpperCase() + str.slice(1);

function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function copyOptions (source, destination, transfromFunc = identity) {
    Object
        .keys(source)
        .forEach(key => source[key] && (destination[transfromFunc(key)] = source[key]));
}

function getProxyOptions (proxyConfig) {
    try {
        var { hostname, port, auth } = nodeUrl.parse('http://' + proxyConfig);
        var parsedAuth               = auth.match(PROXY_AUTH_RE);

        return {
            host: hostname,
            port: port,
            user: parsedAuth && parsedAuth[1],
            pass: parsedAuth && parsedAuth[2]
        };
    }
    catch (e) {
        return {};
    }
}

function createBrowserStackConnector (accessKey) {
    return new Promise((resolve, reject) => {
        var connector = new BrowserstackConnector();

        var opts = {
            key:        accessKey,
            logfile:    OS.win ? 'NUL' : '/dev/null',
            forceLocal: !!process.env['BROWSERSTACK_FORCE_LOCAL'],
            forceProxy: !!process.env['BROWSERSTACK_FORCE_PROXY'],

            //NOTE: additional args use different format
            'enable-logging-for-api': true
        };

        var proxyOptions      = getProxyOptions(process.env['BROWSERSTACK_PROXY']);
        var localProxyOptions = getProxyOptions(process.env['BROWSERSTACK_LOCAL_PROXY']);

        copyOptions(proxyOptions, opts, key => 'proxy' + capitalize(key));
        copyOptions(localProxyOptions, opts, key => 'local-proxy-' + key);

        connector.start(opts, err => {
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

function doRequest (apiPath, params) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(AUTH_FAILED_ERROR);

    var url = apiPath.url;

    if (params)
        url += '?' + makeQueryString(params);

    var opts = {
        auth: {
            user: process.env['BROWSERSTACK_USERNAME'],
            pass: process.env['BROWSERSTACK_ACCESS_KEY'],
        },

        method: apiPath.method || 'GET',
        json:   !apiPath.binaryStream
    };

    if (apiPath.binaryStream)
        opts.encoding = null;

    return request(url, opts)
        .catch(error => {
            if (error.statusCode === 401)
                throw new Error(AUTH_FAILED_ERROR);

            throw error;
        });
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
        this.platformsInfo = await doRequest(BROWSERSTACK_API_PATHS.browserList);

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

        this.workers[id]         = await doRequest(BROWSERSTACK_API_PATHS.newWorker, capabilities);
        this.workers[id].started = Date.now();
    },

    async closeBrowser (id) {
        var workerTime = Date.now() - this.workers[id].started;
        var workerId   = this.workers[id].id;

        if (workerTime < MINIMAL_WORKER_TIME) {
            if (workerTime < TOO_SMALL_TIME_FOR_WAITING)
                await doRequest(BROWSERSTACK_API_PATHS.deleteWorker(workerId));

            await delay(MINIMAL_WORKER_TIME - workerTime);
        }

        await doRequest(BROWSERSTACK_API_PATHS.deleteWorker(workerId));
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
            var buffer = await doRequest(BROWSERSTACK_API_PATHS.screenshot(this.workers[id].id));

            jimp
                .read(buffer)
                .then(image => image.write(screenshotPath, resolve))
                .catch(reject);
        });
    }
};
