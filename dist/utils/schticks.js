/**
 * Schticks configuration for Mastery System
 * Schticks are small character traits/quirks chosen during character creation
 */
export const SCHTICKS = [
    {
        id: 'quick-reflexes',
        name: 'Quick Reflexes',
        short: 'You react faster than most. Gain +1k0 on initiative rolls.',
        relatedAttribute: 'Agility'
    },
    {
        id: 'iron-will',
        name: 'Iron Will',
        short: 'Your mental fortitude is unshakeable. Gain +1k0 on Resolve checks against fear and mental effects.',
        relatedAttribute: 'Resolve'
    },
    {
        id: 'keen-eye',
        name: 'Keen Eye',
        short: 'You notice details others miss. Gain +1k0 on Perception and Investigation checks.',
        relatedAttribute: 'Wits'
    },
    {
        id: 'natural-leader',
        name: 'Natural Leader',
        short: 'People naturally follow your lead. Gain +1k0 on Influence checks when rallying or commanding others.',
        relatedAttribute: 'Influence'
    },
    {
        id: 'bookworm',
        name: 'Bookworm',
        short: 'Your extensive reading gives you an edge. Gain +1k0 on knowledge-based Intellect checks.',
        relatedAttribute: 'Intellect'
    },
    {
        id: 'tough-as-nails',
        name: 'Tough as Nails',
        short: 'You can take more punishment. Gain +1 to your Vitality attribute for the purposes of calculating Health.',
        relatedAttribute: 'Vitality'
    },
    {
        id: 'brawler',
        name: 'Brawler',
        short: 'You excel in close combat. Gain +1k0 on unarmed attack rolls.',
        relatedAttribute: 'Might'
    },
    {
        id: 'lucky',
        name: 'Lucky',
        short: 'Fortune favors you. Once per session, you may reroll any single die roll.',
        tags: ['utility']
    },
    {
        id: 'fast-healer',
        name: 'Fast Healer',
        short: 'Your wounds mend quickly. Reduce recovery time by half.',
        relatedAttribute: 'Vitality'
    },
    {
        id: 'silver-tongue',
        name: 'Silver Tongue',
        short: 'You are exceptionally persuasive. Gain +1k0 on social Influence checks.',
        relatedAttribute: 'Influence'
    }
];
/**
 * Get all schticks
 */
export function getAllSchticks() {
    return SCHTICKS;
}
/**
 * Get schtick by ID
 */
export function getSchtick(id) {
    return SCHTICKS.find(s => s.id === id);
}
/**
 * Get schticks by attribute affinity
 */
export function getSchticksByAttribute(attribute) {
    return SCHTICKS.filter(s => s.relatedAttribute === attribute);
}
//# sourceMappingURL=schticks.js.map