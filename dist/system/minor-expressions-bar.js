/**
 * Minor Expressions bar — pure state + row builder for the floating player
 * panel (mirrors the Important NPCs bar). Lists the character's chosen Minor
 * Expressions with the resolved tier text and tracks uses per Safe Haven Rest
 * (Mastery Rank × 2, as on the print sheet).
 */
import { getMinorExpressionDefinition, tierBodyForExpression, tierThresholdForAttributeValue, } from '../utils/minor-expressions.js';
export const FLAG_SCOPE = 'mastery-system';
export const MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING = 'minorExpressionsBarCollapsed';
export const MINOR_EXPRESSIONS_BAR_POSITION_SETTING = 'minorExpressionsBarPosition';
export const MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING = 'minorExpressionsBarHidden';
/** Actor flag: uses since the last Safe Haven Rest. */
export const MINOR_EXPRESSION_USES_FLAG = 'minorExpressionUses';
export const DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION = { x: 90, y: 160 };
const BAR_EDGE_PAD = 8;
const ATTRIBUTE_LABELS = {
    might: 'Might',
    agility: 'Agility',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};
export function sanitizeMinorExpressionsBarPosition(raw) {
    const obj = raw && typeof raw === 'object' ? raw : {};
    const x = Number(obj.x);
    const y = Number(obj.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION };
    return { x: Math.round(x), y: Math.round(y) };
}
export function clampMinorExpressionsBarPosition(pos, viewport, size) {
    const width = Math.max(0, Number(size.width) || 0);
    const height = Math.max(0, Number(size.height) || 0);
    const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
    const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
    return {
        x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
        y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
    };
}
/** Uses per Safe Haven Rest: Mastery Rank × 2 (print sheet rule). */
export function minorExpressionUsesMax(masteryRank) {
    return Math.max(0, Math.floor(Number(masteryRank) || 0)) * 2;
}
export function readMinorExpressionUses(actor) {
    let raw;
    try {
        raw = actor?.getFlag?.(FLAG_SCOPE, MINOR_EXPRESSION_USES_FLAG);
    }
    catch {
        raw = undefined;
    }
    if (raw === undefined)
        raw = actor?.flags?.[FLAG_SCOPE]?.[MINOR_EXPRESSION_USES_FLAG];
    return Math.max(0, Math.floor(Number(raw) || 0));
}
/** Rows + use budget for one character actor (system data only, no Foundry globals). */
export function buildMinorExpressionsBarModel(actor) {
    const system = actor?.system ?? {};
    const masteryRank = Math.max(0, Math.floor(Number(system?.mastery?.rank) || 0));
    const ids = Array.isArray(system?.minorExpressions) ? system.minorExpressions : [];
    const rows = [];
    const seen = new Set();
    for (const raw of ids) {
        const id = String(raw ?? '').trim();
        if (!id || seen.has(id))
            continue;
        const def = getMinorExpressionDefinition(id);
        if (!def)
            continue;
        seen.add(id);
        const attributeValue = Math.floor(Number(system?.attributes?.[def.attribute]?.value) || 0);
        rows.push({
            id,
            name: def.name,
            attribute: def.attribute,
            attributeLabel: ATTRIBUTE_LABELS[def.attribute] ?? def.attribute,
            attributeValue,
            tier: tierThresholdForAttributeValue(attributeValue),
            tagline: def.tagline,
            constraints: def.constraints ?? '',
            body: tierBodyForExpression(def, attributeValue),
        });
    }
    const usesMax = minorExpressionUsesMax(masteryRank);
    const usesSpent = Math.min(usesMax, readMinorExpressionUses(actor));
    return {
        rows,
        masteryRank,
        usesMax,
        usesSpent,
        usesLeft: Math.max(0, usesMax - usesSpent),
    };
}
/**
 * Character shown on this client's bar: the user's assigned character, else
 * the first owned world character. GM gets nothing (the bar is a player aid).
 */
export function resolveMinorExpressionsBarActor(user, actors) {
    if (!user || user.isGM)
        return null;
    const assigned = user.character;
    if (assigned && String(assigned.type || '') === 'character')
        return assigned;
    for (const actor of actors ?? []) {
        if (String(actor?.type || '') !== 'character')
            continue;
        if (actor?.isOwner || actor?.testUserPermission?.(user, 'OWNER'))
            return actor;
    }
    return null;
}
export function registerMinorExpressionsBarSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING, {
            name: 'Minor Expressions bar collapsed',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
        });
        g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_POSITION_SETTING, {
            name: 'Minor Expressions bar position',
            scope: 'client',
            config: false,
            type: Object,
            default: { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION },
        });
        g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING, {
            name: 'Minor Expressions bar',
            hint: 'Hide the floating Minor Expressions panel on this client.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                try {
                    g.Hooks?.callAll?.('masteryMinorExpressionsBarRefresh');
                }
                catch {
                    /* ignore */
                }
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | registerMinorExpressionsBarSettings failed', err);
    }
}
export function readMinorExpressionsBarCollapsed() {
    try {
        return !!globalThis.game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING);
    }
    catch {
        return false;
    }
}
export async function setMinorExpressionsBarCollapsed(collapsed) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING, !!collapsed);
    }
    catch (err) {
        console.warn('Mastery System | setMinorExpressionsBarCollapsed failed', err);
    }
}
export function readMinorExpressionsBarHidden() {
    try {
        return !!globalThis.game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING);
    }
    catch {
        return false;
    }
}
export async function setMinorExpressionsBarHidden(hidden) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING, !!hidden);
    }
    catch (err) {
        console.warn('Mastery System | setMinorExpressionsBarHidden failed', err);
    }
}
export function readMinorExpressionsBarPosition() {
    try {
        return sanitizeMinorExpressionsBarPosition(globalThis.game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_POSITION_SETTING));
    }
    catch {
        return { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION };
    }
}
export async function setMinorExpressionsBarPosition(pos) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_POSITION_SETTING, sanitizeMinorExpressionsBarPosition(pos));
    }
    catch (err) {
        console.warn('Mastery System | setMinorExpressionsBarPosition failed', err);
    }
}
//# sourceMappingURL=minor-expressions-bar.js.map