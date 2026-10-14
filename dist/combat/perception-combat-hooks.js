/**
 * Combat perception runtime hooks — stealth results, reveal, round/turn cleanup.
 */
import { computeStealthRaiseBonus, clearPerceptionCombatEncounterState, clearPerceptionRoundState, clearPerceptionRoundUsage, setPerceptionCombatState, } from './perception-state.js';
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
async function forEachCombatActor(cb, combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!c)
        return;
    const combatants = c.combatants ?? [];
    for (const entry of combatants) {
        const actor = entry?.actor;
        if (actor)
            await cb(actor);
    }
}
/** New Round: Perception attempts, attack-reveal, and Stealth-spent TN bonus. */
export async function clearPerceptionUsageForNewRound(combat) {
    await forEachCombatActor(async (actor) => {
        await clearPerceptionRoundState(actor);
    }, combat);
}
/**
 * Combat end / new encounter: wipe attempt flags, locate results, reveal, stealth spend,
 * and Hidden-from-Stealth — then re-sync Invisibility from powers.
 */
export async function resetPerceptionForCombatEnd(combat) {
    const c = combat ?? globalThis.game?.combat;
    const actors = new Set();
    await forEachCombatActor(async (actor) => {
        actors.add(actor);
    }, c);
    // Also sweep world actors that still carry a stale perceptionCombat flag
    // (deleteCombat can drop combatant.actor before hooks finish).
    try {
        const col = globalThis.game?.actors;
        const list = col
            ? Array.isArray(col)
                ? col
                : Array.isArray(col.contents)
                    ? col.contents
                    : typeof col[Symbol.iterator] === 'function'
                        ? Array.from(col)
                        : []
            : [];
        for (const actor of list) {
            const raw = actor?.getFlag?.('mastery-system', 'perceptionCombat') ??
                actor?.flags?.['mastery-system']?.perceptionCombat;
            if (raw && typeof raw === 'object')
                actors.add(actor);
        }
    }
    catch {
        /* best-effort */
    }
    for (const actor of actors) {
        try {
            await clearPerceptionCombatEncounterState(actor);
            await syncInvisibilityFromPowers(actor);
        }
        catch (err) {
            console.warn('Mastery System | perception combat-end reset failed', actor?.name, err);
        }
    }
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
            // Wipe leftovers from the previous fight first (tokens often keep flags).
            await resetPerceptionForCombatEnd(combat);
            await syncAllCombatantInvisibility(combat);
            await clearPerceptionUsageForNewRound(combat);
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
                await clearPerceptionUsageForNewRound(combat);
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
    Hooks.on('combatEnd', async (combat) => {
        lastRound = 0;
        try {
            await resetPerceptionForCombatEnd(combat);
        }
        catch (err) {
            console.error('Mastery System | perception combatEnd reset failed', err);
        }
    });
    Hooks.on('deleteCombat', async (combat) => {
        lastRound = 0;
        try {
            await resetPerceptionForCombatEnd(combat);
        }
        catch (err) {
            console.error('Mastery System | perception deleteCombat reset failed', err);
        }
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