# Direkt in Cursor einfügen — DF Skill Roll UX (24.10.2026)

Setze die bestehende DF-2026-Foundry-Migration fort. Implementiere jetzt die zwei Skill-Wurf-Einstiegspunkte vollständig; beginne keine neue Migration.

Lies vorher vollständig die drei beigefügten Dateien unter `docs/cursor-migration/`:

1. `CURSOR_DF_DUAL_SKILL_ROLL_DIALOG_IMPLEMENTATION_2026-10-24.md` — der verbindliche Implementierungsauftrag mit Abläufen, Wireframes, Berechnung und Tests.
2. `Destroyed_Faith_Players_Guide_Post_Roll_Skill_Raises_2026-10-24.md` — die aktuelle vollständige Homebrewery-Regelquelle. Der neue Skill-Raise-Ablauf ersetzt ältere Aussagen zu Vorab-Verteilung der Skill-Raise-Wirkungen.
3. `DF_DUAL_SKILL_ROLL_LAYOUT_PREVIEW_2026-10-24.html` — interaktiver Layout- und Zustandsprototyp; Designreferenz, kein produktionsfähiger Foundry-Code.

Die Anforderung hat GENAU ZWEI Einstiegspunkte mit EINEM gemeinsamen Skill-Roll-Dialog:

- Spieler klickt im Character Sheet auf eine Specialization oder Perception: Basis-TN für diesen Check eingebbar, Paid Raises als Dropdown, Final TN sofort sichtbar.
- SL erstellt über den bestehenden Chat-Roll-Request eine Anfrage mit fester Basis-TN und adressierten Spielern: Spieler sehen dasselbe Roll-Overlay mit gesperrter SL-Basis-TN, wählen aber individuell Paid Raises und erhalten dadurch individuelle Final TNs.

Free Raises werden bei Rank 4/6/8 nur als Information angezeigt und nach erfolgreichem Wurf automatisch verfügbar. Ihre und die Paid-Raise-Wirkungen werden erst DANN kompakt auf der Ergebnis-Chat-Card verteilt. Skill/Social-Challenge-Ausnahme: Combat und Rituale behalten ihre Pre-Roll-Zuweisung. Keine Aid-Restaurierung, Skill Points oder parallelen Roll Engines.

Implementiere produktiven Foundry-14-Code, keine Mockups oder weitere Analysen als Endergebnis. Führe `npx tsc --noEmit`, `npm test`, `npm run build` aus. Berichte tatsächliche Änderungen und Testergebnisse auf Deutsch. Foundry-Live-Tests ausschließlich in isolierter Testwelt. Kein Commit, Tag oder Release ohne Freigabe.
