import Promise from 'pinkie';
import { Local as BrowserstackLocal } from 'browserstack-local';
import OS from 'os-family';
import nodeUrl from 'url';
import tmp from 'tmp';


const BROWSERSTACK_CONNECTOR_DELAY = 10000;

const PROXY_AUTH_RE = /^([^:]*)(?::(.*))?$/;

const identity = x => x;

const capitalize = str => str[0].toUpperCase() + str.slice(1);

function copyOptions (source, destination, transfromFunc = identity) {
    Object
        .keys(source)
        .forEach(key => source[key] && (destination[transfromFunc(key)] = source[key]));
}

function getProxyOptions (proxyConfig) {
    try {
        var { hostname, port, auth } = nodeUrl.parse('http://' + proxyConfig);
        var parsedAuth               = auth && auth.match(PROXY_AUTH_RE);

        return {
            host: hostname === 'undefined' ? null : hostname,
            port: port,
            user: parsedAuth && parsedAuth[1],
            pass: parsedAuth && parsedAuth[2]
        };
    }
    catch (e) {
        return {};
    }
}


export default class BrowserstackConnector {
    constructor (accessKey) {
        this.accessKey         = accessKey;
        this.connectorInstance = null;
        this.tempFileName      = '';
    }

    _getTempFileName () {
        if (!this.tempFileName) {
            tmp.setGracefulCleanup();

            this.tempFileName = tmp.tmpNameSync({ unsafeCleanup: true });
        }

        return this.tempFileName;
    }

    create () {
        return new Promise((resolve, reject) => {
            var connector    = new BrowserstackLocal();
            var parallelRuns = process.env['BROWSERSTACK_PARALLEL_RUNS'];
            var logfile = process.env['BROWSERSTACK_LOGFILE'] || (OS.win ? this._getTempFileName() : '/dev/null');
            var verbose = process.env['BROWSERSTACK_VERBOSE'];
            var binarypath = process.env['BROWSERSTACK_BINARY_PATH'];

            var opts = {
                key:             this.accessKey,
                logfile,
                forceLocal:      !!process.env['BROWSERSTACK_FORCE_LOCAL'],
                forceProxy:      !!process.env['BROWSERSTACK_FORCE_PROXY'],
                localIdentifier: Date.now(),

                ...parallelRuns ? { parallelRuns } : {},
                ...verbose ? { verbose } : {},
                ...binarypath ? { binarypath } : {},

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

                setTimeout(() => {
                    this.connectorInstance = connector;

                    resolve(connector);
                }, BROWSERSTACK_CONNECTOR_DELAY);
            });
        });
    }

    destroy () {
        return new Promise((resolve, reject) => {
            this.connectorInstance.stop(err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }
}
