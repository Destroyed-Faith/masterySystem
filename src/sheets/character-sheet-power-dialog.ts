/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Filter model:
 *   - Category (Movement / Passive / Reaction / Active / Active Buff)
 *   - Actives: Effect + Delivery (UI discovery) + Special + search
 *   - Active Buffs: no Kind filter — browse/search the final 18
 *   - Other categories: Kind (subfamily) + search (unchanged)
 *
 * For Actives, a Spell panel exposes "Cast this Active as a Spell?" and the
 * casting attribute (Intellect/Resolve). Spell Delivery uses a Casting Roll
 * against Final Spell TN (Spell Base TN + Spell Resistance).
 */

import type {
    CastingAttribute,
    PowerCategory,
    SpellResolution,
} from '../types/item.js';
import { calculateMaxPowerLevel } from '../utils/calculations.js';
import { castingBaseTnForMasteryRank } from '../combat/spell-roll-handler.js';
import { powerLevelCost } from '../utils/constants.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
    renderCatalogSelectionDetailsHtml,
    renderPowerLevelTable,
} from '../utils/power-rendering.js';
import { setupPowerCatalogDialogChrome } from '../utils/legacy-dialog-resize.js';
import {
    buildPowerItemFromCatalogEntry,
} from '../utils/power-item-builder.js';
import {
    applyXpCost,
    getXpState,
} from '../progression/progression-hub-actions.js';
import { appendXpHistory, currentXpUser } from '../utils/xp-history.js';
import {
    CATEGORY_LABELS,
    CATEGORY_ORDER,
    CREATION_DEFENSIVE_RANK,
    CREATION_OFFENSIVE_RANK,
    CREATION_POWER_REQUIREMENTS,
    CREATION_POWER_TOTAL,
    actorAlreadyHasPower,
    activeTemplateCanBeSpell,
    canLearnAnotherSpeciallessSpell,
    countSpeciallessSpells,
    powerHasConfiguredSpecial,
    collectOwnedPowerIdentityKeys,
    countPowersByCategory,
    catalogSelectOptionLabel,
    filterCatalog,
    findCatalogEntryByName,
    labelPowerSubfamily,
    powerIdentityKeyFromEntry,
    powerSubfamilyHint,
    findTemplateById,
    getSubfamiliesByCategory,
    getVisibleSpecialOptions,
    type CatalogEntry,
} from '../utils/power-catalog.js';
import {
    ACTIVE_UI_DELIVERIES,
    ACTIVE_UI_EFFECTS,
    labelActiveUiDelivery,
    labelActiveUiEffect,
} from '../utils/power-purchase-ui-filters.js';
import type { PowerTemplate } from '../utils/powers/templates/index.js';
import { creationBaselineRank } from '../utils/power-xp-refund.js';

/**
 * Show the template-based Power picker.
 */
export async function showPowerCreationDialog(
    actor: Actor,
    options?: { presetCategory?: PowerCategory },
): Promise<void> {
    const system = (actor as any).system;
    const creationComplete = system?.creation?.complete !== false;

    if (!creationComplete) {
        ui.notifications?.info('Use the Combat Package Wizard to choose your starting powers.');
        const { showTowerWizardDialog } = await import('../creation/tower-wizard/tower-wizard-dialog.js');
        await showTowerWizardDialog(actor);
        return;
    }
    const masteryRank = getRulesMasteryRank(actor);
    const actorEchoKey = (system?.echo?.key as string | undefined) || null;
    const actorSubChoiceKey = (system?.echo?.subChoiceKey as string | undefined) || null;
    const maxPowerLevel = calculateMaxPowerLevel(masteryRank);
    const maxSpellLevel = maxPowerLevel;

    const categoryOptions = CATEGORY_ORDER.map(
        (c) => `<option value="${c}"${options?.presetCategory === c ? ' selected' : ''}>${CATEGORY_LABELS[c]}</option>`,
    ).join('');

    const newPowerCost = powerLevelCost(1);
    const xpState = getXpState(actor);
    const isGm = !!(game as any).user?.isGM;

    const effectOptions = ACTIVE_UI_EFFECTS.map(
        (k) => `<option value="${k}">${labelActiveUiEffect(k)}</option>`,
    ).join('');
    const deliveryOptions = ACTIVE_UI_DELIVERIES.map(
        (k) => `<option value="${k}">${labelActiveUiDelivery(k)}</option>`,
    ).join('');

    const content = `
    <form class="power-creation-form power-catalog-form">
      <div class="power-catalog-filters">
        <div class="form-group power-form-group power-filter-field" data-filter="category">
          <label class="power-form-label" for="pc-category">Category</label>
          <select name="category" id="pc-category" class="power-form-select">
            <option value="">-- Any Category --</option>
            ${categoryOptions}
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="kind" id="pc-kind-field">
          <label class="power-form-label" for="pc-subfamily">Kind</label>
          <select name="subfamily" id="pc-subfamily" class="power-form-select">
            <option value="">-- Any kind --</option>
          </select>
          <p class="pc-subfamily-hint" id="pc-subfamily-hint" hidden></p>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="buff-focus" id="pc-buff-focus-field" hidden>
          <label class="power-form-label" for="pc-buff-focus">Focus</label>
          <select name="buffFocus" id="pc-buff-focus" class="power-form-select">
            <option value="all" selected>All</option>
            <option value="defensive">Defensive</option>
            <option value="offensive">Offensive</option>
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="effect" id="pc-effect-field" hidden>
          <label class="power-form-label" for="pc-effect">Effect</label>
          <select name="effect" id="pc-effect" class="power-form-select">
            <option value="">-- Any Effect --</option>
            ${effectOptions}
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="delivery" id="pc-delivery-field" hidden>
          <label class="power-form-label" for="pc-delivery">Delivery</label>
          <select name="delivery" id="pc-delivery" class="power-form-select">
            <option value="">-- Any Delivery --</option>
            ${deliveryOptions}
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field pc-special-group" data-filter="special" hidden>
          <label class="power-form-label" for="pc-special">Special</label>
          <select name="special" id="pc-special" class="power-form-select">
            <option value="">-- Any Special --</option>
          </select>
        </div>
        <div class="form-group power-form-group power-filter-field" data-filter="search">
          <label class="power-form-label" for="pc-search">Search</label>
          <input type="text" id="pc-search" class="power-form-input" placeholder="Name contains…" />
        </div>
      </div>
      <div class="form-group power-form-group power-catalog-select-group">
        <label class="power-form-label">Power:</label>
        <select name="power" id="pc-power" class="power-form-select power-catalog-select">
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
              <option value="spellAttack">Spell Attack (caster roll vs TN)</option>
            </select>
          </div>
          <div class="form-group pc-spell-rules-wrap">
            <p class="pc-spell-rules-hint" id="pc-spell-rules-hint"></p>
          </div>
        </div>
      </div>
      ${creationComplete ? `
      <div class="form-group power-form-group pc-purchase-bar">
        <input type="hidden" name="rank" id="pc-rank" value="1" />
        <p class="pc-purchase-copy">New Powers start at <strong>Level 1</strong>. Raise the level later on the sheet.</p>
        <p class="pc-purchase-cost" id="pc-purchase-cost">Cost: <strong>${newPowerCost} XP</strong> <span class="pc-purchase-have">(you have ${xpState.available} XP)</span></p>
        ${isGm ? `
        <label class="power-form-label power-form-checkbox-label" style="margin-top:8px; display:block;">
          <input type="checkbox" id="pc-gm-grant" class="power-form-checkbox" />
          <span><strong>Als GM vergeben (keine XP abziehen)</strong> — Level 1 gratis</span>
        </label>
        <label class="power-form-label power-form-checkbox-label" style="margin-top:6px; display:block;">
          <input type="checkbox" id="pc-starting-power" class="power-form-checkbox" />
          <span><strong>Als Startfähigkeit</strong> — Creation-Ersatz (Active Rank ${CREATION_OFFENSIVE_RANK} / Defensive Rank ${CREATION_DEFENSIVE_RANK}, 0 XP; kein Doppel-Refund)</span>
        </label>
        ` : ''}
      </div>
      ` : `
      <div class="form-group power-form-group">
        <label class="power-form-label">Rank:</label>
        <input type="hidden" name="rank" id="pc-rank" value="2" />
        <span class="power-form-fixed-rank">Rank 2 <span class="power-form-hint">(fixed during character creation)</span></span>
        <p class="power-form-hint" style="color:#888;font-size:0.85em;margin:4px 0 0;">All ${CREATION_POWER_TOTAL} starting Powers are Rank 2.</p>
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
                label: creationComplete ? `Buy (${newPowerCost} XP)` : 'Add',
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

                    const startingPower =
                        creationComplete &&
                        isGm &&
                        !!$html.find('#pc-starting-power').prop('checked');
                    const gmGrant =
                        creationComplete &&
                        isGm &&
                        !startingPower &&
                        !!$html.find('#pc-gm-grant').prop('checked');
                    const freeGrant = gmGrant || startingPower;

                    let rank = parseInt(($html.find('#pc-rank').val() as string) || '1', 10);
                    if (!creationComplete) {
                        rank = 2;
                    } else if (startingPower) {
                        rank = creationBaselineRank({ system: { category: entry.category } });
                    } else {
                        rank = 1;
                    }

                    const isSpell = entry.category === 'active'
                        && activeTemplateCanBeSpell(entry.templateId)
                        && !!$html.find('#pc-is-spell').prop('checked');
                    const castingAttribute = isSpell
                        ? (($html.find('#pc-casting-attr').val() as CastingAttribute) || 'intellect')
                        : undefined;
                    const spellResolution = isSpell
                        ? (($html.find('#pc-resolution').val() as SpellResolution) || 'spellAttack')
                        : undefined;

                    if (isSpell && rank > maxSpellLevel) {
                        ui.notifications?.error(
                            `Spell Level ${rank} exceeds Max Power Level ${maxSpellLevel} at Mastery Rank ${masteryRank}.`,
                        );
                        return false;
                    }
                    if (rank > maxPowerLevel) {
                        ui.notifications?.error(
                            `Power Level ${rank} exceeds Max Power Level ${maxPowerLevel} at Mastery Rank ${masteryRank}.`,
                        );
                        return false;
                    }
                    if (isSpell && !powerHasConfiguredSpecial(entry)) {
                        const owned = (actor as any).items?.filter?.((i: any) => i.type === 'power')
                            ?? (actor as any).items
                            ?? [];
                        const list = Array.isArray(owned) ? owned : Array.from(owned.values?.() ?? []);
                        const spellCapRank = masteryRank;
                        if (!canLearnAnotherSpeciallessSpell(countSpeciallessSpells(list), spellCapRank)) {
                            ui.notifications?.error(
                                `Spell Powers without a Special are limited to Mastery Rank (${spellCapRank}).`,
                            );
                            return false;
                        }
                    }

                    const itemData = buildPowerItemFromCatalogEntry(entry, rank, { isSpell, castingAttribute, spellResolution });
                    if (!itemData) {
                        ui.notifications?.error(`Rank ${rank} data not found for this power`);
                        return false;
                    }

                    const msFlags: Record<string, boolean> = {};
                    if (creationComplete) {
                        if (startingPower) msFlags.startingPower = true;
                        else if (gmGrant) msFlags.gmGranted = true;
                        else msFlags.xpPurchased = true;
                    }
                    if (Object.keys(msFlags).length) {
                        (itemData as any).flags = {
                            ...((itemData as any).flags || {}),
                            'mastery-system': {
                                ...((itemData as any).flags?.['mastery-system'] || {}),
                                ...msFlags,
                            },
                        };
                    }

                    const existingPowers = (actor as any).items.filter((i: any) => i.type === 'power');
                    if (actorAlreadyHasPower(existingPowers, entry)) {
                        const specialSuffix = entry.chosenSpecial?.key
                            ? ` (${entry.chosenSpecial.key})`
                            : '';
                        ui.notifications?.error(
                            `You already have "${entry.templateName}"${specialSuffix} on this character. Each power can only be chosen once.`,
                        );
                        return false;
                    }

                    if (!creationComplete) {
                        if (existingPowers.length >= CREATION_POWER_TOTAL) {
                            ui.notifications?.error(
                                `You already have the maximum number of starting Powers (${CREATION_POWER_TOTAL}) for character creation.`,
                            );
                            return false;
                        }
                        const catCounts = countPowersByCategory(existingPowers);
                        const cat = entry.category;
                        const catMax = CREATION_POWER_REQUIREMENTS[cat];
                        if (catCounts[cat] >= catMax) {
                            ui.notifications?.error(
                                `You already have the maximum number of ${CATEGORY_LABELS[cat]} powers (${catMax}) for character creation.`,
                            );
                            return false;
                        }
                        if (rank !== 2) {
                            ui.notifications?.error('All starting Powers must be Rank 2 during character creation.');
                            return false;
                        }
                        if (rank > maxPowerLevel) {
                            ui.notifications?.error(`Power Level cannot exceed ${maxPowerLevel} at Mastery Rank ${masteryRank}.`);
                            return false;
                        }
                    }

                    if (creationComplete && !freeGrant) {
                        const cost = powerLevelCost(1);
                        const beforeXp = getXpState(actor);
                        if (beforeXp.available < cost) {
                            ui.notifications?.error(
                                `Not enough XP. A new Power costs ${cost} XP (you have ${beforeXp.available}).`,
                            );
                            return false;
                        }
                    }

                    await (actor as any).createEmbeddedDocuments('Item', [itemData]);

                    if (creationComplete && !freeGrant) {
                        const cost = powerLevelCost(1);
                        const beforeXp = getXpState(actor);
                        const acct = applyXpCost(beforeXp, cost);
                        const history = appendXpHistory(actor, [{
                            ts: Date.now(),
                            ...currentXpUser(),
                            kind: 'spend',
                            category: 'power',
                            amount: cost,
                            note: `Added ${entry.name} at level ${rank}`,
                            details: { from: 0, to: rank, label: entry.name, cost },
                            before: {
                                available: beforeXp.available,
                                totalEarned: beforeXp.totalEarned,
                                totalSpent: beforeXp.totalSpent,
                            },
                            after: {
                                available: acct.pointsXp + acct.pointsXpFree,
                                totalEarned: beforeXp.totalEarned,
                                totalSpent: acct.totalSpent,
                            },
                        }]);
                        await (actor as any).update({
                            'system.points.xp': acct.pointsXp,
                            'system.points.xpFree': acct.pointsXpFree,
                            'system.xp.totalSpent': acct.totalSpent,
                            'system.xp.freeSpent': acct.freeSpent,
                            'system.xp.history': history,
                        });
                    }

                    if (!creationComplete) {
                        ui.notifications?.info(
                            `Created ${entry.name} (Rank ${rank})${isSpell ? ' as a Spell' : ''}`,
                        );
                    } else if (startingPower) {
                        ui.notifications?.info(
                            `Startfähigkeit ${entry.name} at Rank ${rank} (0 XP)${isSpell ? ' as a Spell' : ''}`,
                        );
                    } else if (gmGrant) {
                        ui.notifications?.info(
                            `GM granted ${entry.name} at Level ${rank} (0 XP)${isSpell ? ' as a Spell' : ''}`,
                        );
                    } else {
                        ui.notifications?.info(
                            `Added ${entry.name} at Level ${rank} (−${powerLevelCost(1)} XP)${isSpell ? ' as a Spell' : ''}`,
                        );
                    }
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
                setupPowerCatalogDialogChrome(html);
            }, 0);

            const $categorySelect = html.find('#pc-category');
            const $kindField = html.find('#pc-kind-field');
            const $subfamilySelect = html.find('#pc-subfamily');
            const $buffFocusField = html.find('#pc-buff-focus-field');
            const $buffFocusSelect = html.find('#pc-buff-focus');
            const $effectField = html.find('#pc-effect-field');
            const $effectSelect = html.find('#pc-effect');
            const $deliveryField = html.find('#pc-delivery-field');
            const $deliverySelect = html.find('#pc-delivery');
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
            const $spellHint = html.find('#pc-spell-rules-hint');
            const $rankSelect = html.find('#pc-rank');
            const $gmGrant = html.find('#pc-gm-grant');
            const $startingPower = html.find('#pc-starting-power');
            const $purchaseCost = html.find('#pc-purchase-cost');
            const $purchaseCopy = html.find('.pc-purchase-copy');

            const syncGmGrantUi = () => {
                if (!$gmGrant.length && !$startingPower.length) return;
                const starting = !!$startingPower.prop('checked');
                const gmFree = !!$gmGrant.prop('checked');
                const free = starting || gmFree;
                if ($purchaseCost.length) {
                    if (starting) {
                        $purchaseCost.html(
                            `Cost: <strong>0 XP</strong> <span class="pc-purchase-have">(Startfähigkeit / Creation-Ersatz)</span>`,
                        );
                    } else if (gmFree) {
                        $purchaseCost.html(
                            `Cost: <strong>0 XP</strong> <span class="pc-purchase-have">(GM grant)</span>`,
                        );
                    } else {
                        $purchaseCost.html(
                            `Cost: <strong>${newPowerCost} XP</strong> <span class="pc-purchase-have">(you have ${xpState.available} XP)</span>`,
                        );
                    }
                }
                if ($purchaseCopy.length) {
                    $purchaseCopy.html(
                        starting
                            ? `Startfähigkeit ersetzt eine gelöschte Creation-Power (Active Rank <strong>${CREATION_OFFENSIVE_RANK}</strong>, Defensive Rank <strong>${CREATION_DEFENSIVE_RANK}</strong>).`
                            : `New Powers start at <strong>Level 1</strong>. Raise the level later on the sheet.`,
                    );
                }
                const $btn = html.closest('.app, .dialog').find('.dialog-button.create, button[data-button="create"]');
                if ($btn.length) {
                    if (starting) {
                        $btn.html(`<i class="fas fa-check"></i> Startfähigkeit (0 XP)`);
                    } else if (gmFree) {
                        $btn.html(`<i class="fas fa-check"></i> Grant (0 XP)`);
                    } else {
                        $btn.html(`<i class="fas fa-check"></i> Buy (${newPowerCost} XP)`);
                    }
                }
            };
            $gmGrant.on('change', () => {
                if ($gmGrant.prop('checked')) $startingPower.prop('checked', false);
                syncGmGrantUi();
            });
            $startingPower.on('change', () => {
                if ($startingPower.prop('checked')) $gmGrant.prop('checked', false);
                syncGmGrantUi();
            });
            setTimeout(() => syncGmGrantUi(), 0);

            const refreshSubfamilyDropdown = () => {
                const category = ($categorySelect.val() as string) || '';
                $subfamilySelect.empty();
                $subfamilySelect.append('<option value="">-- Any kind --</option>');
                if (!category || category === 'active' || category === 'activeBuff') return;
                for (const sub of getSubfamiliesByCategory(category as PowerCategory)) {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = labelPowerSubfamily(sub);
                    $subfamilySelect.append(opt);
                }
            };

            const refreshSubfamilyHint = () => {
                const $hint = html.find('#pc-subfamily-hint');
                const category = ($categorySelect.val() as string) || '';
                const sub = ($subfamilySelect.val() as string) || '';
                const hint = category === 'active' || category === 'activeBuff' ? '' : powerSubfamilyHint(sub);
                $hint.text(hint);
                $hint.prop('hidden', !hint);
            };

            /** Show/hide Kind vs Focus vs Effect/Delivery/Special; clear filters that no longer apply. */
            const refreshFilterVisibility = () => {
                const category = ($categorySelect.val() as string) || '';
                const isActive = category === 'active';
                const isActiveBuff = category === 'activeBuff';
                const useKind = !!category && !isActive && !isActiveBuff;

                $kindField.prop('hidden', !useKind);
                $buffFocusField.prop('hidden', !isActiveBuff);
                $effectField.prop('hidden', !isActive);
                $deliveryField.prop('hidden', !isActive);
                $specialWrap.prop('hidden', !isActive);

                if (!useKind) {
                    $subfamilySelect.val('');
                    html.find('#pc-subfamily-hint').text('').prop('hidden', true);
                }
                if (!isActiveBuff) {
                    $buffFocusSelect.val('all');
                }
                if (!isActive) {
                    $effectSelect.val('');
                    $deliverySelect.val('');
                    $specialSelect.val('');
                    $isSpell.prop('checked', false);
                    $spellFields.hide();
                    $spellPanel.hide();
                }
            };

            const refreshSpellEligibility = (entry?: CatalogEntry) => {
                const category = ($categorySelect.val() as string) || '';
                const canSpell = category === 'active' && !!entry && activeTemplateCanBeSpell(entry.templateId);
                $spellPanel.toggle(canSpell);
                if (!canSpell) {
                    $isSpell.prop('checked', false);
                    $spellFields.hide();
                }
            };

            const refreshSpecialDropdown = () => {
                const category = ($categorySelect.val() as string) || '';
                if (category !== 'active') {
                    $specialSelect.empty();
                    $specialSelect.append('<option value="">-- Any Special --</option>');
                    return;
                }
                const uiEffect = ($effectSelect.val() as string) || '';
                const uiDelivery = ($deliverySelect.val() as string) || '';
                const prev = ($specialSelect.val() as string) || '';
                const opts = getVisibleSpecialOptions({
                    category: 'active',
                    subfamily: null,
                    uiEffect: uiEffect || null,
                    uiDelivery: uiDelivery || null,
                    actorEchoKey,
                    actorSubChoiceKey,
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
                else $specialSelect.val('');
            };

            const appendPowerOptions = (available: CatalogEntry[]) => {
                $powerSelect.empty();
                if (available.length === 0) {
                    $powerSelect.append(
                        '<option value="">-- No powers match these filters — try clearing Focus, Effect, Delivery, Special, or Search --</option>',
                    );
                    return;
                }
                $powerSelect.append('<option value="">-- Select a Power --</option>');
                // Flat list (no optgroups): dual Focus classification must not duplicate rows.
                for (const e of available) {
                    const opt = document.createElement('option');
                    opt.value = e.name;
                    opt.textContent = catalogSelectOptionLabel(e);
                    opt.dataset.templateId = e.templateId;
                    $powerSelect.append(opt);
                }
            };

            const refreshList = () => {
                const category = ($categorySelect.val() as string) || '';
                const isActive = category === 'active';
                const isActiveBuff = category === 'activeBuff';
                const subfamily = (!isActive && !isActiveBuff)
                    ? (($subfamilySelect.val() as string) || '')
                    : '';
                const uiEffect = isActive ? (($effectSelect.val() as string) || '') : '';
                const uiDelivery = isActive ? (($deliverySelect.val() as string) || '') : '';
                const special = isActive ? (($specialSelect.val() as string) || '') : '';
                const buffFocus = isActiveBuff ? (($buffFocusSelect.val() as string) || 'all') : '';
                const search = ($searchInput.val() as string) || '';

                const entries = filterCatalog({
                    category: (category || null) as PowerCategory | null,
                    subfamily: subfamily || null,
                    uiEffect: uiEffect || null,
                    uiDelivery: uiDelivery || null,
                    uiActiveBuffFocus: buffFocus && buffFocus !== 'all' ? buffFocus : null,
                    special: special || null,
                    search,
                    actorEchoKey,
                    actorSubChoiceKey,
                });

                const ownedKeys = collectOwnedPowerIdentityKeys(
                    (actor as any).items.filter((i: any) => i.type === 'power'),
                );
                const available = entries.filter((e) => !ownedKeys.has(powerIdentityKeyFromEntry(e)));

                appendPowerOptions(available);
                const skipped = entries.length - available.length;
                if (available.length === 0) {
                    $count.text(
                        entries.length === 0
                            ? 'No powers match these filters. Clear Effect, Delivery, Special, or Search.'
                            : `No available powers (${entries.length} match filters but are already on this character).`,
                    );
                } else {
                    const base = `${available.length} available`;
                    const suffix = skipped > 0
                        ? ` (${skipped} already on character)`
                        : ` (${entries.length} match filter)`;
                    $count.text(`${base}${suffix}`);
                }
                $details.hide();
                $description.empty();
                $levelTable.empty();
                updatePcSpellRulesHint();
            };

            const refreshSpellPanelDefaults = (template: PowerTemplate | undefined) => {
                if (!template || !template.spellHints) return;
                $resolution.val(template.spellHints.defaultResolution);
            };

            const updatePcSpellRulesHint = () => {
                if (!$spellHint.length) return;
                const powerName = ($powerSelect.val() as string) || '';
                const ent = powerName ? findCatalogEntryByName(powerName) : undefined;
                const showSpell = $isSpell.prop('checked') === true
                    && ($categorySelect.val() as string) === 'active'
                    && !!ent
                    && activeTemplateCanBeSpell(ent.templateId);
                if (!showSpell) {
                    $spellHint.text('');
                    return;
                }
                const castingTn = castingBaseTnForMasteryRank(masteryRank);
                $spellHint.html(
                    `<strong>Spell attack:</strong> Roll your casting attribute (keep = Mastery Rank) vs <strong>Casting TN ${castingTn}</strong> ` +
                        `((8 × Mastery Rank ${masteryRank}) − 2; + Target Spell Resistance). ` +
                        `<strong>Declared Raises</strong> before the roll add +4 each to that TN. ` +
                        `<strong>Raises</strong> after a successful hit can improve damage, special potency, Range, AoE, and other riders (per spell rules).`,
                );
            };

            $categorySelect.on('change', () => {
                refreshSubfamilyDropdown();
                refreshSubfamilyHint();
                refreshFilterVisibility();
                refreshSpecialDropdown();
                refreshList();
            });
            $subfamilySelect.on('change', () => {
                refreshSubfamilyHint();
                refreshSpecialDropdown();
                refreshList();
            });
            $buffFocusSelect.on('change', refreshList);
            $effectSelect.on('change', () => {
                refreshSpecialDropdown();
                refreshList();
            });
            $deliverySelect.on('change', () => {
                refreshSpecialDropdown();
                refreshList();
            });
            $specialSelect.on('change', refreshList);
            $searchInput.on('input', refreshList);

            $isSpell.on('change', () => {
                $spellFields.toggle($isSpell.prop('checked') as boolean);
                updatePcSpellRulesHint();
            });
            $resolution.on('change', updatePcSpellRulesHint);
            $castingAttr.on('change', updatePcSpellRulesHint);
            $rankSelect.on('change', updatePcSpellRulesHint);

            $powerSelect.on('change', function () {
                const name = ($(this).val() as string) || '';
                if (!name) {
                    $details.hide();
                    refreshSpellEligibility(undefined);
                    return;
                }
                const entry = findCatalogEntryByName(name);
                if (!entry) {
                    $details.hide();
                    refreshSpellEligibility(undefined);
                    return;
                }
                const selectedLevel = Math.max(
                    1,
                    Math.floor(Number($rankSelect.val()) || 1),
                );
                renderEntryDetails(entry, $description, $levelTable, selectedLevel);
                $details.show();
                refreshSpellEligibility(entry);

                const template = findTemplateById(entry.templateId);
                refreshSpellPanelDefaults(template);
                updatePcSpellRulesHint();
            });

            // Initial boot
            refreshSubfamilyDropdown();
            refreshSubfamilyHint();
            refreshFilterVisibility();
            refreshSpecialDropdown();
            refreshList();
            updatePcSpellRulesHint();
        },
    }, { width: 920, height: 720, resizable: true });

    dialog.render(true);
}

/** Render the description + level table of a catalog entry into the dialog. */
function renderEntryDetails(
    entry: CatalogEntry,
    $description: JQuery,
    $levelTable: JQuery,
    selectedLevel: number = 1,
): void {
    const raw: any = entry.raw;
    $description.html(renderCatalogSelectionDetailsHtml(entry, selectedLevel));
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l: any) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger, entry.chosenSpecial?.key));
    } else {
        $levelTable.empty();
    }
}
