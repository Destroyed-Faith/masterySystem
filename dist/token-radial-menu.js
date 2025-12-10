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
const MS_INNER_RADIUS = 60;
const MS_OUTER_RING_INNER = 80; // Inner radius of outer ring (where wedges start)
const MS_OUTER_RING_OUTER = 140; // Outer radius of outer ring (where wedges end)
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
    // Try multiple approaches for Foundry v13 compatibility
    let effectsContainer = null;
    if (canvas.effects) {
        // Try v13 structure first (container property)
        if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
            effectsContainer = canvas.effects.container;
        }
        // Try direct addChild (older versions)
        else if (typeof canvas.effects.addChild === 'function') {
            effectsContainer = canvas.effects;
        }
    }
    // Fallback to foreground if effects doesn't work
    if (!effectsContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            effectsContainer = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            effectsContainer = canvas.foreground;
        }
    }
    if (effectsContainer) {
        effectsContainer.addChild(gfx);
        // Position at token center
        const tokenCenter = token.center;
        gfx.position.set(tokenCenter.x, tokenCenter.y);
    }
    else {
        console.warn('Mastery System | Could not find effects layer for range preview');
    }
}
/**
 * Close the radial menu and clean up
 */
export function closeRadialMenu() {
    clearRangePreview();
    hideRadialInfoPanel();
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
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
function getSegmentIdForOption(option) {
    // Active Buff powers get their own segment
    // Check if it's a power with buff/active-buff type that requires an action
    if (option.source === 'power' && option.item) {
        const powerType = option.powerType || option.item.system?.powerType;
        const cost = option.item.system?.cost;
        // If it's explicitly an active-buff or buff power that requires an action, it's an active buff
        if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
            return 'active-buff';
        }
        // Check tags for active-buff indicators
        const tags = option.tags || [];
        if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
            if (cost?.action === true) {
                return 'active-buff';
            }
        }
        // Also check if power type is 'active' but has buff-like characteristics
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
            // Reactions go to utility segment
            return 'utility';
        default:
            // Default to attack for offensive actions
            return 'attack';
    }
}
/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 */
export function getAllCombatOptionsForActor(actor) {
    const options = [];
    if (!actor) {
        console.warn('Mastery System | getAllCombatOptionsForActor: No actor provided');
        return options;
    }
    // --- POWERS (from Actor items) ---
    const items = actor.items || [];
    for (const item of items) {
        // Powers are stored as items with type "special"
        if (item.type !== 'special')
            continue;
        const powerType = item.system?.powerType;
        if (!powerType)
            continue;
        // Only include combat-usable powers
        // Include: movement, active, active-buff, buff, utility, reaction
        // Exclude: passive (these are not combat actions)
        if (!['movement', 'active', 'active-buff', 'buff', 'utility', 'reaction'].includes(powerType)) {
            continue;
        }
        // Map power type to slot
        const slot = mapPowerTypeToSlot(powerType);
        // Parse range from system.range (e.g., "8m", "12m", "Self")
        const rangeStr = item.system?.range;
        const range = parseRange(rangeStr);
        // Get tags if available
        const tags = item.system?.tags || [];
        options.push({
            id: item.id,
            name: item.name,
            description: item.system?.description || item.system?.effect || '',
            slot: slot,
            source: 'power',
            range: range,
            item: item,
            powerType: powerType,
            tags: Array.isArray(tags) ? tags : []
        });
    }
    // --- MANEUVERS (generic combat maneuvers) ---
    // Get available maneuvers for this actor (filters by requirements)
    const availableManeuvers = getAvailableManeuvers(actor);
    for (const maneuver of availableManeuvers) {
        // Maneuvers have their slot defined in the maneuver data
        // They typically don't have range, but we can check if needed
        options.push({
            id: maneuver.id,
            name: maneuver.name,
            description: maneuver.description || (maneuver.effect || ''),
            slot: maneuver.slot,
            source: 'maneuver',
            maneuver: maneuver,
            tags: maneuver.tags || []
        });
    }
    console.log(`Mastery System | Collected ${options.length} combat options for actor:`, {
        powers: options.filter(o => o.source === 'power').length,
        maneuvers: options.filter(o => o.source === 'maneuver').length,
        bySegment: {
            movement: options.filter(o => getSegmentIdForOption(o) === 'movement').length,
            attack: options.filter(o => getSegmentIdForOption(o) === 'attack').length,
            utility: options.filter(o => getSegmentIdForOption(o) === 'utility').length,
            'active-buff': options.filter(o => getSegmentIdForOption(o) === 'active-buff').length
        }
    });
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
    if (name.length <= 12)
        return name;
    return name.slice(0, 11) + '…';
}
/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(worldX, worldY) {
    // Try multiple methods for Foundry v13 compatibility
    let screenX = 0;
    let screenY = 0;
    // Method 1: Use canvas stage toGlobal (if available)
    if (canvas.stage && typeof canvas.stage.toGlobal === 'function') {
        const worldPoint = new PIXI.Point(worldX, worldY);
        const globalPoint = canvas.stage.toGlobal(worldPoint);
        screenX = globalPoint.x;
        screenY = globalPoint.y;
    }
    // Method 2: Use renderer plugins interaction (older API)
    else if (canvas.app?.renderer?.plugins?.interaction?.mapPositionToPoint) {
        const point = new PIXI.Point();
        canvas.app.renderer.plugins.interaction.mapPositionToPoint(point, worldX, worldY);
        screenX = point.x;
        screenY = point.y;
    }
    // Method 3: Manual calculation using stage transform
    else if (canvas.stage) {
        const stage = canvas.stage;
        const transform = stage.worldTransform;
        screenX = transform.a * worldX + transform.c * worldY + transform.tx;
        screenY = transform.b * worldX + transform.d * worldY + transform.ty;
    }
    // Fallback: use canvas dimensions and grid
    else {
        // Rough approximation using stage scale
        const scale = canvas.stage?.scale?.x || 1;
        screenX = worldX * scale;
        screenY = worldY * scale;
    }
    return { x: screenX, y: screenY };
}
/**
 * Get or create the info panel div
 */
function getOrCreateInfoDiv() {
    let infoDiv = document.getElementById('ms-radial-info');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'ms-radial-info';
        infoDiv.className = 'ms-radial-info hidden';
        document.body.appendChild(infoDiv);
    }
    return infoDiv;
}
/**
 * Show the info panel with option details
 */
function showRadialInfoPanel(token, option) {
    const info = getOrCreateInfoDiv();
    info.classList.remove('hidden');
    const screenPos = worldToScreen(token.center.x, token.center.y);
    // Position to the right of the token center
    info.style.left = `${screenPos.x + 200}px`;
    info.style.top = `${screenPos.y - 100}px`;
    const segmentId = getSegmentIdForOption(option);
    const category = segmentId === 'active-buff' ? 'attack' : segmentId;
    const rangeText = option.range !== undefined ? `${option.range}m` : '–';
    info.innerHTML = `
    <div class="ms-info-title">${option.name}</div>
    <div class="ms-info-meta">
      <span class="ms-info-source">${option.source}</span> · <span class="ms-info-slot">${category}</span>
    </div>
    <div class="ms-info-range">Range: ${rangeText}</div>
    <div class="ms-info-desc">${option.description || 'No description available'}</div>
  `;
}
/**
 * Hide the info panel
 */
function hideRadialInfoPanel() {
    const info = document.getElementById('ms-radial-info');
    if (info) {
        info.classList.add('hidden');
    }
}
/**
 * Create a radial option wedge/slice for the outer ring
 */
function createRadialOptionSlice(option, startAngle, endAngle, token, ringColor) {
    const container = new PIXI.Container();
    // Create the wedge graphics
    const wedge = new PIXI.Graphics();
    // Draw the wedge as a ring segment (donut slice)
    // Start from inner radius at startAngle
    const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
    const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
    const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
    const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
    wedge.beginFill(ringColor, 0.6); // Default alpha
    wedge.moveTo(innerStartX, innerStartY);
    // Arc along outer radius
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    // Line to inner radius at endAngle
    wedge.lineTo(innerEndX, innerEndY);
    // Arc back along inner radius
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    wedge.closePath();
    wedge.endFill();
    // Add border
    wedge.lineStyle(2, ringColor, 0.8);
    // Outer arc
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    // Line from outer to inner at endAngle
    wedge.moveTo(innerEndX, innerEndY);
    wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
    // Inner arc
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    // Line from inner to outer at startAngle
    wedge.moveTo(innerStartX, innerStartY);
    wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
    container.addChild(wedge);
    // Calculate text position (center of the wedge)
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = (MS_OUTER_RING_INNER + MS_OUTER_RING_OUTER) / 2;
    const textX = Math.cos(midAngle) * textRadius;
    const textY = Math.sin(midAngle) * textRadius;
    // Label text
    const label = new PIXI.Text(shortenOptionName(option.name), {
        fontSize: 11,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: (MS_OUTER_RING_OUTER - MS_OUTER_RING_INNER) * 0.8
    });
    label.anchor.set(0.5);
    label.position.set(textX, textY);
    container.addChild(label);
    // Make the entire wedge interactive
    container.interactive = true;
    container.buttonMode = true;
    // Store reference to wedge graphics for hover effects
    container.wedgeGfx = wedge;
    container.defaultAlpha = 0.6;
    // Hover: highlight wedge, show range preview, and update info panel
    container.on('pointerover', () => {
        // Visual highlight - increase alpha and redraw
        const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
        const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
        const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
        const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
        wedge.clear();
        wedge.beginFill(ringColor, 1.0); // Full alpha on hover
        wedge.moveTo(innerStartX, innerStartY);
        wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
        wedge.lineTo(innerEndX, innerEndY);
        wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
        wedge.closePath();
        wedge.endFill();
        // Add brighter border
        wedge.lineStyle(3, ringColor, 1.0);
        wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
        wedge.moveTo(innerEndX, innerEndY);
        wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
        wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
        wedge.moveTo(innerStartX, innerStartY);
        wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
        // Range preview
        if (option.range !== undefined) {
            showRangePreview(token, option.range);
        }
        // Info panel
        showRadialInfoPanel(token, option);
    });
    container.on('pointerout', () => {
        // Restore default appearance
        const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
        const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
        const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
        const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
        wedge.clear();
        wedge.beginFill(ringColor, 0.6); // Default alpha
        wedge.moveTo(innerStartX, innerStartY);
        wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
        wedge.lineTo(innerEndX, innerEndY);
        wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
        wedge.closePath();
        wedge.endFill();
        // Default border
        wedge.lineStyle(2, ringColor, 0.8);
        wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
        wedge.moveTo(innerEndX, innerEndY);
        wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
        wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
        wedge.moveTo(innerStartX, innerStartY);
        wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
        clearRangePreview();
        hideRadialInfoPanel();
    });
    // Click: select option
    container.on('pointertap', async () => {
        // Store the chosen option as a flag
        const segmentId = getSegmentIdForOption(option);
        // Store segment in flag (this is the quadrant the option came from)
        await token.document.setFlag('mastery-system', 'currentAction', {
            segment: segmentId, // "movement" | "attack" | "utility" | "active-buff"
            category: segmentId === 'active-buff' ? 'attack' : segmentId, // For backward compatibility
            kind: option.source === 'power' ? 'power' : 'maneuver',
            optionId: option.id,
            optionSource: option.source
        });
        console.log('Mastery System | Selected combat option:', {
            segment: segmentId,
            optionId: option.id,
            name: option.name,
            source: option.source
        });
        // Trigger handler
        handleChosenCombatOption(token, option);
        closeRadialMenu();
    });
    return container;
}
/**
 * Render the outer ring of option wedges
 */
function renderOuterRing(root, token, allOptions, segmentId) {
    // Remove existing outer ring elements
    const toRemove = [];
    root.children.forEach((child) => {
        if (child.msOuterSlice === true || child.msOuterRing === true) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(child => root.removeChild(child));
    // Get segment metadata
    const segMeta = MS_INNER_SEGMENTS.find(s => s.id === segmentId);
    const ringColor = segMeta ? segMeta.color : 0xffffff;
    // Faint background ring
    const ringGfx = new PIXI.Graphics();
    ringGfx.lineStyle(2, ringColor, 0.3);
    ringGfx.beginFill(ringColor, 0.05);
    ringGfx.drawCircle(0, 0, MS_OUTER_RING_OUTER);
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
    // Distribute wedges evenly around the ring
    const count = optionsForSegment.length;
    const angleStep = (Math.PI * 2) / count;
    const startAngle = -Math.PI / 2; // Start at top
    optionsForSegment.forEach((option, index) => {
        const baseAngle = startAngle + index * angleStep;
        const endAngle = baseAngle + angleStep;
        const slice = createRadialOptionSlice(option, baseAngle, endAngle, token, ringColor);
        slice.msOuterSlice = true;
        root.addChild(slice);
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
    // In Foundry v13, canvas layers may have different structure
    // Try multiple approaches for compatibility
    let hudContainer = null;
    if (canvas.hud) {
        // Debug: log canvas.hud structure
        const hudKeys = Object.keys(canvas.hud);
        const hudKeyTypes = {};
        hudKeys.forEach(key => {
            const value = canvas.hud[key];
            hudKeyTypes[key] = typeof value;
            if (value && typeof value.addChild === 'function') {
                hudKeyTypes[key] += ' (has addChild)';
            }
        });
        console.log('Mastery System | canvas.hud structure:', {
            hasAddChild: typeof canvas.hud.addChild === 'function',
            hasContainer: !!canvas.hud.container,
            hasObjects: !!canvas.hud.objects,
            keys: hudKeys,
            keyTypes: hudKeyTypes
        });
        // Try v13 structure - check for layers property
        if (canvas.hud.layers) {
            // Foundry v13 uses layers array/object
            const layers = canvas.hud.layers;
            if (layers instanceof Array && layers.length > 0) {
                // Try first layer
                const firstLayer = layers[0];
                if (firstLayer && typeof firstLayer.addChild === 'function') {
                    hudContainer = firstLayer;
                    console.log('Mastery System | Using canvas.hud.layers[0]');
                }
                else if (firstLayer && firstLayer.container && typeof firstLayer.container.addChild === 'function') {
                    hudContainer = firstLayer.container;
                    console.log('Mastery System | Using canvas.hud.layers[0].container');
                }
            }
            else if (layers && typeof layers.addChild === 'function') {
                hudContainer = layers;
                console.log('Mastery System | Using canvas.hud.layers');
            }
        }
        // Try v13 structure - check for interactive property (TokenHUD)
        if (!hudContainer && canvas.hud.interactive && typeof canvas.hud.interactive.addChild === 'function') {
            hudContainer = canvas.hud.interactive;
            console.log('Mastery System | Using canvas.hud.interactive');
        }
        // Try v13 structure - check for children property
        if (!hudContainer && canvas.hud.children && Array.isArray(canvas.hud.children)) {
            // If it has children, it might be a container itself
            if (typeof canvas.hud.addChild === 'function') {
                hudContainer = canvas.hud;
                console.log('Mastery System | Using canvas.hud (has children array)');
            }
        }
        // Try container property
        if (!hudContainer && canvas.hud.container && typeof canvas.hud.container.addChild === 'function') {
            hudContainer = canvas.hud.container;
            console.log('Mastery System | Using canvas.hud.container');
        }
        // Try direct addChild (older versions)
        if (!hudContainer && typeof canvas.hud.addChild === 'function') {
            hudContainer = canvas.hud;
            console.log('Mastery System | Using canvas.hud directly');
        }
        // Try objects container
        if (!hudContainer && canvas.hud.objects && typeof canvas.hud.objects.addChild === 'function') {
            hudContainer = canvas.hud.objects;
            console.log('Mastery System | Using canvas.hud.objects');
        }
        // Try each key to see if any is a PIXI.Container
        if (!hudContainer) {
            for (const key of hudKeys) {
                const value = canvas.hud[key];
                if (value && typeof value.addChild === 'function') {
                    hudContainer = value;
                    console.log(`Mastery System | Using canvas.hud.${key}`);
                    break;
                }
                // Also check nested properties
                if (value && typeof value === 'object') {
                    if (value.container && typeof value.container.addChild === 'function') {
                        hudContainer = value.container;
                        console.log(`Mastery System | Using canvas.hud.${key}.container`);
                        break;
                    }
                }
            }
        }
    }
    // Fallback to tokens layer if HUD doesn't work (tokens layer exists)
    if (!hudContainer && canvas.tokens) {
        if (canvas.tokens.container && typeof canvas.tokens.container.addChild === 'function') {
            hudContainer = canvas.tokens.container;
            console.log('Mastery System | Using canvas.tokens.container');
        }
        else if (typeof canvas.tokens.addChild === 'function') {
            hudContainer = canvas.tokens;
            console.log('Mastery System | Using canvas.tokens directly');
        }
    }
    // Fallback to foreground layer if HUD doesn't work
    if (!hudContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            hudContainer = canvas.foreground.container;
            console.log('Mastery System | Using canvas.foreground.container');
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            hudContainer = canvas.foreground;
            console.log('Mastery System | Using canvas.foreground directly');
        }
    }
    // Last resort: use canvas.app.stage (the root PIXI container)
    if (!hudContainer && canvas.app && canvas.app.stage) {
        hudContainer = canvas.app.stage;
        console.log('Mastery System | Using canvas.app.stage as last resort');
    }
    if (!hudContainer) {
        console.error('Mastery System | Could not find suitable canvas layer for radial menu');
        console.error('Mastery System | Available canvas layers:', {
            hud: !!canvas.hud,
            foreground: !!canvas.foreground,
            effects: !!canvas.effects,
            tokens: !!canvas.tokens
        });
        ui.notifications.error('Could not display radial menu: Canvas layer not available');
        return;
    }
    const root = new PIXI.Container();
    msRadialMenu = root;
    // Add to canvas layer
    hudContainer.addChild(root);
    // Center on token
    const tokenCenter = token.center;
    root.position.set(tokenCenter.x, tokenCenter.y);
    // Track currently selected segment (default to "movement")
    let currentSegmentId = 'movement';
    // Function to re-render outer ring when segment changes
    const rerenderOuter = () => {
        renderOuterRing(root, token, allOptions, currentSegmentId);
    };
    // Function to update inner segments when segment changes
    const updateInner = () => {
        renderInnerSegments(root, token, allOptions, () => currentSegmentId, (newId) => {
            currentSegmentId = newId;
            // Update inner segments to show new active state
            updateInner();
            // Re-render outer ring with filtered options
            rerenderOuter();
        }, () => {
            // This callback is called when segment changes
            rerenderOuter();
        });
    };
    // Initial render
    updateInner();
    rerenderOuter();
    // Outside-click closes the menu
    msRadialCloseHandler = (event) => {
        if (!msRadialMenu)
            return;
        // Get the click position in canvas coordinates
        let canvasPoint = null;
        // Try multiple methods to get mouse position
        // Method 1: Use event coordinates and convert
        if (event && canvas.app?.renderer) {
            const rect = canvas.app.renderer.view.getBoundingClientRect();
            const clientX = event.clientX - rect.left;
            const clientY = event.clientY - rect.top;
            // Convert screen coordinates to world coordinates
            if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
                const screenPoint = new PIXI.Point(clientX, clientY);
                const worldPoint = canvas.stage.toLocal(screenPoint);
                canvasPoint = { x: worldPoint.x, y: worldPoint.y };
            }
            else {
                // Fallback: use screen coordinates directly (approximation)
                const scale = canvas.stage?.scale?.x || 1;
                canvasPoint = { x: clientX / scale, y: clientY / scale };
            }
        }
        // Method 2: Use interaction plugin (if available)
        else if (canvas.app?.renderer?.plugins?.interaction?.mouse?.global) {
            const mouseGlobal = canvas.app.renderer.plugins.interaction.mouse.global;
            if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
                const worldPoint = canvas.stage.toLocal(mouseGlobal);
                canvasPoint = { x: worldPoint.x, y: worldPoint.y };
            }
            else {
                canvasPoint = { x: mouseGlobal.x, y: mouseGlobal.y };
            }
        }
        // If we couldn't get the point, just close on any click
        if (!canvasPoint) {
            closeRadialMenu();
            return;
        }
        // Calculate distance from token center
        const dx = canvasPoint.x - tokenCenter.x;
        const dy = canvasPoint.y - tokenCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // If click is outside the outer ring (with some margin for easier clicking), close
        if (distance > MS_OUTER_RING_OUTER + 30) {
            closeRadialMenu();
        }
    };
    window.addEventListener('mousedown', msRadialCloseHandler, true);
}
//# sourceMappingURL=token-radial-menu.js.map