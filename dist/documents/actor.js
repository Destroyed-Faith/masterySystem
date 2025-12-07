/**
 * Extended Actor class for Mastery System
 */
export class MasteryActor extends Actor {
  /**
   * Prepare base data for the actor
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Prepare derived data for the actor
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags.masterySystem || {};

    // Call specific preparation based on actor type
    if (actorData.type === 'character') {
      this._prepareCharacterData(actorData);
    } else if (actorData.type === 'npc') {
      this._prepareNpcData(actorData);
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const system = actorData.system;

    // Ensure resources exist with defaults
    if (!system.resources) {
      system.resources = {
        stones: { current: 0, maximum: 0 },
        vitality: { current: 0, maximum: 0 },
        stress: { current: 0, maximum: 0 }
      };
    }

    // Ensure stones has required properties
    if (!system.resources.stones) {
      system.resources.stones = { current: 0, maximum: 0 };
    }
    if (system.resources.stones.current === undefined) {
      system.resources.stones.current = 0;
    }
    if (system.resources.stones.maximum === undefined) {
      system.resources.stones.maximum = 0;
    }

    // Ensure vitality has required properties  
    if (!system.resources.vitality) {
      system.resources.vitality = { current: 0, maximum: 0 };
    }
    if (system.resources.vitality.current === undefined) {
      system.resources.vitality.current = 0;
    }
    if (system.resources.vitality.maximum === undefined) {
      system.resources.vitality.maximum = 0;
    }

    // Ensure stress has required properties
    if (!system.resources.stress) {
      system.resources.stress = { current: 0, maximum: 0 };
    }
    if (system.resources.stress.current === undefined) {
      system.resources.stress.current = 0;
    }
    if (system.resources.stress.maximum === undefined) {
      system.resources.stress.maximum = 0;
    }

    // Ensure actions exist
    if (!system.actions) {
      system.actions = {
        attack: { max: 1, used: 0 },
        movement: { max: 1, used: 0 },
        reaction: { max: 1, used: 0 }
      };
    }

    // Ensure mastery exists
    if (!system.mastery) {
      system.mastery = {
        rank: 2,
        charges: { current: 2, maximum: 2, temporary: 0 }
      };
    }

    // Ensure passives structure exists
    if (!system.passives) {
      system.passives = {
        slots: []
      };
    }
  }

  /**
   * Prepare NPC type specific data
   */
  _prepareNpcData(actorData) {
    const system = actorData.system;

    // Ensure basic resources for NPCs
    if (!system.resources) {
      system.resources = {
        stones: { current: 0, maximum: 0 },
        vitality: { current: 0, maximum: 0 },
        stress: { current: 0, maximum: 0 }
      };
    }

    // Ensure actions exist
    if (!system.actions) {
      system.actions = {
        attack: { max: 1, used: 0 },
        movement: { max: 1, used: 0 },
        reaction: { max: 1, used: 0 }
      };
    }
  }
}
//# sourceMappingURL=actor.js.map
