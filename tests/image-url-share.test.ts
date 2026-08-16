import { describe, expect, it } from 'vitest';
import {
  buildImageUrlBarHtml,
  getImageSrcFromPopout,
  isImagePopoutApp,
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
