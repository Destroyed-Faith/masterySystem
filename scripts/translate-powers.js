/**
 * Mass Power-Text → mechanics Translation Tool
 *
 * Dev-only CLI that scans every non-deprecated mastery tree and spell
 * school, runs a bank of regex shape-matchers over each level's effect
 * text, and either (a) emits a Markdown review report per tree or (b)
 * writes a structured `mechanics: {...}` block into every level row where
 * a confident match was produced, preserving existing formatting.
 *
 * Usage:
 *   node scripts/translate-powers.js                  # dry run: write reports/ only
 *   node scripts/translate-powers.js --apply <slug>   # apply to one tree/school
 *   node scripts/translate-powers.js --apply-all      # apply everywhere
 *   node scripts/translate-powers.js --tree <slug>    # limit dry run to one tree
 *
 * Slugs match file basenames (without .ts):
 *   warden-dragon, raptor-dragon, dreadwyrm, dreadstalker, doomscribe,
 *   hexbound-harrier, void-testament, gale-breaker, storm-veil, ashguard,
 *   infernal-bastion, black-writ, pact-breach, split-tempest, pyre-calculus
 */

const path = require('path');
const fs = require('fs');
const { Project, SyntaxKind } = require('ts-morph');

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const MASTERY_TREES = [
  'src/utils/powers/warden-dragon.ts',
  'src/utils/powers/raptor-dragon.ts',
  'src/utils/powers/dreadwyrm.ts',
  'src/utils/powers/dreadstalker.ts',
  'src/utils/powers/doomscribe.ts',
  'src/utils/powers/hexbound-harrier.ts',
  'src/utils/powers/void-testament.ts',
  'src/utils/powers/gale-breaker.ts',
  'src/utils/powers/storm-veil.ts',
  'src/utils/powers/ashguard.ts',
  'src/utils/powers/infernal-bastion.ts',
];
const SPELL_SCHOOLS = [
  'src/utils/spells/black-writ.ts',
  'src/utils/spells/pact-breach.ts',
  'src/utils/spells/split-tempest.ts',
  'src/utils/spells/pyre-calculus.ts',
];
const ALL_TARGETS = [...MASTERY_TREES, ...SPELL_SCHOOLS];

// ---------------------------------------------------------------------------
// Matchers — small pure functions, each returns a partial PowerMechanics
// object plus a trace tag ("Armor", "SaveDice:body", …) for the review
// report. Matchers are additive — multiple may fire on the same text.
// ---------------------------------------------------------------------------

/** @typedef {{ key: string, partial: object }} MatchHit */

/** Normalize common unicode variants to ASCII so regex is simpler. */
function normalize(text) {
  if (!text) return '';
  return text
    .replace(/[−–—]/g, '-') // various dashes
    .replace(/\s+/g, ' ')
    .trim();
}

const MATCHERS = [
  {
    key: 'armor',
    run(txt) {
      // "+2 Armor" or "-1 Armor"
      const m = /([+-]?)\s*(\d+)\s+Armor\b/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { armor: sign * parseInt(m[2], 10) } };
    },
  },
  {
    key: 'evade',
    run(txt) {
      const m = /([+-]?)\s*(\d+)\s+Evade\b/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { evade: sign * parseInt(m[2], 10) } };
    },
  },
  {
    key: 'saveDice',
    run(txt) {
      // One unified pattern — intentionally NOT run twice so "+2 dice to
      // Body Save or resistance check" no longer doubles to +4.
      // Catches:
      //   "+2 dice to Body Saving Throws"
      //   "+1 die to Mind Save"
      //   "Gain +3 dice to that Body Save"
      //   "Gain +6 dice to the next Body Save"
      //   "+2 dice to Spirit Save or resistance check"
      const re = /([+-]?)\s*(\d+)\s+(?:dice|die)\s+(?:to|on)\s+(?:that\s+|the\s+next\s+|your\s+|all\s+)?(Body|Mind|Spirit)\s+Sav(?:e|ing)/gi;
      const results = {};
      const seen = new Set();
      let hit;
      while ((hit = re.exec(txt)) !== null) {
        // Dedupe by (capture-start, family) so overlapping variants of the
        // same line never contribute twice.
        const key = `${hit.index}|${hit[3].toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const sign = hit[1] === '-' ? -1 : 1;
        const n = sign * parseInt(hit[2], 10);
        const fam = hit[3].toLowerCase();
        results[fam] = (results[fam] || 0) + n;
      }
      if (Object.keys(results).length === 0) return null;
      return { partial: { saveDice: results } };
    },
  },
  {
    key: 'regen',
    run(txt) {
      // "Regeneration(3)" or "Regeneration 3"
      const m = /Regeneration\s*[\(\s]\s*(\d+)/i.exec(txt);
      if (!m) return null;
      return { partial: { regen: parseInt(m[1], 10) } };
    },
  },
  {
    key: 'tempHP',
    run(txt) {
      // "1d8 Temp HP" or "Gain 2 Temp HP"
      let m = /(\d+d\d+)\s*Temp\s*HP/i.exec(txt);
      if (m) return { partial: { tempHP: m[1] } };
      m = /Gain\s+(\d+)\s+Temp\s*HP/i.exec(txt);
      if (m) return { partial: { tempHP: m[1] } };
      return null;
    },
  },
  {
    key: 'movementBonus',
    run(txt) {
      // "+4 m Movement" / "+3m Movement Speed"
      const m = /([+-]?)\s*(\d+)\s*m\s+Movement(?!\s+Speed)?/i.exec(txt)
        || /([+-]?)\s*(\d+)\s*m\s+speed/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { movementBonus: sign * parseInt(m[2], 10) } };
    },
  },
  {
    key: 'ignoreTerrain',
    run(txt) {
      if (/ignore\s+difficult\s+terrain/i.test(txt)) {
        return { partial: { ignoreTerrain: true } };
      }
      return null;
    },
  },
  {
    key: 'initiativeD8',
    run(txt) {
      // "+1 d8 to Initiative" or "+1 die to Initiative"
      const m = /([+-]?)\s*(\d+)\s*(?:d8|dice|die)\s+to\s+Initiative/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { initiativeD8: sign * parseInt(m[2], 10) } };
    },
  },
  {
    key: 'rollDice.attack',
    run(txt) {
      // "+2 dice on attacks"
      const m = /([+-]?)\s*(\d+)\s+(?:dice|die)\s+on\s+attacks?/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { rollDice: { attack: sign * parseInt(m[2], 10) } } };
    },
  },
  {
    key: 'rollDice.skill',
    run(txt) {
      // "+1 die to Athletics" — we don't classify per-skill; any "to <skill> skill" form
      const m = /([+-]?)\s*(\d+)\s+(?:dice|die)\s+to\s+(?:all\s+)?skill/i.exec(txt);
      if (!m) return null;
      const sign = m[1] === '-' ? -1 : 1;
      return { partial: { rollDice: { skill: sign * parseInt(m[2], 10) } } };
    },
  },
  {
    key: 'damageRider.flat',
    run(txt) {
      // "Weapon DMG +1d8", "+1d8 damage"
      const m = /(?:Weapon\s*DMG|weapon\s*damage)\s*\+?\s*(\d+d\d+)/i.exec(txt)
        || /\+\s*(\d+d\d+)\s+damage/i.exec(txt);
      if (!m) return null;
      return { partial: { damageRider: { flat: `+${m[1]}` } } };
    },
  },
  {
    key: 'damageRider.vsCondition',
    run(txt) {
      // Spell shape: "NdM damage vs. <Condition> target" (with or without period)
      const m = /(\d+d\d+)\s+damage\s+(?:vs\.?|against)\s+(a\s+)?(Marked|Ignited|Shocked|Frozen|Hexed)\b/i.exec(txt);
      if (!m) return null;
      const cond = m[3].toLowerCase();
      return {
        partial: {
          damageRider: { vsCondition: cond, vsConditionDamage: `+${m[1]}` },
        },
      };
    },
  },
  {
    key: 'condition',
    run(txt) {
      const lower = txt.toLowerCase();
      const map = {
        marked: /(vs\.?|against)\s+(a\s+)?marked/.test(lower) || /when\s+target\s+is\s+marked/.test(lower) || /marked\s+target/.test(lower),
        ignited: /(vs\.?|against)\s+(a\s+)?ignited/.test(lower) || /when\s+target\s+is\s+ignited/.test(lower) || /ignited\s+target/.test(lower),
        shocked: /(vs\.?|against)\s+(a\s+)?shocked/.test(lower) || /when\s+target\s+is\s+shocked/.test(lower) || /shocked\s+target/.test(lower),
        frozen: /(vs\.?|against)\s+(a\s+)?frozen/.test(lower) || /when\s+target\s+is\s+frozen/.test(lower) || /frozen\s+target/.test(lower),
        hexed:   /(vs\.?|against)\s+(a\s+)?hexed/.test(lower) || /when\s+target\s+is\s+hexed/.test(lower) || /hexed\s+target/.test(lower),
      };
      for (const key of ['marked', 'ignited', 'shocked', 'frozen', 'hexed']) {
        if (map[key]) {
          const conditionKey = `target${key[0].toUpperCase()}${key.slice(1)}`;
          return { partial: { condition: conditionKey } };
        }
      }
      return null;
    },
  },
];

/** Run every matcher against a single effect.text; returns merged partial + trace. */
function proposeFromText(rawText) {
  const text = normalize(rawText);
  if (!text) return { mechanics: null, hits: [], trace: [] };
  const merged = {};
  const trace = [];
  for (const matcher of MATCHERS) {
    const hit = matcher.run(text);
    if (!hit) continue;
    trace.push(matcher.key);
    deepMerge(merged, hit.partial);
  }
  return { mechanics: Object.keys(merged).length ? merged : null, trace };
}

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

/** Derive applyWhen + duration defaults from the power's category + level row. */
function deriveApplyWhen(category, levelRow) {
  switch (category) {
    case 'passive':     return { applyWhen: 'passive-slotted-active' };
    case 'activeBuff':  return { applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' };
    case 'reaction':    return { applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } };
    case 'active':      return { applyWhen: 'attack-rider' };
    case 'movement':    return { applyWhen: 'attack-rider' };
    default:            return { applyWhen: 'manual' };
  }
}

// ---------------------------------------------------------------------------
// ts-morph driven tree walker
// ---------------------------------------------------------------------------

function findPowerObjectsInFile(sourceFile) {
  // Look for `export const FOO_POWERS: ...[] = [ { ... }, { ... } ]`
  const results = [];
  for (const stmt of sourceFile.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const init = decl.getInitializer();
      if (!init) continue;
      if (init.getKind() !== SyntaxKind.ArrayLiteralExpression) continue;
      for (const el of init.getElements()) {
        if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
          results.push(el);
        }
      }
    }
  }
  return results;
}

function readStringProperty(obj, propName) {
  const prop = obj.getProperty(propName);
  if (!prop || prop.getKind() !== SyntaxKind.PropertyAssignment) return null;
  const initializer = prop.getInitializer();
  if (!initializer) return null;
  if (initializer.getKind() === SyntaxKind.StringLiteral) {
    return initializer.getLiteralText();
  }
  return null;
}

function readCategoryProperty(obj) {
  return readStringProperty(obj, 'category') || readStringProperty(obj, 'spellType') || 'unknown';
}

function readLevelsObject(obj) {
  const prop = obj.getProperty('levels');
  if (!prop || prop.getKind() !== SyntaxKind.PropertyAssignment) return null;
  const init = prop.getInitializer();
  if (!init || init.getKind() !== SyntaxKind.ObjectLiteralExpression) return null;
  return init;
}

/**
 * Spell-school shape: `levels: [ { level: 1, effect: '...' }, ... ]` (array).
 * Returns an array of [keyString, levelRow] tuples normalized to the same
 * interface that iterateLevelRows yields for the object form.
 */
function readLevelsArray(obj) {
  const prop = obj.getProperty('levels');
  if (!prop || prop.getKind() !== SyntaxKind.PropertyAssignment) return null;
  const init = prop.getInitializer();
  if (!init || init.getKind() !== SyntaxKind.ArrayLiteralExpression) return null;
  const out = [];
  for (const el of init.getElements()) {
    if (el.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
    let levelKey = null;
    const lvlProp = el.getProperty('level');
    if (lvlProp && lvlProp.getKind() === SyntaxKind.PropertyAssignment) {
      const v = lvlProp.getInitializer();
      if (v && v.getKind() === SyntaxKind.NumericLiteral) levelKey = v.getText();
      else if (v && v.getKind() === SyntaxKind.StringLiteral) levelKey = v.getLiteralText();
    }
    if (!/^[1-4]$/.test(String(levelKey))) continue;
    out.push([levelKey, el]);
  }
  return out;
}

/** Spell-level effect: either plain string `effect: '...'` or nested `{text:...}`. */
function readEffectFromSpellLevel(levelRow) {
  // Plain string form first.
  const str = readStringProperty(levelRow, 'effect');
  if (str !== null) return str;
  // Fallback to nested form (in case any spell is normalized later).
  return readEffectTextFromLevelRow(levelRow);
}

function readEffectTextFromLevelRow(levelRow) {
  const effectProp = levelRow.getProperty('effect');
  if (!effectProp || effectProp.getKind() !== SyntaxKind.PropertyAssignment) return null;
  const effectInit = effectProp.getInitializer();
  if (!effectInit || effectInit.getKind() !== SyntaxKind.ObjectLiteralExpression) return null;
  const textProp = effectInit.getProperty('text');
  if (!textProp || textProp.getKind() !== SyntaxKind.PropertyAssignment) return null;
  const textInit = textProp.getInitializer();
  if (!textInit) return null;
  if (textInit.getKind() === SyntaxKind.StringLiteral) return textInit.getLiteralText();
  // Handle template literals without interpolations
  if (textInit.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) return textInit.getLiteralText();
  return null;
}

function readSpellEffect(obj) {
  // Spells use `effect: '...'` at the power level (not nested in levels).
  return readStringProperty(obj, 'effect');
}

// ---------------------------------------------------------------------------
// Analysis per file
// ---------------------------------------------------------------------------

/** Normalizes a proposed mechanics block: injects applyWhen + sanity checks. */
function finalizeMechanics(raw, applyWhen) {
  if (!raw) return null;
  // Drop empty nested objects.
  for (const k of Object.keys(raw)) {
    if (typeof raw[k] === 'object' && raw[k] !== null && !Array.isArray(raw[k])) {
      if (Object.keys(raw[k]).length === 0) delete raw[k];
    }
  }
  if (Object.keys(raw).length === 0) return null;
  return { ...raw, ...applyWhen };
}

function analyzeMasteryFile(filePath) {
  const project = new Project({ tsConfigFilePath: path.join(REPO_ROOT, 'tsconfig.json') });
  const sf = project.addSourceFileAtPath(filePath);
  const powers = findPowerObjectsInFile(sf);
  const report = { file: filePath, powers: [], stats: { total: 0, autoApplied: 0, partial: 0, empty: 0 } };

  for (const powerObj of powers) {
    const name = readStringProperty(powerObj, 'name') || '(unnamed)';
    const category = readCategoryProperty(powerObj);
    const levelsObj = readLevelsObject(powerObj);
    const levelsArr = levelsObj ? null : readLevelsArray(powerObj);
    const powerEntry = { name, category, levels: {} };

    const iterPairs = [];
    if (levelsObj) {
      for (const prop of levelsObj.getProperties()) {
        if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
        const keyNode = prop.getNameNode();
        let key = null;
        if (keyNode.getKind() === SyntaxKind.StringLiteral) key = keyNode.getLiteralText();
        else if (keyNode.getKind() === SyntaxKind.Identifier) key = keyNode.getText();
        else if (keyNode.getKind() === SyntaxKind.NumericLiteral) key = keyNode.getText();
        if (!/^[1-4]$/.test(String(key))) continue;
        const levelInit = prop.getInitializer();
        if (!levelInit || levelInit.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
        iterPairs.push([key, levelInit, 'object']);
      }
    } else if (levelsArr) {
      for (const [k, row] of levelsArr) iterPairs.push([k, row, 'array']);
    } else {
      // Legacy spell shape without levels: single string at top-level.
      const effectText = readSpellEffect(powerObj) || '';
      const { mechanics: raw, trace } = proposeFromText(effectText);
      const mechanics = finalizeMechanics(raw, deriveApplyWhen(category, null));
      powerEntry.levels['1'] = { effectText, mechanics, trace };
      report.stats.total += 1;
      if (mechanics) report.stats.autoApplied += 1;
      else report.stats.empty += 1;
      report.powers.push(powerEntry);
      continue;
    }

    for (const [key, levelInit, shape] of iterPairs) {
      const effectText = shape === 'array'
        ? (readEffectFromSpellLevel(levelInit) || '')
        : (readEffectTextFromLevelRow(levelInit) || '');
      const { mechanics: raw, trace } = proposeFromText(effectText);
      const mechanics = finalizeMechanics(raw, deriveApplyWhen(category, levelInit));
      powerEntry.levels[key] = { effectText, mechanics, trace };
      report.stats.total += 1;
      if (mechanics) report.stats.autoApplied += 1;
      else report.stats.empty += 1;
    }
    report.powers.push(powerEntry);
  }
  return report;
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------

function slugOfFile(filePath) {
  return path.basename(filePath, '.ts');
}

function writeReport(report) {
  const slug = slugOfFile(report.file);
  const dir = path.join(REPO_ROOT, 'reports', 'translation');
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `${slug}.md`);
  const lines = [];
  lines.push(`# Translation report: ${slug}`);
  lines.push('');
  lines.push(`Source: \`${report.file.replace(/\\/g, '/')}\``);
  lines.push('');
  lines.push(`Levels scanned: **${report.stats.total}**`);
  lines.push(`Auto-applied: **${report.stats.autoApplied}** (${pct(report.stats.autoApplied, report.stats.total)}%)`);
  lines.push(`Needs review: **${report.stats.empty}** (${pct(report.stats.empty, report.stats.total)}%)`);
  lines.push('');

  const autoSection = ['## Auto-applied', ''];
  const reviewSection = ['## Needs review (no confident match)', ''];
  for (const p of report.powers) {
    for (const [lvl, row] of Object.entries(p.levels)) {
      if (row.mechanics) {
        autoSection.push(`- **${p.name}** (${p.category}, L${lvl}) — ${row.trace.join(', ')}`);
        autoSection.push(`  - effect: _${truncate(row.effectText, 120)}_`);
        autoSection.push(`  - mechanics: \`${JSON.stringify(row.mechanics)}\``);
      } else {
        reviewSection.push(`- **${p.name}** (${p.category}, L${lvl})`);
        reviewSection.push(`  - effect: _${truncate(row.effectText, 160)}_`);
      }
    }
  }
  lines.push(...autoSection, '', ...reviewSection, '');
  fs.writeFileSync(dest, lines.join('\n'), 'utf8');
  return dest;
}

function pct(part, whole) { return whole === 0 ? '0' : Math.round((part / whole) * 100); }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// ---------------------------------------------------------------------------
// Applier — insert mechanics: {...} into each level row where confident
// ---------------------------------------------------------------------------

function stringifyMechanics(mech) {
  // Compact single-line JSON with single-quoted string values to match repo style.
  // ts-morph will re-print if we set as a parsed ObjectLiteralExpression, but we
  // do a manual round-trip through a stable JSON → TS conversion for readability.
  const json = JSON.stringify(mech);
  // Replace double quotes around identifiers on the LHS.
  // (We accept double-quoted string values for safety; ESLint/prettier can
  // re-normalize later if desired.)
  return json
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:')
    .replace(/"/g, "'");
}

function applyToFile(filePath) {
  const project = new Project({ tsConfigFilePath: path.join(REPO_ROOT, 'tsconfig.json') });
  const sf = project.addSourceFileAtPath(filePath);
  const powers = findPowerObjectsInFile(sf);
  let modifiedLevels = 0;

  for (const powerObj of powers) {
    const category = readCategoryProperty(powerObj);
    const levelsObj = readLevelsObject(powerObj);
    const levelsArr = levelsObj ? null : readLevelsArray(powerObj);

    const iterPairs = [];
    if (levelsObj) {
      for (const prop of levelsObj.getProperties()) {
        if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;
        const keyNode = prop.getNameNode();
        let key = null;
        if (keyNode.getKind() === SyntaxKind.StringLiteral) key = keyNode.getLiteralText();
        else if (keyNode.getKind() === SyntaxKind.Identifier) key = keyNode.getText();
        else if (keyNode.getKind() === SyntaxKind.NumericLiteral) key = keyNode.getText();
        if (!/^[1-4]$/.test(String(key))) continue;
        const levelInit = prop.getInitializer();
        if (!levelInit || levelInit.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
        iterPairs.push([levelInit, 'object']);
      }
    } else if (levelsArr) {
      for (const [, row] of levelsArr) iterPairs.push([row, 'array']);
    } else {
      // Legacy no-levels spell: put mechanics at power-level.
      if (powerObj.getProperty('mechanics')) continue;
      const effectText = readSpellEffect(powerObj);
      if (!effectText) continue;
      const { mechanics: raw } = proposeFromText(effectText);
      const finalized = finalizeMechanics(raw, deriveApplyWhen(category, null));
      if (!finalized) continue;
      powerObj.addPropertyAssignment({
        name: 'mechanics',
        initializer: stringifyMechanics(finalized),
      });
      modifiedLevels += 1;
      continue;
    }

    for (const [levelInit, shape] of iterPairs) {
      if (levelInit.getProperty('mechanics')) continue;
      const effectText = shape === 'array'
        ? readEffectFromSpellLevel(levelInit)
        : readEffectTextFromLevelRow(levelInit);
      if (!effectText) continue;
      const { mechanics: raw } = proposeFromText(effectText);
      const finalized = finalizeMechanics(raw, deriveApplyWhen(category, levelInit));
      if (!finalized) continue;
      levelInit.addPropertyAssignment({
        name: 'mechanics',
        initializer: stringifyMechanics(finalized),
      });
      modifiedLevels += 1;
    }
  }

  if (modifiedLevels > 0) {
    sf.saveSync();
  }
  return modifiedLevels;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { apply: null, applyAll: false, tree: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') opts.apply = argv[++i];
    else if (a === '--apply-all') opts.applyAll = true;
    else if (a === '--tree') opts.tree = argv[++i];
    else if (a === '-h' || a === '--help') opts.help = true;
  }
  return opts;
}

function resolveTargetsBySlug(slugOrNull) {
  if (!slugOrNull) return ALL_TARGETS;
  return ALL_TARGETS.filter((f) => slugOfFile(f) === slugOrNull);
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
    return;
  }

  if (opts.applyAll) {
    let total = 0;
    for (const f of ALL_TARGETS) {
      const abs = path.join(REPO_ROOT, f);
      const n = applyToFile(abs);
      total += n;
      console.log(`[apply] ${slugOfFile(f)}: ${n} level rows updated`);
    }
    console.log(`\nTotal level rows written: ${total}`);
    return;
  }

  if (opts.apply) {
    const targets = resolveTargetsBySlug(opts.apply);
    if (targets.length === 0) {
      console.error(`[error] Unknown slug: ${opts.apply}`);
      console.error(`Available: ${ALL_TARGETS.map(slugOfFile).join(', ')}`);
      process.exit(2);
    }
    for (const f of targets) {
      const abs = path.join(REPO_ROOT, f);
      const n = applyToFile(abs);
      console.log(`[apply] ${slugOfFile(f)}: ${n} level rows updated`);
    }
    return;
  }

  // Dry run / report mode
  const targets = resolveTargetsBySlug(opts.tree);
  if (targets.length === 0) {
    console.error(`[error] Unknown slug: ${opts.tree}`);
    process.exit(2);
  }
  let grandTotal = 0;
  let grandAuto = 0;
  for (const f of targets) {
    const abs = path.join(REPO_ROOT, f);
    const report = analyzeMasteryFile(abs);
    const dest = writeReport(report);
    grandTotal += report.stats.total;
    grandAuto += report.stats.autoApplied;
    console.log(`[report] ${slugOfFile(f)}: ${report.stats.autoApplied}/${report.stats.total} auto → ${path.relative(REPO_ROOT, dest)}`);
  }
  console.log(`\nAggregate: ${grandAuto}/${grandTotal} auto-applied (${pct(grandAuto, grandTotal)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
