/**
 * Mastery System – Export Identity Snapshot
 * ---------------------------------------------------------------------------
 * Foundry VTT Script Macro (GM only, READ-ONLY).
 *
 * Paste this entire file into a Foundry Macro of type "Script", name it
 * "Mastery System – Export Identity Snapshot", and run it as GM.
 *
 * Downloads a JSON snapshot of identity-relevant world / pack / token data so
 * the local identity preflight and migration dry-run can process a Forge world
 * without a local Foundry install.
 *
 * NEVER writes, updates, migrates, or deletes world documents.
 * NEVER exports passwords, API keys, auth tokens, or ownership maps.
 *
 * Offline consumer: scripts/run-identity-snapshot-audit.mjs
 * Docs: docs/audits/IDENTITY_SNAPSHOT_EXPORT.md
 */
(async () => {
  'use strict';

  const FORMAT = 'mastery-identity-snapshot';
  const FORMAT_VERSION = 1;
  const MS = 'mastery-system';

  // Keys / substrings that must never leave the world.
  const SENSITIVE_KEY =
    /pass(word|phrase)|secret|api[_-]?key|auth(orization|token)?|access[_-]?token|refresh[_-]?token|bearer|credential|private[_-]?key|session|cookie|webhook|discord[_-]?token|pat\b|ssh/i;

  const MASTERY_FLAG_ALLOW = new Set([
    'echoArtifactKey',
    'activeBuff',
    'artifactActiveBuff',
    'powerId',
    'powerTemplateId',
    'rank',
    'artifactFunctionId',
    'limited',
    'limitedChargeSpent',
    'identityReview',
    'identityMigrationBackup',
    'conditions',
    'statusEffects',
    'chosenSpecialKey',
    'isUtility',
    'sourceKind',
    'buffTemplateId',
  ]);

  const ITEM_TYPES = new Set(['power', 'artifact', 'weapon', 'equipment', 'consumable', 'loot', 'feat']);

  /** @type {{ where: string, message: string, severity?: string }[]} */
  const errors = [];
  /** @type {{ where: string, message: string }[]} */
  const warnings = [];

  // ---- guards -------------------------------------------------------------

  if (typeof game === 'undefined' || !game?.ready) {
    ui?.notifications?.error?.('Mastery Identity Snapshot: Foundry game is not ready.');
    return;
  }
  if (!game.user?.isGM) {
    ui?.notifications?.error?.('Mastery Identity Snapshot: GM only.');
    return;
  }

  // ---- helpers ------------------------------------------------------------

  function noteError(where, err, severity = 'error') {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ where, message, severity });
    console.warn('[identity-snapshot]', where, message);
  }

  function noteWarn(where, message) {
    warnings.push({ where, message });
  }

  function asList(collection) {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection;
    if (typeof collection.values === 'function') return Array.from(collection.values());
    try {
      return Array.from(collection);
    } catch {
      return [];
    }
  }

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  function sanitizeDeep(value, depth = 0) {
    if (depth > 12) return '[truncated-depth]';
    if (value == null) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((v) => sanitizeDeep(v, depth + 1));
    }
    if (!isPlainObject(value)) {
      // Drop Foundry Document / Map / Set / function instances.
      return undefined;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(k)) {
        out[k] = '[redacted]';
        continue;
      }
      const cleaned = sanitizeDeep(v, depth + 1);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }

  function pickMasteryFlags(flags) {
    const raw = flags?.[MS] || flags?.masterySystem || null;
    if (!raw || typeof raw !== 'object') return undefined;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (SENSITIVE_KEY.test(k)) continue;
      if (!MASTERY_FLAG_ALLOW.has(k) && !/^power/i.test(k) && !/^artifact/i.test(k) && !/^identity/i.test(k)) {
        // Keep unknown mastery keys that look identity/combat related; drop fluff.
        if (!/template|rank|limited|special|buff|charge|breath|echo|status|condition/i.test(k)) {
          continue;
        }
      }
      const cleaned = sanitizeDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return Object.keys(out).length ? out : undefined;
  }

  function truncateText(s, max = 240) {
    const t = String(s ?? '');
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }

  function exportProgressionRow(row) {
    if (!row || typeof row !== 'object') return null;
    return {
      level: row.level ?? null,
      name: row.name ?? null,
      type: row.type ?? null,
      range: row.range ?? null,
      aoe: row.aoe ?? null,
      duration: row.duration ?? null,
      special: row.special ?? null,
      effect: truncateText(row.effect, 320),
      powerTemplateId: row.powerTemplateId ?? null,
      artifactFunctionId: row.artifactFunctionId ?? null,
      rank: row.rank ?? null,
      limited: row.limited === true ? true : row.limited === false ? false : null,
      chosenSpecialKey: row.chosenSpecialKey ?? null,
      isSpell: row.isSpell === true ? true : null,
      castingAttribute: row.castingAttribute ?? null,
      spellResolution: row.spellResolution ?? null,
      embeddedPowerId: row.embeddedPowerId ?? null,
    };
  }

  function exportItem(item, incomplete = false) {
    try {
      const type = String(item?.type || '');
      if (!ITEM_TYPES.has(type) && type !== 'power' && type !== 'artifact') {
        // Still export unknown types that carry identity flags / templateId.
        const sys = item?.system || {};
        const hasIdentity =
          !!sys.templateId ||
          !!sys.powerTemplateId ||
          !!sys.artifactFunctionId ||
          Array.isArray(sys.levelProgression);
        if (!hasIdentity) return null;
      }

      const sys = item?.system || {};
      const mastery = pickMasteryFlags(item?.flags);
      const base = {
        id: item?.id ?? null,
        uuid: typeof item?.uuid === 'string' ? item.uuid : null,
        name: item?.name ?? null,
        type,
        incomplete: !!incomplete,
        flags: mastery ? { [MS]: mastery } : undefined,
        system: {},
      };

      if (type === 'power' || sys.templateId || sys.templateName) {
        base.system = {
          templateId: sys.templateId ?? null,
          templateName: sys.templateName ?? null,
          rank: sys.rank ?? null,
          level: sys.level ?? null,
          category: sys.category ?? null,
          powerType: sys.powerType ?? null,
          limited: sys.limited === true ? true : sys.limited === false ? false : null,
          chosenSpecialKey: sys.chosenSpecialKey ?? null,
          cost: sanitizeDeep(sys.cost) ?? null,
          // Level keys only — full mechanics live in the catalog, not the snapshot.
          levelKeys: sys.levels && typeof sys.levels === 'object' ? Object.keys(sys.levels) : [],
          description: truncateText(sys.description, 160),
        };
      } else if (type === 'artifact') {
        const rows = Array.isArray(sys.levelProgression) ? sys.levelProgression : [];
        const picks = Array.isArray(sys.progressionPicks) ? sys.progressionPicks : [];
        base.system = {
          currentLevel: sys.currentLevel ?? sys.level ?? null,
          echoKey: sys.echoKey ?? null, // imprint key — documented; enrichment ignores it
          useAuthoredLevelProgression: sys.useAuthoredLevelProgression === true,
          levelProgression: rows.map(exportProgressionRow).filter(Boolean),
          progressionPicks: picks.map((pick, pIdx) => ({
            pickIndex: pIdx,
            id: pick?.id ?? null,
            name: pick?.name ?? null,
            authoredStages: Array.isArray(pick?.authoredStages)
              ? pick.authoredStages.map(exportProgressionRow).filter(Boolean)
              : [],
          })),
        };
      } else {
        base.system = {
          templateId: sys.templateId ?? null,
          powerTemplateId: sys.powerTemplateId ?? null,
          artifactFunctionId: sys.artifactFunctionId ?? null,
          rank: sys.rank ?? null,
          limited: sys.limited ?? null,
        };
      }
      return base;
    } catch (err) {
      noteError(`item:${item?.id || '?'}`, err);
      return {
        id: item?.id ?? null,
        name: item?.name ?? null,
        type: item?.type ?? null,
        incomplete: true,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  function exportEffect(effect) {
    try {
      const mastery = pickMasteryFlags(effect?.flags);
      if (!mastery) {
        // Skip non-mastery effects (conditions without identity flags).
        const raw = effect?.flags?.[MS];
        if (!raw?.activeBuff && !raw?.artifactActiveBuff && !raw?.powerTemplateId && !raw?.powerId) {
          return null;
        }
      }
      return {
        id: effect?.id ?? null,
        uuid: typeof effect?.uuid === 'string' ? effect.uuid : null,
        name: effect?.name ?? null,
        disabled: effect?.disabled === true,
        transfer: effect?.transfer === true,
        origin: typeof effect?.origin === 'string' ? effect.origin : null,
        flags: { [MS]: mastery || pickMasteryFlags(effect?.flags) || {} },
      };
    } catch (err) {
      noteError(`effect:${effect?.id || '?'}`, err);
      return {
        id: effect?.id ?? null,
        name: effect?.name ?? null,
        incomplete: true,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  function exportActorLike(actor, meta = {}) {
    const incomplete = { items: false, effects: false };
    let items = [];
    let effects = [];
    try {
      items = asList(actor?.items).map((i) => exportItem(i)).filter(Boolean);
    } catch (err) {
      incomplete.items = true;
      noteError(`actor:${actor?.id || '?'}.items`, err);
    }
    try {
      effects = asList(actor?.effects).map((e) => exportEffect(e)).filter(Boolean);
    } catch (err) {
      incomplete.effects = true;
      noteError(`actor:${actor?.id || '?'}.effects`, err);
    }

    const mastery = pickMasteryFlags(actor?.flags);
    const sys = actor?.system || {};

    return {
      id: actor?.id ?? null,
      uuid: typeof actor?.uuid === 'string' ? actor.uuid : null,
      name: actor?.name ?? null,
      type: actor?.type ?? null,
      img: undefined, // omit images / personal art paths
      source: meta.source || 'world',
      sceneId: meta.sceneId || null,
      tokenId: meta.tokenId || null,
      actorLink: meta.actorLink ?? null,
      baseActorId: meta.baseActorId || null,
      incomplete: incomplete.items || incomplete.effects,
      incompleteDetail: incomplete,
      flags: mastery ? { [MS]: mastery } : undefined,
      system: {
        // Identity / combat-relevant scalars only — no biography or notes.
        masteryRank: sys.masteryRank ?? sys.mr ?? null,
        level: sys.level ?? null,
        details: undefined,
      },
      items,
      effects,
    };
  }

  function downloadJson(filename, data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return json.length;
  }

  // ---- collect ------------------------------------------------------------

  ui.notifications?.info?.('Mastery Identity Snapshot: collecting (read-only)…');

  const meta = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    readOnly: true,
    purpose: 'combat-resolver-id-refactor-offline-audit',
    system: {
      id: game.system?.id ?? null,
      version: game.system?.version ?? null,
      title: game.system?.title ?? null,
    },
    core: {
      version: game.version ?? null,
      release: game.release?.version ?? game.data?.version ?? null,
    },
    world: {
      id: game.world?.id ?? null,
      title: game.world?.title ?? null,
      // No world description / join keys.
    },
    host: {
      isForge: !!(globalThis.ForgeVTT || globalThis.ForgeAPI || /forge-vtt\.com/i.test(String(window?.location?.hostname || ''))),
      hostname: String(window?.location?.hostname || '').replace(/:[0-9]+$/, '') || null,
    },
    exporter: {
      userId: game.user?.id ?? null,
      userName: game.user?.name ?? null,
      isGM: true,
    },
  };

  /** @type {any[]} */
  const actors = [];
  /** @type {any[]} */
  const tokenOverrides = [];
  /** @type {any[]} */
  const compendiumDocuments = [];

  // World actors
  try {
    for (const actor of asList(game.actors)) {
      try {
        actors.push(exportActorLike(actor, { source: 'world' }));
      } catch (err) {
        noteError(`actor:${actor?.id || '?'}`, err);
        actors.push({
          id: actor?.id ?? null,
          name: actor?.name ?? null,
          type: actor?.type ?? null,
          source: 'world',
          incomplete: true,
          error: err instanceof Error ? err.message : String(err),
          items: [],
          effects: [],
        });
      }
    }
  } catch (err) {
    noteError('game.actors', err);
  }

  // Unlinked scene token actor overrides (synthetic actors)
  try {
    for (const scene of asList(game.scenes)) {
      let tokens = [];
      try {
        tokens = asList(scene.tokens);
      } catch (err) {
        noteError(`scene:${scene?.id || '?'}.tokens`, err);
        continue;
      }
      for (const token of tokens) {
        try {
          const linked = token.actorLink === true;
          if (linked) continue;
          const synthetic = token.actor;
          if (!synthetic) {
            noteWarn(
              `scene:${scene.id}/token:${token.id}`,
              'Unlinked token has no synthetic actor (not loaded?)',
            );
            tokenOverrides.push({
              sceneId: scene.id,
              sceneName: scene.name,
              tokenId: token.id,
              tokenName: token.name,
              actorId: token.actorId ?? null,
              actorLink: false,
              incomplete: true,
              error: 'synthetic-actor-missing',
            });
            continue;
          }
          tokenOverrides.push(
            exportActorLike(synthetic, {
              source: 'token-override',
              sceneId: scene.id,
              tokenId: token.id,
              actorLink: false,
              baseActorId: token.actorId ?? null,
            }),
          );
        } catch (err) {
          noteError(`scene:${scene?.id}/token:${token?.id}`, err);
        }
      }
    }
  } catch (err) {
    noteError('game.scenes', err);
  }

  // Relevant packs: mastery-system packs + world packs that look identity-bearing
  try {
    for (const pack of asList(game.packs)) {
      try {
        const collection = String(pack?.collection || pack?.metadata?.id || '');
        const packageName = String(pack?.metadata?.packageName || pack?.metadata?.package || '');
        const packName = String(pack?.metadata?.name || '');
        const docType = String(pack?.documentName || pack?.metadata?.type || '');
        const isMastery =
          packageName === MS ||
          collection.startsWith(`${MS}.`) ||
          /echo.?artifact|general.?artifact|mastery/i.test(collection) ||
          /echo.?artifact|general.?artifact/i.test(packName);
        const isWorldItemPack =
          (packageName === 'world' || collection.startsWith('world.')) &&
          (docType === 'Item' || docType === 'Actor');

        if (!isMastery && !isWorldItemPack) continue;
        // Skip pure journal rulebooks for identity (no power/artifact rows).
        if (docType === 'JournalEntry' || docType === 'RollTable' || docType === 'Playlist') continue;

        let wasLocked = false;
        try {
          wasLocked = !!pack.locked;
          // Reading does not require unlock; getDocuments is read-only.
          const docs = await pack.getDocuments();
          for (const doc of docs) {
            try {
              if (docType === 'Actor' || doc.documentName === 'Actor') {
                compendiumDocuments.push({
                  pack: collection,
                  documentName: 'Actor',
                  ...exportActorLike(doc, { source: `compendium:${collection}` }),
                });
              } else if (docType === 'Item' || doc.documentName === 'Item') {
                const exported = exportItem(doc);
                if (exported) {
                  compendiumDocuments.push({
                    pack: collection,
                    documentName: 'Item',
                    ...exported,
                  });
                }
              }
            } catch (err) {
              noteError(`pack:${collection}/doc:${doc?.id}`, err);
            }
          }
        } catch (err) {
          noteError(`pack:${collection}.getDocuments`, err);
          compendiumDocuments.push({
            pack: collection,
            incomplete: true,
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          void wasLocked; // never mutate lock state
        }
      } catch (err) {
        noteError(`pack:${pack?.collection || '?'}`, err);
      }
    }
  } catch (err) {
    noteError('game.packs', err);
  }

  const snapshot = {
    ...meta,
    stats: {
      actors: actors.length,
      actorsIncomplete: actors.filter((a) => a.incomplete).length,
      tokenOverrides: tokenOverrides.length,
      tokenOverridesIncomplete: tokenOverrides.filter((a) => a.incomplete).length,
      compendiumDocuments: compendiumDocuments.length,
      compendiumIncomplete: compendiumDocuments.filter((a) => a.incomplete).length,
      errors: errors.length,
      warnings: warnings.length,
      powerItems: actors.reduce(
        (n, a) => n + (a.items || []).filter((i) => i.type === 'power').length,
        0,
      ),
      artifactItems: actors.reduce(
        (n, a) => n + (a.items || []).filter((i) => i.type === 'artifact').length,
        0,
      ),
    },
    errors,
    warnings,
    actors,
    tokenOverrides,
    compendiumDocuments,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const worldSlug = String(meta.world.id || 'world').replace(/[^\w.-]+/g, '_');
  const filename = `mastery-identity-snapshot-${worldSlug}-${stamp}.json`;

  try {
    const bytes = downloadJson(filename, snapshot);
    ui.notifications?.info?.(
      `Mastery Identity Snapshot: downloaded ${filename} (${actors.length} actors, ${errors.length} errors, ~${Math.round(bytes / 1024)} KiB JSON).`,
    );
    console.info('[identity-snapshot] complete', snapshot.stats);
  } catch (err) {
    noteError('download', err);
    ui.notifications?.error?.(
      `Mastery Identity Snapshot: download failed — ${err instanceof Error ? err.message : String(err)}. See console for full object.`,
    );
    console.info('[identity-snapshot] snapshot object (copy manually if download blocked):', snapshot);
  }
})();
