/**
 * Specializations dialogs for the character sheet (DF Players Guide 2026-10-23).
 * Add / Edit / Delete a free-named Specialization and the pre-roll option picker.
 */
import { SKILL_FIELDS, SKILL_FIELD_LABELS, SPECIALIZATION_MAX_RANK, SPEC_ATTRIBUTE_KEYS, findSpecializationById, getSkillRaiseAllowance, isSkillField, planSpecializationRoll, readSpecializations, removeSpecialization, skillTaskBaseTn, specializationIdentityKey, upsertSpecialization, validateSpecializationList, } from '../rules/index.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
    const learnWithXp = !!opts.learnWithXp && !existing;
    const allowRankEdit = !learnWithXp && (opts.allowRankEdit !== false || !existing);
    const startRank = existing?.rank ?? 1;
    const fieldOptions = SKILL_FIELDS.map((f) => `<option value="${f}" ${existing?.field === f ? 'selected' : ''}>${escapeHtml(SKILL_FIELD_LABELS[f])}</option>`).join('');
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
      <div class="md-group">
        <label class="md-label">Rank <span class="md-sublabel">(1–${SPECIALIZATION_MAX_RANK}${allowRankEdit ? '' : '; raise via Progression for 4 XP per Rank'})</span></label>
        <input type="number" name="rank" class="md-input" min="1" max="${SPECIALIZATION_MAX_RANK}" step="1" value="${startRank}" ${allowRankEdit ? '' : 'disabled'} />
      </div>
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
                        const rank = allowRankEdit
                            ? Math.floor(Number(readValue(root, 'rank')) || 0)
                            : (existing?.rank ?? 1);
                        if (!isSkillField(fieldRaw)) {
                            globalThis.ui?.notifications?.warn?.('Choose a Field.');
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
            close: () => done(false),
        }, { width: 440 }).render(true);
    });
}
export async function deleteSpecializationWithConfirm(actor, specId) {
    const specs = readSpecializations(actor?.system);
    const spec = findSpecializationById(specs, specId);
    if (!spec)
        return false;
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
 * Pre-roll picker: Attribute (any of seven), Task Level, Paid / Free Raises.
 * `spec === null` means an untrained roll (0 Raises, Disadvantage).
 */
export async function promptSpecializationRollOptions(actor, spec) {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return null;
    const system = actor?.system ?? {};
    const mr = Math.max(1, Math.floor(Number(system?.mastery?.rank) || 1));
    const rank = spec?.rank ?? 0;
    const allowance = getSkillRaiseAllowance(rank);
    const attrVal = (k) => Math.max(0, Math.floor(Number(system?.attributes?.[k]?.value) || 0));
    const attrOptions = SPEC_ATTRIBUTE_KEYS.map((k, i) => `<option value="${k}" ${i === 0 ? 'selected' : ''}>${cap(k)} (${attrVal(k)})</option>`).join('');
    const title = spec
        ? `Roll ${spec.name} (Rank ${rank})`
        : masteryLocalize('MASTERY.df2026.specializations.untrainedRoll', 'Untrained Roll');
    const content = `
    <form class="mastery-dialog-form spec-roll-form">
      ${spec
        ? `<p class="md-sublabel">${escapeHtml(SKILL_FIELD_LABELS[spec.field])} — ${escapeHtml(spec.scope)}</p>`
        : `<p class="md-sublabel">No matching Specialization: full Attribute pool with Disadvantage, 0 Raises.</p>`}
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attribute" class="md-select">${attrOptions}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Task Level <span class="md-sublabel">(Base TN = Task Level × 4)</span></label>
        <input type="number" name="taskLevel" class="md-input" min="1" max="20" step="1" value="2" />
      </div>
      <div class="md-group">
        <label class="md-label">Paid Raises <span class="md-sublabel">(+4 TN each; max ${allowance.maxPaid})</span></label>
        <input type="number" name="paid" class="md-input" min="0" max="${allowance.maxPaid}" step="1" value="0" ${allowance.maxPaid > 0 ? '' : 'disabled'} />
      </div>
      <div class="md-group">
        <label class="md-label">Free Raises <span class="md-sublabel">(+0 TN; max ${allowance.maxFree})</span></label>
        <input type="number" name="free" class="md-input" min="0" max="${allowance.maxFree}" step="1" value="0" ${allowance.maxFree > 0 ? '' : 'disabled'} />
      </div>
      <div class="md-group md-final-tn">
        Pool: <strong><span class="spec-pool">${attrVal('might')}</span>d8</strong>, keep ${mr}${spec ? '' : ' (Disadvantage)'}
        · Base TN <strong><span class="spec-base-tn">${skillTaskBaseTn(2)}</span></strong>
        · Final TN <strong><span class="spec-final-tn">${skillTaskBaseTn(2)}</span></strong>
      </div>
    </form>`;
    return new Promise((resolve) => {
        let settled = false;
        const done = (v) => {
            if (settled)
                return;
            settled = true;
            resolve(v);
        };
        const read = (root) => ({
            attributeKey: readValue(root, 'attribute') || 'might',
            taskLevel: Math.max(1, Math.floor(Number(readValue(root, 'taskLevel')) || 1)),
            paidRaises: Math.max(0, Math.floor(Number(readValue(root, 'paid')) || 0)),
            freeRaises: Math.max(0, Math.floor(Number(readValue(root, 'free')) || 0)),
        });
        new Dialog({
            title,
            content,
            buttons: {
                roll: {
                    label: '<i class="fas fa-dice-d20"></i> Roll',
                    callback: (html) => {
                        const choice = read(rootOf(html));
                        const plan = planSpecializationRoll({
                            rank,
                            attributeValue: attrVal(choice.attributeKey),
                            masteryRank: mr,
                            taskLevel: choice.taskLevel,
                            paidRaises: choice.paidRaises,
                            freeRaises: choice.freeRaises,
                        });
                        if (!plan.ok) {
                            globalThis.ui?.notifications?.warn?.(plan.error ?? 'Invalid Raises.');
                            return done(null);
                        }
                        done(choice);
                    },
                },
                cancel: { label: 'Cancel', callback: () => done(null) },
            },
            default: 'roll',
            render: (html) => {
                const root = rootOf(html);
                if (!root)
                    return;
                const refresh = () => {
                    const c = read(root);
                    const plan = planSpecializationRoll({
                        rank,
                        attributeValue: attrVal(c.attributeKey),
                        masteryRank: mr,
                        taskLevel: c.taskLevel,
                        paidRaises: c.paidRaises,
                        freeRaises: c.freeRaises,
                    });
                    const set = (cls, text) => {
                        const el = root.querySelector(cls);
                        if (el)
                            el.textContent = text;
                    };
                    set('.spec-pool', String(plan.numDice));
                    set('.spec-base-tn', String(plan.baseTn));
                    set('.spec-final-tn', plan.ok ? String(plan.finalTn) : `${plan.finalTn} (invalid)`);
                };
                root.querySelectorAll('input, select').forEach((el) => {
                    el.addEventListener('input', refresh);
                    el.addEventListener('change', refresh);
                });
                refresh();
            },
            close: () => done(null),
        }, { width: 440 }).render(true);
    });
}
//# sourceMappingURL=specializations-dialog.js.map