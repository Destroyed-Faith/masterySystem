/**
 * Tower Wizard — catalog power picker (filter by category, subfamily, special, search).
 */
import { renderPowerLevelTable } from '../../utils/power-rendering.js';
import { activeTemplateCanBeSpell, CATEGORY_LABELS, filterCatalog, findCatalogEntryByName, findTemplateById, getSubfamiliesByCategory, getVisibleSpecialOptions, powerIdentityKeyFromEntry, } from '../../utils/power-catalog.js';
import { setupPowerCatalogDialogChrome } from '../../utils/legacy-dialog-resize.js';
import { catalogEntryMatchesGrantKey, grantKeyCategory, grantKeyRank } from './tower-wizard-packages.js';
function labelSubfamily(key) {
    return key
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}
function entryHasRank(entry, rank) {
    const levels = entry.raw?.levels;
    return !!levels?.[String(rank)];
}
function renderEntryDetails(entry, $description, $levelTable) {
    const raw = entry.raw;
    $description.text(raw.description || raw.fluff || '');
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction'
            || Object.values(raw.levels).some((l) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger));
    }
    else {
        $levelTable.empty();
    }
}
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
export async function showTowerWizardPowerPicker(options) {
    const category = grantKeyCategory(options.grantKey);
    const fixedRank = grantKeyRank(options.grantKey);
    const content = `
    <form class="power-creation-form power-catalog-form tower-wizard-power-picker">
      <p class="tower-wizard-picker-intro">Choose a replacement <strong>${CATEGORY_LABELS[category]}</strong> for <strong>${options.roleLabel}</strong> (Rank ${fixedRank}). Only powers of this type are shown.</p>
      <div class="tower-wizard-picker-category-lock">
        <span class="tower-wizard-chip">${CATEGORY_LABELS[category]}</span>
        <span class="tower-wizard-picker-category-note">Category locked for this slot</span>
      </div>
      <div class="power-catalog-filters">
        <div class="form-group power-form-group" style="display:none">
          <label class="power-form-label">Category:</label>
          <select id="tw-pc-category" class="power-form-select" disabled>
            <option value="${category}">${CATEGORY_LABELS[category]}</option>
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Subfamily:</label>
          <select id="tw-pc-subfamily" class="power-form-select">
            <option value="">-- Any Subfamily --</option>
          </select>
        </div>
        <div class="form-group power-form-group pc-special-group" ${category === 'active' ? '' : 'style="display:none"'}>
          <label class="power-form-label">Special:</label>
          <select id="tw-pc-special" class="power-form-select">
            <option value="">-- Any Special --</option>
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Search:</label>
          <input type="text" id="tw-pc-search" class="power-form-input" placeholder="Name contains…" />
        </div>
      </div>
      <div class="form-group power-form-group power-catalog-select-group">
        <label class="power-form-label">Power:</label>
        <select id="tw-pc-power" class="power-form-select power-catalog-select">
          <option value="">-- Select a Power --</option>
        </select>
        <div class="power-catalog-count" id="tw-pc-count" style="font-size: 0.85em; color: #888; margin-top: 4px;"></div>
      </div>
      <div class="form-group power-details-group" id="tw-pc-details" style="display: none;">
        <div id="tw-pc-description" class="power-description-text"></div>
        <div id="tw-pc-level-table" class="power-level-table-container"></div>
      </div>
      <div class="form-group power-form-group pc-spell-panel" id="tw-pc-spell-panel" style="display:none; border:1px solid #555; padding:8px; border-radius:4px;">
        <label class="power-form-label power-form-checkbox-label">
          <input type="checkbox" id="tw-pc-is-spell" class="power-form-checkbox" />
          <span><strong>Cast this Active as a Spell</strong></span>
        </label>
        <div class="pc-spell-fields" id="tw-pc-spell-fields" style="display:none; margin-top:6px;">
          <div class="form-group">
            <label class="power-form-label">Casting Attribute:</label>
            <select id="tw-pc-casting-attr" class="power-form-select">
              <option value="intellect">Intellect</option>
              <option value="resolve">Resolve</option>
            </select>
          </div>
          <div class="form-group">
            <label class="power-form-label">Resolution:</label>
            <select id="tw-pc-resolution" class="power-form-select">
              <option value="spellAttack">Spell Attack (vs Evade)</option>
              <option value="saveSpell">Save Spell (vs Save DC)</option>
            </select>
          </div>
        </div>
      </div>
    </form>`;
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
                select: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Use this Power',
                    callback: (html) => {
                        const name = String(html.find('#tw-pc-power').val() || '');
                        if (!name) {
                            ui.notifications?.warn('Select a power from the list.');
                            return false;
                        }
                        const entry = findCatalogEntryByName(name);
                        if (!entry || !catalogEntryMatchesGrantKey(entry, options.grantKey)) {
                            ui.notifications?.error(`Select a ${CATEGORY_LABELS[category]} power for this slot.`);
                            return false;
                        }
                        if (!entryHasRank(entry, fixedRank)) {
                            ui.notifications?.error('Selected power is not available at this rank.');
                            return false;
                        }
                        const identity = powerIdentityKeyFromEntry(entry);
                        if (options.excludeIdentityKeys.has(identity)) {
                            ui.notifications?.error('That power is already used elsewhere in this package.');
                            return false;
                        }
                        const canSpell = category === 'active' && activeTemplateCanBeSpell(entry.templateId);
                        const isSpell = canSpell && html.find('#tw-pc-is-spell').prop('checked') === true;
                        finish({
                            templateId: entry.templateId,
                            special: entry.chosenSpecial?.key ?? null,
                            rank: fixedRank,
                            isSpell,
                            castingAttribute: isSpell
                                ? String(html.find('#tw-pc-casting-attr').val() || 'intellect')
                                : undefined,
                            spellResolution: isSpell
                                ? String(html.find('#tw-pc-resolution').val() || 'spellAttack')
                                : undefined,
                        });
                        return true;
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => {
                        finish(null);
                        return true;
                    },
                },
            },
            default: 'select',
            close: () => finish(null),
            render: (htmlRaw) => {
                const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => {
                    setupPowerCatalogDialogChrome(html, {
                        extraClasses: 'tower-wizard-power-picker-dialog',
                    });
                }, 0);
                const $subfamilySelect = html.find('#tw-pc-subfamily');
                const $specialSelect = html.find('#tw-pc-special');
                const $searchInput = html.find('#tw-pc-search');
                const $powerSelect = html.find('#tw-pc-power');
                const $details = html.find('#tw-pc-details');
                const $description = html.find('#tw-pc-description');
                const $levelTable = html.find('#tw-pc-level-table');
                const $count = html.find('#tw-pc-count');
                const $isSpell = html.find('#tw-pc-is-spell');
                const $spellFields = html.find('#tw-pc-spell-fields');
                const $spellPanel = html.find('#tw-pc-spell-panel');
                const refreshSpellPanel = (entry) => {
                    const canSpell = category === 'active' && !!entry && activeTemplateCanBeSpell(entry.templateId);
                    $spellPanel.toggle(canSpell);
                    if (!canSpell) {
                        $isSpell.prop('checked', false);
                        $spellFields.hide();
                    }
                };
                const refreshSubfamilyDropdown = () => {
                    $subfamilySelect.empty();
                    $subfamilySelect.append('<option value="">-- Any Subfamily --</option>');
                    for (const sub of getSubfamiliesByCategory(category)) {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = labelSubfamily(sub);
                        $subfamilySelect.append(opt);
                    }
                };
                const refreshSpecialDropdown = () => {
                    const subfamily = $subfamilySelect.val() || '';
                    const prev = $specialSelect.val() || '';
                    const opts = getVisibleSpecialOptions({
                        category,
                        subfamily: subfamily || null,
                        actorEchoKey: options.actorEchoKey ?? null,
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
                };
                const refreshList = () => {
                    const subfamily = $subfamilySelect.val() || '';
                    const special = $specialSelect.val() || '';
                    const search = $searchInput.val() || '';
                    const entries = filterCatalog({
                        category,
                        subfamily: subfamily || null,
                        special: special || null,
                        search,
                        actorEchoKey: options.actorEchoKey ?? null,
                    }).filter((e) => e.category === category && entryHasRank(e, fixedRank));
                    const available = entries.filter((e) => {
                        return !options.excludeIdentityKeys.has(powerIdentityKeyFromEntry(e));
                    });
                    $powerSelect.empty();
                    if (available.length === 0) {
                        $powerSelect.append('<option value="">-- No matching powers --</option>');
                    }
                    else {
                        $powerSelect.append('<option value="">-- Select a Power --</option>');
                        for (const e of available) {
                            const badges = [];
                            if (e.chosenSpecial)
                                badges.push(e.chosenSpecial.key);
                            const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
                            const label = `${e.templateName}${badgeStr} · ${labelSubfamily(e.subfamily)}`;
                            const opt = document.createElement('option');
                            opt.value = e.name;
                            opt.textContent = label;
                            if (options.currentTemplateId === e.templateId
                                && (options.currentSpecial ?? null) === (e.chosenSpecial?.key ?? null)) {
                                opt.selected = true;
                            }
                            $powerSelect.append(opt);
                        }
                    }
                    const skipped = entries.length - available.length;
                    $count.text(`${available.length} available${skipped > 0 ? ` (${skipped} already used in package)` : ''}`);
                    $details.hide();
                    refreshSpellPanel(undefined);
                };
                $subfamilySelect.on('change', () => {
                    refreshSpecialDropdown();
                    refreshList();
                });
                $specialSelect.on('change', refreshList);
                $searchInput.on('input', refreshList);
                $isSpell.on('change', () => {
                    $spellFields.toggle($isSpell.prop('checked') === true);
                });
                $powerSelect.on('change', function () {
                    const name = String($(this).val() || '');
                    if (!name) {
                        $details.hide();
                        refreshSpellPanel(undefined);
                        return;
                    }
                    const entry = findCatalogEntryByName(name);
                    if (!entry) {
                        $details.hide();
                        refreshSpellPanel(undefined);
                        return;
                    }
                    renderEntryDetails(entry, $description, $levelTable);
                    $details.show();
                    refreshSpellPanel(entry);
                    const template = findTemplateById(entry.templateId);
                    if (template?.spellHints?.defaultResolution) {
                        html.find('#tw-pc-resolution').val(template.spellHints.defaultResolution);
                    }
                });
                refreshSubfamilyDropdown();
                refreshSpecialDropdown();
                refreshList();
                if ($powerSelect.val())
                    $powerSelect.trigger('change');
            },
        }, { width: 920, height: 720, resizable: true });
        dialog.render(true);
    });
}
//# sourceMappingURL=tower-wizard-power-picker.js.map