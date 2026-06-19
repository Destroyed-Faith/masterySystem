/**
 * One-shot GM migration: re-sync embedded Active / Active-Buff power items to
 * their current templates.
 *
 * Background: the big Actives.md / Active Buffs.md audit (explicit md-derived
 * damage anchors, special curves, healing, ranges, radii, etc.) only changed
 * the *templates*. Power items bake their `levels` table at creation time, so
 * characters that owned these powers before the audit shipped still carry the
 * old solver-derived values (e.g. Damage Single showing the wrong damage dice
 * per level). This migration refreshes those baked tables from the canonical
 * templates while preserving each item's rank, chosen Special and Spell flags.
 */
import { findTemplateById } from '../utils/power-catalog.js';
import { renderRange, renderAoe, renderDuration } from '../utils/power-rendering.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'powerTemplateResyncV0_9_131Run';
export function registerPowerTemplateResyncMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Power Template Resync (Actives audit) Ran',
            hint: 'Internal flag: true after Active / Active-Buff power items were resynced to the audited templates.',
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
function hasAlreadyRun() {
    try {
        return game.settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
    }
    catch {
        return false;
    }
}
async function markRun() {
    try {
        await game.settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
    }
    catch (err) {
        console.warn('Mastery System | power-resync migration: settings.set failed', err);
    }
}
/** Only refresh template-backed Active / Active-Buff powers (the audited families). */
function isResyncablePower(item) {
    if (item?.type !== 'power')
        return false;
    const sys = item.system ?? {};
    const category = String(sys.category ?? '');
    if (category !== 'active' && category !== 'activeBuff')
        return false;
    return !!String(sys.templateId ?? '').trim();
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
/** Resync every template-backed Active / Active-Buff power from its template. */
export async function runPowerTemplateResyncMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    const actors = game.actors?.contents ?? [];
    let updated = 0;
    let actorsTouched = 0;
    for (const actor of actors) {
        const items = Array.from(actor.items ?? []).filter(isResyncablePower);
        if (items.length === 0)
            continue;
        let touchedThisActor = false;
        for (const item of items) {
            const sys = item.system ?? {};
            const template = findTemplateById(String(sys.templateId));
            if (!template?.levels)
                continue;
            const chosenSpecialKey = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
            const levels = bindLevels(template, chosenSpecialKey);
            const rank = Math.max(1, Math.min(16, Number(sys.rank ?? sys.level ?? 1)));
            const levelRow = levels[String(rank)];
            if (!levelRow)
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
    await markRun();
    if (updated > 0) {
        console.log(`Mastery System | power-resync migration: resynced ${updated} power item(s) on ${actorsTouched} actor(s)`);
        ui.notifications?.info(`Updated ${updated} Active/Active-Buff power(s) to the latest values.`);
    }
}
//# sourceMappingURL=power-template-resync-migration.js.map