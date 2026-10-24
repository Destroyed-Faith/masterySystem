/**
 * Post-success ordinary Skill Raise effect allocation on the result chat card.
 * Combat / Ritual cards never receive this panel.
 */

import {
  SKILL_RAISE_EFFECTS,
  SKILL_RAISE_EFFECT_LABELS,
  finalizeSkillCheckAllocation,
  skillCheckSuccessRaiseBudget,
  type SkillCheckResolvedSnapshot,
  type SkillRaiseEffect,
} from '../rules/index.js';

const FLAG_SCOPE = 'mastery-system';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readSnapshot(message: any): SkillCheckResolvedSnapshot | null {
  const flags = message?.flags?.[FLAG_SCOPE] ?? message?.getFlag?.(FLAG_SCOPE) ?? {};
  const raw = flags.skillCheckSnapshot;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.schema && raw.schema !== 'df-skill-check-2026-10-24') return null;
  return raw as SkillCheckResolvedSnapshot;
}

function userMayAllocate(user: any, snapshot: SkillCheckResolvedSnapshot): boolean {
  if (!user) return false;
  if (user.isGM) return true;
  const actor = (globalThis as any).game?.actors?.get?.(snapshot.actorId);
  if (!actor) return false;
  return typeof actor.testUserPermission === 'function'
    ? actor.testUserPermission(user, 'OWNER')
    : false;
}

function buildPanelHtml(snapshot: SkillCheckResolvedSnapshot, interactive: boolean): string {
  if (!snapshot.success || snapshot.allocationStatus === 'not-applicable') {
    return `<div class="ms-sra-fail-note">Failed — Final TN ${escapeHtml(
      snapshot.finalTn,
    )}. No Raise effects.</div>`;
  }

  const budget = skillCheckSuccessRaiseBudget(
    snapshot.skillRankAtRoll,
    snapshot.paidRaisesDeclared,
  );
  const alloc = snapshot.effectAllocation ?? {
    scope: 0,
    speed: 0,
    quality: 0,
    efficiency: 0,
    insight: 0,
    safety: 0,
  };
  const spent = SKILL_RAISE_EFFECTS.reduce(
    (n, k) => n + Math.max(0, Math.floor(Number(alloc[k]) || 0)),
    0,
  );
  const left = Math.max(0, budget.available - spent);

  if (snapshot.allocationStatus === 'finalized') {
    const parts = SKILL_RAISE_EFFECTS.filter((k) => (alloc[k] ?? 0) > 0)
      .map((k) => `${SKILL_RAISE_EFFECT_LABELS[k].label} ${alloc[k]}`)
      .join(' · ');
    return `
      <div class="ms-sra-finalized">
        <div class="ms-sra-balance"><b>Raises assigned</b><strong>${spent} / ${budget.available}</strong></div>
        <p class="ms-sra-summary success">${parts ? escapeHtml(parts) : 'No effects used.'}</p>
        ${
          snapshot.proposedBenefit
            ? `<p class="ms-sra-benefit">${escapeHtml(snapshot.proposedBenefit)}</p>`
            : ''
        }
        <p class="ms-sra-hint">GM adjudicates the concrete fiction.</p>
      </div>`;
  }

  if (!interactive) {
    return `<div class="ms-sra-pending-ro">Raises to allocate: ${budget.available} (${budget.paid} Paid + ${budget.free} Free) — waiting for the player.</div>`;
  }

  const rows = SKILL_RAISE_EFFECTS.map((key) => {
    const meta = SKILL_RAISE_EFFECT_LABELS[key];
    const n = Math.max(0, Math.floor(Number(alloc[key]) || 0));
    return `
      <div class="ms-sra-row" data-effect="${key}">
        <div>
          <div class="ms-sra-effect-title">${escapeHtml(meta.label)}</div>
          <div class="ms-sra-effect-desc">${escapeHtml(meta.summary)}</div>
        </div>
        <div class="ms-sra-stepper">
          <button type="button" class="ms-sra-minus" data-effect="${key}" aria-label="${escapeHtml(
            meta.label,
          )} decrease" ${n <= 0 ? 'disabled' : ''}>−</button>
          <output class="ms-sra-count" data-effect="${key}">${n}</output>
          <button type="button" class="ms-sra-plus" data-effect="${key}" aria-label="${escapeHtml(
            meta.label,
          )} increase" ${left <= 0 ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="ms-sra-panel" data-ms-sra="1">
      <div class="ms-sra-balance">
        <b>Raises to allocate</b>
        <strong class="ms-sra-left">${left} / ${budget.available} left</strong>
      </div>
      <div class="ms-sra-hint">${budget.paid} Paid + ${budget.free} Free (same effects)</div>
      ${rows}
      <div class="ms-sra-field">
        <label for="ms-sra-benefit">Specific benefit (agree with GM)</label>
        <textarea class="ms-sra-benefit-input" rows="2" placeholder="e.g. two more related track groups">${escapeHtml(
          snapshot.proposedBenefit || '',
        )}</textarea>
      </div>
      <div class="ms-sra-actions">
        <button type="button" class="ms-sra-finish-empty">Finish without effects</button>
        <button type="button" class="ms-sra-apply">Apply Raises</button>
      </div>
    </div>`;
}

function localCounts(host: HTMLElement): Record<SkillRaiseEffect, number> {
  const out = {
    scope: 0,
    speed: 0,
    quality: 0,
    efficiency: 0,
    insight: 0,
    safety: 0,
  } as Record<SkillRaiseEffect, number>;
  for (const key of SKILL_RAISE_EFFECTS) {
    const el = host.querySelector(`.ms-sra-count[data-effect="${key}"]`);
    out[key] = Math.max(0, Math.floor(Number(el?.textContent) || 0));
  }
  return out;
}

async function persistSnapshot(message: any, snapshot: SkillCheckResolvedSnapshot): Promise<void> {
  await message.setFlag(FLAG_SCOPE, 'skillCheckSnapshot', snapshot);
}

function renderIntoHost(message: any, html: HTMLElement): void {
  const snapshot = readSnapshot(message);
  const host = html.querySelector('[data-ms-skill-raise-host]') as HTMLElement | null;
  if (!host) return;
  if (!snapshot) {
    host.innerHTML = '';
    return;
  }
  // Combat / ritual / non-skill-check messages never get skillCheckSnapshot.
  const user = (globalThis as any).game?.user;
  const interactive =
    snapshot.allocationStatus === 'pending' && userMayAllocate(user, snapshot);
  host.innerHTML = buildPanelHtml(snapshot, interactive);

  if (!interactive || snapshot.allocationStatus !== 'pending') return;

  const panel = host.querySelector('[data-ms-sra]') as HTMLElement | null;
  if (!panel) return;

  const refreshDisabled = () => {
    const budget = skillCheckSuccessRaiseBudget(
      snapshot.skillRankAtRoll,
      snapshot.paidRaisesDeclared,
    );
    const counts = localCounts(panel);
    const spent = SKILL_RAISE_EFFECTS.reduce((n, k) => n + counts[k], 0);
    const left = Math.max(0, budget.available - spent);
    const leftEl = panel.querySelector('.ms-sra-left');
    if (leftEl) leftEl.textContent = `${left} / ${budget.available} left`;
    for (const key of SKILL_RAISE_EFFECTS) {
      const minus = panel.querySelector(`.ms-sra-minus[data-effect="${key}"]`) as HTMLButtonElement | null;
      const plus = panel.querySelector(`.ms-sra-plus[data-effect="${key}"]`) as HTMLButtonElement | null;
      if (minus) minus.disabled = counts[key] <= 0;
      if (plus) plus.disabled = left <= 0;
    }
  };

  panel.querySelectorAll('.ms-sra-minus').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const key = (btn as HTMLElement).dataset.effect as SkillRaiseEffect;
      const out = panel.querySelector(`.ms-sra-count[data-effect="${key}"]`);
      if (!out) return;
      const n = Math.max(0, Math.floor(Number(out.textContent) || 0) - 1);
      out.textContent = String(n);
      refreshDisabled();
    });
  });
  panel.querySelectorAll('.ms-sra-plus').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const key = (btn as HTMLElement).dataset.effect as SkillRaiseEffect;
      const budget = skillCheckSuccessRaiseBudget(
        snapshot.skillRankAtRoll,
        snapshot.paidRaisesDeclared,
      );
      const counts = localCounts(panel);
      const spent = SKILL_RAISE_EFFECTS.reduce((n, k) => n + counts[k], 0);
      if (spent >= budget.available) return;
      const out = panel.querySelector(`.ms-sra-count[data-effect="${key}"]`);
      if (!out) return;
      out.textContent = String(counts[key] + 1);
      refreshDisabled();
    });
  });

  const apply = async (allowZero: boolean) => {
    if (!userMayAllocate((globalThis as any).game?.user, snapshot)) {
      (globalThis as any).ui?.notifications?.warn?.('You cannot allocate Raises for this character.');
      return;
    }
    const benefit =
      (panel.querySelector('.ms-sra-benefit-input') as HTMLTextAreaElement | null)?.value ?? '';
    const allocation = localCounts(panel);
    const next = finalizeSkillCheckAllocation(snapshot, allocation, benefit, { allowZero });
    if (!next.ok) {
      (globalThis as any).ui?.notifications?.warn?.(next.error ?? 'Invalid allocation.');
      return;
    }
    // Allow finishing with zero effects when allowZero.
    if (!allowZero) {
      const budget = skillCheckSuccessRaiseBudget(
        snapshot.skillRankAtRoll,
        snapshot.paidRaisesDeclared,
      );
      const spent = SKILL_RAISE_EFFECTS.reduce((n, k) => n + allocation[k], 0);
      if (spent === 0 && !String(benefit).trim()) {
        // Treat as finish without effects
      } else if (spent > budget.available) {
        (globalThis as any).ui?.notifications?.warn?.('Too many Raise effects.');
        return;
      }
    }
    await persistSnapshot(message, {
      ...next.snapshot,
      allocationStatus: 'finalized',
    });
    // Re-render from updated flags
    renderIntoHost(message, html);
  };

  panel.querySelector('.ms-sra-apply')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    void apply(false);
  });
  panel.querySelector('.ms-sra-finish-empty')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    void apply(true);
  });
}

let registered = false;

export function registerSkillRaiseAllocationHandlers(): void {
  if (registered) return;
  registered = true;

  Hooks.on('renderChatMessage', (message: any, html: HTMLElement | JQuery) => {
    const root =
      html instanceof HTMLElement ? html : ((html as JQuery)?.[0] as HTMLElement | undefined);
    if (!root) return;
    try {
      renderIntoHost(message, root);
    } catch (err) {
      console.warn('Mastery System | skill raise allocation render failed', err);
    }
  });

  // Foundry v13+ may use renderChatMessageHTML
  Hooks.on('renderChatMessageHTML', (message: any, html: HTMLElement) => {
    if (!(html instanceof HTMLElement)) return;
    try {
      renderIntoHost(message, html);
    } catch (err) {
      console.warn('Mastery System | skill raise allocation render failed', err);
    }
  });
}
