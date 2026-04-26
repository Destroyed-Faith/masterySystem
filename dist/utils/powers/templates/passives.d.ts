/**
 * Passive Power Templates.
 *
 * Canonical source: `docs/passives.md` (Passive Design Rules + Catalog).
 *
 * Structure:
 *   - Base unconditional passives (one axis per template): Armor, Damage
 *     Reduction, Evade, Temporary HP, Healing, Phasing, Damage, Health,
 *     Awareness.
 *   - Conditional passives (one axis, gated on a combat condition): Armor
 *     (Stone Stance / Surrounded Bulwark), Evade (Flowing Step / Duelist
 *     Footwork), Damage (Momentum / Ambusher / Bloodlust / Executioner),
 *     Healing (Blood Feast / Battle Trance / Stillness Recovery).
 *   - Combined passives (two axes, unconditional): 12 entries per spec.
 *   - Conditional Combined passives (two axes, gated): 12 entries per spec.
 *   - Passive Special Aura: fixed +1 step on a chosen eligible Special(X),
 *     radius scales with level.
 *
 * Structural axes without a dedicated mechanics key (extra Health Bars and
 * Combat Senses) are encoded as narrative `effect.text`; the aggregator
 * falls back to descriptive behaviour for rows without a mechanical delta.
 */
import type { PowerTemplate } from './_shared.js';
export declare const PASSIVE_TEMPLATES: PowerTemplate[];
//# sourceMappingURL=passives.d.ts.map