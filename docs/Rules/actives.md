{{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Actives
</div>

}}


![Eron](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/NPC%27s/NPC/eronFull.png)  {position:absolute,top:50px,right:55px,width:700px}


![The mirror](https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/LogosBanners/Destroyed%20Faith%20Banner%20Beige.png)  {position:absolute,top:0px,right:55px,width:700px}



<!-- LIMITED POWER MODIFIER: Only Instant damaging Active Powers with purchased printed Power Damage Dice may be learned as Limited. Special-only Powers and other nondamaging effects are never Limited. Uses per Safe Haven Rest = ceil(PL/2); double only printed Power Damage Dice once per use, never Special(X) or weapon dice. See Core. -->
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
Destroyed Faith — DF Core Actives
Version: v0.9.9.5 (2026-10-15)
}}

}}
\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Active Delivery and Technical Identity}}{{ 4}}](#p4)
- #### [{{ Persistent Diminishing Zones}}{{ 4}}](#p4)
- #### [{{ Pure Forced-Movement Actives}}{{ 10}}](#p10)
- #### [{{ Support Actives: Healing, Cleanse & Restoration}}{{ 12}}](#p12)
- #### [{{ Healing Actives}}{{ 14}}](#p14)
- #### [{{ Restoration Actives}}{{ 18}}](#p18)
- #### [{{ Cleanse Actives}}{{ 20}}](#p20)
- #### [{{ Active Constructs and Terrain}}{{ 24}}](#p24)
- #### [{{ Barrier Actives}}{{ 31}}](#p31)
- #### [{{ Illusion Fields and Power Images}}{{ 32}}](#p32)
- #### [{{ Core Attack Power Templates}}{{ 36}}](#p36)
- #### [{{ Mental Powers}}{{ 51}}](#p51)
- #### [{ Pure Instant Special Powers}{ 60 }](#p60)
- #### [{{ Damage Transfer Actives}}{{ 118 }}](#p118)

}}
\page

{{pageNumber,auto}}
{{wide
### Active Delivery and Technical Identity

**Approved Power Point exceptions (16 October 2026):** Melee AoE Heal and Ranged AoE Heal at PL 1 each cost **40 PP against the 30 PP target** (+10 PP). Approved Persistent Zone: Expose and Ranged Barrier exceptions likewise retain their printed Power Points. These are intentional approved values.


Every catalogue entry uses a canonical Technical Power Name. Slash-separated
Special alternatives require the player to **choose one** when learning the Power.
That choice becomes part of the Power's technical identity and does not change later.

An otherwise legal **Ranged Active** can use either Martial or Spell delivery
under the Core Rules. This choice does **not** create a second selectable Power
or circumvent the named Power use limit. Self and Melee entries remain Martial
unless an exact rule allows another delivery.

Ranged entries use their Martial baseline. For Spell delivery:

1. A printed Ranged/Thrown Weapon requirement is Martial-only. The Spell version
   uses normal Spell delivery and does not require the weapon.
2. Attack Pool / Attack Roll becomes **Casting Pool / Casting Roll**.
3. Evade becomes **Final Spell TN** for directly affected creatures.
4. Baseline Weapon Damage is **not** copied into the Spell; printed purchased
   Damage, Specials, Range, AoE, target structure and duration are unchanged.
5. Spell Focus applies normally only to an otherwise damaging Spell.
6. Defenses requiring a Martial Attack or explicitly altering Evade do not
   automatically apply to the Spell version. Dive for Cover remains available
   against legal Spell AoEs with a shared Casting Roll.
7. A Spell always makes a Casting Roll. Creation/placement that affects no
   creature directly uses the caster's **Spell Base TN**; direct effects use
   the normal Final Spell TN and resistance rules.

The Core's rules for Special-less Spell Powers apply unchanged.

---
:
## Ranged Persistent Special Zones

> **Design Rule:** These Powers are **Ranged Persistent AoE Zones**.  
> They create an ongoing area within range that applies a numeric Special to affected creatures.  
> These Powers are not self-centered, because the zone remains in place and may continue affecting the battlefield.

---
:
### Persistent Zone Rules

**Minimum Power Level: 3.** Levels 1–2 grant no effect and cannot be purchased or used. Level 3+ costs and effects are unchanged.

A Persistent Zone is created at a target point within the Power's printed Range.

The zone lasts for the listed Duration.

Persistent Special Zones do not make attack rolls and do not deal damage unless the Power explicitly says so.

When a creature is affected by the zone, it receives the listed Special value automatically.

A creature is affected by the zone when:
- the zone appears and the creature is inside it,
- the creature enters the zone for the first time on a Round,
- or the creature starts its turn inside the zone.

A creature has at most **one application attempt from each specific Persistent Zone per Round**. Mark that zone/creature pair as attempted when the zone appears around the creature, the creature first enters during the Round, or the creature begins its Turn inside. The attempt counts even if a Spell-delivered zone is **resisted**. A successful attempt applies the listed payload once; additional contacts during that Round do not repeat the attempt. At the start of a creature's Turn, resolve **existing Special Ticks, Natural Special Recovery, Decay, Root recovery and other start-of-turn healing/refresh effects first**, then perform that Turn's Persistent Zone attempt. New Special stacks received now begin ticking at the next eligible Turn start.


---
:
### Spell Delivery for Persistent Zones

If a **Ranged Persistent Zone** uses Spell delivery:

1. Make **one Casting Roll** when the zone is created and record the final result.
2. The roll must reach the caster's **Spell Base TN** for the zone to be created. If it does not, the Spell fizzles and the zone is not created. There is no additional penalty.
3. If the zone is created, keep the recorded Casting result for the zone's full Duration.
4. Whenever a creature would become affected by the zone, compare the recorded Casting result against that creature's **current Final Spell TN**.
5. If the result reaches that Final Spell TN, the creature receives the zone's full printed Special or other creature-facing payload.
6. If it does not, that creature resists that application. The zone remains in place and no new Casting Roll occurs.
7. This comparison is the creature's **one application attempt from that particular zone this Round**, regardless of success or resistance.

This preserves the zone as one cast while allowing Spell Resistance to matter for creatures that enter later or whose resistance changes during the zone's Duration.

---
:
### Duration Cost Rule

Persistent Zones use a Duration Multiplier.

For these templates, Duration is fixed at **4 Rounds**. The Round in which a Persistent Zone is created counts as **Round 1**; it becomes active immediately and expires at the **end of its creator's Turn in Round 4**. The same duration counting applies to created Barriers and Walls with a printed four-Round duration. A zone created around occupied spaces attempts its immediate application on creation.

| **Duration** | **Multiplier** |
|---|:--:|
| **4 Rounds** | **×2** |

---
:
### Persistent Zone Cost Formula

**Final Cost = Range Cost + [(Radius Cost + AoE Special Cost) × Duration Multiplier]**

Range is paid normally and is not multiplied.

The persistent part of the Power is multiplied:
- Radius
- Special payload
- Any other ongoing payload

---
:
### AoE Special Cost Rule

For these persistent zone templates, AoE Special payloads are priced at the next Special step above their printed value. Blight uses the same zone-delivery cost progression but remains a Timed Special, not a Diminishing Special.

**AoE Special(X) = Base Cost × T(X+1)**  
**T(X) = X × (X + 1) / 2**

}}
\page

{{pageNumber,auto}}
{{wide
### Scaling Integrity Rule

Range, Radius, and Special value may stay the same or increase, but they may never decrease.

If increasing Radius would force the Special value to drop, the Radius increase is delayed.

If increasing Special value would force Radius to drop, the Special increase is delayed.

Damage is omitted from these templates.


### Example — Persistent Zone Timing

A caster creates a persistent poison zone.

The zone lasts **4 Rounds**.

The zone does not make attack rolls.  
A creature affected by the zone automatically gains the listed Special.

A creature is affected when:

- it is inside the zone when the zone appears,
- it enters the zone for the first time on a Round,
- or it starts its turn inside the zone.

A creature can only be affected by the same zone **once per Round**.

Example:

A creature starts its turn inside the zone and gains the zone's Special.  
Later in the same Round, it leaves and re-enters the same zone.

It does not gain the Special again, because it has already been affected by that zone this Round.

}}
\page

{{pageNumber,auto}}
{{wide

## Ranged Persistent Special Zone: Blight

---
:
<h3 id="ranged-persistent-zone-blight">
  Ranged Persistent Special Zone: Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Persistent Zone uses printed Range and Radius<br>
      Duration = 4 Rounds<br>
      Duration Multiplier = ×2<br>
      Range is not multiplied<br>
      Special base cost = 3 PP<br>
      AoE Special Cost = 3 × T(X+1)<br><br>
      SPECIALS<br>
      Blight<br><br>
      AOE Blight COSTS<br>
      Blight(1) = 9 PP<br>
      Blight(2) = 18 PP<br>
      Blight(3) = 30 PP<br>
      Blight(4) = 45 PP<br>
      Blight(5) = 63 PP<br>
      Blight(6) = 84 PP<br>
      Blight(7) = 108 PP<br>
      Blight(8) = 135 PP<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br>
      Radius 5 m = 140 PP<br>
      Radius 6 m = 200 PP<br><br>
      SCALING RULE<br>
      This is a Blight-first Persistent Zone.<br>
      Blight grants Disadvantage on all Attribute-based dice pools for X of the affected creature's Turns; reapplications refresh duration instead of stacking.<br>
      The zone lasts 4 Rounds.<br>
      Range, Radius, and Blight may stay the same or increase, but they may never decrease.<br>
      Damage is omitted because the persistent Special is the payload.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: not enough budget for a 4-Round zone<br>
      L2 → Target 60 PP: not enough budget for a 4-Round zone<br>
      L3 → Target 90 PP: Range 16 m (10) + [(Radius 2 m (20) + Blight(2) (18)) ×2] = 86 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + [(Radius 2 m (20) + Blight(3) (30)) ×2] = 115 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + [(Radius 2 m (20) + Blight(4) (45)) ×2] = 150 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + [(Radius 2 m (20) + Blight(4) (45)) ×2] = 155 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + [(Radius 2 m (20) + Blight(5) (63)) ×2] = 196 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + [(Radius 2 m (20) + Blight(5) (63)) ×2] = 201 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + [(Radius 3 m (50) + Blight(5) (63)) ×2] = 266 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + [(Radius 3 m (50) + Blight(5) (63)) ×2] = 271 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + [(Radius 3 m (50) + Blight(6) (84)) ×2] = 318 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + [(Radius 3 m (50) + Blight(6) (84)) ×2] = 323 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + [(Radius 3 m (50) + Blight(7) (108)) ×2] = 376 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + [(Radius 3 m (50) + Blight(7) (108)) ×2] = 381 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + [(Radius 3 m (50) + Blight(8) (135)) ×2] = 440 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + [(Radius 3 m (50) + Blight(8) (135)) ×2] = 445 PP<br><br>
      NOTES<br>
      This template begins functioning at Level 3 because a 4-Round persistent zone is expensive.<br>
      Radius remains conservative because the zone lasts for multiple Rounds.
    </span>
  </span>
</h3>

A ranged persistent pestilence cloud that remains on the battlefield for 4 Rounds. Affected creatures receive timed Blight (Disadvantage on all Attribute-based dice pools); X is the number of their Turns it lasts after application. The cloud can refresh Blight, but repeated applications do not add durations.

---
:
**Requirement:** None

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **2** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(2)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(3)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(4)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(4)**. |
| **7** | Active | 32 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(5)**. |
| **8** | Active | 36 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(5)**. |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(5)**. |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(5)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(6)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(6)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(7)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(7)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(8)**. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Blight(8)**. |

}}
\page

{{pageNumber,auto}}
{{wide

## Ranged Persistent Special Zone: Lacerate / Mark / Ruin / Slow

---
:
<h3 id="ranged-persistent-zone-standard-diminishing-special">
  Ranged Persistent Special Zone: Lacerate / Mark / Ruin / Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Persistent Zone uses printed Range and Radius<br>
      Duration = 4 Rounds<br>
      Duration Multiplier = ×2<br>
      Range is not multiplied<br>
      Special base cost = 4 PP<br>
      AoE Special Cost = 4 × T(X+1)<br><br>
      SPECIALS<br>
      Lacerate / Mark / Ruin / Slow<br><br>
      AOE SPECIAL COSTS<br>
      Special(1) = 12 PP<br>
      Special(2) = 24 PP<br>
      Special(3) = 40 PP<br>
      Special(4) = 60 PP<br>
      Special(5) = 84 PP<br>
      Special(6) = 112 PP<br>
      Special(7) = 144 PP<br>
      Special(8) = 180 PP<br><br>
      SCALING RULE<br>
      This is a persistent Standard Special Zone.<br>
      Lacerate, Mark, Ruin, and Slow are the primary scaling axis.<br>
      Range is paid once and is not multiplied by duration.<br>
      Radius and Special are multiplied by the 4-Round duration multiplier.<br>
      Radius and Special may stay the same or increase, but they may never decrease.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: not enough budget for a 4-Round zone<br>
      L2 → Target 60 PP: not enough budget for a 4-Round zone<br>
      L3 → Target 90 PP: Range 16 m (10) + [(Radius 2 m (20) + Special(1) (12)) ×2] = 74 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + [(Radius 2 m (20) + Special(2) (24)) ×2] = 103 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + [(Radius 2 m (20) + Special(3) (40)) ×2] = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + [(Radius 2 m (20) + Special(3) (40)) ×2] = 145 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + [(Radius 3 m (50) + Special(3) (40)) ×2] = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + [(Radius 3 m (50) + Special(3) (40)) ×2] = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + [(Radius 3 m (50) + Special(4) (60)) ×2] = 260 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + [(Radius 3 m (50) + Special(4) (60)) ×2] = 265 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + [(Radius 3 m (50) + Special(5) (84)) ×2] = 318 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + [(Radius 3 m (50) + Special(5) (84)) ×2] = 323 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + [(Radius 3 m (50) + Special(6) (112)) ×2] = 384 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + [(Radius 3 m (50) + Special(6) (112)) ×2] = 389 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + [(Radius 3 m (50) + Special(6) (112)) ×2] = 394 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + [(Radius 4 m (90) + Special(6) (112)) ×2] = 479 PP<br><br>
      NOTES<br>
      Covers persistent wound fields, slowing terrain, ruin zones, or marking fields.<br>
      Radius 4 m is reached only at Level 16 because the 4-Round duration heavily taxes the budget.
    </span>
  </span>
</h3>

A ranged persistent area that applies a standard Diminishing Special for 4 Rounds.  
This template covers Lacerate, Mark, Ruin, and Slow.

---
:
**Requirement:** None

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **2** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(1) / Slow(1) / Ruin(1) / Mark(1)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(2) / Slow(2) / Ruin(2) / Mark(2)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)**. |
| **7** | Active | 32 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)**. |
| **8** | Active | 36 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)**. |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)**. |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)**. |
| **16** | Active | 68 m | Radius 4 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)**. |

}}
\page

{{pageNumber,auto}}
{{wide

## Ranged Persistent Special Zone: Challenge / Corrode / Hex / Sundered

---
:
<h3 id="ranged-persistent-zone-heavy-diminishing-special">
  Ranged Persistent Special Zone: Challenge / Corrode / Hex / Sundered
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Persistent Zone uses printed Range and Radius<br>
      Duration = 4 Rounds<br>
      Duration Multiplier = ×2<br>
      Range is not multiplied<br>
      Special base cost = 6 PP<br>
      AoE Special Cost = 6 × T(X+1)<br><br>
      SPECIALS<br>
      Challenge / Corrode / Hex / Sundered<br><br>
      AOE SPECIAL COSTS<br>
      Special(1) = 18 PP<br>
      Special(2) = 36 PP<br>
      Special(3) = 60 PP<br>
      Special(4) = 90 PP<br>
      Special(5) = 126 PP<br><br>
      CALCULATION — CORRODE / HEX / SUNDERED<br>
      L1 → Target 30 PP: not enough budget for a 4-Round zone<br>
      L2 → Target 60 PP: not enough budget for a 4-Round zone<br>
      L3 → Target 90 PP: Range 16 m (10) + [(Radius 2 m (20) + Special(1) (18)) ×2] = 86 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + [(Radius 2 m (20) + Special(1) (18)) ×2] = 91 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + [(Radius 2 m (20) + Special(2) (36)) ×2] = 132 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + [(Radius 2 m (20) + Special(2) (36)) ×2] = 137 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + [(Radius 3 m (50) + Special(2) (36)) ×2] = 202 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + [(Radius 3 m (50) + Special(2) (36)) ×2] = 207 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + [(Radius 3 m (50) + Special(3) (60)) ×2] = 260 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + [(Radius 3 m (50) + Special(3) (60)) ×2] = 265 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + [(Radius 3 m (50) + Special(4) (90)) ×2] = 330 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + [(Radius 3 m (50) + Special(4) (90)) ×2] = 335 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + [(Radius 3 m (50) + Special(4) (90)) ×2] = 340 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + [(Radius 3 m (50) + Special(5) (126)) ×2] = 417 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + [(Radius 3 m (50) + Special(5) (126)) ×2] = 422 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + [(Radius 3 m (50) + Special(5) (126)) ×2] = 427 PP<br><br>
      CHALLENGE<br>
      Challenge uses the exact compressed values printed in the table and the dedicated pool-reduction pricing defined for Challenge.<br><br>
      NOTES<br>
      Heavy Specials stay intentionally narrow and low-value when converted into 4-Round zones.<br>
      Radius stays at 3 m at high levels because the heavy Special payload and duration consume most of the budget.
    </span>
  </span>
</h3>

A ranged persistent area that applies Challenge, Corrode, Hex, or Sundered for 4 Rounds.

---
:
**Requirement:** None

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **2** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **7** | Active | 32 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **8** | Active | 36 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(3) / Hex(3) / Sundered(3)**. |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(3) / Hex(3) / Sundered(3)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(5) / Hex(5) / Sundered(5)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(5) / Hex(5) / Sundered(5)**. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(5) / Hex(5) / Sundered(5)**. |

}}
\page

{{pageNumber,auto}}
{{wide
## Ranged Persistent Special Zone: Disoriented / Expose / Soulburn / Weaken

<h3 id="ranged-persistent-zone-pool-reduction-special">
  Ranged Persistent Special Zone: Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Range progression = +4 m per level; +5 PP per step after 8 m<br>
      Duration = 4 Rounds; persistent payload multiplier ×2<br>
      Expose AoE Special(X) = 8 × T(X+1)<br>
      Disoriented / Soulburn / Weaken AoE Cost = 8 × T(2) at X1; at X 2+, use 8 × T(2X + 1)<br><br>
      VALID SPECIALS<br>
      Disoriented(X), Expose(X), Soulburn(X), Weaken(X).<br><br>
      CALCULATION — EXPOSE<br>
      L3 → Target 90 PP: Range 16 m (10) + [(Radius 2 m (20) + Special(1) (24)) ×2] = 98 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + [(Radius 2 m (20) + Special(1) (24)) ×2] = 103 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + [(Radius 2 m (20) + Special(2) (48)) ×2] = 156 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + [(Radius 2 m (20) + Special(2) (48)) ×2] = 161 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + [(Radius 2 m (20) + Special(2) (48)) ×2] = 166 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + [(Radius 2 m (20) + Special(2) (48)) ×2] = 171 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + [(Radius 2 m (20) + Special(3) (80)) ×2] = 240 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + [(Radius 2 m (20) + Special(3) (80)) ×2] = 245 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + [(Radius 3 m (50) + Special(3) (80)) ×2] = 310 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + [(Radius 3 m (50) + Special(3) (80)) ×2] = 315 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + [(Radius 3 m (50) + Special(3) (80)) ×2] = 320 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + [(Radius 3 m (50) + Special(4) (120)) ×2] = 405 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + [(Radius 3 m (50) + Special(4) (120)) ×2] = 410 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + [(Radius 3 m (50) + Special(4) (120)) ×2] = 415 PP<br><br>
      POOL-REDUCTION VARIANTS<br>
      Disoriented, Soulburn, and Weaken use the exact compressed values printed in the table and the dedicated pool-reduction pricing defined for those Specials.<br><br>
      NOTES<br>
      Levels 1–2 have no version because a legal persistent zone with these Specials does not fit the curve cleanly.<br>
      The zone applies the full printed value whenever a creature becomes affected under the Persistent Zone rules.
    </span>
  </span>
</h3>

A persistent battlefield zone that weakens perception, defense, physical performance, or spiritual performance.

**Approved design exception (16 October 2026):** The **Expose** version of this Persistent Special Zone is legal at **PL 3: 98 PP versus 90 PP target (+8 PP)** and **PL 5: 156 PP versus 150 PP target (+6 PP)**. Both printed tiers remain selectable and unchanged. The PL 3 exception is individually approved, not an automatic tolerance for every Power at that level. Other variants and levels follow their printed curves.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **2** | Unavailable | — | — | — | Requires Power Level 3. | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(2) / Soulburn(1) / Weaken(1)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(2) / Soulburn(1) / Weaken(1)**. |
| **7** | Active | 32 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(2) / Soulburn(1) / Weaken(1)**. |
| **8** | Active | 36 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(2) / Soulburn(1) / Weaken(1)**. |
| **9** | Active | 40 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(3) / Soulburn(1) / Weaken(1)**. |
| **10** | Active | 44 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(3) / Soulburn(1) / Weaken(1)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(3) / Soulburn(1) / Weaken(1)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(3) / Soulburn(1) / Weaken(1)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(3) / Soulburn(1) / Weaken(1)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(4) / Soulburn(2) / Weaken(2)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(4) / Soulburn(2) / Weaken(2)**. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(4) / Soulburn(2) / Weaken(2)**. |

---
}}

\page
{{pageNumber,auto}}
{{wide
## Pure Forced-Movement Actives

The powers in this section purchase **one control effect only**: Push or Pull.
These are control Powers, not additional weapon attacks. An Attack Roll or Casting Roll is used only to determine whether the forced movement succeeds.
These powers deal **no additional Power damage**, do not apply another Special,
and never combine Push with Prone, Pull with Disarm, or another control rider.

**Pricing:** Push and Pull cost **30 PP per 2 m**. Ranged delivery also pays for
Range under the ordinary Active pricing rule. Choose Push **or** Pull when the
Power is learned; do not gain both effects from one activation.

**Resolution:** Melee and ranged Martial versions use their corresponding Attack Roll.
Ranged Spell versions use the Casting Roll against the target's Final Spell TN.
On a failure, the target is not moved. On success, apply the listed distance.

**Scope:** These are pure Control Powers. Prone, Disarm, Stunned and mixtures
of several control effects are not separately selectable through this beta catalogue.

---
}}
\page

{{pageNumber,auto}}
{{wide
<h3 id="melee-push-pull">
  Melee Push / Pull
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      Forced Movement cost = 30 PP per 2 m<br>
      No Damage is purchased: this is a pure forced-movement Power.<br><br>
      FORCED MOVEMENT COSTS<br>
      Push/Pull 2 m = 30 PP<br>
      Push/Pull 4 m = 60 PP<br>
      Push/Pull 6 m = 90 PP<br>
      Push/Pull 8 m = 120 PP<br>
      Push/Pull 10 m = 150 PP<br>
      Push/Pull 12 m = 180 PP<br>
      Push/Pull 14 m = 210 PP<br>
      Push/Pull 16 m = 240 PP<br>
      Push/Pull 18 m = 270 PP<br>
      Push/Pull 20 m = 300 PP<br>
      Push/Pull 22 m = 330 PP<br>
      Push/Pull 24 m = 360 PP<br>
      Push/Pull 26 m = 390 PP<br>
      Push/Pull 28 m = 420 PP<br>
      Push/Pull 30 m = 450 PP<br>
      Push/Pull 32 m = 480 PP<br><br>
      SCALING RULE<br>
      This is a Control-first Martial Active.<br>
      Push/Pull distance is the primary scaling axis.<br>
      Damage is omitted because adding damage would either overfill early levels or distort the clean distance curve.<br>
      Push/Pull distance may stay the same or increase, but it may never decrease.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Push/Pull 2 m (30) + Damage — (0) = 30 PP<br>
      L2 → Target 60 PP: Push/Pull 4 m (60) + Damage — (0) = 60 PP<br>
      L3 → Target 90 PP: Push/Pull 6 m (90) + Damage — (0) = 90 PP<br>
      L4 → Target 120 PP: Push/Pull 8 m (120) + Damage — (0) = 120 PP<br>
      L5 → Target 150 PP: Push/Pull 10 m (150) + Damage — (0) = 150 PP<br>
      L6 → Target 180 PP: Push/Pull 12 m (180) + Damage — (0) = 180 PP<br>
      L7 → Target 210 PP: Push/Pull 14 m (210) + Damage — (0) = 210 PP<br>
      L8 → Target 240 PP: Push/Pull 16 m (240) + Damage — (0) = 240 PP<br>
      L9 → Target 270 PP: Push/Pull 18 m (270) + Damage — (0) = 270 PP<br>
      L10 → Target 300 PP: Push/Pull 20 m (300) + Damage — (0) = 300 PP<br>
      L11 → Target 330 PP: Push/Pull 22 m (330) + Damage — (0) = 330 PP<br>
      L12 → Target 360 PP: Push/Pull 24 m (360) + Damage — (0) = 360 PP<br>
      L13 → Target 390 PP: Push/Pull 26 m (390) + Damage — (0) = 390 PP<br>
      L14 → Target 420 PP: Push/Pull 28 m (420) + Damage — (0) = 420 PP<br>
      L15 → Target 450 PP: Push/Pull 30 m (450) + Damage — (0) = 450 PP<br>
      L16 → Target 480 PP: Push/Pull 32 m (480) + Damage — (0) = 480 PP<br><br>
      NOTES<br>
      Push and Pull use the same cost structure.<br>
      This template intentionally has no damage rider.<br>
      The Power is purely about forced movement and battlefield positioning.
    </span>
  </span>
</h3>

A close-range martial control technique that forces the target away from you or draws it toward you.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | No damage. | **Push 2 m / Pull 2 m** |
| **2** | Active | Melee Reach | — | Instant | No damage. | **Push 4 m / Pull 4 m** |
| **3** | Active | Melee Reach | — | Instant | No damage. | **Push 6 m / Pull 6 m** |
| **4** | Active | Melee Reach | — | Instant | No damage. | **Push 8 m / Pull 8 m** |
| **5** | Active | Melee Reach | — | Instant | No damage. | **Push 10 m / Pull 10 m** |
| **6** | Active | Melee Reach | — | Instant | No damage. | **Push 12 m / Pull 12 m** |
| **7** | Active | Melee Reach | — | Instant | No damage. | **Push 14 m / Pull 14 m** |
| **8** | Active | Melee Reach | — | Instant | No damage. | **Push 16 m / Pull 16 m** |
| **9** | Active | Melee Reach | — | Instant | No damage. | **Push 18 m / Pull 18 m** |
| **10** | Active | Melee Reach | — | Instant | No damage. | **Push 20 m / Pull 20 m** |
| **11** | Active | Melee Reach | — | Instant | No damage. | **Push 22 m / Pull 22 m** |
| **12** | Active | Melee Reach | — | Instant | No damage. | **Push 24 m / Pull 24 m** |
| **13** | Active | Melee Reach | — | Instant | No damage. | **Push 26 m / Pull 26 m** |
| **14** | Active | Melee Reach | — | Instant | No damage. | **Push 28 m / Pull 28 m** |
| **15** | Active | Melee Reach | — | Instant | No damage. | **Push 30 m / Pull 30 m** |
| **16** | Active | Melee Reach | — | Instant | No damage. | **Push 32 m / Pull 32 m** |

---
:
<h3 id="ranged-push-pull">
  Ranged Push / Pull
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Forced Movement cost = 30 PP per 2 m<br>
      No Damage is purchased: Range and forced movement use the PP budget.<br><br>
      RANGE COSTS<br>
      8 m = 0 PP<br>
      12 m = 5 PP<br>
      16 m = 10 PP<br>
      20 m = 15 PP<br>
      24 m = 20 PP<br>
      28 m = 25 PP<br>
      32 m = 30 PP<br>
      36 m = 35 PP<br>
      40 m = 40 PP<br>
      44 m = 45 PP<br>
      48 m = 50 PP<br>
      52 m = 55 PP<br>
      56 m = 60 PP<br>
      60 m = 65 PP<br>
      64 m = 70 PP<br>
      68 m = 75 PP<br><br>
      FORCED MOVEMENT COSTS<br>
      Push/Pull 2 m = 30 PP<br>
      Push/Pull 4 m = 60 PP<br>
      Push/Pull 6 m = 90 PP<br>
      Push/Pull 8 m = 120 PP<br>
      Push/Pull 10 m = 150 PP<br>
      Push/Pull 12 m = 180 PP<br>
      Push/Pull 14 m = 210 PP<br>
      Push/Pull 16 m = 240 PP<br>
      Push/Pull 18 m = 270 PP<br>
      Push/Pull 20 m = 300 PP<br>
      Push/Pull 22 m = 330 PP<br>
      Push/Pull 24 m = 360 PP<br>
      Push/Pull 26 m = 390 PP<br><br>
      SCALING RULE<br>
      This is a Control-first Ranged Active shown with Martial delivery.<br>
      Range is paid as a fixed cost each level.<br>
      Push/Pull distance is the primary scaling axis after Range.<br>
      Damage is omitted because adding damage would make the forced movement progression uneven.<br>
      Push/Pull distance may stay the same or increase, but it may never decrease.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Push/Pull 2 m (30) + Damage — (0) = 30 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Push/Pull 2 m (30) + Damage — (0) = 35 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Push/Pull 4 m (60) + Damage — (0) = 70 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Push/Pull 6 m (90) + Damage — (0) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Push/Pull 8 m (120) + Damage — (0) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Push/Pull 10 m (150) + Damage — (0) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Push/Pull 12 m (180) + Damage — (0) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Push/Pull 12 m (180) + Damage — (0) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Push/Pull 14 m (210) + Damage — (0) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Push/Pull 16 m (240) + Damage — (0) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Push/Pull 18 m (270) + Damage — (0) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Push/Pull 20 m (300) + Damage — (0) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Push/Pull 22 m (330) + Damage — (0) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Push/Pull 22 m (330) + Damage — (0) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Push/Pull 24 m (360) + Damage — (0) = 430 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Push/Pull 26 m (390) + Damage — (0) = 465 PP<br><br>
      NOTES<br>
      Push and Pull use the same cost structure.<br>
      The Ranged version trails behind Melee because it pays Range every level.<br>
      Damage is omitted to keep this template purely focused on battlefield control.
    </span>
  </span>
</h3>

A ranged martial control technique that forces the target away from the impact point or draws it toward the source.

---
:
**Martial Requirement:** Ranged Weapon or Thrown Weapon  
**Spell Delivery:** The Martial weapon requirement is replaced by the normal Spell delivery rules.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | No damage. | **Push 2 m / Pull 2 m** |
| **2** | Active | 12 m | — | Instant | No damage. | **Push 2 m / Pull 2 m** |
| **3** | Active | 16 m | — | Instant | No damage. | **Push 4 m / Pull 4 m** |
| **4** | Active | 20 m | — | Instant | No damage. | **Push 6 m / Pull 6 m** |
| **5** | Active | 24 m | — | Instant | No damage. | **Push 8 m / Pull 8 m** |
| **6** | Active | 28 m | — | Instant | No damage. | **Push 10 m / Pull 10 m** |
| **7** | Active | 32 m | — | Instant | No damage. | **Push 12 m / Pull 12 m** |
| **8** | Active | 36 m | — | Instant | No damage. | **Push 12 m / Pull 12 m** |
| **9** | Active | 40 m | — | Instant | No damage. | **Push 14 m / Pull 14 m** |
| **10** | Active | 44 m | — | Instant | No damage. | **Push 16 m / Pull 16 m** |
| **11** | Active | 48 m | — | Instant | No damage. | **Push 18 m / Pull 18 m** |
| **12** | Active | 52 m | — | Instant | No damage. | **Push 20 m / Pull 20 m** |
| **13** | Active | 56 m | — | Instant | No damage. | **Push 22 m / Pull 22 m** |
| **14** | Active | 60 m | — | Instant | No damage. | **Push 22 m / Pull 22 m** |
| **15** | Active | 64 m | — | Instant | No damage. | **Push 24 m / Pull 24 m** |
| **16** | Active | 68 m | — | Instant | No damage. | **Push 26 m / Pull 26 m** |

}}
\page

{{pageNumber,auto}}
{{wide
## Support Actives: Healing, Cleanse & Restoration

> **Design Rule:** These Powers are **Support Actives**.  
> They restore HP, remove eligible negative creature Specials, or reopen Scarred Health Bars through Restoration.

Support Actives are not attack Powers unless they explicitly include a damaging attack.

A Support Active normally affects willing creatures, allied creatures, or ongoing creature effects.

A Support Active with Martial delivery normally uses the printed Support resolution below. If it is used on an unwilling creature or a contested target, the GM may require an appropriate Attack Roll or contest.

A **Ranged Support Active with Spell delivery always makes a Casting Roll** under the Core Spell rules. A willing creature may voluntarily suppress its Spell Resistance for that Spell as described in the Core Rules; an unwilling creature uses its normal Final Spell TN.

---

### Support Resolution

When using a Support Active, choose a valid target within the Power's listed Range.

If the Power is single-target, it affects one valid creature.

If the Power is AoE, it affects all valid creatures in the listed area.

Support Powers do not use the target's Evade unless the Power is also an attack or the GM rules that the target actively resists the effect.


For Spell delivery, **Evade is never substituted for the Casting check**. The Spell must reach Spell Base TN, and any creature that does not voluntarily suppress Spell Resistance is checked against its Final Spell TN.

---

### Support Cost Reference

| **Support Effect** | **Cost** | **Scaling Axis** |
|---|:--:|---|
| **Healing** | **20 PP per +1d8 Healing** | Healing dice |
| **Health Level Recovery** | **40 PP per restored Health Level per Safe Haven Rest** | Dedicated Restoration Power; resets at Safe Haven Rest |
| **Cleanse(X)** | **4 × T(X) PP** | Total negative Special value removed |
| **Damage** | **15 PP per +1d8 Damage** | Damage dice |

---

### Healing

Healing restores current HP inside the currently active Health Bar.

A Heal Active rolls the listed Healing dice and restores that much HP to the target.

Healing cannot restore lost Health Bars unless a Power explicitly belongs to a separate Health Bar Recovery subsystem.

**Healing, Cleanse and Restoration are three separate Powers.** Healing uses **20 PP per 1d8** and restores only ordinary HP. Cleanse removes eligible negative Specials. Restoration reopens Scarred Health Bars but does not restore HP; each recovered Health Bar costs **40 PP** from the Restoration Power's shared Safe Haven Rest pool. The pool refreshes once per **Safe Haven Rest**. The first selectable Restoration Power is Power Level 2. None of these Powers combines these functions.

Healing cannot raise a creature above its maximum HP unless a Power explicitly says otherwise.

---

### Cleanse

Cleanse removes negative Special value from a creature.

When you use **Cleanse(X)**, remove up to **X total points** from one or more eligible negative Specials affecting the target. You choose how to distribute the reduction between those Specials.

If a Special is reduced to **0**, it ends. If the target has less than **X total eligible negative Special value**, any unused Cleanse points are lost.

Cleanse provides no additional Damage, Armor, Evade, Speed, Healing, Restoration, Temporary HP, or Absorption Stone effect.

Examples:

- **Cleanse(3)** reduces **Ruin(5)** to **Ruin(2)**.
- **Cleanse(6)** may end **Hex(4)** and reduce **Slow(3)** to **Slow(1)**.
- **Cleanse(6)** may remove **Ruin(3)** and **Slow(3)** completely.
}}
\page

{{pageNumber,auto}}
{{wide
Cleanse can reduce eligible creature effects such as:

- **Blight(X)**
- **Challenge(X)**
- **Corrode(X)**
- **Disoriented(X)**
- **Expose(X)**
- **Hex(X)**
- **Lacerate(X)**
- **Mark(X)**
- **Root(X)**
- **Ruin(X)**
- **Slow(X)**
- **Soulburn(X)**
- **Sundered(X)**
- **Weaken(X)**

Cleanse does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, constructs, objects, or ongoing non-creature effects.

Those require Dispel or a dedicated rule.

---

### Cleanse and Restoration Are Separate

A **Cleanse** Power removes eligible negative Specials and grants no Damage,
Speed, Armor, Evade, Healing or Restoration rider.
**Healing** restores HP only. **Restoration** reopens Scarred Health Bars only.
To provide more than one of these functions, a character must learn the
corresponding Powers separately.

}}
\page

{{pageNumber,auto}}
{{wide

## Healing Actives

---
:
<h3 id="melee-single-target-heal">
  Melee Single Target Heal
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = Touch / Melee Reach<br>
      Healing = 20 PP per 1d8 of HP Healing<br>
      Pure HP Healing: this Power does NOT restore Scarred Health Bars / Health Levels<br>
      For Scarred Health Bars, learn a separate Restoration Power<br>
      Purchase only the printed Range and AoE coverage, then whole Healing Dice<br>
      Minimum-function exceptions in exact pure-AoE Healing rows remain as printed<br>
      CALCULATION<br>
      L1: Healing 1d8 x 20 = 20 PP = 20 / 30 PP; 10 PP unused.<br>
      L2: Healing 3d8 x 20 = 60 PP = 60 / 60 PP; 0 PP unused.<br>
      L3: Healing 4d8 x 20 = 80 PP = 80 / 90 PP; 10 PP unused.<br>
      L4: Healing 6d8 x 20 = 120 PP = 120 / 120 PP; 0 PP unused.<br>
      L5: Healing 7d8 x 20 = 140 PP = 140 / 150 PP; 10 PP unused.<br>
      L6: Healing 9d8 x 20 = 180 PP = 180 / 180 PP; 0 PP unused.<br>
      L7: Healing 10d8 x 20 = 200 PP = 200 / 210 PP; 10 PP unused.<br>
      L8: Healing 12d8 x 20 = 240 PP = 240 / 240 PP; 0 PP unused.<br>
      L9: Healing 13d8 x 20 = 260 PP = 260 / 270 PP; 10 PP unused.<br>
      L10: Healing 15d8 x 20 = 300 PP = 300 / 300 PP; 0 PP unused.<br>
      L11: Healing 16d8 x 20 = 320 PP = 320 / 330 PP; 10 PP unused.<br>
      L12: Healing 18d8 x 20 = 360 PP = 360 / 360 PP; 0 PP unused.<br>
      L13: Healing 19d8 x 20 = 380 PP = 380 / 390 PP; 10 PP unused.<br>
      L14: Healing 21d8 x 20 = 420 PP = 420 / 420 PP; 0 PP unused.<br>
      L15: Healing 22d8 x 20 = 440 PP = 440 / 450 PP; 10 PP unused.<br>
      L16: Healing 24d8 x 20 = 480 PP = 480 / 480 PP; 0 PP unused.<br>
      NOTES<br>
      No Health Level Recovery pool, no extra recovery axis; all Healing Dice are non-exploding d8
    </span>
  </span>
</h3>

A close-range Active that restores only HP to one creature. It does not restore Scarred Health Bars; Restoration is a separate Power.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **1d8 HP**. |
| **2** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **3d8 HP**. |
| **3** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **4d8 HP**. |
| **4** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **6d8 HP**. |
| **5** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **7d8 HP**. |
| **6** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **9d8 HP**. |
| **7** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **10d8 HP**. |
| **8** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **12d8 HP**. |
| **9** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **13d8 HP**. |
| **10** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **15d8 HP**. |
| **11** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **16d8 HP**. |
| **12** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **18d8 HP**. |
| **13** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **19d8 HP**. |
| **14** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **21d8 HP**. |
| **15** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **22d8 HP**. |
| **16** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **24d8 HP**. |

}}
\page

{{pageNumber,auto}}
{{wide
<h3 id="ranged-single-target-heal">
  Ranged Single Target Heal
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = 8 m at PL 1, +4 m per Level; Range cost = 5 PP per +4 m beyond 8 m<br>
      Healing = 20 PP per 1d8 of HP Healing<br>
      Pure HP Healing: this Power does NOT restore Scarred Health Bars / Health Levels<br>
      For Scarred Health Bars, learn a separate Restoration Power<br>
      Purchase only the printed Range and AoE coverage, then whole Healing Dice<br>
      Minimum-function exceptions in exact pure-AoE Healing rows remain as printed<br>
      CALCULATION<br>
      L1: Healing 1d8 x 20 = 20 PP + Range 0 PP = 20 / 30 PP; 10 PP unused.<br>
      L2: Healing 2d8 x 20 = 40 PP + Range 5 PP = 45 / 60 PP; 15 PP unused.<br>
      L3: Healing 4d8 x 20 = 80 PP + Range 10 PP = 90 / 90 PP; 0 PP unused.<br>
      L4: Healing 5d8 x 20 = 100 PP + Range 15 PP = 115 / 120 PP; 5 PP unused.<br>
      L5: Healing 6d8 x 20 = 120 PP + Range 20 PP = 140 / 150 PP; 10 PP unused.<br>
      L6: Healing 7d8 x 20 = 140 PP + Range 25 PP = 165 / 180 PP; 15 PP unused.<br>
      L7: Healing 9d8 x 20 = 180 PP + Range 30 PP = 210 / 210 PP; 0 PP unused.<br>
      L8: Healing 10d8 x 20 = 200 PP + Range 35 PP = 235 / 240 PP; 5 PP unused.<br>
      L9: Healing 11d8 x 20 = 220 PP + Range 40 PP = 260 / 270 PP; 10 PP unused.<br>
      L10: Healing 12d8 x 20 = 240 PP + Range 45 PP = 285 / 300 PP; 15 PP unused.<br>
      L11: Healing 14d8 x 20 = 280 PP + Range 50 PP = 330 / 330 PP; 0 PP unused.<br>
      L12: Healing 15d8 x 20 = 300 PP + Range 55 PP = 355 / 360 PP; 5 PP unused.<br>
      L13: Healing 16d8 x 20 = 320 PP + Range 60 PP = 380 / 390 PP; 10 PP unused.<br>
      L14: Healing 17d8 x 20 = 340 PP + Range 65 PP = 405 / 420 PP; 15 PP unused.<br>
      L15: Healing 19d8 x 20 = 380 PP + Range 70 PP = 450 / 450 PP; 0 PP unused.<br>
      L16: Healing 20d8 x 20 = 400 PP + Range 75 PP = 475 / 480 PP; 5 PP unused.<br>
      NOTES<br>
      No Health Level Recovery pool, no extra recovery axis; all Healing Dice are non-exploding d8
    </span>
  </span>
</h3>

A ranged Active that restores only HP to one creature. It does not restore Scarred Health Bars; Restoration is a separate Power.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | 8 m | None | Instant | Heal one creature for **1d8 HP**. |
| **2** | Active, Support | 12 m | None | Instant | Heal one creature for **2d8 HP**. |
| **3** | Active, Support | 16 m | None | Instant | Heal one creature for **4d8 HP**. |
| **4** | Active, Support | 20 m | None | Instant | Heal one creature for **5d8 HP**. |
| **5** | Active, Support | 24 m | None | Instant | Heal one creature for **6d8 HP**. |
| **6** | Active, Support | 28 m | None | Instant | Heal one creature for **7d8 HP**. |
| **7** | Active, Support | 32 m | None | Instant | Heal one creature for **9d8 HP**. |
| **8** | Active, Support | 36 m | None | Instant | Heal one creature for **10d8 HP**. |
| **9** | Active, Support | 40 m | None | Instant | Heal one creature for **11d8 HP**. |
| **10** | Active, Support | 44 m | None | Instant | Heal one creature for **12d8 HP**. |
| **11** | Active, Support | 48 m | None | Instant | Heal one creature for **14d8 HP**. |
| **12** | Active, Support | 52 m | None | Instant | Heal one creature for **15d8 HP**. |
| **13** | Active, Support | 56 m | None | Instant | Heal one creature for **16d8 HP**. |
| **14** | Active, Support | 60 m | None | Instant | Heal one creature for **17d8 HP**. |
| **15** | Active, Support | 64 m | None | Instant | Heal one creature for **19d8 HP**. |
| **16** | Active, Support | 68 m | None | Instant | Heal one creature for **20d8 HP**. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="melee-aoe-heal">
  Melee AoE Heal
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = Self (AoE)<br>
      AoE radius costs: 2 m = 20 PP; 3 m = 50 PP; 4 m = 90 PP<br>
      Radius progression retained from the earlier v0.9.9.2 candidate<br>
      Healing = 20 PP per 1d8 of HP Healing<br>
      Pure HP Healing: this Power does NOT restore Scarred Health Bars / Health Levels<br>
      For Scarred Health Bars, learn a separate Restoration Power<br>
      Healing dice are delivered to every eligible creature in the printed AoE<br>
      Purchase only the printed Range and AoE coverage, then whole Healing Dice<br>
      Minimum-function exceptions in exact pure-AoE Healing rows remain as printed<br>
      CALCULATION<br>
      L1: Healing 1d8 x 20 = 20 PP + Radius 2 m (20 PP) = 40 / 30 PP; budget exception +10 PP (minimum legal effect).<br>
      L2: Healing 2d8 x 20 = 40 PP + Radius 2 m (20 PP) = 60 / 60 PP; 0 PP unused.<br>
      L3: Healing 3d8 x 20 = 60 PP + Radius 2 m (20 PP) = 80 / 90 PP; 10 PP unused.<br>
      L4: Healing 5d8 x 20 = 100 PP + Radius 2 m (20 PP) = 120 / 120 PP; 0 PP unused.<br>
      L5: Healing 6d8 x 20 = 120 PP + Radius 2 m (20 PP) = 140 / 150 PP; 10 PP unused.<br>
      L6: Healing 6d8 x 20 = 120 PP + Radius 3 m (50 PP) = 170 / 180 PP; 10 PP unused.<br>
      L7: Healing 8d8 x 20 = 160 PP + Radius 3 m (50 PP) = 210 / 210 PP; 0 PP unused.<br>
      L8: Healing 9d8 x 20 = 180 PP + Radius 3 m (50 PP) = 230 / 240 PP; 10 PP unused.<br>
      L9: Healing 9d8 x 20 = 180 PP + Radius 4 m (90 PP) = 270 / 270 PP; 0 PP unused.<br>
      L10: Healing 10d8 x 20 = 200 PP + Radius 4 m (90 PP) = 290 / 300 PP; 10 PP unused.<br>
      L11: Healing 12d8 x 20 = 240 PP + Radius 4 m (90 PP) = 330 / 330 PP; 0 PP unused.<br>
      L12: Healing 13d8 x 20 = 260 PP + Radius 4 m (90 PP) = 350 / 360 PP; 10 PP unused.<br>
      L13: Healing 15d8 x 20 = 300 PP + Radius 4 m (90 PP) = 390 / 390 PP; 0 PP unused.<br>
      L14: Healing 16d8 x 20 = 320 PP + Radius 4 m (90 PP) = 410 / 420 PP; 10 PP unused.<br>
      L15: Healing 18d8 x 20 = 360 PP + Radius 4 m (90 PP) = 450 / 450 PP; 0 PP unused.<br>
      L16: Healing 19d8 x 20 = 380 PP + Radius 4 m (90 PP) = 470 / 480 PP; 10 PP unused.<br>
      NOTES<br>
      No Health Level Recovery pool, no extra recovery axis; all Healing Dice are non-exploding d8
    </span>
  </span>
</h3>

A self-centered area Active that restores HP to all eligible affected creatures. It does not restore Scarred Health Bars.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **1d8 HP**. |
| **2** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **2d8 HP**. |
| **3** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **3d8 HP**. |
| **4** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **5d8 HP**. |
| **5** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **6d8 HP**. |
| **6** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **6d8 HP**. |
| **7** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **8d8 HP**. |
| **8** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **9d8 HP**. |
| **9** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **9d8 HP**. |
| **10** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **10d8 HP**. |
| **11** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **12d8 HP**. |
| **12** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **13d8 HP**. |
| **13** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **15d8 HP**. |
| **14** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **16d8 HP**. |
| **15** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **18d8 HP**. |
| **16** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **19d8 HP**. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="ranged-aoe-heal">
  Ranged AoE Heal
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = 8 m at PL 1, +4 m per Level; Range cost = 5 PP per +4 m beyond 8 m<br>
      AoE radius costs: 2 m = 20 PP; 3 m = 50 PP;<br>
      Radius progression retained from the earlier v0.9.9.2 candidate<br>
      Healing = 20 PP per 1d8 of HP Healing<br>
      Pure HP Healing: this Power does NOT restore Scarred Health Bars / Health Levels<br>
      For Scarred Health Bars, learn a separate Restoration Power<br>
      Healing dice are delivered to every eligible creature in the printed AoE<br>
      Purchase only the printed Range and AoE coverage, then whole Healing Dice<br>
      Minimum-function exceptions in exact pure-AoE Healing rows remain as printed<br>
      CALCULATION<br>
      L1: Healing 1d8 x 20 = 20 PP + Range 0 PP + Radius 2 m (20 PP) = 40 / 30 PP; budget exception +10 PP (minimum legal effect).<br>
      L2: Healing 1d8 x 20 = 20 PP + Range 5 PP + Radius 2 m (20 PP) = 45 / 60 PP; 15 PP unused.<br>
      L3: Healing 3d8 x 20 = 60 PP + Range 10 PP + Radius 2 m (20 PP) = 90 / 90 PP; 0 PP unused.<br>
      L4: Healing 4d8 x 20 = 80 PP + Range 15 PP + Radius 2 m (20 PP) = 115 / 120 PP; 5 PP unused.<br>
      L5: Healing 5d8 x 20 = 100 PP + Range 20 PP + Radius 2 m (20 PP) = 140 / 150 PP; 10 PP unused.<br>
      L6: Healing 6d8 x 20 = 120 PP + Range 25 PP + Radius 2 m (20 PP) = 165 / 180 PP; 15 PP unused.<br>
      L7: Healing 8d8 x 20 = 160 PP + Range 30 PP + Radius 2 m (20 PP) = 210 / 210 PP; 0 PP unused.<br>
      L8: Healing 9d8 x 20 = 180 PP + Range 35 PP + Radius 2 m (20 PP) = 235 / 240 PP; 5 PP unused.<br>
      L9: Healing 9d8 x 20 = 180 PP + Range 40 PP + Radius 3 m (50 PP) = 270 / 270 PP; 0 PP unused.<br>
      L10: Healing 10d8 x 20 = 200 PP + Range 45 PP + Radius 3 m (50 PP) = 295 / 300 PP; 5 PP unused.<br>
      L11: Healing 11d8 x 20 = 220 PP + Range 50 PP + Radius 3 m (50 PP) = 320 / 330 PP; 10 PP unused.<br>
      L12: Healing 12d8 x 20 = 240 PP + Range 55 PP + Radius 3 m (50 PP) = 345 / 360 PP; 15 PP unused.<br>
      L13: Healing 14d8 x 20 = 280 PP + Range 60 PP + Radius 3 m (50 PP) = 390 / 390 PP; 0 PP unused.<br>
      L14: Healing 15d8 x 20 = 300 PP + Range 65 PP + Radius 3 m (50 PP) = 415 / 420 PP; 5 PP unused.<br>
      L15: Healing 16d8 x 20 = 320 PP + Range 70 PP + Radius 3 m (50 PP) = 440 / 450 PP; 10 PP unused.<br>
      L16: Healing 17d8 x 20 = 340 PP + Range 75 PP + Radius 3 m (50 PP) = 465 / 480 PP; 15 PP unused.<br>
      NOTES<br>
      No Health Level Recovery pool, no extra recovery axis; all Healing Dice are non-exploding d8
    </span>
  </span>
</h3>

A ranged area Active that restores HP to all eligible affected creatures. It does not restore Scarred Health Bars.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | 8 m | Radius 2 m | Instant | Heal affected creatures for **1d8 HP**. |
| **2** | Active, Support | 12 m | Radius 2 m | Instant | Heal affected creatures for **1d8 HP**. |
| **3** | Active, Support | 16 m | Radius 2 m | Instant | Heal affected creatures for **3d8 HP**. |
| **4** | Active, Support | 20 m | Radius 2 m | Instant | Heal affected creatures for **4d8 HP**. |
| **5** | Active, Support | 24 m | Radius 2 m | Instant | Heal affected creatures for **5d8 HP**. |
| **6** | Active, Support | 28 m | Radius 2 m | Instant | Heal affected creatures for **6d8 HP**. |
| **7** | Active, Support | 32 m | Radius 2 m | Instant | Heal affected creatures for **8d8 HP**. |
| **8** | Active, Support | 36 m | Radius 2 m | Instant | Heal affected creatures for **9d8 HP**. |
| **9** | Active, Support | 40 m | Radius 3 m | Instant | Heal affected creatures for **9d8 HP**. |
| **10** | Active, Support | 44 m | Radius 3 m | Instant | Heal affected creatures for **10d8 HP**. |
| **11** | Active, Support | 48 m | Radius 3 m | Instant | Heal affected creatures for **11d8 HP**. |
| **12** | Active, Support | 52 m | Radius 3 m | Instant | Heal affected creatures for **12d8 HP**. |
| **13** | Active, Support | 56 m | Radius 3 m | Instant | Heal affected creatures for **14d8 HP**. |
| **14** | Active, Support | 60 m | Radius 3 m | Instant | Heal affected creatures for **15d8 HP**. |
| **15** | Active, Support | 64 m | Radius 3 m | Instant | Heal affected creatures for **16d8 HP**. |
| **16** | Active, Support | 68 m | Radius 3 m | Instant | Heal affected creatures for **17d8 HP**. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="melee-single-target-restoration">
  Melee Single Target Restoration
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = Touch / Melee Reach<br>
      Health Level Recovery = 40 PP per restored Health Level per Safe Haven Rest<br>
      Pool refreshes once per Safe Haven Rest<br>
      This is the dedicated structural recovery Power; it does NOT restore HP<br>
      No legal Level 1 version: 30 PP cannot buy the minimum 40 PP Health Level<br>
      Recovery Levels form a shared per-Power pool, usable over one or multiple legal uses and recipients<br>
      One restored Level reopens one Scarred Health Bar; no automatic HP replenishment<br>
      CALCULATION<br>
      L1: Health Level Recovery 0 x 40 = 0 PP = 0 / 30 PP; NOT SELECTABLE at PL1.<br>
      L2: Health Level Recovery 1 x 40 = 40 PP = 40 / 60 PP; 20 PP unused.<br>
      L3: Health Level Recovery 2 x 40 = 80 PP = 80 / 90 PP; 10 PP unused.<br>
      L4: Health Level Recovery 3 x 40 = 120 PP = 120 / 120 PP; 0 PP unused.<br>
      L5: Health Level Recovery 3 x 40 = 120 PP = 120 / 150 PP; 30 PP unused.<br>
      L6: Health Level Recovery 4 x 40 = 160 PP = 160 / 180 PP; 20 PP unused.<br>
      L7: Health Level Recovery 5 x 40 = 200 PP = 200 / 210 PP; 10 PP unused.<br>
      L8: Health Level Recovery 6 x 40 = 240 PP = 240 / 240 PP; 0 PP unused.<br>
      L9: Health Level Recovery 6 x 40 = 240 PP = 240 / 270 PP; 30 PP unused.<br>
      L10: Health Level Recovery 7 x 40 = 280 PP = 280 / 300 PP; 20 PP unused.<br>
      L11: Health Level Recovery 8 x 40 = 320 PP = 320 / 330 PP; 10 PP unused.<br>
      L12: Health Level Recovery 9 x 40 = 360 PP = 360 / 360 PP; 0 PP unused.<br>
      L13: Health Level Recovery 9 x 40 = 360 PP = 360 / 390 PP; 30 PP unused.<br>
      L14: Health Level Recovery 10 x 40 = 400 PP = 400 / 420 PP; 20 PP unused.<br>
      L15: Health Level Recovery 11 x 40 = 440 PP = 440 / 450 PP; 10 PP unused.<br>
      L16: Health Level Recovery 12 x 40 = 480 PP = 480 / 480 PP; 0 PP unused.<br>
      NOTES<br>
      The pool refreshes once per Safe Haven Rest; Restoration reopens a Scarred Health Bar
    </span>
  </span>
</h3>

A dedicated close-range Active that reopens Scarred Health Bars from a pool refreshed once per Safe Haven Rest, without restoring HP. First available at Power Level 2.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | Touch / Melee Reach | None | Instant | **Not available at Power Level 1:** a Health Level costs 40 PP. This Power has no legal Level 1 version. | None |
| **2** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **1 lost Health Level** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **3** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **2 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **4** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **3 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **5** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **3 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **6** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **4 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **7** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **5 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **5 Health Levels** per Safe Haven Rest. |
| **8** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **6 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **6 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **7 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **7 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **8 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **8 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **9 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **9 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **9 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **9 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **10 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **10 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **11 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **11 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | Touch / Melee Reach | None | Instant | Restore up to **12 lost Health Levels** on one creature you can touch or reach using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **12 Health Levels** per Safe Haven Rest. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="ranged-single-target-restoration">
  Ranged Single Target Restoration
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Target budget = 30 PP x Power Level<br>
      Duration = Instant<br>
      Range = 8 m at PL 1, +4 m per Level; Range cost = 5 PP per +4 m beyond 8 m<br>
      Health Level Recovery = 40 PP per restored Health Level per Safe Haven Rest<br>
      Pool refreshes once per Safe Haven Rest<br>
      This is the dedicated structural recovery Power; it does NOT restore HP<br>
      No legal Level 1 version: 30 PP cannot buy the minimum 40 PP Health Level<br>
      Recovery Levels form a shared per-Power pool, usable over one or multiple legal uses and recipients<br>
      One restored Level reopens one Scarred Health Bar; no automatic HP replenishment<br>
      CALCULATION<br>
      L1: Health Level Recovery 0 x 40 = 0 PP + Range 0 PP = 0 / 30 PP; NOT SELECTABLE at PL1.<br>
      L2: Health Level Recovery 1 x 40 = 40 PP + Range 5 PP = 45 / 60 PP; 15 PP unused.<br>
      L3: Health Level Recovery 2 x 40 = 80 PP + Range 10 PP = 90 / 90 PP; 0 PP unused.<br>
      L4: Health Level Recovery 2 x 40 = 80 PP + Range 15 PP = 95 / 120 PP; 25 PP unused.<br>
      L5: Health Level Recovery 3 x 40 = 120 PP + Range 20 PP = 140 / 150 PP; 10 PP unused.<br>
      L6: Health Level Recovery 3 x 40 = 120 PP + Range 25 PP = 145 / 180 PP; 35 PP unused.<br>
      L7: Health Level Recovery 4 x 40 = 160 PP + Range 30 PP = 190 / 210 PP; 20 PP unused.<br>
      L8: Health Level Recovery 5 x 40 = 200 PP + Range 35 PP = 235 / 240 PP; 5 PP unused.<br>
      L9: Health Level Recovery 5 x 40 = 200 PP + Range 40 PP = 240 / 270 PP; 30 PP unused.<br>
      L10: Health Level Recovery 6 x 40 = 240 PP + Range 45 PP = 285 / 300 PP; 15 PP unused.<br>
      L11: Health Level Recovery 7 x 40 = 280 PP + Range 50 PP = 330 / 330 PP; 0 PP unused.<br>
      L12: Health Level Recovery 7 x 40 = 280 PP + Range 55 PP = 335 / 360 PP; 25 PP unused.<br>
      L13: Health Level Recovery 8 x 40 = 320 PP + Range 60 PP = 380 / 390 PP; 10 PP unused.<br>
      L14: Health Level Recovery 8 x 40 = 320 PP + Range 65 PP = 385 / 420 PP; 35 PP unused.<br>
      L15: Health Level Recovery 9 x 40 = 360 PP + Range 70 PP = 430 / 450 PP; 20 PP unused.<br>
      L16: Health Level Recovery 10 x 40 = 400 PP + Range 75 PP = 475 / 480 PP; 5 PP unused.<br>
      NOTES<br>
      The pool refreshes once per Safe Haven Rest; Restoration reopens a Scarred Health Bar
    </span>
  </span>
</h3>

A dedicated ranged Active that reopens Scarred Health Bars from a pool refreshed once per Safe Haven Rest, without restoring HP. First available at Power Level 2.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | 8 m | None | Instant | **Not available at Power Level 1:** a Health Level costs 40 PP. This Power has no legal Level 1 version. | None |
| **2** | Active, Support | 12 m | None | Instant | Restore up to **1 lost Health Level** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **3** | Active, Support | 16 m | None | Instant | Restore up to **2 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **4** | Active, Support | 20 m | None | Instant | Restore up to **2 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **5** | Active, Support | 24 m | None | Instant | Restore up to **3 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **6** | Active, Support | 28 m | None | Instant | Restore up to **3 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **7** | Active, Support | 32 m | None | Instant | Restore up to **4 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **8** | Active, Support | 36 m | None | Instant | Restore up to **5 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **5 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | 40 m | None | Instant | Restore up to **5 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **5 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | 44 m | None | Instant | Restore up to **6 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | 48 m | None | Instant | Restore up to **7 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **7 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | 52 m | None | Instant | Restore up to **7 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **7 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | 56 m | None | Instant | Restore up to **8 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **8 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | 60 m | None | Instant | Restore up to **8 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **8 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | 64 m | None | Instant | Restore up to **9 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **9 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | 68 m | None | Instant | Restore up to **10 lost Health Levels** on one creature within range using this Power's remaining Safe Haven Rest pool. This Power restores no HP. | Restore up to **10 Health Levels** per Safe Haven Rest. |

}}

\page

{{pageNumber,auto}}
{{wide

## Cleanse Actives

---
{{wide
<h3 id="melee-single-target-cleanse">
  Melee Single Target Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Melee Support Range = Touch / Melee Reach<br>
      Range cost = 0 PP<br>
      AoE = none<br>
      Duration = Instant<br>
      Cleanse(X) = 4 × T(X) PP<br>
      T(X) = X × (X + 1) / 2<br><br>
      CLEANSE COSTS<br>
      Cleanse(1) = 4 PP<br>
      Cleanse(2) = 12 PP<br>
      Cleanse(3) = 24 PP<br>
      Cleanse(4) = 40 PP<br>
      Cleanse(5) = 60 PP<br>
      Cleanse(6) = 84 PP<br>
      Cleanse(7) = 112 PP<br>
      Cleanse(8) = 144 PP<br>
      Cleanse(9) = 180 PP<br>
      Cleanse(10) = 220 PP<br>
      Cleanse(11) = 264 PP<br>
      Cleanse(12) = 312 PP<br>
      Cleanse(13) = 364 PP<br>
      Cleanse(14) = 420 PP<br>
      Cleanse(15) = 480 PP<br><br>
      CLEANSE RULE<br>
      Cleanse(X) removes up to X total negative Special value from the target.<br>
      The removed value may be split across one or more eligible negative Specials.<br>
      If a Special is reduced to 0, it is removed.<br>
      Cleanse removes Special value, not PP value.<br>
      Cleanse does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, constructs, objects, or ongoing non-creature effects.<br><br>
      SCALING RULE<br>
      Spend the Active budget on Cleanse strength.<br>
      Cleanse may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Cleanse(3) (24) = 24 PP<br>
      L2 → Target 60 PP: Cleanse(5) (60) = 60 PP<br>
      L3 → Target 90 PP: Cleanse(6) (84) = 84 PP<br>
      L4 → Target 120 PP: Cleanse(7) (112) = 112 PP<br>
      L5 → Target 150 PP: Cleanse(8) (144) = 144 PP<br>
      L6 → Target 180 PP: Cleanse(9) (180) = 180 PP<br>
      L7 → Target 210 PP: Cleanse(9) (180) = 180 PP<br>
      L8 → Target 240 PP: Cleanse(10) (220) = 220 PP<br>
      L9 → Target 270 PP: Cleanse(11) (264) = 264 PP<br>
      L10 → Target 300 PP: Cleanse(11) (264) = 264 PP<br>
      L11 → Target 330 PP: Cleanse(12) (312) = 312 PP<br>
      L12 → Target 360 PP: Cleanse(12) (312) = 312 PP<br>
      L13 → Target 390 PP: Cleanse(13) (364) = 364 PP<br>
      L14 → Target 420 PP: Cleanse(14) (420) = 420 PP<br>
      L15 → Target 450 PP: Cleanse(14) (420) = 420 PP<br>
      L16 → Target 480 PP: Cleanse(15) (480) = 480 PP<br><br>
      NOTES<br>
      This is the pure melee removal version.<br>
      It has no Healing, no Health Level Recovery, no Temporary HP, and no additional Stone generation.
    </span>
  </span>
</h3>

A close-range support Active that removes negative Special value from one creature you can touch or reach.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(3)** total negative Special value from one creature. |
| **2** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(5)** total negative Special value from one creature. |
| **3** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(6)** total negative Special value from one creature. |
| **4** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(7)** total negative Special value from one creature. |
| **5** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(8)** total negative Special value from one creature. |
| **6** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(9)** total negative Special value from one creature. |
| **7** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(9)** total negative Special value from one creature. |
| **8** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(10)** total negative Special value from one creature. |
| **9** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(11)** total negative Special value from one creature. |
| **10** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(11)** total negative Special value from one creature. |
| **11** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(12)** total negative Special value from one creature. |
| **12** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(12)** total negative Special value from one creature. |
| **13** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(13)** total negative Special value from one creature. |
| **14** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(14)** total negative Special value from one creature. |
| **15** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(14)** total negative Special value from one creature. |
| **16** | Active, Support | Touch / Melee Reach | None | Instant | Remove up to **Cleanse(15)** total negative Special value from one creature. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="ranged-single-target-cleanse">
  Ranged Single Target Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Ranged Support uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      AoE = none<br>
      Duration = Instant<br>
      Cleanse(X) = 4 × T(X) PP<br>
      T(X) = X × (X + 1) / 2<br><br>
      RANGE COSTS<br>
      8 m = 0 PP<br>
      12 m = 5 PP<br>
      16 m = 10 PP<br>
      20 m = 15 PP<br>
      24 m = 20 PP<br>
      28 m = 25 PP<br>
      32 m = 30 PP<br>
      36 m = 35 PP<br>
      40 m = 40 PP<br>
      44 m = 45 PP<br>
      48 m = 50 PP<br>
      52 m = 55 PP<br>
      56 m = 60 PP<br>
      60 m = 65 PP<br>
      64 m = 70 PP<br>
      68 m = 75 PP<br><br>
      CLEANSE COSTS<br>
      Cleanse(1) = 4 PP<br>
      Cleanse(2) = 12 PP<br>
      Cleanse(3) = 24 PP<br>
      Cleanse(4) = 40 PP<br>
      Cleanse(5) = 60 PP<br>
      Cleanse(6) = 84 PP<br>
      Cleanse(7) = 112 PP<br>
      Cleanse(8) = 144 PP<br>
      Cleanse(9) = 180 PP<br>
      Cleanse(10) = 220 PP<br>
      Cleanse(11) = 264 PP<br>
      Cleanse(12) = 312 PP<br>
      Cleanse(13) = 364 PP<br><br>
      CLEANSE RULE<br>
      Cleanse(X) removes up to X total negative Special value from the target.<br>
      The removed value may be split across one or more eligible negative Specials.<br>
      If a Special is reduced to 0, it is removed.<br>
      Cleanse removes Special value, not PP value.<br>
      Cleanse does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, constructs, objects, or ongoing non-creature effects.<br><br>
      SCALING RULE<br>
      First pay Range.<br>
      Spend the remaining Active budget on Cleanse strength.<br>
      Cleanse may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0), Cleanse(3) (24) = 24 PP<br>
      L2 → Target 60 PP: Range 12 m (5), Cleanse(4) (40) = 45 PP<br>
      L3 → Target 90 PP: Range 16 m (10), Cleanse(5) (60) = 70 PP<br>
      L4 → Target 120 PP: Range 20 m (15), Cleanse(6) (84) = 99 PP<br>
      L5 → Target 150 PP: Range 24 m (20), Cleanse(7) (112) = 132 PP<br>
      L6 → Target 180 PP: Range 28 m (25), Cleanse(8) (144) = 169 PP<br>
      L7 → Target 210 PP: Range 32 m (30), Cleanse(9) (180) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35), Cleanse(9) (180) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40), Cleanse(10) (220) = 260 PP<br>
      L10 → Target 300 PP: Range 44 m (45), Cleanse(10) (220) = 265 PP<br>
      L11 → Target 330 PP: Range 48 m (50), Cleanse(11) (264) = 314 PP<br>
      L12 → Target 360 PP: Range 52 m (55), Cleanse(11) (264) = 319 PP<br>
      L13 → Target 390 PP: Range 56 m (60), Cleanse(12) (312) = 372 PP<br>
      L14 → Target 420 PP: Range 60 m (65), Cleanse(12) (312) = 377 PP<br>
      L15 → Target 450 PP: Range 64 m (70), Cleanse(13) (364) = 434 PP<br>
      L16 → Target 480 PP: Range 68 m (75), Cleanse(13) (364) = 439 PP<br><br>
      NOTES<br>
      This Power restores less Cleanse value than the melee version because printed Range is paid every level.<br>
      It has no Healing, no Health Level Recovery, no Temporary HP, and no additional Stone generation.
    </span>
  </span>
</h3>

A ranged support Active that removes negative Special value from one creature within range.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | 8 m | None | Instant | Remove up to **Cleanse(3)** total negative Special value from one creature. |
| **2** | Active, Support | 12 m | None | Instant | Remove up to **Cleanse(4)** total negative Special value from one creature. |
| **3** | Active, Support | 16 m | None | Instant | Remove up to **Cleanse(5)** total negative Special value from one creature. |
| **4** | Active, Support | 20 m | None | Instant | Remove up to **Cleanse(6)** total negative Special value from one creature. |
| **5** | Active, Support | 24 m | None | Instant | Remove up to **Cleanse(7)** total negative Special value from one creature. |
| **6** | Active, Support | 28 m | None | Instant | Remove up to **Cleanse(8)** total negative Special value from one creature. |
| **7** | Active, Support | 32 m | None | Instant | Remove up to **Cleanse(9)** total negative Special value from one creature. |
| **8** | Active, Support | 36 m | None | Instant | Remove up to **Cleanse(9)** total negative Special value from one creature. |
| **9** | Active, Support | 40 m | None | Instant | Remove up to **Cleanse(10)** total negative Special value from one creature. |
| **10** | Active, Support | 44 m | None | Instant | Remove up to **Cleanse(10)** total negative Special value from one creature. |
| **11** | Active, Support | 48 m | None | Instant | Remove up to **Cleanse(11)** total negative Special value from one creature. |
| **12** | Active, Support | 52 m | None | Instant | Remove up to **Cleanse(11)** total negative Special value from one creature. |
| **13** | Active, Support | 56 m | None | Instant | Remove up to **Cleanse(12)** total negative Special value from one creature. |
| **14** | Active, Support | 60 m | None | Instant | Remove up to **Cleanse(12)** total negative Special value from one creature. |
| **15** | Active, Support | 64 m | None | Instant | Remove up to **Cleanse(13)** total negative Special value from one creature. |
| **16** | Active, Support | 68 m | None | Instant | Remove up to **Cleanse(13)** total negative Special value from one creature. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="melee-aoe-cleanse">
  Melee AoE Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Melee AoE Support Range = Self<br>
      Range cost = 0 PP<br>
      Duration = Instant<br>
      Cleanse(X) = 4 × T(X) PP<br>
      T(X) = X × (X + 1) / 2<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br>
      Radius 5 m = 140 PP<br><br>
      CLEANSE RULE<br>
      Cleanse(X) removes up to X total negative Special value from each affected creature.<br>
      For each affected creature, the removed value may be split independently across one or more eligible negative Specials.<br>
      If a Special is reduced to 0, it is removed.<br>
      Cleanse removes Special value, not PP value.<br>
      Cleanse does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, constructs, objects, or ongoing non-creature effects.<br><br>
      SCALING RULE<br>
      First pay AoE radius.<br>
      Spend the remaining Active budget on Cleanse strength.<br>
      Cleanse and AoE may stay the same or increase, but they may never decrease.<br>
      If increasing Radius would force Cleanse to decrease, the Radius increase is delayed.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20), Cleanse(1) (4) = 24 PP<br>
      L2 → Target 60 PP: Radius 2 m (20), Cleanse(4) (40) = 60 PP<br>
      L3 → Target 90 PP: Radius 2 m (20), Cleanse(5) (60) = 80 PP<br>
      L4 → Target 120 PP: Radius 2 m (20), Cleanse(6) (84) = 104 PP<br>
      L5 → Target 150 PP: Radius 3 m (50), Cleanse(6) (84) = 134 PP<br>
      L6 → Target 180 PP: Radius 3 m (50), Cleanse(7) (112) = 162 PP<br>
      L7 → Target 210 PP: Radius 3 m (50), Cleanse(8) (144) = 194 PP<br>
      L8 → Target 240 PP: Radius 4 m (90), Cleanse(8) (144) = 234 PP<br>
      L9 → Target 270 PP: Radius 4 m (90), Cleanse(9) (180) = 270 PP<br>
      L10 → Target 300 PP: Radius 4 m (90), Cleanse(9) (180) = 270 PP<br>
      L11 → Target 330 PP: Radius 4 m (90), Cleanse(10) (220) = 310 PP<br>
      L12 → Target 360 PP: Radius 4 m (90), Cleanse(11) (264) = 354 PP<br>
      L13 → Target 390 PP: Radius 4 m (90), Cleanse(11) (264) = 354 PP<br>
      L14 → Target 420 PP: Radius 5 m (140), Cleanse(11) (264) = 404 PP<br>
      L15 → Target 450 PP: Radius 5 m (140), Cleanse(11) (264) = 404 PP<br>
      L16 → Target 480 PP: Radius 5 m (140), Cleanse(12) (312) = 452 PP<br><br>
      NOTES<br>
      This is the self-centered area removal version.<br>
      AoE Cleanse is weaker in raw Cleanse value than single-target Cleanse because Radius is paid from the same Active budget.<br>
      This Power has no Healing, no Health Level Recovery, no Temporary HP, and no additional Stone generation.
    </span>
  </span>
</h3>

A self-centered support Active that removes negative Special value from affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | Self | Radius 2 m | Instant | Remove up to **Cleanse(1)** total negative Special value from each affected creature. |
| **2** | Active, Support | Self | Radius 2 m | Instant | Remove up to **Cleanse(4)** total negative Special value from each affected creature. |
| **3** | Active, Support | Self | Radius 2 m | Instant | Remove up to **Cleanse(5)** total negative Special value from each affected creature. |
| **4** | Active, Support | Self | Radius 2 m | Instant | Remove up to **Cleanse(6)** total negative Special value from each affected creature. |
| **5** | Active, Support | Self | Radius 3 m | Instant | Remove up to **Cleanse(6)** total negative Special value from each affected creature. |
| **6** | Active, Support | Self | Radius 3 m | Instant | Remove up to **Cleanse(7)** total negative Special value from each affected creature. |
| **7** | Active, Support | Self | Radius 3 m | Instant | Remove up to **Cleanse(8)** total negative Special value from each affected creature. |
| **8** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(8)** total negative Special value from each affected creature. |
| **9** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(9)** total negative Special value from each affected creature. |
| **10** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(9)** total negative Special value from each affected creature. |
| **11** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(10)** total negative Special value from each affected creature. |
| **12** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **13** | Active, Support | Self | Radius 4 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **14** | Active, Support | Self | Radius 5 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **15** | Active, Support | Self | Radius 5 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **16** | Active, Support | Self | Radius 5 m | Instant | Remove up to **Cleanse(12)** total negative Special value from each affected creature. |

}}

\page

{{pageNumber,auto}}

{{wide
<h3 id="ranged-aoe-cleanse">
  Ranged AoE Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Ranged AoE Support uses printed Range and Radius<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Duration = Instant<br>
      Cleanse(X) = 4 × T(X) PP<br>
      T(X) = X × (X + 1) / 2<br><br>
      RANGE COSTS<br>
      8 m = 0 PP<br>
      12 m = 5 PP<br>
      16 m = 10 PP<br>
      20 m = 15 PP<br>
      24 m = 20 PP<br>
      28 m = 25 PP<br>
      32 m = 30 PP<br>
      36 m = 35 PP<br>
      40 m = 40 PP<br>
      44 m = 45 PP<br>
      48 m = 50 PP<br>
      52 m = 55 PP<br>
      56 m = 60 PP<br>
      60 m = 65 PP<br>
      64 m = 70 PP<br>
      68 m = 75 PP<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br>
      Radius 5 m = 140 PP<br><br>
      CLEANSE RULE<br>
      Cleanse(X) removes up to X total negative Special value from each affected creature.<br>
      For each affected creature, the removed value may be split independently across one or more eligible negative Specials.<br>
      If a Special is reduced to 0, it is removed.<br>
      Cleanse removes Special value, not PP value.<br>
      Cleanse does not remove battlefield objects, Barriers, Walls, Images, Summons, Illusion Fields, Persistent Zones, terrain effects, constructs, objects, or ongoing non-creature effects.<br><br>
      SCALING RULE<br>
      First pay Range and AoE radius.<br>
      Spend the remaining Active budget on Cleanse strength.<br>
      Cleanse, Range, and AoE may stay the same or increase, but they may never decrease.<br>
      If increasing Radius would force Cleanse to decrease, the Radius increase is delayed.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0), Radius 2 m (20), Cleanse(1) (4) = 24 PP<br>
      L2 → Target 60 PP: Range 12 m (5), Radius 2 m (20), Cleanse(3) (24) = 49 PP<br>
      L3 → Target 90 PP: Range 16 m (10), Radius 2 m (20), Cleanse(5) (60) = 90 PP<br>
      L4 → Target 120 PP: Range 20 m (15), Radius 2 m (20), Cleanse(6) (84) = 119 PP<br>
      L5 → Target 150 PP: Range 24 m (20), Radius 2 m (20), Cleanse(6) (84) = 124 PP<br>
      L6 → Target 180 PP: Range 28 m (25), Radius 2 m (20), Cleanse(7) (112) = 157 PP<br>
      L7 → Target 210 PP: Range 32 m (30), Radius 2 m (20), Cleanse(8) (144) = 194 PP<br>
      L8 → Target 240 PP: Range 36 m (35), Radius 3 m (50), Cleanse(8) (144) = 229 PP<br>
      L9 → Target 270 PP: Range 40 m (40), Radius 3 m (50), Cleanse(9) (180) = 270 PP<br>
      L10 → Target 300 PP: Range 44 m (45), Radius 3 m (50), Cleanse(9) (180) = 275 PP<br>
      L11 → Target 330 PP: Range 48 m (50), Radius 3 m (50), Cleanse(10) (220) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55), Radius 3 m (50), Cleanse(10) (220) = 325 PP<br>
      L13 → Target 390 PP: Range 56 m (60), Radius 4 m (90), Cleanse(10) (220) = 370 PP<br>
      L14 → Target 420 PP: Range 60 m (65), Radius 4 m (90), Cleanse(11) (264) = 419 PP<br>
      L15 → Target 450 PP: Range 64 m (70), Radius 4 m (90), Cleanse(11) (264) = 424 PP<br>
      L16 → Target 480 PP: Range 68 m (75), Radius 5 m (140), Cleanse(11) (264) = 479 PP<br><br>
      NOTES<br>
      This is the ranged area removal version.<br>
      It pays Range and Radius before buying Cleanse, so its Cleanse value is lower than the melee area version.<br>
      Radius 5 m appears only at Level 16 because it can be added without lowering Cleanse.<br>
      This Power has no Healing, no Health Level Recovery, no Temporary HP, and no additional Stone generation.
    </span>
  </span>
</h3>

A ranged area support Active that removes negative Special value from affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Support | 8 m | Radius 2 m | Instant | Remove up to **Cleanse(1)** total negative Special value from each affected creature. |
| **2** | Active, Support | 12 m | Radius 2 m | Instant | Remove up to **Cleanse(3)** total negative Special value from each affected creature. |
| **3** | Active, Support | 16 m | Radius 2 m | Instant | Remove up to **Cleanse(5)** total negative Special value from each affected creature. |
| **4** | Active, Support | 20 m | Radius 2 m | Instant | Remove up to **Cleanse(6)** total negative Special value from each affected creature. |
| **5** | Active, Support | 24 m | Radius 2 m | Instant | Remove up to **Cleanse(6)** total negative Special value from each affected creature. |
| **6** | Active, Support | 28 m | Radius 2 m | Instant | Remove up to **Cleanse(7)** total negative Special value from each affected creature. |
| **7** | Active, Support | 32 m | Radius 2 m | Instant | Remove up to **Cleanse(8)** total negative Special value from each affected creature. |
| **8** | Active, Support | 36 m | Radius 3 m | Instant | Remove up to **Cleanse(8)** total negative Special value from each affected creature. |
| **9** | Active, Support | 40 m | Radius 3 m | Instant | Remove up to **Cleanse(9)** total negative Special value from each affected creature. |
| **10** | Active, Support | 44 m | Radius 3 m | Instant | Remove up to **Cleanse(9)** total negative Special value from each affected creature. |
| **11** | Active, Support | 48 m | Radius 3 m | Instant | Remove up to **Cleanse(10)** total negative Special value from each affected creature. |
| **12** | Active, Support | 52 m | Radius 3 m | Instant | Remove up to **Cleanse(10)** total negative Special value from each affected creature. |
| **13** | Active, Support | 56 m | Radius 4 m | Instant | Remove up to **Cleanse(10)** total negative Special value from each affected creature. |
| **14** | Active, Support | 60 m | Radius 4 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **15** | Active, Support | 64 m | Radius 4 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |
| **16** | Active, Support | 68 m | Radius 5 m | Instant | Remove up to **Cleanse(11)** total negative Special value from each affected creature. |


}}
\page

{{pageNumber,auto}}
{{wide
## Active Constructs & Terrain

> **Design Rule:** These Powers are **Construct / Terrain Actives**.  
> They do not primarily deal damage and do not primarily apply Specials.  
> Instead, they create battlefield objects, barriers, walls, fields, images, illusions, or position-based effects.

These Powers still use the normal **Active curve**:

| **Level** | **Target PP** |
|:--:|:--:|
| 1 | 30 PP |
| 2 | 60 PP |
| 3 | 90 PP |
| 4 | 120 PP |
| 5 | 150 PP |
| 6 | 180 PP |
| 7 | 210 PP |
| 8 | 240 PP |
| 9 | 270 PP |
| 10 | 300 PP |
| 11 | 330 PP |
| 12 | 360 PP |
| 13 | 390 PP |
| 14 | 420 PP |
| 15 | 450 PP |
| 16 | 480 PP |

---

### Construct Active Formula

Construct and Terrain Actives are priced as:

**Final Cost = Range Cost + [(Radius / Shape Cost + Construct Payload) × Duration Modifier]**

Range is paid once and is never multiplied.

The persistent part of the Power is multiplied by Duration:

- Radius / Shape Cost
- Barrier HP
- Illusion Strength
- Concealment Strength
- Field Strength
- or another ongoing payload

---
}}
\page

{{pageNumber,auto}}
{{wide

### Range Cost

Use the normal Ranged Active range progression.

| **Range** | **Cost** |
|:--:|:--:|
| 8 m | 0 PP |
| 12 m | 5 PP |
| 16 m | 10 PP |
| 20 m | 15 PP |
| 24 m | 20 PP |
| 28 m | 25 PP |
| 32 m | 30 PP |
| 36 m | 35 PP |
| 40 m | 40 PP |
| 44 m | 45 PP |
| 48 m | 50 PP |
| 52 m | 55 PP |
| 56 m | 60 PP |
| 60 m | 65 PP |
| 64 m | 70 PP |
| 68 m | 75 PP |

---

### Radius / Field Cost

For circular fields, use the normal AoE radius table.

| **Radius** | **Cost** |
|:--:|:--:|
| 2 m | 20 PP |
| 3 m | 50 PP |
| 4 m | 90 PP |
| 5 m | 140 PP |
| 6 m | 200 PP |
| 7 m | 270 PP |
| 8 m | 350 PP |

A circular field may be reshaped into connected spaces or hexes of equivalent area if the table or VTT uses hexes.

The Power determines the total area.  
The caster may place that area freely as long as all spaces remain connected and within range.

---
}}
\page

{{pageNumber,auto}}
{{wide

### Duration Cost

Construct and Terrain Actives may last from **1 to 4 Rounds**.

| **Duration** | **Cost Modifier** |
|:--:|:--:|
| 1 Round | ×1 |
| 2 Rounds | ×1.25 |
| 3 Rounds | ×1.5 |
| 4 Rounds | ×2 |

Only the persistent part of the Power is multiplied.

Range is never multiplied.

For barriers, walls, fields, and similar ongoing constructs, multiply:

- Radius / Shape Cost
- Barrier HP
- Illusion Strength
- Field Strength
- other ongoing payloads

---

### Barrier HP Cost

Barrier HP replaces damage.

A Barrier Power does not deal damage by default.  
Instead, it creates destructible HP on the battlefield.

| **Barrier HP** | **Cost** |
|:--:|:--:|
| 1 HP | 1 PP |

Barrier HP represents the total durability of the created object.

When a Barrier is split into **N** spaces or Wall segments with total **H** HP, give each segment **floor(H/N) HP**, then distribute the remaining **H mod N** HP **one at a time** to different segments chosen by the creator. The sum of segment HP equals H. Each segment tracks damage separately. A segment reaching 0 HP is destroyed.

A Barrier space or segment is destroyed when its HP reaches 0.

---

### Barrier Rules

A Barrier is a temporary battlefield object with HP.

A Barrier may be attacked and damaged.

Unless a Power says otherwise:

- Barriers have **0 Armor**.
- Barriers have **0 Evade**.
- Barriers do not make Attribute Checks.
- Barriers are immune to Mental effects.
- Barriers are immune to creature-only negative Specials such as Blight, Lacerate, Mark, Disoriented, and similar creature-only effects.

A Barrier does not attack, move, deal damage, heal, apply Specials, or provide any additional effect unless the Power explicitly says so.

A Barrier is destroyed when its HP reaches 0.

---
}}
\page

{{pageNumber,auto}}
{{wide

### Wall Rules

A Wall is a Barrier arranged as connected spaces instead of a circular radius.

When a Power allows a Barrier to be shaped as a Wall, the Wall uses the same total number of spaces as the listed Radius / Field shape.

All Wall spaces must be connected.

The caster may choose the exact shape, but the Wall may not be split into separate disconnected sections unless the Power explicitly allows it.

If the Wall occupies multiple spaces, divide its total HP using the **Barrier HP Cost** allocation: floor(total HP / number of spaces) per segment, and give each remaining HP to a different creator-chosen space.

A Wall space is destroyed when its HP reaches 0.

---

### Barrier Design Rule

Barrier Powers are Actives.

They are not attacks that deal damage.

They are not defensive Buffs.

They are not Passives.

They are battlefield-shaping Powers that trade direct damage for temporary HP and positioning.

Do not add damage, Specials, healing, DR, Phasing, or other major riders unless the Power explicitly pays for them.

}}
\page

{{pageNumber,auto}}
{{wide

---

### Example — Creating a Barrier

A character uses a Barrier Active.

The Power lists:

- Range: **32 m**
- Area: **Radius 3 m**
- Duration: **4 Rounds**
- Barrier HP: **40 HP**

The character chooses a point within **32 m** and creates the Barrier there.

The Barrier occupies the listed area or an equivalent connected shape.

The Barrier has **40 total HP**.

It does not deal damage.  
It does not apply Specials.  
It does not move.  
It does not attack.

It only exists as a temporary battlefield object.

---

### Example — Barrier and Wall HP

A character creates a Barrier with **40 HP**.

If the Barrier is placed as one object, it has **40 HP**.

If the Barrier is shaped into **4 connected Wall spaces**, the HP is divided evenly.

Each Wall space has **10 HP**.

An enemy attacks one Wall space and deals **7 damage**.

That Wall space is reduced from **10 HP** to **3 HP**.

Later, another attack deals **3 damage** to the same Wall space.

That Wall space reaches **0 HP** and is destroyed.

The other Wall spaces remain until they are destroyed or the Power's Duration ends.

---

### Example — Uneven Wall HP

A **22 HP Barrier** formed into **three** connected Wall spaces gives each space 7 HP, with **one extra HP** placed in a space chosen by the creator: **8 / 7 / 7 HP**. Each segment then loses HP individually when damaged. A Barrier or Wall is placed only in **unoccupied, traversable Hexes**.

---

### Example — Blocking Movement

A character creates a stone wall across a narrow passage.

The wall occupies battlefield spaces.

A creature cannot move through those spaces unless it destroys the wall, moves around it, climbs over it, teleports, phases, or uses another valid method.

The wall does not make an attack roll.

The wall does not require an Attribute Check.

It simply occupies space as a real obstruction.

---
}}
\page

{{pageNumber,auto}}
{{wide

### Example — Destroying a Barrier

A Barrier has **40 HP**, **0 Armor**, and **0 Evade**.

An enemy attacks the Barrier.

Because the Barrier has **0 Evade**, attacks against it use **TN 0** unless another rule says otherwise.

If the attack deals **15 damage**, the Barrier is reduced from **40 HP** to **25 HP**.

When the Barrier reaches **0 HP**, it is destroyed.

Destroyed Barrier spaces no longer occupy the battlefield.

---

### Wall Shape and Hexes

If the table or VTT uses hexes, the Wall occupies a number of connected hexes equal to the Power's listed area.

The Wall must be one connected shape.

The caster may bend, curve, or angle the Wall as needed, but every Wall hex must touch at least one other Wall hex.

The Wall cannot be split into separate disconnected pieces unless the Power explicitly allows it.

---
}}
\page

{{pageNumber,auto}}
{{wide

### Example — What a Barrier Cannot Do

A character creates a Barrier in front of an enemy.

The Barrier can occupy space and force enemies to interact with it as a real battlefield object.

The Barrier does not automatically:

- damage the enemy,
- push the enemy,
- knock the enemy prone,
- apply Root,
- apply Blight,
- trap the enemy permanently,
- create Damage Reduction,
- heal allies,
- become invisible,
- or create any other mechanical effect.

If the Power should do any of those things, the Power must pay for that effect separately.

---

### Example — Barrier as Battlefield Control

A character creates a wall between enemies and wounded allies.

The wall does not deal damage.

However, it changes the battlefield.

Enemies may need to:

- move around it,
- spend attacks destroying it,
- teleport past it,
- phase through it,
- destroy one or more Wall spaces,
- or wait until it expires.

This is the purpose of Construct and Terrain Actives.

They trade direct damage for position, protection, delay, and battlefield control.

}}

}}

\page

{{pageNumber,auto}}
{{wide

## Barrier Actives

---
:
---
:
<h3 id="ranged-barrier">
  Ranged Barrier
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Duration = 4 Rounds<br>
      4-Round persistent multiplier = ×2<br>
      Barrier HP = 1 PP per 1 HP<br><br>
      FORMULA<br>
      Final Cost = Range Cost + [(Radius Cost + Barrier HP) × 2]<br>
      Range is paid normally and is not multiplied.<br>
      Radius and Barrier HP are persistent payload and are multiplied by duration.<br><br>
      RANGE COSTS<br>
      12 m = 5 PP<br>
      16 m = 10 PP<br>
      20 m = 15 PP<br>
      24 m = 20 PP<br>
      28 m = 25 PP<br>
      32 m = 30 PP<br>
      36 m = 35 PP<br>
      40 m = 40 PP<br>
      44 m = 45 PP<br>
      48 m = 50 PP<br>
      52 m = 55 PP<br>
      56 m = 60 PP<br>
      60 m = 65 PP<br>
      64 m = 70 PP<br>
      68 m = 75 PP<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br><br>
      DESIGN RULE<br>
      This version is recalculated on curve with non-decreasing Barrier HP.<br>
      Range is paid first.<br>
      Radius is paid second.<br>
      Barrier HP is only increased when it can remain permanently afterward.<br>
      Barrier HP may stay the same or increase, but it may never decrease.<br>
      Radius may stay the same or increase, but it may never decrease.<br>
      Unused PP may remain unused if spending it would cause HP flicker later.<br><br>
      REMOVAL<br>
      Barrier spaces lose their printed HP when damaged. A separate explicitly granted dispelling effect may remove an ongoing Power only according to that effect's own rules. This Barrier entry does not grant a Dispel ability.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: no effect = 0 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + [(Radius 2 m (20) + 10 HP (10)) × 2] = 65 PP ≈ 60 target<br>
      L3 → Target 90 PP: Range 16 m (10) + [(Radius 2 m (20) + 22 HP (22)) × 2] = 94 PP ≈ 90 target<br>
      L4 → Target 120 PP: Range 20 m (15) + [(Radius 2 m (20) + 35 HP (35)) × 2] = 125 PP ≈ 120 target<br>
      L5 → Target 150 PP: Range 24 m (20) + [(Radius 2 m (20) + 42 HP (42)) × 2] = 144 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + [(Radius 2 m (20) + 42 HP (42)) × 2] = 149 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + [(Radius 3 m (50) + 42 HP (42)) × 2] = 214 PP ≈ 210 target<br>
      L8 → Target 240 PP: Range 36 m (35) + [(Radius 3 m (50) + 55 HP (55)) × 2] = 245 PP ≈ 240 target<br>
      L9 → Target 270 PP: Range 40 m (40) + [(Radius 3 m (50) + 65 HP (65)) × 2] = 270 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + [(Radius 3 m (50) + 65 HP (65)) × 2] = 275 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + [(Radius 3 m (50) + 65 HP (65)) × 2] = 280 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + [(Radius 4 m (90) + 65 HP (65)) × 2] = 365 PP ≈ 360 target<br>
      L13 → Target 390 PP: Range 56 m (60) + [(Radius 4 m (90) + 77 HP (77)) × 2] = 394 PP ≈ 390 target<br>
      L14 → Target 420 PP: Range 60 m (65) + [(Radius 4 m (90) + 90 HP (90)) × 2] = 425 PP ≈ 420 target<br>
      L15 → Target 450 PP: Range 64 m (70) + [(Radius 4 m (90) + 102 HP (102)) × 2] = 454 PP ≈ 450 target<br>
      L16 → Target 480 PP: Range 68 m (75) + [(Radius 4 m (90) + 115 HP (115)) × 2] = 485 PP ≈ 480 target<br><br>
      NOTES<br>
      The earlier version reduced Barrier HP when the radius increased.<br>
      This corrected version delays and anchors Barrier HP so it never decreases.<br>
      Level 1 has no effect because a legal 4-Round ranged barrier cannot fit the Level 1 Active budget.
    </span>
  </span>
</h3>

A ranged protective barrier that creates a temporary area of cover and obstruction.

**Minimum functional Power Level: 2.** A Barrier at Level 1 has no legal effect and therefore cannot be learned, purchased, or used at that Level. All existing Level 2+ values remain unchanged. The printed **+4 to +5 PP** overruns in the Barrier rows (PL 2, 3, 4, 7, 8, 12, 13, 14, 15, 16) are **explicitly approved minimum/progression exceptions**, not arithmetic errors. A separately approved deviation of up to +10 absolute PP is acceptable from PL 4 onward, but this does not authorize arbitrary new overspends.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Unavailable | — | — | — | Requires Power Level 2. | — |
| **2** | Active | 12 m | Radius 2 m | 4 Rounds | Create a Barrier with **10 HP**. | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a Barrier with **22 HP**. | — |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a Barrier with **35 HP**. | — |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a Barrier with **42 HP**. | — |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a Barrier with **42 HP**. | — |
| **7** | Active | 32 m | Radius 3 m | 4 Rounds | Create a Barrier with **42 HP**. | — |
| **8** | Active | 36 m | Radius 3 m | 4 Rounds | Create a Barrier with **55 HP**. | — |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create a Barrier with **65 HP**. | — |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create a Barrier with **65 HP**. | — |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a Barrier with **65 HP**. | — |
| **12** | Active | 52 m | Radius 4 m | 4 Rounds | Create a Barrier with **65 HP**. | — |
| **13** | Active | 56 m | Radius 4 m | 4 Rounds | Create a Barrier with **77 HP**. | — |
| **14** | Active | 60 m | Radius 4 m | 4 Rounds | Create a Barrier with **90 HP**. | — |
| **15** | Active | 64 m | Radius 4 m | 4 Rounds | Create a Barrier with **102 HP**. | — |
| **16** | Active | 68 m | Radius 4 m | 4 Rounds | Create a Barrier with **115 HP**. | — |
}}

\page

{{pageNumber,auto}}
{{wide
## Illusion Fields / Power Images

> **Design Rule:** Illusion Fields create sensory images or false battlefield information.  
> They are priced like Construct / Terrain Actives: Range + Radius + Duration + Illusion Strength.

An Illusion Field does not deal damage by default.  
It creates false sensory information inside an area.

---

### Illusion Strength

Illusion Strength measures how convincing, detailed, and hard to disbelieve the illusion is.

| **Illusion Strength** | **Cost** | **Effect** |
|:--:|:--:|---|
| **1** | 15 PP | Simple visual image or minor sensory falsehood. |
| **2** | 30 PP | Clear visual image with one additional sense. |
| **3** | 45 PP | Detailed image with multiple senses. |
| **4** | 60 PP | Complex scene with motion, sound, and reactive detail. |
| **5** | 75 PP | Highly convincing battlefield illusion. |
| **6** | 90 PP | Major illusion that can strongly mislead tactical decisions. |
| **7** | 105 PP | Advanced illusion with layered sensory complexity. |
| **8** | 120 PP | Extremely convincing illusion, suitable for high-level play. |

---

### Sensory Layers

An Illusion Field may include one or more sensory layers.

Common sensory layers:

- visual image,
- sound,
- smell,
- temperature impression,
- texture or touch impression,
- false motion,
- false number of creatures,
- false terrain,
- false barrier,
- false light or darkness.

A simple illusion normally uses one sensory layer.

A higher Illusion Strength may justify multiple layers without requiring separate pricing for each minor sensory detail.

---

### Illusion Check

A creature may attempt to disbelieve an Illusion Field when:

- it spends **1 Attack Action** to inspect it,
- it physically interacts with the illusion,
- the illusion behaves impossibly,
- or the GM decides the creature has a clear reason to doubt it.

The check is normally:

**Wits Attribute Check or Perception Skill Check against TN (8 × the creator's Mastery Rank) − 2**

On success, that creature recognizes the illusion as false.

On failure, that creature treats the illusion as real for the purpose of perception and decision-making.

---
}}

\page

{{pageNumber,auto}}
{{wide
### Illusion Limits

An Illusion Field cannot directly:

- deal damage,
- heal,
- apply Specials,
- physically block movement,
- create real cover,
- create real light or darkness,
- restrain a creature,
- force movement,
- or change actual terrain.

It may only make creatures believe those things are present.

If the illusion is meant to create a real mechanical penalty, such as concealment, attack penalties, fear, or false cover, that effect must be priced separately.

---

### Illusion Field Formula

**Final Cost = Range Cost + [(Radius Cost + Illusion Strength Cost) × Duration Modifier]**

Range is paid once and is not multiplied.

Radius and Illusion Strength are multiplied by duration.

---

### Power Image Rule

A Power Image is a specific kind of Illusion Field.

It creates an image of a creature, object, terrain feature, spell effect, wall, hazard, or other visible phenomenon.

A Power Image may appear to:

- move,
- speak,
- attack,
- cast,
- burn,
- Slow,
- bleed,
- threaten,
- guard an area,
- or imitate a battlefield object.

However, unless the Power pays for a real effect, the image remains only an illusion.

A false fire does not burn.  
A false wall does not stop movement.  
A false monster does not make real attacks.  
A false pit does not create a real hole.

---
}}

\page

{{pageNumber,auto}}
{{wide
### Illusion Design Rule

Illusions create decisions, not direct output.

They are strongest when they:

- waste enemy actions,
- hide real movement,
- create uncertainty,
- split attention,
- obscure intentions,
- or bait enemies into poor positioning.

Do not price Illusion Fields as damage Powers.

Do not attach free control effects to illusions.

If the illusion causes a real mechanical penalty, pay for that penalty separately.

}}

\page

{{pageNumber,auto}}
{{wide

## Ranged Power Image

---
:
<h3 id="ranged-power-image">
  Ranged Power Image
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power Image uses printed Range and Image Size<br>
      Duration = 4 Rounds<br>
      Duration Multiplier = ×2<br>
      Range is not multiplied<br><br>
      FORMULA<br>
      Final Cost = Range Cost + [(Image Size Cost + Image Tier Cost) ×2]<br><br>
      RANGE COSTS<br>
      8 m = 0 PP<br>
      12 m = 5 PP<br>
      16 m = 10 PP<br>
      20 m = 15 PP<br>
      24 m = 20 PP<br>
      28 m = 25 PP<br>
      32 m = 30 PP<br>
      36 m = 35 PP<br>
      40 m = 40 PP<br>
      44 m = 45 PP<br>
      48 m = 50 PP<br>
      52 m = 55 PP<br>
      56 m = 60 PP<br>
      60 m = 65 PP<br>
      64 m = 70 PP<br>
      68 m = 75 PP<br><br>
      IMAGE SIZE COSTS<br>
      Single Small Image = 0 PP<br>
      Single Human-Sized Image = 10 PP<br>
      Large Image / Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br>
      Radius 5 m = 140 PP<br><br>
      IMAGE TIER COSTS<br>
      Image I = 10 PP<br>
      Image II = 20 PP<br>
      Image III = 35 PP<br>
      Image IV = 55 PP<br>
      Image V = 80 PP<br>
      Image VI = 110 PP<br>
      Image VII = 145 PP<br><br>
      SCALING RULE<br>
      This is an Illusion-first Active.<br>
      Image Tier is the primary scaling axis.<br>
      Image Size is the secondary scaling axis.<br>
      Images do not create real matter, damage, barriers, terrain, summons, or Specials.<br>
      Image Tier and Image Size may stay the same or increase, but they may never decrease.<br><br>
      CALCULATION<br>
      L1 → Range 8 m (0) + [(Single Small Image (0) + Image I (10)) ×2] = 20 PP<br>
      L2 → Range 12 m (5) + [(Single Human-Sized Image (10) + Image I (10)) ×2] = 45 PP<br>
      L3 → Range 16 m (10) + [(Single Human-Sized Image (10) + Image II (20)) ×2] = 70 PP<br>
      L4 → Range 20 m (15) + [(Large Image / Radius 2 m (20) + Image II (20)) ×2] = 95 PP<br>
      L5 → Range 24 m (20) + [(Large Image / Radius 2 m (20) + Image III (35)) ×2] = 130 PP<br>
      L6 → Range 28 m (25) + [(Large Image / Radius 2 m (20) + Image III (35)) ×2] = 135 PP<br>
      L7 → Range 32 m (30) + [(Large Image / Radius 2 m (20) + Image IV (55)) ×2] = 180 PP<br>
      L8 → Range 36 m (35) + [(Radius 3 m (50) + Image IV (55)) ×2] = 245 PP above target, so Radius 2 m is retained = 185 PP<br>
      L9 → Range 40 m (40) + [(Radius 3 m (50) + Image IV (55)) ×2] = 250 PP<br>
      L10 → Range 44 m (45) + [(Radius 3 m (50) + Image IV (55)) ×2] = 255 PP<br>
      L11 → Range 48 m (50) + [(Radius 3 m (50) + Image V (80)) ×2] = 310 PP<br>
      L12 → Range 52 m (55) + [(Radius 3 m (50) + Image V (80)) ×2] = 315 PP<br>
      L13 → Range 56 m (60) + [(Radius 3 m (50) + Image VI (110)) ×2] = 380 PP<br>
      L14 → Range 60 m (65) + [(Radius 3 m (50) + Image VI (110)) ×2] = 385 PP<br>
      L15 → Range 64 m (70) + [(Radius 4 m (90) + Image VI (110)) ×2] = 470 PP above target, so Radius 3 m is retained = 390 PP<br>
      L16 → Range 68 m (75) + [(Radius 3 m (50) + Image VII (145)) ×2] = 465 PP<br><br>
      NOTES<br>
      Images begin as simple visual illusions and scale into multi-sense and battlefield-scale illusions.<br>
      Radius increases are delayed because the illusion lasts 4 Rounds.<br>
      Image VII appears at Level 16 and represents a large complex battlefield illusion, but it is still not physically real.
    </span>
  </span>
</h3>

A ranged illusion Active that creates false sensory information for 4 Rounds.

---
:
**Requirement:** None

---
:
| **Level** | **Type** | **Range** | **AoE / Size** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active | 8 m | Single Small Image | 4 Rounds | Create **Image I**: a simple static visual image. |
| **2** | Active | 12 m | Single Human-Sized Image | 4 Rounds | Create **Image I**: a simple static visual image. |
| **3** | Active | 16 m | Single Human-Sized Image | 4 Rounds | Create **Image II**: a moving visual image. |
| **4** | Active | 20 m | Large Image / Radius 2 m | 4 Rounds | Create **Image II**: a moving visual image. |
| **5** | Active | 24 m | Large Image / Radius 2 m | 4 Rounds | Create **Image III**: a sight and sound image. |
| **6** | Active | 28 m | Large Image / Radius 2 m | 4 Rounds | Create **Image III**: a sight and sound image. |
| **7** | Active | 32 m | Large Image / Radius 2 m | 4 Rounds | Create **Image IV**: a complex creature or object image. |
| **8** | Active | 36 m | Large Image / Radius 2 m | 4 Rounds | Create **Image IV**: a complex creature or object image. |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create **Image IV**: a complex creature or object image. |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create **Image IV**: a complex creature or object image. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create **Image V**: a multi-sense image. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create **Image V**: a multi-sense image. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create **Image VI**: a small scene with several moving parts. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create **Image VI**: a small scene with several moving parts. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create **Image VI**: a small scene with several moving parts. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create **Image VII**: a complex battlefield illusion. |

}}

\page

{{pageNumber,auto}}
{{wide

## Core Attack Power Templates

> **Design Rule:** These are the core Active attack templates for clean attacks, AoE attacks, Split Attacks, and Autofire.  
> Their printed tables use the weapon-based **Martial baseline**. Melee versions remain Martial; legal Ranged versions may instead use Spell delivery under the Catalogue Delivery Rule.

These templates are still **Actives**. Their Technical Reference does not change when a Ranged version changes delivery.

---

### Weapon Damage Rule

If a Power says **weapon damage**, the attack includes the normal damage of the weapon or unarmed attack used to deliver the Power.

Additional damage from the Power is listed as **+Xd8 damage**.

Example:

If a Power says:

> weapon damage + **4d8 damage**

then the Damage Pool is:

> weapon damage + **4d8**

The weapon damage is not replaced.  
It is added to the Power's bonus damage.


For **Spell delivery**, weapon damage is not part of the Power's damage pool. Keep all printed **+Xd8 Power damage** and add Spell Focus damage when legal under the Core Rules.

---

### Single Target Attack Rule

A Single Target Attack is resolved as one normal weapon attack.

To use a Single Target Attack:

1. Choose one valid target within the Power's Range.
2. Roll the normal Attack Pool for the weapon or unarmed attack used.
3. Compare the result to the target's defense as normal.
4. If the attack hits, roll the listed Damage Pool.
5. The target takes the full weapon damage and the Power's listed bonus damage.

A Single Target Attack has only one target.

It does not split damage.  
It does not create an AoE.  
It does not hit additional creatures unless another rule says so.

---
}}
\page

{{pageNumber,auto}}
{{wide

### AoE Attack Rule

An AoE Attack is one attack that affects an area.

When you use an AoE Attack:

1. Choose the AoE placement.
2. Roll **one Attack Roll** for the entire AoE.
3. Compare that same final result separately against the **Evade of each valid creature** in the area.
4. Each creature whose Evade is met or exceeded would be hit independently of every other creature.
5. A creature may use legal Attack-Trigger defenses that modify its own Evade before its hit is finalized.
6. A creature that would still be hit may use **Dive for Cover** before damage or payload is applied.
7. Every creature that remains hit receives the Power's **full printed payload**.

For an AoE Attack, full payload includes:

- full weapon damage,
- the Power's full listed bonus damage,
- the Power's full listed Specials,
- and applicable offensive buffs and riders.

Damage and Specials are not divided or reduced because several creatures were hit.

---

### Melee AoE Placement

A Melee AoE Attack is centered on the attacker.

The attacker is the center of the AoE. Every valid creature around the attacker within the listed Radius is checked against the same Attack Roll. The attacker does not hit themselves unless the Power explicitly says so.

---

### Ranged AoE Placement

A Ranged AoE Attack is centered on a chosen target point within the Power's printed Range.

Every valid creature inside the listed Radius is checked separately against the same Attack Roll. The center point determines placement only and does not determine whether any creature is hit.

---
}}
\page

{{pageNumber,auto}}
{{wide

### Split Attack Rule

Split Attack divides the delivery of one Power use between multiple targets. It does not divide the damage of successful attacks.

When you use a Split Attack:

1. Choose up to the listed number of **different targets**.
2. Split the roll Pool required by the delivery between those targets before rolling.
   - Martial delivery splits the **Attack Pool**.
   - Spell delivery splits the **Casting Pool**.
3. If using combat Raises, declare one shared Raise count for this Power. Every split uses that same raised TN and, after the split rolls resolve, one shared choice of Raise effects.
4. Roll each split separately.
5. Resolve each split against the defense required by that delivery:
   - Martial delivery against **Evade**.
   - Spell delivery against the target's **Final Spell TN**.
6. Each successful split resolves the Power's **full Damage Pool and full applicable payload**, including the common Raise choice, against that target. Missed splits have no effect.

For Martial delivery, each successful split deals:

> **full Weapon Damage + the Power's full listed bonus Damage**

For Spell delivery, weapon damage is omitted. Each successful split deals:

> **the Power's full listed Spell Damage + any legal Spell Focus Damage**

Any Specials, eligible offensive effects, and other parts of the Power's payload apply normally to each successful split unless the Power explicitly says otherwise.

A creature may not be targeted more than once by the same Split Attack unless the Power explicitly allows it.

---

**Split Attack splits accuracy, not damage.**

The attacker divides their ability to deliver the attack between several targets. A successful hit still carries the full force of the Power.

Split Attack therefore increases targeting flexibility at the cost of making each individual attack harder to land.

---

#### Split Spells

Failed splits do not cancel successful splits.

A Split Spell fizzles only if **none** of its split Casting Rolls reaches the Spell Base TN.

A split that reaches the **Spell Base TN** but fails to reach that target's **Final Spell TN** is **resisted**, not fizzled.

Successful splits resolve normally against their respective targets.

---

### Autofire Rule — Stepped Attack Chain

**Autofire is not AoE.** Autofire is one Ranged Power use that declares an ordered series of **attack slots** up to the Power's printed **Attack Capacity**. A creature may appear more than once (A → B → A or A → A → A).

Before rolling:

1. Declare the ordered list of attack slots, up to the Power's Attack Capacity.
2. Every slot must be within the Power's printed Range.
3. Every slot after the first must be within **4 m of the preceding slot's target** (repeating the same creature is legal and satisfies this).

Then make **one roll** using the Power's delivery:

- Martial delivery makes one ranged **Attack Roll**.
- Spell delivery makes one **Casting Roll**.

Resolve the declared slots **in order**. For slot *i* (starting at 1):

> **TN(i) = target's applicable Evade or Final Spell TN + 4 × (i − 1) + 4 × Declared Paid Raises.**

*(Autofire — Stepped Attack Chain.)*

The cumulative +4 steps are **hit thresholds, not Paid Raises**; they grant no Raise damage or Special effects and cannot be removed by Intellect Free Raises. Ordinary Paid Raises are declared once for the whole use and add +4 per Raise to **every** slot.

If the roll fails to affect a slot, that slot misses or resists and **Autofire ends immediately**. Later slots are not checked. Successful earlier slots remain hits.

- **Reaction: Evade** applies only to Martial Autofire.
- Legal Spell defenses apply to Spell Autofire.
- **Dive for Cover cannot be used against Autofire.**

Every successful slot is a **separate hit**, even against the same creature. Roll matching **Weapon Damage (Martial)** or **Spell Focus Damage (Spell)** together with the Power's eligible Damage Dice **once**; reuse that same damage result for every successful hit. Resolve Armor, Damage Reduction, Damage Negation, Temporary HP, Special Negation and other legal defenses **per hit**.

If a Spell Autofire Casting Roll is below Spell Base TN, the Spell fizzles. If it reaches Spell Base TN but an individual slot fails its stepped Final Spell TN, the Spell was cast and the chain ends normally.

Autofire Attack Capacity costs **30 PP per additional attack slot** after the first.

Additional Autofire slots require **no target-count Raises**. Normal Raises may still be used for legal Raise effects of the Power.

---
:
}}
\page

{{pageNumber,auto}}
{{wide

### Example: Single Target Attack

A character uses a Level 4 Ranged Single Attack.

The Power says:

> Make one ranged weapon attack. On hit, deal weapon damage + **7d8 damage**.

The character chooses one enemy within range and rolls one ranged Attack Roll.

On a hit, the target takes:

> weapon damage + **7d8 damage**

No other creature is affected.

---

### Example: Melee AoE Attack

A character uses **Melee AoE Attack** at Level 6:

> Range: **Self**  
> AoE: **Radius 4 m**  
> Effect: weapon damage + **6d8 damage**

The character rolls one AoE Attack Roll. The same result is compared separately against the Evade of every valid enemy within 4 m.

An enemy whose Evade is not reached is not hit. An enemy that would be hit may use a legal Evade Reaction and, if still hit and a Reaction remains available, may use **Dive for Cover**.

Every enemy that remains hit takes:

> weapon damage + **6d8 damage**

A miss against one creature does not change the result against any other creature.

}}
\page

{{pageNumber,auto}}
{{wide

### Example: Ranged AoE Attack

A character uses **Ranged AoE Attack** at Level 5:

> Range: **24 m**  
> AoE: **Radius 4 m**  
> Effect: weapon damage + **3d8 damage**

The character chooses a point within 24 m and rolls one AoE Attack Roll.

Three enemies are inside the Radius. The same Attack Roll is compared separately against all three Evade values. Two are hit and one is missed.

Either hit creature may use its own legal Evade Reaction or **Dive for Cover** if available.

Every creature that remains hit takes:

> weapon damage + **3d8 damage**

The attack does not make separate Attack Rolls against the creatures in the area.

}}
\page

{{pageNumber,auto}}
{{wide

### Example — Split Attack

A character uses a Level 7 Melee Split Attack with an Attack Pool of **12 dice**. The character divides the Pool into **6 dice against Enemy A** and **6 dice against Enemy B**. Each split is rolled against its target. If both hit, each receives a separate roll of **full Weapon Damage plus the Power's full bonus Damage**. With one declared Paid Raise, both TNs rise by **4**; after the rolls, the player chooses one Raise effect and applies that same effect to every successful split. The character splits accuracy, not damage.

}}
\page

{{pageNumber,auto}}
{{wide

### Example — Autofire

A character uses a Level 8 Ranged Autofire Power. Attack Capacity **5**. It deals weapon damage + **5d8 damage** on every successful hit.

Before rolling, the character declares three attack slots:

> A → B → A

All slots are within Range. Slot 2 is within 4 m of A; slot 3 repeats A.

All three start from Evade **10**. Required TNs before Paid Raises: **10 / 14 / 18**.

The character makes one ranged Attack Roll and gets **16**.

- Slot 1 vs A (TN 10): hit.
- Slot 2 vs B (TN 14): hit.
- Slot 3 vs A (TN 18): miss — chain ends.

The character rolls weapon damage + **5d8** once and applies that same raw result as two separate hits (one to A, one to B). Each hit resolves its own defenses. Autofire steps grant no Raise effects. Dive for Cover cannot be used.

}}
\page

{{pageNumber,auto}}
{{wide

## Single Target Attacks

---
:
<h3 id="melee-single-target-attack">
  Melee Single Target Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      +1d8 Damage = 15 PP<br><br>
      CALCULATION<br>
      L1 → +2d8 Damage (30) = 30 PP<br>
      L2 → +4d8 Damage (60) = 60 PP<br>
      L3 → +6d8 Damage (90) = 90 PP<br>
      L4 → +8d8 Damage (120) = 120 PP<br>
      L5 → +10d8 Damage (150) = 150 PP<br>
      L6 → +12d8 Damage (180) = 180 PP<br>
      L7 → +14d8 Damage (210) = 210 PP<br>
      L8 → +16d8 Damage (240) = 240 PP<br>
      L9 → +18d8 Damage (270) = 270 PP<br>
      L10 → +20d8 Damage (300) = 300 PP<br>
      L11 → +22d8 Damage (330) = 330 PP<br>
      L12 → +24d8 Damage (360) = 360 PP<br>
      L13 → +26d8 Damage (390) = 390 PP<br>
      L14 → +28d8 Damage (420) = 420 PP<br>
      L15 → +30d8 Damage (450) = 450 PP<br>
      L16 → +32d8 Damage (480) = 480 PP<br><br>
      NOTES<br>
      This is the clean melee weapon attack template.<br>
      It makes one melee weapon attack and adds the listed bonus damage to normal weapon damage.
    </span>
  </span>
</h3>

A clean melee weapon attack with no Special, rider, movement, or secondary effect.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **2d8 damage**. | — |
| **2** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **4d8 damage**. | — |
| **3** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **6d8 damage**. | — |
| **4** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **8d8 damage**. | — |
| **5** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **10d8 damage**. | — |
| **6** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **12d8 damage**. | — |
| **7** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **14d8 damage**. | — |
| **8** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **16d8 damage**. | — |
| **9** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **18d8 damage**. | — |
| **10** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **20d8 damage**. | — |
| **11** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **22d8 damage**. | — |
| **12** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **24d8 damage**. | — |
| **13** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **26d8 damage**. | — |
| **14** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **28d8 damage**. | — |
| **15** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **30d8 damage**. | — |
| **16** | Active | Melee Reach | — | Instant | Make **one melee weapon attack**. On hit, deal weapon damage + **32d8 damage**. | — |

---
:
<h3 id="ranged-single-target-attack">
  Ranged Single Target Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      +1d8 Damage = 15 PP<br><br>
      CALCULATION<br>
      L1 → Range 8 m (0) + +2d8 Damage (30) = 30 PP<br>
      L2 → Range 12 m (5) + +3d8 Damage (45) = 50 PP<br>
      L3 → Range 16 m (10) + +5d8 Damage (75) = 85 PP<br>
      L4 → Range 20 m (15) + +7d8 Damage (105) = 120 PP<br>
      L5 → Range 24 m (20) + +8d8 Damage (120) = 140 PP<br>
      L6 → Range 28 m (25) + +10d8 Damage (150) = 175 PP<br>
      L7 → Range 32 m (30) + +12d8 Damage (180) = 210 PP<br>
      L8 → Range 36 m (35) + +13d8 Damage (195) = 230 PP<br>
      L9 → Range 40 m (40) + +15d8 Damage (225) = 265 PP<br>
      L10 → Range 44 m (45) + +17d8 Damage (255) = 300 PP<br>
      L11 → Range 48 m (50) + +18d8 Damage (270) = 320 PP<br>
      L12 → Range 52 m (55) + +20d8 Damage (300) = 355 PP<br>
      L13 → Range 56 m (60) + +22d8 Damage (330) = 390 PP<br>
      L14 → Range 60 m (65) + +23d8 Damage (345) = 410 PP<br>
      L15 → Range 64 m (70) + +25d8 Damage (375) = 445 PP<br>
      L16 → Range 68 m (75) + +27d8 Damage (405) = 480 PP<br><br>
      NOTES<br>
      This is the clean ranged weapon attack template.<br>
      It pays Range every level, so its bonus damage trails behind the melee version.
    </span>
  </span>
</h3>

A clean ranged weapon attack with no Special, rider, movement, or secondary effect.

---
:
**Martial Requirement:** Ranged Weapon or Thrown Weapon  
**Spell Delivery:** The Martial weapon requirement is replaced by the normal Spell delivery rules.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **2d8 damage**. | — |
| **2** | Active | 12 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **3d8 damage**. | — |
| **3** | Active | 16 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **5d8 damage**. | — |
| **4** | Active | 20 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **7d8 damage**. | — |
| **5** | Active | 24 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **8d8 damage**. | — |
| **6** | Active | 28 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **10d8 damage**. | — |
| **7** | Active | 32 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **12d8 damage**. | — |
| **8** | Active | 36 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **13d8 damage**. | — |
| **9** | Active | 40 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **15d8 damage**. | — |
| **10** | Active | 44 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **17d8 damage**. | — |
| **11** | Active | 48 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **18d8 damage**. | — |
| **12** | Active | 52 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **20d8 damage**. | — |
| **13** | Active | 56 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **22d8 damage**. | — |
| **14** | Active | 60 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **23d8 damage**. | — |
| **15** | Active | 64 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **25d8 damage**. | — |
| **16** | Active | 68 m | — | Instant | Make **one ranged weapon attack**. On hit, deal weapon damage + **27d8 damage**. | — |

}}

\page

{{pageNumber,auto}}
{{wide

## AoE Attacks

---
:
<h3 id="melee-aoe-attack">
  Melee AoE Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Self; no Range cost<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      +1d8 Damage = 15 PP<br><br>
      DESIGN STRUCTURE<br>
      Every successful target receives full Weapon Damage plus the full listed Power damage.<br>
      One AoE Attack Roll is compared separately against each creature's Evade. Dive for Cover is resolved before payload.<br>
      Damage never decreases; unused PP is allowed when a later Radius increase must be protected.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20) + Damage +0d8 (0) = 20 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Damage +2d8 (30) = 50 PP<br>
      L3 → Target 90 PP: Radius 3 m (50) + Damage +2d8 (30) = 80 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Damage +4d8 (60) = 110 PP<br>
      L5 → Target 150 PP: Radius 4 m (80) + Damage +4d8 (60) = 140 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Damage +6d8 (90) = 170 PP<br>
      L7 → Target 210 PP: Radius 5 m (120) + Damage +6d8 (90) = 210 PP<br>
      L8 → Target 240 PP: Radius 5 m (120) + Damage +7d8 (105) = 225 PP<br>
      L9 → Target 270 PP: Radius 6 m (165) + Damage +7d8 (105) = 270 PP<br>
      L10 → Target 300 PP: Radius 6 m (165) + Damage +7d8 (105) = 270 PP<br>
      L11 → Target 330 PP: Radius 7 m (220) + Damage +7d8 (105) = 325 PP<br>
      L12 → Target 360 PP: Radius 7 m (220) + Damage +7d8 (105) = 325 PP<br>
      L13 → Target 390 PP: Radius 8 m (280) + Damage +7d8 (105) = 385 PP<br>
      L14 → Target 420 PP: Radius 8 m (280) + Damage +9d8 (135) = 415 PP<br>
      L15 → Target 450 PP: Radius 8 m (280) + Damage +11d8 (165) = 445 PP<br>
      L16 → Target 480 PP: Radius 8 m (280) + Damage +13d8 (195) = 475 PP<br>
<br>      NOTES<br>
      Active Buff: Damage applies its full listed bonus to every successfully hit creature.<br>
      Radius 8 m remains the standard player cap.
    </span>
  </span>
</h3>

A self-centered weapon sweep that hits everything around the attacker.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 2 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage. | — |
| **2** | Active | Self | Radius 2 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **2d8 damage**. | — |
| **3** | Active | Self | Radius 3 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **2d8 damage**. | — |
| **4** | Active | Self | Radius 3 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **5** | Active | Self | Radius 4 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **6** | Active | Self | Radius 4 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **6d8 damage**. | — |
| **7** | Active | Self | Radius 5 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **6d8 damage**. | — |
| **8** | Active | Self | Radius 5 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **9** | Active | Self | Radius 6 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **10** | Active | Self | Radius 6 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **11** | Active | Self | Radius 7 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **12** | Active | Self | Radius 7 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **13** | Active | Self | Radius 8 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **7d8 damage**. | — |
| **14** | Active | Self | Radius 8 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **9d8 damage**. | — |
| **15** | Active | Self | Radius 8 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **11d8 damage**. | — |
| **16** | Active | Self | Radius 8 m | Instant | Make one melee AoE attack. Every creature hit takes weapon damage + **13d8 damage**. | — |

---
}}
\page

{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack">
  Ranged AoE Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Range progression = +4 m per level; Range cost = +5 PP per +4 m after 8 m<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      +1d8 Damage = 15 PP<br><br>
      DESIGN STRUCTURE<br>
      Every successful target receives full Weapon Damage plus the full listed Power damage.<br>
      One AoE Attack Roll is compared separately against each creature's Evade. Dive for Cover is resolved before payload.<br>
      Damage never decreases; unused PP is allowed when a later Radius increase must be protected.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 2 m (20) + Damage +0d8 (0) = 20 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Damage +2d8 (30) = 55 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 3 m (50) + Damage +2d8 (30) = 90 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Damage +3d8 (45) = 110 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 4 m (80) + Damage +3d8 (45) = 145 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Damage +4d8 (60) = 165 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 5 m (120) + Damage +4d8 (60) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 5 m (120) + Damage +4d8 (60) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 6 m (165) + Damage +4d8 (60) = 265 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 6 m (165) + Damage +4d8 (60) = 270 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 7 m (220) + Damage +4d8 (60) = 330 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 7 m (220) + Damage +5d8 (75) = 350 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 7 m (220) + Damage +5d8 (75) = 355 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 8 m (280) + Damage +5d8 (75) = 420 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 8 m (280) + Damage +6d8 (90) = 440 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 8 m (280) + Damage +8d8 (120) = 475 PP<br>
<br>      NOTES<br>
      Active Buff: Damage applies its full listed bonus to every successfully hit creature.<br>
      Radius 8 m remains the standard player cap.
    </span>
  </span>
</h3>

A ranged weapon attack that detonates across an area.

---
:
**Martial Requirement:** Ranged Weapon or Thrown Weapon  
**Spell Delivery:** The Martial weapon requirement is replaced by the normal Spell delivery rules.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 2 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage. | — |
| **2** | Active | 12 m | Radius 2 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **2d8 damage**. | — |
| **3** | Active | 16 m | Radius 3 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **2d8 damage**. | — |
| **4** | Active | 20 m | Radius 3 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **3d8 damage**. | — |
| **5** | Active | 24 m | Radius 4 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **3d8 damage**. | — |
| **6** | Active | 28 m | Radius 4 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **7** | Active | 32 m | Radius 5 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **8** | Active | 36 m | Radius 5 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **9** | Active | 40 m | Radius 6 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **10** | Active | 44 m | Radius 6 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **11** | Active | 48 m | Radius 7 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **4d8 damage**. | — |
| **12** | Active | 52 m | Radius 7 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **5d8 damage**. | — |
| **13** | Active | 56 m | Radius 7 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **5d8 damage**. | — |
| **14** | Active | 60 m | Radius 8 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **5d8 damage**. | — |
| **15** | Active | 64 m | Radius 8 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **6d8 damage**. | — |
| **16** | Active | 68 m | Radius 8 m | Instant | Make one ranged AoE attack. Every creature hit takes weapon damage + **8d8 damage**. | — |

---
}}
\page

{{pageNumber,auto}}
{{wide
<h3 id="melee-split-weapon-attack">
  Melee Split Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      Split Attack = 30 PP per additional attack<br>
      +1d8 Damage = 15 PP<br><br>
      ATTACK COUNT<br>
      All levels → up to 2 attacks<br><br>
      NOTES<br>
      Each successful split deals full listed damage.<br>
      The attacker splits the Attack Pool before rolling.<br>
      Roll the full Damage Pool separately for each successful hit.
    </span>
  </span>
</h3>

A melee technique that divides one attack sequence between multiple targets.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage. | — |
| **2** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **2d8 damage**. | — |
| **3** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **4d8 damage**. | — |
| **4** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **6d8 damage**. | — |
| **5** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **8d8 damage**. | — |
| **6** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **10d8 damage**. | — |
| **7** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **10d8 damage**. | — |
| **8** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **12d8 damage**. | — |
| **9** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **14d8 damage**. | — |
| **10** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **16d8 damage**. | — |
| **11** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **18d8 damage**. | — |
| **12** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **20d8 damage**. | — |
| **13** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **20d8 damage**. | — |
| **14** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **22d8 damage**. | — |
| **15** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **24d8 damage**. | — |
| **16** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **26d8 damage**. | — |

}}

\page

{{pageNumber,auto}}
{{wide

---
:
<h3 id="ranged-split-weapon-attack">
  Ranged Split Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Split Attack = 30 PP per additional attack<br>
      +1d8 Damage = 15 PP<br><br>
      ATTACK COUNT<br>
      All levels → up to 2 attacks<br><br>
      NOTES<br>
      Each successful split deals full listed damage.<br>
      The Ranged version pays Range every level, so its bonus damage trails behind the melee version.
    </span>
  </span>
</h3>

A ranged technique that divides one attack sequence between multiple targets.

---
:
**Martial Requirement:** Ranged Weapon or Thrown Weapon  
**Spell Delivery:** The Martial weapon requirement is replaced by the normal Spell delivery rules.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage. | — |
| **2** | Active | 12 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **1d8 damage**. | — |
| **3** | Active | 16 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **3d8 damage**. | — |
| **4** | Active | 20 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **5d8 damage**. | — |
| **5** | Active | 24 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **6d8 damage**. | — |
| **6** | Active | 28 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **8d8 damage**. | — |
| **7** | Active | 32 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **8d8 damage**. | — |
| **8** | Active | 36 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **9d8 damage**. | — |
| **9** | Active | 40 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **11d8 damage**. | — |
| **10** | Active | 44 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **13d8 damage**. | — |
| **11** | Active | 48 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **14d8 damage**. | — |
| **12** | Active | 52 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **16d8 damage**. | — |
| **13** | Active | 56 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **16d8 damage**. | — |
| **14** | Active | 60 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **17d8 damage**. | — |
| **15** | Active | 64 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **19d8 damage**. | — |
| **16** | Active | 68 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Each successful attack rolls its full Damage Pool equal to weapon damage + **21d8 damage**. | — |

}}

\page

{{pageNumber,auto}}
{{wide


---

<h3 id="ranged-autofire-weapon-attack">
  Ranged Autofire
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Range progression = +4 m per level; Range cost = +5 PP per +4 m after 8 m<br>
      Autofire Target Capacity = 30 PP per additional target<br>
      +1d8 Damage = 15 PP<br><br>
      DESIGN STRUCTURE<br>
      Declare ordered attack slots before rolling. Same creature may repeat. Every slot after the first must be within 4 m of the previous slot's target.<br>
      Make one Attack Roll. Slot i TN = Defense + 4×(i−1) + 4×Paid Raises. Steps are not Paid Raises. First miss ends the chain; earlier hits remain.<br>
      Autofire requires no Raises for additional slots.<br>
      One shared Damage Roll (Weapon or Spell Focus + Power dice) is reused for every successful slot; each slot is a separate hit with its own mitigation.<br>
      Reaction: Evade can turn a hit into a miss and end the chain. Dive for Cover cannot be used.<br><br>
      AUTOFIRE ATTACK CAPACITY<br>
      L1–2 → 2 attack slots<br>
      L3–4 → 3 attack slots<br>
      L5–6 → 4 attack slots<br>
      L7–8 → 5 attack slots<br>
      L9–10 → 6 attack slots<br>
      L11–12 → 7 attack slots<br>
      L13–14 → 8 attack slots<br>
      L15–16 → 9 attack slots<br>
<br>      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Autofire +1 targets (30) + Damage +0d8 (0) = 30 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Autofire +1 targets (30) + Damage +1d8 (15) = 50 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Autofire +2 targets (60) + Damage +1d8 (15) = 85 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Autofire +2 targets (60) + Damage +2d8 (30) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Autofire +3 targets (90) + Damage +2d8 (30) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Autofire +3 targets (90) + Damage +4d8 (60) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Autofire +4 targets (120) + Damage +4d8 (60) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Autofire +4 targets (120) + Damage +5d8 (75) = 230 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Autofire +5 targets (150) + Damage +5d8 (75) = 265 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Autofire +5 targets (150) + Damage +6d8 (90) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Autofire +6 targets (180) + Damage +6d8 (90) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Autofire +6 targets (180) + Damage +8d8 (120) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Autofire +7 targets (210) + Damage +8d8 (120) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Autofire +7 targets (210) + Damage +9d8 (135) = 410 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Autofire +8 targets (240) + Damage +9d8 (135) = 445 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Autofire +8 targets (240) + Damage +11d8 (165) = 480 PP<br>
<br>      NOTES<br>
      Damage is held at some levels so it never decreases when Target Capacity increases.<br>
      The structure remains weaker than a Single Attack against one target because a substantial part of its budget is permanently invested in Target Capacity.
    </span>
  </span>
</h3>

A ranged stepped attack chain: ordered attack slots, one shared Attack Roll with cumulative +4 TN per later slot, one shared Damage Roll reused for every successful hit.

---
:
**Requirement:** Ranged Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Autofire up to **2 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage. | — |
| **2** | Active | 12 m | — | Instant | Autofire up to **2 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **1d8 damage**. | — |
| **3** | Active | 16 m | — | Instant | Autofire up to **3 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **1d8 damage**. | — |
| **4** | Active | 20 m | — | Instant | Autofire up to **3 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **2d8 damage**. | — |
| **5** | Active | 24 m | — | Instant | Autofire up to **4 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **2d8 damage**. | — |
| **6** | Active | 28 m | — | Instant | Autofire up to **4 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **4d8 damage**. | — |
| **7** | Active | 32 m | — | Instant | Autofire up to **5 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **4d8 damage**. | — |
| **8** | Active | 36 m | — | Instant | Autofire up to **5 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **5d8 damage**. | — |
| **9** | Active | 40 m | — | Instant | Autofire up to **6 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **5d8 damage**. | — |
| **10** | Active | 44 m | — | Instant | Autofire up to **6 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **6d8 damage**. | — |
| **11** | Active | 48 m | — | Instant | Autofire up to **7 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **6d8 damage**. | — |
| **12** | Active | 52 m | — | Instant | Autofire up to **7 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **8d8 damage**. | — |
| **13** | Active | 56 m | — | Instant | Autofire up to **8 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **8d8 damage**. | — |
| **14** | Active | 60 m | — | Instant | Autofire up to **8 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **9d8 damage**. | — |
| **15** | Active | 64 m | — | Instant | Autofire up to **9 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **9d8 damage**. | — |
| **16** | Active | 68 m | — | Instant | Autofire up to **9 attack slots** (same creature may repeat). Each next slot must be within **4 m** of the previous. One Attack Roll; TN(i) = Evade + 4×(i−1) + Paid Raises. First miss ends the chain. One shared Damage Roll; every successful slot takes weapon damage + **11d8 damage**. | — |

---
}}
\page

{{pageNumber,auto}}
{{wide
## Mental Powers

Mental Powers affect thought, perception, emotion, memory, or the mind itself.

The core Mental Power catalogue contains four distinct Actives:

- **Mental Attack** harms the mind.
- **Mind Illusion** changes what a creature perceives.
- **Mind Probe** reads thoughts, intentions, and memories.
- **Mental Control** imposes temporary noncombat instructions, attitudes, or beliefs on weaker creatures.

Mental Powers are not normal weapon attacks.

Mental Powers do not target Evade unless a Power explicitly says otherwise.

Mental Powers are not reduced by Armor unless a Power explicitly says otherwise.

Most Mental Powers require **Telepathic Access**.

---

### Telepathic Access

Telepathic Access represents the ability to reach and affect another creature's mind.

A creature has Telepathic Access to a target if one of the following is true:

- the creature has a **Telepathy Passive** that reaches a target it can perceive or whose location it knows,
- the target is part of the creature's willing Mind Link,
- the target is already affected by one of the creature's Mental Powers,
- the Power explicitly creates its own Telepathic Access.

Telepathic Access alone reveals no thoughts, memories, identity, or hidden information.

Mental Attack, Mind Illusion, Mind Probe, and Mental Control require Telepathic Access unless the Power explicitly says otherwise.

A Mental Power's level cannot exceed the user's **Telepathy Passive** level unless a rule explicitly says otherwise.

Telekinesis does not require Telepathic Access unless the Power explicitly says otherwise.

---

### Mental Power Resolution

Mental Attack, Mind Illusion, Mind Probe, and Mental Control are resolved like Spells, but their **Spell Base TN is increased by +4**.

First determine the user's normal Spell Base TN from Mastery Rank, then increase it by +4:

`Mental Power Base TN = Spell Base TN + 4`

For a Mental Power that affects another creature, add that creature's Spell Resistance:

`Final Mental Power TN = Mental Power Base TN + Target Spell Resistance`

When a Mental Power affects more than one creature, make **one** roll and compare that same result separately against each creature's Final Mental Power TN.

A creature that knowingly accepts the Mental Power may treat its Spell Resistance as **0** against it. Mental Power Base TN is never reduced this way.

If the Mental Power roll is below Mental Power Base TN, the Power fizzles. If the roll reaches Mental Power Base TN but does not reach a creature's Final Mental Power TN, the Power was successfully executed but that creature resists it.

If the roll reaches a creature's Final Mental Power TN, the Power's listed effect resolves for that creature.

The target does not make an automatic second roll. A later Intellect or Wits Attribute Check occurs only if the Power explicitly grants a disbelief, break, or intrusion response.

---

}}


\page

{{pageNumber,auto}}
{{wide
## Mental Attack

Mental Attack Powers harm the mind directly.

Mental Attacks require Telepathic Access unless the Power explicitly says otherwise.

Mental Attacks use the normal **Final Mental Power TN**.

Mental Attacks do not target Evade.

Mental Attack damage ignores Armor.

Mental Attack damage costs **30 PP per +1d8 Mental Damage**.

If a Mental Attack also applies a Special, the Special must be paid normally.

If a Mental Attack also applies a control effect, the control effect must be paid as a separate rider or defined by the Power.

On a successful Mental Power roll, the target takes the full listed Mental Damage and suffers any paid Special or rider.

Mental Attack does not grant an automatic Intellect or Wits Attribute Check after the Power succeeds.
}}


\page

{{pageNumber,auto}}
{{wide
<h3 id="mental-attack">
  Mental Attack
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Mental<br>
      Active curve = 30 PP per level<br>
      Requires Telepathic Access<br>
      Uses Final Mental Power TN = Spell Base TN +4 + target Spell Resistance<br>
      Mental Damage = 30 PP per +1d8 Mental Damage<br>
      Mental Damage ignores Armor<br>
      Mental Attack does not target Evade<br><br>
      DESIGN STRUCTURE<br>
      This is a premium damage axis.<br>
      It is expensive because it bypasses Armor and uses mental defenses instead of physical defenses.<br>
      It also requires a Telepathy Passive, which costs a Passive Slot and limits the maximum Mental Power level.
    </span>
  </span>
</h3>

A direct psychic assault that harms a creature's mind.

| **Level** | **Type** | **Range** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--|
| **1** | Active, Mental | Telepathic Access | Instant | Deal **1d8 Mental Damage**. |
| **2** | Active, Mental | Telepathic Access | Instant | Deal **2d8 Mental Damage**. |
| **3** | Active, Mental | Telepathic Access | Instant | Deal **3d8 Mental Damage**. |
| **4** | Active, Mental | Telepathic Access | Instant | Deal **4d8 Mental Damage**. |
| **5** | Active, Mental | Telepathic Access | Instant | Deal **5d8 Mental Damage**. |
| **6** | Active, Mental | Telepathic Access | Instant | Deal **6d8 Mental Damage**. |
| **7** | Active, Mental | Telepathic Access | Instant | Deal **7d8 Mental Damage**. |
| **8** | Active, Mental | Telepathic Access | Instant | Deal **8d8 Mental Damage**. |
| **9** | Active, Mental | Telepathic Access | Instant | Deal **9d8 Mental Damage**. |
| **10** | Active, Mental | Telepathic Access | Instant | Deal **10d8 Mental Damage**. |
| **11** | Active, Mental | Telepathic Access | Instant | Deal **11d8 Mental Damage**. |
| **12** | Active, Mental | Telepathic Access | Instant | Deal **12d8 Mental Damage**. |
| **13** | Active, Mental | Telepathic Access | Instant | Deal **13d8 Mental Damage**. |
| **14** | Active, Mental | Telepathic Access | Instant | Deal **14d8 Mental Damage**. |
| **15** | Active, Mental | Telepathic Access | Instant | Deal **15d8 Mental Damage**. |
| **16** | Active, Mental | Telepathic Access | Instant | Deal **16d8 Mental Damage**. |

---
}}


\page

{{pageNumber,auto}}
{{wide
## Mind Illusions

Mind Illusions create false perceptions inside a creature's mind.

Mind Illusions require Telepathic Access unless the Power explicitly says otherwise.

Mind Illusions use the shared Mental Power resolution above, including **Final Mental Power TN**.

A result below Mental Power Base TN fizzles. A result that reaches Mental Power Base TN but not a creature's Final Mental Power TN is resisted by that creature. If the result reaches a creature's Final Mental Power TN, the listed illusion applies to that creature. There is no automatic second resistance roll.

Mind Illusions do not create real objects, creatures, walls, sounds, terrain, light, darkness, or battlefield effects.

A Mind Illusion only exists for the affected creature.

Other creatures do not perceive the illusion unless they are also affected by the same Power.

Mind Illusions cannot directly force a creature to harm itself.

Mind Illusions cannot control a creature's actions.

Mind Illusions may cause the affected creature to perceive something false, but the creature still chooses its own actions based on that perception.

Mind Illusions cannot create real cover, real terrain, real summons, real barriers, or real line-of-sight blockers.

If a creature spends **1 Attack Action** to inspect the Mind Illusion, physically interacts with something it cannot support, or receives clear contradictory evidence, it may make a **Wits Attribute Check** against the original Final Mental Power TN used when the illusion was applied. A specifically analytical or memory-based Power may name **Intellect** instead. On a success, the illusion ends for that creature.
}}


\page

{{pageNumber,auto}}
{{wide
<h3 id="mind-illusion">
  Mind Illusion
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Mental<br>
      Active curve = 30 PP per level<br>
      Requires Telepathic Access<br>
      Uses Final Mental Power TN = Spell Base TN +4 + target Spell Resistance<br>
      DESIGN STRUCTURE<br>
      Mind Illusions scale through affected creatures, affected senses, believability, and complexity.<br>
      They are inspired by mental images and sense-affecting illusion structures.<br>
      They do not create real battlefield objects.<br>
      They do not control the target's actions.<br><br>
      SENSE MODEL<br>
      Basic senses include sight, hearing, smell, touch, taste, pain, temperature, direction, balance, and emotional impression.<br>
      A Mind Illusion may affect only the senses listed by its level.
    </span>
  </span>
</h3>

A mental illusion that creates false perceptions inside affected creatures' minds.

| **Level** | **Type** | **Range** | **Targets** | **Senses / Complexity** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--|:--:|:--|
| **1** | Active, Mental | Telepathic Access | 1 creature | 1 simple sense | MR rounds | Create a minor false perception, such as a whisper, flicker, smell, touch, or brief image. |
| **2** | Active, Mental | Telepathic Access | 1 creature | 1 clear sense | MR rounds | Create a clear false sensory detail in one sense. |
| **3** | Active, Mental | Telepathic Access | 1 creature | 2 simple senses | MR rounds | Combine two simple sensory details, such as image and sound. |
| **4** | Active, Mental | Telepathic Access | 1 creature | 2 clear senses | MR rounds | Create a believable personal illusion affecting two senses. |
| **5** | Active, Mental | Telepathic Access | 2 creatures | 2 clear senses | MR rounds | Affect two creatures with the same personal illusion. |
| **6** | Active, Mental | Telepathic Access | 2 creatures | 3 senses | MR rounds | Create a more complete false perception affecting three senses. |
| **7** | Active, Mental | Telepathic Access | 2 creatures | 3 senses, moving illusion | MR rounds | The illusion may move naturally inside the target's perception. |
| **8** | Active, Mental | Telepathic Access | 3 creatures | 3 senses, reactive illusion | MR rounds | The illusion may react in simple ways to the target's movement or attention. |
| **9** | Active, Mental | Telepathic Access | 3 creatures | 4 senses | MR rounds | Create a strong false perception affecting four senses. |
| **10** | Active, Mental | Telepathic Access | 3 creatures | 4 senses, detailed illusion | MR rounds | The illusion may contain detailed features, such as a creature, object, voice, or false threat. |
| **11** | Active, Mental | Telepathic Access | 4 creatures | 4 senses, reactive illusion | MR rounds | Affect up to four creatures with a shared but personal mental illusion. |
| **12** | Active, Mental | Telepathic Access | 4 creatures | 5 senses | MR rounds | Create a nearly complete sensory illusion inside each target's mind. |
| **13** | Active, Mental | Telepathic Access | 5 creatures | 5 senses, detailed moving illusion | MR rounds | The illusion may appear complex, moving, and emotionally convincing. |
| **14** | Active, Mental | Telepathic Access | 5 creatures | 5 senses, reactive false scene | MR rounds | Create a false scene inside the targets' perception. It still has no real battlefield presence. |
| **15** | Active, Mental | Telepathic Access | MR + 2 creatures | all normal senses | MR rounds | Affect all normal senses with a convincing personal illusion. |
| **16** | Active, Mental | Telepathic Access | MR + 3 creatures | all normal senses, complex reactive illusion | MR rounds | Create a complex shared mental illusion for affected creatures. It remains mental only and cannot control actions directly. |

---
}}


\page

{{pageNumber,auto}}
{{wide
### Mind Illusion Limits

Mind Illusions cannot directly force a creature to take a specific Action or Movement.

Mind Illusions cannot force self-harm.

Mind Illusions cannot spend a creature's limited resources.

Mind Illusions cannot make a creature reveal information it does not know.

Mind Illusions cannot create real walls, real cover, real terrain, real summons, real damage zones, or real barriers.

Mind Illusions cannot block line of sight for creatures that are not affected by the illusion.

Mind Illusions cannot be removed by normal Cleanse unless the Power explicitly applies a cleanseable numeric Special.

A Mind Illusion ends for a creature if it succeeds on the listed Wits or Intellect Attribute Check, the duration ends, or the Power is otherwise broken by a listed rule.
}}

\page

{{pageNumber,auto}}
{{wide
## Mind Probe

Mind Probe searches a creature's active thoughts and memories.

Mind Probe requires Telepathic Access unless the Power explicitly says otherwise.

Mind Probe uses the normal **Final Mental Power TN**.

On a success, learn only the information allowed by the Power's current level.

Mind Probe returns information as the target understands or remembers it. A false belief, incomplete memory, or mistaken conclusion remains false, incomplete, or mistaken when read.

Mind Probe cannot discover information the target never knew.

An unwilling target knows that its mind was probed after the Power resolves, but it does not automatically know exactly what was learned.

Mind Probe does not alter memories, create beliefs, control actions, or deal damage.

---

<h3 id="mind-probe">
  Mind Probe
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Mental<br>
      Active curve = 30 PP per level<br>
      Requires Telepathic Access<br>
      Uses Final Mental Power TN = Spell Base TN +4 + target Spell Resistance<br><br>
      DESIGN STRUCTURE<br>
      Mind Probe is a fixed qualitative Mental Active.<br>
      Its full budget is spent on information depth, precision, memory age, and access to difficult memories.<br>
      It affects one creature and returns one listed answer, fact set, or memory per use unless a level explicitly grants more.<br>
      It cannot be combined with damage, Specials, Mind Illusion, or Mental Control in a standard catalogue entry.
    </span>
  </span>
</h3>

A direct mental search that extracts one thought, fact, intention, or memory from a creature.

| **Level** | **Type** | **Range** | **Targets** | **Duration** | **Information Access** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Mental | Telepathic Access | 1 creature | Instant | Learn the target's current dominant emotion. |
| **2** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one dominant surface thought currently passing through the target's mind. |
| **3** | Active, Mental | Telepathic Access | 1 creature | Instant | Learn the target's immediate intention or next intended non-reflexive action. |
| **4** | Active, Mental | Telepathic Access | 1 creature | Instant | Learn one simple fact currently held in the target's active memory. |
| **5** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one sensory memory from approximately the last minute. |
| **6** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one event memory from approximately the last hour. |
| **7** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last day. |
| **8** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last 7 Tyhran Days. |
| **9** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last 44 Tyhran Days. |
| **10** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last year. |
| **11** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one accessible named memory from any point in the target's life. |
| **12** | Active, Mental | Telepathic Access | 1 creature | Instant | Follow one connected memory chain and learn up to **MR linked facts** about one named person, place, object, or event. |
| **13** | Active, Mental | Telepathic Access | 1 creature | Instant | Recover one fragmented or partially forgotten memory as the target's mind still retains it. |
| **14** | Active, Mental | Telepathic Access | 1 creature | Instant | Reach one deliberately suppressed or deeply buried memory. |
| **15** | Active, Mental | Telepathic Access | 1 creature | Instant | Reach one memory protected by a Mental Power, ward, or seal of a lower Power Level. Equal- or higher-level protection still blocks the probe. |
| **16** | Active, Mental | Telepathic Access | 1 creature | Instant | Reconstruct one complete remembered sequence around a named event, including connected sensory details, emotions, and up to **MR linked facts**. |

---
}}

\page

{{pageNumber,auto}}
{{wide
### Mind Probe Limits

Mind Probe reads the target's mind. It does not establish objective truth.

Mind Probe cannot:

- discover knowledge the target never possessed,
- make an incorrect belief become correct,
- recover information completely erased from the target's mind,
- alter, erase, implant, or rewrite memories,
- force the target to act or speak,
- apply a Special,
- or deal damage.

A willing target may voluntarily share information through Telepathy instead. Mind Probe is required when the user searches, extracts, or reaches into an unwilling mind.

---

## Mental Control

Mental Control imposes a temporary instruction, attitude, relationship, belief, or behavioral program on a weaker creature.

Mental Control requires Telepathic Access unless the Power explicitly says otherwise.

Mental Control uses the normal **Final Mental Power TN**.

Mental Control can affect only a creature whose **Mastery Rank is strictly lower** than the user's Mastery Rank.

Mental Control is a **noncombat Power**. It cannot be activated after Initiative begins, against a creature currently participating in combat, or to create an allied combatant.

If a controlled creature becomes a participant in combat, the Mental Control ends immediately before it takes its first combat action.

---

<h3 id="mental-control">
  Mental Control
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Mental, Noncombat<br>
      Active curve = 30 PP per level<br>
      Requires Telepathic Access<br>
      Target Mastery Rank must be lower than the user's Mastery Rank<br>
      Uses Final Mental Power TN = Spell Base TN +4 + target Spell Resistance<br><br>
      DESIGN STRUCTURE<br>
      Mental Control is a fixed qualitative Mental Active.<br>
      Its full budget is spent on instruction complexity, target count, duration, conditional behavior, and the breadth of one defined noncombat purpose.<br>
      It never creates a combatant, never grants direct action-economy value, and never replaces Summon, Companion, or combat-control Powers.
    </span>
  </span>
</h3>

A temporary mental command that changes what weaker creatures are willing to do, believe, or accept outside combat.
}}

\page

{{pageNumber,auto}}
{{wide
| **Level** | **Type** | **Targets** | **Duration** | **Control Scope** |
|:--:|:--|:--:|:--:|:--|
| **1** | Active, Mental, Noncombat | 1 creature | 1 Tyhran Minute | Impose one immediate, simple, non-harmful instruction. |
| **2** | Active, Mental, Noncombat | 1 creature | 10 Tyhran Minutes | Impose one simple task that can be completed without complex judgment. |
| **3** | Active, Mental, Noncombat | 1 creature | 1 Tyhran Hour | Impose one simple task with several obvious steps. |
| **4** | Active, Mental, Noncombat | 1 creature | 4 Tyhran Hours | Impose one clear command or one temporary attitude toward a person, place, or object. |
| **5** | Active, Mental, Noncombat | 2 creatures | 4 Tyhran Hours | Give both targets the same simple task or attitude. |
| **6** | Active, Mental, Noncombat | 2 creatures | 8 Tyhran Hours | Impose one sustained role, routine, or pattern of cooperation. |
| **7** | Active, Mental, Noncombat | 2 creatures | 12 Tyhran Hours | Impose two linked instructions or one simple conditional instruction. |
| **8** | Active, Mental, Noncombat | 3 creatures | 1 Tyhran Day | Impose one believable temporary relationship, loyalty, aversion, trust, affection, or false assumption. |
| **9** | Active, Mental, Noncombat | 3 creatures | 1 Tyhran Day | Impose one complex noncombat objective and allow reasonable improvisation toward it. |
| **10** | Active, Mental, Noncombat | MR creatures | 2 Tyhran Days | Give all targets the same complex task, attitude, or temporary relationship. |
| **11** | Active, Mental, Noncombat | MR creatures | 3 Tyhran Days | Impose one conditional behavioral program with a clear trigger and response. |
| **12** | Active, Mental, Noncombat | MR + 1 creatures | 3 Tyhran Days | Combine one complex task with one supporting attitude or belief. |
| **13** | Active, Mental, Noncombat | MR + 1 creatures | 7 Tyhran Days | Impose one sustained false loyalty, relationship, social role, or long-form objective. |
| **14** | Active, Mental, Noncombat | MR + 2 creatures | 7 Tyhran Days | Impose several linked instructions serving one defined noncombat purpose. |
| **15** | Active, Mental, Noncombat | MR + 3 creatures | 14 Tyhran Days | Impose a broad behavioral program around one defined noncombat purpose. |
| **16** | Active, Mental, Noncombat | MR + 4 creatures | 44 Tyhran Days | Impose complex noncombat control around one defined purpose, including linked instructions, attitudes, and conditional behavior. |

---
}}

\page

{{pageNumber,auto}}
{{wide
### Mental Control Limits

All targets must be within Telepathic Access when the Power is activated. When several creatures are affected, they receive the same control program.

Mental Control may order a creature to speak, cooperate, open a door, ignore an intrusion, leave an area, deliver a message, adopt a temporary attitude, or pursue another noncombat objective within the Power's listed scope.

Mental Control may not:

- be activated during combat,
- order a creature to make an attack, use an offensive Power, or participate in combat,
- create an allied combatant,
- force direct self-harm, obvious suicide, or entry into clearly lethal danger,
- force the expenditure of Stones, Charges, once-per-rest abilities, or other limited combat resources,
- grant knowledge the target does not possess,
- rewrite or erase memories,
- permanently change personality, loyalty, love, identity, or conviction,
- or affect a creature whose Mastery Rank is equal to or higher than the user's.

Mental Control transmits intent telepathically and does not require a shared spoken language, but a target cannot execute concepts it is incapable of understanding.

A controlled creature remembers its actions when the effect ends. It may recognize that its behavior was unnatural.

The effect ends immediately if the controller or one of the controller's obvious allies directly harms the target.

A target receives a **Wits Attribute Check** against the original Final Mental Power TN only when the control directly collides with a defining conviction, a deeply held bond, or clear evidence that obedience would cause severe harm to someone it is committed to protect. On a success, the control ends. This is a later break opportunity, not an automatic resistance roll when the Power is applied.

Mental Control can make a target speak or cooperate, but it does not guarantee complete or objectively truthful information. Use Mind Probe to search thoughts and memories directly.

---

### Excluded Mental Conditions and Power Locks

**Frightened**, **Charmed**, and **Confused** are not separate core Specials or Power families. Their noncombat narrative functions are handled through Mental Control; false perception is handled through Mind Illusion; general combat impairment is handled through existing Specials such as Disoriented, Weaken, or Soulburn.

**Silence**, **Null Field**, and **Power Lock** are not standard player Powers or core Specials. A specific adventure, location, Artifact, monster, or narrative effect may prohibit a named Power, Special, or Power tag, but it must write that exception explicitly.

}}

{{wide

## Instant Single-Special Powers

Each of the following is a **separate technical Power identity** identified by its delivery and its one chosen Special. The Power's payload never includes Weapon Damage, purchased Power Damage, Healing, Cleanse, or an unrelated control effect. A Martial attack roll or legal Ranged Spell casting roll is a delivery check, not permission to append a damage axis.

Available deliveries are **Melee Single Target**, **Ranged Single Target**, **Melee AoE**, and **Ranged AoE**. All are Instant Actives; existing Specials may continue to diminish, count down or be recovered according to their own rules after that instant application. These are **Special-only Actives and cannot be learned as Limited Powers**. Specials still follow their ordinary duration, diminishing, timing, and global Special Application Limit rules.

**Target and delivery rules:** Martial uses the usual Attack Pool and target Evade; Ranged Spell uses the normal Casting/Spell Resistance resolution. Melee AoE is centered on the user; Ranged AoE is placed at a legal point in range. A successful AoE uses one attack roll against the appropriate defense of each eligible creature and permits Dive for Cover. The attacker does not affect itself unless a separate rule explicitly permits it.

**PP calculation:** Direct Active target 30 PP × PL. Single-target Special cost is paid once at its exact standalone rate. Instant AoE Special costs the **same** as direct Special, plus the existing Instant Attack AoE Radius tax; Range is separately purchased for Ranged deliveries. Range and AoE coverage are delivery, not second payloads. Choose one printed Special at learning; it cannot later change without retraining.

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-blight">
  Melee Single Target Special: Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Blight (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Blight(4) 30 = 30/30 PP (0 unused)<br>
      L2: Range 0 + Radius 0 + Blight(5) 45 = 45/60 PP (15 unused)<br>
      L3: Range 0 + Radius 0 + Blight(7) 84 = 84/90 PP (6 unused)<br>
      L4: Range 0 + Radius 0 + Blight(8) 108 = 108/120 PP (12 unused)<br>
      L5: Range 0 + Radius 0 + Blight(9) 135 = 135/150 PP (15 unused)<br>
      L6: Range 0 + Radius 0 + Blight(10) 165 = 165/180 PP (15 unused)<br>
      L7: Range 0 + Radius 0 + Blight(11) 198 = 198/210 PP (12 unused)<br>
      L8: Range 0 + Radius 0 + Blight(12) 234 = 234/240 PP (6 unused)<br>
      L9: Range 0 + Radius 0 + Blight(12) 234 = 234/270 PP (36 unused)<br>
      L10: Range 0 + Radius 0 + Blight(13) 273 = 273/300 PP (27 unused)<br>
      L11: Range 0 + Radius 0 + Blight(14) 315 = 315/330 PP (15 unused)<br>
      L12: Range 0 + Radius 0 + Blight(15) 360 = 360/360 PP (0 unused)<br>
      L13: Range 0 + Radius 0 + Blight(15) 360 = 360/390 PP (30 unused)<br>
      L14: Range 0 + Radius 0 + Blight(16) 408 = 408/420 PP (12 unused)<br>
      L15: Range 0 + Radius 0 + Blight(16) 408 = 408/450 PP (42 unused)<br>
      L16: Range 0 + Radius 0 + Blight(17) 459 = 459/480 PP (21 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Blight(X)** (Timed Disadvantage). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Blight(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(4)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(5)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(7)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(8)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(9)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(10)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(11)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(12)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(12)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(13)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(14)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(15)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(15)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(16)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(16)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Blight(17)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-challenge">
  Melee Single Target Special: Challenge
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Challenge (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Challenge(1) 6 = 6/30 PP (24 unused)<br>
      L2: Range 0 + Radius 0 + Challenge(2) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Challenge(2) 60 = 60/90 PP (30 unused)<br>
      L4: Range 0 + Radius 0 + Challenge(2) 60 = 60/120 PP (60 unused)<br>
      L5: Range 0 + Radius 0 + Challenge(3) 126 = 126/150 PP (24 unused)<br>
      L6: Range 0 + Radius 0 + Challenge(3) 126 = 126/180 PP (54 unused)<br>
      L7: Range 0 + Radius 0 + Challenge(3) 126 = 126/210 PP (84 unused)<br>
      L8: Range 0 + Radius 0 + Challenge(4) 216 = 216/240 PP (24 unused)<br>
      L9: Range 0 + Radius 0 + Challenge(4) 216 = 216/270 PP (54 unused)<br>
      L10: Range 0 + Radius 0 + Challenge(4) 216 = 216/300 PP (84 unused)<br>
      L11: Range 0 + Radius 0 + Challenge(5) 330 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 0 + Challenge(5) 330 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 0 + Challenge(5) 330 = 330/390 PP (60 unused)<br>
      L14: Range 0 + Radius 0 + Challenge(5) 330 = 330/420 PP (90 unused)<br>
      L15: Range 0 + Radius 0 + Challenge(5) 330 = 330/450 PP (120 unused)<br>
      L16: Range 0 + Radius 0 + Challenge(6) 468 = 468/480 PP (12 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Challenge(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Challenge(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(1)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(2)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(2)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(2)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Challenge(6)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-corrode">
  Melee Single Target Special: Corrode
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Corrode (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Corrode(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 0 + Radius 0 + Corrode(4) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Corrode(5) 90 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 0 + Corrode(5) 90 = 90/120 PP (30 unused)<br>
      L5: Range 0 + Radius 0 + Corrode(6) 126 = 126/150 PP (24 unused)<br>
      L6: Range 0 + Radius 0 + Corrode(7) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Corrode(7) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Corrode(8) 216 = 216/240 PP (24 unused)<br>
      L9: Range 0 + Radius 0 + Corrode(9) 270 = 270/270 PP (0 unused)<br>
      L10: Range 0 + Radius 0 + Corrode(9) 270 = 270/300 PP (30 unused)<br>
      L11: Range 0 + Radius 0 + Corrode(10) 330 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 0 + Corrode(10) 330 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 0 + Corrode(10) 330 = 330/390 PP (60 unused)<br>
      L14: Range 0 + Radius 0 + Corrode(11) 396 = 396/420 PP (24 unused)<br>
      L15: Range 0 + Radius 0 + Corrode(11) 396 = 396/450 PP (54 unused)<br>
      L16: Range 0 + Radius 0 + Corrode(12) 468 = 468/480 PP (12 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Corrode(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Corrode(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(2)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(4)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(5)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(5)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(6)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(7)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(7)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(8)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(9)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(9)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(11)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(11)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Corrode(12)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-disoriented">
  Melee Single Target Special: Disoriented
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Disoriented (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Disoriented(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 0 + Radius 0 + Disoriented(1) 8 = 8/60 PP (52 unused)<br>
      L3: Range 0 + Radius 0 + Disoriented(2) 80 = 80/90 PP (10 unused)<br>
      L4: Range 0 + Radius 0 + Disoriented(2) 80 = 80/120 PP (40 unused)<br>
      L5: Range 0 + Radius 0 + Disoriented(2) 80 = 80/150 PP (70 unused)<br>
      L6: Range 0 + Radius 0 + Disoriented(3) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Disoriented(3) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Disoriented(3) 168 = 168/240 PP (72 unused)<br>
      L9: Range 0 + Radius 0 + Disoriented(3) 168 = 168/270 PP (102 unused)<br>
      L10: Range 0 + Radius 0 + Disoriented(4) 288 = 288/300 PP (12 unused)<br>
      L11: Range 0 + Radius 0 + Disoriented(4) 288 = 288/330 PP (42 unused)<br>
      L12: Range 0 + Radius 0 + Disoriented(4) 288 = 288/360 PP (72 unused)<br>
      L13: Range 0 + Radius 0 + Disoriented(4) 288 = 288/390 PP (102 unused)<br>
      L14: Range 0 + Radius 0 + Disoriented(4) 288 = 288/420 PP (132 unused)<br>
      L15: Range 0 + Radius 0 + Disoriented(5) 440 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 0 + Disoriented(5) 440 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Disoriented(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Disoriented(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(1)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(1)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(5)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Disoriented(5)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-expose">
  Melee Single Target Special: Expose
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Expose (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Expose(2) 24 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 0 + Expose(3) 48 = 48/60 PP (12 unused)<br>
      L3: Range 0 + Radius 0 + Expose(4) 80 = 80/90 PP (10 unused)<br>
      L4: Range 0 + Radius 0 + Expose(5) 120 = 120/120 PP (0 unused)<br>
      L5: Range 0 + Radius 0 + Expose(5) 120 = 120/150 PP (30 unused)<br>
      L6: Range 0 + Radius 0 + Expose(6) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Expose(6) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Expose(7) 224 = 224/240 PP (16 unused)<br>
      L9: Range 0 + Radius 0 + Expose(7) 224 = 224/270 PP (46 unused)<br>
      L10: Range 0 + Radius 0 + Expose(8) 288 = 288/300 PP (12 unused)<br>
      L11: Range 0 + Radius 0 + Expose(8) 288 = 288/330 PP (42 unused)<br>
      L12: Range 0 + Radius 0 + Expose(9) 360 = 360/360 PP (0 unused)<br>
      L13: Range 0 + Radius 0 + Expose(9) 360 = 360/390 PP (30 unused)<br>
      L14: Range 0 + Radius 0 + Expose(9) 360 = 360/420 PP (60 unused)<br>
      L15: Range 0 + Radius 0 + Expose(10) 440 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 0 + Expose(10) 440 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Expose(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Expose(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(2)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(3)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(4)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(5)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(5)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(6)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(6)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(7)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(7)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(8)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(8)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(9)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(9)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(9)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(10)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Expose(10)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-hex">
  Melee Single Target Special: Hex
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Hex (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Hex(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 0 + Radius 0 + Hex(4) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Hex(5) 90 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 0 + Hex(5) 90 = 90/120 PP (30 unused)<br>
      L5: Range 0 + Radius 0 + Hex(6) 126 = 126/150 PP (24 unused)<br>
      L6: Range 0 + Radius 0 + Hex(7) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Hex(7) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Hex(8) 216 = 216/240 PP (24 unused)<br>
      L9: Range 0 + Radius 0 + Hex(9) 270 = 270/270 PP (0 unused)<br>
      L10: Range 0 + Radius 0 + Hex(9) 270 = 270/300 PP (30 unused)<br>
      L11: Range 0 + Radius 0 + Hex(10) 330 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 0 + Hex(10) 330 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 0 + Hex(10) 330 = 330/390 PP (60 unused)<br>
      L14: Range 0 + Radius 0 + Hex(11) 396 = 396/420 PP (24 unused)<br>
      L15: Range 0 + Radius 0 + Hex(11) 396 = 396/450 PP (54 unused)<br>
      L16: Range 0 + Radius 0 + Hex(12) 468 = 468/480 PP (12 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Hex(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Hex(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(2)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(4)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(5)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(5)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(6)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(7)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(7)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(8)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(9)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(9)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(11)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(11)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Hex(12)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-lacerate">
  Melee Single Target Special: Lacerate
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Lacerate (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Lacerate(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 0 + Lacerate(5) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Lacerate(6) 84 = 84/90 PP (6 unused)<br>
      L4: Range 0 + Radius 0 + Lacerate(7) 112 = 112/120 PP (8 unused)<br>
      L5: Range 0 + Radius 0 + Lacerate(8) 144 = 144/150 PP (6 unused)<br>
      L6: Range 0 + Radius 0 + Lacerate(9) 180 = 180/180 PP (0 unused)<br>
      L7: Range 0 + Radius 0 + Lacerate(9) 180 = 180/210 PP (30 unused)<br>
      L8: Range 0 + Radius 0 + Lacerate(10) 220 = 220/240 PP (20 unused)<br>
      L9: Range 0 + Radius 0 + Lacerate(11) 264 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 0 + Lacerate(11) 264 = 264/300 PP (36 unused)<br>
      L11: Range 0 + Radius 0 + Lacerate(12) 312 = 312/330 PP (18 unused)<br>
      L12: Range 0 + Radius 0 + Lacerate(12) 312 = 312/360 PP (48 unused)<br>
      L13: Range 0 + Radius 0 + Lacerate(13) 364 = 364/390 PP (26 unused)<br>
      L14: Range 0 + Radius 0 + Lacerate(14) 420 = 420/420 PP (0 unused)<br>
      L15: Range 0 + Radius 0 + Lacerate(14) 420 = 420/450 PP (30 unused)<br>
      L16: Range 0 + Radius 0 + Lacerate(15) 480 = 480/480 PP (0 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Lacerate(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Lacerate(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(3)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(5)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(6)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(7)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(8)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(9)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(9)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(10)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(11)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(11)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(12)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(12)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(13)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(14)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(14)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Lacerate(15)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-mark">
  Melee Single Target Special: Mark
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Mark (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Mark(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 0 + Mark(5) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Mark(6) 84 = 84/90 PP (6 unused)<br>
      L4: Range 0 + Radius 0 + Mark(7) 112 = 112/120 PP (8 unused)<br>
      L5: Range 0 + Radius 0 + Mark(8) 144 = 144/150 PP (6 unused)<br>
      L6: Range 0 + Radius 0 + Mark(9) 180 = 180/180 PP (0 unused)<br>
      L7: Range 0 + Radius 0 + Mark(9) 180 = 180/210 PP (30 unused)<br>
      L8: Range 0 + Radius 0 + Mark(10) 220 = 220/240 PP (20 unused)<br>
      L9: Range 0 + Radius 0 + Mark(11) 264 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 0 + Mark(11) 264 = 264/300 PP (36 unused)<br>
      L11: Range 0 + Radius 0 + Mark(12) 312 = 312/330 PP (18 unused)<br>
      L12: Range 0 + Radius 0 + Mark(12) 312 = 312/360 PP (48 unused)<br>
      L13: Range 0 + Radius 0 + Mark(13) 364 = 364/390 PP (26 unused)<br>
      L14: Range 0 + Radius 0 + Mark(14) 420 = 420/420 PP (0 unused)<br>
      L15: Range 0 + Radius 0 + Mark(14) 420 = 420/450 PP (30 unused)<br>
      L16: Range 0 + Radius 0 + Mark(15) 480 = 480/480 PP (0 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Mark(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Mark(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(3)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(5)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(6)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(7)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(8)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(9)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(9)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(10)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(11)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(11)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(12)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(12)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(13)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(14)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(14)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Mark(15)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-root">
  Melee Single Target Special: Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Root (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Root(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 0 + Radius 0 + Root(4) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Root(5) 90 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 0 + Root(5) 90 = 90/120 PP (30 unused)<br>
      L5: Range 0 + Radius 0 + Root(6) 126 = 126/150 PP (24 unused)<br>
      L6: Range 0 + Radius 0 + Root(7) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Root(7) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Root(8) 216 = 216/240 PP (24 unused)<br>
      L9: Range 0 + Radius 0 + Root(9) 270 = 270/270 PP (0 unused)<br>
      L10: Range 0 + Radius 0 + Root(9) 270 = 270/300 PP (30 unused)<br>
      L11: Range 0 + Radius 0 + Root(10) 330 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 0 + Root(10) 330 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 0 + Root(10) 330 = 330/390 PP (60 unused)<br>
      L14: Range 0 + Radius 0 + Root(11) 396 = 396/420 PP (24 unused)<br>
      L15: Range 0 + Radius 0 + Root(11) 396 = 396/450 PP (54 unused)<br>
      L16: Range 0 + Radius 0 + Root(12) 468 = 468/480 PP (12 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Root(X)** (Until Broken). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Root(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(2)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(4)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(5)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(5)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(6)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(7)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(7)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(8)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(9)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(9)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(11)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(11)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Root(12)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-ruin">
  Melee Single Target Special: Ruin
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Ruin (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Ruin(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 0 + Ruin(5) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Ruin(6) 84 = 84/90 PP (6 unused)<br>
      L4: Range 0 + Radius 0 + Ruin(7) 112 = 112/120 PP (8 unused)<br>
      L5: Range 0 + Radius 0 + Ruin(8) 144 = 144/150 PP (6 unused)<br>
      L6: Range 0 + Radius 0 + Ruin(9) 180 = 180/180 PP (0 unused)<br>
      L7: Range 0 + Radius 0 + Ruin(9) 180 = 180/210 PP (30 unused)<br>
      L8: Range 0 + Radius 0 + Ruin(10) 220 = 220/240 PP (20 unused)<br>
      L9: Range 0 + Radius 0 + Ruin(11) 264 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 0 + Ruin(11) 264 = 264/300 PP (36 unused)<br>
      L11: Range 0 + Radius 0 + Ruin(12) 312 = 312/330 PP (18 unused)<br>
      L12: Range 0 + Radius 0 + Ruin(12) 312 = 312/360 PP (48 unused)<br>
      L13: Range 0 + Radius 0 + Ruin(13) 364 = 364/390 PP (26 unused)<br>
      L14: Range 0 + Radius 0 + Ruin(14) 420 = 420/420 PP (0 unused)<br>
      L15: Range 0 + Radius 0 + Ruin(14) 420 = 420/450 PP (30 unused)<br>
      L16: Range 0 + Radius 0 + Ruin(15) 480 = 480/480 PP (0 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Ruin(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Ruin(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(3)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(5)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(6)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(7)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(8)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(9)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(9)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(10)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(11)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(11)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(12)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(12)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(13)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(14)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(14)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Ruin(15)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-slow">
  Melee Single Target Special: Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Slow (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Slow(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 0 + Slow(5) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Slow(6) 84 = 84/90 PP (6 unused)<br>
      L4: Range 0 + Radius 0 + Slow(7) 112 = 112/120 PP (8 unused)<br>
      L5: Range 0 + Radius 0 + Slow(8) 144 = 144/150 PP (6 unused)<br>
      L6: Range 0 + Radius 0 + Slow(9) 180 = 180/180 PP (0 unused)<br>
      L7: Range 0 + Radius 0 + Slow(9) 180 = 180/210 PP (30 unused)<br>
      L8: Range 0 + Radius 0 + Slow(10) 220 = 220/240 PP (20 unused)<br>
      L9: Range 0 + Radius 0 + Slow(11) 264 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 0 + Slow(11) 264 = 264/300 PP (36 unused)<br>
      L11: Range 0 + Radius 0 + Slow(12) 312 = 312/330 PP (18 unused)<br>
      L12: Range 0 + Radius 0 + Slow(12) 312 = 312/360 PP (48 unused)<br>
      L13: Range 0 + Radius 0 + Slow(13) 364 = 364/390 PP (26 unused)<br>
      L14: Range 0 + Radius 0 + Slow(14) 420 = 420/420 PP (0 unused)<br>
      L15: Range 0 + Radius 0 + Slow(14) 420 = 420/450 PP (30 unused)<br>
      L16: Range 0 + Radius 0 + Slow(15) 480 = 480/480 PP (0 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Slow(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Slow(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(3)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(5)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(6)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(7)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(8)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(9)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(9)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(10)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(11)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(11)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(12)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(12)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(13)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(14)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(14)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Slow(15)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-soulburn">
  Melee Single Target Special: Soulburn
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Soulburn (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Soulburn(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 0 + Radius 0 + Soulburn(1) 8 = 8/60 PP (52 unused)<br>
      L3: Range 0 + Radius 0 + Soulburn(2) 80 = 80/90 PP (10 unused)<br>
      L4: Range 0 + Radius 0 + Soulburn(2) 80 = 80/120 PP (40 unused)<br>
      L5: Range 0 + Radius 0 + Soulburn(2) 80 = 80/150 PP (70 unused)<br>
      L6: Range 0 + Radius 0 + Soulburn(3) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Soulburn(3) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Soulburn(3) 168 = 168/240 PP (72 unused)<br>
      L9: Range 0 + Radius 0 + Soulburn(3) 168 = 168/270 PP (102 unused)<br>
      L10: Range 0 + Radius 0 + Soulburn(4) 288 = 288/300 PP (12 unused)<br>
      L11: Range 0 + Radius 0 + Soulburn(4) 288 = 288/330 PP (42 unused)<br>
      L12: Range 0 + Radius 0 + Soulburn(4) 288 = 288/360 PP (72 unused)<br>
      L13: Range 0 + Radius 0 + Soulburn(4) 288 = 288/390 PP (102 unused)<br>
      L14: Range 0 + Radius 0 + Soulburn(4) 288 = 288/420 PP (132 unused)<br>
      L15: Range 0 + Radius 0 + Soulburn(5) 440 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 0 + Soulburn(5) 440 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Soulburn(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Soulburn(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(1)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(1)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(5)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Soulburn(5)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-sundered">
  Melee Single Target Special: Sundered
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Sundered (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Sundered(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 0 + Radius 0 + Sundered(4) 60 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 0 + Sundered(5) 90 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 0 + Sundered(5) 90 = 90/120 PP (30 unused)<br>
      L5: Range 0 + Radius 0 + Sundered(6) 126 = 126/150 PP (24 unused)<br>
      L6: Range 0 + Radius 0 + Sundered(7) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Sundered(7) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Sundered(8) 216 = 216/240 PP (24 unused)<br>
      L9: Range 0 + Radius 0 + Sundered(9) 270 = 270/270 PP (0 unused)<br>
      L10: Range 0 + Radius 0 + Sundered(9) 270 = 270/300 PP (30 unused)<br>
      L11: Range 0 + Radius 0 + Sundered(10) 330 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 0 + Sundered(10) 330 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 0 + Sundered(10) 330 = 330/390 PP (60 unused)<br>
      L14: Range 0 + Radius 0 + Sundered(11) 396 = 396/420 PP (24 unused)<br>
      L15: Range 0 + Radius 0 + Sundered(11) 396 = 396/450 PP (54 unused)<br>
      L16: Range 0 + Radius 0 + Sundered(12) 468 = 468/480 PP (12 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Sundered(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Sundered(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(2)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(4)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(5)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(5)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(6)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(7)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(7)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(8)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(9)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(9)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(11)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(11)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Sundered(12)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-single-target-special-weaken">
  Melee Single Target Special: Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Weaken (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Weaken(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 0 + Radius 0 + Weaken(1) 8 = 8/60 PP (52 unused)<br>
      L3: Range 0 + Radius 0 + Weaken(2) 80 = 80/90 PP (10 unused)<br>
      L4: Range 0 + Radius 0 + Weaken(2) 80 = 80/120 PP (40 unused)<br>
      L5: Range 0 + Radius 0 + Weaken(2) 80 = 80/150 PP (70 unused)<br>
      L6: Range 0 + Radius 0 + Weaken(3) 168 = 168/180 PP (12 unused)<br>
      L7: Range 0 + Radius 0 + Weaken(3) 168 = 168/210 PP (42 unused)<br>
      L8: Range 0 + Radius 0 + Weaken(3) 168 = 168/240 PP (72 unused)<br>
      L9: Range 0 + Radius 0 + Weaken(3) 168 = 168/270 PP (102 unused)<br>
      L10: Range 0 + Radius 0 + Weaken(4) 288 = 288/300 PP (12 unused)<br>
      L11: Range 0 + Radius 0 + Weaken(4) 288 = 288/330 PP (42 unused)<br>
      L12: Range 0 + Radius 0 + Weaken(4) 288 = 288/360 PP (72 unused)<br>
      L13: Range 0 + Radius 0 + Weaken(4) 288 = 288/390 PP (102 unused)<br>
      L14: Range 0 + Radius 0 + Weaken(4) 288 = 288/420 PP (132 unused)<br>
      L15: Range 0 + Radius 0 + Weaken(5) 440 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 0 + Weaken(5) 440 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Weaken(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within Range (Melee Reach). Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Weaken(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(1)**; **no Power damage**. |
| **2** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(1)**; **no Power damage**. |
| **3** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **4** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **5** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **6** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **7** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **8** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **9** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **10** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **11** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **12** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **13** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **14** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **15** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(5)**; **no Power damage**. |
| **16** | Active, Special | Melee Reach | — | Instant | On successful delivery apply **Weaken(5)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-blight">
  Ranged Single Target Special: Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Blight (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Blight(4) 30 = 30/30 PP (0 unused)<br>
      L2: Range 5 + Radius 0 + Blight(5) 45 = 50/60 PP (10 unused)<br>
      L3: Range 10 + Radius 0 + Blight(6) 63 = 73/90 PP (17 unused)<br>
      L4: Range 15 + Radius 0 + Blight(7) 84 = 99/120 PP (21 unused)<br>
      L5: Range 20 + Radius 0 + Blight(8) 108 = 128/150 PP (22 unused)<br>
      L6: Range 25 + Radius 0 + Blight(9) 135 = 160/180 PP (20 unused)<br>
      L7: Range 30 + Radius 0 + Blight(10) 165 = 195/210 PP (15 unused)<br>
      L8: Range 35 + Radius 0 + Blight(11) 198 = 233/240 PP (7 unused)<br>
      L9: Range 40 + Radius 0 + Blight(11) 198 = 238/270 PP (32 unused)<br>
      L10: Range 45 + Radius 0 + Blight(12) 234 = 279/300 PP (21 unused)<br>
      L11: Range 50 + Radius 0 + Blight(13) 273 = 323/330 PP (7 unused)<br>
      L12: Range 55 + Radius 0 + Blight(13) 273 = 328/360 PP (32 unused)<br>
      L13: Range 60 + Radius 0 + Blight(14) 315 = 375/390 PP (15 unused)<br>
      L14: Range 65 + Radius 0 + Blight(14) 315 = 380/420 PP (40 unused)<br>
      L15: Range 70 + Radius 0 + Blight(15) 360 = 430/450 PP (20 unused)<br>
      L16: Range 75 + Radius 0 + Blight(15) 360 = 435/480 PP (45 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Blight(X)** (Timed Disadvantage). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Blight(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Blight(4)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Blight(5)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Blight(6)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Blight(7)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Blight(8)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Blight(9)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Blight(10)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Blight(11)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Blight(11)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Blight(12)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Blight(13)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Blight(13)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Blight(14)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Blight(14)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Blight(15)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Blight(15)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-challenge">
  Ranged Single Target Special: Challenge
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Challenge (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Challenge(1) 6 = 6/30 PP (24 unused)<br>
      L2: Range 5 + Radius 0 + Challenge(1) 6 = 11/60 PP (49 unused)<br>
      L3: Range 10 + Radius 0 + Challenge(2) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Challenge(2) 60 = 75/120 PP (45 unused)<br>
      L5: Range 20 + Radius 0 + Challenge(3) 126 = 146/150 PP (4 unused)<br>
      L6: Range 25 + Radius 0 + Challenge(3) 126 = 151/180 PP (29 unused)<br>
      L7: Range 30 + Radius 0 + Challenge(3) 126 = 156/210 PP (54 unused)<br>
      L8: Range 35 + Radius 0 + Challenge(3) 126 = 161/240 PP (79 unused)<br>
      L9: Range 40 + Radius 0 + Challenge(4) 216 = 256/270 PP (14 unused)<br>
      L10: Range 45 + Radius 0 + Challenge(4) 216 = 261/300 PP (39 unused)<br>
      L11: Range 50 + Radius 0 + Challenge(4) 216 = 266/330 PP (64 unused)<br>
      L12: Range 55 + Radius 0 + Challenge(4) 216 = 271/360 PP (89 unused)<br>
      L13: Range 60 + Radius 0 + Challenge(5) 330 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 0 + Challenge(5) 330 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 0 + Challenge(5) 330 = 400/450 PP (50 unused)<br>
      L16: Range 75 + Radius 0 + Challenge(5) 330 = 405/480 PP (75 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Challenge(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Challenge(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Challenge(1)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Challenge(1)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Challenge(2)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Challenge(2)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Challenge(3)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Challenge(4)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Challenge(5)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-corrode">
  Ranged Single Target Special: Corrode
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Corrode (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Corrode(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 5 + Radius 0 + Corrode(3) 36 = 41/60 PP (19 unused)<br>
      L3: Range 10 + Radius 0 + Corrode(4) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Corrode(5) 90 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 0 + Corrode(6) 126 = 146/150 PP (4 unused)<br>
      L6: Range 25 + Radius 0 + Corrode(6) 126 = 151/180 PP (29 unused)<br>
      L7: Range 30 + Radius 0 + Corrode(7) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Corrode(7) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Corrode(8) 216 = 256/270 PP (14 unused)<br>
      L10: Range 45 + Radius 0 + Corrode(8) 216 = 261/300 PP (39 unused)<br>
      L11: Range 50 + Radius 0 + Corrode(9) 270 = 320/330 PP (10 unused)<br>
      L12: Range 55 + Radius 0 + Corrode(9) 270 = 325/360 PP (35 unused)<br>
      L13: Range 60 + Radius 0 + Corrode(10) 330 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 0 + Corrode(10) 330 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 0 + Corrode(10) 330 = 400/450 PP (50 unused)<br>
      L16: Range 75 + Radius 0 + Corrode(11) 396 = 471/480 PP (9 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Corrode(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Corrode(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Corrode(2)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Corrode(3)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Corrode(4)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Corrode(5)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Corrode(6)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Corrode(6)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Corrode(7)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Corrode(7)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Corrode(8)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Corrode(8)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Corrode(9)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Corrode(9)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Corrode(10)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Corrode(11)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-disoriented">
  Ranged Single Target Special: Disoriented
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Disoriented (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Disoriented(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 5 + Radius 0 + Disoriented(1) 8 = 13/60 PP (47 unused)<br>
      L3: Range 10 + Radius 0 + Disoriented(2) 80 = 90/90 PP (0 unused)<br>
      L4: Range 15 + Radius 0 + Disoriented(2) 80 = 95/120 PP (25 unused)<br>
      L5: Range 20 + Radius 0 + Disoriented(2) 80 = 100/150 PP (50 unused)<br>
      L6: Range 25 + Radius 0 + Disoriented(2) 80 = 105/180 PP (75 unused)<br>
      L7: Range 30 + Radius 0 + Disoriented(3) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Disoriented(3) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Disoriented(3) 168 = 208/270 PP (62 unused)<br>
      L10: Range 45 + Radius 0 + Disoriented(3) 168 = 213/300 PP (87 unused)<br>
      L11: Range 50 + Radius 0 + Disoriented(3) 168 = 218/330 PP (112 unused)<br>
      L12: Range 55 + Radius 0 + Disoriented(4) 288 = 343/360 PP (17 unused)<br>
      L13: Range 60 + Radius 0 + Disoriented(4) 288 = 348/390 PP (42 unused)<br>
      L14: Range 65 + Radius 0 + Disoriented(4) 288 = 353/420 PP (67 unused)<br>
      L15: Range 70 + Radius 0 + Disoriented(4) 288 = 358/450 PP (92 unused)<br>
      L16: Range 75 + Radius 0 + Disoriented(4) 288 = 363/480 PP (117 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Disoriented(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Disoriented(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Disoriented(1)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Disoriented(1)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Disoriented(2)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Disoriented(3)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Disoriented(4)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-expose">
  Ranged Single Target Special: Expose
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Expose (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Expose(2) 24 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 0 + Expose(3) 48 = 53/60 PP (7 unused)<br>
      L3: Range 10 + Radius 0 + Expose(4) 80 = 90/90 PP (0 unused)<br>
      L4: Range 15 + Radius 0 + Expose(4) 80 = 95/120 PP (25 unused)<br>
      L5: Range 20 + Radius 0 + Expose(5) 120 = 140/150 PP (10 unused)<br>
      L6: Range 25 + Radius 0 + Expose(5) 120 = 145/180 PP (35 unused)<br>
      L7: Range 30 + Radius 0 + Expose(6) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Expose(6) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Expose(7) 224 = 264/270 PP (6 unused)<br>
      L10: Range 45 + Radius 0 + Expose(7) 224 = 269/300 PP (31 unused)<br>
      L11: Range 50 + Radius 0 + Expose(7) 224 = 274/330 PP (56 unused)<br>
      L12: Range 55 + Radius 0 + Expose(8) 288 = 343/360 PP (17 unused)<br>
      L13: Range 60 + Radius 0 + Expose(8) 288 = 348/390 PP (42 unused)<br>
      L14: Range 65 + Radius 0 + Expose(8) 288 = 353/420 PP (67 unused)<br>
      L15: Range 70 + Radius 0 + Expose(9) 360 = 430/450 PP (20 unused)<br>
      L16: Range 75 + Radius 0 + Expose(9) 360 = 435/480 PP (45 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Expose(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Expose(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Expose(2)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Expose(3)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Expose(4)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Expose(4)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Expose(5)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Expose(5)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Expose(6)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Expose(6)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Expose(7)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Expose(7)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Expose(7)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Expose(8)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Expose(8)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Expose(8)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Expose(9)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Expose(9)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-hex">
  Ranged Single Target Special: Hex
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Hex (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Hex(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 5 + Radius 0 + Hex(3) 36 = 41/60 PP (19 unused)<br>
      L3: Range 10 + Radius 0 + Hex(4) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Hex(5) 90 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 0 + Hex(6) 126 = 146/150 PP (4 unused)<br>
      L6: Range 25 + Radius 0 + Hex(6) 126 = 151/180 PP (29 unused)<br>
      L7: Range 30 + Radius 0 + Hex(7) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Hex(7) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Hex(8) 216 = 256/270 PP (14 unused)<br>
      L10: Range 45 + Radius 0 + Hex(8) 216 = 261/300 PP (39 unused)<br>
      L11: Range 50 + Radius 0 + Hex(9) 270 = 320/330 PP (10 unused)<br>
      L12: Range 55 + Radius 0 + Hex(9) 270 = 325/360 PP (35 unused)<br>
      L13: Range 60 + Radius 0 + Hex(10) 330 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 0 + Hex(10) 330 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 0 + Hex(10) 330 = 400/450 PP (50 unused)<br>
      L16: Range 75 + Radius 0 + Hex(11) 396 = 471/480 PP (9 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Hex(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Hex(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Hex(2)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Hex(3)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Hex(4)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Hex(5)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Hex(6)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Hex(6)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Hex(7)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Hex(7)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Hex(8)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Hex(8)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Hex(9)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Hex(9)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Hex(10)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Hex(11)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-lacerate">
  Ranged Single Target Special: Lacerate
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Lacerate (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Lacerate(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 0 + Lacerate(4) 40 = 45/60 PP (15 unused)<br>
      L3: Range 10 + Radius 0 + Lacerate(5) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Lacerate(6) 84 = 99/120 PP (21 unused)<br>
      L5: Range 20 + Radius 0 + Lacerate(7) 112 = 132/150 PP (18 unused)<br>
      L6: Range 25 + Radius 0 + Lacerate(8) 144 = 169/180 PP (11 unused)<br>
      L7: Range 30 + Radius 0 + Lacerate(9) 180 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 0 + Lacerate(9) 180 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 0 + Lacerate(10) 220 = 260/270 PP (10 unused)<br>
      L10: Range 45 + Radius 0 + Lacerate(10) 220 = 265/300 PP (35 unused)<br>
      L11: Range 50 + Radius 0 + Lacerate(11) 264 = 314/330 PP (16 unused)<br>
      L12: Range 55 + Radius 0 + Lacerate(11) 264 = 319/360 PP (41 unused)<br>
      L13: Range 60 + Radius 0 + Lacerate(12) 312 = 372/390 PP (18 unused)<br>
      L14: Range 65 + Radius 0 + Lacerate(12) 312 = 377/420 PP (43 unused)<br>
      L15: Range 70 + Radius 0 + Lacerate(13) 364 = 434/450 PP (16 unused)<br>
      L16: Range 75 + Radius 0 + Lacerate(13) 364 = 439/480 PP (41 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Lacerate(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Lacerate(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Lacerate(3)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Lacerate(4)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Lacerate(5)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Lacerate(6)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Lacerate(7)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Lacerate(8)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Lacerate(9)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Lacerate(9)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Lacerate(10)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Lacerate(10)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Lacerate(11)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Lacerate(11)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Lacerate(12)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Lacerate(12)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Lacerate(13)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Lacerate(13)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-mark">
  Ranged Single Target Special: Mark
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Mark (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Mark(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 0 + Mark(4) 40 = 45/60 PP (15 unused)<br>
      L3: Range 10 + Radius 0 + Mark(5) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Mark(6) 84 = 99/120 PP (21 unused)<br>
      L5: Range 20 + Radius 0 + Mark(7) 112 = 132/150 PP (18 unused)<br>
      L6: Range 25 + Radius 0 + Mark(8) 144 = 169/180 PP (11 unused)<br>
      L7: Range 30 + Radius 0 + Mark(9) 180 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 0 + Mark(9) 180 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 0 + Mark(10) 220 = 260/270 PP (10 unused)<br>
      L10: Range 45 + Radius 0 + Mark(10) 220 = 265/300 PP (35 unused)<br>
      L11: Range 50 + Radius 0 + Mark(11) 264 = 314/330 PP (16 unused)<br>
      L12: Range 55 + Radius 0 + Mark(11) 264 = 319/360 PP (41 unused)<br>
      L13: Range 60 + Radius 0 + Mark(12) 312 = 372/390 PP (18 unused)<br>
      L14: Range 65 + Radius 0 + Mark(12) 312 = 377/420 PP (43 unused)<br>
      L15: Range 70 + Radius 0 + Mark(13) 364 = 434/450 PP (16 unused)<br>
      L16: Range 75 + Radius 0 + Mark(13) 364 = 439/480 PP (41 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Mark(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Mark(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Mark(3)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Mark(4)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Mark(5)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Mark(6)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Mark(7)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Mark(8)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Mark(9)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Mark(9)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Mark(10)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Mark(10)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Mark(11)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Mark(11)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Mark(12)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Mark(12)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Mark(13)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Mark(13)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-root">
  Ranged Single Target Special: Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Root (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Root(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 5 + Radius 0 + Root(3) 36 = 41/60 PP (19 unused)<br>
      L3: Range 10 + Radius 0 + Root(4) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Root(5) 90 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 0 + Root(6) 126 = 146/150 PP (4 unused)<br>
      L6: Range 25 + Radius 0 + Root(6) 126 = 151/180 PP (29 unused)<br>
      L7: Range 30 + Radius 0 + Root(7) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Root(7) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Root(8) 216 = 256/270 PP (14 unused)<br>
      L10: Range 45 + Radius 0 + Root(8) 216 = 261/300 PP (39 unused)<br>
      L11: Range 50 + Radius 0 + Root(9) 270 = 320/330 PP (10 unused)<br>
      L12: Range 55 + Radius 0 + Root(9) 270 = 325/360 PP (35 unused)<br>
      L13: Range 60 + Radius 0 + Root(10) 330 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 0 + Root(10) 330 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 0 + Root(10) 330 = 400/450 PP (50 unused)<br>
      L16: Range 75 + Radius 0 + Root(11) 396 = 471/480 PP (9 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Root(X)** (Until Broken). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Root(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Root(2)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Root(3)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Root(4)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Root(5)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Root(6)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Root(6)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Root(7)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Root(7)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Root(8)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Root(8)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Root(9)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Root(9)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Root(10)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Root(11)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-ruin">
  Ranged Single Target Special: Ruin
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Ruin (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Ruin(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 0 + Ruin(4) 40 = 45/60 PP (15 unused)<br>
      L3: Range 10 + Radius 0 + Ruin(5) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Ruin(6) 84 = 99/120 PP (21 unused)<br>
      L5: Range 20 + Radius 0 + Ruin(7) 112 = 132/150 PP (18 unused)<br>
      L6: Range 25 + Radius 0 + Ruin(8) 144 = 169/180 PP (11 unused)<br>
      L7: Range 30 + Radius 0 + Ruin(9) 180 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 0 + Ruin(9) 180 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 0 + Ruin(10) 220 = 260/270 PP (10 unused)<br>
      L10: Range 45 + Radius 0 + Ruin(10) 220 = 265/300 PP (35 unused)<br>
      L11: Range 50 + Radius 0 + Ruin(11) 264 = 314/330 PP (16 unused)<br>
      L12: Range 55 + Radius 0 + Ruin(11) 264 = 319/360 PP (41 unused)<br>
      L13: Range 60 + Radius 0 + Ruin(12) 312 = 372/390 PP (18 unused)<br>
      L14: Range 65 + Radius 0 + Ruin(12) 312 = 377/420 PP (43 unused)<br>
      L15: Range 70 + Radius 0 + Ruin(13) 364 = 434/450 PP (16 unused)<br>
      L16: Range 75 + Radius 0 + Ruin(13) 364 = 439/480 PP (41 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Ruin(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Ruin(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Ruin(3)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Ruin(4)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Ruin(5)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Ruin(6)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Ruin(7)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Ruin(8)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Ruin(9)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Ruin(9)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Ruin(10)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Ruin(10)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Ruin(11)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Ruin(11)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Ruin(12)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Ruin(12)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Ruin(13)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Ruin(13)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-slow">
  Ranged Single Target Special: Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Slow (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Slow(3) 24 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 0 + Slow(4) 40 = 45/60 PP (15 unused)<br>
      L3: Range 10 + Radius 0 + Slow(5) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Slow(6) 84 = 99/120 PP (21 unused)<br>
      L5: Range 20 + Radius 0 + Slow(7) 112 = 132/150 PP (18 unused)<br>
      L6: Range 25 + Radius 0 + Slow(8) 144 = 169/180 PP (11 unused)<br>
      L7: Range 30 + Radius 0 + Slow(9) 180 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 0 + Slow(9) 180 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 0 + Slow(10) 220 = 260/270 PP (10 unused)<br>
      L10: Range 45 + Radius 0 + Slow(10) 220 = 265/300 PP (35 unused)<br>
      L11: Range 50 + Radius 0 + Slow(11) 264 = 314/330 PP (16 unused)<br>
      L12: Range 55 + Radius 0 + Slow(11) 264 = 319/360 PP (41 unused)<br>
      L13: Range 60 + Radius 0 + Slow(12) 312 = 372/390 PP (18 unused)<br>
      L14: Range 65 + Radius 0 + Slow(12) 312 = 377/420 PP (43 unused)<br>
      L15: Range 70 + Radius 0 + Slow(13) 364 = 434/450 PP (16 unused)<br>
      L16: Range 75 + Radius 0 + Slow(13) 364 = 439/480 PP (41 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Slow(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Slow(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Slow(3)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Slow(4)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Slow(5)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Slow(6)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Slow(7)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Slow(8)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Slow(9)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Slow(9)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Slow(10)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Slow(10)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Slow(11)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Slow(11)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Slow(12)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Slow(12)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Slow(13)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Slow(13)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-soulburn">
  Ranged Single Target Special: Soulburn
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Soulburn (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Soulburn(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 5 + Radius 0 + Soulburn(1) 8 = 13/60 PP (47 unused)<br>
      L3: Range 10 + Radius 0 + Soulburn(2) 80 = 90/90 PP (0 unused)<br>
      L4: Range 15 + Radius 0 + Soulburn(2) 80 = 95/120 PP (25 unused)<br>
      L5: Range 20 + Radius 0 + Soulburn(2) 80 = 100/150 PP (50 unused)<br>
      L6: Range 25 + Radius 0 + Soulburn(2) 80 = 105/180 PP (75 unused)<br>
      L7: Range 30 + Radius 0 + Soulburn(3) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Soulburn(3) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Soulburn(3) 168 = 208/270 PP (62 unused)<br>
      L10: Range 45 + Radius 0 + Soulburn(3) 168 = 213/300 PP (87 unused)<br>
      L11: Range 50 + Radius 0 + Soulburn(3) 168 = 218/330 PP (112 unused)<br>
      L12: Range 55 + Radius 0 + Soulburn(4) 288 = 343/360 PP (17 unused)<br>
      L13: Range 60 + Radius 0 + Soulburn(4) 288 = 348/390 PP (42 unused)<br>
      L14: Range 65 + Radius 0 + Soulburn(4) 288 = 353/420 PP (67 unused)<br>
      L15: Range 70 + Radius 0 + Soulburn(4) 288 = 358/450 PP (92 unused)<br>
      L16: Range 75 + Radius 0 + Soulburn(4) 288 = 363/480 PP (117 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Soulburn(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Soulburn(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Soulburn(1)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Soulburn(1)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Soulburn(2)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Soulburn(3)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Soulburn(4)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-sundered">
  Ranged Single Target Special: Sundered
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Sundered (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Sundered(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 5 + Radius 0 + Sundered(3) 36 = 41/60 PP (19 unused)<br>
      L3: Range 10 + Radius 0 + Sundered(4) 60 = 70/90 PP (20 unused)<br>
      L4: Range 15 + Radius 0 + Sundered(5) 90 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 0 + Sundered(6) 126 = 146/150 PP (4 unused)<br>
      L6: Range 25 + Radius 0 + Sundered(6) 126 = 151/180 PP (29 unused)<br>
      L7: Range 30 + Radius 0 + Sundered(7) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Sundered(7) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Sundered(8) 216 = 256/270 PP (14 unused)<br>
      L10: Range 45 + Radius 0 + Sundered(8) 216 = 261/300 PP (39 unused)<br>
      L11: Range 50 + Radius 0 + Sundered(9) 270 = 320/330 PP (10 unused)<br>
      L12: Range 55 + Radius 0 + Sundered(9) 270 = 325/360 PP (35 unused)<br>
      L13: Range 60 + Radius 0 + Sundered(10) 330 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 0 + Sundered(10) 330 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 0 + Sundered(10) 330 = 400/450 PP (50 unused)<br>
      L16: Range 75 + Radius 0 + Sundered(11) 396 = 471/480 PP (9 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Sundered(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Sundered(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Sundered(2)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Sundered(3)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Sundered(4)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Sundered(5)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Sundered(6)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Sundered(6)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Sundered(7)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Sundered(7)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Sundered(8)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Sundered(8)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Sundered(9)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Sundered(9)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Sundered(10)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Sundered(11)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-single-target-special-weaken">
  Ranged Single Target Special: Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Weaken (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Weaken(1) 8 = 8/30 PP (22 unused)<br>
      L2: Range 5 + Radius 0 + Weaken(1) 8 = 13/60 PP (47 unused)<br>
      L3: Range 10 + Radius 0 + Weaken(2) 80 = 90/90 PP (0 unused)<br>
      L4: Range 15 + Radius 0 + Weaken(2) 80 = 95/120 PP (25 unused)<br>
      L5: Range 20 + Radius 0 + Weaken(2) 80 = 100/150 PP (50 unused)<br>
      L6: Range 25 + Radius 0 + Weaken(2) 80 = 105/180 PP (75 unused)<br>
      L7: Range 30 + Radius 0 + Weaken(3) 168 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 0 + Weaken(3) 168 = 203/240 PP (37 unused)<br>
      L9: Range 40 + Radius 0 + Weaken(3) 168 = 208/270 PP (62 unused)<br>
      L10: Range 45 + Radius 0 + Weaken(3) 168 = 213/300 PP (87 unused)<br>
      L11: Range 50 + Radius 0 + Weaken(3) 168 = 218/330 PP (112 unused)<br>
      L12: Range 55 + Radius 0 + Weaken(4) 288 = 343/360 PP (17 unused)<br>
      L13: Range 60 + Radius 0 + Weaken(4) 288 = 348/390 PP (42 unused)<br>
      L14: Range 65 + Radius 0 + Weaken(4) 288 = 353/420 PP (67 unused)<br>
      L15: Range 70 + Radius 0 + Weaken(4) 288 = 358/450 PP (92 unused)<br>
      L16: Range 75 + Radius 0 + Weaken(4) 288 = 363/480 PP (117 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Weaken(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** One creature within printed Range. Make one legal Attack Roll against the target; only a successful roll applies the Special.

**Resolution:** On a successful delivery, apply the printed **Weaken(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | — | Instant | On successful delivery apply **Weaken(1)**; **no Power damage**. |
| **2** | Active, Special | 12 m | — | Instant | On successful delivery apply **Weaken(1)**; **no Power damage**. |
| **3** | Active, Special | 16 m | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **4** | Active, Special | 20 m | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **5** | Active, Special | 24 m | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **6** | Active, Special | 28 m | — | Instant | On successful delivery apply **Weaken(2)**; **no Power damage**. |
| **7** | Active, Special | 32 m | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **8** | Active, Special | 36 m | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **9** | Active, Special | 40 m | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **10** | Active, Special | 44 m | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **11** | Active, Special | 48 m | — | Instant | On successful delivery apply **Weaken(3)**; **no Power damage**. |
| **12** | Active, Special | 52 m | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **13** | Active, Special | 56 m | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **14** | Active, Special | 60 m | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **15** | Active, Special | 64 m | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |
| **16** | Active, Special | 68 m | — | Instant | On successful delivery apply **Weaken(4)**; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-blight">
  Melee AoE Special: Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Blight (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Blight(2) 9 = 29/30 PP (1 unused)<br>
      L2: Range 0 + Radius 20 + Blight(4) 30 = 50/60 PP (10 unused)<br>
      L3: Range 0 + Radius 50 + Blight(4) 30 = 80/90 PP (10 unused)<br>
      L4: Range 0 + Radius 50 + Blight(6) 63 = 113/120 PP (7 unused)<br>
      L5: Range 0 + Radius 80 + Blight(6) 63 = 143/150 PP (7 unused)<br>
      L6: Range 0 + Radius 80 + Blight(7) 84 = 164/180 PP (16 unused)<br>
      L7: Range 0 + Radius 120 + Blight(7) 84 = 204/210 PP (6 unused)<br>
      L8: Range 0 + Radius 120 + Blight(8) 108 = 228/240 PP (12 unused)<br>
      L9: Range 0 + Radius 120 + Blight(9) 135 = 255/270 PP (15 unused)<br>
      L10: Range 0 + Radius 165 + Blight(9) 135 = 300/300 PP (0 unused)<br>
      L11: Range 0 + Radius 165 + Blight(10) 165 = 330/330 PP (0 unused)<br>
      L12: Range 0 + Radius 165 + Blight(10) 165 = 330/360 PP (30 unused)<br>
      L13: Range 0 + Radius 220 + Blight(10) 165 = 385/390 PP (5 unused)<br>
      L14: Range 0 + Radius 220 + Blight(11) 198 = 418/420 PP (2 unused)<br>
      L15: Range 0 + Radius 220 + Blight(11) 198 = 418/450 PP (32 unused)<br>
      L16: Range 0 + Radius 280 + Blight(11) 198 = 478/480 PP (2 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Blight(X)** (Timed Disadvantage). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Blight(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Blight(2)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Blight(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Blight(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Blight(6)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Blight(6)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Blight(7)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Blight(7)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Blight(8)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Blight(9)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Blight(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Blight(10)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 6 m | Instant | Apply **Blight(10)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Blight(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Blight(11)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 7 m | Instant | Apply **Blight(11)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Blight(11)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-challenge">
  Melee AoE Special: Challenge
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Challenge (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Challenge(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 0 + Radius 20 + Challenge(1) 6 = 26/60 PP (34 unused)<br>
      L3: Range 0 + Radius 50 + Challenge(1) 6 = 56/90 PP (34 unused)<br>
      L4: Range 0 + Radius 50 + Challenge(2) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Challenge(2) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Challenge(2) 60 = 140/180 PP (40 unused)<br>
      L7: Range 0 + Radius 120 + Challenge(2) 60 = 180/210 PP (30 unused)<br>
      L8: Range 0 + Radius 120 + Challenge(2) 60 = 180/240 PP (60 unused)<br>
      L9: Range 0 + Radius 165 + Challenge(2) 60 = 225/270 PP (45 unused)<br>
      L10: Range 0 + Radius 165 + Challenge(3) 126 = 291/300 PP (9 unused)<br>
      L11: Range 0 + Radius 165 + Challenge(3) 126 = 291/330 PP (39 unused)<br>
      L12: Range 0 + Radius 220 + Challenge(3) 126 = 346/360 PP (14 unused)<br>
      L13: Range 0 + Radius 220 + Challenge(3) 126 = 346/390 PP (44 unused)<br>
      L14: Range 0 + Radius 280 + Challenge(3) 126 = 406/420 PP (14 unused)<br>
      L15: Range 0 + Radius 280 + Challenge(3) 126 = 406/450 PP (44 unused)<br>
      L16: Range 0 + Radius 280 + Challenge(3) 126 = 406/480 PP (74 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Challenge(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Challenge(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 8 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Challenge(3)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-corrode">
  Melee AoE Special: Corrode
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Corrode (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Corrode(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 0 + Radius 20 + Corrode(3) 36 = 56/60 PP (4 unused)<br>
      L3: Range 0 + Radius 50 + Corrode(3) 36 = 86/90 PP (4 unused)<br>
      L4: Range 0 + Radius 50 + Corrode(4) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Corrode(4) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Corrode(5) 90 = 170/180 PP (10 unused)<br>
      L7: Range 0 + Radius 120 + Corrode(5) 90 = 210/210 PP (0 unused)<br>
      L8: Range 0 + Radius 120 + Corrode(5) 90 = 210/240 PP (30 unused)<br>
      L9: Range 0 + Radius 165 + Corrode(5) 90 = 255/270 PP (15 unused)<br>
      L10: Range 0 + Radius 165 + Corrode(6) 126 = 291/300 PP (9 unused)<br>
      L11: Range 0 + Radius 165 + Corrode(6) 126 = 291/330 PP (39 unused)<br>
      L12: Range 0 + Radius 220 + Corrode(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 0 + Radius 220 + Corrode(7) 168 = 388/390 PP (2 unused)<br>
      L14: Range 0 + Radius 220 + Corrode(7) 168 = 388/420 PP (32 unused)<br>
      L15: Range 0 + Radius 280 + Corrode(7) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Corrode(7) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Corrode(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Corrode(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Corrode(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Corrode(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Corrode(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Corrode(7)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Corrode(7)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Corrode(7)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Corrode(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-disoriented">
  Melee AoE Special: Disoriented
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Disoriented (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Disoriented(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 0 + Radius 20 + Disoriented(1) 8 = 28/60 PP (32 unused)<br>
      L3: Range 0 + Radius 50 + Disoriented(1) 8 = 58/90 PP (32 unused)<br>
      L4: Range 0 + Radius 50 + Disoriented(1) 8 = 58/120 PP (62 unused)<br>
      L5: Range 0 + Radius 80 + Disoriented(1) 8 = 88/150 PP (62 unused)<br>
      L6: Range 0 + Radius 80 + Disoriented(2) 80 = 160/180 PP (20 unused)<br>
      L7: Range 0 + Radius 120 + Disoriented(2) 80 = 200/210 PP (10 unused)<br>
      L8: Range 0 + Radius 120 + Disoriented(2) 80 = 200/240 PP (40 unused)<br>
      L9: Range 0 + Radius 165 + Disoriented(2) 80 = 245/270 PP (25 unused)<br>
      L10: Range 0 + Radius 165 + Disoriented(2) 80 = 245/300 PP (55 unused)<br>
      L11: Range 0 + Radius 220 + Disoriented(2) 80 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 220 + Disoriented(2) 80 = 300/360 PP (60 unused)<br>
      L13: Range 0 + Radius 280 + Disoriented(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 0 + Radius 280 + Disoriented(2) 80 = 360/420 PP (60 unused)<br>
      L15: Range 0 + Radius 280 + Disoriented(3) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Disoriented(3) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Disoriented(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Disoriented(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 7 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 8 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 8 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Disoriented(3)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Disoriented(3)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-expose">
  Melee AoE Special: Expose
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Expose (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Expose(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 0 + Radius 20 + Expose(2) 24 = 44/60 PP (16 unused)<br>
      L3: Range 0 + Radius 50 + Expose(2) 24 = 74/90 PP (16 unused)<br>
      L4: Range 0 + Radius 50 + Expose(3) 48 = 98/120 PP (22 unused)<br>
      L5: Range 0 + Radius 80 + Expose(3) 48 = 128/150 PP (22 unused)<br>
      L6: Range 0 + Radius 80 + Expose(4) 80 = 160/180 PP (20 unused)<br>
      L7: Range 0 + Radius 120 + Expose(4) 80 = 200/210 PP (10 unused)<br>
      L8: Range 0 + Radius 120 + Expose(5) 120 = 240/240 PP (0 unused)<br>
      L9: Range 0 + Radius 120 + Expose(5) 120 = 240/270 PP (30 unused)<br>
      L10: Range 0 + Radius 165 + Expose(5) 120 = 285/300 PP (15 unused)<br>
      L11: Range 0 + Radius 165 + Expose(5) 120 = 285/330 PP (45 unused)<br>
      L12: Range 0 + Radius 220 + Expose(5) 120 = 340/360 PP (20 unused)<br>
      L13: Range 0 + Radius 220 + Expose(6) 168 = 388/390 PP (2 unused)<br>
      L14: Range 0 + Radius 220 + Expose(6) 168 = 388/420 PP (32 unused)<br>
      L15: Range 0 + Radius 280 + Expose(6) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Expose(6) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Expose(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Expose(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Expose(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Expose(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Expose(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Expose(6)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Expose(6)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Expose(6)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Expose(6)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-hex">
  Melee AoE Special: Hex
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Hex (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Hex(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 0 + Radius 20 + Hex(3) 36 = 56/60 PP (4 unused)<br>
      L3: Range 0 + Radius 50 + Hex(3) 36 = 86/90 PP (4 unused)<br>
      L4: Range 0 + Radius 50 + Hex(4) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Hex(4) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Hex(5) 90 = 170/180 PP (10 unused)<br>
      L7: Range 0 + Radius 120 + Hex(5) 90 = 210/210 PP (0 unused)<br>
      L8: Range 0 + Radius 120 + Hex(5) 90 = 210/240 PP (30 unused)<br>
      L9: Range 0 + Radius 165 + Hex(5) 90 = 255/270 PP (15 unused)<br>
      L10: Range 0 + Radius 165 + Hex(6) 126 = 291/300 PP (9 unused)<br>
      L11: Range 0 + Radius 165 + Hex(6) 126 = 291/330 PP (39 unused)<br>
      L12: Range 0 + Radius 220 + Hex(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 0 + Radius 220 + Hex(7) 168 = 388/390 PP (2 unused)<br>
      L14: Range 0 + Radius 220 + Hex(7) 168 = 388/420 PP (32 unused)<br>
      L15: Range 0 + Radius 280 + Hex(7) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Hex(7) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Hex(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Hex(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Hex(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Hex(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Hex(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Hex(7)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Hex(7)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Hex(7)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Hex(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-lacerate">
  Melee AoE Special: Lacerate
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Lacerate (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Lacerate(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 20 + Lacerate(4) 40 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 50 + Lacerate(4) 40 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 50 + Lacerate(5) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Lacerate(5) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Lacerate(6) 84 = 164/180 PP (16 unused)<br>
      L7: Range 0 + Radius 120 + Lacerate(6) 84 = 204/210 PP (6 unused)<br>
      L8: Range 0 + Radius 120 + Lacerate(7) 112 = 232/240 PP (8 unused)<br>
      L9: Range 0 + Radius 120 + Lacerate(8) 144 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 120 + Lacerate(9) 180 = 300/300 PP (0 unused)<br>
      L11: Range 0 + Radius 120 + Lacerate(9) 180 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 165 + Lacerate(9) 180 = 345/360 PP (15 unused)<br>
      L13: Range 0 + Radius 165 + Lacerate(10) 220 = 385/390 PP (5 unused)<br>
      L14: Range 0 + Radius 165 + Lacerate(10) 220 = 385/420 PP (35 unused)<br>
      L15: Range 0 + Radius 220 + Lacerate(10) 220 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 220 + Lacerate(10) 220 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Lacerate(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Lacerate(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Lacerate(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Lacerate(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Lacerate(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Lacerate(5)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Lacerate(5)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Lacerate(6)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Lacerate(6)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Lacerate(7)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Lacerate(8)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 5 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 5 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 6 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 6 m | Instant | Apply **Lacerate(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 6 m | Instant | Apply **Lacerate(10)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 7 m | Instant | Apply **Lacerate(10)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 7 m | Instant | Apply **Lacerate(10)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-mark">
  Melee AoE Special: Mark
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Mark (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Mark(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 20 + Mark(4) 40 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 50 + Mark(4) 40 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 50 + Mark(5) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Mark(5) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Mark(6) 84 = 164/180 PP (16 unused)<br>
      L7: Range 0 + Radius 120 + Mark(6) 84 = 204/210 PP (6 unused)<br>
      L8: Range 0 + Radius 120 + Mark(7) 112 = 232/240 PP (8 unused)<br>
      L9: Range 0 + Radius 120 + Mark(8) 144 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 120 + Mark(9) 180 = 300/300 PP (0 unused)<br>
      L11: Range 0 + Radius 120 + Mark(9) 180 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 165 + Mark(9) 180 = 345/360 PP (15 unused)<br>
      L13: Range 0 + Radius 165 + Mark(10) 220 = 385/390 PP (5 unused)<br>
      L14: Range 0 + Radius 165 + Mark(10) 220 = 385/420 PP (35 unused)<br>
      L15: Range 0 + Radius 220 + Mark(10) 220 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 220 + Mark(10) 220 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Mark(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Mark(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Mark(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Mark(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Mark(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Mark(5)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Mark(5)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Mark(6)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Mark(6)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Mark(7)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Mark(8)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 5 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 5 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 6 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 6 m | Instant | Apply **Mark(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 6 m | Instant | Apply **Mark(10)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 7 m | Instant | Apply **Mark(10)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 7 m | Instant | Apply **Mark(10)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-root">
  Melee AoE Special: Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Root (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Root(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 0 + Radius 20 + Root(3) 36 = 56/60 PP (4 unused)<br>
      L3: Range 0 + Radius 50 + Root(3) 36 = 86/90 PP (4 unused)<br>
      L4: Range 0 + Radius 50 + Root(4) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Root(4) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Root(5) 90 = 170/180 PP (10 unused)<br>
      L7: Range 0 + Radius 120 + Root(5) 90 = 210/210 PP (0 unused)<br>
      L8: Range 0 + Radius 120 + Root(5) 90 = 210/240 PP (30 unused)<br>
      L9: Range 0 + Radius 165 + Root(5) 90 = 255/270 PP (15 unused)<br>
      L10: Range 0 + Radius 165 + Root(6) 126 = 291/300 PP (9 unused)<br>
      L11: Range 0 + Radius 165 + Root(6) 126 = 291/330 PP (39 unused)<br>
      L12: Range 0 + Radius 220 + Root(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 0 + Radius 220 + Root(7) 168 = 388/390 PP (2 unused)<br>
      L14: Range 0 + Radius 220 + Root(7) 168 = 388/420 PP (32 unused)<br>
      L15: Range 0 + Radius 280 + Root(7) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Root(7) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Root(X)** (Until Broken). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Root(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 1 m | Instant | Apply **Root(2)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Root(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Root(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Root(7)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Root(7)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Root(7)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Root(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-ruin">
  Melee AoE Special: Ruin
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Ruin (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Ruin(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 20 + Ruin(4) 40 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 50 + Ruin(4) 40 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 50 + Ruin(5) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Ruin(5) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Ruin(6) 84 = 164/180 PP (16 unused)<br>
      L7: Range 0 + Radius 120 + Ruin(6) 84 = 204/210 PP (6 unused)<br>
      L8: Range 0 + Radius 120 + Ruin(7) 112 = 232/240 PP (8 unused)<br>
      L9: Range 0 + Radius 120 + Ruin(8) 144 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 120 + Ruin(9) 180 = 300/300 PP (0 unused)<br>
      L11: Range 0 + Radius 120 + Ruin(9) 180 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 165 + Ruin(9) 180 = 345/360 PP (15 unused)<br>
      L13: Range 0 + Radius 165 + Ruin(10) 220 = 385/390 PP (5 unused)<br>
      L14: Range 0 + Radius 165 + Ruin(10) 220 = 385/420 PP (35 unused)<br>
      L15: Range 0 + Radius 220 + Ruin(10) 220 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 220 + Ruin(10) 220 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Ruin(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Ruin(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Ruin(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Ruin(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Ruin(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Ruin(5)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Ruin(5)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Ruin(6)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Ruin(6)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Ruin(7)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Ruin(8)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 5 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 5 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 6 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 6 m | Instant | Apply **Ruin(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 6 m | Instant | Apply **Ruin(10)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 7 m | Instant | Apply **Ruin(10)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 7 m | Instant | Apply **Ruin(10)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-slow">
  Melee AoE Special: Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Slow (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Slow(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 0 + Radius 20 + Slow(4) 40 = 60/60 PP (0 unused)<br>
      L3: Range 0 + Radius 50 + Slow(4) 40 = 90/90 PP (0 unused)<br>
      L4: Range 0 + Radius 50 + Slow(5) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Slow(5) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Slow(6) 84 = 164/180 PP (16 unused)<br>
      L7: Range 0 + Radius 120 + Slow(6) 84 = 204/210 PP (6 unused)<br>
      L8: Range 0 + Radius 120 + Slow(7) 112 = 232/240 PP (8 unused)<br>
      L9: Range 0 + Radius 120 + Slow(8) 144 = 264/270 PP (6 unused)<br>
      L10: Range 0 + Radius 120 + Slow(9) 180 = 300/300 PP (0 unused)<br>
      L11: Range 0 + Radius 120 + Slow(9) 180 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 165 + Slow(9) 180 = 345/360 PP (15 unused)<br>
      L13: Range 0 + Radius 165 + Slow(10) 220 = 385/390 PP (5 unused)<br>
      L14: Range 0 + Radius 165 + Slow(10) 220 = 385/420 PP (35 unused)<br>
      L15: Range 0 + Radius 220 + Slow(10) 220 = 440/450 PP (10 unused)<br>
      L16: Range 0 + Radius 220 + Slow(10) 220 = 440/480 PP (40 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Slow(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Slow(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Slow(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Slow(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Slow(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Slow(5)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Slow(5)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Slow(6)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Slow(6)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Slow(7)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 5 m | Instant | Apply **Slow(8)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 5 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 5 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 6 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 6 m | Instant | Apply **Slow(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 6 m | Instant | Apply **Slow(10)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 7 m | Instant | Apply **Slow(10)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 7 m | Instant | Apply **Slow(10)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-soulburn">
  Melee AoE Special: Soulburn
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Soulburn (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Soulburn(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 0 + Radius 20 + Soulburn(1) 8 = 28/60 PP (32 unused)<br>
      L3: Range 0 + Radius 50 + Soulburn(1) 8 = 58/90 PP (32 unused)<br>
      L4: Range 0 + Radius 50 + Soulburn(1) 8 = 58/120 PP (62 unused)<br>
      L5: Range 0 + Radius 80 + Soulburn(1) 8 = 88/150 PP (62 unused)<br>
      L6: Range 0 + Radius 80 + Soulburn(2) 80 = 160/180 PP (20 unused)<br>
      L7: Range 0 + Radius 120 + Soulburn(2) 80 = 200/210 PP (10 unused)<br>
      L8: Range 0 + Radius 120 + Soulburn(2) 80 = 200/240 PP (40 unused)<br>
      L9: Range 0 + Radius 165 + Soulburn(2) 80 = 245/270 PP (25 unused)<br>
      L10: Range 0 + Radius 165 + Soulburn(2) 80 = 245/300 PP (55 unused)<br>
      L11: Range 0 + Radius 220 + Soulburn(2) 80 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 220 + Soulburn(2) 80 = 300/360 PP (60 unused)<br>
      L13: Range 0 + Radius 280 + Soulburn(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 0 + Radius 280 + Soulburn(2) 80 = 360/420 PP (60 unused)<br>
      L15: Range 0 + Radius 280 + Soulburn(3) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Soulburn(3) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Soulburn(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Soulburn(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 7 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 8 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 8 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Soulburn(3)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Soulburn(3)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-sundered">
  Melee AoE Special: Sundered
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Sundered (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Sundered(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 0 + Radius 20 + Sundered(3) 36 = 56/60 PP (4 unused)<br>
      L3: Range 0 + Radius 50 + Sundered(3) 36 = 86/90 PP (4 unused)<br>
      L4: Range 0 + Radius 50 + Sundered(4) 60 = 110/120 PP (10 unused)<br>
      L5: Range 0 + Radius 80 + Sundered(4) 60 = 140/150 PP (10 unused)<br>
      L6: Range 0 + Radius 80 + Sundered(5) 90 = 170/180 PP (10 unused)<br>
      L7: Range 0 + Radius 120 + Sundered(5) 90 = 210/210 PP (0 unused)<br>
      L8: Range 0 + Radius 120 + Sundered(5) 90 = 210/240 PP (30 unused)<br>
      L9: Range 0 + Radius 165 + Sundered(5) 90 = 255/270 PP (15 unused)<br>
      L10: Range 0 + Radius 165 + Sundered(6) 126 = 291/300 PP (9 unused)<br>
      L11: Range 0 + Radius 165 + Sundered(6) 126 = 291/330 PP (39 unused)<br>
      L12: Range 0 + Radius 220 + Sundered(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 0 + Radius 220 + Sundered(7) 168 = 388/390 PP (2 unused)<br>
      L14: Range 0 + Radius 220 + Sundered(7) 168 = 388/420 PP (32 unused)<br>
      L15: Range 0 + Radius 280 + Sundered(7) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Sundered(7) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Sundered(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Sundered(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Sundered(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Sundered(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Sundered(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 6 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 7 m | Instant | Apply **Sundered(7)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 7 m | Instant | Apply **Sundered(7)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Sundered(7)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Sundered(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="melee-aoe-special-weaken">
  Melee AoE Special: Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Weaken (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Weaken(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 0 + Radius 20 + Weaken(1) 8 = 28/60 PP (32 unused)<br>
      L3: Range 0 + Radius 50 + Weaken(1) 8 = 58/90 PP (32 unused)<br>
      L4: Range 0 + Radius 50 + Weaken(1) 8 = 58/120 PP (62 unused)<br>
      L5: Range 0 + Radius 80 + Weaken(1) 8 = 88/150 PP (62 unused)<br>
      L6: Range 0 + Radius 80 + Weaken(2) 80 = 160/180 PP (20 unused)<br>
      L7: Range 0 + Radius 120 + Weaken(2) 80 = 200/210 PP (10 unused)<br>
      L8: Range 0 + Radius 120 + Weaken(2) 80 = 200/240 PP (40 unused)<br>
      L9: Range 0 + Radius 165 + Weaken(2) 80 = 245/270 PP (25 unused)<br>
      L10: Range 0 + Radius 165 + Weaken(2) 80 = 245/300 PP (55 unused)<br>
      L11: Range 0 + Radius 220 + Weaken(2) 80 = 300/330 PP (30 unused)<br>
      L12: Range 0 + Radius 220 + Weaken(2) 80 = 300/360 PP (60 unused)<br>
      L13: Range 0 + Radius 280 + Weaken(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 0 + Radius 280 + Weaken(2) 80 = 360/420 PP (60 unused)<br>
      L15: Range 0 + Radius 280 + Weaken(3) 168 = 448/450 PP (2 unused)<br>
      L16: Range 0 + Radius 280 + Weaken(3) 168 = 448/480 PP (32 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Weaken(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Self-centered melee area. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Weaken(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | Self | Radius 2 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | Self | Radius 2 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | Self | Radius 3 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | Self | Radius 3 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | Self | Radius 4 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | Self | Radius 4 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | Self | Radius 5 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | Self | Radius 5 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | Self | Radius 6 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | Self | Radius 6 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | Self | Radius 7 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | Self | Radius 7 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | Self | Radius 8 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | Self | Radius 8 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | Self | Radius 8 m | Instant | Apply **Weaken(3)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | Self | Radius 8 m | Instant | Apply **Weaken(3)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-blight">
  Ranged AoE Special: Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Blight (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Blight(2) 9 = 29/30 PP (1 unused)<br>
      L2: Range 5 + Radius 20 + Blight(4) 30 = 55/60 PP (5 unused)<br>
      L3: Range 10 + Radius 50 + Blight(4) 30 = 90/90 PP (0 unused)<br>
      L4: Range 15 + Radius 50 + Blight(5) 45 = 110/120 PP (10 unused)<br>
      L5: Range 20 + Radius 80 + Blight(5) 45 = 145/150 PP (5 unused)<br>
      L6: Range 25 + Radius 80 + Blight(6) 63 = 168/180 PP (12 unused)<br>
      L7: Range 30 + Radius 80 + Blight(7) 84 = 194/210 PP (16 unused)<br>
      L8: Range 35 + Radius 120 + Blight(7) 84 = 239/240 PP (1 unused)<br>
      L9: Range 40 + Radius 120 + Blight(8) 108 = 268/270 PP (2 unused)<br>
      L10: Range 45 + Radius 120 + Blight(9) 135 = 300/300 PP (0 unused)<br>
      L11: Range 50 + Radius 120 + Blight(9) 135 = 305/330 PP (25 unused)<br>
      L12: Range 55 + Radius 165 + Blight(9) 135 = 355/360 PP (5 unused)<br>
      L13: Range 60 + Radius 165 + Blight(10) 165 = 390/390 PP (0 unused)<br>
      L14: Range 65 + Radius 165 + Blight(10) 165 = 395/420 PP (25 unused)<br>
      L15: Range 70 + Radius 165 + Blight(11) 198 = 433/450 PP (17 unused)<br>
      L16: Range 75 + Radius 165 + Blight(12) 234 = 474/480 PP (6 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Blight(X)** (Timed Disadvantage). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Blight(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Blight(2)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Blight(4)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Blight(4)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Blight(5)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Blight(5)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Blight(6)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 4 m | Instant | Apply **Blight(7)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Blight(7)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Blight(8)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 5 m | Instant | Apply **Blight(9)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 5 m | Instant | Apply **Blight(9)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Blight(9)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Blight(10)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 6 m | Instant | Apply **Blight(10)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 6 m | Instant | Apply **Blight(11)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 6 m | Instant | Apply **Blight(12)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-challenge">
  Ranged AoE Special: Challenge
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Challenge (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Challenge(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 5 + Radius 20 + Challenge(1) 6 = 31/60 PP (29 unused)<br>
      L3: Range 10 + Radius 50 + Challenge(1) 6 = 66/90 PP (24 unused)<br>
      L4: Range 15 + Radius 50 + Challenge(1) 6 = 71/120 PP (49 unused)<br>
      L5: Range 20 + Radius 80 + Challenge(1) 6 = 106/150 PP (44 unused)<br>
      L6: Range 25 + Radius 80 + Challenge(2) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Challenge(2) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Challenge(2) 60 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 165 + Challenge(2) 60 = 265/270 PP (5 unused)<br>
      L10: Range 45 + Radius 165 + Challenge(2) 60 = 270/300 PP (30 unused)<br>
      L11: Range 50 + Radius 220 + Challenge(2) 60 = 330/330 PP (0 unused)<br>
      L12: Range 55 + Radius 220 + Challenge(2) 60 = 335/360 PP (25 unused)<br>
      L13: Range 60 + Radius 220 + Challenge(2) 60 = 340/390 PP (50 unused)<br>
      L14: Range 65 + Radius 280 + Challenge(2) 60 = 405/420 PP (15 unused)<br>
      L15: Range 70 + Radius 280 + Challenge(2) 60 = 410/450 PP (40 unused)<br>
      L16: Range 75 + Radius 280 + Challenge(2) 60 = 415/480 PP (65 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Challenge(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Challenge(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Challenge(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 6 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 7 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 7 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 7 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 8 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 8 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 8 m | Instant | Apply **Challenge(2)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-corrode">
  Ranged AoE Special: Corrode
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Corrode (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Corrode(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 5 + Radius 20 + Corrode(2) 18 = 43/60 PP (17 unused)<br>
      L3: Range 10 + Radius 50 + Corrode(2) 18 = 78/90 PP (12 unused)<br>
      L4: Range 15 + Radius 50 + Corrode(3) 36 = 101/120 PP (19 unused)<br>
      L5: Range 20 + Radius 80 + Corrode(3) 36 = 136/150 PP (14 unused)<br>
      L6: Range 25 + Radius 80 + Corrode(4) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Corrode(4) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Corrode(4) 60 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 165 + Corrode(4) 60 = 265/270 PP (5 unused)<br>
      L10: Range 45 + Radius 165 + Corrode(5) 90 = 300/300 PP (0 unused)<br>
      L11: Range 50 + Radius 165 + Corrode(5) 90 = 305/330 PP (25 unused)<br>
      L12: Range 55 + Radius 165 + Corrode(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 60 + Radius 165 + Corrode(6) 126 = 351/390 PP (39 unused)<br>
      L14: Range 65 + Radius 220 + Corrode(6) 126 = 411/420 PP (9 unused)<br>
      L15: Range 70 + Radius 220 + Corrode(6) 126 = 416/450 PP (34 unused)<br>
      L16: Range 75 + Radius 220 + Corrode(7) 168 = 463/480 PP (17 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Corrode(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Corrode(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Corrode(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Corrode(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Corrode(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Corrode(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Corrode(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 6 m | Instant | Apply **Corrode(4)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Corrode(5)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 7 m | Instant | Apply **Corrode(6)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Corrode(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-disoriented">
  Ranged AoE Special: Disoriented
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Disoriented (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Disoriented(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 5 + Radius 20 + Disoriented(1) 8 = 33/60 PP (27 unused)<br>
      L3: Range 10 + Radius 50 + Disoriented(1) 8 = 68/90 PP (22 unused)<br>
      L4: Range 15 + Radius 50 + Disoriented(1) 8 = 73/120 PP (47 unused)<br>
      L5: Range 20 + Radius 80 + Disoriented(1) 8 = 108/150 PP (42 unused)<br>
      L6: Range 25 + Radius 80 + Disoriented(1) 8 = 113/180 PP (67 unused)<br>
      L7: Range 30 + Radius 120 + Disoriented(1) 8 = 158/210 PP (52 unused)<br>
      L8: Range 35 + Radius 120 + Disoriented(2) 80 = 235/240 PP (5 unused)<br>
      L9: Range 40 + Radius 120 + Disoriented(2) 80 = 240/270 PP (30 unused)<br>
      L10: Range 45 + Radius 165 + Disoriented(2) 80 = 290/300 PP (10 unused)<br>
      L11: Range 50 + Radius 165 + Disoriented(2) 80 = 295/330 PP (35 unused)<br>
      L12: Range 55 + Radius 220 + Disoriented(2) 80 = 355/360 PP (5 unused)<br>
      L13: Range 60 + Radius 220 + Disoriented(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 65 + Radius 220 + Disoriented(2) 80 = 365/420 PP (55 unused)<br>
      L15: Range 70 + Radius 280 + Disoriented(2) 80 = 430/450 PP (20 unused)<br>
      L16: Range 75 + Radius 280 + Disoriented(2) 80 = 435/480 PP (45 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Disoriented(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Disoriented(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Disoriented(1)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 7 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 7 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 8 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 8 m | Instant | Apply **Disoriented(2)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-expose">
  Ranged AoE Special: Expose
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Expose (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Expose(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 5 + Radius 20 + Expose(2) 24 = 49/60 PP (11 unused)<br>
      L3: Range 10 + Radius 50 + Expose(2) 24 = 84/90 PP (6 unused)<br>
      L4: Range 15 + Radius 50 + Expose(3) 48 = 113/120 PP (7 unused)<br>
      L5: Range 20 + Radius 80 + Expose(3) 48 = 148/150 PP (2 unused)<br>
      L6: Range 25 + Radius 80 + Expose(3) 48 = 153/180 PP (27 unused)<br>
      L7: Range 30 + Radius 120 + Expose(3) 48 = 198/210 PP (12 unused)<br>
      L8: Range 35 + Radius 120 + Expose(4) 80 = 235/240 PP (5 unused)<br>
      L9: Range 40 + Radius 120 + Expose(4) 80 = 240/270 PP (30 unused)<br>
      L10: Range 45 + Radius 165 + Expose(4) 80 = 290/300 PP (10 unused)<br>
      L11: Range 50 + Radius 165 + Expose(4) 80 = 295/330 PP (35 unused)<br>
      L12: Range 55 + Radius 220 + Expose(4) 80 = 355/360 PP (5 unused)<br>
      L13: Range 60 + Radius 220 + Expose(4) 80 = 360/390 PP (30 unused)<br>
      L14: Range 65 + Radius 220 + Expose(5) 120 = 405/420 PP (15 unused)<br>
      L15: Range 70 + Radius 220 + Expose(5) 120 = 410/450 PP (40 unused)<br>
      L16: Range 75 + Radius 280 + Expose(5) 120 = 475/480 PP (5 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Expose(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Expose(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Expose(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Expose(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Expose(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Expose(3)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 7 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 7 m | Instant | Apply **Expose(4)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 7 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 8 m | Instant | Apply **Expose(5)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-hex">
  Ranged AoE Special: Hex
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Hex (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Hex(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 5 + Radius 20 + Hex(2) 18 = 43/60 PP (17 unused)<br>
      L3: Range 10 + Radius 50 + Hex(2) 18 = 78/90 PP (12 unused)<br>
      L4: Range 15 + Radius 50 + Hex(3) 36 = 101/120 PP (19 unused)<br>
      L5: Range 20 + Radius 80 + Hex(3) 36 = 136/150 PP (14 unused)<br>
      L6: Range 25 + Radius 80 + Hex(4) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Hex(4) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Hex(4) 60 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 165 + Hex(4) 60 = 265/270 PP (5 unused)<br>
      L10: Range 45 + Radius 165 + Hex(5) 90 = 300/300 PP (0 unused)<br>
      L11: Range 50 + Radius 165 + Hex(5) 90 = 305/330 PP (25 unused)<br>
      L12: Range 55 + Radius 165 + Hex(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 60 + Radius 165 + Hex(6) 126 = 351/390 PP (39 unused)<br>
      L14: Range 65 + Radius 220 + Hex(6) 126 = 411/420 PP (9 unused)<br>
      L15: Range 70 + Radius 220 + Hex(6) 126 = 416/450 PP (34 unused)<br>
      L16: Range 75 + Radius 220 + Hex(7) 168 = 463/480 PP (17 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Hex(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Hex(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Hex(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Hex(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Hex(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Hex(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Hex(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 6 m | Instant | Apply **Hex(4)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Hex(5)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 7 m | Instant | Apply **Hex(6)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Hex(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-lacerate">
  Ranged AoE Special: Lacerate
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Lacerate (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Lacerate(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 20 + Lacerate(3) 24 = 49/60 PP (11 unused)<br>
      L3: Range 10 + Radius 50 + Lacerate(3) 24 = 84/90 PP (6 unused)<br>
      L4: Range 15 + Radius 50 + Lacerate(4) 40 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 80 + Lacerate(4) 40 = 140/150 PP (10 unused)<br>
      L6: Range 25 + Radius 80 + Lacerate(5) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Lacerate(5) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Lacerate(6) 84 = 239/240 PP (1 unused)<br>
      L9: Range 40 + Radius 120 + Lacerate(6) 84 = 244/270 PP (26 unused)<br>
      L10: Range 45 + Radius 165 + Lacerate(6) 84 = 294/300 PP (6 unused)<br>
      L11: Range 50 + Radius 165 + Lacerate(7) 112 = 327/330 PP (3 unused)<br>
      L12: Range 55 + Radius 165 + Lacerate(7) 112 = 332/360 PP (28 unused)<br>
      L13: Range 60 + Radius 165 + Lacerate(8) 144 = 369/390 PP (21 unused)<br>
      L14: Range 65 + Radius 165 + Lacerate(9) 180 = 410/420 PP (10 unused)<br>
      L15: Range 70 + Radius 165 + Lacerate(9) 180 = 415/450 PP (35 unused)<br>
      L16: Range 75 + Radius 220 + Lacerate(9) 180 = 475/480 PP (5 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Lacerate(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Lacerate(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Lacerate(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Lacerate(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Lacerate(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Lacerate(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Lacerate(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Lacerate(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Lacerate(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Lacerate(6)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Lacerate(6)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Lacerate(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Lacerate(7)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Lacerate(7)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Lacerate(8)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 6 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 6 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Lacerate(9)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-mark">
  Ranged AoE Special: Mark
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Mark (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Mark(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 20 + Mark(3) 24 = 49/60 PP (11 unused)<br>
      L3: Range 10 + Radius 50 + Mark(3) 24 = 84/90 PP (6 unused)<br>
      L4: Range 15 + Radius 50 + Mark(4) 40 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 80 + Mark(4) 40 = 140/150 PP (10 unused)<br>
      L6: Range 25 + Radius 80 + Mark(5) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Mark(5) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Mark(6) 84 = 239/240 PP (1 unused)<br>
      L9: Range 40 + Radius 120 + Mark(6) 84 = 244/270 PP (26 unused)<br>
      L10: Range 45 + Radius 165 + Mark(6) 84 = 294/300 PP (6 unused)<br>
      L11: Range 50 + Radius 165 + Mark(7) 112 = 327/330 PP (3 unused)<br>
      L12: Range 55 + Radius 165 + Mark(7) 112 = 332/360 PP (28 unused)<br>
      L13: Range 60 + Radius 165 + Mark(8) 144 = 369/390 PP (21 unused)<br>
      L14: Range 65 + Radius 165 + Mark(9) 180 = 410/420 PP (10 unused)<br>
      L15: Range 70 + Radius 165 + Mark(9) 180 = 415/450 PP (35 unused)<br>
      L16: Range 75 + Radius 220 + Mark(9) 180 = 475/480 PP (5 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Mark(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Mark(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Mark(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Mark(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Mark(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Mark(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Mark(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Mark(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Mark(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Mark(6)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Mark(6)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Mark(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Mark(7)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Mark(7)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Mark(8)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 6 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 6 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Mark(9)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-root">
  Ranged AoE Special: Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Root (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 0 + Root(2) 18 = 18/30 PP (12 unused)<br>
      L2: Range 5 + Radius 20 + Root(2) 18 = 43/60 PP (17 unused)<br>
      L3: Range 10 + Radius 50 + Root(2) 18 = 78/90 PP (12 unused)<br>
      L4: Range 15 + Radius 50 + Root(3) 36 = 101/120 PP (19 unused)<br>
      L5: Range 20 + Radius 80 + Root(3) 36 = 136/150 PP (14 unused)<br>
      L6: Range 25 + Radius 80 + Root(4) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Root(4) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Root(4) 60 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 165 + Root(4) 60 = 265/270 PP (5 unused)<br>
      L10: Range 45 + Radius 165 + Root(5) 90 = 300/300 PP (0 unused)<br>
      L11: Range 50 + Radius 165 + Root(5) 90 = 305/330 PP (25 unused)<br>
      L12: Range 55 + Radius 165 + Root(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 60 + Radius 165 + Root(6) 126 = 351/390 PP (39 unused)<br>
      L14: Range 65 + Radius 220 + Root(6) 126 = 411/420 PP (9 unused)<br>
      L15: Range 70 + Radius 220 + Root(6) 126 = 416/450 PP (34 unused)<br>
      L16: Range 75 + Radius 220 + Root(7) 168 = 463/480 PP (17 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Root(X)** (Until Broken). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Root(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 1 m | Instant | Apply **Root(2)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Root(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Root(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Root(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Root(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 6 m | Instant | Apply **Root(4)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Root(5)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 7 m | Instant | Apply **Root(6)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Root(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-ruin">
  Ranged AoE Special: Ruin
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Ruin (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Ruin(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 20 + Ruin(3) 24 = 49/60 PP (11 unused)<br>
      L3: Range 10 + Radius 50 + Ruin(3) 24 = 84/90 PP (6 unused)<br>
      L4: Range 15 + Radius 50 + Ruin(4) 40 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 80 + Ruin(4) 40 = 140/150 PP (10 unused)<br>
      L6: Range 25 + Radius 80 + Ruin(5) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Ruin(5) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Ruin(6) 84 = 239/240 PP (1 unused)<br>
      L9: Range 40 + Radius 120 + Ruin(6) 84 = 244/270 PP (26 unused)<br>
      L10: Range 45 + Radius 165 + Ruin(6) 84 = 294/300 PP (6 unused)<br>
      L11: Range 50 + Radius 165 + Ruin(7) 112 = 327/330 PP (3 unused)<br>
      L12: Range 55 + Radius 165 + Ruin(7) 112 = 332/360 PP (28 unused)<br>
      L13: Range 60 + Radius 165 + Ruin(8) 144 = 369/390 PP (21 unused)<br>
      L14: Range 65 + Radius 165 + Ruin(9) 180 = 410/420 PP (10 unused)<br>
      L15: Range 70 + Radius 165 + Ruin(9) 180 = 415/450 PP (35 unused)<br>
      L16: Range 75 + Radius 220 + Ruin(9) 180 = 475/480 PP (5 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Ruin(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Ruin(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Ruin(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Ruin(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Ruin(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Ruin(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Ruin(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Ruin(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Ruin(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Ruin(6)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Ruin(6)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Ruin(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Ruin(7)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Ruin(7)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Ruin(8)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 6 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 6 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Ruin(9)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-slow">
  Ranged AoE Special: Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Slow (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Slow(1) 4 = 24/30 PP (6 unused)<br>
      L2: Range 5 + Radius 20 + Slow(3) 24 = 49/60 PP (11 unused)<br>
      L3: Range 10 + Radius 50 + Slow(3) 24 = 84/90 PP (6 unused)<br>
      L4: Range 15 + Radius 50 + Slow(4) 40 = 105/120 PP (15 unused)<br>
      L5: Range 20 + Radius 80 + Slow(4) 40 = 140/150 PP (10 unused)<br>
      L6: Range 25 + Radius 80 + Slow(5) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Slow(5) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Slow(6) 84 = 239/240 PP (1 unused)<br>
      L9: Range 40 + Radius 120 + Slow(6) 84 = 244/270 PP (26 unused)<br>
      L10: Range 45 + Radius 165 + Slow(6) 84 = 294/300 PP (6 unused)<br>
      L11: Range 50 + Radius 165 + Slow(7) 112 = 327/330 PP (3 unused)<br>
      L12: Range 55 + Radius 165 + Slow(7) 112 = 332/360 PP (28 unused)<br>
      L13: Range 60 + Radius 165 + Slow(8) 144 = 369/390 PP (21 unused)<br>
      L14: Range 65 + Radius 165 + Slow(9) 180 = 410/420 PP (10 unused)<br>
      L15: Range 70 + Radius 165 + Slow(9) 180 = 415/450 PP (35 unused)<br>
      L16: Range 75 + Radius 220 + Slow(9) 180 = 475/480 PP (5 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Slow(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Slow(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Slow(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Slow(3)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Slow(3)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Slow(4)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Slow(4)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Slow(5)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Slow(5)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Slow(6)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Slow(6)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Slow(6)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Slow(7)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Slow(7)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Slow(8)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 6 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 6 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Slow(9)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-soulburn">
  Ranged AoE Special: Soulburn
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Soulburn (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Soulburn(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 5 + Radius 20 + Soulburn(1) 8 = 33/60 PP (27 unused)<br>
      L3: Range 10 + Radius 50 + Soulburn(1) 8 = 68/90 PP (22 unused)<br>
      L4: Range 15 + Radius 50 + Soulburn(1) 8 = 73/120 PP (47 unused)<br>
      L5: Range 20 + Radius 80 + Soulburn(1) 8 = 108/150 PP (42 unused)<br>
      L6: Range 25 + Radius 80 + Soulburn(1) 8 = 113/180 PP (67 unused)<br>
      L7: Range 30 + Radius 120 + Soulburn(1) 8 = 158/210 PP (52 unused)<br>
      L8: Range 35 + Radius 120 + Soulburn(2) 80 = 235/240 PP (5 unused)<br>
      L9: Range 40 + Radius 120 + Soulburn(2) 80 = 240/270 PP (30 unused)<br>
      L10: Range 45 + Radius 165 + Soulburn(2) 80 = 290/300 PP (10 unused)<br>
      L11: Range 50 + Radius 165 + Soulburn(2) 80 = 295/330 PP (35 unused)<br>
      L12: Range 55 + Radius 220 + Soulburn(2) 80 = 355/360 PP (5 unused)<br>
      L13: Range 60 + Radius 220 + Soulburn(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 65 + Radius 220 + Soulburn(2) 80 = 365/420 PP (55 unused)<br>
      L15: Range 70 + Radius 280 + Soulburn(2) 80 = 430/450 PP (20 unused)<br>
      L16: Range 75 + Radius 280 + Soulburn(2) 80 = 435/480 PP (45 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Soulburn(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Soulburn(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Soulburn(1)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 7 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 7 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 8 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 8 m | Instant | Apply **Soulburn(2)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-sundered">
  Ranged AoE Special: Sundered
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Sundered (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Sundered(1) 6 = 26/30 PP (4 unused)<br>
      L2: Range 5 + Radius 20 + Sundered(2) 18 = 43/60 PP (17 unused)<br>
      L3: Range 10 + Radius 50 + Sundered(2) 18 = 78/90 PP (12 unused)<br>
      L4: Range 15 + Radius 50 + Sundered(3) 36 = 101/120 PP (19 unused)<br>
      L5: Range 20 + Radius 80 + Sundered(3) 36 = 136/150 PP (14 unused)<br>
      L6: Range 25 + Radius 80 + Sundered(4) 60 = 165/180 PP (15 unused)<br>
      L7: Range 30 + Radius 120 + Sundered(4) 60 = 210/210 PP (0 unused)<br>
      L8: Range 35 + Radius 120 + Sundered(4) 60 = 215/240 PP (25 unused)<br>
      L9: Range 40 + Radius 165 + Sundered(4) 60 = 265/270 PP (5 unused)<br>
      L10: Range 45 + Radius 165 + Sundered(5) 90 = 300/300 PP (0 unused)<br>
      L11: Range 50 + Radius 165 + Sundered(5) 90 = 305/330 PP (25 unused)<br>
      L12: Range 55 + Radius 165 + Sundered(6) 126 = 346/360 PP (14 unused)<br>
      L13: Range 60 + Radius 165 + Sundered(6) 126 = 351/390 PP (39 unused)<br>
      L14: Range 65 + Radius 220 + Sundered(6) 126 = 411/420 PP (9 unused)<br>
      L15: Range 70 + Radius 220 + Sundered(6) 126 = 416/450 PP (34 unused)<br>
      L16: Range 75 + Radius 220 + Sundered(7) 168 = 463/480 PP (17 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Sundered(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Sundered(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Sundered(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Sundered(2)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Sundered(2)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Sundered(3)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Sundered(3)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 6 m | Instant | Apply **Sundered(4)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Sundered(5)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 6 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 6 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 7 m | Instant | Apply **Sundered(6)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 7 m | Instant | Apply **Sundered(7)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}

{{wide

<h3 id="ranged-aoe-special-weaken">
  Ranged AoE Special: Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      SINGLE-FOCUS INSTANT SPECIAL<br>
      Active budget 30 PP per Power Level.<br>
      Special cost uses the exact current Core/AGENT formula for Weaken (including compressed pool-reduction prices where applicable).<br>
      Ranged cost 5 PP per +4 m beyond 8 m; Instant AoE Radius 1–8 m costs 0/20/50/80/120/165/220/280 PP respectively.<br>
      Damage 0 PP; no other purchased effect. Each chosen Special is a separate named Power identity.<br>
      PRICE AUDIT<br>
      L1: Range 0 + Radius 20 + Weaken(1) 8 = 28/30 PP (2 unused)<br>
      L2: Range 5 + Radius 20 + Weaken(1) 8 = 33/60 PP (27 unused)<br>
      L3: Range 10 + Radius 50 + Weaken(1) 8 = 68/90 PP (22 unused)<br>
      L4: Range 15 + Radius 50 + Weaken(1) 8 = 73/120 PP (47 unused)<br>
      L5: Range 20 + Radius 80 + Weaken(1) 8 = 108/150 PP (42 unused)<br>
      L6: Range 25 + Radius 80 + Weaken(1) 8 = 113/180 PP (67 unused)<br>
      L7: Range 30 + Radius 120 + Weaken(1) 8 = 158/210 PP (52 unused)<br>
      L8: Range 35 + Radius 120 + Weaken(2) 80 = 235/240 PP (5 unused)<br>
      L9: Range 40 + Radius 120 + Weaken(2) 80 = 240/270 PP (30 unused)<br>
      L10: Range 45 + Radius 165 + Weaken(2) 80 = 290/300 PP (10 unused)<br>
      L11: Range 50 + Radius 165 + Weaken(2) 80 = 295/330 PP (35 unused)<br>
      L12: Range 55 + Radius 220 + Weaken(2) 80 = 355/360 PP (5 unused)<br>
      L13: Range 60 + Radius 220 + Weaken(2) 80 = 360/390 PP (30 unused)<br>
      L14: Range 65 + Radius 220 + Weaken(2) 80 = 365/420 PP (55 unused)<br>
      L15: Range 70 + Radius 280 + Weaken(2) 80 = 430/450 PP (20 unused)<br>
      L16: Range 75 + Radius 280 + Weaken(2) 80 = 435/480 PP (45 unused)
    </span>
  </span>
</h3>

**One Special only:** This is an **Instant Active** that applies only **Weaken(X)** (Diminishing). The Power purchases exactly one numeric Special, and **no damage**.

**Delivery:** Target point within printed Range. Make one Attack Roll for the whole area and compare against each creature’s Evade; individual defenses and Dive for Cover apply.

**Resolution:** On a successful delivery, apply the printed **Weaken(X)** once per eligible target after normal Special Negation and application limits. Subsequent natural decay, Cleanse, Timed countdown, or Root's own recovery follow the existing core rules; the **Power itself** has no ongoing duration. A Martial delivery adds **no weapon damage**; a Ranged Spell version uses the normal Casting rules and likewise adds no Spell damage. AoE powers never divide the printed Special among affected creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** |
|:--:|:--|:--:|:--:|:--:|:--|
| **1** | Active, Special | 8 m | Radius 2 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **2** | Active, Special | 12 m | Radius 2 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **3** | Active, Special | 16 m | Radius 3 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **4** | Active, Special | 20 m | Radius 3 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **5** | Active, Special | 24 m | Radius 4 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **6** | Active, Special | 28 m | Radius 4 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **7** | Active, Special | 32 m | Radius 5 m | Instant | Apply **Weaken(1)** to every creature hit in the area; **no Power damage**. |
| **8** | Active, Special | 36 m | Radius 5 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **9** | Active, Special | 40 m | Radius 5 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **10** | Active, Special | 44 m | Radius 6 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **11** | Active, Special | 48 m | Radius 6 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **12** | Active, Special | 52 m | Radius 7 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **13** | Active, Special | 56 m | Radius 7 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **14** | Active, Special | 60 m | Radius 7 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **15** | Active, Special | 64 m | Radius 8 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |
| **16** | Active, Special | 68 m | Radius 8 m | Instant | Apply **Weaken(2)** to every creature hit in the area; **no Power damage**. |

---
}}

\page
{{pageNumber,auto}}


\page
{{pageNumber,auto}}
{{wide
## Damage Transfer Actives (Vampyr)

Damage Transfer (the fiction-facing *Vampyr* concept) is a **dedicated instant, single-target Active** whose one inseparable mechanic is **damage that restores the attacker's own HP**. It is not a selectable Damage + Healing hybrid or an upgrade to Healing Actives.

**Resolution:** Make the printed Martial Attack Roll, or a Casting Roll for an eligible Ranged Spell delivery. On hit, form the regular Damage Pool (including Weapon Damage only for Martial weapon delivery), then resolve Damage Negation, damage, Penetration, Armor, Damage Reduction, Temporary HP, and Health loss in the ordinary order. The user heals **exactly the real HP the target actually loses from this attack**, capped by missing HP in the user's **current active Health Bar**. No separate Healing Dice are rolled. No Scarred Health Bars reopen and no overhealing or Temporary HP is created. If no real HP is lost, heal **0**.

**Dedicated cost:** **25 PP per +1d8 Power Damage**, versus **15 PP per +1d8** for an ordinary single-target Attack. This is a fixed bundled price for a conditional self-transfer effect, not the ordinary 20-PP Healing Die price and not permission to add independent Healing to Damage. Melee uses no Range cost; Ranged uses the standard Range cost. Unused PP is permitted. One target and one Damage Roll only; this Power is never an AoE.

**Limited and Stone interaction:** Eligible for Limited because it is an Instant **damaging** Active with its own printed Power Damage Dice. Limited doubles only those **printed Power Damage Dice**, not Weapon Damage, Specials or any secondary Healing Dice pool. Vitality: Damage Maximization can maximize the complete legal Damage Roll. Healing always equals **actual HP lost after all mitigation**, never the maximum Damage Pool before mitigation.

**Technical identities:** `Melee Single Target Damage Transfer` and `Ranged Single Target Damage Transfer` are separate learned Power identities. For Ranged Spell delivery, the normal Spell rules apply, including no Weapon Damage. The name *Vampyr* is descriptive only, not a second Power identity.

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-single-target-damage-transfer">
  Melee Single Target Damage Transfer
  <span class="tooltip">🛈
    <span class="tooltiptext">
      FIXED DAMAGE TRANSFER COST<br>
      Budget = 30 PP per Level<br>
      Purchased Damage = 25 PP per +1d8<br>
      Melee Reach; no Range cost.<br>
      On hit: healing = target's real HP actually removed by the same attack after mitigation, limited to attacker's current active Health Bar.<br>
      Includes Weapon Damage in the damage roll only with Martial weapon delivery. Never adds separate Healing Dice or restores Scarred bars.<br>
      LEVEL-BY-LEVEL PP AUDIT<br>
      L1: 1d8 x 25 = 25/30 PP (5 unused)<br>      L2: 2d8 x 25 = 50/60 PP (10 unused)<br>      L3: 3d8 x 25 = 75/90 PP (15 unused)<br>      L4: 4d8 x 25 = 100/120 PP (20 unused)<br>      L5: 6d8 x 25 = 150/150 PP (0 unused)<br>      L6: 7d8 x 25 = 175/180 PP (5 unused)<br>      L7: 8d8 x 25 = 200/210 PP (10 unused)<br>      L8: 9d8 x 25 = 225/240 PP (15 unused)<br>      L9: 10d8 x 25 = 250/270 PP (20 unused)<br>      L10: 12d8 x 25 = 300/300 PP (0 unused)<br>      L11: 13d8 x 25 = 325/330 PP (5 unused)<br>      L12: 14d8 x 25 = 350/360 PP (10 unused)<br>      L13: 15d8 x 25 = 375/390 PP (15 unused)<br>      L14: 16d8 x 25 = 400/420 PP (20 unused)<br>      L15: 18d8 x 25 = 450/450 PP (0 unused)<br>      L16: 19d8 x 25 = 475/480 PP (5 unused)<br>
    </span>
  </span>
</h3>

A melee damage-to-self-healing transfer that siphons only real HP removed from the target.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **1d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **2** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **2d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **3** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **3d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **4** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **4d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **5** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **6d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **6** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **7d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **7** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **8d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **8** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **9d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **9** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **10d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **10** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **12d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **11** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **13d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **12** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **14d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **13** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **15d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **14** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **16d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **15** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **18d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **16** | Active | Melee Reach | — | Instant | Make one melee weapon attack. On hit, deal weapon damage + **19d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-single-target-damage-transfer">
  Ranged Single Target Damage Transfer
  <span class="tooltip">🛈
    <span class="tooltiptext">
      FIXED DAMAGE TRANSFER COST<br>
      Budget = 30 PP per Level<br>
      Purchased Damage = 25 PP per +1d8<br>
      Ranged 8 m = 0 PP; +4 m costs +5 PP.<br>
      On hit: healing = target's real HP actually removed by the same attack after mitigation, limited to attacker's current active Health Bar.<br>
      Includes Weapon Damage in the damage roll only with Martial weapon delivery. Never adds separate Healing Dice or restores Scarred bars.<br>
      LEVEL-BY-LEVEL PP AUDIT<br>
      L1: Range 0 PP + 1d8 x 25 = 25/30 PP (5 unused)<br>      L2: Range 5 PP + 2d8 x 25 = 55/60 PP (5 unused)<br>      L3: Range 10 PP + 3d8 x 25 = 85/90 PP (5 unused)<br>      L4: Range 15 PP + 4d8 x 25 = 115/120 PP (5 unused)<br>      L5: Range 20 PP + 5d8 x 25 = 145/150 PP (5 unused)<br>      L6: Range 25 PP + 6d8 x 25 = 175/180 PP (5 unused)<br>      L7: Range 30 PP + 7d8 x 25 = 205/210 PP (5 unused)<br>      L8: Range 35 PP + 8d8 x 25 = 235/240 PP (5 unused)<br>      L9: Range 40 PP + 9d8 x 25 = 265/270 PP (5 unused)<br>      L10: Range 45 PP + 10d8 x 25 = 295/300 PP (5 unused)<br>      L11: Range 50 PP + 11d8 x 25 = 325/330 PP (5 unused)<br>      L12: Range 55 PP + 12d8 x 25 = 355/360 PP (5 unused)<br>      L13: Range 60 PP + 13d8 x 25 = 385/390 PP (5 unused)<br>      L14: Range 65 PP + 14d8 x 25 = 415/420 PP (5 unused)<br>      L15: Range 70 PP + 15d8 x 25 = 445/450 PP (5 unused)<br>      L16: Range 75 PP + 16d8 x 25 = 475/480 PP (5 unused)<br>
    </span>
  </span>
</h3>

A ranged damage-to-self-healing transfer, usable through Martial or legal Spell delivery.

---
:
**Martial Requirement:** Ranged Weapon or Thrown Weapon  
**Spell Delivery:** Normal Ranged Spell rules apply; Spell Damage does not add Weapon Damage.

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **1d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **2** | Active | 12 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **2d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **3** | Active | 16 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **3d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **4** | Active | 20 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **4d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **5** | Active | 24 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **5d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **6** | Active | 28 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **6d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **7** | Active | 32 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **7d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **8** | Active | 36 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **8d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **9** | Active | 40 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **9d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **10** | Active | 44 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **10d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **11** | Active | 48 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **11d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **12** | Active | 52 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **12d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **13** | Active | 56 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **13d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **14** | Active | 60 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **14d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **15** | Active | 64 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **15d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |
| **16** | Active | 68 m | — | Instant | Make one ranged weapon attack. On hit, deal weapon damage + **16d8 damage**; heal yourself for the actual HP lost by the target after mitigation (current active Health Bar only). | — |

---
}}
