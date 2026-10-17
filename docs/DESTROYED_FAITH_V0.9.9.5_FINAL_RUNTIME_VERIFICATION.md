# Destroyed Faith v0.9.9.5 – Final Runtime Verification

Stand: 2026-10-17.  
Abdeckungsmatrix: `docs/DESTROYED_FAITH_V0.9.9.5_RULES_RUNTIME_COVERAGE.md`.  
Regelquellen: sieben Dateien unter `docs/Rules/`, unverändert; `movement.md` = v0.9.9.5 (2026-10-16).

Kein Version Bump, kein Push, kein Tag in diesem Auftrag.

---

## A. Gesamtstatus

**Technisch weitgehend vollständig** für die beauftragten Kernkampf-, Stone-, Movement- und Progression-Pfade — mit klar benannten Lücken im langen Katalog-Schwanz und zwei bewusst ausgeschlossenen Paketen.

Begründung anhand der Matrix (~296 deduplizierte Mechaniken):

- **101 VERIFIED** inkl. Damage-Pipeline (Armor → Core-DR-Ceil → Temp HP → HP), Damage Transfer, Special/Summon Auras, zehn Movement Powers inkl. Teleport-with-Ally-Verdrahtung, Token-Drag-Gate, Flee/Pursuit, defensive Stone-Dauer, Death Checks, Colorless Recovery, Artifact-Kernregeln, v099-Progression.
- **41 RESOLVER_ONLY** / **87 PARTIAL**: vor allem Actives/Passives/Reactions jenseits der dedizierten Resolver und UI-Dialoge ohne Canvas.
- **63 DATA_ONLY**: Katalogzeilen und narrative Passives ohne eigenen Wirkungstest.
- **2 MISSING (in scope):** Dispel-Actives ohne dedizierten Runtime-Resolver.
- **2 EXCLUDED:** Fear, Falling Damage.

Ein grüner Vitest-Lauf belegt nur Getestetes. Foundry-Canvas bleibt manuell.

---

## B. Regelabdeckung

| Bereich | n | VERIFIED | RESOLVER_ONLY | DATA_ONLY | PARTIAL/MISSING | MANUAL |
|---------|--:|---------:|--------------:|----------:|----------------:|-------:|
| Core Combat | 36 | 24 | 5 | 0 | 5 / 0 | 0 |
| Stones | 38 | 28 | 4 | 0 | 6 / 0 | 0 |
| Actives | 64 | 4 | 8 | 20 | 30 / 2 | 0 |
| Active Buffs | 29 | 6 | 4 | 8 | 11 / 0 | 0 |
| Passives | 59 | 6 | 8 | 25 | 20 / 0 | 0 |
| Reactions | 22 | 3 | 5 | 6 | 8 / 0 | 0 |
| Movement | 14 | 12 | 1 | 0 | 1 / 0 | 2 |
| Artifacts | 18 | 8 | 4 | 3 | 3 / 0 | 0 |
| Progression | 16 | 10 | 2 | 1 | 3 / 0 | 0 |

Template-Inventur: Actives 64, Active Buffs 29, Passives 59, Reactions 22, Movement 10, Stones 32. Expanded Active-Picker ~112.

---

## C. Gefundene Implementierungsfehler

### C1. Teleport with Ally ohne Ally im Guided Path — behoben

- **Regel:** Movement: Teleport with Ally (willing ally within 2 m).
- **Ursache:** `executeMovementPower` verlangte `ally`, `attemptCommitMovement` übergab keines.
- **Korrektur:** `listTeleportAllyCandidates` + `resolveTeleportAllyForGuidedMove`; Aufruf in `token-action-selector.ts`. Ally-Ziel = gleiche relative Versetzung.
- **Test:** `tests/rules-runtime-integration-0995.test.ts` (Kandidaten + kompletter Execute).

### C2. Death Checks ohne Test — behoben (Nachweis)

- **Regel:** Death Checks bei Incapacitated.
- **Ursache:** Hook in `module.ts` vorhanden, kein Test.
- **Korrektur:** `tests/death-check.test.ts` für `maybeRollDeathCheck` / Stabilisierung.
- **Hinweis:** Hook-Aufruf selbst bleibt Canvas-/Hook-Integration.

### C3. Dispel-Actives — nicht behoben (MISSING)

- **Regel:** Dispel-Actives im Active-Katalog.
- **Code:** Special-Definition ohne Runtime-Flow in utility/cleanse/damage.
- **Arbeit:** eigenes Implementierungspaket; kein Platzhalter.

### C4. Blood-Raise-Pfad — kein Core-Fehler

- `rollSpell` / `applyBloodRaiseHpLoss` und `bloodRaises = 0` im Live-Handler.
- **Keine Treffer** für „Blood Raise“ in den sieben Regelquellen v0.9.9.5.
- Eingestuft als toter Altcode / NOT_VERIFIABLE gegen aktuelles Core — nicht als Regelverletzung „implementiert“.

### C5–C7 (bereits Post-Audit)

Token-Drag-Gate, Defensive-Stone-Dauer, DR-Ceil-Remaining — bestätigt durch Integrationstests; siehe `P1_POST_AUDIT_FIXES.md`.

---

## D. Tatsächlich geänderte Dateien

| Datei | Art |
|-------|-----|
| `src/combat/movement-powers.ts` | Ally-Picker + Guided-Resolve |
| `src/token-action-selector.ts` | Ally an `executeMovementPower` |
| `tests/rules-runtime-integration-0995.test.ts` | Cross-System Integration (neu) |
| `tests/death-check.test.ts` | Death Check (neu) |
| `docs/DESTROYED_FAITH_V0.9.9.5_RULES_RUNTIME_COVERAGE.md` | Matrix (neu) |
| `docs/DESTROYED_FAITH_V0.9.9.5_FINAL_RUNTIME_VERIFICATION.md` | dieser Bericht |
| `docs/DESTROYED_FAITH_V0.9.9.5_IMPLEMENTATION_PROGRESS.md` | Verweis aktualisiert |

Keine Änderungen an `docs/Rules/*`.

---

## E. Testresultate

| Lauf | Ergebnis |
|------|----------|
| `npx tsc --noEmit` | Exit **0** |
| Gezielt: `rules-runtime-integration-0995`, `death-check`, `movement-powers` | grün |
| `npx vitest run` | **2739** bestanden, **0** fehlgeschlagen, **249** Dateien |

Historische Vergleichsbasis (Abschluss-Audit): 2720 / 245.  
Zwischenstand Post-Audit-Fixes: 2728 / 247.  
Aktuell: **2739 / 249** (neue Integration + Death-Check + ggf. zuvor vorhandene Dateien).

Erwartungen in den neuen Movement-PL-Tests stammen aus gedruckten Tabellenarrays im Test, nicht aus dem Budget-Helper.

---

## F. Verbleibende technische Risiken

1. **Dispel-Actives** wählbar ohne Wirkung.
2. Langer **Active/Passive/Reaction**-Schwanz: generische Attack-/Spell-Pipeline, keine Power-für-Power-E2E-Tests.
3. **Threat-Zone-Opener** und Reaction-Fenster: Planner getestet, lebendes Chat-Fenster Canvas.
4. **Persistent Zones:** Speicherung/Entry getestet; Radial→Zone→Eintritt nicht als ein Test.
5. **Damage-Transfer-Instance-Ids** in-memory (Reload).
6. **Awakening / Artifact-Power-UI** unvollständig gegen Canvas.
7. **Doppelverarbeitung:** Token-Gate und autorisierte Updates getestet; Multi-Client-Hooks nicht.
8. Toter **Blood-Raise**-Code kann verwirren; nicht Core-relevant.

---

## G. Foundry-Canvas-Abnahme (priorisiert)

1. **P0:** Attack → Damage Chat → HP/Temp HP/Armor/DR sichtbar korrekt.  
2. **Stones:** Armor/Evade kaufen → fremder Zug → Bonus wirkt → eigener nächster Zug → Bonus weg.  
3. **Flee:** Radial → Overlay-Ziel (nicht Drag) → Movement+Attack weg, Lock. Drag während Führung blockiert.  
4. **Movement Powers:** je eine Nutzung Ground Dash, Safe, Teleport, Teleport with Ally (Ally-Dialog), Trample.  
5. **Threat / Lacerate:** Pfadbewegung öffnet Fenster; Safe unterdrückt Reaction, nicht Lacerate.  
6. **Summon Auras:** Buff aktiv, Summon in/out Radius, Damage-Chat zeigt Aura-Armor/Dice.  
7. **Death Check / Last Breath:** Incapacitated Turn-Ende; Last Breath Dialog.  
8. **Reactions:** Guard/Evade auf eingehenden Treffer.  
9. **Artifacts:** Equip, Stone Battery, ein Artifact-Power aus Radial.  
10. **Dispel:** bewusst als erwarteter Fail markieren, bis implementiert.

Vitest ≠ Canvas-Abnahme.

---

## H. Release-Einschätzung

1. **Sind die in diesem Auftrag enthaltenen Regeln nachweisbar verdrahtet?**  
   Ja für Kernkampf, Stones (inkl. defensiver Dauer), Movement (inkl. Drag-Gate und Ally-Teleport), Auren, Transfer, Progression und Artifact-Kern. Nein für Dispel-Actives und den ungetesteten Katalog-Schwanz; Fear/Falling ausgeschlossen.

2. **Gibt es in-scope Powers/Passives/Reactions/Artifacts nur als Katalogdaten?**  
   Ja — großer Teil der Actives/Passives/Reactions ist DATA_ONLY oder PARTIAL. Dispel ist MISSING. Artifacts haben Daten + Kernregeln; nicht jede Artifact-Power ist E2E belegt.

3. **Schwerwiegende Fehler in Damage, Stones, Action Economy, Combat Events, Movement?**  
   Keine offenen schweren Fehler in den nachgewiesenen Kernpfaden nach den Fixes (DR, Stones, Drag, Ally-Teleport). Dispel und Canvas-Risiken bleiben.

4. **Was verhindert eine sinnvolle Canvas-Testphase?**  
   Nichts Blockierendes im Kernkampf. Dispel und Fear/Falling sind bekannte Lücken und sollten nicht als „fertig“ getestet werden.

5. **Freigabe für Foundry-Testversion?**

### READY FOR FOUNDRY TESTING

Bedeutung: interne Nachweise reichen für eine manuelle Foundry-Testphase der Kernsysteme.  
Bedeutung **nicht:** alle Canvas-Szenarien sind bereits bestanden; Katalog-Schwanz und Dispel sind nicht „grün“.
