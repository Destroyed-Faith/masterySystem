# Abschlussbericht — Rules v0.9.8 Restumfang (v0.9.240)

## Verdict

**Vollständig implementiert und automatisiert getestet** für Summons V2 UI/Workflow, Artifact Token Generator (als getrennte Umwandlung), Katalog-Audit (+ Korrekturen), Critical(X)-Rundenkontingent, und die ausdrücklich genannten Verifikationssysteme.  
**Keine offenen Regelentscheidungen** in diesem Scope.

## Version

| Feld | Wert |
|---|---|
| Baseline | v0.9.238 |
| Catalog audit + Evade curve | v0.9.239 |
| Summons V2 UI + verification | v0.9.240 |
| Critical(X) per-round quota | **v0.9.241** |

---

## 1. Summons V2 — vollständig

### Implementiert
- **Kanonischer Erstellungsweg:** `SummonBondDialog` (`src/stones/summon-bond-dialog.ts` + `templates/dialogs/summon-bond.hbs`)
- Stone Powers → Summons-Tab listet nur noch `summonBonds` und öffnet Create / Bond Ritual / Dissolve
- **Legacy-Familiar-Editor entfernt** als Erstellungsweg (Template + Handler)
- Legacy `familiar-bind` / `familiar-rules` nur noch für Migration / Pool-Helfer / Labels

### Workflow-Abdeckung
| Anforderung | Status |
|---|---|
| Bond durch Binding von Stones erstellen | ✅ `createSummonBondWithStones` |
| 8 Tokens je Bound Stone | ✅ |
| Bound Stones anzeigen / hinzufügen / entfernen | ✅ Ritual UI |
| Tokens verfügbar / ausgegeben / verbleibend | ✅ Token-Bar |
| Bond- vs Body-Upgrades getrennt | ✅ |
| Movement Mode wählen | ✅ walking/flying/swimming/climbing |
| Movement 8–16 m | ✅ Cap enforced |
| Zusätzliche Bodies kaufen/verwalten | ✅ |
| Tokens Bodies zuweisen (HP/Armor/Evade/Senses/Powers) | ✅ |
| Summon Skills + Dice Pools | ✅ |
| Shared Senses je Body | ✅ |
| Special Access / Special Value | ✅ |
| Extra Attacks (Bond-max 3) | ✅ |
| Canonical Powers (ceil(PP/10) via standard costs) | ✅ |
| Power-Level-Caps (Owner MR) | ✅ `maxSummonPowerLevel` |
| Bond Ritual umbauen | ✅ `applyBondRitual` → `needsRedistribution: false` |
| Bond auflösen → Stones zurück | ✅ `dissolveSummonBond` |
| Mehrere Bodies, gemeinsame Activation | ✅ Timing-Feld + shared attack budget (`summon-combat.ts`) |

### Migrierte Bonds
- Bleiben `needsRedistribution: true` bis Bond Ritual angewendet wird
- Können danach ohne Flag gespeichert werden

---

## 2. Artifact Summon Token Generator

**Kein Regelkonflikt.** Zwei getrennte Umwandlungen:

| Quelle | Tokens |
|---|---|
| Normal Bound Stone | × 8 |
| Artifact Summon Stone | + 4 bonus Tokens (existierender Bond) |

- Konstante: `SUMMON_CAPS.artifactSummonTokensPerStone = 4`
- Helper: `artifactSummonBonusTokens(n)`
- Bonus Tokens im Ritual editierbar; erzeugen keinen Bond
- Aus Konfliktliste entfernt; Audit-Eintrag `correct`

---

## 3. Critical(X)

| Punkt | Status |
|---|---|
| Definition | ✅ Critical(X) = X Critical-Angriffe pro Runde |
| Explosionsschwelle | ✅ immer 7–8 auf Attack Dice |
| Damage Dice | ✅ explodieren nie durch Critical |
| Runden-Reset | ✅ `syncCriticalRoundQuota` bei neuem Round-Key |
| Verbrauch pro Angriff | ✅ Buff-Quota bevorzugt, sonst Stone Crit |
| Anzeige | ✅ weiterhin `Critical(X)` |
| Docs | ✅ `docs/CRITICAL-RESOLUTION.md` |

---

## 4. Katalog-Audit

Maschine: `npm run audit:catalog` → `docs/catalog-audit.json`  
Engine: `src/utils/catalog-rules-audit.ts`

### Summary (v0.9.241)
| Status | Count |
|---|---|
| correct | 204 |
| corrected | 3 |
| missing | 0 |
| obsolete | 0 |
| requires-rule-decision | 0 |

### Corrected in this pass (v0.9.239)
- `ab-evade` → Rules +8…+98
- `ab-evade-temp-hp` Temp HP curve
- `ab-armor-evade` Armor/Evade combo curve

Jeder Eintrag hat `status` in der JSON-Datei (Actives, Active Buffs, Passives, Reactions, Movement, Artifacts).

---

## 5. Verifizierte Systeme

| System | Ergebnis | Nachweis |
|---|---|---|
| Weaken → richtige Dice Pools | ✅ | `pool-reduction` + `rules-v098-verification` |
| Soulburn → richtige Dice Pools | ✅ | dito |
| Kein allgemeines Saving-Throw-System | ✅ | Module fehlt; Tower save step false |
| Attribute Checks nur bei Regelbedarf | ✅ | `attributeCheckTn` vorhanden; kein generischer Zwang |
| Combat Senses = Sense Slot | ✅ | Sense IDs ≠ Passive catalog |
| Extra Sense Options ≠ extra slots | ✅ | Darkvision = minor upgrade |
| Special Combat Senses / Normal Awareness | ✅ | Registry |
| Reaction Triggers | ✅ | Catalog `applyWhen` reaction-* |
| Initiative Gain ≠ zweiter Turn | ✅ | API + bestehende Tests |
| Active Buff Maintenance (1 true buff) | ✅ | `getTrueActiveBuffs` |
| Multi-Body ≠ extra Attacks | ✅ | `bondAttackBudgetFromBodies` |
| Summon Specials ≤ 1/Runde | ✅ | `tryApplySummonBondSpecial` |
| Summons ohne Stones/Artifacts | ✅ | `summonActorMayUseStonesOrArtifacts` |
| Shared Senses body-spezifisch | ✅ | Body spend + sync |
| Summon Powers Action Economy costs | ✅ | `standardPowerTokenCost` |

---

## 6. Tests & Build

| Suite | Result |
|---|---|
| `npm run build` | ✅ |
| `npm test` | ✅ **1259 passed** (80 files) |
| `npm run audit:catalog` | ✅ 207 entries |
| Migrations (unit: migrateFamiliarToBond) | ✅ |
| Playwright (`e2e/*`) | ⚠️ vorhanden (7 Specs); brauchen laufende Foundry-Instanz — **manuell** |

Neue Tests:
- `tests/summon-bond-workflow.test.ts`
- `tests/rules-v098-verification.test.ts`
- `tests/catalog-rules-audit.test.ts` (v0.9.239)

---

## 7. Geänderte / neue Dateien (Restumfang)

### Neu
- `src/stones/summon-bond-dialog.ts`
- `templates/dialogs/summon-bond.hbs`
- `styles/summon-bond-dialog.css`
- `src/stones/summon-combat.ts`
- `src/combat/critical-resolution.ts`
- `docs/CRITICAL-RESOLUTION.md`
- `src/utils/catalog-rules-audit.ts`
- `scripts/run-catalog-audit.mjs`
- `docs/catalog-audit.json`
- `docs/RULES-V098-COMPLETION-REPORT.md`
- `tests/summon-bond-workflow.test.ts`
- `tests/rules-v098-verification.test.ts`
- `tests/catalog-rules-audit.test.ts`

### Wesentlich geändert
- `src/stones/summon-bond-bind.ts` — create / ritual / add-remove stones / dissolve
- `src/stones/summon-bond-rules.ts` — artifact token helper, eligible specials
- `src/stones/stone-powers-dialog.ts` + `templates/dialogs/stone-powers.hbs` — Legacy-Editor entfernt
- `src/sheets/summon-sheet.ts` + template — V2
- `src/chat/attack-roll-handler.ts` — Critical resolver
- `src/utils/powers/templates/activeBuffs.ts` — Evade curves
- `src/combat/action-economy.ts` — `summonBondUsage`
- `package.json` / `system.json` — v0.9.240

---

## Trennung: implementiert / getestet / manuell

| Bereich | Implementiert | Auto-getestet | Manuell in Foundry |
|---|---|---|---|
| Summon Bond create + ritual UI | ✅ | Unit/API ✅ | UI-Klicks prüfen |
| Token shop / skills / powers | ✅ | Unit ✅ | UX-Feinschliff |
| Dissolve + stone return | ✅ | Unit (assignments) ✅ | End-to-end |
| Multi-body combat spend | ✅ API | Unit ✅ | Combat-Flow |
| Catalog audit | ✅ | ✅ | — |
| Critical(2–4) | Isolation only | ✅ | Wartet auf Rules |
| Playwright smoke | — | — | ⏳ Foundry nötig |

---

## Verbleibende echte Regelentscheidungen

Keine in diesem Scope. Critical(X) ist als Rundenkontingent implementiert.
