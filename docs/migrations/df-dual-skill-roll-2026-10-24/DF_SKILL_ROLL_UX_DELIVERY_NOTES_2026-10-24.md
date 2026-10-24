# Lieferung / Kurzprüfung — Skill Roll UX, 24.10.2026

## Designentscheidung

Der Skill Roll behält die bereits vereinbarte Grundformel `Base TN + 4 × Paid Raises`. Bei ordinary Skills (einschließlich Social Challenges und Perception) wird vor dem Wurf ausschließlich die Anzahl der Paid Raises gewählt. Free Raises sind automatisch auf Erfolgschecks verfügbar und werden zusammen mit den Paid Raises erst nach einem erfolgreichen Wurf zu konkreten, spielweltlich passenden Wirkungen zugeordnet. Combat und Rituals behalten die Festlegung aller ihrer Raise-Effekte vor dem Wurf.

## Zwei Einstiegsorte

- Character Sheet → gemeinsamer Spieler-Würfeldialog, lokale Basis-TN auswählbar.
- GM Chat Roll Request → GM legt Basis-TN fest; Zielspieler sehen denselben Spieler-Würfeldialog mit gesperrter Basis-TN und eigener Paid-Auswahl. Einzelne Final TN pro Charakter.

Das Layout liegt als allein lauffähiges HTML mit echten Auswahlfeldern, reaktiver Final-TN-Anzeige, verschiedenen Demo-Skill-Rängen und einer interaktiven Chat Raise-Verteilung vor. Es ist eine **Browser-Demonstration**, keine Foundry-Implementierung. Die JavaScript-Syntax wurde durch `node --check` validiert; ein vollständiger Foundry-Livetest ist hier nicht möglich.

## Rechenreferenz

| Skill Rank | Free nach Erfolg | Paid vor Roll maximal | Beispiel Base TN 12 + Paid 2 |
|---:|---:|---:|---|
| 2 | 0 | 2 | TN 20, 2 Raises auf Erfolg |
| 4 | 1 | 3 | TN 20, 3 Raises auf Erfolg |
| 6 | 2 | 4 | TN 20, 4 Raises auf Erfolg |
| 8 | 3 | 5 | TN 20, 5 Raises auf Erfolg |

Die vollständige Homebrewery-Markdown-Datei wurde gegenüber `Destroyed_Faith_Players_Guide_Perception_Rank2_2026-10-23.md` gezielt auf diesen Skill-Flow aktualisiert; 270 manuell getrennte Quellseiten und 16 Core Rituals bleiben erhalten. Widersprechende alte Skill- und Social-Challenge-Beispiele wurden angepasst, ebenso zwei alte Free-Raise-TN-Fehler in Forensics/Streetwise (Rank5/4 bei Base TN16 und einem Paid Raise → TN20).

## Zu beachten

Der Prototyp abstrahiert Schauspieler, Roll Engine und Berechtigungen. Der Cursor-Auftrag muss die vorhandenen tatsächlichen APIs, ChatMessage-Flags, Actor-Permissions und ApplicationV2-Routes im Repository aufgreifen; es sollen keine redundanten Systeme eingeführt werden. E2E-Tests sind in einer isolierten Foundry-V14-World erforderlich; der produktive Forge-Kampagnenzustand darf dafür nicht verwendet werden.
