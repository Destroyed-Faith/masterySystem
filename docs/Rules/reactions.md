{{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Reactions
</div>

}}


![Eron](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/NPC%27s/NPC/eronFull.png)  {position:absolute,top:50px,right:55px,width:700px}


![The mirror](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/LogosBanners/Destroyed%20Faith%20Banner%20Beige.png)  {position:absolute,top:0px,right:55px,width:700px}


<!-- LIMITED POWER MODIFIER: NOT AVAILABLE for this Power Type. The Limited variant applies exclusively to eligible Instant Active Powers; see Core. -->
\page
{{pageNumber,auto}}
{{wide
© 2025 Daniel Rodrigo Navarro Melendo. All rights reserved.
This work is the intellectual property of the author and may not be copied, distributed, or published in whole or in part without explicit permission.
Use in private, non-commercial gaming sessions is expressly permitted.

All artwork included in this document is either the original property of the author or used with proper license and permission from the respective artists. Unauthorized reproduction or commercial use is strictly prohibited.

Commercial distribution of this product (digital or physical) is not permitted without explicit written permission by the author and all involved rights holders.


---

### Artwork Credits
- Character Art: Jesús Bey ([Instagram](https://www.instagram.com/vagrant_lungs/))
- Full Page Art (Jumping Attack, God of Vengeance, Titan/Angel): Dzmitry Zasimovich ([Instagram](https://www.instagram.com/shredderdima/))
- World Map of Tyhra: Pena Negra ([Instagram](https://www.instagram.com/penanegracasa_rpg/))
- Weapon/Armor Design: Charlex and Marta Bayer ([Instagram](https://www.instagram.com/meraven/))

{{homebreweryCredits


Made With



{{homebreweryIcon}}

The Homebrewery  
[Homebrewery.Naturalcrit.com](https://homebrewery.naturalcrit.com)
}}

{{position:absolute;top:500px;right:340px;width:auto
[![Discord](/assets/discord.png){height:30px}](https://discord.gg/npkQ8DaR)
[![Github](/assets/github.png){height:30px}](https://github.com/Destroyed-Faith)
[![Patreon](/assets/patreon.png){height:30px}](https://patreon.com/)
[![Reddit](/assets/reddit.png){height:30px}](https://www.reddit.com/)
}}

::::::::::::::::::::::::::::::::
{{homebreweryCredits
Destroyed Faith — DF Core Reactions
Version: v0.9.9.5 (2026-10-15)
> **Unavailable lower Power Levels (v0.9.9.5):** A row explicitly marked `Unavailable` grants no effect and cannot be purchased, selected, activated, or received as a valid Artifact Power Level. The first level with an actual effect is the minimum selectable Power Level. No missing effect or new strength value is implied.

}}

}}
\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Reactions}}{{ 4}}](#p4)
- #### [{{ Reaction Rules}}{{ 4}}](#p4)
- #### [{{ Pure Defense}}{{ 8}}](#p8)
- #### [{{ Reaction: Armor}}{{ 8}}](#p8)
- #### [{{ Reaction: Evade}}{{ 9}}](#p9)
- #### [{{ Reaction: Temporary HP}}{{ 9}}](#p9)
- #### [{{ Ally Protection}}{{ 10}}](#p10)
- #### [{{ Restricted Utility}}{{ 13}}](#p13)
- #### [{{ Reaction: Reposition}}{{ 14}}](#p14)
- #### [{{ Reaction: Cleanse}}{{ 14}}](#p14)
- #### [{{ Closed Premium}}{{ 15}}](#p15)
- #### [{{ Reaction: Damage Reduction}}{{ 15}}](#p15)
- #### [{{ Reaction: Phasing}}{{ 16}}](#p16)
- #### [{{ Counter Effects}}{{ 17}}](#p17)
- #### [{{ Reaction: Damage}}{{ 18}}](#p18)
- #### [{{ Reaction: Damage + Push}}{{ 19}}](#p19)
- #### [{{ Reaction: Initiative}}{{ 20}}](#p20)
- #### [{{ Reaction: Parry + Weapon Damage}}{{ 21}}](#p21)
- #### [{{ Reaction: Parry + Attack Reflection}}{{ 22}}](#p22)
- #### [{{ Absorption Reaction}}{{ 24}}](#p24)
- #### [{{ Reaction: Absorption Surge}}{{ 25}}](#p25)

}}
\page
{{pageNumber,auto}}
{{wide

## Reactions

Reactions are immediate answers to specific events.

They do not replace Active Powers, Active Buffs, Movement Powers, or Passives.

A Reaction is not a second Turn, not a hidden Attack Action, and not a general source of free offense outside the character’s Turn.

A Reaction is built from two parts:

1. a **Reaction Effect**, which defines what the Reaction does, and
2. an **Allowed Trigger**, which defines when the Reaction may be used.

When a Reaction entry offers more than one Allowed Trigger, choose one of those Triggers when the Reaction Effect is learned.

That choice becomes part of the Reaction's configuration, but not its technical Reaction Effect name.

There is no universal Opportunity Attack rule.

A creature may use a Reaction only when the Trigger belonging to that Reaction occurs.

### Technical Reaction Identity

Every catalogue entry uses its heading as its canonical technical Reaction Effect name.

The technical Reaction Effect name defines rules identity and data identity. Power Level or a dedicated Mastery Rank progression changes the strength of that Reaction Effect, not its identity.

A character-facing name is not part of this catalogue and never creates a second Reaction Effect.

The chosen Allowed Trigger is stored separately. It does not change the technical Reaction Effect name and does not create a separate copy of that Reaction Effect.

If a technical name lists alternatives separated by slashes, choose one when learning the Reaction Effect. The chosen option replaces the slash list in that character's configured technical name. All configured variants still share the same base Reaction Effect for duplicate rules unless an explicit rule says otherwise.

Foundry VTT must store the technical Reaction Effect name separately from Power Level, chosen Trigger, chosen option, base Reaction Effect, and any character-facing label. Duplicate rules compare the base Reaction Effect, not the chosen Trigger or character-facing label.

---
::
## Reaction Rules

Using a Reaction consumes **1 Reaction**.

A character normally has **1 Reaction per Round**.

A Reaction does not grant additional Reactions unless its entry explicitly says so.

A Reaction resolves at its **Trigger Window**:

- **Attack Trigger:** after the attack and target or area are declared, before the Attack Roll or Casting Roll.
- **Hit Trigger:** after a hit is confirmed, before Phasing, Specials, and damage resolve.
- **Damage Trigger:** after the Damage Roll is known, before Armor and the remaining damage mitigation.
- **Incoming Effect Trigger:** after Special Negation, before the remaining Special takes effect.
- **Ongoing Effect Trigger:** immediately before an existing Special's next tick or effect.

**Ally Triggers** use the same windows for the ally. Specific printed Trigger conditions control the exact timing of individual Reactions; for example, **Absorption Surge** triggers after an eligible Health Bar is Scarred. An effect that explicitly resolves after the triggering event retains its printed resolution timing.

If a Reaction modifies an incoming attack, it applies only to the triggering attack.

If it modifies a hit or damage instance, it applies only to the triggering hit or damage instance.

A Reaction does not normally create a maintained state.

It is not an Active Buff and does not remain active for the rest of the Round unless the entry explicitly states otherwise.

---
}}
\page
{{pageNumber,auto}}
{{wide
### Reaction Curve

| **Level** | **Target PP** |
| :-------: | ------------: |
|   **1**   |            20 |
|   **2**   |            40 |
|   **3**   |            60 |
|   **4**   |            80 |
|   **5**   |           100 |
|   **6**   |           120 |
|   **7**   |           140 |
|   **8**   |           160 |
|   **9**   |           180 |
|   **10**  |           200 |
|   **11**  |           220 |
|   **12**  |           240 |
|   **13**  |           260 |
|   **14**  |           280 |
|   **15**  |           300 |
|   **16**  |           320 |


### Chosen Triggers

Each Reaction Effect lists its Allowed Triggers.

A Reaction Effect may not be learned multiple times merely to gain several different Triggers.

If several sources grant the same Reaction Effect, use only the highest available version unless a rule explicitly permits multiple copies.

Different Triggers do not create separate copies of the same Reaction Effect.

---
::
### Duplicate Reaction Pillar

A character cannot benefit from the same Reaction Effect more than once.

Sources such as Trees, Artifacts, Echoes, weapons, shields, armor, or other features do not create additional uses of an identical Reaction Effect.

Duplicate sources:

* do not stack,
* do not grant additional Reactions,
* and do not create additional uses during the same Round.

The character still has only their normal number of Reactions.

---
::
}}
\page
{{pageNumber,auto}}
{{wide
### Standard Reaction Scope

Standard defensive Reactions may use:

* Armor
* Evade
* Temporary HP
* Ally Protection
* Reposition
* Reaction: Cleanse

Standard counter effects may use:

* Reaction: Damage
* Reaction: Damage + Push

Counter Effects are not Attack Actions.

They do not make attack rolls, generate Raises, use offensive Active Buffs, apply Specials, or trigger normal on-hit effects unless their entry explicitly says otherwise.


### Dedicated Reaction Exceptions

Some Reactions belong to dedicated subsystems and may break one narrow general restriction.

These include:

* Reaction: Damage Reduction
* Reaction: Phasing
* Reaction: Initiative
* Reaction: Parry + Weapon Damage
* Reaction: Parry + Attack Reflection
* Reaction: Absorption Surge

Each dedicated Reaction follows only the exception written in its own entry.

For example:

* Reaction: Parry + Weapon Damage requires Martial Parry and may use Weapon Damage after a fully parried melee Attack.
* Reaction: Parry + Attack Reflection may return a fully intercepted direct Martial Attack or direct Spell through the matching Parry delivery.
* Reaction: Absorption Surge may grant extra Temporary Colorless Stones when a valid Absorption trigger occurs.
* Reaction: Initiative may change Initiative Order during combat.

These exceptions do not create general permission for other Reactions to copy those effects.

---
::
}}
\page
{{pageNumber,auto}}
{{wide
### Reaction Limits

Reactions may not normally grant:

* Attack Dice,
* Critical,
* Extra Attacks,
* free Attack Actions,
* full Active Powers,
* Special Application,
* hard control,
* maintained defensive states,
* or unrelated offensive riders.

A Reaction may not increase an existing Special through a standalone Reaction effect. Any expressly approved Reaction with a different, fully defined effect (such as Reaction: Damage + Push) remains governed by its own entry.

Closed or dedicated subsystem Reactions may not be combined with unrelated defensive or offensive axes unless their entry explicitly says otherwise.


}}
\page
{{pageNumber,auto}}
{{wide

## Reactions — Pure Defense

Pure Defensive Reactions protect the user against one immediate threat.

They do not create a maintained buff.  
They do not remain active for the rest of the round.  
They do not add offensive pressure.

Unless an entry says otherwise, a Pure Defensive Reaction applies only to the triggering attack, hit, damage instance, or defensive event.

Each Pure Defensive Reaction lists its Allowed Triggers. Choose one of those Triggers when you learn the Reaction Effect.


<h3 id="reaction-armor">
  Reaction: Armor
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      +1 Armor = 10 PP.<br><br>

      DESIGN STRUCTURE<br>
      This is a pure Defensive Reaction with exactly one axis: Armor.<br>
      The Armor applies only against the triggering attack or damage instance.<br>
      Because Armor is priced in 10 PP steps and the Reaction curve increases by 20 PP per level, this progression matches the curve exactly.<br><br>

      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → +2 Armor = 20 PP, exactly on target.<br>
      L2 target 40 PP → +4 Armor = 40 PP, exactly on target.<br>
      L3 target 60 PP → +6 Armor = 60 PP, exactly on target.<br>
      L4 target 80 PP → +8 Armor = 80 PP, exactly on target.<br>
      L5 target 100 PP → +10 Armor = 100 PP, exactly on target.<br>
      L6 target 120 PP → +12 Armor = 120 PP, exactly on target.<br>
      L7 target 140 PP → +14 Armor = 140 PP, exactly on target.<br>
      L8 target 160 PP → +16 Armor = 160 PP, exactly on target.<br>
      L9 target 180 PP → +18 Armor = 180 PP, exactly on target.<br>
      L10 target 200 PP → +20 Armor = 200 PP, exactly on target.<br>
      L11 target 220 PP → +22 Armor = 220 PP, exactly on target.<br>
      L12 target 240 PP → +24 Armor = 240 PP, exactly on target.<br>
      L13 target 260 PP → +26 Armor = 260 PP, exactly on target.<br>
      L14 target 280 PP → +28 Armor = 280 PP, exactly on target.<br>
      L15 target 300 PP → +30 Armor = 300 PP, exactly on target.<br>
      L16 target 320 PP → +32 Armor = 320 PP, exactly on target.<br>
      <br>
      NOTES<br>
      This Reaction grants no Evade, no Temporary HP, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.<br>
      Use it for parries, shields, hardened skin, bracing, guard techniques, magic barriers that last only for one hit, and similar defensive answers.
    </span>
  </span>
</h3>

You harden, brace, block, deflect, or reinforce yourself against one incoming strike.

**Allowed Triggers:** Hit Trigger or Damage Trigger.

Choose one of these Triggers when you learn this Reaction Effect.

| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+2 Armor** against the triggering attack or damage instance. |
| **2** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+4 Armor** against the triggering attack or damage instance. |
| **3** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+6 Armor** against the triggering attack or damage instance. |
| **4** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+8 Armor** against the triggering attack or damage instance. |
| **5** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+10 Armor** against the triggering attack or damage instance. |
| **6** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+12 Armor** against the triggering attack or damage instance. |
| **7** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+14 Armor** against the triggering attack or damage instance. |
| **8** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+16 Armor** against the triggering attack or damage instance. |
| **9** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+18 Armor** against the triggering attack or damage instance. |
| **10** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+20 Armor** against the triggering attack or damage instance. |
| **11** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+22 Armor** against the triggering attack or damage instance. |
| **12** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+24 Armor** against the triggering attack or damage instance. |
| **13** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+26 Armor** against the triggering attack or damage instance. |
| **14** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+28 Armor** against the triggering attack or damage instance. |
| **15** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+30 Armor** against the triggering attack or damage instance. |
| **16** | Reaction | Hit Trigger or Damage Trigger | Self | — | Gain **+32 Armor** against the triggering attack or damage instance. |

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-evade">
  Reaction: Evade
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      +1 Evade = 20 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Reaction with exactly one axis: Evade.<br>
      The Evade bonus applies only against the triggering attack.<br>
      Since Evade costs 20 PP per point and the Reaction curve increases by 20 PP per level, this progression matches the curve exactly.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → +1 Evade = 20 PP, exactly on target.<br>
      L2 target 40 PP → +2 Evade = 40 PP, exactly on target.<br>
      L3 target 60 PP → +3 Evade = 60 PP, exactly on target.<br>
      L4 target 80 PP → +4 Evade = 80 PP, exactly on target.<br>
      L5 target 100 PP → +5 Evade = 100 PP, exactly on target.<br>
      L6 target 120 PP → +6 Evade = 120 PP, exactly on target.<br>
      L7 target 140 PP → +7 Evade = 140 PP, exactly on target.<br>
      L8 target 160 PP → +8 Evade = 160 PP, exactly on target.<br>
      L9 target 180 PP → +9 Evade = 180 PP, exactly on target.<br>
      L10 target 200 PP → +10 Evade = 200 PP, exactly on target.<br>
      L11 target 220 PP → +11 Evade = 220 PP, exactly on target.<br>
      L12 target 240 PP → +12 Evade = 240 PP, exactly on target.<br>
      L13 target 260 PP → +13 Evade = 260 PP, exactly on target.<br>
      L14 target 280 PP → +14 Evade = 280 PP, exactly on target.<br>
      L15 target 300 PP → +15 Evade = 300 PP, exactly on target.<br>
      L16 target 320 PP → +16 Evade = 320 PP, exactly on target.<br>
      <br>
      NOTES<br>
      This Reaction grants no Armor, no Temporary HP, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.<br>
      Use it for dodges, slips, feints, blur effects, instinctive sidesteps, brief illusions, or one-hit avoidance techniques.
    </span>
  </span>
</h3>

You slip, twist, blur, or move just enough to make one attack fail to find you cleanly.

**Allowed Triggers:** Attack Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Attack Trigger | Self | — | Gain **+1 Evade** against the triggering attack. |
| **2** | Reaction | Attack Trigger | Self | — | Gain **+2 Evade** against the triggering attack. |
| **3** | Reaction | Attack Trigger | Self | — | Gain **+3 Evade** against the triggering attack. |
| **4** | Reaction | Attack Trigger | Self | — | Gain **+4 Evade** against the triggering attack. |
| **5** | Reaction | Attack Trigger | Self | — | Gain **+5 Evade** against the triggering attack. |
| **6** | Reaction | Attack Trigger | Self | — | Gain **+6 Evade** against the triggering attack. |
| **7** | Reaction | Attack Trigger | Self | — | Gain **+7 Evade** against the triggering attack. |
| **8** | Reaction | Attack Trigger | Self | — | Gain **+8 Evade** against the triggering attack. |
| **9** | Reaction | Attack Trigger | Self | — | Gain **+9 Evade** against the triggering attack. |
| **10** | Reaction | Attack Trigger | Self | — | Gain **+10 Evade** against the triggering attack. |
| **11** | Reaction | Attack Trigger | Self | — | Gain **+11 Evade** against the triggering attack. |
| **12** | Reaction | Attack Trigger | Self | — | Gain **+12 Evade** against the triggering attack. |
| **13** | Reaction | Attack Trigger | Self | — | Gain **+13 Evade** against the triggering attack. |
| **14** | Reaction | Attack Trigger | Self | — | Gain **+14 Evade** against the triggering attack. |
| **15** | Reaction | Attack Trigger | Self | — | Gain **+15 Evade** against the triggering attack. |
| **16** | Reaction | Attack Trigger | Self | — | Gain **+16 Evade** against the triggering attack. |


---
:

<h3 id="reaction-temporary-hp">
  Reaction: Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Temporary HP against a triggering damage instance = 4 PP per 1 Temporary HP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Reaction with exactly one axis: Temporary HP.<br>
      The Temporary HP is gained immediately against the triggering damage instance.<br>
      Any Temporary HP left after that damage instance remains until the end of your next turn, then disappears.<br>
      Since Temporary HP costs 4 PP per HP and the Reaction curve increases by 20 PP per level, this progression matches the curve exactly.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → 5 Temporary HP = 20 PP, exactly on target.<br>
      L2 target 40 PP → 10 Temporary HP = 40 PP, exactly on target.<br>
      L3 target 60 PP → 15 Temporary HP = 60 PP, exactly on target.<br>
      L4 target 80 PP → 20 Temporary HP = 80 PP, exactly on target.<br>
      L5 target 100 PP → 25 Temporary HP = 100 PP, exactly on target.<br>
      L6 target 120 PP → 30 Temporary HP = 120 PP, exactly on target.<br>
      L7 target 140 PP → 35 Temporary HP = 140 PP, exactly on target.<br>
      L8 target 160 PP → 40 Temporary HP = 160 PP, exactly on target.<br>
      L9 target 180 PP → 45 Temporary HP = 180 PP, exactly on target.<br>
      L10 target 200 PP → 50 Temporary HP = 200 PP, exactly on target.<br>
      L11 target 220 PP → 55 Temporary HP = 220 PP, exactly on target.<br>
      L12 target 240 PP → 60 Temporary HP = 240 PP, exactly on target.<br>
      L13 target 260 PP → 65 Temporary HP = 260 PP, exactly on target.<br>
      L14 target 280 PP → 70 Temporary HP = 280 PP, exactly on target.<br>
      L15 target 300 PP → 75 Temporary HP = 300 PP, exactly on target.<br>
      L16 target 320 PP → 80 Temporary HP = 320 PP, exactly on target.<br><br>
      NOTES<br>
      This Reaction does not heal real HP.<br>
      It does not restore Health Levels.<br>
      It grants no Armor, no Evade, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.
    </span>
  </span>
</h3>

A sudden buffer forms between you and the incoming harm.

**Allowed Triggers:** Damage Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Damage Trigger | Self | — | Gain **5 Temporary HP** against the triggering damage instance. |
| **2** | Reaction | Damage Trigger | Self | — | Gain **10 Temporary HP** against the triggering damage instance.  |
| **3** | Reaction | Damage Trigger | Self | — | Gain **15 Temporary HP** against the triggering damage instance. |
| **4** | Reaction | Damage Trigger | Self | — | Gain **20 Temporary HP** against the triggering damage instance. |
| **5** | Reaction | Damage Trigger | Self | — | Gain **25 Temporary HP** against the triggering damage instance.  |
| **6** | Reaction | Damage Trigger | Self | — | Gain **30 Temporary HP** against the triggering damage instance.  |
| **7** | Reaction | Damage Trigger | Self | — | Gain **35 Temporary HP** against the triggering damage instance. |
| **8** | Reaction | Damage Trigger | Self | — | Gain **40 Temporary HP** against the triggering damage instance.  |
| **9** | Reaction | Damage Trigger | Self | — | Gain **45 Temporary HP** against the triggering damage instance.  |
| **10** | Reaction | Damage Trigger | Self | — | Gain **50 Temporary HP** against the triggering damage instance.  |
| **11** | Reaction | Damage Trigger | Self | — | Gain **55 Temporary HP** against the triggering damage instance.  |
| **12** | Reaction | Damage Trigger | Self | — | Gain **60 Temporary HP** against the triggering damage instance.  |
| **13** | Reaction | Damage Trigger | Self | — | Gain **65 Temporary HP** against the triggering damage instance.|
| **14** | Reaction | Damage Trigger | Self | — | Gain **70 Temporary HP** against the triggering damage instance. |
| **15** | Reaction | Damage Trigger | Self | — | Gain **75 Temporary HP** against the triggering damage instance.  |
| **16** | Reaction | Damage Trigger | Self | — | Gain **80 Temporary HP** against the triggering damage instance.  |

---
}}

\page
{{pageNumber,auto}}
{{wide

## Reactions — Ally Protection

Ally Protection Reactions allow you to protect one nearby ally against a triggering attack, hit, or damage instance.

These Reactions do not make you attack.  
They do not punish the attacker.  
They do not apply Specials.  
They simply let you spend your Reaction to defend someone else.

Ally Protection is priced with a small protection premium because it allows the user to answer the most dangerous incoming hit against the team.

Unless an entry says otherwise, the protected ally must be within **4 m**.

Each Ally Protection Reaction lists its Allowed Trigger. This Trigger is part of the Reaction Effect when you learn it.

---


<h3 id="reaction-ally-armor">
  Reaction: Ally Armor
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      +1 Armor = 10 PP.<br>
      Ally Protection premium = 10 PP for protecting one ally within 4 m.<br><br>
      DESIGN STRUCTURE<br>
      This is an Ally Protection Reaction with one axis: Armor granted to a nearby ally.<br>
      The 10 PP protection premium is paid first.<br>
      Remaining PP is spent on Armor.<br>
      The Armor applies only against the triggering attack or damage instance.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → Ally premium (10) + +1 Armor (10) = 20 PP, exactly on target.<br>
      L2 target 40 PP → Ally premium (10) + +3 Armor (30) = 40 PP, exactly on target.<br>
      L3 target 60 PP → Ally premium (10) + +5 Armor (50) = 60 PP, exactly on target.<br>
      L4 target 80 PP → Ally premium (10) + +7 Armor (70) = 80 PP, exactly on target.<br>
      L5 target 100 PP → Ally premium (10) + +9 Armor (90) = 100 PP, exactly on target.<br>
      L6 target 120 PP → Ally premium (10) + +11 Armor (110) = 120 PP, exactly on target.<br>
      L7 target 140 PP → Ally premium (10) + +13 Armor (130) = 140 PP, exactly on target.<br>
      L8 target 160 PP → Ally premium (10) + +15 Armor (150) = 160 PP, exactly on target.<br>
      L9 target 180 PP → Ally premium (10) + +17 Armor (170) = 180 PP, exactly on target.<br>
      L10 target 200 PP → Ally premium (10) + +19 Armor (190) = 200 PP, exactly on target.<br>
      L11 target 220 PP → Ally premium (10) + +21 Armor (210) = 220 PP, exactly on target.<br>
      L12 target 240 PP → Ally premium (10) + +23 Armor (230) = 240 PP, exactly on target.<br>
      L13 target 260 PP → Ally premium (10) + +25 Armor (250) = 260 PP, exactly on target.<br>
      L14 target 280 PP → Ally premium (10) + +27 Armor (270) = 280 PP, exactly on target.<br>
      L15 target 300 PP → Ally premium (10) + +29 Armor (290) = 300 PP, exactly on target.<br>
      L16 target 320 PP → Ally premium (10) + +31 Armor (310) = 320 PP, exactly on target.<br>
      <br>
      NOTES<br>
      This Reaction protects one ally only.<br>
      It grants no Evade, no Temporary HP, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.
    </span>
  </span>
</h3>

You interpose protection, force, shieldwork, magic, or a guarding stance between an ally and harm.

**Allowed Triggers:** Ally Hit or Damage Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+1 Armor** against the triggering attack or damage instance. |
| **2** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+3 Armor** against the triggering attack or damage instance. |
| **3** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+5 Armor** against the triggering attack or damage instance. |
| **4** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+7 Armor** against the triggering attack or damage instance. |
| **5** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+9 Armor** against the triggering attack or damage instance. |
| **6** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+11 Armor** against the triggering attack or damage instance. |
| **7** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+13 Armor** against the triggering attack or damage instance. |
| **8** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+15 Armor** against the triggering attack or damage instance. |
| **9** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+17 Armor** against the triggering attack or damage instance. |
| **10** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+19 Armor** against the triggering attack or damage instance. |
| **11** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+21 Armor** against the triggering attack or damage instance. |
| **12** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+23 Armor** against the triggering attack or damage instance. |
| **13** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+25 Armor** against the triggering attack or damage instance. |
| **14** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+27 Armor** against the triggering attack or damage instance. |
| **15** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+29 Armor** against the triggering attack or damage instance. |
| **16** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **+31 Armor** against the triggering attack or damage instance. |

---

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="reaction-ally-evade">
  Reaction: Ally Evade
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      +1 Evade = 20 PP.<br>
      Ally Protection premium = 10 PP for protecting one ally within 4 m.<br><br>
      DESIGN STRUCTURE<br>
      This is an Ally Protection Reaction with one axis: Evade granted to a nearby ally.<br>
      The 10 PP protection premium is paid first.<br>
      Remaining PP is spent on Evade.<br>
      The Evade applies only against the triggering attack.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → Ally premium (10) + no Evade (0) = 10 PP, 10 PP below target.<br>
      L2 target 40 PP → Ally premium (10) + +1 Evade (20) = 30 PP, 10 PP below target.<br>
      L3 target 60 PP → Ally premium (10) + +2 Evade (40) = 50 PP, 10 PP below target.<br>
      L4 target 80 PP → Ally premium (10) + +3 Evade (60) = 70 PP, 10 PP below target.<br>
      L5 target 100 PP → Ally premium (10) + +4 Evade (80) = 90 PP, 10 PP below target.<br>
      L6 target 120 PP → Ally premium (10) + +5 Evade (100) = 110 PP, 10 PP below target.<br>
      L7 target 140 PP → Ally premium (10) + +6 Evade (120) = 130 PP, 10 PP below target.<br>
      L8 target 160 PP → Ally premium (10) + +7 Evade (140) = 150 PP, 10 PP below target.<br>
      L9 target 180 PP → Ally premium (10) + +8 Evade (160) = 170 PP, 10 PP below target.<br>
      L10 target 200 PP → Ally premium (10) + +9 Evade (180) = 190 PP, 10 PP below target.<br>
      L11 target 220 PP → Ally premium (10) + +10 Evade (200) = 210 PP, 10 PP below target.<br>
      L12 target 240 PP → Ally premium (10) + +11 Evade (220) = 230 PP, 10 PP below target.<br>
      L13 target 260 PP → Ally premium (10) + +12 Evade (240) = 250 PP, 10 PP below target.<br>
      L14 target 280 PP → Ally premium (10) + +13 Evade (260) = 270 PP, 10 PP below target.<br>
      L15 target 300 PP → Ally premium (10) + +14 Evade (280) = 290 PP, 10 PP below target.<br>
      L16 target 320 PP → Ally premium (10) + +15 Evade (300) = 310 PP, 10 PP below target.<br>
      <br>
      NOTES<br>
      This Reaction protects one ally only.<br>
      It grants no Armor, no Temporary HP, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.
    </span>
  </span>
</h3>

You pull an ally out of the clean line of attack, distort the angle, warn them, shield their movement, or disrupt the enemy's aim.

**Allowed Triggers:** Ally Attack Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Unavailable | Ally Attack Trigger | 4 m | — | No effect at this PL; unavailable for selection. |
| **2** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+1 Evade** against the triggering attack. |
| **3** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+2 Evade** against the triggering attack. |
| **4** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+3 Evade** against the triggering attack. |
| **5** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+4 Evade** against the triggering attack. |
| **6** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+5 Evade** against the triggering attack. |
| **7** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+6 Evade** against the triggering attack. |
| **8** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+7 Evade** against the triggering attack. |
| **9** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+8 Evade** against the triggering attack. |
| **10** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+9 Evade** against the triggering attack. |
| **11** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+10 Evade** against the triggering attack. |
| **12** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+11 Evade** against the triggering attack. |
| **13** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+12 Evade** against the triggering attack. |
| **14** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+13 Evade** against the triggering attack. |
| **15** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+14 Evade** against the triggering attack. |
| **16** | Reaction | Ally Attack Trigger | 4 m | — | The ally gains **+15 Evade** against the triggering attack. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-ally-temporary-hp">
  Reaction: Ally Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Temporary HP against a triggering damage instance = 4 PP per 1 Temporary HP.<br>
      Ally Protection premium = 10 PP for protecting one ally within 4 m.<br><br>
      DESIGN STRUCTURE<br>
      This is an Ally Protection Reaction with one axis: Temporary HP granted to a nearby ally.<br>
      The 10 PP protection premium is paid first.<br>
      Remaining PP is spent on Temporary HP.<br>
      The Temporary HP applies only against the triggering damage instance.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → Ally premium (10) + 2 Temporary HP (8) = 18 PP, close to target.<br>
      L2 target 40 PP → Ally premium (10) + 7 Temporary HP (28) = 38 PP, close to target.<br>
      L3 target 60 PP → Ally premium (10) + 12 Temporary HP (48) = 58 PP, close to target.<br>
      L4 target 80 PP → Ally premium (10) + 17 Temporary HP (68) = 78 PP, close to target.<br>
      L5 target 100 PP → Ally premium (10) + 22 Temporary HP (88) = 98 PP, close to target.<br>
      L6 target 120 PP → Ally premium (10) + 27 Temporary HP (108) = 118 PP, close to target.<br>
      L7 target 140 PP → Ally premium (10) + 32 Temporary HP (128) = 138 PP, close to target.<br>
      L8 target 160 PP → Ally premium (10) + 37 Temporary HP (148) = 158 PP, close to target.<br>
      L9 target 180 PP → Ally premium (10) + 42 Temporary HP (168) = 178 PP, close to target.<br>
      L10 target 200 PP → Ally premium (10) + 47 Temporary HP (188) = 198 PP, close to target.<br>
      L11 target 220 PP → Ally premium (10) + 52 Temporary HP (208) = 218 PP, close to target.<br>
      L12 target 240 PP → Ally premium (10) + 57 Temporary HP (228) = 238 PP, close to target.<br>
      L13 target 260 PP → Ally premium (10) + 62 Temporary HP (248) = 258 PP, close to target.<br>
      L14 target 280 PP → Ally premium (10) + 67 Temporary HP (268) = 278 PP, close to target.<br>
      L15 target 300 PP → Ally premium (10) + 72 Temporary HP (288) = 298 PP, close to target.<br>
      L16 target 320 PP → Ally premium (10) + 77 Temporary HP (308) = 318 PP, close to target.<br><br>
      NOTES<br>
      This Reaction protects one ally only.<br>
      Any remaining Temporary HP from this Reaction disappears at the end of that ally's next turn.<br>
      It grants no Armor, no Evade, no Damage Reduction, no Phasing, no Attack Dice, and no offensive rider.
    </span>
  </span>
</h3>

You throw a ward, shield, blessing, barrier, or protective impulse over an ally at the last possible moment.

**Allowed Triggers:** Ally Hit or Damage Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **2 Temporary HP** against the triggering damage instance.  |
| **2** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **7 Temporary HP** against the triggering damage instance.  |
| **3** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **12 Temporary HP** against the triggering damage instance.  |
| **4** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **17 Temporary HP** against the triggering damage instance.  |
| **5** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **22 Temporary HP** against the triggering damage instance.  |
| **6** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **27 Temporary HP** against the triggering damage instance.  |
| **7** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **32 Temporary HP** against the triggering damage instance.  |
| **8** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **37 Temporary HP** against the triggering damage instance.  |
| **9** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **42 Temporary HP** against the triggering damage instance.  |
| **10** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **47 Temporary HP** against the triggering damage instance.  |
| **11** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **52 Temporary HP** against the triggering damage instance.  |
| **12** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **57 Temporary HP** against the triggering damage instance.  |
| **13** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **62 Temporary HP** against the triggering damage instance.  |
| **14** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **67 Temporary HP** against the triggering damage instance.  |
| **15** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **72 Temporary HP** against the triggering damage instance.  |
| **16** | Reaction | Ally Hit or Damage Trigger | 4 m | — | The ally gains **77 Temporary HP** against the triggering damage instance.  |

---
}}
\page
{{pageNumber,auto}}
{{wide


## Reactions — Restricted Utility

Restricted Utility Reactions are narrow tactical answers that are allowed to break the normal purely defensive shape of Reactions.
They are still not Active Powers. They do not grant Attack Dice, Critical, Extra Attacks, Special Application, hard control, or hidden full actions.
Each Restricted Utility Reaction lists exactly what it may do.

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-reposition">
  Reaction: Reposition
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Reposition is a hard-capped mobility Reaction and uses milestone scaling.<br><br>
      DESIGN STRUCTURE<br>
      The triggering attack, hit, or damage instance resolves first.<br>
      After it resolves, move using normal legal movement up to the listed distance.<br>
      Reposition is not a dodge, not Evade, not teleportation, not damage prevention, and not an Ally Reposition effect.<br>
      It does not cancel, redirect, or replace the triggering attack.<br><br>
      MOVEMENT RULES<br>
      This movement does not ignore terrain, walls, creatures, hazards, zones, engagement, or movement restrictions.<br>
      It does not grant Safe Movement or Disengage by default.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → no effect; first milestone not reached.<br>
      L2 target 40 PP → no effect; first milestone not reached.<br>
      L3 target 60 PP → no effect; first milestone not reached.<br>
      L4–7 → move up to 2 m after the triggering event resolves.<br>
      L8–11 → move up to 4 m after the triggering event resolves.<br>
      L12–14 → move up to 6 m after the triggering event resolves.<br>
      L15–16 → move up to 8 m after the triggering event resolves.<br><br>
      NOTES<br>
      Unused PP remains unused. Do not add Evade, Armor, Temporary HP, Push, Damage, interception, target replacement, or any other rider.
    </span>
  </span>
</h3>

You recover position only after the immediate danger has resolved.

**Allowed Triggers:** Hit Trigger or Damage Trigger.

| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Unavailable | Hit Trigger or Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Hit Trigger or Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Hit Trigger or Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **4** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **2 m**. |
| **5** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **2 m**. |
| **6** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **2 m**. |
| **7** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **2 m**. |
| **8** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **4 m**. |
| **9** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **4 m**. |
| **10** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **4 m**. |
| **11** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **4 m**. |
| **12** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **6 m**. |
| **13** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **6 m**. |
| **14** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **6 m**. |
| **15** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **8 m**. |
| **16** | Reaction | Hit Trigger or Damage Trigger | Self | — | After the triggering event resolves, move up to **8 m**. |

---


<h3 id="reaction-cleanse">
  Reaction: Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Cleanse(X) = 4 × T(X) PP.<br>
      A single Cleanse(X) reduces exactly one eligible Special by X and cannot be split.<br><br>
      DESIGN STRUCTURE<br>
      This is a restricted self-cleansing Reaction.<br>
      It may affect only the triggering incoming Special or the triggering Special already affecting you.<br>
      If the Special has less than X remaining, it ends and unused Cleanse points are lost.<br>
      Timed Blight is Cleanse-eligible and does not modify the Reaction Trigger or Cleanse value.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → Cleanse(2) = 12 PP.<br>
      L2 target 40 PP → Cleanse(4) = 40 PP.<br>
      L3 target 60 PP → Cleanse(5) = 60 PP.<br>
      L4 target 80 PP → Cleanse(5) = 60 PP.<br>
      L5 target 100 PP → Cleanse(6) = 84 PP.<br>
      L6 target 120 PP → Cleanse(7) = 112 PP.<br>
      L7 target 140 PP → Cleanse(7) = 112 PP.<br>
      L8 target 160 PP → Cleanse(8) = 144 PP.<br>
      L9 target 180 PP → Cleanse(9) = 180 PP.<br>
      L10 target 200 PP → Cleanse(9) = 180 PP.<br>
      L11 target 220 PP → Cleanse(10) = 220 PP.<br>
      L12 target 240 PP → Cleanse(10) = 220 PP.<br>
      L13 target 260 PP → Cleanse(10) = 220 PP.<br>
      L14 target 280 PP → Cleanse(11) = 264 PP.<br>
      L15 target 300 PP → Cleanse(11) = 264 PP.<br>
      L16 target 320 PP → Cleanse(12) = 312 PP.<br><br>
      NOTES<br>
      This Reaction never removes several Specials at once and grants no defensive or offensive rider.
    </span>
  </span>
</h3>

You force one hostile Special out of your body, blood, mind, or spirit when it is applied or becomes dangerous.

| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **2**. |
| **2** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **4**. |
| **3** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **5**. |
| **4** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **5**. |
| **5** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **6**. |
| **6** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **7**. |
| **7** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **7**. |
| **8** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **8**. |
| **9** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **9**. |
| **10** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **9**. |
| **11** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **10**. |
| **12** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **10**. |
| **13** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **10**. |
| **14** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **11**. |
| **15** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **11**. |
| **16** | Reaction | Incoming Effect Trigger / Ongoing Effect Trigger | Self | — | Reduce the triggering eligible Special by **12**. |

---
}}
\page
{{pageNumber,auto}}
{{wide


## Reactions — Closed Premium

Damage Reduction and Phasing are closed premium defensive subsystems.

They do not use normal Reaction scaling.

They may only appear in their dedicated Reaction entries:

- **Reaction: Damage Reduction**
- **Reaction: Phasing**

They may not be combined with Armor, Evade, Temporary HP, Special effects, movement, counterattacks, or any other rider.

If a character wants these premium defensive answers, the dedicated Reaction is the whole package.



<h3 id="reaction-damage-reduction">
  Reaction: Damage Reduction
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Damage Reduction is a closed premium defensive subsystem.<br>
      Reaction DR does not follow normal linear Reaction scaling.<br>
      This Reaction only works if an active Passive already grants Damage Reduction.<br><br>
      CORE DR RULES<br>
      Without Passive Damage Reduction, this Reaction has no effect.<br>
      This Reaction may never create Damage Reduction on its own.<br>
      This Reaction may never add more than +10% DR.<br>
      This Reaction applies only against the triggering attack or damage instance.<br>
      This Reaction may never exceed the total DR cap allowed by its level band.<br>
      This Reaction may not include Armor, Evade, Temporary HP, Phasing, Attack Dice, Specials, movement, or any other rider.<br><br>
      REACTION DR MILESTONES<br>
      L1–3 → no effect.<br>
      L4–7 → increase existing Passive DR by +10% against the triggering attack, up to 30% total DR.<br>
      L8–11 → increase existing Passive DR by +10% against the triggering attack, up to 40% total DR.<br>
      L12–14 → increase existing Passive DR by +10% against the triggering attack, up to 50% total DR.<br>
      L15–16 → increase existing Passive DR by +10% against the triggering attack, up to 60% total DR.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → no effect because the first Reaction DR milestone has not been reached.<br>
      L2 target 40 PP → no effect because the first Reaction DR milestone has not been reached.<br>
      L3 target 60 PP → no effect because the first Reaction DR milestone has not been reached.<br>
      L4 target 80 PP → first Reaction DR milestone: +10% DR against the triggering attack, up to 30% total DR.<br>
      L5 target 100 PP → same DR band as L4; no filler is added.<br>
      L6 target 120 PP → same DR band as L4; no filler is added.<br>
      L7 target 140 PP → same DR band as L4; no filler is added.<br>
      L8 target 160 PP → second Reaction DR milestone: +10% DR against the triggering attack, up to 40% total DR.<br>
      L9 target 180 PP → same DR band as L8; no filler is added.<br>
      L10 target 200 PP → same DR band as L8; no filler is added.<br>
      L11 target 220 PP → same DR band as L8; no filler is added.<br>
      L12 target 240 PP → third Reaction DR milestone: +10% DR against the triggering attack, up to 50% total DR.<br>
      L13 target 260 PP → same DR band as L12; no filler is added.<br>
      L14 target 280 PP → same DR band as L12; no filler is added.<br>
      L15 target 300 PP → fourth Reaction DR milestone: +10% DR against the triggering attack, up to 60% total DR.<br>
      L16 target 320 PP → same DR band as L15; no filler is added.<br><br>
      DESIGN NOTE<br>
      Damage Reduction is intentionally not smoothed across all levels.<br>
      It is a rare, gated, high-commitment defensive path.<br>
      Unused PP remains unused instead of being converted into Armor, Evade, Temporary HP, Phasing, or any other bonus.
    </span>
  </span>
</h3>

Your existing damage resistance spikes for one decisive hit.

**Allowed Triggers:** Damage Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Unavailable | Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Damage Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **4** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **30% total DR**. |
| **5** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **30% total DR**. |
| **6** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **30% total DR**. |
| **7** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **30% total DR**. |
| **8** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **40% total DR**. |
| **9** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **40% total DR**. |
| **10** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **40% total DR**. |
| **11** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **40% total DR**. |
| **12** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **50% total DR**. |
| **13** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **50% total DR**. |
| **14** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **50% total DR**. |
| **15** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **60% total DR**. |
| **16** | Reaction | Damage Trigger | Self | — | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **60% total DR**. |

**Combination order:** Against the triggering damage instance, calculate Passive DR plus an eligible capped Active Buff first; add this Reaction's +10% only up to its own printed total-DR cap. A Reaction cap does not lower DR already present. Then add **Resolve Stone Ability: Damage Reduction**, outside Buff and Reaction caps, and apply the Core's global 100% cap and rounding of the remaining damage **up**.

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-phasing">
  Reaction: Phasing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Phasing is a closed premium defensive subsystem.<br>
      Reaction Phasing does not follow normal linear Reaction scaling.<br>
      This Reaction only works if an active Passive already grants Phasing.<br><br>
      CORE PHASING RULES<br>
      Without Passive Phasing, this Reaction has no effect.<br>
      This Reaction may never create Phasing on its own.<br>
      This Reaction may only reinforce an existing Passive Phasing path.<br>
      This Reaction may ignore only the triggering hit.<br>
      This Reaction may never exceed the total Phasing cap allowed by its level band.<br>
      This Reaction may not include Armor, Evade, Temporary HP, Damage Reduction, Attack Dice, Specials, movement, or any other rider.<br><br>
      REACTION PHASING MILESTONES<br>
      L1–3 → no effect.<br>
      L4–7 → if you currently have Phasing from a Passive, ignore the triggering hit, up to a maximum of 2 total Phasing charges this combat.<br>
      L8–14 → if you currently have Phasing from a Passive, ignore the triggering hit, up to a maximum of 3 total Phasing charges this combat.<br>
      L15–16 → if you currently have Phasing from a Passive, ignore the triggering hit, up to a maximum of 4 total Phasing charges this combat.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → no effect because the first Reaction Phasing milestone has not been reached.<br>
      L2 target 40 PP → no effect because the first Reaction Phasing milestone has not been reached.<br>
      L3 target 60 PP → no effect because the first Reaction Phasing milestone has not been reached.<br>
      L4 target 80 PP → first Reaction Phasing milestone: ignore the triggering hit if you have Passive Phasing, up to 2 total charges this combat.<br>
      L5 target 100 PP → same Phasing band as L4; no filler is added.<br>
      L6 target 120 PP → same Phasing band as L4; no filler is added.<br>
      L7 target 140 PP → same Phasing band as L4; no filler is added.<br>
      L8 target 160 PP → second Reaction Phasing milestone: ignore the triggering hit if you have Passive Phasing, up to 3 total charges this combat.<br>
      L9 target 180 PP → same Phasing band as L8; no filler is added.<br>
      L10 target 200 PP → same Phasing band as L8; no filler is added.<br>
      L11 target 220 PP → same Phasing band as L8; no filler is added.<br>
      L12 target 240 PP → same Phasing band as L8; no filler is added.<br>
      L13 target 260 PP → same Phasing band as L8; no filler is added.<br>
      L14 target 280 PP → same Phasing band as L8; no filler is added.<br>
      L15 target 300 PP → third Reaction Phasing milestone: ignore the triggering hit if you have Passive Phasing, up to 4 total charges this combat.<br>
      L16 target 320 PP → same Phasing band as L15; no filler is added.<br><br>
      DESIGN NOTE<br>
      Phasing is intentionally not smoothed across all levels.<br>
      Ignoring hits entirely is a premium defense and must remain a committed subsystem.<br>
      Unused PP remains unused instead of being converted into Armor, Evade, Temporary HP, Damage Reduction, or any other bonus.
    </span>
  </span>
</h3>

You vanish from the hit at the last possible instant.

**Allowed Triggers:** Hit Trigger.


| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Unavailable | Hit Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Hit Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Hit Trigger | Self | — | No effect at this PL; unavailable for selection. |
| **4** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2 total Phasing charges this combat**. |
| **5** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2 total Phasing charges this combat**. |
| **6** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2 total Phasing charges this combat**. |
| **7** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **2 total Phasing charges this combat**. |
| **8** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **9** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **10** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **11** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **12** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **13** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **14** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **3 total Phasing charges this combat**. |
| **15** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **4 total Phasing charges this combat**. |
| **16** | Reaction | Hit Trigger | Self | — | If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **4 total Phasing charges this combat**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

## Reactions — Counter Effects

Counter Effects are retaliatory Reactions.

They punish a creature for directly triggering your chosen Reaction window, but they are not Attack Actions.

A Counter Effect may use the Hit Trigger or the Threat Zone Movement Trigger only if that Trigger is listed in the entry's Allowed Triggers.

If the Counter Effect uses the Hit Trigger, the triggering creature must be within the listed fixed range.

**Threat Zone Movement Trigger:** A creature entering or leaving your Threat Zone without Safe Movement/Disengage triggers your eligible movement Reaction. Resolve entry after the step into your Zone and exit before the step out; the creature is within your Threat Zone when the Reaction resolves. Each distinct boundary crossing can trigger once, subject to your available Reactions.

A Counter Effect does not make an attack roll.  
It does not use weapon damage.  
It does not trigger on-hit effects.  
It does not apply Specials.  
It does not increase Specials.  
It does not benefit from Critical.  
It does not benefit from Active Buff: Damage or Active Buff: Critical.

Reaction: Damage is fixed Reaction damage.

The triggering creature applies Armor, Damage Reduction, resistance, immunity, and any other legal damage mitigation normally.

Unless an entry says otherwise, a Counter Effect using the Hit Trigger requires the triggering creature to be within **2 m**.

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-damage">
  Reaction: Damage
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Reaction: Damage = 20 PP per 1d8 damage.<br><br>

      DESIGN STRUCTURE<br>
      This is a retaliatory Reaction with exactly one axis: fixed Reaction: Damage.<br>
      Reaction: Damage is intentionally priced higher than normal damage because it does not require an attack roll and happens outside your turn.<br>
      The damage applies only to the triggering creature.<br>
      The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.<br><br>

      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → 1d8 Reaction: Damage = 20 PP, exactly on target.<br>
      L2 target 40 PP → 2d8 Reaction: Damage = 40 PP, exactly on target.<br>
      L3 target 60 PP → 3d8 Reaction: Damage = 60 PP, exactly on target.<br>
      L4 target 80 PP → 4d8 Reaction: Damage = 80 PP, exactly on target.<br>
      L5 target 100 PP → 5d8 Reaction: Damage = 100 PP, exactly on target.<br>
      L6 target 120 PP → 6d8 Reaction: Damage = 120 PP, exactly on target.<br>
      L7 target 140 PP → 7d8 Reaction: Damage = 140 PP, exactly on target.<br>
      L8 target 160 PP → 8d8 Reaction: Damage = 160 PP, exactly on target.<br>
      L9 target 180 PP → 9d8 Reaction: Damage = 180 PP, exactly on target.<br>
      L10 target 200 PP → 10d8 Reaction: Damage = 200 PP, exactly on target.<br>
      L11 target 220 PP → 11d8 Reaction: Damage = 220 PP, exactly on target.<br>
      L12 target 240 PP → 12d8 Reaction: Damage = 240 PP, exactly on target.<br>
      L13 target 260 PP → 13d8 Reaction: Damage = 260 PP, exactly on target.<br>
      L14 target 280 PP → 14d8 Reaction: Damage = 280 PP, exactly on target.<br>
      L15 target 300 PP → 15d8 Reaction: Damage = 300 PP, exactly on target.<br>
      L16 target 320 PP → 16d8 Reaction: Damage = 320 PP, exactly on target.<br><br>

      NOTES<br>
      This is not an Attack Action.<br>
      It does not make an attack roll.<br>
      It cannot generate Raises.<br>
      It does not use weapon damage.<br>
      It does not apply or increase Specials.<br>
      It grants no Armor, Evade, Temporary HP, Damage Reduction, Phasing, Attack Dice, Critical, or other rider.
    </span>
  </span>
</h3>

The enemy is punished by backlash, thorns, flame, force, pain, blood, warding magic, or a brutal counter-impact.

**Allowed Triggers:** Hit Trigger or Threat Zone Movement Trigger.

Choose one of these Triggers when you learn this Reaction Effect.

If you choose Hit Trigger, the triggering creature must be within **2 m**.

If you choose Threat Zone Movement Trigger, the triggering creature must be within your **Threat Zone** when the Reaction resolves.

| **Level** | **Type** | **Allowed Triggers**                        |     **Range**     | **AoE** | **Effect**                                                       |
| :-------: | :------- | :------------------------------------------ | :---------------: | :-----: | :--------------------------------------------------------------- |
|   **1**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **1d8 damage** to the triggering creature.  |
|   **2**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **2d8 damage** to the triggering creature.  |
|   **3**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **3d8 damage** to the triggering creature.  |
|   **4**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **4d8 damage** to the triggering creature.  |
|   **5**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **5d8 damage** to the triggering creature.  |
|   **6**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **6d8 damage** to the triggering creature.  |
|   **7**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **7d8 damage** to the triggering creature.  |
|   **8**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **8d8 damage** to the triggering creature.  |
|   **9**   | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **9d8 damage** to the triggering creature.  |
|   **10**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **10d8 damage** to the triggering creature. |
|   **11**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **11d8 damage** to the triggering creature. |
|   **12**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **12d8 damage** to the triggering creature. |
|   **13**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **13d8 damage** to the triggering creature. |
|   **14**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **14d8 damage** to the triggering creature. |
|   **15**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **15d8 damage** to the triggering creature. |
|   **16**  | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone |    —    | Deal **16d8 damage** to the triggering creature. |


---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-damage-push">
  Reaction: Damage + Push
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Reaction: Damage = 20 PP per 1d8 damage.<br>
      Push 2 m = 20 PP.<br>
      Push 4 m = 40 PP.<br>
      Push 6 m = 60 PP.<br>
      Push 8 m = 80 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a retaliatory Reaction with exactly two axes: fixed Reaction: Damage and Push.<br>
      Reaction: Damage is intentionally priced higher than normal damage because it does not require an attack roll and happens outside your turn.<br>
      Push is the secondary axis and represents a forceful rebound, shield-bash, shockwave, repulsion ward, kinetic discharge, or similar effect.<br>
      The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally against the damage.<br><br>
      PUSH STRUCTURE<br>
      L1 → no Push; the level is spent fully on the first damage die.<br>
      L2–3 → Push 2 m.<br>
      L4–5 → Push 4 m.<br>
      L6–7 → Push 6 m.<br>
      L8–16 → Push 8 m.<br>
      After Push reaches 8 m, later levels increase only Reaction: Damage.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → 1d8 damage (20) = 20 PP, exactly on target. Push has not unlocked yet.<br>
      L2 target 40 PP → 1d8 damage (20) + Push 2 m (20) = 40 PP, exactly on target.<br>
      L3 target 60 PP → 2d8 damage (40) + Push 2 m (20) = 60 PP, exactly on target.<br>
      L4 target 80 PP → 2d8 damage (40) + Push 4 m (40) = 80 PP, exactly on target.<br>
      L5 target 100 PP → 3d8 damage (60) + Push 4 m (40) = 100 PP, exactly on target.<br>
      L6 target 120 PP → 3d8 damage (60) + Push 6 m (60) = 120 PP, exactly on target.<br>
      L7 target 140 PP → 4d8 damage (80) + Push 6 m (60) = 140 PP, exactly on target.<br>
      L8 target 160 PP → 4d8 damage (80) + Push 8 m (80) = 160 PP, exactly on target.<br>
      L9 target 180 PP → 5d8 damage (100) + Push 8 m (80) = 180 PP, exactly on target.<br>
      L10 target 200 PP → 6d8 damage (120) + Push 8 m (80) = 200 PP, exactly on target.<br>
      L11 target 220 PP → 7d8 damage (140) + Push 8 m (80) = 220 PP, exactly on target.<br>
      L12 target 240 PP → 8d8 damage (160) + Push 8 m (80) = 240 PP, exactly on target.<br>
      L13 target 260 PP → 9d8 damage (180) + Push 8 m (80) = 260 PP, exactly on target.<br>
      L14 target 280 PP → 10d8 damage (200) + Push 8 m (80) = 280 PP, exactly on target.<br>
      L15 target 300 PP → 11d8 damage (220) + Push 8 m (80) = 300 PP, exactly on target.<br>
      L16 target 320 PP → 12d8 damage (240) + Push 8 m (80) = 320 PP, exactly on target.<br><br>
      NOTES<br>
      This is not an Attack Action.<br>
      It does not make an attack roll.<br>
      It cannot generate Raises.<br>
      It does not use weapon damage.<br>
      It does not apply or increase Specials.<br>
      It does not knock Prone, Stun, Immobilize, or apply hard control.<br>
      Push moves the triggering creature directly away from you if movement is possible.<br>
      If the creature cannot be pushed, the damage still applies.<br>
      It grants no Armor, Evade, Temporary HP, Damage Reduction, Phasing, Attack Dice, Critical, or other rider.
    </span>
  </span>
</h3>

The enemy is thrown back by impact, force, shieldwork, thunder, recoil, kinetic pressure, or a violent defensive burst.

**Allowed Triggers:** Hit Trigger or Threat Zone Movement Trigger.

Choose one of these Triggers when you learn this Reaction Effect.

If you choose Hit Trigger, the triggering creature must be within **2 m**.

If you choose Threat Zone Movement Trigger, the triggering creature must be within your **Threat Zone** when the Reaction resolves.

| **Level** | **Type** | **Allowed Triggers** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **1d8 damage** to the triggering creature. |
| **2** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **1d8 damage** to the triggering creature and push it **2 m** directly away from you. |
| **3** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **2d8 damage** to the triggering creature and push it **2 m** directly away from you. |
| **4** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **2d8 damage** to the triggering creature and push it **4 m** directly away from you. |
| **5** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **3d8 damage** to the triggering creature and push it **4 m** directly away from you. |
| **6** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **3d8 damage** to the triggering creature and push it **6 m** directly away from you. |
| **7** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **4d8 damage** to the triggering creature and push it **6 m** directly away from you. |
| **8** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **4d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **9** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **5d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **10** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **6d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **11** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **7d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **12** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **8d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **13** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **9d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **14** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **10d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **15** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **11d8 damage** to the triggering creature and push it **8 m** directly away from you. |
| **16** | Reaction | Hit Trigger or Threat Zone Movement Trigger | 2 m / Threat Zone | — | Deal **12d8 damage** to the triggering creature and push it **8 m** directly away from you. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-initiative">
  Reaction: Initiative
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP at Level 1, +20 PP per Level.<br>
      +1 Initiative = 10 PP.<br><br>

  DESIGN STRUCTURE<br>
  This is a pure Initiative Reaction with exactly one mechanical axis: Reaction: Initiative.<br>
  The Reaction triggers when the user is targeted by an attack.<br>
  The Initiative is gained after the triggering attack fully resolves.<br><br>

  LEVEL-BY-LEVEL CALCULATION<br>
  L1 target 20 PP → +2 Initiative = 20 PP.<br>
  L2 target 40 PP → +4 Initiative = 40 PP.<br>
  L3 target 60 PP → +6 Initiative = 60 PP.<br>
  L4 target 80 PP → +8 Initiative = 80 PP.<br>
  L5 target 100 PP → +10 Initiative = 100 PP.<br>
  L6 target 120 PP → +12 Initiative = 120 PP.<br>
  L7 target 140 PP → +14 Initiative = 140 PP.<br>
  L8 target 160 PP → +16 Initiative = 160 PP.<br>
  L9 target 180 PP → +18 Initiative = 180 PP.<br>
  L10 target 200 PP → +20 Initiative = 200 PP.<br>
  L11 target 220 PP → +22 Initiative = 220 PP.<br>
  L12 target 240 PP → +24 Initiative = 240 PP.<br>
  L13 target 260 PP → +26 Initiative = 260 PP.<br>
  L14 target 280 PP → +28 Initiative = 280 PP.<br>
  L15 target 300 PP → +30 Initiative = 300 PP.<br>
  L16 target 320 PP → +32 Initiative = 320 PP.<br><br>

  INITIATIVE ORDER<br>
  Reaction: Initiative immediately increases the user's Initiative Score.<br>
  If the user has not yet taken their Turn this Round, update their position in the remaining Initiative Order.<br>
  If the new position would already have passed, the user acts immediately after the current Turn.<br>
  If the user has already taken their Turn this Round, the new position applies from the next Round onward.<br>
  Reaction: Initiative can never grant a second Turn in the same Round.<br><br>

  NOTES<br>
  This Reaction does not affect the triggering attack.<br>
  It does not grant Evade, Armor, Damage Reduction, Phasing, Temporary HP, Movement, an Attack Action, an additional Turn, or another Reaction.<br>
  It does not reroll Initiative and does not open the Initiative Exchange.
</span>

  </span>
</h3>

You seize the pressure of an incoming attack and turn it into immediate combat momentum.

**Allowed Trigger:** Attack Trigger.

> **When you are targeted by an attack.**

| **Level** | **Type** | **Allowed Trigger** | **Range** | **AoE** | **Duration** | **Effect**                                                           |
| :-------: | :------- | :------------------ | :-------: | :-----: | :----------: | :------------------------------------------------------------------- |
|   **1**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+2 Initiative**.  |
|   **2**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+4 Initiative**.  |
|   **3**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+6 Initiative**.  |
|   **4**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+8 Initiative**.  |
|   **5**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+10 Initiative**. |
|   **6**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+12 Initiative**. |
|   **7**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+14 Initiative**. |
|   **8**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+16 Initiative**. |
|   **9**   | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+18 Initiative**. |
|   **10**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+20 Initiative**. |
|   **11**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+22 Initiative**. |
|   **12**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+24 Initiative**. |
|   **13**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+26 Initiative**. |
|   **14**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+28 Initiative**. |
|   **15**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+30 Initiative**. |
|   **16**  | Reaction | Attack Trigger      |    Self   |    —    |   Permanent  | After the triggering attack fully resolves, gain **+32 Initiative**. |

---

### Reaction: Initiative Rules

Reaction: Initiative costs your Reaction for the Round.

The triggering attack resolves completely before Initiative is gained.

Reaction: Initiative does not modify, interrupt, prevent, or otherwise affect the triggering attack.

Add the gained Initiative to your current Initiative Score.

Initiative gained through this Reaction remains part of your Initiative Score until it is spent or changed by another rule.

Reaction: Initiative does not open the Initiative Exchange.

The gained Initiative may be spent only when another rule explicitly opens the Initiative Exchange.

After gaining Initiative, update your position in Initiative Order.

If you have not yet taken your Turn during the current Round, place yourself according to your new Initiative Score among the combatants who have not yet acted.

If your new Initiative position would already have passed, take your Turn immediately after the current Turn finishes.

If you have already taken your Turn during the current Round, your new Initiative position applies from the beginning of the next Round.

Reaction: Initiative can never grant a second Turn during the same Round.

If several creatures have the same Initiative Score, resolve the tie using the normal Initiative tie rules.

A character cannot learn or benefit from **Reaction: Initiative** more than once.

If several sources grant Reaction: Initiative, use only the highest available version.

Duplicate sources do not stack and do not grant additional uses.

---

}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-parry-weapon-damage">
  Reaction: Parry + Weapon Damage
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Reaction curve = 20 PP per Level.<br>
      Standard Reaction: Damage = 1d8 damage per Power Level.<br><br>


  DEDICATED PARRY EXCEPTION<br>
  Reaction: Parry + Weapon Damage deals Weapon Damage plus 1d8 damage per Power Level as a dedicated Parry exception.<br>
  It may be used multiple times per Round if the character has additional Reactions available.<br><br>

  REQUIREMENTS<br>
  Requires Passive: Parry with **Martial Parry** delivery and a suitable melee weapon or natural weapon.<br>
  You must currently be Parrying.<br><br>

  TRIGGER<br>
  After you reduce all Attack Dice of a direct melee Attack to 0 by spending Parry.<br>
  The triggering creature must be within your Melee Reach when Reaction: Parry + Weapon Damage resolves.<br><br>

  RESOLUTION<br>
  Reaction: Parry + Weapon Damage deals Weapon Damage + 1d8 damage per Power Level.<br>
  No Attack Roll is made.<br>
  Reaction: Parry + Weapon Damage cannot generate Raises or Critical.<br>
  Reaction: Parry + Weapon Damage does not count as an Attack Action.<br>
  Reaction: Parry + Weapon Damage does not trigger on-hit effects.<br>
  Reaction: Parry + Weapon Damage does not apply or increase Specials.<br><br>

  MULTIPLE USES<br>
  Reaction: Parry + Weapon Damage may be used multiple times during the same Round.<br>
  Each use costs 1 Reaction.<br>
  Reaction: Parry + Weapon Damage does not grant additional Reactions.<br><br>

  NOTES<br>
  Weapon Damage means the normal base Damage Dice of the weapon or natural weapon used to parry.<br>
  Damage bonuses from Attack Powers, Active Buffs, Stones, Specials, or other offensive riders do not apply unless they explicitly include Reaction: Parry + Weapon Damage.<br>
  The target applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.
</span>


  </span>
</h3>

You turn a completely intercepted strike aside and immediately answer with your weapon.

---

**Requirement:** **Passive: Parry (Martial Parry)** and a suitable melee weapon or natural weapon

**Trigger:** After you reduce all Attack Dice of a direct melee Attack to **0** by spending Parry.

The triggering creature must be within your **Melee Reach** when this Reaction resolves.

No Attack Roll is made.

Reaction: Parry + Weapon Damage may be used multiple times during the same Round, but every use costs **1 Reaction**. Reaction: Parry + Weapon Damage does not grant additional Reactions.

| **Level** | **Type**        | **Trigger**                |  **Range**  | **AoE** | **Effect**                            |
| :-------: | :-------------- | :------------------------- | :---------: | :-----: | :------------------------------------ |
|   **1**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 1d8 damage**.  |
|   **2**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 2d8 damage**.  |
|   **3**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 3d8 damage**.  |
|   **4**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 4d8 damage**.  |
|   **5**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 5d8 damage**.  |
|   **6**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 6d8 damage**.  |
|   **7**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 7d8 damage**.  |
|   **8**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 8d8 damage**.  |
|   **9**   | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 9d8 damage**.  |
|   **10**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 10d8 damage**. |
|   **11**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 11d8 damage**. |
|   **12**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 12d8 damage**. |
|   **13**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 13d8 damage**. |
|   **14**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 14d8 damage**. |
|   **15**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 15d8 damage**. |
|   **16**  | Reaction, Parry | Fully parry a melee Attack | Melee Reach |    —    | Deal **Weapon Damage + 16d8 damage**. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="reaction-parry-attack-reflection">
  Reaction: Parry + Attack Reflection
</h3>

Reaction: Parry + Attack Reflection is a premium extension of the Parry subsystem.

It does not function as an independent defensive ability. A character can use Attack Reflection only while Parrying and only after completely neutralizing an eligible effect through the expenditure of Parry.

Attack Reflection works with the delivery chosen for **Passive: Parry**:

- **Martial Parry** may reflect an eligible direct Martial Attack.
- **Spell Parry** may reflect an eligible direct single-target Spell.

Unlike **Reaction: Parry + Weapon Damage**, which requires Martial Parry and creates a separate counterattack using the character's own weapon, Attack Reflection returns the original effect itself.

---

#### Attack Reflection Requirements

To use Attack Reflection:

* You must have **Passive: Parry**.
* You must currently be Parrying.
* The triggering effect must target only you.
* The effect must be eligible for your chosen Parry delivery.
* You must reduce the triggering Attack Pool or Casting Pool to **0 dice** by spending Parry.
* The effect must have an identifiable source that can legally receive the reflected effect.

Attack Reflection cannot be used merely because an effect deals no damage after Armor, Damage Reduction, resistance, immunity, Temporary HP, or another defensive effect. The effect must be completely neutralized through Parry.

Spell AoEs, multi-target Spells, Martial AoEs, and other multi-target effects cannot be reflected through this Reaction even if your own exposure is Fully Parried or Fully Countered.

---

#### Resolving Attack Reflection

After reducing the eligible Pool to 0 through Parry, you may spend **1 Reaction** to use Attack Reflection.

The original direct effect is redirected back upon its source.

* No new Attack Roll or Casting Roll is made.
* The source suffers the Damage Dice, Specials, and direct success effects that would normally have applied to the original target on a successful hit or cast, insofar as the source can legally receive them.
* The reflected effect cannot generate new Raises or a new Critical result.
* The source applies its own Armor, Damage Reduction, resistance, immunity, Special Negation (for eligible Specials), and other legal mitigation normally.
* Attack Reflection does not grant additional Reactions.

Attack Reflection and Reaction: Parry + Weapon Damage cannot both be used against the same triggering Martial Attack.

---

#### Attack Reflection Limitations

Attack Reflection works only against direct single-target effects that target only you and are eligible for your chosen Parry delivery.

Attack Reflection does not affect:

* Area Effects or AoEs
* effects that target multiple creatures
* environmental damage
* ongoing damage
* Persistent Zones
* self-inflicted damage
* damage without an identifiable source
* effects that cannot legally affect their own source

Additional Reactions do not bypass Attack Reflection's per-Combat use limit.

---
}}
\page
{{pageNumber,auto}}
{{wide
**Requirement:** **Passive: Parry**

**Trigger:** After you reduce the eligible Pool of a direct single-target Martial Attack or Spell that targets only you to **0 dice** by spending Parry.

Spend **1 Reaction** to redirect the triggering effect back upon its source.

No new Attack Roll or Casting Roll is made.

The source receives the triggering effect's legal Damage Dice, Specials, and direct success effects and applies its own legal defenses normally.

Attack Reflection and Reaction: Parry + Weapon Damage cannot both be used against the same triggering Martial Attack.

Attack Reflection may be used a number of times per Combat equal to **half your Mastery Rank, rounded down, minimum 1**. This grants **1 use at MR 1–3**, **2 uses at MR 4–5**, **3 uses at MR 6–7**, and **4 uses at MR 8**.

| **Mastery Rank** | **Type**        | **Trigger**                    |  **Cost**  | **Uses per Combat** | **Effect**                                           |
| :--------------: | :-------------- | :----------------------------- | :--------: | :-----------------: | :--------------------------------------------------- |
|       **1**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **1**        | Redirect the triggering effect back upon its source. |
|       **2**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **1**        | Redirect the triggering effect back upon its source. |
|       **3**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **1**        | Redirect the triggering effect back upon its source. |
|       **4**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **2**        | Redirect the triggering effect back upon its source. |
|       **5**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **2**        | Redirect the triggering effect back upon its source. |
|       **6**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **3**        | Redirect the triggering effect back upon its source. |
|       **7**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **3**        | Redirect the triggering effect back upon its source. |
|       **8**      | Reaction, Parry | Fully Parry or Fully Counter an eligible effect | 1 Reaction |        **4**        | Redirect the triggering effect back upon its source. |


}}
\page
{{pageNumber,auto}}
{{wide

## Absorption Reaction

**Reaction: Absorption Surge** draws extra Colorless Stones from a valid Absorption event. It does not alter or prevent damage and never creates an additional Absorption trigger.

**Requirement:** Passive: Absorption must be slotted.

**Allowed Trigger:** Damage Trigger, after a hostile damage instance causes **at least one eligible Health Bar to become Scarred** and uses at least one of the Passive's **four triggers per combat**.

Spend **1 Reaction** to gain the bonus Stones listed for the Reaction's Power Level. The bonus applies **once to the triggering damage instance**, even if it Scars multiple Health Bars. The Passive separately earns its normal Stones for each eligible Scarred bar.

The bonus Stones are paid out at the start of your next Preparation Phase along with the Passive's Stones. A damage instance that consumes the **fourth and final** trigger can still receive this bonus; later instances cannot.

#### Example

Passive: Absorption Level 16 earns **8 Stones per trigger**. A single hit Scars two eligible Health Bars (two triggers), earning **16 Stones**. Reaction: Absorption Surge Level 16 adds **8 Stones once**, for a total of **24 Stones** pending payout. Two of the Passive's four triggers remain. No HP-loss amount or remainder is tracked for Absorption.

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="reaction-absorption-surge">
  Reaction: Absorption Surge
  <span class="tooltip">🛈
    <span class="tooltiptext">
      CLOSED ABSORPTION REACTION<br>
      Requires Passive: Absorption; costs 1 Reaction.<br><br>
      TRIGGER<br>
      After an eligible hostile damage instance Scars one or more Health Bars, and uses at least one of the Passive's four triggers for this combat.<br><br>
      EFFECT<br>
      Gain additional Temporary Colorless Stones once per triggering damage instance. The Passive pays its normal Stones per bar separately.<br>
      L1-2: +1; L3-4: +2; L5-6: +3; L7-8: +4.<br>
      L9-10: +5; L11-12: +6; L13-14: +7; L15-16: +8.<br><br>
      TIMING<br>
      Bonus Stones become Ready at the next Preparation Phase, and expire at combat end.<br>
      This does not create a fifth Absorption trigger or increase Stone Recovery.<br><br>
      RESTRICTIONS<br>
      Grants no HP, Healing, damage prevention, Armor, Evade, extra actions, or other effects. Cannot trigger on voluntary costs, self-inflicted damage, or damage that does not Scar an eligible bar.<br>
      The same named Reaction can normally be used at most once per Round.
    </span>
  </span>
</h3>

You seize the power released by a fresh scar and draw even more Colorless Stones from the wound.

**Requirement:** Passive: Absorption

**Allowed Trigger:** Damage Trigger

**Trigger:** An eligible hostile damage instance Scars one or more of your Health Bars, using at least one of Passive: Absorption's four triggers for this combat.

Pay **1 Reaction** to gain the additional Temporary Colorless Stones shown below. The bonus is granted **once per damage instance**, not once per Health Bar. These Stones become Ready in your next Preparation Phase.

| **Level** | **Type** | **Allowed Trigger** | **Range** | **AoE** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--|
| **1** | Reaction, Absorption | Damage Trigger | Self | — | **+1 Temporary Colorless Stone** on a valid Absorption-triggering damage instance (once per instance). |
| **2** | Reaction, Absorption | Damage Trigger | Self | — | **+1 Temporary Colorless Stone** on a valid Absorption-triggering damage instance (once per instance). |
| **3** | Reaction, Absorption | Damage Trigger | Self | — | **+2 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **4** | Reaction, Absorption | Damage Trigger | Self | — | **+2 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **5** | Reaction, Absorption | Damage Trigger | Self | — | **+3 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **6** | Reaction, Absorption | Damage Trigger | Self | — | **+3 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **7** | Reaction, Absorption | Damage Trigger | Self | — | **+4 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **8** | Reaction, Absorption | Damage Trigger | Self | — | **+4 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **9** | Reaction, Absorption | Damage Trigger | Self | — | **+5 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **10** | Reaction, Absorption | Damage Trigger | Self | — | **+5 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **11** | Reaction, Absorption | Damage Trigger | Self | — | **+6 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **12** | Reaction, Absorption | Damage Trigger | Self | — | **+6 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **13** | Reaction, Absorption | Damage Trigger | Self | — | **+7 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **14** | Reaction, Absorption | Damage Trigger | Self | — | **+7 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **15** | Reaction, Absorption | Damage Trigger | Self | — | **+8 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |
| **16** | Reaction, Absorption | Damage Trigger | Self | — | **+8 Temporary Colorless Stones** on a valid Absorption-triggering damage instance (once per instance). |

The Reaction adds no Absorption triggers and provides no additional Stone Recovery.

---

}}

