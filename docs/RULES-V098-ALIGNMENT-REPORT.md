# Abschlussbericht — Rules v0.9.8 Alignment (v0.9.238)

## Summary

Foundry Mastery System aligned to DF Rules v0.9.8 for combat foundations, Critical wire-up, catalog corrections, save purge, and Summons V2 data model + migration. Delivered on `main` as **v0.9.238**.

## Changes by block

### Block 0 — Foundations
- Default `combat.speed` **6 → 8** (`template.json`, NPC sheet, reset, encounter generator, radial, movement tracker, actor Slow).
- `BASE_SPEED_M = 8` in `src/utils/constants.ts`.
- Types: `SummonBondRecord`, `SummonBodyRecord`, `SummonBondLink`; character `summonBonds[]`.
- Migration: `src/migrations/speed-8m-migration.ts`.

### Block 1 — Combat core
- Active Buff Critical → attack explode-on-7–8 (`getActiveBuffCriticalTier` + attack-roll-handler).
- Movement Power replaces normal Move (`spendMovementPowerAction`, radial hides move/dash, token-action-selector).
- Root: start-of-turn − Mastery Rank (`status-tick.ts`); special-effects text updated.
- Save purge: condition `saveTypes` cleared; Tower `packageNeedsWeakenSaveStep` always false; deleted `dist/utils/saving-throws.*`.
- Skill category label Awareness → **Perception**.

### Block 2–3 — Summons V2
- New: `summon-bond-rules.ts`, `summon-bond-bind.ts`, `summon-v2-migration.ts`.
- Factory: `buildSummonActorDataFromBond` / `createSummonActorForBondBody`.
- Stone Powers dialog bind path writes `summonBonds` and clears legacy `familiars`.
- Legacy familiar bind still used as UI draft bridge; bonds marked `needsRedistribution: true`.

### Block 4 — Catalogs
- Active Buff Armor/Evade: **+5, +9, … +65**.
- Summon Damage/Armor Aura radii: **8 / 16 / 24 / 32 m** bands.
- Removed Awareness/Heightened Senses passives from catalog export.
- Bound Host remains bonus-token Passive (no chassis).

### Block 5 — Artifacts
- No code change to Artifact Summon Token Generator: `artefacts.md` still lists **4 Tokens per Artifact Summon Stone** (bonus tokens, not Bound Stones). Documented as conflict below.
- Crit remains Stone-Tier prefill only.

## Data migrations
| Migration | Effect |
|---|---|
| `speed8mMigrationRun` | Actors/phases with `speed === 6` → 8 |
| `summonV2MigrationRun` | `familiars[]` → `summonBonds[]` stubs; tokens unspent for redistrib |

## Removed / deprecated
- Awareness passives in catalog
- Saving-throw dist orphans / condition Body-Mind-Spirit save types
- Familiar chassis as canonical model (`familiars` cleared after V2 bind)

## Tests
- New: `tests/summon-bond-rules.test.ts`, `tests/rules-v098-combat-core.test.ts`
- Updated: data-model speed 8, skills Perception, armor curve expectations
- **Result:** `npm test` — **1209 passed**; `npm run build` — OK

## Open conflicts / uncertainties
1. **Critical(2–4):** Grant path implemented; resolution for tiers >1 not defined in PG/agent beyond Crit(1)=explode 7–8. Implemented: any Critical ≥ 1 → explode 7–8 for all attacks while buff lasts.
2. **Artifact Summon Token Generator** (`artefacts.md`): 1 Artifact Summon Stone → **4** Tokens. Summon Bound Stones use **×8**. Left as written in artefacts.md (specific artifact subsystem).
3. **Summon UI:** Full Bond Ritual token shop / skill picker / power purchase UI is partially bridged (bind creates V2 bond + needsRedistribution). Legacy familiar editor still present as entry UI.
4. **Full power-catalog row audit** vs every Rules table line not exhaustively automated; Armor/Evade/Summon Aura/Awareness were priority fixes.

## Manual Foundry checks
- [ ] Create character: Speed shows 8 m
- [ ] Activate Active Buff: Critical L4+ → attack dice explode on 7–8
- [ ] Use a Movement Power → Move/Dash unavailable that round
- [ ] Apply Root(5) on MR 2 creature → start of turn Root(3)
- [ ] Bind a Summon via Stone Powers → `summonBonds` entry with 8×stones Tokens, redistribution note
- [ ] Existing world: confirm speed/summon migrations run once for GM
- [ ] Confirm Awareness passives no longer appear in power catalog picker
