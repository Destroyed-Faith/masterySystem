import { assetRoot, LOG_PREFIX } from "./constants.mjs";

let loading = null;
let library = null;

/**
 * Load the sprite manifest and every PNG once. Textures are shared by all regions.
 * Individual stills are used. The atlas is shipped but not decoded at runtime.
 */
export function loadFireAssets() {
  if (library) return Promise.resolve(library);
  if (!loading) {
    loading = loadLibrary().catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export function getFireAssets() {
  return library;
}

async function loadLibrary() {
  const manifestUrl = `${assetRoot()}/sprite_manifest.json`;
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`${LOG_PREFIX} sprite_manifest.json could not be loaded (${response.status}).`);
  }
  const manifest = await response.json();
  const flames = { large: [], medium: [], small: [] };
  const embers = [];

  for (const entry of manifest.flames ?? []) {
    const group = flames[entry.group];
    if (!group) continue;
    const texture = await loadEntryTexture(entry);
    if (texture) group.push({ texture, pivot: pivotOf(entry), size: Number(entry.size) || 256 });
  }
  for (const entry of manifest.embers ?? []) {
    const texture = await loadEntryTexture(entry);
    if (texture) embers.push({ texture, pivot: pivotOf(entry), size: Number(entry.size) || 128 });
  }

  const flameCount = flames.large.length + flames.medium.length + flames.small.length;
  if (!flameCount) {
    throw new Error(`${LOG_PREFIX} no flame textures loaded. Natural Fire was not started.`);
  }
  if (!embers.length) {
    console.warn(`${LOG_PREFIX} no ember textures loaded. Flames will render without sparks.`);
  }

  library = { flames, embers };
  return library;
}

async function loadEntryTexture(entry) {
  const src = `${assetRoot()}/${entry.file}`;
  try {
    const texture = await loadTexture(src);
    if (!texture) {
      console.warn(`${LOG_PREFIX} texture missing, skipped: ${src}`);
      return null;
    }
    return texture;
  } catch (error) {
    console.warn(`${LOG_PREFIX} texture failed, skipped: ${src}`, error);
    return null;
  }
}

async function loadTexture(src) {
  const foundryLoader = globalThis.foundry?.canvas?.loadTexture;
  if (typeof foundryLoader === "function") return foundryLoader(src);
  const assets = globalThis.PIXI?.Assets;
  if (typeof assets?.load === "function") return assets.load(src);
  throw new Error("Foundry texture loader is not available.");
}

function pivotOf(entry) {
  const pivot = entry.pivot;
  const x = Number(pivot?.[0]);
  const y = Number(pivot?.[1]);
  return {
    x: Number.isFinite(x) ? x : 0.5,
    y: Number.isFinite(y) ? y : 0.93,
  };
}
