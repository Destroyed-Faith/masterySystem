import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { auditAllMasteryTreePowers, formatTreePowerAuditMarkdown } from '../src/utils/tree-power-audit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('tree power spec audit', () => {
  it('writes reports/tree-power-audit.md (informational; does not fail on findings)', () => {
    const issues = auditAllMasteryTreePowers();
    const md = formatTreePowerAuditMarkdown(issues);
    const outDir = join(repoRoot, 'reports');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'tree-power-audit.md');
    writeFileSync(outPath, md, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Wrote ${outPath} (${issues.length} finding(s))`);
  });
});
