const expect  = require('chai').expect;
const createTestCafe = require('testcafe');


const NULL_STREAM     = () => ({ write: () => {}, end: () => {} });
const LOW_RESOLUTION  = '1024x768';
const HIGH_RESOLUTION = '1920x1080';


describe('Resolution Changing', function () {
    this.timeout(2 * 60 * 1000);

    let testcafe = null;

    const prevDisplayResolution = process.env.BROWSERSTACK_DISPLAY_RESOLUTION;

    function runTest (testName) {
        return testcafe
            .createRunner()
            .browsers('browserstack:chrome')
            .src('test/mocha/data/change-resolution-fixture.js')
            .filter(currentTestName => currentTestName === testName)
            .reporter('minimal', NULL_STREAM)
            .run();
    }

    before(function () {
        return createTestCafe()
            .then(function (tc) {
                testcafe = tc;
            });
    });

    after(function () {
        if (prevDisplayResolution)
            process.env.BROWSERSTACK_DISPLAY_RESOLUTION = prevDisplayResolution;
        else
            delete process.env.BROWSERSTACK_DISPLAY_RESOLUTION;

        return testcafe.close();
    });

    it('Should change the VM display resolution according to the BROWSERSTACK_DISPLAY_RESOLUTION environment variable', function () {
        process.env.BROWSERSTACK_DISPLAY_RESOLUTION = LOW_RESOLUTION;

        return runTest('Low resolution')
            .then(failedCount => {
                expect(failedCount).eql(0);

                process.env.BROWSERSTACK_DISPLAY_RESOLUTION = HIGH_RESOLUTION;

                return runTest('High resolution');
            })
            .then(failedCount => {
                expect(failedCount).eql(0);
            });
    });
});
