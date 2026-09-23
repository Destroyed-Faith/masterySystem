/**
 * One-time v0.9.9 Attribute respec, then a separate Stone dialog.
 * Postponing closes the dialog and leaves `needsV099Respec` set.
 *
 * Starting stays a free package (two 4s, two 3s, three 2s). The Apply button
 * stays disabled until that package is legal. Final is then raised with +
 * and − against the preserved Attribute XP. Stones are not on this form:
 * each unlocked box (Start, Start, 20, 40, …) is chosen afterwards.
 */
import { ATTRIBUTE_ABBREV, ATTRIBUTE_KEYS, stoneConcentrationCap, } from './v099-rules.js';
import { planV099Respec, v099RespecUpdate } from './v099-respec.js';
import { describeStartingPackage, emptyStoneSlotOrder, isColorlessSlot, migrationStoneSlotLabel, planFinalAttributes, slotAbbrev, stonePlacementOptions, stoneSlotProgress, } from './v099-respec-flow.js';
function readField(html, name) {
    const jq = html?.find?.(`[name="${name}"]`);
    if (jq && typeof jq.val === 'function')
        return String(jq.val() ?? '');
    const root = html?.[0] ?? html;
    const el = root?.querySelector?.(`[name="${name}"]`);
    return String(el?.value ?? '');
}
function suggestedStarting(actor) {
    const ranked = ATTRIBUTE_KEYS.map((key) => ({
        key,
        value: Math.floor(Number(actor?.system?.attributes?.[key]?.value) || 0),
    })).sort((a, b) => b.value - a.value || ATTRIBUTE_KEYS.indexOf(a.key) - ATTRIBUTE_KEYS.indexOf(b.key));
    const packageValues = [4, 4, 3, 3, 2, 2, 2];
    const out = {};
    ranked.forEach((row, index) => {
        out[row.key] = packageValues[index] ?? 2;
    });
    return out;
}
function dialogRoot(dialog, html) {
    const el = dialog?.element;
    const node = el?.[0] ?? el ?? html?.[0] ?? html;
    return node instanceof HTMLElement ? node : null;
}
function copyAttrs(source) {
    const out = {};
    for (const key of ATTRIBUTE_KEYS)
        out[key] = Math.floor(Number(source[key]) || 0);
    return out;
}
function readLifetime(root, fallback) {
    const input = root?.querySelector?.('[name="lifetime"]');
    if (!input)
        return fallback;
    const n = Math.floor(Number(input.value));
    return Number.isFinite(n) && n >= 0 ? n : null;
}
/**
 * Attribute step. Resolves 'postpone', or 'stones' once Starting is applied
 * and Final fits the preserved XP.
 */
function openAttributeStep(actor, draft) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor)
        return Promise.resolve('postpone');
    const system = actor.system ?? {};
    const preserved = Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0));
    const storedLife = system?.progression?.lifetimeXp;
    const needsLife = typeof storedLife !== 'number';
    const lifeKnown = needsLife ? null : Math.max(0, Math.floor(storedLife));
    const rows = ATTRIBUTE_KEYS.map((key) => {
        const start = draft.starting[key];
        return `<tr data-key="${key}">
      <td>${ATTRIBUTE_ABBREV[key]}</td>
      <td>
        <select name="start-${key}" ${draft.applied ? 'disabled' : ''}>
          <option value="2" ${start === 2 ? 'selected' : ''}>2</option>
          <option value="3" ${start === 3 ? 'selected' : ''}>3</option>
          <option value="4" ${start === 4 ? 'selected' : ''}>4</option>
        </select>
      </td>
      <td class="v099-final" data-key="${key}"></td>
    </tr>`;
    }).join('');
    const lifeField = needsLife
        ? `<label class="v099-life-field">Lifetime XP <input type="number" name="lifetime" min="0" step="1" value="${draft.lifetimeXp ?? 0}" /></label>
       <p class="v099-life-note">Lifetime XP could not be reconstructed. Enter the total XP ever earned. It is never spent. The next dialog assigns one Stone at Start (twice) and one more Stone every 20 XP.</p>`
        : `<p>Lifetime XP: <strong>${lifeKnown}</strong>. Stones are assigned in the next dialog: two at Start, then one every 20 XP.</p>`;
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new DialogCtor({
            title: 'v0.9.9 Attribute migration',
            content: `<form class="v099-respec-form" onsubmit="return false;">
          <p>This is a one-time migration. The free starting package is <strong>two 4s, two 3s and three 2s</strong>. Preserved Attribute XP: <strong>${preserved}</strong>. Apply that package first, then raise Final with + and −. Stones are not set here. Postponing leaves this migration on the sheet.</p>
          ${lifeField}
          <table class="v099-attr-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>
                  <div class="v099-col-head">
                    <span>Starting</span>
                    <button type="button" class="v099-apply-start"></button>
                  </div>
                  <span class="v099-start-status"></span>
                </th>
                <th>
                  <div>Final</div>
                  <span class="v099-xp"></span>
                </th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="v099-form-actions">
            <button type="button" class="v099-continue" disabled>Continue to Stones</button>
          </div>
        </form>`,
            buttons: {
                later: {
                    label: 'Postpone',
                    callback: () => finish('postpone'),
                },
            },
            default: 'later',
            render: () => paint(),
            close: () => finish('postpone'),
        }, { width: 760, classes: ['v099-respec-dialog'] });
        const paint = () => {
            const root = dialogRoot(dialog, null);
            if (!root)
                return;
            const selects = {};
            for (const key of ATTRIBUTE_KEYS) {
                const select = root.querySelector(`[name="start-${key}"]`);
                selects[key] = Math.floor(Number(select?.value ?? draft.starting[key]) || 0);
            }
            const status = describeStartingPackage(draft.applied ? draft.starting : selects);
            const statusEl = root.querySelector('.v099-start-status');
            if (statusEl) {
                statusEl.textContent = status.summary;
                statusEl.classList.toggle('is-valid', status.valid);
                statusEl.classList.toggle('is-invalid', !status.valid);
            }
            const applyBtn = root.querySelector('.v099-apply-start');
            if (applyBtn) {
                applyBtn.textContent = draft.applied ? 'Starting ändern' : 'Starting übernehmen';
                applyBtn.disabled = !draft.applied && !status.valid;
            }
            const adjust = planFinalAttributes(draft.applied ? draft.starting : selects, draft.applied ? draft.finals : selects, preserved);
            const xpEl = root.querySelector('.v099-xp');
            if (xpEl) {
                xpEl.textContent = draft.applied
                    ? `${Math.max(0, adjust.remaining)} XP left`
                    : `${preserved} XP`;
            }
            for (const row of adjust.rows) {
                const cell = root.querySelector(`.v099-final[data-key="${row.key}"]`);
                if (!cell)
                    continue;
                if (!draft.applied) {
                    cell.innerHTML = `<span class="v099-final-locked">${selects[row.key]}</span>`;
                    continue;
                }
                const costTitle = row.increaseCost > 0 ? `Costs ${row.increaseCost} XP` : 'Maximum is 40';
                cell.innerHTML = `<span class="v099-final-step">
          <button type="button" class="v099-step v099-plus" data-key="${row.key}" ${row.canIncrease ? '' : 'disabled'} title="${costTitle}" aria-label="Increase ${ATTRIBUTE_ABBREV[row.key]}">+</button>
          <span class="v099-final-value">${row.value}</span>
          <button type="button" class="v099-step v099-minus" data-key="${row.key}" ${row.canDecrease ? '' : 'disabled'} aria-label="Decrease ${ATTRIBUTE_ABBREV[row.key]}">−</button>
        </span>`;
            }
            const continueBtn = root.querySelector('.v099-continue');
            if (continueBtn)
                continueBtn.disabled = !(draft.applied && !adjust.overBudget);
        };
        const continueToStones = () => {
            if (!draft.applied)
                return;
            const root = dialogRoot(dialog, null);
            if (needsLife) {
                const life = readLifetime(root, draft.lifetimeXp);
                if (life == null) {
                    globalThis.ui?.notifications?.warn?.('Enter a Lifetime XP of 0 or more.');
                    return;
                }
                draft.lifetimeXp = life;
            }
            else {
                draft.lifetimeXp = lifeKnown;
            }
            const adjust = planFinalAttributes(draft.starting, draft.finals, preserved);
            if (adjust.overBudget) {
                globalThis.ui?.notifications?.warn?.(`Those Attributes cost ${adjust.spent} XP, but only ${preserved} preserved Attribute XP is available.`);
                return;
            }
            finish('stones');
            dialog.close();
        };
        dialog.activateListeners = function activate(html) {
            DialogCtor.prototype?.activateListeners?.call(dialog, html);
            const root = dialogRoot(dialog, html);
            if (!root || root._v099Bound)
                return;
            root._v099Bound = true;
            root.addEventListener('change', (ev) => {
                const target = ev.target;
                if (!target?.matches?.('select[name^="start-"]') || draft.applied)
                    return;
                paint();
            });
            root.addEventListener('click', (ev) => {
                const target = ev.target;
                const apply = target?.closest?.('.v099-apply-start');
                if (apply) {
                    ev.preventDefault();
                    if (draft.applied) {
                        draft.applied = false;
                        for (const key of ATTRIBUTE_KEYS) {
                            const select = root.querySelector(`[name="start-${key}"]`);
                            if (select)
                                select.disabled = false;
                        }
                        paint();
                        return;
                    }
                    const next = {};
                    for (const key of ATTRIBUTE_KEYS) {
                        const select = root.querySelector(`[name="start-${key}"]`);
                        next[key] = Math.floor(Number(select?.value) || 0);
                    }
                    if (!describeStartingPackage(next).valid)
                        return;
                    draft.starting = next;
                    draft.finals = copyAttrs(next);
                    draft.applied = true;
                    for (const key of ATTRIBUTE_KEYS) {
                        const select = root.querySelector(`[name="start-${key}"]`);
                        if (select)
                            select.disabled = true;
                    }
                    paint();
                    return;
                }
                if (target?.closest?.('.v099-continue')) {
                    ev.preventDefault();
                    continueToStones();
                    return;
                }
                const plus = target?.closest?.('.v099-plus');
                const minus = target?.closest?.('.v099-minus');
                const step = plus || minus;
                if (!step || !draft.applied)
                    return;
                ev.preventDefault();
                const key = step.dataset.key;
                if (!key)
                    return;
                const row = planFinalAttributes(draft.starting, draft.finals, preserved).rows.find((r) => r.key === key);
                if (!row)
                    return;
                if (plus && row.canIncrease)
                    draft.finals[key] = row.value + 1;
                if (minus && row.canDecrease)
                    draft.finals[key] = row.value - 1;
                paint();
            });
            paint();
        };
        dialog.render(true);
    });
}
/** One click, one dialog: pick an Attribute, combine two boxes, or clear. */
export function openStoneSlotChoice(args) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor)
        return Promise.resolve({ kind: 'cancel' });
    const attrButtons = args.attributeChoices
        .map((key) => `<button type="button" class="v099-pick" data-choice="attribute" data-key="${key}">${ATTRIBUTE_ABBREV[key]} (${args.counts[key] ?? 0})</button>`)
        .join('');
    const colorlessBtn = args.colorless
        ? `<button type="button" class="v099-pick" data-choice="colorless">Combine with another box into a Permanent Colorless Stone</button>`
        : args.colorlessHint
            ? `<p class="v099-pick-hint">${args.colorlessHint}</p>`
            : '';
    const clearBtn = args.allowClear
        ? `<button type="button" class="v099-pick" data-choice="clear">Clear this box</button>`
        : '';
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new DialogCtor({
            title: args.label,
            content: `<form class="v099-respec-form" onsubmit="return false;">
          <p>Choose where this Stone goes. A Permanent Colorless Stone takes this box and one other open box.</p>
          <div class="v099-pick-list">${attrButtons}${colorlessBtn}${clearBtn}</div>
        </form>`,
            buttons: {
                cancel: { label: 'Cancel', callback: () => finish({ kind: 'cancel' }) },
            },
            default: 'cancel',
            close: () => finish({ kind: 'cancel' }),
        }, { width: 460, classes: ['v099-respec-dialog'] });
        dialog.activateListeners = function activate(html) {
            DialogCtor.prototype?.activateListeners?.call(dialog, html);
            const root = dialogRoot(dialog, html);
            root?.querySelectorAll('.v099-pick').forEach((btn) => {
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    const el = btn;
                    const choice = el.dataset.choice;
                    if (choice === 'attribute') {
                        finish({ kind: 'attribute', key: el.dataset.key });
                    }
                    else if (choice === 'colorless') {
                        finish({ kind: 'colorless' });
                    }
                    else if (choice === 'clear') {
                        finish({ kind: 'clear' });
                    }
                    dialog.close();
                });
            });
        };
        dialog.render(true);
    }).then(async (choice) => {
        if (choice.kind !== 'colorless')
            return choice;
        const partner = await openPartnerChoice(args.label, args.partners);
        if (partner == null)
            return { kind: 'cancel' };
        return { kind: 'colorless', otherIndex: partner };
    });
}
function openPartnerChoice(label, partners) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || !partners.length)
        return Promise.resolve(null);
    let startNth = 0;
    const buttons = partners
        .map((partner) => {
        const suffix = partner.label === 'Start' ? ` ${++startNth}` : '';
        return `<button type="button" class="v099-pick" data-index="${partner.index}">${partner.label}${suffix}</button>`;
    })
        .join('');
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new DialogCtor({
            title: `${label} — second box`,
            content: `<form class="v099-respec-form" onsubmit="return false;">
          <p>A Permanent Colorless Stone replaces two Stones. Choose the second open box.</p>
          <div class="v099-pick-list">${buttons}</div>
        </form>`,
            buttons: { cancel: { label: 'Cancel', callback: () => finish(null) } },
            default: 'cancel',
            close: () => finish(null),
        }, { width: 420, classes: ['v099-respec-dialog'] });
        dialog.activateListeners = function activate(html) {
            DialogCtor.prototype?.activateListeners?.call(dialog, html);
            const root = dialogRoot(dialog, html);
            root?.querySelectorAll('.v099-pick').forEach((btn) => {
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    finish(Math.floor(Number(btn.dataset.index)));
                    dialog.close();
                });
            });
        };
        dialog.render(true);
    });
}
function openStoneStep(actor, draft, order) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor)
        return Promise.resolve('postpone');
    const storedRank = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new DialogCtor({
            title: 'v0.9.9 Stone migration',
            content: `<form class="v099-respec-form" onsubmit="return false;">
          <p>Click a box. Start is two Stones; every further box is one Stone at that Lifetime XP. Pick an Attribute, or combine two open boxes into one Permanent Colorless Stone.</p>
          <p class="v099-stone-meta"></p>
          <div class="v099-stone-grid"></div>
          <div class="v099-form-actions">
            <button type="button" class="v099-confirm" disabled>Confirm migration</button>
          </div>
        </form>`,
            buttons: {
                back: { label: 'Back to Attributes', callback: () => finish('back') },
                later: { label: 'Postpone', callback: () => finish('postpone') },
            },
            default: 'later',
            render: () => paint(),
            close: () => finish('postpone'),
        }, { width: 760, classes: ['v099-respec-dialog'] });
        const paint = () => {
            const root = dialogRoot(dialog, null);
            if (!root)
                return;
            const progress = stoneSlotProgress(order);
            const meta = root.querySelector('.v099-stone-meta');
            if (meta) {
                const cap = stoneConcentrationCap(order.length, storedRank);
                meta.textContent = `${progress.filled} / ${order.length} Stones placed` +
                    (progress.colorless ? ` · ${progress.colorless} Permanent Colorless` : '') +
                    ` · max ${cap} per Attribute`;
            }
            const grid = root.querySelector('.v099-stone-grid');
            if (grid) {
                grid.innerHTML = order
                    .map((choice, index) => {
                    const label = migrationStoneSlotLabel(index);
                    const abbrev = slotAbbrev(choice);
                    const open = !choice;
                    return `<button type="button" class="v099-stone-slot${open ? ' is-open' : ' is-assigned'}" data-index="${index}" title="${label}">
              <span class="v099-stone-mark">${abbrev || '+'}</span>
              <span class="v099-stone-threshold">${label}</span>
            </button>`;
                })
                    .join('');
            }
            const confirmBtn = root.querySelector('.v099-confirm');
            if (confirmBtn)
                confirmBtn.disabled = progress.openIndexes.length !== 0;
        };
        const confirmMigration = async () => {
            const progress = stoneSlotProgress(order);
            if (progress.openIndexes.length)
                return;
            const plan = planV099Respec(actor, {
                lifetimeXp: draft.lifetimeXp,
                starting: draft.starting,
                attributes: draft.finals,
                stones: progress.assignments,
                permanentColorless: progress.colorless,
                stoneSlotOrder: order,
            });
            if (!plan.ok) {
                globalThis.ui?.notifications?.warn?.(plan.reason || 'Migration is not valid.');
                return;
            }
            await actor.update(v099RespecUpdate(actor, plan));
            globalThis.ui?.notifications?.info?.('v0.9.9 migration saved.');
            finish('saved');
            dialog.close();
        };
        dialog.activateListeners = function activate(html) {
            DialogCtor.prototype?.activateListeners?.call(dialog, html);
            const root = dialogRoot(dialog, html);
            if (!root || root._v099Bound)
                return;
            root._v099Bound = true;
            root.addEventListener('click', (ev) => {
                const target = ev.target?.closest?.('.v099-stone-slot');
                if (target?.closest?.('.v099-confirm') || ev.target?.closest?.('.v099-confirm')) {
                    ev.preventDefault();
                    void confirmMigration();
                    return;
                }
                if (!target)
                    return;
                ev.preventDefault();
                const index = Math.floor(Number(target.dataset.index));
                if (!Number.isFinite(index) || index < 0 || index >= order.length)
                    return;
                void onSlot(index);
            });
            paint();
        };
        const onSlot = async (index) => {
            const options = stonePlacementOptions(order, storedRank);
            const progress = stoneSlotProgress(order);
            const partners = progress.openIndexes
                .filter((i) => i !== index)
                .map((i) => ({ index: i, label: migrationStoneSlotLabel(i) }));
            const choice = await openStoneSlotChoice({
                label: migrationStoneSlotLabel(index),
                attributeChoices: order[index] ? [] : options.attributes,
                counts: progress.assignments,
                colorless: !order[index] && options.colorless,
                colorlessHint: order[index] ? '' : options.colorlessReason,
                allowClear: !!order[index],
                partners,
            });
            if (choice.kind === 'cancel')
                return;
            if (choice.kind === 'clear') {
                const current = order[index];
                if (isColorlessSlot(current)) {
                    order.forEach((entry, i) => {
                        if (entry === current)
                            order[i] = null;
                    });
                }
                else
                    order[index] = null;
            }
            else if (choice.kind === 'attribute' && choice.key) {
                order[index] = choice.key;
            }
            else if (choice.kind === 'colorless' && choice.otherIndex != null && choice.otherIndex !== index) {
                if (!order[index] && !order[choice.otherIndex]) {
                    const pair = `colorless#${index}-${choice.otherIndex}`;
                    order[index] = pair;
                    order[choice.otherIndex] = pair;
                }
            }
            paint();
        };
        dialog.render(true);
    });
}
export async function openV099RespecDialog(actor) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || !actor)
        return;
    const starting = suggestedStarting(actor);
    const draft = {
        applied: false,
        starting: copyAttrs(starting),
        finals: copyAttrs(starting),
        lifetimeXp: typeof actor?.system?.progression?.lifetimeXp === 'number'
            ? Math.max(0, Math.floor(actor.system.progression.lifetimeXp))
            : null,
    };
    let order = null;
    for (;;) {
        const step = await openAttributeStep(actor, draft);
        if (step !== 'stones' || draft.lifetimeXp == null)
            return;
        if (!order || order.length !== emptyStoneSlotOrder(draft.lifetimeXp).length) {
            order = emptyStoneSlotOrder(draft.lifetimeXp);
        }
        const stones = await openStoneStep(actor, draft, order);
        if (stones === 'back')
            continue;
        return;
    }
}
/** One-time Lifetime XP entry when earned XP cannot be reconstructed. Does not respec Attributes. */
export async function openV099LifetimeDialog(actor) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || !actor)
        return;
    await new Promise((resolve) => {
        const dialog = new DialogCtor({
            title: 'Enter Lifetime XP',
            content: `<form class="v099-respec-form">
          <p>Lifetime XP could not be reconstructed from this character. Enter the total XP ever earned. It is never spent. Permanent Stones = 2 + floor(Lifetime XP / 20). Postponing leaves this request on the sheet.</p>
          <label>Lifetime XP <input type="number" name="lifetime" min="0" step="1" value="0" /></label>
        </form>`,
            buttons: {
                later: { label: 'Postpone', callback: () => resolve() },
                confirm: {
                    label: 'Save Lifetime XP',
                    callback: async (html) => {
                        const n = Math.floor(Number(readField(html, 'lifetime')));
                        if (!Number.isFinite(n) || n < 0) {
                            globalThis.ui?.notifications?.warn?.('Enter a Lifetime XP of 0 or more.');
                            resolve();
                            return;
                        }
                        await actor.update({
                            'system.progression.lifetimeXp': n,
                            'system.progression.lifetimeXpSource': 'manual',
                            'flags.mastery-system.needsV099LifetimeXp': false,
                        });
                        globalThis.ui?.notifications?.info?.('Lifetime XP saved. Assign the unlocked Stones.');
                        resolve();
                    },
                },
            },
            default: 'later',
            close: () => resolve(),
        }, { width: 480 });
        dialog.render(true);
    });
}
//# sourceMappingURL=v099-respec-dialog.js.map