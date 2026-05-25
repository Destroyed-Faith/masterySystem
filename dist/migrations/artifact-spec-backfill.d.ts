/**
 * Artifact Spec Backfill — One-time migration that populates the new
 * canonical Artifact fields on every existing `artifact` item.
 *
 * New Artifact spec (Artefacts.md) introduced these fields on
 * `system` for artifact items:
 *   - `slot`            : canonical 7-slot key (mainHand / offHand / body / head / feet / amulet / ring)
 *   - `baseProfile`     : base-profile key (e.g. oneHandedWeapon, bodyArmor, robe)
 *   - `baseValues`      : array of `{ slot:'a'|'b'|'c', type, label, value }`
 *   - `stoneFunction`   : `null` or `{ kind, attribute, stonePowerId? }`
 *   - `binding`         : 'unbound' | 'bound' | 'echo'
 *   - `echoKey`         : Echo-Artifact catalog key (only for echo-bound items)
 *   - `currentLevel`    : 1..10
 *   - `levelProgression`: array of level rows (filled by Echo Artifact
 *                         creation or by the GM in the node editor)
 *
 * For legacy artifacts we infer:
 *   • `slot` ← `artifactKind` (+ `gearSlot` for gear, hands for weapons).
 *   • `baseProfile` ← `artifactKind` (+ hands → `oneHandedWeapon` / `twoHandedWeapon`).
 *   • `binding` ← `'echo'` if `flags['mastery-system'].echoBound` is true,
 *                  otherwise legacy linked items stay `'unbound'` (linking
 *                  the artifact through the Evolution dialog promotes it).
 *   • `currentLevel` ← `system.level` clamped to 1..10, default 1.
 *   • `baseValues`, `stoneFunction`, `levelProgression`, `echoKey` are
 *     left empty / null — Echo Artifacts created via the character-creation
 *     dialog have already been written with their proper data and are
 *     idempotently skipped because their fields are non-empty.
 *
 * This migration is GM-only, idempotent, and gated by a world setting.
 * It walks both world `Items` and embedded items on every Actor.
 */
export declare function registerArtifactSpecBackfillSetting(): void;
/** Execute the one-shot Artifact spec backfill. Idempotent per world. */
export declare function runArtifactSpecBackfill(): Promise<void>;
//# sourceMappingURL=artifact-spec-backfill.d.ts.map