import * as ERROR_MESSAGES from '../templates/error-messages';


export default class BaseBackend {
    constructor (reportWarning) {
        this.reportWarning = reportWarning;
    }

    async getBrowsersList () {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async openBrowser (/*id, pageUrl, capabilities*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async closeBrowser (/*id*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async takeScreenshot (/*id, path*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async resizeWindow (/*id, width, height, currentWidth, currentHeight*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async maximizeWindow (/*id*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    async reportJobResult (/*id, jobStatus, jobData, possibleStatuses*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }

    getSessionUrl (/*id*/) {
        throw new Error(ERROR_MESSAGES.API_METHOD_NOT_IMPLEMENTED());
    }
}
