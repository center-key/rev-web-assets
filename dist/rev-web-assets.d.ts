//! rev-web-assets v1.3.2 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

export type Settings = {
    cd: string | null;
    force: boolean;
    metaContentBase: string | null;
    saveManifest: boolean;
};
export type ManifestDetail = {
    origin: string;
    filename: string;
    canonical: string;
    canonicalFolder: string;
    isHtml: boolean;
    isCss: boolean;
    bytes: number | null;
    hash: string | null;
    hashedFilename: string | null;
    destFolder: string;
    destPath: string | null;
    usedIn: string[] | null;
    references: number | null;
};
export type Manifest = ManifestDetail[];
export type Results = {
    source: string;
    target: string;
    count: number;
    duration: number;
    manifest: Manifest;
};
declare const revWebAssets: {
    manifest(source: string, target: string): ManifestDetail[];
    hashFilename(filename: string, hash: string | null): string;
    removeHash(filename: string): string;
    calcAssetHash(detail: ManifestDetail): ManifestDetail;
    hashAssetPath(manifest: ManifestDetail[], detail: ManifestDetail, settings: Settings): (matched: string, pre: string, uri: string, post: string) => string;
    processHtml(manifest: ManifestDetail[], settings: Settings): void;
    processCss(manifest: ManifestDetail[], settings: Settings): void;
    copyAssets(manifest: ManifestDetail[]): void;
    revision(sourceFolder: string, targetFolder: string, options?: Partial<Settings>): Results;
};
export { revWebAssets };
