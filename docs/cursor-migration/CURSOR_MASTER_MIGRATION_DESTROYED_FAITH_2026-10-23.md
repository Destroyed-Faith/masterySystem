# CURSOR MASTER TASK — DESTROYED FAITH / MASTERY SYSTEM
## Complete Foundry VTT + Character Builder Migration to the Consolidated Player's Guide

**Mode:** Agent / multi-file implementation, not a design discussion.  
**Language:** Preserve the repository's existing code style and UI locales; explain the final report in German.  
**Priority:** Correct rules and saved character data first; visual polish second.  
**Scope:** Entire current codebase: Foundry actors/items/sheets, rolls, Powers, Stones, character builders (Quick and Guided), ritual and Imprint interactions, summon management, imports/exports, migrations, compendiums, tests, help text, tooltips, localization, and any live UI that implements old rules.

**REQUIRED SOURCE FILE:** `Destroyed_Faith_Players_Guide_Editorial_Condensed_2026-10-23.md`, included alongside this master prompt in the package. Place both in the workspace and locate them before making changes. This consolidated Homebrewery Markdown is the **single authoritative rules specification** for this migration. Read the relevant full sections, including tables and examples. Do not use the outdated `Destroyed_Faith_Skills_Rework_2026-10-22.txt`, an earlier exported rulebook, or the older Skill-Rework Cursor prompt. They embody incompatible abandoned designs. The separate `Guided Character Builder.txt`, if present, is useful **only for UX ideas**, not as a source of mechanics or old skill package data.

**MISSION:** Implement the new rules end-to-end, using the existing repository architecture rather than inventing an incompatible application. Discover real paths, source-of-truth data shapes, Foundry version, existing settings, import/export schema and tests. Plan the changes, make them, migrate safely, verify them, and present a precise completion report. Never stop after updating labels or a wizard screen while leaving old roll calculations or persisted data active. Do not change the canonical rules in order to make implementation easier.

---

# 0. MANDATORY INITIAL REPOSITORY INVENTORY

Before editing, do all of the following:

1. Identify whether this repo contains a Foundry **system**, a **module**, a stand-alone web character builder, or multiple packages. Read their real manifests (`system.json`, `module.json`, `package.json`, build configs), README, tests, generators, source compendiums, and schemas.
2. Locate all PC and NPC actor definitions, data model classes, item types, roll engine helpers, combat/chat card code, sheets, forms, Guided/Quick builders, validation rules, actor creation, leveling, imports/exports, migration/version logic, localization dictionaries, rest handlers, power catalogs, summon logic and artifact logic.
3. Search the **entire** workspace, including generated assets and compendium source JSON, for old terminology and patterns: `skillPoints`, `skillPool`, `skillReserve`, `skillRating`, `rating >= 2*MR`, `half attribute`, `socialCombat`, `setupPool`, `echoCards`, `echoDeck`, `echoRoll`, `minorExpressions`, `expressionRank`, `DeathCheck`, `DeathMark`, `dying`, `Attunement Ritual`, `Passive Skill Value`, `retroactive Stealth`, `Challenge MR`, `Pursuit Progress`, old Spell TN formula, all pre-rework fixed-skill IDs, and obsolete GUI counters. Use case-insensitive and semantic searches, not just exact strings.
4. Create a working file `docs/migrations/DF_2026_RULES_MIGRATION_PLAN.md` containing an inventory table: **feature → current files/components → required change → migration risk → tests → status**. Add a known-legacy data mapping table and record the actual source file paths. Do not assume `src/`, `templates/`, or any other directory exists until inspected.
5. Record a reversible baseline: branch or checkpoint, test baseline, build status, dependency versions and known existing failures. Do not silently update dependencies or Foundry major versions.
6. Use the authoritative guide to settle rule questions. If code or old docs disagree, follow the new guide. If the guide truly leaves a rule unspecified, do not fabricate mechanics: record the exact unresolved decision, implement the safe existing behavior where possible and keep the feature clearly flagged.

After inventory, **continue into implementation**. Do not stop with a plan-only answer.

---

# 1. CANONICAL RULES — NON-NEGOTIABLE CONTRACT

## 1.1 Universal dice and progression

- Ordinary check/attack/casting pools use the relevant **Attribute** as number of exploding d8 and **Mastery Rank** as Keep, `Attribute k MR`, unless a documented special mechanic says otherwise. Keep never exceeds dice rolled. Attributes may progress to 40. The standard starting MR is **2**.
- Keep existing explosion/Advantage/Disadvantage semantics from the guide. **Untrained Skill Disadvantage restricts exploding dice; it does not halve the Attribute pool.** Reroll Points are still universal and governed by Disadvantages; do not create per-Skill resource pools.
- All **normal Pool reductions** protect a floor of **two rolled dice**, assuming the original pool had at least two. The floor does NOT create `2k2`: e.g. Fear is `Resolve k1`, and Keep remains 1. Do not give two replacement dice to abilities that voluntarily consume/trade dice; do not negate legal full Parry cancellations or similarly explicit exceptions.
- Every character begins with **2 permanent Attribute Stones**. Permanent Stone progression grants **+1 per 20 Lifetime XP**, and MR progression follows its specific Lifetime XP milestones; spending banked XP must not reverse MR or Stones. Stones are independent of Attribute scores. Starting Stones are not Colorless; post-creation earned Stones may be permanent Colorless at 1:1 as the guide defines. MR-based per-Attribute Stone caps must be enforced; permanent Colorless follow their own uncapped rule.
- Core MR milestones: MR2 at 0, MR3 at 100 Lifetime XP, MR4 at 200, MR5 at 400, MR6 at 600, MR7 at 800, MR8 at 1000. Use the guide for progression after those milestones and 2200-XP ceiling. Never recompute MR from currently spent/banked XP.
- Preserve canonical Stone Abilities, Colorless conversion, action economy, Artifact Capacity, equipment slots, Artifact Levels, Specials, Power profiles, Reaction limits, technical references and source-specific exceptions. **Mark and Sundered both remain valid and separate Specials.** Limited Powers, Minor Magic Items, Fear, and existing Stones are intentionally retained.

## 1.2 Completely new Specialization / Skill model

**Delete the old fixed purchasable Skill catalog from player rules.** No 14-Skill replacement; no 31-Skill replacement. Skills are **free-named Specializations** organized into seven Fields:

1. `Physical` — e.g. Climbing, Swimming.
2. `Finesse` — e.g. Stealth, Sleight of Hand.
3. `Survival` — e.g. Tracking, Animal Handling.
4. `Science & Craft` — e.g. Medicine, Alchemy, Blacksmithing.
5. `Occult` — e.g. Demonology, Warding Traditions.
6. `Social` — e.g. Persuasion, Deception.
7. `Investigation` — e.g. Forensics, Streetwise.

These are **organizational Fields, not seven mechanically purchased generic skills, not fixed Attributes and not spendable resources**. A player defines a concrete name, a Field, a one-sentence scope and a Rank. Examples are suggestions, not a closed list. Enforce sensible breadth through GM approval/validation; prevent name-only duplicates and catch suspicious overlaps without forbidding valid custom professions. Do not convert the examples into mandatory choices.

- Skill Rank **0–8**, with Rank 0 untrained and purchased Rank 1–8. A Skill Rank provides (a) learned expertise/eligible procedures and (b) permitted declared Raises; it **never** supplies bonus d8, a different Keep value or an automatically added fixed bonus.
- **Check:** relevant Attribute Pool `k MR`, choose Attribute from the described method, not a fixed per-Skill primary Attribute. **Base Task TN = Task Level × 4**, determined by task/conditions, not player MR. Skill Rank and Task Level are different concepts. Ordinary levels: 1=4; 2=8; 3=12; 4=16; 5=20; 6=24; 7=28; 8=32.
- Trained player: full relevant Attribute Pool, normal exploding d8/health/Fear modifiers. Untrained player: **also full Attribute Pool** but **Disadvantage** and **zero** Skill Raises. Professional expertise gates what tasks can realistically be attempted; a huge Attribute score does not create missing professional knowledge.
- Six universal Skill Raise effects: `Scope`, `Speed`, `Quality`, `Efficiency`, `Insight`, `Safety`. Declare total number AND allocation and the intended concrete effect **before** the roll. GM checks legal scope. **Only Paid Raises add +4 to TN; Free Raises add 0.** On meeting one final TN, the base action and all declared effects succeed. On missing it, do not automatically award base or Raise tiers merely because the raw total crossed a lower number. No post-roll undeclared Raise spending. Do not confuse with Stone Ability: Intellect Raises, which is an independent resource-driven mechanic governed by its own rules.
- **Rank allowance table (exact):**

| Rank | Max Paid | Max Free | Max total |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 1 | 1 | 0 | 1 |
| 2 | 2 | 0 | 2 |
| 3 | 3 | 0 | 3 |
| 4 | 3 | 1 | 4 |
| 5 | 4 | 1 | 5 |
| 6 | 4 | 2 | 6 |
| 7 | 5 | 2 | 7 |
| 8 | 5 | 3 | 8 |

Implement this as one canonical helper, e.g. `getSkillRaiseAllowance(rank)`, and call it from all relevant roll dialogs and calculations. The table does **not** mean a player at Rank 4 gets four Free Raises: exactly one is Free.
- Example assertion: Blacksmithing Rank 4, nails Task Level 2 / Base TN 8, `Scope 2 + Speed 1` → 3 total Raises, one Free, two Paid, **final TN 16**. Same three declared effects at Rank 3 → three Paid, **TN 20**.
- **Passive Skill Value = 2 × relevant Attribute is retained** for calm, eligible, safe, uncontested tasks. Routine professional work within learned expertise also succeeds naturally under the guide's conditions. Passive success uses the **full final TN**, with Paid Raises counted, and never supplies undisclosed additional effects. Require an actual roll where conditions are dangerous, actively opposed, pressured or otherwise ineligible. Do not delete Passive Skill Values (a very old prompt once incorrectly requested this).
- **Perception is universal, not purchasable:** Wits for immediate sensory awareness; Intellect for visible patterns/inference; Resolve for spiritual pressure (subject to actual senses). Roll normal Attribute k MR, no Skill Ranks or Skill Raises and **no untrained Disadvantage**. Keep Combat Senses integration intact.

## 1.3 Starting and advancing Specializations

- Starting player chooses **exactly five distinct Specializations**, **Rank 2 each**, from any legitimate Fields. The creation budget is **20 Skill Creation Points**, at **2 Creation Points per Rank**, totaling **10 starting Ranks**. This means precisely five Rank-2 entries; do **not** give 20 Ranks. Creation Points exist only in the creation flow, are not consumable gameplay points, are not replenished on rest, and are NOT XP. Display this clearly in Quick and Guided builders.
- Later: learning a new Specialization Rank 1 costs **4 XP**, upgrading an existing Specialization by one Rank costs **4 XP**, maximum Rank 8, at most one Rank increase for that Specialization per legal Upgrade Step. Never force a rigid closed Skill dropdown.
- Validate normalized `name + Field + scope` identity as suitable for the actual repo model; preserve display spelling. Store Rank in 1–8 and freeform scope. Do not assume old `skill.id/rating` fields can be reused unchanged.
- Updated example character Alaris has `Stealth 2`, `Tracking 2`, `Acrobatics 2`, `Streetwise 2`, `Medicine 2` with their respective Fields.

## 1.4 Skill Opposition / Stealth / Invisibility

- **Create first, contest second.** Actor making disguise, Stealth, forged evidence, hidden track, etc. first rolls a Skill Check against the task's **own final TN** (Paid/Free effects declared first). If the setup fails, the concealment/deception is not established. Observers do not gain magical remote knowledge from that fact.
- If setup succeeds, the **actual final rolled result** becomes an opposing TN. Observers within a relevant sensory position roll suitable Perception/Investigation/Tracking etc. against this TN. One unchanged setup roll persists for all eligible observers; do not reroll the setup separately for each NPC.
- **Delete all retroactive Stealth Point spending and after-the-fact TN boosting.** No Skill Points exist. Roll/UI must not offer them. Keep Invisibility, Combat Senses, Cover, and detection restrictions otherwise consistent with the guide.
- Direct physically or mentally opposed capability checks follow **Opposed Attribute Contests**; participants roll normal Attribute k own MR, compare results, ties preserve status quo, **no Skill Raises**. Do not mistakenly run every social debate as a Skill Opposition if the guide defines a direct Attribute Contest.
- NPCs without full character-style Attributes still ROLL situational pools. The guide's competent/specialist examples include **MR1 3k1/4k1, MR2 6k2/8k2, MR3 10k3/12k3**. Preserve existing explicitly recorded NPC stats; these are reference baselines, not forced retroactive NPC rebuilds. Do not blindly extrapolate high MR values.

## 1.5 Social Challenges replace Social Combat

- Completely remove the old `Social Combat` mechanics: required multiple phases, Setup Pool, four/eight-Raise success thresholds, lead-actor +MR bonuses, special social Raise economy, Echo-Card social actions, state trackers and dialog controls.
- `Social Challenges` are optional narrative guidance for **one or more ordinary Skill Checks / Skill Oppositions**. Real discoveries, concessions, and situational changes affect later available actions. The GM decides whether a scene needs multiple meaningful checks, never mandatory phases or an abstract progress pool.
- Implement examples based on **Persuasion 4** negotiating passage with a captain (Base TN 16, Quality 1 Free Raise → TN 16 if no other Paid Raises), negotiating troop support with a prince via linked Investigation/Etiquette/Persuasion, and Deception vs. Investigation for a disguised courier (setup first).
- No social coercion/mind control is implied by a high roll. Boundaries derive from the target's interests and available options; don't build hardcoded attitude-control tables without a printed source.

## 1.6 Power / Spell Casting overhaul

- Martial and Spell delivery share the underlying legal Power effects, but their defenses and roll procedures differ as the guide states. Preserve catalogue-defined Damage, Specials, Technical References, once-per-Round Power Use Limit and action types.
- **Spell Base TN = actually used casting Power Level × 4.** Caster MR sets Keep and legal learned-Power PL cap, not Spell Base TN. Sample PL2→8, PL4→16, PL6→24, PL10→40, PL16→64.
- Choose and record the caster's Casting Attribute for each Spell at design time: Intellect, Resolve or Influence. Spell casting uses that Attribute k MR, never Evade defense; **Spell Resistance 0** unless an explicit source grants it. SR is rare.
- Target's effective SR = max(0, printed SR minus legally applicable SR Piercing). Printed `Passive: Spell Resistance Piercing` is `ceil(Passive PL / 2)` where eligible. Per target: **Final Spell TN = used PL × 4 + effective SR + 4 × declared Paid Combat Raises**. No Damage or Specials for a target that fails this final resistance threshold. For AoE use one Casting Roll; evaluate each creature's SR independently.
- When a Spell is attempted while threatened within enemy Melee Reach at declaration, apply the guide's **Disadvantage**. It does not modify Healing Dice, Base TN or legality.
- **Placed / persistent effects:** declaration includes chosen casting PL, Raise allocation and number of Paid Raises. `Creation TN = used PL×4 + Paid Raises×4`; if the roll misses Creation TN, the placed zone is **not created**. Persist chosen PL, original roll total, paid count and fixed allocation; on later applications recalculate each target's current SR and compare against stored roll and final target threshold. Respect zone application frequency and durations; no rerolls on each tick.
- **Downcasting:** only to a legal **complete existing lower-PL profile** (Damage, Specials, range, area, duration, targets, limits). Select used PL before rolling; never just lower the TN and keep the high-PL effects. If lower-level profile absent, do not invent one: default to purchased printed PL.
- Willing recipients may choose SR0 before the casting roll. Separate creator/target effects as the guide instructs.
- **All Combat Raises: announce both count and allocation to Damage/Specials BEFORE the Attack/Casting Roll**. Do not allow post-roll rearrangement, including Split Attack, Autofire, Intellect Stone Raise allocations and persistent zones. Preserve distinction between ordinary Paid Combat Raises and the Intellect Stone Ability `Raises` (separate rule; can grant preassigned no-TN-cost Raises). Never turn free Skill Raises into global Combat Raises.
- **Power Level cap = MR×2** for powers independently purchased/leveled. Standard creation exceptions apply as printed. **Fixed Artifact-/Echo-Artifact-granted Powers may exceed that cap** when legally unlocked by Artifact Level; use printed Power profile and printed PL for casting TN. Retain MR-based Artifact Level caps.
- **Minor Magic Items** retain their own behavior: stored PL/profile fixed when created, independently triggered prepared Traps, explicit exception to normal Power Use Limit. Do not weaken or remove them as part of cleanup.
- **Limited Powers** remain intact with their prescribed usage/resource behavior. Do not remove a resource counter because it looks like an old Skill Pool. Similarly preserve legal Stone pools, Artifact batteries, healing pools, and Summon Tokens.

## 1.7 Combat, Specials and defenses

- Keep existing Armor, Evade, Damage Reduction, Phasing, Actions, Reactions, Movement, Attack, Initiative, Damage, Advantage/Disadvantage, Health penalty, Fear, and all Specials as defined by the guide. This is a targeted migration, not a replacement combat engine.
- **Mark and Sundered BOTH remain** and do different things. Never remove or alias one to the other. **Vulnerability may choose Sundered** where its legal list is presented; preserve the exact other eligible Specials as printed.
- When an attack/spell misses a target's final required TN, **no Damage and no on-hit Specials** apply to that target. Avoid creation of statuses from a missed casting because only the Spell Base TN was met.
- **Pursuit** no longer uses a -2..+2 progress meter. Flee retains its distinct Movement+Attack Action cost, `4×Speed` movement and limitations. Afterwards, use actual Speed, movement mode, obstacles, positional facts and one relevant Skill Opposition or Opposed Attribute Contest when uncertain; additional rolls only if a genuinely new obstacle/tactic arises.
- **Fear:** fixed `Resolve k1` bands: 0–7 gives +2 Fear, 8–15 gives +1, 16+ gives 0. Fear removes one die from Attribute Pools per Fear; it affects later Fear Checks intentionally, limited by the general protected **two rolled dice** minimum. Fear clears at Safe Haven Rest, not after every fight. Do NOT 'fix' the intentional Fear spiral. Preserve allowed special exceptions and written timing.

## 1.8 Health, Incapacitated and Recovery

- When all available Health Bars are **Scarred**, the character becomes **Incapacitated**: cannot act, spend Stones, activate new abilities or independently return to combat. Incapacitated by itself is **not automatic death**. **No Death Saves, Death Checks, Death Marks, negative HP counter or automatic death timer.** Death is a fiction-driven GM event and reincarnation mechanics are reserved for the future Game Master's Guide; do not invent them in this migration.
- Resolve Stone Healing / normal positive HP recovery **cannot reopen a Scarred Health Bar** or awaken a fully Incapacitated creature. Legal external **Restoration** can restore a Scarred Bar at full HP and wake the creature; other explicitly legal scar recovery follows its printed rules.
- **Emergency Medicine** uses task TN **patient MR×4**, costs **1 Attack Action** under combat pressure, and on success **stabilizes** rather than restoring HP or waking the patient. Declared Free Skill Raises from Medicine 4/6/8 must not add TN; only Paid ones do. Do not confuse Emergency Medicine with ordinary Medicine Task Levels.
- Safe Haven Rest normally recovers **1 Scarred Bar**; qualified **Medicine Rank 4–7** aftercare adds **+1** extra, **Medicine Rank 8** adds **+2** extra, for **one cared-for patient** per qualifying healer per rest. Nonstacking same-patient aftercare. These are delayed natural recovery, not combat Healing.
- Incapacitated targets may be rescued, captured or suffer plausible further injuries. No generic extra damage-to-death counter. Keep other listed Rest/Recovery timings and resource resets.

## 1.9 Echo Imprints replace Minor Expressions and Echo Cards

**Completely remove Echo Cards / Echo Decks from live play, builder, sheets and character progression.** Preserve Echo ancestry/species and Echo Artifacts. The thematic idea of past-life memories lives in Echo Imprints instead.

**Replace the old 36 Minor Expressions with EXACTLY 28 Echo Imprints** (four per Attribute). Imprints are minor roleplay/exploration supernatural effects, not purchasable Powers, spells, combat actions, Skill bonuses, Stone abilities or ritual substitutes. Character may select **up to MR total**, each linked Attribute **4+**; two at start for an ordinary MR2 character. Selection and activation cost **zero Stones, zero XP, zero Reroll Points and no charges**. On qualifying Attribute milestones, upgrade the selected Imprint automatically: tier **4** at Attribute 4–7, **8** at 8–11, **12** at 12–15, **16** at 16–19, **20** at 20–40. No tier above 20.

The **exact canonical 28 IDs/names** must be taken from the book, grouped as follows:

| Attribute | Four Echo Imprints |
|---|---|
| Might | Anchor Touch; Burden's Mercy; Stoneprint; Hollow Echo |
| Agility | Feather Step; Catfall; Dancing Thread; Needle Balance |
| Vitality | Living Warmth; Seed Whisper; Pulse Touch; Preserve |
| Intellect | Mage Hand; Message; Arcane Spark; Fleeting Conjuration |
| Resolve | Still Mind; Sense Taint; Echo Whisper; Oath Ember |
| Influence | Glamour; Mirror Shade; Borrowed Voice; Emotional Hue |
| Wits | Ghost Sound; Waymark; Second Glance; Lucky Flicker |

**DO NOT implement from names alone.** Extract each entry's actual effect, five tier texts/constraints and GM Echo Memory snippet from the authoritative `.md`. Store structured definition data separate from actor selections. An actor stores stable IDs, not duplicated mutable catalogue descriptions. Upgrade display derives tier from current Attribute. Invalid selections (attribute too low, duplicates, >MR) must be shown and resolved transparently, not silently erased.

**GM Echo Memory:** Each normal Imprint use should be accompanied by a brief optionalized narrative snippet conveying a fragment of a former life; the UI can expose a one-click use/chat card with GM example, an edit/customize field and a private/public presentation appropriate to Foundry. Avoid long unskippable dialogs and avoid inventing deterministic lore. Favor a sentence, optionally reusing motifs. **Hollow Echo** may suggest where to search; it does not auto-reveal a hidden door or replace Investigation. Catfall does not negate dangerous falls. Preserve per-entry minor supernatural boundaries without giving combat bonuses.

**Keep Schticks separately:** one cosmetic Schtick per MR; they grant no mechanics and are not Echo Imprints. Do not convert Schticks into Imprints or vice versa.

## 1.10 Ritual overhaul — complete toolkit, universally accessible

- Every character automatically has access to **ALL SIXTEEN** core Rituals at creation and later. No Ritual purchase, unlock tree, trainer, teacher, tome requirement, XP or separate Ritual Skill. An actor may keep favorites for UI, but availability is universal.
- One Ritual is **one Tyhran Hour** (two Forearms, approximately 59 Earth minutes), normally reduced to **one Forearm** with one permitted `Speed` Raise. Noncombat, deliberate magic. Keep all existing specific special timing rules and unique effects.
- Any plausible Skill Field / method / Attribute can serve as the ritual approach. The player describes HOW. A purchased Specialization is **optional**; if relevant to the described method, it grants its Rank-based **Free Raises** at 4/6/8. Without a relevant Specialization, ritual attempt is allowed and all Raises are Paid; there is NO automatic untrained Disadvantage solely for Ritual access.
- **Base Ritual TN = 4 × max(3, relevant Task Level)**, minimum **12**. For appropriately rated Powers, Artifact Levels, source MR, supernatural complexity, etc., use the exact printed source-level method; do not use the caster's MR. Named tier 0–4 and optional general Raise effects chosen **before the roll**. Limit **8 total Raises** (Paid + Free), independent of caster Skill Rank. 1–3 Sealed Stones cost according to **total** Raises: 0–1 → 1; 2–3 → 2; 4–8 → 3. Sealed on payment, also on failure, replenished per normal rule.
- **Final Ritual TN = Base Ritual TN + 4×Paid Raises**. One final check, no automatic partial named tier on failure. Free Skill Raises count toward selected named tier and total Stone costs but not TN. Higher tier can incorporate lower tiers where printed, with **Seal Passage Raise 4 as an explicit alternative opening mode** rather than also sealing the door.
- Normal **Passive Skill Value = 2×relevant Attribute** can pass a familiar, safe, uncontested ritual only when it meets the **entire final TN**. Still pay Sealed Stones and time. Routine professional auto-completion does NOT automatically cast rituals.
- 16 exact Rituals; migrate into structured catalogue records containing description, named tier 0..4, legal effects, limits, time and Source/Task TN rules:
  1. Read Resonance
  2. Locate Object
  3. Clairvoyance
  4. Threshold Alarm
  5. Seal Passage
  6. Purify Ground
  7. Learn Artifact
  8. Forgotten Memory
  9. Word of Recall
  10. Dreamwalk
  11. Last Light
  12. Augury — Signs of Tomorrow
  13. Circle of Quiet
  14. Binding Oath
  15. Voice of the Wild
  16. Whispers of Lost Tongues
- **No Healing Ritual and no Ancestral Communion.** Binding Oath is voluntary, witnesses objective conditions, causes no mind control or forced penalties. Augury supplies conditional omens, not guaranteed futures. Keep the unique limits of Clairvoyance, Word of Recall, dream/last-light interactions as written.
- Ritual UI: select Ritual, choose narrative approach, select Attribute, optionally choose matching specialization, set task/source level (default task 3 / TN12), select named tier and general Raises, auto-allocate Free vs Paid legally, preview final TN, Sealed Stone costs and time, offer roll or qualified passive success, create chat record. Never use old mandatory Skill Fields, old `(8×MR)-2` Ritual TNs or old half-success/partial-raise rule.

## 1.11 Summons — preserve Bond system, replace player-skill dependency

- Summons remain **Bound Stones / Summon Tokens**: 1 Bound Stone gives **8 Tokens**, independent purchases of Summon Skill Dice, Bodies, Powers and upgrades, owner MR Keep where defined. Do not rework Summon Tokens into a character Skill Pool.
- Summon selected tasks form a **closed list of 10**: Perception; Tracking; Navigation; Weather Sense; Stealth; Concealment; Athletics; Acrobatics; Search; Survival. This is not a closed list for PCs.
- Number of selected Summon tasks by Bound Stones: 1 Stone→2; 2 Stones→3; 3+ Stones→4. Perception requires no owner Specialization. Other tasks require a **learned owner Specialization that genuinely covers the task**; name equality is not required. Example: `Woodland Stalking 3` may qualify woodland Stealth but not urban Stealth.
- 1 Token purchases 2 Summon Skill Dice, distributed among selected tasks. For non-Perception task cap assigned dice at **2×one matching owner's Specialization Rank**; **do not sum multiple ranks**. Perception dice cap = **2×owner MR**. Summon check = assigned Skill Dice k owner's MR (Keep ≤ dice), with **no PC Skill Ranks and no Paid or Free Raises**.
- Shared Senses: owner's full appropriate Perception roll when actively perceiving through a legal sense, otherwise Summon's independently purchased Perception dice. Preserve movement-switch cost, Body scoping and the legal ten-task list. Record the chosen owner mapping and its narrative scope in the Bond, to make it auditable after Skill rename/respec.
- Preserve the Bond Ritual for reconfiguring/releasing Summon Stones. This is NOT the discarded Artifact Attunement Ritual and not necessarily one of the sixteen Core Rituals.

## 1.12 No Death Saves, no Echo Cards, no special social or chase meters

The following are **retired mechanics**. Remove UI, active model state, progression, automated roll links and tooltip instructions; preserve old data only in migration backup:

- Echo Cards, Echo Decks, Echo Rolls, MR-based Echo Card unlocks and card charges.
- Minor Expressions, their former 36-catalogue, Reroll-point selection costs and old activation.
- Fixed purchasable 31-/14-Skill catalogs, Skill Rating growth to 32, `2×MR` trained gate, consumable Skill Pools/Reserve, retroactive Stealth Points.
- The old Social Combat Setup Pool, Lead Actor numeric assistance and prescribed three-phase success thresholds.
- Pursuit score -2..+2 and any chase-specific progress currency.
- Death Checks, Death Marks, Dying counter and automatic death timer.
- Ritual learning prerequisites / access purchases / mandatory named Skill Fields, old MR-based Ritual TN, ritual partial-effect-on-failed-Raises behavior.
- Attribute/MR-based spell-casting TN and default ordinary SR granted without an explicit source.
- Artifact Attunement Ritual for binding ordinary or Echo Artifacts.

Some **words** may validly survive in worldbuilding prose (e.g. social conflict, echoes, marks). Remove obsolete **mechanics**, not meaningful setting language.

---

# 2. CHARACTER BUILDER REWORK — QUICK + GUIDED + EXPORT

Both builder modes MUST produce **the same valid character schema and final rules**. Only UX differs. Reuse one validation service and canonical definition registry; never maintain separate hardcoded rules in each builder.

## 2.1 Standard creation order (authoritative)

1. **Echo / Echo Artifacts first.** Include all eligible Echo choices from the rulebook — **Human, Halfling, Dwarf, Elf, Dragonborn, Titanborn, Sentinel, and Unbound**, with actual printed subtypes/Artifact options. Do not omit Halflings or Unbound subtypes just because old UX notes omit them. Apply Artifact Capacity (normally 4), required/optional Echo Artifacts, equipment slot claims and racial traits before presenting illegal loadouts.
2. **Attributes and Stones:** assign initial Attributes **4,4,3,3,2,2,2**; assign **2 starting Attribute Stones**, may stack on one Attribute within MR capacity. Do not couple Stone placement to Attribute scores. Display Stone colors/abilities and legality accurately.
3. **Echo Imprints immediately after Attributes:** choose at most MR (normally 2), each linked Attribute >=4; show four available for each eligible Attribute, five tier previews, Echo Memory snippets and validation. Do not ask for old Minor Expressions.
4. **Skills/Specializations:** exactly five distinct freely named entries with Field and scope, **Rank 2 each**; show 20 Creation Points = 10 total Ranks, no remaining point spending in play. Permit autocomplete suggestions but allow custom names. Show task/raise tutorial instead of fixed Skill catalog cards.
5. **Powers and Combat Package:** choose **two Active Powers at PL2**; Passives equal available Passive Slots (typically two MR2), **one Reaction** and **one Active Buff at PL4**; obey starting exceptions, legality, source profiles and Echo-slot consequences. Guided Build should help choose a primary Defense (Armor/Evade/Damage Reduction/Phasing), a coherent Passive/Buff/Reaction package, main combat equipment setup, offense, and Movement without implying that these are additional free legal starting Powers unless the guide permits them. Persist correct technical references. Respect Mentalist exceptions from the book.
6. **Languages:** Common Tongue plus one other or required Echo origin language as prescribed.
7. **Schticks:** one non-mechanical narrative signature per MR.
8. **Disadvantages and universal Reroll Points:** follow the book (up to 8 Disadvantage Points), no per-Skill or per-Imprint points.
9. **Finalize:** derived Health Bars, Fear0, Initiative, Defense, equipment, Artifact slots/capacity, Power PL caps/Artifact exemptions, skills, Imprints, source data, biography, full 16-Ritual availability.

Guided Build UX may ask for **provisional** combat-style/Defense preferences immediately after choosing Echo to inform Attribute recommendations, as long as the **committed Attribute selection is followed immediately by Echo Imprints**, and actual mechanical Power choices/validation use the above rules. Quick Build can use the printed creation order directly. In both, do NOT revert to the legacy first screen mixing fantasy archetype, Power, Skills, Defense and Ability picks.

## 2.2 Guided wizard behavior

- One meaningful question/screen, roughly 2–6 suggested options, additional choices behind advanced mode. Never present a giant array of mixed archetypes as a first question.
- On Echo selection, preview **slot locks**, capacities and Echo Artifacts. Specific Echo choices such as Sentinel forms, Elven Stride, Titan Scars or Dragonborn variants must come from the current definitions, not obsolete Builder documents.
- Derived gear legality must update reactively when changing Echo, artifact or combat structure. Do not auto-delete user work on changing earlier selections: offer safe preview/reconciliation with an explanation.
- Attribute recommendations can use chosen combat preferences and future Stone Abilities, but only the player commits Attribute values.
- Imprint stage displays: `Might 4 → 4 candidates; Agility 4 → 4 candidates`, etc., limiting selections and previewing Tier4. The user may pick two from the same eligible Attribute.
- Specialization stage: five slots with suggested examples, editable name, Field, scope; every slot starts at Rank2, budget show `20/20`, and training/Raise-cap explanation. Avoid old skill packages such as Melee Weapons or Defensive Combat unless they are actually freely agreed in-game and bounded like any ordinary specialization.
- Power stage has validation for catalog profiles, PL choices, two Actives, Passives, Reaction and Buff, equipment/Stone interactions, spell delivery Casting Attribute and artifact-granted fixed PL.
- Give the player a complete, human-readable build recap and a usable suggested combat turn/rotation, but do not silently issue non-legal Powers or charge creation XP.
- The Wizard must be robust to saving partway through, Back/Next navigation, restart, changes after selection and import of old draft versions.

## 2.3 Quick Build / Actor Sheet / Dialogs

- Quick Build offers editable grouped fields, same canonical validators and computed totals.
- PC sheet shows seven Attributes, MR/Lifetime XP/Stones/Colorless, Health Bars/Scars/Fear, canonical Power slots and details, Artifact capacity & occupied slots, freely named Specializations/Fields/scopes/Ranks and Paid/Free Raises, Echo Imprints grouped by Attribute and current tier, 16 Rituals, Schticks, Disadvantages/Rerolls, Summons and their Bond-specific Skill Dice.
- Roll dialog shows task/source TN, Attribute, MR Keep, pool penalties with two-die floor, any legal Advantage/Disadvantage, Paid and Free Raise selections **before** roll, final TN and a concise explanation of success; no after-roll Spend Points prompt.
- Passive-check UI resolves only legal calm tasks and shows why risky/contested tasks need a roll. Save a structured roll record for reproducibility/debugging; ordinary non-GM users must not be able to arbitrarily falsify game state through chat card buttons.
- Power cards support predeclared Combat Raises with Damage/Special allocation, used PL and source (self-learned vs Artifact vs stored Magic Item), target SR calculations, and persistent zone metadata.
- Ritual cards show selection, method, optional Skill contribution, raised TN, Stones Sealed, duration and all chosen named/generic effects.
- Imprint cards show one-click narrative activation, actual unlocked tier and short Echo Memory suggestion; no dice on cosmetic manifestation itself.
- NPC sheet or quick-roll dialog provides situational Skill Opposition pools and no nonsensical mandatory PC Specializations.
- Retain normal safe rest, Power use, Artifact and Stone recharge behavior, including Scar recovery and Sealed Stones.

---

# 3. PERSISTENCE, DATA MODEL, AND SAFE CHARACTER MIGRATION

This is critical. Existing users may have substantial characters, artifacts, earned XP, custom Powers and saved Foundry scenes. The update must not destroy them.

1. Inventory current actor/item/compendium and external saved-build schemas. Introduce an explicit `rulesSchemaVersion` / migration version using existing project conventions. Prefer stable canonical IDs for Imprints, rituals, source powers, fields and artifacts, plus user-readable names for Specializations.
2. Implement **idempotent, versioned migration** on actor/world load or explicit GM action as compatible with the Foundry version. Back up/export the original actor and linked items **before** any destructive write. If world migration is supported, provide dry-run count + preview + GM confirmation. Respect permissions and avoid repeatedly remigrating actors already at target schema version.
3. Store a `legacySnapshot`/archived data or separate recovery export for previous fixed skills, old Skill Reserve, Echo Cards/Decks, Minor Expressions, Social Combat Setup, Death Marks, chase score and obsolete flags. Remove those systems from **active mechanics**, not from recovery backups. Label archived fields clearly as non-functional.
4. **Do not blindly convert old Skill Rating/Pool totals to new Rank.** Map plausible old skill topics to proposed custom Specializations with a review UI/GM confirmation. Do not merge unrelated old skills into a giant all-purpose Specialization. Preserve earned XP, Lifetime XP, purchased attributes, normal Powers, Artifacts, Stone placement, Disadvantages and current story metadata. A mature character must not be forcibly reset to five starting Rank2 skills.
5. Existing starting characters can opt into an explicit **respec** using the new 20-point/5×Rank2 budget. Existing advanced characters need a transparent migration method distinguishing paid-upgraded Skills from new creation grants. If the original history cannot be reconstructed, flag manual respec, do not invent XP reimbursements or arbitrarily inflate Skill Ranks.
6. **Minor Expressions → Echo Imprints:** migrate exact surviving mechanical equivalents only with a documented mapping (e.g. Mage Hand, Message, Arcane Spark, Catfall, Glamour if semantics really align). For renamed or removed effects present a suggested choice and request confirmation; never silently create Imprint selections that exceed MR or linked Attribute eligibility. Preserve old selections in archive.
7. **Echo Cards** are retired: archive or export them, remove active triggers/use/charges, keep Echo identity and Echo Artifacts intact. **Attunement** removed only for ordinary/Echo Artifact binding; do not delete **Summon Bond Rituals**.
8. **Ritual access** is derived from the universal catalogue: no per-actor purchase records required. Keep player-specific ritual UI favorites/notes separately, if previously present.
9. Make save/import/export/printable sheet/export-to-Foundry round-trip the new schema and remain backward compatible where safe, with explicit fallback notices. Verify actors on both an existing and a new World, especially users editing an actor during a schema transition.
10. Export a **migration summary per actor**: old version, new version, unaffected attributes/XP/Stones/Powers/Artifacts, migrated Specializations, unresolved selections, retired items archived, warnings. Make migration rollback and backup instructions available in README.

**Do not initialize or delete live user worlds as part of tests.** Use synthetic fixtures or a dedicated test world.

---

# 4. IMPLEMENTATION EXECUTION PHASES

Work through ALL phases below. Add each as a checked status item to `docs/migrations/DF_2026_RULES_MIGRATION_PLAN.md`. You may split commits, but finish the full scope of the user's request if the environment supports it.

### PHASE A — Definition registry and adapters
- Model seven Skill Fields, freeform Specializations, Raise caps, universal raise effect catalogue, ritual definitions, Imprint definitions, Source/Task TN rules, MR milestones, Artifact exception and reference enums in a canonical rules layer.
- Prefer pure deterministic calculation functions with explicit inputs and unit tests; sheets/builders/scripts must consume them rather than duplicating constants.
- Preserve existing canonical Powers and external catalogue loaders; do not replace their data because it is outside this rework.

### PHASE B — Core roll and effect engine
- Implement Skill Checks, Skill Opposition, Perception, Passive Skill Value, Paid/Free declarations, spell PL TN, SR0 default, SR Piercing, spell zones/Downcasting, Combat Raise declaration, Fear dice floor, Scar/Incapacitated behavior and Recovery.
- Delete old post-roll skill spending handlers and prevent obsolete state fields from influencing results.
- Use atomic/transaction-safe actions for Stone spending, Sealing, and on-use allocation when possible.

### PHASE C — Echo / Powers / Artifacts
- Echo choice, subtype/Artifact structural restrictions, 4 Artifact Capacity, equipment slot collision prevention, free Artifact Level1 binding without Attunement Ritual and MR-based Artifact Level caps.
- Implement fixed Artifact granted powers above normal learned-Power PL cap. Preserve full source PL and activate legal attached Powers as printed.
- Verify Mark, Sundered, Vulnerability, Limited Powers, Minor Magic Items, special Sources, Technical References and Power Use limits are intact.

### PHASE D — Character builders
- Rebuild Quick + Guided flows per §2, replace fixed Skills and Minor Expressions, remove Echo Card/Deck step, add Echo Imprints after Attribute selection, enforce five Rank2 Specializations/20 Creation Points and source-backed Power restrictions.
- Support partial builds, drafts, imports, validations and printable final preview.

### PHASE E — Ritual UI + logic
- Expose all 16 for all characters from start. One-hour ritual timer, 0–4 tiers, 0–8 total Raises, 1–3 Sealed Stone costs and Passive eligibility. Data-driven effect display from guide.
- Remove mandatory Ritual Skills/known entries. Preserve Word of Recall, Last Light, Clairvoyance and Seal Passage special effect limits.

### PHASE F — Echo Imprints + Echo Memories
- Create exactly 28 entries with full tier data. Implement eligibility, automatic tier, unlimited no-cost roleplay use and brief Echo Memory chat/action presentation. Preserve remaining Schticks separately.

### PHASE G — Social, stealth, pursuit, NPCs, summons
- Replace Social Combat with Social Challenges; simplify Pursuit; enforce staged Stealth/Skill Opposition, NPC situational dice, Summon closed list/caps, matching freely named PC Specializations and Shared Senses.

### PHASE H — Health, Rest, Fear, XP
- Remove Death Check counters, preserve Scarred Bar restoration rules, Emergency Medicine patientMR×4 and Safe-Haven aftercare. Keep intentional Fear spiral with normal two-die Pool floor.
- Replace old XP progression costs for Skills; preserve MR/Lifetime XP/Stone and Power/Artifact cost tracks. Update long-rest and safe-haven handlers without resurrecting old Skill Reserve refills.

### PHASE I — Migration, data, sources
- Implement reversible actor/build migration and compendium-source updates, validation and clear user messaging. Check actor, item, Summon, Template, journal and macro references. Avoid mass replacement of meaningful prose and identifiers used by external integrations without compatibility aliases.

### PHASE J — UX/localization/documentation
- Update German/English labels, tooltips, onboarding, help images or helper assets under the paths actually found in repo, FAQ, printable sheets, tooltips, context menus, ability catalogs and rules references.
- Old Guided Character Builder documents may be used for the **intent of the workflow** but not outdated mechanics; the new Player's Guide controls exact values.

### PHASE K — QA and integration tests
- Execute the exhaustive acceptance matrix below, run repository test/build/lint/type check commands and test representative UI flows. Fix introduced regressions, do not merely report that tests have not run when they can run.
- Write `docs/migrations/DF_2026_RULES_QA_REPORT.md` with actual commands, results, test fixtures and any known blockers.

### PHASE L — Final audit, safe handoff
- Global search for old mechanics and obsolete rulebook terms in active code and generated bundles. Update generated sources **using the build pipeline**, never hand-edit only the compiled output.
- Supply changed-file inventory, how to build/install, backup/migration path, feature parity notes, limitations and exact remaining nonblocking decisions. Finish with a concise German summary.

---

# 5. AUTOMATED ACCEPTANCE MATRIX — WRITE TESTS FOR THESE

Use project-appropriate unit/integration/e2e frameworks already installed. Add fixtures where required. Tests must verify **rule outcomes and persisted state**, not only rendered headings.

## 5.1 Creation and Specializations

- Standard MR2 hero starts with Attributes `4,4,3,3,2,2,2`, two starting Attribute Stones, two eligible Echo Imprints maximum, and exactly **five** freely named `Rank 2` Specializations using **20 Creation Points** total.
- Changing or deleting a Specialization in the builder updates all counters with no hidden leftover old Skills or Skill Reserve fields. Two Specializations with a duplicate normalized name/Field must be validated; unique meaningful custom names work.
- MR2 `Blacksmithing 2`, MR2 `Medicine 2` and custom `Caravan Cooking 2` are all legally selectable with independent scopes.
- Skill checks at MR2 with Attribute 4, Skill Rank 2 roll `4k2`; MR3 with same Attribute and same Rank rolls `4k3`, not a half pool. Rank does not add dice.
- An untrained attempt uses FULL appropriate Attribute Pool with Disadvantage and zero Raises; no 2×MR retraining requirement.
- Task Level 4 gives TN16 regardless of the acting PC's MR2/MR5. Stronger MR improves Keep, not task difficulty.
- Rank4 three raises (Scope2, Speed1) on BaseTN8 uses 1 Free+2 Paid→**TN16**. Rank3 same allocation uses 3 Paid→**TN20**. Rank8 may declare at most five Paid + three Free, eight total. Rank9 does not exist.
- Only Paid Raises affect TN; both Free and Paid allocations are saved BEFORE the roll, and neither can be reassigned after the result.
- On failed full final TN, do not automatically grant all or some declared enhanced effects. High roll cannot grant undeclared extra Raises.
- Passive Skill Value of Attribute8 is 16; under permitted conditions may pass a final TN16 without roll, but not final TN20. A character without the required professional knowledge cannot manufacture a complicated item just because 2×Attribute is high.
- Buying Rank0→1 and Rank7→8 both cost 4XP (distinct from 2 creation points per starting Rank). Never charge XP when accepting the initial 20-point allocation.

## 5.2 Perception, Opposition, Stealth, Social

- Universal Perception Wits/Intellect/Resolve allows Attribute k MR rolls without a bought Perception Skill or Untrained Disadvantage, even on new actor with zero related Specializations.
- False courier Deception BaseTN12, roll9 fails: no successful cover to oppose. Roll22 passes: an active guard rolls versus TN22; ties equal TN succeed where printed.
- Same unchanged successful Stealth setup result is used for multiple legitimate observers, each rolls its applicable own pool; nobody spends old Skill Points to raise it later.
- NPC MR2 specialist quick contest can roll example `8k2` and PC can oppose with an appropriate normal check; no default automated NPC win/no-roll rule.
- Social Challenges do not create Setup Points, lead-actor bonuses, extra initiative or forced phases; only ordinary Skill/Attribute checks. An abstract Pursuit score never appears.
- Flee remains the legal action+movement option and respects actual speeds; fast creatures are not magically caught by an otherwise unrelated social or generic skill check.

## 5.3 Spells, Combat Raises and Specials

- Spell PL2 BaseTN8; PL4 BaseTN16; PL6 BaseTN24; PL16 BaseTN64, regardless of MR, so long as source is legal.
- PL4 with SR4 reaches its target at 20; add one declared Paid Combat Raise→24; roll18 can be successfully produced but does NOT affect a target requiring 24; no Damage/Special on resisted creature.
- Spell AoE resolves one Casting Roll against multiple independent SR values.
- Placed PL4 zone with 1 declared Paid Raise uses **Creation TN20**, not BaseTN16; roll18 creates no zone, roll20+ may create one, and it stores used PL, roll, Paid count and predeclared allocation.
- Spell lowered from PL6 to PL2 uses complete actual PL2 profile (Damage, Range, Effects, targets) and TN8, never PL6 output with TN8.
- Artifact at legal Artifact Level may grant fixed PL10 to an MR3 character although self-purchased cap is PL6; Artifact-granted Spell TN uses its printed PL10→TN40.
- All ordinary Combat Raises are distributed before the roll. Intellect Stone Ability Raises (2/4/6/8 etc.) are assigned before each legal roll using their separate printed logic; ordinary free **Skill** Raises do not power Attacks.
- Mark and Sundered both remain distinct; Sundered is an eligible Vulnerability choice. Preserve Armor/Health and on-hit status effects.
- Limited Powers and Minor Magic Items retain resource behavior. Stored item activation does not count as use of the owner's own copy where the exception applies.

## 5.4 Echo Imprints, Rituals and Stones

- Exactly 28 Imprints (4×7) with tier values 4/8/12/16/20 and one Echo Memory example each, legal Attribute>=4 and max selected<=MR. Vitality has 4. At Attribute20 and Attribute40 the tier stays 20. Use has zero Stones, Rerolls, XP and charges.
- Selecting `Mage Hand` at Intellect4 activates Tier4; Intellect8 changes to Tier8 automatically without re-buying.
- Imprint use provides its minor named effect without an automatic Skill or combat check; a separate tricky professional result needs the usual Skill roll. `Hollow Echo` can hint at a hollow wall but cannot automatically reveal and open the hidden door.
- All 16 Rituals are available on a brand-new PC and a migrated PC, regardless of Skill choices. A character with no Occult skill can perform Augury.
- Base Ritual TN12 when TaskLevel<=3; TaskLevel4→16, TaskLevel6→24. A declared tier2 with no fitting Specialization: +8→TN20 when BaseTN12; Sealed 2 Stones. With rank4 fitting Specialization: one Free+one Paid→TN16, still 2 Stones.
- Ritual tier4 + 4 suitable generic Raises uses 8 total, Sealed **3 Stones**. Free Raises reduce TN but do NOT reduce total Stones. Named tiers and generic effects cannot override ritual-specific limits.
- Ritual Duration 1 Tyhran Hour; one legal Speed Raise reduces to 1 Forearm. Passive success against full FinalTN still Seals Stones. A failed Ritual does not return Stones or create a lower tier.
- Seal Passage opening tier4 executes the alternative opening mode and does not simultaneously seal the door. No Healing Ritual in the 16.
- Stone spending, Sealing, Bound Stones, permanent Colorless choice, and lifetime Stone gains remain separate (do not mix their resource buckets).

## 5.5 Incapacitated, Rest, Fear, Summons

- All available Bars Scarred→Incapacitated. Character cannot spend Stones or act. No Death Marks, Death Saves, negative HP auto-death or countdown.
- External Restoration restoring Broken Scarred Bar fully enables wake-up; Resolve Stone Healing applied to fully Scarred character does not reopen a bar or revive them.
- Emergency Medicine on MR4 patient has **BaseTN16**. Medicine Rank4 with one Free Raise retains TN16 if no additional Paid Raise; stabilizes only.
- Safe Haven natural recovery one Bar; with Medicine Rank4 aftercare two total; Medicine Rank8 three total, one patient per qualifying healer, no stacking on same recipient.
- Fear Result7=>+2, 8=>+1, 15=>+1, 16=>0. A base Pool of >=2 never falls below two **rolled** dice from normal Fear penalty; Fear still affects later checks and uses Resolve k1. Never conflate two dice with Keep2.
- MR2 Summon owner with one Bound Stone receives 8 Tokens, selects at most two permitted task skills, Perception cap4 dice, Stealth owner Rank2 cap4, owner Rank1 Tracking cap2, keep<=MR. No Summon Free Raises.
- Migrated custom `Woodland Stalking 3` qualifies a Summon's woodland Stealth with agreed scope; does not create automatic urban Stealth and does not expand the ten permitted task types.

## 5.6 Storage, interfaces, regressions

- Both builders, actor sheets, dialogs, chat cards, exports, print output and character imports share canonical data and computed rules.
- Migrating the same actor twice does not duplicate Specializations/Imprints, repeat XP rewards, multiply Tokens or destroy archived data.
- Old Echo Cards/Minor Expressions/Skill Points are absent from ACTIVE mechanics and navigation after migration, while reversible backups preserve the source data.
- Existing XP, Stones, Power profiles, Artifact bindings, gear, personal text and character identifiers survive.
- No Runtime crash on older half-complete builds or missing optional properties; they are shown as migration-needed with safe defaults and a comprehensible warning.
- A new Foundry actor and a migrated character can each: roll Skill, cast Spell, declare Combat Raises, use Imprint, perform Ritual, trigger a Minor Magic Item, heal a Scarred Bar, complete a Safe Haven Rest, and export/re-import with identical legal values.

---

# 6. STOP CONDITIONS, REPORT AND DEFINITION OF DONE

**Do not declare success merely because a script ran, because types compile or because search hits disappeared.** The user's request is end-to-end implementation.

Definition of Done:

- [ ] Correct repository inventory + implementation plan exist.
- [ ] Canonical rule definitions and pure calculators exist and are used everywhere.
- [ ] Both Quick/Guided character creation paths enforce all new creation constraints.
- [ ] Character actor sheet, dialogs, dice engine and chat messages use the new rules.
- [ ] Full 28 Imprints and 16 Rituals are visible, validated and functional as specified.
- [ ] All retired Echo Card/Minor Expression/Skill Point/Death Save/Social Combat/chase-meter mechanics have no active execution path.
- [ ] Stones, Power technical references, Mark, Sundered, Limited Powers, Minor Magic Items, Artifact functions and Summon Bond mechanics still work.
- [ ] Existing characters migrate with rollback/backups and no silent permanent data loss.
- [ ] Imports/exports, compendiums, NPCs and Summons interoperate.
- [ ] Automated tests and real user flows pass; affected localization/help references are current.
- [ ] Detailed QA report and changed-file inventory delivered.

When done, output in **German**:

1. **Was konkret geändert wurde**, grouped by feature, with actual file paths.
2. **Ergebnis von Tests/Build** — commands and pass/fail numbers; distinguish executed from not executed.
3. **Migration** — backups, schema version, characters requiring manual review, rollback steps.
4. **Offene Punkte** — only genuine source ambiguities, untestable environments or defects, never hide them.
5. **Was der Benutzer als Nächstes testen sollte** — a concise Foundry smoke-test route.

If scope exceeds one context window, record progress in migration plan and proceed in logical batches, continuing from the last completed status. Do not reinterpret retired mechanics just to reduce workload. If a tool/runtime dependency blocks execution, report the exact blocker and finish the other available phases.

**Start now: inventory repository, confirm the Player's Guide file, write plan, then implement the full migration.**
