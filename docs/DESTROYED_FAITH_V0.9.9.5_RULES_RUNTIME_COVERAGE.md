# Destroyed Faith v0.9.9.5 – Rules-to-Runtime Coverage Matrix

Stand: 2026-10-17. Regelquellen eingefroren unter `docs/Rules/` (alle sieben Dateien vorhanden; `movement.md` = **v0.9.9.5 (2026-10-16)**).

**Statuswerte:** VERIFIED · RESOLVER_ONLY · DATA_ONLY · PARTIAL · MISSING · MANUAL_CHECK · NOT_VERIFIABLE · EXCLUDED

**Hinweis:** Ein Katalog-/Name-Audit (`docs/catalog-audit.json`) belegt nur Identitäten und Tabellenzeilen, keine Laufzeitwirkung. `VERIFIED` verlangt einen automatisierten Test der Resolver-/Event-Kette mit Zustandsänderung.

Testlauf dieser Verifikation: `npx tsc --noEmit` Exit 0; `npx vitest run` → **2739** bestanden, **0** fehlgeschlagen, **249** Dateien.

---

## Zusammenfassung nach Bereich

| Bereich | Mechaniken (dedupliziert) | VERIFIED | RESOLVER_ONLY | DATA_ONLY | PARTIAL | MISSING | EXCLUDED | MANUAL_CHECK |
|--------|---------------------------:|---------:|--------------:|----------:|--------:|--------:|---------:|-------------:|
| Core Combat | 36 | 24 | 5 | 0 | 5 | 0 | 2 | 0 |
| Stones (32 Abilities + Subsysteme) | 38 | 28 | 4 | 0 | 6 | 0 | 0 | 0 |
| Actives (Template-Identitäten) | 64 | 4 | 8 | 20 | 30 | 2 | 0 | 0 |
| Active Buffs | 29 | 6 | 4 | 8 | 11 | 0 | 0 | 0 |
| Passives | 59 | 6 | 8 | 25 | 20 | 0 | 0 | 0 |
| Reactions | 22 | 3 | 5 | 6 | 8 | 0 | 0 | 0 |
| Movement Powers + Economy | 14 | 12 | 1 | 0 | 1 | 0 | 0 | 2 |
| Artifacts / Echo | 18 | 8 | 4 | 3 | 3 | 0 | 0 | 0 |
| Character Creation / Progression | 16 | 10 | 2 | 1 | 3 | 0 | 0 | 0 |
| **Gesamt** | **296** | **101** | **41** | **63** | **87** | **2** | **2** | **2** |

Doppelzählungen vermieden: z. B. Damage Transfer einmal unter Actives/Core; Special Aura einmal unter Passives; Flee unter Movement/Core nur einmal in Movement Economy.

---

## 4.1 Core Combat

| Identität | Regelquelle | Code / Einstieg | Resolver | Test | Status | Einschränkung |
|-----------|-------------|-----------------|----------|------|--------|---------------|
| Dice pools / Keep / TN | PG Dice / Pool | `roll-handler`, `pool-finalize`, sheets | `masteryRoll`, `finalizeRolledPool` | `v099-core`, `pool-reduction`, `p0-integration` | VERIFIED | Kein Foundry-Chat-E2E |
| Attribute Contests | PG Contests | `opposed` helpers, contests | `compareContestResults` | `opposed-attribute-contest` | VERIFIED | |
| Skill Checks | PG Skills | sheet / `roll-context-build` | `masteryRoll` | `skill-roll-pool-display`, `npc-skill-pool` | VERIFIED | |
| Attack Rolls | PG Attack | Radial → `attack-executor` → `attack-roll-handler` | `executeAttackRollFromCard` | `p0-integration`, `attack-resolution-wait` | PARTIAL | Vollständiger Chat-Button-Pfad nur teilweise |
| Casting Rolls (Active-as-Spell) | PG Magic | gleiche Attack-Card mit `tnKind: casting` | TN + fizzle in handler | `spell-roll-handler` (math), `df-core-0991-parity` | PARTIAL | `rollSpell()` tot; Blood Raises nicht im Core 0.9.9.5 |
| Critical | PG Crit | Attack card `data-use-crit` | `critical-resolution` | `critical-resolution`, `p0-integration` | VERIFIED | |
| Raises | PG Raises | Card + raise hooks | `raise-resolution` | `raise-resolution`, `p0-integration` | VERIFIED | Chat-UI dünn |
| Damage Rolls / Resolution | PG Damage seq. | `damage-dialog` | `applyDamageToTarget` | `damage-transfer`, `rules-runtime-integration-0995` | VERIFIED | Dialog-UI Canvas |
| Armor / Penetration | PG Step 13 | `damage-mitigation` | `applyDefensiveMitigation` | `damage-mitigation`, integration | VERIFIED | |
| Damage Reduction (ceil remaining) | PG Step 14 | `damage-mitigation` | same | `damage-mitigation`, integration | VERIFIED | Post-Audit-Fix |
| Damage Negation | PG | `damage-negation` in apply path | prompt + spend | `damage-negation-npc` | RESOLVER_ONLY | Prompt Canvas |
| Temporary HP | PG Step 16 | applyDamageToTarget | health.tempHP | heal/damage tests, integration | VERIFIED | |
| Health Bars / Scars | PG Health | calculations + apply | bar updates | `heal-resolution`, `p0-0995-acceptance` | VERIFIED | |
| Healing (current bar) | PG Healing | heal chat / stones | `applyHealHpAcrossOpenBars` | `heal-resolution` | VERIFIED | |
| Death Checks | PG Death | `module.ts` updateCombat | `maybeRollDeathCheck` | `death-check.test.ts` | VERIFIED | Hook→Funktion nicht als Hook gemockt |
| Last Breath | PG | `applyDamageToTarget` | `maybeApplyLastBreath` | `last-breath.test.ts` | VERIFIED | Dialog Canvas |
| Initiative + Tiebreaker | PG | `initiative-roll`, sort patch | `compareInitiativeCombatants` | `initiative-order`, `p0-0995` | VERIFIED | |
| Initiative Exchange | PG Prep | stone dialog / colorless | colorless grant | stone/colorless tests | PARTIAL | UI Canvas |
| Surprise Priority | PG | attack card create | `applySurprisePriorityForAttack` | `surprise`, `p0-integration` | VERIFIED | |
| Action Economy | PG Actions | `action-economy`, hooks | spend/consume/reset | `p0-0995`, flee, stones | VERIFIED | |
| Turn / Round timing | PG Combat | `module.ts` updateCombat | ticks, pulse, reset | end-turn, aura-pulse, stone-hooks | PARTIAL | Multi-client |
| Specials apply / negation / recovery | PG Specials | damage-dialog, status-tick | `special-application`, ward | `special-application`, `special-summon-auras` | VERIFIED | |
| Threat Zones | Movement/PG | pre/updateToken | `planThreatZoneWindows` | `threat-zone`, movement tests | RESOLVER_ONLY | Live opener Canvas |
| Lacerate (movement) | PG Specials | `handleTokenMovement` | tracker | `movement-powers`, `movement-reduction` | VERIFIED | |
| Invisibility (0995 house) | PG + house | perception / profile | no attack reveal | `invisibility-*`, `rules-0995-core` | VERIFIED | |
| Perception / Combat Senses | PG | gate on targeting | `evaluatePerceptionGate` | `combat-senses`, `rules-0995-core` | VERIFIED | |
| Damage Transfer | PG Step 18 | applyDamageToTarget | `settleDamageTransfer` | `damage-transfer`, integration | VERIFIED | Instance-Ids in-memory |
| Absorption | PG Step 19 | after scar | `grantAbsorptionForScarredBars` | `passive-triggers` | RESOLVER_ONLY | |
| Split Attack | PG | `openSplitPair` | executor | `p0-integration`, `split-attack` | PARTIAL | Dialog |
| Autofire | PG/Actives | autofire module | card path | thin | PARTIAL | |
| Fear (combat track) | PG | — | — | — | EXCLUDED | P1.4 |
| Falling Damage | PG/Movement | — | — | — | EXCLUDED | P1.5 |

---

## 4.2 Stones (32 Abilities)

Registry: `src/stones/stone-powers.ts`. Lifecycle: `stone-hooks` + `armDefensiveStoneExpiry` / `releaseDefensiveStoneExpiry`.

| ID | Dauer (Core) | Effektpfad | Test | Status |
|----|--------------|------------|------|--------|
| generic.extraAttack / Movement / Reaction / movementEnhancement | Round | roundState | stone-powers, v099-stone-ranks | VERIFIED |
| might.meleeDamage | This turn | clear at spotlight | stone-powers | VERIFIED |
| might.armor | Next own turn | defensive arm/release | defensive-stone-duration, integration | VERIFIED |
| might.armorReduction | Round | armorPenetration | stone-powers | VERIFIED |
| might.parry | Next own turn | defensive | defensive-stone-duration | VERIFIED |
| agility.crit | Round | crit bank | critical / stone | VERIFIED |
| agility.evade | Next own turn | defensive | defensive-stone-duration | VERIFIED |
| agility.safeMovement | Flag | pending safe | agility-stone-movement | PARTIAL |
| agility.invisibilityBoost | Round | invis profile | invisibility tests | VERIFIED |
| vitality.tempHp | Until depleted/combat end | health.tempHP | stone-powers | VERIFIED |
| vitality.damageNegation | Next own turn | defensive | defensive-stone-duration | VERIFIED |
| vitality.removeScar | Sealed / rest | remove-scar | stone-powers | RESOLVER_ONLY |
| vitality.damageMaximization | Once/combat | prep gate | stone-powers | VERIFIED |
| intellect.rangeAoe / raises / specialBoost | Round | bonuses | stone-powers | VERIFIED |
| intellect.spellResistance | Next own turn | defensive + getTargetSpellResistance | defensive-stone-duration | VERIFIED |
| resolve.healing | Instant queue | pendingHeal | — | PARTIAL |
| resolve.activeBuffEmpowerment | Round | buff PL | stone-powers | RESOLVER_ONLY |
| resolve.damageReduction | Next own turn | DR% | defensive + mitigation | VERIFIED |
| resolve.ward | Next own turn | special negation | defensive-stone-duration | VERIFIED |
| influence.cleanse | Instant | cleanse | cleanse-resolution | VERIFIED |
| influence.colorlessRecovery | Once/combat designation | colorless-recovery | colorless-recovery | VERIFIED |
| influence.enemyEvadeReduction | Round | evade cut | stone-powers | VERIFIED |
| influence.notATarget | Until next own turn (flag) | stone-combat-effects | — | PARTIAL |
| wits.initiativeBoost | Once/combat | colorless | stone / colorless | VERIFIED |
| wits.phasing | Once/combat charges | phasing | phasing tests | VERIFIED |
| wits.reactionDenial | Round | flag | — | PARTIAL |
| wits.movementReduction | Round | movement-allowance | movement-reduction | VERIFIED |
| Colorless Recovery subsystem | — | colorless-recovery | colorless-recovery | VERIFIED |
| Defensive expiry timing | PG Stone Abilities | stone-hooks | defensive-stone-duration, p0-integration | VERIFIED |
| Stone payment ranks | PG | spendStoneAbility | v099-stone-ranks, stone-payment-rules | VERIFIED |

---

## 4.3 Actives (64 templates)

Katalog: `ACTIVE_TEMPLATES` (64) → expandiert ~112 Picker-Einträge. PL 1–16 via `buildLevels`. Name-Audit: `catalog-rules-audit` / `catalog-audit.json` (**DATA_ONLY**).

| Cluster | Beispiele | Runtime | Status |
|---------|-----------|---------|--------|
| Damage Transfer | melee/ranged transfer | applyDamageToTarget | VERIFIED |
| ST damage / AoE damage families | melee/ranged ST & AoE | attack card → damage | PARTIAL |
| Autofire | ranged weapon autofire | autofire | PARTIAL |
| Heal / Cleanse / Restoration | utility targeting | heal/cleanse resolvers | PARTIAL / VERIFIED cleanse |
| Forced movement control | pull/push actives | forced-movement from damage | RESOLVER_ONLY |
| Persistent Special Zones | ranged-zone-t* | spell-zones | PARTIAL |
| Barriers / Walls / Illusions / Mental | barrier, illusion, mental-* | generic spell/attack | DATA_ONLY → PARTIAL |
| Dispel actives | dispel-magic specials | **kein dedizierter Dispel-Resolver** | MISSING |
| Constructs / Summon delivery | summon-related actives | summon-bond | PARTIAL |

---

## 4.4 Active Buffs (29)

| Identität | Runtime | Test | Status |
|-----------|---------|------|--------|
| ab-damage-aura / ab-healing-aura | `pulseActiveBuffAuras` turn end | special-summon-auras | VERIFIED |
| ab-summon-damage-aura / ab-summon-armor-aura | aura-modifiers in damage | special-summon-auras, integration | VERIFIED |
| ab-armor / ab-evade / ab-temp-hp / ab-damage-reduction | ActiveEffect mechanics → snapshot | combat-snapshot, rules-v098 | PARTIAL |
| ab-invisibility | invisibility-profile | invisibility-profile | PARTIAL |
| ab-growth-form | growth-form | growth-form | RESOLVER_ONLY |
| Remaining buffs | activateActiveBuff slots/duration | active-buff-round-limit | PARTIAL / DATA_ONLY |

---

## 4.5 Passives (59 exported)

| Identität | Runtime | Test | Status |
|-----------|---------|------|--------|
| passive-special-aura | getActiveSpecialValue +1 | special-summon-auras | VERIFIED |
| Fortitude / Absorption curves | templates + absorption | rules-0995-core, passive-triggers | VERIFIED (curves) / RESOLVER_ONLY (absorption) |
| Armor / Evade / DR / Negation / Parry passives | derived combat stats | combat-stats-passives, power-mechanics | PARTIAL |
| Telepathy / narrative passives | sheet text | — | DATA_ONLY |
| Initiative passives | initiative path | initiative tests | PARTIAL |
| Phasing passive | phasing | phasing | PARTIAL |

---

## 4.6 Reactions (22)

| Cluster | Runtime | Test | Status |
|---------|---------|------|--------|
| Defense reactions (armor/evade/temp HP/DR/phasing) | reaction-window-chat | reaction-flow, evade-negate | PARTIAL |
| Ally protection | reaction eligibility | reaction-eligibility | RESOLVER_ONLY |
| Counter / Riposte / Reflection | damage-dialog branches | thin | PARTIAL |
| Reposition | traversal reaction | forced/reaction flags | PARTIAL |
| Catalog PL tables | reaction.ts curves | catalog audit | DATA_ONLY |

---

## 4.7 Movement

| Identität | PL 1–16 | Runtime | Test | Status |
|-----------|---------|---------|------|--------|
| Ground Dash | Book distances | executeMovementPower | movement-powers, integration (book arrays) | VERIFIED |
| Safe Movement | Book | safe traversal + threat suppress | movement-powers, integration | VERIFIED |
| Teleport | Book | teleport + guidance | movement-powers | VERIFIED + MANUAL_CHECK vision |
| Teleport with Ally | PL1 unavailable | guided → `resolveTeleportAllyForGuidedMove` → execute | integration + movement-powers | VERIFIED |
| Flight / Leap / Wall Walk / Burrow / Phase Passage | Book; PL1 Phase unavailable | execute + guidance confirms | movement-powers | VERIFIED + MANUAL_CHECK height/material |
| Trample | Dist + dice book | path damage | movement-powers | VERIFIED |
| Movement Enhancement / Reduction | Core | movement-allowance | movement-reduction, integration | VERIFIED |
| Token-drag gate (Flee/MP) | — | token-move-gate | token-move-gate, integration | VERIFIED |
| Flee + Pursuit | Core | flee.ts, pursuit.ts | flee-pursuit | VERIFIED (Pursuit GM) |
| Disengage / Move / Dash | Core | guided + ordinary drag | movement-reduction | VERIFIED |

---

## 4.8 Artifacts / Echo

| Mechanik | Code | Test | Status |
|----------|------|------|--------|
| Binding / capacity 4 / slots | artifact-actor-rules | general-artifacts, echo-artifacts | VERIFIED |
| Levels vs MR gate | artifact-actor-rules | general-artifacts | VERIFIED |
| Base values → combat | artifact-base-values | echo-artifact-tree-builder | VERIFIED |
| Stone battery / refresh / support | artifact-stone-functions | artifact-stone-functions | VERIFIED |
| Summon token generator 4:1 | summon-bond-rules | summon-bond-workflow | VERIFIED |
| Radial artifact powers | artifact-options | thin | RESOLVER_ONLY |
| Awakening L10 | artifact-awakening | — | PARTIAL |
| Echo catalog completeness | echo-artifacts | echo-artifacts | DATA_ONLY + VERIFIED trees |
| Per-artifact power E2E | — | — | PARTIAL / NOT_VERIFIABLE individually |

---

## 4.9 Character Creation / Progression

| Mechanik | Code | Test | Status |
|----------|------|------|--------|
| Attributes / starting array / compression | v099-rules | v099-core | VERIFIED |
| Lifetime XP → permanent stones | v099-rules, stone-pool-sync | v099-pool-sync, lifetime-xp | VERIFIED |
| Mastery Rank sync | mastery-rank-sync | v099-core | VERIFIED |
| Respec / migration | v099-respec-* | v099-respec-flow | VERIFIED |
| Tower Wizard packages / echo / validation | creation/tower-wizard | tower-wizard-* | VERIFIED |
| Character print | character-print | character-print-* | VERIFIED |
| Skill hub / redistribute | skill-point-pool | scattered | PARTIAL |
| Minor Expressions / Disadvantages | UI + data | minor-expressions | PARTIAL |
| Narrative-only choices | — | — | DATA_ONLY |

---

## Katalog-PL-Nachweis

| Katalog | Identitäten | PL 1–16 | Unabhängige Erwartungstests |
|---------|------------:|:-------:|------------------------------|
| Movement | 10 | Ja | `rules-runtime-integration-0995` (Ground Dash, Safe, Teleport, Trample dice) |
| Active Buffs Summon/Special Aura | 3 | Ja | `special-summon-auras` printed arrays |
| Passives Fortitude/Absorption | curves | Ja | `rules-0995-core` |
| Actives/Reactions bulk | 64 / 22 | Ja in templates | Name-Audit only (**DATA_ONLY** Wirkung) |

---

## Explizit nicht gezählt als Fehler dieses Auftrags

- **Fear** (EXCLUDED / P1.4)
- **Falling Damage** (EXCLUDED / P1.5)
- Rein narrative Regeltexte ohne Runtime-Bedarf

---

## Nachtrag 2026-10-17 (Canvas fixes, R-01–R-03, Fear P1.4)

**Hinweis:** Die Tabellen und Statuswerte oben bleiben die Verifikations-Momentaufnahme vom Final Runtime Verification-Lauf; dieser Abschnitt ergänzt nur.

| Thema | Runtime | Tests (Typ) | Regelwerk |
|-------|---------|-------------|-----------|
| R-01 DN ohne Half-Pool | `damage-negation.ts`, `damage-dialog.ts` | `canvas-r01-r02-r03`, `damage-negation-npc` — **unit/integration** | Pending — `DESTROYED_FAITH_PENDING_RULE_CHANGES.md` |
| R-02 Maximization Damage+Heal | `stone-powers.ts`, `stone-combat-effects.ts`, `heal-resolution.ts` | `canvas-r01-r02-r03` — **unit/integration** | Pending |
| R-03 Threatened Spellcasting | `threatened-ranged.ts`, `attack-executor.ts` | `canvas-r01-r02-r03`, `threatened-ranged-hostility` — **unit/integration**; reach placement — **Canvas-only** | Pending |
| Fear P1.4 | `fear.ts`, `pool-finalize.ts`, `safe-haven-rest.ts` | `fear.test.ts`, `safe-haven-rest.test.ts` — **unit/integration** | Core-Fear-Absatz; EXCLUDED-Zeile oben historisch |
| Canvas fix bundle | siehe `DESTROYED_FAITH_V0.9.9.5_CANVAS_TEST_FIXES.md` | 2769 / 252 (full suite 2026-10-17) | Canvas-Abnahme manuell |

Offizielle `docs/Rules/*` wurden nicht editiert.
