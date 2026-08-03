# Asset rights verification checklist

Do **not** invent licensing grants. Binding public terms live in:

- [`LICENSE.md`](../LICENSE.md)
- [`ASSET-LICENSE.md`](../ASSET-LICENSE.md)
- [`MEDIA-AND-COMMUNITY-POLICY.md`](../MEDIA-AND-COMMUNITY-POLICY.md)
- [`THIRD-PARTY-NOTICES.md`](../THIRD-PARTY-NOTICES.md)

Confirm the following before any broader redistribution or relicensing.

## Code and game system

- [ ] `LICENSE.md` remains the binding statement for the proprietary source-available core
- [ ] No third-party code was copied under an incompatible license without attribution/file headers
- [ ] `THIRD-PARTY-NOTICES.md` stays accurate for development tooling and runtime references

## Rule text

- [ ] `Rules/` and in-game rule strings are owned / cleared for the project’s published terms
- [ ] External SRD or third-party rule excerpts (if any) are identified and licensed separately

## Commissioned / third-party artwork

Credits currently listed in `README.md` / `ASSET-LICENSE.md`:

- Character art — Jesús Bey
- World map — Pena Negra
- Full-page art — Dzmitry Zasimovich

For each asset under `assets/` (and any logos/banners):

- [ ] Commission contract or license on file (usage: Foundry system, marketing, print)
- [ ] Commercial vs non-commercial scope documented
- [ ] Modification / cropping rights documented
- [ ] Credit line matches the agreement
- [ ] Stock/AI/third-party icons (if used) have redistributable licenses recorded

## Fonts and external hosts

- [ ] Google Fonts families referenced from `styles/df-rulebook-ui.css` verified
- [ ] Laviossa Forge CDN font referenced from `styles/mastery-themes.css` verified

## Foundry / engine defaults

- [ ] References to core Foundry icons (`icons/svg/…`) remain runtime core assets, not redistributed as project stock

## Release packaging

- [ ] Player ZIP only includes assets the project may distribute under the published terms
- [ ] Internal mockups, unlicensed drafts, and personal exports stay out of `assets/` and out of releases
