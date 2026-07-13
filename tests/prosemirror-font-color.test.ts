import { describe, expect, it, vi } from 'vitest';
import {
  appendFontColorDropdownEntries,
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

describe('appendFontColorDropdownEntries', () => {
  it('adds text color under Format → Inline', () => {
    const config = {
      format: {
        cssClass: 'format',
        title: 'Bold',
        entries: [
          {
            action: 'inline',
            title: 'Inline',
            entries: [{ action: 'bold', title: 'Bold' }],
          },
        ],
      },
    };

    appendFontColorDropdownEntries(config);
    const inline = config.format.entries[0]!.entries!;
    expect(inline.some((entry) => entry.action === 'mastery-font-color')).toBe(true);
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
