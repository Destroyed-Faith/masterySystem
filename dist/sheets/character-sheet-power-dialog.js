/**
 * Mastery Power Creation Dialog (non-magic powers)
 */
export async function showPowerCreationDialog(actor) {
    const { getAllMasteryTrees } = await import('../utils/mastery-trees.js');
    const { getPowersByTree, getPower } = await import('../utils/powers.js');
    const trees = getAllMasteryTrees();
    const treeOptions = trees
        .map((tree) => `<option value="${tree.name}">${tree.name}</option>`)
        .join('');
    const content = `
    <form>
      <div class="form-group">
        <label>Mastery Tree:</label>
        <select name="tree" id="power-tree-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Tree --</option>
          ${treeOptions}
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
        content,
        buttons: {
            create: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Create',
                callback: async (html) => {
                    const $html = html;
                    const tree = $html.find('#power-tree-select').val();
                    const selectedPowerName = $html.find('#power-select').val();
                    const manualPowerName = $html.find('#power-name-input').val();
                    const level = parseInt($html.find('#power-level-select').val() || '1');
                    if (!tree) {
                        ui.notifications?.warn('Please select a Mastery Tree');
                        return false;
                    }
                    const powerName = selectedPowerName || manualPowerName;
                    if (!powerName || powerName.trim() === '') {
                        ui.notifications?.warn('Please select a power from the list or enter a power name');
                        return false;
                    }
                    let powerData = null;
                    let levelData = null;
                    powerData = getPower(tree, powerName);
                    if (powerData) {
                        levelData = powerData.levels.find((l) => l.level === level);
                    }
                    const mappedTypeMap = {
                        Melee: 'active',
                        Ranged: 'active',
                        Buff: 'buff',
                        Utility: 'utility',
                        Passive: 'passive',
                        Reaction: 'reaction',
                        Movement: 'movement',
                        Zone: 'active',
                        Support: 'utility'
                    };
                    const finalType = levelData ? (mappedTypeMap[levelData.type] || 'active') : 'active';
                    const itemData = {
                        name: powerName,
                        type: 'special',
                        system: {
                            tree,
                            powerType: finalType,
                            level,
                            description: powerData?.description || `A custom power for the ${tree} tree.`,
                            tags: [],
                            range: levelData?.range || '',
                            aoe: levelData?.aoe && levelData.aoe !== '—' ? levelData.aoe : '',
                            duration: levelData?.duration || '',
                            effect: levelData?.effect || '',
                            specials: levelData?.special && levelData.special !== '—' ? [levelData.special] : [],
                            ap: 30,
                            cost: {
                                action: finalType === 'active' || finalType === 'buff' || finalType === 'utility',
                                movement: finalType === 'movement',
                                reaction: finalType === 'reaction',
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
                            },
                            isMagicPower: false
                        }
                    };
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    ui.notifications?.info(`Created power: ${powerName} (Level ${level}) from ${tree}`);
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
            const treeSelect = html.find('#power-tree-select')[0];
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
            const loadPowersForTree = async (treeName) => {
                powerSelect.innerHTML = '<option value="">-- Select a Power or Enter Manually --</option>';
                powerNameInput.value = '';
                powerDetails.hide();
                if (!treeName) {
                    powerSelectGroup.hide();
                    powerNameGroup.hide();
                    levelSelectGroup.hide();
                    return;
                }
                levelSelectGroup.show();
                powerNameGroup.show();
                const treePowers = getPowersByTree(treeName);
                powersData = {};
                if (!treePowers || treePowers.length === 0) {
                    powerSelect.innerHTML = '<option value="">No predefined powers - Enter name manually below</option>';
                    powerSelectGroup.show();
                    return;
                }
                treePowers.forEach((power) => {
                    powersData[power.name] = power;
                    const opt = document.createElement('option');
                    opt.value = power.name;
                    opt.textContent = power.name;
                    powerSelect.appendChild(opt);
                });
                powerSelectGroup.show();
            };
            treeSelect?.addEventListener('change', async function () {
                await loadPowersForTree(this.value);
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
                power.levels.forEach((lvl) => {
                    levelInfo += `Level ${lvl.level}: ${lvl.type} - ${lvl.effect}`;
                    if (lvl.special && lvl.special !== '—') {
                        levelInfo += ` (${lvl.special})`;
                    }
                    levelInfo += '<br>';
                });
                powerLevelInfo.html(levelInfo);
                powerDetails.show();
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
                const lvlData = power.levels.find((l) => l.level === level);
                if (!lvlData)
                    return;
                let info = '<strong>Selected Level ' + level + ':</strong><br>';
                info += `Type: ${lvlData.type}<br>`;
                info += `Range: ${lvlData.range}<br>`;
                if (lvlData.aoe && lvlData.aoe !== '—') {
                    info += `AoE: ${lvlData.aoe}<br>`;
                }
                info += `Duration: ${lvlData.duration}<br>`;
                info += `Effect: ${lvlData.effect}<br>`;
                if (lvlData.special && lvlData.special !== '—') {
                    info += `Special: ${lvlData.special}<br>`;
                }
                powerLevelInfo.html(info);
            });
        }
    });
    dialog.render(true);
}
//# sourceMappingURL=character-sheet-power-dialog.js.map