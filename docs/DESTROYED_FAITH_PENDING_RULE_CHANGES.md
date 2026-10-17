# Destroyed Faith — Pending Rule Changes (Runtime Ahead of Rulebooks)

**Stand:** 2026-10-17  
**Scope:** Decisions implemented in the Mastery System runtime for Foundry canvas testing. The seven official rulebooks under `docs/Rules/` are **unchanged**; this document records what the code does today and what must be edited in a future rules release.

**Related:** `docs/DESTROYED_FAITH_V0.9.9.5_CANVAS_TEST_FIXES.md`, `docs/DESTROYED_FAITH_V0.9.9.5_RULES_RUNTIME_COVERAGE.md`

---

## R-01 — Damage Negation without Half-Pool Limit

### New rule text (summary)

When an eligible **Damage Pool** is about to be rolled against a character who may spend **Damage Negation**, the defender chooses how many **Damage Dice** to remove (1:1 from reserve or eligible temporary sources), up to:

- **min(available negation points, incoming damage dice count)**

There is **no** rule that caps removal at half of the original pool. Full negation is allowed when reserve and dice count permit it. Combined Damage Negation from Passive reserve, temporary buffs, and reactions still share one spend decision per pool and one combined cap per the formula above.

### Contradicts official rules (conceptual citations)

| Source | Section / topic | Official text (intent) |
|--------|-----------------|-------------------------|
| `docs/Rules/passives.md` | **Damage Negation Passives → Half-Pool Limit** | Cannot remove more than half of original Damage Dice; at least half (rounded up) must remain; limit applies to all DN combined. |
| `docs/Rules/active-buffs.md` | Temporary Damage Negation + Passive reserve | Temporary DN and normal reserve share the **half-pool limit** with all DN combined. |
| `docs/Rules/reactions.md` | Reaction: Damage Negation (catalog copy) | Reaction text in templates still references a shared half-pool cap (runtime no longer enforces it). |

### Runtime paths changed

| Area | Files |
|------|--------|
| Cap + spend math | `src/combat/damage-negation.ts` (`damageNegationSpendCap`, deprecated `damageNegationHalfPoolCap` alias) |
| PC prompt UI | `formatDamageNegationDialogContent`, `promptDamageNegationSpend` in same file |
| Damage pipeline hook | `src/dice/damage-dialog.ts` (pre-roll DN prompt / skip raise dice) |
| NPC auto-DN | `promptDamageNegationSpend` NPC branch in `damage-negation.ts` |
| Combat reserve / Vitality DN stone | `src/combat/action-economy.ts`, `src/documents/actor.ts` (reserve init/spend) |

### Later official rulebook edits required

1. **`passives.md`:** Remove or replace **Half-Pool Limit** with the min(available, dice) cap and examples (including full negation).
2. **`active-buffs.md`:** Align temporary DN stacking with R-01 (no half-pool).
3. **`reactions.md`:** Update Reaction: Damage Negation wording if it still cites half-pool.
4. **Players Guide** damage sequence sidebar (if it cross-references half-pool): align step 7 DN with R-01.

---

## R-02 — Maximization (formerly Damage Maximization) for Damage and Healing

### New rule text (summary)

**Vitality Stone Ability: Maximization** (technical id unchanged: `vitality.damageMaximization`) is activated once per combat in the first Preparation Phase. The chosen Rank grants **1 / 2 / 3 / 4 uses** of **Maximization** for that combat. Each use applies to **one complete Damage Roll or one complete Healing Roll**: every die in that pool is treated as **8** (forced 8s are not natural 8s and do not explode). Uses share a **single remaining counter** for both damage and healing. Display name is **Maximization**; saved characters and artifact support strings may still say “Damage Maximization” in ids only.

### Contradicts official rules (conceptual citations)

| Source | Section / topic | Official text (intent) |
|--------|-----------------|-------------------------|
| `docs/Rules/players-guide.md` | **Vitality: Damage Maximization** (Stone table + subsection) | Only **Damage Rolls**; 1–4 maximizations per combat; no Healing Rolls. |
| `docs/Rules/players-guide.md` | Damage resolution / maximization before roll | Maximization replaces dice on **Damage Pool** only. |
| `docs/Rules/players-guide.md` | Hunter's Scourge / artifact support | Support and Limited Strike examples refer to **Damage Maximization** and eligible **Damage Rolls** only. |
| `docs/Rules/artefacts.md` | Hunter's Scourge cross-ref | Same Damage-only framing. |
| `docs/Rules/actives.md` | Limited + Stone interaction notes | Maximization on **legal Damage Roll** only. |

### Runtime paths changed

| Area | Files |
|------|--------|
| Stone definition + activation | `src/stones/stone-powers.ts` (`vitality.damageMaximization`, display name **Maximization**) |
| Shared flag + offer dialog | `src/stones/stone-combat-effects.ts` (`DAMAGE_MAX_FLAG`, `offerMaximization(actor, 'damage' \| 'healing')`) |
| Damage rolls | `src/dice/damage-dialog.ts` |
| Healing rolls | `src/combat/heal-resolution.ts` |
| Legacy alias | `offerDamageMaximization` → `offerMaximization` in `stone-combat-effects.ts` |

### Later official rulebook edits required

1. **`players-guide.md`:** Rename player-facing ability to **Maximization** (keep id footnote for compatibility); extend uses to **Healing Rolls** with shared pool; update rank blurbs and damage-sequence callout.
2. **`artefacts.md` / Hunter's Scourge blocks:** Wording “Damage Roll maximizations” → shared Maximization uses where healing is allowed by table intent.
3. **`actives.md`:** Limited + maximization notes if they should mention healing-eligible powers.
4. Decide whether **Healing-only** Limited Actives are explicitly in or out of scope for Maximization (runtime allows any complete healing roll that goes through `heal-resolution`).

---

## R-03 — Threatened Spell Casting (Disadvantage in Enemy Melee Reach)

### New rule text (summary)

Whenever a creature makes a **Spell Casting Roll** while its token is within **at least one hostile enemy's Melee Reach** (same reach / edge / grid-adjacency geometry as **Threatened Ranged Attacks**), that Casting Roll is made with **Disadvantage**. This applies to **all** spell casting rolls while threatened, not only ranged-delivery powers. **R-03 does not** by itself grant enemies new Reaction opportunities beyond what existing rules already provide for threatened actions (runtime leaves spell opportunity lists empty unless another rule opens them).

### Contradicts official rules (conceptual citations)

| Source | Section / topic | Official text (intent) |
|--------|-----------------|-------------------------|
| `docs/Rules/players-guide.md` | **Threatened Ranged Attacks** | Disadvantage + reactions apply to **Ranged Attack or Ranged Power** with bow/crossbow/thrown/etc. while in enemy melee reach — **not** general Spell Casting Rolls. |
| `docs/Rules/players-guide.md` | Magic / Casting Roll sections | No global “threatened while casting in melee” disadvantage parallel to Threatened Ranged. |

Runtime **extends** threatened geometry from `src/combat/threatened-ranged.ts` (`scanThreateningEnemies`) to casting via `evaluateThreatenedSpellcasting`, wired in `src/combat/attack-executor.ts` when `tnKind === 'casting'`.

### Runtime paths changed

| Area | Files |
|------|--------|
| Shared threat scan | `src/combat/threatened-ranged.ts` (`scanThreateningEnemies`, `evaluateThreatenedSpellcasting`, `isThreatenedByEnemyMelee`) |
| Attack / cast card | `src/combat/attack-executor.ts` (merges `trRanged` + `trSpell` disadvantage) |
| Roll handler | `src/chat/attack-roll-handler.ts`, `src/combat/spell-roll-handler.ts` (disadvantage passed through existing attack card flow) |

### Later official rulebook edits required

1. **`players-guide.md`:** Add a subsection (e.g. under Magic or adjacent to Threatened Ranged) stating **Threatened Spellcasting** with Disadvantage and pointer to shared reach measurement.
2. Clarify interaction with **Threatened Ranged** when a power is both a spell and a flagged ranged weapon (runtime ORs disadvantages; rulebook should say whether disadvantage stacks once or applies once).
3. **Reactions:** Document whether threatened **casts** open the same immediate Reaction window as threatened **ranged** declarations (runtime: spell path does not populate opportunity enemies unless another rule does).

---

## R-04 — Graded Fear Check (bands 8 / 16)

### New rule text (summary)

A Fear Check is always **Resolve k1** (no Skill Points, no Raises). There is **no TN picker**. Read the kept total against fixed bands:

| Total | Fear gained |
|------:|------------:|
| **&lt; 8** | **+2 Fear** |
| **&lt; 16** (and ≥ 8) | **+1 Fear** |
| **≥ 16** | **+0 Fear** |

Fear still accumulates; each Fear point removes 1 die from attribute-based pools before Health %; Safe Haven Rest clears Fear to 0. Healing / Cleanse / Night Rest / Day Rest / combat end do not clear Fear.

### Contradicts official rules

| Source | Official text (intent) |
|--------|-------------------------|
| `docs/Rules/players-guide.md` — Fear (Furcht) | Binary check: TN **8** (normal) or **12** (extreme); success → +0 Fear; failure → **+1 Fear**. |

### Runtime paths changed

| Area | Files |
|------|--------|
| Band math + check | `src/combat/fear.ts` (`fearGainedFromCheckTotal`, `runFearCheck`) |
| GM group Rolls | `src/epic-roll/*` (Fear Check type; no TN picker) |
| Tests | `tests/fear.test.ts` |

### Later official rulebook edits required

1. Replace the TN 8 / 12 binary Fear Check table with the graded 8 / 16 band table.
2. Update Fear Check examples accordingly.

---

## Tracking

| Id | Status in runtime | Rulebooks updated |
|----|-------------------|-------------------|
| R-01 | Implemented | No |
| R-02 | Implemented | No |
| R-03 | Implemented | No |
| R-04 | Implemented | No |

When the official v0.9.9.x (or later) rules release incorporates these decisions, remove or archive the corresponding rows from this file and update `docs/DESTROYED_FAITH_V0.9.9.5_RULES_RUNTIME_COVERAGE.md` status notes.
