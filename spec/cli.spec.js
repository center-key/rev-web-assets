// rev-web-assets
// CLI Specification Suite

// Imports
import { assertDeepStrictEqual } from 'assert-deep-strict-equal';
import { cliArgvUtil } from 'cli-argv-util';
import fs from 'fs';

// Setup and Utilities
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const run = (posix) => cliArgvUtil.run(pkg, posix);

////////////////////////////////////////////////////////////////////////////////
describe('Executing the CLI', () => {

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
