#!/usr/bin/env node
/**
 * One-shot fix run: lowercase all `key: '...'` values in Mastery-Tree power
 * files, matching the canonical `PowerSpecial` form required by the current
 * power-spec audit.
 *
 * Scope: only files under `src/utils/powers/*.ts`. In those files, `key:` is
 * used exclusively for `PowerSpecial` entries, so a regex-based replace is
 * safe. Prose fields such as `note`, `label`, `description` are unaffected
 * because they use different property names.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const POWERS_DIR = path.resolve(__dirname, '..', 'src', 'utils', 'powers');

/** Matches `key: 'Xxx'` (double quotes too) with an uppercase first char. */
const KEY_RE = /(\bkey\s*:\s*['"])([A-Z][A-Za-z0-9]*)(['"])/g;

function run() {
    if (!fs.existsSync(POWERS_DIR)) {
        console.error(`[fix-tree-special-keys] Directory not found: ${POWERS_DIR}`);
        process.exit(1);
    }

    const files = fs
        .readdirSync(POWERS_DIR)
        .filter((n) => n.endsWith('.ts'))
        .map((n) => path.join(POWERS_DIR, n));

    let totalReplacements = 0;
    let filesChanged = 0;
    const perKey = new Map();

    for (const file of files) {
        const before = fs.readFileSync(file, 'utf8');
        const keysInFile = new Set();
        let replacementsInFile = 0;

        const after = before.replace(KEY_RE, (_m, pre, ident, post) => {
            replacementsInFile += 1;
            keysInFile.add(ident);
            perKey.set(ident, (perKey.get(ident) || 0) + 1);
            return pre + ident.toLowerCase() + post;
        });

        if (replacementsInFile > 0) {
            fs.writeFileSync(file, after, 'utf8');
            filesChanged += 1;
            totalReplacements += replacementsInFile;
            const keyList = [...keysInFile].sort().join(', ');
            console.log(
                `${path.basename(file)}: ${replacementsInFile} replaced (${keyList})`,
            );
        }
    }

    console.log('---');
    console.log(`Files changed : ${filesChanged}`);
    console.log(`Replacements  : ${totalReplacements}`);
    if (perKey.size > 0) {
        const summary = [...perKey.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([k, n]) => `  ${k} -> ${k.toLowerCase()} (${n}x)`)
            .join('\n');
        console.log('Keys affected :\n' + summary);
    }
}

run();
