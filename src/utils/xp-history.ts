/**
 * XP history: one row per spend/grant step, plus a resizable GM dialog.
 *
 * Older batched confirm entries (`details.changes`) are expanded when shown
 * so existing logs still read as individual steps.
 */

import { attributeBandCost, powerLevelCost } from './constants.js';

/** Same flat cost as `ARTIFACT_UPGRADE_XP_COST` — kept local to avoid a combat import. */
const ARTIFACT_STEP_XP = 8;

export type XpHistoryKind = 'grant' | 'spend' | 'adjust' | 'step' | 'step-end';
export type XpHistoryCategory = 'xp' | 'attribute' | 'skill' | 'power' | 'artifact';

export interface XpHistoryBalances {
  available: number;
  totalEarned: number;
  totalSpent: number;
}

export interface XpHistoryEntry {
  ts: number;
  userId?: string;
  userName?: string;
  kind: XpHistoryKind | string;
  category?: XpHistoryCategory | string;
  amount?: number;
  note?: string;
  details?: any;
  before?: XpHistoryBalances;
  after?: XpHistoryBalances;
}

export interface XpHistoryRow {
  ts: number;
  kind: string;
  category: string;
  amount: number;
  signedAmount: number;
  what: string;
  note: string;
}

export function currentXpUser(): { userId: string; userName: string } {
  const user = (globalThis as any).game?.user;
  return {
    userId: user?.id || '',
    userName: user?.name || 'System',
  };
}

export function appendXpHistory(actor: any, entries: XpHistoryEntry[]): XpHistoryEntry[] {
  const prior = Array.isArray(actor?.system?.xp?.history) ? [...actor.system.xp.history] : [];
  prior.push(...entries);
  return prior.length > 200 ? prior.slice(-200) : prior;
}

function t(key: string, fallback: string, data?: Record<string, string>): string {
  const i18n = (globalThis as any).game?.i18n;
  if (i18n) {
    const raw = data ? i18n.format?.(key, data) : i18n.localize?.(key);
    if (typeof raw === 'string' && raw && raw !== key) return raw;
  }
  if (!data) return fallback;
  return fallback.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? '');
}

export function escapeXpHistoryHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettyKey(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '—';
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function changeLabel(change: any, fallback: string): string {
  return String(
    change?.name ||
      change?.powerName ||
      change?.label ||
      change?.attr ||
      change?.skillKey ||
      change?.key ||
      fallback,
  );
}

function stepCost(category: string, from: number, to: number): number {
  const rising = to > from;
  if (category === 'power') {
    const cost = powerLevelCost(rising ? to : from);
    return rising ? cost : -cost;
  }
  if (category === 'artifact') {
    return rising ? ARTIFACT_STEP_XP : -ARTIFACT_STEP_XP;
  }
  const cost = attributeBandCost(rising ? to : from);
  return rising ? cost : -cost;
}

function signedForEntry(entry: XpHistoryEntry, amount: number): number {
  const kind = String(entry.kind || '');
  if (kind === 'grant') return Math.abs(amount);
  if (kind === 'spend') return -Math.abs(amount);
  if (kind === 'adjust' && /refund/i.test(String(entry.note || ''))) return Math.abs(amount);
  if (typeof entry.amount === 'number' && (kind === 'adjust' || kind === 'grant')) {
    return entry.amount;
  }
  return amount;
}

function rowFromPlain(entry: XpHistoryEntry): XpHistoryRow {
  const amount = Number(entry.amount) || 0;
  const note = String(entry.note || '');
  let what = '';
  if (entry.category === 'xp' || !entry.category) {
    what = /free/i.test(note)
      ? t('MASTERY.xp.history.freeXp', 'Free XP')
      : t('MASTERY.xp.history.regularXp', 'Regular XP');
  } else if (entry.details?.name && Number.isFinite(Number(entry.details.from))) {
    what = `${entry.details.name} ${entry.details.from} → ${entry.details.to}`;
  } else {
    what = note || prettyKey(String(entry.category));
  }
  return {
    ts: Number(entry.ts) || 0,
    kind: String(entry.kind || ''),
    category: String(entry.category || 'xp'),
    amount: Math.abs(amount),
    signedAmount: signedForEntry(entry, amount),
    what,
    note,
  };
}

/** Expand stored history into one display row per XP step. */
export function expandHistoryRows(entries: XpHistoryEntry[] | unknown): XpHistoryRow[] {
  if (!Array.isArray(entries)) return [];
  const rows: XpHistoryRow[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as XpHistoryEntry;
    const changes = rec.details?.changes;
    if (Array.isArray(changes) && changes.length > 0) {
      const category = String(rec.category || '');
      for (const change of changes) {
        const label = prettyKey(changeLabel(change, category));
        const from = Number(change?.from);
        const to = Number(change?.to);
        if (Number.isFinite(from) && Number.isFinite(to) && from !== to) {
          const step = to > from ? 1 : -1;
          for (let v = from; v !== to; v += step) {
            const next = v + step;
            const cost = stepCost(category, v, next);
            rows.push({
              ts: Number(rec.ts) || 0,
              kind: cost >= 0 ? 'spend' : 'adjust',
              category,
              amount: Math.abs(cost),
              signedAmount: cost >= 0 ? -Math.abs(cost) : Math.abs(cost),
              what: `${label} ${v} → ${next}`,
              note: String(rec.note || ''),
            });
          }
        } else {
          const cost = Number(change?.cost) || 0;
          rows.push({
            ts: Number(rec.ts) || 0,
            kind: cost >= 0 ? String(rec.kind || 'spend') : 'adjust',
            category,
            amount: Math.abs(cost),
            signedAmount: cost >= 0 ? -Math.abs(cost) : Math.abs(cost),
            what: label,
            note: String(rec.note || ''),
          });
        }
      }
      continue;
    }
    rows.push(rowFromPlain(rec));
  }
  return rows;
}

export function buildBandedStepEntries(opts: {
  category: 'attribute' | 'skill' | 'power';
  pendingMap: Record<string, number>;
  getCurrent: (key: string) => number;
  getLabel: (key: string) => string;
  costForTarget: (targetValue: number) => number;
  before: XpHistoryBalances;
  after: XpHistoryBalances;
  user?: { userId: string; userName: string };
  ts?: number;
}): XpHistoryEntry[] {
  const user = opts.user ?? currentXpUser();
  const ts = opts.ts ?? Date.now();
  const entries: XpHistoryEntry[] = [];
  for (const [key, pendingRaw] of Object.entries(opts.pendingMap || {})) {
    const pending = Number(pendingRaw) || 0;
    if (!pending) continue;
    const current = Number(opts.getCurrent(key)) || 0;
    const label = opts.getLabel(key) || prettyKey(key);
    if (pending > 0) {
      for (let i = 0; i < pending; i++) {
        const from = current + i;
        const to = from + 1;
        const cost = opts.costForTarget(to);
        entries.push({
          ts: ts + entries.length,
          userId: user.userId,
          userName: user.userName,
          kind: 'spend',
          category: opts.category,
          amount: Math.abs(cost),
          note: `${label} ${from} → ${to}`,
          details: { key, name: label, from, to, cost },
          before: opts.before,
          after: opts.after,
        });
      }
    } else {
      for (let i = 0; i < Math.abs(pending); i++) {
        const from = current - i;
        const to = from - 1;
        const cost = -opts.costForTarget(from);
        entries.push({
          ts: ts + entries.length,
          userId: user.userId,
          userName: user.userName,
          kind: 'adjust',
          category: opts.category,
          amount: Math.abs(cost),
          note: `refund: ${label} ${from} → ${to}`,
          details: { key, name: label, from, to, cost },
          before: opts.before,
          after: opts.after,
        });
      }
    }
  }
  return entries;
}

function localizeKind(kind: string): string {
  switch (kind) {
    case 'grant':
      return t('MASTERY.xp.history.kindGrant', 'Grant');
    case 'spend':
      return t('MASTERY.xp.history.kindSpend', 'Spend');
    case 'adjust':
      return t('MASTERY.xp.history.kindAdjust', 'Adjust');
    case 'step':
      return t('MASTERY.xp.history.kindStep', 'Step');
    case 'step-end':
      return t('MASTERY.xp.history.kindStepEnd', 'Step end');
    default:
      return prettyKey(kind);
  }
}

function localizeCategory(category: string): string {
  switch (category) {
    case 'xp':
      return t('MASTERY.xp.history.categoryXp', 'XP');
    case 'attribute':
      return t('MASTERY.xp.history.categoryAttribute', 'Attribute');
    case 'skill':
      return t('MASTERY.xp.history.categorySkill', 'Skill');
    case 'power':
      return t('MASTERY.xp.history.categoryPower', 'Power');
    case 'artifact':
      return t('MASTERY.xp.history.categoryArtifact', 'Artifact');
    default:
      return prettyKey(category);
  }
}

function formatSigned(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '0';
  return amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`;
}

export function renderXpHistoryTableHtml(actorName: string, entries: XpHistoryEntry[]): string {
  const rows = expandHistoryRows(entries).slice().reverse();
  let html = '<div class="xp-history-dialog">';
  html += `<p class="xp-history-hint">${escapeXpHistoryHtml(
    t('MASTERY.xp.history.hint', 'Each row is one XP step. Drag the window corner to resize.'),
  )}</p>`;
  html += '<div class="xp-history-table-wrap"><table class="xp-history-table"><thead><tr>';
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.time', 'Time'))}</th>`;
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.kind', 'Kind'))}</th>`;
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.category', 'Category'))}</th>`;
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.what', 'What'))}</th>`;
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.amount', 'XP'))}</th>`;
  html += `<th>${escapeXpHistoryHtml(t('MASTERY.xp.history.note', 'Note'))}</th>`;
  html += '</tr></thead><tbody>';
  if (rows.length === 0) {
    html += `<tr><td colspan="6" class="empty-message">${escapeXpHistoryHtml(
      t('MASTERY.xp.history.empty', 'No history entries.'),
    )}</td></tr>`;
  } else {
    for (const row of rows) {
      const timeStr = row.ts ? new Date(row.ts).toLocaleString() : '—';
      html += '<tr>';
      html += `<td>${escapeXpHistoryHtml(timeStr)}</td>`;
      html += `<td>${escapeXpHistoryHtml(localizeKind(row.kind))}</td>`;
      html += `<td>${escapeXpHistoryHtml(localizeCategory(row.category))}</td>`;
      html += `<td>${escapeXpHistoryHtml(row.what)}</td>`;
      html += `<td class="xp-history-amount">${escapeXpHistoryHtml(formatSigned(row.signedAmount))}</td>`;
      html += `<td>${escapeXpHistoryHtml(row.note || '—')}</td>`;
      html += '</tr>';
    }
  }
  html += '</tbody></table></div>';
  const isGM = Boolean((globalThis as any).game?.user?.isGM);
  if (isGM && entries.length > 0) {
    html += '<div class="history-actions">';
    html += `<button type="button" class="clear-history-btn">${escapeXpHistoryHtml(
      t('MASTERY.xp.history.clear', 'Clear History'),
    )}</button>`;
    html += '</div>';
  }
  html += '</div>';
  void actorName;
  return html;
}

export function openXpHistoryDialog(actor: any, options?: { onCleared?: () => void }): void {
  const DialogCtor = (globalThis as any).Dialog;
  if (!DialogCtor || !actor) return;
  const history: XpHistoryEntry[] = Array.isArray(actor.system?.xp?.history)
    ? actor.system.xp.history
    : [];
  const content = renderXpHistoryTableHtml(String(actor.name || ''), history);
  new DialogCtor(
    {
      title: t('MASTERY.xp.history.title', 'XP History: {name}', { name: String(actor.name || '') }),
      content,
      buttons: {
        close: {
          label: t('MASTERY.xp.history.close', 'Close'),
          callback: () => {},
        },
      },
      default: 'close',
      render: (html: any) => {
        const $html = (globalThis as any).$ ? (globalThis as any).$(html) : html;
        $html.find?.('.clear-history-btn')?.on?.('click', async () => {
          await actor.update({ 'system.xp.history': [] });
          const ui = (globalThis as any).ui;
          ui?.notifications?.info(
            t('MASTERY.xp.history.cleared', 'Cleared XP history for {name}.', {
              name: String(actor.name || ''),
            }),
          );
          options?.onCleared?.();
          $html.closest?.('.dialog')?.find?.('.close')?.click?.();
        });
      },
    },
    {
      width: 960,
      height: 640,
      resizable: true,
      classes: ['xp-history-app'],
    },
  ).render(true);
}
