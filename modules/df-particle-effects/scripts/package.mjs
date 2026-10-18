import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(moduleRoot, "../..");
const outDir = path.join(repoRoot, "release");
const outFile = path.join(outDir, "df-particle-effects.zip");
const parent = path.dirname(moduleRoot);
const name = path.basename(moduleRoot);

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

const zip = spawnSync(
  "zip",
  ["-r", "-q", outFile, name, "-x", `${name}/tests/*`, "-x", `${name}/scripts/package.mjs`],
  { cwd: parent, stdio: "inherit" },
);

if (zip.error || zip.status !== 0) {
  const tar = spawnSync(
    "tar",
    [
      "-a",
      "-c",
      "-f",
      outFile,
      "--exclude",
      `${name}/tests`,
      "--exclude",
      `${name}/scripts/package.mjs`,
      "-C",
      parent,
      name,
    ],
    { stdio: "inherit" },
  );
  if (tar.status !== 0) {
    process.exit(tar.status ?? 1);
  }
}

console.log(`Wrote ${outFile}`);
