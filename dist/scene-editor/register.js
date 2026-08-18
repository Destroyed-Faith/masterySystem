/**
 * Hooks and the GM toggle. The button lives at the top of Foundry's scene
 * control menu — never as a free-floating overlay on the map.
 */
import { getSceneEditor } from './controller.js';
export const SCENE_EDITOR_BUTTON_ID = 'ms-scene-editor-toggle';
function sceneControlsRoot(html) {
    if (html instanceof HTMLElement)
        return html.id === 'scene-controls' ? html : html.querySelector('#scene-controls') ?? html;
    if (html && typeof html.get === 'function') {
        const el = html.get(0);
        if (!el)
            return document.querySelector('#scene-controls');
        return el.id === 'scene-controls' ? el : el.querySelector('#scene-controls') ?? el;
    }
    return document.querySelector('#scene-controls');
}
function removeButton() {
    document.getElementById(SCENE_EDITOR_BUTTON_ID)?.remove();
}
function injectToggle(html) {
    removeButton();
    if (!game.user?.isGM)
        return;
    const root = sceneControlsRoot(html);
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
    const layers = root.querySelector('#scene-layers') ??
        root.querySelector('.scene-control')?.parentElement ??
        root;
    layers.insertBefore(btn, layers.firstChild);
    getSceneEditor().refreshButton();
}
export function initializeSceneEditor() {
    Hooks.on('renderSceneControls', (_app, html) => {
        injectToggle(html);
    });
    Hooks.on('canvasReady', () => {
        const editor = getSceneEditor();
        if (editor.active)
            void editor.reattach();
        else
            editor.teardownCanvas();
        injectToggle();
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