/**
 * GM-started Pursuit. One fleeing creature and one pursuer.
 * Each exchange is one Opposed Attribute Contest. The track starts at 0.
 */
import { buildContestRollOptions, compareContestResults, contestSideFromRoll, } from '../contests/opposed-attribute-contest.js';
import * as rollHandler from '../dice/roll-handler.js';
export const PURSUIT_ATTRIBUTES = ['agility', 'might', 'vitality'];
const FLAG = 'pursuit';
function isAttribute(value) {
    return typeof value === 'string' && PURSUIT_ATTRIBUTES.includes(value);
}
export function readPursuit(combat) {
    const raw = combat?.getFlag?.('mastery-system', FLAG) ?? combat?.flags?.['mastery-system']?.[FLAG];
    if (!raw || typeof raw !== 'object')
        return null;
    const track = Math.floor(Number(raw.track) || 0);
    const status = raw.status === 'escape' || raw.status === 'caught' || raw.status === 'active' ? raw.status : 'active';
    const allowed = Array.isArray(raw.allowedAttributes)
        ? raw.allowedAttributes.filter(isAttribute)
        : [...PURSUIT_ATTRIBUTES];
    return {
        id: String(raw.id || ''),
        fleeingActorId: String(raw.fleeingActorId || ''),
        pursuerActorId: String(raw.pursuerActorId || ''),
        fleeingName: String(raw.fleeingName || 'Fleeing'),
        pursuerName: String(raw.pursuerName || 'Pursuer'),
        track,
        status,
        allowedAttributes: allowed.length ? allowed : [...PURSUIT_ATTRIBUTES],
        exchanges: Array.isArray(raw.exchanges) ? raw.exchanges : [],
    };
}
async function writePursuit(combat, record) {
    if (!combat)
        return;
    if (typeof combat.setFlag === 'function') {
        await combat.setFlag('mastery-system', FLAG, record);
        return;
    }
    combat.flags = combat.flags || {};
    combat.flags['mastery-system'] = { ...(combat.flags['mastery-system'] || {}), [FLAG]: record };
}
export async function startPursuit(input) {
    const { combat, fleeing, pursuer } = input;
    if (!combat || !fleeing?.id || !pursuer?.id)
        return { ok: false, reason: 'Choose a fleeing creature and a pursuer.' };
    if (String(fleeing.id) === String(pursuer.id))
        return { ok: false, reason: 'The pursuer must be a different creature.' };
    const existing = readPursuit(combat);
    if (existing?.status === 'active')
        return { ok: false, reason: 'A Pursuit is already active.', pursuit: existing };
    const allowed = (input.allowedAttributes ?? [...PURSUIT_ATTRIBUTES]).filter(isAttribute);
    const pursuit = {
        id: `pursuit-${Date.now()}`,
        fleeingActorId: String(fleeing.id),
        pursuerActorId: String(pursuer.id),
        fleeingName: String(fleeing.name || fleeing.id),
        pursuerName: String(pursuer.name || pursuer.id),
        track: 0,
        status: 'active',
        allowedAttributes: allowed.length ? allowed : [...PURSUIT_ATTRIBUTES],
        exchanges: [],
    };
    await writePursuit(combat, pursuit);
    return { ok: true, pursuit };
}
const inFlight = new Set();
async function rollSide(actor, attribute, name) {
    const setup = {
        actorId: String(actor.id),
        name,
        attributeKey: attribute,
    };
    const options = buildContestRollOptions(actor, attribute, {
        label: `Pursuit — ${name} (${attribute})`,
        actorRef: actor,
    });
    const roll = await rollHandler.masteryRoll(options);
    return contestSideFromRoll(setup, Number(roll?.dice?.length ?? options.numDice), Number(options.keepDice), roll);
}
export function pursuitChatHtml(pursuit, exchange) {
    // DF 2026: Track meter retired from the UI — report only who won the contest.
    const change = exchange.winner === 'tie'
        ? 'Tie'
        : exchange.winner === 'fleeing'
            ? `${pursuit.fleeingName} wins`
            : `${pursuit.pursuerName} wins`;
    const end = exchange.ended === 'escape'
        ? '<p><strong>Escape.</strong> The fleeing creature gets away.</p>'
        : exchange.ended === 'caught'
            ? '<p><strong>Caught.</strong> The pursuer catches the fleeing creature.</p>'
            : '';
    return `<div class="mastery-pursuit">
    <h3>Pursuit</h3>
    <p>${pursuit.fleeingName} (${exchange.fleeingAttribute}) ${exchange.fleeingTotal} [${exchange.fleeingDice.join(', ')}] vs ${pursuit.pursuerName} (${exchange.pursuerAttribute}) ${exchange.pursuerTotal} [${exchange.pursuerDice.join(', ')}]</p>
    <p>${change}.</p>
    ${end}
  </div>`;
}
export function renderPursuitHtml(pursuit) {
    if (!pursuit)
        return '<div class="mastery-pursuit"><p>No Pursuit.</p></div>';
    const last = pursuit.exchanges[pursuit.exchanges.length - 1];
    const lastLine = last ? pursuitChatHtml(pursuit, last) : '<p>No exchange yet.</p>';
    // DF 2026: Track meter display retired; internal `track` stays on the record for flee resolution.
    return `<div class="mastery-pursuit" data-pursuit-id="${pursuit.id}" data-status="${pursuit.status}">
    <p><strong>${pursuit.fleeingName}</strong> flees. <strong>${pursuit.pursuerName}</strong> pursues.</p>
    <p>Status <strong>${pursuit.status}</strong>.</p>
    <p>Attributes: ${pursuit.allowedAttributes.join(', ')}.</p>
    ${lastLine}
  </div>`;
}
export async function resolvePursuitExchange(input) {
    const pursuit = readPursuit(input.combat);
    if (!pursuit)
        return { ok: false, reason: 'No Pursuit is active.' };
    if (pursuit.status !== 'active')
        return { ok: false, pursuit, reason: 'This Pursuit has already ended.' };
    if (input.exchangeKey && pursuit.exchanges.some((row) => row.id === input.exchangeKey)) {
        return { ok: true, pursuit, duplicate: true, exchange: pursuit.exchanges.find((row) => row.id === input.exchangeKey) };
    }
    if (!isAttribute(input.fleeingAttribute) || !pursuit.allowedAttributes.includes(input.fleeingAttribute)) {
        return { ok: false, pursuit, reason: 'That Attribute is not allowed for the fleeing creature.' };
    }
    if (!isAttribute(input.pursuerAttribute) || !pursuit.allowedAttributes.includes(input.pursuerAttribute)) {
        return { ok: false, pursuit, reason: 'That Attribute is not allowed for the pursuer.' };
    }
    if (String(input.fleeingActor?.id) !== pursuit.fleeingActorId || String(input.pursuerActor?.id) !== pursuit.pursuerActorId) {
        return { ok: false, pursuit, reason: 'These creatures are not the Pursuit participants.' };
    }
    if (inFlight.has(pursuit.id))
        return { ok: false, pursuit, reason: 'This exchange is already resolving.' };
    inFlight.add(pursuit.id);
    try {
        const fleeingRoll = await rollSide(input.fleeingActor, input.fleeingAttribute, pursuit.fleeingName);
        const pursuerRoll = await rollSide(input.pursuerActor, input.pursuerAttribute, pursuit.pursuerName);
        const compared = compareContestResults(fleeingRoll.total, pursuerRoll.total);
        const winner = compared === 'initiator' ? 'fleeing' : compared === 'opponent' ? 'pursuer' : 'tie';
        const trackBefore = pursuit.track;
        let trackAfter = trackBefore;
        if (winner === 'fleeing')
            trackAfter += 1;
        if (winner === 'pursuer')
            trackAfter -= 1;
        let ended;
        let status = 'active';
        if (trackAfter >= 2) {
            trackAfter = 2;
            ended = 'escape';
            status = 'escape';
        }
        else if (trackAfter <= -2) {
            trackAfter = -2;
            ended = 'caught';
            status = 'caught';
        }
        const exchange = {
            id: input.exchangeKey || `ex-${pursuit.exchanges.length + 1}`,
            fleeingAttribute: input.fleeingAttribute,
            pursuerAttribute: input.pursuerAttribute,
            fleeingTotal: fleeingRoll.total,
            pursuerTotal: pursuerRoll.total,
            fleeingDice: fleeingRoll.dice,
            pursuerDice: pursuerRoll.dice,
            winner,
            trackBefore,
            trackAfter,
            ...(ended ? { ended } : {}),
        };
        const next = {
            ...pursuit,
            track: trackAfter,
            status,
            exchanges: [...pursuit.exchanges, exchange],
        };
        await writePursuit(input.combat, next);
        const html = pursuitChatHtml(next, exchange);
        try {
            await globalThis.ChatMessage?.create?.({
                content: html,
                speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: input.fleeingActor }) ?? {},
            });
        }
        catch {
            /* chat is optional in tests */
        }
        return { ok: true, pursuit: next, exchange };
    }
    finally {
        inFlight.delete(pursuit.id);
    }
}
//# sourceMappingURL=pursuit.js.map