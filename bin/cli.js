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
//    $ npm install --global rev-web-assets
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
import chalk from 'chalk';
import log   from 'fancy-log';

// Parameters and flags
const validFlags = ['cd', 'force', 'manifest', 'meta-content-base', 'note', 'quiet', 'summary'];
const cli =        cliArgvUtil.parse(validFlags);
const source =     cli.params[0];
const target =     cli.params[1];

// Reporting
const printReport = (results) => {
   const name =      chalk.gray('rev-web-assets');
   const source =    chalk.blue.bold(results.source);
   const target =    chalk.magenta(results.target);
   const arrow =     { big: chalk.gray.bold(' ⟹  '), little: chalk.gray.bold('→') };
   const infoColor = results.count ? chalk.white : chalk.red.bold;
   const info =      infoColor(`(files: ${results.count}, ${results.duration}ms)`);
   log(name, source, arrow.big, target, info);
   const logDetail = (detail) => {
      const origin = chalk.white(detail.origin.substring(results.source.length + 1));
      const dest =   chalk.green(detail.destPath.substring(results.target.length + 1));
      log(name, origin, arrow.little, dest);
      };
   if (!cli.flagOn.summary)
      results.manifest.forEach(logDetail);
   };

// Revision Web Assets
const error =
   cli.invalidFlag ?     cli.invalidFlagMsg :
   !source ?             'Missing source folder.' :
   !target ?             'Missing target folder.' :
   cli.paramsCount > 2 ? 'Extraneous parameter: ' + cli.params[2] :
   null;
if (error)
   throw Error('[rev-web-assets] ' + error);
const options = {
   cd:              cli.flagMap.cd ?? null,
   force:           cli.flagOn.force,
   metaContentBase: cli.flagMap.metaContentBase ?? null,
   saveManifest:    cli.flagOn.manifest,
   };
const results = revWebAssets.revision(source, target, options);
if (!cli.flagOn.quiet)
   printReport(results);
