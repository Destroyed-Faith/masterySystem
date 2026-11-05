/**
 * Confirm-to-apply K8 Profession mapping.
 * Opens with the stored names and ranks. It does not suggest a new occupation.
 */
import { K8_PROFESSIONS_REVIEWED_FLAG, applyProfessionMappingDrafts, planProfessionMapping } from './profession-mapping-plan.js';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
export async function showProfessionMappingReview(actor) {
    const Dialog = globalThis.Dialog;
    if (!actor || !Dialog)
        return false;
    const plan = planProfessionMapping(actor.system);
    if (!plan.needsReview) {
        globalThis.ui?.notifications?.info?.('No Field-based Specializations are waiting to be mapped.');
        return false;
    }
    const rows = plan.drafts
        .map((draft, index) => {
        const source = plan.legacy[index];
        return `<fieldset class="js-prof-map-row" data-legacy-id="${escapeHtml(draft.legacyId)}">
        <legend>${escapeHtml(source?.name || draft.name)} · ${escapeHtml(source?.field || 'field')} · Rank ${draft.rank}</legend>
        <label><input type="checkbox" name="keep" checked /> Keep this rank</label>
        <label>Profession name <input type="text" name="name" value="${escapeHtml(draft.name)}" /></label>
        <label>Origin <input type="text" name="origin" value="${escapeHtml(draft.origin)}" /></label>
        <label>Scope <input type="text" name="scope" value="${escapeHtml(draft.scope)}" /></label>
        <input type="hidden" name="rank" value="${draft.rank}" />
      </fieldset>`;
    })
        .join('');
    return new Promise((resolve) => {
        let settled = false;
        const done = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        new Dialog({
            title: 'Map Specializations to Professions',
            content: `<form class="mastery-dialog-form">
          <p>Stored ranks stay until you confirm. Names are copied as stored. Nothing is renamed to a catalogue occupation.</p>
          ${rows}
        </form>`,
            buttons: {
                save: {
                    label: 'Confirm mapping',
                    callback: async (html) => {
                        const root = html?.[0] ?? html ?? null;
                        const drafts = [];
                        root?.querySelectorAll('.js-prof-map-row').forEach((row) => {
                            const el = row;
                            const read = (name) => String(el.querySelector(`[name="${name}"]`)?.value || '');
                            drafts.push({
                                legacyId: String(el.dataset.legacyId || ''),
                                keep: !!el.querySelector('[name="keep"]')?.checked,
                                name: read('name').trim(),
                                origin: read('origin').trim(),
                                scope: read('scope').trim(),
                                rank: Math.floor(Number(read('rank')) || 0),
                            });
                        });
                        const applied = applyProfessionMappingDrafts(actor.system, drafts);
                        if (!applied.ok) {
                            globalThis.ui?.notifications?.warn?.(applied.error || 'Mapping was not saved.');
                            return done(false);
                        }
                        await actor.update({ 'system.specializations': applied.specializations });
                        await actor.setFlag?.('mastery-system', K8_PROFESSIONS_REVIEWED_FLAG, Date.now());
                        done(true);
                    },
                },
                cancel: { label: 'Cancel', callback: () => done(false) },
            },
            default: 'cancel',
            close: () => done(false),
        }, { width: 560 }).render(true);
    });
}
//# sourceMappingURL=profession-mapping-review-dialog.js.map