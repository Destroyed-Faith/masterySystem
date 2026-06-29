/**
 * Epic Mastery Roll — summary chat card.
 */
import { countResolvedParticipants, rollLabelForConfig } from './epic-mastery-roll-types.js';
function escapeHtml(text) {
    const fn = globalThis.foundry?.utils?.escapeHTML;
    if (typeof fn === 'function')
        return fn(String(text ?? ''));
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function buildSummaryHtml(session) {
    const rollLabel = rollLabelForConfig(session.roll);
    const title = escapeHtml(session.title);
    const flavor = session.flavor ? `<p class="emr-summary-flavor">${escapeHtml(session.flavor)}</p>` : '';
    const tnLine = session.showTn
        ? `<p class="emr-summary-tn">Normal TN: <strong>${session.tn.baseTN}</strong>${session.tn.raises > 0 ? ` · Raise TN: <strong>${session.tn.baseTN + session.tn.raises * 4}</strong> (${session.tn.raises} raise${session.tn.raises === 1 ? '' : 's'})` : ''}</p>`
        : '';
    const rows = session.participants
        .map((p) => {
        const result = session.results[p.actorId];
        if (!result || result.skipped) {
            return `<tr class="emr-skipped"><td>${escapeHtml(p.actorName)}</td><td colspan="5"><em>Skipped</em></td></tr>`;
        }
        const outcome = result.success
            ? `<span class="emr-success">Success</span>`
            : `<span class="emr-fail">Failure</span>`;
        return `<tr>
        <td>${escapeHtml(result.actorName)}</td>
        <td>${escapeHtml(result.label)}</td>
        <td><strong>${result.total}</strong></td>
        <td>${session.showTn ? result.normalTn : '—'}</td>
        <td>${outcome}</td>
        <td>${result.raises}${result.diceSummary ? ` <span class="emr-dice">(${escapeHtml(result.diceSummary)})</span>` : ''}</td>
      </tr>`;
    })
        .join('');
    return `
    <div class="mastery-epic-roll-summary">
      <h3 class="emr-summary-title"><i class="fas fa-dice-d20"></i> ${title}</h3>
      <p class="emr-summary-meta">${escapeHtml(rollLabel)} · ${countResolvedParticipants(session)}/${session.participants.length} resolved</p>
      ${flavor}
      ${tnLine}
      <table class="emr-summary-table">
        <thead>
          <tr>
            <th>Actor</th>
            <th>Roll</th>
            <th>Total</th>
            <th>TN</th>
            <th>Result</th>
            <th>Raises</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
export async function postEpicMasteryRollSummary(session) {
    const visibility = String(game.settings.get('mastery-system', 'epicRollSummaryVisibility') ?? 'all');
    const content = buildSummaryHtml(session);
    const whisper = visibility === 'gm'
        ? ChatMessage.getWhisperRecipients('GM').map((u) => u.id)
        : [];
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ alias: 'Epic Mastery Roll' }),
        content,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        whisper,
        flags: {
            'mastery-system': {
                epicMasteryRollSummary: true,
                sessionId: session.id,
            },
        },
    });
}
export function buildEpicMasteryRollSummaryHtml(session) {
    return buildSummaryHtml(session);
}
//# sourceMappingURL=epic-mastery-roll-chat.js.map