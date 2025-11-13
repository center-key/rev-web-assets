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
   skip:            'do-not-hash',
   };
let results;
before(() =>
   results = revWebAssets.revision('spec/fixtures', 'spec/target/direct', options));

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
         ['assert',        'function'],
         ['calcAssetHash', 'function'],
         ['cli',           'function'],
         ['copyAssets',    'function'],
         ['hashAssetPath', 'function'],
         ['hashFilename',  'function'],
         ['manifest',      'function'],
         ['processCss',    'function'],
         ['processHtml',   'function'],
         ['readJustFiles', 'function'],
         ['reporter',      'function'],
         ['revision',      'function'],
         ['stripHash',     'function'],
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Generated manifest', () => {

   it('contains a list of the correct number of files', () => {
      const manifest = JSON.parse(fs.readFileSync('spec/target/direct/manifest.json', 'utf-8'));
      const actual = {
         files:        manifest.length,
         results:      results.count,
         resultsFiles: results.manifest.length,
         };
      const expected = {
         files:        12,
         results:      12,
         resultsFiles: 12,
         };
      assertDeepStrictEqual(actual, expected);
      });

   it('contains the correct file details for mock1.jpg', () => {
      const manifest = JSON.parse(fs.readFileSync('spec/target/direct/manifest.json', 'utf-8'));
      const actual =   manifest[1];
      const expected = {
         origin:          'spec/fixtures/graphics/mock1.jpg',
         filename:        'mock1.jpg',
         canonicalFolder: 'graphics',
         canonical:       'graphics/mock1.jpg',
         bytes:           20200,
         isHtml:          false,
         isCss:           false,
         hash:            'ad41b203',
         hashedFilename:  'mock1.ad41b203.jpg',
         destFolder:      'spec/target/direct/graphics',
         destPath:        'spec/target/direct/graphics/mock1.ad41b203.jpg',
         usedIn: [
            'mock1.html',
            'mock1.min.css',
            'mock1.php',
            'subfolder/mock2.html',
            'subfolder/mock2.min.css',
            'subfolder/mock2.php',
            ],
         references: 8,
         skipped:    false,
         missing:    null,
         };
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Target folder', () => {

   it('contains the correct files with the correct revisioned filenames', () => {
      const actual = cliArgvUtil.readFolder('spec/target/direct');
      const expected = [
         'graphics',
         'graphics/do-not-hash.jpg',
         'graphics/mock1.ad41b203.jpg',
         'graphics/unused.jpg',
         'manifest.json',
         'mock1.406c9089.js',
         'mock1.html',
         'mock1.min.d45c0047.css',
         'mock1.php',
         'subfolder',
         'subfolder/graphics',
         'subfolder/graphics/mock2.9e7dfdbd.jpg',
         'subfolder/mock2.b8a8bb60.js',
         'subfolder/mock2.html',
         'subfolder/mock2.min.4aac299e.css',
         'subfolder/mock2.php',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////
describe('Specification utility function', () => {

   it('stripHash() reverts a hashed filename back to its original filename', () => {
      const folder = 'spec/target/direct/subfolder';
      const actual = cliArgvUtil.readFolder(folder).map(revWebAssets.stripHash).sort();
      const expected = [
         'graphics',
         'graphics/mock2.jpg',
         'mock2.html',
         'mock2.js',
         'mock2.min.css',
         'mock2.php',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   it('readJustFiles() gets the correct list of original filenames for a folder', () => {
      const folder = 'spec/target/direct/subfolder';
      const actual = revWebAssets.readJustFiles(folder);
      const expected = [
         'mock2.html',
         'mock2.js',
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
      run('rev-web-assets spec/fixtures/graphics spec/target/force --force --skip=do-not-hash --manifest');
      const actual = fs.readdirSync('spec/target/force').sort();
      const expected = [
         'do-not-hash.jpg',
         'manifest.json',
         'mock1.ad41b203.jpg',
         'unused.eb19dd7e.jpg',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });
