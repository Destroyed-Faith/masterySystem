/**
 * Tower Wizard — catalog power picker (filter by category, subfamily, special, search).
 */

import type { CastingAttribute, PowerCategory, SpellResolution } from '../../types/item.js';
import { renderPowerLevelTable } from '../../utils/power-rendering.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import {
    CATEGORY_LABELS,
    filterCatalog,
    findCatalogEntryByName,
    findTemplateById,
    getSubfamiliesByCategory,
    getVisibleSpecialOptions,
    powerIdentityKeyFromEntry,
    type CatalogEntry,
} from '../../utils/power-catalog.js';
import type { PackageGrantKey } from './tower-wizard-types.js';
import { catalogEntryMatchesGrantKey, grantKeyCategory, grantKeyRank } from './tower-wizard-packages.js';

export interface TowerWizardPowerPickerResult {
    templateId: string;
    special?: string | null;
    rank: number;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}

function labelSubfamily(key: string): string {
    return key
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}

function entryHasRank(entry: CatalogEntry, rank: number): boolean {
    const levels = (entry.raw as { levels?: Record<string, unknown> })?.levels;
    return !!levels?.[String(rank)];
}

function renderEntryDetails(entry: CatalogEntry, $description: JQuery, $levelTable: JQuery): void {
    const raw = entry.raw as {
        description?: string;
        fluff?: string;
        category?: string;
        levels?: Record<string, { trigger?: string }>;
    };
    $description.text(raw.description || raw.fluff || '');
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction'
            || Object.values(raw.levels).some((l) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels as Parameters<typeof renderPowerLevelTable>[0], showTrigger));
    } else {
        $levelTable.empty();
    }
}

export function catalogPickerResultToGrantSpec(result: TowerWizardPowerPickerResult): PowerGrantSpec {
    return {
        templateId: result.templateId,
        rank: result.rank,
        special: result.special ?? null,
        isSpell: result.isSpell,
        castingAttribute: result.castingAttribute,
        spellResolution: result.spellResolution,
    };
}

export async function showTowerWizardPowerPicker(options: {
    grantKey: PackageGrantKey;
    roleLabel: string;
    excludeIdentityKeys: Set<string>;
    actorEchoKey?: string | null;
    currentTemplateId?: string;
    currentSpecial?: string | null;
}): Promise<TowerWizardPowerPickerResult | null> {
    const category = grantKeyCategory(options.grantKey);
    const fixedRank = grantKeyRank(options.grantKey);
    const showSpellPanel = category === 'active';

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
        <div class="form-group power-form-group pc-special-group" ${showSpellPanel ? '' : 'style="display:none"'}>
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
      <div class="form-group power-form-group">
        <label class="power-form-label">Power:</label>
        <select id="tw-pc-power" class="power-form-select power-catalog-select" size="10">
          <option value="">-- Select a Power --</option>
        </select>
        <div class="power-catalog-count" id="tw-pc-count" style="font-size: 0.85em; color: #888; margin-top: 4px;"></div>
      </div>
      <div class="form-group power-details-group" id="tw-pc-details" style="display: none;">
        <div id="tw-pc-description" class="power-description-text"></div>
        <div id="tw-pc-level-table" class="power-level-table-container"></div>
      </div>
      <div class="form-group power-form-group pc-spell-panel" id="tw-pc-spell-panel" style="${showSpellPanel ? '' : 'display:none'}; border:1px solid #555; padding:8px; border-radius:4px;">
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
        const finish = (value: TowerWizardPowerPickerResult | null) => {
            if (settled) return;
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
                    callback: (html: JQuery) => {
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
                        const isSpell = showSpellPanel && html.find('#tw-pc-is-spell').prop('checked') === true;
                        finish({
                            templateId: entry.templateId,
                            special: entry.chosenSpecial?.key ?? null,
                            rank: fixedRank,
                            isSpell,
                            castingAttribute: isSpell
                                ? (String(html.find('#tw-pc-casting-attr').val() || 'intellect') as CastingAttribute)
                                : undefined,
                            spellResolution: isSpell
                                ? (String(html.find('#tw-pc-resolution').val() || 'spellAttack') as SpellResolution)
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
            render: (htmlRaw: JQuery | HTMLElement) => {
                const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => {
                    const dialogElement = html.closest('.window-app.dialog');
                    if (dialogElement.length) {
                        dialogElement.addClass('mastery-system power-creation-dialog power-catalog-dialog tower-wizard-power-picker-dialog');
                        dialogElement.css({
                            width: 'auto',
                            'min-width': '640px',
                            'max-width': '980px',
                        });
                    }
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
                    const subfamily = ($subfamilySelect.val() as string) || '';
                    const prev = ($specialSelect.val() as string) || '';
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
                    if (prev && opts.some((o) => o.key === prev)) $specialSelect.val(prev);
                };

                const refreshList = () => {
                    const subfamily = ($subfamilySelect.val() as string) || '';
                    const special = ($specialSelect.val() as string) || '';
                    const search = ($searchInput.val() as string) || '';

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
                    } else {
                        $powerSelect.append('<option value="">-- Select a Power --</option>');
                        for (const e of available) {
                            const badges: string[] = [];
                            if (e.chosenSpecial) badges.push(e.chosenSpecial.key);
                            const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
                            const label = `${e.templateName}${badgeStr} · ${labelSubfamily(e.subfamily)}`;
                            const opt = document.createElement('option');
                            opt.value = e.name;
                            opt.textContent = label;
                            if (
                                options.currentTemplateId === e.templateId
                                && (options.currentSpecial ?? null) === (e.chosenSpecial?.key ?? null)
                            ) {
                                opt.selected = true;
                            }
                            $powerSelect.append(opt);
                        }
                    }
                    const skipped = entries.length - available.length;
                    $count.text(
                        `${available.length} available${skipped > 0 ? ` (${skipped} already used in package)` : ''}`,
                    );
                    $details.hide();
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
                        return;
                    }
                    const entry = findCatalogEntryByName(name);
                    if (!entry) {
                        $details.hide();
                        return;
                    }
                    renderEntryDetails(entry, $description, $levelTable);
                    $details.show();
                    const template = findTemplateById(entry.templateId);
                    if (template?.spellHints?.defaultResolution) {
                        html.find('#tw-pc-resolution').val(template.spellHints.defaultResolution);
                    }
                });

                refreshSubfamilyDropdown();
                refreshSpecialDropdown();
                refreshList();
                if ($powerSelect.val()) $powerSelect.trigger('change');
            },
        }, { width: 720 });

        dialog.render(true);
    });
}
