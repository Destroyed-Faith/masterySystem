import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BEHAVIOR_TYPE, isSystemPackageUrl, MODULE_ID } from "../scripts/constants.mjs";
import { collectPolygonTreeContours, regionMaskOperations } from "../scripts/geometry.mjs";

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("polygon tree walk keeps outer rings and hole rings", () => {
  const hole = [4, 4, 6, 4, 6, 6, 4, 6];
  const island = [5, 5, 5.5, 5, 5.5, 5.5, 5, 5.5];
  const outer = [0, 0, 10, 0, 10, 10, 0, 10];
  const tree = {
    points: null,
    children: [{ points: outer, children: [{ points: hole, children: [{ points: island, children: [] }] }] }],
  };
  const contours = collectPolygonTreeContours(tree);
  assert.equal(contours.length, 3);
  assert.equal(contours[0], outer);
  assert.equal(contours[1], hole);
  const operations = regionMaskOperations(tree);
  assert.deepEqual(
    operations.map((operation) => operation.op),
    ["fill", "cut", "fill"],
  );
  assert.equal(operations[0].points, outer);
  assert.equal(operations[1].points, hole);
  assert.equal(operations[2].points, island);
});

test("module manifest registers the region behavior subtype", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(moduleRoot, "module.json"), "utf8"));
  assert.equal(manifest.id, MODULE_ID);
  assert.equal(manifest.title, "Destroyed Faith – Particle Effects");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.compatibility.verified, "14");
  assert.deepEqual(manifest.documentTypes, { RegionBehavior: { particleEffects: {} } });
  assert.equal(manifest.esmodules[0], "scripts/main.mjs");
  assert.equal(BEHAVIOR_TYPE, "df-particle-effects.particleEffects");
  for (const file of ["scripts/main.mjs", "lang/en.json", "lang/de.json", "sprite_manifest.json"]) {
    assert.equal(fs.existsSync(path.join(moduleRoot, file)), true, file);
  }
});

test("system package urls are not treated as the standalone module", () => {
  assert.equal(
    isSystemPackageUrl("https://forge.example/systems/mastery-system/modules/df-particle-effects/scripts/main.mjs"),
    true,
  );
  assert.equal(
    isSystemPackageUrl(
      "https://assets.forge-vtt.com/bazaar/mastery-system/0.9.728/modules/df-particle-effects/scripts/main.mjs",
    ),
    true,
  );
  assert.equal(
    isSystemPackageUrl("https://forge.example/modules/df-particle-effects/scripts/main.mjs"),
    false,
  );
  assert.equal(
    isSystemPackageUrl("https://assets.forge-vtt.com/bazaar/df-particle-effects/1.0.0/scripts/main.mjs"),
    false,
  );
});

test("both languages show the behavior as DF: Particle Effects", () => {
  for (const lang of ["en", "de"]) {
    const document = JSON.parse(fs.readFileSync(path.join(moduleRoot, "lang", `${lang}.json`), "utf8"));
    assert.equal(document.TYPES.RegionBehavior["df-particle-effects"].particleEffects, "DF: Particle Effects");
  }
});

test("sprite manifest files exist and match the declared pixel sizes", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(moduleRoot, "sprite_manifest.json"), "utf8"));
  const flames = manifest.flames ?? [];
  const embers = manifest.embers ?? [];
  assert.equal(flames.filter((entry) => entry.group === "large").length, 8);
  assert.equal(flames.filter((entry) => entry.group === "medium").length, 10);
  assert.equal(flames.filter((entry) => entry.group === "small").length, 12);
  assert.equal(embers.length, 10);

  for (const entry of [...flames, ...embers]) {
    const file = path.join(moduleRoot, entry.file);
    const buffer = fs.readFileSync(file);
    const size = pngSize(buffer);
    assert.equal(size.width, entry.size, entry.file);
    assert.equal(size.height, entry.size, entry.file);
    assert.equal(entry.group === "ember" ? 128 : 256, entry.size);
    assert.ok(entry.pivot[0] > 0 && entry.pivot[1] > 0);
  }

  const atlas = JSON.parse(fs.readFileSync(path.join(moduleRoot, "flames_atlas.json"), "utf8"));
  assert.ok(atlas);
  assert.equal(fs.existsSync(path.join(moduleRoot, "flames_atlas.png")), true);
});

function pngSize(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
