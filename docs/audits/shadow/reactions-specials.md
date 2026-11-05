# Shadow Report — Reactions / Specials / Special Increase

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T07:24:14.500Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 3 |
| Cases equal (legacy === identity) | 2 |
| Cases diverging | 1 |
| Approved exceptions (documented) | 2 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `reaction`: total=2, mismatches=1, sites=reaction.specialIncreaseMatch
- `specials`: total=1, mismatches=0, sites=specials.resolveByName

## Cases

- **special-increase-substring**: legacy=`true` identity=`false` equal=false — approved C1 — legacy substring includes("slow") on "slowed"; identity exact id only
- **special-increase-exact**: legacy=`true` identity=`true` equal=true
- **specials-resolve-slow**: legacy=`"slow"` identity=`"slow"` equal=true — display name equals catalog id shape for Slow

## Approved exceptions

- special-increase-substring
- approved C1

## Unexplained

- none
