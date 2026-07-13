/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
 *
 * Journal text pages only render core dropdowns + a fixed set of icon buttons.
 * Custom getProseMirrorMenuItems entries are not placed in the DOM there, so we
 * inject the palette button when ProseMirrorMenu activates listeners.
 */

const FONT_COLOR_ACTION = 'mastery-font-color';
const FONT_COLOR_DROPDOWN_KEY = 'masteryColor';

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

type DropdownConfig = {
  cssClass?: string;
  title?: string;
  icon?: string;
  entries?: DropdownEntry[];
  children?: DropdownEntry[];
};

type DropdownEntry = {
  action?: string;
  title?: string;
  style?: string;
  icon?: string;
  entries?: DropdownEntry[];
  children?: DropdownEntry[];
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

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
    icon: '<i class="fa-solid fa-palette fa-fw"></i>',
    group: 0,
    priority: 1,
    weight: 500,
    cmd: (_state: PMEditorState, _dispatch: (tr: unknown) => void, view: PMEditorView) => {
      void promptFontColor(menu, view);
      return true;
    },
  };
}

/** Register the palette action so Foundry's menu click handler can dispatch it. */
export function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void {
  if (items.some((item) => item.action === FONT_COLOR_ACTION)) return;
  items.unshift(buildFontColorMenuItem(menu));
}

/** Prepend a palette dropdown for editors that only render dropdown toolbars. */
export function prependFontColorDropDown(config: Record<string, DropdownConfig>): void {
  if (config[FONT_COLOR_DROPDOWN_KEY]) return;

  const title = game.i18n.localize('MASTERY.editor.fontColor');
  const existing = { ...config };
  for (const key of Object.keys(config)) delete config[key];

  config[FONT_COLOR_DROPDOWN_KEY] = {
    cssClass: 'mastery-color',
    title,
    icon: '<i class="fa-solid fa-palette fa-fw"></i>',
    entries: [
      {
        action: FONT_COLOR_ACTION,
        title: game.i18n.localize('MASTERY.editor.fontColorPrompt'),
        style: 'color: #c9a227',
      },
    ],
  };

  for (const [key, value] of Object.entries(existing)) {
    config[key] = value;
  }
}

/** Inject a palette icon button at the start of the ProseMirror toolbar DOM. */
export function injectFontColorToolbarButton(menuEl: HTMLElement, menu: unknown): void {
  if (menuEl.querySelector(`[data-action="${FONT_COLOR_ACTION}"]`)) return;

  const title = game.i18n.localize('MASTERY.editor.fontColor');
  const li = document.createElement('li');
  li.className = 'text mastery-font-color-item';
  li.innerHTML = `
    <button type="button" class="mastery-font-color-btn" data-tooltip="${escapeAttr(title)}"
      data-action="${FONT_COLOR_ACTION}" aria-label="${escapeAttr(title)}">
      <i class="fa-solid fa-palette fa-fw"></i>
    </button>`;

  const firstTool = menuEl.querySelector(':scope > li.text');
  if (firstTool) menuEl.insertBefore(li, firstTool);
  else menuEl.prepend(li);

  const button = li.querySelector('button');
  if (!button) return;

  button.addEventListener('click', (event) => {
    const menuInstance = menu as { _onAction?: (ev: MouseEvent) => void };
    if (typeof menuInstance._onAction === 'function') {
      menuInstance._onAction(event);
      return;
    }
    event.preventDefault();
    void promptFontColor(menu, getMenuView(menu));
  });
}

function patchProseMirrorMenuActivateListeners(): void {
  const Menu = (foundry as unknown as { prosemirror?: { ProseMirrorMenu?: { prototype?: Record<string, unknown> } } })
    .prosemirror?.ProseMirrorMenu;
  const prototype = Menu?.prototype;
  if (!prototype || typeof prototype.activateListeners !== 'function' || prototype._masteryFontColorPatched) {
    return;
  }

  const original = prototype.activateListeners as (html: HTMLMenuElement) => void;
  prototype.activateListeners = function (this: unknown, html: HTMLMenuElement) {
    original.call(this, html);
    injectFontColorToolbarButton(html, this);
  };
  prototype._masteryFontColorPatched = true;
}

function scheduleToolbarInjection(root: ParentNode): void {
  const tryInject = (): void => {
    const menuEl = root.querySelector('menu.editor-menu');
    if (!menuEl) return;
    const proseMirror = root.querySelector('prose-mirror');
    const menuPlugin = (proseMirror as { menu?: unknown } | null)?.menu;
    injectFontColorToolbarButton(menuEl as HTMLElement, menuPlugin ?? {});
  };

  tryInject();
  window.setTimeout(tryInject, 0);
  window.setTimeout(tryInject, 250);
}

export function initializeProseMirrorFontColor(): void {
  Hooks.on('getProseMirrorMenuItems', (menu: unknown, items: Array<Record<string, unknown>>) => {
    prependFontColorMenuItem(menu, items);
  });

  Hooks.on('getProseMirrorMenuDropDowns', (_menu: unknown, config: Record<string, DropdownConfig>) => {
    prependFontColorDropDown(config);
  });

  patchProseMirrorMenuActivateListeners();
  Hooks.once('ready', () => patchProseMirrorMenuActivateListeners());

  Hooks.on('renderJournalEntryPageProseMirrorSheet', (_app: unknown, element: HTMLElement) => {
    scheduleToolbarInjection(element);
  });
}
