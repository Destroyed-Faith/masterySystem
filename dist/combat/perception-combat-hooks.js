/**
 * Combat perception runtime hooks — stealth results, reveal, round/turn cleanup.
 */
import { computeStealthRaiseBonus, clearPerceptionRoundState, clearPerceptionRoundUsage, setPerceptionCombatState, } from './perception-state.js';
import { syncInvisibilityFromPowers } from './invisibility-profile.js';
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
/** @deprecated Cloak Disruption removed — no-op (attack reveal is handled separately). */
export async function applyAttackCloakDisruption(_attacker) {
    /* no-op */
}
/** @deprecated Cloak Disruption removed — movement no longer lowers Invisibility Bonus. */
export async function applyMovementCloakDisruption(_actor, _totalMovedM) {
    /* no-op */
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
/** New Round: Perception attempts, attack-reveal, and Stealth-spent TN bonus. */
export async function clearPerceptionUsageForNewRound() {
    await forEachCombatActor(async (actor) => {
        await clearPerceptionRoundState(actor);
    });
}
/**
 * Start of this creature's turn: sync Invisibility profile; clear *their*
 * Perception attempt flags so they may try once vs each invisible target again.
 */
export async function processPerceptionTurnStart(actor) {
    if (!actor)
        return;
    await clearPerceptionRoundUsage(actor);
    const profile = await syncInvisibilityFromPowers(actor);
    await setPerceptionCombatState(actor, {
        invisibilityBonus: profile.baseBonus,
        blockedSenses: profile.blockedSenses,
    });
}
/** Sync every combatant when combat begins so Passive Invisibility is live immediately. */
export async function syncAllCombatantInvisibility(combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!c)
        return;
    for (const combatant of c.combatants ?? []) {
        const actor = combatant?.actor;
        if (actor)
            await syncInvisibilityFromPowers(actor);
    }
}
/** Register Foundry hooks for perception combat bookkeeping. */
export function registerPerceptionCombatHooks() {
    const Hooks = globalThis.Hooks;
    if (!Hooks?.on)
        return;
    let lastRound = 0;
    Hooks.on('combatStart', async (combat) => {
        try {
            lastRound = Math.max(0, Math.floor(Number(combat?.round) || 1));
            await syncAllCombatantInvisibility(combat);
            await clearPerceptionUsageForNewRound();
        }
        catch (err) {
            console.error('Mastery System | perception combatStart invisibility sync failed', err);
        }
    });
    Hooks.on('updateCombat', async (combat, changes) => {
        try {
            const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
            if (round > 0 && round !== lastRound) {
                lastRound = round;
                await clearPerceptionUsageForNewRound();
            }
            if (changes?.turn !== undefined || changes?.combatant !== undefined) {
                const actor = combat?.combatant?.actor;
                if (actor)
                    await processPerceptionTurnStart(actor);
            }
        }
        catch (err) {
            console.error('Mastery System | perception combat updateCombat hook failed', err);
        }
    });
    Hooks.on('updateItem', async (item) => {
        try {
            if (item?.type !== 'power')
                return;
            const tid = String(item.system?.templateId || '');
            if (tid !== 'passive-invisibility' && tid !== 'ab-invisibility')
                return;
            const actor = item.parent ?? item.actor;
            if (actor)
                await syncInvisibilityFromPowers(actor);
        }
        catch (err) {
            console.error('Mastery System | invisibility updateItem sync failed', err);
        }
    });
    Hooks.on('createItem', async (item) => {
        try {
            if (item?.type !== 'power')
                return;
            const tid = String(item.system?.templateId || '');
            if (tid !== 'passive-invisibility' && tid !== 'ab-invisibility')
                return;
            const actor = item.parent ?? item.actor;
            if (actor)
                await syncInvisibilityFromPowers(actor);
        }
        catch (err) {
            console.error('Mastery System | invisibility createItem sync failed', err);
        }
    });
    Hooks.on('combatEnd', async () => {
        lastRound = 0;
    });
    // Health-bar changes can suppress / restore Invisibility (Incapacitated).
    Hooks.on('updateActor', async (actor, changes) => {
        try {
            if (!actor || !changes?.system?.health)
                return;
            await syncInvisibilityFromPowers(actor);
        }
        catch (err) {
            console.error('Mastery System | invisibility health sync failed', err);
        }
    });
}
//# sourceMappingURL=perception-combat-hooks.js.map