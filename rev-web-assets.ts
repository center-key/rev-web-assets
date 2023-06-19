// rev-web-assets ~~ MIT License

import crypto from 'crypto';
import fs     from 'fs';
import path   from 'path';
import slash  from 'slash';

export type Settings = {
   cd:              string | null,  //change working directory
   force:           boolean,        //revision (hash) all asset files even if not referenced
   metaContentBase: string | null,  //make meta URLs, like "og:image", absolute
   saveManifest:    boolean,        //output the list of files to manifest.json in the target folder
   };
export type Options = Partial<Settings>;
export type ManifestDetail = {
   origin:          string,          //source path of asset file
   filename:        string,          //source filename of asset file
   canonical:       string,          //normalized path used to lookup asset in manifest
   canonicalFolder: string,          //directory of the normalized path of the asset file
   isHtml:          boolean,         //true if the asset file is HTML
   isCss:           boolean,         //true if the asset file is CSS
   bytes:           number | null,   //asset file size
   hash:            string | null,   //eight-digit cache busting hex humber that changes if the asset changes
   hashedFilename:  string | null,   //filename of the asset with hash inserted before the file extension
   destFolder:      string,          //directory of the target asset
   destPath:        string | null,   //folder and filename of the target asset
   usedIn:          string[] | null, //files that references the asset
   references:      number | null,   //number of times the asset is referenced
   };
export type Manifest = ManifestDetail[];  //list of assets
export type Results = {
   source:   string;    //root directory of the original pre-revisioned files
   target:   string;    //root directory of the revisioned files
   count:    number;    //number of files in target folder
   duration: number;    //execution time in milliseconds
   manifest: Manifest,  //list of assets
   };

const revWebAssets = {

   readFolderRecursive(folder: string): string[] {
      const files: string[] = [];
      const process = (item: string) => {
         if (fs.statSync(item).isFile())
            files.push(slash(item));
         else
            fs.readdirSync(item).forEach((nestedItem: string) =>
               process(path.join(item, nestedItem)));
         };
      process(path.normalize(folder));
      return files.sort();
      },

   manifest(source: string, target: string): ManifestDetail[] {
      // Creates a manifest list with stub manifest details for each file in the source folder.
      const files = revWebAssets.readFolderRecursive(source);
      const process = (file: string): ManifestDetail => {
         const fileExtension = path.extname(file).toLowerCase();
         const isHtml =        ['.html', '.htm', '.php'].includes(fileExtension);
         const isCss =         ['.css'].includes(fileExtension);
         const canonical =     file.substring(source.length + 1);
         const canonicalFolder = path.dirname(canonical).replace(/\.$/, '');
         const destFolder =    !canonicalFolder ? target : target + '/' + canonicalFolder;
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

   calcAssetHash(detail: ManifestDetail): ManifestDetail {
      // Use the file contents of the asset to generate its hash and then store the hash in he
      // assets manifest detail.
      const hashLen =         8;
      const contents =        fs.readFileSync(detail.origin).toString();
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
      const replacer = (matched: string, pre: string, uri: string, post: string): string => {
         // Example matched broken into 3 parts:
         //    '<img src=logo.png alt=Logo>' ==> '<img src=', 'logo.png', ' alt=Logo>'
         const ext =           path.extname(uri);
         const doNotHash =     uri.includes(':') || ['.html', '.htm', '.php'].includes(ext) || ext.length < 2;
         const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
         const canonical =     slash(path.normalize(canonicalPath + uri));
         const assetDetail =   doNotHash ? null : manifest.find(detail => detail.canonical === canonical);
         if (assetDetail && !assetDetail.hash)
            revWebAssets.calcAssetHash(assetDetail);
         if (assetDetail)
            assetDetail.references!++;
         if (assetDetail && !assetDetail.usedIn!.includes(detail.canonical))
            assetDetail.usedIn!.push(detail.canonical);
         const hashedUri = () => {
            const hashed = revWebAssets.hashFilename(uri, assetDetail!.hash);
            const noBase = !settings.metaContentBase || !pre.startsWith('<meta');
            const trailingSlashes = /\/*$/;
            return noBase ? hashed : settings.metaContentBase!.replace(trailingSlashes, '/') + hashed;
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
         const hashedContent = content
            .replace(hrefPattern, revWebAssets.hashAssetPath(manifest, detail, settings))
            .replace(srcPattern,  revWebAssets.hashAssetPath(manifest, detail, settings))
            .replace(metaPattern, revWebAssets.hashAssetPath(manifest, detail, settings));
         detail.destPath = detail.destFolder + '/' + detail.filename;
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.writeFileSync(detail.destPath, hashedContent);
         };
      manifest.filter(detail => detail.isHtml).forEach(process);
      },

   processCss(manifest: ManifestDetail[], settings: Settings) {
      // url(../background.jpg)
      const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig
      const process = (detail: ManifestDetail) => {
         const content = fs.readFileSync(detail.origin, 'utf-8');
         const hashedContent = content
            .replace(urlPattern, revWebAssets.hashAssetPath(manifest, detail, settings));
         detail.destPath = detail.destFolder + '/' + (detail.hashedFilename ?? detail.filename);
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.writeFileSync(detail.destPath, hashedContent);
         };
      manifest.filter(detail => detail.isCss).forEach(process);
      },

   copyAssets(manifest: ManifestDetail[]) {
      const process = (detail: ManifestDetail) => {
         detail.destPath = detail.destFolder + '/' + (detail.hashedFilename ?? detail.filename);
         fs.mkdirSync(detail.destFolder, { recursive: true });
         fs.copyFileSync(detail.origin, detail.destPath);
         };
      manifest.filter(file => !file.isHtml && !file.isCss).forEach(process);
      },

   revision(sourceFolder: string, targetFolder: string, options?: Options): Results {
      const defaults = {
         cd:              null,
         force:           false,
         metaContentBase: null,
         saveManifest:    false,
         };
      const settings = { ...defaults, ...options };
      const startTime = Date.now();
      const normalize = (folder: string) =>
         !folder ? '' : slash(path.normalize(folder)).replace(/\/$/, '');
      const startFolder = settings.cd ? normalize(settings.cd) + '/' : '';
      const source =      normalize(startFolder + sourceFolder);
      const target =      normalize(startFolder + targetFolder);
      if (targetFolder)
         fs.mkdirSync(target, { recursive: true });
      const errorMessage =
         !sourceFolder ?                      'Must specify the source folder path.' :
         !targetFolder ?                      'Must specify the target folder path.' :
         !fs.existsSync(source) ?             'Source folder does not exist: ' + source :
         !fs.existsSync(target) ?             'Target folder cannot be created: ' + target :
         !fs.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
         !fs.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
         null;
      if (errorMessage)
         throw Error('[rev-web-assets] ' + errorMessage);
      const manifest = revWebAssets.manifest(source, target);
      revWebAssets.processHtml(manifest, settings);
      revWebAssets.processCss(manifest,  settings);
      const hashUnusedAsset = (detail: ManifestDetail) =>
         !detail.hash && !detail.isHtml && revWebAssets.calcAssetHash(detail);
      if (settings.force)
         manifest.forEach(hashUnusedAsset);
      revWebAssets.copyAssets(manifest);
      manifest.forEach(detail => detail.usedIn && detail.usedIn.sort());
      const manifestPath = path.join(target, 'manifest.json');
      if (settings.saveManifest)
         fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '   ') + '\n');
      return {
         source:   source,
         target:   target,
         count:    manifest.length,
         duration: Date.now() - startTime,
         manifest: manifest,
         };
      },

   };

export { revWebAssets };
