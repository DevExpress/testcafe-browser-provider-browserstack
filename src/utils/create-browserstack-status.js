export default function (jobResult, jobData, possibleResults) {
    const testsFailed = jobResult === possibleResults.done ? jobData.total - jobData.passed : 0;
    const jobPassed   = jobResult === possibleResults.done && testsFailed === 0 ||
        jobResult === possibleResults.restarted;
    let errorReason = '';

    if (testsFailed > 0)
        errorReason = `${testsFailed} tests failed`;
    else if (jobResult === possibleResults.errored)
        errorReason = jobData.message;
    else if (jobResult === possibleResults.aborted)
        errorReason = 'Session interrupted';
    else if (jobResult === possibleResults.restarted)
        errorReason = 'Session restarted';

    return {
        status: jobPassed ? 'passed' : 'failed',
        reason: errorReason
    };

}
