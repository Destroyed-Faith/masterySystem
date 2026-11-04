# Batch 9C.2 — Oracle Frame Enemy Evade Reduction

**Date:** 2026-11-04  
**Mode:** Source correction on `main` (no pack rebuild, actor resync, commit, or deploy)  
**Closes:** The three Batch-9F MISMATCH rows for Oracle Frame L2 / L5 / L8

## Rule reference

- PH Oracle Frame progression (~2561 / 2564 / 2567): **Oracle Evade Reduction I–III** = Influence Ability: Enemy Evade Reduction (Stone Power Support, Rank 2 / 3 / 4); lower ranks still paid.
- PH Influence Stone Abilities (~4493 / 4499): Enemy Evade Reduction −1/−2/−4/−8 Evade vs owner's attacks only.
- Runtime catalogue id: `influence.enemyEvadeReduction` in `src/stones/stone-powers.ts` (existing; not invented).

## Changes

| Level | Before | After |
|---:|---|---|
| 2 | Oracle Aid I → `influence.cleanse` | Oracle Evade Reduction I → `influence.enemyEvadeReduction` Rank 2 |
| 5 | Oracle Aid II → `influence.cleanse` | Oracle Evade Reduction II → `influence.enemyEvadeReduction` Rank 3 |
| 8 | Oracle Aid III → `influence.cleanse` | Oracle Evade Reduction III → `influence.enemyEvadeReduction` Rank 4 |

File: `src/utils/echo-artifacts.ts` (`ORACLE_FRAME` pick spec + authored rows).

Unchanged: Oracle Field `ab-armor` +8/+20/+32 Self; Influence Core pool 2/4/8; Artifact Awakening; no `ab-armor-aura`.

## Status vs Batch 9F

| Row | 9F status | 9C.2 status | Evidence |
|---|---|---|---|
| Oracle Frame L2 | MISMATCH | **MATCH** | PH ~2561; pick `influence.enemyEvadeReduction`; prefill 2 |
| Oracle Frame L5 | MISMATCH | **MATCH** | PH ~2564; prefill 3 |
| Oracle Frame L8 | MISMATCH | **MATCH** | PH ~2567; prefill 4 |

`influence.cleanse` no longer granted on these three slots. Lower ranks remain payment-required via normal Stone Support pipeline (`getArtifactStoneSupportPrefill`).

## Tests

- `tests/batch9c2-oracle-evade-reduction.test.ts` — new
- Updated: `tests/echo-artifact-tree-builder.test.ts` (Oracle pick expectation)
- Regression: batch9c1, batch9b1–9e, artifact-stone-functions — **PASS**
- `npx tsc --noEmit` — **PASS**

## Remaining (out of scope)

- Packs / embedded actors still stale until rebuild + resync
- DESIGN PENDING: Draconic Roar, Moonlight Shadow
- SOURCE MISSING: Lor-Keth's Staff L1–9
