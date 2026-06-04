/**
 * Build the "Echo Artifacts" compendium pack from the pure tree generator.
 *
 * Pipeline:
 *   1. Import the compiled generator (`dist/artifacts/echo-artifact-tree-builder.js`)
 *      — run `npm run build` first so `dist/` is up to date.
 *   2. Emit one source JSON document per Folder / Item into
 *      `src/packs/echo-artifacts/` (human-readable, diff-friendly, the format
 *      consumed by @foundryvtt/foundryvtt-cli `compilePack`).
 *   3. If `@foundryvtt/foundryvtt-cli` is installed, compile the source docs
 *      into a LevelDB pack at `packs/echo-artifacts` (what Foundry ships/loads).
 *      If the CLI is not present the source JSON is still written and the step
 *      is skipped with a hint — the runtime world-seeder already materialises
 *      the same content, so the pack is a distribution convenience.
 *
 * Document ids are deterministic (derived from the stable nodeId), so repeated
 * builds produce identical packs with no churn.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'packs', 'echo-artifacts');
const PACK_DIR = path.join(ROOT, 'packs', 'echo-artifacts');
const PACK_LABEL = 'Echo Artifacts';
const PARENT_FOLDER_NAME = 'Echo Artifacts';

/** Deterministic 16-char alphanumeric Foundry id from any seed string. */
function stableId(seed) {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // FNV-1a → expand to 16 chars by re-hashing with a salt counter.
  let out = '';
  let counter = 0;
  while (out.length < 16) {
    let h = 0x811c9dc5;
    const s = `${seed}#${counter++}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    while (h > 0 && out.length < 16) {
      out += ALPHA[h % ALPHA.length];
      h = Math.floor(h / ALPHA.length);
    }
  }
  return out.slice(0, 16);
}

function folderDoc(id, name, parentId) {
  return {
    _id: id,
    name,
    type: 'Item',
    sorting: 'a',
    color: parentId ? '#8a5a2b' : '#b8860b',
    flags: {},
    folder: parentId ?? null,
    _key: `!folders!${id}`,
  };
}

function itemDoc(id, data, folderId) {
  const doc = { ...data, _id: id, folder: folderId ?? null };
  doc._key = `!items!${id}`;
  return doc;
}

async function main() {
  const generatorUrl = new URL('../dist/artifacts/echo-artifact-tree-builder.js', import.meta.url);
  if (!existsSync(fileURLToPath(generatorUrl))) {
    console.error('[echo-pack] dist generator not found — run `npm run build` first.');
    process.exit(1);
  }
  const { buildAllEchoArtifactTrees } = await import(generatorUrl);
  const trees = buildAllEchoArtifactTrees();

  await rm(SRC_DIR, { recursive: true, force: true });
  await mkdir(SRC_DIR, { recursive: true });

  const docs = [];
  const parentId = stableId('folder:echo-artifacts-root');
  docs.push(folderDoc(parentId, PARENT_FOLDER_NAME, null));

  for (const tree of trees) {
    const subId = stableId(`folder:${tree.echoArtifactKey}`);
    docs.push(folderDoc(subId, tree.folderName, parentId));
    for (const node of tree.nodes) {
      const id = stableId(`item:${node.nodeId}`);
      docs.push(itemDoc(id, node.itemData, subId));
    }
  }

  let written = 0;
  for (const doc of docs) {
    const kind = doc._key.startsWith('!folders!') ? 'folder' : 'item';
    const safeName = String(doc.name).replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const file = path.join(SRC_DIR, `${kind}_${safeName}_${doc._id}.json`);
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    written += 1;
  }
  console.log(`[echo-pack] wrote ${written} source documents → ${path.relative(ROOT, SRC_DIR)}`);

  // Optional: compile to a LevelDB pack via @foundryvtt/foundryvtt-cli.
  let compilePack;
  try {
    ({ compilePack } = await import('@foundryvtt/foundryvtt-cli'));
  } catch {
    console.log('[echo-pack] @foundryvtt/foundryvtt-cli not installed — skipping LevelDB compile.');
    console.log('[echo-pack]   install with: npm i -D @foundryvtt/foundryvtt-cli');
    return;
  }
  await rm(PACK_DIR, { recursive: true, force: true });
  await mkdir(PACK_DIR, { recursive: true });
  await compilePack(SRC_DIR, PACK_DIR, { log: true });
  console.log(`[echo-pack] compiled LevelDB pack → ${path.relative(ROOT, PACK_DIR)} (${PACK_LABEL})`);
}

main().catch((err) => {
  console.error('[echo-pack] build failed:', err);
  process.exit(1);
});
