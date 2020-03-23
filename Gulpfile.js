var path        = require('path');
var gulp        = require('gulp');
var babel       = require('gulp-babel');
var del         = require('del');
var execa       = require('execa');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;


function clean () {
    return del('lib');
}

function lint () {
    var eslint = require('gulp-eslint');

    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function build () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
}

function ensureAuthCredentials () {
    const ERROR_MESSAGES = require('./lib/templates/error-messages');

    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY)
        throw new Error(ERROR_MESSAGES.BROWSERSTACK_AUTHENTICATION_FAILED());
}

function testMocha () {
    ensureAuthCredentials();

    var mochaCmd = path.join(__dirname, 'node_modules/.bin/mocha');

    var mochaOpts = [
        '--ui', 'bdd',
        '--reporter', 'spec',
        '--timeout', typeof v8debug === 'undefined' ? 2000 : Infinity,
        'test/mocha/**/*test.js'
    ];

    // NOTE: we must add the parent of plugin directory to NODE_PATH, otherwise testcafe will not be able
    // to find the plugin. So this function starts mocha with proper NODE_PATH.
    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    return execa(mochaCmd, mochaOpts, { stdio: 'inherit' });
}

function testMochaRest () {
    process.env.BROWSERSTACK_USE_AUTOMATE = 0;

    return testMocha();
}

function testMochaAutomate () {
    process.env.BROWSERSTACK_USE_AUTOMATE = 1;

    return testMocha();
}

function testTestcafe (browsers) {
    ensureAuthCredentials();

    var testCafeCmd = path.join(__dirname, 'node_modules/.bin/testcafe');

    var testCafeOpts = [
        browsers,
        'test/testcafe/**/*test.js',
        '-s', '.screenshots'
    ];

    // NOTE: we must add the parent of plugin directory to NODE_PATH, otherwise testcafe will not be able
    // to find the plugin. So this function starts testcafe with proper NODE_PATH.
    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    return execa(testCafeCmd, testCafeOpts, { stdio: 'inherit' });
}

function testTestcafeRest () {
    process.env.BROWSERSTACK_USE_AUTOMATE = '0';

    return testTestcafe('browserstack:chrome:windows 10,browserstack:Safari@12.1');
}

function testTestcafeAutomate () {
    process.env.BROWSERSTACK_USE_AUTOMATE = '1';

    return testTestcafe('browserstack:chrome:windows 10,browserstack:Google Pixel@7.1,browserstack:Safari@12.1');
}

exports.clean = clean;
exports.lint  = lint;
exports.build = gulp.parallel(gulp.series(clean, build), lint);
exports.test  = gulp.series(exports.build, testMochaRest, testMochaAutomate, testTestcafeAutomate);
exports.testTestcafeRest = gulp.series(exports.build, testTestcafeRest);
exports.testTestcafeAutomate = gulp.series(exports.build, testTestcafeAutomate);
