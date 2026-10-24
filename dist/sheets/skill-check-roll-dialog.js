/**
 * Shared ordinary Skill Check player dialog (DF 2026-10-24 GM-defined correction).
 *
 * GM defines task, Attribute, Skill and Base TN.
 * The only player gameplay control before the roll is Paid Raises.
 */
import { SPEC_ATTRIBUTE_KEYS, baseTnPresets, planSkillCheckDraft, resolveSkillForDraft, taskLevelFromBaseTn, } from '../rules/index.js';
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
function taskLevelHint(baseTn) {
    const level = taskLevelFromBaseTn(baseTn);
    const labels = {
        1: 'Trivial',
        2: 'Easy',
        3: 'Moderate',
        4: 'Challenging',
        5: 'Hard',
        6: 'Very Hard',
        7: 'Heroic',
        8: 'Legendary',
    };
    const label = labels[level] ?? `Task Level ${level}`;
    return `${label} · Task Level ${level}`;
}
function skillLabel(system, ref) {
    const r = resolveSkillForDraft(system, ref);
    if (ref.kind === 'untrained')
        return 'Untrained';
    return `${r.name} · Rank ${r.rank}`;
}
function parseSkillRef(raw) {
    const v = String(raw || '').trim();
    if (v === 'perception')
        return { kind: 'perception' };
    if (v === 'untrained' || !v)
        return { kind: 'untrained' };
    if (v.startsWith('specialization:')) {
        return { kind: 'specialization', id: v.slice('specialization:'.length) };
    }
    return { kind: 'specialization', id: v };
}
function skillOptionValue(ref) {
    if (ref.kind === 'specialization')
        return `specialization:${ref.id}`;
    return ref.kind;
}
/**
 * Open the shared Skill Check dialog. Resolves null on cancel.
 */
export async function promptSkillCheckRollDialog(opts) {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return null;
    const actor = opts.actor;
    const system = actor?.system ?? {};
    const source = opts.source;
    const lockGmFields = opts.lockGmFields ?? source.kind === 'gm-request';
    const ctxSkill = source.skill;
    const ctxAttr = String(source.attributeKey || '');
    const ctxBase = Math.max(0, Math.floor(Number(source.baseTn) || 0));
    const ctxTask = String(source.taskDescription || '');
    const allowed = opts.allowedSkills?.length
        ? opts.allowedSkills
        : source.kind === 'gm-request' && source.allowedSkills?.length
            ? source.allowedSkills
            : null;
    const attrVal = (k) => Math.max(0, Math.floor(Number(system?.attributes?.[k]?.value) || 0));
    const sourceTag = source.kind === 'gm-request'
        ? masteryLocalize('MASTERY.df2026.skillCheck.sourceGm', 'GM REQUEST · VERIFIED')
        : masteryLocalize('MASTERY.df2026.skillCheck.sourceVerbal', 'GM-ANNOUNCED (local record)');
    const tnAuthority = masteryLocalize('MASTERY.df2026.skillCheck.tnLocked', 'SET BY GM');
    const attrReadOnly = lockGmFields
        ? `<div class="md-attr-display ms-sc-readonly">${escapeHtml(cap(ctxAttr || '—'))}${ctxAttr ? ` (${attrVal(ctxAttr)})` : ''}</div>
       <input type="hidden" name="attribute" value="${escapeHtml(ctxAttr)}" />`
        : `<select name="attribute" class="md-select ms-sc-attr">
        <option value="">${escapeHtml(masteryLocalize('MASTERY.df2026.skillCheck.pickGmAttribute', '— record GM Attribute —'))}</option>
        ${SPEC_ATTRIBUTE_KEYS.map((k) => `<option value="${k}" ${k === ctxAttr ? 'selected' : ''}>${cap(k)} (${attrVal(k)})</option>`).join('')}
      </select>
      <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.gmAnnouncedAttr', 'GM-vorgegeben / vom SL genannt — not a player choice.')}</small>`;
    const skillReadOnly = lockGmFields && !allowed
        ? `<div class="md-attr-display ms-sc-readonly">${escapeHtml(skillLabel(system, ctxSkill))}</div>
         <input type="hidden" name="skill" value="${escapeHtml(skillOptionValue(ctxSkill))}" />`
        : allowed && allowed.length > 1
            ? `<select name="skill" class="md-select ms-sc-skill">
            ${allowed
                .map((s) => {
                const sel = skillOptionValue(s) === skillOptionValue(ctxSkill) ? 'selected' : '';
                return `<option value="${escapeHtml(skillOptionValue(s))}" ${sel}>${escapeHtml(skillLabel(system, s))}</option>`;
            })
                .join('')}
          </select>
          <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.gmApprovedSet', 'Limited to GM-approved methods for this task.')}</small>`
            : lockGmFields
                ? `<div class="md-attr-display ms-sc-readonly">${escapeHtml(skillLabel(system, ctxSkill))}</div>
             <input type="hidden" name="skill" value="${escapeHtml(skillOptionValue(ctxSkill))}" />`
                : `<div class="md-attr-display ms-sc-readonly">${escapeHtml(skillLabel(system, ctxSkill))}</div>
             <input type="hidden" name="skill" value="${escapeHtml(skillOptionValue(ctxSkill))}" />
             <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.sheetSkillContext', 'Sheet entry context — Skill is fixed; GM defines Attribute and TN.')}</small>`;
    const baseReadOnly = lockGmFields
        ? `<input type="number" name="baseTn" class="md-input ms-sc-base" value="${ctxBase}" disabled />
       <input type="hidden" name="baseTnLocked" value="${ctxBase}" />
       <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.baseTnLockedHint', 'Base TN is fixed by the GM. Paid Raises only raise your personal Final TN.')}</small>`
        : `<select name="baseTn" class="md-select ms-sc-base">
         <option value="">${escapeHtml(masteryLocalize('MASTERY.df2026.skillCheck.pickGmTn', '— record GM Base TN —'))}</option>
         ${baseTnPresets()
            .map((tn) => `<option value="${tn}" ${tn === ctxBase && ctxBase > 0 ? 'selected' : ''}>${tn} — ${escapeHtml(taskLevelHint(tn))}</option>`)
            .join('')}
         <option value="custom">Custom…</option>
       </select>
       <input type="number" name="baseTnCustom" class="md-input ms-sc-base-custom" min="0" step="1" value="" style="display:none;margin-top:6px" />
       <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.gmAnnouncedTn', 'GM-vorgegeben / vom SL genannt — do not invent a favourable TN.')}</small>`;
    const taskField = lockGmFields
        ? `<div class="md-attr-display ms-sc-readonly">${escapeHtml(ctxTask || '—')}</div>
       <input type="hidden" name="task" value="${escapeHtml(ctxTask)}" />`
        : `<input type="text" name="task" class="md-input" value="${escapeHtml(ctxTask)}" maxlength="200" placeholder="${escapeHtml(masteryLocalize('MASTERY.df2026.skillCheck.taskPlaceholder', 'Record the task the GM announced…'))}" />
       <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.gmAnnouncedTask', 'GM-vorgegeben / vom SL genannt.')}</small>`;
    const content = `
    <form class="mastery-dialog-form ms-skill-check-form" data-lock-gm="${lockGmFields ? '1' : '0'}">
      <div class="ms-sc-source-row">
        <span class="ms-sc-tag">${escapeHtml(sourceTag)}</span>
        <span class="ms-sc-tag ms-sc-tag-gold">${escapeHtml(tnAuthority)}</span>
      </div>
      <div class="ms-sc-missing" hidden></div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillCheck.task', 'Task')}</label>
        ${taskField}
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillCheck.skill', 'Skill')}</label>
        ${skillReadOnly}
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillCheck.attribute', 'Attribute')}</label>
        ${attrReadOnly}
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillCheck.baseTn', 'Base Target Number (TN)')}</label>
        ${baseReadOnly}
      </div>
      <div class="ms-sc-free-notice" hidden>
        <span class="ms-sc-free-icon" aria-hidden="true">✦</span>
        <div>
          <strong class="ms-sc-free-label"></strong>
          <small>${masteryLocalize('MASTERY.df2026.skillCheck.freeHint', 'Available automatically after a successful roll — not chosen now.')}</small>
        </div>
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillCheck.paidRaisesPlayer', 'Paid Raises (your decision)')}</label>
        <select name="paid" class="md-select ms-sc-paid"></select>
        <small class="md-sublabel ms-sc-paid-ladder"></small>
      </div>
      <details class="ms-sc-help">
        <summary>${masteryLocalize('MASTERY.df2026.skillCheck.whatRaisesDo', 'ⓘ What can Raises do?')}</summary>
        <ul>
          <li><b>Scope:</b> more of the same result</li>
          <li><b>Speed:</b> finish faster</li>
          <li><b>Quality:</b> higher quality</li>
          <li><b>Efficiency:</b> less waste or effort</li>
          <li><b>Insight:</b> one extra fitting clue</li>
          <li><b>Safety:</b> mitigate a foreseeable complication</li>
        </ul>
        <p class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillCheck.effectsAfterSuccess', 'Concrete effects are assigned on the chat card after success.')}</p>
      </details>
      <div class="ms-sc-mathbox">
        <div class="ms-sc-formula md-sublabel"></div>
        <div class="ms-sc-mathrow">
          <strong>${masteryLocalize('MASTERY.df2026.skillCheck.finalTn', 'Final Target Number')}</strong>
          <big class="ms-sc-final-tn">—</big>
        </div>
        <div class="ms-sc-mathrow ms-sc-mathrow-compact">
          <span class="ms-sc-pool"></span>
          <span class="ms-sc-success-raises"></span>
        </div>
        <div class="ms-sc-subtitle md-sublabel"></div>
      </div>
    </form>`;
    const title = opts.title ||
        masteryLocalize('MASTERY.df2026.skillCheck.title', 'Skill Check');
    return new Promise((resolve) => {
        let settled = false;
        const done = (v) => {
            if (settled)
                return;
            settled = true;
            resolve(v);
        };
        const buildSourceFromForm = (root) => {
            const task = String(root?.querySelector('[name="task"]')?.value ?? ctxTask).trim();
            const skill = parseSkillRef(String(root?.querySelector('[name="skill"]')
                ?.value ?? skillOptionValue(ctxSkill)));
            let attributeKey = String(root?.querySelector('[name="attribute"]')
                ?.value ?? ctxAttr);
            let baseTn = ctxBase;
            if (lockGmFields) {
                attributeKey = ctxAttr;
                baseTn =
                    source.kind === 'gm-request'
                        ? Math.max(0, Math.floor(Number(source.baseTn) || 0))
                        : ctxBase;
            }
            else {
                const sel = root?.querySelector('[name="baseTn"]')?.value;
                if (sel === 'custom') {
                    const custom = Number(root?.querySelector('[name="baseTnCustom"]')?.value);
                    baseTn = Number.isFinite(custom) ? Math.max(0, Math.floor(custom)) : Number.NaN;
                }
                else if (sel === '' || sel == null) {
                    baseTn = Number.NaN;
                }
                else {
                    baseTn = Math.max(0, Math.floor(Number(sel)));
                }
            }
            if (source.kind === 'gm-request') {
                // Authoritative fields stay on the source — form cannot rewrite them.
                return {
                    ...source,
                    skill: allowed && allowed.length > 1 ? skill : source.skill,
                };
            }
            return {
                kind: 'sheet-verbal',
                gmVerified: false,
                taskDescription: task,
                attributeKey,
                baseTn: Number.isFinite(baseTn) ? baseTn : Number.NaN,
                skill,
            };
        };
        const readDraft = (root) => {
            const nextSource = buildSourceFromForm(root);
            const paid = Math.max(0, Math.floor(Number(root?.querySelector('[name="paid"]')?.value) || 0));
            const ctx = nextSource.kind === 'gm-request'
                ? {
                    skill: nextSource.skill,
                    attributeKey: nextSource.attributeKey,
                    baseTn: nextSource.baseTn,
                    taskDescription: nextSource.taskDescription,
                }
                : {
                    skill: nextSource.skill,
                    attributeKey: nextSource.attributeKey,
                    baseTn: nextSource.baseTn,
                    taskDescription: nextSource.taskDescription,
                };
            return {
                actorId: String(actor?.id ?? ''),
                paidRaises: paid,
                skill: ctx.skill,
                attributeKey: ctx.attributeKey,
                baseTn: ctx.baseTn,
                taskDescription: ctx.taskDescription,
                source: nextSource,
            };
        };
        new Dialog({
            title,
            content,
            buttons: {
                roll: {
                    label: `<i class="fas fa-dice-d8"></i> ${masteryLocalize('MASTERY.df2026.skillCheck.roll', 'Roll')}`,
                    callback: (html) => {
                        const root = rootOf(html);
                        const draft = readDraft(root);
                        // Re-bind gm-request from immutable source (anti-tamper)
                        if (source.kind === 'gm-request') {
                            draft.source = {
                                ...source,
                                skill: allowed && allowed.length > 1
                                    ? draft.skill
                                    : source.skill,
                            };
                            if (!(allowed && allowed.length > 1)) {
                                draft.skill = source.skill;
                            }
                            draft.attributeKey = source.attributeKey;
                            draft.baseTn = source.baseTn;
                            draft.taskDescription = source.taskDescription;
                        }
                        const plan = planSkillCheckDraft({ system, draft, requireKnownSkill: true });
                        if (!plan.ok) {
                            globalThis.ui?.notifications?.warn?.(plan.error ?? 'Invalid Skill Check.');
                            return done(null);
                        }
                        draft.paidRaises = plan.paidRaises;
                        done({
                            draft,
                            attributeKey: plan.attributeKey,
                            baseTn: plan.baseTn,
                            paidRaises: plan.paidRaises,
                            skill: draft.skill,
                        });
                    },
                },
                cancel: {
                    label: masteryLocalize('MASTERY.df2026.skillCheck.cancel', 'Cancel'),
                    callback: () => done(null),
                },
            },
            default: 'roll',
            render: (html) => {
                const root = rootOf(html);
                if (!root)
                    return;
                const $app = html?.closest?.('.window-app') ?? root.closest?.('.window-app');
                $app?.classList?.add?.('mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog');
                const refresh = () => {
                    const draft = readDraft(root);
                    const plan = planSkillCheckDraft({ system, draft });
                    const missingEl = root.querySelector('.ms-sc-missing');
                    if (missingEl) {
                        if (plan.missing?.length) {
                            missingEl.hidden = false;
                            missingEl.textContent = masteryLocalize('MASTERY.df2026.skillCheck.missingContext', `Missing GM information: ${plan.missing.join(', ')}. Enter the GM-announced values before rolling.`);
                        }
                        else {
                            missingEl.hidden = true;
                            missingEl.textContent = '';
                        }
                    }
                    const freeNotice = root.querySelector('.ms-sc-free-notice');
                    const freeLabel = root.querySelector('.ms-sc-free-label');
                    if (freeNotice)
                        freeNotice.hidden = !plan.showFreeBanner;
                    if (freeLabel && plan.showFreeBanner) {
                        const n = plan.freeRaisesOnSuccess;
                        freeLabel.textContent =
                            n === 1
                                ? 'On success: 1 Free Raise available'
                                : `On success: ${n} Free Raises available`;
                    }
                    const paidSel = root.querySelector('.ms-sc-paid');
                    if (paidSel) {
                        const prev = Math.max(0, Math.floor(Number(paidSel.value) || 0));
                        paidSel.innerHTML = plan.paidOptions
                            .map((o) => `<option value="${o.paid}">${escapeHtml(o.label)}</option>`)
                            .join('');
                        const next = Math.min(prev, plan.allowance.maxPaid);
                        paidSel.value = String(Number.isFinite(next) ? next : 0);
                        paidSel.disabled = plan.allowance.maxPaid <= 0 && !plan.ok && !!plan.missing?.length
                            ? true
                            : plan.allowance.maxPaid <= 0 && plan.rank === 0;
                    }
                    const ladder = root.querySelector('.ms-sc-paid-ladder');
                    if (ladder) {
                        ladder.textContent = plan.paidOptions
                            .map((o) => `${o.paid} → TN${o.finalTn}`)
                            .join(' · ');
                    }
                    const liveDraft = readDraft(root);
                    const livePlan = planSkillCheckDraft({ system, draft: liveDraft });
                    const formula = root.querySelector('.ms-sc-formula');
                    const finalEl = root.querySelector('.ms-sc-final-tn');
                    const poolEl = root.querySelector('.ms-sc-pool');
                    const successEl = root.querySelector('.ms-sc-success-raises');
                    const subEl = root.querySelector('.ms-sc-subtitle');
                    if (formula) {
                        formula.textContent = livePlan.ok
                            ? `BASE ${livePlan.baseTn} + ${livePlan.paidRaises * 4} (${livePlan.paidRaises} PAID) = FINAL`
                            : 'Complete GM context to see Final TN';
                    }
                    if (finalEl)
                        finalEl.textContent = livePlan.ok ? String(livePlan.finalTn) : '—';
                    if (poolEl) {
                        poolEl.textContent = livePlan.ok
                            ? `Pool · ${livePlan.numDice}k${livePlan.keepDice}${livePlan.rollDisadvantage ? ' (Disadvantage)' : ''}`
                            : 'Pool · —';
                    }
                    if (successEl) {
                        const total = livePlan.paidRaises + livePlan.freeRaisesOnSuccess;
                        successEl.textContent =
                            livePlan.ok && total > 0
                                ? `On success: up to ${total} Raises (${livePlan.paidRaises} Paid + ${livePlan.freeRaisesOnSuccess} Free)`
                                : livePlan.ok
                                    ? 'No Raises on success'
                                    : '';
                    }
                    if (subEl) {
                        subEl.textContent = livePlan.ok
                            ? `${livePlan.skillName} · Rank ${livePlan.rank} · ${cap(livePlan.attributeKey)} ${livePlan.attributeValue} · MR ${livePlan.masteryRank}`
                            : '';
                    }
                    const rollBtn = root
                        .closest('.window-app')
                        ?.querySelector('.dialog-button.roll');
                    if (rollBtn) {
                        rollBtn.disabled = !livePlan.ok;
                        rollBtn.innerHTML = livePlan.ok
                            ? `<i class="fas fa-dice-d8"></i> ${masteryLocalize('MASTERY.df2026.skillCheck.roll', 'Roll')} · ${livePlan.numDice}k${livePlan.keepDice} vs TN ${livePlan.finalTn}`
                            : `<i class="fas fa-dice-d8"></i> ${masteryLocalize('MASTERY.df2026.skillCheck.roll', 'Roll')}`;
                    }
                    const customInput = root.querySelector('.ms-sc-base-custom');
                    const baseSel = root.querySelector('select.ms-sc-base');
                    if (customInput && baseSel) {
                        customInput.style.display = baseSel.value === 'custom' ? '' : 'none';
                    }
                };
                root.querySelectorAll('input, select').forEach((el) => {
                    el.addEventListener('input', refresh);
                    el.addEventListener('change', refresh);
                });
                refresh();
            },
            close: () => done(null),
        }, { width: 480, classes: ['mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog'] }).render(true);
    });
}
//# sourceMappingURL=skill-check-roll-dialog.js.map