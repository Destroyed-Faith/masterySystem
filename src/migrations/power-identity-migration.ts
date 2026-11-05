/**
 * Batch E — Identity migration infrastructure (plan §10.3).
 * Writes ONLY identity fields. Never deletes documents. Fixture-safe.
 */

import type { ArtifactLevelProgressionRow } from '../types/item.js';
import { ECHO_ARTIFACTS } from '../utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../utils/general-artifacts.js';
import { ALL_POWER_TEMPLATES } from '../utils/powers/templates/index.js';
import { resolvePowerIdentity } from '../utils/power-identity.js';

export const IDENTITY_BACKUP_FLAG = 'identityMigrationBackup';
export const IDENTITY_REVIEW_FLAG = 'identityReview';

export type IdentityMigrationDisposition =
  | 'auto-stable-key'
  | 'auto-provenance'
  | 'manual'
  | 'skip';

export interface IdentityMigrationProposal {
  actorId?: string;
  itemId?: string;
  effectId?: string;
  path: string;
  disposition: IdentityMigrationDisposition;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  basis: string;
  selected: boolean;
}

export interface IdentityMigrationReport {
  generatedAt: string;
  dryRun: boolean;
  proposals: IdentityMigrationProposal[];
  applied: number;
  skipped: number;
}

/** Four-section dry-run report (plan §10.3). */
export interface IdentityMigrationDryRunSections {
  generatedAt: string;
  autoStableKey: IdentityMigrationProposal[];
  autoProvenance: IdentityMigrationProposal[];
  manual: IdentityMigrationProposal[];
  notActivatable: IdentityMigrationProposal[];
}

/** Narrow document shapes used by the migration (fixtures + Foundry). */
interface MigrationFlags {
  'mastery-system'?: Record<string, unknown> & {
    echoArtifactKey?: string;
    activeBuff?: unknown;
    artifactActiveBuff?: unknown;
    powerId?: string;
    powerTemplateId?: string;
    [IDENTITY_BACKUP_FLAG]?: IdentityBackupEntry | IdentityBackupEntry[];
    [IDENTITY_REVIEW_FLAG]?: { status: string; at: string; by: string };
  };
}

interface MigrationItemSystem {
  templateId?: string | null;
  templateName?: string | null;
  rank?: number | string | null;
  echoKey?: string | null;
  levelProgression?: ArtifactLevelProgressionRow[];
  progressionPicks?: Array<{
    authoredStages?: ArtifactLevelProgressionRow[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface MigrationItem {
  id?: string;
  type?: string;
  system?: MigrationItemSystem;
  flags?: MigrationFlags;
  update?: (data: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface MigrationEffect {
  id?: string;
  flags?: MigrationFlags;
  update?: (data: Record<string, unknown>) => Promise<unknown> | unknown;
}

export interface IdentityBackupEntry {
  version: number;
  at: string;
  path: string;
  old: Record<string, unknown>;
}

interface MigrationActor {
  id?: string;
  items?: Iterable<MigrationItem> | MigrationItem[] | { values?: () => Iterable<MigrationItem> };
  effects?: Iterable<MigrationEffect> | MigrationEffect[] | { values?: () => Iterable<MigrationEffect> };
}

function asItemList(actor: MigrationActor): MigrationItem[] {
  const raw = actor.items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof (raw as { values?: unknown }).values === 'function') {
    return Array.from((raw as { values: () => Iterable<MigrationItem> }).values());
  }
  return Array.from(raw as Iterable<MigrationItem>);
}

function asEffectList(actor: MigrationActor): MigrationEffect[] {
  const raw = actor.effects;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof (raw as { values?: unknown }).values === 'function') {
    return Array.from((raw as { values: () => Iterable<MigrationEffect> }).values());
  }
  return Array.from(raw as Iterable<MigrationEffect>);
}

function catalogArtifactByKey(
  key: string,
): { levelProgression?: ArtifactLevelProgressionRow[] } | null {
  const echo = (ECHO_ARTIFACTS as Record<string, { levelProgression?: ArtifactLevelProgressionRow[] } | undefined>)[key];
  if (echo) return echo;
  const general = (GENERAL_ARTIFACTS as Record<string, { levelProgression?: ArtifactLevelProgressionRow[] } | undefined>)[key];
  return general || null;
}

function exactTemplateNameMap(): Map<string, string> {
  const counts = new Map<string, number>();
  const ids = new Map<string, string>();
  for (const t of ALL_POWER_TEMPLATES) {
    const name = String(t.templateName || '').trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
    ids.set(name, t.templateId);
  }
  const out = new Map<string, string>();
  for (const [name, id] of ids) {
    if (counts.get(name) === 1) out.set(name, id);
  }
  return out;
}

function readBackupList(flags: MigrationFlags | undefined): IdentityBackupEntry[] {
  const raw = flags?.['mastery-system']?.[IDENTITY_BACKUP_FLAG];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((e) => e && typeof e === 'object' && e.path);
  if (typeof raw === 'object' && (raw as IdentityBackupEntry).path) {
    return [raw as IdentityBackupEntry];
  }
  return [];
}

function appendBackup(
  flags: MigrationFlags | undefined,
  entry: IdentityBackupEntry,
): IdentityBackupEntry[] {
  const list = readBackupList(flags);
  const without = list.filter((e) => e.path !== entry.path);
  without.push(entry);
  return without;
}

function identityDiff(
  row: ArtifactLevelProgressionRow,
  catalogRow: ArtifactLevelProgressionRow,
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const before: Record<string, unknown> = {
    powerTemplateId: row.powerTemplateId ?? null,
    artifactFunctionId: row.artifactFunctionId ?? null,
    rank: row.rank ?? null,
    limited: row.limited ?? null,
  };
  const after: Record<string, unknown> = {};
  // Never overwrite an already-structured identity (GM reassignment).
  if (row.powerTemplateId || row.artifactFunctionId) return null;
  if (catalogRow.powerTemplateId) after.powerTemplateId = catalogRow.powerTemplateId;
  if (catalogRow.artifactFunctionId) after.artifactFunctionId = catalogRow.artifactFunctionId;
  if (catalogRow.rank != null) after.rank = catalogRow.rank;
  else if (catalogRow.powerTemplateId) {
    const lvl = Number(row.level);
    const stage = Math.floor((lvl - 1) / 3);
    after.rank = ([4, 10, 16] as const)[Math.max(0, Math.min(2, stage))];
  }
  if (catalogRow.limited === true) after.limited = true;
  if (Object.keys(after).length === 0) return null;
  return { before, after };
}

/** Build the four-section dry-run report from proposals. */
export function buildIdentityMigrationDryRunSections(
  proposals: IdentityMigrationProposal[],
): IdentityMigrationDryRunSections {
  return {
    generatedAt: new Date().toISOString(),
    autoStableKey: proposals.filter((p) => p.disposition === 'auto-stable-key'),
    autoProvenance: proposals.filter((p) => p.disposition === 'auto-provenance'),
    manual: proposals.filter((p) => p.disposition === 'manual'),
    notActivatable: proposals.filter((p) => p.disposition === 'skip'),
  };
}

export function formatIdentityMigrationDryRunMarkdown(
  sections: IdentityMigrationDryRunSections,
): string {
  const block = (title: string, list: IdentityMigrationProposal[]) => {
    const lines = [`## ${title} (${list.length})`, ''];
    if (!list.length) {
      lines.push('_none_', '');
      return lines;
    }
    for (const p of list) {
      lines.push(
        `- \`${p.path}\` · ${p.basis} · before=${JSON.stringify(p.before)} → after=${JSON.stringify(p.after)}`,
      );
    }
    lines.push('');
    return lines;
  };
  return [
    '# Identity Migration Dry-Run',
    '',
    `Generated: ${sections.generatedAt}`,
    '',
    ...block('Auto (stabiler Schlüssel)', sections.autoStableKey),
    ...block('Auto (Herkunftsdatum)', sections.autoProvenance),
    ...block('Manuell', sections.manual),
    ...block('Nicht aktivierbar / Skip', sections.notActivatable),
  ].join('\n');
}

/** Dry-run / apply proposals for one actor (fixture-safe). */
export function planActorIdentityMigration(actor: MigrationActor | null | undefined): IdentityMigrationProposal[] {
  const proposals: IdentityMigrationProposal[] = [];
  if (!actor) return proposals;
  const nameMap = exactTemplateNameMap();
  const items = asItemList(actor);

  for (const item of items) {
    if (item?.type === 'power') {
      const sys = item.system ?? {};
      if (sys.templateId) continue;
      const exact = sys.templateName ? nameMap.get(String(sys.templateName).trim()) : null;
      if (exact) {
        proposals.push({
          itemId: item.id,
          path: `items.${item.id}.system.templateId`,
          disposition: 'auto-provenance',
          before: { templateId: sys.templateId ?? null },
          after: { templateId: exact },
          basis: 'templateName-exact',
          selected: false,
        });
      } else {
        proposals.push({
          itemId: item.id,
          path: `items.${item.id}.system.templateId`,
          disposition: 'manual',
          before: { templateId: sys.templateId ?? null },
          after: {},
          basis: 'none',
          selected: false,
        });
      }
    }

    if (item?.type === 'artifact') {
      // K2/K7: only flags.echoArtifactKey — never system.echoKey (Echo imprint).
      const key = String(item.flags?.['mastery-system']?.echoArtifactKey || '').trim();
      const def = key ? catalogArtifactByKey(key) : null;
      const rows = Array.isArray(item.system?.levelProgression)
        ? item.system.levelProgression
        : [];
      rows.forEach((row, idx) => {
        const lvl = Number(row?.level);
        const catalogRow = def?.levelProgression?.find((r) => Number(r.level) === lvl);
        if (!catalogRow) {
          if (!key && !row.powerTemplateId && !row.artifactFunctionId) {
            proposals.push({
              itemId: item.id,
              path: `items.${item.id}.system.levelProgression.${idx}`,
              disposition: 'manual',
              before: {
                powerTemplateId: row.powerTemplateId ?? null,
                artifactFunctionId: row.artifactFunctionId ?? null,
                rank: row.rank ?? null,
              },
              after: {},
              basis: 'none',
              selected: false,
            });
          }
          return;
        }
        const diff = identityDiff(row, catalogRow);
        if (!diff) return;
        proposals.push({
          itemId: item.id,
          path: `items.${item.id}.system.levelProgression.${idx}`,
          disposition: key ? 'auto-stable-key' : 'manual',
          before: diff.before,
          after: diff.after,
          basis: key ? 'echoArtifactKey+level' : 'none',
          selected: !!key,
        });
      });

      // Plan 10.2a: also patch progressionPicks[].authoredStages so Node-Editor
      // recompiles keep identity.
      const picks = Array.isArray(item.system?.progressionPicks)
        ? item.system.progressionPicks
        : [];
      picks.forEach((pick, pIdx) => {
        const stages = Array.isArray(pick?.authoredStages) ? pick.authoredStages : [];
        stages.forEach((stage, sIdx) => {
          const catalogRow = def?.levelProgression?.find(
            (r) => Number(r.level) === Number(stage.level),
          );
          if (!catalogRow) return;
          const diff = identityDiff(stage, catalogRow);
          if (!diff) return;
          proposals.push({
            itemId: item.id,
            path: `items.${item.id}.system.progressionPicks.${pIdx}.authoredStages.${sIdx}`,
            disposition: key ? 'auto-stable-key' : 'manual',
            before: diff.before,
            after: diff.after,
            basis: key ? 'echoArtifactKey+level' : 'none',
            selected: !!key,
          });
        });
      });
    }
  }

  const effects = asEffectList(actor);
  for (const effect of effects) {
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff && !flags?.artifactActiveBuff) continue;
    if (flags.powerTemplateId) continue;
    const powerId = flags.powerId;
    const power = powerId ? items.find((i) => i.id === powerId) : null;
    const tid = power?.system?.templateId ? String(power.system.templateId) : null;
    if (tid) {
      proposals.push({
        effectId: effect.id,
        path: `effects.${effect.id}.flags.mastery-system.powerTemplateId`,
        disposition: 'auto-stable-key',
        before: { powerTemplateId: null },
        after: { powerTemplateId: tid, rank: Number(power?.system?.rank) || 1 },
        basis: 'flags.powerId',
        selected: true,
      });
    } else {
      proposals.push({
        effectId: effect.id,
        path: `effects.${effect.id}.flags.mastery-system.powerTemplateId`,
        disposition: 'manual',
        before: { powerTemplateId: null },
        after: {},
        basis: 'none',
        selected: false,
      });
    }
  }

  return proposals;
}

/**
 * Apply selected proposals. Mutates fixture actor objects in memory when
 * `update` methods are absent (tests). Never deletes. Writes backup flag.
 */
export async function applyIdentityMigrationProposals(
  actor: MigrationActor,
  proposals: IdentityMigrationProposal[],
  opts?: { dryRun?: boolean },
): Promise<IdentityMigrationReport> {
  const dryRun = opts?.dryRun === true;
  let applied = 0;
  let skipped = 0;
  const items = asItemList(actor);
  const effects = asEffectList(actor);

  for (const p of proposals) {
    if (!p.selected || Object.keys(p.after).length === 0) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      applied += 1;
      continue;
    }

    if (p.itemId && p.path.includes('levelProgression')) {
      const item = items.find((i) => i.id === p.itemId);
      if (!item) {
        skipped += 1;
        continue;
      }
      const rows = Array.isArray(item.system?.levelProgression)
        ? item.system.levelProgression.map((r) => ({ ...r }))
        : [];
      const m = /\.levelProgression\.(\d+)/.exec(p.path);
      const idx = m ? Number(m[1]) : -1;
      if (idx < 0 || !rows[idx]) {
        skipped += 1;
        continue;
      }
      const backup: IdentityBackupEntry = {
        version: 1,
        at: new Date().toISOString(),
        path: p.path,
        old: { ...p.before },
      };
      Object.assign(rows[idx], p.after);
      const backups = appendBackup(item.flags, backup);
      const patch = {
        system: { levelProgression: rows },
        flags: {
          'mastery-system': {
            ...(item.flags?.['mastery-system'] || {}),
            [IDENTITY_BACKUP_FLAG]: backups,
          },
        },
      };
      if (typeof item.update === 'function') await item.update(patch);
      else {
        if (!item.system) item.system = {};
        item.system.levelProgression = rows;
        item.flags = item.flags || {};
        item.flags['mastery-system'] = {
          ...(item.flags['mastery-system'] || {}),
          [IDENTITY_BACKUP_FLAG]: backups,
        };
      }
      applied += 1;
      continue;
    }

    if (p.itemId && p.path.includes('authoredStages')) {
      const item = items.find((i) => i.id === p.itemId);
      if (!item?.system) {
        skipped += 1;
        continue;
      }
      const m = /\.progressionPicks\.(\d+)\.authoredStages\.(\d+)/.exec(p.path);
      const pIdx = m ? Number(m[1]) : -1;
      const sIdx = m ? Number(m[2]) : -1;
      const picks = Array.isArray(item.system.progressionPicks)
        ? item.system.progressionPicks.map((pick) => ({
            ...pick,
            authoredStages: Array.isArray(pick.authoredStages)
              ? pick.authoredStages.map((s) => ({ ...s }))
              : [],
          }))
        : [];
      if (pIdx < 0 || sIdx < 0 || !picks[pIdx]?.authoredStages?.[sIdx]) {
        skipped += 1;
        continue;
      }
      const backup: IdentityBackupEntry = {
        version: 1,
        at: new Date().toISOString(),
        path: p.path,
        old: { ...p.before },
      };
      Object.assign(picks[pIdx]!.authoredStages![sIdx]!, p.after);
      const backups = appendBackup(item.flags, backup);
      const patch = {
        system: { progressionPicks: picks },
        flags: {
          'mastery-system': {
            ...(item.flags?.['mastery-system'] || {}),
            [IDENTITY_BACKUP_FLAG]: backups,
          },
        },
      };
      if (typeof item.update === 'function') await item.update(patch);
      else {
        item.system.progressionPicks = picks;
        item.flags = item.flags || {};
        item.flags['mastery-system'] = {
          ...(item.flags['mastery-system'] || {}),
          [IDENTITY_BACKUP_FLAG]: backups,
        };
      }
      applied += 1;
      continue;
    }

    if (p.itemId && p.path.includes('templateId')) {
      const item = items.find((i) => i.id === p.itemId);
      if (!item) {
        skipped += 1;
        continue;
      }
      const backup: IdentityBackupEntry = {
        version: 1,
        at: new Date().toISOString(),
        path: p.path,
        old: { ...p.before },
      };
      const backups = appendBackup(item.flags, backup);
      const patch = {
        system: { ...p.after },
        flags: {
          'mastery-system': {
            ...(item.flags?.['mastery-system'] || {}),
            [IDENTITY_BACKUP_FLAG]: backups,
          },
        },
      };
      if (typeof item.update === 'function') await item.update(patch);
      else {
        if (!item.system) item.system = {};
        Object.assign(item.system, p.after);
        item.flags = item.flags || {};
        item.flags['mastery-system'] = {
          ...(item.flags['mastery-system'] || {}),
          [IDENTITY_BACKUP_FLAG]: backups,
        };
      }
      applied += 1;
      continue;
    }

    if (p.effectId) {
      const effect = effects.find((e) => e.id === p.effectId);
      if (!effect) {
        skipped += 1;
        continue;
      }
      const backup: IdentityBackupEntry = {
        version: 1,
        at: new Date().toISOString(),
        path: p.path,
        old: { ...p.before },
      };
      const backups = appendBackup(effect.flags, backup);
      const nextFlags = {
        ...(effect.flags?.['mastery-system'] || {}),
        ...p.after,
        [IDENTITY_BACKUP_FLAG]: backups,
      };
      const patch = { flags: { 'mastery-system': nextFlags } };
      // K7 / F7: persist via Foundry update() when available.
      if (typeof effect.update === 'function') await effect.update(patch);
      else {
        effect.flags = effect.flags || {};
        effect.flags['mastery-system'] = nextFlags;
      }
      applied += 1;
      continue;
    }

    skipped += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    dryRun,
    proposals,
    applied,
    skipped,
  };
}

/**
 * Build a Foundry flag/system patch that restores `old` identity fields.
 * Keys whose backup value is null/undefined become `-=key` deletions
 * (Foundry merge does not remove keys on plain omit / `delete`).
 */
export function buildIdentityRollbackFieldPatch(
  old: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(old)) {
    if (v == null) patch[`-=${k}`] = null;
    else patch[k] = v;
  }
  return patch;
}

function applyIdentityFieldsLocally(
  target: object,
  old: Record<string, unknown>,
): void {
  const t = target as Record<string, unknown>;
  for (const [k, v] of Object.entries(old)) {
    if (v == null) delete t[k];
    else t[k] = v;
  }
}

/**
 * Restore identity fields from backup flag array.
 * K7b: Foundry updates use explicit `-=key` deletions so newly introduced
 * identity keys (and the backup flag itself) are actually removed.
 */
export async function rollbackIdentityMigration(actor: MigrationActor): Promise<number> {
  let restored = 0;
  const items = asItemList(actor);

  for (const item of items) {
    const backups = readBackupList(item.flags);
    if (!backups.length) continue;

    const liveRows = Array.isArray(item.system?.levelProgression)
      ? item.system!.levelProgression!
      : null;
    const livePicks = Array.isArray(item.system?.progressionPicks)
      ? item.system!.progressionPicks!
      : null;
    const useFoundryUpdate = typeof item.update === 'function';
    // Foundry path: never mutate live docs before update() — only the patch
    // (with `-=` deletions) may change the document under merge semantics.
    const rowsForPatch =
      useFoundryUpdate && liveRows ? liveRows.map((r) => ({ ...r })) : liveRows;
    const picksForPatch =
      useFoundryUpdate && livePicks
        ? livePicks.map((pick) => ({
            ...pick,
            authoredStages: Array.isArray(pick.authoredStages)
              ? pick.authoredStages.map((s) => ({ ...s }))
              : pick.authoredStages,
          }))
        : livePicks;
    const systemSet: Record<string, unknown> = {};
    const systemRemove: string[] = [];
    let touchedRows = false;
    let touchedPicks = false;

    for (const backup of [...backups].reverse()) {
      if (!backup?.old || !backup.path) continue;

      if (backup.path.includes('levelProgression') && rowsForPatch) {
        const m = /\.levelProgression\.(\d+)/.exec(backup.path);
        const idx = m ? Number(m[1]) : -1;
        if (idx < 0 || !rowsForPatch[idx]) continue;
        applyIdentityFieldsLocally(rowsForPatch[idx]!, backup.old);
        touchedRows = true;
        restored += 1;
        continue;
      }

      if (backup.path.includes('authoredStages') && picksForPatch) {
        const m = /\.progressionPicks\.(\d+)\.authoredStages\.(\d+)/.exec(backup.path);
        const pIdx = m ? Number(m[1]) : -1;
        const sIdx = m ? Number(m[2]) : -1;
        const stage = picksForPatch[pIdx]?.authoredStages?.[sIdx];
        if (!stage) continue;
        applyIdentityFieldsLocally(stage, backup.old);
        touchedPicks = true;
        restored += 1;
        continue;
      }

      if (backup.path.includes('templateId') || /items\.[^.]+\.system\./.test(backup.path)) {
        for (const [k, v] of Object.entries(backup.old)) {
          if (v == null) systemRemove.push(k);
          else systemSet[k] = v;
        }
        restored += 1;
      }
    }

    const masteryFlagPatch: Record<string, unknown> = {
      [`-=${IDENTITY_BACKUP_FLAG}`]: null,
    };
    const systemPatch: Record<string, unknown> = { ...systemSet };
    for (const k of systemRemove) systemPatch[`-=${k}`] = null;
    if (touchedRows && rowsForPatch) systemPatch.levelProgression = rowsForPatch;
    if (touchedPicks && picksForPatch) systemPatch.progressionPicks = picksForPatch;

    if (useFoundryUpdate) {
      await item.update!({
        ...(Object.keys(systemPatch).length ? { system: systemPatch } : {}),
        flags: { 'mastery-system': masteryFlagPatch },
      });
    } else {
      if (!item.system) item.system = {};
      // In-memory: rowsForPatch/picksForPatch alias the live arrays already restored.
      for (const [k, v] of Object.entries(systemSet)) (item.system as any)[k] = v;
      for (const k of systemRemove) delete (item.system as any)[k];
      if (item.flags?.['mastery-system']) {
        delete item.flags['mastery-system'][IDENTITY_BACKUP_FLAG];
      }
    }
  }

  const effects = asEffectList(actor);
  for (const effect of effects) {
    const backups = readBackupList(effect.flags);
    if (!backups.length) continue;

    const flagPatch: Record<string, unknown> = {
      [`-=${IDENTITY_BACKUP_FLAG}`]: null,
    };
    for (const backup of [...backups].reverse()) {
      if (!backup?.old) continue;
      Object.assign(flagPatch, buildIdentityRollbackFieldPatch(backup.old));
      restored += 1;
    }

    if (typeof effect.update === 'function') {
      await effect.update({ flags: { 'mastery-system': flagPatch } });
    } else {
      effect.flags = effect.flags || {};
      effect.flags['mastery-system'] = effect.flags['mastery-system'] || {};
      for (const [k, v] of Object.entries(flagPatch)) {
        if (k.startsWith('-=')) {
          delete effect.flags['mastery-system'][k.slice(2)];
        } else {
          effect.flags['mastery-system'][k] = v;
        }
      }
    }
  }

  return restored;
}

/** Acknowledge remaining unresolved entry on a document. */
export function acknowledgeIdentityReview(
  doc: { flags?: MigrationFlags },
  by: string,
): void {
  if (!doc) return;
  doc.flags = doc.flags || {};
  doc.flags['mastery-system'] = {
    ...(doc.flags['mastery-system'] || {}),
    [IDENTITY_REVIEW_FLAG]: { status: 'acknowledged', at: new Date().toISOString(), by },
  };
}

/** Validate that a proposal's `after` resolves via resolvePowerIdentity. */
export function proposalResolves(
  proposal: IdentityMigrationProposal,
  rowOrItem: Record<string, unknown> | MigrationItem | null | undefined,
): boolean {
  if (proposal.path.includes('levelProgression')) {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: { ...(rowOrItem as Record<string, unknown>), ...proposal.after },
    });
    return id.ok;
  }
  if (proposal.path.includes('templateId')) {
    const item = rowOrItem as MigrationItem | undefined;
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        system: {
          ...(item?.system || {}),
          ...proposal.after,
          rank: item?.system?.rank || 1,
        },
      },
    });
    return id.ok;
  }
  return Object.keys(proposal.after).length > 0;
}
