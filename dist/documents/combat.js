/**
 * Combat writes are GM-only in Foundry. Players still need to end their own
 * turn (and "Join Game As" has no active GM to relay through).
 */
import { playerMayWriteOwnTurnAdvance } from '../combat/player-end-turn.js';
function BaseCombat() {
    return (globalThis.CONFIG?.Combat?.documentClass ??
        globalThis.foundry?.documents?.Combat ??
        globalThis.Combat);
}
export function registerMasteryCombatDocument() {
    const Base = BaseCombat();
    if (!Base || Base.__masteryOwnTurn)
        return;
    class MasteryCombat extends Base {
        static __masteryOwnTurn = true;
        canUserModify(user, action, data) {
            if (super.canUserModify?.(user, action, data))
                return true;
            if (action !== 'update')
                return false;
            return playerMayWriteOwnTurnAdvance(this, user, data);
        }
        static _canUpdate(user, doc, data) {
            if (typeof super._canUpdate === 'function' && super._canUpdate(user, doc, data))
                return true;
            return playerMayWriteOwnTurnAdvance(doc, user, data);
        }
    }
    globalThis.CONFIG.Combat.documentClass = MasteryCombat;
}
//# sourceMappingURL=combat.js.map