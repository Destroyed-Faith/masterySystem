import { MasteryActor } from './documents/actor.js';
import { MasteryItem } from './documents/item.js';
import { MasteryCharacterSheet } from './sheets/character-sheet.js';
import { MasteryNpcSheet } from './sheets/npc-sheet.js';
import { MasterySummonSheet } from './sheets/summon-sheet.js';
import { MasteryItemSheet } from './sheets/item-sheet.js';
import { ArtifactSheetV2 } from './sheets/artifact-sheet-v2.js';
// Combat hooks are imported dynamically to avoid build errors if dist/combat doesn't exist yet
// import { initializeCombatHooks } from '../dist/combat/initiative.js';
import { calculateStones } from './utils/calculations.js';
import { initializeTokenActionSelector } from './token-action-selector.js';
import { refreshRadialMenuActionLabelsIfOpenForActor } from './token-radial-menu.js';
import { initializeTurnIndicator } from './turn-indicator.js';
import { handleRadialMenuOpened, handleRadialMenuClosed } from './radial-menu/rendering.js';
import { registerAttackRollClickHandler } from './chat/attack-roll-handler.js';
import { registerDamageCardChatHooks } from './dice/damage-dialog.js';
// Import combat-related modules statically
import { PassiveSelectionDialog } from './sheets/passive-selection-dialog.js';
import { showTowerWizardDialog } from './creation/tower-wizard/tower-wizard-dialog.js';
import { showEncounterGeneratorDialog } from './creation/encounter-generator/encounter-generator-dialog.js';
import { showCharacterImportDialog } from './import/character-import-dialog.js';
import { importMasteryCharacter, importMasteryCharacterFromJson, validateCharacterImportDocument, validateCharacterImportJson, parseCharacterImportJson, } from './import/character-import.js';
import { CHARACTER_IMPORT_SCHEMA_VERSION } from './import/character-import-types.js';
import { CombatCarouselApp } from './ui/combat-carousel.js';
import { initializeStoneHooks } from './stones/stone-hooks.js';
import { applyPassiveTriggerToCombat, applyPassiveTrigger, applyBuffTriggersOnActivate, clearTempHPSourcesForBuffEffect, clearTempHPSourcesForCombat, } from './combat/passive-triggers.js';
import { clearPhasingForCombat, removeAugmentCharges, registerPhasingSettings, } from './combat/phasing.js';
import { initializeEncounterStart, beginEncounter } from './combat/encounter-start.js';
import { initializeSceneControls, initializeTokenHUDButton } from './ui/scene-controls-mastery.js';
import { openStonePowersForAllCombatants, initializeStonePowersFlow } from './combat/stone-powers-flow.js';
import { registerDivineClashSettings } from './divine-clash/divine-clash-settings.js';
import { registerEpicMasteryRollSettings } from './epic-roll/epic-mastery-roll-settings.js';
import { initializeEpicMasteryRoll } from './epic-roll/register-epic-mastery-roll.js';
import { initializeTyhraCalendar } from './calendar/tyhra-calendar-hooks.js';
import { initializeProseMirrorFontColor } from './editor/prosemirror-font-color.js';
import { requestEpicMasteryRoll } from './epic-roll/epic-mastery-roll-config-dialog.js';
import { getActiveEpicMasteryRollSession } from './epic-roll/epic-mastery-roll-session.js';
import { initializeDivineClashHooks } from './divine-clash/divine-clash-hooks.js';
import { initializeArtifactAwakening } from './artifacts/artifact-awakening.js';
import { seedGeneralItemsStorage } from './utils/seed-general-items.js';
import { seedArtifactLibrary, forceRefreshEchoArtifactLibrary } from './utils/seed-artifact-library.js';
import { getEchoArtifactIcon, getItemIcon, getItemIconHintFromCreateData, getItemIconHintFromItem, normalizeWeaponNameKey, } from './utils/item-icons.js';
import { actorHasPostCreationSnapshot, resetActorProgressToPostCreation } from './utils/xp-post-creation.js';
import { getPowerDefinitionRank } from './utils/power-definition-rank.js';
import { applyMasteryStatusEffects } from './system/status-effects.js';
import { registerTemplatesCutoverSetting, runTemplatesCutover } from './migrations/templates-cutover.js';
import { registerXpCurrentStepCutoverSetting, runXpCurrentStepCutover, } from './migrations/xp-currentstep-cutover.js';
import { registerArtifactSpecBackfillSetting, runArtifactSpecBackfill, } from './migrations/artifact-spec-backfill.js';
import { registerEchoArtifactTreeMigrationSetting, runEchoArtifactTreeMigration, } from './migrations/echo-artifact-tree-migration.js';
import { registerEchoArtifactDedupeMigrationSetting, runEchoArtifactDedupeMigration, } from './migrations/echo-artifact-dedupe-migration.js';
import { runElorianStrideMigration } from './migrations/elorian-stride-migration.js';
import { runTitanScarsAffinityMigration } from './migrations/titan-scars-affinity-migration.js';
import { runSpecialEffectRenameMigration } from './migrations/special-effect-rename-migration.js';
import { registerRulesV2AlignmentMigrationSetting, runRulesV2AlignmentMigration, } from './migrations/rules-v2-alignment-migration.js';
import { registerSpeed8mMigrationSetting, runSpeed8mMigration, } from './migrations/speed-8m-migration.js';
import { registerSummonV2MigrationSetting, runSummonV2Migration, } from './migrations/summon-v2-migration.js';
import { registerPaperdollSlotCanonicalSetting, runPaperdollSlotCanonical, } from './migrations/paperdoll-slot-canonical.js';
import { registerArtifactEchoLinkMigrationSetting, runArtifactEchoLinkMigration, } from './migrations/artifact-echo-link-migration.js';
import { registerAbCriticalMilestonesMigrationSetting, runAbCriticalMilestonesMigration, } from './migrations/ab-critical-milestones-migration.js';
import { registerPowerTemplateResyncMigrationSetting, runPowerTemplateResyncMigration, } from './migrations/power-template-resync-migration.js';
import { registerArtifactEchoActivationMigrationSetting, runArtifactEchoActivationMigration, } from './migrations/artifact-echo-activation-migration.js';
// Dice roller functions are imported in sheets where needed
// Register Handlebars helpers immediately (before init hook)
// This ensures they are available when templates are first rendered
registerHandlebarsHelpersImmediate();
/**
 * Register all world/client settings as early as possible in `init` so
 * migrations in `ready` still work when a later init step throws.
 */
function registerAllMasteryInitSettings() {
    registerSystemSettings();
    registerDivineClashSettings();
    registerEpicMasteryRollSettings();
    registerPhasingSettings();
    registerTemplatesCutoverSetting();
    registerXpCurrentStepCutoverSetting();
    registerArtifactSpecBackfillSetting();
    registerArtifactEchoLinkMigrationSetting();
    registerArtifactEchoActivationMigrationSetting();
    registerEchoArtifactTreeMigrationSetting();
    registerEchoArtifactDedupeMigrationSetting();
    registerPaperdollSlotCanonicalSetting();
    registerAbCriticalMilestonesMigrationSetting();
    registerPowerTemplateResyncMigrationSetting();
    registerRulesV2AlignmentMigrationSetting();
    registerSpeed8mMigrationSetting();
    registerSummonV2MigrationSetting();
}
/**
 * Initialize the Mastery System
 * This hook is called once when Foundry first starts up
 */
Hooks.once('init', async function () {
    const sysVer = typeof game !== 'undefined' && game.system?.version
        ? String(game.system.version)
        : '?.?.?';
    const versionInner = `  Version: ${sysVer}`.slice(0, 57).padEnd(57);
    registerAllMasteryInitSettings();
    // Register custom Document classes
    CONFIG.Actor.documentClass = MasteryActor;
    CONFIG.Item.documentClass = MasteryItem;
    // Register custom sheet application classes before optional init steps that
    // may throw on v14 (status effects, legacy shims, etc.).
    const coreActorSheet = foundry.appv1?.sheets?.ActorSheet;
    if (coreActorSheet) {
        try {
            foundry.documents.collections.Actors.unregisterSheet('core', coreActorSheet);
        }
        catch (err) {
            console.warn('Mastery System | Could not unregister core ActorSheet', err);
        }
    }
    foundry.documents.collections.Actors.registerSheet('mastery-system', MasteryCharacterSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'Character Sheet'
    });
    // Register NPC sheet
    foundry.documents.collections.Actors.registerSheet('mastery-system', MasteryNpcSheet, {
        types: ['npc'],
        makeDefault: true,
        label: 'Mastery NPC Sheet'
    });
    foundry.documents.collections.Actors.registerSheet('mastery-system', MasterySummonSheet, {
        types: ['summon'],
        makeDefault: true,
        label: 'Summon Sheet'
    });
    const coreItemSheet = foundry.appv1?.sheets?.ItemSheet;
    if (coreItemSheet) {
        try {
            foundry.documents.collections.Items.unregisterSheet('core', coreItemSheet);
        }
        catch (err) {
            console.warn('Mastery System | Could not unregister core ItemSheet', err);
        }
    }
    // Re-register cleanly so older builds that registered MasteryItemSheet for *all*
    // item types (incl. artifact) no longer offer the legacy artifact-sheet.hbs.
    try {
        foundry.documents.collections.Items.unregisterSheet('mastery-system', MasteryItemSheet);
    }
    catch (err) {
        console.warn('Mastery System | Could not unregister prior MasteryItemSheet registration', err);
    }
    try {
        foundry.documents.collections.Items.unregisterSheet('mastery-system', ArtifactSheetV2);
    }
    catch (err) {
        console.warn('Mastery System | Could not unregister prior ArtifactSheetV2 registration', err);
    }
    foundry.documents.collections.Items.registerSheet('mastery-system', MasteryItemSheet, {
        types: ['power', 'echo', 'schtick', 'condition', 'weapon', 'armor', 'shield', 'gear'],
        makeDefault: true,
        label: 'Item Sheet'
    });
    foundry.documents.collections.Items.registerSheet('mastery-system', ArtifactSheetV2, {
        types: ['artifact'],
        makeDefault: true,
        label: 'Artifact Sheet'
    });
    // Replace Foundry's default status-effects list with the Mastery-System
    // specials catalog so the token HUD radial shows only system conditions.
    try {
        applyMasteryStatusEffects();
    }
    catch (err) {
        console.warn('Mastery System | Could not apply mastery status effects', err);
    }
    exposeMasterySystemApi();
    // Setup XP Management inline in settings
    setupXpManagementInline();
    // Handlebars helpers are already registered in registerHandlebarsHelpersImmediate()
    // Verify critical helpers are available
    if (!Handlebars.helpers.length) {
        console.warn('Mastery System | length helper not found, re-registering...');
        Handlebars.registerHelper('length', function (value) {
            if (value === null || value === undefined)
                return 0;
            if (Array.isArray(value))
                return value.length;
            if (typeof value === 'string')
                return value.length;
            if (typeof value === 'object')
                return Object.keys(value).length;
            return 0;
        });
    }
    // Register CONFIG constants
    registerConfigConstants();
    // Initialize scene controls
    initializeSceneControls();
    initializeTokenHUDButton();
    // GM-only "Encounter erzeugen" button in the Actors directory header.
    Hooks.on('renderActorDirectory', (_app, html) => {
        if (!game.user?.isGM)
            return;
        const root = html instanceof HTMLElement ? html : html?.[0] ?? null;
        if (!root)
            return;
        const host = root.querySelector('.directory-header .header-actions') ||
            root.querySelector('.directory-header .action-buttons') ||
            root.querySelector('.directory-header') ||
            root.querySelector('.header-actions');
        if (!host)
            return;
        if (!root.querySelector('.eg-open-encounter-generator')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'eg-open-encounter-generator';
            btn.innerHTML = '<i class="fas fa-dragon"></i> Encounter';
            btn.title = 'Encounter-Generator';
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                showEncounterGeneratorDialog();
            });
            host.appendChild(btn);
        }
        if (!root.querySelector('.ms-open-character-import')) {
            const importBtn = document.createElement('button');
            importBtn.type = 'button';
            importBtn.className = 'ms-open-character-import';
            importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Character';
            importBtn.title = 'Homepage character JSON importieren';
            importBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                showCharacterImportDialog();
            });
            host.appendChild(importBtn);
        }
    });
    // Initialize stone powers flow system
    initializeStonePowersFlow();
    // Initialize Divine Clash hooks
    initializeDivineClashHooks();
    // Initialize Artifact Awakening system
    initializeArtifactAwakening();
    // Initialize combat hooks
    // Register combatStart hook directly here
    Hooks.on('combatStart', async (combat) => {
        const msFlags = combat.flags?.['mastery-system'] || {};
        if (msFlags.encounterSetup?.started) {
            CombatCarouselApp.open();
            return;
        }
        try {
            await PassiveSelectionDialog.showForCombat(combat);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const initRound = Math.max(1, combat.round ?? 1);
            await openStonePowersForAllCombatants(combat, initRound);
            CombatCarouselApp.open();
        }
        catch (error) {
            console.error('Mastery System | Error in combat start sequence', error);
        }
    });
    /** Close carousel UI and body class — use on combatEnd and deleteCombat (Foundry may emit only one). */
    const closeMasteryCombatCarouselUI = () => {
        try {
            CombatCarouselApp.close();
        }
        catch (e) {
            console.warn('Mastery System | Carousel close failed', e);
        }
        try {
            document.body.classList.remove('mastery-carousel-open');
        }
        catch {
            /* ignore */
        }
    };
    // Close carousel when combat ends (normal end)
    Hooks.on('combatEnd', () => {
        closeMasteryCombatCarouselUI();
    });
    // Encounter deleted from sidebar etc. — combatEnd may not fire
    Hooks.on('deleteCombat', () => {
        closeMasteryCombatCarouselUI();
    });
    // Recovery: carousel left open when no active encounter (reload, scene swap, etc.)
    // — and the reverse: after a page reload during a running encounter,
    // combatStart won't re-fire, so reopen the carousel from the combat state.
    Hooks.on('canvasReady', () => {
        try {
            const combat = game.combat;
            if (!combat && CombatCarouselApp.instance) {
                closeMasteryCombatCarouselUI();
            }
            else if (combat?.started) {
                const carousel = CombatCarouselApp.instance;
                if (!carousel || !carousel.rendered) {
                    CombatCarouselApp.open();
                }
            }
        }
        catch {
            /* ignore */
        }
    });
    // Update carousel when combat changes (Stone Powers bei Rundenwechsel: stone-hooks Pipeline)
    Hooks.on('updateCombat', async (combat) => {
        const carousel = CombatCarouselApp.instance;
        if (carousel && carousel.rendered) {
            carousel.render({ force: false });
        }
    });
    /**
     * Update initiative display in combat tracker for a specific combatant
     * @param combatant - The combatant to update
     * @param $html - Optional jQuery object of the combat tracker HTML (for use in renderCombatTracker hook)
     */
    function updateInitiativeDisplayInTracker(combatant, $html) {
        if (!combatant || !combatant.id)
            return;
        // Get current initiative value - use fresh from combat.combatants
        const combat = game.combat;
        if (!combat)
            return;
        const freshCombatant = combat.combatants.get(combatant.id);
        if (!freshCombatant)
            return;
        // Try to get initiative from msInitiativeValue flag first (set by Initiative Shop)
        // Fall back to combatant.initiative if flag is not set
        const flagValue = freshCombatant.getFlag('mastery-system', 'msInitiativeValue');
        const initiativeValue = (flagValue !== null && flagValue !== undefined) ? flagValue : (freshCombatant.initiative ?? 0);
        // Find the combatant element - use provided HTML or find in tracker
        let $combatant;
        if ($html) {
            // Use provided HTML (from renderCombatTracker hook)
            $combatant = $html.find(`[data-combatant-id="${combatant.id}"]`);
        }
        else {
            // Find the combat tracker app
            const combatTrackerApp = ui.combat;
            if (!combatTrackerApp || !combatTrackerApp.element)
                return;
            const $tracker = $(combatTrackerApp.element);
            $combatant = $tracker.find(`[data-combatant-id="${combatant.id}"]`);
        }
        if ($combatant.length === 0)
            return;
        const $tokenName = $combatant.find('.token-name');
        if ($tokenName.length === 0)
            return;
        // Remove existing initiative display
        $tokenName.find('.ms-initiative-value').remove();
        // Add updated initiative value
        const $initiativeSpan = $('<span class="ms-initiative-value">[' + initiativeValue + ']</span>');
        $tokenName.prepend($initiativeSpan);
    }
    // Update carousel when combatants change
    Hooks.on('createCombatant', () => {
        const carousel = CombatCarouselApp.instance;
        if (carousel && carousel.rendered) {
            carousel.render({ force: false });
        }
    });
    Hooks.on('updateCombatant', (_combat, combatant) => {
        // Update carousel
        const carousel = CombatCarouselApp.instance;
        if (carousel && carousel.rendered) {
            carousel.render({ force: false });
        }
        // Update initiative display in combat tracker
        updateInitiativeDisplayInTracker(combatant);
    });
    Hooks.on('deleteCombatant', () => {
        const carousel = CombatCarouselApp.instance;
        if (carousel && carousel.rendered) {
            carousel.render({ force: false });
        }
    });
    // Update carousel when canvas is ready (tokens might have changed)
    Hooks.on('canvasReady', () => {
        const carousel = CombatCarouselApp.instance;
        if (carousel && carousel.rendered) {
            carousel.render({ force: false });
        }
    });
    // Hide initiative roll button (d20) and add passive selection button in combat tracker
    // Also add End Turn button for current combatant
    Hooks.on('renderCombatTracker', (_app, html) => {
        // Convert html to jQuery if needed (Foundry v13 compatibility)
        let $html;
        try {
            if (html && typeof html === 'object') {
                // Check if it's already a jQuery object
                if (html.jquery !== undefined && html.find !== undefined) {
                    $html = html;
                }
                else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
                    $html = $(html);
                }
                else if (html.length !== undefined && html[0] instanceof HTMLElement) {
                    // Might be a jQuery-like object
                    $html = $(html);
                }
                else {
                    // Try to wrap it
                    $html = $(html);
                }
            }
            else {
                $html = $(html);
            }
        }
        catch (e) {
            console.error('Mastery System | Error converting html to jQuery in renderCombatTracker:', e);
            return;
        }
        // Hide all initiative roll buttons
        $html.find('button[data-action="rollInitiative"]').css('display', 'none');
        // Add buttons to each combatant row for passive and initiative dialogs
        $html.find('.combatant').each((_index, combatantElement) => {
            const $combatant = $(combatantElement);
            const combatantId = $combatant.data('combatant-id') || $combatant.attr('data-combatant-id');
            if (!combatantId) {
                console.warn('Mastery System | [COMBAT TRACKER DEBUG] Combatant element has no ID', combatantElement);
                return;
            }
            // Find the token-initiative div
            const $initiativeDiv = $combatant.find('.token-initiative');
            if ($initiativeDiv.length === 0) {
                console.warn('Mastery System | [COMBAT TRACKER DEBUG] token-initiative div not found for combatant', combatantId);
                return;
            }
            // Remove existing buttons to prevent duplicates
            $initiativeDiv.find('.ms-passive-btn, .ms-initiative-btn, .ms-end-turn-btn, .ms-stone-powers-btn').remove();
            // Get combatant data
            const combat = game.combat;
            if (!combat)
                return;
            const combatant = combat.combatants.get(combatantId);
            if (!combatant)
                return;
            // Get initiative value and display it before the name
            // Use the shared function to ensure consistency
            // Pass $html so the function can find the combatant in the rendered HTML
            updateInitiativeDisplayInTracker(combatant, $html);
            // Check if this is the current combatant
            const isCurrent = combat.combatant?.id === combatantId;
            // Add End Turn button for current combatant
            if (isCurrent) {
                const endTurnBtn = $('<button type="button" class="combatant-control ms-end-turn-btn" data-action="endTurn" data-combatant-id="' + combatantId + '" data-tooltip="Nächster Eintrag im Initiative-Tracker (ein Zug weiter)." aria-label="Nächster Zug" title="Nächster Zug"><i class="fa-solid fa-forward"></i></button>');
                $initiativeDiv.append(endTurnBtn);
                endTurnBtn.off('click.ms-end-turn').on('click.ms-end-turn', async (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const { requestEndTurn } = await import('./combat/end-turn.js');
                    await requestEndTurn();
                });
            }
            const msFlagsRow = combat.flags?.['mastery-system'] || {};
            const encSetup = msFlagsRow.encounterSetup;
            const actorIdForPassives = combatant.actor?.id;
            const passivesLocked = actorIdForPassives && encSetup?.passives?.[actorIdForPassives]?.locked === true;
            const passiveTooltip = passivesLocked ? 'Passives ansehen (gesperrt)' : 'Passives wählen / bestätigen';
            const passiveBtn = $('<button type="button" class="combatant-control ms-passive-btn" data-action="selectPassives" data-combatant-id="' +
                combatantId +
                '" data-tooltip="' +
                passiveTooltip +
                '" aria-label="Passives" title="' +
                passiveTooltip +
                '"><i class="fa-solid fa-shield"></i></button>');
            $initiativeDiv.append(passiveBtn);
            // Add Initiative Shop button
            const initiativeBtn = $('<button type="button" class="combatant-control ms-initiative-btn" data-action="openInitiativeShop" data-combatant-id="' + combatantId + '" data-tooltip="Initiative Shop" aria-label="Initiative Shop" title="Initiative Shop"><i class="fa-solid fa-shop"></i></button>');
            $initiativeDiv.append(initiativeBtn);
            // Add Stone Powers button (only for characters)
            const actor = combatant.actor;
            if (actor && actor.type === 'character') {
                const stonePowersBtn = $('<button type="button" class="combatant-control ms-stone-powers-btn" data-action="openStonePowers" data-combatant-id="' + combatantId + '" data-tooltip="Stone Powers" aria-label="Stone Powers" title="Stone Powers"><i class="fa-solid fa-gem"></i></button>');
                $initiativeDiv.append(stonePowersBtn);
                stonePowersBtn.off('click.ms-stone-powers').on('click.ms-stone-powers', async (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!actor) {
                        ui.notifications?.error('Actor not found');
                        return;
                    }
                    try {
                        const { StonePowersDialog } = await import('./stones/stone-powers-dialog.js');
                        await StonePowersDialog.showForActor(actor, combatant);
                    }
                    catch (error) {
                        console.error('Mastery System | Error showing stone powers dialog', error);
                        ui.notifications?.error('Failed to open stone powers dialog');
                    }
                });
            }
            // Add click handlers
            passiveBtn.off('click.ms-passive').on('click.ms-passive', async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const combat = game.combat;
                if (!combat) {
                    ui.notifications?.warn('No active combat encounter');
                    return;
                }
                const combatant = combat.combatants.get(combatantId);
                if (!combatant) {
                    console.error('Mastery System | [COMBAT TRACKER DEBUG] Combatant not found', { combatantId });
                    ui.notifications?.error('Combatant not found');
                    return;
                }
                try {
                    const f = combat.flags?.['mastery-system'] || {};
                    const setupEnc = f.encounterSetup;
                    const aid = combatant.actor?.id;
                    const locked = aid && setupEnc?.passives?.[aid]?.locked === true;
                    await PassiveSelectionDialog.showForCombatant(combatant, !!locked);
                }
                catch (error) {
                    console.error('Mastery System | [COMBAT TRACKER DEBUG] Error showing passive dialog', error);
                    ui.notifications?.error('Failed to open passive selection dialog');
                }
            });
            initiativeBtn.off('click.ms-initiative').on('click.ms-initiative', async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const combat = game.combat;
                if (!combat) {
                    ui.notifications?.warn('No active combat encounter');
                    return;
                }
                const combatant = combat.combatants.get(combatantId);
                if (!combatant) {
                    console.error('Mastery System | [COMBAT TRACKER DEBUG] Combatant not found', { combatantId });
                    ui.notifications?.error('Combatant not found');
                    return;
                }
                try {
                    const actor = combatant.actor;
                    if (!actor) {
                        ui.notifications?.error('Actor not found');
                        return;
                    }
                    const { openInitiativeShopForTrackerRescue } = await import('./combat/initiative-roll.js');
                    await openInitiativeShopForTrackerRescue(combatant, combat);
                }
                catch (error) {
                    console.error('Mastery System | [COMBAT TRACKER DEBUG] Error showing initiative shop', error);
                    ui.notifications?.error('Failed to open initiative shop');
                }
            });
        });
        // Add "Begin Encounter" and "Select Passives" buttons to encounter controls
        const encounterControls = $html.find('.encounter-controls');
        if (encounterControls.length > 0) {
            // Remove any existing buttons to prevent duplicates
            encounterControls.find('.ms-begin-encounter-btn, .ms-passive-selection-btn').remove();
            // Add button to the left control buttons area
            const leftControls = encounterControls.find('.control-buttons.left');
            if (leftControls.length > 0) {
                const combat = game.combat;
                // Add "Begin Encounter" button (GM only)
                if (combat && game.user?.isGM) {
                    // Check if encounter setup has started
                    const flags = combat.flags['mastery-system'] || {};
                    const setup = flags.encounterSetup;
                    const isStarted = setup?.started === true || combat.round > 0;
                    const beginBtn = $('<button type="button" class="inline-control combat-control icon fa-solid fa-play ms-begin-encounter-btn" data-action="beginEncounter" data-tooltip="Begin Encounter" aria-label="Begin Encounter"></button>');
                    if (isStarted) {
                        beginBtn.prop('disabled', true).addClass('disabled');
                        beginBtn.attr('data-tooltip', 'Encounter already initialized');
                    }
                    leftControls.prepend(beginBtn);
                    // Add click handler
                    beginBtn.off('click.ms-begin').on('click.ms-begin', async (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        const combat = game.combat;
                        if (!combat) {
                            ui.notifications?.warn('No active combat encounter');
                            return;
                        }
                        // Check if already started
                        const flags = combat.flags['mastery-system'] || {};
                        const setup = flags.encounterSetup;
                        if (setup?.started === true || combat.round > 0) {
                            ui.notifications?.warn('Encounter already initialized');
                            return;
                        }
                        try {
                            await beginEncounter(combat);
                        }
                        catch (error) {
                            console.error('Mastery System | Error beginning encounter', error);
                            ui.notifications?.error('Failed to begin encounter');
                        }
                    });
                }
                // Add "Select Passives" button (legacy, for manual use)
                const passiveBtn = $('<button type="button" class="inline-control combat-control icon fa-solid fa-shield ms-passive-selection-btn" data-action="selectPassives" data-tooltip="Select Passives" aria-label="Select Passives"></button>');
                leftControls.append(passiveBtn);
                // Add click handler
                passiveBtn.off('click.ms-passive').on('click.ms-passive', async (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const combat = game.combat;
                    if (!combat) {
                        ui.notifications?.warn('No active combat encounter');
                        return;
                    }
                    try {
                        await PassiveSelectionDialog.showForCombat(combat);
                    }
                    catch (error) {
                        console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error showing passive selection dialog', error);
                        ui.notifications?.error('Failed to open passive selection dialog');
                    }
                });
            }
        }
    });
    // Cleanup: Remove any stray passive-selection-overlay and initiative-shop-dialog elements from body
    Hooks.on('renderApplication', (app) => {
        // If any application is rendered, check for stray overlay elements
        // This ensures cleanup even if the dialog wasn't closed properly
        if (app.id !== 'mastery-passive-selection') {
            $('body > .passive-selection-overlay').remove();
        }
        if (app.id !== 'mastery-initiative-shop') {
            $('body > .initiative-shop-dialog').remove();
        }
    });
    // Initialize passive combat-trigger framework (temp HP from passives,
    // combat-start one-shots, turn-start refresh pools). Registered BEFORE
    // stone hooks so the trigger effects are in place when stone-power flows
    // read actor state later in the same event tick.
    Hooks.on('combatStart', async (combat) => {
        try {
            await applyPassiveTriggerToCombat('combatStart', combat);
        }
        catch (err) {
            console.error('Mastery System | passive-triggers combatStart failed', err);
        }
    });
    Hooks.on('updateCombat', async (combat, changes) => {
        if (changes?.turn === undefined)
            return;
        // End-of-turn resolution for the creature whose turn just ended (Slow).
        try {
            const prevId = combat?.previous?.combatantId;
            const endingActor = prevId ? combat?.combatants?.get?.(prevId)?.actor : null;
            if (endingActor) {
                const { processTurnEndMovement } = await import('./combat/movement-tracker.js');
                await processTurnEndMovement(endingActor);
            }
        }
        catch (err) {
            console.error('Mastery System | turn-end movement resolution failed', err);
        }
        const currentCombatant = combat?.combatant;
        const turnActor = currentCombatant?.actor;
        if (!turnActor)
            return;
        try {
            await applyPassiveTrigger(turnActor, 'turnStartSelf', combat);
        }
        catch (err) {
            console.error('Mastery System | passive-triggers turnStartSelf failed', err);
        }
        try {
            const { processTurnStartStatusTick, announceStatusTick } = await import('./combat/status-tick.js');
            const summary = await processTurnStartStatusTick(turnActor);
            await announceStatusTick(turnActor, summary);
        }
        catch (err) {
            console.error('Mastery System | status-tick turnStart failed', err);
        }
        try {
            const { resetMovementForTurn } = await import('./combat/movement-tracker.js');
            await resetMovementForTurn(turnActor);
        }
        catch (err) {
            console.error('Mastery System | movement reset failed', err);
        }
    });
    Hooks.on('updateToken', async (tokenDoc, changes) => {
        try {
            const { handleTokenMovement } = await import('./combat/movement-tracker.js');
            await handleTokenMovement(tokenDoc, changes);
        }
        catch (err) {
            console.error('Mastery System | token movement tracking failed', err);
        }
    });
    Hooks.on('combatEnd', async (combat) => {
        try {
            await clearTempHPSourcesForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | passive-triggers combatEnd cleanup failed', err);
        }
        try {
            await clearPhasingForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | phasing combatEnd cleanup failed', err);
        }
        try {
            const { clearBloodRaiseHpFlagForCombat } = await import('./combat/spell-roll-handler.js');
            await clearBloodRaiseHpFlagForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | spell-roll-handler combatEnd cleanup failed', err);
        }
    });
    Hooks.on('deleteCombat', async (combat) => {
        try {
            await clearTempHPSourcesForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | passive-triggers deleteCombat cleanup failed', err);
        }
        try {
            await clearPhasingForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | phasing deleteCombat cleanup failed', err);
        }
        try {
            const { clearBloodRaiseHpFlagForCombat } = await import('./combat/spell-roll-handler.js');
            await clearBloodRaiseHpFlagForCombat(combat);
        }
        catch (err) {
            console.error('Mastery System | spell-roll-handler deleteCombat cleanup failed', err);
        }
    });
    // Active-buff activation mid-combat: the continuous modifiers (armor/evade)
    // are picked up automatically via prepareDerivedData, but trigger-based
    // effects (triggers.combatStart.tempHP / triggers.turnStartSelf.tempHP) need
    // an explicit dispatch when the effect appears, otherwise a buff cast on
    // round 3 never materialises its Temp HP pool until the next turn/combat.
    Hooks.on('createActiveEffect', async (effect) => {
        try {
            const flags = effect?.flags?.['mastery-system'];
            if (!flags || flags.activeBuff !== true)
                return;
            const actor = effect.parent;
            if (!actor)
                return;
            await applyBuffTriggersOnActivate(actor, effect, game.combat ?? null);
        }
        catch (err) {
            console.error('Mastery System | passive-triggers createActiveEffect failed', err);
        }
    });
    Hooks.on('deleteActiveEffect', async (effect) => {
        try {
            const flags = effect?.flags?.['mastery-system'];
            if (!flags || flags.activeBuff !== true)
                return;
            const actor = effect.parent;
            if (!actor)
                return;
            const effectId = String(effect.id ?? effect._id ?? '').trim();
            if (!effectId)
                return;
            await clearTempHPSourcesForBuffEffect(actor, effectId);
            // Phasing augments (Ghost Mantle) vanish with the buff they rode on.
            await removeAugmentCharges(actor, effectId);
            // Growth Form (Titan Scars): restore the token's original size.
            if (flags.growthForm === true) {
                const { restoreGrowthFromEffect } = await import('./utils/artifact-active-buffs.js');
                await restoreGrowthFromEffect(effect);
            }
        }
        catch (err) {
            console.error('Mastery System | passive-triggers deleteActiveEffect cleanup failed', err);
        }
    });
    // Initialize stone system hooks (turn state, regen, restore)
    initializeStoneHooks();
    // Initialize encounter start system
    initializeEncounterStart();
    initializeEpicMasteryRoll();
    initializeTyhraCalendar();
    initializeProseMirrorFontColor();
    // Initialize token action selector
    initializeTokenActionSelector();
    // Keep radial inner labels (Move / Atk / … counts) in sync when round state changes elsewhere (e.g. chat roll)
    Hooks.on('masterySystem.roundStateUpdated', ({ actorId }) => {
        const actor = game.actors?.get(actorId);
        if (actor)
            void refreshRadialMenuActionLabelsIfOpenForActor(actor);
    });
    // Same as above: custom hook can miss some flag sync paths; document updates always reach the client.
    Hooks.on('updateActor', (actor, changed) => {
        if (changed.flags?.['mastery-system'] !== undefined) {
            void refreshRadialMenuActionLabelsIfOpenForActor(actor);
        }
    });
    Hooks.on('updateToken', (tokenDoc, changed) => {
        const ms = changed.actorData?.flags?.['mastery-system'] ?? changed.flags?.['mastery-system'];
        if (ms === undefined)
            return;
        const token = canvas.tokens?.get(tokenDoc.id);
        if (token?.actor)
            void refreshRadialMenuActionLabelsIfOpenForActor(token.actor);
    });
    // Initialize turn indicator (blue ring around active combatant)
    initializeTurnIndicator();
    // Register radial menu hooks for hover preview suppression
    Hooks.on('masterySystem.radialMenuOpened', handleRadialMenuOpened);
    Hooks.on('masterySystem.radialMenuClosed', handleRadialMenuClosed);
    // Preload Handlebars templates
    await preloadTemplates();
    // Public API for homepage / external tools
    const mod = game.modules?.get('mastery-system');
    if (mod) {
        mod.api = {
            ...(mod.api ?? {}),
            CHARACTER_IMPORT_SCHEMA_VERSION,
            parseCharacterImport: parseCharacterImportJson,
            validateCharacterImport: validateCharacterImportDocument,
            validateCharacterImportJson,
            importCharacter: importMasteryCharacter,
            importCharacterFromJson: importMasteryCharacterFromJson,
            showCharacterImportDialog,
            requestEpicMasteryRoll,
            getActiveEpicMasteryRollSession,
        };
    }
});
/**
 * Register Handlebars helpers immediately (before init)
 * This ensures helpers are available when templates are first rendered
 */
function registerHandlebarsHelpersImmediate() {
    // Default/fallback helper: {{default value fallback}}
    Handlebars.registerHelper('default', function (value, fallback) {
        return value !== undefined && value !== null ? value : fallback;
    });
    // Calculate stones from an attribute value: {{calculateStones value}}
    Handlebars.registerHelper('calculateStones', function (value) {
        const num = Number(value) || 0;
        return calculateStones(num);
    });
    // Repeat block n times: {{#times n}}...{{/times}}
    Handlebars.registerHelper('times', function (count, block) {
        const n = Number(count) || 0;
        let accum = '';
        for (let i = 0; i < n; i++) {
            accum += block.fn(i);
        }
        return accum;
    });
    // Simple arithmetic helpers
    Handlebars.registerHelper('add', function (a, b) {
        return (Number(a) || 0) + (Number(b) || 0);
    });
    Handlebars.registerHelper('subtract', function (a, b) {
        return (Number(a) || 0) - (Number(b) || 0);
    });
    // Helper to create arrays
    Handlebars.registerHelper('array', function (...args) {
        args.pop(); // Remove Handlebars options object
        return args;
    });
    // Helper for greater than comparison
    Handlebars.registerHelper('gt', function (a, b) {
        return (Number(a) || 0) > (Number(b) || 0);
    });
    // Helper for greater than or equal comparison
    Handlebars.registerHelper('gte', function (a, b) {
        return (Number(a) || 0) >= (Number(b) || 0);
    });
    // Helper for less than or equal comparison
    Handlebars.registerHelper('lte', function (a, b) {
        return (Number(a) || 0) <= (Number(b) || 0);
    });
    // Helper for less than comparison
    Handlebars.registerHelper('lt', function (a, b) {
        return (Number(a) || 0) < (Number(b) || 0);
    });
    // Helper for incrementing (for 1-based indexing)
    Handlebars.registerHelper('inc', function (value) {
        return parseInt(String(value)) + 1;
    });
    /** Coerce to string (e.g. level index for levels["5"] lookup). */
    Handlebars.registerHelper('str', function (value) {
        return String(value ?? '');
    });
    // Render inline Markdown emphasis (**bold** / *italic*) as HTML. Power effect
    // text is authored with Markdown (matching the rules .md tables); without this
    // the sheet would print the literal `**` asterisks. HTML-escapes first, so it
    // is safe to emit with a normal `{{mdInline ...}}` stache.
    Handlebars.registerHelper('mdInline', function (value) {
        const escaped = String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const html = escaped
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
        return new Handlebars.SafeString(html);
    });
    Handlebars.registerHelper('isNil', function (value) {
        return value == null;
    });
    // Helper for creating a range array: {{#each (range 1 8)}}...{{/each}}
    Handlebars.registerHelper('range', function (start, end) {
        const startNum = Number(start) || 1;
        const endNum = Number(end) || 8;
        const result = [];
        for (let i = startNum; i <= endNum; i++) {
            result.push(i);
        }
        return result;
    });
    /** Concatenate strings for form paths: {{concat "system.phases." phaseIndex ".npcBaseAttack"}} */
    Handlebars.registerHelper('concat', function (...args) {
        // Last arg is Handlebars options hash
        return args.slice(0, -1).map((a) => (a == null ? '' : String(a))).join('');
    });
    // Helper for multiplication
    Handlebars.registerHelper('multiply', function (a, b) {
        return a * b;
    });
    // Helper for division
    Handlebars.registerHelper('divide', function (a, b) {
        if (b === 0)
            return 0;
        return a / b;
    });
    // Helper to check if user is GM
    Handlebars.registerHelper('userIsGM', function () {
        return game.user?.isGM ?? false;
    });
    // Helper for equality comparison
    Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
    });
    /** Loose numeric equality for select values (DOM strings vs stored numbers). */
    Handlebars.registerHelper('eqNum', function (a, b) {
        if (a === b)
            return true;
        const na = Number(a);
        const nb = Number(b);
        return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
    });
    // Helper for equality comparison (block helper): {{#ifEquals a b}}...{{/ifEquals}}
    Handlebars.registerHelper('ifEquals', function (a, b, options) {
        if (a === b) {
            return options.fn(this);
        }
        return options.inverse ? options.inverse(this) : '';
    });
    // Helper for not equal comparison
    Handlebars.registerHelper('ne', function (a, b) {
        return a !== b;
    });
    // Logical AND helper
    Handlebars.registerHelper('and', function (...args) {
        // Remove the last argument (options object)
        const values = args.slice(0, -1);
        return values.every((v) => v);
    });
    // Helper to check if value is an array
    Handlebars.registerHelper('isArray', function (value) {
        return Array.isArray(value);
    });
    // Helper to capitalize first letter
    Handlebars.registerHelper('capitalize', function (str) {
        if (!str)
            return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    // Helper to reduce array (sum)
    Handlebars.registerHelper('reduce', function (array, initial, property) {
        if (!Array.isArray(array))
            return initial;
        return array.reduce((sum, item) => sum + (item[property] || 0), initial);
    });
    // Helper to lookup value in object
    Handlebars.registerHelper('lookup', function (obj, key) {
        return obj && obj[key];
    });
    // Helper to check if array contains value
    Handlebars.registerHelper('contains', function (array, value) {
        if (!Array.isArray(array))
            return false;
        return array.includes(value);
    });
    // Helper to get type of value
    Handlebars.registerHelper('typeof', function (value) {
        return typeof value;
    });
    // Helper to determine power category (Melee/Melee AoE/Range/Range AoE)
    Handlebars.registerHelper('powerCategory', function (range, aoe) {
        const rangeStr = (range || '').toString().trim().toLowerCase();
        const aoeStr = (aoe || '').toString().trim();
        // Check if it's ranged (has range value and not melee)
        const hasRange = rangeStr !== '' && rangeStr !== '0m' && rangeStr !== '0' && !rangeStr.includes('melee') && !rangeStr.includes('touch');
        // Check if it has AoE
        const hasAoe = aoeStr !== '' && aoeStr !== '—' && aoeStr !== '-' && aoeStr !== 'none';
        if (hasRange && hasAoe)
            return 'Range AoE';
        if (hasRange)
            return 'Range';
        if (hasAoe)
            return 'Melee AoE';
        return 'Melee';
    });
    // Helper to format power type display
    Handlebars.registerHelper('powerTypeDisplay', function (powerType) {
        if (!powerType)
            return 'Active';
        const typeMap = {
            'active': 'Active',
            'active-buff': 'Active Buff',
            'buff': 'Active Buff',
            'utility': 'Utility',
            'passive': 'Passive',
            'reaction': 'Reaction',
            'movement': 'Movement'
        };
        return typeMap[powerType.toLowerCase()] || 'Active';
    });
    // Helper to format damage display
    Handlebars.registerHelper('powerDamage', function (damage) {
        if (!damage || damage.trim() === '')
            return '—';
        return damage;
    });
    // Helper to format specials display
    Handlebars.registerHelper('powerSpecials', function (specials) {
        if (!specials || !Array.isArray(specials) || specials.length === 0)
            return '—';
        // Support both old (string[]) and new (PowerSpecial[]) structures
        if (typeof specials[0] === 'string') {
            return specials.join(', ');
        }
        // New structure: PowerSpecial[]
        return specials.map((spec) => {
            if (spec.value !== undefined) {
                return `${spec.key}(${spec.value})`;
            }
            return spec.key;
        }).join(', ');
    });
    // Helper to render RangeSpec
    Handlebars.registerHelper('renderRange', function (range) {
        if (!range || typeof range !== 'object')
            return '—';
        if (range.kind === 'self')
            return 'Self';
        if (range.kind === 'touch')
            return 'Touch';
        if (range.kind === 'distance') {
            if (range.m !== undefined) {
                return `${range.m}m${range.note ? ` (${range.note})` : ''}`;
            }
            return 'Distance';
        }
        return 'N/A';
    });
    // Helper to render AoeSpec
    Handlebars.registerHelper('renderAoe', function (aoe) {
        if (!aoe || typeof aoe !== 'object')
            return '—';
        if (aoe.shape === 'none' || aoe.shape === 'single')
            return '—';
        const radiusM = aoe.radiusM !== undefined ? aoe.radiusM : aoe.m;
        const lengthM = aoe.lengthM !== undefined ? aoe.lengthM : aoe.m;
        if (aoe.shape === 'line') {
            if (lengthM !== undefined) {
                return `Line ${lengthM}m${aoe.widthM ? ` × ${aoe.widthM}m` : ''}`;
            }
            return 'Line';
        }
        if (aoe.shape === 'radius') {
            if (radiusM !== undefined) {
                return `Radius ${radiusM}m`;
            }
            return 'Radius';
        }
        if (aoe.shape === 'cone') {
            if (lengthM !== undefined) {
                return `Cone ${lengthM}m${aoe.angleDeg ? ` (${aoe.angleDeg}°)` : ''}`;
            }
            return 'Cone';
        }
        if (aoe.shape === 'burst') {
            if (radiusM !== undefined) {
                return `Burst ${radiusM}m`;
            }
            return 'Burst';
        }
        if (aoe.shape === 'weapon')
            return 'Weapon';
        if (aoe.shape === 'aura') {
            if (radiusM !== undefined) {
                return `Aura ${radiusM}m`;
            }
            return 'Aura';
        }
        return aoe.note || '—';
    });
    // Helper to render DurationSpec
    Handlebars.registerHelper('renderDuration', function (duration) {
        if (!duration || typeof duration !== 'object')
            return 'N/A';
        if (duration.kind === 'instant')
            return 'Instant';
        if (duration.kind === 'rounds') {
            if (duration.rounds !== undefined) {
                return `${duration.rounds} Round${duration.rounds !== 1 ? 's' : ''}${duration.note ? ` (${duration.note})` : ''}`;
            }
            return 'Rounds';
        }
        if (duration.kind === 'masteryRankRounds')
            return 'MR Rounds';
        if (duration.kind === 'untilNextTurn')
            return 'Until Next Turn';
        return duration.note || 'N/A';
    });
    // Helper to check if power uses new structure
    Handlebars.registerHelper('isNewPowerStructure', function (power) {
        return power && typeof power === 'object' && power.levels && typeof power.levels === 'object' && !Array.isArray(power.levels);
    });
    /** Rank row (1–4) used for definition lookup from actor power level */
    Handlebars.registerHelper('powerDefinitionRank', function (system) {
        return getPowerDefinitionRank(system?.level, system?.levels);
    });
    /** Whether this table row matches the effective definition rank for the actor's power level */
    Handlebars.registerHelper('selectedPowerTableRow', function (rowKey, system) {
        const r = getPowerDefinitionRank(system?.level, system?.levels);
        return Number(rowKey) === r;
    });
    // Helper to get array/string length
    // This must be registered before templates are compiled
    Handlebars.registerHelper('length', function (value) {
        if (value === null || value === undefined)
            return 0;
        if (Array.isArray(value)) {
            return value.length;
        }
        if (typeof value === 'string') {
            return value.length;
        }
        if (typeof value === 'object') {
            return Object.keys(value).length;
        }
        return 0;
    });
    // Helper to check if value is an object (not array, not null)
    Handlebars.registerHelper('isObject', function (value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    });
    // Verify helper is registered
    if (!Handlebars.helpers.length) {
        console.error('Mastery System | Failed to register length helper!');
    }
    else {
    }
}
/**
 * Register additional Handlebars helpers that need to be available after init
 * @deprecated - Helpers are now registered in registerHandlebarsHelpersImmediate
 */
// @ts-ignore - unused function kept for potential future use
function registerAdditionalHandlebarsHelpers() {
    // Helper to get array/string length (if not already registered)
    if (!Handlebars.helpers.length) {
        Handlebars.registerHelper('length', function (value) {
            if (Array.isArray(value)) {
                return value.length;
            }
            if (typeof value === 'string') {
                return value.length;
            }
            if (value && typeof value === 'object') {
                return Object.keys(value).length;
            }
            return 0;
        });
    }
}
/**
 * Apply theme class to document.body
 */
function applyThemeClass(theme) {
    // Remove all existing theme classes
    document.body.classList.remove('ms-theme-rulebook', 'ms-theme-ember', 'ms-theme-ashen', 'ms-theme-bloodmoon');
    // Add new theme class
    if (theme) {
        document.body.classList.add(`ms-theme-${theme}`);
    }
}
/**
 * Register system settings
 */
/** GM/macro helpers — registered on init so console macros work as soon as the world loads. */
function exposeMasterySystemApi() {
    game.masterySystem = Object.assign(game.masterySystem || {}, {
        refreshEchoArtifacts: forceRefreshEchoArtifactLibrary,
        openTowerWizard: showTowerWizardDialog,
        openEncounterGenerator: showEncounterGeneratorDialog,
        // Force-rebuild every template-backed Power's baked level table from the
        // current catalog templates (use after editing/auditing power templates).
        resyncPowers: () => runPowerTemplateResyncMigration({ force: true, notify: true }),
    });
}
function registerSystemSettings() {
    // Example setting: auto-calculate derived values
    game.settings.register('mastery-system', 'autoCalculate', {
        name: 'Auto-Calculate Derived Values',
        hint: 'Automatically calculate Stones, Health Bars, and other derived values',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    // GM "button": toggling this on force-refreshes the Echo Artifact library
    // (rebuilds every seeded tree from the current generator and pushes the
    // refresh to embedded actor copies), then resets itself to off.
    game.settings.register('mastery-system', 'refreshEchoArtifacts', {
        name: 'Refresh Artifact Library',
        hint: 'Enable and Save to rebuild all Echo Artifact and General Artifact trees in the world from the latest data (icons, base values, abilities). Also repairs incomplete trees (e.g. 1/10 nodes) and creates any missing General Artifacts. Resets automatically.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: async (value) => {
            if (!value)
                return;
            try {
                if (game.user?.isGM)
                    await forceRefreshEchoArtifactLibrary();
            }
            finally {
                await game.settings.set('mastery-system', 'refreshEchoArtifacts', false);
            }
        },
    });
    // Mastery Rank - Global default
    game.settings.register('mastery-system', 'defaultMasteryRank', {
        name: 'Default Mastery Rank',
        hint: 'Start-MR für neue Charaktere ohne gespeicherten Rank. Pro Charakter setzt der GM den MR am Bogen (Dropdown). Kein Auto-Rank-Up aus Stones.',
        scope: 'world',
        config: true,
        type: Number,
        default: 2,
        range: {
            min: 1,
            max: 20,
            step: 1
        }
    });
    // Mastery Rank per player (stored as object with player IDs as keys)
    game.settings.register('mastery-system', 'playerMasteryRanks', {
        name: 'Player Mastery Ranks',
        hint: 'Mastery Rank per player (overrides global default)',
        scope: 'world',
        config: false,
        type: Object,
        default: {}
    });
    // Combat Carousel Settings
    game.settings.register('mastery-system', 'carouselResource1Path', {
        name: 'Carousel Resource 1 Path',
        hint: 'Path to first tracked resource (e.g., tracked.hp)',
        scope: 'world',
        config: true,
        type: String,
        default: 'tracked.hp'
    });
    game.settings.register('mastery-system', 'carouselResource1Label', {
        name: 'Carousel Resource 1 Label',
        hint: 'Display label for first resource',
        scope: 'world',
        config: true,
        type: String,
        default: 'HP'
    });
    game.settings.register('mastery-system', 'carouselResource2Path', {
        name: 'Carousel Resource 2 Path',
        hint: 'Path to second tracked resource (e.g., tracked.stress)',
        scope: 'world',
        config: true,
        type: String,
        default: 'tracked.stress'
    });
    game.settings.register('mastery-system', 'carouselResource2Label', {
        name: 'Carousel Resource 2 Label',
        hint: 'Display label for second resource',
        scope: 'world',
        config: true,
        type: String,
        default: 'Stress'
    });
    // Character XP Management (inline in settings)
    game.settings.register('mastery-system', 'characterXpManagement', {
        name: 'Character XP Management',
        hint: 'Manage Attribute XP and Mastery XP for all player characters',
        scope: 'world',
        config: true,
        type: Object,
        default: {},
        restricted: true
    });
    // Default scene background image
    game.settings.register('mastery-system', 'defaultSceneImage', {
        name: 'Default Scene Background Image',
        hint: 'Default background image path for new scenes (leave empty to use Foundry default)',
        scope: 'world',
        config: true,
        type: String,
        default: 'systems/mastery-system/assets/banner.jpg',
        filePicker: 'image'
    });
    // UI Theme setting
    game.settings.register('mastery-system', 'uiTheme', {
        name: 'UI Theme',
        hint: 'Choose the visual theme for Mastery System dialogs and UI',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'rulebook': 'Rulebook',
            'ember': 'Ember',
            'ashen': 'Ashen',
            'bloodmoon': 'Bloodmoon'
        },
        default: 'rulebook',
        onChange: (value) => {
            applyThemeClass(value);
        }
    });
}
/**
 * Setup XP Management inline in settings
 */
function setupXpManagementInline() {
    // Hook into settings rendering to add custom UI
    Hooks.on('renderSettingsConfig', (app, html, _data) => {
        // In Foundry v13, html might be an HTMLElement, jQuery, or a different structure
        // Convert to jQuery if needed
        let $html;
        try {
            if (html && typeof html === 'object') {
                // Check if it's already a jQuery object
                if (html.jquery !== undefined && html.find !== undefined) {
                    $html = html;
                }
                else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
                    $html = $(html);
                }
                else if (html.length !== undefined && html[0] instanceof HTMLElement) {
                    // Might be a jQuery-like object
                    $html = $(html);
                }
                else {
                    // Try to wrap it
                    $html = $(html);
                }
            }
            else {
                $html = $(html);
            }
        }
        catch (e) {
            console.error('Mastery System | Error converting html to jQuery:', e);
            return;
        }
        // Find the Character XP Management setting
        const xpSetting = $html.find('[name="mastery-system.characterXpManagement"]').closest('.form-group');
        if (xpSetting.length === 0) {
            return;
        }
        // Replace the default input with our custom UI
        const settingInput = xpSetting.find('input, select, textarea');
        const customContainer = $('<div class="mastery-xp-management-inline"></div>');
        // Get all player characters
        const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
        // Build the UI
        let htmlContent = '<div class="xp-management-header"><h3><i class="fas fa-coins"></i> Character XP Management</h3>';
        htmlContent += '<p class="hint">Regular XP: Session-Vergabe (max. +1 pro Attribut/Skill/Power/Artefakt pro Upgrade Step). ';
        htmlContent += '<strong>Free XP</strong>: frei verteilbar ohne Step-Limit. Die Flagge beendet nur den aktuellen Step — sie ersetzt kein Free XP.</p></div>';
        // Bulk Grant Section
        htmlContent += '<div class="bulk-grant-section"><h4>Bulk Grant XP</h4>';
        htmlContent += '<div class="bulk-grant-controls">';
        htmlContent += '<div class="bulk-grant-group"><label>Regular XP:</label>';
        htmlContent += '<input type="number" class="bulk-xp-amount" min="0" value="0" />';
        htmlContent += '<button type="button" class="bulk-grant-btn" title="Session-XP an alle (Once-per-Step gilt)"><i class="fas fa-gift"></i> Grant to All</button></div>';
        htmlContent += '<div class="bulk-grant-group"><label>Free XP:</label>';
        htmlContent += '<input type="number" class="bulk-free-xp-amount" min="0" value="0" />';
        htmlContent += '<button type="button" class="bulk-grant-free-btn" title="Free XP an alle (frei verteilbar, kein Step-Limit)"><i class="fas fa-star"></i> Grant Free to All</button></div>';
        htmlContent += '<div class="bulk-grant-group bulk-reset-group"><button type="button" class="bulk-reset-xp-account-btn" title="XP-Konten und History für alle Charaktere auf 0"><i class="fas fa-eraser"></i> Reset XP (All)</button></div>';
        htmlContent += '</div></div>';
        // Characters Table — new spec: surface the once-per-step bump summary
        // in place of the legacy `maxAttributeSpend` column.
        htmlContent += '<div class="characters-list"><table class="xp-table xp-table-compact"><thead><tr>';
        htmlContent += '<th>Character</th><th>Player</th><th>Spent</th><th>Avail.</th><th>Free Avail.</th><th>Earned</th><th>Step bumps</th><th>Actions</th>';
        htmlContent += '</tr></thead><tbody>';
        if (characters.length === 0) {
            htmlContent += '<tr><td colspan="8" class="empty-message"><i class="fas fa-info-circle"></i> No player characters found.</td></tr>';
        }
        else {
            const sanitize = (input) => Array.isArray(input) ? input.map((v) => String(v ?? '')).filter((s) => s.length > 0) : [];
            characters.forEach((actor) => {
                const system = actor.system || {};
                const points = system.points || {};
                const xp = system.xp || {};
                const totalEarned = xp.totalEarned ?? 0;
                const totalSpent = xp.totalSpent ?? 0;
                const available = points.xp ?? 0;
                const freeAvailable = points.xpFree ?? 0;
                const freeEarned = xp.freeEarned ?? 0;
                const stepRaw = xp.currentStep ?? {};
                const stepAttrs = sanitize(stepRaw.attributes);
                const stepSkills = sanitize(stepRaw.skills);
                const stepPowers = sanitize(stepRaw.powers);
                const stepArtifacts = sanitize(stepRaw.artifacts);
                const stepTotal = stepAttrs.length + stepSkills.length + stepPowers.length + stepArtifacts.length;
                const stepSummaryParts = [];
                if (stepAttrs.length)
                    stepSummaryParts.push(`Attrs: ${stepAttrs.join(', ')}`);
                if (stepSkills.length)
                    stepSummaryParts.push(`Skills: ${stepSkills.join(', ')}`);
                if (stepPowers.length)
                    stepSummaryParts.push(`Powers: ${stepPowers.length}`);
                if (stepArtifacts.length)
                    stepSummaryParts.push(`Artifacts: ${stepArtifacts.length}`);
                const stepSummary = stepSummaryParts.length ? stepSummaryParts.join(' | ') : 'No bumps this step';
                const playerName = game.users?.find((u) => u.character?.id === actor.id)?.name || 'Unassigned';
                const isGM = game.user?.isGM;
                const hasSnap = actorHasPostCreationSnapshot(actor);
                const resetBtn = isGM
                    ? `<button type="button" class="reset-progress-xp-btn" data-character-id="${actor.id}" title="Reset to post-creation (attributes, skills, powers). All earned XP becomes available."${hasSnap ? '' : ' disabled'}><i class="fas fa-undo"></i></button>`
                    : '';
                htmlContent += `<tr data-character-id="${actor.id}">`;
                htmlContent += `<td class="character-cell"><img src="${actor.img}" alt="${actor.name}" class="character-avatar" /><span class="character-name">${actor.name}</span></td>`;
                htmlContent += `<td class="player-cell">${playerName}</td>`;
                htmlContent += `<td class="xp-cell"><strong>${totalSpent}</strong></td>`;
                htmlContent += `<td class="xp-cell"><strong>${available}</strong></td>`;
                htmlContent += `<td class="xp-cell xp-cell-free" title="Free XP verfügbar (${freeEarned} vergeben gesamt)"><strong>${freeAvailable}</strong></td>`;
                htmlContent += `<td class="xp-cell"><strong>${totalEarned}</strong></td>`;
                htmlContent += `<td class="xp-cell" title="${stepSummary.replace(/"/g, '&quot;')}">${stepTotal}</td>`;
                htmlContent += `<td class="grant-cell"><div class="grant-controls">`;
                htmlContent += `<div class="grant-group"><input type="number" class="xp-amount-input" data-character-id="${actor.id}" min="0" value="0" placeholder="+" title="Regular XP (Session)" />`;
                htmlContent += `<button type="button" class="grant-xp-btn" data-character-id="${actor.id}" title="Regular XP vergeben"><i class="fas fa-plus"></i></button>`;
                htmlContent += `<button type="button" class="deduct-xp-btn" data-character-id="${actor.id}" title="Reguläre XP zurücknehmen (nur noch nicht ausgegebene)"><i class="fas fa-minus"></i></button></div>`;
                htmlContent += `<div class="grant-group grant-group-free"><input type="number" class="free-xp-amount-input" data-character-id="${actor.id}" min="0" value="0" placeholder="+" title="Free XP (frei verteilbar)" />`;
                htmlContent += `<button type="button" class="grant-free-xp-btn" data-character-id="${actor.id}" title="Free XP vergeben — kein Step-Limit"><i class="fas fa-star"></i></button>`;
                htmlContent += `<button type="button" class="deduct-free-xp-btn" data-character-id="${actor.id}" title="Free XP zurücknehmen (nur noch nicht ausgegebene)"><i class="fas fa-minus"></i></button></div>`;
                htmlContent += `<div class="xp-row-actions">`;
                htmlContent += `<button type="button" class="end-xp-step-btn" data-character-id="${actor.id}" title="Upgrade Step beenden: +1-Limit-Listen leeren. Erlaubt im nächsten Step erneut +1 auf dasselbe Attribut/Skill — ersetzt kein Free XP."><i class="fas fa-flag-checkered"></i></button>`;
                htmlContent += `<button type="button" class="history-xp-btn" data-character-id="${actor.id}" title="XP History"><i class="fas fa-history"></i></button>`;
                if (isGM) {
                    htmlContent += `<button type="button" class="recalc-xp-btn" data-character-id="${actor.id}" title="XP neu berechnen: Verfügbar = Verdient − tatsächlich investierte XP (Attribute/Skills/Powers). Korrigiert fehlerhafte History-Erstattungen."${hasSnap ? '' : ' disabled'}><i class="fas fa-calculator"></i></button>`;
                    htmlContent += `<button type="button" class="reset-xp-account-btn" data-character-id="${actor.id}" title="XP-Konten und History auf 0 (Attribute/Skills bleiben)"><i class="fas fa-eraser"></i></button>`;
                }
                htmlContent += resetBtn;
                htmlContent += `</div></div></td></tr>`;
            });
        }
        htmlContent += '</tbody></table></div>';
        customContainer.html(htmlContent);
        // Replace the input
        settingInput.hide();
        settingInput.after(customContainer);
        // Helper function to get XP state
        const getXpState = (actor) => {
            const system = actor.system || {};
            const points = system.points || {};
            const xp = system.xp || {};
            return {
                available: points.xp ?? 0,
                freeAvailable: points.xpFree ?? 0,
                freeEarned: xp.freeEarned ?? 0,
                totalEarned: xp.totalEarned ?? 0,
                totalSpent: xp.totalSpent ?? 0,
                history: xp.history ?? []
            };
        };
        // Helper function to push XP history
        const pushXpHistory = (actor, entry) => {
            const system = actor.system || {};
            if (!system.xp) {
                system.xp = { totalEarned: 0, totalSpent: 0, history: [] };
            }
            if (!system.xp.history) {
                system.xp.history = [];
            }
            system.xp.history.push(entry);
            if (system.xp.history.length > 200) {
                system.xp.history = system.xp.history.slice(-200);
            }
        };
        // Grant XP button
        customContainer.find('.grant-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const amount = parseInt(button.siblings('.xp-amount-input').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const beforeState = {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            };
            const updates = {
                'system.points.xp': xpState.available + amount,
                'system.xp.totalEarned': xpState.totalEarned + amount
            };
            if (!actor.system.xp) {
                updates['system.xp.totalSpent'] = 0;
                updates['system.xp.history'] = [];
            }
            await actor.update(updates);
            // Add history entry
            const user = game.user;
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: 'grant',
                category: 'xp',
                amount: amount,
                before: beforeState,
                after: {
                    available: xpState.available + amount,
                    totalEarned: xpState.totalEarned + amount,
                    totalSpent: xpState.totalSpent,
                }
            };
            pushXpHistory(actor, historyEntry);
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            ui.notifications?.info(`Granted ${amount} regular XP to ${actor.name}.`);
            // Re-render settings to update display
            app.render();
        });
        // Grant Free XP button (no once-per-step limit on the character sheet)
        customContainer.find('.grant-free-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const amount = parseInt(button.siblings('.free-xp-amount-input').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const beforeState = {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            };
            const updates = {
                'system.points.xpFree': xpState.freeAvailable + amount,
                'system.xp.freeEarned': xpState.freeEarned + amount,
            };
            if (!actor.system.xp) {
                updates['system.xp.totalSpent'] = 0;
                updates['system.xp.history'] = [];
            }
            await actor.update(updates);
            const user = game.user;
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: 'grant',
                category: 'xp',
                amount: amount,
                note: 'free',
                before: beforeState,
                after: beforeState,
            };
            pushXpHistory(actor, historyEntry);
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            ui.notifications?.info(`Granted ${amount} Free XP to ${actor.name} (frei verteilbar).`);
            app.render();
        });
        // Deduct (take back) unspent regular XP.
        customContainer.find('.deduct-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (!game.user?.isGM) {
                ui.notifications?.warn('Nur der GM kann XP zurücknehmen.');
                return;
            }
            const characterId = button.data('character-id');
            const requested = parseInt(button.siblings('.xp-amount-input').val()) || 0;
            if (requested <= 0) {
                ui.notifications?.warn('Bitte einen Betrag größer als 0 eingeben.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const removable = Math.max(0, xpState.available);
            if (removable <= 0) {
                ui.notifications?.warn(`${actor.name} hat keine freien regulären XP zum Zurücknehmen.`);
                return;
            }
            const amount = Math.min(requested, removable);
            const beforeState = {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            };
            await actor.update({
                'system.points.xp': xpState.available - amount,
                'system.xp.totalEarned': Math.max(0, xpState.totalEarned - amount),
            });
            const user = game.user;
            pushXpHistory(actor, {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'GM',
                kind: 'adjust',
                category: 'xp',
                amount: -amount,
                note: 'GM: reguläre XP zurückgenommen (nicht ausgegeben).',
                before: beforeState,
                after: {
                    available: xpState.available - amount,
                    totalEarned: Math.max(0, xpState.totalEarned - amount),
                    totalSpent: xpState.totalSpent,
                },
            });
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            const note = amount < requested ? ` (auf ${amount} begrenzt — nur unausgegebene XP)` : '';
            ui.notifications?.info(`${actor.name}: ${amount} reguläre XP zurückgenommen${note}.`);
            app.render();
        });
        // Deduct (take back) unspent Free XP.
        customContainer.find('.deduct-free-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (!game.user?.isGM) {
                ui.notifications?.warn('Nur der GM kann XP zurücknehmen.');
                return;
            }
            const characterId = button.data('character-id');
            const requested = parseInt(button.siblings('.free-xp-amount-input').val()) || 0;
            if (requested <= 0) {
                ui.notifications?.warn('Bitte einen Betrag größer als 0 eingeben.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const removable = Math.max(0, xpState.freeAvailable);
            if (removable <= 0) {
                ui.notifications?.warn(`${actor.name} hat keine freien Free XP zum Zurücknehmen.`);
                return;
            }
            const amount = Math.min(requested, removable);
            const beforeState = {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            };
            await actor.update({
                'system.points.xpFree': xpState.freeAvailable - amount,
                'system.xp.freeEarned': Math.max(0, xpState.freeEarned - amount),
            });
            const user = game.user;
            pushXpHistory(actor, {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'GM',
                kind: 'adjust',
                category: 'xp',
                amount: -amount,
                note: 'GM: Free XP zurückgenommen (nicht ausgegeben).',
                before: beforeState,
                after: beforeState,
            });
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            const note = amount < requested ? ` (auf ${amount} begrenzt — nur unausgegebene XP)` : '';
            ui.notifications?.info(`${actor.name}: ${amount} Free XP zurückgenommen${note}.`);
            app.render();
        });
        // End Upgrade Step button — clears the once-per-step bump lists.
        customContainer.find('.end-xp-step-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const isOwner = actor.isOwner || game.user?.isGM;
            if (!isOwner) {
                ui.notifications?.warn('Only the owner (or GM) can end this character\'s XP step.');
                return;
            }
            const stepRule = await import('./utils/xp-step-rule.js');
            const before = stepRule.readStep(actor);
            await stepRule.endStep(actor);
            const summary = [
                `${before.attributes.length} attr`,
                `${before.skills.length} skill`,
                `${before.powers.length} power`,
                `${before.artifacts.length} artifact`,
            ].join(', ');
            ui.notifications?.info(`Upgrade Step beendet für ${actor.name} (${summary}). Im neuen Step ist wieder +1 pro Wert möglich. Für freie Verteilung: Free XP (★) vergeben.`);
            app.render();
        });
        // Bulk grant
        customContainer.find('.bulk-grant-btn').on('click', async (event) => {
            const amount = parseInt(customContainer.find('.bulk-xp-amount').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
            let updated = 0;
            const user = game.user;
            for (const actor of characters) {
                const xpState = getXpState(actor);
                const beforeState = {
                    available: xpState.available,
                    totalEarned: xpState.totalEarned,
                    totalSpent: xpState.totalSpent,
                };
                const updates = {
                    'system.points.xp': xpState.available + amount,
                    'system.xp.totalEarned': xpState.totalEarned + amount
                };
                if (!actor.system.xp) {
                    updates['system.xp.totalSpent'] = 0;
                    updates['system.xp.history'] = [];
                }
                await actor.update(updates);
                // Add history entry
                const historyEntry = {
                    ts: Date.now(),
                    userId: user?.id || '',
                    userName: user?.name || 'System',
                    kind: 'grant',
                    category: 'xp',
                    amount: amount,
                    before: beforeState,
                    after: {
                        available: xpState.available + amount,
                        totalEarned: xpState.totalEarned + amount,
                        totalSpent: xpState.totalSpent,
                    }
                };
                pushXpHistory(actor, historyEntry);
                await actor.update({ 'system.xp.history': actor.system.xp.history });
                updated++;
            }
            ui.notifications?.info(`Granted ${amount} regular XP to ${updated} characters.`);
            // Re-render settings to update display
            app.render();
        });
        customContainer.find('.bulk-grant-free-btn').on('click', async (event) => {
            const amount = parseInt(customContainer.find('.bulk-free-xp-amount').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
            let updated = 0;
            const user = game.user;
            for (const actor of characters) {
                const xpState = getXpState(actor);
                const beforeState = {
                    available: xpState.available,
                    totalEarned: xpState.totalEarned,
                    totalSpent: xpState.totalSpent,
                };
                const updates = {
                    'system.points.xpFree': xpState.freeAvailable + amount,
                    'system.xp.freeEarned': xpState.freeEarned + amount,
                };
                if (!actor.system.xp) {
                    updates['system.xp.totalSpent'] = 0;
                    updates['system.xp.history'] = [];
                }
                await actor.update(updates);
                const historyEntry = {
                    ts: Date.now(),
                    userId: user?.id || '',
                    userName: user?.name || 'System',
                    kind: 'grant',
                    category: 'xp',
                    amount: amount,
                    note: 'free',
                    before: beforeState,
                    after: beforeState,
                };
                pushXpHistory(actor, historyEntry);
                await actor.update({ 'system.xp.history': actor.system.xp.history });
                updated++;
            }
            ui.notifications?.info(`Granted ${amount} Free XP to ${updated} characters (frei verteilbar).`);
            app.render();
        });
        customContainer.find('.bulk-reset-xp-account-btn').on('click', async () => {
            const { promptResetAllCharactersXpAccounting } = await import('./utils/xp-account-reset.js');
            promptResetAllCharactersXpAccounting(() => app.render());
        });
        customContainer.find('.reset-xp-account-btn').on('click', async (event) => {
            const characterId = $(event.currentTarget).data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const { promptResetActorXpAccounting } = await import('./utils/xp-account-reset.js');
            promptResetActorXpAccounting(actor, () => app.render());
        });
        customContainer.find('.recalc-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (button.prop('disabled'))
                return;
            if (!game.user?.isGM) {
                ui.notifications?.warn('Nur der GM kann XP neu berechnen.');
                return;
            }
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const { computeGroundTruthXp, formatXpRecalcHtml } = await import('./utils/xp-recalc.js');
            const result = computeGroundTruthXp(actor);
            if (!result.ok) {
                ui.notifications?.warn(result.error || 'Neuberechnung nicht möglich.');
                return;
            }
            new Dialog({
                title: `XP neu berechnen: ${actor.name}`,
                content: formatXpRecalcHtml(actor.name, result),
                buttons: {
                    apply: {
                        icon: '<i class="fas fa-calculator"></i>',
                        label: !result.changed
                            ? 'Bereits korrekt'
                            : `Übernehmen (${result.totalDelta > 0 ? '+' : ''}${result.totalDelta} XP)`,
                        callback: async () => {
                            if (!result.changed)
                                return;
                            const xpState = getXpState(actor);
                            const before = {
                                available: xpState.available,
                                totalEarned: xpState.totalEarned,
                                totalSpent: xpState.totalSpent,
                            };
                            await actor.update({
                                'system.points.xp': result.available,
                                'system.points.xpFree': result.freeAvailable,
                                'system.xp.totalSpent': result.regularSpent,
                                'system.xp.freeSpent': result.freeSpent,
                            });
                            const user = game.user;
                            pushXpHistory(actor, {
                                ts: Date.now(),
                                userId: user?.id || '',
                                userName: user?.name || 'GM',
                                kind: 'adjust',
                                category: 'xp',
                                amount: result.totalDelta,
                                note: 'GM recalc: XP pools recomputed from current build (earned − invested, Free spent first).',
                                details: {
                                    recalc: true,
                                    attributeSpent: result.attributeSpent,
                                    skillSpent: result.skillSpent,
                                    powerSpent: result.powerSpent,
                                    totalInvested: result.totalInvested,
                                    regularSpent: result.regularSpent,
                                    freeSpent: result.freeSpent,
                                },
                                before,
                                after: {
                                    available: result.available,
                                    totalEarned: result.totalEarned,
                                    totalSpent: result.regularSpent,
                                },
                            });
                            await actor.update({ 'system.xp.history': actor.system.xp.history });
                            ui.notifications?.info(`${actor.name}: XP neu berechnet → ${result.available} regulär / ${result.freeAvailable} Free (gesamt ${result.totalDelta > 0 ? '+' : ''}${result.totalDelta}).`);
                            app.render();
                        },
                    },
                    cancel: {
                        label: 'Abbrechen',
                        callback: () => { },
                    },
                },
                default: result.changed ? 'apply' : 'cancel',
            }).render(true);
        });
        // History button
        customContainer.find('.history-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const history = xpState.history.slice(-50).reverse(); // Last 50, newest first
            let historyContent = '<div class="xp-history-dialog">';
            historyContent += `<h3>XP History: ${actor.name}</h3>`;
            historyContent += '<table class="xp-history-table"><thead><tr>';
            historyContent += '<th>Time</th><th>Kind</th><th>Category</th><th>Amount</th><th>Note/Details</th>';
            historyContent += '</tr></thead><tbody>';
            if (history.length === 0) {
                historyContent += '<tr><td colspan="5" class="empty-message">No history entries.</td></tr>';
            }
            else {
                history.forEach((entry) => {
                    const date = new Date(entry.ts);
                    const timeStr = date.toLocaleString();
                    const detailsStr = entry.details ? JSON.stringify(entry.details, null, 0).substring(0, 100) : (entry.note || '—');
                    historyContent += `<tr>`;
                    historyContent += `<td>${timeStr}</td>`;
                    historyContent += `<td>${entry.kind}</td>`;
                    historyContent += `<td>${entry.category}</td>`;
                    historyContent += `<td>${entry.amount}</td>`;
                    historyContent += `<td title="${detailsStr.length > 100 ? detailsStr : ''}">${detailsStr.length > 50 ? detailsStr.substring(0, 50) + '...' : detailsStr}</td>`;
                    historyContent += `</tr>`;
                });
            }
            historyContent += '</tbody></table>';
            if (game.user?.isGM && history.length > 0) {
                historyContent += '<div class="history-actions">';
                historyContent += `<button type="button" class="clear-history-btn" data-character-id="${characterId}">Clear History</button>`;
                historyContent += '</div>';
            }
            historyContent += '</div>';
            new Dialog({
                title: `XP History: ${actor.name}`,
                content: historyContent,
                buttons: {
                    close: {
                        label: 'Close',
                        callback: () => { }
                    }
                },
                default: 'close',
                render: (html) => {
                    html.find('.clear-history-btn').on('click', async () => {
                        await actor.update({ 'system.xp.history': [] });
                        ui.notifications?.info(`Cleared XP history for ${actor.name}.`);
                        app.render();
                        html.closest('.dialog').find('.close').click();
                    });
                }
            }).render(true);
        });
        customContainer.find('.reset-progress-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (button.prop('disabled'))
                return;
            if (!game.user?.isGM)
                return;
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            if (!actorHasPostCreationSnapshot(actor)) {
                ui.notifications?.warn('No post-creation snapshot for this actor. Complete character creation on the current system version.');
                return;
            }
            const totalEarned = actor.system?.xp?.totalEarned ?? 0;
            const user = game.user;
            new Dialog({
                title: `Reset progression: ${actor.name}`,
                content: `<p class="xp-reset-confirm">Restore <strong>attributes</strong>, <strong>skills</strong>, <strong>power levels</strong>, and <strong>skill session spend</strong> to the stored post-creation state. All <strong>${totalEarned}</strong> earned XP will be available again. A <strong>GM reset</strong> entry is appended to XP history.</p>`,
                buttons: {
                    reset: {
                        icon: '<i class="fas fa-undo"></i>',
                        label: 'Reset progression',
                        callback: async () => {
                            const res = await resetActorProgressToPostCreation(actor, {
                                gmUserId: user?.id || '',
                                gmUserName: user?.name || 'GM'
                            });
                            if (!res.ok) {
                                ui.notifications?.error(res.error || 'Reset failed.');
                                return;
                            }
                            ui.notifications?.info(`Progression reset to post-creation for ${actor.name}.`);
                            app.render();
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => { }
                    }
                },
                default: 'cancel'
            }).render(true);
        });
    });
}
/**
 * Preload Handlebars templates
 */
async function preloadTemplates() {
    const templatePaths = [
        // Actor sheets (only load existing templates)
        'systems/mastery-system/templates/actor/character-sheet.hbs',
        'systems/mastery-system/templates/actor/partials/combat-senses-config.hbs',
        'systems/mastery-system/templates/actor/partials/npc-attack-targeting.hbs',
        'systems/mastery-system/templates/actor/character-print.hbs',
        'systems/mastery-system/templates/actor/npc-print.hbs',
        'systems/mastery-system/templates/actor/npc-sheet.hbs',
        'systems/mastery-system/templates/actor/summon-sheet.hbs',
        // Item sheets (only load existing templates)
        'systems/mastery-system/templates/item/power-sheet.hbs',
        // Dice dialogs
        'systems/mastery-system/templates/dice/damage-dialog.hbs',
        // Character creation wizard
        'systems/mastery-system/templates/dialogs/disadvantage-config.hbs',
        // Progression / artifact dialogs
        'systems/mastery-system/templates/artifacts/artifact-evolution-dialog.hbs',
        'systems/mastery-system/templates/artifacts/progression-hub-dialog.hbs',
        // Homepage character import
        'systems/mastery-system/templates/import/character-import-dialog.hbs',
    ];
    try {
        await foundry.applications.handlebars.loadTemplates(templatePaths);
    }
    catch (error) {
        console.warn('Mastery System | Some templates could not be loaded:', error);
    }
}
/**
 * Register CONFIG constants
 */
function registerConfigConstants() {
    if (!CONFIG.MASTERY) {
        CONFIG.MASTERY = {};
    }
    CONFIG.MASTERY.creation = {
        schticksAllowed: 2,
        attributeDistribution: [8, 8, 6, 6, 4, 4, 2],
        skillPoints: 40,
        maxAttributeAtCreation: 8,
        maxSkillAtCreation: 4,
        // Players Guide ~5158–5164: only the maximum (8) is canonical; the
        // minimum defaults to 0 so a character may take no disadvantages.
        minDisadvantagePoints: 0,
        maxDisadvantagePoints: 8
    };
}
/**
 * Character Creation Hooks
 */
/**
 * Normalize health.bars from object to array format
 * This ensures health bars are always stored as arrays, not objects
 */
function normalizeHealthBars(health) {
    if (!health || !health.bars) {
        return health;
    }
    const bars = health.bars;
    // If bars is an object (not an array), convert to array
    if (!Array.isArray(bars) && typeof bars === 'object') {
        const barsArray = Object.keys(bars)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => bars[key]);
        health.bars = barsArray;
    }
    // Ensure each bar has required fields
    // Only set defaults if the value is missing (undefined/null), not if it's 0
    if (Array.isArray(health.bars)) {
        health.bars = health.bars.map((bar, index) => ({
            name: bar.name || `Bar ${index + 1}`,
            max: (bar.max !== undefined && bar.max !== null) ? bar.max : 30,
            current: (bar.current !== undefined && bar.current !== null) ? bar.current : ((bar.max !== undefined && bar.max !== null) ? bar.max : 30),
            penalty: (bar.penalty !== undefined && bar.penalty !== null) ? bar.penalty : 0
        }));
    }
    return health;
}
/**
 * Hook to normalize health.bars before actor updates
 * Ensures health.bars is always stored as an array, not an object
 */
Hooks.on('preUpdateActor', (actor, updateData, _options, _userId) => {
    if (actor.type === 'npc') {
        // Normalize main health bars
        if (updateData.system?.health?.bars) {
            updateData.system.health = normalizeHealthBars(updateData.system.health);
        }
        // Normalize phase health bars
        if (updateData.system?.phases && Array.isArray(updateData.system.phases)) {
            updateData.system.phases = updateData.system.phases.map((phase) => {
                if (phase.health?.bars) {
                    phase.health = normalizeHealthBars(phase.health);
                }
                return phase;
            });
        }
    }
});
Hooks.on('preCreateItem', (item, data, _options, _userId) => {
    const isDefaultImg = !data.img || data.img === 'icons/svg/item-bag.svg' || data.img === 'icons/svg/mystery-man.svg';
    if (isDefaultImg) {
        const icon = getItemIcon(data.name || '', item.type || data.type || '', getItemIconHintFromCreateData(data));
        if (icon) {
            item.updateSource({ img: icon });
        }
    }
});
Hooks.on('preCreateActor', async (actor, data, _options, _userId) => {
    // Set creationComplete=false for new character actors
    if (actor.type === 'character') {
        if (!data.system) {
            data.system = {};
        }
        // Initialize schticks if not present
        if (!data.system.schticks) {
            data.system.schticks = { ranks: [] };
        }
        if (!data.system.creation) {
            data.system.creation = {};
        }
        data.system.creation.complete = false;
    }
    // Initialize health bars (6 levels for characters, 1 for NPCs)
    if (actor.type === 'npc' || actor.type === 'character') {
        if (!data.system) {
            data.system = {};
        }
        // Initialize health bars
        if (!data.system.health) {
            if (actor.type === 'character') {
                // Characters: 6 levels (Healthy → Bruised → Injured → Wounded →
                // Broken → Incapacitated). Bars 0–4 = Vitality × 2; Incapacitated = 1.
                const vitality = data.system.attributes?.vitality?.value || 2;
                const maxHP = vitality * 2;
                data.system.health = {
                    bars: [
                        { name: 'Healthy', max: maxHP, current: maxHP, penalty: 0 },
                        { name: 'Bruised', max: maxHP, current: maxHP, penalty: -1 },
                        { name: 'Injured', max: maxHP, current: maxHP, penalty: -2 },
                        { name: 'Wounded', max: maxHP, current: maxHP, penalty: -4 },
                        { name: 'Broken', max: maxHP, current: maxHP, penalty: -5 },
                        { name: 'Incapacitated', max: 1, current: 1, penalty: -6 }
                    ],
                    currentBar: 0,
                    tempHP: 0
                };
            }
            else {
                // NPCs: 1 bar
                data.system.health = {
                    bars: [
                        { name: 'Healthy', max: 30, current: 30, penalty: 0 }
                    ],
                    currentBar: 0,
                    tempHP: 0
                };
            }
        }
        else {
            // Ensure health bars exist
            if (!data.system.health.bars || data.system.health.bars.length === 0) {
                if (actor.type === 'character') {
                    const vitality = data.system.attributes?.vitality?.value || 2;
                    const maxHP = vitality * 2;
                    data.system.health.bars = [
                        { name: 'Healthy', max: maxHP, current: maxHP, penalty: 0 },
                        { name: 'Bruised', max: maxHP, current: maxHP, penalty: -1 },
                        { name: 'Injured', max: maxHP, current: maxHP, penalty: -2 },
                        { name: 'Wounded', max: maxHP, current: maxHP, penalty: -4 },
                        { name: 'Broken', max: maxHP, current: maxHP, penalty: -5 },
                        { name: 'Incapacitated', max: 1, current: 1, penalty: -6 }
                    ];
                }
                else {
                    data.system.health.bars = [
                        { name: 'Healthy', max: 30, current: 30, penalty: 0 }
                    ];
                }
            }
            else if (actor.type === 'character') {
                // Ensure the six-level track for characters. The authoritative
                // migration runs in actor.ts prepareBaseData; here we just seed a
                // sane shape so preCreate data is never malformed.
                const vitality = data.system.attributes?.vitality?.value || 2;
                const maxHP = vitality * 2;
                const allBarNames = ['Healthy', 'Bruised', 'Injured', 'Wounded', 'Broken', 'Incapacitated'];
                const penalties = [0, -1, -2, -4, -5, -6];
                // Limit to 6 bars maximum.
                if (data.system.health.bars.length > 6) {
                    data.system.health.bars = data.system.health.bars.slice(0, 6);
                }
                // Add missing bars if less than 6.
                for (let i = data.system.health.bars.length; i < 6; i++) {
                    const isIncap = i === 5;
                    data.system.health.bars.push({
                        name: allBarNames[i],
                        max: isIncap ? 1 : maxHP,
                        current: isIncap ? 1 : maxHP,
                        penalty: penalties[i]
                    });
                }
                // Update max HP for all bars if vitality changed.
                for (let i = 0; i < data.system.health.bars.length; i++) {
                    const bar = data.system.health.bars[i];
                    const isIncap = i === 5 || bar.name === 'Incapacitated';
                    const targetMax = isIncap ? 1 : maxHP;
                    const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                    bar.name = allBarNames[i] ?? bar.name;
                    bar.max = targetMax;
                    bar.current = Math.min(Math.floor(targetMax * ratio), targetMax);
                    bar.penalty = penalties[i];
                }
            }
            if (data.system.health.currentBar === undefined) {
                data.system.health.currentBar = 0;
            }
            if (data.system.health.tempHP === undefined) {
                data.system.health.tempHP = 0;
            }
        }
        // Initialize stress bars for characters only
        if (actor.type === 'character') {
            if (!data.system.stress) {
                const resolve = data.system.attributes?.resolve?.value || 2;
                const intellect = data.system.attributes?.intellect?.value || 2;
                const maxStress = resolve + intellect;
                data.system.stress = {
                    bars: [
                        { name: 'Healthy', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Stressed', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Not Well', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Breaking', max: maxStress, current: maxStress, penalty: 0 }
                    ],
                    currentBar: 0
                };
            }
            else {
                // Migrate old format if needed
                if (!data.system.stress.bars || data.system.stress.bars.length === 0) {
                    const resolve = data.system.attributes?.resolve?.value || 2;
                    const intellect = data.system.attributes?.intellect?.value || 2;
                    const maxStress = resolve + intellect;
                    const oldCurrent = data.system.stress.current || 0;
                    data.system.stress.bars = [
                        { name: 'Healthy', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Stressed', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Not Well', max: maxStress, current: maxStress, penalty: 0 },
                        { name: 'Breaking', max: maxStress, current: maxStress, penalty: 0 }
                    ];
                    data.system.stress.currentBar = 0;
                    // Distribute old stress
                    if (oldCurrent > 0) {
                        let remaining = oldCurrent;
                        for (let i = 0; i < data.system.stress.bars.length && remaining > 0; i++) {
                            if (remaining >= data.system.stress.bars[i].max) {
                                data.system.stress.bars[i].current = 0;
                                remaining -= data.system.stress.bars[i].max;
                                data.system.stress.currentBar = i + 1;
                            }
                            else {
                                data.system.stress.bars[i].current = data.system.stress.bars[i].max - remaining;
                                remaining = 0;
                            }
                        }
                    }
                }
                else if (data.system.stress.bars.length < 4) {
                    // Add missing bars (4 bars total)
                    const resolve = data.system.attributes?.resolve?.value || 2;
                    const intellect = data.system.attributes?.intellect?.value || 2;
                    const maxStress = resolve + intellect;
                    const allBarNames = ['Healthy', 'Stressed', 'Not Well', 'Breaking'];
                    for (let i = data.system.stress.bars.length; i < 4; i++) {
                        data.system.stress.bars.push({
                            name: allBarNames[i],
                            max: maxStress,
                            current: maxStress,
                            penalty: 0
                        });
                    }
                }
                else if (data.system.stress.bars.length > 4) {
                    // Remove extra bars (keep only first 4)
                    data.system.stress.bars = data.system.stress.bars.slice(0, 4);
                    if (data.system.stress.currentBar >= 4) {
                        data.system.stress.currentBar = 3;
                    }
                }
                if (data.system.stress.currentBar === undefined) {
                    data.system.stress.currentBar = 0;
                }
            }
        }
        // Initialize statusEffects array
        if (!data.system.statusEffects) {
            data.system.statusEffects = [];
        }
        // Initialize stonePools for characters
        if (actor.type === 'character') {
            if (!data.system.stonePools) {
                data.system.stonePools = {};
            }
            // Initialize pools for all attributes (will be calculated properly in prepareBaseData)
            const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
            for (const attrKey of attributeKeys) {
                if (!data.system.stonePools[attrKey]) {
                    const attrValue = data.system.attributes?.[attrKey]?.value || 0;
                    const maxStones = Math.floor(attrValue / 8);
                    data.system.stonePools[attrKey] = {
                        current: maxStones,
                        max: maxStones,
                        sustained: 0
                    };
                }
            }
        }
    }
});
// Characters without an equipped weapon are implicitly unarmed (virtual profile in
// `unarmed-fallback.ts`) — no embedded "Unarmed" item is created.
/**
 * Migration hook - set creationComplete=true for existing characters without the flag
 * Also migrate old stone system to new per-attribute stone pools
 * Also migrate skillsSpent for new consumable skill system
 */
Hooks.once('ready', async function () {
    // Get all character actors
    const characters = game.actors?.filter((a) => a.type === 'character') || [];
    let migratedCreation = 0;
    let migratedStones = 0;
    let migratedSkillsSpent = 0;
    for (const actor of characters) {
        const system = actor.system;
        // Migration 1: creation.complete flag
        if (system?.creation?.complete === undefined || system?.creation?.complete === null) {
            await actor.update({ 'system.creation.complete': true });
            migratedCreation++;
        }
        // Migration: Rename old skill keys -> new skill keys
        const skillKeyRenames = {
            herbalismAlchemy: 'alchemy',
            foraging: 'herbalism'
        };
        const newSkillKeys = ['negotiation', 'seduction', 'investigation', 'etiquette', 'artisanry'];
        if (system?.skills && typeof system.skills === 'object') {
            const updates = {};
            let needsSkillKeyMigration = false;
            for (const [oldKey, newKey] of Object.entries(skillKeyRenames)) {
                if (system.skills[oldKey] !== undefined) {
                    updates[`system.skills.${newKey}`] = system.skills[oldKey];
                    updates[`system.skills.-=${oldKey}`] = null;
                    if (system.skillsSpent?.[oldKey] !== undefined) {
                        updates[`system.skillsSpent.${newKey}`] = system.skillsSpent[oldKey];
                        updates[`system.skillsSpent.-=${oldKey}`] = null;
                    }
                    needsSkillKeyMigration = true;
                }
            }
            for (const key of newSkillKeys) {
                if (system.skills[key] === undefined) {
                    updates[`system.skills.${key}`] = 0;
                    needsSkillKeyMigration = true;
                }
                if (system.skillsSpent && system.skillsSpent[key] === undefined) {
                    updates[`system.skillsSpent.${key}`] = 0;
                }
            }
            if (needsSkillKeyMigration) {
                await actor.update(updates);
            }
        }
        // Migration: skillsSpent initialization
        if (!system?.skillsSpent || typeof system.skillsSpent !== 'object') {
            const { SKILLS } = await import('./utils/skills.js');
            const skillsSpent = {};
            // Initialize all skills from SKILLS with 0 spent
            for (const skillKey of Object.keys(SKILLS)) {
                skillsSpent[skillKey] = 0;
            }
            // Also ensure any existing skills in actor.system.skills have entries
            if (system.skills && typeof system.skills === 'object') {
                for (const skillKey of Object.keys(system.skills)) {
                    if (!skillsSpent.hasOwnProperty(skillKey)) {
                        skillsSpent[skillKey] = 0;
                    }
                }
            }
            await actor.update({ 'system.skillsSpent': skillsSpent });
            migratedSkillsSpent++;
        }
        else {
            // Ensure all skills from SKILLS exist in skillsSpent
            const { SKILLS } = await import('./utils/skills.js');
            const skillsSpent = { ...(system.skillsSpent || {}) };
            let needsUpdate = false;
            for (const skillKey of Object.keys(SKILLS)) {
                if (!skillsSpent.hasOwnProperty(skillKey)) {
                    skillsSpent[skillKey] = 0;
                    needsUpdate = true;
                }
                // Clamp: 0 <= skillsSpent[skillKey] <= skills[skillKey]
                const skillRating = system.skills?.[skillKey] || 0;
                if (skillsSpent[skillKey] < 0) {
                    skillsSpent[skillKey] = 0;
                    needsUpdate = true;
                }
                if (skillsSpent[skillKey] > skillRating) {
                    skillsSpent[skillKey] = skillRating;
                    needsUpdate = true;
                }
            }
            if (needsUpdate) {
                await actor.update({ 'system.skillsSpent': skillsSpent });
                migratedSkillsSpent++;
            }
        }
        // Migration 2: Old stone system -> new stonePools
        // Check if old system exists (system.stones.current/maximum) but new system doesn't (system.stonePools)
        const hasOldStones = system?.stones && (system.stones.current !== undefined ||
            system.stones.maximum !== undefined ||
            system.stones.total !== undefined);
        const hasNewStonePools = system?.stonePools &&
            Object.keys(system.stonePools).length > 0 &&
            system.stonePools.might !== undefined;
        if (hasOldStones && !hasNewStonePools) {
            // Get old stone values
            const oldCurrent = system.stones?.current ?? 0;
            const oldMaximum = system.stones?.maximum ?? system.stones?.total ?? 0;
            // Initialize new stonePools structure
            const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
            const updates = {};
            // Calculate max for each pool based on attributes
            for (const attrKey of attributeKeys) {
                const attrValue = system.attributes?.[attrKey]?.value || 0;
                const maxStones = Math.floor(attrValue / 8);
                // Initialize pool
                if (!system.stonePools) {
                    updates['system.stonePools'] = {};
                }
                updates[`system.stonePools.${attrKey}`] = {
                    current: 0,
                    max: maxStones,
                    sustained: 0
                };
            }
            // Distribute old current stones evenly across all pools
            // Strategy: Distribute proportionally based on max capacity, but at least 1 per pool if possible
            const totalMax = attributeKeys.reduce((sum, key) => {
                const attrValue = system.attributes?.[key]?.value || 0;
                return sum + Math.floor(attrValue / 8);
            }, 0);
            if (totalMax > 0 && oldCurrent > 0) {
                let remaining = oldCurrent;
                for (const attrKey of attributeKeys) {
                    const attrValue = system.attributes?.[attrKey]?.value || 0;
                    const maxStones = Math.floor(attrValue / 8);
                    // Proportional distribution
                    const proportion = totalMax > 0 ? maxStones / totalMax : 0;
                    const allocated = Math.floor(oldCurrent * proportion);
                    // Ensure we don't exceed max for this pool
                    const finalCurrent = Math.min(maxStones, allocated);
                    updates[`system.stonePools.${attrKey}.current`] = finalCurrent;
                    remaining -= finalCurrent;
                }
                // Distribute any remainder to pools that have capacity
                if (remaining > 0) {
                    for (const attrKey of attributeKeys) {
                        if (remaining <= 0)
                            break;
                        const pool = updates[`system.stonePools.${attrKey}`];
                        if (pool.current < pool.max) {
                            const add = Math.min(remaining, pool.max - pool.current);
                            pool.current += add;
                            remaining -= add;
                        }
                    }
                }
            }
            // Apply updates
            await actor.update(updates);
            migratedStones++;
        }
    }
    // Migration: Update item icons from Foundry default SVGs to custom PNGs
    const FOUNDRY_DEFAULT_ICONS = new Set([
        'icons/svg/item-bag.svg',
        'icons/svg/sword.svg',
        'icons/svg/bow.svg',
        'icons/svg/armor.svg',
        'icons/svg/shield.svg',
        'icons/svg/mystery-man.svg',
        'icons/svg/aura.svg',
        'icons/svg/chest.svg',
        'icons/svg/lightning.svg',
        'icons/svg/acid.svg',
        'icons/svg/sound.svg',
        'icons/svg/upgrade.svg',
    ]);
    let migratedIcons = 0;
    const allWorldItems = Array.from(game.items || []);
    /** Old filenames used spaces / mixed case; renamed to LightArmor.png, HeavyArmor.png, etc. */
    const fixLegacyArmorIcon = async (item) => {
        if (item.type !== 'armor')
            return false;
        const cur = String(item.img || '').replace(/\\/g, '/');
        if (!cur.includes('/assets/icons/items/armor/'))
            return false;
        let normalized = cur;
        try {
            normalized = decodeURIComponent(cur.replace(/\+/g, ' '));
        }
        catch {
            normalized = cur;
        }
        if (!/\/(Light Armor|Armor Medium|Heavy armor|Heavy Armor)\.png(\?|$)/i.test(normalized))
            return false;
        const icon = getItemIcon(item.name, 'armor', item.system);
        if (!icon || cur === icon)
            return false;
        await item.update({ img: icon });
        return true;
    };
    const fixLegacyShieldIcon = async (item) => {
        if (item.type !== 'shield')
            return false;
        const cur = String(item.img || '').replace(/\\/g, '/');
        if (!cur.includes('/assets/icons/items/shields/'))
            return false;
        let normalized = cur;
        try {
            normalized = decodeURIComponent(cur.replace(/\+/g, ' '));
        }
        catch {
            normalized = cur;
        }
        if (!/\/(Medium Shield|tower shield|Tower Shield)\.png(\?|$)/i.test(normalized))
            return false;
        const icon = getItemIcon(item.name, 'shield', item.system);
        if (!icon || cur === icon)
            return false;
        await item.update({ img: icon });
        return true;
    };
    const NAMED_WEAPON_ICON_REFRESH = new Set(['rapier', 'short sword', 'spear']);
    const fixRapierShortSwordSpearIcon = async (item) => {
        if (item.type !== 'weapon')
            return false;
        const nk = normalizeWeaponNameKey(item.name || '');
        if (!NAMED_WEAPON_ICON_REFRESH.has(nk))
            return false;
        const icon = getItemIcon(item.name, 'weapon');
        if (!icon)
            return false;
        const cur = String(item.img || '').replace(/\\/g, '/');
        const exp = icon.replace(/\\/g, '/');
        if (cur === exp)
            return false;
        await item.update({ img: icon });
        return true;
    };
    const fixEchoArtifactIcon = async (item) => {
        if (item.type !== 'artifact')
            return false;
        const echoKey = String(item.getFlag?.('mastery-system', 'echoArtifactKey') || '').trim();
        if (!echoKey)
            return false;
        const icon = getEchoArtifactIcon(echoKey);
        if (!icon)
            return false;
        const cur = String(item.img || '').replace(/\\/g, '/');
        const exp = icon.replace(/\\/g, '/');
        if (cur === exp)
            return false;
        await item.update({ img: icon });
        return true;
    };
    for (const item of allWorldItems) {
        if (FOUNDRY_DEFAULT_ICONS.has(item.img)) {
            const icon = getItemIcon(item.name, item.type, getItemIconHintFromItem(item));
            if (icon && icon !== item.img) {
                await item.update({ img: icon });
                migratedIcons++;
            }
        }
        if (await fixLegacyArmorIcon(item))
            migratedIcons++;
        if (await fixLegacyShieldIcon(item))
            migratedIcons++;
        if (await fixRapierShortSwordSpearIcon(item))
            migratedIcons++;
        if (await fixEchoArtifactIcon(item))
            migratedIcons++;
    }
    for (const actor of game.actors || []) {
        for (const item of actor.items || []) {
            if (FOUNDRY_DEFAULT_ICONS.has(item.img)) {
                const icon = getItemIcon(item.name, item.type, getItemIconHintFromItem(item));
                if (icon && icon !== item.img) {
                    await item.update({ img: icon });
                    migratedIcons++;
                }
            }
            if (await fixLegacyArmorIcon(item))
                migratedIcons++;
            if (await fixLegacyShieldIcon(item))
                migratedIcons++;
            if (await fixRapierShortSwordSpearIcon(item))
                migratedIcons++;
            if (await fixEchoArtifactIcon(item))
                migratedIcons++;
        }
    }
    if (migratedIcons > 0) {
        ui.notifications?.info(`Updated ${migratedIcons} item icons.`);
    }
});
/**
 * Ready hook - called when Foundry is fully loaded and ready
 */
Hooks.once('ready', async function () {
    // Log system version prominently
    const system = game.system;
    try {
        applyMasteryStatusEffects();
    }
    catch (err) {
        console.warn('Mastery System | Status effects apply on ready failed', err);
    }
    // Seed General Items Storage once per world load (GM only)
    if (game.user?.isGM) {
        // Drop legacy sheet selections so defaults apply after sheet registration changes.
        try {
            const legacyActorSheets = new Set(['ActorSheet', 'foundry.appv1.sheets.ActorSheet']);
            const characters = game.actors?.filter((a) => a.type === 'character') || [];
            for (const actor of characters) {
                const sheetClass = String(actor.getFlag?.('core', 'sheetClass') || '');
                if (sheetClass && legacyActorSheets.has(sheetClass)) {
                    await actor.unsetFlag('core', 'sheetClass');
                }
            }
            const legacyArtifactItemSheets = new Set([
                'ItemSheet',
                'foundry.appv1.sheets.ItemSheet',
                'MasteryItemSheet',
            ]);
            const resetArtifactSheet = async (item) => {
                const sheetClass = String(item.getFlag?.('core', 'sheetClass') || '');
                if (sheetClass && legacyArtifactItemSheets.has(sheetClass)) {
                    await item.unsetFlag('core', 'sheetClass');
                }
            };
            for (const item of game.items?.filter((i) => i.type === 'artifact') || []) {
                await resetArtifactSheet(item);
            }
            for (const actor of game.actors || []) {
                for (const item of actor.items?.filter((i) => i.type === 'artifact') || []) {
                    await resetArtifactSheet(item);
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | Could not migrate legacy sheet selection', err);
        }
        try {
            const createdItems = await seedGeneralItemsStorage();
        }
        catch (error) {
            console.warn('Mastery System | Failed to seed General Items Storage on ready', error);
        }
        // Seed the Echo Artifact library (folder + 10-level Builder-Tree per Echo
        // Artifact). Idempotent — existing trees and their actorLevels are kept.
        try {
            const createdArtifacts = await seedArtifactLibrary();
        }
        catch (error) {
            console.warn('Mastery System | Failed to seed Echo Artifact library on ready', error);
        }
    }
    exposeMasterySystemApi();
    // One-shot Trees → Templates power cutover (GM-only, guarded by world setting).
    try {
        await runTemplatesCutover();
    }
    catch (error) {
        console.warn('Mastery System | Templates cutover failed', error);
    }
    // One-shot new-spec XP Upgrade-Step cutover (GM-only, guarded by world setting).
    try {
        await runXpCurrentStepCutover();
    }
    catch (error) {
        console.warn('Mastery System | XP Upgrade-Step cutover failed', error);
    }
    // One-shot Artifact spec backfill (GM-only, guarded by world setting).
    try {
        await runArtifactSpecBackfill();
    }
    catch (error) {
        console.warn('Mastery System | Artifact spec backfill failed', error);
    }
    try {
        await runArtifactEchoLinkMigration();
    }
    catch (error) {
        console.warn('Mastery System | Echo artifact link reset migration failed', error);
    }
    try {
        await runArtifactEchoActivationMigration();
    }
    catch (error) {
        console.warn('Mastery System | Echo artifact activation migration failed', error);
    }
    // One-shot Echo Artifact → Builder-Tree migration (GM-only, guarded). Runs
    // after the library is seeded above so legacy single-item grants can be
    // re-linked to the new 10-level trees.
    try {
        await runEchoArtifactTreeMigration();
    }
    catch (error) {
        console.warn('Mastery System | Echo Artifact tree migration failed', error);
    }
    try {
        await runEchoArtifactDedupeMigration();
    }
    catch (error) {
        console.warn('Mastery System | Echo artifact dedupe migration failed', error);
    }
    try {
        await runAbCriticalMilestonesMigration();
    }
    catch (error) {
        console.warn('Mastery System | Active Buff Critical milestones migration failed', error);
    }
    // One-shot resync of Active / Active-Buff power items to the audited
    // Actives.md / Active Buffs.md templates (damage anchors, special curves,
    // healing, ranges, radii). Fixes characters whose powers were baked before
    // the audit shipped.
    try {
        await runPowerTemplateResyncMigration();
    }
    catch (error) {
        console.warn('Mastery System | Power template resync migration failed', error);
    }
    // One-shot Paperdoll Slot canonicalization (GM-only, guarded by world setting).
    // Maps legacy slot keys (helmet/chest/boot/necklace/ring1/ring2/cloak/glove/belt/leggings)
    // onto the canonical 7-slot vocabulary (mainhand/offhand/body/head/feet/amulet/ring).
    try {
        await runPaperdollSlotCanonical();
    }
    catch (error) {
        console.warn('Mastery System | Paperdoll slot canonicalization failed', error);
    }
    // Re-initialize Artifact Awakening as fallback (in case init hook failed)
    // Check if hook is registered
    const hooks = Hooks._hooks?.renderItemDirectory || [];
    const hasArtifactHook = hooks.some((hook) => hook.fn?.toString().includes('Mastery System | renderItemDirectory Hook TRIGGERED'));
    if (!hasArtifactHook) {
        console.warn('Mastery System | Artifact Awakening hook not found, re-initializing...');
        try {
            initializeArtifactAwakening();
            // Trigger the hook manually if Item Directory is already open
            setTimeout(() => {
                const itemDir = ui.items;
                if (itemDir && itemDir.rendered) {
                    const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
                    if (html.length > 0) {
                        Hooks.callAll('renderItemDirectory', itemDir, html, {});
                    }
                }
            }, 500);
        }
        catch (error) {
            console.error('❌ Mastery System | Error re-initializing Artifact Awakening:', error);
        }
    }
    else {
        // Even if hook is registered, trigger it if Item Directory is already open
        setTimeout(() => {
            const itemDir = ui.items;
            if (itemDir && itemDir.rendered) {
                const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
                if (html.length > 0) {
                    Hooks.callAll('renderItemDirectory', itemDir, html, {});
                }
            }
        }, 500);
    }
    // Register attack roll click handler
    registerAttackRollClickHandler();
    registerDamageCardChatHooks();
    const { registerPerceptionCombatHooks } = await import('./combat/perception-combat-hooks.js');
    registerPerceptionCombatHooks();
    // Register skill spend click handler
    const { registerSkillSpendClickHandler } = await import('./chat/skill-spend-handler.js');
    registerSkillSpendClickHandler();
    const { registerFaithFractureRerollHandlers } = await import('./chat/faith-fracture-reroll.js');
    registerFaithFractureRerollHandlers();
    const { registerReactionWindowChatHandlers } = await import('./combat/reaction-window-chat.js');
    registerReactionWindowChatHandlers();
    const { registerWorldArtifactFlagSyncSocket } = await import('./utils/world-artifact-flag-sync.js');
    registerWorldArtifactFlagSyncSocket();
    const migrationActors = game.actors?.filter((a) => a.type === 'character' || a.type === 'npc') || [];
    // Migration: remove legacy auto-seeded "Unarmed" weapon items (virtual unarmed replaces them).
    if (game.user?.isGM) {
        const { isLegacyUnarmedItem } = await import('./utils/unarmed-fallback.js');
        let removed = 0;
        for (const actor of migrationActors) {
            try {
                const legacyIds = Array.from(actor.items || [])
                    .filter((item) => isLegacyUnarmedItem(item))
                    .map((item) => item.id)
                    .filter(Boolean);
                if (legacyIds.length > 0) {
                    await actor.deleteEmbeddedDocuments('Item', legacyIds, { masterySystemForceDelete: true });
                    removed += legacyIds.length;
                }
            }
            catch (error) {
                console.warn(`Mastery System | Could not strip legacy Unarmed from ${actor.name}:`, error);
            }
        }
    }
    // Migration: legacy Elven Stride / Elves → Elorian Stride / Elorians.
    try {
        await runElorianStrideMigration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | Elorian Stride migration failed', error);
    }
    // Migration: legacy single-key Titan Scars → Attribute-affinity echo artifact trees.
    try {
        await runTitanScarsAffinityMigration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | Titan Scars affinity migration failed', error);
    }
    // Migration: reconcile legacy Special-Effect ids/names (Bleeding->Lacerate,
    // Ignite->Ruin, Freeze->Slow, Poisoned->Blight, Shock->Disoriented,
    // Disrupt->Challenge, Blinded->Disoriented; Dread/Frightened deleted).
    try {
        await runSpecialEffectRenameMigration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | Special-Effect rename migration failed', error);
    }
    // Migration: Rules v2 — strip Saving Throws, saveSpell→spellAttack, retire
    // Active Buff Special Application auras, clear removed Special statuses.
    try {
        await runRulesV2AlignmentMigration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | Rules v2 alignment migration failed', error);
    }
    // Migration: base Speed 6 → 8 (Rules v0.9.8).
    try {
        await runSpeed8mMigration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | speed-8m migration failed', error);
    }
    // Migration: familiars → Summons V2 summonBonds.
    try {
        await runSummonV2Migration(migrationActors);
    }
    catch (error) {
        console.warn('Mastery System | summon-v2 migration failed', error);
    }
    // Migration: Backfill inventory sizes for existing items (GM only)
    if (game.user?.isGM) {
        try {
            const { getDefaultInventorySizeForItemData } = await import('./utils/seed-general-items.js');
            let updated = 0;
            const worldItems = Array.from(game.items || []);
            for (const item of worldItems) {
                const currentSize = item.system?.inventorySize;
                if (currentSize)
                    continue;
                const size = getDefaultInventorySizeForItemData(item);
                if (!size)
                    continue;
                await item.update({ 'system.inventorySize': size });
                updated++;
            }
            for (const actor of migrationActors) {
                const actorItems = Array.from(actor.items || []);
                for (const item of actorItems) {
                    const currentSize = item.system?.inventorySize;
                    if (currentSize)
                        continue;
                    const size = getDefaultInventorySizeForItemData(item);
                    if (!size)
                        continue;
                    await item.update({ 'system.inventorySize': size });
                    updated++;
                }
            }
            const WEAPON_SIZE_BY_NAME = {
                rapier: '1x3',
                spear: '1x4'
            };
            let sizeFixes = 0;
            const applyWeaponSizeFix = async (item) => {
                if (item.type !== 'weapon')
                    return;
                const nk = normalizeWeaponNameKey(item.name || '');
                const want = WEAPON_SIZE_BY_NAME[nk];
                if (!want || item.system?.inventorySize === want)
                    return;
                await item.update({ 'system.inventorySize': want });
                sizeFixes++;
            };
            for (const item of worldItems) {
                await applyWeaponSizeFix(item);
            }
            for (const actor of migrationActors) {
                for (const item of Array.from(actor.items || [])) {
                    await applyWeaponSizeFix(item);
                }
            }
            const { getWeapon } = await import('./utils/weapons.js');
            let gearToWeaponMigrations = 0;
            const migrateCatalogWeaponFromGear = async (item) => {
                if (item.type !== 'gear')
                    return;
                const def = getWeapon(item.name || '');
                if (!def)
                    return;
                const ranged = (def.innateAbilities || []).some((a) => a.toLowerCase().includes('ranged'));
                const specials = def.special && def.special !== '—' ? [def.special] : [];
                const merged = foundry.utils.mergeObject(foundry.utils.deepClone(item.system || {}), {
                    weaponType: ranged ? 'ranged' : 'melee',
                    damage: def.weaponDamage,
                    range: ranged ? '10m' : '0m',
                    hands: def.hands,
                    innateAbilities: def.innateAbilities || [],
                    specials,
                    equipSlots: def.hands === 2 ? ['mainhand'] : ['mainhand', 'offhand']
                });
                if (!merged.inventorySize) {
                    merged.inventorySize =
                        getDefaultInventorySizeForItemData({ type: 'weapon', name: def.name, system: merged }) || '1x3';
                }
                try {
                    await item.update({ type: 'weapon', system: merged });
                    gearToWeaponMigrations++;
                }
                catch (err) {
                    console.warn('Mastery System | Gear→weapon migration failed for', item.name, err);
                }
            };
            for (const item of worldItems) {
                await migrateCatalogWeaponFromGear(item);
            }
            for (const actor of migrationActors) {
                for (const item of Array.from(actor.items || [])) {
                    await migrateCatalogWeaponFromGear(item);
                }
            }
            if (gearToWeaponMigrations > 0) {
                ui.notifications?.info(`Mastery System: ${gearToWeaponMigrations} item(s) set to type Weapon (Players Guide names).`);
            }
        }
        catch (error) {
            console.warn('Mastery System | Inventory size migration failed:', error);
        }
    }
    // Migration: default system.equipSlots for legacy weapon / armor / shield / artifact (empty/missing only)
    if (game.user?.isGM) {
        try {
            const { inferDefaultEquipSlotsForType, inferArtifactEquipSlots } = await import('./utils/equip-slots.js');
            let equipMigrated = 0;
            const inferSlots = (item) => {
                if (item.type === 'artifact')
                    return inferArtifactEquipSlots(item.system);
                return inferDefaultEquipSlotsForType(item);
            };
            const needsBackfill = (item) => {
                if (!['weapon', 'armor', 'shield', 'artifact'].includes(item.type))
                    return false;
                const raw = item.system?.equipSlots;
                if (Array.isArray(raw) && raw.length > 0)
                    return false;
                return !!inferSlots(item);
            };
            const worldItems = Array.from(game.items || []);
            for (const item of worldItems) {
                if (!needsBackfill(item))
                    continue;
                const def = inferSlots(item);
                if (!def)
                    continue;
                await item.update({ 'system.equipSlots': def });
                equipMigrated++;
            }
            for (const actor of migrationActors) {
                const actorItems = Array.from(actor.items || []);
                for (const item of actorItems) {
                    if (!needsBackfill(item))
                        continue;
                    const def = inferSlots(item);
                    if (!def)
                        continue;
                    await item.update({ 'system.equipSlots': def });
                    equipMigrated++;
                }
            }
        }
        catch (error) {
            console.warn('Mastery System | equipSlots migration failed:', error);
        }
    }
    // Optional: Try to backfill armor/shield items from system.combat.armorName/shieldName
    // This is optional and only runs if utils/equipment.ts exists
    try {
        const equipmentModule = await import('./utils/equipment.js');
        if (equipmentModule.getAllArmor && equipmentModule.getAllShields) {
            let backfilled = 0;
            for (const actor of migrationActors) {
                try {
                    const system = actor.system;
                    const combat = system?.combat || {};
                    const items = actor.items || [];
                    // Check for armor
                    if (combat.armorName && !items.some((item) => item.type === 'armor')) {
                        const allArmor = equipmentModule.getAllArmor();
                        const matchingArmor = allArmor.find((a) => a.name === combat.armorName);
                        if (matchingArmor) {
                            const armorItem = {
                                name: matchingArmor.name,
                                type: 'armor',
                                system: {
                                    type: matchingArmor.type || 'light',
                                    armorValue: matchingArmor.armorValue || 0,
                                    evadeModifier: matchingArmor.evadeModifier || 0,
                                    skillPenalty: matchingArmor.skillPenalty || '',
                                    equipped: true,
                                    description: matchingArmor.description || ''
                                }
                            };
                            await actor.createEmbeddedDocuments('Item', [armorItem]);
                            backfilled++;
                        }
                        else {
                            console.warn(`Mastery System | Could not find armor definition for "${combat.armorName}" (actor: ${actor.name})`);
                        }
                    }
                    // Check for shield
                    if (combat.shieldName && !items.some((item) => item.type === 'shield')) {
                        const allShields = equipmentModule.getAllShields();
                        const matchingShield = allShields.find((s) => s.name === combat.shieldName);
                        if (matchingShield) {
                            const shieldItem = {
                                name: matchingShield.name,
                                type: 'shield',
                                system: {
                                    type: matchingShield.type || 'light',
                                    shieldValue: matchingShield.shieldValue || 0,
                                    evadeBonus: matchingShield.evadeBonus || 0,
                                    skillPenalty: matchingShield.skillPenalty || '',
                                    equipped: true,
                                    description: matchingShield.description || ''
                                }
                            };
                            await actor.createEmbeddedDocuments('Item', [shieldItem]);
                            backfilled++;
                        }
                        else {
                            console.warn(`Mastery System | Could not find shield definition for "${combat.shieldName}" (actor: ${actor.name})`);
                        }
                    }
                }
                catch (error) {
                    console.warn(`Mastery System | Could not backfill equipment for ${actor.name}:`, error);
                }
            }
        }
    }
    catch (error) {
        // utils/equipment.ts doesn't exist or doesn't export the needed functions - that's okay
    }
    // Migration: Fix stone pool current values for existing actors
    const characterActors = game.actors?.filter((a) => a.type === 'character') || [];
    let stonePoolsFixed = 0;
    for (const actor of characterActors) {
        try {
            const system = actor.system;
            const stonePools = system?.stonePools || {};
            const attributes = system?.attributes || {};
            const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
            const updates = {};
            let needsUpdate = false;
            for (const attrKey of attributeKeys) {
                const pool = stonePools[attrKey];
                if (!pool)
                    continue;
                const attrValue = attributes[attrKey]?.value || 0;
                const maxStones = Math.floor(attrValue / 8);
                const sustained = pool.sustained ?? 0;
                const effectiveMax = Math.max(0, maxStones - sustained);
                // Only fix if max > 0 (actor has stones)
                if (maxStones > 0) {
                    // Fix if current is undefined/null OR if current is 0 and actor is not in active combat
                    const isInCombat = game.combat?.active && game.combat.combatants.some((c) => c.actor?.id === actor.id);
                    const shouldFix = pool.current === undefined ||
                        pool.current === null ||
                        (pool.current === 0 && !isInCombat);
                    if (shouldFix) {
                        updates[`system.stonePools.${attrKey}.current`] = effectiveMax;
                        updates[`system.stonePools.${attrKey}.max`] = maxStones;
                        needsUpdate = true;
                    }
                }
            }
            if (needsUpdate) {
                await actor.update(updates);
                stonePoolsFixed++;
            }
        }
        catch (error) {
            console.warn(`Mastery System | Could not migrate stone pools for ${actor.name}:`, error);
        }
    }
});
/**
 * Set default scene background image when creating new scenes
 */
Hooks.on('preCreateScene', (_scene, data, _options, _userId) => {
    // Only set default if no background image is provided
    if (!data.img && (!data.background || !data.background.src)) {
        const defaultImage = game.settings.get('mastery-system', 'defaultSceneImage');
        if (defaultImage && defaultImage.trim() !== '') {
            // Set the background image - Foundry uses 'img' field for scene background
            data.img = defaultImage;
        }
    }
});
/**
 * Handle attack roll button clicks in chat
 * Use event delegation on the chat log container to catch all button clicks
 */
/**
 * Equip Exclusivity Hook
 * Ensures only one weapon/armor/shield can be equipped at a time
 */
Hooks.on('preUpdateItem', async (item, changes, _options, _userId) => {
    // Only process if this is the updating user
    if (_userId !== game.user?.id) {
        return;
    }
    // Only process if item is embedded in an actor and equipped is being set to true
    if (!item.parent || item.parent.documentName !== 'Actor') {
        return;
    }
    const itemType = item.type;
    if (!['weapon', 'armor', 'shield'].includes(itemType)) {
        return;
    }
    if (changes.system?.equipped !== true) {
        return;
    }
    const actor = item.parent;
    const items = actor.items || [];
    // Find all other items of the same type that are equipped
    const otherEquippedItems = items.filter((otherItem) => {
        return otherItem.id !== item.id &&
            otherItem.type === itemType &&
            otherItem.system?.equipped === true;
    });
    if (otherEquippedItems.length > 0) {
        // Unequip all other items of the same type
        const updates = otherEquippedItems.map((otherItem) => ({
            _id: otherItem.id,
            'system.equipped': false
        }));
        await actor.updateEmbeddedDocuments('Item', updates);
    }
});
/**
 * Echo-bound artifacts are intrinsic to the character (Elven Stride, Wyrm /
 * Serpent Scales, Dragon Claws, Dragon Head, frames, ...). They are auto-equipped
 * at creation and must never be deleted by the player. Programmatic flows that
 * legitimately remove them (full reset, echo re-selection, tree migration) pass
 * `{ masterySystemForceDelete: true }` to bypass this guard.
 */
Hooks.on('preDeleteItem', (item, options, _userId) => {
    if (options?.masterySystemForceDelete === true)
        return true;
    if (!item?.parent || item.parent.documentName !== 'Actor')
        return true;
    if (item.type !== 'artifact')
        return true;
    const locked = item.getFlag?.('mastery-system', 'echoLocked') === true ||
        item.getFlag?.('mastery-system', 'echoBound') === true ||
        String(item.system?.binding || '') === 'echo';
    if (!locked)
        return true;
    ui?.notifications?.warn(`${item.name} is an Echo-bound artifact and cannot be removed. Use "Reset Character" to start over.`);
    return false;
});
//# sourceMappingURL=module.js.map