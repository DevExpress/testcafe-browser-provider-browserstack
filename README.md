# testcafe-browser-provider-browserstack
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-browserstack.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-browserstack)

This plugin integrates [TestCafe](http://devexpress.github.io/testcafe) with the [BrowserStack Testing Cloud](https://browserstack.com/).

## Install

```
npm install testcafe-browser-provider-browserstack
```

## Usage
Before using this plugin, save the BrowserStack username and access key to environment variables `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY`.

Project name and build name will be displayed in BrowserStack if you set the environment variables `BROWSERSTACK_PROJECT_NAME` and `BROWSERSTACK_BUILD_ID`.

If you have troubles starting multiple browsers at once, or get `browserstack-local` related errors like [#27](https://github.com/DevExpress/testcafe-browser-provider-browserstack/issues/27),
try setting the `BROWSERSTACK_PARALLEL_RUNS` environment variable to the number of browsers you want to run simultaneously, or to 1 if you want to run just one browser.

You can determine the available browser aliases by running
```
testcafe -b browserstack
```

If you run tests from the command line, use the alias when specifying browsers:

```
testcafe "browserstack:Chrome@53.0:Windows 10" "path/to/test/file.js"
```


When you use API, pass the alias to the `browsers()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('browserstack:Chrome@53.0:Windows 10')
    .run();
```

Tip: you can skip version (`@53.0`) or/and OS name (`:Windows 10`).

## Browserstack Proxy Options
Proxy options can be passed via envrionment variables.

 - `BROWSERSTACK_PROXY` - a string that specifies a proxy for the Browserstack local binary. It should have the following structure: `user:pass@proxyHostName:port`,
 - `BROWERSTACK_LOCAL_PROXY` - a string that specifies a proxy for the local web server. It should have the following structure: `user:pass@proxyHostName:port`,
 - `BROWSERSTACK_FORCE_PROXY` - if it's not empty, forces all traffic of Browserstack local binary to go through the proxy,
 - `BROWSERSTACK_FORCE_LOCAL` - if it's not empty, forces all traffic of Browserstack local binary to go through the local machine

Example:
```
export BROWERSTACK_PROXY="user:p@ssw0rd@proxy.com:8080"
export BROWERSTACK_LOCAL_PROXY="admin:12345678@192.168.0.2:8080"
export BROWSERSTACK_FORCE_PROXY="1"
export BROWSERSTACK_FORCE_LOCAL="1"
testcafe browserstack:chrome test.js
```

## Browserstack JS Testing and Browserstack Automate
Browserstack offers two APIs for browser testing:
 - [Browserstack JS Testing](https://www.browserstack.com/javascript-testing-api)
 - [Browserstack Automate](https://www.browserstack.com/automate)

 JS testing supports more types of devices (compare: [JS Testing devices](https://www.browserstack.com/list-of-browsers-and-platforms?product=js_testing)
 vs [Automate devices](https://www.browserstack.com/list-of-browsers-and-platforms?product=automate)),
 while Automate allows for much longer tests ([2 hours](https://www.browserstack.com/automate/timeouts) vs [30 minutes](https://github.com/browserstack/api#timeout300))
 and provides some additional features (like the window resizing functionality).

 TestCafe uses the JS Testing API by default. In order to use Browserstack Automate,
 set the `BROWSERSTACK_USE_AUTOMATE` environment variable to `1`.

Example:
```
export BROWSERSTACK_USE_AUTOMATE="1"
testcafe browserstack:chrome test.js
```

## Setting display resolution

To set the display resolution, use the `BROWSERSTACK_DISPLAY_RESOLUTION` environment variable.
Valid resolutions can be found [here](https://github.com/browserstack/api#resolution).

Remember that this only sets the display resolution and does not resize the browser window. You'll still need to use TestCafe's [window resizing API](https://devexpress.github.io/testcafe/documentation/test-api/actions/resize-window.html) to do so.

Example:
```
export BROWSERSTACK_DISPLAY_RESOLUTION="1024x768"
testcafe browserstack:chrome test.js
```

## Specyfing Chrome Command Line Arguments

To set [Chrome command line arguments](https://peter.sh/experiments/chromium-command-line-switches/), use the `BROWSERSTACK_CHROME_ARGS` environment variable. You can specify multiple arguments by joining them with the space symbol. This option works only if the [Browserstack Automate API is enabled](https://github.com/ondrejbartas/testcafe-browser-provider-browserstack/#browserstack-js-testing-and-browserstack-automate).

Examples:
```
export BROWSERSTACK_USE_AUTOMATE="1"
export BROWSERSTACK_CHROME_ARGS="--autoplay-policy=no-user-gesture-required"
testcafe browserstack:chrome test.js
```
```
export BROWSERSTACK_USE_AUTOMATE="1"
export BROWSERSTACK_CHROME_ARGS="--start-maximized --autoplay-policy=no-user-gesture-required"
testcafe browserstack:chrome test.js
```

## Author
Developer Express Inc. (https://devexpress.com)
