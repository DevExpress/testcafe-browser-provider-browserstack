var path        = require('path');
var gulp        = require('gulp');
var babel       = require('gulp-babel');
var sequence    = require('gulp-sequence');
var del         = require('del');
var nodeVersion = require('node-version');
var execa       = require('execa');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;


gulp.task('clean', function () {
    return del('lib');
});

gulp.task('lint', function () {
    // TODO: eslint supports node version 4 or higher.
    // Remove this condition once we get rid of node 0.10 support.
    if (nodeVersion.major === '0')
        return null;

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
});

gulp.task('build', ['lint', 'clean'], function () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

function testMocha () {
    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY)
        throw new Error('Specify your credentials by using the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables to authenticate to BrowserStack.');


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

gulp.task('test-mocha', ['build'], function () {
    process.env.BROWSERSTACK_USE_AUTOMATE = 0;

    return testMocha();
});

gulp.task('test-mocha-automate', ['build'], function () {
    process.env.BROWSERSTACK_USE_AUTOMATE = 1;

    return testMocha();
});

function testTestcafe () {
    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY)
        throw new Error('Specify your credentials by using the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables to authenticate to BrowserStack.');

    var testCafeCmd = path.join(__dirname, 'node_modules/.bin/testcafe');

    var testCafeOpts = [
        'browserstack:chrome:windows 10,browserstack:Google Pixel@7.1,browserstack:iPhone 8',
        'test/testcafe/**/*test.js',
        '-s', '.screenshots'
    ];

    // NOTE: we must add the parent of plugin directory to NODE_PATH, otherwise testcafe will not be able
    // to find the plugin. So this function starts testcafe with proper NODE_PATH.
    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    return execa(testCafeCmd, testCafeOpts, { stdio: 'inherit' });
}

gulp.task('test-testcafe', ['build'], function () {
    process.env.BROWSERSTACK_USE_AUTOMATE = '0';

    return testTestcafe();
});

gulp.task('test-testcafe-automate', ['build'], function () {
    process.env.BROWSERSTACK_USE_AUTOMATE = '1';

    return testTestcafe();
});

gulp.task('test', sequence('test-mocha', 'test-mocha-automate', 'test-testcafe', 'test-testcafe-automate'));
