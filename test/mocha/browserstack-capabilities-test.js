var expect               = require('chai').expect;
var browserStackProvider = require('../../');


describe('Browserstack capabilities', function () {
    it('Should add custom capabilities from environment variables', function () {
        const output = {};

        process.env['BROWSERSTACK_BUILD_ID'] = 'build-1';
        process.env['BROWSERSTACK_PROJECT_NAME'] = 'project-1';
        process.env['BROWSERSTACK_DISPLAY_RESOLUTION'] = '1024x768';
        process.env['BROWSERSTACK_DEBUG'] = 'true';
        process.env['BROWSERSTACK_CONSOLE'] = 'errors';
        process.env['BROWSERSTACK_NETWORK_LOGS'] = 'true';
        process.env['BROWSERSTACK_VIDEO'] = 'true';
        process.env['BROWSERSTACK_TIMEZONE'] = 'Asia/Taipei';

        browserStackProvider._addEnvironmentPreferencesToCapabilities(output);

        expect(output).to.deep.equal({
            'build':                    'build-1',
            'project':                  'project-1',
            'resolution':               '1024x768',
            'browserstack.debug':       'true',
            'browserstack.console':     'errors',
            'browserstack.networkLogs': 'true',
            'browserstack.video':       'true',
            'browserstack.timezone':    'Asia/Taipei'
        });
    });
});
