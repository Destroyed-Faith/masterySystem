/**
 * Active Power Templates (~46)
 *
 * Source: d:\DestroyedFaith\Powers\Actives.md — Levels 1..16.
 *
 * Categories encoded via subfamily:
 *   damage-single, damage-aoe, persistent-zone, control, support-heal,
 *   support-cleanse, support-dispel, mixed, barrier, hard-control
 *
 * Damage templates (singleg-target + aoe, per tier T3/T4/T5/T6 in melee &
 * ranged flavours) carry a `specialSlot`. The catalog expands each such
 * template into one entry per eligible Special (see _specials.ts and
 * power-catalog.ts buildEntries()).
 *
 * `spellHints` pre-fills Active-as-Spell resolution defaults. Saving throws
 * were removed from the rules — every spell resolves as `spellAttack`
 * (caster roll vs Casting TN / Evade); a successful cast resolves its full
 * listed payload.
 */
import type { PowerTemplate } from './_shared.js';
export declare const ACTIVE_TEMPLATES: PowerTemplate[];
//# sourceMappingURL=actives.d.ts.map