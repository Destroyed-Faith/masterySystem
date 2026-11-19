/**
 * Mastery System – Legacy cleanup 2026 verification (GM, COPY OF THE WORLD ONLY)
 * ---------------------------------------------------------------------------
 * Macro type MUST be "script". Run only in a duplicated test world, after the
 * Actives v0.9.9.6 migration has been applied there.
 *
 * Uses the system's real runtime modules and real Actor / Item documents:
 *   - runtime: no Skill catalog module, no Echo Card decks, removed templates
 *     absent from the catalog, Heal + Cleanse target present
 *   - write guard: a legacy `system.skills` / Echo Card create is quarantined
 *   - dry run on temporary actors: read-only, D6 refund from XP history
 *   - apply (temporary actors only): Skills archived, Free XP refunded, NPC Skills
 *     and Echo Card picks archived, Heal + Cleanse → Cleanse at the same PL
 *   - idempotency: a second report has nothing left for the temporary actors
 *   - rollback: actor and item return to the backup values
 * Apply also runs the regular Power template resync once. The world migration
 * state is restored afterwards. Writes a Journal Entry with
 * the results. Temporary actors are deleted afterwards unless KEEP is true.
 *
 * Manual checklist (same world copy, after this macro passes):
 *   1. Reload as GM: the legacy-cleanup banner and review dialog appear (only
 *      after v0.9.9.6 is applied). Export the Markdown report and check the
 *      Skill refunds, conflicts, NPC / Summon / Echo Card archives, Powers and
 *      Artifact picks.
 *   2. Download the backup, Apply, reload: no banner; characters show no Skill
 *      UI; Free XP matches the report; conflicts are flagged and unchanged.
 *   3. Resolve one Skill conflict:
 *      game.masterySystem.legacyCleanupResolveSkills(actor, { xpRefund: 0, note: '...' }).
 *   4. Rollback one actor (game.masterySystem.legacyCleanupRollback(actor)) and
 *      confirm Skills, Free XP, Echo Card picks and Powers return to the backup.
 *   5. Moonlight Greatsword L1: Ranged Single Target Restoration PL4 (20 m, 2 Scarred Bars);
 *      no Heal Active / Healing support in the radial.
 *   6. Lor-Keth's Titanstorm Staff L1: Melee Single Target Special: Expose PL4 (Expose(5)).
 *   7. Import an old homepage export with Skills / Echo Cards: the actor has no
 *      Skill or card fields, the values sit in the legacySkillsArchive flag.
 * Forge only after separate approval.
 */
/* ===== execute (Script macro body) ===== */
(async () => {
  const KEEP = false;
  if (!game?.user?.isGM) {
    ui.notifications?.error?.('Legacy cleanup verification: GM only.');
    return;
  }
  const confirmed = await Dialog.confirm({
    title: 'Legacy cleanup 2026 verification',
    content:
      '<p>This creates and deletes temporary actors and briefly applies the legacy cleanup to them.</p>' +
      '<p><strong>Only run this in a copy of the world.</strong> Continue?</p>',
    defaultYes: false,
  });
  if (!confirmed) return;

  const scope = game.system.id;
  const base = `/systems/${scope}/dist`;
  const load = (p) => import(`${base}/${p}`);
  const [catalog, builder, echos, migration, mapping] = await Promise.all([
    load('utils/power-catalog.js'),
    load('utils/power-item-builder.js'),
    load('utils/echos/index.js'),
    load('migrations/legacy-cleanup-2026-migration.js'),
    load('migrations/legacy-cleanup-2026-mapping.js'),
  ]);

  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: String(detail) });
  const cleanup = [];
  const stateKey = mapping.LEGACY_CLEANUP_STATE_KEY;
  const prevState = game.settings.get(scope, stateKey);
  const OPT = { masteryLegacySkillMigration: true };

  try {
    /* ---- Runtime ---- */
    let skillModule = true;
    try {
      await load('utils/skills.js');
    } catch {
      skillModule = false;
    }
    check('Runtime: no Skill catalog module', !skillModule);
    check('Runtime: no Echo Card decks', echos.getAllEchos().every((e) => e.deck === undefined));
    const removed = [...mapping.LEGACY_CLEANUP_CONFLICT_TEMPLATES, ...Object.keys(mapping.LEGACY_CLEANUP_TEMPLATE_REMAP)];
    check('Catalog: removed templates absent', removed.every((id) => !catalog.findTemplateById(id)), `${removed.length} id(s)`);
    check('Catalog: Cleanse target present', !!catalog.findCatalogEntry('active-melee-single-cleanse'));
    check('Catalog: Zone T5 Root absent', !catalog.findCatalogEntry('active-ranged-zone-t5', 'root'));

    const v0996 = game.settings.get(scope, 'activesV0996MigrationState');
    check('Precondition: Actives v0.9.9.6 applied', v0996 === 'applied', `state ${v0996}`);

    /* ---- Write guard ---- */
    const guarded = await Actor.create({
      name: 'LC Guard',
      type: 'character',
      system: { skills: { athletics: 3 }, echo: { key: 'humans', selectedCardIds: ['x'] } },
    });
    cleanup.push(guarded);
    const quarantine = guarded.getFlag(scope, 'legacySkillWriteQuarantine');
    check('Guard: create drops system.skills', guarded.system.skills === undefined);
    check('Guard: create drops Echo Card picks', guarded.system.echo?.selectedCardIds === undefined);
    check('Guard: dropped values quarantined', !!quarantine?.entries?.length, JSON.stringify(quarantine?.entries?.[0]?.values ?? {}));

    /* ---- Seed temporary pre-cleanup actors ---- */
    const hero = await Actor.create({ name: 'LC Hero', type: 'character' });
    const npc = await Actor.create({ name: 'LC Bandit', type: 'npc' });
    cleanup.push(hero, npc);
    const spend = (from, to, amount) => ({ ts: 1, kind: 'spend', category: 'skill', amount, details: { key: 'athletics', from, to } });
    await hero.update(
      {
        'system.creation.complete': true,
        'system.points.xpFree': 5,
        'system.xp.totalEarned': 40,
        'system.xp.totalSpent': 30,
        'system.xp.freeEarned': 5,
        'system.xp.freeSpent': 0,
        'system.xp.history': [spend(4, 5, 3), spend(5, 6, 3)],
        'system.xp.postCreationProgress': { skills: { athletics: 4 } },
        'system.skills': { athletics: 6 },
        'system.echo.key': 'humans',
        'system.echo.selectedCardIds': ['human-start-1'],
        'system.echo.cardUses': {},
      },
      OPT,
    );
    await npc.update({ 'system.skills': { stealth: 4 } }, OPT);
    const cleanseEntry = catalog.findCatalogEntry('active-melee-single-cleanse');
    const mixedData = builder.buildPowerItemFromCatalogEntry(cleanseEntry, 5);
    mixedData.name = 'Melee Cleanse (Mixed)';
    mixedData.system.templateId = 'active-melee-heal-cleanse-mixed';
    const [mixed] = await hero.createEmbeddedDocuments('Item', [mixedData], OPT);
    const xpFreeBefore = Number(hero.system.points?.xpFree) || 0;

    /* ---- Dry run ---- */
    const uuids = new Set([hero.uuid, npc.uuid]);
    const only = (r) => ({
      ...r,
      actors: r.actors.filter((a) => uuids.has(a.actorUuid)),
      items: r.items.filter((c) => uuids.has(c.ownerUuid)),
      artifacts: r.artifacts.filter((c) => uuids.has(c.ownerUuid)),
    });
    const report = only(migration.buildLegacyCleanupReport());
    const heroPlan = report.actors.find((a) => a.actorUuid === hero.uuid);
    check('Dry run: hero Skills planned from XP history', heroPlan?.skills?.xpSource === 'history' && heroPlan?.skills?.xpRefund === 6, `${heroPlan?.skills?.status} ${heroPlan?.skills?.xpSource} +${heroPlan?.skills?.xpRefund}`);
    check('Dry run: hero Echo Card pick listed', heroPlan?.echoCardIds === 1);
    check('Dry run: NPC Skills listed', report.actors.some((a) => a.actorUuid === npc.uuid && a.npcSkillKeys === 1));
    const mixedChange = report.items.find((c) => c.itemId === mixed.id);
    check('Dry run: Heal + Cleanse remapped to Cleanse', mixedChange?.kind === 'remap' && mixedChange?.to?.templateId === 'active-melee-single-cleanse', mixedChange?.kind);
    check('Dry run is read-only', hero.system.skills?.athletics === 6 && mixed.system.templateId === 'active-melee-heal-cleanse-mixed');

    /* ---- Apply (temporary actors only) ---- */
    if (v0996 === 'applied') {
      const summary = await migration.applyLegacyCleanupReport(report);
      check('Apply: no failures', summary.failed === 0, JSON.stringify(summary));
      const archive = hero.getFlag(scope, 'legacySkillsArchive');
      check('Apply: hero Skills removed and archived', hero.system.skills === undefined && archive?.skills?.athletics === 6);
      check('Apply: Free XP +6', (Number(hero.system.points?.xpFree) || 0) === xpFreeBefore + 6, `${xpFreeBefore} → ${hero.system.points?.xpFree}`);
      check('Apply: Echo Card pick archived', hero.system.echo?.selectedCardIds === undefined && archive?.echoCards?.selectedCardIds?.[0] === 'human-start-1');
      check('Apply: NPC Skills archived', npc.system.skills === undefined && npc.getFlag(scope, 'legacySkillsArchive')?.skills?.stealth === 4);
      const after = hero.items.get(mixed.id);
      check('Apply: Cleanse at PL5', after?.system.templateId === 'active-melee-single-cleanse' && !!after?.system.levels?.['5'], after?.system.templateId);

      const again = only(migration.buildLegacyCleanupReport());
      check('Idempotent: nothing left for the temporary actors', !again.actors.length && !again.items.length && !again.artifacts.length);

      /* ---- Rollback ---- */
      await migration.rollbackActorLegacyCleanup(hero);
      const back = hero.items.get(mixed.id);
      check('Rollback: Skills restored', hero.system.skills?.athletics === 6);
      check('Rollback: Free XP restored', (Number(hero.system.points?.xpFree) || 0) === xpFreeBefore, hero.system.points?.xpFree);
      check('Rollback: Echo Card pick restored', hero.system.echo?.selectedCardIds?.[0] === 'human-start-1');
      check('Rollback: Power restored', back?.system.templateId === 'active-melee-heal-cleanse-mixed', back?.system.templateId);
    }
  } catch (err) {
    console.error('Legacy cleanup verification failed', err);
    check('Macro ran without exceptions', false, err?.message ?? err);
  } finally {
    try {
      await game.settings.set(scope, stateKey, prevState);
    } catch {
      /* setting unavailable */
    }
    if (!KEEP) {
      for (const doc of cleanup.reverse()) {
        try {
          await doc.delete();
        } catch {
          /* already gone */
        }
      }
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const rows = results
    .map((r) => `<tr><td>${r.ok ? '✔' : '✘'}</td><td>${r.name}</td><td>${r.detail}</td></tr>`)
    .join('');
  const content =
    `<p>${passed} / ${results.length} checks passed (${new Date().toISOString()}, system ${game.system.version}). ` +
    `Migration state restored to "${prevState}".</p>` +
    `<table><thead><tr><th></th><th>Check</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`;
  await JournalEntry.create({
    name: `Legacy Cleanup Verification ${new Date().toLocaleString()}`,
    pages: [{ name: 'Results', type: 'text', text: { content } }],
  });
  ui.notifications?.[passed === results.length ? 'info' : 'warn']?.(
    `Legacy cleanup verification: ${passed} / ${results.length} passed — see the Journal entry.`,
  );
})();
