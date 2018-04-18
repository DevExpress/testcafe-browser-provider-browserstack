import Promise from 'pinkie';
import request from 'request-promise';
import delay from './utils/delay';


const BUILD_ID     = process.env['BROWSERSTACK_BUILD_ID'];
const PROJECT_NAME = process.env['BROWSERSTACK_PROJECT_NAME'];

const AUTH_FAILED_ERROR = 'Authentication failed. Please assign the correct username and access key ' +
    'to the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.';

const API_REQUEST_DELAY = 100;

let apiRequestPromise = Promise.resolve(null);


export default function (apiPath, params) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(AUTH_FAILED_ERROR);

    var url = apiPath.url;

    var opts = {
        auth: {
            user: process.env['BROWSERSTACK_USERNAME'],
            pass: process.env['BROWSERSTACK_ACCESS_KEY'],
        },

        qs: Object.assign({},
            BUILD_ID && { build: BUILD_ID },
            PROJECT_NAME && { project: PROJECT_NAME },
            params
        ),

        method: apiPath.method || 'GET',
        json:   !apiPath.binaryStream
    };

    if (apiPath.binaryStream)
        opts.encoding = null;

    const currentRequestPromise = apiRequestPromise
        .then(() => request(url, opts))
        .catch(error => {
            if (error.statusCode === 401)
                throw new Error(AUTH_FAILED_ERROR);

            throw error;
        });

    apiRequestPromise = currentRequestPromise.then(() => delay(API_REQUEST_DELAY));

    return currentRequestPromise;
}
