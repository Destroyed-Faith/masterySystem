/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / weapon-attack / …)
 *   Stage 3: Special + free-text search
 *     - Special dropdown lists every Special the current filter can resolve
 *       (poisoned, hex, prone, frightened, blinded, regeneration, shock, …)
 *       — Tier is NOT a player-facing search axis (Tier is an internal
 *       pricing bucket only).
 *     - Pure weapon/illusion Actives (no Special slot) surface via
 *       Category + Subfamily alone and ignore the Special filter.
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle, the casting attribute (Intellect/Resolve),
 * and resolution (attack vs save). Save family for save spells is taken from
 * the chosen Special's data in `special-effects.ts`, then `spellHints.defaultSaveType`.
 */
import { calculateBaseTN, calculateSaveDC } from '../combat/spell-roll-handler.js';
import { SPECIAL_EFFECTS_BY_ID } from '../utils/special-effects.js';
import { renderRange, renderAoe, renderDuration, renderPowerLevelTable } from '../utils/power-rendering.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, CREATION_POWER_REQUIREMENTS, filterCatalog, findCatalogEntryByName, findTemplateById, getSubfamiliesByCategory, getVisibleSpecialOptions, } from '../utils/power-catalog.js';
/** How many powers of a given category the actor already owns. */
function countByCategory(actor) {
    const counts = {
        active: 0,
        activeBuff: 0,
        movement: 0,
        reaction: 0,
        passive: 0,
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
/** Map Special Effect `save` text to a single save family for spell items. */
function spellSaveTypeFromSpecialSave(save) {
    if (!save)
        return undefined;
    const t = String(save).trim();
    if (t === '—' || t === '-' || t.toLowerCase() === 'none')
        return undefined;
    const low = t.toLowerCase();
    if (low.includes('body'))
        return 'body';
    if (low.includes('mind'))
        return 'mind';
    if (low.includes('spirit'))
        return 'spirit';
    return undefined;
}
/**
 * Save spell family: chosen Special first (Body/Mind/Spirit from effect ref),
 * else template `spellHints.defaultSaveType`, else Body.
 */
export function resolveSpellSaveTypeForEntry(entry, template) {
    const key = entry.chosenSpecial?.key;
    if (key) {
        const eff = SPECIAL_EFFECTS_BY_ID.get(key);
        const fromSpec = spellSaveTypeFromSpecialSave(eff?.save);
        if (fromSpec)
            return fromSpec;
    }
    const d = template?.spellHints?.defaultSaveType;
    if (d === 'body' || d === 'mind' || d === 'spirit')
        return d;
    return 'body';
}
/** Friendly label for a subfamily key. */
function labelSubfamily(key) {
    return key
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}
/**
 * Show the template-based Power picker.
 */
export async function showPowerCreationDialog(actor, options) {
    const system = actor.system;
    const creationComplete = system?.creation?.complete !== false;
    const masteryRank = system?.mastery?.rank || 2;
    const actorEchoKey = system?.echo?.key || null;
    const maxSpellLevel = masteryRank * 2;
    const categoryOptions = CATEGORY_ORDER.map((c) => `<option value="${c}"${options?.presetCategory === c ? ' selected' : ''}>${CATEGORY_LABELS[c]}</option>`).join('');
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
              <option value="spellAttack">Spell Attack (vs Evade)</option>
              <option value="saveSpell">Save Spell (vs Save DC)</option>
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
        <div class="power-form-static">Rank 2 <span style="color:#888;">(fixed during character creation)</span></div>
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
                    const entry = findCatalogEntryByName(selectedName);
                    if (!entry) {
                        ui.notifications?.error('Power not found in catalog');
                        return false;
                    }
                    // During character creation, all powers are bought at
                    // Rank 2 (per v0.5.9 design update). Post-creation, the
                    // player picks the rank explicitly (≤ Mastery Rank).
                    const rank = creationComplete
                        ? parseInt($html.find('#pc-rank').val() || '1')
                        : 2;
                    const isSpell = entry.category === 'active' && !!$html.find('#pc-is-spell').prop('checked');
                    const castingAttribute = isSpell
                        ? ($html.find('#pc-casting-attr').val() || 'intellect')
                        : undefined;
                    const spellResolution = isSpell
                        ? ($html.find('#pc-resolution').val() || 'spellAttack')
                        : undefined;
                    if (isSpell && rank > maxSpellLevel) {
                        ui.notifications?.error(`Spell Level ${rank} exceeds Max Spell Level for this character (MR ${masteryRank} × 2 = ${maxSpellLevel}).`);
                        return false;
                    }
                    const itemData = buildItemDataFromEntry(entry, rank, { isSpell, castingAttribute, spellResolution });
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
                        'min-width': '640px',
                        'max-width': '980px',
                    });
                    const contentElement = dialogElement.find('.window-content');
                    if (contentElement.length) {
                        contentElement.css({
                            height: 'auto',
                            'max-height': 'calc(90vh - 100px)',
                            'overflow-y': 'auto',
                        });
                    }
                }
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
                const category = $categorySelect.val() || '';
                $subfamilySelect.empty();
                $subfamilySelect.append('<option value="">-- Any Subfamily --</option>');
                if (!category)
                    return;
                for (const sub of getSubfamiliesByCategory(category)) {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = labelSubfamily(sub);
                    $subfamilySelect.append(opt);
                }
            };
            const refreshActiveOnlyVisibility = () => {
                const category = $categorySelect.val() || '';
                const isActive = category === 'active';
                $specialWrap.toggle(isActive);
                $spellPanel.toggle(isActive);
                if (!isActive) {
                    $specialSelect.val('');
                    $isSpell.prop('checked', false);
                    $spellFields.hide();
                }
            };
            const refreshSpecialDropdown = () => {
                const category = $categorySelect.val() || '';
                const subfamily = $subfamilySelect.val() || '';
                const prev = $specialSelect.val() || '';
                const opts = getVisibleSpecialOptions({
                    category: (category || null),
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
                if (prev && opts.some((o) => o.key === prev))
                    $specialSelect.val(prev);
            };
            const refreshList = () => {
                const category = $categorySelect.val() || '';
                const subfamily = $subfamilySelect.val() || '';
                const special = $specialSelect.val() || '';
                const search = $searchInput.val() || '';
                const entries = filterCatalog({
                    category: (category || null),
                    subfamily: subfamily || null,
                    special: special || null,
                    search,
                    actorEchoKey,
                });
                $powerSelect.empty();
                if (entries.length === 0) {
                    $powerSelect.append('<option value="">-- No matching powers --</option>');
                }
                else {
                    $powerSelect.append('<option value="">-- Select a Power --</option>');
                    for (const e of entries) {
                        const badges = [];
                        if (e.chosenSpecial)
                            badges.push(e.chosenSpecial.key);
                        const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
                        const label = `${e.templateName}${badgeStr} · ${labelSubfamily(e.subfamily)} [${CATEGORY_LABELS[e.category]}]`;
                        const opt = document.createElement('option');
                        opt.value = e.name;
                        opt.textContent = label;
                        opt.dataset.templateId = e.templateId;
                        $powerSelect.append(opt);
                    }
                }
                $count.text(`${entries.length} power${entries.length === 1 ? '' : 's'} match the current filter`);
                $details.hide();
                $description.empty();
                $levelTable.empty();
                updatePcSpellRulesHint();
            };
            const refreshSpellPanelDefaults = (template) => {
                if (!template || !template.spellHints)
                    return;
                $resolution.val(template.spellHints.defaultResolution);
            };
            const updatePcSpellRulesHint = () => {
                if (!$spellHint.length)
                    return;
                const showSpell = $isSpell.prop('checked') && $categorySelect.val() === 'active';
                if (!showSpell) {
                    $spellHint.text('');
                    return;
                }
                const rankVal = creationComplete && $rankSelect.length
                    ? Math.max(1, Math.min(16, parseInt(String($rankSelect.val() || '1'), 10) || 1))
                    : 2;
                const castingTn = calculateBaseTN(rankVal);
                const saveDc = calculateSaveDC(masteryRank);
                const res = $resolution.val() || 'spellAttack';
                const powerName = $powerSelect.val() || '';
                const ent = powerName ? findCatalogEntryByName(powerName) : undefined;
                const tmpl = ent ? findTemplateById(ent.templateId) : undefined;
                const inferredSave = res === 'saveSpell' && ent ? resolveSpellSaveTypeForEntry(ent, tmpl) : null;
                if (res === 'spellAttack') {
                    $spellHint.html(`<strong>Spell attack:</strong> Roll your casting attribute (keep = Mastery Rank) vs <strong>Casting TN ${castingTn}</strong> ` +
                        `(8×⌈Spell Level÷2⌉ at Spell Level <strong>${rankVal}</strong>). ` +
                        `<strong>Declared Raises</strong> before the roll add +4 each to that TN. ` +
                        `<strong>Raises</strong> after a successful hit can improve damage, special potency, Range, AoE, and other riders (per spell rules).`);
                }
                else {
                    const saveLine = inferredSave
                        ? `Targets roll a <strong>${inferredSave.charAt(0).toUpperCase() + inferredSave.slice(1)}</strong> save (from this power’s Special); no separate picker needed.`
                        : '';
                    $spellHint.html(`<strong>Casting roll TN</strong> for your pool vs success is <strong>${castingTn}</strong> ` +
                        `(8×⌈Spell Level÷2⌉ at Spell Level <strong>${rankVal}</strong> — in steps of 8 every two levels: 8, 16, 24, …). ` +
                        `<strong>Save DC</strong> targets must beat is <strong>${saveDc}</strong> (8× your Mastery Rank, MR <strong>${masteryRank}</strong>). ` +
                        `Raises after the casting roll can improve damage, the special, Range, AoE, etc. ${saveLine}`);
                }
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
                $spellFields.toggle($isSpell.prop('checked'));
                updatePcSpellRulesHint();
            });
            $resolution.on('change', updatePcSpellRulesHint);
            $castingAttr.on('change', updatePcSpellRulesHint);
            $rankSelect.on('change', updatePcSpellRulesHint);
            $powerSelect.on('change', function () {
                const name = $(this).val() || '';
                if (!name) {
                    $details.hide();
                    return;
                }
                const entry = findCatalogEntryByName(name);
                if (!entry) {
                    $details.hide();
                    return;
                }
                renderEntryDetails(entry, $description, $levelTable);
                $details.show();
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
    });
    dialog.render(true);
}
/** Render the description + level table of a catalog entry into the dialog. */
function renderEntryDetails(entry, $description, $levelTable) {
    const raw = entry.raw;
    $description.text(raw.description || raw.fluff || '');
    if (raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels)) {
        const showTrigger = raw.category === 'reaction' || Object.values(raw.levels).some((l) => l?.trigger);
        $levelTable.html(renderPowerLevelTable(raw.levels, showTrigger));
    }
    else {
        $levelTable.empty();
    }
}
/** Build the full item data object for `actor.createEmbeddedDocuments`. */
function buildItemDataFromEntry(entry, rank, spell) {
    const template = entry.raw;
    const templateDoc = findTemplateById(entry.templateId);
    let spellSaveType;
    if (spell.isSpell && spell.spellResolution === 'saveSpell') {
        spellSaveType = resolveSpellSaveTypeForEntry(entry, templateDoc);
    }
    const chosenSpecial = entry.chosenSpecial
        ? { key: entry.chosenSpecial.key, tier: entry.chosenSpecial.tier }
        : undefined;
    const levelKey = (String(rank));
    const levelRow = template.levels?.[levelKey];
    if (!levelRow) {
        ui.notifications?.error(`Rank ${rank} data not found for this power`);
        return null;
    }
    // If an Active has a chosenSpecial, bind the placeholder "SPECIAL" entry in
    // the levels to the chosen key (so the persisted item's levels reflect the
    // variation the user actually picked).
    let levels = template.levels;
    if (chosenSpecial) {
        const next = {};
        for (const [k, row] of Object.entries(template.levels)) {
            const specials = (row.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: chosenSpecial.key } : s);
            next[k] = { ...row, specials };
        }
        levels = next;
    }
    return {
        name: entry.name,
        type: 'power',
        system: {
            category: template.category,
            tags: template.tags || [],
            rank,
            level: rank,
            minLevel: 1,
            fluff: template.fluff || '',
            description: template.fluff || '',
            trigger: template.trigger || levelRow.trigger || undefined,
            cost: {
                action: template.cost?.action,
                stones: template.cost?.stones || 0,
                charges: template.cost?.charges || 0,
            },
            roll: {
                kind: template.roll?.kind,
                attribute: template.roll?.attribute || undefined,
                vs: template.roll?.vs || undefined,
            },
            levels,
            // Template metadata
            templateId: entry.templateId,
            templateName: entry.templateName,
            subfamily: entry.subfamily,
            chosenSpecial,
            // Active-as-Spell (plan §6)
            isSpell: spell.isSpell,
            castingAttribute: spell.castingAttribute,
            spellResolution: spell.spellResolution,
            spellSaveType,
            // Legacy surface (kept so the rest of the UI keeps rendering)
            powerType: template.category === 'activeBuff' ? 'buff' : template.category,
            range: renderRange(levelRow.range),
            aoe: renderAoe(levelRow.aoe),
            duration: renderDuration(levelRow.duration),
            effect: levelRow.effect?.text || '',
            specials: (levelRow.specials || []).map((s) => s.rank !== undefined ? `${s.key}(${s.rank})` : s.key),
            ap: 30,
        },
    };
}
//# sourceMappingURL=character-sheet-power-dialog.js.map