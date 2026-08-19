/**
 * Hooks and the GM toggle. The button sits in the right Scenes sidebar,
 * next to Create Scene / Create Folder — not in the left scene-control menu.
 */
import { getSceneEditor } from './controller.js';
export const SCENE_EDITOR_BUTTON_ID = 'ms-scene-editor-toggle';
function asElement(html) {
    if (html instanceof HTMLElement)
        return html;
    if (html && typeof html.get === 'function') {
        return html.get(0) ?? null;
    }
    return null;
}
function isScenesRoot(el) {
    return el.id === 'scenes' || el.dataset?.tab === 'scenes' || el.classList.contains('scenes-sidebar');
}
function scenesRoot(html) {
    const el = asElement(html);
    if (el) {
        if (isScenesRoot(el))
            return el;
        return el.querySelector('#scenes, .sidebar-tab[data-tab="scenes"]') ?? el;
    }
    return (document.querySelector('#scenes') ??
        document.querySelector('.sidebar-tab[data-tab="scenes"]') ??
        document.querySelector('[data-tab="scenes"].directory'));
}
function isScenesTab(app, html) {
    if (app?.tabName === 'scenes' || app?.id === 'scenes' || app?.tabName === 'scene')
        return true;
    const el = asElement(html);
    return !!(el && (isScenesRoot(el) || el.querySelector?.('#scenes, .sidebar-tab[data-tab="scenes"]')));
}
function removeButton() {
    document.getElementById(SCENE_EDITOR_BUTTON_ID)?.remove();
}
function insertToggle(root, btn) {
    const createFolder = root.querySelector('button[data-action="createFolder"], button.create-folder');
    if (createFolder) {
        createFolder.after(btn);
        return true;
    }
    const createScene = root.querySelector('button[data-action="createEntry"], button[data-action="createDocument"], button.create-entry, button.create-document');
    if (createScene) {
        createScene.after(btn);
        return true;
    }
    const host = root.querySelector('.directory-header .header-actions') ??
        root.querySelector('.directory-header .action-buttons') ??
        root.querySelector('.header-actions') ??
        root.querySelector('.action-buttons') ??
        root.querySelector('.directory-footer') ??
        root.querySelector('[data-application-part="footer"]') ??
        root.querySelector('[data-application-part="header"]') ??
        root.querySelector('.directory-header');
    if (!host)
        return false;
    host.appendChild(btn);
    return true;
}
function injectToggle(html) {
    removeButton();
    if (!game.user?.isGM)
        return;
    const root = scenesRoot(html);
    if (!root)
        return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = SCENE_EDITOR_BUTTON_ID;
    btn.className = 'ms-scene-editor-toggle';
    btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const editor = getSceneEditor();
        if (editor.active)
            await editor.deactivate();
        else
            await editor.activate();
    });
    if (!insertToggle(root, btn)) {
        btn.remove();
        return;
    }
    getSceneEditor().refreshButton();
}
export function initializeSceneEditor() {
    Hooks.on('renderSceneDirectory', (_app, html) => {
        injectToggle(html);
    });
    Hooks.on('renderSidebarTab', (app, html) => {
        if (isScenesTab(app, html))
            injectToggle(html);
    });
    Hooks.on('canvasReady', () => {
        const editor = getSceneEditor();
        if (editor.active)
            void editor.reattach();
        else
            editor.teardownCanvas();
    });
    Hooks.on('canvasTearDown', () => {
        getSceneEditor().teardownCanvas();
    });
    Hooks.once('ready', () => {
        injectToggle();
    });
    Hooks.on('updateScene', (scene) => {
        const editor = getSceneEditor();
        if (!editor.active)
            return;
        const current = globalThis.canvas?.scene;
        if (current && scene?.id === current.id)
            editor.redraw();
    });
    Hooks.on('createWall', () => {
        if (getSceneEditor().active)
            getSceneEditor().redraw();
    });
    Hooks.on('updateWall', () => {
        if (getSceneEditor().active)
            getSceneEditor().redraw();
    });
    Hooks.on('deleteWall', () => {
        if (getSceneEditor().active)
            getSceneEditor().redraw();
    });
}
//# sourceMappingURL=register.js.map