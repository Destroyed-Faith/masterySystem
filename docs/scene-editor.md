# Mastery Scene Editor

GM-only authoring tool for preparing a scene map. Foundry keeps movement, vision and doors. This editor only writes native `WallDocument`s and stores hints / suggestions on the scene.

## Open it

1. Load a scene as Game Master.
2. Open the **Scenes** sidebar on the right and click **EDIT SCENE** next to Create Scene / Create Folder. Players never see the button.
3. **FINISH EDITING** leaves the mode. Confirmed walls stay. Hints and suggestions stay on the scene.

Activating the editor does not start combat, move tokens or create lights.

## Tools

- **Select** — click a wall, drag an endpoint or the whole segment. Shift adds to the selection. Delete / Backspace removes it.
- **Wall** — **click–click chaining**: first click places the start, second click (or drag past a short threshold then release) commits the segment and chains from the end. Enter or double-click ends the chain. Escape drops the unfinished segment. The canvas uses pointer capture so the second point still commits if the pointer leaves the board.
- **Door / Window** — hover a wall, click the centre, then drag width; mouseup always commits. Width is clamped to the host wall length so openings cannot grow past the wall. Or draw a free segment with the same click–click / capture rules if no wall is under the pointer.
- **Hint / Ignore** — draw a line or a box. After a hint you can re-analyse that area.
- **Analyse map / region** — local edge detection only. Suggestions never block movement until accepted.
- Snap: Magnetic (default), Grid, Free. Hold Shift for grid, Alt for free.

Context actions on a selected wall: convert type, open / close / lock a door, delete, Advanced (native Foundry sheet).

### Hover Probe (temporary debug)

Toolbar checkbox **Hover Probe** (off by default). While on, a small HUD lists `document.elementsFromPoint` under the cursor (tag, id, z-index, pointer-events) so overlays that steal hover/clicks can be identified. Top-target changes also log once via `console.debug`. Turn it off when finished; remove the feature after diagnosis if it is no longer needed.

### Export wall lesson JSON

**Graduation-cap** toolbar button downloads `<map-name>.wall-lesson.json` from the current scene walls. It is **not** a full scene import/export — it describes segment lengths, angles, snap residuals, openings on host walls, clustering, and drawer recommendations so algorithms can be tuned against prepared maps.

## Persistence

- Confirmed geometry: `Scene` embedded `Wall` documents.
- Editor data: `flags.mastery-system.sceneEditor` (`schemaVersion: 1`).
- Export / import: `<map-name>.mastery-scene.json` with coordinates normalised 0..1.
- Import default never deletes existing walls. Replace asks first.

## Extending the analyser

`src/scene-editor/analyzer/local-analyzer.ts` implements `Analyzer`. A later vision provider must return the same `AnalyzerOutput` (`suggestions`, `uncertainCount`, `warnings`, in-memory `debug`). Do not store pixel masks on the scene.

## Manual check

1. Create a test scene with a background.
2. Open the editor as GM; a player client must not see the button.
3. Draw walls with click–click, move an endpoint, insert a door and a window (width stays within the host wall).
4. Open / lock the door. Leave the editor. Walk a token — walls block, an open door does not.
5. Re-open the editor. Add a hint, analyse, accept one suggestion.
6. Reload the world. Hints and walls are still there.
7. Export JSON and import it into a duplicate scene (Update, not Replace).
8. Optionally enable Hover Probe and confirm tool buttons (not `.window-content`) are the top hit target; export a wall lesson JSON from a prepared map.

## Next (not in this slice)

Lighting and sound get their own authoring pass. The wall adapter already preserves unknown native fields so those features can land later without a rewrite. Auto-redraw from a wall lesson is out of scope here — JSON first.
