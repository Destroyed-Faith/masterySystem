# Character Import JSON (Homepage → Foundry)

Import characters built on the **homepage** into Foundry VTT using the Mastery System module.

- **In Foundry (GM):** Actors sidebar → **Import Character** button, or paste JSON into the dialog.
- **API:** `game.modules.get('mastery-system').api.importCharacterFromJson(text)`

---

## File header (required)

Every import file must be a single JSON object:

```json
{
  "schemaVersion": 1,
  "exportKind": "mastery-character-import",
  "systemId": "mastery-system",
  "systemVersion": "0.9.153",
  "exportedAt": "2026-06-23T12:00:00.000Z",
  "character": { }
}
```

| Field | Required | Description |
|--------|----------|-------------|
| `schemaVersion` | yes | Always `1` for this spec |
| `exportKind` | yes | `mastery-character-import` or `mastery-foundry-actor` |
| `systemId` | yes | Must be `mastery-system` |
| `systemVersion` | no | Homepage / export tool version (informational) |
| `character` | yes* | Compact build payload (*unless using foundry-actor kind) |
| `actor` | yes* | Full Foundry actor (*only for `mastery-foundry-actor`) |

---

## Format A — `mastery-character-import` (recommended for homepage)

Compact build description. The module expands **power templates** from the catalog and creates the actor.

### Minimal example (DF 2026 homepage Creation)

Homepage Creation uses attribute values **2–4** (spread `4,4,3,3,2,2,2`), **Mastery Rank 2**, five Rank-2 Specializations, Echo Imprints, and exactly **2** starting Attribute Stones. Always send `schemaVersion: 1`.

```json
{
  "schemaVersion": 1,
  "exportKind": "mastery-character-import",
  "systemId": "mastery-system",
  "character": {
    "name": "Alaris",
    "masteryRank": 2,
    "attributes": {
      "might": 4,
      "agility": 4,
      "vitality": 3,
      "intellect": 3,
      "resolve": 2,
      "influence": 2,
      "wits": 2
    },
    "stones": { "might": 1, "agility": 1 },
    "permanentColorless": 0,
    "specializations": [
      { "name": "Acrobatics", "field": "finesse", "scope": "Balance and tumbling", "rank": 2 },
      { "name": "Athletics", "field": "physical", "scope": "Climbing and swimming", "rank": 2 },
      { "name": "Stealth", "field": "finesse", "scope": "Moving unseen", "rank": 2 },
      { "name": "Investigation", "field": "investigation", "scope": "Searching scenes", "rank": 2 },
      { "name": "Persuasion", "field": "social", "scope": "Convincing others", "rank": 2 }
    ],
    "echoImprints": ["mage-hand", "catfall"],
    "echo": { "key": "dwarfs", "artifactKeys": ["stoneboundSoles"] },
    "languages": { "known": ["common"] },
    "combatPackage": {
      "defenseId": "evade",
      "secondPassiveTemplateId": "passive-temp-hp",
      "activeBuffMode": "defensive",
      "offenseActivePicks": [
        { "pickId": "active-melee-weapon-single", "templateId": "active-melee-weapon-single" },
        {
          "pickId": "active-melee-damage-t4::ignite",
          "templateId": "active-melee-damage-t4",
          "special": "ignite"
        }
      ],
      "delivery": "melee",
      "weakenSave": null
    },
    "disadvantages": [],
    "creationComplete": true
  }
}
```

### `character` fields

| Field | Required | Notes |
|--------|----------|-------|
| `name` | yes | Actor display name |
| `attributes` | yes | Plain numbers (Creation: **2–4**; in-play imports may be higher) |
| `stones` | yes if `creationComplete` | Attribute → stone count; sum must be **2** at Creation |
| `permanentColorless` | no | Default `0` at Creation → `system.progression.permanentColorless` |
| `specializations` | yes if `creationComplete` | Exactly **5** Specs at **Rank 2** (DF 2026) |
| `echoImprints` | no | Catalog ids; max count = Mastery Rank; governing Attr ≥ 4 |
| `powers` **or** `combatPackage` | yes | Exactly **6** powers at creation (see below) |
| `masteryRank` | recommended | Homepage Creation: always send **`2`** (import fallback without field is still 4) |
| `img` | no | Portrait path/URL |
| `bio`, `echo`, `disadvantages` | no | Copied into `actor.system` |
| `languages.known` | no | Language keys; echo-locked languages are enforced on import |
| `artifacts` | no | Catalog keys + level 1–10 |
| `equipment.gear` | no | Simple gear items |
| `creationComplete` | no | Default `true` |
| `systemOverrides` | no | Advanced merge onto `actor.system` |
| `skills`, `skillsSpent`, `minorExpressions` | no | **Deprecated** archive-only — warned, never converted to Specs / Imprints |

### Attributes

Use **plain totals**, not `{ value, stones }` objects. Stone placements belong in the separate `stones` map.

```json
"attributes": {
  "might": 4,
  "agility": 4,
  "vitality": 3,
  "intellect": 3,
  "resolve": 2,
  "influence": 2,
  "wits": 2
}
```

Missing attributes default to **2**. Health tracks are computed by Foundry on import (Stress is soft-retired).

### Starting Stones

```json
"stones": { "might": 1, "agility": 1 },
"permanentColorless": 0
```

| Field | Notes |
|--------|-------|
| `stones` | Counts per attribute. Written to `system.attributes.*.stones` **and** `system.progression.stoneAssignments`. Complete Creation characters must place exactly **2** Stones. |
| `permanentColorless` | Must be **0** for complete Creation imports. |

### Specializations (DF 2026)

```json
"specializations": [
  { "name": "Acrobatics", "field": "finesse", "scope": "Balance and tumbling", "rank": 2 }
]
```

| Field | Notes |
|--------|-------|
| `name` | Free-named Spec |
| `field` | One of: `physical`, `finesse`, `survival`, `science-craft`, `occult`, `social`, `investigation` |
| `scope` | One-sentence scope (required) |
| `rank` | 1–8; Creation complete → all five must be Rank **2** |
| `id` | Optional; derived from name + field when omitted |

**Perception Rank 2** is universal and free — it does **not** consume a Spec slot. Do not invent a Spec named Perception unless the player explicitly chose one.

### Echo Imprints (DF 2026)

```json
"echoImprints": ["mage-hand", "catfall"]
```

Catalog ids from `src/rules/echo-imprints.ts` (28 entries). Max selected = Mastery Rank. Each Imprint’s governing attribute must be **≥ 4**. Replaces Minor Expressions.

### Echo

```json
"echo": {
  "key": "dwarfs",
  "subChoiceKey": "",
  "veiledFormKey": "",
  "selectedCardIds": ["dwarf-start-1"],
  "artifactKeys": ["stoneboundSoles"]
}
```

| Field | Notes |
|--------|-------|
| `key` | Echo key (`humans`, `dwarfs`, `elorians`, `sentinels`, `titanborn`, `dragonborn`, `unbound`) |
| `subChoiceKey` | Lineage / order / affinity / Unbound identity |
| `veiledFormKey` | Dragonborn only |
| `selectedCardIds` | Start card id(s) from the Echo deck |
| `artifactKeys` | Echo Artifact catalog keys — granted **echo-bound** and auto-equipped |
| `unboundShape` | Unbound Beast: free-text predator shape |
| `predatorStone` | Unbound Beast: stone path key — the Echo Artifact is resolved automatically |

The import derives `bio.echo` (display name incl. Unbound identity), fresh
`traitUses`, and echo-locked languages the same way the in-game Echo dialog does.
Unbound characters do not need `artifactKeys` — the artifact follows from the
identity (and `predatorStone` for Beasts).

### Skills (deprecated)

Legacy map of **skill keys → rank**. Archive-only: import may store the values, but they are **never** converted into Specialization Ranks. Prefer `specializations`. A warning is emitted when `skills` is present.

### Disadvantages

At creation you may take **0–8 disadvantage points** (= starting **Faith Fractures**). Disadvantages are optional.

**Shorthand** (catalog id only — empty `details`, base points):

```json
"disadvantages": ["berserkers-curse", "unluck"]
```

**Full form** (recommended — player-specific text):

```json
"disadvantages": [
  {
    "id": "hunted",
    "points": 2,
    "details": {
      "hunter": "The Pale Court",
      "context": "They want the Moonlight Greatsword back."
    }
  },
  {
    "id": "addiction",
    "details": {
      "substance": "Moonlight nectar"
    }
  }
]
```

| Catalog `id` | Notes |
|--------------|--------|
| `addiction` | `details.substance` required |
| `berserkers-curse` | fixed 2 pts |
| `hunted` | `details` + rank → 1–3 pts |
| `physical-scars` | `details.tier` or legacy `details.scar` |
| `mental-restrictions` | `details.severity`: easy/normal/hard |
| `unluck` | variable rank in `details` |
| `vulnerability` | `details` for damage type |

`points` is optional — calculated from `details` when omitted. Import sets `faithFractures.current` and `.maximum` to the total.

### Minor Expressions (deprecated)

Legacy cantrip ids. Archive-only — prefer `echoImprints`. A warning is emitted when present. Do not use in new homepage exports.

### Powers — option 1: explicit grants (`powers`)

Exactly **6** entries:

```json
"powers": [
  { "templateId": "passive-evade", "rank": 4 },
  { "templateId": "passive-temp-hp", "rank": 4 },
  { "templateId": "ab-evade", "rank": 4 },
  { "templateId": "reaction-evade", "rank": 4 },
  { "templateId": "active-melee-weapon-single", "rank": 2 },
  {
    "templateId": "active-melee-damage-t4",
    "special": "ignite",
    "rank": 2,
    "isSpell": false
  }
]
```

| Power grant field | Required | Description |
|-------------------|----------|-------------|
| `templateId` | yes | Catalog template id (e.g. `active-melee-weapon-single`) |
| `rank` | yes | Power rank on the actor (4 for defensive slots, 2 for actives at creation) |
| `special` | no | Chosen Special key for templates that need one (`ignite`, `expose`, …) |
| `isSpell` | no | Only valid on **ranged** actives |
| `castingAttribute` | no | `intellect` or `resolve` when `isSpell: true` |
| `spellResolution` | no | `spellAttack` or `saveSpell` |

**Creation mix:** 2× Passive (R4), 1× Active Buff (R4), 1× Reaction (R4), 2× Active (R2).

### Powers — option 2: Tower Wizard package (`combatPackage`)

Same structure as the in-game Combat Package Wizard (`TowerWizardSelection`). The module calls `buildPackageGrantSpecs()`.

```json
"combatPackage": {
  "defenseId": "evade",
  "secondPassiveTemplateId": "passive-temp-hp",
  "activeBuffMode": "defensive",
  "offenseActivePicks": [
    { "pickId": "active-melee-weapon-single", "templateId": "active-melee-weapon-single" },
    { "pickId": "active-melee-damage-t4::ignite", "templateId": "active-melee-damage-t4", "special": "ignite" }
  ],
  "delivery": "melee",
  "weakenSave": null
}
```

If both `powers` and `combatPackage` are present, a non-empty `powers` array wins.

### Artifacts

```json
"artifacts": [
  {
    "key": "moonlightGreatsword",
    "level": 4,
    "activated": true,
    "activationStoneAttribute": "might",
    "equipped": true
  }
]
```

| Field | Default | Description |
|--------|---------|-------------|
| `key` | — | Catalog key (`moonlightGreatsword`, `dragonClaws`, …) |
| `level` | `1` | Tree level 1–10 |
| `activated` | `false` | Binds activation stone when `true` |
| `activationStoneAttribute` | — | e.g. `might`, `agility` |
| `equipped` | `true` | Paperdoll slot flag |

**Requirement:** GM must have **seeded the artifact library** in the world (`General Artifacts` / `Echo Artifacts` folders). Import grants from the world tree.

---

## Format B — `mastery-foundry-actor` (advanced)

Full Foundry actor document with embedded items — for tools that already expand the catalog.

```json
{
  "schemaVersion": 1,
  "exportKind": "mastery-foundry-actor",
  "systemId": "mastery-system",
  "actor": {
    "name": "Alaris",
    "type": "character",
    "img": "icons/svg/mystery-man.svg",
    "system": { },
    "items": [ ]
  }
}
```

Do **not** include `_id` on the actor or items. `type` must be `character`.

---

## Validation errors (common)

| Message | Fix |
|---------|-----|
| Unknown power template | Use a valid `templateId` from the module catalog |
| Expected exactly 6 powers | Add/remove grants to match creation rules |
| Unknown artifact key | Use a key from General/Echo artifact catalogs |
| Artifact world tree not found | GM: seed artifact library in Foundry |
| Only the GM can import | Log in as GM |

---

## Module API

```js
const api = game.modules.get('mastery-system').api;

// Validate without importing
const result = api.validateCharacterImportJson(jsonString);
// { ok, errors, warnings, kind }

// Import (GM only)
const imported = await api.importCharacterFromJson(jsonString);
// { ok, actor?, errors?, warnings? }
```

---

## Example file

See `docs/examples/alaris-import.example.json`.
