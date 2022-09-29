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
//    $ node bin/cli.js --cd=spec/fixtures source target

// Imports
import { revWebAssets } from '../dist/rev-web-assets.js';
import chalk            from 'chalk';
import log              from 'fancy-log';

// Parameters
const validFlags =  ['cd', 'manifest', 'meta-content-base', 'quiet', 'summary'];
const args =        process.argv.slice(2);
const flags =       args.filter(arg => /^--/.test(arg));
const flagMap =     Object.fromEntries(flags.map(flag => flag.replace(/^--/, '').split('=')));
const invalidFlag = Object.keys(flagMap).find(key => !validFlags.includes(key));
const params =      args.filter(arg => !/^--/.test(arg));

// Data
const source = params[0];
const target = params[1];
const mode = {
   manifest: 'manifest' in flagMap,
   quiet:    'quiet'    in flagMap,
   summary:  'summary'  in flagMap,
   };

// Reporting
const printReport = (results, summaryOnly) => {
   const name =      chalk.gray('rev-web-assets');
   const source =    chalk.blue.bold(results.source);
   const target =    chalk.magenta(results.target);
   const arrow =     { big: chalk.gray.bold('➤➤➤'), little: chalk.gray.bold(' ⟹  ') };  //extra space for alignment
   const infoColor = results.count ? chalk.white : chalk.red.bold;
   const info =      infoColor(`(files: ${results.count}, ${results.duration}ms)`);
   log(name, source, arrow.big, target, info);
   const logDetail = (detail) => {
      const origin = chalk.white(detail.origin.substring(results.source.length + 1));
      const dest =   chalk.green(detail.destPath.substring(results.target.length + 1));
      log(name, origin, arrow.little, dest);
      };
   if (!summaryOnly)
      results.manifest.forEach(logDetail);
   };

// Revision Web Assets
const error =
   invalidFlag ?       'Invalid flag: ' + invalidFlag :
   !source ?           'Missing source folder.' :
   !target ?           'Missing target folder.' :
   params.length > 2 ? 'Extraneous parameter: ' + params[2] :
   null;
if (error)
   throw Error('[rev-web-assets] ' + error);
const options = {
   cd:              flagMap.cd ?? null,
   metaContentBase: flagMap['meta-content-base'] ?? null,
   saveManifest:    mode.manifest,
   };
const results = revWebAssets.revision(source, target, options);
if (!mode.quiet)
   printReport(results, mode.summary);
