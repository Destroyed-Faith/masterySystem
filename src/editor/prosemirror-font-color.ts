/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
 *
 * Journal text pages only render core dropdowns + a fixed set of icon buttons.
 * Dropdown submenu clicks are handled by Foundry globals and ignore unknown actions
 * unless we intercept them, so we register handlers on ProseMirrorMenu and document.
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
  focus?: () => void;
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

const menuRegistry = new WeakMap<HTMLElement, unknown>();
const menuByView = new WeakMap<PMEditorView, unknown>();
let globalClickHandlerInstalled = false;

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

export function getMenuView(menu: unknown, view?: PMEditorView | null): PMEditorView | null {
  if (view) return view;
  if (!menu || typeof menu !== 'object') return null;
  const candidate = menu as { view?: PMEditorView; options?: { view?: PMEditorView } };
  return candidate.view ?? candidate.options?.view ?? null;
}

/** Resolve the live ProseMirror view from the surrounding editor DOM. */
export function findEditorViewFromElement(root: Element | ParentNode | null): PMEditorView | null {
  if (!root) return null;
  const element = root instanceof Element ? root : null;
  if (!element) return null;

  const proseMirrorRoot = element.closest('prose-mirror');
  if (!proseMirrorRoot) return null;

  const host = proseMirrorRoot as HTMLElement & {
    view?: PMEditorView;
    editor?: { view?: PMEditorView };
    menu?: unknown;
  };
  const hostView = getMenuView(host.menu) ?? host.view ?? host.editor?.view ?? null;
  if (hostView?.state?.schema) return hostView;

  const editorEl = proseMirrorRoot.querySelector('.editor-content.ProseMirror, .ProseMirror') as
    | (HTMLElement & { pmViewDesc?: { view?: PMEditorView }; editorView?: PMEditorView })
    | null;
  const domView = editorEl?.pmViewDesc?.view ?? editorEl?.editorView ?? null;
  if (domView?.state?.schema) return domView;

  return null;
}

function resolveMenuContext(source: Element): { menu: unknown; view: PMEditorView | null } {
  const menuEl = source.closest('menu.editor-menu') as HTMLElement | null;
  const registeredMenu = menuEl ? menuRegistry.get(menuEl) : undefined;
  const view = getMenuView(registeredMenu) ?? findEditorViewFromElement(source);
  const menu = (view ? menuByView.get(view) : undefined) ?? registeredMenu ?? {};
  return { menu, view };
}

function registerProseMirrorMenu(menu: unknown): void {
  const view = getMenuView(menu);
  if (view) menuByView.set(view, menu);
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
    view.focus?.();
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
  view.focus?.();
}

export async function promptFontColor(menu: unknown, view?: PMEditorView | null): Promise<void> {
  const editorView = getMenuView(menu, view) ?? findEditorViewFromElement(document.activeElement ?? document.body);
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
        close: () => resolve(undefined),
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

function handleFontColorActionClick(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const actionEl = target.closest(`[data-action="${FONT_COLOR_ACTION}"]`);
  if (!actionEl) return;

  event.preventDefault();
  event.stopPropagation();

  const { menu, view } = resolveMenuContext(actionEl);
  void promptFontColor(menu, view);
}

/** Inject a palette icon button at the start of the ProseMirror toolbar DOM. */
export function injectFontColorToolbarButton(menuEl: HTMLElement, menu: unknown): void {
  menuRegistry.set(menuEl, menu);

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
}

function installGlobalFontColorClickHandler(): void {
  if (globalClickHandlerInstalled) return;
  document.addEventListener('click', handleFontColorActionClick, true);
  globalClickHandlerInstalled = true;
}

function patchProseMirrorMenuOnAction(): void {
  const Menu = (foundry as unknown as { prosemirror?: { ProseMirrorMenu?: { prototype?: Record<string, unknown> } } })
    .prosemirror?.ProseMirrorMenu;
  const prototype = Menu?.prototype;
  if (!prototype || typeof prototype._onAction !== 'function' || prototype._masteryFontColorActionPatched) {
    return;
  }

  const original = prototype._onAction as (event: MouseEvent) => void;
  prototype._onAction = function (this: unknown, event: MouseEvent) {
    const actionEl = (event.target as Element | null)?.closest?.('[data-action]');
    if (actionEl?.getAttribute('data-action') === FONT_COLOR_ACTION) {
      event.preventDefault();
      event.stopPropagation();
      const { menu, view } = resolveMenuContext(actionEl);
      void promptFontColor(menu ?? this, view ?? getMenuView(this));
      return;
    }
    original.call(this, event);
  };
  prototype._masteryFontColorActionPatched = true;
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
    registerProseMirrorMenu(this);
    menuRegistry.set(html, this);
    injectFontColorToolbarButton(html, this);
  };
  prototype._masteryFontColorPatched = true;
}

function scheduleToolbarInjection(root: ParentNode): void {
  const tryInject = (): void => {
    const menuEl = root.querySelector('menu.editor-menu') as HTMLElement | null;
    if (!menuEl) return;
    const proseMirror = root.querySelector('prose-mirror');
    const menuFromElement = (proseMirror as { menu?: unknown } | null)?.menu;
    const menu = menuRegistry.get(menuEl) ?? menuFromElement ?? {};
    injectFontColorToolbarButton(menuEl, menu);
  };

  tryInject();
  window.setTimeout(tryInject, 0);
  window.setTimeout(tryInject, 250);
}

export function initializeProseMirrorFontColor(): void {
  Hooks.on('getProseMirrorMenuItems', (menu: unknown, items: Array<Record<string, unknown>>) => {
    registerProseMirrorMenu(menu);
    prependFontColorMenuItem(menu, items);
  });

  Hooks.on('getProseMirrorMenuDropDowns', (menu: unknown, config: Record<string, DropdownConfig>) => {
    registerProseMirrorMenu(menu);
    prependFontColorDropDown(config);
  });

  installGlobalFontColorClickHandler();
  patchProseMirrorMenuOnAction();
  patchProseMirrorMenuActivateListeners();

  Hooks.once('ready', () => {
    installGlobalFontColorClickHandler();
    patchProseMirrorMenuOnAction();
    patchProseMirrorMenuActivateListeners();
  });

  Hooks.on('renderJournalEntryPageProseMirrorSheet', (_app: unknown, element: HTMLElement) => {
    scheduleToolbarInjection(element);
  });
}
