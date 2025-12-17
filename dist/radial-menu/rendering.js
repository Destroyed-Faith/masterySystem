/**
 * Rendering Functions for Radial Menu
 */
import { MS_INNER_SEGMENTS, MS_INNER_RADIUS, MS_OUTER_RING_INNER, MS_OUTER_RING_OUTER } from './types.js';
import { getSegmentIdForOption } from './options.js';
import { showRangePreview, clearRangePreview } from './range-preview.js';
import { showRadialInfoPanel, hideRadialInfoPanel } from './info-panel.js';
import { handleChosenCombatOption } from '../token-action-selector.js';
/**
 * Foundry v13: When the radial menu spawns under the mouse cursor, PIXI can
 * immediately fire pointerover for whichever slice is "under" the cursor.
 * That created the "blue 6m" preview right on menu open.
 *
 * We suppress range preview (and info-panel) for a short time after the
 * radial menu opens, using the masterySystem.radialMenuOpened/Closed hooks.
 */
let _msSuppressHoverPreviewUntil = 0;
/**
 * Handle radial menu opened - suppress hover previews for a short time
 * Called from module.ts hooks
 */
export function handleRadialMenuOpened() {
    _msSuppressHoverPreviewUntil = Date.now() + 200;
    // Hard clear in case something was left behind
    try {
        clearRangePreview();
    }
    catch { /* ignore */ }
    try {
        hideRadialInfoPanel();
    }
    catch { /* ignore */ }
}
/**
 * Handle radial menu closed - clear suppression
 * Called from module.ts hooks
 */
export function handleRadialMenuClosed() {
    _msSuppressHoverPreviewUntil = 0;
    try {
        clearRangePreview();
    }
    catch { /* ignore */ }
    try {
        hideRadialInfoPanel();
    }
    catch { /* ignore */ }
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
 * Get segment metadata (color, label) by segment ID
 */
function getSegmentMeta(segmentId) {
    const seg = MS_INNER_SEGMENTS.find(s => s.id === segmentId);
    return seg ? { color: seg.color, label: seg.label } : { color: 0xffffff, label: '?' };
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
        // Range preview (Foundry v13 - keep it explicit and predictable)
        // We do NOT auto-default to 6m, and we do NOT treat special range categories.
        // If you want a preview, ensure the option has an explicit numeric range.
        if (Date.now() >= _msSuppressHoverPreviewUntil) {
            const r = Number(option.range);
            if (Number.isFinite(r) && r > 0) {
                showRangePreview(token, Math.floor(r));
            }
            else {
                clearRangePreview();
            }
            // Info panel (only after initial suppression window)
            showRadialInfoPanel(token, option);
        }
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
        // Close menu will be handled by the handler
    });
    return container;
}
/**
 * Render the outer ring of option wedges
 */
export function renderOuterRing(root, token, bySegment, segmentId) {
    // Remove existing outer ring elements
    const toRemove = [];
    root.children.forEach((child) => {
        if (child.msOuterSlice === true || child.msOuterRing === true) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(child => root.removeChild(child));
    // Get segment metadata
    const segMeta = getSegmentMeta(segmentId);
    const ringColor = segMeta.color;
    // Get options for this segment
    const options = bySegment[segmentId] ?? [];
    console.log(`Mastery System | Rendering outer ring for segment "${segmentId}" with ${options.length} options`);
    // Faint background ring
    const ringGfx = new PIXI.Graphics();
    ringGfx.lineStyle(2, ringColor, 0.3);
    ringGfx.beginFill(ringColor, 0.05);
    ringGfx.drawCircle(0, 0, MS_OUTER_RING_OUTER);
    ringGfx.endFill();
    ringGfx.msOuterRing = true;
    ringGfx.interactive = false; // Background ring should not capture events
    root.addChild(ringGfx);
    if (!options.length) {
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
    const count = options.length;
    const angleStep = (Math.PI * 2) / count;
    const startAngle = -Math.PI / 2; // Start at top
    options.forEach((option, index) => {
        const baseAngle = startAngle + index * angleStep;
        const endAngle = baseAngle + angleStep;
        const slice = createRadialOptionSlice(option, baseAngle, endAngle, token, ringColor);
        slice.msOuterSlice = true;
        root.addChild(slice);
    });
}
/**
 * Render the inner segmented circle
 * The inner quadrants (Buff/Move/Util/Atk) act as clickable filters
 */
export function renderInnerSegments(root, getCurrentSegmentId, setCurrentSegmentId, _token) {
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
    console.log('Mastery System | Rendering inner segments, current segment:', getCurrentSegmentId());
    MS_INNER_SEGMENTS.forEach((seg, index) => {
        const container = new PIXI.Container();
        container.msInnerSegment = true;
        container.msSegmentId = seg.id; // Store segment ID for visual refresh
        container.name = `ms-inner-${seg.id}`;
        const baseAngle = startAngle + index * angleStep;
        const endAngle = baseAngle + angleStep;
        const isActive = getCurrentSegmentId() === seg.id;
        console.log(`Mastery System | Creating inner segment "${seg.id}" (index ${index}), active: ${isActive}, angles: ${baseAngle.toFixed(2)} to ${endAngle.toFixed(2)}`);
        const gfx = new PIXI.Graphics();
        // Draw pie slice with visual feedback for active state
        const fillAlpha = isActive ? 0.9 : 0.6;
        gfx.beginFill(seg.color, fillAlpha);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        gfx.endFill();
        // Add border (stronger for active segment)
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
        text.interactive = false; // Text should not capture events
        container.addChild(text);
        // Make container interactive - this is critical for click functionality
        container.interactive = true;
        container.buttonMode = true;
        container.cursor = 'pointer';
        // Create a polygon hit area for better click detection
        // Generate points along the arc for the hit area
        const hitPoints = [0, 0]; // Start at center
        const numPoints = 16; // Number of points along the arc
        for (let i = 0; i <= numPoints; i++) {
            const angle = baseAngle + (endAngle - baseAngle) * (i / numPoints);
            const x = Math.cos(angle) * MS_INNER_RADIUS;
            const y = Math.sin(angle) * MS_INNER_RADIUS;
            hitPoints.push(x, y);
        }
        hitPoints.push(0, 0); // Close the polygon
        // Use PIXI.Polygon for hitArea (more reliable than Graphics)
        const hitPolygon = new PIXI.Polygon(hitPoints);
        container.hitArea = hitPolygon;
        console.log(`Mastery System | Inner segment "${seg.id}": interactive=${container.interactive}, hitArea=${!!container.hitArea}, children=${container.children.length}`);
        // Ensure the graphics don't capture events - container should handle them
        gfx.interactive = false;
        // Click handler - this should trigger segment change
        const handleClick = (event) => {
            event.stopPropagation(); // Prevent event from bubbling to parent
            event.stopImmediatePropagation(); // Prevent other handlers
            console.log(`Mastery System | [CLICK] Inner segment "${seg.id}" clicked! (was: ${getCurrentSegmentId()})`, {
                eventType: event.type,
                target: event.target?.constructor?.name,
                currentTarget: event.currentTarget?.constructor?.name,
                data: event.data
            });
            setCurrentSegmentId(seg.id);
        };
        container.on('pointertap', handleClick);
        container.on('click', handleClick); // Some PIXI versions use 'click'
        // Also handle pointerdown as a fallback (some PIXI versions use this)
        container.on('pointerdown', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            console.log(`Mastery System | [POINTERDOWN] Inner segment "${seg.id}" pointerdown`, {
                eventType: event.type,
                target: event.target?.constructor?.name
            });
            // Don't call setCurrentSegmentId here to avoid double-triggering
            // Only use pointertap/click for actual selection
        });
        // Add hover feedback with debug logs
        container.on('pointerover', (event) => {
            console.log(`Mastery System | [HOVER] Inner segment "${seg.id}" hovered`, {
                eventType: event.type,
                target: event.target?.constructor?.name
            });
            if (!isActive) {
                gfx.clear();
                gfx.beginFill(seg.color, 0.75); // Slightly brighter on hover
                gfx.moveTo(0, 0);
                gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
                gfx.lineTo(0, 0);
                gfx.endFill();
                gfx.lineStyle(2, 0x000000, 0.6);
                gfx.moveTo(0, 0);
                gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
                gfx.lineTo(0, 0);
            }
            // No range preview on inner-segment hover.
            // Range previews are shown when hovering a concrete option slice (outer ring).
        });
        container.on('pointerout', (_event) => {
            console.log(`Mastery System | [HOVER OUT] Inner segment "${seg.id}" hover out`);
            if (!isActive) {
                // Restore default appearance
                gfx.clear();
                gfx.beginFill(seg.color, 0.6);
                gfx.moveTo(0, 0);
                gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
                gfx.lineTo(0, 0);
                gfx.endFill();
                gfx.lineStyle(2, 0x000000, 0.5);
                gfx.moveTo(0, 0);
                gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
                gfx.lineTo(0, 0);
            }
            // No preview handling on inner-segment hover-out.
        });
        // Add to root AFTER setting up all properties
        root.addChild(container);
        console.log(`Mastery System | Inner segment "${seg.id}" added to root, zIndex: ${root.getChildIndex(container)}`);
    });
}
/**
 * Refresh inner segments visual state (update appearance based on active segment)
 * This is called when the segment changes to update the visual highlighting
 */
export function refreshInnerSegmentsVisual(root, getCurrentSegmentId) {
    const current = getCurrentSegmentId();
    console.log(`Mastery System | Refreshing inner segments visual, active: ${current}`);
    for (const child of root.children) {
        if (!child.msInnerSegment)
            continue;
        const container = child;
        const segId = container.msSegmentId;
        if (!segId)
            continue;
        const isActive = segId === current;
        const gfx = container.children.find((c) => c instanceof PIXI.Graphics);
        const text = container.children.find((c) => c instanceof PIXI.Text);
        if (!gfx)
            continue;
        // Get segment metadata
        const seg = MS_INNER_SEGMENTS.find(s => s.id === segId);
        if (!seg)
            continue;
        // Calculate angles for this segment
        const segmentCount = MS_INNER_SEGMENTS.length;
        const angleStep = (Math.PI * 2) / segmentCount;
        const startAngle = -Math.PI / 2;
        const index = MS_INNER_SEGMENTS.findIndex(s => s.id === segId);
        const baseAngle = startAngle + index * angleStep;
        const endAngle = baseAngle + angleStep;
        // Redraw with correct active state
        gfx.clear();
        gfx.beginFill(seg.color, isActive ? 0.9 : 0.6);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        gfx.endFill();
        // Update border
        gfx.lineStyle(2, 0x000000, isActive ? 0.8 : 0.5);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        // Update text weight
        if (text) {
            text.style.fontWeight = isActive ? 'bold' : 'normal';
        }
    }
}
//# sourceMappingURL=rendering.js.map