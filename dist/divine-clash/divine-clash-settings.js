/**
 * Divine Clash Settings
 * Registers game settings for Divine Clash configuration
 */
/**
 * Register Divine Clash settings
 */
export function registerDivineClashSettings() {
    // Divine Clash Scene ID
    game.settings.register('mastery-system', 'divineClashSceneId', {
        name: 'Divine Clash Scene ID',
        hint: 'The Scene ID where Divine Clash boards are located. Leave empty to use scene name "Divine Clash".',
        scope: 'world',
        config: true,
        type: String,
        default: ''
    });
    // Power Stone Image Path
    game.settings.register('mastery-system', 'divineClashPowerStoneImg', {
        name: 'Divine Clash: Power Stone Image',
        hint: 'Image path for Power Stone tokens. Default: systems/mastery-system/assets/icons/stones/power-stone.svg',
        scope: 'world',
        config: true,
        type: String,
        default: 'systems/mastery-system/assets/icons/stones/power-stone.svg',
        filePicker: 'image'
    });
    // Vitality Stone Image Path
    game.settings.register('mastery-system', 'divineClashVitalityStoneImg', {
        name: 'Divine Clash: Vitality Stone Image',
        hint: 'Image path for Vitality Stone tokens. Default: systems/mastery-system/assets/icons/stones/vitality-stone.svg',
        scope: 'world',
        config: true,
        type: String,
        default: 'systems/mastery-system/assets/icons/stones/vitality-stone.svg',
        filePicker: 'image'
    });
    // Cleanup Avatars on Reset
    game.settings.register('mastery-system', 'divineClashCleanupAvatars', {
        name: 'Divine Clash: Cleanup Avatars on Reset',
        hint: 'If enabled, avatar tokens are also deleted when using Reset/Cleanup. Otherwise only stone tokens are removed.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });
    // Base Power Stone Actor ID
    game.settings.register('mastery-system', 'divineClashBasePowerStoneActorId', {
        name: 'Divine Clash: Base Power Stone Actor ID',
        hint: 'Actor ID of the base Power Stone actor to use for all players. Leave empty to create per-user actors. You can select a stone actor and copy its ID from the actor sheet.',
        scope: 'world',
        config: true,
        type: String,
        default: ''
    });
    // Base Vitality Stone Actor ID
    game.settings.register('mastery-system', 'divineClashBaseVitalityStoneActorId', {
        name: 'Divine Clash: Base Vitality Stone Actor ID',
        hint: 'Actor ID of the base Vitality Stone actor to use for all players. Leave empty to create per-user actors. You can select a stone actor and copy its ID from the actor sheet.',
        scope: 'world',
        config: true,
        type: String,
        default: ''
    });
}
//# sourceMappingURL=divine-clash-settings.js.map