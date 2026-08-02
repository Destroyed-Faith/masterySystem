# Critical(X) Resolution

## Definition

**Critical(X)** determines how many attacks per Round may receive Critical.

`X` does **not** change the Critical explode threshold.

For every attack that receives Critical:

- Attack Dice explode on **7 or 8**
- Exploding Attack Dice continue to explode as usual
- Damage Dice do **not** explode
- The explode threshold stays **7–8** for every value of X

| Grant | Meaning |
|---|---|
| Critical(1) | Critical on up to **1** attack this Round |
| Critical(2) | Critical on up to **2** attacks this Round |
| Critical(3) | Critical on up to **3** attacks this Round |
| Critical(4) | Critical on up to **4** attacks this Round |

Display and rules text continue to use **Critical(X)**.

## Data flow

1. **Catalog grant** — `ab-critical` stores `mechanics.critical` = 0 / 1 / 2 / 3 / 4  
   (`src/utils/powers/templates/activeBuffs.ts`)
2. **Activate** — `activateActiveBuff()` snapshots mechanics onto an ActiveEffect
3. **Read** — `getActiveBuffCriticalTier(actor)` → X
4. **Round quota** — `syncCriticalRoundQuota` sets remaining = X at each new combat round  
   (`RoundState.criticalQuota`)
5. **Resolve** — `resolveCriticalAttackModifier` enables explode-on-7–8 when quota or stone Crit charges remain
6. **Attack** — `attack-roll-handler` passes `attackExplodeDiceOn78` into `masteryRoll`
7. **Consume** — one application from Active Buff quota (preferred) or stone Crit charge
8. **Roll** — Attack pool d8s explode on 7–8; Damage Dice never explode from Critical

## Multiple sources

Stone Crit charges and Active Buff Critical may both supply applications. They never improve the explode threshold — it remains 7–8. Damage Dice never explode from either source.

## Files

| Role | Path |
|---|---|
| Catalog | `src/utils/powers/templates/activeBuffs.ts` |
| Read tier | `src/utils/active-buffs.ts` → `getActiveBuffCriticalTier` |
| Resolve / quota | `src/combat/critical-resolution.ts` |
| Round state | `src/combat/action-economy.ts` → `criticalQuota` |
| Attack consume | `src/chat/attack-roll-handler.ts` |
| Dice | `src/dice/roll-handler.ts` (`attackExplodeDiceOn78`) |
