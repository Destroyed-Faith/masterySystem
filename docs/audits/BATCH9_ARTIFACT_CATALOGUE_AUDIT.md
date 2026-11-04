# Batch 9 — Artifact Catalogue Audit (Phase A)

**Mode:** Read-only. No code corrections in this phase.
**Date:** 2026-11-04
**Canonical sources:** `docs/Rules/Canonical/Players_Handbook.md`, `Actives.md`, `Active_Buffs.md` (+ `AGENTS.md`).
**Code SoT sampled:** `src/utils/echo-artifacts.ts`, `echo-artifacts-unbound.ts`, `general-artifacts.ts`, `src/artifacts/echo-artifact-tree-builder.ts`, `progression-compiler.ts`, `artifact-visible-abilities.ts`, `src/packs/echo-artifacts/`, seed/resync modules.

## 1. Scope

- Canonical catalog keys audited: **33** (22 Echo + 11 General).
- Individual ability rows examined: **327** (compiled L1–10 progression rows; Primal Vestment has 7 printed stages because L1/4/7 are empty by design).
- Every Artifact Level 1–10 path was resolved via `buildEchoProgressionPicks` + `resolveFullLevelProgression`.
- Compendium Echo pack sources and world-seed generators were inventoried; **no pack rebuild / actor migration** performed.
- Tower Wizard packages are character-creation helpers, not separate Artifact trees; they were checked for legacy `ab-armor-aura` references (present in `tower-wizard-packages.ts`).

## 2. Status counts

| Status | Count |
|---|---:|
| MATCH | 111 |
| MISMATCH | 51 |
| MISSING | 0 |
| LEGACY | 9 |
| UNAUTHORIZED | 0 |
| APPROVED EXCEPTION | 21 |
| UNRESOLVED | 135 |
| **Total ability rows** | **327** |

## 3. Priority summary

### P0 — Rule break / wrong runtime effect

1. **Witch Staff (Root/Ruin/Blight)** L2/5/8 & L3/6/9 — Binding Circle / Main Spell replaced by Special Overdrive Buff + Damage Actives (`echo-artifacts-unbound.ts` / pick specs). PH ~3280–3291 requires special-only Root AoE + tradition Special.
2. **Dragon Claws Tail Sweep** L3/6/9 — ST Push 8/20/32 m expected; code uses AoE weapon Power template with wrong Push ranks (`echo-artifacts.ts` dragonClaws).
3. **Dragon Claws Rending Spiral II** — Lacerate(7) vs PH Lacerate(9).
4. **Oracle Frame L2/5/8** — Oracle Aid / `influence.cleanse` instead of Enemy Evade Reduction Support (PH ~2561–2567).
5. **Judicator Frame L3/6/9** — Influence Regeneration instead of Resolve Self-Healing Support (PH ~2608–2616).
6. **Sentinel Frame L5–L9 slot mapping** — pick compiler yields Pool/Healing at wrong levels; Special Negation Support missing from compiled table (PH ~2587–2593).
7. **Oracle Field / Draconic Roar / Moonlight Shadow** — still grant `ab-armor-aura` / `ab-damage-aura` as playable Buffs while PH marks them **Retired – redesign pending** (~7008).
8. **Stonebound Soles Anchoring Stance** — `ab-immovable-temp-hp` instead of Active Buff: Temporary HP (PH ~2347).
9. **Alchemist Stone** — `vitality.damageMaximization` instead of Potion Active Buff Empowerment Artifact Function (PH ~3396).

### P1 — Wrong progression / unlock

1. **Serpent Scales L2** Evade +6 (PL3) vs PH +8 (PL4); **L5/L8** Mobility Extension instead of Evade Buff upgrades (`stageTemplateIds` in `echo-artifacts.ts`).
2. **Sentinel Restoration** range not fixed at Artifact 8 m.
3. Several **General Artifact L10** nodes still use **True … Ultimate** instead of universal Awakening (PH ~8973).
4. **Ringchain** authored non-pick progression should be re-verified numerically against PH ~2237–2250 (Cleanse/Restoration pools).

### P2 — Data / resync

- Echo pack (`src/packs/echo-artifacts`, seed version 59) and world General trees will be stale after Phase B fixes.
- Embedded actor items need `resyncArtifactTreeToAllActors` / grant repair after corrections.
- Titan Scars affinity migration still references collapsed variant keys (aliases only).

### P3 — UI / naming

- Display names (e.g. Sentinel Restoration vs Single Restoration) differ from PH labels without always changing mechanics.
- `Soul Sigil` L10 “True Soul Sigil” GM-defined text is not universal Awakening.

## 4. Full matrix

| Artifact | Level | Ability | Technical Reference | Catalogue Source | PL/Rank (expected) | Expected | Implemented | Status |
|---|---:|---|---|---|---|---|---|---|
| Stonebound Soles | 1 | Anchoring Stance I | Immovable | ab-immovable-temp-hp | — | PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid). | ab-immovable-temp-hp :: For **2 Rounds** you become **Immovable** and gain **40 Temporary HP**. While Immovable you ignore P | **MISMATCH** |
| Stonebound Soles | 2 | Stone-Sure Step I | movement-safe-movement | movement-safe-movement | — | Safe Movement catalogue; distances 8/14/20 m. | movement-safe-movement :: Move up to **8 m** along a legal ground path. This movement does not provoke movement-triggered Reac | **MATCH** |
| Stonebound Soles | 3 | Stoneweave Guard I | empower-buff-armor | empower-buff-armor | — | Stoneweave Guard Armor Empowerment (PH ~2349). | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Stonebound Soles | 4 | Anchoring Stance II | Immovable | ab-immovable-temp-hp | — | PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid). | ab-immovable-temp-hp :: For **2 Rounds** you become **Immovable** and gain **220 Temporary HP**. While Immovable you ignore  | **MISMATCH** |
| Stonebound Soles | 5 | Stone-Sure Step II | movement-safe-movement | movement-safe-movement | — | Safe Movement catalogue; distances 8/14/20 m. | movement-safe-movement :: Move up to **14 m** along a legal ground path. This movement does not provoke movement-triggered Rea | **MATCH** |
| Stonebound Soles | 6 | Stoneweave Guard II | empower-buff-armor | empower-buff-armor | — | Stoneweave Guard Armor Empowerment (PH ~2349). | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Stonebound Soles | 7 | Anchoring Stance III | Immovable | ab-immovable-temp-hp | — | PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid). | ab-immovable-temp-hp :: For **2 Rounds** you become **Immovable** and gain **400 Temporary HP**. While Immovable you ignore  | **MISMATCH** |
| Stonebound Soles | 8 | Stone-Sure Step III | movement-safe-movement | movement-safe-movement | — | Safe Movement catalogue; distances 8/14/20 m. | movement-safe-movement :: Move up to **20 m** along a legal ground path. This movement does not provoke movement-triggered Rea | **MATCH** |
| Stonebound Soles | 9 | Stoneweave Guard III | empower-buff-armor | empower-buff-armor | — | Stoneweave Guard Armor Empowerment (PH ~2349). | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Stonebound Soles | 10 | Artifact Awakening | Artifact Level 10: Awakening (Stonebound Soles) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Stonebound Soles) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Elorian Stride | 1 | Otherworld Reflex I | reaction-evade | reaction-evade | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-evade :: Gain **+2 Evade** against the triggering attack. | **MATCH** |
| Elorian Stride | 2 | Elorian Cling I | movement-wall-walk | movement-wall-walk | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-wall-walk :: Move up to **10 m** along walls, ceilings, or similar solid surfaces. | **MATCH** |
| Elorian Stride | 3 | Crit Support I | agility.crit | agility.crit | — | Could not auto-classify; needs manual PH line check. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 2. Rank 1 must still be paid norma | **UNRESOLVED** |
| Elorian Stride | 4 | Otherworld Reflex II | reaction-evade | reaction-evade | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-evade :: Gain **+4 Evade** against the triggering attack. | **MATCH** |
| Elorian Stride | 5 | Elorian Cling II | movement-wall-walk | movement-wall-walk | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-wall-walk :: Move up to **25 m** along walls, ceilings, or similar solid surfaces. | **MATCH** |
| Elorian Stride | 6 | Crit Support II | agility.crit | agility.crit | — | Could not auto-classify; needs manual PH line check. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid n | **UNRESOLVED** |
| Elorian Stride | 7 | Otherworld Reflex III | reaction-evade | reaction-evade | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-evade :: Gain **+6 Evade** against the triggering attack. | **MATCH** |
| Elorian Stride | 8 | Elorian Cling III | movement-wall-walk | movement-wall-walk | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-wall-walk :: Move up to **28 m** along walls, ceilings, or similar solid surfaces. | **MATCH** |
| Elorian Stride | 9 | Crit Support III | agility.crit | agility.crit | — | Could not auto-classify; needs manual PH line check. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pai | **UNRESOLVED** |
| Elorian Stride | 10 | Artifact Awakening | Artifact Level 10: Awakening (Elorian Stride) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Elorian Stride) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Titan Scars | 1 | Titan Growth I | Artifact Function: Transformation (Growth 1) | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Artifact Function: Transformation (Growth 1) :: You may assume **Growth 1** using the universal Transformation rules. Grants one additional 0-penalt | **APPROVED EXCEPTION** |
| Titan Scars | 2 | Titan Might I | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 2. Rank 1 must still be paid norma | **UNRESOLVED** |
| Titan Scars | 3 | Titan Healing I | vitality.removeScar | vitality.removeScar | — | Could not auto-classify; needs manual PH line check. | vitality.removeScar :: Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 2. Rank 1 must still be pa | **UNRESOLVED** |
| Titan Scars | 4 | Titan Growth II | Artifact Function: Transformation (Growth 2) | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Artifact Function: Transformation (Growth 2) :: You may assume **Growth 2**. Grants two 0-penalty Growth Health Bars and +4 m Melee Reach; reduces P | **APPROVED EXCEPTION** |
| Titan Scars | 5 | Titan Might II | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid n | **UNRESOLVED** |
| Titan Scars | 6 | Titan Healing II | vitality.removeScar | vitality.removeScar | — | Could not auto-classify; needs manual PH line check. | vitality.removeScar :: Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 3. Ranks 1, 2 must still b | **UNRESOLVED** |
| Titan Scars | 7 | Titan Growth III | Artifact Function: Transformation (Growth 3) | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Artifact Function: Transformation (Growth 3) :: You may assume **Growth 3**. Grants three 0-penalty Growth Health Bars and +6 m Melee Reach; reduces | **APPROVED EXCEPTION** |
| Titan Scars | 8 | Titan Might III | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pai | **UNRESOLVED** |
| Titan Scars | 9 | Titan Healing III | vitality.removeScar | vitality.removeScar | — | Could not auto-classify; needs manual PH line check. | vitality.removeScar :: Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must stil | **UNRESOLVED** |
| Titan Scars | 10 | Artifact Awakening | Artifact Level 10: Awakening (Titan Scars) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Titan Scars) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Wyrm Scales (Heavy) | 1 | Dragon Wings I | movement-flight | movement-flight | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-flight :: Fly up to **6 m**. | **MATCH** |
| Wyrm Scales (Heavy) | 2 | Wyrm Scales I | ab-armor | ab-armor | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-armor :: Gain **+8 Armor**. | **MATCH** |
| Wyrm Scales (Heavy) | 3 | Armor Stone Support I | might.armor | might.armor | — | Could not auto-classify; needs manual PH line check. | might.armor :: Supports the Might Ability: Armor Stone Power and pre-fills Rank 2. Rank 1 must still be paid normal | **UNRESOLVED** |
| Wyrm Scales (Heavy) | 4 | Dragon Wings II | movement-flight | movement-flight | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-flight :: Fly up to **15 m**. | **MATCH** |
| Wyrm Scales (Heavy) | 5 | Wyrm Scales II | ab-armor | ab-armor | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-armor :: Gain **+20 Armor**. This replaces Wyrm Scales I. | **MATCH** |
| Wyrm Scales (Heavy) | 6 | Armor Stone Support II | might.armor | might.armor | — | Could not auto-classify; needs manual PH line check. | might.armor :: Supports the Might Ability: Armor Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid no | **UNRESOLVED** |
| Wyrm Scales (Heavy) | 7 | Dragon Wings III | movement-flight | movement-flight | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | movement-flight :: Fly up to **24 m**. | **MATCH** |
| Wyrm Scales (Heavy) | 8 | Wyrm Scales III | ab-armor | ab-armor | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-armor :: Gain **+32 Armor**. This replaces Wyrm Scales II. | **MATCH** |
| Wyrm Scales (Heavy) | 9 | Armor Stone Support III | might.armor | might.armor | — | Could not auto-classify; needs manual PH line check. | might.armor :: Supports the Might Ability: Armor Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid | **UNRESOLVED** |
| Wyrm Scales (Heavy) | 10 | Artifact Awakening | Artifact Level 10: Awakening (Wyrm Scales) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Wyrm Scales) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Serpent Scales | 1 | Dragon Wings I | movement-flight | movement-flight | Movement Flight PL 4 | 6 m | movement-flight :: Fly up to **6 m**. | **MATCH** |
| Serpent Scales | 2 | Serpent Evasion I | ab-evade | ab-evade | Active Buff Evade PL 4 | +8 Evade | ab-evade :: Gain **+6 Evade**. | **MISMATCH** |
| Serpent Scales | 3 | Evasion Stone Support I | agility.evade | agility.evade | Agility Evade Rank 2 | Rank 2 | agility.evade :: Supports the Agility Ability: Evade Stone Power and pre-fills Rank 2. Rank 1 must still be paid norm | **MATCH** |
| Serpent Scales | 4 | Dragon Wings II | movement-flight | movement-flight | Flight PL 10 | 15 m | movement-flight :: Fly up to **15 m**. | **MATCH** |
| Serpent Scales | 5 | Mobility Extension II | extend-buff-mobility | extend-buff-mobility | Active Buff Evade PL 10 | +20 Evade | extend-buff-mobility :: Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase t | **MISMATCH** |
| Serpent Scales | 6 | Evasion Stone Support II | agility.evade | agility.evade | Rank 3 | Rank 3 | agility.evade :: Supports the Agility Ability: Evade Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid  | **MATCH** |
| Serpent Scales | 7 | Dragon Wings III | movement-flight | movement-flight | Flight PL 16 | 24 m | movement-flight :: Fly up to **24 m**. | **MATCH** |
| Serpent Scales | 8 | Mobility Extension III | extend-buff-mobility | extend-buff-mobility | Active Buff Evade PL 16 | +32 Evade | extend-buff-mobility :: Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase t | **MISMATCH** |
| Serpent Scales | 9 | Evasion Stone Support III | agility.evade | agility.evade | Rank 4 | Rank 4 | agility.evade :: Supports the Agility Ability: Evade Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pa | **MATCH** |
| Serpent Scales | 10 | Artifact Awakening | Artifact Level 10: Awakening (Serpent Scales) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Serpent Scales) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Dragon Claws | 1 | Extra Damage Support I | might.meleeDamage | might.meleeDamage | Might Damage Rank 2 | Rank 2 | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 2. Rank 1 must still be paid norma | **MATCH** |
| Dragon Claws | 2 | Rending Spiral I | Lacerate(5) | active-melee-aoe-damage-t4 | Melee AoE Special Lacerate PL 4 | Lacerate(5); no damage | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **MATCH** |
| Dragon Claws | 3 | Tail Sweep I | Push(2) | active-melee-weapon-aoe | Melee Push PL 4 ST | Push 8 m + weapon; no AoE Power | active-melee-weapon-aoe :: Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in | **MISMATCH** |
| Dragon Claws | 4 | Extra Damage Support II | might.meleeDamage | might.meleeDamage | Rank 3 | Rank 3 | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid n | **MATCH** |
| Dragon Claws | 5 | Rending Spiral II | Lacerate(7) | active-melee-aoe-damage-t4 | Lacerate PL 10 | Lacerate(9) | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **MISMATCH** |
| Dragon Claws | 6 | Tail Sweep II | Push(6) | active-melee-weapon-aoe | Push PL 10 | Push 20 m | active-melee-weapon-aoe :: Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in | **MISMATCH** |
| Dragon Claws | 7 | Extra Damage Support III | might.meleeDamage | might.meleeDamage | Rank 4 | Rank 4 | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pai | **MATCH** |
| Dragon Claws | 8 | Rending Spiral III | Lacerate(10) | active-melee-aoe-damage-t4 | Lacerate PL 16 | Lacerate(10) | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **MATCH** |
| Dragon Claws | 9 | Tail Sweep III | Push(10) | active-melee-weapon-aoe | Push PL 16 | Push 32 m | active-melee-weapon-aoe :: Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in | **MISMATCH** |
| Dragon Claws | 10 | Artifact Awakening | Artifact Level 10: Awakening (Dragon Claws) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Dragon Claws) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Dragon Head | 1 | Breath Weapon I | active-melee-weapon-aoe | active-melee-weapon-aoe | Melee AoE Attack OR Ruin Special PL 4 | Dual mode; shared uses | active-melee-weapon-aoe :: Choose **Damage Breath** (Melee AoE Attack PL 4: **Bite Weapon Damage + 4d8** Power Damage, Cone 3 m | **MATCH** |
| Dragon Head | 2 | Draconic Roar I | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED | ab-armor-aura :: You and allies within **8 m** gain **+4 Armor**. | **LEGACY** |
| Dragon Head | 3 | Draconic Recovery I | stoneRefresh | authored/stone | Stone Refresh | 1 Stone | stoneRefresh :: Restore 1 spent Might Stone. | **MATCH** |
| Dragon Head | 4 | Breath Weapon II | active-melee-weapon-aoe | active-melee-weapon-aoe | PL 10 dual | 7d8/Ruin(9) | active-melee-weapon-aoe :: Choose **Damage Breath** (Melee AoE Attack PL 10: **Bite Weapon Damage + 7d8** Power Damage, Cone 6  | **MATCH** |
| Dragon Head | 5 | Draconic Roar II | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED | ab-armor-aura :: You and allies within **20 m** gain **+10 Armor**. | **LEGACY** |
| Dragon Head | 6 | Draconic Recovery II | stoneRefresh | authored/stone | Stone Refresh | 2 Stones | stoneRefresh :: Restore 2 spent Might Stones. | **MATCH** |
| Dragon Head | 7 | Breath Weapon III | active-melee-weapon-aoe | active-melee-weapon-aoe | PL 16 dual | 13d8/Ruin(10) | active-melee-weapon-aoe :: Choose **Damage Breath** (Melee AoE Attack PL 16: **Bite Weapon Damage + 13d8** Power Damage, Cone 8 | **MATCH** |
| Dragon Head | 8 | Draconic Roar III | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED | ab-armor-aura :: You and allies within **32 m** gain **+16 Armor**. | **LEGACY** |
| Dragon Head | 9 | Draconic Recovery III | stoneRefresh | authored/stone | Stone Refresh | 4 Stones | stoneRefresh :: Restore 4 spent Might Stones. | **MATCH** |
| Dragon Head | 10 | Artifact Awakening | Artifact Level 10: Awakening (Dragon Head) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Dragon Head) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Sentinel Frame | 1 | Sentinel Restoration I | active-ranged-health-level-heal | active-ranged-health-level-heal | Ranged ST Restoration PL 4; range 8 m | 2 Bars; 8 m | active-ranged-health-level-heal :: Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this  | **MISMATCH** |
| Sentinel Frame | 2 | Resolve Core I | stonePool | authored/stone | Stone Pool Resolve (2) | Pool 2 | stonePool :: After each Safe Haven Rest, store 2 Resolve Stones. These Stones may only be used for this Artifact' | **MATCH** |
| Sentinel Frame | 3 | Healing Support I | resolve.healing | resolve.healing | Resolve: Healing Rank 2 | Rank 2 | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 2. Rank 1 must still be paid no | **MATCH** |
| Sentinel Frame | 4 | Sentinel Restoration II | active-ranged-health-level-heal | active-ranged-health-level-heal | Restoration PL 10 | 6 Bars | active-ranged-health-level-heal :: Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this  | **MISMATCH** |
| Sentinel Frame | 5 | Resolve Core II | stonePool | authored/stone | Resolve: Special Negation Rank 3 | Rank 3 Negation | stonePool :: After each Safe Haven Rest, store 4 Resolve Stones. These Stones may only be used for this Artifact' | **MISMATCH** |
| Sentinel Frame | 6 | Healing Support II | resolve.healing | resolve.healing | Pool 4 | Pool 4 | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pai | **MISMATCH** |
| Sentinel Frame | 7 | Sentinel Restoration III | active-ranged-health-level-heal | active-ranged-health-level-heal | Restoration PL 16 | 10 Bars | active-ranged-health-level-heal :: Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this  | **MISMATCH** |
| Sentinel Frame | 8 | Resolve Core III | stonePool | authored/stone | Healing Rank 4 | Rank 4 | stonePool :: After each Safe Haven Rest, store 8 Resolve Stones. These Stones may only be used for this Artifact' | **MISMATCH** |
| Sentinel Frame | 9 | Healing Support III | resolve.healing | resolve.healing | Special Negation Rank 4 | Rank 4 Negation | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be  | **UNRESOLVED** |
| Sentinel Frame | 10 | Artifact Awakening | Artifact Level 10: Awakening (Sentinel Frame) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Sentinel Frame) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Judicator Frame | 1 | Armor Hasten I | empower-buff-armor | empower-buff-armor | Artifact Function Armor Empowerment +1/+1 | APPROVED EXCEPTION | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Judicator Frame | 2 | Wits Core I | stonePool | authored/stone | Stone Pool Wits (2) | Pool 2 | stonePool :: After each Safe Haven Rest, store 2 Wits Stones. These Stones may only be used for this Artifact's l | **MATCH** |
| Judicator Frame | 3 | Regeneration Support I | influence.colorlessRecovery | influence.colorlessRecovery | Resolve: Healing Rank 2; Self only | Resolve Healing self | influence.colorlessRecovery :: Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 2. Rank 1 must sti | **MISMATCH** |
| Judicator Frame | 4 | Armor Hasten II | empower-buff-armor | empower-buff-armor | +2 PL / +2 rounds | Empowerment II | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Judicator Frame | 5 | Wits Core II | stonePool | authored/stone | Pool 4 | Pool 4 | stonePool :: After each Safe Haven Rest, store 4 Wits Stones. These Stones may only be used for this Artifact's l | **MATCH** |
| Judicator Frame | 6 | Regeneration Support II | influence.colorlessRecovery | influence.colorlessRecovery | Healing Rank 3 Self | Rank 3 | influence.colorlessRecovery :: Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 3. Ranks 1, 2 must | **MISMATCH** |
| Judicator Frame | 7 | Armor Hasten III | empower-buff-armor | empower-buff-armor | +3/+3 | Empowerment III | empower-buff-armor :: When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff | **APPROVED EXCEPTION** |
| Judicator Frame | 8 | Wits Core III | stonePool | authored/stone | Pool 8 | Pool 8 | stonePool :: After each Safe Haven Rest, store 8 Wits Stones. These Stones may only be used for this Artifact's l | **MATCH** |
| Judicator Frame | 9 | Regeneration Support III | influence.colorlessRecovery | influence.colorlessRecovery | Healing Rank 4 Self | Rank 4 | influence.colorlessRecovery :: Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 m | **MISMATCH** |
| Judicator Frame | 10 | Artifact Awakening | Artifact Level 10: Awakening (Judicator Frame) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Judicator Frame) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Oracle Frame | 1 | Oracle Field I | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED; do not grant playable Armor Aura | ab-armor-aura :: You and allies within **2 m** gain **+1 Armor**. | **LEGACY** |
| Oracle Frame | 2 | Oracle Aid I | influence.cleanse | influence.cleanse | Influence: Enemy Evade Reduction Rank 2 | Stone Support Evade Reduction | influence.cleanse :: Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 2. Rank 1 must still be paid  | **MISMATCH** |
| Oracle Frame | 3 | Influence Core I | stonePool | authored/stone | Stone Pool Influence (2) | Pool 2 | stonePool :: After each Safe Haven Rest, store 2 Influence Stones. These Stones may only be used for this Artifac | **MATCH** |
| Oracle Frame | 4 | Oracle Field III | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED | ab-armor-aura :: You and allies within **6 m** gain **+3 Armor**. | **LEGACY** |
| Oracle Frame | 5 | Oracle Aid II | influence.cleanse | influence.cleanse | Evade Reduction Rank 3 | Rank 3 | influence.cleanse :: Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be p | **MISMATCH** |
| Oracle Frame | 6 | Influence Core II | stonePool | authored/stone | Pool 4 | Pool 4 | stonePool :: After each Safe Haven Rest, store 4 Influence Stones. These Stones may only be used for this Artifac | **MATCH** |
| Oracle Frame | 7 | Oracle Field V | ab-armor-aura | ab-armor-aura | Legacy Aura — redesign pending | RETIRED | ab-armor-aura :: You and allies within **10 m** gain **+5 Armor**. | **LEGACY** |
| Oracle Frame | 8 | Oracle Aid III | influence.cleanse | influence.cleanse | Evade Reduction Rank 4 | Rank 4 | influence.cleanse :: Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still b | **MISMATCH** |
| Oracle Frame | 9 | Influence Core III | stonePool | authored/stone | Pool 8 | Pool 8 | stonePool :: After each Safe Haven Rest, store 8 Influence Stones. These Stones may only be used for this Artifac | **MATCH** |
| Oracle Frame | 10 | Artifact Awakening | Artifact Level 10: Awakening (Oracle Frame) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Oracle Frame) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Hollow Crown | 1 | Deathless Body I | Hollow Crown Passive: Deathless Body I | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown Passive: Deathless Body I :: Shift Health Penalties 2 steps toward Healthy. Maximum Health Penalty 20%. | **APPROVED EXCEPTION** |
| Hollow Crown | 2 | Life Absorption I | Hollow Crown: Life Absorption I | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Life Absorption I :: Drain living creatures for Absorbed Vitality Stones. Maximum 2 Stones per Safe Haven Rest. Not usabl | **APPROVED EXCEPTION** |
| Hollow Crown | 3 | Hollow Stillness I | Hollow Crown: Hollow Stillness I | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Hollow Stillness I :: Advantage on Attribute Checks to resist Fear, Pain, Poison, Disease, Suffocation, Exhaustion, and li | **APPROVED EXCEPTION** |
| Hollow Crown | 4 | Deathless Body II | Hollow Crown Passive: Deathless Body II | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown Passive: Deathless Body II :: Shift Health Penalties 3 steps. Maximum Health Penalty 10%. Replaces Deathless Body I. | **APPROVED EXCEPTION** |
| Hollow Crown | 5 | Life Absorption II | Hollow Crown: Life Absorption II | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Life Absorption II :: Maximum 4 Absorbed Vitality Stones per Safe Haven Rest. Replaces Life Absorption I. | **APPROVED EXCEPTION** |
| Hollow Crown | 6 | Hollow Stillness II | Hollow Crown: Hollow Stillness II | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Hollow Stillness II :: Keep Advantage and add +1d8 to the Pool of those Attribute Checks. Replaces Hollow Stillness I. | **APPROVED EXCEPTION** |
| Hollow Crown | 7 | Deathless Body III | Hollow Crown Passive: Deathless Body III | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown Passive: Deathless Body III :: Shift Health Penalties 4 steps. Maximum Health Penalty 0%. Replaces Deathless Body II. | **APPROVED EXCEPTION** |
| Hollow Crown | 8 | Life Absorption III | Hollow Crown: Life Absorption III | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Life Absorption III :: Maximum 8 Absorbed Vitality Stones per Safe Haven Rest. Replaces Life Absorption II. | **APPROVED EXCEPTION** |
| Hollow Crown | 9 | Hollow Stillness III | Hollow Crown: Hollow Stillness III | authored/stone | — | Custom Artifact Function / authored Echo row (verify against PH section for this artifact). | Hollow Crown: Hollow Stillness III :: Keep Advantage and increase the Pool bonus to +2d8. Replaces Hollow Stillness II. | **APPROVED EXCEPTION** |
| Hollow Crown | 10 | Artifact Awakening | Artifact Level 10: Awakening (Hollow Crown) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Hollow Crown) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Ringchain of Kept Names | 1 | Kept from Sight I | influence.notATarget | influence.notATarget | — | Could not auto-classify; needs manual PH line check. | influence.notATarget :: Pre-fill Rank 2. Rank 1 must still be paid normally. | **UNRESOLVED** |
| Ringchain of Kept Names | 2 | Burden Lifted I | Ranged Single Target Cleanse (PL 4) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Ranged Single Target Cleanse (PL 4) :: Remove up to 6 total points of eligible negative Special value from one creature. | **UNRESOLVED** |
| Ringchain of Kept Names | 3 | Hearth Circle I | Melee AoE Restoration (PL 4) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Melee AoE Restoration (PL 4) :: Restore up to 2 Scarred Health Bars per Safe Haven Rest among allies within 2 m (full HP each). The  | **UNRESOLVED** |
| Ringchain of Kept Names | 4 | Remembered Hands I | Ranged Single Target Restoration (PL 10) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Ranged Single Target Restoration (PL 10) :: Restore up to 6 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). Do | **UNRESOLVED** |
| Ringchain of Kept Names | 5 | Kept from Sight II | influence.notATarget | influence.notATarget | — | Could not auto-classify; needs manual PH line check. | influence.notATarget :: Pre-fill Rank 3. Ranks 1 and 2 must still be paid normally. | **UNRESOLVED** |
| Ringchain of Kept Names | 6 | Burden Lifted II | Ranged Single Target Cleanse (PL 10) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Ranged Single Target Cleanse (PL 10) :: Remove up to 10 total points of eligible negative Special value from one creature. This replaces Bur | **UNRESOLVED** |
| Ringchain of Kept Names | 7 | Remembered Hands II | Ranged Single Target Restoration (PL 16) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Ranged Single Target Restoration (PL 16) :: Restore up to 10 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). D | **UNRESOLVED** |
| Ringchain of Kept Names | 8 | Hearth Circle II | Melee AoE Restoration (PL 16) | authored/stone | — | Could not auto-classify; needs manual PH line check. | Melee AoE Restoration (PL 16) :: Restore up to 9 Scarred Health Bars per Safe Haven Rest among allies within 4 m (full HP each). The  | **UNRESOLVED** |
| Ringchain of Kept Names | 9 | Kept from Sight III | influence.notATarget | influence.notATarget | — | Could not auto-classify; needs manual PH line check. | influence.notATarget :: Pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally. | **UNRESOLVED** |
| Ringchain of Kept Names | 10 | Artifact Awakening | Artifact Level 10: Awakening (Ringchain of Kept Names) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Ringchain of Kept Names) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Predator Crown | 1 | Predator Stone I | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 2. Rank 1 must still be paid norma | **UNRESOLVED** |
| Predator Crown | 2 | Retaliatory Bite I | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **4d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 3 | Red Hunt I | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+4d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 4 | Predator Stone II | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid n | **UNRESOLVED** |
| Predator Crown | 5 | Retaliatory Bite II | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **10d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 6 | Red Hunt II | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+10d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 7 | Predator Stone III | might.meleeDamage | might.meleeDamage | — | Could not auto-classify; needs manual PH line check. | might.meleeDamage :: Supports the Might Ability: Damage Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pai | **UNRESOLVED** |
| Predator Crown | 8 | Retaliatory Bite III | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **16d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 9 | Red Hunt III | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+16d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 10 | Artifact Awakening | Artifact Level 10: Awakening (Predator Crown) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Predator Crown) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Predator Crown | 1 | Predator Stone I | wits.initiativeBoost | wits.initiativeBoost | — | Could not auto-classify; needs manual PH line check. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Predator Crown | 2 | Retaliatory Bite I | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **4d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 3 | Red Hunt I | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+4d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 4 | Predator Stone II | wits.initiativeBoost | wits.initiativeBoost | — | Could not auto-classify; needs manual PH line check. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Predator Crown | 5 | Retaliatory Bite II | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **10d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 6 | Red Hunt II | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+10d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 7 | Predator Stone III | wits.initiativeBoost | wits.initiativeBoost | — | Could not auto-classify; needs manual PH line check. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Predator Crown | 8 | Retaliatory Bite III | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **16d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 9 | Red Hunt III | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+16d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 10 | Artifact Awakening | Artifact Level 10: Awakening (Predator Crown) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Predator Crown) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Predator Crown | 1 | Predator Stone I | intellect.raises | intellect.raises | — | Could not auto-classify; needs manual PH line check. | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 2. Rank 1 must still be paid n | **UNRESOLVED** |
| Predator Crown | 2 | Retaliatory Bite I | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **4d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 3 | Red Hunt I | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+4d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 4 | Predator Stone II | intellect.raises | intellect.raises | — | Could not auto-classify; needs manual PH line check. | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pa | **UNRESOLVED** |
| Predator Crown | 5 | Retaliatory Bite II | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **10d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 6 | Red Hunt II | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+10d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 7 | Predator Stone III | intellect.raises | intellect.raises | — | Could not auto-classify; needs manual PH line check. | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be | **UNRESOLVED** |
| Predator Crown | 8 | Retaliatory Bite III | reaction-counter-damage | reaction-counter-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | reaction-counter-damage :: Deal **16d8 damage** to the triggering creature. | **MATCH** |
| Predator Crown | 9 | Red Hunt III | ab-damage | ab-damage | — | Echo ability maps to existing catalogue/stone id; spot-checked against PH family rules. Full numeric re-check still recommended for Phase B. | ab-damage :: Your attacks deal **+16d8** damage while the buff is active. | **MATCH** |
| Predator Crown | 10 | Artifact Awakening | Artifact Level 10: Awakening (Predator Crown) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Predator Crown) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Primal Vestment | 2 | Flesh Remembers I | resolve.healing | resolve.healing | — | Could not auto-classify; needs manual PH line check. | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 2. Rank 1 must still be paid no | **UNRESOLVED** |
| Primal Vestment | 3 | Rage Unbound I | generic.extraAttack | generic.extraAttack | — | Could not auto-classify; needs manual PH line check. | generic.extraAttack :: Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 2. Rank 1 must still be paid | **UNRESOLVED** |
| Primal Vestment | 5 | Flesh Remembers II | resolve.healing | resolve.healing | — | Could not auto-classify; needs manual PH line check. | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pai | **UNRESOLVED** |
| Primal Vestment | 6 | Rage Unbound II | generic.extraAttack | generic.extraAttack | — | Could not auto-classify; needs manual PH line check. | generic.extraAttack :: Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be  | **UNRESOLVED** |
| Primal Vestment | 8 | Flesh Remembers III | resolve.healing | resolve.healing | — | Could not auto-classify; needs manual PH line check. | resolve.healing :: Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be  | **UNRESOLVED** |
| Primal Vestment | 9 | Rage Unbound III | generic.extraAttack | generic.extraAttack | — | Could not auto-classify; needs manual PH line check. | generic.extraAttack :: Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still  | **UNRESOLVED** |
| Primal Vestment | 10 | Artifact Awakening | Artifact Level 10: Awakening (Primal Vestment) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Primal Vestment) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Root Staff | 1 | Witch Stone I | intellect.raises | intellect.raises | Intellect Raises Rank 2 | Rank 2 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 2. Rank 1 must still be paid n | **MATCH** |
| Root Staff | 2 | Covenant Overdrive I | Slow(1) | ab-special-overdrive | Ranged AoE Special Root PL 4 | Root(3); special-only | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This | **MISMATCH** |
| Root Staff | 3 | Rootbinding I | Slow(6) | active-ranged-damage-t4 | Ranged ST Special Weaken PL 4 | Weaken(2); special-only | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **MISMATCH** |
| Root Staff | 4 | Witch Stone II | intellect.raises | intellect.raises | Raises Rank 3 | Rank 3 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pa | **MATCH** |
| Root Staff | 5 | Covenant Overdrive II | Slow(2) | ab-special-overdrive | Root PL 10 | Root(5) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or * | **MISMATCH** |
| Root Staff | 6 | Rootbinding II | Slow(10) | active-ranged-damage-t4 | Weaken PL 10 | Weaken(3) | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **MISMATCH** |
| Root Staff | 7 | Witch Stone III | intellect.raises | intellect.raises | Raises Rank 4 | Rank 4 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be | **MATCH** |
| Root Staff | 8 | Covenant Overdrive III | Slow(4) | ab-special-overdrive | Root PL 16 | Root(7) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or * | **MISMATCH** |
| Root Staff | 9 | Rootbinding III | Slow(13) | active-ranged-damage-t4 | Weaken PL 16 | Weaken(4) | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **MISMATCH** |
| Root Staff | 10 | Artifact Awakening | Artifact Level 10: Awakening (Witch Staff) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Witch Staff) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Ruin Staff | 1 | Witch Stone I | intellect.raises | intellect.raises | Intellect Raises Rank 2 | Rank 2 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 2. Rank 1 must still be paid n | **MATCH** |
| Ruin Staff | 2 | Covenant Overdrive I | Hex(1) | ab-special-overdrive | Ranged AoE Special Root PL 4 | Root(3) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This | **MISMATCH** |
| Ruin Staff | 3 | Ruinous Word I | Hex(4) | active-ranged-damage-t5 | Ranged ST Special Ruin PL 4 | Ruin(6); special-only | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Ruin Staff | 4 | Witch Stone II | intellect.raises | intellect.raises | Raises Rank 3 | Rank 3 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pa | **MATCH** |
| Ruin Staff | 5 | Covenant Overdrive II | Hex(2) | ab-special-overdrive | Root PL 10 | Root(5) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or * | **MISMATCH** |
| Ruin Staff | 6 | Ruinous Word II | Hex(8) | active-ranged-damage-t5 | Ruin PL 10 | Ruin(10) | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Ruin Staff | 7 | Witch Stone III | intellect.raises | intellect.raises | Raises Rank 4 | Rank 4 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be | **MATCH** |
| Ruin Staff | 8 | Covenant Overdrive III | Hex(4) | ab-special-overdrive | Root PL 16 | Root(7) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or * | **MISMATCH** |
| Ruin Staff | 9 | Ruinous Word III | Hex(10) | active-ranged-damage-t5 | Ruin PL 16 | Ruin(13) | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Ruin Staff | 10 | Artifact Awakening | Artifact Level 10: Awakening (Witch Staff) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Witch Staff) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Blight Staff | 1 | Witch Stone I | intellect.raises | intellect.raises | Intellect Raises Rank 2 | Rank 2 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 2. Rank 1 must still be paid n | **MATCH** |
| Blight Staff | 2 | Covenant Overdrive I | Corrode(1) | ab-special-overdrive | Ranged AoE Special Root PL 4 | Root(3) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This | **MISMATCH** |
| Blight Staff | 3 | Blightcall I | Corrode(4) | active-ranged-damage-t5 | Ranged ST Special Blight PL 4 | Blight(7); special-only | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Blight Staff | 4 | Witch Stone II | intellect.raises | intellect.raises | Raises Rank 3 | Rank 3 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be pa | **MATCH** |
| Blight Staff | 5 | Covenant Overdrive II | Corrode(2) | ab-special-overdrive | Root PL 10 | Root(5) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or * | **MISMATCH** |
| Blight Staff | 6 | Blightcall II | Corrode(8) | active-ranged-damage-t5 | Blight PL 10 | Blight(12) | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Blight Staff | 7 | Witch Stone III | intellect.raises | intellect.raises | Raises Rank 4 | Rank 4 | intellect.raises :: Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be | **MATCH** |
| Blight Staff | 8 | Covenant Overdrive III | Corrode(4) | ab-special-overdrive | Root PL 16 | Root(7) | ab-special-overdrive :: On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or * | **MISMATCH** |
| Blight Staff | 9 | Blightcall III | Corrode(10) | active-ranged-damage-t5 | Blight PL 16 | Blight(15) | active-ranged-damage-t5 :: Deal **+2d8 damage** on hit. | **MISMATCH** |
| Blight Staff | 10 | Artifact Awakening | Artifact Level 10: Awakening (Witch Staff) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Witch Staff) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Alchemist Coat | 1 | Red Potion I | ab-damage | ab-damage | — | Red Potion → Active Buff Damage. | ab-damage :: Your attacks deal **+4d8** damage while the buff is active. | **MATCH** |
| Alchemist Coat | 2 | Alchemist Stone I | vitality.damageMaximization | vitality.damageMaximization | — | PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization. | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 2. Rank 1 must still be p | **MISMATCH** |
| Alchemist Coat | 3 | Black Potion I | ab-critical | ab-critical | — | Black Potion → Active Buff Critical. | ab-critical :: Gain **Critical(1)** (1 designated roll per combat; natural 7s and 8s explode). | **MATCH** |
| Alchemist Coat | 4 | Red Potion II | ab-damage | ab-damage | — | Red Potion → Active Buff Damage. | ab-damage :: Your attacks deal **+10d8** damage while the buff is active. | **MATCH** |
| Alchemist Coat | 5 | Alchemist Stone II | vitality.damageMaximization | vitality.damageMaximization | — | PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization. | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **MISMATCH** |
| Alchemist Coat | 6 | Black Potion II | ab-critical | ab-critical | — | Black Potion → Active Buff Critical. | ab-critical :: Gain **Critical(2)** (2 designated rolls per combat; natural 7s and 8s explode). | **MATCH** |
| Alchemist Coat | 7 | Red Potion III | ab-damage | ab-damage | — | Red Potion → Active Buff Damage. | ab-damage :: Your attacks deal **+16d8** damage while the buff is active. | **MATCH** |
| Alchemist Coat | 8 | Alchemist Stone III | vitality.damageMaximization | vitality.damageMaximization | — | PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization. | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **MISMATCH** |
| Alchemist Coat | 9 | Black Potion III | ab-critical | ab-critical | — | Black Potion → Active Buff Critical. | ab-critical :: Gain **Critical(4)** (4 designated rolls per combat; natural 7s and 8s explode). | **MATCH** |
| Alchemist Coat | 10 | Artifact Awakening | Artifact Level 10: Awakening (Alchemist Coat) | authored/stone | — | Universal Awakening. | Artifact Level 10: Awakening (Alchemist Coat) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Green Warden Mantle | 1 | Thorns I | ab-thorns | ab-thorns | Active Buff Thorns PL 4 | catalogue Thorns | ab-thorns :: Gain **Thorns 4d8**. When you take final HP damage, deal that much (capped by the loss) to the sourc | **MATCH** |
| Green Warden Mantle | 2 | Warden's Guard I | reaction-ally-armor | reaction-ally-armor | Reaction Ally Armor PL 4 | +7 Armor | reaction-ally-armor :: The ally gains **+7 Armor** against the triggering attack or damage instance. | **MATCH** |
| Green Warden Mantle | 3 | Green Warden Stone I | resolve.ward | resolve.ward | Resolve Special Negation Rank 2 | Rank 2 | resolve.ward :: Supports the Resolve Ability: Special Negation Stone Power and pre-fills Rank 2. Rank 1 must still b | **MATCH** |
| Green Warden Mantle | 4 | Thorns II | ab-thorns | ab-thorns | Thorns PL 10 | PL 10 | ab-thorns :: Gain **Thorns 10d8**. When you take final HP damage, deal that much (capped by the loss) to the sour | **MATCH** |
| Green Warden Mantle | 5 | Warden's Guard II | reaction-ally-armor | reaction-ally-armor | Ally Armor PL 10 | +19 | reaction-ally-armor :: The ally gains **+19 Armor** against the triggering attack or damage instance. | **MATCH** |
| Green Warden Mantle | 6 | Green Warden Stone II | resolve.ward | resolve.ward | Special Negation Rank 3 | Rank 3 | resolve.ward :: Supports the Resolve Ability: Special Negation Stone Power and pre-fills Rank 3. Ranks 1, 2 must sti | **MATCH** |
| Green Warden Mantle | 7 | Thorns III | ab-thorns | ab-thorns | Thorns PL 16 | PL 16 | ab-thorns :: Gain **Thorns 16d8**. When you take final HP damage, deal that much (capped by the loss) to the sour | **MATCH** |
| Green Warden Mantle | 8 | Warden's Guard III | reaction-ally-armor | reaction-ally-armor | Ally Armor PL 16 | +31 | reaction-ally-armor :: The ally gains **+31 Armor** against the triggering attack or damage instance. | **MATCH** |
| Green Warden Mantle | 9 | Green Warden Stone III | resolve.ward | resolve.ward | Special Negation Rank 4 | Rank 4 | resolve.ward :: Supports the Resolve Ability: Special Negation Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must  | **MATCH** |
| Green Warden Mantle | 10 | Artifact Awakening | Artifact Level 10: Awakening (Green Warden Mantle) | authored/stone | Universal Awakening | Awakening | Artifact Level 10: Awakening (Green Warden Mantle) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Hunter's Scourge | 1 | Scourge Strike I | Limited | active-melee-limited-single | Limited Melee Single Target Attack (PL 4) | 32d8 Power + weapon once; global Limited | active-melee-limited-single :: Use **Limited Melee Single Target Attack** (PL 4) with Hunter's Scourge: on hit, deal Weapon Damage  | **MATCH** |
| Hunter's Scourge | 2 | Maximization Support I | vitality.damageMaximization | vitality.damageMaximization | Vitality: Maximization Rank 2 | APPROVED EXCEPTION Hand→Vitality | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 2. Rank 1 must still be p | **APPROVED EXCEPTION** |
| Hunter's Scourge | 3 | Unmask the Prey I | Expose(5) | active-melee-instant-special-t6 | Melee ST Special: Expose (PL 4) | Expose(5); special-only | active-melee-instant-special-t6 :: Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(5)**. **Special-only:** no Pow | **MATCH** |
| Hunter's Scourge | 4 | Scourge Strike II | Limited | active-melee-limited-single | Limited Melee ST (PL 10) | 80d8; replaces I | active-melee-limited-single :: Use **Limited Melee Single Target Attack** (PL 10) with Hunter's Scourge: on hit, deal Weapon Damage | **MATCH** |
| Hunter's Scourge | 5 | Maximization Support II | vitality.damageMaximization | vitality.damageMaximization | Maximization Rank 3 | 3 shared uses | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **APPROVED EXCEPTION** |
| Hunter's Scourge | 6 | Unmask the Prey II | Expose(8) | active-melee-instant-special-t6 | Expose (PL 10) | Expose(8) | active-melee-instant-special-t6 :: Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(8)**. **Special-only:** no Pow | **MATCH** |
| Hunter's Scourge | 7 | Scourge Strike III | Limited | active-melee-limited-single | Limited Melee ST (PL 16) | 128d8 | active-melee-limited-single :: Use **Limited Melee Single Target Attack** (PL 16) with Hunter's Scourge: on hit, deal Weapon Damage | **MATCH** |
| Hunter's Scourge | 8 | Maximization Support III | vitality.damageMaximization | vitality.damageMaximization | Maximization Rank 4 | 4 shared uses | vitality.damageMaximization :: Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **APPROVED EXCEPTION** |
| Hunter's Scourge | 9 | Unmask the Prey III | Expose(10) | active-melee-instant-special-t6 | Expose (PL 16) | Expose(10) | active-melee-instant-special-t6 :: Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(10)**. **Special-only:** no Po | **MATCH** |
| Hunter's Scourge | 10 | Artifact Awakening | Artifact Level 10: Awakening (Hunter's Scourge) | authored/stone | Universal Awakening | Universal Awakening | Artifact Level 10: Awakening (Hunter's Scourge) :: Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and St | **MATCH** |
| Moonlight Greatsword | 1 | Moonlight Mending I | active-ranged-single-heal | active-ranged-single-heal | — | Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required. | active-ranged-single-heal :: Heal one creature for **5d8 HP** in its current Health Bar; does not restore Scarred Health Bars. | **UNRESOLVED** |
| Moonlight Greatsword | 2 | Moonlight Judgment I | Limited, Spell | active-ranged-limited-aoe | — | Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime. | active-ranged-limited-aoe :: Cast **Limited Ranged AoE Attack** (PL 4) as one damaging Spell AoE; printed **+3d8 Power Damage** b | **UNRESOLVED** |
| Moonlight Greatsword | 3 | Moonlight Shadow I | ab-damage-aura | ab-damage-aura | — | PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template. | ab-damage-aura :: At the end of each of your Turns, enemies in a **2 m** aura take **3d8 damage**. Each creature once  | **LEGACY** |
| Moonlight Greatsword | 4 | Moonlight Mending II | active-ranged-single-heal | active-ranged-single-heal | — | Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required. | active-ranged-single-heal :: Heal one creature for **12d8 HP** in its current Health Bar; does not restore Scarred Health Bars. | **UNRESOLVED** |
| Moonlight Greatsword | 5 | Moonlight Judgment II | Limited, Spell | active-ranged-limited-aoe | — | Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime. | active-ranged-limited-aoe :: Cast **Limited Ranged AoE Attack** (PL 10) as one damaging Spell AoE; printed **+4d8 Power Damage**  | **UNRESOLVED** |
| Moonlight Greatsword | 6 | Moonlight Shadow II | ab-damage-aura | ab-damage-aura | — | PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template. | ab-damage-aura :: At the end of each of your Turns, enemies in a **3 m** aura take **7d8 damage**. Replaces Moonlight  | **LEGACY** |
| Moonlight Greatsword | 7 | Moonlight Mending III | active-ranged-single-heal | active-ranged-single-heal | — | Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required. | active-ranged-single-heal :: Heal one creature for **20d8 HP** in its current Health Bar; does not restore Scarred Health Bars. | **UNRESOLVED** |
| Moonlight Greatsword | 8 | Moonlight Judgment III | Limited, Spell | active-ranged-limited-aoe | — | Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime. | active-ranged-limited-aoe :: Cast **Limited Ranged AoE Attack** (PL 16) as one damaging Spell AoE; printed **+8d8 Power Damage**  | **UNRESOLVED** |
| Moonlight Greatsword | 9 | Moonlight Shadow III | ab-damage-aura | ab-damage-aura | — | PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template. | ab-damage-aura :: At the end of each of your Turns, enemies in a **4 m** aura take **11d8 damage**. Replaces Moonlight | **LEGACY** |
| Moonlight Greatsword | 10 | Artifact Awakening | Artifact Level 10: Awakening (Moonlight Greatsword) | authored/stone | — | Universal Awakening (no True Ultimate). | Artifact Level 10: Awakening (Moonlight Greatsword) :: Apply the universal Artifact Awakening benefits to this Artifact's highest granted Powers, supported | **MATCH** |
| Soul Sigil | 1 | Soul Shell I | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Soul Sigil | 2 | Uncanny Soul I | reaction-phasing | reaction-phasing | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-phasing :: If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2  | **UNRESOLVED** |
| Soul Sigil | 3 | Resting Soul I | active-melee-health-level-heal | active-melee-health-level-heal | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-health-level-heal :: Restore up to **3 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. N | **UNRESOLVED** |
| Soul Sigil | 4 | Soul Shell II | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Soul Sigil | 5 | Uncanny Soul II | reaction-phasing | reaction-phasing | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-phasing :: If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3  | **UNRESOLVED** |
| Soul Sigil | 6 | Resting Soul II | active-melee-health-level-heal | active-melee-health-level-heal | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-health-level-heal :: Restore up to **7 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. T | **UNRESOLVED** |
| Soul Sigil | 7 | Soul Shell III | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Soul Sigil | 8 | Uncanny Soul III | reaction-phasing | reaction-phasing | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-phasing :: If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **4  | **UNRESOLVED** |
| Soul Sigil | 9 | Resting Soul III | active-melee-health-level-heal | active-melee-health-level-heal | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-health-level-heal :: Restore up to **12 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest.  | **UNRESOLVED** |
| Soul Sigil | 10 | True Soul Sigil | True Soul Sigil | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Soul Sigil :: The Soul Sigil fully awakens. Choose or define one final Soul effect with GM approval. | **MISMATCH** |
| Frostbound Returning Axe | 1 | Stormpower I | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Frostbound Returning Axe | 2 | Frost Throw I | Slow(6) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Frostbound Returning Axe | 3 | Rainshield I | reaction-special-increase | reaction-special-increase | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-special-increase :: If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that | **UNRESOLVED** |
| Frostbound Returning Axe | 4 | Stormpower II | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Frostbound Returning Axe | 5 | Frost Throw II | Slow(10) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Frostbound Returning Axe | 6 | Rainshield II | reaction-special-increase | reaction-special-increase | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-special-increase :: If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that | **UNRESOLVED** |
| Frostbound Returning Axe | 7 | Stormpower III | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Frostbound Returning Axe | 8 | Frost Throw III | Slow(13) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Frostbound Returning Axe | 9 | Rainshield III | reaction-special-increase | reaction-special-increase | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-special-increase :: If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that | **UNRESOLVED** |
| Frostbound Returning Axe | 10 | True Frostbound Return | True Frostbound Return | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Frostbound Return :: The Axe fully awakens. Choose or define one final Frostbound Return effect with GM approval. | **MISMATCH** |
| Shadowgrave Armor | 1 | Shadow Shell I | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Shadowgrave Armor | 2 | Deathly Reprisal I | Push(4) | reaction-counter-damage-push | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-counter-damage-push :: Deal **2d8 damage** to the triggering creature and push it **4 m** directly away from you. | **UNRESOLVED** |
| Shadowgrave Armor | 3 | Hands of the Grave I | Root(3) | active-ranged-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Shadowgrave Armor | 4 | Shadow Shell II | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Shadowgrave Armor | 5 | Deathly Reprisal II | Push(8) | reaction-counter-damage-push | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-counter-damage-push :: Deal **6d8 damage** to the triggering creature and push it **8 m** directly away from you. | **UNRESOLVED** |
| Shadowgrave Armor | 6 | Hands of the Grave II | Root(6) | active-ranged-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Shadowgrave Armor | 7 | Shadow Shell III | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Shadowgrave Armor | 8 | Deathly Reprisal III | Push(8) | reaction-counter-damage-push | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-counter-damage-push :: Deal **12d8 damage** to the triggering creature and push it **8 m** directly away from you. | **UNRESOLVED** |
| Shadowgrave Armor | 9 | Hands of the Grave III | Root(7) | active-ranged-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Shadowgrave Armor | 10 | True Shadowgrave Armor | True Shadowgrave Armor | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Shadowgrave Armor :: Shadowgrave Armor fully awakens. Choose or define one final Shadowgrave effect with GM approval. | **MISMATCH** |
| Staff of the Dark | 1 | Might of the Dark I | Spell, Hex(4) | active-melee-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Staff of the Dark | 2 | Life Taken I | Spell | active-ranged-single-target-damage-transfer | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-single-target-damage-transfer :: Deal **4d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes  | **UNRESOLVED** |
| Staff of the Dark | 3 | Vision of the End I | Spell, Ruin(6) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Staff of the Dark | 4 | Might of the Dark II | Spell, Hex(6) | active-melee-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Staff of the Dark | 5 | Life Taken II | Spell | active-ranged-single-target-damage-transfer | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-single-target-damage-transfer :: Deal **10d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes | **UNRESOLVED** |
| Staff of the Dark | 6 | Vision of the End II | Spell, Ruin(10) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Staff of the Dark | 7 | Might of the Dark III | Spell, Hex(8) | active-melee-aoe-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t5 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Staff of the Dark | 8 | Life Taken III | Spell | active-ranged-single-target-damage-transfer | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-single-target-damage-transfer :: Deal **16d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes | **UNRESOLVED** |
| Staff of the Dark | 9 | Vision of the End III | Spell, Ruin(13) | active-ranged-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-damage-t4 :: Deal **+1d8 damage** on hit. | **UNRESOLVED** |
| Staff of the Dark | 10 | True Staff of the Dark | True Staff of the Dark | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Staff of the Dark :: The Staff of the Dark fully awakens. Choose or define one final Staff of the Dark effect with GM app | **MISMATCH** |
| Starfallen Forceshield | 1 | Reflection I | Counter Damage + Push | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Counter Damage + Push :: When a creature within range hits you with an attack, deal 2d8 damage to the triggering creature and | **UNRESOLVED** |
| Starfallen Forceshield | 2 | Crystalized I | Root(4) | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Root(4) :: Deal +1d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 3 | Crystal Rain I | Active | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | authored :: Deal +7d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 4 | Reflection II | Counter Damage + Push | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Counter Damage + Push :: When a creature within range hits you with an attack, deal 6d8 damage to the triggering creature and | **UNRESOLVED** |
| Starfallen Forceshield | 5 | Crystalized II | Root(8) | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Root(8) :: Deal +2d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 6 | Crystal Rain II | Active | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | authored :: Deal +17d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 7 | Reflection III | Counter Damage + Push | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Counter Damage + Push :: When a creature within range hits you with an attack, deal 12d8 damage to the triggering creature an | **UNRESOLVED** |
| Starfallen Forceshield | 8 | Crystalized III | Root(10) | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Root(10) :: Deal +2d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 9 | Crystal Rain III | Active | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | authored :: Deal +27d8 damage on hit. | **UNRESOLVED** |
| Starfallen Forceshield | 10 | True Starfallen Forceshield | True Starfallen Forceshield | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Starfallen Forceshield :: The Starfallen Forceshield fully awakens. Choose or define one final Starfallen Forceshield effect w | **MISMATCH** |
| Heart of Winter | 1 | Frozen Reserve I | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Heart of Winter | 2 | Glacial Intercept I | reaction-ally-armor | reaction-ally-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-ally-armor :: The ally gains **+7 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Heart of Winter | 3 | Frostwave I | Slow(5) | active-melee-aoe-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Heart of Winter | 4 | Frozen Reserve II | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Heart of Winter | 5 | Glacial Intercept II | reaction-ally-armor | reaction-ally-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-ally-armor :: The ally gains **+19 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Heart of Winter | 6 | Frostwave II | Slow(7) | active-melee-aoe-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Heart of Winter | 7 | Frozen Reserve III | vitality.tempHp | vitality.tempHp | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | vitality.tempHp :: Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Heart of Winter | 8 | Glacial Intercept III | reaction-ally-armor | reaction-ally-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-ally-armor :: The ally gains **+31 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Heart of Winter | 9 | Frostwave III | Slow(10) | active-melee-aoe-damage-t4 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-aoe-damage-t4 :: Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attac | **UNRESOLVED** |
| Heart of Winter | 10 | Heart of Winter | Heart of Winter | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | Heart of Winter :: The Frostshield fully awakens. Its Shield Armor increases to **+14 Armor**. Once per Combat, when yo | **UNRESOLVED** |
| Heartseeker | 1 | Divided Execution I | active-ranged-weapon-split | active-ranged-weapon-split | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-weapon-split :: Make up to **2 ranged weapon attacks** against different targets. Split your Attack Pool between the | **UNRESOLVED** |
| Heartseeker | 2 | Killing Focus I | agility.crit | agility.crit | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 2. Rank 1 must still be paid norma | **UNRESOLVED** |
| Heartseeker | 3 | Armorbreaker I | ab-damage-penetration | ab-damage-penetration | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | ab-damage-penetration :: Your attacks deal **+4d8** damage and gain **Penetration(9)** while the buff is active. | **UNRESOLVED** |
| Heartseeker | 4 | Divided Execution II | active-ranged-weapon-split | active-ranged-weapon-split | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-weapon-split :: Make up to **3 ranged weapon attacks** against different targets. Split your Attack Pool between the | **UNRESOLVED** |
| Heartseeker | 5 | Killing Focus II | agility.crit | agility.crit | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid n | **UNRESOLVED** |
| Heartseeker | 6 | Armorbreaker II | ab-damage-penetration | ab-damage-penetration | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | ab-damage-penetration :: Your attacks deal **+10d8** damage and gain **Penetration(21)** while the buff is active. | **UNRESOLVED** |
| Heartseeker | 7 | Divided Execution III | active-ranged-weapon-split | active-ranged-weapon-split | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-ranged-weapon-split :: Make up to **4 ranged weapon attacks** against different targets. Split your Attack Pool between the | **UNRESOLVED** |
| Heartseeker | 8 | Killing Focus III | agility.crit | agility.crit | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | agility.crit :: Supports the Agility Ability: Crit Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be pai | **UNRESOLVED** |
| Heartseeker | 9 | Armorbreaker III | ab-damage-penetration | ab-damage-penetration | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | ab-damage-penetration :: Your attacks deal **+16d8** damage and gain **Penetration(33)** while the buff is active. | **UNRESOLVED** |
| Heartseeker | 10 | True Heartseeker | True Heartseeker | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Heartseeker :: Heartseeker fully awakens. Its additional Precision increases to **Precision(4)**. Choose or define  | **MISMATCH** |
| Falcon Wide Brim | 1 | Falcon Initiative I | wits.initiativeBoost | wits.initiativeBoost | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Falcon Wide Brim | 2 | Falcon Step I | reaction-reposition | reaction-reposition | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-reposition :: After the triggering event fully resolves, move up to **2 m** using normal legal movement. | **UNRESOLVED** |
| Falcon Wide Brim | 3 | Falcon Momentum I | reaction-initiative-gain | reaction-initiative-gain | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-initiative-gain :: After the triggering attack fully resolves, gain **+8 Initiative**. | **UNRESOLVED** |
| Falcon Wide Brim | 4 | Falcon Initiative II | wits.initiativeBoost | wits.initiativeBoost | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Falcon Wide Brim | 5 | Falcon Step II | reaction-reposition | reaction-reposition | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-reposition :: After the triggering event fully resolves, move up to **4 m** using normal legal movement. | **UNRESOLVED** |
| Falcon Wide Brim | 6 | Falcon Momentum II | reaction-initiative-gain | reaction-initiative-gain | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-initiative-gain :: After the triggering attack fully resolves, gain **+20 Initiative**. | **UNRESOLVED** |
| Falcon Wide Brim | 7 | Falcon Initiative III | wits.initiativeBoost | wits.initiativeBoost | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | wits.initiativeBoost :: Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Falcon Wide Brim | 8 | Falcon Step III | reaction-reposition | reaction-reposition | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-reposition :: After the triggering event fully resolves, move up to **8 m** using normal legal movement. | **UNRESOLVED** |
| Falcon Wide Brim | 9 | Falcon Momentum III | reaction-initiative-gain | reaction-initiative-gain | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-initiative-gain :: After the triggering attack fully resolves, gain **+32 Initiative**. | **UNRESOLVED** |
| Falcon Wide Brim | 10 | True Falcon Wide Brim | — | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | — :: Falcon Wide Brim reaches its final Base Values. It grants **+5 Evade** and **Predator Sense**. It ga | **MISMATCH** |
| Lantern of the Hollow Star | 1 | Stone Battery I | stoneBattery | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneBattery :: Gain a Resolve Stone Battery (capacity 10). | **UNRESOLVED** |
| Lantern of the Hollow Star | 2 | Resolve Pool I | stonePool | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stonePool :: After each Safe Haven Rest, store 2 Resolve Stones. These Stones may only be used for this Artifact' | **UNRESOLVED** |
| Lantern of the Hollow Star | 3 | Recovery I | stoneRefresh | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneRefresh :: Restore 1 spent Resolve Stone. | **UNRESOLVED** |
| Lantern of the Hollow Star | 4 | Stone Battery II | stoneBattery | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneBattery :: Gain a Resolve Stone Battery (capacity 20). | **UNRESOLVED** |
| Lantern of the Hollow Star | 5 | Resolve Pool II | stonePool | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stonePool :: After each Safe Haven Rest, store 4 Resolve Stones. These Stones may only be used for this Artifact' | **UNRESOLVED** |
| Lantern of the Hollow Star | 6 | Recovery II | stoneRefresh | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneRefresh :: Restore 2 spent Resolve Stones. | **UNRESOLVED** |
| Lantern of the Hollow Star | 7 | Stone Battery III | stoneBattery | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneBattery :: Gain a Resolve Stone Battery (capacity 40). | **UNRESOLVED** |
| Lantern of the Hollow Star | 8 | Resolve Pool III | stonePool | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stonePool :: After each Safe Haven Rest, store 8 Resolve Stones. These Stones may only be used for this Artifact' | **UNRESOLVED** |
| Lantern of the Hollow Star | 9 | Recovery III | stoneRefresh | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | stoneRefresh :: Restore 4 spent Resolve Stones. | **UNRESOLVED** |
| Lantern of the Hollow Star | 10 | True Hollow Star | True Hollow Star | authored/stone | — | PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10. | True Hollow Star :: The Lantern fully awakens. Choose or define one final Stone Battery, Resolve Pool, Recovery, or stor | **MISMATCH** |
| Lor-Keth's Staff | 1 | Giant Shock Strike I | Challenge(2) | active-melee-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-damage-t5 :: Deal **+2d8 damage** on hit. | **UNRESOLVED** |
| Lor-Keth's Staff | 2 | Ancestral Guard I | reaction-armor | reaction-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-armor :: Gain **+8 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Lor-Keth's Staff | 3 | Might Ignore Armor Support I | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 2. Rank 1 must still be p | **UNRESOLVED** |
| Lor-Keth's Staff | 4 | Giant Shock Strike II | Challenge(4) | active-melee-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-damage-t5 :: Deal **+2d8 damage** on hit. | **UNRESOLVED** |
| Lor-Keth's Staff | 5 | Ancestral Guard II | reaction-armor | reaction-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-armor :: Gain **+20 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Lor-Keth's Staff | 6 | Might Ignore Armor Support II | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 3. Ranks 1, 2 must still  | **UNRESOLVED** |
| Lor-Keth's Staff | 7 | Giant Shock Strike III | Challenge(5) | active-melee-damage-t5 | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | active-melee-damage-t5 :: Deal **+2d8 damage** on hit. | **UNRESOLVED** |
| Lor-Keth's Staff | 8 | Ancestral Guard III | reaction-armor | reaction-armor | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | reaction-armor :: Gain **+32 Armor** against the triggering attack or damage instance. | **UNRESOLVED** |
| Lor-Keth's Staff | 9 | Might Ignore Armor Support III | might.armorReduction | might.armorReduction | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | might.armorReduction :: Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must sti | **UNRESOLVED** |
| Lor-Keth's Staff | 10 | Heart of the Storm Ancestors | True Storm Ancestor | authored/stone | — | Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete. | True Storm Ancestor :: The Staff fully awakens as a giant-forged ancestral weapon. Choose or define one final Storm Ancesto | **UNRESOLVED** |

## 5. Deviation dossiers (non-MATCH / non-APPROVED EXCEPTION)

### Stonebound Soles — L1 Anchoring Stance I (`MISMATCH`)

1. **Artifact / Level:** Stonebound Soles (stoneboundSoles) Level 1
2. **Ability:** Anchoring Stance I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-immovable-temp-hp`
6. **Implemented:** For **2 Rounds** you become **Immovable** and gain **40 Temporary HP**. While Immovable you ignore Push, Pull, Prone, forced movement, and grapple-based forced moves.
7. **Correction proposal:** PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid).
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Stonebound Soles — L4 Anchoring Stance II (`MISMATCH`)

1. **Artifact / Level:** Stonebound Soles (stoneboundSoles) Level 4
2. **Ability:** Anchoring Stance II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-immovable-temp-hp`
6. **Implemented:** For **2 Rounds** you become **Immovable** and gain **220 Temporary HP**. While Immovable you ignore Push, Pull, Prone, forced movement, and grapple-based forced moves.
7. **Correction proposal:** PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid).
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Stonebound Soles — L7 Anchoring Stance III (`MISMATCH`)

1. **Artifact / Level:** Stonebound Soles (stoneboundSoles) Level 7
2. **Ability:** Anchoring Stance III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-immovable-temp-hp`
6. **Implemented:** For **2 Rounds** you become **Immovable** and gain **400 Temporary HP**. While Immovable you ignore Push, Pull, Prone, forced movement, and grapple-based forced moves.
7. **Correction proposal:** PH ~2347–2353 Anchoring Stance = Active Buff: Temporary HP (PL 4/10/16; 32/77/122 Temp HP). Code grants ab-immovable-temp-hp (Immovable + Temp HP hybrid).
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Elorian Stride — L3 Crit Support I (`UNRESOLVED`)

1. **Artifact / Level:** Elorian Stride (elorianStride) Level 3
2. **Ability:** Crit Support I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Elorian Stride — L6 Crit Support II (`UNRESOLVED`)

1. **Artifact / Level:** Elorian Stride (elorianStride) Level 6
2. **Ability:** Crit Support II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Elorian Stride — L9 Crit Support III (`UNRESOLVED`)

1. **Artifact / Level:** Elorian Stride (elorianStride) Level 9
2. **Ability:** Crit Support III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L2 Titan Might I (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 2
2. **Ability:** Titan Might I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L3 Titan Healing I (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 3
2. **Ability:** Titan Healing I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L5 Titan Might II (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 5
2. **Ability:** Titan Might II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L6 Titan Healing II (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 6
2. **Ability:** Titan Healing II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L8 Titan Might III (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 8
2. **Ability:** Titan Might III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Titan Scars — L9 Titan Healing III (`UNRESOLVED`)

1. **Artifact / Level:** Titan Scars (titanScars) Level 9
2. **Ability:** Titan Healing III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Remove Scar Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Wyrm Scales (Heavy) — L3 Armor Stone Support I (`UNRESOLVED`)

1. **Artifact / Level:** Wyrm Scales (Heavy) (wyrmScalesHeavy) Level 3
2. **Ability:** Armor Stone Support I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Wyrm Scales (Heavy) — L6 Armor Stone Support II (`UNRESOLVED`)

1. **Artifact / Level:** Wyrm Scales (Heavy) (wyrmScalesHeavy) Level 6
2. **Ability:** Armor Stone Support II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Wyrm Scales (Heavy) — L9 Armor Stone Support III (`UNRESOLVED`)

1. **Artifact / Level:** Wyrm Scales (Heavy) (wyrmScalesHeavy) Level 9
2. **Ability:** Armor Stone Support III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Serpent Scales — L2 Serpent Evasion I (`MISMATCH`)

1. **Artifact / Level:** Serpent Scales (wyrmScalesLight) Level 2
2. **Ability:** Serpent Evasion I
3. **Expected rule:** Active Buff Evade PL 4
4. **Canonical cite:** PH ~2849–2862
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-evade`
6. **Implemented:** Gain **+6 Evade**.
7. **Correction proposal:** PH Evade PL4 = +8 Evade; code uses PL3 (+6) / stagePowerLevels 3.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Serpent Scales — L5 Mobility Extension II (`MISMATCH`)

1. **Artifact / Level:** Serpent Scales (wyrmScalesLight) Level 5
2. **Ability:** Mobility Extension II
3. **Expected rule:** Active Buff Evade PL 10
4. **Canonical cite:** PH ~2849–2862
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `extend-buff-mobility`
6. **Implemented:** Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by **+2 rounds**. This does not increase the Buff's value. This does not allow y
7. **Correction proposal:** PH L5/L8 = Serpent Evasion II/III (Active Buff Evade PL 10/16). Code replaces with Mobility Extension.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Serpent Scales — L8 Mobility Extension III (`MISMATCH`)

1. **Artifact / Level:** Serpent Scales (wyrmScalesLight) Level 8
2. **Ability:** Mobility Extension III
3. **Expected rule:** Active Buff Evade PL 16
4. **Canonical cite:** PH ~2849–2862
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `extend-buff-mobility`
6. **Implemented:** Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by **+3 rounds**. This does not increase the Buff's value. This does not allow y
7. **Correction proposal:** PH L5/L8 = Serpent Evasion II/III (Active Buff Evade PL 10/16). Code replaces with Mobility Extension.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Claws — L3 Tail Sweep I (`MISMATCH`)

1. **Artifact / Level:** Dragon Claws (dragonClaws) Level 3
2. **Ability:** Tail Sweep I
3. **Expected rule:** Melee Push PL 4 ST
4. **Canonical cite:** PH ~2999–3012
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-weapon-aoe`
6. **Implemented:** Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in the area. Every creature hit takes **Weapon Damage + 4d8 Power damage** (one shared Damage Pool rol
7. **Correction proposal:** PH Tail Sweep = single-target Push 8/20/32 m + weapon, no AoE Power Damage. Code: melee weapon AoE + small Push ranks + Power dice.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Claws — L5 Rending Spiral II (`MISMATCH`)

1. **Artifact / Level:** Dragon Claws (dragonClaws) Level 5
2. **Ability:** Rending Spiral II
3. **Expected rule:** Lacerate PL 10
4. **Canonical cite:** PH ~2999–3012
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t4`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** PH Lacerate(9) at PL10; code Lacerate(7).
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Claws — L6 Tail Sweep II (`MISMATCH`)

1. **Artifact / Level:** Dragon Claws (dragonClaws) Level 6
2. **Ability:** Tail Sweep II
3. **Expected rule:** Push PL 10
4. **Canonical cite:** PH ~2999–3012
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-weapon-aoe`
6. **Implemented:** Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in the area. Every creature hit takes **Weapon Damage + 7d8 Power damage** (one shared Damage Pool rol
7. **Correction proposal:** PH Tail Sweep = single-target Push 8/20/32 m + weapon, no AoE Power Damage. Code: melee weapon AoE + small Push ranks + Power dice.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Claws — L9 Tail Sweep III (`MISMATCH`)

1. **Artifact / Level:** Dragon Claws (dragonClaws) Level 9
2. **Ability:** Tail Sweep III
3. **Expected rule:** Push PL 16
4. **Canonical cite:** PH ~2999–3012
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-weapon-aoe`
6. **Implemented:** Make one melee AoE Attack Roll and compare it separately against the Evade of each valid creature in the area. Every creature hit takes **Weapon Damage + 13d8 Power damage** (one shared Damage Pool ro
7. **Correction proposal:** PH Tail Sweep = single-target Push 8/20/32 m + weapon, no AoE Power Damage. Code: melee weapon AoE + small Push ranks + Power dice.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Head — L2 Draconic Roar I (`LEGACY`)

1. **Artifact / Level:** Dragon Head (dragonHead) Level 2
2. **Ability:** Draconic Roar I
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2934–2947
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **8 m** gain **+4 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Head — L5 Draconic Roar II (`LEGACY`)

1. **Artifact / Level:** Dragon Head (dragonHead) Level 5
2. **Ability:** Draconic Roar II
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2934–2947
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **20 m** gain **+10 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Dragon Head — L8 Draconic Roar III (`LEGACY`)

1. **Artifact / Level:** Dragon Head (dragonHead) Level 8
2. **Ability:** Draconic Roar III
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2934–2947
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **32 m** gain **+16 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L1 Sentinel Restoration I (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 1
2. **Ability:** Sentinel Restoration I
3. **Expected rule:** Ranged ST Restoration PL 4; range 8 m
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-health-level-heal`
6. **Implemented:** Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this Power's pool on one creature within range. **Pool:** restore up to **2 Scarred Health Bars** per Saf
7. **Correction proposal:** Catalogue Restoration template OK in principle, but PH requires Artifact Range 8 m; template uses standard ranged scaling (not fixed 8 m). Also display name Sentinel Restoration vs Single Restoration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L4 Sentinel Restoration II (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 4
2. **Ability:** Sentinel Restoration II
3. **Expected rule:** Restoration PL 10
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-health-level-heal`
6. **Implemented:** Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this Power's pool on one creature within range. **Pool:** restore up to **6 Scarred Health Bars** per Saf
7. **Correction proposal:** Catalogue Restoration template OK in principle, but PH requires Artifact Range 8 m; template uses standard ranged scaling (not fixed 8 m). Also display name Sentinel Restoration vs Single Restoration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L5 Resolve Core II (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 5
2. **Ability:** Resolve Core II
3. **Expected rule:** Resolve: Special Negation Rank 3
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** After each Safe Haven Rest, store 4 Resolve Stones. These Stones may only be used for this Artifact's listed Resolve Stone functions.
7. **Correction proposal:** PH L5/L9 = Special Negation Support; compiler shows Resolve Core / Healing slot drift. extraStoneFunctions Ward may exist but pick-derived table wrong.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L6 Healing Support II (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 6
2. **Ability:** Healing Support II
3. **Expected rule:** Pool 4
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** PH L6 = Resolve Core II; code shows Healing Support II.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L7 Sentinel Restoration III (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 7
2. **Ability:** Sentinel Restoration III
3. **Expected rule:** Restoration PL 16
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-health-level-heal`
6. **Implemented:** Restores Scarred Health Bars. Each restored bar returns at **full HP**. No Healing Dice. Spend this Power's pool on one creature within range. **Pool:** restore up to **10 Scarred Health Bars** per Sa
7. **Correction proposal:** Catalogue Restoration template OK in principle, but PH requires Artifact Range 8 m; template uses standard ranged scaling (not fixed 8 m). Also display name Sentinel Restoration vs Single Restoration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L8 Resolve Core III (`MISMATCH`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 8
2. **Ability:** Resolve Core III
3. **Expected rule:** Healing Rank 4
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** After each Safe Haven Rest, store 8 Resolve Stones. These Stones may only be used for this Artifact's listed Resolve Stone functions.
7. **Correction proposal:** PH L8 = Healing Support II Rank 4; code shows Resolve Core III.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Sentinel Frame — L9 Healing Support III (`UNRESOLVED`)

1. **Artifact / Level:** Sentinel Frame (sentinelFrame) Level 9
2. **Ability:** Healing Support III
3. **Expected rule:** Special Negation Rank 4
4. **Canonical cite:** PH ~2579–2594
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Judicator Frame — L3 Regeneration Support I (`MISMATCH`)

1. **Artifact / Level:** Judicator Frame (judicatorFrame) Level 3
2. **Ability:** Regeneration Support I
3. **Expected rule:** Resolve: Healing Rank 2; Self only
4. **Canonical cite:** PH ~2602–2617
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** PH: Resolve Ability Healing Support (Self only). Code: Influence colorlessRecovery / Regeneration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Judicator Frame — L6 Regeneration Support II (`MISMATCH`)

1. **Artifact / Level:** Judicator Frame (judicatorFrame) Level 6
2. **Ability:** Regeneration Support II
3. **Expected rule:** Healing Rank 3 Self
4. **Canonical cite:** PH ~2602–2617
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** PH: Resolve Ability Healing Support (Self only). Code: Influence colorlessRecovery / Regeneration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Judicator Frame — L9 Regeneration Support III (`MISMATCH`)

1. **Artifact / Level:** Judicator Frame (judicatorFrame) Level 9
2. **Ability:** Regeneration Support III
3. **Expected rule:** Healing Rank 4 Self
4. **Canonical cite:** PH ~2602–2617
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Colorless Recovery Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** PH: Resolve Ability Healing Support (Self only). Code: Influence colorlessRecovery / Regeneration.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L1 Oracle Field I (`LEGACY`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 1
2. **Ability:** Oracle Field I
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **2 m** gain **+1 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L2 Oracle Aid I (`MISMATCH`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 2
2. **Ability:** Oracle Aid I
3. **Expected rule:** Influence: Enemy Evade Reduction Rank 2
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** PH expects Influence Enemy Evade Reduction Support; code grants Oracle Aid / influence.cleanse.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L4 Oracle Field III (`LEGACY`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 4
2. **Ability:** Oracle Field III
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **6 m** gain **+3 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L5 Oracle Aid II (`MISMATCH`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 5
2. **Ability:** Oracle Aid II
3. **Expected rule:** Evade Reduction Rank 3
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** PH expects Influence Enemy Evade Reduction Support; code grants Oracle Aid / influence.cleanse.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L7 Oracle Field V (`LEGACY`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 7
2. **Ability:** Oracle Field V
3. **Expected rule:** Legacy Aura — redesign pending
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `ab-armor-aura`
6. **Implemented:** You and allies within **10 m** gain **+5 Armor**.
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Oracle Frame — L8 Oracle Aid III (`MISMATCH`)

1. **Artifact / Level:** Oracle Frame (oracleFrame) Level 8
2. **Ability:** Oracle Aid III
3. **Expected rule:** Evade Reduction Rank 4
4. **Canonical cite:** PH ~2554–2569
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Influence Ability: Cleanse Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** PH expects Influence Enemy Evade Reduction Support; code grants Oracle Aid / influence.cleanse.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L1 Kept from Sight I (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 1
2. **Ability:** Kept from Sight I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Pre-fill Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L2 Burden Lifted I (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 2
2. **Ability:** Burden Lifted I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Remove up to 6 total points of eligible negative Special value from one creature.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L3 Hearth Circle I (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 3
2. **Ability:** Hearth Circle I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore up to 2 Scarred Health Bars per Safe Haven Rest among allies within 2 m (full HP each). The pool is shared across the AoE; allocate bars among eligible allies. Does not heal HP.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L4 Remembered Hands I (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 4
2. **Ability:** Remembered Hands I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore up to 6 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). Does not heal HP.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L5 Kept from Sight II (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 5
2. **Ability:** Kept from Sight II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Pre-fill Rank 3. Ranks 1 and 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L6 Burden Lifted II (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 6
2. **Ability:** Burden Lifted II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Remove up to 10 total points of eligible negative Special value from one creature. This replaces Burden Lifted I.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L7 Remembered Hands II (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 7
2. **Ability:** Remembered Hands II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore up to 10 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). Does not heal HP. Replaces Remembered Hands I.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L8 Hearth Circle II (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 8
2. **Ability:** Hearth Circle II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore up to 9 Scarred Health Bars per Safe Haven Rest among allies within 4 m (full HP each). The pool is shared across the AoE; allocate bars among eligible allies. Does not heal HP. This replaces 
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ringchain of Kept Names — L9 Kept from Sight III (`UNRESOLVED`)

1. **Artifact / Level:** Ringchain of Kept Names (ringchainOfKeptNames) Level 9
2. **Ability:** Kept from Sight III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L1 Predator Stone I (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownMight) Level 1
2. **Ability:** Predator Stone I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L4 Predator Stone II (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownMight) Level 4
2. **Ability:** Predator Stone II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L7 Predator Stone III (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownMight) Level 7
2. **Ability:** Predator Stone III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Damage Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L1 Predator Stone I (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownWits) Level 1
2. **Ability:** Predator Stone I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L4 Predator Stone II (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownWits) Level 4
2. **Ability:** Predator Stone II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L7 Predator Stone III (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownWits) Level 7
2. **Ability:** Predator Stone III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L1 Predator Stone I (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownIntellect) Level 1
2. **Ability:** Predator Stone I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L4 Predator Stone II (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownIntellect) Level 4
2. **Ability:** Predator Stone II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Predator Crown — L7 Predator Stone III (`UNRESOLVED`)

1. **Artifact / Level:** Predator Crown (predatorCrownIntellect) Level 7
2. **Ability:** Predator Stone III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Intellect Ability: Raises Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L2 Flesh Remembers I (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 2
2. **Ability:** Flesh Remembers I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L3 Rage Unbound I (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 3
2. **Ability:** Rage Unbound I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L5 Flesh Remembers II (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 5
2. **Ability:** Flesh Remembers II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L6 Rage Unbound II (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 6
2. **Ability:** Rage Unbound II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L8 Flesh Remembers III (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 8
2. **Ability:** Flesh Remembers III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Resolve Ability: Healing Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Primal Vestment — L9 Rage Unbound III (`UNRESOLVED`)

1. **Artifact / Level:** Primal Vestment (primalVestment) Level 9
2. **Ability:** Rage Unbound III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Extra Attack Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Could not auto-classify; needs manual PH line check.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L2 Covenant Overdrive I (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 2
2. **Ability:** Covenant Overdrive I
3. **Expected rule:** Ranged AoE Special Root PL 4
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This does nothing if that Special is not already present.
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L3 Rootbinding I (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 3
2. **Ability:** Rootbinding I
3. **Expected rule:** Ranged ST Special Weaken PL 4
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L5 Covenant Overdrive II (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 5
2. **Ability:** Covenant Overdrive II
3. **Expected rule:** Root PL 10
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or **+1** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L6 Rootbinding II (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 6
2. **Ability:** Rootbinding II
3. **Expected rule:** Weaken PL 10
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L8 Covenant Overdrive III (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 8
2. **Ability:** Covenant Overdrive III
3. **Expected rule:** Root PL 16
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or **+2** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Root Staff — L9 Rootbinding III (`MISMATCH`)

1. **Artifact / Level:** Root Staff (witchStaffRoot) Level 9
2. **Ability:** Rootbinding III
3. **Expected rule:** Weaken PL 16
4. **Canonical cite:** PH ~3280–3291 (Root tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L2 Covenant Overdrive I (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 2
2. **Ability:** Covenant Overdrive I
3. **Expected rule:** Ranged AoE Special Root PL 4
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This does nothing if that Special is not already present.
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L3 Ruinous Word I (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 3
2. **Ability:** Ruinous Word I
3. **Expected rule:** Ranged ST Special Ruin PL 4
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L5 Covenant Overdrive II (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 5
2. **Ability:** Covenant Overdrive II
3. **Expected rule:** Root PL 10
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or **+1** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L6 Ruinous Word II (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 6
2. **Ability:** Ruinous Word II
3. **Expected rule:** Ruin PL 10
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L8 Covenant Overdrive III (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 8
2. **Ability:** Covenant Overdrive III
3. **Expected rule:** Root PL 16
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or **+2** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Ruin Staff — L9 Ruinous Word III (`MISMATCH`)

1. **Artifact / Level:** Ruin Staff (witchStaffRuin) Level 9
2. **Ability:** Ruinous Word III
3. **Expected rule:** Ruin PL 16
4. **Canonical cite:** PH ~3280–3291 (Ruin tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L2 Covenant Overdrive I (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 2
2. **Ability:** Covenant Overdrive I
3. **Expected rule:** Ranged AoE Special Root PL 4
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+1**. This does nothing if that Special is not already present.
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L3 Blightcall I (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 3
2. **Ability:** Blightcall I
3. **Expected rule:** Ranged ST Special Blight PL 4
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L5 Covenant Overdrive II (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 5
2. **Ability:** Covenant Overdrive II
3. **Expected rule:** Root PL 10
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+2**, or **+1** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L6 Blightcall II (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 6
2. **Ability:** Blightcall II
3. **Expected rule:** Blight PL 10
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L8 Covenant Overdrive III (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 8
2. **Ability:** Covenant Overdrive III
3. **Expected rule:** Root PL 16
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `ab-special-overdrive`
6. **Implemented:** On the first qualifying hit each round, increase one already existing chosen Special by **+4**, or **+2** for Challenge, Disoriented, Soulburn, or Weaken. This does nothing if that Special is not alre
7. **Correction proposal:** PH Binding Circle = Ranged AoE Special: Root (special-only). Code grants Active Buff Special Overdrive.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Blight Staff — L9 Blightcall III (`MISMATCH`)

1. **Artifact / Level:** Blight Staff (witchStaffBlight) Level 9
2. **Ability:** Blightcall III
3. **Expected rule:** Blight PL 16
4. **Canonical cite:** PH ~3280–3291 (Blight tradition)
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** PH Main Spell = Ranged ST Special-only (Weaken/Ruin/Blight). Code grants ranged Damage Active templates.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Alchemist Coat — L2 Alchemist Stone I (`MISMATCH`)

1. **Artifact / Level:** Alchemist Coat (alchemistCoat) Level 2
2. **Ability:** Alchemist Stone I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Alchemist Coat — L5 Alchemist Stone II (`MISMATCH`)

1. **Artifact / Level:** Alchemist Coat (alchemistCoat) Level 5
2. **Ability:** Alchemist Stone II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Alchemist Coat — L8 Alchemist Stone III (`MISMATCH`)

1. **Artifact / Level:** Alchemist Coat (alchemistCoat) Level 8
2. **Ability:** Alchemist Stone III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH Echo section
5. **Code:** src/utils/echo-artifacts-unbound.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Maximization Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** PH ~3396–3402 Alchemist Stone = Artifact Function Active Buff Empowerment (+1/+2/+3 PL & rounds) on Red/Black Potions. Code maps to vitality.damageMaximization.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L1 Moonlight Mending I (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 1
2. **Ability:** Moonlight Mending I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-heal`
6. **Implemented:** Heal one creature for **5d8 HP** in its current Health Bar; does not restore Scarred Health Bars.
7. **Correction proposal:** Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L2 Moonlight Judgment I (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 2
2. **Ability:** Moonlight Judgment I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-limited-aoe`
6. **Implemented:** Cast **Limited Ranged AoE Attack** (PL 4) as one damaging Spell AoE; printed **+3d8 Power Damage** becomes **+12d8** for this use (×4). Base B is not yet unlocked; no Focus bonus. **Shares the charact
7. **Correction proposal:** Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L3 Moonlight Shadow I (`LEGACY`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 3
2. **Ability:** Moonlight Shadow I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-aura`
6. **Implemented:** At the end of each of your Turns, enemies in a **2 m** aura take **3d8 damage**. Each creature once per Round. Uses/Safe Haven Rest = ceil(MR/2).
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L4 Moonlight Mending II (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 4
2. **Ability:** Moonlight Mending II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-heal`
6. **Implemented:** Heal one creature for **12d8 HP** in its current Health Bar; does not restore Scarred Health Bars.
7. **Correction proposal:** Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L5 Moonlight Judgment II (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 5
2. **Ability:** Moonlight Judgment II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-limited-aoe`
6. **Implemented:** Cast **Limited Ranged AoE Attack** (PL 10) as one damaging Spell AoE; printed **+4d8 Power Damage** becomes **+16d8** for this use (×4). When Base B is unlocked, **Spell Focus applies once** (not ×4).
7. **Correction proposal:** Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L6 Moonlight Shadow II (`LEGACY`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 6
2. **Ability:** Moonlight Shadow II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-aura`
6. **Implemented:** At the end of each of your Turns, enemies in a **3 m** aura take **7d8 damage**. Replaces Moonlight Shadow I. Uses/Safe Haven Rest = ceil(MR/2).
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L7 Moonlight Mending III (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 7
2. **Ability:** Moonlight Mending III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-heal`
6. **Implemented:** Heal one creature for **20d8 HP** in its current Health Bar; does not restore Scarred Health Bars.
7. **Correction proposal:** Moonlight Mending uses catalogue heal template, but full Moonlight progression is not in Canonical PH (only L1 weapon example ~4235–4239). External Artifacts Catalogue required.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L8 Moonlight Judgment III (`UNRESOLVED`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 8
2. **Ability:** Moonlight Judgment III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-limited-aoe`
6. **Implemented:** Cast **Limited Ranged AoE Attack** (PL 16) as one damaging Spell AoE; printed **+8d8 Power Damage** becomes **+32d8** for this use (×4). When Base B is unlocked, **Spell Focus applies once** (not ×4).
7. **Correction proposal:** Moonlight Judgment Limited AoE uses catalogue Limited template; progression not in Canonical PH. Verify Limited charge sharing at runtime.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Moonlight Greatsword — L9 Moonlight Shadow III (`LEGACY`)

1. **Artifact / Level:** Moonlight Greatsword (moonlightGreatsword) Level 9
2. **Ability:** Moonlight Shadow III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-aura`
6. **Implemented:** At the end of each of your Turns, enemies in a **4 m** aura take **11d8 damage**. Replaces Moonlight Shadow II. Uses/Safe Haven Rest = ceil(MR/2).
7. **Correction proposal:** PH ~7008 / Active_Buffs ~166: Oracle Field / Draconic Roar / Moonlight Shadow retired — redesign pending; code still grants selectable legacy aura template.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L1 Soul Shell I (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 1
2. **Ability:** Soul Shell I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L2 Uncanny Soul I (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 2
2. **Ability:** Uncanny Soul I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-phasing`
6. **Implemented:** If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2 total Phasing charges this combat**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L3 Resting Soul I (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 3
2. **Ability:** Resting Soul I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-health-level-heal`
6. **Implemented:** Restore up to **3 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. No turn-start healing; no HP dice.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L4 Soul Shell II (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 4
2. **Ability:** Soul Shell II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L5 Uncanny Soul II (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 5
2. **Ability:** Uncanny Soul II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-phasing`
6. **Implemented:** If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L6 Resting Soul II (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 6
2. **Ability:** Resting Soul II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-health-level-heal`
6. **Implemented:** Restore up to **7 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. This replaces Resting Soul I.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L7 Soul Shell III (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 7
2. **Ability:** Soul Shell III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L8 Uncanny Soul III (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 8
2. **Ability:** Uncanny Soul III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-phasing`
6. **Implemented:** If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **4 total Phasing charges this combat**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L9 Resting Soul III (`UNRESOLVED`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 9
2. **Ability:** Resting Soul III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-health-level-heal`
6. **Implemented:** Restore up to **12 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. This replaces Resting Soul II.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Soul Sigil — L10 True Soul Sigil (`MISMATCH`)

1. **Artifact / Level:** Soul Sigil (soulSigil) Level 10
2. **Ability:** True Soul Sigil
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Soul Sigil fully awakens. Choose or define one final Soul effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L1 Stormpower I (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 1
2. **Ability:** Stormpower I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L2 Frost Throw I (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 2
2. **Ability:** Frost Throw I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L3 Rainshield I (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 3
2. **Ability:** Rainshield I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-special-increase`
6. **Implemented:** If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that Special by **+1**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L4 Stormpower II (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 4
2. **Ability:** Stormpower II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L5 Frost Throw II (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 5
2. **Ability:** Frost Throw II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L6 Rainshield II (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 6
2. **Ability:** Rainshield II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-special-increase`
6. **Implemented:** If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that Special by **+2**, or **+1** for Challenge, Disoriented, Soulburn, or Weaken.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L7 Stormpower III (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 7
2. **Ability:** Stormpower III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L8 Frost Throw III (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 8
2. **Ability:** Frost Throw III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L9 Rainshield III (`UNRESOLVED`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 9
2. **Ability:** Rainshield III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-special-increase`
6. **Implemented:** If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that Special by **+3**, or **+2** for Challenge, Disoriented, Soulburn, or Weaken.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Frostbound Returning Axe — L10 True Frostbound Return (`MISMATCH`)

1. **Artifact / Level:** Frostbound Returning Axe (frostboundReturningAxe) Level 10
2. **Ability:** True Frostbound Return
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Axe fully awakens. Choose or define one final Frostbound Return effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L1 Shadow Shell I (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 1
2. **Ability:** Shadow Shell I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L2 Deathly Reprisal I (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 2
2. **Ability:** Deathly Reprisal I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-counter-damage-push`
6. **Implemented:** Deal **2d8 damage** to the triggering creature and push it **4 m** directly away from you.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L3 Hands of the Grave I (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 3
2. **Ability:** Hands of the Grave I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L4 Shadow Shell II (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 4
2. **Ability:** Shadow Shell II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L5 Deathly Reprisal II (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 5
2. **Ability:** Deathly Reprisal II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-counter-damage-push`
6. **Implemented:** Deal **6d8 damage** to the triggering creature and push it **8 m** directly away from you.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L6 Hands of the Grave II (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 6
2. **Ability:** Hands of the Grave II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L7 Shadow Shell III (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 7
2. **Ability:** Shadow Shell III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L8 Deathly Reprisal III (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 8
2. **Ability:** Deathly Reprisal III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-counter-damage-push`
6. **Implemented:** Deal **12d8 damage** to the triggering creature and push it **8 m** directly away from you.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L9 Hands of the Grave III (`UNRESOLVED`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 9
2. **Ability:** Hands of the Grave III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Shadowgrave Armor — L10 True Shadowgrave Armor (`MISMATCH`)

1. **Artifact / Level:** Shadowgrave Armor (shadowgraveArmor) Level 10
2. **Ability:** True Shadowgrave Armor
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Shadowgrave Armor fully awakens. Choose or define one final Shadowgrave effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L1 Might of the Dark I (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 1
2. **Ability:** Might of the Dark I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L2 Life Taken I (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 2
2. **Ability:** Life Taken I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-target-damage-transfer`
6. **Implemented:** Deal **4d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes from the target. No separate healing dice.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L3 Vision of the End I (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 3
2. **Ability:** Vision of the End I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L4 Might of the Dark II (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 4
2. **Ability:** Might of the Dark II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L5 Life Taken II (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 5
2. **Ability:** Life Taken II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-target-damage-transfer`
6. **Implemented:** Deal **10d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes from the target. No separate healing dice.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L6 Vision of the End II (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 6
2. **Ability:** Vision of the End II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L7 Might of the Dark III (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 7
2. **Ability:** Might of the Dark III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t5`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L8 Life Taken III (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 8
2. **Ability:** Life Taken III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-single-target-damage-transfer`
6. **Implemented:** Deal **16d8 damage** on hit. The attacker heals HP equal to the real HP this damage instance removes from the target. No separate healing dice.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L9 Vision of the End III (`UNRESOLVED`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 9
2. **Ability:** Vision of the End III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-damage-t4`
6. **Implemented:** Deal **+1d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Staff of the Dark — L10 True Staff of the Dark (`MISMATCH`)

1. **Artifact / Level:** Staff of the Dark (staffOfTheDark) Level 10
2. **Ability:** True Staff of the Dark
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Staff of the Dark fully awakens. Choose or define one final Staff of the Dark effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L1 Reflection I (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 1
2. **Ability:** Reflection I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** When a creature within range hits you with an attack, deal 2d8 damage to the triggering creature and push it 4 m.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L2 Crystalized I (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 2
2. **Ability:** Crystalized I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +1d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L3 Crystal Rain I (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 3
2. **Ability:** Crystal Rain I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +7d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L4 Reflection II (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 4
2. **Ability:** Reflection II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** When a creature within range hits you with an attack, deal 6d8 damage to the triggering creature and push it 8 m.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L5 Crystalized II (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 5
2. **Ability:** Crystalized II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +2d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L6 Crystal Rain II (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 6
2. **Ability:** Crystal Rain II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +17d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L7 Reflection III (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 7
2. **Ability:** Reflection III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** When a creature within range hits you with an attack, deal 12d8 damage to the triggering creature and push it 8 m.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L8 Crystalized III (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 8
2. **Ability:** Crystalized III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +2d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L9 Crystal Rain III (`UNRESOLVED`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 9
2. **Ability:** Crystal Rain III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Deal +27d8 damage on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Starfallen Forceshield — L10 True Starfallen Forceshield (`MISMATCH`)

1. **Artifact / Level:** Starfallen Forceshield (starfallenForceshield) Level 10
2. **Ability:** True Starfallen Forceshield
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Starfallen Forceshield fully awakens. Choose or define one final Starfallen Forceshield effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L1 Frozen Reserve I (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 1
2. **Ability:** Frozen Reserve I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L2 Glacial Intercept I (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 2
2. **Ability:** Glacial Intercept I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-ally-armor`
6. **Implemented:** The ally gains **+7 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L3 Frostwave I (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 3
2. **Ability:** Frostwave I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t4`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L4 Frozen Reserve II (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 4
2. **Ability:** Frozen Reserve II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L5 Glacial Intercept II (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 5
2. **Ability:** Glacial Intercept II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-ally-armor`
6. **Implemented:** The ally gains **+19 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L6 Frostwave II (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 6
2. **Ability:** Frostwave II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t4`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L7 Frozen Reserve III (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 7
2. **Ability:** Frozen Reserve III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L8 Glacial Intercept III (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 8
2. **Ability:** Glacial Intercept III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-ally-armor`
6. **Implemented:** The ally gains **+31 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L9 Frostwave III (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 9
2. **Ability:** Frostwave III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-aoe-damage-t4`
6. **Implemented:** Make one AoE Attack Roll and compare it separately against each creature's Evade. Special-only Attack: apply the full printed Special to every creature hit; no direct damage, no Power / Weapon / Spell
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heart of Winter — L10 Heart of Winter (`UNRESOLVED`)

1. **Artifact / Level:** Heart of Winter (heartOfWinter) Level 10
2. **Ability:** Heart of Winter
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Frostshield fully awakens. Its Shield Armor increases to **+14 Armor**. Once per Combat, when you use **Glacial Intercept**, the protected ally also gains **Temporary HP equal to your Mastery Rank
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L1 Divided Execution I (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 1
2. **Ability:** Divided Execution I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-weapon-split`
6. **Implemented:** Make up to **2 ranged weapon attacks** against different targets. Split your Attack Pool between them. Each successful hit deals full weapon damage + **5d8 damage**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L2 Killing Focus I (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 2
2. **Ability:** Killing Focus I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L3 Armorbreaker I (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 3
2. **Ability:** Armorbreaker I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-penetration`
6. **Implemented:** Your attacks deal **+4d8** damage and gain **Penetration(9)** while the buff is active.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L4 Divided Execution II (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 4
2. **Ability:** Divided Execution II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-weapon-split`
6. **Implemented:** Make up to **3 ranged weapon attacks** against different targets. Split your Attack Pool between them. Each successful hit deals full weapon damage + **13d8 damage**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L5 Killing Focus II (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 5
2. **Ability:** Killing Focus II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L6 Armorbreaker II (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 6
2. **Ability:** Armorbreaker II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-penetration`
6. **Implemented:** Your attacks deal **+10d8** damage and gain **Penetration(21)** while the buff is active.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L7 Divided Execution III (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 7
2. **Ability:** Divided Execution III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-ranged-weapon-split`
6. **Implemented:** Make up to **4 ranged weapon attacks** against different targets. Split your Attack Pool between them. Each successful hit deals full weapon damage + **21d8 damage**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L8 Killing Focus III (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 8
2. **Ability:** Killing Focus III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Agility Ability: Crit Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L9 Armorbreaker III (`UNRESOLVED`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 9
2. **Ability:** Armorbreaker III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `ab-damage-penetration`
6. **Implemented:** Your attacks deal **+16d8** damage and gain **Penetration(33)** while the buff is active.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Heartseeker — L10 True Heartseeker (`MISMATCH`)

1. **Artifact / Level:** Heartseeker (heartseeker) Level 10
2. **Ability:** True Heartseeker
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Heartseeker fully awakens. Its additional Precision increases to **Precision(4)**. Choose or define one final Split Attack, Critical, Precision, Damage, Penetration, or execution-themed effect with GM
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L1 Falcon Initiative I (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 1
2. **Ability:** Falcon Initiative I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L2 Falcon Step I (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 2
2. **Ability:** Falcon Step I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-reposition`
6. **Implemented:** After the triggering event fully resolves, move up to **2 m** using normal legal movement.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L3 Falcon Momentum I (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 3
2. **Ability:** Falcon Momentum I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-initiative-gain`
6. **Implemented:** After the triggering attack fully resolves, gain **+8 Initiative**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L4 Falcon Initiative II (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 4
2. **Ability:** Falcon Initiative II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L5 Falcon Step II (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 5
2. **Ability:** Falcon Step II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-reposition`
6. **Implemented:** After the triggering event fully resolves, move up to **4 m** using normal legal movement.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L6 Falcon Momentum II (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 6
2. **Ability:** Falcon Momentum II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-initiative-gain`
6. **Implemented:** After the triggering attack fully resolves, gain **+20 Initiative**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L7 Falcon Initiative III (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 7
2. **Ability:** Falcon Initiative III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Wits Ability: Initiative Boost Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L8 Falcon Step III (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 8
2. **Ability:** Falcon Step III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-reposition`
6. **Implemented:** After the triggering event fully resolves, move up to **8 m** using normal legal movement.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L9 Falcon Momentum III (`UNRESOLVED`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 9
2. **Ability:** Falcon Momentum III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-initiative-gain`
6. **Implemented:** After the triggering attack fully resolves, gain **+32 Initiative**.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Falcon Wide Brim — L10 True Falcon Wide Brim (`MISMATCH`)

1. **Artifact / Level:** Falcon Wide Brim (falconWideBrim) Level 10
2. **Ability:** True Falcon Wide Brim
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Falcon Wide Brim reaches its final Base Values. It grants **+5 Evade** and **Predator Sense**. It gains no additional Power.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L1 Stone Battery I (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 1
2. **Ability:** Stone Battery I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Gain a Resolve Stone Battery (capacity 10).
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L2 Resolve Pool I (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 2
2. **Ability:** Resolve Pool I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** After each Safe Haven Rest, store 2 Resolve Stones. These Stones may only be used for this Artifact's listed Resolve Stone functions.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L3 Recovery I (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 3
2. **Ability:** Recovery I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore 1 spent Resolve Stone.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L4 Stone Battery II (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 4
2. **Ability:** Stone Battery II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Gain a Resolve Stone Battery (capacity 20).
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L5 Resolve Pool II (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 5
2. **Ability:** Resolve Pool II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** After each Safe Haven Rest, store 4 Resolve Stones. These Stones may only be used for this Artifact's listed Resolve Stone functions.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L6 Recovery II (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 6
2. **Ability:** Recovery II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore 2 spent Resolve Stones.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L7 Stone Battery III (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 7
2. **Ability:** Stone Battery III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Gain a Resolve Stone Battery (capacity 40).
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L8 Resolve Pool III (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 8
2. **Ability:** Resolve Pool III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** After each Safe Haven Rest, store 8 Resolve Stones. These Stones may only be used for this Artifact's listed Resolve Stone functions.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L9 Recovery III (`UNRESOLVED`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 9
2. **Ability:** Recovery III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Restore 4 spent Resolve Stones.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lantern of the Hollow Star — L10 True Hollow Star (`MISMATCH`)

1. **Artifact / Level:** Lantern of the Hollow Star (lanternOfTheHollowStar) Level 10
2. **Ability:** True Hollow Star
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Lantern fully awakens. Choose or define one final Stone Battery, Resolve Pool, Recovery, or stored-stone effect with GM approval.
7. **Correction proposal:** PH ~8973 universal Artifact Awakening; this node still uses legacy True … Ultimate / bespoke L10.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L1 Giant Shock Strike I (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 1
2. **Ability:** Giant Shock Strike I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L2 Ancestral Guard I (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 2
2. **Ability:** Ancestral Guard I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-armor`
6. **Implemented:** Gain **+8 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L3 Might Ignore Armor Support I (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 3
2. **Ability:** Might Ignore Armor Support I
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L4 Giant Shock Strike II (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 4
2. **Ability:** Giant Shock Strike II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L5 Ancestral Guard II (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 5
2. **Ability:** Ancestral Guard II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-armor`
6. **Implemented:** Gain **+20 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L6 Might Ignore Armor Support II (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 6
2. **Ability:** Might Ignore Armor Support II
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 3. Ranks 1, 2 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L7 Giant Shock Strike III (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 7
2. **Ability:** Giant Shock Strike III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `active-melee-damage-t5`
6. **Implemented:** Deal **+2d8 damage** on hit.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L8 Ancestral Guard III (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 8
2. **Ability:** Ancestral Guard III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `reaction-armor`
6. **Implemented:** Gain **+32 Armor** against the triggering attack or damage instance.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L9 Might Ignore Armor Support III (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 9
2. **Ability:** Might Ignore Armor Support III
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** Supports the Might Ability: Armor Reduction Stone Power and pre-fills Rank 4. Ranks 1, 2, 3 must still be paid normally.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

### Lor-Keth's Staff — L10 Heart of the Storm Ancestors (`UNRESOLVED`)

1. **Artifact / Level:** Lor-Keth's Staff (lorKethsStaff) Level 10
2. **Ability:** Heart of the Storm Ancestors
3. **Expected rule:** See Canonical PH / universal Artifact rules
4. **Canonical cite:** PH ~9024–9026 Artifacts Catalogue deferral; ~8973 Awakening; ~7008 legacy auras
5. **Code:** src/utils/general-artifacts.ts + progression-compiler / tree-builder; template/special `—`
6. **Implemented:** The Staff fully awakens as a giant-forged ancestral weapon. Choose or define one final Storm Ancestor effect with GM approval.
7. **Correction proposal:** Profile not printed in Canonical PH/Actives/Active_Buffs (PH ~9024–9026 defers to external Artifacts Catalogue). Catalogue template id present where listed; Canonical verification incomplete.
8. **Actor/compendium impact:** World seed + Echo pack + embedded actor items require resync after Phase B; no migration in Phase A.

## 6. Approved exceptions (legitimate Core specials)

| Exception | Cite | Code hook |
|---|---|---|
| Hunter's Scourge → Vitality Maximization on Hands | PH ~3554 | `vitality.damageMaximization` pick |
| Judicator / Stonebound Armor Empowerment (Armor Hasten / Stoneweave Guard) | PH ~2608, ~2349 | `empower-buff-armor` |
| Titan Growth Transformation | PH ~2717 | authored Artifact Function |
| Hollow Crown custom functions / L10 rules | PH ~3638–3760 | authored Hollow Crown rows |
| Primal Vestment dual Stone + Extra Attack; empty L1/4/7 | PH ~3179–3196 | `primalVestment` picks |
| Alchemist Stone potion empowerment | PH ~3381–3403 | Alchemist Coat stoneFunction |
| Dragon Head dual Breath modes | PH ~2909–2911 | breath flags in attack-executor / radial |
| Moonlight Inherent Finesse (example) | PH ~4239 | weapon quality; not a Power |
| Artifact PL may exceed MR×2 when printed | PH ~6295, ~8948 | grant PL from artifact level |

## 7. Actor / Compendium notes (no migration performed)

- **Echo pack JSON** under `src/packs/echo-artifacts/` mirrors generator output; Phase B requires `npm run build:packs` after definition fixes.
- **World seed** (`seed-artifact-library.ts`) copies trees into world folders; actors hold embedded copies wired by `artifact-tree-grant.ts` / `artifact-embedded-sync.ts`.
- Correct source definitions **do not** auto-update existing actors; document required resync after Phase B.
- Legacy migrations (`artifact-alignment-2026-10-25`, elorian/titan key migrations) remain relevant for older worlds.

## 8. Phase A stop

No Phase B corrections implemented. Awaiting explicit approval of which matrix rows to fix.
