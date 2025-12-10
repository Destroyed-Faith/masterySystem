/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 */
import { getAvailableManeuvers } from './system/combat-maneuvers.js';
import { handleChosenCombatOption } from './token-action-selector.js';
const MS_INNER_SEGMENTS = [
    { id: 'movement', color: 0xffe066, label: 'Move' },
    { id: 'attack', color: 0xff6666, label: 'Atk' },
    { id: 'utility', color: 0x66aaff, label: 'Util' },
    { id: 'active-buff', color: 0xcc88ff, label: 'Buff' }
];
const MS_OUTER_RADIUS = 140;
const MS_INNER_RADIUS = 60;
// Global state
let msRadialMenu = null;
let msRangePreviewGfx = null;
let msRadialCloseHandler = null;
/**
 * Parse range string (e.g., "8m", "12m", "Self") to numeric meters
 */
function parseRange(rangeStr) {
    if (!rangeStr)
        return undefined;
    // Handle "Self" or "0m" as 0
    if (rangeStr.toLowerCase() === 'self' || rangeStr === '0m') {
        return 0;
    }
    // Extract numeric value from strings like "8m", "12m", "24m"
    const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (match) {
        return parseFloat(match[1]);
    }
    return undefined;
}
/**
 * Convert system units (meters) to pixels
 */
function unitsToPixels(units) {
    // 1 unit = 1 grid square
    // canvas.grid.size = pixels per square
    return units * (canvas.grid?.size || 100);
}
/**
 * Clear the range preview graphics
 */
function clearRangePreview() {
    if (msRangePreviewGfx && msRangePreviewGfx.parent) {
        msRangePreviewGfx.parent.removeChild(msRangePreviewGfx);
    }
    msRangePreviewGfx = null;
}
/**
 * Show range preview circle around token
 */
function showRangePreview(token, rangeUnits) {
    clearRangePreview();
    if (!rangeUnits || rangeUnits <= 0)
        return;
    const radiusPx = unitsToPixels(rangeUnits);
    const gfx = new PIXI.Graphics();
    // Cyan circle with transparency
    gfx.lineStyle(2, 0x00ffff, 0.8);
    gfx.beginFill(0x00ffff, 0.1);
    gfx.drawCircle(0, 0, radiusPx);
    gfx.endFill();
    msRangePreviewGfx = gfx;
    // Add to effects layer so it appears above tokens
    if (canvas.effects) {
        canvas.effects.addChild(gfx);
        // Position at token center
        const tokenCenter = token.center;
        gfx.position.set(tokenCenter.x, tokenCenter.y);
    }
}
/**
 * Close the radial menu and clean up
 */
export function closeRadialMenu() {
    clearRangePreview();
    if (msRadialMenu && msRadialMenu.parent) {
        msRadialMenu.parent.removeChild(msRadialMenu);
    }
    msRadialMenu = null;
    if (msRadialCloseHandler) {
        window.removeEventListener('mousedown', msRadialCloseHandler, true);
        msRadialCloseHandler = null;
    }
}
/**
 * Map an option to one of the 4 inner segment IDs
 */
function getSegmentIdForOption(option) {
    // Active Buff powers get their own segment
    // Check if it's a power with buff/active-buff type that requires an action
    if (option.source === 'power' && option.item) {
        const powerType = option.powerType || option.item.system?.powerType;
        const cost = option.item.system?.cost;
        // If it's a buff/active-buff power that requires an action, it's an active buff
        if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
            return 'active-buff';
        }
        // Also check if power type is 'active' but has buff-like characteristics
        // (This is a heuristic - you may need to adjust based on your power definitions)
        if (powerType === 'active' && option.slot === 'attack') {
            // Check if description or name suggests it's a buff
            const nameLower = option.name.toLowerCase();
            const descLower = (option.description || '').toLowerCase();
            if (nameLower.includes('buff') || descLower.includes('buff') ||
                nameLower.includes('stance') || descLower.includes('stance')) {
                return 'active-buff';
            }
        }
    }
    // Map by slot
    switch (option.slot) {
        case 'movement':
            return 'movement';
        case 'attack':
            return 'attack';
        case 'utility':
            return 'utility';
        case 'reaction':
            // Reactions typically go to utility, but we can adjust if needed
            return 'utility';
        default:
            return 'attack';
    }
}
/**
 * Get all combat options for an actor (all categories)
 */
export function getAllCombatOptionsForActor(actor) {
    const options = [];
    // --- POWERS (from Actor items) ---
    const items = actor.items || [];
    for (const item of items) {
        if (item.type !== 'special')
            continue;
        const powerType = item.system?.powerType;
        if (!powerType)
            continue;
        // Only include combat-usable powers
        if (!['movement', 'active', 'active-buff', 'buff', 'utility', 'reaction'].includes(powerType)) {
            continue;
        }
        // Map power type to slot
        const slot = mapPowerTypeToSlot(powerType);
        // Parse range
        const rangeStr = item.system?.range;
        const range = parseRange(rangeStr);
        options.push({
            id: item.id,
            name: item.name,
            description: item.system?.description || '',
            slot: slot,
            source: 'power',
            range: range,
            item: item,
            powerType: powerType
        });
    }
    // --- MANEUVERS (generic combat maneuvers) ---
    const availableManeuvers = getAvailableManeuvers(actor);
    for (const maneuver of availableManeuvers) {
        // Maneuvers don't typically have range, but we can add it if needed
        options.push({
            id: maneuver.id,
            name: maneuver.name,
            description: maneuver.description || (maneuver.effect || ''),
            slot: maneuver.slot,
            source: 'maneuver',
            maneuver: maneuver
        });
    }
    return options;
}
/**
 * Map power type to combat slot
 */
function mapPowerTypeToSlot(powerType) {
    switch (powerType) {
        case 'movement':
            return 'movement';
        case 'reaction':
            return 'reaction';
        case 'utility':
            return 'utility';
        case 'active':
        case 'active-buff':
        case 'buff':
        default:
            return 'attack';
    }
}
/**
 * Shorten option name for display
 */
function shortenOptionName(name) {
    if (!name)
        return '';
    if (name.length <= 8)
        return name;
    return name.slice(0, 7) + '…';
}
/**
 * Create a radial option button for the outer ring
 */
function createRadialOptionButton(option, angle, token, ringColor) {
    const container = new PIXI.Container();
    const x = Math.cos(angle) * MS_OUTER_RADIUS;
    const y = Math.sin(angle) * MS_OUTER_RADIUS;
    container.position.set(x, y);
    // Button bubble
    const bubble = new PIXI.Graphics();
    bubble.beginFill(ringColor, 0.95);
    bubble.drawCircle(0, 0, 18);
    bubble.endFill();
    container.addChild(bubble);
    // Label text
    const label = new PIXI.Text(shortenOptionName(option.name), {
        fontSize: 10,
        fill: 0x000000,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 30
    });
    label.anchor.set(0.5);
    container.addChild(label);
    container.interactive = true;
    container.buttonMode = true;
    // Hover: show range preview and scale up
    container.on('pointerover', () => {
        bubble.scale.set(1.1);
        if (option.range !== undefined) {
            showRangePreview(token, option.range);
        }
    });
    container.on('pointerout', () => {
        bubble.scale.set(1.0);
        clearRangePreview();
    });
    // Click: select option
    container.on('pointertap', async () => {
        // Store the chosen option as a flag
        const segmentId = getSegmentIdForOption(option);
        // Map segment ID back to CombatSlot for the flag
        const category = segmentId === 'active-buff' ? 'attack' : segmentId;
        await token.document.setFlag('mastery-system', 'currentAction', {
            category: category,
            kind: option.source === 'power' ? 'power' : 'maneuver',
            optionId: option.id,
            optionSource: option.source
        });
        // Trigger handler
        handleChosenCombatOption(token, option);
        closeRadialMenu();
    });
    return container;
}
/**
 * Render the outer ring of option buttons
 */
function renderOuterRing(root, token, allOptions, segmentId) {
    // Remove existing outer ring elements
    const toRemove = [];
    root.children.forEach((child) => {
        if (child.msOuterButton === true || child.msOuterRing === true) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(child => root.removeChild(child));
    // Get segment metadata
    const segMeta = MS_INNER_SEGMENTS.find(s => s.id === segmentId);
    const ringColor = segMeta ? segMeta.color : 0xffffff;
    // Background ring
    const ringGfx = new PIXI.Graphics();
    ringGfx.lineStyle(2, ringColor, 0.7);
    ringGfx.beginFill(ringColor, 0.08);
    ringGfx.drawCircle(0, 0, MS_OUTER_RADIUS);
    ringGfx.endFill();
    ringGfx.msOuterRing = true;
    root.addChild(ringGfx);
    // Filter options for this segment
    const optionsForSegment = allOptions.filter(opt => getSegmentIdForOption(opt) === segmentId);
    if (!optionsForSegment.length) {
        // Show "No options" text
        const noOptionsText = new PIXI.Text('No options', {
            fontSize: 14,
            fill: ringColor,
            align: 'center'
        });
        noOptionsText.anchor.set(0.5);
        noOptionsText.msOuterRing = true;
        root.addChild(noOptionsText);
        return;
    }
    // Distribute buttons evenly around the ring
    const angleStep = (Math.PI * 2) / optionsForSegment.length;
    const startAngle = -Math.PI / 2; // Start at top
    optionsForSegment.forEach((option, index) => {
        const angle = startAngle + index * angleStep;
        const btn = createRadialOptionButton(option, angle, token, ringColor);
        btn.msOuterButton = true;
        root.addChild(btn);
    });
}
/**
 * Render the inner segmented circle
 */
function renderInnerSegments(root, _token, _allOptions, getCurrentSegmentId, setCurrentSegmentId, onSegmentChange) {
    // Remove existing inner segments
    const toRemove = [];
    root.children.forEach((child) => {
        if (child.msInnerSegment === true) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(child => root.removeChild(child));
    const segmentCount = MS_INNER_SEGMENTS.length;
    const angleStep = (Math.PI * 2) / segmentCount;
    const startAngle = -Math.PI / 2; // Start at top
    MS_INNER_SEGMENTS.forEach((seg, index) => {
        const container = new PIXI.Container();
        container.msInnerSegment = true;
        root.addChild(container);
        const gfx = new PIXI.Graphics();
        const baseAngle = startAngle + index * angleStep;
        const endAngle = baseAngle + angleStep;
        const isActive = getCurrentSegmentId() === seg.id;
        // Draw pie slice
        gfx.beginFill(seg.color, isActive ? 0.9 : 0.6);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        gfx.endFill();
        // Add border
        gfx.lineStyle(2, 0x000000, isActive ? 0.8 : 0.5);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        container.addChild(gfx);
        // Label in the middle of the slice
        const midAngle = baseAngle + angleStep / 2;
        const labelRadius = MS_INNER_RADIUS * 0.6;
        const lx = Math.cos(midAngle) * labelRadius;
        const ly = Math.sin(midAngle) * labelRadius;
        const text = new PIXI.Text(seg.label, {
            fontSize: 12,
            fill: 0x000000,
            align: 'center',
            fontWeight: isActive ? 'bold' : 'normal'
        });
        text.anchor.set(0.5);
        text.position.set(lx, ly);
        container.addChild(text);
        // Make interactive
        container.interactive = true;
        container.buttonMode = true;
        container.on('pointertap', () => {
            setCurrentSegmentId(seg.id);
            onSegmentChange();
        });
    });
}
/**
 * Open the radial menu for an actor's token
 */
export function openRadialMenuForActor(token, allOptions) {
    closeRadialMenu();
    if (!canvas.hud) {
        console.warn('Mastery System | Canvas HUD not available');
        return;
    }
    const root = new PIXI.Container();
    msRadialMenu = root;
    // Add to HUD layer so it appears above tokens
    canvas.hud.addChild(root);
    // Center on token
    const tokenCenter = token.center;
    root.position.set(tokenCenter.x, tokenCenter.y);
    // Track currently selected segment (default to "attack")
    let currentSegmentId = 'attack';
    // Function to update both inner and outer rings when segment changes
    const updateMenu = () => {
        renderInnerSegments(root, token, allOptions, () => currentSegmentId, (newId) => {
            currentSegmentId = newId;
            updateMenu();
        }, () => {
            updateMenu();
        });
        renderOuterRing(root, token, allOptions, currentSegmentId);
    };
    // Initial render
    updateMenu();
    // Outside-click closes the menu
    msRadialCloseHandler = (_event) => {
        if (!msRadialMenu)
            return;
        // Get the click position in canvas coordinates
        const canvasPoint = canvas.app.renderer.plugins.interaction.mouse.global;
        // Calculate distance from token center
        const dx = canvasPoint.x - tokenCenter.x;
        const dy = canvasPoint.y - tokenCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // If click is outside the outer ring (with some margin for easier clicking), close
        if (distance > MS_OUTER_RADIUS + 30) {
            closeRadialMenu();
        }
    };
    window.addEventListener('mousedown', msRadialCloseHandler, true);
}
//# sourceMappingURL=token-radial-menu.js.map