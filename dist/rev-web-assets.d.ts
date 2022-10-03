//! rev-web-assets v0.1.0 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

export declare type Settings = {
    cd: string | null;
    metaContentBase: string | null;
    saveManifest: boolean;
};
export declare type Options = Partial<Settings>;
export declare type ManifestDetail = {
    origin: string;
    filename: string;
    canonical: string;
    canonicalFolder: string;
    isHtml: boolean;
    isCss: boolean;
    hash: string | null;
    hashedFilename: string | null;
    destFolder: string;
    destPath: string | null;
};
export declare type Manifest = ManifestDetail[];
export declare type Results = {
    source: string;
    target: string;
    count: number;
    duration: number;
    manifest: Manifest;
};
declare const revWebAssets: {
    readFolderRecursive(folder: string): string[];
    manifest(source: string, target: string): {
        origin: string;
        filename: string;
        canonicalFolder: string;
        canonical: string;
        isHtml: boolean;
        isCss: boolean;
        hash: null;
        hashedFilename: null;
        destFolder: string;
        destPath: null;
    }[];
    hashFilename(filename: string, hash: string | null): string;
    calcAssetHash(detail: ManifestDetail): void;
    hashAssetPath(manifest: Manifest, detail: ManifestDetail, settings: Settings): (matched: string, pre: string, uri: string, post: string) => string;
    processHtml(manifest: ManifestDetail[], settings: Settings): void;
    processCss(manifest: ManifestDetail[], settings: Settings): void;
    copyAssets(manifest: Manifest): void;
    revision(sourceFolder: string, targetFolder: string, options?: Options): Results;
};
export { revWebAssets };
