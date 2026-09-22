/**
 * Show a copyable image URL on ImagePopout and offer "Copy picture link"
 * in the window three-dot menu (and on actor sheets).
 */
const COPY_ACTION = 'msCopyPictureLink';
export function localizeImageUrl(key) {
    const keys = {
        copyLink: 'MASTERY.image.copyLink',
        linkCopied: 'MASTERY.image.linkCopied',
        noImage: 'MASTERY.image.noImage',
        urlLabel: 'MASTERY.image.urlLabel',
    };
    const fallbacks = {
        copyLink: 'Copy picture link',
        linkCopied: 'Picture link copied',
        noImage: 'No image to copy',
        urlLabel: 'Picture URL',
    };
    const loc = typeof game !== 'undefined' ? game?.i18n?.localize?.(keys[key]) : undefined;
    return loc && loc !== keys[key] ? loc : fallbacks[key];
}
export function resolveShareableImageUrl(src, origin = typeof location !== 'undefined' ? location.origin : '') {
    const raw = String(src ?? '').trim();
    if (!raw)
        return '';
    if (/^(https?:|data:|blob:)/i.test(raw))
        return raw;
    if (raw.startsWith('//')) {
        const base = origin || 'https://localhost';
        try {
            return new URL(raw, base).href;
        }
        catch {
            return raw;
        }
    }
    const getRoute = globalThis.foundry?.utils?.getRoute;
    const routed = typeof getRoute === 'function' ? String(getRoute(raw) || raw) : raw;
    if (/^(https?:|data:|blob:)/i.test(routed))
        return routed;
    if (routed.startsWith('//')) {
        const base = origin || 'https://localhost';
        try {
            return new URL(routed, base).href;
        }
        catch {
            return routed;
        }
    }
    const path = routed.startsWith('/') ? routed : `/${routed}`;
    if (!origin)
        return path;
    try {
        return new URL(path, origin.endsWith('/') ? origin : `${origin}/`).href;
    }
    catch {
        return path;
    }
}
export function getImageSrcFromPopout(app) {
    const a = app;
    const candidates = [a?.src, a?.options?.src, a?.img, a?.options?.image, a?.object];
    for (const value of candidates) {
        if (typeof value === 'string' && value.trim())
            return value.trim();
    }
    return '';
}
export function isImagePopoutApp(app) {
    if (!app || typeof app !== 'object')
        return false;
    const ctorName = String(app.constructor?.name ?? '');
    if (ctorName === 'ImagePopout')
        return true;
    const options = app.options;
    return Array.isArray(options?.classes) && options.classes.includes('image-popout');
}
export async function copyShareableImageUrl(src) {
    const url = resolveShareableImageUrl(src);
    const notify = typeof ui !== 'undefined' ? ui?.notifications : undefined;
    if (!url) {
        notify?.warn(localizeImageUrl('noImage'));
        return false;
    }
    const ok = await writeClipboardText(url);
    if (ok) {
        notify?.info(localizeImageUrl('linkCopied'));
    }
    else {
        notify?.warn('Could not copy the picture link.');
    }
    return ok;
}
export async function copyDocumentImageLink(doc) {
    return copyShareableImageUrl(String(doc?.img ?? ''));
}
function normalizeImagePopoutOptions(titleOrOptions) {
    if (typeof titleOrOptions === 'string' || titleOrOptions == null) {
        return { title: titleOrOptions || 'Image' };
    }
    return { title: titleOrOptions.title || 'Image', uuid: titleOrOptions.uuid, shareable: titleOrOptions.shareable };
}
function foundryNamespace() {
    if (typeof foundry !== 'undefined')
        return foundry;
    return globalThis.foundry;
}
function globalImagePopout() {
    if (typeof window !== 'undefined' && window.ImagePopout)
        return window.ImagePopout;
    return globalThis.ImagePopout;
}
/** Foundry v13+ ImagePopout is ApplicationV2 and takes `{ src, window: { title } }`. */
export function hasApplicationV2ImagePopout(foundryNs = foundryNamespace()) {
    return !!foundryNs
        ?.applications?.apps?.ImagePopout?.implementation;
}
export function planImagePopoutConstruction(src, titleOrOptions = 'Image', useApplicationV2 = hasApplicationV2ImagePopout()) {
    const imgSrc = String(src || '').trim();
    const options = normalizeImagePopoutOptions(titleOrOptions);
    const title = String(options.title || 'Image');
    if (useApplicationV2) {
        return {
            mode: 'v2',
            args: [
                {
                    src: imgSrc,
                    uuid: options.uuid ?? null,
                    window: { title },
                },
            ],
        };
    }
    return {
        mode: 'v1',
        args: [
            imgSrc,
            {
                title,
                shareable: options.shareable ?? false,
                uuid: options.uuid,
            },
        ],
    };
}
function resolveImagePopoutClass() {
    return foundryNamespace()?.applications?.apps?.ImagePopout?.implementation || globalImagePopout();
}
/** Open Foundry's ImagePopout for a picture (item portraits, alt art, etc.). */
export async function openFoundryImagePopout(src, titleOrOptions = 'Image') {
    const imgSrc = String(src || '').trim();
    if (!imgSrc)
        return false;
    const ImagePopoutClass = resolveImagePopoutClass();
    if (!ImagePopoutClass)
        return false;
    const planned = planImagePopoutConstruction(imgSrc, titleOrOptions, hasApplicationV2ImagePopout());
    try {
        const popout = new ImagePopoutClass(...planned.args);
        await popout.render(planned.mode === 'v2' ? { force: true } : true);
        return true;
    }
    catch (err) {
        if (planned.mode === 'v2') {
            try {
                const legacy = planImagePopoutConstruction(imgSrc, titleOrOptions, false);
                const popout = new ImagePopoutClass(...legacy.args);
                await popout.render(true);
                return true;
            }
            catch {
                /* fall through */
            }
        }
        console.warn('Mastery System | Image popout failed', err);
        return false;
    }
}
/** Last-resort picture window when ImagePopout is missing or rejects the constructor. */
export async function openFallbackImageDialog(src, title) {
    const imgSrc = String(src || '').trim();
    if (!imgSrc)
        return false;
    const DialogClass = (typeof window !== 'undefined' ? window.Dialog : undefined) || globalThis.Dialog;
    if (!DialogClass)
        return false;
    try {
        const dialog = new DialogClass({
            title: title || 'Image',
            content: `${buildImageUrlBarHtml(imgSrc)}<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
            buttons: {
                close: {
                    label: 'Close',
                    callback: () => { },
                },
            },
            default: 'close',
            render: (html) => {
                const root = html instanceof HTMLElement ? html : (html?.[0] ?? html?.get?.(0));
                bindImageUrlBar(root, imgSrc);
            },
        });
        await dialog.render(true);
        return true;
    }
    catch (err) {
        console.warn('Mastery System | Fallback image dialog failed', err);
        return false;
    }
}
/** ImagePopout first (v14 ctor), then a simple dialog so the picture still opens. */
export async function openImageViewer(src, titleOrOptions = 'Image') {
    if (await openFoundryImagePopout(src, titleOrOptions))
        return true;
    const title = normalizeImagePopoutOptions(titleOrOptions).title || 'Image';
    return openFallbackImageDialog(src, title);
}
export function buildImageUrlBarHtml(src) {
    const url = resolveShareableImageUrl(src);
    if (!url)
        return '';
    const escaped = escapeHtml(url);
    const label = escapeHtml(localizeImageUrl('urlLabel'));
    const copy = escapeHtml(localizeImageUrl('copyLink'));
    return `<div class="ms-image-url-bar">
    <label class="ms-image-url-label">${label}</label>
    <input type="text" class="ms-image-url-input" readonly value="${escaped}" spellcheck="false" />
    <button type="button" class="ms-image-url-copy" title="${copy}">
      <i class="fas fa-copy"></i>
    </button>
  </div>`;
}
export function injectImageUrlBar(app, element) {
    const root = resolveRoot(element);
    if (!root || root.querySelector('.ms-image-url-bar'))
        return;
    const img = root.querySelector('img');
    const src = img?.currentSrc || img?.getAttribute('src') || getImageSrcFromPopout(app);
    const html = buildImageUrlBarHtml(src);
    if (!html)
        return;
    const host = root.querySelector('.window-content') ||
        (root.classList.contains('window-content') ? root : root);
    host.insertAdjacentHTML('afterbegin', html);
    bindImageUrlBar(host, src);
}
export function bindImageUrlBar(root, fallbackSrc = '') {
    if (!root)
        return;
    const input = root.querySelector('.ms-image-url-input');
    const button = root.querySelector('.ms-image-url-copy');
    if (input) {
        input.addEventListener('focus', () => input.select());
        input.addEventListener('click', () => input.select());
    }
    button?.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void copyShareableImageUrl(input?.value || fallbackSrc);
    });
}
export function registerImageUrlShareHooks() {
    const decorate = (app, element) => {
        if (!isImagePopoutApp(app))
            return;
        injectImageUrlBar(app, element);
    };
    Hooks.on('renderImagePopout', decorate);
    Hooks.on('renderApplicationV2', decorate);
    const addV2Control = (app, controls) => {
        if (!isImagePopoutApp(app) || !Array.isArray(controls))
            return;
        if (controls.some((c) => c?.action === COPY_ACTION))
            return;
        controls.push({
            icon: 'fas fa-link',
            label: localizeImageUrl('copyLink'),
            action: COPY_ACTION,
            onClick: () => {
                void copyShareableImageUrl(getImageSrcFromPopout(app));
            },
        });
    };
    Hooks.on('getHeaderControlsImagePopout', addV2Control);
    Hooks.on('getHeaderControlsApplicationV2', addV2Control);
    Hooks.on('getImagePopoutHeaderButtons', (app, buttons) => {
        if (!Array.isArray(buttons))
            return;
        buttons.unshift({
            label: localizeImageUrl('copyLink'),
            class: 'ms-copy-picture-link',
            icon: 'fas fa-link',
            onclick: () => {
                void copyShareableImageUrl(getImageSrcFromPopout(app));
            },
        });
    });
}
async function writeClipboardText(text) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    }
    catch {
        /* fall through */
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    }
    catch {
        return false;
    }
}
function resolveRoot(element) {
    if (!element)
        return null;
    if (element instanceof HTMLElement)
        return element;
    const jq = element;
    if (jq[0] instanceof HTMLElement)
        return jq[0];
    const viaGet = jq.get?.(0);
    return viaGet instanceof HTMLElement ? viaGet : null;
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=image-url-share.js.map