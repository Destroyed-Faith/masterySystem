# Fable Review — ID-basiertes Combat-Resolver-Refactoring (Autos Umsetzung)

| | |
|---|---|
| Stand | 2026-11-05 |
| Geprüft | Arbeitskopie `main` (uncommitted), `docs/audits/COMBAT_RESOLVER_ID_REFACTOR_IMPLEMENTATION.md`, Git-Diff (17 geänderte, 14 neue Dateien), Plan Revision 2/2.1 |
| Methode | Diff-Review der geänderten Dateien, Lesen der neuen Module, `npx tsc --noEmit`, gezielte `rg`-Prüfung der im Plan inventarisierten P0-Stellen. Kein neuer Gesamt-Audit. |
| Keine Änderungen | Nur Review. Kein Code, keine Migration, kein Pack-Rebuild, kein Commit. |

## Ergebnis: **BLOCKED**

Der Build ist rot (`tsc`: 26 Fehler), und zwei Cutover-Schritte wurden außerhalb der genehmigten Reihenfolge ohne Shadow-Phase, ohne Migration und ohne Sichtbarkeit ausgeführt; sie können in bestehenden Welten Mechanik still verändern. Das verletzt die Vorgaben F2/F3 (kein stiller Verlust) und „keine Veränderung der Ergebnisse bestehender Combat-Mechaniken“. Batch B und die C1-Infrastruktur sind im Kern brauchbar; E ist eine Bibliothek ohne Persistenz, Rollback und UI.

---

## 1. Korrekt umgesetzt

- **B0** `CLEANSE_RANGED_SINGLE` exakt nach `Actives.md` 1223–1238 mit Test (`tests/catalog-rules-cleanse.test.ts`); Kontrollwerte PL 4 = 6, PL 10 = 10. Keine anderen Tabellen angefasst.
- **`ARTIFACT_FUNCTION_CONTRACT`** (`src/utils/artifact-functions.ts`): vier Einträge, K2/K3-Semantik wie §7.3, keine Registry.
- **`resolvePowerIdentity`** (`src/utils/power-identity.ts`): liest nur strukturierte Felder; Unresolved-Gründe und Severity entsprechen §7.2; K3-Validierung (`requiresTemplateId`) und K2-Verbot von `powerTemplateId` korrekt; `category-conflict` implementiert; `suggestedIdentity` ist im Typ vorhanden. `resolvePowerMechanicsById` additiv und ID-only.
- **Rank-Ableitung** für Artefakt-Zeilen ohne `rank` aus `row.level` (Stufe 1–9 → 4/10/16) ist numerisch, nicht textbasiert — zulässig und deckungsgleich mit `stagePowerLevels`-Default.
- **Quelldaten**: Ringchain L2/3/4/6/7/8 mit freigegebenen IDs/Rängen; Dragon Breath K3 auf Pick-Spec und Zeilen; Titan Growth/Life Absorption/Awakening mit `artifactFunctionId` (zentral über `artifactAwakeningRow`/`artifactAwakeningStage`). Keine Textänderung an Regelinhalten.
- **Builder/Compiler (Z2)**: Authored-Pick-Builder und beide Compiler-Zweige reichen `powerTemplateId`/`artifactFunctionId`/`rank`/`limited`/Spell-Felder durch; `tenLevels` in `echo-artifacts-unbound.ts` ebenfalls.
- **Buff-Flags**: `rank` (und bei Artefakten `artifactFunctionId`) werden beim Erzeugen geschrieben.
- **Shadow-Infrastruktur** (`identity-shadow.ts`): `compareIdentityDecision` gibt immer Legacy zurück, fängt Exceptions des Identity-Pfads; S1–S3 grün.
- **Migrations-API** arbeitet nur an Fixtures; schreibt keine Namen/Beschreibungen; Dry-Run mutiert nicht; Fixture-Tests M1/M2/M5/M8 grün.
- **Vitest** 356 Dateien / 3768 Tests grün; `audit:catalog` grün.

## 2. Implementierungsfehler

| # | Schwere | Befund | Beleg |
|---|---|---|---|
| F1 | **Blocker** | `tsc --noEmit` schlägt fehl: 25 Fehler in `src/migrations/power-identity-migration.ts` (`items`/`effects` als `{}` typisiert → `.system/.flags/.update` unbekannt), 1 Fehler in `src/utils/power-mechanics.ts:175` (String-Index auf `Record<PowerLevelKey,…>`). `npm run build` und `release:check` sind damit rot. Der Bericht listet „TypeScript“ als geprüft — das trifft nicht zu. | `npx tsc --noEmit` |
| F2 | **Blocker** | **Namens-Fallback in `resolveMechanicsFromCatalog` wurde gelöscht (C2) ohne C1-Shadow dieser Stelle, ohne E in einer Referenzwelt und ohne Cluster-Gate.** Legacy-Power-Items ohne `templateId` und ohne gebackene `levels[rank].mechanics` verlieren sofort Armor/DR/Thorns/Parry usw. — still, weil Preflight nirgends angebunden ist (keine Hooks, kein Sheet-Badge, keine Diagnose im Aggregator). Auto hat den Test `active-buff-effect-level.test.ts` von „+2“ auf „undefined“ umgeschrieben, statt den Verhaltenswechsel zu stoppen. | Diff `power-mechanics.ts:245–256`; Test-Diff |
| F3 | **Blocker** | **Limited-Erkennung inkonsistent zwischen Radial und Ausführung.** In `artifact-options.ts` wurden `/\blimited\b/` auf `row.special` sowie Name-Matches entfernt (`rowLimited = row.limited === true`), in `attack-executor.ts:622/636` entscheiden `/moonlight judgment/`, `/undead tracer/` weiterhin per Name. Folge für alte Embeds ohne `limited: true` und ohne `echoArtifactKey`: Radial zeigt die Zeile als normalen Angriff (kein `disabled` bei verbrauchter Charge, keine ×4-Markierung), der Executor verbraucht trotzdem die Limited-Charge per Namen. Das ist weder fail-closed noch verhaltensneutral. | `artifact-options.ts:481–483`, `attack-executor.ts:606–640` |
| F4 | Hoch | **Runtime-Enrichment ist mechanisch unsicher.** `enrichArtifactRowIdentity` mischt Katalogfelder per `(echoArtifactKey, level)` auch auf Zeilen, die bereits eine *andere* Identität tragen (GM hat im Node-Editor einen Slot umbelegt): `artifactFunctionId: row.artifactFunctionId \|\| catalogRow.artifactFunctionId` setzt `dragon-breath` auf eine umbelegte Zeile → Breath-Zweig/Vertragsverletzung; `limited: row.limited \|\| catalogRow.limited` macht eine ersetzte Zeile wieder Limited → falscher Charge-Verbrauch; `rank: row.rank ?? catalogRow.rank` nimmt den Rang einer anderen Linie. Zudem ist `item.system.echoKey` der Echo-Schlüssel (`'halflings'`), kein Artefaktschlüssel — toter Fallback. | `artifact-options.ts:50–74` |
| F5 | Hoch | **Enrichment existiert nur im Radial.** Reaction-Pipeline, Sheet, Passive-Aggregator, `action-economy.ts:888`, Node-Editor lesen `levelProgression` roh. Zwei Wahrheiten für dieselbe Zeile; Preflight auf Actors meldet Zeilen als `missing-identity`, die das Radial gleichzeitig als identifiziert behandelt. Der Plan sah persistierte IDs (Rebuild + Migration) vor; Enrichment ist höchstens ein Übergangs-Lesemodell und müsste dann zentral (ein Util für alle Konsumenten) und nur für Zeilen *ohne jede* Identität gelten. | — |
| F6 | Hoch | **Ungeplante Datenmodelländerung:** `useAuthoredLevelProgression: true` auf Titan Scars, Hollow Crown, Ringchain. `buildEchoArtifactTree` läuft zur Laufzeit (`character-import.ts:226`, `character-sheet-echo-dialog.ts:398`, `seed-artifact-library`) → neu erstellte Charaktere erhalten andere Items als das Pack (Flag im `system`, Zeilen aus Tabelle statt aus Picks — bei Titan Scars Slot 2/3 ggf. anderer Effekttext als der aus `STONE_POWERS` kompilierte). Nicht im Plan, nicht begründet, nicht getestet. | Diff `echo-artifacts.ts:447, 1650, 1786` |
| F7 | Mittel | **Migration persistiert Effekte nicht:** Active-Effect-Zweig mutiert nur `effect.flags` im Speicher, kein `effect.update()`. In Foundry wirkungslos. | `power-identity-migration.ts:296–316` |
| F8 | Mittel | **Backup/Rollback unvollständig:** ein einziges `identityMigrationBackup`-Flag pro Item wird je Zeile überschrieben (letzte gewinnt); `rollbackIdentityMigration` überspringt `levelProgression` ausdrücklich („best-effort: skip table“) — genau der Hauptfall. `progressionPicks[].authoredStages` wird nicht migriert → nächstes Node-Editor-Save kompiliert die Identität wieder weg (Plan 10.2a). | `power-identity-migration.ts:224–260, 331–345` |
| F9 | Mittel | **`suggestedIdentity` wird nie befüllt** (weder im Resolver noch im Preflight). Dadurch ist `disposition` im Preflight falsch: Buff-Effekte mit `powerId` und Power-Items mit eindeutigem `templateName` landen als `manual`. Der Bericht „Auto vs. Manuell“ (Vorgabe 4) ist damit nicht belastbar. | `identity-preflight.ts:60–70` |
| F10 | Mittel | **Shadow-Hygiene:** `sessionLog` wächst unbegrenzt (jeder Radial-Aufbau, jede Option, auch `npc-attack`-Optionen ohne Item → immer „unresolved“ → Mismatch + `console.info` pro Option). Kein Dedupe, kein Cap, kein GM-Export. Plan verlangte Caching/Zähler. | `identity-shadow.ts:66–95`, `options.ts:711–731` |
| F11 | Mittel | **Zwei Segment-Ableitungen:** `deriveActiveSegment` (roll.kind + Subfamily-Regex) in `power-identity.ts` vs. `categoryFromIdentityOrType` (nur `support-*`) in `artifact-options.ts`. Für Actives mit `roll.kind: 'none'` außerhalb `support-*` (Illusion/Konstrukt) liefern sie unterschiedliche Segmente. | — |
| F12 | Niedrig | `healPowerItemFromRadialOption`/`cleansePowerItemFromRadialOption` ignorieren das neue `option.rank` und leiten den Rang weiter aus `artifactLevelToTemplateRank(artifactRowLevel)` ab; bei `stagePowerLevels ≠ 4/10/16` (z. B. Heart of Winter `4/8/16`) falscher Rang. | `heal-resolution.ts:241–244`, `cleanse-resolution.ts:85–87` |
| F13 | Niedrig | `scripts/run-identity-audit.mjs` importiert `.ts` direkt mit Node — läuft nicht; `audit:identity` zeigt auf den Vitest-Test, das Skript ist tot. | — |
| F14 | Niedrig | Test P2 behauptet `preflightActor` darf werfen — Plan P2 verlangt das Gegenteil (Bericht mit Fehlereintrag, keine Exception). | `tests/identity-preflight.test.ts:92–101` |

## 3. Noch fehlende Teile des Plans

| Plan | Status | Fehlt |
|---|---|---|
| B §9.2 Preflight-Auslösung | Modul vorhanden, **nicht angebunden** | World-`ready`-Banner, Combat-Start-Whisper, Sheet-Badges, Radial-Tooltip, `audit:identity` auf Packs/Fixtures |
| B Identity-Matrix (11.2) | **nicht vorhanden** | Es gibt nur „jede Template löst bei Rang 1 auf“. Kein Vergleich `ALL_POWER_TEMPLATES × 16` gegen `getSegmentIdForOption`, `classifyArtifactRowType`, `isHealPowerItem`, `isCleansePowerItem`, `isLimitedAttackDeclaration`, `resolvePowerMechanics`, `isSanctionedDR/Phasing`; keine Ausnahmeliste. Die „PASS“-Aussage im Matrix-Report ist nicht gedeckt. |
| B Pack-Rebuild | laut Mandat ausgesetzt | Packs ohne Identitätsfelder; akzeptiert, aber dann darf C2 nicht beginnen (Gate) |
| C1 Cluster | **nur 4 Stellen** (Segment, Limited-Deklaration, Heal/Cleanse-Radial) | Kein Shadow an: Aggregator/DR/Phasing (P0-06…08, 33…40), Artefakt-Zeilenkategorie (P0-11…18), Attack-Executor Limited/Breath (P0-19/21/22), Specials (P0-24…26), Growth-PL (P0-13), Reactions (P0-43…45). Kein Shadow-Report je Cluster. |
| E Review-Dialog, Quittierung, Rücknahme | API-Fragment | Dialog, 4-Abschnitte-Export, `identityReview`-Flow im UI, funktionierender Rollback, `authoredStages` |
| C2 Cluster d→e→c→a→b→f→g | außer Reihe, lückenhaft | siehe §4 |
| F Release Gate G1–G10 | nicht erfüllt | tsc, Guard scharf, Golden, Playwright, Checkliste |
| Golden-Snapshots | **keine** | Mechanics-Breakdown je Template/Rang, Radial-Optionen je Fixture, Attack-Card-Flags |

## 4. Verbliebene mechanische Text-Erkennung — vollständig identifiziert?

**Nein.** Autos Liste (fünf Helfer) ist unvollständig. Zusätzlich noch aktiv (mechanisch, nicht kosmetisch):

| Stelle | Art | Cluster |
|---|---|---|
| `attack-executor.ts:622, 636` — `/moonlight judgment/`, `/undead tracer/` → Limited-Charge | **Ressourcenverbrauch per Name** | d |
| `attack-executor.ts:660–685` — `/breath weapon/`, `/damage breath/`, `/ruin breath/`; Modus-Default `'damage'` wenn kein Feld | Breath-Pfad + Standardannahme (verletzt A2/F1) | d |
| `artifact-active-buffs.ts:64–66` — `growthPowerLevelFor`: `/power level\s*(\d+)/` aus Beschreibung | Power Level aus Text | c |
| `power-mechanics.ts:286–345` — `isSanctionedDR`/Phasing über Namen (`'damage reduction'`, `'schadensreduktion'`, `ghostform`) | DR/Phasing-Berechtigung per Name | b |
| `apply-special-effects.ts:92–117` — `applySpecialStringsToTarget` → `getEffect(name)` | Specials als Display-String | g |
| `reaction-window-chat.ts` Special-Increase `includes(chosen.id)` und Reaction-Name-Regex aus Plan §4.1 (P0-33…45) | Reaction-Klassen per Name | f |
| `artifact-options.ts:538` — `isBreathWeaponName(name)` als zweiter Zweig **auch bei vorhandener Identität** (`\|\|`) | Name schlägt Identität nicht, bleibt aber Routing-Eingabe | d/c |
| `options.ts` — `tags.includes('stance'/'buff')` als Routing-Eingabe (Plan 7.5: Tags sind keine Quelle) | Tag-Routing | a |
| `getSegmentIdForOption`-Legacy — `textSuggestsActiveBuff` für Items ohne `templateId` | Text-Routing (von Auto als Legacy-Ausnahme belassen) | a |
| `heal-resolution.ts` — `artifactRowLooksLikeHeal`, `inferRestorationTemplateFromArtifactText` ohne strukturierte ID; `cleanse-resolution.ts` Name/Description-Blob | Text-Targeting | e |
| `classifyArtifactRowType` für Zeilen ohne Identität | Kategorie aus Typ-Text | c |
| `isUltimateProgressionRow` (`artifact-visible-abilities.ts:39–47`) — `/awakening/`, `/^true\b/` | Zeilenklassifikation per Name (jetzt per `artifactFunctionId: 'artifact-awakening'` ablösbar) | c |

Legitim (Anzeige/Suche, nicht Mechanik): `formatRadialPowerDisplayName`, Chat-Labels, Picker-Sortierung, `breathWeaponRowDisplay` als reine Darstellung, Preflight-Klassifikation „aktivierbar?“ (Diagnose, keine Mechanik).

Der Guard-Test (`tests/no-text-mechanic-matching.test.ts`) ist **kein Guard**: zweiter Test endet mit `expect(Array.isArray(hits)).toBe(true)` und die Allowlist besteht aus genau den Funktionsnamen, die er finden soll. Er kann keine Regression melden.

## 5. Daten- und Migrationsrisiken

1. **Stiller Mechanikverlust** (F2): Welten mit Pre-Cutover-Power-Items ohne `templateId` und ohne gebackene Mechanik verlieren Armor/DR/Passive-Beiträge, ohne dass irgendeine Anzeige existiert.
2. **Falscher Ressourcenverbrauch / falsche Mechanik** (F3, F4): Limited-Charge per Name im Executor bei gleichzeitig „normal“ dargestellter Radial-Option; Enrichment kann `limited`/`dragon-breath` auf umbelegte Zeilen setzen.
3. **Zwei Datenstände**: Pack (ohne IDs) ≠ Quellkatalog (mit IDs) ≠ Laufzeit-Builder-Output (mit IDs + `useAuthoredLevelProgression`). Neue Charaktere und Importe erhalten andere Items als die Pack-Bibliothek; `seed-artifact-library` kann beim nächsten Seed-Version-Bump divergieren.
4. **Migration nicht produktionsfähig**: keine Persistenz für Effekte, kein wirksamer Rollback für Zeilen, `authoredStages` unberührt, kein Review-Dialog, keine Quittierung, kein Vorab-Bericht mit vier Abschnitten; `disposition` falsch (F9).
5. **Preflight blind**: kein Hook, kein Export — F4 des Plans (Welt vor C2-Build blockieren) ist nicht umsetzbar.
6. **Positiv**: Es wurden keine Actor-Daten, Packs oder Welten verändert; Migration läuft nur gegen Fixtures; `name`/`description` werden nirgends geschrieben.

**Bewertung:** Die Migration ist **nicht bereit**. Erforderlich sind F7/F8/F9 plus Dialog, Hooks und Tests M3/M4/M6/M7, bevor eine Referenzwelt (Kopie!) migriert werden darf.

## 6. Fehlende Tests

- **TypeScript**: `tsc --noEmit` als Pflichtschritt (heute rot).
- **Identity-Matrix** (11.2) mit Ausnahmeliste; **Golden-Snapshots** vor jedem C2-Cluster.
- **Guard scharf**: Allowlist als `datei:zeile`-Einträge mit Begründung; neuer Treffer = Fehler; Import-Guard (`src/combat/**` darf keine Mapping-Tabellen importieren).
- Vertragstests **T4, T5, T7, T8, T9 (Teil „ohne Modus → Unresolved“)**, **T12, T13, T16, T17, T18** fehlen; T8 (Limited ohne Flag/ID verbraucht nichts) und T9c (Breath ohne Modus kein Default) sind nach F3 besonders wichtig.
- **Shadow**: S2 existiert; es fehlt der Nachweis „Legacy unverändert bei werfendem Identity-Pfad“ an den realen Stellen (Segment/Limited/Heal/Cleanse), Dedupe/Cap-Test, Report-Export-Test je Cluster über Fixtures.
- **Migration**: M3 (mehrdeutiger `templateName` → manual), M4 (eindeutig → nach Bestätigung gesetzt), M6 (Effekt ohne Item bleibt bestehen), M7 (Rollback stellt Zeilen *und* Effekte wieder her), Effekt-Persistenz via `update`-Spy, `authoredStages`-Migration, Fixture mit Node-Editor-umbelegter Zeile (Enrichment darf nichts überschreiben).
- **Tree-Builder-Äquivalenz** für Titan Scars/Hollow Crown/Ringchain vor/nach `useAuthoredLevelProgression` (oder Revert).
- `tests/staff-life-taken-radial.test.ts` auf `resolvePowerIdentity` umstellen, sobald C2.a abgeschlossen (Plan 15.3).
- **Foundry-E2E**: Playwright Combat-Smoke (Limited-Angriff, Breath Damage/Ruin, Hearth Circle, Burden Lifted, Riposte, Armor-Buff) gegen eine Kopie der Referenzwelt — fehlt vollständig. Ohne diesen Nachweis kein Release.

## 7. Korrekturauftrag für Cursor Auto (kleine, einzeln prüfbare Batches)

Reihenfolge verbindlich. Jeder Batch: `tsc --noEmit` grün, `npm test` grün, Diff auf die genannten Dateien beschränkt, kurze Notiz im Implementation-Report. Keine Commits, keine Packs, keine Welten.

**K0 — Build reparieren (nur Typen, kein Verhalten)**
`src/migrations/power-identity-migration.ts` (Items/Effekte als `any[]` typisieren oder schmale Interfaces), `src/utils/power-mechanics.ts:175` (`defLevels[String(r) as PowerLevelKey]`). Abnahme: `tsc` 0 Fehler, `npm run build` grün.

**K1 — Außer-Reihe-Cutover zurück auf C1 (Verhaltensneutralität wiederherstellen)**
- `power-mechanics.ts`: Namens-Fallback in `resolveMechanicsFromCatalog` **wiederherstellen**, aber unter `compareIdentityDecision('mechanics.resolveFromCatalog', legacy, identityById)`; Legacy entscheidet. `tests/active-buff-effect-level.test.ts` und `tests/split-attack.test.ts` auf die ursprünglichen Erwartungen zurücksetzen.
- `artifact-options.ts`: Limited-Legacy-Erkennung (`row.limited || /\blimited\b/.test(special) || Name-Matches`) wiederherstellen, Identity-Pfad (`row.limited`/`identity.limited`) nur als Shadow. Abnahme: Legacy-Output byte-identisch zu vor Autos Änderung (Golden aus `git stash`-freiem Vergleich: Fixture-Radial-Snapshot vor/nach).
- C2.a (Items **mit** `templateId` ignorieren `textSuggestsActiveBuff`) darf bleiben, aber nur mit Eintrag in der Ausnahmeliste („Legacy-Fehlverhalten, Regelzitat: Kategorie kommt aus Template“) und Test T1/T7 auf `getSegmentIdForOption`-Ebene.

**K2 — Enrichment härten oder zurückbauen**
Entscheidung: Enrichment ist nur ein Übergangs-Lesemodell bis E. Dann: (a) nur anwenden, wenn die Zeile **weder** `powerTemplateId` **noch** `artifactFunctionId` trägt; (b) Felder atomar aus der Katalogzeile übernehmen, niemals `||`/`??` je Feld; (c) `system.echoKey`-Fallback entfernen; (d) in ein Util `src/utils/artifact-row-identity.ts` ziehen und **überall** verwenden, wo `levelProgression` mechanisch gelesen wird (Radial, Reactions, Aggregator, `action-economy`, Preflight) — sonst entfernen. Test: Fixture mit umbelegter Zeile → keine Übernahme; Fixture ohne Identität → vollständige Übernahme.

**K3 — `useAuthoredLevelProgression` begründen oder zurücknehmen**
Snapshot-Test `buildEchoArtifactTree` für Titan Scars, Hollow Crown, Ringchain mit und ohne Flag (Zeileninhalte, `system`-Felder außer Identität). Nur identische Ausgabe → Flag darf bleiben; sonst Revert und Identität ausschließlich über Builder-Z2-Pfad.

**K4 — Preflight vervollständigen (nur lesend)**
`suggestedIdentity` befüllen (Basis `flags.powerId`, `templateName-exact`, `echoArtifactKey+level`); `disposition` daraus ableiten; P2 nach Plan (kein Throw, Fehlereintrag). Hooks: World-`ready` (GM-Whisper + Button „Bericht öffnen“, JSON/Markdown-Export), Combat-Start-Whisper. Kein Eingriff, kein Dialog-Block (das kommt erst mit C2).

**K5 — Shadow-Hygiene und Cluster-Reports**
Dedupe je `siteId + stabiler Schlüssel` (templateId/echoArtifactKey+level/itemId), Cap (z. B. 500), `npc-attack`/`maneuver` nicht loggen, GM-Export-Makro. Shadow an die fehlenden Cluster anbauen: Attack-Executor (Limited, Breath-Modus), `growthPowerLevelFor` (vs. `option.rank`/`artifactLevel`), `isSanctionedDR/Phasing` (vs. ID-Sets), Reaction-Klassen, Specials (Ref vs. String). Je Cluster ein Shadow-Report über Fixtures unter `docs/audits/shadow/`.

**K6 — Identity-Matrix und scharfer Guard**
`tests/identity-matrix.test.ts`: `ALL_POWER_TEMPLATES × 16` + alle Katalog-Artefaktzeilen gegen die Legacy-Klassifizierer; Abweichungen nur über `tests/__fixtures__/identity-exceptions.json` mit Regelzitat. Guard: Allowlist als `datei:zeile:begründung`, Fehler bei jedem neuen Treffer, Import-Guard für `src/combat/**`. T4/T5/T7/T8/T9c/T12/T13/T16/T17/T18 ergänzen.

**K7 — Migration produktionsfähig machen (weiter nur Fixtures)**
Effekte via `effect.update()`; Backup als Array je Pfad; Rollback für `levelProgression`-Zeilen und Effekte; `progressionPicks[].authoredStages` mitpatchen; Review-Dialog (Muster `df-2026-migration-review-dialog.ts`) mit vier Abschnitten, Vorher/Nachher, Einzelbestätigung; Quittierungsflag im Dialog. Tests M3/M4/M6/M7 + `update`-Spies + Idempotenz nach Rollback. Danach Dry-Run gegen eine **Kopie** der Referenzwelt — Bericht ablegen, nichts anwenden.

**K8 — C2 in Planreihenfolge, pro Cluster ein Commit-fähiger Diff**
Erst nach K1–K7 und Gate (0 Shadow-Abweichungen außerhalb Ausnahmeliste, 0 blockierende Preflight-Einträge in der migrierten Referenzkopie). Reihenfolge d (Executor Limited/Breath; kein Modus-Default) → e (Heal/Cleanse: Textzweige löschen, `option.rank` nutzen) → c (Artefaktzeilen: `classifyArtifactRowType`, `growthPowerLevelFor`, `isBreathWeaponName`-Routing, `isUltimateProgressionRow` → `artifactFunctionId`) → a (Segment: `textSuggestsActiveBuff`, Tag-Routing) → b (DR/Phasing ID-Sets) → f (Reactions) → g (Specials als `{key, rank}`). Je Cluster: Löschung im selben Diff, Guard scharf für den Cluster, Golden identisch außer Ausnahmeliste, fail-closed-Tests, Playwright-Smoke.

**K9 — Freigabepflichtig (nicht ohne gesonderte Entscheidung)**
Pack-Rebuild, Migration der Produktivwelt, Release-Gate G1–G10, Archify-Diagramm.

## 8. Offene Regelthemen (unverändert, nicht Teil des Korrekturauftrags)

- 14.1b: `CLEANSE_MELEE_SINGLE`, `CLEANSE_*_AOE`, Radius-Tabellen vs. `Actives.md`.
- 14.8 / K5: Scarred-Bar Restoration mit vollen HP (PH) vs. ohne HP (`Actives.md`); Code folgt PH.
- 14.7: Moonlight Mending → retired `active-ranged-single-heal`.
- K1-Regel-Lücke: fehlende AoE-Restoration-Tabelle in `Actives.md`.

## 9. Aussage

**BLOCKED.** Nicht cutover-fähig und in diesem Zustand nicht releasefähig: Build rot (F1); zwei Cutover-Schritte außerhalb der genehmigten Reihenfolge mit möglichem stillen Mechanikverlust bzw. inkonsistentem Ressourcenverbrauch (F2, F3); Enrichment mechanisch unsicher (F4/F5); Migration ohne Persistenz, Rollback und UI (F7–F9); Guard und Identity-Matrix nicht vorhanden. Nach K0–K7 ist eine Neubewertung als PARTIAL realistisch; READY FOR CUTOVER erst nach K8-Gates je Cluster.
