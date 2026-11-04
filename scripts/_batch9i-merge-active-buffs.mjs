import { readFileSync, writeFileSync } from 'node:fs';

const canonPath = 'docs/Rules/Canonical/Active_Buffs.md';
const incomingPath =
  'docs/Rules/_incoming_batch9i/Active_Buffs_FULL_Auras_x1_2026-11-04.md';

const canon = readFileSync(canonPath, 'utf8');
const incoming = readFileSync(incomingPath, 'utf8');

const marker = '## Special Auras (Active Buffs)';
const canonIdx = canon.indexOf(marker);
const inIdx = incoming.indexOf(marker);
if (canonIdx < 0 || inIdx < 0) {
  throw new Error('Special Auras marker missing');
}

// Keep canonical prefix; replace Special Auras through EOF with incoming section.
let out = `${canon.slice(0, canonIdx)}${incoming.slice(inIdx)}`;

// Refresh credits block aura note without wiping other Batch notes if present.
out = out.replace(
  /\{\{homebreweryCredits\nDestroyed Faith — DF Core Active Buffs\n[\s\S]*?\n\}\}/,
  `{{homebreweryCredits
Destroyed Faith — DF Core Active Buffs
Version: v0.9.9.5 (2026-11-04)  
Playtest aura expansion: 2026-11-04 (14 Special Auras; approved ×1.0 PP formula, 3 m cap, Ruin 2 m fixed; six obsolete damage/armor Auras remain retired; artifact-only exceptions remain separate).
}`,
);

writeFileSync(canonPath, out);
console.log('Active_Buffs.md Special Auras section replaced from incoming x1 tables');
console.log('new length', out.length);
