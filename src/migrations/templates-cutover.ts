/**
 * Templates Cutover — Hard Reset Power Items.
 *
 * One-time migration that runs exactly once per world at Foundry's `ready`
 * hook (GM only). Removes every `item.type === 'power'` document from every
 * Actor and clears legacy tree-related flags from Artifact items so players
 * re-select their powers from the new Template catalog.
 *
 * Rerun guard:
 *   `game.settings.get('mastery-system', 'templatesCutoverRun') === true`
 *
 * See plan §7.
 */

import { getForcedDeletion } from '../utils/foundry-v14.js';

import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'templatesCutoverRun';

/** Register the cutover world-setting once at init time. */
export function registerTemplatesCutoverSetting(): void {
    try {
        (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Templates Cutover Ran',
            hint: 'Internal flag: true after the one-time Trees → Templates power reset ran for this world.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    } catch (err) {
        console.warn('Mastery System | templates-cutover: settings.register failed', err);
    }
}

/** Has the cutover already executed on this world? */
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
        console.warn('Mastery System | templates-cutover: settings.set failed', err);
    }
}

/** Execute the one-shot Trees → Templates cutover. Idempotent per world. */
export async function runTemplatesCutover(): Promise<void> {
    if (!game.user?.isGM) return;
    if (hasAlreadyRun()) return;

    const actors = (game as any).actors?.contents ?? [];
    let removedCount = 0;

    for (const actor of actors) {
        const powerItems = (actor.items?.contents ?? actor.items ?? []).filter((i: any) => i?.type === 'power');
        if (powerItems.length === 0) continue;

        const ids = powerItems.map((i: any) => i.id).filter(Boolean);
        try {
            await actor.deleteEmbeddedDocuments('Item', ids);
            removedCount += ids.length;
        } catch (err) {
            console.warn(`Mastery System | templates-cutover: failed to remove power items from "${actor.name}"`, err);
        }
    }

    // Clear legacy tree-related flags on Artifact items (world-level and
    // embedded). We don't need to touch their embedded power definitions —
    // those come from the artifact tree itself, not from the Actor surface.
    const worldItems = (game as any).items?.contents ?? [];
    for (const item of worldItems) {
        if (item?.type !== 'artifact') continue;
        try {
            const forcedDeletion = getForcedDeletion();
            const updateData: Record<string, unknown> = { 'system.tree': '' };
            if (forcedDeletion != null) {
                updateData.flags = { 'mastery-system': { treeFlags: forcedDeletion } };
            } else {
                updateData['flags.mastery-system.-=treeFlags'] = null;
            }
            await item.update(updateData);
        } catch {
            // Ignore — the fields may not exist.
        }
    }

    await markRun();

    const msg = removedCount > 0
        ? `Mastery System | Trees → Templates cutover: removed ${removedCount} power item(s) across ${actors.length} actor(s). Please re-select your Powers from the new Template catalog.`
        : 'Mastery System | Trees → Templates cutover: no power items to remove.';
    log.debug(msg);
    try {
        ui.notifications?.info(msg);
    } catch {
        // UI may not be ready yet in some contexts; console log is enough.
    }
}
