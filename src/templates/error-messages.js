import dedent from 'dedent';


export const BROWSERSTACK_AUTHENTICATION_FAILED = () => 'Authentication failed. Please assign the correct username and access key to the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.';
export const API_METHOD_NOT_IMPLEMENTED =         () => 'The API method is not implemented';

export const REMOTE_API_REQUEST_FAILED = ({ status, apiResponse }) => dedent `
    API error ${status}: 
    
    ${apiResponse}
`;

export const SESSION_ID_NOT_FOUND = ({ sessionInfoDump }) => dedent ` 
    Unable to find a session ID in the following session information: 
    
    ${ sessionInfoDump }
`;
