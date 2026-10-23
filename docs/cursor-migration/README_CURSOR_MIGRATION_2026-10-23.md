# Destroyed Faith — Cursor Migration Package

Enthalten:

1. `CURSOR_MASTER_MIGRATION_DESTROYED_FAITH_2026-10-23.md` — umfangreiche Implementierungsspezifikation fuer Cursor (ca. 8300 Woerter).
2. `Destroyed_Faith_Players_Guide_Editorial_Condensed_2026-10-23.md` — vollstaendiges, aktuellstes Homebrewery-Player's-Guide-Dokument; normativ fuer die Migration.
3. `CURSOR_START_HERE_2026-10-23.md` — kurze Nachricht zum Einfuegen in Cursor Agent Mode.
4. `Guided Character Builder.txt` — historisches UX-Konzept, NICHT als aktuelle Regelreferenz verwenden.

## Verwendung

1. ZIP auspacken und die enthaltenen Dateien in einen gut auffindbaren Ordner deines Mastery-System-Repositories kopieren, z.B. `docs/cursor-migration/`. Bestehende Verzeichnisstrukturen muessen nicht geaendert werden.
2. Repository in Cursor oeffnen; Agent Mode waehlen.
3. Den Inhalt von `CURSOR_START_HERE_2026-10-23.md` als Nachricht senden; beide anderen Markdown-Dateien namentlich referenzieren bzw. mit `@` verlinken. Wenn Cursor die Dateien nicht findet, den relativen Pfad angeben.
4. Cursor soll den Gesamtauftrag in Phasen umsetzen, den Plan unter `docs/migrations/` anlegen und nach jeder Phase Tests ausfuehren. Fuer einen weiteren Cursor-Chat den Plan und die letzte QA-Datei referenzieren, damit er anknuepfen kann.
5. Vor Migration bestehender Foundry-Welten ein Actor/World-Backup erstellen. Der Auftrag untersagt stille destruktive Konvertierungen.

Die Quelle ist eine Homebrewery-Markdown-Datei; sie ist keine direkt ausfuehrbare Software. Es wurde hier **kein** Live-Repository geaendert. Cursor muss die tatsaechlichen Dateipfade, Datamodelle und APIs erst ermitteln.
