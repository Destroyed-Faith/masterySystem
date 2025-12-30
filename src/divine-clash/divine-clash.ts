/**
 * Divine Clash Manager
 * Handles automation for the Divine Clash board system
 */

import type { DivineClashPhase, StoneKind, StoneState, DivineClashSeat, DivineClashSceneFlags, DivineClashTokenFlags, RegionInfo } from './divine-clash-types.js';

/**
 * Get Divine Clash scene (by ID or name)
 */
function getDivineClashScene(): Scene | null {
  const sceneId = (game as any).settings.get('mastery-system', 'divineClashSceneId') as string;
  
  if (sceneId && sceneId.trim() !== '') {
    const scene = (game as any).scenes?.get(sceneId);
    if (scene) return scene;
  }
  
  // Fallback: find by name
  const scenes = (game as any).scenes || [];
  const scene = scenes.find((s: Scene) => s.name === 'Divine Clash');
  return scene || null;
}

/**
 * Get scene flags for Divine Clash
 */
function getSceneFlags(scene: Scene): DivineClashSceneFlags {
  const flags = scene.getFlag('mastery-system', 'divineClash') as DivineClashSceneFlags | undefined;
  return flags || {
    phase: 'planning',
    seats: {},
    started: false
  };
}

/**
 * Update scene flags
 */
async function updateSceneFlags(scene: Scene, updates: Partial<DivineClashSceneFlags>): Promise<void> {
  const current = getSceneFlags(scene);
  const merged = {
    ...current,
    ...updates,
    seats: { ...current.seats, ...(updates.seats || {}) }
  };
  await scene.setFlag('mastery-system', 'divineClash', merged);
}

/**
 * Find region by name pattern
 */
function findRegion(scene: Scene, namePattern: string): RegionInfo | null {
  // In Foundry V13, regions might be in different places
  // Try scene.regions (if it's a collection), scene.data.regions, or scene.flags
  let regions: any[] = [];
  
  if ((scene as any).regions) {
    // If it's a Collection, convert to array
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
    if (regionName === namePattern || regionName.includes(namePattern)) {
      // Extract bounds from region
      // Regions can have different shapes: rectangle, circle, polygon
      const shape = region.shape || region;
      let x = 0, y = 0, width = 100, height = 100;
      
      // Rectangle shape
      if (shape.x !== undefined && shape.y !== undefined) {
        x = shape.x;
        y = shape.y;
        width = shape.width || 100;
        height = shape.height || 100;
      } else if (shape.x1 !== undefined && shape.y1 !== undefined) {
        // Alternative format
        x = shape.x1;
        y = shape.y1;
        width = (shape.x2 || shape.x1 + 100) - shape.x1;
        height = (shape.y2 || shape.y1 + 100) - shape.y1;
      } else if (shape.center) {
        // Circle shape - approximate as square
        x = shape.center.x - (shape.radius || 50);
        y = shape.center.y - (shape.radius || 50);
        width = (shape.radius || 50) * 2;
        height = (shape.radius || 50) * 2;
      }
      
      return {
        id: region.id || region._id || '',
        name: regionName,
        x,
        y,
        width,
        height
      };
    }
  }
  
  return null;
}

/**
 * Get random point inside a region (snapped to grid)
 */
function getRandomPointInRegion(region: RegionInfo): { x: number; y: number } {
  const grid = canvas.grid;
  const gridSize = grid?.size || 100;
  
  // Random point within region bounds
  const x = region.x + Math.random() * region.width;
  const y = region.y + Math.random() * region.height;
  
  // Snap to grid
  const snappedX = Math.floor(x / gridSize) * gridSize + gridSize / 2;
  const snappedY = Math.floor(y / gridSize) * gridSize + gridSize / 2;
  
  return { x: snappedX, y: snappedY };
}

/**
 * Check if a point is inside a region
 */
function isPointInRegion(point: { x: number; y: number }, region: RegionInfo): boolean {
  return point.x >= region.x &&
         point.x <= region.x + region.width &&
         point.y >= region.y &&
         point.y <= region.y + region.height;
}

/**
 * Get region name for a seat and zone
 */
function getRegionName(seatIndex: number, zone: string): string {
  return `DC_SEAT_${seatIndex}_${zone}`;
}

/**
 * Find which zone a token is in (by checking regions)
 */
function getTokenZone(scene: Scene, token: Token, seatIndex: number): StoneState | null {
  const tokenCenter = token.center;
  
  const zones: StoneState[] = ['ready', 'attack', 'defense', 'exhausted', 'vitality', 'burned'];
  for (const zone of zones) {
    const regionName = getRegionName(seatIndex, zone.toUpperCase());
    const region = findRegion(scene, regionName);
    if (region && isPointInRegion(tokenCenter, region)) {
      return zone;
    }
  }
  
  return null;
}

/**
 * Ensure player stone actor exists (one per user, per kind)
 */
async function ensurePlayerStoneActor(user: User, kind: StoneKind): Promise<Actor | null> {
  const actorName = `DC Stone (${kind === 'power' ? 'Power' : 'Vitality'}) - ${user.name}`;
  
  // Check if actor already exists
  const existing = (game as any).actors?.find((a: Actor) => (a as any).name === actorName && (a as any).type === 'npc');
  if (existing) {
    // Ensure ownership
    const ownership: Record<string, number> = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    await existing.update({ ownership });
    return existing;
  }
  
  // Create new actor
  const actorData: any = {
    name: actorName,
    type: 'npc',
    ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    img: kind === 'power' 
      ? ((game as any).settings.get('mastery-system', 'divineClashPowerStoneImg') || 'systems/mastery-system/icons/svg/power-stone.svg')
      : ((game as any).settings.get('mastery-system', 'divineClashVitalityStoneImg') || 'systems/mastery-system/icons/svg/vitality-stone.svg')
  };
  
  try {
    const actor = await Actor.create(actorData);
    console.log(`Mastery System | Created stone actor: ${actorName}`);
    return actor;
  } catch (error) {
    console.error(`Mastery System | Failed to create stone actor: ${actorName}`, error);
    return null;
  }
}

/**
 * Spawn stone tokens for a seat
 */
async function spawnStonesForSeat(
  scene: Scene,
  seatIndex: number,
  actor: Actor,
  user: User | null,
  powerStoneCount: number,
  vitalityStoneCount: number
): Promise<void> {
  const seatRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
  if (!seatRegion) {
    console.warn(`Mastery System | Seat ${seatIndex} READY region not found`);
    return;
  }
  
  // Spawn power stones
  if (powerStoneCount > 0 && user) {
    const stoneActor = await ensurePlayerStoneActor(user, 'power');
    if (stoneActor) {
      for (let i = 0; i < powerStoneCount; i++) {
        const pos = getRandomPointInRegion(seatRegion);
        const tokenData: any = {
          name: `Power Stone ${i + 1}`,
          actorId: (stoneActor as any).id,
          x: pos.x,
          y: pos.y,
          flags: {
            'mastery-system': {
              divineClash: {
                isStone: true,
                stoneKind: 'power',
                seatIndex,
                seatUserId: user.id,
                state: 'ready'
              } as DivineClashTokenFlags
            }
          },
          actorLink: false,
          disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
          locked: false
        };
        
        try {
          await scene.createEmbeddedDocuments('Token', [tokenData]);
        } catch (error) {
          console.error(`Mastery System | Failed to spawn power stone ${i + 1}`, error);
        }
      }
    }
  }
  
  // Spawn vitality stones
  if (vitalityStoneCount > 0) {
    const stoneActor = user 
      ? await ensurePlayerStoneActor(user, 'vitality')
      : null; // For enemy, we'll use a default actor or create one
    
    if (stoneActor || !user) {
      const vitalityRegion = findRegion(scene, getRegionName(seatIndex, 'VITALITY'));
      if (vitalityRegion) {
        for (let i = 0; i < vitalityStoneCount; i++) {
          const pos = getRandomPointInRegion(vitalityRegion);
          const tokenData: any = {
            name: `Vitality Stone ${i + 1}`,
            actorId: (stoneActor as any)?.id || (actor as any).id, // Fallback to character actor if no stone actor
            x: pos.x,
            y: pos.y,
            flags: {
              'mastery-system': {
                divineClash: {
                  isStone: true,
                  stoneKind: 'vitality',
                  seatIndex,
                  seatUserId: user?.id || null,
                  state: 'vitality'
                } as DivineClashTokenFlags
              }
            },
            actorLink: false,
            disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            locked: false
          };
          
          try {
            await scene.createEmbeddedDocuments('Token', [tokenData]);
          } catch (error) {
            console.error(`Mastery System | Failed to spawn vitality stone ${i + 1}`, error);
          }
        }
      }
    }
  }
}

/**
 * Spawn avatar token for a seat
 */
async function spawnAvatarForSeat(scene: Scene, seatIndex: number, actor: Actor): Promise<void> {
  // Find avatar position (use READY region center as fallback)
  const seatRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
  if (!seatRegion) {
    console.warn(`Mastery System | Seat ${seatIndex} region not found for avatar`);
    return;
  }
  
  const pos = {
    x: seatRegion.x + seatRegion.width / 2,
    y: seatRegion.y + seatRegion.height / 2
  };
  
  const tokenData: any = {
    name: (actor as any).name,
    actorId: (actor as any).id,
    x: pos.x,
    y: pos.y,
    flags: {
      'mastery-system': {
        divineClash: {
          isAvatar: true,
          seatIndex
        } as DivineClashTokenFlags
      }
    },
    actorLink: true,
    disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
    locked: false
  };
  
  try {
    await scene.createEmbeddedDocuments('Token', [tokenData]);
  } catch (error) {
    console.error(`Mastery System | Failed to spawn avatar for seat ${seatIndex}`, error);
  }
}

/**
 * Pull users to scene (via socket or direct activation)
 */
async function pullUsersToScene(scene: Scene, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    try {
      const user = (game as any).users?.get(userId);
      if (!user || !user.active) {
        console.warn(`Mastery System | User ${userId} not found or not active`);
        continue;
      }
      
      // Try socket method first (if available)
      if ((game as any).socket && typeof (game as any).socket.emit === 'function') {
        try {
          (game as any).socket.emit('pullToScene', scene.id, userId);
          console.log(`Mastery System | Pulled user ${user.name} to scene via socket`);
        } catch (socketError) {
          // Fallback to direct activation
          console.warn('Mastery System | Socket pull failed, using direct activation', socketError);
          await scene.activate({ user });
        }
      } else {
        // Direct activation (only works for local user)
        if (user.id === game.user?.id) {
          await scene.activate();
        } else {
          console.warn(`Mastery System | Cannot directly activate scene for user ${user.name} (not local)`);
          // Try to broadcast via socket if available
          if ((game as any).socket) {
            (game as any).socket.emit('pullToScene', scene.id, userId);
          }
        }
      }
    } catch (error) {
      console.error(`Mastery System | Failed to pull user ${userId} to scene`, error);
    }
  }
}

/**
 * Calculate power stone count from actor (sum of all pools except vitality)
 */
function calculatePowerStoneCount(actor: Actor): number {
  const system = (actor.system as any) || {};
  const stonePools = system.stonePools || {};
  
  let total = 0;
  for (const [key, pool] of Object.entries(stonePools)) {
    if (key === 'vitality') continue;
    const poolData = pool as any;
    const max = poolData.max || 0;
    const sustained = poolData.sustained || 0;
    total += Math.max(0, max - sustained);
  }
  
  return total;
}

/**
 * Calculate vitality stone count from actor
 */
function calculateVitalityStoneCount(actor: Actor): number {
  // Check flag first
  const flagValue = (actor as any).getFlag('mastery-system', 'divineClash.vitality') as number | undefined;
  if (flagValue !== undefined && flagValue !== null) {
    return flagValue;
  }
  
  // Fallback to stone pool
  const system = (actor.system as any) || {};
  const stonePools = system.stonePools || {};
  const vitalityPool = stonePools.vitality || {};
  return (vitalityPool as any).max || 10;
}

/**
 * START: Initialize Divine Clash from selected tokens
 */
export async function startDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Divine Clash');
    return;
  }
  
  const controlled = canvas?.tokens?.controlled || [];
  if (controlled.length === 0) {
    ui.notifications?.warn('Please select at least one character token to start Divine Clash');
    return;
  }
  
  // Separate players and enemy
  const playerTokens: Token[] = [];
  let enemyToken: Token | null = null;
  
  for (const token of controlled) {
    if (!token.actor) continue;
    if (token.actor.type === 'character') {
      playerTokens.push(token);
    } else if (token.actor.type === 'npc') {
      // First NPC is enemy
      if (!enemyToken) {
        enemyToken = token;
      }
    }
  }
  
  if (playerTokens.length === 0) {
    ui.notifications?.warn('Please select at least one character token');
    return;
  }
  
  // Get Divine Clash scene
  const scene = getDivineClashScene();
  if (!scene) {
    ui.notifications?.error('Divine Clash scene not found. Please configure it in settings or create a scene named "Divine Clash"');
    return;
  }
  
  // Initialize scene flags
  const seats: Record<number, DivineClashSeat> = {};
  
  // Seat 0: Enemy (if selected)
  if (enemyToken && enemyToken.actor) {
    seats[0] = {
      seatIndex: 0,
      actorId: (enemyToken.actor as any).id,
      userId: null, // GM-only
      isEnemy: true
    };
  }
  
  // Seats 1..N: Players
  const userIdsToPull: string[] = [];
  for (let i = 0; i < playerTokens.length; i++) {
    const token = playerTokens[i];
    const actor = token.actor;
    if (!actor) continue;
    
    const seatIndex = i + 1;
    
    // Find user for this actor
    let user: User | null = null;
    const characterUser = (game as any).users?.find((u: User) => (u as any).character?.id === (actor as any).id);
    if (characterUser) {
      user = characterUser;
    } else {
      // Fallback: find first active owner
      const owners = (game as any).users?.filter((u: User) => actor.testUserPermission(u, 'OWNER')) || [];
      user = owners.find((u: User) => u.active) || owners[0] || null;
    }
    
    if (!user) {
      console.warn(`Mastery System | No user found for actor ${(actor as any).name}, skipping`);
      continue;
    }
    
    seats[seatIndex] = {
      seatIndex,
      actorId: (actor as any).id,
      userId: user.id,
      isEnemy: false
    };
    
    userIdsToPull.push(user.id);
  }
  
  // Update scene flags
  await updateSceneFlags(scene, {
    phase: 'planning',
    seats,
    started: true
  });
  
  // Pull players to scene
  await pullUsersToScene(scene, userIdsToPull);
  
  // Switch GM to scene
  await scene.activate();
  
  // Wait a moment for scene to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Spawn tokens for each seat
  for (const [seatIndexStr, seat] of Object.entries(seats)) {
    const seatIndex = parseInt(seatIndexStr);
    const actor = (game as any).actors?.get(seat.actorId);
    if (!actor) continue;
    
    const user = seat.userId ? (game as any).users?.get(seat.userId) : null;
    
    if (seat.isEnemy) {
      // Enemy: spawn avatar and stones (if configured)
      await spawnAvatarForSeat(scene, seatIndex, actor);
      // Enemy stones optional - skip for now
    } else {
      // Player: spawn avatar, power stones, vitality stones
      await spawnAvatarForSeat(scene, seatIndex, actor);
      
      const powerCount = calculatePowerStoneCount(actor);
      const vitalityCount = calculateVitalityStoneCount(actor);
      
      await spawnStonesForSeat(scene, seatIndex, actor, user, powerCount, vitalityCount);
    }
  }
  
  ui.notifications?.info(`Divine Clash started with ${playerTokens.length} player(s)`);
}

/**
 * REVEAL: Reveal attack/defense and move stones to exhausted
 */
export async function revealDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reveal Divine Clash');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const flags = getSceneFlags(scene);
  if (!flags.started) {
    ui.notifications?.warn('Divine Clash not started. Use "Start" first.');
    return;
  }
  
  // Update phase
  await updateSceneFlags(scene, { phase: 'reveal' });
  
  // Collect summary data
  const summary: Array<{ name: string; attack: number; defense: number; ready: number; exhausted: number; vitality: number }> = [];
  
  // Process each seat
  for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
    const seatIndex = parseInt(seatIndexStr);
    const actor = seat.actorId ? (game as any).actors?.get(seat.actorId) : null;
    const actorName = (actor as any)?.name || `Seat ${seatIndex}`;
    
    // Find all stone tokens for this seat
    const tokens = scene.tokens || [];
    const seatTokens = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone && tokenFlags.seatIndex === seatIndex && tokenFlags.stoneKind === 'power';
    });
    
    let attack = 0;
    let defense = 0;
    let ready = 0;
    let exhausted = 0;
    let vitality = 0;
    
    // Count stones in each zone and move attack/defense to exhausted
    const exhaustedRegion = findRegion(scene, getRegionName(seatIndex, 'EXHAUSTED'));
    
    for (const token of seatTokens) {
      const zone = getTokenZone(scene, token, seatIndex);
      
      if (zone === 'attack') {
        attack++;
        // Move to exhausted
        if (exhaustedRegion) {
          const pos = getRandomPointInRegion(exhaustedRegion);
          await token.document.update({
            x: pos.x,
            y: pos.y,
            locked: true,
            flags: {
              'mastery-system': {
                divineClash: {
                  ...(token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
                  state: 'exhausted'
                }
              }
            }
          });
          exhausted++;
        }
      } else if (zone === 'defense') {
        defense++;
        // Move to exhausted
        if (exhaustedRegion) {
          const pos = getRandomPointInRegion(exhaustedRegion);
          await token.document.update({
            x: pos.x,
            y: pos.y,
            locked: true,
            flags: {
              'mastery-system': {
                divineClash: {
                  ...(token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
                  state: 'exhausted'
                }
              }
            }
          });
          exhausted++;
        }
      } else if (zone === 'ready') {
        ready++;
      } else if (zone === 'exhausted') {
        exhausted++;
      }
    }
    
    // Count vitality stones
    const vitalityTokens = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone && tokenFlags.seatIndex === seatIndex && tokenFlags.stoneKind === 'vitality';
    });
    vitality = vitalityTokens.length;
    
    summary.push({ name: actorName, attack, defense, ready, exhausted, vitality });
  }
  
  // Post chat message
  let message = '<div class="divine-clash-reveal"><h3>Divine Clash Reveal</h3><table><thead><tr><th>Player</th><th>Attack</th><th>Defense</th><th>Ready</th><th>Exhausted</th><th>Vitality</th></tr></thead><tbody>';
  for (const entry of summary) {
    message += `<tr><td>${entry.name}</td><td>${entry.attack}</td><td>${entry.defense}</td><td>${entry.ready}</td><td>${entry.exhausted}</td><td>${entry.vitality}</td></tr>`;
  }
  message += '</tbody></table></div>';
  
  await ChatMessage.create({
    content: message,
    speaker: { alias: 'Divine Clash System' }
  });
  
  ui.notifications?.info('Divine Clash revealed! Attack/Defense stones moved to Exhausted.');
}

/**
 * END ROUND: Regenerate stones based on Mastery Rank
 */
export async function endRoundDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can end a round');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const flags = getSceneFlags(scene);
  if (!flags.started) {
    ui.notifications?.warn('Divine Clash not started. Use "Start" first.');
    return;
  }
  
  // Update phase back to planning
  await updateSceneFlags(scene, { phase: 'planning' });
  
  const regenMessages: string[] = [];
  
  // Process each seat
  for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
    const seatIndex = parseInt(seatIndexStr);
    const actor = seat.actorId ? (game as any).actors?.get(seat.actorId) : null;
    if (!actor) continue;
    
    // Get Mastery Rank
    const system = (actor.system as any) || {};
    const masteryRank = system.mastery?.rank || 2;
    const regen = Math.max(1, masteryRank);
    
    // Find exhausted power stones for this seat
    const tokens = scene.tokens || [];
    const exhaustedStones = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone &&
             tokenFlags.seatIndex === seatIndex &&
             tokenFlags.stoneKind === 'power' &&
             tokenFlags.state === 'exhausted' &&
             token.document?.locked;
    });
    
    // Move up to regen stones to ready
    const readyRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
    if (!readyRegion) continue;
    
    let moved = 0;
    for (let i = 0; i < Math.min(regen, exhaustedStones.length); i++) {
      const token = exhaustedStones[i];
      const pos = getRandomPointInRegion(readyRegion);
      
      await (token as any).document.update({
        x: pos.x,
        y: pos.y,
        locked: false,
        flags: {
          'mastery-system': {
            divineClash: {
              ...((token as any).document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
              state: 'ready'
            }
          }
        }
      });
      moved++;
    }
    
    if (moved > 0) {
      regenMessages.push(`${(actor as any).name}: +${moved} Ready`);
    }
  }
  
  // Post chat message
  if (regenMessages.length > 0) {
    await ChatMessage.create({
      content: `<div class="divine-clash-regen"><h4>Regeneration Applied</h4><ul>${regenMessages.map(m => `<li>${m}</li>`).join('')}</ul></div>`,
      speaker: { alias: 'Divine Clash System' }
    });
  }
  
  ui.notifications?.info('Round ended. Regeneration applied.');
}

/**
 * RESET: Cleanup all Divine Clash tokens
 */
export async function resetDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reset Divine Clash');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const cleanupAvatars = (game as any).settings.get('mastery-system', 'divineClashCleanupAvatars') as boolean;
  
  // Find all Divine Clash tokens
  const tokens = scene.tokens || [];
  const tokensToDelete: string[] = [];
  
  for (const token of tokens) {
    const tokenFlags = (token as any).document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
    if (tokenFlags?.isStone) {
      tokensToDelete.push((token as any).id);
    } else if (tokenFlags?.isAvatar && cleanupAvatars) {
      tokensToDelete.push((token as any).id);
    }
  }
  
  if (tokensToDelete.length > 0) {
    await scene.deleteEmbeddedDocuments('Token', tokensToDelete);
  }
  
  // Clear scene flags
  await scene.unsetFlag('mastery-system', 'divineClash');
  
  ui.notifications?.info(`Divine Clash reset. Removed ${tokensToDelete.length} token(s).`);
}

/**
 * Get current phase
 */
export function getDivineClashPhase(): DivineClashPhase | null {
  const scene = canvas?.scene;
  if (!scene) return null;
  const flags = getSceneFlags(scene);
  return flags.phase;
}

/**
 * Check if current scene is Divine Clash scene
 */
export function isDivineClashScene(): boolean {
  const scene = canvas?.scene;
  if (!scene) return false;
  const flags = getSceneFlags(scene);
  return flags.started;
}

