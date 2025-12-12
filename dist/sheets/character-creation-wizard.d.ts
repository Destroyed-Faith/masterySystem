/**
 * Character Creation Wizard for Mastery System
 * Multi-step wizard for character creation with attribute, skill, and disadvantage allocation
 */
import { MasteryActor } from '../documents/actor';
declare const BaseApplication: any;
export interface CreationState {
    step: number;
    attributes: Record<string, number>;
    skills: Record<string, number>;
    disadvantages: Array<{
        id: string;
        name: string;
        points: number;
        details: Record<string, any>;
        description?: string;
    }>;
    attributePointsSpent: number;
    skillPointsSpent: number;
    disadvantagePointsSpent: number;
}
export declare class CharacterCreationWizard extends BaseApplication {
    #private;
    actor: MasteryActor;
    state: CreationState;
    constructor(actor: MasteryActor, options?: any);
    static get defaultOptions(): any;
    initializeState(): CreationState;
    getData(options?: any): any;
    activateListeners(html: JQuery): void;
}
/**
 * Open the Character Creation Wizard for an actor
 */
export declare function openCharacterCreationWizard(actor: MasteryActor): CharacterCreationWizard;
export {};
//# sourceMappingURL=character-creation-wizard.d.ts.map