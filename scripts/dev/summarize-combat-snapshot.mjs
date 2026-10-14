import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node summarize-combat-snapshot.mjs <file.json>');
  process.exit(1);
}
const s = JSON.parse(readFileSync(path, 'utf8'));
console.log('kind', s.exportKind, 'v' + s.schemaVersion);
console.log('scene', s.scene?.id, s.scene?.name);
console.log('combat round', s.combat?.round, 'turn', s.combat?.turn, 'n=', s.combat?.combatants?.length);
for (const c of s.combat?.combatants || []) {
  const h = c.actor?.system?.health;
  const bars = Array.isArray(h?.bars) ? h.bars : [];
  const hp = bars.map((b, i) => `B${i}:${b.current ?? '?'}/${b.max ?? '?'}`).join(', ');
  const pools = c.actor?.system?.stonePools || {};
  const stone = Object.entries(pools)
    .filter(([, v]) => v && (Number(v.current) || Number(v.max)))
    .map(([k, v]) => `${k}:${v.current ?? 0}/${v.max ?? 0}`)
    .join(' ');
  const ledger = c.actor?.flags?.stoneCombatReady;
  const ledgerStr = ledger
    ? Object.entries(ledger.pools || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(' ')
    : '(kein ledger)';
  const statuses =
    (c.actor?.statusEffects || [])
      .map((e) => `${e.name || e.id || '?'}${e.value != null ? `(${e.value})` : ''}`)
      .join(', ') || '(keine)';
  const plan = c.actor?.flags?.stonePowersRoundPlan;
  console.log('---');
  console.log(`${c.name} | ini ${c.initiative} | link=${c.actorLink} | defeated=${c.defeated}`);
  console.log(`  HP: ${hp || '(keine)'} temp=${h?.tempHP ?? 0}`);
  console.log(`  Specials: ${statuses}`);
  console.log(`  Stones: ${stone || '(leer)'}`);
  console.log(`  Ledger: ${ledgerStr}`);
  console.log(`  Plan round=${plan?.round ?? '-'} receipt=${(plan?.receipt || []).length}`);
}
