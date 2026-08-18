/**
 * One set of canvas listeners for the editor session. Always torn down on
 * deactivate or canvas tear-down so nothing leaks into the next scene.
 */
export class SceneEditorPointer {
    controller;
    bound = false;
    onMove = (ev) => this.controller.onPointerMove(ev);
    onDown = (ev) => {
        void this.controller.onPointerDown(ev);
    };
    onUp = (ev) => {
        void this.controller.onPointerUp(ev);
    };
    onDbl = () => {
        void this.controller.onDoubleClick();
    };
    onKey = (ev) => this.controller.onKey(ev);
    onKeyUp = (ev) => this.controller.onKeyUp(ev);
    constructor(controller) {
        this.controller = controller;
    }
    bind() {
        this.unbind();
        const canvas = globalThis.canvas;
        const el = canvas?.app?.view ?? canvas?.element ?? document.getElementById('board');
        if (!el)
            return;
        el.addEventListener('pointermove', this.onMove);
        el.addEventListener('pointerdown', this.onDown, true);
        window.addEventListener('pointerup', this.onUp);
        el.addEventListener('dblclick', this.onDbl);
        window.addEventListener('keydown', this.onKey);
        window.addEventListener('keyup', this.onKeyUp);
        this.bound = true;
    }
    unbind() {
        if (!this.bound)
            return;
        const canvas = globalThis.canvas;
        const el = canvas?.app?.view ?? canvas?.element ?? document.getElementById('board');
        el?.removeEventListener('pointermove', this.onMove);
        el?.removeEventListener('pointerdown', this.onDown, true);
        window.removeEventListener('pointerup', this.onUp);
        el?.removeEventListener('dblclick', this.onDbl);
        window.removeEventListener('keydown', this.onKey);
        window.removeEventListener('keyup', this.onKeyUp);
        this.bound = false;
    }
}
//# sourceMappingURL=pointer.js.map