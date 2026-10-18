import assert from "node:assert/strict";
import test from "node:test";
import { evenOddContains, gridCellArea, pointInRing } from "../scripts/geometry.mjs";
import { allocateBudget, desiredEmberCount, desiredFlameCount, planFlameSites } from "../scripts/placement.mjs";
import { deriveSeed, mulberry32 } from "../scripts/random.mjs";

const OUTER = [0, 0, 100, 0, 100, 100, 0, 100];
const HOLE = [25, 25, 75, 25, 75, 75, 25, 75];
const CONTOURS = [OUTER, HOLE];

test("grid cell area uses the full box for squares and three quarters for hexes", () => {
  assert.equal(gridCellArea({ sizeX: 100, sizeY: 100, gridType: 1 }), 10000);
  assert.equal(gridCellArea({ sizeX: 100, sizeY: 100, gridType: 0 }), 10000);
  assert.equal(gridCellArea({ sizeX: 100, sizeY: 140, gridType: 4 }), 100 * 140 * 0.75);
});

test("even-odd rings keep the hole empty and the rim inside", () => {
  assert.equal(pointInRing(10, 10, OUTER), true);
  assert.equal(evenOddContains(10, 10, CONTOURS), true);
  assert.equal(evenOddContains(50, 50, CONTOURS), false);
  assert.equal(evenOddContains(200, 200, CONTOURS), false);
});

test("density follows region area and grid cells, and zero density places nothing", () => {
  assert.equal(desiredFlameCount(0, 10000, 40), 0);
  assert.equal(desiredFlameCount(50000, 10000, 0), 0);
  const small = desiredFlameCount(10000, 10000, 40);
  const large = desiredFlameCount(100000, 10000, 40);
  const dense = desiredFlameCount(100000, 10000, 100);
  assert.ok(large > small);
  assert.ok(dense > large);
});

test("ember amount scales with flames and is zero when disabled", () => {
  assert.equal(desiredEmberCount(0, 20), 0);
  assert.equal(desiredEmberCount(40, 0), 0);
  assert.ok(desiredEmberCount(40, 100) > desiredEmberCount(40, 20));
});

test("scene budget never exceeds the cap and keeps every region's share", () => {
  const allocated = allocateBudget([100, 50, 50], 100);
  assert.equal(allocated.reduce((sum, count) => sum + count, 0), 100);
  assert.deepEqual(allocated, [50, 25, 25]);
  assert.deepEqual(allocateBudget([3, 3], 10), [3, 3]);
  assert.deepEqual(allocateBudget([4, 1], 0), [0, 0]);
});

test("flame sites stay inside the region, avoid holes, and stay under the cap", () => {
  const sites = planFlameSites({
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    area: 7500,
    cellArea: 25,
    density: 100,
    seed: 42,
    maxFlames: 80,
    contains: (x, y) => evenOddContains(x, y, CONTOURS),
  });
  assert.ok(sites.length >= 10);
  assert.ok(sites.length <= 80);
  for (const site of sites) {
    assert.equal(evenOddContains(site.x, site.y, CONTOURS), true);
    assert.ok(site.x <= 25 || site.x >= 75 || site.y <= 25 || site.y >= 75);
  }
});

test("the same seed rebuilds the same sites, and another seed does not", () => {
  const options = {
    bounds: { x: 10, y: 20, width: 400, height: 250 },
    area: 400 * 250,
    cellArea: 2500,
    density: 60,
    seed: deriveSeed(["scene", "region", "behavior"]),
    maxFlames: 40,
    contains: () => true,
  };
  const first = planFlameSites(options);
  const second = planFlameSites(options);
  assert.deepEqual(first, second);
  const other = planFlameSites({ ...options, seed: options.seed + 1 });
  assert.notDeepEqual(first, other);
});

test("derived seeds are stable and mulberry32 stays in range", () => {
  assert.equal(deriveSeed(["a", "b", null]), deriveSeed(["a", "b", null]));
  assert.notEqual(deriveSeed(["a"]), deriveSeed(["b"]));
  const rng = mulberry32(1);
  for (let i = 0; i < 20; i += 1) {
    const value = rng();
    assert.ok(value >= 0 && value < 1);
  }
});
