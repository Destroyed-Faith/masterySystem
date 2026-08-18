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