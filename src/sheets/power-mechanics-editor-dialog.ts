/**
 * Power Mechanics Editor Dialog
 *
 * Lets the user view and edit the structured `PowerMechanics` block of an
 * embedded power item at runtime inside Foundry. Exposes two scopes:
 *   - Power-level default (`system.mechanics`) — used when a rank has no
 *     rank-specific block.
 *   - Per-rank override (`system.levels.<rank>.mechanics`) — per-rank data.
 *
 * Intentionally dual-mode: a guided form for the common fields (armor,
 * evade, saveDice, rollDice, damageRider, applyWhen, duration, usageLimit,
 * condition, tempHP, regen, initiativeD8, movementBonus, ignoreTerrain) plus
 * a JSON textarea for everything the form does not cover (manual override).
 *
 * Saves via `actor.items.get(powerId).update({ ... })`, so the actor's
 * `prepareDerivedData` re-runs and the aggregator picks up changes live.
 */

import type { PowerMechanics } from '../types/item';

type Scope = 'power' | 'rank';

interface OpenOptions {
  /** The actor that owns the embedded power item (character or npc). */
  actor: any;
  /** The embedded power Item (actor.items.get(powerId)). */
  power: any;
}

function readCurrent(power: any, scope: Scope, rank: number): PowerMechanics | null {
  const sys = power?.system ?? {};
  if (scope === 'rank') {
    const lvl = sys.levels?.[String(rank)];
    return (lvl?.mechanics ?? null) as PowerMechanics | null;
  }
  return (sys.mechanics ?? null) as PowerMechanics | null;
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function numAttr(n: number | undefined): string {
  return typeof n === 'number' && isFinite(n) ? String(n) : '';
}

function renderForm(m: PowerMechanics | null): string {
  const mech: any = m ?? {};
  const dr = mech.damageRider ?? {};
  const sd = mech.saveDice ?? {};
  const rd = mech.rollDice ?? {};
  const ul = mech.usageLimit ?? {};

  const applyWhenOptions = [
    ['passive-slotted-active', 'Passive (slotted active)'],
    ['activeBuff-active', 'Active Buff (running)'],
    ['reaction-once-per-round', 'Reaction (once per round)'],
    ['attack-rider', 'Attack rider (this power only)'],
    ['manual', 'Manual (GM-applied)'],
  ];
  const applyWhenHtml = applyWhenOptions
    .map(([v, l]) => `<option value="${v}" ${mech.applyWhen === v ? 'selected' : ''}>${esc(l)}</option>`)
    .join('');

  const durationOptions = [
    ['', '(none)'],
    ['masteryRankRounds', 'masteryRankRounds'],
    ['untilNextTurn', 'untilNextTurn'],
    ['scene', 'scene'],
    ['instant', 'instant'],
  ];
  const durationHtml = durationOptions
    .map(([v, l]) => `<option value="${v}" ${(mech.duration ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`)
    .join('');

  const conditionOptions = [
    ['', '(none — always applies)'],
    ['targetMarked', 'targetMarked'],
    ['targetIgnited', 'targetIgnited'],
    ['targetShocked', 'targetShocked'],
    ['targetFrozen', 'targetFrozen'],
    ['targetHexed', 'targetHexed'],
    ['self-hp-below-50', 'self-hp-below-50'],
  ];
  const conditionHtml = conditionOptions
    .map(([v, l]) => `<option value="${v}" ${(mech.condition ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`)
    .join('');

  const vsCondOptions = [
    ['', '(none)'],
    ['marked', 'marked'],
    ['ignited', 'ignited'],
    ['shocked', 'shocked'],
    ['frozen', 'frozen'],
    ['hexed', 'hexed'],
  ];
  const vsCondHtml = vsCondOptions
    .map(([v, l]) => `<option value="${v}" ${(dr.vsCondition ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`)
    .join('');

  const usagePerOptions = [
    ['', '(none)'],
    ['round', 'round'],
    ['combat', 'combat'],
    ['day', 'day'],
  ];
  const usagePerHtml = usagePerOptions
    .map(([v, l]) => `<option value="${v}" ${(ul.per ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`)
    .join('');

  return `
    <fieldset class="pme-section">
      <legend>Static bonuses</legend>
      <div class="pme-grid">
        <label>Armor <input type="number" data-mech="armor" value="${numAttr(mech.armor)}" step="1"/></label>
        <label>Evade <input type="number" data-mech="evade" value="${numAttr(mech.evade)}" step="1"/></label>
        <label>Initiative d8 <input type="number" data-mech="initiativeD8" value="${numAttr(mech.initiativeD8)}" step="1"/></label>
        <label>Regen <input type="number" data-mech="regen" value="${numAttr(mech.regen)}" step="1"/></label>
        <label>Movement +m <input type="number" data-mech="movementBonus" value="${numAttr(mech.movementBonus)}" step="1"/></label>
        <label>Temp HP <input type="text" data-mech="tempHP" value="${esc(mech.tempHP ?? '')}" placeholder="1d8 or 3"/></label>
      </div>
      <label class="pme-checkbox">
        <input type="checkbox" data-mech="ignoreTerrain" ${mech.ignoreTerrain ? 'checked' : ''}/>
        Ignore difficult terrain
      </label>
    </fieldset>

    <fieldset class="pme-section">
      <legend>Roll-dice bonuses</legend>
      <div class="pme-grid">
        <label>Attack <input type="number" data-mech="rollDice.attack" value="${numAttr(rd.attack)}" step="1"/></label>
        <label>Skill <input type="number" data-mech="rollDice.skill" value="${numAttr(rd.skill)}" step="1"/></label>
        <label>Damage <input type="number" data-mech="rollDice.damage" value="${numAttr(rd.damage)}" step="1"/></label>
      </div>
    </fieldset>

    <fieldset class="pme-section">
      <legend>Save-dice bonuses</legend>
      <div class="pme-grid">
        <label>Body <input type="number" data-mech="saveDice.body" value="${numAttr(sd.body)}" step="1"/></label>
        <label>Mind <input type="number" data-mech="saveDice.mind" value="${numAttr(sd.mind)}" step="1"/></label>
        <label>Spirit <input type="number" data-mech="saveDice.spirit" value="${numAttr(sd.spirit)}" step="1"/></label>
      </div>
    </fieldset>

    <fieldset class="pme-section">
      <legend>Damage rider</legend>
      <div class="pme-grid">
        <label>Flat (+Nd8) <input type="text" data-mech="damageRider.flat" value="${esc(dr.flat ?? '')}" placeholder="+1d8"/></label>
        <label>vs Condition
          <select data-mech="damageRider.vsCondition">${vsCondHtml}</select>
        </label>
        <label>vs dmg <input type="text" data-mech="damageRider.vsConditionDamage" value="${esc(dr.vsConditionDamage ?? '')}" placeholder="+2d8"/></label>
      </div>
    </fieldset>

    <fieldset class="pme-section">
      <legend>Timing</legend>
      <div class="pme-grid">
        <label>applyWhen
          <select data-mech="applyWhen">${applyWhenHtml}</select>
        </label>
        <label>duration
          <select data-mech="duration">${durationHtml}</select>
        </label>
        <label>usage per
          <select data-mech="usageLimit.per">${usagePerHtml}</select>
        </label>
        <label>usage max <input type="number" data-mech="usageLimit.max" value="${numAttr(ul.max)}" step="1" min="0"/></label>
        <label>condition gate
          <select data-mech="condition">${conditionHtml}</select>
        </label>
      </div>
    </fieldset>
  `;
}

/** Compile the DOM form back into a PowerMechanics object (or null if empty). */
function readFormValues(root: HTMLElement): PowerMechanics | null {
  const m: any = {};
  const parse = (el: HTMLInputElement | HTMLSelectElement) => {
    const key = el.dataset.mech!;
    const segments = key.split('.');
    let val: any;
    if (el.type === 'checkbox') {
      val = (el as HTMLInputElement).checked ? true : undefined;
    } else if (el.type === 'number') {
      const raw = el.value.trim();
      const n = raw === '' ? undefined : Number(raw);
      val = Number.isFinite(n) && n !== 0 ? n : undefined;
    } else {
      val = el.value.trim();
      if (val === '') val = undefined;
    }
    if (val === undefined) return;
    // Build nested structure.
    let node = m;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      node[seg] = node[seg] ?? {};
      node = node[seg];
    }
    node[segments[segments.length - 1]] = val;
  };

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-mech]').forEach(parse);

  // Empty-detection: a mechanics block is useful only if it carries at least one meaningful field.
  // applyWhen alone is not enough (every block carries it), but if applyWhen is absent we clear everything.
  if (!m.applyWhen) return null;
  const keys = Object.keys(m).filter((k) => k !== 'applyWhen' && k !== 'duration' && k !== 'usageLimit');
  const hasNested = (obj: any) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  const meaningful =
    keys.length > 0 ||
    hasNested(m.saveDice) ||
    hasNested(m.rollDice) ||
    hasNested(m.damageRider);
  if (!meaningful) return null;

  return m as PowerMechanics;
}

export async function openPowerMechanicsEditor({ actor, power }: OpenOptions): Promise<void> {
  if (!actor || !power) {
    ui.notifications?.warn('Power Mechanics editor: missing actor or power.');
    return;
  }

  const sys = power.system ?? {};
  const rank = Math.max(1, Math.min(4, Number(sys.rank ?? 1)));
  let scope: Scope = sys.levels?.[String(rank)]?.mechanics ? 'rank' : 'power';

  const renderBody = (): string => {
    const current = readCurrent(power, scope, rank);
    const formHtml = renderForm(current);
    const jsonText = esc(current ? JSON.stringify(current, null, 2) : '');
    return `
      <form class="pme-form" autocomplete="off">
        <div class="pme-header">
          <div class="pme-header-row">
            <strong>Power:</strong> ${esc(power.name)}
            <span class="pme-chip">rank ${rank}</span>
          </div>
          <div class="pme-header-row">
            <label>
              Scope:
              <select name="scope">
                <option value="power" ${scope === 'power' ? 'selected' : ''}>Power-level default (applies to all ranks without own block)</option>
                <option value="rank" ${scope === 'rank' ? 'selected' : ''}>Rank-${rank} override</option>
              </select>
            </label>
          </div>
        </div>

        <div class="pme-panels">
          <div class="pme-form-panel">${formHtml}</div>
          <details class="pme-raw">
            <summary>Raw JSON (advanced)</summary>
            <textarea class="pme-json" rows="10" placeholder='{ "armor": 2, "applyWhen": "passive-slotted-active" }'>${jsonText}</textarea>
            <p class="pme-hint">Takes precedence over the form fields when non-empty and parseable. Leave empty to use the form.</p>
          </details>
        </div>
      </form>
    `;
  };

  const dialog: any = new (foundry.appv1 as any).api.Dialog({
    title: `Mechanics — ${power.name}`,
    content: renderBody(),
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: 'Save',
        callback: async (html: any) => {
          const root: HTMLElement = (html[0] ?? html).querySelector('.pme-form');
          const jsonRaw = (root.querySelector('.pme-json') as HTMLTextAreaElement)?.value?.trim() ?? '';
          const scopeSel = (root.querySelector('select[name="scope"]') as HTMLSelectElement)?.value as Scope;
          const activeScope: Scope = scopeSel || scope;

          let nextMech: PowerMechanics | null = null;
          if (jsonRaw) {
            try {
              const parsed = JSON.parse(jsonRaw);
              if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
              if (!parsed.applyWhen) throw new Error('missing `applyWhen` — required on every block.');
              nextMech = parsed as PowerMechanics;
            } catch (err: any) {
              ui.notifications?.error(`Invalid JSON: ${err?.message ?? err}`);
              throw err;
            }
          } else {
            nextMech = readFormValues(root);
          }

          try {
            if (activeScope === 'rank') {
              const levels = foundry.utils.deepClone(sys.levels ?? {});
              const levelKey = String(rank);
              const row = { ...(levels[levelKey] ?? {}) };
              if (nextMech) {
                row.mechanics = nextMech;
              } else {
                delete row.mechanics;
              }
              levels[levelKey] = row;
              await power.update({ 'system.levels': levels });
            } else {
              if (nextMech) {
                await power.update({ 'system.mechanics': nextMech });
              } else {
                await power.update({ 'system.mechanics': null });
              }
            }
            ui.notifications?.info(`Saved mechanics for ${power.name}.`);
            // Force actor re-prepare so aggregator picks up changes immediately.
            try { (actor as any).prepareData?.(); } catch { /* best-effort */ }
            try { actor.sheet?.render?.(false); } catch { /* best-effort */ }
          } catch (err) {
            console.error('Mastery System | power-mechanics editor save failed', err);
            ui.notifications?.error('Save failed — see console.');
          }
        },
      },
      clear: {
        icon: '<i class="fas fa-trash"></i>',
        label: 'Clear block',
        callback: async () => {
          const activeScope = scope;
          try {
            if (activeScope === 'rank') {
              const levels = foundry.utils.deepClone(sys.levels ?? {});
              const levelKey = String(rank);
              const row = { ...(levels[levelKey] ?? {}) };
              delete row.mechanics;
              levels[levelKey] = row;
              await power.update({ 'system.levels': levels });
            } else {
              await power.update({ 'system.mechanics': null });
            }
            ui.notifications?.info(`Cleared mechanics for ${power.name}.`);
          } catch (err) {
            console.error('Mastery System | power-mechanics editor clear failed', err);
            ui.notifications?.error('Clear failed — see console.');
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: 'Cancel' },
    },
    default: 'save',
    render: (html: any) => {
      const $root: any = (html && typeof (html as any).find === 'function') ? html : (html?.[0] ? $(html[0]) : null);
      if (!$root) return;
      $root.find('select[name="scope"]').on('change', async (ev: any) => {
        scope = (ev.currentTarget as HTMLSelectElement).value as Scope;
        // Re-render body in place.
        const panels = $root.find('.pme-panels')[0] as HTMLElement;
        const current = readCurrent(power, scope, rank);
        panels.querySelector('.pme-form-panel')!.innerHTML = renderForm(current);
        const jsonEl = panels.querySelector('.pme-json') as HTMLTextAreaElement | null;
        if (jsonEl) jsonEl.value = current ? JSON.stringify(current, null, 2) : '';
      });
    },
  }, {
    classes: ['mastery-system', 'dialog', 'power-mechanics-editor'],
    width: 560,
    height: 'auto',
  });
  dialog.render(true);
}
