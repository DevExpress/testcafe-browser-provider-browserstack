var path        = require('path');
var gulp        = require('gulp');
var babel       = require('gulp-babel');
var mocha       = require('gulp-mocha');
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

gulp.task('test-mocha', ['build'], function () {
    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY)
        throw new Error('Specify your credentials by using the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables to authenticate to SauceLabs.');

    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    return gulp
        .src('test/mocha/**.js')
        .pipe(mocha({
            ui:       'bdd',
            reporter: 'spec',
            timeout:  typeof v8debug === 'undefined' ? 2000 : Infinity // NOTE: disable timeouts in debug
        }));
});

gulp.task('test-testcafe', ['build'], function () {
    if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY)
        throw new Error('Specify your credentials by using the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables to authenticate to SauceLabs.');

    var testCafeCmd = path.join(__dirname, 'node_modules/.bin/testcafe');

    var testCafeOpts = [
        'browserstack:chrome',
        'test/testcafe/**/*.js',
        '-s', '.screenshots'
    ];

    // NOTE: we must add the parent of plugin directory to NODE_PATH, otherwise testcafe will not be able
    // to find the plugin. So this function starts testcafe with proper NODE_PATH.
    process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

    var child = execa(testCafeCmd, testCafeOpts);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    return child;
});

gulp.task('test', sequence('test-mocha', 'test-testcafe'));
