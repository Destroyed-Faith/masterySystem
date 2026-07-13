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
    textBetween?: (from: number, to: number, blockSeparator?: string) => string;
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
const viewsByProseMirrorRoot = new WeakMap<Element, PMEditorView>();
let globalClickHandlerInstalled = false;

const COLOR_ATTR_CANDIDATES = ['color', 'fontColor', 'textColor'] as const;
const COLOR_MARK_PREFERENCE = ['textStyle', 'masteryTextColor', 'fontColor', 'text_color', 'color', 'font', 'span'] as const;
const MASTERY_COLOR_CLASS_PREFIX = 'mastery-color-';
const COLOR_STYLESHEET_ID = 'mastery-prosemirror-colors';

let fontColorPromptOpen = false;
let lastActiveEditorView: PMEditorView | null = null;
let lastActiveMenu: unknown = null;

type SchemaWithSpec = PMSchema & {
  constructor?: new (spec: { nodes: unknown; marks: unknown }) => PMSchema;
  spec?: {
    nodes?: unknown;
    marks?: {
      addToEnd?: (name: string, spec: unknown) => unknown;
      get?: (name: string) => unknown;
    };
  };
  nodeFromJSON?: (json: unknown) => unknown;
};

type EditorStateWithCtor = PMEditorState & {
  constructor?: {
    create?: (config: {
      schema: PMSchema;
      doc: unknown;
      plugins?: unknown;
      selection?: unknown;
      storedMarks?: unknown[] | null;
    }) => PMEditorState;
  };
  doc: { toJSON: () => unknown };
  plugins?: unknown;
  selection: PMEditorState['selection'] & {
    map?: (doc: unknown, mapping: unknown) => unknown;
  };
};

function readMarkAttrNames(markType: unknown): string[] {
  if (!markType || typeof markType !== 'object') return [];
  const candidate = markType as {
    spec?: { attrs?: Record<string, unknown> };
    attrs?: Record<string, unknown>;
  };
  const attrs = candidate.spec?.attrs ?? candidate.attrs;
  return attrs ? Object.keys(attrs) : [];
}

function probeMarkColorAttr(markType: PMMarkType): (typeof COLOR_ATTR_CANDIDATES)[number] | null {
  for (const attr of COLOR_ATTR_CANDIDATES) {
    try {
      const mark = markType.create({ [attr]: '#ffffff' }) as { attrs?: Record<string, unknown> } | null;
      if (mark?.attrs?.[attr]) return attr;
    } catch {
      // Mark does not accept this attribute.
    }
  }
  return null;
}

function resolveColorMarkType(
  markType: PMMarkType | undefined,
  attrCandidates: readonly string[] = COLOR_ATTR_CANDIDATES,
): ResolvedColorMark | null {
  if (!markType) return null;

  for (const attr of attrCandidates) {
    if (readMarkAttrNames(markType).includes(attr)) {
      return { markType, colorAttr: attr };
    }
  }

  if (attrCandidates === COLOR_ATTR_CANDIDATES) {
    const probed = probeMarkColorAttr(markType);
    if (probed) return { markType, colorAttr: probed };
  }

  return null;
}

function colorToClass(color: string): string {
  return `${MASTERY_COLOR_CLASS_PREFIX}${color.slice(1).toLowerCase()}`;
}

function classToColor(classValue: string | null | undefined): string | null {
  const raw = String(classValue ?? '').trim();
  if (!raw) return null;
  const match = raw.split(/\s+/).find((part) => part.startsWith(MASTERY_COLOR_CLASS_PREFIX));
  if (!match) return null;
  return normalizeHexColor(match.slice(MASTERY_COLOR_CLASS_PREFIX.length));
}

function ensureColorStylesheet(): HTMLStyleElement {
  let style = document.getElementById(COLOR_STYLESHEET_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = COLOR_STYLESHEET_ID;
    document.head.appendChild(style);
  }
  return style;
}

function registerColorClass(color: string): void {
  const className = colorToClass(color);
  const style = ensureColorStylesheet();
  if (style.textContent?.includes(`.${className}`)) return;
  style.append(`${className}{color:${color};}`);
}

function mergeClassColor(existingClass: string | null | undefined, color: string | null): string | null {
  const preserved = String(existingClass ?? '')
    .split(/\s+/)
    .filter((part) => part && !part.startsWith(MASTERY_COLOR_CLASS_PREFIX));
  if (!color) return preserved.length ? preserved.join(' ') : null;
  registerColorClass(color);
  preserved.push(colorToClass(color));
  return preserved.join(' ');
}

function readClassColor(classValue: string | null | undefined): string | null {
  return classToColor(classValue);
}

function probeMarkForColorSupport(markType: PMMarkType): ResolvedColorMark | null {
  const colorResolved = resolveColorMarkType(markType, COLOR_ATTR_CANDIDATES);
  if (colorResolved) return colorResolved;

  for (const attr of ['class', 'classes'] as const) {
    try {
      const value = attr === 'classes' ? ['mastery-color-probe'] : 'mastery-color-probe';
      markType.create({ [attr]: value });
      return { markType, colorAttr: attr };
    } catch {
      // Mark does not accept this attribute.
    }
  }

  return null;
}

/** Find the schema mark used for inline text color (Foundry v14 uses `textStyle.color`). */
export function resolveColorMark(schema: PMSchema): ResolvedColorMark | null {
  const marks = schema.marks ?? {};

  for (const name of COLOR_MARK_PREFERENCE) {
    const markType = marks[name] as PMMarkType | undefined;
    if (!markType) continue;
    const resolved = probeMarkForColorSupport(markType);
    if (resolved) return resolved;
  }

  for (const name of Object.keys(marks)) {
    const resolved = probeMarkForColorSupport(marks[name] as PMMarkType);
    if (resolved) return resolved;
  }

  return null;
}

/** Mark spec for inline text color. Foundry v13 omits this; v14 adds it in core. */
export function buildTextStyleColorMarkSpec(): Record<string, unknown> {
  return {
    attrs: {
      color: { default: null },
    },
    parseDOM: [
      {
        style: 'color',
        getAttrs: (value: string) => (value ? { color: value } : false),
      },
      {
        tag: 'span[style*="color"]',
        getAttrs: (dom: unknown) => {
          const color = (dom as HTMLElement).style?.color;
          return color ? { color } : false;
        },
      },
    ],
    toDOM(mark: { attrs: { color?: string | null } }) {
      const color = mark.attrs.color;
      return color ? ['span', { style: `color: ${color}` }, 0] : ['span', {}, 0];
    },
  };
}

/** Extend a ProseMirror schema with a textStyle color mark when core does not provide one. */
export function extendSchemaWithTextStyle(schema: SchemaWithSpec): PMSchema {
  if (resolveColorMark(schema)) return schema;

  const marksSpec = schema.spec?.marks;
  const SchemaCtor = schema.constructor;
  if (!SchemaCtor || typeof marksSpec?.addToEnd !== 'function') return schema;
  if (marksSpec.get?.('textStyle') || schema.marks.textStyle) return schema;

  try {
    const extendedMarks = marksSpec.addToEnd('textStyle', buildTextStyleColorMarkSpec());
    return new SchemaCtor({
      nodes: schema.spec!.nodes,
      marks: extendedMarks,
    });
  } catch (error) {
    console.warn('Mastery System | Could not extend ProseMirror schema with textStyle mark', error);
    return schema;
  }
}

function getEditorStateCreate():
  | ((config: {
      schema: PMSchema;
      doc: unknown;
      plugins?: unknown;
      selection?: unknown;
      storedMarks?: unknown[] | null;
    }) => PMEditorState)
  | null {
  const globalFoundry = (globalThis as { foundry?: { prosemirror?: { EditorState?: EditorStateWithCtor['constructor'] } } })
    .foundry;
  return globalFoundry?.prosemirror?.EditorState?.create ?? null;
}

function recreateSelection(state: EditorStateWithCtor, doc: unknown): unknown {
  const TextSelection = (
    globalThis as { foundry?: { prosemirror?: { TextSelection?: { create: (doc: unknown, from: number, to?: number) => unknown } } } }
  ).foundry?.prosemirror?.TextSelection;

  const docWithSize = doc as { content: { size: number } };
  const from = Math.min(state.selection.from, docWithSize.content.size);
  const to = Math.min(state.selection.to, docWithSize.content.size);

  if (TextSelection?.create) {
    return state.selection.empty ? TextSelection.create(doc, from) : TextSelection.create(doc, from, to);
  }

  return state.selection;
}

/** Rebuild editor state with an extended schema while preserving Foundry's plugin wiring. */
export function reconfigureEditorStateWithSchema(state: EditorStateWithCtor, schema: PMSchema): PMEditorState {
  if (state.schema === schema) return state;

  const create = getEditorStateCreate() ?? state.constructor?.create;
  const schemaWithJson = schema as SchemaWithSpec;
  if (typeof create !== 'function' || typeof schemaWithJson.nodeFromJSON !== 'function') return state;

  try {
    const doc = schemaWithJson.nodeFromJSON(state.doc.toJSON());
    const selection = recreateSelection(state, doc);

    return create({
      schema,
      doc,
      plugins: state.plugins,
      selection,
      storedMarks: state.storedMarks,
    });
  } catch (error) {
    console.warn('Mastery System | Could not reconfigure ProseMirror editor for text color', error);
    return state;
  }
}

function registerEditorView(menu: unknown, menuEl?: HTMLElement | null, view?: PMEditorView | null): void {
  const editorView = view ?? getMenuView(menu);
  if (!editorView) return;

  lastActiveEditorView = editorView;
  lastActiveMenu = menu;
  menuByView.set(editorView, menu);
  const root =
    menuEl?.closest('prose-mirror') ??
    (editorView as PMEditorView & { dom?: Element }).dom?.closest?.('prose-mirror') ??
    null;
  if (root) viewsByProseMirrorRoot.set(root, editorView);
}

/** Find a live ProseMirror view from rendered editor DOM (works when dropdowns render outside prose-mirror). */
export function findViewOnProseMirrorDom(scope: ParentNode = document): PMEditorView | null {
  const selectors = [
    'form.application.sheet.journal-entry-page .ProseMirror',
    'prose-mirror .ProseMirror',
    '.editor-content.ProseMirror',
    '.ProseMirror',
  ];

  for (const selector of selectors) {
    const elements = scope.querySelectorAll(selector);
    for (let index = 0; index < elements.length; index += 1) {
      const el = elements.item(index);
      const view = (el as HTMLElement & { pmViewDesc?: { view?: PMEditorView } }).pmViewDesc?.view;
      if (view?.state?.schema) return view;
    }
  }

  return null;
}

/** Resolve the active editor view from menu context, cached state, or live DOM. */
export function resolveActiveEditorView(
  menu?: unknown,
  view?: PMEditorView | null,
  source?: Element | null,
): PMEditorView | null {
  const direct = getMenuView(menu, view);
  if (direct?.state?.schema) {
    registerEditorView(menu ?? lastActiveMenu, null, direct);
    return direct;
  }

  if (source) {
    const fromSource = findEditorViewFromElement(source);
    if (fromSource) return fromSource;
  }

  if (lastActiveEditorView?.state?.schema) return lastActiveEditorView;

  const journalSheet = document.querySelector('form.application.sheet.journal-entry-page.text');
  const fromDom = findViewOnProseMirrorDom(journalSheet ?? document);
  if (fromDom) {
    registerEditorView(menu ?? lastActiveMenu, null, fromDom);
    return fromDom;
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

function localizeCancelLabel(): string {
  const i18n = game.i18n as { cancel?: () => string; localize: (key: string) => string };
  if (typeof i18n.cancel === 'function') return i18n.cancel();
  return i18n.localize('Cancel');
}

function isFoundryV14Plus(): boolean {
  const release = (game as { release?: { generation?: number } }).release?.generation;
  if (typeof release === 'number') return release >= 14;
  const major = Number(String((game as { version?: string }).version ?? '0').split('.')[0]);
  return Number.isFinite(major) && major >= 14;
}

async function tryNativeFontColorPrompt(menu: unknown, view?: PMEditorView | null): Promise<boolean> {
  if (!isFoundryV14Plus()) return false;

  const menuInstance = (menu ?? lastActiveMenu) as { _fontColorPrompt?: () => Promise<void> };
  if (typeof menuInstance?._fontColorPrompt !== 'function') return false;

  const editorView = resolveActiveEditorView(menu ?? lastActiveMenu, view);
  if (!editorView) return false;

  try {
    await menuInstance._fontColorPrompt.call(menuInstance);
    return true;
  } catch (error) {
    console.warn('Mastery System | Native font color prompt failed, using fallback dialog', error);
    return false;
  }
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
    _editor?: { view?: PMEditorView };
  };
  const cachedView = viewsByProseMirrorRoot.get(proseMirrorRoot);
  if (cachedView?.state?.schema) return cachedView;

  const hostView =
    getMenuView(host.menu) ?? host.view ?? host.editor?.view ?? host._editor?.view ?? null;
  if (hostView?.state?.schema) {
    viewsByProseMirrorRoot.set(proseMirrorRoot, hostView);
    return hostView;
  }

  const editorEl = proseMirrorRoot.querySelector('.editor-content.ProseMirror, .ProseMirror') as
    | (HTMLElement & { pmViewDesc?: { view?: PMEditorView }; editorView?: PMEditorView })
    | null;
  const domView = editorEl?.pmViewDesc?.view ?? editorEl?.editorView ?? null;
  if (domView?.state?.schema) {
    viewsByProseMirrorRoot.set(proseMirrorRoot, domView);
    return domView;
  }

  return null;
}

function resolveMenuContext(source: Element): { menu: unknown; view: PMEditorView | null } {
  const menuEl = source.closest('menu.editor-menu') as HTMLElement | null;
  const registeredMenu = menuEl ? menuRegistry.get(menuEl) : undefined;
  const view = getMenuView(registeredMenu) ?? findEditorViewFromElement(source);
  const menu = (view ? menuByView.get(view) : undefined) ?? registeredMenu ?? {};
  return { menu, view };
}

function registerProseMirrorMenu(menu: unknown, menuEl?: HTMLElement | null): void {
  registerEditorView(menu, menuEl);
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

  const readMarkColor = (mark: { attrs?: Record<string, unknown> } | null | undefined): string | null => {
    if (!mark?.attrs) return null;
    if (colorAttr === 'class') return readClassColor(mark.attrs.class as string | undefined);
    if (colorAttr === 'classes') {
      const classes = mark.attrs.classes;
      if (!Array.isArray(classes)) return null;
      for (const part of classes) {
        const parsed = classToColor(String(part));
        if (parsed) return parsed;
      }
      return null;
    }
    return normalizeHexColor(mark.attrs[colorAttr] as string | undefined);
  };

  if (empty) {
    const marks = state.storedMarks ?? $from.marks();
    const mark = markType.isInSet(marks) as { attrs?: Record<string, unknown> } | null;
    return readMarkColor(mark);
  }

  let color: string | null = null;
  let stop = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (stop || !node.isText) return;
    for (const mark of node.marks ?? []) {
      if (mark.type !== markType) continue;
      const next = readMarkColor(mark);
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

function buildColorMarkAttrs(
  resolved: ResolvedColorMark,
  color: string | null,
  existingMark: { attrs?: Record<string, unknown> } | null,
): Record<string, unknown> {
  if (resolved.colorAttr === 'class') {
    const attrs = { ...(existingMark?.attrs ?? {}) };
    attrs.class = mergeClassColor(attrs.class as string | undefined, color);
    if (!('fontFamily' in attrs)) attrs.fontFamily = null;
    return attrs;
  }

  if (resolved.colorAttr === 'classes') {
    const attrs = { ...(existingMark?.attrs ?? {}) };
    const existing = Array.isArray(attrs.classes) ? [...(attrs.classes as string[])] : [];
    const preserved = existing.filter((part) => !String(part).startsWith(MASTERY_COLOR_CLASS_PREFIX));
    if (color) {
      registerColorClass(color);
      preserved.push(colorToClass(color));
    }
    attrs.classes = preserved.length ? preserved : null;
    if (!('fontFamily' in attrs)) attrs.fontFamily = null;
    return attrs;
  }

  return { [resolved.colorAttr]: color };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getProseMirrorDomParser():
  | { fromSchema: (schema: PMSchema) => { parseSlice: (dom: HTMLElement) => unknown } }
  | null {
  const pm = (globalThis as { foundry?: { prosemirror?: Record<string, unknown> } }).foundry?.prosemirror;
  if (!pm) return null;

  const direct = pm.DOMParser as
    | { fromSchema?: (schema: PMSchema) => { parseSlice: (dom: HTMLElement) => unknown } }
    | undefined;
  if (direct?.fromSchema) return direct as { fromSchema: (schema: PMSchema) => { parseSlice: (dom: HTMLElement) => unknown } };

  const fromModel = (pm.model as { DOMParser?: { fromSchema?: (schema: PMSchema) => { parseSlice: (dom: HTMLElement) => unknown } } })
    ?.DOMParser;
  return fromModel?.fromSchema ? (fromModel as { fromSchema: (schema: PMSchema) => { parseSlice: (dom: HTMLElement) => unknown } }) : null;
}

/** Fallback for schemas where no color mark can be toggled: wrap the selection in a colored span via HTML. */
export function applyColorViaHtmlSlice(view: PMEditorView, color: string | null): boolean {
  const DOMParser = getProseMirrorDomParser();
  if (!DOMParser?.fromSchema || !color) return false;

  const { state, dispatch } = view;
  const { from, to, empty } = state.selection;
  if (empty) return false;

  try {
    const parser = DOMParser.fromSchema(state.schema);
    const text = state.doc.textBetween?.(from, to, '\n') ?? '';
    if (!text) return false;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<span style="color:${color}">${escapeHtml(text)}</span>`;
    const slice = parser.parseSlice(wrapper) as { content?: { size?: number } };
    if (!slice?.content?.size) return false;

    const tr = (state.tr as { replaceSelection: (nextSlice: unknown) => unknown }).replaceSelection(slice);
    dispatch(tr);
    view.focus?.();
    return true;
  } catch {
    return false;
  }
}

function applyColorMark(
  menu: unknown,
  view: PMEditorView,
  resolved: ResolvedColorMark,
  color: string | null,
): void {
  const { state, dispatch } = view;
  const { from, to, empty, $from } = state.selection;
  const existingMark = resolved.markType.isInSet(state.storedMarks ?? $from.marks()) as
    | { attrs?: Record<string, unknown> }
    | null;
  const markAttrs = buildColorMarkAttrs(resolved, color, existingMark);

  const toggleMark = (menu as { _toggleMark?: (mark: PMMarkType, attrs?: object) => void })._toggleMark;
  if (typeof toggleMark === 'function' && color && resolved.colorAttr !== 'class') {
    toggleMark.call(menu, resolved.markType, markAttrs);
    view.focus?.();
    return;
  }

  let tr = state.tr as {
    removeStoredMark: (mark: PMMarkType) => unknown;
    removeMark: (from: number, to: number, mark: PMMarkType) => unknown;
    addStoredMark: (mark: unknown) => unknown;
    addMark: (from: number, to: number, mark: unknown) => unknown;
  };

  if (!color) {
    if (resolved.colorAttr === 'class' || resolved.colorAttr === 'classes') {
      const cleared = buildColorMarkAttrs(resolved, null, existingMark);
      const hasResidual =
        resolved.colorAttr === 'class'
          ? Boolean(cleared.class)
          : Array.isArray(cleared.classes) && cleared.classes.length > 0;
      if (!hasResidual) {
        if (empty) tr = tr.removeStoredMark(resolved.markType) as typeof tr;
        else tr = tr.removeMark(from, to, resolved.markType) as typeof tr;
      } else {
        const mark = resolved.markType.create(cleared);
        if (empty) tr = tr.addStoredMark(mark) as typeof tr;
        else tr = tr.addMark(from, to, mark) as typeof tr;
      }
    } else if (empty) {
      tr = tr.removeStoredMark(resolved.markType) as typeof tr;
    } else {
      tr = tr.removeMark(from, to, resolved.markType) as typeof tr;
    }
  } else {
    const mark = resolved.markType.create(markAttrs);
    if (empty) tr = tr.addStoredMark(mark) as typeof tr;
    else tr = tr.addMark(from, to, mark) as typeof tr;
  }

  dispatch(tr);
  view.focus?.();
}

export async function promptFontColor(menu: unknown, view?: PMEditorView | null, source?: Element | null): Promise<void> {
  if (fontColorPromptOpen) return;
  fontColorPromptOpen = true;

  try {
    if (await tryNativeFontColorPrompt(menu, view)) return;

    const editorView = resolveActiveEditorView(
      menu ?? lastActiveMenu,
      view,
      source instanceof Element ? source : document.activeElement instanceof Element ? document.activeElement : null,
    );
    if (!editorView) {
      ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorUnsupported'));
      return;
    }

    registerEditorView(menu ?? lastActiveMenu, null, editorView);

    let resolved = resolveColorMark(editorView.state.schema);
    const current =
      (resolved ? readActiveColor(editorView.state, resolved.markType, resolved.colorAttr) : null) ?? '#d0d0d0';

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
            label: localizeCancelLabel(),
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
      if (resolved) applyColorMark(menu ?? lastActiveMenu, editorView, resolved, null);
      return;
    }
    if (!choice) {
      ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorInvalid'));
      return;
    }

    resolved = resolved ?? resolveColorMark(editorView.state.schema);
    if (resolved) {
      applyColorMark(menu ?? lastActiveMenu, editorView, resolved, choice);
      return;
    }

    if (!applyColorViaHtmlSlice(editorView, choice)) {
      ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorUnsupported'));
    }
  } finally {
    fontColorPromptOpen = false;
  }
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
  void promptFontColor(menu ?? lastActiveMenu, view, actionEl);
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
      void promptFontColor(menu ?? this, view ?? getMenuView(this), actionEl);
      return;
    }
    original.call(this, event);
  };
  prototype._masteryFontColorActionPatched = true;
}

function patchProseMirrorMenuUpdate(): void {
  const Menu = (foundry as unknown as { prosemirror?: { ProseMirrorMenu?: { prototype?: Record<string, unknown> } } })
    .prosemirror?.ProseMirrorMenu;
  const prototype = Menu?.prototype;
  if (!prototype || typeof prototype.update !== 'function' || prototype._masteryFontColorUpdatePatched) {
    return;
  }

  const original = prototype.update as (view: PMEditorView, prevState: unknown) => void;
  prototype.update = function (this: unknown, view: PMEditorView, prevState: unknown) {
    original.call(this, view, prevState);
    registerEditorView(this, null, view);
  };
  prototype._masteryFontColorUpdatePatched = true;
}

function bindJournalProseMirrorOpenHandlers(root: ParentNode): void {
  const proseMirror = root.querySelector('prose-mirror');
  if (!proseMirror || (proseMirror as HTMLElement & { _masteryFontColorOpenBound?: boolean })._masteryFontColorOpenBound) {
    return;
  }

  (proseMirror as HTMLElement & { _masteryFontColorOpenBound?: boolean })._masteryFontColorOpenBound = true;
  proseMirror.addEventListener('open', () => {
    scheduleToolbarInjection(root);
    window.setTimeout(() => {
      const view = findEditorViewFromElement(proseMirror);
      if (view) registerEditorView({}, proseMirror as HTMLElement, view);
    }, 0);
  });
}

function installProseMirrorMenuPatches(): void {
  patchProseMirrorMenuOnAction();
  patchProseMirrorMenuActivateListeners();
  patchProseMirrorMenuUpdate();
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
    registerProseMirrorMenu(this, html);
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
  installProseMirrorMenuPatches();

  Hooks.once('ready', () => {
    installGlobalFontColorClickHandler();
    installProseMirrorMenuPatches();
  });

  Hooks.on('renderJournalEntryPageProseMirrorSheet', (_app: unknown, element: HTMLElement) => {
    scheduleToolbarInjection(element);
    bindJournalProseMirrorOpenHandlers(element);
  });
}
