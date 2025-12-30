/**
 * Divine Clash Hooks
 * Handles token movement restrictions and zone tracking
 */

import type { DivineClashTokenFlags } from './divine-clash-types.js';
import { getDivineClashPhase, isDivineClashScene, getSceneFlags } from './divine-clash.js';

/**
 * Initialize Divine Clash hooks
 */
export function initializeDivineClashHooks(): void {
  // Prevent unauthorized token movement
  Hooks.on('preMoveToken', (token: Token, newPosition: { x: number; y: number }, _options: any) => {
    const tokenFlags = token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
    
    // Only check Divine Clash stones
    if (!tokenFlags?.isStone) {
      return true; // Allow movement
    }
    
    // GM can always move
    if (game.user?.isGM) {
      return true;
    }
    
    // Check if scene is Divine Clash
    if (!isDivineClashScene()) {
      console.warn('Mastery System | Cannot move Divine Clash stone: not on Divine Clash scene');
      return false;
    }
    
    // Check phase
    const phase = getDivineClashPhase();
    if (phase === 'reveal') {
      console.warn('Mastery System | Cannot move stones during reveal phase');
      return false;
    }
    
    // Check if token is locked
    if (token.document.locked) {
      console.warn('Mastery System | Cannot move locked stone');
      return false;
    }
    
    // Check ownership
    const seatUserId = tokenFlags.seatUserId;
    if (seatUserId && seatUserId !== game.user?.id) {
      console.warn('Mastery System | Cannot move another player\'s stones');
      return false;
    }
    
    // Seat 0 (enemy) is GM-only
    if (tokenFlags.seatIndex === 0 && !game.user?.isGM) {
      console.warn('Mastery System | Cannot move enemy stones');
      return false;
    }
    
    return true; // Allow movement
  });
  
  // Update token state based on zone after movement
  Hooks.on('moveToken', async (token: Token, _newPosition: { x: number; y: number }, _options: any) => {
    const tokenFlags = token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
    
    // Only process Divine Clash stones
    if (!tokenFlags?.isStone) {
      return;
    }
    
    // Only process on Divine Clash scene
    if (!isDivineClashScene()) {
      return;
    }
    
    const scene = canvas?.scene;
    if (!scene) return;
    
    const seatIndex = tokenFlags.seatIndex;
    if (seatIndex === undefined) return;
    
    // Find which zone the token is in (use same logic as divine-clash.ts)
    const zones = ['ready', 'attack', 'defense', 'exhausted', 'vitality', 'burned'] as const;
    let newState: typeof zones[number] | null = null;
    
    for (const zone of zones) {
      const regionName = `DC_SEAT_${seatIndex}_${zone.toUpperCase()}`;
      
      // Get regions (same logic as findRegion)
      let regions: any[] = [];
      if ((scene as any).regions) {
        if ((scene as any).regions instanceof Map || (scene as any).regions.size !== undefined) {
          regions = Array.from((scene as any).regions.values());
        } else if (Array.isArray((scene as any).regions)) {
          regions = (scene as any).regions;
        }
      } else if ((scene as any).data?.regions) {
        regions = (scene as any).data.regions;
      } else if ((scene as any).flags?.regions) {
        regions = (scene as any).flags.regions;
      }
      
      for (const region of regions) {
        const regionName2 = region.name || region.label || region.id || '';
        if (regionName2 === regionName || regionName2.includes(regionName)) {
          const shape = region.shape || region;
          let x = 0, y = 0, width = 100, height = 100;
          
          if (shape.x !== undefined && shape.y !== undefined) {
            x = shape.x;
            y = shape.y;
            width = shape.width || 100;
            height = shape.height || 100;
          } else if (shape.x1 !== undefined && shape.y1 !== undefined) {
            x = shape.x1;
            y = shape.y1;
            width = (shape.x2 || shape.x1 + 100) - shape.x1;
            height = (shape.y2 || shape.y1 + 100) - shape.y1;
          } else if (shape.center) {
            x = shape.center.x - (shape.radius || 50);
            y = shape.center.y - (shape.radius || 50);
            width = (shape.radius || 50) * 2;
            height = (shape.radius || 50) * 2;
          }
          
          const tokenCenter = token.center;
          if (tokenCenter.x >= x &&
              tokenCenter.x <= x + width &&
              tokenCenter.y >= y &&
              tokenCenter.y <= y + height) {
            newState = zone;
            break;
          }
        }
      }
      if (newState) break;
    }
    
    // If token is not in a valid zone, snap back to READY
    if (!newState && tokenFlags.stoneKind !== 'vitality') {
      const readyRegionName = `DC_SEAT_${seatIndex}_READY`;
      
      // Get regions (same logic as above)
      let regions: any[] = [];
      if ((scene as any).regions) {
        if ((scene as any).regions instanceof Map || (scene as any).regions.size !== undefined) {
          regions = Array.from((scene as any).regions.values());
        } else if (Array.isArray((scene as any).regions)) {
          regions = (scene as any).regions;
        }
      } else if ((scene as any).data?.regions) {
        regions = (scene as any).data.regions;
      } else if ((scene as any).flags?.regions) {
        regions = (scene as any).flags.regions;
      }
      
      for (const region of regions) {
        const regionName = region.name || region.label || region.id || '';
        if (regionName === readyRegionName || regionName.includes(readyRegionName)) {
          const shape = region.shape || region;
          let x = 0, y = 0, width = 100, height = 100;
          
          if (shape.x !== undefined && shape.y !== undefined) {
            x = shape.x;
            y = shape.y;
            width = shape.width || 100;
            height = shape.height || 100;
          } else if (shape.x1 !== undefined && shape.y1 !== undefined) {
            x = shape.x1;
            y = shape.y1;
            width = (shape.x2 || shape.x1 + 100) - shape.x1;
            height = (shape.y2 || shape.y1 + 100) - shape.y1;
          } else if (shape.center) {
            x = shape.center.x - (shape.radius || 50);
            y = shape.center.y - (shape.radius || 50);
            width = (shape.radius || 50) * 2;
            height = (shape.radius || 50) * 2;
          }
          
          const grid = canvas.grid;
          const gridSize = grid?.size || 100;
          const snappedX = Math.floor((x + width / 2) / gridSize) * gridSize + gridSize / 2;
          const snappedY = Math.floor((y + height / 2) / gridSize) * gridSize + gridSize / 2;
          
          await token.document.update({
            x: snappedX,
            y: snappedY
          });
          
          newState = 'ready';
          break;
        }
      }
    }
    
    // Update token state flag if changed
    if (newState && newState !== tokenFlags.state) {
      await token.document.setFlag('mastery-system', 'divineClash', {
        ...tokenFlags,
        state: newState
      } as DivineClashTokenFlags);
    }
  });
  
  console.log('Mastery System | Divine Clash hooks initialized');
}

