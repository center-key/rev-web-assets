// rev-web-assets
// Mocha Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import { execSync } from 'node:child_process';
import fs from 'fs';
import assert from 'assert';

// Setup
import { revWebAssets } from '../dist/rev-web-assets.js';
const options = {
   metaContentBase: 'https://example.net',
   saveManifest:    true,
   };
let results;
before(() =>
   results = revWebAssets.revision('spec/fixtures/source', 'spec/fixtures/target', options));

////////////////////////////////////////////////////////////////////////////////
describe('The "dist" folder', () => {

   it('contains the correct files', () => {
      const actual = fs.readdirSync('dist').sort();
      const expected = [
         'rev-web-assets.d.ts',
         'rev-web-assets.js',
         'rev-web-assets.umd.cjs',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Library module', () => {

   it('is an object', () => {
      const actual =   { constructor: revWebAssets.constructor.name };
      const expected = { constructor: 'Object' };
      assertDeepStrictEqual(actual, expected);
      });

   it('has a revision() function', () => {
      const actual =   { validate: typeof revWebAssets.revision };
      const expected = { validate: 'function' };
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Generated manifest', () => {

   it('contains a list of the correct number of files', () => {
      const manifest = JSON.parse(fs.readFileSync('spec/fixtures/target/manifest.json', 'utf-8'));
      const actual = {
         files:        manifest.length,
         results:      results.count,
         resultsFiles: results.manifest.length,
         };
      const expected = {
         files:        11,
         results:      11,
         resultsFiles: 11,
         };
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Target folder', () => {

   it('contains the correct files with the correct revisioned filenames', () => {
      const actual = revWebAssets.readFolderRecursive('spec/fixtures/target');
      const expected = [
         'spec/fixtures/target/graphics/mock1.ad41b203.jpg',
         'spec/fixtures/target/graphics/unused.jpg',
         'spec/fixtures/target/manifest.json',
         'spec/fixtures/target/mock1.189c6361.js',
         'spec/fixtures/target/mock1.html',
         'spec/fixtures/target/mock1.min.c2f4e84e.css',
         'spec/fixtures/target/mock1.php',
         'spec/fixtures/target/subfolder/graphics/mock2.9e7dfdbd.jpg',
         'spec/fixtures/target/subfolder/mock2.09d6bb59.js',
         'spec/fixtures/target/subfolder/mock2.html',
         'spec/fixtures/target/subfolder/mock2.min.9b4a1b29.css',
         'spec/fixtures/target/subfolder/mock2.php',
         ];
      if (process.platform === 'win32')  //windows incorrect eol alters hashes
         assertDeepStrictEqual({ files: actual.length }, { files: expected.length });
      else
         assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Correct error is thrown', () => {

   it('when the "source" folder is missing', () => {
      const makeBogusCall = () => revWebAssets.revision();
      const exception =     { message: '[rev-web-assets] Must specify the source folder path.' };
      assert.throws(makeBogusCall, exception);
      });

   it('when the "target" folder is missing', () => {
      const makeBogusCall = () => revWebAssets.revision('/source-folder');
      const exception =     { message: '[rev-web-assets] Must specify the target folder path.' };
      assert.throws(makeBogusCall, exception);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Executing the CLI', () => {
   const cmd = (posix) => process.platform === 'win32' ? posix.replaceAll('\\ ', '" "') : posix;
   const run = (posix) => execSync(cmd(posix), { stdio: 'inherit' });

   it('with the --force flag revisions unused asset files', () => {
      run('node bin/cli.js spec/fixtures/source/graphics spec/fixtures/target-force --force --manifest');
      const actual = revWebAssets.readFolderRecursive('spec/fixtures/target-force');
      const expected = [
         'spec/fixtures/target-force/manifest.json',
         'spec/fixtures/target-force/mock1.ad41b203.jpg',
         'spec/fixtures/target-force/unused.eb19dd7e.jpg',
         ];
      if (process.platform === 'win32')  //windows incorrect eol alters hashes
         assertDeepStrictEqual({ files: actual.length }, { files: expected.length });
      else
         assertDeepStrictEqual(actual, expected);
      });

   });
