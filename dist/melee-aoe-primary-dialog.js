/**
 * Melee weapon AoE — pick the primary target (full payload) vs secondary targets (power AoE only).
 */
/**
 * "Player side" for the ally filter: player characters always count (regardless
 * of the token's disposition — scenes often have misconfigured dispositions),
 * plus FRIENDLY-disposition tokens (companions, friendly NPCs, summons).
 */
function isPlayerSide(token) {
    const actor = token?.actor;
    if (!actor)
        return false;
    if (actor.type === 'character')
        return true;
    const d = token?.document?.disposition ?? token?.disposition;
    return d === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
}
/**
 * True when `token` counts as allied with the attacker for the AoE ally filter.
 * Deliberately NOT disposition-symmetric ("both hostile ⇒ allies" wrongly nuked
 * every target when all scene tokens carried the HOSTILE default): allies are
 * the attacker itself and — for a player-side attacker — everything else on
 * the player side. NPCs like a combat dummy are never filtered out.
 */
function isAlliedWithAttacker(attackerToken, token) {
    const attackerActor = attackerToken?.actor;
    const targetActor = token?.actor;
    if (!attackerActor || !targetActor)
        return false;
    if (attackerActor.id === targetActor.id)
        return true;
    return isPlayerSide(attackerToken) && isPlayerSide(token);
}
/**
 * Prompt for primary token when multiple hostiles are in the burst.
 * Returns `cancelled` if the user closes without confirming.
 * `primaryTokenId: null` = no primary (all targets take AoE-only damage — no attack roll path).
 *
 * The dialog carries a pre-checked "Exclude allies/players" filter: allied
 * tokens are removed from the primary dropdown AND from the effective burst
 * pool (secondaries). Unchecking re-allows friendly fire.
 */
export function promptMeleeAoePrimaryChoice(burstTokenIds, attackerTokenId, _option) {
    if (burstTokenIds.length === 0) {
        return Promise.resolve('cancelled');
    }
    const attackerToken = canvas?.tokens?.get?.(attackerTokenId);
    const allyIds = new Set(burstTokenIds.filter((id) => {
        const t = canvas?.tokens?.get?.(id);
        return t ? isAlliedWithAttacker(attackerToken, t) : false;
    }));
    // Single non-ally target: nothing to choose.
    if (burstTokenIds.length === 1 && !allyIds.has(burstTokenIds[0])) {
        return Promise.resolve({
            primaryTokenId: burstTokenIds[0],
            effectiveBurstTokenIds: [...burstTokenIds],
        });
    }
    const esc = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const tokenName = (id) => {
        const t = canvas?.tokens?.get?.(id);
        return String(t?.name ?? id);
    };
    const buildOptionsHtml = (excludeAllies) => {
        const ids = excludeAllies ? burstTokenIds.filter((id) => !allyIds.has(id)) : burstTokenIds;
        if (!ids.length) {
            return `<option value="">— no valid targets (allies excluded) —</option>`;
        }
        return ids
            .map((id) => `<option value="${id}">${esc(tokenName(id))}${allyIds.has(id) ? ' (ally)' : ''}</option>`)
            .join('');
    };
    return new Promise((resolve) => {
        const dlg = new Dialog({
            title: 'Melee AoE — Primary target',
            content: `<p style="margin-bottom:0.5em">One attack roll is compared separately against each creature's <strong>Evade</strong>. Every creature hit takes the <strong>full printed payload</strong> and may use <strong>Dive for Cover</strong> (Reaction) before damage. Choosing a primary only sets the attack card's anchor target.</p>
        <label for="ms-aoe-exclude-allies" style="display:flex;align-items:center;gap:0.35em;margin:0.35em 0" title="Verbündete und Spieler-Charaktere werden weder Primärziel noch Sekundärziel, solange aktiv.">
          <input type="checkbox" id="ms-aoe-exclude-allies" checked />
          <span>Exclude allies/players (Verbündete ausnehmen)</span>
        </label>
        <label for="ms-aoe-primary" style="display:block;margin:0.35em 0 0.15em 0">Primary (fully in the AoE):</label>
        <select id="ms-aoe-primary" style="width:100%;margin-bottom:0.75em">${buildOptionsHtml(true)}</select>
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
                        const excludeAllies = html.find('#ms-aoe-exclude-allies').is(':checked');
                        const effectiveBurstTokenIds = excludeAllies
                            ? burstTokenIds.filter((id) => !allyIds.has(id))
                            : [...burstTokenIds];
                        if (!effectiveBurstTokenIds.length) {
                            ui.notifications?.warn?.('Melee AoE: no valid targets — only allies are in the burst (uncheck the ally filter for friendly fire).');
                            resolve('cancelled');
                            return;
                        }
                        const noPri = html.find('#ms-aoe-primary-none').is(':checked');
                        if (noPri) {
                            resolve({ primaryTokenId: null, effectiveBurstTokenIds });
                            return;
                        }
                        const id = String(html.find('#ms-aoe-primary').val() || '').trim();
                        if (!id || !effectiveBurstTokenIds.includes(id)) {
                            resolve('cancelled');
                            return;
                        }
                        resolve({ primaryTokenId: id, effectiveBurstTokenIds });
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => resolve('cancelled'),
                },
            },
            default: 'ok',
            render: (html) => {
                html.find('#ms-aoe-exclude-allies').on('change', (ev) => {
                    const checked = !!ev.currentTarget.checked;
                    html.find('#ms-aoe-primary').html(buildOptionsHtml(checked));
                });
            },
        });
        dlg.render(true);
    });
}
//# sourceMappingURL=melee-aoe-primary-dialog.js.map