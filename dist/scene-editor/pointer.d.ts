/**
 * One set of canvas listeners for the editor session. Always torn down on
 * deactivate or canvas tear-down so nothing leaks into the next scene.
 */
import type { SceneEditorController } from './controller.js';
export declare class SceneEditorPointer {
    private readonly controller;
    private bound;
    private onMove;
    private onDown;
    private onUp;
    private onDbl;
    private onKey;
    private onKeyUp;
    constructor(controller: SceneEditorController);
    bind(): void;
    unbind(): void;
}
//# sourceMappingURL=pointer.d.ts.map