# K0–K9 Targeted Corrections Report

**Date:** 2026-11-05  
**Basis:** Independent K0–K9 audit verdict **PARTIAL**  
**Scope:** Confirmed code findings only. No gameplay redesign, no architectural refactor, no world
migrations, no Forge deploy/push, no W2 rule changes, no Archify regeneration.

---

## Verdict

**Confirmed code findings resolved.** Remaining items are GM decisions and live-runtime verification.

---

## P1 — Production safety (`seedArtifactLibrary`)

### Overwrite map (what a refresh changes)

| Surface | Written fields | Preserved |
|---|---|---|
| World library node | `name`, `img`, **entire `system`**, flags `nodeId` / `parentIds` / `childIds` / `echoArtifactKey` / `seedVersion` / optional `echoBound` / `isRoot` | Document `_id`, folder; root `actorLevels` |
| Embedded actor copy (matched by `evolutionRootItemId` + `evolutionNodeId`) | `name`, `img`, **entire `system`** (levelProgression, progressionPicks, baseValues, …) | `_id`; flags `artifactActivated`, `equipment`, `evolutionRootItemId`, `evolutionNodeId` |

### Safety gate (implemented)

- World setting `holdArtifactLibraryAutoRefresh` — **default `true`**.
- When held, GM-ready `seedArtifactLibrary()` skips seedVersion-only stale upgrades and does **not**
  push to actors. Incomplete trees are still repaired. Manual **Refresh Artifact Library** uses
  `force: true` and bypasses the hold.
- Helper: `isArtifactLibraryAutoRefreshHeld()` in `src/utils/seed-artifact-library.ts`.

### R-20 diagnostic (read-only)

- Macro: `macros/r20-artifact-library-diagnostic.js`
- Downloads JSON: library keys, seedVersions, linked embeds that would be pushed, overwrite/preserve lists.
- **Never writes** world or actor documents. Do not run a refresh from this macro.

**Live verification still required:** paste/run R-20 on the Forge world before clearing the hold.

---

## P2 — K8 correctness

| ID | Fix | Files |
|---|---|---|
| **R1** | `titan-growth` returns `utility` before contract `activeBuff`; segment forced to `utility`. Existing Transformation combat-radial gameplay preserved until GM action-economy decision. Lor-Keth name holdout kept. | `artifact-options.ts`, `options.ts`, tests |
| **R2** | `TriggerOwner.templateId` collected from power / effect flags and passed to `isSanctionedPhasingName`. | `passive-triggers.ts` |
| **R3** | Shared predicates in `src/combat/reaction-kind.ts`; eligibility / pool / spend all call the same helpers. Reflection identity is exact `reaction-parry-reflection` (no `tid.includes('reflection')`). | `reaction-kind.ts`, eligibility, defender-reactions, reaction-window-chat, `parry.ts` re-exports |
| **R4** | Unknown / conflicting `templateId` → `console.warn`; by-id still wins (no silent name recovery while id is set). | `power-mechanics.ts` |
| **R5** | Moonlight Judgment name bridge only when `templateId` is absent; Limited AoE templateId still qualifies. | `attack-executor.ts` |

No new name-based heuristics. Canonical IDs and existing missing-ID bridges retained.

---

## P3 — Validation and documentation

| Item | Result |
|---|---|
| `npm run audit:dr-phasing` (G10) | **PASS** — sanction by catalog `templateId` + current display names |
| Power-item `system.templateId` Foundry-merge rollback (M7c) | **PASS** — `-=templateId` under merge semantics |
| K8 / K9 report claim corrections | §§14 / §8–9 updated |
| Architecture deviation | §D below |

---

## D — Plan §10.5 vs current identity-primary state

| Plan (§10.5) | Current tree |
|---|---|
| Hard cutover: ID-only + delete text fallback in the same commit | **Identity-primary** via `prefer: 'identity'` |
| No intermediate “ID-first with text fallback” | Explicit **pre-K9 missing-ID bridges** remain (allowlisted) and run only when identity is unresolved / absent |
| Fail-closed on missing ID | **Not enabled** (post-activation) |

This is an intentional, documented compatibility state until GM sign-off removes bridges after
world/pack verification. It is **not** the final ID-only architecture.

---

## Remaining GM decisions (not code)

1. **N1:** Clear `Hold Artifact Library Auto-Refresh` only after R-20 + world backup (or keep held forever and use manual refresh selectively).
2. **W1:** Lor-Keth Titan Scars vs `ab-armor-temp-hp`, and whether Titan Growth stays combat-radial Transformation or moves to Prep Active Buff.
3. **W2:** Draconic Roar / DR exclusivity — no runtime gate until approved.
4. **W5:** `echoBound` boolean vs echoKey string truthiness in `module.ts`.

## Remaining live runtime verification

1. Run R-20 on Forge; confirm stale seed counts and linked embeds.
2. Isolated world smoke: Limited, Breath Damage/Ruin, heal/cleanse, riposte repeat, Phasing combat-start with `passive-ghostform`, Armor buff, Titan Growth combat radial.
3. Explicit sign-off before deleting missing-ID bridges / enabling fail-closed-on-missing-ID.

---

## Quality gates (this correction pass)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| Full Vitest | **PASS** — 370 files / 3892 tests |
| `npm run build` | **PASS** (`0.9.829` working tree) |
| `npm run audit:dr-phasing` | **PASS** — 6/6 sanctioned, 0 violations |
| `npm run k9:audit` | **PASS** |
| `npm run audit:catalog` | **PASS** |
| World / Forge writes | **None** |
