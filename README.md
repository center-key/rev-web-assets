# rev-web-assets
<img src=https://centerkey.com/graphics/center-key-logo.svg align=right width=200 alt=logo>

_Revision web asset filenames with cache busting content hash fingerprints_

[![License:MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/center-key/rev-web-assets/blob/main/LICENSE.txt)
[![npm](https://img.shields.io/npm/v/rev-web-assets.svg)](https://www.npmjs.com/package/rev-web-assets)
[![Build](https://github.com/center-key/rev-web-assets/actions/workflows/run-spec-on-push.yaml/badge.svg)](https://github.com/center-key/rev-web-assets/actions/workflows/run-spec-on-push.yaml)

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
### 1. npm package.json scripts
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

### 2. Command-line npx
Example terminal commands:
```shell
$ npm install --save-dev rev-web-assets
$ npx rev-web-assets build/dev/web-app build/prod/web-app
```
You can also install **rev-web-assets** globally (`--global`) and then run it anywhere directly from the terminal.

### 3. CLI flags
Command-line flags:
| Flag                  | Description                                                            | Value      |
| --------------------- | ---------------------------------------------------------------------- | ---------- |
| `--cd`                | Change working directory before starting starting.                     | **string** |
| `--force`             | Revision (hash) all asset files even if not referenced.                | N/A        |
| `--manifest`          | Output the list of files to: **manifest.json**                         | N/A        |
| `--meta-content-base` | Make meta URLs, like "og:image", absolute.                             | **string** |
| `--note`              | Place to add a comment only for humans.                                | **string** |
| `--quiet`             | Suppress informational messages.                                       | N/A        |
| `--skip`              | Do not revision (hash) asset files with paths containing given string. | **string** |
| `--summary`           | Only print out the single line summary message.                        | N/A        |

Examples:
   - `rev-web-assets web/source web/target`<br>
   Revisions the files in the **web/source** folder and saves the new files to the **web/target** folder.

   - `rev-web-assets --cd=web source target`<br>
   Identical to the previous example.

   - `rev-web-assets source target --quiet`<br>
   Displays no output.

   - `rev-web-assets source target --summary`<br>
   Displays the summary but not the individual filenames.

   - `rev-web-assets source 'target/Web Files' --summary`<br>
   Save the target files to a folder that has a space in its name.

   - `rev-web-assets source target --meta-content-base=https://example.net`<br>
   Prepends the base to `<meta>` URLs.

_**Note:** Single quotes in commands are normalized so they work cross-platform and avoid the
errors often encountered on Microsoft Windows._

URLs in `<meta>` tag `content` attributes generally need to be absolute URLs.&nbsp;
Setting the `--meta-content-base` flag to `https://example.net` will transform the line of HTML from:
```html
<meta property=og:image content="logo.png">
```
into something like:
```html
<meta property=og:image content="https://example.net/logo.ad41b20.png">
```

The `--manifest` flag produces a JSON file containing an array objects with details about each file:
```typescript
export type ManifestDetail = {
   origin:          string,          //source path of asset file
   filename:        string,          //source filename of asset file
   canonical:       string,          //normalized path used to lookup asset in manifest
   canonicalFolder: string,          //directory of the normalized path of the asset file
   isHtml:          boolean,         //asset file is HTML
   isCss:           boolean,         //asset file is CSS
   bytes:           number | null,   //asset file size
   hash:            string | null,   //eight-digit cache busting hex humber that changes if the asset changes
   hashedFilename:  string | null,   //filename of the asset with hash inserted before the file extension
   destFolder:      string,          //directory of the target asset
   destPath:        string | null,   //folder and filename of the target asset
   usedIn:          string[] | null, //files that references the asset
   references:      number | null,   //number of times the asset is referenced
   skipped:         boolean,         //asset file is configured to not be hashed
   };
```
Example:
```json
   {
      "origin": "src/website/graphics/logo.png",
      "filename": "logo.png",
      "canonicalFolder": "graphics",
      "canonical": "graphics/logo.png",
      "bytes": 7203,
      "isHtml": false,
      "isCss": false,
      "hash": "ad42b203",
      "hashedFilename": "logo.ad42b203.png",
      "destFolder": "target/website/graphics",
      "destPath": "target/website/graphics/logo.ad42b203.png",
      "usedIn": [
         "index.html",
         "products/index.html",
         "style.css",
      ],
      "references": 7
   },
```

## C) Application Code
Even though **rev-web-assets** is primarily intended for build scripts, the package can be used programmatically in ESM and TypeScript projects.

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
**CLI Build Tools for package.json**
   - 🎋 [add-dist-header](https://github.com/center-key/add-dist-header):&nbsp; _Prepend a one-line banner comment (with license notice) to distribution files_
   - 📄 [copy-file-util](https://github.com/center-key/copy-file-util):&nbsp; _Copy or rename a file with optional package version number_
   - 📂 [copy-folder-util](https://github.com/center-key/copy-folder-util):&nbsp; _Recursively copy files from one folder to another folder_
   - 🪺 [recursive-exec](https://github.com/center-key/recursive-exec):&nbsp; _Run a command on each file in a folder and its subfolders_
   - 🔍 [replacer-util](https://github.com/center-key/replacer-util):&nbsp; _Find and replace strings or template outputs in text files_
   - 🔢 [rev-web-assets](https://github.com/center-key/rev-web-assets):&nbsp; _Revision web asset filenames with cache busting content hash fingerprints_
   - 🚆 [run-scripts-util](https://github.com/center-key/run-scripts-util):&nbsp; _Organize npm package.json scripts into groups of easy to manage commands_
   - 🚦 [w3c-html-validator](https://github.com/center-key/w3c-html-validator):&nbsp; _Check the markup validity of HTML files using the W3C validator_

Feel free to submit questions at:<br>
[github.com/center-key/rev-web-assets/issues](https://github.com/center-key/rev-web-assets/issues)

[MIT License](LICENSE.txt)
