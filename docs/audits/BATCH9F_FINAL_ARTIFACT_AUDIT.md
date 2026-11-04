# Batch 9F — Final Artifact Regression & Catalogue Audit

**Mode:** Read-only. No runtime, pack, actor, rulebook, or commit changes in this batch.  
**Date:** 2026-11-04  
**Branch:** `main` (dirty working tree; corrections from 9B.1–9E present as uncommitted source changes)  
**Canonical SSoT:** `docs/Rules/Canonical/Players_Handbook.md`, `Actives.md`, `Active_Buffs.md`  
**Baseline:** `docs/audits/BATCH9_ARTIFACT_CATALOGUE_AUDIT.md` (Phase A)  
**Working evidence:** `scripts/_batch9f-dump.json`, `scripts/_batch9f-merged.json`

---

## Overall verdict

### **READY WITH OPEN DESIGN ITEMS** *(updated after Batch 9C.2)*

Completed correction batches **9B.1, 9B.2, 9B.3, 9C.1, 9C.2, 9D, 9E** verify cleanly against Canonical PH / Actives / Active_Buffs **in TypeScript source definitions**, with focused vitest coverage green and `tsc --noEmit` clean.

**Batch 9C.2 (post-9F):** The three Oracle Aid / `influence.cleanse` MISMATCH rows are now **MATCH** — `influence.enemyEvadeReduction` Rank 2/3/4 at Artifact Levels 2/5/8. See `docs/audits/BATCH9C2_ORACLE_EVADE_REDUCTION.md`.

Remaining non-READY blockers are **open design / source / deployment** items, not unfixed Oracle Frame rule breaks:

1. **Retired aura templates remain playable** for Draconic Roar (`ab-armor-aura`) and Moonlight Shadow (`ab-damage-aura`) — **DESIGN PENDING**, with runtime risk.
2. **Lor-Keth's Staff L1–9** remains **SOURCE MISSING** while still granted as executable powers.
3. **Echo packs / world seeds / embedded actors are stale** relative to corrected source (seed still `ECHO_ARTIFACT_SEED_VERSION = 59`; pack JSON still carries pre-correction templates).

TypeScript / vitest green alone is **not** a deployment gate for packs/actors.

---

## 1. Prerequisites

| Check | Result |
|---|---|
| Git branch | `main` tracking `origin/main` |
| Working tree | **Dirty** — 9B–9E source + PH edits + tests uncommitted; no stash used |
| Released commit tip | `359c040d` — `0.9.822` Special Auras + Batch 9 Phase A audit |
| Batch 9B.1 Witch Staff | **Complete in working tree** — verified |
| Batch 9B.2 Sentinel Frame | **Complete in working tree** — verified (`useAuthoredLevelProgression`) |
| Batch 9B.3 Serpent Scales | **Complete in working tree** — verified |
| Batch 9C Oracle | **Complete** — **9C.1 Oracle Field** + **9C.2 Enemy Evade Reduction** (post-9F working tree) |
| Batch 9D General Artifacts | **Complete in working tree** — verified (see SOURCE MISSING / DESIGN PENDING carve-outs) |
| Batch 9E Remaining | **Complete in working tree** — verified |
| Batch 9F | This audit only |
| Canonical rulebooks present | Yes (PH includes Oracle Field Armor + Tail Sweep approved-exception language in working tree) |
| Vitest (batch9* + artifact/combat regressions) | **243/243 passed** (15 files) |
| `npx tsc --noEmit` | **Clean** |

---

## 2. Inventory

Resolved via `buildEchoProgressionPicks` + `resolveFullLevelProgression` with `preferAuthored` when `useAuthoredLevelProgression` is set.

| Metric | Phase A | Batch 9F |
|---|---:|---:|
| Artifact keys | 33 | **33** (unchanged) |
| Ability rows (L1–10 compiled) | 327 | **327** (unchanged) |

**Composition:** 22 Echo artifact keys (incl. 3 Witch Staff traditions + 3 Predator Crown variants) + 11 General artifacts.

**No key added or removed.** Row-count parity holds; content at many rows changed under 9B–9E.

### Full key list

| Name | Key | Kind |
|---|---|---|
| Alchemist Coat | `alchemistCoat` | Echo (Unbound) |
| Blight / Root / Ruin Staff | `witchStaffBlight` / `Root` / `Ruin` | Echo (Unbound) |
| Dragon Claws / Head | `dragonClaws` / `dragonHead` | Echo |
| Elorian Stride | `elorianStride` | Echo |
| Falcon Wide Brim | `falconWideBrim` | General |
| Frostbound Returning Axe | `frostboundReturningAxe` | General |
| Green Warden Mantle | `greenWardenMantle` | Echo |
| Heart of Winter | `heartOfWinter` | General |
| Heartseeker | `heartseeker` | General |
| Hollow Crown | `hollowCrown` | Echo |
| Hunter's Scourge | `huntersScourge` | Echo |
| Judicator / Oracle / Sentinel Frame | `judicatorFrame` / `oracleFrame` / `sentinelFrame` | Echo |
| Lantern of the Hollow Star | `lanternOfTheHollowStar` | General |
| Lor-Keth's Staff | `lorKethsStaff` | General |
| Moonlight Greatsword | `moonlightGreatsword` | General |
| Predator Crown ×3 | `predatorCrownMight` / `Wits` / `Intellect` | Echo |
| Primal Vestment | `primalVestment` | Echo (7 printed stages) |
| Ringchain of Kept Names | `ringchainOfKeptNames` | Echo |
| Serpent / Wyrm Scales | `wyrmScalesLight` / `wyrmScalesHeavy` | Echo |
| Shadowgrave Armor | `shadowgraveArmor` | General |
| Soul Sigil | `soulSigil` | General* |
| Staff of the Dark | `staffOfTheDark` | General |
| Starfallen Forceshield | `starfallenForceshield` | General |
| Stonebound Soles | `stoneboundSoles` | Echo |
| Titan Scars | `titanScars` | Echo |

\*Soul Sigil is inventoried with the General alignment set in Batch 9D.

---

## 3. Status counts (Phase A → 9F)

| Status | Phase A | Batch 9F | Δ |
|---|---:|---:|---:|
| MATCH | 111 | **192** → **195** after 9C.2 | +81 / +84 |
| APPROVED EXCEPTION | 21 | **24** | +3 |
| MISMATCH | 51 | **3** → **0** after 9C.2 | −48 / −51 |
| LEGACY | 9 | **0** | −9 |
| UNRESOLVED | 135 | **93** | −42 |
| MISSING | 0 | **0** | 0 |
| UNAUTHORIZED | 0 | **0** | 0 |
| DESIGN PENDING *(9F explicit)* | — | **6** | +6 |
| SOURCE MISSING *(9F explicit)* | — | **9** | +9 |
| **Total** | **327** | **327** | 0 |

> **Post-9F update (9C.2):** Oracle Frame L2/5/8 MISMATCH → MATCH. Live source MATCH count for ability rows with verified overrides is effectively **195**; remaining MISMATCH in corrected Artifact source defs for the 9F matrix is **0**.

### Classification rules used in 9F

- Phase A status is **inherited** when a row was not re-verified in 9B–9E.
- **UNRESOLVED is never promoted to MATCH** only because code was unchanged.
- New MATCH / APPROVED EXCEPTION rows require a verified rule reference **and** runtime/source evidence (definition + batch test where applicable).
- Former LEGACY aura rows for Draconic Roar / Moonlight Shadow are re-tagged **DESIGN PENDING** (not MATCH).
- Lor-Keth L1–9 re-tagged **SOURCE MISSING** (not MATCH).

### Major transitions

| Transition | Count | Meaning |
|---|---:|---|
| MISMATCH → MATCH | 8 | Corrected rows (Serpent Evade L2, Alchemist Stone ×3, Stonebound ×3, Rending Spiral II, …) |
| MISMATCH → APPROVED EXCEPTION | 3 | Tail Sweep I–III (approved Artifact Special Rule) |
| LEGACY → MATCH | 3 | Oracle Field I–III → Active Buff Armor |
| LEGACY → DESIGN PENDING | 6 | Draconic Roar ×3, Moonlight Shadow ×3 |
| UNRESOLVED → MATCH | 18 | 9D remaps verified (Frost Throw, Uncanny Soul, Staff of the Dark, Starfallen Crystal*, …) |
| UNRESOLVED → SOURCE MISSING | 9 | Lor-Keth L1–9 |
| MISMATCH → MISMATCH | 3 | Oracle Aid at 9F time — **cleared by 9C.2** → MATCH |

---

## 4. Correction-batch verification

### 9B.1 — Witch Staff (Root / Ruin / Blight) — PASS

| Check | Evidence |
|---|---|
| Binding Circle = Ranged AoE Special-only Root | `active-ranged-aoe-damage-t5` + Root; no Overdrive |
| Main Spell = Weaken / Ruin / Blight Instant Special | `active-ranged-instant-special-t6` + tradition Special |
| No false Damage Powers / Special Overdrive substitutes | Confirmed in dump + `tests/batch9b1-witch-staff.test.ts` |
| Rule | PH Witch Staff progression |

### 9B.2 — Sentinel Frame — PASS (source + preferAuthored path)

| Check | Evidence |
|---|---|
| Authored L1–10 table | Restoration / Resolve Core / Healing / Special Negation slots match PH |
| Restoration PL 4/10/16, Range 8 m, bars 2/6/10 | Authored rows + batch9b2 |
| Resolve pools / Healing / Special Negation | `useAuthoredLevelProgression: true`; tree builder / export / action-economy honor flag |
| **Audit note** | Inventory dump **must** pass `preferAuthored`; pick-derived table alone is wrong |

### 9B.3 — Serpent Scales — PASS

| Check | Evidence |
|---|---|
| Evade Buff PL 4/10/16 → +8/+20/+32 | `ab-evade` |
| Flight 6/15/24 m | unchanged MATCH |
| Agility Evade Support Rank 2/3/4 | unchanged MATCH |
| No Mobility Extension substitutes | `extend-buff-mobility` removed from L5/L8 |

### 9C — Oracle Frame / Oracle Field — COMPLETE (9C.1 + 9C.2)

| Item | Status |
|---|---|
| **9C.1 Oracle Field → Active Buff Armor Self +8/+20/+32** | **PASS** (`ab-armor`, Self only; batch9c1) |
| Influence Stone Pool | OK / unchanged |
| **9C.2 Enemy Evade Reduction Support Rank 2/3/4** | **PASS** — `influence.enemyEvadeReduction` as Oracle Evade Reduction I–III (batch9c2) |
| Cleanse mis-assignment | **Removed** from L2/5/8 |

Batch 9C is closed in source definitions. Packs/actors still need rebuild/resync.

### 9D — General Artifacts (11) — PASS with carve-outs

Verified remaps (Compatibility + Core): Frost Throw Instant Special Slow; Ivaldi's Anvil Weapon AoE; Shadowgrave Grave Call / Deathly Reprisal; Staff of the Dark Hex / Soulburn Instant Specials; Starfallen Force Reversal / Crystalized Root / Crystal Rain; Soul Sigil Uncanny Soul → `reaction-temp-hp`; L10 → universal Artifact Awakening.

| Carve-out | Status |
|---|---|
| Moonlight Shadow | DESIGN PENDING (still `ab-damage-aura`, playable) |
| Lor-Keth L1–9 | SOURCE MISSING (wiring retained) |
| Heart of Winter Frostwave Slow(9) vs shared Instant AoE Slow(7) | **Resolved in 9G.3:** Frostwave II = Melee AoE Special: Slow **PL 8** → Slow(7) / 5 m |
| Hunter's Scourge Maximization Support | Remains **APPROVED EXCEPTION** (Hand→Vitality; Compatibility Core-only note) |

### 9E — Remaining corrections — PASS

| Item | Status |
|---|---|
| Judicator Self Healing Support (`resolve.healing`, Self only) | MATCH |
| Stonebound Anchoring Stance → `ab-temp-hp` 32/77/122 | MATCH |
| Alchemist Stone → `empower-buff-damage` | MATCH |
| Tail Sweep ST Push + Weapon Damage | **APPROVED EXCEPTION** (PH approved Artifact Special Rule — **not** a rule conflict) |
| Rending Spiral II Lacerate(9) | MATCH |

---

## 5. Core-mechanic regression spot-check

Relevant focused suites (special-only, Limited, raises, AoE acquire, stone functions, tree builder, progression compiler) **passed** as part of the 243-test run.

No evidence in this audit that 9B–9E reintroduced:

- Special-only → damage leakage on corrected Witch / Frost Throw / Staff of the Dark paths
- Broken Limited resource accounting on Hunter Scourge Strike / Moonlight Judgment templates
- Active Buff single-slot regression on Oracle Field Armor / Serpent Evade / Alchemist potions (source-level)

**Caveat:** Playable retired auras (`ab-armor-aura`, `ab-damage-aura`) still execute if granted from packs/actors — that is an intentional DESIGN PENDING runtime risk, not a silent “fixed”.

---

## 6. Remaining true problems

### A. Runtime / rule MISMATCH (must fix before READY)

**None remaining in corrected Artifact source definitions after Batch 9C.2.**

### B. DESIGN PENDING (do not auto-fix; still playable)

| Artifact | Levels | Template | Risk |
|---|---|---|---|
| Dragon Head — Draconic Roar | 2 / 5 / 8 | `ab-armor-aura` | Retired Armor Aura still grantable |
| Moonlight Greatsword — Moonlight Shadow | 3 / 6 / 9 | `ab-damage-aura` | Retired Damage Aura still grantable |

### C. SOURCE MISSING

| Artifact | Levels | Note |
|---|---|---|
| Lor-Keth's Staff | 1–9 | No complete Compatibility / Canonical PH tree; retained executable wiring; L10 Awakening only aligned. **9G.4:** provenance confirmed SOURCE MISSING; reversible `newGrantHold` skips fresh world-library seeds only (see `BATCH9G4_LOR_KETH_PROVENANCE.md`) |

### D. Inherited UNRESOLVED (93)

Still **not** line-reverified against PH in 9F. Includes many stone-support rows that Phase A left UNRESOLVED. **Not silently MATCH.**

---

## 7. Open design decisions & missing sources

1. **Draconic Roar** redesign — DESIGN PENDING  
2. **Moonlight Shadow** redesign — DESIGN PENDING  
3. **Lor-Keth's Staff** full L1–9 — SOURCE MISSING  
4. ~~**Batch 9C remainder** — Enemy Evade Reduction Support~~ → **closed by 9C.2**

---

## 8. Source vs packs vs actors

| Layer | State after 9B–9E working tree |
|---|---|
| 1. Canonical Rulebooks | Updated in working tree for Oracle Field Armor + Tail Sweep approved-exception language |
| 2. Source definitions (`echo-artifacts*.ts`, `general-artifacts.ts`, ranks, compiler) | Corrections present **uncommitted** |
| 3. Generated trees (builder with preferAuthored) | Correct **when rebuilt from source** |
| 4. Compendium / `src/packs/echo-artifacts` | **STALE** — still contains `ab-armor-aura`, `influence.cleanse`, `vitality.damageMaximization` on Alchemist, `ab-immovable-temp-hp`, Mobility Extension / old Tail Sweep templates, etc. |
| 5. Embedded actor items | **Expect stale** until resync |
| 6. Runtime powers from packs/actors | **May still execute pre-correction effects** |

`ECHO_ARTIFACT_SEED_VERSION` remains **59** — no seed bump performed in 9F.

### Later required (do **not** run in 9F)

1. Pack rebuild for all corrected Echo artifacts  
2. World seed refresh / library tree rebuild (`seedVersion` bump)  
3. `resyncArtifactTreeToAllActors` / Artifact Resync  
4. Actor embedded-item repair for Witch Staff, Sentinel, Serpent, Oracle Field, Judicator, Stonebound, Alchemist, Dragon Claws, General 9D remaps  
5. Optional migration notes for renamed progression rows (e.g. Regeneration → Self Healing Support; Mobility Extension → Serpent Evasion)

---

## 9. Tests & integrity

| Suite | Result |
|---|---|
| `tests/batch9b1` … `batch9e` | **35/35 PASS** |
| Broader artifact/combat regressions (15 files) | **243/243 PASS** |
| `npx tsc --noEmit` | **PASS** |

Integrity observations (documentation only):

- No duplicate grant inventored beyond expected Predator Crown ×3 keys  
- Retired auras **still referenced** in source for DESIGN PENDING rows (expected)  
- Packs contain **orphan/stale** template IDs relative to corrected source  
- Sentinel correctness depends on `useAuthoredLevelProgression` propagation — verified in tree builder / export / action-economy paths  

---

## 10. Prioritized next steps

### P0

1. ~~**Finish Batch 9C** — Enemy Evade Reduction Support~~ → **done in 9C.2**.  
2. **Commit / release** verified 9B–9E + 9C source.  
3. **Pack rebuild + seed bump + actor resync** for all corrected artifacts so Foundry no longer serves pre-9B / pre-9C templates (Oracle packs still list `influence.cleanse` / `ab-armor-aura` until rebuild).

### P1

4. Decide / redesign **Draconic Roar** and **Moonlight Shadow**; until then keep grants non-purchasable or clearly retired in UI if product policy requires.  
5. Author Canonical / Compatibility L1–9 for **Lor-Keth's Staff** or remove unauthorized grants.  
6. Re-audit the **93 UNRESOLVED** rows with PH line checks (stone supports, Ringchain numerics, Predator stones, etc.).

### P2

7. Resolve documented 9D non-corrections (Heart of Winter Slow(9) vs shared table; one-hand damage base dice).  
8. Confirm world migration for renamed abilities / Ultimate → Awakening display strings.

### P3

9. Display-name polish (Single Restoration vs Sentinel Restoration labels).  
10. Remove temporary audit dump scripts under `scripts/_batch9f*` when no longer needed.

---

## Appendix A — Delta summary by correction batch (verified upgrades)

| Batch | Verified upgrades | Notes |
|---|---:|---|
| 9B.1 | 18 | Binding Circle + Main Spell ×3 traditions |
| 9B.2 | 9 | Full authored Sentinel table |
| 9B.3 | 3 | Serpent Evasion I–III |
| 9C.1 | 3 | Oracle Field Armor |
| 9D | 40 | Remaps + Awakening renames |
| 9E | 13 | Judicator / Stonebound / Alchemist / Tail Sweep / Spiral II |

## Appendix B — Remaining MISMATCH rows (complete)

**None after Batch 9C.2.** Former Oracle Aid rows:

| Artifact | Level | Was | Now | Status |
|---|---:|---|---|---|
| Oracle Frame | 2 | Oracle Aid I / `influence.cleanse` | Oracle Evade Reduction I / `influence.enemyEvadeReduction` Rank 2 | **MATCH** |
| Oracle Frame | 5 | Oracle Aid II / `influence.cleanse` | Oracle Evade Reduction II / `influence.enemyEvadeReduction` Rank 3 | **MATCH** |
| Oracle Frame | 8 | Oracle Aid III / `influence.cleanse` | Oracle Evade Reduction III / `influence.enemyEvadeReduction` Rank 4 | **MATCH** |

## Appendix C — Method notes

- Phase A matrix parsed: **327** rows.  
- Current inventory regenerated with `preferAuthored` for Sentinel Frame.  
- Merge tool: `scripts/_batch9f-merge.mjs`.  
- Ability renames (e.g. Mobility Extension → Serpent Evasion, Regeneration Support → Self Healing Support, old Witch Overdrive rows → Binding Circle / Main Spell) produce `MISSING_IN_PHASE_A` join keys; those were reclassified only when a 9B–9E override verified the new row.

---

**End of Batch 9F.** No further automated corrections, rebuilds, migrations, commits, or deploys were performed. Awaiting freigabe.
