{{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Active Buffs
</div>

}}


![Eron](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/NPC%27s/NPC/eronFull.png)  {position:absolute,top:50px,right:55px,width:700px}


![The mirror](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/LogosBanners/Destroyed%20Faith%20Banner%20Beige.png)  {position:absolute,top:0px,right:55px,width:700px}


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
Destroyed Faith — DF Core Active Buffs
Version: v0.9.8 (2026-07-31)
}}

}}



\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Active Buffs}}{{ 4}}](#p4)
- #### [{{ Active Buff Rules}}{{ 4}}](#p4)
- #### [{{ Critical Restriction}}{{ 6}}](#p6)
- #### [{{ Pure Defensive}}{{ 7}}](#p7)
- #### [{{ Defensive Combinations}}{{ 14}}](#p14)
- #### [{{ Pure Offensive}}{{ 19}}](#p19)
- #### [{{ Offensive Combinations}}{{ 22}}](#p22)
- #### [{{ Active Buff: Critical}}{{ 24}}](#p24)
- #### [{{ Active Buff: Special Increase + Blight / Challenge / Corrode / Disoriented / Exorcism / Expose / Hex / Lacerate / Mark / Requiem / Ruin / Slow / Soulburn / Sundered / Weaken}}{{ 27}}](#p27)
- #### [{{ Active Buff: Spell Resistance}}{{ 28}}](#p28)
- #### [{{ Active Buff: Self Cleanse}}{{ 29}}](#p29)
- #### [{{ Active Buff Auras}}{{ 30}}](#p30)
- #### [{{ Active Buff: Damage Aura}}{{ 32}}](#p32)
- #### [{{ Active Buff: Healing Aura}}{{ 32}}](#p32)
- #### [{{ Active Buff: Size + Damage + Armor}}{{ 34}}](#p34)
- #### [{{ Active Buff: Summon Damage Aura}}{{ 36}}](#p36)
- #### [{{ Active Buff: Summon Armor Aura}}{{ 37}}](#p37)
- #### [{{ Active Buff: Thorns}}{{ 38}}](#p38)
- #### [{{ Active Buff: Invisibility}}{{ 39}}](#p39)
- #### [{{ Active Buff: Parry Recovery}}{{ 40}}](#p40)
- #### [{{ Absorption Subsystem}}{{ 41}}](#p41)
- #### [{{ Active Buff: Absorption Stone Increase}}{{ 42}}](#p42)
- #### [{{ Active Buff: Damage Negation Pool}}{{ 43}}](#p43)

}}
\page
{{pageNumber,auto}}
{{wide
## Active Buffs

Active Buffs are temporary combat enhancements.

They temporarily modify one or more listed mechanical values or intensify a dedicated combat subsystem.

Unlike Passives, Active Buffs are not permanently active.

An Active Buff usually costs **1 Attack Action** to activate and normally lasts **Mastery Rank Rounds**.

### Technical Power Names

Every catalogue entry uses its heading as its canonical technical Power name.

The technical Power name defines rules identity and data identity. Power Level changes the strength of that Power, not its identity.

A character-facing name is not part of this catalogue and never creates a second mechanical Power.

If a technical name lists alternatives separated by slashes, choose one when learning the Power. The chosen option replaces the slash list in that character's technical Power name and cannot be changed later.

Foundry VTT must store the technical Power name separately from Power Level and any character-facing label. Rules comparisons use the technical Power name, including any chosen option.

---
::
## Active Buff Rules

A character may normally maintain only **one Active Buff** at a time.

If a character activates a new Active Buff while already maintaining another Active Buff, the previous Active Buff ends immediately unless a rule explicitly allows both effects to coexist.

Active Buffs do not require a roll unless they target an unwilling creature or the entry explicitly requires one.

The round in which the Active Buff is activated counts as the first round of its duration.

---
::
### Active Buff Curve

| **Level** | **Target PP** |
| :-------: | ------------: |
|   **1**   |            40 |
|   **2**   |            70 |
|   **3**   |           100 |
|   **4**   |           130 |
|   **5**   |           160 |
|   **6**   |           190 |
|   **7**   |           220 |
|   **8**   |           250 |
|   **9**   |           280 |
|   **10**  |           310 |
|   **11**  |           340 |
|   **12**  |           370 |
|   **13**  |           400 |
|   **14**  |           430 |
|   **15**  |           460 |
|   **16**  |           490 |

---
::
### Linear Scaling Rule

Levels **1–4** define the structure and mechanical identity of an Active Buff.

Levels **5–16** scale that same structure upward.

A standard Active Buff does not gain a new axis, rider, Special, condition, subsystem, or action-economy effect at later Levels.

---
}}
\page
{{pageNumber,auto}}
{{wide
### Pure and Combination Active Buffs

A **Pure Active Buff** has exactly one mechanical axis.

Examples include:

* Armor
* Evade
* Temporary HP
* Healing
* Damage
* Penetration
* Thorns

A **Combination Active Buff** has exactly two mechanical axes.

Examples include:

* Armor + Temporary HP
* Evade + Temporary HP
* Temporary HP + Healing
* Armor + Evade
* Damage + Penetration

Both axes must fit into the same Active Buff PP budget.

A Combination Active Buff does not receive a complete PP budget for each axis.

---
::
### Active Buff Limits

Standard Active Buffs may not grant:

* Attack Dice,
* Extra Attacks,
* free Attack Actions,
* additional Reactions,
* Special Application,
* hard control,
* hidden Movement Powers,
* or unrelated secondary effects.

An Active Buff may interact with an existing eligible Special only through the dedicated **Active Buff: Special Increase** entry.

Special Increase never applies a Special by itself.

---
}}
\page
{{pageNumber,auto}}
{{wide
### Critical Restriction

Critical is a closed offensive subsystem.

Critical may be granted only through:

1. the dedicated **Active Buff: Critical**, or
2. the dedicated **Agility Ability: Crit**.

Artifact Stone Power Support may pre-fill named tiers of **Agility Ability: Crit**, but it never grants Critical directly.

No other Active, Passive, Reaction, Movement Power, weapon, Special, aura, rider, or combination effect may directly grant Critical unless an explicit rule says otherwise.

Critical may not appear as a secondary rider.

**Active Buff: Critical** may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or filler value.

---
::
### Dedicated Active Buff Subsystems

Some Active Buffs are dedicated extensions of another subsystem and do not follow normal Pure or Combination construction.

These include:

* Active Buff: Damage Reduction
* Active Buff: Phasing
* Active Buff: Critical
* Active Buff: Invisibility
* Active Buff: Parry Recovery
* Active Buff: Absorption Stone Increase
* Active Buff: Damage Negation Pool
* Active Buff: Special Increase

A subsystem Active Buff may require the matching Passive.

If the requirement is not met, the Active Buff has no effect.

Dedicated subsystem Active Buffs may not be used as templates for unrelated combination buffs.

---
::
### Invisibility Exception

**Passive Invisibility** and **Active Buff: Invisibility** may be active at the same time.

This is an explicit exception to normal subsystem stacking.

If both are active:

* add both Invisibility Bonuses together,
* Passive Invisibility continues to block its chosen Special Combat Senses,
* and Active Buff: Invisibility continues to block Normal Combat Awareness.

This exception applies only to the Invisibility subsystem and does not allow a character to maintain a second Active Buff.



}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-armor">
  Active Buff: Armor
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Armor = 7.5 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Active Buff with exactly one axis: Armor.<br>
      The full Active Buff budget is spent on flat Armor.<br>
      Because Armor is priced in 7.5 PP steps, exact curve matching is not always possible with whole Armor values.<br>
      Values are rounded down to the nearest clean whole Armor value to avoid fractional Armor and to keep the buff stable.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +5 Armor = 37.5 PP, close to target.<br>
      L2 target 70 PP → +9 Armor = 67.5 PP, close to target.<br>
      L3 target 100 PP → +13 Armor = 97.5 PP, close to target.<br>
      L4 target 130 PP → +17 Armor = 127.5 PP, close to target.<br>
      L5 target 160 PP → +21 Armor = 157.5 PP, close to target.<br>
      L6 target 190 PP → +25 Armor = 187.5 PP, close to target.<br>
      L7 target 220 PP → +29 Armor = 217.5 PP, close to target.<br>
      L8 target 250 PP → +33 Armor = 247.5 PP, close to target.<br>
      L9 target 280 PP → +37 Armor = 277.5 PP, close to target.<br>
      L10 target 310 PP → +41 Armor = 307.5 PP, close to target.<br>
      L11 target 340 PP → +45 Armor = 337.5 PP, close to target.<br>
      L12 target 370 PP → +49 Armor = 367.5 PP, close to target.<br>
      L13 target 400 PP → +53 Armor = 397.5 PP, close to target.<br>
      L14 target 430 PP → +57 Armor = 427.5 PP, close to target.<br>
      L15 target 460 PP → +61 Armor = 457.5 PP, close to target.<br>
      L16 target 490 PP → +65 Armor = 487.5 PP, close to target.<br><br>
      NOTES<br>
      This buff affects only the user.<br>
      It has no aura, no Evade, no Temporary HP, no Healing, no Damage Reduction, no Phasing, and no secondary rider.<br>
      Use this as the default self-protection buff for characters who want direct mitigation instead of avoidance or recovery.
    </span>
  </span>
</h3>

You reinforce your body, armor, stance, magic, skin, or guard with a temporary defensive layer.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Armor**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Armor**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+13 Armor**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+17 Armor**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+21 Armor**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+25 Armor**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+29 Armor**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+33 Armor**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+37 Armor**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+41 Armor**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+45 Armor**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+49 Armor**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+53 Armor**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+57 Armor**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+61 Armor**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+65 Armor**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-evade">
  Active Buff: Evade
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Evade = 15 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Active Buff with exactly one axis: Evade.<br>
      The full Active Buff budget is spent on avoidance.<br>
      Because Evade is priced in 15 PP steps, values are rounded down to whole Evade to avoid exceeding the Active Buff curve.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +2 Evade = 30 PP, 10 PP below target.<br>
      L2 target 70 PP → +4 Evade = 60 PP, 10 PP below target.<br>
      L3 target 100 PP → +6 Evade = 90 PP, 10 PP below target.<br>
      L4 target 130 PP → +8 Evade = 120 PP, 10 PP below target.<br>
      L5 target 160 PP → +10 Evade = 150 PP, 10 PP below target.<br>
      L6 target 190 PP → +12 Evade = 180 PP, 10 PP below target.<br>
      L7 target 220 PP → +14 Evade = 210 PP, 10 PP below target.<br>
      L8 target 250 PP → +16 Evade = 240 PP, 10 PP below target.<br>
      L9 target 280 PP → +18 Evade = 270 PP, 10 PP below target.<br>
      L10 target 310 PP → +20 Evade = 300 PP, 10 PP below target.<br>
      L11 target 340 PP → +22 Evade = 330 PP, 10 PP below target.<br>
      L12 target 370 PP → +24 Evade = 360 PP, 10 PP below target.<br>
      L13 target 400 PP → +26 Evade = 390 PP, 10 PP below target.<br>
      L14 target 430 PP → +28 Evade = 420 PP, 10 PP below target.<br>
      L15 target 460 PP → +30 Evade = 450 PP, 10 PP below target.<br>
      L16 target 490 PP → +32 Evade = 480 PP, 10 PP below target.<br>
<br>
      NOTES<br>
      This is the cleanest avoidance buff in the catalogue.<br>
      It grants no Armor, no Temporary HP, no Healing, no Damage Reduction, no Phasing, and no secondary rider.<br>
      Use this for agile, elusive, blurred, evasive, illusionary, or movement-based defensive identities.
    </span>
  </span>
</h3>

You become harder to target, harder to read, harder to pin down, or harder to strike cleanly.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Evade**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Evade**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Evade**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Evade**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Evade**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+12 Evade**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+14 Evade**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+16 Evade**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+18 Evade**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+20 Evade**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+22 Evade**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+24 Evade**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+26 Evade**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+28 Evade**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+30 Evade**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+32 Evade**. |

---

<h3 id="active-buff-armor-aura">
  Active Buff: Armor Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Armor = 7.5 PP.<br>
      Radius +2 m = 10 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Active Buff with one primary axis: Armor shared through an aura.<br>
      The aura radius scales by +2 m per level.<br>
      Radius is paid first, then the remaining PP budget is spent on Armor.<br>
      Because this buff affects multiple allies, the Armor value is intentionally lower than Active Buff: Armor.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → Radius 2 m (10) + +4 Armor (30) = 40 PP, exactly on target.<br>
      L2 target 70 PP → Radius 4 m (20) + +6 Armor (45) = 65 PP, close to target.<br>
      L3 target 100 PP → Radius 6 m (30) + +9 Armor (67.5) = 97.5 PP, close to target.<br>
      L4 target 130 PP → Radius 8 m (40) + +12 Armor (90) = 130 PP, exactly on target.<br>
      L5 target 160 PP → Radius 10 m (50) + +14 Armor (105) = 155 PP, close to target.<br>
      L6 target 190 PP → Radius 12 m (60) + +17 Armor (127.5) = 187.5 PP, close to target.<br>
      L7 target 220 PP → Radius 14 m (70) + +20 Armor (150) = 220 PP, exactly on target.<br>
      L8 target 250 PP → Radius 16 m (80) + +22 Armor (165) = 245 PP, close to target.<br>
      L9 target 280 PP → Radius 18 m (90) + +25 Armor (187.5) = 277.5 PP, close to target.<br>
      L10 target 310 PP → Radius 20 m (100) + +28 Armor (210) = 310 PP, exactly on target.<br>
      L11 target 340 PP → Radius 22 m (110) + +30 Armor (225) = 335 PP, close to target.<br>
      L12 target 370 PP → Radius 24 m (120) + +33 Armor (247.5) = 367.5 PP, close to target.<br>
      L13 target 400 PP → Radius 26 m (130) + +36 Armor (270) = 400 PP, exactly on target.<br>
      L14 target 430 PP → Radius 28 m (140) + +38 Armor (285) = 425 PP, close to target.<br>
      L15 target 460 PP → Radius 30 m (150) + +41 Armor (307.5) = 457.5 PP, close to target.<br>
      L16 target 490 PP → Radius 32 m (160) + +44 Armor (330) = 490 PP, exactly on target.<br><br>
      NOTES<br>
      This is the standard group-Armor Active Buff.<br>
      It grants no Evade, no Temporary HP, no Healing, no Damage Reduction, no Phasing, and no secondary rider.<br>
      If a campaign wants smaller tactical auras, this entry may later receive an aura-radius cap rule, but this version follows strict linear scaling.
    </span>
  </span>
</h3>

You project your defense outward, turning personal protection into shared battlefield territory.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | Radius 2 m | Mastery Rank Rounds | You and allies in the area gain **+4 Armor**. |
| **2** | Active Buff | Self | Radius 4 m | Mastery Rank Rounds | You and allies in the area gain **+6 Armor**. |
| **3** | Active Buff | Self | Radius 6 m | Mastery Rank Rounds | You and allies in the area gain **+9 Armor**. |
| **4** | Active Buff | Self | Radius 8 m | Mastery Rank Rounds | You and allies in the area gain **+12 Armor**. |
| **5** | Active Buff | Self | Radius 10 m | Mastery Rank Rounds | You and allies in the area gain **+14 Armor**. |
| **6** | Active Buff | Self | Radius 12 m | Mastery Rank Rounds | You and allies in the area gain **+17 Armor**. |
| **7** | Active Buff | Self | Radius 14 m | Mastery Rank Rounds | You and allies in the area gain **+20 Armor**. |
| **8** | Active Buff | Self | Radius 16 m | Mastery Rank Rounds | You and allies in the area gain **+22 Armor**. |
| **9** | Active Buff | Self | Radius 18 m | Mastery Rank Rounds | You and allies in the area gain **+25 Armor**. |
| **10** | Active Buff | Self | Radius 20 m | Mastery Rank Rounds | You and allies in the area gain **+28 Armor**. |
| **11** | Active Buff | Self | Radius 22 m | Mastery Rank Rounds | You and allies in the area gain **+30 Armor**. |
| **12** | Active Buff | Self | Radius 24 m | Mastery Rank Rounds | You and allies in the area gain **+33 Armor**. |
| **13** | Active Buff | Self | Radius 26 m | Mastery Rank Rounds | You and allies in the area gain **+36 Armor**. |
| **14** | Active Buff | Self | Radius 28 m | Mastery Rank Rounds | You and allies in the area gain **+38 Armor**. |
| **15** | Active Buff | Self | Radius 30 m | Mastery Rank Rounds | You and allies in the area gain **+41 Armor**. |
| **16** | Active Buff | Self | Radius 32 m | Mastery Rank Rounds | You and allies in the area gain **+44 Armor**. |

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-temporary-hp">
  Active Buff: Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Refreshing Temporary HP in combat = 4 PP per 1 Temporary HP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Active Buff with exactly one axis: refreshing Temporary HP.<br>
      The full Active Buff budget is spent on a rebuilding temporary buffer.<br>
      At the start of each of your turns, if your Temporary HP from this buff is below the listed value, restore it up to that value.<br>
      Because Temporary HP is priced in 4 PP steps, exact curve matching is not always possible with whole HP values.<br>
      Values are rounded down to whole HP to avoid fractional Temporary HP.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → 10 Temporary HP × 4 = 40 PP, exactly on target.<br>
      L2 target 70 PP → 17 Temporary HP × 4 = 68 PP, close to target.<br>
      L3 target 100 PP → 25 Temporary HP × 4 = 100 PP, exactly on target.<br>
      L4 target 130 PP → 32 Temporary HP × 4 = 128 PP, close to target.<br>
      L5 target 160 PP → 40 Temporary HP × 4 = 160 PP, exactly on target.<br>
      L6 target 190 PP → 47 Temporary HP × 4 = 188 PP, close to target.<br>
      L7 target 220 PP → 55 Temporary HP × 4 = 220 PP, exactly on target.<br>
      L8 target 250 PP → 62 Temporary HP × 4 = 248 PP, close to target.<br>
      L9 target 280 PP → 70 Temporary HP × 4 = 280 PP, exactly on target.<br>
      L10 target 310 PP → 77 Temporary HP × 4 = 308 PP, close to target.<br>
      L11 target 340 PP → 85 Temporary HP × 4 = 340 PP, exactly on target.<br>
      L12 target 370 PP → 92 Temporary HP × 4 = 368 PP, close to target.<br>
      L13 target 400 PP → 100 Temporary HP × 4 = 400 PP, exactly on target.<br>
      L14 target 430 PP → 107 Temporary HP × 4 = 428 PP, close to target.<br>
      L15 target 460 PP → 115 Temporary HP × 4 = 460 PP, exactly on target.<br>
      L16 target 490 PP → 122 Temporary HP × 4 = 488 PP, close to target.<br><br>
      NOTES<br>
      This does not heal real HP.<br>
      It does not restore Health Levels.<br>
      It does not stack with itself; it only restores the Temporary HP from this buff up to the listed value.<br>
      It grants no Armor, no Evade, no Healing, no Damage Reduction, no Phasing, and no secondary rider.
    </span>
  </span>
</h3>

A temporary protective layer rebuilds itself again and again while the buff holds.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **10 Temporary HP**, restore it up to **10 Temporary HP**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **17 Temporary HP**, restore it up to **17 Temporary HP**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **25 Temporary HP**, restore it up to **25 Temporary HP**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **32 Temporary HP**, restore it up to **32 Temporary HP**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **40 Temporary HP**, restore it up to **40 Temporary HP**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **47 Temporary HP**, restore it up to **47 Temporary HP**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **55 Temporary HP**, restore it up to **55 Temporary HP**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **62 Temporary HP**, restore it up to **62 Temporary HP**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **70 Temporary HP**, restore it up to **70 Temporary HP**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **77 Temporary HP**, restore it up to **77 Temporary HP**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **85 Temporary HP**, restore it up to **85 Temporary HP**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **92 Temporary HP**, restore it up to **92 Temporary HP**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **100 Temporary HP**, restore it up to **100 Temporary HP**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **107 Temporary HP**, restore it up to **107 Temporary HP**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **115 Temporary HP**, restore it up to **115 Temporary HP**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **122 Temporary HP**, restore it up to **122 Temporary HP**. |

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-healing">
  Active Buff: Healing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Regeneration in combat = 4 PP per 1 HP healed at the start of your turn.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Defensive Active Buff with exactly one axis: start-of-turn healing.<br>
      The full Active Buff budget is spent on repeated HP recovery.<br>
      At the start of each of your turns while the buff lasts, you heal the listed HP.<br>
      Because healing is priced in 4 PP steps, exact curve matching is not always possible with whole HP values.<br>
      Values are rounded down to whole HP to avoid fractional healing.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → Heal 10 HP × 4 = 40 PP, exactly on target.<br>
      L2 target 70 PP → Heal 17 HP × 4 = 68 PP, close to target.<br>
      L3 target 100 PP → Heal 25 HP × 4 = 100 PP, exactly on target.<br>
      L4 target 130 PP → Heal 32 HP × 4 = 128 PP, close to target.<br>
      L5 target 160 PP → Heal 40 HP × 4 = 160 PP, exactly on target.<br>
      L6 target 190 PP → Heal 47 HP × 4 = 188 PP, close to target.<br>
      L7 target 220 PP → Heal 55 HP × 4 = 220 PP, exactly on target.<br>
      L8 target 250 PP → Heal 62 HP × 4 = 248 PP, close to target.<br>
      L9 target 280 PP → Heal 70 HP × 4 = 280 PP, exactly on target.<br>
      L10 target 310 PP → Heal 77 HP × 4 = 308 PP, close to target.<br>
      L11 target 340 PP → Heal 85 HP × 4 = 340 PP, exactly on target.<br>
      L12 target 370 PP → Heal 92 HP × 4 = 368 PP, close to target.<br>
      L13 target 400 PP → Heal 100 HP × 4 = 400 PP, exactly on target.<br>
      L14 target 430 PP → Heal 107 HP × 4 = 428 PP, close to target.<br>
      L15 target 460 PP → Heal 115 HP × 4 = 460 PP, exactly on target.<br>
      L16 target 490 PP → Heal 122 HP × 4 = 488 PP, close to target.<br><br>
      NOTES<br>
      This heals real HP.<br>
      It does not grant Temporary HP.<br>
      It does not restore lost Health Levels unless another rule explicitly allows that.<br>
      It grants no Armor, no Evade, no Damage Reduction, no Phasing, and no secondary rider.
    </span>
  </span>
</h3>

Your body, spirit, blessing, mutation, or magic repeatedly restores itself while the fight continues.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **10 HP**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **17 HP**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **25 HP**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **32 HP**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **40 HP**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **47 HP**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **55 HP**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **62 HP**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **70 HP**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **77 HP**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **85 HP**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **92 HP**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **100 HP**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **107 HP**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **115 HP**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, heal **122 HP**. |

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-damage-reduction">
  Active Buff: Damage Reduction
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Damage Reduction is a closed premium subsystem.<br>
      Active Buff DR does not follow normal linear scaling.<br>
      This buff only works if an active Passive already grants Damage Reduction.<br><br>
      CORE DR RULES<br>
      Without Passive Damage Reduction, this buff has no effect.<br>
      This buff may never create Damage Reduction on its own.<br>
      This buff may never add more than +10% DR.<br>
      This buff may never exceed the total DR cap allowed by its level band.<br>
      This buff may not include Armor, Evade, Temporary HP, Healing, Phasing, or any other rider.<br><br>
      ACTIVE BUFF DR MILESTONES<br>
      L1–3 → no effect.<br>
      L4–7 → increase existing Passive DR by +10%, up to 20% total DR.<br>
      L8–11 → increase existing Passive DR by +10%, up to 30% total DR.<br>
      L12–14 → increase existing Passive DR by +10%, up to 40% total DR.<br>
      L15–16 → increase existing Passive DR by +10%, up to 50% total DR.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → no effect because the first DR buff milestone has not been reached.<br>
      L2 target 70 PP → no effect because the first DR buff milestone has not been reached.<br>
      L3 target 100 PP → no effect because the first DR buff milestone has not been reached.<br>
      L4 target 130 PP → first supported DR milestone: +10% DR, up to 20% total DR.<br>
      L5 target 160 PP → same DR band as L4; no additional filler is added.<br>
      L6 target 190 PP → same DR band as L4; no additional filler is added.<br>
      L7 target 220 PP → same DR band as L4; no additional filler is added.<br>
      L8 target 250 PP → second supported DR milestone: +10% DR, up to 30% total DR.<br>
      L9 target 280 PP → same DR band as L8; no additional filler is added.<br>
      L10 target 310 PP → same DR band as L8; no additional filler is added.<br>
      L11 target 340 PP → same DR band as L8; no additional filler is added.<br>
      L12 target 370 PP → third supported DR milestone: +10% DR, up to 40% total DR.<br>
      L13 target 400 PP → same DR band as L12; no additional filler is added.<br>
      L14 target 430 PP → same DR band as L12; no additional filler is added.<br>
      L15 target 460 PP → fourth supported DR milestone: +10% DR, up to 50% total DR.<br>
      L16 target 490 PP → same DR band as L15; no additional filler is added.<br><br>
      DESIGN NOTE<br>
      Damage Reduction is intentionally not smoothed across all levels.<br>
      It is a rare, gated, high-commitment defense path.<br>
      Unused PP remains unused instead of being converted into Armor, Evade, Temporary HP, Healing, or any other bonus.<br><br>
      NOTES<br>
      This buff contains no secondary axis.<br>
      If a character wants Active Buff DR, this dedicated entry is the whole package.
    </span>
  </span>
</h3>

Your existing damage resistance hardens, but only if you already possess a true Damage Reduction source.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **20% total DR**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **20% total DR**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **20% total DR**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **20% total DR**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **30% total DR**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **30% total DR**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **30% total DR**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **30% total DR**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **40% total DR**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **40% total DR**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **40% total DR**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **50% total DR**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%**, up to a maximum of **50% total DR**. |

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-phasing">
  Active Buff: Phasing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Phasing is a closed premium subsystem.<br>
      Active Buff Phasing does not follow normal linear scaling.<br>
      This buff only works if an active Passive already grants Phasing.<br><br>
      CORE PHASING RULES<br>
      Without Passive Phasing, this buff has no effect.<br>
      This buff may never create Phasing on its own.<br>
      This buff grants only 1 additional temporary Phasing charge.<br>
      This buff may never exceed the total Phasing cap allowed by its level band.<br>
      If the buff ends and the additional charge has not been used, that charge is lost.<br>
      This buff may not include Armor, Evade, Temporary HP, Healing, Damage Reduction, or any other rider.<br><br>
      SUPPORTED TOTAL PHASING CAPS<br>
      L1–3 → no effect.<br>
      L4–7 → gain 1 additional Phasing charge, up to 2 total Phasing charges this combat.<br>
      L8–14 → gain 1 additional Phasing charge, up to 3 total Phasing charges this combat.<br>
      L15–16 → gain 1 additional Phasing charge, up to 4 total Phasing charges this combat.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → no effect because the first Phasing buff milestone has not been reached.<br>
      L2 target 70 PP → no effect because the first Phasing buff milestone has not been reached.<br>
      L3 target 100 PP → no effect because the first Phasing buff milestone has not been reached.<br>
      L4 target 130 PP → first supported Phasing milestone: +1 temporary charge, up to 2 total charges.<br>
      L5 target 160 PP → same Phasing band as L4; no additional filler is added.<br>
      L6 target 190 PP → same Phasing band as L4; no additional filler is added.<br>
      L7 target 220 PP → same Phasing band as L4; no additional filler is added.<br>
      L8 target 250 PP → second supported Phasing milestone: +1 temporary charge, up to 3 total charges.<br>
      L9 target 280 PP → same Phasing band as L8; no additional filler is added.<br>
      L10 target 310 PP → same Phasing band as L8; no additional filler is added.<br>
      L11 target 340 PP → same Phasing band as L8; no additional filler is added.<br>
      L12 target 370 PP → same Phasing band as L8; no additional filler is added.<br>
      L13 target 400 PP → same Phasing band as L8; no additional filler is added.<br>
      L14 target 430 PP → same Phasing band as L8; no additional filler is added.<br>
      L15 target 460 PP → third supported Phasing milestone: +1 temporary charge, up to 4 total charges.<br>
      L16 target 490 PP → same Phasing band as L15; no additional filler is added.<br><br>
      DESIGN NOTE<br>
      Phasing is intentionally not smoothed across all levels.<br>
      Ignoring hits entirely is a premium defense and must remain a committed subsystem.<br>
      Unused PP remains unused instead of being converted into Armor, Evade, Temporary HP, Healing, or any other bonus.<br><br>
      NOTES<br>
      This buff contains no secondary axis.<br>
      If a character wants Active Buff Phasing, this dedicated entry is the whole package.
    </span>
  </span>
</h3>

You do not become tougher. You become less present.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **2 total Phasing charges this combat**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **2 total Phasing charges this combat**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **2 total Phasing charges this combat**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **2 total Phasing charges this combat**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **3 total Phasing charges this combat**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **4 total Phasing charges this combat**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | If you currently have **Phasing from a Passive**, gain **1 additional Phasing charge** for the duration, up to a maximum of **4 total Phasing charges this combat**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

## Active Buffs — Defensive Combinations

Defensive Combination Active Buffs combine exactly two defensive axes.

They are used when a Tree should not be purely defensive in only one direction, but still needs a clear and readable protection pattern.

A Defensive Combination Active Buff must obey the following rules:

- It uses the normal **Active Buff curve**.
- It has exactly **two mechanical axes**.
- Both axes must fit into the same PP budget.
- It does not receive a full budget for each axis.
- It may not add Damage Reduction.
- It may not add Phasing.
- It may not add offensive riders, Specials, Movement, Control, or extra actions.

If a Tree wants a more complex identity, that complexity should come from the Tree’s other Powers, not from hiding extra mechanics inside the Active Buff.

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-armor-temporary-hp">
  Active Buff: Armor + Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Armor = 7.5 PP.<br>
      Fixed Temporary HP during combat = 4 PP per 1 Temporary HP.<br><br>
      DESIGN STRUCTURE<br>
      This is a Defensive Combination Active Buff with exactly two axes: Armor and fixed Temporary HP.<br>
      Armor is the primary structural axis and increases by +1 per level.<br>
      Remaining PP is spent on a fixed Temporary HP buffer gained when the buff is activated.<br>
      This Temporary HP does not refresh each round.<br>
      The result is an anti-burst defensive buff: Armor reduces incoming hits while Temporary HP absorbs the first damage that gets through.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +2 Armor (15) + 7 Temporary HP (28) = 43 PP, slightly above target.<br>
      L2 target 70 PP → +3 Armor (22.5) + 12 Temporary HP (48) = 70.5 PP, close to target.<br>
      L3 target 100 PP → +4 Armor (30) + 17 Temporary HP (68) = 98 PP, close to target.<br>
      L4 target 130 PP → +5 Armor (37.5) + 23 Temporary HP (92) = 129.5 PP, close to target.<br>
      L5 target 160 PP → +6 Armor (45) + 29 Temporary HP (116) = 161 PP, close to target.<br>
      L6 target 190 PP → +7 Armor (52.5) + 34 Temporary HP (136) = 188.5 PP, close to target.<br>
      L7 target 220 PP → +8 Armor (60) + 40 Temporary HP (160) = 220 PP, exactly on target.<br>
      L8 target 250 PP → +9 Armor (67.5) + 46 Temporary HP (184) = 251.5 PP, close to target.<br>
      L9 target 280 PP → +10 Armor (75) + 51 Temporary HP (204) = 279 PP, close to target.<br>
      L10 target 310 PP → +11 Armor (82.5) + 57 Temporary HP (228) = 310.5 PP, close to target.<br>
      L11 target 340 PP → +12 Armor (90) + 62 Temporary HP (248) = 338 PP, close to target.<br>
      L12 target 370 PP → +13 Armor (97.5) + 68 Temporary HP (272) = 369.5 PP, close to target.<br>
      L13 target 400 PP → +14 Armor (105) + 74 Temporary HP (296) = 401 PP, close to target.<br>
      L14 target 430 PP → +15 Armor (112.5) + 79 Temporary HP (316) = 428.5 PP, close to target.<br>
      L15 target 460 PP → +16 Armor (120) + 85 Temporary HP (340) = 460 PP, exactly on target.<br>
      L16 target 490 PP → +17 Armor (127.5) + 91 Temporary HP (364) = 491.5 PP, close to target.<br><br>
      NOTES<br>
      This buff grants fixed Temporary HP when activated, not refreshing Temporary HP.<br>
      It grants no Evade, no Healing, no Damage Reduction, no Phasing, and no offensive rider.<br>
      Use this for armored, plated, warded, shielded, stone-skinned, or anti-burst defensive identities.
    </span>
  </span>
</h3>

You reinforce yourself with both a hardened defensive layer and a temporary damage buffer.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Armor** and **7 Temporary HP**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+3 Armor** and **12 Temporary HP**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Armor** and **17 Temporary HP**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Armor** and **23 Temporary HP**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Armor** and **29 Temporary HP**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+7 Armor** and **34 Temporary HP**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Armor** and **40 Temporary HP**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Armor** and **46 Temporary HP**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Armor** and **51 Temporary HP**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+11 Armor** and **57 Temporary HP**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+12 Armor** and **62 Temporary HP**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+13 Armor** and **68 Temporary HP**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+14 Armor** and **74 Temporary HP**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+15 Armor** and **79 Temporary HP**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+16 Armor** and **85 Temporary HP**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+17 Armor** and **91 Temporary HP**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-evade-temporary-hp">
  Active Buff: Evade + Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Evade = 15 PP.<br>
      Refreshing Temporary HP in combat = 4 PP per 1 Temporary HP.<br><br>
      DESIGN STRUCTURE<br>
      This is a Defensive Combination Active Buff with exactly two axes: Evade and refreshing Temporary HP.<br>
      The listed refreshing Temporary HP progression remains unchanged.<br>
      Remaining PP is spent on Evade using the premium Evade price.<br>
      At the start of each of your turns, if your Temporary HP from this buff is below the listed value, restore it up to that value.<br>
      This creates a hybrid defense: Evade prevents clean hits, while the buffer absorbs damage that still connects.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → no Evade (0) + refresh up to 8 Temporary HP (32) = 32 PP, 8 PP below target.<br>
      L2 target 70 PP → +1 Evade (15) + refresh up to 12 Temporary HP (48) = 63 PP, 7 PP below target.<br>
      L3 target 100 PP → +2 Evade (30) + refresh up to 17 Temporary HP (68) = 98 PP, 2 PP below target.<br>
      L4 target 130 PP → +2 Evade (30) + refresh up to 22 Temporary HP (88) = 118 PP, 12 PP below target.<br>
      L5 target 160 PP → +3 Evade (45) + refresh up to 28 Temporary HP (112) = 157 PP, 3 PP below target.<br>
      L6 target 190 PP → +4 Evade (60) + refresh up to 32 Temporary HP (128) = 188 PP, 2 PP below target.<br>
      L7 target 220 PP → +4 Evade (60) + refresh up to 38 Temporary HP (152) = 212 PP, 8 PP below target.<br>
      L8 target 250 PP → +5 Evade (75) + refresh up to 42 Temporary HP (168) = 243 PP, 7 PP below target.<br>
      L9 target 280 PP → +5 Evade (75) + refresh up to 48 Temporary HP (192) = 267 PP, 13 PP below target.<br>
      L10 target 310 PP → +6 Evade (90) + refresh up to 52 Temporary HP (208) = 298 PP, 12 PP below target.<br>
      L11 target 340 PP → +7 Evade (105) + refresh up to 58 Temporary HP (232) = 337 PP, 3 PP below target.<br>
      L12 target 370 PP → +8 Evade (120) + refresh up to 62 Temporary HP (248) = 368 PP, 2 PP below target.<br>
      L13 target 400 PP → +8 Evade (120) + refresh up to 68 Temporary HP (272) = 392 PP, 8 PP below target.<br>
      L14 target 430 PP → +9 Evade (135) + refresh up to 72 Temporary HP (288) = 423 PP, 7 PP below target.<br>
      L15 target 460 PP → +9 Evade (135) + refresh up to 78 Temporary HP (312) = 447 PP, 13 PP below target.<br>
      L16 target 490 PP → +10 Evade (150) + refresh up to 82 Temporary HP (328) = 478 PP, 12 PP below target.<br>
<br>
      NOTES<br>
      This buff grants refreshing Temporary HP, not real healing.<br>
      It grants no Armor, no Healing, no Damage Reduction, no Phasing, and no offensive rider.<br>
      Use this for elusive shield, mist-body, shadow-buffer, kinetic guard, or skirmisher-defense identities.
    </span>
  </span>
</h3>

You avoid the cleanest hits, and what still connects is swallowed by a temporary buffer that rebuilds itself.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **8 Temporary HP**, restore it up to **8 Temporary HP**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+1 Evade**. At the start of each of your turns, if you have less than **12 Temporary HP**, restore it up to **12 Temporary HP**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Evade**. At the start of each of your turns, if you have less than **17 Temporary HP**, restore it up to **17 Temporary HP**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Evade**. At the start of each of your turns, if you have less than **22 Temporary HP**, restore it up to **22 Temporary HP**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+3 Evade**. At the start of each of your turns, if you have less than **28 Temporary HP**, restore it up to **28 Temporary HP**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Evade**. At the start of each of your turns, if you have less than **32 Temporary HP**, restore it up to **32 Temporary HP**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Evade**. At the start of each of your turns, if you have less than **38 Temporary HP**, restore it up to **38 Temporary HP**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Evade**. At the start of each of your turns, if you have less than **42 Temporary HP**, restore it up to **42 Temporary HP**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Evade**. At the start of each of your turns, if you have less than **48 Temporary HP**, restore it up to **48 Temporary HP**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Evade**. At the start of each of your turns, if you have less than **52 Temporary HP**, restore it up to **52 Temporary HP**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+7 Evade**. At the start of each of your turns, if you have less than **58 Temporary HP**, restore it up to **58 Temporary HP**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Evade**. At the start of each of your turns, if you have less than **62 Temporary HP**, restore it up to **62 Temporary HP**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Evade**. At the start of each of your turns, if you have less than **68 Temporary HP**, restore it up to **68 Temporary HP**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Evade**. At the start of each of your turns, if you have less than **72 Temporary HP**, restore it up to **72 Temporary HP**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Evade**. At the start of each of your turns, if you have less than **78 Temporary HP**, restore it up to **78 Temporary HP**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Evade**. At the start of each of your turns, if you have less than **82 Temporary HP**, restore it up to **82 Temporary HP**. |


---

<h3 id="active-buff-temporary-hp-healing">
  Active Buff: Temporary HP + Healing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Refreshing Temporary HP in combat = 4 PP per 1 Temporary HP.<br>
      Regeneration in combat = 4 PP per 1 HP healed at the start of your turn.<br><br>
      DESIGN STRUCTURE<br>
      This is a Defensive Combination Active Buff with exactly two axes: refreshing Temporary HP and start-of-turn healing.<br>
      Both axes use the same price: 4 PP per point.<br>
      The budget is split roughly evenly between the two effects.<br>
      Temporary HP protects against future damage while Healing restores real HP already lost.<br>
      The two values are deliberately kept close to each other for readability and clean play.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → 5 Temporary HP (20) + heal 5 HP (20) = 40 PP, exactly on target.<br>
      L2 target 70 PP → 8 Temporary HP (32) + heal 9 HP (36) = 68 PP, close to target.<br>
      L3 target 100 PP → 12 Temporary HP (48) + heal 13 HP (52) = 100 PP, exactly on target.<br>
      L4 target 130 PP → 16 Temporary HP (64) + heal 16 HP (64) = 128 PP, close to target.<br>
      L5 target 160 PP → 20 Temporary HP (80) + heal 20 HP (80) = 160 PP, exactly on target.<br>
      L6 target 190 PP → 23 Temporary HP (92) + heal 24 HP (96) = 188 PP, close to target.<br>
      L7 target 220 PP → 27 Temporary HP (108) + heal 28 HP (112) = 220 PP, exactly on target.<br>
      L8 target 250 PP → 31 Temporary HP (124) + heal 31 HP (124) = 248 PP, close to target.<br>
      L9 target 280 PP → 35 Temporary HP (140) + heal 35 HP (140) = 280 PP, exactly on target.<br>
      L10 target 310 PP → 38 Temporary HP (152) + heal 39 HP (156) = 308 PP, close to target.<br>
      L11 target 340 PP → 42 Temporary HP (168) + heal 43 HP (172) = 340 PP, exactly on target.<br>
      L12 target 370 PP → 46 Temporary HP (184) + heal 46 HP (184) = 368 PP, close to target.<br>
      L13 target 400 PP → 50 Temporary HP (200) + heal 50 HP (200) = 400 PP, exactly on target.<br>
      L14 target 430 PP → 53 Temporary HP (212) + heal 54 HP (216) = 428 PP, close to target.<br>
      L15 target 460 PP → 57 Temporary HP (228) + heal 58 HP (232) = 460 PP, exactly on target.<br>
      L16 target 490 PP → 61 Temporary HP (244) + heal 61 HP (244) = 488 PP, close to target.<br><br>
      NOTES<br>
      Temporary HP and Healing are separate effects.<br>
      Temporary HP never counts as real healing.<br>
      Healing never restores Temporary HP.<br>
      This buff grants no Armor, no Evade, no Damage Reduction, no Phasing, and no offensive rider.
    </span>
  </span>
</h3>

A protective buffer rebuilds around you while your real wounds recover beneath it.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **5 Temporary HP**, restore it up to **5 Temporary HP**. Then heal **5 HP**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **8 Temporary HP**, restore it up to **8 Temporary HP**. Then heal **9 HP**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **12 Temporary HP**, restore it up to **12 Temporary HP**. Then heal **13 HP**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **16 Temporary HP**, restore it up to **16 Temporary HP**. Then heal **16 HP**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **20 Temporary HP**, restore it up to **20 Temporary HP**. Then heal **20 HP**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **23 Temporary HP**, restore it up to **23 Temporary HP**. Then heal **24 HP**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **27 Temporary HP**, restore it up to **27 Temporary HP**. Then heal **28 HP**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **31 Temporary HP**, restore it up to **31 Temporary HP**. Then heal **31 HP**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **35 Temporary HP**, restore it up to **35 Temporary HP**. Then heal **35 HP**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **38 Temporary HP**, restore it up to **38 Temporary HP**. Then heal **39 HP**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **42 Temporary HP**, restore it up to **42 Temporary HP**. Then heal **43 HP**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **46 Temporary HP**, restore it up to **46 Temporary HP**. Then heal **46 HP**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **50 Temporary HP**, restore it up to **50 Temporary HP**. Then heal **50 HP**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **53 Temporary HP**, restore it up to **53 Temporary HP**. Then heal **54 HP**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **57 Temporary HP**, restore it up to **57 Temporary HP**. Then heal **58 HP**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | At the start of each of your turns, if you have less than **61 Temporary HP**, restore it up to **61 Temporary HP**. Then heal **61 HP**. |

---

}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-armor-evade">
  Active Buff: Armor + Evade
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1 Armor = 7.5 PP.<br>
      +1 Evade = 15 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a Defensive Combination Active Buff with exactly two axes: Armor and Evade.<br>
      Armor is the mitigation axis.<br>
      Evade is the avoidance axis.<br>
      The progression uses a stable pattern: Armor increases by +2 per level, and Evade increases by +1 per level.<br>
      This creates a clean mixed-defense profile that stays close to the Active Buff curve across all levels.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +3 Armor (22.5) + +1 Evade (15) = 37.5 PP, 2.5 PP below target.<br>
      L2 target 70 PP → +5 Armor (37.5) + +2 Evade (30) = 67.5 PP, 2.5 PP below target.<br>
      L3 target 100 PP → +7 Armor (52.5) + +3 Evade (45) = 97.5 PP, 2.5 PP below target.<br>
      L4 target 130 PP → +9 Armor (67.5) + +4 Evade (60) = 127.5 PP, 2.5 PP below target.<br>
      L5 target 160 PP → +11 Armor (82.5) + +5 Evade (75) = 157.5 PP, 2.5 PP below target.<br>
      L6 target 190 PP → +13 Armor (97.5) + +6 Evade (90) = 187.5 PP, 2.5 PP below target.<br>
      L7 target 220 PP → +15 Armor (112.5) + +7 Evade (105) = 217.5 PP, 2.5 PP below target.<br>
      L8 target 250 PP → +17 Armor (127.5) + +8 Evade (120) = 247.5 PP, 2.5 PP below target.<br>
      L9 target 280 PP → +19 Armor (142.5) + +9 Evade (135) = 277.5 PP, 2.5 PP below target.<br>
      L10 target 310 PP → +21 Armor (157.5) + +10 Evade (150) = 307.5 PP, 2.5 PP below target.<br>
      L11 target 340 PP → +23 Armor (172.5) + +11 Evade (165) = 337.5 PP, 2.5 PP below target.<br>
      L12 target 370 PP → +25 Armor (187.5) + +12 Evade (180) = 367.5 PP, 2.5 PP below target.<br>
      L13 target 400 PP → +27 Armor (202.5) + +13 Evade (195) = 397.5 PP, 2.5 PP below target.<br>
      L14 target 430 PP → +29 Armor (217.5) + +14 Evade (210) = 427.5 PP, 2.5 PP below target.<br>
      L15 target 460 PP → +31 Armor (232.5) + +15 Evade (225) = 457.5 PP, 2.5 PP below target.<br>
      L16 target 490 PP → +33 Armor (247.5) + +16 Evade (240) = 487.5 PP, 2.5 PP below target.<br>
<br>
      DESIGN NOTE<br>
      This buff is intentionally slightly below the exact curve by 2.5 PP at every level.<br>
      That small remainder is left unused because the values create a perfectly clean repeating pattern without exceeding the curve.<br><br>
      NOTES<br>
      This is the standard mixed mitigation-and-avoidance buff.<br>
      It grants no Temporary HP, no Healing, no Damage Reduction, no Phasing, and no offensive rider.
    </span>
  </span>
</h3>

You reinforce both your ability to absorb hits and your ability to avoid clean contact.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+3 Armor** and **+1 Evade**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Armor** and **+2 Evade**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+7 Armor** and **+3 Evade**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Armor** and **+4 Evade**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+11 Armor** and **+5 Evade**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+13 Armor** and **+6 Evade**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+15 Armor** and **+7 Evade**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+17 Armor** and **+8 Evade**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+19 Armor** and **+9 Evade**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+21 Armor** and **+10 Evade**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+23 Armor** and **+11 Evade**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+25 Armor** and **+12 Evade**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+27 Armor** and **+13 Evade**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+29 Armor** and **+14 Evade**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+31 Armor** and **+15 Evade**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+33 Armor** and **+16 Evade**. |

---

<h3 id="active-buff-damage">
  Active Buff: Damage
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1d8 Damage = 15 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure offensive Active Buff with exactly one axis: bonus damage.<br>
      The full Active Buff budget is spent on additional damage dice.<br>
      Because damage is priced in 15 PP steps, exact curve matching is not always possible.<br>
      Values are rounded to the nearest clean d8 value, with a slight preference for being near or slightly above curve on offensive buffs.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +3d8 damage = 45 PP, slightly above target.<br>
      L2 target 70 PP → +5d8 damage = 75 PP, slightly above target.<br>
      L3 target 100 PP → +7d8 damage = 105 PP, slightly above target.<br>
      L4 target 130 PP → +9d8 damage = 135 PP, slightly above target.<br>
      L5 target 160 PP → +11d8 damage = 165 PP, slightly above target.<br>
      L6 target 190 PP → +13d8 damage = 195 PP, slightly above target.<br>
      L7 target 220 PP → +15d8 damage = 225 PP, slightly above target.<br>
      L8 target 250 PP → +17d8 damage = 255 PP, slightly above target.<br>
      L9 target 280 PP → +19d8 damage = 285 PP, slightly above target.<br>
      L10 target 310 PP → +21d8 damage = 315 PP, slightly above target.<br>
      L11 target 340 PP → +23d8 damage = 345 PP, slightly above target.<br>
      L12 target 370 PP → +25d8 damage = 375 PP, slightly above target.<br>
      L13 target 400 PP → +27d8 damage = 405 PP, slightly above target.<br>
      L14 target 430 PP → +29d8 damage = 435 PP, slightly above target.<br>
      L15 target 460 PP → +31d8 damage = 465 PP, slightly above target.<br>
      L16 target 490 PP → +33d8 damage = 495 PP, slightly above target.<br><br>
      NOTES<br>
      This buff grants no Attack Dice, no Critical, no Penetration, no Special, no Extra Attack, and no defensive benefit.<br>
      It is the clean default for a character who wants temporary raw offensive output.<br>
      When an AoE or Autofire hits multiple creatures, every successful hit receives the full listed bonus damage. The bonus is never divided or reduced because the attack has multiple targets.
    </span>
  </span>
</h3>

Your attacks carry additional force, energy, precision, fury, momentum, or supernatural power.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+3d8 damage**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+5d8 damage**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+7d8 damage**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+9d8 damage**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+11d8 damage**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+13d8 damage**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+15d8 damage**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+17d8 damage**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+19d8 damage**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+21d8 damage**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+23d8 damage**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+25d8 damage**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+27d8 damage**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+29d8 damage**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+31d8 damage**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+33d8 damage**. |

---


---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-penetration">
  Active Buff: Penetration
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Penetration(1) = 7.5 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure offensive Active Buff with exactly one axis: Penetration.<br>
      The full Active Buff budget is spent on bypassing Armor.<br>
      Penetration is priced at the same rate as Armor because it directly counters Armor value.<br>
      Values are rounded down or to the nearest clean whole number to avoid fractional Penetration values.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → Penetration(5) = 37.5 PP, close to target.<br>
      L2 target 70 PP → Penetration(9) = 67.5 PP, close to target.<br>
      L3 target 100 PP → Penetration(13) = 97.5 PP, close to target.<br>
      L4 target 130 PP → Penetration(17) = 127.5 PP, close to target.<br>
      L5 target 160 PP → Penetration(21) = 157.5 PP, close to target.<br>
      L6 target 190 PP → Penetration(25) = 187.5 PP, close to target.<br>
      L7 target 220 PP → Penetration(29) = 217.5 PP, close to target.<br>
      L8 target 250 PP → Penetration(33) = 247.5 PP, close to target.<br>
      L9 target 280 PP → Penetration(37) = 277.5 PP, close to target.<br>
      L10 target 310 PP → Penetration(41) = 307.5 PP, close to target.<br>
      L11 target 340 PP → Penetration(45) = 337.5 PP, close to target.<br>
      L12 target 370 PP → Penetration(49) = 367.5 PP, close to target.<br>
      L13 target 400 PP → Penetration(53) = 397.5 PP, close to target.<br>
      L14 target 430 PP → Penetration(57) = 427.5 PP, close to target.<br>
      L15 target 460 PP → Penetration(61) = 457.5 PP, close to target.<br>
      L16 target 490 PP → Penetration(65) = 487.5 PP, close to target.<br><br>
      NOTES<br>
      This buff grants no bonus damage dice, no Critical, no Attack Dice, no Special, no Extra Attack, and no defensive benefit.<br>
      It is the clean default for armor-breaking offensive builds.
    </span>
  </span>
</h3>

Your attacks cut, pierce, corrode, phase, crush, or bypass protection more effectively.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(5)**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(9)**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(13)**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(17)**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(21)**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(25)**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(29)**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(33)**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(37)**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(41)**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(45)**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(49)**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(53)**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(57)**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(61)**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Penetration(65)**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

## Active Buffs — Offensive Combinations

Offensive Combination Active Buffs combine exactly two offensive axes.

They are used when a Tree wants a stronger tactical identity than a pure offensive buff, but still needs the effect to remain clean, readable, and easy to balance.

An Offensive Combination Active Buff must obey the following rules:

- It uses the normal **Active Buff curve**.
- It has exactly **two mechanical axes**.
- Both axes must fit into the same PP budget.
- It does not receive a full budget for each axis.
- It may not grant Attack Dice.
- It may not grant extra attacks.
- It may not grant free actions.
- It may not grant detection, reveal, awareness, or sensor effects.
- It may not include defensive benefits unless built as a separate defensive or hybrid entry.

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-damage-penetration">
  Active Buff: Damage + Penetration
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1d8 Damage = 15 PP.<br>
      Penetration(1) = 7.5 PP.<br><br>
      DESIGN STRUCTURE<br>
      This is an Offensive Combination Active Buff with exactly two axes: bonus damage and Penetration.<br>
      Damage is the primary axis and increases by +1d8 per level.<br>
      Penetration is the secondary axis and receives the remaining PP budget.<br>
      This creates a clear armor-breaking striker buff: every level adds more damage and more Armor bypass.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +1d8 damage (15) + Penetration(3) (22.5) = 37.5 PP, close to target.<br>
      L2 target 70 PP → +2d8 damage (30) + Penetration(5) (37.5) = 67.5 PP, close to target.<br>
      L3 target 100 PP → +3d8 damage (45) + Penetration(7) (52.5) = 97.5 PP, close to target.<br>
      L4 target 130 PP → +4d8 damage (60) + Penetration(9) (67.5) = 127.5 PP, close to target.<br>
      L5 target 160 PP → +5d8 damage (75) + Penetration(11) (82.5) = 157.5 PP, close to target.<br>
      L6 target 190 PP → +6d8 damage (90) + Penetration(13) (97.5) = 187.5 PP, close to target.<br>
      L7 target 220 PP → +7d8 damage (105) + Penetration(15) (112.5) = 217.5 PP, close to target.<br>
      L8 target 250 PP → +8d8 damage (120) + Penetration(17) (127.5) = 247.5 PP, close to target.<br>
      L9 target 280 PP → +9d8 damage (135) + Penetration(19) (142.5) = 277.5 PP, close to target.<br>
      L10 target 310 PP → +10d8 damage (150) + Penetration(21) (157.5) = 307.5 PP, close to target.<br>
      L11 target 340 PP → +11d8 damage (165) + Penetration(23) (172.5) = 337.5 PP, close to target.<br>
      L12 target 370 PP → +12d8 damage (180) + Penetration(25) (187.5) = 367.5 PP, close to target.<br>
      L13 target 400 PP → +13d8 damage (195) + Penetration(27) (202.5) = 397.5 PP, close to target.<br>
      L14 target 430 PP → +14d8 damage (210) + Penetration(29) (217.5) = 427.5 PP, close to target.<br>
      L15 target 460 PP → +15d8 damage (225) + Penetration(31) (232.5) = 457.5 PP, close to target.<br>
      L16 target 490 PP → +16d8 damage (240) + Penetration(33) (247.5) = 487.5 PP, close to target.<br><br>
      NOTES<br>
      This buff grants no Attack Dice, no Critical, no Special, no Extra Attack, and no defensive benefit.<br>
      It is the standard offensive combination for characters who want both higher damage and Armor bypass.
    </span>
  </span>
</h3>

Your attacks strike harder and punch through protection more effectively.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+1d8 damage** and **Penetration(3)**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+2d8 damage** and **Penetration(5)**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+3d8 damage** and **Penetration(7)**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+4d8 damage** and **Penetration(9)**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+5d8 damage** and **Penetration(11)**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+6d8 damage** and **Penetration(13)**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+7d8 damage** and **Penetration(15)**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+8d8 damage** and **Penetration(17)**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+9d8 damage** and **Penetration(19)**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+10d8 damage** and **Penetration(21)**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+11d8 damage** and **Penetration(23)**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+12d8 damage** and **Penetration(25)**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+13d8 damage** and **Penetration(27)**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+14d8 damage** and **Penetration(29)**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+15d8 damage** and **Penetration(31)**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **+16d8 damage** and **Penetration(33)**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

### Critical Restriction

Critical is a closed offensive subsystem.

Critical may only be granted by **Active Buff: Critical** or the dedicated **Agility Ability: Crit**. Artifact Stone Power Support may pre-fill named tiers of **Agility Ability: Crit**, but never grants Critical directly.

No Active, Passive, Reaction, Movement Power, weapon, Special, rider, aura, or combination entry may grant Critical unless an explicit SRD exception is added later.

Critical may not appear as a secondary rider.

Critical may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or any other filler value.

If a character uses **Active Buff: Critical**, it consumes the maintained Active Buff slot. Critical gained through **Agility Ability: Crit** follows that Stone Ability's own cost and timing instead.


<h3 id="active-buff-critical">
  Active Buff: Critical
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Critical as an Active Buff is a premium offensive subsystem.<br>
      It does not use normal linear +30 PP scaling.<br>
      A sustained Critical buff affects all qualifying attacks made while the buff lasts, so it is not priced like a single-hit Critical rider.<br><br>
      ACTIVE BUFF CRITICAL MILESTONES<br>
      L1–3 → no effect<br>
      L4–7 → attacks gain Critical(1)<br>
      L8–11 → attacks gain Critical(2)<br>
      L12–14 → attacks gain Critical(3)<br>
      L15–16 → attacks gain Critical(4)<br><br>
      EFFECTIVE COSTS<br>
      Critical(1) unlocks at Level 4, matching the 130 PP Active Buff tier.<br>
      Critical(2) unlocks at Level 8, matching the 250 PP Active Buff tier.<br>
      Critical(3) unlocks at Level 12, matching the 370 PP Active Buff tier.<br>
      Critical(4) unlocks at Level 15, matching the 460 PP Active Buff tier.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → no effect; Critical has not reached its first milestone.<br>
      L2 target 70 PP → no effect; Critical has not reached its first milestone.<br>
      L3 target 100 PP → no effect; Critical has not reached its first milestone.<br>
      L4 target 130 PP → first Critical milestone: Critical(1).<br>
      L5 target 160 PP → same Critical band as L4; no filler is added.<br>
      L6 target 190 PP → same Critical band as L4; no filler is added.<br>
      L7 target 220 PP → same Critical band as L4; no filler is added.<br>
      L8 target 250 PP → second Critical milestone: Critical(2).<br>
      L9 target 280 PP → same Critical band as L8; no filler is added.<br>
      L10 target 310 PP → same Critical band as L8; no filler is added.<br>
      L11 target 340 PP → same Critical band as L8; no filler is added.<br>
      L12 target 370 PP → third Critical milestone: Critical(3).<br>
      L13 target 400 PP → same Critical band as L12; no filler is added.<br>
      L14 target 430 PP → same Critical band as L12; no filler is added.<br>
      L15 target 460 PP → fourth Critical milestone: Critical(4).<br>
      L16 target 490 PP → same Critical band as L15; no filler is added.<br><br>
      DESIGN NOTE<br>
      Critical is intentionally not smoothed across all levels.<br>
      It is a high-impact offensive state and must not be bundled with bonus damage, Attack Dice, Penetration, Specials, Extra Attacks, or defensive value by default.<br>
      Unused PP remains unused instead of being converted into filler bonuses.
    </span>
  </span>
</h3>



| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(1)**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(1)**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(1)**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(1)**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(2)**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(2)**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(2)**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(2)**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(3)**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(3)**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(3)**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(4)**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Your attacks gain **Critical(4)**. |
}}

\page
{{pageNumber,auto}}
{{wide

### Active Buff Special Rules

Active Buffs do not apply Specials.

The only core Active Buff interaction with Specials is **Active Buff: Special Increase**.

Special Increase never starts a Special. It only increases one chosen eligible Special already affecting the creature you hit.

Special Increase may only increase an already existing eligible **Special(X)**.

It never applies a Special by itself.  
It never creates a new Special on an unaffected target.  
It never refreshes, spreads, copies, transfers, or re-triggers a Special unless the entry explicitly says so.

A Special is eligible for Special Increase only if all of the following are true:

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

Common eligible examples include:

- **Blight(X)**
- **Challenge(X)**
- **Corrode(X)**
- **Disoriented(X)**
- **Expose(X)**
- **Hex(X)**
- **Lacerate(X)**
- **Mark(X)**
- **Ruin(X)**
- **Exorcism(X)**
- **Requiem(X)**
- **Slow(X)**
- **Soulburn(X)**
- **Sundered(X)**
- **Weaken(X)**
}}

\page
{{pageNumber,auto}}
{{wide
Common ineligible examples include:

- **Stunned**
- **Prone**
- **Immovable**
- any Special without **(X)**
- any binary Special
- any hard-control effect
- any forced-behavior effect
- any full-turn denial effect
- any full-reaction denial effect
- any effect that grants, increases, or modifies **Damage Reduction**
- any effect that grants, increases, or modifies **Phasing**
- **Barriers**
- **Walls**
- **Images**
- **Summons**
- **Illusion Fields**
- **Persistent Zones**

Special Increase is meant to escalate pressure, not to multiply hard control.

It may push an existing numeric wound, mark, weakness, exposure, corrosion, curse, or pool-reduction effect beyond its normal value.  
It may not escalate knockdown, stun, forced behavior, full action denial, or other binary control effects.
}}

\page
{{pageNumber,auto}}
{{wide
<h3 id="active-buff-special-increase">
  Active Buff: Special Increase + Blight / Challenge / Corrode / Disoriented / Exorcism / Expose / Hex / Lacerate / Mark / Requiem / Ruin / Slow / Soulburn / Sundered / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Special Increase is a closed offensive Active Buff subsystem.<br>
      It does not use normal linear +30 PP scaling.<br>
      It never applies a Special by itself.<br>
      It only increases one already existing eligible Special(X).<br><br>
      CORE RULES<br>
      Choose one eligible Special(X) when you take this Active Buff.<br>
      The learned Power's technical name is Active Buff: Special Increase + the chosen Special.<br>
      The chosen Special must be numeric, diminishing, and able to increase meaningfully by +1 or more.<br>
      The first time each round you hit a creature already affected by the chosen Special(X), increase that Special by the listed value.<br>
      This can trigger only once per round.<br>
      If the target is not already affected by the chosen Special, this buff does nothing.<br><br>
      ELIGIBLE SPECIALS<br>
      Common eligible examples include **Blight(X)**, **Challenge(X)**, **Corrode(X)**, **Disoriented(X)**, **Expose(X)**, **Hex(X)**, **Lacerate(X)**, **Mark(X)**, **Ruin(X)**, **Exorcism(X)**, **Requiem(X)**, **Slow(X)**, **Soulburn(X)**, **Sundered(X)**, and **Weaken(X)**.<br><br>
      INELIGIBLE SPECIALS<br>
      This buff may not affect binary Specials, hard control, forced behavior, Stunned, Immovable, Prone, Damage Reduction, Phasing, Barriers, Walls, Images, Summons, Illusion Fields, or Persistent Zones.<br><br>
      ACTIVE BUFF SPECIAL INCREASE MILESTONES<br>
      L1–3 → no effect.<br>
      L4–7 → first qualifying hit each round increases the chosen existing Special by +1.<br>
      L8–11 → first qualifying hit each round increases the chosen existing Special by +2.<br>
      L12–14 → first qualifying hit each round increases the chosen existing Special by +3.<br>
      L15–16 → first qualifying hit each round increases the chosen existing Special by +4.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → no effect because the first Special Increase milestone has not been reached.<br>
      L2 target 70 PP → no effect because the first Special Increase milestone has not been reached.<br>
      L3 target 100 PP → no effect because the first Special Increase milestone has not been reached.<br>
      L4 target 130 PP → first Special Increase milestone: increase one existing chosen Special by +1 on the first qualifying hit each round.<br>
      L5 target 160 PP → same Special Increase band as L4; no filler is added.<br>
      L6 target 190 PP → same Special Increase band as L4; no filler is added.<br>
      L7 target 220 PP → same Special Increase band as L4; no filler is added.<br>
      L8 target 250 PP → second Special Increase milestone: increase one existing chosen Special by +2 on the first qualifying hit each round.<br>
      L9 target 280 PP → same Special Increase band as L8; no filler is added.<br>
      L10 target 310 PP → same Special Increase band as L8; no filler is added.<br>
      L11 target 340 PP → same Special Increase band as L8; no filler is added.<br>
      L12 target 370 PP → third Special Increase milestone: increase one existing chosen Special by +3 on the first qualifying hit each round.<br>
      L13 target 400 PP → same Special Increase band as L12; no filler is added.<br>
      L14 target 430 PP → same Special Increase band as L12; no filler is added.<br>
      L15 target 460 PP → fourth Special Increase milestone: increase one existing chosen Special by +4 on the first qualifying hit each round.<br>
      L16 target 490 PP → same Special Increase band as L15; no filler is added.<br><br>
      DESIGN NOTE<br>
      Special Increase is intentionally not smoothed across all levels.<br>
      It is a high-impact offensive escalation state and must not be bundled with Damage, Penetration, Critical, Attack Dice, Extra Attacks, defensive effects, Special Application, or any other filler value.<br>
      Unused PP remains unused instead of being converted into other bonuses.<br><br>
      NOTES<br>
      Active Buffs do not apply Specials.<br>
      Special Increase is the only core Active Buff interaction with Specials and only increases an already existing Special.<br>
      If a character wants Special Increase, they must spend their maintained Active Buff slot on this dedicated buff.
    </span>
  </span>
</h3>

You push an existing condition past its normal limits, turning setup into escalation.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | — |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+1**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+1**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+1**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+1**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+2**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+2**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+2**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+2**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+3**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+3**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+3**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+4**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | For the **Special(X)** chosen when you learned this Power, the first time each round you hit a creature already affected by it, increase it by **+4**. |

---
:
#### Example: Active Buff: Special Increase + Weaken

A creature is already affected by **Weaken(3)**. At Active Buff Level 8, the first qualifying hit each round increases it by **+2**, producing **Weaken(5)**. If the creature has no Weaken value before the hit, Special Increase does nothing.

#### Example: Active Buff: Special Increase + Soulburn

A creature is already affected by **Soulburn(4)**. At Active Buff Level 12, the first qualifying hit each round increases it by **+3**, producing **Soulburn(7)**. This increases only the existing Special; it does not alter Attributes, Keep, or derived values.

---

}}
\page
{{pageNumber,auto}}
{{wide


<h3 id="active-buff-spell-resistance">
  Active Buff: Spell Resistance
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Spell Resistance = 15 PP per +1 Spell Resistance.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure defensive Active Buff with exactly one axis: Spell Resistance.<br>
      Spell Resistance increases the Base TN of Spells against you.<br>
      It applies only against Powers with the Spell tag.<br>
      It does not protect against normal attacks, martial Actives, weapon attacks, non-Spell Specials, environmental damage, or non-Spell effects.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +2 Spell Resistance = 30 PP, below target.<br>
      L2 target 70 PP → +4 Spell Resistance = 60 PP, below target.<br>
      L3 target 100 PP → +6 Spell Resistance = 90 PP, below target.<br>
      L4 target 130 PP → +8 Spell Resistance = 120 PP, below target.<br>
      L5 target 160 PP → +10 Spell Resistance = 150 PP, below target.<br>
      L6 target 190 PP → +12 Spell Resistance = 180 PP, below target.<br>
      L7 target 220 PP → +14 Spell Resistance = 210 PP, below target.<br>
      L8 target 250 PP → +16 Spell Resistance = 240 PP, below target.<br>
      L9 target 280 PP → +18 Spell Resistance = 270 PP, below target.<br>
      L10 target 310 PP → +20 Spell Resistance = 300 PP, below target.<br>
      L11 target 340 PP → +22 Spell Resistance = 330 PP, below target.<br>
      L12 target 370 PP → +24 Spell Resistance = 360 PP, below target.<br>
      L13 target 400 PP → +26 Spell Resistance = 390 PP, below target.<br>
      L14 target 430 PP → +28 Spell Resistance = 420 PP, below target.<br>
      L15 target 460 PP → +30 Spell Resistance = 450 PP, below target.<br>
      L16 target 490 PP → +32 Spell Resistance = 480 PP, below target.<br><br>
      NOTES<br>
      Values are rounded down to whole Spell Resistance values.<br>
      Leftover PP is intentionally unused because +1 more Spell Resistance would exceed the target curve at every level.<br>
      This buff grants no Armor, Evade, Damage Reduction, Phasing, Temporary HP, Healing, Attack Dice, Cleanse, Absorption, Damage, Penetration, Critical, Movement, or control.
    </span>
  </span>
</h3>

You raise a temporary ward that makes hostile spell structure harder to force through you.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Spell Resistance**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Spell Resistance**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Spell Resistance**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Spell Resistance**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Spell Resistance**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+12 Spell Resistance**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+14 Spell Resistance**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+16 Spell Resistance**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+18 Spell Resistance**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+20 Spell Resistance**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+22 Spell Resistance**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+24 Spell Resistance**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+26 Spell Resistance**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+28 Spell Resistance**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+30 Spell Resistance**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+32 Spell Resistance**. |

---

}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-self-cleanse">
  Active Buff: Self Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      Self Cleanse = 30 PP per Cleanse(1).<br><br>
      DESIGN STRUCTURE<br>
      This is a pure defensive Active Buff with exactly one axis: recurring self-Cleanse.<br>
      At the start of your turn while this buff lasts, reduce one eligible negative ongoing creature effect affecting you by the listed value.<br>
      This Cleanse cannot be split across multiple effects.<br>
      This Cleanse does not trigger Absorption.<br><br>
      ELIGIBLE EFFECTS<br>
      Eligible effects are numeric creature effects that can normally be reduced by Cleanse, including Blight(X), Challenge(X), Corrode(X), Disoriented(X), Expose(X), Hex(X), Lacerate(X), Mark(X), Root(X), Ruin(X), Slow(X), Soulburn(X), Sundered(X), and Weaken(X).<br><br>
      INELIGIBLE EFFECTS<br>
      This cannot remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, non-creature effects, or effects that require Dispel or a dedicated rule.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → Cleanse(1) = 30 PP, below target.<br>
      L2 target 70 PP → Cleanse(2) = 60 PP, below target.<br>
      L3 target 100 PP → Cleanse(3) = 90 PP, below target.<br>
      L4 target 130 PP → Cleanse(4) = 120 PP, below target.<br>
      L5 target 160 PP → Cleanse(5) = 150 PP, below target.<br>
      L6 target 190 PP → Cleanse(6) = 180 PP, below target.<br>
      L7 target 220 PP → Cleanse(7) = 210 PP, below target.<br>
      L8 target 250 PP → Cleanse(8) = 240 PP, below target.<br>
      L9 target 280 PP → Cleanse(9) = 270 PP, below target.<br>
      L10 target 310 PP → Cleanse(10) = 300 PP, below target.<br>
      L11 target 340 PP → Cleanse(11) = 330 PP, below target.<br>
      L12 target 370 PP → Cleanse(12) = 360 PP, below target.<br>
      L13 target 400 PP → Cleanse(13) = 390 PP, below target.<br>
      L14 target 430 PP → Cleanse(14) = 420 PP, below target.<br>
      L15 target 460 PP → Cleanse(15) = 450 PP, below target.<br>
      L16 target 490 PP → Cleanse(16) = 480 PP, below target.<br><br>
      NOTES<br>
      Values are rounded down to whole Cleanse values.<br>
      Leftover PP is intentionally unused because Cleanse(1) more would exceed the target curve at every level.<br>
      This buff grants no Spell Resistance, Armor, Evade, Damage Reduction, Phasing, Temporary HP, Healing, Attack Dice, Absorption, Damage, Penetration, Critical, Movement, or control.
    </span>
  </span>
</h3>

You enter a cleansing state that steadily pushes hostile conditions out of you.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **1**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **2**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **3**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **4**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **5**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **6**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **7**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **8**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **9**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **10**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **11**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **12**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **13**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **14**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **15**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **16**. |

---


}}
\page
{{pageNumber,auto}}
{{wide

## Active Buff Auras

Active Buff Auras are maintained self-centered effects that move with the user for the Buff's duration.

They are a dedicated exception to the normal Active Buff rule that Active Buffs do not directly deal damage or heal multiple targets.

An Active Buff Aura uses exactly one payload type.

Choose one:

- **Damage Aura**
- **Healing Aura**

The Aura Payload Budget may not be split between Damage and Healing.

A Damage Aura deals only damage.

A Healing Aura heals only HP.

Active Buff Auras never apply or increase Specials.

---

### Active Buff Aura Timing

An Active Buff Aura triggers once at the end of each of your turns.

When it triggers, it affects valid creatures inside its radius.

A creature can be affected by the same Active Buff Aura only once per Round.

Moving the aura over a creature does not trigger the aura.

A creature entering or leaving the aura does not trigger the aura unless the entry explicitly says so.

The aura's effect is based only on your position when the aura triggers.

---

### Active Buff Aura Radius Bands

Active Buff Auras use hard-capped radius bands.

| **Level Band** | **Radius** | **Radius Cost** |
|:--|:--:|--:|
| **1–7** | 2 m | 20 PP |
| **8–14** | 3 m | 50 PP |
| **15–16** | 4 m | 90 PP |

---
}}
\page
{{pageNumber,auto}}
{{wide
### Active Buff Aura Payload Budget

Aura Payload Budget is calculated as:

> **Active Buff PP − Aura Radius Cost**

| **Level** | **Active Buff PP** | **Radius** | **Radius Cost** | **Payload Budget** |
|:--:|--:|:--:|--:|--:|
| **1** | 40 | 2 m | 20 | 20 |
| **2** | 70 | 2 m | 20 | 50 |
| **3** | 100 | 2 m | 20 | 80 |
| **4** | 130 | 2 m | 20 | 110 |
| **5** | 160 | 2 m | 20 | 140 |
| **6** | 190 | 2 m | 20 | 170 |
| **7** | 220 | 2 m | 20 | 200 |
| **8** | 250 | 3 m | 50 | 200 |
| **9** | 280 | 3 m | 50 | 230 |
| **10** | 310 | 3 m | 50 | 260 |
| **11** | 340 | 3 m | 50 | 290 |
| **12** | 370 | 3 m | 50 | 320 |
| **13** | 400 | 3 m | 50 | 350 |
| **14** | 430 | 3 m | 50 | 380 |
| **15** | 460 | 4 m | 90 | 370 |
| **16** | 490 | 4 m | 90 | 400 |

---

### Active Buff Aura Restrictions

Active Buff Auras may not:

- trigger per meter moved,
- trigger each time you pass a creature,
- trigger when a creature enters or leaves the aura by default,
- apply more than one payload,
- combine Healing and Damage,
- apply hard control,
- apply binary Specials,
- grant Critical,
- grant Penetration,
- grant Extra Attacks,
- grant Movement,
- grant Reactions,
- grant Armor,
- grant Evade,
- grant Temporary HP,
- grant Damage Reduction,
- grant Phasing,
- or function as a hidden Persistent Zone.

An Active Buff Aura is a maintained battlefield presence, not a movement lawnmower.

---

}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-damage-aura">
  Active Buff: Damage Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, then +30 PP per level up to Level 16.<br>
      Aura radius bands: L1–7 = 2 m for 20 PP, L8–14 = 3 m for 50 PP, L15–16 = 4 m for 90 PP.<br>
      Aura Damage = 35 PP per 1d8 damage.<br><br>
      DESIGN STRUCTURE<br>
      This is a single-payload Active Buff Aura.<br>
      The aura spends its Payload Budget only on damage.<br>
      It does not apply Specials, Penetration, Critical, Attack Dice, Armor, Evade, Healing, Temporary HP, Damage Reduction, Phasing, Movement, Reactions, or any other rider.<br><br>
      TIMING<br>
      At the end of each of your turns, enemies inside the aura take the listed damage.<br>
      A creature can be affected by this aura only once per Round.<br>
      Moving the aura over a creature does not trigger the aura.<br><br>
      DAMAGE RESOLUTION<br>
      This is not an attack roll.<br>
      It cannot generate Raises.<br>
      It cannot Crit.<br>
      It does not use weapon damage.<br>
      It does not benefit from Active Buff: Damage, Active Buff: Penetration, Active Buff: Critical, or Special Increase.<br>
      Targets apply Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → PP 40 − Radius 2 m (20) = 20 Payload. Minimum function exception grants 1d8.<br>
      L2 → PP 70 − Radius 2 m (20) = 50 Payload → 1d8.<br>
      L3 → PP 100 − Radius 2 m (20) = 80 Payload → 2d8.<br>
      L4 → PP 130 − Radius 2 m (20) = 110 Payload → 3d8.<br>
      L5 → PP 160 − Radius 2 m (20) = 140 Payload → 4d8.<br>
      L6 → PP 190 − Radius 2 m (20) = 170 Payload → 4d8.<br>
      L7 → PP 220 − Radius 2 m (20) = 200 Payload → 5d8.<br>
      L8 → PP 250 − Radius 3 m (50) = 200 Payload → 5d8.<br>
      L9 → PP 280 − Radius 3 m (50) = 230 Payload → 6d8.<br>
      L10 → PP 310 − Radius 3 m (50) = 260 Payload → 7d8.<br>
      L11 → PP 340 − Radius 3 m (50) = 290 Payload → 8d8.<br>
      L12 → PP 370 − Radius 3 m (50) = 320 Payload → 9d8.<br>
      L13 → PP 400 − Radius 3 m (50) = 350 Payload → 10d8.<br>
      L14 → PP 430 − Radius 3 m (50) = 380 Payload → 10d8.<br>
      L15 → PP 460 − Radius 4 m (90) = 370 Payload → 10d8.<br>
      L16 → PP 490 − Radius 4 m (90) = 400 Payload → 11d8.
    </span>
  </span>
</h3>

You radiate harmful force, flame, thorns, shadow, frost, pressure, divine wrath, or other damaging power.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **1d8 damage**. |
| **2** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **1d8 damage**. |
| **3** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **2d8 damage**. |
| **4** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **3d8 damage**. |
| **5** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **4d8 damage**. |
| **6** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **4d8 damage**. |
| **7** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **5d8 damage**. |
| **8** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **5d8 damage**. |
| **9** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **6d8 damage**. |
| **10** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **7d8 damage**. |
| **11** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **8d8 damage**. |
| **12** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **9d8 damage**. |
| **13** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **10d8 damage**. |
| **14** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **10d8 damage**. |
| **15** | Active Buff | Self | 4 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **10d8 damage**. |
| **16** | Active Buff | Self | 4 m radius | Mastery Rank Rounds | At the end of each of your turns, enemies in the aura take **11d8 damage**. |

---
:


<h3 id="active-buff-healing-aura">
  Active Buff: Healing Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, then +30 PP per level up to Level 16.<br>
      Aura radius bands: L1–7 = 2 m for 20 PP, L8–14 = 3 m for 50 PP, L15–16 = 4 m for 90 PP.<br>
      Aura Healing = 35 PP per 1d8 healing, matching the Aura Damage pricing for automatic repeated aura payloads.<br><br>
      DESIGN STRUCTURE<br>
      This is a single-payload Active Buff Aura.<br>
      The aura spends its Payload Budget only on healing dice.<br>
      It does not grant Temporary HP, Damage, Specials, Armor, Evade, Damage Reduction, Phasing, Movement, Reactions, or any other rider.<br><br>
      TIMING<br>
      At the end of each of your turns, allies inside the aura heal the listed dice.<br>
      A creature can be affected by this aura only once per Round.<br>
      Moving the aura over a creature does not trigger the aura.<br><br>
      HEALING RULES<br>
      This heals real HP inside the current Health Bar.<br>
      It does not restore lost Health Bars unless another rule explicitly says so.<br>
      Roll the listed healing dice separately for each affected ally.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → PP 40 − Radius 2 m (20) = 20 Payload. Minimum function exception grants 1d8 healing.<br>
      L2 → PP 70 − Radius 2 m (20) = 50 Payload → 1d8 healing.<br>
      L3 → PP 100 − Radius 2 m (20) = 80 Payload → 2d8 healing.<br>
      L4 → PP 130 − Radius 2 m (20) = 110 Payload → 3d8 healing.<br>
      L5 → PP 160 − Radius 2 m (20) = 140 Payload → 4d8 healing.<br>
      L6 → PP 190 − Radius 2 m (20) = 170 Payload → 4d8 healing.<br>
      L7 → PP 220 − Radius 2 m (20) = 200 Payload → 5d8 healing.<br>
      L8 → PP 250 − Radius 3 m (50) = 200 Payload → 5d8 healing.<br>
      L9 → PP 280 − Radius 3 m (50) = 230 Payload → 6d8 healing.<br>
      L10 → PP 310 − Radius 3 m (50) = 260 Payload → 7d8 healing.<br>
      L11 → PP 340 − Radius 3 m (50) = 290 Payload → 8d8 healing.<br>
      L12 → PP 370 − Radius 3 m (50) = 320 Payload → 9d8 healing.<br>
      L13 → PP 400 − Radius 3 m (50) = 350 Payload → 10d8 healing.<br>
      L14 → PP 430 − Radius 3 m (50) = 380 Payload → 10d8 healing.<br>
      L15 → PP 460 − Radius 4 m (90) = 370 Payload → 10d8 healing.<br>
      L16 → PP 490 − Radius 4 m (90) = 400 Payload → 11d8 healing.
    </span>
  </span>
</h3>

You radiate restorative force, warmth, blessing, blood magic, life energy, or stabilizing power.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **1d8 HP**. |
| **2** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **1d8 HP**. |
| **3** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **2d8 HP**. |
| **4** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **3d8 HP**. |
| **5** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **4d8 HP**. |
| **6** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **4d8 HP**. |
| **7** | Active Buff | Self | 2 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **5d8 HP**. |
| **8** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **5d8 HP**. |
| **9** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **6d8 HP**. |
| **10** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **7d8 HP**. |
| **11** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **8d8 HP**. |
| **12** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **9d8 HP**. |
| **13** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **10d8 HP**. |
| **14** | Active Buff | Self | 3 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **10d8 HP**. |
| **15** | Active Buff | Self | 4 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **10d8 HP**. |
| **16** | Active Buff | Self | 4 m radius | Mastery Rank Rounds | At the end of each of your turns, allies in the aura heal **11d8 HP**. |

---
}}
\page
{{pageNumber,auto}}
{{wide

\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-size-damage-armor">
  Active Buff: Size + Damage + Armor
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 / 70 / 100 / 130 PP, then +30 PP per level up to Level 16.<br>
      +1d8 Damage = 15 PP.<br>
      +1 Armor = 7.5 PP.<br><br>

 DESIGN STRUCTURE<br>
      This is a Form Active Buff with two paid axes: Damage and Armor.<br>
      The Size Stage, Footprint, Reach Bonus, Titanic Stability, and Drawbacks are part of the form package.<br>
      Active Buff: Size + Damage + Armor is intentionally written as a Tree Exception Active Buff because it combines offensive scaling, defensive scaling, battlefield-size rules, and stability rules in one maintained state.<br><br>

  SIZE PACKAGE<br>
      Enlarged Frame is still 1 hex and grants no Reach Bonus.<br>
      Large Form occupies 3 connected hexes and grants +2 m Reach.<br>
      Massive Form occupies 3 connected hexes and grants +3 m Reach.<br>
      Huge Form occupies 7 connected hexes and grants +4 m Reach.<br>
      True Giant Form occupies 7 connected hexes and grants +5 m Reach.<br><br>

  TITANIC STABILITY<br>
      Active Buff: Size + Damage + Armor does not grant full Immovable.<br>
      Instead, larger Size Stages reduce Push, Pull, and forced movement by a fixed distance.<br>
      Large Form reduces Push, Pull, and forced movement by 2 m.<br>
      Massive Form reduces Push, Pull, and forced movement by 4 m.<br>
      Huge Form reduces Push, Pull, and forced movement by 6 m.<br>
      True Giant Form reduces Push, Pull, and forced movement by 8 m.<br>
      Large Form and Massive Form are immune to Prone effects caused by creatures smaller than you.<br>
      Huge Form and True Giant Form are immune to standard Prone effects.<br>
      Legendary effects, collapsing terrain, falling ground, divine effects, or GM-defined environmental disasters may ignore this stability.<br><br>

  DRAWBACK PACKAGE<br>
      A larger body is easier to target, harder to hide, worse at using cover, and more vulnerable to area effects.<br>
      Enemies may target any hex you occupy.<br>
      If any hex you occupy is inside an AoE, you are affected by that AoE.<br>
      You cannot benefit from cover that would not reasonably cover your current Size Stage.<br>
      If you cannot fit into a space, you must squeeze or cannot enter that space. While squeezing, double the listed Evade penalty.<br><br>

  REACH LIMIT<br>
      The Reach Bonus applies only to melee attacks and touch-range effects.<br>
      It does not increase spell range, ranged weapon range, aura size, movement, AoE, cone size, breath size, zone size, or the range of non-melee Powers.<br><br>

  CALCULATION<br>
      L1 → +1d8 Damage (15) +2 Armor (15) = 30 PP, under target because the form has minor drawbacks.<br>
      L2 → +2d8 Damage (30) +4 Armor (30) = 60 PP, close to target after drawbacks.<br>
      L3 → +3d8 Damage (45) +6 Armor (45) = 90 PP, close to target after drawbacks.<br>
      L4 → +4d8 Damage (60) +8 Armor (60) = 120 PP, close to target after Large Form package.<br>
      L5 → +5d8 Damage (75) +10 Armor (75) = 150 PP, close to target after drawbacks.<br>
      L6 → +6d8 Damage (90) +12 Armor (90) = 180 PP, close to target after drawbacks.<br>
      L7 → +7d8 Damage (105) +14 Armor (105) = 210 PP, close to target after drawbacks.<br>
      L8 → +8d8 Damage (120) +16 Armor (120) = 240 PP, close to target after Massive Form package.<br>
      L9 → +9d8 Damage (135) +18 Armor (135) = 270 PP, close to target after drawbacks.<br>
      L10 → +10d8 Damage (150) +20 Armor (150) = 300 PP, close to target after drawbacks.<br>
      L11 → +11d8 Damage (165) +22 Armor (165) = 330 PP, close to target after drawbacks.<br>
      L12 → +12d8 Damage (180) +24 Armor (180) = 360 PP, close to target after Huge Form package.<br>
      L13 → +13d8 Damage (195) +26 Armor (195) = 390 PP, close to target after drawbacks.<br>
      L14 → +14d8 Damage (210) +28 Armor (210) = 420 PP, close to target after drawbacks.<br>
      L15 → +15d8 Damage (225) +30 Armor (225) = 450 PP, close to target after drawbacks.<br>
      L16 → +16d8 Damage (240) +32 Armor (240) = 480 PP, close to target after True Giant package.<br><br>

  NOTES<br>
      This Active Buff grants no Attack Dice, no Critical, no Penetration, no Special Application, no Special Increase, no Extra Attacks, no Damage Reduction, no Phasing, and no Movement Power.<br>
      Active Buff: Size + Damage + Armor does not grant bonus movement.<br>
      Active Buff: Size + Damage + Armor uses your maintained Active Buff slot.
    </span>
  </span>
</h3>

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Size Stage** | **Footprint** | **Reach Bonus** | **Titanic Stability** | **Effect** | **Drawback** |
|:--:|:--|:--:|:--:|:--:|:--|:--:|:--:|:--|:--|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Enlarged Frame | 1 hex | — | — | Gain **+1d8 Damage** and **+2 Armor**. | **-1 Evade**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Enlarged Frame | 1 hex | — | — | Gain **+2d8 Damage** and **+4 Armor**. | **-1 Evade**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Enlarged Frame | 1 hex | — | — | Gain **+3d8 Damage** and **+6 Armor**. | **-2 Evade**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Large Form | 3 hexes | +2 m | Reduce Push, Pull, and forced movement by **4 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+4d8 Damage** and **+8 Armor**. | **-4 Evade** and **-4 Initiative**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Large Form | 3 hexes | +2 m | Reduce Push, Pull, and forced movement by **5 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+5d8 Damage** and **+10 Armor**. | **-4 Evade** and **-4 Initiative**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Large Form | 3 hexes | +2 m | Reduce Push, Pull, and forced movement by **6 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+6d8 Damage** and **+12 Armor**. | **-5 Evade** and **-4 Initiative**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Large Form | 3 hexes | +2 m | Reduce Push, Pull, and forced movement by **7 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+7d8 Damage** and **+14 Armor**. | **-5 Evade** and **-4 Initiative**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Massive Form | 3 hexes | +3 m | Reduce Push, Pull, and forced movement by **8 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+8d8 Damage** and **+16 Armor**. | **-6 Evade**, **-8 Initiative**, and **-1d8 Agility-based Physical Skills**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Massive Form | 3 hexes | +3 m | Reduce Push, Pull, and forced movement by **9 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+9d8 Damage** and **+18 Armor**. | **-6 Evade**, **-8 Initiative**, and **-1d8 Agility-based Physical Skills**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Massive Form | 3 hexes | +3 m | Reduce Push, Pull, and forced movement by **10 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+10d8 Damage** and **+20 Armor**. | **-7 Evade**, **-8 Initiative**, and **-1d8 Agility-based Physical Skills**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Massive Form | 3 hexes | +3 m | Reduce Push, Pull, and forced movement by **11 m**. Immune to Prone effects caused by creatures smaller than you. | Gain **+11d8 Damage** and **+22 Armor**. | **-7 Evade**, **-8 Initiative**, and **-1d8 Agility-based Physical Skills**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Huge Form | 7 hexes | +4 m | Reduce Push, Pull, and forced movement by **12 m**. Immune to standard Prone effects. | Gain **+12d8 Damage** and **+24 Armor**. | **-10 Evade**, **-12 Initiative**, and **-2d8 Agility-based Physical Skills**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Huge Form | 7 hexes | +4 m | Reduce Push, Pull, and forced movement by **13 m**. Immune to standard Prone effects. | Gain **+13d8 Damage** and **+26 Armor**. | **-10 Evade**, **-12 Initiative**, and **-2d8 Agility-based Physical Skills**. |

}}
\page
{{pageNumber,auto}}
{{wide

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Size Stage** | **Footprint** | **Reach Bonus** | **Titanic Stability** | **Effect** | **Drawback** |
|:--:|:--|:--:|:--:|:--:|:--|:--:|:--:|:--|:--|:--|
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Huge Form | 7 hexes | +4 m | Reduce Push, Pull, and forced movement by **14 m**. Immune to standard Prone effects. | Gain **+14d8 Damage** and **+28 Armor**. | **-11 Evade**, **-12 Initiative**, and **-2d8 Agility-based Physical Skills**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Huge Form | 7 hexes | +4 m | Reduce Push, Pull, and forced movement by **15 m**. Immune to standard Prone effects. | Gain **+15d8 Damage** and **+30 Armor**. | **-11 Evade**, **-12 Initiative**, and **-2d8 Agility-based Physical Skills**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | True Giant Form | 7 hexes | +5 m | Reduce Push, Pull, and forced movement by **16 m**. Immune to standard Prone effects. | Gain **+16d8 Damage** and **+32 Armor**. | **-12 Evade**, **-16 Initiative**, and **-2d8 Agility-based Physical Skills**. |

#### Active Buff: Size + Damage + Armor Rules

While this Active Buff is active, the following rules apply:

- **Occupied Space:** You occupy all hexes listed by your current Size Stage.
- **Targeting:** Enemies may target any hex you occupy.
- **Area Effects:** If any hex you occupy is inside an AoE, you are affected by that AoE.
- **Cover:** You cannot benefit from cover that would not reasonably cover your current Size Stage.
- **Squeezing:** If your current Size Stage cannot physically fit into a space, you must squeeze or cannot enter that space. While squeezing, double the listed Evade penalty.
- **Reach:** Your Reach Bonus applies only to melee attacks and touch-range effects.
- **No Range Extension:** This Reach Bonus does not increase spell range, ranged weapon range, aura size, movement, AoE, cone size, breath size, zone size, or the range of non-melee Powers.
- **Titanic Stability:** While Large Form or larger, reduce any Push, Pull, or forced movement applied to you by the amount listed for your Size Stage.
- **Prone Resistance:** While in Large Form or Massive Form, you are immune to Prone effects caused by creatures smaller than you.
- **Prone Immunity:** While in Huge Form or True Giant Form, you are immune to standard Prone effects.
- **Stability Limit:** Titanic Stability is not full Immovable. It does not prevent teleportation, falling if the ground disappears, being carried by collapsing terrain, Root, Stunned, Slow, grapple-like restraints, legendary effects, divine effects, or GM-defined environmental disasters.
- **Grapple Presence:** While Large Form or larger, gain Advantage on checks to start or end Grappled against smaller creatures.
- **Massive Stability:** While Huge Form or larger, creatures smaller than you have Disadvantage on checks to move you by force unless they are also magically enlarged or larger than Medium.
- **No Bonus Movement:** Active Buff: Size + Damage + Armor does not grant additional movement.
- **Maintained Buff:** Active Buff: Size + Damage + Armor uses your maintained Active Buff slot. If you activate another maintained Active Buff, Active Buff: Size + Damage + Armor ends unless another rule explicitly allows both to coexist.




}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-summon-damage-aura">
  Active Buff: Summon Damage Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active Buff<br>
      Target = caster's own Summons only<br>
      Does not affect caster<br>
      Does not affect allies<br>
      Duration = Mastery Rank rounds<br>
      A character can maintain only one Active Buff at a time unless a rule explicitly says otherwise.<br><br>

DESIGN NOTE<br>
      This Buff is cheaper than a normal AoE Damage Buff because it affects only the caster's own Summons.<br>
      It cannot be used as a party damage aura.<br>
      It cannot buff the caster.<br>
      It cannot buff allied characters.<br><br>

RADIUS<br>
      The radius is intentionally large so a Summoner can command several Summon Bodies without excessive positioning tax.<br>
      A Summon must be within the radius when it deals damage to gain the bonus.
    </span>
  </span>
</h3>

The caster empowers the attacks of their own Summons.

This Power affects only the caster's own Summons.

It does not affect the caster.

It does not affect allies.

| **Level** | **Damage Bonus** | **Radius** |
|:--:|:--:|:--:|
| **1** | +1d8 Damage | 8 m |
| **2** | +1d8 Damage | 10 m |
| **3** | +2d8 Damage | 12 m |
| **4** | +2d8 Damage | 14 m |
| **5** | +3d8 Damage | 16 m |
| **6** | +3d8 Damage | 18 m |
| **7** | +4d8 Damage | 20 m |
| **8** | +4d8 Damage | 22 m |
| **9** | +5d8 Damage | 24 m |
| **10** | +5d8 Damage | 26 m |
| **11** | +6d8 Damage | 28 m |
| **12** | +6d8 Damage | 30 m |
| **13** | +7d8 Damage | 32 m |
| **14** | +7d8 Damage | 34 m |
| **15** | +8d8 Damage | 36 m |
| **16** | +8d8 Damage | 40 m |

A Summon must be within the radius when it deals damage to gain the bonus.

If a Summon Bond makes multiple attacks, the bonus applies to each Summon Attack.

The bonus ends when this Active Buff ends.

}}
\page
{{pageNumber,auto}}
{{wide


<h3 id="active-buff-summon-armor-aura">
  Active Buff: Summon Armor Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active Buff<br>
      Target = caster's own Summons only<br>
      Does not affect caster<br>
      Does not affect allies<br>
      Duration = Mastery Rank rounds<br>
      A character can maintain only one Active Buff at a time unless a rule explicitly says otherwise.<br><br>

 DESIGN NOTE<br>
      This Buff is cheaper than a normal AoE Armor Buff because it affects only the caster's own Summons.<br>
      It cannot be used as a party defense aura.<br>
      It cannot buff the caster.<br>
      It cannot buff allied characters.<br><br>
  RADIUS<br>
      The radius is intentionally large so a Summoner can keep several Summon Bodies protected without excessive positioning tax.<br>
      A Summon must be within the radius to gain the Armor bonus.
    </span>
  </span>
</h3>

The caster strengthens the defenses of their own Summons.

This Power affects only the caster's own Summons.

It does not affect the caster.

It does not affect allies.

| **Level** | **Armor Bonus** | **Radius** |
|:--:|:--:|:--:|
| **1** | +2 Armor | 8 m |
| **2** | +4 Armor | 10 m |
| **3** | +6 Armor | 12 m |
| **4** | +8 Armor | 14 m |
| **5** | +10 Armor | 16 m |
| **6** | +12 Armor | 18 m |
| **7** | +14 Armor | 20 m |
| **8** | +16 Armor | 22 m |
| **9** | +18 Armor | 24 m |
| **10** | +20 Armor | 26 m |
| **11** | +22 Armor | 28 m |
| **12** | +24 Armor | 30 m |
| **13** | +26 Armor | 32 m |
| **14** | +28 Armor | 34 m |
| **15** | +30 Armor | 36 m |
| **16** | +32 Armor | 40 m |

A Summon must be within the radius to gain the Armor bonus.

The bonus is lost immediately when the Summon leaves the radius.

The bonus ends when this Active Buff ends.
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="active-buff-thorns">
  Active Buff: Thorns
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, 70 PP at Level 2, 100 PP at Level 3, 130 PP at Level 4, then +30 PP per level after that.<br>
      Thorns = 30 PP per +1d8 Thorns.<br>
      Thorns is reflected damage, not an attack and not a Special.<br><br>

  DESIGN STRUCTURE<br>
      This is a pure Active Buff with exactly one axis: Thorns damage.<br>
      It grants no Armor, no Evade, no Temporary HP, no Healing, no Damage Reduction, no Phasing, no Penetration, no Critical, and no Special rider.<br>
      Thorns damage triggers only when the user takes final HP damage from a direct attack, Spell, or Power.<br>
      Thorns damage cannot exceed the final HP damage the user took from the triggering effect.<br><br>

 LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → Thorns 1d8 = 30 PP below target.<br>
      L2 target 70 PP → Thorns 2d8 = 60 PP below target.<br>
      L3 target 100 PP → Thorns 3d8 = 90 PP below target.<br>
      L4 target 130 PP → Thorns 4d8 = 120 PP below target.<br>
      L5 target 160 PP → Thorns 5d8 = 150 PP below target.<br>
      L6 target 190 PP → Thorns 6d8 = 180 PP below target.<br>
      L7 target 220 PP → Thorns 7d8 = 210 PP below target.<br>
      L8 target 250 PP → Thorns 8d8 = 240 PP below target.<br>
      L9 target 280 PP → Thorns 9d8 = 270 PP below target.<br>
      L10 target 310 PP → Thorns 10d8 = 300 PP below target.<br>
      L11 target 340 PP → Thorns 11d8 = 330 PP below target.<br>
      L12 target 370 PP → Thorns 12d8 = 360 PP below target.<br>
      L13 target 400 PP → Thorns 13d8 = 390 PP below target.<br>
      L14 target 430 PP → Thorns 14d8 = 420 PP below target.<br>
      L15 target 460 PP → Thorns 15d8 = 450 PP below target.<br>
      L16 target 490 PP → Thorns 16d8 = 480 PP below target.<br><br>
 NOTES<br>
      This Active Buff is intentionally slightly below curve at every level because Thorns can trigger outside the user's turn and does not require an attack roll. It is capped by final HP damage taken and follows all normal Thorns restrictions.
    </span>
  </span>
</h3>

You cover yourself in thorns, barbs, splinters, curse-spines, living bark, bone hooks, blood needles, or reflected harm.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 1d8**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 2d8**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 3d8**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 4d8**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 5d8**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 6d8**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 7d8**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 8d8**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 9d8**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 10d8**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 11d8**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 12d8**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 13d8**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 14d8**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 15d8**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Thorns 16d8**. |

When you take final HP damage from a direct attack, Spell, or Power, the source of that damage takes your Thorns damage after the triggering effect is fully resolved.

Thorns damage cannot exceed the final HP damage you took from the triggering effect.

If the triggering effect deals no final HP damage to you, this Active Buff deals no damage.

This Active Buff follows all normal Thorns rules.



}}


\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-invisibility">
  Active Buff: Invisibility
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, 70 PP at Level 2, 100 PP at Level 3, 130 PP at Level 4, then +30 PP per level after that.<br>
      Invisibility is a premium defensive axis based on perception, sense blocking, and target denial.<br><br>
      DESIGN STRUCTURE<br>
      Active Buff: Invisibility grants a stronger temporary Invisibility Bonus than the Passive line.<br>
      Unlike Passive Invisibility, this Active Buff blocks only Normal Combat Awareness.<br>
      It does not block Special Combat Senses by itself.<br><br>
      RESTRICTIONS<br>
      Active Buff: Invisibility does not reduce damage.<br>
      Active Buff: Invisibility does not increase Evade.<br>
      Active Buff: Invisibility does not grant Armor, Damage Reduction, Phasing, Temporary HP, or Healing.<br>
      Active Buff: Invisibility does not grant Special Combat Sense blocking.<br><br>
      SUBSYSTEM EXCEPTION<br>
      Active Buff: Invisibility may stack with Passive Invisibility.<br>
      If both are active, add both Invisibility Bonuses together.<br>
      If Passive Invisibility blocks Special Combat Senses, those blocks still apply while this Active Buff is active.<br>
      This is an explicit Invisibility subsystem exception and does not apply to other Active Buffs.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 40 PP → +1 Invisibility Bonus, Normal Combat Awareness only.<br>
      L2 target 70 PP → +2 Invisibility Bonus, Normal Combat Awareness only.<br>
      L3 target 100 PP → +3 Invisibility Bonus, Normal Combat Awareness only.<br>
      L4 target 130 PP → +4 Invisibility Bonus, Normal Combat Awareness only.<br>
      L5 target 160 PP → +5 Invisibility Bonus, Normal Combat Awareness only.<br>
      L6 target 190 PP → +6 Invisibility Bonus, Normal Combat Awareness only.<br>
      L7 target 220 PP → +7 Invisibility Bonus, Normal Combat Awareness only.<br>
      L8 target 250 PP → +8 Invisibility Bonus, Normal Combat Awareness only.<br>
      L9 target 280 PP → +9 Invisibility Bonus, Normal Combat Awareness only.<br>
      L10 target 310 PP → +10 Invisibility Bonus, Normal Combat Awareness only.<br>
      L11 target 340 PP → +11 Invisibility Bonus, Normal Combat Awareness only.<br>
      L12 target 370 PP → +12 Invisibility Bonus, Normal Combat Awareness only.<br>
      L13 target 400 PP → +13 Invisibility Bonus, Normal Combat Awareness only.<br>
      L14 target 430 PP → +14 Invisibility Bonus, Normal Combat Awareness only.<br>
      L15 target 460 PP → +15 Invisibility Bonus, Normal Combat Awareness only.<br>
      L16 target 490 PP → +16 Invisibility Bonus, Normal Combat Awareness only.<br><br>
      NOTES<br>
      This Active Buff is intentionally narrow. It gives a high temporary Invisibility Bonus, but only against Normal Combat Awareness. Special Combat Senses remain a counter unless blocked by Passive Invisibility or another explicit Invisibility subsystem rule.
    </span>
  </span>
</h3>

You vanish behind shimmer, shadow, distortion, mist, bent light, or predatory camouflage.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+1 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+3 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+7 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+11 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+12 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+13 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+14 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+15 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+16 Invisibility Bonus**. Blocks **Normal Combat Awareness**. |

The Invisibility Bonus increases the Perception TN required to locate, target, or read you.

**Perception TN = normal Skill Check TN by your Mastery Rank + current Invisibility Bonus**

Your current Invisibility Bonus may be reduced by **Cloak Disruption**.

This Active Buff may stack with **Passive Invisibility**. If both are active, add both Invisibility Bonuses together.

This Active Buff does not block Special Combat Senses unless another explicit Invisibility subsystem rule says otherwise.
}}


\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-parry-recovery">
  Active Buff: Parry Recovery
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, then +30 PP per Level.<br>
      This is a dedicated Parry subsystem Active Buff.<br><br>

  REQUIREMENT<br>
  Requires the Parry Passive.<br>
  This Buff has no effect while you are not Parrying.<br><br>

  DESIGN STRUCTURE<br>
  Whenever you spend Parry against an eligible Attack, regain spent Parry after that Attack resolves.<br>
  The total amount of Parry regained through this Buff cannot exceed its listed maximum during each Round.<br>
  Regained Parry cannot increase your current Pool above the amount with which you entered Parry that Turn.<br><br>

  SCALING<br>
  Regain a total of up to 2 Parry per Power Level during each Round.<br>
  You cannot regain more Parry than you have spent during that Round.<br>
  The recovery limit resets at the beginning of each new Round.<br><br>

  EXAMPLE<br>
  You spend 10 Parry to remove 10 Attack Dice while using Active Buff: Parry Recovery Level 4.<br>
  After the Attack resolves, regain up to 8 Parry.<br>
  The Attack therefore consumes only 2 Parry from your Pool.<br>
  You have reached this Buff's recovery limit and cannot regain further Parry until the beginning of the next Round.<br><br>

  NOTES<br>
  This Buff does not create Parry by itself.<br>
  It grants no Armor, Evade, Damage Reduction, Phasing, Temporary HP, Reaction, free Attack, or Riposte.<br>
  It uses the character's maintained Active Buff slot.
</span>


  </span>
</h3>

You settle into an enduring defensive rhythm, recovering your guard after every intercepted strike.

---

**Requirement:** Parry Passive

While this Active Buff is maintained, whenever you spend Parry against an eligible Attack, regain spent Parry after that Attack resolves.

The total amount of Parry you may regain during each Round cannot exceed the value listed for this Power's Level.

You cannot regain more Parry than you have spent, and your current Parry Pool cannot exceed the amount with which you entered Parry that Turn.

The recovery limit resets at the beginning of each new Round.

| **Level** | **Type**           | **Range** | **AoE** |     **Duration**    | **Effect**                                      |
| :-------: | :----------------- | :-------: | :-----: | :-----------------: | :---------------------------------------------- |
|   **1**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **2 Parry per Round**.  |
|   **2**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **4 Parry per Round**.  |
|   **3**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **6 Parry per Round**.  |
|   **4**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **8 Parry per Round**.  |
|   **5**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **10 Parry per Round**. |
|   **6**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **12 Parry per Round**. |
|   **7**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **14 Parry per Round**. |
|   **8**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **16 Parry per Round**. |
|   **9**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **18 Parry per Round**. |
|   **10**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **20 Parry per Round**. |
|   **11**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **22 Parry per Round**. |
|   **12**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **24 Parry per Round**. |
|   **13**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **26 Parry per Round**. |
|   **14**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **28 Parry per Round**. |
|   **15**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **30 Parry per Round**. |
|   **16**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **32 Parry per Round**. |


}}


\page
{{pageNumber,auto}}
{{wide


## Absorption Subsystem

This subsystem Active Buff increases the conversion of real physical injury into Temporary Colorless Stones.

It does not prevent damage, grant additional HP, restore Health Bars, or make the character safer. Instead, it improves the yield of the Absorption Passive while the character continues to suffer actual HP loss.

This Active Buff requires the **Absorption Passive**.

Without the Absorption Passive, it has no effect.

The additional Temporary Colorless Stones follow all normal Absorption rules:

* They are gained in the **Ready** state.
* They may be used as Stones of any Attribute.
* They disappear when spent instead of becoming Exhausted.
* They disappear if they have not been spent by the end of the character's next Turn.
* They cannot be stored, regenerated, transferred, Sealed, Bound, Burned, or invested.

---

### Active Buff: Absorption Stone Increase

While this Active Buff is maintained, the first time during each Round that the Absorption Passive generates one or more Temporary Colorless Stones, gain additional Temporary Colorless Stones according to this Power's Level.

This bonus is applied only once per Round.

The bonus is triggered by a successful Absorption harvest, not by each individual Stone generated.

#### Example

A character with Vitality 8 loses 24 actual HP and generates 3 Temporary Colorless Stones through the Absorption Passive.

If the character maintains **Active Buff: Absorption Stone Increase Level 4**, the first harvest of that Round grants 1 additional Temporary Colorless Stone.

The character gains a total of 4 Temporary Colorless Stones.

Further damage during the same Round may still generate normal Temporary Colorless Stones, but it does not trigger the Active Buff's bonus again.

---
}}


\page
{{pageNumber,auto}}
{{wide

<h3 id="active-buff-absorption-stone-increase">
  Active Buff: Absorption Stone Increase
  <span class="tooltip">🛈
    <span class="tooltiptext">
      ABSORPTION SUBSYSTEM<br>
      Active Buff: Absorption Stone Increase is a closed premium Absorption Active Buff.<br>
      It requires the Absorption Passive and has no effect without it.<br><br>

  ACTIVE BUFF RULES<br>
  Activation costs 1 Attack Action.<br>
  Duration is Mastery Rank Rounds.<br>
  This Power occupies the character's maintained Active Buff slot.<br><br>

  CORE EFFECT<br>
  The first time during each Round that the Absorption Passive generates one or more Temporary Colorless Stones, gain additional Temporary Colorless Stones.<br>
  This bonus applies once per Round, regardless of how many Stones the triggering damage generated.<br><br>

  MILESTONES<br>
  L1–4 = +1 Temporary Colorless Stone.<br>
  L5–8 = +2 Temporary Colorless Stones.<br>
  L9–12 = +3 Temporary Colorless Stones.<br>
  L13–16 = +4 Temporary Colorless Stones.<br><br>

  TEMPORARY STONES<br>
  Additional Stones follow all normal Absorption rules.<br>
  They are gained Ready.<br>
  They disappear when spent.<br>
  Unspent Stones disappear at the end of the character's next Turn.<br><br>

  RESTRICTIONS<br>
  This Buff grants no Maximum HP, Healing, Temporary HP, Armor, Evade, Damage Reduction, Phasing, Parry, Attack Dice, Damage, free Attacks, or additional Reactions.<br>
  It does not prevent or reduce incoming damage.<br>
  It does not generate Stones unless the Absorption Passive generates at least one Stone normally.<br><br>

  NOTES<br>
  The character must continue taking actual HP damage to benefit from this Power.<br>
  Unused PP is intentionally ignored because Absorption is a closed premium milestone subsystem.
</span>


  </span>
</h3>

You open yourself fully to violence, drawing a greater surge of unstable power from the first wounds suffered each Round.

---

**Requirement:** Absorption Passive

The first time during each Round that your Absorption Passive generates one or more Temporary Colorless Stones, gain the additional Stones listed below.

This bonus can trigger only **once per Round**.

| **Level** | **Type**                | **Range** | **AoE** |     **Duration**    | **Effect**                                                                           |
| :-------: | :---------------------- | :-------: | :-----: | :-----------------: | :----------------------------------------------------------------------------------- |
|   **1**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+1 Temporary Colorless Stone**.  |
|   **2**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+1 Temporary Colorless Stone**.  |
|   **3**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+1 Temporary Colorless Stone**.  |
|   **4**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+1 Temporary Colorless Stone**.  |
|   **5**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+2 Temporary Colorless Stones**. |
|   **6**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+2 Temporary Colorless Stones**. |
|   **7**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+2 Temporary Colorless Stones**. |
|   **8**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+2 Temporary Colorless Stones**. |
|   **9**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+3 Temporary Colorless Stones**. |
|   **10**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+3 Temporary Colorless Stones**. |
|   **11**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+3 Temporary Colorless Stones**. |
|   **12**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+3 Temporary Colorless Stones**. |
|   **13**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+4 Temporary Colorless Stones**. |
|   **14**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+4 Temporary Colorless Stones**. |
|   **15**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+4 Temporary Colorless Stones**. |
|   **16**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first Absorption harvest each Round generates **+4 Temporary Colorless Stones**. |

---

}}

\page
{{pageNumber,auto}}
{{wide
<h3 id="active-buff-damage-negation-pool">
  Active Buff: Damage Negation Pool
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active Buff curve = 40 PP at Level 1, then +30 PP per Level.<br>
      This is a dedicated Damage Negation subsystem Active Buff.<br><br>


  REQUIREMENT<br>
  Requires the Damage Negation Passive.<br>
  This Buff has no effect without an active Damage Negation Reserve.<br><br>

  DESIGN STRUCTURE<br>
  While this Buff is maintained, gain a separate Temporary Damage Negation Pool at the beginning of each Round.<br>
  This Pool may be spent in addition to the long-term Damage Negation Reserve granted by the Passive.<br>
  Unspent Temporary Damage Negation is lost when the Pool refreshes.<br><br>

  SCALING<br>
  Gain 1 Temporary Damage Negation per Power Level at the beginning of each Round.<br>
  Each point removes 1 Damage Die from an eligible Damage Pool before it is rolled.<br><br>

  SPENDING ORDER<br>
  Temporary Damage Negation is spent before the character's long-term Damage Negation Reserve.<br>
  Once the Temporary Damage Negation Pool is empty, the character may spend from the Passive's Reserve normally.<br><br>

  HALF-POOL LIMIT<br>
  Temporary Damage Negation and the long-term Damage Negation Reserve share the normal Damage Negation limit.<br>
  All Damage Negation effects combined can never remove more than half of the original Damage Dice assigned to the character, rounded down.<br><br>

  EXAMPLE<br>
  You maintain Active Buff: Damage Negation Pool Level 4 and begin the Round with 4 Temporary Damage Negation.<br>
  An Attack hits you with a Damage Pool of 10d8.<br>
  You may remove no more than 5 Damage Dice in total.<br>
  You spend all 4 Temporary Damage Negation and 1 point from your long-term Damage Negation Reserve.<br>
  The remaining 5d8 are rolled normally.<br><br>

  NOTES<br>
  This Buff does not restore the long-term Damage Negation Reserve.<br>
  Temporary Damage Negation cannot be stored or carried into another Round.<br>
  This Buff grants no Armor, Evade, Parry, Damage Reduction, Phasing, Temporary HP, Healing, Absorption, Ward, Reaction, free Attack, or additional action economy.<br>
  It uses the character's maintained Active Buff slot.
</span>

  </span>
</h3>

You reinforce your defensive field, continuously stripping destructive force from incoming attacks without exhausting your deeper reserves.

---

**Requirement:** Damage Negation Passive

While this Active Buff is maintained, gain a separate **Temporary Damage Negation Pool** at the beginning of each Round.

The Pool contains an amount of Temporary Damage Negation equal to this Power's Level.

Each point of Temporary Damage Negation may remove **1 Damage Die** from an eligible Damage Pool before it is rolled.

Temporary Damage Negation is spent before your long-term Damage Negation Reserve.

Unspent Temporary Damage Negation is lost when the Pool refreshes at the beginning of the next Round.

Temporary Damage Negation and your normal Damage Negation Reserve share the normal **half-pool limit**. All Damage Negation effects combined can never remove more than half of the original Damage Dice assigned to you, rounded down.

| **Level** | **Type**                     | **Range** | **AoE** |     **Duration**    | **Temporary Damage Negation per Round** |
| :-------: | :--------------------------- | :-------: | :-----: | :-----------------: | :-------------------------------- |
|   **1**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **1 Damage Die per Round**        |
|   **2**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **2 Damage Dice per Round**       |
|   **3**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **3 Damage Dice per Round**       |
|   **4**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **4 Damage Dice per Round**       |
|   **5**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **5 Damage Dice per Round**       |
|   **6**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **6 Damage Dice per Round**       |
|   **7**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **7 Damage Dice per Round**       |
|   **8**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **8 Damage Dice per Round**       |
|   **9**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **9 Damage Dice per Round**       |
|   **10**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **10 Damage Dice per Round**      |
|   **11**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **11 Damage Dice per Round**      |
|   **12**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **12 Damage Dice per Round**      |
|   **13**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **13 Damage Dice per Round**      |
|   **14**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **14 Damage Dice per Round**      |
|   **15**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **15 Damage Dice per Round**      |
|   **16**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **16 Damage Dice per Round**      |

}}
