import Promise from 'pinkie';
import jimp from 'jimp';
import BaseBackend from './base';
import requestApiBase from '../utils/request-api';
import createBrowserstackStatus from '../utils/create-browserstack-status';


const API_POLLING_INTERVAL = 80000;

const BROWSERSTACK_API_PATHS = {
    browserList: {
        url: 'https://api.browserstack.com/automate/browsers.json'
    },

    newSession: {
        url:    'http://hub-cloud.browserstack.com/wd/hub/session',
        method: 'POST'
    },

    openUrl: id => ({
        url:    `http://hub-cloud.browserstack.com/wd/hub/session/${id}/url`,
        method: 'POST'
    }),

    getWindowSize: id => ({
        url: `http://hub-cloud.browserstack.com/wd/hub/session/${id}/window/current/size`
    }),

    setWindowSize: id => ({
        url:    `http://hub-cloud.browserstack.com/wd/hub/session/${id}/window/current/size`,
        method: 'POST'
    }),

    maximizeWindow: id => ({
        url:    `http://hub-cloud.browserstack.com/wd/hub/session/${id}/window/current/maximize`,
        method: 'POST'
    }),

    getUrl: id => ({
        url: `http://hub-cloud.browserstack.com/wd/hub/session/${id}/url`
    }),

    deleteSession: id => ({
        url:    `http://hub-cloud.browserstack.com/wd/hub/session/${id}`,
        method: 'DELETE'
    }),

    screenshot: id => ({
        url: `http://hub-cloud.browserstack.com/wd/hub/session/${id}/screenshot`
    }),

    getStatus: id => ({
        url: `https://api.browserstack.com/automate/sessions/${id}.json`
    }),

    setStatus: id => ({
        url:    `https://api.browserstack.com/automate/sessions/${id}.json`,
        method: 'PUT'
    })
};


function requestApi (path, params) {
    return requestApiBase(path, params)
        .then(response => {
            if (response.status)
                throw new Error(`API error ${response.status}: ${response.value.message}`);

            return response;
        });
}

function getCorrectedSize (currentClientAreaSize, currentWindowSize, requestedSize) {
    var horizontalChrome = currentWindowSize.width - currentClientAreaSize.width;
    var verticalChrome   = currentWindowSize.height - currentClientAreaSize.height;

    return {
        width:  requestedSize.width + horizontalChrome,
        height: requestedSize.height + verticalChrome
    };
}

export default class AutomateBackend extends BaseBackend {
    constructor (...args) {
        super(...args);

        this.sessions = {};
    }

    async _requestSessionUrl (id) {
        var sessionInfo = await requestApiBase(BROWSERSTACK_API_PATHS.getStatus(this.sessions[id].sessionId));

        return sessionInfo['automation_session']['browser_url'];
    }

    async _requestCurrentWindowSize (id) {
        var currentWindowSizeData = await requestApi(BROWSERSTACK_API_PATHS.getWindowSize(this.sessions[id].sessionId));

        return {
            width:  currentWindowSizeData.value.width,
            height: currentWindowSizeData.value.height
        };
    }

    async getBrowsersList () {
        var platformsInfo = await requestApiBase(BROWSERSTACK_API_PATHS.browserList);

        return platformsInfo.reverse();
    }

    getSessionUrl (id) {
        return this.sessions[id] ? this.sessions[id].sessionUrl : '';
    }

    async openBrowser (id, pageUrl, capabilities) {
        var { localIdentifier, local, ...restCapabilities } = capabilities;

        capabilities = {
            'browserstack.localIdentifier': localIdentifier,
            'browserstack.local':           local,
            ...restCapabilities
        };

        this.sessions[id] = await requestApi(BROWSERSTACK_API_PATHS.newSession, {
            body: { desiredCapabilities: capabilities },

            executeImmediately: true
        });

        this.sessions[id].sessionUrl = await this._requestSessionUrl(id);

        var sessionId = this.sessions[id].sessionId;

        this.sessions[id].interval = setInterval(() => requestApi(BROWSERSTACK_API_PATHS.getUrl(sessionId), { executeImmediately: true }), API_POLLING_INTERVAL);

        await requestApi(BROWSERSTACK_API_PATHS.openUrl(sessionId), { body: { url: pageUrl } });
    }

    async closeBrowser (id) {
        clearInterval(this.sessions[id].interval);

        await requestApi(BROWSERSTACK_API_PATHS.deleteSession(this.sessions[id].sessionId));
    }

    async takeScreenshot (id, screenshotPath) {
        return new Promise(async (resolve, reject) => {
            var base64Data = await requestApi(BROWSERSTACK_API_PATHS.screenshot(this.sessions[id].sessionId));
            var buffer     = Buffer.from(base64Data.value, 'base64');

            jimp
                .read(buffer)
                .then(image => image.write(screenshotPath, resolve))
                .catch(reject);
        });
    }

    async resizeWindow (id, width, height, currentWidth, currentHeight) {
        var sessionId             = this.sessions[id].sessionId;
        var currentWindowSize     = await this._requestCurrentWindowSize(id);
        var currentClientAreaSize = { width: currentWidth, height: currentHeight };
        var requestedSize         = { width, height };
        var correctedSize         = getCorrectedSize(currentClientAreaSize, currentWindowSize, requestedSize);

        await requestApi(BROWSERSTACK_API_PATHS.setWindowSize(sessionId), { body: correctedSize });
    }

    async maximizeWindow (id) {
        await requestApi(BROWSERSTACK_API_PATHS.maximizeWindow(this.sessions[id].sessionId));
    }

    async reportJobResult (id, jobResult, jobData, possibleResults) {
        var sessionId = this.sessions[id].sessionId;
        var jobStatus = createBrowserstackStatus(jobResult, jobData, possibleResults);

        await requestApiBase(BROWSERSTACK_API_PATHS.setStatus(sessionId), { body: jobStatus });
    }
}
