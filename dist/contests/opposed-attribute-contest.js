/**
 * Opposed Attribute Contest — the one resolver behind non-combat contests
 * (arm wrestling, an argument, a test of will) and combat Grapple.
 *
 * Both sides roll an Attribute Pool (attribute dice, keep Mastery Rank) with
 * the normal `masteryRoll` engine. No Skill, no Skill Points, no TN, no
 * Raises: the two Final Results are compared directly. Higher wins; a tie
 * leaves the situation unchanged. Workflows differ only in how the contest
 * is started and what happens with the outcome — never in the dice math.
 */
export const CONTEST_ATTRIBUTES = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
/** Grapple and other physical struggles: Might or Agility. */
export const PHYSICAL_CONTEST_ATTRIBUTES = ['might', 'agility'];
export function isContestAttributeKey(value) {
    return typeof value === 'string' && CONTEST_ATTRIBUTES.includes(value);
}
export function contestAttributeLabel(key) {
    const k = String(key || '');
    return k ? k.charAt(0).toUpperCase() + k.slice(1) : '';
}
/** Attribute dice on the sheet (`value`, falling back to `stones`). */
export function contestAttributeDice(actor, attributeKey) {
    const attr = actor?.system?.attributes?.[String(attributeKey).toLowerCase()] ?? {};
    const value = Number(attr.value ?? attr.stones ?? 0);
    return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}
export function contestKeepDice(actor) {
    const rank = Math.floor(Number(actor?.system?.mastery?.rank) || 0);
    return Math.max(1, Math.min(16, rank || 2));
}
/**
 * Roll options for one contest side. Attribute dice, keep Mastery Rank,
 * Pool & Keep with the normal pool-reduction stages. Deliberately no
 * `skillKey`, no `isSkillRoll`, no TN and no Raises, and `rollKind`
 * `'contest'` — identifiable in hooks and logs, and outside the attack /
 * skill dice-delta paths of the mechanics engine.
 */
export function buildContestRollOptions(actor, attributeKey, input) {
    const numDice = contestAttributeDice(actor, attributeKey);
    const keepDice = contestKeepDice(actor);
    const attrLabel = contestAttributeLabel(attributeKey);
    const baseFlavor = input.flavor ?? `Opposed Attribute Contest — ${attrLabel} ${numDice}d8, keep ${keepDice} (MR). No TN, no Raises, no Skill Points.`;
    return {
        numDice,
        keepDice,
        skill: 0,
        tn: 0,
        normalTn: 0,
        raiseTn: 0,
        declaredRaiseSlots: 0,
        stoneBonusRaises: 0,
        raiseModel: 'margin',
        label: input.label,
        flavor: baseFlavor,
        actorId: String(actor?.id ?? ''),
        actorRef: input.actorRef ?? actor,
        isSkillRoll: false,
        baseModifier: 0,
        rollKind: 'contest',
        poolAttribute: attributeKey,
        applyPoolPenalties: true,
        skipChat: true,
        ...(input.advantage ? { rollAdvantage: true } : {}),
        ...(input.disadvantage ? { rollDisadvantage: true } : {}),
    };
}
/** Higher Final Result wins. Equal results are a tie — nothing changes. */
export function compareContestResults(initiatorTotal, opponentTotal) {
    const a = Math.floor(Number(initiatorTotal) || 0);
    const b = Math.floor(Number(opponentTotal) || 0);
    if (a > b)
        return 'initiator';
    if (b > a)
        return 'opponent';
    return 'tie';
}
/**
 * Surprise Grapple: only the initial contest is affected. The initiator gains
 * Advantage, the unaware target rolls with Disadvantage. Escape contests and
 * any later contest are never modified by this flag.
 */
export function surpriseContestModifiers(context, targetUnaware) {
    const applies = context === 'grapple' && targetUnaware === true;
    return { initiatorAdvantage: applies, opponentDisadvantage: applies };
}
/** Attributes the opponent may answer with for a given contest context. */
export function opponentAttributeChoices(context) {
    if (context === 'grapple' || context === 'grapple-escape')
        return PHYSICAL_CONTEST_ATTRIBUTES;
    return CONTEST_ATTRIBUTES;
}
/** Attributes the initiator may pick for a given contest context. */
export function initiatorAttributeChoices(context) {
    return opponentAttributeChoices(context);
}
export function contestOutcomeText(outcome, initiatorName, opponentName) {
    if (outcome === 'initiator')
        return `${initiatorName} wins the contest.`;
    if (outcome === 'opponent')
        return `${opponentName} wins the contest.`;
    return 'Tie — nothing changes.';
}
/** Copy the parts of a `masteryRoll` result the contest card stores and displays. */
export function contestSideFromRoll(setup, numDice, keepDice, roll) {
    return {
        ...setup,
        numDice: Math.max(0, Math.floor(Number(numDice) || 0)),
        keepDice: Math.max(1, Math.floor(Number(keepDice) || 1)),
        dice: Array.isArray(roll.dice) ? roll.dice.slice() : [],
        kept: Array.isArray(roll.kept) ? roll.kept.slice() : [],
        keptIndices: Array.isArray(roll.keptIndices) ? roll.keptIndices.slice() : [],
        ...(roll.dieChains ? { dieChains: roll.dieChains.map((c) => c.slice()) } : {}),
        total: Math.floor(Number(roll.total) || 0),
        ...(roll.flavor ? { flavor: String(roll.flavor) } : {}),
        ...(roll.autoFailReason ? { autoFailReason: String(roll.autoFailReason) } : {}),
    };
}
//# sourceMappingURL=opposed-attribute-contest.js.map