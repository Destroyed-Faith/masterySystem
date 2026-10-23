# DF 2026-10-23 QA Report

**Date:** 2026-10-23 (Aid Retirement)  
**Baseline:** `main` @ `97543bea` (0.9.762) + uncommitted DF-2026 worktree  
**Schema target:** `2026.10.23` (unchanged)  
**Handoff:** `docs/migrations/DF_2026_ABSCHLUSSBERICHT.md`

## Scripts (this pass)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npm test` | **297 files / 3186 tests PASS** |
| `npm run build` | **PASS** |

## Closing QA items

| Item | Status | Notes |
|---|---|---|
| Creation gate → 5× Rank-2 Specs | **DONE** | Sheet finalize / guide / CONFIG / import |
| Specialization Aid | **RETIRED** | See Aid decision below |
| Localization DE/EN | **DONE** | `MASTERY.df2026.*` (Aid keys removed) |
| Foundry-14 UI smoke | **NOT RUN** | Isolated world required (`FOUNDRY_ISOLATED_TEST=1`) |
| Migration idempotent / non-destructive | **PASS** | No auto Skill→Rank-2 |
| Legacy active paths | **CHECKED** | Aid UI/handlers/maneuver removed; strip-only for old chat cards |

## Aid decision — **ABGESCHLOSSEN (RETIRED)**

**Entscheidung:** Keine Aid-House-Rule. Guide definiert weder +4 Final Result noch Aid als Basic Reaction.

| Entfernt | Erhalten |
|---|---|
| Chat `aid-skill-check` Button (neue Cards) | Guard / Evade / Dive for Cover |
| `AID_BONUS` / Eligibility / Apply | Historische Chat-Inhalte (Flags/HTML) |
| Combat maneuver `aid` + Radial-Prefs | `skillFullPoolThreshold` (nur Legacy-Skill-Pool, nicht Aid) |
| `MASTERY.df2026.aid.*` | Stripper: alte Cards verlieren den Button beim Render |

Regression: `tests/df-2026-aid-retired.test.ts`

## Mental +4

- Base TN = PL×4 only  
- Named +4 only `active-mind-probe` / `active-mental-control`

## Foundry manual smoke (OPEN)

1. New character → Specs N/5 Rank 2; finalize on Spec budget.  
2. Skills tab: Specializations; legacy archive read-only.  
3. Spec roll → **kein** Aid-Button; alte Aid-Cards beim Öffnen ohne klickbaren Bonus.  
4. Echo Imprints / Ritual Workshop / Tower Wizard / Migration Review / Import-Export / Reload.  
5. Combat: Guard/Evade/Dive for Cover OK; kein Aid-Manöver.
