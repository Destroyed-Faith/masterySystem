# Mastery System – Power & Spell SRD


<!--

MASTERy POWER DESIGN BUNDLE

Version: 1.1

Author: Daniel Rodrigo Navarro Melendo

Purpose: Canonical reference for balancing and building Powers in the Mastery System.

Canonical Sync: 2026-08-01

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


- A **Round** represents a full cycle in which **every creature** in combat has taken a Turn. Initiative is rolled once at the start of combat. The Initiative Order normally remains fixed for the rest of the combat unless a rule explicitly changes it.

- A **Turn** is your individual moment within that Round. During your Turn, you can move, act, and use Powers.


---


Duration Raises

When a Power or Spell has Duration: Instant, you may extend its duration through Raises on the activation roll.

Each additional Raise increases the duration one category along the Duration Table (Turn → Round → Minute → Hour → Day).


Effects that last longer than 1 Turn usually require concentration or may consume additional resources, at the GM’s discretion.


### Round Structure

1. **Start of Combat**
   - Roll Initiative once.
   - Add any initial Initiative bonuses, including the Initiative Passive.
   - Resolve the initial Initiative Shop.
   - Determine Initiative Order.
2. **Start of Each Round**
   - Refresh the normal Action Economy: 1 Movement, 1 Attack Action, and 1 Reaction.
   - Initiative is not rolled again.
   - The Initiative Shop does not reopen unless a rule explicitly allows it.
3. **Start of Each Turn**
   - Resolve start-of-turn effects.
   - For standard **Diminishing Stacks**, resolve **Tick, then Decay**.
   - For **Triggered Diminishing Effects** such as **Lacerate**, resolve only the listed trigger effect; they still decay normally unless their entry says otherwise.
   - Resolve the automatic Root decay described in the Root rules.
4. **Your Turn**
   - Use Movement and Attack Actions in any legal order.
   - Reactions are used when their chosen Trigger occurs.
5. **End of Turn / End of Round**
   - Resolve the appropriate end-of-turn and end-of-round effects.
   - Exhausted Stones regenerate at the normal end-of-round timing.
6. **New Round**
   - Continue with the existing Initiative Order.
   - A later Initiative effect may change Initiative, move a creature in the remaining order, or reopen the Initiative Shop only if it explicitly says so.

---

## 2. Power Types & Target Curves


## Types of Powers


Powers in the Mastery System are divided into **Actives**, **Active Buffs**, **Passives**, **Reactions**, and **Movement Powers**.

Each type follows different rules for how it is used in combat.


### Movement Powers

Movement Powers replace your normal Movement for the round.

They are used to change **how** you move, **where** you can move, or **what kind of movement path** you may take.

A Movement Power is not an Attack Action, not an Active Buff, not a Reaction, and not a Special-delivery system.

#### Normal Movement Baseline

A normal character can move **8 m** with their normal Movement.

When you use a Movement Power, the listed distance is your **total Movement for that Movement Power**.

It is not added on top of your normal 8 m Movement unless an entry explicitly says otherwise.

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

##### Critical Restriction

Critical is a closed offensive subsystem.

Critical may be granted only through:

1. the dedicated **Active Buff: Critical**, or
2. the **Agility Ability: Crit** Stone Ability.

The two sources use their own written structures:

- **Active Buff: Critical** grants the listed **Critical(X)** value while the Buff is maintained.
- **Agility Ability: Crit** grants **Crit(1)** to the number of attacks listed by the activated Tier.

Artifact, Echo, Potion, or other explicit Stone Power Support may pre-fill named Tiers of the **Agility Ability: Crit** Stone Ability. The character must still pay every required lower Tier. Stone Power Support never grants Critical directly.

An explicit source may also grant access to or activate **Active Buff: Critical**, but it may not recreate Critical as an independent rider.

No other Active, Passive, Reaction, Movement Power, weapon, Special, rider, aura, or combination entry may directly grant Critical.

Critical may not appear as a secondary rider and may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or filler value.

When Critical is gained through **Active Buff: Critical**, it uses the character's maintained Active Buff slot.

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

Common eligible examples include **Blight(X)**, **Challenge(X)**, **Corrode(X)**, **Disoriented(X)**, **Expose(X)**, **Hex(X)**, **Lacerate(X)**, **Mark(X)**, **Ruin(X)**, **Slow(X)**, **Soulburn(X)**, **Sundered(X)**, and **Weaken(X)**.

Common ineligible examples include **Stunned**, **Prone**, **Immovable**, **Mental Control**, binary **Immobilized**, or any other non-numeric control or lock, any Special without **(X)**, any full-turn denial, any full-reaction denial, any effect that modifies **Damage Reduction** or **Phasing**, **Barriers**, **Walls**, **Images**, **Summons**, **Illusion Fields**, and **Persistent Zones**.

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



#### Current Dedicated Active Buff Extensions

The current catalogue also contains these approved dedicated entries. They are exceptions with fixed structures and may not be generalized into new free-form axes:

- **Spell Resistance:** +2 Spell Resistance per Power Level; applies only to Spell-tagged Powers.
- **Cleanse Maintenance:** at the start of each Turn, reduce one eligible negative ongoing creature effect by an amount equal to the Power Level. The value cannot be split.
- **Damage Aura / Healing Aura:** self-centered maintained auras that trigger once at the end of each of the user's Turns. Radius bands are 2 m at Levels 1–7, 3 m at 8–14, and 4 m at 15–16. Use one payload only.
- **Growth Form:** dedicated size/transformation entry; use only its written catalogue progression.
- **Thorns:** Thorns 1d8 per Power Level, capped by final HP damage suffered from the triggering direct attack, Spell, or Power.
- **Invisibility:** +1 Invisibility Bonus per Power Level; blocks Normal Combat Awareness and may explicitly stack with Passive Invisibility.
- **Reinforced Parry:** requires Parry; may regain up to 2 Parry per Power Level each Round, never above the Pool with which the user entered Parry.
- **Intensified Absorption:** requires Absorption; the first successful Absorption harvest each Round gains +1 / +2 / +3 / +4 Temporary Colorless Stones at Levels 1–4 / 5–8 / 9–12 / 13–16.
- **Reinforced Damage Negation:** requires Damage Negation; gain a separate temporary Negation Pool equal to Power Level at the beginning of each Round. Spend it before the long-term Reserve. Both share the half-pool limit.
- **Artifact-only or Summon-only Auras:** use only when the entry explicitly restricts its recipients or source. They do not create a generic player aura axis.

### Reactions

Reactions are immediate answers to a specific Trigger. They are not a second Turn, a hidden Attack Action, or a miniature Active Power.

- **Cost:** 1 Reaction.
- **Normal limit:** 1 Reaction per Round unless another rule explicitly grants additional Reactions.
- **Duration:** Instant unless the entry explicitly says otherwise.
- **Roll:** None unless the entry explicitly requires one.
- **Scope:** A Reaction affects only the triggering Attack, hit, damage instance, effect, ally, or movement event described by the entry.

A Reaction is built from two parts:

1. a **Reaction Effect**, which defines what happens, and
2. a **Chosen Trigger**, which defines when that Reaction Effect may be used.

When a Reaction entry lists several Allowed Triggers, choose one when the Reaction is learned. The chosen Trigger becomes part of that Reaction and cannot normally be changed without retraining.

There is no universal Opportunity Attack rule. Movement is punished only by a Reaction whose chosen Trigger legally occurs.

#### Duplicate Reaction Rule

A character cannot learn or benefit from the same Reaction Effect more than once. If several sources grant the same Reaction Effect, use only the highest available version. Different Chosen Triggers do not create separate copies unless a rule explicitly says otherwise. Duplicate sources do not stack and do not grant additional uses.

#### Standard Trigger Catalogue

- **Attack Trigger:** when you are targeted by an attack; used before the attack result is finalized.
- **Hit Trigger:** when you are hit by an attack.
- **Damage Trigger:** when you would take damage, or after actual HP loss if the entry explicitly uses post-damage timing.
- **Incoming Effect Trigger:** when an eligible ongoing creature effect would be applied to you, before its first Tick or ongoing penalty.
- **Ongoing Effect Trigger:** when an eligible ongoing effect already affecting you would Tick, deal damage, or apply its listed penalty.
- **Ally Attack Trigger:** when an ally within range is targeted by an attack.
- **Ally Hit or Damage Trigger:** when an ally within range is hit or would take damage.
- **Threat Zone Movement Trigger:** when a hostile creature moves into, out of, or across the boundary of your Threat Zone. The creature must be in the Threat Zone when the Reaction resolves. One creature can trigger the same character's Threat Zone Reaction only once per Round. Forced movement triggers only when the forcing effect explicitly says it provokes movement-triggered Reactions. Safe Movement and the skipped path of Teleport do not trigger it.
- **Subsystem Trigger:** a dedicated closed subsystem may define a narrower Trigger.

#### Reaction Curve

Reactions use **20 PP per Power Level**:

20 / 40 / 60 / 80 / 100 / 120 / 140 / 160 / 180 / 200 / 220 / 240 / 260 / 280 / 300 / 320.

#### Reaction Governance

Standard Reactions may use Armor, Evade, Temporary HP, Ally Protection, Counter Damage, restricted mobility, restricted Cleanse, Initiative Gain, or a specifically approved subsystem interaction.

Damage Reduction, Phasing, Parry, Absorption, and other closed systems may only be used by their dedicated Reaction entries.

Reactions do not grant Attack Dice, Critical, Extra Attacks, free Attack Actions, full Active Powers, Special Application, hard control, or unrelated riders unless the dedicated entry explicitly defines an exception.

The current core catalogue includes:

- **Pure Defense:** Armor, Evade, Temporary HP.
- **Defensive Combinations:** Armor + Temporary HP, Evade + Temporary HP.
- **Ally Protection:** Ally Armor, Ally Evade, Ally Temporary HP.
- **Restricted Utility:** Reposition, Reactive Cleanse, Initiative Gain.
- **Closed Premium:** Damage Reduction, Phasing.
- **Counter Effects:** Counter Damage, Counter Damage + Push.
- **Restricted Special:** Special Increase.
- **Parry Extensions:** Riposte, Reflection.
- **Absorption Extension:** Reactive Overload.

#### Counter Effect Rules

Counter Effects are not attacks. They make no Attack Roll, generate no Raises, use no weapon damage unless the dedicated entry says otherwise, trigger no on-hit effects, apply no Specials, and gain no benefit from Critical or offensive Active Buffs.

**Counter Damage** and **Counter Damage + Push** may use the Hit Trigger or Threat Zone Movement Trigger when the entry lists both. Choose one Trigger when learning the Reaction.

- Hit Trigger: the triggering creature must be within the listed fixed range, normally 2 m.
- Threat Zone Movement Trigger: the creature must be in your Threat Zone when the Reaction resolves.
- Counter Damage costs 20 PP per 1d8.
- Counter Push costs 20 PP per 2 m and is capped at 8 m.
- The triggering creature applies its legal defenses normally.

#### Restricted Utility Rules

- **Reposition:** the triggering event resolves first; then move 2 / 4 / 6 / 8 m at Levels 4 / 8 / 12 / 15. This is normal legal movement, not Teleport, Evade, damage prevention, or automatic Safe Movement.
- **Reactive Cleanse:** affects exactly one triggering eligible Special and cannot split its value. Progression: 2, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12.
- **Initiative Gain:** uses the Attack Trigger and grants +2 Initiative per Power Level after the triggering attack resolves. It can change the remaining Initiative Order but can never grant a second Turn in the same Round.
- **Special Increase:** increases one already existing eligible Special(X); it never applies a Special by itself.

#### Parry and Absorption Reactions

- **Riposte:** requires Parry and a suitable melee or natural weapon. After Fully Parrying a direct melee Attack, spend 1 Reaction to deal Weapon Damage + 1d8 per Power Level. No Attack Roll, Raises, Critical, on-hit effects, or Specials. Each use costs a Reaction.
- **Reflection:** requires Parry. After Fully Parrying a single-target eligible Attack, spend 1 Reaction to redirect the original Attack back upon its source. Make no new Attack Roll. The source applies its legal defenses. Uses per Combat equal half MR rounded down, minimum 1: MR 1–3 = 1, MR 4–5 = 2, MR 6–7 = 3, MR 8 = 4. Reflection and Riposte cannot both answer the same Attack.
- **Reactive Overload:** requires Absorption. After eligible hostile damage removes actual HP, that HP loss counts twice at Levels 1–4, three times at 5–8, four times at 9–12, and five times at 13–16 for Absorbed Damage only. The real HP loss is not multiplied.

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

Characters gain Passive Slots by Mastery Rank:

| **Mastery Rank** | **Passive Slots** |
|:--:|:--:|
| **MR 1** | 1 |
| **MR 2** | 2 |
| **MR 3** | 3 |
| **MR 4** | 3 |
| **MR 5** | 4 |
| **MR 6** | 4 |
| **MR 7** | 5 |
| **MR 8** | 6 |

A character may slot only this many Passives. Every slotted Passive is active. There is no separate prepared-but-inactive state. A Passive that is not slotted provides no benefit. Passive choices cannot be changed during combat.

#### Passive Category Rule

A standard Passive belongs to exactly one Category. A Combined Passive belongs to exactly two approved Categories and counts as both for loadout and stacking purposes.

The mechanical Type is `Passive`. Prefer a separate Category field or column. When revising an existing catalogue entry, preserve that catalogue's current presentation style while keeping Type and Category mechanically distinct.

A Category is a real mechanical classification, not flavour text. The same Category may not be represented more than once in the character's active Passive loadout unless a dedicated subsystem explicitly says otherwise.

#### Allowed Passive Categories

| **Category** | **Role / Approved Use** |
|:--|:--|
| **Armor** | flat or conditional Armor |
| **Damage Reduction** | dedicated percentage mitigation after Armor |
| **Evade** | flat or conditional Evade |
| **Damage** | pure or conditional damage, including Thornhide |
| **Health** | additional Health Bars or approved structural Health |
| **Temporary HP** | start-of-combat defensive buffer |
| **Healing** | regeneration or conditional recovery |
| **Telepathy** | Telepathic Access, Mind Links, willing sense or memory sharing |
| **Phasing** | dedicated ignored-hit subsystem |
| **Special Aura** | increases one existing eligible Special(X) by +1 inside an aura |
| **Ward** | Spell Resistance or incoming eligible Special reduction |
| **Invisibility** | perception TN, target denial, and explicit Sense blocking |
| **Initiative** | initial Initiative Score bonus |
| **Parry** | dedicated Attack-Pool disruption subsystem |
| **Absorption** | additional real HP and Temporary Colorless Stone generation from hostile HP loss |
| **Damage Negation** | dedicated per-Combat Damage-Dice removal reserve |
| **Summon** | support for already existing Summon Bonds; does not create a Summon |

#### Removed Generic Categories

The following are not valid generic Passive Categories: Attack, Attribute, Roll, Control, or generic Special.

#### Passive Restrictions and Explicit Exceptions

Passives do not normally grant permanent Attack Dice, permanent Attribute increases, generic Roll bonuses, free attacks, Extra Attacks, Actions, Reactions, Movement Powers, hard control, generic Special Application, or hidden Active effects.

The following dedicated exceptions are canonical and must not be generalized:

- **Absorption** may generate Temporary Colorless Stones from eligible actual HP loss.
- **Bound Host** may grant Summon Tokens to existing Summon Bonds.
- **Parry** may remove Attack Dice from eligible direct Attacks through its dedicated Pool.
- **Damage Negation** may remove Damage Dice through its dedicated combat Reserve.
- **Ward** may reduce incoming eligible hostile Specials before application.
- **Special Aura** may increase one existing eligible Special(X) by +1 inside its aura.
- **Invisibility** may block Combat Senses and modify Perception TN according to the Invisibility subsystem.

A Passive may never use the Spell or Charged tag. It may not casually combine unrelated premium defensive systems. Damage Reduction, Phasing, Parry, Absorption, Damage Negation, Ward, and Invisibility use only their approved dedicated entries or explicit catalogue extensions.


### Combat Senses and the Sense Slot

Combat Senses are governed by the Core Rulebook and are not Passive Powers.

- Every character has exactly **one Sense Slot**.
- The Sense Slot contains **Normal Combat Awareness** by default.
- Echoes, Artifacts, Species, Powers, and story features may grant additional **Sense Options**.
- A Sense Option does not use a Passive Slot, does not consume an Artifact Base Value, and does not create another Sense Slot.
- Before a scene, before the first Perception roll, choose which known Sense occupies the Sense Slot. In combat, choose before Initiative is rolled.
- If no choice is declared, Normal Combat Awareness remains active.
- Knowing several Sense Options increases preparation choices only. Several Special Combat Senses never operate simultaneously unless an explicit rule creates an exception.
- A character still receives ordinary narrative information through sight, hearing, smell, touch, and similar senses. The active Sense determines mechanical perception and targeting when darkness, Invisibility, smoke, silence, concealment, or another Sense-specific obstacle matters.

Do not create an **Awareness Passive**, **Heightened Senses Passive**, Awareness Combined Passive, or Awareness half-budget axis. New Special Combat Senses must be granted as Sense Options and use the single Sense Slot.

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
- **Challenge(X)**
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
- **Prone**
- **Mental Control**
- any non-numeric control state or Power lock
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
> Damage Reduction is always applied **after Armor**. A character may combine Armor and Damage Reduction from separate legal sources. The dedicated Damage Reduction Power lines themselves may not bundle Armor or another filler axis.

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
| **Challenge(X)** | **6** | X = Attack Pool reduction against non-challenger targets | Challenge is source-bound. Reduce Attack Pools by **X** when the attack does not include the challenger as a target, to a minimum of Mastery Rank. | Yes |
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

#### Challenge Rule

Challenge is a source-bound Diminishing Special that creates target pressure without forcing behavior.

- When Challenge is applied, record the applying creature as the **challenger**.
- Whenever the affected creature builds an **Attack Pool** for an attack that does **not** include the challenger as a target, remove **X dice** from that pool.
- If the attack includes the challenger as one of its targets, Challenge does not reduce that Attack Pool.
- Challenge does not force movement, targeting, or action choice.
- Challenge reduces Attack Pools only. It does not reduce Attributes, Keep, Damage Pools, Evade, non-attack checks, or derived values.
- Apply Challenge with other flat pool changes before the percentage-based Health Penalty.
- The final Attack Pool cannot be reduced below **Mastery Rank**.
- A creature can have only one challenger at a time. Reapplication from the same challenger adds stacks normally. A different source replaces the current Challenge only if the newly applied value is higher.
- Challenge decays by 1 at the start of the affected creature's turn and may be reduced by Cleanse.

Challenge uses **Start PP 6**. It is cheaper than Disoriented, Weaken, or Soulburn because its penalty is conditional and can be avoided by including the challenger as a target. It must not be treated as Mental Control, behavior control, Taunt, or forced targeting.

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
Use **Start PP 6** for **Challenge**, **Corrode**, **Hex**, **Sundered**, and **Root**.
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
| **Critical / Crit** | **closed subsystem** | Active Buff rank or number of **Crit(1)** attacks | Buff Duration / this Round | Critical may function only through **Active Buff: Critical** or the **Agility Ability: Crit** Stone Ability. Explicit support may grant access to the Buff or pre-fill named Stone Ability Tiers, but it never creates an independent Critical rider. | No |
| **Immovable** | **80 PP** | fixed effect | Buff Duration | You are immune to **Push**, **Pull**, **Prone**, and forced movement while the effect lasts. | No |
| **Root(X)** | **Start PP 6 × T(X)** | X = Break Strength; minimum applied value 2 | Until X reaches 0 | Your Speed becomes **0 m** and you cannot move voluntarily. At the start of your Turn, reduce Root by your Mastery Rank. You may also spend an Action, Movement Action, or Reaction on a Vitality Attribute Check against **TN 8 × source MR**; success reduces Root by 1, plus 1 per Raise. | Yes |

> **Design Note — Until Used Effects**
> These effects are priced for stored value: they do nothing until the right moment, then convert into a strong spike of offense or defense.
> Because they are more controllable than normal Timed effects, they should remain narrow and clearly defined.

> **Critical Update:**
> Critical is not a general Until Used rider. It exists only through the dedicated **Active Buff: Critical** or the **Agility Ability: Crit** Stone Ability. Explicit sources may grant access to the Buff or pre-fill named Tiers of the Stone Ability, but they must not place Critical directly on Actives, Passives, Reactions, weapons, Specials, or combination entries.

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

| **Challenge Attack-Pressure Reduction** | Start PP 6 × T(X) | Source-bound Diminishing Special; affects only attacks that do not include the challenger as a target. |
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

Use the relative value of the movement mode. Normal Movement is **8 m** for every character unless a specific rule explicitly replaces that value.

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

## 9. Canonical Catalogue Governance

This section is the current catalogue index. Do not reconstruct removed legacy powers or introduce a new axis merely because unused PP remains.

### 9.1 Active Buff Catalogue

#### Standard Pure and Combination Entries

- Armor
- Evade
- Armor Aura
- Temporary HP
- Healing
- Armor + Temporary HP
- Evade + Temporary HP
- Temporary HP + Healing
- Armor + Evade
- Damage
- Penetration
- Damage + Penetration

#### Closed or Dedicated Entries

- Damage Reduction
- Phasing
- Critical
- Special Overdrive
- Spell Resistance
- Cleanse Maintenance
- Damage Aura
- Healing Aura
- Growth Form
- Thorns
- Invisibility
- Reinforced Parry
- Intensified Absorption
- Reinforced Damage Negation
- explicit Artifact-only or Summon-only aura entries

The following remain forbidden as generic Active Buffs: Attack Dice, Extra Attacks, free Attack Actions, Damage + Critical, Damage + Special Application, Special Application, Detection/Reveal/Sensor Buffs, hidden Movement, and hard control.

### 9.2 Reaction Catalogue

- Pure Defense: Armor, Evade, Temporary HP.
- Defensive Combinations: Armor + Temporary HP, Evade + Temporary HP.
- Ally Protection: Ally Armor, Ally Evade, Ally Temporary HP.
- Restricted Utility: Reposition, Reactive Cleanse, Initiative Gain.
- Closed Premium: Damage Reduction, Phasing.
- Counter Effects: Counter Damage, Counter Damage + Push.
- Restricted Special: Special Increase.
- Parry: Riposte, Reflection.
- Absorption: Reactive Overload.

The following remain forbidden as generic Reactions: Attack Dice, Special Application, normal Counter Attacks, Counter Specials, Critical riders, hard control, pure Push, Ally Push, Ally Reposition, Evade + Reposition, and any hidden full Active Power.

### 9.3 Passive Catalogue

The standard catalogue includes pure, conditional, combined, and conditional-combined Armor, Evade, Damage, Health, Temporary HP, and Healing entries, plus the following dedicated systems:

- Damage Reduction
- Phasing
- Special Aura
- Spell Resistance
- Ward
- Telepathy
- Bound Host
- Thornhide
- Passive Invisibility
- Initiative
- Parry
- Absorption
- Damage Negation

A catalogue entry may use a dedicated exception without making that exception generally available to all Passive design.

### 9.4 Movement Catalogue

Normal Movement is **8 m**. A Movement Power replaces that Movement and lists its total distance.

Approved entries:

- Ground Dash — cap 34 m.
- Safe Movement — cap 20 m.
- Teleport — cap 16 m.
- Teleport with Ally — cap 12 m.
- Flight — cap 24 m.
- Leap — cap 28 m horizontal / 14 m vertical.
- Wall Walk — cap 28 m.
- Burrow — cap 16 m through suitable material.
- Phase Passage — cap 8 m material thickness; traversal only, never defensive Phasing.
- Trample — cap 24 m path / 8d8 contact damage.

Movement + Attack Dice, Critical, Special Application, Special Increase, next-hit Damage, Penetration, defensive buffs, hard control, or hidden Reaction dodges remain forbidden.

### 9.5 Active Catalogue Additions

The current Active catalogue also recognizes:

- Health Level Heal as a structural recovery Support Active. The recovery pool refreshes on Safe Haven Rest and costs 30 PP per recoverable Health Level.
- Cleanse Absorption as a fixed catalogue Support progression; do not rebuild it as full standalone Cleanse plus full standalone buff value.
- Weapon Attack templates: Single Weapon Attack, AoE Weapon Attack, Split Attack, Split AoE, and Autofire.
- Smite as an Artifact, relic, divine weapon, vow, blessing, or story-reward effect rather than a freely selectable generic Active family.
- Mental Attack, Mind Illusion, Mind Probe, and Mental Control under the Telepathy governance rules.

### 9.6 Tooltip Requirement

Catalogue entries must include BASELINES, DESIGN STRUCTURE, a level-by-level calculation or progression, and NOTES explaining restrictions, caps, milestones, or unused PP.

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
| **Heavy Group** | Start PP 6 | Challenge, Corrode, Hex, Sundered, Root |
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
- **Critical / Crit** is handled only through the dedicated **Active Buff: Critical** or the **Agility Ability: Crit** Stone Ability. It is not a generic Until-Used rider and must not appear as an independent effect on Actives, Reactions, Passives, weapons, or combination entries.
- **Summons** use the dedicated canonical subsystem in **Section 11.14** for Bodies, action economy, scaling, Skills, Powers, destruction, and dismissal.

Do not improvise Summon pricing from AoE, Images, Barriers, Persistent Zone templates, or separate Familiar, Companion, and Host Chassis.

---

### 10.23 Mental Power Governance

Mental Powers are a dedicated Active family built around the **Telepathy Passive**.

#### Telepathy Passive

Telepathy is the only standard Passive that grants **Telepathic Access**.

Mind Link is included inside Telepathy. It is not a separate Power and does not require another Passive Slot.

Telepathy may provide:

- silent voluntary communication,
- voluntary Mind Links,
- shared images, emotions, and simple sensory impressions,
- willing sense sharing,
- willing memory sharing,
- and limited awareness of thinking presence where the catalogue explicitly grants it.

Telepathy may not:

- read or search an unwilling mind,
- force disclosure,
- deal damage,
- apply Specials,
- control creatures,
- or hide an Active effect inside the Passive.

The Telepathy Passive level is the maximum level of Mental Attack, Mind Illusion, Mind Probe, and Mental Control unless a specific rule says otherwise.

#### Telepathic Access

A creature has Telepathic Access to a target when:

- its Telepathy Passive reaches a target it can perceive or whose location it knows,
- the target is part of its willing Mind Link,
- the target is already affected by one of its Mental Powers,
- or a specific Power explicitly creates access.

Telepathic Access alone reveals no thoughts, memories, identity, or hidden information.

#### Mental Power Resolution

Mental Attack, Mind Illusion, Mind Probe, and Mental Control resolve like Spells against the normal fixed TN for their Power Level increased by **+4**.

A successful Mental Power resolves its listed effect without an automatic second defensive roll.

A later **Wits** or **Intellect** Attribute Check exists only when the Power explicitly grants a disbelief, break, or intrusion response.

Use:

- **Wits** for immediate mental intrusion, manipulated awareness, doubt, and breaking imposed control.
- **Intellect** only for analytical, memory-structured, or logically constructed recognition when the Power explicitly names it.

#### Core Mental Actives

| **Power** | **Function** | **Core Restriction** |
|:--|:--|:--|
| **Mental Attack** | Direct Mental Damage. | 30 PP per +1d8; ignores Armor; does not target Evade. |
| **Mind Illusion** | False perception inside affected minds. | No real battlefield matter and no direct action control. |
| **Mind Probe** | Reads thoughts, intentions, facts, and memories. | One listed information result per use; reads the target's remembered understanding, not objective truth. |
| **Mental Control** | Temporary noncombat instructions, attitudes, beliefs, or behavioral programs. | Only creatures with lower MR; never creates combatants; cannot be activated during combat. |

Mind Probe and Mental Control are fixed qualitative catalogue families. Do not convert their milestones into generic numeric riders.

#### Mind Probe Rules

Mind Probe:

- requires Telepathic Access,
- affects one creature unless its catalogue entry says otherwise,
- may read only the depth allowed by its level,
- cannot discover knowledge the target never possessed,
- returns memories as the target remembers them,
- does not alter, erase, or implant memories,
- and does not control actions.

An unwilling target knows that its mind was probed after resolution unless a specific higher-level effect explicitly conceals the intrusion.

#### Mental Control Rules

Mental Control:

- requires Telepathic Access,
- affects only creatures whose MR is strictly lower than the user's MR,
- cannot be activated after Initiative begins or against a creature currently participating in combat,
- ends before a controlled creature takes its first combat action,
- cannot order attacks, offensive Powers, self-harm, obvious suicide, or clearly lethal danger,
- cannot force limited combat resources to be spent,
- cannot permanently rewrite personality, loyalty, love, identity, conviction, or memory,
- and cannot replace Summon, Companion, or combat-control Powers.

A target may receive a later Wits Attribute Check against the original Mental Power TN only when the imposed control directly collides with a defining conviction, deeply held bond, or clear severe-harm contradiction. This is not an automatic resistance roll on application.

#### Excluded Mental Conditions and Lock Effects

Do not create separate core Specials or standard Power families named **Frightened**, **Charmed**, or **Confused**.

- Noncombat emotional or behavioral influence belongs to Mental Control.
- False perception belongs to Mind Illusion.
- Combat impairment belongs to existing Specials such as Disoriented, Weaken, or Soulburn.

Do not create standard player Powers or core Specials named **Silence**, **Null Field**, or **Power Lock**.

An adventure, location, Artifact, monster, or explicit narrative effect may prohibit a named Power, Special, or Power tag, but it must write that exception directly and must not be treated as a universal subsystem.

---

### 10.24 Template Output Instruction for the Agent

When the user asks for an Active, the Agent must determine the matching template family first.

Then the Agent should output:

- the requested Power or template,
- using the correct Active curve,
- with Range, AoE, Special, Duration, Images, Barrier HP, and damage priced separately,
- and with tooltip calculations showing each component.

If the user asks for a full catalog or template family, output the family as a clean Homebrewery-ready block.

If the user says they will append examples below the Agent file, do not duplicate the examples inside the rules. Add only governance, pricing, and interpretation rules here.

---

## 11. Current Cross-System Canon

This chapter overrides older text in this SRD if a duplicated rule survived an earlier revision.

### 11.1 Initiative Canon

- Roll Initiative once at the start of combat.
- Add Combat Reflexes spending and the Initiative Passive before the initial Initiative Shop finishes.
- The remaining Initiative Score determines Initiative Order.
- Initiative Order normally remains fixed for the rest of combat.
- Do not reroll Initiative or reopen the Initiative Shop each Round.
- Initiative Gain and explicit Wits Stone Powers may alter Initiative or reopen the Shop according to their own wording.
- A creature can never gain a second Turn in the same Round from an Initiative change.

### 11.2 Canonical Defense Resolution Order

When relevant, resolve defenses in this order. Skip steps the character does not possess.

1. Build the Attack Pool and declare targets, Raises, and split assignments.
2. Apply **Parry** and other legal Attack-Pool changes before rolling.
3. Roll against **Evade**.
4. If the Attack misses or is Fully Parried, stop.
5. Resolve **Phasing** or another effect that ignores the entire hit.
6. Apply **Ward** to each incoming eligible hostile Special before that Special is applied.
7. Build the Damage Pool assigned to the character.
8. Apply **Damage Negation** before rolling Damage Dice.
9. Roll remaining Damage Dice.
10. Apply **Armor**.
11. Apply **Damage Reduction** after Armor.
12. If Armor and Damage Reduction reduce damage to 0 or less, apply minimum damage from natural 8s using only Damage Dice that were actually rolled.
13. Apply Temporary HP or another legal damage buffer.
14. Apply remaining damage to real HP.
15. Resolve **Absorption** from actual hostile HP loss only.

### 11.3 Ward and Spell Resistance

**Spell Resistance** increases the Base TN of Spell-tagged Powers against the protected creature. It does not affect non-Spell attacks or effects.

- Passive Spell Resistance progression: 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21.
- Active Buff Spell Resistance progression: +2 per Power Level.
- Cost baseline: 15 PP per +1 Spell Resistance.

**Ward** reduces every incoming eligible hostile Special(X) before application. Apply the full Ward value separately to each eligible Special delivered by the same effect. If reduced to 0 or less, that Special is not applied. Ward does not remove existing Specials and is not Cleanse.

Ward progression: 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10.

Eligible examples: Blight, Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Root, Ruin, Slow, Soulburn, Sundered, Weaken. Ward does not affect damage, Attack Dice, forced movement, Prone, Disarm, Stunned, battlefield objects, or effects requiring Dispel.

### 11.4 Invisibility Canon

Invisibility is a perception and target-access subsystem, not Evade or damage prevention.

- Passive Invisibility grants a stable Invisibility Bonus and blocks Normal Combat Awareness. At Levels 4 / 8 / 12 / 15 it additionally blocks 1 / 2 / 3 / 4 chosen Special Combat Senses.
- Passive Invisibility Bonus progression: 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10.
- Active Buff Invisibility grants +1 Invisibility Bonus per Power Level and blocks Normal Combat Awareness only.
- Passive and Active Buff Invisibility explicitly stack; add their bonuses and combine blocked Senses.
- Perception TN = normal Skill Check TN by the invisible creature's MR + current Invisibility Bonus + any Stealth Raise Bonus.
- Direct targeting through a blocked Sense requires a successful Perception Check. Failure does not spend the action; choose another legal target or action.
- Cloak Disruption reduces the current Invisibility Bonus until the start of the invisible creature's next Turn: direct attack −4, hostile Spell −4, hostile Power −4, qualifying visible Reaction −4, final HP damage −4, and −4 for every full 4 m voluntarily moved. Moving more than 3 m also removes a Stealth Raise Bonus.
- Invisibility does not stop Area Effects, zones, environmental damage, or effects that do not require precise targeting.

### 11.5 Parry Canon

Parry is a primary Defense Pillar.

- Requirement: suitable melee weapon, shield, natural weapon, or explicit Parry implement.
- Choose Might or Agility as the Parry Attribute when learning the Passive.
- At the beginning of the Turn, enter Parry until the beginning of the next Turn.
- While Parrying, no Attack Action or additional Attack Action may be used. Movement and Reactions remain available.
- Parry Pool = chosen Attribute, capped at 5 × Parry Power Level.
- Before an eligible direct Attack Roll, spend 1 Parry to remove 1 Attack Die assigned to you.
- If fewer dice remain than Keep, roll and keep all remaining dice.
- If the Attack Pool reaches 0, the Attack is Fully Parried: no roll, hit, damage, Special, or on-hit effect.
- Parry does not normally affect Area Attacks, Area Effects, environmental or ongoing damage, automatic damage, Persistent Zones, or effects without an Attack Roll.
- Parry removes Attack Dice, never Damage Dice.

Dedicated extensions:

- **Reinforced Parry:** regain up to 2 × Power Level spent Parry per Round, never above the entry Pool.
- **Riposte:** after a Fully Parried direct melee Attack, Weapon Damage + 1d8 per Reaction Power Level.
- **Reflection:** after a Fully Parried single-target eligible Attack, redirect the original Attack to its source. Uses per Combat are based on MR as stated above.

### 11.6 Absorption Canon

Absorption does not prevent damage. It increases real HP in every normal Health Bar and converts eligible hostile actual HP loss into short-lived Temporary Colorless Stones.

- Each Absorption Power Level adds +4 Maximum HP to every normal Health Bar.
- Health Bar size = Vitality × 2 + Absorption HP.
- The Incapacitated box is unchanged.
- Track actual hostile HP loss after all prevention and buffers.
- Whenever accumulated Absorbed Damage reaches Vitality, subtract Vitality and gain 1 Temporary Colorless Stone. Excess carries over.
- Stones are gained Ready, may pay as any Attribute Stone, disappear when spent instead of becoming Exhausted, and expire at the end of the character's next Turn.
- They cannot be stored, regenerated, transferred, Sealed, Bound, Burned, invested, used outside combat, or used for permanent requirements.
- Prevented damage, Temporary HP loss, self-damage, HP costs, own Powers, and willing-ally damage do not count.
- Remaining accumulated damage disappears when combat ends.

Only the dedicated Absorption subsystem may generate Temporary Colorless Stones from lost HP.

### 11.7 Damage Negation Canon

Damage Negation removes Damage Dice after a hit creates a Damage Pool but before those dice are rolled.

- Passive Reserve = 4 × Power Level per Combat.
- Spend 1 Reserve to remove 1 Damage Die.
- All Damage Negation combined can remove at most half of the original Damage Dice, rounded down.
- The Reserve does not refresh during the same combat and is lost when combat ends.
- It does not change whether the Attack hit and does not remove Specials, on-hit effects, control, forced movement, flat damage, or other payload.
- It may combine with other legal defenses, but a Damage Negation Power itself may not bundle another axis.
- **Reinforced Damage Negation:** temporary Pool equal to Active Buff Level at the beginning of each Round; spend it first, lose leftovers on refresh, and share the same half-pool limit.

### 11.8 Initiative Powers

- **Initiative Passive:** +2 Initiative per Power Level. Add it once to the initial Initiative Score before the initial Shop. It does not reopen the Shop.
- **Reaction: Initiative Gain:** uses the Attack Trigger and grants +2 Initiative per Power Level after the triggering attack resolves. If the user has not acted, move them in the remaining order; if the new position has passed, act immediately after the current Turn. If already acted, the new position applies next Round. Never grant an extra Turn.

### 11.9 Thorns Canon

Thorns is reflected damage, not an attack and not a Special.

- Trigger only after the user takes final HP damage from a direct attack, Spell, or Power.
- Resolve after the triggering effect is complete.
- Thorns damage cannot exceed the final HP damage taken from that effect.
- If no final HP damage is taken, Thorns deals no damage.
- Thorns makes no Attack Roll, generates no Raises or Critical, applies no Specials or on-hit effects, and cannot trigger Thorns.
- Passive Thornhide uses the Damage Category and costs 30 PP per 1d8.
- Active Buff: Thorns grants 1d8 per Power Level.

### 11.10 Active Buff Aura Canon

Active Buff Auras are dedicated self-centered exceptions. They move with the user and trigger once at the end of each of the user's Turns.

- Radius: 2 m at Levels 1–7, 3 m at Levels 8–14, 4 m at Levels 15–16.
- A creature can be affected by the same aura only once per Round.
- Entering, leaving, or being crossed by the aura does not trigger it.
- Use exactly one payload: Damage or Healing.
- Damage and Healing Aura payloads cost 35 PP per 1d8 after radius cost.
- They never apply or increase Specials and may not add another defensive, offensive, movement, or action-economy axis.

### 11.11 Current Active Support and Weapon Structures

**Health Level Heal** is structural recovery, not normal HP Healing.

- 30 PP per Health Level recoverable per Safe Haven Rest.
- The recovery pool may be spent across several uses.
- It cannot exceed the creature's normal maximum Health Level structure.
- A pure Health Level Heal does not restore HP.

**Cleanse Absorption** is a fixed catalogue Support progression. It reduces one eligible Special and grants its chosen Absorption Bonus only if the full listed Cleanse value is actually spent on that one Special. Do not divide Cleanse and do not price the Power as unrestricted full Cleanse plus unrestricted full buff.

**Weapon Attack Templates:**

- Single Weapon Attack: one normal weapon attack; full weapon damage plus listed bonus damage.
- AoE Weapon Attack: one AoE Attack Roll; affected creatures take the printed weapon/AoE damage according to the entry.
- Split Attack: split Attack Pool before rolling and split one total Damage Pool among successful hits; do not multiply weapon damage.
- Split AoE: split Attack Pool and one total Damage Pool among successful placements; a creature is affected only once unless explicitly stated.
- Autofire: one Primary Target gets the full payload; additional targets reached through Raises receive only printed weapon damage unless the entry explicitly says otherwise.

**Smite** is not a freely selectable generic Active family. It may be granted by Artifacts, relics, divine weapons, vows, blessings, or major story rewards. Smite(X) adds +Xd8 against valid tags, normally Undead and Fiends.

### 11.12 Root Canon

Root(X) is a numeric movement-lock with Start PP 6 triangular pricing.

- A Power applying Root must apply at least Root(2).
- While Root is above 0, Speed is 0 m and voluntary movement is impossible.
- Root does not prevent attacks, Spells, Reactions, non-movement actions, or forced movement.
- At the start of the affected creature's Turn, reduce Root by that creature's Mastery Rank.
- The creature may additionally spend an Action, Movement Action, or Reaction on a Vitality Attribute Check against TN 8 × source MR. Success reduces Root by 1; each Raise reduces it by 1 more.
- Cleanse may reduce Root normally.
- Root ends at 0.

### 11.13 Artifact and Echo Interaction

Artifacts and Echoes may grant access to existing catalogue Powers at a stated Power Level. They do not rewrite the Power's subsystem rules.

- An Artifact may grant access to or activate **Active Buff: Critical**, or provide Stone Power Support that pre-fills named Tiers of the **Agility Ability: Crit** Stone Ability. It may not grant Critical as an independent weapon rider.
- An Artifact may grant Parry, Riposte, Reflection, Ward, Damage Negation, Absorption, Invisibility, or another dedicated system only by explicitly naming the legal catalogue entry or an approved Artifact-specific exception.
- Duplicate Reaction sources use the highest version and do not create extra Reaction uses.
- Artifact functions do not bypass maintained Active Buff limits, Reaction limits, Passive Slots, Trigger rules, or closed-subsystem restrictions unless the function explicitly says so.

### 11.14 Summon System Canon

The following rules are the complete canonical Summon subsystem. Do not construct Summons from AoE, Image, Barrier, Companion, or improvised minion pricing. Do not introduce Familiar, Companion, or Host Chassis.

Summons are creatures created through **Bound Stones** and improved with **Summon Tokens**.

Every Summon uses the same mechanical foundation. There are no separate Familiar, Companion, or Host classes.

A Summon may be expressed as a beast, spirit, demon, construct, undead, elemental, shadow, echo, weapon-shard, swarm, plant-creature, memory, or any other fitting form.

The mechanics define what the Summon can do.

The player defines what the Summon is.

---

#### Creating a Summon Bond

To create a Summon Bond, bind at least **1 Stone**.

A Bound Stone is removed from the character's usable Stone Pool and does not regenerate while the bond persists.

Every Bound Stone grants **8 Summon Tokens**, including the first Stone.

**Formula:**  
**Summon Tokens = Bound Stones x 8**

| **Bound Stones** | **Summon Tokens** |
|:--:|:--:|
| 1 | 8 Tokens |
| 2 | 16 Tokens |
| 3 | 24 Tokens |
| 4 | 32 Tokens |
| 5 | 40 Tokens |
| 6 | 48 Tokens |
| 7 | 56 Tokens |
| 8 | 64 Tokens |
| 9 | 72 Tokens |
| 10 | 80 Tokens |

Bonus Summon Tokens granted by a Passive, Artifact, Active Buff, or other explicit rule are added after this calculation. Bonus Tokens do not count as additional Bound Stones and remain subject to every spending restriction written by their source.

---

#### Universal Base Summon

| **Stat** | **Starting Value** |
|---|:--:|
| HP | 10 |
| Armor | 0 |
| Evade | 4 |
| Attack | 2d8 |
| Damage | 1d8 |
| Movement | 8 m in one chosen Movement Mode |
| Attacks | 1 Summon Attack |
| Specials | None |
| Shared Senses | None |
| Bodies | 1 Summon Body |

The Base Summon is intentionally simple. Tokens determine whether it becomes a durable guardian, an elite attacker, a scout, a group of weak bodies, or another concept.

---

#### One Movement Mode

When the Summon Bond is created, choose exactly **one Movement Mode** that fits its Expression:

- Walking
- Flying
- Swimming
- Climbing

All Bodies belonging to that Summon Bond use the chosen Movement Mode.

The selected Movement Mode begins at **8 m** and may be increased to a maximum of **16 m**.

The same Movement Mode may be improved more than once. A Summon Bond may never buy or possess a second permanent Movement Mode through Summon Tokens.

Teleport, Burrow, Phase Passage, and similar premium movement are not normal Movement Modes. They require a canonical Movement Power or another explicit rule.

A purchased Movement Power temporarily replaces normal Movement when used. It does not grant a second permanent Movement Mode.

---

#### Summon Token Costs

Summon Tokens may buy improvements to the Bond, to an individual Body, or to the Bond's selected Skill Pools.

| **Upgrade** | **Scope** | **Starting Value** | **Cost** | **Gain** |
|---|---|:--:|:--:|---|
| HP | Body | 10 HP | 1 Token | +20 HP |
| Armor | Body | 0 Armor | 2 Tokens | +4 Armor |
| Evade | Body | 4 Evade | 2 Tokens | +4 Evade |
| Attack | Bond | 2d8 Attack | 2 Tokens | +2d8 Attack Dice |
| Damage | Bond | 1d8 Damage | 2 Tokens | +1d8 Damage |
| Movement | Bond | 8 m | 1 Token | +2 m in the chosen Movement Mode |
| Additional Body | Body | 1 Body | 2 Tokens | +1 Summon Body |
| Shared Sense | Body | None | 2 Tokens | +1 Shared Sense Group |
| Summon Skill Dice | Bond | None | 1 Token | +2 Skill Dice to distribute |
| Extra Attack | Bond | 1 Attack | 8 Tokens | +1 Summon Attack |
| Special Access | Bond | None | 4 Tokens | Unlock 1 eligible Special at Special(1) |
| Special Value | Bond | Special(1) | 2 Tokens | Increase the chosen Special by +1 |
| Canonical Power | Body | None | Special | Pay 1 Token per 10 PP, rounded up |

---

#### Upgrade Scope

**Bond Upgrades** apply once to the entire Summon Bond. All Bodies use the Bond's Attack, Damage, Movement, available Summon Attacks, selected Special, and Summon Skill Pools.

**Body Upgrades** are assigned to one specific Summon Body. HP, Armor, Evade, Shared Senses, and purchased Powers do not automatically transfer to another Body.

An Additional Body begins with the Universal Base Summon's Body values:

- 10 HP
- 0 Armor
- 4 Evade

It then uses the Bond's Attack, Damage, Movement, Summon Attacks, Special, and Skill Pools.

---

#### Upgrade Limits

| **Upgrade** | **Limit** |
|---|---|
| Movement | Maximum 16 m; only the one chosen Movement Mode. |
| Extra Attack | Maximum 3 Summon Attacks per Bond per Round. |
| Special Access | Maximum 1 Special per Bond. |
| Special Value | Maximum Special(4). |
| Summon Skills | Two to four selected Skills, based on Bound Stones. |
| Canonical Powers | Maximum Power Level is set by the owner's Mastery Rank. |

HP, Armor, Evade, Attack, and Damage have no separate Summon maximum. Their practical limit is the available Token investment.

---

#### Multiple Bodies and Summon Attacks

Additional Bodies do not grant additional Summon Attacks by themselves.

All Bodies share one Summon Activation and the number of Summon Attacks purchased for the Bond.

Each available Summon Attack may be made by any active Body. Several attacks may be made by the same Body or divided between different Bodies.

If the Bond has a Special, that Special may apply only **once per Round**, regardless of how many Bodies or Summon Attacks the Bond has.

Multiple Bodies do not receive repeated attempts at the same non-combat task.

> **One task allows one Summon Skill Check per Bond.**

---

#### Summon Activation

Summons act on the owner's Initiative.

At the start of each Round, the owner chooses whether the Summon Bond acts immediately before or immediately after them.

During the Summon Activation:

- every active Body may move once,
- the Bond may use its available Summon Attacks,
- and purchased Powers may be used through their normal action type.

Summons cannot delay, ready, or select a separate Initiative count.

Summons cannot use Stone Abilities or Artifacts, cannot create another Summon Bond, and cannot bind Stones of their own.

---

#### Summon Skills

A Summon does not receive Attributes or the complete character Skill system.

Instead, the Bond selects a limited number of Skills from the approved Summon Skill list.

| **Bound Stones** | **Selected Summon Skills** |
|:--:|:--:|
| 1 | 2 Skills |
| 2 | 3 Skills |
| 3 or more | 4 Skills |

Bonus Summon Tokens do not increase the number of selected Skills.

The approved Summon Skills are:

- Perception
- Investigation
- Tracking
- Survival
- Navigation
- Weather Sense
- Stealth
- Concealment
- Athletics
- Acrobatics

Social Skills, Martial Skills, Lore Skills, Medicine, Crafting, Engineering, Artisanry, Alchemy, Herbalism, and other professional Skills are not Summon Skills.

---

#### Buying and Distributing Skill Dice

Each **Summon Skill Dice** purchase costs **1 Token** and grants **2 Skill Dice**.

These dice may be divided freely among the Bond's selected Summon Skills, including one die at a time.

The number of dice assigned to a Summon Skill may never exceed the owner's current Rating in the same Skill.

If the owner has Rating 0 in a Skill, the Bond cannot assign dice to that Skill.

##### Example

The owner has:

- Perception 4
- Stealth 3
- Tracking 2

The Bond has bought 4 Skill Dice. It may distribute them as:

- Perception 2d8
- Stealth 1d8
- Tracking 1d8

It could instead assign all 4 dice to Perception, but it could not assign 4 dice to Stealth because the owner's Stealth Rating is only 3.

---

#### Summon Skill Checks

When a Summon independently performs a selected Skill task, roll its assigned Skill Dice and keep dice equal to the owner's Mastery Rank.

> **Summon Skill Check = assigned Skill Dice k owner's Mastery Rank**

The number of kept dice can never exceed the number of dice rolled.

Summon Skill Pools are not consumable Skill Points. They are the complete dice pool used for the Summon's independent check.

All Bodies share the same selected Skills and Skill Dice. Body count never grants repeated rolls for one task.

---

#### Shared Senses

A Shared Sense is assigned to one Body.

| **Shared Sense Group** | **Cost** |
|---|:--:|
| Sight | 2 Tokens |
| Hearing | 2 Tokens |
| Taste / Smell | 2 Tokens |
| Touch / Pressure | 2 Tokens |

When the owner actively perceives through a Body's Shared Sense, the owner uses their own normal Attribute, Skill Rating, Skill Points, and Mastery Rank, but perceives from the Body's position and through that Sense Group.

When the Summon observes independently, it uses the Bond's purchased Summon Skill Pool instead.

Switching between the owner's senses and a Summon's Shared Senses costs a Minor Action.

Shared Senses grant sensory access only. They do not grant automatic success, knowledge, analysis, or additional Skill checks.

---

#### Purchasing Canonical Powers

Summons do not use separate miniature abilities such as Pounce, Guardian, Scout Training, or other Summon-only substitutes.

If a Summon needs a special combat ability, it buys a complete existing Power from the canonical Power catalogues.

> **Power Token Cost = the chosen Power Level's PP value divided by 10, rounded up.**

Use the Power's own written PP calculation. The Power keeps its normal Type, requirements, range, duration, trigger, effect, limitations, and action economy.

##### Standard Power Cost Reference

| **Power Type** | **Summon Token Cost** |
|---|---:|
| Active | 3 Tokens per Power Level |
| Passive | 2 Tokens per Power Level |
| Reaction | 2 Tokens per Power Level |
| Active Buff | 3 Tokens per Power Level + 1 Token |
| Movement Power | Written PP value divided by 10, rounded up |

##### Power Level Cap

| **Owner's Mastery Rank** | **Maximum Summon Power Level** |
|:--:|:--:|
| MR 1-2 | Level 4 |
| MR 3 | Level 8 |
| MR 4 | Level 12 |
| MR 5+ | Level 16 |

A purchased Power is assigned to one specific Body.

The Body must meet every requirement of the Power. A natural attack may satisfy an **Unarmed** requirement, but it is not automatically a Melee Weapon, Ranged Weapon, Spell Focus, shield, or other required item.

A Summon has no normal Attributes. If a Power requires an Attack Roll or Spell Roll, use the Bond's Attack pool. A Power that requires an Attribute, resource, item, or subsystem the Summon does not possess cannot be purchased or used unless an explicit rule provides the missing requirement.

---

#### Power Action Economy

- **Active:** uses one available Summon Attack.
- **Active Buff:** uses one available Summon Attack to activate. A Summon Bond may maintain only one Active Buff of its own at a time.
- **Passive:** affects only the Body to which it is assigned.
- **Reaction:** a Summon Bond may use no more than one Reaction per Round, regardless of Bodies or purchased Reactions.
- **Movement Power:** replaces the using Body's normal Movement for that Turn and does not add a second permanent Movement Mode.

A purchased Power cannot grant Stones, Artifacts, another Summon Bond, or additional actions beyond the normal limits of the Summon subsystem.

---

#### Summon Specials

Special Access unlocks one eligible numeric **Special(X)** at **Special(1)** for the Bond's normal Summon Attacks.

Special Value increases that Special by +1, to a maximum of **Special(4)**.

The Special applies only when a Summon Attack hits and may apply only once per Round for the entire Bond.

A canonical Power applies only the Special written in that Power and follows the Power's normal rules. It does not grant permanent Special Access to the Bond's normal attacks.

---

#### Bond Ritual and Destroyed Bodies

A Bond Ritual takes **1 hour**.

During a Bond Ritual, the owner may:

- create or release a Summon Bond,
- add or remove Bound Stones,
- change the Bond's Expression,
- change its one selected Movement Mode,
- redistribute Summon Tokens,
- change selected Summon Skills and Skill Dice,
- assign Body Upgrades and Powers,
- or restore destroyed Summon Bodies.

A Body reduced to 0 HP becomes **Dormant** and leaves play. Its upgrades and assigned Powers remain part of the Bond but cannot be used while it is Dormant.

Dormant Bodies return at full HP after a Bond Ritual or Safe Haven Rest.

Bound Stones remain Bound when a Body is destroyed. They do not become inert for a random number of days.

When the Bond is released through a Bond Ritual, its Bound Stones return to the owner's usable Stone Pool.

---

#### Summon Active Buffs

Summon Active Buffs cast by the owner affect only that owner's Summons and use the owner's normal maintained Active Buff slot.

**Summon Damage Aura** uses the normal Damage Active Buff progression.  
**Summon Armor Aura** uses the normal Armor Active Buff progression.

Both use the following Summon-only radius:

| **Power Level** | **Radius** |
|:--:|:--:|
| 1-4 | 8 m |
| 5-8 | 16 m |
| 9-12 | 24 m |
| 13-16 | 32 m |

---

#### Summon Examples

The following examples are not separate Summon classes. Every example uses the same Universal Base Summon and the same Token list.

#### Scout Owl - 1 Bound Stone

**Concept:** A simple flying Familiar used for reconnaissance.

**Available:** 8 Summon Tokens  
**Selected Movement Mode:** Flying  
**Selected Skills:** Perception, Stealth

| **Purchase** | **Cost** |
|---|:--:|
| Shared Sight | 2 Tokens |
| Shared Hearing | 2 Tokens |
| 4 Summon Skill Dice | 2 Tokens |
| +4 m Movement | 2 Tokens |
| **Total** | **8 Tokens** |

Distribute the four Skill Dice as **Perception 2d8** and **Stealth 2d8**, assuming the owner has at least Rating 2 in both Skills.

**Finished Owl:**

- 10 HP
- Armor 0
- Evade 4
- 12 m Flying Movement
- Shared Sight and Hearing
- Perception 2kMR
- Stealth 2kMR
- 1 weak Summon Attack at 2d8 Attack and 1d8 Damage

The Owl is a complete scout with one Stone. It can observe independently or act as a remote sensory position for its owner.

---

#### Great War Bear - 4 Bound Stones

**Concept:** A durable tank and heavy melee attacker.

**Available:** 32 Summon Tokens  
**Selected Movement Mode:** Walking

| **Purchase** | **Cost** |
|---|:--:|
| +120 HP | 6 Tokens |
| +12 Armor | 6 Tokens |
| +4d8 Attack | 4 Tokens |
| +4d8 Damage | 8 Tokens |
| Special Access: Challenge(1) | 4 Tokens |
| Special Value +2 | 4 Tokens |
| **Total** | **32 Tokens** |

**Finished Bear:**

- 130 HP
- Armor 12
- Evade 4
- Attack 6d8
- Damage 5d8
- 8 m Walking Movement
- 1 Summon Attack
- Challenge(3), applicable once per Round

The Bear is difficult to remove, dangerous in melee, and can pressure one enemy through a normal existing Special rather than a separate Summon-only tank rule.

---

#### Skeleton Warband - 4 Bound Stones

**Concept:** Many individually weak melee fighters controlled through one Bond.

**Available:** 32 Summon Tokens  
**Selected Movement Mode:** Walking

| **Purchase** | **Cost** |
|---|:--:|
| 6 Additional Bodies | 12 Tokens |
| 2 Extra Attacks | 16 Tokens |
| +2d8 Attack | 2 Tokens |
| +1d8 Damage | 2 Tokens |
| **Total** | **32 Tokens** |

**Finished Warband:**

- 7 Skeleton Bodies
- 10 HP, Armor 0, and Evade 4 per Body
- 8 m Walking Movement
- Bond Attack 4d8
- Bond Damage 2d8
- 3 Summon Attacks per Round

The seven Skeletons occupy separate spaces and may move independently during the shared activation. The Bond still makes no more than three attacks per Round. The remaining Bodies provide presence, positioning, and additional targets without multiplying the action economy.

---

#### Shadow Panther - 2 Bound Stones

**Concept:** A fast, elusive predator inspired by an elite magical panther companion.

**Available:** 16 Summon Tokens  
**Selected Movement Mode:** Walking  
**Selected Skills:** Perception, Stealth, Tracking

| **Purchase** | **Cost** |
|---|:--:|
| +40 HP | 2 Tokens |
| +4 Evade | 2 Tokens |
| +2d8 Attack | 2 Tokens |
| +1d8 Damage | 2 Tokens |
| +4 m Movement | 2 Tokens |
| Momentum Passive, Power Level 2 | 4 Tokens |
| 4 Summon Skill Dice | 2 Tokens |
| **Total** | **16 Tokens** |

Assign the four Skill Dice to **Stealth 4d8**, assuming the owner has Stealth 4 or higher.

**Finished Panther:**

- 50 HP
- Armor 0
- Evade 8
- Attack 4d8
- Damage 2d8
- 12 m Walking Movement
- Stealth 4kMR
- Momentum at Power Level 2

After moving at least 8 m, the Panther gains the normal Momentum effect. Its pouncing predator identity therefore comes from a complete canonical Passive rather than an invented Summon-only ability.

---

#### What These Examples Demonstrate

The same Summon system can create:

- a non-combat reconnaissance Familiar,
- one heavy frontline creature,
- many weak Bodies with a controlled shared action economy,
- or a mobile elite companion with a real Power.

No example requires a separate Chassis, class, or private subsystem.

---

### 11.15 Final Agent Validation

Before producing or revising content, verify all of the following:

- Normal Movement baseline is 8 m.
- Initiative is rolled once at combat start.
- Passive Slots follow MR 1/2/3/3/4/4/5/6 and every slotted Passive is active.
- Parry removes Attack Dice, not Damage Dice.
- Damage Negation removes Damage Dice, not Attack Dice.
- Ward reduces incoming eligible Specials before application.
- Absorption uses actual hostile HP loss after defenses.
- Damage Reduction applies after Armor and may coexist with Armor from separate legal sources.
- Root applies at minimum 2 and decays by target MR at the start of the target's Turn.
- Every Bound Stone grants 8 Summon Tokens, including the first Stone.
- Every Summon begins from the Universal Base Summon and never uses a Familiar, Companion, or Host Chassis.
- A Summon Bond has exactly one permanent Movement Mode, beginning at 8 m and capped at 16 m.
- Additional Bodies do not grant additional Summon Attacks; a Bond is capped at 3 Summon Attacks per Round.
- A Bond may have only one purchased Special, capped at Special(4), and it may apply only once per Round.
- Summon Skills are limited to the approved list; 1 Token grants 2 distributable Skill Dice, and no Skill Pool may exceed the owner's Rating in that Skill.
- One non-combat task permits only one Summon Skill Check per Bond, regardless of Body count.
- Summons buy complete canonical Powers at 1 Token per 10 PP, rounded up; never invent Pounce, Guardian, Scout Training, or other miniature Summon-only Powers.
- A Summon Bond has at most one Reaction per Round and may maintain at most one Active Buff of its own.
- Bonus Summon Tokens obey every spending restriction written by their source and do not count as Bound Stones.
- Critical functions only through **Active Buff: Critical** or the **Agility Ability: Crit** Stone Ability; Stone Power Support may pre-fill named Tiers but never grants Critical directly.
- No removed Save or Saving Throw subsystem is reintroduced.
- Reactions use their listed Chosen Trigger and never become hidden full Actions.

