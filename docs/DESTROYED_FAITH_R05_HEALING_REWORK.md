# Destroyed Faith R-05 — Healing & Restoration Rework

**Status:** Implemented in Mastery System runtime (Canvas-ahead of rulebooks)  
**Date:** 2026-10-17  
**Rulebooks:** Seven official docs under `docs/Rules/` **unchanged**; see `DESTROYED_FAITH_PENDING_RULE_CHANGES.md` § R-05.

---

## 1. New model

| Channel | Restores | Resource |
|---------|----------|----------|
| **Resolve: Healing** | Ordinary HP in the current Active Bar | Stone ranks (pending per Round) |
| **Restoration Actives** (ST / AoE) | Scarred Bars at **full HP** | Safe Haven Rest pool (40 PP / bar) |
| **Passive: Regeneration** | Own Scarred Bars at full HP | Tyhran Day pool (`floor(PL/2)`) |
| **Vitality: Remove Scar** / rest / day rest | Scarred Bars at full HP | Existing costs (unchanged counts) |
| **Damage Transfer** | Ordinary HP to attacker | Unchanged vampyr rules |

No Healing Dice on Restoration. No turn-start Passive HP heal. No recurring Healing Buffs / Auras.

---

## 2. Retired powers

- Active: Melee/Ranged Single-Target Heal, Melee/Ranged AoE Heal  
- Active Buff: Healing, Healing Aura (Temp+Heal keeps Temp HP only)  
- Passive: Healing (old turn-start HP) and conditional/combined healing variants  
- Heal+Cleanse mixed → Cleanse-only (same template ids)

---

## 3. New / kept Restoration identities

| Template id | Display name |
|-------------|--------------|
| `active-melee-health-level-heal` | Melee Scarred Bar Restoration |
| `active-ranged-health-level-heal` | Ranged Scarred Bar Restoration |
| `active-melee-aoe-restoration` | Melee AoE Restoration |
| `active-ranged-aoe-restoration` | Ranged AoE Restoration |
| `passive-regeneration` | Passive: Regeneration |
| `resolve.healing` | Resolve: Healing (pending) |

---

## 4–5. PL 1–16 tables & PP

See mandate §6. Validated in `tests/r05-healing-rework.test.ts` against:

- Active budget `30 × PL`  
- Passive budget `20 × PL`  
- Restoration `40 PP` / bar  
- Range `5 × (PL−1)` for ranged  
- Radius costs melee 20/50/90 (2/3/4 m), ranged 20/50 (2/3 m)

Helpers: `src/combat/r05-pools.ts`, `meleeAoePoolFromBudget` / `rangedAoePoolFromBudget` / `passiveRegenPoolFromBudget` in `r05-restoration.ts`.

---

## 6. Passive: Regeneration

- Pool = `floor(PL/2)` bars / Tyhran Day (`currentDayIndex`)  
- Self only; no Attack / Reaction / Casting Roll  
- Sheet button + `activatePassiveRegeneration`  
- Flag `passiveRegenerationDaily` `{ dayIndex, spent, poolMax }`  
- Blocked while Incapacitated  

---

## 7. Resolve Healing timing

- Prep payment → `resolveHealingPending` for the Round (no roll yet)  
- Trigger via chat / API; optional offer before incoming HP loss  
- Expires at Round end; stones stay spent  
- Maximization (R-02) still applies on the Healing Roll  

---

## 8. Canonical Scarred Bar transition

`restoreScarredHealthBars` / `buildRecoverScarredBarUpdates`:

1. Take next scarred bars from the severe end of the bar list  
2. Set `current = max` (full capacity, Fortitude-aware)  
3. Active Bar = first bar with `current > 0` (highest available)  
4. Clear death state when no longer Incapacitated  

Used by ST Restoration, AoE Restoration, Regeneration, Remove Scar callers, and rest paths that already refill scarred bars to max.

---

## 9. Artifact mappings

| Artifact | Mapping |
|----------|---------|
| Moonlight Mending | Ranged ST Restoration PL 4/10/16 |
| Remembered Hands | Ranged ST Restoration at printed PLs |
| Resting Soul | Self Restoration (Melee ST pools 3/7/12 at PL 4/10/16) — no turn-start heal |
| Hearth Circle | Melee AoE Restoration PL 4/16 |
| Echo Sentinel / packs | Heal template ids → Restoration ids |

---

## 10. Actor migration

`src/migrations/r05-healing-migration.ts` (GM migration hook):

- Heal actives → Restoration templates (same PL when legal)  
- `passive-healing` → `passive-regeneration`  
- Retired buffs/passives flagged `r05Retired` (activation blocked)  

---

## 11. Affected files (primary)

- `src/combat/r05-pools.ts`, `r05-restoration.ts`, `aoe-restoration.ts`, `passive-regeneration.ts`, `heal-resolution.ts`  
- `src/stones/resolve-healing-pending.ts`, `remove-scar.ts`, `stone-resolution-ui.ts`  
- `src/utils/powers/templates/{actives,passives,activeBuffs}.ts`  
- `src/migrations/r05-healing-migration.ts`  
- `src/utils/{general-artifacts,echo-artifacts}.ts`, echo packs  
- `src/creation/tower-wizard/*`  
- `src/sheets/character-sheet.ts`, `templates/actor/character-sheet.hbs`  
- Tests: `tests/r05-healing-rework.test.ts`, `r05-healing-migration.test.ts`, `resolve-healing-pending.test.ts`  

---

## 12. Test results

Run after implementation:

```text
npx tsc --noEmit
npx vitest run
```

Targeted: `tests/r05-healing-rework.test.ts` (tables, restore, AoE validate, regen, pending, catalog).

---

## 13. Remaining Canvas checks

- AoE Restoration chat allocate UI with live tokens  
- Pending Resolve Healing damage-interrupt prompt in combat  
- Artifact milestones (Moonlight / Hearth / Resting Soul) end-to-end  
- Regeneration button + Tyhran day advance via calendar  
- Legacy actor load + migration on world open  

---

## 14. Unresolved / intentional limits

- Official rulebooks not rewritten (pending campaign)  
- Minor Magic still forbids HLR storage  
- Combined retired passives kept as non-selectable / flagged stubs  
- Aura-pulse legacy healing paths should no-op when buffs are retired  
