import https from 'https';
import HttpsProxyAgent from 'https-proxy-agent';
import { inspect } from 'util';

export function httpsRequest ({ url, user, pass, headers, queryParams, method, body, json, encoding, proxy }) {
    const urlObject = new URL(url);

    for (const key in queryParams)
        urlObject.searchParams.append(key, queryParams[key]);

    const { hostname, pathname, search } = urlObject;

    const options = {
        hostname: hostname,
        path:     `${pathname}${search}`,
        method,
        headers:  {
            'Authorization': 'Basic ' + Buffer.from(user + ':' + pass).toString('base64'),
            ...headers
        }
    };

    if (proxy)
        options.agent = new HttpsProxyAgent(proxy);

    // eslint-disable-next-line no-console
    console.log(inspect({ options, queryParams, pathname }));

    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
        const request = https.request(options, response => {
            let data = null;

            if (encoding === null) {
                data = Buffer.from();

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
