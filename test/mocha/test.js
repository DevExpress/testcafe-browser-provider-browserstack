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
        return browserStackProvider
            .getBrowserList()
            .then(function (list) {
                expect(list).to.include.members([
                    'chrome@51.0:OS X Mavericks',
                    'firefox@45.0:OS X Yosemite',
                    'safari@9.1:OS X El Capitan',
                    'ie@9.0:Windows 7',
                    'ie@10.0:Windows 8',
                    'ie@11.0:Windows 8.1',
                    'edge@14.0:Windows 10',
                    'iPhone 6@8.3',
                    'iPhone SE@10.0',
                    'iPad Pro (9.7 inch)@10.0',
                    'Google Nexus 5@5.0'
                ]);
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
