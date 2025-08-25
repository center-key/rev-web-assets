//! rev-web-assets v1.5.3 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

import { EOL } from 'node:os';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import log from 'fancy-log';
import path from 'path';
import slash from 'slash';
const revWebAssets = {
    manifest(source, target, skip) {
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
                skipped: !isHtml && !!skip && file.includes(skip),
                missing: isHtml || isCss ? [] : null,
            };
        };
        const manifest = files.map(process);
        return manifest;
    },
    hashFilename(filename, hash) {
        const lastDot = /\.(?=[^.]*$)/;
        return slash(path.normalize(!hash ? filename : filename.replace(lastDot, '.' + hash + '.')));
    },
    stripHash(filename) {
        return filename.replace(/[.][0-9a-f]{8}[.]/, '.');
    },
    calcAssetHash(detail) {
        const hashLen = 8;
        const brokenWindows = /$\r\n/gm;
        const cleanUpText = (buffer) => buffer.toString().replace(brokenWindows, '\n');
        const contents = cleanUpText(fs.readFileSync(detail.origin));
        const hash = crypto.createHash('md5').update(contents).digest('hex');
        detail.bytes = contents.length;
        detail.hash = hash.substring(0, hashLen);
        detail.hashedFilename = revWebAssets.hashFilename(detail.filename, detail.hash);
        return detail;
    },
    hashAssetPath(manifest, detail, settings) {
        const webPages = ['.html', '.htm', '.php'];
        const replacer = (matched, pre, url, post) => {
            const line = matched.replace(/\s+/g, ' ');
            const uri = url.replace(/[#?].*/, '');
            const ext = path.extname(uri);
            const isTemplate = /{.*}|<.*>|~~.*~~/.test(uri);
            const unhashable = uri.includes(':') || webPages.includes(ext) || ext.length < 2;
            const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
            const canonical = slash(path.normalize(canonicalPath + uri));
            const isAssetDetail = (detail) => detail.canonical === canonical;
            const assetDetail = isTemplate || unhashable ? null : manifest.find(isAssetDetail);
            const skipAsset = !!settings.skip && uri.includes(settings.skip);
            if (assetDetail && !assetDetail.hash && !skipAsset)
                revWebAssets.calcAssetHash(assetDetail);
            if (assetDetail)
                assetDetail.references++;
            if (assetDetail && !assetDetail.usedIn.includes(detail.canonical))
                assetDetail.usedIn.push(detail.canonical);
            if (!isTemplate && !unhashable && !skipAsset && !assetDetail)
                detail.missing.push({ ext, line });
            const trailingSlashes = /\/*$/;
            const metaContentBase = settings.metaContentBase?.replace(trailingSlashes, '/');
            const absoluteUrl = () => `${metaContentBase}${assetDetail?.canonicalFolder}/${assetDetail?.hashedFilename}`;
            const hashedUri = () => {
                const noBase = !settings.metaContentBase || !pre.startsWith('<meta');
                return noBase ? revWebAssets.hashFilename(uri, assetDetail.hash) : absoluteUrl();
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
            const calcNext = () => revWebAssets.hashAssetPath(manifest, detail, settings);
            const hashedContent = content
                .replace(hrefPattern, calcNext())
                .replace(srcPattern, calcNext())
                .replace(metaPattern, calcNext());
            detail.destPath = `${detail.destFolder}/${detail.filename}`;
            fs.mkdirSync(detail.destFolder, { recursive: true });
            fs.writeFileSync(detail.destPath, hashedContent);
        };
        manifest.filter(detail => detail.isHtml).forEach(process);
    },
    processCss(manifest, settings) {
        const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig;
        const process = (detail) => {
            const content = fs.readFileSync(detail.origin, 'utf-8');
            const calcNext = () => revWebAssets.hashAssetPath(manifest, detail, settings);
            const hashedContent = content.replace(urlPattern, calcNext());
            const filename = detail.hashedFilename ?? detail.filename;
            detail.destPath = `${detail.destFolder}/${filename}`;
            fs.mkdirSync(detail.destFolder, { recursive: true });
            fs.writeFileSync(detail.destPath, hashedContent);
        };
        manifest.filter(detail => detail.isCss).forEach(process);
    },
    copyAssets(manifest) {
        const process = (detail) => {
            detail.destPath = `${detail.destFolder}/${detail.hashedFilename ?? detail.filename}`;
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
            skip: null,
        };
        const settings = { ...defaults, ...options };
        const startTime = Date.now();
        const cleanUp = (folder) => slash(path.normalize(folder.trim())).replace(/\/$/, '');
        const startFolder = settings.cd ? cleanUp(settings.cd) + '/' : '';
        const source = cleanUp(startFolder + sourceFolder);
        const target = cleanUp(startFolder + targetFolder);
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
            throw new Error('[rev-web-assets] ' + errorMessage);
        const manifest = revWebAssets.manifest(source, target, settings.skip);
        revWebAssets.processHtml(manifest, settings);
        revWebAssets.processCss(manifest, settings);
        const hashUnusedAsset = (detail) => !detail.hash && !detail.isHtml && !detail.skipped && revWebAssets.calcAssetHash(detail);
        if (settings.force)
            manifest.forEach(hashUnusedAsset);
        revWebAssets.copyAssets(manifest);
        manifest.forEach(detail => detail.usedIn && detail.usedIn.sort());
        const manifestPath = path.join(target, 'manifest.json');
        const indent = '   ';
        const toJson = (data) => JSON.stringify(data, null, indent).replace(/\r?\n/g, EOL) + EOL;
        if (settings.saveManifest)
            fs.writeFileSync(manifestPath, toJson(manifest));
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
            hide404s: false,
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
            const file = chalk.blue.bold(detail.origin);
            const warning = (ext) => chalk.red.bold(`missing ${ext} asset in`);
            log(name, origin, arrow.little, dest);
            const logMissingAsset = (missing) => log(name, warning(missing.ext), file, arrow.little, chalk.green(missing.line));
            if (!settings.hide404s && detail.missing)
                detail.missing.forEach(logMissingAsset);
        };
        if (!settings.summaryOnly)
            results.manifest.forEach(logDetail);
        return results;
    },
};
export { revWebAssets };
