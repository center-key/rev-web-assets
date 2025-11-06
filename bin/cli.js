#!/usr/bin/env node
////////////////////
// rev-web-assets //
// MIT License    //
////////////////////

// Usage in package.json:
//    "scripts": {
//       "rev": "rev-web-assets build dist"
//    },
//
// Usage from command line:
//    $ npm install --save-dev rev-web-assets
//    $ rev-web-assets build/web-app dist/web-app
//
// Contributors to this project:
//    $ cd rev-web-assets
//    $ npm install
//    $ npm test
//    $ node bin/cli.js --cd=spec/fixtures source target --meta-content-base=https://example.net

// Imports
import { cliArgvUtil } from 'cli-argv-util';
import { revWebAssets } from '../dist/rev-web-assets.js';

// Parameters and flags
const validFlags =
   ['cd', 'force', 'hide404s', 'manifest', 'meta-content-base', 'note', 'quiet', 'skip', 'summary'];
const cli =    cliArgvUtil.parse(validFlags);
const source = cli.params[0];
const target = cli.params[1];

// Revision Web Assets
const error =
   cli.invalidFlag ?    cli.invalidFlagMsg :
   !source ?            'Missing source folder.' :
   !target ?            'Missing target folder.' :
   cli.paramCount > 2 ? 'Extraneous parameter: ' + cli.params[2] :
   null;
revWebAssets.assert(!error, error);
const options = {
   cd:              cli.flagMap.cd ?? null,
   force:           cli.flagOn.force,
   metaContentBase: cli.flagMap.metaContentBase ?? null,
   saveManifest:    cli.flagOn.manifest,
   skip:            cli.flagMap.skip ?? null,
   };
const results = revWebAssets.revision(source, target, options);
const reporterOptions = {
   summaryOnly: cli.flagOn.summary,
   hide404s:    cli.flagOn.hide404s,
   };
if (!cli.flagOn.quiet)
   revWebAssets.reporter(results, reporterOptions);
