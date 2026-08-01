# Critical Resolution — Data Flow & Open Rules Decision

## Current data flow

1. **Catalog grant** — `ab-critical` in `src/utils/powers/templates/activeBuffs.ts`  
   Levels store `mechanics.critical` = 0 / 1 / 2 / 3 / 4 at milestones (L4 / L8 / L12 / L15).
2. **Activate** — `activateActiveBuff()` snapshots level mechanics onto an ActiveEffect  
   (`flags['mastery-system'].mechanics`) in `src/utils/active-buffs.ts`.
3. **Read** — `getActiveBuffCriticalTier(actor)` returns the highest maintained `mechanics.critical`.
4. **Resolve** — `resolveCriticalAttackModifier()` in `src/combat/critical-resolution.ts`  
   combines Active Buff tier, stone Crit charges, and Special Crit.
5. **Attack** — `executeAttackRollFromCard` in `src/chat/attack-roll-handler.ts` sets  
   `attackExplodeDiceOn78` from the resolver.
6. **Roll** — `src/dice/roll-handler.ts` explodes pool d8s on **7–8** when flagged.

## Critical(1) today

Critical(1) / Crit(1) = attack pool dice explode on natural **7–8** for the duration (buff) or per charge (stone). Stone charges are consumed; the buff is not.

## Critical(2–4)

| Aspect | Status |
|---|---|
| Stored on template / ActiveEffect | Yes (`critical: 2\|3\|4`) |
| Distinct mechanical resolution in Rules | **Missing** |
| Implemented differentiation | **None** — resolver flags `higherTierAwaitingRules` |

Rules (`active-buffs.md`, `players-guide.md`) define the grant table and Crit(1) explode behaviour. They do **not** define what Critical(2), Critical(3), or Critical(4) add beyond Critical(1).

## Files that read / write / evaluate Critical

| Role | Path |
|---|---|
| Write (catalog) | `src/utils/powers/templates/activeBuffs.ts` |
| Write (activate) | `src/utils/active-buffs.ts` |
| Read (tier) | `src/utils/active-buffs.ts` → `getActiveBuffCriticalTier` |
| Resolve (isolated) | `src/combat/critical-resolution.ts` |
| Evaluate (attack) | `src/chat/attack-roll-handler.ts` |
| Evaluate (dice) | `src/dice/roll-handler.ts` |
| Write (stone Crit) | `src/stones/stone-powers.ts` (`critRaises`) |
| Types | `src/types/item.d.ts` (`PowerMechanics.critical`) |
| Migration | `src/migrations/ab-critical-milestones-migration.ts` |

## Waiting Rules decision

**Status:** `requires-rule-decision`  
Do not invent Critical(2–4) scaling. Extend `resolveCriticalAttackModifier` centrally when Rules define it.
