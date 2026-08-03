/**
 * One-shot GM migration: re-sync embedded `ab-critical` power items to the
 * milestone-based Active Buff: Critical template (SRD bands, no linear crit riders).
 */
import { findTemplateById } from '../utils/power-catalog.js';
import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'abCriticalMilestonesMigrationRun';
export function registerAbCriticalMilestonesMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Active Buff Critical Milestones Migration Ran',
            hint: 'Internal flag: true after ab-critical power items were resynced to milestone bands.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | ab-critical migration: settings.register failed', err);
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
        console.warn('Mastery System | ab-critical migration: settings.set failed', err);
    }
}
function isAbCriticalPower(item) {
    return item?.type === 'power' && String(item.system?.templateId || '') === 'ab-critical';
}
/** Resync all embedded Active Buff: Critical items from the canonical template. */
export async function runAbCriticalMilestonesMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    const template = findTemplateById('ab-critical');
    if (!template?.levels) {
        console.warn('Mastery System | ab-critical migration: template not found');
        await markRun();
        return;
    }
    const actors = game.actors?.contents ?? [];
    let updated = 0;
    for (const actor of actors) {
        const items = Array.from(actor.items ?? []).filter(isAbCriticalPower);
        for (const item of items) {
            const rank = Math.max(1, Math.min(16, Number(item.system?.rank ?? item.system?.level ?? 1)));
            const levelKey = String(rank);
            const levelRow = template.levels[levelKey];
            if (!levelRow)
                continue;
            try {
                await item.update({
                    'system.levels': template.levels,
                    'system.fluff': template.fluff || '',
                    'system.description': template.fluff || '',
                    'system.effect': levelRow.effect?.text || '',
                });
                updated++;
            }
            catch (err) {
                console.warn(`Mastery System | ab-critical migration: failed for "${item.name}" on ${actor.name}`, err);
            }
        }
    }
    await markRun();
    if (updated > 0) {
        log.debug(`ab-critical migration: resynced ${updated} Active Buff: Critical item(s)`);
        ui.notifications?.info(`Updated ${updated} Active Buff: Critical power(s) to milestone bands.`);
    }
}
//# sourceMappingURL=ab-critical-milestones-migration.js.map