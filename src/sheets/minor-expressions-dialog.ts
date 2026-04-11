/**
 * Dialog: choose Minor Expressions (cantrips), capped by Mastery Rank, attribute ≥ 8.
 */

import {
  MINOR_EXPRESSION_ATTRIBUTES,
  MINOR_EXPRESSION_MIN_ATTRIBUTE,
  listMinorExpressionsByAttribute,
  sanitizeMinorExpressionIds,
  tierBodyForExpression,
  type MinorExpressionAttribute,
  type MinorExpressionDefinition
} from '../utils/minor-expressions.js';

const ATTR_LABEL: Record<MinorExpressionAttribute, string> = {
  might: 'Might',
  agility: 'Agility',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence'
};

function buildContent(
  defsByAttr: Record<MinorExpressionAttribute, MinorExpressionDefinition[]>,
  attrValues: Record<MinorExpressionAttribute, number>,
  selected: Set<string>,
  _focusAttribute?: MinorExpressionAttribute
): string {
  let html = `<div class="minor-expressions-dialog-inner">`;
  for (const attr of MINOR_EXPRESSION_ATTRIBUTES) {
    const val = attrValues[attr];
    const eligible = val >= MINOR_EXPRESSION_MIN_ATTRIBUTE;
    const sectionClass =
      _focusAttribute === attr ? 'me-attr-section me-attr-section--focus' : 'me-attr-section';
    html += `<section class="${sectionClass}" id="me-section-${attr}" data-attr="${attr}">`;
    html += `<h4 class="me-attr-heading">${ATTR_LABEL[attr]} <span class="me-attr-value">(${val})</span></h4>`;
    if (!eligible) {
      html += `<p class="me-attr-locked">Minor Expressions für dieses Attribut ab Wert ${MINOR_EXPRESSION_MIN_ATTRIBUTE} verfügbar.</p>`;
    }
    for (const def of defsByAttr[attr]) {
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
    html += `</section>`;
  }
  html += `</div>`;
  return html;
}

function countChecked(root: JQuery): number {
  return root.find('.me-pick:checked:not(:disabled)').length;
}

export async function showMinorExpressionsDialog(
  actor: any,
  options?: { focusAttribute?: MinorExpressionAttribute }
): Promise<void> {
  const system = actor.system || {};
  const mr = Math.max(0, Math.floor(Number(system.mastery?.rank) || 0));
  const attrs = system.attributes || {};
  const getVal = (k: string) => Math.floor(Number(attrs[k]?.value) || 0);

  const attrValues = {
    might: getVal('might'),
    agility: getVal('agility'),
    intellect: getVal('intellect'),
    resolve: getVal('resolve'),
    influence: getVal('influence')
  } as Record<MinorExpressionAttribute, number>;

  const rawIds: string[] = Array.isArray(system.minorExpressions) ? [...system.minorExpressions] : [];
  const sanitized = sanitizeMinorExpressionIds(
    rawIds,
    (key) => getVal(key),
    mr
  );

  const defsByAttr = {} as Record<MinorExpressionAttribute, MinorExpressionDefinition[]>;
  for (const a of MINOR_EXPRESSION_ATTRIBUTES) {
    defsByAttr[a] = listMinorExpressionsByAttribute(a);
  }

  const selected = new Set(sanitized);
  let content = `
    <p class="me-slots-summary">Ausgewählt: <strong><span id="me-count">0</span></strong> / <strong>${mr}</strong> (Mastery Rank)</p>
    <p class="me-hint">Minor Expressions unterstützen, färben und geben kleine Vorteile — sie ersetzen keine Powers.</p>
    ${buildContent(defsByAttr, attrValues, selected, options?.focusAttribute)}
`;


  return new Promise((resolve) => {
    const dialog = new Dialog(
      {
        title: 'Minor Expressions',
        content,
        buttons: {
          save: {
            label: 'Speichern',
            icon: '<i class="fas fa-save"></i>',
            callback: async (html: JQuery) => {
              const picks: string[] = [];
              html.find('.me-pick:checked:not(:disabled)').each(function () {
                const v = ($(this).val() as string) || '';
                if (v) picks.push(v);
              });
              const cleaned = sanitizeMinorExpressionIds(picks, (key) => getVal(key), mr);
              const prev = JSON.stringify(sanitized);
              const next = JSON.stringify(cleaned);
              if (prev !== next && sanitized.length > cleaned.length) {
                (globalThis as any).ui?.notifications?.info(
                  'Minor Expressions wurden an Mastery Rank oder Attributwerte angepasst.'
                );
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
        render: (html: JQuery) => {
          const $html = html instanceof HTMLElement ? $(html) : $(html as any);
          const $root = $html.closest('.window-app.dialog');
          $root.addClass('mastery-system minor-expressions-dialog-app');

          const syncCount = () => {
            const n = countChecked($html);
            $html.find('#me-count').text(String(n));
          };

          $html.find('.me-pick').on('change', function () {
            const $cb = $(this);
            if (!$cb.is(':checked')) {
              syncCount();
              return;
            }
            if (countChecked($html) > mr) {
              $cb.prop('checked', false);
              (globalThis as any).ui?.notifications?.warn(
                `Maximal ${mr} Minor Expression${mr === 1 ? '' : 's'} (Mastery Rank).`
              );
            }
            syncCount();
          });
          syncCount();
          if (options?.focusAttribute) {
            setTimeout(() => {
              $html.find(`#me-section-${options.focusAttribute}`).get(0)?.scrollIntoView({ block: 'nearest' });
            }, 50);
          }
        }
      } as any,
      { width: 640, height: 520, resizable: true } as any
    );
    dialog.render(true);
  });
}
