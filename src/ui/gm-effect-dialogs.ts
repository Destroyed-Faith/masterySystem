/**
 * GM dialogs for carousel Special apply / area apply / Surprise assignment.
 */

import {
  applyGmEffect,
  adjustGmEffect,
  collectTargetsByScope,
  formatSpecialLine,
  listGmAssignableSpecials,
  previewGmEffectApply,
  removeGmEffect,
  resolveGmEffectActor,
  undoLastGmEffectBulk,
  type GmEffectMode,
  type GmEffectScope,
  type GmEffectSideFilter,
  type GmEffectTargetRef,
} from '../combat/gm-effect-service.js';
import { getEffectById, getEffectBaseName } from '../utils/special-effects.js';
import { readActorStatusEffects, statusEntryId } from '../system/active-specials.js';
import { addSurpriseEdges, applySurpriseOrderToCombat, computeSurpriseOrderForCombat } from '../combat/surprise-order.js';

function esc(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function assertGm(): boolean {
  return !!(globalThis as any).game?.user?.isGM;
}

async function pickSourceCombatant(combat: any): Promise<{ name: string; uuid: string } | null> {
  const bag = combat?.combatants;
  const list: any[] = bag?.contents
    ? bag.contents
    : typeof bag?.values === 'function'
      ? Array.from(bag.values())
      : Array.from(bag ?? []);
  if (!list.length) return null;
  const options = list
    .map((c) => {
      const actor = c.actor;
      const uuid = String(actor?.uuid || actor?.id || c.id || '');
      return `<option value="${esc(uuid)}">${esc(String(c.name || actor?.name || c.id))}</option>`;
    })
    .join('');
  const DialogCtor = (globalThis as any).Dialog;
  return new Promise((resolve) => {
    new DialogCtor({
      title: 'Challenge Source',
      content: `<form><p>Select the challenger (source).</p>
        <select name="src" class="js-gm-challenge-src">${options}</select></form>`,
      buttons: {
        ok: {
          label: 'Use Source',
          callback: (html: any) => {
            const val = String(html?.find?.('[name="src"]')?.val?.() || '');
            const c = list.find(
              (x) => String(x.actor?.uuid || x.actor?.id || x.id) === val,
            );
            resolve(
              c
                ? {
                    name: String(c.name || c.actor?.name || ''),
                    uuid: String(c.actor?.uuid || c.actor?.id || ''),
                  }
                : null,
            );
          },
        },
        cancel: { label: 'Cancel', callback: () => resolve(null) },
      },
      default: 'ok',
    }).render(true);
  });
}

export async function openGmApplySpecialDialog(targets: GmEffectTargetRef[]): Promise<void> {
  if (!assertGm() || !targets.length) return;
  const specials = listGmAssignableSpecials();
  const DialogCtor = (globalThis as any).Dialog;
  if (typeof DialogCtor !== 'function') return;

  const opts = specials
    .map(
      (s) =>
        `<option value="${esc(s.id)}" data-has-value="${s.hasValue ? '1' : '0'}">${esc(
          getEffectBaseName(s.name),
        )}</option>`,
    )
    .join('');

  await new Promise<void>((resolve) => {
    const dialog = new DialogCtor({
      title: `Apply Special (${targets.length})`,
      content: `<form class="ms-gm-effect-dialog">
        <label>Special
          <input type="search" class="js-gm-fx-filter" placeholder="Search…" />
          <select class="js-gm-fx-special" size="10">${opts}</select>
        </label>
        <label class="js-gm-fx-value-wrap">X
          <input type="number" class="js-gm-fx-value" min="1" max="40" value="1" />
        </label>
        <div class="js-gm-fx-desc md-sublabel"></div>
        <div class="js-gm-fx-preview"></div>
      </form>`,
      buttons: {
        rules: {
          label: 'Apply Normally',
          callback: async (html: any) => {
            await runApply(html, targets, 'rules');
          },
        },
        exact: {
          label: 'GM Override – Set Exact Value',
          callback: async (html: any) => {
            await runApply(html, targets, 'exact');
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'rules',
      close: () => resolve(),
      render: (html: any) => {
        const $ = (globalThis as any).$;
        const root = $(html);
        const sync = () => {
          const id = String(root.find('.js-gm-fx-special').val() || '');
          const def = getEffectById(id);
          root.find('.js-gm-fx-value-wrap').toggle(!!def?.hasValue);
          root.find('.js-gm-fx-desc').text(def?.description || '');
          const value = Math.max(1, Math.floor(Number(root.find('.js-gm-fx-value').val()) || 1));
          const preview = previewGmEffectApply({
            targets,
            specialId: id,
            value: def?.hasValue ? value : null,
            mode: 'rules',
          });
          root.find('.js-gm-fx-preview').html(
            `<p><strong>${esc(formatSpecialLine(id, def?.hasValue ? value : null))}</strong> → ${esc(
              targets.map((t) => t.name || '?').join(', '),
            )}</p><ul>${preview
              .map(
                (p) =>
                  `<li>${esc(p.name)}: ${p.before ?? '—'} → ${esc(String(p.expectedAfter ?? '—'))}${
                    p.restriction ? ` <em>(${esc(p.restriction)})</em>` : ''
                  }</li>`,
              )
              .join('')}</ul>`,
          );
        };
        root.find('.js-gm-fx-special, .js-gm-fx-value').on('change input', sync);
        root.find('.js-gm-fx-filter').on('input', () => {
          const q = String(root.find('.js-gm-fx-filter').val() || '').toLowerCase();
          root.find('.js-gm-fx-special option').each((_: number, el: HTMLOptionElement) => {
            el.hidden = !!q && !el.textContent?.toLowerCase().includes(q);
          });
        });
        sync();
      },
    });
    dialog.render(true);
  });
}

async function runApply(html: any, targets: GmEffectTargetRef[], mode: GmEffectMode): Promise<void> {
  const $ = (globalThis as any).$;
  const root = $(html);
  const specialId = String(root.find('.js-gm-fx-special').val() || '');
  const def = getEffectById(specialId);
  const value = def?.hasValue ? Math.max(1, Math.floor(Number(root.find('.js-gm-fx-value').val()) || 1)) : null;
  let source = null as { name: string; uuid: string } | null;
  if (specialId === 'challenge' && mode === 'rules') {
    source = await pickSourceCombatant((globalThis as any).game?.combat);
    if (!source) {
      (globalThis as any).ui?.notifications?.warn?.('Challenge requires a source.');
      return;
    }
  }
  const result = await applyGmEffect({
    targets,
    specialId,
    value,
    mode,
    source,
  });
  if (!result.ok) {
    (globalThis as any).ui?.notifications?.warn?.(result.errors.join('; ') || 'Apply failed');
  } else {
    (globalThis as any).ui?.notifications?.info?.(
      `${result.specialLabel} applied to ${result.results.filter((r) => r.ok).length} target(s).`,
    );
  }
}

export async function openGmRemoveSpecialDialog(targets: GmEffectTargetRef[]): Promise<void> {
  if (!assertGm() || !targets.length) return;
  const specials = listGmAssignableSpecials();
  const DialogCtor = (globalThis as any).Dialog;
  const opts = specials
    .map((s) => `<option value="${esc(s.id)}">${esc(getEffectBaseName(s.name))}</option>`)
    .join('');
  await new Promise<void>((resolve) => {
    new DialogCtor({
      title: 'Remove Special',
      content: `<form><select class="js-gm-fx-special">${opts}</select></form>`,
      buttons: {
        remove: {
          label: 'Remove',
          callback: async (html: any) => {
            const id = String(html?.find?.('.js-gm-fx-special')?.val?.() || '');
            const result = await removeGmEffect(targets, id);
            (globalThis as any).ui?.notifications?.info?.(
              result.ok ? `Removed ${result.specialLabel}.` : result.errors.join('; '),
            );
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'remove',
      close: () => resolve(),
    }).render(true);
  });
}

export async function openGmAdjustSpecialDialog(targets: GmEffectTargetRef[]): Promise<void> {
  if (!assertGm() || !targets.length) return;
  // Collect specials present on any selected target
  const present = new Map<string, string>();
  for (const ref of targets) {
    const resolved = resolveGmEffectActor(ref);
    if (!resolved) continue;
    for (const e of readActorStatusEffects(resolved.actor)) {
      const id = statusEntryId(e) || String(e.id || '').toLowerCase();
      if (!id) continue;
      const def = getEffectById(id);
      present.set(id, def ? getEffectBaseName(def.name) : id);
    }
  }
  if (!present.size) {
    (globalThis as any).ui?.notifications?.warn?.('No Specials on the selection.');
    return;
  }
  const opts = [...present.entries()]
    .map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`)
    .join('');
  const DialogCtor = (globalThis as any).Dialog;
  await new Promise<void>((resolve) => {
    new DialogCtor({
      title: 'Adjust Existing Special',
      content: `<form>
        <select class="js-gm-fx-special">${opts}</select>
        <label>Exact X <input type="number" class="js-gm-fx-value" min="0" max="40" value="1" /></label>
        <p class="md-sublabel">GM Override — sets the exact stored value.</p>
      </form>`,
      buttons: {
        set: {
          label: 'Set Exact Value',
          callback: async (html: any) => {
            const id = String(html?.find?.('.js-gm-fx-special')?.val?.() || '');
            const value = Math.max(0, Math.floor(Number(html?.find?.('.js-gm-fx-value')?.val?.()) || 0));
            if (value <= 0) {
              await removeGmEffect(targets, id);
            } else {
              await adjustGmEffect(targets, id, value);
            }
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'set',
      close: () => resolve(),
    }).render(true);
  });
}

export async function openGmApplyToAreaDialog(selected: GmEffectTargetRef[]): Promise<void> {
  if (!assertGm()) return;
  const DialogCtor = (globalThis as any).Dialog;
  const specials = listGmAssignableSpecials();
  const opts = specials
    .map(
      (s) =>
        `<option value="${esc(s.id)}" data-has-value="${s.hasValue ? '1' : '0'}">${esc(
          getEffectBaseName(s.name),
        )}</option>`,
    )
    .join('');
  await new Promise<void>((resolve) => {
    new DialogCtor({
      title: 'Apply to Area / Auf Bereich anwenden',
      content: `<form class="ms-gm-area-dialog">
        <label>Scope
          <select class="js-gm-scope">
            <option value="selected">Selected Combatants</option>
            <option value="allCombatants">All Combatants (this Combat)</option>
            <option value="allSceneTokens">All Scene Tokens</option>
          </select>
        </label>
        <label>Side filter
          <select class="js-gm-side">
            <option value="all">All</option>
            <option value="friendly">Friendly</option>
            <option value="neutral">Neutral</option>
            <option value="hostile">Hostile</option>
          </select>
        </label>
        <label>Special
          <select class="js-gm-fx-special">${opts}</select>
        </label>
        <label class="js-gm-fx-value-wrap">X
          <input type="number" class="js-gm-fx-value" min="1" max="40" value="1" />
        </label>
        <div class="js-gm-fx-preview"></div>
      </form>`,
      buttons: {
        rules: {
          label: 'Apply Now (Normally)',
          callback: async (html: any) => {
            await runArea(html, selected, 'rules');
          },
        },
        exact: {
          label: 'Apply Now (GM Override)',
          callback: async (html: any) => {
            await runArea(html, selected, 'exact');
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'rules',
      close: () => resolve(),
      render: (html: any) => {
        const $ = (globalThis as any).$;
        const root = $(html);
        const sync = () => {
          const scope = String(root.find('.js-gm-scope').val() || 'selected') as GmEffectScope;
          const side = String(root.find('.js-gm-side').val() || 'all') as GmEffectSideFilter;
          const targets = collectTargetsByScope(scope, { selected, sideFilter: side });
          const id = String(root.find('.js-gm-fx-special').val() || '');
          const def = getEffectById(id);
          root.find('.js-gm-fx-value-wrap').toggle(!!def?.hasValue);
          const value = Math.max(1, Math.floor(Number(root.find('.js-gm-fx-value').val()) || 1));
          root
            .find('.js-gm-fx-preview')
            .html(
              `<p>${targets.length} target(s): ${esc(targets.map((t) => t.name || '?').join(', '))}</p>
               <p>${esc(formatSpecialLine(id, def?.hasValue ? value : null))}</p>`,
            );
        };
        root.find('select, input').on('change input', sync);
        sync();
      },
    }).render(true);
  });
}

async function runArea(
  html: any,
  selected: GmEffectTargetRef[],
  mode: GmEffectMode,
): Promise<void> {
  const $ = (globalThis as any).$;
  const root = $(html);
  const scope = String(root.find('.js-gm-scope').val() || 'selected') as GmEffectScope;
  const side = String(root.find('.js-gm-side').val() || 'all') as GmEffectSideFilter;
  const targets = collectTargetsByScope(scope, { selected, sideFilter: side });
  if (!targets.length) {
    (globalThis as any).ui?.notifications?.warn?.('No targets in scope.');
    return;
  }
  await runApply(root, targets, mode);
}

export async function openGmSurprisePriorityDialog(attackerRefs: GmEffectTargetRef[]): Promise<void> {
  if (!assertGm()) return;
  const combat = (globalThis as any).game?.combat;
  if (!combat) {
    (globalThis as any).ui?.notifications?.warn?.('No active combat.');
    return;
  }
  const attackerIds = attackerRefs.map((r) => String(r.combatantId || '')).filter(Boolean);
  if (!attackerIds.length) {
    (globalThis as any).ui?.notifications?.warn?.('Select attacking combatants first.');
    return;
  }
  const bag = combat.combatants;
  const list: any[] = bag?.contents
    ? bag.contents
    : typeof bag?.values === 'function'
      ? Array.from(bag.values())
      : Array.from(bag ?? []);
  const attackerSet = new Set(attackerIds);
  const candidates = list.filter((c) => !attackerSet.has(String(c.id)));
  const checks = candidates
    .map(
      (c) =>
        `<label><input type="checkbox" class="js-gm-surprise-tgt" value="${esc(String(c.id))}" /> ${esc(
          String(c.name || c.actor?.name || c.id),
        )} (Ini ${Number(c.initiative) || 0})</label>`,
    )
    .join('<br/>');
  const DialogCtor = (globalThis as any).Dialog;
  await new Promise<void>((resolve) => {
    new DialogCtor({
      title: 'Surprise Priority',
      content: `<form>
        <p>Attackers surprise which combatants?</p>
        <div class="ms-gm-surprise-targets">${checks || '<em>No opposing combatants.</em>'}</div>
      </form>`,
      buttons: {
        ok: {
          label: 'Confirm',
          callback: async (html: any) => {
            const $ = (globalThis as any).$;
            const targetIds: string[] = [];
            $(html)
              .find('.js-gm-surprise-tgt:checked')
              .each((_: number, el: HTMLInputElement) => {
                targetIds.push(String(el.value));
              });
            if (!targetIds.length) {
              (globalThis as any).ui?.notifications?.warn?.('Select at least one surprised combatant.');
              return;
            }
            const result = await addSurpriseEdges(combat, attackerIds, targetIds);
            if (!result.ok) {
              (globalThis as any).ui?.notifications?.error?.(result.error);
              return;
            }
            const { MASTERY_SKIP_TURN_BONUS_CLEAR } = await import('../combat/combat-update-options.js');
            if (typeof combat.setupTurns === 'function') await combat.setupTurns();
            try {
              const { syncCombatTurnToHighestInitiativeFirst } = await import(
                '../combat/initiative-roll.js'
              );
              await syncCombatTurnToHighestInitiativeFirst(combat);
            } catch {
              await combat.update?.({ turn: combat.turn }, { [MASTERY_SKIP_TURN_BONUS_CLEAR]: true });
            }
            (globalThis as any).ui?.notifications?.info?.(
              `Surprise order: ${result.orderIds
                .map((id) => list.find((c) => String(c.id) === id)?.name || id)
                .join(' → ')}`,
            );
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'ok',
      close: () => resolve(),
    }).render(true);
  });
}

export async function openGmRecalculateSurpriseDialog(): Promise<void> {
  if (!assertGm()) return;
  const combat = (globalThis as any).game?.combat;
  if (!combat) return;
  const preview = computeSurpriseOrderForCombat(combat);
  if (!preview.ok) {
    (globalThis as any).ui?.notifications?.error?.(preview.error);
    return;
  }
  const bag = combat.combatants;
  const list: any[] = bag?.contents
    ? bag.contents
    : typeof bag?.values === 'function'
      ? Array.from(bag.values())
      : Array.from(bag ?? []);
  const line = preview.orderIds
    .map((id, i) => {
      const c = list.find((x) => String(x.id) === id);
      return `${i + 1}. ${c?.name || id} (${Number(c?.initiative) || 0})`;
    })
    .join('<br/>');
  const DialogCtor = (globalThis as any).Dialog;
  await new Promise<void>((resolve) => {
    new DialogCtor({
      title: 'Recalculate Surprise Order',
      content: `<p>Pending Round 1 order (Initiative Scores unchanged):</p><p>${line}</p>`,
      buttons: {
        apply: {
          label: 'Apply',
          callback: async () => {
            const result = await applySurpriseOrderToCombat(combat);
            if (!result.ok) {
              (globalThis as any).ui?.notifications?.error?.(result.error);
              return;
            }
            if (typeof combat.setupTurns === 'function') await combat.setupTurns();
            (globalThis as any).ui?.notifications?.info?.('Surprise order recalculated.');
          },
        },
        cancel: { label: 'Cancel' },
      },
      default: 'apply',
      close: () => resolve(),
    }).render(true);
  });
}

export async function requestUndoLastGmEffect(): Promise<void> {
  const r = await undoLastGmEffectBulk();
  (globalThis as any).ui?.notifications?.[r.ok ? 'info' : 'warn']?.(r.message);
}
