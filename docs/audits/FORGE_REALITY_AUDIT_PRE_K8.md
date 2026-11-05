# Fable — Forge Reality Audit / Pre-K8 Validation

Date: 2026-11-05 · Reviewer: Fable (independent, read-only)
Subject: real Forge export `C:\Users\navar\Downloads\GM Dump Forge.txt` (format `mastery-identity-snapshot` v1) vs. implementation at HEAD `888398f1` (tag `v0.9.826`), source catalogs, canonical rules and the approved ID-refactor plan.

Scope rules honoured: no source change, no world/pack/actor/effect change, no production migration, no pack rebuild, no commit/push, no K8 cutover. All world-side analysis used a **non-mutating** offline dry-run (`scripts/run-identity-snapshot-audit.mjs` → `%TEMP%`), temp Node scripts over the export (outside the repository), and the public `dist/` API (`resolvePowerIdentity`, `buildEchoArtifactTree`, `getTemplate`, `isLimitedPowerTemplateId`).

Machine-readable appendix: `docs/audits/FORGE_REALITY_AUDIT_PRE_K8.evidence.json`.

---

## 1. Executive Summary

**Status: PARTIAL.**

- The Forge world runs **exactly** the code under review (system `0.9.826`, HEAD `888398f1`, working tree clean for tracked files). No deployment mismatch; every finding below is a data/catalog/tooling finding, not a stale-deploy artefact.
- **World identity is in good shape**: 65 power items (26 world + 39 token copies) all carry a valid `templateId`, ranks in range, no Limited mismatch, no duplicates. 27 unique artifact rows (×token copies) match the current builder output row-for-row — with **one exception**.
- **1 HIGH world defect**: Lor-Keth's *Titan Scars* (`lVEhzTR1AvkERGQZ`, world + 1 token copy) is built from the retired key `titanScarsIntellect` and grants `ab-armor-temp-hp` as "Titan Growth I". The rulebook explicitly retires that combined Active Buff; the current catalog requires `artifactFunctionId: titan-growth`. Preflight reports it as **resolved** (identity present and valid → no warning), the migration dry-run proposes **0** changes. Requires manual review; cannot be auto-migrated.
- **Compendium `mastery-system.echo-artifacts` is stale** against the builder at 0.9.826: 193/220 docs differ; 606/606 rows have `rank: null`, 51 rows lack `artifactFunctionId` (dragon-breath 10, titan-growth 10, life-absorption 9, artifact-awakening 22), 19 Ringchain heal/cleanse rows lack `powerTemplateId`, 70 `authoredStages` carry no identity fields. This is the already-planned K9 pack rebuild — **not yet done**, confirmed on real data.
- **Rules conflict surfaced**: Dragon Head *Draconic Roar* is "Retired – redesign pending" in the Dragon Head table (`Players_Handbook.md:2939`) but "approved artifact-only Armor Aura exception" at `:7008`; the catalog implements `ab-armor-aura` PL 4 (+4 Armor) while the table says "formerly +12 Armor". Scurry's world item grants it. Reported, not reinterpreted.
- **Export tooling gaps** (macro): `masteryRank` is read from the wrong path (`system.masteryRank`, actual `system.mastery.rank`) → `null` for all 15 actors; `progressionPicks.id/name` read non-existent keys; `nodeId`/`seedVersion` flags are filtered out. Rank propagation and seed provenance therefore **NOT VERIFIED** from this export.
- **Runtime execution is not proven by any of this.** No Playwright/E2E smoke, no isolated world-copy dry-run inside Foundry, no shadow-compare log from Forge. These remain open K8 prerequisites.

---

## 2. Environment and Version Alignment

| Item | Value | Evidence |
|---|---|---|
| Export format | `mastery-identity-snapshot` v1, exported `2026-11-05T08:03:43.169Z` | export header |
| Forge system version | `0.9.826` | `system.version` |
| Forge core | `14.369` | `core.version` |
| Host | Forge (`destroyed-faith-mastery-system.eu.forge-vtt.com`), world `destroyed-faith-mastery-system` | `host.isForge`, `world.id` |
| Repo HEAD | `888398f1 release: 0.9.826 …`, `git describe` → `v0.9.826` | `git log`, `git describe --tags` |
| Working tree | clean for tracked files (only untracked `.agents/`, `.archify/*`, one evidence json) | `git status --porcelain` |
| `package.json`/`system.json` | `0.9.826` | release commit |
| Deployment mismatch | **None** | Forge == HEAD |

**Alignment: PASS.** Findings are not attributable to a stale deployment.

Caveat: the export proves *which code is installed*, not that the Forge world was last *written* by this code. World artifact rows carry no `seedVersion` in the export (macro filters that flag), so the seed that produced the world rows is **NOT VERIFIED** (see §3). Row-for-row agreement with the builder at HEAD (§5) is the substitute evidence.

---

## 3. Export Completeness

Stats from header: actors 15 (0 incomplete), tokenOverrides 16 (3 incomplete), compendiumDocuments 220 (0 incomplete), errors 0, warnings 3, powerItems 26, artifactItems 11.

### 3.1 What is present
- 15 world actors (4 characters with items: Alaris, Lor-Keth, Oda, Scurry; 11 NPCs with no items).
- 13 complete token overrides (synthetic actors incl. items and effects).
- 220 compendium docs, all from **one** pack: `mastery-system.echo-artifacts` (Item/artifact). `system.json` declares only this Item pack plus three JournalEntry packs → no other Item/Actor pack exists to export. PASS.
- 3 Active Effects (all on token-override actors), each with `activeBuff` flags and `powerTemplateId`.

### 3.2 What is missing or degraded (missing ≠ pass)

| # | Gap | Severity | Location | Expected | Observed | Correction (tooling, not world) |
|---|---|---|---|---|---|---|
| X1 | Actor Mastery Rank | **MEDIUM** | `macros/export-identity-snapshot.js:313` | MR from `system.mastery.rank` (`src/utils/mastery-rank-sync.ts:61`) | `masteryRank: null` for all 15 actors (reads `system.masteryRank ?? system.mr`) | read `sys.mastery?.rank`; also export `suggestedMasteryRank` inputs if desired. Until then **rank propagation NOT VERIFIED** from export. |
| X2 | Unlinked tokens without synthetic actor | **MEDIUM** | `scene:xW8wvYRpnmKAMEGB/token:XumJmU3SvEEx4iXy`, `…/ra5OUBJuwTZp9tIN`, `scene:GbqpEJ08LXtTMrea/token:g6LAAbvPDwYnkIX0` | items/effects of every unlinked token | `incomplete: true`, `error: synthetic-actor-missing`, no name/baseActorId | GM to inspect in Foundry (likely orphaned tokens whose base actor was deleted). **NOT VERIFIED** for these 3 tokens. |
| X3 | `progressionPicks.id/name` | LOW | macro `:218-219` | picks are `{level, kind, authoredStages}` (`echo-artifacts.ts:2262`) | `id: null, name: null` on every pick | export `level`/`kind` instead. |
| X4 | Builder provenance flags | LOW | macro `MASTERY_FLAG_ALLOW` (`:30`) | `nodeId`, `seedVersion`, `evolutionNodeId`, `parentIds` | filtered (not in allowlist, not matching `/^power|^artifact|^identity/`) | add to allowlist. Seed provenance **NOT VERIFIED**. |
| X5 | Active Effect `changes`/`duration` | LOW | `exportEffect` | at least `duration` for Active Buff lifetime checks | `null` | optional; identity audit does not need it. |
| X6 | Combat documents | INFO | — | not in mandate | not exported | Alaris/Oda/Scurry carry `phasingCharges.combatId` / `msActiveBuffEmpowermentUsed.combatId` referencing combats `YWZQ8LsnXVkQUGaH`, `WSfN8fhF3FeKlcoL`, `suSPl2t4ouQbSh9w`; whether those combats still exist is **NOT VERIFIED**. |

**Completeness verdict: PARTIAL** — sufficient for identity audit of items/rows/effects; insufficient for MR/rank propagation, seed provenance and the 3 orphan tokens.

---

## 4. Identity Integrity (world + token overrides)

Population: 4 character actors + 6 character token copies (Scurry ×2, Alaris ×2, Lor-Keth ×1, Oda ×1). Token copies are byte-identical to their base actors for identity fields except where noted.

### 4.1 Power items
| Check | Result |
|---|---|
| Items | 65 (26 world, 39 token copies); 22 distinct `templateId`s |
| `templateId` missing | 0 |
| `templateId` unknown to `ALL_POWER_TEMPLATES` (197) | 0 |
| `rank` out of template range | 0 |
| `category` ≠ template category | 0 |
| `limited === true` | 0 items; `isLimitedPowerTemplateId` false for all 22 ids → 0 mismatches |
| Duplicate `templateId` per actor | 0 |
| `resolvePowerIdentity(power-item)` | 65/65 OK |
| `templateName` ≠ catalog `name` | 45 — but `templateName` stores the short template label (`Evade`, `Armor`, `Ghostform`), catalog `name` is the display form (`Passive: Evade`). Not an identity field; informational. Note two legacy labels: `Ghostform` (now *Passive: Phasing*), `Ward` (now *Passive: Special Negation*), `Fortified Frame` (now *Passive: Armor*), `Restoration` (now *Passive: Regeneration*). |

Token-only delta: token `GbqpEJ08LXtTMrea/AsAPwwnYUqqucIdd` (Alaris) has an extra `Passive: Restoration` (`passive-regeneration`) not on the base actor — expected for an unlinked copy; informational.

**PASS.**

### 4.2 Artifact items and rows
11 unique artifact items (3 Alaris, 2 Lor-Keth, 3 Oda, 3 Scurry), 27 unique rows; 9 distinct `echoArtifactKey`s + 1 legacy alias.

| Check | Result |
|---|---|
| `flags.mastery-system.echoArtifactKey` present | 11/11 |
| Key found in `ECHO_ARTIFACTS`/`GENERAL_ARTIFACTS` | 10/11 — **`titanScarsIntellect` is only an alias** (`echo-artifacts.ts:591`) |
| `system.echoKey` vs flag | Echo artifacts carry imprint (`elorians`, `titanborn`, `dragonborn`); general artifacts empty. Consistent with K2 rule (key only from flag). |
| `useAuthoredLevelProgression` | `false` on all 11 (matches builder: not set) |
| `progressionPicks[].authoredStages` | 0 on all world items (builder also emits none for these keys) |
| Rows with `powerTemplateId` | 19 (one also `artifactFunctionId: dragon-breath`) |
| Rows with neither id | 8 — all `Stone Power Support` / `Stone Pool` / `Stone Battery` / `Stone Refresh`; Preflight classifies as non-activatable → no identity required |
| Unknown template ids | 0 |
| `limited === true` | 1 row: Moonlight Judgment I → `active-ranged-limited-aoe`; `isLimitedPowerTemplateId` true, not forbidden. Consistent. |
| `rank` on template rows | all `4`, except Otherworld Reflex I `2` (rulebook: Reaction: Evade PL 2 — `Players_Handbook.md:2446`) |
| Row ↔ builder@HEAD (same key, same `currentLevel`) | 26/27 identical in name/type/tid/afid/rank/limited. 1 item not comparable (alias key). |
| Dragon-breath contract (K3: tid required) | Breath Weapon I: `active-melee-weapon-aoe` + `dragon-breath` + rank 4 → PASS |
| K2 functions (titan-growth / life-absorption / awakening: tid forbidden) | none present in world rows (Titan Scars is the stale variant, see W1) |
| Stale/ambiguous identity (key+level would mislead) | **1 — W1 below** |

### 4.3 Active Effects
3 effects, all on token overrides:

| Effect | Flags | Check |
|---|---|---|
| `ZkCM7X96CZheNa1E` "Evade" (Alaris, token `NwpxJf6a5palklSk/wG4djqMoANxj0TWa`) | `activeBuff`, `powerId e8BPR0wIAUy9hGUy`, `powerTemplateId ab-evade`, `masteryRank 3` | `powerId` resolves to Alaris' "Evade" item → OK |
| `49T674Of48B8kFdw` "Active Buff: Special Overdrive" (Oda, token `…/L5cRVPbHsCtBdDwB`) | `activeBuff`, `powerId hpFn9n1YvYXEz9aL`, `ab-special-overdrive`, MR 3 | resolves → OK |
| `oUOBU17ZXc180bL3` "Serpent Evasion I" (Scurry, token `…/FmumkQB2hsjg8X0P`) | `activeBuff`, `artifactActiveBuff`, `artifactItemId YKYNcATGmbUS7yEL`, `artifactBuffKey artifact:YKYNcATGmbUS7yEL:2:Active Buff`, `ab-evade`, MR 3 | artifact exists on that actor, row L2 is `ab-evade` → OK |

No dangling `powerId`, no effect without `powerTemplateId`. **PASS.** (Effect `masteryRank 3` is the only MR evidence in the export; actor MR itself is unexported — X1.)

### 4.4 Defects

**W1 — Stale legacy Titan Scars grants a retired Active Buff as "Titan Growth I"** — **HIGH**
- Location: world actor `HscDyhZJsKyTJLMJ` (Lor-Keth), item `lVEhzTR1AvkERGQZ` "Titan Scars - Level 2-1"; token copy `scene:NwpxJf6a5palklSk/token:uWNkQ0l833x2HR87`.
- Observed: `echoArtifactKey: titanScarsIntellect` (alias only), `echoKey: titanborn`, `currentLevel 2`; rows L1 "Titan Growth I" `[Active Buff]` `powerTemplateId: ab-armor-temp-hp`, `rank: null`; L2 "Titan Intellect Pool I" `[Stone Pool]`.
- Expected (catalog `echo-artifacts.ts:440-575`, builder@HEAD for `titanScars` L2): L1 "Titan Growth I" `[Transformation]` `artifactFunctionId: titan-growth` (no `powerTemplateId`); L2 "Titan Might I" `[Stone Power Support might.meleeDamage]`.
- Rules: `Players_Handbook.md:2683` — "Titan Growth … is an Artifact-exclusive size-changing function; **its retired combined Active Buff is no longer used**"; L1 row `:2717` "Artifact Function: Transformation (Growth 1)".
- Why the tooling misses it: `preflightActor` only checks that an identity is present and valid; `ab-armor-temp-hp` is still a real template (`activeBuffs.ts:292`). Resolver → `OK(ab-armor-temp-hp|null|r?|lim=false)`; dry-run → 0 proposals. The K2 enrichment never touches rows that already have a `powerTemplateId`, and `catalogArtifactByKey` (`identity-preflight.ts:81`) does **not** consult `ECHO_ARTIFACT_KEY_ALIASES`, so alias keys cannot be flagged either.
- Mechanical effect if cut over (C2): Lor-Keth gets an Armor + Temp HP Active Buff with unset rank instead of a Growth 1 Transformation, and lacks Titan Might I stone support. Identity-based routing would faithfully execute the wrong power.
- Classification: **Requires manual review** (GM decision: re-sync from the `titanScars` tree at level 2 or intentionally keep legacy). Not auto-migratable: inferring from key+level would silently replace a GM-visible item.
- Correction (Cursor Auto, plan-conform): (a) Preflight: resolve alias keys via `ECHO_ARTIFACT_KEY_ALIASES` and emit an **informational** "legacy-alias-key" entry; (b) Preflight: emit **manual-review** when a row's `powerTemplateId`/`artifactFunctionId` disagrees with the builder row for the same key+level (`catalog-divergence`), never auto-propose. (c) GM: re-sync item in an isolated copy first.

**W2 — Draconic Roar granted while rulebook table says "Retired"** — **MEDIUM (rules conflict, report only)**
- Location: Scurry `NkKUS1LAD4iLnjzf` item `IqH2PUiBdJzevU5Q` "Dragon Head - Level 3-1" L2 (+2 token copies); catalog `echo-artifacts.ts:1081-1086` (`templateId: 'ab-armor-aura'`, PL 4/10/16); compendium docs for Dragon Head L2+ (20 rows).
- Rulebook: `Players_Handbook.md:2939/2942/2945` "Legacy Aura – replacement pending … **Retired – redesign pending** … formerly +12/+28/+44 Armor" **vs** `:7008` "Draconic Roar remains an approved artifact-only Armor Aura exception and is not remapped".
- Observed: world row `ab-armor-aura` rank 4 (+4 Armor per catalog effect text) — neither the "retired" reading nor the "+12 Armor" value.
- Per AGENTS.md this is an authoritative-rules conflict → **report, do not resolve in code**. Not an identity defect; identity routing will do whatever the catalog says.

**W3 — Breath Weapon geometry text differs (catalog "Cone" vs rulebook "radius")** — LOW (text/rules consistency; identity unaffected)
- `echo-artifacts.ts:1112` "Damage: Cone 3 m / Ruin: Cone 3 m" vs `Players_Handbook.md:2938` "Damage: radius 3 m / Ruin: radius 3 m". Report only.

**W4 — Stale combat-scoped flags on actors** — LOW
- Alaris: `phasingChargesPending: 1`, `phasingCharges.combatId YWZQ8LsnXVkQUGaH`, `msActiveBuffEmpowermentUsed.combatId WSfN8fhF3FeKlcoL`; Oda `phasingCharges.combatId suSPl2t4ouQbSh9w`; Scurry `YWZQ8LsnXVkQUGaH`. Combat existence not exported (X6). Not an identity concern.

**W5 — `echoBound` flag typing** — LOW
- World items: `echoBound: true` (boolean, from migrations `elorian-stride-migration.ts:58`, `titan-scars-affinity-migration.ts:83`); builder: `echoBound: def.echoKey` (string, `echo-artifact-tree-builder.ts:953`); `module.ts:4115` tests `=== true`. Inconsistent but outside identity scope; report only.

---

## 5. Catalog / World / Builder Consistency

### 5.1 World vs builder@HEAD
26/27 unique rows identical (see §4.2). The only divergence is W1 (alias key, not comparable). For the 9 catalog-known keys the world was clearly generated by a builder equivalent to HEAD for identity fields (tid, afid, rank, limited, name, type). **PASS** (with W1 excluded).

### 5.2 Compendium `mastery-system.echo-artifacts` vs builder@HEAD
220 docs = 22 echo keys × levels 1–10; 606 rows.

| Metric | Value |
|---|---|
| Docs with any identity divergence from builder | **193 / 220** |
| Rows `rank: null` where builder emits a number | 296 (all template-bearing rows); total `rank: null` 606/606 |
| Rows missing `artifactFunctionId` | **51**: artifact-awakening 22 (every L10 doc), dragon-breath 10, titan-growth 10, life-absorption 9 |
| Rows missing `powerTemplateId` | **19**, all Ringchain of Kept Names heal/cleanse: `active-ranged-health-level-heal`, `active-ranged-single-cleanse`, `active-melee-aoe-restoration` |
| Name / type / limited divergences | 0 / 0 / 0 |
| `authoredStages` without identity fields | 70 picks (hollowCrown 30, ringchainOfKeptNames 30, titanScars 10) — source comment `echo-artifacts.ts:2248` says identity "must survive into authoredStages → packs" |
| Pack rows `limited: true` | 10 (Hunter's Scourge Scourge Strike I–III → `active-melee-limited-single`) — matches builder |
| Unknown/alias keys, duplicate (key, level) | 0 / 0 |
| Name collisions | "Predator Crown - Level N-1" ×3 for every level (three affinity keys share display name) — identity by key is unambiguous; UI ambiguity only (LOW) |
| Builder provenance flags (`nodeId`, `seedVersion`) | not in export (X4) |
| General artifacts (11 keys, e.g. moonlightGreatsword, soulSigil, lorKethsStaff, staffOfTheDark, shadowgraveArmor, lanternOfTheHollowStar) | **no pack docs** — only echo artifacts are shipped as a compendium; general artifacts exist in world only. Consistent with `system.json`. INFO |

Verdict: the pack is the **pre-identity** seed. This is exactly the plan's "packs lack persisted IDs" / K9 rebuild item — now **confirmed on real Forge data**. The world items are *newer* than the pack (they already carry rank/afid), which means world rows were produced by the builder at (or near) HEAD, not by dragging from the pack. Any future "drag from compendium" or pack-based resync before K9 would **regress** identity on those rows.

**P1 — Pack stale (identity fields missing)** — **HIGH for K8**, by design "not yet done". Classification: *Safely auto-migratable* via pack rebuild (deterministic from catalog) — but the rebuild itself is K9 and out of scope here.

### 5.3 Catalog vs canonical rules (spot verification of the 10 world-present artifacts)
| Artifact (key) | Canonical table found? | Identity-relevant agreement |
|---|---|---|
| Elorian Stride | `Players_Handbook.md:2446-2447` | Otherworld Reflex I = Reaction: Evade PL 2 ✔; Elorian Cling I = Movement: Wall Walk PL 4 ✔ |
| Titan Scars | `:2717` | Titan Growth I = Artifact Function Transformation ✔ catalog; **world W1 ✘** |
| Serpent Scales (`wyrmScalesLight`) | `:2853-2854` | Dragon Wings I Flight PL 4 ✔; Serpent Evasion I Active Buff: Evade PL 4 ✔ |
| Dragon Head | `:2938-2940` | Breath Weapon I ✔ (identity); **Draconic Roar conflict W2**; geometry text W3 |
| Dragon Claws | `:3004-3005` | Rending Spiral I = Melee AoE Special: Lacerate PL 4 ✔ (`active-melee-aoe-damage-t4` + `lacerate`); Tail Sweep I = Melee Push PL 4 ✔ |
| Moonlight Greatsword, Soul Sigil, Lor-Keth's Staff, Staff of the Dark, Shadowgrave Armor, Lantern of the Hollow Star | **Not in `docs/Rules/Canonical/*`** (tables only in non-canonical `docs/Rules/artefacts.md`) | **NOT VERIFIED** against authoritative rules. Secondary source agrees on Moonlight Judgment I = Limited Ranged AoE PL 4 (`artefacts.md:1859`), Soul Shell/Shadow Shell = Temp HP Stone Support (`:1922`, `:2239`), Grave Call I = Melee Push PL 4 (`:2240`; world `special` text says "Push(8), Pull(8)" — extra "Pull" wording, identity unaffected). |

---

## 6. Mechanical Risk Findings (data-proven vs needs-runtime)

| Area | Data evidence (export) | Status | Runtime needed? |
|---|---|---|---|
| Limited (K3/C2.d) | 1 world row (Moonlight Judgment I, `active-ranged-limited-aoe`, `limited:true`); 10 pack rows Hunter's Scourge; 0 limited power items; no forbidden-gate violations | PASS (data) | Yes — charge spend/miss-costs-a-use, Radial ≠ Executor parity only fixture-tested |
| Dragon Breath Damage/Ruin | Breath Weapon I: tid+afid+rank per contract; mode not persisted on the row (C1: legacy default `damage`) | PASS (data); mode default is a **documented C1 deviation** | Yes — mode prompt + shared counter |
| Row classification | 8 no-identity rows are all stone-type; Preflight non-activatable regex covers `Stone Power Support/Pool/Battery/Refresh`. Note: Draconic Recovery (Stone Refresh) is "Artifact Active … Attack Action" in rules (`:2940`) but carries no power identity — handled by the stone subsystem, not the power path | PASS (data), INFO on Stone Refresh | Yes |
| Heal / Cleanse (F12) | World: Moonlight Mending I (`active-ranged-single-heal` r4), Resting Soul I (`active-melee-health-level-heal` r4); pack: Ringchain heal/cleanse rows lack tid (P1). Code still derives rank from `artifactRowLevel` (C2.e) | PARTIAL — rank fields exist on world rows but are **not consumed** yet | Yes |
| Armor / Active Buffs | 3 live Active Buff effects all identity-complete; `ab-armor`, `ab-damage`, `ab-evade`, `ab-special-overdrive`, `ab-armor-aura` present | PASS (data) | Yes — aura/slot replacement |
| DR / Phasing | `passive-ghostform` on Alaris; `phasingCharges` flags present with `combatId`s (W4) | NOT VERIFIED (combat docs not exported) | Yes |
| Titan Growth PL | **W1** — world row is the retired Active Buff, not `titan-growth` | **FAIL (data)** | Yes after fix |
| Reactions | `reaction-armor`, `reaction-counter-damage(-push)`, `reaction-special-increase`, `reaction-evade`, `reaction-temp-hp` all valid ids | PASS (data); Special Increase substring heuristic is C1-documented | Yes |
| Specials | `chosenSpecialKey` on rows: `challenge`, `hex`, `soulburn`, `lacerate`, `push` — all catalog keys | PASS (data) | Yes |
| Awakening | no world item at L10; pack L10 rows lack `artifact-awakening` (P1) | NOT VERIFIED (world) / FAIL (pack) | — |
| Rank propagation (actor MR → effects) | actor MR unexported (X1); effects say MR 3 | NOT VERIFIED | Yes |

---

## 7. K0–K7 Verification Matrix (re-evaluated with Forge data)

Gates re-run at HEAD on 2026-11-05: `npx tsc --noEmit` → exit 0; `npx vitest run` → **363 files / 3835 tests passed** (includes guard `no-text-mechanic-matching`, migration M1–M7b, shadow fixture reports, golden baseline, snapshot-offline).

| Item | Verdict | Evidence |
|---|---|---|
| F1 tsc | Resolved | exit 0 |
| F2 name fallback / silent loss | Resolved (code) · **Not verifiable at runtime** | legacy decides; no Forge shadow log |
| F3 Limited Radial ≠ Executor | Resolved (fixture) · runtime NOT VERIFIED | parity test; 1 real Limited row exists to test on |
| F4 enrichment mixing | Resolved | 8 no-identity world rows untouched by design; W1 shows the *flip side*: rows **with** identity are never corrected |
| F5 enrichment only Radial+Preflight | Partially resolved (as before) | unchanged |
| F6 `useAuthoredLevelProgression` | Resolved | all 11 world items `false`; pack: 10 Sentinel Frame docs `true` (consistent with catalog) |
| F7 effect persistence | Resolved (spy test) · runtime NOT VERIFIED | 3 real effects available |
| F8 backup/rollback | Resolved (K7b, `-=` semantics) · runtime NOT VERIFIED | no `identityMigrationBackup` flags in world (never migrated) — expected |
| F9 suggestions | Resolved | dry-run on Forge: nothing unresolved → nothing to suggest (and W1 is invisible to it) |
| F10 shadow bounded | Resolved | — |
| F11 dual segment derivation | Partially resolved (K1b) | unchanged |
| F12 heal/cleanse `option.rank` | **Still open (declared C2.e)** | Forge heal rows carry rank 4 but code ignores it |
| F13 dead audit script | Still open (low) | — |
| F14 P2 throws | Resolved | dry-run `errors: []` |
| K0 baseline | PASS | — |
| K1 contract/matrix | PASS | 30 tests |
| K2 enrichment/preflight | PASS for fixtures · **Gap on real data (W1)**: no catalog-divergence / alias detection | `identity-preflight.ts:81,353-363` |
| K3 contract (breath tid required / K2 fns forbidden) | PASS | Scurry Dragon Head L1 |
| K4 suggestions | PASS | — |
| K5 shadow reports | PASS (fixtures) · Forge NOT VERIFIED | — |
| K6 guard | PASS | 82-entry allowlist test green |
| K7 migration + rollback | PASS (unit) · Forge dry-run: 0 proposals (nothing unresolved) | `%TEMP%\forge-dryrun\summary.json` |

Gate table: tsc PASS · tests PASS · matrix PASS · guard PASS · shadow fixtures PASS / Forge NOT VERIFIED · preflight dry-run on Forge PASS (137/137 resolved, 0 blocking) **but blind to W1** · migration persistence NOT VERIFIED (never run) · backup/rollback unit PASS · authoredStages PASS (world) / FAIL (pack) · golden PASS.

---

## 8. Migration Readiness (non-mutating dry-run)

Dry-run: `node scripts/run-identity-snapshot-audit.mjs <export> --out %TEMP%\forge-dryrun` — 28 actor-likes audited (15 world + 13 complete tokens), 0 skipped; totals `sources 137 / resolved 137 / unresolved 0 / blocks 0 / omits 0 / informational 0`; proposals `total 0` (auto-stable 0, provenance 0, manual 0, not-activatable 0).

Classification of all exported documents:

| Class | Count | Documents |
|---|---|---|
| **Already correct** | 10 artifact items (26 rows) · 65 power items · 3 effects | all except W1; token copies mirror base |
| **Safely auto-migratable** | 0 world documents · **220 pack docs** (deterministic rebuild from catalog = K9, not this migration API) | — |
| **Requires manual review** | **1** item (+1 token copy): `lVEhzTR1AvkERGQZ` Titan Scars (W1) | GM decision; `titan-scars-affinity-migration.ts` runs the *opposite* direction (`titanScars` → affinity keys) and is itself legacy |
| **Ambiguous** | 0 identity rows · 1 rules topic (W2 Draconic Roar) | needs rules owner |
| **Blocked / Not verifiable** | 3 orphan tokens (X2); MR/rank propagation (X1); seed provenance (X4) | export gaps |

Note on the dry-run API: with 0 unresolved sources it has **nothing to do** on this world. The actual K8 risk on Forge is not "missing identity" (the migration's target) but "wrong-but-valid identity" (W1) and "pack regression" (P1), neither of which `planActorIdentityMigration` is designed to catch.

---

## 9. Remaining Runtime / E2E Verification (not provable from export)

1. Isolated Forge **world copy**: run Preflight hook + `planActorIdentityMigration` **inside Foundry** (expect 0 proposals, same as offline), then re-sync Lor-Keth's Titan Scars from the `titanScars` tree and re-run Preflight.
2. Shadow-compare live: Alaris Moonlight Judgment (Limited charge, miss costs a use), Scurry Breath Weapon (Damage vs Ruin prompt, shared counter), Oda Special Overdrive / Lor-Keth Armor Active Buff (effect persistence, slot replacement), Rending Spiral (Lacerate special), Tail Sweep (Push), heal rows (Moonlight Mending, Resting Soul) with rank 4 vs current `artifactRowLevel`-derived rank.
3. Phasing/DR with the three stale `combatId`s — confirm charges reset on new combat.
4. Playwright combat smoke per readiness §7 item 6 — **missing**.
5. Pack rebuild (K9) then drag-test one echo artifact per `artifactFunctionId` family to confirm persisted ids survive `Item.create`.

---

## 10. Required Corrections for Cursor Auto (ordered, minimal)

1. **Preflight catalog-divergence check (K2 extension, plan-conform, read-only):** for artifact rows whose `powerTemplateId`/`artifactFunctionId` is present, compare with the builder row for `(echoArtifactKey → alias-resolved, currentLevel, row.level)`; on mismatch emit `manual-review` entry `catalog-divergence` with both identities. Never auto-propose. Add fixture: Titan Scars legacy (`ab-armor-temp-hp`) at alias key.
2. **Preflight alias awareness:** `catalogArtifactByKey` → resolve `ECHO_ARTIFACT_KEY_ALIASES`; emit `informational` `legacy-alias-key`.
3. **Export macro fixes:** `masteryRank` ← `system.mastery.rank`; picks export `level`/`kind`; allowlist `nodeId`, `seedVersion`, `evolutionNodeId`, `parentIds`. Bump `formatVersion` or add `formatMinor`; keep adapter tolerant.
4. **Document W2/W3 as rules conflicts** in the rules backlog (not in code): Draconic Roar retired-vs-exception; Breath cone-vs-radius; Titan Growth retired Active Buff still a live template (`ab-armor-temp-hp`) — ask rules owner whether the template should be marked retired in catalog metadata.
5. **K9 pack rebuild** remains a separate gated decision; this audit confirms it is required before any pack-sourced resync.

No source change was made for any of the above.

---

## 11. K8 Readiness Decision

**PARTIAL.**

Rationale: code gates are green and the Forge world's identity data is, with one exception, already in the shape the identity path expects; the dry-run migration is a no-op on this world. But (a) one real actor carries a valid-looking yet rules-retired identity that every current check accepts silently (W1), (b) the shipped compendium is pre-identity and would regress rows on resync (P1/K9), (c) MR, seed provenance and three tokens could not be verified from the export (X1/X2/X4), and (d) no runtime/E2E evidence exists from Forge. None of these is a code blocker for starting cluster **d** on an isolated copy; all of them block a production cutover.

Minimal ordered list to reach READY:
1. Resolve W1 on an isolated world copy (GM re-sync of `lVEhzTR1AvkERGQZ` to `titanScars` L2) and add the Preflight divergence/alias checks (§10.1–2) so it cannot recur silently.
2. Fix export macro (§10.3), re-export, confirm MR present and 3 orphan tokens explained.
3. Execute K9 pack rebuild in the isolated copy; re-run this audit script on the new export → expect 0 pack divergences.
4. Runtime shadow + Playwright smoke per §9 on the isolated copy; file results.
5. Rules owner decision on W2 (Draconic Roar) before cluster **b** (Active Buffs) is cut.
