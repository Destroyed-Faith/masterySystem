/**
 * DF 2026-10-23 Migration Review (GM only).
 *
 * Shown after `runDf2026RulesMigration` when characters carry warnings, and
 * reachable later from the Actors directory header / `module.api`.
 *
 * Per character it lists:
 *  - Legacy Skills the character had (name + rating) for reference
 *  - Exactly five Specializations at Rank 2 (no Rank picker — same as creation)
 *  - Unmapped Minor Expressions (need a manual Echo Imprint pick)
 *  - Echo Imprint trim warnings when the proposal exceeds Mastery Rank
 *
 * Saving writes only `system.specializations` + `system.echoImprints` (+ a
 * review-stamp flag). XP / Stones / Powers / Artifacts are left untouched.
 */

import {
  PAID_SKILL_FIELDS,
  SKILL_FIELD_LABELS,
  STARTING_SPECIALIZATION_COUNT,
  STARTING_SPECIALIZATION_RANK,
  findEchoImprint,
  type SkillField,
} from '../rules/index.js';
import type { Df2026MigrationSummary } from './df-2026-rules-migration.js';
import {
  applyDf2026Review,
  imprintsByAttribute,
  listDf2026ReviewPlans,
  type Df2026ReviewPlan,
  type LegacySkillRow,
} from './df-2026-migration-review-plan.js';
import { masteryLocalize } from '../utils/mastery-localize.js';

const { ApplicationV2 } = (foundry as any).applications.api;

function df2026ReviewTitle(): string {
  return masteryLocalize('MASTERY.df2026.migrationReview.title', 'DF 2026 Migration Review');
}

const APP_ID = 'mastery-df2026-migration-review';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function specRowHtml(row: { name?: string; field?: string; scope?: string }): string {
  const fieldOptions = PAID_SKILL_FIELDS.map(
    (f) =>
      `<option value="${f}" ${row.field === f ? 'selected' : ''}>${esc(SKILL_FIELD_LABELS[f as SkillField])}</option>`,
  ).join('');
  return `
    <div class="dfr-spec-row">
      <input type="text" class="dfr-spec-name" placeholder="Name" maxlength="60" value="${esc(row.name ?? '')}" />
      <select class="dfr-spec-field">${fieldOptions}</select>
      <input type="text" class="dfr-spec-scope" placeholder="Scope (one sentence)" maxlength="200" value="${esc(row.scope ?? '')}" />
      <span class="dfr-spec-rank-fixed" title="Starting Specializations are always Rank ${STARTING_SPECIALIZATION_RANK}">Rank ${STARTING_SPECIALIZATION_RANK}</span>
      <button type="button" data-action="remove-spec" title="Remove"><i class="fas fa-trash"></i></button>
    </div>`;
}

function legacySkillsTable(skills: LegacySkillRow[]): string {
  if (!skills.length) {
    return `<p class="dfr-none">${esc(
      masteryLocalize(
        'MASTERY.df2026.migrationReview.noLegacySkills',
        'No rated legacy Skills were found on this character.',
      ),
    )}</p>`;
  }
  const rows = skills
    .map(
      (s) => `
      <tr>
        <td>${esc(s.name)}</td>
        <td class="dfr-legacy-rating">${s.rating}</td>
        <td>${esc(SKILL_FIELD_LABELS[s.field])}${s.categoryLabel ? ` <small>(${esc(s.categoryLabel)})</small>` : ''}</td>
        <td>
          <button type="button" class="dfr-suggest" data-action="add-suggestion"
            data-name="${esc(s.name)}" data-field="${esc(s.field)}"
            title="Add as Rank ${STARTING_SPECIALIZATION_RANK} Specialization">
            <i class="fas fa-plus"></i>
          </button>
        </td>
      </tr>`,
    )
    .join('');
  return `
    <table class="dfr-legacy-table">
      <thead>
        <tr>
          <th>${esc(masteryLocalize('MASTERY.df2026.migrationReview.legacyName', 'Skill'))}</th>
          <th>${esc(masteryLocalize('MASTERY.df2026.migrationReview.legacyRating', 'Rating'))}</th>
          <th>${esc(masteryLocalize('MASTERY.df2026.specializations.field', 'Field'))}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function planHtml(plan: Df2026ReviewPlan, attrValue: (attr: string) => number): string {
  const starterSpecs = (plan.currentSpecializations ?? [])
    .slice(0, STARTING_SPECIALIZATION_COUNT)
    .map((s) => specRowHtml(s));
  const count = Math.min(plan.currentSpecializations.length, STARTING_SPECIALIZATION_COUNT);

  const unmapped = plan.unmappedExpressions.length
    ? `<ul class="dfr-unmapped">${plan.unmappedExpressions
        .map(
          (u) =>
            `<li><i class="fas fa-triangle-exclamation"></i> <strong>${esc(u.name)}</strong>${
              u.attribute ? ` <em>(${esc(cap(u.attribute))})</em>` : ''
            } — no exact Echo Imprint; pick one below.</li>`,
        )
        .join('')}</ul>`
    : '<p class="dfr-none">All legacy Minor Expressions were mapped or none were set.</p>';

  const checked = new Set(plan.currentImprintIds);
  const imprintGroups = imprintsByAttribute()
    .map((group) => {
      const value = attrValue(group.attribute);
      const eligible = value >= 4;
      return `
        <fieldset class="dfr-imprint-group">
          <legend>${esc(cap(group.attribute))} (${value})${eligible ? '' : ' — needs 4+'}</legend>
          ${group.imprints
            .map(
              (i) => `
            <label class="dfr-imprint${plan.mappedImprintIds.includes(i.id) ? ' is-mapped' : ''}">
              <input type="checkbox" class="dfr-imprint-pick" value="${esc(i.id)}"
                ${checked.has(i.id) ? 'checked' : ''} ${eligible ? '' : 'disabled'} />
              ${esc(findEchoImprint(i.id)?.name ?? i.id)}
            </label>`,
            )
            .join('')}
        </fieldset>`;
    })
    .join('');

  const trimWarn = plan.imprintTrimWarning
    ? `<p class="dfr-warning"><i class="fas fa-scissors"></i> ${esc(plan.imprintTrimWarning)}${
        plan.trimmedImprintIds.length
          ? ` Dropped by default: ${esc(plan.trimmedImprintIds.map((id) => findEchoImprint(id)?.name ?? id).join(', '))}.`
          : ''
      }</p>`
    : '';

  return `
    <details class="dfr-actor" data-actor-id="${esc(plan.actorId)}" open>
      <summary><strong>${esc(plan.actorName)}</strong> <small>MR ${plan.masteryRank}</small>${
        plan.alreadyReviewed ? ' <em>(reviewed)</em>' : ''
      }</summary>

      <section class="dfr-section">
        <h4>${esc(masteryLocalize('MASTERY.df2026.migrationReview.legacySkills', 'Legacy Skills'))}</h4>
        <p class="dfr-hint">${esc(
          masteryLocalize(
            'MASTERY.df2026.migrationReview.legacySkillsHint',
            'These are the Skills this character had before DF 2026. Ratings are for reference only — they do not become Spec Ranks. Use + to copy a name into the Rank-2 list below.',
          ),
        )}</p>
        ${legacySkillsTable(plan.legacySkills)}
      </section>

      <section class="dfr-section">
        <h4>${esc(masteryLocalize('MASTERY.df2026.migrationReview.startingSpecs', 'Starting Specializations'))}
          <small>(<span class="dfr-spec-count">${count}</span> / ${STARTING_SPECIALIZATION_COUNT} × Rank ${STARTING_SPECIALIZATION_RANK})</small>
        </h4>
        <p class="dfr-hint">${esc(
          masteryLocalize(
            'MASTERY.df2026.migrationReview.startingSpecsHint',
            'Choose exactly five free-named Specializations. Each is Rank 2 — there is no Rank picker (same as character creation). Perception is free for every character and does not use one of these five slots.',
          ),
        )}</p>
        <div class="dfr-spec-rows">${starterSpecs.join('')}</div>
        <button type="button" data-action="add-spec" ${
          count >= STARTING_SPECIALIZATION_COUNT ? 'disabled' : ''
        }><i class="fas fa-plus"></i> ${esc(
          masteryLocalize('MASTERY.df2026.specializations.add', 'Add Specialization'),
        )}</button>
      </section>

      <section class="dfr-section">
        <h4>${esc(masteryLocalize('MASTERY.df2026.migrationReview.unmapped', 'Unmapped Minor Expressions'))}</h4>
        ${unmapped}
      </section>

      <section class="dfr-section">
        <h4>Echo Imprints <small>(<span class="dfr-imprint-count">${checked.size}</span> / ${plan.masteryRank})</small></h4>
        ${trimWarn}
        <div class="dfr-imprint-groups" data-mr="${plan.masteryRank}">${imprintGroups}</div>
      </section>

      <footer class="dfr-footer">
        <span class="dfr-status" aria-live="polite"></span>
        <button type="button" data-action="save-actor"><i class="fas fa-save"></i> ${esc(masteryLocalize('MASTERY.df2026.migrationReview.save', 'Save'))}</button>
      </footer>
    </details>`;
}

export class Df2026MigrationReviewDialog extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ['mastery-system', 'df2026-migration-review'],
    position: { width: 780, height: 680 },
    window: { title: df2026ReviewTitle(), icon: 'fa-solid fa-clipboard-check', resizable: true },
  };

  #plans: Df2026ReviewPlan[];

  constructor(plans: Df2026ReviewPlan[], options: Record<string, unknown> = {}) {
    super(options);
    this.#plans = plans;
  }

  /**
   * Open for GMs. Pass the migration summaries to limit the list to characters
   * that just migrated with warnings; omit them to list every unreviewed character.
   */
  static async open(
    opts: { summaries?: Df2026MigrationSummary[]; includeReviewed?: boolean } = {},
  ): Promise<boolean> {
    const g = globalThis as any;
    if (!g.game?.user?.isGM) {
      g.ui?.notifications?.warn('Only the GM can open the DF 2026 Migration Review.');
      return false;
    }
    const onlyIds = opts.summaries
      ?.filter((s) => s.changed && s.warnings.length > 0)
      .map((s) => s.actorId);
    if (opts.summaries && !onlyIds?.length) return false;

    const plans = listDf2026ReviewPlans(g.game.actors, {
      includeReviewed: opts.includeReviewed,
      onlyIds,
    });
    if (!plans.length) {
      if (!opts.summaries) g.ui?.notifications?.info('DF 2026 Migration Review: nothing left to review.');
      return false;
    }
    const existing = (foundry as any).applications.instances?.get(APP_ID);
    if (existing) await existing.close();
    await new Df2026MigrationReviewDialog(plans).render({ force: true });
    return true;
  }

  async _renderHTML(_context: unknown, _options: unknown): Promise<string> {
    const actors = (globalThis as any).game?.actors;
    const body = this.#plans
      .map((plan) => {
        const actor = actors?.get?.(plan.actorId);
        return planHtml(plan, (attr) =>
          Math.max(0, Math.floor(Number(actor?.system?.attributes?.[attr]?.value) || 0)),
        );
      })
      .join('');
    return `
      <div class="dfr-root">
        <p class="dfr-intro">${esc(
          masteryLocalize(
            'MASTERY.df2026.migrationReview.intro',
            'Review characters migrated to DF 2026. Pick five Rank-2 Specializations (legacy Skills are listed for reference). Saving only changes Specializations and Echo Imprints — XP, Stones, Powers and Artifacts stay untouched.',
          ),
        )}</p>
        ${body}
        <style>
          .dfr-root { padding: 8px; overflow-y: auto; max-height: 100%; }
          .dfr-actor { border: 1px solid var(--color-border-dark-4, #555); border-radius: 4px; margin-bottom: 10px; padding: 6px 8px; }
          .dfr-section { margin: 8px 0; }
          .dfr-section h4 { margin: 0 0 4px; }
          .dfr-hint, .dfr-none { opacity: .75; font-size: .9em; margin: 2px 0 6px; }
          .dfr-warning { color: var(--color-level-warning, #c80); margin: 4px 0; }
          .dfr-legacy-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: .92em; }
          .dfr-legacy-table th, .dfr-legacy-table td { text-align: left; padding: 3px 6px; border-bottom: 1px solid var(--color-border-dark-4, #444); }
          .dfr-legacy-rating { font-weight: 700; font-variant-numeric: tabular-nums; }
          .dfr-spec-row { display: grid; grid-template-columns: 1.2fr 1fr 2fr 72px 32px; gap: 4px; margin-bottom: 4px; align-items: center; }
          .dfr-spec-rank-fixed { opacity: .85; font-size: .85em; white-space: nowrap; }
          .dfr-imprint-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 6px; }
          .dfr-imprint-group { border: 1px solid var(--color-border-dark-4, #555); border-radius: 4px; padding: 2px 6px; }
          .dfr-imprint { display: flex; gap: 4px; align-items: center; }
          .dfr-imprint.is-mapped { font-weight: bold; }
          .dfr-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
          .dfr-status.is-error { color: var(--color-level-error, #c33); }
          .dfr-status.is-ok { color: var(--color-level-success, #3a3); }
        </style>
      </div>`;
  }

  _replaceHTML(result: string, content: HTMLElement, _options: unknown): void {
    content.innerHTML = result;
  }

  _onRender(context: unknown, options: unknown): void {
    (super._onRender as any)?.(context, options);
    const root = (this as any).element as HTMLElement | undefined;
    if (!root || (root as any).__dfrBound) return;
    (root as any).__dfrBound = true;

    root.addEventListener('click', (ev: Event) => {
      const btn = (ev.target as HTMLElement | null)?.closest?.('[data-action]') as HTMLElement | null;
      if (!btn) return;
      const actorEl = btn.closest('.dfr-actor') as HTMLElement | null;
      switch (btn.dataset.action) {
        case 'add-spec':
          this.#appendSpecRow(actorEl, {});
          break;
        case 'add-suggestion':
          this.#appendSpecRow(actorEl, { name: btn.dataset.name, field: btn.dataset.field });
          break;
        case 'remove-spec':
          btn.closest('.dfr-spec-row')?.remove();
          this.#refreshSpecCount(actorEl);
          break;
        case 'save-actor':
          void this.#save(actorEl);
          break;
        default:
          break;
      }
    });

    root.addEventListener('change', (ev: Event) => {
      const t = ev.target as HTMLInputElement;
      if (!t?.classList?.contains('dfr-imprint-pick')) return;
      const actorEl = t.closest('.dfr-actor') as HTMLElement | null;
      const mr = Number((actorEl?.querySelector('.dfr-imprint-groups') as HTMLElement)?.dataset.mr) || 1;
      const picked = actorEl?.querySelectorAll('.dfr-imprint-pick:checked').length ?? 0;
      if (picked > mr) {
        t.checked = false;
        (globalThis as any).ui?.notifications?.warn(`At most ${mr} Echo Imprint(s) at Mastery Rank ${mr}.`);
      }
      const counter = actorEl?.querySelector('.dfr-imprint-count');
      if (counter) counter.textContent = String(actorEl?.querySelectorAll('.dfr-imprint-pick:checked').length ?? 0);
    });
  }

  #specCount(actorEl: HTMLElement | null): number {
    return actorEl?.querySelectorAll('.dfr-spec-row').length ?? 0;
  }

  #refreshSpecCount(actorEl: HTMLElement | null): void {
    if (!actorEl) return;
    const n = this.#specCount(actorEl);
    const counter = actorEl.querySelector('.dfr-spec-count');
    if (counter) counter.textContent = String(n);
    const addBtn = actorEl.querySelector('[data-action="add-spec"]') as HTMLButtonElement | null;
    if (addBtn) addBtn.disabled = n >= STARTING_SPECIALIZATION_COUNT;
  }

  #appendSpecRow(
    actorEl: HTMLElement | null,
    row: { name?: string; field?: string; scope?: string },
  ): void {
    if (!actorEl) return;
    if (this.#specCount(actorEl) >= STARTING_SPECIALIZATION_COUNT) {
      (globalThis as any).ui?.notifications?.warn?.(
        masteryLocalize(
          'MASTERY.df2026.migrationReview.maxSpecs',
          `Choose at most ${STARTING_SPECIALIZATION_COUNT} Specializations (all Rank ${STARTING_SPECIALIZATION_RANK}).`,
        ),
      );
      return;
    }
    const host = actorEl.querySelector('.dfr-spec-rows');
    if (!host) return;
    host.insertAdjacentHTML('beforeend', specRowHtml(row));
    this.#refreshSpecCount(actorEl);
  }

  async #save(actorEl: HTMLElement | null): Promise<void> {
    if (!actorEl) return;
    const g = globalThis as any;
    const status = actorEl.querySelector('.dfr-status') as HTMLElement | null;
    const setStatus = (text: string, kind: 'ok' | 'error') => {
      if (!status) return;
      status.textContent = text;
      status.className = `dfr-status is-${kind}`;
    };
    const actor = g.game?.actors?.get?.(actorEl.dataset.actorId);
    if (!actor) return setStatus('Actor not found.', 'error');

    const specializations = Array.from(actorEl.querySelectorAll('.dfr-spec-row')).map((row) => ({
      name: (row.querySelector('.dfr-spec-name') as HTMLInputElement).value,
      field: (row.querySelector('.dfr-spec-field') as HTMLSelectElement).value as SkillField,
      scope: (row.querySelector('.dfr-spec-scope') as HTMLInputElement).value,
      rank: STARTING_SPECIALIZATION_RANK,
    }));
    const echoImprints = Array.from(actorEl.querySelectorAll('.dfr-imprint-pick:checked')).map(
      (el) => (el as HTMLInputElement).value,
    );

    try {
      const result = await applyDf2026Review(actor, { specializations, echoImprints });
      if (!result.ok) return setStatus(result.errors.join(' '), 'error');
      setStatus('Saved.', 'ok');
      g.ui?.notifications?.info(`DF 2026 review saved for ${actor.name}.`);
    } catch (err) {
      console.error('Mastery System | DF 2026 review save failed', err);
      setStatus('Save failed — see console.', 'error');
    }
  }
}

/** Convenience wrappers used by module wiring. */
export function showDf2026MigrationReview(
  opts: { summaries?: Df2026MigrationSummary[]; includeReviewed?: boolean } = {},
): Promise<boolean> {
  return Df2026MigrationReviewDialog.open(opts);
}
