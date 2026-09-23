# Destroyed Faith - Mastery System Balance Framework

**Public technical reference for Power design, pricing, and mechanical audit**

**Framework version:** 1.1  
**Rules status:** Destroyed Faith 0.9.9.x Beta  
**Canonical sync:** 2026-09-22  
**Primary Core baseline:** Destroyed Faith Core v0.9.9.0 (2026-09-22)  
**Scope:** Powers, Specials, Movement, Artifacts, Stone Power Support, and the separation between character construction math and encounter calibration.

---

## 1. Purpose

Destroyed Faith uses a shared mechanical language. Characters may represent radically different ideas in the fiction, but their mechanical effects are built from the same limited set of measurable structures: damage, defense, range, area, Specials, action economy, movement quality, and dedicated subsystems.

This document exposes the design framework behind those structures.

Its purpose is to make Power design:

- **consistent** - equivalent mechanical effects use the same underlying pricing logic;
- **auditable** - another designer can reproduce the calculation;
- **extensible** - new Powers can be added without inventing a new balance language every time;
- **bounded** - premium mechanics remain in dedicated subsystems instead of leaking into cheaper templates;
- **transparent** - unused budget, milestone progression, coverage costs, and explicit exceptions are visible rather than hidden.

The framework does **not** claim that every character build, party composition, encounter, or tactical situation has identical empirical strength.

> **Power Points (PP) demonstrate internal mechanical normalization, not universal empirical equality.**
>
> Encounter performance, party synergy, player execution, Artifacts, Stones, terrain, objectives, and enemy behavior are additional layers. Those layers are tested through play and through the separate Quick Encounter calibration framework.

This distinction is deliberate. The mathematical framework normalizes the building blocks. Playtests measure what happens when those building blocks interact.

---

## 2. Source Authority and Precedence

This framework is derivative documentation. It does not override the game rules.

When two documents appear to disagree, use this order:

1. **Current Destroyed Faith Core** governs global gameplay behavior.
2. The current **Power Catalogue for the relevant Power Type** governs category-specific construction, pricing, restrictions, and exact Power entries.
3. An **exact dedicated catalogue entry** overrides a generic construction heuristic for that subsystem.
4. An Artifact **Technical Reference** inherits the exact current catalogue Power it names. Explicit Artifact restrictions may narrow its source, target, Range, Trigger, weapon, or delivery profile.
5. Character sheets, Quick Play sheets, and other runtime aids are presentation layers. They must not silently rewrite a primary rule. If they expose a later structural decision that an upstream rules document has not yet been updated to reflect, the mismatch must be flagged.
6. The **Quick Encounter** framework calibrates NPCs and encounters. It does not define player Power PP.
7. This **Balance Framework / AGENT.md** explains and audits the preceding sources. It never overrides them.

If authoritative sources conflict, do **not** silently invent a hybrid rule. Record the conflict, choose the higher-precedence source for current use, and fix the stale source upstream.

### Audited source set

This public audit was checked against:

| Source | Version used |
|---|---|
| Destroyed Faith Core | v0.9.9.0, 2026-09-22 |
| Actives | v0.9.9.0, 2026-09-22 |
| Active Buffs | v0.9.9.0, 2026-09-22 |
| Passives | v0.9.9.0, 2026-09-22 |
| Reactions | v0.9.9.0, 2026-09-22 |
| Movement Powers | v0.9.8, 2026-08-01 |
| Artifacts | v0.9.8, 2026-07-31, with later file-level corrections present in the audited copy |
| Quick Encounter | v0.7 Beta, based on Core v0.9.8.2, with MR3-MR6 appendix present in the audited copy |
| Alaris Quick Play Sheet | audited runtime reference, 2026-09-02 |

---

## 3. What PP Means

PP is a **design budget** used to normalize mechanical value inside a Power Type.

It is not XP. It is not a currency spent by a player at the table. It is not a universal conversion rate between every effect in the game.

A Power's target PP tells the designer approximately how much mechanical effect that Power may contain at a given Power Level **within its own category and construction rules**.

Three principles follow from that:

### 3.1 Category context matters

The same-looking benefit can have different value depending on timing and reliability.

For example, Armor that is always active is not priced like Armor that protects against one triggering hit. Damage dealt automatically by a Reaction is not priced like damage that requires an attack. Movement is not priced by the same universal PP-per-meter curve as Range.

Never transplant a price from one Power Type into another unless the receiving catalogue explicitly does so.

### 3.2 A target is not a requirement to fill every point

A legal Power may intentionally underspend its target when:

- the effect advances only at discrete milestones;
- the next legal increase would exceed the intended structure;
- spending the remainder would add an unrelated rider;
- a Special-first design would become a damage-first design if filler were added;
- the mechanic belongs to a closed premium subsystem with a fixed progression.

Unused PP is preferable to mechanical filler.

### 3.3 Near-target evaluation

For a continuous axis where a near-exact fit is possible, a value within roughly **5 PP** of the target is normally considered cleanly on-curve.

This is an audit convention, not a license to add arbitrary effects. Discrete tables and dedicated subsystem progressions may intentionally deviate by more than 5 PP. Their exact catalogue entry controls.

Minimum-function exceptions may modestly exceed a target if the effect has no cheaper legal version. Such exceptions must be explicit and reproducible.

There is **no universal +/-10% rule** and no general capstone +/-15% rule.

---

## 4. Core Mechanical Assumptions

Power math is only meaningful if it is built on the correct base game.

### 4.1 Dice model

Most character rolls use:

> **Attribute k Mastery Rank**

- Roll a number of d8 equal to the relevant Attribute after all legal Pool construction rules and modifiers.
- Keep a number of dice equal to Mastery Rank.
- Natural 8s explode unless a rule says otherwise.
- Normal Attributes use the compressed 1-40 scale.
- After the final Pool is known, Guaranteed Eight may exchange 8 Pool dice for one exploding natural 8, provided at least Mastery Rank actual dice remain to be rolled.

**Power Level does not determine Keep.**

Power Level determines the entry of the Power being used. Mastery Rank determines the normal Keep value.

### 4.2 Damage dice

Damage uses d8s unless an exact rule states otherwise.

Damage dice do not explode by default.

A weapon Power that says **weapon damage + Xd8** adds the listed bonus damage to the weapon's normal printed damage. It does not add the attacker's Attribute to the Damage Pool unless that weapon or another explicit rule says so.

### 4.3 Normal round economy

A creature normally receives each Round:

- 1 Movement;
- 1 Attack Action;
- 1 Reaction.

Movement and Attack Action may be used in either legal order on the creature's Turn.

### 4.4 Named Power use limit

A specific named Power may normally be used only **once per Round**.

Extra Attack Actions, extra Reactions, or extra Movements do not let a character repeat the same named Power during that Round.

Basic Attacks are not Powers and may be repeated if the character has enough Attack Actions.

### 4.5 Initiative

Initiative is rolled once at the start of combat:

> **MR d8, keep all**

Natural 8s explode. Initiative Order normally remains fixed unless an explicit rule changes Initiative or reopens the Initiative Shop.

### 4.6 Raises

Each declared Raise increases the required result by **+4**.

- A Martial Raise pays **MR Damage Dice** up front.
- A Spell Raise pays **MR** from the Spell's damage dice pool or Special budget, as allowed by the Spell rules.

Do not treat a Raise as a generic +4 bonus purchased with PP.

### 4.7 Damage mitigation order

Unless an exact rule changes the sequence:

1. roll damage;
2. apply Armor;
3. apply Damage Reduction;
4. apply remaining damage.

If final damage is reduced to 0 or less, the Core minimum-damage rule still applies: the target takes 1 damage per natural 8 rolled on the original damage dice.

---

## 5. Technical Identity

Destroyed Faith separates **mechanical identity** from **fictional presentation**.

Every catalogue Power has a canonical **Technical Power Name**. A character-facing name may be anything appropriate to the character, but that name does not create a new mechanical Power.

Examples:

- `Reaction: Evade` may be described as a shield flash, a sidestep, a shadow flicker, or a divine warning.
- `Melee Attack + Ruin` may be a cursed blade, corrosive claw, sacred brand, or supernatural martial technique.

The Technical Power Name controls:

- duplicate checks;
- once-per-Round use tracking;
- source overlap;
- catalogue rules;
- Foundry VTT data identity.

### 5.1 Alternatives in technical names

When a catalogue heading contains alternatives separated by `/`, choose one when the Power is learned. The chosen option becomes part of that character's technical identity where the catalogue says so.

### 5.2 Duplicate sources

Multiple sources that grant the same base Technical Reference do not normally create multiple uses.

Use the highest currently legal source profile. Duplicate sources share the same spent state and do not bypass the Power Use Limit.

This rule is especially important for Artifacts, Echoes, purchased Powers, and other layered character sources.

---

## 6. Target Curves

### 6.1 Active Powers

Active target:

> **30 PP x Power Level**

| PL | PP | PL | PP |
|---:|---:|---:|---:|
| 1 | 30 | 9 | 270 |
| 2 | 60 | 10 | 300 |
| 3 | 90 | 11 | 330 |
| 4 | 120 | 12 | 360 |
| 5 | 150 | 13 | 390 |
| 6 | 180 | 14 | 420 |
| 7 | 210 | 15 | 450 |
| 8 | 240 | 16 | 480 |

### 6.2 Active Buffs

Active Buff target:

> **30 PP x Power Level + 10 PP**

| PL | PP | PL | PP |
|---:|---:|---:|---:|
| 1 | 40 | 9 | 280 |
| 2 | 70 | 10 | 310 |
| 3 | 100 | 11 | 340 |
| 4 | 130 | 12 | 370 |
| 5 | 160 | 13 | 400 |
| 6 | 190 | 14 | 430 |
| 7 | 220 | 15 | 460 |
| 8 | 250 | 16 | 490 |

### 6.3 Passives

Passive target:

> **20 PP x Power Level**

### 6.4 Reactions

Reaction target:

> **20 PP x Power Level**

For both Passives and Reactions:

| PL | PP | PL | PP |
|---:|---:|---:|---:|
| 1 | 20 | 9 | 180 |
| 2 | 40 | 10 | 200 |
| 3 | 60 | 11 | 220 |
| 4 | 80 | 12 | 240 |
| 5 | 100 | 13 | 260 |
| 6 | 120 | 14 | 280 |
| 7 | 140 | 15 | 300 |
| 8 | 160 | 16 | 320 |

### 6.5 Movement Powers

Movement Powers do **not** use a universal PP curve.

They are priced by movement quality, geometry bypass, Reaction interaction, and hard caps. Use the exact Movement catalogue progression.

---

## 7. General Budget Governance

These rules are more important than any isolated price.

### 7.1 One Power, one budget

A Combination Power does not receive a complete target budget for every axis.

If an Active Buff contains Armor and Temporary HP, both effects fit inside the **same** Active Buff budget.

If a Combined Passive contains Evade and Healing, both effects fit inside the **same** Passive budget.

This prevents a two-axis Power from silently becoming two full Powers occupying one slot.

### 7.2 Coverage has value

Range, Radius, additional targets, repeated area coverage, ally delivery, and similar extensions are not free.

A Power that reaches farther or affects more creatures pays for that coverage through the exact structure of its subsystem.

### 7.3 Do not multiply output for free

Multi-target mechanics must define whether payload is:

- copied to every legal target;
- divided among targets;
- shared between placements;
- or stopped by a chain condition.

The catalogue prices that behavior explicitly. Never assume that adding targets automatically grants multiple full independent attacks.

### 7.4 Closed systems stay closed

Critical, Damage Reduction, Phasing, Parry, Absorption, Damage Negation, Invisibility, Ward, and other dedicated premium systems are not generic riders.

If the catalogue gives such a subsystem a dedicated Power, use that Power. Do not recreate the mechanic as a cheaper secondary effect inside another template.

### 7.5 Preserve identity across levels

For standard Active Buffs, Levels 1-4 establish the structure. Levels 5-16 scale that structure rather than adding new mechanical axes.

For Special-first Actives, Levels 1-4 establish the damage/Special identity; later levels scale the Special first and preserve the Damage Anchor.

A Power should become **more itself** as it advances, not turn into a different Power because unused PP appeared.

### 7.6 Monotonicity

Within a progression, a paid axis may remain the same or improve. It should not decrease merely to make room for a different axis unless a dedicated entry explicitly defines such a trade.

### 7.7 No filler requirement

Unused PP is legal.

Do not add Damage, Critical, Penetration, defense, Specials, Attack Dice, Movement, or another rider merely to make the arithmetic look full.

### 7.8 Exact entry beats generic math

A catalogue's dedicated milestone table is itself a balance rule.

Do not reverse-engineer a different progression simply because a generic price would produce a mathematically closer result.

---

## 8. Mathematical Kernel

This section contains the most reusable current cost structures. They are valid only in the contexts stated.

### 8.1 Active damage and healing

For normal Active construction:

- **+1d8 Damage = 15 PP**
- **+1d8 Healing = 15 PP**

### 8.2 Ranged Active Range

Normal ranged Active baseline:

- 8 m = 0 PP
- every additional 4 m = +5 PP

So:

| Range | PP | Range | PP |
|---:|---:|---:|---:|
| 8 m | 0 | 40 m | 40 |
| 12 m | 5 | 44 m | 45 |
| 16 m | 10 | 48 m | 50 |
| 20 m | 15 | 52 m | 55 |
| 24 m | 20 | 56 m | 60 |
| 28 m | 25 | 60 m | 65 |
| 32 m | 30 | 64 m | 70 |
| 36 m | 35 | 68 m | 75 |

This Range table is not a universal meter price for Movement, Artifact base movement, or every aura system.

### 8.3 Triangular numeric Special formula

For a numeric Special with base cost `B` and printed value `X`:

> **T(X) = X x (X + 1) / 2**
>
> **Special Cost = B x T(X)**

Current base groups:

| Base | Specials |
|---:|---|
| 2 PP | Exorcism, Requiem |
| 3 PP | Blight |
| 4 PP | Lacerate, Mark, Ruin, Slow |
| 6 PP | Corrode, Hex, Sundered; Root uses this price but its own recovery rules |
| 8 PP | Expose |

Pool-reduction Specials use dedicated compressed pricing because each printed point removes one die from an Attribute-based or Attack Pool:

- `Challenge(1) = 6 PP`; for `Challenge(X)` at X 2+, use `6 x T(2X)`.
- `Disoriented(1)`, `Soulburn(1)`, and `Weaken(1) = 8 PP`; for X 2+, use `8 x T(2X)`.

The printed X values in exact catalogue entries are authoritative. These formulas are the audit kernel for direct dice-removal effects.

Example:

`Blight(8) = 3 x T(8) = 3 x 36 = 108 PP`

`Weaken(2) = 8 x T(4) = 8 x 10 = 80 PP`

### 8.4 Root

Root is not a standard Diminishing Special even though it uses the 6 PP triangular price.

- minimum legal value: **Root(2)**;
- target Speed becomes 0 m and voluntary movement is prevented;
- at start of affected creature's Turn, Root is reduced by that creature's MR;
- the creature may additionally spend a legal Action, Movement, or Reaction on the listed Vitality check to reduce Root further;
- Root is excluded from Natural Special Recovery;
- Root is not inserted into standard Persistent Zone templates unless a dedicated rule explicitly allows it.

### 8.5 Cleanse

Generic Cleanse cost:

> **Cleanse(X) = 4 x T(X) PP**

The resolution scope depends on the source:

- Core Cleanse may distribute its total value among eligible Specials.
- `Reaction: Cleanse` is intentionally narrower and reduces exactly one triggering eligible Special.

Never use the broad Core distribution rule to widen the dedicated Reaction.

### 8.6 Instant Attack AoE

This table applies only to **instant Attack AoEs**:

| Radius | PP |
|---:|---:|
| 1 m | 0 |
| 2 m | 20 |
| 3 m | 50 |
| 4 m | 80 |
| 5 m | 120 |
| 6 m | 165 |
| 7 m | 220 |
| 8 m | 280 |

8 m is the normal maximum for standard player Attack Powers.

Do not reuse this table for Persistent Zones, Active Buff Auras, Passive Special Auras, Artifact Armor Auras, Images, Barriers, or other dedicated area systems.

### 8.7 Fixed control costs

Current Active control reference includes:

- Push / Pull: **30 PP per 2 m**
- Prone: **60 PP fixed**
- Disarm: **60 PP fixed**
- Stunned: **120 PP fixed**

Binary or fixed control does not automatically scale merely because Power Level rises. Later levels need another already-legal axis or may intentionally underspend.

---

## 9. Active Power Construction

Actives consume an Attack Action and are the primary catalogue for direct attacks, support effects, zones, barriers, images, control, and mental effects.

### 9.1 Standard direct Active workflow

For a normal direct Active:

1. Determine PL and target PP (`30 x PL`).
2. Choose one legal catalogue structure.
3. Add the exact costs for Range, area, damage/healing, Special, control, or target structure allowed by that entry.
4. Preserve the entry's identity across levels.
5. Leave PP unused when the next legal improvement would distort the template.
6. Record the arithmetic in the technical tooltip or audit block.

### 9.2 Special-first attacks

Special-first Martial Actives treat the Special as the primary scaling axis.

Levels 1-4 establish the baseline. From Level 5 onward:

- Level 4 damage becomes the **Damage Anchor**;
- increase the Special whenever the budget permits;
- increase damage only when doing so does not delay or block the next Special increase;
- damage and Special never decrease;
- unused PP may remain unused.

This prevents a control/debuff Power from becoming a generic damage Power at higher PL.

### 9.3 AoE attacks

A Martial AoE Active uses one Attack Roll for the area and compares the same final result separately against each valid creature's Evade.

Each creature resolves its own legal defenses. Every creature that remains hit receives the **full printed payload**.

That means full weapon damage, full Power damage, full Special values, and legal offensive riders are not divided merely because the Power is an AoE.

The Radius cost is the coverage tax.

For an AoE numeric Special:

> **AoE Special Cost = normal Special Cost**

There is no additional generic halving or multiplier for an instant Attack AoE Special.

### 9.4 Persistent Diminishing Zones

Standard ranged Persistent Diminishing Zones:

- are placed at a point within Range;
- last **4 Rounds**;
- make no Attack Roll;
- normally deal no damage;
- affect a creature when the zone appears on it, when it enters the zone for the first time in a Round, or when it starts its Turn inside;
- affect the same creature from the same zone at most once per Round.

The 4-Round duration uses a **x2 multiplier**.

> **Final Cost = Range Cost + [(Radius Cost + AoE Special Cost) x 2]**

For these Persistent Zones:

> **Persistent AoE Special(X) = Base Cost x T(X + 1)**

For pool-reduction Specials in Persistent Zones:

- `Challenge(1)` uses `6 x T(2)`; at X 2+, use `6 x T(2X + 1)`.
- `Disoriented(1)`, `Soulburn(1)`, and `Weaken(1)` use `8 x T(2)`; at X 2+, use `8 x T(2X + 1)`.

`Expose` remains on the normal `8 x T(X + 1)` Persistent Zone progression.

Current Persistent Zone Radius costs are subsystem-specific:

| Radius | PP |
|---:|---:|
| 2 m | 20 |
| 3 m | 50 |
| 4 m | 90 |
| 5 m | 140 |
| 6 m | 200 |

**Important:** repeated application of a Diminishing Special follows the current Core stacking rules unless the exact entry says otherwise. A later Round's legal zone application can therefore add new stacks, subject to the zone's once-per-creature-per-Round rule and the global Special Application Limit.

### 9.5 Player Split Attack

A player `Split Attack` divides one attack sequence; it does not create several full independent attacks.

- Split the Attack Pool between targets before rolling.
- Resolve each split attack separately.
- Roll **one total Damage Pool**.
- Split that total Damage Pool among successful hits.
- A target normally cannot be selected more than once by the same Split Attack.

Target capacity costs:

> **30 PP per additional attack/target beyond the first**

Because both Attack Pool and total Damage Pool are shared, added target flexibility does not multiply the character's full damage output for free.

### 9.6 Split AoE

Split AoE applies the same principle to multiple placements:

- split the Attack Pool between placements;
- resolve each placement separately;
- roll one total Damage Pool;
- divide that Damage Pool between successful placements;
- overlapping placements do not multiply damage against the same creature unless an exact entry explicitly says otherwise.

### 9.7 Autofire

Autofire is a ranged ordered chain:

- one ranged Attack Roll;
- targets declared in order;
- every target after the first must be within 4 m of the previous target and inside Range;
- the first miss ends the chain;
- successful targets receive the full printed payload;
- Dive for Cover is not available against Autofire under the current catalogue rule.

Target capacity costs:

> **30 PP per additional target after the first**

### 9.8 Support Actives

Healing, Cleanse, Health Level Recovery, and their approved combinations use their own exact catalogue structures.

Do not assume that a healing Power can add damage, control, or unrelated utility because budget remains.

Health Level Recovery is a scarce recovery axis and costs **30 PP per restorable Health Level per Safe Haven Rest** in the current Active catalogue. It is not interchangeable with ordinary HP healing and does not restore HP by itself.

### 9.9 Barriers, Images, and terrain

Barriers, Walls, Power Images, Illusion Fields, and construct-style Actives have dedicated formulas for Range, field size, duration, durability, sensory layers, and similar geometry.

They are not built from the instant Attack AoE table.

Use the exact catalogue entry rather than inventing a generic `area + duration` multiplier.

### 9.10 Mental Powers

Mental Powers are dedicated Actives, not generic Spell reskins.

The current mental catalogue contains:

- Mental Attack;
- Mind Illusion;
- Mind Probe;
- Mental Control.

Most require Telepathic Access. Their fixed TN, Armor interaction, later checks, and restrictions are defined by the exact entry.

Do not derive Mental Control or Mind Illusion from generic damage/Special math.

---

## 10. Active Buff Construction

Active Buffs are maintained temporary combat states.

Normal rules:

- activation normally costs 1 Attack Action;
- duration is normally **Mastery Rank Rounds**;
- the activation Round counts as the first Round;
- a character normally maintains only one Active Buff;
- activating another ends the previous one unless an explicit exception says otherwise.

### 10.1 Structure

A standard Active Buff is either:

- **Pure:** exactly one mechanical axis; or
- **Combination:** exactly two approved axes sharing one budget.

Levels 1-4 define the structure. Levels 5-16 scale that same structure.

### 10.2 Standard Active Buff axis prices

| Axis | Price | Notes |
|---|---:|---|
| Armor | 7.5 PP per +1 Armor | standard self-defense |
| Evade | 15 PP per +1 Evade | standard self-defense |
| Refreshing Temporary HP | 4 PP per 1 HP | restored to listed value at start of Turn while Buff lasts |
| Healing / Regeneration | 4 PP per 1 HP | start-of-Turn real HP recovery |
| Damage | 15 PP per +1d8 | qualifying own attacks only |
| Penetration | 7.5 PP per Penetration(1) | Armor bypass only |

Approved standard combinations currently include:

- Armor + Temporary HP;
- Evade + Temporary HP;
- Temporary HP + Healing;
- Armor + Evade;
- Damage + Penetration.

The full budget is shared between both axes.

### 10.3 Standard restrictions

A standard Active Buff may not grant:

- Attack Dice;
- Extra Attacks;
- free Attack Actions;
- additional Reactions;
- Special Application;
- hard control;
- hidden Movement Powers;
- unrelated secondary effects.

### 10.4 Critical

Critical is closed.

Direct Critical access is limited to:

1. `Active Buff: Critical`; and
2. the dedicated `Agility Ability: Crit` Stone Power.

`Active Buff: Critical` milestones:

| PL band | Effect |
|---|---|
| 1-3 | no effect |
| 4-7 | Critical(1) |
| 8-11 | Critical(2) |
| 12-14 | Critical(3) |
| 15-16 | Critical(4) |

Unused PP inside a milestone band remains unused. Do not fill it with damage, Penetration, Specials, defense, or Attack Dice.

### 10.5 Special Increase

Standard Active Buffs do not apply Specials.

The dedicated `Active Buff: Special Increase + [chosen Special]` may increase an **already existing** eligible numeric Special. It does not create the Special on an unaffected target.

Current milestone structure:

| PL band | Normal eligible Special | Challenge / Disoriented / Soulburn / Weaken |
|---|---:|---:|
| 1-3 | none | none |
| 4-7 | +1 | +1 |
| 8-11 | +2 | +1 |
| 12-14 | +3 | +2 |
| 15-16 | +4 | +2 |

This is a pressure amplifier, not a Special-delivery engine. Pool-reduction variants use the compressed column.

### 10.6 Dedicated subsystem Buffs

The current catalogue contains dedicated subsystem entries including:

- Active Buff: Damage Reduction
- Active Buff: Phasing
- Active Buff: Critical
- Active Buff: Special Increase
- Active Buff: Spell Resistance
- Active Buff: Self Cleanse
- Active Buff: Damage Aura
- Active Buff: Healing Aura
- Active Buff: Size + Damage + Armor
- Active Buff: Summon Damage Aura
- Active Buff: Summon Armor Aura
- Active Buff: Thorns
- Active Buff: Invisibility
- Active Buff: Parry Recovery
- Active Buff: Absorption Stone Increase
- Active Buff: Damage Negation Pool

`Active Buff: Parry Recovery` restores up to **1 Parry per Power Level per Round**, never above the Parry Pool with which the character entered Parry that Turn.

These fixed structures are not permission to generalize their mechanics into new combination axes.

### 10.7 Damage and Healing Auras

The standard self-centered Damage/Healing Aura subsystem triggers once at the end of each of the user's Turns. The same creature can be affected by the same aura only once per Round.

Radius bands:

| PL band | Radius | Radius cost |
|---|---:|---:|
| 1-7 | 2 m | 20 PP |
| 8-14 | 3 m | 50 PP |
| 15-16 | 4 m | 90 PP |

> **Payload Budget = Active Buff target PP - Radius Cost**

Damage Aura payload costs **35 PP per +1d8 damage**. Healing Aura payload costs **35 PP per +1d8 healing**. Do not reuse these radius costs or payload prices for unrelated aura systems such as Artifact Armor Aura.

---

## 11. Passive Construction

Passives are reliable prepared parts of a character's combat identity.

They require no Action, Movement, Reaction, or activation roll while slotted, unless their exact entry states a condition or subsystem trigger.

### 11.1 Passive Slots

| Mastery Rank | Passive Slots |
|---:|---:|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 3 |
| 5 | 4 |
| 6 | 4 |
| 7 | 5 |
| 8 | 6 |

Every slotted Passive is active. There is no separate prepared-but-inactive state.

### 11.2 Categories

A Pure Passive belongs to exactly one category. A Combined Passive belongs to exactly two approved categories and counts as both for loadout and duplication rules.

Current categories:

- Armor
- Damage Reduction
- Evade
- Damage
- Health
- Temporary HP
- Healing
- Telepathy
- Phasing
- Special Aura
- Ward
- Initiative
- Invisibility
- Parry
- Absorption
- Damage Negation
- Summon

A character cannot normally benefit from two active Passives using the same category.

### 11.3 Standard unconditional baselines

Current common catalogue prices include:

| Axis | Price |
|---|---:|
| Armor | 15 PP per +1 Armor |
| Evade | 20 PP per +1 Evade |
| Damage | 40 PP per +1d8 Damage |
| Healing / Regeneration | 8 PP per 1 HP |

Temporary HP, Health Bars, and Combined Passives follow their exact catalogue tables rather than a single universal pure-axis formula.

### 11.4 Conditional Passives

Conditional Passives use only approved, meaningful combat conditions and their exact catalogue baselines.

Current common conditional prices include:

| Axis | Conditional price |
|---|---:|
| Armor | 7.5 PP per +1 Armor |
| Evade | 15 PP per +1 Evade |
| Damage | 20 PP per +1d8 Damage |
| Healing | 4 PP per 1 HP |

Examples of meaningful conditions include moving at least 8 m, moving 0 m, adjacency requirements, the target being unable to perceive the character, being Wounded or worse, or being affected by a defined drawback.

There is **no generic percentage discount system** for inventing new conditions. Do not apply arbitrary x0.95, x0.90, x0.80, or similar multipliers.

Use an approved catalogue condition or create a new condition only through explicit design review.

### 11.5 Combined Passives

A Combined Passive:

- combines exactly two approved categories;
- occupies one Passive Slot;
- counts as both categories;
- uses one Passive budget;
- may not hide a third axis;
- may not casually include a closed subsystem.

For conditional Combined Passives, current half-budget baselines include:

- Armor: 7.5 PP per +1 Armor;
- Evade: 15 PP per +1 Evade;
- Damage: 20 PP per +1d8 Damage;
- Healing: 4 PP per 1 HP;
- Temporary HP: 2 PP per 1 start-of-combat Temporary HP;
- Health: milestone structural progression.

### 11.6 Special Aura

`Passive: Special Aura + [chosen Special]` is the standard Passive way to interact with an existing Special.

It:

- grants exactly **+1 step** to one chosen eligible Special(X);
- affects only creatures already affected by that Special;
- never applies, refreshes, extends, spreads, triggers, or maintains the Special;
- ends its +1 immediately when the affected creature leaves the aura;
- does not stack with another Special Aura increasing the same Special; only the strongest applies.

Core cost:

> **80 PP + Radius Cost**

Current radius table:

| Radius | PP |
|---:|---:|
| 2 m | 0 |
| 3 m | 20 |
| 4 m | 40 |
| 5 m | 60 |
| 6 m | 100 |
| 7 m | 160 |
| 8 m | 240 |

The +1 Special increase never grows to +2 or more through normal Passive Special Aura scaling. Higher PL buys coverage.

### 11.7 Dedicated Passive subsystems

Damage Reduction, Phasing, Ward, Initiative, Invisibility, Parry, Absorption, Damage Negation, Summon, and other exact dedicated entries follow their own progression.

For `Passive: Parry`, the current maximum Parry Pool is `ceil(5 x Power Level / 2)`, capped naturally by the chosen Parry Attribute. The Level 4 / 8 / 12 / 16 caps are 10 / 20 / 30 / 40.

Unused PP in a milestone subsystem may remain unused.

Do not add premium subsystem mechanics as riders to unrelated Passives.

### 11.8 Combat Senses

Combat Senses are governed by the Core Sense Slot and are **not Passive Powers**.

Do not create generic Awareness/Heightened Senses Passives or treat additional Sense Options as a normal Passive budget axis.

---

## 12. Reaction Construction

Reactions are immediate answers to specific triggers. They are not second Turns and are not miniature Active Powers.

Normal rules:

- using one consumes 1 Reaction;
- a character normally has 1 Reaction per Round;
- a Reaction applies only to its triggering attack, hit, damage instance, effect, ally, or movement event unless the exact entry says otherwise;
- Reaction effects normally do not create maintained states.

### 12.1 Trigger identity

A Reaction consists of:

1. the **Reaction Effect**; and
2. a legal **Chosen Trigger** where the catalogue offers alternatives.

Choosing a different Trigger does not normally create another copy of the same Reaction Effect.

Duplicate sources do not stack or grant additional uses.

### 12.2 Standard Reaction pricing

Current reusable Reaction prices include:

| Axis | Price |
|---|---:|
| Armor | 10 PP per +1 Armor |
| Evade | 20 PP per +1 Evade |
| Temporary HP | 4 PP per 1 HP |
| Counter Damage | 20 PP per +1d8 |
| Ally Protection premium | +10 PP |
| Counter Push | 20 PP per 2 m, maximum 8 m |
| Initiative | 10 PP per +1 Initiative |
| Cleanse | 4 x T(X), one triggering Special only |

### 12.3 Counter Effects

Counter Effects:

- make no Attack Roll;
- generate no Raises;
- use no weapon damage unless the dedicated entry says otherwise;
- trigger no normal on-hit effects;
- do not apply Specials;
- do not benefit from Critical or offensive Active Buffs.

Their higher damage price reflects automatic retaliatory timing outside the user's Turn.

### 12.4 Reposition

`Reaction: Reposition` resolves the triggering event first, then moves the user.

Current milestones:

- PL 1-3: no effect
- PL 4-7: 2 m
- PL 8-11: 4 m
- PL 12-14: 6 m
- PL 15-16: 8 m

This is normal legal movement, not Teleport, not Evade, and not automatic Safe Movement.

### 12.5 Reaction: Special Increase

This Reaction increases one already existing chosen Special on the triggering creature. It never applies the Special itself.

Current milestones:

- PL 1-3: none
- PL 4-7: +1 for all eligible Specials
- PL 8-15: +2 normally; +1 for Challenge, Disoriented, Soulburn, or Weaken
- PL 16: +3 normally; +2 for Challenge, Disoriented, Soulburn, or Weaken

No filler is added inside milestone bands.

### 12.6 Closed Reaction subsystems

The following current entries are dedicated systems and are not generic construction axes:

- Reaction: Damage Reduction
- Reaction: Phasing
- Reaction: Initiative
- Reaction: Parry + Weapon Damage
- Reaction: Parry + Attack Reflection
- Reaction: Absorption Damage Multiplier

Use the exact catalogue progression.

---

## 13. Movement Power Construction

Movement Powers replace normal Movement for the Round. They are not Attack Actions, Active Buffs, Reactions, or Special-delivery systems.

There is no universal `PP per meter` rule that can safely generate every Movement Power.

Movement value depends on what geometry and threat rules the movement bypasses.

### 13.1 Current standard families and caps

| Movement Power | Current cap / structure |
|---|---|
| Ground Dash | 34 m total movement; reaches cap at PL 13 |
| Safe Movement | 20 m total movement; suppresses movement-triggered Reactions |
| Teleport | 1-16 m; skips intervening path |
| Teleport with Ally | up to 12 m; carries one willing nearby ally |
| Flight | up to 24 m |
| Leap | up to 28 m horizontal / 14 m vertical |
| Wall Walk | up to 28 m |
| Burrow | 1-16 m through suitable material |
| Phase Passage | up to 8 m total material thickness; milestone progression |
| Trample | dedicated offensive Movement; up to 24 m path and 8d8 contact damage |

Use the exact catalogue row for the requested PL.

### 13.2 Reaction interaction

Movement Powers provoke movement-triggered Reactions normally unless the entry says otherwise.

- `Movement: Safe Movement` suppresses them by default.
- Teleport does not provoke through skipped intervening spaces because the character does not move through those spaces.

### 13.3 Timing

A Movement Power is used on the user's Turn as Movement.

It is not a last-second dodge and does not retroactively cancel a hit. Reactive repositioning belongs to `Reaction: Reposition`.

### 13.4 Restrictions

Movement Powers may not normally grant Attack Dice, Critical, bonus damage to the next attack, Penetration, Special Application, Special Increase, Extra Attacks, free Attack Actions, defensive round-long buffs, hard control, or Reaction-style damage avoidance.

Trample is a dedicated catalogue exception, not a general permission to attach damage to Movement.

---

## 14. Specials Governance

Specials are one of the primary tactical languages of Destroyed Faith. Their mathematical cost and their runtime stacking rules must both be respected.

### 14.1 Effect classes

Current Core distinguishes structures such as:

- **Diminishing (X -> 0)**;
- **Timed**;
- **Until Broken / Until Used**;
- **Instant**.

Do not apply Diminishing behavior to an effect from another class unless its entry says so.

### 14.2 Diminishing stacking

Reapplying the same Diminishing Special normally adds new points to the existing stack unless that Special says otherwise.

### 14.3 Special Application Limit

During one Round, a creature can receive at most:

> **4 x its Mastery Rank**

new points of the same Diminishing Special from all sources combined.

This is an **application limit**, not a maximum stack size. Existing points carried from previous Rounds do not count against the new Round's limit.

### 14.4 Start-of-Turn order

For eligible negative Diminishing Specials:

> **Tick -> Natural Special Recovery -> Decay 1**

Natural Special Recovery reduces one or more eligible negative Diminishing Specials by a **total amount equal to the affected creature's MR**. The affected creature chooses how to distribute that reduction. Unused reduction is lost.

Root is excluded and uses its own Until Broken recovery.

### 14.5 Cleanse eligibility

A Special may be reduced by Cleanse only when its rules mark it as eligible.

Dedicated Cleanse sources may narrow target count, distribution, timing, or scope. The narrower exact entry controls.

### 14.6 Special synergy is expected

The balance framework intentionally allows different Specials to combine tactically. Corrode can open Armor, Expose can open Evade, Mark can improve payoff from later damage, Hex can support Spell damage, control can buy time, and Cleanse/Ward can answer pressure.

This interaction is not represented by a generic hidden synergy surcharge on every Power. Instead, the system limits stacking through:

- PP cost;
- action economy;
- named Power use limits;
- Passive slots;
- Active Buff maintenance;
- Special Application Limit;
- Natural Special Recovery;
- target defenses and encounter geometry.

Party synergy therefore remains a play layer above individual Power normalization.

---

## 15. Stones and Stone Powers

Stones are a runtime resource system, not PP.

The Power framework must not convert PP into Stones or Stones into PP unless an exact subsystem explicitly defines such a conversion.

### 15.1 Stone tier cost chain

Current Stone tier cost chain:

| Tier | Stone cost |
|---:|---:|
| 1 | 1 |
| 2 | 2 |
| 3 | 4 |
| 4 | 8 |

### 15.2 Powers that begin at Tier 2

Some Stone Powers do **not** have Tier 1 at all. Their first real Tier is Tier 2.

Current runtime references include examples such as:

- Extra Attack;
- Crit;
- Parry;
- Damage Negation;
- Spell Action;
- Damage Reduction;
- Not a Target;
- Phasing.

For such a Power, **Tier 1 does not exist**. It is not empty, hidden, or payable.

Therefore:

> **A requirement to pay all lower tiers means all lower tiers that actually exist for that Stone Power. Never invent a nonexistent Tier 1 prerequisite.**

This rule is especially important when interpreting Artifact Stone Power Support.

---

## 16. Artifacts and Technical References

Artifacts are fixed authored objects with Equipment Slots, Base Profiles, Artifact Capacity, Level Progressions, and a limited set of Artifact Functions.

They are not a free-form way to buy any effect from the PP tables.

### 16.1 Capacity and slots

Default maximum bound Artifacts: **4**.

Current slots:

- Main Hand
- Off Hand
- Body
- Head
- Feet
- Amulet
- Ring

A two-handed Artifact normally counts as one Artifact for capacity but blocks both hand slots.

### 16.2 Stage to Power Level mapping

When an Artifact grants a normal catalogue Power through its progression:

| Artifact Level | Stage | Default effective Power Level |
|---:|---|---:|
| 1-3 | Basic | PL 4 |
| 4-6 | Improved | PL 10 |
| 7-9 | Greater | PL 16 |
| 10 | Ultimate | explicit final profile |

### 16.3 Technical Reference inheritance

If an Artifact Technical Reference names a normal catalogue Power, inherit the **complete current rules of that Power** at the listed effective PL.

An Artifact may explicitly narrow:

- weapon/source;
- Range;
- target;
- Trigger;
- recipient;
- usage profile;
- other written delivery restrictions.

If an Artifact summary conflicts with the referenced catalogue Power, the catalogue controls except for an explicit Artifact override.

### 16.4 Artifact-exclusive functions

If an Artifact Function does not match a catalogue Power, it needs an exact Artifact-exclusive Technical Reference.

Do not force a unique Artifact effect into an unrelated generic Power solely to obtain PP math.

### 16.5 Incomplete Ultimates

A GM-defined or unfinished Ultimate is unavailable until its complete mechanical profile and Technical Reference are recorded.

### 16.6 Stone Power Support

Stone Power Support pre-fills a named higher tier of one Stone Power. It does not directly grant the Stone Power's final effect independently.

The character must pay all **actual existing** lower tiers required by that Stone Power.

For Stone Powers whose first real tier is Tier 2, Tier 1 is not a prerequisite because Tier 1 does not exist.

This framework treats that as the mechanically coherent interpretation. Any Artifact example that says otherwise should be corrected upstream rather than creating a fictional Tier 1.

---

## 17. Spells

A Spell is **not a separate Power Type**.

A Spell is a valid **Ranged Active Power** converted to magical delivery.

To become a Spell, the Power must have:

- Range; and
- at least one Special.

The casting source is Intellect, Resolve, or Influence as allowed by the Core rules.

Spell identity does not create a second PP curve. The underlying Ranged Active template, Range cost, Special structure, and other purchased effects remain the basis of the Power.

Do not invent a separate Spell Level, class level, or spell-only PP budget.

Mental Powers remain dedicated exceptions and use their exact catalogue rules.

---

## 18. Encounter Calibration Is a Separate Layer

The Quick Encounter framework answers a different question from the PP framework.

PP asks:

> **Is this Power internally normalized against other Powers of its category and level?**

Quick Encounter asks:

> **Given the actual party, what NPC Attack, Damage, Evade, Armor, HP, action pressure, adds, and phase structure should create the desired encounter?**

The current Quick Encounter baseline records each PC's:

- Evade;
- Armor;
- strongest repeatable single-target Attack Pool;
- strongest repeatable single-target Damage Pool.

The baseline intentionally excludes temporary spikes such as Stones, Active Buffs, Reactions, Raises, and Skill expenditure.

That separation matters. A Power can be correctly priced and still perform unusually well in a specific party combination or encounter. Conversely, a weakly coordinated party can underperform a mathematically legal character sheet.

The encounter framework therefore calibrates the **party actually present**, while PP normalizes the **mechanical components from which characters are built**.

### 18.1 Boss damage-to-Special conversion is encounter math, not Power PP

The Quick Encounter guide lets a Boss trade Damage Dice for numeric Special value. This is a fast encounter-building conversion, not the player Power cost formula.

Current Boss conversion uses the Special PP groups only as a pressure category:

- 3 PP and 4 PP groups: **+2 Special value per -1d8 Damage**;
- 6 PP and 8 PP groups: **+1 Special value per -1d8 Damage**;
- Root must still reach its minimum legal value before it can be added.

Likewise, a Boss AoE pays additional **Boss Attack pressure** rather than the player instant-AoE PP table.

Never use these GM conversions to build player Powers. They are an encounter calibration shortcut layered on top of the player-facing rules.

### 18.2 Boss Split Attack is not player Split Attack

The Quick Encounter Boss `Split Attack` is a GM encounter rule:

- one Boss Attack budget slot becomes two separate attacks;
- both use the normal Attack Pool;
- each deals -2d8 Damage;
- Specials are paid separately from each reduced Damage Pool.

This is **not** the same mechanic as the player Active `Split Attack`, which divides Attack Pool and one shared total Damage Pool.

Never copy the Boss rule into the player Power catalogue or vice versa.

### 18.3 Higher-MR calibration status

The encounter tables provide mechanical coverage through MR6 in the audited Quick Encounter draft. Higher-MR encounter values should still be treated as playtest-calibration material rather than evidence that every high-MR encounter has been empirically solved.

---

## 19. Worked Mathematical Audits

These examples show how the public framework should be checked.

### 19.1 Active Buff: Armor, PL 4

Target:

`30 x 4 + 10 = 130 PP`

Effect:

`+17 Armor x 7.5 PP = 127.5 PP`

Deviation:

`127.5 - 130 = -2.5 PP`

Result: cleanly on-curve. Do not add a rider to fill 2.5 PP.

### 19.2 Reaction: Armor, PL 4

Target:

`20 x 4 = 80 PP`

Effect:

`+8 Armor x 10 PP = 80 PP`

Result: exact.

### 19.3 Passive: Armor, PL 4

Target:

`20 x 4 = 80 PP`

Effect:

`+5 Armor x 15 PP = 75 PP`

Deviation:

`75 - 80 = -5 PP`

Result: on-curve. No filler required.

### 19.4 Special-first Melee Attack + Blight, PL 4

Target:

`30 x 4 = 120 PP`

Damage:

`+1d8 = 15 PP`

Special:

`Blight(8) = 3 x T(8)`

`T(8) = 8 x 9 / 2 = 36`

`3 x 36 = 108 PP`

Total:

`15 + 108 = 123 PP`

Deviation:

`+3 PP`

Result: legal near-target Special-first structure. Blight remains the Power's identity.

### 19.5 Persistent Zone + Blight, PL 4

Target:

`120 PP`

Example components:

- Range 20 m = 15 PP
- Radius 2 m = 20 PP
- printed Blight(3) in a Persistent Zone uses `3 x T(4)` = `3 x 10` = 30 PP
- persistent payload multiplier = x2

Calculation:

`15 + [(20 + 30) x 2] = 115 PP`

Deviation:

`-5 PP`

Result: on-curve without filler.

### 19.6 Reaction: Damage + Push, PL 8

Target:

`20 x 8 = 160 PP`

One clean construction:

- 4d8 Counter Damage = 80 PP
- Push 8 m = 80 PP

Total:

`160 PP`

Result: exact.

### 19.7 Active Buff: Critical, PL 8

Target:

`250 PP`

The dedicated Critical milestone at PL 8 is:

`Critical(2)`

The remaining apparent budget is **not filled** with damage, Penetration, Specials, Attack Dice, or defense.

Result: correct because the exact milestone table is the balancing structure.

### 19.8 Player Split Attack

Adding one additional target costs 30 PP.

The user splits the Attack Pool and then splits one total Damage Pool among successful hits.

Result: the Power buys targeting flexibility, not another full copy of weapon damage. This is a direct example of the rule **no output multiplication without paid structure**.

---

## 20. Design and Audit Procedure

Use this sequence when creating or reviewing a Power.

### Step 1 - Identify the exact Power Type

Choose one:

- Active
- Active Buff
- Passive
- Reaction
- Movement

Then identify whether the request belongs to a dedicated subsystem rather than generic construction.

### Step 2 - Resolve technical identity

Determine the canonical Technical Power Name and any chosen option or Trigger.

Do not let a flavor name create a duplicate mechanical Power.

### Step 3 - Read the exact catalogue entry first

Before applying generic math, search for an existing dedicated entry.

If it exists, use its progression, restrictions, timing, and milestones.

### Step 4 - Determine target budget

Use the correct category curve. Movement uses exact catalogue progression instead.

### Step 5 - Decompose only into legal axes

Price only effects allowed by that catalogue structure.

Do not attach a closed subsystem as a rider.

### Step 6 - Pay for coverage and timing

Account for Range, AoE, target capacity, ally delivery, duration multipliers, or other exact coverage rules where the chosen subsystem requires them.

### Step 7 - Preserve identity

Check that later Levels scale the same concept instead of adding a new unrelated function.

### Step 8 - Check runtime constraints

Verify:

- once-per-Round named Power use;
- Action/Movement/Reaction cost;
- Active Buff maintenance;
- Passive category occupancy;
- Special Application Limit;
- Diminishing recovery;
- duplicate source rules;
- relevant closed subsystem caps.

### Step 9 - Calculate the row

Record:

- target PP;
- every component cost;
- total PP;
- deviation;
- reason for intentional underspend or exception.

### Step 10 - Reject filler

If the next legal increase does not fit, stop.

Do not add unrelated value just to make the total equal the target.

### Step 11 - Check neighboring levels

Confirm:

- no paid axis unexpectedly decreases;
- milestone transitions occur where intended;
- no later Level gains a new axis without an explicit design reason;
- technical identity remains stable.

### Step 12 - Cross-check against actual gameplay rules

PP arithmetic alone cannot legalize an effect that violates the Core.

If the math and runtime rule disagree, the runtime rule wins and the design must be revised.

---

## 21. Machine-Readable Design Contract

The following compact contract is intended for designers, code assistants, and validation tooling.

```text
SOURCE_PRECEDENCE:
  Core > relevant catalogue > exact dedicated entry > explicit source restriction > runtime aid > encounter guide > this framework

POWER_IDENTITY:
  technical_name != flavor_name
  duplicates share spent state unless explicit exception
  same named Power normally <= 1 use / Round

TARGETS:
  Active(L)      = 30 * L
  ActiveBuff(L)  = 30 * L + 10
  Passive(L)     = 20 * L
  Reaction(L)    = 20 * L
  Movement       = exact catalogue progression; no universal PP curve

BUDGET:
  combination effects share one total budget
  unused PP is legal
  no generic +/-10% tolerance
  continuous near-target audit convention: about +/-5 PP where exact fitting is practical
  exact milestone/dedicated entry overrides generic arithmetic
  no filler riders

DICE:
  normal roll = Attribute k MR
  Keep is not Power Level
  natural 8 explodes unless stated otherwise
  damage dice do not explode by default

SPECIALS:
  T(X) = X * (X + 1) / 2
  numeric_cost = BaseCost * T(X)
  per-Round new same Diminishing Special <= 4 * target MR
  start of Turn = Tick -> Natural Special Recovery -> Decay 1
  Natural Special Recovery total = target MR
  Root uses own recovery and minimum Root(2)

ACTIVE:
  damage = 15 PP / +1d8 where exact entry uses standard Active damage
  healing = 15 PP / +1d8 where exact entry uses standard Active healing
  ranged baseline = 8 m at 0 PP, then +5 PP / +4 m
  instant Attack AoE radius uses exact 1-8 m table
  player Split Attack additional target = 30 PP and shares Attack/Damage resources
  Autofire additional target = 30 PP

ACTIVE_BUFF:
  standard pure = 1 axis
  standard combination = exactly 2 approved axes, one shared budget
  L1-4 establish structure; L5-16 scale it
  Critical and other closed subsystems use exact dedicated entries

PASSIVE:
  pure = 1 category
  combined = exactly 2 approved categories, one shared budget
  same category normally cannot be active twice
  no generic percentage condition discounts

REACTION:
  effect + chosen Trigger
  normally 1 Reaction / Round
  duplicate Reaction Effect does not create extra uses
  closed subsystem entries are not generic axes

MOVEMENT:
  replaces normal Movement
  use exact catalogue table
  Safe Movement suppresses movement-triggered Reactions
  Teleport skips intervening path

STONES:
  T1/T2/T3/T4 costs = 1/2/4/8 Stones
  nonexistent tiers are never payable prerequisites

ARTIFACTS:
  Technical Reference inherits exact current catalogue Power
  explicit Artifact restriction may narrow delivery
  duplicate Technical Reference shares identity/spent state
  unfinished Ultimate unavailable until fully specified

ENCOUNTERS:
  PP construction math != encounter calibration
  player Split Attack != Boss Split Attack
```

---

## 22. Publication Claims This Framework Supports

The following claims are justified by the framework:

- Power construction uses explicit target curves and published component costs.
- Combination Powers share a single budget rather than receiving multiple full budgets.
- Multi-target coverage and premium timing are explicitly constrained or priced.
- Closed premium mechanics cannot be freely attached as cheap riders.
- Technical Power identity prevents duplicate-source abuse.
- Numeric Diminishing Specials use a reproducible triangular cost function.
- Designers can independently recalculate many catalogue rows.
- Encounter calibration is deliberately separated from Power normalization.

The following stronger claims are **not** established by PP math alone:

- every build is equally strong in every situation;
- every party composition performs identically;
- every Special combination has identical tactical value;
- every Artifact combination has been exhaustively solved;
- every high-MR encounter has been empirically calibrated;
- mathematical normalization removes the need for playtesting.

The intended public position is therefore:

> **Destroyed Faith exposes the arithmetic used to normalize its mechanical building blocks. The framework is mathematically explicit and independently auditable; playtesting remains the validation layer for emergent combinations and encounter performance.**

---

## 23. Change Control

Whenever a primary rules document changes, this framework should be checked for synchronization.

A change requires an AGENT audit when it modifies any of the following:

- a target PP curve;
- a component price;
- a Special base cost or runtime rule;
- a Power's category or technical identity;
- a dedicated subsystem milestone;
- Range or area pricing;
- multi-target behavior;
- action economy;
- the named Power use limit;
- Passive slot progression;
- Stone tier existence or cost;
- Artifact Technical Reference behavior;
- encounter assumptions that are quoted here.

For each update, record:

1. source document and version/date;
2. changed rule;
3. affected sections or examples;
4. whether catalogue rows need regeneration;
5. whether Foundry/runtime data also needs migration;
6. whether the change is mathematical normalization or empirical playtest tuning.

Do not silently edit a formula without updating examples that depend on it.

---

## Appendix A - Current Technical Catalogue Names

This list is included to make terminology auditable. Exact effects remain in the relevant catalogue.

### Active Buffs

- Active Buff: Armor
- Active Buff: Evade
- Active Buff: Armor Aura
- Active Buff: Temporary HP
- Active Buff: Healing
- Active Buff: Damage Reduction
- Active Buff: Phasing
- Active Buff: Armor + Temporary HP
- Active Buff: Evade + Temporary HP
- Active Buff: Temporary HP + Healing
- Active Buff: Armor + Evade
- Active Buff: Damage
- Active Buff: Penetration
- Active Buff: Damage + Penetration
- Active Buff: Critical
- Active Buff: Special Increase + [chosen eligible Special]
- Active Buff: Spell Resistance
- Active Buff: Self Cleanse
- Active Buff: Damage Aura
- Active Buff: Healing Aura
- Active Buff: Size + Damage + Armor
- Active Buff: Summon Damage Aura
- Active Buff: Summon Armor Aura
- Active Buff: Thorns
- Active Buff: Invisibility
- Active Buff: Parry Recovery
- Active Buff: Absorption Stone Increase
- Active Buff: Damage Negation Pool

### Reactions

- Reaction: Armor
- Reaction: Evade
- Reaction: Temporary HP
- Reaction: Armor + Temporary HP
- Reaction: Evade + Temporary HP
- Reaction: Ally Armor
- Reaction: Ally Evade
- Reaction: Ally Temporary HP
- Reaction: Reposition
- Reaction: Cleanse
- Reaction: Damage Reduction
- Reaction: Phasing
- Reaction: Damage
- Reaction: Damage + Push
- Reaction: Special Increase + [chosen eligible Special]
- Reaction: Initiative
- Reaction: Parry + Weapon Damage
- Reaction: Parry + Attack Reflection
- Reaction: Absorption Damage Multiplier

### Movement Powers

- Movement: Ground Dash
- Movement: Safe Movement
- Movement: Teleport
- Movement: Teleport with Ally
- Movement: Flight
- Movement: Leap
- Movement: Wall Walk
- Movement: Burrow
- Movement: Phase Passage
- Movement: Trample

### Dedicated / named Passives

- Passive: Armor
- Passive: Damage Reduction
- Passive: Evade
- Passive: Healing
- Passive: Phasing
- Passive: Damage
- Passive: Health
- Passive: Special Aura + [chosen eligible Special]
- Passive: Spell Resistance
- Passive: Ward
- Passive: Telepathy
- Passive: Summon Tokens
- Passive: Thorns
- Passive: Invisibility
- Passive: Initiative
- Passive: Parry
- Passive: Absorption
- Passive: Damage Negation

Combined and Conditional Passives retain their exact current catalogue names and conditions.

---

## Appendix B - Audit Red Flags

A proposed Power should be stopped for review if any of the following appear without an exact catalogue source:

- Keep scaling from Power Level;
- `Attribute + Weapon Dice` used as the default Damage Pool;
- d6 as the normal Power damage die;
- generic `once per Day` or other reset language invented outside an exact subsystem;
- duration extended through a generic Raise ladder not present in the current rules;
- generic condition discounts such as x0.95/x0.90/x0.80;
- one universal AoE/radius price applied to all area systems;
- one universal movement PP-per-meter rule;
- Critical attached as a secondary rider;
- Damage Reduction or Phasing bundled into an unrelated combination;
- a Passive applying a Special directly;
- a standard Active Buff applying a Special directly;
- a Reaction behaving like a full Active Power;
- player Split Attack treated as several full-damage attacks;
- Boss Split Attack used as a player Power rule;
- Persistent Diminishing Zone reapplication forced to `highest only` despite current Core stacking;
- a nonexistent Stone Tier treated as a prerequisite;
- an Artifact summary overriding its catalogue Technical Reference without an explicit source-profile exception;
- an incomplete Ultimate being treated as usable;
- leftover PP automatically filled with unrelated effects.

Any of these signals usually means that an older internal design note has leaked back into current rules work.

---

---

Copyright (c) 2025-2026 Daniel Rodrigo Navarro Melendo. All rights reserved.

Destroyed Faith is in beta development. This framework documents the audited rules state named above and may be updated when primary rules or catalogue values change.

**End of Public Balance Framework**
