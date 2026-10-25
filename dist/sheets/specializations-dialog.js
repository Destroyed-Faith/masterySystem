/**
 * Specializations dialogs for the character sheet (DF Players Guide 2026-10-23).
 * Add / Edit / Delete a free-named Specialization and the pre-roll option picker.
 */
import { PAID_SKILL_FIELDS, SKILL_FIELD_LABELS, SPECIALIZATION_FIELD_EXAMPLES, SPECIALIZATION_MAX_RANK, STARTING_SPECIALIZATION_COUNT, STARTING_SPECIALIZATION_RANK, findSpecializationById, isCharacterPerceptionSpec, isSkillField, readSpecializations, removeSpecialization, specializationIdentityKey, upsertSpecialization, validateSpecializationList, } from '../rules/index.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function rootOf(html) {
    if (!html)
        return null;
    if (html instanceof HTMLElement)
        return html;
    if (html[0] instanceof HTMLElement)
        return html[0];
    return null;
}
function readValue(root, name) {
    const el = root?.querySelector(`[name="${name}"]`);
    return String(el?.value ?? '');
}
/** Add (no `specId`) or edit a Specialization. Resolves true when saved. */
export async function showSpecializationEditDialog(actor, opts = {}) {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return false;
    const specs = readSpecializations(actor?.system);
    const existing = opts.specId ? findSpecializationById(specs, opts.specId) : null;
    if (opts.specId && !existing) {
        globalThis.ui?.notifications?.warn?.('Specialization not found.');
        return false;
    }
    const fixedStartingRank = !!opts.fixedStartingRank;
    const paidSpecCount = specs.filter((s) => !isCharacterPerceptionSpec(s)).length;
    if (fixedStartingRank && !existing && paidSpecCount >= STARTING_SPECIALIZATION_COUNT) {
        globalThis.ui?.notifications?.warn?.(masteryLocalize('MASTERY.df2026.creation.finalizeNeedSpecs', `Starting characters pick exactly ${STARTING_SPECIALIZATION_COUNT} Rank ${STARTING_SPECIALIZATION_RANK} Specializations.`));
        return false;
    }
    const learnWithXp = !!opts.learnWithXp && !existing;
    const allowRankEdit = !fixedStartingRank && !learnWithXp && (opts.allowRankEdit !== false || !existing);
    const startRank = fixedStartingRank
        ? STARTING_SPECIALIZATION_RANK
        : (existing?.rank ?? 1);
    const fieldOptions = PAID_SKILL_FIELDS.map((f) => `<option value="${f}" ${existing?.field === f ? 'selected' : ''}>${escapeHtml(SKILL_FIELD_LABELS[f])}</option>`).join('');
    const rankBlock = fixedStartingRank
        ? `<div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.specializations.rank', 'Rank')}</label>
        <p class="md-sublabel">Rank ${STARTING_SPECIALIZATION_RANK} — ${masteryLocalize('MASTERY.df2026.creation.specsHeaderTitle', 'five Rank 2 at creation (20 Creation Points)')}</p>
        <input type="hidden" name="rank" value="${STARTING_SPECIALIZATION_RANK}" />
      </div>`
        : `<div class="md-group">
        <label class="md-label">Rank <span class="md-sublabel">(1–${SPECIALIZATION_MAX_RANK}${allowRankEdit ? '' : '; raise via Progression for 4 XP per Rank'})</span></label>
        <input type="number" name="rank" class="md-input" min="1" max="${SPECIALIZATION_MAX_RANK}" step="1" value="${startRank}" ${allowRankEdit ? '' : 'disabled'} />
      </div>`;
    const exampleOptions = PAID_SKILL_FIELDS.flatMap((f) => (SPECIALIZATION_FIELD_EXAMPLES[f] ?? []).map((ex) => `<option value="${escapeHtml(f)}::${escapeHtml(ex.name)}" data-field="${escapeHtml(f)}" data-name="${escapeHtml(ex.name)}" data-scope="${escapeHtml(ex.scope)}">${escapeHtml(SKILL_FIELD_LABELS[f])} — ${escapeHtml(ex.name)}</option>`)).join('');
    const content = `
    <form class="mastery-dialog-form spec-edit-form">
      <div class="md-group">
        <label class="md-label">Example <span class="md-sublabel">(optional — fills name, Field, and scope)</span></label>
        <select name="example" class="md-select js-spec-example">
          <option value="">— Free name —</option>
          ${exampleOptions}
        </select>
      </div>
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
    return new Promise((resolve) => {
        let settled = false;
        const done = (v) => {
            if (settled)
                return;
            settled = true;
            resolve(v);
        };
        new Dialog({
            title: existing
                ? `${masteryLocalize('MASTERY.df2026.specializations.edit', 'Edit Specialization')} — ${existing.name}`
                : masteryLocalize('MASTERY.df2026.specializations.add', 'Add Specialization'),
            content,
            buttons: {
                save: {
                    label: '<i class="fas fa-check"></i> Save',
                    callback: async (html) => {
                        const root = rootOf(html);
                        const name = readValue(root, 'name').trim();
                        const fieldRaw = readValue(root, 'field');
                        const scope = readValue(root, 'scope').trim();
                        const rank = fixedStartingRank
                            ? STARTING_SPECIALIZATION_RANK
                            : allowRankEdit
                                ? Math.floor(Number(readValue(root, 'rank')) || 0)
                                : (existing?.rank ?? 1);
                        if (!isSkillField(fieldRaw) || fieldRaw === 'perception') {
                            globalThis.ui?.notifications?.warn?.('Choose a Field.');
                            return done(false);
                        }
                        if (isCharacterPerceptionSpec({ name })) {
                            globalThis.ui?.notifications?.warn?.('Perception is free for every character — it is not one of the five Specializations.');
                            return done(false);
                        }
                        const field = fieldRaw;
                        const record = {
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
                                globalThis.ui?.notifications?.warn?.(res.error ?? 'Could not learn Specialization.');
                                return done(false);
                            }
                            return done(true);
                        }
                        const next = upsertSpecialization(specs, record, existing?.id);
                        // Creation allows 1–4 Specs until finalize; full five×R2 is checked on finalize.
                        const check = validateSpecializationList(next);
                        if (!check.ok) {
                            globalThis.ui?.notifications?.warn?.(check.errors.join(' '));
                            return done(false);
                        }
                        await actor.update({ 'system.specializations': next });
                        done(true);
                    },
                },
                cancel: { label: 'Cancel', callback: () => done(false) },
            },
            default: 'save',
            render: (html) => {
                const root = rootOf(html);
                const exampleSelect = root?.querySelector('.js-spec-example');
                exampleSelect?.addEventListener('change', () => {
                    const opt = exampleSelect.selectedOptions?.[0];
                    if (!opt?.value)
                        return;
                    const name = String(opt.dataset.name || '').trim();
                    const field = String(opt.dataset.field || '').trim();
                    const scope = String(opt.dataset.scope || '').trim();
                    const nameEl = root?.querySelector('[name="name"]');
                    const fieldEl = root?.querySelector('[name="field"]');
                    const scopeEl = root?.querySelector('[name="scope"]');
                    if (name && nameEl)
                        nameEl.value = name;
                    if (isSkillField(field) && fieldEl)
                        fieldEl.value = field;
                    if (scope && scopeEl)
                        scopeEl.value = scope;
                });
            },
            close: () => done(false),
        }, { width: 480 }).render(true);
    });
}
export async function deleteSpecializationWithConfirm(actor, specId) {
    const specs = readSpecializations(actor?.system);
    const spec = findSpecializationById(specs, specId);
    if (!spec)
        return false;
    if (isCharacterPerceptionSpec(spec)) {
        globalThis.ui?.notifications?.warn?.('Perception is a free universal Specialization and cannot be removed.');
        return false;
    }
    const Dialog = globalThis.Dialog;
    let confirmed = false;
    if (Dialog?.confirm) {
        confirmed = !!(await Dialog.confirm({
            title: masteryLocalize('MASTERY.df2026.specializations.delete', 'Delete Specialization'),
            content: `<p>Delete <strong>${escapeHtml(spec.name)}</strong> (Rank ${spec.rank})? Spent XP is not refunded.</p>`,
        }));
    }
    else {
        confirmed = true;
    }
    if (!confirmed)
        return false;
    await actor.update({ 'system.specializations': removeSpecialization(specs, specId) });
    return true;
}
/**
 * Sheet Skill Check entry — shared dialog; GM-announced context; Paid Raises only.
 */
export async function promptSpecializationRollOptions(actor, spec) {
    const { promptSkillCheckRollDialog } = await import('./skill-check-roll-dialog.js');
    const { taskLevelFromBaseTn } = await import('../rules/index.js');
    const skillRef = spec
        ? { kind: 'specialization', id: spec.id }
        : { kind: 'untrained' };
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
    if (!choice)
        return null;
    return {
        attributeKey: choice.attributeKey,
        taskLevel: taskLevelFromBaseTn(choice.baseTn),
        paidRaises: choice.paidRaises,
        freeRaises: 0,
    };
}
//# sourceMappingURL=specializations-dialog.js.map