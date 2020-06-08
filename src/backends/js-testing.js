import jimp from 'jimp';
import BaseBackend from './base';
import requestApi from '../utils/request-api';
import createBrowserstackStatus from '../utils/create-browserstack-status';
import filterBrowsers from '../utils/filter-browsers';

const TESTS_TIMEOUT = process.env['BROWSERSTACK_TEST_TIMEOUT'] || 1800;

const BROWSERSTACK_API_PATHS = {
    browserList: {
        url: 'https://api.browserstack.com/4/browsers?flat=true'
    },

    newWorker: {
        url:    'https://api.browserstack.com/4/worker',
        method: 'POST'
    },

    getWorkerInfo: id => ({
        url: `https://api.browserstack.com/4/worker/${id}`
    }),

    deleteWorker: id => ({
        url:    `https://api.browserstack.com/4/worker/${id}`,
        method: 'DELETE'
    }),

    screenshot: id => ({
        url:      `https://api.browserstack.com/4/worker/${id}/screenshot.png`,
        encoding: null
    }),

    setStatus: id => ({
        url:    `https://api.browserstack.com/automate/sessions/${id}.json`,
        method: 'PUT'
    })
};

export default class JSTestingBackend extends BaseBackend {
    constructor (...args) {
        super(...args);

        this.workers = {};
    }

    async _requestSessionUrl (id) {
        var workerInfo = await requestApi(BROWSERSTACK_API_PATHS.getWorkerInfo(this.workers[id].id));

        return workerInfo['browser_url'];
    }

    async _getSessionId (id) {
        var sessionIdMatch = this.workers[id].sessionUrl.match(/[^/]*$/);

        return sessionIdMatch && sessionIdMatch[0];
    }

    async getBrowsersList () {
        var platformsInfo = await requestApi(BROWSERSTACK_API_PATHS.browserList);

        return filterBrowsers(platformsInfo.reverse());
    }

    getSessionUrl (id) {
        return this.workers[id] ? this.workers[id].sessionUrl : '';
    }

    async openBrowser (id, pageUrl, capabilities) {
        var { local, ...restCapabilities } = capabilities;

        capabilities = {
            'browserstack.local': local,

            timeout: TESTS_TIMEOUT,
            url:     pageUrl,

            ...restCapabilities
        };

        this.workers[id] = await requestApi(BROWSERSTACK_API_PATHS.newWorker, {
            executeImmediately: true,

            ...capabilities
        });

        this.workers[id].started    = Date.now();
        this.workers[id].sessionUrl = await this._requestSessionUrl(id);
        this.workers[id].sessionId  = await this._getSessionId(id);
    }

    async closeBrowser (id) {
        var workerId   = this.workers[id].id;

        // Return incase of invalid workerId
        if (!workerId || workerId === '')
            return;

        await requestApi(BROWSERSTACK_API_PATHS.deleteWorker(workerId));

    }

    async takeScreenshot (id, screenshotPath) {
        var buffer = await requestApi(BROWSERSTACK_API_PATHS.screenshot(this.workers[id].id));
        var image = await jimp.read(buffer);

        await image.writeAsync(screenshotPath);
    }

    async resizeWindow (id) {
        this.reportWarning(id, 'The window resize functionality is not supported by the Browserstack JS Testing API. Use the Browserstack Automate API.');
    }

    async maximizeWindow (id) {
        this.reportWarning(id, 'The window maximization functionality is not supported by the Browserstack JS Testing API. Use the Browserstack Automate API.');
    }

    async reportJobResult (id, jobResult, jobData, possibleResults) {
        var sessionId = this.workers[id].sessionId;
        var jobStatus = createBrowserstackStatus(jobResult, jobData, possibleResults);

        await requestApi(BROWSERSTACK_API_PATHS.setStatus(sessionId), { body: jobStatus });
    }
}

