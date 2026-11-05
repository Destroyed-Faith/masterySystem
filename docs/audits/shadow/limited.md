# Shadow Report — Limited

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T10:22:04.205Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 3 |
| Cases equal (legacy === identity) | 3 |
| Cases diverging | 0 |
| Approved exceptions (documented) | 0 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `limited`: total=2, mismatches=0, sites=limited.isLimitedAttackDeclaration
- `artifact`: total=0, mismatches=0, sites=(none)
- `executor`: total=0, mismatches=0, sites=(none)

## Cases

- **limited-template**: legacy=`true` identity=`true` equal=true
- **non-limited-template**: legacy=`false` identity=`false` equal=true
- **name-only-no-flag**: legacy=`false` identity=`false` equal=true — isLimitedAttackDeclaration ignores bare names; executor name heuristics are separate (C2.d)

## Approved exceptions

- (none)

## Unexplained

- none
