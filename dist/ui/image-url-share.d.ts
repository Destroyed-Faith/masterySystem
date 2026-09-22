/**
 * Show a copyable image URL on ImagePopout and offer "Copy picture link"
 * in the window three-dot menu (and on actor sheets).
 */
export declare function localizeImageUrl(key: 'copyLink' | 'linkCopied' | 'noImage' | 'urlLabel'): string;
export declare function resolveShareableImageUrl(src: string, origin?: string): string;
export declare function getImageSrcFromPopout(app: unknown): string;
export declare function isImagePopoutApp(app: unknown): boolean;
export declare function copyShareableImageUrl(src: string): Promise<boolean>;
export declare function copyDocumentImageLink(doc: {
    img?: string;
} | null | undefined): Promise<boolean>;
export interface ImagePopoutOpenOptions {
    title?: string;
    uuid?: string;
    shareable?: boolean;
}
export type ImagePopoutConstruction = {
    mode: 'v2';
    args: [Record<string, unknown>];
} | {
    mode: 'v1';
    args: [string, Record<string, unknown>];
};
/** Foundry v13+ ImagePopout is ApplicationV2 and takes `{ src, window: { title } }`. */
export declare function hasApplicationV2ImagePopout(foundryNs?: unknown): boolean;
export declare function planImagePopoutConstruction(src: string, titleOrOptions?: string | ImagePopoutOpenOptions, useApplicationV2?: boolean): ImagePopoutConstruction;
/** Open Foundry's ImagePopout for a picture (item portraits, alt art, etc.). */
export declare function openFoundryImagePopout(src: string, titleOrOptions?: string | ImagePopoutOpenOptions): Promise<boolean>;
/** Last-resort picture window when ImagePopout is missing or rejects the constructor. */
export declare function openFallbackImageDialog(src: string, title: string): Promise<boolean>;
/** ImagePopout first (v14 ctor), then a simple dialog so the picture still opens. */
export declare function openImageViewer(src: string, titleOrOptions?: string | ImagePopoutOpenOptions): Promise<boolean>;
export declare function buildImageUrlBarHtml(src: string): string;
export declare function injectImageUrlBar(app: unknown, element: unknown): void;
export declare function bindImageUrlBar(root: ParentNode | null | undefined, fallbackSrc?: string): void;
export declare function registerImageUrlShareHooks(): void;
//# sourceMappingURL=image-url-share.d.ts.map