# Translation report: ashguard

Source: `D:/Dev/VTT/Mastery System/src/utils/powers/ashguard.ts`

Levels scanned: **72**
Auto-applied: **52** (72%)
Needs review: **20** (28%)

## Auto-applied

- **Cinder Cleave** (active, L1) — damageRider.flat
  - effect: _Weapon DMG +1d8 damage_
  - mechanics: `{"damageRider":{"flat":"+1d8"},"applyWhen":"attack-rider"}`
- **Cinder Cleave** (active, L2) — damageRider.flat
  - effect: _Weapon DMG +2d8 damage_
  - mechanics: `{"damageRider":{"flat":"+2d8"},"applyWhen":"attack-rider"}`
- **Cinder Cleave** (active, L3) — damageRider.flat
  - effect: _Weapon DMG +3d8 damage_
  - mechanics: `{"damageRider":{"flat":"+3d8"},"applyWhen":"attack-rider"}`
- **Cinder Cleave** (active, L4) — damageRider.flat
  - effect: _Weapon DMG +4d8 damage_
  - mechanics: `{"damageRider":{"flat":"+4d8"},"applyWhen":"attack-rider"}`
- **Ember Bash** (active, L1) — damageRider.flat
  - effect: _Weapon DMG +1d8 damage_
  - mechanics: `{"damageRider":{"flat":"+1d8"},"applyWhen":"attack-rider"}`
- **Ember Bash** (active, L2) — damageRider.flat
  - effect: _Weapon DMG +2d8 damage_
  - mechanics: `{"damageRider":{"flat":"+2d8"},"applyWhen":"attack-rider"}`
- **Ember Bash** (active, L3) — damageRider.flat
  - effect: _Weapon DMG +3d8 damage_
  - mechanics: `{"damageRider":{"flat":"+3d8"},"applyWhen":"attack-rider"}`
- **Ember Bash** (active, L4) — damageRider.flat
  - effect: _Weapon DMG +4d8 damage_
  - mechanics: `{"damageRider":{"flat":"+4d8"},"applyWhen":"attack-rider"}`
- **Siege Cut** (active, L1) — damageRider.flat, damageRider.vsCondition, condition
  - effect: _Weapon DMG +1d8 damage vs. Ignited target._
  - mechanics: `{"damageRider":{"flat":"+1d8","vsCondition":"ignited","vsConditionDamage":"+1d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Cut** (active, L2) — damageRider.flat, damageRider.vsCondition, condition
  - effect: _Weapon DMG +2d8 damage vs. Ignited target._
  - mechanics: `{"damageRider":{"flat":"+2d8","vsCondition":"ignited","vsConditionDamage":"+2d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Cut** (active, L3) — damageRider.flat, damageRider.vsCondition, condition
  - effect: _Weapon DMG +3d8 damage vs. Ignited target._
  - mechanics: `{"damageRider":{"flat":"+3d8","vsCondition":"ignited","vsConditionDamage":"+3d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Siege Cut** (active, L4) — damageRider.flat, damageRider.vsCondition, condition
  - effect: _Weapon DMG +4d8 damage vs. Ignited target._
  - mechanics: `{"damageRider":{"flat":"+4d8","vsCondition":"ignited","vsConditionDamage":"+4d8"},"condition":"targetIgnited","applyWhen":"attack-rider"}`
- **Coal Plate** (passive, L1) — armor
  - effect: _While any enemy suffers from Ignite from you, gain +2 Armor._
  - mechanics: `{"armor":2,"applyWhen":"passive-slotted-active"}`
- **Coal Plate** (passive, L2) — armor
  - effect: _While any enemy suffers from Ignite from you, gain +4 Armor._
  - mechanics: `{"armor":4,"applyWhen":"passive-slotted-active"}`
- **Coal Plate** (passive, L3) — armor
  - effect: _While any enemy suffers from Ignite from you, gain +6 Armor._
  - mechanics: `{"armor":6,"applyWhen":"passive-slotted-active"}`
- **Coal Plate** (passive, L4) — armor
  - effect: _While any enemy suffers from Ignite from you, gain +8 Armor._
  - mechanics: `{"armor":8,"applyWhen":"passive-slotted-active"}`
- **Burn Tempered** (passive, L1) — saveDice
  - effect: _Gain +2 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":2},"applyWhen":"passive-slotted-active"}`
- **Burn Tempered** (passive, L2) — saveDice
  - effect: _Gain +4 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":4},"applyWhen":"passive-slotted-active"}`
- **Burn Tempered** (passive, L3) — saveDice
  - effect: _Gain +6 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":6},"applyWhen":"passive-slotted-active"}`
- **Burn Tempered** (passive, L4) — saveDice
  - effect: _Gain +8 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":8},"applyWhen":"passive-slotted-active"}`
- **Iron Flame** (passive, L1) — damageRider.flat, condition
  - effect: _Once per round, the first time you hit an Ignited target, add +1d8 damage._
  - mechanics: `{"damageRider":{"flat":"+1d8"},"condition":"targetIgnited","applyWhen":"passive-slotted-active"}`
- **Iron Flame** (passive, L2) — damageRider.flat, condition
  - effect: _Once per round, the first time you hit an Ignited target, add +2d8 damage._
  - mechanics: `{"damageRider":{"flat":"+2d8"},"condition":"targetIgnited","applyWhen":"passive-slotted-active"}`
- **Iron Flame** (passive, L3) — damageRider.flat, condition
  - effect: _Once per round, the first time you hit an Ignited target, add +3d8 damage._
  - mechanics: `{"damageRider":{"flat":"+3d8"},"condition":"targetIgnited","applyWhen":"passive-slotted-active"}`
- **Iron Flame** (passive, L4) — damageRider.flat, condition
  - effect: _Once per round, the first time you hit an Ignited target, add +4d8 damage._
  - mechanics: `{"damageRider":{"flat":"+4d8"},"condition":"targetIgnited","applyWhen":"passive-slotted-active"}`
- **Flare Guard** (reaction, L1) — armor
  - effect: _Gain +2 Armor against that attack._
  - mechanics: `{"armor":2,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Flare Guard** (reaction, L2) — armor
  - effect: _Gain +4 Armor against that attack._
  - mechanics: `{"armor":4,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Flare Guard** (reaction, L3) — armor
  - effect: _Gain +6 Armor against that attack._
  - mechanics: `{"armor":6,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Flare Guard** (reaction, L4) — armor
  - effect: _Gain +8 Armor against that attack._
  - mechanics: `{"armor":8,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Step Through Flame** (reaction, L1) — armor
  - effect: _Move up to 2 m and gain +2 Armor against that attack._
  - mechanics: `{"armor":2,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Step Through Flame** (reaction, L2) — armor
  - effect: _Move up to 4 m and gain +4 Armor against that attack._
  - mechanics: `{"armor":4,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Step Through Flame** (reaction, L3) — armor
  - effect: _Move up to 6 m and gain +6 Armor against that attack._
  - mechanics: `{"armor":6,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Step Through Flame** (reaction, L4) — armor
  - effect: _Move up to 8 m and gain +8 Armor against that attack._
  - mechanics: `{"armor":8,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Feed the Furnace** (reaction, L1) — armor
  - effect: _Gain +2 Armor until the start of your next turn._
  - mechanics: `{"armor":2,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Feed the Furnace** (reaction, L2) — armor
  - effect: _Gain +4 Armor until the start of your next turn._
  - mechanics: `{"armor":4,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Feed the Furnace** (reaction, L3) — armor
  - effect: _Gain +6 Armor until the start of your next turn._
  - mechanics: `{"armor":6,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Feed the Furnace** (reaction, L4) — armor
  - effect: _Gain +8 Armor until the start of your next turn._
  - mechanics: `{"armor":8,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`
- **Forge Shell** (activeBuff, L1) — armor
  - effect: _Gain +3 Armor._
  - mechanics: `{"armor":3,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Forge Shell** (activeBuff, L2) — armor
  - effect: _Gain +5 Armor._
  - mechanics: `{"armor":5,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Forge Shell** (activeBuff, L3) — armor
  - effect: _Gain +7 Armor._
  - mechanics: `{"armor":7,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Forge Shell** (activeBuff, L4) — armor
  - effect: _Gain +9 Armor._
  - mechanics: `{"armor":9,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Combustion Plate** (activeBuff, L1) — armor
  - effect: _While any enemy is suffering Ignite from you, gain +4 Armor._
  - mechanics: `{"armor":4,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Combustion Plate** (activeBuff, L2) — armor
  - effect: _While any enemy is suffering Ignite from you, gain +6 Armor._
  - mechanics: `{"armor":6,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Combustion Plate** (activeBuff, L3) — armor
  - effect: _While any enemy is suffering Ignite from you, gain +8 Armor._
  - mechanics: `{"armor":8,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Combustion Plate** (activeBuff, L4) — armor
  - effect: _While any enemy is suffering Ignite from you, gain +10 Armor._
  - mechanics: `{"armor":10,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Coals of War** (activeBuff, L1) — armor, damageRider.flat, condition
  - effect: _The first time each round you hit an Ignited target, gain +2 Armor and deal +1d8 damage._
  - mechanics: `{"armor":2,"damageRider":{"flat":"+1d8"},"condition":"targetIgnited","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Coals of War** (activeBuff, L2) — armor, damageRider.flat, condition
  - effect: _The first time each round you hit an Ignited target, gain +3 Armor and deal +2d8 damage._
  - mechanics: `{"armor":3,"damageRider":{"flat":"+2d8"},"condition":"targetIgnited","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Coals of War** (activeBuff, L3) — armor, damageRider.flat, condition
  - effect: _The first time each round you hit an Ignited target, gain +4 Armor and deal +3d8 damage._
  - mechanics: `{"armor":4,"damageRider":{"flat":"+3d8"},"condition":"targetIgnited","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Coals of War** (activeBuff, L4) — armor, damageRider.flat, condition
  - effect: _The first time each round you hit an Ignited target, gain +5 Armor and deal +4d8 damage._
  - mechanics: `{"armor":5,"damageRider":{"flat":"+4d8"},"condition":"targetIgnited","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`
- **Smoke Step** (movement, L1) — armor
  - effect: _After you attack, move up to 6 m and gain +1 Armor until the start of your next turn._
  - mechanics: `{"armor":1,"applyWhen":"attack-rider"}`
- **Smoke Step** (movement, L2) — armor
  - effect: _After you attack, move up to 10 m and gain +2 Armor until the start of your next turn._
  - mechanics: `{"armor":2,"applyWhen":"attack-rider"}`
- **Smoke Step** (movement, L3) — armor
  - effect: _After you attack, move up to 14 m and gain +3 Armor until the start of your next turn._
  - mechanics: `{"armor":3,"applyWhen":"attack-rider"}`
- **Smoke Step** (movement, L4) — armor
  - effect: _After you attack, move up to 18 m and gain +4 Armor until the start of your next turn._
  - mechanics: `{"armor":4,"applyWhen":"attack-rider"}`

## Needs review (no confident match)

- **Scorch Ring** (active, L1)
  - effect: _Enemies in the area take 1d8 damage._
- **Scorch Ring** (active, L2)
  - effect: _Enemies in the area take 1d8 damage._
- **Scorch Ring** (active, L3)
  - effect: _Enemies in the area take 2d8 damage._
- **Scorch Ring** (active, L4)
  - effect: _Enemies in the area take 3d8 damage._
- **Furnace Heart** (passive, L1)
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 1d8 HP._
- **Furnace Heart** (passive, L2)
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 2d8 HP._
- **Furnace Heart** (passive, L3)
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 3d8 HP._
- **Furnace Heart** (passive, L4)
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 4d8 HP._
- **Answering Heat** (reaction, L1)
  - effect: _The attacker catches fire._
- **Answering Heat** (reaction, L2)
  - effect: _The attacker catches fire._
- **Answering Heat** (reaction, L3)
  - effect: _The attacker catches fire._
- **Answering Heat** (reaction, L4)
  - effect: _The attacker catches fire._
- **Walking Furnace** (activeBuff, L1)
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +1._
- **Walking Furnace** (activeBuff, L2)
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +2._
- **Walking Furnace** (activeBuff, L3)
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +3._
- **Walking Furnace** (activeBuff, L4)
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +4._
- **Ember Stride** (movement, L1)
  - effect: _Move up to 6 m. Your next hit this turn applies Ignite(1)._
- **Ember Stride** (movement, L2)
  - effect: _Move up to 10 m. Your next hit this turn applies Ignite(2)._
- **Ember Stride** (movement, L3)
  - effect: _Move up to 14 m. Your next hit this turn applies Ignite(3)._
- **Ember Stride** (movement, L4)
  - effect: _Move up to 18 m. Your next hit this turn applies Ignite(4)._


## Ashguard — System Mapping (copy-paste)

### Notes
- I corrected **Siege Cut** to use **Penetration vs Ignited**, not bonus damage vs Ignited.
- I added missing conditions and trigger limits where needed.
- I kept your naming style, but normalized a few structures so they are consistent.

---

## Actives

- **Cinder Cleave** (active, L1) — damageRider.flat, specials
  - effect: _Weapon DMG +1d8 damage. Apply Ignite(2)._
  - mechanics: `{"damageRider":{"flat":"+1d8"},"specials":[{"type":"ignite","value":2}],"applyWhen":"attack-rider"}`

- **Cinder Cleave** (active, L2) — damageRider.flat, specials
  - effect: _Weapon DMG +2d8 damage. Apply Ignite(3)._
  - mechanics: `{"damageRider":{"flat":"+2d8"},"specials":[{"type":"ignite","value":3}],"applyWhen":"attack-rider"}`

- **Cinder Cleave** (active, L3) — damageRider.flat, specials
  - effect: _Weapon DMG +3d8 damage. Apply Ignite(4)._
  - mechanics: `{"damageRider":{"flat":"+3d8"},"specials":[{"type":"ignite","value":4}],"applyWhen":"attack-rider"}`

- **Cinder Cleave** (active, L4) — damageRider.flat, specials
  - effect: _Weapon DMG +4d8 damage. Apply Ignite(4)._
  - mechanics: `{"damageRider":{"flat":"+4d8"},"specials":[{"type":"ignite","value":4}],"applyWhen":"attack-rider"}`

- **Ember Bash** (active, L1) — damageRider.flat, specials
  - effect: _Weapon DMG +1d8 damage. Push(2). Apply Ignite(1)._
  - mechanics: `{"damageRider":{"flat":"+1d8"},"specials":[{"type":"push","value":2},{"type":"ignite","value":1}],"applyWhen":"attack-rider"}`

- **Ember Bash** (active, L2) — damageRider.flat, specials
  - effect: _Weapon DMG +2d8 damage. Push(4). Apply Ignite(2)._
  - mechanics: `{"damageRider":{"flat":"+2d8"},"specials":[{"type":"push","value":4},{"type":"ignite","value":2}],"applyWhen":"attack-rider"}`

- **Ember Bash** (active, L3) — damageRider.flat, specials
  - effect: _Weapon DMG +3d8 damage. Push(6). Apply Ignite(2)._
  - mechanics: `{"damageRider":{"flat":"+3d8"},"specials":[{"type":"push","value":6},{"type":"ignite","value":2}],"applyWhen":"attack-rider"}`

- **Ember Bash** (active, L4) — damageRider.flat, specials
  - effect: _Weapon DMG +4d8 damage. Push(8). Apply Ignite(3)._
  - mechanics: `{"damageRider":{"flat":"+4d8"},"specials":[{"type":"push","value":8},{"type":"ignite","value":3}],"applyWhen":"attack-rider"}`

- **Scorch Ring** (active, L1) — area, damage, specials
  - effect: _Enemies in radius 2 m take 1d8 damage and Ignite(1)._
  - mechanics: `{"area":{"shape":"radius","sizeM":2,"target":"enemies"},"damage":{"flat":"1d8"},"specials":[{"type":"ignite","value":1}],"applyWhen":"active-use"}`

- **Scorch Ring** (active, L2) — area, damage, specials
  - effect: _Enemies in radius 4 m take 1d8 damage and Ignite(2)._
  - mechanics: `{"area":{"shape":"radius","sizeM":4,"target":"enemies"},"damage":{"flat":"1d8"},"specials":[{"type":"ignite","value":2}],"applyWhen":"active-use"}`

- **Scorch Ring** (active, L3) — area, damage, specials
  - effect: _Enemies in radius 6 m take 2d8 damage and Ignite(2)._
  - mechanics: `{"area":{"shape":"radius","sizeM":6,"target":"enemies"},"damage":{"flat":"2d8"},"specials":[{"type":"ignite","value":2}],"applyWhen":"active-use"}`

- **Scorch Ring** (active, L4) — area, damage, specials
  - effect: _Enemies in radius 8 m take 3d8 damage and Ignite(3)._
  - mechanics: `{"area":{"shape":"radius","sizeM":8,"target":"enemies"},"damage":{"flat":"3d8"},"specials":[{"type":"ignite","value":3}],"applyWhen":"active-use"}`

- **Siege Cut** (active, L1) — damageRider.flat, specials
  - effect: _Weapon DMG +1d8 damage. Against an Ignited target, gain Penetration(2)._
  - mechanics: `{"damageRider":{"flat":"+1d8"},"specials":[{"type":"penetration","value":2,"condition":"targetIgnited"}],"applyWhen":"attack-rider"}`

- **Siege Cut** (active, L2) — damageRider.flat, specials
  - effect: _Weapon DMG +2d8 damage. Against an Ignited target, gain Penetration(4)._
  - mechanics: `{"damageRider":{"flat":"+2d8"},"specials":[{"type":"penetration","value":4,"condition":"targetIgnited"}],"applyWhen":"attack-rider"}`

- **Siege Cut** (active, L3) — damageRider.flat, specials
  - effect: _Weapon DMG +3d8 damage. Against an Ignited target, gain Penetration(6)._
  - mechanics: `{"damageRider":{"flat":"+3d8"},"specials":[{"type":"penetration","value":6,"condition":"targetIgnited"}],"applyWhen":"attack-rider"}`

- **Siege Cut** (active, L4) — damageRider.flat, specials
  - effect: _Weapon DMG +4d8 damage. Against an Ignited target, gain Penetration(8)._
  - mechanics: `{"damageRider":{"flat":"+4d8"},"specials":[{"type":"penetration","value":8,"condition":"targetIgnited"}],"applyWhen":"attack-rider"}`

---

## Passives

- **Coal Plate** (passive, L1) — armor, condition
  - effect: _While any enemy suffers from Ignite from you, gain +2 Armor._
  - mechanics: `{"armor":2,"condition":"anyEnemyIgnitedByYou","applyWhen":"passive-slotted-active"}`

- **Coal Plate** (passive, L2) — armor, condition
  - effect: _While any enemy suffers from Ignite from you, gain +4 Armor._
  - mechanics: `{"armor":4,"condition":"anyEnemyIgnitedByYou","applyWhen":"passive-slotted-active"}`

- **Coal Plate** (passive, L3) — armor, condition
  - effect: _While any enemy suffers from Ignite from you, gain +6 Armor._
  - mechanics: `{"armor":6,"condition":"anyEnemyIgnitedByYou","applyWhen":"passive-slotted-active"}`

- **Coal Plate** (passive, L4) — armor, condition
  - effect: _While any enemy suffers from Ignite from you, gain +8 Armor._
  - mechanics: `{"armor":8,"condition":"anyEnemyIgnitedByYou","applyWhen":"passive-slotted-active"}`

- **Burn Tempered** (passive, L1) — saveDice
  - effect: _Gain +2 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":2},"applyWhen":"passive-slotted-active"}`

- **Burn Tempered** (passive, L2) — saveDice
  - effect: _Gain +4 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":4},"applyWhen":"passive-slotted-active"}`

- **Burn Tempered** (passive, L3) — saveDice
  - effect: _Gain +6 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":6},"applyWhen":"passive-slotted-active"}`

- **Burn Tempered** (passive, L4) — saveDice
  - effect: _Gain +8 dice to Body Saving Throws._
  - mechanics: `{"saveDice":{"body":8},"applyWhen":"passive-slotted-active"}`

- **Furnace Heart** (passive, L1) — healing, condition, trigger
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 1d8 HP._
  - mechanics: `{"healing":{"flat":"1d8"},"condition":"anyEnemyIgnitedByYou","trigger":"endOfTurn","applyWhen":"passive-slotted-active"}`

- **Furnace Heart** (passive, L2) — healing, condition, trigger
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 2d8 HP._
  - mechanics: `{"healing":{"flat":"2d8"},"condition":"anyEnemyIgnitedByYou","trigger":"endOfTurn","applyWhen":"passive-slotted-active"}`

- **Furnace Heart** (passive, L3) — healing, condition, trigger
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 3d8 HP._
  - mechanics: `{"healing":{"flat":"3d8"},"condition":"anyEnemyIgnitedByYou","trigger":"endOfTurn","applyWhen":"passive-slotted-active"}`

- **Furnace Heart** (passive, L4) — healing, condition, trigger
  - effect: _End of your turn: if any enemy suffers from Ignite from you, heal 4d8 HP._
  - mechanics: `{"healing":{"flat":"4d8"},"condition":"anyEnemyIgnitedByYou","trigger":"endOfTurn","applyWhen":"passive-slotted-active"}`

- **Iron Flame** (passive, L1) — damageRider.flat, condition, triggerLimit
  - effect: _Once per round, the first time you hit an Ignited target, add +1d8 damage._
  - mechanics: `{"damageRider":{"flat":"+1d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"passive-slotted-active"}`

- **Iron Flame** (passive, L2) — damageRider.flat, condition, triggerLimit
  - effect: _Once per round, the first time you hit an Ignited target, add +2d8 damage._
  - mechanics: `{"damageRider":{"flat":"+2d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"passive-slotted-active"}`

- **Iron Flame** (passive, L3) — damageRider.flat, condition, triggerLimit
  - effect: _Once per round, the first time you hit an Ignited target, add +3d8 damage._
  - mechanics: `{"damageRider":{"flat":"+3d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"passive-slotted-active"}`

- **Iron Flame** (passive, L4) — damageRider.flat, condition, triggerLimit
  - effect: _Once per round, the first time you hit an Ignited target, add +4d8 damage._
  - mechanics: `{"damageRider":{"flat":"+4d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"passive-slotted-active"}`

---

## Reactions

- **Flare Guard** (reaction, L1) — armor
  - effect: _Gain +2 Armor against that attack._
  - mechanics: `{"armor":2,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Flare Guard** (reaction, L2) — armor
  - effect: _Gain +4 Armor against that attack._
  - mechanics: `{"armor":4,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Flare Guard** (reaction, L3) — armor
  - effect: _Gain +6 Armor against that attack._
  - mechanics: `{"armor":6,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Flare Guard** (reaction, L4) — armor
  - effect: _Gain +8 Armor against that attack._
  - mechanics: `{"armor":8,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Answering Heat** (reaction, L1) — specials
  - effect: _The attacker catches fire with Ignite(1)._
  - mechanics: `{"specials":[{"type":"ignite","value":1,"target":"attacker"}],"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Answering Heat** (reaction, L2) — specials
  - effect: _The attacker catches fire with Ignite(2)._
  - mechanics: `{"specials":[{"type":"ignite","value":2,"target":"attacker"}],"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Answering Heat** (reaction, L3) — specials
  - effect: _The attacker catches fire with Ignite(3)._
  - mechanics: `{"specials":[{"type":"ignite","value":3,"target":"attacker"}],"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Answering Heat** (reaction, L4) — specials
  - effect: _The attacker catches fire with Ignite(4)._
  - mechanics: `{"specials":[{"type":"ignite","value":4,"target":"attacker"}],"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Step Through Flame** (reaction, L1) — movement, armor
  - effect: _Move up to 2 m and gain +2 Armor against that attack._
  - mechanics: `{"movement":{"moveM":2},"armor":2,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Step Through Flame** (reaction, L2) — movement, armor
  - effect: _Move up to 4 m and gain +4 Armor against that attack._
  - mechanics: `{"movement":{"moveM":4},"armor":4,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Step Through Flame** (reaction, L3) — movement, armor
  - effect: _Move up to 6 m and gain +6 Armor against that attack._
  - mechanics: `{"movement":{"moveM":6},"armor":6,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Step Through Flame** (reaction, L4) — movement, armor
  - effect: _Move up to 8 m and gain +8 Armor against that attack._
  - mechanics: `{"movement":{"moveM":8},"armor":8,"applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Feed the Furnace** (reaction, L1) — armor, trigger
  - effect: _Gain +2 Armor until the start of your next turn when your Ignite deals damage._
  - mechanics: `{"armor":2,"trigger":"igniteTickByYou","applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Feed the Furnace** (reaction, L2) — armor, trigger
  - effect: _Gain +4 Armor until the start of your next turn when your Ignite deals damage._
  - mechanics: `{"armor":4,"trigger":"igniteTickByYou","applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Feed the Furnace** (reaction, L3) — armor, trigger
  - effect: _Gain +6 Armor until the start of your next turn when your Ignite deals damage._
  - mechanics: `{"armor":6,"trigger":"igniteTickByYou","applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

- **Feed the Furnace** (reaction, L4) — armor, trigger
  - effect: _Gain +8 Armor until the start of your next turn when your Ignite deals damage._
  - mechanics: `{"armor":8,"trigger":"igniteTickByYou","applyWhen":"reaction-once-per-round","usageLimit":{"per":"round","max":1}}`

---

## Active Buffs

- **Forge Shell** (activeBuff, L1) — armor
  - effect: _Gain +3 Armor._
  - mechanics: `{"armor":3,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Forge Shell** (activeBuff, L2) — armor
  - effect: _Gain +5 Armor._
  - mechanics: `{"armor":5,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Forge Shell** (activeBuff, L3) — armor
  - effect: _Gain +7 Armor._
  - mechanics: `{"armor":7,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Forge Shell** (activeBuff, L4) — armor
  - effect: _Gain +9 Armor._
  - mechanics: `{"armor":9,"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Walking Furnace** (activeBuff, L1) — area, modifySpecial, trigger
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +1._
  - mechanics: `{"area":{"shape":"radius","sizeM":4,"target":"enemies"},"modifySpecial":{"type":"ignite","mode":"increaseExisting","minExisting":1,"amount":1},"trigger":"endOfTurn","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Walking Furnace** (activeBuff, L2) — area, modifySpecial, trigger
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +2._
  - mechanics: `{"area":{"shape":"radius","sizeM":6,"target":"enemies"},"modifySpecial":{"type":"ignite","mode":"increaseExisting","minExisting":1,"amount":2},"trigger":"endOfTurn","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Walking Furnace** (activeBuff, L3) — area, modifySpecial, trigger
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +3._
  - mechanics: `{"area":{"shape":"radius","sizeM":8,"target":"enemies"},"modifySpecial":{"type":"ignite","mode":"increaseExisting","minExisting":1,"amount":3},"trigger":"endOfTurn","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Walking Furnace** (activeBuff, L4) — area, modifySpecial, trigger
  - effect: _At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +4._
  - mechanics: `{"area":{"shape":"radius","sizeM":10,"target":"enemies"},"modifySpecial":{"type":"ignite","mode":"increaseExisting","minExisting":1,"amount":4},"trigger":"endOfTurn","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Combustion Plate** (activeBuff, L1) — armor, condition
  - effect: _While any enemy is suffering Ignite from you, gain +4 Armor._
  - mechanics: `{"armor":4,"condition":"anyEnemyIgnitedByYou","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Combustion Plate** (activeBuff, L2) — armor, condition
  - effect: _While any enemy is suffering Ignite from you, gain +6 Armor._
  - mechanics: `{"armor":6,"condition":"anyEnemyIgnitedByYou","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Combustion Plate** (activeBuff, L3) — armor, condition
  - effect: _While any enemy is suffering Ignite from you, gain +8 Armor._
  - mechanics: `{"armor":8,"condition":"anyEnemyIgnitedByYou","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Combustion Plate** (activeBuff, L4) — armor, condition
  - effect: _While any enemy is suffering Ignite from you, gain +10 Armor._
  - mechanics: `{"armor":10,"condition":"anyEnemyIgnitedByYou","applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Coals of War** (activeBuff, L1) — armor, damageRider.flat, condition, triggerLimit
  - effect: _The first time each round you hit an Ignited target, gain +2 Armor and deal +1d8 damage._
  - mechanics: `{"armor":2,"damageRider":{"flat":"+1d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Coals of War** (activeBuff, L2) — armor, damageRider.flat, condition, triggerLimit
  - effect: _The first time each round you hit an Ignited target, gain +3 Armor and deal +2d8 damage._
  - mechanics: `{"armor":3,"damageRider":{"flat":"+2d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Coals of War** (activeBuff, L3) — armor, damageRider.flat, condition, triggerLimit
  - effect: _The first time each round you hit an Ignited target, gain +4 Armor and deal +3d8 damage._
  - mechanics: `{"armor":4,"damageRider":{"flat":"+3d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

- **Coals of War** (activeBuff, L4) — armor, damageRider.flat, condition, triggerLimit
  - effect: _The first time each round you hit an Ignited target, gain +5 Armor and deal +4d8 damage._
  - mechanics: `{"armor":5,"damageRider":{"flat":"+4d8"},"condition":"targetIgnited","triggerLimit":{"per":"round","max":1},"applyWhen":"activeBuff-active","duration":"masteryRankRounds"}`

---

## Movement

- **Ember Stride** (movement, L1) — movement, grantNextHitSpecial
  - effect: _Move up to 6 m. Your next hit this turn applies Ignite(1)._
  - mechanics: `{"movement":{"moveM":6},"grantNextHitSpecial":{"type":"ignite","value":1,"expires":"endOfTurn"},"applyWhen":"movement-use"}`

- **Ember Stride** (movement, L2) — movement, grantNextHitSpecial
  - effect: _Move up to 10 m. Your next hit this turn applies Ignite(2)._
  - mechanics: `{"movement":{"moveM":10},"grantNextHitSpecial":{"type":"ignite","value":2,"expires":"endOfTurn"},"applyWhen":"movement-use"}`

- **Ember Stride** (movement, L3) — movement, grantNextHitSpecial
  - effect: _Move up to 14 m. Your next hit this turn applies Ignite(3)._
  - mechanics: `{"movement":{"moveM":14},"grantNextHitSpecial":{"type":"ignite","value":3,"expires":"endOfTurn"},"applyWhen":"movement-use"}`

- **Ember Stride** (movement, L4) — movement, grantNextHitSpecial
  - effect: _Move up to 18 m. Your next hit this turn applies Ignite(4)._
  - mechanics: `{"movement":{"moveM":18},"grantNextHitSpecial":{"type":"ignite","value":4,"expires":"endOfTurn"},"applyWhen":"movement-use"}`

- **Smoke Step** (movement, L1) — movement, armor
  - effect: _After you attack, move up to 6 m and gain +1 Armor until the start of your next turn._
  - mechanics: `{"movement":{"moveM":6,"trigger":"afterAttack"},"armor":1,"duration":"untilStartOfNextTurn","applyWhen":"movement-use"}`

- **Smoke Step** (movement, L2) — movement, armor
  - effect: _After you attack, move up to 10 m and gain +2 Armor until the start of your next turn._
  - mechanics: `{"movement":{"moveM":10,"trigger":"afterAttack"},"armor":2,"duration":"untilStartOfNextTurn","applyWhen":"movement-use"}`

- **Smoke Step** (movement, L3) — movement, armor
  - effect: _After you attack, move up to 14 m and gain +3 Armor until the start of your next turn._
  - mechanics: `{"movement":{"moveM":14,"trigger":"afterAttack"},"armor":3,"duration":"untilStartOfNextTurn","applyWhen":"movement-use"}`

- **Smoke Step** (movement, L4) — movement, armor
  - effect: _After you attack, move up to 18 m and gain +4 Armor until the start of your next turn._
  - mechanics: `{"movement":{"moveM":18,"trigger":"afterAttack"},"armor":4,"duration":"untilStartOfNextTurn","applyWhen":"movement-use"}`