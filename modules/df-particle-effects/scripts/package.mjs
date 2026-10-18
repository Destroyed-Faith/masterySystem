import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(moduleRoot, "../..");
const outDir = path.join(repoRoot, "release");
const outFile = path.join(outDir, "df-particle-effects.zip");

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

const result = spawnSync(
  "tar",
  [
    "-a",
    "-c",
    "-f",
    outFile,
    "--exclude",
    "df-particle-effects/tests",
    "--exclude",
    "df-particle-effects/scripts/package.mjs",
    "-C",
    path.dirname(moduleRoot),
    "df-particle-effects",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Wrote ${outFile}`);
