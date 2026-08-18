/**
 * Echo Catalog
 *
 * Central registry for all 7 playable Echos. Accessed by the character-creation
 * Echo picker, the sheet's Echo Deck block, and the Echo Roll handler.
 */
import { HUMANS_ECHO } from './humans.js';
import { DWARFS_ECHO } from './dwarfs.js';
import { ELORIANS_ECHO } from './elorians.js';
import { SENTINELS_ECHO } from './sentinels.js';
import { TITANBORN_ECHO } from './titanborn.js';
import { DRAGONBORN_ECHO } from './dragonborn.js';
import { UNBOUND_ECHO } from './unbound.js';
/** Display order in pickers (mirrors the Player\u2019s Guide). */
export const ECHO_KEY_ORDER = [
    'humans',
    'dwarfs',
    'elorians',
    'sentinels',
    'titanborn',
    'dragonborn',
    'unbound'
];
/** All Echos indexed by stable key. */
export const ALL_ECHOS = {
    humans: HUMANS_ECHO,
    dwarfs: DWARFS_ECHO,
    elorians: ELORIANS_ECHO,
    sentinels: SENTINELS_ECHO,
    titanborn: TITANBORN_ECHO,
    dragonborn: DRAGONBORN_ECHO,
    unbound: UNBOUND_ECHO
};
/** All Echos as an array, in canonical display order. */
export function getAllEchos() {
    return ECHO_KEY_ORDER.map(k => ALL_ECHOS[k]).filter(Boolean);
}
/** Lookup a single Echo by its key (legacy `elves` resolves to `elorians`). */
export function getEcho(key) {
    if (!key)
        return undefined;
    const resolved = key === 'elves' ? 'elorians' : key;
    return ALL_ECHOS[resolved];
}
/** Lookup a sub-choice on an Echo by key (lineage / order). */
export function getEchoSubChoice(echoKey, subChoiceKey) {
    const echo = getEcho(echoKey);
    if (!echo || !echo.subChoices || !subChoiceKey)
        return undefined;
    return echo.subChoices.find(sc => sc.key === subChoiceKey);
}
/** Lookup one card from an Echo's deck by card id. */
export function getEchoCard(echoKey, cardId) {
    const echo = getEcho(echoKey);
    if (!echo || !cardId)
        return undefined;
    return echo.deck.find(c => c.id === cardId);
}
/** Lookup a card option (I-IV) by ids. */
export function getCardOption(echoKey, cardId, optionId) {
    const card = getEchoCard(echoKey, cardId);
    if (!card || !optionId)
        return undefined;
    return card.options.find(o => o.id === optionId);
}
/**
 * Resolve all currently-active Core Traits for a character (core + active sub-choice).
 * Sub-choice trait is included only when the character has picked that sub-choice.
 */
export function getActiveEchoTraits(echoKey, subChoiceKey) {
    const echo = getEcho(echoKey);
    if (!echo)
        return [];
    const out = [...echo.coreTraits];
    if (echo.subChoices && subChoiceKey) {
        const sc = echo.subChoices.find(s => s.key === subChoiceKey);
        if (sc)
            out.push(sc.trait);
    }
    return out;
}
/**
 * Build a fresh `traitUses` record for a given Mastery Rank.
 * `mr-per-rest` traits get `masteryRank` uses; all others are not tracked.
 */
export function buildFreshTraitUses(echoKey, subChoiceKey, masteryRank) {
    const out = {};
    const traits = getActiveEchoTraits(echoKey, subChoiceKey);
    const mr = Math.max(1, Number(masteryRank) || 1);
    for (const t of traits) {
        if (isMrPerRest(t.usage)) {
            out[t.id] = mr;
        }
        else if (t.usage === 'once-per-rest' || t.usage === 'unlock-mr6-once') {
            out[t.id] = 1;
        }
    }
    return out;
}
/** Usage kinds that follow the \u201cMastery Rank per Safe Haven Rest\u201d pattern. */
export function isMrPerRest(usage) {
    return usage === 'mr-per-rest';
}
/** Mastery Rank that licenses each Echo Card slot (1-based order). */
export const ECHO_CARD_SLOT_UNLOCK_RANKS = [1, 4, 6];
/**
 * Number of Echo-Card slots unlocked at a given Mastery Rank.
 * Start: 1. Second card at MR 4, third at MR 6.
 */
export function getUnlockedCardSlots(masteryRank) {
    const mr = Math.max(1, Number(masteryRank) || 1);
    return ECHO_CARD_SLOT_UNLOCK_RANKS.filter(rank => mr >= rank).length;
}
function normalizeSelectedCardIds(selectedCardIds) {
    if (!Array.isArray(selectedCardIds))
        return [];
    return selectedCardIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
}
/**
 * Cards that currently have a licensed slot.
 * Extra cards (high-MR start, then a lower rank) stay on the actor until
 * the GM removes them — they are never auto-deleted.
 */
export function getLicensedEchoCardIds(selectedCardIds, masteryRank) {
    const slots = getUnlockedCardSlots(masteryRank);
    return normalizeSelectedCardIds(selectedCardIds).slice(0, slots);
}
export function isEchoCardLicensed(selectedCardIds, masteryRank, cardId) {
    const id = String(cardId || '').trim();
    if (!id)
        return false;
    return getLicensedEchoCardIds(selectedCardIds, masteryRank).includes(id);
}
/**
 * Drop one selected Echo Card and its daily-use flag.
 * Does not change Echo, traits, or other cards.
 */
export function removeSelectedEchoCard(selectedCardIds, cardUses, cardId) {
    const id = String(cardId || '').trim();
    const currentIds = Array.isArray(selectedCardIds)
        ? selectedCardIds.filter((value) => typeof value === 'string')
        : [];
    const currentUses = cardUses && typeof cardUses === 'object' ? { ...cardUses } : {};
    if (!id || !currentIds.includes(id)) {
        return { selectedCardIds: currentIds, cardUses: currentUses, removed: false };
    }
    delete currentUses[id];
    return {
        selectedCardIds: currentIds.filter(value => value !== id),
        cardUses: currentUses,
        removed: true
    };
}
/** True if a trait is currently gated off by Mastery Rank. */
export function isTraitGatedByMr(usage, masteryRank) {
    const mr = Math.max(1, Number(masteryRank) || 1);
    if (usage === 'unlock-mr3')
        return mr < 3;
    if (usage === 'unlock-mr6' || usage === 'unlock-mr6-once')
        return mr < 6;
    return false;
}
//# sourceMappingURL=index.js.map