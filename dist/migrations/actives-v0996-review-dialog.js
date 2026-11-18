/**
 * GM review dialog for the Actives v0.9.9.6 migration. Shows the dry-run
 * report; Apply runs only after explicit confirmation and downloads a JSON
 * backup first. Never deletes documents.
 */
import { applyActivesV0996Report, buildActivesV0996Report, downloadActivesV0996Backup, formatActivesV0996ReportMarkdown, } from './actives-v0996-migration.js';
const { ApplicationV2 } = foundry.applications?.api ?? {};
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
const KIND_LABEL = {
    remap: 'Remap',
    resync: 'Re-bake',
    conflict: 'Conflict (kept)',
    'retire-mental': 'Retire (flag)',
    unmappable: 'Unmappable (kept)',
};
function itemRow(c) {
    const to = c.toTemplateId && c.toTemplateId !== c.fromTemplateId ? ` → <code>${esc(c.toTemplateId)}</code>` : '';
    return `<tr>
      <td>${esc(KIND_LABEL[c.kind] ?? c.kind)}</td>
      <td>${esc(c.actorName)}</td>
      <td>${esc(c.itemName)}${c.rename ? `<br><small>→ ${esc(c.rename)}</small>` : ''}</td>
      <td>${c.rank}${c.special ? ` · ${esc(c.special)}` : ''}</td>
      <td><code>${esc(c.fromTemplateId)}</code>${to}</td>
      <td>${esc(c.valueChanges.join('; '))}</td>
      <td>${esc(c.note)}</td>
    </tr>`;
}
function infoList(title, rows) {
    if (!rows.length)
        return '';
    return `<h3>${esc(title)} (${rows.length})</h3><ul>${rows
        .map((r) => `<li><strong>${esc(r.actorName)}</strong>${r.itemName ? ` — ${esc(r.itemName)}` : ''}: ${esc(r.note)}</li>`)
        .join('')}</ul>`;
}
export class ActivesV0996ReviewDialog extends (ApplicationV2 ?? class {
}) {
    static DEFAULT_OPTIONS = {
        id: 'mastery-actives-v0996-review',
        tag: 'div',
        window: { title: 'Actives v0.9.9.6 — Migration Review', resizable: true },
        position: { width: 1100, height: 720 },
    };
    #report;
    constructor(report) {
        super();
        this.#report = report ?? buildActivesV0996Report();
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
            const md = formatActivesV0996ReportMarkdown(this.#report);
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'actives-v0996-migration-report.md';
            a.click();
            URL.revokeObjectURL(url);
        });
        root.querySelector('[data-action="backup"]')?.addEventListener('click', () => {
            const n = downloadActivesV0996Backup(this.#report);
            ui.notifications?.info(`Backup downloaded (${n} document(s)).`);
        });
        root.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
            this.#report = buildActivesV0996Report();
            this.render?.(true);
        });
        root.querySelector('[data-action="apply"]')?.addEventListener('click', async () => {
            const ok = await Dialog?.confirm?.({
                title: 'Apply Actives v0.9.9.6 migration?',
                content: '<p>Run this in a <strong>copy of the world</strong> first.</p>' +
                    `<p>Apply <strong>${this.#report.items.length}</strong> item change(s) and ` +
                    `<strong>${this.#report.artifactPicks.length}</strong> Artifact pick change(s)? ` +
                    'A JSON backup is downloaded first and every changed item keeps a backup flag for rollback. ' +
                    'Conflicts and Mental Attack are only flagged; nothing is deleted or refunded.</p>',
            });
            if (!ok)
                return;
            downloadActivesV0996Backup(this.#report);
            const summary = await applyActivesV0996Report(this.#report);
            const msg = `Actives v0.9.9.6 migration: ${summary.applied} item(s), ${summary.artifacts} Artifact(s) updated; ` +
                `${summary.skipped} skipped, ${summary.failed} failed.`;
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
        const rows = r.items.map(itemRow).join('');
        const picks = r.artifactPicks
            .map((p) => `<tr><td>${esc(p.kind)}</td><td>${esc(p.ownerName)}</td><td>${esc(p.itemName)}</td>` +
            `<td>L${p.pickLevel}${p.special ? ` · ${esc(p.special)}` : ''}</td>` +
            `<td><code>${esc(p.fromTemplateId)}</code>${p.toTemplateId ? ` → <code>${esc(p.toTemplateId)}</code>` : ''}</td>` +
            `<td>${esc(p.note)}</td></tr>`)
            .join('');
        return `
      <div class="mastery-v0996-review" style="overflow:auto;height:100%">
        <p>Dry-run report (${esc(r.generatedAt)}). Nothing has been changed yet. State: <strong>${esc(r.state || 'pending')}</strong>.</p>
        <div class="flexrow" style="gap:0.5em;margin-bottom:0.5em">
          <button type="button" data-action="refresh">Refresh</button>
          <button type="button" data-action="export">Export report (Markdown)</button>
          <button type="button" data-action="backup">Download backup (JSON)</button>
          <button type="button" data-action="apply" class="default">Apply after review…</button>
        </div>
        <h3>Owned powers (${r.items.length})</h3>
        <table style="width:100%;font-size:12px">
          <thead><tr><th>Action</th><th>Actor</th><th>Item</th><th>PL · Special</th><th>Template</th><th>Values at PL</th><th>Note</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7">None</td></tr>'}</tbody>
        </table>
        <h3>Artifact picks (${r.artifactPicks.length})</h3>
        <table style="width:100%;font-size:12px">
          <thead><tr><th>Action</th><th>Owner</th><th>Artifact</th><th>Pick</th><th>Template</th><th>Note</th></tr></thead>
          <tbody>${picks || '<tr><td colspan="6">None</td></tr>'}</tbody>
        </table>
        ${infoList('Zone Root (documented only)', r.zoneRoot)}
        ${infoList('Actors without an Attack Power', r.actorsWithoutAttackPower)}
      </div>`;
    }
}
export function openActivesV0996Review(report) {
    if (!game.user?.isGM)
        return null;
    const app = new ActivesV0996ReviewDialog(report);
    app.render?.(true);
    return app;
}
//# sourceMappingURL=actives-v0996-review-dialog.js.map