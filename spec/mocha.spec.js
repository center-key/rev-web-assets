// rev-web-assets
// Mocha Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import { readdirSync, readFileSync } from 'fs';
import assert from 'assert';

// Setup
import { revWebAssets } from '../dist/rev-web-assets.js';
const options = { saveManifest: true };
let results;
before(() =>
   results = revWebAssets.revision('spec/fixtures/source', 'spec/fixtures/target', options));

////////////////////////////////////////////////////////////////////////////////////////////////////
describe('The "dist" folder', () => {

   it('contains the correct files', () => {
      const actual = readdirSync('dist');
      const expected = [
         'rev-web-assets.d.ts',
         'rev-web-assets.js',
         'rev-web-assets.umd.cjs',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////////////////////////
describe('Generated manifest', () => {

   it('contains the correct list of files', () => {
      const actual = results.manifest;
      const expected = JSON.parse(readFileSync('spec/fixtures/expected-manifest.json', 'utf-8'));
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////////////////////////
describe('Target folder', () => {

   it('contains the correct files with the correct revisioned filenames', () => {
      const actual = revWebAssets.readDirSyncRecursive('spec/fixtures/target');
      const expected = [
         'spec/fixtures/target/graphics/mock1.ad41b20.jpg',
         'spec/fixtures/target/manifest.json',
         'spec/fixtures/target/mock1.a2fcaff.js',
         'spec/fixtures/target/mock1.html',
         'spec/fixtures/target/mock1.min.c2f4e84.css',
         'spec/fixtures/target/subfolder/graphics/mock2.9e7dfdb.jpg',
         'spec/fixtures/target/subfolder/mock2.868e0e2.js',
         'spec/fixtures/target/subfolder/mock2.html',
         'spec/fixtures/target/subfolder/mock2.min.9b4a1b2.css',
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });

////////////////////////////////////////////////////////////////////////////////////////////////////
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
