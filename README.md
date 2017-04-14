# testcafe-browser-provider-browserstack
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-browserstack.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-browserstack)

This plugin integrates [TestCafe](http://devexpress.github.io/testcafe) with the [BrowserStack Testing Cloud](https://browserstack.com/).

## Install

```
npm install testcafe-browser-provider-browserstack
```

## Usage
Before using this plugin, save the BrowserStack username and access key to environment variables `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY`.

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

## Author
Developer Express Inc. (https://devexpress.com)
