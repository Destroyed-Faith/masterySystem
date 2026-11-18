/**
 * Mastery System – Actives v0.9.9.6 verification (GM, COPY OF THE WORLD ONLY)
 * ---------------------------------------------------------------------------
 * Macro type MUST be "script". Run only in a duplicated test world.
 *
 * Uses the system's real runtime modules (same instances Foundry loaded) and
 * real Actor / Item / Combat documents:
 *   - picker: 56 Special/Delivery entries, canonical names, no legacy families
 *   - item creation: Melee Ruin PL4 = Ruin(7), Ranged Sundered PL16 = Sundered(11),
 *     Melee Sundered PL4 = Sundered(5), Melee Blight PL4 = Blight(8)
 *   - Ruin immediate damage: Ruin(7) on an armored target → 28 HP lost, stack 7
 *   - repeatable Attack Power: two uses with two Attack Actions; Limited stays limited
 *   - no Basic Attack in the radial; Grapple keeps with an unarmed Melee Attack Power
 *   - migration dry-run report (read-only)
 * Writes a Journal Entry with the results. Temporary actors / combat are deleted
 * afterwards unless KEEP is true.
 *
 * Manual checklist (same world copy, after this macro passes):
 *   1. Reload as GM: the v0.9.9.6 banner and review dialog appear; Export the
 *      report and check remaps, conflicts, Mental Attack, Lor-Keth, Zone Root,
 *      Moonlight Mending and actors without an Attack Power.
 *   2. Download the backup, Apply, reload: no banner; remapped items keep PL,
 *      Special, custom names and favourites; conflicts / Mental Attack flagged
 *      and shown on the sheet; Mental Attack missing from the radial.
 *   3. Rollback one actor (game.masterySystem.activesV0996Rollback(actor)) and
 *      confirm its items return to the backup values.
 *   4. Character sheet: Add Power picker shows "Single Target Special: X" /
 *      "AoE Special: X" with bound preview values; Guided Builder rejects a
 *      build without an Attack Power.
 *   5. Real attack: Melee Single Target Special: Ruin PL4 against an armored
 *      NPC through the radial → attack card → hit → Ruin(7) and 28 HP lost,
 *      chat line "Ruin immediate damage".
 *   6. Extra-Attack Stone: same Attack Power twice in one Round.
 *   7. Limited Power: second use blocked by the global Limited charge.
 *   8. Grapple: win the contest, attack with an unarmed Melee Attack Power
 *      (no release prompt), then with a drawn weapon (release prompt).
 *   9. Ranged Persistent Special Zone: Ruin over two Rounds — immediate damage
 *      on each new application, Tick unchanged.
 *  10. Moonlight Greatsword L1: Moonlight Mending heals HP.
 * Forge only after separate approval.
 */
/* ===== execute (Script macro body) ===== */
(async () => {
  const KEEP = false;
  if (!game?.user?.isGM) {
    ui.notifications?.error?.('v0.9.9.6 verification: GM only.');
    return;
  }
  const confirmed = await Dialog.confirm({
    title: 'Actives v0.9.9.6 verification',
    content:
      '<p>This creates and deletes temporary actors and a combat.</p>' +
      '<p><strong>Only run this in a copy of the world.</strong> Continue?</p>',
    defaultYes: false,
  });
  if (!confirmed) return;

  const base = `/systems/${game.system.id}/dist`;
  const load = (p) => import(`${base}/${p}`);
  const [catalog, builder, effects, economy, grapple, radial, migration, specials] = await Promise.all([
    load('utils/power-catalog.js'),
    load('utils/power-item-builder.js'),
    load('combat/apply-special-effects.js'),
    load('combat/action-economy.js'),
    load('combat/grapple-state.js'),
    load('radial-menu/options.js'),
    load('migrations/actives-v0996-migration.js'),
    load('system/active-specials.js'),
  ]);

  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: String(detail) });
  const cleanup = [];

  try {
    /* ---- Picker ---- */
    const visible = catalog.filterCatalog({});
    const st = visible.filter((e) => /-(instant-special|aoe-damage)-t[3-6]$/.test(e.templateId) && e.chosenSpecial);
    const combos = new Set(st.map((e) => `${e.templateId.replace(/-t[3-6]$/, '')}::${e.chosenSpecial.key}`));
    check('Picker: 56 unique Special/Delivery entries', combos.size === 56 && st.length === 56, `${st.length} entries / ${combos.size} unique`);
    check('Picker: no legacy Damage + Special', !visible.some((e) => /-damage-t[3-6]$/.test(e.templateId) && !/aoe-damage/.test(e.templateId)));
    check('Picker: no Mental Attack', !visible.some((e) => e.templateId === 'active-mental-attack'));
    const ruinEntry = catalog.findCatalogEntry('active-melee-instant-special-t4', 'ruin')
      ?? catalog.findCatalogEntry('active-melee-instant-special-t3', 'ruin')
      ?? catalog.findCatalogEntry('active-melee-instant-special-t5', 'ruin')
      ?? catalog.findCatalogEntry('active-melee-instant-special-t6', 'ruin');
    check('Picker: Ruin name', ruinEntry?.name === 'Melee Single Target Special: Ruin', ruinEntry?.name);

    /* ---- Real documents ---- */
    const attacker = await Actor.create({ name: 'v0996 Attacker', type: 'character' });
    const target = await Actor.create({ name: 'v0996 Target', type: 'npc' });
    cleanup.push(attacker, target);

    const findEntry = (delivery, special) => {
      for (const t of [3, 4, 5, 6]) {
        const e = catalog.findCatalogEntry(`active-${delivery}-instant-special-t${t}`, special);
        if (e?.chosenSpecial?.key === special) return e;
      }
      return null;
    };
    const cases = [
      ['melee', 'ruin', 4, 7],
      ['ranged', 'sundered', 16, 11],
      ['melee', 'sundered', 4, 5],
      ['melee', 'blight', 4, 8],
    ];
    const created = [];
    for (const [delivery, special, pl, expected] of cases) {
      const entry = findEntry(delivery, special);
      const data = entry ? builder.buildPowerItemFromCatalogEntry(entry, pl) : null;
      if (!data) {
        check(`Item: ${delivery} ${special} PL${pl}`, false, 'catalog entry missing');
        continue;
      }
      const [doc] = await attacker.createEmbeddedDocuments('Item', [data]);
      created.push(doc);
      const sp = (doc.system.levels?.[String(pl)]?.specials ?? []).find((s) => s.key === special);
      check(`Item: ${doc.name} PL${pl} = ${special}(${expected})`, sp?.rank === expected, `baked ${special}(${sp?.rank})`);
    }

    /* ---- Ruin immediate damage ---- */
    await target.update({ 'system.combat.armorTotal': 10 });
    const hp = (a) => (a.system.health?.bars ?? []).reduce((s, b) => s + (Number(b.current) || 0), 0);
    const before = hp(target);
    await effects.applySpecialStringsToTarget(target, ['Ruin(7)'], attacker);
    const after = hp(target);
    const ruin = specials.readActorStatusEffects(target).find((e) => specials.statusEntryId(e) === 'ruin');
    check('Ruin(7) → 28 HP lost ignoring Armor', before - after === 28, `HP ${before} → ${after}`);
    check('Ruin stack stored as 7', Number(ruin?.value) === 7, `stack ${ruin?.value}`);

    /* ---- Repeatable Attack Powers ---- */
    const combat = await Combat.create({ scene: canvas.scene?.id ?? null, active: true });
    cleanup.push(combat);
    const ruinItem = created[0];
    if (ruinItem) {
      const avail = economy.getAvailableAttackActions(attacker, combat);
      check('Attack Power is repeatable', economy.isRepeatableAttackPower(attacker, ruinItem.id));
      let uses = 0;
      for (let i = 0; i < Math.max(2, avail); i++) {
        if (!(await economy.spendAttackAction(attacker, combat))) break;
        await economy.markPowerUsedThisRound(attacker, combat, ruinItem.id);
        uses += 1;
      }
      check('Same Attack Power used once per available Attack Action', uses === avail && !economy.hasPowerBeenUsedThisRound(attacker, combat, ruinItem.id), `${uses} use(s) with ${avail} Attack Action(s)`);
    }
    const limitedEntry = catalog.findCatalogEntry('active-melee-limited-single', null);
    if (limitedEntry) {
      const [lim] = await attacker.createEmbeddedDocuments('Item', [builder.buildPowerItemFromCatalogEntry(limitedEntry, 4)]);
      check('Limited stays non-repeatable', !economy.isRepeatableAttackPower(attacker, lim.id));
    }

    /* ---- Basic Attack / Grapple ---- */
    const opts = await radial.getAllCombatOptionsForActor(attacker);
    check('Radial: no Basic Attack', !opts.some((o) => o.id === 'weapon-attack'));
    check('Radial: Grapple available', opts.some((o) => o.id === 'grapple'));
    await attacker.setFlag(game.system.id, 'grapple', { role: 'grappler', partnerActorId: target.id, partnerName: target.name });
    if (ruinItem) {
      const opt = { id: ruinItem.id, slot: 'attack', source: 'power', item: ruinItem };
      check('Grapple kept for an unarmed Melee Attack Power', !grapple.attackRequiresGrappleRelease(attacker, opt, { unarmedNow: true }));
      check('Grapple must be released for an armed attack', grapple.attackRequiresGrappleRelease(attacker, opt, { unarmedNow: false }));
    }

    /* ---- Migration dry-run (read-only) ---- */
    const report = migration.buildActivesV0996Report();
    check('Migration dry-run built', !!report, `${report.items.length} item change(s), ${report.artifactPicks.length} Artifact pick(s), state ${report.state}`);
  } catch (err) {
    console.error('v0.9.9.6 verification failed', err);
    check('Macro ran without exceptions', false, err?.message ?? err);
  } finally {
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
    `<p>${passed} / ${results.length} checks passed (${new Date().toISOString()}, system ${game.system.version}).</p>` +
    `<table><thead><tr><th></th><th>Check</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`;
  await JournalEntry.create({
    name: `Actives v0.9.9.6 Verification ${new Date().toLocaleString()}`,
    pages: [{ name: 'Results', type: 'text', text: { content } }],
  });
  ui.notifications?.[passed === results.length ? 'info' : 'warn']?.(
    `Actives v0.9.9.6 verification: ${passed} / ${results.length} passed — see the Journal entry.`,
  );
})();
