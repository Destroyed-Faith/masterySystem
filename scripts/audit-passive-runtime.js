#!/usr/bin/env node
/**
 * Audit: Passive Runtime Gaps
 *
 * Scans every Mastery-Tree power definition for passives whose narrative
 * effect text contains a timing phrase that the runtime should handle
 * (combat-start one-shot, turn-start refresh, end-of-turn heal, etc.) but
 * whose mechanics block does not declare the matching `triggers.*` entry.
 *
 * Writes a human-readable report to `reports/passive-runtime-gaps.md`. The
 * report is a working list for follow-up PRs: each listed passive is an
 * opportunity to wire an existing effect through the new
 * `src/combat/passive-triggers.ts` framework (or a future extension of it).
 *
 * Read-only: this script never modifies source files.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POWERS_DIR = path.resolve(ROOT, 'src', 'utils', 'powers');
const REPORT_PATH = path.resolve(ROOT, 'reports', 'passive-runtime-gaps.md');

/**
 * Ordered list of timing phrases → suggested trigger. The first match wins.
 * Phrases are matched case-insensitively, surrounded by word boundaries where
 * feasible. Items with `suggestedTrigger: null` are "out of framework scope
 * for now" (future work) but still listed so we can plan.
 */
const TIMING_RULES = [
  {
    phrase: /at the start of combat/i,
    label: 'combat-start one-shot',
    suggestedTrigger: 'triggers.combatStart',
  },
  {
    phrase: /at the start of (?:your|the owner'?s|its)[^.]*turn/i,
    label: 'turn-start self refresh / grant',
    suggestedTrigger: 'triggers.turnStartSelf',
  },
  {
    phrase: /at the start of (?:each|every) (?:of your )?turns?/i,
    label: 'turn-start self refresh / grant',
    suggestedTrigger: 'triggers.turnStartSelf',
  },
  {
    phrase: /at the end of (?:your|the owner'?s)[^.]*turn/i,
    label: 'end-of-turn (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /at the end of (?:each|every) (?:of your )?turns?/i,
    label: 'end-of-turn (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /at the start of (?:each|every) round/i,
    label: 'round-start (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /once per round/i,
    label: 'once-per-round rider (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /first time each round/i,
    label: 'once-per-round rider (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /next hit (?:this turn|against)/i,
    label: 'next-hit rider (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /until (?:the )?end of (?:your|this|the)[^.]*turn/i,
    label: 'until-end-of-turn buff (not wired yet)',
    suggestedTrigger: null,
  },
  {
    phrase: /for the rest of (?:the )?combat/i,
    label: 'rest-of-combat buff (not wired yet)',
    suggestedTrigger: null,
  },
];

/**
 * Extract passive-like power objects from a file by lightweight regex
 * tokenisation. We explicitly avoid a full TS parser to keep the script
 * zero-dep; instead we locate every object literal with `category: 'passive'`
 * and walk brace-balanced slices to capture its body.
 */
function extractPassiveBlocks(src) {
  const blocks = [];
  const marker = /category\s*:\s*['"]passive['"]/g;
  let m;
  while ((m = marker.exec(src)) != null) {
    // Walk backwards to find the enclosing `{` of this object literal.
    let start = m.index;
    let depth = 0;
    while (start > 0) {
      const c = src[start];
      if (c === '}') depth++;
      else if (c === '{') {
        if (depth === 0) break;
        depth--;
      }
      start--;
    }
    if (src[start] !== '{') continue;

    // Walk forward matching braces to find the end.
    let end = start;
    depth = 0;
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end <= start) continue;

    blocks.push({ body: src.substring(start, end + 1), offset: start });
  }
  return blocks;
}

function extractName(body) {
  const m = body.match(/\bname\s*:\s*['"]([^'"]+)['"]/);
  return m ? m[1] : '(unnamed)';
}

/**
 * Collect each level's (rank, effectText, mechanicsRaw) triples from a
 * passive body. `mechanicsRaw` is the raw text slice of the mechanics object
 * (if any) so we can grep for `triggers:` without mis-parsing nested
 * literals.
 */
function extractLevels(body) {
  const levels = [];
  const rankRe = /['"]([1-4])['"]\s*:\s*\{/g;
  let m;
  while ((m = rankRe.exec(body)) != null) {
    const rank = m[1];
    // Brace-balanced extraction of this level's body.
    let depth = 0;
    let start = body.indexOf('{', m.index);
    if (start < 0) continue;
    let end = start;
    for (let i = start; i < body.length; i++) {
      const c = body[i];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end <= start) continue;
    const levelBody = body.substring(start, end + 1);

    const textMatch = levelBody.match(/text\s*:\s*['"`]([^'"`]*)['"`]/);
    const effectText = textMatch ? textMatch[1] : '';

    const mechanicsMatch = levelBody.match(/mechanics\s*:\s*\{/);
    let mechanicsRaw = null;
    if (mechanicsMatch) {
      const mStart = levelBody.indexOf('{', mechanicsMatch.index);
      let mDepth = 0;
      let mEnd = mStart;
      for (let i = mStart; i < levelBody.length; i++) {
        const c = levelBody[i];
        if (c === '{') mDepth++;
        else if (c === '}') {
          mDepth--;
          if (mDepth === 0) {
            mEnd = i;
            break;
          }
        }
      }
      mechanicsRaw = levelBody.substring(mStart, mEnd + 1);
    }

    levels.push({ rank, effectText, mechanicsRaw });
  }
  return levels;
}

function findTimingIssues(levels) {
  // Aggregate across levels: if ALL levels have matching triggers for a given
  // timing phrase, we consider it covered. Otherwise it's a gap.
  const findings = new Map(); // phraseLabel -> { suggestedTrigger, ranks: [] }

  for (const lvl of levels) {
    const t = lvl.effectText.toLowerCase();
    for (const rule of TIMING_RULES) {
      if (!rule.phrase.test(t)) continue;
      const covered =
        rule.suggestedTrigger &&
        lvl.mechanicsRaw &&
        // Heuristic: look for the leaf name (`combatStart`, `turnStartSelf`, …)
        lvl.mechanicsRaw.includes(rule.suggestedTrigger.split('.').pop());
      if (covered) continue;
      const key = rule.label;
      if (!findings.has(key)) {
        findings.set(key, {
          label: rule.label,
          suggestedTrigger: rule.suggestedTrigger,
          ranks: new Set(),
        });
      }
      findings.get(key).ranks.add(lvl.rank);
    }
  }

  return [...findings.values()].map((f) => ({
    label: f.label,
    suggestedTrigger: f.suggestedTrigger,
    ranks: [...f.ranks].sort(),
  }));
}

function run() {
  if (!fs.existsSync(POWERS_DIR)) {
    console.error(`[audit-passive-runtime] Powers dir not found: ${POWERS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(POWERS_DIR)
    .filter((n) => n.endsWith('.ts') && n !== 'index.ts')
    .sort();

  /** @type {Array<{file: string, name: string, issues: any[]}>} */
  const report = [];
  let wiredCount = 0;
  let passiveCount = 0;

  for (const file of files) {
    const full = path.join(POWERS_DIR, file);
    const src = fs.readFileSync(full, 'utf8');
    const blocks = extractPassiveBlocks(src);
    for (const b of blocks) {
      passiveCount++;
      const name = extractName(b.body);
      const levels = extractLevels(b.body);
      const issues = findTimingIssues(levels);
      if (issues.length === 0) {
        // Count as wired if the body already contains `triggers:` anywhere.
        if (/triggers\s*:/.test(b.body)) wiredCount++;
        continue;
      }
      report.push({ file, name, issues });
    }
  }

  report.sort((a, b) => (a.file + a.name).localeCompare(b.file + b.name));

  const lines = [];
  lines.push('# Passive Runtime Gaps');
  lines.push('');
  lines.push(
    'Auto-generated by `scripts/audit-passive-runtime.js`. Lists every passive whose',
  );
  lines.push(
    'effect text mentions a timing phrase (combat-start, turn-start, once-per-round, …)',
  );
  lines.push(
    'without a matching `triggers.*` entry in its `mechanics` block. Use this as a',
  );
  lines.push(
    'working list for follow-up PRs that wire these effects through the new',
  );
  lines.push('`src/combat/passive-triggers.ts` framework.');
  lines.push('');
  lines.push(`**Passives scanned:** ${passiveCount}`);
  lines.push(`**Already wired (have a \`triggers:\` block):** ${wiredCount}`);
  lines.push(`**Gaps remaining:** ${report.length}`);
  lines.push('');

  if (report.length === 0) {
    lines.push('_All passives with timing phrases have matching triggers._');
  } else {
    const byFile = new Map();
    for (const r of report) {
      if (!byFile.has(r.file)) byFile.set(r.file, []);
      byFile.get(r.file).push(r);
    }
    const fileNames = [...byFile.keys()].sort();
    for (const file of fileNames) {
      lines.push(`## \`${file}\``);
      lines.push('');
      lines.push('| Passive | Gap | Suggested trigger | Ranks affected |');
      lines.push('| --- | --- | --- | --- |');
      for (const r of byFile.get(file)) {
        for (const issue of r.issues) {
          lines.push(
            `| ${r.name} | ${issue.label} | ${
              issue.suggestedTrigger ? `\`${issue.suggestedTrigger}\`` : '_future work_'
            } | ${issue.ranks.join(', ')} |`,
          );
        }
      }
      lines.push('');
    }
  }

  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');

  console.log(`[audit-passive-runtime] Passives scanned : ${passiveCount}`);
  console.log(`[audit-passive-runtime] Already wired    : ${wiredCount}`);
  console.log(`[audit-passive-runtime] Gaps remaining   : ${report.length}`);
  console.log(`[audit-passive-runtime] Report written  -> ${path.relative(ROOT, REPORT_PATH)}`);
}

run();
