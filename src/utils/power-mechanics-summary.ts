/**
 * Power-mechanics summarizer — turns a `PowerMechanics` block into a short
 * human-readable string for UI tooltips (e.g. Combat Carousel status icons).
 *
 * The output is deliberately compact: 1–2 concatenated segments joined by
 * " \u00b7 " (` · `). Zero / empty fields are skipped. When nothing
 * meaningful is present the function returns `''` so callers can fall back
 * to just the power name.
 *
 * Example outputs:
 *   "+4 Armor \u00b7 +20% DR"
 *   "+2d8 Attack vs Hexed"
 *   "Regen 10 HP/turn \u00b7 +1 Movement"
 *   "Temp HP 1d8 \u00b7 Heal 2d8"
 */
import type {
    PowerMechanics,
    PowerMechanicsHealing,
} from '../types/item.js';

const DOT = ' \u00b7 ';

/** Format a signed integer as `+N` / `N` (negative already has sign). */
function fmtSigned(n: number): string {
    if (!Number.isFinite(n) || n === 0) return '';
    return n > 0 ? `+${n}` : String(n);
}

/** Format a dice-or-flat string (e.g. "1d8", "3", "2d6+1"). Empty → ''. */
function fmtDiceOrFlat(raw: unknown): string {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';
    // Plain numeric zero → drop; everything else kept verbatim.
    if (/^-?0+$/.test(s)) return '';
    return s;
}

function fmtHealing(h: PowerMechanicsHealing | undefined): string {
    if (!h) return '';
    const parts: string[] = [];
    const flat = fmtDiceOrFlat(h.flat);
    if (flat) parts.push(`Heal ${flat}`);
    return parts.join(DOT);
}

function conditionLabel(mech: PowerMechanics): string {
    const cond = mech.condition;
    if (cond) {
        const map: Record<string, string> = {
            targetMarked: 'vs Marked',
            targetIgnited: 'vs Ignited',
            targetShocked: 'vs Shocked',
            targetFrozen: 'vs Frozen',
            targetHexed: 'vs Hexed',
            'self-hp-below-50': 'wenn HP <= 50%',
        };
        return map[cond] ?? `vs ${cond}`;
    }
    const expr = (mech as any).conditionExpr;
    if (typeof expr === 'string' && expr.trim()) {
        // Keep it short; truncate overly long expressions.
        const trimmed = expr.trim();
        return trimmed.length > 40 ? `if ${trimmed.slice(0, 37)}\u2026` : `if ${trimmed}`;
    }
    return '';
}

/**
 * Produce a compact summary string for a mechanics block. Returns `''` if
 * the block has no summarizable fields (so callers can skip the extra
 * tooltip line).
 */
export function summarizePowerMechanics(mech: PowerMechanics | null | undefined): string {
    if (!mech) return '';
    const parts: string[] = [];

    const push = (s: string) => {
        if (s && s.trim()) parts.push(s.trim());
    };

    // Flat combat bonuses
    const armor = fmtSigned(mech.armor ?? 0);
    if (armor) push(`${armor} Armor`);
    const evade = fmtSigned(mech.evade ?? 0);
    if (evade) push(`${evade} Evade`);
    const ini = fmtSigned(mech.initiativeD8 ?? 0);
    if (ini) push(`${ini} Init d8`);

    // Percentage DR
    const dr = fmtSigned(mech.damageReductionPct ?? 0);
    if (dr) push(`${dr}% DR`);

    // Regen / movement
    if (typeof mech.regen === 'number' && mech.regen !== 0) {
        const sign = mech.regen > 0 ? '' : '';
        push(`Regen ${sign}${mech.regen} HP/turn`);
    }
    const spellRes = fmtSigned(mech.spellResistance ?? 0);
    if (spellRes) push(`${spellRes} Spell Resistance`);
    if (typeof mech.cleanseMaintenance === 'number' && mech.cleanseMaintenance > 0) {
        push(`Cleanse(${mech.cleanseMaintenance}) / turn`);
    }
    const move = fmtSigned(mech.movementBonus ?? 0);
    if (move) push(`${move} Movement`);
    if (mech.ignoreTerrain) push('Ignore Terrain');

    // Temp HP
    const tempHp = fmtDiceOrFlat(mech.tempHP);
    if (tempHp) push(`Temp HP ${tempHp}`);

    // Healing
    const heal = fmtHealing(mech.healing);
    if (heal) push(heal);

    // Roll / save dice bonuses
    if (mech.rollDice) {
        const rd = mech.rollDice;
        const at = fmtSigned(rd.attack ?? 0);
        if (at) push(`${at}d8 Attack`);
        const sk = fmtSigned(rd.skill ?? 0);
        if (sk) push(`${sk}d8 Skill`);
        const dm = fmtSigned(rd.damage ?? 0);
        if (dm) push(`${dm}d8 Damage`);
    }
    if (mech.saveDice) {
        const sd = mech.saveDice;
        const b = fmtSigned(sd.body ?? 0);
        if (b) push(`${b}d8 Body-Save`);
        const m = fmtSigned(sd.mind ?? 0);
        if (m) push(`${m}d8 Mind-Save`);
        const sp = fmtSigned(sd.spirit ?? 0);
        if (sp) push(`${sp}d8 Spirit-Save`);
    }

    // Damage rider
    if (mech.damageRider) {
        const dr2 = mech.damageRider;
        const flat = fmtDiceOrFlat(dr2.flat);
        if (flat) push(`${flat} Damage rider`);
        const cond = dr2.vsCondition;
        const vsDmg = fmtDiceOrFlat(dr2.vsConditionDamage);
        if (cond && vsDmg) push(`${vsDmg} vs ${cond}`);
    }

    // Phasing (closed subsystem)
    if (mech.phasing) {
        const p = mech.phasing;
        if (p.combatStart?.charges) push(`Phasing \u00d7${p.combatStart.charges} @combat-start`);
        if (p.augment?.addCharges) push(`+${p.augment.addCharges} Phasing charge`);
        if (p.reactionSingleHit) push('Phase 1 Hit');
    }

    // modifySpecial (affects an existing special on a creature)
    if (mech.modifySpecial) {
        const ms = mech.modifySpecial;
        const verb =
            ms.mode === 'increaseExisting' ? '+' :
                ms.mode === 'decreaseExisting' ? '-' :
                    ms.mode === 'setIfHigher' ? '>=' :
                        ms.mode === 'consume' ? 'consume' :
                            ms.mode === 'remove' ? 'remove' :
                                ms.mode === 'refreshDuration' ? 'refresh' : ms.mode;
        const amt = typeof ms.amount === 'number' ? ms.amount : '';
        push(`${verb}${amt} ${ms.type}`.trim());
    }

    // grantNextHitEffect
    if (mech.grantNextHitEffect) {
        const g = mech.grantNextHitEffect;
        const rider = fmtDiceOrFlat(g.damageRiderFlat);
        if (rider) push(`Next hit: ${rider}`);
        else if (g.specials?.length) push(`Next hit: +special`);
    }

    // Triggers (high-signal ones only — tempHP on combat-start / turn-start)
    if (mech.triggers) {
        const t = mech.triggers;
        const cs = t.combatStart?.tempHP;
        if (cs) push(`@combat-start: Temp HP ${cs}`);
        const ts = t.turnStartSelf?.tempHP;
        if (ts) push(`@turn-start: Temp HP ${ts}`);
        const pc = t.combatStart?.phasingCharges;
        if (pc) push(`@combat-start: ${pc} Phasing charge${pc === 1 ? '' : 's'}`);
    }

    // Condition gate suffix
    const cond = conditionLabel(mech);
    if (cond && parts.length > 0) push(cond);

    return parts.join(DOT);
}
