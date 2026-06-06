/**
 * Upgrade Step rule — new spec.
 *
 * During each Upgrade Step, each individual upgrade may be increased only
 * once. You may bump several different Attributes, several different Skills,
 * several different Powers, and several different Artifacts, but the *same*
 * Attribute / Skill / Power / Artifact may not be bumped twice in the same
 * step.
 *
 * This replaces the old 50%-of-step Attribute spending cap. There is no
 * longer a fixed percentage limit on Attribute spending; progression is
 * controlled by the per-step bump limit, XP costs, Stone thresholds, and
 * the natural need to invest in Skills, Powers, and Artifacts.
 *
 * State shape (`system.xp.currentStep`):
 *
 *   {
 *     attributes: string[]; // attribute keys bumped this step
 *     skills:     string[]; // skill keys bumped this step
 *     powers:     string[]; // power item IDs bumped this step
 *     artifacts:  string[]; // artifact item IDs bumped this step
 *   }
 *
 * An "End Step" action clears all four lists.
 */

export type UpgradeKind = 'attribute' | 'skill' | 'power' | 'artifact';

export interface XpStepState {
    attributes: string[];
    skills: string[];
    powers: string[];
    artifacts: string[];
}

const KIND_TO_KEY: Record<UpgradeKind, keyof XpStepState> = {
    attribute: 'attributes',
    skill: 'skills',
    power: 'powers',
    artifact: 'artifacts',
};

/** Fresh empty step bucket. */
export function emptyStep(): XpStepState {
    return { attributes: [], skills: [], powers: [], artifacts: [] };
}

/**
 * Initial post-creation XP award exemption.
 *
 * The FIRST XP award a character receives after creation (the "D&D → this
 * system" conversion batch) may be spent freely: the once-per-step "+1" bump
 * limit does NOT apply to Attributes and Skills, so the player can dump the
 * whole batch however they like. Every LATER award re-imposes the normal
 * "+1 per step" rule.
 *
 * The flag lives at `system.xp.initialAwardUnrestricted` and is toggled by the
 * XP grant UI (true on the first grant, false on every grant after that).
 */
export function isInitialAwardUnrestricted(actor: any): boolean {
    return actor?.system?.xp?.initialAwardUnrestricted === true;
}

function sanitizeList(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of input) {
        const s = v == null ? '' : String(v).trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

/** Read the step bucket from an actor, tolerating legacy / missing shapes. */
export function readStep(actor: any): XpStepState {
    const raw = (actor?.system?.xp?.currentStep ?? {}) as Record<string, unknown>;
    return {
        attributes: sanitizeList(raw.attributes),
        skills: sanitizeList(raw.skills),
        powers: sanitizeList(raw.powers),
        artifacts: sanitizeList(raw.artifacts),
    };
}

/** Has the given Attribute / Skill / Power / Artifact already been bumped this step? */
export function isBumped(state: XpStepState, kind: UpgradeKind, id: string): boolean {
    const key = KIND_TO_KEY[kind];
    const list = state?.[key] ?? [];
    const target = String(id ?? '').trim();
    if (!target) return false;
    return list.includes(target);
}

/** Return a new state with `id` recorded as bumped this step. Idempotent. */
export function recordBump(state: XpStepState, kind: UpgradeKind, id: string): XpStepState {
    const target = String(id ?? '').trim();
    const key = KIND_TO_KEY[kind];
    const next: XpStepState = {
        attributes: [...(state?.attributes ?? [])],
        skills: [...(state?.skills ?? [])],
        powers: [...(state?.powers ?? [])],
        artifacts: [...(state?.artifacts ?? [])],
    };
    if (!target) return next;
    if (!next[key].includes(target)) next[key].push(target);
    return next;
}

/** Return a new state with `id` removed from the bumped list. Idempotent. */
export function undoBump(state: XpStepState, kind: UpgradeKind, id: string): XpStepState {
    const target = String(id ?? '').trim();
    const key = KIND_TO_KEY[kind];
    const next: XpStepState = {
        attributes: [...(state?.attributes ?? [])],
        skills: [...(state?.skills ?? [])],
        powers: [...(state?.powers ?? [])],
        artifacts: [...(state?.artifacts ?? [])],
    };
    if (!target) return next;
    next[key] = next[key].filter((v) => v !== target);
    return next;
}

/**
 * Persist a step state on the actor and (optionally) append a history note.
 * Side-effect-light: caller owns the rest of the update batch (XP totals,
 * attribute/skill/power values, …).
 */
export async function commitStep(actor: any, next: XpStepState, options?: { historyNote?: string }): Promise<void> {
    if (!actor) return;
    await actor.update({
        'system.xp.currentStep.attributes': [...next.attributes],
        'system.xp.currentStep.skills': [...next.skills],
        'system.xp.currentStep.powers': [...next.powers],
        'system.xp.currentStep.artifacts': [...next.artifacts],
    });
    if (options?.historyNote) {
        const list = Array.isArray(actor.system?.xp?.history) ? [...actor.system.xp.history] : [];
        list.push({
            ts: Date.now(),
            kind: 'step',
            note: options.historyNote,
            after: next,
        });
        await actor.update({ 'system.xp.history': list.slice(-200) });
    }
}

/**
 * "End Step" action: clear all four bump lists and append a summary history
 * entry. Players typically call this at the end of a downtime block once
 * they have spent everything they intend to spend.
 */
export async function endStep(actor: any): Promise<XpStepState> {
    const before = readStep(actor);
    const next = emptyStep();
    if (actor) {
        await actor.update({
            'system.xp.currentStep.attributes': [],
            'system.xp.currentStep.skills': [],
            'system.xp.currentStep.powers': [],
            'system.xp.currentStep.artifacts': [],
        });
        const list = Array.isArray(actor.system?.xp?.history) ? [...actor.system.xp.history] : [];
        const summary = [
            `${before.attributes.length} attr`,
            `${before.skills.length} skill`,
            `${before.powers.length} power`,
            `${before.artifacts.length} artifact`,
        ].join(', ');
        list.push({
            ts: Date.now(),
            kind: 'step-end',
            note: `Step closed (${summary})`,
            before,
            after: next,
        });
        await actor.update({ 'system.xp.history': list.slice(-200) });
    }
    return next;
}
