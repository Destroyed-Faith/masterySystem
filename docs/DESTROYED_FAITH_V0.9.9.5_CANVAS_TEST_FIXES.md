# Destroyed Faith v0.9.9.5 — Canvas Test Fixes

**Stand:** 2026-10-17  
**Purpose:** Track fixes driven by Foundry canvas testing and parity work, separate from the frozen rulebooks (`docs/Rules/*`).  
**Pending rules:** `docs/DESTROYED_FAITH_PENDING_RULE_CHANGES.md` (R-01, R-02, R-03).

**Typecheck:** `npx tsc --noEmit` → Exit 0  
**Vitest (full suite):** **2769** passed, **0** failed, **252** files (2026-10-17)  
**Vitest (canvas-focused bundle):** covered inside full suite — e.g. `tests/canvas-r01-r02-r03.test.ts`, `tests/fear.test.ts`, `tests/damage-negation-npc.test.ts`, `tests/stress-retired.test.ts`, `tests/npc-skill-pool.test.ts`, `tests/threatened-ranged-hostility.test.ts`, `tests/cleanse-resolution.test.ts`, `tests/critical-resolution.test.ts`, `tests/heal-resolution.test.ts`, `tests/safe-haven-rest.test.ts`  

> Green Vitest is **not** Foundry Canvas acceptance.

**Legend — test type**

- **Unit / integration:** Vitest with mocks or pure functions; no Foundry canvas required.
- **Canvas-only:** Requires live Foundry scene (tokens, grid, disposition, chat buttons, dialogs).

---

## R-01 — Damage Negation without Half-Pool Limit

| Field | Detail |
|-------|--------|
| **Status** | Implemented (pending official rules — see R-01 doc) |
| **Files** | `src/combat/damage-negation.ts`, `src/dice/damage-dialog.ts`, `src/documents/actor.ts`, `src/combat/action-economy.ts` |
| **Mechanic change** | Spend cap = `min(incoming dice, available negation)`; dialog shows original pool, available DN, remaining preview; no half-pool copy in PC dialog. NPCs auto-spend up to cap without dialog. |
| **Tests (unit/integration)** | `tests/canvas-r01-r02-r03.test.ts` (cap + dialog HTML), `tests/damage-negation-npc.test.ts` (R-01 cap, NPC auto apply) |
| **Tests (canvas-only)** | — |
| **Remaining issues** | Catalog template text in `src/utils/powers/templates/reaction.ts` still mentions “shared half-pool cap” for Reaction DN (display only until rules/templates updated). Official rulebooks still describe half-pool. |
| **Required Canvas checks** | PC hit → damage dialog → DN prompt: verify slider/max equals min(dice, reserve), including **full** pool removal when reserve allows. NPC with `combat.damageNegation`: chat note, no dialog, dice removed before roll. |

---

## R-02 — Maximization (Damage + Healing)

| Field | Detail |
|-------|--------|
| **Status** | Implemented (pending official rules — see R-02 doc) |
| **Files** | `src/stones/stone-powers.ts`, `src/stones/stone-combat-effects.ts`, `src/dice/damage-dialog.ts`, `src/combat/heal-resolution.ts` |
| **Mechanic change** | Display name **Maximization**; id `vitality.damageMaximization` unchanged. One combat flag; `offerMaximization(..., 'damage' \| 'healing')` decrements shared `remaining`. |
| **Tests (unit/integration)** | `tests/canvas-r01-r02-r03.test.ts` (name, formula maximize, shared counter), `tests/heal-resolution.test.ts` (heal path imports maximization — extend if needed), stone tests in `tests/stone-powers.test.ts` / print baselines |
| **Tests (canvas-only)** | Confirm Dialog.confirm for maximization on damage **and** heal chat cards |
| **Remaining issues** | Rulebooks and Hunter's Scourge copy still “Damage Maximization” / damage-only. Character print may list “Maximization” — verify sheet labels in Canvas. |
| **Required Canvas checks** | Prep activate Maximization → spend on damage roll → spend on heal roll → third spend until exhausted; forced 8s visible in chat; no second activation same combat. |

---

## R-03 — Threatened Spell Casting

| Field | Detail |
|-------|--------|
| **Status** | Implemented (pending official rules — see R-03 doc) |
| **Files** | `src/combat/threatened-ranged.ts`, `src/combat/attack-executor.ts`, `src/chat/attack-roll-handler.ts` |
| **Mechanic change** | `evaluateThreatenedSpellcasting` uses **`scanThreateningEnemies`** (same as Threatened Ranged). Casting cards get `rollDisadvantage` when any hostile threatens melee reach. |
| **Tests (unit/integration)** | `tests/canvas-r01-r02-r03.test.ts` (empty canvas not threatened), `tests/threatened-ranged-hostility.test.ts` (hostility + reach helpers) |
| **Tests (canvas-only)** | Caster token adjacent inside enemy reach → spell attack card shows disadvantage / lower pool behavior; clear at range |
| **Remaining issues** | No Vitest with placed hostile tokens at exact edge distances (only hostility/unit tests). Rulebooks do not yet define threatened casting. |
| **Required Canvas checks** | Spell radial → attack card in melee vs at range; dummy-friendly NPC disposition still counts as hostile per `tokenIsHostileTo`. |

---

## Critical UI — Roll / Roll with Crit

| Field | Detail |
|-------|--------|
| **Status** | Implemented |
| **Files** | `src/combat/attack-executor.ts` (card HTML), `src/combat/critical-resolution.ts`, `src/chat/attack-roll-handler.ts` |
| **Mechanic change** | Separate **Roll** (`data-use-crit="0"`) and **Roll with Crit** (`data-use-crit="1"`) when charges exist. Crit only for martial attacks or damaging spells (`critAppliesToAttackRoll`). Undeclared roll does not consume Crit quota. |
| **Tests (unit/integration)** | `tests/canvas-r01-r02-r03.test.ts` (crit helpers), `tests/critical-resolution.test.ts` (quota consume), `tests/p0-integration.test.ts` (if crit in attack flow) |
| **Tests (canvas-only)** | Click each button on attack card; verify explosion only on Crit button; buff vs stone-crit preference |
| **Remaining issues** | AoE + multi-target Crit designation still thin in Canvas E2E |
| **Required Canvas checks** | Martial + damaging spell + non-damaging spell (no Crit button); stone Crit charges decrement only on Roll with Crit |

---

## Threatened Ranged Martial Attacks (shared threat scan)

| Field | Detail |
|-------|--------|
| **Status** | Implemented / verified shared scan |
| **Files** | `src/combat/threatened-ranged.ts`, `src/combat/attack-executor.ts`, `src/sheets/npc-sheet.ts` (disposition hint) |
| **Mechanic change** | `evaluateThreatenedRanged` and `evaluateThreatenedSpellcasting` both call **`scanThreateningEnemies`**. Ranged weapon / flagged powers only for martial path; opportunity enemy ids for reactions on ranged path. |
| **Tests (unit/integration)** | `tests/threatened-ranged-hostility.test.ts`, `tests/range-bands-npc.test.ts` (`usesThreatenedRangedWeaponRules`) |
| **Tests (canvas-only)** | Archer in melee → disadvantage + reaction window messaging |
| **Remaining issues** | Console debug logging enabled in threat scan (verbose in production Canvas) |
| **Required Canvas checks** | Bow in reach; thrown/ranged power tags; friendly dummy vs PC hostility; grid-adjacent 2 m reach edge case |

---

## NPC Perception / Skill Pool Display

| Field | Detail |
|-------|--------|
| **Status** | Implemented |
| **Files** | `src/sheets/npc-sheet.ts`, `templates/actor/npc-sheet.hbs`, `src/dice/roll-context-build.js` |
| **Mechanic change** | NPC sheet builds `poolPreview`, `poolFull`, `poolTooltip` per skill via `buildSkillRollPoolPreview` (Perception uses Wits; full pool when skill ≥ 2×MR). Hint string on sheet context. |
| **Tests (unit/integration)** | `tests/npc-skill-pool.test.ts` |
| **Tests (canvas-only)** | Open NPC sheet → Perception chip shows half vs full pool; roll from sheet matches preview |
| **Remaining issues** | — |
| **Required Canvas checks** | NPC with perception 2 vs 4 at MR2; roll keep = MR |

---

## Restoration Labels + Targeting

| Field | Detail |
|-------|--------|
| **Status** | Implemented |
| **Files** | `src/utils/powers/templates/actives.ts` (display labels **Melee/Ranged Scarred Bar Restoration**), `src/combat/heal-resolution.ts` (ally targeting, Scarred prompt, HLR buttons), `templates/actor/partials/npc-attack-targeting.hbs` (if heal targeting exposed) |
| **Mechanic change** | Health Level heal powers show restoration naming; heal flow: optional Scarred recovery then visible heal dice; green ally targeting for heal radial options. |
| **Tests (unit/integration)** | `tests/heal-resolution.test.ts` (Scarred Bar Restoration detection, cleanse rejected from heal path) |
| **Tests (canvas-only)** | Radial heal → target token → Scarred button → roll in chat |
| **Remaining issues** | Template ids unchanged (`active-*-health-level-heal`); only display names shifted |
| **Required Canvas checks** | Scarred target vs healthy; unlinked token actor vs synthetic actor HP sync |

---

## Cleanse / Recovery / DN UI

| Field | Detail |
|-------|--------|
| **Status** | Implemented (partial Canvas verification) |
| **Files** | `src/combat/cleanse-resolution.ts`, `src/combat/status-tick.ts`, `src/stones/stone-powers-dialog.ts`, `src/combat/damage-negation.ts`, `styles/chat.css` |
| **Mechanic change** | Cleanse chat card with ± stack controls; status tick posts Tick/Recovery/Decay/Cleanse summary; Stone Powers dialog **Stone Recovery** + Colorless recovery; DN dialog fields per R-01. |
| **Tests (unit/integration)** | `tests/cleanse-resolution.test.ts`, `tests/stone-recovery.test.ts`, `tests/stone-recovery-budget.test.ts`, `tests/special-summon-auras.test.ts` (natural recovery), `tests/damage-negation-npc.test.ts` |
| **Tests (canvas-only)** | Cleanse chat buttons apply stacks; round-end status tick chat; Stone Recovery steppers in dialog |
| **Remaining issues** | Long tail of cleanse actives not power-for-power Canvas tested |
| **Required Canvas checks** | Cleanse(N) distribution; DN UI on PC; NPC DN silent apply; Recovery MR cap in stone dialog |

---

## Legacy Stress Removal

| Field | Detail |
|-------|--------|
| **Status** | Implemented (mechanical Stress retired) |
| **Files** | `src/combat/spell-roll-handler.ts`, `src/combat/stress-breakdown.ts`, `src/combat/split-spell-stress.ts`, `src/combat/action-economy.ts`, `src/combat/status-tick.ts` (if referenced) |
| **Mechanic change** | `applyStressToActor` / fizzle stress / breakdown no-ops; split spell never applies stress; initiative shop stress removal ignored. Sheet may still show stress bars for narrative/GM tools. |
| **Tests (unit/integration)** | `tests/stress-retired.test.ts` |
| **Tests (canvas-only)** | Spell fizzle and split spell in combat — no stress bar changes |
| **Remaining issues** | `docs/Rules/` may still describe mechanical stress where not retired in print; character sheet GM restore stress controls remain for legacy data |
| **Required Canvas checks** | Fizzle spell; confirm no automatic stress gain |

---

## Fear P1.4

| Field | Detail |
|-------|--------|
| **Status** | Implemented (supersedes earlier “EXCLUDED / not begun” notes in progress docs for **runtime**; Canvas still required) |
| **Files** | `src/combat/fear.ts`, `src/dice/pool-finalize.ts`, `src/utils/safe-haven-rest.js`, `template.json` (`system.fear`) |
| **Mechanic change** | `system.fear` counter; `runFearCheck` Resolve k1 TN 8/12; failure +1 Fear; Fear subtracts from attribute pools via `finalizeRolledPool` / `shouldApplyFearToPool`; Safe Haven clears Fear; Night Rest does not. |
| **Tests (unit/integration)** | `tests/fear.test.ts`, `tests/safe-haven-rest.test.ts` (fear clear on Safe Haven) |
| **Tests (canvas-only)** | GM-triggered fear check hook/UI if exposed; sheet fear display |
| **Remaining issues** | No automated hook test for `module.ts` combat/update calling fear; historical audits still record old “not implemented” verdicts as snapshots |
| **Required Canvas checks** | Fear check fail → fear increments; attack pool reduced by fear; Safe Haven rest → fear 0 |

---

## Cross-Cutting Canvas Abnahme (recommended order)

1. R-01 DN prompt + NPC auto DN on same encounter.  
2. R-02 Maximization on damage then heal.  
3. R-03 + Threatened Ranged with two tokens and reach weapon.  
4. Critical Roll vs Roll with Crit on martial and damaging spell.  
5. NPC sheet Perception pool + roll.  
6. Scarred Bar Restoration + heal targeting.  
7. Cleanse chat + round status tick.  
8. Fizzle/split spell — no stress.  
9. Fear check + pool penalty + Safe Haven.

---

## Document history

| Date | Note |
|------|------|
| 2026-10-17 | Initial canvas fix register; links to pending rule changes R-01–R-03. |
