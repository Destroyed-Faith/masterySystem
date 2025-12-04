/**
 * Magic Power Creation Dialog - extracted for clarity
 */
export async function showMagicPowerCreationDialog(actor) {
    const { getAllSpellSchools } = await import('../utils/spell-schools.js');
    const spellSchools = getAllSpellSchools();
    const schoolOptions = spellSchools
        .map(school => `<option value="${school.name}">${school.fullName}</option>`)
        .join('');
    const content = `
    <form>
      <div class="form-group">
        <label>Spell School:</label>
        <select name="school" id="spell-school-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Spell School --</option>
          ${schoolOptions}
        </select>
      </div>
      <div class="form-group" id="power-select-group" style="display: none;">
        <label>Magic Power:</label>
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
        title: 'Create New Magic Power',
        content: content,
        buttons: {
            create: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Create',
                callback: async (html) => {
                    const $html = html;
                    const school = $html.find('#spell-school-select').val();
                    const selectedPowerName = $html.find('#power-select').val();
                    const manualPowerName = $html.find('#power-name-input').val();
                    const level = parseInt($html.find('#power-level-select').val() || '1');
                    if (!school) {
                        ui.notifications?.warn('Please select a Spell School');
                        return false;
                    }
                    const powerName = selectedPowerName || manualPowerName;
                    if (!powerName || powerName.trim() === '') {
                        ui.notifications?.warn('Please select a power from the list or enter a power name');
                        return false;
                    }
                    let power = null;
                    let levelData = null;
                    const { getMagicPower } = await import('../utils/magic-powers.js');
                    power = getMagicPower(school, powerName);
                    if (power) {
                        levelData = power.levels.find((l) => l.level === level);
                        if (!levelData) {
                            ui.notifications?.error('Level data not found for this power');
                            return false;
                        }
                    }
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
                    const mappedPowerType = levelData ? (powerTypeMap[levelData.type] || 'active') : 'active';
                    const itemData = {
                        name: powerName,
                        type: 'special',
                        system: {
                            tree: school,
                            isMagicPower: true,
                            powerType: mappedPowerType,
                            level: level,
                            description: power?.description || '',
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
                                masteryRank: level,
                                other: ''
                            }
                        }
                    };
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    if (power) {
                        ui.notifications?.info(`Created magic power: ${powerName} (Level ${level}) from ${school} school`);
                    }
                    else {
                        ui.notifications?.info(`Created magic power: ${powerName} (Level ${level}) from ${school} school. You can edit the details in the power sheet.`);
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
                    const { getMagicPowersBySchool } = await import('../utils/magic-powers.js');
                    const powers = getMagicPowersBySchool(schoolName);
                    powersData = {};
                    if (powers.length === 0) {
                        if (powerSelect) {
                            powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                        }
                        powerSelectGroup.show();
                        powerDetails.hide();
                    }
                    else {
                        powers.forEach(power => {
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
                    console.error('Error loading magic powers:', error);
                    powerSelectGroup.show();
                    powerNameGroup.show();
                    levelSelectGroup.show();
                }
            });
            powerSelect?.addEventListener('change', function () {
                const powerName = this.value;
                if (powerNameInput && powerName) {
                    powerNameInput.value = '';
                }
                if (!powerName || !powersData[powerName]) {
                    powerDetails.hide();
                    return;
                }
                const power = powersData[powerName];
                powerDescription.text(power.description);
                let levelInfo = '<strong>Available Levels:</strong><br>';
                power.levels.forEach((level) => {
                    levelInfo += `Level ${level.level}: ${level.type} - ${level.effect}`;
                    if (level.special && level.special !== '—' && level.special !== '') {
                        levelInfo += ` (${level.special})`;
                    }
                    levelInfo += '<br>';
                });
                powerLevelInfo.html(levelInfo);
                powerDetails.show();
                if (levelSelect && levelSelect.value) {
                    const level = parseInt(levelSelect.value);
                    const levelData = power.levels.find((l) => l.level === level);
                    if (levelData) {
                        let levelInfo = '<strong>Selected Level ' + level + ':</strong><br>';
                        levelInfo += `Type: ${levelData.type}<br>`;
                        levelInfo += `Range: ${levelData.range}<br>`;
                        if (levelData.aoe && levelData.aoe !== '—' && levelData.aoe !== '') {
                            levelInfo += `AoE: ${levelData.aoe}<br>`;
                        }
                        levelInfo += `Duration: ${levelData.duration}<br>`;
                        levelInfo += `Effect: ${levelData.effect}<br>`;
                        if (levelData.special && levelData.special !== '—' && levelData.special !== '') {
                            levelInfo += `Special: ${levelData.special}<br>`;
                        }
                        powerLevelInfo.html(levelInfo);
                    }
                }
            });
            powerNameInput?.addEventListener('input', function () {
                if (this.value && powerSelect) {
                    powerSelect.value = '';
                    powerDetails.hide();
                }
            });
            levelSelect?.addEventListener('change', function () {
                const powerName = powerSelect.value;
                const level = parseInt(this.value);
                if (!powerName || !powersData[powerName])
                    return;
                const power = powersData[powerName];
                const levelData = power.levels.find((l) => l.level === level);
                if (levelData) {
                    let levelInfo = '<strong>Selected Level ' + level + ':</strong><br>';
                    levelInfo += `Type: ${levelData.type}<br>`;
                    levelInfo += `Range: ${levelData.range}<br>`;
                    if (levelData.aoe && levelData.aoe !== '—' && levelData.aoe !== '') {
                        levelInfo += `AoE: ${levelData.aoe}<br>`;
                    }
                    levelInfo += `Duration: ${levelData.duration}<br>`;
                    levelInfo += `Effect: ${levelData.effect}<br>`;
                    if (levelData.special && levelData.special !== '—' && levelData.special !== '') {
                        levelInfo += `Special: ${levelData.special}<br>`;
                    }
                    powerLevelInfo.html(levelInfo);
                }
            });
        }
    });
    dialog.render(true);
}
//# sourceMappingURL=character-sheet-magic-dialog.js.map