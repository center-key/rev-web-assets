// rev-web-assets
// Package Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import fs from 'node:fs';

// Setup
import { revWebAssets } from '../dist/rev-web-assets.js';

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
describe('Library version number', () => {

   it('follows semantic version formatting', () => {
      const version =  revWebAssets.version;
      const semVer =   /\d+[.]\d+[.]\d+/;
      const actual =   { version: version, valid: semVer.test(version) };
      const expected = { version: version, valid: true };
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
         ['assertOk',      'function'],
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
         ['version',       'string'],
         ];
      assertDeepStrictEqual(actual, expected);
      });

   });
