import { describe, expect, it, vi } from 'vitest';
import {
  buildTextStyleColorMarkSpec,
  extendSchemaWithTextStyle,
  getMenuView,
  prependFontColorDropDown,
  prependFontColorMenuItem,
  reconfigureEditorStateWithSchema,
  resolveColorMark,
} from '../src/editor/prosemirror-font-color';

vi.stubGlobal('game', {
  i18n: {
    localize: (key: string) => key,
  },
});

function mockSchema(marks: Record<string, { attrs?: Record<string, unknown>; create?: (attrs: Record<string, unknown>) => unknown }>) {
  return {
    marks: Object.fromEntries(
      Object.entries(marks).map(([name, spec]) => [
        name,
        {
          spec: { attrs: spec.attrs ?? {} },
          create:
            spec.create ??
            ((attrs: Record<string, unknown>) => {
              const allowed = Object.keys(spec.attrs ?? {});
              for (const key of Object.keys(attrs)) {
                if (!allowed.includes(key)) throw new Error(`invalid attr: ${key}`);
              }
              return { attrs };
            }),
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
    expect(items[0]?.icon).toContain('fa-solid');
    expect(items[0]?.mark).toBeUndefined();
    expect(typeof items[0]?.cmd).toBe('function');
  });

  it('does not duplicate the palette button', () => {
    const items: Array<Record<string, unknown>> = [{ action: 'mastery-font-color', title: 'Text Color' }];

    prependFontColorMenuItem({}, items);

    expect(items).toHaveLength(1);
  });
});

describe('prependFontColorDropDown', () => {
  it('adds a palette dropdown before format and fonts', () => {
    const config = {
      format: { cssClass: 'format', title: 'Bold', entries: [] },
      fonts: { cssClass: 'fonts', title: 'Font', entries: [] },
    };

    prependFontColorDropDown(config);

    expect(Object.keys(config)[0]).toBe('masteryColor');
    expect(config.masteryColor?.icon).toContain('fa-palette');
    expect(config.masteryColor?.entries?.[0]?.action).toBe('mastery-font-color');
  });
});

describe('getMenuView', () => {
  it('reads the editor view from a ProseMirror menu instance', () => {
    const view = { state: { schema: { marks: {} } } };
    expect(getMenuView({ view })).toBe(view);
  });

  it('returns null for missing menu instances', () => {
    expect(getMenuView(null)).toBeNull();
    expect(getMenuView(undefined)).toBeNull();
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

  it('detects color marks via runtime create probe when spec attrs are missing', () => {
    const schema = mockSchema({
      customColor: {
        create: (attrs) => ({ attrs }),
      },
    });
    const resolved = resolveColorMark(schema);
    expect(resolved?.colorAttr).toBe('color');
  });

  it('falls back to class-based font marks in Foundry v13', () => {
    const schema = mockSchema({
      font: { attrs: { fontFamily: { default: null }, class: { default: null } } },
    });
    const resolved = resolveColorMark(schema);
    expect(resolved?.markType).toBe(schema.marks.font);
    expect(resolved?.colorAttr).toBe('class');
  });
});

describe('extendSchemaWithTextStyle', () => {
  it('adds a textStyle mark when the schema has no color support', () => {
    const baseMarks = {
      bold: { attrs: {} },
    };
    const schema = {
      marks: baseMarks,
      spec: {
        nodes: {},
        marks: {
          get: (name: string) => baseMarks[name as keyof typeof baseMarks],
          addToEnd: (name: string, spec: unknown) => ({ ...baseMarks, [name]: spec }),
        },
      },
      constructor: class MockSchema {
        marks: Record<string, unknown>;
        spec: { nodes: unknown; marks: unknown };
        nodeFromJSON = vi.fn((json: unknown) => json);

        constructor(spec: { nodes: unknown; marks: Record<string, unknown> }) {
          this.spec = spec;
          this.marks = Object.fromEntries(
            Object.entries(spec.marks).map(([markName, markSpec]) => [
              markName,
              {
                spec: { attrs: (markSpec as { attrs?: Record<string, unknown> }).attrs ?? {} },
                create: (attrs: Record<string, unknown>) => {
                  const allowed = Object.keys((markSpec as { attrs?: Record<string, unknown> }).attrs ?? {});
                  for (const key of Object.keys(attrs)) {
                    if (!allowed.includes(key)) throw new Error(`invalid attr: ${key}`);
                  }
                  return { attrs };
                },
              },
            ]),
          );
        }
      },
    };

    const extended = extendSchemaWithTextStyle(schema);
    expect(extended.marks.textStyle).toBeDefined();
    expect(resolveColorMark(extended)?.colorAttr).toBe('color');
  });

  it('leaves schemas that already expose a color mark unchanged', () => {
    const schema = mockSchema({
      textStyle: { attrs: { color: { default: null } } },
    });
    expect(extendSchemaWithTextStyle(schema as never)).toBe(schema);
  });
});

describe('buildTextStyleColorMarkSpec', () => {
  it('defines a color attribute and span serialization', () => {
    const spec = buildTextStyleColorMarkSpec();
    expect(spec.attrs).toEqual({ color: { default: null } });
    expect(spec.parseDOM).toHaveLength(2);
    expect(typeof spec.toDOM).toBe('function');
  });
});

describe('reconfigureEditorStateWithSchema', () => {
  it('preserves plugins when rebuilding editor state with an extended schema', () => {
    const plugins = [{ key: 'menu' }];
    const oldSchema = mockSchema({ bold: { attrs: {} } });
    const newSchema = {
      ...mockSchema({
        bold: { attrs: {} },
        textStyle: { attrs: { color: { default: null } } },
      }),
      nodeFromJSON: vi.fn((json: unknown) => json),
    };

    const state = {
      schema: oldSchema,
      plugins,
      storedMarks: null,
      selection: { empty: true, from: 1, to: 1, $from: { marks: () => [] } },
      doc: {
        toJSON: () => ({ type: 'doc', content: [] }),
      },
      constructor: {
        create: vi.fn((config: Record<string, unknown>) => ({ ...config, tr: {} })),
      },
    };

    const rebuilt = reconfigureEditorStateWithSchema(state as never, newSchema);
    expect(state.constructor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: newSchema,
        plugins,
      }),
    );
    expect(rebuilt.schema).toBe(newSchema);
  });

  it('returns the original state when schema extension is unchanged', () => {
    const schema = mockSchema({ textStyle: { attrs: { color: { default: null } } } });
    const state = {
      schema,
      plugins: [],
      doc: { toJSON: () => ({}) },
      selection: { empty: true, from: 0, to: 0, $from: { marks: () => [] } },
    };

    expect(reconfigureEditorStateWithSchema(state as never, schema)).toBe(state);
  });
});
