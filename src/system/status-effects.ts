import { specialTokenIcon } from '../ui/special-token-assets.js';
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
  /**
   * When false, Foundry's Token HUD palette hides this entry.
   * Combat / Powers may still resolve the id. Default true.
   */
  hud?: boolean;
}

/** Core `icons/svg/*` paths are not guaranteed; ship minimal SVGs with the system. */
const ICON = (name: string) => `systems/mastery-system/assets/icons/status/${name}.svg`;

/** Effect-token art when we have it; otherwise the simple status SVG. */
const STATUS_IMG = (id: string, fallback: string) => specialTokenIcon(id) ?? ICON(fallback);

/**
 * Ongoing Specials a GM may newly pick in the Status dialog / Token HUD.
 * Authoritative list matches DF Core Special Effects Reference (persistent).
 */
export const SELECTABLE_STATUS_IDS: readonly string[] = [
  'blight',
  'brace',
  'bulwark',
  'challenge',
  'corrode',
  'disoriented',
  'expose',
  'grappled',
  'hex',
  'immovable',
  'lacerate',
  'mark',
  'prone',
  'root',
  'ruin',
  'slow',
  'soulburn',
  'sundered',
  'weaken',
];

/**
 * System-managed statuses that stay writable and keep token icons, but are not
 * offered as generic "add Special" choices (instant / derived / Passive / Crit).
 */
export const SYSTEM_MANAGED_STATUS_IDS: readonly string[] = [
  'stunned',
  'surprise',
  'regeneration',
  'crit',
  /** Fiend / Deathless power Specials — applied by Powers, not the generic picker. */
  'exorcism',
  'requiem',
];

const SELECTABLE_SET = new Set(SELECTABLE_STATUS_IDS);
const SYSTEM_MANAGED_SET = new Set(SYSTEM_MANAGED_STATUS_IDS);

export function isSelectableStatusId(id: string | null | undefined): boolean {
  return SELECTABLE_SET.has(String(id || '').trim().toLowerCase());
}

/** Writable via setActorCatalogStatus / token icon sync (selectable + system-managed). */
export function isSystemStatusId(id: string | null | undefined): boolean {
  const key = String(id || '').trim().toLowerCase();
  return SELECTABLE_SET.has(key) || SYSTEM_MANAGED_SET.has(key);
}

/**
 * Token HUD / CONFIG registry.
 * Selectable Specials appear in the palette. System-managed and Invisible stay
 * registered for icons with `hud: false`. Retired names (Charmed, Cursed, …)
 * are intentionally omitted so they cannot be newly selected; stored Actor
 * records with those ids are left untouched.
 */
export const MASTERY_STATUS_EFFECTS: MasteryStatusEffect[] = [
  { id: 'blight', name: 'Blight', img: STATUS_IMG('blight', 'poison') },
  { id: 'brace', name: 'Brace', img: ICON('falling') },
  { id: 'bulwark', name: 'Bulwark', img: ICON('holy-shield') },
  { id: 'challenge', name: 'Challenge', img: STATUS_IMG('challenge', 'challenge') },
  { id: 'corrode', name: 'Corrode', img: STATUS_IMG('corrode', 'acid') },
  { id: 'disoriented', name: 'Disoriented', img: ICON('stoned') },
  { id: 'expose', name: 'Expose', img: STATUS_IMG('expose', 'eye') },
  { id: 'grappled', name: 'Grappled', img: ICON('net') },
  { id: 'hex', name: 'Hex', img: STATUS_IMG('hex', 'hazard') },
  { id: 'immovable', name: 'Immovable', img: ICON('direction') },
  { id: 'lacerate', name: 'Lacerate', img: ICON('blood') },
  { id: 'mark', name: 'Mark', img: STATUS_IMG('mark', 'target') },
  { id: 'prone', name: 'Prone', img: ICON('falling') },
  { id: 'root', name: 'Root', img: STATUS_IMG('root', 'net') },
  { id: 'ruin', name: 'Ruin', img: STATUS_IMG('ruin', 'fire') },
  { id: 'slow', name: 'Slow', img: STATUS_IMG('slow', 'frozen') },
  { id: 'soulburn', name: 'Soulburn', img: ICON('aura') },
  { id: 'sundered', name: 'Sundered', img: STATUS_IMG('sundered', 'sword-broken') },
  { id: 'weaken', name: 'Weakened', img: ICON('down') },

  { id: 'stunned', name: 'Stunned', img: ICON('daze'), hud: false },
  { id: 'surprise', name: 'Surprise', img: ICON('terror'), hud: false },
  { id: 'regeneration', name: 'Regeneration', img: ICON('regen'), hud: false },
  { id: 'crit', name: 'Crit', img: ICON('explosion'), hud: false },
  { id: 'exorcism', name: 'Exorcism', img: ICON('holy-shield'), hud: false },
  { id: 'requiem', name: 'Requiem', img: ICON('skull'), hud: false },

  /** Presentation for live Passive/Buff Invisibility (not a cleansable Special). */
  { id: 'invisible', name: 'Invisible', img: ICON('invisible'), hud: false },
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
    hud: e.hud !== false,
  }));
}

function upsertV14StatusEffect(
  store: Record<string, any>,
  effect: MasteryStatusEffect,
  order: number,
): boolean {
  const showHud = effect.hud !== false;
  const existing = store[effect.id];
  if (existing && typeof existing === 'object') {
    existing.id = effect.id;
    existing.name = effect.name;
    existing.img = effect.img;
    existing.order = order;
    existing.hud = showHud;
    try {
      existing.statuses = new Set([effect.id]);
    } catch {
      // v14 config objects sometimes freeze `statuses`; id alone is enough.
    }
    return true;
  }

  const attempts: Record<string, unknown>[] = [
    { id: effect.id, name: effect.name, img: effect.img, order, hud: showHud, statuses: new Set([effect.id]) },
    { id: effect.id, name: effect.name, img: effect.img, order, hud: showHud, statuses: [effect.id] },
    { id: effect.id, name: effect.name, img: effect.img, order, hud: showHud },
  ];

  for (const data of attempts) {
    try {
      store[effect.id] = data;
      return true;
    } catch {
      // try next shape
    }
  }

  try {
    store[effect.id] = { id: effect.id };
    const cfg = store[effect.id];
    if (!cfg) return false;
    cfg.name = effect.name;
    cfg.img = effect.img;
    cfg.order = order;
    cfg.hud = showHud;
    return true;
  } catch {
    return false;
  }
}

function applyMasteryStatusEffectsAsRecord(store: Record<string, any>): void {
  const keepIds = new Set(MASTERY_STATUS_EFFECTS.map(e => e.id));
  let order = 0;

  for (const effect of MASTERY_STATUS_EFFECTS) {
    if (!upsertV14StatusEffect(store, effect, order++)) {
      console.warn(`Mastery System | Could not register status effect "${effect.id}" on v14`);
    }
  }

  for (const key of Object.keys(store)) {
    if (!keepIds.has(key)) delete store[key];
  }
}

/**
 * Mastery Invisibility is soft ghosting (token alpha) + perception gates.
 * Foundry's special INVISIBLE status hides the token from other clients and
 * makes allies unable to target for Heal etc. — never wire that up.
 */
export function disableFoundryInvisibleTokenHide(): void {
  try {
    const special = (CONFIG as any).specialStatusEffects;
    if (!special || typeof special !== 'object') return;
    // Empty id → actor.statuses.has('') is always false.
    special.INVISIBLE = '';
  } catch (err) {
    console.warn('Mastery System | could not clear CONFIG.specialStatusEffects.INVISIBLE', err);
  }
}

/**
 * Register mastery conditions on `CONFIG.statusEffects`.
 * Foundry v12/v13 use an array; v14+ uses a record keyed by effect id.
 */
export function applyMasteryStatusEffects(): void {
  if (isFoundryV14OrNewer()) {
    applyMasteryStatusEffectsAsRecord((CONFIG as any).statusEffects);
  } else {
    (CONFIG as any).statusEffects = buildMasteryStatusEffects();
  }
  disableFoundryInvisibleTokenHide();
}
