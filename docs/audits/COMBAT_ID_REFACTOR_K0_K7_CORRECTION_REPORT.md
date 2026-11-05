# Combat Resolver ID Refactor — K0–K7 Correction Report

| | |
|---|---|
| Date | 2026-11-05 |
| Basis | `docs/audits/COMBAT_ID_REFACTOR_FABLE_REVIEW.md` (BLOCKED) |
| Plan | `docs/audits/COMBAT_RESOLVER_ID_BASED_ARCHITECTURE_PLAN.md` Rev 2/2.1 |
| Scope | K0–K7 only (no K8 / C2 hard cut / D1–D3) |
| Branch | `main` (no commit / push / Forge / pack rebuild / productive migration) |

## Batch verdicts

| Batch | Verdict | Summary |
|---|---|---|
| **K0** Build | **PASS** | Narrow migration interfaces; `PowerLevelKey` index in `resolvePowerMechanicsById`. `tsc --noEmit` 0; `npm run build` OK; tests green. No behaviour change. |
| **K1** Premature cutover rollback | **PASS** | Name fallback restored in `resolveMechanicsFromCatalog` (legacy decides; ID-only shadowed). Limited Radial heuristics restored to match Executor. Original Armor/Split tests restored. Parity test added. |
| **K2** Enrichment safety | **PASS** | Central `src/utils/artifact-row-identity.ts`: enrich only when row has **no** structured identity; atomic catalog copy; `system.echoKey` ignored. Used by Radial + Preflight. |
| **K3** Authored progression flags | **PASS** | Trees for Titan Scars / Hollow Crown / Ringchain differ beyond identity with `useAuthoredLevelProgression: true` → flags **reverted**. Sentinel Frame unchanged. |
| **K4** Preflight | **PASS** | `suggestedIdentity` + disposition; no-throw actor scan; World Ready + Combat Start GM whispers; Markdown/JSON export helpers. |
| **K5** Shadow hygiene + clusters | **PASS** | Dedupe, cap 500, skip npc/maneuver; shadow on Executor Limited/Breath/mode, Growth PL, DR/Phasing, Specials, Special Increase. Cluster export API. |
| **K6** Matrix + Guard + contracts | **PASS** (final verification done) | Identity matrix over all ranks 1–16 (3152 cells, 0 failures, 0 unexplained); fail-closed text guard proven red with a controlled violation; shadow cluster export verified from real call sites; T4/T5/T7/T8/T9c/T12/T13/T16/T17/T18. |
| **K7** Migration readiness | **PASS** (fixtures) | Backup array; row + authoredStages + effect `update()`; working rollback; dry-run 4 sections; GM review dialog; M3/M4/M6/M7. Reference-world dry-run: **NOT VERIFIED** (no world copy used). |

**Overall after K0–K7:** ready for Fable re-review toward PARTIAL / cutover prep. **Not READY FOR CUTOVER** — K8 still required.

## Fable findings F1–F14

| ID | Status | Fix |
|---|---|---|
| F1 tsc red | **Fixed** | K0 |
| F2 name fallback removed early | **Fixed** | K1 (restored + shadow) |
| F3 Limited Radial ≠ Executor | **Fixed** | K1 |
| F4 unsafe enrichment merge | **Fixed** | K2 |
| F5 enrichment Radial-only | **Mitigated** | K2 central util + Preflight; other consumers still legacy until C2/E persist |
| F6 useAuthoredLevelProgression | **Fixed** | K3 revert |
| F7 effect not persisted | **Fixed** | K7 `effect.update()` |
| F8 backup/rollback incomplete | **Fixed** | K7 backup array + row/authoredStages/effect rollback |
| F9 suggestedIdentity empty | **Fixed** | K4 |
| F10 shadow unbounded | **Fixed** | K5 |
| F11 two segment derivations | **Documented** | Identity-matrix exceptions (C2.a); no mechanical change |
| F12 heal/cleanse ignore option.rank | **Open (K8/C2.e)** | Not in K0–K7 scope |
| F13 dead audit script | **Open (low)** | `audit:identity` still vitest; script unused |
| F14 P2 throws | **Fixed** | K4 |

## Remaining mechanical text sites

Still active (allowlisted for C1; must die in K8/C2 clusters): see `tests/__fixtures__/identity-text-guard-allowlist.json`.

Highest priority for K8 order (per plan d→e→c→a→b→f→g):

- `attack-executor` Limited/Breath name heuristics (shadowed)
- `heal-resolution` / `cleanse-resolution` text when no structured id
- `growthPowerLevelFor` text parse (shadowed)
- `isSanctionedDR` / Phasing name branches (shadowed)
- `textSuggestsActiveBuff` / tag routing for items without `templateId`
- Specials string apply / Special Increase `includes`
- `isBreathWeaponName`, `classifyArtifactRowType`, `isUltimateProgressionRow`

## Shadow-Compare

Sites now shadowed (legacy decides):  
`mechanics.resolveFromCatalog`, `mechanics.isSanctionedDR`, `mechanics.isSanctionedPhasing`,  
`radial.getSegmentIdForOption`, `artifact.rowLimited`, `artifact.growthPowerLevel`,  
`limited.isLimitedAttackDeclaration`, `heal.isHealRadialOption`, `cleanse.isCleanseRadialOption`,  
`executor.claimsLimited`, `executor.isBreathWeapon`, `executor.breathMode`,  
`specials.resolveByName`, `reaction.specialIncreaseMatch`.

Hygiene: dedupe, cap 500, skip `npc-attack`/`maneuver`, `exportIdentityShadowClusterReports()`.

### Cluster-export verification (K6 final)

- Before K6 final, `tests/identity-shadow.test.ts` only exercised the export function with synthetic
  `compareIdentityDecision(...)` calls (`executor.claimsLimited`, `mechanics.isSanctionedDR`).
- Added `K6-final: cluster export carries entries produced by real shadowed call sites`: drives the
  production sites `getSegmentIdForOption`, `isHealRadialOption`, `isCleanseRadialOption`,
  `isLimitedAttackDeclaration`, `resolvePowerMechanics` with catalog ids / a name-only item, then asserts
  clusters `radial`, `heal`, `cleanse`, `limited`, `mechanics` are present and non-empty, every entry's
  `siteId` belongs to its cluster, the known C1 mismatch (support-heal: identity `utility` vs legacy
  `attack`) is visible in `radial.mismatches`, the export round-trips through `JSON.stringify/parse`, and
  `exportIdentityShadowReport().total` equals the sum of cluster totals.
- Not covered by this test (needs a running Foundry client): `executor.*`, `artifact.*`, `specials.*`,
  `reaction.*` — these are reached only through attack-executor / radial artifact options / reaction
  windows. They remain covered by the synthetic-entry test only. No real game-world data were used or
  invented; all probes use catalog template ids and neutral `ZZZ_*` names.

## Identity-Matrix (all ranks 1–16)

`tests/identity-matrix.test.ts` now iterates **every catalog template × every rank 1–16** (no sampling).
Per cell it asserts: `templateId`, `category`, `subfamily`, `rank`, `limited` flag (identity ↔ catalog ↔
`LIMITED_ID_SET`/forbidden gate), `mechanics` (identity = `resolvePowerMechanicsById` = catalog level row =
legacy `resolvePowerMechanics` with templateId), and that level-row `specials` carry structured `key`s.
Routing is dual-run for all categories: active → `deriveActiveSegment` vs `getSegmentIdForOption`;
activeBuff/movement → legacy must route to `active-buff`/`movement`.

Results (`docs/audits/identity-matrix-report-k6.md`, regenerated by the test):

| Metric | Value |
|---|---|
| Templates | 197 (movement 10, reaction 22, activeBuff 50, passive 37, active 78) |
| Cells (template × rank) | 3152 defined / 0 undefined |
| Resolved by id | 3152 / failures 0 |
| Mechanics cells (by-id = catalog = legacy) | 3152 / legacy mismatches 0 |
| Specials cells with structured keys | 1093 · templates with `specialSlot`: 32 |
| Limited templates (catalog ↔ gate consistent) | 4 (`active-{melee,ranged}-limited-{single,aoe}`) |
| Artifact rows with identity | 66 / failures 0 |
| Dual-run cells | 3152 |
| Segment mismatches (active) | 336 cells across 21 templates — identical across all 16 ranks (rank-inconsistent: 0) |
| Explicit exceptions / family rule / unexplained | 13 / 8 / **0** |
| activeBuff/movement routing mismatches | 0 |

Known deviations (not corrected, documented — C2.a work list): all 21 mismatching templates are
`roll.kind: none` support/mental/barrier/illusion actives where identity derives `utility` and legacy
defaults actives to `attack` (cleanse ×4, dispel ×4, heal/HLR/restoration ×6, cleanse-absorption,
barrier, illusion-image, mental ×4). Explicit citations live in
`tests/__fixtures__/identity-exceptions.json`; the dispel/cleanse families are covered by the documented
C1 family rule in the test. No new rule, no gameplay change.

### Text-guard verification (K6 final)

Controlled failure proof, performed and reverted:

1. Created `src/combat/__guard-probe-tmp.ts` containing
   `String(power?.name || '').toLowerCase().includes('riposte')` (not on the allowlist).
2. `npm test -- tests/no-text-mechanic-matching.test.ts` → **exit 1**,
   `fails on new mechanical text sites outside the allowlist` reported
   `src/combat/__guard-probe-tmp.ts:3` as 1 new text-mechanic site.
3. Deleted the probe file (`Test-Path` → False); guard re-run → **exit 0**, 3/3 passed.

C1 legacy fallbacks remain on the explicit allowlist
(`tests/__fixtures__/identity-text-guard-allowlist.json`) with per-entry reasons; identity modules are never
allowlisted.

## Preflight

- Suggestions: `templateName-exact`, `echoArtifactKey+level`, `flags.powerId`.
- Hooks registered from `module.ts` (`registerIdentityPreflightHooks`).
- Exceptions become `errors[]`; never thrown into gameplay.

## Migration readiness

| Capability | Status |
|---|---|
| Fixture plan/apply/dry-run | Yes |
| Backup as array per path | Yes |
| Rollback rows / authoredStages / effects | Yes |
| Effect Foundry `update()` | Yes |
| Four-section dry-run Markdown | Yes |
| GM review dialog | Yes (`power-identity-migration-review-dialog.ts`) |
| Productive actors / packs / worlds | **Not run** |
| Reference-world dry-run | **NOT VERIFIED** |

## TypeScript / Build / Tests

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | OK (occasional Windows file-lock on `dist/`; retry succeeded) |
| `npm test` | **360 files / 3813 tests** passed (K6 final: +1 shadow E2E test; matrix rewritten to 1–16) |
| `tests/identity-matrix.test.ts` | 4/4 passed, 3152 cells |
| `tests/no-text-mechanic-matching.test.ts` | 3/3 passed; controlled violation → red (see above) |

## Prerequisites still missing for K8

1. Fable confirmation that K0–K7 close the BLOCKED gates.
2. Reference-world **copy** dry-run + Preflight 0 unacknowledged blocking entries (or documented acknowledgements).
3. Pack rebuild with persisted identity fields (separate freigabe).
4. Per-cluster C2 hard cut (d→e→c→a→b→f→g) with Golden + sharp guard + Playwright smoke.
5. Resolve open rule topics 14.1b / 14.7 / 14.8 / AoE Restoration table **or** keep them out of code.

**Stop after K7 — no automatic K8.**
