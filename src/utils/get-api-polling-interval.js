import { toInteger } from 'lodash';
import { API_POLLING_INTERVAL_IS_TOO_LARGE } from '../templates/warning-messages';

// NOTE: We need to continuously poll BrowserStack APIs in Automate sessions to avoid the idle timeout.
// The value can be reduced for unstable network connections if there is a high risk of random request failures.
const DEFAULT_API_POLLING_INTERVAL = 80000;

// NOTE: the max value is capped at the BrowserStack idle timeout.
// https://www.browserstack.com/automate/timeouts
const MAX_API_POLLING_INTERVAL = 90000;

export default function () {
    const pollingInterval = toInteger(process.env.TESTCAFE_BROWSERSTACK_API_POLLING_INTERVAL) || DEFAULT_API_POLLING_INTERVAL;

    if (pollingInterval > MAX_API_POLLING_INTERVAL)
        process.emitWarning(API_POLLING_INTERVAL_IS_TOO_LARGE({ actual: pollingInterval, expected: MAX_API_POLLING_INTERVAL }));

    return pollingInterval;
}
