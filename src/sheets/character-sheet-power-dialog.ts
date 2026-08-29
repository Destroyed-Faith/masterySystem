/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / weapon-attack / …)
 *   Stage 3: Special + free-text search
 *     - Special dropdown lists every Special the current filter can resolve
 *       (blight, hex, prone, dread, disoriented, regeneration, disrupt, …)
 *       — Tier is NOT a player-facing search axis (Tier is an internal
 *       pricing bucket only).
 *     - Pure weapon/illusion Actives (no Special slot) surface via
 *       Category + Subfamily alone and ignore the Special filter.
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle and the casting attribute (Intellect/Resolve).
 * Every Spell resolves as a Spell Attack (caster roll vs Casting TN / Evade);
 * saving throws were removed from the rules.
 */

import type {
    CastingAttribute,
    PowerCategory,
    SpellResolution,
} from '../types/item.js';
import { calculateMaxPowerLevel } from '../utils/calculations.js';
import { calculateBaseTN } from '../combat/spell-roll-handler.js';
import { renderPowerLevelTable } from '../utils/power-rendering.js';
import { setupPowerCatalogDialogChrome } from '../utils/legacy-dialog-resize.js';
import {
    buildPowerItemFromCatalogEntry,
} from '../utils/power-item-builder.js';
import {
    CATEGORY_LABELS,
    CATEGORY_ORDER,
    CREATION_POWER_REQUIREMENTS,
    CREATION_POWER_TOTAL,
    actorAlreadyHasPower,
    activeTemplateCanBeSpell,
    collectOwnedPowerIdentityKeys,
    countPowersByCategory,
    filterCatalog,
    findCatalogEntryByName,
    powerIdentityKeyFromEntry,
    findTemplateById,
    getSubfamiliesByCategory,
    getVisibleSpecialOptions,
    type CatalogEntry,
} from '../utils/power-catalog.js';
import type { PowerTemplate } from '../utils/powers/templates/index.js';

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

    if (!creationComplete) {
        ui.notifications?.info('Use the Combat Package Wizard to choose your starting powers.');
        const { showTowerWizardDialog } = await import('../creation/tower-wizard/tower-wizard-dialog.js');
        await showTowerWizardDialog(actor);
        return;
    }
    const masteryRank = system?.mastery?.rank || 2;
    const actorEchoKey = (system?.echo?.key as string | undefined) || null;
    const maxPowerLevel = calculateMaxPowerLevel(masteryRank);
    const maxSpellLevel = maxPowerLevel;

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
      <div class="form-group power-form-group">
        <label class="power-form-label">Rank:</label>
        <select name="rank" id="pc-rank" class="power-form-select">
          ${rankOptions}
        </select>
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

                    let rank = parseInt(($html.find('#pc-rank').val() as string) || '1', 10);
                    if (!creationComplete) rank = 2;

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

                    const itemData = buildPowerItemFromCatalogEntry(entry, rank, { isSpell, castingAttribute, spellResolution });
                    if (!itemData) {
                        ui.notifications?.error(`Rank ${rank} data not found for this power`);
                        return false;
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
                setupPowerCatalogDialogChrome(html);
            }, 0);

            const $categorySelect = html.find('#pc-category');
            const $subfamilySelect = html.find('#pc-subfamily');
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
                $specialWrap.toggle(isActive);
                if (!isActive) {
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
                const subfamily = ($subfamilySelect.val() as string) || '';
                const prev = ($specialSelect.val() as string) || '';
                const opts = getVisibleSpecialOptions({
                    category: (category || null) as PowerCategory | null,
                    subfamily: subfamily || null,
                    actorEchoKey,
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
            };

            const refreshList = () => {
                const category = ($categorySelect.val() as string) || '';
                const subfamily = ($subfamilySelect.val() as string) || '';
                const special = ($specialSelect.val() as string) || '';
                const search = ($searchInput.val() as string) || '';

                const entries = filterCatalog({
                    category: (category || null) as PowerCategory | null,
                    subfamily: subfamily || null,
                    special: special || null,
                    search,
                    actorEchoKey,
                });

                const ownedKeys = collectOwnedPowerIdentityKeys(
                    (actor as any).items.filter((i: any) => i.type === 'power'),
                );
                const available = entries.filter((e) => !ownedKeys.has(powerIdentityKeyFromEntry(e)));

                $powerSelect.empty();
                if (available.length === 0) {
                    $powerSelect.append('<option value="">-- No matching powers --</option>');
                } else {
                    $powerSelect.append('<option value="">-- Select a Power --</option>');
                    for (const e of available) {
                        const badges: string[] = [];
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
                const skipped = entries.length - available.length;
                const base = `${available.length} available`;
                const suffix = skipped > 0
                    ? ` (${skipped} already on character)`
                    : ` (${entries.length} match filter)`;
                $count.text(`${base}${suffix}`);
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
                const rankVal = $rankSelect.length
                    ? Math.max(1, Math.min(16, parseInt(String($rankSelect.val() || '1'), 10) || 1))
                    : 2;
                const castingTn = calculateBaseTN(rankVal);
                $spellHint.html(
                    `<strong>Spell attack:</strong> Roll your casting attribute (keep = Mastery Rank) vs <strong>Casting TN ${castingTn}</strong> ` +
                        `(8×⌈Spell Level÷2⌉ at Spell Level <strong>${rankVal}</strong>). ` +
                        `<strong>Declared Raises</strong> before the roll add +4 each to that TN. ` +
                        `<strong>Raises</strong> after a successful hit can improve damage, special potency, Range, AoE, and other riders (per spell rules).`,
                );
            };

            $categorySelect.on('change', () => {
                refreshSubfamilyDropdown();
                refreshActiveOnlyVisibility();
                refreshSpecialDropdown();
                refreshList();
            });
            $subfamilySelect.on('change', () => {
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
                renderEntryDetails(entry, $description, $levelTable);
                $details.show();
                refreshSpellEligibility(entry);

                const template = findTemplateById(entry.templateId);
                refreshSpellPanelDefaults(template);
                updatePcSpellRulesHint();
            });

            // Initial boot
            refreshSubfamilyDropdown();
            refreshActiveOnlyVisibility();
            refreshSpecialDropdown();
            refreshList();
            updatePcSpellRulesHint();
        },
    }, { width: 920, height: 720, resizable: true });

    dialog.render(true);
}

/** Render the description + level table of a catalog entry into the dialog. */
function renderEntryDetails(entry: CatalogEntry, $description: JQuery, $levelTable: JQuery): void {
    const raw: any = entry.raw;
    $description.text(raw.description || raw.fluff || '');
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l: any) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger, entry.chosenSpecial?.key));
    } else {
        $levelTable.empty();
    }
}
