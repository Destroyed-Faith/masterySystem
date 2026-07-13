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
/** Find the schema mark used for inline text color (Foundry uses `textStyle.color`). */
export function resolveColorMark(schema) {
    const preferred = ['textStyle', 'fontColor', 'text_color', 'color'];
    for (const name of preferred) {
        const markType = schema.marks[name];
        if (!markType?.spec?.attrs)
            continue;
        if ('color' in markType.spec.attrs)
            return { markType: markType, colorAttr: 'color' };
        if ('fontColor' in markType.spec.attrs)
            return { markType: markType, colorAttr: 'fontColor' };
    }
    for (const name of Object.keys(schema.marks)) {
        const markType = schema.marks[name];
        const attrs = markType.spec?.attrs;
        if (!attrs)
            continue;
        if ('color' in attrs)
            return { markType: markType, colorAttr: 'color' };
        if ('fontColor' in attrs)
            return { markType: markType, colorAttr: 'fontColor' };
    }
    return null;
}
function escapeAttr(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function getMenuView(menu, view) {
    if (view)
        return view;
    const candidate = menu;
    return candidate.view ?? candidate.options?.view ?? null;
}
function normalizeHexColor(value) {
    const raw = String(value ?? '').trim();
    if (!raw)
        return null;
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null;
}
function readActiveColor(state, markType, colorAttr) {
    const { empty, from, to, $from } = state.selection;
    if (empty) {
        const marks = state.storedMarks ?? $from.marks();
        const mark = markType.isInSet(marks);
        return normalizeHexColor(mark?.attrs?.[colorAttr]);
    }
    let color = null;
    let stop = false;
    state.doc.nodesBetween(from, to, (node) => {
        if (stop || !node.isText)
            return;
        for (const mark of node.marks ?? []) {
            if (mark.type !== markType)
                continue;
            const next = normalizeHexColor(mark.attrs?.[colorAttr]);
            if (!next)
                continue;
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
function applyColorMark(menu, view, resolved, color) {
    const toggleMark = menu._toggleMark;
    if (typeof toggleMark === 'function' && color) {
        toggleMark.call(menu, resolved.markType, { [resolved.colorAttr]: color });
        return;
    }
    const { state, dispatch } = view;
    let tr = state.tr;
    const { from, to, empty } = state.selection;
    if (!color) {
        if (empty)
            tr = tr.removeStoredMark(resolved.markType);
        else
            tr = tr.removeMark(from, to, resolved.markType);
    }
    else {
        const mark = resolved.markType.create({ [resolved.colorAttr]: color });
        if (empty)
            tr = tr.addStoredMark(mark);
        else
            tr = tr.addMark(from, to, mark);
    }
    dispatch(tr);
}
async function promptFontColor(menu, view) {
    const nativePrompt = menu._fontColorPrompt;
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
    const choice = await new Promise((resolve) => {
        const content = `
      <form class="mastery-font-color-form">
        <div class="form-group">
          <label>${game.i18n.localize('MASTERY.editor.fontColor')}</label>
          <input type="color" name="color" value="${current}" />
          <input type="text" name="hex" value="${current}" maxlength="7" placeholder="#rrggbb"
            style="margin-top:8px;width:100%;box-sizing:border-box;" />
        </div>
      </form>`;
        const dialog = new Dialog({
            title: game.i18n.localize('MASTERY.editor.fontColorPrompt'),
            content,
            buttons: {
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('MASTERY.editor.fontColorApply'),
                    callback: (html) => {
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
            render: (html) => {
                const colorInput = html.find('[name="color"]');
                const hexInput = html.find('[name="hex"]');
                colorInput.on('input', () => hexInput.val(String(colorInput.val() ?? '')));
                hexInput.on('change', () => {
                    const normalized = normalizeHexColor(String(hexInput.val() ?? ''));
                    if (normalized)
                        colorInput.val(normalized);
                });
            },
        }, { width: 320 });
        dialog.render(true);
    });
    if (choice === undefined)
        return;
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
function buildFontColorMenuItem(menu) {
    return {
        action: FONT_COLOR_ACTION,
        title: game.i18n.localize('MASTERY.editor.fontColor'),
        icon: '<i class="fa-solid fa-palette fa-fw"></i>',
        group: 0,
        priority: 1,
        weight: 500,
        cmd: (_state, _dispatch, view) => {
            void promptFontColor(menu, view);
            return true;
        },
    };
}
/** Register the palette action so Foundry's menu click handler can dispatch it. */
export function prependFontColorMenuItem(menu, items) {
    if (items.some((item) => item.action === FONT_COLOR_ACTION))
        return;
    items.unshift(buildFontColorMenuItem(menu));
}
/** Prepend a palette dropdown for editors that only render dropdown toolbars. */
export function prependFontColorDropDown(config) {
    if (config[FONT_COLOR_DROPDOWN_KEY])
        return;
    const title = game.i18n.localize('MASTERY.editor.fontColor');
    const existing = { ...config };
    for (const key of Object.keys(config))
        delete config[key];
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
export function injectFontColorToolbarButton(menuEl, menu) {
    if (menuEl.querySelector(`[data-action="${FONT_COLOR_ACTION}"]`))
        return;
    const title = game.i18n.localize('MASTERY.editor.fontColor');
    const li = document.createElement('li');
    li.className = 'text mastery-font-color-item';
    li.innerHTML = `
    <button type="button" class="mastery-font-color-btn" data-tooltip="${escapeAttr(title)}"
      data-action="${FONT_COLOR_ACTION}" aria-label="${escapeAttr(title)}">
      <i class="fa-solid fa-palette fa-fw"></i>
    </button>`;
    const firstTool = menuEl.querySelector(':scope > li.text');
    if (firstTool)
        menuEl.insertBefore(li, firstTool);
    else
        menuEl.prepend(li);
    const button = li.querySelector('button');
    if (!button)
        return;
    button.addEventListener('click', (event) => {
        const menuInstance = menu;
        if (typeof menuInstance._onAction === 'function') {
            menuInstance._onAction(event);
            return;
        }
        event.preventDefault();
        void promptFontColor(menu, getMenuView(menu));
    });
}
function patchProseMirrorMenuActivateListeners() {
    const Menu = foundry
        .prosemirror?.ProseMirrorMenu;
    const prototype = Menu?.prototype;
    if (!prototype || typeof prototype.activateListeners !== 'function' || prototype._masteryFontColorPatched) {
        return;
    }
    const original = prototype.activateListeners;
    prototype.activateListeners = function (html) {
        original.call(this, html);
        injectFontColorToolbarButton(html, this);
    };
    prototype._masteryFontColorPatched = true;
}
function scheduleToolbarInjection(root) {
    const tryInject = () => {
        const menuEl = root.querySelector('menu.editor-menu');
        if (!menuEl)
            return;
        const proseMirror = root.querySelector('prose-mirror');
        const menuPlugin = proseMirror?.menu;
        injectFontColorToolbarButton(menuEl, menuPlugin ?? {});
    };
    tryInject();
    window.setTimeout(tryInject, 0);
    window.setTimeout(tryInject, 250);
}
export function initializeProseMirrorFontColor() {
    Hooks.on('getProseMirrorMenuItems', (menu, items) => {
        prependFontColorMenuItem(menu, items);
    });
    Hooks.on('getProseMirrorMenuDropDowns', (_menu, config) => {
        prependFontColorDropDown(config);
    });
    patchProseMirrorMenuActivateListeners();
    Hooks.once('ready', () => patchProseMirrorMenuActivateListeners());
    Hooks.on('renderJournalEntryPageProseMirrorSheet', (_app, element) => {
        scheduleToolbarInjection(element);
    });
}
//# sourceMappingURL=prosemirror-font-color.js.map