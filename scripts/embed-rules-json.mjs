/**
 * Embed DF 2026 catalog JSON into TypeScript modules.
 * Foundry loads unbundled ESM; bare `.json` imports break after fix-imports
 * rewrites them to `.json.js`, and Node/browsers need import attributes.
 * Shipping data as `.ts` → `.js` avoids that entirely.
 *
 * Usage: node scripts/embed-rules-json.mjs
 * (also invoked from npm run build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', 'rules', 'data');

const catalogs = [
  { json: 'echo-imprints.json', ts: 'echo-imprints-data.ts' },
  { json: 'core-rituals.json', ts: 'core-rituals-data.ts' },
];

for (const { json, ts } of catalogs) {
  const jsonPath = path.join(dataDir, json);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  JSON.parse(raw); // validate
  const out =
    `/** Auto-generated from ${json} — do not edit by hand; re-run: node scripts/embed-rules-json.mjs */\n` +
    `export default ${raw};\n`;
  fs.writeFileSync(path.join(dataDir, ts), out);
  console.log(`Embedded ${json} → ${ts}`);
}
