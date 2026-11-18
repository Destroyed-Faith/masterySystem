/**
 * Profession remove / respec / refund policy.
 *
 * Free starting Professions are never cashed out for XP.
 * Rank-2 undo (remove or replace) is GM-led while no XP is invested.
 * Once XP is invested into a starting slot, that choice is locked.
 * XP-learned Professions may still be removed for a refund of invested XP.
 */
import { inferProfessionXpInvested, STARTING_SPECIALIZATION_RANK, } from './skill-raises.js';
import { isCharacterPerceptionSpec, } from './specializations.js';
import { findSpecializationById } from './specialization-roll.js';
import { ensureStartingProfessionSlots, isProfessionRespecEnabled, } from './profession-respec.js';
function investedXp(spec) {
    return inferProfessionXpInvested(spec);
}
/** True when this row is still an uninvested Rank-2 (or lower) free starting Profession. */
export function isUninvestedStartingProfession(spec) {
    if (!spec || isCharacterPerceptionSpec(spec))
        return false;
    if (spec.startingSlot !== true)
        return false;
    const rank = Math.max(0, Math.floor(Number(spec.rank) || 0));
    if (rank > STARTING_SPECIALIZATION_RANK)
        return false;
    return investedXp(spec) <= 0;
}
/** True when a starting Profession has taken XP (or risen past free Rank 2). */
export function isLockedStartingProfession(spec) {
    if (!spec || isCharacterPerceptionSpec(spec))
        return false;
    if (spec.startingSlot !== true)
        return false;
    return !isUninvestedStartingProfession(spec);
}
/**
 * Stamp missing startingSlot flags, then plan a delete under lifecycle rules.
 */
export function planProfessionDelete(specs, specId, ctx) {
    const stamped = ensureStartingProfessionSlots(specs);
    const spec = findSpecializationById(stamped, specId);
    if (!spec) {
        return { ok: false, error: 'Profession not found.', refund: 0 };
    }
    if (isCharacterPerceptionSpec(spec)) {
        return {
            ok: false,
            error: 'Perception is a free universal check and cannot be removed.',
            refund: 0,
            spec,
        };
    }
    // Creation: free reselect — never refund XP for the free starting budget.
    if (!ctx.creationComplete) {
        return {
            ok: true,
            refund: 0,
            mode: 'creation-reselect',
            spec,
        };
    }
    if (spec.startingSlot === true) {
        if (isLockedStartingProfession(spec)) {
            return {
                ok: false,
                error: 'This starting Profession has invested XP and is locked. Only Rank 2 with no invested XP can be cleared by the GM.',
                refund: 0,
                spec,
            };
        }
        if (!ctx.isGM) {
            return {
                ok: false,
                error: 'Starting Professions cannot be deleted for XP. Ask the GM to replace or clear a Rank 2 Profession that has no invested XP.',
                refund: 0,
                spec,
            };
        }
        return {
            ok: true,
            refund: 0,
            mode: 'gm-rank2-clear',
            spec,
        };
    }
    const refund = investedXp(spec);
    if (spec.gmGranted === true) {
        // Pure GM grants (and later invested ranks tracked on xpInvested) may be cleared.
        return {
            ok: true,
            refund,
            mode: 'gm-grant-clear',
            spec,
        };
    }
    // XP-learned Profession: refund invested XP only.
    return {
        ok: true,
        refund,
        mode: 'learned-refund',
        spec,
    };
}
/**
 * Who may replace a Profession in place (no XP change).
 * GM: uninvested Rank-2 starting slots always.
 * Player: same, only when Allow Profession Respec (Beta) is on.
 */
export function planProfessionRespecEligibility(specs, specId, ctx) {
    const stamped = ensureStartingProfessionSlots(specs);
    const spec = findSpecializationById(stamped, specId);
    if (!spec) {
        return {
            ok: false,
            error: 'Profession not found.',
            playerAllowed: false,
            gmAllowed: false,
        };
    }
    if (isCharacterPerceptionSpec(spec)) {
        return {
            ok: false,
            error: 'Perception cannot be replaced.',
            playerAllowed: false,
            gmAllowed: false,
            spec,
        };
    }
    if (spec.startingSlot !== true) {
        return {
            ok: false,
            error: 'Only the four free starting Professions can be replaced this way.',
            playerAllowed: false,
            gmAllowed: false,
            spec,
        };
    }
    if (!isUninvestedStartingProfession(spec)) {
        return {
            ok: false,
            error: 'Profession respec is only allowed at Rank 2 with no invested XP. Once XP is spent, the Profession is locked.',
            playerAllowed: false,
            gmAllowed: false,
            spec,
        };
    }
    const playerRespecEnabled = ctx.playerRespecEnabled ?? isProfessionRespecEnabled();
    const gmAllowed = !!ctx.isGM;
    const playerAllowed = !!playerRespecEnabled;
    // During creation, sheet edit/delete covers reselect — respec button is post-creation.
    const ok = !!ctx.creationComplete && (gmAllowed || playerAllowed);
    if (!ok) {
        return {
            ok: false,
            error: ctx.isGM
                ? 'Profession respec is only available after creation for Rank 2 starting Professions.'
                : 'Ask the GM to replace this Profession, or enable Allow Profession Respec (Beta) for Rank 2 self-respec.',
            playerAllowed,
            gmAllowed,
            spec,
        };
    }
    return {
        ok: true,
        playerAllowed,
        gmAllowed,
        spec,
    };
}
/** Sheet helper: whether the delete control should render. */
export function canShowProfessionDelete(specs, specId, ctx) {
    return planProfessionDelete(specs, specId, ctx).ok;
}
/** Sheet helper: whether the respec control should render. */
export function canShowProfessionRespec(specs, specId, ctx) {
    return planProfessionRespecEligibility(specs, specId, ctx).ok;
}
//# sourceMappingURL=profession-lifecycle.js.map