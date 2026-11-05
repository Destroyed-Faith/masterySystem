/**
 * Specializations dialogs for the character sheet (DF Players Guide 2026-10-23).
 * Add / Edit / Delete a free-named Specialization and the pre-roll option picker.
 */

import {
  PROFESSION_CATALOGUE,
  PROFESSION_CATALOGUE_CATEGORIES,
} from '../rules/profession-catalogue.js';
import {
  SPECIALIZATION_MAX_RANK,
  STARTING_SPECIALIZATION_COUNT,
  STARTING_SPECIALIZATION_RANK,
  findSpecializationById,
  isCharacterPerceptionSpec,
  isProfessionRespecEnabled,
  isRespecableProfession,
  planProfessionRespec,
  professionIdentityKey,
  readSpecializations,
  removeSpecialization,
  upsertSpecialization,
  validateSpecializationList,
  type SpecializationRecord,
} from '../rules/index.js';
import { masteryLocalize } from '../utils/mastery-localize.js';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rootOf(html: any): HTMLElement | null {
  if (!html) return null;
  if (html instanceof HTMLElement) return html;
  if (html[0] instanceof HTMLElement) return html[0] as HTMLElement;
  return null;
}

function readValue(root: HTMLElement | null, name: string): string {
  const el = root?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
  return String(el?.value ?? '');
}

/** Add (no `specId`) or edit a Specialization. Resolves true when saved. */
export async function showSpecializationEditDialog(
  actor: any,
  opts: {
    specId?: string;
    allowRankEdit?: boolean;
    /** Post-creation: a new Specialization is learned at Rank 1 for 4 XP instead of a free edit. */
    learnWithXp?: boolean;
    /**
     * Character creation / migration starter: Rank is fixed at 2, no Rank picker.
     * Adding is capped at four Professions.
     */
    fixedStartingRank?: boolean;
    /**
     * Beta Profession Respec: replace a starting Profession in place, keeping Rank / XP.
     * Requires the world setting `allowProfessionRespecBeta`.
     */
    betaRespec?: boolean;
  } = {},
): Promise<boolean> {
  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return false;
  const specs = readSpecializations(actor?.system);
  const existing = opts.specId ? findSpecializationById(specs, opts.specId) : null;
  if (opts.specId && !existing) {
    (globalThis as any).ui?.notifications?.warn?.('Profession not found.');
    return false;
  }
  const betaRespec = !!opts.betaRespec;
  if (betaRespec) {
    if (!isProfessionRespecEnabled()) {
      (globalThis as any).ui?.notifications?.warn?.(
        'Beta Profession Respec is disabled. Ask the GM to enable Allow Profession Respec (Beta).',
      );
      return false;
    }
    if (!existing || !isRespecableProfession(specs, existing.id)) {
      (globalThis as any).ui?.notifications?.warn?.(
        'Beta Profession Respec only replaces one of the four free starting Professions.',
      );
      return false;
    }
  }
  const fixedStartingRank = !!opts.fixedStartingRank;
  const paidSpecCount = specs.filter((s) => !isCharacterPerceptionSpec(s)).length;
  if (fixedStartingRank && !existing && paidSpecCount >= STARTING_SPECIALIZATION_COUNT) {
    (globalThis as any).ui?.notifications?.warn?.(
      masteryLocalize(
        'MASTERY.df2026.creation.finalizeNeedSpecs',
        `Starting characters pick exactly ${STARTING_SPECIALIZATION_COUNT} Rank ${STARTING_SPECIALIZATION_RANK} Professions.`,
      ),
    );
    return false;
  }
  const learnWithXp = !!opts.learnWithXp && !existing && !betaRespec;
  const allowRankEdit =
    !betaRespec &&
    !fixedStartingRank &&
    !learnWithXp &&
    (opts.allowRankEdit !== false || !existing);
  const startRank = betaRespec
    ? (existing?.rank ?? 1)
    : fixedStartingRank
      ? STARTING_SPECIALIZATION_RANK
      : (existing?.rank ?? 1);

  const exampleOptions = PROFESSION_CATALOGUE.map(
    (ex) =>
      `<option value="${escapeHtml(ex.name)}" data-name="${escapeHtml(ex.name)}" data-category="${escapeHtml(ex.category)}" data-scope="${escapeHtml(ex.scope_example)}">${escapeHtml(ex.category)} — ${escapeHtml(ex.name)}</option>`,
  ).join('');
  const categoryOptions = PROFESSION_CATALOGUE_CATEGORIES.map(
    (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
  ).join('');

  const rankBlock = betaRespec
    ? `<div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.specializations.rank', 'Rank')}</label>
        <p class="md-sublabel">Rank ${existing?.rank ?? startRank} kept — Beta Respec does not change Rank or XP.</p>
        <input type="hidden" name="rank" value="${existing?.rank ?? startRank}" />
      </div>`
    : fixedStartingRank
      ? `<div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.specializations.rank', 'Rank')}</label>
        <p class="md-sublabel">Rank ${STARTING_SPECIALIZATION_RANK} — ${masteryLocalize(
          'MASTERY.df2026.creation.specsHeaderTitle',
          'four Rank 2 Professions (Perception is free)',
        )}</p>
        <input type="hidden" name="rank" value="${STARTING_SPECIALIZATION_RANK}" />
      </div>`
      : `<div class="md-group">
        <label class="md-label">Rank <span class="md-sublabel">(1–${SPECIALIZATION_MAX_RANK}${
          allowRankEdit ? '' : '; raise via Progression for XP per Rank'
        })</span></label>
        <input type="number" name="rank" class="md-input" min="1" max="${SPECIALIZATION_MAX_RANK}" step="1" value="${startRank}" ${
          allowRankEdit ? '' : 'disabled'
        } />
      </div>`;

  const content = `
    <form class="mastery-dialog-form spec-edit-form">
      ${
        betaRespec
          ? `<p class="md-sublabel">Beta Profession Respec replaces this starting Profession in place. Rank and invested XP stay. Perception is never changed.</p>`
          : ''
      }
      <div class="md-group">
        <label class="md-label">Suggestions <span class="md-sublabel">(${PROFESSION_CATALOGUE.length} examples in ${PROFESSION_CATALOGUE_CATEGORIES.length} categories — optional, not a closed list)</span></label>
        <div class="spec-suggestion-filters">
          <select name="exampleCategory" class="md-select js-spec-example-category">
            <option value="">All categories</option>
            ${categoryOptions}
          </select>
          <input type="search" name="exampleSearch" class="md-input js-spec-example-search" placeholder="Search names and descriptions" />
        </div>
        <select name="example" class="md-select js-spec-example">
          <option value="">— Custom name —</option>
          ${exampleOptions}
        </select>
        <p class="md-sublabel js-spec-example-preview">Pick a suggestion to preview its example scope. Your own scope stays editable.</p>
      </div>
      <div class="md-group">
        <label class="md-label">Name <span class="md-sublabel">(occupation, apprenticeship, or life path)</span></label>
        <input type="text" name="name" class="md-input" value="${escapeHtml(existing?.name ?? '')}" maxlength="60" />
      </div>
      <div class="md-group">
        <label class="md-label">Category <span class="md-sublabel">(optional; filled from a suggestion)</span></label>
        <input type="text" name="category" class="md-input" value="${escapeHtml(existing?.category ?? '')}" maxlength="40" list="ms-profession-categories" />
        <datalist id="ms-profession-categories">${categoryOptions}</datalist>
      </div>
      <div class="md-group">
        <label class="md-label">Origin <span class="md-sublabel">(how this was learned)</span></label>
        <input type="text" name="origin" class="md-input" value="${escapeHtml(existing?.origin ?? '')}" maxlength="160" />
      </div>
      <div class="md-group">
        <label class="md-label">Scope <span class="md-sublabel">(one sentence, agreed with the GM)</span></label>
        <input type="text" name="scope" class="md-input" value="${escapeHtml(existing?.scope ?? '')}" maxlength="200" />
      </div>
      ${rankBlock}
    </form>`;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (v: boolean) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    new Dialog(
      {
        title: betaRespec
          ? `Beta Profession Respec — ${existing?.name ?? ''}`
          : existing
            ? `${masteryLocalize('MASTERY.df2026.specializations.edit', 'Edit Profession')} — ${existing.name}`
            : masteryLocalize('MASTERY.df2026.specializations.add', 'Add Profession'),
        content,
        buttons: {
          save: {
            label: betaRespec
              ? '<i class="fas fa-exchange-alt"></i> Replace'
              : '<i class="fas fa-check"></i> Save',
            callback: async (html: any) => {
              const root = rootOf(html);
              const name = readValue(root, 'name').trim();
              const origin = readValue(root, 'origin').trim();
              const scope = readValue(root, 'scope').trim();
              const category = readValue(root, 'category').trim();
              const rank = betaRespec
                ? (existing?.rank ?? 1)
                : fixedStartingRank
                  ? STARTING_SPECIALIZATION_RANK
                  : allowRankEdit
                    ? Math.floor(Number(readValue(root, 'rank')) || 0)
                    : (existing?.rank ?? 1);
              if (!name) {
                (globalThis as any).ui?.notifications?.warn?.('Name the Profession.');
                return done(false);
              }
              if (!origin) {
                (globalThis as any).ui?.notifications?.warn?.('Record how this Profession was learned.');
                return done(false);
              }
              if (isCharacterPerceptionSpec({ name })) {
                (globalThis as any).ui?.notifications?.warn?.(
                  'Perception is free for every character — it is not one of the four Professions.',
                );
                return done(false);
              }
              if (betaRespec && existing) {
                if (!isProfessionRespecEnabled()) {
                  (globalThis as any).ui?.notifications?.warn?.(
                    'Beta Profession Respec is disabled.',
                  );
                  return done(false);
                }
                const plan = planProfessionRespec(specs, {
                  replaceId: existing.id,
                  name,
                  origin,
                  scope,
                  category,
                });
                if (!plan.ok) {
                  (globalThis as any).ui?.notifications?.warn?.(plan.error ?? 'Respec failed.');
                  return done(false);
                }
                await actor.update({ 'system.specializations': plan.specializations });
                (globalThis as any).ui?.notifications?.info?.(
                  `${plan.previousName} Rank ${plan.preservedRank} → ${plan.nextName} Rank ${plan.preservedRank} (Beta Respec).`,
                );
                return done(true);
              }
              const nextId = professionIdentityKey(name);
              if (
                existing &&
                !fixedStartingRank &&
                nextId !== existing.id &&
                !isProfessionRespecEnabled()
              ) {
                (globalThis as any).ui?.notifications?.warn?.(
                  'Replacing a Profession identity requires Allow Profession Respec (Beta). Edit origin/scope, or ask the GM to enable Beta Respec.',
                );
                return done(false);
              }
              const record: SpecializationRecord = {
                id:
                  existing?.id && existing.id.startsWith('profession:')
                    ? nextId
                    : existing?.id || nextId,
                name,
                origin,
                scope,
                rank,
                ...(category ? { category } : {}),
                ...(existing?.field ? { field: existing.field } : {}),
                ...(existing?.startingSlot || fixedStartingRank ? { startingSlot: true } : {}),
              };
              if (!existing) record.id = nextId;
              if (learnWithXp) {
                const { applySpecializationLearn } = await import('../progression/progression-hub-actions.js');
                const res = await applySpecializationLearn(actor, { name, origin, scope });
                if (!res.ok) {
                  (globalThis as any).ui?.notifications?.warn?.(res.error ?? 'Could not learn Profession.');
                  return done(false);
                }
                return done(true);
              }
              const next = upsertSpecialization(specs, record, existing?.id);
              // Creation allows 1–4 Specs until finalize; full four×R2 is checked on finalize.
              const check = validateSpecializationList(next);
              if (!check.ok) {
                (globalThis as any).ui?.notifications?.warn?.(check.errors.join(' '));
                return done(false);
              }
              await actor.update({ 'system.specializations': next });
              done(true);
            },
          },
          cancel: { label: 'Cancel', callback: () => done(false) },
        },
        default: 'save',
        render: (html: any) => {
          const root = rootOf(html);
          const exampleSelect = root?.querySelector<HTMLSelectElement>('.js-spec-example');
          const categorySelect = root?.querySelector<HTMLSelectElement>('.js-spec-example-category');
          const searchInput = root?.querySelector<HTMLInputElement>('.js-spec-example-search');
          const preview = root?.querySelector<HTMLElement>('.js-spec-example-preview');
          const applyFilter = () => {
            if (!exampleSelect) return;
            const category = String(categorySelect?.value || '');
            const query = String(searchInput?.value || '').trim().toLowerCase();
            for (const opt of Array.from(exampleSelect.options)) {
              if (!opt.value) continue;
              const matchesCategory = !category || opt.dataset.category === category;
              const haystack = `${opt.dataset.name ?? ''} ${opt.dataset.scope ?? ''}`.toLowerCase();
              const matchesQuery = !query || haystack.includes(query);
              opt.hidden = !(matchesCategory && matchesQuery);
            }
            const selected = exampleSelect.selectedOptions?.[0];
            if (selected?.hidden) exampleSelect.value = '';
          };
          categorySelect?.addEventListener('change', applyFilter);
          searchInput?.addEventListener('input', applyFilter);
          exampleSelect?.addEventListener('change', () => {
            const opt = exampleSelect.selectedOptions?.[0];
            if (!opt?.value) {
              if (preview) preview.textContent = 'Pick a suggestion to preview its example scope. Your own scope stays editable.';
              return;
            }
            const name = String(opt.dataset.name || '').trim();
            const scope = String(opt.dataset.scope || '').trim();
            const category = String(opt.dataset.category || '').trim();
            if (preview) preview.textContent = scope ? `${name}: ${scope}` : name;
            const nameEl = root?.querySelector<HTMLInputElement>('[name="name"]');
            const scopeEl = root?.querySelector<HTMLInputElement>('[name="scope"]');
            const categoryEl = root?.querySelector<HTMLInputElement>('[name="category"]');
            if (name && nameEl) nameEl.value = name;
            if (scope && scopeEl && (!scopeEl.value.trim() || betaRespec)) scopeEl.value = scope;
            if (category && categoryEl) categoryEl.value = category;
          });
        },
        close: () => done(false),
      },
      { width: 480 },
    ).render(true);
  });
}

export async function deleteSpecializationWithConfirm(actor: any, specId: string): Promise<boolean> {
  const specs = readSpecializations(actor?.system);
  const spec = findSpecializationById(specs, specId);
  if (!spec) return false;
  if (isCharacterPerceptionSpec(spec)) {
    (globalThis as any).ui?.notifications?.warn?.(
      'Perception is a free universal check and cannot be removed.',
    );
    return false;
  }
  const Dialog: any = (globalThis as any).Dialog;
  let confirmed = false;
  if (Dialog?.confirm) {
    confirmed = !!(await Dialog.confirm({
      title: masteryLocalize('MASTERY.df2026.specializations.delete', 'Delete Specialization'),
      content: `<p>Delete <strong>${escapeHtml(spec.name)}</strong> (Rank ${spec.rank})? Spent XP is not refunded.</p>`,
    }));
  } else {
    confirmed = true;
  }
  if (!confirmed) return false;
  await actor.update({ 'system.specializations': removeSpecialization(specs, specId) });
  return true;
}

export interface SpecializationRollChoice {
  attributeKey: string;
  taskLevel: number;
  paidRaises: number;
  /** Always 0 pre-roll — Free Raises unlock on success. Kept for API compat. */
  freeRaises: number;
}

/**
 * Sheet Skill Check entry — shared dialog; GM-announced context; Paid Raises only.
 */
export async function promptSpecializationRollOptions(
  actor: any,
  spec: SpecializationRecord | null,
): Promise<SpecializationRollChoice | null> {
  const { promptSkillCheckRollDialog } = await import('./skill-check-roll-dialog.js');
  const { taskLevelFromBaseTn } = await import('../rules/index.js');
  const skillRef = spec
    ? { kind: 'specialization' as const, id: spec.id }
    : { kind: 'untrained' as const };
  const choice = await promptSkillCheckRollDialog({
    actor,
    source: {
      kind: 'sheet-verbal',
      gmVerified: false,
      taskDescription: '',
      attributeKey: '',
      baseTn: Number.NaN,
      skill: skillRef,
    },
    lockGmFields: false,
    title: spec ? `${spec.name} · Training Check` : 'Untrained · Training Check',
  });
  if (!choice) return null;
  return {
    attributeKey: choice.attributeKey,
    taskLevel: taskLevelFromBaseTn(choice.baseTn),
    paidRaises: choice.paidRaises,
    freeRaises: 0,
  };
}
