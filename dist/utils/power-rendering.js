/**
 * Power Rendering Utilities
 * Helper functions to render power data in the UI
 */
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
/**
 * Render PowerSpecial array to a human-readable string
 */
export function renderSpecials(specials) {
    if (!specials || specials.length === 0) {
        return '—';
    }
    return specials.map(spec => {
        if (spec.value !== undefined) {
            return `${spec.key}(${spec.value})${spec.note ? ` ${spec.note}` : ''}`;
        }
        return spec.key + (spec.note ? ` ${spec.note}` : '');
    }).join(', ');
}
/**
 * Render a PowerLevelRow to a table row HTML
 */
export function renderPowerLevelRow(levelRow, level) {
    const type = levelRow.type || '—';
    const range = renderRange(levelRow.range);
    const aoe = renderAoe(levelRow.aoe);
    const duration = renderDuration(levelRow.duration);
    const effect = levelRow.effect?.text || '—';
    const specials = renderSpecials(levelRow.specials || []);
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
/**
 * Render a power level table with all 4 levels
 */
export function renderPowerLevelTable(levels, showTrigger = false) {
    let html = '<table class="power-level-table">';
    html += '<thead><tr>';
    html += '<th>Level</th>';
    html += '<th>Type</th>';
    html += '<th>Range</th>';
    html += '<th>AoE</th>';
    html += '<th>Duration</th>';
    html += '<th>Effect</th>';
    html += '<th>Specials</th>';
    if (showTrigger) {
        html += '<th>Trigger</th>';
    }
    html += '</tr></thead>';
    html += '<tbody>';
    for (const levelKey of ['1', '2', '3', '4']) {
        const level = parseInt(levelKey);
        const levelRow = levels[levelKey];
        if (levelRow) {
            html += renderPowerLevelRow(levelRow, level);
        }
    }
    html += '</tbody></table>';
    return html;
}
//# sourceMappingURL=power-rendering.js.map