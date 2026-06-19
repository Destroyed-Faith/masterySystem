/**
 * One-shot GM migration: re-sync embedded, template-backed power items to their
 * current templates.
 *
 * Background: the big Actives.md / Active Buffs.md audit (explicit md-derived
 * damage anchors, special curves, healing, ranges, radii, etc.) only changed
 * the *templates*. Power items bake their `levels` table at creation time, so
 * characters that owned these powers before the audit shipped still carry the
 * old solver-derived values (e.g. Active Buff: Damage showing +1d8/+2d8/+3d8…
 * instead of +3d8/+5d8/…/+33d8). This migration refreshes those baked tables
 * from the canonical templates while preserving each item's rank, chosen
 * Special and Spell flags. Templates are matched by `templateId` with a stable
 * `templateName` fallback so legacy items without a stored id are still caught.
 */
import { findTemplateById } from '../utils/power-catalog.js';
import { ALL_POWER_TEMPLATES } from '../utils/powers/templates/index.js';
import { renderRange, renderAoe, renderDuration } from '../utils/power-rendering.js';
const SETTING_NAMESPACE = 'mastery-system';
// Bump this key whenever the templates change again so the resync re-runs once
// for every world (the previous V0_9_131 key only ran once and may have been
// set before a template still carried stale values).
const SETTING_KEY = 'powerTemplateResyncV0_9_136Run';
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
/**
 * Resolve the canonical template for a power item. Matches on `templateId`
 * first, then falls back to the stable `templateName` (the display name can be
 * renamed by the player, so it is never used). Returns `null` for powers that
 * are not template-backed (legacy / bespoke), which are left untouched.
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
/** Resync every template-backed power item from its current template. */
export async function runPowerTemplateResyncMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
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