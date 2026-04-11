/**
 * Dialog: choose Minor Expressions (cantrips) per attribute view, capped by Mastery Rank globally, attribute ≥ 8.
 */
import { MINOR_EXPRESSION_MIN_ATTRIBUTE, listMinorExpressionsByAttribute, sanitizeMinorExpressionIds, tierBodyForExpression } from '../utils/minor-expressions.js';
const ATTR_LABEL = {
    might: 'Might',
    agility: 'Agility',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence'
};
function idsForAttribute(attr) {
    return new Set(listMinorExpressionsByAttribute(attr).map((d) => d.id));
}
function buildSingleAttributeSection(attr, val, defs, selected) {
    const eligible = val >= MINOR_EXPRESSION_MIN_ATTRIBUTE;
    let html = `<div class="minor-expressions-dialog-inner">`;
    html += `<section class="me-attr-section" id="me-section-${attr}" data-attr="${attr}">`;
    html += `<h4 class="me-attr-heading">${ATTR_LABEL[attr]} <span class="me-attr-value">(${val})</span></h4>`;
    if (!eligible) {
        html += `<p class="me-attr-locked">Minor Expressions für dieses Attribut ab Wert ${MINOR_EXPRESSION_MIN_ATTRIBUTE} verfügbar.</p>`;
    }
    for (const def of defs) {
        const checked = selected.has(def.id) ? 'checked' : '';
        const disabled = eligible ? '' : 'disabled';
        const body = tierBodyForExpression(def, val);
        html += `
        <label class="me-row ${eligible ? '' : 'me-row--disabled'}">
          <input type="checkbox" class="me-pick" name="me" value="${def.id}" ${checked} ${disabled} />
          <span class="me-row-body">
            <span class="me-name">${def.name}</span>
            <span class="me-tagline">${def.tagline}</span>
            <span class="me-tier-text">${body}</span>
          </span>
        </label>`;
    }
    html += `</section></div>`;
    return html;
}
function countLocalChecked(root) {
    return root.find('.me-pick:checked:not(:disabled)').length;
}
export async function showMinorExpressionsDialog(actor, options) {
    const focusAttribute = options.focusAttribute;
    const system = actor.system || {};
    const mr = Math.max(0, Math.floor(Number(system.mastery?.rank) || 0));
    const attrs = system.attributes || {};
    const getVal = (k) => Math.floor(Number(attrs[k]?.value) || 0);
    const rawIds = Array.isArray(system.minorExpressions) ? [...system.minorExpressions] : [];
    const sanitized = sanitizeMinorExpressionIds(rawIds, (key) => getVal(key), mr);
    const attrIds = idsForAttribute(focusAttribute);
    const picksFromOtherAttrs = sanitized.filter((id) => !attrIds.has(id));
    const val = getVal(focusAttribute);
    const defs = listMinorExpressionsByAttribute(focusAttribute);
    const selected = new Set(sanitized);
    const initialTotal = picksFromOtherAttrs.length + defs.filter((d) => selected.has(d.id)).length;
    const content = `
    <p class="me-slots-summary"><strong><span id="me-count">${initialTotal}</span></strong> von <strong>${mr}</strong> ausgewählt</p>
    <p class="me-hint">Minor Expressions unterstützen und färben — sie ersetzen keine Powers.</p>
    ${buildSingleAttributeSection(focusAttribute, val, defs, selected)}
  `;
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: `Minor Expressions — ${ATTR_LABEL[focusAttribute]}`,
            content,
            buttons: {
                save: {
                    label: 'Speichern',
                    icon: '<i class="fas fa-save"></i>',
                    callback: async (html) => {
                        const checkedHere = [];
                        html.find('.me-pick:checked:not(:disabled)').each(function () {
                            const v = $(this).val() || '';
                            if (v)
                                checkedHere.push(v);
                        });
                        const merged = [...checkedHere, ...picksFromOtherAttrs];
                        const cleaned = sanitizeMinorExpressionIds(merged, (key) => getVal(key), mr);
                        const prev = JSON.stringify(sanitized);
                        const next = JSON.stringify(cleaned);
                        if (prev !== next && sanitized.length > cleaned.length) {
                            globalThis.ui?.notifications?.info('Minor Expressions wurden an Mastery Rank oder Attributwerte angepasst.');
                        }
                        await actor.update({ 'system.minorExpressions': cleaned });
                        resolve();
                    }
                },
                cancel: {
                    label: 'Abbrechen',
                    callback: () => resolve()
                }
            },
            default: 'save',
            render: (html) => {
                const $html = html instanceof HTMLElement ? $(html) : $(html);
                const $root = $html.closest('.window-app.dialog');
                $root.addClass('mastery-system minor-expressions-dialog-app');
                const syncCount = () => {
                    const local = countLocalChecked($html);
                    const total = picksFromOtherAttrs.length + local;
                    $html.find('#me-count').text(String(total));
                };
                $html.find('.me-pick').on('change', function () {
                    const $cb = $(this);
                    if (!$cb.is(':checked')) {
                        syncCount();
                        return;
                    }
                    const local = countLocalChecked($html);
                    const total = picksFromOtherAttrs.length + local;
                    if (total > mr) {
                        $cb.prop('checked', false);
                        globalThis.ui?.notifications?.warn(`Maximal ${mr} Auswahl${mr === 1 ? '' : 'en'} (Mastery Rank).`);
                    }
                    syncCount();
                });
                syncCount();
            }
        }, { width: 640, height: 520, resizable: true });
        dialog.render(true);
    });
}
//# sourceMappingURL=minor-expressions-dialog.js.map