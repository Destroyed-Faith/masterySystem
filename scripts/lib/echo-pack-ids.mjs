/**
 * Deterministic Foundry document ids for the Echo Artifacts pack.
 * Shared by `build-echo-artifact-pack.mjs`, `k9-pack-identity-audit.mjs` and
 * the K9 regression tests so pack ids can be re-derived from `nodeId` alone.
 */

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Deterministic 16-char alphanumeric Foundry id from any seed string. */
export function stableId(seed) {
  // FNV-1a → expand to 16 chars by re-hashing with a salt counter.
  let out = '';
  let counter = 0;
  while (out.length < 16) {
    let h = 0x811c9dc5;
    const s = `${seed}#${counter++}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    while (h > 0 && out.length < 16) {
      out += ALPHA[h % ALPHA.length];
      h = Math.floor(h / ALPHA.length);
    }
  }
  return out.slice(0, 16);
}

export const ECHO_PACK_ROOT_FOLDER_SEED = 'folder:echo-artifacts-root';
export const echoPackFolderId = (echoArtifactKey) => stableId(`folder:${echoArtifactKey}`);
export const echoPackItemId = (nodeId) => stableId(`item:${nodeId}`);
export const echoPackRootFolderId = () => stableId(ECHO_PACK_ROOT_FOLDER_SEED);
