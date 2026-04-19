/**
 * Power Creation Dialog for Character Sheet
 *
 * Unified picker for Mastery Tree Powers and Spell School Powers.
 * The list is filterable by:
 *   - Category (Active, Active Buff, Movement, Reaction, Passive, Utility)
 *   - Tag (e.g. "spell") – only when Category = Active
 *   - Special (e.g. Ignite, Freeze, Shock, Penetration, …) – only when Category = Active
 *   - Free text search (name / tree / school)
 *
 * During character creation, every newly added power is stored at rank 1.
 */
import { renderRange, renderAoe, renderDuration, renderPowerLevelTable } from '../utils/power-rendering.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, CREATION_POWER_REQUIREMENTS, filterCatalog, findCatalogEntryByName, getAllSourceNames, getAllSpecialOptions, getVisibleSpecialOptions, getVisibleEffectTypeOptions } from '../utils/power-catalog.js';
/** Check if a power uses the new structure. */
function isNewPowerStructure(power) {
    return power && typeof power === 'object' && 'category' in power && 'levels' in power && typeof power.levels === 'object' && !Array.isArray(power.levels);
}
/** How many powers of a given category the actor already owns. */
function countByCategory(actor) {
    const counts = {
        active: 0,
        activeBuff: 0,
        movement: 0,
        reaction: 0,
        passive: 0
    };
    const powers = actor.items.filter((i) => i.type === 'power');
    for (const p of powers) {
        const sys = p.system || {};
        let cat = sys.category;
        if (!cat) {
            const pt = sys.powerType;
            if (pt === 'buff')
                cat = 'activeBuff';
            else if (pt === 'utility')
                cat = 'active';
            else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement')
                cat = pt;
        }
        if (cat && cat in counts)
            counts[cat]++;
    }
    return counts;
}
/**
 * Show the unified power creation dialog.
 *
 * @param actor - The actor to add a power to.
 * @param options - Optional preset for the category filter (e.g. when called from "Add Reaction").
 */
export async function showPowerCreationDialog(actor, options) {
    const system = actor.system;
    const creationComplete = system?.creation?.complete !== false;
    const masteryRank = system?.mastery?.rank || 2;
    const actorEchoKey = system?.echo?.key || null;
    // Build filter UI options
    const categoryOptions = CATEGORY_ORDER.map(c => `<option value="${c}"${options?.presetCategory === c ? ' selected' : ''}>${CATEGORY_LABELS[c]}</option>`).join('');
    const specialOptions = getAllSpecialOptions()
        .map(s => `<option value="${s.key}">${s.label}</option>`)
        .join('');
    const treeOptions = getAllSourceNames()
        .map(n => `<option value="${n}">${n}</option>`)
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
          <label class="power-form-label">Tree:</label>
          <select name="tree" id="pc-tree" class="power-form-select">
            <option value="">-- Any Tree --</option>
            ${treeOptions}
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Special:</label>
          <select name="special" id="pc-special" class="power-form-select">
            <option value="">-- Any Special --</option>
            ${specialOptions}
          </select>
        </div>
        <div class="form-group power-form-group">
          <label class="power-form-label">Effect Type:</label>
          <select name="effectType" id="pc-effect-type" class="power-form-select">
            <option value="">-- Any Effect Type --</option>
          </select>
        </div>
        <div class="form-group power-form-group pc-spell-group">
          <label class="power-form-label power-form-checkbox-label">
            <input type="checkbox" id="pc-spell" class="power-form-checkbox" />
            <span>Spell only</span>
          </label>
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
      ${creationComplete ? `
      <div class="form-group power-form-group">
        <label class="power-form-label">Rank:</label>
        <select name="rank" id="pc-rank" class="power-form-select">
          <option value="1">Rank 1</option>
          <option value="2">Rank 2</option>
          <option value="3">Rank 3</option>
          <option value="4">Rank 4</option>
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
                    const $html = (htmlCb instanceof HTMLElement) ? $(htmlCb) : $(htmlCb);
                    const selectedName = $html.find('#pc-power').val();
                    if (!selectedName) {
                        ui.notifications?.warn('Please select a power from the list');
                        return false;
                    }
                    // The <option> carries sourceKind + sourceName so we resolve unambiguously.
                    const $opt = $html.find(`#pc-power option[value="${CSS.escape(selectedName)}"]:selected`);
                    const sourceKind = $opt.data('source-kind') || undefined;
                    const sourceName = $opt.data('source-name') || undefined;
                    const entry = findCatalogEntryByName(selectedName, sourceKind, sourceName);
                    if (!entry) {
                        ui.notifications?.error('Power not found in catalog');
                        return false;
                    }
                    // During character creation every power is bought at Rank 2 so
                    // it is immediately usable at the starting Mastery Rank of 2.
                    // Post-creation the player can pick a rank via the dialog.
                    const rank = creationComplete
                        ? parseInt($html.find('#pc-rank').val() || '1')
                        : 2;
                    // Build item data from catalog entry
                    const itemData = buildItemDataFromEntry(entry, rank);
                    if (!itemData) {
                        ui.notifications?.error('Failed to construct power item data');
                        return false;
                    }
                    if (!creationComplete) {
                        const counts = countByCategory(actor);
                        const target = CREATION_POWER_REQUIREMENTS[entry.category];
                        if (counts[entry.category] >= target) {
                            ui.notifications?.error(`You already have the maximum number of ${CATEGORY_LABELS[entry.category]} powers (${target}) for character creation.`);
                            return false;
                        }
                        if (rank > masteryRank) {
                            ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank} during character creation.`);
                            return false;
                        }
                    }
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    const sourceType = entry.sourceKind === 'magic' ? 'Spell School' : 'Mastery Tree';
                    ui.notifications?.info(`Created power: ${entry.name} (Rank ${rank}) from ${entry.sourceName} ${sourceType}`);
                    return true;
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel',
                callback: () => false
            }
        },
        default: 'create',
        render: (htmlRaw) => {
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
                        'max-width': '960px'
                    });
                    const contentElement = dialogElement.find('.window-content');
                    if (contentElement.length) {
                        contentElement.css({
                            height: 'auto',
                            'max-height': 'calc(90vh - 100px)',
                            'overflow-y': 'auto'
                        });
                    }
                }
            }, 0);
            const $categorySelect = html.find('#pc-category');
            const $treeSelect = html.find('#pc-tree');
            const $spellCheckbox = html.find('#pc-spell');
            const $specialSelect = html.find('#pc-special');
            const $effectTypeSelect = html.find('#pc-effect-type');
            const $powerSelect = html.find('#pc-power');
            const $details = html.find('#pc-details');
            const $description = html.find('#pc-description');
            const $levelTable = html.find('#pc-level-table');
            const $count = html.find('#pc-count');
            const refreshEffectTypeDropdown = () => {
                const category = $categorySelect.val() || '';
                const spellOnly = $spellCheckbox.prop('checked') === true;
                const currentEffect = $effectTypeSelect.val() || '';
                const visible = getVisibleEffectTypeOptions({
                    category: (category || null),
                    tag: spellOnly ? 'spell' : null,
                    actorEchoKey,
                });
                const nextSelection = visible.some(v => v.key === currentEffect) ? currentEffect : '';
                $effectTypeSelect.empty();
                $effectTypeSelect.append('<option value="">-- Any Effect Type --</option>');
                for (const v of visible) {
                    const opt = document.createElement('option');
                    opt.value = v.key;
                    opt.textContent = v.label;
                    $effectTypeSelect.append(opt);
                }
                $effectTypeSelect.val(nextSelection);
            };
            const refreshSpecialDropdown = () => {
                const category = $categorySelect.val() || '';
                const spellOnly = $spellCheckbox.prop('checked') === true;
                const currentSpecial = $specialSelect.val() || '';
                const visible = getVisibleSpecialOptions({
                    category: (category || null),
                    tag: spellOnly ? 'spell' : null,
                    actorEchoKey,
                });
                // Preserve the current selection if it is still available,
                // otherwise reset to "any". Also always include the "Any" entry.
                const nextSelection = visible.some(v => v.key === currentSpecial) ? currentSpecial : '';
                $specialSelect.empty();
                $specialSelect.append('<option value="">-- Any Special --</option>');
                for (const v of visible) {
                    const opt = document.createElement('option');
                    opt.value = v.key;
                    opt.textContent = v.label;
                    $specialSelect.append(opt);
                }
                $specialSelect.val(nextSelection);
            };
            const refreshList = () => {
                const category = $categorySelect.val() || '';
                const tree = $treeSelect.val() || '';
                const spellOnly = $spellCheckbox.prop('checked') === true;
                const special = $specialSelect.val() || '';
                const effectType = $effectTypeSelect.val() || '';
                const entries = filterCatalog({
                    category: (category || null),
                    tag: spellOnly ? 'spell' : null,
                    special: special || null,
                    effectType: effectType || null,
                    sourceName: tree || null,
                    actorEchoKey
                });
                $powerSelect.empty();
                if (entries.length === 0) {
                    $powerSelect.append('<option value="">-- No matching powers --</option>');
                }
                else {
                    $powerSelect.append('<option value="">-- Select a Power --</option>');
                    for (const e of entries) {
                        // Show tags + specials in parens so the player can
                        // scan e.g. "Cinder Cleave (Ignite) · Ashguard
                        // [Active]" at a glance. Tags come first (they're the
                        // broader descriptor like "spell"/"melee"/"fire"),
                        // specials next. Deduplicated and capitalized for
                        // readability.
                        const badges = [];
                        const seen = new Set();
                        const push = (raw) => {
                            const k = raw.trim().toLowerCase();
                            if (!k || seen.has(k))
                                return;
                            seen.add(k);
                            badges.push(k.charAt(0).toUpperCase() + k.slice(1));
                        };
                        for (const t of e.tags)
                            push(t);
                        for (const s of e.specialKeys)
                            push(s);
                        const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
                        const label = `${e.name}${badgeStr} · ${e.sourceName} [${CATEGORY_LABELS[e.category]}]`;
                        const opt = document.createElement('option');
                        opt.value = e.name;
                        opt.textContent = label;
                        opt.dataset.sourceKind = e.sourceKind;
                        opt.dataset.sourceName = e.sourceName;
                        $powerSelect.append(opt);
                    }
                }
                $count.text(`${entries.length} power${entries.length === 1 ? '' : 's'} match the current filter`);
                $details.hide();
                $description.empty();
                $levelTable.empty();
            };
            $categorySelect.on('change', () => {
                refreshSpecialDropdown();
                refreshEffectTypeDropdown();
                refreshList();
            });
            $spellCheckbox.on('change', () => {
                refreshSpecialDropdown();
                refreshEffectTypeDropdown();
                refreshList();
            });
            $treeSelect.on('change', refreshList);
            $specialSelect.on('change', refreshList);
            $effectTypeSelect.on('change', refreshList);
            $powerSelect.on('change', function () {
                const name = $(this).val() || '';
                if (!name) {
                    $details.hide();
                    return;
                }
                const $opt = $powerSelect.find(`option[value="${CSS.escape(name)}"]:selected`);
                const sourceKind = $opt.data('source-kind') || undefined;
                const sourceName = $opt.data('source-name') || undefined;
                const entry = findCatalogEntryByName(name, sourceKind, sourceName);
                if (!entry) {
                    $details.hide();
                    return;
                }
                renderEntryDetails(entry, $description, $levelTable);
                $details.show();
            });
            // Initial render: populate Specials and Effect-Type selects for the
            // current (preset) filter so empty categories are hidden from the start.
            refreshSpecialDropdown();
            refreshEffectTypeDropdown();
            refreshList();
        }
    });
    dialog.render(true);
}
/** Render the description + level table of a catalog entry into the dialog. */
function renderEntryDetails(entry, $description, $levelTable) {
    const raw = entry.raw;
    $description.text(raw.description || '');
    if (isNewPowerStructure(raw) && raw.levels) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger));
    }
    else if (Array.isArray(raw.levels)) {
        let levelInfo = '<strong>Available Levels:</strong><br>';
        for (const lvl of raw.levels) {
            levelInfo += `Level ${lvl.level}: ${lvl.type || ''} – ${lvl.effect || ''}`;
            if (lvl.special && lvl.special !== '—' && lvl.special !== '') {
                levelInfo += ` (${lvl.special})`;
            }
            levelInfo += '<br>';
        }
        $levelTable.html(levelInfo);
    }
    else {
        $levelTable.empty();
    }
}
/** Build the full item data object for an actor.createEmbeddedDocuments call. */
function buildItemDataFromEntry(entry, rank) {
    const isMastery = entry.sourceKind === 'mastery';
    const power = entry.raw;
    if (isNewPowerStructure(power)) {
        const levelRow = power.levels[rank.toString()];
        if (!levelRow) {
            ui.notifications?.error(`Rank ${rank} data not found for this power`);
            return null;
        }
        return {
            name: power.name,
            type: 'power',
            system: {
                tree: entry.sourceName,
                isMagicPower: !isMastery,
                category: power.category,
                tags: power.tags || [],
                rank,
                description: power.description || '',
                fluff: power.fluff || '',
                trigger: power.trigger || levelRow.trigger || undefined,
                cost: {
                    action: power.cost?.action,
                    stones: power.cost?.stones || 0,
                    charges: power.cost?.charges || 0,
                    note: power.cost?.note || undefined
                },
                roll: {
                    kind: power.roll?.kind,
                    attribute: power.roll?.attribute || undefined,
                    vs: power.roll?.vs || undefined
                },
                levels: power.levels,
                // Legacy fields kept for backwards compatibility
                powerType: power.category === 'activeBuff' ? 'buff' : power.category,
                level: rank,
                minLevel: rank || 1,
                range: renderRange(levelRow.range),
                aoe: renderAoe(levelRow.aoe),
                duration: renderDuration(levelRow.duration),
                effect: levelRow.effect?.text || '',
                specials: (levelRow.specials || []).map((s) => s.value !== undefined ? `${s.key}(${s.value})` : s.key),
                ap: 30
            }
        };
    }
    // Legacy (spell / old tree) definition
    const legacy = power;
    const levelData = Array.isArray(legacy.levels) ? legacy.levels.find((l) => l.level === rank) : null;
    const powerTypeMap = {
        Melee: 'active',
        Ranged: 'active',
        Buff: 'buff',
        Utility: 'utility',
        Support: 'utility',
        Passive: 'passive',
        Reaction: 'reaction',
        Movement: 'movement',
        Zone: 'utility'
    };
    const mappedPowerType = levelData
        ? (powerTypeMap[levelData.type] || legacy.powerType || 'active')
        : (legacy.powerType || 'active');
    return {
        name: legacy.name,
        type: 'power',
        system: {
            tree: entry.sourceName,
            isMagicPower: !isMastery,
            powerType: mappedPowerType,
            level: rank,
            minLevel: rank || 1,
            description: legacy.description || '',
            tags: entry.tags.includes('spell') ? ['spell'] : [],
            range: levelData?.range || '',
            aoe: levelData?.aoe && levelData.aoe !== '—' ? levelData.aoe : '',
            duration: levelData?.duration || '',
            effect: levelData?.effect || '',
            specials: levelData?.special && levelData.special !== '—' ? [levelData.special] : [],
            ap: 30,
            cost: {
                action: mappedPowerType === 'active' || mappedPowerType === 'buff' || mappedPowerType === 'utility',
                movement: mappedPowerType === 'movement',
                reaction: mappedPowerType === 'reaction',
                stones: 0,
                charges: 0
            },
            roll: {
                attribute: 'might',
                tn: 0,
                damage: typeof levelData?.effect === 'string' && levelData.effect.includes('damage') ? levelData.effect : '',
                healing: typeof levelData?.effect === 'string' && levelData.effect.includes('Heal') ? levelData.effect : '',
                raises: ''
            },
            requirements: {
                masteryRank: rank,
                other: ''
            }
        }
    };
}
//# sourceMappingURL=character-sheet-power-dialog.js.map