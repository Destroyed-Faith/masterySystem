import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(
  'docs/Rules/_incoming_batch9i/Active_Buffs_FULL_Auras_x1_2026-11-04.md',
  'utf8',
);
const re =
  /<h3 id="active-buff-([a-z]+)-aura">Active Buff: ([^<]+)<\/h3>[\s\S]*?\| \*\*Level\*\* \|([\s\S]*?)(?=\n\}\}|\n\\page|<h3 )/g;
const out = {};
let m;
while ((m = re.exec(src))) {
  const key = m[1];
  const name = m[2].trim();
  const table = m[3];
  const rows = [];
  for (const line of table.split('\n')) {
    const rm = line.match(
      /^\| \*\*(\d+)\*\* \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (.+) \|$/,
    );
    if (!rm) continue;
    const pl = Number(rm[1]);
    const type = rm[2].trim();
    const aoe = rm[4].trim();
    const effect = rm[6].trim();
    if (/Unavailable/i.test(type)) {
      rows.push({ pl, unavailable: true });
      continue;
    }
    const rad = (aoe.match(/Radius\s+(\d+)\s*m/i) || [])[1];
    const sp = effect.match(/\*\*([A-Za-z]+)\((\d+)\)\*\*/);
    rows.push({
      pl,
      radiusM: Number(rad),
      special: String(sp?.[1] || key).toLowerCase(),
      rank: Number(sp?.[2] || 0),
    });
  }
  out[key] = { name, rows };
}
writeFileSync('scripts/_special-aura-tables.json', JSON.stringify(out, null, 2));
console.log('count', Object.keys(out).length);
for (const [k, v] of Object.entries(out)) {
  const avail = v.rows.filter((r) => !r.unavailable);
  const first = avail[0];
  const last = avail[avail.length - 1];
  const unavail =
    v.rows
      .filter((r) => r.unavailable)
      .map((r) => r.pl)
      .join(',') || '-';
  console.log(
    k.padEnd(12),
    'unavail',
    unavail.padEnd(12),
    `PL${first.pl}:${first.special}(${first.rank})@${first.radiusM}m`,
    '→',
    `PL${last.pl}:${last.special}(${last.rank})@${last.radiusM}m`,
  );
}
for (const key of ['sundered', 'ruin']) {
  for (const pl of [4, 10, 16]) {
    const r = out[key].rows.find((x) => x.pl === pl);
    console.log(key, 'PL' + pl, JSON.stringify(r));
  }
}
