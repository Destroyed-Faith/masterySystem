/**
 * Healing bar — pure state for the floating panel (same chrome as Minor
 * Expressions). Resolve Healing is a prepared Round charge. Passive:
 * Restoration is a separate Tyhran-day Scarred-Bar pool.
 */
const FLAG_SCOPE = 'mastery-system';
export const HEALING_BAR_COLLAPSED_SETTING = 'healingBarCollapsed';
export const HEALING_BAR_POSITION_SETTING = 'healingBarPosition';
export const HEALING_BAR_HIDDEN_SETTING = 'healingBarHidden';
export const DEFAULT_HEALING_BAR_POSITION = { x: 90, y: 214 };
const BAR_EDGE_PAD = 8;
export function sanitizeHealingBarPosition(raw) {
    const obj = raw && typeof raw === 'object' ? raw : {};
    const x = Number(obj.x);
    const y = Number(obj.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return { ...DEFAULT_HEALING_BAR_POSITION };
    return { x: Math.round(x), y: Math.round(y) };
}
export function clampHealingBarPosition(pos, viewport, size) {
    const width = Math.max(0, Number(size.width) || 0);
    const height = Math.max(0, Number(size.height) || 0);
    const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
    const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
    return {
        x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
        y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
    };
}
export function healingHandleLabel(args) {
    const parts = [];
    const showHeal = args.inCombat || args.resolveStatus !== 'idle';
    if (showHeal) {
        if (args.resolveStatus === 'ready' && args.dice > 0)
            parts.push(`Heal ${args.dice}d8`);
        else if (args.resolveStatus === 'spent')
            parts.push('Heal used');
        else
            parts.push('Heal —');
    }
    if (args.poolMax > 0)
        parts.push(`Rest ${Math.max(0, args.remaining)}/${args.poolMax}`);
    return parts.join(' · ');
}
export function buildHealingBarModel(args) {
    const poolMax = Math.max(0, Math.floor(Number(args.restoration.poolMax) || 0));
    const remaining = Math.max(0, Math.min(poolMax, Math.floor(Number(args.restoration.remaining) || 0)));
    const scarred = Math.max(0, Math.floor(Number(args.restoration.scarred) || 0));
    const restorationVisible = poolMax > 0;
    const show = args.inCombat || args.resolveStatus !== 'idle' || restorationVisible;
    return {
        resolveStatus: args.resolveStatus,
        resolveDetail: args.resolveDetail,
        resolveCanUse: args.resolveStatus === 'ready',
        restorationVisible,
        restorationRemaining: remaining,
        restorationPoolMax: poolMax,
        restorationScarred: scarred,
        restorationCanUse: restorationVisible && remaining > 0 && scarred > 0 && !args.restoration.blocked,
        restorationDetail: restorationVisible
            ? `${remaining}/${poolMax} Scarred Bars left today. Scarred now: ${scarred}.`
            : '',
        handleLabel: healingHandleLabel({
            resolveStatus: args.resolveStatus,
            dice: Math.max(0, Math.floor(Number(args.dice) || 0)),
            inCombat: args.inCombat,
            poolMax,
            remaining,
        }),
        show,
    };
}
export function registerHealingBarSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING, {
            name: 'Healing bar collapsed',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
        });
        g.game.settings.register(FLAG_SCOPE, HEALING_BAR_POSITION_SETTING, {
            name: 'Healing bar position',
            scope: 'client',
            config: false,
            type: Object,
            default: { ...DEFAULT_HEALING_BAR_POSITION },
        });
        g.game.settings.register(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING, {
            name: 'Healing bar',
            hint: 'Hide the floating Healing panel on this client.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                try {
                    g.Hooks?.callAll?.('masteryHealingBarRefresh');
                }
                catch {
                    /* ignore */
                }
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | registerHealingBarSettings failed', err);
    }
}
export function readHealingBarCollapsed() {
    try {
        return !!globalThis.game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING);
    }
    catch {
        return false;
    }
}
export async function setHealingBarCollapsed(collapsed) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING, !!collapsed);
    }
    catch (err) {
        console.warn('Mastery System | setHealingBarCollapsed failed', err);
    }
}
export function readHealingBarHidden() {
    try {
        return !!globalThis.game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING);
    }
    catch {
        return false;
    }
}
export async function setHealingBarHidden(hidden) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING, !!hidden);
    }
    catch (err) {
        console.warn('Mastery System | setHealingBarHidden failed', err);
    }
}
export function readHealingBarPosition() {
    try {
        return sanitizeHealingBarPosition(globalThis.game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_POSITION_SETTING));
    }
    catch {
        return { ...DEFAULT_HEALING_BAR_POSITION };
    }
}
export async function setHealingBarPosition(pos) {
    try {
        await globalThis.game?.settings?.set?.(FLAG_SCOPE, HEALING_BAR_POSITION_SETTING, sanitizeHealingBarPosition(pos));
    }
    catch (err) {
        console.warn('Mastery System | setHealingBarPosition failed', err);
    }
}
/**
 * Player: assigned character, else the first owned character.
 * GM: the selected character token, else the assigned character.
 */
export function resolveHealingBarActor(user, actors, selected) {
    if (!user)
        return null;
    const selectedActor = selected?.type ? selected : selected?.actor ?? null;
    if (user.isGM) {
        if (selectedActor && String(selectedActor.type || '') === 'character')
            return selectedActor;
        if (user.character && String(user.character.type || '') === 'character')
            return user.character;
        return null;
    }
    if (user.character && String(user.character.type || '') === 'character')
        return user.character;
    for (const actor of actors ?? []) {
        if (String(actor?.type || '') !== 'character')
            continue;
        if (actor?.isOwner || actor?.testUserPermission?.(user, 'OWNER'))
            return actor;
    }
    return null;
}
//# sourceMappingURL=healing-bar.js.map