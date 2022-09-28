//! rev-web-assets v0.0.3 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "crypto", "fs-extra", "path", "slash"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.revWebAssets = void 0;
    const crypto_1 = __importDefault(require("crypto"));
    const fs_extra_1 = __importDefault(require("fs-extra"));
    const path_1 = __importDefault(require("path"));
    const slash_1 = __importDefault(require("slash"));
    const revWebAssets = {
        readDirSyncRecursive(folder) {
            const files = [];
            const process = (item) => {
                if (fs_extra_1.default.statSync(item).isFile())
                    files.push((0, slash_1.default)(item));
                else
                    fs_extra_1.default.readdirSync(item).forEach((nestedItem) => process(path_1.default.join(item, nestedItem)));
            };
            process(path_1.default.normalize(folder));
            return files.sort();
        },
        manifest(source, target) {
            const files = revWebAssets.readDirSyncRecursive(source);
            const process = (file) => {
                const fileExtension = path_1.default.extname(file).toLowerCase();
                const isHtml = ['.html', '.htm'].includes(fileExtension);
                const isCss = ['.css'].includes(fileExtension);
                const canonical = file.substring(source.length + 1);
                const canonicalFolder = path_1.default.dirname(canonical).replace(/\.$/, '');
                const destFolder = !canonicalFolder ? target : target + '/' + canonicalFolder;
                return {
                    origin: file,
                    filename: path_1.default.basename(file),
                    canonicalFolder: canonicalFolder,
                    canonical: canonical,
                    isHtml: isHtml,
                    isCss: isCss,
                    hash: null,
                    hashedFilename: null,
                    destFolder: destFolder,
                    destPath: null,
                };
            };
            const manifest = files.map(process);
            return manifest;
        },
        hashFilename(filename, hash) {
            const lastDot = /\.(?=[^.]*$)/;
            return !hash ? filename : filename.replace(lastDot, '.' + hash + '.');
        },
        calcAssetHash(detail) {
            const hashLen = 7;
            const contents = fs_extra_1.default.readFileSync(detail.origin).toString();
            const hash = crypto_1.default.createHash('md5').update(contents).digest('hex');
            detail.hash = hash.substring(0, hashLen);
            detail.hashedFilename = revWebAssets.hashFilename(detail.filename, detail.hash);
        },
        hashAssetPath(manifest, detail) {
            return (matched, pre, uri, post) => {
                const ext = path_1.default.extname(uri);
                const doNotHash = uri.includes(':') || ['.html', '.htm'].includes(ext) || ext.length < 2;
                const canonicalPath = detail.canonicalFolder ? detail.canonicalFolder + '/' : '';
                const canonical = (0, slash_1.default)(path_1.default.normalize(canonicalPath + uri));
                const assetDetail = doNotHash ? null : manifest.find(detail => detail.canonical === canonical);
                if (assetDetail && !assetDetail.hash)
                    revWebAssets.calcAssetHash(assetDetail);
                return (assetDetail === null || assetDetail === void 0 ? void 0 : assetDetail.hash) ? pre + revWebAssets.hashFilename(uri, assetDetail.hash) + post : matched;
            };
        },
        processHtml(manifest) {
            const hrefPattern = /(<[a-z]{1,4}\s.*href=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig;
            const srcPattern = /(<[a-z]{3,6}\s.*src=['"]?)([^"'>\s]*)(['"]?[^<]*>)/ig;
            const process = (detail) => {
                const content = fs_extra_1.default.readFileSync(detail.origin, 'utf-8');
                const hashedContent = content
                    .replace(hrefPattern, revWebAssets.hashAssetPath(manifest, detail))
                    .replace(srcPattern, revWebAssets.hashAssetPath(manifest, detail));
                detail.destPath = detail.destFolder + '/' + detail.filename;
                fs_extra_1.default.ensureDirSync(detail.destFolder);
                fs_extra_1.default.writeFileSync(detail.destPath, hashedContent);
            };
            manifest.filter(detail => detail.isHtml).forEach(process);
        },
        processCss(manifest) {
            const urlPattern = /(url\(["']?)([^)('"]*)(["']?\))/ig;
            const process = (detail) => {
                var _a;
                const content = fs_extra_1.default.readFileSync(detail.origin, 'utf-8');
                const hashedContent = content
                    .replace(urlPattern, revWebAssets.hashAssetPath(manifest, detail));
                detail.destPath = detail.destFolder + '/' + ((_a = detail.hashedFilename) !== null && _a !== void 0 ? _a : detail.filename);
                fs_extra_1.default.ensureDirSync(detail.destFolder);
                fs_extra_1.default.writeFileSync(detail.destPath, hashedContent);
            };
            manifest.filter(detail => detail.isCss).forEach(process);
        },
        copyAssets(manifest) {
            const process = (detail) => {
                var _a;
                detail.destPath = detail.destFolder + '/' + ((_a = detail.hashedFilename) !== null && _a !== void 0 ? _a : detail.filename);
                fs_extra_1.default.ensureDirSync(detail.destFolder);
                fs_extra_1.default.copyFileSync(detail.origin, detail.destPath);
            };
            manifest.filter(file => !file.isHtml && !file.isCss).forEach(process);
        },
        revision(sourceFolder, targetFolder, options) {
            const defaults = {
                cd: null,
                saveManifest: false,
            };
            const settings = Object.assign(Object.assign({}, defaults), options);
            const startTime = Date.now();
            const normalize = (folder) => !folder ? '' : (0, slash_1.default)(path_1.default.normalize(folder)).replace(/\/$/, '');
            const startFolder = settings.cd ? normalize(settings.cd) + '/' : '';
            const source = normalize(startFolder + sourceFolder);
            const target = normalize(startFolder + targetFolder);
            if (targetFolder)
                fs_extra_1.default.ensureDirSync(target);
            const errorMessage = !sourceFolder ? 'Must specify the source folder path.' :
                !targetFolder ? 'Must specify the target folder path.' :
                    !fs_extra_1.default.pathExistsSync(source) ? 'Source folder does not exist: ' + source :
                        !fs_extra_1.default.pathExistsSync(target) ? 'Target folder cannot be created: ' + target :
                            !fs_extra_1.default.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
                                !fs_extra_1.default.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
                                    null;
            if (errorMessage)
                throw Error('[rev-web-assets] ' + errorMessage);
            const manifest = revWebAssets.manifest(source, target);
            revWebAssets.processHtml(manifest);
            revWebAssets.processCss(manifest);
            revWebAssets.copyAssets(manifest);
            const manifestPath = path_1.default.join(target, 'manifest.json');
            if (settings.saveManifest)
                fs_extra_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, '   '));
            return {
                source: source,
                target: target,
                count: manifest.length,
                duration: Date.now() - startTime,
                manifest: manifest,
            };
        },
    };
    exports.revWebAssets = revWebAssets;
});
