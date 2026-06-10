/**
 * Summon / Familiar actor sheet — read-focused statblock for bound familiars.
 */
import { MasteryCharacterSheet } from './character-sheet.js';
import { getSharedSenseLabel } from '../stones/familiar-bind.js';
export class MasterySummonSheet extends MasteryCharacterSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'actor', 'summon'],
            template: 'systems/mastery-system/templates/actor/summon-sheet.hbs',
            width: 520,
            height: 640,
            resizable: true,
        });
    }
    get template() {
        return 'systems/mastery-system/templates/actor/summon-sheet.hbs';
    }
    async getData(options) {
        const context = await super.getData(options);
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