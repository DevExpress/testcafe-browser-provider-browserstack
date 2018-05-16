export default class BaseBackend {
    constructor (reportWarning) {
        this.reportWarning = reportWarning;
    }

    async getBrowsersList () {
        throw new Error('Not implemented');
    }

    async openBrowser (/*id, pageUrl, capabilities*/) {
        throw new Error('Not implemented');
    }

    async closeBrowser (/*id*/) {
        throw new Error('Not implemented');
    }

    async takeScreenshot (/*id, path*/) {
        throw new Error('Not implemented');
    }

    async resizeWindow (/*id, width, height, currentWidth, currentHeight*/) {
        throw new Error('Not implemented');
    }

    async maximizeWindow (/*id*/) {
        throw new Error('Not implemented');
    }

    async reportJobResult (/*id, jobStatus, jobData, possibleStatuses*/) {
        throw new Error('Not implemented');
    }

    getSessionUrl (/*id*/) {
        throw new Error('Not implemented');
    }
}
