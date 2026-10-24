# Prompt: Mastery System / Destroyed Faith — Homepage Character Builder (DF 2026)

> **So benutzt du dieses Dokument:** Kopiere den kompletten Ordner
> `docs/homepage-character-generator/` (dieses Dokument + `data/*.json`) zusammen mit den
> unter **Abschnitt 1** gelisteten CSS-/Referenzdateien in das Homepage-Projekt und gib
> dieses Dokument als Prompt an den umsetzenden Entwickler / die KI. Alles Nötige steht
> hier drin; die JSON-Dateien sind 1:1 aus dem Foundry-System exportiert und sind die
> **einzige Wahrheit** für Inhalte (keine Texte erfinden, nichts umformulieren).

---

## 0. Auftrag (DF 2026)

Baue / aktualisiere den **Web-Charakter-Generator** auf `/character-builder` (statisch, ohne Foundry VTT),
so dass er dem Foundry-Creation-Flow (Character Sheet creationGuideTabs) entspricht.

**Bookmark-Tabs (Finalize-Gates — ohne Equipment):**

1. **Attributes & Stones** — Spread `4,4,3,3,2,2,2` auf Werte `[2,3,4]`; genau **2** Starting Attribute Stones; danach **Echo Imprints** (max = Mastery Rank, hier **2**; nur Attribute ≥ 4)
2. **Echo** — Wahl, Sub-Choice / Unbound, Veiled Form, Artefakte, Languages — **ohne** Start-Card-Pflicht
3. **Specializations** — genau **5** Specs à **Rank 2**; Fields aus `specialization-fields.json`; Hinweis: **Perception Rank 2 gratis**, belegt keinen Spec-Slot
4. **Powers** — nur Combat-Package-Wizard (`skipIdentitySteps` — Identität liegt in Tabs 1–3)
5. **Disadvantages** — 0–8 Punkte → Reroll Points

**Nicht nachbauen:** Porträt/Token, XP/Reroll-Boxen als Edit-UI, Equipment-Tab als Finalize-Gate, Summons, Rituals, Minor Magic, Skill-Leiter, Stress, Minor Expressions, Start-Card als Pflicht-Gate.

**Endprodukt:** Export-JSON mit **`schemaVersion: 1`** (siehe Abschnitt 10 / `docs/character-import-schema.md`), importierbar in Foundry unter Actors → Import Character.

---

## 1. Transfer-Paket

### 1.1 Daten (`data/`) — 1:1 aus dem System

> Regenerieren: im Systemprojekt `npm run build`, dann `npm run export:homepage-generator`.

| Datei | Inhalt |
|---|---|
| `creation-rules.json` | DF 2026: Spread `[4,4,3,3,2,2,2]`, erlaubt `[2,3,4]`, Spec-Budget 5×R2 / 20 Creation Points, 2 Starting Stones, Perception Rank 2, Disadvantages 0–8, `defaultMasteryRank: 2` |
| `specialization-fields.json` | **Neu** — 7 Fields + Labels |
| `echo-imprints.json` | **Neu** — 28 Katalog-Einträge + Min-Attr / Tiers |
| `skills.json` | **Nur Archive/Print** — nicht für Creation-UI |
| `echoes.json` | 7 Echoes inkl. Cards (optional, nicht Finalize-Gate) |
| `unbound-identities.json` | Unbound Responses + Predator Shapes/Stones |
| `echo-artifacts.json` | Echo-Artefakte + Selection Rules |
| `languages.json` | Sprachen, Common, Echo-Locks, Starting Picks |
| `disadvantages.json` | Alle Nachteile inkl. Fields / Presets |
| `tower-wizard-copy.json` | Wizard-Texte (wörtlich) |
| `tower-wizard-packages.json` | Defense/Offense-Pakete |
| `tower-wizard-guided.json` | Guided Option-Katalog (Cards, Previews) |

### 1.2 Styles (aus dem Systemordner `styles/` mitkopieren)

| Datei | Zweck |
|---|---|
| `styles/df-rulebook-ui.css` | Basis-Palette (`--df-*`), Dialog-Chrome, Buttons |
| `styles/mastery-themes.css` | `--ms-*` Variablen |
| `styles/character-sheet.css` | Tabs, Attribute, Specs/Skills-Zeilen, Echo-/Disadvantage-Dialoge, Gold-Glow |
| `styles/tower-wizard.css` | Combat Package Wizard |

Werte nicht ändern; unnötige Foundry-Selektoren dürfen entfallen.

### 1.3 Referenz-Markup (Nachschlagen)

| Datei | Was |
|---|---|
| `templates/actor/character-sheet.hbs` | Sheet-Tabs / Attributes |
| `src/utils/creation-tab-guide.ts` | Creation-Guide-Tab-Reihenfolge |
| `src/sheets/character-sheet-echo-dialog.ts` | Echo-Dialog |
| `src/sheets/echo-imprints-dialog.ts` | Echo Imprints |
| `src/sheets/specializations-dialog.ts` | Specs |
| `templates/creation/tower-wizard/wizard-shell.hbs` | Combat Package Wizard |
| `docs/character-import-schema.md` | Export-/Import-Schema v1 |

---

## 2. Design-System

Dunkles Rulebook-Theme. Token aus `df-rulebook-ui.css` / `mastery-themes.css` übernehmen (keine neuen Paletten erfinden). Gold-Glow für offene Creation-Schritte beibehalten. Kein `transform: translateY` auf Buttons.

---

## 3. Globales Layout

- Header: nur **Namensfeld** + Fortschritt / Remaining-Zeile
- Bookmark-Tabs analog Foundry (Labels DE/EN über Homepage-i18n; Regeltexte aus JSON)
- Finalize / Download nur wenn alle Gates ok (Abschnitt 9)

---

## 4. Step 1 — Attributes & Stones + Echo Imprints

Daten: `creation-rules.json`, `echo-imprints.json`.

- Verteile die sieben Attribute exakt als Multiset `[4,4,3,3,2,2,2]` (erlaubt nur `2|3|4`).
- Platziere genau **`startingAttributeStones`** (2) Attribute Stones; `permanentColorless` = 0.
- **Echo Imprints:** bis `defaultMasteryRank` (2) wählbar; nur Imprints deren Attribute ≥ `minAttribute` (4); Katalog wörtlich aus `echo-imprints.json`.
- Keine Skill-Leiter, kein Stress, keine Minor Expressions.

---

## 5. Step 2 — Echo

Daten: `echoes.json`, `unbound-identities.json`, `echo-artifacts.json`, `languages.json`.

- Echo wählen inkl. Sub-Choice / Unbound / Veiled Form / Artefakte wie Foundry-Dialog.
- **Start-Card ist optional** — kein Finalize-Gate.
- Languages: Common gesperrt; Echo-Locks erzwingen; mindestens `startingPickedLanguages` zusätzlich.

---

## 6. Step 3 — Specializations

Daten: `specialization-fields.json`, `creation-rules.json`.

- Genau **5** Specs, je **Rank 2** (20 Creation Points / 2 pro Rank).
- Jede Spec: Name, Field (eines der 7), Scope (ein Satz), Rank fest 2 bei Creation.
- UI-Hinweis: **Perception Rank 2 is free** — belegt keinen Spec-Slot.
- Optional: Vorschläge aus `specialization-fields.json` → `examples` (8 pro Field, Name + Scope); freie Namen bleiben erlaubt.
- `skills.json` nicht als Creation-UI verwenden.

---

## 7. Step 4 — Powers (Combat Package Wizard only)

Daten: `tower-wizard-*.json`.

- Nur Combat-Package-Schritte (Defense → Passive2 → Buff → Offense / Delivery).
- Identity-Steps (Attributes/Echo/Specs) **nicht** erneut im Wizard.
- Ergebnis: immer **6** Powers (via `combatPackage` im Export).

---

## 8. Step 5 — Disadvantages

Daten: `disadvantages.json`, `creation-rules.json`.

- 0–8 Punkte; Punkte = starting Faith Fractures / Reroll-Budget analog Foundry.
- Formulare / Presets aus JSON; Texte wörtlich.

---

## 9. Validierung (Finalize)

| Gate | Bedingung |
|---|---|
| Attributes | Multiset `4,4,3,3,2,2,2` |
| Stones | Summe = 2; Colorless = 0 |
| Echo Imprints | ≤ MR; Attr ≥ 4; bekannte Ids |
| Echo | Key gesetzt; Artefakt-Rules erfüllt; Languages ok |
| Specializations | 5 × Rank 2; gültige Fields; Scope nicht leer |
| Powers | gültiges `combatPackage` → 6 Grants |
| Disadvantages | 0–8 Punkte |
| Name | nicht leer |

Gold-Glow + Remaining-Zeile an Specs/Imprints/Stones anpassen (nicht an alte 40er Skill-Punkte).

---

## 10. Output-Schema (Export-JSON)

**Immer `schemaVersion: 1`.** Siehe auch `docs/character-import-schema.md`.

```json
{
  "schemaVersion": 1,
  "exportKind": "mastery-character-import",
  "systemId": "mastery-system",
  "character": {
    "name": "…",
    "masteryRank": 2,
    "attributes": { "might": 4, "agility": 4, "vitality": 3, "intellect": 3, "resolve": 2, "influence": 2, "wits": 2 },
    "stones": { "might": 1, "agility": 1 },
    "permanentColorless": 0,
    "specializations": [
      { "name": "…", "field": "physical", "scope": "…", "rank": 2 }
    ],
    "echoImprints": ["imprint-id"],
    "echo": { "key": "…", "subChoiceKey": "…", "artifactKeys": ["…"] },
    "languages": { "known": ["common", "…"] },
    "combatPackage": { },
    "disadvantages": [],
    "creationComplete": true
  }
}
```

- Kein `skills` / `minorExpressions` in neuen Exports.
- Website-interne Speicherung darf Specs/Imprints spiegeln; Legacy-`skills`-JSON weiter laden mit Warnung, nicht auto-konvertieren.

---

## 11. i18n

- Chrome (Intro, Tabs, Buttons, Remaining, Continue, Export): DE/EN auf der Homepage.
- Regeltexte (Echo, Wizard-Copy, Disadvantages, Imprints): wörtlich aus Export-JSON (Foundry-Quelle).

---

## 12. Akzeptanzkriterien

1. Tabs: Attributes → Echo → Specs → Powers → Disadvantages.
2. Attribute-Spread + 2 Stones; Imprints ≤ 2 bei MR 2, Attr ≥ 4.
3. Genau 5 Specs à Rank 2; Perception gratis dokumentiert.
4. Echo ohne Start-Card-Pflicht; Artefakte/Sprachen wie Foundry.
5. Combat Package → 6 Powers; Identity nicht doppelt im Wizard.
6. Disadvantages 0–8; Finalize nur bei erfüllten Gates.
7. Export `schemaVersion: 1` importiert in Foundry (Specs, Imprints, Stones, Package erhalten).
8. Daten aus aktuellem `npm run export:homepage-generator`.
9. Kein Stress / keine Skill-Leiter / keine Minor Expressions in der Creation-UI.
