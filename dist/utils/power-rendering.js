/**
 * Power Rendering Utilities
 * Helper functions to render power data in the UI
 */
import { formatEffectReference, getEffectById, getEffectBaseName } from './special-effects.js';
import { getPowerDefinitionRank } from './power-definition-rank.js';
/**
 * Resolve specials / effect / range for the actor's current Power Level
 * (not the stale root `system.specials` which often stays at L1).
 */
export function resolvePowerSheetLevelDisplay(system, levelOverride) {
    const level = Math.max(1, Math.floor(Number(levelOverride ?? system?.level ?? system?.rank ?? 1) || 1));
    const levels = system?.levels;
    const definitionRank = getPowerDefinitionRank(level, levels);
    let row = null;
    if (levels && typeof levels === 'object' && !Array.isArray(levels)) {
        row = levels[String(definitionRank)] ?? null;
    }
    else if (Array.isArray(levels)) {
        row =
            levels.find((r) => Number(r?.level) === definitionRank) ??
                levels.find((r) => Number(r?.level) === level) ??
                null;
    }
    const specials = Array.isArray(row?.specials)
        ? row.specials
        : Array.isArray(system?.specials)
            ? system.specials
            : [];
    const rowAny = row;
    const effect = String(rowAny?.effectText ?? rowAny?.effect?.text ?? system?.effect ?? '');
    return {
        level,
        definitionRank,
        specials,
        specialsLabel: renderSpecials(specials, system?.chosenSpecialKey),
        effect,
        range: row?.range ?? system?.range,
        aoe: row?.aoe ?? system?.aoe,
        type: String(row?.type || system?.powerType || system?.category || ''),
    };
}
/** Radius-style AoE: definitions use either `radiusM` or legacy `m`. */
function aoeRadiusM(aoe) {
    return aoe.radiusM ?? aoe.m;
}
/** Cone / line length: `lengthM` or legacy `m` (e.g. old migration). */
function aoeLengthM(aoe) {
    return aoe.lengthM ?? aoe.m;
}
/**
 * Render a RangeSpec to a human-readable string
 */
export function renderRange(range) {
    if (!range) {
        return '—';
    }
    if (range.kind === 'self') {
        return 'Self';
    }
    if (range.kind === 'touch') {
        return 'Touch';
    }
    if (range.kind === 'distance') {
        if (range.m !== undefined) {
            return `${range.m}m${range.note ? ` (${range.note})` : ''}`;
        }
        return 'Distance';
    }
    return 'N/A';
}
/**
 * Render an AoeSpec to a human-readable string
 */
export function renderAoe(aoe) {
    if (!aoe) {
        return '—';
    }
    if (aoe.shape === 'none' || aoe.shape === 'single') {
        return '—';
    }
    if (aoe.shape === 'line') {
        const len = aoeLengthM(aoe);
        if (len !== undefined) {
            return `Line ${len}m${aoe.widthM ? ` × ${aoe.widthM}m` : ''}`;
        }
        return 'Line';
    }
    if (aoe.shape === 'radius') {
        const r = aoeRadiusM(aoe);
        if (r !== undefined) {
            return `Radius ${r}m`;
        }
        return 'Radius';
    }
    if (aoe.shape === 'cone') {
        const len = aoeLengthM(aoe);
        if (len !== undefined) {
            return `Cone ${len}m${aoe.angleDeg ? ` (${aoe.angleDeg}°)` : ''}`;
        }
        return 'Cone';
    }
    if (aoe.shape === 'burst') {
        const r = aoeRadiusM(aoe);
        if (r !== undefined) {
            return `Burst ${r}m`;
        }
        return 'Burst';
    }
    if (aoe.shape === 'weapon') {
        return 'Weapon';
    }
    if (aoe.shape === 'aura') {
        const r = aoeRadiusM(aoe);
        if (r !== undefined) {
            return `Aura ${r}m`;
        }
        return 'Aura';
    }
    return aoe.note || '—';
}
/**
 * Render a DurationSpec to a human-readable string
 */
export function renderDuration(duration) {
    if (duration.kind === 'instant') {
        return 'Instant';
    }
    if (duration.kind === 'rounds') {
        if (duration.rounds !== undefined) {
            return `${duration.rounds} Round${duration.rounds !== 1 ? 's' : ''}${duration.note ? ` (${duration.note})` : ''}`;
        }
        return 'Rounds';
    }
    if (duration.kind === 'masteryRankRounds') {
        return 'MR Rounds';
    }
    if (duration.kind === 'untilNextTurn') {
        return 'Until Next Turn';
    }
    return duration.note || 'N/A';
}
function titleSpecialKey(key) {
    return key
        .split(/[-_]/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function specialNumericValue(spec) {
    const raw = spec.rank ?? spec.value;
    if (raw === undefined || raw === null || raw === '')
        return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}
/** One special for power tables: Ruin(3), Root(2) — never a bare lowercase key. */
export function formatPowerSpecialLabel(spec, chosenKey) {
    if (spec == null)
        return '';
    if (typeof spec === 'string') {
        const s = spec.trim();
        if (!s)
            return '';
        const m = s.match(/^([^(]+)\((\d+)\)\s*$/);
        if (m) {
            return formatEffectReference({ specialId: m[1].trim().toLowerCase(), value: Number(m[2]) });
        }
        const effect = getEffectById(s.toLowerCase());
        return effect ? getEffectBaseName(effect.name) : titleSpecialKey(s);
    }
    let key = String(spec.key || spec.type || '').trim();
    if (!key)
        return '';
    if (key.toUpperCase() === 'SPECIAL' && chosenKey)
        key = String(chosenKey).trim();
    if (!key || key.toUpperCase() === 'SPECIAL')
        return '';
    const value = specialNumericValue(spec);
    const effect = getEffectById(key.toLowerCase());
    let label = effect
        ? formatEffectReference({ specialId: effect.id, value })
        : value !== undefined
            ? `${titleSpecialKey(key)}(${value})`
            : titleSpecialKey(key);
    if (effect?.hasValue && value === undefined) {
        label = `${getEffectBaseName(effect.name)}(X)`;
    }
    if (spec.note && !/bound at item-create/i.test(spec.note)) {
        label += ` ${spec.note}`;
    }
    return label;
}
/**
 * Render PowerSpecial array to a human-readable string (Ruin(3), Root(2), …).
 */
export function renderSpecials(specials, chosenKey) {
    if (!specials || !Array.isArray(specials) || specials.length === 0) {
        return '—';
    }
    const parts = specials.map((spec) => formatPowerSpecialLabel(spec, chosenKey)).filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
}
/**
 * Render a PowerLevelRow to a table row HTML
 */
export function renderPowerLevelRow(levelRow, level, chosenKey) {
    const type = levelRow.type || '—';
    const range = renderRange(levelRow.range);
    const aoe = renderAoe(levelRow.aoe);
    const duration = renderDuration(levelRow.duration);
    const effect = levelRow.effect?.text || '—';
    const specials = renderSpecials(levelRow.specials || [], chosenKey);
    const trigger = levelRow.trigger || '';
    let html = `<tr class="power-level-row" data-level="${level}">`;
    html += `<td class="power-level-cell">${level}</td>`;
    html += `<td class="power-type-cell">${type}</td>`;
    html += `<td class="power-range-cell">${range}</td>`;
    html += `<td class="power-aoe-cell">${aoe}</td>`;
    html += `<td class="power-duration-cell">${duration}</td>`;
    html += `<td class="power-effect-cell">${effect}</td>`;
    html += `<td class="power-specials-cell">${specials}</td>`;
    if (trigger) {
        html += `<td class="power-trigger-cell">${trigger}</td>`;
    }
    html += `</tr>`;
    return html;
}
const MAX_LEVEL_TABLE = 16;
/**
 * Render a power level table for every defined level 1..16 (rows only when data exists).
 */
/**
 * Selection-panel summary for Add/Replace Power dialogs.
 * Uses authoritative catalog level rows — does not invent rules text.
 */
export function renderCatalogSelectionDetailsHtml(entry, selectedLevel = 1) {
    const raw = entry.raw ?? {};
    const level = Math.max(1, Math.min(16, Math.floor(Number(selectedLevel) || 1)));
    const levels = raw.levels && typeof raw.levels === 'object' ? raw.levels : null;
    const row = levels?.[String(level)] ?? null;
    const canonical = String(entry.name || entry.templateName || '').trim();
    const fluff = String(raw.fluff || entry.description || '').trim();
    const effect = String(row?.effect?.text ?? row?.effectText ?? '').trim();
    let duration = '—';
    if (row?.duration) {
        const d = row.duration;
        duration =
            d.kind === 'masteryRankRounds'
                ? 'Mastery Rank complete Combat Rounds (ends at Round End)'
                : renderDuration(d);
    }
    const costAction = String(raw.cost?.action || '').toLowerCase();
    let activation = '—';
    if (entry.category === 'activeBuff' || String(raw.category || '') === 'activeBuff') {
        activation =
            costAction === 'attack'
                ? 'Preparation Phase — commit your base Attack Action for the upcoming Round'
                : 'Preparation Phase activation';
    }
    else if (costAction === 'attack') {
        activation = 'Attack Action';
    }
    else if (costAction === 'movement') {
        activation = 'Movement Action';
    }
    else if (costAction) {
        activation = costAction;
    }
    const restrictBits = [];
    const typeStr = String(row?.type || '').trim();
    if (typeStr && typeStr !== 'Active Buff')
        restrictBits.push(typeStr);
    const hay = `${fluff}\n${effect}`;
    const req = hay.match(/Requires[^.]*\./i);
    if (req)
        restrictBits.push(req[0].replace(/\*\*/g, '').trim());
    const unavailable = /unavailable|no effect at this/i.test(effect);
    if (unavailable) {
        restrictBits.push(`Power Level ${level} is unavailable or has no effect in the catalogue.`);
    }
    const esc = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const mdLite = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    let html = `<div class="pc-selection-summary">`;
    html += `<p class="pc-selection-name"><strong>${esc(canonical)}</strong></p>`;
    if (fluff)
        html += `<p class="pc-selection-fluff">${mdLite(fluff)}</p>`;
    html += `<p class="pc-selection-effect"><strong>Effect (Level ${level}):</strong> ${effect ? mdLite(effect) : '—'}</p>`;
    html += `<p class="pc-selection-duration"><strong>Duration:</strong> ${esc(duration)}</p>`;
    html += `<p class="pc-selection-activation"><strong>Activation:</strong> ${esc(activation)}</p>`;
    if (restrictBits.length) {
        html += `<p class="pc-selection-restrictions"><strong>Notes / Prerequisites:</strong> ${esc(restrictBits.join(' '))}</p>`;
    }
    html += `</div>`;
    return html;
}
export function renderPowerLevelTable(levels, showTrigger = false, chosenKey) {
    if (!levels || typeof levels !== 'object') {
        return '<p class="power-level-table-empty">—</p>';
    }
    let html = '<table class="power-level-table">';
    html += '<thead><tr>';
    html += '<th>Level</th>';
    html += '<th>Type</th>';
    html += '<th>Range</th>';
    html += '<th>AoE</th>';
    html += '<th>Duration</th>';
    html += '<th>Effect</th>';
    html += '<th>Special Effects</th>';
    if (showTrigger) {
        html += '<th>Trigger</th>';
    }
    html += '</tr></thead>';
    html += '<tbody>';
    for (let n = 1; n <= MAX_LEVEL_TABLE; n++) {
        const levelKey = String(n);
        const levelRow = levels[levelKey];
        if (levelRow) {
            html += renderPowerLevelRow(levelRow, n, chosenKey);
        }
    }
    html += '</tbody></table>';
    return html;
}
//# sourceMappingURL=power-rendering.js.map