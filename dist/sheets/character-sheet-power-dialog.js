/**
 * Power Creation Dialog for Character Sheet
 *
 * Shows a dialog where players can select and add Powers from Mastery Trees or Spell Schools.
 * Supports both predefined powers and manual entry.
 */
/**
 * Show the power creation dialog for an actor
 * @param actor - The actor to add powers to
 */
export async function showPowerCreationDialog(actor) {
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
    const content = `
    <form>
      <div class="form-group">
        <label>Power Type:</label>
        <select name="powerType" id="power-type-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select Power Type --</option>
          <option value="mastery">Mastery Tree Power</option>
          <option value="magic">Magic Power (Spell School)</option>
        </select>
      </div>
      <div class="form-group" id="mastery-tree-group" style="display: none;">
        <label>Mastery Tree:</label>
        <select name="tree" id="power-tree-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Tree --</option>
          ${treeOptions}
        </select>
      </div>
      <div class="form-group" id="spell-school-group" style="display: none;">
        <label>Spell School:</label>
        <select name="school" id="spell-school-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Spell School --</option>
          ${schoolOptions}
        </select>
      </div>
      <div class="form-group" id="power-select-group" style="display: none;">
        <label>Power (optional - select from predefined or enter manually):</label>
        <select name="power" id="power-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Power or Enter Manually --</option>
        </select>
      </div>
      <div class="form-group" id="power-name-group" style="display: none;">
        <label>Power Name (if not selecting from list):</label>
        <input type="text" name="powerName" id="power-name-input" style="width: 100%; margin-bottom: 10px;" placeholder="Enter power name"/>
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
                    const powerType = $html.find('#power-type-select').val();
                    const tree = $html.find('#power-tree-select').val();
                    const school = $html.find('#spell-school-select').val();
                    const selectedPowerName = $html.find('#power-select').val();
                    const manualPowerName = $html.find('#power-name-input').val();
                    const level = parseInt($html.find('#power-level-select').val() || '1');
                    if (!powerType) {
                        ui.notifications?.warn('Please select a Power Type');
                        return false;
                    }
                    if (powerType === 'mastery' && !tree) {
                        ui.notifications?.warn('Please select a Mastery Tree');
                        return false;
                    }
                    if (powerType === 'magic' && !school) {
                        ui.notifications?.warn('Please select a Spell School');
                        return false;
                    }
                    // Use selected power name or manual entry
                    const powerName = selectedPowerName || manualPowerName;
                    if (!powerName || powerName.trim() === '') {
                        ui.notifications?.warn('Please select a power from the list or enter a power name');
                        return false;
                    }
                    let power = null;
                    let levelData = null;
                    if (powerType === 'magic') {
                        // Magic powers - try to import if available, otherwise use manual entry
                        try {
                            const magicModule = await import('../utils/magic-powers');
                            if (magicModule?.getMagicPower) {
                                power = magicModule.getMagicPower(school, powerName);
                            }
                        }
                        catch (error) {
                            console.warn('Mastery System | Magic powers module not available, using manual entry');
                        }
                    }
                    else {
                        // Mastery tree power
                        const { getPower } = await import('../utils/powers/index.js');
                        power = getPower(tree, powerName);
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
                            tree: powerType === 'magic' ? school : tree,
                            isMagicPower: powerType === 'magic',
                            powerType: mappedPowerType,
                            level: level,
                            description: power?.description || '',
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
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    const sourceType = powerType === 'magic' ? 'Spell School' : 'Mastery Tree';
                    const source = powerType === 'magic' ? school : tree;
                    if (power) {
                        ui.notifications?.info(`Created power: ${powerName} (Level ${level}) from ${source} ${sourceType}`);
                    }
                    else {
                        ui.notifications?.info(`Created power: ${powerName} (Level ${level}) from ${source} ${sourceType}. You can edit the details in the power sheet.`);
                    }
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
            // Register event handlers after dialog is rendered
            const powerTypeSelect = html.find('#power-type-select')[0];
            const masteryTreeGroup = html.find('#mastery-tree-group');
            const spellSchoolGroup = html.find('#spell-school-group');
            const treeSelect = html.find('#power-tree-select')[0];
            const schoolSelect = html.find('#spell-school-select')[0];
            const powerSelect = html.find('#power-select')[0];
            const powerNameInput = html.find('#power-name-input')[0];
            const powerSelectGroup = html.find('#power-select-group');
            const powerNameGroup = html.find('#power-name-group');
            const powerDetails = html.find('#power-details');
            const powerDescription = html.find('#power-description');
            const powerLevelInfo = html.find('#power-level-info');
            const levelSelect = html.find('#power-level-select')[0];
            const levelSelectGroup = html.find('#level-select-group');
            let powersData = {};
            // Handle power type selection (Mastery Tree vs Magic Power)
            powerTypeSelect?.addEventListener('change', function () {
                const powerType = this.value;
                masteryTreeGroup.hide();
                spellSchoolGroup.hide();
                powerSelectGroup.hide();
                powerNameGroup.hide();
                powerDetails.hide();
                levelSelectGroup.hide();
                if (powerType === 'mastery') {
                    masteryTreeGroup.show();
                }
                else if (powerType === 'magic') {
                    spellSchoolGroup.show();
                }
            });
            // Handle spell school selection (for Magic Powers)
            schoolSelect?.addEventListener('change', async function () {
                const schoolName = this.value;
                if (powerSelect) {
                    powerSelect.innerHTML = '<option value="">-- Select a Power or Enter Manually --</option>';
                }
                if (powerNameInput) {
                    powerNameInput.value = '';
                }
                powerSelectGroup.hide();
                powerNameGroup.hide();
                powerDetails.hide();
                levelSelectGroup.hide();
                if (!schoolName)
                    return;
                levelSelectGroup.show();
                powerNameGroup.show();
                try {
                    // Try to load magic powers if available
                    const magicModule = await import('../utils/magic-powers');
                    if (magicModule?.getMagicPowersBySchool) {
                        const powers = magicModule.getMagicPowersBySchool(schoolName);
                        powersData = {};
                        if (powers.length === 0) {
                            if (powerSelect) {
                                powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                            }
                            powerSelectGroup.show();
                            powerDetails.hide();
                        }
                        else {
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
                    }
                    else {
                        // No magic powers module - allow manual entry
                        if (powerSelect) {
                            powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                        }
                        powerSelectGroup.show();
                        powerDetails.hide();
                    }
                }
                catch (error) {
                    console.warn('Mastery System | Error loading magic powers:', error);
                    // On error, still allow manual entry
                    if (powerSelect) {
                        powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                    }
                    powerSelectGroup.show();
                    powerNameGroup.show();
                    levelSelectGroup.show();
                }
            });
            // Handle mastery tree selection (for normal Powers)
            treeSelect?.addEventListener('change', async function () {
                const treeName = this.value;
                if (powerSelect) {
                    powerSelect.innerHTML = '<option value="">-- Select a Power or Enter Manually --</option>';
                }
                if (powerNameInput) {
                    powerNameInput.value = '';
                }
                powerSelectGroup.hide();
                powerNameGroup.hide();
                powerDetails.hide();
                levelSelectGroup.hide();
                if (!treeName)
                    return;
                // Always show level select and power name input when tree is selected
                levelSelectGroup.show();
                powerNameGroup.show();
                try {
                    const { getPowersForTree } = await import('../utils/powers/index.js');
                    const powers = getPowersForTree(treeName);
                    powersData = {};
                    if (powers.length === 0) {
                        // Tree has no predefined powers - show manual entry option
                        if (powerSelect) {
                            powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                        }
                        powerSelectGroup.show();
                        powerDetails.hide();
                    }
                    else {
                        // Tree has predefined powers - show them in dropdown
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
                }
                catch (error) {
                    console.error('Mastery System | Error loading powers:', error);
                    // On error, still allow manual entry
                    if (powerSelect) {
                        powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                    }
                    powerSelectGroup.show();
                    powerNameGroup.show();
                    levelSelectGroup.show();
                }
            });
            powerSelect?.addEventListener('change', function () {
                const powerName = this.value;
                // Clear manual input when selecting from dropdown
                if (powerNameInput && powerName) {
                    powerNameInput.value = '';
                }
                if (!powerName || !powersData[powerName]) {
                    powerDetails.hide();
                    return;
                }
                const power = powersData[powerName];
                powerDescription.text(power.description || '');
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
            // Clear dropdown selection when typing manually
            powerNameInput?.addEventListener('input', function () {
                if (this.value && powerSelect) {
                    powerSelect.value = '';
                    powerDetails.hide();
                }
            });
            // Update level details when level changes
            levelSelect?.addEventListener('change', function () {
                const level = parseInt(this.value);
                const powerName = powerSelect?.value || powerNameInput?.value;
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