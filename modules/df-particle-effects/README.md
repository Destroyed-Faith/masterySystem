# Destroyed Faith – Particle Effects

Eigenständiges Foundry-VTT-Modul für **visuelles Feuer innerhalb von Szenenregionen**. Es gehört zum Destroyed-Faith-Projekt, greift aber nicht in die Regeln des Mastery-Systems ein und kann allein installiert werden.

- Modul-ID: `df-particle-effects`
- Anzeigename: **Destroyed Faith – Particle Effects**
- Behavior in der Regionenliste: **DF: Particle Effects**
- Zielversion: **Foundry VTT 14** (`compatibility.minimum` und `verified` sind 14). V13 wurde nicht geprüft und wird nicht behauptet.
- Einziger Effekt in dieser Version: **Natural Fire** / Natürliches Feuer

Die Lizenz ist die Destroyed-Faith-Lizenz aus dem Repository (`LICENSE.md` im Projektroot). Die Flammenbilder sind projekteigene Standbilder, keine FXMaster+-Assets.

## Bedienung

Es gibt **kein Symbol in der linken Toolbar**. Der Effekt hängt an der normalen Regionenkonfiguration.

1. Szene öffnen und die Ebene **Regions** wählen.
2. Ein Polygon, Rechteck oder eine Ellipse zeichnen. Eine schon vorhandene Region geht genauso. Mehrere Formen und Löcher gehören zu derselben Region.
3. Die Region doppelklicken.
4. Reiter **Behaviors** öffnen und **Create / Add Behavior** wählen.
5. In der Liste **DF: Particle Effects** wählen (Feuer-Icon).
6. **Effect Type** auf **Natural Fire** lassen, Dichte und Größe nach Bedarf setzen, dann speichern.

Das Feuer erscheint nur in dieser Region, auf der Karte und unter Token. Die Hintergrundkarte wird nicht abgedunkelt. Klicks auf Token und Regionen gehen durch den Effekt hindurch.

Erneutes Öffnen und Speichern übernimmt die neuen Werte. **Enabled** aus, das eingebaute **Disabled** der Behavior, oder Löschen des Behaviors entfernt das Feuer sofort. Die Werte liegen in `RegionBehavior.system` und bleiben nach Neuladen und Szenenwechsel erhalten. Mehrere Regionen und mehrere Behaviors in einer Szene laufen unabhängig.

GM und Spieler sehen dieselben Flächen, weil Foundry die Behavior-Daten synchronisiert. Die Flacker-Animation läuft lokal.

### Felder

| Feld | Standard | Bedeutung |
| --- | --- | --- |
| Enabled | an | Schaltet nur diesen Effekt aus. |
| Effect Type | Natural Fire | Einziger Typ in V1. Das Feld ist für spätere Typen offen. |
| Density | 40 | Feuerstellen relativ zur Regionsfläche in Rasterzellen, nicht zur Fenstergröße. 0 blendet Flammen aus. |
| Flame Scale | 1 | Größe relativ zum Szenenraster. Die Basis bleibt am Boden. Bereich 0,25–2. |
| Flame Speed | 1 | Tempo von Flackern, Wiegen und Funken. Bereich 0,1–3. |
| Opacity | 0,9 | Deckkraft. |
| Ember Amount | 20 | Funken relativ zur Flammenzahl. 0 schaltet Funken ab. |
| Edge Fade | 5 | Zusätzliche Ausblendung nahe am Rand. Die harte Maske gilt immer, auch bei 0. |
| Random Seed | leer | Leer oder 0 leitet den Seed aus Szene, Region und Behavior ab. Eine andere Zahl mischt nur dieses Feuer neu. |

Unter **Configure Settings → Destroyed Faith – Particle Effects → Fire quality** gibt es Low / Medium / High. Das ist eine lokale Obergrenze und ändert die gespeicherte Region nicht. Standard ist Medium.

Nicht enthalten: Rauch, Lichtquellen, Brandausbreitung, Schaden, Zustände, Hex-Automaten.

## Installation in Foundry

Der Ordner muss so liegen, dass `module.json` direkt darin steht:

```text
Data/modules/df-particle-effects/module.json
```

1. Foundry vollständig beenden.
2. Den Ordner `df-particle-effects` nach `Data/modules/` kopieren, oder das ZIP so entpacken, dass genau dieser Pfad entsteht. Im ZIP gibt es eine `module.json`, nicht zwei ineinander verschachtelte.
3. Foundry neu starten.
4. In der Welt **Destroyed Faith – Particle Effects** aktivieren.

Das Modul verlangt das Mastery-System nicht. Es läuft in einer Destroyed-Faith-Welt neben FXMaster Free, Wänden, Sicht und den normalen Foundry-Regionen.

## ZIP bauen

Im Repository-Root:

```bash
node modules/df-particle-effects/scripts/package.mjs
```

Das schreibt `release/df-particle-effects.zip`. Der Ordner `release/` ist im Repository ignoriert; das ZIP ist ein Bauartefakt, kein Commit. Das Archiv enthält den Ordner `df-particle-effects/` mit `module.json` an erster Ebene darin.

Prüfen:

```bash
tar -tf release/df-particle-effects.zip
```

Erwartet ist ein Eintrag `df-particle-effects/module.json`.

## The Forge

Manifest-URL für Foundry und The Forge:

`https://raw.githubusercontent.com/Destroyed-Faith/masterySystem/main/modules/df-particle-effects/module.json`

Das ZIP hängt am System-Release, aktuell `v0.9.720`, Datei `df-particle-effects.zip`. Foundry liest `download` aus der Manifest-Datei.

Ohne Manifest, direkt auf The Forge:

1. Das ZIP wie oben bauen.
2. Auf The Forge einloggen und **My Foundry** öffnen.
3. Den **Import Wizard** starten und **ZIP File** wählen.
4. `df-particle-effects.zip` hochladen, **Analyze Files** ausführen und die Auswahl importieren.
5. Das Spiel neu starten und das Modul in der Welt aktivieren.

Der Import Wizard erwartet ein Modul und keine verschachtelte zweite `module.json`. Dieses ZIP ist so gepackt. The Forge hat keinen lokalen Ordner `Data/modules` auf dem eigenen Rechner; der Wizard ist der Weg für ein selbst gebautes Modul. Der Bazaar ist dafür nicht nötig.

## Was der Effekt tut

Die PNGs sind **verschiedene Standbilder**, keine Animationsfolge. Jede Flamme behält ihre Variante. Bewegung kommt aus unabhängiger Skalierung, Deckkraft, leichtem Kippen und einer kleinen Drehung um den Pivot an der Basis (`sprite_manifest.json`, meist `0.5, 0.93`). Darüber liegen oft eine zweite und eine kleine Flamme. Funken steigen nach oben, driften seitlich und blenden aus.

Die Geometrie kommt von Foundrys `RegionDocument#polygonTree` (Fläche, Grenzen, `testPoint`, `testCircle`). Rechtecke, Ellipsen, Polygone, mehrere Formen und Löcher sind darin schon aufgelöst, einschließlich als Region gezeichneter Hex-Polygone. Eine eigene Hex-Engine gibt es nicht.

Die Maske zeichnet den Polygonbaum in den **Primary Canvas Group**, Sortierband **Tiles** (500): gefüllte Formen, danach `cut()` für Löcher, Inseln in Löchern wieder gefüllt. Das entspricht PixiJS 8, das Foundry 14 mitliefert. `fill` hat dort kein Even-Odd-Argument. Das Band liegt über dem Szenenhintergrund (0) und unter Token (700). Es wird kein Filter auf die Szene gelegt. Texturen lädt `foundry.canvas.loadTexture` einmal und teilt sie. Die Animation hängt am Canvas-Ticker und wird beim Szenenwechsel entfernt.

Dichte rechnet `Fläche / Zellfläche × 0,62 × Dichte/100`. Quadratraster nutzt `sizeX × sizeY`. Hexraster nutzt davon 75 Prozent, die Fläche eines regelmäßigen Sechsecks in seiner Bounding-Box. Sehr große Regionen werden auf das Qualitätslimit gekürzt und die erlaubten Feuerstellen über die ganze Fläche verteilt, damit sie nicht an einer Stelle klumpen. Medium erlaubt etwa 80 Flammenstellen und 60 Funken pro Region sowie 180 / 140 in der ganzen Szene.

## Manuelle Tests in Foundry

Automatisch geprüft werden Seed, Dichte, Löcher in der Punktverteilung, Budget, Manifest und PNG-Größen. Die folgenden Punkte brauchen eine laufende Foundry-14-Instanz:

1. Region zeichnen, doppelklicken, Behaviors → Create Behavior: **DF: Particle Effects** steht in der Liste.
2. Natural Fire, Dichte und Größe ändern, speichern: Flammen nur in dieser Region.
3. Dieselbe Behavior erneut öffnen, Intensität ändern, speichern: das Feuer ändert sich sichtbar.
4. Polygon oder Hex-Region: kein Feuer außerhalb. Ein Loch bleibt frei.
5. Neu laden und die Szene wechseln: Effekt und Werte bleiben.
6. Zwei Regionen mit verschiedenen Werten laufen unabhängig.
7. Deaktivieren oder Löschen entfernt das Feuer ohne zurückbleibende Partikel.
8. Karte, Token, Wände, Sicht, FXMaster Free und andere Regionen bleiben bedienbar. Die Karte wird nicht schwarz.
9. Dieselbe Szene als GM und als Spieler öffnen. Beide sehen das Feuer. Spieler brauchen keine Bearbeitungsrechte an der Region.
10. Eine zweite große Region anlegen: keine Konsolenfehler, keine dauerhaften Timer nach dem Szenenwechsel, die Bildrate bleibt brauchbar.

## Technische Grenzen

- Nur Foundry 14. Die API ist an der V14-Dokumentation geprüft (`RegionBehaviorType`, `CONFIG.RegionBehavior.typeLabels` / `typeIcons` / `dataModels`, `PolygonTree.testPoint` / `testCircle` / `area` / `bounds`, `PrimaryCanvasGroup.SORT_LAYERS`). In dieser Arbeitsumgebung lief keine Foundry-Instanz.
- Die Maske setzt PixiJS 8 voraus (`Graphics.poly`, `fill` und `cut`). Fehlt das, wird der Effekt für diese Region ausgelassen, statt unmaskiert über die Karte zu zeichnen. Ein Loch, das Foundry nicht vollständig in seine Elternform legt, schneidet Pixi unter Umständen nicht sauber aus.
- Edge Fade ist eine zusätzliche Alpha-Stufe über `testCircle`. Die harte Grenze ist die Maske.
- Die Qualitätsbremse macht große Flächen dünner, statt immer dichter zu bleiben.
- Szenen-Levels von Foundry 14 werden nicht gesondert gefiltert. Die Höhe des Containers ist die untere Regionshöhe, oder 0 wenn sie offen ist.
- `flames_atlas.png` und `flames_atlas.json` liegen bei, werden aber nicht geladen. Die Laufzeit nutzt die Einzel-PNGs.
- Wand-Einschränkungen gelten nur soweit, wie Foundry sie schon im `polygonTree` abgebildet hat.
- Der Effekt würfelt nicht, zieht keine Lebenspunkte ab und schreibt keine Token-Werte.
