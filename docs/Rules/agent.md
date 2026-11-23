# Destroyed Faith - Mastery System Balance Framework

**Public technical reference for Power design, pricing, and mechanical audit**

**Framework version:** 1.3 (2026-11-23)  
**Rules status:** Destroyed Faith v0.9.9.6 Beta  
**Canonical source review:** 2026-11-23 (Core and all six Power Catalogues)  
**Primary Core baseline:** Destroyed Faith Core v0.9.9.6 (2026-11-23)  
**Catalogue baseline:** Actives, Active Buffs, Passives, Reactions, Movement and Artifacts v0.9.9.6 (2026-11-23)  
**Implementation status:** Rules documents synchronized; Foundry runtime still requires migration (see Section 24)  
**Scope:** Powers, Specials, Movement, Artifacts, Stone Power Support, and the separation between character construction math and encounter calibration.

---

## Review Status – Read Before Using This Framework

**This framework is synchronized with the v0.9.9.6 rules documents dated 2026-11-23.** The source of truth remains the current Core and the exact relevant catalogue. This file changes no repository files, Foundry worlds, Actor items or Compendiums.

| Topic | Status as of 2026-11-23 |
|---|---|
| Core | v0.9.9.6 (2026-11-23), governs play |
| Actives, Active Buffs, Passives, Reactions, Movement, Artifacts | v0.9.9.6 (2026-11-23); audited against this framework; calculation tooltips reflect the current rows |
| Repeatable Active Powers, Basic Attack removal, immediate Ruin damage, Mental Attack retirement | **Implemented in Core and Actives**; Foundry migration pending |
| Changes of 2026-11-23 | Basic Reaction Evade removed; natural-8 minimum damage removed; Large Damage Pool averaging added; Protective Auras added; Split Attack target progression; unified AoE radius table for Support and Barrier; refilled AoE/Autofire/Cleanse/Restoration rows; see Section 24 |
| Persistent Zones | Printed rules and values are authoritative; **no PP formula by design** |
| Ruin pricing | Deliberately unchanged at 4 × T(X) while immediate damage is playtested (`RUIN_BALANCE_REVIEW_PENDING`) |
| Absorption | Rules complete; playtest pending |

**Two distinct files:** `docs/Rules/agent.md` is this balance/audit framework. Repository-root `AGENTS.md` contains guidance for coding assistants and is not a substitute for the balance framework. A reviewed file must not silently replace the other.

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

### Source set and verification scope

| Source | State used | Verification |
|---|---|---|
| Destroyed Faith Core | v0.9.9.6 (2026-11-23) | Global gameplay rules cross-checked against all catalogues |
| Actives | v0.9.9.6 (2026-11-23) | Every non-qualitative row recalculated; tooltips match tables |
| Active Buffs | v0.9.9.6 (2026-11-23) | Rows checked; Protective Auras priced in this framework |
| Passives | v0.9.9.6 (2026-11-23) | Progressions checked against their formulas |
| Reactions | v0.9.9.6 (2026-11-23) | Every row checked against Section 12.2 |
| Movement | v0.9.9.6 (2026-11-23) | Caps checked against Section 13.1 |
| Artifacts | v0.9.9.6 (2026-11-23) | Technical References checked against the catalogues at PL 4/10/16 |
| Quick Encounter | v0.7 Beta, older Core baseline | Encounter layer only; do not infer player PP |
| Foundry runtime | Not re-audited | Must be migrated to the documents above |

Do not infer new PL rows from a superseded framework formula. The current printed catalogue tables govern.

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
- a Special-only design would cease to be damage-free if filler were added;
- the mechanic belongs to a closed premium subsystem with a fixed progression.

Unused PP is preferable to mechanical filler.

### 3.3 Near-target evaluation and the +5 PP tolerance

For a continuous axis, a row may end **up to 5 PP above** its target when that is required to reach the next legal increment. A value within 5 PP below or above the target is cleanly on-curve. Tooltips record such rows as "X PP over, within tolerance".

When a row is (re)filled, use the largest legal value whose total stays at or below **target + 5 PP**, subject to the monotonicity rule in Section 7.6. Unused PP below that is legal.

Discrete tables and dedicated subsystem progressions may intentionally deviate by more than 5 PP. Their exact catalogue entry controls.

Minimum-function exceptions may modestly exceed a target if the effect has no cheaper legal version (for example the PL 1 Damage AoE). Such exceptions must be explicit and reproducible.

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

### 4.4 Power use and the Attack Action economy

**Every Active Power can be used again in the same Round** if the character has another legal Attack Action and the Power is otherwise legal to activate. This covers damaging attacks, Special-only attacks, Support, Restoration, Barriers, Images, mental Powers and Persistent Zones. No duplicate purchase is needed and there is no per-instance once-per-Round counter. Explicit resource limits remain: the global Limited charge, Restoration pools, Artifact quotas, maintenance requirements, printed charges.

Additional Attack Action grants from different sources do not stack unless expressly allowed; use the highest single grant.

There is **no Basic Attack**. An Attack Action deals no damage by itself; damage requires an acquired or granted Attack Power. Universal Combat Maneuvers (such as Grapple) remain available. NPCs and Summons may use their expressly defined attack profiles.

The only regular Attack Action may be voluntarily transferred to an ally during Preparation (Core: *Tactical Choices*). This creates no additional Action.

### 4.5 Initiative

At the start of combat each creature chooses **Risky** (MR d8, keep all, natural 8s explode) or **Controlled** (the higher Attribute value of Agility or Wits, no roll). All Initiative modifiers apply once. The score persists across Rounds; Initiative may be converted into Initiative Colorless Stones during the **Initiative Exchange** at 4 × MR Initiative per Stone.

### 4.6 Combat Raises – current Core

- **Before** an eligible Attack/Casting Roll, declare the count of Paid Raises. Each adds **+4 to the relevant TN**. Commit eligible Intellect Free Raises before rolling; these add **no TN**.
- **After** the roll and hit checks, choose one shared allocation of the already declared/committed Raises to eligible effects on that Power. Never declare extra Raises after rolling.
- Each Damage Raise adds **+MR d8 Damage** to an existing damaging Attack; for an AoE, it adds **+ceil(MR/2) d8** instead.
- Each Special Raise adds **+MR** to an existing numeric Special(X) applied by the Power.
- **Special-only Single Target and AoE Attacks cannot select Damage Raises.** Placed Persistent Zones and Special Auras make no Attack/Casting Roll and cannot use Raises.
- AoE, Split Attack and Autofire each use one shared after-roll Raise allocation for the Power use.

These are Raise effects, not Power Point purchases. There is **no upfront Damage Dice payment** for a Combat Raise under v0.9.9.6.

### 4.7 Attack and damage mitigation

Use the Core's full Attack and Defense Sequence instead of a shortcut that accidentally bypasses premium defenses:

1. Resolve legal targets, Paid/Free Raise declarations and any Parry/Attack-Trigger defenses.
2. Resolve the Attack or Casting Roll against Evade/Final Spell TN where required.
3. Calculate the incoming Special value, including legal boosts and Vulnerability, then **Special Negation**, before applying it. Immediate Ruin damage resolves here.
4. For damaging hits, resolve eligible **Damage Negation before the Damage Roll**, then roll the remaining dice. **Large Damage Pools:** with 40 or more remaining Damage Dice, each die may count as 5 instead of rolling; Maximization still counts 8; a damage floor above 5 (Mark, Brutal Impact) counts its floor value.
5. Apply Corrode/Armor Reduction/Penetration and Armor, then percentage **Damage Reduction** (maximum 100%; current sources reach at most 90%), then Temporary HP and Health.
6. Resolve Damage Transfer and later Scar/Absorption triggers by their exact timing.

**There is no natural-8 minimum damage.** Damage reduced to 0 by Armor and DR deals 0. Special-only Attacks have **no direct Damage Roll**. Ruin damage ignores Armor but uses Damage Reduction, Temporary HP and normal Health processing.

---

## 5. Technical Identity

Destroyed Faith separates **mechanical identity** from **fictional presentation**.

Every catalogue Power has a canonical **Technical Power Name**. A character-facing name may be anything appropriate to the character, but that name does not create a new mechanical Power.

Examples:

- `Reaction: Evade` may be described as a shield flash, a sidestep, a shadow flicker, or a divine warning.
- `Melee Single Target Special: Ruin` may be portrayed as a cursed touch, corrosion, sacred brand, or supernatural martial technique; it carries **no direct Attack Damage**.

A Technical Reference identifies the underlying mechanical Power. A renamed character-facing Power or a Martial/Spell delivery change does not create a new Technical Reference.

### 5.1 Alternatives in technical names

For catalogue headings containing slash-separated alternatives, choose **one printed Special** when learning the Power; the choice is part of that instance's identity. For Foundry, current Phase 1 analysis identifies a `templateId::specialKey` form; do not map a different Special to the same generic tier value when rendering a preview.

### 5.2 Duplicates and migration

Because every Active may be reused with any legal Attack Action, a duplicate purchase of the same Technical Reference grants nothing. Upgrades of a single grant replace the previous profile. Duplicate Reaction Effects, Passives and Buffs follow their own catalogue duplicate rules.

When migrating legacy Damage-plus-Special definitions or duplicate purchases in Foundry, **do not automatically merge, delete, refund or downgrade owned instances.** Preserve PL, source and the chosen Special, and report conflicts for GM review.

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

A Power never receives several full PL budgets merely because it contains several effects. **Currently selectable v0.9.9.6 Active Buffs and Passives are not generic Combined Powers.** If a *future dedicated* combination is introduced, its exact printed table must define how one shared budget is allocated. Historical Combined Passive/Buff examples are no longer legal templates.

### 7.2 Coverage has value

Range, Radius, additional targets, repeated area coverage, ally delivery, and similar extensions are not free.

A Power that reaches farther or affects more creatures pays for that coverage through the exact structure of its subsystem.

### 7.3 Do not multiply output for free

Multi-target mechanics must define whether payload is:

- copied to every legal target;
- divided among targets;
- shared between placements;
- or stopped by a chain condition.

The catalogue prices that behavior explicitly. Some printed Powers (e.g., Split Attack and Autofire) can deliver **full damage on multiple successful hits** with their own limitations and PP capacity costs. Do not grant extra hits without those printed structures, and never treat such a Power use as extra free Attack Actions.

### 7.4 Closed systems stay closed

Critical, Damage Reduction, Phasing, Parry, Absorption, Damage Negation, Invisibility, Special Negation, and other dedicated premium systems are not generic riders.

If the catalogue gives such a subsystem a dedicated Power, use that Power. Do not recreate the mechanic as a cheaper secondary effect inside another template.

### 7.5 Preserve Power identity across levels

An Active's **exact current catalogue table** establishes its identity across PL 1–16. A Direct Damage Attack, a Single-Target Special-only Attack, and an AoE Special-only Attack are separate Power families. Do not create retired Damage-plus-Special hybrids or use a historical Level 4 "Damage Anchor" to fill leftover PP.

Likewise, no new effect axis is silently added to an Active Buff or Passive. **Combined Active Buffs and Combined Passives are not selectable** in the current v0.9.9.6 Core. Higher PL scales only legal existing effects unless a dedicated table expressly says otherwise.

### 7.6 Monotonicity – never reduce a paid axis

Within a progression, **no paid axis may ever decrease** at a higher Power Level: not damage, not Radius, not Range, not targets, not Special value. A Power must never trade a smaller Radius for more damage, or less damage for a larger Radius, because the points no longer suffice.

When refilling rows, compute each level's maximum and then take the running minimum from the top level downward, so that no later level falls below an earlier one. This is why some AoE rows below a Radius increase intentionally keep unused PP (for example Melee AoE Attack PL 8–12 and Ranged AoE Attack PL 6–13).

### 7.7 No filler requirement

Unused PP is legal.

Do not add Damage, Critical, Penetration, defense, Specials, Attack Dice, Movement, or another rider merely to make the arithmetic look full.

### 7.8 Exact entry beats generic math

A catalogue's dedicated milestone table is itself a balance rule.

Do not reverse-engineer a different progression simply because a generic price would produce a mathematically closer result.

---

## 8. Mathematical Kernel

This section contains the most reusable current cost structures. They are valid only in the contexts stated.

### 8.1 Active direct damage and HP healing

For the normal **Damage Attack** construction, **+1d8 Power Damage = 15 PP** unless the exact entry uses a dedicated different price (e.g., Damage Transfer or Mental subsystems).

**Do not generate generic HP Healing Actives from this price.** The v0.9.9.6 Actives catalogue removed former pure HP Heal Actives. Ordinary HP Healing belongs to **Resolve Ability: Healing** under Stones. **Restoration** is a separate Active that reopens Scarred Health Bars **at full HP**, with a finite pool per Safe Haven Rest.

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
| 3 PP | Blight *(Timed: X is remaining affected Turns, not a Diminishing stack)* |
| 4 PP | Lacerate, Mark, Ruin, Slow |
| 6 PP | Corrode, Hex, Sundered; Root uses this price but its own recovery rules |
| 8 PP | Expose |

Pool-reduction Specials use dedicated compressed pricing because each printed point removes one die from an Attribute-based or Attack Pool:

- `Challenge(1) = 6 PP`; for `Challenge(X)` at X 2+, use `6 x T(2X)`.
- `Disoriented(1)`, `Soulburn(1)`, and `Weaken(1) = 8 PP`; for X 2+, use `8 x T(2X)`.

The printed X values in exact catalogue entries are authoritative. These formulas are the audit kernel for direct dice-removal effects.

Example:

`Blight(8) = 3 x T(8) = 3 x 36 = 108 PP` (catalogue design price; Blight duration does **not** add as Diminishing stacks)

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

This table is used for:

- **instant Attack AoEs** (Damage and Special-only);
- **Support AoEs** (AoE Cleanse and AoE Restoration);
- the **Radius of Ranged Barrier** (inside its own Barrier formula);
- **Protective Auras** (Active Buffs, Section 10.4).

Do not reuse it for **Persistent Zones**, **Special Auras**, Power Images or other dedicated area systems; those use their printed values.

### 8.7 Fixed control costs

The **current printed pure Push/Pull Active** uses **30 PP per 2 m** of forced movement before any legal Ranged cost.

Earlier framework references to **Prone (60 PP), Disarm (60 PP) and Stunned (120 PP)** are historical design prices. They do **not** create current selectable Active Powers on their own; the v0.9.9.6 Actives catalogue does not contain matching standard Prone/Disarm/Stunned attack tables. Any legacy Foundry templates combining those effects require a separate catalogue source or explicit redesign decision.

---

## 9. Active Power Construction

Active target budget = **30 PP × Power Level**. Use only an exact legal entry in the v0.9.9.6 Actives catalogue. Printed level rows, including exceptions, control availability, Range and Radius, govern over generic reverse engineering.

### 9.1 Core attack families and construction order

The player-facing order is:

1. **Damage Attacks:** Melee/Ranged Single Target; Melee/Ranged AoE; Melee/Ranged Split Attack; Ranged Autofire.
2. **Special-only Attacks:** Melee/Ranged Single Target and Melee/Ranged AoE for each of the fourteen catalogue Specials.
3. **Limited Damage Powers**, **Damage Transfer**, and pure **Push/Pull** (dedicated offensive mechanics with their own limits).
4. **Support:** Single-Target and AoE Cleanse/Restoration.
5. **Mental utility:** Mind Illusion, Mind Probe, Mental Control; **no Mental Attack/Mental Damage Active**.
6. **Constructs, Barriers, Power Images**.
7. **Ranged Persistent Special Zones**, at the end of the document.

For an exact entry: read its PL row; account for legal damage, Range and AoE geometry as needed; preserve the exact Technical Reference; record every relevant PP component and any unspent PP in the information tooltip. Never substitute a generic default Special for the selected `specialKey`.

### 9.2 Direct Special-only attacks

Every printed Special has **four distinct attack profiles**: Melee Single Target, Ranged Single Target, Melee AoE, Ranged AoE. Each is an independently learnable technical Power. The previously mixed `Damage + Special` families are **not** catalogue entries and must not be regenerated.

A successful Special-only hit applies its printed Special but **zero direct Attack Damage**. No Power Damage, Weapon Damage, Spell Focus Damage, external Attack Damage bonus, Damage Raise or direct Damage Roll. The Special may cause damage later under its own rule (currently Ruin tick, etc.). Special Raises remain legal on successful rolled attacks.

Use **per-Special** printed PL1–16 ranks, not a common tier rank. Example controls from the current v0.9.9.6 catalogue:

| Power | PL | Printed payload |
|---|---:|---|
| Melee Single Target Special: Blight | 4 | Blight(8) |
| Melee Single Target Special: Ruin | 4 | Ruin(7) |
| Ranged Single Target Special: Ruin | 4 | Ruin(6) |
| Melee Single Target Special: Sundered | 4 | Sundered(5) |
| Melee Single Target Special: Sundered | 16 | Sundered(12) |
| Ranged Single Target Special: Sundered | 16 | Sundered(11) |

### 9.3 Instant AoE attacks

A Martial AoE uses one Attack Roll, checked separately against eligible creatures' Evade; a Spell AoE uses one Casting Roll checked separately against each Final Spell TN. **Instant AoEs may exclude any creatures; allies are excluded by default.** The same valid payload goes to each hit target.

- **Damage AoE:** one shared Damage Roll includes the purchased Power Damage and matching Weapon Damage (Martial) or Spell Focus Damage (Spell) **once**. Each successful target resolves its own mitigation.
- **Special-only AoE:** no direct Damage Roll or delivery damage, but the printed Special is applied separately to each successful target.
- The radius tax uses the **instant Attack AoE table** in Section 8.6. For printed numeric Special ranks, use the exact special-cost rule and full catalogue row; do not invent a generic AoE Special multiplier.

### 9.4 Ranged Persistent Special Zones – fixed rules, no PP formula

Persistent Zones are **Ranged only**: no Melee Zone variant exists. They occupy a fixed point within the printed Range, **do not follow the creator**, and remain active only while the creator pays **one Attack Action per Zone at the start of every subsequent creator Turn**. Creation costs one Attack Action.

- No fixed four-Round duration. The old four-Round **×2 duration-cost formula is retired** and must not be used.
- No Attack/Casting Roll, no Spell Resistance check on occupancy, no Damage Roll, and no Raises. Apply the printed Special automatically on creation, on first entry in a Round, or at a qualifying target Turn start.
- **Once per distinct Zone / creature / combat Round**. Every creature inside is affected, **including creator, allies, neutrals, Summons and enemies**.
- At a creature's Turn start: resolve ticks of existing Specials, Natural Special Recovery and decay first; only then apply any eligible Zone/Aura payload.
- **Root is not a legal Persistent Zone Special.**
- **The printed Zone values are authoritative.** By design decision there is **no PP formula** for Zones; do not invent one, and do not present Zone rows as derived from the Active curve.

### 9.5 Player Split Attack

A player Split Attack divides the Attack Pool (Martial) or Casting Pool (Spell) **for accuracy**, not the Damage Pool. Each successful split deals the **full matching Weapon/Spell Focus Damage plus full printed Power Damage**. One Power use, one shared Raise declaration and allocation, separately resolved splits, different targets.

- Target capacity: **2 targets at PL 1–6, 3 at PL 7–12, 4 at PL 13–16**.
- Price: **30 PP per additional target**, 15 PP per bonus d8, plus Range for the Ranged version.

### 9.6 Split AoE – not a current generative template

The v0.9.9.6 Actives catalogue does **not** provide a standard selectable `Split AoE` catalogue entry. Do not generate it or price it through this framework. A specifically authored Artifact or future dedicated entry would require its own written mechanics and balancing review.

### 9.7 Ranged Autofire

Autofire is a stepped sequence of **attacks, not AoE**. Declare up to the printed Attack Capacity; the same creature may appear repeatedly. All declared slots are within Range and each successive target is within 4 m of the preceding slot. Resolve **one shared Attack/Casting Roll** against each ordered slot's TN:

> **TN(slot i) = target's Evade or Final Spell TN + 4 × (i−1) + 4 × declared Paid Raises**

A miss/resisted slot ends the chain. Cumulative +4 steps are not Paid Raises. Each prior success is a **separate full-damage hit** even against a repeat target; make one shared Damage Roll and reuse the result per successful hit, with independent defenses. Dive for Cover is unavailable. Each extra attack slot beyond the first costs **30 PP** per its dedicated table.

### 9.8 Support Actives – Cleanse and Scarred-Bar Restoration

- **Cleanse(X)** = **4 × T(X) PP**, plus Range and AoE radius (Section 8.6) where the entry has them. Direct Support Cleanse may distribute its value across eligible Specials on each affected creature.
- **Restoration** restores a **Scarred Health Bar at full HP**: **40 PP per Bar**, plus Range and AoE radius (Section 8.6). Each acquired Restoration Power has **one shared pool per Safe Haven Rest**; AoE Restoration distributes that pool among recipients.
- **HP Healing** is supplied by Resolve Stone Ability: Healing and Damage Transfer, not by a generic Healing Active.
- Artifact **Moonlight Mending** is a Ranged Single Target Restoration (Scarred Bars), consistent with this section.

### 9.9 Barriers, Images and Damage Transfer

- **Ranged Barrier** (4 Rounds): **Range + 2 × (Radius cost + Barrier HP)**, Barrier HP 1 PP each, Radius from Section 8.6.
- **Power Images** and illusions use qualitative milestones (Image size and tier) and printed values; no generic PP curve.
- **Damage Transfer** is a dedicated attack family at **25 PP per purchased +1d8** plus Range; healing equals HP actually removed, limited to the current Health Bar. It has no separate Healing Roll.

### 9.10 Mental powers

**Mind Illusion, Mind Probe and Mental Control** use their exact Mental TN, Telepathic Access and qualitative per-Level milestones. They have **no PP formula**; their printed rows govern. **Mental Attack / Mental Damage is retired.** Do not repurpose Mental Control or Mind Illusion as damage attacks.

---

## 10. Active Buff Construction

Active Buff budget reference: **30 PP × PL + 10 PP**, subject to the exact current Active Buff catalogue and its dedicated exceptions.

### 10.1 Preparation activation and limit

- **Activate during Preparation**, at **no Attack Action or Stone cost**; activation cannot occur during an ordinary Turn.
- **Each named Active Buff may be activated once per Combat**. Its effects last **MR complete Rounds**, counting the activation Round as the first.
- **Maintain only one Active Buff at a time.** A still-unused Buff may replace it during a later Preparation Phase.
- Round-based resources refresh at their printed Preparation timing.
- **Combined Active Buffs are not selectable.**

### 10.2 Dedicated buffs and closed subsystems

Use the exact catalogue rows. The Self Buffs **Armor, Evade and Spell Resistance** grant **+2 per PL** (15 PP per point; the +10 PP Buff premium stays unused). Closed subsystem Buffs (Damage Reduction, Phasing, Damage Negation Pool, Parry Recovery, Absorption Stone Increase, Critical, Maximization and others) follow their dedicated milestones. No filler, extra Attack Actions, hidden Reactions or Movement.

### 10.3 Fourteen Special Auras

Fourteen catalogued **Special Auras** are Active Buffs: Blight, Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Root, Ruin, Slow, Soulburn, Sundered and Weaken.

- Self-centered and moving with the caster.
- Applies the printed Special automatically on activation, first entry or start of Turn, at most **once per Aura/creature/combat Round**.
- The **caster alone is exempt**; allies, enemies, neutrals and Summons are affected.
- No Attack Roll, Casting Roll, direct Damage Roll, Spell Resistance occupancy check or Raises.
- Printed values govern; the Instant AoE table is not used.

### 10.4 Three Protective Auras

There are exactly three **Protective Auras**: **Armor Aura, Evade Aura and Spell Resistance Aura**. No Damage, Critical or other offensive Aura exists, and closed premium defenses (Damage Reduction, Phasing, Damage Negation) are never offered as Auras.

- Active Buff; once per Combat; occupies the one Buff slot; lasts MR complete Rounds; moves with the caster.
- Affects **the caster and every ally inside the radius**; never enemies.
- **No stacking:** a creature benefits from only **one Active Buff bonus to the same value**. Compare its own Active Buff and every Protective Aura it is inside; only the highest applies. Passives, Stones, Reactions, equipment and Artifacts stay separate sources.
- **Price:** Radius (Section 8.6: 2 m = 20 PP at PL 1–8, 3 m = 50 PP at PL 9–16) + **10 PP ally premium** + **15 PP per +1** of the value, filled to target + 5 PP.
- Resulting value: **+(2 × PL − 1)** at PL 1–8 and **+(2 × PL − 3)** at PL 9–16 (PL 4: +7; PL 16: +29).
- Tuning lever if playtests show excess strength: raise the ally premium (+15 PP lowers each row by 1).

---

## 11. Passive Construction

Passive target budget reference: **20 PP × PL**, subject to the exact, current dedicated Passive catalogue. Passives occupy the listed Passive Slots and grant always-on effects while legally slotted; they do not cost an Attack Action or Reaction to activate, unless their exact effect states a distinct trigger.

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

### 11.2 Categories and availability

Core v0.9.9.6 describes **28 current named Passives**, each in **exactly one mechanical Passive Category**. **Combined Passives are not available.** Offensive/Defensive/Utility selection groups are UI labels, not categories for stacking or eligibility.

Relevant current mechanical names include Armor, Evade, Health, Fortitude, Temporary HP, Parry, Damage Negation, Damage, Armor Reduction, Critical, Maximization, Enemy Evade Reduction, Spell Resistance Piercing, Special Amplification, Self Cleanse, Regeneration and Speed. The **exact Passive catalogue** (not the outdated historical name list) determines which entries and formulas exist.

**Health** adds Bars, while **Fortitude** increases Bar capacity; both share the Health category and cannot be slotted together. **Passive: Regeneration** handles its own Scarred-Bar recovery. Do not substitute the retired generic `Passive: Healing` name or assume per-Turn HP Healing.

### 11.3 Pricing and subsystem boundaries

Older generic Armor/Evade/Damage, Conditional and Combined-Passive heuristics in earlier frameworks are **not a license to generate new entries**. Use printed PL1–16 milestones and exact category restrictions. Particularly closed subsystem effects (Damage Reduction, Phasing, Special Negation, Damage Negation, Parry, Absorption, Invisibility and similar) cannot be added as discount riders.

### 11.4 Special support

Current rules distinguish **Passive: Special Amplification** (adds to its owner's attack-applied numeric Specials), **Passive: Special Aura** (increases the effective value of one chosen existing diminishing Special on creatures inside its radius by +1; it never applies a Special), **Intellect Stone Ability: Special Boost**, and the **Special Increase Raise effect**. Auras that *apply* Specials are Active Buffs (Section 10.3).

### 11.5 Combat Senses

Combat Senses use their separate Core Sense Slot system and are **not** generic Passive Powers. Do not invent a universal `Passive: Awareness` or bundle extra Combat Senses into a standard Passive PP formula.

---

## 12. Reaction Construction

Reactions are immediate answers to specific triggers. They are not second Turns and are not miniature Active Powers.

Normal rules:

- using one consumes 1 Reaction;
- a character normally has 1 Reaction per Round;
- a Reaction applies only to its triggering attack, hit, damage instance, effect, ally, or movement event unless the exact entry says otherwise;
- Reaction effects normally do not create maintained states;
- Reaction Temporary HP protects only its triggering damage instance.

**Basic Reactions** available without a purchase are only **Guard** (+MR × 2 Armor against the triggering hit or damage) and **Dive for Cover**. There is **no Basic Evade Reaction**; Evade as a Reaction requires `Reaction: Evade`.

### 12.1 Trigger identity

A Reaction consists of:

1. the **Reaction Effect**; and
2. a legal **Chosen Trigger** where the catalogue offers alternatives.

Choosing a different Trigger does not normally create another copy of the same Reaction Effect.

Duplicate Reaction Effects do not stack and grant no additional uses; use only the highest available version. An extra Reaction is never created by owning a duplicate.

### 12.2 Standard Reaction pricing

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

The +5 PP tolerance (Section 3.3) applies; Reaction: Cleanse uses it at PL 4, 7 and 13.

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

### 12.5 Current Reaction catalogue

Armor, Evade, Temporary HP; Ally Armor, Ally Evade, Ally Temporary HP; Reposition; Cleanse; Damage Reduction; Phasing; Damage; Damage + Push; Initiative; Parry + Weapon Damage; Parry + Attack Reflection; Absorption Surge. There is **no Reaction that applies or increases a Special**; the former `Reaction: Special Increase` is not part of the current catalogue.

### 12.6 Closed Reaction subsystems

Reaction: Damage Reduction, Phasing, Initiative, Parry + Weapon Damage, Parry + Attack Reflection and Absorption Surge use their exact milestones and requirements. Unused PP inside milestone bands stays unused. Trigger alternatives do not create a new Reaction Effect or extra Reaction use.

---

## 13. Movement Power Construction

Movement Powers replace normal Movement for the Round. They are not Attack Actions, Active Buffs, Reactions, or Special-delivery systems.

There is no universal `PP per meter` rule that can safely generate every Movement Power.

Movement value depends on what geometry and threat rules the movement bypasses.

### 13.1 Movement families and caps (verified 2026-11-23)

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

### 14.1 Effect classes and the Blight exception

- **Diminishing:** numerical points normally stack, tick if applicable, receive eligible Natural Special Recovery, then decay by 1.
- **Timed:** repeated applications do **not** add their durations unless expressly stated. **Blight(X) is Timed** in Core v0.9.9.6; X is affected Turns remaining. Blight imposes Disadvantage on every Attribute-based pool, counts down at the **end** of the affected creature's Turn, uses no Natural Special Recovery, and on reapplication keeps the higher remaining duration.
- **Until Broken / Until Used:** resolve the exact break/use conditions. **Root** has its own MR reduction and optional break check; it is not normal Diminishing decay.
- **Instant:** effect resolves immediately without a maintained stack unless stated otherwise.

### 14.2 Diminishing application and stacking

A surviving incoming numeric Special is:

> **Printed X + eligible after-roll Special Raises + eligible Stone Special Boost + applicable attacker's Passive Special Amplification + target Vulnerability − target Special Negation**

Apply the surviving value under that Special's own rule. Diminishing applications usually add the new points to existing stacks; distinct sources and repeat applications work unless a named exception restricts them. Reaction/defense timing and the target's special-specific protections still apply.

### 14.3 No global Special Application Limit

**Core v0.9.9.6 explicitly removed the former `4 × target MR` maximum for newly applied Diminishing points per Round.** It is neither an application cap nor a stack cap. Do **not** reintroduce it in Foundry, tooltip math, test fixtures, Zone logic, or audit formulas.

### 14.4 Start-of-Turn order

For existing eligible negative Diminishing Specials:

> **Existing Tick → Natural Special Recovery (target MR total) → Diminishing Decay (−1)**

Then resolve qualifying new persistent Zone/Aura applications at the required start-of-Turn stage. **Blight is Timed** and counts down at Turn end; **Root** uses its own rule and is excluded from both Natural Special Recovery and ordinary Diminishing decay. A new Zone Ruin application does not receive a retroactive tick.

### 14.5 Cleanse eligibility

Cleanse affects only eligible negative Specials and follows its exact source scope. Direct Core Cleanse may distribute points across eligible effects; a narrower Reaction/Power rule may constrain the target or trigger. Cleanse does not heal ordinary HP or restore Scarred Bars.

### 14.6 Special-generated damage

**Ruin:** when new Ruin points are successfully applied (after increases, Vulnerability and Special Negation), deal **4 × the newly added points** immediately; at each start-of-Turn tick deal **4 × current Ruin(X)**. Both ignore Armor but use Damage Reduction, Temporary HP and normal Health processing. Existing stacks never count toward the immediate component.

**Ruin pricing is deliberately kept at 4 × T(X)** (same group as Lacerate, Mark, Slow) while the immediate damage is playtested, because Special-only damage was previously too weak. `RUIN_BALANCE_REVIEW_PENDING` remains until playtest results exist. A later simplification of Ruin's printed values may replace the ×4 conversion.

Slow and Lacerate use their own damage timing; Hex and Sundered modify later eligible damaging hits; Mark adjusts later damage dice floors. Do not infer direct Attack Damage from a Special-only Power.

### 14.7 Intended tactical synergy

Corrode can open Armor, Expose reduces Evade, Mark adjusts damage dice floors on later hits, Hex supports eligible Spell hits, Sundered supports later non-Spell hits, and control can buy time. This synergy is not a general hidden PP surcharge; the permitted checks are the **exact PP table**, action/Reaction economy, printed activation limits, current stacking/recovery, and defensive counters. The removed global `4 × MR` cap must not be listed as a balance constraint.

---

## 15. Stones and Stone Abilities

Stones are a runtime resource system, not PP. Never convert PP into Stones or Stones into PP unless an exact subsystem defines it.

### 15.1 Stone Ability Ranks and costs

Every Stone Ability has **exactly four Ranks**; Rank 4 is the absolute maximum.

| Rank | Normal (incremental / total) | Premium (incremental / total) |
|---:|---:|---:|
| 1 | 1 / 1 | 2 / 2 |
| 2 | 2 / 3 | 4 / 6 |
| 3 | 4 / 7 | 6 / 12 |
| 4 | 8 / 15 | 8 / 20 |

**Premium Stone Abilities:** Extra Attack, Parry, Crit, Damage Negation, Special Boost, Damage Reduction, Not a Target, Phasing. All others use the Normal cost.

### 15.2 Lower Ranks always exist

All Stone Abilities, Premium included, have a payable Rank 1. A higher Rank requires every lower Rank to be activated and paid in the same Preparation Phase unless a rule explicitly waives it (for example Artifact Awakening).

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

### 16.2 Artifact Level to Power Level mapping

| Artifact Level | Default effective Power Level |
|---:|---:|
| 1-3 | PL 4 |
| 4-6 | PL 10 |
| 7-9 | PL 16 |
| 10 | Artifact Awakening (universal rules, no separate Ultimate) |

Artifact Level cap by MR: MR 1 → 1, MR 2 → 2, MR 3 → 4, MR 4 → 6, MR 5 → 8, MR 6+ → 10. Artifact-granted Powers use their printed PL even above the MR × 2 cap.

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

### 16.5 Artifact Awakening

Artifact Level 10 grants **Artifact Awakening** under the universal Core rules (once per Safe Haven Rest per distinct ability, action-free use of granted Powers, cost-free Stone Power Support, one-combat refill of Stone reservoirs). It does not invent a new Power or Base Value; only explicit Level-10 exceptions printed in an Artifact add another effect.

### 16.6 Stone Power Support

Stone Power Support pre-fills one named Rank of a Stone Ability. Every lower Rank must still be activated and paid normally. Support never skips unpaid lower Ranks.

---

## 17. Spells

A Spell is **not a separate Power Type**; it is a **legal magical delivery** of an eligible Ranged Active and retains that Power's base Technical Reference and exact PL row. It substitutes Casting Pool/Roll and **Final Spell TN** for a Martial Attack Pool/Roll against Evade, and eligible Spell Focus Damage for mundane Weapon Damage on **damaging** attacks.

- **Spell Base TN = 4 × used Power Level**, not MR. MR determines Keep and applicable PL caps. For an eligible direct Spell, Final TN additionally includes effective target Spell Resistance; creatures with no granted Spell Resistance have 0.
- Casting Attribute is fixed from **Intellect, Resolve or Influence**.
- **Special-less Spells are allowed**, up to a number of such Spell Powers equal to the character's MR; a qualifying Spell need not contain any Special.
- Damaging Single Target, AoE, Split and Autofire profiles use their corresponding current catalogue damage/roll rules. Special-only Spell Attacks deal **no direct Attack Damage** and gain no Spell Focus Damage.
- A normal **Persistent Special Zone** may be delivered via a qualifying Ranged Power but makes **no Casting Roll or Spell Resistance occupancy check** and cannot use Raises.
- Changing a Power's Martial versus Spell delivery **does not create another independently purchased Power instance**.

Do not create separate Spell-only PL pricing curves, and do not silently reuse the old requirement that a Spell must have a Special.

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

This is **not** the same mechanic as the player Active `Split Attack`, which divides Attack/Casting Pool for accuracy while each successful hit deals full damage.

Never copy the Boss rule into the player Power catalogue or vice versa.

### 18.3 Higher-MR calibration status

The encounter tables provide mechanical coverage through MR6 in the audited Quick Encounter draft. Higher-MR encounter values should still be treated as playtest-calibration material rather than evidence that every high-MR encounter has been empirically solved.

---

## 19. Worked Mathematical Audits

These examples show how the public framework should be checked.

### 19.1 Active Buff: Armor, PL 4

- Target: `30 x 4 + 10 = 130 PP`
- Effect: `+8 Armor x 15 PP = 120 PP`
- Unused: `10 PP` (the Buff premium). No filler.

### 19.2 Reaction: Armor, PL 4

- Target: `20 x 4 = 80 PP`
- Effect: `+8 Armor x 10 PP = 80 PP` (matches the current catalogue)

### 19.3 Passive: Armor, PL 4

- Target: `20 x 4 = 80 PP`
- Current catalogue row: `+5 Armor` (progression 1 / 3 / 4 / 5 … 21 at PL 16). No filler required.

### 19.4 Melee Single Target Special: Blight, PL 4

Printed v0.9.9.6 working entry: **Blight(8)**, no direct Power/Weapon/Spell Focus Damage.

- Target budget: **30 × PL4 = 120 PP**.
- Blight is Timed in the current Core; the catalogue design price is **3 × T(8) = 3 × 36 = 108 PP**.
- Melee Range cost: **0 PP**; no direct Damage dice or AoE cost.
- Unspent: **12 PP**. The lack of filler is intentional; **do not** reinsert the former 1d8 Damage Anchor.

This pricing reproduces the printed row but is **not** a demonstration that Blight and every other Special have identical empirical combat value.

### 19.5 Ranged Persistent Zone: Blight, PL 4

Printed v0.9.9.6 Zone: **20 m Range, Radius 2 m, Maintained, Blight(3)**. The printed values are authoritative. Zones have **no PP formula** by design (Section 9.4); do not present a PP total for them.

### 19.5b Protective Aura: Armor Aura, PL 4

- Target: `30 x 4 + 10 = 130 PP`
- Radius 2 m = 20 PP; ally premium = 10 PP; `+7 Armor x 15 PP = 105 PP`
- Total `135 PP` (5 PP over, within tolerance). Compare Self Buff: +8 Armor.

### 19.6 Reaction: Damage + Push, PL 8

Target:

`20 x 8 = 160 PP`

One clean construction:

- 4d8 Counter Damage = 80 PP
- Push 8 m = 80 PP

Total:

`160 PP`

Matches the current Reaction catalogue (PL 8: 4d8 + Push 8 m).

### 19.7 Active Buff: Critical, PL 8

- Target: `250 PP`
- Current catalogue milestone: `Critical(2)` (PL 4: Critical(1); PL 16: Critical(4)).
- The remaining budget is **not filled** with damage, Penetration, Specials, Attack Dice or defense.

### 19.8 Player Split Attack, PL 7

- Target: `30 x 7 = 210 PP`
- Melee: 3 targets (2 additional × 30 = 60 PP) + `10d8 x 15 = 150 PP` = `210 PP`
- Each successful split deals the full eligible Weapon/Spell Focus Damage and Power Damage. No shared Damage Pool is divided, and no extra Attack Action is created.

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

Verify the Attack Action economy (Actives reusable with any legal Attack Action), Reaction and Movement economy, Preparation-only Active Buff activation, the Protective Aura stacking rule, current Passive Categories, Limited and Artifact quotas, Special Negation, Special stacking without a global 4 × MR cap, Timed Blight, Root recovery and maintenance-based Zones.

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

## 21. Machine-Readable Design Contract (v0.9.9.6, 2026-11-23)

This is a human-readable design contract for auditing; it is **not** an automatically synchronized Foundry data source.

```text
AUTHORITY:
  current_core = Core v0.9.9.6 (2026-11-23)
  current_catalogues = Actives, ActiveBuffs, Passives, Reactions, Movement, Artifacts v0.9.9.6 (2026-11-23)
  balance_framework = derivative, never overrides exact catalogue
  foundry_runtime = migration pending

POWER_USE:
  technical_reference != flavor_name
  active_reusable_with_each_available_attack_action = true
  duplicate_purchase_needed_for_reuse = false
  basic_attack = NONE
  regular_attack_action_transferable_in_preparation = true (once, not again)
  martial_spell_delivery_change_creates_new_power = false

TARGET_PP:
  Active(PL)      = 30 * PL
  ActiveBuff(PL)  = 30 * PL + 10
  Passive(PL)     = 20 * PL
  Reaction(PL)    = 20 * PL
  Movement        = exact catalogue progression

BUDGET:
  no_unrelated_filler = true
  unused_PP_legal = true
  overspend_tolerance = +5_PP
  fill_rule = max_value_within_target_plus_5_then_running_min_from_top
  paid_axis_may_decrease = false
  exact_printed_PL_rows_override_generic_heuristics = true
  damage_attack_d8 = 15_PP
  damage_transfer_d8 = 25_PP
  ranged_baseline = 8m_zero_PP_then_5PP_each_4m
  AoE_radius_table = 1m:0,2m:20,3m:50,4m:80,5m:120,6m:165,7m:220,8m:280
  AoE_radius_table_used_for = instant_attack_AoE, support_AoE, barrier_radius, protective_auras
  restoration_bar = 40_PP
  cleanse = 4*T(X)
  barrier = range + 2*(radius + HP); HP_1PP; 4_rounds
  split_extra_target = 30_PP; targets = 2(PL1-6),3(PL7-12),4(PL13-16)
  autofire_extra_slot = 30_PP

SPECIALS:
  T(X) = X*(X+1)/2
  base_cost = Blight3; Lacerate/Mark/Ruin/Slow4; Corrode/Hex/Sundered/Root6; Expose8
  pool_reduction = Challenge 6 / 6*T(2X); Disoriented/Soulburn/Weaken 8 / 8*T(2X)
  blight = TIMED; duration_refresh_not_additive
  root = minimum_Root_2; MR_reduction; no_natural_recovery
  global_per_round_special_application_cap = NONE
  diminish_start_turn = tick_then_natural_recovery_then_decay
  special_negation_before_application = true
  special_only_attack_direct_damage = 0

RUIN:
  immediate_damage = 4 * newly_applied_points; ignores_Armor
  start_of_turn_tick = 4 * current_Ruin_points; ignores_Armor
  price = 4*T(X) (unchanged during playtest)

DAMAGE:
  natural_8_minimum_damage = NONE
  large_pool_threshold = 40_dice_after_damage_negation
  large_pool_value_per_die = 5 (optional)
  maximization_per_die = 8
  floor_above_5 = applies_per_die
  max_total_DR_current_sources = 90_percent

ZONES:
  delivery = RANGED_ONLY
  duration = maintained_per_creator_turn_with_Attack_Action
  affects_creator_and_allies = true
  pp_formula = NONE_BY_DESIGN

BUFFS:
  activate = Preparation_free
  once_per_named_Buff_per_Combat = true
  max_maintained = 1
  combined_buffs = false
  self_armor_evade_sr = +2_per_PL
  special_auras = fourteen_named; caster_exempt
  protective_auras = Armor, Evade, SpellResistance; caster_and_allies; enemies_never
  protective_aura_value = 2PL-1 (PL1-8, r2m), 2PL-3 (PL9-16, r3m)
  same_value_active_buff_bonus_stacking = highest_only

REACTIONS:
  basic_reactions = Guard, DiveForCover
  basic_evade = NONE
  reaction_special_increase = NONE

PASSIVES:
  count = 28
  combined_passives = false
  slots_by_MR = 1,2,3,3,4,4,5,6

STONES:
  ranks = 4
  normal_cost = 1/3/7/15
  premium_cost = 2/6/12/20
  premium = ExtraAttack, Parry, Crit, DamageNegation, SpecialBoost, DamageReduction, NotATarget, Phasing

ARTIFACTS:
  level_to_PL = 1-3:4, 4-6:10, 7-9:16, 10:Awakening
  max_bound = 4

SPELLS:
  spell_delivery = eligible_Ranged_Active
  spell_base_TN = used_PL * 4
  specialless_spell_count_cap = MR

MENTAL:
  Mind_Illusion, Mind_Probe, Mental_Control = qualitative_no_PP_formula
  Mental_Attack = RETIRED
```

---

## 22. Publication Claims This Framework Supports

The following claims are justified by the framework:

- Power construction uses explicit target curves and published component costs.
- Powers cannot silently gain multiple full budgets. Historical Combined Buff/Passive templates are **not selectable** in v0.9.9.6.
- Multi-target coverage and premium timing are explicitly constrained or priced.
- Closed premium mechanics cannot be freely attached as cheap riders.
- Technical Reference and separately purchased instance identity remain distinct; duplicate sources do not grant extra Actions or bypass global charges.
- Many numeric Special rows use a reproducible triangular catalogue cost function, subject to dedicated prices and class distinctions (e.g. Timed Blight).
- Designers can independently recalculate every **direct** catalogue row; Zones, Images and Mental Powers use fixed printed values by design.
- Encounter calibration is deliberately separated from Power normalization.

The following stronger claims are **not** established by PP math alone:

- every build is equally strong in every situation;
- every party composition performs identically;
- every Special combination has identical tactical value;
- every Artifact combination has been exhaustively solved;
- every high-MR encounter has been empirically calibrated;
- mathematical normalization removes the need for playtesting.

The intended public position is therefore:

> **Destroyed Faith exposes the arithmetic used to normalize its mechanical building blocks. Direct catalogue values are traceable to published tables; qualitative subsystems (Zones, Images, Mental Powers) use fixed printed values, and new combat decisions still require playtesting before any universal balance claim.**

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
- the Attack Action economy or Power reuse rules;
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

Do not silently edit a formula without updating examples that depend on it. Rulebook, Foundry runtime, current Actor-item levels and preview UI must be validated **together**, not independently declared correct.

---

## 24. Decision log and implementation status

### 24.1 Implemented in the v0.9.9.6 rules documents (Foundry migration pending)

- **Repeatable Actives:** every Active may be used again with each legal Attack Action.
- **Basic Attack removed:** no default damage attack; Combat Maneuvers remain.
- **Immediate Ruin damage:** 4 × newly applied points; price unchanged during playtest.
- **Mental Attack retired**; Mind Illusion, Mind Probe and Mental Control remain.
- **Damage-plus-Special hybrids retired**; Special-only families per Special.

### 24.2 Decisions of 2026-11-23

- **Basic Reaction Evade removed.** It equalled a maximum-PL Reaction: Evade for free.
- **Natural-8 minimum damage removed.**
- **Large Damage Pools:** optional 5 per die from 40 dice after Damage Negation.
- **Protective Auras added** (Armor, Evade, Spell Resistance only) with the same-value stacking rule.
- **Split Attack targets:** 2 / 3 / 4 at PL 1–6 / 7–12 / 13–16.
- **+5 PP tolerance** formalized; AoE, Autofire, Split, AoE Cleanse, AoE Restoration, Barrier and Reaction: Cleanse rows refilled under the monotonicity rule.
- **Unified radius table** (4 m = 80 PP) for Support AoE and Barrier.
- **Otherworld Reflex** (Elorian Stride) aligned to PL 4/10/16.
- **Lor-Keth's Titanstorm Staff** completed (Levels 1–10 and Staff Base).
- **Tactical Choices** (All-Out Attack, Regular Attack Action Transfer) finalized; Shared Free Raises live under the Intellect Stone Ability.
- **Persistent Zones** keep their printed rules and values; no PP formula.

### 24.3 Foundry migration checklist

Synchronize runtime data, previews and Actor items with the decisions above. Migrate existing PCs, NPCs, token Actors and Artifact grants only after a dry run, backup and GM review; never silently delete or refund owned Powers.

---

## Appendix A - Active catalogue taxonomy and technical identity (v0.9.9.6)

The exact current Actives catalogue owns all names and rows; this appendix is a taxonomy, not an additional catalogue to maintain manually.

- **Damage Attacks:** Melee Single Target Attack, Ranged Single Target Attack; Melee AoE Attack, Ranged AoE Attack; Melee Split Attack, Ranged Split Attack; Ranged Autofire.
- **Special-only direct attacks:** for every one of the 14 eligible Specials, Melee Single Target, Ranged Single Target, Melee AoE and Ranged AoE **as separate catalogue entries**. The 14 printed names are Blight, Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Root, Ruin, Slow, Soulburn, Sundered and Weaken.
- **Limited Damage:** dedicated Limited Melee/Ranged Single Target and Limited Melee/Ranged AoE attacks, shared Limited charge.
- **Damage Transfer:** separate Melee/Ranged single-target dedicated attacks.
- **Pure forced movement:** Melee and Ranged Push/Pull.
- **Support:** Melee/Ranged Single Target Restoration, Melee/Ranged AoE Restoration; Melee/Ranged Single Target Cleanse, Melee/Ranged AoE Cleanse.
- **Mental utility:** Mind Illusion, Mind Probe, Mental Control. **Mental Attack is retired.**
- **Constructs and terrain:** Ranged Barrier and Ranged Power Image.

**No longer selectable in the Active catalogue:** mixed `Damage + Special` Power tiers; pure HP Heal Actives; Mental Attack. For legacy Foundry items, perform a reviewed migration, not silent deletion.

**Other Power categories:** the current, exact Active Buff, Passive, Reaction, Movement and Artifact catalogues own their own legal names. Earlier appendix lists are not copied here because several historical entries were retired or renamed in Core v0.9.9.6.

---

## Appendix B - Audit Red Flags

Stop implementation or flag a source conflict if any of the following appears without an exact current authoritative catalogue entry:

- inferred Power Level or Keep from unrelated MR/PL, or generic Damage Pool from Attribute + Weapon Dice;
- restoring the historical **global 4 × MR Special Application Limit**;
- treating **Blight** as stack-additive Diminishing instead of Timed, or **Root** as ordinary Diminishing;
- resurrecting retired **Damage + Special** templates, **Mental Attack**, generic HP Heal Actives or a **Basic Attack**;
- reintroducing a **Basic Evade Reaction** or the **natural-8 minimum damage**;
- generating different Special ranks from a shared tier-default preview rather than the chosen Special's printed PL row;
- giving a Special-only Attack direct Weapon, Spell Focus, Stone, Buff or Damage Raise damage;
- failing to add matching delivery damage **once** to the shared Damage AoE roll;
- treating player Split Attack as shared/halved damage, or using 2 targets at PL 7+;
- treating Autofire as AoE, forbidding repeat targets, or skipping its cumulative +4 TN steps;
- any progression in which a paid axis (damage, Radius, Range, targets, Special value) decreases at a higher PL;
- pricing Zones with a PP formula, adding Melee Zones, or putting Root into a Zone;
- exempting allies or the creator from Persistent Zones, or making Special Auras hit their own caster;
- Protective Auras affecting enemies, offensive or premium-defense Auras, or stacking two Active Buff bonuses to the same value;
- placing Special-applying Auras under Passives instead of Active Buffs;
- enabling **Combined Passives** or **Combined Active Buffs**;
- requiring every Spell to contain a Special, or assuming Spell Base TN depends on MR;
- charging an Attack Action to activate an Active Buff during Preparation;
- requiring a duplicate purchase to reuse an Active in the same Round;
- auto-merging, refunding or deleting legacy owner Powers before a GM-reviewed migration;
- silently adding unrelated effects just to spend leftover PP.

---

## Appendix C - Outstanding reviews

- `RUIN_BALANCE_REVIEW_PENDING`: immediate Ruin damage is playtested at the unchanged 4 × T(X) price.
- `ABSORPTION_PLAYTEST_PENDING`: Passive/Reaction/Buff Absorption and Temporary Colorless Stones are untested at the table.
- `PROTECTIVE_AURA_PLAYTEST_PENDING`: verify party-wide value; tuning lever is the ally premium.
- `FOUNDRY_MIGRATION_PENDING`: runtime data must be synchronized with the 2026-11-23 documents.
- `LEGACY_ITEM_MIGRATION_PENDING`: legacy owners (Mental Attack, Damage-plus-Special Powers, duplicates) require a GM-reviewed migration decision.

See Section 24 for the decision log.

---

Copyright (c) 2025-2026 Daniel Rodrigo Navarro Melendo. All rights reserved.

Destroyed Faith is in beta development. This framework documents the audited rules state named above and may be updated when primary rules or catalogue values change.

**End of Public Balance Framework**
