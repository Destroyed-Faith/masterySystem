/**
 * Power Creation Dialog for Character Sheet
 *
 * Shows a dialog where players can select and add Powers from Mastery Trees or Spell Schools.
 * Only allows selection from predefined powers (no manual entry).
 */
/**
 * Show the power creation dialog for an actor
 * @param actor - The actor to add powers to
 * @param context - The context: 'mastery' for Mastery Tree Powers, 'magic' for Magic Powers
 */
export async function showPowerCreationDialog(actor, context = 'mastery') {
    // Dynamic imports to avoid build issues
    // Foundry resolves dynamic imports relative to the current file location
    // From dist/sheets/ to dist/utils/, we need ../utils/
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
    <form>
      <div class="form-group" id="${categoryGroupId}">
        <label>${categoryLabel}:</label>
        <select name="${isMastery ? 'tree' : 'school'}" id="${categorySelectId}" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a ${categoryLabel} --</option>
          ${categoryOptions}
        </select>
      </div>
      <div class="form-group" id="power-select-group" style="display: none;">
        <label>Power:</label>
        <select name="power" id="power-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Power --</option>
        </select>
      </div>
      <div class="form-group" id="power-details" style="display: none; margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
        <div id="power-description" style="margin-bottom: 10px; font-style: italic; color: #666;"></div>
        <div id="power-level-info" style="font-size: 0.9em; color: #333;"></div>
      </div>
      <div class="form-group" id="level-select-group" style="display: none;">
        <label>Level:</label>
        <select name="level" id="power-level-select" style="width: 100%; margin-bottom: 10px;">
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
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
                    const level = parseInt($html.find('#power-level-select').val() || '1');
                    if (isMastery && !tree) {
                        ui.notifications?.warn('Please select a Mastery Tree');
                        return false;
                    }
                    if (!isMastery && !school) {
                        ui.notifications?.warn('Please select a Spell School');
                        return false;
                    }
                    if (!selectedPowerName || selectedPowerName.trim() === '') {
                        ui.notifications?.warn('Please select a power from the list');
                        return false;
                    }
                    const powerName = selectedPowerName;
                    let power = null;
                    let levelData = null;
                    if (!isMastery) {
                        // Magic powers
                        try {
                            const magicModule = await import('../utils/magic-powers');
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
                    // If power is found in predefined list, use its data
                    if (power) {
                        levelData = power.levels?.find((l) => l.level === level);
                        if (!levelData && power.levels && power.levels.length > 0) {
                            ui.notifications?.error('Level data not found for this power');
                            return false;
                        }
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
                    const itemData = {
                        name: powerName,
                        type: 'special',
                        system: {
                            tree: !isMastery ? school : tree,
                            isMagicPower: !isMastery,
                            powerType: mappedPowerType,
                            level: level,
                            description: power.description || '',
                            tags: [],
                            range: levelData?.range || '',
                            aoe: levelData?.aoe && levelData.aoe !== '—' ? levelData.aoe : '',
                            duration: levelData?.duration || '',
                            effect: levelData?.effect || '',
                            specials: levelData?.special && levelData.special !== '—' ? [levelData.special] : [],
                            ap: 30, // Default, can be calculated later
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
                                masteryRank: level,
                                other: ''
                            }
                        }
                    };
                    // Check if we're in character creation mode
                    const system = actor.system;
                    const creationComplete = system?.creation?.complete !== false;
                    if (!creationComplete) {
                        // Enforce creation limits
                        const powers = actor.items.filter((item) => item.type === 'special');
                        const selectedTrees = new Set();
                        for (const p of powers) {
                            const t = p.system?.tree;
                            if (t)
                                selectedTrees.add(t);
                        }
                        const treeName = !isMastery ? school : tree;
                        const selectedPowers = powers.filter((p) => {
                            const t = p.system?.tree || '';
                            return selectedTrees.has(t);
                        });
                        // Check tree limit (max 2)
                        if (!selectedTrees.has(treeName) && selectedTrees.size >= 2) {
                            ui.notifications?.error('You can only select up to 2 Mastery Trees or Spell Schools.');
                            return false;
                        }
                        // Check power limit (exactly 4)
                        if (selectedPowers.length >= 4) {
                            ui.notifications?.error('You can only select exactly 4 Powers during character creation.');
                            return false;
                        }
                        // Enforce max rank during creation (Mastery Rank 2)
                        const masteryRank = system.mastery?.rank || 2;
                        if (level > masteryRank) {
                            ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank} during character creation.`);
                            return false;
                        }
                        // During creation, default to rank 1 (user can change later)
                        itemData.system.level = 1;
                    }
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    const sourceType = !isMastery ? 'Spell School' : 'Mastery Tree';
                    const source = !isMastery ? school : tree;
                    ui.notifications?.info(`Created power: ${powerName} (Level ${itemData.system.level}) from ${source} ${sourceType}`);
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
            // Set dialog height to 300px - use setTimeout to ensure DOM is ready
            setTimeout(() => {
                const dialogElement = html.closest('.window-app.dialog');
                if (dialogElement.length) {
                    dialogElement.css('height', '300px');
                }
            }, 0);
            // Register event handlers after dialog is rendered
            const treeSelect = html.find('#power-tree-select')[0];
            const schoolSelect = html.find('#spell-school-select')[0];
            const powerSelect = html.find('#power-select')[0];
            const powerSelectGroup = html.find('#power-select-group');
            const powerDetails = html.find('#power-details');
            const powerDescription = html.find('#power-description');
            const powerLevelInfo = html.find('#power-level-info');
            const levelSelect = html.find('#power-level-select')[0];
            const levelSelectGroup = html.find('#level-select-group');
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
                levelSelectGroup.hide();
                if (!categoryName)
                    return;
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
                        const magicModule = await import('../utils/magic-powers');
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
                    levelSelectGroup.hide();
                    return;
                }
                const power = powersData[powerName];
                powerDescription.text(power.description || '');
                // Show level select when power is selected
                levelSelectGroup.show();
                // Show level info
                if (power.levels && power.levels.length > 0) {
                    let levelInfo = '<strong>Available Levels:</strong><br>';
                    power.levels.forEach((level) => {
                        levelInfo += `Level ${level.level}: ${level.type} - ${level.effect}`;
                        if (level.special && level.special !== '—' && level.special !== '') {
                            levelInfo += ` (${level.special})`;
                        }
                        levelInfo += '<br>';
                    });
                    powerLevelInfo.html(levelInfo);
                }
                else {
                    powerLevelInfo.html('');
                }
                powerDetails.show();
                // Update level info when level is already selected
                if (levelSelect && levelSelect.value && power.levels) {
                    const level = parseInt(levelSelect.value);
                    const levelData = power.levels.find((l) => l.level === level);
                    if (levelData) {
                        let levelInfo = '<strong>Selected Level ' + level + ':</strong><br>';
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
                        powerLevelInfo.html(levelInfo);
                    }
                }
            });
            // Update level details when level changes
            levelSelect?.addEventListener('change', function () {
                const level = parseInt(this.value);
                const powerName = powerSelect?.value;
                if (!powerName || !powersData[powerName]) {
                    return;
                }
                const power = powersData[powerName];
                if (!power.levels)
                    return;
                const levelData = power.levels.find((l) => l.level === level);
                if (levelData) {
                    let levelInfo = '<strong>Selected Level ' + level + ':</strong><br>';
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
                    powerLevelInfo.html(levelInfo);
                    powerDetails.show();
                }
            });
        }
    });
    dialog.render(true);
}
//# sourceMappingURL=character-sheet-power-dialog.js.map