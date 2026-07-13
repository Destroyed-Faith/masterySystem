# Changelog - Mastery System / Destroyed Faith

All notable changes to this project will be documented in this file.

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
