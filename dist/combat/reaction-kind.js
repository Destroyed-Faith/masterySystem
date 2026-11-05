/**
 * Shared reaction-kind predicates (K8.f / R3).
 * Eligibility, pool filtering and spend must use the same helpers so a reaction
 * cannot be offered under one rule and consumed under another.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { compareIdentityDecision } from '../utils/identity-shadow.js';
function templateIdOf(item) {
    return String(item?.system?.templateId ?? '').toLowerCase();
}
function mechanicsOf(item) {
    try {
        return resolvePowerMechanics(item);
    }
    catch {
        return null;
    }
}
/** Parry + Weapon Damage (Riposte). */
export function isRiposteReaction(item) {
    const tid = templateIdOf(item);
    const name = String(item?.name ?? '').toLowerCase();
    return compareIdentityDecision('reaction.isRiposte', () => tid === 'reaction-riposte' || name.includes('riposte') || name.includes('weapon damage'), () => {
        if (tid === 'reaction-riposte')
            return true;
        if (!tid)
            return { kind: 'unresolved', reason: 'missing-identity' };
        return false;
    }, { tid, name }, { prefer: 'identity' });
}
/** Attack Reflection. */
export function isReflectionReaction(item) {
    const tid = templateIdOf(item);
    const name = String(item?.name ?? '').toLowerCase();
    return compareIdentityDecision('reaction.isReflection', () => tid === 'reaction-parry-reflection' || name.includes('reflection'), () => {
        if (tid === 'reaction-parry-reflection')
            return true;
        if (!tid)
            return { kind: 'unresolved', reason: 'missing-identity' };
        return false;
    }, { tid, name }, { prefer: 'identity' });
}
/**
 * Explicit exception: Parry + Weapon Damage may be used again this round.
 * Each use still costs 1 Reaction.
 */
export function reactionMayRepeatThisRound(item) {
    const tid = templateIdOf(item);
    const name = String(item?.name ?? '').toLowerCase();
    return compareIdentityDecision('reaction.mayRepeatThisRound', () => tid === 'reaction-riposte' ||
        name.includes('parry + weapon damage') ||
        name.includes('riposte') ||
        mechanicsOf(item)?.repeatable === true, () => {
        if (tid === 'reaction-riposte')
            return true;
        if (mechanicsOf(item)?.repeatable === true)
            return true;
        if (!tid)
            return { kind: 'unresolved', reason: 'missing-identity' };
        return false;
    }, { tid, name }, { prefer: 'identity' });
}
//# sourceMappingURL=reaction-kind.js.map