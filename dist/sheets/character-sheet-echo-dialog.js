/**
 * Echo Creation Dialog for Character Sheet
 *
 * Single dialog that walks the user through:
 *   1. Echo selection (7 Echos)
 *   2. Sub-choice (Elves lineage / Sentinels order) \u2014 only if the Echo has one
 *   3. Veiled Form selection \u2014 Dragonborn only
 *   4. Start Card (1 from the chosen Echo's deck)
 *
 * Separate `showEchoCardPickDialog` handles later card picks (post-creation or on rank-up).
 *
 * All writes land on the Actor under `system.echo.*` \u2014 no Item type involved.
 */
import { ALL_ECHOS, buildFreshTraitUses, ECHO_KEY_ORDER, getAllEchos, getEcho, getEchoCard, getUnlockedCardSlots, isMrPerRest } from '../utils/echos/index.js';
import { buildArtifactSystemFromEchoDef, getEchoArtifactRules, listSelectableEchoArtifacts, } from '../utils/echo-artifacts.js';
import { grantEchoArtifactTreeToActor } from '../utils/seed-artifact-library.js';
/** Small HTML-escape helper used in dialog content (inline strings). */
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}
/** Render the traits preview for a given Echo (used in the picker sidebar). */
function renderTraitsPreview(def) {
    const coreRows = def.coreTraits
        .map(t => `
      <div class="echo-trait-row">
        <div class="echo-trait-name">${esc(t.name)}${isMrPerRest(t.usage) ? ' <span class="echo-trait-usage" title="Uses = Mastery Rank, restored on Safe Haven Rest">(MR / rest)</span>' : ''}</div>
        <div class="echo-trait-effect">${esc(t.effect)}</div>
      </div>
    `).join('');
    const subBlock = def.subChoices?.length
        ? `
      <div class="echo-subchoice-preview">
        <div class="echo-subchoice-heading">${esc(def.subChoiceLabel || 'Sub-choice')} (choose 1):</div>
        <ul>
          ${def.subChoices.map(sc => `<li><strong>${esc(sc.name)}</strong>: ${esc(sc.trait.effect)}</li>`).join('')}
        </ul>
      </div>
    `
        : '';
    const veiledBlock = def.veiledForm
        ? `<div class="echo-veiled-preview"><em>Requires choosing a Veiled Form (another Echo's appearance).</em></div>`
        : '';
    return `
    <div class="echo-traits-preview">
      <div class="echo-meta"><strong>Type:</strong> ${esc(def.creatureType)} \u00b7 <strong>Size:</strong> ${esc(def.size)} \u00b7 <strong>Speed:</strong> ${def.speed} m</div>
      <div class="echo-summary">${esc(def.summary)}</div>
      <div class="echo-traits-list">${coreRows}</div>
      ${subBlock}
      ${veiledBlock}
    </div>
  `;
}
/** Render the card preview (4 options) for one card id on the chosen Echo. */
function renderCardPreview(def, cardId) {
    const card = def.deck.find(c => c.id === cardId);
    if (!card)
        return '';
    const opts = card.options.map(o => `
    <li><strong>${esc(o.label)}</strong> \u2014 <em>Skill: ${esc(o.skill)}</em><br/>${esc(o.description)}</li>
  `).join('');
    return `
    <div class="echo-card-preview">
      <div class="echo-card-trigger"><em>Trigger:</em> ${esc(card.trigger)}</div>
      <ol class="echo-card-options">${opts}</ol>
    </div>
  `;
}
/**
 * Show the full Echo creation dialog (Echo \u2192 sub-choice \u2192 veiled \u2192 start card).
 */
export async function showEchoCreationDialog(actor) {
    const system = actor.system;
    const masteryRank = Math.max(1, Number(system?.mastery?.rank) || 1);
    const currentEcho = system?.echo || {};
    const echos = getAllEchos();
    const echoOptions = echos.map(def => `
    <option value="${esc(def.key)}"${currentEcho.key === def.key ? ' selected' : ''}>
      ${esc(def.name)} \u2014 ${esc(def.tagline)}
    </option>
  `).join('');
    const content = `
    <form class="mastery-system echo-creation-form">
      <div class="echo-form-group">
        <label class="echo-form-label">Echo</label>
        <select name="echoKey" id="ec-echo" class="echo-form-select">
          <option value="">-- Choose an Echo --</option>
          ${echoOptions}
        </select>
      </div>

      <div class="echo-form-preview" id="ec-preview"></div>

      <div class="echo-form-group" id="ec-subchoice-group" style="display:none;">
        <label class="echo-form-label" id="ec-subchoice-label">Sub-choice</label>
        <div id="ec-subchoice-options" class="echo-form-radios"></div>
      </div>

      <div class="echo-form-group" id="ec-veiled-group" style="display:none;">
        <label class="echo-form-label">Veiled Form <span class="echo-form-hint">(appearance only \u2014 no mechanical benefit)</span></label>
        <select name="veiledFormKey" id="ec-veiled" class="echo-form-select">
          <option value="">-- Choose another Echo's appearance --</option>
        </select>
      </div>

      <div class="echo-form-group" id="ec-artifact-group" style="display:none;">
        <label class="echo-form-label">Echo Artifacts <span class="echo-form-hint" id="ec-artifact-hint"></span></label>
        <div id="ec-artifact-options" class="echo-form-checks"></div>
        <div class="echo-artifact-preview" id="ec-artifact-preview"></div>
      </div>

      <div class="echo-form-group" id="ec-card-group" style="display:none;">
        <label class="echo-form-label">Start Card <span class="echo-form-hint">(1 from the deck)</span></label>
        <select name="startCardId" id="ec-card" class="echo-form-select">
          <option value="">-- Choose your first card --</option>
        </select>
        <div class="echo-card-preview-container" id="ec-card-preview"></div>
      </div>
    </form>
  `;
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: 'Choose Echo',
            content,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: async (htmlCb) => {
                        const $html = (htmlCb instanceof HTMLElement) ? $(htmlCb) : $(htmlCb);
                        const echoKey = String($html.find('#ec-echo').val() || '');
                        const def = getEcho(echoKey);
                        if (!def) {
                            ui.notifications?.warn('Please choose an Echo.');
                            return false;
                        }
                        const subChoiceKey = def.subChoices?.length
                            ? String($html.find('input[name="subChoiceKey"]:checked').val() || '')
                            : '';
                        if (def.subChoices?.length && !subChoiceKey) {
                            ui.notifications?.warn(`Please choose a ${def.subChoiceLabel || 'sub-choice'}.`);
                            return false;
                        }
                        const veiledFormKey = def.veiledForm
                            ? String($html.find('#ec-veiled').val() || '')
                            : '';
                        if (def.veiledForm && !veiledFormKey) {
                            ui.notifications?.warn('Please choose a Veiled Form.');
                            return false;
                        }
                        const startCardId = String($html.find('#ec-card').val() || '');
                        const startCard = getEchoCard(echoKey, startCardId);
                        if (!startCard) {
                            ui.notifications?.warn('Please choose a start card.');
                            return false;
                        }
                        // Echo Artifact validation + creation
                        const echoArtifactRules = getEchoArtifactRules(echoKey);
                        const selectedArtifactKeys = [];
                        $html.find('input[name="echoArtifactKey"]:checked').each(function () {
                            const v = String($(this).val() || '');
                            if (v)
                                selectedArtifactKeys.push(v);
                        });
                        if (selectedArtifactKeys.length < echoArtifactRules.requiredAtCreation) {
                            ui.notifications?.warn(`This Echo requires at least ${echoArtifactRules.requiredAtCreation} Echo Artifact(s).`);
                            return false;
                        }
                        if (selectedArtifactKeys.length > echoArtifactRules.maxAtCreation) {
                            ui.notifications?.warn(`This Echo allows at most ${echoArtifactRules.maxAtCreation} Echo Artifact(s).`);
                            return false;
                        }
                        const traitUses = buildFreshTraitUses(echoKey, subChoiceKey || null, masteryRank);
                        await actor.update({
                            'system.echo': {
                                key: echoKey,
                                subChoiceKey: subChoiceKey || '',
                                veiledFormKey: veiledFormKey || '',
                                selectedCardIds: [startCardId],
                                cardUses: {},
                                traitUses
                            },
                            'system.bio.echo': def.name
                        });
                        // Remove any previously-created echo-bound artifacts so we always
                        // reflect the latest selection (in case the player re-opens the dialog).
                        const oldEchoArtifacts = actor.items.filter((it) => it.type === 'artifact' && it.getFlag?.('mastery-system', 'echoBound'));
                        if (oldEchoArtifacts.length > 0) {
                            const ids = oldEchoArtifacts.map((it) => it.id).filter(Boolean);
                            if (ids.length > 0) {
                                await actor.deleteEmbeddedDocuments('Item', ids);
                            }
                        }
                        // Grant the newly picked echo artifacts. Preferred path: hand out
                        // the *root* of the seeded Builder-Tree (folder + 10 linked levels)
                        // so the artifact can be evolved along the tree. Fallback (library
                        // not seeded yet): create a single embedded artifact item.
                        const availableDefs = listSelectableEchoArtifacts(echoKey, subChoiceKey || null);
                        let grantedCount = 0;
                        const fallbackDocs = [];
                        for (const aKey of selectedArtifactKeys) {
                            const aDef = availableDefs.find((d) => d.key === aKey);
                            if (!aDef)
                                continue;
                            let granted = null;
                            try {
                                granted = await grantEchoArtifactTreeToActor(actor, aDef.key);
                            }
                            catch (err) {
                                console.warn('[mastery-system] tree grant failed, falling back to single item', err);
                            }
                            if (granted) {
                                grantedCount += 1;
                            }
                            else {
                                fallbackDocs.push({
                                    name: aDef.name,
                                    type: 'artifact',
                                    img: 'icons/svg/upgrade.svg',
                                    system: buildArtifactSystemFromEchoDef(aDef),
                                    flags: {
                                        'mastery-system': {
                                            echoBound: aDef.echoKey,
                                            echoArtifactKey: aDef.key,
                                        },
                                    },
                                });
                            }
                        }
                        if (fallbackDocs.length > 0) {
                            await actor.createEmbeddedDocuments('Item', fallbackDocs);
                            grantedCount += fallbackDocs.length;
                        }
                        ui.notifications?.info(`Echo set to ${def.name}${grantedCount ? ` (+${grantedCount} Echo Artifact${grantedCount === 1 ? '' : 's'})` : ''}.`);
                        return true;
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => false
                }
            },
            default: 'confirm',
            close: () => resolve(),
            render: (htmlRaw) => {
                const html = (htmlRaw instanceof HTMLElement) ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => {
                    const dlg = html.closest('.window-app.dialog');
                    if (dlg.length) {
                        dlg.addClass('mastery-system echo-creation-dialog');
                        dlg.css({
                            height: 'auto',
                            'min-height': '320px',
                            'max-height': '90vh',
                            width: 'auto',
                            'min-width': '760px',
                            'max-width': '1100px'
                        });
                        const contentEl = dlg.find('.window-content');
                        if (contentEl.length) {
                            contentEl.css({
                                height: 'auto',
                                'max-height': 'calc(90vh - 100px)',
                                'overflow-y': 'auto'
                            });
                        }
                    }
                }, 0);
                const $echo = html.find('#ec-echo');
                const $preview = html.find('#ec-preview');
                const $subGroup = html.find('#ec-subchoice-group');
                const $subLabel = html.find('#ec-subchoice-label');
                const $subOptions = html.find('#ec-subchoice-options');
                const $veiledGroup = html.find('#ec-veiled-group');
                const $veiled = html.find('#ec-veiled');
                const $artifactGroup = html.find('#ec-artifact-group');
                const $artifactHint = html.find('#ec-artifact-hint');
                const $artifactOptions = html.find('#ec-artifact-options');
                const $artifactPreview = html.find('#ec-artifact-preview');
                const $cardGroup = html.find('#ec-card-group');
                const $card = html.find('#ec-card');
                const $cardPreview = html.find('#ec-card-preview');
                const renderArtifactPreview = (defs) => {
                    const selectedKeys = [];
                    $artifactOptions
                        .find('input[name="echoArtifactKey"]:checked')
                        .each(function () {
                        const v = String($(this).val() || '');
                        if (v)
                            selectedKeys.push(v);
                    });
                    if (selectedKeys.length === 0) {
                        $artifactPreview.empty();
                        return;
                    }
                    const blocks = selectedKeys
                        .map((k) => defs.find((d) => d.key === k))
                        .filter((d) => !!d)
                        .map((d) => {
                        const bvHtml = d.baseValues
                            .map((bv) => `<li><strong>Base Value ${bv.slot.toUpperCase()} \u2014 ${esc(bv.label)}:</strong> ${esc(bv.note)}</li>`)
                            .join('');
                        return `
                <div class="echo-artifact-card">
                  <div class="echo-artifact-name"><strong>${esc(d.name)}</strong> \u2014 ${esc(d.slot)}</div>
                  <div class="echo-artifact-desc">${esc(d.description)}</div>
                  ${d.restriction ? `<div class="echo-artifact-restriction"><em>${esc(d.restriction)}</em></div>` : ''}
                  <ul class="echo-artifact-bv">${bvHtml}</ul>
                </div>
              `;
                    })
                        .join('');
                    $artifactPreview.html(blocks);
                };
                const refreshArtifactOptions = () => {
                    const key = String($echo.val() || '');
                    const subKey = String(html.find('input[name="subChoiceKey"]:checked').val() || '');
                    const rules = getEchoArtifactRules(key);
                    const defs = listSelectableEchoArtifacts(key, subKey || null);
                    $artifactOptions.empty();
                    $artifactPreview.empty();
                    if (rules.maxAtCreation <= 0 || defs.length === 0) {
                        $artifactGroup.hide();
                        return;
                    }
                    const inputType = rules.maxAtCreation === 1 ? 'radio' : 'checkbox';
                    const requiredText = rules.requiredAtCreation === rules.maxAtCreation
                        ? `Choose exactly ${rules.requiredAtCreation}`
                        : `Choose ${rules.requiredAtCreation}\u2013${rules.maxAtCreation}`;
                    $artifactHint.text(`(${requiredText} of ${defs.length})`);
                    const rows = defs
                        .map((d, idx) => `
              <label class="echo-form-check-row">
                <input type="${inputType}" name="echoArtifactKey" value="${esc(d.key)}"${idx === 0 && rules.maxAtCreation === 1 ? ' checked' : ''} />
                <span><strong>${esc(d.name)}</strong> <em>(${esc(d.slot)})</em> \u2014 ${esc(d.description)}</span>
              </label>
            `)
                        .join('');
                    $artifactOptions.html(rows);
                    $artifactOptions.on('change', 'input[name="echoArtifactKey"]', () => {
                        renderArtifactPreview(defs);
                    });
                    $artifactGroup.show();
                    renderArtifactPreview(defs);
                };
                const refreshForEcho = () => {
                    const key = String($echo.val() || '');
                    const def = getEcho(key);
                    $preview.empty();
                    $subGroup.hide();
                    $subOptions.empty();
                    $veiledGroup.hide();
                    $veiled.empty().append('<option value="">-- Choose another Echo\'s appearance --</option>');
                    $artifactGroup.hide();
                    $artifactOptions.empty();
                    $artifactPreview.empty();
                    $cardGroup.hide();
                    $card.empty().append('<option value="">-- Choose your first card --</option>');
                    $cardPreview.empty();
                    if (!def)
                        return;
                    $preview.html(renderTraitsPreview(def));
                    if (def.subChoices?.length) {
                        $subLabel.text(def.subChoiceLabel || 'Sub-choice');
                        const radios = def.subChoices.map((sc, idx) => `
              <label class="echo-form-radio-row">
                <input type="radio" name="subChoiceKey" value="${esc(sc.key)}"${idx === 0 && !currentEcho.subChoiceKey ? ' checked' : ''}${currentEcho.key === def.key && currentEcho.subChoiceKey === sc.key ? ' checked' : ''} />
                <span><strong>${esc(sc.name)}</strong> \u2014 ${esc(sc.trait.effect)}</span>
              </label>
            `).join('');
                        $subOptions.html(radios);
                        $subOptions.off('change.echoArtifact').on('change.echoArtifact', 'input[name="subChoiceKey"]', refreshArtifactOptions);
                        $subGroup.show();
                    }
                    if (def.veiledForm) {
                        const veiledOpts = ECHO_KEY_ORDER
                            .filter(k => k !== key)
                            .map(k => {
                            const other = ALL_ECHOS[k];
                            if (!other)
                                return '';
                            return `<option value="${esc(k)}"${currentEcho.veiledFormKey === k ? ' selected' : ''}>${esc(other.name)}</option>`;
                        }).join('');
                        $veiled.append(veiledOpts);
                        $veiledGroup.show();
                    }
                    refreshArtifactOptions();
                    const cardOpts = def.deck.map(c => `
            <option value="${esc(c.id)}">${esc(c.name)}</option>
          `).join('');
                    $card.append(cardOpts);
                    $cardGroup.show();
                };
                const refreshCardPreview = () => {
                    const key = String($echo.val() || '');
                    const def = getEcho(key);
                    const cardId = String($card.val() || '');
                    if (!def || !cardId) {
                        $cardPreview.empty();
                        return;
                    }
                    $cardPreview.html(renderCardPreview(def, cardId));
                };
                $echo.on('change', refreshForEcho);
                $card.on('change', refreshCardPreview);
                refreshForEcho();
            }
        });
        dialog.render(true);
    });
}
/**
 * Post-creation / rank-up card picker. Lets the user pick one additional card
 * from their chosen Echo's deck (any card not already selected).
 */
export async function showEchoCardPickDialog(actor) {
    const system = actor.system;
    const echo = system?.echo;
    const def = getEcho(echo?.key);
    if (!def) {
        ui.notifications?.warn('Choose an Echo before picking cards.');
        return;
    }
    const masteryRank = Math.max(1, Number(system?.mastery?.rank) || 1);
    const unlocked = getUnlockedCardSlots(masteryRank);
    const selected = Array.isArray(echo.selectedCardIds) ? echo.selectedCardIds : [];
    if (selected.length >= unlocked) {
        ui.notifications?.warn(`You already have ${selected.length} / ${unlocked} cards unlocked at Mastery Rank ${masteryRank}.`);
        return;
    }
    const available = def.deck.filter(c => !selected.includes(c.id));
    if (available.length === 0) {
        ui.notifications?.info('Your Echo deck is already fully chosen.');
        return;
    }
    const options = available.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const content = `
    <form class="mastery-system echo-card-pick-form">
      <div class="echo-form-group">
        <label class="echo-form-label">Card <span class="echo-form-hint">(${selected.length + 1} / ${unlocked})</span></label>
        <select name="cardId" id="ecp-card" class="echo-form-select">
          <option value="">-- Choose a card --</option>
          ${options}
        </select>
        <div class="echo-card-preview-container" id="ecp-card-preview"></div>
      </div>
    </form>
  `;
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: `Add Echo Card \u2014 ${def.name}`,
            content,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Add',
                    callback: async (htmlCb) => {
                        const $html = (htmlCb instanceof HTMLElement) ? $(htmlCb) : $(htmlCb);
                        const cardId = String($html.find('#ecp-card').val() || '');
                        if (!cardId) {
                            ui.notifications?.warn('Please select a card.');
                            return false;
                        }
                        const next = [...selected, cardId];
                        await actor.update({
                            'system.echo.selectedCardIds': next
                        });
                        const card = getEchoCard(def.key, cardId);
                        ui.notifications?.info(`Added Echo card: ${card?.name || cardId}.`);
                        return true;
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => false
                }
            },
            default: 'confirm',
            close: () => resolve(),
            render: (htmlRaw) => {
                const html = (htmlRaw instanceof HTMLElement) ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => {
                    const dlg = html.closest('.window-app.dialog');
                    if (dlg.length) {
                        dlg.addClass('mastery-system echo-card-pick-dialog');
                        dlg.css({
                            height: 'auto',
                            'min-height': '320px',
                            'max-height': '90vh',
                            width: 'auto',
                            'min-width': '720px',
                            'max-width': '1100px'
                        });
                        const contentEl = dlg.find('.window-content');
                        if (contentEl.length) {
                            contentEl.css({
                                height: 'auto',
                                'max-height': 'calc(90vh - 100px)',
                                'overflow-y': 'auto'
                            });
                        }
                    }
                }, 0);
                const $card = html.find('#ecp-card');
                const $preview = html.find('#ecp-card-preview');
                $card.on('change', () => {
                    const cardId = String($card.val() || '');
                    if (!cardId) {
                        $preview.empty();
                        return;
                    }
                    $preview.html(renderCardPreview(def, cardId));
                });
            }
        });
        dialog.render(true);
    });
}
//# sourceMappingURL=character-sheet-echo-dialog.js.map