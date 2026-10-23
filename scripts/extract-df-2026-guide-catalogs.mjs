#!/usr/bin/env node
/**
 * Extract Echo Imprints (28) and Core Rituals (16) from the authoritative
 * Players Guide Markdown into structured JSON under src/rules/data/.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const guidePath = join(
  root,
  'docs/cursor-migration/Destroyed_Faith_Players_Guide_Editorial_Condensed_2026-10-23.md',
);
const outDir = join(root, 'src/rules/data');
mkdirSync(outDir, { recursive: true });

const text = readFileSync(guidePath, 'utf8');

function slugify(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[^\w\s'-]/g, '')
    .replace(/'/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/** Canonical attribute ownership from the Player's Guide / master migration prompt. */
const IMPRINT_ATTR = {
  'anchor-touch': 'might',
  'burdens-mercy': 'might',
  stoneprint: 'might',
  'hollow-echo': 'might',
  'feather-step': 'agility',
  catfall: 'agility',
  'dancing-thread': 'agility',
  'needle-balance': 'agility',
  'living-warmth': 'vitality',
  'seed-whisper': 'vitality',
  'pulse-touch': 'vitality',
  preserve: 'vitality',
  'mage-hand': 'intellect',
  message: 'intellect',
  'arcane-spark': 'intellect',
  'fleeting-conjuration': 'intellect',
  'still-mind': 'resolve',
  'sense-taint': 'resolve',
  'echo-whisper': 'resolve',
  'oath-ember': 'resolve',
  glamour: 'influence',
  'mirror-shade': 'influence',
  'borrowed-voice': 'influence',
  'emotional-hue': 'influence',
  'ghost-sound': 'wits',
  waymark: 'wits',
  'second-glance': 'wits',
  'lucky-flicker': 'wits',
};

function extractImprints(src) {
  const start = src.indexOf('# Echo Imprints Catalogue');
  const end = src.indexOf('\n## Rituals\n', start);
  if (start < 0 || end < 0) throw new Error('Imprint catalogue section not found');
  const section = src.slice(start, end);
  const imprints = [];
  const parts = section.split(/\n(?=### )/);
  for (const raw of parts) {
    if (!raw.startsWith('### ')) continue;
    const name = raw.slice(4).split('\n')[0].trim();
    if (!name || /\(continued\)/i.test(name)) continue;
    const id = slugify(name);
    const attribute = IMPRINT_ATTR[id];
    if (!attribute) continue;
    const taglineMatch = raw.match(/\n\*([^*\n][^*]*)\*/);
    const tagline = taglineMatch ? taglineMatch[1].trim() : '';
    const tiers = {};
    for (const m of raw.matchAll(/\|\s*\*\*(\d+)\*\*\s*\|\s*([^|\n]+)\|/g)) {
      const tier = Number(m[1]);
      if (![4, 8, 12, 16, 20].includes(tier)) continue;
      tiers[tier] = m[2].trim();
    }
    if (Object.keys(tiers).length < 5) {
      console.warn(`incomplete tiers for ${id}`, Object.keys(tiers));
      continue;
    }
    const memoryMatch = raw.match(/\*\*GM - Echo Memory:\*\*\s*\*([^*]+)\*/);
    imprints.push({
      id,
      attribute,
      name,
      tagline,
      tiers: {
        4: tiers[4],
        8: tiers[8],
        12: tiers[12],
        16: tiers[16],
        20: tiers[20],
      },
      echoMemory: memoryMatch ? memoryMatch[1].trim() : '',
    });
  }
  // Stable attribute order
  const order = Object.keys(IMPRINT_ATTR);
  imprints.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return imprints;
}

function extractRituals(src) {
  const start = src.indexOf('### Read Resonance (Ritual)');
  const end = src.indexOf('\n## Summons\n', start);
  if (start < 0 || end < 0) throw new Error('Ritual catalogue section not found');
  const section = src.slice(start, end);
  const rituals = [];
  const parts = section.split(/\n(?=### )/).filter((p) => /\(Ritual\)/.test(p.split('\n')[0] || ''));
  for (const raw of parts) {
    const titleLine = raw.split('\n')[0].replace(/^###\s*/, '').replace(/\(Ritual\)/i, '').trim();
    const name = titleLine;
    const taglineMatch = raw.match(/\n\*([^*\n][^*]*)\*/);
    const timeMatch = raw.match(/\*\*Time:\*\*\s*([^\n]+)/);
    const baseTnMatch = raw.match(/\*\*Base TN:\*\*\s*([^\n]+)/);
    const durationMatch = raw.match(/\*\*Effect Duration:\*\*\s*([^\n]+)/);
    const reqMatch = raw.match(/\*\*Requirement:\*\*\s*([^\n]+)/);
    const approachesMatch = raw.match(/\*\*Example Approaches:\*\*\s*([^\n]+)/);
    const tiers = {};
    for (const m of raw.matchAll(/\|\s*\*\*Raise\s+(\d+)\*\*\s*\|\s*([^|\n]+)\|/g)) {
      tiers[Number(m[1])] = m[2].trim();
    }
    const limitsMatch = raw.match(/#### Scope & Limits\s*\n([\s\S]*?)(?=\n>|\n####|\n}}\s*\n\\page|$)/);
    const dangerMatch = raw.match(/>\s*\*\*Danger:\*\*\s*([^\n]+)/);
    rituals.push({
      id: slugify(name.replace(/—/g, ' ')),
      name,
      tagline: taglineMatch ? taglineMatch[1].trim() : '',
      time: timeMatch ? timeMatch[1].trim() : '1 Tyhran Hour',
      baseTnNote: baseTnMatch ? baseTnMatch[1].trim() : '12 minimum',
      effectDuration: durationMatch ? durationMatch[1].trim() : '',
      requirement: reqMatch ? reqMatch[1].trim() : '',
      exampleApproaches: approachesMatch ? approachesMatch[1].trim() : '',
      tiers: {
        0: tiers[0] || '',
        1: tiers[1] || '',
        2: tiers[2] || '',
        3: tiers[3] || '',
        4: tiers[4] || '',
      },
      limits: limitsMatch ? limitsMatch[1].replace(/\n+/g, ' ').trim() : '',
      danger: dangerMatch ? dangerMatch[1].trim() : '',
    });
  }
  return rituals;
}

const imprints = extractImprints(text);
const rituals = extractRituals(text);

writeFileSync(join(outDir, 'echo-imprints.json'), `${JSON.stringify(imprints, null, 2)}\n`);
writeFileSync(join(outDir, 'core-rituals.json'), `${JSON.stringify(rituals, null, 2)}\n`);

console.log(`imprints: ${imprints.length}`);
for (const attr of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits']) {
  const ids = imprints.filter((i) => i.attribute === attr).map((i) => i.id);
  console.log(`  ${attr} (${ids.length}): ${ids.join(', ')}`);
}
console.log(`rituals: ${rituals.length}`);
console.log(rituals.map((r) => r.id).join(', '));

if (imprints.length !== 28) {
  console.error(`Expected 28 imprints, got ${imprints.length}`);
  process.exitCode = 1;
}
if (rituals.length !== 16) {
  console.error(`Expected 16 rituals, got ${rituals.length}`);
  process.exitCode = 1;
}
