import { isFoundryV14OrNewer } from '../utils/foundry-v14.js';

/**
 * Mastery System status effects registry.
 *
 * Registers the system's canonical conditions / specials as `CONFIG.statusEffects`,
 * replacing Foundry's core defaults (which include unrelated entries like
 * Ice/Fire/Magic/Holy Shield or Diseased that we do not model).
 *
 * Keys follow the lowercase canonical form established by `power-spec-normalize`
 * and the tree-power audit. Source of truth for the effect catalog is
 * `src/utils/special-effects.ts`; this file only adds UI registration metadata
 * (label, icon, statuses) for the Foundry token HUD radial.
 *
 * Synonym notes (for future normalization passes, not handled here):
 *   - `poison` / `poisoned` / `blight` -> canonical `blight`
 *   - `bleed` / `bleeding` / `lacerate` -> canonical `lacerate`
 *   - `entangle` / `entangled`       -> canonical `entangled`
 *   - `disorient` / `disoriented`    -> canonical `disoriented`
 * Data in `src/stones/stone-powers.ts` that still uses the short forms is
 * intentionally left unchanged here.
 */

/**
 * Shape aligned with Foundry v12/v13 `CONFIG.statusEffects` entries.
 * `statuses` drives the active-effect status id used by core systems.
 */
export interface MasteryStatusEffect {
  id: string;
  name: string;
  img: string;
  statuses?: string[];
}

/** Core `icons/svg/*` paths are not guaranteed; ship minimal SVGs with the system. */
const ICON = (name: string) => `systems/mastery-system/assets/icons/status/${name}.svg`;

/**
 * Single source of truth for the token HUD radial.
 * Keep ordered by gameplay category (debuffs first, then damage-over-time,
 * then buffs, then rider-style effects) for a predictable radial layout.
 */
export const MASTERY_STATUS_EFFECTS: MasteryStatusEffect[] = [
  { id: 'lacerate',     name: 'Lacerate',     img: ICON('blood') },
  { id: 'ruin',         name: 'Ruin',         img: ICON('fire') },
  { id: 'slow',         name: 'Slow',         img: ICON('frozen') },
  { id: 'disrupt',      name: 'Disrupt',      img: ICON('lightning-bolt') },
  { id: 'corrode',      name: 'Corrode',      img: ICON('acid') },
  { id: 'blight',       name: 'Blight',       img: ICON('poison') },
  { id: 'soulburn',     name: 'Soulburn',     img: ICON('aura') },

  { id: 'dread',        name: 'Dread',        img: ICON('terror') },
  { id: 'stunned',      name: 'Stunned',      img: ICON('daze') },
  { id: 'prone',        name: 'Prone',        img: ICON('falling') },
  { id: 'entangled',    name: 'Entangled',    img: ICON('net') },
  { id: 'grappled',     name: 'Grappled',     img: ICON('net') },
  { id: 'charmed',      name: 'Charmed',      img: ICON('ice-aura') },
  { id: 'disoriented',  name: 'Disoriented',  img: ICON('stoned') },

  { id: 'mark',         name: 'Mark',         img: ICON('target') },
  { id: 'expose',       name: 'Expose',       img: ICON('eye') },
  { id: 'weaken',       name: 'Weakened',     img: ICON('down') },
  { id: 'sundered',     name: 'Sundered',     img: ICON('sword-broken') },
  { id: 'hex',          name: 'Hex',          img: ICON('hazard') },
  { id: 'root',         name: 'Root',         img: ICON('net') },
  { id: 'curse',        name: 'Cursed',       img: ICON('skull') },
  { id: 'suppress',     name: 'Suppressed',   img: ICON('silenced') },

  { id: 'regeneration', name: 'Regeneration', img: ICON('regen') },
  { id: 'cleanse',      name: 'Cleansed',     img: ICON('light') },
  { id: 'advantage',    name: 'Advantage',    img: ICON('up') },

  { id: 'crit',         name: 'Crit',         img: ICON('explosion') },
  { id: 'penetration',  name: 'Penetration',  img: ICON('sword') },
  { id: 'smite',        name: 'Smite',        img: ICON('holy-shield') },
  { id: 'knockback',    name: 'Knockback',    img: ICON('direction') },
  { id: 'pull',         name: 'Pull',         img: ICON('pawprint') },
  { id: 'push',         name: 'Push',         img: ICON('direction') },
  { id: 'autofire',     name: 'Autofire',     img: ICON('arrow-thin') },
];

/**
 * Build the array passed to `CONFIG.statusEffects`. Ensures every entry has a
 * matching `statuses` array so Foundry's `statuses` set lookups work both ways.
 */
export function buildMasteryStatusEffects(): Required<MasteryStatusEffect>[] {
  return MASTERY_STATUS_EFFECTS.map(e => ({
    id: e.id,
    name: e.name,
    img: e.img,
    statuses: e.statuses && e.statuses.length > 0 ? e.statuses : [e.id],
  }));
}

/**
 * Register mastery conditions on `CONFIG.statusEffects`.
 * Foundry v12/v13 use an array; v14+ uses a record keyed by effect id.
 */
export function applyMasteryStatusEffects(): void {
  const effects = buildMasteryStatusEffects();

  // v14 exposes array-like backwards compat on read, but assigning an array
  // hits a setter that calls .push on the underlying record — mutate in place.
  if (isFoundryV14OrNewer()) {
    const store = (CONFIG as any).statusEffects as Record<string, unknown>;
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    let order = 0;
    for (const e of effects) {
      // v14 StatusEffectConfig has no `statuses` array — assigning one hits a
      // Set-backed setter and throws `statuses.push is not a function`.
      store[e.id] = {
        id: e.id,
        name: e.name,
        img: e.img,
        order: order++,
      };
    }
    return;
  }

  (CONFIG as any).statusEffects = effects;
}
