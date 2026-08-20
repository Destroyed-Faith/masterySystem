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
import { ALL_ECHOS, buildFreshTraitUses, ECHO_KEY_ORDER, getAllEchos, getEcho, getEchoCard, getUnlockedCardSlots } from '../utils/echos/index.js';
import { getEchoArtifactRules, listSelectableEchoArtifacts, listEchoArtifactsInVariantGroup, validateEchoArtifactSelection, WYRM_SCALES_VARIANT_GROUP, } from '../utils/echo-artifacts.js';
import { grantEchoArtifactTreeToActor, seedArtifactLibrary } from '../utils/seed-artifact-library.js';
import { buildEchoArtifactTree } from '../artifacts/echo-artifact-tree-builder.js';
import { dedupeEchoArtifactsOnActor, equipEchoArtifact, getEchoArtifactKey, isEchoBoundArtifact, } from '../utils/echo-artifact-equip.js';
import { scheduleCenterLegacyDialog } from '../utils/legacy-dialog-resize.js';
import { normalizeKnownLanguages } from '../utils/languages.js';
function formatEchoSlot(slot) {
    const labels = {
        bothHands: 'both hands',
        head: 'head',
        body: 'body',
        feet: 'feet',
    };
    return labels[slot] ?? slot;
}
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
    const veiledBlock = def.veiledForm
        ? `<div class="echo-veiled-preview"><strong>Veiled Form (required):</strong> Pick another Echo\u2019s appearance below. Appearance only \u2014 no Traits, Size, or other mechanics from that Echo.</div>`
        : '';
    return `
    <div class="echo-traits-preview">
      <div class="echo-meta"><strong>Type:</strong> ${esc(def.creatureType)} \u00b7 <strong>Size:</strong> ${esc(def.size)} \u00b7 <strong>Speed:</strong> ${def.speed} m</div>
      ${veiledBlock}
      <div class="echo-summary">${esc(def.summary)}</div>
    </div>
  `;
}
function renderSubChoiceRows(def, currentKey) {
    return (def.subChoices ?? []).map((sc, idx) => {
        const checked = currentKey === sc.key || (idx === 0 && !currentKey);
        const flavor = sc.trait.flavor
            ? `<div class="echo-pick-flavor">${esc(sc.trait.flavor)}</div>`
            : '';
        return `
      <label class="echo-pick-row">
        <input type="radio" name="subChoiceKey" value="${esc(sc.key)}"${checked ? ' checked' : ''} />
        <span class="echo-pick-body">
          <strong class="echo-pick-name">${esc(sc.name)}</strong>
          ${flavor}
          <div class="echo-pick-effect">${esc(sc.trait.effect)}</div>
        </span>
      </label>
    `;
    }).join('');
}
function renderCardPickRows(def, selectedId, inputName, availableIds) {
    const cards = availableIds
        ? def.deck.filter((c) => availableIds.includes(c.id))
        : def.deck;
    return cards.map((c, idx) => {
        const checked = selectedId === c.id || (idx === 0 && !selectedId);
        return `
      <label class="echo-pick-row">
        <input type="radio" name="${esc(inputName)}" value="${esc(c.id)}"${checked ? ' checked' : ''} />
        <span class="echo-pick-body">
          <strong class="echo-pick-name">${esc(c.name)}</strong>
          <div class="echo-pick-effect">${esc(c.trigger)}</div>
        </span>
      </label>
    `;
    }).join('');
}
/** Render the card preview (4 options) for one card id on the chosen Echo. */
function renderCardPreview(def, cardId) {
    const card = def.deck.find(c => c.id === cardId);
    if (!card)
        return '';
    const opts = card.options.map(o => `
    <li>
      <div class="echo-card-option-head"><strong>${esc(o.label)}</strong> <em>Skill: ${esc(o.skill)}</em></div>
      <div class="echo-card-option-desc">${esc(o.description)}</div>
    </li>
  `).join('');
    return `
    <div class="echo-card-preview">
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
        <div id="ec-subchoice-options" class="echo-form-radios echo-pick-list"></div>
      </div>

      <div class="echo-form-group" id="ec-veiled-group" style="display:none;">
        <label class="echo-form-label">Veiled Form <span class="echo-form-hint">(appearance only \u2014 no mechanical benefit)</span></label>
        <select name="veiledFormKey" id="ec-veiled" class="echo-form-select">
          <option value="">-- Choose another Echo's appearance --</option>
        </select>
      </div>

      <div class="echo-form-group" id="ec-artifact-group" style="display:none;">
        <label class="echo-form-label">Echo Artifacts <span class="echo-form-hint" id="ec-artifact-hint"></span></label>
        <div id="ec-artifact-options" class="echo-form-checks echo-pick-list"></div>
        <div class="echo-artifact-preview" id="ec-artifact-preview"></div>
      </div>

      <div class="echo-form-group" id="ec-card-group" style="display:none;">
        <label class="echo-form-label">Start Card <span class="echo-form-hint">(choose 1 from the deck)</span></label>
        <div id="ec-card-options" class="echo-pick-list"></div>
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
                        const startCardId = String($html.find('input[name="startCardId"]:checked').val() || '');
                        const startCard = getEchoCard(echoKey, startCardId);
                        if (!startCard) {
                            ui.notifications?.warn('Please choose a start card.');
                            return false;
                        }
                        // Echo Artifact validation + creation
                        const selectedArtifactKeys = [];
                        $html.find('input[name="echoArtifactKey"]:checked').each(function () {
                            const v = String($(this).val() || '');
                            if (v)
                                selectedArtifactKeys.push(v);
                        });
                        const artifactError = validateEchoArtifactSelection(echoKey, selectedArtifactKeys);
                        if (artifactError) {
                            ui.notifications?.warn(artifactError);
                            return false;
                        }
                        const traitUses = buildFreshTraitUses(echoKey, subChoiceKey || null, masteryRank);
                        const inCreation = actor.system?.creation?.complete === false;
                        const nextLanguages = normalizeKnownLanguages(actor.system?.languages?.known, echoKey, { replaceExtras: inCreation }).cleaned;
                        await actor.update({
                            'system.echo': {
                                key: echoKey,
                                subChoiceKey: subChoiceKey || '',
                                veiledFormKey: veiledFormKey || '',
                                selectedCardIds: [startCardId],
                                cardUses: {},
                                traitUses
                            },
                            'system.bio.echo': def.name,
                            'system.languages.known': nextLanguages,
                        });
                        // Remove any previously-created echo-bound artifacts so we always
                        // reflect the latest selection (in case the player re-opens the dialog).
                        const oldEchoArtifacts = actor.items.filter((it) => it.type === 'artifact' && isEchoBoundArtifact(it));
                        if (oldEchoArtifacts.length > 0) {
                            const ids = oldEchoArtifacts.map((it) => it.id).filter(Boolean);
                            if (ids.length > 0) {
                                await actor.deleteEmbeddedDocuments('Item', ids, {
                                    masterySystemForceDelete: true,
                                });
                            }
                        }
                        // Grant the newly picked echo artifacts. Preferred path: hand out
                        // the *root* of the seeded Builder-Tree (folder + 10 linked levels)
                        // so the artifact can be evolved along the tree. Fallback (library
                        // not seeded yet): create a single embedded artifact item.
                        const availableDefs = listSelectableEchoArtifacts(echoKey, subChoiceKey || null);
                        let grantedCount = 0;
                        const fallbackDocs = [];
                        const grantedItems = [];
                        for (const aKey of selectedArtifactKeys) {
                            const aDef = availableDefs.find((d) => d.key === aKey);
                            if (!aDef)
                                continue;
                            const actorHasEchoKey = () => Array.from(actor.items).some((it) => it.type === 'artifact' && getEchoArtifactKey(it) === aKey);
                            let granted = null;
                            try {
                                granted = await grantEchoArtifactTreeToActor(actor, aDef.key);
                                // If the world library has not been seeded yet, seed it now
                                // (GM) and retry, so the actor links to the real Builder-Tree.
                                if (!granted && game.user?.isGM) {
                                    await seedArtifactLibrary();
                                    granted = await grantEchoArtifactTreeToActor(actor, aDef.key);
                                }
                            }
                            catch (err) {
                                console.warn('[mastery-system] tree grant failed, falling back to single item', err);
                            }
                            if (granted) {
                                grantedCount += 1;
                                grantedItems.push(granted);
                            }
                            else if (!actorHasEchoKey()) {
                                // Last-resort single item: use the generator's faithful Level-1
                                // root node (correct slot/profile, base values, powers).
                                const rootNode = buildEchoArtifactTree(aDef).nodes[0];
                                const rootData = foundry.utils.duplicate(rootNode.itemData);
                                fallbackDocs.push(rootData);
                            }
                        }
                        if (fallbackDocs.length > 0) {
                            const created = await actor.createEmbeddedDocuments('Item', fallbackDocs);
                            grantedCount += fallbackDocs.length;
                            if (Array.isArray(created))
                                grantedItems.push(...created);
                        }
                        // Echo Artifacts are Echo-bound: auto-equip them to their slot.
                        // They are locked and cannot be unequipped, removed, or replaced.
                        for (const item of grantedItems) {
                            try {
                                await equipEchoArtifact(actor, item);
                                if (item.getFlag?.('mastery-system', 'artifactActivated') !== true) {
                                    await item.setFlag('mastery-system', 'artifactActivated', false);
                                }
                            }
                            catch (err) {
                                console.warn('[mastery-system] failed to auto-equip echo artifact', err);
                            }
                        }
                        await dedupeEchoArtifactsOnActor(actor);
                        ui.notifications?.info(`Echo set to ${def.name}${grantedCount ? ` (+${grantedCount} Echo Artifact${grantedCount === 1 ? '' : 's'})` : ''}. Ab MR2: 1 Stone zum Aktivieren über Artifacts.`);
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
                    const dlg = html.closest('.window-app.dialog, .window-app, .application');
                    if (dlg.length) {
                        dlg.addClass('mastery-system echo-creation-dialog');
                        dlg.css({
                            position: 'fixed',
                            height: 'auto',
                            'min-height': '320px',
                            'max-height': '92vh',
                            width: 'auto',
                            'min-width': '760px',
                            'max-width': '1100px'
                        });
                        const contentEl = dlg.find('.window-content');
                        if (contentEl.length) {
                            contentEl.css({
                                height: 'auto',
                                'max-height': 'calc(92vh - 96px)',
                                'overflow-y': 'auto'
                            });
                        }
                    }
                    scheduleCenterLegacyDialog(html, dialog);
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
                const $cardOptions = html.find('#ec-card-options');
                const $cardPreview = html.find('#ec-card-preview');
                const renderWyrmVariantTable = (defs) => {
                    const variants = listEchoArtifactsInVariantGroup(WYRM_SCALES_VARIANT_GROUP).filter((v) => defs.some((d) => d.key === v.key));
                    if (variants.length === 0)
                        return '';
                    const bodyRows = variants
                        .map((v) => {
                        const r = v.variantRow;
                        return `<tr>
                <td><strong>${esc(v.name)}</strong></td>
                <td>${esc(r.armorClass)}</td>
                <td>${esc(r.focus)}</td>
                <td>${esc(r.flightL1)}</td>
                <td>${esc(r.activeBuffL2)}</td>
                <td>${esc(r.stonePowerL3)}</td>
              </tr>`;
                    })
                        .join('');
                    return `
            <div class="echo-artifact-variant-table-wrap">
              <p class="echo-artifact-variant-caption"><strong>Wyrm Scales</strong> \u2014 choose one variant (mutually exclusive):</p>
              <table class="echo-artifact-variant-table">
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Armor class</th>
                    <th>Focus</th>
                    <th>L1</th>
                    <th>L2 Active Buff</th>
                    <th>L3 Stone Power</th>
                  </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
              </table>
            </div>`;
                };
                const renderArtifactPreview = (defs) => {
                    const variantTable = renderWyrmVariantTable(defs);
                    const selectedKeys = [];
                    $artifactOptions
                        .find('input[name="echoArtifactKey"]:checked')
                        .each(function () {
                        const v = String($(this).val() || '');
                        if (v)
                            selectedKeys.push(v);
                    });
                    if (selectedKeys.length === 0) {
                        $artifactPreview.html(variantTable);
                        return;
                    }
                    const blocks = selectedKeys
                        .map((k) => defs.find((d) => d.key === k))
                        .filter((d) => !!d)
                        .map((d) => {
                        const bvHtml = d.baseValues
                            .map((bv) => `<li><strong>Base Value ${bv.slot.toUpperCase()} \u2014 ${esc(bv.label)}:</strong> ${esc(bv.note)}</li>`)
                            .join('');
                        const vr = d.variantRow
                            ? `<p class="echo-artifact-variant-focus"><strong>Focus:</strong> ${esc(d.variantRow.focus)} \u00b7 <strong>L2:</strong> ${esc(d.variantRow.activeBuffL2)} \u00b7 <strong>L3:</strong> ${esc(d.variantRow.stonePowerL3)}</p>`
                            : '';
                        return `
                <div class="echo-artifact-card">
                  <div class="echo-artifact-name"><strong>${esc(d.name)}</strong> \u2014 ${esc(d.slot)}</div>
                  <div class="echo-artifact-desc">${esc(d.description)}</div>
                  ${vr}
                  ${d.restriction ? `<div class="echo-artifact-restriction"><em>${esc(d.restriction)}</em></div>` : ''}
                  <ul class="echo-artifact-bv">${bvHtml}</ul>
                </div>
              `;
                    })
                        .join('');
                    $artifactPreview.html(`${variantTable}${blocks}`);
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
                    const exclusiveNote = (rules.exclusiveGroups ?? [])
                        .map((group) => group
                        .map((k) => defs.find((d) => d.key === k)?.name)
                        .filter(Boolean)
                        .join(' or '))
                        .filter((s) => s.length > 0)
                        .map((s) => ` \u2014 only one of: ${s}`)
                        .join('');
                    $artifactHint.text(`(${requiredText} of ${defs.length}${exclusiveNote})`);
                    const rows = defs
                        .map((d, idx) => `
              <label class="echo-pick-row">
                <input type="${inputType}" name="echoArtifactKey" value="${esc(d.key)}"${idx === 0 && rules.maxAtCreation === 1 ? ' checked' : ''} />
                <span class="echo-pick-body">
                  <strong class="echo-pick-name">${esc(d.name)}</strong>
                  <em class="echo-pick-slot">${esc(formatEchoSlot(d.slot))}</em>
                  <div class="echo-pick-effect">${esc(d.description)}</div>
                  ${d.restriction ? `<div class="echo-pick-restriction">${esc(d.restriction)}</div>` : ''}
                </span>
              </label>
            `)
                        .join('');
                    $artifactOptions.html(rows);
                    const exclusiveGroups = rules.exclusiveGroups ?? [];
                    $artifactOptions.off('change.echoArtifactSel').on('change.echoArtifactSel', 'input[name="echoArtifactKey"]', function () {
                        const $changed = $(this);
                        // Enforce mutually-exclusive groups: checking one member
                        // unchecks the others in the same group.
                        if ($changed.prop('checked') && inputType === 'checkbox') {
                            const val = String($changed.val() || '');
                            for (const group of exclusiveGroups) {
                                if (!group.includes(val))
                                    continue;
                                for (const sibling of group) {
                                    if (sibling === val)
                                        continue;
                                    $artifactOptions
                                        .find(`input[name="echoArtifactKey"][value="${sibling}"]`)
                                        .prop('checked', false);
                                }
                            }
                        }
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
                    $cardOptions.empty();
                    $cardPreview.empty();
                    if (!def)
                        return;
                    $preview.html(renderTraitsPreview(def));
                    if (def.subChoices?.length) {
                        $subLabel.text(`${def.subChoiceLabel || 'Sub-choice'} (choose 1)`);
                        const currentSub = currentEcho.key === def.key ? String(currentEcho.subChoiceKey || '') : '';
                        $subOptions.html(renderSubChoiceRows(def, currentSub));
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
                    const currentCard = currentEcho.key === def.key
                        ? String((Array.isArray(currentEcho.selectedCardIds) ? currentEcho.selectedCardIds[0] : '') || '')
                        : '';
                    $cardOptions.html(renderCardPickRows(def, currentCard, 'startCardId'));
                    $cardOptions.off('change.echoCard').on('change.echoCard', 'input[name="startCardId"]', refreshCardPreview);
                    $cardGroup.show();
                    refreshCardPreview();
                };
                const refreshCardPreview = () => {
                    const key = String($echo.val() || '');
                    const def = getEcho(key);
                    const cardId = String($cardOptions.find('input[name="startCardId"]:checked').val() || '');
                    if (!def || !cardId) {
                        $cardPreview.empty();
                        return;
                    }
                    $cardPreview.html(renderCardPreview(def, cardId));
                };
                $echo.on('change', () => {
                    refreshForEcho();
                    scheduleCenterLegacyDialog(html, dialog);
                });
                refreshForEcho();
                scheduleCenterLegacyDialog(html, dialog);
            }
        }, {
            classes: ['dialog', 'mastery-system', 'echo-creation-dialog'],
            width: 860,
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
    const content = `
    <form class="mastery-system echo-card-pick-form">
      <div class="echo-form-group">
        <label class="echo-form-label">Card <span class="echo-form-hint">(${selected.length + 1} / ${unlocked})</span></label>
        <div id="ecp-card-options" class="echo-pick-list">
          ${renderCardPickRows(def, '', 'cardId', available.map((c) => c.id))}
        </div>
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
                        const cardId = String($html.find('input[name="cardId"]:checked').val() || '');
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
                    const dlg = html.closest('.window-app.dialog, .window-app, .application');
                    if (dlg.length) {
                        dlg.addClass('mastery-system echo-card-pick-dialog');
                        dlg.css({
                            position: 'fixed',
                            height: 'auto',
                            'min-height': '320px',
                            'max-height': '92vh',
                            width: 'auto',
                            'min-width': '720px',
                            'max-width': '1100px'
                        });
                        const contentEl = dlg.find('.window-content');
                        if (contentEl.length) {
                            contentEl.css({
                                height: 'auto',
                                'max-height': 'calc(92vh - 96px)',
                                'overflow-y': 'auto'
                            });
                        }
                    }
                    scheduleCenterLegacyDialog(html, dialog);
                }, 0);
                const $options = html.find('#ecp-card-options');
                const $preview = html.find('#ecp-card-preview');
                const paintPreview = () => {
                    const cardId = String($options.find('input[name="cardId"]:checked').val() || '');
                    if (!cardId) {
                        $preview.empty();
                        return;
                    }
                    $preview.html(renderCardPreview(def, cardId));
                };
                $options.on('change', 'input[name="cardId"]', paintPreview);
                paintPreview();
            }
        }, {
            classes: ['dialog', 'mastery-system', 'echo-card-pick-dialog'],
            width: 820,
        });
        dialog.render(true);
    });
}
//# sourceMappingURL=character-sheet-echo-dialog.js.map