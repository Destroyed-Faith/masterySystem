import { describe, expect, it, vi } from 'vitest';
import {
  prependFontColorMenuItem,
  resolveColorMark,
} from '../src/editor/prosemirror-font-color';

vi.stubGlobal('game', {
  i18n: {
    localize: (key: string) => key,
  },
});

function mockSchema(marks: Record<string, { attrs?: Record<string, unknown> }>) {
  return {
    marks: Object.fromEntries(
      Object.entries(marks).map(([name, spec]) => [
        name,
        {
          spec: { attrs: spec.attrs ?? {} },
        },
      ]),
    ),
  };
}

describe('prependFontColorMenuItem', () => {
  it('adds a palette toolbar button at the front without a mark binding', () => {
    const items: Array<Record<string, unknown>> = [{ action: 'bold', title: 'Bold' }];

    prependFontColorMenuItem({}, items);

    expect(items[0]?.action).toBe('mastery-font-color');
    expect(items[0]?.icon).toContain('fa-palette');
    expect(items[0]?.mark).toBeUndefined();
    expect(typeof items[0]?.cmd).toBe('function');
  });

  it('does not duplicate the palette button', () => {
    const items: Array<Record<string, unknown>> = [{ action: 'mastery-font-color', title: 'Text Color' }];

    prependFontColorMenuItem({}, items);

    expect(items).toHaveLength(1);
  });
});

describe('resolveColorMark', () => {
  it('prefers textStyle mark with color attribute', () => {
    const schema = mockSchema({
      textStyle: { attrs: { color: { default: null } } },
      bold: { attrs: {} },
    });
    const resolved = resolveColorMark(schema);
    expect(resolved?.markType).toBe(schema.marks.textStyle);
    expect(resolved?.colorAttr).toBe('color');
  });

  it('falls back to any mark exposing a color attribute', () => {
    const schema = mockSchema({
      customColor: { attrs: { color: { default: null } } },
    });
    const resolved = resolveColorMark(schema);
    expect(resolved?.markType).toBe(schema.marks.customColor);
  });

  it('returns null when no color mark exists', () => {
    const schema = mockSchema({ bold: { attrs: {} }, link: { attrs: { href: {} } } });
    expect(resolveColorMark(schema)).toBeNull();
  });
});
