import https from 'https';
import { parse as parseUrl } from 'url';
import querystring from 'node:querystring';
import HttpsProxyAgent from 'https-proxy-agent';
import { inspect } from 'util';

export function httpsRequest ({ url, user, pass, headers, queryParams, method, body, json, encoding, proxy }) {
    const { hostname, path } = parseUrl(url);

    const options = {
        hostname,
        path:    `${path}${ queryParams ? querystring.stringify(queryParams) : ''}`,
        method,
        headers: {
            'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64'),
            ...headers
        }
    };

    if (proxy)
        options.agent = new HttpsProxyAgent(proxy);

    // eslint-disable-next-line no-console
    console.log(inspect(options));

    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
        const request = https.request(options, response => {
            let data = null;

            if (encoding === null) {
                data = new Buffer();

                response.on('data', chunk => {
                    data = Buffer.concat([data, chunk]);
                });
            }
            else {
                data = '';

                response.on('data', chunk => {
                    data += chunk.toString(encoding === void 0 ? 'utf8' : encoding);
                });
            }

            response.on('end', () => {
                const { statusCode, statusMessage } = response;

                if (statusCode >= 200 && statusCode <= 299)
                    resolve(json ? JSON.parse(data) : data);
                else
                    reject({ statusCode, statusMessage });
            });

            response.on('error', reject);
        });

        request.on('error', reject);

        if (body) request.write(JSON.stringify(body));

        request.end();
    });
}
