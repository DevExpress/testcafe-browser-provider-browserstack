import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as ERROR_MESSAGES from '../templates/error-messages';

export default async function (apiPath, params = {}) {
    if (!process.env['BROWSERSTACK_USERNAME'] || !process.env['BROWSERSTACK_ACCESS_KEY'])
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    const { body, ...queryParams } = params;

    const urlObj = new URL(apiPath.url);

    for (const [key, value] of Object.entries(queryParams))
        urlObj.searchParams.append(key, value);

    const url = urlObj.toString();

    const user = process.env['BROWSERSTACK_USERNAME'];
    const pass = process.env['BROWSERSTACK_ACCESS_KEY'];

    const options = {
        method:  apiPath.method || 'GET',
        headers: {
            'Authorization': `Basic ${Buffer.from(user + ':' + pass).toString('base64')}`,
            'User-Agent':    'testcafe-browserstack',
        },
    };

    const proxy = process.env['BROWSERSTACK_PROXY'];

    if (proxy)
        options.agent = new HttpsProxyAgent(`http://${proxy}`);

    if (body) {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, options);

    if (res.status === 401)
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());

    if (apiPath.encoding === null)
        return Buffer.from(await res.arrayBuffer());

    return res.json();
}
