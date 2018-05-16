export default function (jobResult, jobData, possibleResults) {
    var testsFailed = jobResult === possibleResults.done ? jobData.total - jobData.passed : 0;
    var jobPassed   = jobResult === possibleResults.done && testsFailed === 0;
    var errorReason = '';

    if (testsFailed > 0)
        errorReason = `${testsFailed} tests failed`;
    else if (jobResult === possibleResults.errored)
        errorReason = jobData.message;
    else if (jobResult === possibleResults.aborted)
        errorReason = 'Session aborted';

    return {
        status: jobPassed ? 'passed' : 'failed',
        reason: errorReason
    };

}
