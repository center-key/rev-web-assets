//! rev-web-assets v0.0.2 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

export declare type Options = {
    cd?: string;
    saveManifest?: boolean;
};
export declare type ManifestDetail = {
    origin: string;
    filename: string;
    extension: string;
    canonical: string;
    canonicalFolder: string;
    isHtml: boolean;
    isCss: boolean;
    hash: string | null;
    hashFilename: string | null;
    destFolder: string;
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
    readDirSyncRecursive(folder: string): string[];
    manifest(source: string, target: string): {
        origin: string;
        filename: string;
        extension: string;
        canonicalFolder: string;
        canonical: string;
        isHtml: boolean;
        isCss: boolean;
        hash: null;
        hashFilename: null;
        destFolder: string;
    }[];
    hashFilename(filename: string, hash: string | null): string;
    calcAssetHash(detail: ManifestDetail): void;
    hashAssetPath(manifest: Manifest, detail: ManifestDetail): (matched: string, pre: string, uri: string, post: string) => string;
    processHtml(manifest: ManifestDetail[]): void;
    processCss(manifest: ManifestDetail[]): void;
    copyAssets(manifest: Manifest): void;
    revision(sourceFolder: string, targetFolder: string, options?: Options): Results;
};
export { revWebAssets };
