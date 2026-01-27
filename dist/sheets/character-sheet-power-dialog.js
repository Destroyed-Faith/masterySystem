/**
 * Power Creation Dialog for Character Sheet
 *
 * Shows a dialog where players can select and add Powers from Mastery Trees or Spell Schools.
 * Only allows selection from predefined powers (no manual entry).
 *
 * Updated for new power structure (v0.4.18+)
 */
import { renderRange, renderAoe, renderDuration, renderPowerLevelTable } from '../utils/power-rendering.js';
/**
 * Check if a power uses the new structure
 */
function isNewPowerStructure(power) {
    return power && typeof power === 'object' && 'category' in power && 'levels' in power && typeof power.levels === 'object' && !Array.isArray(power.levels);
}
/**
 * Show the power creation dialog for an actor
 * @param actor - The actor to add powers to
 * @param context - The context: 'mastery' for Mastery Tree Powers, 'magic' for Magic Powers
 */
export async function showPowerCreationDialog(actor, context = 'mastery') {
    // Dynamic imports to avoid build issues
    const { getAllMasteryTrees } = await import('../utils/mastery-trees.js');
    const { getAllSpellSchools } = await import('../utils/spell-schools.js');
    const trees = getAllMasteryTrees();
    const spellSchools = getAllSpellSchools();
    // Create tree selection options (all available trees)
    const treeOptions = trees
        .map((tree) => `<option value="${tree.name}">${tree.name}</option>`)
        .join('');
    // Create spell school selection options
    const schoolOptions = spellSchools
        .map((school) => `<option value="${school.name}">${school.fullName}</option>`)
        .join('');
    // Determine which fields to show based on context
    const isMastery = context === 'mastery';
    const categoryLabel = isMastery ? 'Mastery Tree' : 'Spell School';
    const categoryOptions = isMastery ? treeOptions : schoolOptions;
    const categorySelectId = isMastery ? 'power-tree-select' : 'spell-school-select';
    const categoryGroupId = isMastery ? 'mastery-tree-group' : 'spell-school-group';
    const content = `
    <form class="power-creation-form">
      <div class="form-group power-form-group" id="${categoryGroupId}">
        <label class="power-form-label">${categoryLabel} <span style="font-weight: normal; color: #888;">(optional)</span>:</label>
        <select name="${isMastery ? 'tree' : 'school'}" id="${categorySelectId}" class="power-form-select">
          <option value="">-- Select a ${categoryLabel} (optional) --</option>
          ${categoryOptions}
        </select>
      </div>
      <div class="form-group power-form-group" id="power-select-group" style="display: none;">
        <label class="power-form-label">Power:</label>
        <select name="power" id="power-select" class="power-form-select">
          <option value="">-- Select a Power --</option>
        </select>
      </div>
      <div class="form-group power-details-group" id="power-details" style="display: none;">
        <div id="power-description" class="power-description-text"></div>
        <div id="power-level-table-container" class="power-level-table-container"></div>
      </div>
      <div class="form-group power-form-group" id="level-select-group" style="display: none;">
        <label class="power-form-label">Rank:</label>
        <select name="rank" id="power-rank-select" class="power-form-select">
          <option value="1">Rank 1</option>
          <option value="2">Rank 2</option>
          <option value="3">Rank 3</option>
          <option value="4">Rank 4</option>
        </select>
      </div>
    </form>
  `;
    const dialog = new Dialog({
        title: 'Create New Power',
        content: content,
        buttons: {
            create: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Create',
                callback: async (html) => {
                    const $html = html;
                    const tree = $html.find('#power-tree-select').val();
                    const school = $html.find('#spell-school-select').val();
                    const selectedPowerName = $html.find('#power-select').val();
                    const rank = parseInt($html.find('#power-rank-select').val() || '1');
                    if (!selectedPowerName || selectedPowerName.trim() === '') {
                        ui.notifications?.warn('Please select a power from the list');
                        return false;
                    }
                    const powerName = selectedPowerName;
                    let power = null;
                    // If tree/school is selected, try to load from predefined list
                    if ((isMastery && tree) || (!isMastery && school)) {
                        if (!isMastery) {
                            // Magic powers
                            try {
                                const magicModule = await import('../utils/magic-powers.js');
                                if (magicModule?.getMagicPower) {
                                    power = magicModule.getMagicPower(school, powerName);
                                }
                            }
                            catch (error) {
                                console.warn('Mastery System | Magic powers module not available');
                                ui.notifications?.error('Failed to load magic power data');
                                return false;
                            }
                        }
                        else {
                            // Mastery tree power
                            const { getPower } = await import('../utils/powers/index.js');
                            power = getPower(tree, powerName);
                        }
                        if (!power) {
                            ui.notifications?.error('Power not found in predefined list');
                            return false;
                        }
                    }
                    else {
                        // No tree/school selected - allow manual power creation with basic data
                        power = {
                            name: powerName,
                            description: '',
                            category: 'active',
                            tags: [],
                            rank: 1,
                            cost: {
                                action: 'attack',
                                stones: 0,
                                charges: 0
                            },
                            roll: {
                                kind: 'none'
                            },
                            levels: {
                                '1': {
                                    lvl: 1,
                                    type: 'melee',
                                    range: { kind: 'touch' },
                                    aoe: { shape: 'none' },
                                    duration: { kind: 'instant' },
                                    effect: { text: '' },
                                    specials: []
                                }
                            }
                        };
                    }
                    // Determine if power uses new structure
                    const isNewStructure = isNewPowerStructure(power);
                    // Build item data based on structure
                    let itemData;
                    if (isNewStructure) {
                        // New structure
                        const levelRow = power.levels[rank.toString()];
                        if (!levelRow) {
                            ui.notifications?.error(`Rank ${rank} data not found for this power`);
                            return false;
                        }
                        itemData = {
                            name: power.name,
                            type: 'power',
                            system: {
                                tree: !isMastery ? school : tree,
                                isMagicPower: !isMastery,
                                // New structure fields
                                category: power.category,
                                tags: power.tags || [],
                                rank: rank,
                                description: power.description || '',
                                trigger: power.trigger || levelRow.trigger || undefined,
                                cost: {
                                    action: power.cost.action,
                                    stones: power.cost.stones || 0,
                                    charges: power.cost.charges || 0,
                                    note: power.cost.note || undefined
                                },
                                roll: {
                                    kind: power.roll.kind,
                                    attribute: power.roll.attribute || undefined,
                                    vs: power.roll.vs || undefined
                                },
                                levels: power.levels,
                                // Legacy fields for backwards compatibility (migrated from levelRow)
                                powerType: power.category === 'activeBuff' ? 'buff' : power.category,
                                level: rank, // Keep for backwards compatibility
                                range: renderRange(levelRow.range),
                                aoe: renderAoe(levelRow.aoe),
                                duration: renderDuration(levelRow.duration),
                                effect: levelRow.effect.text,
                                specials: levelRow.specials.map((s) => s.value !== undefined ? `${s.key}(${s.value})` : s.key),
                                ap: 30
                            }
                        };
                    }
                    else {
                        // Old structure - migrate on the fly
                        const levelData = power.levels?.find((l) => l.level === rank);
                        if (!levelData && power.levels && power.levels.length > 0) {
                            ui.notifications?.error('Level data not found for this power');
                            return false;
                        }
                        // Map power type from the level data
                        const powerTypeMap = {
                            'Melee': 'active',
                            'Ranged': 'active',
                            'Buff': 'buff',
                            'Utility': 'utility',
                            'Support': 'utility',
                            'Passive': 'passive',
                            'Reaction': 'reaction',
                            'Movement': 'movement',
                            'Zone': 'utility'
                        };
                        const mappedPowerType = levelData ? (powerTypeMap[levelData.type] || power?.powerType || 'active') : (power?.powerType || 'active');
                        itemData = {
                            name: powerName,
                            type: 'power',
                            system: {
                                tree: !isMastery ? school : tree,
                                isMagicPower: !isMastery,
                                powerType: mappedPowerType,
                                level: rank,
                                description: power.description || '',
                                tags: [],
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
                                    damage: levelData?.effect?.includes('damage') ? levelData.effect : '',
                                    healing: levelData?.effect?.includes('Heal') ? levelData.effect : '',
                                    raises: ''
                                },
                                requirements: {
                                    masteryRank: rank,
                                    other: ''
                                }
                            }
                        };
                    }
                    // Check if we're in character creation mode
                    const system = actor.system;
                    const creationComplete = system?.creation?.complete !== false;
                    if (!creationComplete) {
                        // Enforce creation limits
                        const powers = actor.items.filter((item) => item.type === 'power');
                        // Check power limit (exactly 4)
                        if (powers.length >= 4) {
                            ui.notifications?.error('You can only select exactly 4 Powers during character creation.');
                            return false;
                        }
                        // Check rank 2 limit (max 2)
                        const powersAtRank2 = powers.filter((p) => (p.system?.rank || p.system?.level || 1) === 2);
                        if (rank === 2 && powersAtRank2.length >= 2) {
                            ui.notifications?.error('Maximum 2 Powers can be at Rank 2 during character creation.');
                            return false;
                        }
                        // Enforce max rank during creation (Mastery Rank 2)
                        const masteryRank = system.mastery?.rank || 2;
                        if (rank > masteryRank) {
                            ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank} during character creation.`);
                            return false;
                        }
                    }
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    const sourceType = !isMastery ? 'Spell School' : 'Mastery Tree';
                    const source = !isMastery ? school : tree;
                    ui.notifications?.info(`Created power: ${powerName} (Rank ${rank}) from ${source} ${sourceType}`);
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
        render: async (html) => {
            // Add CSS classes and make dialog size dynamic based on content
            setTimeout(() => {
                const dialogElement = html.closest('.window-app.dialog');
                if (dialogElement.length) {
                    dialogElement.addClass('mastery-system power-creation-dialog');
                    dialogElement.css({
                        'height': 'auto',
                        'min-height': '200px',
                        'max-height': '90vh',
                        'width': 'auto',
                        'min-width': '500px',
                        'max-width': '900px'
                    });
                    const contentElement = dialogElement.find('.window-content');
                    if (contentElement.length) {
                        contentElement.css({
                            'height': 'auto',
                            'max-height': 'calc(90vh - 100px)',
                            'overflow-y': 'auto'
                        });
                    }
                }
            }, 0);
            // Register event handlers after dialog is rendered
            const treeSelect = html.find('#power-tree-select')[0];
            const schoolSelect = html.find('#spell-school-select')[0];
            const powerSelect = html.find('#power-select')[0];
            const powerSelectGroup = html.find('#power-select-group');
            const powerDetails = html.find('#power-details');
            const powerDescription = html.find('#power-description');
            const powerLevelTableContainer = html.find('#power-level-table-container');
            const rankSelect = html.find('#power-rank-select')[0];
            const rankSelectGroup = html.find('#level-select-group');
            let powersData = {};
            // Handle category selection (Tree or School based on context)
            const categorySelect = isMastery ? treeSelect : schoolSelect;
            categorySelect?.addEventListener('change', async function () {
                const categoryName = this.value;
                if (powerSelect) {
                    powerSelect.innerHTML = '<option value="">-- Select a Power --</option>';
                }
                powerSelectGroup.hide();
                powerDetails.hide();
                rankSelectGroup.hide();
                if (!categoryName) {
                    return;
                }
                try {
                    if (isMastery) {
                        // Load mastery tree powers
                        const { getPowersForTree } = await import('../utils/powers/index.js');
                        const powers = getPowersForTree(categoryName);
                        powersData = {};
                        if (powers.length === 0) {
                            ui.notifications?.warn('No predefined powers found for this tree');
                            return;
                        }
                        powers.forEach((power) => {
                            powersData[power.name] = power;
                            if (powerSelect) {
                                const option = document.createElement('option');
                                option.value = power.name;
                                option.textContent = power.name;
                                powerSelect.appendChild(option);
                            }
                        });
                        powerSelectGroup.show();
                    }
                    else {
                        // Load magic powers
                        const magicModule = await import('../utils/magic-powers.js');
                        if (magicModule?.getMagicPowersBySchool) {
                            const powers = magicModule.getMagicPowersBySchool(categoryName);
                            powersData = {};
                            if (powers.length === 0) {
                                ui.notifications?.warn('No predefined powers found for this spell school');
                                return;
                            }
                            powers.forEach((power) => {
                                powersData[power.name] = power;
                                if (powerSelect) {
                                    const option = document.createElement('option');
                                    option.value = power.name;
                                    option.textContent = power.name;
                                    powerSelect.appendChild(option);
                                }
                            });
                            powerSelectGroup.show();
                        }
                        else {
                            ui.notifications?.error('Magic powers module not available');
                            return;
                        }
                    }
                }
                catch (error) {
                    console.error('Mastery System | Error loading powers:', error);
                    ui.notifications?.error('Failed to load powers');
                }
            });
            powerSelect?.addEventListener('change', function () {
                const powerName = this.value;
                if (!powerName || !powersData[powerName]) {
                    powerDetails.hide();
                    rankSelectGroup.hide();
                    return;
                }
                const power = powersData[powerName];
                powerDescription.text(power.description || '');
                // Show rank select when power is selected
                rankSelectGroup.show();
                // Show power level table
                const isNewStructure = isNewPowerStructure(power);
                if (isNewStructure && power.levels) {
                    const showTrigger = power.category === 'reaction' || Object.values(power.levels).some((l) => l.trigger);
                    const tableHtml = renderPowerLevelTable(power.levels, showTrigger);
                    powerLevelTableContainer.html(tableHtml);
                }
                else if (power.levels && Array.isArray(power.levels)) {
                    // Old structure - show simple list
                    let levelInfo = '<strong>Available Levels:</strong><br>';
                    power.levels.forEach((level) => {
                        levelInfo += `Level ${level.level}: ${level.type} - ${level.effect}`;
                        if (level.special && level.special !== '—' && level.special !== '') {
                            levelInfo += ` (${level.special})`;
                        }
                        levelInfo += '<br>';
                    });
                    powerLevelTableContainer.html(levelInfo);
                }
                else {
                    powerLevelTableContainer.html('');
                }
                powerDetails.show();
                // Update level info when rank is already selected
                updateRankInfo();
            });
            // Update rank details when rank changes
            rankSelect?.addEventListener('change', function () {
                updateRankInfo();
            });
            function updateRankInfo() {
                const rank = parseInt(rankSelect?.value || '1');
                const powerName = powerSelect?.value;
                if (!powerName || !powersData[powerName]) {
                    return;
                }
                const power = powersData[powerName];
                const isNewStructure = isNewPowerStructure(power);
                if (isNewStructure && power.levels) {
                    const levelRow = power.levels[rank.toString()];
                    if (levelRow) {
                        // Highlight the selected row in the table
                        powerLevelTableContainer.find('.power-level-row').removeClass('selected');
                        powerLevelTableContainer.find(`.power-level-row[data-level="${rank}"]`).addClass('selected');
                    }
                }
                else if (power.levels && Array.isArray(power.levels)) {
                    // Old structure
                    const levelData = power.levels.find((l) => l.level === rank);
                    if (levelData) {
                        let levelInfo = '<strong>Selected Rank ' + rank + ':</strong><br>';
                        levelInfo += `Type: ${levelData.type}<br>`;
                        levelInfo += `Range: ${levelData.range || 'N/A'}<br>`;
                        if (levelData.aoe && levelData.aoe !== '—' && levelData.aoe !== '') {
                            levelInfo += `AoE: ${levelData.aoe}<br>`;
                        }
                        if (levelData.duration) {
                            levelInfo += `Duration: ${levelData.duration}<br>`;
                        }
                        levelInfo += `Effect: ${levelData.effect}<br>`;
                        if (levelData.special && levelData.special !== '—' && levelData.special !== '') {
                            levelInfo += `Special: ${levelData.special}<br>`;
                        }
                        powerLevelTableContainer.html(levelInfo);
                    }
                }
            }
        }
    });
    dialog.render(true);
}
//# sourceMappingURL=character-sheet-power-dialog.js.map