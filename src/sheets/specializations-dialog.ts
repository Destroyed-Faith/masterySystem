/**
 * Specializations dialogs for the character sheet (DF Players Guide 2026-10-23).
 * Add / Edit / Delete a free-named Specialization and the pre-roll option picker.
 */

import {
  SKILL_FIELDS,
  SKILL_FIELD_LABELS,
  SPECIALIZATION_MAX_RANK,
  STARTING_SPECIALIZATION_COUNT,
  STARTING_SPECIALIZATION_RANK,
  findSpecializationById,
  isSkillField,
  readSpecializations,
  removeSpecialization,
  specializationIdentityKey,
  upsertSpecialization,
  validateSpecializationList,
  type SkillField,
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
     * Adding is capped at five Specs.
     */
    fixedStartingRank?: boolean;
  } = {},
): Promise<boolean> {
  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return false;
  const specs = readSpecializations(actor?.system);
  const existing = opts.specId ? findSpecializationById(specs, opts.specId) : null;
  if (opts.specId && !existing) {
    (globalThis as any).ui?.notifications?.warn?.('Specialization not found.');
    return false;
  }
  const fixedStartingRank = !!opts.fixedStartingRank;
  if (fixedStartingRank && !existing && specs.length >= STARTING_SPECIALIZATION_COUNT) {
    (globalThis as any).ui?.notifications?.warn?.(
      masteryLocalize(
        'MASTERY.df2026.creation.finalizeNeedSpecs',
        `Starting characters pick exactly ${STARTING_SPECIALIZATION_COUNT} Rank ${STARTING_SPECIALIZATION_RANK} Specializations.`,
      ),
    );
    return false;
  }
  const learnWithXp = !!opts.learnWithXp && !existing;
  const allowRankEdit =
    !fixedStartingRank && !learnWithXp && (opts.allowRankEdit !== false || !existing);
  const startRank = fixedStartingRank
    ? STARTING_SPECIALIZATION_RANK
    : (existing?.rank ?? 1);

  const fieldOptions = SKILL_FIELDS.map(
    (f) =>
      `<option value="${f}" ${existing?.field === f ? 'selected' : ''}>${escapeHtml(SKILL_FIELD_LABELS[f])}</option>`,
  ).join('');

  const rankBlock = fixedStartingRank
    ? `<div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.specializations.rank', 'Rank')}</label>
        <p class="md-sublabel">Rank ${STARTING_SPECIALIZATION_RANK} — ${masteryLocalize(
          'MASTERY.df2026.creation.specsHeaderTitle',
          'five Rank 2 at creation (20 Creation Points)',
        )}</p>
        <input type="hidden" name="rank" value="${STARTING_SPECIALIZATION_RANK}" />
      </div>`
    : `<div class="md-group">
        <label class="md-label">Rank <span class="md-sublabel">(1–${SPECIALIZATION_MAX_RANK}${
          allowRankEdit ? '' : '; raise via Progression for 4 XP per Rank'
        })</span></label>
        <input type="number" name="rank" class="md-input" min="1" max="${SPECIALIZATION_MAX_RANK}" step="1" value="${startRank}" ${
          allowRankEdit ? '' : 'disabled'
        } />
      </div>`;

  const content = `
    <form class="mastery-dialog-form spec-edit-form">
      <div class="md-group">
        <label class="md-label">Name <span class="md-sublabel">(free-named, e.g. Lockpicking)</span></label>
        <input type="text" name="name" class="md-input" value="${escapeHtml(existing?.name ?? '')}" maxlength="60" />
      </div>
      <div class="md-group">
        <label class="md-label">Field</label>
        <select name="field" class="md-select">${fieldOptions}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Scope <span class="md-sublabel">(one sentence)</span></label>
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
        title: existing
          ? `${masteryLocalize('MASTERY.df2026.specializations.edit', 'Edit Specialization')} — ${existing.name}`
          : masteryLocalize('MASTERY.df2026.specializations.add', 'Add Specialization'),
        content,
        buttons: {
          save: {
            label: '<i class="fas fa-check"></i> Save',
            callback: async (html: any) => {
              const root = rootOf(html);
              const name = readValue(root, 'name').trim();
              const fieldRaw = readValue(root, 'field');
              const scope = readValue(root, 'scope').trim();
              const rank = fixedStartingRank
                ? STARTING_SPECIALIZATION_RANK
                : allowRankEdit
                  ? Math.floor(Number(readValue(root, 'rank')) || 0)
                  : (existing?.rank ?? 1);
              if (!isSkillField(fieldRaw)) {
                (globalThis as any).ui?.notifications?.warn?.('Choose a Field.');
                return done(false);
              }
              const field = fieldRaw as SkillField;
              const record: SpecializationRecord = {
                id: specializationIdentityKey(name, field),
                name,
                field,
                scope,
                rank,
              };
              if (learnWithXp) {
                const { applySpecializationLearn } = await import('../progression/progression-hub-actions.js');
                const res = await applySpecializationLearn(actor, { name, field, scope });
                if (!res.ok) {
                  (globalThis as any).ui?.notifications?.warn?.(res.error ?? 'Could not learn Specialization.');
                  return done(false);
                }
                return done(true);
              }
              const next = upsertSpecialization(specs, record, existing?.id);
              // Creation allows 1–4 Specs until finalize; full five×R2 is checked on finalize.
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
        close: () => done(false),
      },
      { width: 440 },
    ).render(true);
  });
}

export async function deleteSpecializationWithConfirm(actor: any, specId: string): Promise<boolean> {
  const specs = readSpecializations(actor?.system);
  const spec = findSpecializationById(specs, specId);
  if (!spec) return false;
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
    title: spec ? `${spec.name} · Skill Check` : 'Untrained · Skill Check',
  });
  if (!choice) return null;
  return {
    attributeKey: choice.attributeKey,
    taskLevel: taskLevelFromBaseTn(choice.baseTn),
    paidRaises: choice.paidRaises,
    freeRaises: 0,
  };
}
