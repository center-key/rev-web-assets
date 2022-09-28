# rev-web-assets
<img src=https://centerkey.com/graphics/center-key-logo.svg align=right width=200 alt=logo>

_Revision web asset filenames with cache busting content hash fingerprints_

[![License:MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/center-key/rev-web-assets/blob/main/LICENSE.txt)
[![npm](https://img.shields.io/npm/v/rev-web-assets.svg)](https://www.npmjs.com/package/rev-web-assets)
[![Vulnerabilities](https://snyk.io/test/github/center-key/rev-web-assets/badge.svg)](https://snyk.io/test/github/center-key/rev-web-assets)
[![Build](https://github.com/center-key/rev-web-assets/workflows/build/badge.svg)](https://github.com/center-key/rev-web-assets/actions/workflows/run-spec-on-push.yaml)

**rev-web-assets** updates the asset filenames of a website to include a seven character hex hash.  The command's console output includes a timestamp and formatting helpful in build systems.

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
      "revision": "rev-web-assets build/dev/web-app build/prod/web-app"
   },
```
Try out the first script with the command: `npm run revision`

### 2. Global
You can install **rev-web-assets** globally and then run it anywhere directly from the terminal.

Example terminal commands:
```shell
$ npm install --global rev-web-assets
$ rev-web-assets rev-web-assets build/dev/web-app build/prod/web-app
```

### 3. CLI Flags
Command-line flags:
| Flag         | Description                                         | Value      |
| ------------ | --------------------------------------------------- | ---------- |
| `--cd`       | Change working directory before starting starting.  | **string** |
| `--manifest` | Output the list of files to: **manifest.json**      | N/A        |
| `--quiet`    | Suppress informational messages.                    | N/A        |
| `--summary`  | Only print out the single line summary message.     | N/A        |

Examples:
   - `rev-web-assets --cd=web source target`  &nbsp; Same as: `rev-web-assets web/source web/target`
   - `rev-web-assets source target --quiet`   &nbsp; Displays no output.
   - `rev-web-assets source target --summary` &nbsp; Displays the summary but not the individual filenames.

## C) Application Code
Even though **rev-web-assets** is primarily intended for build scripts, the package can easily be used in ESM and TypeScript projects.

Example:
``` typescript
import { revWebAssets } from 'rev-web-assets';
const options = { saveManifest: true };
const results = revWebAssets.revision('source', 'target', options);
console.log('Number of web files processed:', results.count);
```

See the **TypeScript Declarations** at the top of [rev-web-assets.ts](rev-web-assets.ts) for documentation.

<br>

---
**Build Tools**
   - 🎋 [add-dist-header](https://github.com/center-key/add-dist-header):&nbsp; _Prepend a one-line header comment (with license notice) to distribution files_
   - 📄 [copy-file-util](https://github.com/center-key/copy-file-util):&nbsp; _Copy or rename a file (CLI tool designed for use in npm scripts)_
   - 📂 [copy-folder-cli](https://github.com/center-key/copy-folder-cli):&nbsp; _Recursively copy a folder (CLI tool designed for use in npm scripts)_
   - 🔢 [rev-web-assets](https://github.com/center-key/rev-web-assets):&nbsp; _Revision web asset filenames with cache busting content hash fingerprints_
   - 🚦 [w3c-html-validator](https://github.com/center-key/w3c-html-validator):&nbsp; _Check the markup validity of HTML files using the W3C validator_

Feel free to submit questions at:<br>
[github.com/center-key/rev-web-assets/issues](https://github.com/center-key/rev-web-assets/issues)

[MIT License](LICENSE.txt)
