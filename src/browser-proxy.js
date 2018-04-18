import http from 'http';
import { parse as parseUrl } from 'url';
import Promise from 'pinkie';


module.exports = class BrowserProxy {
    constructor (targetHost, targetPort, { proxyPort, responseDelay } = {}) {
        this.targetHost    = targetHost;
        this.targetPort    = targetPort;
        this.proxyPort     = proxyPort;
        this.responseDelay = responseDelay || 0;

        this.server = http.createServer((...args) => this._onBrowserRequest(...args));

        this.server.on('connection', socket => socket.unref());
    }

    _onBrowserRequest (req, res) {
        setTimeout(() => {
            const parsedRequestUrl = parseUrl(req.url);
            const destinationUrl   = 'http://' + this.targetHost + ':' + this.targetPort + parsedRequestUrl.path;

            res.statusCode = 302;

            res.setHeader('location', destinationUrl);
            res.end();
        }, this.responseDelay);
    }

    async init () {
        return new Promise((resolve, reject) => {
            this.server.listen(this.proxyPort, err => {
                if (err)
                    reject(err);
                else {
                    this.proxyPort = this.server.address().port;

                    resolve();
                }
            });
        });
    }

    dispose () {
        this.server.close();
    }
};
