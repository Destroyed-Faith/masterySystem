/**
 * GM review dialog for the legacy-cleanup 2026 migration. Shows the dry-run
 * report; Apply runs only after explicit confirmation (and only once Actives
 * v0.9.9.6 is applied) and downloads a JSON backup first. Never deletes documents.
 */
import { applyLegacyCleanupReport, buildLegacyCleanupReport, downloadLegacyCleanupBackup, formatLegacyCleanupReportMarkdown, legacyCleanupConflictCount, } from './legacy-cleanup-2026-migration.js';
const { ApplicationV2 } = foundry.applications?.api ?? {};
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function actorRow(a) {
    const s = a.skills;
    let skills = '—';
    if (s?.status === 'conflict')
        skills = `<strong>Conflict (unchanged):</strong> ${esc(s.reasons.join(' '))}`;
    else if (s) {
        const keys = s.byKey.map((k) => `${k.key} ${k.rating} (creation ${k.creationRanks} · XP ${k.xpRanks})`).join(', ');
        skills = `${esc(keys || 'no rated Skills')}${s.creationOpen ? ' · creation open: archive only' : ''}`;
    }
    const xp = s && s.status !== 'conflict' ? `+${s.xpRefund} (${esc(s.xpSource)}) · Skill Points +${s.skillPointsToFreeXp}` : '—';
    const other = [
        a.npcSkillKeys ? `NPC Skills: ${a.npcSkillKeys} key(s) archived` : '',
        a.summonBonds ? `${a.summonBonds} Bond(s)` : '',
        a.summonActorFields ? `${a.summonActorFields} Summon field(s)` : '',
        a.echoCardIds ? `${a.echoCardIds} Echo Card pick(s) archived` : '',
        s?.historyRowsMarked ? `${s.historyRowsMarked} history row(s) marked` : '',
        s?.quarantineEntries ? `${s.quarantineEntries} blocked write(s)` : '',
    ].filter(Boolean).join(' · ');
    return `<tr><td>${esc(a.actorName)}</td><td>${esc(a.actorType)}</td><td>${skills}</td><td>${xp}</td><td>${esc(other)}</td></tr>`;
}
function infoList(title, rows) {
    if (!rows.length)
        return '';
    return `<h3>${esc(title)} (${rows.length})</h3><ul>${rows
        .map((r) => `<li><strong>${esc(r.ownerName)}</strong>${r.itemName ? ` — ${esc(r.itemName)}` : ''}: ${esc(r.note)}</li>`)
        .join('')}</ul>`;
}
export class LegacyCleanupReviewDialog extends (ApplicationV2 ?? class {
}) {
    static DEFAULT_OPTIONS = {
        id: 'mastery-legacy-cleanup-review',
        tag: 'div',
        window: { title: 'Legacy Cleanup 2026 — Migration Review', resizable: true },
        position: { width: 1150, height: 740 },
    };
    #report;
    constructor(report) {
        super();
        this.#report = report ?? buildLegacyCleanupReport();
    }
    async _prepareContext() {
        return { report: this.#report };
    }
    _onRender(context, options) {
        super._onRender?.(context, options);
        const root = this.element;
        if (!root)
            return;
        root.querySelector('[data-action="export"]')?.addEventListener('click', () => {
            const md = formatLegacyCleanupReportMarkdown(this.#report);
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'legacy-cleanup-2026-migration-report.md';
            a.click();
            URL.revokeObjectURL(url);
        });
        root.querySelector('[data-action="backup"]')?.addEventListener('click', () => {
            const n = downloadLegacyCleanupBackup(this.#report);
            ui.notifications?.info(`Backup downloaded (${n} document(s)).`);
        });
        root.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
            this.#report = buildLegacyCleanupReport();
            this.render?.(true);
        });
        root.querySelector('[data-action="apply"]')?.addEventListener('click', async () => {
            if (this.#report.v0996State !== 'applied') {
                ui.notifications?.warn('Apply the Actives v0.9.9.6 migration first.');
                return;
            }
            const r = this.#report;
            const ok = await Dialog?.confirm?.({
                title: 'Apply legacy cleanup migration?',
                content: '<p>Run this in a <strong>copy of the world</strong> first.</p>' +
                    `<p>Update <strong>${r.actors.length}</strong> actor(s), <strong>${r.items.length}</strong> power(s) and ` +
                    `<strong>${r.artifacts.length}</strong> Artifact(s)? A JSON backup is downloaded first and every changed document keeps a backup flag for rollback. ` +
                    `${legacyCleanupConflictCount(r)} conflict(s) are only flagged and stay unchanged for your decision; nothing is deleted.</p>`,
            });
            if (!ok)
                return;
            downloadLegacyCleanupBackup(r);
            const summary = await applyLegacyCleanupReport(r);
            const msg = `Legacy cleanup: ${summary.actors} actor(s), ${summary.items} power(s), ${summary.artifacts} Artifact(s) updated; ` +
                `${summary.conflicts} conflict(s) flagged, ${summary.skipped} skipped, ${summary.failed} failed.`;
            if (summary.failed > 0)
                ui.notifications?.error(`${msg} State stays pending — check the console.`);
            else
                ui.notifications?.info(msg);
            this.close?.();
        });
    }
    _replaceHTML(result, content, _options) {
        content.innerHTML = result;
    }
    async _renderHTML(_context, _options) {
        const r = this.#report;
        const actors = r.actors.map(actorRow).join('');
        const items = r.items
            .map((c) => {
            const to = c.to ? ` → <code>${esc(c.to.templateId)}${c.to.special ? `::${esc(c.to.special)}` : ''}</code>` : '';
            return `<tr><td>${esc(c.kind)}</td><td>${esc(c.ownerName)}</td><td>${esc(c.itemName)}${c.rename ? `<br><small>→ ${esc(c.rename)}</small>` : ''}</td>` +
                `<td>${c.rank}${c.special ? ` · ${esc(c.special)}` : ''}</td><td><code>${esc(c.fromTemplateId)}</code>${to}</td><td>${esc(c.note)}</td></tr>`;
        })
            .join('');
        const picks = r.artifacts
            .flatMap((a) => [
            ...(a.keyBackfill
                ? [`<tr><td>key</td><td>${esc(a.ownerName)}</td><td>${esc(a.itemName)}</td><td>—</td><td><code>${esc(a.keyBackfill)}</code></td><td>Artifact key set from an exact name match.</td></tr>`]
                : []),
            ...a.picks.map((p) => `<tr><td>${esc(p.kind)}</td><td>${esc(a.ownerName)}</td><td>${esc(a.itemName)}</td><td>L${p.level}${p.special ? ` · ${esc(p.special)}` : ''}</td>` +
                `<td><code>${esc(p.fromTemplateId)}</code>${p.to ? ` → <code>${esc(p.to)}</code>` : ''}</td><td>${esc(p.note)}</td></tr>`),
        ])
            .join('');
        const blocked = r.v0996State !== 'applied'
            ? '<p><strong>Apply the Actives v0.9.9.6 migration first.</strong> This report is read-only until then.</p>'
            : '';
        return `
      <div class="mastery-legacy-cleanup-review" style="overflow:auto;height:100%">
        <p>Dry-run report (${esc(r.generatedAt)}). Nothing has been changed yet. State: <strong>${esc(r.state || 'pending')}</strong>.</p>
        ${blocked}
        <div class="flexrow" style="gap:0.5em;margin-bottom:0.5em">
          <button type="button" data-action="refresh">Refresh</button>
          <button type="button" data-action="export">Export report (Markdown)</button>
          <button type="button" data-action="backup">Download backup (JSON)</button>
          <button type="button" data-action="apply" class="default"${r.v0996State !== 'applied' ? ' disabled' : ''}>Apply after review…</button>
        </div>
        <h3>Actors (${r.actors.length})</h3>
        <table style="width:100%;font-size:12px">
          <thead><tr><th>Actor</th><th>Type</th><th>Skills archived</th><th>Free XP</th><th>Other</th></tr></thead>
          <tbody>${actors || '<tr><td colspan="5">None</td></tr>'}</tbody>
        </table>
        <h3>Powers (${r.items.length})</h3>
        <table style="width:100%;font-size:12px">
          <thead><tr><th>Action</th><th>Owner</th><th>Item</th><th>PL · Special</th><th>Template</th><th>Note</th></tr></thead>
          <tbody>${items || '<tr><td colspan="6">None</td></tr>'}</tbody>
        </table>
        <h3>Artifact picks (${r.artifacts.reduce((n, a) => n + a.picks.length, 0)})</h3>
        <table style="width:100%;font-size:12px">
          <thead><tr><th>Action</th><th>Owner</th><th>Artifact</th><th>Pick</th><th>Template</th><th>Note</th></tr></thead>
          <tbody>${picks || '<tr><td colspan="6">None</td></tr>'}</tbody>
        </table>
        ${infoList('Exorcism / Requiem mentions (listed only)', r.exorcismRequiem)}
        ${infoList('Minor Magic Items with removed templates (listed only)', r.minorMagic)}
        ${infoList('Professions still on a Field identity (listed only)', r.legacyProfessions)}
      </div>`;
    }
}
export function openLegacyCleanupReview(report) {
    if (!game.user?.isGM)
        return null;
    const app = new LegacyCleanupReviewDialog(report);
    app.render?.(true);
    return app;
}
//# sourceMappingURL=legacy-cleanup-2026-review-dialog.js.map