/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 * 
 * Uses a PIXI-based radial menu for visual option selection
 */

import { openRadialMenuForActor, getAllCombatOptionsForActor, closeRadialMenu } from './token-radial-menu';
import type { RadialCombatOption } from './token-radial-menu';

/**
 * Movement state interface for guided movement mode
 */
interface MovementState {
  token: any;
  option: RadialCombatOption;
  origin: { x: number; y: number };
  maxRange: number; // in grid units
  originalAlpha: number;
  previewGraphics: PIXI.Graphics | null;
  onMove: (ev: PIXI.FederatedPointerEvent) => void;
  onDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

// Global movement state
let activeMovementState: MovementState | null = null;

/**
 * Initialize token action selector hooks
 */
export function initializeTokenActionSelector() {
  console.log('Mastery System | Initializing Token Action Selector');

  // Hook into Token HUD rendering to add custom icon
  Hooks.on('renderTokenHUD', (app: any, html: any, _data: any) => {
    // Get the token from app.object (Foundry v11+)
    const token = app.object;
    if (!token) {
      console.warn('Mastery System | Could not find token in Token HUD');
      return;
    }

    // Convert html to jQuery if it's not already (Foundry v13 compatibility)
    const $html = (html instanceof jQuery ? html : $(html)) as JQuery;

    // Find the right column of the Token HUD
    const rightCol = $html.find('.col.right');
    if (rightCol.length === 0) {
      console.warn('Mastery System | Could not find .col.right in Token HUD');
      return;
    }

    // Check if the icon already exists to avoid duplicates
    if (rightCol.find('.ms-action-selector').length > 0) {
      return;
    }

    // Get current action flag to show status
    const currentAction = token.document.getFlag('mastery-system', 'currentAction') || {};
    const hasAction = currentAction.category && currentAction.optionId;

    // Create the action selector icon
    const actionIcon = $(`
      <div class="control-icon ms-action-selector" 
           title="${hasAction ? `Current: ${currentAction.category} - ${currentAction.optionId}` : 'Select Action'}"
           data-token-id="${token.id}">
        <i class="fas fa-swords"></i>
      </div>
    `);

    // Add visual indicator if action is set
    if (hasAction) {
      actionIcon.addClass('active');
    }

    // Add click handler
    actionIcon.on('click', async (event: JQuery.ClickEvent) => {
      event.preventDefault();
      event.stopPropagation();
      await openMasteryActionRadialMenu(token);
    });

    // Append to right column
    rightCol.append(actionIcon);
  });

  // Hook into token updates to intercept movement
  Hooks.on('preUpdateToken', async (tokenDoc: any, change: any, _options: any, userId: string) => {
    // Only react to position changes
    if (change.x === undefined && change.y === undefined) {
      return;
    }

    // Only for the user performing the move
    if (userId !== game.user.id) {
      return;
    }

    // If guided movement is active, allow the movement (it's already validated)
    if (activeMovementState && activeMovementState.token.document.id === tokenDoc.id) {
      return; // Allow movement
    }

    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};

    // If nothing is selected, block movement
    if (!action.category || !action.optionId) {
      ui.notifications.warn('Bitte zuerst im Token-HUD eine Movement-Aktion wählen.');
      return false;
    }

    // Only allow movement if the category is "movement"
    if (action.category !== 'movement') {
      ui.notifications.warn('Du hast aktuell keine Movement-Aktion gewählt.');
      return false;
    }

    // At this point, movement is allowed
    // The flag will be cleared after successful movement in the updateToken hook
    return;
  });

  // Hook into token updates to clear flag after successful movement
  Hooks.on('updateToken', async (tokenDoc: any, change: any, _options: any, userId: string) => {
    // Only react to position changes
    if (change.x === undefined && change.y === undefined) {
      return;
    }

    // Only for the user performing the move
    if (userId !== game.user.id) {
      return;
    }

    // Clear the currentAction flag after successful movement
    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};
    if (action.category === 'movement') {
      await tokenDoc.unsetFlag('mastery-system', 'currentAction');
      console.log('Mastery System | Cleared currentAction flag after movement');
    }
  });
}

/**
 * Open the radial menu for combat action selection
 * @param token - The token to set the action for
 */
async function openMasteryActionRadialMenu(token: any) {
  const actor = token.actor;
  if (!actor) {
    ui.notifications.error('No actor found for this token.');
    return;
  }

  // Close any existing radial menu
  closeRadialMenu();

  // Get all combat options for the actor
  const allOptions = await getAllCombatOptionsForActor(actor);

  if (!allOptions.length) {
    ui.notifications.warn('No combat options available for this actor.');
    return;
  }

  // Open the radial menu
  openRadialMenuForActor(token, allOptions);
}


/**
 * Get default movement range for an option
 */
function getDefaultMovementRange(token: any, option: RadialCombatOption): number {
  // If option has explicit range, use it
  if (option.range !== undefined && option.range > 0) {
    return option.range;
  }
  
  // Fall back to actor's base movement/speed
  const actor = token.actor;
  if (actor?.system?.combat?.speed) {
    return actor.system.combat.speed;
  }
  
  // Default fallback
  return 6; // Default movement in meters
}

/**
 * Start guided movement mode for a token
 */
function startGuidedMovement(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | Starting guided movement mode', { token: token.name, option: option.name });
  
  // Cancel any existing movement mode first
  endGuidedMovement(false);
  
  const origin = { x: token.x, y: token.y };
  const maxRange = getDefaultMovementRange(token, option);
  const originalAlpha = token.alpha;
  
  // Make the token slightly transparent to indicate "picked up"
  token.alpha = 0.6;
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  
  // Add to effects layer (similar to range preview)
  let effectsContainer: PIXI.Container | null = null;
  if (canvas.effects) {
    if ((canvas.effects as any).container && typeof (canvas.effects as any).container.addChild === 'function') {
      effectsContainer = (canvas.effects as any).container;
    } else if (typeof (canvas.effects as any).addChild === 'function') {
      effectsContainer = canvas.effects as any;
    }
  }
  if (!effectsContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      effectsContainer = (canvas.foreground as any).container;
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      effectsContainer = canvas.foreground as any;
    }
  }
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
  }
  
  // Create event handlers
  const onMove = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerMove(ev);
  const onDown = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerDown(ev);
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      endGuidedMovement(false);
    }
  };
  
  const state: MovementState = {
    token,
    option,
    origin,
    maxRange,
    originalAlpha,
    previewGraphics,
    onMove,
    onDown,
    onKeyDown
  };
  
  activeMovementState = state;
  
  // Attach mouse listeners to canvas stage
  canvas.stage.on("pointermove", state.onMove);
  canvas.stage.on("pointerdown", state.onDown);
  
  // Attach keyboard listener for ESC
  window.addEventListener("keydown", state.onKeyDown);
  
  // Show initial notification
  ui.notifications.info(`Movement mode: ${option.name}. Click to move, Right-click or ESC to cancel.`);
  
  console.log('Mastery System | Guided movement mode active', { maxRange, origin });
}

/**
 * Handle pointer move during movement mode
 */
function handleMovementPointerMove(ev: PIXI.FederatedPointerEvent): void {
  if (!activeMovementState) return;
  
  const state = activeMovementState;
  // Convert screen coordinates to world coordinates
  const worldPos = canvas.app.stage.toLocal(ev.global);
  // Snap to grid
  const dest = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
  
  refreshMovementPreview(state, dest.x, dest.y);
}

/**
 * Refresh the movement preview path and highlights
 */
function refreshMovementPreview(state: MovementState, destX: number, destY: number): void {
  if (!canvas.grid || !state.previewGraphics) return;
  
  // Clear previous graphics
  state.previewGraphics.clear();
  
  // Measure path from origin to destination
  const origin = state.origin;
  const dest = { x: destX, y: destY };
  
  // Use Foundry's Ruler to measure distance and get path
  // In Foundry v13, Ruler might need to be instantiated differently
  let distanceInUnits = 0;
  let segments: any[] = [];
  
  try {
    // Try v13 Ruler API
    const ruler = new (Ruler as any)(game.user);
    
    // Set waypoints
    ruler.waypoints = [
      { x: origin.x, y: origin.y },
      { x: dest.x, y: dest.y }
    ];
    
    // Measure the path
    const measurement = ruler.measure(ruler.waypoints);
    distanceInUnits = measurement?.distance || 0;
    segments = measurement?.segments || [];
    
    // Clean up
    ruler.clear();
  } catch (error) {
    // Fallback: simple distance calculation
    console.warn('Mastery System | Ruler API error, using fallback', error);
    const dx = dest.x - origin.x;
    const dy = dest.y - origin.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    distanceInUnits = pixelDistance / (canvas.grid.size || 1);
  }
  
  // Determine if destination is valid (within range)
  const isValid = distanceInUnits <= state.maxRange;
  const lineColor = isValid ? 0x00ff00 : 0xff0000; // Green if valid, red if not
  const fillColor = isValid ? 0x00ff00 : 0xff0000;
  
  // Draw path line
  state.previewGraphics.lineStyle(3, lineColor, 0.8);
  state.previewGraphics.moveTo(origin.x, origin.y);
  state.previewGraphics.lineTo(dest.x, dest.y);
  
  // Draw origin marker (cyan circle)
  state.previewGraphics.lineStyle(2, 0x00ffff, 0.9);
  state.previewGraphics.beginFill(0x00ffff, 0.3);
  state.previewGraphics.drawCircle(origin.x, origin.y, canvas.grid.size * 0.3);
  state.previewGraphics.endFill();
  
  // Draw destination marker
  state.previewGraphics.lineStyle(2, lineColor, 0.9);
  state.previewGraphics.beginFill(fillColor, 0.3);
  state.previewGraphics.drawCircle(dest.x, dest.y, canvas.grid.size * 0.3);
  state.previewGraphics.endFill();
  
  // If we have path segments, highlight grid positions along the path
  if (segments.length > 0) {
    const gridSize = canvas.grid.size;
    const halfGrid = gridSize * 0.5;
    
    for (const segment of segments) {
      if (segment.positions && Array.isArray(segment.positions)) {
        for (const pos of segment.positions) {
          // Draw a small square/hex at each grid position
          const gridX = pos.x;
          const gridY = pos.y;
          
          state.previewGraphics.lineStyle(1, fillColor, 0.5);
          state.previewGraphics.beginFill(fillColor, 0.2);
          
          // Draw based on grid type (hex or square)
          if (canvas.grid.type === 1) { // Hex grid
            // Draw hex shape (simplified as circle for now)
            state.previewGraphics.drawCircle(gridX, gridY, halfGrid * 0.8);
          } else { // Square grid
            state.previewGraphics.drawRect(
              gridX - halfGrid,
              gridY - halfGrid,
              gridSize,
              gridSize
            );
          }
          
          state.previewGraphics.endFill();
        }
      }
    }
  }
  
  // Clean up ruler
  ruler.clear();
}

/**
 * Handle pointer down during movement mode
 */
function handleMovementPointerDown(ev: PIXI.FederatedPointerEvent): void {
  if (!activeMovementState) return;
  
  const state = activeMovementState;
  
  // Right click or middle click cancels
  if (ev.button === 2 || ev.button === 1) {
    endGuidedMovement(false);
    return;
  }
  
  // Left click -> attempt move
  if (ev.button === 0) {
    // Convert screen coordinates to world coordinates
    const worldPos = canvas.app.stage.toLocal(ev.global);
    // Snap to grid
    const dest = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
    
    attemptCommitMovement(dest.x, dest.y, state)
      .catch(err => {
        console.error('Mastery System | Movement commit failed', err);
        ui.notifications.error('Failed to move token');
      });
  }
}

/**
 * Attempt to commit movement to a destination
 */
async function attemptCommitMovement(destX: number, destY: number, state: MovementState): Promise<void> {
  const origin = state.origin;
  const dest = { x: destX, y: destY };
  
  // Re-measure the path using Ruler
  let distanceInUnits = 0;
  
  try {
    const ruler = new (Ruler as any)(game.user);
    ruler.waypoints = [
      { x: origin.x, y: origin.y },
      { x: dest.x, y: dest.y }
    ];
    
    const measurement = ruler.measure(ruler.waypoints);
    distanceInUnits = measurement?.distance || 0;
    
    // Clean up ruler
    ruler.clear();
  } catch (error) {
    // Fallback: simple distance calculation
    console.warn('Mastery System | Ruler API error, using fallback', error);
    const dx = dest.x - origin.x;
    const dy = dest.y - origin.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    distanceInUnits = pixelDistance / (canvas.grid.size || 1);
  }
  
  // Check if destination is within range
  if (distanceInUnits > state.maxRange) {
    ui.notifications.warn(`Destination is out of range! Maximum range: ${state.maxRange}m, Distance: ${distanceInUnits.toFixed(1)}m`);
    return;
  }
  
  // Move the token
  const token = state.token;
  
  // Use Foundry's token movement animation if available
  // In v13, we can use token.animateMovement or token.document.update with animate option
  try {
    // Try animateMovement first (if available in v13)
    if (token.animateMovement && typeof token.animateMovement === 'function') {
      await token.animateMovement(dest, { duration: 400 });
    } else {
      // Fallback to document update with animation
      await token.document.update(
        { x: dest.x, y: dest.y },
        { animate: true }
      );
    }
    
    // Mark movement as used (if needed)
    // This could update actor resources, flags, etc.
    console.log('Mastery System | Movement completed', {
      option: state.option.name,
      distance: distanceInUnits.toFixed(1),
      maxRange: state.maxRange
    });
    
    // End movement mode successfully
    endGuidedMovement(true);
    
    ui.notifications.info(`Moved ${distanceInUnits.toFixed(1)}m using ${state.option.name}`);
    
  } catch (error) {
    console.error('Mastery System | Error during token movement', error);
    ui.notifications.error('Failed to move token');
  }
}

/**
 * End guided movement mode
 */
function endGuidedMovement(success: boolean): void {
  const state = activeMovementState;
  if (!state) return;
  
  console.log('Mastery System | Ending guided movement mode', { success });
  
  // Remove event listeners
  canvas.stage.off("pointermove", state.onMove);
  canvas.stage.off("pointerdown", state.onDown);
  window.removeEventListener("keydown", state.onKeyDown);
  
  // Clear preview graphics
  if (state.previewGraphics && state.previewGraphics.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  
  // Restore token alpha
  state.token.alpha = state.originalAlpha;
  
  // Clear state
  activeMovementState = null;
  
  if (!success) {
    ui.notifications.info('Movement cancelled');
  }
}

/**
 * Handle the chosen combat option
 * Can trigger rolls, chat cards, or other mechanics based on the selection
 * Made available globally so the radial menu can call it
 * @param token - The token that selected the option
 * @param option - The chosen option (power or maneuver)
 */
export function handleChosenCombatOption(token: any, option: RadialCombatOption) {
  console.log('Mastery System | Chosen combat option:', { token: token.name, option });

  // Check if this is a movement option
  if (option.slot === 'movement') {
    startGuidedMovement(token, option);
    return;
  }

  if (option.source === 'power' && option.item) {
    // Handle power selection
    // TODO: Integrate with existing power usage logic
    // Example: option.item.roll() or trigger power activation
    console.log('Mastery System | Power selected:', option.name, option.item);
    
    ui.notifications.info(`Action selected: ${option.name} (${option.slot})`);
    
    // You can add logic here to:
    // - Show power details
    // - Trigger a roll
    // - Create a chat card
    // - Activate the power
    
  } else if (option.source === 'maneuver' && option.maneuver) {
    // Handle maneuver selection
    // TODO: Integrate with existing maneuver execution logic
    console.log('Mastery System | Maneuver selected:', option.name, option.maneuver);
    
    ui.notifications.info(`Action selected: ${option.name} (${option.slot})`);
    
    // You can add logic here to:
    // - Execute the maneuver
    // - Create a chat message
    // - Set flags for movement modifications
    // - Trigger rolls if needed
  }
}
