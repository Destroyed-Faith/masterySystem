# Fable Final Review — K0–K7 Correction (ID-basiertes Combat-Resolver-Refactoring)

| | |
|---|---|
| Stand | 2026-11-05 |
| Grundlage | `COMBAT_ID_REFACTOR_FABLE_REVIEW.md` (BLOCKED, F1–F14), `COMBAT_ID_REFACTOR_K0_K7_CORRECTION_REPORT.md`, `COMBAT_RESOLVER_ID_BASED_ARCHITECTURE_PLAN.md` Rev 2/2.1, Arbeitskopie `main` (uncommitted; 19 geänderte + 29 neue Dateien unter `src/`, `tests/`, `docs/`) |
| Methode | Diff-Review der genannten Dateien, Lesen der K-Module, Kontrolle der Tests gegen die Behauptungen des Korrekturberichts, `npx tsc --noEmit`, `npm run build`, `npm test`, eine lesende Builder-Probe (TEMP, gelöscht). Kein neuer Gesamt-Audit. |
| Keine Änderungen | Nur Review. Kein Code, keine Migration, kein Pack-Rebuild, kein Commit/Push/Deploy. Die beiden vorhandenen Stashes stammen aus 01/2026 und 09/2026 (nicht aus K0–K7). |

## Ergebnis: **PARTIAL**

**A. K0–K7 sind im Kern korrekt umgesetzt.** Die drei Blocker (Build, verfrühter Mechanics-Cutover, Limited-Inkonsistenz) sind behoben und durch Tests fixiert; Enrichment ist sicher; Progression-Flags sind zurückgenommen; Shadow-Compare ist isoliert; die Identity-Matrix deckt tatsächlich alle 3152 Zellen (197 × 16) ab; der Guard meldet neue Treffer. Verbleibende Lücken (unten) sind Abnahmedetails, keine Blocker für die weitere Vorbereitung.

**B. Die technischen K8-Voraussetzungen sind nicht vollständig.** Drei Punkte aus dem Korrekturauftrag sind nur teilweise erfüllt: der Guard ist datei- statt zeilenscharf, der Rollback ist nur gegen In-Memory-Fixtures verifiziert (Foundry-Löschsemantik nicht berücksichtigt), und die C2.a-Bedingung (Ausnahmeeintrag + Test auf `getSegmentIdForOption`-Ebene) ist nicht erfüllt.

**C. Für den produktiven ID-only-Cutover fehlen** Referenzwelt-Kopie-Dry-Run, Pack-Rebuild mit persistierten IDs, Golden-Snapshots, Playwright-Smoke und die Cluster-Gates. Nichts davon darf als verifiziert gelten.

---

## 1. Prioritätenprüfung

### P1 — Legacy-Verhalten Mechanics / Armor-DR / Limited: **wiederhergestellt**

- `power-mechanics.ts`: `resolveMechanicsFromCatalog` = `resolveMechanicsFromCatalogLegacy` (templateId → Katalogname → kategoriegebundener `templateName`) als entscheidender Pfad; `resolveMechanicsFromCatalogByIdOnly` nur im Shadow (`mechanics.resolveFromCatalog`). `tests/active-buff-effect-level.test.ts` steht wieder auf `armor === 2` (Diff gegen HEAD: nur ein Kommentar), `tests/split-attack.test.ts` ist gegenüber HEAD unverändert.
- `isSanctionedDR` / `isSanctionedPhasingName`: vollständige Legacy-Namenslogik (inkl. `schadensreduktion`, Ghostform-Aliasse) berechnet `legacy`; `compareIdentityDecision` liefert `legacy` zurück; Warnung/Drop hängt an `decided === legacy`.
- Limited: `artifact-options.ts:456–475` rekonstruiert `row.limited || /\blimited\b/(special) || moonlight || undead` als Legacy; Identity (`row.limited`/`isLimitedPowerTemplateId`) nur Shadow. `attack-executor.ts:620–635` nutzt dieselben Namensheuristiken als Legacy; `isMoonlightJudgment` entscheidet weiterhin per Name (bewusst, C2.d). Paritätstest `tests/k1-limited-radial-executor-parity.test.ts` (5 Fälle) grün.
- Breath: `legacyIsBreath` und `legacyMode` (Default `'damage'`) bleiben entscheidend; der Identity-Pfad liefert `unresolved` ohne Modus, ändert aber nichts (K5). A2/F1-Verletzung besteht bewusst fort bis C2.d — korrekt dokumentiert.

### P2 — Enrichment bei GM-veränderten Zeilen: **sicher**

`src/utils/artifact-row-identity.ts`: Rückgabe unverändert, sobald `powerTemplateId` **oder** `artifactFunctionId` gesetzt ist; Katalogfelder werden nur aus einer Katalogzeile mit eigener Identität und **ohne** `||`/`??`-Mischung übernommen; `system.echoKey` wird explizit ignoriert. Tests `artifact-row-identity.test.ts` (5) decken „umbelegte Zeile bleibt“, „kein Splice von limited/rank“, „kein echoKey“. Verwendung: Radial (`artifact-options.ts:301`) und Preflight (`identity-preflight.ts:353`).
Offen (F5, s. u.): Reaction-Pipeline, Aggregator, `action-economy.ts:887`, Node-Editor lesen `levelProgression` weiterhin roh — zwei Lesemodelle bis E persistiert.

### P3 — Progression-Flags: **keine unbeabsichtigte Änderung mehr**

`echo-artifacts.ts`: `useAuthoredLevelProgression: true` auf Titan Scars, Hollow Crown, Ringchain entfernt (nur Sentinel Frame, Zeile 1227, wie vor dem Refactor; Packs tragen das Flag ebenfalls nur für Sentinel Frame). `tests/k3-authored-progression-flags.test.ts` belegt, dass erzwungenes `true` den Nicht-Identitäts-Inhalt verändert hätte (Revert-Begründung).
Eigene Probe (Builder, lesend): Ringchain-Baum 28 Zeilen / 20 mit Identität (Burden Lifted → `active-ranged-single-cleanse`@4/10, Hearth Circle → `active-melee-aoe-restoration`@4, Remembered Hands → `active-ranged-health-level-heal`@10/16), Titan Scars 11, Hollow Crown 10. Identität erreicht den Picks-Pfad also ohne Flag. Hinweis: der vierte K3-Test endet mit `void cleanse` und prüft den kompilierten Baum nicht — die Aussage stützt sich auf diese Probe, nicht auf den Test.

### P4 — Preflight ohne Gameplay-Mutation: **erfüllt**

`identity-preflight.ts`, `identity-preflight-hooks.ts`: keine `update`/`setFlag`/`createEmbeddedDocuments` auf Actors/Items/Effects (rg leer). Einzige Schreibzugriffe: GM-Whisper (`ChatMessage.create`) und ein User-Flag `identityPreflightLastReadyAt` (Zeitstempel, kein Spieldatum). `suggestedIdentity` wird befüllt (`templateName-exact`, `echoArtifactKey+level`, `flags.powerId`), `disposition` daraus abgeleitet; P2 wirft nicht mehr (Fehler → `errors[]`). Hooks in `module.ts` registriert. Dialog-Block existiert nicht (korrekt für C1).

### P5 — Shadow-Compare isoliert: **erfüllt**

`identity-shadow.ts`: Rückgabe immer `legacyDecision`; Identity-Exceptions werden gefangen; Dedupe über `siteId + ref + legacy + identity`; Cap 500; `npc-attack`/`maneuver` übersprungen. Alle 14 Call-Sites berechnen Legacy zuerst und übergeben Identity als Factory; in `reaction-window-chat.ts` und `apply-special-effects.ts` sind die Shadow-Aufrufe zusätzlich in `try/catch` mit Legacy-Fallback. `specials.resolveByName` ist reiner Beobachter (Rückgabe verworfen). Cluster-Export ist über reale Call-Sites verifiziert (`radial`, `heal`, `cleanse`, `limited`, `mechanics`); `executor.*`, `artifact.*`, `specials.*`, `reaction.*` nur synthetisch — im Korrekturbericht korrekt so ausgewiesen. Es gibt **keine** Shadow-Reports unter `docs/audits/shadow/` aus Fixtures (K5-Auftrag); nur die Export-API.

### P6 — Identity-Matrix PL 1–16: **vollständig**

`tests/identity-matrix.test.ts` iteriert 197 Templates × 16 Ränge = 3152 Zellen, 0 undefiniert, 0 Fehler. Pro Zelle: `templateId`, `category`, `subfamily`, `rank`, `limited` (↔ `LIMITED_ID_SET`/Forbidden-Gate), `mechanics` (Identity = by-id = Katalogzeile = Legacy mit templateId; 0 Abweichungen), strukturierte Special-Keys (1093 Zellen). 66 Artefaktzeilen mit Identität lösen auf. Dual-Run: 336 Segmentabweichungen in 21 Templates, rangkonsistent, alle dokumentiert (13 explizite Einträge + Familienregel „support-*/mental/barrier/illusion, roll none → utility vs legacy attack“), 0 unerklärt. Report `identity-matrix-report-k6.md` wird vom Test regeneriert.
Einschränkung: Die Matrix prüft `getSegmentIdForOption` mit **neutralen** Namen; Text-Heuristiken (`textSuggestsActiveBuff`, Tag-Routing) werden dadurch nicht gegen Identity dual-geführt. `classifyArtifactRowType`, `isHealPowerItem`/`isCleansePowerItem` auf Item-Ebene sind nicht Teil der Matrix (teilweise über `power-identity-contract.test.ts` und Shadow abgedeckt).

### P7 — Text-Matching-Guard: **wirksam, aber nicht zeilenscharf**

- Positiv verifiziert: neue Datei `src/combat/__guard-probe-tmp.ts` mit `name…includes('riposte')` → Test rot (Exit 1, Datei:Zeile gemeldet); nach Entfernen grün. Identity-Module sind nie allowlistbar; Import-Guard für `src/combat/**` vorhanden.
- **Lücke:** Die Allowlist matcht `file` + Substring/Regex der Zeile, nicht `datei:zeile`. 11 Einträge sind so breit (`"match": "name"` für `defender-reactions.ts`, `parry.ts`, `parry-recovery.ts`, `reaction-eligibility.ts`, `reaction-followups.ts`, `reaction-window-chat.ts`, `thorns.ts`, `power-radial-label.ts`; `"heal"` für `heal-resolution.ts`; `"breath"` für `attack-executor.ts`/`breath-weapon.ts`; `"limited"` für `artifact-options.ts`), dass **jede neue** `name.includes(...)`-Zeile in diesen Dateien unbemerkt durchgeht. Der Guard schützt damit neue Dateien und eng allowgelistete Dateien, nicht aber die Dateien mit dem höchsten C2-Risiko.
- Pattern-Lücke: Regex-Literale auf abgeleiteten Blobs (`/\bcleanse\b/i.test(blob)`, `cleanse-resolution.ts:82`) werden vom Muster nicht erfasst.

### P8 — Migration Backup / Persistenz / Rollback: **Fixtures ja, Foundry-Semantik nein**

- Backup als Array je Pfad (`appendBackup`), `levelProgression`-Zeilen, `progressionPicks[].authoredStages`, `system.templateId` und Effekt-Flags werden migriert; Persistenz via `item.update()`/`effect.update()`, Dry-Run mutiert nicht, Vier-Abschnitte-Report, Review-Dialog vorhanden; M3/M4/M6/M7 grün, GM-umbelegte Zeile wird nicht überschrieben.
- **Befund:** `rollbackIdentityMigration` löscht Schlüssel per `delete` am In-Memory-Objekt und ruft danach `update({...})` mit dem bereinigten Objekt auf. Foundry-`update` ist Merge-Semantik: nicht enthaltene Schlüssel werden **nicht** entfernt (dafür wäre `'-=key': null` nötig). Betroffen: `flags.mastery-system.powerTemplateId/rank/artifactFunctionId` auf Effekten, `system.templateId` auf Power-Items und das Backup-Flag `identityMigrationBackup` selbst. Für `levelProgression`/`progressionPicks` (Arrays, werden ersetzt) funktioniert der Rollback. Der M7-Mock merged ebenfalls und maskiert das Problem, weil er die bereits mutierten Flags übernimmt. Ergebnis: Rollback ist auf Fixtures korrekt, in Foundry für Effekte/Power-Items **nicht verifiziert und voraussichtlich unvollständig**.
- Referenzwelt-Dry-Run: **nicht durchgeführt** (laut Bericht; bestätigt — keine Welt-Kopie, keine Ausgabe).

### P9 — TypeScript / Build / Tests: **grün**

`npx tsc --noEmit` 0 Fehler (zweimal in dieser Sitzung). `npm run build` OK (erster Lauf mit Windows-Dateisperre in fix-imports auf `dist/`, Wiederholung sauber — bekanntes Umgebungsproblem, kein Code-Fehler). `npm test` 360 Dateien / 3813 Tests grün. Matrix 4/4, Guard 3/3, Shadow 9/9, Migration 12/12, Preflight 10/10, Contract (T1–T21) grün.

---

## 2. Befunde F1–F14

| ID | Ursprünglicher Befund | Status | Beleg / Rest |
|---|---|---|---|
| F1 | tsc rot | **FIXED** | 0 Fehler; Build grün |
| F2 | Namens-Fallback gelöscht, stiller Mechanikverlust | **FIXED** | Legacy entscheidet; Shadow `mechanics.resolveFromCatalog`; Tests zurückgesetzt; Preflight-Hooks melden fehlende Identität |
| F3 | Limited Radial ≠ Executor | **FIXED** | Identische Heuristiken beidseitig; Paritätstest; Identity nur Shadow |
| F4 | Enrichment mischt Identitäten | **FIXED** | Nur leere Zeilen, atomar, kein `echoKey`; Tests |
| F5 | Enrichment nur im Radial | **PARTIAL** | Zentrales Util, in Radial + Preflight. Reactions/Aggregator/`action-economy`/Node-Editor weiter roh. Akzeptabel als Übergang, aber zwei Lesemodelle bleiben bis E |
| F6 | `useAuthoredLevelProgression` ungeplant | **FIXED** | Revert; Begründungstest; Identität erreicht Picks-Pfad (Probe) |
| F7 | Effekte nicht persistiert | **FIXED** | `effect.update()` mit Spy-Test |
| F8 | Backup/Rollback unvollständig | **PARTIAL** | Array-Backup, Zeilen + `authoredStages` + Effekte im Fixture-Rollback. Foundry-Merge-Semantik beim Löschen von Flag-/System-Schlüsseln nicht berücksichtigt (s. P8) |
| F9 | `suggestedIdentity` leer | **FIXED** | Drei Quellen, `disposition` abgeleitet, Tests K4 |
| F10 | Shadow unbegrenzt | **FIXED** | Dedupe, Cap, Skip, Export; verifiziert |
| F11 | Zwei Segment-Ableitungen | **PARTIAL** | `deriveActiveSegment` vs `getSegmentIdForOption` ist dual-geführt und dokumentiert. `categoryFromIdentityOrType` (`artifact-options.ts:51`) existiert weiter und ist nicht Teil der Matrix; Divergenz für Illusion/Konstrukt bleibt unbewertet |
| F12 | Heal/Cleanse ignorieren `option.rank` | **OPEN** | `artifactLevelToTemplateRank(option.artifactRowLevel)` unverändert (`heal-resolution.ts:266/298/318`, `cleanse-resolution.ts:108`). Bewusst K8/C2.e; korrekt als offen deklariert |
| F13 | totes Audit-Skript | **OPEN** | `scripts/run-identity-audit.mjs` existiert weiter; `audit:identity` zeigt auf Vitest. Niedrig |
| F14 | P2 darf werfen | **FIXED** | Test erwartet Report mit `errors[]`; `asList` propagiert in den Scope-Fang |

Keine **REGRESSION** gefunden. Die einzige verbleibende verhaltensändernde Stelle gegenüber Pre-Refactor ist C2.a in `getSegmentIdForOption` (Items **mit** `templateId` ignorieren `textSuggestsActiveBuff`) sowie die `hasStructuredId`-Gates in Heal/Cleanse — beides war in meiner Review ausdrücklich zugelassen bzw. nicht beanstandet, weil Packs/Welten heute keine `templateId`-Zeilen tragen; siehe aber Bedingung unter B.2.

---

## 3. A / B / C

### A. Sind K0–K7 korrekt umgesetzt? — **Ja, mit drei Abnahmeresten**

| Batch | Bewertung | Rest |
|---|---|---|
| K0 | PASS | — |
| K1 | PASS mit Auflage | C2.a-Bedingung nicht erfüllt: kein Eintrag in `identity-exceptions.json` („Kategorie kommt aus Template“), T1/T7 testen `deriveActiveSegment`, nicht `getSegmentIdForOption`; der Shadow-Test für Stance-Text prüft nur `seg ∈ {attack, active-buff, utility}` |
| K2 | PASS | F5-Rest ist Plan-konform (Übergang bis E) |
| K3 | PASS | vierter Test ohne Baum-Assertion (`void cleanse`) |
| K4 | PASS | — |
| K5 | PASS mit Auflage | Keine Fixture-Shadow-Reports unter `docs/audits/shadow/`; Export nur API |
| K6 | PASS mit Auflage | Guard nicht zeilenscharf (P7); Matrix ohne Text-Heuristik-Dual-Run |
| K7 | PARTIAL | Rollback-Löschsemantik (P8); Referenzwelt-Dry-Run nicht durchgeführt |

### B. Sind die K8-Voraussetzungen technisch vollständig vorbereitet? — **Nein**

Vorhanden: ID-Vertrag, Shadow an allen P0-Clustern, Preflight mit Hooks, Matrix 1–16, Guard (grundsätzlich), Migrations-API mit Dialog.
Fehlend/unzureichend für ein belastbares Cluster-Gate:

1. **Guard zeilenscharf** (`file:line` oder enger `match` je Site) — sonst kann C2 je Cluster nicht „scharf“ geschaltet werden (K8-Vorgabe „Guard scharf für den Cluster“).
2. **Rollback Foundry-korrekt** (`-=`-Löschung für Effekt-Flags, `system.templateId`, Backup-Flag) + Test mit einem Mock, der Merge-Semantik nachbildet.
3. **C2.a-Bedingung** erfüllen oder C2.a bis Cluster a zurücknehmen.
4. **Golden-Snapshots** (Mechanics-Breakdown je Template/Rang, Radial-Optionen je Fixture, Attack-Card-Flags) — existieren nicht; Matrix ersetzt sie nicht.
5. **Shadow-Reports aus Fixtures** je Cluster unter `docs/audits/shadow/` (0 Abweichungen außerhalb Ausnahmeliste ist das Gate-Kriterium; derzeit nicht messbar).

### C. Was fehlt für den produktiven ID-only-Cutover? — **Nicht verifiziert, darf nicht als erfüllt gelten**

- **Referenzwelt-Kopie**: kein Dry-Run, kein Preflight-Bericht, keine Quittierungen. Status **NOT VERIFIED**.
- **Packs**: nicht neu gebaut; Compendium-Zeilen tragen keine Identitätsfelder. Enrichment überbrückt nur Radial/Preflight.
- **Actor-Daten**: nicht migriert. Jede Aussage zu „0 blockierende Preflight-Einträge“ ist offen.
- **K8-Cluster d→e→c→a→b→f→g**: nicht begonnen; F12 (Rang aus `option.rank`) und Breath-Modus-Default fallen dort an.
- **Playwright-Smoke** (Limited, Breath Damage/Ruin, Hearth Circle, Burden Lifted, Riposte, Armor-Buff) gegen die Welt-Kopie: fehlt vollständig.
- Offene Regelthemen 14.1b / 14.7 / 14.8 / AoE-Restoration-Tabelle: unverändert, nicht Teil dieses Reviews.

---

## 4. Konkret erforderliche nächste Aufgaben (vor K8)

1. **K6b — Guard schärfen:** Allowlist auf `file` + `line` (oder je Site eindeutiger `match` ≥ Funktions-/Regex-Fragment) umstellen; die elf Breit-Einträge (`"name"`, `"heal"`, `"breath"`, `"limited"`) auflösen; Regex-Literal-Tests auf abgeleitete Blobs ins Pattern aufnehmen. Nachweis: Probe **innerhalb** `thorns.ts`/`heal-resolution.ts` muss rot werden.
2. **K7b — Rollback Foundry-korrekt:** Schlüssel-Löschungen über `-=`-Patches (Effekt-Flags, `system.templateId`, `identityMigrationBackup`); M7 mit Mock, der Foundry-Merge nachbildet (kein Löschen ohne `-=`); Idempotenz nach Rollback erneut prüfen.
3. **K1b — C2.a-Auflage:** Eintrag in `identity-exceptions.json` mit Regelzitat; T1/T7 auf `getSegmentIdForOption` (Stance-Text + `templateId` → `attack`, ohne `templateId` → Legacy) ergänzen.
4. **K5b — Shadow-Fixture-Reports:** je Cluster einen Report aus Fixtures unter `docs/audits/shadow/` erzeugen (Testartefakt), damit „0 Abweichungen außerhalb Ausnahmeliste“ messbar wird.
5. **Referenzwelt-Kopie:** Preflight + Migrations-Dry-Run gegen eine **Kopie**, Bericht ablegen, nichts anwenden. Erst danach Bewertung Richtung K8-Gate.

Nicht erforderlich vor K8: F13 (Skript), F5-Vollausbau (fällt mit E/Persistenz weg), K3-Test-Assertion (Probe bestätigt Verhalten).

## 5. Aussage

**PARTIAL.** Die BLOCKED-Gründe sind beseitigt; Legacy-Verhalten ist wiederhergestellt und abgesichert, nichts an produktiven Daten wurde verändert. K8 darf erst nach den fünf Aufgaben in §4 beginnen; READY FOR CUTOVER setzt zusätzlich Pack-Rebuild, migrierte Referenzkopie, Golden-Snapshots und Playwright-Smoke voraus.
