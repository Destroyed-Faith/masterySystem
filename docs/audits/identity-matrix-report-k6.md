# Identity-Matrix Report (K6 final — all ranks 1–16)

Generated: 2026-11-05T07:24:14.565Z

## Coverage

- Templates: 197 (movement=10, reaction=22, activeBuff=50, passive=37, active=78)
- Cells (template × rank 1–16): 3152 · defined: 3152 · undefined: 0
- Resolved by id: 3152 · failures: 0
- Mechanics cells compared (by-id = catalog = legacy with templateId): 3152 · legacy mismatches: 0
- Specials cells with structured keys: 1093 · templates with specialSlot: 32
- Limited templates (catalog flag ↔ LIMITED_ID_SET consistent): 4 (active-melee-limited-single, active-ranged-limited-single, active-melee-limited-aoe, active-ranged-limited-aoe)
- Artifact rows with identity checked: 66 · failures: 0

## Routing dual-run

- Dual-run cells (all categories × defined ranks): 3152
- Active templates: 78
- Segment mismatches (active, legacy≠identity): 336 cells across 21 templates
- Rank-inconsistent templates (mismatch differs by rank): 0
- Documented exceptions (explicit): 13 · unexplained: 0
- activeBuff/movement legacy routing mismatches: 0

## Segment mismatches by template (same for every rank unless listed under rank-inconsistent)

- `active-melee-single-cleanse`: identity=utility legacy=attack (subfamily=support-cleanse roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-ranged-single-cleanse`: identity=utility legacy=attack (subfamily=support-cleanse roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-melee-aoe-cleanse`: identity=utility legacy=attack (subfamily=support-cleanse roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-ranged-aoe-cleanse`: identity=utility legacy=attack (subfamily=support-cleanse roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-melee-single-dispel`: identity=utility legacy=attack (subfamily=support-dispel roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-ranged-single-dispel`: identity=utility legacy=attack (subfamily=support-dispel roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-melee-aoe-dispel`: identity=utility legacy=attack (subfamily=support-dispel roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-ranged-aoe-dispel`: identity=utility legacy=attack (subfamily=support-dispel roll=none) — C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)
- `active-ranged-barrier`: identity=utility legacy=attack (subfamily=barrier roll=none) — C1 — deriveActiveSegment uses roll.kind/subfamily; legacy getSegmentIdForOption defaults actives to attack. C2.a must adopt identity.
- `active-ranged-illusion-image`: identity=utility legacy=attack (subfamily=illusion roll=none) — C1 — illusion roll.kind none → utility; legacy attack. C2.a.
- `active-melee-single-heal`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-ranged-single-heal`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-melee-health-level-heal`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-ranged-health-level-heal`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-melee-aoe-restoration`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-ranged-aoe-restoration`: identity=utility legacy=attack (subfamily=support-heal roll=none) — C1 — support-heal → utility; legacy attack. C2.a/e.
- `active-cleanse-absorption`: identity=utility legacy=attack (subfamily=support-cleanse roll=none) — C1 — support-cleanse → utility; legacy attack. C2.a/e.
- `active-mental-attack`: identity=utility legacy=attack (subfamily=mental roll=none) — C1 — mental roll.kind none → utility; legacy attack. C2.a decision needed.
- `active-mind-illusion`: identity=utility legacy=attack (subfamily=mental roll=none) — C1 — mental → utility; legacy attack. C2.a.
- `active-mind-probe`: identity=utility legacy=attack (subfamily=mental roll=none) — C1 — mental → utility; legacy attack. C2.a.
- `active-mental-control`: identity=utility legacy=attack (subfamily=mental roll=none) — C1 — mental → utility; legacy attack. C2.a.

## Notes

- Identity path is shadow-only in C1; legacy decides. Mismatches above are the C2.a work list, not bugs fixed here.
- `isSanctionedDR` / Phasing and heal/cleanse/limited classifiers are covered by `tests/power-identity-contract.test.ts` and the K5 shadow sites; this matrix asserts catalog↔id consistency of mechanics, limited flags and special keys.
