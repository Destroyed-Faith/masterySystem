/**
 * Summon / Familiar actor sheet — read-focused statblock for bound familiars.
 */
import { MasteryCharacterSheet } from './character-sheet.js';
import { getSharedSenseLabel } from '../stones/familiar-bind.js';
export class MasterySummonSheet extends MasteryCharacterSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['summon'],
        position: { width: 520, height: 640 },
    };
    /** @override */
    static PARTS = {
        body: {
            template: 'systems/mastery-system/templates/actor/summon-sheet.hbs',
        },
    };
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * @override
     */
    _initializeApplicationOptions(options) {
        const opts = super._initializeApplicationOptions(options);
        opts.classes = (opts.classes || []).filter((c) => c !== 'character');
        return opts;
    }
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const system = this.actor.system ?? {};
        const familiar = system.familiar ?? {};
        const stats = {
            hp: system.health?.bars?.[0]?.max ?? system.health?.maximum ?? 0,
            armor: system.combat?.armor ?? 0,
            evade: system.combat?.evade ?? 0,
            speed: system.combat?.speed ?? 0,
            attack: system.npcBaseAttack?.attackDiceCount
                ? `${system.npcBaseAttack.attackDiceCount}d8`
                : '—',
            damage: system.npcBaseAttack?.damageDiceCount
                ? `${system.npcBaseAttack.damageDiceCount}d8`
                : '—',
        };
        const senseGroups = (familiar.sharedSenses ?? []);
        const ownerId = familiar.ownerActorId ?? '';
        const owner = ownerId ? game.actors?.get(ownerId) : null;
        return {
            ...context,
            familiar,
            familiarStats: stats,
            familiarSize: familiar.size ?? '—',
            familiarMovement: familiar.movementType ?? 'ground',
            sharedSenseLabels: senseGroups.map((g) => getSharedSenseLabel(g)),
            ownerName: owner?.name ?? 'Unknown',
            ownerActorId: ownerId,
            boundStoneCount: familiar.boundStoneCount ?? 0,
        };
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('[data-action="open-owner"]').on('click', (ev) => {
            ev.preventDefault();
            const ownerId = this.actor.system?.familiar?.ownerActorId;
            if (!ownerId)
                return;
            const owner = game.actors?.get(ownerId);
            owner?.sheet?.render(true);
        });
    }
}
//# sourceMappingURL=summon-sheet.js.map