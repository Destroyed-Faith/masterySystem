/**
 * Mastery Combat Carousel UI
 * Displays combatants as portrait cards with initiative, resources, and controls
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseCarousel = HandlebarsApplicationMixin(ApplicationV2);
export class CombatCarouselApp extends BaseCarousel {
    static _instance = null;
    static DEFAULT_OPTIONS = {
        id: 'mastery-combat-carousel',
        classes: ['mastery-system', 'combat-carousel'],
        position: { width: 'auto' }, // Use CSS for full width instead of "100%"
        window: {
            title: 'Combat Carousel',
            frame: false, // No window frame (ApplicationV2 equivalent of popOut: false)
            positioned: false, // Let CSS handle positioning
            resizable: false,
            minimizable: false
        }
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/combat-carousel.hbs' }
    };
    /**
     * Open the carousel (singleton pattern)
     */
    static open() {
        console.log('Mastery System | [CAROUSEL] Opening carousel');
        // Check for existing instance
        const existingApp = foundry.applications.instances.get('mastery-combat-carousel');
        if (existingApp) {
            existingApp.bringToFront();
            return;
        }
        if (!CombatCarouselApp._instance) {
            console.log('Mastery System | [CAROUSEL] Creating new instance');
            CombatCarouselApp._instance = new CombatCarouselApp();
        }
        console.log('Mastery System | [CAROUSEL] Rendering carousel');
        CombatCarouselApp._instance.render({ force: true, focus: false });
    }
    /**
     * Close the carousel
     */
    static close() {
        if (CombatCarouselApp._instance) {
            CombatCarouselApp._instance.close();
            CombatCarouselApp._instance = null;
        }
    }
    /**
     * Get the singleton instance
     */
    static get instance() {
        return CombatCarouselApp._instance;
    }
    async _prepareContext(_options) {
        const combat = game.combats?.active;
        console.log('Mastery System | [CAROUSEL] _prepareContext called', {
            hasCombat: !!combat,
            combatId: combat?.id,
            combatantsCount: combat?.combatants?.size || 0
        });
        if (!combat) {
            console.log('Mastery System | [CAROUSEL] No active combat, returning inactive');
            return { active: false };
        }
        // Get settings for resource paths
        const resource1Path = game.settings.get('mastery-system', 'carouselResource1Path') || 'tracked.hp';
        const resource2Path = game.settings.get('mastery-system', 'carouselResource2Path') || 'tracked.stress';
        const resource1Label = game.settings.get('mastery-system', 'carouselResource1Label') || 'HP';
        const resource2Label = game.settings.get('mastery-system', 'carouselResource2Label') || 'Stress';
        // Build combatants array
        const combatants = [];
        // Use combat.turns if available, otherwise sort combatants by initiative
        let turns = combat.turns || [];
        if (turns.length === 0 && combat.combatants) {
            turns = Array.from(combat.combatants.values()).sort((a, b) => {
                return (b.initiative ?? 0) - (a.initiative ?? 0);
            });
        }
        for (const combatant of turns) {
            const actor = combatant.actor;
            if (!actor)
                continue;
            const tokenId = combatant.tokenId || combatant.token?.id;
            const token = tokenId ? canvas.tokens?.get(tokenId) : null;
            // Get resources from tracked fields
            const resource1 = this.getResourceValue(actor, resource1Path);
            const resource2 = this.getResourceValue(actor, resource2Path);
            // Get status icons from actor effects (ActiveEffect documents)
            const statusIcons = [];
            if (actor.effects) {
                // Use ActiveEffect documents from actor
                const effects = actor.effects || [];
                statusIcons.push(...effects.map((e) => {
                    const icon = e.icon || e.img || '';
                    return icon;
                }).filter((i) => i));
            }
            combatants.push({
                id: combatant.id,
                name: combatant.name || actor.name,
                img: combatant.img || actor.img,
                initiative: combatant.initiative ?? 0,
                isCurrent: combatant.id === combat.current?.combatantId,
                hidden: combatant.hidden || false,
                defeated: combatant.defeated || false,
                resource1: {
                    ...resource1,
                    label: resource1Label
                },
                resource2: {
                    ...resource2,
                    label: resource2Label
                },
                statusIcons: statusIcons.filter((icon) => icon),
                hasToken: !!token,
                tokenId: tokenId
            });
        }
        return {
            active: true,
            combatants,
            controlsAllowed: game.user?.isGM || false,
            currentRound: combat.round || 1,
            currentTurn: combat.turn || 0
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        // Add body class when carousel is rendered
        document.body.classList.add('mastery-carousel-open');
        console.log('Mastery System | [CAROUSEL] Carousel rendered, body class added');
        // Portrait click - pan to token
        root.querySelectorAll('.carousel-portrait').forEach((portrait) => {
            portrait.onclick = async (_ev) => {
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                const tokenId = combatant.tokenId || combatant.token?.id;
                const token = tokenId ? canvas.tokens?.get(tokenId) : null;
                if (token) {
                    token.control({ releaseOthers: true });
                    canvas.animatePan({
                        x: token.center.x,
                        y: token.center.y,
                        scale: canvas.stage.scale.x
                    });
                }
            };
        });
        // Combat controls - Previous Turn
        root.querySelectorAll('.js-prev-turn').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const combat = game.combats?.active;
                if (combat) {
                    await combat.previousTurn();
                }
            };
        });
        // Combat controls - Next Turn
        root.querySelectorAll('.js-next-turn').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const combat = game.combats?.active;
                if (combat) {
                    await combat.nextTurn();
                }
            };
        });
        // Combat controls - Next Round
        root.querySelectorAll('.js-next-round').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const combat = game.combats?.active;
                if (combat) {
                    await combat.nextRound();
                }
            };
        });
        // Combat controls - End Combat
        root.querySelectorAll('.js-end-combat').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (game.user?.isGM) {
                    const combat = game.combats?.active;
                    if (combat) {
                        await combat.endCombat();
                    }
                }
            };
        });
        // Portrait controls - Toggle Defeated
        root.querySelectorAll('.js-toggle-defeated').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                // Only GM or owner can toggle defeated
                const actor = combatant.actor;
                if (!game.user?.isGM && !actor?.isOwner)
                    return;
                await combatant.update({ defeated: !combatant.defeated });
            };
        });
        // Portrait controls - Toggle Hidden
        root.querySelectorAll('.js-toggle-hidden').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                // Only GM can toggle hidden
                if (!game.user?.isGM)
                    return;
                await combatant.update({ hidden: !combatant.hidden });
            };
        });
        // Portrait controls - Ping
        root.querySelectorAll('.js-ping').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                const tokenId = combatant.tokenId || combatant.token?.id;
                const token = tokenId ? canvas.tokens?.get(tokenId) : null;
                if (token) {
                    canvas.ping(token.center);
                }
            };
        });
    }
    async _onClose(_options) {
        // Remove body class when carousel is closed
        document.body.classList.remove('mastery-carousel-open');
        console.log('Mastery System | [CAROUSEL] Carousel closed, body class removed');
        return super._onClose(_options);
    }
    /**
     * Safely get resource value from actor system using path
     */
    getResourceValue(actor, path) {
        try {
            // Resolve path like "tracked.hp" to actor.system.tracked.hp
            const parts = path.split('.');
            let current = actor.system;
            for (const part of parts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                }
                else {
                    return { value: 0, max: 0 };
                }
            }
            if (current && typeof current === 'object') {
                return {
                    value: Number(current.value ?? 0),
                    max: Number(current.max ?? 0)
                };
            }
        }
        catch (error) {
            console.warn('Mastery System | Failed to get resource from path', path, error);
        }
        return { value: 0, max: 0 };
    }
}
//# sourceMappingURL=combat-carousel.js.map