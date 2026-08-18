/**
 * Encounter setup status (passives / stones / initiative) plus GM force-open.
 */
import { getPassiveSlots } from '../powers/passives.js';
import { STONE_POWERS } from '../stones/stone-powers.js';
import { emitEncounterSocketToPlayerOwners, resolveLiveCombat } from './combat-permissions.js';
import { readCombatantSetupStep } from './encounter-setup-flags.js';
function loc(key, fallback) {
    const full = `MASTERY.encounterSetup.${key}`;
    const i18n = globalThis.game?.i18n;
    if (!i18n?.localize)
        return fallback;
    const t = String(i18n.localize(full) ?? '');
    return !t || t === full ? fallback : t;
}
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function passiveSummary(actor, combatant) {
    const combat = resolveLiveCombat(game.combat);
    const actorId = actor.id;
    const locked = !!(combat &&
        actorId &&
        (combat.flags?.['mastery-system']?.encounterSetup?.passives?.[actorId]?.locked ||
            readCombatantSetupStep(combatant, combat)?.passivesLocked));
    const names = getPassiveSlots(actor)
        .map((s) => String(s.passive?.name ?? '').trim())
        .filter(Boolean);
    return { done: locked, names };
}
function stoneSummary(actor, combatantId, combat) {
    const round = combat?.round || 1;
    const doneRound = Number(combat?.flags?.['mastery-system']?.stonePowersState?.stonesDone?.[combatantId] ?? 0);
    const plan = actor.getFlag?.('mastery-system', 'stonePowersRoundPlan');
    const planLive = !!plan &&
        !!combat &&
        String(plan.combatId) === String(combat.id) &&
        Number(plan.round) === Number(round);
    const parts = [];
    if (planLive && Array.isArray(plan?.lanes)) {
        for (const lane of plan.lanes) {
            const accKey = String(lane?.accKey ?? '');
            const last = accKey.lastIndexOf(':');
            const rest = last > 0 ? accKey.slice(0, last) : accKey;
            const mid = rest.lastIndexOf(':');
            const powerId = mid > 0 ? rest.slice(0, mid) : rest;
            const attr = mid > 0 ? rest.slice(mid + 1) : '';
            const defName = STONE_POWERS[powerId]?.name;
            const item = powerId ? actor.items?.get?.(powerId) : null;
            const name = String(defName || item?.name || powerId || '').trim();
            const count = Array.isArray(lane.value) ? lane.value.length : 0;
            if (!name)
                continue;
            parts.push(attr && attr !== '_' ? `${name} (${cap(attr)}×${count || 1})` : name);
        }
    }
    const stepDone = readCombatantSetupStep(combat?.combatants?.get?.(combatantId), combat)?.stonesDoneRound;
    return { done: doneRound === round || Number(stepDone) === Number(round), parts };
}
export function buildEncounterSetupStatus(combatant, combat = game.combat ?? null) {
    if (!game.user?.isGM)
        return null;
    const actor = combatant.actor;
    if (!actor || actor.type !== 'character')
        return null;
    const live = resolveLiveCombat(combat);
    const passives = passiveSummary(actor, combatant);
    const stones = stoneSummary(actor, combatant.id, live);
    const row = (kind, label, done, parts, empty) => {
        const summary = parts.length ? parts.join(', ') : done ? loc('confirmed', 'Bestätigt') : empty;
        return {
            kind,
            label,
            done,
            summary,
            tooltip: `${label}: ${done ? loc('chosen', 'gewählt') : loc('pending', 'offen')} — ${parts.length ? parts.join(', ') : empty}`,
        };
    };
    const empty = loc('nothingYet', 'noch nichts');
    return {
        isCharacter: true,
        combatantId: combatant.id,
        actorId: actor.id ?? '',
        canForce: !!game.user?.isGM,
        rows: [
            row('passives', loc('passives', 'Passives'), passives.done, passives.names, empty),
            row('stones', loc('stones', 'Steine'), stones.done, stones.parts, empty),
        ],
    };
}
export async function openEncounterDialogLocally(kind, combatant, combat) {
    const actor = combatant.actor;
    if (!actor)
        return;
    if (kind === 'passives') {
        const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
        await PassiveSelectionDialog.showForCombatant(combatant, false);
        return;
    }
    if (kind === 'stones') {
        const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
        await StonePowersDialog.showForActor(actor, combatant);
        return;
    }
    const { openInitiativeShopForTrackerRescue } = await import('./initiative-roll.js');
    await openInitiativeShopForTrackerRescue(combatant, combat);
}
export async function forceEncounterDialog(kind, combatant) {
    if (!game.user?.isGM) {
        ui.notifications?.warn(loc('gmOnly', 'Nur der SL kann Dialoge erzwingen.'));
        return;
    }
    const combat = resolveLiveCombat(game.combat);
    if (!combat) {
        ui.notifications?.warn(loc('noCombat', 'Kein aktiver Kampf.'));
        return;
    }
    const actor = combatant.actor;
    if (!actor || actor.type !== 'character')
        return;
    await openEncounterDialogLocally(kind, combatant, combat);
    const sent = emitEncounterSocketToPlayerOwners(actor, {
        type: 'forceEncounterDialog',
        combatId: combat.id,
        combatantId: combatant.id,
        actorId: actor.id,
        kind,
    });
    if (sent > 0) {
        const sentTpl = loc('sentToPlayer', '{name}: {dialog} an den Spieler geschickt.');
        ui.notifications?.info(sentTpl.replace('{name}', String(actor.name ?? '')).replace('{dialog}', kindLabel(kind)));
    }
}
export async function forceEncounterDialogForAll(kind) {
    if (!game.user?.isGM) {
        ui.notifications?.warn(loc('gmOnly', 'Nur der SL kann Dialoge erzwingen.'));
        return;
    }
    const combat = resolveLiveCombat(game.combat);
    if (!combat) {
        ui.notifications?.warn(loc('noCombat', 'Kein aktiver Kampf.'));
        return;
    }
    const pcs = Array.from(combat.combatants).filter((c) => c.actor?.type === 'character');
    for (const pc of pcs) {
        await forceEncounterDialog(kind, pc);
    }
}
function kindLabel(kind) {
    if (kind === 'passives')
        return loc('passives', 'Passives');
    if (kind === 'stones')
        return loc('stones', 'Steine');
    return loc('initiative', 'Initiative');
}
//# sourceMappingURL=encounter-setup-status.js.map