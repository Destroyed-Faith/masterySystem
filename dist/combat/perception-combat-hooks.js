/**
 * Combat perception runtime hooks — stealth results, cloak disruption, round/turn cleanup.
 */
import { applyCloakDisruption, computeStealthRaiseBonus, getPerceptionCombatState, resetInvisibilityAtTurnStart, setPerceptionCombatState, clearPerceptionRoundUsage, } from './perception-state.js';
/** Named veil presets from the Players Guide (Silent Veil, Hollow Veil). */
export const INVISIBILITY_VEIL_PRESETS = {
    silentVeil: {
        id: 'silentVeil',
        label: 'Silent Veil',
        blockedSenses: ['normalCombatAwareness', 'darkvision'],
        elevatedBlockedSenses: ['sonarSense', 'tremorSense'],
    },
    hollowVeil: {
        id: 'hollowVeil',
        label: 'Hollow Veil',
        blockedSenses: ['normalCombatAwareness', 'darkvision'],
        elevatedBlockedSenses: ['lifeSense', 'predatorSense', 'mageSense'],
    },
};
export function blockedSensesForVeil(presetId, elevated = false) {
    const preset = INVISIBILITY_VEIL_PRESETS[presetId];
    if (!preset)
        return ['normalCombatAwareness', 'darkvision'];
    const out = [...preset.blockedSenses];
    if (elevated && preset.elevatedBlockedSenses?.length) {
        out.push(...preset.elevatedBlockedSenses);
    }
    return [...new Set(out)];
}
/** Apply a Stealth skill check result to the rolling actor's perception combat state. */
export async function applyStealthRollResult(actor, result) {
    if (!actor?.setFlag)
        return;
    const raises = Math.max(0, Math.floor(Number(result.raises) || 0));
    if (result.success) {
        await setPerceptionCombatState(actor, {
            hidden: true,
            stealthRaiseBonus: computeStealthRaiseBonus(raises),
        });
        return;
    }
    await setPerceptionCombatState(actor, {
        hidden: false,
        stealthRaiseBonus: 0,
    });
}
/** Cloak Disruption reductions per rules table. */
export async function applyAttackCloakDisruption(attacker) {
    if (!attacker)
        return;
    const st = getPerceptionCombatState(attacker);
    const inv = st.invisibilityBonus ?? st.currentInvisibilityBonus;
    if (inv === undefined && st.currentInvisibilityBonus === undefined)
        return;
    const next = applyCloakDisruption(st, 4);
    await setPerceptionCombatState(attacker, next);
}
export async function applyMovementCloakDisruption(actor, totalMovedM) {
    if (!actor || totalMovedM <= 3)
        return;
    const st = getPerceptionCombatState(actor);
    const inv = st.invisibilityBonus ?? st.currentInvisibilityBonus;
    if (inv === undefined && st.currentInvisibilityBonus === undefined)
        return;
    const extraM = Math.max(0, totalMovedM - 3);
    const reduction = Math.floor(extraM / 4) * 4;
    if (reduction <= 0)
        return;
    const next = applyCloakDisruption(st, reduction);
    await setPerceptionCombatState(actor, next);
}
async function forEachCombatActor(cb) {
    const combat = globalThis.game?.combat;
    if (!combat?.started)
        return;
    const combatants = combat.combatants ?? [];
    for (const c of combatants) {
        const actor = c?.actor;
        if (actor)
            await cb(actor);
    }
}
/** One Perception check per hidden/invisible target per round — reset on new round. */
export async function clearPerceptionUsageForNewRound() {
    await forEachCombatActor(async (actor) => {
        await clearPerceptionRoundUsage(actor);
    });
}
/** Restore current Invisibility Bonus at the start of the creature's turn. */
export async function processPerceptionTurnStart(actor) {
    if (!actor)
        return;
    await resetInvisibilityAtTurnStart(actor);
}
/** Register Foundry hooks for perception combat bookkeeping. */
export function registerPerceptionCombatHooks() {
    const Hooks = globalThis.Hooks;
    if (!Hooks?.on)
        return;
    let lastRound = 0;
    Hooks.on('updateCombat', async (combat, changes) => {
        try {
            const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
            if (changes?.round !== undefined && round > 0 && round !== lastRound) {
                lastRound = round;
                await clearPerceptionUsageForNewRound();
            }
            if (changes?.turn !== undefined) {
                const actor = combat?.combatant?.actor;
                if (actor)
                    await processPerceptionTurnStart(actor);
            }
        }
        catch (err) {
            console.error('Mastery System | perception combat updateCombat hook failed', err);
        }
    });
    Hooks.on('combatEnd', async () => {
        lastRound = 0;
    });
}
//# sourceMappingURL=perception-combat-hooks.js.map