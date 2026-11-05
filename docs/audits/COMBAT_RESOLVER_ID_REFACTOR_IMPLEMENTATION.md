# Combat Resolver ID Refactor — Implementation Report

| | |
|---|---|
| Date | 2026-11-05 (K0–K7 corrections) |
| Plan | `docs/audits/COMBAT_RESOLVER_ID_BASED_ARCHITECTURE_PLAN.md` Revision 2 / 2.1 |
| Fable review | `docs/audits/COMBAT_ID_REFACTOR_FABLE_REVIEW.md` → corrections in `docs/audits/COMBAT_ID_REFACTOR_K0_K7_CORRECTION_REPORT.md` |
| Branch | `main` (no commit / push / Forge deploy) |
| Verdict | **PARTIAL** (Fable BLOCKED gates K0–K7 addressed; K8 cutover not started) |

## 0. K0–K7 correction status (2026-11-05)

| Batch | Status |
|---|---|
| K0 Build (`tsc` / migration types) | **PASS** |
| K1 Restore premature C2 (mechanics name fallback + Limited Radial) | **PASS** |
| K2 Safe artifact-row enrichment | **PASS** |
| K3 Revert unplanned `useAuthoredLevelProgression` | **PASS** |
| K4 Preflight suggestions + hooks | **PASS** |
| K5 Shadow clusters + hygiene | **PASS** |
| K6 Identity matrix + fail-closed guard + contract gaps | **PASS** |
| K7 Migration persist/rollback/dialog (fixtures) | **PASS** |

Gates: `tsc --noEmit` 0; `npm test` 360 files / **3812** tests. No K8.

## 1. Batches completed

| Batch | Status | Notes |
|---|---|---|
| **B0** Cleanse alignment | **PASS** | `CLEANSE_RANGED_SINGLE` ← Actives.md 1223–1238; controls PL4=6, PL10=10 |
| **B** Identity contract | **PASS** | Resolver, contract table, source data, builder/compiler, preflight, tests |
| **C1** Shadow-Compare | **PASS** | Expanded in K5 (Executor, Growth, DR/Phasing, Specials, …) |
| **E** Migration infra | **PASS** | Completed in K7 (backup array, rollback rows/effects/authoredStages, review dialog) — fixtures only |
| **C2** Text-fallback cutover | **NOT STARTED (K8)** | Premature cuts from earlier attempt rolled back in K1; residual text allowlisted |
| **F** Full regression | **PASS** | 3812/3812 after K0–K7 |
| **D1–D3** | **Out of scope** | Per mandate |

## 2. Changed files (implementation)

### New
- `src/utils/artifact-functions.ts` — `ArtifactFunctionId`, `ARTIFACT_FUNCTION_CONTRACT` (4 entries)
- `src/utils/power-identity.ts` — `resolvePowerIdentity`, `deriveActiveSegment`
- `src/utils/identity-preflight.ts` — read-only preflight
- `src/utils/identity-shadow.ts` — C1 `compareIdentityDecision`
- `src/migrations/power-identity-migration.ts` — plan/apply/rollback/acknowledge (fixtures)
- `scripts/run-identity-audit.mjs` (+ `package.json` `audit:identity`)
- `tests/catalog-rules-cleanse.test.ts`
- `tests/power-identity-contract.test.ts`
- `tests/identity-preflight.test.ts`
- `tests/identity-shadow.test.ts`
- `tests/power-identity-migration.test.ts`
- `tests/no-text-mechanic-matching.test.ts`
- `docs/audits/identity-matrix-report-2026-11-04.md`
- `docs/audits/COMBAT_RESOLVER_ID_REFACTOR_IMPLEMENTATION.md` (this file)

### Modified (core)
- `src/utils/powers/templates/actives.ts` — B0 Cleanse table
- `src/types/item.d.ts` — `artifactFunctionId`, `rank` on rows/picks
- `src/radial-menu/types.ts` — option identity fields
- `src/utils/echo-artifacts.ts` — freigegebene identities; builder Z2; `useAuthoredLevelProgression` on Ringchain/Titan Scars/Hollow Crown; Breath/Growth/Absorption/Awakening
- `src/utils/echo-artifacts-unbound.ts` — Awakening identity through `tenLevels`
- `src/artifacts/progression-compiler.ts` — identity through power + authored stages
- `src/utils/power-mechanics.ts` — `resolvePowerMechanicsById`; **K1: name fallback restored** (ID-only shadowed); DR/Phasing shadow
- `src/utils/active-buffs.ts` / `artifact-active-buffs.ts` — write `rank` / `artifactFunctionId` flags; Growth PL shadow
- `src/radial-menu/options.ts` — C1 shadow; C2.a only when `templateId` present; skip npc/maneuver logs
- `src/radial-menu/artifact-options.ts` — **K2** safe enrichment util; **K1** Limited legacy parity; identity category
- `src/utils/artifact-row-identity.ts` — K2 central enrich (blank rows only)
- `src/utils/identity-preflight-hooks.ts` — K4 World Ready / Combat Start
- `src/migrations/power-identity-migration-review-dialog.ts` — K7 GM review
- `src/combat/limited-charge.ts`, `heal-resolution.ts`, `cleanse-resolution.ts`, `attack-executor.ts` — C1/K5 shadow
- `tests/active-buff-effect-level.test.ts`, `tests/split-attack.test.ts` — **K1 restored** legacy expectations
- `docs/audits/COMBAT_RESOLVER_ID_BASED_ARCHITECTURE_PLAN.md` — Rev 2.1 decisions (prior turn)
- `package.json` — `audit:identity`

### Explicitly not done
- Pack rebuild (`npm run build:packs`)
- World / actor migration on productive data
- Commits, pushes, Forge deploy
- Restoration HP runtime change (K5 / 14.8)
- Remaining Cleanse tables (14.1b)
- D1–D3 architecture splits
- Full GM review dialog UI (migration API + fixture tests only)

## 3. Identity contract implemented

- **Source of truth:** existing Power Catalog (`getTemplate` / `ALL_POWER_TEMPLATES`).
- **Resolver:** `resolvePowerIdentity(source) → Resolved | Unresolved` (I1–I5).
- **Overlay:** K1 catalog / K2 function-only / K3 catalog+overlay via `ARTIFACT_FUNCTION_CONTRACT` (not a second registry).
- **Freigegebene mappings:**
  - Hearth Circle I/II → `active-melee-aoe-restoration` PL 4/16
  - Remembered Hands I/II → `active-ranged-health-level-heal` PL 10/16
  - Burden Lifted I/II → `active-ranged-single-cleanse` PL 4/10 (after B0)
  - Dragon Breath → `active-melee-weapon-aoe` + `dragon-breath`
  - Titan Growth → `titan-growth`; Life Absorption → `life-absorption`; Awakening → `artifact-awakening`
- **Builder/compiler:** authored stages and compiled rows carry `powerTemplateId` / `artifactFunctionId` / `rank` / spell+limited flags.
- **Runtime without pack rebuild:** `enrichArtifactRowIdentity` merges catalog identity by `(echoArtifactKey, level)` when building radial options.

## 4. Text fallbacks removed or narrowed

| Site | Change |
|---|---|
| `resolveMechanicsFromCatalog` | Name / `templateName` lookup **removed** (ID-only) |
| `getSegmentIdForOption` | No `textSuggestsActiveBuff` when `templateId` present |
| Artifact Limited | Name matches (`moonlight judgment`, etc.) **removed**; `row.limited` only |
| Heal / Cleanse radial | Text blob only if **no** structured template id |
| Breath radial | Prefer `artifactFunctionId === 'dragon-breath'`; name kept as last resort for unrepaired embeds |
| Artifact category | Prefer template/function identity; type-text classifier remains for rows without identity |

## 5. Remaining mechanical text recognition

Still present (allowlisted / migration debt — **not** fully deleted this pass):

- `textSuggestsActiveBuff` for items **without** `templateId`
- `isBreathWeaponName` as last-resort breath routing / display helpers
- `inferRestorationTemplateFromArtifactText` / `artifactRowLooksLikeHeal` when no structured id
- `classifyArtifactRowType` for rows without identity
- Weapon `innateAbilities` string traits, Health-Bar name heuristics, status name fallbacks (plan §7.8 — follow-up)
- Cosmetic / display uses of names (chat labels, sheet)

Guard test `tests/no-text-mechanic-matching.test.ts` asserts identity modules stay clean and inventories remaining sites.

## 6. Identity-matrix results

See `docs/audits/identity-matrix-report-2026-11-04.md`. Catalog templates: 0 unresolved. Freigegebene artifacts: resolve. Other authored activatable rows without IDs: informational (Batch E debt).

## 7. Legacy migration readiness

| Capability | Ready? |
|---|---|
| Dry-run proposals by `(echoArtifactKey, level)` | Yes (fixtures) |
| `templateName` exact provenance for power items | Yes |
| Buff `powerId` → `powerTemplateId` | Yes |
| Backup flag `identityMigrationBackup` | Yes (per applied doc) |
| GM review dialog UI | **Not built** (API only) |
| Productive world run | **Forbidden / not done** |
| Pack JSON rewrite | **Not done** (runtime enrichment instead) |

## 8. Test results

| Suite | Result |
|---|---|
| B0 cleanse | 3/3 |
| Identity contract / preflight / shadow / migration / guard | all green |
| Full `vitest run` | **356 files, 3768 tests passed** |
| `npm run audit:catalog` | OK (233 correct, 3 corrected, 0 missing) |

## 9. Remaining architecture issues

1. **Pack JSON** still lacks identity fields (seedVersion unchanged). Runtime enrichment covers radial; pack-as-data consumers without enrichment still see empty IDs until approved rebuild.
2. **C2 incomplete:** not every P0 text site deleted; residual paths for unmigrated data remain by design until E+rebuild.
3. **14.1b** other Cleanse tables still diverge from Actives.md (reported, not changed).
4. **14.8 / K5** Scarred-Bar HP: PH full-HP vs Actives.md reopen-without-HP; runtime unchanged (`r05-restoration` still full HP).
5. **14.7** Moonlight Mending retired heal template — open.
6. **GM Preflight/Migration UI** not shipped (library + tests only).
7. **D1–D3** still pending (out of scope).

## 10. Deviations from Fable plan

| Plan item | Deviation | Reason |
|---|---|---|
| Pack rebuild in Batch B | Skipped | User mandate: no productive pack rebuilds |
| Full C2 cluster deletion order d→e→c→a→b→f→g | Partial; not every P0 deleted | Stop rather than invent mappings; residual text only for missing-ID legacy |
| GM Review Dialog | Not implemented | API + fixture tests satisfy migration *infrastructure*; UI deferred |
| `audit:identity` via dedicated node script | Wired to vitest preflight test | Same gate; script kept as thin entry |
| Golden Playwright combat smoke | Not run | No Forge/Foundry session in this pass; vitest covers contract |
| Archify diagram update | Not done | After F release gate per plan; no publish |

## Final verdict: **PARTIAL**

Core identity contract, Cleanse alignment, shadow-compare, fixture migration, and full unit regression are complete and green. Cutover is **not** claimable as “ID-based architecture abgeschlossen” (Release Gate G1–G10) while pack JSON is unrebuilt, residual text paths remain for unmigrated data, and the GM migration UI is absent.

**No publication.** Awaiting independent Fable review.

---

## 11. Pre-K8 Forge Reality Audit corrections (2026-11-05)

Source: `docs/audits/FORGE_REALITY_AUDIT_PRE_K8.md` · Unresolved preserved in `docs/audits/FORGE_REALITY_AUDIT_UNRESOLVED.md`.

**Goal:** Make diagnostic tooling detect the real-world inconsistencies Fable found (especially W1 wrong-but-valid identity) before K8. No K8/K9, no world writes, no rule changes, no combat mechanic changes.

### 11.1 Files changed

| File | Change |
|---|---|
| `src/utils/power-identity.ts` | Reasons `legacy-alias-key`, `catalog-divergence`; `IdentityFieldSnapshot`; observed/expected/canonical fields |
| `src/utils/artifact-row-identity.ts` | `resolveCanonicalArtifactKey`, `lookupArtifactDefinition` (alias-aware); enrich uses alias-aware lookup |
| `src/utils/identity-preflight.ts` | Alias diagnostic; catalog-divergence vs builder; markdown detail column; never suggests auto-migration for divergences |
| `macros/export-identity-snapshot.js` | formatVersion **2**; X1 MR path; X3 picks `level`/`kind`; X4 provenance flags; X2 clearer incomplete tokens |
| `scripts/run-identity-snapshot-audit.mjs` | Accepts formatVersion 1 **and** 2 |
| `docs/audits/IDENTITY_SNAPSHOT_EXPORT.md` | v2 schema notes |
| `docs/audits/FORGE_REALITY_AUDIT_UNRESOLVED.md` | **New** — W1/W2/W3/W5 preserved |
| `tests/identity-preflight.test.ts` | W1 Lor-Keth fixture + matching-identity regression |
| `tests/identity-snapshot-offline.test.ts` | v1 compatibility + v2 shape smoke |

### 11.2 Behavior before / after

| Case | Before | After |
|---|---|---|
| Lor-Keth `titanScarsIntellect` + `ab-armor-temp-hp` (W1) | Preflight: **resolved** (valid template). Migration: 0 proposals (structured identity protected). Silent. | Preflight: `legacy-alias-key` + `catalog-divergence` (informational, disposition **manual**). Includes actor/item ids, observed vs expected identity, canonical key `titanScars`. **No** `suggestedIdentity`. Migration still skips overwrite. |
| Matching Dragon Head / Moonlight rows | Resolved, no entries | Unchanged — no false catalog-divergence |
| Valid power `templateId` | Resolved | Unchanged |
| Export MR | Always `null` (read `system.masteryRank`) | Reads `system.mastery.rank` (+ nested `mastery.rank`) |
| Export picks | Fake `id`/`name` nulls | Real `level`/`kind` |
| Export provenance | Filtered out | `nodeId` / `seedVersion` / `evolutionNodeId` / `parentIds` included |
| Offline adapter on old Forge dump (v1) | Accepted | Still accepted |

### 11.3 Tests and results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0) |
| `npx vitest run` | PASS — **363 files / 3839 tests** (+4 vs 3835: W1 fixture, matching identities, suggest guard, v2 snapshot shape) |
| `npm run build` | PASS |
| Offline Forge dump (v1, read-only) | Preflight `unresolved: 4` informational = 2× `legacy-alias-key` + 2× `catalog-divergence` (world Lor-Keth + token copy). Migration proposals **0**. Other actors unchanged. **Not** runtime validation. |

### 11.4 Remaining manual decisions (not implemented)

- **W1 world:** GM re-sync of Lor-Keth Titan Scars on an isolated copy — affinity/progression choice is intentional data, not auto-fixed.
- **W2:** Draconic Roar rules conflict (retired table vs approved exception).
- **W3:** Breath cone vs radius text.
- **W5:** `echoBound` boolean vs string.

### 11.5 Remaining blockers for production cutover (unchanged)

1. Isolated reference-world copy + Foundry-side dry-run / Playwright smoke — **missing**.
2. K9 pack rebuild (compendium still pre-identity) — **not run**.
3. K8 cluster cutover d→e→c→a→b→f→g — **not started**.
4. Rules-owner decisions on W2 (before Active Buff cluster) and W1 world fix.
5. Re-export with macro v2 to verify MR / provenance on Forge (tooling ready; world not modified).

**Still PARTIAL. No K8. No commit/push.**
