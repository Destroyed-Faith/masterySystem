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
import type { EmbeddedPowerData, PowerLevelKey, PowerLevelRow, PowerSpecial } from '../types/item.js';
import { renderRange, renderAoe, renderDuration } from '../utils/power-rendering.js';

const SETTING_NAMESPACE = 'mastery-system';
// Bump this key whenever the templates change again so the resync re-runs once
// for every world (the previous V0_9_131 key only ran once and may have been
// set before a template still carried stale values).
const SETTING_KEY = 'powerTemplateResyncV0_9_136Run';

export function registerPowerTemplateResyncMigrationSetting(): void {
    try {
        (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Power Template Resync (Actives audit) Ran',
            hint: 'Internal flag: true after Active / Active-Buff power items were resynced to the audited templates.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    } catch (err) {
        console.warn('Mastery System | power-resync migration: settings.register failed', err);
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
        console.warn('Mastery System | power-resync migration: settings.set failed', err);
    }
}

/**
 * Resolve the canonical template for a power item. Matches on `templateId`
 * first, then falls back to the stable `templateName` (the display name can be
 * renamed by the player, so it is never used). Returns `null` for powers that
 * are not template-backed (legacy / bespoke), which are left untouched.
 */
function resolveTemplateForItem(item: any): EmbeddedPowerData | null {
    const sys = item?.system ?? {};
    const templateId = String(sys.templateId ?? '').trim();
    if (templateId) {
        const byId = findTemplateById(templateId) as EmbeddedPowerData | undefined;
        if (byId?.levels) return byId;
    }
    const templateName = String(sys.templateName ?? '').trim();
    if (templateName) {
        const byName = ALL_POWER_TEMPLATES.find(
            (t) => String((t as any).templateName ?? '').trim() === templateName,
        ) as EmbeddedPowerData | undefined;
        if (byName?.levels) return byName;
    }
    return null;
}

/**
 * Rebuild the per-level table from a template, binding the generic `SPECIAL`
 * key to the item's chosen Special (mirrors power-item-builder.ts).
 */
function bindLevels(
    template: EmbeddedPowerData,
    chosenSpecialKey: string | null,
): Record<PowerLevelKey, PowerLevelRow> {
    if (!chosenSpecialKey) return template.levels;
    const next: Record<string, PowerLevelRow> = {};
    for (const [k, row] of Object.entries(template.levels)) {
        const specials = (row.specials || []).map((s: PowerSpecial) =>
            s.key === 'SPECIAL' ? { ...s, key: chosenSpecialKey } : s,
        );
        next[k] = { ...row, specials };
    }
    return next as Record<PowerLevelKey, PowerLevelRow>;
}

/** Resync every template-backed power item from its current template. */
export async function runPowerTemplateResyncMigration(): Promise<void> {
    if (!game.user?.isGM) return;
    if (hasAlreadyRun()) return;

    const actors = (game as any).actors?.contents ?? [];
    let updated = 0;
    let actorsTouched = 0;

    for (const actor of actors) {
        const items = Array.from(actor.items ?? []).filter((i: any) => i?.type === 'power') as any[];
        if (items.length === 0) continue;
        let touchedThisActor = false;

        for (const item of items) {
            const sys = item.system ?? {};
            const template = resolveTemplateForItem(item);
            if (!template?.levels) continue;

            const chosenSpecialKey = sys.chosenSpecial?.key ? String(sys.chosenSpecial.key) : null;
            const levels = bindLevels(template, chosenSpecialKey);

            const rank = Math.max(1, Math.min(16, Number(sys.rank ?? sys.level ?? 1)));
            const levelRow = levels[String(rank) as PowerLevelKey];
            if (!levelRow) continue;

            try {
                await item.update({
                    'system.levels': levels,
                    'system.fluff': template.fluff || '',
                    'system.description': template.fluff || '',
                    'system.range': renderRange(levelRow.range),
                    'system.aoe': renderAoe(levelRow.aoe),
                    'system.duration': renderDuration(levelRow.duration),
                    'system.effect': levelRow.effect?.text || '',
                    'system.specials': (levelRow.specials || []).map((s: PowerSpecial) =>
                        s.rank !== undefined ? `${s.key}(${s.rank})` : s.key,
                    ),
                });
                updated++;
                touchedThisActor = true;
            } catch (err) {
                console.warn(`Mastery System | power-resync migration: failed for "${item.name}" on ${actor.name}`, err);
            }
        }
        if (touchedThisActor) actorsTouched++;
    }

    await markRun();
    if (updated > 0) {
        console.log(`Mastery System | power-resync migration: resynced ${updated} power item(s) on ${actorsTouched} actor(s)`);
        ui.notifications?.info(`Updated ${updated} Active/Active-Buff power(s) to the latest values.`);
    }
}
