import Promise from 'pinkie';
import request from 'request-promise';
import delay from './delay';
import * as ERROR_MESSAGES from '../templates/error-messages';


const API_REQUEST_DELAY = 100;

let apiRequestPromise = Promise.resolve(null);

export default function (apiPath, params = {}) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    var url = apiPath.url;

    var { body, executeImmediately, ...queryParams } = params;

    var opts = {
        auth: {
            user: process.env['BROWSERSTACK_USERNAME'],
            pass: process.env['BROWSERSTACK_ACCESS_KEY'],
        },

        qs: { ...queryParams },

        method: apiPath.method || 'GET',
        json:   apiPath.encoding === void 0
    };

    if (body)
        opts.body = body;

    if (apiPath.encoding !== void 0)
        opts.encoding = apiPath.encoding;

    const chainPromise = executeImmediately ? Promise.resolve(null) : apiRequestPromise;

    let currentRequestPromise = chainPromise
        .then(() => request(url, opts))
        .catch(error => {
            if (error.statusCode === 401)
                throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

            throw error;
        });

    if (executeImmediately) {
        let result = null;

        currentRequestPromise = currentRequestPromise
            .then(promiseResult => {
                result = promiseResult;
            })
            .then(() => delay(API_REQUEST_DELAY))
            .then(() => result);
    }
    else
        apiRequestPromise = currentRequestPromise.then(() => delay(API_REQUEST_DELAY));

    return currentRequestPromise;
}
