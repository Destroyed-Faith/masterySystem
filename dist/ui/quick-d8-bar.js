/**
 * Chat bar for a raw d8 pool: type a dice count, pick Keep (Mastery Rank 1–8), roll.
 * No Fear, Health, or other pool reductions — this is the manual fallback.
 */
import { MAX_MASTERY_RANK } from '../utils/constants.js';
const MAX_DICE = 99;
export function quickD8Formula(diceRaw, keepRaw) {
    const dice = Math.floor(Number(diceRaw));
    if (!Number.isFinite(dice) || dice < 1 || dice > MAX_DICE)
        return null;
    let keep = Math.floor(Number(keepRaw));
    if (!Number.isFinite(keep))
        keep = 1;
    keep = Math.max(1, Math.min(MAX_MASTERY_RANK, keep, dice));
    return { dice, keep, formula: `${dice}d8kh${keep}` };
}
function defaultKeep() {
    const g = globalThis;
    const actor = g.canvas?.tokens?.controlled?.[0]?.actor ?? g.game?.user?.character ?? null;
    const rank = Math.floor(Number(actor?.system?.mastery?.rank) || 1);
    return Math.max(1, Math.min(MAX_MASTERY_RANK, rank));
}
let rememberedDice = '';
let rememberedKeep = null;
function resolveChatControls(elements, htmlRoot) {
    if (elements) {
        for (const key of ['#chat-controls', 'chat-controls']) {
            const el = elements[key];
            if (el instanceof HTMLElement)
                return el;
        }
        for (const el of Object.values(elements)) {
            if (el instanceof HTMLElement && el.id === 'chat-controls')
                return el;
        }
    }
    if (htmlRoot instanceof HTMLElement) {
        return htmlRoot.querySelector('#chat-controls');
    }
    if (htmlRoot && typeof htmlRoot.find === 'function') {
        const found = htmlRoot.find('#chat-controls');
        if (found.length)
            return found[0] ?? null;
    }
    return document.querySelector('#chat-controls');
}
/** GM Rolls button sits on its own line, above the quick d8 row. */
function parkRollsButton(controls) {
    const rolls = document.querySelector('.emr-chat-launch');
    if (!rolls)
        return;
    const parent = controls.parentElement;
    if (!parent)
        return;
    let row = parent.querySelector(':scope > .ms-chat-rolls-row');
    if (!row) {
        row = document.createElement('div');
        row.className = 'ms-chat-rolls-row';
        const d8 = parent.querySelector(':scope > .ms-chat-roll-row');
        if (d8)
            d8.before(row);
        else
            controls.before(row);
    }
    if (rolls.parentElement !== row)
        row.append(rolls);
}
/** Quick d8 fields, one line above Foundry's chat buttons. */
function ensureD8Row(controls) {
    const parent = controls.parentElement;
    let row = parent?.querySelector(':scope > .ms-chat-roll-row');
    if (!row) {
        row = document.createElement('div');
        row.className = 'ms-chat-roll-row';
        controls.before(row);
    }
    const rollsRow = parent?.querySelector(':scope > .ms-chat-rolls-row');
    if (rollsRow && row.previousElementSibling !== rollsRow)
        rollsRow.after(row);
    return row;
}
async function rollFromBar(bar) {
    const diceInput = bar.querySelector('.ms-quick-d8-count');
    const keepSelect = bar.querySelector('.ms-quick-d8-keep');
    const parsed = quickD8Formula(diceInput?.value, keepSelect?.value);
    if (!parsed) {
        ui.notifications?.warn?.('Würfelanzahl: 1–99.');
        diceInput?.focus();
        return;
    }
    rememberedDice = String(parsed.dice);
    rememberedKeep = parsed.keep;
    if (diceInput)
        diceInput.value = rememberedDice;
    if (keepSelect)
        keepSelect.value = String(parsed.keep);
    const g = globalThis;
    const RollCls = g.Roll;
    if (typeof RollCls !== 'function')
        return;
    const roll = new RollCls(parsed.formula);
    await roll.evaluate();
    const speaker = g.ChatMessage?.getSpeaker?.() ?? {};
    await roll.toMessage({
        speaker,
        flavor: `${parsed.dice}d8 · Keep ${parsed.keep}`,
    });
}
function injectQuickD8Bar(controls) {
    if (!controls)
        return;
    parkRollsButton(controls);
    const row = ensureD8Row(controls);
    if (row.querySelector('.ms-quick-d8'))
        return;
    const bar = document.createElement('div');
    bar.className = 'ms-quick-d8';
    const dice = document.createElement('input');
    dice.type = 'number';
    dice.className = 'ms-quick-d8-count';
    dice.min = '1';
    dice.max = String(MAX_DICE);
    dice.step = '1';
    dice.inputMode = 'numeric';
    dice.placeholder = '2';
    dice.title = 'Anzahl d8 (1–99)';
    dice.setAttribute('aria-label', 'Anzahl d8');
    if (rememberedDice)
        dice.value = rememberedDice;
    const dieWord = document.createElement('span');
    dieWord.className = 'ms-quick-d8-die';
    dieWord.textContent = 'd8';
    const keepLabel = document.createElement('span');
    keepLabel.className = 'ms-quick-d8-keep-label';
    keepLabel.textContent = 'Keep';
    const keep = document.createElement('select');
    keep.className = 'ms-quick-d8-keep';
    keep.title = 'Mastery Rank — so viele d8 behalten';
    keep.setAttribute('aria-label', 'Keep, Mastery Rank');
    const initialKeep = rememberedKeep ?? defaultKeep();
    for (let rank = 1; rank <= MAX_MASTERY_RANK; rank++) {
        const opt = document.createElement('option');
        opt.value = String(rank);
        opt.textContent = String(rank);
        if (rank === initialKeep)
            opt.selected = true;
        keep.append(opt);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ms-quick-d8-roll';
    button.innerHTML = '<i class="fas fa-dice-d8" aria-hidden="true"></i>';
    button.title = 'Nd8 behalten nach Mastery Rank';
    button.setAttribute('aria-label', 'Würfeln');
    const submit = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void rollFromBar(bar);
    };
    button.addEventListener('click', submit);
    dice.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter')
            return;
        submit(ev);
    });
    bar.append(dice, dieWord, keepLabel, keep, button);
    row.append(bar);
}
function tryInject(elements, htmlRoot) {
    injectQuickD8Bar(resolveChatControls(elements, htmlRoot));
}
export function initializeQuickD8Bar() {
    Hooks.on('renderChatInput', (_app, elements) => {
        tryInject(elements);
    });
    Hooks.on('renderChatLog', (_app, html) => {
        tryInject(undefined, html);
    });
    Hooks.on('renderSidebarTab', (app, html, data) => {
        const tab = data?.tab ?? app?.tab?.name ?? app?.options?.tab?.id;
        if (tab && tab !== 'chat')
            return;
        const root = html instanceof HTMLElement ? html : html?.[0];
        tryInject(undefined, root ?? html);
    });
    Hooks.on('changeSidebarTab', () => {
        window.setTimeout(() => tryInject(), 0);
    });
    Hooks.once('ready', () => {
        window.setTimeout(() => tryInject(), 250);
    });
}
//# sourceMappingURL=quick-d8-bar.js.map