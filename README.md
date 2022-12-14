# rev-web-assets
<img src=https://centerkey.com/graphics/center-key-logo.svg align=right width=200 alt=logo>

_Revision web asset filenames with cache busting content hash fingerprints_

[![License:MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/center-key/rev-web-assets/blob/main/LICENSE.txt)
[![npm](https://img.shields.io/npm/v/rev-web-assets.svg)](https://www.npmjs.com/package/rev-web-assets)
[![Vulnerabilities](https://snyk.io/test/github/center-key/rev-web-assets/badge.svg)](https://snyk.io/test/github/center-key/rev-web-assets)
[![Build](https://github.com/center-key/rev-web-assets/workflows/build/badge.svg)](https://github.com/center-key/rev-web-assets/actions/workflows/run-spec-on-push.yaml)

**rev-web-assets** updates the asset filenames of a website to contain a eight-digit hex hash.&nbsp;
The command's console output includes a timestamp and formatting helpful in build systems.

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

Parameters:
* The **first** parameter is the *source* folder.
* The **second** parameter is the *target* folder.

Example **package.json** scripts:
```json
   "scripts": {
      "revision": "rev-web-assets build/dev/web-app build/prod/web-app"
   },
```

### 2. Global
You can install **rev-web-assets** globally and then run it anywhere directly from the terminal.

Example terminal commands:
```shell
$ npm install --global rev-web-assets
$ rev-web-assets rev-web-assets build/dev/web-app build/prod/web-app
```

### 3. CLI Flags
Command-line flags:
| Flag                  | Description                                        | Value      |
| --------------------- | -------------------------------------------------- | ---------- |
| `--cd`                | Change working directory before starting starting. | **string** |
| `--manifest`          | Output the list of files to: **manifest.json**     | N/A        |
| `--meta-content-base` | Make og:image or other url absolute                | **string** |
| `--note`              | Place to add a comment only for humans.            | **string** |
| `--quiet`             | Suppress informational messages.                   | N/A        |
| `--summary`           | Only print out the single line summary message.    | N/A        |

Examples:
   - `rev-web-assets --cd=web source target`  &nbsp; Same as: `rev-web-assets web/source web/target`
   - `rev-web-assets source target --quiet`   &nbsp; Displays no output.
   - `rev-web-assets source target --summary` &nbsp; Displays the summary but not the individual filenames.
   - `rev-web-assets source target --meta-content-base=https://example.net` &nbsp; Prepends the base to `<meta>` URLs.

URLs in `<meta>` tag `content` attributes generally need to be absolute URLs.&nbsp;
Setting the `--meta-content-base` flag to `https://example.net` will transform the line of HTML from:
```html
<meta property=og:image content="logo.png">
```
into something like:
```html
<meta property=og:image content="https://example.net/logo.ad41b20.png">
```

## C) Application Code
Even though **rev-web-assets** is primarily intended for build scripts, the package can easily be used programmatically in ESM and TypeScript projects.

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
**CLI Build Tools**
   - ???? [add-dist-header](https://github.com/center-key/add-dist-header):&nbsp; _Prepend a one-line banner comment (with license notice) to distribution files_
   - ???? [copy-file-util](https://github.com/center-key/copy-file-util):&nbsp; _Copy or rename a file with optional package version number_
   - ???? [copy-folder-util](https://github.com/center-key/copy-folder-util):&nbsp; _Recursively copy files from one folder to another folder_
   - ???? [replacer-util](https://github.com/center-key/replacer-util):&nbsp; _Find and replace strings or template outputs in text files_
   - ???? [rev-web-assets](https://github.com/center-key/rev-web-assets):&nbsp; _Revision web asset filenames with cache busting content hash fingerprints_
   - ???? [run-scripts-util](https://github.com/center-key/run-scripts-util):&nbsp; _Organize npm scripts into named groups of easy to manage commands_
   - ???? [w3c-html-validator](https://github.com/center-key/w3c-html-validator):&nbsp; _Check the markup validity of HTML files using the W3C validator_

Feel free to submit questions at:<br>
[github.com/center-key/rev-web-assets/issues](https://github.com/center-key/rev-web-assets/issues)

[MIT License](LICENSE.txt)
