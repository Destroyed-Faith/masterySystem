# Translation report: pyre-calculus

Source: `D:/Dev/VTT/Mastery System/src/utils/spells/pyre-calculus.ts`

Levels scanned: **32**
Auto-applied: **8** (25%)
Needs review: **24** (75%)

## Auto-applied

- **Bastion Flare** (active, L1) — armor
  - effect: _Deal 1d8 damage and gain +2 Armor until the start of your next turn._
  - mechanics: `{"armor":2,"applyWhen":"attack-rider"}`
- **Bastion Flare** (active, L2) — armor
  - effect: _Deal 2d8 damage and gain +4 Armor until the start of your next turn._
  - mechanics: `{"armor":4,"applyWhen":"attack-rider"}`
- **Bastion Flare** (active, L3) — armor
  - effect: _Deal 3d8 damage and gain +6 Armor until the start of your next turn._
  - mechanics: `{"armor":6,"applyWhen":"attack-rider"}`
- **Bastion Flare** (active, L4) — armor
  - effect: _Deal 4d8 damage and gain +8 Armor until the start of your next turn._
  - mechanics: `{"armor":8,"applyWhen":"attack-rider"}`
- **Siege Flame** (active, L1) — damageRider.vsCondition, condition
  - effect: _1d8 damage vs. Ignited target_
  - mechanics: `{"damageRider":{"vsCondition":"ignited","vsConditionDamage":"+1d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Flame** (active, L2) — damageRider.vsCondition, condition
  - effect: _2d8 damage vs. Ignited target_
  - mechanics: `{"damageRider":{"vsCondition":"ignited","vsConditionDamage":"+2d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Flame** (active, L3) — damageRider.vsCondition, condition
  - effect: _3d8 damage vs. Ignited target_
  - mechanics: `{"damageRider":{"vsCondition":"ignited","vsConditionDamage":"+3d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Flame** (active, L4) — damageRider.vsCondition, condition
  - effect: _4d8 damage vs. Ignited target_
  - mechanics: `{"damageRider":{"vsCondition":"ignited","vsConditionDamage":"+4d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`

## Needs review (no confident match)

- **Ember Lance** (active, L1)
  - effect: _1d8 damage_
- **Ember Lance** (active, L2)
  - effect: _2d8 damage_
- **Ember Lance** (active, L3)
  - effect: _3d8 damage_
- **Ember Lance** (active, L4)
  - effect: _4d8 damage_
- **Flame Fan** (active, L1)
  - effect: _1d8 damage_
- **Flame Fan** (active, L2)
  - effect: _1d8 damage_
- **Flame Fan** (active, L3)
  - effect: _2d8 damage_
- **Flame Fan** (active, L4)
  - effect: _3d8 damage_
- **Furnace Mark** (active, L1)
  - effect: _—_
- **Furnace Mark** (active, L2)
  - effect: _—_
- **Furnace Mark** (active, L3)
  - effect: _—_
- **Furnace Mark** (active, L4)
  - effect: _—_
- **Crown of Cinders** (active, L1)
  - effect: _—_
- **Crown of Cinders** (active, L2)
  - effect: _—_
- **Crown of Cinders** (active, L3)
  - effect: _—_
- **Crown of Cinders** (active, L4)
  - effect: _—_
- **Ash Fold** (movement, L1)
  - effect: _Teleport up to 4 m._
- **Ash Fold** (movement, L2)
  - effect: _Teleport up to 8 m._
- **Ash Fold** (movement, L3)
  - effect: _Teleport up to 12 m._
- **Ash Fold** (movement, L4)
  - effect: _Teleport up to 15 m._
- **Backdraft Step** (movement, L1)
  - effect: _After casting a Spell, teleport up to 4 m._
- **Backdraft Step** (movement, L2)
  - effect: _After casting a Spell, teleport up to 8 m._
- **Backdraft Step** (movement, L3)
  - effect: _After casting a Spell, teleport up to 12 m._
- **Backdraft Step** (movement, L4)
  - effect: _After casting a Spell, teleport up to 15 m._
