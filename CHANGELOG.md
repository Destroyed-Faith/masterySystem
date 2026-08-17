# Changelog - Mastery System / Destroyed Faith

All notable changes to this project will be documented in this file.

## [0.9.365] - 2026-08-17

### Fixed

- **Release CI:** GitHub Actions now use Node 24–compatible checkout, setup-node, and gh-release so the ZIP upload no longer dies on “Too many retries”.

## [0.9.364] - 2026-08-17

### Added

- **Resolve stones:** Stress Healing (1d8–4d8, 2–16 m) is now a full Resolve stone power.

### Fixed

- **Stone Powers:** Ramp powers without a Tier-1 effect (Phasing, Spell Action, Damage Reduction Boost) now open on the two-stone wave instead of a single yellow slot.

## [0.9.363] - 2026-08-17

### Changed

- **Combat carousel:** Removed the Steine and Shop buttons from player cards. Setup still runs through Prepare Combat and the GM force-open controls.

## [0.9.362] - 2026-08-17

### Added

- **Character sheet:** A Status panel lists active specials and leftover Temp HP. Owners and the GM can reduce stacks or clear an effect, matching the NPC sheet.

## [0.9.361] - 2026-08-17

### Changed

- **Encounter flow:** The tracker button is now Prepare Combat (Passives, Stones, Shop, NPC initiative). The fight stays unstarted until the GM presses Start Combat. Combat then begins with the highest initiative, not the first listed player.

## [0.9.360] - 2026-08-17

### Added

- **Round advance:** When stones are still open, the GM can fill and confirm them for the pending players from the warning dialog.

## [0.9.357] - 2026-08-17

### Fixed

- **Round advance:** Next Turn / Next Round (including the GM combat tracker) now waits for every PC to confirm stones. The warning lists who is still open.

## [0.9.356] - 2026-08-17

### Fixed

- **Passive slots:** The X on a filled slot now clears it for players. Foundry was dropping `null` on save, and the button could submit the dialog instead of removing the passive.

## [0.9.355] - 2026-08-17

### Fixed

- **Round advance:** After the last End Turn, combat waits until every connected player confirms stones for the new round. Actions, next turn, and next round stay blocked until then. Players without a GM client still get the stone dialog (Join Game As).

## [0.9.354] - 2026-08-17

### Fixed

- **Encounter setup:** Player confirm now persists on the combatant (Passives / Stones / Shop), not the Combat document. "Übernehmen & schließen" confirms stone spend and continues to the Initiative Shop; window close no longer spends stones.

## [0.9.353] - 2026-08-17

### Fixed

- **Encounter setup:** Confirming Passives as a player no longer tries to write the Combat document. The lock is sent to the GM over the socket.

## [0.9.352] - 2026-08-17

### Changed

- **Encounter setup:** After the GM starts combat, each player walks Passives → Stones → Initiative Shop on first scene load. The GM no longer auto-sees those dialogs or player initiative rolls. Closing with X does not confirm a step; only an explicit confirm locks it. Force-open from the sheet, carousel, or tracker still lets the GM inspect.

## [0.9.351] - 2026-08-17

### Fixed

- **Start Encounter:** A player can start the test combat without a second GM client. The old "A GM must be online" check missed active GMs on Foundry's user collection.

## [0.9.350] - 2026-08-16

### Fixed

- **Start Encounter:** The token picker now opens from the button at the top of the Combat Tracker. Foundry's + still only creates empty numbered combats.

## [0.9.349] - 2026-08-16

### Added

- **Start Encounter:** Anyone can start a test combat from the top of the Combat Tracker — pick scene PCs and NPCs, then run the player setup dialogs on this client.
- **Initiative Shop:** Reopen the shop from the character sheet and the combat carousel after dismissing it, using the same roll if it was not confirmed.

### Changed

- **Encounter setup:** Pick summaries (what was chosen) are GM-only. Players no longer see them on the sheet or carousel.

## [0.9.348] - 2026-08-16

### Added

- **Encounter setup:** Character sheets and the combat carousel show whether each player picked Passives, Stone Powers, and Initiative Shop, plus a short summary of the picks.
- **Force dialogs:** The GM can open those three dialogs on the owning player — one person or everyone — from the sheet, carousel, and combat tracker.

### Changed

- **Combat Carousel:** Below Foundry's usable 1024×768 window (zoom or short displays) the carousel collapses to a compact strip without portraits so it stays on screen.

## [0.9.347] - 2026-08-16

### Fixed

- **Tests:** `getForcedDeletion` no longer throws when Foundry globals are missing, so passive-trigger unit tests run in CI.

## [0.9.346] - 2026-08-16

### Fixed

- **Build:** Initiative Shop context no longer requires a local `rollResult`, so the release compile succeeds when the shop opens over the socket.

## [0.9.345] - 2026-08-16

### Fixed

- **Combat start:** Select Passives, Stone Powers, and Initiative Shop open on the owning player, not only the GM. Players no longer try to update NPCs or combat flags they cannot write.
- **Epic Roll:** A failed check can spend 1 Reroll Point once, including attribute fails with no skill spend.

### Added

- **Images:** Opened pictures show a copyable URL. The three-dot menu has Copy picture link on image popouts and actor sheets.
- **Safe Haven Rest:** GM button on XP Management and the Mastery scene toolbar rests every character (HP, Stress, Scars, Stones, charges, skills, Reroll Points, Echo uses).

### Changed

- **Calendar:** Players can open the calendar and create or edit day journals. World date stays GM-only.
- **Stone Powers:** Rituals and Summons tabs are gone; those live on the character sheet.
- **Epic Roll:** The participant picker lists characters only, not NPCs.

## [0.9.344] - 2026-08-16

### Fixed

- **NPC sheet:** Extra powers no longer vanish right after **+ Power**. A stale form submit was rewriting the phase list without the new attack.

## [0.9.343] - 2026-08-16

### Changed

- **Combat Carousel:** Hostile and secret NPCs no longer show exact HP numbers. The bar stays so players can still see how wounded they look.

### Fixed

- **Radial menu:** Leftover weapon blobs on staves, lanterns, feet, and items without a kind no longer create a fake 1d8 attack. Only a declared natural weapon (Dragon Head Bite) still gets its own swing.

## [0.9.342] - 2026-08-16

### Fixed

- **Radial menu:** Weapon artifacts no longer add a second basic swing when the character already has an Active (e.g. Single Attack). Armor artifacts such as Soul Sigil never appear as a 1d8 attack.

## [0.9.341] - 2026-08-16

### Changed

- **Artifact sheet:** Inactive preview is Level 1 only (base values plus the first ability). Next-level preview drops base values and lists only the new ability.

## [0.9.340] - 2026-08-16

### Fixed

- **Inventory:** Drag-and-drop treated all three load bands as one 24-column grid and kept equipped items on those cells. Hover marks landed on Normal Load, leftover armor stayed red, and failed drops snapped items to the top-left. Placement is now per-band, equipped items leave the grid, and items stay where you drop them — including Heavy Load.

### Added

- **Artifact sheet:** Inactive artifacts show the L1 card as When activated. Active artifacts show the next tree level in gray.

## [0.9.339] - 2026-08-16

### Changed

- **Artifacts:** Maximum level is 10. MR 5 reaches 8, MR 6 and above reach 10.

## [0.9.338] - 2026-08-16

### Changed

- **XP Management:** End Upgrade Step, Recalc, Reset XP/History, and Clear History are gone. History refund and Reset to post-creation stay. Free XP still lifts the once-per-session +1 limit.

## [0.9.337] - 2026-08-16

### Fixed

- **XP History:** Artifact upgrades from before history logging now appear as spend rows (8 XP per level above 1) and can be refunded. Opening history writes the missing rows.
- **XP Recalc:** Artifact investment is included, so Recalc no longer treats those XP as unspent.

## [0.9.336] - 2026-08-16

### Fixed

- **Build:** Artifact history refund compiles. Foundry's `Item` type does not expose `name` without a cast.

## [0.9.335] - 2026-08-16

### Added

- **XP History:** The GM can refund a spend row. That step and later steps on the same thing unwind. Refunds use the current cost table.

### Changed

- **XP Management:** The panel follows the Rulebook theme. Player and Step-bump columns are gone. Spent and Earned are Regular plus Free, so a character who spent 24 Free XP shows 24, not 16 / 0.

## [0.9.334] - 2026-08-15

### Changed

- **XP History:** Each spend is its own row (attribute, skill, power, artifact). Old batched confirms expand when shown. The history window is resizable.

## [0.9.333] - 2026-08-15

### Changed

- **Echo Cards:** Licensed slots are 1 at creation, 2 at Mastery Rank 4, and 3 at Mastery Rank 6. There is no extra card at Rank 2. Maximum is 3 cards.

## [0.9.332] - 2026-08-15

### Fixed

- **Build:** Echo Card use no longer redeclares `masteryRank`, so the TypeScript release build succeeds.

## [0.9.331] - 2026-08-15

### Added

- **Echo Cards:** The GM can remove a card at any time. Extra cards from a higher starting Mastery Rank stay until the GM removes them. Only licensed slots (MR 1 / 2 / 4 / 6) can be used.

### Changed

- **XP Management:** Regular XP and Free XP now explain themselves on hover. Settings CSS is clearer, including the missing Free / deduct / flag / recalc buttons.

## [0.9.330] - 2026-08-14

### Changed

- **Player's Guide:** Synced to the current Homebrewery source. Technical names and Movement prefixes are aligned; the PP table is a shortcut when written PP differs; Bond and owner Active Buff slots are separate; the Heal example uses Melee or Ranged Single Target Heal.
- **Movement:** Trample no longer cites Special Overdrive. It cites Active Buff: Special Increase.

## [0.9.329] - 2026-08-13

### Changed

- **Consumable Slots layout:** Slots sit left and right of Feet at the same square size. Head, hands, and jewelry are a bit larger; Body is a bit narrower. Extra slots from Mastery Rank 3 sit in a compact row below.

## [0.9.328] - 2026-08-13

### Added

- **Consumable Slots:** Each character has one Consumable Slot per Mastery Rank on the equipment paperdoll. Only items marked consumable (including Minor Magic Items) can occupy a slot. Equipped consumables appear as Attack Actions on the sheet, in the radial menu, and on the printable sheet. Use spends the existing Attack Action; a cancelled or failed use does not consume the item. Slots lock during combat. Lowering Mastery Rank unequips overflow items without deleting them.

## [0.9.327] - 2026-08-13

### Changed

- **Rituals tab:** The workshop is the tab. No extra window, no Open / Perform Ritual buttons. Pick a Ritual, place Stones, roll on the sheet.
- **Minor Magic tab:** Safe Haven Rest sits on this tab. After you rest, the create form on the same page unlocks. Use and Arm Trap stay available anytime.

## [0.9.326] - 2026-08-13

### Changed

- **Minor Magic Items:** Creating no longer burns a Stone. Create, replace, or dismiss only during a Safe Haven Rest. Empty places in the Mastery Rank limit fill only then. Existing items still count if given away. Use and Arm Trap stay available anytime.

## [0.9.325] - 2026-08-13

### Added

- **Minor Magic Items:** New character-sheet bookmark under Rituals. Create a 1×1 inventory consumable that stores one use of a purchased Active Power (potion, grenade, rune, prepared weapon, trap, or charm). Creating burns 1 Stone and counts against Mastery Rank until the item is used, armed as a trap, dismissed, or destroyed. The burned Stone returns on the next Safe Haven Rest after the item is gone. Prototype: snapshot + Use / Dismiss chat; full stored-Power combat resolution comes next.

## [0.9.324] - 2026-08-13

### Changed

- **Rituals tab:** Perform Ritual left the Attributes button row. The character sheet now has a Rituals bookmark under Summons. The workshop lists each Ritual as a tab with rulebook text, hover chips for TN / Stones / Time / Limits, and a Roll button that stays locked until the declared Raise’s Stones are placed. Catalog is Read Resonance through Last Light (no Augury, Commune, or Greater Restoration). Stone cost is 1 / 1 / 2 / 2 / 3 by declared Raise.

## [0.9.323] - 2026-08-13

### Fixed

- **Blood stain size:** The pop-in animation reset PIXI scale to 1, so each splash drew at the full 1254px texture instead of one hex. Stains now stay on the token’s hex, with only a little spray into neighbors.

## [0.9.322] - 2026-08-13

### Changed

- **Blood stains:** Hits now stamp one tinted splash texture (drops / impacts / pools) on the map under the token, not ellipse blobs on top of the character. Light = small chip, medium = heavy chip, heavy = health-level loss. Wounded / Broken / Incapacitated tokens leave directional trail smears when they move. Oldest stains fade out after a handful so the floor does not fill up.

## [0.9.321] - 2026-08-13

### Changed

- **Rituals:** Perform Ritual now uses declared Raises (Base TN = 8 × Ritual MR, Raise TN = Base + declared × 4). Meet Base but miss Raise TN → Raise 0 only. Extra margin does not unlock undeclared Raises. Stones are Sealed on the attempt, including failure. Catalog replaced with the current Players Guide list (Detect Magic through Last Light). Raise Dead is not a standard ritual. Any Stone color may pay.

## [0.9.320] - 2026-08-13

### Fixed

- **Initiative can be negative:** A bad roll plus Heavy / equipment no longer snaps back to 0 in the Initiative Shop. The leftover score (and turn order) keeps the minus. Shop purchases still require a pool at least as large as the cost.

### Changed

- **Initiative ties:** Player (character) acts before NPC/summon. Player vs player uses Agility, then Wits, then Intellect, then Resolve.

## [0.9.319] - 2026-08-13

### Fixed

- **Blood pools:** Splatters and puddles were drawn behind the scene map, so hits showed no blood. They now render on the effects/token layer. Any real HP loss on a token (Apply Damage, sheet HP minus) also spawns blood in the actor’s Blood Color.

## [0.9.318] - 2026-08-13

### Changed

- **Summon Bond Ritual:** Create Actor stays Create until a live actor exists (Foundry document id on the body, never the name). Then Create greys out and **Update Actor** appears. A stale id (actor deleted) falls back to Create. Skill Dice moved from Upgrades into **Summon Skills** — buy the pool there (1 Token → 2 dice), then assign those dice to ticked skills.

## [0.9.317] - 2026-08-13

### Changed

- **Creature Types:** Shared catalog for NPC and Summon (Humanoid, Beast, Spirit, Undead, Fiend, Construct, Elemental, Plant, Dragon, Celestial, Other). Summon Bond UI uses a dropdown instead of free-text Expression. Create Actor writes the selected type onto the summon.

## [0.9.316] - 2026-08-13

### Changed

- **Summon actor:** Create Actor now fills an NPC-style sheet titled **Summon** (no phases, no Description/Notes, no extra powers). Combat and the base attack come from the Bond. Disposition is always **Friendly**. Ownership is set to the owner’s assigned player and every GM. Blood Color stays. NPC sheet CSS no longer uses the old red character-sheet boxes.

## [0.9.315] - 2026-08-13

### Fixed

- **Summon Bond Ritual:** Compact two-column sticky bar. Left: Tokens left, Bound Stones, Artifact bonus, Spent, Status. Right: Attack / Damage / Move / Attacks / HP / Armor / Evade / Bodies as small side-by-side labels so the theme heading font no longer blows up the panel.

## [0.9.314] - 2026-08-13

### Changed

- **Summon Bond Ritual:** Sticky **Tokens left** bar uses a dark panel with readable cream text and a live stats table on the right (Attack, Damage, Move, Attacks, HP / Armor / Evade, Bodies). Bond Upgrades and Bodies are one **Upgrades** section. Shared Senses, Powers, and Summon Skills are click-to-expand folds. Special Access lives inside Powers. **Create Actor** is in the bottom action row with Apply, Dissolve, and Close.

## [0.9.313] - 2026-08-13

### Changed

- **Summon Bond Ritual:** Identity and Bound Stones are collapsed by default. The page starts at Bond Upgrades, with Bodies directly underneath.
- **Summon Skills:** Only owner skills at Rating ≥ MR × 2 are selectable. Rating 0 / below-threshold skills are hidden. Previously selected skills that fall below the threshold stay visible as invalid and block Apply.

## [0.9.312] - 2026-08-13

### Fixed

- **Summon Bond Ritual UI:** Keep scroll position when buying upgrades. Sticky **Tokens left** counter shows Bound Stones + Artifact bonus + spent. Special Access, Shared Senses, and Add Power lock when Tokens are insufficient. Clearer copy for Artifact bonus and Summon Skills.

## [0.9.311] - 2026-08-13

### Fixed

- **Summon Bond Ritual:** Bond and Body upgrades are controlled steppers (minus / count / plus). Arbitrary number input is no longer possible. Plus disables when Tokens are insufficient; Movement / Extra Attack / Artifact bonus are hard-capped. Legacy illegal purchases show an error and **Reset illegal purchases** instead of absurd dice previews. Apply stays disabled while the spend is illegal or over budget.

## [0.9.310] - 2026-08-13

### Changed

- **Summons V2:** Bond-level action economy (shared attacks/reaction, Extra Attack is Bond-scoped), token status (Valid / Needs Ritual / Over Budget / Invalid Until Fixed), canonical power allowlist with `ceil(PP/10)` costs, actor sync on Ritual Apply, and safer Dissolve (stones back, scene tokens removed). Summons tab on the character sheet; Flying base 4 m; no Climbing.

## [0.9.309] - 2026-08-12

### Fixed

- **Install size:** Compressed oversized logo/banner/item icons so the release ZIP is ~22 MB (was ~53 MB), reducing Forge/Bazaar download failures.

## [0.9.308] - 2026-08-12

### Fixed

- **Install / Forge download:** `system.json` `download` now points at a GitHub Release ZIP instead of the ~56 MB `main` branch archive (Forge/Bazaar often failed with “Failure to download package from URL”). Packaging also normalizes Windows paths so `dist/` is included in the release ZIP.

## [0.9.307] - 2026-08-12

### Fixed

- **Skills tab:** Perception category shows again at the top (sheet/hub still looked for the old "Awareness" label after the rename).

## [0.9.306] - 2026-08-12

### Changed

- **Creation / Redistribute Skills:** `+` sets a skill to **4** in one click; `-` clears to **0**. Partial ranks (1–3) are not allowed — only 10×4 chunks of the 40-point budget.

## [0.9.305] - 2026-08-12

### Added

- **Redistribute Skills:** Owner/GM button (Skills tab + GM Tools) resets skills and re-opens the creation allocation (40 points, max 4 per skill) when the character has no XP earned or spent yet. Finish saves; Cancel restores the previous ranks.

## [0.9.304] - 2026-08-12

### Fixed

- **Broken sheets (0.9.303):** Clean rebuild restored missing `.js` extensions on ES module imports in `dist/` (botched `fix-imports` left sheets as title + portrait only).

## [0.9.303] - 2026-08-12

### Fixed

- **NPC sheet Ini partial:** Preload `npc-combat-ini.hbs` so the sheet renders instead of failing on a missing Handlebars partial.

## [0.9.302] - 2026-08-12

### Added

- **NPC sheet Ini:** Malus/bonus dropdowns (−10…+10) with `MRd8 ± N` summary; modifier applied on combat-start initiative for NPCs/summons.
- **NPC Speed (m):** Former “Tempo” field clarified as base movement meters (separate from Move Actions / Round).

### Changed

- **NPC sheet labels:** Combat strip and HP section use English (Evade, Armor, Ini, Speed, HP).

## [0.9.301] - 2026-08-12

### Fixed

- **NPC sheet Status (phases):** Status panel inside phase tabs now reads `@root` flags so active effects show (same Handlebars scope class as the HP path bug).
- **Add Power dialog:** Stopped forcing `position: relative` on the legacy Dialog — it no longer shifts Foundry’s UI / sticks off-screen; dialog is a centered fixed overlay.
- **PC radial AoE hover:** Preview paints AoE footprint (burst / radius), not cast/weapon range — Melee AoE Self shows the printed radius; Ranged AoE no longer shows e.g. 68 m instead of Radius 7 m.
- **PC Melee AoE hits:** Burst target collection uses the printed burst radius (no longer clipped by ~2 m weapon reach).

## [0.9.300] - 2026-08-12

### Fixed

- **NPC sheet HP:** Phase HP inputs no longer orphan on submit (`phaseIndex` path); empty bars restored so current/max edit fields show again.
- **NPC sheet Status:** Shows root `system.statusEffects` (combat writes here) with **−1/−2/−3/−4** and remove; phased sheets no longer hide statuses behind empty `phase.statusEffects`.
- **PC damage Faith Fracture:** Removed the extra “Damage rolled — kept” chat. Keep / Reroll (1 Faith Fracture) lives on the single damage card.

### Changed

- **Threatened Ranged Reactions:** No universal Opportunity Attack. Post-resolve window offers offensive Reactions only (Counterattack / Counter Damage / Special Increase) vs the shooter.

## [0.9.299] - 2026-08-12

### Removed

- **Artifact Only Active Buff: Smite Aura** (`ab-smite-aura`) and `auraPayload.kind: 'smite'` — no longer present in current Rule Docs; catalog audit updated.

## [0.9.298] - 2026-08-12

### Changed

- **Rules break — Autofire & AoE redesign:** Removed Area TN / Raise-extra-target Autofire from docs **and combat runtime**. Martial AoE: one roll vs each creature's Evade, full payload each hit, Dive for Cover after hit check. Spell AoE: one roll vs each Final Spell TN. Autofire(X): ordered 4 m chain (first miss ends; no target-count Raises; full payload; no Dive for Cover; **30 PP × X**) with chain picker UI. Encounter threat math prices AoE vs party Evade. Docs: `actives.md`, `agent.md`, `players-guide.md`, `active-buffs.md`, `artefacts.md`.
- **Weapon / Martial Special AoE tables:** Instant Attack AoE PL1–16 radius and bonus dice / Special ranks taken from printed `actives.md` tables (full Special value, not half).
- **Active Buff: Damage:** Unconditional buff `damageRider.flat` applies on every attack hit (Single / AoE / Autofire) via the shared damage dialog.
- **Exorcism / Requiem replace Smite:** Instant Smite-+Xd8 removed. Exorcism (Fiend) and Requiem (Undead) are diminishing Specials (Start PP 2 × T(X), tick damage). Catalog uses Melee/Ranged/Melee AoE/Ranged AoE Targeted Special Attack templates. Moonlight Greatsword / Hunter's Scourge docs and artifact picks aligned.

## [0.9.297] - 2026-08-09

### Added

- **Print: Bogen + Standardmanöver** (Drei-Punkte-Menü): optionaler Ausdruck mit **Basic Attack** (Weapon + MR×2d8) und den drei Basic Reactions **Guard / Evade / Counterattack** auf der Battle-Seite — zusätzlich zu den normalen Powers.

## [0.9.296] - 2026-08-09

### Added

- **Push / Pull targeting**: after Counter Damage (+ Push/Pull), legal destination cells are highlighted on the grid. **Push** only allows cells farther from the source; **Pull** only closer. Click to move; Esc/RMB skips (damage still applies).

## [0.9.295] - 2026-08-09

### Added

- **Passive Parry runtime**: Parry Stance enters a Parry pool (Might/Agility, capped at 5×Level), gives up Attack Actions, and strips Attack Dice 1:1 before the roll.
- **Fully Parried → Riposte / Reflection**: 0 Attack Dice skips the roll and damage, opens the defender Reaction Window with `hasParryThisHit`, and spend resolves Weapon+Nd8 (Riposte) or reflected damage+Nd8 (Reflection).
- **Reaction flow tests**: gates (miss / DR / Counter Damage range / Ghost Slip / Cleanse / Overload / Interpose) plus Full Parry → follow-up eligibility and spend formulas.

### Changed

- Reaction Window threads `hasParryThisHit`, `attackType`, and `isAoE` into eligibility filtering.

## [0.9.294] - 2026-08-09

### Added

- **Reaction trigger eligibility**: central `ReactionTriggerContext` / `evaluateReactionEligibility` gates which buttons appear (Hit/Miss, ≤2 m, Passive DR/Phasing, wrong surfaces).
- **Pre-damage Allies phase**: Ally Armor / Evade / Temp HP and **Interpose** run before damage and merge into shared mitigation.
- **Reaction auto-effects**: Temp HP grant, Counter Damage (Nd8 to attacker), Special Increase (confirm), Reposition prompt, Ghost Slip → Phasing ignore-hit.
- **Reactive Overload / Cleanse**: separate chat prompts after HP loss / status apply (not on the attack window).

### Changed

- Post-attack `others` phase is now **Opportunity Attacks only** (ally mitigation moved pre-damage).
- Catalog Armor / Counterattack hidden on miss; DR hidden without Passive DR; Riposte/Reflection require Full Parry; Intercept retarget stays table-side.

## [0.9.293] - 2026-08-09

### Changed

- **Faith Fracture damage reroll**: no more popup dialog. After damage dice are rolled, Keep / Reroll appears as a **chat card** in the log (same place as the rest of the attack flow) — including when attacking from a Reaction.

## [0.9.292] - 2026-08-09

### Fixed

- **GM Wiederherstellen scroll jump**: restoring Health/Stress bars no longer scrolls the character sheet to the top (ApplicationV2 `.window-content` scroll is preserved; updates use `render: false` before a single sheet refresh).
- **Chat `/roll` input**: sidebar chat no longer shows the Mastery text-color / Format toolbar clutter — the composer is a plain typing area again for `/roll 4d8` (and normal chat). Journal editors keep the color palette.

## [0.9.291] - 2026-08-09

### Fixed

- **False “GM has closed reactions”**: closing the target reaction window no longer locks the shared event id, so the post-attack OA card for Alaris/Fynn stays clickable. Only the GM button **Reactions abgeschlossen** locks the whole attack.

## [0.9.290] - 2026-08-08

### Fixed

- **Threatened Ranged OA card missing**: the post-attack window no longer silent-skips when Alaris/Fynn (etc.) are named but have **0 Reactions left**. The card still appears and lists why each threatener cannot Opportunity Attack.

## [0.9.289] - 2026-08-08

### Changed

- **Reaction Evade**: grayed out (disabled) when it would **not** raise Evade above the attack total — tooltip **“Will not prevent the hit”**. Still offered when it would negate the hit.

## [0.9.288] - 2026-08-08

### Added

- **GM Stress restore (Attributes)**: each Stress bar has a **Wiederherstellen** button (same cascade as HP — that bar and all more-severe bars below, e.g. Stressed → Not Well…Breaking).

## [0.9.287] - 2026-08-08

### Added

- **Stress Breakdown Check** (Players Guide): when a PC’s Stress Track fills (all bars empty / Breakdown), a Meltdown chat card prompts a **Wits check** (keep MR, TN 8×MR).
  - **Virtue (success):** track resets to Clear; next action gains **+1 Keep**.
  - **Affliction (fail):** track resets; choose **Scar of Will** (Mental Restriction 2 pts + 2 Reroll Points) or **Push It Down** (GM gains 1d8 Misfortune Tokens — world setting).

## [0.9.286] - 2026-08-08

### Added

- **GM: Reactions abgeschlossen** button on reaction chat cards. Closes the event permanently — no further Use/Decline and no more summary copies for that attack.

## [0.9.285] - 2026-08-08

### Changed

- **Post-attack Reaction summary**: after each Use / Decline, the remaining-reactions card is **copied to a new chat message at the bottom** (old card shows “moved below ↓”). No more scrolling up past OA cards to see who still needs to react.

## [0.9.284] - 2026-08-08

### Added

- **GM Health restore (Attributes)**: each Vitality bar has a **Wiederherstellen** button. Restores that bar and all more-severe bars below it (e.g. Bruised → also Injured…Incapacitated).

### Changed

- **Threatened Ranged / post-attack reactions**: the original attack now **fully resolves** (target reaction → damage) first. Then one shrinking summary offers Opportunity Attacks + Ally Reactions in parallel — no Guard/Evade/Basic Counterattack in that window. OA cards no longer pause or bury the original attack.

## [0.9.283] - 2026-08-08

### Added

- **NPC sheet — Seite (Disposition)**: Dropdown **Hostile / Neutral / Friendly** next to creature type. Writes Foundry `prototypeToken.disposition` and syncs all placed tokens for that NPC (so Threatened Ranged / targeting see the correct side without digging into Token Config).

## [0.9.282] - 2026-08-08

### Fixed

- **Threatened Ranged vs Friendly Dummy**: PC ↔ NPC always counts as opposing, even when the Dummy token is disposition **Friendly** (common GM setup). This restores Disadvantage + Alaris/Fynn OA detection.
- **Melee engagement**: grid adjacency (incl. diagonal) as fallback when meter math is noisy.
- **OA timing**: Opportunity Attack window runs **right after the attack roll** (before target reactions / damage).
- Console logs are plain strings (filter **`[MS Threatened Ranged]`**) so pasted logs show names/distances without expanding Objects.

## [0.9.281] - 2026-08-08

### Fixed

- **Threatened Ranged detection**: melee engagement now uses **edge-to-edge** distance (diagonal / grid noise no longer drops Alaris/Fynn). Ambiguous dispositions fall back to PC-owner vs NPC.
- **Phase 2 OA**: re-scans hostiles around the shooter at resolve time (flags ∪ live), with console debug.

### Debug

- Filter the browser console with **`[MS Threatened Ranged]`** — logs rule apply/skip, each nearby token (disposition, edge distance, reach, why skipped), and Phase‑2 opportunity inclusion.

## [0.9.280] - 2026-08-08

### Fixed

- **Reaction Counterattack / Opportunity Attack**: original attack damage is **paused** until the Counterattack card is rolled and fully resolved (or **Skip** is pressed). No more Dummy damage continuing while the Counterattack Roll sits unused.
- Nested Counterattack buttons are suppressed on reaction-counterattack cards to avoid pause stacks.

## [0.9.279] - 2026-08-08

### Fixed

- **Threatened Ranged Disadvantage text** on the attack card: no longer claims “keep one fewer die”. Combat Disadvantage means only **one** initial 8 may explode; pool size and Keep stay the same.

## [0.9.278] - 2026-08-08

### Fixed

- **Dodge Stance removed from radial menu** (and from radial prefs). Parry Stance remains.
- **Threatened Ranged Opportunity Attacks**: Phase 2 now includes the listed opportunity enemies (e.g. Alaris/Fynn) with an **Opportunity Attack** button — not only Ally-* powers. Also runs after a miss / Evade negate when OA token ids are on the attack card.
- **Hostile detection** for Threatened Ranged: NPC shooters correctly see friendly PCs in their melee reach as threatening (opposite dispositions).

## [0.9.277] - 2026-08-08

### Changed

- **Two Reaction Window phases**:
  1. **Target** — right after the attack Roll, before the damage dialog. Only the direct target; Evade can negate the hit (no damage).
  2. **Allies** — after the damage roll is posted and HP applied from Phase‑1 mitigation. Nearby allies get buttons; the card refreshes after each use until Continue / nobody left.
- **Dedupe**: if a real Evade/Guard reaction power is equipped, the matching Basic Evade/Guard button is hidden (no more double Evade).

## [0.9.276] - 2026-08-08

### Fixed

- **NPC attacks not resetting next round**: Foundry `setFlag` merges objects, so writing `npcAttackUsesThisRound: {}` left spent attack keys in place. `setRoundState` now unsets then replaces the whole `roundState` flag so Angriffe/Runde copies come back each round.

## [0.9.275] - 2026-08-08

### Changed

- **Reaction Window UX**:
  - Chat card posts **after** the damage roll (not before).
  - Interactive **buttons** per eligible actor (Guard / Evade / Counterattack / powers / Ally reactions).
  - **One reaction per actor per event**; after someone reacts, the card refreshes for remaining actors.
  - **Continue** closes the window and applies HP (with Guard/Evade mitigation).
  - Pressing **Roll** on an attack entitles reactions even on a **miss** (window still opens).

## [0.9.274] - 2026-08-08

### Fixed

- **Ranged targeting always picking a nearby token (e.g. Fynn)**: stage capture no longer confirms a guessed target from stale `mousePosition`. Each valid target gets a stage hit-pad bound to its token id; rings are non-interactive. Client→canvas coordinates used for cancel/out-of-range checks. Look for `via: "stage-hit-pad"` in confirm logs.

## [0.9.273] - 2026-08-08

### Fixed

- **Ranged/melee targeting cancel on distant tokens**: capture-phase miss no longer immediately cancels (that killed overlays before they could fire). Token pick now prefers the PIXI event-target token, then `canvas.mousePosition` / stage coords; verbose `[MS NPC Targeting] RANGED pointerdown` logs included for diagnosis.

## [0.9.272] - 2026-08-08

### Fixed

- **Target picking**: ranged/melee/utility clicks no longer take the first overlapping token in Foundry `placeables` order. Picks the closest / topmost token under the cursor (and prefers in-range valid targets for ranged), so clicking Sjossfur no longer silently selects someone else.

## [0.9.271] - 2026-08-07

### Added

- **Basic Combat Maneuvers** (universal options for all combatants):
  - **Basic Attack**: Weapon Damage + MR × 2d8; no Active Power effects; weapon properties / Passives / Buffs still apply.
  - **Basic Movement**: Move, Dash (2× Speed, locks base Attack), Disengage (safe move + locks base Attack), Quick Load (Reload 1, cap MR), Stand Up (costs Attack Action), Flee (4× Speed; no Attacks / Reactions / Stones until next Turn).
  - **Basic Reactions** in the Reaction Window: Guard (+MR×2 Armor), Evade (+MR×2 Evade), Counterattack (Basic Attack; does not spend an Attack Action). Not Powers — reusable with extra Reactions.
  - **Initiative: Delay**: skip Turn, pick after whom to act; permanent Initiative change; can carry into the next round.

### Changed

- **Threatened Ranged**: Disadvantage when an enemy has you in *their* melee reach; those enemies may spend a Reaction after declaration (wording aligned).
- Radial **Weapon Attack** label → **Basic Attack**.

## [0.9.270] - 2026-08-07

### Changed

- **Combat carousel**: removed the old portrait HP/Stress resource bars. Stress now uses a segmented bar under HP in the same layout (Healthy → Breaking).

## [0.9.269] - 2026-08-07

### Added

- **Reaction Window chat card** after damage (post-phasing): lists who can still react and which powers they have — the hit target plus allies within 4 m with Ally Reactions — so the table sees the window before the spend dialog.

## [0.9.268] - 2026-08-07

### Fixed

- **Reaction: Evade** now applies against the triggering attack: dialog preview shows `Evade → Evade+bonus vs Attack total` and whether the reaction would **negate** the hit before you spend it. If `(Evade + bonus) > attack total`, damage is cancelled (no roll). Removed the old “not applied retroactively — track manually” note.

## [0.9.267] - 2026-08-07

### Changed

- **FilePicker**: sheet image edit no longer falls back to the deprecated global `FilePicker`; uses only `foundry.applications.apps.FilePicker.implementation` via `getFilePickerClass()`.

## [0.9.266] - 2026-08-07

### Fixed

- **NPC Range Short/Long semantics** (Players Guide Threatened Ranged + range bands): sheet **Short** is the gifted full-pool band (0…Short), **not** a minimum attack distance. Any target within **Long** can be selected, including 1–2 m. Beyond Short, Medium/Long reduce the dice pool (100% / 75% / 50%). Martial NPC ranged attacks use **Threatened Ranged** (Disadvantage + Reaction/OA window) when enemies are in melee reach; spells stay exempt. Labels renamed Min/Max → Short/Long; Long selectable 8–48 m.

## [0.9.265] - 2026-08-07

### Fixed

- **NPC Range targeting stall**: clicking a token outside Long range no longer silently cancels; warn with distance. Debug logs list nearby token distances and confirm when the attack card is created.

## [0.9.264] - 2026-08-07

### Changed

- **NPC targeting debug**: verbose `[MS NPC Targeting]` logs on sheet write, form submit, radial build, and attack select — dumps combat-visible attack list, token vs world comparison, power items on the actor, and which branch (Melee AoE / single / Range) will run. Hard dialog blocks removed; live row re-read remains.

## [0.9.263] - 2026-08-07

### Fixed

- **NPC Melee AoE still opening after sheet clear**: `system.phases` object-shaped data is now coerced to an array (combat no longer falls back to a stale root Melee AoE row). Targeting is mirrored to root + `flags.mastery-system.npcTargeting`, synced to world/token actors, and hard-blocked before the Melee AoE dialog when live AoE is off.

## [0.9.262] - 2026-08-07

### Fixed

- **NPC Melee AoE always opening**: targeting is now persisted by replacing the whole attack row / `phases` array (dot-path updates into phase attacks were sticky). Combat re-resolves Melee/Range + AoE from live actor data on select, so `—` / Range cannot still open Melee AoE. Louder `[MS NPC Targeting]` console logs.

## [0.9.261] - 2026-08-07

### Fixed

- **NPC attack targeting UI**: Row 1 is **Melee / Range** with Reach 1–8 or Min/Max 12–24; separate **AoE** row (`—` = normal single-target). Removed sticky AoE-Form / Fern-Minimum leftovers.
- **NPC AoE off is authoritative**: radius `< 2` / `—` hard-writes `npcAoeRadiusM: 0` + `npcAoeShape: 'none'` on the actor so combat no longer opens Melee AoE from stale data. Switching Melee↔Range also clears AoE and resets meters.
- **Radial / description**: AoE gated only by radius ≥ 2 m (ignore leftover shape); descriptions use `Melee` / `Range` and only show AoE when active. Console debug logs on sheet switch and radial resolve.

## [0.9.260] - 2026-08-07

### Changed

- Version bump for Foundry package refresh (includes 0.9.259 NPC Fernkampf / AoE clear fixes).

## [0.9.259] - 2026-08-07

### Fixed

- **NPC Fernkampf**: Reach/Fern now uses explicit `melee`/`ranged` values (empty Reach no longer fails to persist); switching to Fern bumps meters into 12–24.
- **NPC AoE off**: "—" submits `0` so a stuck 2 m radius is overwritten; shape clears with it.
- **NPC print**: Reichweite no longer renders as `1,2,3,4,5,6,7,8` (Handlebars `range` helper collision).

## [0.9.258] - 2026-08-07

### Changed

- Version bump for Foundry package refresh (includes 0.9.257 NPC sheet dropdown + AoE fixes).

## [0.9.257] - 2026-08-07

### Fixed

- **NPC sheet dropdowns** (Angriffspool, Schaden, Angriffe/Runde): removed a broken `_prepareSubmitData` override that could drop saves; fixed Handlebars `selected` paths so choices stick after re-render.
- **NPC AoE**: starts at **2 m** when a shape is chosen; **— / 0** clears AoE and the attack is normal again.

## [0.9.256] - 2026-08-07

### Fixed

- **AoE targeting on Foundry v14**: placement preview no longer crashes on removed `getSnappedPosition` — snaps via `getCenterPoint` / `getSnappedPoint`, paints hex/circle under the cursor again.
- **NPC AoE stuck on**: empty/"Keine" AoE shape now clears persisted shape+radius; AoE mode requires shape **and** radius > 0.
- **NPC ranged AoE** enters cursor placement (hostile-zone) instead of single-target ranged mode.
- Melee AoE shows a burst hex preview around the attacker while the primary dialog is open.

## [0.9.255] - 2026-08-04

### Added

- Printable **NPC sheet** (header control „Bogen drucken“): one A4 page per boss phase with Kampfwerte, HP, attacks/powers (pool, damage, range, AoE, Spell/Split, Angriffe/Runde, stress, specials).

## [0.9.254] - 2026-08-04

### Fixed

- NPC radial **ATK** count now follows the live Angriffe/Runde sum (no longer stuck at 1).
- Adding an NPC **phase** copies Evade / Armor / Speed / HP (and attacks) from the previous phase / root sheet instead of resetting to defaults.

### Added

- NPC radial **Active Buff** segment lists catalog Active Buffs for selection.
- Combat carousel: **double-click** a portrait opens that combatant's actor sheet.

## [0.9.253] - 2026-08-04

### Changed

- Moved rulebook markdown from `Rules/` to `docs/Rules/`.
- Pruned outdated docs (v0.9.8 reports, public-release plans, old structure JSON examples). Kept import schema/examples, asset checklist, and catalog audit output.

## [0.9.252] - 2026-08-04

### Removed

- Deleted legacy standalone `tools/artifact-awakening/` module (D&D5e-era prototype). Live Artifact Builder remains in `src/artifacts/`.

## [0.9.251] - 2026-08-04

### Removed

- NPC sheet: freestyle **Spezial-Listen (Schaden / Raises)** block (`npcCombatSpecials` / `npcRaiseSpecials`). Speziale belong on each attack/power.

## [0.9.250] - 2026-08-04

### Changed

- NPC **Angriffe/Runde**: each power appears that many times in the radial menu; **ATK** is the sum of those copies (sheet field is derived/readonly).

## [0.9.249] - 2026-08-04

### Changed

- Encounter Generator: boss HP is substantially thicker (higher TTK, realism pad for raises/exploding, per-phase hit floor) so phases no longer melt in a few player hits.

## [0.9.248] - 2026-08-04

### Changed

- Encounter Generator: fills NPC **Spell** (`npcIsSpell`) and **Angriffe/Runde** (`npcAttacksPerRound`) on generated attack rows; review step can edit both before create.

## [0.9.247] - 2026-08-04

### Added

- NPC attacks: **Spell** checkbox — Casting TN uses hard MR standard (`8 × Mastery Rank` + Spell Resistance) instead of Evade.
- NPC attacks: **Angriffe/Runde** dropdown (1–5) limits how often each power can be used per round (still spends global attack slots).

## [0.9.246] - 2026-08-04

### Changed

- NPC sheet: removed Splash damage field and NPC splash wiring from attacks.

## [0.9.245] - 2026-08-04

### Changed

- NPC sheet: window type label is **NPC**; attack range is **Reach** (1–8 m) or **Fern** (min 12 / max 24 m).
- NPC sheet: Splash/Stress labels clarify W8 counts; Specials dropdown drops Legacy entries and groups Instant / Abklingend / Timed / etc. (no Extra Attack).
- NPC ranged targeting respects minimum range; melee NPC attacks with Reach up to 8 m stay on the melee path.

## [0.9.244] - 2026-08-04

### Changed

- Removed obsolete root `LICENSE` stub; `LICENSE.md` is the sole canonical proprietary license file shipped with the system.

## [0.9.243] - 2026-08-03

### Changed

- Added proprietary source-available licensing structure: `LICENSE.md`, Media and Community Use Policy, Asset Notice, Contributing guide, and Third-Party Notices.
- Clarified free play, monetized media coverage, and paid GM sessions are permitted; official Foundry core remains proprietary with no public modified distributions without written authorization.
- Marked `package.json` as `"private": true` and pointed the license field at `LICENSE.md`.

## [0.9.242] - 2026-08-03

### Changed

- Public-repo cleanup: HTTPS lockfile for clean `npm ci`, player-first README, `RELEASING.md`, allowlist release packaging + fail-fast release workflow (prerelease when < 1.0), removed missing `sample-*` packs, Divine Clash stone icon defaults.
- Docs clarify that Foundry system versions continue on `0.9.x` and the Destroyed Faith rulebook uses an independent version sequence.
- Install `download` intentionally remains on `main.zip` by project policy.
- Removed dedicated debug/trace logging infrastructure (logger, combat/DR/stone debug helpers and settings).

## [0.9.241] - 2026-08-02

### Changed

- **Critical(X)** is a per-round attack quota: up to X attacks receive Critical each Round. Attack Dice always explode on **7–8**; Damage Dice never explode; X is never explode strength. Round quota resets each combat round (`RoundState.criticalQuota`).
- Catalog audit: `ab-critical` is `correct` (no longer `requires-rule-decision`).

## [0.9.240] - 2026-08-01

### Added

- **Summons V2 Bond Ritual UI:** Full create / token shop / skills / specials / body powers / dissolve workflow (`SummonBondDialog`). Stone Powers Summons tab lists `summonBonds` only.
- Summon combat helpers: shared Bond attack budget, Special once/round, Reaction once/round (`summon-combat.ts`).
- Critical resolution isolator + docs (`critical-resolution.ts`, `docs/CRITICAL-RESOLUTION.md`).
- Verification tests for Weaken/Soulburn, saves removal, senses, reactions, summons, Critical isolation.
- Abschlussbericht: `docs/RULES-V098-COMPLETION-REPORT.md`.

### Changed

- Legacy Familiar editor removed as canonical Summon creation path (migration-only).
- Artifact Summon Token Generator clarified as +4 bonus Tokens per Artifact Summon Stone (not a conflict with Bound Stones ×8).
- Summon actor sheet surfaces V2 bond fields.

### Removed

- Familiar draft editor from Stone Powers Summons tab.

## [0.9.239] - 2026-08-01

### Added

- Machine-readable Rules↔Foundry catalog audit (`npm run audit:catalog` → `docs/catalog-audit.json`).

### Fixed

- Active Buff Evade / Evade+TempHP / Armor+Evade curves aligned to Rules tables.

## [0.9.238] - 2026-08-01

### Changed

- **Rules v0.9.8 alignment:** Base Speed **8 m**; Movement Powers replace normal Movement for the round; Active Buff Critical wires into attack explode-on-7–8; Root reduces by Mastery Rank at turn start; Skill category Awareness → Perception; Active Buff Armor/Evade curve synced to +5…+65; Summon Aura radii banded 8/16/24/32 m.
- **Summons V2:** Universal Summon Bond model (`system.summonBonds`) with Tokens = Bound Stones × 8, one Movement Mode 8–16 m, Bond vs Body upgrades, migration from legacy `familiars`.

### Removed

- Awareness / Heightened Senses passives from the catalog (Combat Senses use the Sense Slot).
- Orphan `dist/utils/saving-throws.*`; Tower weaken-save step disabled; condition saveTypes cleared.

### Added

- Migrations: `speed-8m`, `summon-v2`.
- Tests for Summon Bond rules and Rules v0.9.8 combat/catalog samples.

## [0.9.237] - 2026-07-31

### Changed

- **Hit blood FX uses Health Level outcome + sheet Blood Color:** Damage apply now spawns blood under the target token after HP is actually applied. Chip damage inside the same health level draws a few animated splatters; depleting a bar / dropping to the next health level spawns a large animated puddle. Color comes from `system.bloodColor` on the character or NPC sheet (default dark red).

## [0.9.231] - 2026-07-30

### Added

- **NPC attacks can deal Stress damage (`npcStressD8`):** New "Stress Nd8" dropdown (1–4d8) on every NPC attack row (base + extra attacks, with and without phases). On a hit, the dice are rolled plain (non-exploding, like Social Combat stress) and applied via the stress pipeline — the target's Stress Armor (floor(Resolve/8)) mitigates automatically. The chat shows a dedicated stress line and the roll appears in the damage-card details; the radial attack description lists "Stress: Nd8".
- **Generated bosses carry a signature stress attack:** Every encounter-generator boss gets exactly ONE attack per phase cycle with a stress rider — preferably the first direct single-target damage row. Minor/standard bosses inflict 1d8, major/mythic 2d8. Adds and environment zones never deal stress. The journal cycle table shows it as e.g. "6d8 + 2d8 Stress". Re-generate existing encounters (or set the dropdown manually) to pick it up.

## [0.9.230] - 2026-07-30

### Fixed

- **Generated bosses are no longer paper-thin (49 HP vs a MR 2 party):** The encounter generator sizes boss HP from party DPS × target time-to-kill, but the party damage estimate missed artifact weapons entirely (only `weapon`-type items were scanned — a Monarch Greatsword wielder fell back to 2d8) and ignored attack-power bonus dice (+2–4d8 riding on the weapon). Player hit damage is now estimated from the best weapon (real OR equipped artifact weapon) plus the strongest attack power — or the strongest spell when it out-damages that combo. A 4-player MR 2 party with 5d8 artifact weapons + 3d8 powers now yields ~600 boss HP across phases instead of 49. Threat Report duration and add durability (minion HP) use the same metric and are fixed along with it. Re-generate existing encounters to pick up the new math.
- **NPC sheets can scroll again:** An ApplicationV2 migration regression — V1 core CSS gave sheet windows `overflow-y: auto`, V2 windows clip instead, and the sheet root is now a `<div>` the old flex-`<form>` rules never match. Long sheets (e.g. generated NPCs with many attack rows) were cut off with no scrollbar. The V1 scrolling behavior is restored for all mastery sheets (NPC, Summon, Character, Item).

## [0.9.229] - 2026-07-29

### Fixed

- **Primary AoE targets can Dive for Cover too:** The rules grant the Reaction to every creature inside the area, but v0.9.228 only offered it to secondary targets. After a successful Area-TN roll the primary target is now asked first — spending its Reaction and moving fully outside the area skips its damage dialog entirely. Secondary targets still resolve normally (with their own Dive-for-Cover prompts and Hex/Sundered splash dice) even when the primary escaped, since the single Area-TN roll hit them all.

## [0.9.228] - 2026-07-29

### Changed

- **AoE attacks roll once vs the fixed Area TN (8 × Source Mastery Rank):** Per the updated Players Guide, AoE attacks no longer roll against the primary target's Evade or a Casting TN + Spell Resistance — the attack card shows "Area TN: X (8 × Mastery Rank Y)" and a single roll decides the whole area: on a success every valid non-excluded target is hit. Raises still add +4 each to the Raise TN, and AoE spells keep their spell mechanics (Blood Raises, spell cost split). The "no primary target" splash path now also makes this Area TN roll (previously it applied splash with no to-hit at all) — a miss affects nobody.
- **Secondary AoE targets: Dive for Cover replaces the Body save:** Instead of rolling Body vs MR×8, a creature in the area may now spend its Reaction on Dive for Cover — move up to 2 × its own Mastery Rank meters; fully outside the area = not affected (movement does not provoke Reactions). The prompt walks through spending the Reaction and confirming whether the token ended up outside.
- **Hex/Sundered now apply to AoE splash damage:** Secondary targets that already carry Hex (when the AoE power is a spell) or Sundered (when it is martial) take +1d8 bonus splash damage per 2 points (rounded up), matching the primary-target damage pipeline. The chat line breaks the bonus out, e.g. "3d8 power + 2d8 Sundered(4)".
- **Encounter generator prices AoE rows against the Area TN:** AoE cycle rows solve their attack dice against the fixed Area TN instead of the party's average Evade, and the Threat Report gains an "AoE-Trefferchance (Area TN X, ignoriert Ausweichen)" line — AoE hit chances are now predictable and party-independent, which is exactly why enemies should carry a few AoE attacks alongside their direct ones.
- **Languages button in character creation is now impossible to miss:** The "Pick Languages" button on the character sheet was completely unstyled and looked inactive. It is now a clearly clickable accented button, and while the character-creation language pick is still missing it renders filled and pulsing; known languages show as tag chips next to it.

## [0.9.227] - 2026-07-29

### Changed

- **Mark is now spent AFTER the damage roll:** Instead of a blind pre-roll dropdown on the damage card, hitting a Marked target now pops a post-roll prompt once the dice are known. The dropdown shows the exact outcome of every option — e.g. "Mark 4: 30 → 45 damage (+15)" — so the attacker only spends Mark when it actually gains something. If no damage die lies below the possible floor, no prompt appears at all (the roll details note "nothing to gain") and the Mark stays on the target. Runs after the Faith-Fracture reroll decision so the floor applies to the final dice; Mark is still consumed only by the amount actually spent, never twice on a reroll.

## [0.9.226] - 2026-07-28

### Added

- **Damage rolls can be rerolled with a Faith Fracture:** After all damage dice are rolled — but before Mark spend, status effects, or damage application touch the target — the attacker sees the total and may spend 1 Faith Fracture to reroll ALL damage dice once (the new result is final, per the one-reroll-per-roll rule). Only offered to player characters with a Fracture available; the prompt lists the full dice breakdown so the decision is informed.

### Changed

- **Document sheets migrated to ApplicationV2:** Character, NPC, Summon, Item, and Artifact sheets no longer extend the deprecated V1 `ActorSheet`/`ItemSheet` (the "V1 Application framework is deprecated" console error on sheet open is gone). Templates and behavior are preserved: tabs remember their active state across re-renders, the equipment grid and item lists remain drag & drop sources, fields still auto-save on change, and the rich-text bio/description editors now use Foundry's native `<prose-mirror>` element. The "Bogen drucken" button moved into the sheet window's control menu (V2 has no free-form header buttons). Note: classic `Dialog` prompts (damage confirmations etc.) are still V1 — support runs until Foundry v16; DialogV2 migration is a separate follow-up.

## [0.9.225] - 2026-07-28

### Fixed

- **Melee AoE ally filter no longer swallows NPCs:** The v0.9.224 ally heuristic treated "both tokens Hostile" as allied (meant for GM/NPC attackers) — in scenes where every token carries the HOSTILE default disposition this flagged ALL burst candidates as allies and left the primary dropdown empty. Allies are now strictly the player side: player characters (actor type `character`, regardless of token disposition) and FRIENDLY-disposition tokens. NPCs (e.g. a combat dummy) are never filtered out. The same PC↔PC rule was added to the AoE zone panel's ally detection for consistency.

## [0.9.224] - 2026-07-28

### Added

- **Melee AoE primary dialog: pre-checked ally filter:** The "Melee AoE — Primary target" dialog now carries an "Exclude allies/players (Verbündete ausnehmen)" checkbox, checked by default. Allied tokens (same disposition side, same actor, or shared player owner) disappear from the primary dropdown AND from the secondary splash pool; unchecking re-allows friendly fire (allies are marked "(ally)" in the list). If only a single ally stands in the burst, the dialog now opens instead of silently auto-targeting them; if the filter leaves no valid target, Confirm aborts with a hint.

## [0.9.223] - 2026-07-28

### Added

- **New Wits Stone Power "Seize the Moment" (`wits.initiativeShop`):** The rules-sanctioned "Additional Initiative Shops" access — assign it in the Stone Powers dialog to roll Initiative again and reopen the Initiative Shop; the new roll replaces the current score. Repeated uses simply cost more Stones via the tier ladder. The Wits pool now carries 5 powers; the Stone Powers dialog renders every pool power instead of a fixed four.

### Fixed

- **Initiative no longer rerolls every round:** The round-advance pipeline ran the full initiative phase (fresh rolls + Initiative Shop for everyone) after Stone Powers in every round. Per the Players Guide ("Initiative is not rolled again at the start of each Round"; the Shop "is normally available only immediately after the initial Initiative roll"), rounds 2+ now keep the existing Initiative and only re-sync the turn pointer to the highest remaining score.
- **Wits "Initiative Boost" was a no-op:** The power wrote `stoneBonuses.initiativeBonus` into the round state, but nothing ever read it. Now: in round 1 (stones are assigned before the initiative roll) the roll folds the bonus into the score; in rounds 2+ the bonus is applied directly to the persisted Initiative and the turn order updates. Since the boost lasts "this round", it is recorded (`msInitiativeBoostThisRound`) and reverted when the next round starts.
- **A roll can now really only be rerolled once:** The original message was marked as consumed after a Faith Fracture reroll, but the reroll's own result message was created with `canReroll: true` — rerolls could be chained indefinitely. Reroll results (both the bare roll replay and the full attack-pipeline reroll) are now flagged `isRerollResult`: no reroll button is rendered on them and the GM-side executor rejects them outright. Single-die abilities (Advantage's "reroll each 1 once", Sentinel "Oracular Overclock") are unaffected and already enforce once-per-die.

## [0.9.222] - 2026-07-28

### Added

- **AoE target panel: "Verbündete/Spieler ausnehmen" checkbox:** The radius target-selection panel (zone placement) now carries a hard ally filter — allies/player characters are never pre-selected, the "All" button skips them, and manual clicks on ally tokens are rejected with a hint. Defaults to ON for attack zones (hostile-zone AoE / attack-slot powers) and OFF for utilities (healing, buffs). Unchecking re-allows friendly fire; the "Allies" quick-select button unchecks it automatically.
- **Spell Raise cost dropdown:** The free-text "Spell cost split" number inputs on attack cards are replaced by a single dropdown listing only complete, valid splits (e.g. `2d8 damage`, `1d8 damage + 1 Special value`, `2 Special value`) — always summing to the exact Raise cost. Options rebuild live as Raises are added/removed; paying purely with Special value no longer requires touching a dice field.

### Changed

- **Radial menu button: new icon and position:** The Token HUD button that opens the radial menu now shows a concentric target glyph (red/yellow/blue rings, `assets/icons/radial-target.svg`) and sits centered in the HUD's middle column — between the left (Start/Exit Combat) and right (configuration) button stacks instead of directly below them.

### Fixed

- **Combat carousel survives page reloads:** The carousel only opened on the `combatStart` hook, so reloading mid-encounter lost it until the next combat. On canvas ready, an active started encounter now reopens the carousel automatically with current values.

## [0.9.221] - 2026-07-28

### Fixed

- **Failed Raise now actually subtracts the Raise Cost from damage:** A failed Raise (hit Normal TN, missed Raise TN) rolled the power's full damage — e.g. 2d8 instead of 0d8 for an MR 2 character who paid 2d8 for the Raise. The declared raise plan lives in a fragile DOM attribute on the Roll button (`data-raise-plan`) that a chat re-render silently resets to `[]`, while the Raise TN survived into the roll. The Raise TN actually rolled against is now the ground truth: if it implies more Raise slots than the transported plan carries, the missing slots are rebuilt as default damage Raises — so the cost (MR d8 per Raise, Players Guide "Martial Raise Cost") is always paid on a partial outcome and the effects land on a full success. Applied in both the roll handler and the damage dialog.
- **Damage card names the lost cost:** The partial-outcome line now reads e.g. `Raise failed — applying — (Raise cost of 2d8 lost)` instead of the ambiguous `(cost lost)`.
- **`Maximum call stack size exceeded` on scene load for character tokens:** `prepareBaseData` checked combat membership via `combatant.actor` — that getter lazily builds the synthetic token actor, which was itself mid-construction, recursing through `prepareData` until the stack overflowed (the `_deepClone`/`_safePrepareData` error cascades at startup). The check now compares the stored `combatant.actorId`, which touches no actor construction.

## [0.9.220] - 2026-07-28

### Fixed

- **Status icon hover no longer shows a "question mark":** The carousel status icons used `cursor: help` (arrow with a question mark) and the effect name only appeared via the browser's native `title` tooltip after a 1–2 s delay. Icons now use Foundry's styled tooltip (`data-tooltip`) — hovering shows e.g. `Sundered (4)` promptly — and a normal pointer cursor.

### Changed

- **Real status effect icons:** All 30 status icon SVGs (`assets/icons/status/`) were identical placeholder graphics (dark square with a gray dot). Each effect now has a distinct, recognizable glyph — blood drop (Lacerate), flame (Ruin), snowflake (Slow), broken sword (Sundered), crosshair (Mark), holy shield (Smite), etc. These feed `CONFIG.statusEffects`, so the token HUD radial benefits too. Intended as readable interims until artist icons land.

## [0.9.219] - 2026-07-28

### Fixed

- **Faith Fracture reroll of an attack now continues into the damage flow:** Rerolling a missed attack that then hit was a dead end — the reroll only replayed a bare roll message from the stored recipe, disconnected from the attack card, so the damage dialog never opened. Attack rolls now remember their attack card (`attackCardMessageId` in the roll recipe), and a Faith reroll re-runs the full attack pipeline from that card: fresh dice with the same parameters (incl. the planned raises), and on a hit the damage dialog + follow-ups (AoE secondaries, specials) as usual. Nothing is double-paid — action cost, Dread gate, Disrupt consumption, and Blood-Raise HP are skipped on the reroll since the original roll already settled them. Player rerolls run on the player's client (where their raise plan lives); GM-forced NPC rerolls run on the GM's client.
- **`ActiveEffect application phase … has already completed` error cascades:** `MasteryActor` overrode `prepareData()` and re-ran `prepareBaseData()`/`prepareDerivedData()` after `super.prepareData()` — in Foundry v13 that corrupts the ActiveEffect phase tracking on synthetic (unlinked token) actors, making every subsequent update on the token log error cascades and silently overwriting ActiveEffect changes to derived values. The override is gone; core's v13 preparation order (base → embedded/effects "initial" → derived → effects "final") now runs exactly once per cycle.

## [0.9.218] - 2026-07-28

### Added

- **Attack card shows the on-hit damage total:** The raise panel preview now sums weapon dice + power dice, e.g. `On hit (before raises): 9d8 total (5d8 weapon + 4d8 power), Precision(2)` — and updates live while planning raises, so the raise decision can be made against the real total. Spells and flat unarmed damage keep the plain power summary. The former label "Before roll" was misleading (it was never the attack pool — the To-Hit dice come from the attribute shown above).

### Fixed

- **Weapon specials no longer render as `[object Object]`:** Artifact virtual weapons carry specials as `{ specialId, value }` refs (conventional weapons carry strings). Attack card and damage dialog now format both shapes readably (e.g. `Precision(2)`) and drop empty entries — the "Weapon specials" row disappears entirely when the weapon has none.

## [0.9.217] - 2026-07-28

### Fixed

- **Finesse applies to weapon-carried attack powers:** Attack powers like Melee Single Attack resolved their To-Hit attribute from the mastery tree (e.g. Crusader → Might) before the wielded weapon was ever considered — a Finesse artifact still rolled Might. Non-spell attack powers roll the equipped weapon's dice, so a Finesse weapon (innate or artifact Free Trait) now swaps the To-Hit to Agility, beating the tree default. Spells keep their casting attribute; damage is unaffected. Works regardless of artifact activation (the weapon profile counts even while powers are still locked).

### Changed

- **Node Editor: Base Type kit is remove-only.** Picking a Base Type takes over the weapon's full kit (innates + specials). Innate/Special rows are now read-only: the GM may remove entries (×) that don't fit the artifact — but can no longer swap or hand-add them (both "+ Add" buttons removed). Special Strength (the X value) stays editable. The single Free Trait dropdown is the only allowed innate addition; new Specials come from the artifact's Powers. Existing hand-added entries survive and remain removable.

## [0.9.216] - 2026-07-28

### Added

- **Free Trait for weapon artifacts (Node Editor):** New dropdown below Base Type in the Edit Artifact Node dialog. Every weapon artifact may pick exactly ONE weapon property for free on top of its base type's innate abilities — eligible: Finesse, Light, Versatile, Reach (+1 m), Balanced, Defensive (Spell Focus, drawbacks and delivery modes excluded). Root-node only; child levels inherit the pick, and swapping it cleanly replaces the old trait across the whole tree (`system.freeTrait` + folder sync). The trait is stored inside `artifactWeapon.innateAbilities`, so info panel, damage dialog, print sheet and combat pipeline pick it up automatically.

### Fixed

- **Reach works on artifact weapons:** The melee reach bonus in the radial menu only read real equipped weapon items; an equipped artifact weapon with `Reach (+1 m/+2 m)` now extends reach too.

## [0.9.215] - 2026-07-28

### Fixed

- **NPC / Summon defenses read live from the stat block:** Armor, Evade and Speed now come from the editable NPC sheet fields (per-phase for phased bosses) instead of `Mastery Rank + equipment items` — an NPC with Armor 12 no longer soaks with just its MR (2). Mid-combat edits and phase switches reach the hit/damage pipeline immediately; Corrode/Expose maluses and buffs still apply on top.
- **Attack Specials land on the target again:** Catalog Martial powers (Melee/Ranged Single & AoE) carry a `SPECIAL` picker placeholder in their template levels. The attack card / damage dialog re-read level data from the raw template, so the placeholder was never bound to the chosen Special — the pipeline emitted a meaningless "Special(X)" and no status effect was applied. Both loaders now prefer the item's bound levels and re-bind `chosenSpecial`; an unbound placeholder can no longer reach the damage/status pipeline.

### Added

- **Combat Carousel status icons:** Each combatant card shows small icons for the Specials actually affecting it (from `system.statusEffects`), with "Name (X)" hover tooltips. Only present effects are listed (value > 0 or valueless conditions like Prone) — no buff/passive noise; updates live when effects change.

## [0.9.214] - 2026-07-28

### Changed

- **All artifact slots accept all attributes:** The per-slot attribute restriction for Stone Functions (e.g. Body = Vitality/Might only, Head = Wits/Intellect only) is obsolete per the updated rulebook. `ATTRIBUTE_ACCESS_BY_SLOT` now lists all 7 Attributes (Might, Agility, Vitality, Intellect, Resolve, Influence, Wits) for every slot; `isAttributeAllowedForStoneFunctionInSlot` accepts any valid Attribute on any slot. No migration needed — the GM Node Editor already offered all attributes and the actor-side aggregator reads the pick's attribute directly.

## [0.9.213] - 2026-07-28

### Changed

- **Vitality Stone Powers aligned with the rules table:** The Vitality pool is now exactly Temporary HP / Endure Special / Remove Scar / Extend Active Buff. Removed the off-rules `vitality.armor`, `vitality.endureInjury` and `vitality.secondChance`.
- **New: Endure Special (Vitality):** Reduce one negative diminishing Special on yourself by 2/4/8/12 (picker dialog when several apply; Regeneration is never reducible).
- **New: Extend Active Buff (Vitality):** The next Active Buff you activate this turn lasts +1/+2/+3/+4 rounds. Stored as a per-turn stone bonus (`extendActiveBuffRounds`), consumed on activation in `activateActiveBuff`, highest value wins (totals, no stacking), unconsumed extensions expire with the turn.
- **Wyrm Scales (Heavy) L3:** Armor Stone Support now targets `might.armor` (the ARMOR Stone Power lives in the Might pool; Might is slot-legal for Body artifacts). Echo Artifacts pack regenerated — no `vitality.armor` references remain.
- **Tests:** Vitality pool asserted against the rules table; dedicated specs for Endure Special and Extend Active Buff; tree-builder expectations updated (1162/1162 green).

## [0.9.212] - 2026-07-28

### Fixed

- **Radial info panel weapon damage:** Attack options now show the damage of the weapon that will actually roll — equipped weapon, artifact weapon (live-derived dice, e.g. 5d8 two-handed L1) or unarmed — instead of a hardcoded `1d8` fallback that ignored artifact weapons.
- **Inactive artifacts grant no powers:** Equipped but not-yet-activated artifacts no longer surface their level-progression actives, movement, reactions or their own attack entry in the radial menu. Their weapon damage still applies (an inactive artifact greatsword keeps its derived dice); the generic "Weapon Attack" reappears so it stays usable.
- **Artifact attacks always use the artifact weapon:** The artifact's own (non-spell) attack rows force its weapon into the attack/damage pipeline via `forcedWeaponItemId` — including the artifact's own ranged rows — carried through chat-card flags into the damage dialog.

### Changed

- New helper `artifactPowersUnlocked(actor, item)` in `artifact-actor-rules.ts` (activation flag → evolution-tree link → legacy ad-hoc artifacts stay enabled).
- **Test suite green again (1156/1156):** Repaired 12 stale tests that asserted outdated specs — worn+dedup requirements for artifact-bound stones, Faith Fractures default 8, Vitality's 5th Stone Power (Remove Scar, 33 total), canonical `tempHP` field, Moonlight Judgment's Smite AoE template, Shadowgrave armor-weight-class bonus split.

## [0.9.211] - 2026-07-20

### Added

- **Mark spend choice:** Damage card lets the attacker optionally spend 0..Mark for a Damage Floor (no longer auto-spends).
- **Smite runtime:** `Smite(X)` adds +Xd8 vs Undead/Fiend only; never stored as a lasting status.
- **NPC creature type:** Sheet dropdown (`system.creatureType`) including Undead and Dämon/Fiend for Smite validity.

### Changed

- Mark floor helpers live in `src/dice/mark-floor.ts`; creature-type helpers in `src/utils/creature-type.ts`.

## [0.9.210] - 2026-07-15

### Added

- **Power Catalog:** ~25 missing templates from the updated Rules books — Health Level Heal, Cleanse Absorption, Mental Attack / Mind Illusion; Ward, Telepathy / Mind Link, Bound Host, Thornhide, Invisibility, Parry, Absorption, Damage Negation; Summon Damage/Armor Auras, Thorns, Reinforced Parry / Intensified Absorption / Reinforced Damage Negation; Repositioning Intercept, Reactive Cleanse, Riposte, Reflection, Reactive Overload.
- **Rules source MDs** under `Rules/` (actives, active-buffs, passives, reactions, movement, artefacts, player-guide).

### Changed

- **Ward Passive** replaces Mini-Cleanse in the catalog and Tower Wizard; Mini-Cleanse is no longer offered as a pickable template.

## [0.9.209] - 2026-07-14

### Changed

- **Combat Senses (Battle Sheet):** Compact display under Movement, aligned with Passives — only the active sense (special sense replaces Normal Combat Awareness when granted) plus optional Darkvision. Removed Sense Slot picker grid and “pick exactly one” copy from print and character sheet.
- **Combat Senses (logic):** Granted special sense auto-replaces Normal Combat Awareness when no explicit slot is set.

## [0.9.208] - 2026-07-14

### Fixed

- **Combat Senses templates:** Corrected mismatched Handlebars block tags (`{{#unless}}…{{/if}}`) in the battle-senses partial and character print sheet, which prevented mounting Combat Senses and blocked “Bogen drucken”.

## [0.9.207] - 2026-07-14

### Fixed

- **Character sheet open loop (root cause):** `_onUpdate` no longer calls `super._onUpdate` while the sheet is still mounting (`!rendered` or mid-render). World migrations / actor updates during open were interrupting `super.render()` before `activateListeners` ran.
- **Combat Senses deferred mount:** Battle-senses UI renders from a partial *after* `activateListeners`, outside the initial form paint.
- **Removed render coalescing** that could confuse Foundry v14's Application lifecycle; nested renders are blocked with `#isRendering` instead.

## [0.9.206] - 2026-07-14

### Fixed

- **Character sheet open loop (continued):** Combat Senses granted-sense checkboxes and Darkvision no longer use form-bound `name="system.combatSenses.*"` fields (artifact-granted senses showed checked while actor data differed, re-triggering Foundry form sync). All battle-senses controls now use explicit change/click handlers with `{ render: false }` updates. Attribute-baseline migration runs before the first paint and no longer auto-re-renders the sheet.

### Added

- **Regression test:** Battle-senses block must not contain any `name="system.combatSenses.*"` form bindings.

## [0.9.205] - 2026-07-14

### Fixed

- **Character sheet open loop:** Combat Senses Sense Slot no longer uses form-bound radio inputs (which caused infinite re-renders on sheet open in Foundry). Selection uses explicit button clicks; overlapping renders are coalesced.

### Added

- **Regression test:** `character-sheet-combat-senses-regression.test.ts` blocks reintroducing `activeSenseId` form radios in the battle-senses slot grid.

## [0.9.204] - 2026-07-13

### Added

- **Combat Senses on battle sheet:** Prominent sense-slot picker at the bottom of the character sheet Attributes tab and on the printed battle sheet (page 5).
- **Guided Combat Package Wizard:** Player-facing copy and decision flow — Passive 2 intent groups, attack delivery step, Special Focus step, Active Buff explanations, and a “What you built” review summary with simple rotation.

## [0.9.203] - 2026-07-13

### Fixed

- **Dialog header icons:** Scope Laviossa/uppercase styling to `.window-title` only; exclude `.header-control` from generic button theme rules; restore Font Awesome rendering on close/menu icons and window icons.

## [0.9.202] - 2026-07-13

### Fixed

- **Foundry v14 init / character sheets:** Register actor/item sheets before status-effect setup; wrap status-effect registration in try/catch so init cannot abort before sheets exist.
- **Foundry v14 status effects:** Upsert record entries in place (never assign `statuses` arrays); retry registration on `ready`.

## [0.9.201] - 2026-07-13

### Fixed

- **Foundry v14 status effects:** Do not assign a `statuses` array on v14 configs — the field is Set-backed and crashes on assignment.
- **Migration settings:** Register all game settings at the start of `init` so cutover flags exist even when later init steps fail.
- **FilePicker:** Removed debug logging that accessed the deprecated global `FilePicker` getter.

## [0.9.200] - 2026-07-13

### Fixed

- **Foundry v14 status effects:** Do not assign an array to `CONFIG.statusEffects` — v14's array-like getter is backwards-compat only; mutate the underlying record in place instead.

## [0.9.199] - 2026-07-13

### Fixed

- **Foundry v14 init:** Register status effects as a keyed record instead of an array so module init no longer crashes with `statusEffects.push is not a function`.
- **Foundry v14 migrations:** Use `foundry.data.operators.ForcedDeletion` for flag/XP field cleanup instead of legacy `-=` syntax.
- **Foundry v14 FilePicker:** Resolve the v14 application FilePicker implementation in artifact builder and character sheet.

## [0.9.198] - 2026-07-13

### Changed

- **Foundry compatibility:** Raised minimum/verified core version to **14** for native ProseMirror text color support.

### Fixed

- **Journal text color:** Use Foundry v14 `_fontColorPrompt` when available; fixed dialog crash from `game.i18n.cancel()` and restored broken `escapeAttr` helper.

## [0.9.197] - 2026-07-13

### Fixed

- **Journal text color:** Color dialog no longer crashes on open — use Foundry v13-compatible cancel label instead of `game.i18n.cancel()`.

## [0.9.196] - 2026-07-13

### Fixed

- **Journal text color:** Resolve the ProseMirror editor from live `.ProseMirror` DOM (dropdown menus render outside `prose-mirror`), probe all marks for color support, and fall back to HTML span insertion when no color mark is available.

## [0.9.195] - 2026-07-13

### Fixed

- **Journal text color:** Use Foundry v13 mark `class` attributes for colors instead of fragile schema extension; improve editor view registration and prevent duplicate unsupported warnings.

## [0.9.194] - 2026-07-13

### Fixed

- **Journal text color:** ProseMirror editor no longer crashes on open — schema extension now preserves Foundry's editor plugins when rebuilding `EditorState`.

## [0.9.193] - 2026-07-13

### Fixed

- **Journal text color:** Foundry v13 lacks a core color mark — the system now extends the ProseMirror schema with a `textStyle` mark on editor creation, and improves color-mark detection and view resolution.

## [0.9.192] - 2026-07-13

### Fixed

- **Journal text color:** Fixed crash on click (`Cannot read properties of null (reading 'view')`) when resolving the ProseMirror editor from the journal toolbar.

## [0.9.191] - 2026-07-13

### Fixed

- **Journal text color:** "Choose Text Color" now opens the color dialog — intercepts dropdown/toolbar clicks directly instead of relying on Foundry's action dispatch (and skips broken native `_fontColorPrompt` stubs).

## [0.9.190] - 2026-07-13

### Fixed

- **Journal text color:** Palette button is now injected into the ProseMirror toolbar DOM (journal editors ignore custom `getProseMirrorMenuItems` buttons). Also adds a palette dropdown as fallback.

## [0.9.189] - 2026-07-13

### Fixed

- **Journal text color:** Palette button now opens the color dialog (removed erroneous mark binding) and sits at the start of the ProseMirror toolbar.
- **Skill roll labels:** Removed confusing `½` suffix from pool buttons (e.g. `4k2` instead of `4k2½`); reduced pools now use `round(attr/2)` instead of floor.

### Changed

- **Skill rolls:** Character sheet skill roll execution reuses shared dice-pool helper (consistent penalties and reduced-pool math).

## [0.9.188] - 2026-07-13

### Fixed

- **Journal / ProseMirror text color:** Text Color now appears under **Format → Inline** in Foundry v13 journal dropdown menus (v0.9.187 only registered a flat toolbar button).

### Added

- **Tests:** Dropdown menu wiring for journal text color (`appendFontColorDropdownEntries`).

## [0.9.187] - 2026-07-13

### Added

- **Journal / ProseMirror text color:** Palette toolbar button and format-menu entry for choosing text color in Foundry v13 editors (journals, sheets, etc.).
- **Tests:** `tests/prosemirror-font-color.test.ts` for color-mark schema detection.

### Fixed

- **Tyhra Calendar:** Missing `dayIndexFromParts` import in journal flag resolution (build fix for latest-journal sync).

## [0.9.186] - 2026-07-13

### Changed

- **Skill roll buttons:** Pool buttons moved before the skill name with compact labels (e.g. `8k2`, `4k2½` for half pool); live updates on pending rank changes preserved.
- **Tyhra Calendar:** Opening now reliably jumps to the latest day journal even when flags omit `calendarId`/`dayIndex` or Foundry timestamps are missing.

### Added

- **Tests:** Expanded calendar latest-journal detection cases (legacy flags, missing timestamps).

## [0.9.185] - 2026-07-13

### Changed

- **Tyhra Calendar:** Opening the calendar now sets the current world date to the most recently created day journal and navigates the view to that month.

### Added

- **Tests:** `tests/tyhra-calendar-latest-journal.test.ts` for latest-journal day lookup.

## [0.9.184] - 2026-07-13

### Added

- **Skill dice pool preview:** Character sheet shows roll dice pool (e.g. `8d8 k2` or `4d8 k2 ½`) directly beside each skill roll button, with full vs half-pool coloring and tooltips (2×MR threshold).
- **Live pool updates:** Pending skill rank changes (+/− before Confirm) update the dice preview immediately when crossing the full-pool threshold.
- **Tests:** `tests/skill-roll-pool-display.test.ts` for half/full pool math and MR floor.

## [0.9.183] - 2026-07-13

### Added

- **Tyhra Calendar:** Full in-system calendar (360-day year, 8 months, Veil Days, seasons) with ApplicationV2 window, journal sidebar button, day journals with stable flags, GM date controls, and `game.masterySystem.calendar` / `game.destroyedFaith.calendar` API.
- **Tests:** `tests/tyhra-calendar.test.ts` (14 cases for date math and year structure).
- **i18n:** Calendar UI strings in English and German (`MASTERY.calendar`).

### Fixed

- **Athletics:** Skill uses Might only (Players Guide).
- **Hand-to-Hand / Defensive Combat:** Primary attributes aligned with skill definitions (Might+Agility / Agility+Vitality).
- **Multi-attribute skill rolls:** Dedicated attribute buttons for skills with multiple primaries (e.g. Hand-to-Hand).

## [0.9.182] - 2026-07-12

### Fixed

- **Incomplete artifact trees:** World seed now detects and repairs trees with fewer than 10 nodes (e.g. Heart of Winter, Heartseeker, Falcon Wide Brim stuck at 1/10). Seed version **41**.
- **Falcon Wide Brim Evade:** Head slot allows `evade` base values; `headArmor` label is **Armor** (+1…+5). `minorFeature` removed from head/feet slot options.
- **Stone Power editor:** Node Editor offers all 7 attributes and full stone-power lists (not limited to Might/Agility per slot).

### Added

- **Artifact Builder:** Incomplete-tree warning + **Repair tree from catalog** button for seeded artifacts.
- **Tests:** Incomplete-tree seed repair, head evade rules, stone-power attribute coverage.

## [0.9.181] - 2026-07-12

### Added

- **General Artifact icons:** Frostbound Returning Axe (`Frostbite.png`), Moonlight Greatsword, Soul Sigil, and Lor Keth's Staff mapped in the icon registry.

### Changed

- **Artifact library seed (v40):** Clearer notifications when new General Artifact trees are created; refresh setting renamed to **Refresh Artifact Library** and documents missing artifacts (Heartseeker, Falcon Wide Brim).

## [0.9.180] - 2026-07-12

### Added

- **Combat Senses runtime:** Registry (Normal Awareness, Darkvision, Life/Mage/Tremor/Sonar/Predator Sense), Sense Slot (`system.combatSenses`), Perception-State auf Actor-Flags.
- **Perception gating:** TN-Berechnung, Targeting-Filter (Melee/Ranged), interaktiver Perception-Check vor Angriffen, Half-Evade vs. unsichtbare Angreifer.
- **Stealth / Invisibility:** Stealth-Roll setzt Hidden + Stealth-Raise-Bonus; Cloak Disruption bei Angriff und Bewegung > 3 m; Round/Turn-Hooks.
- **Character Sheet:** Combat-Senses-Panel (Sense Slot, Darkvision, Granted Senses).
- **Tests:** `tests/combat-senses.test.ts` (15 Tests).

## [0.9.179] - 2026-07-12

### Added

- **Falcon Wide Brim:** General Artifact (Head) — Evade + Predator Sense base values; Falcon Initiative (`wits.initiativeBoost` stone support), Falcon Step (`reaction-reposition`), Falcon Momentum (`reaction-initiative-gain`); custom icon.
- **Reaction: Reposition:** Catalog template for post-trigger legal movement (2 / 4 / 8 m at PL 4 / 10 / 16).

## [0.9.178] - 2026-07-12

### Added

- **Initiative passive:** Catalog template `passive-initiative` (+2…+32 flat Initiative at combat start, before the Initiative Shop); mechanics aggregation and initiative roll integration.
- **Reaction: Initiative Gain:** Catalog template `reaction-initiative-gain` (+2…+32 Initiative after the triggering attack resolves); mid-combat initiative update with turn-order resort for remaining turns.

## [0.9.177] - 2026-07-12

### Added

- **Heart of Winter:** General Artifact (Medium Shield) — Frozen Reserve (`vitality.tempHp`), Glacial Intercept (`reaction-ally-armor`), Frostwave (Melee AoE + Slow); custom icon.
- **Heartseeker:** General Artifact (Heavy Crossbow) — Divided Execution (`active-ranged-weapon-split`), Killing Focus (`agility.crit`), Armorbreaker (`ab-damage-penetration`); Heavy Crossbow weapon profile with stacked Precision; custom icon.
- **General Artifact icons:** Ship `assets/icons/items/general-artifacts/` with Foundry installs.

## [0.9.176] - 2026-07-12

### Added

- **Equipment encumbrance:** Inventory split into three equal 8×9 bands (Normal Load, Encumbered, Heavy Load). Items in Encumbered reduce all roll dice pools by 20%; Heavy Load by 50%. Penalties stack additively with wound penalties and can reduce the pool to zero.

## [0.9.175] - 2026-07-12

### Changed

- **Frostbound Returning Axe:** Level Progression mapped to catalog picks — Stormpower (`might.ignoreArmor` stone support), Frost Throw (Ranged Single + Slow), Rainshield (`reaction-special-increase`); seed version 36.

## [0.9.174] - 2026-07-12

### Fixed

- **Echo artifact icons on install:** Icon migration now resolves `echoArtifactKey` from item flags (not only `system`), so seeded Echo Artifacts upgrade from the chest placeholder to custom PNGs on world load.
- **`game.masterySystem` console API:** Registered on `init` so `refreshEchoArtifacts()` is available as soon as the world loads.
- **Echo Artifacts compendium:** Shipped the compiled `packs/echo-artifacts` LevelDB pack with Foundry installs (was gitignored and missing on Setup download).

## [0.9.173] - 2026-07-12

### Added

- **Echo Artifact catalog mapping:** Oracle Frame, Stonebound Soles, Serpent Scales, and Wyrm Scales (Heavy) now use catalog progression picks instead of authored rows; per-stage template support (`stageTemplateIds`) for mixed pick tracks (e.g. Serpent Evasion + Mobility Buff Extension).
- **Echo artifact icons:** PNG assets for all Echo Artifacts under `assets/icons/items/echo-artifacts/`.
- **Combat Package Wizard — Echo advisor:** Requires Echo selection first; reads Active Buff lines from Echo Artifacts on the character, warns on duplicate defensive Active Buff axes, recommends complementary defenses (Phasing, Damage Reduction), and hides redundant Active Buff options in the picker.
- **Catalog passives:** `extend-buff-mobility`, `extend-buff-armor`, `extend-buff-evade`, and related buff-extension templates for artifact progression.
- **Vitality ARMOR stone power** (`vitality.armor`) for Wyrm Scales (Heavy) stone support.

### Changed

- **Serpent Scales:** Display name and compendium folder; L2 uses `ab-evade` with mobility extension at L5/L8; seed version 35.
- **Wyrm Scales (Heavy):** L2 maps to `ab-armor`; L3 to `vitality.armor` stone support.
- **Dragon Claws:** Lacerate/Push on weapon AoE picks; stone support for Might Melee Damage.
- **Removed Wyrm Scales (Medium)** variant; legacy key aliases to Heavy.

### Fixed

- **Special effects reconciliation** and combat tick/gate edge cases from prior artifact work.

## [0.9.172] - 2026-07-09

### Added

- **Artifact Node Editor — Base Type selector:** A new **Base Type** dropdown at the top of the "Edit Artifact Node" dialog lets the GM build an artifact on a standard rulebook base. Picking a weapon (e.g. Light Crossbow, Greatsword), armor (Light/Medium/Heavy) or shield auto-fills the Slot, Base Profile, damage/armor/shield values, range, innate abilities, specials and the matching Base Value rows from the Players Guide catalog — then everything stays editable, or choose **Custom** to author by hand. The choice is remembered (`baseTypeKey`) and is root-node only, like Slot/Base Profile.

## [0.9.171] - 2026-07-07

### Changed

- **Elorians Echo rename:** The playable Echo formerly listed as Elves is now **Elorians** (`elorians` key). Legacy `elves` actors resolve automatically and are migrated on world load.
- **Elorian Stride artifact:** Replaced the four elemental Elven Stride lineage artifacts with a single **Elorian Stride** feet artifact — Otherworld Reflex, Elorian Cling, Elorian Focus (Crit Stone Support), and True Elorian Stride. Base values now scale Evade (+2…+12) and Movement (+1…+4 m from Level 4). Echo Artifact compendium and seed version bumped.

## [0.9.170] - 2026-07-07

### Fixed

- **Combat Package Wizard — Passive 1 variant step:** Removed sticky positioning from the defense package preview so it scrolls away with the step content instead of covering half the dialog while browsing variants.

## [0.9.169] - 2026-07-07

### Fixed

- **Combat Package Wizard — Passive 2 step:** Second Passive options are filtered by real mechanical category overlap with Passive 1 (including combined passives), not UI subfamily labels. Choosing Armor no longer shows Armor passives or hybrids; choosing Evade hides Evade options but still allows Armor, DR, Phasing, sustain, offense, and other legal categories. Awareness passives are hidden from guided Step 3; the illegal “Reinforce your Main Defense” group is removed. Apply is blocked when Passive 1 and Passive 2 share any category.

## [0.9.168] - 2026-07-07

### Fixed

- **Combat Package Wizard — Passive 1 variant step:** Defense package preview and variant cards no longer break layout (sticky preview stays aligned; mechanic text no longer shows a stray colon mid-button).

## [0.9.167] - 2026-07-07

### Changed

- **Combat Package Wizard — defense flow:** After choosing Main Defense (Armor, Evade, Damage Reduction, or Phasing), a new **Passive 1 Variant** step lets players pick which passive defines their core defense before choosing Passive 2. The wizard preselects the recommended default, shows a sticky defense-package preview, and excludes the chosen Passive 1 from the second-passive list.
- **Passive 2 step:** Clearer copy and grouping so Passive 2 is presented as an additional choice, not a second defense package; Damage Reduction and Phasing are flagged as closed premium subsystems when they appear outside Main Defense.
- **Active Buff choice:** Renamed and expanded — keep the package buff, replace with an offensive buff, or replace with a support/utility buff without changing Passive 1, Passive 2, or Reaction.
- **Review page:** Powers are grouped by Main Defense Package, Second Passive, and Offense, with variant-change and buff-replacement notes when defaults were customized.

## [0.9.166] - 2026-07-07

### Changed

- **Special Effects reconciliation (rulebook):** Renamed `Bleeding → Lacerate`, `Ignite → Ruin`, `Freeze → Slow`, `Poisoned → Blight` across effects, powers, weapons, artifacts, wizard packages, and NPC models. Existing worlds are migrated automatically on load (old status entries, power specials, `vsCondition`/`conditionExpr` gates, weapon/artifact strings).
- **Slow / Mark / Hex / Sundered:** Aligned to the current reference — Slow reduces Speed and only deals end-of-turn damage when the target did not voluntarily move; Mark enforces a minimum die result on the next damage roll; Hex (spells) and Sundered (non-spells) grant the defender +1d8 bonus damage per 2 stacks.

### Added

- **New Special Effects:** `Disoriented` (dice penalty on attacks and sight checks, floored at Mastery Rank), `Disrupt` (reduces on power use), and `Dread` (pre-attack Spirit save). These replace the removed legacy `Blinded`, `Shock`, and `Frightened`.
- **Runtime status engine:** Start-of-turn Tick + decay for diminishing effects (Ruin damage, Blight stress, Regeneration healing), derived-stat maluses (Slow→Speed, Corrode→Armor, Expose→Evade, Soulburn/Weaken→save dice), and movement-based Lacerate/Slow enforcement via token tracking.

## [0.9.165] - 2026-07-07

### Changed

- **Skill checks (rulebook):** Full attribute pool requires skill rating ≥ 2×MR; half pool still allows skill-point spend after the roll.
- **UI — Special Effects:** User-facing “Specials” labels renamed to “Special Effects” across sheets, damage dialog, and item views.

### Added

- **Epic Mastery Roll — dice display:** Rolled dice shown in the overlay (kept dice highlighted, explosions chained); Dice So Nice animation when installed; richer dice summary in chat.

## [0.9.164] - 2026-06-23

### Added

- **Epic Mastery Roll — Echo Cards:** After a successful skill check, matching unused Echo deck cards can be played from the overlay; margin Raises are counted automatically and the card is marked used (with chat flashback).

## [0.9.163] - 2026-06-23

### Changed

- **Epic Mastery Roll — skill dice:** Attribute pick shows roll pool and keep count (e.g. `8d8 keep 4`); skill rolls use attribute pool with highest MR dice kept.

### Fixed

- **Character sheet — Mastery Rank:** MR dropdown stays editable during character creation and can be changed anytime by the GM (owner during creation).

## [0.9.162] - 2026-06-23

### Changed

- **Epic Mastery Roll — skill spend:** On success, no skill spend UI. On failure, spend via up to four MR-sized packets (skill sheet style); live preview turns the result green when TN is met; **Add Skill Points** applies the selection. Skip button removed.

## [0.9.161] - 2026-06-23

### Changed

- **Epic Mastery Roll — dismiss:** Cinematic overlay stays open after all rolls and player actions (Roll, Keep Roll, skill spend). Only the GM closes it with **X**; chat summary still posts when everyone is done.

## [0.9.160] - 2026-06-23

### Changed

- **Epic Mastery Roll — result display:** Roll total replaces the **Roll** button in place (green on success, red on failure).

### Fixed

- **Epic Mastery Roll — auto-close:** Overlay closes for all clients when the last participant finishes; late socket state updates no longer reopen the cinematic after completion.

## [0.9.159] - 2026-06-23

### Fixed

- **Epic Mastery Roll — attribute pick:** Inline attribute buttons now pass the correct actor id in nested Handlebars loops, so selection persists (visible border) and **Roll** enables after choosing an attribute.

## [0.9.158] - 2026-06-23

### Changed

- **Epic Mastery Roll — config:** Challenge MR is a dropdown (MR 2–8, default MR 2). Participants start unselected; only manually added actors join the roll.

### Fixed

- **Epic Mastery Roll — portraits:** Actor portraits resolve correctly in config and overlay (dark frame background, mystery-man fallback on error).
- **Epic Mastery Roll — roll UI:** D8 button replaced with **Roll**. Multi-attribute skills show inline attribute buttons above Roll; Roll stays disabled until an attribute is chosen.

## [0.9.157] - 2026-06-23

### Changed

- **Epic Mastery Roll — cinematic overlay:** Full-screen tinted band with character portraits, d8 roll buttons, red result frames, and in-overlay skill point spending (MR steps / all-in / keep roll) before results lock in.

## [0.9.156] - 2026-06-23

### Fixed

- **Epic Mastery Roll — chat button (Foundry v13):** The **Epic Roll** GM button now injects via `renderChatInput` and sidebar hooks. In v13, `renderChatLog` no longer includes `#chat-controls`, so the button was missing from the chat sidebar.

## [0.9.155] - 2026-06-23

### Added

- **Epic Mastery Roll:** GM chat button (**Epic Roll**) for group skill / attribute / save checks with configurable TN. Players roll from a live overlay; only a summary card is posted to chat (no individual roll spam). Supports recent presets (right-click), participant skip/cancel, and module API `requestEpicMasteryRoll()` / `getActiveEpicMasteryRollSession()`.

## [0.9.154] - 2026-06-23

### Added

- **Homepage character import:** GM can import JSON from the Actors directory (**Import Character**). Supports `mastery-character-import` (compact build + power template expansion) and `mastery-foundry-actor` (full actor dump). Schema: `docs/character-import-schema.md`, example: `docs/examples/alaris-import.example.json`. Module API: `game.modules.get('mastery-system').api.importCharacterFromJson(text)`.

## [0.9.153] - 2026-06-23

### Fixed

- **Printable battle sheet — weapon damage:** Bound artifact weapons (e.g. Moonlight Greatsword) now contribute `WD` on melee cheat lines even when the item lacks a baked `artifactWeapon` blob — damage is derived from `baseProfile` + level. Legacy equipped Unarmed no longer blocks bound artifact weapons. Weapon-attack templates always stack weapon damage even if mis-flagged as Spell.

## [0.9.152] - 2026-06-23

### Added

- **Smite Attack templates:** Melee Smite, Ranged Smite, and Ranged AoE Smite Actives in the catalog (Smite baked in, no Special picker). Moonlight Judgment uses Ranged AoE Smite.
- **Artifact Node Editor — Cast as Spell:** Checkbox on ranged Active progression picks (Intellect/Resolve, Spell Attack vs Save Spell); flags flow into level progression and combat.
- **Printable sheet — Spell visibility:** Blue **Spell** badge on page 2 power tiles and the Battle Sheet; artifact spell rows get attack/damage cheat lines.

## [0.9.151] - 2026-06-23

### Changed

- **Artifact Node Editor:** Martial Special Damage delivery forms (Melee/Ranged Single/AoE) are now entries in the **Active** Power dropdown; choosing one shows the Special picker. The separate “Martial Special Damage” mode is removed.

## [0.9.150] - 2026-06-23

### Fixed

- **Artifact Node Editor — Base Values unlock levels:** Auto-calculated values only appear once the artifact has reached that slot's unlock level (A = L1, B = L4, C = L7). Locked slots show `— (unlocks L4)` instead of a misleading auto value.
- **Artifact Node Editor — catalog Special picker:** Templates that need a chosen Special (Ranged Persistent Zone, Special Auras, etc.) now show a Special dropdown after you pick the template. The progression preview binds the chosen Special into the table.

## [0.9.149] - 2026-06-23

### Changed

- **Printable character sheet — battle cheat & readability:** Attribute rows now label wound-track dice pools (`0%`, `10%`, `20%`, `40%`, `50%`). Page 2 skills and Stone Power list fonts slightly larger. Battle sheet uses compact cheat lines (Melee/Ranged/AoE Attack, Attack attribute, Damage with `WD` weapon prefix, Heal + Safe Haven footnote) instead of long effect fluff; reactions include weapon damage; flow arrows are bidirectional (`↔`).

## [0.9.137] - 2026-06-19

### Fixed

- **Power resync now reliably reaches stale powers:** The one-shot resync that updates baked power tables to the audited templates is now re-runnable (new world flag, so it runs once more for every world) and matches templates by `templateId` with a stable `templateName` fallback — so legacy powers without a stored template id (and any power that was missed the first time) are caught. This corrects characters whose power tables still show pre-audit values such as **Active Buff: Damage** printing +1d8/+2d8/+3d8 per level instead of +3d8/+5d8/…/+33d8. Runs on the next full world reload.

## [0.9.136] - 2026-06-19

### Fixed

- **Power effect text printed literal `**` asterisks:** Power effect text is authored with Markdown emphasis (e.g. `**+9d8**`), but the character sheet rendered it raw, so cards/tables showed the literal asterisks. Added an `mdInline` Handlebars helper that renders `**bold**` / `*italic*` as HTML on the character sheet, and the printable sheet now strips the emphasis markers (plain-text layout).

### Note

- Existing Active / Active-Buff power items created before the templates audit still carry stale baked values (e.g. **Active Buff: Damage** showing `+3d8` at Level 4 instead of `+9d8`). A full world reload runs the one-shot power resync migration (added in 0.9.132) that updates them to the current values.

## [0.9.135] - 2026-06-19

### Changed

- **Release consolidation:** Rolls up the session's fixes — printable-sheet Minor Expression use boxes (MR × 2), the Actives.md / Active Buffs.md template audit and one-shot power resync, printable-sheet power effects reading the current rank, and live artifact weapon base-damage derivation (2d8/4d8 + 1d8/level). Verified clean rebuild with `dist` in sync.

## [0.9.134] - 2026-06-19

### Fixed

- **Artifact weapon base damage now reflects the profile + level rule everywhere:** Every weapon deals its Base Profile dice (one-handed **2d8** / two-handed **4d8**) plus **+1d8 per Artifact level** — so a Level 2 two-handed weapon is **6d8**. This value is now derived live from the base profile and current level in the printable sheet, the in-game damage roll, and the item info dialog, so existing artifacts always show the correct dice even when their baked damage string predates the base-profile scaling fix. Spell Focus / custom / natural profiles keep their stored value.

## [0.9.133] - 2026-06-19

### Fixed

- **Printable character sheet — power effects showed the wrong rank:** Power items only refresh `level`/`rank` on level-up; the flat `effect` string stayed frozen at the rank the power was created with. The printable sheet read that stale string, so e.g. **Ranged Split Attack** at Stufe 4 printed `+1d8` instead of `+5d8`. The sheet now reads each power's effect from its per-level table at the current rank, so the printed damage/effect always matches the power's actual Stufe.

## [0.9.132] - 2026-06-19

### Fixed

- **Active / Active-Buff powers on existing characters:** Power items bake their level table at creation time, so characters who owned Actives/Active-Buffs before the Actives.md / Active Buffs.md audit shipped still showed the old solver-derived values (e.g. Damage Single showing the wrong damage dice — 1d8 instead of 2d8 at higher ranks). A one-shot GM migration now resyncs these power items to the audited templates (damage anchors, special curves, healing, ranges, radii) while preserving each item's rank, chosen Special and Spell settings.

## [0.9.131] - 2026-06-19

### Added

- **Printable character sheet — Minor Expressions:** Added strike-off use boxes (Mastery Rank × 2) next to the **Minor Expressions** heading so uses per rest can be ticked off.

## [0.9.45] - 2026-06-12

### Fixed

- **Echo artifact duplicates:** Dragonborn Echo gear (Dragon Claws, Wyrm/Serpent Scales, Dragon Head, etc.) no longer appears twice — once equipped and again in the inventory grid. A one-shot GM migration dedupes existing actors; grant/fallback paths no longer create orphan copies; Echo-bound items are hidden from the carry inventory.

## [0.9.44] - 2026-06-12

### Changed

- **Character sheet — Reroll Points:** Header and related labels use **Reroll Points** instead of **FF** / Faith Fractures for the disadvantage-derived reroll pool.

### Fixed

- **Minor Expressions:** Picking or changing Minor Expressions no longer spends or refunds Reroll Points — only the Mastery Rank cap and attribute ≥ 8 rules apply.

## [0.9.43] - 2026-06-12

### Fixed

- **Languages during character creation:** The Languages picker button stays enabled while creation is incomplete, so players can pick their required additional language before finalizing.

## [0.9.42] - 2026-06-12

### Fixed

- **Echo grant permission:** Players no longer need GM permission to update world Items when granting or wiring Echo artifact trees. World-root `actorLevels` sync goes through a GM socket when the client cannot write the world Item directly; embedded item flags remain the source of truth if sync fails.

## [0.9.41] - 2026-06-12

### Added

- **Lor-Keth's Staff:** Eighth General Artifact — two-handed bound stone staff (Staff Damage 1d8–10d8, Storm Rune, Giant Weight) with Giant Shock Strike, Ancestor Guard, and Might Ignore Armor Support progression.

### Fixed

- **Skill cap:** Skills are capped at **Mastery Rank × 4** again (MR 2 → 8, MR 3 → 12, …), including Free XP spending. Character sheet, Progression Hub, and apply paths enforce the limit with clear warnings.

## [0.9.40] - 2026-06-12

### Fixed

- **Mark tier:** Removed `mark` from Tier 3 Special eligibility (Start PP 4 only); Tier 3 is now the Poison Group (`poisoned` only). Character Creation no longer lists duplicate Tier 3 / Tier 4 Mark entries.

### Added

- **Artifact Node Editor — Special-first power picks:** Progression picks use Delivery + Special dropdowns instead of opaque tier templates. Tier is derived from the chosen Special; preview names show e.g. “Melee AoE Special Damage (Mark) I” with bound Special ranks.

### Changed

- **`ArtifactProgressionPick`:** Stores `delivery` and `chosenSpecial` alongside `powerTemplateId`. Legacy martial picks without a Special prompt re-selection; non-martial legacy template ids are preserved with a warning.

## [0.9.39] - 2026-06-12

### Added

- **Reset Character — General artifacts:** General/bound artifacts are kept on the actor and reset to Level 1 / inactive instead of being deleted. Echo artifacts are still removed with the rest of the Echo wipe.

### Changed

- **Reset Character — equip prompt:** When equipped general artifacts exist, the GM is asked whether they should stay on the paperdoll after reset or move to inventory. Echo artifacts are excluded from this choice.

## [0.9.38] - 2026-06-12

### Added

- **Unified Progression Hub:** New dialog bundles Attributes, Skills, Powers, and Artifacts in collapsible sections — primary entry for post-creation XP and artifact progression.
- **Artifact tree wiring:** `artifact-tree-grant.ts` wires embedded artifacts to world evolution trees on drag-and-drop; `grantArtifactTreeToActor` works for Echo and General artifacts.
- **Shared progression logic:** `progression-hub-actions.ts` centralizes XP cost calculation and confirm apply for attributes, skills, and powers (character sheet and hub share the same code).

### Fixed

- **General artifact upgrades:** Dragged General Artifacts now receive `evolutionRootItemId` / `evolutionNodeId` automatically; repair generalized beyond Echo-only paths.
- **Artifact discovery:** Progression and Artifacts buttons appear when any embedded artifact exists; unwired items show a “Mit World-Tree verbinden” repair action; equipment badge opens the hub on the Artifacts section.

## [0.9.37] - 2026-06-12

### Fixed

- **Reset Character:** Skills and session skill spend (`skillsSpent`) now reset to 0. The reset batch uses `diff: false`, which does not apply Foundry `-=` deletions on nested fields — catalog skills are zeroed explicitly instead.

## [0.9.36] - 2026-06-12

### Added

- **General Artifacts:** Seven bound (non-Echo) artifact examples (Moonlight Greatsword, Soul Sigil, Frostbound Returning Axe, Shadowgrave Armor, Staff of the Dark, Starfallen Forceshield, Lantern of the Hollow Star) as full 10-node Artifact Builder trees, seeded into a new world folder **General Artifacts**.
- **Artifact pipeline:** Tree builder generalized for `binding: 'bound'` artifacts (no `echoBound` flag); per-artifact base-value tables (damage, evade, armor, shield, thrown range, Smite/Expose/Hex); shield profile with skill penalty for Starfallen Forceshield.
- **Tests:** `tests/general-artifacts.test.ts` covers all seven trees, scaling tables, stone functions, and binding rules.

### Changed

- **Shield base values:** `shieldValue` on equipped artifacts now contributes to armor total (Starfallen Forceshield stacks with body armor as intended).

## [0.9.35] - 2026-06-06

### Fixed

- **Equipment inventory drag-and-drop:** Disabled Foundry’s duplicate `.df-dropzone` handler that broke grid placement and caused `undefined id` create errors.
- **Inventory placement:** Resolve drop cell from event path; auto-find first free slot when no cell is hit.
- **Legacy Unarmed item:** Auto-remove embedded “Unarmed” weapons on sheet open; hide from equipment UI; trash drop deletes them (virtual unarmed is used instead).

## [0.9.34] - 2026-06-06

### Changed

- **Equipment paperdoll:** Body slot spans amulet/ring row through hands for a taller center column.
- **Equipment UX:** Removed tiny edit/delete overlays on inventory and equipped tiles; drag-and-click info unchanged.
- **Equipment trash zone:** Drop items on the bin right of the paperdoll to delete (with confirm); Echo-bound items blocked.
- **Echo Deck:** Racial core traits removed from data and sheet UI (mechanics via Echo artifacts); race name and cards get more space; tagline/meta collapsed under “Race details”.
- **Echo dialog:** Creation preview shows meta, sub-choice, and summary only (no core trait list).

## [0.9.33] - 2026-06-06

### Added

- **Summons tab overhaul:** Full familiar binding flow in Stone Powers — wizard (basics → base stone → upgrades → shared senses), per-slot attribute stone assignment, live stat preview, and `system.familiars[]` persistence with sustained pool accounting.
- **Summon actors:** `familiar-actor-factory` creates `summon`-type world actors in a Familiars folder; **Place Token** on scene; new **Summon Sheet** (read-only statblock).
- **Playwright E2E:** Optional Forge/local smoke tests (`npm run test:e2e`) with `e2e/.env` (gitignored credentials).

### Fixed

- **Familiar name input:** No longer types backwards (removed full re-render on every keystroke).
- **Stone pools** visible on Summons tab; reference table highlights current upgrade tiers.

## [0.9.32] - 2026-06-06

### Removed

- **Equipment Stash panel** on the character sheet (10×6 grid). Items with legacy stash flags still appear in the carry inventory grid.

## [0.9.31] - 2026-06-06

### Changed

- **Typography:** Überschriften nutzen **Laviossa** (Regelwerk-Font von Forge) statt Cinzel Decorative; Fließtext bleibt Cormorant Garamond.
- **Item sheets:** Artefakte nutzen nur noch **Artifact Sheet** (ehem. V2). Der alte **Mastery Item Sheet**-Pfad mit `artifact-sheet.hbs` ist entfernt; Registrierung wird beim Start neu gesetzt.
- **Equipment:** Toten Stash-Toggle-Button entfernt; Stash-Panel bleibt dauerhaft sichtbar.

### Fixed

- **Artifact sheet picker:** Artefakte, die noch am Legacy-Item-Sheet hingen, werden auf den Artifact Sheet zurückgesetzt (GM, Welt-Laden).

## [0.9.30] - 2026-06-06

### Changed

- **Character sheet:** Foundry’s generic core `ActorSheet` is unregistered — only the Mastery **Character Sheet** remains (no duplicate “default vs advanced” picker). Label shortened from “Mastery Character Sheet”.

### Fixed

- **Sheet picker:** Characters still bound to the legacy core sheet are reset to the default Mastery sheet on world load (GM).

## [0.9.29] - 2026-06-06

### Changed

- **Mastery Rank:** No automatic rank-up from Total Stones. MR is GM-controlled via dropdown on the character sheet; world **Default Mastery Rank** applies to new characters. Stone-based value remains as optional hint (↗N).

### Fixed

- **Character sheet MR:** GM dropdown is injected on render when the installed template is still the read-only span (Forge worlds on 0.9.28).

## [0.9.28] - 2026-06-06

### Added

- **GM artifact reset:** In the Artifacts dialog, GMs can reset activation — refunds the spent Stone to its pool so the player can choose again (evolution level unchanged). Activation pool is stored on the item.

## [0.9.27] - 2026-06-06

### Changed

- **Artifact dialog UX:** Scrollable body, compact dropdowns for stone pool and evolution path, collapsible rules/abilities sections.

## [0.9.26] - 2026-06-06

### Added

- **Artifact activation:** Player chooses which attribute Stone pool to spend when activating an echo/artifact item.

## [0.9.25] - 2026-06-06

### Fixed

- **Artifact activation stones:** Reads spendable stones from `stonePools` (not legacy `stones.current`); XP display/spend includes `points.xpFree`.

## [0.9.24] - 2026-06-06

### Fixed

- **ArtifactEvolutionDialog:** Migrated to Foundry v13 `ApplicationV2` + `HandlebarsApplicationMixin` (fixes render crash).

### Changed

- **Equipment tab:** Artifacts button restored to the top control row beside General Items / Store.

## [0.9.23] - 2026-06-06

### Changed

- **Equipment tab:** Removed inline artifact progression strip; **Artifacts** button moved to the Equipped panel and opens the **Echo & Artifact Progression** modal.
- **Activation source of truth:** Echo artifacts use `artifactActivated` on the embedded item; legacy world `linked` alone no longer shows them as active.

### Fixed

- **L1 inactive:** All echo artifacts default to **L1 · inaktiv** until the player spends 1 Stone in the Artifacts dialog.
- **Abilities gating:** Base values and abilities appear in the modal and artifact sheet only when activated.
- **Dragon Head / stale embeds:** Repair syncs missing `baseValues` / `levelProgression` from the world Builder-Tree; migration normalizes flags on existing worlds.
- **Misleading “No upgrade path”:** Upgrade paths are hidden until the artifact is activated.

## [0.9.22] - 2026-06-06

### Added

- **Artifact activation:** Linking an artifact now costs **1 Stone** once (MR 2+). Echo artifacts start **inactive** on grant and must be activated like any other tree-linked artifact.
- **Equipment tab UI:** Artifact strip and paperdoll badges with **Activate (1 Stone)** / **+1 (8 XP)** controls; **Artifacts** button opens the evolution dialog.

### Changed

- **Mechanical gating:** Stone Functions and artifact mechanical benefits require the artifact to be **activated** (`linked`), not merely equipped.
- **Echo grant:** `grantEchoArtifactTreeToActor` writes `linked: false` on the world root progress flag.

### Fixed

- **Migration:** MR1 characters with legacy auto-linked Echo artifacts are reset to inactive (one-shot world migration).

## [0.7.0] - 2026-05-25

Mastery System refactor release — neues XP-Spec, tier-basierte Stone Powers,
vollstaendiges Artefakt-System nach Artefacts.md, kanonisches 7-Slot-Equipment.

### Added

- **Stone Powers neu:** 32 Powers / 4 Tiers, exponentielle Kostenkette
  (1/2/4/8), RoundState-Integration, umfassende Tests mit gemockten
  Foundry-Globals.
- **Artefakt-Datenmodell:** `slot`, `baseProfile`, `baseValues`,
  `stoneFunction`, `binding` (`unbound` / `bound` / `echo`), `echoKey`,
  `currentLevel`, `levelProgression`.
- **`src/utils/artifact-rules.ts`** mit Baseline-Tabellen
  (Damage/Armor/Evade/Movement/Thrown/Weapon-Specials), Slot-Power-Access,
  Attribute-Access pro Slot, Stage-Progression.
- **Echo-Artefakt-Katalog** (Stonebound Soles, Elven Stride, Titan Scars,
  Wyrm Scales, Serpent Scales, Dragon Claws, Sentinel/Judicator/Oracle
  Frame), integriert in den Character-Creation-Dialog.
- **Combat-Integration:** Aggregation von Artefakt-Base-Values in
  Armor / Evade / Movement / Head-Armor / Minor-Armor; Artefakt-Actives
  im Radial-Menue; Reactions im Defender-Reactions-Pipeline; Stone
  Functions (Support prefill, Pool-Bonus, Refresh, Battery).
- **Migrationen:** `artifact-spec-backfill` (Artefakt-Felder nachfuellen),
  `paperdoll-slot-canonical` (Equipment-Slot-Keys auf 7-Slot-Vokabular
  normalisieren), `xp-currentstep-cutover`.
- **Tests:** `artifact-rules`, `echo-artifacts`, `artifact-capacity`,
  `stone-powers`, `xp-step-rule` (40+ neue Tests).

### Changed

- **XP-Spec:** Neue Kostenkette fuer Attribute/Skills/Powers; Mastery Rank
  cappt Power-Level + Skill-Rank; Artefakte kosten flat 8 XP pro +1
  (gecappt bei `(MR-1)*2`, max 16); Once-per-Step-Regel fuer alle
  Spend-Kategorien.
- **Equipment-Slots auf kanonische 7 reduziert:** `mainhand`, `offhand`,
  `body`, `head`, `feet`, `amulet`, `ring`. Umbenannt:
  `helmet` -> `head`, `chest` -> `body`, `boot` -> `feet`,
  `necklace` -> `amulet`, `ring1` -> `ring`.
- **Paperdoll-CSS-Grid** komplett neu fuer das 7-Slot-Layout.
- **Artifact Capacity flach 4** pro Charakter (statt MR x 2);
  Echo-Bound-Artefakte koennen nicht entbunden werden.
- **GM-XP-UI:** "Attr cap" -> "Step bumps" Summary.
- **Stone Power Support** prefillt Aktivierungs-Tiers (`usesBefore`-
  Anpassung in `stone-activation.ts`); **Stone Pool**-Bonus erhoeht
  `system.stones.maximum`; Refresh/Battery unter
  `system.stones.fromArtifacts` exponiert.

### Removed

- **Mastery Trees** komplett entfernt (`src/utils/mastery-trees.ts`).
- **Item-Type `masteryNode`** aus `system.json` entfernt.
- **Legacy XP-Ultimate-Kosten** + Artefakt-Stone-Kosten entfernt.
- **Equipment-Slots** `cloak`, `glove`, `belt`, `leggings`, `ring2`
  entfernt; bestehende Items in entfernten Slots werden durch die
  `paperdoll-slot-canonical`-Migration zurueck ins Inventar gelegt.

## [0.6.0] - 2026-05-01

Doc-Code Gap Audit release — 7 waves of changes that align the runtime
with **Players Guide v0.8.0** and **Actives.md**.

### Added

- **Power Engine:** `src/utils/powers/pp-budget.ts` — central 30 PP/level
  budget engine (Damage Anchor, diminishing `T(X)`, AoE `T(X+1)+halve`,
  range `+5 PP / +4 m`).
- **Range Bands:** `src/utils/range-bands.ts` — Short/Medium/Long bands
  (100/75/50% pool, +1m/+2m/+4m per 8 Agility); wired into the attack
  roll handler with out-of-range refunds.
- **Encumbrance:** `src/utils/encumbrance.ts` — single-grid (24×9) load
  zones (Normal / Encumbered / Overloaded) and movement penalties
  (-4 m / -6 m); rendered on the character sheet.
- **Save Ends:** `src/combat/save-ends.ts` — End-of-turn Save Ends prompt
  with per-round caps and `−4` reduction on success.
- **Mastery Rank Sync:** `src/utils/mastery-rank-sync.ts` — derive MR
  from total Stones, Rank-Up bundle (+1 Mastery Charge, +1 Schtick row).
- **XP Step Rule:** `src/utils/xp-step-rule.ts` — per-step 50% Attribute
  Rule with ±1 XP tolerance; replaces the lifetime cap. End-XP-Step
  button + bucket display in XP management.
- **Languages:** `src/utils/languages.ts` + picker dialog; canon list
  from Players Guide 3100–3127, picker enforces ≥1 extra at creation.
- **Social Combat:** `src/system/social-combat.ts` — Phased Challenge
  subsystem (Setup Pool, Lead/Support, 4d8 Stress on failed phases,
  outcome thresholds 4/8).
- **Divine Clash math:** `src/divine-clash/divine-clash-math.ts` —
  Vitality / Overhang / Group Strike / Shared Defense / Overdrive +
  regen-after-Overdrive helpers.
- **Wits Stones, Generic Exchange Passive, Vitality Remove-Scar,
  Agility Evasive Step, Influence Extra-Passive** stone powers.
- **`Root(X)`** Special; canonical `disarm` Special definition.

### Changed

- **Dice mechanics:** Exploding dice now trigger on a rolled face of 8
  (not running-total %8); damage dice no longer explode by default;
  Disadvantage permits only one exploding die; Advantage rerolls 1s in
  the initial pool; Min-Pool Rule = `max(attribute, MR)`.
- **Skill rolls:** Full-Pool Requirement (Skill ≥ MR), per-step Skill
  spend (no All-In below MR), Standard TN derived from a user-selectable
  Challenge MR.
- **Attribute scaling applied:** Might melee damage `+(2 × Might/8)`,
  Resolve Stress Armor `floor(Resolve/8)`, Wits Initiative `+Wits/8`,
  Intellect Save TN `+Intellect/8`.
- **Health:** 5 health bars (Healthy → Bruised → Injured → Wounded →
  Incapacitated); percentage-based dice penalties (`-10 / -20 / -30 /
  -40%`) instead of flat `-1 / -2 / -4`.
- **Safe Haven Rest:** Restores HP/Stress/Scar bars, releases
  Sealed/Lost/Bound stones, clears Stone-Bound forms, refills Mastery
  Charges and Faith Fractures.
- **Power-Engine refactor:** Damage / AoE / Persistent-Zone / Control /
  Buff templates use `pp-budget.ts`. Persistent zones: no attack roll,
  4-round duration, radius table, once-per-round-per-creature.
  Push/Pull priced per meter; Prone/Disarm via diminishing T3.
- **Power validation** loops 1..16 (was 1..4); `(Spell)` / `(Charged)`
  tags propagated.
- **Combat Maneuvers:** Replaced with the canonical Players Guide list
  (Dash/Disengage/Flee/Dodge/Block/Parry/Aid/Interpose/Grapple/Guard/
  Oversight/Delay/…).
- **Rituals:** Refactored to flexible Skill-Picker model (Players Guide
  8961–9171); TN = `8 × Ritual MR ± 4 GM modifiers`; canonical 11
  rituals in `src/utils/rituals.ts`. Stone-powers ritual catalog
  documented as expansion content.
- **Familiars:** Movement upgrades `+4m ground / +2m flying`; HP cap
  capped at 5 picks; `MR × 4` total familiars and stones-per-familiar.
- **Artifacts:** Capacity = `MR × 2` artifacts; Bind Stones at L1/L4/L8;
  5-stage Taint model.
- **Spells:** Tier table 8/16/24/…/64 (`spellTierForPowerLevel`); Save
  DC includes `+ floor(Intellect/8)`; Resolve Stress Armor applied to
  involuntary stress.
- **Character Creation:** Validates **4 starting Powers with 2 at Rank 2**
  (Players Guide 2988–3008) instead of the old 7-by-category split.
- **Schticks** reduced to purely cosmetic flavour (no `+1k0`, `+1
  Vitality` riders).
- **Faith Fractures default max** lowered to 8; Force-GM-Reroll exposed
  via the chat button when the rolling actor isn't owned by the user;
  `minDisadvantagePoints` lowered to 0.

### Fixed

- **Whip** special cleared (no `Grappled(1)`).
- **Skill primaries:** Athletics (`might + agility`), Hand-to-Hand
  (`might`), Defensive Combat (`vitality`).
- **Special Effects reference:** `mark` / `soulburn` / `weaken` /
  `frightened` removal skills, `cleanse` semantics (single −4),
  `brace` re-categorised as Timed; `poisoned` description aligned.
- **Tier eligibility (`_specials.ts`):** T4/T5/T6 Specials and Root added.
- **Weapon dialog ranged detection** now matches `Ranged (8/16/32m)`
  tokens; range stored as the band string.

### Documentation

- **Players Guide v0.8.0** Char-Creation Step 8 stress source corrected
  to *"Health from Vitality, Stress from Resolve and Intellect"*.
- **Save DC** chapter now documents `8 × MR + ⌊Intellect/8⌋`.
- **Stash 10×6** documented as a Foundry-side homebrew convenience that
  does **not** affect Encumbrance.
- **Minor Expressions UI** uses the canon "Reroll Points" terminology;
  the underlying `system.faithFractures` field is preserved as a
  synonym for backward compatibility.

## [0.5.16] - 2026-04-26

### Fixed

- **Melee AoE secondaries:** Splash resolution reads AoE token ids / dice from **roll-button data attributes** (flags fallback); resolves defenders via **scene + placeables**; reaction spend uses **`getActionEconomyActor`**; **`Dialog.confirm`** fallback to **`window.confirm`** when needed.
- **Active Buff: Damage Reduction:** Template always snapshots **`damageReductionPct: 10`** (low ranks no longer omitted); buff DR **whitelist** accepts names containing “damage reduction”.
- **Character sheet combat strip:** Removed the extra **grey breakdown list** and footer hint; tooltips on Armor / Evade / DR chips remain.
- **Health bar damage:** **`applyDamage`** coerces bar `current` / `max` and incoming damage to safe finite integers (very large or string values).

## [0.5.15] - 2026-04-26

### Added

- **Melee weapon AoE (burst) v2:** One attack roll vs a chosen **primary**; chat card carries secondary token IDs and power splash dice. After primary damage resolves, **secondaries** may spend a **Reaction** for a **Body** save vs TN **Mastery Rank × 8** (clamped M1–M6); failure applies **power-only** `Nd8x` splash through the normal mitigation pipeline. **No primary** path spends the action and resolves splash-only for everyone in the burst (requires `+Nd8` on `damageRider.flat`).
- **`extractMeleeAoePowerBonusD8`** for unconditional splash dice from power mechanics.

### Changed

- **Combat carousel:** Refreshes on ActiveEffect create/update/delete when mastery buff flags change; combat strip **tooltip** from armor/evade/DR breakdown rows.
- **Character sheet:** Combat stats chips show structured breakdown tooltips/lines where available.
- **Stone powers dialog:** Primary close action labeled for settlement clarity; round plan save available beyond round one when not locked; locked-banner hint.
- **End turn UI:** Labels/tooltips describe **next combatant** (`nextTurn`) semantics.
- **Stone turn bonuses:** Turn-scoped evade (and similar) stone bonuses clear when the combat tracker advances away from that combatant’s turn.
- **Active buff effect:** Neutral book icon; snapshot **`applyWhen: activeBuff-active`** on stored mechanics; DR breakdown rows aligned with aggregation.

### Fixed

- **TypeScript / Foundry typings:** Carousel strip type, AoE dialog HTML escape, reaction spend uses **`spendReactionAction`** + **`getRoundState`**.

## [0.5.14] - 2026-04-26

### Added

- **Melee weapon AoE (burst):** Selecting a melee AoE active no longer asks for a single target. All **hostile** tokens within **min(melee reach, template burst radius)** get an attack chat card (`Target i of n`). Only the **first** card spends the attack action on roll (same pattern as split attacks).

### Changed

- **Radial options:** Melee actives with a radius AoE in the power definition set `burstMeleeAoE` / `burstMeleeRadiusMeters` for the above flow.

## [0.5.13] - 2026-04-26

### Fixed

- **Conditional passives in combat totals:** `conditionExpr` such as `self.adjacentEnemies >= 2` / `self.adjacentAllies` no longer only appear in breakdown text; when the gate is satisfied they fold into `aggregateMechanics` → `armorTotal` / `evadeTotal` / etc. Uses scene tokens and grid distance (`mechanics-adjacency.ts`); `evaluateMechanicsConditionExpr` extends roll/damage gates consistently.
- **Slotted passives ignored when `active` was false:** New slots set `active: true`; collection no longer requires `slot.active === true`, so legacy “slotted but inactive” rows still grant mechanics.
- **Carousel combat strip vs. buff icon:** `A` / `E` / **`DR n%`** always shown on one line; active buffs that contribute **only** DR no longer add a duplicate status icon. Portrait strip recomputes via `prepareDerivedData()` and refreshes on **any** token position change during combat so adjacency-based bonuses stay current.

### Changed

- **Passive UI:** Removed Activate/Deactivate from the combat-start passive dialog and from the character sheet passive manager; **slotted = active** (X / clear to remove remains).

## [0.5.12] - 2026-04-26

### Fixed

- **Slotted passive armor/evade never applied:** `actor.items` is a Foundry `Collection`, not an array, so `items.get(id)` alone often failed and `Array.isArray` fallback never ran. Added `findPowerItemOnActor()` (iterate + `contents` fallback + name match) and wired it into passive + active-buff effect resolution.
- **Active buff activation:** `isActiveBuff` / `isTrueActiveBuff` still required `cost.action === true`, so catalog powers with `cost.action: 'attack'` failed `activateActiveBuff` (chat log: *non-buff power*). Now uses `powerCostPaysAction`, `activeBuff` camelCase, and `resolvePowerMechanics` `activeBuff-active` detection — Damage Reduction creates the effect, spends/refunds correctly, and shows DR in aggregation when rules allow.
- **Radial refresh error:** `refreshRadialMenuActionLabelsIfOpenForActor` called `msRadialGetCurrentSegmentId()` when the slot was truthy but not a function; guard with `typeof === 'function'`.
- **Agility Crit stone:** `critRaises` in round state was never applied to dice. Attack rolls now use **7–8 exploding** pool dice when the bank is greater than 0, then decrement the bank by 1. Faith Fracture reroll preserves the recipe flag when present.
- **Agility +8 Evade stone:** Restored **`+= 8`** stacking per spend (as in your table test); breakdown text updated.

### Added

- **Chat line on active buff activation** summarizing duration and key mechanics (DR / Armor / Evade).

## [0.5.11] - 2026-04-26

### Fixed

- **Active buffs with `cost.action: 'attack'` (string) now route to the Buff radial segment.** `getSegmentIdForOption` and active-buff Self-range detection only treated `cost.action === true`, so catalog powers (e.g. Damage Reduction) stayed under Attack and triggered the wrong pipeline. Added `powerCostPaysAction()` so string action costs match boolean costs.
- **Agility stone “+8 Evade” no longer stacks to +40+ on repeated apply.** Round bonus is a flat **+8** (`evadeBonus = 8`), not `+= 8` per trigger.
- **Slotted passives with wrong `applyWhen` (e.g. legacy `attack-rider`) but category `passive` and real armor/evade/DR/regen/initiative/phasing stats** are counted again in `collectMechanicsContributions`.

### Changed

- **Combat carousel strip:** removed Initiative chip; **DR** only shows when damage reduction percent is **> 0**.

## [0.5.10] - 2026-04-26

### Fixed

- **Slotted passives without `applyWhen` no longer vanish from the aggregator.** `collectMechanicsContributions` used to require `mechanics.applyWhen === 'passive-slotted-active'` exactly; older items that carried `armor` / `evade` / … but omitted `applyWhen` were skipped entirely (Fortified Frame appeared slotted but +Armor never hit `armorTotal`). Unknown / empty `applyWhen` on a slotted passive is now treated like the canonical passive template.
- **Catalog mechanics lookup tolerates display prefixes on item names.** `resolveMechanicsFromCatalog` now strips leading `Passive:`, `Active:`, and `Active Buff:` (case-insensitive) and matches against `templateName` / `name`, so legacy renames still resolve to the live template mechanics.
- **Split-Attack dice pool could balloon back to the full attribute pool on the roll.** `masteryRoll` applies `getRollDiceDelta` / manual bonus dice *after* the attack card passes the halved `numDice`. A strike that should be `4d8` could become `8d8` again when a passive granted `+4` attack dice. Added `attackDiceCap` on `RollOptions` / `MasteryRollRecipe`: the attack-roll handler passes the post–health-penalty pool as a hard ceiling right before dice hit the table. Faith-Fracture rerolls preserve the cap when present.
- **Declared Raises used the wrong TN step and did not cap damage Raises.** The attack-card dropdown bumped target Evade by **+2 per raise** while the engine measures margin Raises in **steps of +4** (`RAISE_INCREMENT`), which inflated post-hit Raises. The card now uses `+4` per declared raise. When the dropdown is **> 0**, the same value **caps** the Raises passed into the damage dialog (`0` still means “no TN bump and no damage cap”).
- **Active Buff powers stored as `powerType: 'activeBuff'` never entered the radial whitelist** and copies saved as plain `active` with `applyWhen: 'activeBuff-active'` were routed through enemy targeting. `activeBuff` is now an allowed power type; `getSegmentIdForOption` treats `activeBuff` / buff types and any power whose resolved mechanics declare `activeBuff-active` as the **Buff** quadrant so `token-action-selector` activates them on **self** without picking an enemy token.

### Added

- **Stone-Powers Evade bonus on the derived Evade total.** Agility “+8 Evade per stone” writes `roundState.stoneBonuses.evadeBonus`; `prepareDerivedData` now adds it to `system.combat.evadeTotal` with a **Stone Powers** breakdown row so the sheet / carousel match in-combat reality.
- **Combat totals strip on the Combat Carousel** — compact `A / E / DR / Ini` line under each portrait (reads the same `system.combat.*` fields as the character-sheet header).

## [0.5.9] - 2026-04-26

### Fixed

- **Split-Attack attack pool is now actually halved on the roll.** Root cause: `src/combat/attack-executor.ts` correctly halved `attributeValue` per strike and wrote it to `flags.attributeValue`, but `src/chat/attack-roll-handler.ts` preferred the *live* attribute value of the actor and only used the flag as a fallback. This meant a Might-8 character rolling a Split-Attack still threw `8d8 keep 2` per strike instead of the intended `4d8 keep 2` per strike. The handler now gives `flags.attributeValue` priority over `liveAttr` whenever `flags.splitAttack === true`, preserving the halving. NPC pools (`useNpcAttackDicePool`) still take absolute precedence.
- **"Split-Attack" and "Autofire" are no longer listed as selectable Raise-Specials.** They are attack *modes*, not Specials — the attacker does not "buy" Autofire with a raise; the extra-target rule is part of how the attack is declared. Removed from three places:
  - `src/utils/powers/templates/actives.ts`: the split-attack and autofire power-row builders no longer emit `specials: [{ key: 'split-attack', … }]` / `autofire` entries. Instead they declare the attack mode in the `mechanics` block (`mechanics.splitAttack: true` / `mechanics.autofire = { extraTargets }`), which is what the runtime already reads in `detectSplitAttack` and what the executor uses to dispatch two strikes.
  - `src/utils/special-effects.ts`: the `autofire` and `split-attack` entries in `MULTI_ATTACK_EFFECTS` are removed so they never populate the Raise-Special picker.
  - `src/dice/damage-dialog.ts` → `collectAvailableSpecials`: defense-in-depth filter skips any legacy power item whose `specials` array still carries `"Split-Attack(…)"` or `"Autofire(…)"` strings.
- **Autofire gets a typed `mechanics.autofire.extraTargets` field.** New type property in `src/types/item.d.ts` documents the closed semantics alongside `splitAttack?: boolean`.

### Added

- **Compact Combat Stats Panel under the character-sheet header — visible on every tab.** The user-feedback was that the current Armor / Evade / DR / Initiative totals were "not findable" because they only existed inside the Attributes tab. The new panel surfaces all of them plus total HP and total Stress as small chips directly under the portrait/creation banner, so wherever you are on the sheet the at-a-glance numbers are one glance away. Full per-source breakdowns (equipment, passives, buffs, manual adjustments) remain in the Attributes-tab cards.
- **Segmented HP bar on the Combat Carousel.** A new color-graded bar is rendered under each combatant portrait with one segment per wound-level (Healthy → Bruised → Injured → Wounded → Critical = green/yellow/orange/red/dark-red), sized proportionally to that level's max HP and filled according to its current HP. The bar reads the live `system.health.bars` array, so extra health levels introduced by passives or equipment are rendered dynamically without code changes. Totals (`HP: current/max`) are shown in the bar header.
- **Damage mitigation is now a prominent block on the damage chat card.** Previously the Armor/DR/Temp-HP breakdown lived inside a string on the `AppliedDamageSummary` but was not rendered in the chat card at all — so when a Tech Dummy ate 30 damage after your hit, you had no way to see "Rüstung: 4 aufgefangen, DR: 10%, HP verloren: 23". The new block renders chips for each mitigation step plus the raw breakdown string as a monospace footer, and a dedicated "Phased — Angriff ignoriert" style for phased hits.
- **GM-only Mechanics Debug button in the Passive Slot Manager.** Dumps the full list of currently aggregated mechanics contributions, the raw `system.passives.slotN` entries, and the aggregated totals (Armor/Evade/Init-d8/Regen/DR%) as a whisper-to-self chat message. Intended for diagnosing "my Fortified Frame says +1 Armor on the sheet but the armor total doesn't move" scenarios — either a slot isn't active, or a legacy power item is missing its `templateId`/`mechanics` and therefore falls through the aggregator.

### Changed

- **Combat Carousel moved down ~30 px (top `-9px` → `20px`).** The previous position clipped the top third of every token portrait. The new offset keeps the carousel clearly visible at the top of the viewport without covering the scene navigation or the portraits.
- **All powers bought during Character Creation are now added at Rank 2** (previously Rank 1). The hardcoded default in `src/sheets/character-sheet-power-dialog.ts` and the static "Rank 1 (fixed during character creation)" label in the rank widget were both updated to Rank 2. Post-creation, the player still selects the rank explicitly (still bounded by Mastery Rank and, for spells, by `maxSpellLevel = MR × 2`).

### Internal

- `PowerMechanics` interface gains an optional `autofire?: { extraTargets: number }` alongside the existing `splitAttack?: boolean` so attack-mode declarations have a typed home.
- Character sheet `getData()` now exposes a `combatStatsView` view-model (armor/evade/drPct/initiativeDice/initiativeEquipmentDisplay/hp/stress totals) so the compact panel template can stay trivial and all derivations live in one place.

## [0.5.8] - 2026-04-26

### Changed

- **Split-Attack damage rule reworked.** Previously every damage source — including raises declared on a strike — was halved before being applied (`Math.floor(totalDamage / 2)` per strike). The new rule reflects table play:
  - **Raises stay 1:1 per strike.** The player already buys raises on the (halved) attack pool for the specific strike they just rolled, so every die of raise damage lands on that strike in full.
  - **Every other damage source is halved.** Base weapon damage, Might stones, power damage, conditional riders (damage-gated-on-condition riders from the attacker's passives / active buffs), manual bonuses from the character sheet, and NPC auto-dice are split evenly between the two strikes via `Math.floor((totalDamage - raiseDamage) / 2)` and then the raise damage is added back on top.
  - **`count8s` now preserved per strike.** The "never below count8s" floor in the defensive pipeline previously also halved, which could under-report natural 8s rolled by raise dice on a given strike. The count is now carried through unchanged per strike.
  - Formula per strike: `appliedDamage = floor((total − raises) / 2) + raises`. Each strike still resolves independently against the target (two attack rolls, two damage rolls, two hits against armor/evade), the 1-action-per-attack rule is kept (only the first strike flips `costsAction`), and the attack pool is already halved per strike in `attack-executor.ts` (unchanged).

### Fixed

- **Split-Attack previously halved raises.** A player who declared e.g. 2 raises on Strike 1 used to see those 2d8 raise dice pre-halved into the applied damage of that strike. The new rule gives the full raise damage to the strike it was declared on, as specified in the design spec.

### Tests

- `tests/split-attack.test.ts` rewritten around the new invariant: `halveForStrike(total, raiseDamage, count8s) = { total: floor((total − raiseDamage)/2) + raiseDamage, count8s }`. Covers: raises intact, degenerate case without raises (falls back to simple halving), zero-input, floor-on-odd totals, and the defensive clamp for `raiseDamage > total`. All 11 cases green; full suite stays at 391 passing.

## [0.5.7] - 2026-04-26

### Added

- **Passive Slot Manager on the Character Sheet (Powers tab).** Previously passives could only be slotted through the Combat-Start `PassiveSelectionDialog`, which meant that outside of a running combat a character's passives did **not** contribute to their combat stats (Armor / Evade / DR / Initiative), because `prepareDerivedData` only aggregates slot-activated passives (`slot.active === true`). The new sheet-side manager fixes this UX gap without changing the underlying data contract:
  - For every Passive-Slot available at the character's Mastery Rank a row is rendered: a **dropdown** listing all passive powers the actor owns, an **Activate toggle**, a compact **effect summary** built from the same `summarizePowerMechanics` helper the Combat Carousel uses (e.g. `+4 Armor · +20% DR`, `Regen 10 HP/turn`, `+2d8 Attack vs Hexed`), and a **Clear** button. Passives already slotted in another row are shown in the dropdown but marked `disabled` so the same passive cannot be double-slotted.
  - Activating a slot writes `system.passives.slotN.active = true`, which is the **exact same field** the existing `buildActorMechanicsBreakdown` aggregator reads in `src/documents/actor.ts`. As soon as a slot is toggled active the character-sheet stats re-render with the power's armor / evade / DR / initiative / regen / temp-HP / roll bonuses factored in. No separate code path.
  - Header shows the live **active-count / max-slots** with a `(Mastery Rank limit)` hint; rows turn into a blue-accented "is-active" state when the toggle is on so it is obvious at a glance what is currently live.
  - The Combat-Start `PassiveSelectionDialog` continues to work unchanged and stays as the locked-in selection point once a combat encounter starts.
- **Robust Carousel icon rendering.** The combat-carousel template now uses a precomputed `cssClass` field from the data layer (`src/ui/combat-carousel.ts`) instead of re-branching on `statusIcon.kind` inside Handlebars, and the icon classes (`.active-buff-icon` lila, `.passive-slot-icon` blue) are now paired with dedicated `.ms-active-buff-icon` / `.ms-passive-slot-icon` classes guarded by `!important` so the colored border + dot accent survive Foundry-theme overrides and third-party modules that restyle `.status-icon`. Each `<img>` also carries a `data-icon-kind` attribute to aid debugging.

### Fixed

- **Passives were not factored into character-sheet combat stats outside of combat.** Root cause: the aggregator (`collectMechanicsContributions` → `buildActorMechanicsBreakdown`) only reads slots with `active === true`, and the only UI that could set that flag was the Combat-Start dialog. Characters outside an encounter therefore silently lost every passive-derived bonus. The sheet-side Passive Slot Manager (above) closes this gap: activating a slot on the sheet immediately writes `slot.active = true` and the next `prepareDerivedData` pass re-aggregates the mechanics onto `system.combat.armorTotal / evadeTotal / damageReductionPct / initiativeEquipmentTotal` with explicit "Power Mechanics" breakdown rows.
- **Carousel status icons had no visible colored border in some themes.** The previous selectors (`.status-icon.active-buff-icon`, `.status-icon.passive-slot-icon`) could be outweighed by Foundry-level `.status-icon` rules in certain themes, so the border and dot accent effectively disappeared. The new `ms-*` companion classes plus `!important` on `border` and `box-shadow` make the accent robust against theme overrides while keeping the existing selectors for backward-compat.

### Internal

- New file `src/utils/passive-slot-view.ts` — view-model builder `buildPassiveSlotView(actor)` that wraps `getPassiveSlots` + `getAvailablePassives` and annotates each row with a `summarizePowerMechanics` summary and a `slottedInSlot` cross-reference so the template can disable already-slotted passives in other rows' dropdowns without duplicating the lookup.
- New stylesheet block `.passive-slot-manager` (+ `.passive-slot-row`, `.passive-slot-select`, `.passive-slot-activate`, `.passive-slot-summary`, `.passive-slot-clear`) using the existing `--df-*` theme variables so the manager inherits the current sheet theme without hard-coded colors.
- Character-sheet `activateListeners` now binds three new handlers: `change` on `.passive-slot-select` (slot or unslot depending on the chosen value), `change` on `.passive-slot-toggle` (activate/deactivate, routed through the existing `activatePassive` guard that enforces the Mastery-Rank cap), and `click` on `.passive-slot-clear` (unslot). All three re-render the sheet on success and surface `ui.notifications.error` on failure.

## [0.5.6] - 2026-04-26

### Added

- **GM: Reset Character** — new GM-only button on the character sheet that wipes an existing character back to creation mode while preserving the actor's identity. Intended for outdated / drifted characters that accumulated from older builds and need to be re-rolled without losing their XP progression or spot in the party roster.
  - **Preserved:** actor `name`, portrait `img`, `prototypeToken` (token art), `ownership`, `folder`, `flags`, the lifetime XP counter `system.xp.totalEarned`, and the `system.xp.history` audit log.
  - **Wiped:** every embedded Item (powers, gear, weapons, armor, shields, schticks, artifacts, conditions, Echo items, masteryNodes), all ActiveEffects, every `system.*` field under attributes / skills / skillsSpent / mastery / stonePools / passives / combat / resources / health / stress / saves / manual adjustments / tracked / radial + stone-power prefs, the full `system.echo` structured block (key, sub-choice, veiled form, selected cards, card/trait uses), `system.bio` text (echo, concept, appearance, notes, description), `system.notes`, `system.disadvantages`, `system.schticks.ranks`, `system.minorExpressions`, `system.conditions`, `system.faithFractures`, `system.xp.totalSpent`, `system.xp.spentAttributes`, `system.xp.attributeBaselines`, and `system.xp.postCreationProgress`.
  - **XP behavior:** the full `totalEarned` figure is written back into `system.points.xp` so the player has *every XP they ever earned* available for re-distribution. After running through Character Creation a second time and pressing "Finalize Character Creation", the post-creation finalize path re-computes attribute baselines and the post-creation progress snapshot the same way it does for a brand-new character.
  - **Safety:** GM-only gate (`user.isGM` check) **plus** two consecutive confirmation dialogs (the first lists exactly what will be removed / kept with live item count + lifetime-XP figure, the second is a final abort prompt). The reset action is logged as an `adjust` entry in `system.xp.history` with `details.resetForRecreation: true` so the action is GM-traceable.
  - **Post-reset seed:** after the wipe, a default "Unarmed" melee weapon is re-added (matches the behavior of the `createActor` hook for brand-new characters) so the sheet isn't weapon-less on first render.
  - **Button placement:** the button appears both inside the Character Creation banner (alongside `Force Unlock`) when creation is incomplete, and in a new GM-Tools row directly under the sheet header when creation is complete. In both spots it uses a red accent (border, background tint, icon) so the destructive nature is visible at a glance.

### Changed

- `#lockSheetForCreation` — the creation-lock whitelist now includes `.reset-character`, so the new button stays clickable while a character is still in creation mode (same treatment as `.force-unlock-creation`).

## [0.5.5] - 2026-04-26

### Added

- **Combat Carousel shows active Passives + per-power effect summaries.** The round carousel now shows one status icon per slotted Passive in addition to the Active Buff icons that were already there, so you can tell at a glance what is currently modifying an actor's stats. The tooltip on each icon is now multi-line and includes:
  - the power name,
  - the source kind (`Active Buff` / `Slotted Passive`),
  - for Active Buffs: the remaining duration,
  - a compact effect summary built from the power's `mechanics` block (e.g. `+4 Armor · +20% DR`, `+2d8 Attack vs Hexed`, `Regen 10 HP/turn`, `Temp HP 1d8`, `Heal 2d8`).
- **Passive-slot icons get a distinct blue accent** (`.status-icon.passive-slot-icon`) so they read as a different category from the lila Active Buff icons at a glance. Hover glow is blue instead of purple. Deduplication: if an Active Buff is currently live for the same `powerId` as a slotted Passive, only the buff icon is shown (no doubled entry).
- **New helper** `src/utils/power-mechanics-summary.ts` exports `summarizePowerMechanics(mech)` which turns any `PowerMechanics` block into the compact string used in the tooltip. Zero / empty fields are skipped. Consumers outside the carousel can reuse it for future UI surfaces (e.g. character-sheet tooltips).

### Changed

- **Manual Adjustments section readability + GM-only edit gate.** The section added in 0.5.4 was unreadable on the default dark theme because it relied on inline styles and blanket `opacity: 0.8`. The styling has been moved to `styles/character-sheet.css` and now uses Foundry's theme variables (`--df-text-primary`, `--df-bg-panel`, `--df-border-primary`, `--df-accent`, …) so it follows the rest of the sheet and stays legible with or without custom themes.
- **Manual Adjustments is now GM-edit / player-readonly.** Players see every field (so they know what the GM has dialed in) but all inputs are `readonly disabled` unless the current user is a GM. The header now carries a small `GM Edit` / `Read-only` badge to make the permission state explicit at a glance, and readonly inputs render with a dashed border + reduced opacity + `cursor: not-allowed` so the restriction is visible. Sheet-level ownership still applies — under default permissions, non-owner players cannot open the sheet at all.

### Fixed

- Removed all inline `style="..."` attributes from the Manual Adjustments template block (hard to theme, inconsistent under different Foundry modules) and replaced them with stable CSS class hooks (`.manual-adjustments-section`, `.manual-adjustments-card`, `.manual-adjustments-row`, `.manual-rolls-grid`, …).

## [0.5.4] - 2026-04-26

### Added

- **Manual Adjustments — player/GM-authored additive bonuses.** A new card at the bottom of the Attributes tab lets you layer static bonuses on top of the calculated stats without having to edit the underlying attributes. All fields default to `0` and are **additive** (positive values add, negative values subtract). The raw value is always visible as an explicit "Manual Bonus" row in each breakdown so the source of the change stays transparent.
  - **Combat totals:** `Armor Bonus`, `Evade Bonus`, `DR % Bonus` (clamped 0–100 after stacking), `Initiative Bonus`. Each adds a dedicated row to its breakdown panel and folds into `armorTotal` / `evadeTotal` / `damageReductionPct` / the initiative equipment total.
  - **Roll bonuses:** per-kind `+d8` and `+Flat` inputs for `Any Roll` (applies to all rolls, including attribute rolls and initiative d8), `Attack`, `Skill`, `Save`, and `Damage`. `Any Roll` stacks on top of the per-kind bucket. Wired into `masteryRoll` (attack / skill / save) and the damage-dialog pipeline (damage dice and flat damage both land in the subtotal and are logged as `Manual Bonus (damage)` in the chat roll detail).
  - **Initiative:** the `Initiative Bonus` is folded into the final `totalInitiative` in `initiative-roll.ts` (so it lands in the Initiative Shop pool, not just the equipment display). The `Any Roll +d8` also applies to the initiative pool.
  - **Health bar bonus:** `+ Health / bar` adds to every Health bar's max (Healthy / Bruised / Injured / Wounded). Current HP scales proportionally when the bonus changes so the bar-fill ratio is preserved. Negative values are allowed (clamped so each bar max stays ≥ 1).
  - **Stress bar bonus:** `+ Stress / bar` works the same way for Healthy / Stressed / Not Well / Breaking.
  - Storage: all inputs persist under `system.manual.*` on the character (see `src/types/actor.d.ts`); `src/utils/manual-adjustments.ts` provides normalization + read helpers with zero-safe defaults.

### Design notes

- All manual bonuses are **additive**, not replacements. This covers the "I want 5 extra HP per bar at level 1" and "+2 flat on every Skill roll" use cases without introducing a separate override/replace mode. Full-replacement semantics for HP/Stress bars are deliberately **not** implemented in this release — say so if you want the next iteration to add a dedicated override path.
- `DR %` is added before the 0–100 clamp, so a Manual DR bonus cannot push the total above 100 %.
- Manual adjustments never participate in the closed DR subsystem — they are purely sheet-level and do not grant a Passive base.

## [0.5.3] - 2026-04-26

### Fixed

- **Power picker: Active Buff / Passive entries were being saved as Reactions.** Reactions and Active Buffs shared several `templateName` values (`Armor`, `Evade`, `Temporary HP`, `Damage Reduction`, `Phasing`, `Armor + Temporary HP`, `Evade + Temporary HP`, `Temporary HP + Healing`, and their combined siblings). The catalog used `templateName` as the entry `name`, so `findCatalogEntryByName` always returned the first hit — the Reaction variant — regardless of which option the user clicked. Creation then blocked the pick with "You already have the maximum number of Reaction powers". `makeEntry` now uses the category-prefixed `t.name` (e.g. `"Active Buff: Armor"`, `"Reaction: Armor"`, `"Passive: Fortified Frame"`) as the unique lookup key, so each category's entry resolves to the correct `CatalogEntry` and uses the correct creation-slot bucket. The dropdown label is unchanged (still `templateName · subfamily [Category]`).

## [0.5.2] - 2026-04-26

### Fixed

- **Passive templates realigned to the canonical Passive Design Rules.** `src/utils/powers/templates/passives.ts` was rewritten end-to-end because several passive curves had drifted from the published spec. Concrete corrections:
  - **Fortified Frame (Armor):** now `[1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21]` (was `[6, 12, … 86]`).
  - **Damage Reduction:** milestone curve `0 / 0 / 10 % ×5 / 20 % ×7 / 30 % ×2` (was `10 / 20 / 30 / 40 / 50 %` — capped too high).
  - **Evade:** `+2 / +4 / … / +32` (was `+10 / +18 / … / +130`).
  - **Temporary HP:** `10 / 20 / … / 160` (was `12 / 22 / … / 162`).
  - **Regeneration:** `2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40` HP at start of turn (was `1, 2, … 16`).
  - **Ghostform:** caps at **3 Phasing charges** (`0×3, 1×4, 2×7, 3×2`) — previously reached `4` charges.
  - **Killing Intent:** `d6` dice on `— / +1d6 ×2 / +2d6 ×2 / … / +8d6` (was `d8` dice with a different shape).
  - **Deep Vitality (Health):** Health-Bar milestones (`+Wounded` → `+W+Injured` → `+W+I+Bruised` → `+W+I+B+Healthy`) instead of a flat `+X Max HP` rider.
  - **Heightened Senses (Awareness):** Combat-Sense milestones (1 / 2 / 3 / 4 senses, Presence Sense unlocked at L12) instead of "+lvl initiative dice".
- **Conditional passives** now use the real conditional curves instead of halving the unconditional one:
  - Stone Stance / Surrounded Bulwark → `[3, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29, 32, 35, 37, 40, 43]` Armor.
  - Flowing Step / Duelist Footwork → `[4, 8, 12, … 64]` Evade.
  - Momentum / Ambusher / Bloodlust / Executioner → `+1d6` per level (up to `+16d6`).
  - Blood Feast / Battle Trance / Stillness Recovery → `5 / 10 / … / 80 HP` with the correct per-template gate, replacing the wrong on-kill / on-scene / Mind-save effects.
- **All 12 Combined Passives** now follow the exact per-level tables from the spec (Armor / THP, Armor / Healing, Armor / Health, Evade / THP, Evade / Healing, Evade / Damage, Damage / Healing, Damage / THP, Awareness / Evade, Awareness / Damage, Health / Healing, Health / THP). Combined Health lines correctly **never** grant a Healthy Health Bar.
- **All 12 Conditional Combined Passives** rebuilt with their proper per-level tables and condition gates (ally-adjacent, 0 m / 8 m move, Bleeding, Wounded-or-worse, non-sight Combat Sense).
- **Passive Special Aura** is now strictly binary (`+1 step`) on the chosen eligible `Special(X)`, with scaling only through radius milestones `—, —, —, 2 m, 3 m, 4 m, 5 m ×3, 6 m ×3, 7 m ×3, 8 m`. Previously the template scaled `rank = ceil(lvl / 2)` and had wrong radii.

### Changed

- Passive `conditionExpr` fields are now emitted for all conditional / conditional-combined passives (e.g. `self.adjacentEnemies >= 2`, `self.turnMoved >= 8`, `self.hasSpecial.bleeding`, `self.healthState <= wounded`, `target.perceivedByNonSightSense`), making the gate declarative for future runtime support.
- Per-level progression is now centralised in named tables at the top of `passives.ts` (`ARMOR_UNCOND`, `ARMOR_COND`, `HEAL_UNCOND`, `HEAL_COND`, `DMG_KILLING_INTENT`, `DMG_COND`, `COMB_*`, `CC_*`), so future spec tweaks land as single-array edits.

### Tests

- Full suite remains green: 25 files / 391 tests pass.

## [0.5.1] - 2026-04-26

### Added

- **Ranged Images (Illusion Field) template.** New Active template `active-ranged-illusion-image` in the `illusion` subfamily. Levels 1–16 scale Image Tier (I → VII) and Radius (single small → 3 m) per the 4-Round Illusion Field formula. No damage, no Specials, no real cover — purely sensory battlefield deception.
- **Pure weapon-attack templates (no Special slot).** Seven new templates in the new `weapon-attack` subfamily:
  - `active-melee-weapon-single` / `active-ranged-weapon-single` — clean single-target weapon attacks, +2d8…+32d8 scaling.
  - `active-melee-weapon-aoe` / `active-ranged-weapon-aoe` — self-centered and target-point bursts that follow the Radius / damage curve from the source doc.
  - `active-melee-weapon-split` / `active-ranged-weapon-split` — Split Attacks (2 → 3 → 4 targets as level rises; single shared Damage Pool).
  - `active-ranged-weapon-autofire` — one attack roll, 1–8 additional targets via Raises; only the primary takes bonus damage.
  These templates have no `specialSlot`, so the catalog emits exactly one entry each (no per-Special expansion) and they ignore the Special filter.

### Changed

- **Stunning Strike rewrite.** `active-melee-damage-stunned` and `active-ranged-damage-stunned` now emit **fixed binary Stunned** (no `rank`) instead of the old scaling `Stunned(X)` with Tier-6 rank curves. Damage is the scaling axis: Melee unlocks at L4 (+0 → +24d8), Ranged at L5 with its real +0 / +2 / +4 / +5 / +7 / +9 / … progression reflecting the Range-every-level cost. Pre-unlock levels explicitly print "No Stun version is available at this Power rank."
- **Power picker filters.** Tier dropdown is gone from the Add-Power dialog — Tier was a pricing bucket, never a player-facing axis. The Special dropdown is now populated dynamically from the currently-visible catalog entries via `getVisibleSpecialOptions({ category, subfamily, … })`, so you pick directly by `Hex`, `Prone`, `Frightened`, `Blinded`, `Regeneration`, `Poisoned`, `Shock`, `Stunned`, … Tier badges in the picker labels are removed; only the chosen Special key is shown.
- **Lazy `ACTIVE_TEMPLATES` build.** `src/utils/powers/templates/actives.ts` wraps the registry in a `buildActiveTemplates()` closure so template factories and progression tables declared below the registry no longer trip TDZ errors on module load.

### Tests

- `tests/power-catalog.test.ts` gets three new cases covering the seven weapon-attack templates, the Ranged Images illusion, and the binary-Stunned shape on the Stunning Strike rows. Full suite: 391 / 391 green.

## [0.5.0] - 2026-04-25

### Breaking

- **Mastery Trees are retired.** All tree-specific power files (`ashguard`, `dragon`, `bloodforge`, `warden-dragon`, …), the magic-spells directory, and the Mastery-Tree / Spell-School facades have been deleted. The legacy `mastery-trees`, `magic-powers`, and `spell-schools` modules are now empty compatibility stubs and will be removed in a later release.
- **Power levels now run 1–16** (up from 1–4). `PowerLevelKey` is `'1' | '2' | … | '16'`; every `Record<PowerLevelKey, …>` map covers the full range.
- **Power items are reset once.** A new migration (`src/migrations/templates-cutover.ts`) deletes every `item.type === 'power'` from actors on the first `ready` hook after upgrade so the character sheet starts fresh against the new picker. **Players must re-pick their powers after updating.**

### Added

- **Template-based power registry.** `src/utils/powers/templates/` holds five category files (`movement.ts`, `reaction.ts`, `activeBuffs.ts`, `passives.ts`, `actives.ts`) plus `_shared.ts` (row/level helpers) and `_specials.ts` (per-tier Active Special catalog). `index.ts` exposes `ALL_POWER_TEMPLATES`, `getSubfamiliesByCategory`, `getTemplatesBySubfamily`, `getEligibleSpecialsForCategory`.
- **Power Catalog rewrite.** `power-catalog.ts` now expands every Active damage template into one `CatalogEntry` per eligible Special (Tier 3–6). Filters: `category`, `subfamily`, `templateId`, `tier`, `special`, `search`.
- **Three-stage power picker.** The character-sheet power dialog filters Category → Subfamily → (Active: Tier + Special + Search / other: Search) with the tree dropdown removed.
- **Active-as-Spell at character creation.** Any Active can be flipped into a Spell with:
  - Casting Attribute (`intellect` / `resolve`)
  - Resolution (`spellAttack` vs Evade, or `saveSpell` vs Save DC = 8 × MR)
  - Save Type (`body` / `mind` / `spirit`) for Save Spells
  - Max Spell Level cap = `Mastery Rank × 2` enforced in the picker
- **Spell roll pipeline (`src/combat/spell-roll-handler.ts`).** `calculateBaseTN` (8 × ceil(lvl/2)), `calculateSaveDC`, `getMaxSpellLevel`, `canCastSpellAtLevel`, and `rollSpell` handle Base TN, Raises (+4 TN each), Blood Raises (4 HP = +4 total, ignores armor, unhealable until combat ends), `1d8` Stress on fizzle, and GM fiction modifier. A `combatEnd` / `deleteCombat` hook clears the Blood Raise flag.
- **Docs & tests.** `docs/power-structure-new.json` documents the new template/spell fields and 16-level range; `README.md` gets "Authoring a new Power Template" and "Spell-casting an Active" sections. New tests: `tests/power-catalog.test.ts`, `tests/spell-roll-handler.test.ts`.

### Changed

- `artifact-node-options.ts`, `power-mechanics.ts`, `damage-dialog.ts`, and `radial-menu/options.ts` now resolve power definitions through `ALL_POWER_TEMPLATES` via `templateId` (fallback: template name).
- `attack-executor.ts` prefers `isSpell` + `castingAttribute` over the legacy tree-attribute mapping.

### Removed

- `src/utils/powers/*.ts` (all tree files except `index.ts` and `types.ts`), `src/utils/spells/**`, and `tests/dragon-trees.test.ts`. Two tree-specific fallback assertions in `tests/power-mechanics.test.ts` were retired with a note.

## [0.4.267] - 2026-04-18

### Added
- **Power Mechanics Engine — full scope translation (Release 3 complete).** Ran the `scripts/translate-powers.js --apply` pass across **all 15 source files** (11 Mastery Trees + 4 Spell Schools) and committed each tree/school as its own changeset for clean bisectability:
  - Warden Dragon (52/72), Dreadstalker (52/72), Ashguard (52/72), Hexbound Harrier (48/72), Gale Breaker (48/72), Raptor Dragon (46/72), Dreadwyrm (40/72), Infernal Bastion (32/48), Doomscribe (28/48), Void Testament (28/48), Storm Veil (28/48), plus Pact Breach (16/32), Black Writ (12/32), Pyre Calculus (8/32). **490 of 824 level rows** (**59%**) received structured `mechanics` blocks auto-translated from effect text.
  - The remaining 334 rows are flagged in `reports/translation/*.md` with the exact un-matched clause — they can now be completed rank-by-rank via the in-Foundry Power Mechanics Editor Dialog (no code edits required).
- **Spell-level mechanics.** Added `mechanics?: PowerMechanics` to `SpellLevelDefinition` so spells participate in the same aggregator + conditional engine as powers.
- **Attributes tab — Mechanics breakdown tooltips.** Armor / Evade / Initiative tooltips now render a new "From active passives & buffs" section that lists every source currently contributing a number to the stat (e.g. `Stand Fast (slotted) +1d8`), reading directly from `system.derived.mechanicsBreakdown`. Regeneration contributions appear below the Armor tooltip. Each Saving Throw card shows its own dice-delta summary when the aggregator has entries for Body / Mind / Spirit saves.
- **Power Picker — Effect Type filter.** New `Effect Type` select in the Add-Power dialog filters the visible Power list by the structural mechanic it grants (Armor, Evade, Initiative, Regen, Temp HP, Save Dice, Damage Rider, Movement). Options that have no visible Power under the current Category / Spell / Echo filter are auto-hidden — the list never shows an empty Effect Type.

### Changed
- **All character-creation purchases are now at Rank 2.** While `!creation.complete`, `character-sheet-power-dialog` hard-codes `rank = 2` on `createEmbeddedDocuments`, matching the starting Mastery Rank of 2. Post-creation the rank picker still lets the player choose any rank up to their Mastery Rank.
- **Power Picker — Specials filter cleanup.** Dropped every non-canonical Special key from `collectSpecialKeys` (descriptive / conditional clauses like `if-target-marked` or `expose-on-hit` are no longer surfaced as "Specials"). Only the 30 canonical entries defined in `special-effects.ts` (Bleeding, Mark, Shock, Freeze, Ignite, Expose, Penetration, Precision, Bulwark, Brace, Crit, Immovable, …) remain filter-eligible. The Specials dropdown now also dynamically shrinks to the keys present on the currently-visible Powers so you never pick a value that produces an empty list.
- **`scripts/translate-powers.js` saveDice matcher** — merged both overlap patterns into a single unified regex with position-deduped capture, eliminating the "+2 dice → +4" double-counting bug that affected Stand Fast (Warden) and every analogous Save-or-X power.

### Fixed
- Handlebars helpers `gte` / `lt` on numeric values in the breakdown renderer output (signed + prefix on positive bonuses) display consistently across Armor, Evade, Initiative, and Save-Dice breakdowns.

### Tests
- Full suite stays green at 306 / 306 across 17 files after every single tree / school application.

### Dev
- New types exported from `src/utils/power-catalog.ts`: `EFFECT_TYPE_KEYS`, `EFFECT_TYPE_LABELS`, `EffectTypeKey`, plus the helper `getVisibleEffectTypeOptions(filter)` and the Specials companion `getVisibleSpecialOptions(filter)`. Both feed the picker dropdowns and are safe to reuse for any future filterable picker.
- `CatalogEntry.effectTypes: string[]` is computed at catalog-build time by `collectEffectTypes(def)` which walks every level's `mechanics` block and records the structural fields it touches (`armor`, `evade`, `initiativeD8`, `regen`, `tempHP`, `saveDice`, `damageRider`, `movementBonus`). Powers without mechanics simply contribute an empty array — the filter then hides the entire "Effect Type" category for them.

## [0.4.266] - 2026-04-18

### Added
- **Power Mechanics Engine — Conditional Damage-Rider Engine.** Attacks now resolve per-target condition-gated riders at damage time. `collectConditionalDamageRiders(attacker, target, selectedPower)` walks the attacker's slot-activated passives, live active buffs, and the selected power's own mechanics, and returns every `damageRider` whose `vsCondition` (e.g. `hexed`, `marked`, `ignited`, `shocked`, `frozen`) matches the target, plus any `damageRider.flat` whose sibling `condition` gate evaluates true. Each firing rider rolls its own `+Nd8` pool, is stacked onto `totalDamage`, shown as a dedicated line in the damage chat output (e.g. `Pact Brand (slotted) vs hexed: 1d8: [7]`), and reported in the specials list (`Pact Brand (slotted) (+2d8 vs hexed)`).
- **Target-aware roll-dice deltas.** `getRollDiceDelta(actor, kind, target?)` now optionally accepts a target actor. When provided, passives/buffs whose `condition` gate is target-facing (`targetHexed`, `targetMarked`, …) are folded into the dice-pool adjustment. Attack rolls pass the current target automatically. This means "+1 attack die vs Hexed" written as `{ rollDice: { attack: 1 }, condition: 'targetHexed', applyWhen: 'passive-slotted-active' }` **actually fires** only when the target carries the condition — no more naive flag parsing on free-text.
- **Condition checker (`hasCondition`).** Robust multi-source lookup: Foundry v13 `actor.statuses` Set, active-effect names/labels (respects `disabled`), `flags['mastery-system'].conditions`, `system.conditions` / `system.status` booleans, and `system.specials` string entries like `"Bleeding(3)"`. Synonyms are normalized (`burning` → `ignited`, `bleed` → `bleeding`, `hex` → `hexed`, …) so writers can use natural phrasing in the picker/chat and the engine still matches.
- **Power Mechanics Editor Dialog (`openPowerMechanicsEditor`).** New in-Foundry UI for viewing and editing the structured `PowerMechanics` block of any embedded power item on an actor. Opens from the new cog-wheel button on the power card (`.power-edit-mechanics`). Provides a guided form for all common fields (armor, evade, initiativeD8, tempHP, regen, movementBonus, ignoreTerrain, rollDice.{attack,skill,damage}, saveDice.{body,mind,spirit}, damageRider.{flat,vsCondition,vsConditionDamage}, applyWhen, duration, usageLimit, condition gate), plus a Raw-JSON panel for anything the form does not cover. Two scopes: **Power-level default** (`system.mechanics`, applies to every rank that has no own block) and **Rank-N override** (`system.levels.<rank>.mechanics`). Saves via `item.update` — the aggregator picks up changes on the next `prepareDerivedData` tick.

### Changed
- **Aggregator**: conditional `mechanics` blocks (those carrying a `condition` gate) no longer contribute to the unconditional `mechanicsBreakdown.totals`. Their unconditional parts were silently being added on top regardless of the gate; now they are only folded in per-roll / per-damage via the conditional engine. This makes an actor's visible Armor/Evade/SaveDice totals reflect only what is actually active *right now*, not *might be active given the right target*.
- **Damage chat line** now lists conditional-rider contributions alongside specials, so the GM sees exactly which source fired (`Eldritch Bolt (attack) (+3d8 vs hexed)`).

### Fixed
- **Echo Tab contrast.** The Echo tab's deck block, trait rows, card list, card-use buttons, status chip, Blood Color / Concept / Appearance / Notes fields had no dedicated CSS and were inheriting Foundry defaults (near-black text on our dark `--df-bg-*` backgrounds), making most of the tab unreadable. All Echo classes (`.echo-tab-content`, `.creation-echo-*`, `.echo-status`, `.echo-deck-*`, `.echo-trait-*`, `.echo-card-*`) now use the `--df-text-primary` / `--df-text-secondary` variables consistently with the rest of the sheet. Status chip styles (ok / partial / missing) use the same green / amber / red palette as the creation checklist.

### Tests
- Added new unit tests under `tests/power-mechanics.test.ts` covering `hasCondition` (all five lookup sources + synonyms + disabled effects), `evaluateConditionGate` (target-facing, self-facing, null), `collectConditionalDamageRiders` (vsCondition match / no-match, gated flat, selected-power rider), and `getRollDiceDelta` target-conditional fold-in. Full suite: 306 / 306 passing across 17 files.

### Dev
- New module `src/sheets/power-mechanics-editor-dialog.ts` — self-contained; dynamically imported from the character sheet to avoid bundling it into the default path.

## [0.4.265] - 2026-04-18

### Added
- **Power Mechanics Engine (Release 2 of 4) — Mass-Translation Tool.** Introduces the developer script `scripts/translate-powers.js` that scans all 11 mastery trees (Warden Dragon, Raptor Dragon, Dreadwyrm, Dreadstalker, Doomscribe, Hexbound Harrier, Void Testament, Gale Breaker, Storm Veil, Ashguard, Infernal Bastion) and 4 spell schools (Black Writ, Pact Breach, Split Tempest, Pyre Calculus), runs a bank of 13 regex shape-matchers over every level's `effect.text`, and produces tree-by-tree Markdown reports under `reports/translation/<slug>.md` split into Auto-applied and Needs-review sections with per-level tracing. An Apply mode (`--apply <slug>` / `--apply-all`) is also provided: it uses **ts-morph** for AST-safe insertion of the generated `mechanics: { ... }` block into each level row, preserving surrounding formatting.
- **Matchers currently implemented**: Armor, Evade, SaveDice (Body/Mind/Spirit including "next … Save" phrasing), Regen, TempHP (flat or dice), MovementBonus, IgnoreTerrain, InitiativeD8, rollDice.attack, rollDice.skill, damageRider.flat, damageRider.vsCondition, plus a condition matcher covering Marked / Ignited / Shocked / Frozen / **Hexed**. `applyWhen` and `duration` defaults derive from the power's `category` (passive → `passive-slotted-active`; activeBuff → `activeBuff-active` + `masteryRankRounds`; reaction → `reaction-once-per-round` with per-round usage cap; active/movement → `attack-rider`). Both the new object-shaped `levels: { '1': ... }` mastery form and the legacy array-shaped `levels: [ { level: 1, ... } ]` spell form are supported.
- **Dry-run baseline** (no content written): 490 / 824 level rows auto-propose a structured mechanics block (59% overall, ~63% for mastery trees). Mastery-tree coverage per file ranges from 39% (Dreadwyrm) to 72% (Ashguard); spell schools are lower (12–50%) because their rows typically express only the base damage via `roll.damage` and carry no passive/on-top bonus. Release 3 will drive tree-by-tree review and apply.

### Changed
- **Schema**: `PowerMechanics.condition` now also accepts `'targetHexed'`, and `PowerMechanics.damageRider.vsCondition` accepts `'hexed'` — needed so the Hex-build spell schools (Void Testament / Pact Breach) can express "damage vs. Hexed target" riders structurally.

### Dev
- Added `ts-morph` as a devDependency. It is only loaded by `scripts/translate-powers.js` and is never part of the runtime bundle.

### Notes
- **No power files were modified in this release** — the script only *proposes* mechanics blocks and *reports*. Applying them tree-by-tree happens in Release 3 and is committed per tree.

## [0.4.264] - 2026-04-18

### Added
- **Power Mechanics Engine (Release 1 of 4) — Schema + Aggregator + Roll Registry.** Introduces a structured `mechanics` block on power definitions so that Armor / Evade / Initiative d8 / Regen / TempHP / dice-pool bonuses can be declared once in data and applied automatically, while keeping full transparency via a per-actor breakdown.
  - **New types.** `PowerMechanics` in `src/types/item.d.ts` describes per-rank or power-level defaults: flat `armor`, `evade`, `initiativeD8`, `regen`, `tempHP`, `movementBonus`, `ignoreTerrain`, plus `saveDice` (body/mind/spirit), `rollDice` (attack/skill/damage), `damageRider`, `applyWhen`, `duration`, `usageLimit` and `condition`. `MechanicsBreakdown` + `MechanicsBreakdownEntry` in `src/types/actor.d.ts` capture the aggregator output; `DerivedData` is the container at `actor.system.derived.mechanicsBreakdown`.
  - **Aggregator** (`src/utils/power-mechanics.ts`). `buildActorMechanicsBreakdown(actor)` enumerates every slot-activated passive (`system.passives.slotN.active === true`) and every live `ActiveEffect` flagged `activeBuff`, resolves each power's rank-specific `mechanics` (falling back to the power-level default), and sums numeric contributions into totals plus per-source breakdown arrays.
  - **Wired into `prepareDerivedData`** (`src/documents/actor.ts`). After the existing equipment-driven Armor/Evade/Initiative calculation, the aggregator total is added **on top** (never replacing) and per-source rows are appended to `armorBreakdownRows` / `evadeBreakdownRows` / `initiativeEquipmentRows`. Powers without a `mechanics` block are unaffected — they remain purely descriptive, so this change is strictly additive and backward-safe.
  - **Roll-bonus registry** (`src/dice/roll-handler.ts`). New `rollKind` on `RollOptions` (`attack` / `skill` / `damage` / `saveBody` / `saveMind` / `saveSpirit`). `masteryRoll` now consults `getRollDiceDelta(actor, rollKind)` and adjusts `numDice` accordingly, recording the applied delta in the roll's flavor so players always see *why* the pool changed. Threaded through `quickRoll`, `#onSavingThrowRoll`, and the attack-roll pipeline.
  - **Active Buff snapshot.** `activateActiveBuff` in `src/utils/active-buffs.ts` now stores the source power's resolved `mechanics` on `effect.flags.mastery-system.mechanics`, so the aggregator can read the buff even if the source power is later deleted.
  - **Tests** (`tests/power-mechanics.test.ts`). Covers `resolvePowerMechanics` rank preference + top-level fallback + rank clamping, aggregator summing for armor / evade / saveDice / rollDice / tempHP / initiativeD8 / movementBonus / regen, slot-activated passive collection (active-only, empty-slot skip, wrong-applyWhen rejection), active buff collection (flag-mechanics preferred, item fallback, non-buff and wrong-applyWhen rejection), and `getRollDiceDelta` for every kind.

### Notes
- **No content translation yet.** No existing power carries a `mechanics` block after this release — so in-game behavior is identical to 0.4.263 for every player. Release 2 will add the mass-translation tool, and Release 3 will commit the actual structured data tree-by-tree.
- Option A (explicit mechanics block + aggregator) was chosen over Option B (Foundry `ActiveEffect.changes`). Rationale: slot toggles avoid embedded-document churn, conditional/compound effects would need custom code anyway, and the breakdown list gives players a visible audit trail of every bonus — addressing the common complaint that stat changes in other systems happen invisibly.

## [0.4.263] - 2026-04-18

### Fixed
- **Echo buttons disabled during Character Creation.** `#lockSheetForCreation` in `src/sheets/character-sheet.ts` pauschal disables every button that is not on an explicit allow-list while creation is incomplete. The Echo buttons (`.choose-echo-btn`, `.add-echo-card-btn`, `.echo-card-use-btn`) were missing from both the `:not(...)` skip list and the subsequent re-enable list, so they rendered with `disabled=""` and could not be clicked. All three are now whitelisted and stay interactive during creation — users can choose their Echo as intended.

## [0.4.262] - 2026-04-18

### Fixed
- **Choose Echo button not usable for existing characters.** The `choose-echo-btn` was wrapped in `{{#unless creationComplete}}` and therefore hidden on any character where `system.creation.complete` was not explicitly `false` (the default for pre-existing actors). The button is now always rendered; its label switches dynamically between **Choose Echo** (no Echo set) and **Change Echo** (Echo already set), so characters can pick or swap their Echo at any time.

### Changed
- **Biography tab merged into the Echo tab and removed.** Blood Color, Concept, Appearance and Notes now live at the bottom of the Echo tab (after Echo Notes). The top-level **Bio** tab entry and its container have been deleted. No data migration — `system.bloodColor`, `system.bio.concept`, `system.bio.appearance`, `system.bio.notes` paths are unchanged.
- **Echo tab repositioned between Attributes and Skills.** The tab was previously at the very front which felt disconnected; it now sits as a second tab, keeping Attributes as the landing view.
- `src/sheets/character-sheet.ts`: `initial` reverted to `attributes` (was `echo` in 0.4.261).

### Notes
- No data model changes. Pure UI/template refactor plus the visibility fix for the Echo button.

## [0.4.261] - 2026-04-18

### Changed
- **Echo now has its own top-level tab** on the character sheet, placed first (before Attributes) — Echo is treated like an ancestry/race, so it opens by default when a sheet is displayed.
- The Echo creation step (`Choose Echo` button + status badge) was moved out of the Powers tab and into the new Echo tab. The Powers tab is now strictly about power selection.
- The Echo Deck block (tagline, creature type/size/speed, Core Traits with daily uses, Card slots incl. `Add Card` and `Use` buttons) was moved out of the Biography tab and into the new Echo tab.
- The former freetext Echo field (`system.bio.echo`, HTML editor) was moved out of the Biography tab and relabeled to **Echo Notes** inside the new Echo tab. The underlying data path is unchanged — existing content is preserved without migration.
- `src/sheets/character-sheet.ts`: tab config `initial` changed from `attributes` to `echo`; `scrollY` extended with `.echo`.

### Notes
- No data model changes (`actor.system.echo.*` and `system.bio.echo` paths remain identical). Pure UI/template refactor — all existing listeners (`.choose-echo-btn`, `.add-echo-card-btn`, `.echo-card-use-btn`) continue to work against the relocated DOM.
- No impact on the Dragonborn power gating (`requiresEcho`) — `actor.system.echo.key` is untouched.

## [0.4.260] - 2026-04-18

### Changed
- **Character Creation — Skill Points raised from 16 to 40.** Newly created characters now distribute 40 skill points (subject to the existing `MAX_SKILL_AT_CREATION = 4` cap per skill). Updated in `src/utils/constants.ts` (`CREATION.SKILL_POINTS`), the runtime `CONFIG.MASTERY.creation.skillPoints` default in `src/module.ts`, and the fallback defaults in `src/sheets/character-sheet.ts`. Test `tests/constants.test.ts` updated accordingly.

## [0.4.259] - 2026-04-18

### Added
- **New Mastery Tree: Warden Dragon** — Dragonborn-exclusive (Tank / Control / Space Holder, Primary Attribute: Might, Primary Specials: Push, Prone; Secondary Axis: Armor / Body Saves)
  - Tree Bonus (Natural Weapons): Claws / Bite / Tail attacks deal 1d8 per 2 Warden Dragon powers learned, up to 4d8 (documented in the file header).
  - 18 Powers total: 4 Actives (Tail Sweep, Earthshaker Stomp, Bulwark Bite, Bodywall Crash), 4 Passives (Dragon Scales, Ancient Bulk, Immovable, Territorial Presence), 4 Reactions (Scale Ward, Guarding Tail, Stand Fast, Interposing Frame), 4 Active Buffs (Fortress Form, Rooted Majesty, Siegeblood, Throne Ground), 2 Movement Powers (Wing Brace, Stonewing Advance).
- **New Mastery Tree: Raptor Dragon** — Dragonborn-exclusive (Skirmisher / Dive Hunter / Pick Pressure, Primary Attribute: Agility, Primary Specials: Mark, Corrode; Secondary: Pull, Penetration)
  - Tree Bonus (Natural Weapons): Claws / Bite / Tail attacks deal 1d8 per 2 Raptor Dragon powers learned, up to 4d8 (documented in the file header).
  - 18 Powers total: 4 Actives (Skyhook Snatch, Rending Chain, Execute, Dive Rend), 4 Passives (Blood Scent, Corrosive Talons, Aerial Predator, Marked for the Kill), 4 Reactions (Bite, Predatory Turn, Wing Slip, Cruel Timing), 4 Active Buffs (Take Flight, Hunter's Focus, Acid Bloodlust, Raptor's Tempo), 2 Movement Powers (Flyby, Dive Drop).
- **New Mastery Tree: Dreadwyrm** — Dragonborn-exclusive (AoE Controller / Supporter / Buffer via Roar, Primary Attribute: Influence, Primary Specials: Mark, Push; fear/command via Mind-Save penalties)
  - Tree Bonus (Natural Weapons): Claws / Bite / Tail attacks deal 1d8 per 2 Dreadwyrm powers learned, up to 4d8 (documented in the file header).
  - 18 Powers total: 4 Actives (Crushing Gaze, Dread Breath, Terrifying Sweep, Commanding Strike), 4 Passives (Draconic Presence, Rule by Fear, Overking's Voice, Aura of Submission), 4 Reactions (Tyrant's Rebuke, Command Denial, Roar of Defiance, Herald's Mark), 4 Active Buffs (Tyrant's Roar, Aura of Command, Nightmare Presence, Hunt Decree), 2 Movement Powers (Wingbeat of Terror, Imperious Advance).

### Changed
- `NewArtifactPowerData` (`src/types/item.d.ts`) now supports an optional `requiresEcho: string[]` field. Powers listing this field are only offered in the Power Picker when the character's Echo key matches one of the listed values.
- `CatalogEntry` and `filterCatalog` (`src/utils/power-catalog.ts`) now support echo-gating via the new `actorEchoKey` filter option. Gated entries are completely hidden from the picker — not just disabled — when the actor does not carry the required Echo. Without an `actorEchoKey`, gated entries are also hidden (safe default for non-character contexts).
- `showPowerCreationDialog` (`src/sheets/character-sheet-power-dialog.ts`) now reads `actor.system.echo.key` and forwards it to the catalog filter, so the three new Dragon trees only appear for characters that chose the **Dragonborn** Echo.
- `src/utils/powers/index.ts` and `src/utils/mastery-trees.ts` now register `Warden Dragon`, `Raptor Dragon`, and `Dreadwyrm` as selectable trees (automatically wired into the unified power catalog).

## [0.4.258] - 2026-04-18

### Added
- **New Mastery Tree: Ashguard** (Frontline Bruiser / Attrition Tank, Primary: Ignite, Secondary Axis: Armor)
  - Tree Bonus: Once per round, when you apply or increase Ignite, gain +1 Armor until the start of your next turn (documented in file header).
  - 18 Powers total: 4 Actives (Cinder Cleave, Ember Bash, Scorch Ring, Siege Cut), 4 Passives (Coal Plate, Burn Tempered, Furnace Heart, Iron Flame), 4 Reactions (Flare Guard, Answering Heat, Step Through Flame, Feed the Furnace), 4 Active Buffs (Forge Shell, Walking Furnace, Combustion Plate, Coals of War), 2 Movement Powers (Ember Stride, Smoke Step).
- **New Mastery Tree: Infernal Bastion** (Frontline Spellcaster / Burn Tank spell tree, Primary: Ignite, Secondary Axis: Armor)
  - Tree Bonus: Once per round, when you apply or increase Ignite, gain +1 Armor until the start of your next turn (documented in file header).
  - 12 Powers total (caster framework — no Actives; damage comes from the Pyre Calculus Spell List): 4 Passives (Arcane Combustion, Flameguard, Ember Focus, Phoenix Mantle), 4 Reactions (Sear Ward, Backdraft, Cinder Shell, Feed the Core), 4 Active Buffs (Combustion Surge, Inferno Core, Flameplate, Phoenix Core).
- **New Spell School: Pyre Calculus — Burn Pressure / Frontline Firecasting** (companion Spell List for Infernal Bastion)
  - 8 Spells: 6 Active Spells (Ember Lance, Flame Fan, Furnace Mark, Bastion Flare, Crown of Cinders, Siege Flame) and 2 Movement Spells (Ash Fold, Backdraft Step).

### Changed
- `src/utils/mastery-trees.ts` now lists `ashguard` and `infernalBastion` as selectable trees.
- `src/utils/spell-schools.ts` now lists `pyreCalculus` as a selectable school.
- `src/utils/powers/index.ts`, `src/utils/spells/index.ts`, and `src/utils/magic-powers.ts` aggregate the three new Ignite-themed content packs so they flow into the unified power catalog and power picker automatically.

## [0.4.257] - 2026-04-18

### Added
- **New Mastery Tree: Gale Breaker** (Skirmisher / Tempo Defender / Shock Support, Primary: Shock, Secondary: Evade)
  - 18 Powers total: 4 Actives (Jolt Cut, Crosswind Hit, Rattle Line, Screen Thrust), 4 Passives (Storm Screen, Late Strikes, Screen Fighter, Sudden Gap), 4 Reactions (Intercept the Angle, Punish the Lag, Carry the Wind, Steady the Line), 4 Active Buffs (Slipstream Order, Rattle Them, Stay Ahead, Safe Current), 2 Movement Powers (Wind Cut, Wash Out).
- **New Mastery Tree: Storm Veil** (Ranged Striker / Control Support spell tree, Primary: Shock, Secondary: Expose)
  - 12 Powers total (caster framework — no Actives; damage comes from the Split Tempest Spell List): 4 Passives (Conductive Focus, Static Reading, Grounding Field, Storm Memory), 4 Reactions (Ride the Flinch, Open the Line, Storm Sidestep, Feedback Window), 4 Active Buffs (Eye of the Storm, Split Second, Strip the Angle, Charged Shell).
- **New Spell School: Split Tempest — Ranged Shock Pressure / Precision Follow-Up** (companion Spell List for Storm Veil)
  - 8 Spells: 6 Active Spells (Storm Needle, Forked Current, Thunderclap Sigil, Split the Stance, Storm Through, White Noise) and 2 Movement Spells (Arc Flit, Aftershock Slip).

### Changed
- `src/utils/mastery-trees.ts` now lists `galeBreaker` and `stormVeil` as selectable trees.
- `src/utils/spell-schools.ts` now lists `splitTempest` as a selectable school.
- `src/utils/powers/index.ts`, `src/utils/spells/index.ts`, and `src/utils/magic-powers.ts` aggregate the three new Shock-themed content packs so they flow into the unified power catalog and power picker automatically.

## [0.4.256] - 2026-04-18

### Added
- **New Mastery Tree: Hexbound Harrier** (Skirmisher / Setup Striker / Anti-Caster Support, Primary: Hex, Secondary: Expose)
  - 18 Powers total: 4 Actives (Witch Mark, Open Rib, Spellbait, Hex Feint), 4 Passives (Carrion Instinct, Crow Cuts, Lean Ward, Witch's Timing), 4 Reactions (Hand It Over, Drag the Sign, Sidestep the Ritual, Spell Window), 4 Active Buffs (Black Pace, Hex Drive, Open Them Up, Pay the Crow), 2 Movement Powers (Witchstep, Black Leave).
- **New Mastery Tree: Void Testament** (Pure Damage / Wardbreaker Caster spell tree, Primary: Hex, Secondary: Penetration)
  - 12 Powers total (caster framework — no Actives; damage comes from the Pact Breach Spell List): 4 Passives (Abyss Index, Breach Doctrine, Black Seal, Feast of the Crack), 4 Reactions (Tighten the Pact, Break the Ward, Abyssal Answer, Read the Fault), 4 Active Buffs (Devil's Ledger, Breach Mandate, Dark Vesting, Open the Gate).
- **New Spell School: Pact Breach — Single-Target Wardbreaker Magic** (companion Spell List for Void Testament)
  - 8 Spells: 6 Active Spells (Pact Spike, Ward Rend, Soul Tithe, Black Audit, Void Collection, Final Breach) and 2 Movement Spells (Rift Skive, Oath Slip).

### Changed
- `src/utils/mastery-trees.ts` now lists `hexboundHarrier` and `voidTestament` as selectable trees.
- `src/utils/spell-schools.ts` now lists `pactBreach` as a selectable school.
- `src/utils/powers/index.ts`, `src/utils/spells/index.ts`, and `src/utils/magic-powers.ts` aggregate the three new content packs so they flow into the unified power catalog and power picker automatically.

## [0.4.255] - 2026-04-18

### Added
- **Echo System (ancestry subsystem, Phases 1–4)** — full implementation of the seven playable Echos from the Player's Guide: Humans, Dwarfs, Elves, Sentinels, Titanborn, Dragonborn, Unbound. All Echo data lives on the Actor under `system.echo.*` — no Item-type bloat, daily reset is a single `actor.update`.
  - **Echo catalog** (`src/utils/echos/`): typed definitions for Core Traits (including `mr-per-rest`, `once-per-rest`, `passive`, `unlock-mr3`, `unlock-mr6`, `unlock-mr6-once` usage kinds), sub-choices (Elves Elemental Lineage, Sentinels Order Protocol), Dragonborn Veiled Form, and a 4-card Echo Deck with 4 skill-based options per card.
  - **Character-creation step**: new "Step 6 — Choose Echo" block in the creation banner with a single-pass dialog (Echo → Sub-choice → Veiled Form → Start Card). `canFinalize` now requires a fully configured Echo plus the existing attribute / skill / disadvantage / power checks.
  - **Echo Deck on the sheet** (Biography tab): shows the chosen Echo, sub-choice, and veiled form; lists Core Traits with `MR / rest` use counters and gating hints for MR-locked abilities; displays selected cards with triggers, 4 options each, "Use" buttons, and an "Add Card" button whenever new slots have been unlocked.
  - **Slot unlocks via Mastery Rank**: 1 card from creation, +1 at MR 2, +1 at MR 4, +1 at MR 6 (cap at 4 = full deck). Handled by `getUnlockedCardSlots` in the catalog.
  - **Safe Haven Rest reset**: `#onSafeHavenRest` now clears `system.echo.cardUses` and re-initialises `system.echo.traitUses` from the Echo's `mr-per-rest` / `once-per-rest` traits based on the current Mastery Rank.
  - **Echo Roll integration**: new `#onEchoRoll` handler posts a narrative chat message (Echo + card + option + description) and opens the standard Skill Roll dialog pre-loaded with the card option's skill. After the roll, the card is marked as used for the day (`system.echo.cardUses[cardId] = true`). Cancellation leaves the card available.
  - **Tests**: `tests/echo-deck.test.ts` — 22 tests covering slot unlocks at MR 1–99, card-use/rest simulation, sub-choice requirements (Elves 4, Sentinels 3, Dragonborn Veiled Form), trait gating (`unlock-mr3`, `unlock-mr6-once`), and that every card option references an existing `SKILLS` key.

### Changed
- **`CharacterData`** (`src/types/actor.d.ts`) gains an optional `echo?: CharacterEchoData` block (`key`, `subChoiceKey`, `veiledFormKey`, `selectedCardIds`, `cardUses`, `traitUses`). `bio.echo` stays as the human-readable name and is auto-filled from the Echo definition when an Echo is chosen.
- **`template.json`** — `actor.character` now seeds an empty `echo` block so every new character has a stable default shape.

## [0.4.254] - 2026-04-18

### Added
- **New Mastery Tree: Dreadstalker** (Pure Damage / Skirmisher Assassin, Primary: Mark, Secondary: Crit)
  - 14 Powers total: 4 Actives (Mark the Prey, Hunter's Slash, Flash Bomb, Death Sentence), 4 Passives (Quickdraw, Bloodhound, Sneak Attack, First Blood), 4 Reactions (Punish the Turn, Opportunist's Lunge, Slip the Counter, Finish the Opening), 4 Active Buffs (Predictable Movement, Killing Rhythm, Cold Start, Dead Sprint), 2 Movement Powers (Predator Step, Fade Through)
- **New Mastery Tree: Doomscribe** (Pure Damage / Execution Caster spell tree, Primary: Mark, Secondary: Crit)
  - 12 Powers total (caster framework — no Actives; damage comes from the Black Writ Spell List): 4 Passives (Death Ledger, Cruel Geometry, First Seal, Execution Logic), 4 Reactions (Seal the Misstep, Hold the Pattern, Punitive Echo, Read the Collapse), 4 Active Buffs (Final Notation, Predicted Ruin, Cold Sequence, No Escape Clause)
- **New Spell School: Black Writ — School of Ink & Execution** (companion Spell List for Doomscribe)
  - 8 Spells: 6 Active Spells (Brand of Ending, Cut the Thread, Grave Equation, Closed Circle, Write the Wound, Last Sentence) and 2 Movement Spells (Inkstep, Margin Slip)
- **New Special Effects** added to `ALL_SPECIAL_EFFECTS`: `sundered`, `pull`, `knockback`, `autofire`, `split-attack`, `extra-attack`; plus explicit entries for `corrode`, `weaken`, `hex`, `frightened`, `regeneration`, `soulburn`, `immovable`, `stun`, `dispel-magic`

### Changed
- **Special Effects SRD refresh** — `src/utils/special-effects.ts` rewritten to match the published SRD behavioural model:
  - `EffectCategory` now uses `diminishing` / `timed` / `untilUsed` / `instant` / `support` / `multiAttack` (was `physical` / `mental` / `damage` / `support`)
  - Every effect carries SRD-aligned description, duration, stacking, removal, Save type, Remove Action, dispellability, pricing formula, and (for Diminishing) `startPP`
  - Existing effects updated: `bleeding`, `freeze`, `poisoned`, `expose`, `mark`, `cleanse`, `stunned`, `blinded`, `prone`, `crit`, `brace`, `bulwark`, `precision`, `smite`, `penetration`, `brutal-impact`, `push`
  - Grouping exports replaced: `DIMINISHING_EFFECTS` / `TIMED_EFFECTS` / `UNTIL_USED_EFFECTS` / `INSTANT_EFFECTS` / `SUPPORT_EFFECTS` / `MULTI_ATTACK_EFFECTS`
- **Utility category retired system-wide**
  - `PowerCategory` reduced to `'active' | 'activeBuff' | 'reaction' | 'passive' | 'movement'`; `PowerActionCost` no longer allows `'utility'`
  - `CATEGORY_ORDER` / `CATEGORY_LABELS` / `CREATION_POWER_REQUIREMENTS` in `power-catalog.ts` now have 5 categories; character creation requires exactly **7 Powers** (2 Active, 1 Active Buff, 1 Movement, 1 Reaction, 2 Passive)
  - Character sheet Utility shortcut button removed; creation banner text updated to 7 powers
  - Legacy items with `powerType: 'utility'` are auto-mapped to `active` at runtime via `mapLegacyPowerType()` — existing actor sheets keep working
- **Power Picker contents reduced to new content only**
  - `TREE_POWER_MAP` (`powers/index.ts`) exposes only Dreadstalker and Doomscribe; all previous trees are kept on disk but no longer selectable
  - `ALL_MAGIC_POWERS` (`magic-powers.ts`) and `SPELL_SCHOOLS` (`spell-schools.ts`) expose only Black Writ; Pyromancy / Malefic Arts / Old Pact / Thorn & Whisper / Breach & Break / Aegis & Benedictions / Bound Mind remain on disk for existing character items, but no longer appear in the picker

### Removed
- **Utility power category** (system-wide; `utility` shortcut, `utility` slot in character creation, `utility` in `PowerCategory` / `PowerActionCost`)
- **Deprecated Special Effects** no longer listed in the SRD: `torment`, `curse`, `disoriented`, `charmed`, `grappled`

### Files Changed
- `src/utils/special-effects.ts` — full rewrite to SRD behavioural model
- `src/utils/power-catalog.ts` — 5-category order / labels / 7-slot requirements; legacy `'utility'` maps to `'active'`
- `src/types/item.d.ts` — `PowerCategory` / `PowerActionCost` no longer include `'utility'`
- `src/utils/powers/index.ts` — active trees reduced to Dreadstalker + Doomscribe (old imports commented as deprecated)
- `src/utils/magic-powers.ts` — active schools reduced to Black Writ (old imports commented as deprecated)
- `src/utils/spell-schools.ts` — `SPELL_SCHOOLS` reduced to `blackWrit`
- `src/utils/powers/dreadstalker.ts` *(new)* — full Dreadstalker Tree
- `src/utils/powers/doomscribe.ts` *(new)* — full Doomscribe Tree
- `src/utils/spells/black-writ.ts` *(new)* — full Black Writ Spell List
- `src/sheets/character-sheet.ts` — per-category counters updated to 5 categories, legacy `utility` powerType collapsed to `active`
- `src/sheets/character-sheet-power-dialog.ts` — same
- `src/utils/power-migration.ts` / `src/utils/power-definition-migration.ts` — legacy `'utility'` folded into `'active'` on convert
- `templates/actor/character-sheet.hbs` — Utility shortcut button removed, creation banner text updated to 7 powers

## [0.4.253] - 2026-04-18

### Changed
- **Power Picker: simplified filter UI**
  - Removed the free-text search input (was misleading and rarely helpful)
  - Removed the Tag dropdown; replaced by a simple **"Spell only"** checkbox (uses the `spell` tag under the hood)
  - Category dropdown, Spell checkbox and Special dropdown are now **always visible** regardless of the selected category
  - Special dropdown now lists **all** special keys found across the entire catalog (not just Active powers), with pretty labels from `ALL_SPECIAL_EFFECTS`
  - No data-schema changes: filtering continues to use existing `category`, `tags` and `levels.*.specials` fields

### Files Changed
- `src/sheets/character-sheet-power-dialog.ts` – rebuilt filter bar (Category + Spell checkbox + Special), removed search and tag handling
- `src/utils/power-catalog.ts` – added `getAllSpecialOptions()`; shared helper `collectSpecialOptions(predicate)`
- `styles/character-sheet.css` – styling for the new Spell checkbox row inside the filter grid

## [0.4.252] - 2026-04-18

### Changed
- **Character Creation: Category-based power requirements**
  - New creation slots (8 powers total, all fixed at Rank 1):
    - 2 Active, 1 Active Buff, 1 Movement, 1 Reaction, 2 Passive, 1 Utility
  - Unified Add-Power dialog merges Mastery Trees and Spell Schools into one filterable list
  - New filters: Category, Tag (e.g. `spell`) and Special (Ignite, Freeze, Shock, Penetration, ...) – tag/special filters appear only when Category = Active
  - Free-text search across power name and source (tree/school)
  - Category shortcut buttons on the character sheet pre-select the filter
  - Rank is locked to 1 during creation (rank selector hidden on power cards)
  - Per-category progress display in the creation banner (e.g. `Active: 1 / 2`)
  - Finalize-check validates exact per-category counts instead of total/Rank-2 rules
  - No migration: applies to newly created characters only

### Files Changed
- `src/utils/power-catalog.ts` (new) – unified catalog, filter helpers, creation requirements
- `src/sheets/character-sheet-power-dialog.ts` – rebuilt dialog with category/tag/special filters
- `src/sheets/character-sheet.ts` – per-category creation counts, shortcut button routing, finalize validation
- `templates/actor/character-sheet.hbs` – single Add-Power button + category shortcuts, per-category status display
- `styles/character-sheet.css` – styling for filter grid, search input, static rank display

## [0.4.78] - 2025-01-XX

### Changed
- **XP System: Unified Single Currency with History Tracking**
  - Replaced dual-currency system (Attribute XP + Mastery XP) with single unified XP currency
  - Added comprehensive XP tracking: `totalEarned`, `totalSpent`, `spentAttributes`
  - Implemented 50% attribute spend cap enforcement (based on total XP earned)
  - Added XP history tracking (last 200 entries, auto-truncated)
  - History entries include: timestamp, user, kind (grant/spend/adjust), category, amount, details, before/after states
  - Updated all character sheet UI to show single "XP" instead of "AP/MP"
  - Fixed skill XP cost calculation to match rulebook: `newRank * 2` (was `currentValue`)
  - Added History dialog in GM/Admin XP Management UI showing last 50 entries
  - All XP spending (attributes, skills, powers) now tracked in unified history
  - Backward compatible: gracefully handles missing XP fields on older actors

### Files Changed
- `src/types/actor.d.ts` - Added XP data model types
- `src/sheets/character-sheet.ts` - Unified XP usage, history tracking, 50% cap enforcement
- `templates/actor/character-sheet.hbs` - Updated UI to show single XP
- `src/module.ts` - Updated inline XP Management UI
- `src/settings/xp-management.ts` - Updated XP Management Settings app
- `templates/settings/xp-management.hbs` - Updated XP Management template

## [0.4.22] - 2025-01-XX

### Fixed
- **Artifact System: Restored Missing UI Elements**
  - Fixed missing "New Artifact" button in Item Directory header
  - Fixed missing diamond symbols (💎) on artifact folders
  - Combined duplicate `renderItemDirectory` hooks into single unified hook
  - Improved HTML element selection for Foundry v13 compatibility
  - Both features now work correctly in the same hook execution

## [0.4.21] - 2025-01-XX

### Updated
- **Documentation: Enhanced Power Structure Examples**
  - Added comprehensive AoE examples with different shapes (cone, line, burst) in `docs/item-structure-examples.json`
  - Added `note` fields to all AoE examples for consistency
  - New power examples: "Eisstoß" (cone AoE), "Blitzlinie" (line AoE), "Giftwolke" (burst AoE with duration)
  - All examples now demonstrate complete AoE radius and duration patterns

## [0.4.20] - 2025-01-XX

### Added
- **Power System Schema Update: New Embedded Power Structure**
  - Updated `EmbeddedPowerData` interface to support per-level power data (Levels 1-4)
  - New schema includes: `id`, `name`, `category`, `tags`, `cost`, `trigger`, `levels` (Record<"1"|"2"|"3"|"4", PowerLevelRow>)
  - Each `PowerLevelRow` contains: `type`, `range` (RangeSpec | null), `aoe` (AoeSpec | null), `duration` (DurationSpec), `effect` (EffectSpec with optional dice), `specials` (Array<{key, rank?, note?}>)
  - No damage type arrays - uses `effect.dice` (optional string) instead
  - Supports table columns: Level, Type, Range, AoE, Duration, Effect, Special (per level)

### Changed
- **Power Migration: Backwards Compatibility**
  - Updated `migrateArtifactPower()` to convert old power structure to new schema
  - Old powers with `powerType`, `roll.damage`, etc. are automatically migrated
  - Migration runs in `MasteryItem.prepareArtifactData()` during item data preparation
  - Ensures all 4 levels exist and uses `null` instead of `undefined` for optional fields
  - `parseAoe()` now returns `AoeSpec | null` with correct schema (`shape`, `m`, `note`)

### Added
- **Power Validation: Schema Enforcement**
  - Created `src/utils/power-validation.ts` with validation helpers:
    - `validateNoDamageTypes()` - ensures no `damageTypes` or `damage[]` fields exist
    - `validateChargedPower()` - ensures charged powers have `cost.charges >= 1`
    - `validatePower()` - validates overall power structure

### Added
- **Artifact Sheet V2: Power Editor UI**
  - Created `ArtifactSheetV2` using ApplicationV2 + HandlebarsApplicationMixin (Foundry v13)
  - New "Powers" tab with Add/Duplicate/Delete functionality
  - Expandable power editors with full level table (Levels 1-4)
  - Columns: Level, Type, Range, AoE, Duration, Effect (text + optional dice), Specials
  - GM-only editing (players can view but not edit)
  - Form handling with debounced updates for better performance
  - Registered as default sheet for artifact items

### Updated
- **Documentation: Power Structure Examples**
  - Updated `docs/item-structure-examples.json` with new power structure examples:
    - "Blitzschlag" - active power with AoE radius (5-15m) and dice damage
    - "Schutzschild" - activeBuff with duration (5 rounds) and defense bonus
    - "Feuersturm" - active power with AoE radius (10-25m) and duration (3-6 rounds)
  - All examples show complete level 1-4 progression

## [0.2.95] - 2025-01-XX

### Fixed
- **Spell Selection Dialog: Magic Powers Integration**
  - Fixed 404 error when loading spells in the "Add Spell" dialog
  - Updated `magic-powers.ts` to import and convert all spells from spell schools
  - Converted `SpellDefinition` to `PowerDefinition` format for compatibility
  - Fixed school name mapping for "School of the Bound Mind"
  - All 38 spells are now available for selection in the character sheet

## [0.2.94] - 2025-01-XX

### Added
- **Spell Schools: Complete Implementation**
  - Created TypeScript structure for all Mastery Spell Schools
  - Implemented 7 spell schools with all spells:
    - **Pyromancy** (6 spells): Firebolt, Flame Weapon, Firewall, Blazing Burst, Scorching Ray, Blazing Speed
    - **Malefic Arts** (7 spells): Eldritch Bolt, Blight Surge, Soul Drain, Agony Lash, Maddening Whisper, Void Maw, Rift Step
    - **Old Pact** (8 spells): Entangle, Healing Pulse, Lightning of the Old Sky, Call Storm, Shapechange, Barkskin, Whispering Woods, Moonbeam
    - **Thorn & Whisper** (4 spells): Beguiling Glance, Nightshade Cloud, Serpent's Kiss, Ivy Lash
    - **Breach & Break** (4 spells): Arcane Pierce, Fang of Daggers, Call of Force, Force Hammer
    - **Aegis & Benedictions** (5 spells): Aid, Bless, Beacon of Grace, Feather Fall, Wings of Faith
    - **School of the Bound Mind** (4 spells): Telekinetic Manipulation, Telepathic Link, Veil of Invisibility, Phantasmic Reflection
  - Each spell includes 4 levels with complete details (Range, AoE, Duration, Effect, Special, Raises)
  - Added spell school bonuses and requirements to spell-schools.ts
  - Structure mirrors Mastery Trees and Powers for consistency

## [0.2.93] - 2025-01-XX

### Changed
- **Simplified Skill Spend UI: Single "Turn it into a success" Button**
  - Replaced multiple skill spend buttons (Spend 2, Spend 4, All-in) with a single button
  - Button shows exact skill points needed: "Turn it into a success (X Skill Points)"
  - Automatically calculates required points rounded up to next MR step (MR 2 = 2-step increments, MR 3 = 3-step increments, etc.)
  - Button only appears when spending can turn a failure into a success
  - Cleaner, more intuitive interface

## [0.2.92] - 2025-01-XX

### Changed
- **Skill Spend Panel: Conditional Display**
  - Skill Spend Panel in chat messages only shows when All-in can still make the roll succeed
  - If remaining pool is insufficient to reach target TN, panel is hidden
  - Prevents showing spend options when success is impossible

### Removed
- **Modal Skill Spending Dialog**
  - Removed modal dialog that appeared after failed skill rolls
  - All skill point spending now happens directly in chat via buttons
  - Cleaner UX without interrupting popups

## [0.2.91] - 2025-01-XX

### Changed
- **Skill Roll Dialog: Enhanced Options**
  - Skill rolls now open a comprehensive dialog before rolling
  - Attribute selection: Dropdown when skill has multiple attributes, auto-selected for single attribute
  - Base Target Number: MR-scaled difficulties (Trivial/Easy/Standard/Challenging/Hard/Very Hard/Heroic) plus Custom option
  - Raises input: Set raises (0..n) with live Final-TN display (Final-TN = Base-TN + Raises×4)
  - Dicepool correctly uses selected attribute value (not hardcoded)

- **Skill Point Spending: Post-Roll Dialog**
  - When a skill roll fails, a "Spend Skill Points" dialog automatically opens
  - Shows available pool, MR step size, and missing points to succeed
  - Step buttons for spending in MR increments (MR, 2MR, 3MR, ...)
  - All-in button to spend remaining pool (even if < MR or not multiple of MR)
  - Validates spending rules: minimum MR, multiples of MR (except All-in)
  - Skill points are persistently tracked in `system.skillsSpent[skillKey]`

- **Followup Chat Messages**
  - After spending skill points, a followup chat message shows:
    - Skill name, attribute used, Base-TN, Raises, Final-TN
    - Rolled total, skill points spent, final total
    - Success/Failure result and raises achieved

### Fixed
- Skill rolls now correctly use the selected attribute's value for dicepool size
- Multi-attribute skills properly show attribute selection dialog

## [0.2.90] - 2025-01-XX

### Added
- **Consumable Skill Points System**
  - Skills are now consumable resources (Pool = Skill Rating)
  - Skill Points can be spent AFTER rolling (post-roll decision)
  - Spending rules: minimum MR, then in steps of MR (MR, 2MR, 3MR, ...)
  - All-in option: spend entire remaining pool (even if < MR or not multiple of MR)
  - Only 1 skill per roll
  - All Skill Points refresh after "Safe Haven Rest" button click
  - Added `skillsSpent` data model to track consumed skill points per skill
  - Migration automatically initializes `skillsSpent` for all existing characters

- **Character Sheet: Skill Pool Display**
  - Shows "Pool: X/Y" next to each skill (remaining/total)
  - Safe Haven Rest button in Skills tab to restore all skill points
  - Visual feedback for remaining skill points

- **Chat: Skill Spend UI**
  - Skill rolls show "Spend Skill Points" panel in chat
  - Buttons for spending in MR steps (MR, 2MR, 3MR, ...)
  - All-in button to spend remaining pool
  - Real-time pool display updates
  - Final result = Sum of kept dice + spent Skill Points + base modifier

### Changed
- **Skill Rolls: Removed Auto-Add**
  - Skill Rating no longer automatically added to rolls
  - Skills must be spent manually after seeing the roll result
  - Attribute selection dialog for skills with multiple attributes

- **Initiative Calculation**
  - Removed permanent initiative bonuses from Martial Skills
  - Initiative = Agility + Wits (no longer includes Combat Reflexes)
  - Martial Skills cannot permanently increase Initiative/Attack/Evade

- **Skill Attribute Mappings**
  - Empathy: now uses `['wits', 'influence']` (was `['wits', 'resolve']`)

### Technical
- Added `skill-spend-handler.ts` for chat message click handling
- Extended `RollOptions` interface with `skillKey`, `isSkillRoll`, `baseModifier`
- Updated `sendRollToChat` to include skill spend UI
- Migration hook ensures all characters have `skillsSpent` initialized

## [0.2.84] - 2025-01-XX

### Added
- **Divine Clash Overlay: Group Selection Dropdown**
  - Added dropdown menu below character overlays for group selection
  - Options: "Solo" or "Join: <Character Name>" for each other PC on the scene
  - Only interactive for token owners or GM
  - Saves selection to token flag `mastery-system.divineClashParticipation`
  - Position updates automatically on canvas pan/zoom and token refresh
  - Dropdown positioned centered below all three zones (Pool, Attack, Defense)

- **Divine Clash Overlay: Vitality Stones Zone**
  - Added Vitality zone left of Pool zone for both NPCs and Characters
  - Character Vitality Stones: Read from `system.stones.vitality` with +1 bonus (if vitality=1, displays 2)
  - NPC Vitality Stones: New "Vitality" field in Divine Combat panel of NPC sheet
  - Vitality zone only appears when stones are present
  - Orange/yellow color scheme (0xFFAA00) to distinguish from other zones
  - Layout automatically adjusts when vitality stones are present

### Changed
- **Divine Clash Overlay: Improved Character Overlay Spacing**
  - Fixed spacing calculation to account for total overlay width (Vitality + Pool + Attack + Defense)
  - Increased spacing between character overlays for better visibility
  - Character name labels positioned at left edge of overlay

## [0.2.83] - 2025-01-XX

### Added
- **NPC Sheet: Divine Combat Configuration**
  - Added "Divine Combat" panel to NPC sheets with four configurable fields:
    - **Starting Pool**: Initial number of stones in the pool
    - **Regeneration**: Stones regenerated per round
    - **Basis Attack**: Base attack value for Divine Combat
    - **Basis Defense**: Base defense value for Divine Combat
  - Available for both normal NPCs and boss phases
  - Values will be used when NPCs are targeted in Divine Combat encounters
  - Styled consistently with existing combat panels

## [0.2.82] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed drawing validation error (second attempt)**
  - Changed `fillType` from 0 (no fill) to 1 (solid fill) to satisfy Foundry validation
  - Added very transparent fill (alpha: 0.1) with matching stroke color
  - Drawings now have both visible fill and visible stroke, passing validation
  - Fill is barely visible (10% opacity) so it doesn't interfere with gameplay

## [0.2.81] - 2025-01-XX

### Added
- **Divine Clash: Automatic drawing rectangles around stone areas**
  - **New feature**: System now automatically creates drawing rectangles around Power Stones and Vitality Stone
  - Green rectangle around Power Stones (all stones in a row)
  - Red rectangle around Vitality Stone
  - Rectangles are placed below tokens (z: 100) and are fully visible
  - Rectangles can be manually moved/resized/deleted if needed
  - Helps players identify stone placement areas visually

### Fixed
- **Divine Clash: Fixed drawing validation error**
  - Fixed "Drawings must have visible text, a visible fill, or a visible line" error
  - Increased stroke width from 2 to 4 pixels
  - Set stroke alpha to 1.0 (fully visible) instead of 0.6
  - Set text alpha to 0 (no text) to avoid validation issues

## [0.2.80] - 2025-01-XX

### Changed
- **Divine Clash: Simplified token placement workflow**
  - **Major change**: Removed automatic scene switching - user must manually switch to Divine Clash scene
  - **Major change**: Removed automatic player token creation - user must place character tokens manually
  - System now only generates stone tokens for selected character tokens on the current scene
  - Stone tokens are placed relative to existing player token positions:
    - Vitality Stone: 1.5 grid units to the right of player token
    - Power Stones: In a row 2 grid units in front of player token, spaced 1.2 grid units apart
  - All other tokens on the scene remain unchanged
  - Simplified code by removing ~200 lines of scene switching logic
  - Improved flexibility: GM has full control over token placement

## [0.2.78] - 2025-01-XX

### Fixed
- **Divine Clash: Set token texture.src explicitly when creating tokens**
  - **Critical fix**: Token `texture.src` is now explicitly set to the actor's image when creating tokens
  - This ensures tokens display the correct image from their parent actor, not placeholder images
  - Images are taken from `actor.img` or `actor.prototypeToken.texture.src`
  - Added debug logging to show which image is used for each token

## [0.2.77] - 2025-01-XX

### Fixed
- **Divine Clash: Fix placeholder images on stone tokens**
  - **Critical fix**: Stone actor images are now taken from settings when copying, not from the base actor
  - This prevents placeholder images from being copied from base actors to stone tokens
  - Images are now properly set from `divineClashPowerStoneImg` and `divineClashVitalityStoneImg` settings
  - Added debug logging to show image selection process

## [0.2.76] - 2025-01-XX

### Fixed
- **Divine Clash: Preserve token selection across scene switch**
  - **Critical fix**: Token selection is now saved BEFORE scene switch (selection is lost when scene changes in Foundry VTT)
  - Added extensive debug logging to track token/actor selection throughout the process
  - Now uses saved actors from before scene switch, combined with any newly selected tokens after switch
  - Prevents "Please select at least one character token" error when tokens were selected before clicking Divine Clash Start

## [0.2.75] - 2025-01-XX

### Added
- **Divine Clash: Token placement on scene**
  - **New feature**: Tokens are now automatically placed on the Divine Clash scene
    - Player token placed in center position
    - Vitality Stone token placed to the right of player (1.5 grid units)
    - Power Stone tokens placed in a row in front of player (2 grid units up, spaced 1.2 grid units apart)
  - Multiple players are spread horizontally across the scene (3 grid units spacing)
  - All tokens are linked to their actors (`actorLink: true`)
  - Tokens have proper flags for Divine Clash tracking

## [0.2.74] - 2025-01-XX

### Fixed
- **Divine Clash: Improved scene switching with multiple fallback methods**
  - **Scene switching**: Reordered methods and added direct DOM click as last resort
    - Method 1: `ui.nav.activateScene()` (now first, most reliable)
    - Method 2: `ui.nav.scene.view()` (alternative navigation method)
    - Method 3: `game.scenes.view()` (fallback)
    - Method 4: `scene.activate()` (fallback)
    - Method 5: Direct DOM click on scene navigation element (last resort)
  - All methods now use `await` to ensure they complete before checking
  - Added logging for each method attempt

## [0.2.73] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed actor folder assignment and improved scene switching**
  - **Actor folder fix**: Fixed critical bug where actors were created with Folder objects instead of folder IDs
    - Now properly handles both string IDs and Folder objects when checking actor folders
    - Fixed folder comparison to extract ID from Folder objects: `typeof folder === 'string' ? folder : folder?.id`
    - This fixes the issue where actors were never found because folder comparison failed
  - **Scene switching**: Added `ui.nav.activateScene()` as Method 3 (most reliable)
    - Scene switching now tries: `game.scenes.view()` → `ui.webrtc.viewScene()` → `ui.nav.activateScene()` → `scene.activate()`

## [0.2.72] - 2025-01-XX

### Fixed
- **Divine Clash: Try all scene switching methods and enhanced error reporting**
  - **Scene switching**: Now tries all available methods in sequence:
    - Method 1: `game.scenes.view()` (if available)
    - Method 2: `ui.webrtc.viewScene()` (if available)
    - Method 3: `scene.activate()` (fallback)
  - Enhanced error logging shows which methods are available and which failed
  - Better error messages showing expected vs actual scene IDs

## [0.2.71] - 2025-01-XX

### Fixed
- **Divine Clash: Improved scene switching and actor detection debugging**
  - **Scene switching**: Now uses `game.scenes.view()` as primary method (most reliable)
    - Increased polling time from 2 seconds to 3 seconds
    - Better error logging if scene doesn't switch
  - **Actor detection**: Enhanced debugging to identify why actors aren't found
    - Added folder contents check via `folder.contents` property
    - Added type checking for folder IDs (string vs number mismatch detection)
    - Added verification that created actors have the correct folder assigned
    - Added warning if no actors are found in the expected folder

## [0.2.70] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed scene switching and actor detection**
  - **Scene switching**: Changed from simple `activate()` to polling method that waits for scene to actually switch
    - Uses `ui.webrtc.viewScene()` if available (more reliable)
    - Polls every 100ms for up to 2 seconds to verify scene switch
    - Falls back to `game.scenes.view()` if initial method fails
  - **Actor detection**: Added folder verification and actor collection verification after creation
    - Verifies created actors are immediately available in the collection
    - Added detailed logging for folder lookup to debug why actors aren't found
    - Logs all actors in the target folder before searching

## [0.2.69] - 2025-01-XX

### Fixed
- **Divine Clash: Enhanced debugging for duplicate detection and scene switching**
  - Added detailed logging for all actors in the target folder to debug why existing actors aren't found
  - Added more detailed scene switching logs with before/after comparison
  - Increased scene activation wait time from 500ms to 1000ms
  - Added warning if scene doesn't switch after activation
- **Version display**: Made version number more prominent in console logs with a boxed display

## [0.2.68] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed Collection access**: Fixed bug where `game.actors`, `game.folders`, and `game.scenes` were accessed as arrays instead of Collections
  - Changed all Collection accesses to use `Array.from(collection.values())` to properly convert Foundry VTT Collections to arrays
  - This fixes the issue where duplicate stone actors were created because existing actors couldn't be found
  - Scene switching should now work correctly

## [0.2.67] - 2025-01-XX

### Fixed
- **Divine Clash: Enhanced debug logging**: Added extensive debug logs for scene switching and duplicate prevention
  - Added detailed scene search logging (by ID and name)
  - Added scene activation verification with wait time
  - Added comparison logging for duplicate actor detection
  - Improved error handling for scene switching

## [0.2.66] - 2025-01-XX

### Fixed
- **Divine Clash: Prevent duplicate stone actors**: Fixed issue where stone actors were added multiple times when starting Divine Clash repeatedly
  - Now checks if enough actors already exist before creating new ones
  - If enough actors exist, reuses them instead of creating duplicates
  - Added scene switching when starting Divine Clash (switches to configured Divine Clash scene)

## [0.2.65] - 2025-01-XX

### Fixed
- **Divine Clash: Added extensive debug logging**: Added detailed debug logs to track folder creation and actor copying
  - Added debug logs to `processPlayerActor` to track actor processing
  - Added debug logs to `ensureStonesFolderForActor` to track folder creation
  - Added debug logs to `copyStoneActor` to track actor copying
  - Fixed TypeScript compilation errors for deprecated functions

## [0.2.64] - 2025-01-XX

### Fixed
- **Divine Clash: Removed all token rendering**: Completely removed token creation logic
  - Added debug logs to confirm new version is running
  - Ensured only actor structure is created, no tokens
  - Fixed folder creation to work correctly

## [0.2.63] - 2025-01-XX

### Changed
- **Divine Clash: Complete Redesign - Actor Structure Only**: Completely rewrote Divine Clash start function
  - No longer renders tokens or creates scene elements
  - Only creates actor structure in the Actors sidebar
  - Identifies player actors from selected tokens
  - Checks `system.stones` for each player actor
  - Creates folder structure: Actor → "Stones for Actor Name" (one level deeper than actor)
  - Copies configured base Power and Vitality Stone actors into the folder
  - Number of copies matches the stone count from `system.stones`
  - Reuses existing stone actors if already present
  - Clean, simple implementation focused on actor organization

## [0.2.62] - 2025-01-XX

### Fixed
- **Divine Clash: Stone Reuse**: Prevent duplicate stone actors and tokens when starting Divine Clash multiple times
  - Stone actors are now reused if they already exist in the player's folder
  - Stone tokens are now reused if they already exist on the scene for the same actors
  - Only missing actors/tokens are created, preventing duplicates
  - Orphaned tokens (without matching actors) are automatically cleaned up
  - Added detailed logging for reuse vs creation of stones

## [0.2.61] - 2025-01-XX

### Fixed
- **Divine Clash: Folder Creation**: Fixed folder not being created when character has 0 stones
  - Folder is now always created for each player, even if no stones need to be spawned
  - Added extensive debug logging for folder creation process
  - Folder creation happens before stone spawning, ensuring folder exists

## [0.2.60] - 2025-01-XX

### Changed
- **Divine Clash: Stone Token Creation**: Complete redesign of stone token system
  - Each player now gets a dedicated folder: "Divine Clash - [Player Name]"
  - Individual stone actors are created (one per stone needed) as proper NPC actors
  - Tokens are now created with `actorLink: true` (linked to individual stone actors)
  - Each stone actor can have its own image configured
  - No more placeholder images - stones use their actor images directly
  - Cleanup function now removes folders and all stone actors on reset

### Fixed
- **Divine Clash: Placeholder Images**: Fixed by using proper linked actors
  - Tokens are now properly linked to their stone actors
  - Images come directly from the actor, not from token data
  - Each stone is a real NPC actor that can be edited and configured

## [0.2.59] - 2025-01-XX

### Changed
- **Divine Clash: Stone Calculation**: Changed to use `system.stones` instead of `system.stonePools`
  - Power Stones now calculated as `stones.current - stones.vitality` (or `stones.total - stones.vitality`)
  - Vitality Stones now use `stones.vitality` directly
  - Falls back to old `stonePools` system for backwards compatibility
  - Better alignment with the actual stone system used in character sheets

## [0.2.58] - 2025-01-XX

### Fixed
- **Divine Clash: Scene Switching**: Fixed scene not switching when starting Divine Clash
  - Scene now switches even when only enemy token is selected (shows warning but still switches)
  - Scene is retrieved before token validation, ensuring scene switch happens
  - Improved error handling and guard logic

## [0.2.57] - 2025-01-XX

### Fixed
- **Divine Clash: Placeholder Images**: Fixed placeholder images still being displayed on stone tokens
  - Added explicit image update after token creation to ensure correct image is used
  - Token image is now verified and corrected if Foundry uses actor image instead
  - Logs show image source and any corrections made
- **Divine Clash: Multiple Simultaneous Calls**: Prevented duplicate Divine Clash start calls
  - Added guard variable to prevent multiple simultaneous executions
  - Prevents token duplication and performance issues

### Changed
- **Divine Clash: Image Handling**: Improved token image handling
  - Token image is now explicitly updated after creation if it doesn't match expected image
  - Better logging for image selection and correction process

## [0.2.56] - 2025-01-XX

### Fixed
- **Divine Clash: Power Stone Count**: Fixed incorrect stone count calculation
  - Changed from using `available` (max - sustained) to `current` value
  - Now correctly spawns only the actual stones the character has, not theoretical capacity
- **Divine Clash: Duplicate Stones**: Fixed duplicate stone tokens being spawned
  - Added cleanup function to remove existing stones for a seat before spawning new ones
  - Prevents accumulation of stones when Divine Clash is started multiple times
- **Divine Clash: Stone Image Priority**: Fixed placeholder images being used instead of settings image
  - Settings image now always takes precedence if configured
  - Added extensive debug logging for image selection process
  - Logs all image sources (settings, actor, default) and decision process
  - Helps diagnose image selection issues

### Changed
- **Divine Clash: Image Selection Logic**: Improved image resolution priority
  - Settings image is now checked first and used if set (even if it's the default path)
  - Actor images are only used if settings image is not configured
  - Added `isValidImage()` helper function to detect placeholder images

## [0.2.42] - 2025-01-XX

### Fixed
- **Active Buff Restrictions**: Only one true active buff can be active at a time
  - Added `isTrueActiveBuff` function to distinguish between true active buffs and utilities
  - Added `getTrueActiveBuffs` function to get only non-utility active buffs
  - `activateActiveBuff` now prevents activating a second true active buff if one is already active
  - Utilities can still stack (multiple utilities can be active simultaneously)
  - True active buffs (non-utilities) are limited to one at a time

### Changed
- **Combat Carousel Active Buff Display**: Improved active buff icon display
  - Active buffs (including utilities) now always show in carousel, even if effect has no icon
  - Icon is now retrieved from original power if effect icon is missing
  - Default icon (`icons/svg/aura.svg`) is used as fallback if no icon is found
  - Better tooltip information for active buffs in carousel

## [0.2.41] - 2025-01-XX

### Changed
- **Combat Carousel Positioning**: Adjusted carousel position and height
  - Changed `top` from `10px` to `-9px` to better align with UI elements
  - Increased `height` from `20vh` to `30vh` for better visibility
  - Updated both `.mastery-carousel` and `#mastery-combat-carousel` for consistency

## [0.2.40] - 2025-01-XX

### Fixed
- **Utilities as Active Buffs**: Fixed utilities not being recognized as active buffs
  - Extended `isActiveBuff` function to recognize utilities with Self-targeting (Range: Self or 0)
  - Utilities with buff-like tags or characteristics are now recognized as active buffs
  - Updated `getSegmentIdForOption` to correctly identify utilities as active buffs in radial menu
  - Utilities now appear correctly in Character Sheet and Combat Carousel when activated
  - Self-targeting utilities are now automatically activated on self without targeting

## [0.2.39] - 2025-01-XX

### Changed
- **Chat Messages Styling**: Enhanced chat message appearance with df-rulebook-ui theme
  - All chat messages now use consistent dark fantasy theme colors
  - Improved visual hierarchy with better borders, shadows, and spacing
  - Message headers styled with Cinzel Decorative font and uppercase text
  - Attack cards, roll cards, damage cards, and info cards all styled consistently
  - Better hover effects and transitions for interactive elements
  - Consistent color scheme using df-* CSS variables
  - Improved readability with proper contrast and spacing

## [0.2.38] - 2025-01-XX

### Fixed
- **Active Buffs Import Error**: Fixed dynamic import path for active buffs module
  - Changed import path from `../utils/active-buffs.js` to `./utils/active-buffs.js`
  - Active buffs can now be activated correctly from the radial menu
  - Active buffs now appear correctly in Character Sheet and Combat Carousel

## [0.2.37] - 2025-01-XX

### Fixed
- **Dialog Close Buttons**: Fixed close button styling in all dialogs
  - Improved header close button appearance with proper padding and hover effects
  - Close button now has subtle background on hover
  - Close button turns red on hover for better visual feedback
  - Removed duplicate close button from Passive Selection Dialog footer

### Changed
- **Passive Selection Dialog**: Removed close button from footer
  - Dialog now only uses the standard header close button
  - Cleaner footer layout with only navigation buttons

## [0.2.36] - 2025-01-XX

### Changed
- **Combat Carousel**: Moved carousel 10px lower to show initiative counter and other UI elements
  - Carousel now positioned at `top: 10px` instead of `top: 0`
  - Initiative counter and other top UI elements are now visible when carousel is open
- **Status Icons in Carousel**: Enhanced status icon display
  - Increased icon size from 16x16px to 20x20px for better visibility
  - Improved hover effects with purple glow for Active Buffs
  - Active Buff icons now have purple border and badge indicator
  - Better tooltip display on hover

### Added
- **Status Effects Bar in Character Sheet**: Added status effects display above Character Attributes
  - New status effects bar appears at the top of the Attributes tab
  - Shows all active effects (including Active Buffs) as icons
  - Hover over icons to see effect name, duration, and description
  - Active Buffs have purple badge indicator
  - Icons are 32x32px with hover effects for better visibility

### Fixed
- **Active Buffs Display**: Improved Active Buff detection and display
  - Added comprehensive debug logging for troubleshooting
  - Fixed status effects array initialization
  - Improved icon and description extraction from ActiveEffects

## [0.2.35] - 2025-01-XX

### Fixed
- **Active Buffs Display**: Fixed Active Buffs not showing in Character Sheet and Combat Carousel
  - Fixed ActiveEffect creation to properly set icon from power image
  - Fixed description storage (now stored directly in `description` field, not `system.description.value`)
  - Fixed duration calculation for Active Buffs outside of combat
  - Improved rounds remaining calculation (using Math.max to prevent negative values)
  - Added debug logging to help diagnose Active Buff issues
  - Character Sheet and Combat Carousel now refresh after activating an Active Buff

### Changed
- **Active Buff Activation**: Improved Active Buff activation flow
  - Character Sheet and Combat Carousel are now automatically refreshed after activation
  - Better error handling and user feedback

## [0.2.34] - 2025-01-XX

### Fixed
- **Active Buffs**: Fixed Active Buffs being treated as attacks
  - Active Buffs are now checked and activated BEFORE action consumption
  - Active Buffs no longer trigger targeting mode or damage calculations
  - Active Buffs are directly activated on self when selected from radial menu
- **Active Buff Display**: Enhanced Active Buff visualization
  - Added hover tooltips in Combat Carousel showing buff name and remaining duration
  - Improved hover tooltips in Character Sheet with full description
  - Active Buff icons in Carousel have special styling (purple border, glow effect)
  - Active Buff items in Character Sheet show detailed tooltip on hover
- **Chat CSS**: Fixed chat message styling
  - Added general chat styling that applies to all chat messages (not just theme-specific)
  - Chat messages now have proper background, borders, and spacing regardless of theme
  - Message headers and content are properly styled

### Changed
- **Combat Carousel**: Status icons now support both string icons and object icons with tooltips
  - Active Buffs are displayed as special status icons with tooltips
  - Regular effects are displayed as standard status icons
- **Handlebars Helpers**: Added `isObject` helper for template conditionals

## [0.2.33] - 2025-01-XX

### Changed
- **Power Details Display**: Improved power card expandable details
  - Power details are now always collapsed by default
  - Clicking toggle button shows full description with all level details
  - Compact description is hidden when details are expanded
  - Compact description now shows max 2 lines with ellipsis

## [0.2.32] - 2025-01-XX

### Fixed
- **Template Rendering**: Fixed "length" helper registration and template usage
  - Removed dependency on length helper in template by using #each with @first instead
  - Added verification and fallback registration of length helper in init hook
  - Improved length helper to handle null/undefined values safely
  - Template now uses #each loop to check if array has elements instead of length helper

## [0.2.31] - 2025-01-XX

### Fixed
- **Template Rendering**: Fixed "length" helper errors and mergeObject issues
  - Simplified template conditionals to use "and" helper with proper array checks
  - Added error handling in getData to ensure context is always a valid object
  - Ensured specials is always an array to prevent template errors
  - Added try-catch blocks around async imports in getData

## [0.2.30] - 2025-01-XX

### Fixed
- **Handlebars Helpers**: Fixed "length" helper registration and added "and" helper
  - Ensured length helper is properly registered in both immediate and additional registration
  - Added "and" logical helper for template conditionals
  - Fixed template conditionals that were causing mergeObject errors

## [0.2.29] - 2025-01-XX

### Fixed
- **Handlebars Helper**: Added missing "length" helper for template rendering
  - Fixes error "Missing helper: length" when rendering character sheet

## [0.2.28] - 2025-01-XX

### Fixed
- **Active Buffs in Radial Menu**: Active Buffs are now properly activated directly on self without targeting mode
  - Active Buffs no longer trigger melee targeting when selected from radial menu
  - Active Buffs are automatically set to Range 0 (Self) when created as combat options
  - Fixed issue where Active Buffs were treated as attacks requiring target selection

### Changed
- **Power Display in Character Sheet**: Enhanced power cards with better information display
  - Utility powers now correctly display as "Utility" instead of "Active"
  - Added Effect information display in power cards
  - Added expandable details section with full level information (Type, Range, AoE, Duration, Effect, Special)
  - Power level data is now loaded from power definitions and displayed in expandable section
  - Improved power card layout with toggle button for detailed information
  - Power details now show the same information as when purchasing powers

### Improved
- **Powers Overview Styling**: Updated powers overview section to use new CSS variable-based theme system
  - Removed inline styles from template
  - Consistent styling with rest of character sheet

## [0.2.27] - 2025-01-XX

### Added
- **Active Buffs System**: Implemented proper Active Buff tracking and display
  - Active Buffs are now properly recognized as buffs (not attacks) and create ActiveEffects with duration = Mastery Rank rounds
  - Added utility functions in `src/utils/active-buffs.ts` for detecting and activating active buffs
  - Active Buffs are displayed with symbols/icons in the combat carousel (via status icons)
  - Added Active Buffs section in character sheet showing active buffs with icons and remaining rounds
  - Active Buffs can be manually removed from the character sheet
  - When using a power that is an active buff, it creates an ActiveEffect instead of treating it as an attack

### Changed
- Updated `#onPowerUse` handler to detect active buffs and create ActiveEffects
- Active Buffs now use Foundry's ActiveEffect system for proper tracking and display

## [0.2.1] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Migrated CombatCarouselApp to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
  - Replaced Application v1 patterns with proper ApplicationV2 implementation
  - Uses DEFAULT_OPTIONS and PARTS instead of defaultOptions/template
  - Implements _prepareContext instead of getData
  - Uses _onRender with native DOM API instead of jQuery-based activateListeners
  - Removed _renderHTML and _replaceHTML overrides (handled by HandlebarsApplicationMixin)
  - Fixed window options: popOut: false → window.frame: false and window.positioned: false
  - Updated render() calls in module.ts to use object syntax ({ force: true/false })
  - Body class management moved to _onRender and _onClose
  - Carousel now properly renders and attaches event listeners in v13

## [0.2.0] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Migrated PassiveSelectionDialog and InitiativeShopDialog to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
  - Replaced Application v1 patterns with proper ApplicationV2 implementation
  - Uses DEFAULT_OPTIONS and PARTS instead of defaultOptions/template
  - Implements _prepareContext instead of getData
  - Uses _onRender with native DOM API instead of jQuery-based activateListeners
  - Singleton check now uses foundry.applications.instances instead of ui.windows
  - Re-render uses this.render({ force: true }) instead of manual DOM manipulation
  - Fixed all "activateListeners is not a function" and "html.find is not a function" errors
  - Dialogs now open correctly without "App element not found" errors

## [0.1.61] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed app element not found error in dialogs
  - Added wait loop in `_replaceHTML()` to wait for app element to be available in DOM
  - Prevents errors when dialog window hasn't been created yet when `_replaceHTML` is called
  - Applied fix to both Passive Selection Dialog and Initiative Shop Dialog

## [0.1.60] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed jQuery object handling in Passive Selection Dialog and Initiative Shop Dialog
  - Added jQuery object validation in `activateListeners()` methods
  - Replaced all `html.find()` calls with `$html.find()` to ensure jQuery object usage
  - Fixed "html.find is not a function" errors by ensuring html parameter is converted to jQuery object
  - Improved fallback handling when app element is not found

## [0.1.59] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed Passive Selection Dialog activateListeners error
  - Added try-catch protection in dist file (temporary fix until TypeScript compilation issue is resolved)
  - Dialog should now render correctly without crashing

## [0.1.58] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed Passive Selection Dialog and Initiative Shop Dialog not appearing
  - Added try-catch protection for `super.activateListeners()` calls in ApplicationV2 classes
  - Prevents errors when ApplicationV2 or Application base class doesn't have activateListeners method
  - Applied fix to PassiveSelectionDialog, InitiativeShopDialog, CombatActionOverlay, and CombatCarouselApp

## [0.1.57] - 2025-01-XX

### Fixed
- **Character Creation**: Fixed Finish button not appearing after selecting all attributes, skills, and 4 powers
  - Removed `disadvantagesReviewed` requirement from `canFinalize` check since disadvantages are optional
  - Finish button now appears when all required points are spent and 4 powers are selected

## [0.1.55] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Renamed item type `special` to `power` throughout the entire system
  - All item type checks (`item.type === 'special'`) updated to `item.type === 'power'`
  - `SpecialData` interface renamed to `PowerData`
  - `prepareSpecialData()` method renamed to `preparePowerData()`
  - Template `special-sheet.hbs` renamed to `power-sheet.hbs`
  - Updated all references in code, templates, and configuration files
- Added new item type `gear` for everyday items
  - Added `GearData` interface with `weight`, `quantity`, `equipped`, and `description` fields
  - Added gear template to `template.json`
  - Added gear to `system.json` document types
- Migrated all Application classes to ApplicationV2 to resolve Foundry VTT v13 deprecation warnings
  - `CombatCarouselApp`, `PassiveSelectionDialog`, `InitiativeShopDialog`, `CombatActionOverlay` now use `ApplicationV2`
  - Removed `override` modifiers (not supported by ApplicationV2)
  - Fixed `TokenDocument.effects` deprecated warning (now uses `Actor.effects`)

### Fixed
- Fixed Combat Carousel display issues with CSS positioning
- Fixed Passive Selection Dialog close button functionality

## [0.1.54] - 2025-01-XX

### Fixed
- **Dice Parsing**: Fixed dice notation parsing to support full Foundry Roll formulas
  - Now correctly handles formulas like "1d8 + 1d8", "2d8 + 3d8 + 2", "Weapon DMG + 1d8 + 2"
  - Removed silent truncation of complex dice expressions
  - Uses Foundry Roll.evaluate() for proper formula evaluation instead of custom regex parser
- **Damage Application**: Fixed damage application to properly handle tempHP and health bar overflow
  - TempHP is now reduced first before applying damage to health bars
  - Damage properly flows between health bars when a bar reaches 0
  - Uses existing applyDamage helper from calculations.ts for consistent overflow handling
- **Movement UX**: Fixed movement selection UX improvements
  - Radial menu now closes immediately when Move/Dash/Disengage is selected
  - Hex highlighting alignment fixed using Foundry grid APIs (getOffset/getTopLeftPoint)
  - Removed hard-coded calibration offsets, now uses reliable grid API methods
  - Path hexes correctly highlight in green (within range) or red (beyond range)
- **Dice Visibility**: Fixed dice visibility for mastery rolls
  - Dice now always appear in chat for masteryRoll
  - Dice So Nice integration added (3D dice show when module is installed)
  - Proper roll serialization using roll.toJSON() for Foundry v13 compatibility
  - Added robust error handling with user-friendly notifications

## [0.1.11] - 2025-01-XX

### Fixed
- **XP Management inline in Settings**: Fixed `html.find is not a function` error in renderSettingsConfig hook
  - Added robust handling for different html parameter types in Foundry VTT v13
  - Improved jQuery object detection and conversion
  - Added error handling and debug logging

## [0.1.10] - 2025-01-XX

### Fixed
- **XP Management Settings defaultOptions**: Fixed mergeObject error by ensuring baseOptions is always an object
  - Changed `super.defaultOptions` to `super.defaultOptions || {}` to handle undefined cases
- **Version Display**: Updated version display from "0.0.78 (Alpha)" to "0.1.9" in console output

## [0.1.9] - 2025-01-XX

### Fixed
- **Handlebars Helper Registration**: Fixed "Missing helper: default" error by registering helpers immediately before init hook
- **XP Management Settings**: Added debug logging to troubleshoot settings menu registration
  - Settings menu should appear as a button in the Mastery System settings tab
  - Debug logs added to verify registration process

## [0.1.8] - 2025-01-XX

### Fixed
- **Armor Calculation**: Updated armor calculation to include Mastery Rank as base armor
  - Total Armor = Mastery Rank (base) + Armor Value (equipped armor) + Shield Value (equipped shield)
  - Formula display updated to show "MR + Armor + Shield"
  - Examples: No armor = MR (e.g., 2), Light Armor = MR + 4 (e.g., 6), With Shield = MR + Armor + Shield

## [0.1.7] - 2025-01-XX

### Added
- **Character XP Management Settings**: New GM-only settings page for managing character XP
  - View all player characters and their XP spending (Attribute XP and Mastery XP)
  - See spent, available, and total XP for each character
  - Grant XP allowances to individual characters or all characters at once
  - Automatic calculation of spent XP based on attribute values and skill levels
  - Accessible via System Settings → Character XP Management

### Changed
- **Equipment Dialog Styling**: Enhanced CSS for Weapon, Armor, and Shield creation dialogs
  - Consistent dark theme with gradient backgrounds
  - Improved form styling and hover effects
  - Better visual hierarchy and readability

### Fixed
- **Schticks Validation**: Removed validation warning message (Schticks are now optional)
- **Starting Faith Fractures Display**: Removed redundant "Starting Faith Fractures" display (same as Disadvantage Points)

## [0.1.6] - 2025-01-XX

### Fixed
- **Dialog Constructor Errors**: Fixed TypeError for Weapon, Armor, and Shield creation dialogs
  - Changed from `foundry.applications.Dialog` to global `Dialog` constructor
  - Added TypeScript type casting to resolve compilation errors
  - All equipment dialogs now properly open and function correctly

## [0.1.5] - 2025-01-XX

### Added
- **Power Information Display**: Enhanced power cards with comprehensive information
  - Damage, Special, Category (Melee/Melee AoE/Range/Range AoE), and Type (Active/Active Buff/Passive) displayed in compact single-line format
  - Icons for better visual identification
  - Compact layout to save space
- **Mastery Tree Bonuses**: Added all tree bonuses to Mastery Trees
  - All 27 Mastery Trees now have their tree bonuses defined
  - Bonuses are automatically displayed in the "Selected Trees" section when a character has powers from those trees
  - Includes passive abilities for Werewolf and Werebear shapechange forms

### Fixed
- **Scroll Position Preservation**: Fixed issue where character sheet would scroll to top after any update
  - Scroll position is now preserved for all tabs (Attributes, Skills, Powers, Equipment) when form is saved
  - Works for all input changes, button clicks, and automatic form submissions
  - Uses requestAnimationFrame for reliable DOM updates

## [0.1.4] - 2025-01-XX

### Changed
- **Schticks System**: Changed from dropdown selection to free text input
  - Players can now enter custom Schtick names instead of selecting from predefined list
  - Text input field for each rank's Schtick name
- **Button Styling**: Improved layout for Powers and Equipment buttons
  - Powers & Magic header: fixed width 225px
  - Powers controls: full width with height 6px
  - Button heights: 28px and 30px for better visual consistency
  - Same styling applied to Equipment buttons (Add Weapon, Add Armor, Add Shield)

### Added
- **Weapon Creation Dialog**: Added comprehensive CSS styling
  - Dark theme matching Power Creation Dialog
  - Styled select dropdowns, detail cards, and checkboxes
  - Hover effects and smooth transitions
  - Better visual hierarchy and readability

## [0.1.3] - 2025-01-XX

### Fixed
- Committed all pending changes for Schticks table system, Powers buttons layout, and Equipment Armor/Shield functionality

## [0.1.2] - 2025-01-XX

### Changed
- Updated Schticks system to use per-rank table format
  - Schticks now displayed as table with Rank, Schtick, and Manifestation columns
  - One row per Mastery Rank (1 to current rank)
  - Rank column includes tooltips with rank-specific descriptions and examples
  - Manifestation field for custom descriptions per rank

## [0.1.1] - 2025-01-XX

### Added
- **Armor System**: Added Light, Medium, and Heavy armor types with armor values and skill penalties
  - Light Armor: +4 Armor, no penalties
  - Medium Armor: +8 Armor, Stealth Pool −2, Evade −2
  - Heavy Armor: +12 Armor, Athletics −4, Acrobatics −4, Stealth Pool −4, Evade −4
- **Shield System**: Added three shield types with shield values and evade bonuses/penalties
  - Parry Shield: +1 Shield, +4 Evade, no penalties
  - Medium Shield: +2 Shield, Evade −4
  - Tower Shield: +4 Shield, Evade −8
- Armor and Shield creation dialogs
- Shield section in Equipment tab

### Changed
- **Weapon Reach System**: Changed from absolute reach values to bonus-based system
  - Default melee reach is now 2m
  - Weapons with "Reach (2 m)" changed to "Reach (+1 m)" (total: 3m)
  - Weapons with "Reach (3 m)" changed to "Reach (+2 m)" (total: 4m)
  - Updated melee targeting and radial menu to support new format
- **Equipment Tab**: Improved styling and layout
  - Red buttons for Add Weapon/Armor/Shield, displayed side-by-side
  - Card-based layout for equipment items
  - Better visual hierarchy and hover effects
  - Responsive grid layout for equipment details

### Fixed
- Equipment tab now properly displays armor skill penalties
- Shield values and evade bonuses correctly shown in equipment list

## [0.1.0] - 2025-01-XX

### Added
- **Schticks System**: Added Schticks selection during character creation
  - Inline Schticks UI under Attributes section
  - 10 predefined Schticks with short descriptions and optional attribute affinity
  - Validation requiring exactly 2 Schticks to be selected
  - Schticks counter and validation messages
  - Schticks display after character creation is complete
- **Tree Bonuses Display**: Enhanced "Selected Trees" section to show all tree bonuses, focus, and roles
  - Tree cards with detailed information
  - Bonus highlighting with visual styling
  - Support for both Mastery Trees and Spell Schools
- **Handlebars Helper**: Added `ne` (not equal) helper for template comparisons

### Changed
- **Powers Tab**: Unified Powers & Magic into single tab
  - Removed separate Magic tab
  - "Add Mastery Power" and "Add Spell" buttons always visible
  - Creation and normal modes properly separated
- **Power Creation Dialog**: Improved styling and dynamic sizing
  - CSS classes for better styling
  - Dynamic height/width based on content
  - Better visual feedback and hover effects

### Fixed
- Character creation power/spell buttons now properly enabled during creation
- Template structure corrected for creation vs normal mode display

## [0.0.99] - 2025-01-XX

### Fixed
- **Creation Power/Spell Buttons**: Fixed "Add Mastery Power" and "Add Spell" buttons being disabled during character creation
  - Added buttons to whitelist in `#lockSheetForCreation` method
  - Explicitly enable buttons after disabling other buttons
  - Added debug logging to track button state
  - Buttons should now be clickable during character creation

## [0.0.98] - 2025-01-XX

### Fixed
- **Character Creation UI**: Fixed Creation-UI not showing in Powers tab during character creation
  - Fixed `creationComplete` logic to only be true when explicitly set to true
  - Previously undefined values were treated as complete, preventing creation UI from showing
  - Creation-UI now correctly displays with status counters and creation buttons
  - Powers are now correctly filtered during creation (shows all powers when no trees selected yet)

## [0.0.97] - 2025-01-XX

### Added
- **Character Creation: Powers & Magic System**: Complete implementation of character generation limits for Powers and Spell Schools
  - Enforces selection of exactly 2 Mastery Trees or Spell Schools (total)
  - Enforces selection of exactly 4 Powers from chosen trees
  - Enforces assignment of Rank 2 to exactly 2 Powers (others remain Rank 1)
  - Validates that no power rank exceeds Mastery Rank
  - Creation UI in Powers tab with status counters and instructions
  - Rank assignment dropdown for each selected power during creation
  - Validation prevents finalization until all power requirements are met
  - Power dialog automatically enforces limits during character creation
  - Sheet locking prevents normal power/spell addition during creation

### Updated
- **Power Creation Dialog**: Now enforces character creation limits automatically
  - Prevents selecting more than 2 trees
  - Prevents selecting more than 4 powers
  - Sets powers to Rank 1 by default during creation
  - Validates against Mastery Rank limits
- **Character Sheet**: Powers tab shows special creation UI during character creation
  - Status display showing trees selected, powers selected, and rank 2 assignments
  - Clear instructions for character creation rules
  - Separate creation buttons for Mastery Powers and Spells
  - Rank selection dropdown for each power
- **Finalize Creation**: Now validates all power requirements before allowing finalization
  - Checks for exactly 2 trees selected
  - Checks for exactly 4 powers selected
  - Checks for exactly 2 powers at Rank 2
  - Validates power ranks don't exceed Mastery Rank
- **Handlebars Helpers**: Added `contains` helper for array membership checks

## [0.0.96] - 2025-01-XX

### Fixed
- **Disadvantages Button**: Fixed "Add Disadvantage" button being disabled during character creation
  - Updated `#lockSheetForCreation` to allow disadvantage buttons
  - Added extensive debug logging to track button state and event handling
  - Button now properly enabled and clickable during character creation

### Added
- **Debug Logging**: Comprehensive logging for disadvantage system
  - Logs when button listeners are set up
  - Logs button state (enabled/disabled)
  - Logs when button is clicked
  - Logs DISADVANTAGES array loading
  - Logs dialog creation and rendering
  - Helps diagnose issues with disadvantage selection

## [0.0.95] - 2025-01-XX

### Fixed
- **Character Sheet Scrolling**: Fixed scroll position reset when spending skill or attribute points
  - Scroll position is now preserved when adding points to skills or attributes
  - Prevents annoying jump to top of page during character advancement
- **Disadvantages System**: Fixed disadvantage selection dialog not showing options
  - Added debugging to identify loading issues
  - Improved error messages when disadvantages fail to load
  - Updated all disadvantage descriptions to match official rules exactly

### Changed
- **Character Creation**: Finalize button now requires Disadvantages phase completion
  - Added `disadvantagesReviewed` flag to track if user has reviewed disadvantages tab
  - Finalize button only appears when Attributes, Skills, AND Disadvantages are complete
  - Flag is automatically set when user visits disadvantages tab or adds/removes disadvantages
  - Updated creation banner to show all required steps clearly
- **Disadvantages Display**: Clarified relationship between Disadvantage Points and Faith Fractures
  - During creation, shows "Starting Faith Fractures = Disadvantage Points"
  - After finalization, displays actual Faith Fractures values
  - Updated all disadvantage descriptions with complete rule details

### Updated
- **Disadvantages Definitions**: All 7 disadvantages updated with complete rule descriptions
  - Addiction: Complete withdrawal effects (1 day/1 week/1 month penalties)
  - Berserker's Curse: Detailed berserk state mechanics
  - Hunted: Threat rank descriptions (1-3 points)
  - Physical Scars: All 4 scar types with point costs
  - Mental Restrictions: TN values for Oath/Fear/Personality (6/8/16)
  - Unluck: Misfortune token amounts per rank
  - Vulnerability: Damage type selection

## [0.0.94] - 2025-01-XX

### Added
- **Character Creation Workflow**: Complete character creation system with guided wizard
  - 5-step wizard: Overview → Attributes → Skills → Disadvantages → Review
  - Attribute Point Buy: Start at Mastery Rank, spend exactly 16 points (max 8 per attribute)
  - Skill Point Buy: Start at 0, spend exactly 16 points (configurable via CONFIG), max 4 per skill
  - Disadvantages system: Optional 0-8 points, determines starting Faith Fractures
  - Sheet locking: Hard lock until creation complete (prevents editing, shows overlay banner)
  - GM-only "Force Unlock" option for existing characters
  - Auto-migration: Existing characters automatically marked as creation complete
- **Disadvantages System**: Complete implementation with all 7 disadvantage types
  - Addiction (2 pts): Substance/ritual dependency with penalties
  - Berserker's Curse (2 pts): Berserk state when Wounds ≥ Vitality
  - Hunted (1-3 pts): Variable threat level with hunter details
  - Physical Scars (1-3 pts): One-Eyed, One-Handed, Heavy Sleeper, Fragile Frame
  - Mental Restrictions (2 pts): Oaths/Fears/Personality traits with Resolve checks
  - Unluck (1-3 pts): Misfortune tokens per session
  - Vulnerability (3 pts): Double damage from specific type
  - Configurable fields for each disadvantage type
  - Validation to ensure total points ≤ 8
- **Disadvantages Tab**: New character sheet tab displaying selected disadvantages
  - Shows total disadvantage points and Faith Fractures sync status
  - Displays all selected disadvantages with details and point costs
  - Read-only view after creation (editable during creation wizard)
- **Character Creation Wizard**: Full-featured stepper UI
  - Step navigation with visual indicators
  - Real-time point tracking and validation
  - Attribute allocation with +/- controls (enforces MR base, 8 max)
  - Skill allocation organized by category
  - Disadvantage selection with configuration dialogs
  - Review step with complete summary
  - Finalize button that applies all changes and unlocks sheet
- **Creation State Management**: Actor flag system for tracking completion
  - `system.creation.complete` flag on all character actors
  - `system.disadvantages` array storing selected disadvantages
  - Hooks: `preCreateActor` sets new characters to incomplete
  - Migration hook: Existing characters auto-set to complete
- **CONFIG Constants**: Creation rules configuration
  - `CONFIG.MASTERY.creation.attributePoints` (16)
  - `CONFIG.MASTERY.creation.skillPoints` (16, configurable)
  - `CONFIG.MASTERY.creation.maxAttributeAtCreation` (8)
  - `CONFIG.MASTERY.creation.maxSkillAtCreation` (4)
  - `CONFIG.MASTERY.creation.maxDisadvantagePoints` (8)

### Changed
- Character sheet now locks when `system.creation.complete === false`
- Faith Fractures automatically synced with Disadvantage Points on creation finalize
- Template structure updated to include creation and disadvantages fields

## [0.0.74] - 2025-01-XX

### Added
- **Weapons System**: Complete weapons implementation with all weapons from the Players Guide
  - Created `src/utils/weapons.ts` with all 22 weapons (Unarmed, Daggers, Swords, Axes, Hammers, Polearms, Bows, Crossbows, etc.)
  - Each weapon includes: damage dice, hands requirement, innate abilities, and special effects
  - Weapon properties reference with descriptions (Finesse, Light, Versatile, Brutal, Reach, Heavy, Ranged, Set, Defensive, etc.)
  - Helper functions to filter weapons by hands, type, and properties
  - Easily extensible structure for adding new weapons
- **Special Effects System**: Complete special effects reference implementation
  - Created `src/utils/special-effects.ts` with all special effects organized by category
  - Physical Effects: Bleeding, Blinded, Corrode, Freeze, Grappled, Ignite, Poisoned, Prone, Push, Regeneration, Shock, Stunned
  - Mental Effects: Charmed, Curse, Disoriented, Frightened, Mark, Soulburn, Torment, Hex
  - Damage & Combat Modifiers: Crit, Penetration, Smite, Precision, Brutal Impact, Expose, Weaken
  - Support & Cleansing: Cleanse, Immovable
  - Each effect includes: description, duration, stacking rules, and removal methods
  - Helper functions to parse and format effect values
- **Equipment Tab**: Fully functional equipment management interface
  - Weapons section with detailed weapon cards showing damage, type, hands, properties, and special effects
  - Armor section (prepared for future implementation)
  - "Add Weapon" button opens weapon selection dialog
  - "Add Armor" button (placeholder for future implementation)
  - Equip/Unequip checkboxes for weapons and armor
  - Edit and Delete buttons for equipment items
- **Weapon Creation Dialog**: User-friendly dialog for adding weapons to characters
  - Dropdown selection with all available weapons
  - Weapons grouped by category (One-Handed Melee, Two-Handed Melee, Ranged)
  - Live preview of weapon details (damage, hands, properties, special, description)
  - Option to equip weapon immediately upon creation
  - Automatically determines weapon type (melee/ranged) based on properties

## [0.0.73] - 2025-01-XX

### Fixed
- Fixed guided movement mode not activating - now checks both `option.slot` and `option.segment` for movement detection
- Fixed import path for power definitions in token-radial-menu.ts (changed from `./utils/` to `../utils/`)
- Fixed ChatBubbles deprecation warning - now uses `element` property instead of deprecated `container` property
- Improved guided movement implementation:
  - Added token control to ensure token is focused during movement
  - Improved Ruler integration using state's ruler instance
  - Enhanced grid highlighting with proper highlight layer support
  - Better error handling and fallback distance calculations
  - Exported `startGuidedMovement` and `endGuidedMovement` functions for proper access

## [0.0.72] - 2025-01-XX

### Added
- **Guided Movement Mode**: Implemented a complete guided movement system for movement actions
  - When a movement option is selected from the radial menu, enters guided movement mode
  - Token becomes semi-transparent to indicate "picked up" state
  - Real-time path preview from origin to mouse position with visual feedback
  - Green path/highlights for valid destinations (within range), red for invalid (out of range)
  - Left-click on valid destination animates token movement along the path
  - Right-click or ESC cancels movement mode
  - Automatic cleanup of event listeners and graphics
  - Integrated with existing token movement restrictions
- Added system setting for default scene background image (configurable by GM)

### Fixed
- Fixed 404 error when opening power creation dialog - corrected dynamic import paths for `mastery-trees.js` and related utility modules
- Updated import paths in `character-sheet-power-dialog.ts` from `../../utils/` to `../utils/` to correctly resolve from `dist/sheets/` to `dist/utils/`
- Fixed import path in `token-radial-menu.ts` for power utilities

## [0.0.71] - 2025-01-XX

### Fixed
- Fixed 404 error when opening power creation dialog - corrected dynamic import paths for `mastery-trees.js` and related utility modules
- Updated import paths in `character-sheet-power-dialog.ts` from `../../utils/` to `../utils/` to correctly resolve from `dist/sheets/` to `dist/utils/`
- Fixed import path in `token-radial-menu.ts` for power utilities

## [0.0.68] - 2025-01-XX

### Fixed
- Fixed inner radial menu segments not being clickable - added proper interactivity and z-order management
- Updated version to 0.0.68 in all relevant files

## [0.0.67] - 2025-01-XX

### Fixed
- **Inner Segments Now Functional Filters**: Inner quadrants (Buff/Move/Util/Atk) are now clickable and properly filter the outer ring
- Clicking inner segments now updates the outer ring to show only options for that segment
- Default segment changed to "movement" for better UX

### Changed
- **Real Powers and Maneuvers**: Outer ring now displays all actual Powers and Maneuvers from actor data
- Removed hard-coded test options - all options come from real actor items and maneuver definitions
- Improved data collection from actor items (type "special" for powers)
- Enhanced `getAllCombatOptionsForActor()` to properly extract range, tags, and metadata

### Added
- Enhanced `getSegmentIdForOption()` with tag-based active-buff detection
- Debug logging to show option counts per segment
- Token flag now stores `segment` field in addition to `category` for better tracking
- Tags support in `RadialCombatOption` interface for advanced filtering

### Technical
- Refactored `openRadialMenuForActor()` with separate `updateInner()` and `rerenderOuter()` functions
- Improved state management for segment selection
- Better visual feedback when inner segments are clicked (active state highlighting)

## [0.0.66] - 2025-01-XX

### Changed
- **Radial Menu Redesign**: Refactored outer ring from small circular buttons to CS:GO-style wedge slices
- Outer ring now displays large, clickable wedge segments instead of tiny dots
- Each combat option is represented as a ring segment (donut slice) between inner and outer radius
- Improved visual clarity and clickability of options

### Added
- **Info Panel**: Added HTML info panel that appears on the right side of the screen when hovering over options
- Info panel displays: option name, source (power/maneuver), slot type, range, and description
- Info panel positioned dynamically based on token screen coordinates
- Enhanced hover effects: wedges highlight with increased alpha and brighter borders
- CSS styling for info panel in `styles/overlays.css`

### Technical
- Refactored `createRadialOptionSlice()` to draw proper ring segments (donut slices)
- Added `worldToScreen()` helper for coordinate conversion
- Added `getOrCreateInfoDiv()`, `showRadialInfoPanel()`, and `hideRadialInfoPanel()` functions
- Updated `closeRadialMenu()` to also hide info panel
- Improved wedge drawing with proper inner/outer arc calculations

## [0.0.65] - 2025-01-XX

### Fixed
- Enhanced canvas layer detection with detailed logging
- Added fallback to `canvas.tokens` layer when HUD layer unavailable
- Added last resort fallback to `canvas.app.stage` (root PIXI container)
- Improved nested property checking (e.g., `key.container`)
- Better debugging output showing all canvas.hud keys and their types

### Technical
- Enhanced `src/token-radial-menu.ts` with comprehensive canvas layer detection
- Logs key types and identifies which properties have `addChild` method
- Multiple fallback strategies for maximum compatibility

## [0.0.64] - 2025-01-XX

### Fixed
- **Critical:** Fixed `canvas.hud.addChild is not a function` error in radial menu
- Added Foundry v13 compatibility for canvas layer API with multiple fallback options
- Radial menu now tries multiple canvas layer structures (container, direct, objects)
- Range preview also uses fallback options for canvas.effects layer
- Added debug logging to identify canvas layer structure

### Technical
- Updated `src/token-radial-menu.ts` with v13-compatible canvas layer access
- Multiple fallback paths for canvas.hud and canvas.effects
- Fallback to canvas.foreground if HUD layer not available

## [0.0.63] - 2025-01-XX

### Added
- **PIXI-based Radial Menu for Combat Action Selection**: Replaced dialog-based combat option selection with a visual radial menu that appears on the canvas around tokens
- Inner circle with 4 color-coded segments: Movement (yellow), Attack (red), Utility (blue), Active Buff (violet)
- Outer ring showing filtered options based on selected segment
- Range preview on hover (cyan circle showing maximum reach in meters)
- Click handling to select options and store flags on tokens
- Outside-click detection to close the menu
- Active Buff detection for powers requiring actions
- Proper cleanup of graphics and event listeners

### Changed
- Token HUD icon now opens radial menu instead of dialogs
- Combat option selection is now visual and canvas-based rather than HTML dialogs

### Technical
- New file: `src/token-radial-menu.ts` - Complete radial menu implementation
- Updated: `src/token-action-selector.ts` - Integrated radial menu, removed old dialog functions
- Range parsing from power/maneuver data (supports formats like "8m", "12m", "Self")
- Foundry v13 compatible PIXI graphics and canvas layer integration

## [0.0.36] - 2025-12-07

### Fixed
- **Critical:** Fixed Combat Tracker initiative dice not being detected - updated selector to use multiple fallback options for Foundry v13 compatibility
- Added comprehensive selector fallbacks: `.initiative`, `[data-control="rollInitiative"]`, `.initiative-roll`, `a[data-action="rollInitiative"]`, and `a.combatant-control[data-control="rollInitiative"]`
- Restored missing source files: `src/documents/actor.ts`, `src/utils/constants.ts`, `src/utils/powers.ts`
- Added `heal()` and `applyDamage()` methods to MasteryActor class
- Fixed module.ts to properly import and initialize combat hooks

### Added
- Debug logging to show which selector successfully finds initiative elements
- Comprehensive TypeScript rebuild of core source files

## [0.0.34] - 2025-12-07

### Fixed
- **Critical:** Fixed missing MasteryActor and MasteryItem class implementations causing actor preparation failures
- **Critical:** Fixed "Cannot read properties of undefined (reading 'total')" error in actor data preparation
- Fixed deprecated CONST.CHAT_MESSAGE_TYPES → CONST.CHAT_MESSAGE_STYLES (Foundry v13 compatibility)
- Actor data now safely initializes with default values for resources, actions, and mastery

### Added
- Safe data validation in MasteryActor._prepareCharacterData()
- Safe data validation in MasteryActor._prepareNpcData()
- Comprehensive error handling for missing actor system properties

## [0.0.33] - 2025-12-07

### Added
- **Automatic Initiative Rolling on Combat Start**: When combat begins, initiative is now automatically rolled for all combatants after a 1-second delay
- **Passive Ability Reminder System**: Players receive a private chat message at combat start showing their active passive abilities and available slots
- **Passive Selection Phase**: Before initiative is rolled, players are prompted to review and adjust their passive abilities

### Changed
- `onCombatStart` function is now async and triggers automatic initiative rolling
- Combat start sequence now includes passive ability management phase
- NPCs roll initiative first (automatic, no shop), followed by PCs (with Initiative Shop dialog)

### Technical Details
- New function: `promptPassiveSelection(combat)` - Displays passive ability status to all player characters
- Modified function: `onCombatStart(combat, _updateData)` - Now handles full combat initialization sequence
- Passive status messages are whispered to individual players and GM only
- 1-second delay between passive prompt and initiative rolling to allow player interaction

### Combat Start Flow
1. Combat begins
2. Players receive passive ability status notifications
3. Players can open character sheets to adjust passives
4. After 1 second, automatic initiative rolling begins
5. NPCs roll first
6. Players roll individually with Initiative Shop access
7. Combat proceeds with sorted initiative order

## [0.0.31] - Previous Version
- Refactor powers into modular structure - each tree in separate file

## [0.0.30] - Earlier Version
- Add 5 new Mastery Trees with full powers (Crusader, Berserker, Sanctifier, Alchemist, Catalyst)

## [0.0.29] - Earlier Version
- Mastery Powers database with 2-step selection (Battlemage tree complete)

## [0.0.20] - Earlier Version
- Initiative System fully implemented
- Action Economy & Resource Management complete
- Actions per round (Attack/Movement/Reaction)
- Action conversions
- Stones/Vitality/Stress tracking
- Character sheet UI panels

## [0.0.7] - Earlier Version
- Base system implementation
- Character and NPC sheets
- Item management
- Basic combat integration
