import { afterEach, describe, expect, it } from 'vitest';
import {
  buildImageUrlBarHtml,
  getImageSrcFromPopout,
  hasApplicationV2ImagePopout,
  isImagePopoutApp,
  openFoundryImagePopout,
  planImagePopoutConstruction,
  resolveShareableImageUrl,
} from '../src/ui/image-url-share.js';

describe('resolveShareableImageUrl', () => {
  it('keeps absolute http(s) URLs', () => {
    expect(resolveShareableImageUrl('https://cdn.example/hero.png')).toBe('https://cdn.example/hero.png');
  });

  it('keeps data URLs', () => {
    expect(resolveShareableImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('resolves Foundry-relative paths against the origin', () => {
    expect(resolveShareableImageUrl('worlds/tyhra/portraits/a.png', 'https://vtt.example')).toBe(
      'https://vtt.example/worlds/tyhra/portraits/a.png',
    );
  });

  it('resolves protocol-relative URLs', () => {
    expect(resolveShareableImageUrl('//cdn.example/pic.webp', 'https://vtt.example')).toBe(
      'https://cdn.example/pic.webp',
    );
  });

  it('returns empty for a blank src', () => {
    expect(resolveShareableImageUrl('')).toBe('');
  });
});

describe('ImagePopout helpers', () => {
  it('reads src from common ImagePopout fields', () => {
    expect(getImageSrcFromPopout({ options: { src: 'icons/foo.png' } })).toBe('icons/foo.png');
    expect(getImageSrcFromPopout({ src: 'https://cdn.example/a.png' })).toBe('https://cdn.example/a.png');
  });

  it('detects ImagePopout apps', () => {
    class ImagePopout {}
    expect(isImagePopoutApp(new ImagePopout())).toBe(true);
    expect(isImagePopoutApp({ options: { classes: ['image-popout'] } })).toBe(true);
    expect(isImagePopoutApp({ options: { classes: ['sheet'] } })).toBe(false);
  });

  it('builds a selectable URL bar', () => {
    const html = buildImageUrlBarHtml('https://cdn.example/hero.png');
    expect(html).toContain('ms-image-url-bar');
    expect(html).toContain('https://cdn.example/hero.png');
    expect(html).toContain('ms-image-url-copy');
  });
});

describe('ImagePopout v14 constructor', () => {
  afterEach(() => {
    delete (globalThis as any).foundry;
    delete (globalThis as any).ImagePopout;
  });

  it('detects ApplicationV2 ImagePopout from foundry.applications.apps', () => {
    expect(hasApplicationV2ImagePopout(undefined)).toBe(false);
    expect(
      hasApplicationV2ImagePopout({
        applications: { apps: { ImagePopout: { implementation: class {} } } },
      }),
    ).toBe(true);
  });

  it('plans the v13/v14 options object instead of (src, options)', () => {
    expect(planImagePopoutConstruction('icons/mira.png', { title: 'Mira', uuid: 'Actor.1' }, true)).toEqual({
      mode: 'v2',
      args: [{ src: 'icons/mira.png', uuid: 'Actor.1', window: { title: 'Mira' } }],
    });
  });

  it('keeps the legacy (src, options) plan for older cores', () => {
    expect(planImagePopoutConstruction('icons/mira.png', 'Mira', false)).toEqual({
      mode: 'v1',
      args: ['icons/mira.png', { title: 'Mira', shareable: false, uuid: undefined }],
    });
  });

  it('constructs ApplicationV2 ImagePopout with src on the options object', async () => {
    const calls: unknown[] = [];
    class FakePopout {
      constructor(opts: unknown) {
        calls.push(opts);
      }
      async render() {
        return this;
      }
    }
    (globalThis as any).foundry = {
      applications: { apps: { ImagePopout: { implementation: FakePopout } } },
    };
    const ok = await openFoundryImagePopout('icons/foo.png', { title: 'Mira', uuid: 'Actor.1' });
    expect(ok).toBe(true);
    expect(calls[0]).toEqual({
      src: 'icons/foo.png',
      uuid: 'Actor.1',
      window: { title: 'Mira' },
    });
  });

  it('uses the legacy (src, options) constructor when only global ImagePopout exists', async () => {
    const calls: unknown[] = [];
    class FakePopout {
      constructor(src: unknown, opts: unknown) {
        calls.push([src, opts]);
      }
      async render() {
        return this;
      }
    }
    (globalThis as any).ImagePopout = FakePopout;
    const ok = await openFoundryImagePopout('icons/foo.png', 'Mira');
    expect(ok).toBe(true);
    expect(calls[0]).toEqual(['icons/foo.png', { title: 'Mira', shareable: false, uuid: undefined }]);
  });

  it('returns false for a blank src', async () => {
    expect(await openFoundryImagePopout('', 'Mira')).toBe(false);
  });
});
