/**
 * Self-healing GM migration: re-sync embedded, template-backed power items to
 * their current catalog templates.
 *
 * Background: the Actives.md / Active Buffs.md audit (explicit md-derived damage
 * anchors, special curves, healing, ranges, radii, etc.) only changed the
 * *templates*. Power items bake their `levels` table at creation time, so any
 * character that owned a power before a template change still carries the old
 * baked values (e.g. Active Buff: Damage showing legacy +3d8/+5d8/…/+33d8 instead of
 * the 2026-10-25 curve +1d8/+2d8/…/+16d8).
 *
 * This migration refreshes those baked tables from the canonical templates while
 * preserving each item's rank, chosen Special and Spell flags. It is:
 *   - gate-free: it runs on every world load (GM only) so a later template tweak
 *     always reaches existing characters — no one-shot setting to get stuck on;
 *   - idempotent: an item is only written when its rebuilt `levels` differ from
 *     what is already stored, so steady-state loads do no writes;
 *   - resilient: templates are matched by `templateId`, then by `templateName`,
 *     then by the catalog display `name` (e.g. "Active Buff: Damage"), so legacy
 *     items created before id/name stamping are still caught.
 *
 * A manual trigger is exposed as `game.masterySystem.resyncPowers()`.
 *
 * Exceptions: templates changed by Actives v0.9.9.6 are held (skipped) on every
 * path until `activesV0996MigrationState` is `applied`; legacy-cleanup candidates
 * are held until `legacyCleanup2026MigrationState` is `applied`, and items the
 * legacy cleanup flagged (conflict / retired) are never re-baked.
 */
import { findTemplateById } from '../utils/power-catalog.js';
import { ALL_POWER_TEMPLATES } from '../utils/powers/templates/index.js';
import { renderRange, renderAoe, renderDuration } from '../utils/power-rendering.js';
import { bindPoolSpecialsOnRow } from '../utils/powers/pool-special-ranks.js';
import { LEGACY_CLEANUP_STATE_KEY, isLegacyCleanupResyncHeld } from './legacy-cleanup-2026-mapping.js';
const SETTING_NAMESPACE = 'mastery-system';
// Retained only so old worlds that registered this world-setting don't error on
// `settings.get`. The flag is no longer used to gate the migration.
const LEGACY_SETTING_KEY = 'powerTemplateResyncV0_9_136Run';
/** World setting: `''` / `'pending'` until the GM applies the Actives v0.9.9.6 migration, then `'applied'`. */
export const ACTIVES_V0996_MIGRATION_STATE_KEY = 'activesV0996MigrationState';
/**
 * Templates whose baked values change with Actives v0.9.9.6. Owned items of
 * these templates keep their stored values until the GM has reviewed and
 * applied the v0.9.9.6 migration; new purchases bake the new values directly.
 */
const ACTIVES_V0996_HELD_TEMPLATE_RE = /^active-(?:(?:melee|ranged)-(?:damage|aoe-damage)-t[3-6]|melee-instant-special-t6|ranged-zone-t[3-6]|(?:melee|ranged)-aoe-(?:cleanse|restoration)|mental-attack)$/;
export function isActivesV0996HeldTemplate(templateId) {
    return ACTIVES_V0996_HELD_TEMPLATE_RE.test(String(templateId ?? '').trim().toLowerCase());
}
export function getActivesV0996MigrationState() {
    try {
        return String(game.settings.get(SETTING_NAMESPACE, ACTIVES_V0996_MIGRATION_STATE_KEY) ?? '');
    }
    catch {
        return '';
    }
}
/** True while held templates must not be re-baked (migration not yet applied). */
export function isActivesV0996ResyncHeld() {
    return getActivesV0996MigrationState() !== 'applied';
}
export function getLegacyCleanupMigrationState() {
    try {
        return String(game.settings.get(SETTING_NAMESPACE, LEGACY_CLEANUP_STATE_KEY) ?? '');
    }
    catch {
        return '';
    }
}
export function registerPowerTemplateResyncMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, ACTIVES_V0996_MIGRATION_STATE_KEY, {
            name: 'Actives v0.9.9.6 Migration State',
            hint: 'Internal: "applied" once the GM confirmed the Actives v0.9.9.6 migration. Until then the template resync keeps the stored values of affected powers.',
            scope: 'world',
            config: false,
            type: String,
            default: 'pending',
        });
    }
    catch (err) {
        console.warn('Mastery System | power-resync migration: v0.9.9.6 state register failed', err);
    }
    try {
        game.settings.register(SETTING_NAMESPACE, LEGACY_CLEANUP_STATE_KEY, {
            name: 'Legacy Cleanup 2026 Migration State',
            hint: 'Internal: "applied" once the GM confirmed the legacy-cleanup migration. Until then the template resync keeps the stored values of cleanup candidates.',
            scope: 'world',
            config: false,
            type: String,
            default: 'pending',
        });
    }
    catch (err) {
        console.warn('Mastery System | power-resync migration: legacy-cleanup state register failed', err);
    }
    try {
        game.settings.register(SETTING_NAMESPACE, LEGACY_SETTING_KEY, {
            name: 'Power Template Resync (Actives audit) Ran',
            hint: 'Deprecated internal flag (the resync now runs every load and is idempotent).',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | power-resync migration: settings.register failed', err);
    }
}
/**
 * Resolve the canonical template for a power item. Matches on `templateId`
 * first, then the stable `templateName`, then the catalog display `name`. The
 * player-facing item name can be renamed, so the catalog `name` is only used
 * when it still matches a template verbatim. Returns `null` for powers that are
 * not template-backed (bespoke / custom), which are left untouched.
 */
function resolveTemplateForItem(item) {
    const sys = item?.system ?? {};
    const templateId = String(sys.templateId ?? '').trim();
    if (templateId) {
        const byId = findTemplateById(templateId);
        if (byId?.levels)
            return byId;
    }
    const templateName = String(sys.templateName ?? '').trim();
    if (templateName) {
        const byName = ALL_POWER_TEMPLATES.find((t) => String(t.templateName ?? '').trim() === templateName);
        if (byName?.levels)
            return byName;
    }
    const itemName = String(item?.name ?? '').trim();
    if (itemName) {
        const byDisplay = ALL_POWER_TEMPLATES.find((t) => String(t.name ?? '').trim() === itemName);
        if (byDisplay?.levels)
            return byDisplay;
    }
    return null;
}
/**
 * Rebuild the per-level table from a template, binding the generic `SPECIAL`
 * key to the item's chosen Special (mirrors power-item-builder.ts).
 */
function bindLevels(template, chosenSpecialKey) {
    if (!chosenSpecialKey)
        return template.levels;
    const next = {};
    for (const [k, row] of Object.entries(template.levels)) {
        next[k] = bindPoolSpecialsOnRow(row, chosenSpecialKey, template.templateId, Number(k));
    }
    return next;
}
/** Stable comparison key for a `levels` table (order-independent on level keys). */
function levelsSignature(levels) {
    if (!levels || typeof levels !== 'object')
        return '';
    const obj = levels;
    const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
    return JSON.stringify(keys.map((k) => [k, obj[k]]));
}
/**
 * Resync every template-backed power item on a single actor from its current
 * catalog template. Cheap when already in sync (signature compare only).
 * Used on character-sheet open so Evade (and other) reprices reach owned items
 * without waiting for a GM world-load migration.
 */
export async function resyncActorPowerTemplates(actor, options = {}) {
    if (!actor)
        return 0;
    try {
        if (!actor.isOwner && !game.user?.isGM)
            return 0;
    }
    catch {
        /* unit tests / no game */
    }
    const force = options.force === true;
    const items = Array.from(actor.items ?? []).filter((i) => i?.type === 'power');
    let updated = 0;
    for (const item of items) {
        try {
            if (await resyncPowerItemFromTemplate(item, { force }))
                updated++;
        }
        catch (err) {
            console.warn(`Mastery System | power-resync: failed for "${item.name}" on ${actor.name}`, err);
        }
    }
    return updated;
}
/**
 * Resync one template-backed power item. Returns true when it wrote an update.
 * Throws when the Foundry update itself fails (callers log per item).
 */
/**
 * Read-only preview of what the resync would bake for one item (used by the
 * Actives v0.9.9.6 dry-run report). Ignores the v0.9.9.6 hold.
 */
export function previewPowerItemResync(item) {
    const sys = item?.system ?? {};
    const template = resolveTemplateForItem(item);
    if (!template?.levels)
        return null;
    const chosenSpecialKey = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
    const levels = bindLevels(template, chosenSpecialKey);
    return {
        templateId: String(template.templateId ?? ''),
        levels,
        changed: levelsSignature(sys.levels) !== levelsSignature(levels),
    };
}
export async function resyncPowerItemFromTemplate(item, options = {}) {
    const sys = item?.system ?? {};
    const template = resolveTemplateForItem(item);
    if (!template?.levels)
        return false;
    const msFlags = item?.flags?.[SETTING_NAMESPACE] ?? {};
    if (msFlags.v0996Conflict || msFlags.v0996Retired === true)
        return false;
    if (options.ignoreLegacyCleanupHold !== true &&
        isLegacyCleanupResyncHeld(item, getLegacyCleanupMigrationState() === 'applied')) {
        return false;
    }
    if (options.ignoreV0996Hold !== true &&
        isActivesV0996ResyncHeld() &&
        isActivesV0996HeldTemplate(template.templateId)) {
        return false;
    }
    const chosenSpecialKey = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
    const levels = bindLevels(template, chosenSpecialKey);
    const rank = Math.max(1, Math.min(16, Number(sys.rank ?? sys.level ?? 1)));
    const levelRow = levels[String(rank)];
    if (!levelRow)
        return false;
    if (options.force !== true && levelsSignature(sys.levels) === levelsSignature(levels))
        return false;
    await item.update({
        'system.levels': levels,
        'system.fluff': template.fluff || '',
        'system.description': template.fluff || '',
        'system.range': renderRange(levelRow.range),
        'system.aoe': renderAoe(levelRow.aoe),
        'system.duration': renderDuration(levelRow.duration),
        'system.effect': levelRow.effect?.text || '',
        'system.specials': (levelRow.specials || []).map((s) => s.rank !== undefined ? `${s.key}(${s.rank})` : s.key),
    });
    return true;
}
/**
 * Resync every template-backed power item from its current template.
 * @param options.force ignore the diff check and rewrite every matched item.
 * @returns number of power items updated.
 */
export async function runPowerTemplateResyncMigration(options = {}) {
    if (!game.user?.isGM)
        return 0;
    const force = options.force === true;
    const actors = game.actors?.contents ?? [];
    let updated = 0;
    let actorsTouched = 0;
    for (const actor of actors) {
        const n = await resyncActorPowerTemplates(actor, { force });
        if (n > 0) {
            updated += n;
            actorsTouched++;
        }
    }
    if (updated > 0) {
        ui.notifications?.info(`Updated ${updated} Active/Active-Buff power(s) to the latest values.`);
    }
    else if (options.notify) {
        ui.notifications?.info('All Powers are already up to date.');
    }
    return updated;
}
//# sourceMappingURL=power-template-resync-migration.js.map