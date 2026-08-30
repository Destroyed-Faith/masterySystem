/**
 * Encounter Forge — table-facing 5-step wizard.
 *
 * STEP 1  Party & Encounter Structure (party, name, phases, enemy count)
 * STEP 2  Main Enemies & Defenses (concept, defensive identity, movement, copies)
 * STEP 3  Action Economy & Powers (concrete attacks, actions, recommendation)
 * STEP 4  Phase Mechanics / Adds (per-phase changes, adds/reinforcements/summons)
 * STEP 5  Review & Generate (solved values, warnings, GM overrides)
 *
 * There is NO difficulty select, NO rank select, NO targeting/tempo/pressure
 * style anywhere. The review is numerically stable: the solver is fully
 * deterministic and memoized per (design, party) — reopening or re-rendering
 * never changes a number.
 */
import { ENCOUNTER_FORGE_LIMITS, PRIMARY_DEFENSE_PILLARS, SECONDARY_DEFENSE_OPTIONS, defaultAttackConcept, defaultEncounterDesign, defaultMainEnemy, forgeId, syncPhaseCount, } from './encounter-model.js';
import { analyzePartyActors } from './party-analyzer.js';
import { solveEncounterForParty } from './solve-encounter.js';
import { validateEncounter } from './encounter-validator.js';
import { NPC_DEFENSE_SUPPORT } from './defense-solver.js';
import { recommendActionEconomy } from './offense-solver.js';
import { applyEncounterForge } from './encounter-forge-apply.js';
import { DIMINISHING_EFFECTS } from '../../utils/special-effects.js';
import { NPC_STANDARD_REACTIONS } from '../../utils/npc-reactions.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
const STEPS = ['party', 'enemies', 'actions', 'phases', 'review'];
const STEP_LABELS = {
    party: '1 · Gruppe & Struktur',
    enemies: '2 · Hauptgegner & Verteidigung',
    actions: '3 · Aktionen & Angriffe',
    phases: '4 · Phasen & Adds',
    review: '5 · Review & Generieren',
};
const DEFENSE_LABELS = {
    evade: 'Evade',
    armor: 'Armor',
    parry: 'Parry',
    absorption: 'Absorption',
    phasing: 'Phasing',
    ward: 'Ward',
    damageNegation: 'Damage Negation',
    damageReduction: 'Damage Reduction %',
    spellResistance: 'Spell Resistance',
};
function fmt(n, digits = 1) {
    return n.toFixed(digits).replace('.', ',');
}
function defenseOptions(kinds, current) {
    return kinds.map((k) => ({
        value: k,
        label: `${DEFENSE_LABELS[k]}${NPC_DEFENSE_SUPPORT[k].supported ? '' : ' (nicht verfügbar)'}`,
        selected: current === k,
        disabled: !NPC_DEFENSE_SUPPORT[k].supported,
    }));
}
function specialOptions(current) {
    const negatives = DIMINISHING_EFFECTS.filter((e) => e.polarity === 'negative');
    return [
        { value: '', label: '— kein Special —', selected: !current },
        ...negatives.map((e) => ({ value: e.id, label: e.name, selected: current === e.id })),
    ];
}
export class EncounterForgeDialog extends BaseDialog {
    step = 'party';
    design = defaultEncounterDesign();
    solveKey = '';
    solution = null;
    warnings = [];
    party = null;
    static DEFAULT_OPTIONS = {
        id: 'encounter-forge-dialog',
        classes: ['mastery-system', 'encounter-gen-app'],
        position: { width: 960, height: 780 },
        window: { title: 'Encounter Forge', resizable: true },
    };
    static PARTS = {
        content: {
            template: 'systems/mastery-system/templates/creation/encounter-forge/forge-wizard.hbs',
        },
    };
    /* ---------------- data helpers ---------------- */
    #characterActors() {
        const actors = game.actors?.contents ?? [];
        return actors.filter((a) => a?.type === 'character');
    }
    #selectedActors() {
        const ids = new Set(this.design.partyActorIds);
        return this.#characterActors().filter((a) => ids.has(String(a.id)));
    }
    #ensureParty() {
        this.party = analyzePartyActors(this.#selectedActors());
        return this.party;
    }
    /** Deterministic + memoized: identical design/party -> identical solution. */
    #ensureSolution() {
        const key = JSON.stringify({ d: this.design, p: this.design.partyActorIds });
        if (key === this.solveKey && this.solution)
            return;
        const party = this.#ensureParty();
        if (party.size === 0) {
            this.solution = null;
            this.warnings = [];
            return;
        }
        syncPhaseCount(this.design);
        this.solution = solveEncounterForParty(this.design, party);
        this.warnings = validateEncounter(this.design, this.solution);
        this.solveKey = key;
    }
    #enemy(enemyId) {
        return this.design.enemies.find((e) => e.id === enemyId) ?? null;
    }
    #addGroup(groupId) {
        return this.design.addGroups.find((g) => g.id === groupId) ?? null;
    }
    /* ---------------- context ---------------- */
    async _prepareContext() {
        syncPhaseCount(this.design);
        const stepIndex = STEPS.indexOf(this.step);
        const ctx = {
            steps: STEPS.map((s, i) => ({
                id: s,
                label: STEP_LABELS[s],
                active: s === this.step,
                done: i < stepIndex,
            })),
            step: this.step,
            isFirst: stepIndex === 0,
            isLast: this.step === 'review',
            canNext: this.step !== 'party' || this.design.partyActorIds.length > 0,
            design: this.design,
        };
        if (this.step === 'party')
            ctx.party = this.#partyContext();
        if (this.step === 'enemies')
            ctx.enemies = this.#enemiesContext();
        if (this.step === 'actions')
            ctx.actions = this.#actionsContext();
        if (this.step === 'phases')
            ctx.phases = this.#phasesContext();
        if (this.step === 'review')
            ctx.review = this.#reviewContext();
        return ctx;
    }
    #partyContext() {
        const selected = new Set(this.design.partyActorIds);
        return {
            actors: this.#characterActors().map((a) => {
                const mr = Math.max(1, Math.floor(Number(a?.system?.mastery?.rank) || 2));
                return {
                    id: String(a.id),
                    name: String(a.name ?? '?'),
                    mr,
                    checked: selected.has(String(a.id)),
                };
            }),
            name: this.design.name,
            phaseCount: this.design.phaseCount,
            phaseOptions: [1, 2, 3, 4].map((n) => ({
                value: n,
                label: `${n} Phase${n > 1 ? 'n' : ''}`,
                selected: this.design.phaseCount === n,
            })),
        };
    }
    #enemiesContext() {
        return {
            canAdd: this.design.enemies.length < ENCOUNTER_FORGE_LIMITS.maxEnemies,
            canRemove: this.design.enemies.length > 1,
            list: this.design.enemies.map((enemy) => {
                const phase = enemy.phases[0];
                const taken = (slot) => {
                    const chosen = [phase.defenses.primary, phase.defenses.secondary, phase.defenses.tertiary];
                    const own = phase.defenses[slot];
                    return (k) => chosen.includes(k) && k !== own;
                };
                return {
                    id: enemy.id,
                    name: enemy.name,
                    concept: enemy.concept,
                    primaryOptions: defenseOptions(PRIMARY_DEFENSE_PILLARS, phase.defenses.primary).map((o) => ({ ...o, disabled: o.disabled || taken('primary')(o.value) })),
                    secondaryOptions: [
                        { value: '', label: '— keine —', selected: !phase.defenses.secondary, disabled: false },
                        ...defenseOptions(SECONDARY_DEFENSE_OPTIONS, phase.defenses.secondary).map((o) => ({
                            ...o,
                            disabled: o.disabled || taken('secondary')(o.value),
                        })),
                    ],
                    tertiaryOptions: [
                        { value: '', label: '— keine —', selected: !phase.defenses.tertiary, disabled: false },
                        ...defenseOptions(SECONDARY_DEFENSE_OPTIONS, phase.defenses.tertiary).map((o) => ({
                            ...o,
                            disabled: o.disabled || taken('tertiary')(o.value),
                        })),
                    ],
                    primaryNote: NPC_DEFENSE_SUPPORT[phase.defenses.primary].supported
                        ? ''
                        : NPC_DEFENSE_SUPPORT[phase.defenses.primary].note,
                    movementKind: phase.movement.kind,
                    movementOptions: [
                        ['normal', 'Normale Bewegung'],
                        ['leap', 'Sprünge'],
                        ['flight', 'Flug'],
                        ['wallWalk', 'Wandlauf'],
                        ['teleport', 'Teleport'],
                        ['burrow', 'Graben'],
                        ['phaseShift', 'Phasenschritt'],
                    ].map(([value, label]) => ({ value, label, selected: phase.movement.kind === value })),
                    escapesMelee: phase.movement.escapesMelee,
                    copies: enemy.copies,
                    reactionOptions: NPC_STANDARD_REACTIONS.map((r) => ({
                        value: r.id,
                        label: r.name,
                        selected: phase.reactions.some((x) => x.id === r.id),
                    })),
                };
            }),
        };
    }
    #actionsContext() {
        const party = this.#ensureParty();
        const attackingAdds = this.design.addGroups
            .filter((g) => g.attacks)
            .reduce((a, g) => a + Math.max(1, g.count), 0);
        const rec = party.size > 0
            ? recommendActionEconomy(party, this.design.enemies.length, attackingAdds)
            : null;
        return {
            rec,
            recText: rec
                ? `Gruppe: ${rec.party.offensiveActionsPerRound} Angriffs-Aktionen/Runde (+${fmt(rec.party.sustainableExtraActions)} nachhaltige Stone-Extras), ${rec.party.reactionsPerRound} Reaktionen. Empfohlen feindlich: ${rec.totalHostileActions} Aktionen/Runde gesamt.`
                : 'Keine Gruppe gewählt.',
            list: this.design.enemies.map((enemy, i) => ({
                id: enemy.id,
                name: enemy.name,
                recommended: rec?.perBody[i] ?? 2,
                override: enemy.phases[0].overrides.offensiveActions ?? '',
                canAddAttack: enemy.attacks.length < ENCOUNTER_FORGE_LIMITS.maxAttacksPerEnemy,
                attacks: enemy.attacks.map((atk) => ({
                    id: atk.id,
                    enemyId: enemy.id,
                    name: atk.name,
                    isSpell: atk.resolution === 'spell',
                    isRanged: atk.delivery === 'ranged',
                    area: atk.area,
                    areaOptions: [
                        ['single', 'Einzelziel'],
                        ['radius', 'AoE Radius'],
                        ['cone', 'AoE Kegel'],
                        ['line', 'AoE Linie'],
                    ].map(([value, label]) => ({ value, label, selected: atk.area === value })),
                    areaSize: atk.areaSize,
                    range: atk.range,
                    stress: atk.stress,
                    specialOptions: specialOptions(atk.specialId),
                    canRemove: enemy.attacks.length > 1,
                })),
            })),
        };
    }
    #phasesContext() {
        const phases = Array.from({ length: this.design.phaseCount }, (_, p) => ({
            index: p,
            label: `Phase ${p + 1}`,
            enemies: this.design.enemies.map((enemy) => {
                const phase = enemy.phases[p];
                return {
                    enemyId: enemy.id,
                    name: enemy.name,
                    isFirst: p === 0,
                    primaryOptions: defenseOptions(PRIMARY_DEFENSE_PILLARS, phase.defenses.primary),
                    secondaryOptions: [
                        { value: '', label: '— keine —', selected: !phase.defenses.secondary, disabled: false },
                        ...defenseOptions(SECONDARY_DEFENSE_OPTIONS, phase.defenses.secondary),
                    ],
                    mechanicsNote: phase.mechanicsNote,
                    attacks: enemy.attacks.map((atk) => ({
                        id: atk.id,
                        name: atk.name || 'Attacke',
                        active: phase.attackIds.includes(atk.id),
                    })),
                };
            }),
        }));
        return {
            phases,
            multiPhase: this.design.phaseCount > 1,
            addGroups: this.design.addGroups.map((g) => ({
                id: g.id,
                name: g.name,
                count: g.count,
                role: g.role,
                roleOptions: [
                    ['damage', 'Schaden'],
                    ['special', 'Special anwenden'],
                    ['protect', 'Boss schützen'],
                    ['sacrifice', 'Ressource/Opfer'],
                    ['ward', 'Ward aufrechterhalten'],
                    ['position', 'Positionsdruck'],
                ].map(([value, label]) => ({ value, label, selected: g.role === value })),
                arrivalType: g.arrival.type,
                arrivalOptions: [
                    ['fixed', 'Fest (ab Kampfbeginn)'],
                    ['reinforcement', 'Verstärkung (Runde X)'],
                    ['summon', 'Beschworen (kostet Aktion)'],
                ].map(([value, label]) => ({ value, label, selected: g.arrival.type === value })),
                arrivalRound: g.arrival.type === 'reinforcement' && g.arrival.trigger.kind === 'round'
                    ? g.arrival.trigger.round
                    : 2,
                summonerOptions: this.design.enemies.map((e) => ({
                    value: e.id,
                    label: e.name,
                    selected: g.arrival.type === 'summon' && g.arrival.summonerEnemyId === e.id,
                })),
                isReinforcement: g.arrival.type === 'reinforcement',
                isSummon: g.arrival.type === 'summon',
                hitsToKill: g.hitsToKill,
                attacks: g.attacks,
                specialOptions: specialOptions(g.specialId),
                isSpecialRole: g.role === 'special',
            })),
        };
    }
    #reviewContext() {
        this.#ensureSolution();
        const solution = this.solution;
        if (!solution) {
            return { empty: true };
        }
        return {
            empty: false,
            name: this.design.name || 'Encounter',
            totalRounds: fmt(solution.totalExpectedRounds),
            partySize: solution.party.size,
            warnings: this.warnings.map((w) => ({
                message: w.message,
                strong: w.severity === 'strong',
                info: w.severity === 'info',
            })),
            phases: solution.phases.map((phase) => {
                const d = phase.durability;
                return {
                    label: `Phase ${phase.phaseIndex + 1}`,
                    index: phase.phaseIndex,
                    duration: `${fmt(d.expectedPhaseRounds)} Runden erwartet (günstig ${fmt(d.favorableRounds)} · ungünstig ${fmt(d.unfavorableRounds)} · Opening-Burst ${fmt(d.burstRounds)})`,
                    multiBody: phase.enemies.length > 1,
                    firstDrop: fmt(d.timeToFirstDrop),
                    afterDrop: phase.hostileActionsAfterFirstDrop,
                    roundCurve: d.roundDamage
                        .slice(0, Math.min(6, d.roundDamage.length))
                        .map((v, i) => `R${i + 1}: ${fmt(v, 0)}`)
                        .join(' · '),
                    actionText: `Feindliche Aktionen: ${phase.enemies.reduce((a, e) => a + e.offensiveActions, 0)} Haupt + ${phase.actionEconomy.addActions} Adds vs. ${phase.actionEconomy.party.offensiveActionsPerRound} Gruppen-Aktionen`,
                    enemies: phase.enemies.map((e) => {
                        const enemy = this.#enemy(e.enemyId);
                        const overrides = enemy?.phases[Math.min(phase.phaseIndex, (enemy?.phases.length ?? 1) - 1)]?.overrides;
                        return {
                            enemyId: e.enemyId,
                            phaseIndex: phase.phaseIndex,
                            name: e.enemyName,
                            health: e.health,
                            healthOverride: overrides?.health ?? '',
                            actions: e.offensiveActions,
                            actionsOverride: overrides?.offensiveActions ?? '',
                            defenses: e.defensePackage.contributions.map((c) => ({
                                label: `${DEFENSE_LABELS[c.kind]} ${c.value}`,
                                share: `${fmt(c.share * 100, 0)}%`,
                                unsupported: !c.supported,
                            })),
                            attacks: e.attacks.map((a) => ({
                                name: a.name,
                                line: `${a.attackPool}k${a.keep} · ${a.damageDice}d8${a.specialId ? ` · ${a.specialId}(${a.specialValue})` : ''}${a.usesPerRound > 1 ? ` · ×${a.usesPerRound}/Runde` : ''}${a.occupancy ? ` · AoE typ. ${a.occupancy.typical} Ziele` : ''}`,
                            })),
                        };
                    }),
                    adds: phase.adds.map((a) => ({
                        name: a.name,
                        line: `×${a.count} ab Runde ${a.arrivalRound}, ${a.healthPerAdd} HP${a.attacks ? `, ${a.attacks.attackPool}k · ${a.attacks.damageDice}d8` : ''}`,
                    })),
                    perPc: phase.offense.perPc.map((pc) => ({
                        name: pc.name,
                        hlRound: fmt(pc.expectedHlLostPerRound, 2),
                        hlPhase: fmt(pc.expectedHlLostPerPhase, 2),
                        specials: fmt(pc.peakSpecialStacks, 1),
                        hitRates: pc.byAttack
                            .map((b) => `${b.attackName} ${fmt(b.connectChance * 100, 0)}%`)
                            .join(' · '),
                    })),
                    highestRisk: phase.offense.highestRiskPcName,
                    burstLine: `Härtester Einzeltreffer (P90): „${phase.offense.worstSingleHitAttackName}" vs ${phase.offense.worstSingleHitTargetName} ≈ ${fmt(phase.offense.worstSingleHitQ90 * 100, 0)}% der Gesamt-HP`,
                };
            }),
            canGenerate: Boolean(this.design.name.trim()) && solution.party.size > 0,
        };
    }
    /* ---------------- events ---------------- */
    _onRender() {
        const root = this.element;
        if (!root)
            return;
        root.querySelectorAll('[data-action]').forEach((el) => {
            el.addEventListener('click', (ev) => this.#onAction(ev, el));
        });
        root.querySelectorAll('[data-field]').forEach((el) => {
            el.addEventListener('change', () => this.#onFieldChange(el));
        });
    }
    async #onAction(ev, el) {
        ev.preventDefault();
        const action = el.dataset.action;
        const enemyId = el.dataset.enemy ?? '';
        switch (action) {
            case 'next': {
                const idx = STEPS.indexOf(this.step);
                this.step = STEPS[Math.min(STEPS.length - 1, idx + 1)];
                break;
            }
            case 'prev': {
                const idx = STEPS.indexOf(this.step);
                this.step = STEPS[Math.max(0, idx - 1)];
                break;
            }
            case 'goto':
                if (el.dataset.step && STEPS.includes(el.dataset.step)) {
                    this.step = el.dataset.step;
                }
                break;
            case 'add-enemy':
                if (this.design.enemies.length < ENCOUNTER_FORGE_LIMITS.maxEnemies) {
                    this.design.enemies.push(defaultMainEnemy(`Main Enemy ${this.design.enemies.length + 1}`, this.design.phaseCount));
                }
                break;
            case 'remove-enemy':
                if (this.design.enemies.length > 1) {
                    this.design.enemies = this.design.enemies.filter((e) => e.id !== enemyId);
                }
                break;
            case 'add-attack': {
                const enemy = this.#enemy(enemyId);
                if (enemy && enemy.attacks.length < ENCOUNTER_FORGE_LIMITS.maxAttacksPerEnemy) {
                    const atk = defaultAttackConcept({ name: `Angriff ${enemy.attacks.length + 1}` });
                    enemy.attacks.push(atk);
                    for (const phase of enemy.phases)
                        phase.attackIds.push(atk.id);
                }
                break;
            }
            case 'remove-attack': {
                const enemy = this.#enemy(enemyId);
                const attackId = el.dataset.attack ?? '';
                if (enemy && enemy.attacks.length > 1) {
                    enemy.attacks = enemy.attacks.filter((a) => a.id !== attackId);
                    for (const phase of enemy.phases) {
                        phase.attackIds = phase.attackIds.filter((id) => id !== attackId);
                    }
                }
                break;
            }
            case 'add-group':
                this.design.addGroups.push({
                    id: forgeId('add'),
                    name: `Adds ${this.design.addGroups.length + 1}`,
                    count: 2,
                    role: 'damage',
                    arrival: { type: 'fixed' },
                    specialId: null,
                    hitsToKill: 1,
                    attacks: true,
                });
                break;
            case 'remove-group':
                this.design.addGroups = this.design.addGroups.filter((g) => g.id !== el.dataset.group);
                break;
            case 'generate': {
                this.#ensureSolution();
                if (!this.solution)
                    return;
                const result = await applyEncounterForge(this.design, this.solution, this.warnings);
                if (result) {
                    ui?.notifications?.info(`Encounter „${this.design.name}" erstellt: ${result.actorCount} Actor(s) + Journal.`);
                    this.close();
                    return;
                }
                break;
            }
            default:
                return;
        }
        this.render();
    }
    #onFieldChange(el) {
        const field = el.dataset.field ?? '';
        const enemy = this.#enemy(el.dataset.enemy ?? '');
        const group = this.#addGroup(el.dataset.group ?? '');
        const phaseIdx = Number(el.dataset.phase ?? 0);
        const attack = enemy?.attacks.find((a) => a.id === el.dataset.attack) ?? null;
        const checked = el.checked === true;
        const value = el.value;
        const numOrNull = () => {
            const n = Number(value);
            return Number.isFinite(n) && value !== '' ? n : null;
        };
        switch (field) {
            // Step 1
            case 'party-actor': {
                const id = el.dataset.actor ?? '';
                const set = new Set(this.design.partyActorIds);
                if (checked)
                    set.add(id);
                else
                    set.delete(id);
                this.design.partyActorIds = [...set];
                break;
            }
            case 'name':
                this.design.name = value;
                return; // no re-render needed for text typing
            case 'phase-count':
                this.design.phaseCount = Number(value) || 1;
                syncPhaseCount(this.design);
                break;
            // Step 2
            case 'enemy-name':
                if (enemy)
                    enemy.name = value;
                return;
            case 'enemy-concept':
                if (enemy)
                    enemy.concept = value;
                return;
            case 'defense-primary':
                if (enemy)
                    enemy.phases[phaseIdx].defenses.primary = value;
                break;
            case 'defense-secondary':
                if (enemy)
                    enemy.phases[phaseIdx].defenses.secondary = (value || undefined);
                break;
            case 'defense-tertiary':
                if (enemy)
                    enemy.phases[phaseIdx].defenses.tertiary = (value || undefined);
                break;
            case 'movement-kind':
                if (enemy) {
                    for (const p of enemy.phases) {
                        p.movement.kind = value;
                        if (value === 'teleport' || value === 'flight' || value === 'phaseShift') {
                            p.movement.escapesMelee = true;
                        }
                    }
                }
                break;
            case 'escapes-melee':
                if (enemy)
                    for (const p of enemy.phases)
                        p.movement.escapesMelee = checked;
                break;
            case 'reaction-toggle': {
                if (enemy) {
                    const rid = el.dataset.reaction;
                    for (const p of enemy.phases) {
                        const has = p.reactions.some((r) => r.id === rid);
                        if (checked && !has && p.reactions.length < ENCOUNTER_FORGE_LIMITS.maxReactionSlots) {
                            p.reactions.push({ id: rid });
                        }
                        if (!checked && has)
                            p.reactions = p.reactions.filter((r) => r.id !== rid);
                    }
                }
                break;
            }
            case 'copies-enabled':
                if (enemy)
                    enemy.copies.enabled = checked;
                break;
            case 'copies-count':
                if (enemy)
                    enemy.copies.count = Math.max(1, Math.min(6, Number(value) || 1));
                break;
            case 'copies-health':
                if (enemy)
                    enemy.copies.health = value === 'shared' ? 'shared' : 'independent';
                break;
            case 'copies-fragile':
                if (enemy)
                    enemy.copies.fragile = checked;
                break;
            case 'copies-attack':
                if (enemy)
                    enemy.copies.attack = checked;
                break;
            // Step 3
            case 'attack-name':
                if (attack)
                    attack.name = value;
                return;
            case 'attack-spell':
                if (attack)
                    attack.resolution = checked ? 'spell' : 'martial';
                break;
            case 'attack-ranged':
                if (attack) {
                    attack.delivery = checked ? 'ranged' : 'melee';
                    attack.range = checked ? Math.max(8, attack.range) : Math.min(8, attack.range || 2);
                }
                break;
            case 'attack-area':
                if (attack) {
                    attack.area = value;
                    if (attack.area !== 'single' && attack.areaSize <= 0)
                        attack.areaSize = 3;
                }
                break;
            case 'attack-area-size':
                if (attack)
                    attack.areaSize = Math.max(0, Number(value) || 0);
                break;
            case 'attack-range':
                if (attack)
                    attack.range = Math.max(0, Number(value) || 0);
                break;
            case 'attack-special':
                if (attack)
                    attack.specialId = value || null;
                break;
            case 'attack-stress':
                if (attack)
                    attack.stress = checked;
                break;
            case 'actions-override':
                if (enemy)
                    enemy.phases[0].overrides.offensiveActions = numOrNull();
                break;
            // Step 4
            case 'phase-attack-toggle': {
                if (enemy) {
                    const atkId = el.dataset.attack ?? '';
                    const p = enemy.phases[phaseIdx];
                    const has = p.attackIds.includes(atkId);
                    if (checked && !has)
                        p.attackIds.push(atkId);
                    if (!checked && has)
                        p.attackIds = p.attackIds.filter((id) => id !== atkId);
                }
                break;
            }
            case 'phase-note':
                if (enemy)
                    enemy.phases[phaseIdx].mechanicsNote = value;
                return;
            case 'group-name':
                if (group)
                    group.name = value;
                return;
            case 'group-count':
                if (group)
                    group.count = Math.max(1, Math.min(12, Number(value) || 1));
                break;
            case 'group-role':
                if (group)
                    group.role = value;
                break;
            case 'group-arrival':
                if (group) {
                    if (value === 'fixed')
                        group.arrival = { type: 'fixed' };
                    else if (value === 'reinforcement') {
                        group.arrival = { type: 'reinforcement', trigger: { kind: 'round', round: 2 } };
                    }
                    else {
                        group.arrival = {
                            type: 'summon',
                            summonerEnemyId: this.design.enemies[0]?.id ?? '',
                        };
                    }
                }
                break;
            case 'group-round':
                if (group && group.arrival.type === 'reinforcement') {
                    group.arrival.trigger = { kind: 'round', round: Math.max(1, Number(value) || 2) };
                }
                break;
            case 'group-summoner':
                if (group && group.arrival.type === 'summon')
                    group.arrival.summonerEnemyId = value;
                break;
            case 'group-hits':
                if (group)
                    group.hitsToKill = Math.max(1, Math.min(6, Number(value) || 1));
                break;
            case 'group-attacks':
                if (group)
                    group.attacks = checked;
                break;
            case 'group-special':
                if (group)
                    group.specialId = value || null;
                break;
            // Step 5 overrides
            case 'override-health':
                if (enemy)
                    enemy.phases[phaseIdx].overrides.health = numOrNull();
                break;
            case 'override-actions':
                if (enemy)
                    enemy.phases[phaseIdx].overrides.offensiveActions = numOrNull();
                break;
            default:
                return;
        }
        this.render();
    }
}
let forgeInstance = null;
export function showEncounterForgeDialog() {
    if (!game.user?.isGM) {
        ui?.notifications?.warn('Nur der Spielleiter kann den Encounter Forge öffnen.');
        return;
    }
    if (!forgeInstance)
        forgeInstance = new EncounterForgeDialog();
    forgeInstance.render(true);
}
//# sourceMappingURL=encounter-forge-dialog.js.map