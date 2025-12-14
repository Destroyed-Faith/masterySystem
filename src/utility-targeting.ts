/**
 * Utility Targeting System for Mastery System
 * 
 * Provides targeting preview and selection for utility powers, especially AoE utilities
 * Supports single-target and radius AoE with manual target selection
 */

import type { RadialCombatOption, TargetGroup } from './token-radial-menu';

/**
 * Utility target state for a candidate token
 */
interface UtilityTargetState {
  token: any;
  inRadius: boolean;
  selected: boolean;
  isAlly: boolean;
  isEnemy: boolean;
  originalAlpha: number;
}

/**
 * Main utility targeting state
 */
interface UtilityTargetingState {
  casterToken: any;
  option: RadialCombatOption;
  rangeMeters: number;
  radiusMeters: number;
  center: { x: number; y: number } | null; // null means not yet chosen (for ranged zones)
  candidates: Map<string, UtilityTargetState>;
  selectedTargets: Set<string>; // token IDs
  highlightId: string;
  previewGraphics: PIXI.Graphics | null;
  rangeLineGraphics: PIXI.Graphics | null;
  panelApp: any | null;
  onPointerMove: (ev: PIXI.FederatedPointerEvent) => void;
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
  manualMode: boolean;
}

// Global utility targeting state
let activeUtilityTargeting: UtilityTargetingState | null = null;

/**
 * Check if a token is an ally of the caster
 */
function isAlly(casterToken: any, targetToken: any): boolean {
  const casterActor = casterToken.actor;
  const targetActor = targetToken.actor;
  
  if (!casterActor || !targetActor) return false;
  
  // Same actor
  if (casterActor.id === targetActor.id) return true;
  
  // Check disposition
  const casterDisposition = casterToken.document.disposition;
  const targetDisposition = targetToken.document.disposition;
  
  // Friendly or neutral to friendly
  if (casterDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && 
      targetDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
    return true;
  }
  
  // Check if same player owns both
  if (casterActor.hasPlayerOwner && targetActor.hasPlayerOwner) {
    const casterOwners = casterActor.ownership;
    const targetOwners = targetActor.ownership;
    
    // If any player owns both, they're allies
    for (const userId in casterOwners) {
      if (casterOwners[userId] > 0 && targetOwners[userId] > 0) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a token is an enemy of the caster
 */
function isEnemy(_casterToken: any, targetToken: any): boolean {
  const targetDisposition = targetToken.document.disposition;
  return targetDisposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
}

/**
 * Check if token matches target group
 */
function matchesTargetGroup(casterToken: any, targetToken: any, group: TargetGroup): boolean {
  if (group === 'self') {
    return casterToken.id === targetToken.id;
  }
  if (group === 'ally') {
    return isAlly(casterToken, targetToken);
  }
  if (group === 'enemy') {
    return isEnemy(casterToken, targetToken);
  }
  if (group === 'creature' || group === 'any') {
    return true; // All tokens match
  }
  return false;
}

/**
 * Get distance between two points in grid units
 */
function getDistanceInGridUnits(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  const gridSize = canvas.grid?.size || 1;
  const gridDistance = pixelDistance / gridSize;
  
  // Use Foundry's distance measurement if available (for hex grids)
  try {
    if (canvas.grid?.measurePath) {
      // New v13 API: measurePath returns array of distances
      const waypoints = [
        { x: point1.x, y: point1.y },
        { x: point2.x, y: point2.y }
      ];
      const measurement = canvas.grid.measurePath(waypoints, {});
      if (measurement && measurement.length > 0) {
        return measurement[0];
      }
    } else if (canvas.grid?.measureDistances) {
      // Fallback to old API
      const waypoints = [
        { x: point1.x, y: point1.y },
        { x: point2.x, y: point2.y }
      ];
      const measurement = canvas.grid.measureDistances(waypoints, {});
      if (measurement && measurement.length > 0) {
        return measurement[0];
      }
    }
  } catch (error) {
    // Use fallback
  }
  
  return gridDistance;
}

/**
 * Find candidate tokens within radius
 */
function findCandidatesInRadius(
  casterToken: any,
  center: { x: number; y: number },
  radiusMeters: number,
  targetGroup: TargetGroup
): Map<string, UtilityTargetState> {
  const candidates = new Map<string, UtilityTargetState>();
  const allTokens = canvas.tokens?.placeables || [];
  const gridSizeMeters = canvas.grid?.distance || 1;
  const radiusGridUnits = radiusMeters / gridSizeMeters;
  
  for (const token of allTokens) {
    const tokenCenter = token.center;
    const distance = getDistanceInGridUnits(center, tokenCenter);
    
    if (distance <= radiusGridUnits) {
      const isAllyToken = isAlly(casterToken, token);
      const isEnemyToken = isEnemy(casterToken, token);
      const matches = matchesTargetGroup(casterToken, token, targetGroup);
      
      const state: UtilityTargetState = {
        token,
        inRadius: true,
        selected: matches, // Default: selected if matches target group
        isAlly: isAllyToken,
        isEnemy: isEnemyToken,
        originalAlpha: token.alpha
      };
      
      candidates.set(token.id, state);
    }
  }
  
  return candidates;
}

/**
 * Highlight radius area on grid
 */
function highlightRadiusArea(state: UtilityTargetingState): void {
  if (!canvas.grid || !state.previewGraphics || !state.center) return;
  
  const center = state.center;
  const radiusPx = (state.radiusMeters / (canvas.grid.distance || 1)) * (canvas.grid.size || 1);
  
  // Clear previous graphics
  state.previewGraphics.clear();
  
  // Only draw circle if no grid is present, or as a fallback
  // If grid is present, we'll highlight hexes instead
  if (canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) {
    // Draw radius circle (semi-transparent blue/teal for utilities)
    state.previewGraphics.lineStyle(2, 0x66aaff, 0.8);
    state.previewGraphics.beginFill(0x66aaff, 0.15);
    state.previewGraphics.drawCircle(0, 0, radiusPx);
    state.previewGraphics.endFill();
  }
  
  // Position at center
  state.previewGraphics.position.set(center.x, center.y);
  
  // Highlight hexes within radius
  let highlight: any = null;
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
      highlight = canvas.grid.highlight;
    } else if ((canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(state.highlightId);
      if (!highlight && (canvas.grid as any).addHighlightLayer) {
        highlight = (canvas.grid as any).addHighlightLayer(state.highlightId);
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not get highlight layer for utility radius', error);
  }
  
  if (highlight && highlight.clear) {
    highlight.clear();
  }
  
  // Highlight hexes within radius
  const maxHexDistance = Math.ceil(state.radiusMeters / (canvas.grid.distance || 1));
  
  // Get grid position using new v13 API
  let centerGrid: { col: number; row: number } | null = null;
  try {
    if (canvas.grid?.getOffset) {
      // New v13 API: getOffset returns {col, row}
      const offset = canvas.grid.getOffset(center.x, center.y);
      centerGrid = { col: offset.col, row: offset.row };
    } else if (canvas.grid?.getGridPositionFromPixels) {
      // Fallback to old API
      const oldGrid = canvas.grid.getGridPositionFromPixels(center.x, center.y);
      if (oldGrid) {
        centerGrid = { col: oldGrid.x, row: oldGrid.y };
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not get grid position for utility radius', error);
  }
  
  if (centerGrid && highlight) {
    for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
      for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
        const gridCol = centerGrid.col + q;
        const gridRow = centerGrid.row + r;
        
        // Get hex center using new v13 API
        let hexCenter: { x: number; y: number } | null = null;
        try {
          if (canvas.grid?.getTopLeftPoint) {
            // New v13 API: getTopLeftPoint(col, row) returns center point
            hexCenter = canvas.grid.getTopLeftPoint(gridCol, gridRow);
          } else if (canvas.grid?.getPixelsFromGridPosition) {
            // Fallback to old API
            hexCenter = canvas.grid.getPixelsFromGridPosition(gridCol, gridRow);
          }
        } catch (error) {
          continue; // Skip this hex if we can't get its position
        }
        
        if (hexCenter) {
          // Calculate distance using Foundry's measurement API for accurate hex distance
          let distanceInUnits = getDistanceInGridUnits(center, hexCenter);
          try {
            if (canvas.grid?.measurePath) {
              // New v13 API: measurePath returns array of distances
              const waypoints = [
                { x: center.x, y: center.y },
                { x: hexCenter.x, y: hexCenter.y }
              ];
              const measurement = canvas.grid.measurePath(waypoints, {});
              if (measurement && measurement.length > 0) {
                distanceInUnits = measurement[0];
              }
            } else if (canvas.grid?.measureDistances) {
              // Fallback to old API
              const waypoints = [
                { x: center.x, y: center.y },
                { x: hexCenter.x, y: hexCenter.y }
              ];
              const measurement = canvas.grid.measureDistances(waypoints, {});
              if (measurement && measurement.length > 0) {
                distanceInUnits = measurement[0];
              }
            }
          } catch (error) {
            // Use fallback distance
          }
          
          const radiusInUnits = state.radiusMeters / (canvas.grid.distance || 1);
          if (distanceInUnits <= radiusInUnits) {
            // Try different methods to highlight the hex
            try {
              // Foundry v13 API: highlight.highlightPosition(col, row, options)
              if (highlight && typeof highlight.highlightPosition === 'function') {
                highlight.highlightPosition(gridCol, gridRow, { color: 0x66aaff, alpha: 0.3 });
              } 
              // Alternative API: highlight.highlightGridPosition
              else if (highlight && typeof highlight.highlightGridPosition === 'function') {
                highlight.highlightGridPosition(gridCol, gridRow, { color: 0x66aaff, alpha: 0.3 });
              } 
              // Fallback: highlight.highlight
              else if (highlight && typeof highlight.highlight === 'function') {
                highlight.highlight(gridCol, gridRow, { color: 0x66aaff, alpha: 0.3 });
              }
              // Direct grid highlight (v13)
              else if (canvas.grid && typeof (canvas.grid as any).highlightPosition === 'function') {
                (canvas.grid as any).highlightPosition(gridCol, gridRow, { color: 0x66aaff, alpha: 0.3 });
              }
              // Last resort: try to add highlight directly
              else if (highlight && typeof highlight.add === 'function') {
                highlight.add({ col: gridCol, row: gridRow, color: 0x66aaff, alpha: 0.3 });
              }
            } catch (error) {
              // Silently fail if highlighting doesn't work
              console.warn('Mastery System | Could not highlight hex at', gridCol, gridRow, error);
            }
          }
        }
      }
    }
  }
}

/**
 * Update visual markers for candidate tokens
 */
function updateCandidateVisuals(state: UtilityTargetingState): void {
  for (const [, candidate] of state.candidates.entries()) {
    const token = candidate.token;
    
    // Restore original alpha
    token.alpha = candidate.originalAlpha;
    
    // Remove existing filters
    if (token.filters) {
      token.filters = token.filters.filter((f: any) => {
        return !(f instanceof PIXI.filters.ColorMatrixFilter);
      });
      if (token.filters.length === 0) {
        token.filters = null;
      }
    }
    
    // Apply visual based on selection state
    if (candidate.selected) {
      // Selected: full-color tint (teal/blue for utilities)
      token.alpha = Math.min(1.0, candidate.originalAlpha);
      const tintFilter = new PIXI.filters.ColorMatrixFilter();
      tintFilter.tint(0x66aaff, false);
      token.filters = [...(token.filters || []), tintFilter];
    } else {
      // Not selected: faded
      token.alpha = candidate.originalAlpha * 0.4;
    }
  }
}

/**
 * Create UI panel for target selection
 */
function createTargetSelectionPanel(state: UtilityTargetingState): any {
  const panelContent = `
    <div class="mastery-utility-panel">
      <div class="panel-header">
        <h4>${state.option.name}</h4>
        <div class="panel-subtitle">Select Targets</div>
      </div>
      <div class="panel-controls">
        <button class="panel-btn" data-action="allies">Allies</button>
        <button class="panel-btn" data-action="enemies">Enemies</button>
        <button class="panel-btn" data-action="all">All</button>
        <button class="panel-btn" data-action="none">None</button>
      </div>
      <div class="panel-toggle">
        <label>
          <input type="checkbox" id="manual-mode" ${state.manualMode ? 'checked' : ''}>
          Manual Selection Mode
        </label>
      </div>
      <div class="panel-actions">
        <button class="panel-btn confirm" data-action="confirm">Confirm Utility</button>
        <button class="panel-btn cancel" data-action="cancel">Cancel</button>
      </div>
      <div class="panel-info">
        <div>Selected: <span id="selected-count">0</span></div>
      </div>
    </div>
  `;
  
  // Create a simple dialog-like panel using Foundry's Dialog
  const panel: any = {
    element: null,
    render: function() {
      const html = $(panelContent);
    
    // Update selected count
    const updateCount = () => {
      const count = state.selectedTargets.size;
      html.find('#selected-count').text(count);
    };
    
    // Button handlers
    html.find('[data-action="allies"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = candidate.isAlly;
        if (candidate.selected) {
          state.selectedTargets.add(tokenId);
        } else {
          state.selectedTargets.delete(tokenId);
        }
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="enemies"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = candidate.isEnemy;
        if (candidate.selected) {
          state.selectedTargets.add(tokenId);
        } else {
          state.selectedTargets.delete(tokenId);
        }
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="all"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = true;
        state.selectedTargets.add(tokenId);
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="none"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = false;
        state.selectedTargets.delete(tokenId);
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('#manual-mode').on('change', (ev: JQuery.ChangeEvent) => {
      state.manualMode = (ev.target as HTMLInputElement).checked;
    });
    
    html.find('[data-action="confirm"]').on('click', () => {
      if (state.selectedTargets.size === 0) {
        ui.notifications?.warn('No targets selected.');
        return;
      }
      confirmUtilityTargets(state);
    });
    
    html.find('[data-action="cancel"]').on('click', () => {
      endUtilityTargeting(false);
    });
    
    updateCount();
    
    // Create a container div and append to body
    const container = $('<div class="mastery-utility-panel-container"></div>');
    container.append(html);
    $('body').append(container);
    
    panel.element = container[0];
    return html;
  },
  close: function() {
    if (this.element) {
      $(this.element).remove();
      this.element = null;
    }
  }
  };
  
  return panel;
}

/**
 * Start single-target utility mode
 */
export function startUtilitySingleTargetMode(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | Starting single-target utility mode', { token: token.name, option: option.name });
  
  // Cancel any existing utility targeting
  endUtilityTargeting(false);
  
  // Ensure token is controlled
  token.control({ releaseOthers: false });
  
  const rangeMeters = option.rangeMeters || option.range || 0;
  const targetGroup = option.defaultTargetGroup || 'ally';
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  const rangeLineGraphics = new PIXI.Graphics();
  
  // Add to effects layer
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
    effectsContainer.addChild(rangeLineGraphics);
  }
  
  const highlightId = 'mastery-utility-single';
  
  // Event handlers
  const onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    const worldPos = ev.data.getLocalPosition(canvas.app.stage);
    const snapped = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
    
    // Draw range line
    rangeLineGraphics.clear();
    const casterCenter = token.center;
    const distance = getDistanceInGridUnits(casterCenter, snapped);
    const maxRange = rangeMeters / (canvas.grid?.distance || 1);
    const isValid = distance <= maxRange;
    
    rangeLineGraphics.lineStyle(2, isValid ? 0x66aaff : 0xff6666, 0.8);
    rangeLineGraphics.moveTo(casterCenter.x, casterCenter.y);
    rangeLineGraphics.lineTo(snapped.x, snapped.y);
    
    // Highlight valid targets
    const allTokens = canvas.tokens?.placeables || [];
    for (const targetToken of allTokens) {
      if (targetToken.id === token.id) continue;
      
      const targetCenter = targetToken.center;
      const targetDistance = getDistanceInGridUnits(casterCenter, targetCenter);
      const isInRange = targetDistance <= maxRange;
      const matches = matchesTargetGroup(token, targetToken, targetGroup);
      
      if (isInRange && matches) {
        // Highlight valid target
        targetToken.alpha = Math.min(1.0, targetToken.alpha);
        if (!targetToken.filters) {
          const tintFilter = new PIXI.filters.ColorMatrixFilter();
          tintFilter.tint(0x66aaff, false);
          targetToken.filters = [tintFilter];
        }
      } else {
        // Restore normal appearance
        targetToken.alpha = (targetToken as any)._originalAlpha || 1.0;
        if (targetToken.filters) {
          targetToken.filters = targetToken.filters.filter((f: any) => {
            return !(f instanceof PIXI.filters.ColorMatrixFilter);
          });
          if (targetToken.filters.length === 0) {
            targetToken.filters = null;
          }
        }
      }
    }
  };
  
  const onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    
    if (ev.button === 0) {
      const worldPos = ev.data.getLocalPosition(canvas.app.stage);
          // Find token at click position
      const tokens = canvas.tokens?.placeables || [];
      const clickedToken = tokens.find((t: any) => {
        const bounds = t.bounds;
        return bounds && bounds.contains(worldPos.x, worldPos.y);
      });
      
      if (clickedToken && clickedToken.id !== token.id) {
        const casterCenter = token.center;
        const distance = getDistanceInGridUnits(casterCenter, clickedToken.center);
        const maxRange = rangeMeters / (canvas.grid?.distance || 1);
        const matches = matchesTargetGroup(token, clickedToken, targetGroup);
        
        if (distance <= maxRange && matches) {
          console.log('Mastery System | Single-target utility confirmed:', clickedToken.name);
          confirmUtilityTargets({
            casterToken: token,
            option,
            rangeMeters: 0,
            radiusMeters: 0,
            center: null,
            candidates: new Map([[clickedToken.id, {
              token: clickedToken,
              inRadius: true,
              selected: true,
              isAlly: isAlly(token, clickedToken),
              isEnemy: isEnemy(token, clickedToken),
              originalAlpha: clickedToken.alpha
            }]]),
            selectedTargets: new Set([clickedToken.id]),
            highlightId,
            previewGraphics,
            rangeLineGraphics,
            panelApp: null,
            onPointerMove,
            onPointerDown,
            onKeyDown: () => {},
            manualMode: false
          });
          return;
        }
      }
      
      // Clicked outside - cancel
      endUtilityTargeting(false);
    }
  };
  
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      endUtilityTargeting(false);
    }
  };
  
  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters,
    radiusMeters: 0,
    center: null,
    candidates: new Map(),
    selectedTargets: new Set(),
    highlightId,
    previewGraphics,
    rangeLineGraphics,
    panelApp: null,
    onPointerMove,
    onPointerDown,
    onKeyDown,
    manualMode: false
  };
  
  activeUtilityTargeting = state;
  
  // Store original alphas
  const allTokens = canvas.tokens?.placeables || [];
  for (const t of allTokens) {
    (t as any)._originalAlpha = t.alpha;
  }
  
  // Attach event listeners
  canvas.stage.on('pointermove', state.onPointerMove);
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
  
  console.log('Mastery System | Single-target utility mode active');
}

/**
 * Start radius utility mode
 */
export function startUtilityRadiusMode(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | Starting radius utility mode', { token: token.name, option: option.name });
  
  // Cancel any existing utility targeting
  endUtilityTargeting(false);
  
  // Ensure token is controlled
  token.control({ releaseOthers: false });
  
  const rangeMeters = option.rangeMeters || option.range || 0;
  const radiusMeters = option.aoeRadiusMeters || 0;
  const targetGroup = option.defaultTargetGroup || 'ally';
  
  console.log('Mastery System | Utility radius mode:', {
    rangeMeters,
    radiusMeters,
    targetGroup
  });
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  const rangeLineGraphics = new PIXI.Graphics();
  
  // Add to effects layer
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
    effectsContainer.addChild(rangeLineGraphics);
  }
  
  const highlightId = 'mastery-utility-radius';
  
  // Create state first (with placeholders for event handlers)
  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters,
    radiusMeters,
    center: null,
    candidates: new Map(),
    selectedTargets: new Set(),
    highlightId,
    previewGraphics,
    rangeLineGraphics,
    panelApp: null,
    onPointerMove: () => {},
    onPointerDown: () => {},
    onKeyDown: () => {},
    manualMode: option.allowManualTargetSelection !== false
  };
  
  activeUtilityTargeting = state;
  
  // Event handlers (can now reference state)
  state.onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    if (rangeMeters === 0) {
      // Self-aura: no movement needed
      return;
    }
    
    if (!state.center) {
      // Still choosing center point
      const worldPos = ev.data.getLocalPosition(canvas.app.stage);
      const snapped = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
      
      // Draw range line
      state.rangeLineGraphics!.clear();
      const casterCenter = token.center;
      const distance = getDistanceInGridUnits(casterCenter, snapped);
      const maxRange = rangeMeters / (canvas.grid?.distance || 1);
      const isValid = distance <= maxRange;
      
      state.rangeLineGraphics!.lineStyle(2, isValid ? 0x66aaff : 0xff6666, 0.8);
      state.rangeLineGraphics!.moveTo(casterCenter.x, casterCenter.y);
      state.rangeLineGraphics!.lineTo(snapped.x, snapped.y);
      
      // Preview radius at mouse position if valid
      if (isValid) {
        state.previewGraphics!.clear();
        const radiusPx = (radiusMeters / (canvas.grid.distance || 1)) * (canvas.grid.size || 1);
        state.previewGraphics!.lineStyle(2, 0x66aaff, 0.6);
        state.previewGraphics!.beginFill(0x66aaff, 0.1);
        state.previewGraphics!.drawCircle(0, 0, radiusPx);
        state.previewGraphics!.endFill();
        state.previewGraphics!.position.set(snapped.x, snapped.y);
      }
    }
  };
  
  state.onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    
    if (ev.button === 0) {
      if (rangeMeters === 0) {
        // Self-aura: clicking toggles targets in manual mode
        if (state.manualMode) {
          const worldPos = ev.data.getLocalPosition(canvas.app.stage);
          const tokens = canvas.tokens?.placeables || [];
          const clickedToken = tokens.find((t: any) => {
            const bounds = t.bounds;
            return bounds && bounds.contains(worldPos.x, worldPos.y);
          });
          
          if (clickedToken && state.candidates.has(clickedToken.id)) {
            const candidate = state.candidates.get(clickedToken.id)!;
            candidate.selected = !candidate.selected;
            if (candidate.selected) {
              state.selectedTargets.add(clickedToken.id);
            } else {
              state.selectedTargets.delete(clickedToken.id);
            }
            updateCandidateVisuals(state);
            if (state.panelApp) {
              const html = $(state.panelApp.element);
              html.find('#selected-count').text(state.selectedTargets.size);
            }
          }
        }
        return;
      }
      
      if (!state.center) {
        // Choosing center point
        const worldPos = ev.data.getLocalPosition(canvas.app.stage);
        const snapped = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
        
        const casterCenter = token.center;
        const distance = getDistanceInGridUnits(casterCenter, snapped);
        const maxRange = rangeMeters / (canvas.grid?.distance || 1);
        
        if (distance <= maxRange) {
          state.center = snapped;
          if (state.center) {
            state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);
          }
          
          // Default selection
          for (const [tokenId, candidate] of state.candidates.entries()) {
            if (candidate.selected) {
              state.selectedTargets.add(tokenId);
            }
          }
          
          // Draw radius and update visuals
          highlightRadiusArea(state);
          updateCandidateVisuals(state);
          
          // Create UI panel
          const panel = createTargetSelectionPanel(state);
          state.panelApp = panel;
          panel.render(true);
          
          // Position panel near caster
          const tokenScreen = canvas.stage.toGlobal(new PIXI.Point(token.center.x, token.center.y));
          if (panel.element) {
            $(panel.element).css({
              position: 'absolute',
              left: `${tokenScreen.x + 100}px`,
              top: `${tokenScreen.y - 100}px`
            });
          }
        }
      } else {
        // Center chosen, clicking toggles targets in manual mode
        if (state.manualMode) {
          const worldPos = ev.data.getLocalPosition(canvas.app.stage);
          const tokens = canvas.tokens?.placeables || [];
          const clickedToken = tokens.find((t: any) => {
            const bounds = t.bounds;
            return bounds && bounds.contains(worldPos.x, worldPos.y);
          });
          
          if (clickedToken && state.candidates.has(clickedToken.id)) {
            const candidate = state.candidates.get(clickedToken.id)!;
            candidate.selected = !candidate.selected;
            if (candidate.selected) {
              state.selectedTargets.add(clickedToken.id);
            } else {
              state.selectedTargets.delete(clickedToken.id);
            }
            updateCandidateVisuals(state);
            if (state.panelApp) {
              const html = $(state.panelApp.element);
              html.find('#selected-count').text(state.selectedTargets.size);
            }
          }
        }
      }
    }
  };
  
  state.onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      endUtilityTargeting(false);
    }
  };
  
  // If range is 0, center is always caster's position
  if (rangeMeters === 0) {
    state.center = { x: token.center.x, y: token.center.y };
    state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);
    
    // Default selection based on target group
    for (const [tokenId, candidate] of state.candidates.entries()) {
      if (candidate.selected) {
        state.selectedTargets.add(tokenId);
      }
    }
    
    // Draw radius and update visuals
    highlightRadiusArea(state);
    updateCandidateVisuals(state);
    
    // Create panel immediately
    const panel = createTargetSelectionPanel(state);
    state.panelApp = panel;
    panel.render(true);
    
    // Position panel near caster
    const tokenScreen = canvas.stage.toGlobal(new PIXI.Point(token.center.x, token.center.y));
    if (panel.element) {
      $(panel.element).css({
        position: 'absolute',
        left: `${tokenScreen.x + 100}px`,
        top: `${tokenScreen.y - 100}px`
      });
    }
  }
  
  // Store original alphas
  const allTokens = canvas.tokens?.placeables || [];
  for (const t of allTokens) {
    (t as any)._originalAlpha = t.alpha;
  }
  
  // Attach event listeners
  canvas.stage.on('pointermove', state.onPointerMove);
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
  
  console.log('Mastery System | Radius utility mode active');
}

/**
 * Confirm utility targets and resolve power
 */
async function confirmUtilityTargets(state: UtilityTargetingState): Promise<void> {
  const targets = Array.from(state.selectedTargets).map(id => {
    const candidate = state.candidates.get(id);
    return candidate?.token;
  }).filter(t => t !== undefined);
  
  console.log('Mastery System | Utility confirmed:', {
    caster: state.casterToken.name,
    option: state.option.name,
    targets: targets.map(t => t.name)
  });
  
  // TODO: Call actual utility resolution function
  // For now, just show notification
  ui.notifications?.info(`Utility ${state.option.name} applied to ${targets.length} target(s)`);
  
  // End targeting mode
  endUtilityTargeting(true);
}

/**
 * End utility targeting mode
 */
export function endUtilityTargeting(success: boolean): void {
  const state = activeUtilityTargeting;
  if (!state) return;
  
  console.log('Mastery System | Ending utility targeting mode, success =', success);
  
  // Remove event listeners
  canvas.stage.off('pointermove', state.onPointerMove);
  canvas.stage.off('pointerdown', state.onPointerDown);
  window.removeEventListener('keydown', state.onKeyDown);
  
  // Clear highlights using new v13 API
  let highlight: any = null;
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
      highlight = canvas.grid.highlight;
    } else if (canvas.grid && (canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(state.highlightId);
    }
  } catch (error) {
    // Ignore
  }
  
  if (highlight && highlight.clear) {
    highlight.clear();
  }
  
  // Clear preview graphics
  if (state.previewGraphics && state.previewGraphics.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  
  if (state.rangeLineGraphics && state.rangeLineGraphics.parent) {
    state.rangeLineGraphics.parent.removeChild(state.rangeLineGraphics);
    state.rangeLineGraphics.clear();
  }
  
  // Close panel
  if (state.panelApp) {
    state.panelApp.close();
  }
  
  // Restore token visuals
  for (const [, candidate] of state.candidates.entries()) {
    const token = candidate.token;
    token.alpha = candidate.originalAlpha;
    
    if (token.filters) {
      token.filters = token.filters.filter((f: any) => {
        return !(f instanceof PIXI.filters.ColorMatrixFilter);
      });
      if (token.filters.length === 0) {
        token.filters = null;
      }
    }
  }
  
  // Restore all tokens (in case some were highlighted but not in candidates)
  const allTokens = canvas.tokens?.placeables || [];
  for (const token of allTokens) {
    const originalAlpha = (token as any)._originalAlpha;
    if (originalAlpha !== undefined) {
      token.alpha = originalAlpha;
      delete (token as any)._originalAlpha;
    }
  }
  
  // Clear state
  activeUtilityTargeting = null;
  
  if (!success) {
    ui.notifications?.info('Utility targeting cancelled');
  }
}

/**
 * Check if utility targeting is currently active
 */
export function isUtilityTargetingActive(): boolean {
  return activeUtilityTargeting !== null;
}

