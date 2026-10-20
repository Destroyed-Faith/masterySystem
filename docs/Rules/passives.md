 {{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Passives
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
Destroyed Faith — DF Core Passives
Version: v0.9.9.5 (2026-10-15)
Playtest revision: 2026-10-20 (working draft; no release or version bump)
> **Unavailable lower Power Levels (v0.9.9.5):** A row explicitly marked `Unavailable` grants no effect and cannot be purchased, selected, activated, or received as a valid Artifact Power Level. The first level with an actual effect is the minimum selectable Power Level. No missing effect or new strength value is implied.

}}

}}
\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Passive Design Rules}}{{ 4}}](#p4)
- #### [{{ Passive Categories}}{{ 5}}](#p5)
- #### [{{ Passive Limits}}{{ 6}}](#p6)
- #### [{{ Passive Catalog}}{{ 8}}](#p8)
- #### [{{ Passive: Fortitude}}{{ 14}}](#p14)
- #### [{{ Passive: Special Aura}}{{ 18}}](#p18)
- #### [{{ Spell Resistance and Special Negation Passives}}{{ 19}}](#p19)
- #### [{{ Passive: Telepathy}}{{ 21}}](#p21)
- #### [{{ Passive: Summon Tokens}}{{ 22}}](#p22)
- #### [{{ Passive: Thorns}}{{ 23}}](#p23)
- #### [{{ Passive: Invisibility}}{{ 24}}](#p24)
- #### [{{ Passive: Initiative}}{{ 25}}](#p25)
- #### [{{ Parry Passives}}{{ 26}}](#p26)
- #### [{{ Absorption Passives}}{{ 29}}](#p29)
- #### [{{ Damage Negation Passives}}{{ 33}}](#p33)
- #### [{{ Offensive Passive Extensions}}{{ 39}}](#p39)
- #### [{{ Passive: Armor Reduction}}{{ 39}}](#p39)
- #### [{{ Passive: Critical}}{{ 40}}](#p40)
- #### [{{ Passive: Maximization}}{{ 41}}](#p41)

}}
\page
{{pageNumber,auto}}
{{wide

## Passive Design Rules

Passives represent reliable, always-available parts of a character’s combat identity.

They require no Action, Movement, Reaction, or activation roll. A Passive provides its stated effect while slotted; the Regeneration subtype is voluntarily triggered at a legal action boundary and spends its daily pool, rather than activating automatically; specific event-based subsystems (such as Absorption or Thorns) retain their exact triggering rules. There are no alternate Conditional Passive purchase variants.

Passives are selected before combat and cannot normally be changed during combat.

### Technical Power Names

Every catalogue entry uses its heading as its canonical technical Power name.

The technical Power name defines rules identity and data identity. Power Level changes the strength of that Power, not its identity.

A character-facing name is not part of this catalogue and never creates a second mechanical Power.

Combined Passive catalogue entries were already retired in v0.9.9.2 and remain retired in v0.9.9.5. Slashes remain reserved for alternatives from which one option must be chosen when learning the Power.

No Conditional Passive variants are selectable. Passive effects use the exact catalogue names below; Subsystem Passives may keep their own explicit event triggers.

Foundry VTT must store the technical Power name separately from Power Level, category or categories, condition, chosen option, and any character-facing label. Rules comparisons use the technical Power name and category data, not the character-facing label.

---
::
### Passive Curve

Passives use the following PP target curve:

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

---
::

}}

\page
{{pageNumber,auto}}
{{wide
### Passive Slot Progression

Characters gain Passive Slots according to their Mastery Rank.

| **Mastery Rank** | **Passive Slots** |
| :--------------: | :---------------: |
|     **MR 1**     |         1         |
|     **MR 2**     |         2         |
|     **MR 3**     |         3         |
|     **MR 4**     |         3         |
|     **MR 5**     |         4         |
|     **MR 6**     |         4         |
|     **MR 7**     |         5         |
|     **MR 8**     |         6         |

A character may slot only this many Passives.

All slotted Passives are active.

There is no separate “prepared but inactive” Passive state.

If a Passive is not slotted, it provides no benefit.

Passive choices cannot normally be changed during combat.

---


### Passive Categories

Every current Passive belongs to exactly one Passive Category. Combining two Passive Categories in a single Passive is not available in this release. Dedicated single-category subsystems such as Absorption retain their exact rules.

A character cannot benefit from two Passives that use the same category unless a rule explicitly allows it.

The current Passive Categories are:

| **Category**         | **Role**                                                   |
| :------------------- | :--------------------------------------------------------- |
| **Armor**            | Flat damage mitigation and physical protection             |
| **Damage Reduction** | Percentage-based mitigation applied after Armor            |
| **Evade**            | Avoidance and defensive positioning                        |
| **Damage**           | Reliable offensive output                                  |
| **Armor Reduction** | Ignores Armor on your own damaging Attacks only             |
| **Critical**         | Limited free Critical-designated Attack/Casting rolls per Combat |
| **Maximization**     | Limited free Maximization uses on Damage/Healing rolls per Combat |
| **Health**           | Additional Health Bars or structural durability            |
| **Temporary HP**     | Frontloaded protective HP                                  |
| **Regeneration**     | Limited self-only full Scarred Bar restoration per Tyhran Day |
| **Telepathy**        | Telepathic Access, communication, and voluntary Mind Links |
| **Phasing**          | Limited complete hit negation                              |
| **Special Aura**     | Increases one existing eligible Special(X) inside an aura  |
| **Spell Resistance** | Increases the Final Spell TN against the character |
| **Special Negation** | Reduces eligible incoming hostile numeric Specials |
| **Initiative**       | Initiative Score and Initiative Exchange interaction           |
| **Invisibility**     | Target denial, Perception TN, and Combat Sense obscuration    |
| **Parry**            | Martial Attack Pool or Spell Casting Pool interception      |
| **Absorption**       | Temporary Colorless Stones from newly Scarred Health Bars (maximum four triggers per combat)       |
| **Damage Negation**  | Removal of Damage Dice through a combat reserve            |
| **Summon**           | Support for existing Summon Bonds and their Summon Tokens |
| **Enemy Evade Reduction** | Reduces target Evade vs the owner's Martial Attack Rolls only |
| **Self Cleanse**     | Additional start-of-Turn Cleanse(X) after Natural Recovery |
| **Speed**            | Flat increase to the normal Speed statistic                |
| **Spell Resistance Piercing** | Ignores SR against Spells cast by the owner          |
| **Special Amplification** | Increases eligible Special(X) delivered by the owner's attacks |

### Passive Selection Groups (UI browsing only)

Selection groups organise catalogue browsing in character creation and Passive pickers. They are **not** mechanical Passive Categories and do **not** change slot exclusivity.

| **Selection Group** | **Passives** |
| :------------------ | :----------- |
| **Offensive** (8) | Damage, Armor Reduction, Critical, Maximization, Special Aura, Enemy Evade Reduction, Spell Resistance Piercing, Special Amplification |
| **Defensive** (15) | Armor, Evade, Damage Reduction, Health, Fortitude, Regeneration, Phasing, Spell Resistance, Special Negation, Invisibility, Parry, Thorns, Damage Negation, Temporary HP, Self Cleanse |
| **Utility & Mobility** (5) | Telepathy, Initiative, Summon Tokens, Absorption, Speed |

Each Power appears in exactly one selection group. Mechanical Category restrictions (for example Health vs Fortitude) remain unchanged.

The **Type** of every Passive remains:

> **Type:** Passive

If category tracking is used, write the category in a separate **Category** field or column.

}}

\page
{{pageNumber,auto}}
{{wide
### Single-Category Passives

Each Passive occupies one Passive Slot and belongs to one Passive Category. Two-axis Combined Passives, including their Conditional variants, are retired for this release. Existing dedicated subsystems, including Absorption, remain legal exactly as printed. Characters that previously used a removed Combined Passive must select a current catalogue entry instead.

---

### Passive Limits

Passives may not normally grant:

* permanent Attack Dice,
* permanent Attribute increases,
* generic Roll bonuses,
* free Attack Actions,
* free attacks,
* additional Reactions,
* Movement Powers,
* Active Buffs,
* Spell effects,
* Extra Attacks,
* Special Application,
* hard control,
* or hidden action-economy benefits.

Passives may not apply Specials.

The only standard Passive interaction with Specials is **Special Aura**, which may increase one chosen existing eligible **Special(X)** by **+1 step** while an already affected creature remains inside the aura.

Passives may not normally generate Stones.

**Absorption is the explicit exception:** the dedicated Absorption subsystem may generate short-lived **Temporary Colorless Stones** from eligible actual HP loss.

**Passive: Summon Tokens** is the explicit Summon exception: it may grant bonus Summon Tokens to Summon Bonds that already exist. It does not create a Summon Bond, add Summon Bodies, or grant Extra Attacks.

The dedicated **Passive: Critical** and **Passive: Maximization** are explicit, limited Combat-roll exceptions: they supply a fixed allowance of uses, not extra Attack Actions, extra rolls, free Stone Ability ranks, or unlimited roll modifiers. Their allowed timing and consumption follow their own entries.

A Passive may never use the **Spell** or **Charged** tag.

}}

\page
{{pageNumber,auto}}
{{wide
### Dedicated Passive Subsystems

Some Passive Categories use dedicated rules rather than normal linear Passive construction.

These include:

* Damage Reduction
* Phasing
* Spell Resistance
* Special Negation
* Initiative
* Invisibility
* Parry
* Absorption
* Damage Negation
* Critical
* Maximization
* Summon

These systems may only be created, increased, restored, or modified through their dedicated entries and explicitly named subsystem extensions.

They may not appear as casual secondary riders on unrelated Passives.

A dedicated subsystem Passive may coexist with other legal Passives. However, the dedicated Passive itself may not bundle an unrelated second category unless its entry explicitly says otherwise.

Unused PP may remain unused in milestone-based or closed subsystem progressions.

---
::
### Combat Senses Are Not Passives

Combat Senses use the **Sense Slot** rules from the Core Rulebook.

A Sense Option does not use a Passive Slot and may not be recreated as an Awareness Passive or hidden inside another Passive.

Every character has one Sense Slot. Additional Sense Options increase the choices available before a scene or combat; they do not create additional Sense Slots and do not allow several Special Combat Senses to operate at the same time.

}}

\page
{{pageNumber,auto}}

{{wide

## Passive Catalog

<h3 id="passive-armor">
  Passive: Armor
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Unconditional Armor = 15 PP per +1 Armor<br><br>
      CALCULATION<br>
      L1 → +1 Armor = 15 PP ≈ 20 target<br>
      L2 → +3 Armor = 45 PP ≈ 40 target<br>
      L3 → +4 Armor = 60 PP = 60 target<br>
      L4 → +5 Armor = 75 PP ≈ 80 target<br>
      L5 → +7 Armor = 105 PP ≈ 100 target<br>
      L6 → +8 Armor = 120 PP = 120 target<br>
      L7 → +9 Armor = 135 PP ≈ 140 target<br>
      L8 → +11 Armor = 165 PP ≈ 160 target<br>
      L9 → +12 Armor = 180 PP = 180 target<br>
      L10 → +13 Armor = 195 PP ≈ 200 target<br>
      L11 → +15 Armor = 225 PP ≈ 220 target<br>
      L12 → +16 Armor = 240 PP = 240 target<br>
      L13 → +17 Armor = 255 PP ≈ 260 target<br>
      L14 → +19 Armor = 285 PP ≈ 280 target<br>
      L15 → +20 Armor = 300 PP = 300 target<br>
      L16 → +21 Armor = 315 PP ≈ 320 target<br><br>
      NOTES — Pure unconditional Armor passive. Because it is always active, Armor uses the doubled unconditional price. No Evade, no Damage Reduction, no Temporary HP, no Healing, no Phasing.
    </span>
  </span>
</h3>

Your body learns to carry steel as if it were a second skin.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Armor | Self | — | Permanent | Gain **+1 Armor**. |
| **2** | Passive, Armor | Self | — | Permanent | Gain **+3 Armor**. |
| **3** | Passive, Armor | Self | — | Permanent | Gain **+4 Armor**. |
| **4** | Passive, Armor | Self | — | Permanent | Gain **+5 Armor**. |
| **5** | Passive, Armor | Self | — | Permanent | Gain **+7 Armor**. |
| **6** | Passive, Armor | Self | — | Permanent | Gain **+8 Armor**. |
| **7** | Passive, Armor | Self | — | Permanent | Gain **+9 Armor**. |
| **8** | Passive, Armor | Self | — | Permanent | Gain **+11 Armor**. |
| **9** | Passive, Armor | Self | — | Permanent | Gain **+12 Armor**. |
| **10** | Passive, Armor | Self | — | Permanent | Gain **+13 Armor**. |
| **11** | Passive, Armor | Self | — | Permanent | Gain **+15 Armor**. |
| **12** | Passive, Armor | Self | — | Permanent | Gain **+16 Armor**. |
| **13** | Passive, Armor | Self | — | Permanent | Gain **+17 Armor**. |
| **14** | Passive, Armor | Self | — | Permanent | Gain **+19 Armor**. |
| **15** | Passive, Armor | Self | — | Permanent | Gain **+20 Armor**. |
| **16** | Passive, Armor | Self | — | Permanent | Gain **+21 Armor**. |

---

<h3 id="passive-damage-reduction">
  Passive: Damage Reduction
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive DR milestones<br>
      10% DR = 60 PP<br>
      20% DR = 160 PP<br>
      30% DR = 300 PP<br><br>
      CALCULATION<br>
      L1 → no effect = 0 PP<br>
      L2 → no effect = 0 PP<br>
      L3 → 10% DR = 60 PP<br>
      L4 → 10% DR = 60 PP<br>
      L5 → 10% DR = 60 PP<br>
      L6 → 10% DR = 60 PP<br>
      L7 → 10% DR = 60 PP<br>
      L8 → 20% DR = 160 PP<br>
      L9 → 20% DR = 160 PP<br>
      L10 → 20% DR = 160 PP<br>
      L11 → 20% DR = 160 PP<br>
      L12 → 20% DR = 160 PP<br>
      L13 → 20% DR = 160 PP<br>
      L14 → 20% DR = 160 PP<br>
      L15 → 30% DR = 300 PP<br>
      L16 → 30% DR = 300 PP<br><br>
      NOTES — This is the mandatory and exclusive Damage Reduction passive. No alternative DR passive should exist. No side-bonuses are added at any stage. Leftover budget is intentionally ignored.
    </span>
  </span>
</h3>

This is the only accepted Damage Reduction passive. If a build wants Damage Reduction, it must take this asset.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **3** | Passive, Damage Reduction | Self | — | Permanent | Gain **10% DR**. |
| **4** | Passive, Damage Reduction | Self | — | Permanent | Gain **10% DR**. |
| **5** | Passive, Damage Reduction | Self | — | Permanent | Gain **10% DR**. |
| **6** | Passive, Damage Reduction | Self | — | Permanent | Gain **10% DR**. |
| **7** | Passive, Damage Reduction | Self | — | Permanent | Gain **10% DR**. |
| **8** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **9** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **10** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **11** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **12** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **13** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **14** | Passive, Damage Reduction | Self | — | Permanent | Gain **20% DR**. |
| **15** | Passive, Damage Reduction | Self | — | Permanent | Gain **30% DR**. |
| **16** | Passive, Damage Reduction | Self | — | Permanent | Gain **30% DR**. |

}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="passive-evade">
  Passive: Evade
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Unconditional Evade = 20 PP per +1 Evade<br><br>
      CALCULATION<br>
      L1 → +1 Evade = 20 PP<br>
      L2 → +2 Evade = 40 PP<br>
      L3 → +3 Evade = 60 PP<br>
      L4 → +4 Evade = 80 PP<br>
      L5 → +5 Evade = 100 PP<br>
      L6 → +6 Evade = 120 PP<br>
      L7 → +7 Evade = 140 PP<br>
      L8 → +8 Evade = 160 PP<br>
      L9 → +9 Evade = 180 PP<br>
      L10 → +10 Evade = 200 PP<br>
      L11 → +11 Evade = 220 PP<br>
      L12 → +12 Evade = 240 PP<br>
      L13 → +13 Evade = 260 PP<br>
      L14 → +14 Evade = 280 PP<br>
      L15 → +15 Evade = 300 PP<br>
      L16 → +16 Evade = 320 PP<br><br>
      NOTES — Pure unconditional Evade passive. Evade uses the fixed premium unconditional price. No Armor, no Damage Reduction, no Temporary HP, no Healing, no Phasing.
    </span>
  </span>
</h3>

You are not faster in one moment. You are harder to catch in every moment.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Evade | Self | — | Permanent | Gain **+1 Evade**. |
| **2** | Passive, Evade | Self | — | Permanent | Gain **+2 Evade**. |
| **3** | Passive, Evade | Self | — | Permanent | Gain **+3 Evade**. |
| **4** | Passive, Evade | Self | — | Permanent | Gain **+4 Evade**. |
| **5** | Passive, Evade | Self | — | Permanent | Gain **+5 Evade**. |
| **6** | Passive, Evade | Self | — | Permanent | Gain **+6 Evade**. |
| **7** | Passive, Evade | Self | — | Permanent | Gain **+7 Evade**. |
| **8** | Passive, Evade | Self | — | Permanent | Gain **+8 Evade**. |
| **9** | Passive, Evade | Self | — | Permanent | Gain **+9 Evade**. |
| **10** | Passive, Evade | Self | — | Permanent | Gain **+10 Evade**. |
| **11** | Passive, Evade | Self | — | Permanent | Gain **+11 Evade**. |
| **12** | Passive, Evade | Self | — | Permanent | Gain **+12 Evade**. |
| **13** | Passive, Evade | Self | — | Permanent | Gain **+13 Evade**. |
| **14** | Passive, Evade | Self | — | Permanent | Gain **+14 Evade**. |
| **15** | Passive, Evade | Self | — | Permanent | Gain **+15 Evade**. |
| **16** | Passive, Evade | Self | — | Permanent | Gain **+16 Evade**. |


}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="passive-regeneration">
  Passive: Regeneration
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Self-only Scarred-Bar Regeneration, consciously activated from a finite daily pool.<br>
      Passive budget = 20 PP × PL.<br>
      Full Scarred Bar restoration cost = 40 PP per Bar.<br>
      Bars per Tyhran Day = floor(PL / 2).<br>
      PL 1 is not selectable: its 20 PP cannot purchase one full Bar.<br>
      Choose an eligible action boundary while capable of acting; restore Self at 1 daily point per Scarred Bar.<br>
      Activation uses the prepared Passive directly (no Attack Action, Reaction or Casting Roll).<br>
      Day = four Watches / 40 Tyhran Hours; reset once at the next in-game day boundary.<br>
      Apply recovery prospectively, after earlier completed damage has resolved.<br><br>
      LEVEL-BY-LEVEL PRICE AUDIT<br>
      L1: 0 Bars × 40 PP = 0 / 20 PP; 20 PP unused; NOT SELECTABLE.<br>
      L2: 1 Bars × 40 PP = 40 / 40 PP; 0 PP unused.<br>
      L3: 1 Bars × 40 PP = 40 / 60 PP; 20 PP unused.<br>
      L4: 2 Bars × 40 PP = 80 / 80 PP; 0 PP unused.<br>
      L5: 2 Bars × 40 PP = 80 / 100 PP; 20 PP unused.<br>
      L6: 3 Bars × 40 PP = 120 / 120 PP; 0 PP unused.<br>
      L7: 3 Bars × 40 PP = 120 / 140 PP; 20 PP unused.<br>
      L8: 4 Bars × 40 PP = 160 / 160 PP; 0 PP unused.<br>
      L9: 4 Bars × 40 PP = 160 / 180 PP; 20 PP unused.<br>
      L10: 5 Bars × 40 PP = 200 / 200 PP; 0 PP unused.<br>
      L11: 5 Bars × 40 PP = 200 / 220 PP; 20 PP unused.<br>
      L12: 6 Bars × 40 PP = 240 / 240 PP; 0 PP unused.<br>
      L13: 6 Bars × 40 PP = 240 / 260 PP; 20 PP unused.<br>
      L14: 7 Bars × 40 PP = 280 / 280 PP; 0 PP unused.<br>
      L15: 7 Bars × 40 PP = 280 / 300 PP; 20 PP unused.<br>
      L16: 8 Bars × 40 PP = 320 / 320 PP; 0 PP unused.<br>
    </span>
  </span>
</h3>

**Regeneration** gives the character a pool of **Self-only Scarred-Bar recoveries**. Spend **1 point to restore 1 of your own Scarred Bars at full current HP**. Activate at a legal action boundary during or outside combat while capable of acting. The Passive requires **no Casting Roll, Attack Action or Reaction** and resolves after any earlier completed damage instance.

**Daily pool:** Spend the allowance in one activation or across several. The pool resets **once per Tyhran Day (4 Watches / 40 Tyhran Hours)** and tracks points already spent through combat, rest and equipment changes. A higher PL increases the pool's maximum while preserving points spent during the current day. **PL 2** is the first available Rank. An Incapacitated character receives recovery from an eligible external source.

| **PL** | **Type** | **Target** | **Duration** | **Bars per Tyhran Day** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Regeneration | Self | Until spent; daily reset | **—** | Not available: no full Bar can be purchased. |
| **2** | Passive, Regeneration | Self | Until spent; daily reset | **1** | Restore up to **1 of your own Scarred Bars** to full HP (1 point per Bar). |
| **3** | Passive, Regeneration | Self | Until spent; daily reset | **1** | Restore up to **1 of your own Scarred Bars** to full HP (1 point per Bar). |
| **4** | Passive, Regeneration | Self | Until spent; daily reset | **2** | Restore up to **2 of your own Scarred Bars** to full HP (1 point per Bar). |
| **5** | Passive, Regeneration | Self | Until spent; daily reset | **2** | Restore up to **2 of your own Scarred Bars** to full HP (1 point per Bar). |
| **6** | Passive, Regeneration | Self | Until spent; daily reset | **3** | Restore up to **3 of your own Scarred Bars** to full HP (1 point per Bar). |
| **7** | Passive, Regeneration | Self | Until spent; daily reset | **3** | Restore up to **3 of your own Scarred Bars** to full HP (1 point per Bar). |
| **8** | Passive, Regeneration | Self | Until spent; daily reset | **4** | Restore up to **4 of your own Scarred Bars** to full HP (1 point per Bar). |
| **9** | Passive, Regeneration | Self | Until spent; daily reset | **4** | Restore up to **4 of your own Scarred Bars** to full HP (1 point per Bar). |
| **10** | Passive, Regeneration | Self | Until spent; daily reset | **5** | Restore up to **5 of your own Scarred Bars** to full HP (1 point per Bar). |
| **11** | Passive, Regeneration | Self | Until spent; daily reset | **5** | Restore up to **5 of your own Scarred Bars** to full HP (1 point per Bar). |
| **12** | Passive, Regeneration | Self | Until spent; daily reset | **6** | Restore up to **6 of your own Scarred Bars** to full HP (1 point per Bar). |
| **13** | Passive, Regeneration | Self | Until spent; daily reset | **6** | Restore up to **6 of your own Scarred Bars** to full HP (1 point per Bar). |
| **14** | Passive, Regeneration | Self | Until spent; daily reset | **7** | Restore up to **7 of your own Scarred Bars** to full HP (1 point per Bar). |
| **15** | Passive, Regeneration | Self | Until spent; daily reset | **7** | Restore up to **7 of your own Scarred Bars** to full HP (1 point per Bar). |
| **16** | Passive, Regeneration | Self | Until spent; daily reset | **8** | Restore up to **8 of your own Scarred Bars** to full HP (1 point per Bar). |

---
}}
\page

{{pageNumber,auto}}
{{wide

<h3 id="passive-phasing">
  Passive: Phasing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Phasing is a premium defensive subsystem and follows hard milestone pricing.<br><br>
      PHASING MILESTONES<br>
      Ignore 1 Hit = 80 PP<br>
      Ignore 2 Hits = 160 PP<br>
      Ignore 3 Hits = 300 PP<br><br>
      CALCULATION<br>
      L1 → no effect = 0 PP<br>
      L2 → no effect = 0 PP<br>
      L3 → no effect = 0 PP<br>
      L4 → Ignore 1 Hit = 80 PP<br>
      L5 → Ignore 1 Hit = 80 PP<br>
      L6 → Ignore 1 Hit = 80 PP<br>
      L7 → Ignore 1 Hit = 80 PP<br>
      L8 → Ignore 2 Hits = 160 PP<br>
      L9 → Ignore 2 Hits = 160 PP<br>
      L10 → Ignore 2 Hits = 160 PP<br>
      L11 → Ignore 2 Hits = 160 PP<br>
      L12 → Ignore 2 Hits = 160 PP<br>
      L13 → Ignore 2 Hits = 160 PP<br>
      L14 → Ignore 2 Hits = 160 PP<br>
      L15 → Ignore 3 Hits = 300 PP<br>
      L16 → Ignore 3 Hits = 300 PP<br><br>
      NOTES — Pure Phasing passive. At the start of combat, gain the listed number of Phasing charges. Each charge lets you ignore one hit against you. No Armor, no Evade, no Healing, no Temporary HP, no Damage Reduction.
    </span>
  </span>
</h3>

Your body no longer fully agrees to be where the world says it is.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **4** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **1 Phasing charge**. Each charge lets you ignore one hit against you. |
| **5** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **1 Phasing charge**. Each charge lets you ignore one hit against you. |
| **6** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **1 Phasing charge**. Each charge lets you ignore one hit against you. |
| **7** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **1 Phasing charge**. Each charge lets you ignore one hit against you. |
| **8** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **9** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **10** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **11** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **12** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **13** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **14** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **2 Phasing charges**. Each charge lets you ignore one hit against you. |
| **15** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **3 Phasing charges**. Each charge lets you ignore one hit against you. |
| **16** | Passive, Phasing | Self | — | Permanent | At the start of combat, gain **3 Phasing charges**. Each charge lets you ignore one hit against you. |

}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="passive-damage">
  Passive: Damage
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Unconditional Passive Damage = 40 PP per +1d8 Damage<br><br>
      CALCULATION<br>
      L1 → no effect = 0 PP<br>
      L2 → +1d8 Damage = 40 PP = 40 target<br>
      L3 → +1d8 Damage = 40 PP below 60 target<br>
      L4 → +2d8 Damage = 80 PP = 80 target<br>
      L5 → +2d8 Damage = 80 PP below 100 target<br>
      L6 → +3d8 Damage = 120 PP = 120 target<br>
      L7 → +3d8 Damage = 120 PP below 140 target<br>
      L8 → +4d8 Damage = 160 PP = 160 target<br>
      L9 → +4d8 Damage = 160 PP below 180 target<br>
      L10 → +5d8 Damage = 200 PP = 200 target<br>
      L11 → +5d8 Damage = 200 PP below 220 target<br>
      L12 → +6d8 Damage = 240 PP = 240 target<br>
      L13 → +6d8 Damage = 240 PP below 260 target<br>
      L14 → +7d8 Damage = 280 PP = 280 target<br>
      L15 → +7d8 Damage = 280 PP below 300 target<br>
      L16 → +8d8 Damage = 320 PP = 320 target<br><br>
      NOTES — Pure unconditional Damage passive. Because it applies broadly to all damage rolls you make, it uses the doubled unconditional price. No Attack Dice, no crit rider, no Special rider, no once-per-turn limitation.
    </span>
  </span>
</h3>

Your blows carry more weight because your intent no longer wavers.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Passive, Damage | Self | — | Permanent | Gain **+1d8 Damage** on all damage rolls you make. |
| **3** | Passive, Damage | Self | — | Permanent | Gain **+1d8 Damage** on all damage rolls you make. |
| **4** | Passive, Damage | Self | — | Permanent | Gain **+2d8 Damage** on all damage rolls you make. |
| **5** | Passive, Damage | Self | — | Permanent | Gain **+2d8 Damage** on all damage rolls you make. |
| **6** | Passive, Damage | Self | — | Permanent | Gain **+3d8 Damage** on all damage rolls you make. |
| **7** | Passive, Damage | Self | — | Permanent | Gain **+3d8 Damage** on all damage rolls you make. |
| **8** | Passive, Damage | Self | — | Permanent | Gain **+4d8 Damage** on all damage rolls you make. |
| **9** | Passive, Damage | Self | — | Permanent | Gain **+4d8 Damage** on all damage rolls you make. |
| **10** | Passive, Damage | Self | — | Permanent | Gain **+5d8 Damage** on all damage rolls you make. |
| **11** | Passive, Damage | Self | — | Permanent | Gain **+5d8 Damage** on all damage rolls you make. |
| **12** | Passive, Damage | Self | — | Permanent | Gain **+6d8 Damage** on all damage rolls you make. |
| **13** | Passive, Damage | Self | — | Permanent | Gain **+6d8 Damage** on all damage rolls you make. |
| **14** | Passive, Damage | Self | — | Permanent | Gain **+7d8 Damage** on all damage rolls you make. |
| **15** | Passive, Damage | Self | — | Permanent | Gain **+7d8 Damage** on all damage rolls you make. |
| **16** | Passive, Damage | Self | — | Permanent | Gain **+8d8 Damage** on all damage rolls you make. |

}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="passive-health">
  Passive: Health
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Health Bars are a structural defensive resource and scale as milestone value.<br><br>
      HEALTH BAR VALUES<br>
      +1 Wounded Health Bar = 25 PP<br>
      +1 Injured Health Bar = 40 PP<br>
      +1 Bruised Health Bar = 55 PP<br>
      +1 Healthy Health Bar = 70 PP<br><br>
      HEALTH BAR ORDER<br>
      Extra Health Bars are gained from the bottom upward:<br>
      1) Wounded<br>
      2) Injured<br>
      3) Bruised<br>
      4) Healthy<br><br>
      PROGRESSION<br>
      L1-L3 → +1 Wounded Health Bar<br>
      L4-L7 → +1 Wounded Health Bar, +1 Injured Health Bar<br>
      L8-L11 → +1 Wounded Health Bar, +1 Injured Health Bar, +1 Bruised Health Bar<br>
      L12-L16 → +1 Wounded Health Bar, +1 Injured Health Bar, +1 Bruised Health Bar, +1 Healthy Health Bar<br><br>
      NOTES — Structural Health passive. You keep all previously gained Health Bars. This passive does not grant Temporary HP, Healing, Armor, Damage Reduction, Evade, or Phasing. It never restores Health Bars; it only increases your maximum Health Bar structure.
    </span>
  </span>
</h3>

Your body does not merely endure more punishment. It learns to fail more slowly.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**. |
| **2** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**. |
| **3** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**. |
| **4** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar** and **+1 Injured Health Bar**. |
| **5** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar** and **+1 Injured Health Bar**. |
| **6** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar** and **+1 Injured Health Bar**. |
| **7** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar** and **+1 Injured Health Bar**. |
| **8** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, and **+1 Bruised Health Bar**. |
| **9** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, and **+1 Bruised Health Bar**. |
| **10** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, and **+1 Bruised Health Bar**. |
| **11** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, and **+1 Bruised Health Bar**. |
| **12** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, **+1 Bruised Health Bar**, and **+1 Healthy Health Bar**. |
| **13** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, **+1 Bruised Health Bar**, and **+1 Healthy Health Bar**. |
| **14** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, **+1 Bruised Health Bar**, and **+1 Healthy Health Bar**. |
| **15** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, **+1 Bruised Health Bar**, and **+1 Healthy Health Bar**. |
| **16** | Passive, Health | Self | — | Permanent | Gain **+1 Wounded Health Bar**, **+1 Injured Health Bar**, **+1 Bruised Health Bar**, and **+1 Healthy Health Bar**. |

}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-fortitude">
  Passive: Fortitude
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive target = 20 PP per Power Level.<br>
      Fortitude is a dedicated Health-category milestone Passive.<br>
      Each +1 to the Health Bar Vitality multiplier costs 80 PP.<br><br>

      PROGRESSION<br>
      Levels 1–3: No effect (0 PP invested).<br>
      Levels 4–7: Vitality × 5 (80 PP).<br>
      Levels 8–11: Vitality × 6 (160 PP).<br>
      Levels 12–15: Vitality × 7 (240 PP).<br>
      Level 16: Vitality × 8 (320 PP).<br><br>

      IDENTITY AND RESTRICTIONS<br>
      Applies to the maximum size of each normal Health Bar while slotted; does not add Health Bars.<br>
      Does not Heal damage or restore Scarred Health Bars.<br>
      This is a Health-category Passive, so it cannot be slotted with Passive: Health.<br>
      Passive: Absorption is a separate category and no longer grants extra HP.<br>
      This Passive does not grant Stones, Armor, Evade, Damage Reduction, Damage Dice, or a new creature size.
    </span>
  </span>
</h3>

You endure more before a wound becomes a scar. Fortitude makes your existing Health Bars larger; it does not create additional bars or change your body's size.

**Health per normal Bar = Vitality × Fortitude Multiplier** while this Passive is slotted. Without Fortitude, the multiplier remains ×4.

| **Level** | **Type** | **Range** | **Duration** | **HP Multiplier** | **Invested PP** |
|:--:|:--|:--:|:--:|:--:|--:|
| **1** | Unavailable | Self | Permanent | **×4** (no effect) | 0 (unavailable) |
| **2** | Unavailable | Self | Permanent | **×4** (no effect) | 0 (unavailable) |
| **3** | Unavailable | Self | Permanent | **×4** (no effect) | 0 (unavailable) |
| **4** | Passive, Health | Self | Permanent | **×5** | 80 |
| **5** | Passive, Health | Self | Permanent | **×5** | 80 |
| **6** | Passive, Health | Self | Permanent | **×5** | 80 |
| **7** | Passive, Health | Self | Permanent | **×5** | 80 |
| **8** | Passive, Health | Self | Permanent | **×6** | 160 |
| **9** | Passive, Health | Self | Permanent | **×6** | 160 |
| **10** | Passive, Health | Self | Permanent | **×6** | 160 |
| **11** | Passive, Health | Self | Permanent | **×6** | 160 |
| **12** | Passive, Health | Self | Permanent | **×7** | 240 |
| **13** | Passive, Health | Self | Permanent | **×7** | 240 |
| **14** | Passive, Health | Self | Permanent | **×7** | 240 |
| **15** | Passive, Health | Self | Permanent | **×7** | 240 |
| **16** | Passive, Health | Self | Permanent | **×8** | 320 |

Fortitude is an alternative to **Passive: Health** (additional Health Bars), not a second simultaneous Health-category Passive. It increases maximum capacity only: it does not refill previously lost HP or reopen Scarred Health Bars. It provides no Armor, Damage, or other bonus.

---
}}

\page
{{pageNumber,auto}}

{{wide
## Passive Special Aura

**Special Aura** is the only allowed Passive form that may interact with Specials.

A Passive Special Aura is a self-centered aura that increases one chosen eligible **Special(X)** by **+1 step** while an already affected creature remains inside the aura.

It never applies the Special by itself.

It never refreshes, extends, spreads, triggers, or maintains the Special.

If the creature leaves the aura, the increase immediately ends.

Multiple Special Auras affecting the same Special do not stack. Only the strongest applicable aura applies.

#### Example: Special Aura (Weaken)

A creature inside the aura is affected by **Weaken(2)**. The Passive Special Aura increases it to **Weaken(3)** while that creature remains inside the aura. When it leaves, the Special returns to its normal current value. The aura never applies Weaken to an unaffected creature.

#### Example: Special Aura (Soulburn)

A creature inside the aura is affected by **Soulburn(3)**. The aura treats it as **Soulburn(4)** while the creature remains inside. The +1 increase ends immediately when the creature leaves the aura.

## Special Aura Category Rule

A Passive Special Aura uses the following category:

> **Category:** Special Aura

or in table format:

> **Type:** Passive  
> **Category:** Special Aura

Special Aura is a real Passive category.

It is not a generic Special category and does not allow other Passive Special designs.

## Eligible Specials for Passive Special Aura

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


}}

\page
{{pageNumber,auto}}
{{wide
Common eligible examples include:

- **Challenge(X)**
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


}}

\page
{{pageNumber,auto}}

{{wide
Common ineligible examples include:

- **Stunned**
- **Immovable**
- **Prone**
- any Special without **(X)**
- any binary Special
- any hard-control effect
- any forced-behavior effect
- any full-turn or full-reaction denial effect

## Special Aura Restrictions

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

## Special Aura Cost Rule

A Passive Special Aura always grants exactly **+1 step** to one chosen eligible **Special(X)**.

It never scales the Special bonus beyond +1.

Scaling is handled through aura radius only.

Passive Special Aura Core = **80 PP**.

Final cost:

> **Final Cost = 80 PP + Radius Cost**

Use the normal radius-cost table for the aura.

The aura is always centered on the user.

}}

\page
{{pageNumber,auto}}

{{wide
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

The technical Power name is **Passive: Special Aura**. Record the selected eligible Special separately as its fixed **Special choice**. Learning or obtaining a second source cannot grant another Special Aura slot or a second independently selectable Special; the single-category rule applies normally.

While a creature inside your aura is already affected by that Special, increase its **effective value by +1**. The target's stored Special stacks remain unchanged; the aura contributes to the current effect (including an applicable Tick) while the target is in range, but creates no application points and does not use the Special Application Limit. Natural Special Recovery, Cleanse and Decay modify the stored stacks, and the effective +1 disappears when the aura no longer applies.

This aura does not apply the Special by itself.

This aura does not refresh, extend, spread, trigger, or maintain the Special.

If the creature leaves the aura, the increase immediately ends.

Multiple Special Auras affecting the same Special do not stack. Only the strongest applicable aura applies.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **4** | Passive | Self | 2 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **5** | Passive | Self | 3 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **6** | Passive | Self | 4 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **7** | Passive | Self | 5 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **8** | Passive | Self | 5 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **9** | Passive | Self | 5 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **10** | Passive | Self | 6 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **11** | Passive | Self | 6 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **12** | Passive | Self | 6 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **13** | Passive | Self | 7 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **14** | Passive | Self | 7 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **15** | Passive | Self | 7 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |
| **16** | Passive | Self | 8 m radius | Permanent | The **Special(X)** chosen when you learned this Power gains **+1 step** while affecting a creature inside the aura. |

}}


\page
{{pageNumber,auto}}
{{wide

## Spell Resistance and Special Negation Passives

Spell Resistance and Special Negation are separate Passive categories. They may be slotted at the same time, subject to the normal Passive Slot limit. Spell Resistance protects against Spell delivery, while Special Negation reduces incoming eligible numeric Specials.

These defensive Passives are not Spells.  
They do not apply Specials.  
They do not grant Absorption.  
They do not grant Armor, Evade, Damage Reduction, Phasing, Temporary HP, Healing, Attack Dice, Damage, Penetration, Critical, Movement, or control unless a specific entry says otherwise.

---

<h3 id="passive-spell-resistance">
  Passive: Spell Resistance
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16.<br>
      Spell Resistance = 15 PP per +1 Spell Resistance.<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Spell Resistance Passive with exactly one axis: Spell Resistance.<br>
      Spell Resistance increases the Final Spell TN against you; the Spell Base TN is unchanged.<br>
      It applies only against Powers with the Spell tag.<br>
      It does not protect against normal attacks, martial Actives, weapon attacks, non-Spell Specials, environmental damage, or non-Spell effects.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → +1 Spell Resistance = 15 PP, below target.<br>
      L2 target 40 PP → +2 Spell Resistance = 30 PP, below target.<br>
      L3 target 60 PP → +4 Spell Resistance = 60 PP, exactly on target.<br>
      L4 target 80 PP → +5 Spell Resistance = 75 PP, below target.<br>
      L5 target 100 PP → +6 Spell Resistance = 90 PP, below target.<br>
      L6 target 120 PP → +8 Spell Resistance = 120 PP, exactly on target.<br>
      L7 target 140 PP → +9 Spell Resistance = 135 PP, below target.<br>
      L8 target 160 PP → +10 Spell Resistance = 150 PP, below target.<br>
      L9 target 180 PP → +12 Spell Resistance = 180 PP, exactly on target.<br>
      L10 target 200 PP → +13 Spell Resistance = 195 PP, below target.<br>
      L11 target 220 PP → +14 Spell Resistance = 210 PP, below target.<br>
      L12 target 240 PP → +16 Spell Resistance = 240 PP, exactly on target.<br>
      L13 target 260 PP → +17 Spell Resistance = 255 PP, below target.<br>
      L14 target 280 PP → +18 Spell Resistance = 270 PP, below target.<br>
      L15 target 300 PP → +20 Spell Resistance = 300 PP, exactly on target.<br>
      L16 target 320 PP → +21 Spell Resistance = 315 PP, below target.<br><br>
      NOTES<br>
      Values are rounded down to whole Spell Resistance values.<br>
      Leftover PP is intentionally unused when +1 more Spell Resistance would exceed the target curve.<br>
      This Passive grants no Armor, Evade, Damage Reduction, Phasing, Temporary HP, Healing, Attack Dice, Cleanse, Absorption, Damage, Penetration, Critical, Movement, or control.
    </span>
  </span>
</h3>

Your body, mind, soul, or warding pattern rejects hostile spell structure.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Spell Resistance | Self | — | Permanent | Gain **+1 Spell Resistance**. |
| **2** | Passive, Spell Resistance | Self | — | Permanent | Gain **+2 Spell Resistance**. |
| **3** | Passive, Spell Resistance | Self | — | Permanent | Gain **+4 Spell Resistance**. |
| **4** | Passive, Spell Resistance | Self | — | Permanent | Gain **+5 Spell Resistance**. |
| **5** | Passive, Spell Resistance | Self | — | Permanent | Gain **+6 Spell Resistance**. |
| **6** | Passive, Spell Resistance | Self | — | Permanent | Gain **+8 Spell Resistance**. |
| **7** | Passive, Spell Resistance | Self | — | Permanent | Gain **+9 Spell Resistance**. |
| **8** | Passive, Spell Resistance | Self | — | Permanent | Gain **+10 Spell Resistance**. |
| **9** | Passive, Spell Resistance | Self | — | Permanent | Gain **+12 Spell Resistance**. |
| **10** | Passive, Spell Resistance | Self | — | Permanent | Gain **+13 Spell Resistance**. |
| **11** | Passive, Spell Resistance | Self | — | Permanent | Gain **+14 Spell Resistance**. |
| **12** | Passive, Spell Resistance | Self | — | Permanent | Gain **+16 Spell Resistance**. |
| **13** | Passive, Spell Resistance | Self | — | Permanent | Gain **+17 Spell Resistance**. |
| **14** | Passive, Spell Resistance | Self | — | Permanent | Gain **+18 Spell Resistance**. |
| **15** | Passive, Spell Resistance | Self | — | Permanent | Gain **+20 Spell Resistance**. |
| **16** | Passive, Spell Resistance | Self | — | Permanent | Gain **+21 Spell Resistance**. |

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-special-negation">
  Passive: Special Negation
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16.<br>
      Special Negation is a closed premium defensive subsystem protecting against incoming Specials.<br><br>

   DESIGN STRUCTURE<br>
      This is a pure Special Negation Passive with exactly one axis: automatic reduction of incoming eligible Specials.<br>
      Whenever an eligible hostile Special(X) would be applied to you, reduce its value by your Special Negation before the Special is applied.<br>
      If the Special is reduced to 0 or less, it is not applied.<br>
      Special Negation requires no Action, Movement, Reaction, Stone, roll, or active decision.<br><br>

  SEPARATE SPECIALS<br>
      Special Negation is applied separately to every eligible Special carried by the same Attack or effect.<br>
      If an Attack would apply several eligible Specials, reduce each Special by your full Special Negation value.<br><br>

   EXISTING SPECIALS<br>
      Special Negation does not reduce Specials already affecting you.<br>
      If a new application would increase, replace, or refresh an existing Special, reduce the incoming Special value before applying the normal stacking, replacement, or refresh rules.<br><br>

   ELIGIBLE SPECIALS<br>
      Eligible Specials are hostile numeric creature effects that can normally be reduced by Cleanse, including Blight(X), Challenge(X), Corrode(X), Disoriented(X), Expose(X), Hex(X), Lacerate(X), Mark(X), Root(X), Ruin(X), Slow(X), Soulburn(X), Sundered(X), and Weaken(X).<br>
      The delivery method is irrelevant.<br>
      Special Negation may protect against Specials delivered by Attacks, Spells, Area Effects, creature abilities, or other hostile effects.<br><br>

  INELIGIBLE EFFECTS<br>
      Special Negation does not affect Damage Dice, Attack Dice, flat damage, forced movement, Prone, Disarm, Stunned, or other binary effects without a reducible numeric value.<br>
      Special Negation cannot affect battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, non-creature effects, or effects that require Dispel or a dedicated rule.<br><br>

   SCALING<br>
      L1 = Special Negation 1.<br>
      L2 = Special Negation 2.<br>
      L3 = Special Negation 3.<br>
      L4 = Special Negation 4.<br>
      L5 = Special Negation 4.<br>
      L6 = Special Negation 5.<br>
      L7 = Special Negation 5.<br>
      L8 = Special Negation 6.<br>
      L9 = Special Negation 6.<br>
      L10 = Special Negation 7.<br>
      L11 = Special Negation 7.<br>
      L12 = Special Negation 8.<br>
      L13 = Special Negation 8.<br>
      L14 = Special Negation 9.<br>
      L15 = Special Negation 9.<br>
      L16 = Special Negation 10.<br><br>

  EXAMPLE<br>
      You have Special Negation 2.<br>
      An Attack would apply Soulburn(3) and Mark(4) to you.<br>
      Soulburn(3) is reduced to Soulburn(1).<br>
      Mark(4) is reduced to Mark(2).<br>
      The Attack's damage and all other effects resolve normally.<br><br>

   NOTES<br>
      Special Negation prevents or reduces incoming Specials before they are applied.<br>
      Special Negation is not Cleanse and does not remove existing Specials.<br>
      Special Negation is not Spell Resistance and does not increase the Target Number of hostile Spells.<br>
      This Passive grants no Armor, Evade, Parry, Damage Negation, Damage Reduction, Phasing, Temporary HP, Healing, Attack Dice, Absorption, Damage, Penetration, Critical, Movement, control, free Attack, or additional Reaction.
    </span>
  </span>
</h3>

Your body, armor, blood, mind, or spirit reduces hostile afflictions before they can fully take hold.

---

Whenever an eligible hostile **Special(X)** would be applied to you, reduce its value by your **Special Negation** before the Special is applied.

If the Special is reduced to **0 or less**, it is not applied.

Special Negation applies separately to every eligible Special delivered by the same Attack or effect.

Special Negation does not reduce Specials already affecting you.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **1**. |
| **2** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **2**. |
| **3** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **3**. |
| **4** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **4**. |
| **5** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **4**. |
| **6** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **5**. |
| **7** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **5**. |
| **8** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **6**. |
| **9** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **6**. |
| **10** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **7**. |
| **11** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **7**. |
| **12** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **8**. |
| **13** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **8**. |
| **14** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **9**. |
| **15** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **9**. |
| **16** | Passive, Special Negation | Self | — | Permanent | Reduce every incoming eligible hostile Special by **10**. |

---

}}

\page
{{pageNumber,auto}}
{{wide
## Passive: Telepathy

Telepathy is a Passive mental utility category.

It grants **Telepathic Access** and allows the user to establish voluntary **Mind Links**.

Mind Link is not a separate Power. It is part of Telepathy and requires no additional Passive Slot.

Telepathy does not deal damage.
Telepathy does not apply Specials.
Telepathy does not control creatures.

Telepathy does not read or search an unwilling creature's thoughts or memories. Hostile information gathering requires **Mind Probe**.

While this Passive is slotted, you have Telepathic Access to thinking creatures within the listed range that you can perceive or whose location you know. Telepathic Access by itself reveals no thoughts, memories, identity, or hidden information. It only allows eligible Mental Powers to reach the target.
A willing creature may accept or leave a Mind Link without a Check.
A Mind Link allows only the communication and voluntary sharing listed by the Passive's current level. A willing creature never reveals more than it chooses to share.

<h3 id="passive-telepathy">
  Passive: Telepathy
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Passive<br>
      Category = Telepathy<br>
      Passive curve = 20 PP per level<br>
      Telepathy is an access and utility Passive.<br>
      Mind Link is included and does not require a second Power.<br>
      Telepathy does not deal damage.<br>
      DESIGN STRUCTURE<br>
      This Passive scales through Range, linked creatures, voluntary communication, shared impressions, shared senses, and willing memory sharing.<br>
      It is required for Mental Attack, Mind Illusion, Mind Probe, and Mental Control unless a specific Power says otherwise.<br><br>
      ACCESS RULE<br>
      A Mental Power cannot normally be used at a higher level than the user's Telepathy Passive level.<br>
      This means Mental builds pay both a Passive Slot and the relevant Active Power choice.
    </span>
  </span>
</h3>

A passive mental connection that grants Telepathic Access and allows voluntary Mind Links.

| **Level** | **Type** | **Range** | **Linked Creatures** | **Telepathy Feature** |
|:--:|:--|:--:|:--:|:--|
| **1** | Passive | 8 m | 1 willing creature | Send simple silent words to one willing creature within range. |
| **2** | Passive | 16 m | 1 willing creature | You and the linked creature may communicate silently in both directions. |
| **3** | Passive | 24 m | 2 willing creatures | Maintain a small Mind Link between yourself and up to two willing creatures. |
| **4** | Passive | 32 m | 2 willing creatures | Simple meaning, emotion, direction, and intent no longer require a shared spoken language. |
| **5** | Passive | 48 m | 3 willing creatures | Send one simple image, emotion, sensation, or sensory impression through the link. |
| **6** | Passive | 64 m | 3 willing creatures | All linked willing creatures may communicate silently through you. |
| **7** | Passive | 80 m | 4 willing creatures | A willing linked creature may deliberately share one simple sensory impression with you. |
| **8** | Passive | 100 m | 4 willing creatures | Detect the presence of thinking minds within range. This reveals presence only, not identity, exact thoughts, creature type, or precise location. |
| **9** | Passive | 120 m | 5 willing creatures | A willing linked creature may share one brief memory fragment lasting only a few seconds as it remembers it. |
| **10** | Passive | 160 m | 5 willing creatures | A willing linked creature may share one active sense with you, such as sight or hearing, while the link is maintained. |
| **11** | Passive | 200 m | 6 willing creatures | A Mind Link may pass through normal walls or obstacles if you know the linked creature and it remains within range. |
| **12** | Passive | 300 m | 6 willing creatures | Share sight and hearing with one willing linked creature while the link is maintained. |
| **13** | Passive | 500 m | MR + 2 willing creatures | Your Mind Link becomes a mental conference. All linked willing creatures may communicate silently with each other. |
| **14** | Passive | 1 km | MR + 2 willing creatures | Maintain a link to a known willing creature at long range if the link was willingly established. |
| **15** | Passive | 5 km | MR + 3 willing creatures | A willing linked creature may deliberately share one complete remembered scene, including its sensory and emotional impressions. |
| **16** | Passive | Same region, GM permission | MR + 4 willing creatures | Maintain a wide Mind Link with known willing creatures across a large area. Wards, planar separation, divine interference, or narrative barriers may still block it. |

---

}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-summon-tokens">
  Passive: Summon Tokens
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 / 40 / 60 / 80 PP, continued linearly to Level 16<br>
      Summon Token Support = 1 Summon Token per 10 PP<br><br>
      CALCULATION<br>
      L1 → +2 Summon Tokens = 20 PP<br>
      L2 → +4 Summon Tokens = 40 PP<br>
      L3 → +6 Summon Tokens = 60 PP<br>
      L4 → +8 Summon Tokens = 80 PP<br>
      L5 → +10 Summon Tokens = 100 PP<br>
      L6 → +12 Summon Tokens = 120 PP<br>
      L7 → +14 Summon Tokens = 140 PP<br>
      L8 → +16 Summon Tokens = 160 PP<br>
      L9 → +18 Summon Tokens = 180 PP<br>
      L10 → +20 Summon Tokens = 200 PP<br>
      L11 → +22 Summon Tokens = 220 PP<br>
      L12 → +24 Summon Tokens = 240 PP<br>
      L13 → +26 Summon Tokens = 260 PP<br>
      L14 → +28 Summon Tokens = 280 PP<br>
      L15 → +30 Summon Tokens = 300 PP<br>
      L16 → +32 Summon Tokens = 320 PP<br><br>
      NOTES — This Passive strengthens existing Summon Bonds. It does not create Summons, does not bind Stones, does not grant Extra Attacks, and does not create additional Summon Bodies. The bonus Tokens may only be spent on existing Summon Bodies.
    </span>
  </span>
</h3>

Your bound souls answer more clearly when you divide yourself between them.

You gain bonus **Summon Tokens** for your existing Summon Bonds.

These Tokens may only be assigned to Summon Bonds that already exist.

They cannot create a Summon Bond.

They cannot replace Bound Stones.

They cannot create additional Summon Bodies.

They cannot buy Extra Attacks.

They cannot buy Special Access.

They may be spent on:

- HP
- Armor
- Evade
- Attack
- Damage
- Walking Movement
- Flying Movement
- Shared Senses
- Special Value, if the Summon Bond already has Special Access

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Summon | Self | — | Permanent | Gain **+2 Summon Tokens**. |
| **2** | Passive, Summon | Self | — | Permanent | Gain **+4 Summon Tokens**. |
| **3** | Passive, Summon | Self | — | Permanent | Gain **+6 Summon Tokens**. |
| **4** | Passive, Summon | Self | — | Permanent | Gain **+8 Summon Tokens**. |
| **5** | Passive, Summon | Self | — | Permanent | Gain **+10 Summon Tokens**. |
| **6** | Passive, Summon | Self | — | Permanent | Gain **+12 Summon Tokens**. |
| **7** | Passive, Summon | Self | — | Permanent | Gain **+14 Summon Tokens**. |
| **8** | Passive, Summon | Self | — | Permanent | Gain **+16 Summon Tokens**. |
| **9** | Passive, Summon | Self | — | Permanent | Gain **+18 Summon Tokens**. |
| **10** | Passive, Summon | Self | — | Permanent | Gain **+20 Summon Tokens**. |
| **11** | Passive, Summon | Self | — | Permanent | Gain **+22 Summon Tokens**. |
| **12** | Passive, Summon | Self | — | Permanent | Gain **+24 Summon Tokens**. |
| **13** | Passive, Summon | Self | — | Permanent | Gain **+26 Summon Tokens**. |
| **14** | Passive, Summon | Self | — | Permanent | Gain **+28 Summon Tokens**. |
| **15** | Passive, Summon | Self | — | Permanent | Gain **+30 Summon Tokens**. |
| **16** | Passive, Summon | Self | — | Permanent | Gain **+32 Summon Tokens**. |

}}


\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-thorns">
  Passive: Thorns
  <span class="tooltip">🛈
    <span class="tooltiptext">
      CATEGORY<br>
      Damage<br><br>
      BASELINES<br>
      Passive curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Thorns = 30 PP per +1d8 Thorns.<br>
      Thorns is reflected damage, not an attack and not a Special.<br><br>
      DESIGN STRUCTURE<br>
      This is a Passive Damage effect using the dedicated Thorns rules.<br>
      It has exactly one axis: Thorns damage.<br>
      Thorns damage triggers only when the user takes final HP damage from a direct attack, Spell, or Power.<br>
      Thorns damage cannot exceed the final HP damage the user took from the triggering effect.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 target 20 PP → no effect = 0 PP below target.<br>
      L2 target 40 PP → Thorns 1d8 = 30 PP below target.<br>
      L3 target 60 PP → Thorns 2d8 = 60 PP exactly on target.<br>
      L4 target 80 PP → Thorns 2d8 = 60 PP below target.<br>
      L5 target 100 PP → Thorns 3d8 = 90 PP below target.<br>
      L6 target 120 PP → Thorns 4d8 = 120 PP exactly on target.<br>
      L7 target 140 PP → Thorns 4d8 = 120 PP below target.<br>
      L8 target 160 PP → Thorns 5d8 = 150 PP below target.<br>
      L9 target 180 PP → Thorns 6d8 = 180 PP exactly on target.<br>
      L10 target 200 PP → Thorns 6d8 = 180 PP below target.<br>
      L11 target 220 PP → Thorns 7d8 = 210 PP below target.<br>
      L12 target 240 PP → Thorns 8d8 = 240 PP exactly on target.<br>
      L13 target 260 PP → Thorns 8d8 = 240 PP below target.<br>
      L14 target 280 PP → Thorns 9d8 = 270 PP below target.<br>
      L15 target 300 PP → Thorns 10d8 = 300 PP exactly on target.<br>
      L16 target 320 PP → Thorns 10d8 = 300 PP below target.<br><br>
      NOTES<br>
      Passive: Thorns is intentionally capped by final HP damage taken. It reflects damage only and never reflects Specials. It does not make attacks, does not trigger on-hit effects, does not benefit from Crit, and cannot trigger Thorns. This Passive uses the Damage category and therefore competes with other Damage Passives.
    </span>
  </span>
</h3>

Your body punishes those who harm you.

| **Level** | **Type** | **Category** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Damage | Self | — | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Passive | Damage | Self | — | Permanent | Gain **Thorns 1d8**. |
| **3** | Passive | Damage | Self | — | Permanent | Gain **Thorns 2d8**. |
| **4** | Passive | Damage | Self | — | Permanent | Gain **Thorns 2d8**. |
| **5** | Passive | Damage | Self | — | Permanent | Gain **Thorns 3d8**. |
| **6** | Passive | Damage | Self | — | Permanent | Gain **Thorns 4d8**. |
| **7** | Passive | Damage | Self | — | Permanent | Gain **Thorns 4d8**. |
| **8** | Passive | Damage | Self | — | Permanent | Gain **Thorns 5d8**. |
| **9** | Passive | Damage | Self | — | Permanent | Gain **Thorns 6d8**. |
| **10** | Passive | Damage | Self | — | Permanent | Gain **Thorns 6d8**. |
| **11** | Passive | Damage | Self | — | Permanent | Gain **Thorns 7d8**. |
| **12** | Passive | Damage | Self | — | Permanent | Gain **Thorns 8d8**. |
| **13** | Passive | Damage | Self | — | Permanent | Gain **Thorns 8d8**. |
| **14** | Passive | Damage | Self | — | Permanent | Gain **Thorns 9d8**. |
| **15** | Passive | Damage | Self | — | Permanent | Gain **Thorns 10d8**. |
| **16** | Passive | Damage | Self | — | Permanent | Gain **Thorns 10d8**. |

When you take final HP damage from a direct attack, Spell, or Power, the source of that damage takes your Thorns damage after the triggering effect is fully resolved.

Thorns damage cannot exceed the final HP damage you took from the triggering effect.

If the triggering effect deals no final HP damage to you, Passive: Thorns deals no damage.

Passive: Thorns follows all normal Thorns rules.

}}


\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-invisibility">
  Passive: Invisibility
  <span class="tooltip">🛈
    <span class="tooltiptext">
      CATEGORY<br>
      Invisibility<br><br>

      BASELINES<br>
      Passive curve = 20 PP at Level 1, +20 PP per level after that.<br>
      Invisibility is a premium defensive axis based on perception, sense obscuration, and target denial.<br>
      Each Power Level grants +1 Invisibility Bonus, up to +16 at Level 16.<br><br>

      DESIGN STRUCTURE<br>
      Passive: Invisibility does not reduce damage.<br>
      It does not increase Evade.<br>
      It does not grant Armor, Damage Reduction, Phasing, Temporary HP, or Healing.<br>
      Instead, it increases the Perception TN required to locate, target, or read the invisible creature through affected Combat Senses.<br><br>

      PROGRESSION<br>
      Invisibility Bonus = Power Level.<br>
      Passive: Invisibility always Obscures Normal Combat Awareness, including Darkvision.<br>
      At Levels 4, 8, 12, and 15, one additional Special Combat Sense may be selected.<br>
      Each selection must be different.<br>
      Unselected Special Combat Senses remain unaffected.<br><br>

      LEVEL-BY-LEVEL STRUCTURE<br>
      L1 → +1 Invisibility Bonus, Normal Combat Awareness.<br>
      L2 → +2 Invisibility Bonus, Normal Combat Awareness.<br>
      L3 → +3 Invisibility Bonus, Normal Combat Awareness.<br>
      L4 → +4 Invisibility Bonus, +1 Special Combat Sense.<br>
      L5 → +5 Invisibility Bonus, +1 Special Combat Sense.<br>
      L6 → +6 Invisibility Bonus, +1 Special Combat Sense.<br>
      L7 → +7 Invisibility Bonus, +1 Special Combat Sense.<br>
      L8 → +8 Invisibility Bonus, +2 Special Combat Senses.<br>
      L9 → +9 Invisibility Bonus, +2 Special Combat Senses.<br>
      L10 → +10 Invisibility Bonus, +2 Special Combat Senses.<br>
      L11 → +11 Invisibility Bonus, +2 Special Combat Senses.<br>
      L12 → +12 Invisibility Bonus, +3 Special Combat Senses.<br>
      L13 → +13 Invisibility Bonus, +3 Special Combat Senses.<br>
      L14 → +14 Invisibility Bonus, +3 Special Combat Senses.<br>
      L15 → +15 Invisibility Bonus, +4 Special Combat Senses.<br>
      L16 → +16 Invisibility Bonus, +4 Special Combat Senses.<br><br>

      DETECTION<br>
      Base Perception TN = (4 × Mastery Rank) + Invisibility Bonus.<br>
      Lost Health Bars reduce this TN by Mastery Rank per Bar.<br>
      Stealth Skill Points may be spent retroactively to increase the TN for the current Round.<br>
      See Core Rules: Stealth, Hidden, and Invisibility.<br><br>

      NOTES<br>
      Invisibility Obscures affected Senses; it does not Block them completely.<br>
      Observers may attempt Perception normally against the Invisibility TN.<br>
      A Clear, unaffected Combat Sense bypasses Invisibility.<br>
      Invisibility does not protect against Area Effects, zones, environmental damage, or effects that do not require precise targeting.<br>
      Lost Health Bars reduce the Invisibility Perception TN according to the Core.
    </span>
  </span>
</h3>

You are hard to find, hard to read, and harder to fight directly. **This Passive is permanent while slotted: attacking, casting, moving, reacting, taking damage, or being detected does not remove it or reveal your position automatically.** Normal Combat Awareness remains Obscured after an attack. A direct attacker uses the free Perception Check and the normal Combat Sense rules in Core; a successful Check permits targeting only for that observer during the current Round, without making you visible.

| **Level** | **Type** | **Category** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--|:--:|:--:|:--:|:--|
| **1** | Passive | Invisibility | Self | — | Permanent | **+1 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **2** | Passive | Invisibility | Self | — | Permanent | **+2 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **3** | Passive | Invisibility | Self | — | Permanent | **+3 Invisibility Bonus**. Obscures **Normal Combat Awareness**. |
| **4** | Passive | Invisibility | Self | — | Permanent | **+4 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **1 chosen Special Combat Sense**. |
| **5** | Passive | Invisibility | Self | — | Permanent | **+5 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **1 chosen Special Combat Sense**. |
| **6** | Passive | Invisibility | Self | — | Permanent | **+6 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **1 chosen Special Combat Sense**. |
| **7** | Passive | Invisibility | Self | — | Permanent | **+7 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **1 chosen Special Combat Sense**. |
| **8** | Passive | Invisibility | Self | — | Permanent | **+8 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **2 chosen Special Combat Senses**. |
| **9** | Passive | Invisibility | Self | — | Permanent | **+9 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **2 chosen Special Combat Senses**. |
| **10** | Passive | Invisibility | Self | — | Permanent | **+10 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **2 chosen Special Combat Senses**. |
| **11** | Passive | Invisibility | Self | — | Permanent | **+11 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **2 chosen Special Combat Senses**. |
| **12** | Passive | Invisibility | Self | — | Permanent | **+12 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **3 chosen Special Combat Senses**. |
| **13** | Passive | Invisibility | Self | — | Permanent | **+13 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **3 chosen Special Combat Senses**. |
| **14** | Passive | Invisibility | Self | — | Permanent | **+14 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **3 chosen Special Combat Senses**. |
| **15** | Passive | Invisibility | Self | — | Permanent | **+15 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **4 chosen Special Combat Senses**. |
| **16** | Passive | Invisibility | Self | — | Permanent | **+16 Invisibility Bonus**. Obscures **Normal Combat Awareness** and **4 chosen Special Combat Senses**. |

### Combat Sense Coverage

Passive: Invisibility always Obscures **Normal Combat Awareness**, including **Darkvision**.

At Power Levels **4, 8, 12, and 15**, choose one additional Special Combat Sense:

- **Life Sense**
- **Mage Sense**
- **Tremor Sense**
- **Sonar Sense**
- **Predator Sense**

Each Special Combat Sense may be selected only once. Selections are permanent unless the character is rebuilt.

A Sense covered by Invisibility is **Obscured**, not Blocked. The observer must succeed on a Perception Check to locate the creature.

A Special Combat Sense not covered by Invisibility functions normally. If that Sense can clearly perceive the creature, the observer can locate and target it without an Invisibility Perception Check.

**Agility Stone Ability — Invisibility Boost:** For the current Round, add **+1 / +2 / +4 / +8** (Ranks 1–4) to an existing Invisibility Bonus. This increases the resulting Invisibility Perception TN, but does not grant Invisibility or obscure any additional Combat Sense.


}}


\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-initiative">
  Passive: Initiative
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 PP at Level 1, +20 PP per Level.<br>
      +1 Initiative = 10 PP.<br><br>
  DESIGN STRUCTURE<br>
  This is a pure Initiative Passive with exactly one mechanical axis: Initiative.<br>
  The bonus is added to the character's initial Initiative Score before the Initiative Exchange opens.<br>
  The bonus may therefore be spent in the initial Initiative Exchange or retained to determine Initiative Order.<br><br>

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

  NOTES<br>
  This Passive does not reroll Initiative.<br>
  It does not reopen the Initiative Exchange during combat.<br>
  It does not grant additional Turns, Actions, Reactions, Movement, Attack Dice, Evade, Armor, or any other rider.<br>
  Initiative gained from this Passive follows all normal Initiative Exchange and Initiative Order rules.
</span>

  </span>
</h3>

You enter combat already moving through possibilities that others have not yet recognized.

**Category:** Initiative

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect**               |
| :-------: | :------- | :-------: | :-----: | :----------: | :----------------------- |
|   **1**   | Passive  |    Self   |    —    |   Permanent  | Gain **+2 Initiative**.  |
|   **2**   | Passive  |    Self   |    —    |   Permanent  | Gain **+4 Initiative**.  |
|   **3**   | Passive  |    Self   |    —    |   Permanent  | Gain **+6 Initiative**.  |
|   **4**   | Passive  |    Self   |    —    |   Permanent  | Gain **+8 Initiative**.  |
|   **5**   | Passive  |    Self   |    —    |   Permanent  | Gain **+10 Initiative**. |
|   **6**   | Passive  |    Self   |    —    |   Permanent  | Gain **+12 Initiative**. |
|   **7**   | Passive  |    Self   |    —    |   Permanent  | Gain **+14 Initiative**. |
|   **8**   | Passive  |    Self   |    —    |   Permanent  | Gain **+16 Initiative**. |
|   **9**   | Passive  |    Self   |    —    |   Permanent  | Gain **+18 Initiative**. |
|   **10**  | Passive  |    Self   |    —    |   Permanent  | Gain **+20 Initiative**. |
|   **11**  | Passive  |    Self   |    —    |   Permanent  | Gain **+22 Initiative**. |
|   **12**  | Passive  |    Self   |    —    |   Permanent  | Gain **+24 Initiative**. |
|   **13**  | Passive  |    Self   |    —    |   Permanent  | Gain **+26 Initiative**. |
|   **14**  | Passive  |    Self   |    —    |   Permanent  | Gain **+28 Initiative**. |
|   **15**  | Passive  |    Self   |    —    |   Permanent  | Gain **+30 Initiative**. |
|   **16**  | Passive  |    Self   |    —    |   Permanent  | Gain **+32 Initiative**. |

---

### Initiative Passive Rules

Add the Passive's Initiative bonus to your Initiative Score after rolling Initiative and before using the initial Initiative Exchange.

The bonus becomes part of your Initiative Score.

You may spend it in the Initiative Exchange as normal.

Any Initiative remaining after Initiative conversions determines your position in Initiative Order.

This Passive applies only once when Initiative is initially determined at the start of combat.

It does not apply again when another Power grants Initiative, changes Initiative, rerolls Initiative, or reopens the Initiative Exchange unless that rule explicitly says to recalculate the complete Initiative Score.

This Passive does not open the Initiative Exchange.



}}


\page
{{pageNumber,auto}}
{{wide


## Parry Passives

Parry is a dedicated defensive subsystem and one of the primary Defense Pillars of the Mastery System.

When learning **Passive: Parry**, choose one Parry delivery:

- **Martial Parry** disrupts eligible Martial Attack Pools.
- **Spell Parry** disrupts eligible hostile Spell Casting Pools.

This choice is permanent unless the Power is retrained. Both deliveries use the same Parry Pool, Power Level progression, Active Buff support, and core Parry rules. They differ only in what they can intercept.

Parry does not require a Contest or defensive roll. It removes dice before the triggering roll is made.

---

### Parry Attribute and Requirements

When learning **Martial Parry**, choose **Might** or **Agility** as your Parry Attribute. Martial Parry requires a suitable melee weapon, shield, natural weapon, or another implement explicitly capable of parrying the triggering Attack.

When learning **Spell Parry**, choose **Intellect**, **Resolve**, or **Influence** as your Parry Attribute. Spell Parry represents counter-magic, disruption, warding, severing a spell pattern, or another magical interception method. It does not require a melee weapon or shield unless the character's fiction or another rule says otherwise.

The chosen delivery and Attribute cannot normally be changed unless the Power is retrained.

---

### Entering Parry

At the beginning of your Turn, before using your base Attack Action, you may enter **Parry** until the beginning of your next Turn.

Entering Parry normally consumes the character's **base Attack Action** at the beginning of their Turn. If that Action was already committed during Preparation to activate an Active Buff, the character may instead spend one legally available **additional Attack Action** to enter Parry. The same Attack Action cannot pay for both effects.

While Parrying:

* You cannot use your normal base Attack Action.
* Additional Attack Actions gained from **Extra Attack** or another legal source remain available for other uses once Parry has been paid for.
* You may use your Movement normally.
* You may use Reactions normally.
* You gain a **Parry Pool** equal to your chosen Parry Attribute, up to the maximum allowed by your Parry Passive's Level.

Activating **Active Buff: Parry Recovery** does **not** enter Parry. Without a remaining base Attack Action or a legal additional Attack Action, the Buff stays active but provides no Parry Recovery until Parry is entered legally. A character cannot enter Parry after using every eligible Attack Action that could pay for it during the same Turn.

---

### Martial Parry

When an eligible direct Martial Attack targets you, the attacker first declares the Attack, its targets, Raises, and any division of the Attack Pool.

Before the Attack Roll is made, you may spend points from your Parry Pool.

For every point of Parry spent, remove **1 Attack Die** from the Attack Pool assigned to you. Removed Attack Dice are not rolled.

Martial Parry normally applies only to eligible direct Martial Attacks targeting you. It does not normally affect Area Attacks, environmental damage, ongoing damage, automatic damage, Persistent Zones, or effects without an Attack Roll.

The wielded implement must be capable of parrying the triggering Attack unless another rule explicitly expands its use.

---
}}
\page
{{pageNumber,auto}}
{{wide

### Spell Parry

When you are a target of, or a valid creature inside, a hostile Spell whose source is within **22 m** and whose casting you can perceive, you may use Spell Parry before its Casting Roll.

For every point of Parry spent, remove **1 Casting Die** from that Spell's Casting Pool. Removed Casting Dice are not rolled.

Spell Parry can affect a direct Spell or a Spell AoE if you are one of its valid affected creatures. Because a Spell AoE uses one Casting Roll for the entire area, reducing that Casting Pool affects the roll used against every creature in that AoE.

Spell Parry does not affect effects without a Casting Roll, environmental magic, ongoing damage, already-created Persistent Zones, or a Spell whose source is more than **22 m** away.

---

### Reduced Keep

If Parry reduces an eligible Attack Pool or Casting Pool below its normal Keep value, roll the remaining dice and keep all remaining dice.

---

### Fully Parried and Fully Countered Effects

If Parry reduces the eligible Pool to **0 dice**, a Martial Attack is **Fully Parried** and a Spell is **Fully Countered**. These are the two delivery names for the same zero-dice Parry result. Counterspell is not a separate Power.

A Fully Parried or Fully Countered effect:

* makes no Attack Roll or Casting Roll,
* does not hit or successfully cast,
* rolls no Damage Dice,
* deals no damage,
* applies no Specials,
* applies no on-hit or on-success effects,
* and does not resolve any effect that requires the Attack to hit or the Spell to cast successfully.


A Fully Parried or Fully Countered effect may trigger abilities such as **Riposte** or **Reflection** only when that ability's own requirements are met. Weapon-based Parry Reactions still require a Fully Parried Martial Attack.

Unspent Parry is lost at the beginning of your next Turn.

---

### Shared Parry Limitations

Parry removes dice from the delivery roll. It does not increase Evade, reduce Damage Dice, reduce Specials directly, or grant another defense.

A specific Passive, Active Buff, Reaction, Artifact, weapon, shield, natural weapon, focus, or other ability may explicitly expand which effects can be parried.

---
}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-parry">
  Passive: Parry
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 PP per Level.<br>
      Parry is a closed defensive subsystem and a primary Defense Pillar beside Armor and Evade.<br><br>
      DELIVERY CHOICE<br>
      When learning this Passive, choose Martial Parry or Spell Parry.<br>
      Martial Parry chooses Might or Agility as its Parry Attribute and removes Attack Dice from eligible Martial Attacks targeting you.<br>
      Spell Parry chooses Intellect, Resolve, or Influence as its Parry Attribute and removes Casting Dice from eligible hostile Spells whose source is within 22 m when you are a target or valid creature in the Spell's area.<br><br>
      ACTION COST<br>
      At the beginning of your Turn, before using your base Attack Action, you may enter Parry until the beginning of your next Turn.<br>
      Entering Parry normally consumes the base Attack Action for that Turn.<br>
      If that Action was already committed during Preparation to activate an Active Buff, spend one legally available additional Attack Action instead. The same Attack Action cannot pay for both effects.<br>
      Active Buff: Parry Recovery does not enter Parry by itself.<br>
      Movement and Reactions remain available.<br><br>
      PARRY POOL<br>
      Your Parry Pool equals your chosen Parry Attribute, limited by ceil(5 × this Power's Level / 2).<br>
      The Pool is shared across all eligible effects until the beginning of your next Turn.<br><br>
      RESOLUTION<br>
      Spend 1 Parry to remove 1 die from the eligible Attack Pool or Casting Pool before its roll.<br>
      If the Pool reaches 0 dice, a Martial Attack is Fully Parried and a Spell is Fully Countered. Either result means the effect does not resolve.<br>
      A Fully Countered Spell makes no Casting Roll and has no additional penalty.<br><br>
      LEVEL CAP<br>
      L1 = maximum 3 Parry<br>
      L2 = maximum 5 Parry<br>
      L3 = maximum 8 Parry<br>
      L4 = maximum 10 Parry<br>
      L5 = maximum 13 Parry<br>
      L6 = maximum 15 Parry<br>
      L7 = maximum 18 Parry<br>
      L8 = maximum 20 Parry<br>
      L9 = maximum 23 Parry<br>
      L10 = maximum 25 Parry<br>
      L11 = maximum 28 Parry<br>
      L12 = maximum 30 Parry<br>
      L13 = maximum 33 Parry<br>
      L14 = maximum 35 Parry<br>
      L15 = maximum 38 Parry<br>
      L16 = maximum 40 Parry<br><br>

      NOTES<br>
      This Passive grants no Armor, Evade, Damage Reduction, Phasing, Temporary HP, free Attack, or additional Reaction.<br>
      Parry removes delivery dice, not Damage Dice.<br>
    </span>
  </span>
</h3>

You commit your base action to active interception: steel against steel, or will against spellcraft.

---

When learning this Passive, choose one delivery and Parry Attribute:

- **Martial Parry:** Might or Agility.
- **Spell Parry:** Intellect, Resolve, or Influence.

At the beginning of your Turn, before using your base Attack Action, you may enter **Parry** until the beginning of your next Turn.

While Parrying:

* You cannot use your **base Attack Action** that Turn.
* Additional Attack Actions from Extra Attack or another legal source remain available.
* You may use Movement and Reactions normally.
* Gain a Parry Pool equal to your chosen Parry Attribute, up to the maximum listed for this Power's Level.
* Martial Parry spends 1 Parry to remove 1 Attack Die from an eligible direct Martial Attack targeting you.
* Spell Parry spends 1 Parry to remove 1 Casting Die from an eligible hostile Spell whose source is within **22 m** when you are a target or valid creature in its area.
* The Parry Pool is shared across all eligible effects until the beginning of your next Turn.
* Unspent Parry is lost at the beginning of your next Turn.

If you reduce the eligible Pool to **0 dice**, a Martial Attack is **Fully Parried** and a Spell is **Fully Countered**. Either result means the effect does not resolve.

| **Level** | **Type**       | **Range** |     **Duration**     | **Maximum Parry Pool** |
| :-------: | :------------- | :-------: | :------------------: | :--------------------: |
|   **1**   | Passive, Parry |    Self   | Until your next Turn |          **3**         |
|   **2**   | Passive, Parry |    Self   | Until your next Turn |         **5**         |
|   **3**   | Passive, Parry |    Self   | Until your next Turn |         **8**         |
|   **4**   | Passive, Parry |    Self   | Until your next Turn |         **10**         |
|   **5**   | Passive, Parry |    Self   | Until your next Turn |         **13**         |
|   **6**   | Passive, Parry |    Self   | Until your next Turn |         **15**         |
|   **7**   | Passive, Parry |    Self   | Until your next Turn |         **18**         |
|   **8**   | Passive, Parry |    Self   | Until your next Turn |         **20**         |
|   **9**   | Passive, Parry |    Self   | Until your next Turn |         **23**         |
|   **10**  | Passive, Parry |    Self   | Until your next Turn |         **25**         |
|   **11**  | Passive, Parry |    Self   | Until your next Turn |         **28**         |
|   **12**  | Passive, Parry |    Self   | Until your next Turn |         **30**         |
|   **13**  | Passive, Parry |    Self   | Until your next Turn |         **33**         |
|   **14**  | Passive, Parry |    Self   | Until your next Turn |         **35**         |
|   **15**  | Passive, Parry |    Self   | Until your next Turn |         **38**         |
|   **16**  | Passive, Parry |    Self   | Until your next Turn |         **40**         |

---


}}
\page
{{pageNumber,auto}}
{{wide


## Absorption Passives

Absorption is a closed premium Passive subsystem built around accepting real physical injury and converting that suffering into Colorless Stones for later Preparation Phases.

Unlike other defensive systems, Absorption does not prevent damage.

* **Evade** avoids the Attack.
* **Parry** removes incoming Attack Dice or Casting Dice according to its chosen delivery.
* **Armor** reduces rolled damage.
* **Damage Reduction** reduces remaining damage.
* **Phasing** ignores an incoming hit.
* **Absorption** allows the damage to enter the character's Health Bars.

Absorption does not improve survivability directly. Instead, as eligible hostile damage Scars a Health Bar, that event earns combat-limited **Temporary Colorless Stones** for use during subsequent Preparation Phases.

Absorption does not create a separate resource pool, charge system, or list of unique expenditures. It uses the existing Stone economy.

Only the dedicated **Absorption Passive** may generate Temporary Colorless Stones from eligible Scarred Health Bars.

---

### Absorption Is Stone Generation Only

Passive: Absorption does **not** increase Maximum HP, Health Bar size or Health Bar count. It does not grant Temporary HP, prevent damage or restore HP. Normal Health calculations remain unchanged unless another legal effect, such as **Passive: Fortitude**, modifies them.

Absorption generates Temporary Colorless Stones when **eligible hostile damage causes a Health Bar to become Scarred**. Its bonus is Stone generation, not extra Health. No HP-loss threshold or remainder is tracked.

---

}}
\page
{{pageNumber,auto}}
{{wide
### Eligible Absorption Triggers

Resolve hostile damage normally. After all defenses, an **Absorption trigger** occurs whenever that damage causes one of your Health Bars to become **Scarred** while Passive: Absorption is slotted.

No trigger occurs from damage fully prevented by defenses or Temporary HP, from merely losing HP without Scarring a Health Bar, or from Scarred Bars caused by:

* self-inflicted damage or damage from your own Powers;
* HP or Health Bars voluntarily paid or sacrificed as a Power cost;
* damage intentionally caused by a willing ally;
* another effect that Scars a bar without eligible hostile damage.

Damage can Scar more than one Health Bar at once. **Each bar that becomes Scarred counts as one trigger**, subject to the limit below.

### Maximum Four Triggers Per Combat

**Passive: Absorption triggers at most four times per combat in total, regardless of how many Health Bars you have.** Track only a counter from 0 to 4.

For each eligible trigger, earn the number of Temporary Colorless Stones printed for your Passive's Power Level (one Stone per two Power Levels, rounding up: 1 to 8 Stones per trigger). The Stones become Ready at the start of your next Preparation Phase, not immediately.

A single damage instance Scarring two Health Bars uses **two** of the four available triggers. Once all four have been used, no further Absorption Stones or Absorption Reaction/Active Buff bonuses can be earned from later Scarred Bars during that combat.

Restoration, Remove Scar, and unslotting or re-slotting the Passive **do not reset** the counter. Only the start of a new combat resets it. There is no HP-by-HP tracking and no carried-over damage remainder.

#### Example

A character has **Passive: Absorption Level 16** (8 Stones per trigger). One hostile attack Scars two Health Bars. This uses **two of four** triggers and earns **16 Temporary Colorless Stones**, payable at the next Preparation Phase. Only **two triggers** remain for the combat, even if the character has many more Health Bars.

---

}}
\page
{{pageNumber,auto}}
{{wide
### Temporary Colorless Stones

Temporary Colorless Stones represent power earned through an eligible Scarred Health Bar during combat.

When an eligible Health Bar becomes Scarred, **record** the number of Stones earned from that trigger. Receive them in the **Ready** state at the start of your **next Preparation Phase**, before making Stone choices. They are not available immediately when damage is taken.

A Temporary Colorless Stone may pay the normal cost of any eligible unlocked Stone Ability, as a Stone of any Attribute.

Temporary Colorless Stones follow these rules:

* **Unspent** Absorption Stones remain Ready until used or until combat ends, even if you take no further damage.
* **When spent**, Absorption Colorless Stones become **Exhausted** and remain in the Colorless Pool until combat ends. Like all Colorless Stones, they are **not recoverable by default**.
* **Influence Stone Ability: Colorless Recovery** may be activated **once per combat** at one Rank to make up to **2 / 4 / 8 / 16** Colorless Stones of **any source**, including Absorption Stones, eligible for normal Stone Recovery **until combat ends**. Its activation Stones become **Exhausted, not Sealed**.
* Eligible Absorption Stones remain in the Colorless Pool whether Ready or Exhausted; they return Ready **only through the normal shared MR Stones per Round recovery**, never automatically.
* At combat end, **all** Absorption Stones disappear, including unspent Ready Stones, reusable Exhausted Stones, and Stones earned but not yet received. No damage remainder is tracked.
* Absorption Stones cannot be Sealed, Bound, Burned, transferred, or invested. They do not satisfy permanent Stone requirements, and they cannot be used outside combat.

**Colorless Recovery** changes only which existing Colorless Stones are **eligible for normal recovery**. It creates no extra Stones and provides no additional Stone Recovery.

Absorption uses only the four-trigger counter per combat. It never tracks accumulated HP loss or partial progress toward the next Stone.

---

### Closed Premium Subsystem

Absorption is a closed premium subsystem.

Only the dedicated **Absorption Passive** may:

* track eligible Health Bars becoming Scarred (maximum four triggers per combat),
* and generate Temporary Colorless Stones from those triggers.

No other Passive, Active, Active Buff, Reaction, Movement Power, Spell, Artifact Function, Special, rider, or item-like effect may generate Temporary Colorless Stones from damage unless it explicitly belongs to the Absorption subsystem.

Absorption may not appear as a secondary rider on another Passive.

---

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-absorption">
  Passive: Absorption
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive budget = 20 PP per Power Level.<br>
      Absorption is a dedicated Stone-generation Passive. It never grants HP or reduces damage.<br><br>

      TRIGGER<br>
      Each Health Bar Scarred by eligible hostile damage triggers Absorption once.<br>
      One damage instance may Scar multiple bars; each bar counts separately.<br>
      Merely losing HP without Scarring a bar earns nothing.<br>
      Self-inflicted damage, ally-assisted damage, voluntary costs, and prevented damage do not count.<br><br>

      POWER-LEVEL SCALING<br>
      L1-2: 1 Stone per trigger; L3-4: 2; L5-6: 3; L7-8: 4.<br>
      L9-10: 5; L11-12: 6; L13-14: 7; L15-16: 8.<br><br>

      LIMIT AND PAYOUT<br>
      Maximum 4 Absorption triggers per combat across all Health Bars.<br>
      Track a counter 0-4; no HP threshold or remainder.<br>
      Restoration, Remove Scar, or swapping Passives do not reset the counter.<br>
      Stones are received Ready at the next Preparation Phase and expire at combat end.<br><br>

      COLORLESS RECOVERY<br>
      Spent Stones become Exhausted and are not recoverable by default.<br>
      Influence: Colorless Recovery may designate eligible Colorless Stones for normal shared MR-per-Round Stone Recovery, once per combat. It adds no Recovery.<br><br>

      RESTRICTIONS<br>
      No HP, Health Bars, Healing, Armor, Evade, defense or extra actions are granted.<br>
      The Absorption Reaction and Active Buff add Stones only to valid Absorption trigger events.
    </span>

  </span>
</h3>

Your body does not reject pain. It consumes it, turning wounds into power for the battle still to come.

**Trigger:** A Health Bar becomes Scarred from eligible hostile damage while this Passive is slotted. Each qualifying bar uses one of **four total triggers per combat**; Stones arrive in the next Preparation Phase.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Stone Generation** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Absorption | Self | — | Permanent | **1 Temporary Colorless Stone** per Scarred Bar; max **4 triggers/combat**. |
| **2** | Passive, Absorption | Self | — | Permanent | **1 Temporary Colorless Stone** per Scarred Bar; max **4 triggers/combat**. |
| **3** | Passive, Absorption | Self | — | Permanent | **2 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **4** | Passive, Absorption | Self | — | Permanent | **2 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **5** | Passive, Absorption | Self | — | Permanent | **3 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **6** | Passive, Absorption | Self | — | Permanent | **3 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **7** | Passive, Absorption | Self | — | Permanent | **4 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **8** | Passive, Absorption | Self | — | Permanent | **4 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **9** | Passive, Absorption | Self | — | Permanent | **5 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **10** | Passive, Absorption | Self | — | Permanent | **5 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **11** | Passive, Absorption | Self | — | Permanent | **6 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **12** | Passive, Absorption | Self | — | Permanent | **6 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **13** | Passive, Absorption | Self | — | Permanent | **7 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **14** | Passive, Absorption | Self | — | Permanent | **7 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **15** | Passive, Absorption | Self | — | Permanent | **8 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |
| **16** | Passive, Absorption | Self | — | Permanent | **8 Temporary Colorless Stones** per Scarred Bar; max **4 triggers/combat**. |

No HP-loss threshold, fractional Stone progress, or extra Health bonus applies. Bonus Stones from an Absorption Reaction or Active Buff do **not** spend additional triggers, but require a valid trigger.

---

}}

\page
{{pageNumber,auto}}
{{wide


## Damage Negation Passives

**Damage Negation** removes **Damage Dice before they are rolled**, after a hit or other eligible damage effect is established. A character with the dedicated Passive has a **finite Damage Negation Reserve for the current Combat**. Each point spent removes one Damage Die from a pool assigned to that character; the defender chooses how many dice to remove, up to the full pool and available reserve.

This operates at a different step from Parry (delivery dice), Armor (rolled damage) and percentage Damage Reduction (remaining damage). Each system keeps its own trigger and calculation.
---

### Damage Negation Reserve

While the Damage Negation Passive is slotted, you gain a **Damage Negation Reserve** according to the Passive's Level at the beginning of each Combat.

The Reserve represents the total number of Damage Dice you may remove during that Combat.

The Reserve begins at its printed maximum when a **new Combat begins**, is spent across all eligible damage instances in that Combat, and expires when that Combat ends. Rounds, reinforcements and phases of the same encounter use the same running Reserve.

Spending Damage Negation does not require an Action, Movement, Reaction, Stone, or roll.

You choose when and how much of the Reserve to spend.

---

### Spending Damage Negation

When an eligible Damage Pool would be rolled against you, you may spend points from your Damage Negation Reserve before the damage is rolled.

For every point spent:

* Remove **1 Damage Die** from the Damage Pool assigned to you.
* Removed Damage Dice are not rolled.
* Reduce your remaining Damage Negation Reserve by 1.

Damage Negation affects only the Damage Pool assigned to you.

It does not reduce damage dealt to other creatures by the same Attack, Area Effect, or shared Damage Pool.

If the same Damage Pool would normally be rolled once for several creatures, roll a separate reduced Damage Pool for the character using Damage Negation.

---
}}

\page
{{pageNumber,auto}}
{{wide
### Choosing Damage Dice to Negate

Before an eligible Damage Pool is rolled, choose how many Damage Dice to remove, from **0 up to all incoming Damage Dice assigned to you**. The only limits are the size of that Damage Pool and your **available Damage Negation** from legal sources. Spend **1 Damage Negation per removed Damage Die**. All sources used against the same Pool count toward this expenditure; **no minimum number of incoming dice must remain**.

You may remove **every Damage Die** if your available Damage Negation is sufficient. A Pool reduced to **0d8** has no Damage Dice to roll. The Attack still hit, and any independently applicable Specials, on-hit effects, or flat damage remain subject to their own rules.

If you have Temporary Damage Negation from an Active Buff as well as a long-term Passive Reserve, **spend Temporary Damage Negation first**, then the Passive Reserve. You may also choose to spend nothing.

#### Examples

An Attack would deal **12d8 damage**, and you have **8 Damage Negation** available from Passive: Damage Negation Level 4.

* You may remove **0–8 Damage Dice**.
* Spending all 8 points leaves **4d8** to be rolled.

An Attack would deal **7d8 damage**, but you have only **3 Damage Negation** available.

* You may remove **0–3 Damage Dice**.
* Spending all 3 leaves **4d8** to be rolled.

An effect would deal **1d8 damage**, and you have **1 Damage Negation** available.

* You may remove the single Damage Die; **0d8** remains.

---

### Damage Negation Timing

Damage Negation is resolved after an Attack has hit or another effect has successfully created a Damage Pool, but before that Damage Pool is rolled.

The normal defensive order is:

1. Build the relevant Attack Pool or Casting Pool.
2. Apply eligible Parry and other legal delivery-pool modifications.
3. Make the Attack Roll against Evade or the Casting Roll against the applicable Spell TN.
4. Determine whether the Attack hits or the Spell successfully affects the character.
5. Resolve Phasing or another effect that completely ignores the hit.
6. Build the Damage Pool assigned to the character.
7. Apply Damage Negation.
8. Roll the remaining Damage Dice.
9. Apply Armor.
10. Apply Damage Reduction.
11. Apply Temporary HP and other legal damage buffers.
12. Apply the remaining damage to current HP.
13. Determine whether actual HP loss triggers Absorption.

If an effect is Fully Parried, Fully Countered, misses, fails to cast successfully against the character, or is ignored through Phasing, no Damage Pool is rolled and no Damage Negation needs to be spent.

---
}}

\page
{{pageNumber,auto}}
{{wide
### Attack Effects and Specials

Damage Negation changes the **number of Damage Dice** rolled against you. The triggering hit remains successful; its independent payloads resolve through their own rules, including Specials, forced movement, control, Marks, conditions, flat damage and ongoing effects. **Special Negation** and other relevant defenses handle those effects separately.
---

### Eligible Damage

Damage Negation may be used against any damage instance that rolls Damage Dice and assigns those Damage Dice to the character.

This may include:

* direct Attacks
* Area Attacks
* Area Effects
* hostile environmental damage
* ongoing damage that rolls Damage Dice
* other hostile effects that create a Damage Pool

Eligible damage must create a rolled Damage Pool assigned to the character. **Flat damage, HP paid as a cost, self-inflicted damage, direct non-damage HP loss, ordinary Healing and standalone Temporary HP loss** follow their own rules instead.

---
}}

\page
{{pageNumber,auto}}
{{wide
### Interaction with Other Defenses

Damage Negation may be combined with the primary Defense Pillars and other premium defenses.

#### Parry

Parry removes **Attack Dice** or **Casting Dice** before the relevant delivery roll, according to the chosen Parry delivery.

Damage Negation removes **Damage Dice** only after the Attack has hit or the Spell has successfully created a Damage Pool, but before damage is rolled.

A partially parried Martial Attack that still hits, or a partially parried Spell that still succeeds, may be reduced through Damage Negation.

Damage Negation cannot cause a Fully Parried or Fully Countered result and cannot trigger Riposte or Reflection.

#### Armor

Damage Negation removes Damage Dice before the damage roll.

Armor reduces the rolled damage result afterward.

#### Damage Reduction

Damage Negation removes Damage Dice before the damage roll.

Damage Reduction is a **percentage** of damage remaining after Armor. Calculate Passive DR first; add eligible Active Buff and Reaction bonuses under their own printed total-DR caps, then add Resolve Stone Ability: Damage Reduction outside those source caps. The total cannot exceed **100%**. Round the **remaining damage up** to a whole number. For example, 13 post-Armor damage at 30% DR becomes **10 damage**. The Core Attack and Defense Sequence defines the full order.

#### Phasing

Phasing ignores the entire hit.

If Phasing is used, no Damage Negation needs to be spent against that hit.

#### Absorption

Damage Negation reduces the amount of damage that may eventually remove actual HP.

Damage prevented through Damage Negation does not count as actual HP loss and cannot generate Temporary Colorless Stones through Absorption.

---

}}

\page
{{pageNumber,auto}}
{{wide

### Combat Duration

The Reserve persists from **Combat Start to Combat End**. The GM determines when an encounter truly ends; new Rounds, initiative changes, reinforcements, boss phases and changes of battlefield within the same encounter continue to draw from the same remaining Reserve. **At the start of a genuinely new Combat**, the character gains a fresh Reserve at its full listed value.
---

### Closed Premium Subsystem

**Damage Negation is a dedicated premium effect.** Its purchasable mechanical axis is removing Damage Dice before they are rolled. The dedicated Damage Negation Passive establishes the Combat Reserve; eligible supporting Stone Abilities, Active Buffs and other explicitly printed Damage Negation sources provide their own listed points and timing. Other offense, defense and action-economy effects follow their separate Power definitions.
---

}}

\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-damage-negation">
  Passive: Damage Negation
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 PP per Level.<br>
      Damage Negation is a closed premium defensive subsystem.<br>
      Combat Damage Negation = 10 PP per removable Damage Die per Combat.<br><br>

  DESIGN STRUCTURE<br>
  While this Passive is slotted, gain a Damage Negation Reserve at the beginning of each Combat.<br>
  The Reserve is shared across all eligible damage instances during that Combat.<br>
  Spending Damage Negation requires no Action, Movement, Reaction, Stone, or roll.<br><br>

  COMBAT RESERVE<br>
  The Reserve begins at its maximum at the beginning of each Combat.<br>
  It does not refresh at the beginning of a Round.<br>
  It does not refresh during new waves, reinforcements, or phases of the same encounter.<br>
  Unspent Damage Negation is lost when the Combat ends.<br><br>

  SCALING<br>
  Each Power Level grants 2 points of Damage Negation Reserve.<br>
  Each point removes 1 Damage Die from one eligible Damage Pool before it is rolled.<br><br>

  SPENDING LIMIT<br>
  Choose freely how many incoming Damage Dice to remove, from 0 to the entire Damage Pool, limited only by the available Damage Negation and the number of incoming Damage Dice.<br>
  Each removed Damage Die costs 1 Damage Negation. A Pool may be reduced to 0d8.<br><br>

  RESOLUTION<br>
  Damage Negation is used after an Attack hits or another hostile effect creates a Damage Pool, but before the Damage Dice are rolled.<br>
  It affects only the Damage Pool assigned to you.<br>
  It does not change whether the Attack hit.<br><br>

  SPECIALS AND PAYLOAD<br>
  Damage Negation removes only Damage Dice.<br>
  It does not prevent Specials, on-hit effects, forced movement, control effects, flat damage, or another non-damage payload.<br><br>

  CALCULATION<br>
  L1 target 20 PP → 2 Negation = 20 PP.<br>
  L2 target 40 PP → 4 Negation = 40 PP.<br>
  L3 target 60 PP → 6 Negation = 60 PP.<br>
  L4 target 80 PP → 8 Negation = 80 PP.<br>
  Each additional Level adds +2 Negation for another 20 PP.<br><br>

  EFFECT SCOPE<br>
  This Passive removes Damage Dice from an incoming eligible Damage Pool; other defensive axes use their own abilities.<br><br>

  NOTES<br>
  Its Combat Reserve refreshes at the beginning of each genuinely new Combat and is spent over that Combat.
</span>


  </span>
</h3>

Incoming force loses part of its destructive weight before it can fully manifest against you.

---

While this Passive is slotted, gain the listed **Damage Negation Reserve** at the beginning of each Combat.

When an eligible Damage Pool would be rolled against you, spend points from the Reserve before the damage is rolled.

Each point spent removes **1 Damage Die** from the Damage Pool assigned to you.

You may remove **any number from 0 to all assigned Damage Dice**, limited by your available Damage Negation. Removing all Damage Dice leaves **0d8**; the hit and other non-dice effects remain valid.

The Reserve does not refresh during the Combat.

All remaining Damage Negation is lost when the Combat ends.

| **Level** | **Type**                 | **Range** |     **Duration**    | **Damage Negation Reserve** |
| :-------: | :----------------------- | :-------: | :-----------------: | :-------------------------: |
|   **1**   | Passive, Damage Negation |    Self   | Until end of Combat |      **2 Damage Dice**      |
|   **2**   | Passive, Damage Negation |    Self   | Until end of Combat |      **4 Damage Dice**      |
|   **3**   | Passive, Damage Negation |    Self   | Until end of Combat |      **6 Damage Dice**     |
|   **4**   | Passive, Damage Negation |    Self   | Until end of Combat |      **8 Damage Dice**     |
|   **5**   | Passive, Damage Negation |    Self   | Until end of Combat |      **10 Damage Dice**     |
|   **6**   | Passive, Damage Negation |    Self   | Until end of Combat |      **12 Damage Dice**     |
|   **7**   | Passive, Damage Negation |    Self   | Until end of Combat |      **14 Damage Dice**     |
|   **8**   | Passive, Damage Negation |    Self   | Until end of Combat |      **16 Damage Dice**     |
|   **9**   | Passive, Damage Negation |    Self   | Until end of Combat |      **18 Damage Dice**     |
|   **10**  | Passive, Damage Negation |    Self   | Until end of Combat |      **20 Damage Dice**     |
|   **11**  | Passive, Damage Negation |    Self   | Until end of Combat |      **22 Damage Dice**     |
|   **12**  | Passive, Damage Negation |    Self   | Until end of Combat |      **24 Damage Dice**     |
|   **13**  | Passive, Damage Negation |    Self   | Until end of Combat |      **26 Damage Dice**     |
|   **14**  | Passive, Damage Negation |    Self   | Until end of Combat |      **28 Damage Dice**     |
|   **15**  | Passive, Damage Negation |    Self   | Until end of Combat |      **30 Damage Dice**     |
|   **16**  | Passive, Damage Negation |    Self   | Until end of Combat |      **32 Damage Dice**     |

---

}}

\page
{{pageNumber,auto}}
{{wide

## Offensive Passive Extensions

The following three single-category Passives are part of the 2026-10-20 playtest revision. They follow the ordinary Passive Slot limit and 20 PP per Power Level purchase curve. Each has its own Category, so a character may legally slot **Passive: Damage** together with **Passive: Armor Reduction**, for example, if sufficient Passive Slots are available. Neither Critical nor Maximization requires the corresponding Stone Ability.

---

<h3 id="passive-armor-reduction">
  Passive: Armor Reduction
  <span class="tooltip">&#9432;
    <span class="tooltiptext">
      BASELINES<br>
      Passive curve = 20 PP per Level.<br>
      Offensive Armor Reduction follows the exact numeric progression of Passive: Armor.<br>
      Pricing model = 15 PP per point, with ordinary rounding to the nearest eligible integer milestone.<br><br>
      SCALING<br>
      PL 1: ignore 1 Armor; PL 4: ignore 5 Armor; PL 8: ignore 11 Armor; PL 16: ignore 21 Armor.<br>
      APPLIES TO<br>
      Eligible damaging Attacks made by this character, including damaging Martial and Spell attacks. Evaluate each AoE target independently.<br>
      DOES NOT<br>
      Reduce listed Armor for allies, apply Corrode, create Penetration, change Attack Pools or Target Numbers, or bypass Damage Reduction.<br>
      STACKING<br>
      Add legal attacker-specific Armor Reduction from Stones and eligible Penetration; use target Corrode normally. Effective Armor cannot drop below 0.<br>
    </span>
  </span>
</h3>

Your strikes instinctively find the weak points in armor and hardened defenses.

When you make an eligible **damaging Attack**, reduce only the **Armor counted against that Attack** by the listed amount. This applies to your own melee, ranged, weapon-based, natural-weapon, and damaging Spell attacks, including legal attack-based Reactions and AoEs. For an AoE, evaluate each hit target's Armor separately. The passive never changes the defender's listed Armor and provides no reduction to another attacker.

This is **Armor Reduction**, not a Special and not an extra Damage Die. It adds to existing legal attacker-specific Armor Reduction (such as **Might Stone Ability: Armor Reduction**) and qualifying weapon **Penetration(X)**, after applicable target-side **Corrode(X)** has modified Armor. Effective Armor cannot fall below **0**. It does not alter Evade, Spell TN, Raises, Special application, Damage Reduction, or Armor-ignoring ongoing effect damage.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **1 Armor** on your own eligible damaging Attacks. |
| **2** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **3 Armor** on your own eligible damaging Attacks. |
| **3** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **4 Armor** on your own eligible damaging Attacks. |
| **4** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **5 Armor** on your own eligible damaging Attacks. |
| **5** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **7 Armor** on your own eligible damaging Attacks. |
| **6** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **8 Armor** on your own eligible damaging Attacks. |
| **7** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **9 Armor** on your own eligible damaging Attacks. |
| **8** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **11 Armor** on your own eligible damaging Attacks. |
| **9** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **12 Armor** on your own eligible damaging Attacks. |
| **10** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **13 Armor** on your own eligible damaging Attacks. |
| **11** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **15 Armor** on your own eligible damaging Attacks. |
| **12** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **16 Armor** on your own eligible damaging Attacks. |
| **13** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **17 Armor** on your own eligible damaging Attacks. |
| **14** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **19 Armor** on your own eligible damaging Attacks. |
| **15** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **20 Armor** on your own eligible damaging Attacks. |
| **16** | Passive, Armor Reduction | Self | -- | Permanent | Ignore **21 Armor** on your own eligible damaging Attacks. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-critical">
  Passive: Critical
  <span class="tooltip">&#9432;
    <span class="tooltiptext">
      BASELINES<br>
      Dedicated limited-use offensive Passive. Same PL milestones as Passive: Phasing.<br>
      PL 1-3: Unavailable. PL 4-7: 1 roll. PL 8-14: 2 rolls. PL 15-16: 3 rolls.<br>
      Nominal milestone investments: 80 / 160 / 300 PP.<br>
      TIMING<br>
      Declare BEFORE an eligible Martial Attack Roll or damaging Spell Casting Roll.<br>
      EFFECT<br>
      Critical(1): natural 7s and 8s explode on that Pool. Does NOT alter Damage Dice.<br>
      SOURCE<br>
      These are free per-Combat uses in addition to legal Stone or Active Buff Critical uses, not automatic Crit on every attack.<br>
    </span>
  </span>
</h3>

You reserve a handful of attacks for moments of perfect timing.

At the beginning of each Combat, while this Passive is slotted, gain the listed number of **free Critical roll charges**. Each charge may designate one eligible **Martial Attack Pool or damaging Spell Casting Pool** as **Critical(1)**, following the normal Critical rule: natural **7s and 8s explode**, including subsequent qualifying explosion rolls. Critical modifies the Attack/Casting Pool, **not Damage Dice**. The usual Disadvantage restrictions still apply.

Choose to spend a Passive Critical charge **before the eligible roll**. The charge is consumed when that roll is made, whether the attack hits or misses. One charge covers one complete Attack/Casting Pool, including an AoE roll with multiple targets. It grants no additional Attack, Casting Roll, Action, Reaction, or automatic success.

Passive Critical charges form a separate allowance from **Agility Stone Ability: Crit** and **Active Buff: Critical**. If more than one source is available, choose exactly **one source** for a roll. Two Critical sources do not double the explosion benefit and must not spend two uses. Unused Passive charges expire at Combat end. They never refresh at Round start.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **4** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **1 free Critical roll** for this Combat. |
| **5** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **1 free Critical roll** for this Combat. |
| **6** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **1 free Critical roll** for this Combat. |
| **7** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **1 free Critical roll** for this Combat. |
| **8** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **9** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **10** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **11** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **12** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **13** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **14** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **2 free Critical rolls** for this Combat. |
| **15** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **3 free Critical rolls** for this Combat. |
| **16** | Passive, Critical | Self | -- | Permanent | At Combat start, gain **3 free Critical rolls** for this Combat. |

---
}}
\page
{{pageNumber,auto}}
{{wide

<h3 id="passive-maximization">
  Passive: Maximization
  <span class="tooltip">&#9432;
    <span class="tooltiptext">
      BASELINES<br>
      Dedicated limited-use offensive/Healing-roll Passive. Same PL milestones as Passive: Phasing.<br>
      PL 1-3: Unavailable. PL 4-7: 1 use. PL 8-14: 2 uses. PL 15-16: 3 uses.<br>
      Nominal milestone investments: 80 / 160 / 300 PP.<br>
      TIMING<br>
      Declare immediately before one eligible Damage or Healing Roll, after Damage Negation where applicable.<br>
      EFFECT<br>
      Set each remaining d8 result in the complete roll to artificial 8. No natural-8 triggers.<br>
      SOURCE<br>
      Free per-Combat uses; separate from Vitality Stone Ability: Maximization.<br>
    </span>
  </span>
</h3>

Your finishing blows and restorative surges never waste their potential.

At the beginning of each Combat, while this Passive is slotted, gain the listed number of **free Maximization uses**. Immediately before an eligible **Damage Roll or Healing Roll**, declare one use from this shared Passive allowance. Apply the normal Maximization rule to the entire eligible roll: every remaining d8 has an **artificial result of 8**. Do not generate exploding dice, minimum-damage triggers, or other effects requiring **natural 8s**.

Build the legal Damage Pool and allow **Damage Negation before Maximization**. A Maximization use does not add dice, modify an Attack/Casting Pool, bypass Armor, modify damage sources, or grant an Action or additional roll. Eligible Rolls are precisely those eligible for the existing **Vitality Stone Ability: Maximization**, including qualifying Damage and Healing Rolls. A shared AoE Damage Roll spends one use; independently rolled Damage Pools require separate uses. If a failed attack never creates an eligible Damage Roll, no use is spent.

Passive Maximization charges are separate from **Vitality Stone Ability: Maximization** charges. They do **not** grant a Vitality Stone Ability Rank and do not require paying Stones. If both sources are available, designate one source per roll; spending two uses on the same roll provides no extra benefit and is not permitted. Unused Passive uses expire when Combat ends and never refresh during the Combat.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **2** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **3** | Unavailable | Self | -- | Permanent | No effect at this PL; unavailable for selection. |
| **4** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **1 free Maximization use** for this Combat. |
| **5** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **1 free Maximization use** for this Combat. |
| **6** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **1 free Maximization use** for this Combat. |
| **7** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **1 free Maximization use** for this Combat. |
| **8** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **9** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **10** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **11** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **12** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **13** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **14** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **2 free Maximization uses** for this Combat. |
| **15** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **3 free Maximization uses** for this Combat. |
| **16** | Passive, Maximization | Self | -- | Permanent | At Combat start, gain **3 free Maximization uses** for this Combat. |

---
}}

\page
{{pageNumber,auto}}
{{wide
##### Expanded Playtest Passives (2026-10-20)

> **Source note:** The Homebrewery file `Destroyed_Faith_Passives_Expanded_Playtest_2026-10-20.md` was not available in the workspace Downloads at import time. The six Passives below use the author-approved formulas from the implementation task. Existing Parry / Active Buff Preparation action-cost wording above is preserved.

<h3 id="passive-temporary-hp">
  Passive: Temporary HP
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Temporary HP. Amount = 5 × Power Level. Once at Combat start while slotted; no per-Turn or Preparation refresh. Distinct Temporary HP source.
    </span>
  </span>
</h3>

While slotted, at **Combat start** (before any legal combat damage), gain Temporary HP equal to **5 × Power Level**. The pool remains until depleted or Combat end. It does not heal real HP, restore Scarred Bars, or trigger Absorption. Distinct from Active Buff Temporary HP, Vitality Stone Temporary HP, Artifact buffers and Reaction Temporary HP. Refreshing an Active Buff never refills this Passive pool.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **5 Temporary HP**. |
| **2** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **10 Temporary HP**. |
| **3** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **15 Temporary HP**. |
| **4** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **20 Temporary HP**. |
| **5** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **25 Temporary HP**. |
| **6** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **30 Temporary HP**. |
| **7** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **35 Temporary HP**. |
| **8** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **40 Temporary HP**. |
| **9** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **45 Temporary HP**. |
| **10** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **50 Temporary HP**. |
| **11** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **55 Temporary HP**. |
| **12** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **60 Temporary HP**. |
| **13** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **65 Temporary HP**. |
| **14** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **70 Temporary HP**. |
| **15** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **75 Temporary HP**. |
| **16** | Passive, Temporary HP | Self | — | Permanent | At Combat start, gain **80 Temporary HP**. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-enemy-evade-reduction">
  Passive: Enemy Evade Reduction
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Enemy Evade Reduction. Amount = ceil(PL / 2). Owner's Martial Attack Rolls only; per AoE target. Never Spell Final TN.
    </span>
  </span>
</h3>

Against your own eligible **Martial Attack Rolls**, reduce the targeted enemy's effective Evade by **ceil(Power Level / 2)** (minimum 0). Includes Martial AoEs (per target) and Martial Reaction attacks that use a Martial Attack Roll. Does not modify stored Evade, create Expose(X), add Attack Dice, or change Spell Final TN.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1**–**2** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **1** vs your Martial Attack Rolls. |
| **3**–**4** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **2** vs your Martial Attack Rolls. |
| **5**–**6** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **3** vs your Martial Attack Rolls. |
| **7**–**8** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **4** vs your Martial Attack Rolls. |
| **9**–**10** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **5** vs your Martial Attack Rolls. |
| **11**–**12** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **6** vs your Martial Attack Rolls. |
| **13**–**14** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **7** vs your Martial Attack Rolls. |
| **15**–**16** | Passive, Enemy Evade Reduction | Self | — | Permanent | Reduce target Evade by **8** vs your Martial Attack Rolls. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-self-cleanse">
  Passive: Self Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Self Cleanse. Cleanse(ceil(PL/2)) once at start of each own Turn after Tick + Natural Recovery + Diminishing Decay; before Persistent Zones.
    </span>
  </span>
</h3>

At the start of each of your Turns — after Special Ticks, Natural Special Recovery and Diminishing Decay, and before Persistent Zone start-of-Turn applications — gain an additional **Cleanse(ceil(PL / 2))** on yourself. This is **additional** to Natural Special Recovery. Freely distribute among eligible negative Specials (including Cleanse-eligible Root). Does not heal HP or cost an Action.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1**–**2** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(1)**. |
| **3**–**4** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(2)**. |
| **5**–**6** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(3)**. |
| **7**–**8** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(4)**. |
| **9**–**10** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(5)**. |
| **11**–**12** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(6)**. |
| **13**–**14** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(7)**. |
| **15**–**16** | Passive, Self Cleanse | Self | — | Permanent | Start of Turn: **Cleanse(8)**. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-speed">
  Passive: Speed
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Speed. +PL meters to the Speed statistic once. Dash doubles the increased Speed. Movement Enhancement after Movement Action distance.
    </span>
  </span>
</h3>

Increase your normal Speed by **+Power Level meters**. Applied once to the Speed statistic. Dash doubles the increased Speed. Stone Movement Enhancement is added once after calculating the Movement Action distance (including Dash). Slow, Root, Immovable and other restrictions apply normally; minimum effective Speed 0.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Passive, Speed | Self | — | Permanent | Gain **+1 m** Speed. |
| **2** | Passive, Speed | Self | — | Permanent | Gain **+2 m** Speed. |
| **3** | Passive, Speed | Self | — | Permanent | Gain **+3 m** Speed. |
| **4** | Passive, Speed | Self | — | Permanent | Gain **+4 m** Speed. |
| **5** | Passive, Speed | Self | — | Permanent | Gain **+5 m** Speed. |
| **6** | Passive, Speed | Self | — | Permanent | Gain **+6 m** Speed. |
| **7** | Passive, Speed | Self | — | Permanent | Gain **+7 m** Speed. |
| **8** | Passive, Speed | Self | — | Permanent | Gain **+8 m** Speed. |
| **9** | Passive, Speed | Self | — | Permanent | Gain **+9 m** Speed. |
| **10** | Passive, Speed | Self | — | Permanent | Gain **+10 m** Speed. |
| **11** | Passive, Speed | Self | — | Permanent | Gain **+11 m** Speed. |
| **12** | Passive, Speed | Self | — | Permanent | Gain **+12 m** Speed. |
| **13** | Passive, Speed | Self | — | Permanent | Gain **+13 m** Speed. |
| **14** | Passive, Speed | Self | — | Permanent | Gain **+14 m** Speed. |
| **15** | Passive, Speed | Self | — | Permanent | Gain **+15 m** Speed. |
| **16** | Passive, Speed | Self | — | Permanent | Gain **+16 m** Speed. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-spell-resistance-piercing">
  Passive: Spell Resistance Piercing
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Spell Resistance Piercing. Ignore ceil(PL/2) SR vs owner's Spells. Never reduces Spell Base TN. AoE: shared Casting Roll, per-target Final TN.
    </span>
  </span>
</h3>

When you cast a Spell, ignore **ceil(Power Level / 2)** of each target's Spell Resistance against that Spell. Remaining SR = max(0, target SR − piercing). Final Spell TN = Spell Base TN + remaining SR. Does not reduce Spell Base TN, stored SR, Evade, or SR against other casters. Spell AoEs keep one shared Casting Roll with per-target Final TN.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1**–**2** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **1** Spell Resistance. |
| **3**–**4** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **2** Spell Resistance. |
| **5**–**6** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **3** Spell Resistance. |
| **7**–**8** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **4** Spell Resistance. |
| **9**–**10** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **5** Spell Resistance. |
| **11**–**12** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **6** Spell Resistance. |
| **13**–**14** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **7** Spell Resistance. |
| **15**–**16** | Passive, Spell Resistance Piercing | Self | — | Permanent | Ignore **8** Spell Resistance. |

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="passive-special-amplification">
  Passive: Special Amplification
  <span class="tooltip">🛈
    <span class="tooltiptext">
      Category: Special Amplification. +ceil(PL/4) to eligible numeric Special(X) you deliver. Pipeline: printed → Raise Special Increase → Stone Special Boost → this Passive → Vulnerability → Special Negation → 4×MR limit. Distinct from Special Aura.
    </span>
  </span>
</h3>

When your qualifying successful Martial or Spell Attack delivers an eligible numeric **Special(X)**, increase that Special by **ceil(Power Level / 4)** after printed X, successful Raise Special Increase and Intellect Stone Special Boost, and before target Vulnerability, Special Negation and the 4 × Mastery Rank application limit. Does not create Specials, amplify aura ticks, ongoing damage, ally or independent Summon attacks, binary Specials or hard control. Narrow exception to the default Passive prohibition on independently applying new Specials.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1**–**4** | Passive, Special Amplification | Self | — | Permanent | Delivered eligible Special(X) gains **+1**. |
| **5**–**8** | Passive, Special Amplification | Self | — | Permanent | Delivered eligible Special(X) gains **+2**. |
| **9**–**12** | Passive, Special Amplification | Self | — | Permanent | Delivered eligible Special(X) gains **+3**. |
| **13**–**16** | Passive, Special Amplification | Self | — | Permanent | Delivered eligible Special(X) gains **+4**. |

---
}}
