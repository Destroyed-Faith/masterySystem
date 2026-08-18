/**
 * Hooks and the large GM button. Players never see any of this.
 */
import { getSceneEditor } from './controller.js';
const BUTTON_ID = 'ms-scene-editor-toggle';
function canEdit() {
    return !!(game.user?.isGM && globalThis.canvas?.scene);
}
function removeButton() {
    document.getElementById(BUTTON_ID)?.remove();
}
function ensureButton() {
    removeButton();
    if (!canEdit())
        return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = BUTTON_ID;
    btn.className = 'ms-scene-editor-toggle';
    document.body.appendChild(btn);
    btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const editor = getSceneEditor();
        if (editor.active)
            await editor.deactivate();
        else
            await editor.activate();
    });
    getSceneEditor().refreshButton();
}
export function initializeSceneEditor() {
    Hooks.on('canvasReady', () => {
        const editor = getSceneEditor();
        if (editor.active)
            void editor.reattach();
        else
            editor.teardownCanvas();
        ensureButton();
    });
    Hooks.on('canvasTearDown', () => {
        getSceneEditor().teardownCanvas();
        removeButton();
    });
    Hooks.once('ready', () => {
        ensureButton();
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