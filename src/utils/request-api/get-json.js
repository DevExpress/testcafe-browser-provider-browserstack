
import Promise from 'pinkie';
import fetch from 'node-fetch';
import * as ERROR_MESSAGES from '../../templates/error-messages';

const apiRequestPromise = Promise.resolve(null);

export async function getJson ({ url, method = 'GET' }, { body = null, executeImmediately = false } = {}) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    const user = process.env['BROWSERSTACK_USERNAME'];
    const pass = process.env['BROWSERSTACK_ACCESS_KEY'];

    const response = await fetch(url, {
        headers: {
            'user-agent':    'testcafe-browserstack',
            'Authorization': `Basic ${Buffer.from(user + ':' + pass).toString('base64')}`,
        },
        method,
        body: body ? JSON.stringify(body) : void 0,
    });

    const chainPromise = executeImmediately ? Promise.resolve(null) : apiRequestPromise;

    const currentRequestPromise = chainPromise
        .then(async () => {
            if (response.status === 401)
                throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());
            else if (!response.ok)
                throw new Error(await response.text());

            return response.json();
        });

    return currentRequestPromise;
}
