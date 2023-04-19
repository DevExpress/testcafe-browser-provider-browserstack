
import Promise from 'pinkie';
import fetch from 'node-fetch';
import * as ERROR_MESSAGES from '../../templates/error-messages';

const apiRequestPromise = Promise.resolve(null);

export async function requestJson ({ url, method = 'GET' }, { body = null, executeImmediately = false, ...queryParams } = {}) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    const user = process.env['BROWSERSTACK_USERNAME'];
    const pass = process.env['BROWSERSTACK_ACCESS_KEY'];

    const options = {
        headers: {
            'Content-Type':  'application/json',
            'user-agent':    'testcafe-browserstack',
            'Authorization': `Basic ${Buffer.from(user + ':' + pass).toString('base64')}`,
        },
        method,
    };

    if (body)
        options.body = JSON.stringify(body);

    const urlObject = new URL(url);

    for (const key in queryParams)
        urlObject.searchParams.append(key, queryParams[key]);

    //const proxy = process.env['BROWSERSTACK_PROXY'];

    const chainPromise = executeImmediately ? Promise.resolve(null) : apiRequestPromise;

    const currentRequestPromise = chainPromise
        .then(async () => {
            const response = await fetch(urlObject.toString(), options);

            if (response.status === 401)
                throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());
            else if (!response.ok)
                throw new Error(`${response.status}: ${response.statusText}`);

            return await response.json();
        });

    return currentRequestPromise;
}
