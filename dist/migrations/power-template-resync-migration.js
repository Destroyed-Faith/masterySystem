/**
 * Self-healing GM migration: re-sync embedded, template-backed power items to
 * their current catalog templates.
 *
 * Background: the Actives.md / Active Buffs.md audit (explicit md-derived damage
 * anchors, special curves, healing, ranges, radii, etc.) only changed the
 * *templates*. Power items bake their `levels` table at creation time, so any
 * character that owned a power before a template change still carries the old
 * baked values (e.g. Active Buff: Damage showing +1d8/+2d8/+3d8… instead of
 * +3d8/+5d8/…/+33d8).
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
 */
import { findTemplateById } from '../utils/power-catalog.js';
import { ALL_POWER_TEMPLATES } from '../utils/powers/templates/index.js';
import { renderRange, renderAoe, renderDuration } from '../utils/power-rendering.js';
const SETTING_NAMESPACE = 'mastery-system';
// Retained only so old worlds that registered this world-setting don't error on
// `settings.get`. The flag is no longer used to gate the migration.
const LEGACY_SETTING_KEY = 'powerTemplateResyncV0_9_136Run';
export function registerPowerTemplateResyncMigrationSetting() {
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
        const specials = (row.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: chosenSpecialKey } : s);
        next[k] = { ...row, specials };
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
        const items = Array.from(actor.items ?? []).filter((i) => i?.type === 'power');
        if (items.length === 0)
            continue;
        let touchedThisActor = false;
        for (const item of items) {
            const sys = item.system ?? {};
            const template = resolveTemplateForItem(item);
            if (!template?.levels)
                continue;
            const chosenSpecialKey = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
            const levels = bindLevels(template, chosenSpecialKey);
            const rank = Math.max(1, Math.min(16, Number(sys.rank ?? sys.level ?? 1)));
            const levelRow = levels[String(rank)];
            if (!levelRow)
                continue;
            // Idempotent: skip when the baked table already matches the template.
            if (!force && levelsSignature(sys.levels) === levelsSignature(levels))
                continue;
            try {
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
                updated++;
                touchedThisActor = true;
            }
            catch (err) {
                console.warn(`Mastery System | power-resync migration: failed for "${item.name}" on ${actor.name}`, err);
            }
        }
        if (touchedThisActor)
            actorsTouched++;
    }
    if (updated > 0) {
        console.log(`Mastery System | power-resync: resynced ${updated} power item(s) on ${actorsTouched} actor(s)`);
        ui.notifications?.info(`Updated ${updated} Active/Active-Buff power(s) to the latest values.`);
    }
    else if (options.notify) {
        ui.notifications?.info('All Powers are already up to date.');
    }
    return updated;
}
//# sourceMappingURL=power-template-resync-migration.js.map