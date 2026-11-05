/**
 * GM Review Dialog for identity migration (K7 / plan §10.3).
 * Patterned after df-2026-migration-review-dialog — selection + before/after only.
 * Never deletes documents. Apply runs only after explicit confirmation.
 */

import {
  applyIdentityMigrationProposals,
  buildIdentityMigrationDryRunSections,
  formatIdentityMigrationDryRunMarkdown,
  planActorIdentityMigration,
  type IdentityMigrationProposal,
} from './power-identity-migration.js';

const { ApplicationV2 } = (foundry as any).applications?.api ?? {};

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function proposalRow(p: IdentityMigrationProposal, idx: number): string {
  const canSelect = Object.keys(p.after).length > 0;
  return `
    <tr data-idx="${idx}">
      <td><input type="checkbox" data-action="toggle" ${p.selected && canSelect ? 'checked' : ''} ${canSelect ? '' : 'disabled'} /></td>
      <td>${esc(p.disposition)}</td>
      <td><code>${esc(p.path)}</code></td>
      <td><code>${esc(JSON.stringify(p.before))}</code></td>
      <td><code>${esc(JSON.stringify(p.after))}</code></td>
      <td>${esc(p.basis)}</td>
    </tr>`;
}

export class IdentityMigrationReviewDialog extends (ApplicationV2 ?? class {}) {
  static DEFAULT_OPTIONS = {
    id: 'mastery-identity-migration-review',
    tag: 'div',
    window: { title: 'Identity Migration Review', resizable: true },
    position: { width: 960, height: 640 },
  };

  #actor: any;
  #proposals: IdentityMigrationProposal[];

  constructor(actor: any, proposals?: IdentityMigrationProposal[]) {
    super();
    this.#actor = actor;
    this.#proposals = proposals ?? planActorIdentityMigration(actor);
  }

  _prepareContext(): Record<string, unknown> {
    const sections = buildIdentityMigrationDryRunSections(this.#proposals);
    return {
      actorName: this.#actor?.name || this.#actor?.id || 'Actor',
      proposals: this.#proposals,
      sections,
      markdown: formatIdentityMigrationDryRunMarkdown(sections),
    };
  }

  _onRender(_context: unknown, _options: unknown): void {
    const root = (this as any).element as HTMLElement | undefined;
    if (!root) return;
    root.querySelectorAll('input[data-action="toggle"]').forEach((el) => {
      el.addEventListener('change', (ev) => {
        const tr = (ev.target as HTMLElement).closest('tr');
        const idx = Number(tr?.getAttribute('data-idx'));
        if (!Number.isFinite(idx) || !this.#proposals[idx]) return;
        this.#proposals[idx]!.selected = (ev.target as HTMLInputElement).checked;
      });
    });
    root.querySelector('[data-action="export"]')?.addEventListener('click', () => {
      const sections = buildIdentityMigrationDryRunSections(this.#proposals);
      const md = formatIdentityMigrationDryRunMarkdown(sections);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `identity-migration-${this.#actor?.id || 'actor'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
    root.querySelector('[data-action="apply"]')?.addEventListener('click', async () => {
      const selected = this.#proposals.filter((p) => p.selected && Object.keys(p.after).length);
      if (!selected.length) {
        (ui as any).notifications?.warn('No proposals selected.');
        return;
      }
      const ok = await (Dialog as any)?.confirm?.({
        title: 'Apply identity migration?',
        content: `<p>Apply <strong>${selected.length}</strong> identity field update(s)? Names/descriptions are not changed. A backup flag is written for rollback.</p>`,
      });
      if (!ok) return;
      const report = await applyIdentityMigrationProposals(this.#actor, this.#proposals);
      (ui as any).notifications?.info(
        `Identity migration applied: ${report.applied} (skipped ${report.skipped}).`,
      );
      (this as any).close?.();
    });
  }

  _renderHTML(context: any): string {
    const rows = (context.proposals as IdentityMigrationProposal[])
      .map((p, i) => proposalRow(p, i))
      .join('');
    const s = context.sections;
    return `
      <div class="mastery-identity-migration-review">
        <p><strong>${esc(context.actorName)}</strong> —
          Auto-stable ${s.autoStableKey.length} ·
          Auto-provenance ${s.autoProvenance.length} ·
          Manual ${s.manual.length} ·
          Skip ${s.notActivatable.length}
        </p>
        <div class="flexrow" style="gap:0.5em;margin-bottom:0.5em">
          <button type="button" data-action="export">Export Markdown</button>
          <button type="button" data-action="apply" class="default">Apply selected</button>
        </div>
        <table class="identity-mig-table" style="width:100%;font-size:12px">
          <thead><tr>
            <th></th><th>Disposition</th><th>Path</th><th>Before</th><th>After</th><th>Basis</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="6">No proposals</td></tr>'}</tbody>
        </table>
      </div>`;
  }
}

/** Open the review dialog for one actor (GM). */
export function openIdentityMigrationReview(actor: any): IdentityMigrationReviewDialog | null {
  if (!actor) return null;
  const app = new IdentityMigrationReviewDialog(actor);
  (app as any).render?.(true);
  return app;
}
