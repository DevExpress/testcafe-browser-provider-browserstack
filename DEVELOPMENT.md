To use the development build in your tests:

---

Step 1: Clone the repo

Step 2: Go into the directory
```bash
cd testcafe-browser-provider-browserstack
```
Step 3: Install the dependencies
```bash
npm install (use lts version to avoid breaking changes)
```
Step 4: Gulp build the module
```bash
./node_modules/.bin/gulp build
```
Step 5: Link the package globally, for consumption by testcafe
```bash
npm link
```

---

