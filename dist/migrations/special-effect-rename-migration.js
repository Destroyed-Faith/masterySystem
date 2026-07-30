/**
 * One-shot GM migration: reconcile legacy Special-Effect ids/names to the
 * canonical post-reconciliation set.
 *
 *   bleeding   -> lacerate
 *   ignite     -> ruin
 *   freeze     -> slow
 *   poisoned   -> blight
 *   blinded    -> disoriented
 *   shock      -> disoriented   (removed Special; closest live sensor pressure)
 *   disrupt    -> challenge     (removed Special; Start PP 6 replacement)
 *   dread      -> (deleted)     (removed Special — no live replacement)
 *   frightened -> (deleted)
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
    shock: 'disoriented',
    disrupt: 'challenge',
    disrupted: 'challenge',
    blinded: 'disoriented',
};
/** Ids that are deleted with no live replacement. */
const DELETE_IDS = new Set(['dread', 'frightened']);
/** Legacy display base name (lowercase) -> canonical display base name. */
const DISPLAY_MAP = {
    bleeding: 'Lacerate',
    ignite: 'Ruin',
    freeze: 'Slow',
    poisoned: 'Blight',
    shock: 'Disoriented',
    disrupt: 'Challenge',
    disrupted: 'Challenge',
    blinded: 'Disoriented',
};
/** Legacy mechanics.condition token -> canonical token. */
const CONDITION_TOKEN_MAP = {
    targetMarked: 'targetMark',
    targetIgnited: 'targetRuin',
    targetShocked: 'targetChallenge',
    targetDisrupt: 'targetChallenge',
    targetFrozen: 'targetSlow',
    targetHexed: 'targetHex',
};
let changedFlag = false;
/** Remap a bare special id (case-insensitive); returns canonical id or original. */
function remapId(value) {
    if (typeof value !== 'string')
        return value;
    const lower = value.toLowerCase();
    if (DELETE_IDS.has(lower)) {
        changedFlag = true;
        return '';
    }
    const mapped = ID_MAP[lower];
    if (mapped && mapped !== value) {
        changedFlag = true;
        return mapped;
    }
    return value;
}
/**
 * Remap a structured special string such as "Freeze", "Bleeding(3)" or
 * "Push(2), Freeze(2)". Only the effect base name is rewritten.
 * Entries whose base name is a deleted Special are dropped.
 */
function remapSpecialString(value) {
    if (typeof value !== 'string' || !value.trim())
        return value;
    let touched = false;
    const parts = value.split(',').map((part) => {
        const m = part.match(/^(\s*)([A-Za-z][A-Za-z '\-]*?)(\s*\(\s*\d+\s*\))?(\s*)$/);
        if (!m)
            return part;
        const [, lead, rawName, suffix = '', trail] = m;
        const key = rawName.trim().toLowerCase();
        if (DELETE_IDS.has(key)) {
            touched = true;
            return null;
        }
        const mappedName = DISPLAY_MAP[key];
        if (!mappedName)
            return part;
        touched = true;
        return `${lead}${mappedName}${suffix}${trail}`;
    });
    if (!touched)
        return value;
    changedFlag = true;
    return parts.filter((p) => p !== null && String(p).trim()).join(',');
}
/** Remap a `conditionExpr` string (self.hasSpecial.<id>, target<Name>, …). */
function remapConditionExpr(value) {
    if (typeof value !== 'string')
        return value;
    let out = value;
    for (const [oldId, newId] of Object.entries(ID_MAP)) {
        out = out.replace(new RegExp(`hasSpecial\\.${oldId}\\b`, 'g'), `hasSpecial.${newId}`);
    }
    for (const del of DELETE_IDS) {
        out = out.replace(new RegExp(`hasSpecial\\.${del}\\b`, 'g'), 'hasSpecial.__removed__');
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
            const kept = [];
            for (const eff of value) {
                if (!eff || typeof eff !== 'object')
                    continue;
                if (typeof eff.name === 'string') {
                    const nameKey = String(eff.name).trim().toLowerCase();
                    if (DELETE_IDS.has(nameKey)) {
                        changedFlag = true;
                        continue;
                    }
                    const mapped = DISPLAY_MAP[nameKey];
                    if (mapped) {
                        eff.name = mapped;
                        changedFlag = true;
                    }
                }
                if (typeof eff.id === 'string') {
                    const idKey = String(eff.id).toLowerCase();
                    if (DELETE_IDS.has(idKey)) {
                        changedFlag = true;
                        continue;
                    }
                    eff.id = remapId(eff.id);
                }
                kept.push(eff);
            }
            node.statusEffects = kept;
            continue;
        }
        if (key === 'specials' && Array.isArray(value)) {
            const kept = [];
            for (const el of value) {
                if (typeof el === 'string') {
                    const mapped = remapSpecialString(el);
                    if (mapped === '' || mapped === null)
                        continue;
                    kept.push(mapped);
                }
                else if (el && typeof el === 'object') {
                    if (typeof el.key === 'string') {
                        const mapped = remapId(el.key);
                        if (mapped === '')
                            continue;
                        el.key = mapped;
                    }
                    remapNode(el);
                    kept.push(el);
                }
                else {
                    kept.push(el);
                }
            }
            node.specials = kept;
            continue;
        }
        if (typeof value === 'string') {
            if (key === 'special')
                node[key] = remapSpecialString(value);
            else if (key === 'key' || key === 'vsCondition') {
                const mapped = remapId(value);
                node[key] = mapped === '' ? value : mapped;
                if (value === 'disrupt')
                    node[key] = 'challenge';
            }
            else if (key === 'condition')
                node[key] = CONDITION_TOKEN_MAP[value] ?? value;
            else if (key === 'conditionExpr')
                node[key] = remapConditionExpr(value);
            else if (key === 'spellResolution' && value === 'saveSpell') {
                node[key] = 'spellAttack';
                changedFlag = true;
            }
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
    // Strip obsolete save fields from actors.
    if ('savingThrows' in clone) {
        delete clone.savingThrows;
        changedFlag = true;
    }
    if (clone.manual?.rolls?.save) {
        delete clone.manual.rolls.save;
        changedFlag = true;
    }
    if (Array.isArray(clone.phases)) {
        for (const phase of clone.phases) {
            if (phase && typeof phase === 'object' && 'savingThrows' in phase) {
                delete phase.savingThrows;
                changedFlag = true;
            }
        }
    }
    if ('spellSaveType' in clone) {
        delete clone.spellSaveType;
        changedFlag = true;
    }
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