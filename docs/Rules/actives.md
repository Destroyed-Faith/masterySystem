{{wide
---
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
<div class="title-sub">
  Actives
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
Destroyed Faith — DF Core Actives
Version: v0.9.8.1 (2026-08-30)
}}

}}
\page
{{pageNumber,auto}}
{{toc,wide
# Summary

- #### [{{ Artwork Credits}}{{ 2}}](#p2)
- #### [{{ Martial Attacks + Numeric Specials}}{{ 4}}](#p4)
- #### [{{ Root Attack Rule}}{{ 4}}](#p4)
- #### [{{ Attacks + Blight}}{{ 6}}](#p6)
- #### [{{ Attacks + Lacerate / Mark / Ruin / Slow}}{{ 7}}](#p7)
- #### [{{ Attacks + Challenge / Corrode / Hex / Sundered / Root}}{{ 9}}](#p9)
- #### [{{ Attacks + Disoriented / Expose / Soulburn / Weaken}}{{ 12}}](#p12)
- #### [{{ Martial AoE Attack Rules}}{{ 14}}](#p14)
- #### [{{ AoE Attacks + Numeric Specials}}{{ 15}}](#p15)
- #### [{{ Persistent Diminishing Zones}}{{ 23}}](#p23)
- #### [{{ Control Specials}}{{ 29}}](#p29)
- #### [{{ Support Actives}}{{ 36}}](#p36)
- #### [{{ Active Constructs and Terrain}}{{ 50}}](#p50)
- #### [{{ Barrier Actives}}{{ 57}}](#p57)
- #### [{{ Illusion Fields and Power Images}}{{ 58}}](#p58)
- #### [{{ Hard Control}}{{ 62}}](#p62)
- #### [{{ Weapon Attack Powers}}{{ 65}}](#p65)
- #### [{{ Targeted Diminishing Specials}}{{ 80}}](#p80)
- #### [{{ Mental Powers}}{{ 85}}](#p85)

}}
\page
{{pageNumber,auto}}
{{wide
## Martial Attacks + Numeric Specials

Every catalogue entry uses a mechanical technical name. When a technical name lists several Specials separated by slashes, choose one of them when learning the Power. That choice becomes part of the Power's technical name and cannot be changed later.

> **Base Cost 8 Specials:** Disoriented, Expose, Soulburn, and Weaken use the dedicated 8 PP Special-cost progression in this catalogue.

> **Base Cost 2 Targeted Specials:** Exorcism and Requiem use dedicated targeted progressions later in this catalogue.

> **Root:** Root uses **6 × T(X) PP** pricing but follows its own Until Broken rules. Root has a minimum applied value of **Root(2)** and never uses Root(1).

> **Scaling Rule:** These templates are Special-first Martial Actives.  
> The Special is the primary scaling component. Damage is the secondary rider.  
> Damage and Special may stay the same or increase, but they may never decrease.  
> Unused PP may be ignored if spending it would block later Special scaling or require adding a second rider.

> **Triangular Special Formula:**  
> Special Cost = Base Cost × T(X)  
> T(X) = X × (X + 1) / 2

### Root Attack Rule

Root has a **6 PP Base Cost**, but it is not a standard Diminishing Special.

When a Special-first attack is built with Root:

- the applied value can never be lower than **Root(2)**,
- Root uses **6 × T(X) PP** pricing,
- the target's Speed becomes **0 m** and it cannot move voluntarily,
- at the start of the affected creature's Turn, reduce Root by that creature's **Mastery Rank**,
- and the creature may additionally spend an Action, Movement Action, or Reaction on a Vitality Attribute Check against **TN 8 × source MR**; success reduces Root by 1, plus 1 per Raise.

If the budget of a template cannot support Root(2), Root is unavailable at that Level. Root is not inserted into Persistent Zone templates unless a dedicated rule explicitly permits repeated Root application.


### Special-First Attack Scaling

These templates are Special-first Martial Actives.

Levels 1–4 establish the template's baseline damage and Special identity.

From Level 5 onward:
- The Level 4 damage value becomes the template's Damage Anchor.
- The Special is increased whenever the PP budget allows it.
- Damage only increases if doing so does not delay or block the next Special increase.
- Damage and Special may never decrease.
- Unused PP may be ignored.

This prevents filler damage from turning a Special template into a Damage template.

}}
\page
{{pageNumber,auto}}
{{wide
### Example: Melee Attack + Blight

A player selects **Melee Attack + Blight** at Level 4. The Power gives:

- Range: **Melee Reach**
- Damage: **+1d8 damage**
- Special: **Blight(8)**

This means the Power is not primarily a damage attack.

The damage is only a rider.  
The main purpose of the Power is to apply a strong Blight value.

The attack is resolved like a normal melee attack:

1. The attacker rolls their normal melee attack.
2. If the attack hits, the target takes weapon damage plus **+1d8 damage**.
3. The target also gains **Blight(8)**.

If the attack misses, neither the damage nor the Special applies.

}}
\page
{{pageNumber,auto}}
{{wide

---
:
<h3 id="melee-attack-blight">
  Melee Attack + Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Damage is a minor rider in this template<br>
      Special base cost = 3 PP<br>
      Special Cost = 3 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      SPECIAL COSTS<br>
      Blight(1) = 3 PP<br>
      Blight(2) = 9 PP<br>
      Blight(3) = 18 PP<br>
      Blight(4) = 30 PP<br>
      Blight(5) = 45 PP<br>
      Blight(6) = 63 PP<br>
      Blight(7) = 84 PP<br>
      Blight(8) = 108 PP<br>
      Blight(9) = 135 PP<br>
      Blight(10) = 165 PP<br>
      Blight(11) = 198 PP<br>
      Blight(12) = 234 PP<br>
      Blight(13) = 273 PP<br>
      Blight(14) = 315 PP<br>
      Blight(15) = 360 PP<br>
      Blight(16) = 408 PP<br>
      Blight(17) = 459 PP<br><br>
      SCALING RULE<br>
      This is a Blight-first Martial Active.<br>
      Blight is the primary scaling axis.<br>
      Damage remains fixed at +1d8 and is only a low damage rider.<br>
      Blight may stay the same or increase, but it may never decrease.<br>
      Damage is not used to fill all leftover PP.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Damage +1d8 (15) + Blight(3) (18) = 33 PP ≈ 30 target<br>
      L2 → Target 60 PP: Damage +1d8 (15) + Blight(5) (45) = 60 PP<br>
      L3 → Target 90 PP: Damage +1d8 (15) + Blight(6) (63) = 78 PP<br>
      L4 → Target 120 PP: Damage +1d8 (15) + Blight(8) (108) = 123 PP ≈ 120 target<br>
      L5 → Target 150 PP: Damage +1d8 (15) + Blight(9) (135) = 150 PP<br>
      L6 → Target 180 PP: Damage +1d8 (15) + Blight(10) (165) = 180 PP<br>
      L7 → Target 210 PP: Damage +1d8 (15) + Blight(11) (198) = 213 PP ≈ 210 target<br>
      L8 → Target 240 PP: Damage +1d8 (15) + Blight(12) (234) = 249 PP ≈ 240 target<br>
      L9 → Target 270 PP: Damage +1d8 (15) + Blight(12) (234) = 249 PP<br>
      L10 → Target 300 PP: Damage +1d8 (15) + Blight(13) (273) = 288 PP<br>
      L11 → Target 330 PP: Damage +1d8 (15) + Blight(14) (315) = 330 PP<br>
      L12 → Target 360 PP: Damage +1d8 (15) + Blight(14) (315) = 330 PP<br>
      L13 → Target 390 PP: Damage +1d8 (15) + Blight(15) (360) = 375 PP<br>
      L14 → Target 420 PP: Damage +1d8 (15) + Blight(16) (408) = 423 PP ≈ 420 target<br>
      L15 → Target 450 PP: Damage +1d8 (15) + Blight(16) (408) = 423 PP<br>
      L16 → Target 480 PP: Damage +1d8 (15) + Blight(17) (459) = 474 PP<br><br>
      NOTES<br>
      This version intentionally keeps damage low.<br>
      Blight continues scaling beyond Blight(10).<br>
      Leftover PP is ignored when spending it would turn the template into a damage power.
    </span>
  </span>
</h3>

A close-range martial strike that focuses on applying a high Blight value, with damage kept as a minor rider.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(3)** |
| **2** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(5)** |
| **3** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(6)** |
| **4** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(8)** |
| **5** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(9)** |
| **6** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(10)** |
| **7** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(11)** |
| **8** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(12)** |
| **9** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(12)** |
| **10** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(13)** |
| **11** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(14)** |
| **12** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(14)** |
| **13** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(15)** |
| **14** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(16)** |
| **15** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(16)** |
| **16** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Blight(17)** |

---
:
<h3 id="ranged-attack-blight">
  Ranged Attack + Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Damage is a minor rider in this template<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Special base cost = 3 PP<br>
      Special Cost = 3 × T(X)<br>
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
      SPECIAL COSTS<br>
      Blight(1) = 3 PP<br>
      Blight(2) = 9 PP<br>
      Blight(3) = 18 PP<br>
      Blight(4) = 30 PP<br>
      Blight(5) = 45 PP<br>
      Blight(6) = 63 PP<br>
      Blight(7) = 84 PP<br>
      Blight(8) = 108 PP<br>
      Blight(9) = 135 PP<br>
      Blight(10) = 165 PP<br>
      Blight(11) = 198 PP<br>
      Blight(12) = 234 PP<br>
      Blight(13) = 273 PP<br>
      Blight(14) = 315 PP<br>
      Blight(15) = 360 PP<br><br>
      SCALING RULE<br>
      This is a Blight-first Ranged Martial Active.<br>
      Blight is the primary scaling axis.<br>
      Range is paid as a fixed cost each level.<br>
      Damage remains fixed at +1d8 and is only a low damage rider.<br>
      Blight may stay the same or increase, but it may never decrease.<br>
      Damage is not used to fill all leftover PP.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Damage +1d8 (15) + Blight(2) (9) = 24 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Damage +1d8 (15) + Blight(4) (30) = 50 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Damage +1d8 (15) + Blight(6) (63) = 88 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Damage +1d8 (15) + Blight(7) (84) = 114 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Damage +1d8 (15) + Blight(8) (108) = 143 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Damage +1d8 (15) + Blight(9) (135) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Damage +1d8 (15) + Blight(10) (165) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Damage +1d8 (15) + Blight(10) (165) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Damage +1d8 (15) + Blight(11) (198) = 253 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Damage +1d8 (15) + Blight(12) (234) = 294 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Damage +1d8 (15) + Blight(12) (234) = 299 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Damage +1d8 (15) + Blight(13) (273) = 343 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Damage +1d8 (15) + Blight(14) (315) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Damage +1d8 (15) + Blight(14) (315) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Damage +1d8 (15) + Blight(15) (360) = 445 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Damage +1d8 (15) + Blight(15) (360) = 450 PP<br><br>
      NOTES<br>
      This version intentionally keeps damage low.<br>
      Blight continues scaling beyond Blight(10).<br>
      The Ranged version trails behind Melee because it pays Range every level.<br>
      Leftover PP is ignored when spending it would turn the template into a damage power.
    </span>
  </span>
</h3>

A ranged martial attack that focuses on applying a high Blight value, with damage kept as a minor rider.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(2)** |
| **2** | Active | 12 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(4)** |
| **3** | Active | 16 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(6)** |
| **4** | Active | 20 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(7)** |
| **5** | Active | 24 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(8)** |
| **6** | Active | 28 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(9)** |
| **7** | Active | 32 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(10)** |
| **8** | Active | 36 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(10)** |
| **9** | Active | 40 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(11)** |
| **10** | Active | 44 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(12)** |
| **11** | Active | 48 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(12)** |
| **12** | Active | 52 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(13)** |
| **13** | Active | 56 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(14)** |
| **14** | Active | 60 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(14)** |
| **15** | Active | 64 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(15)** |
| **16** | Active | 68 m | — | Instant | Deal **+1d8 damage** on hit. | **Blight(15)** |
}}
\page
{{pageNumber,auto}}
{{wide

---
:
<h3 id="melee-attack-standard-diminishing-special">
  Melee Attack + Lacerate / Mark / Ruin / Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Damage is a minor rider in this template<br>
      Special base cost = 4 PP<br>
      Special Cost = 4 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      SPECIAL COSTS<br>
      Special(1) = 4 PP<br>
      Special(2) = 12 PP<br>
      Special(3) = 24 PP<br>
      Special(4) = 40 PP<br>
      Special(5) = 60 PP<br>
      Special(6) = 84 PP<br>
      Special(7) = 112 PP<br>
      Special(8) = 144 PP<br>
      Special(9) = 180 PP<br>
      Special(10) = 220 PP<br>
      Special(11) = 264 PP<br>
      Special(12) = 312 PP<br>
      Special(13) = 364 PP<br>
      Special(14) = 420 PP<br><br>
      SCALING RULE<br>
      This is a Special-first Martial Active.<br>
      Lacerate, Mark, Ruin, and Slow are the primary scaling axis.<br>
      Damage remains fixed at +1d8 and is only a low damage rider.<br>
      Special may stay the same or increase, but it may never decrease.<br>
      Damage is not used to fill all leftover PP.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Damage +1d8 (15) + Special(2) (12) = 27 PP<br>
      L2 → Target 60 PP: Damage +1d8 (15) + Special(4) (40) = 55 PP<br>
      L3 → Target 90 PP: Damage +1d8 (15) + Special(5) (60) = 75 PP<br>
      L4 → Target 120 PP: Damage +1d8 (15) + Special(6) (84) = 99 PP<br>
      L5 → Target 150 PP: Damage +1d8 (15) + Special(7) (112) = 127 PP<br>
      L6 → Target 180 PP: Damage +1d8 (15) + Special(8) (144) = 159 PP<br>
      L7 → Target 210 PP: Damage +1d8 (15) + Special(9) (180) = 195 PP<br>
      L8 → Target 240 PP: Damage +1d8 (15) + Special(10) (220) = 235 PP<br>
      L9 → Target 270 PP: Damage +1d8 (15) + Special(10) (220) = 235 PP<br>
      L10 → Target 300 PP: Damage +1d8 (15) + Special(11) (264) = 279 PP<br>
      L11 → Target 330 PP: Damage +1d8 (15) + Special(12) (312) = 327 PP<br>
      L12 → Target 360 PP: Damage +1d8 (15) + Special(12) (312) = 327 PP<br>
      L13 → Target 390 PP: Damage +1d8 (15) + Special(13) (364) = 379 PP<br>
      L14 → Target 420 PP: Damage +1d8 (15) + Special(13) (364) = 379 PP<br>
      L15 → Target 450 PP: Damage +1d8 (15) + Special(14) (420) = 435 PP<br>
      L16 → Target 480 PP: Damage +1d8 (15) + Special(14) (420) = 435 PP<br><br>
      NOTES<br>
      This version intentionally keeps damage low.<br>
      The Special continues scaling beyond the old Special(9) stopping point.<br>
      Leftover PP is ignored when spending it would turn the template into a damage power.
    </span>
  </span>
</h3>

A close-range martial strike that focuses on applying a high standard Diminishing Special, with damage kept as a minor rider.  
This template covers Lacerate, Mark, Ruin, and Slow.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(2) / Slow(2) / Ruin(2) / Mark(2)** |
| **2** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **3** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)** |
| **4** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **5** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **6** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **7** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(9) / Slow(9) / Ruin(9) / Mark(9)** |
| **8** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(10) / Slow(10) / Ruin(10) / Mark(10)** |
| **9** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(10) / Slow(10) / Ruin(10) / Mark(10)** |
| **10** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(11) / Slow(11) / Ruin(11) / Mark(11)** |
| **11** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(12) / Slow(12) / Ruin(12) / Mark(12)** |
| **12** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(12) / Slow(12) / Ruin(12) / Mark(12)** |
| **13** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(13) / Slow(13) / Ruin(13) / Mark(13)** |
| **14** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(13) / Slow(13) / Ruin(13) / Mark(13)** |
| **15** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(14) / Slow(14) / Ruin(14) / Mark(14)** |
| **16** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(14) / Slow(14) / Ruin(14) / Mark(14)** |

---
:
<h3 id="ranged-attack-standard-diminishing-special">
  Ranged Attack + Lacerate / Mark / Ruin / Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Damage is a minor rider in this template<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Special base cost = 4 PP<br>
      Special Cost = 4 × T(X)<br>
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
      SPECIAL COSTS<br>
      Special(1) = 4 PP<br>
      Special(2) = 12 PP<br>
      Special(3) = 24 PP<br>
      Special(4) = 40 PP<br>
      Special(5) = 60 PP<br>
      Special(6) = 84 PP<br>
      Special(7) = 112 PP<br>
      Special(8) = 144 PP<br>
      Special(9) = 180 PP<br>
      Special(10) = 220 PP<br>
      Special(11) = 264 PP<br>
      Special(12) = 312 PP<br>
      Special(13) = 364 PP<br><br>
      SCALING RULE<br>
      This is a Special-first Ranged Martial Active.<br>
      Lacerate, Mark, Ruin, and Slow are the primary scaling axis.<br>
      Range is paid as a fixed cost each level.<br>
      Damage remains fixed at +1d8 and is only a low damage rider.<br>
      Special may stay the same or increase, but it may never decrease.<br>
      Damage is not used to fill all leftover PP.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Damage +1d8 (15) + Special(2) (12) = 27 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Damage +1d8 (15) + Special(4) (40) = 60 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Damage +1d8 (15) + Special(5) (60) = 85 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Damage +1d8 (15) + Special(6) (84) = 114 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Damage +1d8 (15) + Special(7) (112) = 147 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Damage +1d8 (15) + Special(7) (112) = 152 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Damage +1d8 (15) + Special(8) (144) = 189 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Damage +1d8 (15) + Special(9) (180) = 230 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Damage +1d8 (15) + Special(9) (180) = 235 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Damage +1d8 (15) + Special(10) (220) = 280 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Damage +1d8 (15) + Special(11) (264) = 329 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Damage +1d8 (15) + Special(11) (264) = 334 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Damage +1d8 (15) + Special(12) (312) = 387 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Damage +1d8 (15) + Special(12) (312) = 392 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Damage +1d8 (15) + Special(13) (364) = 449 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Damage +1d8 (15) + Special(13) (364) = 454 PP<br><br>
      NOTES<br>
      This version intentionally keeps damage low.<br>
      The Special continues scaling beyond the old Special(9) stopping point.<br>
      The Ranged version trails behind Melee because it pays Range every level.<br>
      Leftover PP is ignored when spending it would turn the template into a damage power.
    </span>
  </span>
</h3>

A ranged martial attack that focuses on applying a high standard Diminishing Special, with damage kept as a minor rider.  
This template covers Lacerate, Mark, Ruin, and Slow.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(2) / Slow(2) / Ruin(2) / Mark(2)** |
| **2** | Active | 12 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **3** | Active | 16 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)** |
| **4** | Active | 20 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **5** | Active | 24 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **6** | Active | 28 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **7** | Active | 32 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **8** | Active | 36 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(9) / Slow(9) / Ruin(9) / Mark(9)** |
| **9** | Active | 40 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(9) / Slow(9) / Ruin(9) / Mark(9)** |
| **10** | Active | 44 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(10) / Slow(10) / Ruin(10) / Mark(10)** |
| **11** | Active | 48 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(11) / Slow(11) / Ruin(11) / Mark(11)** |
| **12** | Active | 52 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(11) / Slow(11) / Ruin(11) / Mark(11)** |
| **13** | Active | 56 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(12) / Slow(12) / Ruin(12) / Mark(12)** |
| **14** | Active | 60 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(12) / Slow(12) / Ruin(12) / Mark(12)** |
| **15** | Active | 64 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(13) / Slow(13) / Ruin(13) / Mark(13)** |
| **16** | Active | 68 m | — | Instant | Deal **+1d8 damage** on hit. | **Lacerate(13) / Slow(13) / Ruin(13) / Mark(13)** |

}}
\page
{{pageNumber,auto}}
{{wide

---
:
### Example: Ranged Attack + Mark

A player selects **Ranged Attack + Mark** at Level 6. The Power gives:

- Range: **28 m**
- Damage: **+1d8 damage**
- Special: **Mark(7)**

The Power represents a precise ranged attack that identifies and exposes the target.

On a hit:

- the target takes weapon damage plus **+1d8 damage**,
- the target gains **Mark(7)**.

The Power does not gain extra damage just because there is unused PP.  
The template remains Mark-first.


}}
\page
{{pageNumber,auto}}
{{wide

---
:
<h3 id="melee-attack-heavy-diminishing-special">
  Melee Attack + Challenge / Corrode / Hex / Sundered / Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Special base cost = 6 PP<br>
      Special Cost = 6 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      SPECIAL COSTS<br>
      X1 = 6 PP • X2 = 18 PP • X3 = 36 PP • X4 = 60 PP • X5 = 90 PP • X6 = 126 PP • X7 = 168 PP • X8 = 216 PP • X9 = 270 PP • X10 = 330 PP • X11 = 396 PP • X12 = 468 PP<br><br>
      SCALING RULE<br>
      Special-first scaling with Damage Anchor.<br>
      Level 4 establishes the Damage Anchor: +2d8 Damage = 30 PP.<br>
      From Level 5 onward, the template spends into the Special first.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Damage +1d8 (15) + Special(2) (18) = 33 PP<br>
      L2 → Target 60 PP: Damage +2d8 (30) + Special(3) (36) = 66 PP<br>
      L3 → Target 90 PP: Damage +2d8 (30) + Special(4) (60) = 90 PP<br>
      L4 → Target 120 PP: Damage +2d8 (30) + Special(5) (90) = 120 PP<br>
      L5 → Target 150 PP: Damage +2d8 (30) + Special(5) (90) = 120 PP<br>
      L6 → Target 180 PP: Damage +2d8 (30) + Special(6) (126) = 156 PP<br>
      L7 → Target 210 PP: Damage +2d8 (30) + Special(7) (168) = 198 PP<br>
      L8 → Target 240 PP: Damage +2d8 (30) + Special(7) (168) = 198 PP<br>
      L9 → Target 270 PP: Damage +2d8 (30) + Special(8) (216) = 246 PP<br>
      L10 → Target 300 PP: Damage +2d8 (30) + Special(9) (270) = 300 PP<br>
      L11 → Target 330 PP: Damage +2d8 (30) + Special(9) (270) = 300 PP<br>
      L12 → Target 360 PP: Damage +2d8 (30) + Special(10) (330) = 360 PP<br>
      L13 → Target 390 PP: Damage +2d8 (30) + Special(10) (330) = 360 PP<br>
      L14 → Target 420 PP: Damage +2d8 (30) + Special(10) (330) = 360 PP<br>
      L15 → Target 450 PP: Damage +2d8 (30) + Special(11) (396) = 426 PP<br>
      L16 → Target 480 PP: Damage +2d8 (30) + Special(11) (396) = 426 PP<br><br>
      NOTES — Melee Martial Active. Covers Challenge, Corrode, Hex, Sundered, and Root. Root uses the same 6 PP Base Cost but follows its dedicated minimum, decay, and breaking rules. This group is heavy and should remain clearly Special-first.
    </span>
  </span>
</h3>

A close-range martial attack that deals damage and applies Challenge, Corrode, Hex, Sundered, or Root.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2) / Root(2)** |
| **2** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **3** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **4** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **5** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **6** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **7** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **8** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **9** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(8) / Corrode(8) / Hex(8) / Sundered(8) / Root(8)** |
| **10** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(9) / Corrode(9) / Hex(9) / Sundered(9) / Root(9)** |
| **11** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(9) / Corrode(9) / Hex(9) / Sundered(9) / Root(9)** |
| **12** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(10) / Corrode(10) / Hex(10) / Sundered(10) / Root(10)** |
| **13** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(10) / Corrode(10) / Hex(10) / Sundered(10) / Root(10)** |
| **14** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(10) / Corrode(10) / Hex(10) / Sundered(10) / Root(10)** |
| **15** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(11) / Corrode(11) / Hex(11) / Sundered(11) / Root(11)** |
| **16** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(11) / Corrode(11) / Hex(11) / Sundered(11) / Root(11)** |

---
:
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-attack-heavy-diminishing-special">
  Ranged Attack + Challenge / Corrode / Hex / Sundered / Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Special base cost = 6 PP<br>
      Special Cost = 6 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      SPECIAL COSTS<br>
      X1 = 6 PP • X2 = 18 PP • X3 = 36 PP • X4 = 60 PP • X5 = 90 PP • X6 = 126 PP • X7 = 168 PP • X8 = 216 PP • X9 = 270 PP • X10 = 330 PP • X11 = 396 PP<br><br>
      SCALING RULE<br>
      Special-first scaling with Damage Anchor.<br>
      Level 4 establishes the Damage Anchor: +2d8 Damage = 30 PP.<br>
      Ranged also pays Range cost each level.<br>
      From Level 5 onward, the template spends into the Special first.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Damage +1d8 (15) + Special(1) (6) = 21 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Damage +2d8 (30) + Special(2) (18) = 53 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Damage +2d8 (30) + Special(3) (36) = 76 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Damage +2d8 (30) + Special(4) (60) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Damage +2d8 (30) + Special(5) (90) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Damage +2d8 (30) + Special(5) (90) = 145 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Damage +2d8 (30) + Special(6) (126) = 186 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Damage +2d8 (30) + Special(7) (168) = 233 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Damage +2d8 (30) + Special(7) (168) = 238 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Damage +2d8 (30) + Special(8) (216) = 291 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Damage +2d8 (30) + Special(8) (216) = 296 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Damage +2d8 (30) + Special(9) (270) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Damage +2d8 (30) + Special(9) (270) = 360 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Damage +2d8 (30) + Special(9) (270) = 365 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Damage +2d8 (30) + Special(10) (330) = 430 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Damage +2d8 (30) + Special(10) (330) = 435 PP<br><br>
      NOTES — Ranged Martial Active. Covers Challenge, Corrode, Hex, Sundered, and Root. Root uses a minimum of Root(2), including at Level 1. Range cost slows Special growth compared to the Melee version.
    </span>
  </span>
</h3>

A ranged martial attack that deals damage and applies Challenge, Corrode, Hex, Sundered, or Root.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Deal **+1d8 damage** on hit. | **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1) / Root(2)** |
| **2** | Active | 12 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2) / Root(2)** |
| **3** | Active | 16 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **4** | Active | 20 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **5** | Active | 24 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **6** | Active | 28 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **7** | Active | 32 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **8** | Active | 36 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **9** | Active | 40 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **10** | Active | 44 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(8) / Corrode(8) / Hex(8) / Sundered(8) / Root(8)** |
| **11** | Active | 48 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(8) / Corrode(8) / Hex(8) / Sundered(8) / Root(8)** |
| **12** | Active | 52 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(9) / Corrode(9) / Hex(9) / Sundered(9) / Root(9)** |
| **13** | Active | 56 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(9) / Corrode(9) / Hex(9) / Sundered(9) / Root(9)** |
| **14** | Active | 60 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(9) / Corrode(9) / Hex(9) / Sundered(9) / Root(9)** |
| **15** | Active | 64 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(10) / Corrode(10) / Hex(10) / Sundered(10) / Root(10)** |
| **16** | Active | 68 m | — | Instant | Deal **+2d8 damage** on hit. | **Challenge(10) / Corrode(10) / Hex(10) / Sundered(10) / Root(10)** |

}}
\page
{{pageNumber,auto}}
{{wide

---
:
### Example: Melee Attack + Hex

A player selects **Melee Attack + Hex** at Level 10. The Power gives:

- Range: **Melee Reach**
- Damage: **+2d8 damage**
- Special: **Hex(9)**

This is a heavy Special-first attack.

On a hit:

- the target takes weapon damage plus **+2d8 damage**,
- the target gains **Hex(9)**.

Because Hex has a 6 PP Base Cost, it is more expensive than Blight or Mark.  
The Power therefore has less damage and slower Special scaling than cheaper Special templates.

}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-attack-pool-reduction-special">
  Melee Attack + Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Melee Reach = 0 PP<br>
      Special base cost = 8 PP<br>
      Special Cost = 8 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      VALID SPECIALS<br>
      Disoriented(X), Expose(X), Soulburn(X), Weaken(X).<br><br>
      SCALING RULE<br>
      This is a high-impact Special-first Martial Active.<br>
      The Special is the primary axis. Damage is held low so the next Special increase is not delayed.<br>
      Damage and Special may stay the same or increase, but they may never decrease.<br>
      Unused PP may remain unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Damage +1d8 (15) + Special(1) (8) = 23 PP<br>
      L2 → Target 60 PP: Damage +1d8 (15) + Special(3) (48) = 63 PP<br>
      L3 → Target 90 PP: Damage +1d8 (15) + Special(4) (80) = 95 PP<br>
      L4 → Target 120 PP: Damage +2d8 (30) + Special(4) (80) = 110 PP<br>
      L5 → Target 150 PP: Damage +2d8 (30) + Special(5) (120) = 150 PP<br>
      L6 → Target 180 PP: Damage +2d8 (30) + Special(5) (120) = 150 PP<br>
      L7 → Target 210 PP: Damage +2d8 (30) + Special(6) (168) = 198 PP<br>
      L8 → Target 240 PP: Damage +2d8 (30) + Special(6) (168) = 198 PP<br>
      L9 → Target 270 PP: Damage +2d8 (30) + Special(7) (224) = 254 PP<br>
      L10 → Target 300 PP: Damage +2d8 (30) + Special(7) (224) = 254 PP<br>
      L11 → Target 330 PP: Damage +2d8 (30) + Special(8) (288) = 318 PP<br>
      L12 → Target 360 PP: Damage +2d8 (30) + Special(8) (288) = 318 PP<br>
      L13 → Target 390 PP: Damage +2d8 (30) + Special(9) (360) = 390 PP<br>
      L14 → Target 420 PP: Damage +2d8 (30) + Special(9) (360) = 390 PP<br>
      L15 → Target 450 PP: Damage +2d8 (30) + Special(9) (360) = 390 PP<br>
      L16 → Target 480 PP: Damage +2d8 (30) + Special(10) (440) = 470 PP<br><br>
      NOTES<br>
      Weaken and Soulburn reduce dice pools, not Attributes or Keep.<br>
      Disoriented and Expose use the same 8 PP Base Cost curve.<br>
      All flat pool reductions apply before percentage-based Health penalties, and the final Pool cannot fall below Mastery Rank.
    </span>
  </span>
</h3>

A close-range martial attack that applies Disoriented, Expose, Soulburn, or Weaken.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)** |
| **2** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **3** | Active | Melee Reach | — | Instant | Deal **+1d8 damage** on hit. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **4** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **5** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **6** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **7** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **8** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **9** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **10** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **11** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |
| **12** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |
| **13** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(9) / Expose(9) / Soulburn(9) / Weaken(9)** |
| **14** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(9) / Expose(9) / Soulburn(9) / Weaken(9)** |
| **15** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(9) / Expose(9) / Soulburn(9) / Weaken(9)** |
| **16** | Active | Melee Reach | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(10) / Expose(10) / Soulburn(10) / Weaken(10)** |

---
}}

\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-attack-pool-reduction-special">
  Ranged Attack + Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      +1d8 Damage = 15 PP<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Special base cost = 8 PP<br>
      Special Cost = 8 × T(X)<br>
      T(X) = X × (X + 1) / 2<br><br>
      VALID SPECIALS<br>
      Disoriented(X), Expose(X), Soulburn(X), Weaken(X).<br><br>
      SCALING RULE<br>
      This is a high-impact Special-first Martial Active.<br>
      The Special is the primary axis. Damage is held low so the next Special increase is not delayed.<br>
      Damage and Special may stay the same or increase, but they may never decrease.<br>
      Unused PP may remain unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Damage +1d8 (15) + Special(1) (8) = 23 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Damage +2d8 (30) + Special(2) (24) = 59 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Damage +2d8 (30) + Special(3) (48) = 88 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Damage +2d8 (30) + Special(3) (48) = 93 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Damage +2d8 (30) + Special(4) (80) = 130 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Damage +2d8 (30) + Special(5) (120) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Damage +2d8 (30) + Special(5) (120) = 180 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Damage +2d8 (30) + Special(6) (168) = 233 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Damage +2d8 (30) + Special(6) (168) = 238 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Damage +2d8 (30) + Special(7) (224) = 299 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Damage +2d8 (30) + Special(7) (224) = 304 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Damage +2d8 (30) + Special(7) (224) = 309 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Damage +2d8 (30) + Special(8) (288) = 378 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Damage +2d8 (30) + Special(8) (288) = 383 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Damage +2d8 (30) + Special(8) (288) = 388 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Damage +2d8 (30) + Special(9) (360) = 465 PP<br><br>
      NOTES<br>
      Weaken and Soulburn reduce dice pools, not Attributes or Keep.<br>
      Disoriented and Expose use the same 8 PP Base Cost curve.<br>
      All flat pool reductions apply before percentage-based Health penalties, and the final Pool cannot fall below Mastery Rank.
    </span>
  </span>
</h3>

A ranged martial attack that applies Disoriented, Expose, Soulburn, or Weaken.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Deal **+1d8 damage** on hit. | **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)** |
| **2** | Active | 12 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)** |
| **3** | Active | 16 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **4** | Active | 20 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **5** | Active | 24 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **6** | Active | 28 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **7** | Active | 32 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **8** | Active | 36 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **9** | Active | 40 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **10** | Active | 44 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **11** | Active | 48 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **12** | Active | 52 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **13** | Active | 56 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |
| **14** | Active | 60 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |
| **15** | Active | 64 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |
| **16** | Active | 68 m | — | Instant | Deal **+2d8 damage** on hit. | **Disoriented(9) / Expose(9) / Soulburn(9) / Weaken(9)** |

---
}}

\page
{{pageNumber,auto}}
{{wide
### Martial AoE Attack Rules

A Martial AoE Active is one attack roll applied across an area.

When using a Martial AoE Active:

1. Choose the legal AoE placement.
2. Build and roll one Attack Pool for the Power.
3. Compare the same final Attack result separately against the current **Evade** of every valid creature inside the area.
4. A creature is hit if the result reaches its Evade. A miss against one creature does not affect any other creature.
5. Each creature may use legal Attack-Trigger defenses that modify its own Evade before its hit result is finalized.
6. A creature that would still be hit may use **Dive for Cover** before damage or payload is applied.
7. Every creature that remains hit receives the Power's full printed payload.

Each creature inside the area is resolved independently.

---
:
### Melee AoE Center

A Melee AoE is centered on the attacker. The attacker is not affected by their own Melee AoE unless the Power explicitly says otherwise.

---
:
### Ranged AoE Center

A Ranged AoE is centered on a chosen target point within the Power's printed Range. The center point only determines placement and does not determine whether any creature is hit.

---
:
### Full Payload Rule

Every creature successfully hit by an AoE receives the complete payload printed on the Power:

- full weapon damage, if the Power uses a weapon or unarmed attack,
- full listed Power damage,
- full listed Special values,
- and every legal offensive buff or rider that applies to that attack.

Damage, Specials, and Active Buff: Damage are never divided, halved, or reduced merely because the attack is an AoE.

---
:
### Instant Attack AoE Pricing

This pricing applies only to **instant Attack AoEs**. Support AoEs, Persistent Zones, Auras, Images, Barriers, and other dedicated area systems keep their own written pricing.

| **Radius** | **Cost** |
|:--:|--:|
| **1 m** | **0 PP** |
| **2 m** | **20 PP** |
| **3 m** | **50 PP** |
| **4 m** | **80 PP** |
| **5 m** | **120 PP** |
| **6 m** | **165 PP** |
| **7 m** | **220 PP** |
| **8 m** | **280 PP** |

**8 m Radius** is the normal maximum for standard player Attack Powers.

}}

\page
{{pageNumber,auto}}
{{wide
### AoE Special Rule

An AoE Special uses the same printed value and the same normal PP cost as the matching single-target Special.

There is no AoE Special halving rule and no extra Diminishing pricing step.

> **AoE Special Cost = normal Special Cost**

The Radius cost is the coverage tax.

---
:
### AoE Targeting Summary

To resolve a Martial AoE Active:

1. Place the AoE.
2. Roll once.
3. Compare the same result separately against every valid creature's Evade.
4. Resolve Evade-changing Reactions separately for each creature.
5. Each creature that would still be hit may use Dive for Cover.
6. Apply the full printed payload to every creature that remains hit.

---
:
### Example: Melee AoE Attack

A character uses a Melee AoE with **Radius 3 m** and **weapon damage + 4d8 damage**.

The attacker rolls once and gets **27**. Three enemies are in the radius with Evade **18**, **25**, and **30**.

- Evade 18: hit.
- Evade 25: hit.
- Evade 30: miss.

The two creatures that would be hit may use Dive for Cover before damage is applied. Every creature that remains hit takes the full **weapon damage + 4d8 damage**.

---
:
### Example: Ranged AoE Attack + Blight

A character places a Ranged AoE with **Blight(6)**. The same Attack Roll is compared separately against every creature inside the radius. Every creature that is hit and remains inside after any Dive for Cover gains the full **Blight(6)**. A creature that is missed does not gain Blight, but its miss does not protect any other creature.

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-aoe-attack-blight">
  Melee AoE Attack + Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee AoE Range = Self; no Range cost<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 3 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Blight.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20) + Special(2) (9) = 29 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Special(4) (30) = 50 PP<br>
      L3 → Target 90 PP: Radius 3 m (50) + Special(4) (30) = 80 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Special(6) (63) = 113 PP<br>
      L5 → Target 150 PP: Radius 4 m (80) + Special(6) (63) = 143 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Special(7) (84) = 164 PP<br>
      L7 → Target 210 PP: Radius 5 m (120) + Special(7) (84) = 204 PP<br>
      L8 → Target 240 PP: Radius 5 m (120) + Special(8) (108) = 228 PP<br>
      L9 → Target 270 PP: Radius 5 m (120) + Special(9) (135) = 255 PP<br>
      L10 → Target 300 PP: Radius 6 m (165) + Special(9) (135) = 300 PP<br>
      L11 → Target 330 PP: Radius 6 m (165) + Special(10) (165) = 330 PP<br>
      L12 → Target 360 PP: Radius 6 m (165) + Special(10) (165) = 330 PP<br>
      L13 → Target 390 PP: Radius 7 m (220) + Special(10) (165) = 385 PP<br>
      L14 → Target 420 PP: Radius 7 m (220) + Special(11) (198) = 418 PP<br>
      L15 → Target 450 PP: Radius 7 m (220) + Special(11) (198) = 418 PP<br>
      L16 → Target 480 PP: Radius 7 m (220) + Special(12) (234) = 454 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A self-centered martial AoE that spreads a virulent Blight through a weapon-driven area attack.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(2)** |
| **2** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(4)** |
| **3** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(4)** |
| **4** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(6)** |
| **5** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(6)** |
| **6** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(7)** |
| **7** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(7)** |
| **8** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(8)** |
| **9** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(9)** |
| **10** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(9)** |
| **11** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(10)** |
| **12** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(10)** |
| **13** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(10)** |
| **14** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(11)** |
| **15** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(11)** |
| **16** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(12)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack-blight">
  Ranged AoE Attack + Blight
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged AoE Range = 8 m +4 m per level; Range costs +5 PP per +4 m after 8 m<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 3 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Blight.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 2 m (20) + Special(2) (9) = 29 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Special(4) (30) = 55 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 2 m (20) + Special(5) (45) = 75 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Special(5) (45) = 110 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 3 m (50) + Special(6) (63) = 133 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Special(6) (63) = 168 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 4 m (80) + Special(7) (84) = 194 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 4 m (80) + Special(8) (108) = 223 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 5 m (120) + Special(8) (108) = 268 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 5 m (120) + Special(9) (135) = 300 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 5 m (120) + Special(9) (135) = 305 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 6 m (165) + Special(9) (135) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 6 m (165) + Special(10) (165) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 6 m (165) + Special(10) (165) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 6 m (165) + Special(11) (198) = 433 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 6 m (165) + Special(12) (234) = 474 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A ranged martial AoE that spreads a virulent Blight through a weapon-driven area attack.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(2)** |
| **2** | Active | 12 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(4)** |
| **3** | Active | 16 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(5)** |
| **4** | Active | 20 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(5)** |
| **5** | Active | 24 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(6)** |
| **6** | Active | 28 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(6)** |
| **7** | Active | 32 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(7)** |
| **8** | Active | 36 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(8)** |
| **9** | Active | 40 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(8)** |
| **10** | Active | 44 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(9)** |
| **11** | Active | 48 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(9)** |
| **12** | Active | 52 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(9)** |
| **13** | Active | 56 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(10)** |
| **14** | Active | 60 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(10)** |
| **15** | Active | 64 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(11)** |
| **16** | Active | 68 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Blight(12)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-aoe-attack-standard-diminishing-special">
  Melee AoE Attack + Lacerate / Mark / Ruin / Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee AoE Range = Self; no Range cost<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 4 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Lacerate / Slow / Ruin / Mark.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20) + Special(1) (4) = 24 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Special(4) (40) = 60 PP<br>
      L3 → Target 90 PP: Radius 3 m (50) + Special(4) (40) = 90 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Special(5) (60) = 110 PP<br>
      L5 → Target 150 PP: Radius 4 m (80) + Special(5) (60) = 140 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Special(6) (84) = 164 PP<br>
      L7 → Target 210 PP: Radius 5 m (120) + Special(6) (84) = 204 PP<br>
      L8 → Target 240 PP: Radius 5 m (120) + Special(7) (112) = 232 PP<br>
      L9 → Target 270 PP: Radius 5 m (120) + Special(7) (112) = 232 PP<br>
      L10 → Target 300 PP: Radius 6 m (165) + Special(7) (112) = 277 PP<br>
      L11 → Target 330 PP: Radius 6 m (165) + Special(8) (144) = 309 PP<br>
      L12 → Target 360 PP: Radius 6 m (165) + Special(8) (144) = 309 PP<br>
      L13 → Target 390 PP: Radius 7 m (220) + Special(8) (144) = 364 PP<br>
      L14 → Target 420 PP: Radius 7 m (220) + Special(9) (180) = 400 PP<br>
      L15 → Target 450 PP: Radius 7 m (220) + Special(10) (220) = 440 PP<br>
      L16 → Target 480 PP: Radius 7 m (220) + Special(10) (220) = 440 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A self-centered martial AoE that carries a standard numeric Special through a weapon-driven area attack.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(1) / Slow(1) / Ruin(1) / Mark(1)** |
| **2** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **3** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **4** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)** |
| **5** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)** |
| **6** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **7** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **8** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **9** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **10** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **11** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **12** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **13** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **14** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(9) / Slow(9) / Ruin(9) / Mark(9)** |
| **15** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(10) / Slow(10) / Ruin(10) / Mark(10)** |
| **16** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(10) / Slow(10) / Ruin(10) / Mark(10)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack-standard-diminishing-special">
  Ranged AoE Attack + Lacerate / Mark / Ruin / Slow
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged AoE Range = 8 m +4 m per level; Range costs +5 PP per +4 m after 8 m<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 4 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Lacerate / Slow / Ruin / Mark.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 2 m (20) + Special(1) (4) = 24 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Special(3) (24) = 49 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 3 m (50) + Special(3) (24) = 84 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Special(4) (40) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 4 m (80) + Special(4) (40) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Special(5) (60) = 165 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 4 m (80) + Special(6) (84) = 194 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 5 m (120) + Special(6) (84) = 239 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 5 m (120) + Special(6) (84) = 244 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 5 m (120) + Special(7) (112) = 277 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 6 m (165) + Special(7) (112) = 327 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 6 m (165) + Special(7) (112) = 332 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 6 m (165) + Special(8) (144) = 369 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 6 m (165) + Special(8) (144) = 374 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 7 m (220) + Special(8) (144) = 434 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 7 m (220) + Special(9) (180) = 475 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A ranged martial AoE that carries a standard numeric Special through a weapon-driven area attack.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(1) / Slow(1) / Ruin(1) / Mark(1)** |
| **2** | Active | 12 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)** |
| **3** | Active | 16 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(3) / Slow(3) / Ruin(3) / Mark(3)** |
| **4** | Active | 20 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **5** | Active | 24 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(4) / Slow(4) / Ruin(4) / Mark(4)** |
| **6** | Active | 28 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(5) / Slow(5) / Ruin(5) / Mark(5)** |
| **7** | Active | 32 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **8** | Active | 36 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **9** | Active | 40 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(6) / Slow(6) / Ruin(6) / Mark(6)** |
| **10** | Active | 44 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **11** | Active | 48 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **12** | Active | 52 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(7) / Slow(7) / Ruin(7) / Mark(7)** |
| **13** | Active | 56 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **14** | Active | 60 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **15** | Active | 64 m | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(8) / Slow(8) / Ruin(8) / Mark(8)** |
| **16** | Active | 68 m | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Lacerate(9) / Slow(9) / Ruin(9) / Mark(9)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-aoe-attack-heavy-diminishing-special">
  Melee AoE Attack + Challenge / Corrode / Hex / Sundered / Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee AoE Range = Self; no Range cost<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 6 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Challenge / Corrode / Hex / Sundered / Root.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20) + Special(1) (6) = 26 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Special(3) (36) = 56 PP<br>
      L3 → Target 90 PP: Radius 3 m (50) + Special(3) (36) = 86 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Special(4) (60) = 110 PP<br>
      L5 → Target 150 PP: Radius 4 m (80) + Special(4) (60) = 140 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Special(5) (90) = 170 PP<br>
      L7 → Target 210 PP: Radius 5 m (120) + Special(5) (90) = 210 PP<br>
      L8 → Target 240 PP: Radius 5 m (120) + Special(5) (90) = 210 PP<br>
      L9 → Target 270 PP: Radius 5 m (120) + Special(6) (126) = 246 PP<br>
      L10 → Target 300 PP: Radius 6 m (165) + Special(6) (126) = 291 PP<br>
      L11 → Target 330 PP: Radius 6 m (165) + Special(6) (126) = 291 PP<br>
      L12 → Target 360 PP: Radius 6 m (165) + Special(7) (168) = 333 PP<br>
      L13 → Target 390 PP: Radius 6 m (165) + Special(7) (168) = 333 PP<br>
      L14 → Target 420 PP: Radius 7 m (220) + Special(7) (168) = 388 PP<br>
      L15 → Target 450 PP: Radius 7 m (220) + Special(8) (216) = 436 PP<br>
      L16 → Target 480 PP: Radius 7 m (220) + Special(8) (216) = 436 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Root still requires a minimum applied value of Root(2); where the table prints Special(1), Root is unavailable.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A self-centered martial AoE that delivers a heavy numeric Special through a weapon-driven area attack.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. **Root is unavailable at this Level.** |
| **2** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **3** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **4** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **5** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **6** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **7** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **8** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **9** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **10** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **11** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **12** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **13** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **14** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **15** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(8) / Corrode(8) / Hex(8) / Sundered(8) / Root(8)** |
| **16** | Active | Self | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(8) / Corrode(8) / Hex(8) / Sundered(8) / Root(8)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack-heavy-diminishing-special">
  Ranged AoE Attack + Challenge / Corrode / Hex / Sundered / Root
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged AoE Range = 8 m +4 m per level; Range costs +5 PP per +4 m after 8 m<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 6 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Challenge / Corrode / Hex / Sundered / Root.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 2 m (20) + Special(1) (6) = 26 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Special(2) (18) = 43 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 3 m (50) + Special(2) (18) = 78 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Special(3) (36) = 101 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 4 m (80) + Special(3) (36) = 136 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Special(4) (60) = 165 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 4 m (80) + Special(4) (60) = 170 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 5 m (120) + Special(4) (60) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 5 m (120) + Special(5) (90) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 5 m (120) + Special(6) (126) = 291 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 5 m (120) + Special(6) (126) = 296 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 6 m (165) + Special(6) (126) = 346 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 6 m (165) + Special(6) (126) = 351 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 6 m (165) + Special(7) (168) = 398 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 6 m (165) + Special(7) (168) = 403 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 7 m (220) + Special(7) (168) = 463 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Root still requires a minimum applied value of Root(2); where the table prints Special(1), Root is unavailable.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A ranged martial AoE that delivers a heavy numeric Special through a weapon-driven area attack.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. **Root is unavailable at this Level.** |
| **2** | Active | 12 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2) / Root(2)** |
| **3** | Active | 16 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2) / Root(2)** |
| **4** | Active | 20 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **5** | Active | 24 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3) / Root(3)** |
| **6** | Active | 28 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **7** | Active | 32 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **8** | Active | 36 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4) / Root(4)** |
| **9** | Active | 40 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5) / Root(5)** |
| **10** | Active | 44 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **11** | Active | 48 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **12** | Active | 52 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **13** | Active | 56 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(6) / Corrode(6) / Hex(6) / Sundered(6) / Root(6)** |
| **14** | Active | 60 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **15** | Active | 64 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |
| **16** | Active | 68 m | Radius 7 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Challenge(7) / Corrode(7) / Hex(7) / Sundered(7) / Root(7)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-aoe-attack-pool-reduction-special">
  Melee AoE Attack + Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee AoE Range = Self; no Range cost<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 8 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Disoriented / Expose / Soulburn / Weaken.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 1 m (0) + Special(2) (24) = 24 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Special(2) (24) = 44 PP<br>
      L3 → Target 90 PP: Radius 2 m (20) + Special(3) (48) = 68 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Special(3) (48) = 98 PP<br>
      L5 → Target 150 PP: Radius 3 m (50) + Special(4) (80) = 130 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Special(4) (80) = 160 PP<br>
      L7 → Target 210 PP: Radius 4 m (80) + Special(5) (120) = 200 PP<br>
      L8 → Target 240 PP: Radius 4 m (80) + Special(5) (120) = 200 PP<br>
      L9 → Target 270 PP: Radius 5 m (120) + Special(5) (120) = 240 PP<br>
      L10 → Target 300 PP: Radius 5 m (120) + Special(6) (168) = 288 PP<br>
      L11 → Target 330 PP: Radius 5 m (120) + Special(6) (168) = 288 PP<br>
      L12 → Target 360 PP: Radius 6 m (165) + Special(6) (168) = 333 PP<br>
      L13 → Target 390 PP: Radius 6 m (165) + Special(7) (224) = 389 PP<br>
      L14 → Target 420 PP: Radius 6 m (165) + Special(7) (224) = 389 PP<br>
      L15 → Target 450 PP: Radius 6 m (165) + Special(7) (224) = 389 PP<br>
      L16 → Target 480 PP: Radius 6 m (165) + Special(8) (288) = 453 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A self-centered martial AoE that delivers a premium reduction Special through a weapon-driven area attack.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 1 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)** |
| **2** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)** |
| **3** | Active | Self | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **4** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **5** | Active | Self | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **6** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **7** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **8** | Active | Self | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **9** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **10** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **11** | Active | Self | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **12** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **13** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **14** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **15** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |
| **16** | Active | Self | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(8) / Expose(8) / Soulburn(8) / Weaken(8)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack-pool-reduction-special">
  Ranged AoE Attack + Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged AoE Range = 8 m +4 m per level; Range costs +5 PP per +4 m after 8 m<br>
      Weapon Damage is the baseline damage of the attack and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
      Special Cost = 8 × T(X), T(X) = X × (X + 1) / 2<br><br>
      DESIGN STRUCTURE<br>
      Eligible Specials: Disoriented / Expose / Soulburn / Weaken.<br>
      AoE pays for coverage through Radius. The Special uses its normal printed value and normal Special cost: it is not halved and does not pay an extra Diminishing step.<br>
      Make one AoE Attack Roll and compare the same result separately against each creature's Evade. Each creature hit receives full Weapon Damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.<br>
      This Special-first AoE template adds no bonus Power damage dice; Weapon Damage remains the damage component.<br><br>
      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 1 m (0) + Special(2) (24) = 24 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Special(2) (24) = 49 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 2 m (20) + Special(3) (48) = 78 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Special(3) (48) = 113 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 3 m (50) + Special(3) (48) = 118 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Special(3) (48) = 153 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 4 m (80) + Special(4) (80) = 190 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 4 m (80) + Special(4) (80) = 195 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 5 m (120) + Special(4) (80) = 240 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 5 m (120) + Special(5) (120) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 5 m (120) + Special(5) (120) = 290 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 5 m (120) + Special(5) (120) = 295 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 6 m (165) + Special(5) (120) = 345 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 6 m (165) + Special(6) (168) = 398 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 6 m (165) + Special(6) (168) = 403 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 6 m (165) + Special(7) (224) = 464 PP<br>
<br>      NOTES<br>
      Values never decrease. Unused PP may remain unused when the next Radius or Special increase does not fit cleanly.<br>
      Active Buff: Damage, if active, adds its full listed damage to every creature successfully hit by this AoE.
    </span>
  </span>
</h3>

A ranged martial AoE that delivers a premium reduction Special through a weapon-driven area attack.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 1 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)** |
| **2** | Active | 12 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)** |
| **3** | Active | 16 m | Radius 2 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **4** | Active | 20 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **5** | Active | 24 m | Radius 3 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **6** | Active | 28 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)** |
| **7** | Active | 32 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **8** | Active | 36 m | Radius 4 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **9** | Active | 40 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)** |
| **10** | Active | 44 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **11** | Active | 48 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **12** | Active | 52 m | Radius 5 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **13** | Active | 56 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(5) / Expose(5) / Soulburn(5) / Weaken(5)** |
| **14** | Active | 60 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **15** | Active | 64 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(6) / Expose(6) / Soulburn(6) / Weaken(6)** |
| **16** | Active | 68 m | Radius 6 m | Instant | Affected creatures hit by the AoE take weapon damage. | **Disoriented(7) / Expose(7) / Soulburn(7) / Weaken(7)** |


---
}}
\page
{{pageNumber,auto}}
{{wide
## Ranged Persistent Zones + Diminishing Specials

> **Design Rule:** These Powers are **Ranged Persistent AoE Zones**.  
> They create an ongoing area within range that applies a numeric Special to affected creatures.  
> These Powers are not self-centered, because the zone remains in place and may continue affecting the battlefield.

---
:
### Persistent Zone Rules

A Persistent Zone is created at a target point within the Power's printed Range.

The zone lasts for the listed Duration.

Persistent Diminishing Zones do not make attack rolls and do not deal damage unless the Power explicitly says so.

When a creature is affected by the zone, it receives the listed Special value automatically.

A creature is affected by the zone when:
- the zone appears and the creature is inside it,
- the creature enters the zone for the first time on a Round,
- or the creature starts its turn inside the zone.

A creature can be affected by the same Persistent Zone only **once per Round**.

---
:
### Duration Cost Rule

Persistent Zones use a Duration Multiplier.

For these templates, Duration is fixed at **4 Rounds**.

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

AoE Specials cost one Diminishing step higher than their printed value.

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

## Ranged Persistent Zone + Blight

---
:
<h3 id="ranged-persistent-zone-blight">
  Ranged Persistent Zone + Blight
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

A ranged persistent poison cloud that remains on the battlefield for 4 Rounds.

---
:
**Requirement:** None

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | — | — | — |
| **2** | Active | 12 m | — | — | — | — |
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

## Ranged Persistent Zone + Lacerate / Mark / Ruin / Slow

---
:
<h3 id="ranged-persistent-zone-standard-diminishing-special">
  Ranged Persistent Zone + Lacerate / Mark / Ruin / Slow
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
| **1** | Active | 8 m | — | — | — | — |
| **2** | Active | 12 m | — | — | — | — |
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

## Ranged Persistent Zone + Challenge / Corrode / Hex / Sundered

---
:
<h3 id="ranged-persistent-zone-heavy-diminishing-special">
  Ranged Persistent Zone + Challenge / Corrode / Hex / Sundered
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
      CALCULATION<br>
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
| **1** | Active | 8 m | — | — | — | — |
| **2** | Active | 12 m | — | — | — | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(1) / Corrode(1) / Hex(1) / Sundered(1)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **7** | Active | 32 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **8** | Active | 36 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(2) / Corrode(2) / Hex(2) / Sundered(2)**. |
| **9** | Active | 40 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3)**. |
| **10** | Active | 44 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(3) / Corrode(3) / Hex(3) / Sundered(3)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(4) / Corrode(4) / Hex(4) / Sundered(4)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5)**. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Challenge(5) / Corrode(5) / Hex(5) / Sundered(5)**. |

}}
\page
{{pageNumber,auto}}
{{wide
## Ranged Persistent Zone + Disoriented / Expose / Soulburn / Weaken

<h3 id="ranged-persistent-zone-pool-reduction-special">
  Ranged Persistent Zone + Disoriented / Expose / Soulburn / Weaken
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Range progression = +4 m per level; +5 PP per step after 8 m<br>
      Duration = 4 Rounds; persistent payload multiplier ×2<br>
      AoE Special(X) = 8 × T(X+1)<br><br>
      VALID SPECIALS<br>
      Disoriented(X), Expose(X), Soulburn(X), Weaken(X).<br><br>
      CALCULATION<br>
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
      NOTES<br>
      Levels 1–2 have no version because a legal persistent zone with these Specials does not fit the curve cleanly.<br>
      The zone applies the full printed value whenever a creature becomes affected under the Persistent Zone rules.
    </span>
  </span>
</h3>

A persistent battlefield zone that weakens perception, defense, physical performance, or spiritual performance.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | — | — | — |
| **2** | Active | 12 m | — | — | — | — |
| **3** | Active | 16 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)**. |
| **4** | Active | 20 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(1) / Expose(1) / Soulburn(1) / Weaken(1)**. |
| **5** | Active | 24 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)**. |
| **6** | Active | 28 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)**. |
| **7** | Active | 32 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)**. |
| **8** | Active | 36 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(2) / Expose(2) / Soulburn(2) / Weaken(2)**. |
| **9** | Active | 40 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)**. |
| **10** | Active | 44 m | Radius 2 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)**. |
| **11** | Active | 48 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)**. |
| **12** | Active | 52 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)**. |
| **13** | Active | 56 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(3) / Expose(3) / Soulburn(3) / Weaken(3)**. |
| **14** | Active | 60 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)**. |
| **15** | Active | 64 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)**. |
| **16** | Active | 68 m | Radius 3 m | 4 Rounds | Create a persistent zone. | Affected creatures gain **Disoriented(4) / Expose(4) / Soulburn(4) / Weaken(4)**. |

---
}}

\page
{{pageNumber,auto}}
{{wide
## Martial Attacks + Control Specials

> **Design Rule:** These Powers are **Control-first Martial Actives**.  
> The Control effect is the primary scaling axis.  
> Damage is optional and only appears if it does not distort the Control progression.  
> Unused PP may be ignored.

Control Powers do not all scale in the same way.

Some Control effects scale by value, distance, or strength.  
Examples include **Push**, **Pull**, **Root**, or similar effects.

Other Control effects are binary.  
A target either suffers the state or it does not.

Binary Control effects do not use X-values.

They should not be written as:

- Prone(2)
- Prone(3)
- Disarm(2)
- Disarm(4)

Instead, they are used as fixed-cost control add-ons.

---
:
### Fixed Control Add-ons

Fixed Control Add-ons are control riders that can be attached to another Active Power.

They do not scale by increasing their own value.

Instead, the Power must scale through another axis, such as:

- Damage
- Push / Pull distance
- Range
- AoE size
- another scalable Special
- another clearly defined payload

Prone and Disarm should not normally form a full standalone 16-level Power by themselves.

They are best used as add-ons to damage, forced movement, AoE, or another primary scaling axis.

---
:
### Fixed Control Cost Reference

| **Control Add-on** | **PP Cost** | **Scaling** | **Effect** |
|---|:--:|---|---|
| **Prone** | **60 PP** | Fixed / Binary | The target is knocked prone. The target must spend the normal required movement or action cost to stand up. |
| **Disarm** | **60 PP** | Fixed / Binary | The target drops or loses grip on one held weapon, shield, focus, or held object. |

---
:
}}
\page
{{pageNumber,auto}}
{{wide
### Fixed Control Add-on Rule

A Power with Prone or Disarm must still have another primary scaling axis.

Prone and Disarm do not become stronger by level.

If a stronger version is needed, the Power should combine the fixed control add-on with another scalable effect.

Examples:

- **Push + Prone** scales through Push distance.
- **Pull + Disarm** scales through Pull distance.
- **Damage + Prone** scales through damage.
- **AoE + Disarm** scales through area size or another payload.

---
:
### Attack Resolution

Control Actives follow the normal attack rules for their delivery.

A Melee Control Active uses a melee attack.

A Ranged Control Active uses a ranged attack.

On a hit, the target suffers the listed Control effect.

If the Power includes damage, the target also takes the listed damage.

If the Power misses, the Control effect is not applied unless a specific Power says otherwise.

---
:
### Design Notes

Prone represents being thrown, swept, slammed, tripped, or knocked down.

It creates a tempo cost because the target must stand up, but it should not become a hard-control lock by increasing its own value.

Disarm represents removing or disrupting the target's held item.

It creates tactical pressure, but it should not become stronger by writing Disarm(2), Disarm(3), or similar.

If the Power needs to scale, scale the delivery around it instead.

### Example: Push + Prone Resolution

A character uses **Melee Attack + Push + Prone** at Level 5.

The Power includes:

- Push 6 m
- Prone

The attacker makes the normal melee or ranged attack required by the Power.

If the attack hits, the target is pushed 6 m and falls Prone.

If the attack misses, the target is not pushed and does not fall Prone.

Prone does not scale as Prone(5).  
The Power scales because the Push distance increases by level.
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-attack-push-pull">
  Melee Attack + Push / Pull
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      Forced Movement cost = 30 PP per 2 m<br>
      Damage is omitted in this template because Forced Movement uses the curve cleanly by itself.<br><br>
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
<h3 id="ranged-attack-push-pull">
  Ranged Attack + Push / Pull
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Forced Movement cost = 30 PP per 2 m<br>
      Damage is omitted in this template because Range and Forced Movement are the primary costs.<br><br>
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
      This is a Control-first Ranged Martial Active.<br>
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
**Requirement:** Ranged Weapon or Thrown Weapon

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
## Martial Attacks + Combined Control Specials

> **Design Rule:** These Powers combine one **scaling control axis** with one **fixed control add-on**.  
> Push / Pull provides the scaling value.  
> Prone / Disarm are fixed add-ons and do not scale as Prone(X) or Disarm(X).

Control Combination Powers are resolved like normal Martial Actives.

The attacker makes the required melee or ranged attack roll.

If the attack hits, the target suffers the full listed control package.

If the attack misses, none of the control effects apply.

---

### Control Combination Resolution

A Control Combination Power affects only the target hit by the attack unless the Power explicitly has AoE.

The scaling control axis determines how the Power improves by level.

The fixed control add-on is added once and does not increase.

Examples:

- **Push + Prone** scales by increasing Push distance.
- **Pull + Disarm** scales by increasing Pull distance.
- Prone does not become Prone(2), Prone(3), or Prone(4).
- Disarm does not become Disarm(2), Disarm(3), or Disarm(4).

---

### Fixed Control Add-on Costs

| **Add-on** | **PP Cost** | **Function** |
|---|:--:|---|
| **Prone** | **60 PP** | Target falls prone and must spend the normal required cost to stand up. |
| **Disarm** | **60 PP** | Target loses grip on one held weapon, shield, focus, or held object. |

---

### Forced Movement Costs

| **Distance** | **PP Cost** |
|:--:|:--:|
| **2 m** | 30 PP |
| **4 m** | 60 PP |
| **6 m** | 90 PP |
| **8 m** | 120 PP |
| **10 m** | 150 PP |
| **12 m** | 180 PP |
| **14 m** | 210 PP |
| **16 m** | 240 PP |
| **18 m** | 270 PP |
| **20 m** | 300 PP |
| **22 m** | 330 PP |
| **24 m** | 360 PP |
| **26 m** | 390 PP |
| **28 m** | 420 PP |

---
}}
\page
{{pageNumber,auto}}
{{wide
### Example: Push + Prone

A character uses **Melee Attack + Push + Prone** at Level 5.

The Power includes:

- Push 6 m
- Prone

The attacker makes the normal attack roll required by the Power.

If the attack hits, the target is pushed 6 m and falls Prone.

If the attack misses, the target is not pushed and does not fall Prone.

The Power scales because the Push distance increases by level.  
Prone remains a fixed add-on.

---

### Example: Pull + Disarm

A character uses **Melee Attack + Pull + Disarm** at Level 6.

The Power includes:

- Pull 8 m
- Disarm

The attacker makes the normal attack roll required by the Power.

If the attack hits, the target is pulled 8 m toward the source and loses grip on one held item.

If the attack misses, the target is not pulled and is not disarmed.

The Power scales because the Pull distance increases by level.  
Disarm remains a fixed add-on.

}}
\page
{{pageNumber,auto}}
{{wide

## Martial Attacks + Pull + Disarm

These Powers pull the target and apply Disarm.

---
:
<h3 id="melee-attack-pull-disarm">
  Melee Attack + Pull + Disarm
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      Pull cost = 30 PP per 2 m<br>
      Disarm = fixed 60 PP<br>
      Damage is omitted in this template.<br><br>
      SCALING RULE<br>
      This is a Control Combination Martial Active.<br>
      Disarm is the fixed add-on.<br>
      Pull distance is the scaling axis.<br>
      Pull distance may stay the same or increase, but it may never decrease.<br>
      Disarm does not scale as Disarm(X).<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Not enough budget for Disarm (60 PP), so no effect<br>
      L2 → Target 60 PP: Disarm (60) + Pull — (0) = 60 PP<br>
      L3 → Target 90 PP: Disarm (60) + Pull 2 m (30) = 90 PP<br>
      L4 → Target 120 PP: Disarm (60) + Pull 4 m (60) = 120 PP<br>
      L5 → Target 150 PP: Disarm (60) + Pull 6 m (90) = 150 PP<br>
      L6 → Target 180 PP: Disarm (60) + Pull 8 m (120) = 180 PP<br>
      L7 → Target 210 PP: Disarm (60) + Pull 10 m (150) = 210 PP<br>
      L8 → Target 240 PP: Disarm (60) + Pull 12 m (180) = 240 PP<br>
      L9 → Target 270 PP: Disarm (60) + Pull 14 m (210) = 270 PP<br>
      L10 → Target 300 PP: Disarm (60) + Pull 16 m (240) = 300 PP<br>
      L11 → Target 330 PP: Disarm (60) + Pull 18 m (270) = 330 PP<br>
      L12 → Target 360 PP: Disarm (60) + Pull 20 m (300) = 360 PP<br>
      L13 → Target 390 PP: Disarm (60) + Pull 22 m (330) = 390 PP<br>
      L14 → Target 420 PP: Disarm (60) + Pull 24 m (360) = 420 PP<br>
      L15 → Target 450 PP: Disarm (60) + Pull 26 m (390) = 450 PP<br>
      L16 → Target 480 PP: Disarm (60) + Pull 28 m (420) = 480 PP<br><br>
      NOTES<br>
      This template begins functioning at Level 2 because Disarm costs 60 PP.<br>
      From Level 3 onward, Pull distance becomes the scaling axis.<br>
      Damage is omitted to keep this Power purely focused on control.
    </span>
  </span>
</h3>

A close-range martial technique that hooks the target, drags it toward you, and strips one held item from its grip.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | — | — |
| **2** | Active | Melee Reach | — | Instant | No damage. | **Disarm** one held item. |
| **3** | Active | Melee Reach | — | Instant | No damage. | **Pull 2 m** and **Disarm** one held item. |
| **4** | Active | Melee Reach | — | Instant | No damage. | **Pull 4 m** and **Disarm** one held item. |
| **5** | Active | Melee Reach | — | Instant | No damage. | **Pull 6 m** and **Disarm** one held item. |
| **6** | Active | Melee Reach | — | Instant | No damage. | **Pull 8 m** and **Disarm** one held item. |
| **7** | Active | Melee Reach | — | Instant | No damage. | **Pull 10 m** and **Disarm** one held item. |
| **8** | Active | Melee Reach | — | Instant | No damage. | **Pull 12 m** and **Disarm** one held item. |
| **9** | Active | Melee Reach | — | Instant | No damage. | **Pull 14 m** and **Disarm** one held item. |
| **10** | Active | Melee Reach | — | Instant | No damage. | **Pull 16 m** and **Disarm** one held item. |
| **11** | Active | Melee Reach | — | Instant | No damage. | **Pull 18 m** and **Disarm** one held item. |
| **12** | Active | Melee Reach | — | Instant | No damage. | **Pull 20 m** and **Disarm** one held item. |
| **13** | Active | Melee Reach | — | Instant | No damage. | **Pull 22 m** and **Disarm** one held item. |
| **14** | Active | Melee Reach | — | Instant | No damage. | **Pull 24 m** and **Disarm** one held item. |
| **15** | Active | Melee Reach | — | Instant | No damage. | **Pull 26 m** and **Disarm** one held item. |
| **16** | Active | Melee Reach | — | Instant | No damage. | **Pull 28 m** and **Disarm** one held item. |

---
:
<h3 id="ranged-attack-pull-disarm">
  Ranged Attack + Pull + Disarm
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Pull cost = 30 PP per 2 m<br>
      Disarm = fixed 60 PP<br>
      Damage is omitted in this template.<br><br>
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
      SCALING RULE<br>
      This is a Control Combination Ranged Martial Active.<br>
      Range is paid every level.<br>
      Disarm is the fixed add-on.<br>
      Pull distance is the scaling axis after Range.<br>
      Pull distance may stay the same or increase, but it may never decrease.<br>
      Disarm does not scale as Disarm(X).<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Disarm unavailable = no effect<br>
      L2 → Target 60 PP: Range 12 m (5) + Disarm (60) = 65 PP, above target, so no effect<br>
      L3 → Target 90 PP: Range 16 m (10) + Disarm (60) + Pull — (0) = 70 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Disarm (60) + Pull 2 m (30) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Disarm (60) + Pull 4 m (60) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Disarm (60) + Pull 6 m (90) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Disarm (60) + Pull 8 m (120) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Disarm (60) + Pull 8 m (120) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Disarm (60) + Pull 10 m (150) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Disarm (60) + Pull 12 m (180) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Disarm (60) + Pull 14 m (210) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Disarm (60) + Pull 16 m (240) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Disarm (60) + Pull 18 m (270) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Disarm (60) + Pull 18 m (270) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Disarm (60) + Pull 20 m (300) = 430 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Disarm (60) + Pull 22 m (330) = 465 PP<br><br>
      NOTES<br>
      The Ranged version begins functioning at Level 3 because it must pay Range in addition to Disarm.<br>
      From Level 4 onward, Pull distance becomes the scaling axis.<br>
      Damage is omitted to keep this Power purely focused on control.
    </span>
  </span>
</h3>

A ranged martial technique that drags the target toward the source and strips one held item from its grip.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | — | — |
| **2** | Active | 12 m | — | Instant | — | — |
| **3** | Active | 16 m | — | Instant | No damage. | **Disarm** one held item. |
| **4** | Active | 20 m | — | Instant | No damage. | **Pull 2 m** and **Disarm** one held item. |
| **5** | Active | 24 m | — | Instant | No damage. | **Pull 4 m** and **Disarm** one held item. |
| **6** | Active | 28 m | — | Instant | No damage. | **Pull 6 m** and **Disarm** one held item. |
| **7** | Active | 32 m | — | Instant | No damage. | **Pull 8 m** and **Disarm** one held item. |
| **8** | Active | 36 m | — | Instant | No damage. | **Pull 8 m** and **Disarm** one held item. |
| **9** | Active | 40 m | — | Instant | No damage. | **Pull 10 m** and **Disarm** one held item. |
| **10** | Active | 44 m | — | Instant | No damage. | **Pull 12 m** and **Disarm** one held item. |
| **11** | Active | 48 m | — | Instant | No damage. | **Pull 14 m** and **Disarm** one held item. |
| **12** | Active | 52 m | — | Instant | No damage. | **Pull 16 m** and **Disarm** one held item. |
| **13** | Active | 56 m | — | Instant | No damage. | **Pull 18 m** and **Disarm** one held item. |
| **14** | Active | 60 m | — | Instant | No damage. | **Pull 18 m** and **Disarm** one held item. |
| **15** | Active | 64 m | — | Instant | No damage. | **Pull 20 m** and **Disarm** one held item. |
| **16** | Active | 68 m | — | Instant | No damage. | **Pull 22 m** and **Disarm** one held item. |

}}
\page
{{pageNumber,auto}}
{{wide

## Martial Attacks + Push + Prone

These Powers push the target and apply Prone.

---
:
<h3 id="melee-attack-push-prone">
  Melee Attack + Push + Prone
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      Push cost = 30 PP per 2 m<br>
      Prone = fixed 60 PP<br>
      Damage is omitted in this template.<br><br>
      SCALING RULE<br>
      This is a Control Combination Martial Active.<br>
      Prone is the fixed add-on.<br>
      Push distance is the scaling axis.<br>
      Push distance may stay the same or increase, but it may never decrease.<br>
      Prone does not scale as Prone(X).<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Not enough budget for Prone (60 PP), so no effect<br>
      L2 → Target 60 PP: Prone (60) + Push — (0) = 60 PP<br>
      L3 → Target 90 PP: Prone (60) + Push 2 m (30) = 90 PP<br>
      L4 → Target 120 PP: Prone (60) + Push 4 m (60) = 120 PP<br>
      L5 → Target 150 PP: Prone (60) + Push 6 m (90) = 150 PP<br>
      L6 → Target 180 PP: Prone (60) + Push 8 m (120) = 180 PP<br>
      L7 → Target 210 PP: Prone (60) + Push 10 m (150) = 210 PP<br>
      L8 → Target 240 PP: Prone (60) + Push 12 m (180) = 240 PP<br>
      L9 → Target 270 PP: Prone (60) + Push 14 m (210) = 270 PP<br>
      L10 → Target 300 PP: Prone (60) + Push 16 m (240) = 300 PP<br>
      L11 → Target 330 PP: Prone (60) + Push 18 m (270) = 330 PP<br>
      L12 → Target 360 PP: Prone (60) + Push 20 m (300) = 360 PP<br>
      L13 → Target 390 PP: Prone (60) + Push 22 m (330) = 390 PP<br>
      L14 → Target 420 PP: Prone (60) + Push 24 m (360) = 420 PP<br>
      L15 → Target 450 PP: Prone (60) + Push 26 m (390) = 450 PP<br>
      L16 → Target 480 PP: Prone (60) + Push 28 m (420) = 480 PP<br><br>
      NOTES<br>
      This template begins functioning at Level 2 because Prone costs 60 PP.<br>
      From Level 3 onward, Push distance becomes the scaling axis.<br>
      Damage is omitted to keep this Power purely focused on control.
    </span>
  </span>
</h3>

A close-range martial technique that slams the target away and knocks it prone.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | — | — |
| **2** | Active | Melee Reach | — | Instant | No damage. | Target falls **Prone**. |
| **3** | Active | Melee Reach | — | Instant | No damage. | **Push 2 m** and target falls **Prone**. |
| **4** | Active | Melee Reach | — | Instant | No damage. | **Push 4 m** and target falls **Prone**. |
| **5** | Active | Melee Reach | — | Instant | No damage. | **Push 6 m** and target falls **Prone**. |
| **6** | Active | Melee Reach | — | Instant | No damage. | **Push 8 m** and target falls **Prone**. |
| **7** | Active | Melee Reach | — | Instant | No damage. | **Push 10 m** and target falls **Prone**. |
| **8** | Active | Melee Reach | — | Instant | No damage. | **Push 12 m** and target falls **Prone**. |
| **9** | Active | Melee Reach | — | Instant | No damage. | **Push 14 m** and target falls **Prone**. |
| **10** | Active | Melee Reach | — | Instant | No damage. | **Push 16 m** and target falls **Prone**. |
| **11** | Active | Melee Reach | — | Instant | No damage. | **Push 18 m** and target falls **Prone**. |
| **12** | Active | Melee Reach | — | Instant | No damage. | **Push 20 m** and target falls **Prone**. |
| **13** | Active | Melee Reach | — | Instant | No damage. | **Push 22 m** and target falls **Prone**. |
| **14** | Active | Melee Reach | — | Instant | No damage. | **Push 24 m** and target falls **Prone**. |
| **15** | Active | Melee Reach | — | Instant | No damage. | **Push 26 m** and target falls **Prone**. |
| **16** | Active | Melee Reach | — | Instant | No damage. | **Push 28 m** and target falls **Prone**. |

---
:
<h3 id="ranged-attack-push-prone">
  Ranged Attack + Push + Prone
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Push cost = 30 PP per 2 m<br>
      Prone = fixed 60 PP<br>
      Damage is omitted in this template.<br><br>
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
      SCALING RULE<br>
      This is a Control Combination Ranged Martial Active.<br>
      Range is paid every level.<br>
      Prone is the fixed add-on.<br>
      Push distance is the scaling axis after Range.<br>
      Push distance may stay the same or increase, but it may never decrease.<br>
      Prone does not scale as Prone(X).<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Prone unavailable = no effect<br>
      L2 → Target 60 PP: Range 12 m (5) + Prone (60) = 65 PP, above target, so no effect<br>
      L3 → Target 90 PP: Range 16 m (10) + Prone (60) + Push — (0) = 70 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Prone (60) + Push 2 m (30) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Prone (60) + Push 4 m (60) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Prone (60) + Push 6 m (90) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Prone (60) + Push 8 m (120) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Prone (60) + Push 8 m (120) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Prone (60) + Push 10 m (150) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Prone (60) + Push 12 m (180) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Prone (60) + Push 14 m (210) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Prone (60) + Push 16 m (240) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Prone (60) + Push 18 m (270) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Prone (60) + Push 18 m (270) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Prone (60) + Push 20 m (300) = 430 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Prone (60) + Push 22 m (330) = 465 PP<br><br>
      NOTES<br>
      The Ranged version begins functioning at Level 3 because it must pay Range in addition to Prone.<br>
      From Level 4 onward, Push distance becomes the scaling axis.<br>
      Damage is omitted to keep this Power purely focused on control.
    </span>
  </span>
</h3>

A ranged martial technique that slams the target away from the impact point and knocks it prone.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | — | — |
| **2** | Active | 12 m | — | Instant | — | — |
| **3** | Active | 16 m | — | Instant | No damage. | Target falls **Prone**. |
| **4** | Active | 20 m | — | Instant | No damage. | **Push 2 m** and target falls **Prone**. |
| **5** | Active | 24 m | — | Instant | No damage. | **Push 4 m** and target falls **Prone**. |
| **6** | Active | 28 m | — | Instant | No damage. | **Push 6 m** and target falls **Prone**. |
| **7** | Active | 32 m | — | Instant | No damage. | **Push 8 m** and target falls **Prone**. |
| **8** | Active | 36 m | — | Instant | No damage. | **Push 8 m** and target falls **Prone**. |
| **9** | Active | 40 m | — | Instant | No damage. | **Push 10 m** and target falls **Prone**. |
| **10** | Active | 44 m | — | Instant | No damage. | **Push 12 m** and target falls **Prone**. |
| **11** | Active | 48 m | — | Instant | No damage. | **Push 14 m** and target falls **Prone**. |
| **12** | Active | 52 m | — | Instant | No damage. | **Push 16 m** and target falls **Prone**. |
| **13** | Active | 56 m | — | Instant | No damage. | **Push 18 m** and target falls **Prone**. |
| **14** | Active | 60 m | — | Instant | No damage. | **Push 18 m** and target falls **Prone**. |
| **15** | Active | 64 m | — | Instant | No damage. | **Push 20 m** and target falls **Prone**. |
| **16** | Active | 68 m | — | Instant | No damage. | **Push 22 m** and target falls **Prone**. |

}}
\page
{{pageNumber,auto}}
{{wide
## Support Actives + Heal / Cleanse

> **Design Rule:** These Powers are **Support Actives**.  
> They restore HP, remove negative creature effects, or convert removed hostile pressure into a bonus.

Support Actives are not attack Powers unless they explicitly include a damaging attack.

A Support Active normally affects willing creatures, allied creatures, or ongoing creature effects.

If a Support Active is used on an unwilling creature or a contested target, the GM may require an appropriate attack roll, casting roll, or contest.

---

### Support Resolution

When using a Support Active, choose a valid target within the Power's listed Range.

If the Power is single-target, it affects one valid creature.

If the Power is AoE, it affects all valid creatures in the listed area.

Support Powers do not use the target's Evade unless the Power is also an attack or the GM rules that the target actively resists the effect.

---

### Support Cost Reference

| **Support Effect** | **Cost** | **Scaling Axis** |
|---|:--:|---|
| **Healing** | **15 PP per +1d8 Healing** | Healing dice |
| **Health Level Recovery** | **30 PP per restored Health Level per Safe Haven Rest** | Safe Haven Rest recovery pool |
| **Cleanse(X)** | **4 × T(X) PP** | Total negative Special value removed |
| **Damage** | **15 PP per +1d8 Damage** | Damage dice |

---

### Healing

Healing restores current HP inside the currently active Health Bar.

A Heal Active rolls the listed Healing dice and restores that much HP to the target.

Healing cannot restore lost Health Bars unless a Power explicitly belongs to a separate Health Bar Recovery subsystem.

Healing cannot raise a creature above its maximum HP unless a Power explicitly says otherwise.

---

### Cleanse

Cleanse removes negative Special value from a creature.

When you use **Cleanse(X)**, remove up to **X total points** from one or more eligible negative Specials affecting the target. You choose how to distribute the reduction between those Specials.

If a Special is reduced to **0**, it ends. If the target has less than **X total eligible negative Special value**, any unused Cleanse points are lost.

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

### Cleanse Variants

Pure Cleanse is the reliable removal version.

**Ranged Single Target Cleanse + Damage / Speed / Armor / Evade Absorption** is the conversion version. It removes negative Special value and grants the chosen Absorption Bonus only if the full Cleanse value is spent.

Cleanse Maintenance is not a normal Active. It is an Active Buff. It protects only the user over time and follows the normal Cleanse distribution rule unless a specific entry explicitly says otherwise.

Pure Cleanse is not replaced by **Ranged Single Target Cleanse + Damage / Speed / Armor / Evade Absorption**.
Pure Cleanse is the reliable removal tool.
**Ranged Single Target Cleanse + Damage / Speed / Armor / Evade Absorption** is the conditional reward tool.
Cleanse Maintenance is the self-only upkeep tool.

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
      Active curve = 30 PP per level<br>
      Melee Support Range = Touch / Melee Reach<br>
      Range cost = 0 PP<br>
      AoE = none<br>
      Duration = Instant<br>
      Healing = 15 PP per +1d8 Healing<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      DESIGN STRUCTURE<br>
      This is a Heal-first Support Active with a limited Health Level Recovery pool.<br>
      Normal Healing restores HP inside the target's current Health Level.<br>
      Health Level Recovery restores lost Health Levels and is tracked as a pool per Safe Haven Rest.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery cannot raise a creature above its normal maximum Health Level structure.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      HEALTH LEVEL RECOVERY COST<br>
      Restore 1 Health Level per Safe Haven Rest = 30 PP<br>
      Restore 2 Health Levels per Safe Haven Rest = 60 PP<br>
      Restore 3 Health Levels per Safe Haven Rest = 90 PP<br>
      Restore 4 Health Levels per Safe Haven Rest = 120 PP<br><br>
      SCALING RULE<br>
      First subtract the Health Level Recovery cost from the level's Active PP budget.<br>
      Spend the remaining PP on Healing dice at 15 PP per +1d8 Healing.<br>
      Healing may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Health Level Recovery 0 (0), Heal 2d8 (30) = 30 PP<br>
      L2 → Target 60 PP: Health Level Recovery 0 (0), Heal 4d8 (60) = 60 PP<br>
      L3 → Target 90 PP: Health Level Recovery 0 (0), Heal 6d8 (90) = 90 PP<br>
      L4 → Target 120 PP: Health Level Recovery 1 (30), Heal 6d8 (90) = 120 PP<br>
      L5 → Target 150 PP: Health Level Recovery 1 (30), Heal 8d8 (120) = 150 PP<br>
      L6 → Target 180 PP: Health Level Recovery 1 (30), Heal 10d8 (150) = 180 PP<br>
      L7 → Target 210 PP: Health Level Recovery 1 (30), Heal 12d8 (180) = 210 PP<br>
      L8 → Target 240 PP: Health Level Recovery 2 (60), Heal 12d8 (180) = 240 PP<br>
      L9 → Target 270 PP: Health Level Recovery 2 (60), Heal 14d8 (210) = 270 PP<br>
      L10 → Target 300 PP: Health Level Recovery 2 (60), Heal 16d8 (240) = 300 PP<br>
      L11 → Target 330 PP: Health Level Recovery 2 (60), Heal 18d8 (270) = 330 PP<br>
      L12 → Target 360 PP: Health Level Recovery 3 (90), Heal 18d8 (270) = 360 PP<br>
      L13 → Target 390 PP: Health Level Recovery 3 (90), Heal 20d8 (300) = 390 PP<br>
      L14 → Target 420 PP: Health Level Recovery 3 (90), Heal 22d8 (330) = 420 PP<br>
      L15 → Target 450 PP: Health Level Recovery 4 (120), Heal 22d8 (330) = 450 PP<br>
      L16 → Target 480 PP: Health Level Recovery 4 (120), Heal 24d8 (360) = 480 PP<br><br>
      NOTES<br>
      This Power is intentionally weaker in raw HP Healing than a pure Healing-only Active.<br>
      The lost Healing dice pay for the Health Level Recovery pool.<br>
      A Level 16 pure Healing-only Active would heal 32d8 HP.<br>
      This version heals 24d8 HP and restores up to 4 Health Levels per Safe Haven Rest.<br>
      This Power does not Cleanse, does not grant Temporary HP, does not restore Armor or Evade, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A close-range restorative Active that heals one creature you can touch or reach.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **2d8 HP**. | — |
| **2** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **4d8 HP**. | — |
| **3** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **6d8 HP**. | — |
| **4** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **6d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **5** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **6** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **10d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **7** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **12d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **8** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **12d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **16d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **18d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **18d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **20d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **22d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **22d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | Touch / Melee Reach | — | Instant | Heal one creature for **24d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **4 Health Levels** per Safe Haven Rest. |

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
      Active curve = 30 PP per level<br>
      Ranged Support uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      AoE = none<br>
      Duration = Instant<br>
      Healing = 15 PP per +1d8 Healing<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      DESIGN STRUCTURE<br>
      This is a ranged Heal-first Support Active with a limited Health Level Recovery pool.<br>
      Normal Healing restores HP inside the target's current Health Level.<br>
      Health Level Recovery restores lost Health Levels and is tracked as a pool per Safe Haven Rest.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery cannot raise a creature above its normal maximum Health Level structure.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      HEALTH LEVEL RECOVERY COST<br>
      Restore 1 Health Level per Safe Haven Rest = 30 PP<br>
      Restore 2 Health Levels per Safe Haven Rest = 60 PP<br>
      Restore 3 Health Levels per Safe Haven Rest = 90 PP<br>
      Restore 4 Health Levels per Safe Haven Rest = 120 PP<br><br>
      SCALING RULE<br>
      First pay Range.<br>
      Then subtract the Health Level Recovery cost from the remaining level budget.<br>
      Spend the remaining PP on Healing dice at 15 PP per +1d8 Healing.<br>
      Healing may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0), Health Level Recovery 0 (0), Heal 2d8 (30) = 30 PP<br>
      L2 → Target 60 PP: Range 12 m (5), Health Level Recovery 0 (0), Heal 3d8 (45) = 50 PP<br>
      L3 → Target 90 PP: Range 16 m (10), Health Level Recovery 0 (0), Heal 5d8 (75) = 85 PP<br>
      L4 → Target 120 PP: Range 20 m (15), Health Level Recovery 1 (30), Heal 5d8 (75) = 120 PP<br>
      L5 → Target 150 PP: Range 24 m (20), Health Level Recovery 1 (30), Heal 6d8 (90) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25), Health Level Recovery 1 (30), Heal 8d8 (120) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30), Health Level Recovery 1 (30), Heal 9d8 (135) = 195 PP<br>
      L8 → Target 240 PP: Range 36 m (35), Health Level Recovery 2 (60), Heal 9d8 (135) = 230 PP<br>
      L9 → Target 270 PP: Range 40 m (40), Health Level Recovery 2 (60), Heal 11d8 (165) = 265 PP<br>
      L10 → Target 300 PP: Range 44 m (45), Health Level Recovery 2 (60), Heal 13d8 (195) = 300 PP<br>
      L11 → Target 330 PP: Range 48 m (50), Health Level Recovery 2 (60), Heal 14d8 (210) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55), Health Level Recovery 3 (90), Heal 14d8 (210) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60), Health Level Recovery 3 (90), Heal 16d8 (240) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65), Health Level Recovery 3 (90), Heal 17d8 (255) = 410 PP<br>
      L15 → Target 450 PP: Range 64 m (70), Health Level Recovery 4 (120), Heal 17d8 (255) = 445 PP<br>
      L16 → Target 480 PP: Range 68 m (75), Health Level Recovery 4 (120), Heal 19d8 (285) = 480 PP<br><br>
      NOTES<br>
      This Power is weaker in raw HP Healing than a pure Healing-only ranged Active because Range and Health Level Recovery are both paid from the same Active budget.<br>
      This Power does not Cleanse, does not grant Temporary HP, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A ranged restorative Active that heals one creature within range.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | 8 m | None | Instant | Heal one creature for **2d8 HP**. | None |
| **2** | Active, Support | 12 m | None | Instant | Heal one creature for **3d8 HP**. | None |
| **3** | Active, Support | 16 m | None | Instant | Heal one creature for **5d8 HP**. | None |
| **4** | Active, Support | 20 m | None | Instant | Heal one creature for **5d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **5** | Active, Support | 24 m | None | Instant | Heal one creature for **6d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **6** | Active, Support | 28 m | None | Instant | Heal one creature for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **7** | Active, Support | 32 m | None | Instant | Heal one creature for **9d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **8** | Active, Support | 36 m | None | Instant | Heal one creature for **9d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | 40 m | None | Instant | Heal one creature for **11d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | 44 m | None | Instant | Heal one creature for **13d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | 48 m | None | Instant | Heal one creature for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | 52 m | None | Instant | Heal one creature for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | 56 m | None | Instant | Heal one creature for **16d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | 60 m | None | Instant | Heal one creature for **17d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | 64 m | None | Instant | Heal one creature for **17d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | 68 m | None | Instant | Heal one creature for **19d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the target. | Restore up to **4 Health Levels** per Safe Haven Rest. |

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
      Active curve = 30 PP per level<br>
      Melee AoE Support Range = Self<br>
      Range cost = 0 PP<br>
      Duration = Instant<br>
      Healing = 15 PP per +1d8 Healing<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br>
      Radius 4 m = 90 PP<br><br>
      DESIGN STRUCTURE<br>
      This is a self-centered AoE Heal-first Support Active with a limited Health Level Recovery pool.<br>
      HP Healing applies to all affected creatures.<br>
      Health Level Recovery may be applied to only one affected creature per use.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      SCALING RULE<br>
      First pay AoE radius.<br>
      Then subtract the Health Level Recovery cost from the remaining level budget.<br>
      Spend the remaining PP on Healing dice at 15 PP per +1d8 Healing.<br>
      Healing and AoE may stay the same or increase, but they may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20), Health Level Recovery 0 (0), Heal 1d8 (15) = 35 PP [minimum function exception]<br>
      L2 → Target 60 PP: Radius 2 m (20), Health Level Recovery 0 (0), Heal 2d8 (30) = 50 PP<br>
      L3 → Target 90 PP: Radius 2 m (20), Health Level Recovery 0 (0), Heal 4d8 (60) = 80 PP<br>
      L4 → Target 120 PP: Radius 2 m (20), Health Level Recovery 1 (30), Heal 4d8 (60) = 110 PP<br>
      L5 → Target 150 PP: Radius 2 m (20), Health Level Recovery 1 (30), Heal 6d8 (90) = 140 PP<br>
      L6 → Target 180 PP: Radius 3 m (50), Health Level Recovery 1 (30), Heal 6d8 (90) = 170 PP<br>
      L7 → Target 210 PP: Radius 3 m (50), Health Level Recovery 1 (30), Heal 8d8 (120) = 200 PP<br>
      L8 → Target 240 PP: Radius 3 m (50), Health Level Recovery 2 (60), Heal 8d8 (120) = 230 PP<br>
      L9 → Target 270 PP: Radius 4 m (90), Health Level Recovery 2 (60), Heal 8d8 (120) = 270 PP<br>
      L10 → Target 300 PP: Radius 4 m (90), Health Level Recovery 2 (60), Heal 10d8 (150) = 300 PP<br>
      L11 → Target 330 PP: Radius 4 m (90), Health Level Recovery 2 (60), Heal 12d8 (180) = 330 PP<br>
      L12 → Target 360 PP: Radius 4 m (90), Health Level Recovery 3 (90), Heal 12d8 (180) = 360 PP<br>
      L13 → Target 390 PP: Radius 4 m (90), Health Level Recovery 3 (90), Heal 14d8 (210) = 390 PP<br>
      L14 → Target 420 PP: Radius 4 m (90), Health Level Recovery 3 (90), Heal 16d8 (240) = 420 PP<br>
      L15 → Target 450 PP: Radius 4 m (90), Health Level Recovery 4 (120), Heal 16d8 (240) = 450 PP<br>
      L16 → Target 480 PP: Radius 4 m (90), Health Level Recovery 4 (120), Heal 18d8 (270) = 480 PP<br><br>
      NOTES<br>
      Radius 5 m is not reached in this version because the Health Level Recovery pool consumes part of the Active budget.<br>
      This keeps Healing from dropping at later levels.<br>
      This Power does not Cleanse, does not grant Temporary HP, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A self-centered restorative area Active that heals nearby creatures.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **1d8 HP**. | None |
| **2** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **2d8 HP**. | None |
| **3** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **4d8 HP**. | None |
| **4** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **4d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **5** | Active, Support | Self | Radius 2 m | Instant | Heal affected creatures for **6d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **6** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **6d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **7** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **8** | Active, Support | Self | Radius 3 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **10d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **12d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **12d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **16d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **16d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | Self | Radius 4 m | Instant | Heal affected creatures for **18d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **4 Health Levels** per Safe Haven Rest. |

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
      Active curve = 30 PP per level<br>
      Ranged AoE Support uses printed Range and Radius<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      Duration = Instant<br>
      Healing = 15 PP per +1d8 Healing<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      AOE COSTS<br>
      Radius 2 m = 20 PP<br>
      Radius 3 m = 50 PP<br><br>
      DESIGN STRUCTURE<br>
      This is a ranged AoE Heal-first Support Active with a limited Health Level Recovery pool.<br>
      HP Healing applies to all affected creatures.<br>
      Health Level Recovery may be applied to only one affected creature per use.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      SCALING RULE<br>
      First pay Range and AoE radius.<br>
      Then subtract the Health Level Recovery cost from the remaining level budget.<br>
      Spend the remaining PP on Healing dice at 15 PP per +1d8 Healing.<br>
      Healing, Range, and AoE may stay the same or increase, but they may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0), Radius 2 m (20), Health Level Recovery 0 (0), Heal 1d8 (15) = 35 PP [minimum function exception]<br>
      L2 → Target 60 PP: Range 12 m (5), Radius 2 m (20), Health Level Recovery 0 (0), Heal 2d8 (30) = 55 PP<br>
      L3 → Target 90 PP: Range 16 m (10), Radius 2 m (20), Health Level Recovery 0 (0), Heal 3d8 (45) = 75 PP<br>
      L4 → Target 120 PP: Range 20 m (15), Radius 2 m (20), Health Level Recovery 1 (30), Heal 3d8 (45) = 110 PP<br>
      L5 → Target 150 PP: Range 24 m (20), Radius 2 m (20), Health Level Recovery 1 (30), Heal 5d8 (75) = 145 PP<br>
      L6 → Target 180 PP: Range 28 m (25), Radius 2 m (20), Health Level Recovery 1 (30), Heal 7d8 (105) = 180 PP<br>
      L7 → Target 210 PP: Range 32 m (30), Radius 2 m (20), Health Level Recovery 1 (30), Heal 8d8 (120) = 200 PP<br>
      L8 → Target 240 PP: Range 36 m (35), Radius 2 m (20), Health Level Recovery 2 (60), Heal 8d8 (120) = 235 PP<br>
      L9 → Target 270 PP: Range 40 m (40), Radius 3 m (50), Health Level Recovery 2 (60), Heal 8d8 (120) = 270 PP<br>
      L10 → Target 300 PP: Range 44 m (45), Radius 3 m (50), Health Level Recovery 2 (60), Heal 9d8 (135) = 290 PP<br>
      L11 → Target 330 PP: Range 48 m (50), Radius 3 m (50), Health Level Recovery 2 (60), Heal 11d8 (165) = 325 PP<br>
      L12 → Target 360 PP: Range 52 m (55), Radius 3 m (50), Health Level Recovery 3 (90), Heal 11d8 (165) = 360 PP<br>
      L13 → Target 390 PP: Range 56 m (60), Radius 3 m (50), Health Level Recovery 3 (90), Heal 12d8 (180) = 380 PP<br>
      L14 → Target 420 PP: Range 60 m (65), Radius 3 m (50), Health Level Recovery 3 (90), Heal 14d8 (210) = 415 PP<br>
      L15 → Target 450 PP: Range 64 m (70), Radius 3 m (50), Health Level Recovery 4 (120), Heal 14d8 (210) = 450 PP<br>
      L16 → Target 480 PP: Range 68 m (75), Radius 3 m (50), Health Level Recovery 4 (120), Heal 15d8 (225) = 470 PP<br><br>
      NOTES<br>
      Radius 4 m and Radius 5 m are not reached in this version because Range and Health Level Recovery consume part of the Active budget.<br>
      This keeps Healing from dropping at later levels.<br>
      This Power does not Cleanse, does not grant Temporary HP, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A ranged restorative area Active that heals creatures in a radius around a target point.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | 8 m | Radius 2 m | Instant | Heal affected creatures for **1d8 HP**. | None |
| **2** | Active, Support | 12 m | Radius 2 m | Instant | Heal affected creatures for **2d8 HP**. | None |
| **3** | Active, Support | 16 m | Radius 2 m | Instant | Heal affected creatures for **3d8 HP**. | None |
| **4** | Active, Support | 20 m | Radius 2 m | Instant | Heal affected creatures for **3d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **5** | Active, Support | 24 m | Radius 2 m | Instant | Heal affected creatures for **5d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **6** | Active, Support | 28 m | Radius 2 m | Instant | Heal affected creatures for **7d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **7** | Active, Support | 32 m | Radius 2 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **8** | Active, Support | 36 m | Radius 2 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | 40 m | Radius 3 m | Instant | Heal affected creatures for **8d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | 44 m | Radius 3 m | Instant | Heal affected creatures for **9d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | 48 m | Radius 3 m | Instant | Heal affected creatures for **11d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | 52 m | Radius 3 m | Instant | Heal affected creatures for **11d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | 56 m | Radius 3 m | Instant | Heal affected creatures for **12d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | 60 m | Radius 3 m | Instant | Heal affected creatures for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | 64 m | Radius 3 m | Instant | Heal affected creatures for **14d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | 68 m | Radius 3 m | Instant | Heal affected creatures for **15d8 HP**. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one affected creature. | Restore up to **4 Health Levels** per Safe Haven Rest. |

}}

\page
{{pageNumber,auto}}

{{wide
<h3 id="melee-single-target-health-level-heal">
  Melee Single Target Health Level Heal
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Melee Support Range = Touch / Melee Reach<br>
      Range cost = 0 PP<br>
      AoE = none<br>
      Duration = Instant<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      DESIGN STRUCTURE<br>
      This is a pure Health Level Recovery Support Active.<br>
      It restores lost Health Levels but does not restore HP.<br>
      The recovery is tracked as a pool per Safe Haven Rest.<br>
      The pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery cannot raise a creature above its normal maximum Health Level structure.<br><br>
      SCALING RULE<br>
      Spend the full Active budget on Health Level Recovery.<br>
      Each restored Health Level per Safe Haven Rest costs 30 PP.<br>
      This Power gains exactly 1 Health Level Recovery per Power level.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Restore 1 Health Level (30) = 30 PP<br>
      L2 → Target 60 PP: Restore 2 Health Levels (60) = 60 PP<br>
      L3 → Target 90 PP: Restore 3 Health Levels (90) = 90 PP<br>
      L4 → Target 120 PP: Restore 4 Health Levels (120) = 120 PP<br>
      L5 → Target 150 PP: Restore 5 Health Levels (150) = 150 PP<br>
      L6 → Target 180 PP: Restore 6 Health Levels (180) = 180 PP<br>
      L7 → Target 210 PP: Restore 7 Health Levels (210) = 210 PP<br>
      L8 → Target 240 PP: Restore 8 Health Levels (240) = 240 PP<br>
      L9 → Target 270 PP: Restore 9 Health Levels (270) = 270 PP<br>
      L10 → Target 300 PP: Restore 10 Health Levels (300) = 300 PP<br>
      L11 → Target 330 PP: Restore 11 Health Levels (330) = 330 PP<br>
      L12 → Target 360 PP: Restore 12 Health Levels (360) = 360 PP<br>
      L13 → Target 390 PP: Restore 13 Health Levels (390) = 390 PP<br>
      L14 → Target 420 PP: Restore 14 Health Levels (420) = 420 PP<br>
      L15 → Target 450 PP: Restore 15 Health Levels (450) = 450 PP<br>
      L16 → Target 480 PP: Restore 16 Health Levels (480) = 480 PP<br><br>
      NOTES<br>
      This Power does not heal HP.<br>
      It exists so a dedicated healer can specialize in structural recovery instead of direct HP Healing.<br>
      It does not Cleanse, does not grant Temporary HP, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A close-range restorative Active that repairs lost Health Levels without restoring HP.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **2** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **3** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **4** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **5** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **5 Health Levels** per Safe Haven Rest. |
| **6** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **7** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **7 Health Levels** per Safe Haven Rest. |
| **8** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **8 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **9 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **10 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **11 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **12 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **13 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **14 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **15 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | Touch / Melee Reach | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature you can touch or reach. This Power restores no HP. | Restore up to **16 Health Levels** per Safe Haven Rest. |

}}

\page
{{pageNumber,auto}}

{{wide
<h3 id="ranged-single-target-health-level-heal">
  Ranged Single Target Health Level Heal
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
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      DESIGN STRUCTURE<br>
      This is a pure ranged Health Level Recovery Support Active.<br>
      It restores lost Health Levels but does not restore HP.<br>
      The recovery is tracked as a pool per Safe Haven Rest.<br>
      The pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery cannot raise a creature above its normal maximum Health Level structure.<br><br>
      SCALING RULE<br>
      First pay Range.<br>
      Spend the remaining Active budget on Health Level Recovery.<br>
      Each restored Health Level per Safe Haven Rest costs 30 PP.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0), Restore 1 Health Level (30) = 30 PP<br>
      L2 → Target 60 PP: Range 12 m (5), Restore 1 Health Level (30) = 35 PP<br>
      L3 → Target 90 PP: Range 16 m (10), Restore 2 Health Levels (60) = 70 PP<br>
      L4 → Target 120 PP: Range 20 m (15), Restore 3 Health Levels (90) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20), Restore 4 Health Levels (120) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25), Restore 5 Health Levels (150) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30), Restore 6 Health Levels (180) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35), Restore 6 Health Levels (180) = 215 PP<br>
      L9 → Target 270 PP: Range 40 m (40), Restore 7 Health Levels (210) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45), Restore 8 Health Levels (240) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50), Restore 9 Health Levels (270) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55), Restore 10 Health Levels (300) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60), Restore 11 Health Levels (330) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65), Restore 11 Health Levels (330) = 395 PP<br>
      L15 → Target 450 PP: Range 64 m (70), Restore 12 Health Levels (360) = 430 PP<br>
      L16 → Target 480 PP: Range 68 m (75), Restore 13 Health Levels (390) = 465 PP<br><br>
      NOTES<br>
      This Power restores fewer Health Levels than the melee version because printed Range is paid every level.<br>
      This Power does not heal HP.<br>
      It does not Cleanse, does not grant Temporary HP, and does not grant an Absorption Bonus.
    </span>
  </span>
</h3>

A ranged restorative Active that repairs lost Health Levels without restoring HP.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | 8 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **2** | Active, Support | 12 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **3** | Active, Support | 16 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **4** | Active, Support | 20 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **3 Health Levels** per Safe Haven Rest. |
| **5** | Active, Support | 24 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **4 Health Levels** per Safe Haven Rest. |
| **6** | Active, Support | 28 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **5 Health Levels** per Safe Haven Rest. |
| **7** | Active, Support | 32 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **8** | Active, Support | 36 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **6 Health Levels** per Safe Haven Rest. |
| **9** | Active, Support | 40 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **7 Health Levels** per Safe Haven Rest. |
| **10** | Active, Support | 44 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **8 Health Levels** per Safe Haven Rest. |
| **11** | Active, Support | 48 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **9 Health Levels** per Safe Haven Rest. |
| **12** | Active, Support | 52 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **10 Health Levels** per Safe Haven Rest. |
| **13** | Active, Support | 56 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **11 Health Levels** per Safe Haven Rest. |
| **14** | Active, Support | 60 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **11 Health Levels** per Safe Haven Rest. |
| **15** | Active, Support | 64 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **12 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | 68 m | None | Instant | You may spend this Power's Health Level Recovery pool to restore lost Health Levels on one creature within range. This Power restores no HP. | Restore up to **13 Health Levels** per Safe Haven Rest. |

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
      It has no Healing, no Health Level Recovery, no Temporary HP, and no Absorption Bonus.
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
      It has no Healing, no Health Level Recovery, no Temporary HP, and no Absorption Bonus.
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
      This Power has no Healing, no Health Level Recovery, no Temporary HP, and no Absorption Bonus.
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
      This Power has no Healing, no Health Level Recovery, no Temporary HP, and no Absorption Bonus.
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

## Heal + Cleanse

<h3 id="melee-single-target-heal-cleanse">
  Melee Single Target Heal + Cleanse
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Melee Support Range = Touch / Melee Reach<br>
      Range cost = 0 PP<br>
      AoE = none<br>
      Duration = Instant<br>
      Healing = 15 PP per +1d8 Healing<br>
      Cleanse base cost = 4 PP<br>
      Cleanse(X) = 4 x T(X) PP<br>
      T(X) = X x (X + 1) / 2<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
      CLEANSE COSTS<br>
      Cleanse(1) = 4 PP<br>
      Cleanse(2) = 12 PP<br>
      Cleanse(3) = 24 PP<br>
      Cleanse(4) = 40 PP<br>
      Cleanse(5) = 60 PP<br>
      Cleanse(6) = 84 PP<br>
      Cleanse(7) = 112 PP<br>
      Cleanse(8) = 144 PP<br>
      Cleanse(9) = 180 PP<br><br>
      DESIGN STRUCTURE<br>
      This is a hybrid stabilization Power.<br>
      It combines HP Healing, Cleanse, and a limited Health Level Recovery pool.<br>
      It is not intended to replace pure Healing, pure Cleanse, or pure Health Level Recovery.<br>
      Normal Healing restores HP inside the target's current Health Level.<br>
      Cleanse removes up to X total negative Special value from the target.<br>
      The Cleanse value may be distributed across one or more eligible negative Specials affecting the target.<br>
      Health Level Recovery restores lost Health Levels and is tracked as a pool per Safe Haven Rest.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      TARGET RULE<br>
      Healing, Cleanse, and Health Level Recovery all affect the same target.<br>
      You cannot heal one creature and cleanse another creature with the same use of this Power.<br><br>
      HEALTH LEVEL RECOVERY<br>
      L1 to L7 = no Health Level Recovery<br>
      L8 to L14 = restore 1 Health Level per Safe Haven Rest = 30 PP<br>
      L15 to L16 = restore 2 Health Levels per Safe Haven Rest = 60 PP<br><br>
      SCALING RULE<br>
      First subtract the Health Level Recovery cost from the level's Active PP budget.<br>
      Then buy Cleanse and Healing from the remaining budget.<br>
      Healing may stay the same or increase, but it may never decrease.<br>
      Cleanse may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1: Target 30 PP, Health Level Recovery 0 (0), Cleanse(2) (12), Heal 1d8 (15) = 27 PP<br>
      L2: Target 60 PP, Health Level Recovery 0 (0), Cleanse(3) (24), Heal 2d8 (30) = 54 PP<br>
      L3: Target 90 PP, Health Level Recovery 0 (0), Cleanse(4) (40), Heal 3d8 (45) = 85 PP<br>
      L4: Target 120 PP, Health Level Recovery 0 (0), Cleanse(5) (60), Heal 4d8 (60) = 120 PP<br>
      L5: Target 150 PP, Health Level Recovery 0 (0), Cleanse(5) (60), Heal 6d8 (90) = 150 PP<br>
      L6: Target 180 PP, Health Level Recovery 0 (0), Cleanse(6) (84), Heal 6d8 (90) = 174 PP<br>
      L7: Target 210 PP, Health Level Recovery 0 (0), Cleanse(6) (84), Heal 8d8 (120) = 204 PP<br>
      L8: Target 240 PP, Health Level Recovery 1 (30), Cleanse(6) (84), Heal 8d8 (120) = 234 PP<br>
      L9: Target 270 PP, Health Level Recovery 1 (30), Cleanse(7) (112), Heal 8d8 (120) = 262 PP<br>
      L10: Target 300 PP, Health Level Recovery 1 (30), Cleanse(7) (112), Heal 10d8 (150) = 292 PP<br>
      L11: Target 330 PP, Health Level Recovery 1 (30), Cleanse(8) (144), Heal 10d8 (150) = 324 PP<br>
      L12: Target 360 PP, Health Level Recovery 1 (30), Cleanse(8) (144), Heal 12d8 (180) = 354 PP<br>
      L13: Target 390 PP, Health Level Recovery 1 (30), Cleanse(8) (144), Heal 14d8 (210) = 384 PP<br>
      L14: Target 420 PP, Health Level Recovery 1 (30), Cleanse(9) (180), Heal 14d8 (210) = 420 PP<br>
      L15: Target 450 PP, Health Level Recovery 2 (60), Cleanse(9) (180), Heal 14d8 (210) = 450 PP<br>
      L16: Target 480 PP, Health Level Recovery 2 (60), Cleanse(9) (180), Heal 16d8 (240) = 480 PP<br><br>
      NOTES<br>
      This Power is intentionally weaker than a pure Heal Active and weaker than a pure Cleanse Active.<br>
      It pays for three support axes from one Active budget: Healing, Cleanse, and Health Level Recovery.<br>
      Cleanse removes Special value, not PP value.<br>
      This Power does not grant Temporary HP, does not grant an Absorption Bonus, and does not restore Health Levels beyond its listed Safe Haven Rest pool.
    </span>
  </span>
</h3>

A close-range hybrid support Active that heals one creature and removes negative Special value from it.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **1d8 HP** and remove up to **Cleanse(2)** total negative Special value from it. | None |
| **2** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **2d8 HP** and remove up to **Cleanse(3)** total negative Special value from it. | None |
| **3** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **3d8 HP** and remove up to **Cleanse(4)** total negative Special value from it. | None |
| **4** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **4d8 HP** and remove up to **Cleanse(5)** total negative Special value from it. | None |
| **5** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **6d8 HP** and remove up to **Cleanse(5)** total negative Special value from it. | None |
| **6** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **6d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. | None |
| **7** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **8d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. | None |
| **8** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **8d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **9** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **8d8 HP** and remove up to **Cleanse(7)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **10** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **10d8 HP** and remove up to **Cleanse(7)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **11** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **10d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **12** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **12d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **13** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **14d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |


}}
\page
{{pageNumber,auto}}
{{wide
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **14** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **14d8 HP** and remove up to **Cleanse(9)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **15** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **14d8 HP** and remove up to **Cleanse(9)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | Touch / Melee Reach | None | Instant | Heal one creature for **16d8 HP** and remove up to **Cleanse(9)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **2 Health Levels** per Safe Haven Rest. |

}}

\page
{{pageNumber,auto}}

{{wide
<h3 id="ranged-single-target-heal-cleanse">
  Ranged Single Target Heal + Cleanse
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
      Healing = 15 PP per +1d8 Healing<br>
      Cleanse base cost = 4 PP<br>
      Cleanse(X) = 4 x T(X) PP<br>
      T(X) = X x (X + 1) / 2<br>
      Health Level Recovery = 30 PP per restored Health Level per Safe Haven Rest<br><br>
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
      Cleanse(8) = 144 PP<br><br>

      DESIGN STRUCTURE<br>
      This is a hybrid stabilization Power.<br>
      It combines Range, HP Healing, Cleanse, and a limited Health Level Recovery pool.<br>
      It is not intended to replace pure Healing, pure Cleanse, or pure Health Level Recovery.<br>
      Normal Healing restores HP inside the target's current Health Level.<br>
      Cleanse removes up to X total negative Special value from the target.<br>
      The Cleanse value may be distributed across one or more eligible negative Specials affecting the target.<br>
      Health Level Recovery restores lost Health Levels and is tracked as a pool per Safe Haven Rest.<br>
      The Health Level Recovery pool may be spent across multiple uses of this Power.<br>
      Health Level Recovery does not restore HP by itself. HP recovery comes only from the Healing dice.<br><br>
      TARGET RULE<br>
      Healing, Cleanse, and Health Level Recovery all affect the same target.<br>
      You cannot heal one creature and cleanse another creature with the same use of this Power.<br><br>
      HEALTH LEVEL RECOVERY<br>
      L1 to L7 = no Health Level Recovery<br>
      L8 to L14 = restore 1 Health Level per Safe Haven Rest = 30 PP<br>
      L15 to L16 = restore 2 Health Levels per Safe Haven Rest = 60 PP<br><br>
      SCALING RULE<br>
      First pay Range.<br>
      Then subtract the Health Level Recovery cost from the remaining level budget.<br>
      Then buy Cleanse and Healing from the remaining budget.<br>
      Healing may stay the same or increase, but it may never decrease.<br>
      Cleanse may stay the same or increase, but it may never decrease.<br>
      Unused PP remains unused.<br><br>
      CALCULATION<br>
      L1: Target 30 PP, Range 8 m (0), Health Level Recovery 0 (0), Cleanse(2) (12), Heal 1d8 (15) = 27 PP<br>
      L2: Target 60 PP, Range 12 m (5), Health Level Recovery 0 (0), Cleanse(3) (24), Heal 2d8 (30) = 59 PP<br>
      L3: Target 90 PP, Range 16 m (10), Health Level Recovery 0 (0), Cleanse(4) (40), Heal 2d8 (30) = 80 PP<br>
      L4: Target 120 PP, Range 20 m (15), Health Level Recovery 0 (0), Cleanse(4) (40), Heal 4d8 (60) = 115 PP<br>
      L5: Target 150 PP, Range 24 m (20), Health Level Recovery 0 (0), Cleanse(5) (60), Heal 4d8 (60) = 140 PP<br>
      L6: Target 180 PP, Range 28 m (25), Health Level Recovery 0 (0), Cleanse(5) (60), Heal 6d8 (90) = 175 PP<br>
      L7: Target 210 PP, Range 32 m (30), Health Level Recovery 0 (0), Cleanse(6) (84), Heal 6d8 (90) = 204 PP<br>
      L8: Target 240 PP, Range 36 m (35), Health Level Recovery 1 (30), Cleanse(6) (84), Heal 6d8 (90) = 239 PP<br>
      L9: Target 270 PP, Range 40 m (40), Health Level Recovery 1 (30), Cleanse(6) (84), Heal 7d8 (105) = 259 PP<br>
      L10: Target 300 PP, Range 44 m (45), Health Level Recovery 1 (30), Cleanse(7) (112), Heal 7d8 (105) = 292 PP<br>
      L11: Target 330 PP, Range 48 m (50), Health Level Recovery 1 (30), Cleanse(7) (112), Heal 9d8 (135) = 327 PP<br>
      L12: Target 360 PP, Range 52 m (55), Health Level Recovery 1 (30), Cleanse(7) (112), Heal 10d8 (150) = 347 PP<br>
      L13: Target 390 PP, Range 56 m (60), Health Level Recovery 1 (30), Cleanse(8) (144), Heal 10d8 (150) = 384 PP<br>
      L14: Target 420 PP, Range 60 m (65), Health Level Recovery 1 (30), Cleanse(8) (144), Heal 11d8 (165) = 404 PP<br>
      L15: Target 450 PP, Range 64 m (70), Health Level Recovery 2 (60), Cleanse(8) (144), Heal 11d8 (165) = 439 PP<br>
      L16: Target 480 PP, Range 68 m (75), Health Level Recovery 2 (60), Cleanse(8) (144), Heal 13d8 (195) = 474 PP<br><br>
      NOTES<br>
      This Power is weaker than the melee version because Range is paid every level.<br>
      This Power is intentionally weaker than a pure Heal Active and weaker than a pure Cleanse Active.<br>
      It pays for four support axes from one Active budget: Range, Healing, Cleanse, and Health Level Recovery.<br>
      Cleanse removes Special value, not PP value.<br>
      This Power does not grant Temporary HP, does not grant an Absorption Bonus, and does not restore Health Levels beyond its listed Safe Haven Rest pool.
    </span>
  </span>
</h3>

A ranged hybrid support Active that heals one creature and removes negative Special value from it.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Health Level Recovery Pool** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | 8 m | None | Instant | Heal one creature for **1d8 HP** and remove up to **Cleanse(2)** total negative Special value from it. | None |
| **2** | Active, Support | 12 m | None | Instant | Heal one creature for **2d8 HP** and remove up to **Cleanse(3)** total negative Special value from it. | None |
| **3** | Active, Support | 16 m | None | Instant | Heal one creature for **2d8 HP** and remove up to **Cleanse(4)** total negative Special value from it. | None |
| **4** | Active, Support | 20 m | None | Instant | Heal one creature for **4d8 HP** and remove up to **Cleanse(4)** total negative Special value from it. | None |
| **5** | Active, Support | 24 m | None | Instant | Heal one creature for **4d8 HP** and remove up to **Cleanse(5)** total negative Special value from it. | None |
| **6** | Active, Support | 28 m | None | Instant | Heal one creature for **6d8 HP** and remove up to **Cleanse(5)** total negative Special value from it. | None |
| **7** | Active, Support | 32 m | None | Instant | Heal one creature for **6d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. | None |
| **8** | Active, Support | 36 m | None | Instant | Heal one creature for **6d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **9** | Active, Support | 40 m | None | Instant | Heal one creature for **7d8 HP** and remove up to **Cleanse(6)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **10** | Active, Support | 44 m | None | Instant | Heal one creature for **7d8 HP** and remove up to **Cleanse(7)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **11** | Active, Support | 48 m | None | Instant | Heal one creature for **9d8 HP** and remove up to **Cleanse(7)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **12** | Active, Support | 52 m | None | Instant | Heal one creature for **10d8 HP** and remove up to **Cleanse(7)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **13** | Active, Support | 56 m | None | Instant | Heal one creature for **10d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **14** | Active, Support | 60 m | None | Instant | Heal one creature for **11d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **1 Health Level** per Safe Haven Rest. |
| **15** | Active, Support | 64 m | None | Instant | Heal one creature for **11d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **2 Health Levels** per Safe Haven Rest. |
| **16** | Active, Support | 68 m | None | Instant | Heal one creature for **13d8 HP** and remove up to **Cleanse(8)** total negative Special value from it. You may spend this Power's Health Level Recovery pool to restore lost Health Levels on the same target. | Restore up to **2 Health Levels** per Safe Haven Rest. |

}}
\page
{{pageNumber,auto}}
{{wide


<h3 id="ranged-single-target-cleanse-absorption">
  Ranged Single Target Cleanse + Damage / Speed / Armor / Evade Absorption
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Power Type = Active, Support<br>
      Active curve = 30 PP per level<br>
      Range = 24 m = 20 PP<br>
      AoE = none<br>
      Duration = Instant<br>
      Cleanse(X) = 4 × T(X) PP<br>
      T(X) = X × (X + 1) / 2<br>
      Absorption Duration = until the end of combat<br><br>
      CLEANSE COSTS<br>
      Cleanse(3) = 4 × T(3) = 24 PP<br>
      Cleanse(4) = 4 × T(4) = 40 PP<br>
      Cleanse(5) = 4 × T(5) = 60 PP<br>
      Cleanse(6) = 4 × T(6) = 84 PP<br>
      Cleanse(7) = 4 × T(7) = 112 PP<br>
      Cleanse(8) = 4 × T(8) = 144 PP<br><br>
      DESIGN STRUCTURE<br>
      This is the fixed progression for Ranged Single Target Cleanse + Damage / Speed / Armor / Evade Absorption.<br>
      It is not an Active Buff and does not occupy the maintained Active Buff slot.<br>
      Each version has exactly one Absorption type: Damage, Speed, Armor, or Evade.<br>
      The Absorption type is chosen when the Power is created or learned.<br>
      The Cleanse value may be distributed across one or more eligible negative Specials affecting the target.<br>
      Absorption triggers only if the full listed Cleanse value is actually spent.<br>
      Absorption Bonuses can stack, including repeated bonuses of the same Absorption type.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: no version = 0 PP<br>
      L2 → Target 60 PP: no version = 0 PP<br>
      L3 → Target 90 PP: Range 24 m (20) + Cleanse(3) (24) + Absorption Bonus I (catalogue milestone) = fixed catalogue progression<br>
      L4 → Target 120 PP: Range 24 m (20) + Cleanse(4) (40) + Absorption Bonus I (catalogue milestone) = fixed catalogue progression<br>
      L5 → Target 150 PP: Range 24 m (20) + Cleanse(5) (60) + Absorption Bonus I (catalogue milestone) = fixed catalogue progression<br>
      L6 → Target 180 PP: Range 24 m (20) + Cleanse(6) (84) + Absorption Bonus I (catalogue milestone) = fixed catalogue progression<br>
      L7 → Target 210 PP: Range 24 m (20) + Cleanse(6) (84) + Absorption Bonus II (catalogue milestone) = fixed catalogue progression<br>
      L8 → Target 240 PP: Range 24 m (20) + Cleanse(6) (84) + Absorption Bonus III (catalogue milestone) = fixed catalogue progression<br>
      L9 → Target 270 PP: Range 24 m (20) + Cleanse(7) (112) + Absorption Bonus III (catalogue milestone) = fixed catalogue progression<br>
      L10 → Target 300 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus III (catalogue milestone) = fixed catalogue progression<br>
      L11 → Target 330 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus III (catalogue milestone) = fixed catalogue progression<br>
      L12 → Target 360 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus IV (catalogue milestone) = fixed catalogue progression<br>
      L13 → Target 390 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus V (catalogue milestone) = fixed catalogue progression<br>
      L14 → Target 420 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus V (catalogue milestone) = fixed catalogue progression<br>
      L15 → Target 450 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus VI (catalogue milestone) = fixed catalogue progression<br>
      L16 → Target 480 PP: Range 24 m (20) + Cleanse(8) (144) + Absorption Bonus VII (catalogue milestone) = fixed catalogue progression<br><br>
      NOTES<br>
      Do not rebuild this Power by adding the full standalone Cleanse cost and the full standalone bonus cost together.<br>
      The Absorption Bonus is conditional and only triggers when the full listed Cleanse value is actually spent across eligible negative Specials.<br>
      If the target has less total eligible negative Special value than the listed Cleanse value, Cleanse removes what it can, but Absorption does not trigger.<br>
      This Power has no damage by itself, no attack rider, no Spell Resistance, no Healing, no Temporary HP, no Damage Reduction, no Phasing, and no passive effect.<br>
      Damage, Speed, Armor, or Evade are gained only through the chosen Absorption type and only if Absorption triggers.
    </span>
  </span>
</h3>

This Power cleanses one creature and converts the fully spent Cleanse value into one chosen Absorption type: Damage, Speed, Armor, or Evade.

| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active, Support | — | — | — | No version. | — |
| **2** | Active, Support | — | — | — | No version. | — |
| **3** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(3)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus I** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **4** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(4)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus I** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **5** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(5)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus I** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **6** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(6)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus I** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **7** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(6)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus II** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **8** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(6)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus III** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **9** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(7)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus III** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **10** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus III** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
}}

\page
{{pageNumber,auto}}
{{wide
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **11** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus III** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **12** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus IV** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **13** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus V** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **14** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus V** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **15** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus VI** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |
| **16** | Active, Support | 24 m | — | Instant | Remove up to **Cleanse(8)** total negative Special value from the target. The removed value may be split across one or more eligible negative Specials. If the full Cleanse value is spent, the target gains **Absorption Bonus VII** until the end of combat. Choose one Absorption type when this Power is created or learned: Damage, Speed, Armor, or Evade. Absorption Bonuses can stack. | — |


ABSORPTION BONUS VALUES 
| Bonus | Damage | Speed | Armor | Evade | 
|:--:|:--:|:--:|:--:|:--:| 
| I | +1d8 Damage | +4 m Speed | +2 Armor | +2 Evade | 
| II | +2d8 Damage | +8 m Speed | +4 Armor | +4 Evade | 
| III | +3d8 Damage | +12 m Speed | +6 Armor | +6 Evade | 
| IV | +4d8 Damage | +16 m Speed | +8 Armor | +8 Evade | 
| V | +5d8 Damage | +20 m Speed | +10 Armor | +10 Evade |
| VI | +6d8 Damage | +24 m Speed | +12 Armor | +12 Evade | 
| VII | +7d8 Damage | +28 m Speed | +14 Armor | +14 Evade | 

CLEANSE EXAMPLES Cleanse(6) may reduce Ruin(8) to Ruin(2). Cleanse(6) may end Ruin(6). Cleanse(6) may also be divided between Ruin(3) and Hex(3), ending both. Absorption triggers whenever the full total Cleanse(6) value is spent, whether on one Special or several. If the target has only Ruin(3) and you use Cleanse(6), Ruin ends but Absorption does not trigger because only 3 points were spent.
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

If the Barrier is split into multiple spaces or wall segments, distribute the total HP evenly across those spaces or segments.

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

If the Wall is divided into multiple spaces, divide the Barrier's total HP evenly between those spaces.

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

### Example — Dispel Against a Barrier

A Level 7 Barrier is active on the battlefield.

A character uses **Dispel(7)** against it.

Because the Dispel Strength is equal to the Barrier's Power Level, the entire Barrier ends.

The Barrier is removed completely.

It does not matter how much HP the Barrier has remaining.

Dispel removes the ongoing Power.  
Damage removes the Barrier by reducing its HP.

Both are valid ways to remove a Barrier.

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
      DISPEL RULE<br>
      Dispel compares directly against Power Level.<br>
      A Dispel removes Powers of equal or lower Level.<br><br>
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

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | — | — | — | — | — |
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

- it spends an Action to inspect it,
- it physically interacts with the illusion,
- the illusion behaves impossibly,
- or the GM decides the creature has a clear reason to doubt it.

The check is normally:

**Wits Attribute Check or Perception Skill Check vs. the caster’s Power TN**

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

## Martial Attacks + Hard Control

> **Design Rule:** Hard Control effects remove or deny major parts of a creature's turn.  
> Because of that, they are not normal Diminishing Specials and cannot be chosen through standard Damage + Special templates.

---
:
### Hard Control Rule

Hard Control effects are **fixed-cost control add-ons**.

They do not scale as Stunned(2), Stunned(3), Sleep(4), or similar.

A Hard Control Power must still have another primary scaling axis, such as:

- Damage
- Push / Pull distance
- AoE size
- Range
- Duration, if specifically allowed
- another non-hard-control effect

Hard Control may not be freely combined with every template.

The GM may reject combinations that create action denial loops, unavoidable lockdowns, or repeated loss of turns.

---
:
### Hard Control Cost Reference

| **Hard Control Add-on** | **PP Cost** | **Scaling** | **Notes** |
|---|:--:|---|---|
| **Stunned** | **120 PP** | Fixed / Binary | The target loses its next Attack Action and cannot use Reactions until the start of its next turn. Stunned does not scale as Stunned(X). |

---
:
### Stunned

A Stunned creature is briefly overwhelmed, staggereded, dazed, or locked out of action.

While Stunned:

- The creature loses its next **Attack Action**.
- The creature cannot use **Reactions**.
- The creature can still take normal movement unless another effect prevents it.
- The creature can still defend itself normally unless another effect says otherwise.
- The Stunned condition ends at the start of the creature's next turn after the lost Attack Action is resolved.

Stunned is intentionally short and expensive.

It is not a full-turn skip.

It does not remove all movement.

It does not prevent Defense Rolls.

It does not stack with itself.

---
:

}}

\page
{{pageNumber,auto}}
{{wide
### Stun Lock Prevention

A creature cannot lose more than one Attack Action from Stunned before it has taken a normal turn.

If a creature is already Stunned, applying Stunned again before it has acted has no additional effect unless a specific Power says otherwise.

This prevents repeated Hard Control from removing a creature from the encounter.

---
:
### Hard Control Design Notes

Stunned represents a powerful tempo swing.

It should feel stronger than Prone or Disarm, because it directly denies an Attack Action.

However, it should not become a complete shutdown effect.

For this reason:

- Prone and Disarm cost **60 PP**.
- Stunned costs **120 PP**.
- Stunned is fixed and binary.
- Stunned does not scale with X.
- Stunned should usually appear only on dedicated Control Powers or high-level mixed Powers.

}}

\page
{{pageNumber,auto}}
{{wide

## Martial Attacks + Stunned

These Powers deal damage and apply Stunned.

---
:
<h3 id="melee-attack-stunned">
  Melee Attack + Stunned
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Melee Range = Melee Reach<br>
      No Range cost<br>
      +1d8 Damage = 15 PP<br>
      Stunned = fixed 120 PP<br><br>
      HARD CONTROL RULE<br>
      Stunned is a fixed Hard Control add-on.<br>
      It does not scale as Stunned(X).<br>
      Stunned causes the target to lose its next Attack Action and prevents Reactions until the start of its next turn.<br>
      Stunned does not remove movement and does not prevent Defense Rolls.<br><br>
      SCALING RULE<br>
      This is a Damage + Hard Control Martial Active.<br>
      Stunned is the fixed add-on.<br>
      Damage is the scaling axis after Stunned becomes available.<br>
      Damage may stay the same or increase, but it may never decrease.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Not enough budget for Stunned (120 PP), so no Stun version exists<br>
      L2 → Target 60 PP: Not enough budget for Stunned (120 PP), so no Stun version exists<br>
      L3 → Target 90 PP: Not enough budget for Stunned (120 PP), so no Stun version exists<br>
      L4 → Target 120 PP: Stunned (120) + Damage — (0) = 120 PP<br>
      L5 → Target 150 PP: Stunned (120) + Damage +2d8 (30) = 150 PP<br>
      L6 → Target 180 PP: Stunned (120) + Damage +4d8 (60) = 180 PP<br>
      L7 → Target 210 PP: Stunned (120) + Damage +6d8 (90) = 210 PP<br>
      L8 → Target 240 PP: Stunned (120) + Damage +8d8 (120) = 240 PP<br>
      L9 → Target 270 PP: Stunned (120) + Damage +10d8 (150) = 270 PP<br>
      L10 → Target 300 PP: Stunned (120) + Damage +12d8 (180) = 300 PP<br>
      L11 → Target 330 PP: Stunned (120) + Damage +14d8 (210) = 330 PP<br>
      L12 → Target 360 PP: Stunned (120) + Damage +16d8 (240) = 360 PP<br>
      L13 → Target 390 PP: Stunned (120) + Damage +18d8 (270) = 390 PP<br>
      L14 → Target 420 PP: Stunned (120) + Damage +20d8 (300) = 420 PP<br>
      L15 → Target 450 PP: Stunned (120) + Damage +22d8 (330) = 450 PP<br>
      L16 → Target 480 PP: Stunned (120) + Damage +24d8 (360) = 480 PP<br><br>
      NOTES<br>
      This template begins functioning at Level 4 because Stunned costs 120 PP.<br>
      From Level 5 onward, damage becomes the scaling axis.<br>
      Stunned remains fixed and never becomes Stunned(X).<br>
      This Power is intentionally expensive because it denies an Attack Action.
    </span>
  </span>
</h3>

A close-range martial technique that staggers the target and briefly denies its ability to attack.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Hard Control** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | — | — |
| **2** | Active | Melee Reach | — | Instant | — | — |
| **3** | Active | Melee Reach | — | Instant | — | — |
| **4** | Active | Melee Reach | — | Until the target's next turn | No damage. | Target is **Stunned**. |
| **5** | Active | Melee Reach | — | Until the target's next turn | Deal **+2d8 damage** on hit. | Target is **Stunned**. |
| **6** | Active | Melee Reach | — | Until the target's next turn | Deal **+4d8 damage** on hit. | Target is **Stunned**. |
| **7** | Active | Melee Reach | — | Until the target's next turn | Deal **+6d8 damage** on hit. | Target is **Stunned**. |
| **8** | Active | Melee Reach | — | Until the target's next turn | Deal **+8d8 damage** on hit. | Target is **Stunned**. |
| **9** | Active | Melee Reach | — | Until the target's next turn | Deal **+10d8 damage** on hit. | Target is **Stunned**. |
| **10** | Active | Melee Reach | — | Until the target's next turn | Deal **+12d8 damage** on hit. | Target is **Stunned**. |
| **11** | Active | Melee Reach | — | Until the target's next turn | Deal **+14d8 damage** on hit. | Target is **Stunned**. |
| **12** | Active | Melee Reach | — | Until the target's next turn | Deal **+16d8 damage** on hit. | Target is **Stunned**. |
| **13** | Active | Melee Reach | — | Until the target's next turn | Deal **+18d8 damage** on hit. | Target is **Stunned**. |
| **14** | Active | Melee Reach | — | Until the target's next turn | Deal **+20d8 damage** on hit. | Target is **Stunned**. |
| **15** | Active | Melee Reach | — | Until the target's next turn | Deal **+22d8 damage** on hit. | Target is **Stunned**. |
| **16** | Active | Melee Reach | — | Until the target's next turn | Deal **+24d8 damage** on hit. | Target is **Stunned**. |

---
:
<h3 id="ranged-attack-stunned">
  Ranged Attack + Stunned
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Ranged Power uses printed Range<br>
      Range progression = +4 m per level<br>
      Range cost = +5 PP per +4 m after 8 m<br>
      +1d8 Damage = 15 PP<br>
      Stunned = fixed 120 PP<br><br>
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
      HARD CONTROL RULE<br>
      Stunned is a fixed Hard Control add-on.<br>
      It does not scale as Stunned(X).<br>
      Stunned causes the target to lose its next Attack Action and prevents Reactions until the start of its next turn.<br>
      Stunned does not remove movement and does not prevent Defense Rolls.<br><br>
      SCALING RULE<br>
      This is a Damage + Hard Control Ranged Martial Active.<br>
      Range is paid every level.<br>
      Stunned is the fixed add-on.<br>
      Damage is the scaling axis after Range and Stunned are paid.<br>
      Damage may stay the same or increase, but it may never decrease.<br><br>
      CALCULATION<br>
      L1 → Target 30 PP: Not enough budget for Stunned (120 PP), so no Stun version exists<br>
      L2 → Target 60 PP: Range 12 m (5) + Stunned (120) = 125 PP above target, so no effect<br>
      L3 → Target 90 PP: Range 16 m (10) + Stunned (120) = 130 PP above target, so no effect<br>
      L4 → Target 120 PP: Range 20 m (15) + Stunned (120) = 135 PP above target, so no effect<br>
      L5 → Target 150 PP: Range 24 m (20) + Stunned (120) + Damage — (0) = 140 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Stunned (120) + Damage +2d8 (30) = 175 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Stunned (120) + Damage +4d8 (60) = 210 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Stunned (120) + Damage +5d8 (75) = 230 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Stunned (120) + Damage +7d8 (105) = 265 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Stunned (120) + Damage +9d8 (135) = 300 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Stunned (120) + Damage +10d8 (150) = 320 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Stunned (120) + Damage +12d8 (180) = 355 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Stunned (120) + Damage +14d8 (210) = 390 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Stunned (120) + Damage +15d8 (225) = 410 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Stunned (120) + Damage +17d8 (255) = 445 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Stunned (120) + Damage +19d8 (285) = 480 PP<br><br>
      NOTES<br>
      This template begins functioning at Level 5 because Ranged Powers must also pay Range.<br>
      The Ranged version trails behind Melee because it pays Range every level.<br>
      Stunned remains fixed and never becomes Stunned(X).<br>
      This Power is intentionally expensive because it denies an Attack Action.
    </span>
  </span>
</h3>

A ranged martial technique that staggers the target from a distance and briefly denies its ability to attack.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Hard Control** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | — | — |
| **2** | Active | 12 m | — | Instant | — | — |
| **3** | Active | 16 m | — | Instant | — | — |
| **4** | Active | 20 m | — | Instant | — | — |
| **5** | Active | 24 m | — | Until the target's next turn | No damage. | Target is **Stunned**. |
| **6** | Active | 28 m | — | Until the target's next turn | Deal **+2d8 damage** on hit. | Target is **Stunned**. |
| **7** | Active | 32 m | — | Until the target's next turn | Deal **+4d8 damage** on hit. | Target is **Stunned**. |
| **8** | Active | 36 m | — | Until the target's next turn | Deal **+5d8 damage** on hit. | Target is **Stunned**. |
| **9** | Active | 40 m | — | Until the target's next turn | Deal **+7d8 damage** on hit. | Target is **Stunned**. |
| **10** | Active | 44 m | — | Until the target's next turn | Deal **+9d8 damage** on hit. | Target is **Stunned**. |
| **11** | Active | 48 m | — | Until the target's next turn | Deal **+10d8 damage** on hit. | Target is **Stunned**. |
| **12** | Active | 52 m | — | Until the target's next turn | Deal **+12d8 damage** on hit. | Target is **Stunned**. |
| **13** | Active | 56 m | — | Until the target's next turn | Deal **+14d8 damage** on hit. | Target is **Stunned**. |
| **14** | Active | 60 m | — | Until the target's next turn | Deal **+15d8 damage** on hit. | Target is **Stunned**. |
| **15** | Active | 64 m | — | Until the target's next turn | Deal **+17d8 damage** on hit. | Target is **Stunned**. |
| **16** | Active | 68 m | — | Until the target's next turn | Deal **+19d8 damage** on hit. | Target is **Stunned**. |


}}
\page
{{pageNumber,auto}}
{{wide

## Weapon Attack Powers

> **Design Rule:** These Powers are basic weapon-based Active attack templates.  
> They are used to model clean weapon attacks, AoE weapon attacks, Split Attacks, Split AoE attacks, and Autofire.

Weapon Attack Templates are still **Actives**.

They use weapons, unarmed attacks, thrown weapons, or ranged weapons as their delivery.

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

Split Attack does not create full independent attacks.

A Split Attack divides one attack sequence between multiple targets.

When you use a Split Attack:

1. Choose the listed number of targets.
2. Split your **Attack Pool** between those targets before rolling.
3. Roll each split attack separately.
4. Determine which targets are hit.
5. Roll one total **Damage Pool** for the Power.
6. Split that total Damage Pool between all successful hits.
7. Each successful target takes only the damage assigned to it.

The Damage Pool includes:

- weapon damage,
- plus the Power's listed bonus damage.

A creature may not be targeted more than once by the same Split Attack unless the Power explicitly allows it.

Split Attack increases targeting flexibility.

It does not multiply damage.  
It does not create several full-damage attacks.  
It does not roll full weapon damage separately for every target.

---

### Split AoE Rule

Split AoE divides one AoE attack sequence between multiple impact zones. It does not create several full-damage AoEs.

When you use a Split AoE:

1. Choose the listed number of AoE placements.
2. Split your **Attack Pool** between those placements before rolling.
3. Roll each AoE placement separately.
4. For each placement, compare that placement's final roll separately against the **Evade of every valid creature** inside its Radius.
5. Resolve legal Evade Reactions and **Dive for Cover** for each creature normally.
6. A placement is successful if at least one creature remains hit after those defenses resolve.
7. Roll one total **Damage Pool** for the Power.
8. Split that total Damage Pool between all successful placements.
9. Every creature hit by a successful placement takes the damage assigned to that placement.

Each placement uses the Power's listed Radius.

A creature can be affected only once by the same Split AoE unless the Power explicitly says otherwise. If overlapping successful placements would affect the same creature, apply only the **highest damage assigned to one of those placements**.

Split AoE increases battlefield coverage. It does not multiply the Power's total Damage Pool and does not roll full weapon damage separately for every placement.

---
}}
\page
{{pageNumber,auto}}
{{wide

### Autofire Rule

Autofire is one ranged attack that walks through an ordered chain of targets.

Before rolling:

1. Choose the first target within the Power's Range.
2. Declare the remaining targets in order, up to the Power's Target Capacity.
3. Every target after the first must be within **4 m of the previous target** and within the Power's Range.
4. A creature cannot appear more than once in the same Autofire chain.

Then make **one ranged Attack Roll**.

Compare that same final result against each target's **Evade in the declared order**.

- A target may use **Reaction: Evade** against its own hit check.
- If the Attack Roll fails to meet a target's final Evade, that target is missed and **Autofire ends immediately**.
- Later declared targets are not checked.
- **Dive for Cover cannot be used against Autofire.**

Every target successfully hit receives the Power's **full printed payload**, including full weapon damage, full listed Power damage, full Specials, and applicable offensive buffs and riders.

Autofire Target Capacity costs **30 PP per additional target** after the first target.

Additional Autofire targets require **no target-count Raises**. Normal Raises may still be used for legal Raise effects of the Power.

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

A character uses a Level 7 Melee Split Attack.

The Power allows up to **3 melee weapon attacks** and the character has an Attack Pool of **12 dice**.

Before rolling, the character splits the pool:

- 5 dice against Enemy A
- 4 dice against Enemy B
- 3 dice against Enemy C

Enemy A and Enemy C are hit. Enemy B is missed.

The character rolls the Power's one total Damage Pool and splits the final damage only between A and C.

Split Attack does not roll full weapon damage separately for every strike and does not multiply the total Damage Pool.

}}
\page
{{pageNumber,auto}}
{{wide

### Example — Split AoE

A character uses a Split AoE Power with **2 AoE placements**, each with **Radius 3 m**, and an Attack Pool of **10 dice**.

Before rolling, the character splits the Attack Pool:

- 6 dice for Zone A
- 4 dice for Zone B

Each zone is rolled once. The result for Zone A is compared separately against every creature's Evade in Zone A. The result for Zone B is compared separately against every creature's Evade in Zone B.

After legal Evade Reactions and Dive for Cover resolve, Zone A still has two hit creatures while Zone B has none. Only Zone A is therefore a successful placement.

The character rolls one total Damage Pool and assigns it to Zone A. Both creatures still hit in Zone A take that assigned damage.

If both zones had been successful, the one total Damage Pool would have been split between the two zones.

}}
\page
{{pageNumber,auto}}
{{wide

### Example — Autofire

A character uses a Level 8 Ranged Autofire Power. It can include up to **5 targets** and deals weapon damage + **5d8 damage** on every successful hit.

Before rolling, the character declares:

> A → B → C → D

Each target is within 4 m of the previous target and all four are within the Power's Range.

The character makes one ranged Attack Roll and gets **27**.

- Target A has Evade 18: hit.
- Target B has Evade 23: hit.
- Target C has Evade 25 and uses Reaction: Evade to raise its final Evade to 29: miss.
- Autofire ends immediately. Target D is not checked.

Targets A and B each take:

> weapon damage + **5d8 damage**

Target C and Target D take nothing.

Autofire uses no target-count Raises, and Dive for Cover cannot be used against it.

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
**Requirement:** Ranged Weapon or Thrown Weapon

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
**Requirement:** Ranged Weapon or Thrown Weapon

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
      L1–6 → up to 2 attacks<br>
      L7–12 → up to 3 attacks<br>
      L13–16 → up to 4 attacks<br><br>
      NOTES<br>
      Split Attack does not multiply damage.<br>
      The attacker splits the Attack Pool before rolling.<br>
      The attacker also splits the total Damage Pool between successful hits.
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
| **1** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage, then split that damage between successful hits. | — |
| **2** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **2d8 damage**, then split that damage between successful hits. | — |
| **3** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **4d8 damage**, then split that damage between successful hits. | — |
| **4** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **6d8 damage**, then split that damage between successful hits. | — |
| **5** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **8d8 damage**, then split that damage between successful hits. | — |
| **6** | Active | Melee Reach | — | Instant | Make up to **2 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **10d8 damage**, then split that damage between successful hits. | — |
| **7** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **10d8 damage**, then split that damage between successful hits. | — |
| **8** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **12d8 damage**, then split that damage between successful hits. | — |
| **9** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **14d8 damage**, then split that damage between successful hits. | — |
| **10** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **16d8 damage**, then split that damage between successful hits. | — |
| **11** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **18d8 damage**, then split that damage between successful hits. | — |
| **12** | Active | Melee Reach | — | Instant | Make up to **3 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **20d8 damage**, then split that damage between successful hits. | — |
| **13** | Active | Melee Reach | — | Instant | Make up to **4 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **20d8 damage**, then split that damage between successful hits. | — |
| **14** | Active | Melee Reach | — | Instant | Make up to **4 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **22d8 damage**, then split that damage between successful hits. | — |
| **15** | Active | Melee Reach | — | Instant | Make up to **4 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **24d8 damage**, then split that damage between successful hits. | — |
| **16** | Active | Melee Reach | — | Instant | Make up to **4 melee weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **26d8 damage**, then split that damage between successful hits. | — |

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
      L1–6 → up to 2 attacks<br>
      L7–12 → up to 3 attacks<br>
      L13–16 → up to 4 attacks<br><br>
      NOTES<br>
      Split Attack does not multiply damage.<br>
      The Ranged version pays Range every level, so its bonus damage trails behind the melee version.
    </span>
  </span>
</h3>

A ranged technique that divides one attack sequence between multiple targets.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage, then split that damage between successful hits. | — |
| **2** | Active | 12 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **1d8 damage**, then split that damage between successful hits. | — |
| **3** | Active | 16 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **3d8 damage**, then split that damage between successful hits. | — |
| **4** | Active | 20 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **5d8 damage**, then split that damage between successful hits. | — |
| **5** | Active | 24 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **6d8 damage**, then split that damage between successful hits. | — |
| **6** | Active | 28 m | — | Instant | Make up to **2 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **8d8 damage**, then split that damage between successful hits. | — |
| **7** | Active | 32 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **8d8 damage**, then split that damage between successful hits. | — |
| **8** | Active | 36 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **9d8 damage**, then split that damage between successful hits. | — |
| **9** | Active | 40 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **11d8 damage**, then split that damage between successful hits. | — |
| **10** | Active | 44 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **13d8 damage**, then split that damage between successful hits. | — |
| **11** | Active | 48 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **14d8 damage**, then split that damage between successful hits. | — |
| **12** | Active | 52 m | — | Instant | Make up to **3 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **16d8 damage**, then split that damage between successful hits. | — |
| **13** | Active | 56 m | — | Instant | Make up to **4 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **16d8 damage**, then split that damage between successful hits. | — |
| **14** | Active | 60 m | — | Instant | Make up to **4 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **17d8 damage**, then split that damage between successful hits. | — |
| **15** | Active | 64 m | — | Instant | Make up to **4 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **19d8 damage**, then split that damage between successful hits. | — |
| **16** | Active | 68 m | — | Instant | Make up to **4 ranged weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage + **21d8 damage**, then split that damage between successful hits. | — |

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
      Declare an ordered target chain before rolling. Every target after the first must be within 4 m of the previous target.<br>
      Make one Attack Roll and compare the same result against each target's Evade in order. The first miss ends the chain.<br>
      Autofire requires no Raises for additional targets.<br>
      Every successful target receives full Weapon Damage, full listed Power damage, full Specials, and applicable offensive buffs.<br>
      Reaction: Evade can turn a hit into a miss and end the chain. Dive for Cover cannot be used.<br><br>
      AUTOFIRE TARGET CAPACITY<br>
      L1–2 → first target + 1 additional target<br>
      L3–4 → first target + 2 additional targets<br>
      L5–6 → first target + 3 additional targets<br>
      L7–8 → first target + 4 additional targets<br>
      L9–10 → first target + 5 additional targets<br>
      L11–12 → first target + 6 additional targets<br>
      L13–14 → first target + 7 additional targets<br>
      L15–16 → first target + 8 additional targets<br>
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

A ranged weapon attack that walks a burst through an ordered line of targets.

---
:
**Requirement:** Ranged Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Autofire up to **2 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage. | — |
| **2** | Active | 12 m | — | Instant | Autofire up to **2 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **1d8 damage**. | — |
| **3** | Active | 16 m | — | Instant | Autofire up to **3 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **1d8 damage**. | — |
| **4** | Active | 20 m | — | Instant | Autofire up to **3 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **2d8 damage**. | — |
| **5** | Active | 24 m | — | Instant | Autofire up to **4 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **2d8 damage**. | — |
| **6** | Active | 28 m | — | Instant | Autofire up to **4 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **4d8 damage**. | — |
| **7** | Active | 32 m | — | Instant | Autofire up to **5 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **4d8 damage**. | — |
| **8** | Active | 36 m | — | Instant | Autofire up to **5 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **5d8 damage**. | — |
| **9** | Active | 40 m | — | Instant | Autofire up to **6 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **5d8 damage**. | — |
| **10** | Active | 44 m | — | Instant | Autofire up to **6 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **6d8 damage**. | — |
| **11** | Active | 48 m | — | Instant | Autofire up to **7 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **6d8 damage**. | — |
| **12** | Active | 52 m | — | Instant | Autofire up to **7 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **8d8 damage**. | — |
| **13** | Active | 56 m | — | Instant | Autofire up to **8 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **8d8 damage**. | — |
| **14** | Active | 60 m | — | Instant | Autofire up to **8 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **9d8 damage**. | — |
| **15** | Active | 64 m | — | Instant | Autofire up to **9 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **9d8 damage**. | — |
| **16** | Active | 68 m | — | Instant | Autofire up to **9 targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes weapon damage + **11d8 damage**. | — |

---
}}
\page
{{pageNumber,auto}}
{{wide
## Targeted Diminishing Specials

**Exorcism(X)** and **Requiem(X)** are separate Diminishing Specials with the same pricing:

- **Exorcism(X):** can be applied only to a creature with the **Fiend** tag.
- **Requiem(X):** can be applied only to a creature with the **Undead** tag.
- **Cost:** **2 × T(X) PP**.
- **Tick:** at the start of the affected creature's Turn, take **X damage**, then reduce X by 1.
- **Stacking:** normal Diminishing stacking.
- **Cleanse:** Yes.
- Their Tick damage ignores Armor unless a rule explicitly says otherwise.

A creature without the required tag cannot receive the Special at all.

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-attack-exorcism-requiem">
  Melee Attack + Exorcism / Requiem
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Exorcism(X) and Requiem(X) each cost 2 × T(X) PP<br>
      Weapon Damage is the baseline delivery and is not priced again<br>
<br>      DESIGN STRUCTURE<br>
      Choose either Exorcism or Requiem when the Power is built. That choice is fixed for that Power.<br>
      Exorcism can be applied only to Fiends. Requiem can be applied only to Undead.<br>
      An invalid creature may still take the attack's Weapon Damage if hit, but it cannot receive the chosen targeted Special.<br>
<br>      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Targeted Special(5) (30) = 30 PP<br>
      L2 → Target 60 PP: Targeted Special(7) (56) = 56 PP<br>
      L3 → Target 90 PP: Targeted Special(9) (90) = 90 PP<br>
      L4 → Target 120 PP: Targeted Special(10) (110) = 110 PP<br>
      L5 → Target 150 PP: Targeted Special(11) (132) = 132 PP<br>
      L6 → Target 180 PP: Targeted Special(12) (156) = 156 PP<br>
      L7 → Target 210 PP: Targeted Special(14) (210) = 210 PP<br>
      L8 → Target 240 PP: Targeted Special(15) (240) = 240 PP<br>
      L9 → Target 270 PP: Targeted Special(15) (240) = 240 PP<br>
      L10 → Target 300 PP: Targeted Special(16) (272) = 272 PP<br>
      L11 → Target 330 PP: Targeted Special(17) (306) = 306 PP<br>
      L12 → Target 360 PP: Targeted Special(18) (342) = 342 PP<br>
      L13 → Target 390 PP: Targeted Special(19) (380) = 380 PP<br>
      L14 → Target 420 PP: Targeted Special(20) (420) = 420 PP<br>
      L15 → Target 450 PP: Targeted Special(20) (420) = 420 PP<br>
      L16 → Target 480 PP: Targeted Special(21) (462) = 462 PP<br>
<br>      NOTES<br>
      These Specials deal ongoing Special damage at Tick and therefore do not create a cheaper direct-damage-dice axis.<br>
      Armor does not reduce their Tick damage unless a rule explicitly says otherwise.
    </span>
  </span>
</h3>

A targeted weapon strike against one supernatural creature type.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **2** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **3** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **4** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **5** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(11)** or **Requiem(11)** |
| **6** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(12)** or **Requiem(12)** |
| **7** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(14)** or **Requiem(14)** |
| **8** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(15)** or **Requiem(15)** |
| **9** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(15)** or **Requiem(15)** |
| **10** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(16)** or **Requiem(16)** |
| **11** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(17)** or **Requiem(17)** |
| **12** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(18)** or **Requiem(18)** |
| **13** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(19)** or **Requiem(19)** |
| **14** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(20)** or **Requiem(20)** |
| **15** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(20)** or **Requiem(20)** |
| **16** | Active | Melee Reach | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(21)** or **Requiem(21)** |

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-attack-exorcism-requiem">
  Ranged Attack + Exorcism / Requiem
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Exorcism(X) and Requiem(X) each cost 2 × T(X) PP<br>
      Weapon Damage is the baseline delivery and is not priced again<br>
      Range progression = +4 m per level; Range cost = +5 PP per +4 m after 8 m<br>
<br>      DESIGN STRUCTURE<br>
      Choose either Exorcism or Requiem when the Power is built. That choice is fixed for that Power.<br>
      Exorcism can be applied only to Fiends. Requiem can be applied only to Undead.<br>
      An invalid creature may still take the attack's Weapon Damage if hit, but it cannot receive the chosen targeted Special.<br>
<br>      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Targeted Special(5) (30) = 30 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Targeted Special(6) (42) = 47 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Targeted Special(8) (72) = 82 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Targeted Special(9) (90) = 105 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Targeted Special(10) (110) = 130 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Targeted Special(11) (132) = 157 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Targeted Special(12) (156) = 186 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Targeted Special(13) (182) = 217 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Targeted Special(14) (210) = 250 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Targeted Special(15) (240) = 285 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Targeted Special(16) (272) = 322 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Targeted Special(16) (272) = 327 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Targeted Special(17) (306) = 366 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Targeted Special(18) (342) = 407 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Targeted Special(19) (380) = 450 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Targeted Special(19) (380) = 455 PP<br>
<br>      NOTES<br>
      These Specials deal ongoing Special damage at Tick and therefore do not create a cheaper direct-damage-dice axis.<br>
      Armor does not reduce their Tick damage unless a rule explicitly says otherwise.
    </span>
  </span>
</h3>

A targeted weapon strike against one supernatural creature type.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **2** | Active | 12 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(6)** or **Requiem(6)** |
| **3** | Active | 16 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(8)** or **Requiem(8)** |
| **4** | Active | 20 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **5** | Active | 24 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **6** | Active | 28 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(11)** or **Requiem(11)** |
| **7** | Active | 32 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(12)** or **Requiem(12)** |
| **8** | Active | 36 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(13)** or **Requiem(13)** |
| **9** | Active | 40 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(14)** or **Requiem(14)** |
| **10** | Active | 44 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(15)** or **Requiem(15)** |
| **11** | Active | 48 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(16)** or **Requiem(16)** |
| **12** | Active | 52 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(16)** or **Requiem(16)** |
| **13** | Active | 56 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(17)** or **Requiem(17)** |
| **14** | Active | 60 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(18)** or **Requiem(18)** |
| **15** | Active | 64 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(19)** or **Requiem(19)** |
| **16** | Active | 68 m | — | Instant | Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special. | **Exorcism(19)** or **Requiem(19)** |

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="melee-aoe-attack-exorcism-requiem">
  Melee AoE Attack + Exorcism / Requiem
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Exorcism(X) and Requiem(X) each cost 2 × T(X) PP<br>
      Weapon Damage is the baseline delivery and is not priced again<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
<br>      DESIGN STRUCTURE<br>
      Choose either Exorcism or Requiem when the Power is built. That choice is fixed for that Power.<br>
      Exorcism can be applied only to Fiends. Requiem can be applied only to Undead.<br>
      An invalid creature may still take the attack's Weapon Damage if hit, but it cannot receive the chosen targeted Special.<br>
      AoE uses one Attack Roll checked separately against each creature's Evade. Every hit receives full Weapon Damage; qualifying targets also receive the full targeted Special. Dive for Cover applies normally.<br>
<br>      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Radius 2 m (20) + Targeted Special(2) (6) = 26 PP<br>
      L2 → Target 60 PP: Radius 2 m (20) + Targeted Special(5) (30) = 50 PP<br>
      L3 → Target 90 PP: Radius 3 m (50) + Targeted Special(5) (30) = 80 PP<br>
      L4 → Target 120 PP: Radius 3 m (50) + Targeted Special(7) (56) = 106 PP<br>
      L5 → Target 150 PP: Radius 4 m (80) + Targeted Special(7) (56) = 136 PP<br>
      L6 → Target 180 PP: Radius 4 m (80) + Targeted Special(9) (90) = 170 PP<br>
      L7 → Target 210 PP: Radius 5 m (120) + Targeted Special(9) (90) = 210 PP<br>
      L8 → Target 240 PP: Radius 5 m (120) + Targeted Special(9) (90) = 210 PP<br>
      L9 → Target 270 PP: Radius 6 m (165) + Targeted Special(9) (90) = 255 PP<br>
      L10 → Target 300 PP: Radius 6 m (165) + Targeted Special(10) (110) = 275 PP<br>
      L11 → Target 330 PP: Radius 7 m (220) + Targeted Special(10) (110) = 330 PP<br>
      L12 → Target 360 PP: Radius 7 m (220) + Targeted Special(10) (110) = 330 PP<br>
      L13 → Target 390 PP: Radius 8 m (280) + Targeted Special(10) (110) = 390 PP<br>
      L14 → Target 420 PP: Radius 8 m (280) + Targeted Special(11) (132) = 412 PP<br>
      L15 → Target 450 PP: Radius 8 m (280) + Targeted Special(12) (156) = 436 PP<br>
      L16 → Target 480 PP: Radius 8 m (280) + Targeted Special(13) (182) = 462 PP<br>
<br>      NOTES<br>
      These Specials deal ongoing Special damage at Tick and therefore do not create a cheaper direct-damage-dice axis.<br>
      Armor does not reduce their Tick damage unless a rule explicitly says otherwise.
    </span>
  </span>
</h3>

A targeted area attack against one supernatural creature type.

---
:
**Requirement:** Melee Weapon or Unarmed

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | Self | Radius 2 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(2)** or **Requiem(2)** |
| **2** | Active | Self | Radius 2 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **3** | Active | Self | Radius 3 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **4** | Active | Self | Radius 3 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **5** | Active | Self | Radius 4 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **6** | Active | Self | Radius 4 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **7** | Active | Self | Radius 5 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **8** | Active | Self | Radius 5 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **9** | Active | Self | Radius 6 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **10** | Active | Self | Radius 6 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **11** | Active | Self | Radius 7 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **12** | Active | Self | Radius 7 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **13** | Active | Self | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |
| **14** | Active | Self | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(11)** or **Requiem(11)** |
| **15** | Active | Self | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(12)** or **Requiem(12)** |
| **16** | Active | Self | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(13)** or **Requiem(13)** |

---
}}
\page
{{pageNumber,auto}}
{{wide
<h3 id="ranged-aoe-attack-exorcism-requiem">
  Ranged AoE Attack + Exorcism / Requiem
  <span class="tooltip">🛈
    <span class="tooltiptext">
      BASELINES<br>
      Active curve = 30 PP per level<br>
      Exorcism(X) and Requiem(X) each cost 2 × T(X) PP<br>
      Weapon Damage is the baseline delivery and is not priced again<br>
      Range progression = +4 m per level; Range cost = +5 PP per +4 m after 8 m<br>
      Instant Attack AoE costs: Radius 1/2/3/4/5/6/7/8 m = 0/20/50/80/120/165/220/280 PP<br>
<br>      DESIGN STRUCTURE<br>
      Choose either Exorcism or Requiem when the Power is built. That choice is fixed for that Power.<br>
      Exorcism can be applied only to Fiends. Requiem can be applied only to Undead.<br>
      An invalid creature may still take the attack's Weapon Damage if hit, but it cannot receive the chosen targeted Special.<br>
      AoE uses one Attack Roll checked separately against each creature's Evade. Every hit receives full Weapon Damage; qualifying targets also receive the full targeted Special. Dive for Cover applies normally.<br>
<br>      LEVEL-BY-LEVEL CALCULATION<br>
      L1 → Target 30 PP: Range 8 m (0) + Radius 2 m (20) + Targeted Special(2) (6) = 26 PP<br>
      L2 → Target 60 PP: Range 12 m (5) + Radius 2 m (20) + Targeted Special(5) (30) = 55 PP<br>
      L3 → Target 90 PP: Range 16 m (10) + Radius 3 m (50) + Targeted Special(5) (30) = 90 PP<br>
      L4 → Target 120 PP: Range 20 m (15) + Radius 3 m (50) + Targeted Special(6) (42) = 107 PP<br>
      L5 → Target 150 PP: Range 24 m (20) + Radius 4 m (80) + Targeted Special(6) (42) = 142 PP<br>
      L6 → Target 180 PP: Range 28 m (25) + Radius 4 m (80) + Targeted Special(7) (56) = 161 PP<br>
      L7 → Target 210 PP: Range 32 m (30) + Radius 5 m (120) + Targeted Special(7) (56) = 206 PP<br>
      L8 → Target 240 PP: Range 36 m (35) + Radius 5 m (120) + Targeted Special(7) (56) = 211 PP<br>
      L9 → Target 270 PP: Range 40 m (40) + Radius 6 m (165) + Targeted Special(7) (56) = 261 PP<br>
      L10 → Target 300 PP: Range 44 m (45) + Radius 6 m (165) + Targeted Special(7) (56) = 266 PP<br>
      L11 → Target 330 PP: Range 48 m (50) + Radius 7 m (220) + Targeted Special(7) (56) = 326 PP<br>
      L12 → Target 360 PP: Range 52 m (55) + Radius 7 m (220) + Targeted Special(8) (72) = 347 PP<br>
      L13 → Target 390 PP: Range 56 m (60) + Radius 7 m (220) + Targeted Special(8) (72) = 352 PP<br>
      L14 → Target 420 PP: Range 60 m (65) + Radius 8 m (280) + Targeted Special(8) (72) = 417 PP<br>
      L15 → Target 450 PP: Range 64 m (70) + Radius 8 m (280) + Targeted Special(9) (90) = 440 PP<br>
      L16 → Target 480 PP: Range 68 m (75) + Radius 8 m (280) + Targeted Special(10) (110) = 465 PP<br>
<br>      NOTES<br>
      These Specials deal ongoing Special damage at Tick and therefore do not create a cheaper direct-damage-dice axis.<br>
      Armor does not reduce their Tick damage unless a rule explicitly says otherwise.
    </span>
  </span>
</h3>

A targeted area attack against one supernatural creature type.

---
:
**Requirement:** Ranged Weapon or Thrown Weapon

---
:
| **Level** | **Type** | **Range** | **AoE** | **Duration** | **Effect** | **Special** |
|:--:|:--|:--:|:--:|:--:|:--|:--|
| **1** | Active | 8 m | Radius 2 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(2)** or **Requiem(2)** |
| **2** | Active | 12 m | Radius 2 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **3** | Active | 16 m | Radius 3 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(5)** or **Requiem(5)** |
| **4** | Active | 20 m | Radius 3 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(6)** or **Requiem(6)** |
| **5** | Active | 24 m | Radius 4 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(6)** or **Requiem(6)** |
| **6** | Active | 28 m | Radius 4 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **7** | Active | 32 m | Radius 5 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **8** | Active | 36 m | Radius 5 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **9** | Active | 40 m | Radius 6 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **10** | Active | 44 m | Radius 6 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **11** | Active | 48 m | Radius 7 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(7)** or **Requiem(7)** |
| **12** | Active | 52 m | Radius 7 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(8)** or **Requiem(8)** |
| **13** | Active | 56 m | Radius 7 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(8)** or **Requiem(8)** |
| **14** | Active | 60 m | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(8)** or **Requiem(8)** |
| **15** | Active | 64 m | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(9)** or **Requiem(9)** |
| **16** | Active | 68 m | Radius 8 m | Instant | Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special. | **Exorcism(10)** or **Requiem(10)** |

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

Mental Attack, Mind Illusion, Mind Probe, and Mental Control are resolved like Spells against a fixed TN increased by **+4**.

Determine the normal fixed TN for the Power's level, then add **+4**.

The user rolls the Mental Power against that TN.

If the roll fails, the Mental Power fizzles and has no effect.

If the roll succeeds, the Mental Power's listed effect resolves.

The target does not make an automatic second roll.

A later Intellect or Wits Attribute Check occurs only if the Power explicitly grants a disbelief, break, or intrusion response.

---

}}


\page
{{pageNumber,auto}}
{{wide
## Mental Attack

Mental Attack Powers harm the mind directly.

Mental Attacks require Telepathic Access unless the Power explicitly says otherwise.

Mental Attacks are resolved like Spells against a fixed TN.

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
      Resolved like a Spell against fixed TN<br>
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

Mind Illusions are resolved like Spells against a fixed TN.

If the Power roll fails, the illusion fizzles and has no effect.

If the Power roll succeeds, the listed illusion applies. There is no automatic resistance roll for every affected creature.

Mind Illusions do not create real objects, creatures, walls, sounds, terrain, light, darkness, or battlefield effects.

A Mind Illusion only exists for the affected creature.

Other creatures do not perceive the illusion unless they are also affected by the same Power.

Mind Illusions cannot directly force a creature to harm itself.

Mind Illusions cannot control a creature's actions.

Mind Illusions may cause the affected creature to perceive something false, but the creature still chooses its own actions based on that perception.

Mind Illusions cannot create real cover, real terrain, real summons, real barriers, or real line-of-sight blockers.

If a creature spends an Action to inspect the Mind Illusion, physically interacts with something it cannot support, or receives clear contradictory evidence, it may make a **Wits Attribute Check** against the Mental Power TN. A specifically analytical or memory-based Power may name **Intellect** instead. On a success, the illusion ends for that creature.
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
      Resolved like a Spell against fixed TN<br>
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

Mind Probe is resolved as a Mental Power against the fixed TN increased by **+4**.

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
      Resolved like a Spell against fixed TN +4<br><br>
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
| **8** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last week. |
| **9** | Active, Mental | Telepathic Access | 1 creature | Instant | Read one named memory from approximately the last month. |
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

Mental Control is resolved as a Mental Power against the fixed TN increased by **+4**.

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
      Resolved like a Spell against fixed TN +4<br><br>

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
| **1** | Active, Mental, Noncombat | 1 creature | 1 minute | Impose one immediate, simple, non-harmful instruction. |
| **2** | Active, Mental, Noncombat | 1 creature | 10 minutes | Impose one simple task that can be completed without complex judgment. |
| **3** | Active, Mental, Noncombat | 1 creature | 1 hour | Impose one simple task with several obvious steps. |
| **4** | Active, Mental, Noncombat | 1 creature | 4 hours | Impose one clear command or one temporary attitude toward a person, place, or object. |
| **5** | Active, Mental, Noncombat | 2 creatures | 4 hours | Give both targets the same simple task or attitude. |
| **6** | Active, Mental, Noncombat | 2 creatures | 8 hours | Impose one sustained role, routine, or pattern of cooperation. |
| **7** | Active, Mental, Noncombat | 2 creatures | 12 hours | Impose two linked instructions or one simple conditional instruction. |
| **8** | Active, Mental, Noncombat | 3 creatures | 1 day | Impose one believable temporary relationship, loyalty, aversion, trust, affection, or false assumption. |
| **9** | Active, Mental, Noncombat | 3 creatures | 1 day | Impose one complex noncombat objective and allow reasonable improvisation toward it. |
| **10** | Active, Mental, Noncombat | MR creatures | 2 days | Give all targets the same complex task, attitude, or temporary relationship. |
| **11** | Active, Mental, Noncombat | MR creatures | 3 days | Impose one conditional behavioral program with a clear trigger and response. |
| **12** | Active, Mental, Noncombat | MR + 1 creatures | 3 days | Combine one complex task with one supporting attitude or belief. |
| **13** | Active, Mental, Noncombat | MR + 1 creatures | 1 week | Impose one sustained false loyalty, relationship, social role, or long-form objective. |
| **14** | Active, Mental, Noncombat | MR + 2 creatures | 1 week | Impose several linked instructions serving one defined noncombat purpose. |
| **15** | Active, Mental, Noncombat | MR + 3 creatures | 2 weeks | Impose a broad behavioral program around one defined noncombat purpose. |
| **16** | Active, Mental, Noncombat | MR + 4 creatures | 1 month | Impose complex noncombat control around one defined purpose, including linked instructions, attitudes, and conditional behavior. |

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

A target receives a **Wits Attribute Check** against the original Mental Power TN only when the control directly collides with a defining conviction, a deeply held bond, or clear evidence that obedience would cause severe harm to someone it is committed to protect. On a success, the control ends. This is a later break opportunity, not an automatic resistance roll when the Power is applied.

Mental Control can make a target speak or cooperate, but it does not guarantee complete or objectively truthful information. Use Mind Probe to search thoughts and memories directly.

---

### Excluded Mental Conditions and Power Locks

**Frightened**, **Charmed**, and **Confused** are not separate core Specials or Power families. Their noncombat narrative functions are handled through Mental Control; false perception is handled through Mind Illusion; general combat impairment is handled through existing Specials such as Disoriented, Weaken, or Soulburn.

**Silence**, **Null Field**, and **Power Lock** are not standard player Powers or core Specials. A specific adventure, location, Artifact, monster, or narrative effect may prohibit a named Power, Special, or Power tag, but it must write that exception explicitly.

}}
