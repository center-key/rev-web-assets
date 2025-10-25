//! rev-web-assets v1.5.2 ~~ https://github.com/center-key/rev-web-assets ~~ MIT License

export type Settings = {
    cd: string | null;
    force: boolean;
    metaContentBase: string | null;
    saveManifest: boolean;
    skip: string | null;
};
export type MissingAsset = {
    ext: string;
    line: string;
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
    skipped: boolean;
    missing: MissingAsset[] | null;
};
export type Manifest = ManifestDetail[];
export type Results = {
    source: string;
    target: string;
    count: number;
    duration: number;
    manifest: Manifest;
};
export type ReporterSettings = {
    summaryOnly: boolean;
    hide404s: boolean;
};
declare const revWebAssets: {
    manifest(source: string, target: string, skip: string | null): ManifestDetail[];
    hashFilename(filename: string, hash: string | null): string;
    stripHash(filename: string): string;
    calcAssetHash(detail: ManifestDetail): ManifestDetail;
    hashAssetPath(manifest: ManifestDetail[], detail: ManifestDetail, settings: Settings): (matched: string, pre: string, url: string, post: string) => string;
    processHtml(manifest: ManifestDetail[], settings: Settings): void;
    processCss(manifest: ManifestDetail[], settings: Settings): void;
    copyAssets(manifest: ManifestDetail[]): void;
    revision(sourceFolder: string, targetFolder: string, options?: Partial<Settings>): Results;
    reporter(results: Results, options?: Partial<ReporterSettings>): Results;
};
export { revWebAssets };
