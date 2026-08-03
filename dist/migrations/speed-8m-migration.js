/**
 * One-shot: bump default combat speed 6 → 8 (Rules v0.9.8 base movement).
 */
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'speed8mMigrationRun';
export function registerSpeed8mMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Speed 8m Migration Ran',
            hint: 'Internal flag: true after combat.speed 6→8 migration ran.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | speed-8m: settings.register failed', err);
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
        console.warn('Mastery System | speed-8m: settings.set failed', err);
    }
}
export async function runSpeed8mMigration(actors) {
    if (hasAlreadyRun())
        return;
    let updated = 0;
    for (const actor of actors) {
        try {
            const speed = Number(actor?.system?.combat?.speed);
            if (speed === 6) {
                await actor.update({ 'system.combat.speed': 8 });
                updated += 1;
            }
            // Boss phases
            const phases = actor?.system?.phases;
            if (Array.isArray(phases)) {
                let dirty = false;
                const next = phases.map((p) => {
                    if (Number(p?.combat?.speed) === 6) {
                        dirty = true;
                        return { ...p, combat: { ...p.combat, speed: 8 } };
                    }
                    return p;
                });
                if (dirty) {
                    await actor.update({ 'system.phases': next });
                    updated += 1;
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | speed-8m: actor failed', actor?.name, err);
        }
    }
    await markRun();
}
//# sourceMappingURL=speed-8m-migration.js.map