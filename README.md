# rev-web-assets
<img src=https://centerkey.com/graphics/center-key-logo.svg align=right width=200 alt=logo>

_fingerprint cache hash versioning static assets_

[![License:MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/center-key/rev-web-assets/blob/main/LICENSE.txt)
[![npm](https://img.shields.io/npm/v/rev-web-assets.svg)](https://www.npmjs.com/package/rev-web-assets)
[![Vulnerabilities](https://snyk.io/test/github/center-key/rev-web-assets/badge.svg)](https://snyk.io/test/github/center-key/rev-web-assets)
[![Build](https://github.com/center-key/rev-web-assets/workflows/build/badge.svg)](https://github.com/center-key/rev-web-assets/actions/workflows/run-spec-on-push.yaml)

**rev-web-assets** takes a web application source folder and copies its files and subfolders to a new destination.  The console output includes a timestamp and formatting helpful in build systems.

<img src=https://raw.githubusercontent.com/center-key/rev-web-assets/main/screenshot.png
width=800 alt=screenshot>

## A) Setup
Install package for node:
```shell
$ npm install --save-dev rev-web-assets
```

## B) Usage
### 1. npm scripts
Run `rev-web-assets` from the `"scripts"` section of your **package.json** file.

The **first** parameter is the *source* folder.
The **second** parameter is the *target* folder.

Example **package.json** scripts:
```json
   "scripts": {
      "make-dist": "rev-web-assets build dist",
      "make-docs": "rev-web-assets src/web --ext=.html docs/api-manual"
   },
```
Try out the first script with the command: `npm run make-dist`

### 2. Global
You can install **rev-web-assets** globally and then run it anywhere directly from the terminal.

Example terminal commands:
```shell
$ npm install --global rev-web-assets
$ rev-web-assets src/web ext=.html docs/api-manual
```

### 3. CLI Flags
Command-line flags:
| Flag         | Description                                           | Value      |
| ------------ | ----------------------------------------------------- | ---------- |
| `--cd`       | Change working directory before starting copy.        | **string** |
| `--quiet`    | Suppress informational messages.                      | N/A        |
| `--summary`  | Only print out the single line summary message.       | N/A        |

Examples:
   - `rev-web-assets build --basename=index dist`  &nbsp; Only copy files with filenames matching `index.*`.
   - `rev-web-assets -cd=spec fixtures mock1`      &nbsp; Copy the folder **spec/fixtures** to **spec/mock1**.
   - `rev-web-assets build dist --summary`         &nbsp; Displays the summary but not the individual files copied.
   - `rev-web-assets src/web --ext=.js,.html docs` &nbsp; Copy only the JavaScript and HTML files to the **docs** folder.

## C) Application Code
Even though **rev-web-assets** is primarily intended for build scripts, the package can easily be used in ESM and TypeScript projects.

Example:
``` typescript
import { revWebAssets } from 'rev-web-assets';
const options = { fileExtentions: ['.html', '.js'] };
const results = revWebAssets.revision('src/web', 'docs/api-manual', options);
console.log('Number of files copied:', results.count);
```

See the **TypeScript Declarations** at the top of [rev-web-assets.ts](rev-web-assets.ts) for documentation.

<br>

---
**Build Tools**
   - 🎋 [add-dist-header](https://github.com/center-key/add-dist-header):&nbsp; _Prepend a one-line header comment (with license notice) to distribution files_
   - 📄 [copy-file-util](https://github.com/center-key/copy-file-util):&nbsp; _Copy or rename a file (CLI tool designed for use in npm scripts)_
   - 📂 [copy-folder-cli](https://github.com/center-key/copy-folder-cli):&nbsp; _Recursively copy a folder (CLI tool designed for use in npm scripts)_
   - 🔢 [rev-web-assets](https://github.com/center-key/rev-web-assets):&nbsp; _Revision web asset filenames and links with a cache busting content hash fingerprint_
   - 🚦 [w3c-html-validator](https://github.com/center-key/w3c-html-validator):&nbsp; _Check the markup validity of HTML files using the W3C validator_

Feel free to submit questions at:<br>
[github.com/center-key/rev-web-assets/issues](https://github.com/center-key/rev-web-assets/issues)

[MIT License](LICENSE.txt)
