/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
 */
const FONT_COLOR_ACTION = 'mastery-font-color';
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
function getMenuView(menu) {
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
async function promptFontColor(menu) {
    const nativePrompt = menu._fontColorPrompt;
    if (typeof nativePrompt === 'function') {
        await nativePrompt.call(menu);
        return;
    }
    const view = getMenuView(menu);
    if (!view)
        return;
    const resolved = resolveColorMark(view.state.schema);
    if (!resolved) {
        ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorUnsupported'));
        return;
    }
    const current = readActiveColor(view.state, resolved.markType, resolved.colorAttr) ?? '#d0d0d0';
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
        applyColorMark(menu, view, resolved, null);
        return;
    }
    if (!choice) {
        ui.notifications?.warn(game.i18n.localize('MASTERY.editor.fontColorInvalid'));
        return;
    }
    applyColorMark(menu, view, resolved, choice);
}
function buildFontColorMenuItem(menu) {
    const view = getMenuView(menu);
    const resolved = view ? resolveColorMark(view.state.schema) : null;
    return {
        action: FONT_COLOR_ACTION,
        title: game.i18n.localize('MASTERY.editor.fontColor'),
        icon: '<i class="fas fa-palette"></i>',
        group: 1,
        priority: 46,
        mark: resolved?.markType,
        cmd: () => {
            void promptFontColor(menu);
            return true;
        },
    };
}
function appendFontColorMenuItem(menu, items) {
    if (items.some((item) => item.action === FONT_COLOR_ACTION))
        return;
    items.push(buildFontColorMenuItem(menu));
}
export function initializeProseMirrorFontColor() {
    Hooks.on('getProseMirrorMenuItems', (menu, items) => {
        appendFontColorMenuItem(menu, items);
    });
    Hooks.on('getProseMirrorMenuDropDowns', (menu, config) => {
        const children = config.format?.children;
        if (!children || children.some((item) => item.action === FONT_COLOR_ACTION))
            return;
        children.push(buildFontColorMenuItem(menu));
    });
}
//# sourceMappingURL=prosemirror-font-color.js.map