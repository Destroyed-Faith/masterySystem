/**
 * Mastery System – R-20 Artifact Library Diagnostic (READ-ONLY)
 * ---------------------------------------------------------------------------
 * Foundry VTT Script Macro (GM only). Paste into a Macro of type "Script".
 *
 * Inspects world library keys, seedVersions, and which actor-owned artifacts
 * would be overwritten by a seedVersion refresh — WITHOUT writing anything.
 *
 * Docs: docs/audits/K0_K9_CORRECTION_REPORT.md §P1
 */
(async () => {
  'use strict';

  if (typeof game === 'undefined' || !game?.ready) {
    ui?.notifications?.error?.('R-20: Foundry game is not ready.');
    return;
  }
  if (!game.user?.isGM) {
    ui?.notifications?.error?.('R-20: GM only.');
    return;
  }

  const MS = 'mastery-system';
  const SEED = Number(
    game.masterySystem?.ECHO_ARTIFACT_SEED_VERSION ??
      (() => {
        try {
          return game.settings?.get?.(MS, '_unused');
        } catch {
          return null;
        }
      })(),
  );

  // Prefer the live constant from the system API / builder when available.
  let expectedSeed = 60;
  try {
    const mod = await import('/systems/mastery-system/dist/artifacts/echo-artifact-tree-builder.js');
    if (Number(mod.ECHO_ARTIFACT_SEED_VERSION) > 0) {
      expectedSeed = Number(mod.ECHO_ARTIFACT_SEED_VERSION);
    }
  } catch {
    /* use default 60 */
  }
  void SEED;

  const hold = game.settings?.get?.(MS, 'holdArtifactLibraryAutoRefresh');

  const worldArtifacts = Array.from(game.items ?? []).filter((it) => it.type === 'artifact');
  const byKey = new Map();
  for (const it of worldArtifacts) {
    const key = String(it.getFlag?.(MS, 'echoArtifactKey') || '(none)');
    const nodeId = String(it.getFlag?.(MS, 'nodeId') || '');
    const seedVersion = Number(it.getFlag?.(MS, 'seedVersion') || 0);
    const isRoot = it.getFlag?.(MS, 'isRoot') === true;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({
      id: it.id,
      name: it.name,
      nodeId,
      seedVersion,
      isRoot,
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

  const actors = Array.from(game.actors ?? []);
  const embeddedRisk = [];
  for (const actor of actors) {
    const items = Array.from(actor.items ?? []).filter((it) => it.type === 'artifact');
    for (const emb of items) {
      const rootId = emb.getFlag?.(MS, 'evolutionRootItemId');
      const nodeId = emb.getFlag?.(MS, 'evolutionNodeId');
      const key = String(emb.getFlag?.(MS, 'echoArtifactKey') || '');
      const embSeed = Number(emb.getFlag?.(MS, 'seedVersion') || 0);
      const worldNode = rootId && nodeId ? game.items?.get?.(rootId) : null;
      let matchedWorld = null;
      if (rootId && nodeId) {
        const root = game.items?.get?.(rootId);
        const folderId = root?.folder?.id;
        if (folderId) {
          matchedWorld = worldArtifacts.find(
            (w) =>
              w.folder?.id === folderId && String(w.getFlag?.(MS, 'nodeId') || '') === String(nodeId),
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
        /** If a refresh runs, these fields on the embed would be replaced from the world node. */
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

  const report = {
    format: 'mastery-r20-artifact-library-diagnostic',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    systemVersion: game.system?.version ?? null,
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
      'READ-ONLY: this macro never writes world or actor documents.',
      'A seedVersion refresh overwrites world node name/img/system + structural flags, then pushes name/img/system to linked embeds.',
      'Clear holdArtifactLibraryAutoRefresh only after backup + GM decision (W1 / N1).',
      'Manual setting "Refresh Artifact Library" bypasses the hold (force: true).',
    ],
  };

  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `r20-artifact-library-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const stale = report.worldLibrary.staleNodeCount;
  const linked = report.embeddedArtifacts.wouldBePushedOnRefresh;
  ui.notifications?.info(
    `R-20: ${report.worldLibrary.distinctKeys} library keys, ${stale} stale node(s), ${linked} linked embed(s) at risk. Hold=${hold}. JSON downloaded.`,
  );
  console.info('[R-20 artifact library diagnostic]', report);
})();
