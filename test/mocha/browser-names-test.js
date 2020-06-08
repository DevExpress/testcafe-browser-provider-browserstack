var expect               = require('chai').expect;
var Promise              = require('pinkie');
var browserStackProvider = require('../../');


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
            'chrome@54.0:OS X Mavericks',
            'firefox@54.0:OS X Yosemite',
            'safari@9.1:OS X El Capitan',
            'ie@9.0:Windows 7',
            'ie@10.0:Windows 8',
            'ie@11.0:Windows 8.1',
            'edge@15.0:Windows 10',
            'iPhone SE@11',
            'iPhone XR@12',
            'Google Nexus 6@6.0'
        ];

        const AUTOMATE_BROWSER_NAMES = [
            'chrome@54.0:OS X Mavericks',
            'firefox@54.0:OS X Yosemite',
            'safari@9.1:OS X El Capitan',
            'ie@9.0:Windows 7',
            'ie@10.0:Windows 8',
            'ie@11.0:Windows 8.1',
            'edge@15.0:Windows 10',
            'iPhone 7@10',
            'iPhone SE@11',
            'iPhone XR@12',
            'Google Nexus 6@6.0'
        ];

        return browserStackProvider
            .getBrowserList()
            .then(function (list) {
                expect(list).to.include.members(IS_AUTOMATE ? AUTOMATE_BROWSER_NAMES : REST_BROWSER_NAMES);
            });
    });

    it('Should validate browser names', function () {
        var browserNames = [
            'chrome',
            'safari',
            'opera:windows',
            'firefox:os x',
            'edge',
            'ie@9',
            'ie@10.0:Windows 8',
            'ie@11:Windows 10',
            'iPhone SE',
            'Google Nexus 5',
            'ie@5.0',
            'ie@11:os x'
        ];

        var expectedResults = [
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            false,
            false
        ];

        var validationPromises = browserNames
            .map(function (browserName) {
                return browserStackProvider.isValidBrowserName(browserName);
            });

        return Promise
            .all(validationPromises)
            .then(function (results) {
                expect(results).to.deep.equals(expectedResults);
            });
    });
});
