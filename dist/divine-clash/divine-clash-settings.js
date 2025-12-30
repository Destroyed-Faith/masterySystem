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
        hint: 'Image path for Power Stone tokens. Default: systems/mastery-system/icons/svg/power-stone.svg',
        scope: 'world',
        config: true,
        type: String,
        default: 'systems/mastery-system/icons/svg/power-stone.svg',
        filePicker: 'image'
    });
    // Vitality Stone Image Path
    game.settings.register('mastery-system', 'divineClashVitalityStoneImg', {
        name: 'Divine Clash: Vitality Stone Image',
        hint: 'Image path for Vitality Stone tokens. Default: systems/mastery-system/icons/svg/vitality-stone.svg',
        scope: 'world',
        config: true,
        type: String,
        default: 'systems/mastery-system/icons/svg/vitality-stone.svg',
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
}
//# sourceMappingURL=divine-clash-settings.js.map