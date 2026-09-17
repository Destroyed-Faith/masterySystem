/**
 * Hooks for the scene editor. EDIT SCENE sidebar button is intentionally
 * disabled for now (it interfered with Create Scene / Create Folder).
 * Re-enable injectToggle when the scene editor returns as a separate pass.
 */

import { getSceneEditor } from './controller.js';

export const SCENE_EDITOR_BUTTON_ID = 'ms-scene-editor-toggle';

/** Scene editor UI entry points are off until the tool is reintroduced cleanly. */
export const SCENE_EDITOR_UI_ENABLED = false;

function removeButton(): void {
  document.getElementById(SCENE_EDITOR_BUTTON_ID)?.remove();
}

export function initializeSceneEditor(): void {
  Hooks.once('ready', () => {
    removeButton();
    const editor = getSceneEditor();
    if (editor.active) void editor.deactivate();
  });

  Hooks.on('canvasReady', () => {
    const editor = getSceneEditor();
    if (!SCENE_EDITOR_UI_ENABLED) {
      editor.teardownCanvas();
      return;
    }
    if (editor.active) void editor.reattach();
    else editor.teardownCanvas();
  });

  Hooks.on('canvasTearDown', () => {
    getSceneEditor().teardownCanvas();
  });

  if (!SCENE_EDITOR_UI_ENABLED) return;

  // Intentionally unreachable while SCENE_EDITOR_UI_ENABLED is false.
  // Kept for the follow-up that restores the editor without sidebar regressions.
}
