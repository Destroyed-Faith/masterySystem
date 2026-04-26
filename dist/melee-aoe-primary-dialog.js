/**
 * Melee weapon AoE — pick the primary target (full payload) vs secondary targets (power AoE only).
 */
/**
 * Prompt for primary token when multiple hostiles are in the burst.
 * Returns `cancelled` if the user closes without confirming.
 * `primaryTokenId: null` = no primary (all targets take AoE-only damage — no attack roll path).
 */
export function promptMeleeAoePrimaryChoice(burstTokenIds, _attackerTokenId, _option) {
    if (burstTokenIds.length === 0) {
        return Promise.resolve('cancelled');
    }
    if (burstTokenIds.length === 1) {
        return Promise.resolve({ primaryTokenId: burstTokenIds[0] });
    }
    const esc = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const optionsHtml = burstTokenIds
        .map((id) => {
        const t = canvas?.tokens?.get?.(id);
        const name = t?.name ?? id;
        return `<option value="${id}">${esc(String(name))}</option>`;
    })
        .join('');
    return new Promise((resolve) => {
        new Dialog({
            title: 'Melee AoE — Primary target',
            content: `<p style="margin-bottom:0.5em">One attack roll is made against the <strong>primary</strong> target (full hit). Other enemies in the burst take only the power’s AoE damage after optional Body saves.</p>
        <label for="ms-aoe-primary" style="display:block;margin:0.35em 0 0.15em 0">Primary (fully in the AoE):</label>
        <select id="ms-aoe-primary" style="width:100%;margin-bottom:0.75em">${optionsHtml}</select>
        <p style="font-size:0.85em;opacity:0.85;margin:0">Pick <strong>(No primary)</strong> if nobody takes the direct hit — then only listed AoE damage applies to everyone (no attack roll).</p>
        <label for="ms-aoe-primary-none" style="display:flex;align-items:center;gap:0.35em;margin-top:0.35em">
          <input type="checkbox" id="ms-aoe-primary-none" />
          <span>No primary (AoE pressure only)</span>
        </label>`,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Confirm',
                    callback: (html) => {
                        const noPri = html.find('#ms-aoe-primary-none').is(':checked');
                        if (noPri) {
                            resolve({ primaryTokenId: null });
                            return;
                        }
                        const id = String(html.find('#ms-aoe-primary').val() || '').trim();
                        if (!id) {
                            resolve('cancelled');
                            return;
                        }
                        resolve({ primaryTokenId: id });
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => resolve('cancelled'),
                },
            },
            default: 'ok',
        }).render(true);
    });
}
//# sourceMappingURL=melee-aoe-primary-dialog.js.map