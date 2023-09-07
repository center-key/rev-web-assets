// rev-web-assets
// Mocha Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import { cliArgvUtil } from 'cli-argv-util';
import fs from 'fs';
import assert from 'assert';

// Setup
import { revWebAssets } from '../dist/rev-web-assets.js';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
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

   it('has the correct functions', () => {
      const module = revWebAssets;
      const actual = Object.keys(module).sort().map(key => [key, typeof module[key]]);
      const expected = [
         ['calcAssetHash', 'function'],
         ['copyAssets',    'function'],
         ['hashAssetPath', 'function'],
         ['hashFilename',  'function'],
         ['manifest',      'function'],
         ['processCss',    'function'],
         ['processHtml',   'function'],
         ['removeHash',    'function'],
         ['reporter',      'function'],
         ['revision',      'function'],
         ];
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

   it('contains the correct file details for mock1.jpg', () => {
      const manifest = JSON.parse(fs.readFileSync('spec/fixtures/target/manifest.json', 'utf-8'));
      const actual = manifest[0];
      const expected = {
         origin:          'spec/fixtures/source/graphics/mock1.jpg',
         filename:        'mock1.jpg',
         canonicalFolder: 'graphics',
         canonical:       'graphics/mock1.jpg',
         bytes:           20200,
         isHtml:          false,
         isCss:           false,
         hash:            'ad41b203',
         hashedFilename:  'mock1.ad41b203.jpg',
         destFolder:      'spec/fixtures/target/graphics',
         destPath:        'spec/fixtures/target/graphics/mock1.ad41b203.jpg',
         usedIn: [
            'mock1.html',
            'mock1.min.css',
            'mock1.php',
            'subfolder/mock2.html',
            'subfolder/mock2.min.css',
            'subfolder/mock2.php',
            ],
         references: 8,
         };
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Target folder', () => {

   it('contains the correct files with the correct revisioned filenames', () => {
      const actual = cliArgvUtil.readFolder('spec/fixtures/target');
      const expected = [
         'graphics',
         'graphics/mock1.ad41b203.jpg',
         'graphics/unused.jpg',
         'manifest.json',
         'mock1.bbd2ac8e.js',
         'mock1.html',
         'mock1.min.c2f4e84e.css',
         'mock1.php',
         'subfolder',
         'subfolder/graphics',
         'subfolder/graphics/mock2.9e7dfdbd.jpg',
         'subfolder/mock2.09d6bb59.js',
         'subfolder/mock2.html',
         'subfolder/mock2.min.9b4a1b29.css',
         'subfolder/mock2.php',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Specification utility function removeHash()', () => {

   it('reverts a hashed filename back to its original filename', () => {
      const folder = 'spec/fixtures/target/subfolder';
      const actual = cliArgvUtil.readFolder(folder).map(revWebAssets.removeHash);
      const expected = [
         'graphics',
         'graphics/mock2.jpg',
         'mock2.js',
         'mock2.html',
         'mock2.min.css',
         'mock2.php',
         ];
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
   const run = (posix) => cliArgvUtil.run(pkg, posix);

   it('with the --force flag revisions unused asset files', () => {
      run('rev-web-assets spec/fixtures/source/graphics spec/fixtures/target-force --force --manifest');
      const actual = fs.readdirSync('spec/fixtures/target-force').sort();
      const expected = [
         'manifest.json',
         'mock1.ad41b203.jpg',
         'unused.eb19dd7e.jpg',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });
