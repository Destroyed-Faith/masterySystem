/**
 * One-shot GM migration: reconcile legacy Special-Effect ids/names to the
 * canonical post-reconciliation set.
 *
 *   bleeding   -> lacerate
 *   ignite     -> ruin
 *   freeze     -> slow
 *   poisoned   -> blight
 *   shock      -> disrupt      (removed effect, folded into Disrupt)
 *   blinded    -> disoriented  (removed effect, folded into Disoriented)
 *   frightened -> dread        (removed effect, folded into Dread)
 *
 * Rewrites, on every character/NPC actor (and its embedded items) plus all
 * world items:
 *   - system.statusEffects[].name / .id
 *   - system.specials[] (strings like "Bleeding(3)" or bare ids)
 *   - power specials[].key, chosenSpecial.key
 *   - mechanics.vsCondition, mechanics.condition, mechanics.conditionExpr
 *   - weapon / artifact `special` strings
 *
 * At runtime `getEffectById()` still resolves legacy ids via the alias map, so
 * un-migrated data keeps working; this migration simply normalises stored data.
 */
/** Legacy id (lowercase) -> canonical id. */
const ID_MAP = {
    bleeding: 'lacerate',
    ignite: 'ruin',
    freeze: 'slow',
    poisoned: 'blight',
    shock: 'disrupt',
    blinded: 'disoriented',
    frightened: 'dread',
};
/** Legacy display base name (lowercase) -> canonical display base name. */
const DISPLAY_MAP = {
    bleeding: 'Lacerate',
    ignite: 'Ruin',
    freeze: 'Slow',
    poisoned: 'Blight',
    shock: 'Disrupt',
    blinded: 'Disoriented',
    frightened: 'Dread',
};
/** Legacy mechanics.condition token -> canonical token. */
const CONDITION_TOKEN_MAP = {
    targetMarked: 'targetMark',
    targetIgnited: 'targetRuin',
    targetShocked: 'targetDisrupt',
    targetFrozen: 'targetSlow',
    targetHexed: 'targetHex',
};
let changedFlag = false;
/** Remap a bare special id (case-insensitive); returns canonical id or original. */
function remapId(value) {
    if (typeof value !== 'string')
        return value;
    const mapped = ID_MAP[value.toLowerCase()];
    if (mapped && mapped !== value) {
        changedFlag = true;
        return mapped;
    }
    return value;
}
/**
 * Remap a structured special string such as "Freeze", "Bleeding(3)" or
 * "Push(2), Freeze(2)". Only the effect base name is rewritten.
 */
function remapSpecialString(value) {
    if (typeof value !== 'string' || !value.trim())
        return value;
    let touched = false;
    const out = value
        .split(',')
        .map((part) => {
        const m = part.match(/^(\s*)([A-Za-z][A-Za-z '\-]*?)(\s*\(\s*\d+\s*\))?(\s*)$/);
        if (!m)
            return part;
        const [, lead, rawName, suffix = '', trail] = m;
        const mappedName = DISPLAY_MAP[rawName.trim().toLowerCase()];
        if (!mappedName)
            return part;
        touched = true;
        return `${lead}${mappedName}${suffix}${trail}`;
    })
        .join(',');
    if (touched)
        changedFlag = true;
    return touched ? out : value;
}
/** Remap a `conditionExpr` string (self.hasSpecial.<id>, target<Name>, …). */
function remapConditionExpr(value) {
    if (typeof value !== 'string')
        return value;
    let out = value;
    for (const [oldId, newId] of Object.entries(ID_MAP)) {
        out = out.replace(new RegExp(`hasSpecial\\.${oldId}\\b`, 'g'), `hasSpecial.${newId}`);
    }
    for (const [oldTok, newTok] of Object.entries(CONDITION_TOKEN_MAP)) {
        out = out.replace(new RegExp(`\\b${oldTok}\\b`, 'g'), newTok);
    }
    if (out !== value)
        changedFlag = true;
    return out;
}
/** Recursively rewrite a plain `system` object in place. */
function remapNode(node) {
    if (!node || typeof node !== 'object')
        return;
    if (Array.isArray(node)) {
        for (const el of node)
            remapNode(el);
        return;
    }
    for (const [key, value] of Object.entries(node)) {
        if (key === 'statusEffects' && Array.isArray(value)) {
            for (const eff of value) {
                if (eff && typeof eff === 'object') {
                    if (typeof eff.name === 'string') {
                        const mapped = DISPLAY_MAP[String(eff.name).trim().toLowerCase()];
                        if (mapped) {
                            eff.name = mapped;
                            changedFlag = true;
                        }
                    }
                    if (typeof eff.id === 'string')
                        eff.id = remapId(eff.id);
                }
            }
            continue;
        }
        if (key === 'specials' && Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const el = value[i];
                if (typeof el === 'string') {
                    value[i] = remapSpecialString(el);
                }
                else if (el && typeof el === 'object') {
                    if (typeof el.key === 'string')
                        el.key = remapId(el.key);
                    remapNode(el);
                }
            }
            continue;
        }
        if (typeof value === 'string') {
            if (key === 'special')
                node[key] = remapSpecialString(value);
            else if (key === 'key' || key === 'vsCondition')
                node[key] = remapId(value);
            else if (key === 'condition')
                node[key] = CONDITION_TOKEN_MAP[value] ?? value;
            else if (key === 'conditionExpr')
                node[key] = remapConditionExpr(value);
            continue;
        }
        remapNode(value);
    }
}
/** Migrate a single document's `system`; returns true when it changed. */
async function migrateDocument(doc) {
    const system = doc?.system;
    if (!system || typeof system !== 'object')
        return false;
    const clone = foundry.utils.duplicate(system);
    changedFlag = false;
    remapNode(clone);
    if (!changedFlag)
        return false;
    await doc.update({ system: clone });
    return true;
}
/**
 * Run the Special-Effect rename migration over the given actors (+ their items)
 * and all world items.
 */
export async function runSpecialEffectRenameMigration(actors) {
    if (!game.user?.isGM)
        return;
    let migrated = 0;
    for (const actor of actors || []) {
        try {
            if (await migrateDocument(actor))
                migrated += 1;
        }
        catch (err) {
            console.warn('Mastery System | Special rename: actor migration failed', actor?.name, err);
        }
        for (const item of Array.from(actor?.items || [])) {
            try {
                if (await migrateDocument(item))
                    migrated += 1;
            }
            catch (err) {
                console.warn('Mastery System | Special rename: actor item migration failed', item?.name, err);
            }
        }
    }
    for (const item of Array.from(game.items || [])) {
        try {
            if (await migrateDocument(item))
                migrated += 1;
        }
        catch (err) {
            console.warn('Mastery System | Special rename: world item migration failed', item?.name, err);
        }
    }
    if (migrated > 0) {
        console.log(`Mastery System | Special-Effect rename migration updated ${migrated} document(s).`);
    }
}
//# sourceMappingURL=special-effect-rename-migration.js.map