const { expect }           = require('chai');
const Promise              = require('pinkie');
const browserStackProvider = require('../../');


describe('Browser names', function () {
    before(function () {
        this.timeout(20000);

        return browserStackProvider
            .init();
    });

    after(function () {
        return browserStackProvider
            .dispose();
    });

    it('Should return list of common browsers and devices', function () {
        const IS_AUTOMATE = process.env['BROWSERSTACK_USE_AUTOMATE'] && process.env['BROWSERSTACK_USE_AUTOMATE'] !== '0';

        const REST_BROWSER_NAMES = [
            'chrome@51.0:OS X Mavericks',
            'firefox@45.0:OS X Yosemite',
            'safari@9.1:OS X El Capitan',
            'ie@9.0:Windows 7',
            'ie@10.0:Windows 8',
            'ie@11.0:Windows 8.1',
            'edge@15.0:Windows 10',
            //'iPhone SE@11', iPhone SE@11 is not included in https://www.browserstack.com/list-of-browsers-and-platforms/automate failing the test
            'iPhone SE 2020@13',
            'iPhone XR@12',
            'Google Pixel 7@13.0'
        ];

        const AUTOMATE_BROWSER_NAMES = [
            'chrome@51.0:OS X Mavericks',
            'firefox@45.0:OS X Yosemite',
            'safari@9.1:OS X El Capitan',
            'ie@9.0:Windows 7',
            'ie@10.0:Windows 8',
            'ie@11.0:Windows 8.1',
            'edge@15.0:Windows 10',
            'iPhone 7@10',
            //'iPhone SE@11', iPhone SE@11 is not included in https://www.browserstack.com/list-of-browsers-and-platforms/automate failing the test
            'iPhone SE 2020@13',
            'iPhone XR@12',
            'Google Pixel 7@13.0'
        ];

        return browserStackProvider
            .getBrowserList()
            .then(function (list) {
                expect(list).to.include.members(IS_AUTOMATE ? AUTOMATE_BROWSER_NAMES : REST_BROWSER_NAMES);
            });
    });

    it('Should validate browser names', function () {
        var browserNameResults = {
            'chrome':             true,
            'safari':             true,
            'opera:windows':      true,
            'firefox:os x':       true,
            'edge':               true,
            'ie@9.0:Windows 7':   true,
            'ie@10.0:Windows 8':  true,
            'ie@11.0:Windows 10': true,
            'iPhone SE 2020':     true,
            'Google Pixel 7':     true,
            'ie@5.0':             false,
            'ie@11:os x':         false
        };

        const browserNames = Object.keys(browserNameResults);

        var validationPromises = browserNames
            .map(function (browserName) {
                return browserStackProvider.isValidBrowserName(browserName);
            });

        return Promise
            .all(validationPromises)
            .then(function (results) {
                const expectedResults = Object.values(browserNameResults);

                for (let i = 0; i < results.length; i++)
                    expect(results[i]).eql(expectedResults[i], 'invalid result for ' + browserNames[i]);
            });
    });

    it("Should not return the 'beta' browser version if the version is not specified", () => {
        const capability = browserStackProvider._generateBasicCapabilities('chrome');

        expect(capability['browser_version']).to.not.include('beta');
    });
});
