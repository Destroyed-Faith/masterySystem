/**
 * Chat bar for a raw d8 pool: type a dice count, pick Keep (Mastery Rank 1–8), roll.
 * No Fear, Health, or other pool reductions — this is the manual fallback.
 */

import { MAX_MASTERY_RANK } from '../utils/constants.js';

const MAX_DICE = 99;

export function quickD8Formula(
  diceRaw: unknown,
  keepRaw: unknown,
): { dice: number; keep: number; formula: string; shortLabel: string } | null {
  const dice = Math.floor(Number(diceRaw));
  if (!Number.isFinite(dice) || dice < 1 || dice > MAX_DICE) return null;
  let keep = Math.floor(Number(keepRaw));
  if (!Number.isFinite(keep)) keep = 1;
  keep = Math.max(1, Math.min(MAX_MASTERY_RANK, keep, dice));
  return {
    dice,
    keep,
    formula: `${dice}d8k${keep}`,
    shortLabel: `${dice}k${keep}`,
  };
}

/** One d8. An 8 is rolled again and added until the face is not 8. */
export function explodeD8Chain(rng: () => number = Math.random): number[] {
  const faces: number[] = [];
  while (faces.length < 32) {
    const face = Math.floor(rng() * 8) + 1;
    faces.push(face);
    if (face !== 8) break;
  }
  return faces;
}

export function resolveQuickD8Pool(
  dice: number,
  keep: number,
  rng: () => number = Math.random,
): { chains: number[][]; totals: number[]; keptIndices: number[]; total: number } {
  const chains = Array.from({ length: dice }, () => explodeD8Chain(rng));
  const totals = chains.map((faces) => faces.reduce((sum, face) => sum + face, 0));
  const ranked = totals
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value || a.index - b.index);
  const keptIndices = ranked.slice(0, keep).map((row) => row.index).sort((a, b) => a - b);
  const total = keptIndices.reduce((sum, index) => sum + totals[index]!, 0);
  return { chains, totals, keptIndices, total };
}

function defaultKeep(): number {
  const g = globalThis as any;
  const actor =
    g.canvas?.tokens?.controlled?.[0]?.actor ?? g.game?.user?.character ?? null;
  const rank = Math.floor(Number(actor?.system?.mastery?.rank) || 1);
  return Math.max(1, Math.min(MAX_MASTERY_RANK, rank));
}

let rememberedDice = '';
let rememberedKeep: number | null = null;

function resolveChatControls(
  elements?: Record<string, HTMLElement>,
  htmlRoot?: HTMLElement | JQuery | null,
): HTMLElement | null {
  if (elements) {
    for (const key of ['#chat-controls', 'chat-controls']) {
      const el = elements[key];
      if (el instanceof HTMLElement) return el;
    }
    for (const el of Object.values(elements)) {
      if (el instanceof HTMLElement && el.id === 'chat-controls') return el;
    }
  }
  if (htmlRoot instanceof HTMLElement) {
    return htmlRoot.querySelector('#chat-controls');
  }
  if (htmlRoot && typeof (htmlRoot as JQuery).find === 'function') {
    const found = (htmlRoot as JQuery).find('#chat-controls');
    if (found.length) return found[0] ?? null;
  }
  return document.querySelector('#chat-controls');
}

/** GM Rolls button sits on its own line, above the quick d8 row. */
function parkRollsButton(controls: HTMLElement): void {
  const rolls = document.querySelector('.emr-chat-launch');
  if (!rolls) return;
  const parent = controls.parentElement;
  if (!parent) return;
  let row = parent.querySelector(':scope > .ms-chat-rolls-row') as HTMLElement | null;
  if (!row) {
    row = document.createElement('div');
    row.className = 'ms-chat-rolls-row';
    const d8 = parent.querySelector(':scope > .ms-chat-roll-row');
    if (d8) d8.before(row);
    else controls.before(row);
  }
  if (rolls.parentElement !== row) row.append(rolls);
}

/** Quick d8 fields, one line above Foundry's chat buttons. */
function ensureD8Row(controls: HTMLElement): HTMLElement {
  const parent = controls.parentElement;
  let row = parent?.querySelector(':scope > .ms-chat-roll-row') as HTMLElement | null;
  if (!row) {
    row = document.createElement('div');
    row.className = 'ms-chat-roll-row';
    controls.before(row);
  }
  const rollsRow = parent?.querySelector(':scope > .ms-chat-rolls-row');
  if (rollsRow && row.previousElementSibling !== rollsRow) rollsRow.after(row);
  return row;
}

async function rollFromBar(bar: HTMLElement): Promise<void> {
  const diceInput = bar.querySelector<HTMLInputElement>('.ms-quick-d8-count');
  const keepSelect = bar.querySelector<HTMLSelectElement>('.ms-quick-d8-keep');
  const parsed = quickD8Formula(diceInput?.value, keepSelect?.value);
  if (!parsed) {
    ui.notifications?.warn?.('Dice count: 1–99.');
    diceInput?.focus();
    return;
  }
  rememberedDice = String(parsed.dice);
  rememberedKeep = parsed.keep;
  if (diceInput) diceInput.value = rememberedDice;
  if (keepSelect) keepSelect.value = String(parsed.keep);

  const pool = resolveQuickD8Pool(parsed.dice, parsed.keep);
  const faces = pool.chains.map((chain, index) => {
    const shown = chain.length > 1 ? `${chain.join('+')}=${pool.totals[index]}` : String(pool.totals[index]);
    const kept = pool.keptIndices.includes(index);
    return kept ? `<strong>${shown}</strong>` : shown;
  }).join(', ');

  const content = `
    <div class="dice-roll ms-quick-d8-result">
      <div class="dice-result">
        <h4 class="dice-total">${pool.total}</h4>
      </div>
      <div class="ms-quick-d8-faces">${faces}</div>
    </div>`;

  const g = globalThis as any;
  const speaker = g.ChatMessage?.getSpeaker?.() ?? {};
  if (typeof g.ChatMessage?.create === 'function') {
    await g.ChatMessage.create({ speaker, content });
    return;
  }
  const rolls = buildQuickD8DisplayRoll(g, pool);
  if (rolls[0] && typeof rolls[0].toMessage === 'function') {
    await rolls[0].toMessage({ speaker, content });
  }
}

function buildQuickD8DisplayRoll(g: any, pool: { chains: number[][]; keptIndices: number[] }): any[] {
  const Die = g.foundry?.dice?.terms?.Die;
  const OperatorTerm = g.foundry?.dice?.terms?.OperatorTerm;
  const RollCls = g.Roll;
  if (!Die || !OperatorTerm || typeof RollCls?.fromTerms !== 'function') return [];

  const kept = new Set(pool.keptIndices);
  const terms: any[] = [];
  pool.chains.forEach((faces, index) => {
    if (index > 0) terms.push(new OperatorTerm({ operator: '+' }));
    const results = faces.map((face, faceIndex) => ({
      result: face,
      active: true,
      discarded: !kept.has(index),
      exploded: faceIndex < faces.length - 1,
      rerolled: false,
    }));
    const die = new Die({ faces: 8, number: 1, results });
    die._evaluated = true;
    terms.push(die);
  });

  return [RollCls.fromTerms(terms)];
}

function injectQuickD8Bar(controls: HTMLElement | null | undefined): void {
  if (!controls) return;
  parkRollsButton(controls);
  const row = ensureD8Row(controls);
  if (row.querySelector('.ms-quick-d8')) return;

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
  dice.title = 'Number of d8 (1–99)';
  dice.setAttribute('aria-label', 'Number of d8');
  if (rememberedDice) dice.value = rememberedDice;

  const dieWord = document.createElement('span');
  dieWord.className = 'ms-quick-d8-die';
  dieWord.textContent = 'd8';

  const keepLabel = document.createElement('span');
  keepLabel.className = 'ms-quick-d8-keep-label';
  keepLabel.textContent = 'Keep';

  const keep = document.createElement('select');
  keep.className = 'ms-quick-d8-keep';
  keep.title = 'Mastery Rank — how many d8 to keep';
  keep.setAttribute('aria-label', 'Keep, Mastery Rank');
  const initialKeep = rememberedKeep ?? defaultKeep();
  for (let rank = 1; rank <= MAX_MASTERY_RANK; rank++) {
    const opt = document.createElement('option');
    opt.value = String(rank);
    opt.textContent = String(rank);
    if (rank === initialKeep) opt.selected = true;
    keep.append(opt);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ms-quick-d8-roll';
  button.innerHTML = '<i class="fas fa-dice-d8" aria-hidden="true"></i>';
  button.title = 'Roll Nd8, keep Mastery Rank';
  button.setAttribute('aria-label', 'Roll');

  const submit = (ev: Event) => {
    ev.preventDefault();
    ev.stopPropagation();
    void rollFromBar(bar);
  };
  button.addEventListener('click', submit);
  dice.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    submit(ev);
  });

  bar.append(dice, dieWord, keepLabel, keep, button);
  row.append(bar);
}

function isChatPanelOpen(): boolean {
  const panel = document.querySelector('#chat');
  if (panel instanceof HTMLElement) return panel.classList.contains('active');
  const sidebar = document.querySelector('#sidebar');
  if (sidebar?.classList.contains('collapsed')) return false;
  const g = globalThis as any;
  const app = g.ui?.sidebar;
  const tab = app?.tabGroups?.primary ?? app?.tabGroups?.main ?? app?.activeTab ?? app?.tabName;
  if (typeof tab === 'string' && tab) return tab === 'chat';
  const active = document.querySelector(
    '#sidebar-tabs [data-tab].active, #sidebar-tabs [data-tab][aria-pressed="true"]',
  );
  return active?.getAttribute('data-tab') === 'chat';
}

/** Foundry's Public roll control — the globe next to "Public as User". */
function findPublicGlobe(): HTMLElement | null {
  const controls = document.querySelector('#chat-controls');
  if (!(controls instanceof HTMLElement)) return null;
  const icon = controls.querySelector('i.fa-globe, .fa-globe');
  const fromIcon = icon?.closest('a, button');
  if (fromIcon instanceof HTMLElement) return fromIcon;
  const labeled = controls.querySelector(
    '.roll-type-select, [data-action="rollMode"], [data-tooltip*="Public"], [aria-label*="Public"]',
  );
  return labeled instanceof HTMLElement ? labeled : null;
}

function clearCompactRolls(button: HTMLElement): void {
  button.classList.remove('is-icon-only');
  button.style.position = '';
  button.style.left = '';
  button.style.bottom = '';
  button.style.width = '';
  button.style.height = '';
}

/** Chat closed: only the golden d8, sitting above the Public globe. */
export function syncChatRollChrome(): void {
  const open = isChatPanelOpen();
  document.body.classList.toggle('ms-chat-panel-closed', !open);
  const button = document.querySelector('.emr-chat-launch');
  if (!(button instanceof HTMLElement)) return;
  if (open) {
    clearCompactRolls(button);
    const controls = document.querySelector('#chat-controls');
    if (controls instanceof HTMLElement) parkRollsButton(controls);
    return;
  }

  button.classList.add('is-icon-only');
  const globe = findPublicGlobe();
  const controls = document.querySelector('#chat-controls');
  const host = globe?.parentElement ?? (controls instanceof HTMLElement ? controls : null);
  if (!host) return;
  if (button.parentElement !== host) host.insertBefore(button, globe ?? host.firstChild);
  host.classList.add('ms-rolls-globe-host');
  const anchor = globe ?? host;
  const hostRect = host.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const size = 28;
  button.style.position = 'absolute';
  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.style.bottom = 'calc(100% + 2px)';
  button.style.left = `${Math.max(0, anchorRect.left - hostRect.left + (anchorRect.width - size) / 2)}px`;
}

function tryInject(
  elements?: Record<string, HTMLElement>,
  htmlRoot?: HTMLElement | JQuery | null,
): void {
  injectQuickD8Bar(resolveChatControls(elements, htmlRoot));
  syncChatRollChrome();
}

export function initializeQuickD8Bar(): void {
  Hooks.on('renderChatInput', (_app: unknown, elements: Record<string, HTMLElement>) => {
    tryInject(elements);
  });
  Hooks.on('renderChatLog', (_app: unknown, html: HTMLElement | JQuery) => {
    tryInject(undefined, html);
  });
  Hooks.on('renderSidebarTab', (app: any, html: HTMLElement | JQuery, data?: { tab?: string }) => {
    const tab = data?.tab ?? app?.tab?.name ?? app?.options?.tab?.id;
    if (tab && tab !== 'chat') return;
    const root = html instanceof HTMLElement ? html : (html as JQuery)?.[0];
    tryInject(undefined, root ?? html);
  });
  Hooks.on('changeSidebarTab', () => {
    window.setTimeout(() => tryInject(), 0);
  });
  Hooks.on('collapseSidebar', () => {
    window.setTimeout(() => syncChatRollChrome(), 0);
  });
  Hooks.once('ready', () => {
    window.setTimeout(() => tryInject(), 250);
  });
}
