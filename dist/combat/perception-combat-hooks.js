/**
 * Combat perception runtime hooks — stealth results, cloak disruption, round/turn cleanup.
 */
import { applyCloakDisruption, computeStealthRaiseBonus, getPerceptionCombatState, resetInvisibilityAtTurnStart, setPerceptionCombatState, clearPerceptionRoundUsage, } from './perception-state.js';
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
/** Cloak Disruption reductions per rules table. */
export async function applyAttackCloakDisruption(attacker) {
    if (!attacker)
        return;
    const profile = await syncInvisibilityFromPowers(attacker);
    if (!profile.active)
        return;
    const st = getPerceptionCombatState(attacker);
    const seeded = {
        ...st,
        invisibilityBonus: profile.baseBonus,
        currentInvisibilityBonus: st.currentInvisibilityBonus !== undefined && st.currentInvisibilityBonus !== st.invisibilityBonus
            ? st.currentInvisibilityBonus
            : profile.baseBonus,
        blockedSenses: profile.blockedSenses,
    };
    const next = applyCloakDisruption(seeded, 4);
    await setPerceptionCombatState(attacker, next);
}
export async function applyMovementCloakDisruption(actor, totalMovedM) {
    if (!actor || totalMovedM <= 3)
        return;
    const profile = await syncInvisibilityFromPowers(actor);
    if (!profile.active)
        return;
    const extraM = Math.max(0, totalMovedM - 3);
    const reduction = Math.floor(extraM / 4) * 4;
    if (reduction <= 0)
        return;
    const st = getPerceptionCombatState(actor);
    const seeded = {
        ...st,
        invisibilityBonus: profile.baseBonus,
        currentInvisibilityBonus: st.currentInvisibilityBonus !== undefined && st.currentInvisibilityBonus !== st.invisibilityBonus
            ? st.currentInvisibilityBonus
            : profile.baseBonus,
        blockedSenses: profile.blockedSenses,
    };
    const next = applyCloakDisruption(seeded, reduction);
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
    const profile = await syncInvisibilityFromPowers(actor);
    if (!profile.active) {
        await resetInvisibilityAtTurnStart(actor);
        return;
    }
    await setPerceptionCombatState(actor, {
        invisibilityBonus: profile.baseBonus,
        currentInvisibilityBonus: profile.baseBonus,
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
            await syncAllCombatantInvisibility(combat);
        }
        catch (err) {
            console.error('Mastery System | perception combatStart invisibility sync failed', err);
        }
    });
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
    // Keep profile fresh when the Passive is leveled or added mid-session.
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
}
//# sourceMappingURL=perception-combat-hooks.js.map