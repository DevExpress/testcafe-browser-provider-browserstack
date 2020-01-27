import dedent from 'dedent';


export const API_POLLING_INTERVAL_IS_TOO_LARGE = ({ actual, expected }) => dedent `
    The API Polling interval is set to ${actual}. It shouldn't exceed the BrowserStack idle timeout, which is ${expected}.
    Stability and performance are not guaranteed.
`;
