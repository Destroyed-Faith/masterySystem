/**
 * Dialog: choose Minor Expressions (cantrips) per attribute view, capped by Mastery Rank globally, attribute ≥ 8.
 * New picks cost Faith Fractures (1 per added expression); removing refunds 1 per removed (when pool max > 0).
 */

import {
  MINOR_EXPRESSION_MIN_ATTRIBUTE,
  MINOR_EXPRESSION_TIERS,
  getMinorExpressionDefinition,
  isTierUnlocked,
  listMinorExpressionsByAttribute,
  minorExpressionPickDelta,
  sanitizeMinorExpressionIds,
  tierBodyForExpression,
  tierThresholdForAttributeValue,
  type MinorExpressionAttribute,
  type MinorExpressionDefinition,
  type MinorExpressionTier
} from '../utils/minor-expressions.js';

const ATTR_LABEL: Record<MinorExpressionAttribute, string> = {
  might: 'Might',
  agility: 'Agility',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits'
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tierScaleBlock(def: MinorExpressionDefinition, attrVal: number, eligible: boolean): string {
  if (!eligible) return '';
  const currentTier = tierThresholdForAttributeValue(attrVal);
  const defaultTier: MinorExpressionTier = currentTier ?? 8;
  const options = MINOR_EXPRESSION_TIERS.map((t) => {
    const sel = t === defaultTier ? ' selected' : '';
    const unlocked = isTierUnlocked(attrVal, t);
    const hint = unlocked ? '' : ` — gesperrt bis Attribut ${t}`;
    return `<option value="${t}"${sel}>Stufe ${t}${hint}</option>`;
  }).join('');
  const previewText = escapeHtml(def.tiers[defaultTier]);
  const lockedClass = isTierUnlocked(attrVal, defaultTier) ? '' : ' me-tier-scale-preview--locked';
  return `
    <div class="me-tier-scale-block">
      <label class="me-tier-scale-label">Stufen (Vorschau)</label>
      <select class="me-tier-scale" data-attr-val="${attrVal}" aria-label="Stufen für ${escapeHtml(def.name)}">
        ${options}
      </select>
      <p class="me-tier-scale-preview${lockedClass}">${previewText}</p>
    </div>`;
}

function idsForAttribute(attr: MinorExpressionAttribute): Set<string> {
  return new Set(listMinorExpressionsByAttribute(attr).map((d) => d.id));
}

function buildSingleAttributeSection(
  attr: MinorExpressionAttribute,
  val: number,
  defs: MinorExpressionDefinition[],
  selected: Set<string>
): string {
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
    const constraints = def.constraints
      ? `<p class="me-constraints">${escapeHtml(def.constraints)}</p>`
      : '';
    html += `
        <div class="me-row-wrap ${eligible ? '' : 'me-row-wrap--disabled'}">
        <label class="me-row ${eligible ? '' : 'me-row--disabled'}">
          <input type="checkbox" class="me-pick" name="me" value="${def.id}" ${checked} ${disabled} />
          <span class="me-row-body">
            <span class="me-name">${escapeHtml(def.name)}</span>
            <span class="me-tagline">${escapeHtml(def.tagline)}</span>
            ${constraints}
            <span class="me-tier-text"><strong>Aktuell:</strong> ${escapeHtml(body)}</span>
          </span>
        </label>
        ${tierScaleBlock(def, val, eligible)}
        </div>`;
  }
  html += `</section></div>`;
  return html;
}

function countLocalChecked(root: JQuery): number {
  return root.find('.me-pick:checked:not(:disabled)').length;
}

export async function showMinorExpressionsDialog(
  actor: any,
  options: { focusAttribute: MinorExpressionAttribute }
): Promise<void> {
  const focusAttribute = options.focusAttribute;
  const system = actor.system || {};
  const mr = Math.max(0, Math.floor(Number(system.mastery?.rank) || 0));
  const attrs = system.attributes || {};
  const getVal = (k: string) => Math.floor(Number(attrs[k]?.value) || 0);

  const rawIds: string[] = Array.isArray(system.minorExpressions) ? [...system.minorExpressions] : [];
  const sanitized = sanitizeMinorExpressionIds(rawIds, (key) => getVal(key), mr);

  const attrIds = idsForAttribute(focusAttribute);
  const picksFromOtherAttrs = sanitized.filter((id) => !attrIds.has(id));

  const val = getVal(focusAttribute);
  const defs = listMinorExpressionsByAttribute(focusAttribute);
  const selected = new Set(sanitized);

  const initialTotal = picksFromOtherAttrs.length + defs.filter((d) => selected.has(d.id)).length;

  const faithMax = Math.max(0, Math.floor(Number(system.faithFractures?.maximum) || 0));
  const faithCur = Math.max(0, Math.floor(Number(system.faithFractures?.current) || 0));
  const faithLine =
    faithMax > 0
      ? `<p class="me-faith-line">Faith Fractures: <strong id="me-faith-cur">${faithCur}</strong> / ${faithMax} · Neue Auswahl kostet je <strong>1</strong>, Entfernen erstattet <strong>1</strong>.</p>`
      : `<p class="me-faith-line me-faith-line--na">Kein Faith-Fracture-Pool — keine Kosten für Minor Expressions.</p>`;

  const content = `
    <p class="me-slots-summary"><strong><span id="me-count">${initialTotal}</span></strong> von <strong>${mr}</strong> ausgewählt</p>
    ${faithLine}
    <p class="me-hint">Minor Expressions unterstützen und färben — sie ersetzen keine Powers.</p>
    ${buildSingleAttributeSection(focusAttribute, val, defs, selected)}
  `;

  return new Promise((resolve) => {
    const dialog = new Dialog(
      {
        title: `Minor Expressions — ${ATTR_LABEL[focusAttribute]}`,
        content,
        buttons: {
          save: {
            label: 'Speichern',
            icon: '<i class="fas fa-save"></i>',
            callback: async (html: JQuery) => {
              const checkedHere: string[] = [];
              html.find('.me-pick:checked:not(:disabled)').each(function () {
                const v = ($(this).val() as string) || '';
                if (v) checkedHere.push(v);
              });
              const merged = [...checkedHere, ...picksFromOtherAttrs];
              const cleaned = sanitizeMinorExpressionIds(merged, (key) => getVal(key), mr);
              const prev = JSON.stringify(sanitized);
              const next = JSON.stringify(cleaned);
              if (prev !== next && sanitized.length > cleaned.length) {
                (globalThis as any).ui?.notifications?.info(
                  'Minor Expressions wurden an Mastery Rank oder Attributwerte angepasst.'
                );
              }

              const { added, removed } = minorExpressionPickDelta(sanitized, cleaned);
              const freshSys = actor.system || {};
              const fMax = Math.max(0, Math.floor(Number(freshSys.faithFractures?.maximum) || 0));
              const fCur = Math.max(0, Math.floor(Number(freshSys.faithFractures?.current) || 0));

              if (fMax > 0) {
                const newCur = fCur + removed - added;
                if (newCur < 0) {
                  (globalThis as any).ui?.notifications?.warn(
                    `Nicht genug Faith Fractures: ${added} neue Auswahl${added === 1 ? '' : 'en'}, dabei ${removed} entfernt — es fehlen ${Math.abs(
                      newCur
                    )} (aktuell ${fCur}).`
                  );
                  return false;
                }
                const clamped = Math.min(fMax, Math.max(0, newCur));
                await actor.update({
                  'system.minorExpressions': cleaned,
                  'system.faithFractures.current': clamped
                });
              } else {
                await actor.update({ 'system.minorExpressions': cleaned });
              }
              resolve();
              return true;
            }
          },
          cancel: {
            label: 'Abbrechen',
            callback: () => resolve()
          }
        },
        default: 'save',
        render: (html: JQuery) => {
          const $html = html instanceof HTMLElement ? $(html) : $(html as any);
          const $root = $html.closest('.window-app.dialog');
          $root.addClass('mastery-system minor-expressions-dialog-app');

          const syncTierPreview = ($select: JQuery) => {
            const attrVal = Math.floor(Number($select.data('attr-val')) || 0);
            const tier = Number($select.val()) as MinorExpressionTier;
            const $preview = $select.closest('.me-tier-scale-block').find('.me-tier-scale-preview');
            const defId = String($select.closest('.me-row-wrap').find('.me-pick').val() || '');
            const def = getMinorExpressionDefinition(defId);
            if (!def || !MINOR_EXPRESSION_TIERS.includes(tier)) return;
            $preview.text(def.tiers[tier]);
            $preview.toggleClass('me-tier-scale-preview--locked', !isTierUnlocked(attrVal, tier));
          };

          $html.find('.me-tier-scale').each(function () {
            syncTierPreview($(this));
          });

          $html.find('.me-tier-scale').on('change', function () {
            syncTierPreview($(this));
          });

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
              (globalThis as any).ui?.notifications?.warn(
                `Maximal ${mr} Auswahl${mr === 1 ? '' : 'en'} (Mastery Rank).`
              );
            }
            syncCount();
          });
          syncCount();
        }
      } as any,
      { width: 640, height: 520, resizable: true } as any
    );
    dialog.render(true);
  });
}
