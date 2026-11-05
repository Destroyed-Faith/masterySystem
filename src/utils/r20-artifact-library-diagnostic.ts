/**
 * R-20 Artifact Library Diagnostic (READ-ONLY).
 *
 * Inspects world library keys, seedVersions, and which actor-owned artifacts
 * would be overwritten by a seedVersion refresh — without writing anything.
 *
 * Console (GM): await game.masterySystem.diagnoseArtifactLibrary()
 */

import { ECHO_ARTIFACT_SEED_VERSION } from '../artifacts/echo-artifact-tree-builder.js';
import { HOLD_ARTIFACT_LIBRARY_AUTO_REFRESH_SETTING } from './seed-artifact-library.js';

const MS = 'mastery-system';

function saveTextFile(contents: string, mime: string, filename: string): void {
  const save = (globalThis as any).foundry?.utils?.saveDataToFile;
  if (typeof save === 'function') {
    save(contents, mime, filename);
    return;
  }
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function asList(collection: any): any[] {
  if (!collection) return [];
  if (Array.from) {
    try {
      return Array.from(collection);
    } catch {
      /* fall through */
    }
  }
  if (Array.isArray(collection)) return collection;
  if (typeof collection.values === 'function') return Array.from(collection.values());
  return [];
}

export interface R20ArtifactLibraryReport {
  format: 'mastery-r20-artifact-library-diagnostic';
  formatVersion: 1;
  generatedAt: string;
  systemVersion: string | null;
  expectedSeedVersion: number;
  holdArtifactLibraryAutoRefresh: boolean | null;
  worldLibrary: {
    artifactItemCount: number;
    distinctKeys: number;
    staleNodeCount: number;
    keys: Array<{
      echoArtifactKey: string;
      nodeCount: number;
      seedVersions: number[];
      staleNodes: number;
      wouldRefresh: boolean;
      nodes: Array<{
        id: string;
        name: string;
        nodeId: string;
        seedVersion: number;
        isRoot: boolean;
        folder: string | null;
        echoBound: unknown;
      }>;
    }>;
  };
  embeddedArtifacts: {
    count: number;
    linkedCount: number;
    wouldBePushedOnRefresh: number;
    items: Array<Record<string, unknown>>;
  };
  notes: string[];
}

export function buildArtifactLibraryDiagnosticReport(): R20ArtifactLibraryReport {
  const expectedSeed = Number(ECHO_ARTIFACT_SEED_VERSION) || 60;
  let hold: boolean | null = null;
  try {
    hold = (game as any).settings?.get?.(MS, HOLD_ARTIFACT_LIBRARY_AUTO_REFRESH_SETTING) === true;
  } catch {
    hold = null;
  }

  const worldArtifacts = asList((game as any).items).filter((it: any) => it?.type === 'artifact');
  const byKey = new Map<string, any[]>();
  for (const it of worldArtifacts) {
    const key = String(it.getFlag?.(MS, 'echoArtifactKey') || '(none)');
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push({
      id: it.id,
      name: it.name,
      nodeId: String(it.getFlag?.(MS, 'nodeId') || ''),
      seedVersion: Number(it.getFlag?.(MS, 'seedVersion') || 0),
      isRoot: it.getFlag?.(MS, 'isRoot') === true,
      folder: it.folder?.name || null,
      echoBound: it.getFlag?.(MS, 'echoBound'),
    });
  }

  const librarySummary = [...byKey.entries()]
    .map(([key, nodes]) => {
      const seeds = [...new Set(nodes.map((n) => n.seedVersion))].sort((a, b) => a - b);
      const stale = nodes.filter((n) => n.seedVersion !== expectedSeed).length;
      return {
        echoArtifactKey: key,
        nodeCount: nodes.length,
        seedVersions: seeds,
        staleNodes: stale,
        wouldRefresh: stale > 0 || nodes.length < 10,
        nodes,
      };
    })
    .sort((a, b) => a.echoArtifactKey.localeCompare(b.echoArtifactKey));

  const embeddedRisk: Array<Record<string, unknown>> = [];
  for (const actor of asList((game as any).actors)) {
    const items = asList(actor.items).filter((it: any) => it?.type === 'artifact');
    for (const emb of items) {
      const rootId = emb.getFlag?.(MS, 'evolutionRootItemId');
      const nodeId = emb.getFlag?.(MS, 'evolutionNodeId');
      const key = String(emb.getFlag?.(MS, 'echoArtifactKey') || '');
      const embSeed = Number(emb.getFlag?.(MS, 'seedVersion') || 0);
      let matchedWorld: any = null;
      if (rootId && nodeId) {
        const root = (game as any).items?.get?.(rootId);
        const folderId = root?.folder?.id;
        if (folderId) {
          matchedWorld = worldArtifacts.find(
            (w: any) =>
              w.folder?.id === folderId &&
              String(w.getFlag?.(MS, 'nodeId') || '') === String(nodeId),
          );
        }
      }
      const worldSeed = Number(matchedWorld?.getFlag?.(MS, 'seedVersion') || 0);
      const linked = !!(rootId && nodeId && matchedWorld);
      embeddedRisk.push({
        actorId: actor.id,
        actorName: actor.name,
        itemId: emb.id,
        itemName: emb.name,
        echoArtifactKey: key || null,
        evolutionRootItemId: rootId || null,
        evolutionNodeId: nodeId || null,
        embeddedSeedVersion: embSeed || null,
        worldNodeId: matchedWorld?.id || null,
        worldSeedVersion: matchedWorld ? worldSeed : null,
        linked,
        wouldOverwriteOnRefresh: linked
          ? ['name', 'img', 'system (full, incl. levelProgression / progressionPicks / baseValues)']
          : [],
        preservedOnRefresh: linked
          ? [
              'flags.artifactActivated',
              'flags.equipment',
              'flags.evolutionRootItemId',
              'flags.evolutionNodeId',
              'document _id',
            ]
          : [],
      });
    }
  }

  return {
    format: 'mastery-r20-artifact-library-diagnostic',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    systemVersion: (game as any).system?.version ?? null,
    expectedSeedVersion: expectedSeed,
    holdArtifactLibraryAutoRefresh: hold,
    worldLibrary: {
      artifactItemCount: worldArtifacts.length,
      distinctKeys: librarySummary.length,
      staleNodeCount: librarySummary.reduce((n, k) => n + k.staleNodes, 0),
      keys: librarySummary,
    },
    embeddedArtifacts: {
      count: embeddedRisk.length,
      linkedCount: embeddedRisk.filter((e) => e.linked).length,
      wouldBePushedOnRefresh: embeddedRisk.filter((e) => e.linked).length,
      items: embeddedRisk,
    },
    notes: [
      'READ-ONLY: this diagnostic never writes world or actor documents.',
      'A seedVersion refresh overwrites world node name/img/system + structural flags, then pushes name/img/system to linked embeds.',
      'Clear holdArtifactLibraryAutoRefresh only after backup + GM decision (W1 / N1).',
      'Manual setting "Refresh Artifact Library" bypasses the hold (force: true).',
      'Run via console: await game.masterySystem.diagnoseArtifactLibrary()',
    ],
  };
}

/**
 * Build the report, download JSON via Foundry saveDataToFile, notify GM.
 * Returns the report object for console inspection.
 */
export async function diagnoseArtifactLibrary(
  options: { download?: boolean } = {},
): Promise<R20ArtifactLibraryReport> {
  if (!(game as any).user?.isGM) {
    ui.notifications?.error?.('R-20: GM only.');
    throw new Error('R-20: GM only');
  }

  const report = buildArtifactLibraryDiagnosticReport();
  const filename = `r20-artifact-library-${Date.now()}.json`;
  const json = JSON.stringify(report, null, 2);

  if (options.download !== false) {
    try {
      saveTextFile(json, 'text/json', filename);
    } catch (err) {
      console.warn('[R-20] saveDataToFile failed; report is still in the return value / console', err);
      ui.notifications?.warn?.(
        'R-20: browser download blocked — report is in the F12 console return value.',
      );
    }
  }

  const stale = report.worldLibrary.staleNodeCount;
  const linked = report.embeddedArtifacts.wouldBePushedOnRefresh;
  ui.notifications?.info?.(
    `R-20: ${report.worldLibrary.distinctKeys} library keys, ${stale} stale node(s), ${linked} linked embed(s) at risk. Hold=${report.holdArtifactLibraryAutoRefresh}.`,
  );
  console.info('[R-20 artifact library diagnostic]', report);
  return report;
}
