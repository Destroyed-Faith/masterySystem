# DF 2026-10-23 Rules Migration Plan

**Authoritative source:** `docs/cursor-migration/Destroyed_Faith_Players_Guide_Editorial_Condensed_2026-10-23.md`  
**Master prompt:** `docs/cursor-migration/CURSOR_MASTER_MIGRATION_DESTROYED_FAITH_2026-10-23.md`  
**Baseline:** branch `main` @ `97543bea`, system `0.9.762`, Foundry compatibility `14`  
**Target schema:** `rulesSchemaVersion = 2026.10.23` (`DF_2026_RULES_SCHEMA_VERSION`)

## Repository facts (inventory 2026-10-23)

| Field | Value |
|---|---|
| Kind | Foundry **system** `mastery-system` (not module / not stand-alone web builder) |
| Version | **0.9.762** · Foundry **14** |
| Schema style | `template.json` + document classes — **no** Foundry DataModel |
| Actors | `character`, `npc`, `summon` |
| Builders | Guided = `src/creation/tower-wizard/`; “Quick” = same wizard `manualBuildMode` (no separate Quick module) |
| Tests | ~288 Vitest files under `tests/` + Playwright `e2e/` |

## Inventory (feature → current → required change)

| Feature | Current files | Required change | Risk | Tests | Status |
|---|---|---|---|---|---|
| Skill Raises / Specializations | `utils/skills.ts`, sheet, epic-roll, `skill-point-pool.ts`, `chat/skill-spend-handler.ts` | Free-named Specs + Fields; Raise table; retire skillPoints/Ratings | High | `df-2026-rules-core` | **A calc done**; live path still old catalog |
| Spell TN | `spell-roll-handler.ts`, `attack-executor.ts`, encounter-forge | PL×4 + SR + Paid Raises | High | spell + parity | **B wired** (`castingBaseTnForPowerLevel`) |
| Echo Imprints | `minor-expressions.ts` (36 live) | 28 catalogue + sheet/bar UI | High | core | **Catalog done**; UI still Minor Expressions |
| Rituals | `utils/rituals.ts`, `ritual-workshop-dialog.ts` | Universal 16 CORE_RITUALS; workshop swap | High | rituals | **TN/outcome done**; workshop still legacy list |
| Fear / Incapacitated | `combat/fear.ts`, health, `death-check.ts` | Wire `fear-health.ts`; **retire DeathCheck** | Med | core | Calcs done; DeathCheck still live |
| Social Combat | `system/social-combat.ts`, dialog | Retire → Social Challenges | Med | — | **Dialog gated**; module code remains |
| Pursuit | `combat/pursuit.ts`, `pursuit-dialog.ts`, `flee.ts` | Remove progress meter; keep Flee | Low | — | Pending |
| Retroactive Stealth | `perception-gate.ts`, `perception-state.ts` | Delete after-the-fact TN boost | Med | — | Pending |
| Summons | `stones/summon-bond-*.ts` | Closed 10 tasks + Spec scope mapping | Med | core caps | Caps done; UI mapping pending |
| Builders | `creation/tower-wizard/` | §2 order: Echo → Attr/Stones → Imprints → Specs → Powers | High | wizard | Pending |
| Actor migration | `migrations/df-2026-rules-migration.ts` + `module.ts` | legacySnapshot + schema stamp | High | `df-2026-migration` | **I hooked on load** |
| Localization | `lang/en.json`, `lang/de.json` | Labels/tooltips for Specs/Imprints/Rituals | Med | — | Pending |

### Live leftovers (severity severity)

- **Heavy:** `skillPoints` / `skillRating` / spend pools; `minorExpressions` bar; Attunement wording; DeathCheck  
- **Gated / partial:** Social Combat dialog; Spell TN (rewired); Ritual maths (rewired)  
- **Docs-only ghosts:** `skillReserve`, `echoDeck`, `DeathMark`, `Pursuit Progress` string  

### Already largely intact (preserve)

v0.9.9 Stones/slots/bonds, Restoration/R05, combat Free Raises (Intellect Stone), 6-bar Incapacitated, Mark + Sundered, migration harness (~20 one-shots).

## Legacy → new mapping (non-destructive)

| Legacy | New | Notes |
|---|---|---|
| Fixed Skill IDs + ratings | `system.specializations[]` | Archive old skills under `legacySnapshot.skills`; propose Specs for GM review |
| Skill Points / Reserve | Removed | Archive counters; no active refill |
| Minor Expressions | Echo Imprints | Map only clear equivalents (Mage Hand, Message, Arcane Spark, Catfall, Glamour…); else confirm |
| Echo Cards / Deck | Retired | Archive; keep Echo ancestry + Artifacts |
| Social Combat Setup Pool | Social Challenges | Archive UI state |
| Death Marks / Checks | Incapacitated only | Archive flags |
| Spell TN `(8×MR)−2` | PL×4 | Live roll path updated |
| Ritual known-list / MR TN | Universal 16 + Task TN | Catalogue replaced |

## Phase checklist

- [x] **A** Definition registry + pure calculators (`src/rules/*`)
- [x] **B** Spell TN PL×4 in roll/attack/encounter-forge path
- [x] **B** Skill check / opposition / passive / Fear floor / Scar engine wiring complete
- [x] **C** Echo / Artifact / Mark+Sundered regression pass
- [x] **D** Quick + Guided builders
- [x] **E** Ritual workshop UI on 16 Core Rituals
- [x] **F** Echo Imprint sheet/UI (replace Minor Expressions bar)
- [x] **G** Stealth opposition, Pursuit meter removal, Summon Spec mapping; Social Combat gated
- [x] **H** Health / Rest / Fear / XP Spec costs; DeathCheck execution path removed
- [x] **I** Actor migration + legacySnapshot (world-load hook) + GM review dialog
- [ ] **J** UX / localization / journals (PARTIAL — inline EN; lang JSON sync open)
- [x] **K** Full suite (`294` / `3177` PASS) + QA report
- [x] **L** Final audit / handoff — `DF_2026_ABSCHLUSSBERICHT.md`

## Progress log

| When | Note |
|---|---|
| 2026-10-23 | Package copied to `docs/cursor-migration/`. Extracted 28 Imprints + 16 Rituals JSON. Added `src/rules` calculators + `tests/df-2026-rules-core.test.ts` (18 pass). Spell Base TN switched to PL×4 in primary cast/attack paths. |
| 2026-10-23 | Ritual TN/outcome updated (Task Level×4, one final TN). Social Combat dialog hard-gated. DF 2026 actor migration hooked on world load with legacySnapshot. Encounter-forge spell TN uses PL×4. QA report started. |
| 2026-10-23 | **Abschluss:** Specs/Imprints/CORE_RITUALS live; Wizard early steps; Spend/Death/Pursuit-Meter retired; Mental-+4 generic removed; GM Review + Import/Export/Print; 3177 tests PASS. See `DF_2026_ABSCHLUSSBERICHT.md`. |
| 2026-10-23 | Full-repo inventory merged into this plan. Corrected dual-track note: `src/rules` **is** consumed by spell-roll-handler, rituals utils, and df-2026 migration (not zero imports). Next priority: Skill/Specialization live path + builder + DeathCheck retire. |

## Known blockers / decisions

- Mental Power +4 on Spell Base TN kept pending explicit Guide confirmation in condensed file.
- Full builder rewrite and actor sheet Spec UI are large; proceed iteratively without resetting live worlds.
- Existing characters must not be auto-converted to five Rank-2 Specs; migration offers review UI.
