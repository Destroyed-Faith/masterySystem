/**
 * Echo Imprints picker + use-to-chat (DF Players Guide 2026-10-23).
 *
 * Replaces the Minor Expressions dialog on live paths. Selection is free
 * (no Stones / XP / charges / Reroll Points). Choices are stored on
 * `system.echoImprints` as a string[] of imprint ids, capped at Mastery Rank.
 */
import { ECHO_IMPRINTS, ECHO_IMPRINT_MIN_ATTRIBUTE, echoImprintTierFromAttribute, findEchoImprint, resolveEchoImprintUse, validateEchoImprintSelections, } from '../rules/echo-imprints.js';
import { masteryFormat, masteryLocalize } from '../utils/mastery-localize.js';
const FLAG_SCOPE = 'mastery-system';
const ATTRIBUTE_ORDER = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
const ATTR_LABEL = {
    might: 'Might',
    agility: 'Agility',
    vitality: 'Vitality',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};
function imprintLimitNote(id) {
    if (id === 'hollow-echo') {
        return masteryLocalize('MASTERY.df2026.imprints.hollowEchoNote', 'Hollow Echo only suggests where to investigate. Finding a concealed seam, trap or mechanism still requires an appropriate Skill.');
    }
    if (id === 'catfall') {
        return masteryLocalize('MASTERY.df2026.imprints.catfallNote', 'Catfall softens a controlled landing; resolve dangerous heights with the normal falling rules. Lethal falls remain lethal.');
    }
    return undefined;
}
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function readAttributeValue(system, attr) {
    return Math.max(0, Math.floor(Number(system?.attributes?.[attr]?.value) || 0));
}
function readAttributes(system) {
    const out = {};
    for (const attr of ATTRIBUTE_ORDER)
        out[attr] = readAttributeValue(system, attr);
    return out;
}
function readMasteryRank(system) {
    return Math.max(1, Math.floor(Number(system?.mastery?.rank) || 1));
}
/** Saved ids from the actor, de-duplicated and restricted to known catalogue ids. */
export function readActorEchoImprintIds(actor) {
    const raw = actor?.system?.echoImprints;
    const ids = Array.isArray(raw) ? raw.map((v) => String(v ?? '').trim()).filter(Boolean) : [];
    return [...new Set(ids)].filter((id) => !!findEchoImprint(id));
}
function buildRow(def, attrVal, checked, saved, canUse) {
    const eligible = attrVal >= ECHO_IMPRINT_MIN_ATTRIBUTE;
    const tier = echoImprintTierFromAttribute(attrVal);
    const note = imprintLimitNote(def.id);
    const useLabel = masteryLocalize('MASTERY.df2026.imprints.use', 'Use');
    const useBtn = saved && eligible && canUse
        ? `<button type="button" class="ei-use" data-imprint-id="${escapeHtml(def.id)}" title="${escapeHtml(useLabel)}"><i class="fas fa-comment-dots"></i> ${escapeHtml(useLabel)}</button>`
        : '';
    return `
    <div class="ei-row-wrap${eligible ? '' : ' ei-row-wrap--disabled'}" data-imprint-id="${escapeHtml(def.id)}">
      <label class="ei-row${eligible ? '' : ' ei-row--disabled'}">
        <input type="checkbox" class="ei-pick" name="ei" value="${escapeHtml(def.id)}" ${checked ? 'checked' : ''} ${eligible ? '' : 'disabled'} />
        <span class="ei-row-body">
          <span class="ei-name">${escapeHtml(def.name)}</span>
          <span class="ei-tagline">${escapeHtml(def.tagline)}</span>
          ${note ? `<span class="ei-limit-note"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(note)}</span>` : ''}
          <span class="ei-tier-text"><strong>Tier ${tier}:</strong> ${escapeHtml(def.tiers[tier])}</span>
        </span>
      </label>
      ${useBtn}
    </div>`;
}
function buildSection(attr, attrVal, selected, saved, canUse, focus) {
    const eligible = attrVal >= ECHO_IMPRINT_MIN_ATTRIBUTE;
    const tier = echoImprintTierFromAttribute(attrVal);
    const defs = ECHO_IMPRINTS.filter((d) => d.attribute === attr);
    let html = `<section class="ei-attr-section${focus ? ' ei-attr-section--focus' : ''}" id="ei-section-${attr}" data-attr="${attr}">`;
    html += `<h4 class="ei-attr-heading">${ATTR_LABEL[attr]} <span class="ei-attr-value">(${attrVal})</span>`;
    html += eligible ? ` <span class="ei-attr-tier">Tier ${tier}</span>` : '';
    html += `</h4>`;
    if (!eligible) {
        html += `<p class="ei-attr-locked">${escapeHtml(masteryFormat('MASTERY.df2026.imprints.attrLocked', { min: ECHO_IMPRINT_MIN_ATTRIBUTE }, `Echo Imprints for this attribute are available from value ${ECHO_IMPRINT_MIN_ATTRIBUTE}.`))}</p>`;
    }
    for (const def of defs) {
        html += buildRow(def, attrVal, selected.has(def.id), saved.has(def.id), canUse);
    }
    html += `</section>`;
    return html;
}
/** Post one Echo Imprint use (effect at the current tier + echo memory) to chat. */
export async function postEchoImprintToChat(actor, imprintId) {
    const system = actor?.system ?? {};
    const def = findEchoImprint(imprintId);
    if (!def) {
        globalThis.ui?.notifications?.warn(`Unknown Echo Imprint: ${imprintId}.`);
        return false;
    }
    const attrVal = readAttributeValue(system, def.attribute);
    if (attrVal < ECHO_IMPRINT_MIN_ATTRIBUTE) {
        globalThis.ui?.notifications?.warn(`${def.name} requires ${ATTR_LABEL[def.attribute]} ${ECHO_IMPRINT_MIN_ATTRIBUTE}+ (have ${attrVal}).`);
        return false;
    }
    const use = resolveEchoImprintUse(imprintId, attrVal);
    if (!use)
        return false;
    const note = imprintLimitNote(def.id);
    const content = `<div class="mastery-system echo-imprint-card">` +
        `<header class="echo-imprint-card-head"><i class="fas fa-wand-sparkles"></i> ` +
        `<strong>${escapeHtml(use.definition.name)}</strong> ` +
        `<span class="echo-imprint-card-tier">${escapeHtml(ATTR_LABEL[def.attribute])} ${attrVal} · Tier ${use.tier}</span></header>` +
        `<p class="echo-imprint-card-tagline"><em>${escapeHtml(use.definition.tagline)}</em></p>` +
        `<p class="echo-imprint-card-effect"><strong>Effect:</strong> ${escapeHtml(use.effect)}</p>` +
        (note ? `<p class="echo-imprint-card-limit"><em>${escapeHtml(note)}</em></p>` : '') +
        `<p class="echo-imprint-card-memory"><strong>Echo memory:</strong> <em>${escapeHtml(use.echoMemory)}</em></p>` +
        `</div>`;
    const speaker = globalThis.ChatMessage?.getSpeaker?.({ actor }) ?? {};
    await globalThis.ChatMessage.create({
        speaker,
        content,
        flags: { [FLAG_SCOPE]: { echoImprintId: def.id, echoImprintTier: use.tier } },
    });
    return true;
}
export async function showEchoImprintsDialog(actor, options = {}) {
    const ui = globalThis.ui;
    const system = actor?.system ?? {};
    const mr = readMasteryRank(system);
    const attrs = readAttributes(system);
    const isOwner = !!actor?.isOwner;
    const savedIds = readActorEchoImprintIds(actor);
    const saved = new Set(savedIds);
    const initial = options.initialSelected ? [...new Set(options.initialSelected)] : savedIds;
    const selected = new Set(initial);
    const focus = options.focusAttribute;
    const sections = ATTRIBUTE_ORDER.map((attr) => buildSection(attr, attrs[attr], selected, saved, isOwner, focus === attr)).join('');
    const content = `
    <div class="echo-imprints-dialog-inner">
      <p class="ei-slots-summary"><strong><span id="ei-count">${selected.size}</span></strong> of <strong>${mr}</strong> selected (Mastery Rank ${mr})</p>
      <p class="ei-hint">Echo Imprints are small, harmless echoes of former lives. Choosing them costs no Stones, XP or charges, and they never replace Powers or Skills. Each imprint requires its attribute at ${ECHO_IMPRINT_MIN_ATTRIBUTE}+; its effect text scales with the attribute tier (4 / 8 / 12 / 16 / 20).</p>
      <p class="ei-hint ei-hint--limits"><strong>Limits:</strong> Hollow Echo only points to where a Skill check should look; Catfall never negates lethal falls.</p>
      ${sections}
    </div>`;
    return new Promise((resolve) => {
        let finished = false;
        const done = () => {
            if (finished)
                return;
            finished = true;
            resolve();
        };
        const buttons = {};
        if (isOwner) {
            buttons.save = {
                label: masteryLocalize('MASTERY.df2026.imprints.save', 'Save'),
                icon: '<i class="fas fa-save"></i>',
                callback: async (html) => {
                    const picked = [];
                    html.find('.ei-pick:checked:not(:disabled)').each(function () {
                        const v = $(this).val() || '';
                        if (v)
                            picked.push(v);
                    });
                    const validation = validateEchoImprintSelections({
                        selectedIds: picked,
                        masteryRank: mr,
                        attributes: attrs,
                    });
                    if (!validation.ok) {
                        ui?.notifications?.warn(validation.errors.join(' '));
                        finished = true;
                        resolve();
                        // Re-open with the rejected picks so nothing is lost.
                        void showEchoImprintsDialog(actor, { ...options, initialSelected: picked });
                        return false;
                    }
                    const unchanged = JSON.stringify(picked) === JSON.stringify(savedIds);
                    if (!unchanged)
                        await actor.update({ 'system.echoImprints': picked });
                    done();
                    return true;
                },
            };
        }
        buttons.close = {
            label: isOwner ? 'Cancel' : 'Close',
            callback: () => done(),
        };
        const dialog = new Dialog({
            title: masteryLocalize('MASTERY.df2026.imprints.title', 'Echo Imprints'),
            content,
            buttons,
            default: isOwner ? 'save' : 'close',
            close: () => done(),
            render: (html) => {
                const $html = html instanceof HTMLElement ? $(html) : $(html);
                const $root = $html.closest('.window-app.dialog');
                $root.addClass('mastery-system echo-imprints-dialog-app');
                const syncCount = () => {
                    $html.find('#ei-count').text(String($html.find('.ei-pick:checked:not(:disabled)').length));
                };
                $html.find('.ei-pick').on('change', function () {
                    const $cb = $(this);
                    if ($cb.is(':checked') && $html.find('.ei-pick:checked:not(:disabled)').length > mr) {
                        $cb.prop('checked', false);
                        ui?.notifications?.warn(masteryFormat('MASTERY.df2026.imprints.maxAtMr', { mr }, `At most ${mr} Echo Imprint${mr === 1 ? '' : 's'} at Mastery Rank ${mr}.`));
                    }
                    syncCount();
                });
                $html.find('.ei-use').on('click', async function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const id = String($(this).data('imprint-id') || '');
                    if (!id)
                        return;
                    try {
                        await postEchoImprintToChat(actor, id);
                    }
                    catch (err) {
                        console.error('Mastery System | Echo Imprint use failed', err);
                        ui?.notifications?.error('Echo Imprint could not be posted - see the console.');
                    }
                });
                if (!isOwner)
                    $html.find('.ei-pick').prop('disabled', true);
                syncCount();
                if (focus) {
                    const el = $html.find(`#ei-section-${focus}`)[0];
                    el?.scrollIntoView?.({ block: 'start' });
                }
            },
        }, { width: 680, height: 640, resizable: true });
        dialog.render(true);
    });
}
//# sourceMappingURL=echo-imprints-dialog.js.map