/**
 * DF 2026-10-23 Migration Review (GM only).
 *
 * Shown after `runDf2026RulesMigration` when characters carry warnings, and
 * reachable later from the Actors directory header / `module.api`.
 *
 * Per character it lists:
 *  - Specialization suggestions derived from legacy Skill names (suggestions
 *    only — nothing is converted to a Rank; the GM sets name / Field / scope / Rank)
 *  - Unmapped Minor Expressions (need a manual Echo Imprint pick)
 *  - Echo Imprint trim warnings when the proposal exceeds Mastery Rank
 *
 * Saving writes only `system.specializations` + `system.echoImprints` (+ a
 * review-stamp flag). XP / Stones / Powers / Artifacts are left untouched.
 */
import { SKILL_FIELDS, SKILL_FIELD_LABELS, SPECIALIZATION_MAX_RANK, findEchoImprint, } from '../rules/index.js';
import { applyDf2026Review, imprintsByAttribute, listDf2026ReviewPlans, } from './df-2026-migration-review-plan.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
const { ApplicationV2 } = foundry.applications.api;
function df2026ReviewTitle() {
    return masteryLocalize('MASTERY.df2026.migrationReview.title', 'DF 2026 Migration Review');
}
const APP_ID = 'mastery-df2026-migration-review';
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function specRowHtml(row) {
    const fieldOptions = SKILL_FIELDS.map((f) => `<option value="${f}" ${row.field === f ? 'selected' : ''}>${esc(SKILL_FIELD_LABELS[f])}</option>`).join('');
    return `
    <div class="dfr-spec-row">
      <input type="text" class="dfr-spec-name" placeholder="Name" maxlength="60" value="${esc(row.name ?? '')}" />
      <select class="dfr-spec-field">${fieldOptions}</select>
      <input type="text" class="dfr-spec-scope" placeholder="Scope (one sentence)" maxlength="200" value="${esc(row.scope ?? '')}" />
      <input type="number" class="dfr-spec-rank" min="1" max="${SPECIALIZATION_MAX_RANK}" step="1" value="${Math.max(1, Math.floor(Number(row.rank) || 1))}" title="Rank" />
      <button type="button" data-action="remove-spec" title="Remove"><i class="fas fa-trash"></i></button>
    </div>`;
}
function planHtml(plan, attrValue) {
    const suggestions = plan.specSuggestions
        .map((s) => `<button type="button" class="dfr-suggest" data-action="add-suggestion"
          data-name="${esc(s.suggestedName)}" data-field="${esc(s.suggestedField)}"
          title="Legacy ${esc(s.suggestedName)} rating ${s.legacyRating} — not converted to a Rank">
          <i class="fas fa-plus"></i> ${esc(s.suggestedName)}
          <small>(${esc(SKILL_FIELD_LABELS[s.suggestedField])}; legacy ${s.legacyRating})</small></button>`)
        .join('');
    const unmapped = plan.unmappedExpressions.length
        ? `<ul class="dfr-unmapped">${plan.unmappedExpressions
            .map((u) => `<li><i class="fas fa-triangle-exclamation"></i> <strong>${esc(u.name)}</strong>${u.attribute ? ` <em>(${esc(cap(u.attribute))})</em>` : ''} — no exact Echo Imprint; pick one below.</li>`)
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
            .map((i) => `
            <label class="dfr-imprint${plan.mappedImprintIds.includes(i.id) ? ' is-mapped' : ''}">
              <input type="checkbox" class="dfr-imprint-pick" value="${esc(i.id)}"
                ${checked.has(i.id) ? 'checked' : ''} ${eligible ? '' : 'disabled'} />
              ${esc(findEchoImprint(i.id)?.name ?? i.id)}
            </label>`)
            .join('')}
        </fieldset>`;
    })
        .join('');
    const trimWarn = plan.imprintTrimWarning
        ? `<p class="dfr-warning"><i class="fas fa-scissors"></i> ${esc(plan.imprintTrimWarning)}${plan.trimmedImprintIds.length
            ? ` Dropped by default: ${esc(plan.trimmedImprintIds.map((id) => findEchoImprint(id)?.name ?? id).join(', '))}.`
            : ''}</p>`
        : '';
    return `
    <details class="dfr-actor" data-actor-id="${esc(plan.actorId)}" open>
      <summary><strong>${esc(plan.actorName)}</strong> <small>MR ${plan.masteryRank}</small>${plan.alreadyReviewed ? ' <em>(reviewed)</em>' : ''}</summary>

      <section class="dfr-section">
        <h4>${esc(masteryLocalize('MASTERY.df2026.migrationReview.suggestions', 'Specialization suggestions'))}</h4>
        <p class="dfr-hint">Suggestions come from legacy Skill names only. Ratings are <strong>not</strong> converted — set each Rank yourself.</p>
        ${suggestions ? `<div class="dfr-suggestions">${suggestions}</div>` : ''}
        <div class="dfr-spec-rows">${plan.currentSpecializations.map((s) => specRowHtml(s)).join('')}</div>
        <button type="button" data-action="add-spec"><i class="fas fa-plus"></i> Add Specialization</button>
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
        position: { width: 760, height: 640 },
        window: { title: df2026ReviewTitle(), icon: 'fa-solid fa-clipboard-check', resizable: true },
    };
    #plans;
    constructor(plans, options = {}) {
        super(options);
        this.#plans = plans;
    }
    /**
     * Open for GMs. Pass the migration summaries to limit the list to characters
     * that just migrated with warnings; omit them to list every unreviewed character.
     */
    static async open(opts = {}) {
        const g = globalThis;
        if (!g.game?.user?.isGM) {
            g.ui?.notifications?.warn('Only the GM can open the DF 2026 Migration Review.');
            return false;
        }
        const onlyIds = opts.summaries
            ?.filter((s) => s.changed && s.warnings.length > 0)
            .map((s) => s.actorId);
        if (opts.summaries && !onlyIds?.length)
            return false;
        const plans = listDf2026ReviewPlans(g.game.actors, {
            includeReviewed: opts.includeReviewed,
            onlyIds,
        });
        if (!plans.length) {
            if (!opts.summaries)
                g.ui?.notifications?.info('DF 2026 Migration Review: nothing left to review.');
            return false;
        }
        const existing = foundry.applications.instances?.get(APP_ID);
        if (existing)
            await existing.close();
        await new Df2026MigrationReviewDialog(plans).render({ force: true });
        return true;
    }
    async _renderHTML(_context, _options) {
        const actors = globalThis.game?.actors;
        const body = this.#plans
            .map((plan) => {
            const actor = actors?.get?.(plan.actorId);
            return planHtml(plan, (attr) => Math.max(0, Math.floor(Number(actor?.system?.attributes?.[attr]?.value) || 0)));
        })
            .join('');
        return `
      <div class="dfr-root">
        <p class="dfr-intro">Review characters migrated to the DF 2026 rules. Saving only changes
          Specializations and Echo Imprints — XP, Stones, Powers and Artifacts stay untouched.</p>
        ${body}
        <style>
          .dfr-root { padding: 8px; overflow-y: auto; max-height: 100%; }
          .dfr-actor { border: 1px solid var(--color-border-dark-4, #555); border-radius: 4px; margin-bottom: 10px; padding: 6px 8px; }
          .dfr-section { margin: 8px 0; }
          .dfr-section h4 { margin: 0 0 4px; }
          .dfr-hint, .dfr-none { opacity: .75; font-size: .9em; margin: 2px 0 6px; }
          .dfr-warning { color: var(--color-level-warning, #c80); margin: 4px 0; }
          .dfr-suggestions { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
          .dfr-spec-row { display: grid; grid-template-columns: 1.2fr 1fr 2fr 60px 32px; gap: 4px; margin-bottom: 4px; }
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
    _replaceHTML(result, content, _options) {
        content.innerHTML = result;
    }
    _onRender(context, options) {
        super._onRender?.(context, options);
        const root = this.element;
        if (!root || root.__dfrBound)
            return;
        root.__dfrBound = true;
        root.addEventListener('click', (ev) => {
            const btn = ev.target?.closest?.('[data-action]');
            if (!btn)
                return;
            const actorEl = btn.closest('.dfr-actor');
            switch (btn.dataset.action) {
                case 'add-spec':
                    this.#appendSpecRow(actorEl, {});
                    break;
                case 'add-suggestion':
                    // Suggestion → empty draft row at Rank 1 (never Rank 2); GM fills scope / Rank.
                    this.#appendSpecRow(actorEl, { name: btn.dataset.name, field: btn.dataset.field, rank: 1 });
                    break;
                case 'remove-spec':
                    btn.closest('.dfr-spec-row')?.remove();
                    break;
                case 'save-actor':
                    void this.#save(actorEl);
                    break;
                default:
                    break;
            }
        });
        root.addEventListener('change', (ev) => {
            const t = ev.target;
            if (!t?.classList?.contains('dfr-imprint-pick'))
                return;
            const actorEl = t.closest('.dfr-actor');
            const mr = Number(actorEl?.querySelector('.dfr-imprint-groups')?.dataset.mr) || 1;
            const picked = actorEl?.querySelectorAll('.dfr-imprint-pick:checked').length ?? 0;
            if (picked > mr) {
                t.checked = false;
                globalThis.ui?.notifications?.warn(`At most ${mr} Echo Imprint(s) at Mastery Rank ${mr}.`);
            }
            const counter = actorEl?.querySelector('.dfr-imprint-count');
            if (counter)
                counter.textContent = String(actorEl?.querySelectorAll('.dfr-imprint-pick:checked').length ?? 0);
        });
    }
    #appendSpecRow(actorEl, row) {
        const host = actorEl?.querySelector('.dfr-spec-rows');
        if (!host)
            return;
        host.insertAdjacentHTML('beforeend', specRowHtml(row));
    }
    async #save(actorEl) {
        if (!actorEl)
            return;
        const g = globalThis;
        const status = actorEl.querySelector('.dfr-status');
        const setStatus = (text, kind) => {
            if (!status)
                return;
            status.textContent = text;
            status.className = `dfr-status is-${kind}`;
        };
        const actor = g.game?.actors?.get?.(actorEl.dataset.actorId);
        if (!actor)
            return setStatus('Actor not found.', 'error');
        const specializations = Array.from(actorEl.querySelectorAll('.dfr-spec-row')).map((row) => ({
            name: row.querySelector('.dfr-spec-name').value,
            field: row.querySelector('.dfr-spec-field').value,
            scope: row.querySelector('.dfr-spec-scope').value,
            rank: Number(row.querySelector('.dfr-spec-rank').value),
        }));
        const echoImprints = Array.from(actorEl.querySelectorAll('.dfr-imprint-pick:checked')).map((el) => el.value);
        try {
            const result = await applyDf2026Review(actor, { specializations, echoImprints });
            if (!result.ok)
                return setStatus(result.errors.join(' '), 'error');
            setStatus('Saved.', 'ok');
            g.ui?.notifications?.info(`DF 2026 review saved for ${actor.name}.`);
        }
        catch (err) {
            console.error('Mastery System | DF 2026 review save failed', err);
            setStatus('Save failed — see console.', 'error');
        }
    }
}
/** Convenience wrappers used by module wiring. */
export function showDf2026MigrationReview(opts = {}) {
    return Df2026MigrationReviewDialog.open(opts);
}
//# sourceMappingURL=df-2026-migration-review-dialog.js.map