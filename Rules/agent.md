# Mastery System – Power & Spell SRD


<!--

MASTERy POWER DESIGN BUNDLE

Version: 1.0

Author: Daniel Rodrigo Navarro Melendo

Purpose: Core reference for balancing and building Powers in the Mastery System.

Update Procedure:

- Keep Target Curves and Modifier Tables in sync with live system.

- All PP math assumes single-target baseline.

- This is the canonical reference for building and pricing Powers.

- Keep target curves and PP tables in sync across future changes.

-->


---

## 0. Agent Mission & I/O-Contract

### 0.1 Deine Rolle

Du bist der **Mastery Design Agent**.
Deine Aufgabe ist es, auf Basis dieses SRD:

- **Powers** (Active, Buff, Passive, Reaction, Movement) zu entwerfen oder zu überarbeiten,
- **Mastery Trees** zu strukturieren,
- **Spell Lists / Schools** zu konstruieren,
- dabei immer die **PP-Kurven**, **Kosten-Tabellen** und **Design-Regeln** dieses Dokuments einzuhalten.

Du **änderst niemals**:

- die Grundannahmen des Systems (Dice Model, Health Bars, Segmente),
- die Ziel-Kurven (PP-Values je Power-Typ),
- die Spell-Grundregeln.

Wenn der User explizit „Hausregel“ oder „Abweichung“ verlangt, markierst du das im Tooltip als
`[Homebrew: deviates from SRD]` und hältst die Änderung so klein und klar wie möglich.

---

### 0.2 Wie du auf Prompts antwortest

Wenn der User dich bittet, eine **Power** zu bauen oder zu ändern:

1. **Bestimme Power-Typ**
   - Active / Active Buff / Movement / Reaction / Passive
   - evtl. Tags: `Spell`, `Charged`, Element, Special (*Ruin*, *Lacerate*, etc.)

2. **Wähle Ziel-PP-Wert**
   - anhand von Power-Typ und Level (siehe „Power Types & Target Curves“).

3. **Zerlege den Effekt**
   - in Bausteine aus der „General Price Cost“-Tabelle, Specials, AoE, Dauer, Attribute usw.
   - passe, bis die Summe der PP in etwa dem Ziel entspricht (±10 %, Capstones ±15 %).

4. **Formatiere den Output**
   - genau **eine** Markdown-Power mit:
     - `<h3>` Titel,
     - Flavor-Zeile,
     - Power-Tabelle (Type, Level, Range, AoE, Special, Effect etc.),
     - Tooltip / Kommentarblock mit kurzer Erläuterung des PP-Rechnens.
   - **Kein zusätzlicher Fließtext**, außer der User bittet ausdrücklich darum.

5. **Sprache**
   - Standard: **Englisch** für alle Regeltexte und Tooltips.
   - Wenn der User explizit Deutsch verlangt, übersetze **nur Flavour & Beschreibungen**, aber lasse
     Keywords (Power-Typen, Tags, PP-Begriffe) möglichst englisch für Konsistenz.

---

### 0.3 Konflikt-Regeln

Wenn eine User-Anfrage den Regeln dieses SRD widerspricht:

- **Bevorzuge immer das SRD.**
- Erkläre kurz im Tooltip, warum du abweichst, und biete eine SRD-konforme Alternative.
- Erfülle klare Stilwünsche (Thema, Optik, Namen) bevorzugt gegenüber mechanischen Wünschen,
  wenn beides nicht gleichzeitig möglich ist.

Beispiele:

User: „Mach mir einen Spell mit Ruin, Slow und Lacerate gleichzeitig als Kernmechanik.“
→ Agent: Reduziert die Anfrage auf 1 Primary Special und höchstens 1 Secondary Special,
und vermerkt im Tooltip:
// SRD: Spell Lists must keep one clear main Special and one optional supporting Special – removed excess core Specials for clarity and balance.

User: „Mach mir einen Spell, der gleichzeitig hoher Burst, starker AoE, Hard Control und lange Dauer hat.“
→ Agent: Reduziert einen oder mehrere Bereiche, damit die Power auf ihrer Zielkurve bleibt,
und vermerkt im Tooltip:
// SRD: The requested effect exceeded the target PP curve by combining too many premium axes at once – reduced damage / area / duration to restore balance.

User: „Mach mir eine Fire School mit Ruin, Blight und Lacerate als gleichwertige Kernmechaniken.“
→ Agent: Behält Ruin als Main Special und wählt höchstens eine unterstützende Sekundärachse,
und vermerkt im Tooltip:
// SRD: Spell Lists should not mix multiple primary Specials – kept one main Special and reduced the rest to preserve a clear school identity.

## 1. Core System Fundamentals


### System Meta (Dice & Economy)


**Action Economy:** 1 Movement • 1 Attack Action • 1 Reaction per round.

**Full Action:** If something requires a Full Action, you spend both your **Movement** and your **Attack Action** on your Turn (you still keep your Reaction).

**Encounter Length (Baseline):** 5–6 Rounds.


---


### **Dice Model**


- **To-Hit Rolls:**

&nbsp; Roll a dice pool (**N k K**) where the number of **kept dice (K)** increases by +1 per Power Level

&nbsp; (e.g., L1 → +1 Keep, L2 → +2 Keep, etc., if defined by the Power).

&nbsp; • +1 Attack Die ≈ 15 PP (see General Modifiers).


- **Damage:**

&nbsp; Add up all **d8 damage dice** — damage does *not* explode.

&nbsp; • Base Weapon Damage: **Attribute** (Might/Agility/etc.) + Weapon Dice.

&nbsp; • Specials (Lacerate, Ruin, etc.) add **separate effects**, not raw damage dice unless stated.


- **Explicit Resistance Checks:**

&nbsp; There is no standalone defensive-roll subsystem.

&nbsp; A Power, hazard, or rule that allows resistance names the Attribute directly:

&nbsp; • **Vitality** for bodily endurance, poison, disease, pain, and physical collapse.

&nbsp; • **Resolve** for soul, corruption, possession, divine pressure, and spiritual force.

&nbsp; • **Intellect** or **Wits** for thought, memory, perception, mental intrusion, and manipulated awareness.

&nbsp; **Might, Agility, and Influence are not default resistance Attributes.**

&nbsp; A successful Attack, Spell, or AoE does not create an automatic second defensive roll unless the specific rule explicitly grants a later Attribute Check.


- **Opposed Checks / Contests:**

&nbsp; Use **Attribute k Mastery** pools; Raises determine margin of success.

&nbsp; • Each **Raise** ≈ +4 TN.


> **Design Note:**

> The dice model assumes that increasing *kept dice* scales stronger than adding flat modifiers.

> Use additional dice for short bursts or conditional effects; reserve flat bonuses for Passives or structural features.


---


### Temporal Segments (Usage Frequency)


Some Powers or s can only trigger or be used once during a defined time segment.

These segments define the *reset window* for limited-use effects.


| **Segment** | **Meaning** | **Refresh Condition** |

|:--|:--|:--|

| **Round** | Once per full Round (after all combatants have taken a Turn). | Refreshes when the next Round begins. |
| **Turn** | Once per creature's individual Turn (your moment in initiative). | Refreshes at the start of your next Turn. |

| **Combat** | Once per combat encounter. | Refreshes when the fight ends. |

| **Day** | Once per day. | Refreshes after a full rest or at dawn. |


Use these segments to cap effects such as *on-kill healing*, *reaction triggers*, or *limited buffs*.

For example:

- *“Once per Combat”* prevents a passive heal from stacking infinitely.

- *“Once per Day”* defines long-rest recovery powers.


> **Design Note — Segment Clarity**

> Always specify **when** and **how** a limit refreshes.

> Use explicit language like *“once per Round”*, *“once per Combat”*, or *“once per Day”*.

> Never use vague phrasing like *“once per scene”* or *“once per encounter”* unless the scene structure is formally defined in your campaign rules.


---


## Combat Rounds and Turns


Combat in Mastery is divided into **Rounds** and **Turns**.


- A **Round** represents a full cycle in which **every creature** in combat has taken a Turn. At the start of each new Round, Initiative is rolled again.

- A **Turn** is your individual moment within that Round. During your Turn, you can move, act, and use Powers.


---


Duration Raises

When a Power or Spell has Duration: Instant, you may extend its duration through Raises on the activation roll.

Each additional Raise increases the duration one category along the Duration Table (Turn → Round → Minute → Hour → Day).


Effects that last longer than 1 Turn usually require concentration or may consume additional resources, at the GM’s discretion.


### Round Structure

1. **Initiative** – Roll at the start of each Round (see below).
2. Determine **Evade Value**.
3. **Start of Each Turn** – Resolve start-of-turn effects.
   - For standard **Diminishing Stacks**, resolve **Tick, then Decay**.
   - For **Triggered Diminishing Effects** (such as **Lacerate**), no damage is dealt at Tick unless the entry says so; they still decay normally at the start of the turn.
4. **Your Turn** – You may take:
&nbsp;  - **1 Movement** (up to your Speed)
&nbsp;  - **1 Attack Action** (Attack, Cast, Special, Use Item)
&nbsp;  - **1 Reaction** (outside your turn, when triggered)
5. **End of Your Turn** – Resolve end-of-turn effects.

---


## 2. Power Types & Target Curves


## Types of Powers


Powers in the Mastery System are divided into **Actives**, **Active Buffs** and **Passives**.

Each type follows different rules for how it is used in combat.


### Movement Powers

Movement Powers replace your normal Movement for the round.

They are used to change **how** you move, **where** you can move, or **what kind of movement path** you may take.

A Movement Power is not an Attack Action, not an Active Buff, not a Reaction, and not a Special-delivery system.

#### Normal Movement Baseline

A normal character can move **10 m** with their normal Movement.

When you use a Movement Power, the listed distance is your **total Movement for that Movement Power**.

It is not added on top of your normal 10 m Movement unless an entry explicitly says otherwise.

#### Movement Pricing Philosophy

Movement Powers are priced by **movement quality**, not by a single universal meter curve.

The same distance has different value depending on how the movement works.

- **Ground movement** is cheapest because it follows normal paths and provokes movement-triggered Reactions normally.
- **Wall Walk** is more expensive than ground movement because it changes usable surfaces, but it still follows a path and provokes normally.
- **Leap** is more expensive than ground movement because it crosses gaps and height, but it still needs a legal arc and landing point.
- **Flight** is more expensive because it ignores many ground-based terrain limits and allows three-dimensional movement.
- **Safe Movement** is more expensive because it prevents movement-triggered Reactions.
- **Teleport** is premium movement because it skips intervening spaces and does not provoke through the path.
- **Burrow** and **Phase Passage** can bypass encounter geometry, so they use strict material rules and hard caps.
- **Trample** is a special offensive Movement case and is limited by path, contact, and once-per-creature rules.

#### Movement Restrictions

Movement Powers may not grant:

- Attack Dice,
- Critical,
- bonus damage to your next attack,
- Penetration,
- Special Application,
- Special Increase,
- Extra Attacks,
- free Attack Actions,
- defensive buffs for the round,
- hard control,
- or Reaction-style damage avoidance.

If a Power’s main payoff is “your next attack gains X,” it is not a Movement Power.

It is an Active Buff, Active Power, or Tree-specific exception.

#### Movement-Triggered Reactions

Movement Powers provoke movement-triggered Reactions normally unless the entry explicitly says otherwise.

Only **Movement: Safe Movement** prevents movement-triggered Reactions by default.

Teleport does not provoke movement-triggered Reactions through the intervening path because it does not move through those spaces.

#### Movement Timing

A Movement Power is used during your Turn as your Movement.

It does not interrupt attacks against you.

It does not function as a last-second dodge.

It does not retroactively cancel a hit.

Last-second repositioning is handled only by **Reaction: Reposition**, not by Movement Powers.

- **Cost:** Replaces your normal Movement.
- **Roll:** Only required if the movement includes a contested traversal check or an explicitly offensive Movement effect.


### Actives

Actives are direct offensive or defensive maneuvers that consume your **Attack Action**.


- **Cost:** 1 Attack Action.

- **Roll:** Attack Roll, Spell Roll, or Contest (depending on effect).

- **Examples:** Weapon strikes, spell blasts, precise shots, shield bashes.


Actives define your immediate offensive output.

They must be clear, impactful, and scale with Mastery Rank.


### Active Buffs

Active Buffs represent **temporary empowerment** of a character, weapon, or ally.


- **Cost:** 1 Attack Action.

- **Roll:** Often none; some require a Spell Roll or Attribute Check if they target unwilling creatures.

- **Duration:** Typically **Mastery Rank Rounds**.

- **Limit:** Only **one Active Buff** can be maintained at a time unless otherwise stated.


Examples include:

- Weapon enchantments

- Temporary armor boosts

- Precision or focus stances

#### Active Buff Governance — Canonical Catalogue Decisions

Active Buffs improve later actions or defensive states.

They do **not** deal damage when activated unless the entry explicitly says so.

A standard Active Buff is either:

- a **Pure Active Buff** with exactly one mechanical axis, or
- a **Combination Active Buff** with exactly two mechanical axes.

A Combination Active Buff uses the normal Active Buff curve.

It does **not** receive a full budget for each axis. Both axes must fit into the same total PP budget.

Levels **1–4** define the structure of the Buff. Levels **5–16** only scale that same structure upward.

Do not add new riders, new Specials, new defensive axes, new offensive axes, or new subsystems at later levels.

Active Buffs may not grant:

- Attack Dice,
- Extra Attacks,
- free Attack Actions,
- Special Application,
- Critical as a rider,
- hidden Movement Powers,
- hard control,
- or unpriced secondary effects.

##### Active Buff Standard Axes

The standard Active Buff catalogue may use these normal axes:

| **Axis** | **Pricing / Structure** | **Notes** |
|:--|:--:|:--|
| **Armor** | 7.5 PP per +1 Armor | self-defense or paid aura variant |
| **Evade** | 5 PP per +1 Evade | self-defense only unless a paid ally/aura entry exists |
| **Refreshing Temporary HP** | 4 PP per 1 HP | restored at start of turn while Buff lasts |
| **Regeneration / Healing** | 4 PP per 1 HP | start-of-turn real HP recovery |
| **Damage** | 15 PP per +1d8 | applies only to qualifying own attacks; no Crit or Special rider |
| **Penetration** | 7.5 PP per Penetration(1) | armor bypass only |

The standard Combination Active Buff catalogue currently supports:

- Armor + Temporary HP
- Evade + Temporary HP
- Temporary HP + Healing
- Armor + Evade
- Damage + Penetration

The following Active Buff combinations are explicitly **not** part of the core catalogue:

- Damage + Critical
- Damage + Special Application
- Attack Dice + anything
- Critical + anything
- Special Overdrive + anything

##### Active Buff Critical Restriction

Critical is a closed offensive Active Buff subsystem.

Critical may only be granted through the dedicated **Active Buff: Critical** entry.

No Active, Passive, Reaction, Movement Power, weapon, Special, rider, aura, item-like effect, or combination entry may grant Critical unless an explicit future SRD exception is added.

Critical may not appear as a secondary rider and may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or filler value.

If a character wants Critical, they must spend their maintained Active Buff slot on **Active Buff: Critical**.

Use this milestone progression for Active Buff Critical:

| **Level Band** | **Effect** |
|:--|:--|
| **1–3** | no effect |
| **4–7** | attacks gain **Critical(1)** |
| **8–11** | attacks gain **Critical(2)** |
| **12–14** | attacks gain **Critical(3)** |
| **15–16** | attacks gain **Critical(4)** |

Unused PP in non-milestone levels remains unused.

Do not fill it with damage, Penetration, Specials, or defense.

##### Active Buff Special Rules

Active Buffs may not apply Specials by default.

An Active Buff may only interact with Specials through **Active Buff: Special Overdrive**.

Special Overdrive may only increase an already existing eligible **Special(X)**.

It never applies a Special by itself, never creates a new Special on an unaffected target, and never refreshes, spreads, copies, transfers, or re-triggers a Special unless a specific entry says otherwise.

A Special is eligible for Special Overdrive only if all of the following are true:

- the Special is written as **Special(X)**,
- the Special uses numeric scaling,
- the Special is not binary,
- the Special is not hard control,
- increasing X by +1 or more is meaningful,
- the Special does not remove or deny an entire turn,
- the Special does not deny all actions,
- the Special does not deny all reactions,
- the Special does not grant or modify Damage Reduction,
- the Special does not grant or modify Phasing.

Common eligible examples include **Blight(X)**, **Corrode(X)**, **Disoriented(X)**, **Expose(X)**, **Hex(X)**, **Lacerate(X)**, **Mark(X)**, **Ruin(X)**, **Slow(X)**, **Soulburn(X)**, **Sundered(X)**, and **Weaken(X)**.

Common ineligible examples include **Stunned**, **Prone**, **Immovable**, **Charm**, **Dominate**, binary **Silenced**, binary **Immobilized**, any Special without **(X)**, any full-turn denial, any full-reaction denial, any effect that modifies **Damage Reduction** or **Phasing**, **Barriers**, **Walls**, **Images**, **Summons**, **Illusion Fields**, and **Persistent Zones**.

Special Overdrive is meant to escalate pressure, not to multiply hard control.

Use this milestone progression for Active Buff Special Overdrive:

| **Level Band** | **Effect** |
|:--|:--|
| **1–3** | no effect |
| **4–7** | first qualifying hit each round increases the chosen existing Special by **+1** |
| **8–11** | first qualifying hit each round increases the chosen existing Special by **+2** |
| **12–14** | first qualifying hit each round increases the chosen existing Special by **+3** |
| **15–16** | first qualifying hit each round increases the chosen existing Special by **+4** |

Special Overdrive affects only one chosen eligible Special.

It may not be combined with Damage, Penetration, Critical, Attack Dice, Extra Attacks, defensive effects, Special Application, or filler value.


### Reactions

Reactions are **instant responses** triggered by specific events during combat.

They represent instinct, reflex, or trained counter-techniques — the art of turning a moment of danger into advantage.


- **Cost:** **Consumes your Reaction for this round** (no Attack action spent).

- **Trigger:** Each Reaction specifies its trigger condition (e.g. *“when hit by a melee attack”* or *“when an ally would take damage”*).

- **Roll:** Usually none. A Reaction only requires a roll if the entry explicitly says so.

- **Limit:** 1 Reaction per round unless another Power explicitly grants an extra Reaction.

- **Timing:** Resolves at the timing stated by the entry. If it modifies an incoming attack or damage instance, it applies only to that triggering event.

- **Duration:** **Instant** unless otherwise stated.


---


| **Level** | **Type** | **Trigger** | **Range** | **AoE** | **Effect** |

|:--:|:--|:--|:--:|:--:|:--|

| **1–X** | *Reaction* | see trigger | Self / 0–8 m | — / Radius | see Description |


---

:

| **Field** | **Meaning / Range** | **Notes** |

|:--|:--|:--|

| **Type** | *Reaction* — triggered outside your turn. | Costs Reaction per round. |

| **Trigger** | Event or condition that activates it. | e.g. *when hit*, *ally attacked*, *enemy enters range*. |

| **Range** | *Self* or *0–8 m*. | Melee reach by default. |

| **AoE** | Optional radius (if affects multiple). | — |

| **Effect** | The reaction’s outcome (e.g. *Block attack*, *Counterstrike*). | — |

#### Reaction Governance — Canonical Catalogue Decisions

Reactions are narrow answers to concrete trigger events.

They may protect, absorb, negate, reposition, or retaliate only in the way the entry states.

Reactions are not a second turn, not hidden Attack Actions, and not mini-Actives.

Reactions do not grant:

- Attack Dice,
- Critical,
- Extra Attacks,
- free Attack Actions,
- full Active Powers,
- Special Application,
- hard control,
- or unpriced offensive riders.

Reactions may not apply Specials by default.

The only core Special-based Reaction is **Reaction: Special Increase**, and it may only increase one already existing eligible **Special(X)** on the triggering creature.

Standard defensive Reaction axes are:

- Armor,
- Evade,
- Temporary HP,
- Damage Reduction,
- Phasing.

Damage Reduction and Phasing are closed premium subsystems and may not be combined with any other Reaction axis.

##### Reaction Catalogue Decisions

The core Reaction catalogue includes these families:

- Pure Defense: Armor, Evade, Temporary HP
- Defensive Combinations: Armor + Temporary HP, Evade + Temporary HP
- Ally Protection: Ally Armor, Ally Evade, Ally Temporary HP
- Closed Premium: Damage Reduction, Phasing
- Counter Effects: Counter Damage, Counter Damage + Push
- Restricted Special: Special Increase
- Restricted Mobility: Reposition

The following Reaction families are not part of the core catalogue:

- Special Application
- Counter Attack / make an attack as a Reaction
- Counter Special
- Crit Reactions
- Attack Dice Reactions
- Hard Control Reactions
- pure Push Reactions
- Ally Push / Guard Push Reactions
- Ally Reposition Reactions
- Evade + Reposition Reactions
- any Reaction that functions as a hidden full Active Power

##### Counter Effect Rules

Counter Effects are retaliatory Reactions, but they are not Attack Actions.

Counter Effects:

- do not make an attack roll,
- cannot generate Raises,
- do not use weapon damage,
- do not trigger on-hit effects,
- do not apply Specials,
- do not increase Specials unless the entry is specifically **Reaction: Special Increase**,
- do not benefit from Critical,
- do not benefit from Active Buff: Damage, Active Buff: Penetration, Active Buff: Critical, or Active Buff: Special Overdrive,
- affect only the triggering creature.

Unless an entry says otherwise, a Counter Effect requires the triggering creature to be within **2 m** and to have **hit you with an attack**.

Counter Damage is fixed Reaction damage and costs **20 PP per 1d8**.

It is intentionally more expensive than normal damage because it does not require an attack roll and happens outside your turn.

The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.

For **Reaction: Counter Damage + Push**, Push is priced as a Reaction rider at **20 PP per 2 m**, capped at **8 m**. Push moves the triggering creature directly away from you if movement is possible.

If the creature cannot be pushed, the damage still applies.

##### Reaction Special Increase

Reaction: Special Increase is the only core Special-based Reaction.

It never applies a Special by itself.

It only increases one already existing eligible **Special(X)** on the triggering creature.

Core rules:

- choose one eligible Special(X) when taking the Reaction,
- the triggering creature must be within **2 m**,
- the triggering creature must hit you with an attack,
- the triggering creature must already be affected by the chosen Special(X),
- the Reaction affects only the triggering creature,
- no Damage, Push, Armor, Evade, Temporary HP, Movement, Critical, Attack Dice, or other rider may be added.

Use this milestone progression:

| **Level Band** | **Effect** |
|:--|:--|
| **1–3** | no effect |
| **4–7** | increase the chosen existing Special by **+1** |
| **8–15** | increase the chosen existing Special by **+2** |
| **16** | increase the chosen existing Special by **+3** |

The eligible and ineligible Special rules are the same as for Active Buff Special Overdrive.

##### Reaction Reposition

Reaction: Reposition is a hard-capped last-resort mobility Reaction.

It is not a dodge, not Evade, not teleportation, not damage prevention, not Disengage by default, and not a hidden Movement Power.

The triggering attack or damage instance resolves first. After it resolves, you may move using normal legal movement up to the listed distance.

This movement does not ignore terrain, walls, creatures, hazards, zones, engagement, or movement restrictions unless another rule explicitly says otherwise.

Use this milestone progression:

| **Level Band** | **Effect** |
|:--|:--|
| **1–3** | no effect |
| **4–7** | move up to **2 m** after the triggering event resolves |
| **8–11** | move up to **4 m** after the triggering event resolves |
| **12–14** | move up to **6 m** after the triggering event resolves |
| **15–16** | move up to **8 m** after the triggering event resolves |

Unused PP in non-milestone levels remains unused.

Do not fill it with Evade, Armor, Temporary HP, Push, Damage, or any other bonus.


### Passives

Passives represent reliable, prepared character identity: ongoing stances, auras, innate traits, or structural advantages that require no action to activate.

You prepare Passives before combat, but only a limited number are active during the fight.

Passives use the Passive curve:

| **Level** | **Target PP** |
|:--:|--:|
| **1** | 20 |
| **2** | 40 |
| **3** | 60 |
| **4** | 80 |
| **5** | 100 |
| **6** | 120 |
| **7** | 140 |
| **8** | 160 |
| **9** | 180 |
| **10** | 200 |
| **11** | 220 |
| **12** | 240 |
| **13** | 260 |
| **14** | 280 |
| **15** | 300 |
| **16** | 320 |

#### Passive Loadout Rules

- **Passive Slots (Loadout):** You may slot up to **8 Passives** as your prepared loadout.
- **Active Limit:** Before the first Initiative roll, choose up to **MR** slotted Passives to be active.
- **No Switching:** You cannot change which Passives are active during combat.
- **No Stacking:** Each Passive category can be chosen only once.
- **Roll:** No roll is required; active Passives apply automatically.
- **Terminology:**
  - **Slotted** = prepared on your sheet
  - **Active** = currently providing its effect

#### Passive Category Rule

Every Passive must belong to exactly one allowed Passive Category.

The **Type** field of a Passive is always only:

> **Type:** Passive

The category is tracked separately as:

> **Category:** Armor
> **Category:** Damage
> **Category:** Special Aura

If a table has only a **Type** column, write only:

> **Passive**

Do not write `Passive, Armor`, `Passive: Armor`, or `Passive, Special Aura` in the Type field.

A Passive Category is a real mechanical classification, not flavor text.
No Passive category may be chosen more than once in the same active loadout.

#### Allowed Passive Categories

| **Category** | **Description** | **Typical Effects / Examples** |
|:--|:--|:--|
| **Armor** | Flat physical mitigation and toughness. | +Armor • conditional Armor • Armor stance • Armor aura |
| **Damage Reduction** | Percentage-based post-Armor mitigation. | 10% / 20% / 30% DR |
| **Evade** | Avoidance and defensive positioning. | +Evade • conditional Evade • Evade aura |
| **Damage** | Pure offensive output. | +Damage dice • conditional Damage |
| **Health** | Structural durability. | additional Health Bars |
| **Temporary HP** | Frontloaded defensive HP buffer. | start-of-combat Temporary HP |
| **Healing** | Recovery and regeneration. | start-of-turn healing • conditional healing |
| **Awareness** | Combat senses and perception replacement. | Combat Sense • sensory replacement • functioning through visual obstruction |
| **Phasing** | Premium hit-negation defense. | ignore limited hits per combat |
| **Special Aura** | The only allowed Passive form that may interact with Specials. | self-centered aura that increases one eligible existing Special(X) by +1 step |

#### Removed Passive Categories

The following categories are no longer valid Passive categories:

- **Attack**
- **Attribute**
- **Roll**
- **Control**
- generic **Special**

These removed categories may not be used as Passive categories in new Tree design.

Passives may not grant:

- permanent Attack Dice,
- permanent Attribute increases,
- Attribute Dice,
- Stones,
- generic Roll bonuses,
- generic Control effects,
- free attacks,
- Extra Attacks,
- passive action-economy effects,
- generic Special support,
- passive Special application,
- or passive hard control.

If a Passive would interact with Specials, it must use the **Special Aura** category and obey the Passive Special Aura rules below.

#### Passive Design Restrictions

- A Passive may never use the **Spell** tag.
- A Passive may never use the **Charged** tag.
- A Passive may never grant an Attack Action, free attack, Reaction, Movement Power, Spell effect, Barrier, Wall, Image, Illusion Field, Summon, or Persistent Zone.
- A Passive may not contain more than two scaling mechanical axes.
- A Passive may not hide an Active effect inside an always-on feature.
- A Passive may not grant **Stunned**.
- A Passive may not create full-turn skip, full-round invulnerability, automatic hard control, or action-economy denial.
- A Passive may not casually combine Armor, Evade, Temporary HP, Healing, Damage Reduction, and Phasing into one package.
- Unused PP may remain unused for premium milestone systems.

Passives may grant:

- flat or conditional **Armor**,
- flat or conditional **Evade**,
- flat or conditional **Damage**,
- structural **Health Bars**,
- start-of-combat **Temporary HP**,
- start-of-turn or conditional **Healing**,
- **Combat Senses** and Awareness functionality,
- dedicated **Damage Reduction**,
- dedicated **Phasing**,
- or **Special Aura** as the only approved Passive-Special interaction.

> **Design Note:**
> Passives must never invalidate Active choices.
> A Passive that grants too much raw damage, defense, control, or action economy can trivialize tactical play.

---

### Passive Pricing Modes

Some Passive categories may be built in either an **unconditional** or **conditional** form.

An **unconditional Passive** applies broadly, reliably, or without meaningful tactical effort.
Because it is always available, it costs **twice** the normal baseline value.

A **conditional Passive** applies only while a clear, meaningful combat condition is met.
Because the player must earn, create, or maintain that condition, it uses the normal baseline value.

| **Passive Mode** | **Cost Modifier** | **Design Meaning** |
|:--|:--:|:--|
| **Unconditional** | x2 baseline cost | Reliable, broad, always-on value |
| **Conditional** | x1 baseline cost | Stronger value, but requires real tactical play |

A condition must be specific, relevant in combat, and possible to fail.

Good conditions include:

- after moving at least **8 m** this turn,
- while you moved **0 m** on your last turn,
- while adjacent to at least one ally,
- while adjacent to at least two enemies,
- while adjacent to exactly one enemy,
- while Hidden or unseen by the target,
- while Wounded or worse,
- while affected by a specific drawback such as Lacerate,
- while protecting an adjacent ally,
- while you ended your turn in melee.

Bad conditions include:

- while in combat,
- while conscious,
- while holding a weapon,
- while not incapacitated,
- while an enemy exists,
- while using this build normally with no real tradeoff.

#### Conditional Passive Categories

The conditional pricing rule may be used for:

| **Category** | **Unconditional Cost** | **Conditional Cost** |
|:--|:--:|:--:|
| **Damage** | 40 PP per +1d6 Damage | 20 PP per +1d6 Damage |
| **Armor** | 15 PP per +1 Armor | 7.5 PP per +1 Armor |
| **Evade** | 10 PP per +1 Evade | 5 PP per +1 Evade |
| **Healing** | 8 PP per 1 HP healed | 4 PP per 1 HP healed |

These categories may also be used for narrow Aura Passives, but Aura Passives must additionally pay for radius.

---

### Combined Passives

A Combined Passive blends exactly two allowed Passive axes into one Passive.

A Combined Passive still occupies one Passive slot.

For loadout and stacking purposes, a Combined Passive counts as **both included Passive categories**.

A Combined Passive:

- combines exactly **two** Passive axes,
- uses the Passive Curve,
- splits its value between both axes,
- may not add a third mechanical axis,
- may not hide an Active effect,
- may not grant free attacks, Actions, Reactions, Movement Powers, Summons, Images, Barriers, Walls, or Persistent Zones.

Combined Passives may use:

- **Armor**
- **Evade**
- **Damage**
- **Health**
- **Temporary HP**
- **Healing**
- **Awareness**

Combined Passives may not use:

- **Damage Reduction**
- **Phasing**
- **Special Aura**
- **Stunned**
- **Attack Dice**
- **Attribute bonuses**
- **generic Roll bonuses**

#### Combined Passive Budget Rule

A Combined Passive uses the normal Passive Curve.

It does **not** receive a full budget for each included axis.

Both included axes must fit into the same total PP budget for that Passive level.

> **Combined Passive Rule:**
> Axis A PP + Axis B PP must be less than or equal to the Passive Curve target.

If there is not enough remaining PP for the second axis at a given level, that axis stays at **0** for that level.

Unused PP may remain unused.

---

### Conditional Combined Passives

A Conditional Combined Passive is a Combined Passive whose value only applies while a meaningful combat condition is met.

It is stronger than an unconditional Combined Passive because the character must earn, create, or maintain the condition.

A Conditional Combined Passive still occupies one Passive slot and counts as **both included Passive categories**.

#### Conditional Combined Passive Budget Rule

A Conditional Combined Passive still uses the normal Passive Curve.

It does **not** receive a full budget for each included axis.

Instead, both included axes must fit into the same total PP budget for that Passive level.

> **Conditional Combined Rule:**
> Conditional Axis A PP + Conditional Axis B PP must be less than or equal to the Passive Curve target.

A Conditional Combined Passive should usually split that budget roughly in half between its two axes.

If there is not enough remaining PP for the second axis at a given level, that axis stays at **0** for that level.

A Conditional Combined Passive may never exceed the Passive Curve target for its level.

#### Conditional Combined Half-Budget Costs

| **Axis** | **Cost Used** |
|:--|:--:|
| **Armor Half** | 7.5 PP per +1 Armor |
| **Evade Half** | 5 PP per +1 Evade |
| **Damage Half** | 20 PP per +1d6 Damage |
| **Healing Half** | 4 PP per 1 HP healed |
| **Temporary HP Half** | 2 PP per 1 Temporary HP |
| **Health Half** | Milestone structural Health progression; no Healthy bar in Combined Passives |
| **Awareness Half** | Milestone Combat Sense progression; not priced as flat dice |

#### Conditional Health / Temporary HP Timing

If a Conditional Combined Passive grants **Temporary HP**, check its condition at the start of combat or at the first listed trigger.

If the condition is true, gain the Temporary HP once.

It does not refresh.

If a Conditional Combined Passive grants **Health Bars**, check its condition at the start of combat.

If the condition is true, gain the listed Health Bars for that combat.

These Health Bars are structural for that combat and do not appear or disappear round by round.

---

### Aura Passives

Aura Passives are Passive effects applied to allies or enemies in an area.

Aura Passives use the same unconditional / conditional cost rule, then add AoE radius cost.

Aura duration is already included because Passives are always active.
Do not add duration cost.

Aura Passives are balanced by:

1. effect cost,
2. radius cost,
3. conditional or unconditional mode,
4. no stacking with the same named aura.

Use standard radius pricing:

| **Radius** | **Cost** |
|:--:|:--:|
| **2 m** | 10 PP |
| **3 m** | 15 PP |
| **4 m** | 20 PP |
| **5 m** | 25 PP |
| **6 m** | 30 PP |
| **7 m** | 35 PP |
| **8 m** | 40 PP |
| **10 m** | 50 PP |

> **Aura Passive Cost Formula:**
> Final Cost = Effect Cost + Radius Cost

Aura Passives may not grant Damage Reduction, Phasing, Stunned, Extra Attacks, Summons, Images, Barriers, Walls, or Persistent Zones.

If an Aura Passive modifies a Special, it must instead use the **Special Aura** category and the Passive Special Aura rules below.

---

### Passive Special Aura

**Special Aura** is the only allowed Passive form that may interact with Specials.

A Passive Special Aura is a self-centered aura that increases one chosen eligible **Special(X)** by **+1 step** while an already affected creature remains inside the aura.

It never applies the Special by itself.

It never refreshes, extends, spreads, triggers, or maintains the Special.

If the creature leaves the aura, the increase immediately ends.

Multiple Special Auras affecting the same Special do not stack.

Only the strongest applicable aura applies.

#### Special Aura Category Rule

A Passive Special Aura uses the following category:

> **Category:** Special Aura

Special Aura is a real Passive category.

It is not a generic Special category and does not allow other Passive Special designs.

#### Eligible Specials for Passive Special Aura

A Passive Special Aura may only affect a Special if all of the following are true:

- the Special is written as **Special(X)**,
- the Special uses diminishing scaling,
- increasing X by +1 is meaningful,
- the Special is not binary,
- the Special is not hard control,
- the Special does not remove a full turn,
- the Special does not deny all actions,
- the Special does not deny all reactions,
- the Special does not grant or alter Damage Reduction or Phasing.

Common eligible examples include:

- **Blight(X)**
- **Corrode(X)**
- **Disoriented(X)**
- **Expose(X)**
- **Hex(X)**
- **Lacerate(X)**
- **Mark(X)**
- **Ruin(X)**
- **Slow(X)**
- **Soulburn(X)**
- **Sundered(X)**
- **Weaken(X)**

Common ineligible examples include:

- **Stunned**
- **Immovable**
- **Immobilized**, if binary
- **Silenced**, if binary
- **Prone**
- **Charm**
- **Dominate**
- any Special without **(X)**

#### Special Aura Restrictions

A Passive Special Aura may not:

- apply a Special,
- add a Special to an attack,
- add a Special to all damage,
- increase more than one Special,
- increase all Specials,
- increase Specials globally,
- affect Specials outside its aura,
- refresh a Special,
- extend a Special duration,
- spread a Special,
- trigger a Special again,
- maintain a Special after it would normally end,
- affect Stunned,
- affect Immovable,
- affect binary Specials,
- affect hard control,
- affect full-turn denial,
- affect Damage Reduction,
- affect Phasing,
- affect Barriers, Walls, Images, Summons, Illusion Fields, or Persistent Zones.

#### Special Aura Cost Rule

A Passive Special Aura always grants exactly **+1 step** to one chosen eligible **Special(X)**.

It never scales the Special bonus beyond +1.

Scaling is handled through aura radius only.

Passive Special Aura Core = **80 PP**.

Final cost:

> **Final Cost = 80 PP + Radius Cost**

Use the Special Aura radius-cost table below.

The aura is always centered on the user.

#### Special Aura Radius Costs

| **Radius** | **Radius Cost** |
|:--:|--:|
| **2 m** | 0 PP |
| **3 m** | 20 PP |
| **4 m** | 40 PP |
| **5 m** | 60 PP |
| **6 m** | 100 PP |
| **7 m** | 160 PP |
| **8 m** | 240 PP |

#### Passive Special Aura Progression

<h3 id="passive-special-aura">
  Passive: Special Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      CATEGORIES<br>
      Special Aura<br><br>
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Passive Special Aura Core = 80 PP<br>
      The aura always grants only +1 step to one chosen eligible Special(X).<br>
      Scaling is primarily radius-based.<br><br>
      RADIUS COSTS<br>
      2 m radius = 0 PP<br>
      3 m radius = 20 PP<br>
      4 m radius = 40 PP<br>
      5 m radius = 60 PP<br>
      6 m radius = 100 PP<br>
      7 m radius = 160 PP<br>
      8 m radius = 240 PP<br><br>
      CALCULATION<br>
      L1 → no effect = 0 PP below 20 target<br>
      L2 → no effect = 0 PP below 40 target<br>
      L3 → no effect = 0 PP below 60 target<br>
      L4 → +1 Special Aura, 2 m radius = 80 + 0 = 80 PP<br>
      L5 → +1 Special Aura, 3 m radius = 80 + 20 = 100 PP<br>
      L6 → +1 Special Aura, 4 m radius = 80 + 40 = 120 PP<br>
      L7 → +1 Special Aura, 5 m radius = 80 + 60 = 140 PP<br>
      L8 → +1 Special Aura, 5 m radius = 80 + 60 = 140 PP below 160 target<br>
      L9 → +1 Special Aura, 5 m radius = 80 + 60 = 140 PP below 180 target<br>
      L10 → +1 Special Aura, 6 m radius = 80 + 100 = 180 PP below 200 target<br>
      L11 → +1 Special Aura, 6 m radius = 80 + 100 = 180 PP below 220 target<br>
      L12 → +1 Special Aura, 6 m radius = 80 + 100 = 180 PP below 240 target<br>
      L13 → +1 Special Aura, 7 m radius = 80 + 160 = 240 PP below 260 target<br>
      L14 → +1 Special Aura, 7 m radius = 80 + 160 = 240 PP below 280 target<br>
      L15 → +1 Special Aura, 7 m radius = 80 + 160 = 240 PP below 300 target<br>
      L16 → +1 Special Aura, 8 m radius = 80 + 240 = 320 PP<br><br>
      NOTES — Choose one eligible diminishing Special(X) when you take this Passive. This aura never applies, refreshes, extends, spreads, or triggers the Special. It only increases the chosen Special by +1 step while an already affected creature is inside the aura. This cannot affect Stunned, Immovable, hard control, binary Specials, Damage Reduction, Phasing, Barriers, Walls, Images, Summons, Illusion Fields, or Persistent Zones.
    </span>
  </span>
</h3>

Choose one eligible diminishing **Special(X)** when you take this Passive.

While a creature inside your aura is already affected by that Special, increase that Special by **+1 step**.

This aura does not apply the Special by itself.

This aura does not refresh, extend, spread, trigger, or maintain the Special.

If the creature leaves the aura, the increase immediately ends.

Multiple Special Auras affecting the same Special do not stack.

Only the strongest applicable aura applies.

| **Level** | **Type** | **Category** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--:|:--|
| **1** | Passive | Special Aura | Self | — | Permanent | — |
| **2** | Passive | Special Aura | Self | — | Permanent | — |
| **3** | Passive | Special Aura | Self | — | Permanent | — |
| **4** | Passive | Special Aura | Self | 2 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **5** | Passive | Special Aura | Self | 3 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **6** | Passive | Special Aura | Self | 4 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **7** | Passive | Special Aura | Self | 5 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **8** | Passive | Special Aura | Self | 5 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **9** | Passive | Special Aura | Self | 5 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **10** | Passive | Special Aura | Self | 6 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **11** | Passive | Special Aura | Self | 6 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **12** | Passive | Special Aura | Self | 6 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **13** | Passive | Special Aura | Self | 7 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **14** | Passive | Special Aura | Self | 7 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **15** | Passive | Special Aura | Self | 7 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |
| **16** | Passive | Special Aura | Self | 8 m radius | Permanent | Chosen eligible **Special(X)** gains **+1 step** while affecting a creature inside the aura. |

---

#### Formatting Rule (Homebrewery Output)

- Passives are listed in the same table format as Actives, but with **Type: Passive**.
- If category tracking is required in the table, add a separate **Category** column.
- Do not put Passive categories into the Type field.
- Each rank’s effect is placed in the **Effect** column, 1 row per rank.

> **Design Note — Two-Axis Rule for Passives**
> Each Passive should combine **no more than two linear effects** that scale together across its levels.
> Keep the design focused: choose one primary and one secondary mechanical axis only when the category explicitly permits it.
> Avoid adding a third distinct modifier unless it replaces one of the two axes or the Passive is a capstone.
> Removed categories such as Attack, Attribute, Roll, and Control must not be reintroduced as secondary axes.
> In short: one core effect defines the Passive — the second supports it. Never build “three-in-one” passives.

---


## Power Tags


### Tag: Charged


“Charged” indicates a **limited-use** Power that refreshes on a defined segment (Round / Combat / Day).


- **Usage:** 1/Segment (as specified).

- **Effect:** Allows over-curve effects in exchange for reduced frequency.


#### Converting Stones into Charges (Out of Combat)


You may convert **Stones** or similar meta-resources into **Charges**:


- 1 Stone → 1 Charge of a specified Power.

- Charges are tracked separately and consumed on use.

- Out of combat, characters may perform rituals or preparations to bind Stones into Charges.


Design intent: Charged Powers can be priced **slightly above** the normal PP curve due to their limited use.


---


### Tag: Spell


“Spell” indicates:


- Uses **Spellcasting rules** (Attribute k Mastery, TN, Raises for Range/Radius/Duration).

- May interact with **Spell-only effects**, such as dispels, counters, or School-specific bonuses.


Spell-tagged Powers must follow the **Spell List Design Guide** for balance and structure.


---


### Powers


> *“Power is balance — every effect carries a weight.”*

> Use these approximate **Action Point (PP)** values when designing or tuning Powers and Effects.

> They represent the internal balance scale of the power curve which depends on the type of Power.


---

:

### Power Types & Target Curves

Every Power follows a design curve based on its scope, timing, and impact.
The **target PP values** define how strong an effect should feel at each tier.

| **Power Type** | **Target Power Curve (PP)** | **Description** |
|:--|:--:|:--|
| **Active (Attack / Hostile)** | **30 / 60 / 90 / 120** | Direct offensive actions — weapon strikes, blasts, hostile debuffs, heals, cleanses, and other immediate effects resolved through your Attack Action. |
| **Active Buff** | **40 / 70 / 100 / 130** | Temporary boosts, wards, stances, or empowered states that last for a duration and enhance later actions. |
| **Movement** | **quality-based / hard-capped** | Reposition and traversal tools. Movement uses type-specific pricing and caps instead of one universal linear PP curve. |
| **Reaction** | **20 / 40 / 60 / 80** | Out-of-turn responses such as parries, counters, redirects, blocks, punish triggers, or instant defensive answers. |
| **Passive** | **20 / 40 / 60 / 80** | Always-on effects that define a character’s nature, baseline combat identity, or prepared combat stance. |

#### Power Progression Beyond Level 4

The standard Power curves define the baseline progression pattern for Levels **1–4**.

These values are not separate milestone bands.
They establish the scaling logic of the Power.

From **Level 5 onward**, Powers continue to scale by extending the same curve upward.

No new progression model is introduced after Level 4.

This means:
- the Power keeps the same structure,
- the same components,
- and the same internal ratio established at Levels 1–4,
- while its total PP budget continues to rise with level.

A Power does **not** gain a new axis, a new rider, a new subsystem, or a new design twist at later levels unless the user explicitly changes the design.

---

#### Linear Continuation Rule

Use the same PP increase per level that the Power Type already establishes at Levels 1–4.

| **Power Type** | **Per-Level Progression** |
|:--|:--:|
| **Passive** | **+20 PP per level** |
| **Reaction** | **+20 PP per level** |
| **Active** | **+30 PP per level** |
| **Active Buff** | **+30 PP per level** |

This creates the following default full progressions:

- **Passive:** 20 / 40 / 60 / 80 / 100 / 120 / 140 / 160 / 180 / 200 / 220 / 240 / 260 / 280 / 300 / 320
- **Reaction:** 20 / 40 / 60 / 80 / 100 / 120 / 140 / 160 / 180 / 200 / 220 / 240 / 260 / 280 / 300 / 320
- **Active:** 30 / 60 / 90 / 120 / 150 / 180 / 210 / 240 / 270 / 300 / 330 / 360 / 390 / 420 / 450 / 480
- **Active Buff:** 40 / 70 / 100 / 130 / 160 / 190 / 220 / 250 / 280 / 310 / 340 / 370 / 400 / 430 / 460 / 490

> **Movement Exception:** Movement Powers do not use one universal linear continuation curve. Use the Movement Catalogue Governance and the movement-type pricing table instead. Movement is balanced by movement quality, total distance, and hard caps.

---

#### Design Rule

Levels **1–4** establish what the Power is.

Levels **5–16** only scale that same Power upward.

Do not:
- add a new mechanic at higher levels,
- replace the original structure,
- introduce a new rider,
- or change the Power into a different pattern.

If a Power starts as:
- Armor only,
- Evade only,
- Armor + Evade,
- Healing only,
- or any other fixed structure,

then that same structure continues upward for the rest of its progression unless the design is intentionally rewritten.

---

#### Exception

Only explicit SRD exceptions may break this rule.

At present, **Damage Reduction** is such an exception, because it is a closed premium subsystem with separate hard rules.---

### SRD Pricing Rules

Use these rules to keep every Power, Spell, and tooltip **consistent** and to avoid hidden free value.

---

#### 1) Core Curves (Target PP)

Use the curve that matches the Power type.

- **Active (Attack / Hostile):** **30 / 60 / 90 / 120 PP**
- **Active Buff:** **40 / 70 / 100 / 130 PP**
- **Movement:** **quality-based / hard-capped** (see Movement Catalogue Governance)
- **Reaction:** **20 / 40 / 60 / 80 PP**
- **Passive:** **20 / 40 / 60 / 80 PP**

> **No Multipliers by Default.**
> Price additively. Only apply multipliers if the SRD explicitly says so.

---

#### 2) Damage / Healing

- **+1d8 Damage** = **15 PP**
- **+1d8 Healing** = **15 PP**

If healing or damage is **conditional** (for example, only against a certain target state), you may apply a small discount such as **×0.95** only if the limitation is real and meaningful in play.

---

#### 3) Range (Baseline Steps)

Range is **never free** unless the Power explicitly says **Touch** or **Self**.

Use these additive steps:

- **8 m** = **+0 PP**
- **12 m** = **+5 PP**
- **16 m** = **+10 PP**
- **20 m** = **+15 PP**

If a Power starts at **12 m** baseline, treat **12 m** as **+0**, then **16/20/24 m** as **+5 / +10 / +15 PP**.

---

#### 4) AoE (Radius)

AoE is **never free** unless the SRD explicitly grants a fixed AoE without cost.

**Default pricing:**
- **+2 m Radius** = **+10 PP**
  → Radius **2 / 4 / 6 / 8 / 10 m** = **10 / 20 / 30 / 40 / 50 PP**

**Odd radii** can be interpolated:
- **+1 m Radius** ≈ **+5 PP**
  → Radius **3 / 5 / 7 / 9 m** = **15 / 25 / 35 / 45 PP**

---

#### 5) Zones and Duration

If the Power creates an **AoE that persists across turns**, duration must be priced.

- **+1 additional round** = **+5 PP**

> For most zones, keep baseline durations short (**1–3 rounds**).
> If you want longer duration, pay for it or gate it behind Raises.

---

#### 6) Damage Reduction


### Special Effect Cost Chapters

The following chapters define the pricing of the system’s standard Special Effects.
Use them as the default source of truth when building Powers, Trees, and Spell Schools.


### Damage Reduction (DR) Pricing & Rules

Damage Reduction is a separate defensive axis and must be priced more aggressively than flat Armor.
Unlike Armor, DR scales automatically with larger incoming hits and therefore becomes disproportionately stronger at higher damage values.

Because of this, DR is not treated as a free-standing linear stat.
Instead, it follows a gated structure:

- **Passive DR** defines the base DR value.
- **Active Buff DR** may only increase an existing DR value.
- **Reaction DR** may only increase an existing DR value for the triggering attack.

> **Core Rule:**
> Without a **Passive DR** source, a character’s DR is always **0%**.
> Active Buffs and Reactions cannot grant DR on their own; they only increase an already existing DR value.

> **Armor Interaction:**
> Damage Reduction is always applied **after Armor**.
> A character benefiting from this DR system may not benefit from **physically worn armor** or **shields** that grant Armor value.

---

#### Passive DR Costs

A Passive may establish the character’s base DR.

| **DR Value** | **Cost** |
|:--|--:|
| **10% DR** | **60 PP** |
| **20% DR** | **160 PP** |
| **30% DR** | **300 PP** |

#### Passive DR Caps

- A Passive may grant up to **20% DR** by **Level 8**.
- A Passive may grant up to **30% DR** by **Level 15+**.

A Passive is the required entry point into the DR axis.
If a character does not have a Passive DR source, all Buff- and Reaction-based DR bonuses are ignored.

---

#### Active Buff DR

An Active Buff may increase existing DR by **+10%**.

This bonus never creates DR on its own and only enhances a DR value granted by a Passive.

| **Total DR Supported** | **Cost** |
|:--|--:|
| **up to 20% total DR** | **130 PP** |
| **Level 8+: up to 30% total DR** | **250 PP** |
| **Level 12+: up to 40% total DR** | **360 PP** |
| **Level 15+: up to 50% total DR** | **450 PP** |

#### Active Buff DR Rules

- An Active Buff may never add more than **+10% DR**.
- The Buff only raises the character’s current DR value.
- The Buff cannot raise DR beyond the cap allowed by its level band.

---

#### Active Buff DR Progression — Milestone Rule

Damage Reduction granted through an **Active Buff** does **not** follow a normal linear per-level progression.

Instead, Active Buff DR uses **hard milestone bands**.

This is intentional.

Damage Reduction is a premium defensive axis and must not be treated like Armor, Evade, Temporary HP, or Healing.
Because of this, an Active Buff that increases DR does **not** continuously scale every level and does **not** spend leftover PP on secondary bonuses.

---

#### Core Rule

An Active Buff that grants DR:

- may **never** create DR on its own,
- may only increase **existing Passive DR**,
- may **never** add more than **+10% DR**,
- may **never** exceed its supported **total DR cap**,
- and may contain **no secondary defensive axis** unless a rule explicitly says otherwise.

This means:
- no Armor rider,
- no Evade rider,
- no Temporary HP rider,
- no Healing rider,
- no filler value of any kind.

If a character wants DR scaling through an Active Buff, that DR increase is the **entire package**.

---

#### Milestone Progression

Use the following progression for Active Buff DR:

| **Level Band** | **Effect** |
|:--|:--|
| **1–3** | no effect |
| **4–7** | increase existing Passive DR by **+10%**, up to **20% total DR** |
| **8–11** | increase existing Passive DR by **+10%**, up to **30% total DR** |
| **12–14** | increase existing Passive DR by **+10%**, up to **40% total DR** |
| **15–16** | increase existing Passive DR by **+10%**, up to **50% total DR** |

---

#### Design Rule

Active Buff DR is a **milestone defense**, not a smooth filler progression.

Do **not** attempt to:
- fill unused PP with other stats,
- attach a second defense line,
- or make the buff “look prettier” by adding side-bonuses.

If the next DR band has not yet been reached, the level simply grants **no additional DR benefit**.

That is correct by design.

---

#### Usage Note

This rule exists to preserve the identity of Damage Reduction as a rare, high-commitment defensive path.

- **Armor** scales linearly.
- **Evade** scales linearly.
- **Temporary HP** scales linearly.
- **Healing / Regeneration** scales linearly.
- **Damage Reduction does not.**

Damage Reduction always uses milestone thresholds instead of smooth per-level value distribution.

#### Reaction DR

A Reaction may increase existing DR by **+10%**, but only against the **triggering attack**.

This is a peak-defense tool and does not apply for the round, the turn, or any later attacks.

| **Total DR Supported** | **Cost** |
|:--|--:|
| **Level 4+: up to 30% total DR** | **80 PP** |
| **Level 8+: up to 40% total DR** | **160 PP** |
| **Level 12+: up to 50% total DR** | **240 PP** |
| **Level 15+: up to 60% total DR** | **300 PP** |

#### Reaction DR Rules

- A Reaction may never add more than **+10% DR**.
- The bonus applies only to the **current triggering attack**.
- It does not persist for the round or until the next turn.
- The Reaction cannot raise DR beyond the cap allowed by its level band.

---

#### DR Design Notes

Damage Reduction must remain a committed build path.

A character reaches meaningful DR only by combining:
- a **Passive** as the base layer,
- an **Active Buff** as a temporary reinforcement,
- and optionally a **Reaction** as a one-hit peak-defense spike.

This structure is intentional.

It ensures that:
- **10% DR** is a meaningful defensive layer,
- **20% DR** is a major defensive commitment,
- **30% DR** is already a high-end player value,
- and **40–60% DR** only appear through expensive stacking of multiple gated sources.

DR is therefore allowed to exist at high values, but high values must never be efficient, free-standing, or easy to maintain.
---


#### Damage Reduction Exclusivity Rule

Damage Reduction is a closed defensive subsystem.

Only the following three Power lines may ever grant, increase, or otherwise enable Damage Reduction:

1. **Damage Reduction (Passive)**
2. **Unyielding Shell (Active Buff)**
3. **Unyielding Intercept (Reaction)**

No other Passive, Active, Active Buff, Reaction, Movement Power, Spell, Special, rider, aura, item-like effect, or combination entry may grant Damage Reduction, increase Damage Reduction, or simulate Damage Reduction under a different name.

This restriction is intentional.

Damage Reduction is already a premium defensive axis and must remain:
- rare,
- highly committed,
- tightly capped,
- and structurally isolated from other defensive scaling paths.

Because of this:

- Damage Reduction may not appear as a secondary rider.
- Damage Reduction may not appear in combination buffs.
- Damage Reduction may not be bundled with Armor, Evade, Temporary HP, Healing, or any other filler value unless an explicit SRD exception is added later.
- If a build wants Damage Reduction, it must use the dedicated Passive, the dedicated Active Buff, and the dedicated Reaction only.

> **Design Note:**
> Damage Reduction is already strong enough.
> It must never become a casual side-benefit inside another defense package.


### Phasing Pricing & Rules

Phasing is a separate premium defensive subsystem.

Phasing does not reduce damage, increase Armor, increase Evade, grant Temporary HP, or restore Health.
Instead, it allows a character to **ignore a limited number of incoming hits entirely**.

A phased hit is treated as if it failed to meaningfully connect.
The hit deals no damage and applies no on-hit rider, unless an effect explicitly says it bypasses Phasing.

---

#### Core Rule

Without a **Passive Phasing** source, a character has **no Phasing**.

Active Buffs and Reactions may not create Phasing on their own.
They may only increase or reinforce an already existing Passive Phasing value.

Phasing is always tracked as **ignored hits**.

It does not grant:
- Armor
- Damage Reduction
- Evade
- Temporary HP
- Healing
- round-based invulnerability

---

#### Passive Phasing Costs

A Passive may establish the character’s base Phasing value.

| **Phasing Value** | **Cost** |
|:--|--:|
| **Ignore 1 Hit** | **80 PP** |
| **Ignore 2 Hits** | **160 PP** |
| **Ignore 3 Hits** | **300 PP** |

These values are intentionally premium.

Ignoring a hit entirely is one of the strongest defensive effects in the system and must consume the full Passive budget of its level.

No secondary bonus may be added to a Passive Phasing line.

---

#### Passive Phasing Caps

- A Passive may grant **Ignore 1 Hit** by **Level 4**.
- A Passive may grant **Ignore 2 Hits** by **Level 8**.
- A Passive may grant **Ignore 3 Hits** by **Level 15+**.

A Passive is the required entry point into the Phasing axis.
If a character does not have a Passive Phasing source, all Buff- and Reaction-based Phasing bonuses are ignored.

---

#### Tracking Rule

Phasing is tracked per combat.

A character with Passive Phasing gains a limited number of **Phasing charges** for the combat.
Each charge lets them ignore **one hit** against them.

Example:
- **Phasing(1)** = ignore the next **1** hit this combat
- **Phasing(2)** = ignore the next **2** hits this combat
- **Phasing(3)** = ignore the next **3** hits this combat

Each ignored hit consumes **1 Phasing charge**.

When all Phasing charges are consumed, the character has no further Phasing protection unless another Phasing effect explicitly grants an additional ignored hit.

---

#### Design Restrictions

Phasing must remain a committed build path.

Because of this:

- Phasing may not appear as a secondary rider.
- Phasing may not be bundled with Armor, Damage Reduction, Evade, Temporary HP, Healing, or any other filler value.
- Phasing may not create full-round or full-turn invulnerability by default.
- If a build wants Phasing, it must use the dedicated Passive, dedicated Active Buff, and dedicated Reaction only.

> **Design Note:**
> Phasing is an extreme defensive advantage.
> It must always consume the full value of the effect that grants it.


#### Phasing Exclusivity Rule

Phasing is a closed defensive subsystem.

Only the following three Power lines may ever grant, increase, or otherwise enable Phasing:

1. **Ghostform (Passive)**
2. **Ghost Mantle (Active Buff)**
3. **Ghost Slip (Reaction, One-Time-Use)**

No other Passive, Active, Active Buff, Reaction, Movement Power, Spell, Special, rider, aura, item-like effect, or combination entry may grant Phasing, increase Phasing, or simulate Phasing under a different name.

This restriction is intentional.

Phasing is already a premium defensive axis and must remain:
- rare,
- highly committed,
- tightly capped,
- and structurally isolated from other defensive scaling paths.


#### Diminishing Effects — Costs

Diminishing effects use **Start PP × T(X)** pricing.

- **T(X) = 1 + 2 + … + X**
- or: **T(X) = X × (X + 1) / 2**

> **Diminishing (X→0):**
> Reapplying the same effect adds stacks (**X → X + Y**) unless stated otherwise.
> At the **start of the affected creature’s turn**, resolve the effect’s Tick (if any), then reduce **X by 1** (**X → X−1**, minimum 0).
> If **X reaches 0**, the effect ends.
> Diminishing effects do not grant an automatic resistance roll.
> They are reduced by normal decay, **Cleanse**, or an explicitly named breaking rule.

| **Effect** | **Start PP** | **X Definition** | **What It Does** | **Cleanse/Dispel** |
|:--|:--:|:--|:--|:--:|
| **Blight(X)** | **3** | X = healing reduction and Stress on Tick | Healing received is reduced by **X**. At Tick, take **X Stress**. | Yes |
| **Corrode(X)** | **6** | X = Armor reduction | Your **Armor** is reduced by **X**. | Yes |
| **Disoriented(X)** | **8** | X = Attack and perception-pool reduction | Reduce Attack Pools and pools used to notice, locate, track, or identify something by **X**, to a minimum of Mastery Rank. | Yes |
| **Expose(X)** | **8** | X = Evade reduction | Your **Evade** is reduced by **X**. | Yes |
| **Hex(X)** | **6** | X = vulnerability to Spell attacks | When hit by a **Spell**, take **+1d8 bonus damage for every 2 Hex**, rounded up. | Yes |
| **Lacerate(X)** | **4** | X = movement damage per trigger | The first time each turn you voluntarily move more than **0 m**, take **X** damage. Moving more than half Speed deals **+X** again; exceeding normal Speed deals **+X** again. | Yes |
| **Mark(X)** | **4** | X = spendable damage-floor value | After a hit, spend any amount of Mark to set the minimum result of each damage die to the amount spent for that damage roll, then reduce Mark by that amount. | Yes |
| **Regeneration(X)** | **3** | X = healing on Tick | At Tick, heal **X HP**. | No |
| **Ruin(X)** | **4** | X = damage on Tick | At Tick, take **X** damage. | Yes |
| **Slow(X)** | **4** | X = Speed reduction in meters | Your Speed is reduced by **X m**. If you do not voluntarily move at least 1 m during your turn, take **X damage** at the end of your turn. | Yes |
| **Soulburn(X)** | **8** | X = dice removed from Wits, Influence, and Resolve pools | Whenever you build a pool based on **Wits**, **Influence**, or **Resolve**, remove **X dice**. | Yes |
| **Sundered(X)** | **6** | X = vulnerability to non-Spell attacks | When hit by a **non-Spell attack**, take **+1d8 bonus damage for every 2 Sundered**, rounded up. | Yes |
| **Weaken(X)** | **8** | X = dice removed from Might, Agility, and Intellect pools | Whenever you build a pool based on **Might**, **Agility**, or **Intellect**, remove **X dice**. | Yes |

#### Pool Reduction Rule — Weaken and Soulburn

Weaken and Soulburn reduce **dice pools**, not Attributes.

They do not reduce:

- the Attribute itself,
- **Keep**,
- Damage Pools,
- derived values,
- resource maximums,
- Health Bars,
- or fixed values created from an Attribute.

They affect any roll whose pool is built from one of their listed Attributes, including Attacks, Powers, Spells, Attribute Checks, Skill Checks, Rituals, Initiative, and other explicitly rolled pools.

**Vitality is not affected by either Special.**

Apply pool construction in this order:

1. Start with the relevant Attribute.
2. Apply Skill training and any full-pool or half-pool rule.
3. Apply flat, situational, and Special-based pool changes, including **Weaken** or **Soulburn**.
4. Apply the current percentage-based **Health Penalty** to the remaining pool.
5. Round Health-Penalty dice loss down.
6. Apply the final **Minimum Pool = Mastery Rank**.
7. Keep remains unchanged unless a separate rule explicitly modifies it.

Example:

- Agility Pool 16 at MR 3
- Weaken(4) → 12 dice
- Injured Health Penalty (−20%) → lose 2 dice
- Final Pool = **10k3**

If multiple flat pool reductions apply to the same roll, add them together before applying the Health Penalty.

#### Weaken and Soulburn Pricing

A lost Attack or action die is valued at approximately **7.5 PP**.
Because Weaken and Soulburn are broad named Specials that can affect several kinds of rolls, their Diminishing baseline is rounded to:

> **Start PP 8**

Both Specials use the same price because each affects exactly three Attributes.

| **X** | **Weaken / Soulburn Cost** |
|:--:|:--:|
| **1** | **8 PP** |
| **2** | **24 PP** |
| **3** | **48 PP** |
| **4** | **80 PP** |
| **5** | **120 PP** |
| **6** | **168 PP** |
| **7** | **224 PP** |
| **8** | **288 PP** |
| **9** | **360 PP** |
| **10** | **440 PP** |

#### Start PP 8 Active-Curve Reference

The following table shows the highest pure Weaken/Soulburn value that fits inside the normal Active curve before adding Range, Damage, AoE, duration, or another rider.

| **Power Level** | **Active Target PP** | **Highest X on Curve** | **Special Cost** | **Unused PP** |
|:--:|:--:|:--:|:--:|:--:|
| **1** | 30 | **2** | 24 | 6 |
| **2** | 60 | **3** | 48 | 12 |
| **3** | 90 | **4** | 80 | 10 |
| **4** | 120 | **5** | 120 | 0 |
| **5** | 150 | **5** | 120 | 30 |
| **6** | 180 | **6** | 168 | 12 |
| **7** | 210 | **6** | 168 | 42 |
| **8** | 240 | **7** | 224 | 16 |
| **9** | 270 | **7** | 224 | 46 |
| **10** | 300 | **8** | 288 | 12 |
| **11** | 330 | **8** | 288 | 42 |
| **12** | 360 | **9** | 360 | 0 |
| **13** | 390 | **9** | 360 | 30 |
| **14** | 420 | **9** | 360 | 60 |
| **15** | 450 | **10** | 440 | 10 |
| **16** | 480 | **10** | 440 | 40 |

This is a pricing reference, not a mandatory Power progression.
A Damage + Pool Reduction template, ranged template, AoE template, or Persistent Zone must pay for those additional components and therefore uses a lower X where necessary.

> **Design Note — Pool Reduction**
> Start PP 8 places a four-die reduction at 80 PP and a six-die reduction at 168 PP.
> This makes the Specials attractive without pricing a persistent multi-round pool penalty like a one-use attack penalty.
> Normal player Powers should use the standard Active curve and may not add unrelated premium riders merely to consume leftover PP.

**Design Note — Lacerate**
**Lacerate(X)** is not a standard start-of-turn damage Tick.
Instead, it deals damage when the affected target voluntarily moves.
Price it at **Start PP 4**, equal to **Ruin(X)**: it is less reliable than a guaranteed Tick, but creates strong positional pressure and can punish extended movement more heavily.

**Design Note — Triggered Diminishing Effects**
Some Diminishing effects do not deal their main effect at Tick.
Instead, they trigger from a listed condition, such as movement or Power use.
These effects still decay by **1** at the start of the affected creature’s turn unless stated otherwise.

---

#### Diminishing PP Lookup Table

*Use this table to determine total PP cost for effects that decay by 1 each round.*
*(PP = Start PP × T(X))*

| **X** | **Start PP 3** | **Start PP 4** | **Start PP 6** | **Start PP 8** |
|:--:|:--:|:--:|:--:|:--:|
| 1 | 3 | 4 | 6 | 8 |
| 2 | 9 | 12 | 18 | 24 |
| 3 | 18 | 24 | 36 | 48 |
| 4 | 30 | 40 | 60 | 80 |
| 5 | 45 | 60 | 90 | 120 |
| 6 | 63 | 84 | 126 | 168 |
| 7 | 84 | 112 | 168 | 224 |
| 8 | 108 | 144 | 216 | 288 |
| 9 | 135 | 180 | 270 | 360 |
| 10 | 165 | 220 | 330 | 440 |

Use this table to calibrate Diminishing effects priced by **Start PP × T(X)**.
Use **Start PP 8** for **Disoriented**, **Expose**, **Weaken**, and **Soulburn**.

---

#### Timed Effects — Costs

Timed effects last for a fixed duration and do **not** use Diminishing pricing.

> **Timed Effects:**
> Timed effects do **not stack** unless an entry explicitly says otherwise.
> Reapplying the same Timed effect refreshes its duration and keeps the **higher X**.
> A Timed effect does not grant an automatic resistance roll.
> If the effect is **Cleanse/Dispel: Yes**, it may be removed by appropriate support effects.

| **Effect** | **Base PP** | **X Definition** | **Duration** | **What It Does** | **Cleanse/Dispel** |
|:--|:--:|:--|:--:|:--|:--:|
| **Prone** | **60 PP** | fixed / binary | Until you stand | You are knocked down. Standing up ends the effect. | No |
| **Stunned** | **120 PP** | fixed / binary hard control | Until target's next turn | The target loses its next **Attack Action** and cannot use **Reactions** until the start of its next turn. Stunned does not remove Movement. | No |

> **Design Note — Timed Effects**
> Use Timed pricing for conditions that apply a **fixed-duration control state** instead of decaying each round.
> Timed effects are generally stronger per point than Diminishing effects because their full value is frontloaded and predictable.

---

#### Until Broken / Until Used Effects — Costs

These effects persist until they are consumed, broken, or their own internal counter reaches 0.

> **Until Broken / Until Used:**
> These effects do **not** use Diminishing decay and do **not** refresh like Timed effects unless an entry explicitly says so.
> Reapplying the same effect usually refreshes duration or adds charges only if the entry permits stacking.

| **Effect** | **Base PP** | **X Definition** | **Duration** | **What It Does** | **Cleanse/Dispel** |
|:--|:--:|:--|:--:|:--|:--:|
| **Brace(X)** | **15 × X PP** | X = number of rounds/end steps it persists | Until X reaches 0 | Your **Speed becomes 0 m**. While Braced, your **Shield value is doubled** for Armor calculation. At the end of each of your turns, reduce **Brace by 1**. | No |
| **Bulwark(X)** | **20 × X PP** | X = number of charges | Until used | As a **Reaction** when hit by an attack you can perceive, reduce the attack’s **final damage by 50%** and consume **1** Bulwark. | No |
| **Crit(X)** | **closed subsystem** | X = Critical rank | Active Buff only | Critical may only be granted by **Active Buff: Critical**. It may not appear as an Active, Passive, Reaction, weapon, Special, rider, or generic Until Used effect. | No |
| **Immovable** | **80 PP** | fixed effect | Buff Duration | You are immune to **Push**, **Pull**, **Prone**, and forced movement while the effect lasts. | No |
| **Root(X)** | **Start PP 6 × T(X)** | X = Break Strength | Until broken | Your Speed becomes **0 m** and you cannot move voluntarily. An Action, Movement Action, or Reaction may be spent on a Vitality Attribute Check against **TN 8 × source MR**; success reduces Root by 1, plus 1 per Raise. | Yes |

> **Design Note — Until Used Effects**
> These effects are priced for stored value: they do nothing until the right moment, then convert into a strong spike of offense or defense.
> Because they are more controllable than normal Timed effects, they should remain narrow and clearly defined.

> **Critical Update:**
> Critical is no longer a general Until Used rider. It exists only as the dedicated **Active Buff: Critical** premium subsystem. Do not place Critical on Actives, Passives, Reactions, weapons, Specials, or combination entries.

---

#### Instant Effects — Costs

Instant effects resolve immediately and do not create ongoing tracking unless the entry explicitly says so.

> **Instant Effects:**
> Instant effects apply once and are resolved immediately on hit, on cast, or on activation.
> They do not stack across time because they leave no ongoing state unless explicitly stated otherwise.
> A successful delivery roll resolves the listed Instant effect; it does not create an automatic second resistance roll.

| **Effect** | **Base PP** | **X Definition** | **Duration** | **What It Does** | **Cleanse/Dispel** |
|:--|:--:|:--|:--:|:--|:--:|
| **Brutal Impact(X)** | **10 × X PP** | X = minimum value per damage die | Instant | Each damage die rolled counts as **at least X**. | No |
| **Penetration(X)** | **7.5 × X PP** | X = Armor ignored | Instant | The attack ignores **X Armor**. | No |
| **Precision(X)** | **15 × X PP** | X = bonus damage dice | Instant | On hit, add **+Xd8** bonus damage. | No |
| **Push(X)** | **2 × X PP** | X = meters pushed | Instant | Push the target **X m** immediately. | No |
| **Pull(X)** | **2 × X PP** | X = meters pulled | Instant | Pull the target **X m** immediately. | No |
| **Smite(X)** | **7.5 × X PP** | X = bonus damage dice vs tagged enemy types | Instant | Add **+Xd8** bonus damage vs **Undead / Fiends**. | No |

> **Design Note — Instant Effects**
> Instant effects are the cleanest additive riders in the system.
> Use them to price immediate payoff such as burst damage, armor bypass, or forced movement, without introducing upkeep or tracking.

---

#### Support / Removal Effects — Costs

Support effects remove, reduce, or end ongoing effects instead of applying a new hostile state.

> **Support / Removal Effects:**
> These effects do not usually apply hostile conditions.
> Instead, they undo, reduce, or cleanse existing effects.
> Unless explicitly stated otherwise, they follow normal targeting and line-of-effect rules of the Power using them.

| **Effect** | **Base PP** | **X Definition** | **Duration** | **What It Does** |
|:--|:--:|:--|:--:|:--|
| **Cleanse(X)** | **4 × T(X) PP** | X = points removed from one eligible ongoing Special | Instant | Reduce **one** eligible ongoing Special by **X**. If the Special reaches **0**, it ends. |
| **Dispel Magic** | special / spell-specific | fixed effect | Instant | End **one** ongoing effect with the **Spell** tag immediately. |

**Cleanse targeting rule:**
A single **Cleanse(X)** always affects exactly **one** eligible ongoing Special on one target. Its X value cannot be divided between multiple Specials.

**Cleanse cost examples:**
- **Cleanse(1)** = 4 PP
- **Cleanse(2)** = 12 PP
- **Cleanse(3)** = 24 PP
- **Cleanse(4)** = 40 PP

> **Design Note — Support Effects**
> Support effects should stay narrow and predictable.
> They are strongest when they answer a known pressure pattern, not when they erase large amounts of hostile setup too cheaply.

---

#### 6) Charged Adders

Charged Powers with a daily, combat, or otherwise limited use window may add **+10 PP** to their target curve if the Power type allows Charged scaling.

For Movement Powers, do **not** use the removed legacy rule “Teleport = 8 PP per meter.” Movement now uses the Movement Catalogue Governance table. Charged Movement may justify a small over-curve distance or a narrow exception, but it must keep the same movement type, restrictions, and hard caps unless explicitly marked as a Tree-specific exception.

---

#### 7) Raises Standard Line (Format)

For every spell or power entry, write Raises as **one comma-separated line**:

**Raises:** **+4 m Range** per **1 Raise**, **+2 m Radius** per **1 Raise**, **Duration +1 round** per **1 Raise**, **Effect +1**, **+1d8 Damage Die**

Adjust this line to the actual Power.

Do not list free upgrades that should instead be paid for in PP.

---

#### 8) Charged Powers

Powers with a daily, combat, or otherwise limited use window may add **+10 PP** to their target curve.

This bonus may be applied to:
- **Active**
- **Active Buff**
- **Movement**
- **Reaction**

It does **not** apply to **Passives**.### Specials DiY


Specials are additional effects that can be triggered alongside an attack.

They represent the unique flavor of a weapon or the advanced techniques unlocked through **Mastery Trees**.


> **Special-Stacking (global):**
> The same Special does **not** apply multiple times from the **same hit** unless an entry explicitly says otherwise; use the **higher value**.
>
> **Diminishing Effects are the exception across separate applications:**
> if the same Diminishing Effect is applied again through a **separate hit or effect**, it stacks additively (**X → X + Y**) unless the entry explicitly says otherwise.


---


## 3. PP Cost Reference (Effects & Specials)


#### General Price Cost used in Powers

| **Effect / Modifier** | **Approx. PP Value** | **Notes / Usage** |

|:--|:--:|:--|

| **+1d8 Damage** | 15 PP | Linear damage increase per die. |

| **+1d8 Heal** | 15 PP | Linear healing increase per die. |

| **+1 Attack Die (Gain)** | legacy / restricted | Do not use as a Passive, Active Buff, or Reaction axis. Only use if an explicit Active template still requires an attack-pool component. |

| **−1 Pool Die (Loss)** | 7.5 PP | Baseline value for a lost action or attack die. Persistent broad reductions must use a named Special. |

| **Weaken / Soulburn Pool Reduction** | Start PP 8 × T(X) | Named Diminishing Specials only; apply before percentage-based Health Penalty. |


| **+1 Armor** | 7.5 PP | Temporary or permanent. |

| **+1 Evade (temporary)** | 5 PP | Short-term buff. |

| **+1 Raise Effect** | 10 PP | Equivalent to +4 TN. |


---


## 4. Health, Damage & Positioning


### Health Bars vs. Healing


Health in the Mastery System is divided into **Health Bars** (structure) and **HP** (content).


Each **Health Bar** represents one full layer of vitality — a pool of hit points equal to **Vitality × 2**,

with a cumulative roll penalty as the character becomes more injured.

Additional Bars can be granted by specific Powers, Buffs, or Passives, but they are **never restored by healing**.


| **Effect / Modifier** | **Approx. PP Value** | **Notes / Usage** |

|:--|:--:|:--|

| **+1 Health Bar (Healthy)** | **70 PP** | Adds a new full Health Bar with **no penalty**; acts as an extra Vitality × 2 HP buffer. |

| **+1 Health Bar (Bruised – 1)** | **55 PP** | Adds a Bar with **–1 penalty** to rolls when active. |

| **+1 Health Bar (Injured – 2)** | **40 PP** | Adds a Bar with **–2 penalty** to rolls when active. |

| **+1 Health Bar (Wounded – 4)** | **25 PP** | Adds a Bar with **–4 penalty** to rolls when active. |


---

### Temporary HP, Refreshing HP & Regeneration Pricing

Temporary HP and Regeneration are defensive HP-effects, but they do not all have the same value.
Their pricing depends on **when** the HP is granted and **whether it refreshes during combat**.

---

### Core Distinction

There are three different cases:

1. **Healing**
2. **Temporary HP at Start of Combat**
3. **Refreshing Temporary HP / Regeneration during combat**

These cases must not share one single price point.

---

### 1) Healing

Healing restores real HP inside the currently active Health Bar.

**Baseline:**
- **+1d8 Healing = 15 PP**

This remains unchanged.

---

### 2) Temporary HP at Start of Combat

Temporary HP granted **only once at the start of combat** is significantly weaker than healing or combat-refreshing HP.

It is a frontloaded buffer:
- it cannot be timed reactively,
- it does not refill,
- once lost, it is gone.

**Baseline:**
- **1 Temporary HP at Start of Combat = 2 PP**

Examples:
- **10 Temporary HP at Start of Combat = 20 PP**
- **20 Temporary HP at Start of Combat = 40 PP**
- **30 Temporary HP at Start of Combat = 60 PP**
- **40 Temporary HP at Start of Combat = 80 PP**

> **Rule:**
> This lower price applies only if the Temporary HP is granted **once per combat at combat start** and **cannot be restored by the same effect during that fight**.

---

### 3) Refreshing Temporary HP during Combat

If Temporary HP is granted or refilled **during combat**, it functions much closer to healing.

Even if it does not restore current HP directly, it creates a repeatable damage buffer that can be consumed every round.

Because of this, refreshing Temporary HP must be priced as an active combat-defense value.

**Baseline:**
- **1 Temporary HP refreshed during combat = 4 PP**

Examples:
- gain **5 Temporary HP** at the start of your turn = **20 PP**
- gain **10 Temporary HP** at the start of your turn = **40 PP**
- gain **15 Temporary HP** at the start of your turn = **60 PP**
- gain **20 Temporary HP** at the start of your turn = **80 PP**

> **Rule:**
> Any Temporary HP effect that can be regained, refreshed, restored, or rebuilt during combat uses the **4 PP per HP** pricing, not the Start-of-Combat pricing.

---

### 4) Regeneration

Regeneration is already present in the SRD as a healing effect.

For direct SRD use:
- **Regeneration(X)** uses **Start PP 3 × T(X)** as a Diminishing effect.

For practical non-diminishing pricing equivalence:
- **1 regenerated HP per round = 4 PP**

Examples:
- regenerate **5 HP** at the start of your turn = **20 PP**
- regenerate **10 HP** at the start of your turn = **40 PP**
- regenerate **15 HP** at the start of your turn = **60 PP**
- regenerate **20 HP** at the start of your turn = **80 PP**

This matches the combat value of refreshing Temporary HP:
- both generate repeatable defensive HP value during combat,
- one restores current HP,
- the other restores a protective buffer.

Therefore, for baseline balancing purposes:

> **Regeneration per round and refreshing Temporary HP per round use the same price:**
> **4 PP per HP**

---

### 5) Design Rule

Use this pricing rule set:

- **Real Healing:** **15 PP per 1d8**
- **Temporary HP at Start of Combat:** **2 PP per HP**
- **Refreshing Temporary HP in Combat:** **4 PP per HP**
- **Regeneration in Combat:** **4 PP per HP**

---

### 6) Usage Guidance

- Use **Start-of-Combat Temp HP** for low-pressure defensive passives.
- Use **Refreshing Temp HP** for premium shield-style passives or buffs.
- Use **Regeneration** for sustain-based defenses.
- Do not price refreshing Temp HP like start-of-combat Temp HP.
- Do not price regeneration like a one-time pre-combat buffer.

These are not equivalent effects in play and must not be treated as equivalent in PP.


#### Structural Rules


- **Health Bars** define *how many times you can fall before dying*; they are a **structural resource**, not normal HP.

&nbsp; They can only be gained through explicit effects that say **“gain +1 Health Bar”**.

&nbsp; No form of healing ever restores, recreates, or upgrades a lost Bar.


- **Healing** restores **HP inside the currently active Bar** only.

&nbsp; It does **not** move you upward in the Bar structure or recreate destroyed Bars.

&nbsp; When you drop to 0 HP within a Bar, you fall to the next Bar and immediately apply its penalty.


- **Penalties:** Each lower Bar applies its listed penalty to all rolls while active.

&nbsp; These penalties stack cumulatively as you descend.


---


#### Temporal Segments


Health-related effects may also use the standard temporal segments:


- **Per Round:** Regeneration, Bleed, ongoing poison.

- **Per Combat:** Once-per-fight self-heals, Death Checks.

- **Per Day:** Long-rest recovery powers, resurrection-like effects.


When mixing Health Bars with regeneration or persistent damage, always ensure that **structural resources** remain rare and expensive.


---


## Advanced Movement Powers

*“The ground is optional, but movement still has weight.”*

These rules describe the canonical Movement catalogue.

The old per-meter movement table is removed.

Movement is no longer priced by one universal meter cost.

Use the relative value of the movement mode.

### Movement Catalogue — Approved Core Entries

The standard Movement catalogue currently supports:

- **Movement: Ground Dash**
- **Movement: Safe Movement**
- **Movement: Teleport**
- **Movement: Teleport with Ally**
- **Movement: Flight**
- **Movement: Leap**
- **Movement: Wall Walk**
- **Movement: Burrow**
- **Movement: Phase Passage**
- **Movement: Trample**

The following Movement entries or riders are explicitly not part of the core catalogue:

- **Movement: Glide**
- Movement + Attack Dice
- Movement + Critical
- Movement + Special Application
- Movement + Special Increase
- Movement + next-hit Damage
- Movement + Penetration
- Movement + defensive buff
- Movement + hard control
- Movement + hidden Reaction dodge

### Movement Type Pricing and Caps

Use these values as the source of truth for catalogue Movement design.

The listed distance is total Movement for the Movement Power, not bonus distance added to normal Movement.

| **Movement Type** | **Pricing Logic** | **Level 16 Cap** | **Reaction / Path Notes** |
|:--|:--|:--:|:--|
| **Ground Dash** | cheapest; roughly 10 PP per meter above normal movement | **34 m** | legal ground path; provokes normally |
| **Safe Movement** | premium ground movement; roughly 25 PP per meter | **20 m** | legal ground path; does not provoke movement-triggered Reactions |
| **Teleport** | premium movement; roughly 30 PP per meter | **16 m** | skips path; no movement-triggered Reactions through intervening spaces |
| **Teleport with Ally** | Teleport plus one willing ally within 2 m | **12 m** | no unwilling targets; no extra creatures |
| **Flight** | premium 3D movement; roughly 20 PP per meter | **24 m** | follows a path; does not automatically grant Safe Movement |
| **Leap** | burst arc movement; roughly 15 PP per horizontal meter | **28 m horizontal / 14 m vertical** | needs legal arc and landing point; provokes normally |
| **Wall Walk** | surface traversal; roughly 12 PP per meter | **28 m** | requires valid surface; provokes normally |
| **Burrow** | exotic material traversal; similar distance band to Teleport | **16 m** | suitable soft material only; no automatic stealth or cover immunity |
| **Phase Passage** | material-thickness traversal, not normal distance | **8 m material thickness** | must end in legal free space; not defensive Phasing |
| **Trample** | offensive path movement; movement + fixed contact damage | **24 m path / 8d8 contact damage** | once per creature; provokes normally |

### Movement Distance Progressions

Use these progressions for the core catalogue examples.

#### Movement: Ground Dash

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 10 m | 12 m | 14 m | 16 m | 18 m | 20 m | 22 m | 24 m | 26 m | 28 m | 30 m | 32 m | 34 m | 34 m | 34 m | 34 m |

#### Movement: Safe Movement

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 2 m | 4 m | 6 m | 8 m | 9 m | 10 m | 11 m | 12 m | 13 m | 14 m | 15 m | 16 m | 17 m | 18 m | 19 m | 20 m |

#### Movement: Teleport

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 1 m | 2 m | 3 m | 4 m | 5 m | 6 m | 7 m | 8 m | 9 m | 10 m | 11 m | 12 m | 13 m | 14 m | 15 m | 16 m |

#### Movement: Teleport with Ally

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | — | 1 m | 2 m | 3 m | 4 m | 5 m | 6 m | 7 m | 8 m | 9 m | 10 m | 11 m | 12 m | 12 m | 12 m | 12 m |

#### Movement: Flight

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 1 m | 3 m | 4 m | 6 m | 7 m | 9 m | 10 m | 12 m | 13 m | 15 m | 16 m | 18 m | 19 m | 21 m | 22 m | 24 m |

#### Movement: Leap

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Horizontal** | 2 m | 4 m | 6 m | 8 m | 10 m | 12 m | 14 m | 16 m | 18 m | 20 m | 22 m | 24 m | 26 m | 28 m | 28 m | 28 m |
| **Vertical** | 1 m | 2 m | 3 m | 4 m | 5 m | 6 m | 7 m | 8 m | 9 m | 10 m | 11 m | 12 m | 13 m | 14 m | 14 m | 14 m |

#### Movement: Wall Walk

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 2 m | 5 m | 7 m | 10 m | 12 m | 15 m | 17 m | 20 m | 22 m | 25 m | 27 m | 28 m | 28 m | 28 m | 28 m | 28 m |

#### Movement: Burrow

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Distance** | 1 m | 2 m | 3 m | 4 m | 5 m | 6 m | 7 m | 8 m | 9 m | 10 m | 11 m | 12 m | 13 m | 14 m | 15 m | 16 m |

#### Movement: Phase Passage

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Material Thickness** | — | 1 m | 1 m | 2 m | 2 m | 3 m | 3 m | 4 m | 4 m | 5 m | 5 m | 6 m | 6 m | 7 m | 8 m | 8 m |

#### Movement: Trample

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Path** | 4 m | 6 m | 8 m | 10 m | 12 m | 14 m | 16 m | 18 m | 20 m | 22 m | 24 m | 24 m | 24 m | 24 m | 24 m | 24 m |
| **Damage** | 1d8 | 1d8 | 2d8 | 2d8 | 3d8 | 3d8 | 4d8 | 4d8 | 5d8 | 5d8 | 6d8 | 6d8 | 7d8 | 7d8 | 8d8 | 8d8 |

### Traversal Rules

- **Safe Movement** prevents movement-triggered Reactions such as Attacks of Opportunity, but it does not ignore terrain, creatures, hazards, walls, or zones.
- **Teleport** skips intervening spaces and therefore does not provoke movement-triggered Reactions through the path. It must end in a visible or clearly known legal free space.
- **Flight** follows a path and may provoke movement-triggered Reactions normally when relevant. It does not automatically grant Safe Movement.
- **Leap** follows an arc, requires a legal landing point, and does not automatically grant Safe Movement.
- **Wall Walk** requires a valid surface and does not grant Flight or Safe Movement.
- **Burrow** works only through suitable soft material and does not automatically grant stealth, cover, immunity, defensive Phasing, or safe attacks from complete safety.
- **Phase Passage** allows traversal through material thickness only. It is not defensive Phasing and never ignores hits.
- **Trample** is not an attack roll, cannot generate Raises, does not use weapon damage, does not apply Specials, and cannot damage the same creature more than once per Movement.

### Design Note

Traversal Phasing and Defensive Phasing are separate subsystems.

- **Traversal Phasing** is a Movement effect.
- **Defensive Phasing** is a hit-negation effect.

They may appear together in the same build, but they must always be priced separately.

---


### Progressive Continuity (Rule of Continuity)


> *“Once you break inertia, stay in motion.”*


When designing movement chains:


- **First Segment:** Pay full PP.

- **Subsequent Segments:** May be discounted (e.g. 50–75 %) if chained within the same Action.

- **Restrictions:**

&nbsp; - Must use the same movement mode (e.g. Flight → Flight, Teleport → Teleport).

&nbsp; - No extra discount when combining multiple powerful modes (e.g. Teleport + Flight).


This prevents “infinite motion” exploits while rewarding planned routes.


---


### Progressive Special Scaling (Rule of Continuity)


Specials attached to movement (e.g. *“deal Ruin(1) to all creatures you pass through”*) must:


- Either **scale linearly with distance** (pay PP per meter).

- Or **cap the maximum triggers per Round**.


Never allow a single movement chain to apply the same Special dozens of times without paying proportional PP.


---


### Special Limit Per Power (Level)


A Power should not stack more than **one primary Special** plus **one minor rider** unless:


- It is a **capstone**.

- It is priced significantly above the curve.


Specials define the texture of play — overloading a single Power with too many undermines build diversity.


---


### Attribute Modification Powers


Attribute modification (Strength, Agility, Intellect, etc.) uses a separate PP model from simple damage or defense buffs.


- **Permanent Attribute Increases**: Highly expensive; typically **outside** normal Tree design (artifacts, divine boons).

- **Temporary Attribute Buffs**:

&nbsp; - +1 Attribute for **Mastery Rank Rounds** ≈ equivalent to +1d8 in the relevant domain.

&nbsp; - Must not stack with themselves; explicit “does not stack” clause recommended.


---

#### Multi-Target Attack Structures

Some Powers can create **multiple hits** or affect **multiple targets** from one Attack Action.
These structures are not stronger than pure single-target offense.
A normal single-target damage Power will always be the most efficient way to push damage into one enemy.

There are now **three** distinct structures:

- **Split-Attack** = the Power creates **2 separate strikes**, but the **Attack Pool**, the **Damage Pool**, and any bought **Specials** are **split** across them.
- **Autofire** = one target receives the **full payload**, while additional targets receive only the Power’s **printed base damage**.
- **AoE** = one target inside the area may receive the **full payload**, while all other targets in the area receive only the Power’s **printed base damage**.

> *“More coverage, more flexibility, less concentrated force.”*

These structures trade raw single-target efficiency for multi-hit or multi-target pressure.
A combatant may only benefit from **one such structure per Action per round** unless a Power explicitly overrides this limit.

---

### Split-Attack(2 Strikes)

> *Split one technique into two real impacts.*

**Core Rule**

When a Power grants **Split-Attack(2 Strikes)**:

- You make **exactly 2 attacks**.
- Your **Attack Pool is split evenly** between them (**round down**).
- Your **Damage Pool** from the Power is also **split evenly** between them.
- Any bought **Specials** from the Power are also **split evenly** between the strikes.
- Each strike is a **separate attack roll**.
- Each strike uses the **same weapon or attack mode** unless the Power states otherwise.
- Each strike resolves separately for:
  - hit or miss,
  - Armor,
  - and on-hit resolution.

#### Split Damage Pricing

**Split-Attack** itself has **no additional PP cost**.

For Powers using **Split-Attack(2 Strikes)**, bought bonus damage is priced at:

`+1d8 Damage = 10 PP`

This is lower than the normal **15 PP**, because Split-Attack divides both the **Attack Pool** and the **Damage Pool** across two separate strikes.

Split-Attack is treated as a weaker but more flexible offensive structure, not as a premium multi-attack bonus.**Targeting**

- **Ranged Split:** the strikes may hit different targets if the Power allows it.
  If distance between targets must be bridged, this must be paid through **Raises**, if the Power says so.
- **Melee Split:** the strikes do **not** bridge distance.
  They are simply two consecutive close-range strikes.

**Restriction**

- Standard Tree design should allow **only 2 strikes**.
- **3+ strike splits** should not appear in normal L1–L4 Powers; reserve them for exceptional capstones, monsters, or explicit subsystem exceptions.

---

### Autofire(X)

> *Choose the first victim. The rest only catch the spill.*

**Core Rule**

When a Power grants **Autofire(X)**:

- **X** defines the maximum number of **additional targets** the Power may include.
- Autofire is declared **before rolling**.
- For every **additional target** beyond the first, declare **+1 Raise** before the roll.
- You make **one single Attack Roll** against the **highest TN** among the chosen targets.
- If your final result meets or exceeds that TN, all declared targets are hit once.

**Payload Rule**

- Choose **one target** as the **primary target**.
- The **primary target** receives the Power’s **full payload**.
- All additional Autofire targets receive only the Power’s **printed base damage**.
- Additional Autofire targets do **not** receive the full payload unless the Power explicitly says so.
- Autofire may not hit the same target multiple times unless a Power explicitly overrides this.

**Restriction**

- Autofire is a **multi-target spread mechanic**, not a true multi-attack structure.
-
---

### AoE

> *The center breaks first. Everything else catches the blast.*

**Core Rule**

When a Power has an **AoE**:

- The Power affects all valid targets inside its area.
- One target inside the area may be chosen as the **primary target**.
- The **primary target** must be **fully covered by the AoE**.

**Payload Rule**

- The **primary target** receives the Power’s **full payload**.
- All other affected targets receive only the Power’s **printed base damage**.
- If no primary target is designated, all targets receive only the Power’s **printed base damage**.

**Restriction**

- Only **one** target in the area may receive the full payload.
- AoE is an **area-pressure mechanic**, not a substitute for Split-Attack.

---

## AoE Reaction Maneuver — Dive for Cover

After an AoE Attack successfully reaches its Area TN, but before its damage or payload is applied, a creature inside the area may spend its Reaction to immediately move up to:

> **2 × Mastery Rank meters**

If this movement takes the creature completely outside the AoE, it is not affected by that AoE.

If it remains inside the area, it is affected normally.

The Primary Target may use Dive for Cover only if a rule explicitly allows it; by default, the Primary Target was directly hit by the placement roll and cannot escape that same AoE through this maneuver.

A creature cannot use Dive for Cover if:

- it has no Reaction available,
- it cannot move,
- it is Rooted, Stunned, Immobilized, or otherwise prevented from moving,
- there is no legal space outside the AoE it can reach,
- or the AoE explicitly cannot be escaped.

This movement does not provoke Reactions.

### Multi-Target Pricing

| **Structure** | **Cost** | **Notes** |
|:--|:--:|:--|
| **Split-Attack(2 Strikes)** | **+10 PP** | Creates 2 separate strikes. **Attack Pool**, **Damage Pool**, and bought **Specials** are split between them. |
| **Autofire(X)** | **+20 PP × X** | **X** = number of **additional targets**. One target gets the **full payload**; all additional targets receive only the Power’s **printed base damage**. |

---

### AoE Pricing

| **Radius** | **AoE Cost** |
|:--:|:--:|
| **1 m** | **0 PP** |
| **2 m** | **20 PP** |
| **3 m** | **50 PP** |
| **4 m** | **90 PP** |
| **5 m** | **140 PP** |
| **6 m** | **200 PP** |
| **7 m** | **270 PP** |
| **8 m** | **350 PP** |

**8 m Radius is the maximum size for standard player Powers.**

#### Mental and Spiritual Effects

Mental and spiritual effects do not use a generic defensive category.

If an effect explicitly allows resistance or later escape, it names the Attribute directly:

- **Intellect** for logic, memory, structured thought, and analytical recognition.
- **Wits** for instinct, perception, doubt, mental intrusion, and manipulated awareness.
- **Resolve** for soul, corruption, possession, divine pressure, and spiritual force.
- **Vitality** only when the effect is bodily rather than mental or spiritual.

A successful hostile Power does not automatically create a second roll.
Long-lasting mental locks must remain rare, expensive, and include clearly written counterplay.

---

### AoE & Terrain Pricing


#### **AoE Scaling (by shape, per +2 m step)**


Use shape-based multipliers for area-of-effect Powers.


####  Melee Reach Pricing

Some hostile single-target Actives extend melee range beyond normal contact distance.

For **single-target hostile melee Powers**, use these additive reach steps:

- **4 m** = **+0 PP**
- **6 m** = **+5 PP**
- **8 m** = **+10 PP**
- **10 m** = **+15 PP**

If a Power begins at **4 m** baseline, treat further steps additively in the same pattern.

Notes:
- This pricing covers **reach only**, not forced movement, damage, or additional riders.
- If the Power also includes **Push**, **Pull**, or other Specials, price those separately.
- If the attack becomes an actual ranged attack instead of an extended melee attack, use the normal **Range** rules instead.


---


### **Barriers / Walls (Terrain Constructs)**


Constructed terrain (walls, barriers, etc.) must pay PP for:


- **Placement**, **Length**, **Height**, **Thickness**, **Line of Sight**, **Duration**, and **Resilience**.


#### **Wall Construction Costs**


Break down wall effects into discrete PP components.


#### **Worked Examples**


**Bark Barricade (L2 Utility ≈ 40 PP)**

Create a 6 m × 2 m × 0.5 m opaque solid wall, duration = Mastery Rank rounds.

> Placement 10 + Length (2 steps × 5 = 10) + LoS 5 + Duration 15 = **40 PP**


**Stone Rampart (L3 Utility ≈ 70 PP)**

8 m × 4 m × 1 m wall, Mastery Rank rounds, +10 HP + 1 Armor per segment.

> Placement 10 + Length 15 + Height 3 + Thickness 2 + LoS 5 + Duration 15 + Resilience (5 × 4 segments = 20) = **70 PP**


---


## 5. Conditional Modifiers & Discounts


### Conditional Modifiers & Disadvantages


> *Conditions and disadvantages define how reliably or safely a Power functions.

>  Each modifier — whether a setup condition or a personal weakness — adjusts the **final PP value**

>  through a unified percentage-based formula.*


---


### ⚖️ Disadvantage & Conditional Efficiency Model


#### 1. Permanent Weakness Modifiers (Disadvantages)


##### Baseline Rule


Permanent, always-on **disadvantages** can be used to balance out powerful effects.


- Apply **multiplicative discounts** (e.g. × 0.95, × 0.9, × 0.8)

- Only after the base PP has been calculated.


##### Minor Conditions — × 0.95 (–5 %)


Small, easy-to-trigger conditions such as:


- *“If target is already Lacerated”*

- *“Only usable while above half HP”*


Grant a small discount: **× 0.95**.


##### Synergy Conditions — × 0.9 (–10 %)


Cross-tree or multi-effect synergy conditions such as:


- *“If target is Marked (from another Tree)”*

- *“If target is affected by Ruin and Disoriented”*


Grant a moderate discount: **× 0.9**.


##### Complex Conditions — × 0.8 (–20 %)


Rare, complex setups requiring **3+ conditions** or advanced combo play may justify **× 0.8**, but use sparingly.


##### Summary Table


| **Type** | **Definition** | **Multiplier** | **Example** |

|:--|:--|:--:|:--|

| Minor | 1 easy in-tree condition | × 0.95 | “If Hidden” |

| Dual Minor | 2 in-tree conditions | × 0.9 | “If Hidden and target Marked” |

| Synergy | 1 cross-tree dependency | × 0.9 | “If Marked (from Highwayman)” |

| Complex | ≥ 3 mixed / cross-tree conditions | × 0.8 | “If Marked, Lacerated and Disoriented” |


---


### Conditional Bonuses — Design Rule


#### Allowed Model — *Conditional Discount*


You may **reduce PP** for effects that are restricted by conditions:


- Once per Combat,

- Only vs specific creature types,

- Only within specific terrain, etc.


This uses multiplicative reductions as above.


#### Forbidden Model — *Conditional Multiplication*


Do **not** allow conditions to **multiply outputs** directly (e.g. “double damage if target is Stunned”).

Such statements convert a reliability condition into a **power amplifier**,

breaking the internal PP-curve (they add output without corresponding cost).

If a doubled effect is thematically required, treat it as a **separate higher-tier Power**

or increase the base cost by the appropriate **positive Impact (+100 %)**.


---


#### Design Summary


| **Goal** | **Treatment** | **PP Impact** | **Example Syntax** |

|:--|:--|:--:|:--|

| Limit availability | Discount (−10 %) | ÷ (1 + 0.10) | *“while in darkness”* |

| Increase power | Boost (+100 %) | × (1 + 1.00) | *Never combine with a discount.* |


> **Rule of Thumb:**

> Discounts reduce **frequency** (how often you can use it), not raw power.

> Boosts increase raw power, but must be **paid in full** as PP, without stacking with discounts.


Use × 0.8 reduction sparingly for rare, setup-heavy combos.


---


## 6. Tree Design Guidelines


## Mastery Tree Design Guidelines


> *“Every Path of Mastery is forged from purpose, balance, and identity.”*


Trees are the **structural containers** for Powers.

Each Tree should have a clear **theme**, **role**, and **mechanical identity**.


### **Tree Structure**


- **Ranks:** 12 Power Ranks (L1–L4).

- **Slots:** Typically 4 Actives, 4 Passives, 2 Active Buffs and 2 Movement Powers

- **Capstones:** Powers may push slightly above PP curve (+5–10 %).


Trees should be:


- **Focused:** One clear primary mechanic (Lacerate, Ruin, Hex, etc.).

- **Coherent:** Powers reference and support each other.

- **Distinct:** No two Trees should feel interchangeable.


### **Mandatory Tree Header Fields**


Each Tree begins with a structured header that presents its identity, build requirements, and intended combat behavior.

A complete Tree Header should include:

Name
Theme / Role
Role
Design Pillars
Requirements
Primary Attribute
Playstyle

The Playstyle section should briefly explain:

how the Tree engages,
how it pressures, controls, or supports,
what its preferred battlefield position is,
what gear or setup it prefers,
and what kind of combat rhythm it rewards.

This section should make the Tree understandable at a glance, before the reader even examines the individual Powers.
---


## Design Priorities & Anti-Abuse Matrix


### **Core Design Priorities**


1. **Clarity over Cleverness**

2. **Counterplay over Lockdown**

3. **Synergy over Redundancy**

4. **Theme over Raw Numbers**


### **Mechanical Safety Limits**


Mechanical safety limits prevent single Powers from dominating play:


- Maximum stun duration,

- Maximum AoE radius,

- Maximum stacking of Specials, etc.


### **Common Exploit Patterns**


Watch for designs that:


- Stack too many Specials on one hit.

- Combine multiple immunity or resistance layers.

- Abuse Action economy via extra turns or Reactions.


### **Optional Design Enhancements**


Additional guidelines for advanced content:


- **Role compression**: allow some Trees to flex into secondary roles.

- **Narrative hooks**: interplay with world lore, factions, items.


### **Usage Note**

When generating or recalculating Trees:

- Always cross-check against this matrix.

- If a design exceeds one limit (e.g., AoE > 8 m + Stun 2 Rounds), reduce another (damage or duration).

- Mark any intentional exceptions with a short justification in a comment (e.g., “Legendary capstone — intentional overcurve +10 %”).


> *Mastery is not the absence of limits, but the art of bending them with purpose.*


---


## 7. Spell List Design Guide


### Spell List Design Guide

*“Every spell is an echo of intent — structure gives it meaning.”*


---


> ### Spellcasting – Core Rules (Quick Ref)

> - **Casting Roll:** *Attribute k Mastery* (meist eines von diesen Attributen: **Intellect/Resolve/Influence** je Schule).

> - **Base TN:**
**Spell Tier =** `ceil(Spell Level / 2)`
**Base TN (Standard) =** `8 × Spell Tier`

| Spell Level | Spell Tier | Base TN |
|:--:|:--:|:--:|
| 1–2 | I | 8 |
| 3–4 | II | 16 |
| 5–6 | III | 24 |
| 7–8 | IV | 32 |
| 9–10 | V | 40 |
| 11–12 | VI | 48 |
| 13–14 | VII | 56 |
| 15–16 | VIII | 64 |

>   - Raises steigern **Range (+4 m)**, **Radius (+2 m)**, **Duration (+1 Runde)**, **Damage +1d8** oder **Special-Intensity (+1)**.

> - **Spell Tags:** Identifies the effect as a Spell for mechanical interactions.


---


#### 1. Core Philosophy


The Spell List Design Guide ensures that every School:


- Has a **coherent theme** (Element, Concept, Domain).

- Follows the **same mechanical backbone** (TN, Raises, Specials).

- Offers meaningful **choices per Mastery Rank**.


Spell Lists are not a wild grab-bag of effects.

They are **carefully structured toolkits** that support a specific **playstyle**.


---


#### 2. Spell List Composition


| **Element** | **Recommended Amount** | **Purpose** |

|:--|:--:|:--|

| **Active Spells** | 4–6 | The core of the School: damage, control, or terrain manipulation. |

| **Active Buffs** | 1–2 | Short, tactical boosts or defensive effects (last = Mastery Rank rounds). |

| **Passives** | — | **Never included in Spell Lists.** (Reserved for martial or hybrid Trees.) |

| **Signature Spell (optional)** | 1 | Unique or capstone-level ability (~+10 PP over curve). |


> *Spells are meant to be cast — not carried as passive bonuses.*


Guidelines:


- Ensure at least **one simple damage spell** per list.

- Include **one control spell** (Stun, Slow, Fear, Immobilize, etc.).

- Use **1–2 thematic Specials** consistently across spells (e.g. Ruin + Disoriented in Storm magic).


---


#### 3. Thematic Anchors


Each Spell List must have:


- **1 Main Special** — the mechanical and narrative centerpiece (e.g. *Ruin* in Pyromancy).

- **1 Secondary Special** — supports the theme, appears occasionally (e.g. *Disoriented*).

- **0 additional recurring effects.**

- **1–2 Elemental Domains or Schools** — purely for fluff and presentation (Fire, Frost, Shadow, etc.).


Do not dilute the theme with unrelated effects (e.g. adding Poison mechanics to a Holy light School).


---


#### 4. Casting Attributes


Each School is bound to **one primary casting Attribute**:


- **Intellect** — classical arcane, runes, formulae.

- **Resolve** — divine miracles, oaths, inner conviction.

- **Influence** — words of power, charm, illusions.


Optional: one School may have **dual-attribute hooks** for flavor (e.g. Illusion / Enchantment using Influence and Intellect), but **mechanically** they still use one Attribute for Spell Rolls.


---


#### 5. Structural Rules


Spell Lists obey the same structural balance as martial Trees:


- **Target PP curves** for Actives .

- **No Passive Powers** directly inside Spell Lists.

- **Capstones** rare and intentionally overcurve by a small, justified margin.


---


#### 6. Construction Workflow


1. **Choose Theme** → Define School name, domain, and visual tone.

2. **Pick Attribute** → Intellect / Resolve / Influence.

3. **Select Specials** → 1 main + 1 secondary.

4. **Define Spell Type** → Active / Buff / Utility.

5. **Define Raises**

&nbsp;  - +4 TN each, raising Range, Damage, Radius, Duration, or Special Intensity.

6. **Align with PP Curve**

&nbsp;  - Use PP tables from the Powers section as a sanity check.


---


### School Construction – Hard Rules


- **No Passive effects** in Spell Lists.

- **Spell Raises may increase damage dice, but spell construction should not rely primarily on damage scaling.
A spell’s identity should be carried first by its Specials, control profile, range, radius, or duration.**

- **No mixing of multiple primary Specials** (Ruin + Blight + Lacerate, etc.).


### Spell / Martial Exclusivity Rule


To keep the system clean:


#### **1. Martial Trees**


- Contain Powers with **martial focus** — weapons, movement, physical control.


#### **2. Spell Lists**


- Contain only **Spell-tagged Actives**.

- No martial weapon techniques or passive stat boosts.


#### **3. Mixed Design Prohibition**


Do **not** build Trees that are half martial, half spell list, unless:


- Explicitly marked as **Hybrid Tree** with clear rules.

- Balanced against both martial and spell PP curves.


---


## 8. Formatting & Output Standards

All outputs must be **clean, copy-pasteable Markdown** for Homebrewery.
Do not add unnecessary prose outside the requested output block unless the user explicitly asks for explanation.

---

### 8.1 General Output Rule

Before formatting the answer, determine what the user is asking for:

* **Single Power**
* **Mastery Tree**
* **Spell List / School**
* **Revision of existing content**

The output format must match the request type.

---

### 8.2 Power Output Contract

Use this format when the user asks for a **single Power**.

#### Required structure

* exactly **one** fenced Markdown code block
* exactly **one** `<h3>` title block
* exactly **one** flavor line
* exactly **one** power table
* exactly **one** tooltip / calculation block

#### Rules

* Do **not** add prose before or after the Power unless explicitly requested.
* The Power must fit one valid PP curve.
* The **Special** column may contain only bolded tags such as `**Ruin(2)**`, `**Lacerate(1)**`, etc.
* The **Effect** column contains only the direct effect text.
* All math, justification, and balancing notes go into the tooltip only.
* If the result violates the SRD format, reformat it instead of explaining it.

#### Tooltip Calculation Rule

The tooltip must always include:

- **BASELINES**
- **CALCULATION**

It is not enough to write only a short summary or design note.

The tooltip must explicitly show:
- the relevant PP baseline values,
- the effect components being priced,
- and the final level-by-level PP calculation.

Short comments such as
- "core opener"
- "simple AoE Ruin tool"
- "built on the standard curve"

are allowed only as an additional **NOTES** line, never as a replacement for the full PP breakdown.
---

### 8.3 Tree Output Contract

Use this format when the user asks for a **Mastery Tree**.

#### Required structure

1. **Tree Header**
2. **Bonus**
3. **Playstyle**
4. **Full Power List**

#### Tree Header must include

* **Name**
* **Theme / Role**
* **Role**
* **Design Pillars**
* **Requirements**
* **Primary Attribute**

#### Playstyle

The Playstyle section should briefly explain:

* how the Tree engages,
* how it applies pressure, control, or support,
* where it prefers to stand on the battlefield,
* what gear or setup it prefers,
* and what kind of combat rhythm it rewards.

#### Full Power List Rules

* Every Power in the Tree must include a full **Level 1–4 progression**.
* Never leave Levels undefined.
* Never output a one-level-only Power unless the user explicitly requests a one-shot, monster-only, or capstone exception.
* Each Power inside a Tree must be formatted as a normal Power entry, including title, flavor line, table, and tooltip.
* The Tree should be returned as one clean Markdown package, ready for Homebrewery.

#### Output Rule

* Do **not** collapse a Tree into a single Power block.
* Do **not** add prose before or after the Tree unless explicitly requested.

---

### 8.4 Spell List / School Output Contract

Use this format when the user asks for a **Spell List** or **School**.

#### Required structure

1. **School Header**
2. **Casting Attribute**
3. **Theme / Domain**
4. **Main Special**
5. **Secondary Special**
6. **Spell List**
7. **Optional Signature Spell**

#### Rules

* Spell Lists contain **Spell-tagged Actives only**.
* Spell Lists do **not** contain Passives unless the user explicitly requests a Hybrid exception.
* Each spell must follow the normal spell formatting rules internally.
* The School must keep one clear mechanical identity.
* Do not mix multiple primary Specials.

#### Output Rule

* Return the full School as one clean Markdown package.
* Do **not** reduce a School request to a single spell unless the user explicitly asks for only one spell.

---

### 8.5 Revision Output Contract

Use this format when the user asks to **revise** existing content.

#### Rules

* Preserve the original structure unless the user explicitly asks for restructuring.
* Keep names, formatting style, and presentation as close to the source as possible.
* Change only what is necessary to make the result SRD-compliant, clearer, or better balanced.
* If the revision is intentionally a deviation from the SRD, mark it as:
  `[Homebrew: deviates from SRD]`

---

### 8.6 Homebrewery Formatting Standard

All final outputs must be **clean, copy-pasteable Markdown** for Homebrewery.

#### General formatting rules

* Do not add unnecessary prose outside the requested output block unless explicitly requested.
* Use fenced Markdown code blocks when emitting final usable content.
* Keep heading structure, tables, and inline formatting consistent.

#### Power block formatting

When outputting a **single Power**, use exactly one fenced Markdown code block containing:

* one `<h3>` title block
* one flavor line
* one power table
* one tooltip / PP calculation block

The tooltip / PP comment must be placed inside either:

* an **HTML comment**, or
* a `<span class="tooltiptext">` block

No additional text should appear before or after the Power block unless explicitly requested.

#### Tree and School formatting

When outputting a **Tree** or **Spell List / School**, the full package must remain Homebrewery-compatible.
Each Power or Spell entry inside that package must still follow the normal Power block formatting internally.

#### Power Header Formatting Rule

The `<h3>` title line must include the Power name followed by its formatted Type field in parentheses.

**Format:**
`Power Name (Type)`
or
`Power Name (Type, Tag)`
or
`Power Name (Type, Tag, Tag)`

Examples:
- `Firebolt (Active, Spell)`
- `Backdraft (Reaction)`
- `Ambush Shot (Active, Charged)`
- `Arc Barrage (Active, Spell, Charged)`

The title line must use the same Type/Tag logic as the Power table.
Do not shorten the title to only the Power name.
---

### 8.7 Validation Rule

Before finalizing an output, verify:

* Does the output match the correct request type?
* Does it use the correct structure for that request type?
* Are all Levels fully defined where required?
* Does the formatting match Homebrewery expectations?
* Are all balancing notes kept inside tooltips or comments rather than outside the content?
*  Does the Power use only allowed tags for its Type?
*  Is Spell used only on Active?
*  Are Active Buff and Passive always tag-free?
If not, correct the format before returning the result.

---

---

## 9. Active Buff, Reaction, and Movement Catalogue Governance

This section records the current canonical catalogue decisions for **Active Buffs**, **Reactions**, and **Movement Powers**. It exists so the Agent does not reconstruct removed old-tree ideas such as Attack Dice buffs, Crit riders, Special Application buffs, mini-Active Reactions, or Movement Powers that secretly act as attack enhancers.

### 9.1 Active Buff Catalogue — Canonical Decisions

Active Buffs use the full Active Buff curve from Level 1 to Level 16:

| **Level** | **Target PP** |
|:--:|--:|
| 1 | 40 |
| 2 | 70 |
| 3 | 100 |
| 4 | 130 |
| 5 | 160 |
| 6 | 190 |
| 7 | 220 |
| 8 | 250 |
| 9 | 280 |
| 10 | 310 |
| 11 | 340 |
| 12 | 370 |
| 13 | 400 |
| 14 | 430 |
| 15 | 460 |
| 16 | 490 |

The standard catalogue supports the following Active Buff entries:

#### Pure Defensive Active Buffs

- **Active Buff: Armor** — pure self Armor at 7.5 PP per +1 Armor.
- **Active Buff: Armor Aura** — self-centered group Armor aura; pay radius first, then Armor.
- **Active Buff: Evade** — pure self Evade at 5 PP per +1 Evade.
- **Active Buff: Temporary HP** — refreshing Temporary HP at 4 PP per HP.
- **Active Buff: Healing** — start-of-turn healing at 4 PP per HP.
- **Active Buff: Damage Reduction** — closed milestone subsystem; only increases Passive DR by +10%.
- **Active Buff: Phasing** — closed milestone subsystem; only reinforces Passive Phasing.

#### Defensive Combination Active Buffs

- **Active Buff: Armor + Temporary HP** — Armor plus fixed Temporary HP gained on activation.
- **Active Buff: Evade + Temporary HP** — Evade plus refreshing Temporary HP.
- **Active Buff: Temporary HP + Healing** — refreshing Temporary HP plus start-of-turn healing.
- **Active Buff: Armor + Evade** — mixed mitigation and avoidance.

#### Offensive Active Buffs

- **Active Buff: Damage** — pure bonus damage.
- **Active Buff: Penetration** — pure armor bypass.
- **Active Buff: Damage + Penetration** — only approved standard offensive combination.
- **Active Buff: Critical** — closed premium milestone subsystem, no secondary axis.
- **Active Buff: Special Overdrive** — closed Special Increase subsystem, no Special Application.

The following Active Buff entries are explicitly removed or forbidden in the core catalogue:

- Active Buff: Attack Dice
- Active Buff: Damage + Critical
- Active Buff: Attack Dice + Critical
- Active Buff: Damage + Special Application
- Active Buff: Special Application
- any Detection / Detector / Reveal / Sensor active buff
- any Critical rider outside Active Buff: Critical

### 9.2 Reaction Catalogue — Canonical Decisions

Reactions use the full Reaction curve from Level 1 to Level 16:

| **Level** | **Target PP** |
|:--:|--:|
| 1 | 20 |
| 2 | 40 |
| 3 | 60 |
| 4 | 80 |
| 5 | 100 |
| 6 | 120 |
| 7 | 140 |
| 8 | 160 |
| 9 | 180 |
| 10 | 200 |
| 11 | 220 |
| 12 | 240 |
| 13 | 260 |
| 14 | 280 |
| 15 | 300 |
| 16 | 320 |

The standard catalogue supports the following Reaction entries:

#### Pure Defensive Reactions

- **Reaction: Armor** — Armor against the triggering attack or damage instance.
- **Reaction: Evade** — Evade against the triggering attack.
- **Reaction: Temporary HP** — Temporary HP against the triggering damage instance; leftovers disappear at the end of your next turn.

#### Defensive Combination Reactions

- **Reaction: Armor + Temporary HP** — one-hit mitigation plus buffer.
- **Reaction: Evade + Temporary HP** — one-hit avoidance plus buffer if damage still occurs.

#### Ally Protection Reactions

Ally Protection Reactions protect one ally within **4 m** and pay a **10 PP Ally Protection premium** before buying the actual defensive effect.

- **Reaction: Ally Armor**
- **Reaction: Ally Evade**
- **Reaction: Ally Temporary HP**

#### Counter Effects

Counter Effects are damage-shield style Reactions, not attacks.

- **Reaction: Counter Damage** — fixed damage at **20 PP per 1d8** when a creature within 2 m hits you.
- **Reaction: Counter Damage + Push** — fixed damage plus Push directly away from you; Push costs **20 PP per 2 m** and is capped at 8 m.

#### Closed Premium Reactions

- **Reaction: Damage Reduction** — only increases existing Passive DR by +10% against the triggering damage instance.
- **Reaction: Phasing** — only reinforces existing Passive Phasing and ignores the triggering hit within milestone caps.

#### Restricted Utility Reactions

- **Reaction: Special Increase** — only increases an existing eligible Special(X) on the triggering creature; no Special Application.
- **Reaction: Reposition** — hard-capped movement after the triggering event resolves; no Evade, no damage prevention, no teleport, no Disengage by default.

The following Reaction entries are explicitly removed or forbidden in the core catalogue:

- Reaction: Attack Dice
- Reaction: Special Application
- Reaction: Counter Attack / make an attack
- Reaction: Counter Special
- Reaction: Critical / Crit rider
- Reaction: Hard Control
- Reaction: pure Push
- Reaction: Ally Push / Guard Push
- Reaction: Ally Reposition
- Reaction: Evade + Reposition
- any Reaction that functions as a hidden full Active Power

### 9.3 Movement Catalogue — Canonical Decisions

Movement Powers replace normal Movement. A normal character has **10 m** normal Movement. A Movement Power's listed distance is total Movement, not bonus distance added to 10 m, unless the entry explicitly says otherwise.

Movement Powers are priced by movement quality and hard caps, not by one universal linear Movement curve. Do not use the old 2 PP/m Run, 5 PP/m Flight, or 8 PP/m Teleport table for new catalogue entries.

The standard Movement catalogue includes:

- **Movement: Ground Dash** — legal ground movement; provokes normally; cap **34 m**.
- **Movement: Safe Movement** — legal ground movement that does not provoke movement-triggered Reactions; cap **20 m**.
- **Movement: Teleport** — premium relocation; skips intervening spaces; cap **16 m**.
- **Movement: Teleport with Ally** — self plus one willing ally within 2 m; cap **12 m**.
- **Movement: Flight** — path-based three-dimensional movement; cap **24 m**.
- **Movement: Leap** — arc movement; cap **28 m horizontal / 14 m vertical**.
- **Movement: Wall Walk** — traversal along walls, ceilings, or similar surfaces; cap **28 m**.
- **Movement: Burrow** — suitable soft material only; cap **16 m**.
- **Movement: Phase Passage** — traversal through material thickness, not defensive Phasing; cap **8 m material thickness**.
- **Movement: Trample** — offensive path movement; cap **24 m path / 8d8 contact damage**.

The following Movement entries or riders are explicitly removed or forbidden in the core catalogue:

- Movement: Glide
- Movement + Attack Dice
- Movement + Critical
- Movement + Special Application
- Movement + Special Increase
- Movement + next-hit Damage
- Movement + Penetration
- Movement + defensive buff
- Movement + hard control
- Movement + hidden Reaction dodge

Movement Powers may not improve the next attack by default. If the main payoff is “your next attack gains X,” it is not a Movement Power. It is an Active Buff, Active Power, or Tree-specific exception.

### 9.4 Tooltip Requirement for Catalogue Entries

Active Buff, Reaction, and Movement catalogue entries must use expanded tooltips. A valid tooltip must include:

- **BASELINES** — target curve or movement baseline and component costs,
- **DESIGN STRUCTURE** — what axes the entry uses and what is forbidden,
- **LEVEL-BY-LEVEL CALCULATION** or **DISTANCE PROGRESSION** — each level's target value and bought value,
- **NOTES** or **DESIGN NOTE** — why the entry is restricted, capped, or milestone-based.

Short tooltips are not sufficient for catalogue entries.

## 10. Active Power Template Governance

This section defines the structural rules for the standardized Active Power templates.

The Active examples appended below this Agent file are reference templates. They establish reusable shapes for Pure Output Actives, Martial Single-Target Actives, Martial AoE Actives, Persistent Special Zones, Control Actives, Support Actives, Images, Barriers, and Hard Control.

When designing new Actives, the Agent must first identify the matching template family and then build from that structure instead of inventing a new curve.

---

### 10.1 Active Template Families

| **Family** | **Purpose** | **Primary Scaling Axis** |
|---|---|---|
| **Pure Output Active** | Clean single-target damage or healing. | Damage dice or Healing dice |
| **Single-Target Martial Active** | Weapon or unarmed attack with one main payload. | Damage, Special, or control value |
| **AoE Martial Active** | Self-centered or ranged area attack. | AoE size + Special value |
| **Persistent Zone** | Ranged battlefield area that remains for several Rounds. | Range + Radius + ongoing payload |
| **Control Active** | Push, Pull, Prone, Disarm, Stunned, or similar tempo control. | Control distance or fixed control payload |
| **Support Active** | Heal, Cleanse, Dispel, or mixed support. | Healing dice, Cleanse strength, Dispel strength |
| **Image Active** | Illusory sensory content with no physical matter. | Image Tier + Image Size |
| **Barrier / Wall Active** | Temporary battlefield object with HP instead of damage. | Range + Radius/shape + Barrier HP + Duration |
| **Hard Control Active** | Expensive action-denial control. | Fixed hard-control payload + one scaling axis |

Do not mix template families casually. A Power should not be a high-damage strike, full AoE Special delivery, persistent zone, barrier, illusion, and hard-control tool at the same time unless it is explicitly marked as an over-curve capstone or monster-only exception.

---

### 10.2 Active Curve Reference

Standard Active templates use the linear Active curve.

| **Level** | **Target PP** |
|:--:|:--:|
| 1 | 30 |
| 2 | 60 |
| 3 | 90 |
| 4 | 120 |
| 5 | 150 |
| 6 | 180 |
| 7 | 210 |
| 8 | 240 |
| 9 | 270 |
| 10 | 300 |
| 11 | 330 |
| 12 | 360 |
| 13 | 390 |
| 14 | 420 |
| 15 | 450 |
| 16 | 480 |

This table is the default budget for 16-level Active template construction.

---

### 10.3 Cost Tolerance Rule

The Agent may treat values within **+/-5 PP** of the target as on-curve.

If a value exceeds the target by more than 5 PP, reduce a component, delay the increase to a later level, or explicitly mark the exception in the tooltip.

---

### 10.4 Minimum Function Exception

Some templates cannot function at Level 1 without slightly exceeding the Level 1 budget.

This is allowed only when the excess comes from a mandatory minimum AoE, minimum Special, minimum Image Tier, or minimum Barrier form; no cheaper legal version exists; the excess is small; and the template stabilizes later.

---

### 10.5 Delivery Duration vs. Effect Duration

The **Duration** column describes the duration of the Power's delivery, not necessarily the duration of every Special it applies.

If an **Instant** Power applies a Special or condition, that Special uses its own normal duration or decay rules.

---

### 10.6 Special-First Martial Active Rule

When a Martial Active is built around a Special, the Special is the primary scaling axis and damage is only a secondary rider.

For Special-first Martial Actives:

- the Special may stay the same or increase,
- damage may stay the same or increase,
- neither may decrease,
- unused PP may be ignored,
- and damage should not be increased merely to fill spare budget if doing so would delay future Special scaling.

---

### 10.7 Damage Anchor Rule

For Special-first Martial Actives, Levels 1-4 establish the baseline damage shape.

From Level 5 onward:

- the Level 4 damage value becomes the template's **Damage Anchor**,
- the Special is increased whenever the PP budget allows it,
- damage increases only if it does not delay or block the next Special increase,
- and unused PP may remain unused.

---

### 10.8 AoE Martial Active Rules

AoE Martial Actives are not normal single-target Powers with a free area attached.

They must follow these rules:

1. Pay Range first if the Power is ranged.
2. Pay AoE second using the standard AoE table.
3. Spend remaining PP on the Special.
4. Add up to **+1d8 damage** only if it can remain permanently afterward.
5. AoE, Range, and Special may stay the same or increase, but may never decrease.
6. Do not allow damage to flicker on and off between levels.

---

### 10.9 AoE Special Value Rule

AoE Special values are derived from the matching Single-Target template and then reduced.

> **AoE Special = floor(Single-Target Special / 2)**

The AoE value may never exceed the matching Single-Target Special cap.

---

### 10.10 AoE Special Cost Rule

AoE Specials cost one Diminishing step higher than their printed value.

> **AoE Special(X) = Start PP x T(X+1)**

> **T(X) = X x (X + 1) / 2**

This applies to AoE delivery and persistent zones unless a specific template states otherwise.

---

### 10.11 Persistent Zone Rules

Persistent Zones are ranged battlefield areas that remain in place for a listed duration.

A creature is affected by the zone when:

- the zone appears and the creature is inside it,
- the creature enters the zone for the first time on a Round,
- or the creature starts its turn inside the zone.

A creature can be affected by the same Persistent Zone only **once per Round**.

Persistent Zones are not self-centered unless a template explicitly says so.

---

### 10.12 Persistent Zone Cost Formula

Persistent Zones use a Duration Multiplier.

| **Duration** | **Multiplier** |
|---|:--:|
| **4 Rounds** | **x2** |

> **Final Cost = Range Cost + [(Radius Cost + AoE Special Cost) x Duration Multiplier]**

Range is paid normally and is not multiplied.

The persistent part of the Power is multiplied: Radius, Special payload, Image Tier, Barrier HP, and any other ongoing payload.

Damage is normally omitted from Persistent Zone templates unless the template explicitly says otherwise.

---

### 10.13 Persistent Zone Stacking Rule

A Persistent Zone does not add its Special value repeatedly.

When a creature is affected by the same Persistent Zone again, apply the higher value:

- If the creature does not have that Special, it gains the listed Special.
- If the creature already has a lower value, increase it to the zone's listed value.
- If the creature already has an equal or higher value, refresh the effect's duration if applicable.
- Do not add the listed value again.

---

### 10.14 Persistent Zone Dispel Resistance

Every Persistent Zone has **Dispel Resistance**.

> **Dispel Resistance = Power Level**

If a specific Zone, Barrier, Wall, Ward, Glyph, Illusion Field, or Summoned effect needs a different value, it must state that value explicitly.

---

### 10.15 Standard Special Groups for Active Templates

| **Group** | **Start PP / Cost Basis** | **Specials** |
|---|:--:|---|
| **Blight Group** | Start PP 3 | Blight |
| **Standard Group** | Start PP 4 | Lacerate, Slow, Ruin, Mark |
| **Heavy Group** | Start PP 6 | Corrode, Hex, Sundered, Root |
| **Premium Reduction Group** | Start PP 8 | Disoriented, Expose |
| **Pool Reduction Group** | Start PP 8 | Weaken, Soulburn |

Start PP 8 Specials require dedicated Single-Target, AoE, and Persistent-Zone templates.
Do not place them inside the Start PP 6 template merely to reuse an existing table.

---

### 10.16 Fixed Control Add-ons

Some control effects are binary states and do not scale as independent X-value Specials.

| **Control Add-on** | **PP Cost** | **Scaling** | **Notes** |
|---|:--:|---|---|
| **Prone** | **60 PP** | Fixed / Binary | The target is knocked prone. Prone does not scale as Prone(X) in Martial template design. |
| **Disarm** | **60 PP** | Fixed / Binary | The target loses grip on a held weapon, shield, focus, or held object. Disarm does not scale as Disarm(X). |
| **Immovable** | **80 PP** | Fixed / Binary | The affected creature is immune to Push, Pull, Prone, and forced movement for the listed duration. |

A Power with Prone, Disarm, or Immovable must still have another primary scaling axis.

---

### 10.17 Push / Pull Control Scaling

Push and Pull may be used as the primary scaling axis of a Control Active.

| **Forced Movement** | **PP Cost** |
|:--:|:--:|
| 2 m | 30 PP |
| 4 m | 60 PP |
| 6 m | 90 PP |
| 8 m | 120 PP |
| 10 m | 150 PP |
| 12 m | 180 PP |
| 14 m | 210 PP |
| 16 m | 240 PP |
| 18 m | 270 PP |
| 20 m | 300 PP |
| 22 m | 330 PP |
| 24 m | 360 PP |
| 26 m | 390 PP |
| 28 m | 420 PP |
| 30 m | 450 PP |
| 32 m | 480 PP |

This control-template cost is intentionally higher than the generic instant Push/Pull rider cost, because it represents the whole primary action budget of a dedicated battlefield-control Active.

---

### 10.18 Hard Control / Stunned Governance

Stunned is hard control and must not be treated like a normal Diminishing Special.

| **Hard Control Add-on** | **PP Cost** | **Scaling** | **Notes** |
|---|:--:|---|---|
| **Stunned** | **120 PP** | Fixed / Binary | The target loses its next Attack Action and cannot use Reactions until the start of its next turn. |

When building a Stunned Power:

- make Stunned the fixed hard-control payload,
- never write Stunned(2), Stunned(3), or similar for player-facing templates,
- keep damage absent or use damage as the only scaling axis after Stunned becomes affordable,
- avoid AoE Stunned unless explicitly designed as a high-level hard-control template,
- and do not combine Stunned with another major Special.

Stunned does not remove movement.

Stunned does not remove Movement.

Stunned does not stack with itself.

A creature cannot lose more than one Attack Action from Stunned before it has taken a normal turn. If a creature is already Stunned, applying Stunned again before it has acted has no additional effect unless a specific Power says otherwise.

---

### 10.19 Cleanse vs. Dispel

**Cleanse** removes negative effects from creatures.

**Dispel** removes ongoing effects from the battlefield or from objects.

Dispel can remove Persistent Zones, Barriers, Walls, Wards, Glyphs, Illusion Fields, Images, magical constructs, enchantments, and other ongoing non-creature effects if the Dispel Strength meets or exceeds the effect's Dispel Resistance.

---

### 10.20 Images / Illusion Fields

Images create false sensory information. They do not create physical matter, block movement, deal damage, provide real cover, or apply Specials unless those effects are bought separately.

Images use the same persistent battlefield logic as other lasting area effects.

| **Duration** | **Multiplier** |
|---|:--:|
| **4 Rounds** | **x2** |

> **Final Cost = Range Cost + [(Image Size Cost + Image Tier Cost) x2]**

Range is not multiplied.

#### Image Tier Costs

| **Image Tier** | **Cost** | **Meaning** |
|:--:|:--:|---|
| **Image I** | **10 PP** | Simple static visual image. |
| **Image II** | **20 PP** | Moving visual image. |
| **Image III** | **35 PP** | Sight + sound image. |
| **Image IV** | **55 PP** | Complex creature or object image. |
| **Image V** | **80 PP** | Multi-sense image. |
| **Image VI** | **110 PP** | Small scene with several moving parts. |
| **Image VII** | **145 PP** | Complex battlefield illusion. |

#### Image Size Costs

| **Image Size** | **Cost** |
|---|:--:|
| **Single Small Image** | **0 PP** |
| **Single Human-Sized Image** | **10 PP** |
| **Large Image / Radius 2 m** | **20 PP** |
| **Radius 3 m** | **50 PP** |
| **Radius 4 m** | **90 PP** |
| **Radius 5 m** | **140 PP** |

Image Tier and Image Size may stay the same or increase, but may never decrease.

Images have **Dispel Resistance = Power Level** unless a specific Image says otherwise.

---

### 10.21 Barriers / Walls

Barriers and Walls are temporary battlefield objects.

They are built like persistent Actives, but instead of dealing damage they create a placed object with Hit Points.

| **Duration** | **Multiplier** |
|---|:--:|
| **4 Rounds** | **x2** |

> **Final Cost = Range Cost + [(Radius / Shape Cost + Barrier HP Cost) x2]**

Range is not multiplied.

For simplicity, Barrier size is expressed as **Radius**. The listed radius represents the amount of battlefield space the player may shape into a wall, ring, line, dome, partial cover, or similar legal configuration.

#### Barrier HP Cost

| **Barrier HP** | **Cost** |
|:--:|:--:|
| **10 HP** | **10 PP** |
| **20 HP** | **20 PP** |
| **30 HP** | **30 PP** |
| **40 HP** | **40 PP** |
| **50 HP** | **50 PP** |
| **60 HP** | **60 PP** |
| **80 HP** | **80 PP** |
| **100 HP** | **100 PP** |

Barrier HP is the replacement payload for damage.

Barriers do not attack, apply Specials, or deal damage unless those effects are bought separately.

Barriers have **Dispel Resistance = Power Level** unless a specific Barrier says otherwise.

A Barrier can also be destroyed by reducing its HP to 0.

---

### 10.22 Not Included in Active Examples

The following effects are not missing from the Active template examples. They belong elsewhere or require dedicated subsystems.

- **Bulwark** is handled as a Reaction or Until-Used defensive effect.
- **Crit(X)** is handled only as the dedicated **Active Buff: Critical** premium subsystem. It is not an Until-Used rider and must not appear on Actives, Reactions, Passives, weapons, or combination entries.
- **Summons** require their own subsystem for body, action economy, duration, scaling, and dismissal.

Do not improvise Summon pricing from AoE, Images, Barriers, or Persistent Zone templates.

---

### 10.23 Template Output Instruction for the Agent

When the user asks for an Active, the Agent must determine the matching template family first.

Then the Agent should output:

- the requested Power or template,
- using the correct Active curve,
- with Range, AoE, Special, Duration, Images, Barrier HP, and damage priced separately,
- and with tooltip calculations showing each component.

If the user asks for a full catalog or template family, output the family as a clean Homebrewery-ready block.

If the user says they will append examples below the Agent file, do not duplicate the examples inside the rules. Add only governance, pricing, and interpretation rules here.
