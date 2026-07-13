/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
 */

const FONT_COLOR_ACTION = 'mastery-font-color';

type PMSchema = { marks: Record<string, { spec?: { attrs?: Record<string, unknown> } }> };
type PMMarkType = {
  create: (attrs: Record<string, unknown>) => unknown;
  isInSet: (marks: unknown) => unknown;
  spec?: { attrs?: Record<string, unknown> };
};
type PMEditorView = {
  state: PMEditorState;
  dispatch: (tr: unknown) => void;
};
type PMEditorState = {
  schema: PMSchema;
  selection: {
    empty: boolean;
    from: number;
    to: number;
    $from: { marks: () => unknown[] };
  };
  storedMarks?: unknown[] | null;
  doc: {
    nodesBetween: (
      from: number,
      to: number,
      f: (node: { isText?: boolean; marks?: Array<{ type: unknown; attrs?: Record<string, unknown> }> }) => void,
    ) => void;
  };
  tr: unknown;
};

export interface ResolvedColorMark {
  markType: PMMarkType;
  colorAttr: string;
}

/** Find the schema mark used for inline text color (Foundry uses `textStyle.color`). */
export function resolveColorMark(schema: PMSchema): ResolvedColorMark | null {
  const preferred = ['textStyle', 'fontColor', 'text_color', 'color'];
  for (const name of preferred) {
    const markType = schema.marks[name];
    if (!markType?.spec?.attrs) continue;
    if ('color' in markType.spec.attrs) return { markType: markType as PMMarkType, colorAttr: 'color' };
    if ('fontColor' in markType.spec.attrs) return { markType: markType as PMMarkType, colorAttr: 'fontColor' };
  }

  for (const name of Object.keys(schema.marks)) {
    const markType = schema.marks[name]!;
    const attrs = markType.spec?.attrs;
    if (!attrs) continue;
    if ('color' in attrs) return { markType: markType as PMMarkType, colorAttr: 'color' };
    if ('fontColor' in attrs) return { markType: markType as PMMarkType, colorAttr: 'fontColor' };
  }

  return null;
}

function getMenuView(menu: unknown, view?: PMEditorView | null): PMEditorView | null {
  if (view) return view;
  const candidate = menu as { view?: PMEditorView; options?: { view?: PMEditorView } };
  return candidate.view ?? candidate.options?.view ?? null;
}

function normalizeHexColor(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null;
}

function readActiveColor(
  state: PMEditorState,
  markType: PMMarkType,
  colorAttr: string,
): string | null {
  const { empty, from, to, $from } = state.selection;
  if (empty) {
    const marks = state.storedMarks ?? $from.marks();
    const mark = markType.isInSet(marks) as { attrs?: Record<string, unknown> } | null;
    return normalizeHexColor(mark?.attrs?.[colorAttr] as string | undefined);
  }

  let color: string | null = null;
  let stop = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (stop || !node.isText) return;
    for (const mark of node.marks ?? []) {
      if (mark.type !== markType) continue;
      const next = normalizeHexColor(mark.attrs?.[colorAttr] as string | undefined);
      if (!next) continue;
      if (color && color !== next) {
        color = null;
        stop = true;
        return;
      }
      color = next;
    }
  });
  return color;
}

function applyColorMark(
  menu: unknown,
  view: PMEditorView,
  resolved: ResolvedColorMark,
  color: string | null,
): void {
  const toggleMark = (menu as { _toggleMark?: (mark: PMMarkType, attrs?: object) => void })._toggleMark;
  if (typeof toggleMark === 'function' && color) {
    toggleMark.call(menu, resolved.markType, { [resolved.colorAttr]: color });
    return;
  }

  const { state, dispatch } = view;
  let tr = state.tr as {
    removeStoredMark: (mark: PMMarkType) => unknown;
    removeMark: (from: number, to: number, mark: PMMarkType) => unknown;
    addStoredMark: (mark: unknown) => unknown;
    addMark: (from: number, to: number, mark: unknown) => unknown;
  };
  const { from, to, empty } = state.selection;

  if (!color) {
    if (empty) tr = tr.removeStoredMark(resolved.markType) as typeof tr;
    else tr = tr.removeMark(from, to, resolved.markType) as typeof tr;
  } else {
    const mark = resolved.markType.create({ [resolved.colorAttr]: color });
    if (empty) tr = tr.addStoredMark(mark) as typeof tr;
    else tr = tr.addMark(from, to, mark) as typeof tr;
  }

  dispatch(tr);
}

async function promptFontColor(menu: unknown, view?: PMEditorView | null): Promise<void> {
  const nativePrompt = (menu as { _fontColorPrompt?: () => Promise<void> })._fontColorPrompt;
  if (typeof nativePrompt === 'function') {
    await nativePrompt.call(menu);
    return;
  }

  const editorView = getMenuView(menu, view);
  if (!editorView) {
    ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorUnsupported'));
    return;
  }

  const resolved = resolveColorMark(editorView.state.schema);
  if (!resolved) {
    ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorUnsupported'));
    return;
  }

  const current = readActiveColor(editorView.state, resolved.markType, resolved.colorAttr) ?? '#d0d0d0';

  const choice = await new Promise<string | null | undefined>((resolve) => {
    const content = `
      <form class="mastery-font-color-form">
        <div class="form-group">
          <label>${game.i18n.localize('MASTERY.editor.fontColor')}</label>
          <input type="color" name="color" value="${current}" />
          <input type="text" name="hex" value="${current}" maxlength="7" placeholder="#rrggbb"
            style="margin-top:8px;width:100%;box-sizing:border-box;" />
        </div>
      </form>`;

    const dialog = new Dialog(
      {
        title: game.i18n.localize('MASTERY.editor.fontColorPrompt'),
        content,
        buttons: {
          apply: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MASTERY.editor.fontColorApply'),
            callback: (html: JQuery) => {
              const picker = normalizeHexColor(String(html.find('[name="color"]').val() ?? ''));
              const typed = normalizeHexColor(String(html.find('[name="hex"]').val() ?? ''));
              resolve(picker ?? typed ?? null);
            },
          },
          clear: {
            icon: '<i class="fas fa-eraser"></i>',
            label: game.i18n.localize('MASTERY.editor.fontColorClear'),
            callback: () => resolve(''),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.cancel(),
            callback: () => resolve(undefined),
          },
        },
        default: 'apply',
        render: (html: JQuery) => {
          const colorInput = html.find('[name="color"]');
          const hexInput = html.find('[name="hex"]');
          colorInput.on('input', () => hexInput.val(String(colorInput.val() ?? '')));
          hexInput.on('change', () => {
            const normalized = normalizeHexColor(String(hexInput.val() ?? ''));
            if (normalized) colorInput.val(normalized);
          });
        },
      },
      { width: 320 },
    );
    dialog.render(true);
  });

  if (choice === undefined) return;
  if (choice === '') {
    applyColorMark(menu, editorView, resolved, null);
    return;
  }
  if (!choice) {
    ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorInvalid'));
    return;
  }
  applyColorMark(menu, editorView, resolved, choice);
}

function buildFontColorMenuItem(menu: unknown): Record<string, unknown> {
  return {
    action: FONT_COLOR_ACTION,
    title: game.i18n.localize('MASTERY.editor.fontColor'),
    icon: '<i class="fas fa-palette fa-fw"></i>',
    group: 0,
    priority: 1,
    weight: 500,
    cmd: (_state: PMEditorState, _dispatch: (tr: unknown) => void, view: PMEditorView) => {
      void promptFontColor(menu, view);
      return true;
    },
  };
}

/** Insert the palette button at the start of the ProseMirror toolbar. */
export function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void {
  if (items.some((item) => item.action === FONT_COLOR_ACTION)) return;
  items.unshift(buildFontColorMenuItem(menu));
}

export function initializeProseMirrorFontColor(): void {
  Hooks.on('getProseMirrorMenuItems', (menu: unknown, items: Array<Record<string, unknown>>) => {
    prependFontColorMenuItem(menu, items);
  });
}
