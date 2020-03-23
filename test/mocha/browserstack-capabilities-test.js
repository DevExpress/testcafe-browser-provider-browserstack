var expect               = require('chai').expect;
var browserStackProvider = require('../../');


describe('Browserstack capabilities', function () {
    after(function () {
        delete process.env.BROWSERSTACK_TEST_RUN_NAME;
        delete process.env.BROWSERSTACK_GEO_LOCATION;
        delete process.env.BROWSERSTACK_CUSTOM_NETWORK;
        delete process.env.BROWSERSTACK_NETWORK_PROFILE;
        delete process.env.BROWSERSTACK_CAPABILITIES_CONFIG_PATH;
    });

    it('Should add custom capabilities from environment variables', function () {
        process.env['BROWSERSTACK_BUILD_ID'] = 'build-1';
        process.env['BROWSERSTACK_PROJECT_NAME'] = 'project-1';
        process.env['BROWSERSTACK_DISPLAY_RESOLUTION'] = '1024x768';
        process.env['BROWSERSTACK_TEST_RUN_NAME'] = 'Testcafe test run 1';
        process.env['BROWSERSTACK_DEBUG'] = 'true';
        process.env['BROWSERSTACK_CONSOLE'] = 'errors';
        process.env['BROWSERSTACK_NETWORK_LOGS'] = 'true';
        process.env['BROWSERSTACK_VIDEO'] = 'true';
        process.env['BROWSERSTACK_TIMEZONE'] = 'Asia/Taipei';
        process.env['BROWSERSTACK_GEO_LOCATION'] = 'ZA';
        process.env['BROWSERSTACK_CUSTOM_NETWORK'] = '"1000", "1000", "100", "1"';
        process.env['BROWSERSTACK_NETWORK_PROFILE'] = '4g-lte-lossy';

        const capabilities = browserStackProvider._getAdditionalCapabilities();

        expect(capabilities).to.deep.equal({
            'build':                       'build-1',
            'project':                     'project-1',
            'resolution':                  '1024x768',
            'name':                        'Testcafe test run 1',
            'browserstack.debug':          'true',
            'browserstack.console':        'errors',
            'browserstack.networkLogs':    'true',
            'browserstack.video':          'true',
            'browserstack.timezone':       'Asia/Taipei',
            'browserstack.geoLocation':    'ZA',
            'browserstack.customNetwork':  '"1000", "1000", "100", "1"',
            'browserstack.networkProfile': '4g-lte-lossy'
        });
    });

    it.only('Should read aditional capabilities from a config file', () => {
        process.env.BROWSERSTACK_CAPABILITIES_CONFIG_PATH = require.resolve('./data/capabilities-config.json');

        const capabilities = browserStackProvider._getAdditionalCapabilities();

        expect(capabilities).to.deep.equal({
            'build':                       'build-1',
            'project':                     'project-1',
            'resolution':                  '1024x768',
            'name':                        'Testcafe test run 1',
            'browserstack.debug':          'true',
            'browserstack.console':        'errors',
            'browserstack.networkLogs':    'true',
            'browserstack.video':          'true',
            'browserstack.timezone':       'Asia/Taipei',
            'browserstack.geoLocation':    'ZA',
            'browserstack.customNetwork':  '"1000", "1000", "100", "1"',
            'browserstack.networkProfile': '4g-lte-lossy'
        });
    });
});
