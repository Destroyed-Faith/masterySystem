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

import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactSpecBackfillRun';

const LEGACY_KIND_TO_SLOT: Record<string, string> = {
    weapon: 'mainHand',
    shield: 'offHand',
    armor: 'body',
};

const LEGACY_GEAR_SLOT_TO_SLOT: Record<string, string> = {
    // Canonical 7-slot vocabulary
    head: 'head',
    feet: 'feet',
    amulet: 'amulet',
    ring: 'ring',
    body: 'body',
    // Legacy paperdoll keys, mapped to canonical equivalents
    helmet: 'head',
    boot: 'feet',
    necklace: 'amulet',
    ring1: 'ring',
    ring2: 'ring',
    chest: 'body',
    cloak: 'body',
    belt: 'body',
    glove: 'body',
    leggings: 'body',
};

const LEGACY_ARMOR_TYPE_TO_PROFILE: Record<string, string> = {
    light: 'lightArmor',
    medium: 'mediumArmor',
    heavy: 'heavyArmor',
    robe: 'robe',
};

export function registerArtifactSpecBackfillSetting(): void {
    try {
        (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Artifact Spec Backfill Ran',
            hint: 'Internal flag: true after the one-time Artifact Spec backfill migration ran for this world.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    } catch (err) {
        console.warn('Mastery System | artifact-spec-backfill: settings.register failed', err);
    }
}

function hasAlreadyRun(): boolean {
    try {
        return (game as any).settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
    } catch {
        return false;
    }
}

async function markRun(): Promise<void> {
    try {
        await (game as any).settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
    } catch (err) {
        console.warn('Mastery System | artifact-spec-backfill: settings.set failed', err);
    }
}

function inferSlot(sys: any): string {
    const kind = String(sys?.artifactKind || 'weapon');
    if (kind === 'gear') {
        const g = String(sys?.gearSlot || '');
        return LEGACY_GEAR_SLOT_TO_SLOT[g] || 'ring';
    }
    return LEGACY_KIND_TO_SLOT[kind] || 'mainHand';
}

function inferBaseProfile(sys: any): string {
    const kind = String(sys?.artifactKind || 'weapon');
    if (kind === 'weapon') {
        const hands = Number(sys?.artifactWeapon?.hands || 1);
        const wt = String(sys?.artifactWeapon?.weaponType || 'melee');
        if (wt === 'ranged') return 'rangedWeapon';
        return hands >= 2 ? 'twoHandedWeapon' : 'oneHandedWeapon';
    }
    if (kind === 'shield') {
        const st = String(sys?.artifactShield?.type || 'parry');
        return st === 'tower' ? 'towerShield' : 'parryShield';
    }
    if (kind === 'armor') {
        const at = String(sys?.artifactArmor?.type || 'light');
        return LEGACY_ARMOR_TYPE_TO_PROFILE[at] || 'lightArmor';
    }
    return 'accessory';
}

function inferBinding(item: any): 'unbound' | 'bound' | 'echo' {
    try {
        const echoBound = item?.getFlag?.(SETTING_NAMESPACE, 'echoBound');
        if (echoBound) return 'echo';
    } catch {
        // ignore
    }
    const sysBinding = (item?.system as any)?.binding;
    if (sysBinding === 'echo' || sysBinding === 'bound' || sysBinding === 'unbound') {
        return sysBinding;
    }
    return 'unbound';
}

function inferEchoKey(item: any): string | null {
    try {
        const k = item?.getFlag?.(SETTING_NAMESPACE, 'echoArtifactKey');
        if (typeof k === 'string' && k) return k;
    } catch {
        // ignore
    }
    return null;
}

function buildBackfillUpdate(item: any): Record<string, any> | null {
    const sys = (item?.system as any) || {};
    const updates: Record<string, any> = {};

    if (!sys.slot || typeof sys.slot !== 'string') {
        updates['system.slot'] = inferSlot(sys);
    }
    if (!sys.baseProfile || typeof sys.baseProfile !== 'string') {
        updates['system.baseProfile'] = inferBaseProfile(sys);
    }
    if (!Array.isArray(sys.baseValues)) {
        updates['system.baseValues'] = [];
    }
    if (sys.stoneFunction === undefined) {
        updates['system.stoneFunction'] = null;
    }
    if (!sys.binding || typeof sys.binding !== 'string') {
        updates['system.binding'] = inferBinding(item);
    }
    if (sys.echoKey === undefined) {
        const k = inferEchoKey(item);
        if (k) updates['system.echoKey'] = k;
        else updates['system.echoKey'] = null;
    }
    if (typeof sys.currentLevel !== 'number' || !Number.isFinite(sys.currentLevel)) {
        const lvl = Number(sys?.level);
        const clamped = Number.isFinite(lvl) ? Math.max(1, Math.min(10, Math.floor(lvl))) : 1;
        updates['system.currentLevel'] = clamped;
    }
    if (!Array.isArray(sys.levelProgression)) {
        updates['system.levelProgression'] = [];
    }

    return Object.keys(updates).length > 0 ? updates : null;
}

async function migrateItem(item: any): Promise<boolean> {
    if (!item || item.type !== 'artifact') return false;
    const updates = buildBackfillUpdate(item);
    if (!updates) return false;
    try {
        await item.update(updates);
        return true;
    } catch (err) {
        console.warn(
            `Mastery System | artifact-spec-backfill: failed to update item "${item?.name}"`,
            err,
        );
        return false;
    }
}

/** Execute the one-shot Artifact spec backfill. Idempotent per world. */
export async function runArtifactSpecBackfill(): Promise<void> {
    if (!game.user?.isGM) return;
    if (hasAlreadyRun()) return;

    let touchedWorld = 0;
    let touchedEmbedded = 0;

    const worldItems = (game as any).items?.contents ?? [];
    for (const item of worldItems) {
        if (await migrateItem(item)) touchedWorld++;
    }

    const actors = (game as any).actors?.contents ?? [];
    for (const actor of actors) {
        const embedded: any[] = Array.from(actor?.items ?? []);
        for (const it of embedded) {
            if (await migrateItem(it)) touchedEmbedded++;
        }
    }

    await markRun();

    const msg = `Mastery System | Artifact spec backfill: migrated ${touchedWorld} world artifact(s) and ${touchedEmbedded} embedded artifact(s) to the new spec.`;
    log.debug(msg);
    try {
        ui.notifications?.info(msg);
    } catch {
        // UI may not be ready in every context; console log is enough.
    }
}
