# Batch 9D — General Item Artifacts Alignment

**Date:** 2026-11-04  
**Sources:** Canonical PH / Actives / Active_Buffs; `docs/audits/Destroyed_Faith_Artifacts_Homebrewery_2026-11-04_Compatibility.txt`  
**Priority:** Current Core overrides older catalogue text when they conflict.

## Inventory (11)

| # | Artifact | Key | Catalogue in Compatibility file | L10 after 9D |
|---|---|---|---|---|
| 1 | Moonlight Greatsword | `moonlightGreatsword` | Yes | Artifact Awakening (already) |
| 2 | Soul Sigil | `soulSigil` | Yes | Artifact Awakening |
| 3 | Frostbound Returning Axe | `frostboundReturningAxe` | Yes | Artifact Awakening |
| 4 | Heart of Winter | `heartOfWinter` | Yes | Artifact Awakening |
| 5 | Heartseeker | `heartseeker` | Yes | Artifact Awakening |
| 6 | Falcon Wide Brim | `falconWideBrim` | Yes | Artifact Awakening |
| 7 | Shadowgrave Armor | `shadowgraveArmor` | Yes | Artifact Awakening |
| 8 | Staff of the Dark | `staffOfTheDark` | Yes | Artifact Awakening |
| 9 | Starfallen Forceshield | `starfallenForceshield` | Yes | Artifact Awakening |
| 10 | Lantern of the Hollow Star | `lanternOfTheHollowStar` | Yes | Artifact Awakening |
| 11 | Lor-Keth's Staff | `lorKethsStaff` | **SOURCE MISSING** | Artifact Awakening (Core rule only) |

## Corrections applied (clear rule basis)

1. **All True … Ultimates / Base Completion L10 → universal Artifact Awakening** (PH ~8971–8985; Compatibility catalogue §Artifact Progression / retired Ultimates).
2. **Soul Sigil Uncanny Soul:** `reaction-phasing` → `reaction-temp-hp` (catalogue Reaction: Temporary HP PL 4/10/16 = 20/50/80).
3. **Frostbound Frost Throw:** damage Active → `active-ranged-instant-special-t4` + Slow (special-only).
4. **Frostbound Rainshield → Ivaldi's Anvil:** `reaction-special-increase` → `active-melee-weapon-aoe` (Weapon + 4/7/13 d8).
5. **Shadowgrave:** Deathly Reprisal / Hands of the Grave remapped to **Grave Call** (`active-melee-control-push-pull`) + **Deathly Reprisal** (`reaction-counter-damage-push`) per catalogue slot order.
6. **Staff of the Dark:** Might of the Dark → ranged Instant Special Hex; Vision of the End → Instant Special Soulburn (was Ruin / Melee AoE Hex).
7. **Starfallen Forceshield:** authored Reflection/Crystalized/Crystal Rain → Force Reversal / Crystalized Root / Crystal Rain Ranged AoE Attack (Spell) via catalogue templates.

## Deliberate non-corrections / conflicts documented

| Topic | Decision |
|---|---|
| **Moonlight Shadow** | LEGACY — still `ab-damage-aura`; PH/Active_Buffs redesign pending. Not remapped to Special Auras. |
| **Soul Sigil Resting Soul** | Keep R-05 Self Restoration. Older catalogue Active Buff: Healing is Core-retired. |
| **Heart of Winter L10** | Retired Ultimate (once/combat Glacial Intercept Temp HP) **not** carried into Awakening. |
| **Heart of Winter Frostwave II Slow(9)** | **Resolved in Batch 9G.3:** Frostwave II grants catalogue **Melee AoE Special: Slow PL 8** → Slow(7) / Radius 5 m (not PL 10 Slow(9)). |
| **One-handed damage 2d8→11d8 vs code 3d8→12d8** | Compatibility tables for Frostbound/Staff list L1=2d8; shared `weaponDamageForLevel` uses base+level (L1=3d8), consistent with Moonlight. Left unchanged pending Core base-profile confirmation. |
| **Lor-Keth's Staff L1–9** | **SOURCE MISSING** in Compatibility catalogue and Canonical PH. Existing catalogue-template wiring retained; L10 only aligned to Awakening. |

## Resync

General Artifact actor copies / world library trees need **Artifact Resync / Rebuild Artifact Trees** after this batch. No actor migration or pack rebuild was run here.
