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

### Minimal example

```json
{
  "schemaVersion": 1,
  "exportKind": "mastery-character-import",
  "systemId": "mastery-system",
  "character": {
    "name": "Alaris",
    "attributes": {
      "might": 16,
      "agility": 16,
      "vitality": 14,
      "intellect": 10,
      "resolve": 12,
      "influence": 8,
      "wits": 10
    },
    "masteryRank": 4,
    "powers": [
      { "templateId": "passive-evade", "rank": 4 },
      { "templateId": "passive-temp-hp", "rank": 4 },
      { "templateId": "ab-evade", "rank": 4 },
      { "templateId": "reaction-evade", "rank": 4 },
      { "templateId": "active-melee-weapon-single", "rank": 2 },
      { "templateId": "active-melee-damage-t4", "special": "ignite", "rank": 2 }
    ],
    "artifacts": [
      {
        "key": "moonlightGreatsword",
        "level": 4,
        "activated": true,
        "activationStoneAttribute": "might",
        "equipped": true
      }
    ],
    "creationComplete": true
  }
}
```

### `character` fields

| Field | Required | Notes |
|--------|----------|-------|
| `name` | yes | Actor display name |
| `attributes` | yes | Plain numbers 2–80 for all seven attributes |
| `powers` **or** `combatPackage` | yes | Exactly **6** powers at creation (see below) |
| `masteryRank` | no | Default `4` at creation |
| `img` | no | Portrait path/URL |
| `bio`, `echo`, `skills`, `disadvantages`, `minorExpressions` | no | Copied into `actor.system` |
| `languages.known` | no | Language keys; echo-locked languages are enforced on import |
| `artifacts` | no | Catalog keys + level 1–10 |
| `equipment.gear` | no | Simple gear items |
| `creationComplete` | no | Default `true` |
| `systemOverrides` | no | Advanced merge onto `actor.system` |

### Attributes

Use **plain totals**, not `{ value, stones }`:

```json
"attributes": {
  "might": 16,
  "agility": 16,
  "vitality": 14,
  "intellect": 10,
  "resolve": 12,
  "influence": 8,
  "wits": 10
}
```

Missing attributes default to **2**. Stone pools and health/stress bars are computed by Foundry on import.

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

### Skills

Map of **skill keys → rank** (creation budget: **40 points** total).

```json
"skills": {
  "meleeWeapons": 2,
  "athletics": 1,
  "stealth": 1,
  "lore": 2
}
```

Keys must match the module catalog (`src/utils/skills.ts`), e.g. `meleeWeapons`, `handToHand`, `acrobatics`, `lore`, `medicine`, `negotiation`, …

Optional `skillsSpent` uses the same shape (tracks consumable uses per Safe Haven rest).

### Disadvantages

At creation you need **2–8 disadvantage points** (= starting **Faith Fractures**).

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

### Minor Expressions

Array of catalog **ids** (cantrips). Max count = **Mastery Rank**. Governing attribute must be **≥ 8**.

```json
"minorExpressions": [
  "might-set-your-feet",
  "agility-soft-step",
  "intellect-arcane-spark"
]
```

Ids look like `{attribute}-{slug}` — see `src/utils/minor-expressions.ts` (e.g. `might-hold-fast`, `resolve-steady-mind`).

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
