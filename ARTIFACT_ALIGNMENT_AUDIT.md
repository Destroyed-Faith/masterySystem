# Artifact Alignment Audit — 2026-10-25 (pre-live consistency check)

**Catalogue sync:** `docs/Rules/artefacts.md` from  
`docs/Rules/_incoming/Destroyed_Faith_Artefacts_v0.9.9.5_corrected_2026-10-25.txt`  
Version stamp: **v0.9.9.5 (2026-10-25)**.

**Echo authority:** `docs/Rules/players-guide.md` (DF Core v0.9.9.5).

**Seed:** `ECHO_ARTIFACT_SEED_VERSION = 57`  
(Bumped from 56 so Actors already stamped at 56 still receive Breath Bite / Roar / Damage Buff catalogue embeds.)

**Echo Artifacts verified:** **22** registry keys (Predator Crown / Witch Staff variants counted separately).

> **Do not revert — Active Buff: Damage rebalance (2026-10-25):**  
> Canonical curve is **+1d8 per Power Level** at **30 PP / +1d8** (PL4 = +4d8, PL10 = +10d8, PL16 = +16d8).  
> Obsolete +3d8…+33d8 / +5 PP overspend curve must **not** be restored by Artifact alignment pack rebuilds or catalogue sync.  
> Red Hunt / Red Potion inherit `ab-damage`. Damage Aura / Allied / Summon Damage Aura / Armor / Stone Abilities are out of scope for that correction.

---

## Pre-live consistency checklist

| # | Issue | Result |
|---|--------|--------|
| 1 | Dragon Breath Bite on Damage Breath (implementation + report) | **PASS** |
| 2 | Seed 57 + migration refreshes seed-56 Actors | **PASS** |
| 3 | Draconic Roar vs Armor Aura | **PASS** (resolved — catalogue applied; see below) |
| 4 | Active Buff: Damage PL4/10/16 = +4/+10/+16d8 in pipeline | **PASS** |
| 5 | Rebuild / tests / GM import path | **PASS** (after this build) |
| — | Live world Actor / Token writes | **Not applied** — GM-controlled only |

---

## Summary

| Area | Status |
|------|--------|
| Catalogue sync (`artefacts.md`) | **PASS** |
| Moonlight Greatsword mapping + Limited / Shadow runtime | **PASS** |
| Titan Scars Growth combat (footprint, reach, Growth Bars) | **PASS** (runtime helpers + activation) |
| Hollow Crown Deathless Body / Life Absorption caps | **PASS** (penalty shift + cap helpers; Life Absorption out-of-combat drain UI still GM-mediated) |
| Primal Vestment → Primal Rage (2) Disadvantage | **PASS** |
| All Echo L10 → Artifact Awakening | **PASS** |
| Dragon Head Breath (Bite on Damage; Ruin no damage; shared uses; Might/Agility) | **PASS** |
| Draconic Roar vs Armor Aura numerics | **PASS** (catalogue applied; Core text synced) |
| Echo catalog-backed numeric stages (Armor / d8 / radius) | **PASS** (`tests/artifact-alignment-numeric-echo.test.ts`) |
| Active Buff: Damage rebalance in combat rider path | **PASS** |
| Pack build (`npm run build:packs`) | **PASS** (243 source docs) |
| Migration dry-run (fixtures incl. seed 56) | **PASS** (no live world writes) |
| Live world Actor migration | **Not applied** — GM-controlled step below |
| Stone-authored / Core-override effect prose (non-catalog numbers) | **PARTIAL** — presence + Awakening verified; not every Stone-support prose digit re-parsed vs Core markdown |

---

## 1. Dragon Breath — verified implementation

**Code:** `dragonHeadDamageBreath` keeps Bite on Instant AoE (`martialWeaponDamageApplies`, `attack-executor`, `damage-dialog`, radial Damage Breath options). Ruin sets `ignoreWeaponDamage` / no forced Bite.

| Mode | Damage | Attribute | Uses |
|------|--------|-----------|------|
| **Damage Breath** | Bite Weapon Damage + printed Melee AoE Power Dice (shared pool) | Might **or** Agility | Shared 1/Combat + ceil(MR/2)/SHR |
| **Ruin Breath** | None — Ruin(X) only | Might **or** Agility | Same shared counters |

**Scurry @ Dragon Head Level 3 (stage I):**

| Component | Dice |
|-----------|------|
| Bite | **3d8** |
| Power (PL 4 Melee AoE) | **4d8** |
| Shared pool | **7d8** (`3d8+4d8`) |
| + Active Buff: Damage PL4 (when legally active) | **+4d8** → **11d8** total eligible |

Covered by `tests/dragon-head-breath-bite.test.ts` and Active Buff Damage rebalance tests.

---

## 2. Seed version and migration

| Item | Detail |
|------|--------|
| Previous | `ECHO_ARTIFACT_SEED_VERSION = 56` — Actors at 56 were skipped |
| Current | **`57`** |
| Comparison | `seed < 57` → refresh (includes previous **56**) |
| Content path | Apply calls `seedArtifactLibrary()` → rebuilds world trees on seed mismatch → `pushWorldArtifactNodeToEmbeddedActors` |
| Actor stamp | After apply, embed `flags.mastery-system.seedVersion = 57` (idempotent) |
| Dry-run | Lists `wouldUpdate` with `previousSeed`; **no writes** |

Fixtures tested: older seed (50) and **seedVersion 56** both queue; current seed 57 skips.

---

## 3. Draconic Roar — how the conflict was resolved

| Source | PL 4 | PL 10 | PL 16 |
|--------|------|-------|-------|
| **Canonical Active Buff: Armor Aura** | **+4 Armor**, 8 m | **+10 Armor**, 20 m | **+16 Armor**, 32 m |
| **Stale Core effect text (before fix)** | +12 Armor, 8 m | +28 Armor, 20 m | +44 Armor, 32 m |

Both sides already referenced `Active Buff: Armor Aura (PL 4/10/16)`.  
**No approved Artifact-specific Armor exception** (unlike Damage Breath Bite).

**Resolution (not invented):** Apply catalogue. Runtime/`ab-armor-aura` already used +4/+10/+16. Core `players-guide.md` Roar (and Oracle Field) effect text corrected to those catalogue values. **Not UNRESOLVED** — discrepancy was stale Core restatement of the pre-calibration Armor Aura curve.

---

## 4. Active Buff: Damage

| PL | Rider |
|----|-------|
| 4 | **+4d8** |
| 10 | **+10d8** |
| 16 | **+16d8** |

Template `ab-damage`, `resolvePowerMechanics` (catalog preferred over baked legacy), damage-dialog `activeBuffDamageRolled` from `damageRider`, Red Hunt / Red Potion via same template. Scurry PL4 Buff + L3 Breath → 11d8 as above.

---

## PASS / FAIL / UNRESOLVED per Artifact

| Artifact | Mapping | Numeric (catalog stages) | Runtime | Result |
|----------|:-------:|:------------------------:|:-------:|:------:|
| Moonlight Greatsword (General) | L1–10 vs artefacts.md | N/A (General) | Judgment Limited 2/5/8; Shadow ceil(MR/2); Awakening | **PASS** |
| Stonebound Soles | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Elorian Stride | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Ringchain of Kept Names | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Oracle Frame | L1–10 / Awakening | **PASS** (Field +1/+3/+5) | Canonical templates | **PASS** |
| Sentinel / Judicator Frames | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Titan Scars | Growth Transformation Core | **PASS** (catalog slots) | Growth bars, reach, uses, Awakening | **PASS** |
| Wyrm Scales (Heavy) / Serpent Scales | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Dragon Head | Melee AoE + Bite / Ruin | **PASS** (Roar +4/+10/+16) | Shared Breath; Bite on Damage only | **PASS** |
| Dragon Claws | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Predator Crown (Might/Wits/Intellect) | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Primal Vestment | L2/3/5/6/8/9/10 only | **PASS** (no catalog power stages) | Primal Rage grant | **PASS** |
| Witch Staffs (Root/Ruin/Blight) | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Alchemist Coat | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Green Warden Mantle | L1–10 / Awakening | **PASS** | Canonical templates | **PASS** |
| Hunter's Scourge | L1–10 / Awakening | **PASS** | Limited Strike uses | **PASS** |
| Hollow Crown | Deathless / Absorption / Stillness / Awakening | **PASS** | Penalty shift; Absorption caps | **PASS** (Absorption UI still Stone tools) |

---

## Test commands

```
npx vitest run tests/artifact-alignment-moonlight-titan.test.ts `
  tests/artifact-alignment-echo-l10-breath.test.ts `
  tests/artifact-alignment-numeric-echo.test.ts `
  tests/artifact-alignment-runtime.test.ts `
  tests/echo-artifacts.test.ts `
  tests/artifact-radial-options.test.ts `
  tests/dragon-head-breath-bite.test.ts `
  tests/active-buff-damage-rebalance-2026-10-25.test.ts
```

Also: `npm run build` then `npm run build:packs`.

---

## Exact GM procedure — apply to live Foundry world

**Do not run this until you have a backup.** This agent does **not** modify live Actors or unlinked Tokens.

### 1. Backup

1. Close active combat.
2. Export or duplicate world Actors at least: **Lor-Keth**, **Alaris**, **Scurry**, **Oda**.
3. Optional: File → Export for the whole world, or copy the world folder.

### 2. Install system build

1. Deploy this system build (`dist/`, `packs/echo-artifacts`).
2. Reload Foundry / refresh the game.
3. Confirm file exists: `systems/mastery-system/dist/migrations/artifact-alignment-2026-10-25.js`.

### 3. Dry-run (GM console, F12)

Preferred (API):

```js
const report = await game.masterySystem.runArtifactAlignmentMigration({ dryRun: true });
console.table(report.wouldUpdate);
console.log(report);
```

Equivalent direct import (deployed path):

```js
const { runArtifactAlignmentMigration } = await import(
  '/systems/mastery-system/dist/migrations/artifact-alignment-2026-10-25.js'
);
const report = await runArtifactAlignmentMigration({ dryRun: true });
console.table(report.wouldUpdate);
console.log(report);
```

Expect `seedVersion: 57`. Review `wouldUpdate` (`actorId`, `itemId`, `key`, `level`, `previousSeed`). Actors previously at **56** must appear.

### 4. Apply (only after dry-run looks right)

```js
const applied = await game.masterySystem.runArtifactAlignmentMigration({ dryRun: false });
console.log(applied);
```

Or the same `import` path with `{ dryRun: false }`.

This:

1. Runs `seedArtifactLibrary()` — rebuilds world Echo/General trees whose seed ≠ 57 and pushes `system` to embedded Actor copies.
2. Stamps Actor / unlinked-token Artifact embeds to `seedVersion: 57`.
3. Preserves Item IDs, Artifact Levels, XP, equipment, custom names.

Optional: also run `game.masterySystem.resyncPowers()` so owned **Active Buff: Damage** items bake +4d8…+16d8.

### 5. Unlinked Tokens

Migration scans `scene.tokens` for `actor.isToken`. After apply, spot-check any unlinked Dragonborn / Titan / Moonlight tokens on open scenes. If a token was missed (rare), re-place from the Actor or re-run apply after opening the scene.

### 6. Spot-check

1. **Lor-Keth** — Titan Scars L2: Growth is Transformation (not Armor/TempHP buff).
2. **Alaris** — Moonlight: Judgment Limited Ranged AoE Spell; Shadow uses ceil(MR/2).
3. **Scurry (Dragon Head L3)** — Damage Breath shared pool **3d8 Bite + 4d8 Power**; with Active Buff: Damage PL4 → **+4d8** (11d8); Might or Agility; Damage/Ruin share once/Combat; Ruin deals no damage; Draconic Roar (when unlocked) = Armor Aura **+4/+10/+16**.
4. **Beast with Primal Vestment** — Primal Rage (2) under Disadvantages.
5. Echo Artifacts library — Hollow Crown + Primal Vestment present; seed **57**.

### 7. If a sheet still shows stale text

Toggle world setting **Refresh Artifact Library**, or:

```js
await game.masterySystem.refreshEchoArtifacts();
```

Then re-open the Actor sheet.

---

## Remaining blockers (non-blocking for migration)

1. Life Absorption interactive drain UI — still GM-mediated via Stone tools.
2. Hollow Stillness Advantage wiring — playtest when those checks fire.
3. Primal Rage auto Resolve check on 2nd+ Health Level loss — playtest in combat.

---

## Files touched this consistency pass

- `src/artifacts/echo-artifact-tree-builder.ts` — seed **57**
- `src/migrations/artifact-alignment-2026-10-25.ts` — library refresh + seed-56 refresh
- `src/module.ts` — `game.masterySystem.runArtifactAlignmentMigration`
- `tests/dragon-head-breath-bite.test.ts` — Scurry L3 7d8 / 11d8
- `tests/artifact-alignment-runtime.test.ts` — seed 56 + 57 fixtures
- `tests/active-buff-damage-rebalance-2026-10-25.test.ts` — Breath pipeline rider
- `docs/Rules/players-guide.md` — Roar / Oracle Field catalogue Armor (prior fix)
- This audit file — contradictions removed

Do not treat unchecked live-world play as PASS until the GM apply step above is done.
