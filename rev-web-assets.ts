// rev-web-assets ~~ MIT License

import crypto from 'crypto';
import fs     from 'fs-extra';
import path   from 'path';
import slash  from 'slash';

export type Options = {
   cd?:           string,   //change working directory
   saveManifest?: boolean,  //output the list of files to manifest.json in the target folder
   };
export type ManifestDetail = {
   origin:          string,         //source path of asset file
   filename:        string,         //source filename of asset file
   extension:       string,         //file extension of asset file
   canonical:       string,         //normalized path used to lookup asset in manifest
   canonicalFolder: string,         //directory of the normalized path of the asset file
   isHtml:          boolean,        //true if the asset file is HTML
   isCss:           boolean,        //true if the asset file is CSS
   hash:            string | null,  //seven digit cache busting hex humber that changes if the asset changes
   hashFilename:    string | null,  //filename of the asset with hash inserted before the file extension
   destFolder:      string,         //directory of the target asset
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

   readDirSyncRecursive(folder: string): string[] {
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

   manifest(source: string, target: string) {
      const files = revWebAssets.readDirSyncRecursive(source);
      const process = (file: string) => {
         const fileExtension = path.extname(file).toLowerCase();
         const isHtml =        ['.html', '.htm'].includes(fileExtension);
         const isCss =         ['.css'].includes(fileExtension);
         const canonical =     file.substring(source.length + 1);
         const canonicalFolder = path.dirname(canonical).replace(/\.$/, '');
         const destFolder =    !canonicalFolder ? target : target + '/' + canonicalFolder;
         return {
            origin:          file,
            filename:        path.basename(file),
            extension:       fileExtension,
            canonicalFolder: canonicalFolder,
            canonical:       canonical,
            isHtml:          isHtml,
            isCss:           isCss,
            hash:            null,
            hashFilename:    null,
            destFolder:      destFolder,
            };
         }
      const manifest = files.map(process);
      return manifest;
      },

   hashFilename(filename: string, hash: string | null): string {
      const lastDot = /\.(?=[^.]*$)/;
      return !hash ? filename : filename.replace(lastDot, '.' + hash + '.');
      // return filename.replace('.', '.' + hash + '.');
      },

   calcAssetHash(detail: ManifestDetail): void {
      const hashLen =  7;
      const contents = fs.readFileSync(detail.origin).toString();
      detail.hash = crypto.createHash('md5').update(contents).digest('hex').substring(0, hashLen);
      detail.hashFilename = revWebAssets.hashFilename(detail.filename, detail.hash);
      },

   hashAssetPath(manifest: Manifest, detail: ManifestDetail) {
      return (matched: string, pre: string, uri: string, post: string): string => {
         const ext =           path.extname(uri);
         const doNotHash =     uri.includes(':') || ['.html', '.htm'].includes(ext) || ext.length < 2;
         const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
         const canonical =     slash(path.normalize(canonicalPath + uri));
         const assetDetail =   doNotHash ? null : manifest.find(detail => detail.canonical === canonical);
         if (assetDetail && !assetDetail.hash)
            revWebAssets.calcAssetHash(assetDetail);
         return assetDetail?.hash ? pre + revWebAssets.hashFilename(uri, assetDetail.hash) + post : matched;
         };
      },

   processHtml(manifest: ManifestDetail[]) {
      // href: <a>, <area>, <link>, <base>
      // src: <img>, <script>, <iframe>, <audio>, <video>, <embed>, <input>, <source>, <track>
      const hrefPattern = /(<[a-z]{1,4}\s.*href=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig
      const srcPattern =  /(<[a-z]{3,6}\s.*src=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig
      const process = (detail: ManifestDetail) => {
         const content = fs.readFileSync(detail.origin, 'utf-8');
         const hashedContent = content
            .replace(hrefPattern, revWebAssets.hashAssetPath(manifest, detail))
            .replace(srcPattern,  revWebAssets.hashAssetPath(manifest, detail));
         fs.ensureDirSync(detail.destFolder);
         fs.writeFileSync(detail.destFolder + '/' + detail.filename, hashedContent);
         };
      manifest.filter(detail => detail.isHtml).forEach(process);
      },

   processCss(manifest: ManifestDetail[]) {
      // url(../background.jpg)
      const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig
      const process = (detail: ManifestDetail) => {
         const content = fs.readFileSync(detail.origin, 'utf-8');
         const hashedContent = content
            .replace(urlPattern, revWebAssets.hashAssetPath(manifest, detail));
         fs.ensureDirSync(detail.destFolder);
         const filename = detail.hashFilename ?? detail.filename;
         fs.writeFileSync(detail.destFolder + '/' + filename, hashedContent);
         };
      manifest.filter(detail => detail.isCss).forEach(process);
      },

   copyAssets(manifest: Manifest) {
      const process = (detail: ManifestDetail) => {
         const filename = detail.hashFilename ?? detail.filename;
         fs.copyFileSync(detail.origin, detail.destFolder + '/' + filename);
         };
      manifest.filter(file => !file.isHtml && !file.isCss).forEach(process);
      },

   revision(sourceFolder: string, targetFolder: string, options?: Options): Results {
      const defaults = {
         cd:           null,
         saveManifest: false,
         };
      const settings = { ...defaults, ...options };
      const startTime = Date.now();
      const normalize = (folder: string) =>
         !folder ? '' : slash(path.normalize(folder)).replace(/\/$/, '');
      const startFolder = settings.cd ? normalize(settings.cd) + '/' : '';
      const source =      normalize(startFolder + sourceFolder);
      const target =      normalize(startFolder + targetFolder);
      if (targetFolder)
         fs.ensureDirSync(target);
      const errorMessage =
         !sourceFolder ?                      'Must specify the source folder path.' :
         !targetFolder ?                      'Must specify the target folder path.' :
         !fs.pathExistsSync(source) ?         'Source folder does not exist: ' + source :
         !fs.pathExistsSync(target) ?         'Target folder cannot be created: ' + target :
         !fs.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
         !fs.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
         null;
      if (errorMessage)
         throw Error('[rev-web-assets] ' + errorMessage);
      const manifest = revWebAssets.manifest(source, target);
      revWebAssets.processHtml(manifest);
      revWebAssets.processCss(manifest);
      revWebAssets.copyAssets(manifest);
      const manifestPath = path.join(target, 'manifest.json');
      if (settings.saveManifest)
         fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '   '));
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
