# Identity Matrix Report — 2026-11-04 (Batch B/C1)

Generated during ID-based combat resolver implementation.

## Scope

- `ALL_POWER_TEMPLATES` × ranks 1..16 via `resolvePowerIdentity({ kind: 'power-item' })`
- Freigegebene artifact source rows (Ringchain, Dragon Head breath, Titan Growth, Life Absorption, Awakening)
- Shadow sites: `radial.getSegmentIdForOption`, `limited.isLimitedAttackDeclaration`, `heal.isHealRadialOption`, `cleanse.isCleanseRadialOption`

## Results

| Check | Result |
|---|---|
| Catalog templates resolve (preflightCatalogTemplates) | PASS — 0 unresolved |
| Freigegebene artifact identities (14.1 / 14.2) | PASS |
| Artifact catalog blocking (invalid IDs) | PASS — 0 blocks |
| Artifact catalog missing IDs (other authored rows) | INFORMATIONAL — migration debt; disposition `manual` / informational |
| Shadow S1–S3 isolation | PASS |
| Full vitest suite | PASS — 3768 tests |

## Known shadow mismatches (expected until C2 complete)

- Options with `templateId` where legacy used `textSuggestsActiveBuff` (e.g. damage-transfer + "stance" in description): identity → `attack`, legacy (pre-C2.a) could → `active-buff`. After C2.a, items **with** `templateId` ignore text.
- Artifact rows without embedded IDs but with live catalog enrichment (`enrichArtifactRowIdentity`): identity and legacy converge when `echoArtifactKey` is present.

## Pack rebuild

**Not performed** (user mandate). Runtime enrichment from `ECHO_ARTIFACTS` / `GENERAL_ARTIFACTS` by `(echoArtifactKey, level)` supplies identity for radial options without rewriting pack JSON.
