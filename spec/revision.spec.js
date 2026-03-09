// rev-web-assets
// Function revision() Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import { cliArgvUtil } from 'cli-argv-util';
import fs from 'fs';

// Setup
import { revWebAssets } from '../dist/rev-web-assets.js';
const options = {
   metaContentBase: 'https://example.net',
   saveManifest:    true,
   skip:            'do-not-hash',
   };
let results;
before(() =>
   results = revWebAssets.revision('spec/fixtures', 'spec/target/direct', options));

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
