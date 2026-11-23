# Identity-Matrix Report (K6 final — all ranks 1–16)

Generated: 2026-11-23T12:17:41.119Z

## Coverage

- Templates: 170 (movement=10, reaction=23, activeBuff=52, passive=37, active=48)
- Cells (template × rank 1–16): 2720 · defined: 2720 · undefined: 0
- Resolved by id: 2720 · failures: 0
- Mechanics cells compared (by-id = catalog = legacy with templateId): 2720 · legacy mismatches: 0
- Specials cells with structured keys: 682 · templates with specialSlot: 20
- Limited templates (catalog flag ↔ LIMITED_ID_SET consistent): 4 (active-melee-limited-single, active-ranged-limited-single, active-melee-limited-aoe, active-ranged-limited-aoe)
- Artifact rows with identity checked: 66 · failures: 0

## Routing dual-run

- Dual-run cells (all categories × defined ranks): 2720
- Active templates: 48
- Segment mismatches (active, legacy≠identity): 0 cells across 0 templates
- Rank-inconsistent templates (mismatch differs by rank): 0
- Documented exceptions (explicit): 9 · unexplained: 0
- activeBuff/movement legacy routing mismatches: 0

## Segment mismatches by template (same for every rank unless listed under rank-inconsistent)


## Notes

- Identity path is shadow-only in C1; legacy decides. Mismatches above are the C2.a work list, not bugs fixed here.
- `isSanctionedDR` / Phasing and heal/cleanse/limited classifiers are covered by `tests/power-identity-contract.test.ts` and the K5 shadow sites; this matrix asserts catalog↔id consistency of mechanics, limited flags and special keys.
