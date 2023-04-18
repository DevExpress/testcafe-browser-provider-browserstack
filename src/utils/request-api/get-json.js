
import Promise from 'pinkie';
import fetch from 'node-fetch';
import * as ERROR_MESSAGES from '../../templates/error-messages';
import { inspect } from 'util';

const apiRequestPromise = Promise.resolve(null);

export async function getJson ({ url, method = 'GET' }, { body = null, executeImmediately = false } = {}) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    const user = process.env['BROWSERSTACK_USERNAME'];
    const pass = process.env['BROWSERSTACK_ACCESS_KEY'];

    const options = {
        headers: {
            'user-agent':    'testcafe-browserstack',
            'Authorization': `Basic ${Buffer.from(user + ':' + pass).toString('base64')}`,
        },
        method,
    };

    if (body)
        options.body = JSON.stringify(body);

    const proxy = process.env['BROWSERSTACK_PROXY'];

    const chainPromise = executeImmediately ? Promise.resolve(null) : apiRequestPromise;

    //const enableLog = method === 'PUT' && url.startsWith('https://api.browserstack.com/automate/sessions/');

    const currentRequestPromise = chainPromise
        .then(async () => {
            //if (enableLog) {
            // eslint-disable-next-line no-console
            console.log({ url, method, ...options });
            //}

            const response = await fetch(url, options);

            // if (enableLog) {
            //     // eslint-disable-next-line no-console
            //     console.log(inspect(response));
            // }

            if (response.status === 401)
                throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());
            else if (!response.ok)
                throw new Error({ status: response.status, text: response.statusText });

            const result = await response.json();

            // eslint-disable-next-line no-console
            console.log({ result: 'ok' });

            return result;
        })
        .catch(error => {
            // eslint-disable-next-line no-console
            console.log(inspect({ error, url, method, proxy, ...options }));

            throw error;
        });

    return currentRequestPromise;
}
