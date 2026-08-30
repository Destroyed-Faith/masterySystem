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
/** Open Foundry's ImagePopout for a picture (item portraits, alt art, etc.). */
export declare function openFoundryImagePopout(src: string, title: string): Promise<boolean>;
export declare function buildImageUrlBarHtml(src: string): string;
export declare function injectImageUrlBar(app: unknown, element: unknown): void;
export declare function bindImageUrlBar(root: ParentNode | null | undefined, fallbackSrc?: string): void;
export declare function registerImageUrlShareHooks(): void;
//# sourceMappingURL=image-url-share.d.ts.map