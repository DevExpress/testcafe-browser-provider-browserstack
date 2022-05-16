var expect         = require('chai').expect;
var createTestCafe = require('testcafe');


describe('TestCafe integration', function () {
    this.timeout(2 * 60 * 1000);

    var testcafe = null;

    before(function () {
        return createTestCafe()
            .then(function (tc) {
                testcafe = tc;
            });
    });

    after(function () {
        return testcafe.close();
    });

    it('Should add a link to BrowserStack in report', function () {
        var report = '';
        var runner = testcafe.createRunner();

        return runner
            .browsers('browserstack:chrome')
            .src('test/mocha/data/sample-fixture.js')
            .reporter('json', {
                write: function (data) {
                    report += data;
                },
                end: function (data) {
                    report += data;
                },
            })
            .run()
            .then(function (failedCount) {
                expect(failedCount).to.be.equal(0);

                var reportData = JSON.parse(report);

                expect(reportData.userAgents[0]).to.contain('browserstack.com');
            });
    });

    const testOSVersion = (browserName, expectedOSName) => {
        var report = '';
        var runner = testcafe.createRunner();

        return runner
            .browsers(browserName)
            .src('test/mocha/data/sample-fixture.js')
            .reporter('json', {
                write: function (data) {
                    report += data;
                },
                end: function (data) {
                    report += data;
                },
            })
            .run()
            .then(function (failedCount) {
                expect(failedCount).to.be.equal(0);

                var reportData = JSON.parse(report);

                expectedOSName = Array.isArray(expectedOSName) ? expectedOSName : [expectedOSName];

                for (let i = 0; i < expectedOSName.length; i++)
                    expect(reportData.userAgents[i]).to.contain(expectedOSName[i]);
            });
    };

    it('Should add a correct Windows OS version in report - Windows 11', function () {
        const testEnv    = 'browserstack:Chrome@101.0:Windows 11';
        const expectedOS = 'Windows 11';

        return testOSVersion(testEnv, expectedOS);
    });

    it('Should add a correct Windows OS version in report if two different OS are specified - Windows 10, Windows 11', function () {
        const testEnv    = ['browserstack:Chrome@101.0:Windows 10', 'browserstack:Chrome@101.0:Windows 11'];
        const expectedOS = ['Windows 10', 'Windows 11'];

        return testOSVersion(testEnv, expectedOS);
    });

    if (process.env.BROWSERSTACK_USE_AUTOMATE !== '1') {
        it('Should emit warning on resizing window', function () {
            var report = '';
            var runner = testcafe.createRunner();

            return runner
                .browsers('browserstack:chrome')
                .src('test/mocha/data/resize-sample-fixture.js')
                .reporter('json', {
                    write: function (data) {
                        report += data;
                    },
                    end: function (data) {
                        report += data;
                    },
                })
                .run()
                .then(function () {
                    var reportData = JSON.parse(report);

                    expect(reportData.warnings[0]).to.contain('The window resize functionality is not supported ' +
                        'by the Browserstack JS Testing API. Use the Browserstack Automate API.');
                });
        });

        it('Should emit warning on maximizing window', function () {
            var report = '';
            var runner = testcafe.createRunner();

            return runner
                .browsers('browserstack:chrome')
                .src('test/mocha/data/maximize-sample-fixture.js')
                .reporter('json', {
                    write: function (data) {
                        report += data;
                    },
                    end: function (data) {
                        report += data;
                    },
                })
                .run()
                .then(function () {
                    var reportData = JSON.parse(report);

                    expect(reportData.warnings[0]).to.contain('The window maximization functionality is not supported ' +
                        'by the Browserstack JS Testing API. Use the Browserstack Automate API.');
                });
        });
    }
});
