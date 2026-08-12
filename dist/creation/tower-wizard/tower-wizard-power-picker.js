/**
 * Tower Wizard — categorized Change-Power picker.
 *
 * Modal dialog that mirrors the wizard steps: collapsible groups of cards
 * (and, for Active slots, the Offense-step pattern/Melee-Ranged layout).
 * Clicking a card/variant selects it immediately and closes the dialog.
 * Spell options stay in the review row beneath each Active.
 */
import { CATEGORY_LABELS, powerIdentityKey, } from '../../utils/power-catalog.js';
import { setupPowerCatalogDialogChrome } from '../../utils/legacy-dialog-resize.js';
import { getCategoryPickerGroups, getOffenseActiveSpecialGroups, grantKeyCategory, grantKeyRank, } from './tower-wizard-packages.js';
export function catalogPickerResultToGrantSpec(result) {
    return {
        templateId: result.templateId,
        rank: result.rank,
        special: result.special ?? null,
        isSpell: result.isSpell,
        castingAttribute: result.castingAttribute,
        spellResolution: result.spellResolution,
    };
}
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function dataSpecialAttr(special) {
    return special == null ? '' : escapeHtml(special);
}
function renderActiveGroupsHtml(options) {
    const groups = getOffenseActiveSpecialGroups(options.actorEchoKey ?? null, options.selectedIds, options.excludeIds);
    if (!groups.length) {
        return '<p class="tower-wizard-warn">No matching powers available for this slot.</p>';
    }
    return groups
        .map((group) => {
        const tooltip = group.groupTooltip
            ? `<span class="tower-wizard-special-tooltip" role="tooltip">${escapeHtml(group.groupTooltip)}</span>`
            : '';
        const patterns = group.patterns
            .map((pattern) => {
            const variants = pattern.variants
                .map((v) => {
                const sel = v.isSelected ? ' is-selected' : '';
                const mech = v.mechanics ? `\n\n${v.mechanics}` : '';
                const title = `${v.deliveryLabel} — ${pattern.label}${mech}`;
                return `<button type="button" class="tower-wizard-offense-variant js-tw-picker-variant${sel}" data-template-id="${escapeHtml(v.templateId)}" data-special="${dataSpecialAttr(v.special)}" title="${escapeHtml(title)}">${escapeHtml(v.deliveryLabel)}</button>`;
            })
                .join('');
            return `
                        <div class="tower-wizard-offense-pattern">
                          <div class="tower-wizard-offense-pattern-head">
                            <span class="tower-wizard-offense-pattern-label">${escapeHtml(pattern.label)}</span>
                            <span class="tower-wizard-offense-pattern-hint">${escapeHtml(pattern.hint)}</span>
                          </div>
                          <div class="tower-wizard-offense-variants">${variants}</div>
                        </div>`;
        })
            .join('');
        return `
                <details class="tower-wizard-offense-special-details"${group.hasSelection ? ' open' : ''}>
                  <summary class="tower-wizard-offense-special-summary">
                    <span class="tower-wizard-offense-special-title-wrap">
                      <span class="tower-wizard-offense-special-title">${escapeHtml(group.groupLabel)}</span>
                      ${tooltip}
                    </span>
                  </summary>
                  <div class="tower-wizard-offense-special-body">${patterns}</div>
                </details>`;
    })
        .join('');
}
function renderCategoryGroupsHtml(options) {
    const groups = getCategoryPickerGroups(options.category, options.rank, {
        excludeIdentityKeys: options.excludeIds,
        excludeSubfamilies: options.excludeSubfamilies,
        selectedIdentityKeys: options.selectedIds,
        actorEchoKey: options.actorEchoKey ?? null,
    });
    if (!groups.length) {
        return '<p class="tower-wizard-warn">No matching powers available for this slot.</p>';
    }
    return groups
        .map((group) => {
        const cards = group.cards
            .map((card) => {
            const sel = card.isSelected ? ' is-selected' : '';
            const hint = card.hint
                ? `<span class="chip-mechanical">${escapeHtml(card.hint)}</span>`
                : '';
            const title = card.mechanics
                ? `${card.label}\n\n${card.mechanics}`
                : card.label;
            return `<button type="button" class="tower-wizard-passive-card js-tw-picker-card${sel}" data-template-id="${escapeHtml(card.templateId)}" data-special="${dataSpecialAttr(card.special)}" title="${escapeHtml(title)}">
                      <span class="chip-label">${escapeHtml(card.label)}</span>
                      ${hint}
                    </button>`;
        })
            .join('');
        return `
                <details class="tower-wizard-offense-special-details"${group.hasSelection ? ' open' : ''}>
                  <summary class="tower-wizard-offense-special-summary">
                    <span class="tower-wizard-offense-special-title-wrap">
                      <span class="tower-wizard-offense-special-title">${escapeHtml(group.groupLabel)}</span>
                    </span>
                  </summary>
                  <div class="tower-wizard-picker-card-grid tower-wizard-passive-grid">${cards}</div>
                </details>`;
    })
        .join('');
}
export async function showTowerWizardPowerPicker(options) {
    const category = grantKeyCategory(options.grantKey);
    const fixedRank = grantKeyRank(options.grantKey);
    const selectedIds = new Set();
    if (options.currentTemplateId) {
        selectedIds.add(powerIdentityKey({
            templateId: options.currentTemplateId,
            category,
            chosenSpecial: options.currentSpecial ? { key: options.currentSpecial } : null,
        }));
    }
    const groupsHtml = category === 'active'
        ? renderActiveGroupsHtml({
            actorEchoKey: options.actorEchoKey,
            selectedIds,
            excludeIds: options.excludeIdentityKeys,
        })
        : renderCategoryGroupsHtml({
            category,
            rank: fixedRank,
            actorEchoKey: options.actorEchoKey,
            selectedIds,
            excludeIds: options.excludeIdentityKeys,
            excludeSubfamilies: options.excludeSubfamilies ?? new Set(),
        });
    const content = `
    <div class="tower-wizard-dialog tower-wizard-picker-body">
      <p class="tower-wizard-picker-intro">Choose a replacement <strong>${escapeHtml(CATEGORY_LABELS[category])}</strong> for <strong>${escapeHtml(options.roleLabel)}</strong> (Rank ${fixedRank}). Click an option to use it.</p>
      ${options.echoPickerNote ? `<p class="tower-wizard-warn">${escapeHtml(options.echoPickerNote)}</p>` : ''}
      <div class="tower-wizard-picker-groups">${groupsHtml}</div>
    </div>`;
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new Dialog({
            title: `Change ${options.roleLabel}`,
            content,
            buttons: {
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => {
                        finish(null);
                        return true;
                    },
                },
            },
            default: 'cancel',
            close: () => finish(null),
            render: (htmlRaw) => {
                const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
                const dialogWidth = 760;
                const dialogHeight = 640;
                setTimeout(() => {
                    setupPowerCatalogDialogChrome(html, {
                        extraClasses: 'tower-wizard-power-picker-dialog',
                        initialWidth: dialogWidth,
                        initialHeight: dialogHeight,
                        minWidth: 560,
                        minHeight: 420,
                    });
                    const dialogEl = html.closest('.window-app.dialog');
                    // Reused wizard styling assumes a dark surface; force dark theme so the
                    // light Foundry theme does not wash out our light-on-dark cards.
                    dialogEl.removeClass('theme-light').addClass('themed theme-dark');
                }, 0);
                const pick = (el) => {
                    const templateId = String(el.data('template-id') || '');
                    if (!templateId)
                        return;
                    const specialRaw = el.attr('data-special');
                    const special = specialRaw === undefined || specialRaw === ''
                        ? null
                        : String(specialRaw);
                    finish({ templateId, special, rank: fixedRank });
                    dialog.close();
                };
                html.on('click', '.js-tw-picker-variant, .js-tw-picker-card', function () {
                    pick($(this));
                });
            },
        }, { width: 760, height: 640, resizable: true });
        dialog.render(true);
    });
}
//# sourceMappingURL=tower-wizard-power-picker.js.map