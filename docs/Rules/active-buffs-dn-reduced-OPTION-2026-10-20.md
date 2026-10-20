{{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Active Buffs
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
Destroyed Faith — DF Core Active Buffs
Version: v0.9.9.5 (2026-10-15)
Playtest synchronization: 2026-10-20 (optional DN pool balance reduction; no product-version change)
> **Unavailable lower Power Levels (v0.9.9.5):** A row explicitly marked `Unavailable` grants no effect and cannot be purchased, selected, activated, or received as a valid Artifact Power Level. The first level with an actual effect is the minimum selectable Power Level. No missing effect or new strength value is implied.

}}

}}



\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Active Buffs}}{{ 4}}](#p4)
- #### [{{ Active Buff Rules}}{{ 4}}](#p4)
- #### [{{ Single-Focus Active Buffs}}{{ 5}}](#p5)
- #### [{{ Critical Restriction}}{{ 6}}](#p6)
- #### [{{ Pure Defensive Buffs}}{{ 7}}](#p7)
- #### [{{ Pure Offensive Buffs}}{{ 14}}](#p14)
- #### [{{ Active Buff: Critical}}{{ 16}}](#p16)
- #### [{{ Active Buff: Spell Resistance}}{{ 20}}](#p20)
- #### [{{ Active Buff: Self Cleanse}}{{ 21}}](#p21)
- #### [{{ Active Buff Auras}}{{ 22}}](#p22)
- #### [{{ Active Buff: Damage Aura}}{{ 24}}](#p24)
- #### [{{ Active Buff: Summon Damage Aura}}{{ 25}}](#p25)
- #### [{{ Active Buff: Summon Armor Aura}}{{ 26}}](#p26)
- #### [{{ Active Buff: Thorns}}{{ 27}}](#p27)
- #### [{{ Active Buff: Invisibility}}{{ 28}}](#p28)
- #### [{{ Active Buff: Parry Recovery}}{{ 29}}](#p29)
- #### [{{ Absorption Subsystem}}{{ 30}}](#p30)
- #### [{{ Active Buff: Absorption Stone Increase}}{{ 31}}](#p31)
- #### [{{ Active Buff: Damage Negation Pool}}{{ 32}}](#p32)

}}
\page

{{pageNumber,auto}}
{{wide
## Active Buffs

Active Buffs are temporary combat enhancements.

They temporarily modify one listed mechanical focus or intensify a dedicated combat subsystem.

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
}}
\page

{{pageNumber,auto}}
{{wide
### Linear Scaling Rule

Levels **1–4** define the structure and mechanical identity of an Active Buff.

Levels **5–16** scale that same structure upward.

A standard Active Buff does not gain a new axis, rider, Special, condition, subsystem, or action-economy effect at later Levels.

---

### Single-Focus Active Buffs

For this beta release, each selectable Active Buff is **single-focus**:
it increases one purchased mechanical axis or implements one explicitly
listed dedicated subsystem (such as Critical, Phasing, Invisibility or Absorption).

Pure axes include **Armor, Evade, Temporary HP and Damage**. Each Active Buff purchases **one listed mechanical axis** or one expressly defined dedicated subsystem. Each maintained aura carries **one printed payload**; its radius determines coverage. Separate axes require their own legal abilities under the normal maintained-Buff limits.

---
::
### Active Buff Limits

**Approved Power Point exception (16 October 2026):** Active Buff: Damage may exceed its target budget by **5 PP** across its progression.


Standard Active Buffs may not grant:

* Attack Dice,
* Extra Attacks,
* free Attack Actions,
* additional Reactions,
* Special Application,
* hard control,
* hidden Movement Powers,
* or unrelated secondary effects.

Active Buffs do not apply or increase Specials. **Intellect Stone Ability: Special Boost** remains available under its own Stone Ability rules; the **Universal Raise Effect: Special Increase** is a different rule.

---
}}
\page

{{pageNumber,auto}}
{{wide
### Critical Restriction

Critical is a closed offensive subsystem that can modify qualifying **Martial Attacks and damaging Spells**.

Critical may be granted only through:

1. **Active Buff: Critical** (its own per-combat allowance while maintained),
2. **Agility Ability: Crit** (the prepared per-Round Stone allowance), or
3. **Passive: Critical** (its own per-combat allowance while slotted).

Artifact Stone Power Support may pre-fill named tiers of **Agility Ability: Crit**, but does not grant a separate Critical source. If several sources are available, choose **exactly one** before an eligible roll; one roll spends only the chosen source and multiple Critical sources do not amplify each other.

No other Active, Passive, Reaction, Movement Power, weapon, Special, aura, rider, or combination effect grants Critical without an expressly written exception.

Critical may not appear as a secondary rider.

**Active Buff: Critical** may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or filler value.

---
::
### Dedicated Active Buff Subsystems

Some Active Buffs are dedicated extensions of another subsystem and follow their own exact single-focus subsystem construction rules.

These include:

* Active Buff: Damage Reduction
* Active Buff: Phasing
* Active Buff: Critical
* Active Buff: Invisibility
* Active Buff: Parry Recovery
* Active Buff: Absorption Stone Increase
* Active Buff: Damage Negation Pool

A subsystem Active Buff may require the matching Passive.

If the requirement is not met, the Active Buff has no effect.

Dedicated subsystem Active Buffs cannot authorize an unrelated second mechanical axis.

---
::
### Invisibility Exception

**Passive Invisibility** and **Active Buff: Invisibility** may be active at the same time.

This is an explicit exception to normal subsystem stacking.

If both are active:

* add both Invisibility Bonuses together,
* Passive Invisibility continues to Obscure its chosen Special Combat Senses,
* and Active Buff: Invisibility continues to Obscure Normal Combat Awareness.

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
}}

\page

{{pageNumber,auto}}
{{wide

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
      On activation, gain the listed Temporary HP immediately. At the start of each later Turn while maintained, restore the Temporary HP from this Buff up to the listed value.<br>
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

A temporary protective layer forms immediately when you activate this Buff and rebuilds at the start of each later Turn while maintained. Unlike Reaction Temporary HP, this Buff protects against multiple damage instances.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **10 Temporary HP** from this Buff. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **17 Temporary HP** from this Buff. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **25 Temporary HP** from this Buff. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **32 Temporary HP** from this Buff. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **40 Temporary HP** from this Buff. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **47 Temporary HP** from this Buff. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **55 Temporary HP** from this Buff. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **62 Temporary HP** from this Buff. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **70 Temporary HP** from this Buff. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **77 Temporary HP** from this Buff. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **85 Temporary HP** from this Buff. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **92 Temporary HP** from this Buff. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **100 Temporary HP** from this Buff. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **107 Temporary HP** from this Buff. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **115 Temporary HP** from this Buff. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | On activation and at the start of each later Turn while maintained, gain or restore up to **122 Temporary HP** from this Buff. |

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
| **1** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
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

**Combination order:** The +10% Buff increases the current non-Stone DR subtotal only up to this Buff's printed total-DR cap. A separate qualifying Reaction adds its own eligible bonus under its cap. **Resolve Stone Ability: Damage Reduction** is added afterward, outside these printed caps. Apply the Core's 100% global cap and round the **remaining damage up**.

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
| **1** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
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

## Active Buffs — Pure Offensive

Pure Offensive Active Buffs improve the user's own offensive output for a limited time.

They do not deal damage when activated.  
Instead, they enhance attacks or offensive Powers made while the buff lasts.

Unless an entry says otherwise, a Pure Offensive Active Buff applies only to the user's own attacks.

Pure Offensive Active Buffs should remain clean and focused.

They may improve:

- damage,
- Critical value,
- or one other expressly approved offensive axis.

They may not grant Attack Dice.

They may not grant extra attacks.

They may not grant free actions.

They may not apply detection, reveal, awareness, or sensor effects.

They may not add defensive benefits or a second purchased mechanical axis.

---
}}
\page

{{pageNumber,auto}}
{{wide

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

### Critical Restriction

Critical is a closed offensive subsystem that can modify qualifying **Martial Attacks and damaging Spells**.

The legal sources are **Active Buff: Critical**, **Agility Ability: Crit**, and **Passive: Critical**. Artifact Stone Power Support pre-fills eligible Stone ranks but never creates a fourth source.

Before each eligible Attack Roll or Casting Roll, choose one available source. Do not combine Critical sources or consume two allowances for one roll. No other source grants Critical without an expressly written exception.

Critical may not appear as a secondary rider.

Critical may not be combined with Damage, Penetration, Attack Dice, Special Application, Extra Attacks, defensive effects, or any other filler value.

If a character uses **Active Buff: Critical**, it consumes the maintained Active Buff slot. **Critical(X)** permits **X designated Martial Attack or damaging Spell Casting Pools per combat** while the Buff is active; on those rolls, **7s and 8s explode**. The allowance does not refresh by reactivating the Buff during that combat. Critical gained through **Agility Ability: Crit** follows that Stone Ability's own per-Round allowance instead.


<h3 id="active-buff-critical">
  Active Buff: Critical
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Critical as an Active Buff is a premium offensive subsystem.<br>
      It does not use normal linear +30 PP scaling.<br>
      Active Buff: Critical supplies its printed Critical(X) allowance of **X chosen qualifying Attack/Casting Pools per combat** while maintained; natural 7s and 8s explode on those chosen rolls. Reactivating the Buff in that combat does not refill its allowance.<br><br>
      ACTIVE BUFF CRITICAL MILESTONES<br>
      L1–3 → no effect<br>
      L4–7 → Martial Attacks and damaging Spells gain Critical(1)<br>
      L8–11 → Martial Attacks and damaging Spells gain Critical(2)<br>
      L12–14 → Martial Attacks and damaging Spells gain Critical(3)<br>
      L15–16 → Martial Attacks and damaging Spells gain Critical(4)<br><br>
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
| **1** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | — | Mastery Rank Rounds | No effect at this PL; unavailable for selection. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(1)**: while maintained, designate up to **1** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(1)**: while maintained, designate up to **1** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(1)**: while maintained, designate up to **1** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(1)**: while maintained, designate up to **1** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(2)**: while maintained, designate up to **2** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(2)**: while maintained, designate up to **2** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(2)**: while maintained, designate up to **2** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(2)**: while maintained, designate up to **2** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(3)**: while maintained, designate up to **3** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(3)**: while maintained, designate up to **3** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(3)**: while maintained, designate up to **3** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(4)**: while maintained, designate up to **4** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **Critical(4)**: while maintained, designate up to **4** qualifying Martial Attack or damaging Spell Casting Pools this combat; natural 7s and 8s explode on those rolls. |
}}

\page

{{pageNumber,auto}}
{{wide

### Active Buff Special Rules

Active Buffs do not apply or increase Specials. **Intellect Stone Ability: Special Boost** remains available under its own Stone Ability rules; the **Universal Raise Effect: Special Increase** is a different rule.
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
      Spell Resistance increases your Final Spell TN against Spells affecting you.<br>
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
      This Cleanse does not trigger Absorption.<br>
      Self Cleanse has no secondary effect. Timed Blight may be reduced by Cleanse like other eligible negative Specials.<br><br>
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

**Damage Aura** is a maintained, self-centered Active Buff that follows its caster and deals its printed damage to valid targets **once at the end of each of the caster's turns**. Its radius and payload use the table below. Apply the pulse using the caster's position at that moment; movement or crossing an aura boundary alone creates no extra pulse. Each creature receives at most one pulse from the same Damage Aura per Round.

**Summon Damage Aura** and **Summon Armor Aura** use a different timing rule. They affect only the caster's own Summons within the printed radius: the damage bonus applies when a qualifying Summon deals damage, and the Armor bonus applies when a qualifying Summon defends against damage. These modifiers follow the individual Summon-Aura entries rather than the Damage Aura's end-of-turn pulse.

The aura effects here use their **printed single payloads**. Specials remain governed by their separately listed sources and rules.

### Active Buff Aura Timing

Resolve the **Damage Aura pulse** at the **end of each of your turns**. Measure the radius from the caster's position at that time and resolve eligible damage once per target.
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

### Active Buff Aura Scope

A **Damage Aura** has one printed effect: the damage pulse at your Turn End. Its coverage is determined by the purchased radius and active Buff duration. Passing a creature or crossing the radius creates no extra pulse. Each other mechanical effect, such as Armor, Evade, control, Critical, Penetration or movement, belongs to its own eligible Power or dedicated subsystem. The aura is a persistent battlefield presence, with its effect resolved at the printed trigger rather than per meter moved.
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
      It does not benefit from Active Buff: Damage or Active Buff: Critical.<br>
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


<h3 id="active-buff-summon-damage-aura">
  Active Buff: Summon Damage Aura
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active Buff<br>
      Targets = Summons owned by the caster and within the printed radius<br>
      Duration = Mastery Rank rounds<br>
      A character can maintain only one Active Buff at a time unless a rule explicitly says otherwise.<br><br>

DESIGN NOTE<br>
      This Buff is cheaper than a normal AoE Damage Buff because it affects only the caster's own Summons.<br>
      Apply the listed bonus to eligible owned Summons in range.<br><br>

RADIUS<br>
      The radius is intentionally large so a Summoner can command several Summon Bodies without excessive positioning tax.<br>
      A Summon must be within the radius when it deals damage to gain the bonus.
    </span>
  </span>
</h3>

The caster empowers the attacks of their own Summons.

The listed bonus applies to **Summons owned by the caster** while those Summons are within this Buff's radius.

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
      Targets = Summons owned by the caster and within the printed radius<br>
      Duration = Mastery Rank rounds<br>
      A character can maintain only one Active Buff at a time unless a rule explicitly says otherwise.<br><br>

 DESIGN NOTE<br>
      This Buff is cheaper than a normal AoE Armor Buff because it affects only the caster's own Summons.<br>
      Apply the listed Armor bonus to eligible owned Summons in range.<br><br>
  RADIUS<br>
      The radius is intentionally large so a Summoner can keep several Summon Bodies protected without excessive positioning tax.<br>
      A Summon must be within the radius to gain the Armor bonus.
    </span>
  </span>
</h3>

The caster strengthens the defenses of their own Summons.

The listed bonus applies to **Summons owned by the caster** while those Summons are within this Buff's radius.

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
      Invisibility is a premium defensive axis based on perception, sense obscuration, and target denial.<br><br>
      DESIGN STRUCTURE<br>
      Active Buff: Invisibility grants a temporary Invisibility Bonus equal to its Power Level.<br>
      Unlike Passive Invisibility, this Active Buff Obscures only Normal Combat Awareness.<br>
      It does not Obscure Special Combat Senses by itself.<br><br>
      RESTRICTIONS<br>
      Active Buff: Invisibility does not reduce damage.<br>
      Active Buff: Invisibility does not increase Evade.<br>
      Active Buff: Invisibility does not grant Armor, Damage Reduction, Phasing, Temporary HP, or Healing.<br>
      Active Buff: Invisibility does not grant Special Combat Sense Obscuration.<br><br>
      SUBSYSTEM EXCEPTION<br>
      Active Buff: Invisibility may stack with Passive Invisibility.<br>
      If both are active, add both Invisibility Bonuses together.<br>
      If Passive Invisibility Obscures selected Special Combat Senses, they remain Obscured while this Active Buff is active.<br>
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
      This Active Buff is intentionally narrow. It gives a high temporary Invisibility Bonus, but only against Normal Combat Awareness. Special Combat Senses not Obscured by Passive Invisibility or another explicit Invisibility rule remain unaffected and can locate the creature normally.
    </span>
  </span>
</h3>

You vanish behind shimmer, shadow, distortion, mist, bent light, or predatory camouflage. **Invisibility persists for this Active Buff's printed duration, even if you attack, cast, move, react, take damage, or are detected.** Those actions never end this Buff or automatically reveal you. Normal Combat Awareness remains Obscured after an attack. A direct attacker uses the free Perception Check and the normal Combat Sense rules in Core; success permits targeting only for that observer during the current Round, without making you visible. Normal Active Buff duration and replacement rules still apply.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+1 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **2** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+2 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **3** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+3 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **4** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+4 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **5** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+5 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **6** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+6 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **7** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+7 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **8** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+8 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **9** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+9 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **10** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+10 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **11** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+11 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **12** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+12 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **13** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+13 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **14** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+14 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **15** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+15 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **16** | Active Buff | Self | — | Mastery Rank Rounds | Gain **+16 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |

The Invisibility Bonus increases the Perception TN required to locate, target, or read you.

**Perception TN = (4 × Mastery Rank) + current Invisibility Bonus − (Lost Health Bars × Mastery Rank) + Stealth Points spent this Round**

Lost Health Bars reduce the Perception TN by Mastery Rank per lost Health Bar, as defined in the Core.

This Active Buff may stack with **Passive Invisibility**. If both are active, add both Invisibility Bonuses together.

This Active Buff does not Obscure Special Combat Senses by itself. Passive Invisibility may Obscure selected Special Combat Senses, as defined in the Core.
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
  Whenever you spend Parry against an eligible Martial Attack or Spell, regain spent Parry after that effect resolves.<br>
  The total amount of Parry regained through this Buff cannot exceed its listed maximum during each Round.<br>
  Regained Parry cannot increase your current Pool above the amount with which you entered Parry that Turn.<br><br>

  SCALING<br>
  Regain a total of up to 1 Parry per Power Level during each Round.<br>
  You cannot regain more Parry than you have spent during that Round.<br>
  The recovery limit resets at the beginning of each new Round.<br><br>

  EXAMPLE<br>
  You spend 5 Parry to remove 5 Attack Dice from a Martial Attack or 5 Casting Dice from a Spell while using Active Buff: Parry Recovery Level 4.<br>
  After the triggering effect resolves, regain up to 4 Parry.<br>
  The triggering effect therefore consumes only 1 Parry from your Pool.<br>
  You have reached this Buff's recovery limit and cannot regain further Parry until the beginning of the next Round.<br><br>

  NOTES<br>
  This Buff does not create Parry by itself.<br>
  It grants no Armor, Evade, Damage Reduction, Phasing, Temporary HP, Reaction, free Attack, or Riposte.<br>
  It uses the character's maintained Active Buff slot.
</span>


  </span>
</h3>

You settle into an enduring defensive rhythm, recovering your guard after every intercepted attack or spell.

---

**Requirement:** Parry Passive

While this Active Buff is maintained, whenever you spend Parry against an eligible Martial Attack or Spell, regain spent Parry after that effect resolves.

The total amount of Parry you may regain during each Round cannot exceed the value listed for this Power's Level.

You cannot regain more Parry than you have spent, and your current Parry Pool cannot exceed the amount with which you entered Parry that Turn.

The recovery limit resets at the beginning of each new Round.

| **Level** | **Type**           | **Range** | **AoE** |     **Duration**    | **Effect**                                      |
| :-------: | :----------------- | :-------: | :-----: | :-----------------: | :---------------------------------------------- |
|   **1**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **1 Parry per Round**.  |
|   **2**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **2 Parry per Round**.  |
|   **3**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **3 Parry per Round**.  |
|   **4**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **4 Parry per Round**.  |
|   **5**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **5 Parry per Round**. |
|   **6**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **6 Parry per Round**. |
|   **7**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **7 Parry per Round**. |
|   **8**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **8 Parry per Round**. |
|   **9**   | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **9 Parry per Round**. |
|   **10**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **10 Parry per Round**. |
|   **11**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **11 Parry per Round**. |
|   **12**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **12 Parry per Round**. |
|   **13**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **13 Parry per Round**. |
|   **14**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **14 Parry per Round**. |
|   **15**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **15 Parry per Round**. |
|   **16**  | Active Buff, Parry |    Self   |    —    | Mastery Rank Rounds | Regain a total of up to **16 Parry per Round**. |


}}


\page

{{pageNumber,auto}}
{{wide


## Absorption Subsystem

This subsystem Active Buff increases the number of Temporary Colorless Stones earned from an eligible Scarred Health Bar.

It does not prevent damage, grant additional HP, restore Health Bars, or make the character safer. Instead, it increases the yield of the Absorption Passive when eligible hostile damage Scars a Health Bar.

This Active Buff requires the **Absorption Passive**.

Without the Absorption Passive, it has no effect.

The additional Temporary Colorless Stones follow all normal Absorption rules:

* They are **earned** on the first valid Absorption trigger of that Round (among the Passive's four triggers per combat) and are received **Ready at the start of the next Preparation Phase**.
* They may pay for any eligible unlocked Stone Ability, as Stones of any Attribute.
* Unspent Stones remain available until combat ends.
* Spent Absorption Stones become **Exhausted** and remain until combat ends. Like all Colorless Stones, they cannot normally recover; **Influence Stone Ability: Colorless Recovery**, activated **once per combat**, may designate up to **2 / 4 / 8 / 16 Colorless Stones** of any source as eligible for normal Stone Recovery **until combat ends**. Its activation Stones are **Exhausted, not Sealed**.
* They provide no extra Stone Recovery and cannot be transferred, Sealed, Bound, Burned, or invested.

---

### Active Buff: Absorption Stone Increase

While this Active Buff is maintained, the **first valid Absorption trigger each Round** grants additional Temporary Colorless Stones according to this Power's Level. This is subject to the Passive's **four-trigger limit per combat**.

This bonus is applied only once per Round.

The bonus is triggered by a successful Absorption harvest, not by each individual Stone generated.

#### Example

A character with **Passive: Absorption Level 8** has **4 Stones per eligible Scarred Health Bar**. Hostile damage Scars one Health Bar, consuming one of the Passive's four triggers. If the character maintains **Active Buff: Absorption Stone Increase Level 4**, this first trigger of the Round adds **1 Stone**.

The character earns **5 Temporary Colorless Stones**, which become Ready in the next Preparation Phase. A second valid trigger in the same Round grants the Passive's Stones but no further bonus from this Active Buff. After four total Passive triggers in this combat, the Active Buff can no longer grant bonus Stones.

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
  On the first valid Passive: Absorption trigger each Round (a hostile-damage-Scarred Health Bar), gain additional Temporary Colorless Stones.<br>
  This bonus applies once per Round and only if the damage instance uses at least one of the Passive's four triggers for this combat.<br><br>

  MILESTONES<br>
  L1–4 = +1 Temporary Colorless Stone.<br>
  L5–8 = +2 Temporary Colorless Stones.<br>
  L9–12 = +3 Temporary Colorless Stones.<br>
  L13–16 = +4 Temporary Colorless Stones.<br><br>

  TEMPORARY STONES<br>
  Additional Stones follow all normal Absorption rules.<br>
  They are received Ready at the start of the next Preparation Phase.<br>
  Spent Stones become Exhausted and cannot recover without Influence: Colorless Recovery.<br>
  Ready or Exhausted Stones disappear when combat ends.<br><br>

  RESTRICTIONS<br>
  This Buff grants no Maximum HP, Healing, Temporary HP, Armor, Evade, Damage Reduction, Phasing, Parry, Attack Dice, Damage, free Attacks, or additional Reactions.<br>
  It does not prevent or reduce incoming damage.<br>
  It does not generate Stones unless the Absorption Passive generates at least one Stone normally.<br><br>

  NOTES<br>
  The character must lose an eligible Health Bar to hostile damage to benefit from this Power.<br>
  Unused PP is intentionally ignored because Absorption is a closed premium milestone subsystem.
</span>


  </span>
</h3>

You open yourself fully to violence, drawing a greater surge of unstable power from the first wounds suffered each Round.

---

**Requirement:** Absorption Passive

The first valid Absorption trigger of each Round grants the additional Stones listed below, **only if the damage instance uses at least one of the Passive's four triggers for this combat**.

This bonus can trigger only **once per Round**.

| **Level** | **Type**                | **Range** | **AoE** |     **Duration**    | **Effect**                                                                           |
| :-------: | :---------------------- | :-------: | :-----: | :-----------------: | :----------------------------------------------------------------------------------- |
|   **1**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+1 Temporary Colorless Stone**.  |
|   **2**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+1 Temporary Colorless Stone**.  |
|   **3**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+1 Temporary Colorless Stone**.  |
|   **4**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+1 Temporary Colorless Stone**.  |
|   **5**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+2 Temporary Colorless Stones**. |
|   **6**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+2 Temporary Colorless Stones**. |
|   **7**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+2 Temporary Colorless Stones**. |
|   **8**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+2 Temporary Colorless Stones**. |
|   **9**   | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+3 Temporary Colorless Stones**. |
|   **10**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+3 Temporary Colorless Stones**. |
|   **11**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+3 Temporary Colorless Stones**. |
|   **12**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+3 Temporary Colorless Stones**. |
|   **13**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+4 Temporary Colorless Stones**. |
|   **14**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+4 Temporary Colorless Stones**. |
|   **15**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+4 Temporary Colorless Stones**. |
|   **16**  | Active Buff, Absorption |    Self   |    —    | Mastery Rank Rounds | The first valid Absorption trigger each Round generates **+4 Temporary Colorless Stones**. |

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
  Requires Passive: Damage Negation to be slotted.<br>
  The Buff functions even when the Passive combat Reserve has been fully spent; it never refills that Reserve.<br><br>

  DESIGN STRUCTURE<br>
  Upon activation, gain one separate Temporary Damage Negation Pool immediately for the current Round.<br>
  During Preparation before each later Round in which this Buff remains maintained, refresh that Pool to its printed value.<br>
  Unused temporary points expire at Round End. The Buff never refills the Passive combat Reserve.<br><br>

  SCALING<br>
  Gain Temporary Damage Negation equal to half Power Level, rounded up (minimum 1), on activation and once per subsequent maintained Round.<br>
  Each point removes 1 Damage Die from an eligible Damage Pool before it is rolled.<br><br>

  SPENDING ORDER<br>
  Temporary Damage Negation is spent before the character's long-term Damage Negation Reserve.<br>
  Once the Temporary Damage Negation Pool is empty, the character may spend from the Passive's Reserve normally.<br><br>

  SPENDING LIMIT<br>
  Temporary Damage Negation and the long-term Reserve may together remove any number of Damage Dice, up to the entire incoming Pool and the combined available Damage Negation.<br>
  Spend Temporary Damage Negation first; only the available points and Pool size restrict spending.<br><br>

  EXAMPLE<br>
  You activate Active Buff: Damage Negation Pool Level 4 and immediately gain 2 Temporary Damage Negation for that Round.<br>
  An Attack hits you with a Damage Pool of 10d8, and at least 8 points remain in your long-term Passive Reserve.<br>
  You choose to remove all 10 Damage Dice: spend 2 Temporary Damage Negation, then 8 points from the long-term Reserve.<br>
  The remaining Damage Pool is 0d8; no Damage Dice are rolled.<br><br>

  NOTES<br>
  This Buff does not restore the long-term Damage Negation Reserve.<br>
  Temporary Damage Negation cannot be stored or carried into another Round.<br>
  This Buff grants no Armor, Evade, Parry, Damage Reduction, Phasing, Temporary HP, Healing, Absorption, Spell Resistance, Special Negation, Reaction, free Attack, or additional action economy.<br>
  It uses the character's maintained Active Buff slot.
</span>

  </span>
</h3>

You reinforce your defensive field, continuously stripping destructive force from incoming attacks without exhausting your deeper reserves.

---

**Requirement:** Damage Negation Passive

When you activate this Active Buff, immediately gain a separate **Temporary Damage Negation Pool** for the current Round. During Preparation before each subsequent Round in which the Buff is still maintained, refresh the pool to its printed value.

The Pool contains **half this Power's Level, rounded up (minimum 1)**, in Temporary Damage Negation. **A slotted Passive: Damage Negation is required, even if its remaining combat Reserve is 0.**

Each point of Temporary Damage Negation may remove **1 Damage Die** from an eligible Damage Pool before it is rolled.

Temporary Damage Negation is spent before your long-term Damage Negation Reserve.

Unspent Temporary Damage Negation expires at Round End. A new pool becomes available during the next Preparation Phase only while this Buff is still maintained. The pool also ends immediately if the Buff ends.

Temporary Damage Negation and your normal Damage Negation Reserve may together remove **any chosen number of the incoming Damage Dice, including all of them**, as long as sufficient Damage Negation is available. Spend Temporary Damage Negation first. Each removed Damage Die costs 1 point; the full incoming Pool is eligible to be removed.

| **Level** | **Type**                     | **Range** | **AoE** |     **Duration**    | **Temporary Damage Negation per Round** |
| :-------: | :--------------------------- | :-------: | :-----: | :-----------------: | :-------------------------------- |
|   **1**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **1 Damage Die per Round**        |
|   **2**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **1 Damage Die per Round**       |
|   **3**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **2 Damage Dice per Round**       |
|   **4**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **2 Damage Dice per Round**       |
|   **5**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **3 Damage Dice per Round**       |
|   **6**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **3 Damage Dice per Round**       |
|   **7**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **4 Damage Dice per Round**       |
|   **8**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **4 Damage Dice per Round**       |
|   **9**   | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **5 Damage Dice per Round**       |
|   **10**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **5 Damage Dice per Round**      |
|   **11**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **6 Damage Dice per Round**      |
|   **12**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **6 Damage Dice per Round**      |
|   **13**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **7 Damage Dice per Round**      |
|   **14**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **7 Damage Dice per Round**      |
|   **15**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **8 Damage Dice per Round**      |
|   **16**  | Active Buff, Damage Negation |    Self   |    —    | Mastery Rank Rounds | **8 Damage Dice per Round**      |

}}
