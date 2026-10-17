# Destroyed Faith v0.9.9.5 – Post-Audit Bugfixes

Stand: 2026-10-17. Gezielte Korrekturen zu C1 (Token-Drag), C2 (Defensive Stones) und C5 (Damage Reduction) aus dem Abschluss-Audit. Kein Version Bump, kein Release, keine Regelwerksänderungen.

Das Dokument `docs/DESTROYED_FAITH_V0.9.9.5_FINAL_IMPLEMENTATION_AUDIT.md` bleibt unverändert als historische Momentaufnahme.

---

## Fix 1 – Token Drag

### Ursache

`preUpdateToken` in `token-action-selector.ts` ließ Positionsänderungen zu, sobald `activeMovementState` für denselben Token gesetzt war. Ein Maus-Zug erreichte damit die neue Position, ohne `attemptCommitMovement` → `commitFlee` bzw. `executeMovementPower`. Movement, Attack Action, `fleeLock` und Power-Kosten blieben unberührt.

### Geänderte Dateien

- `src/combat/token-move-gate.ts` (neu) – reine Gate-Logik
- `src/token-action-selector.ts` – Gate im `preUpdateToken`; autorisierte Writes aus `attemptCommitMovement`
- `src/combat/movement-powers.ts` – Token-/Ally-Updates mit `masteryAuthorizedMove: true`
- `tests/token-move-gate.test.ts` (neu)

### Tatsächliche Korrektur

- Unautorisierte Positionsänderung bei aktiver Führung oder bei gewähltem Flee / Movement Power → `return false`.
- Resolver setzen `masteryAuthorizedMove: true` und passieren das Gate.
- Normale Move / Dash / Disengage, Forced/Reaction-Traversal und Out-of-Combat bleiben erlaubt.
- Nach Abschluss oder Abbruch der Führung greift die Sperre nur noch, solange Flee/Power noch als `currentAction` gewählt ist; autorisierte Commits und normale Moves sind davon getrennt.

### Tests und Ergebnisse

Automatisiert (`tests/token-move-gate.test.ts` + Flee-Regression):

1. Drag bei aktiver Führung → blockiert.
2. Autorisierter Update → erlaubt.
3. Flee / Movement Power ohne Autorisierung → blockiert.
4. Move / Dash und Out-of-Combat → erlaubt.
5. Drag ohne Commit verbraucht keine Resources; `commitFlee` verbraucht genau Movement + Attack und setzt `fleeLock`.

**Nicht automatisch (Foundry-Canvas):** echtes Token-Ziehen, Radial-Klick, Overlay-Zielwahl, visuelle Doppel-Updates.

### Verbleibende Risiken

- Andere Codepfade, die Token-Positionen schreiben, müssen bei geführtem Flee/Power ebenfalls `masteryAuthorizedMove` setzen (Forced/Reaction sind über Traversal ausgenommen).
- Canvas-Abnahme für Flee und die zehn Movement Powers steht weiterhin aus.

---

## Fix 2 – Defensive Stones

### Ursache

Das Audit beschrieb das Löschen defensiver Boni beim Spotlight-Ende. Der Pfad `clearCombatStoneTurnBonusesForActor` behielt die defensiven Keys bereits, und `armDefensiveStoneExpiry` / `releaseDefensiveStoneExpiry` waren verdrahtet. Die Korrektur härtet diesen Ablauf: defensive Werte werden explizit über `snapshotDefensiveStones` durchgereicht, `defensiveExpiry` bleibt beim Spotlight-Clear erhalten, und Offensiv-/Casting-Boni werden weiterhin beim Spotlight-Ende genullt.

### Korrekter Expiration-Zeitpunkt

Beginn des nächsten eigenen Zuges: `releaseDefensiveStoneExpiry` vor `resetTurnState` im `updateCombat`-Hook (`stone-hooks.ts`).

### Betroffene Stone Abilities (Core: bis Start des nächsten eigenen Zuges)

- Parry (`tempParryPool`)
- Armor (`tempArmor`)
- Evade (`evadeBonus`)
- Damage Negation (`tempDamageNegation`)
- Damage Reduction (`damageReductionBoostPct`)
- Spell Resistance (`spellResistanceBonus`)
- Special Negation / Ward (`incomingSpecialReduction`, `tempWard`)

Andere Stone-Dauern (Round-long, einmalig, Temp HP bis Combat-Ende) unverändert.

### Geänderte Dateien

- `src/combat/action-economy.ts` (`clearCombatStoneTurnBonusesForActor`)
- `tests/defensive-stone-duration.test.ts` (neu)
- bestehend: `tests/p0-integration.test.ts`, `tests/stone-powers.test.ts`

### Tests und Ergebnisse

Automatisiert über Spotlight-Clear → Arm → Rundenwechsel → Release, inkl. Defense-Mitigation mit aktivem Armor/DR und Spell Resistance. Neu gekaufte Boni ohne pending Snapshot werden nicht entfernt; nur der Snapshot wird abgezogen.

**Nicht automatisch:** lebender Combat-Tracker mit mehreren Spielern im Foundry-Fenster.

---

## Fix 3 – Damage Reduction

### Vorherige Formel

```
reduction = ceil(damage × DR / 100)
remaining = damage − reduction
```

Beispiel 10 @ 25 % → reduction 3 → remaining **7** (regelwidrig).

### Verbindliche Core-Formel

`Final damage after DR = ceil(max(0, Damage after Armor) × (1 − total DR / 100))`

Beispiel 10 @ 25 % → ceil(7,5) = **8**.  
Beispiel 13 @ 30 % → ceil(9,1) = **10**.

### Geänderte Dateien

- `src/combat/damage-mitigation.ts` (`applyDefensiveMitigation`)
- `tests/damage-mitigation.test.ts`

### Tests und Ergebnisse

Abgedeckt: 10/25→8, 13/30→10, 0 %, 50 %, 1/25→1, 3/50→2, 0 Damage, Armor vor DR, sequentielle Reaction-DR mit unveränderter Stacking-Reihenfolge. Damage Transfer und übrige Mitigation-Schritte unverändert angeschlossen.

**Nicht geändert:** Armor, Penetration, Damage Negation, Temp HP, Health Bars, Healing, Transfer-Stacking.

---

## Gesamtstatus

| Prüfung | Ergebnis |
|--------|----------|
| `npx tsc --noEmit` | Exit 0 |
| `npx vitest run` | **2728** bestanden, **0** fehlgeschlagen, **247** Dateien |
| Ausgangsbasis (nach P1.6) | 2720 / 245 Dateien |
| Verbleibende Fehler | keine in der Suite |

### Automatisiert vs. manuell

| Bereich | Vitest | Foundry-Canvas nötig |
|--------|--------|----------------------|
| Token-Move-Gate / Flee-Commit | ja | ja (echtes Drag + Overlay) |
| Defensive-Stone-Ablauf | ja (Hook-Helfer) | ja (Tracker-Spotlight) |
| DR-Formel im Resolver | ja | optional (Chat-Breakdown) |
| P0 / P1.1–1.3 / 1.6–1.9 Regression | ja | Canvas-Lücken wie zuvor |

Ein grüner Vitest-Lauf ist keine manuelle Canvas-Abnahme.

### Mechanik-Umfang

Keine Fear-/Fallschaden-/P2-Arbeit. Keine Regelquellen geändert. Keine Balanceänderungen. Keine anderen Pakete außer den für die drei Fixes nötigen Stellen.
