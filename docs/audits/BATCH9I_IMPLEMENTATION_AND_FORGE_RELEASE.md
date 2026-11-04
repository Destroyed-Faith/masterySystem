# Batch 9I — Implementation & Forge Release

**Date:** 2026-11-04  
**Module version:** `0.9.824`  
**Branch:** `main`  
**Inputs:** `Destroyed_Faith_Aura_x1_and_Moonlight_Sundered_Rulebooks_2026-11-04.zip`  
(`Active_Buffs_FULL_Auras_x1_2026-11-04.md`, `Artifacts_FULL_Moonlight_Sundered_2026-11-04.md`)

## Verdict

Printed ×1.0 Special Aura tables and Moonlight Shadow → Sundered Aura are synchronized in Canonical rulebooks and runtime. Frostwave / Draconic Roar / Lor-Keth / prior Batch 9B–9G corrections preserved. No actor/world destructive migration.

---

## 1. Files changed (primary)

### Rulebooks
- `docs/Rules/Canonical/Active_Buffs.md` — Special Auras section + ×1.0 pricing; Invisibility TN without Stealth Points
- `docs/Rules/Canonical/Players_Handbook.md` — Moonlight Shadow clarification; Aura playtest notice; Frostwave block retained
- `docs/audits/Destroyed_Faith_Artifacts_Homebrewery_2026-11-04_Compatibility.txt` — Moonlight Shadow rows → Sundered Aura
- `docs/Rules/_incoming_batch9i/*` — extracted authoritative input copies

### Runtime / catalogs
- `src/utils/powers/templates/activeBuffs.ts` — all 14 Special Aura PL 1–16 tables; Invisibility fluff
- `scripts/_special-aura-tables.json` — printed table source for tests/generators
- `src/utils/general-artifacts.ts` — Moonlight Shadow → `ab-sundered-aura` PL 4/10/16
- `src/utils/artifact-active-buffs.ts` — remove Moonlight Safe Haven use gate; bind Sundered Aura mechanics
- `src/combat/perception-gate.ts` — Invisibility TN = `(4×MR)+Bonus−(lost bars×MR)`; higher-of Stealth/Inv, never sum; no Stealth Points
- `src/artifacts/echo-artifact-tree-builder.ts` — `ECHO_ARTIFACT_SEED_VERSION` **59 → 60**

### Tests
- `tests/batch9i-aura-x1-moonlight-sundered.test.ts` (new)
- Updates: `batch8-z05-special-auras`, `batch9d`, `general-artifacts`, `artifact-alignment-moonlight-titan`, `batch5-c07-limited-powers`, `combat-senses`, `rules-0995-core`

### Packs / release metadata
- `src/packs/echo-artifacts/*` + `packs/echo-artifacts` rebuilt at seed **60**
- `package.json` / `system.json` / `CHANGELOG.md` → **0.9.824**

---

## 2. Rulebook tables taken over

All **14 Special Auras** from `Active_Buffs_FULL_Auras_x1_2026-11-04.md`:

| Aura | Notes |
|---|---|
| Blight, Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Root, Slow, Soulburn, Sundered, Weaken | Radius **2 m** PL1–8, **3 m** PL9–16 (where available) |
| Ruin | **Always 2 m**; never expands |

Pricing text: former **×2** moving-Aura surcharge removed; VTT stores printed ranks/radii only (no runtime PP calc).

**Moonlight Shadow** from `Artifacts_FULL_Moonlight_Sundered_2026-11-04.md`:

| Artifact Level | PL | Radius | Effect |
|---|---|---|---|
| 3 | 4 | 2 m | Sundered(4) |
| 6 | 10 | 3 m | Sundered(7) |
| 9 | 16 | 3 m | Sundered(10) |

No Safe Haven Rest use limit; normal Active Buff slot.

---

## 3. Runtime definitions adjusted

- Special Aura Active Buff templates match `_special-aura-tables.json` / Canonical tables exactly
- Moonlight progression pick: `ab-sundered-aura` (was `ab-damage-aura`)
- Artifact Active Buff activation snapshots Sundered Aura mechanics at staged PL
- Invisibility Perception TN aligned to PH (no Stealth Points in Inv TN)
- Draconic Roar: still `ab-armor-aura` +4/+10/+16 at PL 4/10/16 — **unchanged**
- Frostwave: Melee AoE Slow PL 4/8/16 — **unchanged** (Batch 9G.3)
- Lor-Keth: `newGrantHold: true` — **unchanged** (Batch 9G.4)

---

## 4. Tests

- `npx tsc --noEmit` — pass
- `npm test` — **350 files / 3733 tests** pass
- Focused: Batch 9I, Batch 8 Special Auras, Batch 9B–9G, Moonlight alignment, combat-senses / rules-0995 perception

---

## 5. Packs rebuilt

- `npm run build` + `npm run build:packs` → Echo Artifacts LevelDB + source JSON at seed **60**
- `npm run build:rules-journals` — Canonical → Foundry journals

General Artifacts (including Moonlight) are world-seeded via `seed-artifact-library` (not the Echo pack). Seed **60** triggers library refresh for stale copies without wiping actor inventories.

---

## 6. Seed versions

| Constant | Old | New |
|---|---|---|
| `ECHO_ARTIFACT_SEED_VERSION` | 59 | **60** |

---

## 7. Actor / world resync

**Not performed.** No destructive actor migration. Existing characters keep picks/inventories. Fresh world library seeds skip Lor-Keth (`newGrantHold`). Safe optional library refresh uses the existing seed-version path only.

---

## 8. Forge / GitHub release

Release workflow: version bump → commit → tag `v0.9.824` → push → GitHub Actions `Create Release` packages `mastery-system-0.9.824.zip` and publishes the GitHub Release that Foundry/Forge consume via `system.json` `manifest` / `download`.

Published module version: **0.9.824**  
GitHub Release: https://github.com/Destroyed-Faith/masterySystem/releases/tag/v0.9.824  
CI run: https://github.com/Destroyed-Faith/masterySystem/actions/runs/41894072562  
Download: `mastery-system-0.9.824.zip` (Forge/Foundry via `system.json` manifest).

---

## 9. Still open

- **Lor-Keth's Staff** — authoritative L1–9 source still missing (`BATCH9G4_LOR_KETH_PROVENANCE.md`); hold retained
- Live Foundry world verification of Aura radii / Moonlight Sundered after Forge update (manual)
- Homebrewery online copies should be republished from the Canonical / Compatibility texts when ready

**No further design changes in this batch.**
