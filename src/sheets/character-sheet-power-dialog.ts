/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter matching plan §4:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / combined …)
 *   Stage 3: One of
 *     - Tier (3–6) + Special   [Actives only]
 *     - Template + free-text search     [everything else]
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle, the casting attribute (Intellect/Resolve),
 * and — when the resolution is a saveSpell — the Save type (body/mind/spirit),
 * all pre-filled from the template's `spellHints`. See plan §6.3.
 */

import type {
    ActiveSpecialTier,
    CastingAttribute,
    ChosenSpecial,
    EmbeddedPowerData,
    PowerCategory,
    PowerLevelKey,
    PowerSpecial,
    SpellResolution,
    SpellSaveType,
} from '../types/item.js';
import { renderRange, renderAoe, renderDuration, renderPowerLevelTable } from '../utils/power-rendering.js';
import {
    CATEGORY_LABELS,
    CATEGORY_ORDER,
    CREATION_POWER_REQUIREMENTS,
    filterCatalog,
    findCatalogEntryByName,
    findTemplateById,
    getSubfamiliesByCategory,
    type CatalogEntry,
} from '../utils/power-catalog.js';
import type { PowerTemplate } from '../utils/powers/templates/index.js';

/** How many powers of a given category the actor already owns. */
function countByCategory(actor: Actor): Record<PowerCategory, number> {
    const counts: Record<PowerCategory, number> = {
        active: 0,
        activeBuff: 0,
        movement: 0,
        reaction: 0,
        passive: 0,
    };
    const powers = (actor as any).items.filter((i: any) => i.type === 'power');
    for (const p of powers) {
        const sys = p.system || {};
        let cat: PowerCategory | undefined = sys.category;
        if (!cat) {
            const pt = sys.powerType;
            if (pt === 'buff') cat = 'activeBuff';
            else if (pt === 'utility') cat = 'active';
            else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement') cat = pt;
        }
        if (cat && cat in counts) counts[cat]++;
    }
    return counts;
}

/** Friendly label for a subfamily key. */
function labelSubfamily(key: string): string {
    return key
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}

/**
 * Show the template-based Power picker.
 */
export async function showPowerCreationDialog(
    actor: Actor,
    options?: { presetCategory?: PowerCategory },
): Promise<void> {
    const system = (actor as any).system;
    const creationComplete = system?.creation?.complete !== false;
    const masteryRank = system?.mastery?.rank || 2;
    const actorEchoKey = (system?.echo?.key as string | undefined) || null;
    const maxSpellLevel = masteryRank * 2;

    const categoryOptions = CATEGORY_ORDER.map(
        (c) => `<option value="${c}"${options?.presetCategory === c ? ' selected' : ''}>${CATEGORY_LABELS[c]}</option>`,
    ).join('');

    const rankOptions = Array.from({ length: 16 }, (_, i) => i + 1)
        .map((r) => `<option value="${r}">Rank ${r}</option>`)
        .join('');

    const content = `
    <form class="power-creation-form power-catalog-form">
      <div class="power-catalog-filters">
        <div class="form-group power-form-group">
          <label class="power-form-label">Category:</label>
          <select name="category" id="pc-category" class="power-form-select">
            <option value="">-- Any Category --</option>
            ${categoryOptions}
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Subfamily:</label>
          <select name="subfamily" id="pc-subfamily" class="power-form-select">
            <option value="">-- Any Subfamily --</option>
          </select>
        </div>
        <div class="form-group power-form-group pc-tier-group" style="display:none;">
          <label class="power-form-label">Tier:</label>
          <select name="tier" id="pc-tier" class="power-form-select">
            <option value="">-- Any Tier --</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
            <option value="5">Tier 5</option>
            <option value="6">Tier 6</option>
          </select>
        </div>
        <div class="form-group power-form-group pc-special-group" style="display:none;">
          <label class="power-form-label">Special:</label>
          <select name="special" id="pc-special" class="power-form-select">
            <option value="">-- Any Special --</option>
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Search:</label>
          <input type="text" id="pc-search" class="power-form-input" placeholder="Name contains…" />
        </div>
      </div>
      <div class="form-group power-form-group">
        <label class="power-form-label">Power:</label>
        <select name="power" id="pc-power" class="power-form-select power-catalog-select" size="10">
          <option value="">-- Select a Power --</option>
        </select>
        <div class="power-catalog-count" id="pc-count" style="font-size: 0.85em; color: #888; margin-top: 4px;"></div>
      </div>
      <div class="form-group power-details-group" id="pc-details" style="display: none;">
        <div id="pc-description" class="power-description-text"></div>
        <div id="pc-level-table" class="power-level-table-container"></div>
      </div>
      <div class="form-group power-form-group pc-spell-panel" id="pc-spell-panel" style="display:none; border:1px solid #555; padding:8px; border-radius:4px;">
        <label class="power-form-label power-form-checkbox-label">
          <input type="checkbox" id="pc-is-spell" class="power-form-checkbox" />
          <span><strong>Cast this Active as a Spell</strong></span>
        </label>
        <div class="pc-spell-fields" id="pc-spell-fields" style="display:none; margin-top:6px;">
          <div class="form-group">
            <label class="power-form-label">Casting Attribute:</label>
            <select id="pc-casting-attr" class="power-form-select">
              <option value="intellect">Intellect</option>
              <option value="resolve">Resolve</option>
            </select>
          </div>
          <div class="form-group">
            <label class="power-form-label">Resolution:</label>
            <select id="pc-resolution" class="power-form-select">
              <option value="spellAttack">Spell Attack (vs Evade)</option>
              <option value="saveSpell">Save Spell (vs Save DC)</option>
            </select>
          </div>
          <div class="form-group pc-save-group" style="display:none;">
            <label class="power-form-label">Save Type:</label>
            <select id="pc-save-type" class="power-form-select">
              <option value="body">Body</option>
              <option value="mind">Mind</option>
              <option value="spirit">Spirit</option>
            </select>
          </div>
        </div>
      </div>
      ${creationComplete ? `
      <div class="form-group power-form-group">
        <label class="power-form-label">Rank:</label>
        <select name="rank" id="pc-rank" class="power-form-select">
          ${rankOptions}
        </select>
      </div>
      ` : `
      <div class="form-group power-form-group">
        <label class="power-form-label">Rank:</label>
        <div class="power-form-static">Rank 1 <span style="color:#888;">(fixed during character creation)</span></div>
      </div>
      `}
    </form>
  `;

    const dialog = new Dialog({
        title: 'Add Power',
        content,
        buttons: {
            create: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Add',
                callback: async (htmlCb) => {
                    const $html = (htmlCb instanceof HTMLElement) ? $(htmlCb) : $(htmlCb as any);
                    const selectedName = $html.find('#pc-power').val() as string;
                    if (!selectedName) {
                        ui.notifications?.warn('Please select a power from the list');
                        return false;
                    }

                    const entry = findCatalogEntryByName(selectedName);
                    if (!entry) {
                        ui.notifications?.error('Power not found in catalog');
                        return false;
                    }

                    const rank = creationComplete
                        ? parseInt(($html.find('#pc-rank').val() as string) || '1')
                        : 1;

                    const isSpell = entry.category === 'active' && !!$html.find('#pc-is-spell').prop('checked');
                    const castingAttribute = isSpell
                        ? (($html.find('#pc-casting-attr').val() as CastingAttribute) || 'intellect')
                        : undefined;
                    const spellResolution = isSpell
                        ? (($html.find('#pc-resolution').val() as SpellResolution) || 'spellAttack')
                        : undefined;
                    const spellSaveType = isSpell && spellResolution === 'saveSpell'
                        ? (($html.find('#pc-save-type').val() as SpellSaveType) || 'body')
                        : undefined;

                    if (isSpell && rank > maxSpellLevel) {
                        ui.notifications?.error(
                            `Spell Level ${rank} exceeds Max Spell Level for this character (MR ${masteryRank} × 2 = ${maxSpellLevel}).`,
                        );
                        return false;
                    }

                    const itemData = buildItemDataFromEntry(entry, rank, { isSpell, castingAttribute, spellResolution, spellSaveType });
                    if (!itemData) {
                        ui.notifications?.error('Failed to construct power item data');
                        return false;
                    }

                    if (!creationComplete) {
                        const counts = countByCategory(actor);
                        const target = CREATION_POWER_REQUIREMENTS[entry.category];
                        if (counts[entry.category] >= target) {
                            ui.notifications?.error(
                                `You already have the maximum number of ${CATEGORY_LABELS[entry.category]} powers (${target}) for character creation.`,
                            );
                            return false;
                        }
                        if (rank > masteryRank) {
                            ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank} during character creation.`);
                            return false;
                        }
                    }

                    await (actor as any).createEmbeddedDocuments('Item', [itemData]);
                    ui.notifications?.info(`Created ${entry.name} (Rank ${rank})${isSpell ? ' as a Spell' : ''}`);
                    return true;
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel',
                callback: () => false,
            },
        },
        default: 'create',
        render: (htmlRaw: JQuery | HTMLElement) => {
            const html = (htmlRaw instanceof HTMLElement) ? $(htmlRaw) : $(htmlRaw);

            setTimeout(() => {
                const dialogElement = html.closest('.window-app.dialog');
                if (dialogElement.length) {
                    dialogElement.addClass('mastery-system power-creation-dialog power-catalog-dialog');
                    dialogElement.css({
                        height: 'auto',
                        'min-height': '300px',
                        'max-height': '90vh',
                        width: 'auto',
                        'min-width': '560px',
                        'max-width': '960px',
                    });
                    const contentElement = dialogElement.find('.window-content');
                    if (contentElement.length) {
                        contentElement.css({
                            height: 'auto',
                            'max-height': 'calc(90vh - 100px)',
                            'overflow-y': 'auto',
                        });
                    }
                }
            }, 0);

            const $categorySelect = html.find('#pc-category');
            const $subfamilySelect = html.find('#pc-subfamily');
            const $tierWrap = html.find('.pc-tier-group');
            const $tierSelect = html.find('#pc-tier');
            const $specialWrap = html.find('.pc-special-group');
            const $specialSelect = html.find('#pc-special');
            const $searchInput = html.find('#pc-search');
            const $powerSelect = html.find('#pc-power');
            const $details = html.find('#pc-details');
            const $description = html.find('#pc-description');
            const $levelTable = html.find('#pc-level-table');
            const $count = html.find('#pc-count');
            const $spellPanel = html.find('#pc-spell-panel');
            const $isSpell = html.find('#pc-is-spell');
            const $spellFields = html.find('#pc-spell-fields');
            const $castingAttr = html.find('#pc-casting-attr');
            const $resolution = html.find('#pc-resolution');
            const $saveGroup = html.find('.pc-save-group');
            const $saveType = html.find('#pc-save-type');

            const refreshSubfamilyDropdown = () => {
                const category = ($categorySelect.val() as string) || '';
                $subfamilySelect.empty();
                $subfamilySelect.append('<option value="">-- Any Subfamily --</option>');
                if (!category) return;
                for (const sub of getSubfamiliesByCategory(category as PowerCategory)) {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = labelSubfamily(sub);
                    $subfamilySelect.append(opt);
                }
            };

            const refreshActiveOnlyVisibility = () => {
                const category = ($categorySelect.val() as string) || '';
                const isActive = category === 'active';
                $tierWrap.toggle(isActive);
                $specialWrap.toggle(isActive);
                $spellPanel.toggle(isActive);
                if (!isActive) {
                    $tierSelect.val('');
                    $specialSelect.val('');
                    $isSpell.prop('checked', false);
                    $spellFields.hide();
                }
            };

            const refreshList = () => {
                const category = ($categorySelect.val() as string) || '';
                const subfamily = ($subfamilySelect.val() as string) || '';
                const tier = ($tierSelect.val() as string) || '';
                const special = ($specialSelect.val() as string) || '';
                const search = ($searchInput.val() as string) || '';

                const entries = filterCatalog({
                    category: (category || null) as PowerCategory | null,
                    subfamily: subfamily || null,
                    tier: (tier ? Number(tier) : null) as ActiveSpecialTier | null,
                    special: special || null,
                    search,
                    actorEchoKey,
                });

                $powerSelect.empty();
                if (entries.length === 0) {
                    $powerSelect.append('<option value="">-- No matching powers --</option>');
                } else {
                    $powerSelect.append('<option value="">-- Select a Power --</option>');
                    for (const e of entries) {
                        const badges: string[] = [];
                        if (e.tier) badges.push(`T${e.tier}`);
                        if (e.chosenSpecial) badges.push(e.chosenSpecial.key);
                        const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
                        const label = `${e.templateName}${badgeStr} · ${labelSubfamily(e.subfamily)} [${CATEGORY_LABELS[e.category]}]`;
                        const opt = document.createElement('option');
                        opt.value = e.name;
                        opt.textContent = label;
                        opt.dataset.templateId = e.templateId;
                        $powerSelect.append(opt);
                    }
                }
                $count.text(`${entries.length} power${entries.length === 1 ? '' : 's'} match the current filter`);
                $details.hide();
                $description.empty();
                $levelTable.empty();
            };

            const refreshSpellPanelDefaults = (template: PowerTemplate | undefined) => {
                if (!template || !template.spellHints) return;
                $resolution.val(template.spellHints.defaultResolution);
                if (template.spellHints.defaultSaveType) {
                    $saveType.val(template.spellHints.defaultSaveType);
                }
                const isSave = template.spellHints.defaultResolution === 'saveSpell' && !!template.spellHints.defaultSaveType;
                $saveGroup.toggle(isSave);
            };

            $categorySelect.on('change', () => {
                refreshSubfamilyDropdown();
                refreshActiveOnlyVisibility();
                refreshList();
            });
            $subfamilySelect.on('change', refreshList);
            $tierSelect.on('change', refreshList);
            $specialSelect.on('change', refreshList);
            $searchInput.on('input', refreshList);

            $isSpell.on('change', () => {
                $spellFields.toggle($isSpell.prop('checked') as boolean);
            });
            $resolution.on('change', () => {
                $saveGroup.toggle(($resolution.val() as string) === 'saveSpell');
            });

            $powerSelect.on('change', function () {
                const name = ($(this).val() as string) || '';
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
                refreshSpellPanelDefaults(template);
            });

            // Initial boot
            refreshSubfamilyDropdown();
            refreshActiveOnlyVisibility();
            refreshList();
        },
    });

    dialog.render(true);
}

/** Render the description + level table of a catalog entry into the dialog. */
function renderEntryDetails(entry: CatalogEntry, $description: JQuery, $levelTable: JQuery): void {
    const raw: any = entry.raw;
    $description.text(raw.description || raw.fluff || '');
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l: any) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger));
    } else {
        $levelTable.empty();
    }
}

/** Build the full item data object for `actor.createEmbeddedDocuments`. */
function buildItemDataFromEntry(
    entry: CatalogEntry,
    rank: number,
    spell: {
        isSpell: boolean;
        castingAttribute?: CastingAttribute;
        spellResolution?: SpellResolution;
        spellSaveType?: SpellSaveType;
    },
): any {
    const template = entry.raw as EmbeddedPowerData;
    const chosenSpecial: ChosenSpecial | undefined = entry.chosenSpecial
        ? { key: entry.chosenSpecial.key, tier: entry.chosenSpecial.tier }
        : undefined;

    const levelKey = (String(rank)) as PowerLevelKey;
    const levelRow = template.levels?.[levelKey];
    if (!levelRow) {
        ui.notifications?.error(`Rank ${rank} data not found for this power`);
        return null;
    }

    // If an Active has a chosenSpecial, bind the placeholder "SPECIAL" entry in
    // the levels to the chosen key (so the persisted item's levels reflect the
    // variation the user actually picked).
    let levels: Record<PowerLevelKey, any> = template.levels;
    if (chosenSpecial) {
        const next: Record<string, any> = {};
        for (const [k, row] of Object.entries(template.levels)) {
            const specials = (row.specials || []).map((s: PowerSpecial) => s.key === 'SPECIAL' ? { ...s, key: chosenSpecial.key } : s);
            next[k] = { ...row, specials };
        }
        levels = next as Record<PowerLevelKey, any>;
    }

    return {
        name: entry.name,
        type: 'power',
        system: {
            category: template.category,
            tags: template.tags || [],
            rank,
            level: rank,
            minLevel: 1,
            fluff: template.fluff || '',
            description: template.fluff || '',
            trigger: template.trigger || (levelRow as any).trigger || undefined,
            cost: {
                action: template.cost?.action,
                stones: template.cost?.stones || 0,
                charges: template.cost?.charges || 0,
            },
            roll: {
                kind: template.roll?.kind,
                attribute: template.roll?.attribute || undefined,
                vs: template.roll?.vs || undefined,
            },
            levels,

            // Template metadata
            templateId: entry.templateId,
            templateName: entry.templateName,
            subfamily: entry.subfamily,
            chosenSpecial,

            // Active-as-Spell (plan §6)
            isSpell: spell.isSpell,
            castingAttribute: spell.castingAttribute,
            spellResolution: spell.spellResolution,
            spellSaveType: spell.spellSaveType,

            // Legacy surface (kept so the rest of the UI keeps rendering)
            powerType: template.category === 'activeBuff' ? 'buff' : template.category,
            range: renderRange(levelRow.range),
            aoe: renderAoe(levelRow.aoe),
            duration: renderDuration(levelRow.duration),
            effect: levelRow.effect?.text || '',
            specials: (levelRow.specials || []).map((s: PowerSpecial) =>
                s.rank !== undefined ? `${s.key}(${s.rank})` : s.key,
            ),
            ap: 30,
        },
    };
}
