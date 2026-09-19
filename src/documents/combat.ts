/**
 * Combat writes are GM-only in Foundry. Players still need to end their own
 * turn (and "Join Game As" has no active GM to relay through).
 */

import { playerMayWriteOwnTurnAdvance } from '../combat/player-end-turn.js';

function BaseCombat(): any {
  return (
    (globalThis as any).CONFIG?.Combat?.documentClass ??
    (globalThis as any).foundry?.documents?.Combat ??
    (globalThis as any).Combat
  );
}

export function registerMasteryCombatDocument(): void {
  const Base = BaseCombat();
  if (!Base || (Base as any).__masteryOwnTurn) return;

  class MasteryCombat extends Base {
    static __masteryOwnTurn = true;

    canUserModify(user: any, action: string, data?: Record<string, unknown>): boolean {
      if (super.canUserModify?.(user, action, data)) return true;
      if (action !== 'update') return false;
      return playerMayWriteOwnTurnAdvance(this, user, data);
    }

    static _canUpdate(user: any, doc: any, data?: Record<string, unknown>): boolean {
      if (typeof super._canUpdate === 'function' && super._canUpdate(user, doc, data)) return true;
      return playerMayWriteOwnTurnAdvance(doc, user, data);
    }
  }

  (globalThis as any).CONFIG.Combat.documentClass = MasteryCombat;
}
