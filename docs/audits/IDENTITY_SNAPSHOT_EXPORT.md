# Mastery System – Export Identity Snapshot

Standalone Foundry **Script Macro** to export identity-relevant world data from a Forge (or local) world as JSON. Used for the Combat Resolver ID Refactor offline audit / migration dry-run when no local Foundry install is available.

| | |
|---|---|
| Macro source | `macros/export-identity-snapshot.js` |
| Offline adapter | `scripts/run-identity-snapshot-audit.mjs` |
| Format | `mastery-identity-snapshot` / version `2` (adapter still accepts `1`) |
| Side effects | **None** (read-only; browser download only) |

## How to run in Foundry (Forge)

1. Open the world as **GM**.
2. Create a Macro → type **Script**.
3. Name: `Mastery System – Export Identity Snapshot`.
4. Paste the **entire** contents of `macros/export-identity-snapshot.js`.
5. Save and execute the macro.
6. Confirm the browser download of `mastery-identity-snapshot-<world>-<timestamp>.json`.

If the browser blocks the download, open the F12 console — the full snapshot object is also logged as `[identity-snapshot] snapshot object`.

## What is exported

- World actors: power / artifact items (identity fields), mastery Active Effect flags, combat-related mastery flags.
- Unlinked scene token synthetic actors (token overrides).
- Mastery-system and relevant world Item/Actor compendium documents.
- Meta: system version, core version, world id/title, Forge host hint, exporter user id/name.

## What is never exported

- Passwords, API keys, auth/refresh tokens, credentials, webhooks.
- Ownership / permission maps, join keys, world description fluff.
- Actor biography / notes, portrait paths.
- Full baked `levels[].mechanics` blobs (catalog is local SSoT).

Incomplete / failed reads are flagged with `incomplete: true` and listed under `errors` / `warnings`.

## Offline audit (local repo)

After `npm run build`:

```bash
node scripts/run-identity-snapshot-audit.mjs path/to/mastery-identity-snapshot-….json
```

Optional output directory:

```bash
node scripts/run-identity-snapshot-audit.mjs path/to/snapshot.json --out docs/audits/identity-snapshot-dryrun-myworld
```

Writes (dry-run only):

- `summary.json`
- `preflight-report.json`
- `migration-proposals.json`
- `migration-dry-run.md`
- `actor-summaries.json`
- `README.md`

**Do not apply** proposals to the productive Forge world. Use an isolated world copy first.

## Schema notes for consumers

Actors in the snapshot are already shaped for `preflightActor` / `planActorIdentityMigration`:

- `items[]` with `type`, `system.templateId|rank|…`, `flags['mastery-system']`
- Artifact `system.levelProgression[]` / `progressionPicks[].authoredStages[]` with identity fields
- `effects[]` with `flags['mastery-system'].activeBuff|powerId|powerTemplateId|…`

### formatVersion 2 (Forge Reality Audit X1–X4)

| Field | Change |
|---|---|
| `actors[].system.masteryRank` | Read from `system.mastery.rank` (fallback: legacy `masteryRank` / `mr`) |
| `actors[].system.mastery.rank` | Also exported when present |
| `progressionPicks[]` | Exports `level` / `kind` (authored pick shape); no longer invents `id` / `name` |
| Provenance flags | `nodeId`, `seedVersion`, `evolutionNodeId`, `parentIds` (+ `childIds`, `isRoot`, `echoBound`, …) included when present |
| Incomplete tokens | Missing synthetic actors reported with `error: synthetic-actor-missing`, empty `items`/`effects`, and a clear warning |

The offline adapter accepts **both** `formatVersion` 1 and 2 so previously exported Forge dumps remain auditable.

See `tests/__fixtures__/identity-snapshot-minimal.json` for a minimal valid v1 fixture.
