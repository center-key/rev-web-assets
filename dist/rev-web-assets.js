//! rev-web-assets v1.3.3 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import log from 'fancy-log';
import path from 'path';
import slash from 'slash';
const revWebAssets = {
    manifest(source, target) {
        const files = fs.readdirSync(source, { recursive: true })
            .map(file => slash(path.join(source, file.toString())))
            .filter(file => fs.statSync(file).isFile())
            .sort();
        const process = (file) => {
            const fileExtension = path.extname(file).toLowerCase();
            const isHtml = ['.html', '.htm', '.php'].includes(fileExtension);
            const isCss = ['.css'].includes(fileExtension);
            const canonical = file.substring(source.length + 1);
            const canonicalFolder = path.dirname(canonical).replace(/\.$/, '');
            const destFolder = !canonicalFolder ? target : target + '/' + canonicalFolder;
            return {
                origin: file,
                filename: path.basename(file),
                canonicalFolder: canonicalFolder,
                canonical: canonical,
                bytes: null,
                isHtml: isHtml,
                isCss: isCss,
                hash: null,
                hashedFilename: null,
                destFolder: destFolder,
                destPath: null,
                usedIn: isHtml ? null : [],
                references: isHtml ? null : 0,
            };
        };
        const manifest = files.map(process);
        return manifest;
    },
    hashFilename(filename, hash) {
        const lastDot = /\.(?=[^.]*$)/;
        return slash(path.normalize(!hash ? filename : filename.replace(lastDot, '.' + hash + '.')));
    },
    removeHash(filename) {
        return filename.replace(/[.][0-9a-f]{8}[.]/, '.');
    },
    calcAssetHash(detail) {
        const hashLen = 8;
        const brokenWindows = /$\r\n/gm;
        const contents = fs.readFileSync(detail.origin).toString().replace(brokenWindows, '\n');
        const hash = crypto.createHash('md5').update(contents).digest('hex');
        detail.bytes = contents.length;
        detail.hash = hash.substring(0, hashLen);
        detail.hashedFilename = revWebAssets.hashFilename(detail.filename, detail.hash);
        return detail;
    },
    hashAssetPath(manifest, detail, settings) {
        const replacer = (matched, pre, uri, post) => {
            const ext = path.extname(uri);
            const doNotHash = uri.includes(':') || ['.html', '.htm', '.php'].includes(ext) || ext.length < 2;
            const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
            const canonical = slash(path.normalize(canonicalPath + uri));
            const assetDetail = doNotHash ? null : manifest.find(detail => detail.canonical === canonical);
            if (assetDetail && !assetDetail.hash)
                revWebAssets.calcAssetHash(assetDetail);
            if (assetDetail)
                assetDetail.references++;
            if (assetDetail && !assetDetail.usedIn.includes(detail.canonical))
                assetDetail.usedIn.push(detail.canonical);
            const hashedUri = () => {
                const hashed = revWebAssets.hashFilename(uri, assetDetail.hash);
                const noBase = !settings.metaContentBase || !pre.startsWith('<meta');
                const trailingSlashes = /\/*$/;
                return noBase ? hashed : settings.metaContentBase.replace(trailingSlashes, '/') + hashed;
            };
            return assetDetail?.hash ? pre + hashedUri() + post : matched;
        };
        return replacer;
    },
    processHtml(manifest, settings) {
        const hrefPattern = /(<[a-z]{1,4}\s.*href=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig;
        const srcPattern = /(<[a-z]{3,6}\s.*src=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig;
        const metaPattern = /(<meta\s.*content=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig;
        const process = (detail) => {
            const content = fs.readFileSync(detail.origin, 'utf-8');
            const hashedContent = content
                .replace(hrefPattern, revWebAssets.hashAssetPath(manifest, detail, settings))
                .replace(srcPattern, revWebAssets.hashAssetPath(manifest, detail, settings))
                .replace(metaPattern, revWebAssets.hashAssetPath(manifest, detail, settings));
            detail.destPath = detail.destFolder + '/' + detail.filename;
            fs.mkdirSync(detail.destFolder, { recursive: true });
            fs.writeFileSync(detail.destPath, hashedContent);
        };
        manifest.filter(detail => detail.isHtml).forEach(process);
    },
    processCss(manifest, settings) {
        const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig;
        const process = (detail) => {
            const content = fs.readFileSync(detail.origin, 'utf-8');
            const hashedContent = content
                .replace(urlPattern, revWebAssets.hashAssetPath(manifest, detail, settings));
            detail.destPath = detail.destFolder + '/' + (detail.hashedFilename ?? detail.filename);
            fs.mkdirSync(detail.destFolder, { recursive: true });
            fs.writeFileSync(detail.destPath, hashedContent);
        };
        manifest.filter(detail => detail.isCss).forEach(process);
    },
    copyAssets(manifest) {
        const process = (detail) => {
            detail.destPath = detail.destFolder + '/' + (detail.hashedFilename ?? detail.filename);
            fs.mkdirSync(detail.destFolder, { recursive: true });
            fs.copyFileSync(detail.origin, detail.destPath);
        };
        manifest.filter(file => !file.isHtml && !file.isCss).forEach(process);
    },
    revision(sourceFolder, targetFolder, options) {
        const defaults = {
            cd: null,
            force: false,
            metaContentBase: null,
            saveManifest: false,
        };
        const settings = { ...defaults, ...options };
        const startTime = Date.now();
        const normalize = (folder) => !folder ? '' : slash(path.normalize(folder)).replace(/\/$/, '');
        const startFolder = settings.cd ? normalize(settings.cd) + '/' : '';
        const source = normalize(startFolder + sourceFolder);
        const target = normalize(startFolder + targetFolder);
        if (targetFolder)
            fs.mkdirSync(target, { recursive: true });
        const errorMessage = !sourceFolder ? 'Must specify the source folder path.' :
            !targetFolder ? 'Must specify the target folder path.' :
                !fs.existsSync(source) ? 'Source folder does not exist: ' + source :
                    !fs.existsSync(target) ? 'Target folder cannot be created: ' + target :
                        !fs.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
                            !fs.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
                                null;
        if (errorMessage)
            throw Error('[rev-web-assets] ' + errorMessage);
        const manifest = revWebAssets.manifest(source, target);
        revWebAssets.processHtml(manifest, settings);
        revWebAssets.processCss(manifest, settings);
        const hashUnusedAsset = (detail) => !detail.hash && !detail.isHtml && revWebAssets.calcAssetHash(detail);
        if (settings.force)
            manifest.forEach(hashUnusedAsset);
        revWebAssets.copyAssets(manifest);
        manifest.forEach(detail => detail.usedIn && detail.usedIn.sort());
        const manifestPath = path.join(target, 'manifest.json');
        if (settings.saveManifest)
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '   ') + '\n');
        return {
            source: source,
            target: target,
            count: manifest.length,
            duration: Date.now() - startTime,
            manifest: manifest,
        };
    },
    reporter(results, options) {
        const defaults = {
            summaryOnly: false,
        };
        const settings = { ...defaults, ...options };
        const name = chalk.gray('rev-web-assets');
        const source = chalk.blue.bold(results.source);
        const target = chalk.magenta(results.target);
        const arrow = { big: chalk.gray.bold(' ⟹  '), little: chalk.gray.bold('→') };
        const infoColor = results.count ? chalk.white : chalk.red.bold;
        const info = infoColor(`(files: ${results.count}, ${results.duration}ms)`);
        log(name, source, arrow.big, target, info);
        const logDetail = (detail) => {
            const origin = chalk.white(detail.origin.substring(results.source.length + 1));
            const dest = chalk.green(detail.destPath.substring(results.target.length + 1));
            log(name, origin, arrow.little, dest);
        };
        if (!settings.summaryOnly)
            results.manifest.forEach(logDetail);
        return results;
    },
};
export { revWebAssets };
