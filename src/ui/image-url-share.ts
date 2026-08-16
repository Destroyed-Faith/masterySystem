/**
 * Show a copyable image URL on ImagePopout and offer "Copy picture link"
 * in the window three-dot menu (and on actor sheets).
 */

const COPY_ACTION = 'msCopyPictureLink';

export function localizeImageUrl(key: 'copyLink' | 'linkCopied' | 'noImage' | 'urlLabel'): string {
  const keys = {
    copyLink: 'MASTERY.image.copyLink',
    linkCopied: 'MASTERY.image.linkCopied',
    noImage: 'MASTERY.image.noImage',
    urlLabel: 'MASTERY.image.urlLabel',
  } as const;
  const fallbacks = {
    copyLink: 'Copy picture link',
    linkCopied: 'Picture link copied',
    noImage: 'No image to copy',
    urlLabel: 'Picture URL',
  } as const;
  const loc =
    typeof game !== 'undefined' ? (game as any)?.i18n?.localize?.(keys[key]) : undefined;
  return loc && loc !== keys[key] ? loc : fallbacks[key];
}

export function resolveShareableImageUrl(
  src: string,
  origin: string = typeof location !== 'undefined' ? location.origin : '',
): string {
  const raw = String(src ?? '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith('//')) {
    const base = origin || 'https://localhost';
    try {
      return new URL(raw, base).href;
    } catch {
      return raw;
    }
  }

  const getRoute = (globalThis as any).foundry?.utils?.getRoute;
  const routed = typeof getRoute === 'function' ? String(getRoute(raw) || raw) : raw;
  if (/^(https?:|data:|blob:)/i.test(routed)) return routed;
  if (routed.startsWith('//')) {
    const base = origin || 'https://localhost';
    try {
      return new URL(routed, base).href;
    } catch {
      return routed;
    }
  }

  const path = routed.startsWith('/') ? routed : `/${routed}`;
  if (!origin) return path;
  try {
    return new URL(path, origin.endsWith('/') ? origin : `${origin}/`).href;
  } catch {
    return path;
  }
}

export function getImageSrcFromPopout(app: unknown): string {
  const a = app as {
    src?: unknown;
    img?: unknown;
    object?: unknown;
    options?: { src?: unknown; image?: unknown };
  } | null;
  const candidates = [a?.src, a?.options?.src, a?.img, a?.options?.image, a?.object];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function isImagePopoutApp(app: unknown): boolean {
  if (!app || typeof app !== 'object') return false;
  const ctorName = String((app as { constructor?: { name?: string } }).constructor?.name ?? '');
  if (ctorName === 'ImagePopout') return true;
  const options = (app as { options?: { classes?: string[] } }).options;
  return Array.isArray(options?.classes) && options.classes.includes('image-popout');
}

export async function copyShareableImageUrl(src: string): Promise<boolean> {
  const url = resolveShareableImageUrl(src);
  const notify = typeof ui !== 'undefined' ? (ui as any)?.notifications : undefined;
  if (!url) {
    notify?.warn(localizeImageUrl('noImage'));
    return false;
  }
  const ok = await writeClipboardText(url);
  if (ok) {
    notify?.info(localizeImageUrl('linkCopied'));
  } else {
    notify?.warn('Could not copy the picture link.');
  }
  return ok;
}

export async function copyDocumentImageLink(doc: { img?: string } | null | undefined): Promise<boolean> {
  return copyShareableImageUrl(String(doc?.img ?? ''));
}

export function buildImageUrlBarHtml(src: string): string {
  const url = resolveShareableImageUrl(src);
  if (!url) return '';
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

export function injectImageUrlBar(app: unknown, element: unknown): void {
  const root = resolveRoot(element);
  if (!root || root.querySelector('.ms-image-url-bar')) return;

  const img = root.querySelector<HTMLImageElement>('img');
  const src = img?.currentSrc || img?.getAttribute('src') || getImageSrcFromPopout(app);
  const html = buildImageUrlBarHtml(src);
  if (!html) return;

  const host =
    root.querySelector<HTMLElement>('.window-content') ||
    (root.classList.contains('window-content') ? root : root);
  host.insertAdjacentHTML('afterbegin', html);
  bindImageUrlBar(host, src);
}

export function bindImageUrlBar(root: ParentNode | null | undefined, fallbackSrc = ''): void {
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('.ms-image-url-input');
  const button = root.querySelector<HTMLButtonElement>('.ms-image-url-copy');
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

export function registerImageUrlShareHooks(): void {
  const decorate = (app: unknown, element: unknown) => {
    if (!isImagePopoutApp(app)) return;
    injectImageUrlBar(app, element);
  };
  Hooks.on('renderImagePopout', decorate);
  Hooks.on('renderApplicationV2', decorate);

  const addV2Control = (app: unknown, controls: unknown) => {
    if (!isImagePopoutApp(app) || !Array.isArray(controls)) return;
    if (controls.some((c: { action?: string }) => c?.action === COPY_ACTION)) return;
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

  Hooks.on('getImagePopoutHeaderButtons', (app: unknown, buttons: unknown) => {
    if (!Array.isArray(buttons)) return;
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

async function writeClipboardText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
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
  } catch {
    return false;
  }
}

function resolveRoot(element: unknown): HTMLElement | null {
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  const jq = element as { [0]?: HTMLElement; get?: (i: number) => HTMLElement };
  if (jq[0] instanceof HTMLElement) return jq[0];
  const viaGet = jq.get?.(0);
  return viaGet instanceof HTMLElement ? viaGet : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
