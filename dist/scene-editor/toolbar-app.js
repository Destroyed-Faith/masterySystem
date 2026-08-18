/**
 * Compact GM toolbar for the scene editor. Frameless ApplicationV2, like the
 * combat carousel — CSS places it, Foundry does not own a window chrome.
 */
import { t } from './i18n.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseToolbar = HandlebarsApplicationMixin(ApplicationV2);
const TOOLS = [
    { id: 'select', icon: 'fa-arrow-pointer', labelKey: 'toolSelect', fallback: 'Select' },
    { id: 'wall', icon: 'fa-minus', labelKey: 'toolWall', fallback: 'Wall' },
    { id: 'door', icon: 'fa-door-closed', labelKey: 'toolDoor', fallback: 'Door' },
    { id: 'window', icon: 'fa-window-maximize', labelKey: 'toolWindow', fallback: 'Window' },
    { id: 'hint', icon: 'fa-highlighter', labelKey: 'toolHint', fallback: 'Hint' },
    { id: 'ignore', icon: 'fa-eye-slash', labelKey: 'toolIgnore', fallback: 'Ignore' },
];
export class SceneEditorToolbarApp extends BaseToolbar {
    editor;
    constructor(editor) {
        super({});
        this.editor = editor;
    }
    static DEFAULT_OPTIONS = {
        id: 'mastery-scene-editor-toolbar',
        classes: ['mastery-system', 'scene-editor-toolbar'],
        position: { width: 'auto' },
        window: {
            title: 'Scene Editor',
            frame: false,
            positioned: false,
            resizable: false,
            minimizable: false,
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/scene-editor-toolbar.hbs' },
    };
    refresh() {
        if (this.rendered)
            void this.render({ force: false });
    }
    async _prepareContext() {
        const ed = this.editor;
        const wall = ed.selectedWall();
        const sug = ed.selectedSuggestion();
        return {
            tools: TOOLS.map((tool) => ({
                ...tool,
                label: t(tool.labelKey, tool.fallback),
                active: ed.tool === tool.id,
            })),
            snapModes: ['magnetic', 'grid', 'free'].map((id) => ({
                id,
                label: t(`snap.${id}`, id),
                active: ed.snapMode === id,
            })),
            status: t(`status.${ed.status}`, ed.status),
            statusKey: ed.status,
            canUndo: ed.commands.canUndo,
            canRedo: ed.commands.canRedo,
            analyzing: ed.status === 'analyzing',
            layers: Object.keys(ed.layers).map((id) => ({
                id,
                label: t(`layer.${id}`, id),
                on: ed.layers[id],
            })),
            context: wall
                ? {
                    show: true,
                    isDoor: wall.kind === 'door',
                    isWindow: wall.kind === 'window',
                    isWall: wall.kind === 'wall',
                    kind: wall.kind,
                }
                : { show: false },
            suggestion: sug
                ? {
                    show: true,
                    kind: sug.kind,
                    confidence: Math.round(sug.confidence * 100),
                    origin: sug.origin,
                }
                : { show: false },
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        if (!root)
            return;
        root.querySelectorAll('[data-tool]').forEach((btn) => {
            btn.onclick = () => this.editor.setTool(btn.dataset.tool);
        });
        root.querySelectorAll('[data-snap]').forEach((btn) => {
            btn.onclick = () => this.editor.setSnap(btn.dataset.snap);
        });
        root.querySelectorAll('[data-layer]').forEach((input) => {
            input.onchange = () => {
                const key = input.dataset.layer;
                this.editor.setLayer(key, input.checked);
            };
        });
        this.bind(root, '.js-undo', () => this.editor.undo());
        this.bind(root, '.js-redo', () => this.editor.redo());
        this.bind(root, '.js-analyze', () => this.editor.analyze());
        this.bind(root, '.js-analyze-region', () => this.editor.setTool('region-analyze'));
        this.bind(root, '.js-cancel-analyze', () => this.editor.cancelAnalyze());
        this.bind(root, '.js-save', () => this.editor.saveNow());
        this.bind(root, '.js-export', () => this.editor.exportJson());
        this.bind(root, '.js-import', () => this.editor.importJson());
        this.bind(root, '.js-to-wall', () => this.editor.convertSelection('wall'));
        this.bind(root, '.js-to-door', () => this.editor.convertSelection('door'));
        this.bind(root, '.js-to-window', () => this.editor.convertSelection('window'));
        this.bind(root, '.js-door-open', () => this.editor.setDoorState('open'));
        this.bind(root, '.js-door-close', () => this.editor.setDoorState('closed'));
        this.bind(root, '.js-door-lock', () => this.editor.setDoorState('locked'));
        this.bind(root, '.js-delete', () => this.editor.deleteSelection());
        this.bind(root, '.js-advanced', () => this.editor.openAdvanced());
        this.bind(root, '.js-accept', () => {
            const id = this.editor.selectedSuggestionIds[0];
            if (id)
                void this.editor.acceptSuggestions([id]);
        });
        this.bind(root, '.js-reject', () => {
            const id = this.editor.selectedSuggestionIds[0];
            if (id)
                void this.editor.rejectSuggestions([id]);
        });
        this.bind(root, '.js-accept-all', () => this.editor.acceptAll());
    }
    bind(root, sel, fn) {
        const el = root.querySelector(sel);
        if (el)
            el.onclick = (ev) => {
                ev.preventDefault();
                void fn();
            };
    }
}
//# sourceMappingURL=toolbar-app.js.map