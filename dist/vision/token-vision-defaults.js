/**
 * Player token vision defaults — Foundry rendering baseline only.
 *
 * Player characters render with Vision enabled, 60 m, 360°, Basic Vision.
 * Foundry Token Vision is not the Combat Sense system: an NPC with vision
 * disabled or range 0 is not blind and never counts as unaware because of it.
 * NPC tokens are therefore left alone here.
 */
import { NORMAL_VISION_RANGE_M } from './scene-lighting.js';
export const PLAYER_VISION_DEFAULTS = {
    enabled: true,
    range: NORMAL_VISION_RANGE_M,
    angle: 360,
    visionMode: 'basic',
};
export const VISION_INITIALIZED_FLAG = 'visionInitialized';
/** Range 0 / missing is Foundry's untouched default — nothing deliberate. */
export function isSightUninitialized(sight) {
    const range = Number(sight?.range);
    return !Number.isFinite(range) || range <= 0;
}
/**
 * Update for a prototype token / token document `sight` block. Returns null
 * when nothing should change: an initialized range is a deliberate choice
 * and is preserved (angle and vision mode too). Uninitialized sight gets the
 * defaults, keeping any angle / mode the GM already set.
 */
export function planPlayerSightUpdate(sight, opts = {}) {
    if (opts.alreadyInitialized)
        return null;
    if (!isSightUninitialized(sight))
        return null;
    const update = {
        'sight.enabled': true,
        'sight.range': PLAYER_VISION_DEFAULTS.range,
    };
    const angle = Number(sight?.angle);
    if (!Number.isFinite(angle) || angle <= 0) {
        update['sight.angle'] = PLAYER_VISION_DEFAULTS.angle;
    }
    const mode = String(sight?.visionMode || '').trim();
    if (!mode)
        update['sight.visionMode'] = PLAYER_VISION_DEFAULTS.visionMode;
    return update;
}
/** Sight block for a brand-new player character (creation data may pre-set parts). */
export function defaultPlayerSight(existing) {
    const angle = Number(existing?.angle);
    const mode = String(existing?.visionMode || '').trim();
    return {
        enabled: true,
        range: isSightUninitialized(existing) ? PLAYER_VISION_DEFAULTS.range : Number(existing?.range),
        angle: Number.isFinite(angle) && angle > 0 && angle < 360 ? angle : PLAYER_VISION_DEFAULTS.angle,
        visionMode: mode || PLAYER_VISION_DEFAULTS.visionMode,
    };
}
function actorTypeOf(actor) {
    return String(actor?.type ?? '');
}
/**
 * Actor update normalizing an existing player prototype token. Prefixed with
 * `prototypeToken.` and marks the actor so later GM edits to 0 are kept.
 */
export function planPrototypeVisionUpdate(actor) {
    if (actorTypeOf(actor) !== 'character')
        return null;
    const flagged = actor?.flags?.['mastery-system']?.[VISION_INITIALIZED_FLAG] === true;
    const sight = actor?.prototypeToken?.sight ?? null;
    const plan = planPlayerSightUpdate(sight, { alreadyInitialized: flagged });
    if (!plan) {
        if (flagged)
            return null;
        // Deliberately customized: remember that we looked so a later 0 stays 0.
        return { [`flags.mastery-system.${VISION_INITIALIZED_FLAG}`]: true };
    }
    const out = { [`flags.mastery-system.${VISION_INITIALIZED_FLAG}`]: true };
    for (const [k, v] of Object.entries(plan))
        out[`prototypeToken.${k}`] = v;
    return out;
}
/** Ready-hook migration: normalize every player character once. GM only. */
export async function runPlayerVisionDefaultsMigration(actors) {
    const g = globalThis.game;
    if (g?.user && g.user.isGM === false)
        return 0;
    let changed = 0;
    for (const actor of actors) {
        const update = planPrototypeVisionUpdate(actor);
        if (!update)
            continue;
        const touchesSight = Object.keys(update).some((k) => k.startsWith('prototypeToken.'));
        try {
            await actor.update?.(update);
            if (touchesSight)
                changed += 1;
        }
        catch (err) {
            console.warn('Mastery System | player vision defaults failed', actor?.name, err);
        }
    }
    return changed;
}
/** preCreateActor: new player characters start with the rendering baseline. */
export function applyPlayerVisionToCreateData(actorType, data) {
    if (actorType !== 'character' || !data)
        return;
    data.prototypeToken = data.prototypeToken || {};
    data.prototypeToken.sight = defaultPlayerSight(data.prototypeToken.sight);
    data.flags = data.flags || {};
    data.flags['mastery-system'] = data.flags['mastery-system'] || {};
    data.flags['mastery-system'][VISION_INITIALIZED_FLAG] = true;
}
/**
 * preCreateToken: a placed player token whose sight is still 0 (older
 * prototype, drag from a compendium) gets the baseline. NPC tokens untouched.
 */
export function planTokenCreateSightUpdate(actorType, tokenData) {
    if (actorType !== 'character')
        return null;
    return planPlayerSightUpdate(tokenData?.sight ?? null);
}
//# sourceMappingURL=token-vision-defaults.js.map