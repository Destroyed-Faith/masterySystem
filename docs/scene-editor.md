# Mastery Scene Editor

GM-only authoring tool for preparing a scene map. Foundry keeps movement, vision and doors. This editor only writes native `WallDocument`s and stores hints / suggestions on the scene.

## Open it

1. Load a scene as Game Master.
2. Click **EDIT SCENE** at the top of the left scene-control menu. Players never see the button.
3. **FINISH EDITING** leaves the mode. Confirmed walls stay. Hints and suggestions stay on the scene.

Activating the editor does not start combat, move tokens or create lights.

## Tools

- **Select** — click a wall, drag an endpoint or the whole segment. Shift adds to the selection. Delete removes it.
- **Wall** — click start, click end, keep clicking to chain. Enter or double-click ends the chain. Escape drops the unfinished segment.
- **Door / Window** — hover a wall and click the centre, then drag width. Or draw a free segment if no wall is under the pointer.
- **Hint / Ignore** — draw a line or a box. After a hint you can re-analyse that area.
- **Analyse map / region** — local edge detection only. Suggestions never block movement until accepted.
- Snap: Magnetic (default), Grid, Free. Hold Shift for grid, Alt for free.

Context actions on a selected wall: convert type, open / close / lock a door, delete, Advanced (native Foundry sheet).

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
3. Draw walls, move an endpoint, insert a door and a window.
4. Open / lock the door. Leave the editor. Walk a token — walls block, an open door does not.
5. Re-open the editor. Add a hint, analyse, accept one suggestion.
6. Reload the world. Hints and walls are still there.
7. Export JSON and import it into a duplicate scene (Update, not Replace).

## Next (not in this slice)

Lighting and sound get their own authoring pass. The wall adapter already preserves unknown native fields so those features can land later without a rewrite.
