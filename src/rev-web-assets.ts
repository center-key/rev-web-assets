// rev-web-assets ~~ MIT License
//
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
import { EOL } from 'node:os';
import chalk  from 'chalk';
import crypto from 'crypto';
import fs     from 'fs';
import log    from 'fancy-log';
import path   from 'path';
import slash  from 'slash';

// Types
export type Settings = {
   cd:              string | null,  //change working directory
   force:           boolean,        //revision (hash) all asset files even if not referenced
   metaContentBase: string | null,  //make meta URLs, like "og:image", absolute
   saveManifest:    boolean,        //output the list of files to manifest.json in the target folder
   skip:            string | null,  //do not revision (hash) asset files with paths containing given string.
   };
export type MissingAsset = {
   ext:             string,  //filename extension of the asset file not found
   line:            string,  //html line referencing the asset file not found
   };
export type ManifestDetail = {
   origin:          string,                //source path of asset file
   filename:        string,                //source filename of asset file
   canonical:       string,                //normalized path used to lookup asset in manifest
   canonicalFolder: string,                //directory of the normalized path of the asset file
   isHtml:          boolean,               //asset file is HTML
   isCss:           boolean,               //asset file is CSS
   bytes:           number | null,         //asset file size
   hash:            string | null,         //eight-digit cache busting hex humber that changes if the asset changes
   hashedFilename:  string | null,         //filename of the asset with hash inserted before the file extension
   destFolder:      string,                //directory of the target asset
   destPath:        string | null,         //folder and filename of the target asset
   usedIn:          string[] | null,       //files that references the asset
   references:      number | null,         //number of times the asset is referenced
   skipped:         boolean,               //asset file is configured to not be hashed
   missing:         MissingAsset[] | null, //asset files referenced but not found (404)
   };
export type Manifest = ManifestDetail[];  //list of assets
export type Results = {
   source:   string;    //root directory of the original pre-revisioned files
   target:   string;    //root directory of the revisioned files
   count:    number;    //number of files in target folder
   duration: number;    //execution time in milliseconds
   manifest: Manifest,  //list of assets
   };
export type ReporterSettings = {
   summaryOnly: boolean,  //only print out the single line summary message
   hide404s:    boolean,  //suppress warning messages about missing asset files
   };

const revWebAssets = {

   assert(ok: unknown, message: string | null) {
      if (!ok)
         throw new Error(`[rev-web-assets] ${message}`);
      },

   cli() {
      const validFlags = ['cd', 'force', 'hide404s', 'manifest', 'meta-content-base', 'note',
         'quiet', 'skip', 'summary'];
      const cli =    cliArgvUtil.parse(validFlags);
      const source = cli.params[0];
      const target = cli.params[1];
      const error =
         cli.invalidFlag ?    cli.invalidFlagMsg :
         !source ?            'Missing source folder.' :
         !target ?            'Missing target folder.' :
         cli.paramCount > 2 ? 'Extraneous parameter: ' + cli.params[2]! :
         null;
      revWebAssets.assert(!error, error);
      const options: Settings = {
         cd:              cli.flagMap.cd ?? null,
         force:           cli.flagOn.force!,
         metaContentBase: cli.flagMap.metaContentBase ?? null,
         saveManifest:    cli.flagOn.manifest!,
         skip:            cli.flagMap.skip ?? null,
         };
      const results = revWebAssets.revision(source!, target!, options);
      const reporterOptions: ReporterSettings = {
         summaryOnly: cli.flagOn.summary!,
         hide404s:    cli.flagOn.hide404s!,
         };
      if (!cli.flagOn.quiet)
         revWebAssets.reporter(results, reporterOptions);
      },

   manifest(source: string, target: string, skip: string | null): ManifestDetail[] {
      // Creates a manifest list with stub manifest details for each file in the source folder.
      const files = fs.readdirSync(source, { recursive: true })
         .map(file => slash(path.join(source, file.toString())))
         .filter(file => fs.statSync(file).isFile())
         .sort();
      const process = (file: string): ManifestDetail => {
         const fileExtension =   path.extname(file).toLowerCase();
         const isHtml =          ['.html', '.htm', '.php'].includes(fileExtension);
         const isCss =           ['.css'].includes(fileExtension);
         const canonical =       file.substring(source.length + 1);
         const canonicalFolder = path.dirname(canonical).replace(/\.$/, '');
         const destFolder =      !canonicalFolder ? target : target + '/' + canonicalFolder;
         return {
            origin:          file,
            filename:        path.basename(file),
            canonicalFolder: canonicalFolder,
            canonical:       canonical,
            bytes:           null,
            isHtml:          isHtml,
            isCss:           isCss,
            hash:            null,
            hashedFilename:  null,
            destFolder:      destFolder,
            destPath:        null,
            usedIn:          isHtml ? null : [],
            references:      isHtml ? null : 0,
            skipped:         !isHtml && !!skip && file.includes(skip),
            missing:         isHtml || isCss ? [] : null,
            };
         }
      const manifest = files.map(process);
      return manifest;
      },

   hashFilename(filename: string, hash: string | null): string {
      // Example:
      //    './graphics/logo.png' + 'bd41b20' --> 'graphics/logo.bd41b20.png'
      const lastDot = /\.(?=[^.]*$)/;
      return slash(path.normalize(!hash ? filename : filename.replace(lastDot, '.' + hash + '.')));
      },

   stripHash(filename: string): string {
      // Reverts a hashed filename back to its original filename (for use in specification cases
      // to verify hashed file exists).
      // Example:
      //    'graphics/logo.bd41b20.png' --> 'graphics/logo.png'
      return filename.replace(/[.][0-9a-f]{8}[.]/, '.');
      },

   readJustFiles(folder: string): string[] {
      // Returns the list of files in the folder with hashes removed from the filenames.
      const isFile = (file: string) => fs.statSync(folder + '/' + file).isFile();
      return fs.readdirSync(folder).filter(isFile).map(revWebAssets.stripHash).sort();
      },

   calcAssetHash(detail: ManifestDetail): ManifestDetail {
      // Use the file contents of the asset to generate its hash and then store the hash in he
      // assets manifest detail.
      const hashLen =         8;
      const brokenWindows =   /$\r\n/gm;
      const cleanUpText =     (buffer: Buffer) => buffer.toString().replace(brokenWindows, '\n');
      const contents =        cleanUpText(fs.readFileSync(detail.origin));
      const hash =            crypto.createHash('md5').update(contents).digest('hex');
      detail.bytes =          contents.length;
      detail.hash =           hash.substring(0, hashLen);
      detail.hashedFilename = revWebAssets.hashFilename(detail.filename, detail.hash);
      return detail;
      },

   hashAssetPath(manifest: ManifestDetail[], detail: ManifestDetail, settings: Settings) {
      // Returns a function that takes RegEx matched parts for an asset reference and swaps in
      // the hashed filename.
      // Example function output:
      //    '<img src=logo.c2f3e84e.png alt=Logo>'
      const webPages = ['.html', '.htm', '.php'];
      const replacer = (matched: string, pre: string, url: string, post: string): string => {
         // Example matched broken into 3 parts:
         //    '<img src=logo.png alt=Logo>' ==> '<img src=', 'logo.png', ' alt=Logo>'
         const line =          matched.replace(/\s+/g, ' ');
         const uri =           url.replace(/[#?].*/, '');  //strip off trailing query string and hash fragment
         const ext =           path.extname(uri);
         const isTemplate =    /{.*}|<.*>|~~.*~~/.test(uri);
         const unhashable =    uri.includes(':') || webPages.includes(ext) || ext.length < 2;
         const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
         const canonical =     slash(path.normalize(canonicalPath + uri));
         const isAssetDetail = (detail: ManifestDetail) => detail.canonical === canonical;
         const assetDetail =   isTemplate || unhashable ? null : manifest.find(isAssetDetail);
         const skipAsset =     !!settings.skip && uri.includes(settings.skip);
         if (assetDetail && !assetDetail.hash && !skipAsset)
            revWebAssets.calcAssetHash(assetDetail);
         if (assetDetail)
            assetDetail.references!++;
         if (assetDetail && !assetDetail.usedIn!.includes(detail.canonical))
            assetDetail.usedIn!.push(detail.canonical);
         if (!isTemplate && !unhashable && !skipAsset && !assetDetail)
            detail.missing!.push({ ext, line });
         const trailingSlashes = /\/*$/;
         const metaContentBase = settings.metaContentBase?.replace(trailingSlashes, '/');
         const absoluteUrl = () =>
            `${metaContentBase}${assetDetail?.canonicalFolder}/${assetDetail?.hashedFilename}`;
         const hashedUri = () => {
            // Example: 'graphics/avatar.jpg' --> 'graphics/avatar.ad41b203.jpg'
            const noBase = !settings.metaContentBase || !pre.startsWith('<meta');
            return noBase ? revWebAssets.hashFilename(uri, assetDetail!.hash) : absoluteUrl();
            };
         return assetDetail?.hash ? pre + hashedUri() + post : matched;
         };
      return replacer;
      },

   processHtml(manifest: ManifestDetail[], settings: Settings) {
      // href: <a>, <area>, <link>, <base>
      // src:  <img>, <script>, <iframe>, <audio>, <video>, <embed>, <input>, <source>, <track>
      // meta: <meta property=og:image content=graphics/logo-card.png>
      const hrefPattern = /(<[a-z]{1,4}\s.*href=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig
      const srcPattern =  /(<[a-z]{3,6}\s.*src=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig
      const metaPattern = /(<meta\s.*content=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig
      const process = (detail: ManifestDetail) => {
         const content = fs.readFileSync(detail.origin, 'utf-8');
         const calcNext = () => revWebAssets.hashAssetPath(manifest, detail, settings);
         const hashedContent = content
            .replace(hrefPattern, calcNext())
            .replace(srcPattern,  calcNext())
            .replace(metaPattern, calcNext());
         detail.destPath = `${detail.destFolder}/${detail.filename}`;
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.writeFileSync(detail.destPath, hashedContent);
         };
      manifest.filter(detail => detail.isHtml).forEach(process);
      },

   processCss(manifest: ManifestDetail[], settings: Settings) {
      // url(../background.jpg)
      const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig
      const process = (detail: ManifestDetail) => {
         const content =       fs.readFileSync(detail.origin, 'utf-8');
         const calcNext =      () => revWebAssets.hashAssetPath(manifest, detail, settings);
         const hashedContent = content.replace(urlPattern, calcNext());
         const filename =      detail.hashedFilename ?? detail.filename;
         detail.destPath =     `${detail.destFolder}/${filename}`;
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.writeFileSync(detail.destPath, hashedContent);
         };
      manifest.filter(detail => detail.isCss).forEach(process);
      },

   copyAssets(manifest: ManifestDetail[]) {
      const process = (detail: ManifestDetail) => {
         detail.destPath = `${detail.destFolder}/${detail.hashedFilename ?? detail.filename}`;
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.copyFileSync(detail.origin, detail.destPath);
         };
      manifest.filter(file => !file.isHtml && !file.isCss).forEach(process);
      },

   revision(sourceFolder: string, targetFolder: string, options?: Partial<Settings>): Results {
      const defaults: Settings = {
         cd:              null,
         force:           false,
         metaContentBase: null,
         saveManifest:    false,
         skip:            null,
         };
      const settings =    { ...defaults, ...options };
      const startTime =   Date.now();
      const cleanPath =   (folder: string) => slash(path.normalize(folder.trim())).replace(/\/$/, '');
      const startFolder = settings.cd ? cleanPath(settings.cd) + '/' : '';
      const source =      cleanPath(startFolder + sourceFolder);
      const target =      cleanPath(startFolder + targetFolder);
      if (targetFolder)
         fs.mkdirSync(target, { recursive: true });
      const error =
         !sourceFolder ?                      'Must specify the source folder path.' :
         !targetFolder ?                      'Must specify the target folder path.' :
         !fs.existsSync(source) ?             'Source folder does not exist: ' + source :
         !fs.existsSync(target) ?             'Target folder cannot be created: ' + target :
         !fs.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
         !fs.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
         null;
      revWebAssets.assert(!error, error);
      const manifest = revWebAssets.manifest(source, target, settings.skip);
      revWebAssets.processHtml(manifest, settings);
      revWebAssets.processCss(manifest,  settings);
      const hashUnusedAsset = (detail: ManifestDetail) =>
         !detail.hash && !detail.isHtml && !detail.skipped && revWebAssets.calcAssetHash(detail);
      if (settings.force)
         manifest.forEach(hashUnusedAsset);
      revWebAssets.copyAssets(manifest);
      manifest.forEach(detail => detail.usedIn && detail.usedIn.sort());
      const manifestPath = path.join(target, 'manifest.json');
      const indent = '   ';
      const toJson = (data: unknown) =>
         JSON.stringify(data, null, indent).replace(/\r?\n/g, EOL) + EOL;
      if (settings.saveManifest)
         fs.writeFileSync(manifestPath, toJson(manifest));
      return {
         source:   source,
         target:   target,
         count:    manifest.length,
         duration: Date.now() - startTime,
         manifest: manifest,
         };
      },

   reporter(results: Results, options?: Partial<ReporterSettings>): Results {
      const defaults: ReporterSettings = {
         summaryOnly: false,
         hide404s:    false,
         };
      const settings =  { ...defaults, ...options };
      const name =      chalk.gray('rev-web-assets');
      const ancestor =  cliArgvUtil.calcAncestor(results.source, results.target);
      const infoColor = results.count ? chalk.white : chalk.red.bold;
      const info =      infoColor(`(files: ${results.count}, ${results.duration}ms)`);
      const symbol = {
         arrow:     chalk.gray.bold('→'),
         checkmark: chalk.green.bold('✔'),
         indent:    chalk.gray('|'),
         };
      log(name, ancestor.message, info);
      const logDetail = (detail: ManifestDetail) => {
         const origin =    detail.origin.substring(results.source.length + 1);
         const dest =      detail.destPath!.substring(results.target.length + 1);
         const checkmark = detail.hash ? symbol.checkmark : '';
         log(name, symbol.indent, cliArgvUtil.calcAncestor(origin, dest).message, checkmark);
         const warning = (ext: string) => chalk.red.bold(`missing ${ext} asset in`);
         const file =    chalk.blue.bold(detail.origin);
         const logMissingAsset = (missing: MissingAsset) =>
            log(name, warning(missing.ext), file, symbol.arrow, chalk.green(missing.line));
         if (!settings.hide404s && detail.missing)
            detail.missing.forEach(logMissingAsset);
         };
      if (!settings.summaryOnly)
         results.manifest.forEach(logDetail);
      return results;
      },

   };

export { revWebAssets };
