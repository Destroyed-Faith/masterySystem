# K9 — Canonical Echo Artifact Compendium Rebuild (2026-11-05)

Scope: rebuild `mastery-system.echo-artifacts` from the canonical builder so that every pack row carries
its structured identity (`powerTemplateId` / `artifactFunctionId` / `rank` / spell + limited metadata) and
the pack no longer depends on K2 read-time enrichment (P1). No gameplay/balance change, no world/actor/flag
writes, no Forge deployment, K8 compatibility bridges untouched.

Machine-readable diff: `docs/audits/K9_PACK_REBUILD_DIFF.json` (regenerate with `npm run k9:audit`).

## 1. Verdict

**K9 complete — strict audit PASS, 0 blockers in the pack itself.** Production activation items are listed in §8.

## 2. Root cause of the stale pack

`src/packs/echo-artifacts/*.json` had last been generated at **0.9.824**, before the builder started emitting
structured identity on progression rows. Old pack rows: `powerTemplateId` 316 / 606, `artifactFunctionId` 0,
`rank` 0. Everything that routed correctly on Forge did so through `enrichArtifactRowIdentity` (K2 read-time
enrichment) and K8's missing-ID text bridges — the P1 finding.

## 3. Changes (separately reviewable)

| File | Change |
|---|---|
| `scripts/lib/echo-pack-ids.mjs` (new) | Single source for deterministic pack ids: FNV-1a `stableId`, `echoPackItemId(nodeId)`, `echoPackFolderId(key)`, `echoPackRootFolderId()`. |
| `scripts/build-echo-artifact-pack.mjs` | Uses the shared id helpers (behaviour identical; ids verified stable). |
| `scripts/k9-pack-identity-audit.mjs` (new) | Before/after audit + diff (see §5). `--old-ref HEAD` / `--old <dir>`, `--verify-leveldb`, `--strict`. |
| `src/utils/echo-artifacts.ts` | Sentinel Frame authored rows *Single Restoration I/II/III*: `rank: 4 / 10 / 16` persisted from the printed PL (previously only in the `special` text; the audit flagged 10 `rank-missing` rows on a template row). No effect/cost/PL text changed. |
| `src/packs/echo-artifacts/*.json` | Regenerated: 204 / 243 docs changed, 0 added, 0 removed. |
| `packs/echo-artifacts` (LevelDB) | Recompiled from the JSON sources (243 docs, byte-verified by extract-compare). |
| `tests/k9-pack-identity.test.ts` (new) | 17 regression tests (§6). |
| `package.json` | `k9:audit` script. |

Not changed: `ECHO_ARTIFACT_SEED_VERSION` (stays **60**), `echoBound` semantics (W5), Draconic Roar (W2),
Titan Scars / Lor-Keth world item (W1), any K8 bridge, any rulebook.

## 4. Pack identity — exact counts (old → new)

| Metric | Old (HEAD / 0.9.829) | New (K9) |
|---|---|---|
| Documents (items / folders) | 220 / 23 | 220 / 23 |
| Document ids added / removed / renamed | — | 0 / 0 / 0 |
| Builder parity (`buildAllEchoArtifactTrees()` vs pack JSON) | — | identical, drift 0 |
| Progression rows (visible windows) | 606 | 606 |
| rows with `powerTemplateId` | 316 | **335** |
| rows with `artifactFunctionId` | 0 | **51** |
| rows with `rank` | 0 | **335** (every template row) |
| rows `isSpell` / `limited` | — | 51 / 10 |
| rows resolved by `resolvePowerIdentity` | — | **376** |
| rows without identity (legitimately) | — | 230 = Stone Power Support 181, Stone Pool 23, Passive 18, Stone Refresh 8 |
| rows unresolved / needing a rules decision | — | **0** |
| `artifactFunctionId` distribution | — | artifact-awakening 22, dragon-breath 10, titan-growth 10, life-absorption 9 |
| `progressionPicks[].authoredStages` with identity | — | 120 / 210 (remaining 90 are stone/passive stages, list empty) |
| K1/K2/K3 contract violations | — | 0 |
| rank-on-template issues | — | 0 |
| P1: rows where `enrichArtifactRowIdentity` would still change anything | (all K2 rows) | **0** (enrichment is a no-op on the new pack) |
| `echoBound` type | string (echoKey) ×220 | string ×220 (unchanged, W5) |
| `seedVersion` | 60 ×220 | 60 ×220 |

## 5. Before/after diff classification

595 leaf changes, all classified `expected-identity-addition`; **0 identity value changes, 0 unexpected changes**.

| Path | Count |
|---|---|
| `system.levelProgression[].rank` | 335 |
| `system.levelProgression[].artifactFunctionId` | 51 |
| `system.levelProgression[].powerTemplateId` | 19 — all Ringchain of Kept Names (Remembered Hands ×7 `active-ranged-health-level-heal`, Hearth Circle ×6 `active-melee-aoe-restoration`, Burden Lifted ×6 `active-ranged-single-cleanse`); the old pack predates the catalog ids on these `extraStoneFunctions` rows |
| `system.progressionPicks[].artifactFunctionId` | 10 |
| `system.progressionPicks[].authoredStages[].artifactFunctionId` | 60 |
| `system.progressionPicks[].authoredStages[].powerTemplateId` | 60 |
| `system.progressionPicks[].authoredStages[].rank` | 60 |

Mechanics, effect text, ranges, durations, costs, Echo associations, restrictions, affinities, equip slots,
folder structure, names and ids are byte-identical outside these paths (the audit classifies *any* other leaf
change as unexpected and fails `--strict`).

## 6. Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| Full Vitest | PASS — **368 files / 3876 tests** |
| `npm run build` (0.9.829 + K9 working tree) | PASS |
| `node scripts/k9-pack-identity-audit.mjs --verify-leveldb --strict` | **PASS** (LevelDB 243 docs, 0 missing / extra / mismatched) |
| `npm run audit:catalog` | 233 correct / 3 corrected / 0 missing / 0 obsolete / 0 requires-rule-decision |
| Identity matrix / preflight / golden baseline / shadow / snapshot / contract / migration / R-17 / K8 c,d,e / artifact-row-identity | PASS (14 files / 126 tests) |
| Text-matching guard (`no-text-mechanic-matching.test.ts`) | PASS (allowlist unchanged by K9) |
| Echo artifact builder / equip / catalog suites | PASS (3 files / 49 tests) |
| `tests/k9-pack-identity.test.ts` | PASS 17/17 |

K9 regression tests cover: pack structure and id derivation, seedVersion / nodeId, byte parity with the
builder, identity completeness (376 resolved / 0 unresolved / only stone, support, passive rows without
identity), rank on every template row, K2/K3 contract counts, L10 awakening row, authoredStages identity,
P1 enrichment no-op, W1 (Titan Scars rows = `titan-growth`, no templateId), W2 (Draconic Roar =
`ab-armor-aura` 4/10/16, untouched), W5 (`echoBound` string == echoKey), and K8 routing consuming pack
identity directly: Dragon Head L10 → Damage/Ruin breath with `dragon-breath` + `active-melee-weapon-aoe`
+ rank 16 + mode; Roar → `active-buff` segment; Titan L1 → `titan-growth` transformation option; Ringchain
heal / cleanse options by templateId with rank 16 / 10; every L10 radial + reaction option with identity
resolves without name bridges.

## 7. Known findings — handling

| Id | Handling in K9 |
|---|---|
| **N1** world `seedVersion` 57 vs pack/builder 60 | Not touched. Note: seed 60 has shipped since **0.9.824**; `seedArtifactLibrary()` (GM `ready`) already treats 57 as stale and refreshes world *library* trees in place (and pushes to embedded actor copies). K9 does **not** bump the seed, so it neither arms nor changes that pre-existing behaviour. Whether that refresh should run on the live world is a GM decision (§8). |
| **N2** Elorian Stride legacy node ids in world | Not rewritten. Pack nodeIds are canonical `<key>-l<level>`. |
| **W1** Titan Growth holdout | Pack rows carry `artifactFunctionId: titan-growth` (K2, no templateId). Lor-Keth world item untouched. K8 holdout code untouched. |
| **W2** Draconic Roar | Rows remain `ab-armor-aura` rank 4/10/16 exactly as authored — asserted by test. |
| **W5** `echoBound` boolean vs string | Builder emits the echoKey string for all 220 echo-bound docs; general (bound) trees omit it. Impact: all runtime readers use truthiness except `src/module.ts` (`=== true`) which therefore never matches pack/builder items. Semantics **not** redefined in K9 — needs a one-line decision (treat `=== true` as truthiness or make the builder emit `true`). |

## 8. Observations (pre-existing, reported — not changed)

1. **Ringchain of Kept Names visible window.** The builder's 3-slot `visibleAbilityRows` drops *Burden Lifted*
   (cleanse, slot 2) from level 8 on because *Hearth Circle II* (L8) wins the same slot; at L10 the artifact
   shows Remembered Hands II / Hearth Circle II / Kept from Sight III / Awakening and no cleanse. This is
   authored-table/slot layout behaviour that predates K9 and is identical in old and new pack. If the Halfling
   is meant to keep Cleanse at L8–10, that is a catalog/rules decision.
2. **K8 W1 radial classification — CORRECTED (R1).** `titan-growth` now returns `utility` before the
   contract `activeBuff` check; `getSegmentIdForOption` also forces `utility`. Pack/builder Titan Growth
   stays on the combat radial (`costsAction: true`) until the GM action-economy decision. Lor-Keth name
   holdout retained. See `docs/audits/K0_K9_CORRECTION_REPORT.md`.
3. `npm run build` recompiles the LevelDB pack and rotates `packs/echo-artifacts/MANIFEST-*` / `LOG` — these
   binary changes are part of the regenerated pack and are expected in the K9 diff.

## 9. Remaining blockers / decisions (not K9 code)

1. **GM decision on world library refresh (N1).** Hold setting `holdArtifactLibraryAutoRefresh` is now
   **default ON** (see correction report §P1). Run R-20 diagnostic + backup before clearing the hold or
   using "Refresh Artifact Library". Incomplete trees are still repaired; force refresh bypasses the hold.
2. **W1** manual GM decision for Lor-Keth (Titan Scars vs `ab-armor-temp-hp`) **and** action-economy
   (combat radial Transformation vs Prep Active Buff) → then delete the K8 name holdout / optionally
   change contract category.
3. **W2** before treating K8 cluster b (DR/Phasing / Draconic Roar expectations) as live — **no runtime
   gate yet** (unchanged; needs GM approval).
4. **W5** `echoBound` decision (see §7).
5. Isolated world copy + Playwright smoke (Limited, Breath Damage/Ruin, heal/cleanse, reaction, Armor buff,
   Phasing combat-start with templateId, riposte repeat).
6. Removing K8 missing-ID bridges / enabling fail-closed-on-missing-ID — only after 1–5 and an explicit sign-off.

**Corrected (no longer open):** R1 W1 radial dead code; R3 riposte/reflection predicate split;
`audit:dr-phasing` G10 whitelist.

## 10. Safe Forge deployment steps (manual, in this order)

1. Review + commit K9 as its own commit (no version bump was made; bump/tag only on request).
2. Build the release from that commit (`npm run build`, `npm run release:package` → zip + `system.json`).
3. **Backup first on Forge:** export the world (Forge → Game Worlds → Export) *and* export the current
   `mastery-system.echo-artifacts` compendium via the export macro v2 (`docs/audits` baseline) so the old pack
   is restorable.
4. Install the new system version on Forge via manifest (not by dragging files into the live world). The
   system-shipped compendium `echo-artifacts` is replaced wholesale by the new LevelDB; **document ids are
   unchanged**, so existing UUID links (`Compendium.mastery-system.echo-artifacts.Item.<id>`) stay valid.
5. Do **not** drag/replace pack items onto actors and do **not** run `forceRefreshEchoArtifactLibrary` as part
   of the deployment — owned actor items and tokens are out of K9 scope.
6. Be aware (N1): the first GM `ready` on ≥0.9.824 refreshes world *library* trees that are still on seed 57.
   If this is not wanted, resolve §9.1 before the first GM login on the new version.
7. Verify after login (GM, no writes): open the compendium, spot-check Dragon Head L10 (Damage/Ruin Breath +
   Draconic Roar), Titan Scars L1, Ringchain L6/L10, Sentinel Frame L10 against §4/§6 expectations; optionally
   re-run the export macro v2 and `node scripts/k9-pack-identity-audit.mjs --old <export-dir> --new src/packs/echo-artifacts --strict`
   against the exported pack to confirm the live compendium equals the repository pack.
8. Only then consider the activation items in §9 — none of them are performed by deploying this build.
