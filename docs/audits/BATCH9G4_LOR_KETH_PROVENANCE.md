# Batch 9G.4 — Lor-Keth's Staff provenance & new-grant hold

**Date:** 2026-11-04  
**Mode:** Provenance research + minimal reversible seed gate on `main`. No pack rebuild, actor resync, redesign, or deletion.

## Verdict (plain language)

**No complete author-approved rule table for Lor-Keth's Staff L1–9 was found** in Canonical PH / Actives / Active_Buffs or in the supplied Compatibility Artifacts Catalogue. What exists in the repo is **executable code** (and older code revisions), not a dated rulebook source of truth.

Therefore **SOURCE MISSING: Lor-Keth's Staff L1–9** remains. L10 stays **universal Artifact Awakening**.

## 1. Source-location report

| Location | Kind | Lor-Keth L1–9 table? |
|---|---|---|
| `docs/Rules/Canonical/Players_Handbook.md` | Authoritative rules | **No** |
| `docs/Rules/Canonical/Actives.md` | Authoritative rules | **No** (shared templates only) |
| `docs/Rules/Canonical/Active_Buffs.md` | Authoritative rules | **No** |
| `docs/audits/Destroyed_Faith_Artifacts_Homebrewery_2026-11-04_Compatibility.txt` | Compatibility catalogue (10 General Artifacts) | **No entry for Lor-Keth** |
| `src/utils/general-artifacts.ts` | Executable catalog | **Yes — programmed picks** |
| Git `08ce284b` (2026-06-12, release 0.9.41) | First code introduction | Authored rows in TS (not a separate rules doc) |
| Git `3eb733c4` / `a48e3683` (2026-10-13) | Code remaps to catalog templates | Challenge + Armor Reaction picks |
| World packs / generated trees | Generated from code | Not authoritative |

**Distinction:** Commit messages and in-file comments historically treated the authored TS table as “from the rulebook,” but **no separate dated author-approved rules file** for Lor-Keth appears in this repository. Code values must **not** be inferred as Canonical.

## 2. What is currently programmed (code, not rules)

| Level | Ability | Technical wiring (current) |
|---:|---|---|
| 1 | Giant Shock Strike I | `active-melee-damage-t5` + Challenge |
| 2 | Ancestral Guard I | `reaction-armor` |
| 3 | Might Ignore Armor Support I | `might.armorReduction` Rank 2 |
| 4–9 | Stages II/III of the above | Same templates / Rank 3–4 |
| 10 | Artifact Awakening | Universal Core Awakening |

**Historical code (0.9.41) differed:** Shock(5/9/11) damage lines, Ancestor Guard +10/+26/+42 Armor, Ignore Armor support, L10 “Heart of the Storm Ancestors” Ultimate. Those authored numbers were later replaced by catalog picks; neither version is Canonical PH.

## 3. New-grant hold — what was safe to do

### Implemented (reversible, actor-safe)

- Flag: `newGrantHold: true` on `lorKethsStaff`
- Helpers: `isArtifactNewGrantHeld`, `shouldCreateNewWorldArtifactTree`
- `seedArtifactLibrary`: **skips creating a brand-new world tree** when no Lor-Keth items exist yet
- If a world tree **already exists**, refresh/upgrade paths remain available (definitions stay in `GENERAL_ARTIFACTS` / `buildAllGeneralArtifactTrees`)
- Definition, L1–10 progression, lookups, and combat wiring **unchanged** for owners

### Not implemented (uncertain / multi-path risk)

Full actor-side bind/drag/import blocking was **not** added. Paths include sidebar drag from an already-seeded library, character import batches, and attunement of already-embedded items. A hard `preCreateItem` block could interfere with legitimate re-imports of characters who already own Lor-Keth. Per batch rules: **STOP rather than risk actor data** on those surfaces.

**Consequence:** Worlds that already contain a Lor-Keth General Artifacts library can still hand the item out. Fresh worlds / empty libraries will not auto-seed it until the hold is lifted.

## 4. Existing Actor data

- No Actor Items deleted, rewritten, or stripped
- No resync / migration run
- Owners keep current abilities and Awakening

## 5. Tests

- `tests/batch9g4-lor-keth-provenance.test.ts`
- Plus general-artifact regressions / `npx tsc --noEmit`

## 6. What final approval still needs

1. Author (or recover) a **complete dated L1–9 rules table** into Canonical PH and/or Compatibility Catalogue  
2. Compare that table to current code and decide keep / remap / redesign  
3. Remove `newGrantHold` once approved  
4. Optionally add actor-level new-bind guards after a dedicated import/drag audit  
5. Then pack rebuild + seed bump + actor resync as a separate deployment batch  

**Do not invent Challenge values, extra damage, or a unique Ultimate while SOURCE MISSING.**
