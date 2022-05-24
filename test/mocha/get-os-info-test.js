var expect                 = require('chai').expect;
const browserStackProvider = require('../../');

(process.env.BROWSERSTACK_USE_AUTOMATE === '1' ? describe.skip : describe)('Get OS info test', function () {
    this.timeout(20000);

    const browserID       = {
        'Win10':   't1t1t1t1',
        'Win11':   't2t2t2t2',
        'Invalid': 'invalid'
    };
    const browserSettings = {
        'Win10': 'chrome@101.0:Windows 10',
        'Win11': 'chrome@101.0:Windows 11'
    };

    const providerMock = {
        ...browserStackProvider,
        setUserAgentMetaInfo: () => {
        }
    };

    before(async function () {
        await providerMock.init();

        await providerMock.openBrowser(browserID.Win10, 'example.org', browserSettings.Win10);
        await providerMock.openBrowser(browserID.Win11, 'example.org', browserSettings.Win11);

    });

    after(async function () {
        await providerMock.closeBrowser(browserID.Win10);
        await providerMock.closeBrowser(browserID.Win11);

        await providerMock.dispose();
    });

    it('getOSInfo should return a correct OS version', async function () {
        const expectedResults = {
            'Win10': {
                name:    'Windows',
                version: '10'
            },
            'Win11': {
                name:    'Windows',
                version: '11'
            }
        };

        const win10Info = await providerMock.getOSInfo(browserID.Win10);
        const win11Info = await providerMock.getOSInfo(browserID.Win11);


        expect(win10Info).eql(expectedResults.Win10);
        expect(win11Info).eql(expectedResults.Win11);
    });

    it('Should return null if specified browser id is incorrect', async function () {
        const osInfo = await providerMock.getOSInfo(browserID.Invalid);

        expect(osInfo).to.be.null;
    });

});
