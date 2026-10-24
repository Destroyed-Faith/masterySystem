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

## Dual Skill Roll entry (2026-10-24) — GM-defined correction

**Rule source:** `docs/rules/Destroyed_Faith_Players_Guide_GM_Defined_Skill_Checks_2026-10-24.md`  
**Principle:** GM defines task, Attribute, Skill/Untrained and Base TN. Player chooses **only Paid Raises** before rolling. Free Raises auto on success; effects on result chat card. Combat/Ritual unchanged.

| Path | Expected |
|---|---|
| GM **Skill Check** | Form: Task + Attribute + Base TN + per-actor Spec/Perception/Untrained map; request payload authoritative |
| Player overlay | Task/Attribute/Skill/Base TN **read-only**; only Paid Raises dropdown; Final TN updates live |
| Sheet Spec click | Prefers open GM request; else records verbal GM values (labeled GM-vorgegeben); missing context blocks roll — no invented Attr/TN |
| Client forge | Attribute/Skill/TN overrides rejected at resolve (`validateAgainstGmAssignment`) |
| Success card | Inline Raise allocation (Paid+Free); `skillCheckSnapshot` + `gmVerified` flag |
| Fail / Combat / Ritual | No post-success Skill Raise panel |

Automated: `tests/df-2026-skill-check-dual-entry.test.ts`.  
Manual Foundry-14 smoke: **NOT RUN** (isolated world required).

## NPC situational skills (2026-10-24)

**Rule source:** Players Guide — *NPCs in Skill Checks and Contests* (Capable/Specialist pools, keep = MR; no full PC Spec sheet).

| Area | Status | Notes |
|---|---|---|
| Data | **DONE** | `system.situationalSkills[]` on npc + summon; legacy `system.skills` kept as fallback |
| Sheet UI | **DONE** | Catalog Skills replaced by situational list + Add / Capable / Specialist / Roll / Edit / Delete |
| Roll path | **DONE** | Shared Skill Check dialog; pool = `poolDice`, keep = MR; Paid Raises only; Attribute optional flavor |
| Perception gate | **DONE** | Resolve: situational Perception → legacy rating>0 → Capable preset for NPC/Summon MR |
| PC Specs | **UNCHANGED** | Character Specializations / free Perception Spec untouched |

Automated: `tests/npc-skill-pool.test.ts` (presets MR1–3, Rank→Raises, poolDice ≠ Attribute, Perception resolve).  
Full suite after change: **298 files / 3203 tests PASS**; `tsc` / `npm run build` **PASS**.  
Manual Foundry smoke: add Perception situational → combat locate; roll Stealth from NPC sheet with Paid Raises.  
**No commit/tag** pending approval.
