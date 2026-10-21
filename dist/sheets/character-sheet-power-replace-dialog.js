/**
 * GM Power Replace dialog — pick a different catalog power of the same
 * category at the same level. Preserves startingPower / gmGranted / xpPurchased.
 */
import { castingBaseTnForMasteryRank } from '../combat/spell-roll-handler.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { renderCatalogSelectionDetailsHtml, renderPowerLevelTable, } from '../utils/power-rendering.js';
import { setupPowerCatalogDialogChrome } from '../utils/legacy-dialog-resize.js';
import { activeTemplateCanBeSpell, catalogSelectOptionLabel, collectOwnedPowerIdentityKeys, filterCatalog, findCatalogEntryByName, findTemplateById, getSubfamiliesByCategory, getVisibleSpecialOptions, labelPowerSubfamily, powerIdentityKeyFromEntry, powerSubfamilyHint, } from '../utils/power-catalog.js';
import { ACTIVE_UI_DELIVERIES, ACTIVE_UI_EFFECTS, labelActiveUiDelivery, labelActiveUiEffect, } from '../utils/power-purchase-ui-filters.js';
import { applyPowerReplace, describePowerReplaceConstraints, isNonReplaceableGrantedPower, } from '../utils/power-replace.js';
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderEntryDetails(entry, $description, $levelTable, selectedLevel = 1) {
    const raw = entry.raw;
    $description.html(renderCatalogSelectionDetailsHtml(entry, selectedLevel));
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger, entry.chosenSpecial?.key));
    }
    else {
        $levelTable.empty();
    }
}
/**
 * Open the GM replace picker for an embedded power item.
 * @returns true when a replacement was applied.
 */
export async function showPowerReplaceDialog(actor, powerItem) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can replace powers.');
        return false;
    }
    if (!powerItem || powerItem.type !== 'power') {
        ui.notifications?.error('Not a power item.');
        return false;
    }
    if (isNonReplaceableGrantedPower(powerItem)) {
        ui.notifications?.warn('Artifact- or Echo-granted powers cannot be catalog-replaced.');
        return false;
    }
    const constraints = describePowerReplaceConstraints(powerItem);
    if (!constraints) {
        ui.notifications?.error('Could not determine this power’s category.');
        return false;
    }
    const { category, categoryLabel, level } = constraints;
    const masteryRank = getRulesMasteryRank(actor);
    const system = actor.system;
    const actorEchoKey = system?.echo?.key || null;
    const actorSubChoiceKey = system?.echo?.subChoiceKey || null;
    const oldName = String(powerItem.name || 'Power');
    const wasSpell = powerItem.system?.isSpell === true;
    const oldCasting = powerItem.system?.castingAttribute || 'intellect';
    const isActiveCat = category === 'active';
    const isActiveBuffCat = category === 'activeBuff';
    const useKind = !isActiveCat && !isActiveBuffCat;
    const effectOptions = ACTIVE_UI_EFFECTS.map((k) => `<option value="${k}">${labelActiveUiEffect(k)}</option>`).join('');
    const deliveryOptions = ACTIVE_UI_DELIVERIES.map((k) => `<option value="${k}">${labelActiveUiDelivery(k)}</option>`).join('');
    const content = `
    <form class="power-creation-form power-catalog-form power-replace-form">
      <p class="power-replace-banner">
        Replace <strong>${escapeHtml(oldName)}</strong> with another
        <strong>${escapeHtml(categoryLabel)}</strong> at
        <strong>Level ${level}</strong>.
        Provenance (Startfähigkeit / GM / XP) and level stay the same — no XP change.
      </p>
      <div class="power-catalog-filters">
        <div class="form-group power-form-group power-filter-field" data-filter="category">
          <label class="power-form-label">Category</label>
          <input type="hidden" id="pr-category" value="${escapeHtml(category)}" />
          <span class="power-form-fixed-rank">${escapeHtml(categoryLabel)} <span class="power-form-hint">(locked)</span></span>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="level">
          <label class="power-form-label">Level</label>
          <span class="power-form-fixed-rank">Level ${level} <span class="power-form-hint">(same as slot)</span></span>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="kind" id="pr-kind-field"${useKind ? '' : ' hidden'}>
          <label class="power-form-label" for="pr-subfamily">Kind</label>
          <select name="subfamily" id="pr-subfamily" class="power-form-select">
            <option value="">-- Any kind --</option>
          </select>
          <p class="pc-subfamily-hint" id="pr-subfamily-hint" hidden></p>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="buff-focus" id="pr-buff-focus-field"${isActiveBuffCat ? '' : ' hidden'}>
          <label class="power-form-label" for="pr-buff-focus">Focus</label>
          <select name="buffFocus" id="pr-buff-focus" class="power-form-select">
            <option value="all" selected>All</option>
            <option value="defensive">Defensive</option>
            <option value="offensive">Offensive</option>
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="effect" id="pr-effect-field"${isActiveCat ? '' : ' hidden'}>
          <label class="power-form-label" for="pr-effect">Effect</label>
          <select name="effect" id="pr-effect" class="power-form-select">
            <option value="">-- Any Effect --</option>
            ${effectOptions}
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="delivery" id="pr-delivery-field"${isActiveCat ? '' : ' hidden'}>
          <label class="power-form-label" for="pr-delivery">Delivery</label>
          <select name="delivery" id="pr-delivery" class="power-form-select">
            <option value="">-- Any Delivery --</option>
            ${deliveryOptions}
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field pc-special-group" data-filter="special"${isActiveCat ? '' : ' hidden'}>
          <label class="power-form-label" for="pr-special">Special</label>
          <select name="special" id="pr-special" class="power-form-select">
            <option value="">-- Any Special --</option>
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="search">
          <label class="power-form-label" for="pr-search">Search</label>
          <input type="text" id="pr-search" class="power-form-input" placeholder="Name contains…" />
        </div>
      </div>
      <div class="form-group power-form-group power-catalog-select-group">
        <label class="power-form-label">Replacement:</label>
        <select name="power" id="pr-power" class="power-form-select power-catalog-select">
          <option value="">-- Select a Power --</option>
        </select>
        <div class="power-catalog-count" id="pr-count" style="font-size: 0.85em; color: #888; margin-top: 4px;"></div>
      </div>
      <div class="form-group power-details-group" id="pr-details" style="display: none;">
        <div id="pr-description" class="power-description-text"></div>
        <div id="pr-level-table" class="power-level-table-container"></div>
      </div>
      <div class="form-group power-form-group pc-spell-panel" id="pr-spell-panel" style="display:none; border:1px solid #555; padding:8px; border-radius:4px;">
        <label class="power-form-label power-form-checkbox-label">
          <input type="checkbox" id="pr-is-spell" class="power-form-checkbox"${wasSpell ? ' checked' : ''} />
          <span><strong>Cast this Active as a Spell</strong></span>
        </label>
        <div class="pc-spell-fields" id="pr-spell-fields" style="display:none; margin-top:6px;">
          <div class="form-group">
            <label class="power-form-label">Casting Attribute:</label>
            <select id="pr-casting-attr" class="power-form-select">
              <option value="intellect"${oldCasting === 'intellect' ? ' selected' : ''}>Intellect</option>
              <option value="resolve"${oldCasting === 'resolve' ? ' selected' : ''}>Resolve</option>
            </select>
          </div>
          <div class="form-group">
            <label class="power-form-label">Resolution:</label>
            <select id="pr-resolution" class="power-form-select">
              <option value="spellAttack">Spell Attack (caster roll vs TN)</option>
            </select>
          </div>
          <div class="form-group pc-spell-rules-wrap">
            <p class="pc-spell-rules-hint" id="pr-spell-rules-hint"></p>
          </div>
        </div>
      </div>
    </form>
  `;
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const dialog = new Dialog({
            title: `Replace Power — ${categoryLabel} L${level}`,
            content,
            buttons: {
                replace: {
                    icon: '<i class="fas fa-right-left"></i>',
                    label: 'Replace (0 XP)',
                    callback: async (htmlCb) => {
                        const $html = htmlCb instanceof HTMLElement ? $(htmlCb) : $(htmlCb);
                        const selectedName = $html.find('#pr-power').val();
                        if (!selectedName) {
                            ui.notifications?.warn('Please select a replacement power.');
                            return false;
                        }
                        const entry = findCatalogEntryByName(selectedName);
                        if (!entry) {
                            ui.notifications?.error('Power not found in catalog.');
                            return false;
                        }
                        const isSpell = entry.category === 'active' &&
                            activeTemplateCanBeSpell(entry.templateId) &&
                            !!$html.find('#pr-is-spell').prop('checked');
                        const castingAttribute = isSpell
                            ? ($html.find('#pr-casting-attr').val() || 'intellect')
                            : undefined;
                        const spellResolution = isSpell
                            ? ($html.find('#pr-resolution').val() || 'spellAttack')
                            : undefined;
                        const result = await applyPowerReplace(actor, powerItem, entry, {
                            isSpell,
                            castingAttribute,
                            spellResolution,
                        });
                        if (!result.ok) {
                            ui.notifications?.error(result.error);
                            return false;
                        }
                        ui.notifications?.info(`Replaced "${result.oldName}" → "${result.newName}" (${result.categoryLabel} Level ${result.level}, 0 XP).`);
                        finish(true);
                        return true;
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => {
                        finish(false);
                        return false;
                    },
                },
            },
            default: 'replace',
            close: () => finish(false),
            render: (htmlRaw) => {
                const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => setupPowerCatalogDialogChrome(html), 0);
                const $subfamilySelect = html.find('#pr-subfamily');
                const $buffFocusSelect = html.find('#pr-buff-focus');
                const $effectSelect = html.find('#pr-effect');
                const $deliverySelect = html.find('#pr-delivery');
                const $specialSelect = html.find('#pr-special');
                const $searchInput = html.find('#pr-search');
                const $powerSelect = html.find('#pr-power');
                const $details = html.find('#pr-details');
                const $description = html.find('#pr-description');
                const $levelTable = html.find('#pr-level-table');
                const $count = html.find('#pr-count');
                const $spellPanel = html.find('#pr-spell-panel');
                const $isSpell = html.find('#pr-is-spell');
                const $spellFields = html.find('#pr-spell-fields');
                const $spellHint = html.find('#pr-spell-rules-hint');
                const refreshSubfamilyDropdown = () => {
                    $subfamilySelect.empty();
                    $subfamilySelect.append('<option value="">-- Any kind --</option>');
                    if (!useKind)
                        return;
                    for (const sub of getSubfamiliesByCategory(category)) {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = labelPowerSubfamily(sub);
                        $subfamilySelect.append(opt);
                    }
                };
                const refreshSubfamilyHint = () => {
                    const $hint = html.find('#pr-subfamily-hint');
                    const sub = $subfamilySelect.val() || '';
                    const hint = useKind ? powerSubfamilyHint(sub) : '';
                    $hint.text(hint);
                    $hint.prop('hidden', !hint);
                };
                const refreshSpellEligibility = (entry) => {
                    const canSpell = category === 'active' && !!entry && activeTemplateCanBeSpell(entry.templateId);
                    $spellPanel.toggle(canSpell);
                    if (!canSpell) {
                        $isSpell.prop('checked', false);
                        $spellFields.hide();
                    }
                    else if ($isSpell.prop('checked')) {
                        $spellFields.show();
                    }
                };
                const refreshSpecialDropdown = () => {
                    if (category !== 'active') {
                        $specialSelect.empty();
                        $specialSelect.append('<option value="">-- Any Special --</option>');
                        return;
                    }
                    const uiEffect = $effectSelect.val() || '';
                    const uiDelivery = $deliverySelect.val() || '';
                    const prev = $specialSelect.val() || '';
                    const opts = getVisibleSpecialOptions({
                        category,
                        subfamily: null,
                        uiEffect: uiEffect || null,
                        uiDelivery: uiDelivery || null,
                        actorEchoKey,
                        actorSubChoiceKey,
                    });
                    $specialSelect.empty();
                    $specialSelect.append('<option value="">-- Any Special --</option>');
                    for (const o of opts) {
                        const opt = document.createElement('option');
                        opt.value = o.key;
                        opt.textContent = o.label;
                        $specialSelect.append(opt);
                    }
                    if (prev && opts.some((o) => o.key === prev))
                        $specialSelect.val(prev);
                    else
                        $specialSelect.val('');
                };
                const updateSpellHint = () => {
                    if (!$spellHint.length)
                        return;
                    const powerName = $powerSelect.val() || '';
                    const ent = powerName ? findCatalogEntryByName(powerName) : undefined;
                    const showSpell = $isSpell.prop('checked') === true &&
                        category === 'active' &&
                        !!ent &&
                        activeTemplateCanBeSpell(ent.templateId);
                    if (!showSpell) {
                        $spellHint.text('');
                        return;
                    }
                    const castingTn = castingBaseTnForMasteryRank(masteryRank);
                    $spellHint.html(`<strong>Spell attack:</strong> Roll casting attribute vs <strong>Casting TN ${castingTn}</strong> ` +
                        `(Mastery Rank ${masteryRank}).`);
                };
                const appendPowerOptions = (available) => {
                    $powerSelect.empty();
                    if (available.length === 0) {
                        $powerSelect.append('<option value="">-- No powers match these filters — try clearing Focus, Effect, Delivery, Special, or Search --</option>');
                        return;
                    }
                    $powerSelect.append('<option value="">-- Select a Power --</option>');
                    for (const e of available) {
                        const opt = document.createElement('option');
                        opt.value = e.name;
                        opt.textContent = catalogSelectOptionLabel(e);
                        $powerSelect.append(opt);
                    }
                };
                const refreshList = () => {
                    const subfamily = useKind ? ($subfamilySelect.val() || '') : '';
                    const uiEffect = isActiveCat ? ($effectSelect.val() || '') : '';
                    const uiDelivery = isActiveCat ? ($deliverySelect.val() || '') : '';
                    const special = isActiveCat ? ($specialSelect.val() || '') : '';
                    const buffFocus = isActiveBuffCat
                        ? ($buffFocusSelect.val() || 'all')
                        : '';
                    const search = $searchInput.val() || '';
                    const entries = filterCatalog({
                        category,
                        subfamily: subfamily || null,
                        uiEffect: uiEffect || null,
                        uiDelivery: uiDelivery || null,
                        uiActiveBuffFocus: buffFocus && buffFocus !== 'all' ? buffFocus : null,
                        special: special || null,
                        search,
                        actorEchoKey,
                        actorSubChoiceKey,
                    }).filter((e) => {
                        const levels = e.raw?.levels;
                        return levels && levels[String(level)];
                    });
                    const otherPowers = actor.items.filter((i) => i.type === 'power' && i.id !== powerItem.id);
                    const ownedKeys = collectOwnedPowerIdentityKeys(otherPowers);
                    const available = entries.filter((e) => !ownedKeys.has(powerIdentityKeyFromEntry(e)));
                    appendPowerOptions(available);
                    const skipped = entries.length - available.length;
                    if (available.length === 0) {
                        $count.text(entries.length === 0
                            ? 'No powers match these filters. Clear Effect, Delivery, Special, or Search.'
                            : `No available powers (${entries.length} match filters but are already on this character).`);
                    }
                    else {
                        const base = `${available.length} available`;
                        const suffix = skipped > 0
                            ? ` (${skipped} already on character)`
                            : ` (${entries.length} match filter)`;
                        $count.text(`${base}${suffix}`);
                    }
                    $details.hide();
                    $description.empty();
                    $levelTable.empty();
                    updateSpellHint();
                };
                $subfamilySelect.on('change', () => {
                    refreshSubfamilyHint();
                    refreshSpecialDropdown();
                    refreshList();
                });
                $buffFocusSelect.on('change', refreshList);
                $effectSelect.on('change', () => {
                    refreshSpecialDropdown();
                    refreshList();
                });
                $deliverySelect.on('change', () => {
                    refreshSpecialDropdown();
                    refreshList();
                });
                $specialSelect.on('change', refreshList);
                $searchInput.on('input', refreshList);
                $isSpell.on('change', () => {
                    $spellFields.toggle($isSpell.prop('checked'));
                    updateSpellHint();
                });
                $powerSelect.on('change', function () {
                    const name = $(this).val() || '';
                    if (!name) {
                        $details.hide();
                        refreshSpellEligibility(undefined);
                        return;
                    }
                    const entry = findCatalogEntryByName(name);
                    if (!entry) {
                        $details.hide();
                        refreshSpellEligibility(undefined);
                        return;
                    }
                    renderEntryDetails(entry, $description, $levelTable, level);
                    $details.show();
                    refreshSpellEligibility(entry);
                    const template = findTemplateById(entry.templateId);
                    if (template?.spellHints) {
                        html.find('#pr-resolution').val(template.spellHints.defaultResolution);
                    }
                    updateSpellHint();
                });
                refreshSubfamilyDropdown();
                refreshSubfamilyHint();
                if (!isActiveCat) {
                    $specialSelect.val('');
                    if (!wasSpell) {
                        $isSpell.prop('checked', false);
                        $spellFields.hide();
                        $spellPanel.hide();
                    }
                }
                refreshSpecialDropdown();
                refreshList();
                if (wasSpell && category === 'active') {
                    $spellFields.toggle(true);
                }
                updateSpellHint();
            },
        }, { width: 920, height: 720, resizable: true, classes: ['mastery-system', 'power-replace-dialog'] });
        dialog.render(true);
    });
}
//# sourceMappingURL=character-sheet-power-replace-dialog.js.map