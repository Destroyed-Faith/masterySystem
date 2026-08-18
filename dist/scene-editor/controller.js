/**
 * Owns the edit session: tool, selection, drawing, analysis, persistence.
 */
import { createHint } from './analyzer/hints.js';
import { loadSceneImage, localAnalyzer } from './analyzer/local-analyzer.js';
import { CommandStack } from './commands.js';
import { DEFAULT_OPENING_WIDTH, DEFAULT_SNAP_WORLD, clonePoint, distance, distanceToSegment, planOpening, projectPointOnSegment, rectFromPoints, segmentHitsRect, snapMagnetic, translateSegment, } from './geometry.js';
import { t } from './i18n.js';
import { SceneEditorOverlay, hitHandle, screenHandleRadius, worldFromEvent } from './overlay.js';
import { Autosave, applyBackgroundWatch, backgroundFingerprint, fromPortable, parsePortable, readStored, sceneBox, toPortable, writeStored, } from './persistence.js';
import { SceneEditorPointer } from './pointer.js';
import { SceneEditorToolbarApp } from './toolbar-app.js';
import { emptyStored } from './types.js';
import { activeScene, coordPatch, createWalls, deleteWalls, doorStatePatch, readSceneWalls, snapshotWall, typeChangePatch, updateWalls, wallPayload, } from './wall-adapter.js';
export class SceneEditorController {
    overlay = new SceneEditorOverlay();
    commands = new CommandStack();
    pointer = new SceneEditorPointer(this);
    toolbar = null;
    autosave = null;
    tokensInteractive = null;
    abort = null;
    lastDebug = null;
    active = false;
    tool = 'select';
    snapMode = 'magnetic';
    status = 'saved';
    stored = emptyStored('');
    selectedIds = [];
    selectedSuggestionIds = [];
    selectedHintIds = [];
    drawStart = null;
    preview = null;
    snapPoint = null;
    hoverOpening = null;
    dragging = null;
    openingDraft = null;
    shiftHeld = false;
    altHeld = false;
    liveSyncNoted = false;
    get walls() {
        return readSceneWalls(activeScene());
    }
    get layers() {
        return this.stored.ui.layers;
    }
    get confirmedSegments() {
        return this.walls.map((w) => ({ a: w.a, b: w.b }));
    }
    get suggestionSegments() {
        return this.stored.suggestions.filter((s) => !s.rejected).map((s) => ({ a: s.a, b: s.b }));
    }
    effectiveSnap() {
        if (this.altHeld)
            return 'free';
        if (this.shiftHeld)
            return 'grid';
        return this.snapMode;
    }
    async activate() {
        if (!game.user?.isGM)
            return;
        const scene = activeScene();
        if (!scene) {
            ui.notifications?.warn(t('noScene', 'No scene is loaded.'));
            return;
        }
        this.active = true;
        this.stored = applyBackgroundWatch(readStored(scene), scene);
        this.tool = this.stored.ui.lastTool || 'select';
        this.snapMode = this.stored.ui.snapMode || 'magnetic';
        this.status = !backgroundFingerprint(scene).src
            ? 'no-map'
            : this.stored.analysis.backgroundChanged
                ? 'background-changed'
                : this.stored.analysis.stale
                    ? 'stale'
                    : 'saved';
        this.overlay.attach();
        this.pointer.bind();
        this.suppressTokens(true);
        this.autosave = new Autosave((data) => writeStored(activeScene(), data));
        if (!this.toolbar)
            this.toolbar = new SceneEditorToolbarApp(this);
        await this.toolbar.render({ force: true, focus: false });
        this.redraw();
        if (!this.liveSyncNoted && (game.users?.filter?.((u) => u.active && !u.isGM).length ?? 0) > 0) {
            ui.notifications?.info(t('liveSync', 'Wall changes are saved to the scene and sync to connected players.'));
            this.liveSyncNoted = true;
        }
        this.refreshButton();
    }
    async deactivate() {
        if (!this.active)
            return;
        this.drawStart = null;
        this.preview = null;
        this.openingDraft = null;
        this.dragging = null;
        await this.autosave?.flush();
        this.autosave?.cancel();
        this.autosave = null;
        this.abort?.abort();
        this.abort = null;
        this.pointer.unbind();
        this.overlay.detach();
        this.suppressTokens(false);
        this.active = false;
        if (this.toolbar) {
            await this.toolbar.close();
            this.toolbar = null;
        }
        this.refreshButton();
    }
    teardownCanvas() {
        this.pointer.unbind();
        this.overlay.detach();
        this.suppressTokens(false);
        this.abort?.abort();
        this.abort = null;
    }
    async reattach() {
        if (!this.active) {
            this.refreshButton();
            return;
        }
        this.overlay.attach();
        this.pointer.bind();
        this.redraw();
        this.refreshButton();
    }
    refreshButton() {
        const btn = document.getElementById('ms-scene-editor-toggle');
        if (!btn)
            return;
        const on = this.active;
        btn.classList.toggle('is-active', on);
        btn.innerHTML = on
            ? `<i class="fas fa-check"></i> ${t('stop', 'FINISH EDITING')}`
            : `<i class="fas fa-vector-square"></i> ${t('start', 'EDIT SCENE')}`;
        btn.title = on ? t('stopHint', 'Leave the scene editor.') : t('startHint', 'Prepare walls, doors and windows on this map.');
    }
    setTool(tool) {
        this.tool = tool;
        this.drawStart = null;
        this.preview = null;
        this.openingDraft = null;
        this.stored = { ...this.stored, ui: { ...this.stored.ui, lastTool: tool } };
        this.queueSave();
        this.redraw();
        this.toolbar?.refresh();
    }
    setSnap(mode) {
        this.snapMode = mode;
        this.stored = { ...this.stored, ui: { ...this.stored.ui, snapMode: mode } };
        this.queueSave();
        this.toolbar?.refresh();
    }
    setLayer(key, value) {
        this.stored = {
            ...this.stored,
            ui: { ...this.stored.ui, layers: { ...this.stored.ui.layers, [key]: value } },
        };
        this.queueSave();
        this.redraw();
        this.toolbar?.refresh();
    }
    snap(p) {
        const mode = this.effectiveSnap();
        const scale = Number(globalThis.canvas?.stage?.scale?.x) || 1;
        const radius = DEFAULT_SNAP_WORLD / Math.max(0.35, scale);
        if (mode === 'free')
            return { point: p, kind: 'free' };
        if (mode === 'grid') {
            const grid = globalThis.canvas?.grid;
            if (typeof grid?.getSnappedPoint === 'function') {
                const snapped = grid.getSnappedPoint({ x: p.x, y: p.y }, { mode: globalThis.CONST?.GRID_SNAPPING_MODES?.CORNER ?? 0 });
                return { point: { x: Number(snapped.x) || p.x, y: Number(snapped.y) || p.y }, kind: 'grid' };
            }
            return { point: p, kind: 'free' };
        }
        return snapMagnetic(p, this.confirmedSegments, this.suggestionSegments, radius);
    }
    onPointerMove(event) {
        if (!this.active)
            return;
        const raw = worldFromEvent(event);
        if (!raw)
            return;
        const snapped = this.snap(raw);
        this.snapPoint = snapped.kind === 'free' ? null : snapped.point;
        const p = snapped.point;
        if (this.openingDraft) {
            const wall = this.walls.find((w) => w.id === this.openingDraft.wallId);
            if (wall) {
                const width = Math.max(24, distance(this.openingDraft.center, p) * 2);
                this.openingDraft.width = width;
                this.hoverOpening = planOpening({ a: wall.a, b: wall.b }, this.openingDraft.center, width).opening;
            }
            this.redraw();
            return;
        }
        if (this.dragging) {
            this.applyDrag(p);
            this.redraw();
            return;
        }
        if (this.drawStart) {
            this.preview = { a: this.drawStart, b: p };
            this.redraw();
            return;
        }
        if (this.tool === 'door' || this.tool === 'window') {
            this.hoverOpening = this.openingPreview(p, DEFAULT_OPENING_WIDTH);
        }
        else {
            this.hoverOpening = null;
        }
        this.redraw();
    }
    async onPointerDown(event) {
        if (!this.active || event.button !== 0)
            return;
        const target = event.target;
        if (target?.closest?.('#ms-scene-editor-toggle, #mastery-scene-editor-toolbar, .application'))
            return;
        const raw = worldFromEvent(event);
        if (!raw)
            return;
        const p = this.snap(raw).point;
        event.preventDefault();
        event.stopPropagation();
        if (this.tool === 'select') {
            this.beginSelect(p, event.shiftKey);
            return;
        }
        if (this.tool === 'hint' || this.tool === 'ignore') {
            this.drawStart = p;
            return;
        }
        if (this.tool === 'region-analyze') {
            this.drawStart = p;
            return;
        }
        if (this.tool === 'door' || this.tool === 'window') {
            const wall = this.nearestWall(p, 18);
            if (wall && wall.kind === 'wall') {
                this.openingDraft = { wallId: wall.id, center: projectPointOnSegment(p, wall).point, width: DEFAULT_OPENING_WIDTH, kind: this.tool };
                this.hoverOpening = planOpening({ a: wall.a, b: wall.b }, this.openingDraft.center, this.openingDraft.width).opening;
                this.redraw();
                return;
            }
            this.drawStart = p;
            return;
        }
        this.drawStart = p;
    }
    async onPointerUp(event) {
        if (!this.active)
            return;
        const raw = worldFromEvent(event);
        const p = raw ? this.snap(raw).point : null;
        if (this.openingDraft && p) {
            const draft = this.openingDraft;
            this.openingDraft = null;
            await this.commitOpening(draft.wallId, draft.center, draft.width, draft.kind);
            return;
        }
        if (this.dragging) {
            await this.finishDrag();
            return;
        }
        if (!this.drawStart || !p)
            return;
        if (this.tool === 'hint' || this.tool === 'ignore') {
            const kind = this.tool === 'ignore' ? 'ignore' : (await this.askHintKind()) ?? 'wall';
            await this.addHint(kind, this.drawStart, p);
            this.drawStart = null;
            this.preview = null;
            return;
        }
        if (this.tool === 'region-analyze') {
            const region = rectFromPoints(this.drawStart, p);
            this.drawStart = null;
            this.preview = null;
            await this.analyze({ region });
            return;
        }
        if (distance(this.drawStart, p) < 4) {
            this.drawStart = p;
            return;
        }
        const kind = this.tool === 'door' ? 'door' : this.tool === 'window' ? 'window' : 'wall';
        await this.createSegment(this.drawStart, p, kind);
        this.drawStart = clonePoint(p);
        this.preview = null;
        this.redraw();
    }
    async onDoubleClick() {
        this.finishChain();
    }
    onKey(event) {
        if (!this.active)
            return;
        this.shiftHeld = event.shiftKey;
        this.altHeld = event.altKey;
        if (event.key === 'Escape') {
            this.drawStart = null;
            this.preview = null;
            this.openingDraft = null;
            this.dragging = null;
            this.redraw();
            event.preventDefault();
        }
        if (event.key === 'Enter') {
            this.finishChain();
            event.preventDefault();
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
            void this.deleteSelection();
            event.preventDefault();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            void (event.shiftKey ? this.redo() : this.undo());
            event.preventDefault();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
            void this.redo();
            event.preventDefault();
        }
    }
    onKeyUp(event) {
        this.shiftHeld = event.shiftKey;
        this.altHeld = event.altKey;
    }
    finishChain() {
        this.drawStart = null;
        this.preview = null;
        this.redraw();
    }
    beginSelect(p, additive) {
        const r = screenHandleRadius();
        for (const wall of this.walls) {
            const handle = hitHandle(p, wall.a, wall.b, r);
            if (handle) {
                this.selectedIds = [wall.id];
                this.dragging = { kind: 'endpoint', id: wall.id, which: handle, origin: p, start: { a: wall.a, b: wall.b } };
                this.redraw();
                return;
            }
        }
        const wall = this.nearestWall(p, 14);
        if (wall) {
            this.selectedIds = additive && !this.selectedIds.includes(wall.id) ? [...this.selectedIds, wall.id] : [wall.id];
            this.selectedSuggestionIds = [];
            this.selectedHintIds = [];
            this.dragging = { kind: 'body', id: wall.id, origin: p, start: { a: wall.a, b: wall.b } };
            this.redraw();
            this.toolbar?.refresh();
            return;
        }
        const sug = this.nearestSuggestion(p, 14);
        if (sug) {
            this.selectedSuggestionIds = [sug.id];
            this.selectedIds = [];
            this.selectedHintIds = [];
            this.redraw();
            this.toolbar?.refresh();
            return;
        }
        const hint = this.nearestHint(p, 16);
        if (hint) {
            this.selectedHintIds = [hint.id];
            this.selectedIds = [];
            this.selectedSuggestionIds = [];
            this.dragging = { kind: 'hint', id: hint.id, origin: p, start: hint };
            this.redraw();
            this.toolbar?.refresh();
            return;
        }
        if (!additive) {
            this.selectedIds = [];
            this.selectedSuggestionIds = [];
            this.selectedHintIds = [];
        }
        this.redraw();
        this.toolbar?.refresh();
    }
    applyDrag(p) {
        const drag = this.dragging;
        if (!drag)
            return;
        if (drag.kind === 'hint') {
            const hint = this.stored.hints.find((h) => h.id === drag.id);
            if (!hint)
                return;
            const dx = p.x - drag.origin.x;
            const dy = p.y - drag.origin.y;
            const start = drag.start;
            hint.a = { x: start.a.x + dx, y: start.a.y + dy };
            hint.b = { x: start.b.x + dx, y: start.b.y + dy };
            return;
        }
        const start = drag.start;
        const next = drag.kind === 'endpoint' && drag.which
            ? drag.which === 'a'
                ? { a: p, b: start.b }
                : { a: start.a, b: p }
            : translateSegment(start, p.x - drag.origin.x, p.y - drag.origin.y);
        const wall = this.walls.find((w) => w.id === drag.id);
        if (wall) {
            wall.a = next.a;
            wall.b = next.b;
        }
    }
    async finishDrag() {
        const drag = this.dragging;
        this.dragging = null;
        if (!drag)
            return;
        if (drag.kind === 'hint') {
            this.queueSave();
            this.redraw();
            return;
        }
        const wall = this.walls.find((w) => w.id === drag.id);
        if (!wall)
            return;
        const scene = activeScene();
        const before = { a: drag.start.a, b: drag.start.b };
        const after = { a: wall.a, b: wall.b };
        await this.commands.run({
            label: t('cmd.move', 'Move wall'),
            do: async () => {
                await updateWalls(scene, [{ _id: drag.id, ...coordPatch(after.a, after.b) }]);
            },
            undo: async () => {
                await updateWalls(scene, [{ _id: drag.id, ...coordPatch(before.a, before.b) }]);
            },
        });
        this.markDirtyThenSaved();
        this.redraw();
    }
    async createSegment(a, b, kind) {
        const scene = activeScene();
        if (!scene)
            return;
        const payload = wallPayload(a, b, kind, { origin: 'manual' });
        let createdId = '';
        await this.commands.run({
            label: t('cmd.create', 'Create {kind}', { kind }),
            do: async () => {
                const docs = await createWalls(scene, [payload]);
                createdId = String(docs[0]?.id ?? '');
            },
            undo: async () => {
                if (createdId)
                    await deleteWalls(scene, [createdId]);
            },
        });
        this.markDirtyThenSaved();
        this.redraw();
        this.toolbar?.refresh();
    }
    async commitOpening(wallId, center, width, kind) {
        const scene = activeScene();
        const wallDoc = scene?.walls?.get?.(wallId);
        const wall = this.walls.find((w) => w.id === wallId);
        if (!scene || !wall || !wallDoc)
            return;
        const plan = planOpening({ a: wall.a, b: wall.b }, center, width);
        const snap = snapshotWall(wallDoc);
        const leftovers = plan.leftovers.map((seg) => wallPayload(seg.a, seg.b, 'wall', { origin: 'manual' }));
        const opening = wallPayload(plan.opening.a, plan.opening.b, kind, { origin: 'manual' });
        let created = [];
        await this.commands.run({
            label: kind === 'door' ? t('cmd.door', 'Insert door') : t('cmd.window', 'Insert window'),
            do: async () => {
                await deleteWalls(scene, [wallId]);
                const docs = await createWalls(scene, [...leftovers, opening]);
                created = docs.map((d) => String(d.id));
            },
            undo: async () => {
                if (created.length)
                    await deleteWalls(scene, created);
                await createWalls(scene, [snap]);
            },
        });
        this.hoverOpening = null;
        this.markDirtyThenSaved();
        this.redraw();
    }
    async convertSelection(kind) {
        const scene = activeScene();
        if (!scene || !this.selectedIds.length)
            return;
        const before = this.selectedIds.map((id) => {
            const doc = scene.walls?.get?.(id);
            return { id, snap: doc ? snapshotWall(doc) : null };
        });
        await this.commands.run({
            label: t('cmd.convert', 'Change type'),
            do: async () => {
                await updateWalls(scene, this.selectedIds.map((id) => ({ _id: id, ...typeChangePatch(kind) })));
            },
            undo: async () => {
                const restores = before.filter((b) => b.snap).map((b) => ({ _id: b.id, ...b.snap }));
                if (restores.length)
                    await updateWalls(scene, restores);
            },
        });
        this.markDirtyThenSaved();
        this.redraw();
    }
    async setDoorState(state) {
        const scene = activeScene();
        const doors = this.walls.filter((w) => this.selectedIds.includes(w.id) && w.kind === 'door');
        if (!scene || !doors.length)
            return;
        const before = doors.map((d) => ({ id: d.id, state: d.doorState }));
        await this.commands.run({
            label: t('cmd.doorState', 'Door state'),
            do: async () => {
                await updateWalls(scene, doors.map((d) => ({ _id: d.id, ...doorStatePatch(state) })));
            },
            undo: async () => {
                await updateWalls(scene, before.map((d) => ({ _id: d.id, ...doorStatePatch(d.state || 'closed') })));
            },
        });
        this.markDirtyThenSaved();
        this.redraw();
    }
    async deleteSelection() {
        const scene = activeScene();
        if (this.selectedHintIds.length) {
            const removed = this.stored.hints.filter((h) => this.selectedHintIds.includes(h.id));
            const kept = this.stored.hints.filter((h) => !this.selectedHintIds.includes(h.id));
            this.stored = { ...this.stored, hints: kept };
            this.selectedHintIds = [];
            this.queueSave();
            this.redraw();
            void removed;
            return;
        }
        if (this.selectedSuggestionIds.length) {
            await this.rejectSuggestions(this.selectedSuggestionIds);
            return;
        }
        if (!scene || !this.selectedIds.length)
            return;
        const snaps = this.selectedIds
            .map((id) => scene.walls?.get?.(id))
            .filter(Boolean)
            .map((doc) => snapshotWall(doc));
        const ids = [...this.selectedIds];
        await this.commands.run({
            label: t('cmd.delete', 'Delete'),
            do: async () => {
                await deleteWalls(scene, ids);
            },
            undo: async () => {
                await createWalls(scene, snaps);
            },
        });
        this.selectedIds = [];
        this.markDirtyThenSaved();
        this.redraw();
        this.toolbar?.refresh();
    }
    async addHint(kind, a, b) {
        const hint = createHint(kind, a, b);
        const next = [...this.stored.hints, hint];
        await this.commands.run({
            label: t('cmd.hint', 'Add hint'),
            do: async () => {
                this.stored = { ...this.stored, hints: next };
            },
            undo: async () => {
                this.stored = { ...this.stored, hints: this.stored.hints.filter((h) => h.id !== hint.id) };
            },
        });
        this.queueSave();
        this.redraw();
        this.toolbar?.refresh();
        const region = kind === 'ignore' ? rectFromPoints(a, b) : undefined;
        const choice = await this.askReanalyze(region);
        if (choice === 'region' && region)
            await this.analyze({ region });
        if (choice === 'all')
            await this.analyze();
    }
    async analyze(opts = {}) {
        const scene = activeScene();
        const src = backgroundFingerprint(scene).src;
        if (!src) {
            ui.notifications?.warn(t('noMap', 'This scene has no background to analyse.'));
            this.status = 'no-map';
            this.toolbar?.refresh();
            return;
        }
        this.abort?.abort();
        this.abort = new AbortController();
        this.status = 'analyzing';
        this.toolbar?.refresh();
        try {
            const image = await loadSceneImage(src);
            const box = sceneBox(scene);
            const output = await localAnalyzer.analyze({
                image,
                imageWidth: image.naturalWidth || image.width,
                imageHeight: image.naturalHeight || image.height,
                sceneOrigin: box.origin,
                sceneSize: box.size,
                region: opts.region,
                confirmed: this.confirmedSegments,
                hints: this.stored.hints,
                maxResolution: this.stored.analysis.params.maxResolution,
                minSegmentLength: this.stored.analysis.params.minSegmentLength,
            }, this.abort.signal);
            this.lastDebug = output.debug;
            const rejected = new Set(this.stored.rejected);
            const incoming = output.suggestions.filter((s) => !this.matchesRejected(s, rejected));
            this.stored = {
                ...this.stored,
                suggestions: opts.region
                    ? [
                        ...this.stored.suggestions.filter((s) => !segmentHitsRect({ a: s.a, b: s.b }, opts.region)),
                        ...incoming,
                    ]
                    : incoming,
                analysis: {
                    ...this.stored.analysis,
                    lastRun: Date.now(),
                    analyzer: output.analyzer,
                    analyzerVersion: output.analyzerVersion,
                    stale: false,
                    backgroundChanged: false,
                },
            };
            this.status = 'analyzed';
            this.queueSave();
            ui.notifications?.info(t('analyzeDone', '{walls} wall chains, {doors} doors, {windows} windows, {uncertain} uncertain.', {
                walls: incoming.filter((s) => s.kind === 'wall').length,
                doors: incoming.filter((s) => s.kind === 'door').length,
                windows: incoming.filter((s) => s.kind === 'window').length,
                uncertain: output.uncertainCount,
            }));
        }
        catch (err) {
            if (err?.name === 'AbortError')
                return;
            console.warn('Mastery System | Scene analysis failed', err);
            ui.notifications?.error(t('analyzeFail', 'The map could not be analysed. You can still draw walls by hand.'));
        }
        this.redraw();
        this.toolbar?.refresh();
    }
    cancelAnalyze() {
        this.abort?.abort();
        this.abort = null;
        if (this.status === 'analyzing')
            this.status = 'saved';
        this.toolbar?.refresh();
    }
    async acceptSuggestions(ids) {
        const scene = activeScene();
        const list = this.stored.suggestions.filter((s) => ids.includes(s.id) && !s.rejected);
        if (!scene || !list.length)
            return;
        const payloads = list.map((s) => wallPayload(s.a, s.b, s.kind, { origin: s.origin === 'hint-assisted' ? 'hint-assisted' : 'analysis', suggestionId: s.id }));
        let created = [];
        const prev = this.stored.suggestions;
        await this.commands.run({
            label: t('cmd.accept', 'Accept suggestions'),
            do: async () => {
                const docs = await createWalls(scene, payloads);
                created = docs.map((d) => String(d.id));
                const accepted = { ...this.stored.accepted };
                list.forEach((s, i) => {
                    if (created[i])
                        accepted[s.id] = created[i];
                });
                this.stored = {
                    ...this.stored,
                    suggestions: this.stored.suggestions.filter((s) => !ids.includes(s.id)),
                    accepted,
                };
            },
            undo: async () => {
                if (created.length)
                    await deleteWalls(scene, created);
                this.stored = { ...this.stored, suggestions: prev };
            },
        });
        this.selectedSuggestionIds = [];
        this.markDirtyThenSaved();
        this.queueSave();
        this.redraw();
    }
    async rejectSuggestions(ids) {
        const prev = this.stored.suggestions;
        const rejected = [...this.stored.rejected, ...ids];
        this.stored = {
            ...this.stored,
            suggestions: this.stored.suggestions.map((s) => (ids.includes(s.id) ? { ...s, rejected: true } : s)),
            rejected,
        };
        this.selectedSuggestionIds = [];
        this.queueSave();
        this.redraw();
        void prev;
    }
    async acceptAll() {
        const ok = await this.confirmDanger(t('acceptAllTitle', 'Accept every suggestion?'), t('acceptAllBody', 'All visible suggestions become native Foundry walls.'));
        if (!ok)
            return;
        await this.acceptSuggestions(this.stored.suggestions.filter((s) => !s.rejected).map((s) => s.id));
    }
    async saveNow() {
        const scene = activeScene();
        if (!scene)
            return;
        this.status = 'saving';
        this.toolbar?.refresh();
        await writeStored(scene, this.stored);
        this.status = 'saved';
        this.toolbar?.refresh();
    }
    async exportJson() {
        const scene = activeScene();
        if (!scene)
            return;
        const box = sceneBox(scene);
        const doc = toPortable(this.stored, String(scene.name ?? 'scene'), this.walls.map((w) => ({
            id: w.id,
            kind: w.kind,
            doorState: w.doorState,
            secret: w.secret,
            a: w.a,
            b: w.b,
        })), box.origin, box.size);
        const name = `${String(scene.name ?? 'scene').replace(/[^\w\-]+/g, '_')}.mastery-scene.json`;
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    async importJson() {
        const scene = activeScene();
        if (!scene)
            return;
        const file = await this.pickJsonFile();
        if (!file)
            return;
        let parsed;
        try {
            parsed = JSON.parse(await file.text());
        }
        catch {
            ui.notifications?.error(t('importBad', 'That file is not valid JSON.'));
            return;
        }
        const portable = parsePortable(parsed);
        if (!portable) {
            ui.notifications?.error(t('importBad', 'That file is not a Mastery scene export.'));
            return;
        }
        const mode = await this.askImportMode(portable);
        if (!mode)
            return;
        const box = sceneBox(scene);
        const incoming = fromPortable(portable, box.origin, box.size);
        if (mode === 'replace') {
            const ok = await this.confirmDanger(t('replaceTitle', 'Replace scene geometry?'), t('replaceBody', 'This deletes the current walls and writes the import in their place.'));
            if (!ok)
                return;
            const ids = this.walls.map((w) => w.id);
            if (ids.length)
                await deleteWalls(scene, ids);
            if (incoming.geometry.length) {
                await createWalls(scene, incoming.geometry.map((g) => wallPayload(g.a, g.b, g.kind, { origin: 'import', doorState: g.doorState })));
            }
        }
        else if (mode === 'geometry') {
            if (incoming.geometry.length) {
                await createWalls(scene, incoming.geometry.map((g) => wallPayload(g.a, g.b, g.kind, { origin: 'import', doorState: g.doorState })));
            }
        }
        this.stored = {
            ...this.stored,
            hints: incoming.hints,
            suggestions: incoming.suggestions,
            rejected: incoming.rejected,
        };
        this.queueSave();
        this.redraw();
        ui.notifications?.info(t('importDone', 'Import applied.'));
    }
    openAdvanced() {
        const id = this.selectedIds[0];
        const scene = activeScene();
        const wall = scene?.walls?.get?.(id);
        wall?.sheet?.render?.(true);
    }
    async undo() {
        await this.commands.undo();
        this.redraw();
        this.toolbar?.refresh();
    }
    async redo() {
        await this.commands.redo();
        this.redraw();
        this.toolbar?.refresh();
    }
    redraw() {
        if (!this.active)
            return;
        this.overlay.draw({
            walls: this.walls,
            suggestions: this.stored.suggestions,
            hints: this.stored.hints,
            selectedIds: this.selectedIds,
            selectedSuggestionIds: this.selectedSuggestionIds,
            selectedHintIds: this.selectedHintIds,
            preview: this.preview,
            snap: this.snapPoint,
            hoverOpening: this.hoverOpening,
            layers: this.layers,
            debug: this.lastDebug,
            handleRadius: screenHandleRadius(),
        });
        this.toolbar?.refresh();
    }
    selectedWall() {
        return this.walls.find((w) => w.id === this.selectedIds[0]) ?? null;
    }
    selectedSuggestion() {
        return this.stored.suggestions.find((s) => s.id === this.selectedSuggestionIds[0]) ?? null;
    }
    nearestWall(p, radius) {
        let best = null;
        let bestD = radius;
        for (const wall of this.walls) {
            const d = distanceToSegment(p, wall);
            if (d <= bestD) {
                bestD = d;
                best = wall;
            }
        }
        return best;
    }
    nearestSuggestion(p, radius) {
        let best = null;
        let bestD = radius;
        for (const s of this.stored.suggestions) {
            if (s.rejected)
                continue;
            const d = distanceToSegment(p, s);
            if (d <= bestD) {
                bestD = d;
                best = s;
            }
        }
        return best;
    }
    nearestHint(p, radius) {
        let best = null;
        let bestD = radius;
        for (const h of this.stored.hints) {
            if (h.kind === 'ignore') {
                if (segmentHitsRect({ a: p, b: p }, rectFromPoints(h.a, h.b)))
                    return h;
                continue;
            }
            const d = distanceToSegment(p, h);
            if (d <= bestD) {
                bestD = d;
                best = h;
            }
        }
        return best;
    }
    openingPreview(p, width) {
        const wall = this.nearestWall(p, 18);
        if (!wall || wall.kind !== 'wall')
            return null;
        return planOpening({ a: wall.a, b: wall.b }, p, width).opening;
    }
    matchesRejected(s, rejected) {
        if (rejected.has(s.id))
            return true;
        return this.stored.suggestions.some((old) => old.rejected &&
            old.kind === s.kind &&
            distance(old.a, s.a) < 6 &&
            distance(old.b, s.b) < 6);
    }
    queueSave() {
        this.status = this.status === 'analyzing' ? 'analyzing' : 'dirty';
        this.autosave?.queue(this.stored);
        this.toolbar?.refresh();
    }
    markDirtyThenSaved() {
        this.status = 'dirty';
        this.toolbar?.refresh();
        window.setTimeout(() => {
            if (this.status === 'dirty') {
                this.status = 'saved';
                this.toolbar?.refresh();
            }
        }, 500);
    }
    suppressTokens(on) {
        const tokens = globalThis.canvas?.tokens;
        if (!tokens)
            return;
        if (on) {
            this.tokensInteractive = tokens.interactiveChildren;
            tokens.interactiveChildren = false;
        }
        else if (this.tokensInteractive !== null) {
            tokens.interactiveChildren = this.tokensInteractive;
            this.tokensInteractive = null;
        }
    }
    async askHintKind() {
        const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
        if (typeof DialogV2?.wait !== 'function')
            return 'wall';
        const result = await DialogV2.wait({
            window: { title: t('hintTitle', 'What is this hint?') },
            content: `<p>${t('hintBody', 'Tell the analyser what this mark means.')}</p>`,
            buttons: [
                { action: 'wall', label: t('toolWall', 'Wall'), default: true },
                { action: 'door', label: t('toolDoor', 'Door') },
                { action: 'window', label: t('toolWindow', 'Window') },
                { action: 'ignore', label: t('toolIgnore', 'Ignore') },
            ],
            rejectClose: false,
        });
        return result === 'door' || result === 'window' || result === 'ignore' || result === 'wall' ? result : 'wall';
    }
    async askReanalyze(region) {
        const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
        if (typeof DialogV2?.wait !== 'function')
            return region ? 'region' : 'none';
        const result = await DialogV2.wait({
            window: { title: t('reanalyzeTitle', 'Analyse again?') },
            content: `<p>${t('reanalyzeBody', 'A hint was added. Analyse the marked area, the whole map, or wait.')}</p>`,
            buttons: [
                { action: 'region', label: t('reanalyzeRegion', 'This area'), default: true },
                { action: 'all', label: t('reanalyzeAll', 'Whole map') },
                { action: 'none', label: t('reanalyzeNone', 'Not now') },
            ],
            rejectClose: false,
        });
        return result === 'all' || result === 'region' || result === 'none' ? result : 'none';
    }
    async askImportMode(doc) {
        const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
        const summary = t('importPreview', '{walls} walls, {hints} hints in this file.', {
            walls: Array.isArray(doc.geometry) ? doc.geometry.length : 0,
            hints: Array.isArray(doc.hints) ? doc.hints.length : 0,
        });
        if (typeof DialogV2?.wait !== 'function')
            return 'update';
        const result = await DialogV2.wait({
            window: { title: t('importTitle', 'Import scene JSON') },
            content: `<p>${summary}</p><p>${t('importChoose', 'Existing walls are kept unless you choose Replace.')}</p>`,
            buttons: [
                { action: 'update', label: t('importUpdate', 'Update editor data'), default: true },
                { action: 'geometry', label: t('importAdd', 'Add geometry') },
                { action: 'replace', label: t('importReplace', 'Replace all walls') },
            ],
            rejectClose: false,
        });
        return result === 'geometry' || result === 'update' || result === 'replace' ? result : null;
    }
    async confirmDanger(title, content) {
        const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
        if (typeof DialogV2?.confirm !== 'function')
            return true;
        return !!(await DialogV2.confirm({ window: { title }, content, modal: true }));
    }
    pickJsonFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.onchange = () => resolve(input.files?.[0] ?? null);
            input.click();
        });
    }
}
let instance = null;
export function getSceneEditor() {
    if (!instance)
        instance = new SceneEditorController();
    return instance;
}
//# sourceMappingURL=controller.js.map