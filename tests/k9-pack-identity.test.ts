/**
 * K9 — Canonical Echo Artifact compendium: identity persistence regression.
 *
 * Guards the shipped pack sources (`src/packs/echo-artifacts/*.json`) against
 * drifting from the canonical builder and against losing structured identity
 * (P1). World/actor data is never touched here.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildAllEchoArtifactTrees,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../src/artifacts/echo-artifact-tree-builder.js';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';
import { ARTIFACT_FUNCTION_CONTRACT, isArtifactFunctionId } from '../src/utils/artifact-functions.js';
import { resolvePowerIdentity } from '../src/utils/power-identity.js';
import { enrichArtifactRowIdentity } from '../src/utils/artifact-row-identity.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import {
  buildArtifactRadialOptions,
  buildArtifactReactionOptions,
} from '../src/radial-menu/artifact-options.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { isHealRadialOption } from '../src/combat/heal-resolution.js';
import { isCleanseRadialOption } from '../src/combat/cleanse-resolution.js';
import { isUltimateProgressionRow } from '../src/utils/artifact-visible-abilities.js';
// @ts-expect-error — plain ESM helper shared with the pack build script.
import { echoPackFolderId, echoPackItemId, echoPackRootFolderId } from '../scripts/lib/echo-pack-ids.mjs';

const ROOT = path.resolve(__dirname, '..');
const PACK_SRC = path.join(ROOT, 'src/packs/echo-artifacts');

interface PackDoc {
  _id: string;
  _key: string;
  name: string;
  type?: string;
  img?: string;
  folder: string | null;
  system?: any;
  flags?: any;
}

function loadPack(): { items: PackDoc[]; folders: PackDoc[]; byId: Map<string, PackDoc> } {
  const items: PackDoc[] = [];
  const folders: PackDoc[] = [];
  const byId = new Map<string, PackDoc>();
  for (const f of fs.readdirSync(PACK_SRC)) {
    if (!f.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(PACK_SRC, f), 'utf8')) as PackDoc;
    byId.set(doc._id, doc);
    (doc._key.startsWith('!folders!') ? folders : items).push(doc);
  }
  return { items, folders, byId };
}

const pack = loadPack();
const ms = (d: PackDoc) => d.flags?.['mastery-system'] ?? {};
const rowsOf = (d: PackDoc): any[] => d.system?.levelProgression ?? [];

/** Rows that legitimately carry no catalog identity (Stone functions, bespoke text passives). */
function isIdentityInapplicable(row: any): boolean {
  const t = String(row.type || '').toLowerCase();
  return t.includes('stone') || t.includes('support') || t === 'passive';
}

/** Minimal Foundry-ish wrapper so radial builders can consume a raw pack doc. */
function asOwnedItem(doc: PackDoc, level?: number) {
  const flags = { ...ms(doc), artifactActivated: true };
  const lvl = level ?? (Number(doc.system?.level) || 1);
  return {
    id: doc._id,
    _id: doc._id,
    name: doc.name,
    type: 'artifact',
    img: doc.img,
    system: { ...doc.system, equipped: true, currentLevel: lvl, level: lvl },
    flags: { 'mastery-system': flags },
    getFlag: (_ns: string, key: string) => flags[key],
  };
}

describe('K9 pack — structure and stable ids', () => {
  it('ships 22 trees × 10 nodes = 220 items and 23 folders', () => {
    expect(Object.keys(ECHO_ARTIFACTS).length).toBe(22);
    expect(pack.items.length).toBe(220);
    expect(pack.folders.length).toBe(23);
  });

  it('every item id is derived from its stable nodeId; folders from echoArtifactKey', () => {
    for (const doc of pack.items) {
      expect(doc._id, doc.name).toBe(echoPackItemId(ms(doc).nodeId));
      expect(doc._key).toBe(`!items!${doc._id}`);
      expect(doc.folder, doc.name).toBe(echoPackFolderId(ms(doc).echoArtifactKey));
    }
    const root = pack.folders.find((f) => f.folder == null);
    expect(root?._id).toBe(echoPackRootFolderId());
    for (const f of pack.folders) {
      if (f.folder == null) continue;
      expect(f.folder).toBe(root!._id);
    }
  });

  it('all docs carry the current seedVersion and nodeId linkage', () => {
    for (const doc of pack.items) {
      const f = ms(doc);
      expect(f.seedVersion, doc.name).toBe(ECHO_ARTIFACT_SEED_VERSION);
      expect(String(f.nodeId)).toBe(`${f.echoArtifactKey}-l${doc.system.level}`);
    }
  });
});

describe('K9 pack — byte parity with the canonical builder', () => {
  it('every pack item equals buildAllEchoArtifactTrees() output (ids/folder injected)', () => {
    const built = new Map<string, Record<string, unknown>>();
    for (const tree of buildAllEchoArtifactTrees()) {
      const folder = echoPackFolderId(tree.echoArtifactKey);
      for (const node of tree.nodes) {
        const id = echoPackItemId(node.nodeId);
        built.set(id, { ...node.itemData, _id: id, folder, _key: `!items!${id}` });
      }
    }
    expect(built.size).toBe(pack.items.length);
    for (const doc of pack.items) {
      const expected = built.get(doc._id);
      expect(expected, `${doc.name} missing from builder`).toBeTruthy();
      expect(JSON.stringify(doc), doc.name).toBe(JSON.stringify(expected));
    }
  });
});

describe('K9 pack — identity completeness and contracts', () => {
  it('every row with catalog identity resolves; rows without identity are only Stone/Support/bespoke passives', () => {
    const unresolved: string[] = [];
    const noIdentity: string[] = [];
    let resolved = 0;
    for (const doc of pack.items) {
      for (const row of rowsOf(doc)) {
        if (!row.powerTemplateId && !row.artifactFunctionId) {
          if (!isIdentityInapplicable(row)) noIdentity.push(`${doc.name} L${row.level} ${row.name} [${row.type}]`);
          continue;
        }
        const res = resolvePowerIdentity({ kind: 'artifact-row', artifact: doc, row });
        if (res.ok) resolved += 1;
        else unresolved.push(`${doc.name} L${row.level} ${row.name}: ${res.reason}`);
      }
    }
    expect(noIdentity).toEqual([]);
    expect(unresolved).toEqual([]);
    expect(resolved).toBe(376);
  });

  it('powerTemplateId rows carry an explicit rank that exists on the template', () => {
    const issues: string[] = [];
    for (const doc of pack.items) {
      for (const row of rowsOf(doc)) {
        if (!row.powerTemplateId) continue;
        const tpl = getTemplate(row.powerTemplateId) as any;
        if (!tpl) issues.push(`${doc.name} L${row.level}: unknown template ${row.powerTemplateId}`);
        else if (row.rank == null) issues.push(`${doc.name} L${row.level} ${row.name}: rank missing`);
        else if (!tpl.levels?.[String(row.rank)]) issues.push(`${doc.name} L${row.level}: rank ${row.rank} not on ${row.powerTemplateId}`);
      }
    }
    expect(issues).toEqual([]);
  });

  it('K2 functions have no powerTemplateId; K3 dragon-breath has the exact required template', () => {
    const counts: Record<string, number> = {};
    for (const doc of pack.items) {
      for (const row of rowsOf(doc)) {
        const fn = row.artifactFunctionId;
        if (!fn) continue;
        expect(isArtifactFunctionId(fn), `${doc.name} L${row.level}`).toBe(true);
        counts[fn] = (counts[fn] || 0) + 1;
        const c = ARTIFACT_FUNCTION_CONTRACT[fn as keyof typeof ARTIFACT_FUNCTION_CONTRACT];
        if (c.klass === 'K2') expect(row.powerTemplateId, `${doc.name} L${row.level}`).toBeUndefined();
        else expect(row.powerTemplateId, `${doc.name} L${row.level}`).toBe(c.requiresTemplateId);
      }
    }
    expect(counts).toEqual({
      'artifact-awakening': 22,
      'dragon-breath': 10,
      'life-absorption': 9,
      'titan-growth': 10,
    });
  });

  it('L10 rows are Artifact Awakening via artifactFunctionId (no name routing needed)', () => {
    for (const doc of pack.items.filter((d) => Number(d.system.level) === 10)) {
      const l10 = rowsOf(doc).filter((r) => Number(r.level) === 10);
      expect(l10.length, doc.name).toBe(1);
      expect(l10[0].artifactFunctionId).toBe('artifact-awakening');
      expect(isUltimateProgressionRow({ ...l10[0], name: 'x' } as any)).toBe(true);
    }
  });

  it('authored stages in progressionPicks forward identity (no identity-less catalog powers)', () => {
    let withIdentity = 0;
    let total = 0;
    const missing: string[] = [];
    for (const doc of pack.items) {
      for (const pick of doc.system?.progressionPicks ?? []) {
        if (pick.kind !== 'authored') continue;
        for (const st of pick.authoredStages ?? []) {
          total += 1;
          if (st.powerTemplateId || st.artifactFunctionId) withIdentity += 1;
          else if (!isIdentityInapplicable(st)) missing.push(`${doc.name} L${st.level} ${st.name}`);
        }
      }
    }
    expect(missing).toEqual([]);
    expect(total).toBe(210);
    expect(withIdentity).toBe(120);
  });

  it('P1 closed: K2 read-time enrichment is a no-op on every pack row', () => {
    for (const doc of pack.items) {
      for (const row of rowsOf(doc)) {
        expect(enrichArtifactRowIdentity(doc as any, row), `${doc.name} L${row.level}`).toEqual(row);
      }
    }
  });
});

describe('K9 pack — known findings preserved (W1 / W2 / W5)', () => {
  it('W1: Titan Scars rows are titan-growth (K2) — never ab-armor-temp-hp', () => {
    const titan = pack.items.filter((d) => ms(d).echoArtifactKey === 'titanScars');
    expect(titan.length).toBe(10);
    const growthRows = titan.flatMap(rowsOf).filter((r) => /titan\s*growth/i.test(r.name));
    expect(growthRows.length).toBeGreaterThan(0);
    for (const r of growthRows) {
      expect(r.artifactFunctionId).toBe('titan-growth');
      expect(r.powerTemplateId).toBeUndefined();
    }
  });

  it('W2: Draconic Roar stays ab-armor-aura at ranks 4/10/16 (no mechanical change)', () => {
    const l10 = pack.items.find((d) => ms(d).echoArtifactKey === 'dragonHead' && d.system.level === 10)!;
    const roar = rowsOf(l10).filter((r) => /draconic roar/i.test(r.name));
    expect(roar.map((r) => [r.powerTemplateId, r.rank])).toEqual([['ab-armor-aura', 16]]);
    const l1 = pack.items.find((d) => ms(d).echoArtifactKey === 'dragonHead' && d.system.level === 1)!;
    const pick = (l1.system.progressionPicks as any[]).find((p) => p.level === 2);
    expect(pick.powerTemplateId).toBe('ab-armor-aura');
    expect(pick.stagePowerLevels).toEqual(['4', '10', '16']);
  });

  it('W5: echoBound is the echoKey string on every echo-bound node (semantics unchanged)', () => {
    for (const doc of pack.items) {
      expect(doc.system.binding).toBe('echo');
      expect(typeof ms(doc).echoBound).toBe('string');
      expect(ms(doc).echoBound).toBe(ECHO_ARTIFACTS[ms(doc).echoArtifactKey].echoKey);
    }
  });
});

describe('K9 pack — K8 identity-primary routing consumes pack identity directly', () => {
  const dragonL10 = pack.items.find((d) => ms(d).echoArtifactKey === 'dragonHead' && d.system.level === 10)!;
  const titanL1 = pack.items.find((d) => ms(d).echoArtifactKey === 'titanScars' && d.system.level === 1)!;
  const ringL10 = pack.items.find(
    (d) => ms(d).echoArtifactKey === 'ringchainOfKeptNames' && d.system.level === 10,
  );

  it('Dragon Head breath rows surface as Damage/Ruin Breath with dragon-breath identity + mode', () => {
    const opts = buildArtifactRadialOptions({ items: [asOwnedItem(dragonL10)] }) as any[];
    const breath = opts.filter((o) => o.artifactFunctionId === 'dragon-breath');
    expect(breath.map((o) => o.dragonHeadBreathMode).sort()).toEqual(['damage', 'ruin']);
    for (const o of breath) {
      expect(o.artifactPowerTemplateId).toBe('active-melee-weapon-aoe');
      expect(o.rank).toBe(16);
      expect(resolvePowerIdentity({ kind: 'radial-option', option: o }).ok).toBe(true);
    }
    const roar = opts.find((o) => o.artifactPowerTemplateId === 'ab-armor-aura');
    expect(roar?.rank).toBe(16);
    expect(getSegmentIdForOption(roar)).toBe('active-buff');
  });

  it('Titan Scars L1 surfaces as a Transformation option via artifactFunctionId (W1: no templateId)', () => {
    const opts = buildArtifactRadialOptions({ items: [asOwnedItem(titanL1)] }) as any[];
    const growth = opts.find((o) => o.artifactFunctionId === 'titan-growth');
    expect(growth).toBeTruthy();
    expect(growth.tags).toContain('transformation');
    expect(growth.artifactPowerTemplateId).toBeUndefined();
    expect(resolvePowerIdentity({ kind: 'radial-option', option: growth }).ok).toBe(true);
    // NOTE: the radial *segment* for titan-growth is an open K8 review item
    // (ARTIFACT_FUNCTION_CONTRACT category 'activeBuff' wins over the W1
    // "stays utility" branch in categoryFromIdentityOrType). K9 only asserts
    // that the pack identity reaches the option; it does not pin the segment.
  });

  it('Ringchain heal / cleanse rows classify by templateId and carry option.rank (F12)', () => {
    expect(ringL10, 'ringchainOfKeptNames L10 present').toBeTruthy();
    // Burden Lifted (cleanse) lives in progression slot 2 and is superseded in
    // the 3-slot visible window by Hearth Circle II from L8 on (pre-existing
    // builder/catalog behaviour, see K9 report §Observations). Use L6 for it.
    const ringL6 = pack.items.find(
      (d) => ms(d).echoArtifactKey === 'ringchainOfKeptNames' && d.system.level === 6,
    );
    expect(ringL6, 'ringchainOfKeptNames L6 present').toBeTruthy();
    const optsL10 = buildArtifactRadialOptions({ items: [asOwnedItem(ringL10!)] }) as any[];
    const optsL6 = buildArtifactRadialOptions({ items: [asOwnedItem(ringL6!)] }) as any[];
    const heals = optsL10.filter((o) => isHealRadialOption(o));
    const cleanses = optsL6.filter((o) => isCleanseRadialOption(o));
    expect(heals.map((o) => o.artifactPowerTemplateId).sort()).toEqual([
      'active-melee-aoe-restoration',
      'active-ranged-health-level-heal',
    ]);
    expect(cleanses.map((o) => o.artifactPowerTemplateId)).toEqual(['active-ranged-single-cleanse']);
    for (const o of [...heals, ...cleanses]) {
      expect([4, 10, 16]).toContain(o.rank);
      expect(resolvePowerIdentity({ kind: 'radial-option', option: o }).ok).toBe(true);
    }
    expect(heals.every((o) => o.rank === 16)).toBe(true);
    expect(cleanses[0].rank).toBe(10);
  });

  it('every radial / reaction option built from pack rows with identity resolves without name bridges', () => {
    const unresolved: string[] = [];
    for (const doc of pack.items.filter((d) => d.system.level === 10)) {
      const owned = asOwnedItem(doc);
      const all = [
        ...(buildArtifactRadialOptions({ items: [owned] }) as any[]),
        ...(buildArtifactReactionOptions({ items: [owned] }) as any[]),
      ];
      for (const o of all) {
        if (!o.artifactPowerTemplateId && !o.artifactFunctionId) continue; // stone/support rows, weapon swing
        const res = resolvePowerIdentity({ kind: 'radial-option', option: o });
        if (!res.ok) unresolved.push(`${doc.name}: ${o.name} → ${res.reason}`);
      }
    }
    expect(unresolved).toEqual([]);
  });
});
