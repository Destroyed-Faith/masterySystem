/**
 * Divine Clash Manager
 * Handles automation for the Divine Clash board system
 */
/**
 * Get Divine Clash scene (by ID or name)
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
function _getDivineClashScene() {
    const sceneId = game.settings.get('mastery-system', 'divineClashSceneId');
    if (sceneId && sceneId.trim() !== '') {
        const scene = game.scenes?.get(sceneId);
        if (scene)
            return scene;
    }
    // Fallback: find by name
    const scenes = game.scenes || [];
    const scene = scenes.find((s) => s.name === 'Divine Clash');
    return scene || null;
}
/**
 * Get scene flags for Divine Clash
 */
function getSceneFlags(scene) {
    const flags = scene.getFlag('mastery-system', 'divineClash');
    return flags || {
        phase: 'planning',
        seats: {},
        started: false
    };
}
/**
 * Update scene flags
 */
async function updateSceneFlags(scene, updates) {
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
function findRegion(scene, namePattern) {
    console.log(`Mastery System | [FIND REGION] Looking for region: "${namePattern}"`);
    // In Foundry V13, regions are placeables on the canvas
    let regions = [];
    // Try canvas.regions.placeables first (V13 API)
    if (canvas?.regions?.placeables) {
        regions = Array.from(canvas.regions.placeables.values());
        console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via canvas.regions.placeables`);
    }
    else {
        // Fallback: try scene.regions collection
        if (scene.regions) {
            if (scene.regions instanceof Map || scene.regions.size !== undefined) {
                regions = Array.from(scene.regions.values());
                console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Collection)`);
            }
            else if (Array.isArray(scene.regions)) {
                regions = scene.regions;
                console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Array)`);
            }
        }
    }
    if (regions.length === 0) {
        console.warn(`Mastery System | [FIND REGION] No regions found in any expected location`);
        return null;
    }
    console.log(`Mastery System | [FIND REGION] Available region names:`, regions.map((r) => {
        const name = r.document?.name || r.name || r.document?.label || r.label || r.document?.id || r.id || 'unnamed';
        return name;
    }));
    for (const region of regions) {
        // In V13, region name is in region.document.name
        const regionName = region.document?.name || region.name || region.document?.label || region.label || region.document?.id || region.id || '';
        console.log(`Mastery System | [FIND REGION] Checking region "${regionName}" against pattern "${namePattern}"`);
        if (regionName === namePattern || regionName.includes(namePattern)) {
            // Extract bounds from region
            // In V13, bounds are in region.bounds or region.document.shape
            let x = 0, y = 0, width = 100, height = 100;
            // Try region.bounds first (PIXI Rectangle)
            if (region.bounds) {
                x = region.bounds.x;
                y = region.bounds.y;
                width = region.bounds.width;
                height = region.bounds.height;
                console.log(`Mastery System | [FIND REGION] Using region.bounds:`, { x, y, width, height });
            }
            // Try region.document.shape
            else if (region.document?.shape) {
                const shape = region.document.shape;
                if (shape.x !== undefined && shape.y !== undefined) {
                    x = shape.x;
                    y = shape.y;
                    width = shape.width || 100;
                    height = shape.height || 100;
                    console.log(`Mastery System | [FIND REGION] Using region.document.shape (x/y):`, { x, y, width, height });
                }
                else if (shape.x1 !== undefined && shape.y1 !== undefined) {
                    x = shape.x1;
                    y = shape.y1;
                    width = (shape.x2 || shape.x1 + 100) - shape.x1;
                    height = (shape.y2 || shape.y1 + 100) - shape.y1;
                    console.log(`Mastery System | [FIND REGION] Using region.document.shape (x1/y1):`, { x, y, width, height });
                }
                else if (shape.center) {
                    x = shape.center.x - (shape.radius || 50);
                    y = shape.center.y - (shape.radius || 50);
                    width = (shape.radius || 50) * 2;
                    height = (shape.radius || 50) * 2;
                    console.log(`Mastery System | [FIND REGION] Using region.document.shape (center):`, { x, y, width, height });
                }
            }
            // Try region.shape (legacy)
            else if (region.shape) {
                const shape = region.shape;
                if (shape.x !== undefined && shape.y !== undefined) {
                    x = shape.x;
                    y = shape.y;
                    width = shape.width || 100;
                    height = shape.height || 100;
                }
                else if (shape.x1 !== undefined && shape.y1 !== undefined) {
                    x = shape.x1;
                    y = shape.y1;
                    width = (shape.x2 || shape.x1 + 100) - shape.x1;
                    height = (shape.y2 || shape.y1 + 100) - shape.y1;
                }
            }
            // Try region.document.x/y (direct properties)
            else if (region.document?.x !== undefined && region.document?.y !== undefined) {
                x = region.document.x;
                y = region.document.y;
                width = region.document.width || 100;
                height = region.document.height || 100;
                console.log(`Mastery System | [FIND REGION] Using region.document.x/y:`, { x, y, width, height });
            }
            const result = {
                id: region.document?.id || region.id || region._id || '',
                name: regionName,
                x,
                y,
                width,
                height
            };
            console.log(`Mastery System | [FIND REGION] Match found!`, result);
            return result;
        }
    }
    console.warn(`Mastery System | [FIND REGION] No match found for pattern "${namePattern}"`);
    return null;
}
/**
 * Get random point inside a region (snapped to grid)
 */
function getRandomPointInRegion(region) {
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
function isPointInRegion(point, region) {
    return point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height;
}
/**
 * Get region name for a seat and zone
 */
function getRegionName(seatIndex, zone) {
    return `DC_SEAT_${seatIndex}_${zone}`;
}
/**
 * Find which zone a token is in (by checking regions)
 */
function getTokenZone(scene, token, seatIndex) {
    const tokenCenter = token.center;
    const zones = ['ready', 'attack', 'defense', 'exhausted', 'vitality', 'burned'];
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
 * Create or get folder for player's Divine Clash stones
 */
async function ensurePlayerStoneFolder(user) {
    const folderName = `Divine Clash - ${user.name}`;
    console.log(`Mastery System | [ENSURE FOLDER] Looking for folder: "${folderName}" for user: ${user.name} (${user.id})`);
    // Check if folder already exists
    const allFolders = game.folders || [];
    console.log(`Mastery System | [ENSURE FOLDER] Total folders in game: ${allFolders.length}`);
    const existingFolder = allFolders.find((f) => {
        const matches = f.name === folderName && f.type === 'Actor';
        if (matches) {
            console.log(`Mastery System | [ENSURE FOLDER] Found matching folder: ${f.name} (${f.id})`);
        }
        return matches;
    });
    if (existingFolder) {
        console.log(`Mastery System | [ENSURE FOLDER] Found existing folder: ${folderName} (${existingFolder.id})`);
        return existingFolder.id;
    }
    // Create new folder
    console.log(`Mastery System | [ENSURE FOLDER] Creating new folder: ${folderName}`);
    try {
        const folderData = {
            name: folderName,
            type: 'Actor',
            folder: null, // Top level
            color: null,
            sorting: 'a',
            flags: {
                'mastery-system': {
                    divineClash: {
                        userId: user.id,
                        userName: user.name
                    }
                }
            }
        };
        console.log(`Mastery System | [ENSURE FOLDER] Folder data:`, folderData);
        const folder = await Folder.create(folderData);
        console.log(`Mastery System | [ENSURE FOLDER] Successfully created folder: ${folderName} (${folder.id})`);
        return folder.id;
    }
    catch (error) {
        console.error(`Mastery System | [ENSURE FOLDER] Failed to create folder: ${folderName}`, error);
        console.error(`Mastery System | [ENSURE FOLDER] Error details:`, {
            message: error.message,
            stack: error.stack,
            error: error
        });
        return null;
    }
}
/**
 * Create individual stone actors for a player (one per stone needed)
 * Reuses existing actors if they already exist in the folder
 */
async function createStoneActorsForPlayer(user, kind, count, folderId) {
    const kindName = kind === 'power' ? 'Power' : 'Vitality';
    const settingsImg = kind === 'power'
        ? game.settings.get('mastery-system', 'divineClashPowerStoneImg')
        : game.settings.get('mastery-system', 'divineClashVitalityStoneImg');
    const defaultImg = kind === 'power'
        ? 'systems/mastery-system/icons/svg/power-stone.svg'
        : 'systems/mastery-system/icons/svg/vitality-stone.svg';
    const stoneImg = (settingsImg && settingsImg.trim() !== '') ? settingsImg : defaultImg;
    console.log(`Mastery System | [CREATE STONE ACTORS] Ensuring ${count} ${kindName} stone actors for ${user.name}`);
    if (!folderId) {
        console.error(`Mastery System | [CREATE STONE ACTORS] No folder ID provided, cannot create actors`);
        return [];
    }
    // First, find all existing stone actors of this kind in the folder
    // In Foundry VTT, game.actors is a Collection, not an array
    const actorsCollection = game.actors;
    const allActors = actorsCollection ? (Array.isArray(actorsCollection) ? actorsCollection : Array.from(actorsCollection.values())) : [];
    const existingActors = allActors.filter((a) => {
        const aFolder = a.folder;
        const aName = a.name || '';
        const aType = a.type;
        const aFlags = a.flags?.['mastery-system']?.divineClash;
        return aFolder === folderId &&
            aType === 'npc' &&
            aName.includes(`${kindName} Stone`) &&
            aName.includes(user.name) &&
            (aFlags?.stoneKind === kind || aFlags?.isStoneActor);
    });
    console.log(`Mastery System | [CREATE STONE ACTORS] Found ${existingActors.length} existing ${kindName} stone actors in folder`);
    const actors = [];
    // Reuse existing actors first
    for (let i = 0; i < Math.min(existingActors.length, count); i++) {
        const existingActor = existingActors[i];
        console.log(`Mastery System | [CREATE STONE ACTORS] Reusing existing actor: ${existingActor.name || 'Unknown'} (${existingActor.id})`);
        actors.push(existingActor);
    }
    // Create missing actors
    const actorsToCreate = count - actors.length;
    if (actorsToCreate > 0) {
        console.log(`Mastery System | [CREATE STONE ACTORS] Creating ${actorsToCreate} new ${kindName} stone actors`);
        for (let i = actors.length; i < count; i++) {
            const actorName = `${kindName} Stone ${i + 1} - ${user.name}`;
            const actorData = {
                name: actorName,
                type: 'npc',
                folder: folderId,
                ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
                img: stoneImg,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            isStoneActor: true,
                            stoneKind: kind,
                            userId: user.id,
                            userName: user.name
                        }
                    }
                }
            };
            try {
                const actor = await Actor.create(actorData);
                console.log(`Mastery System | [CREATE STONE ACTORS] Created new actor ${i + 1}/${count}: ${actorName} (${actor.id})`);
                actors.push(actor);
            }
            catch (error) {
                console.error(`Mastery System | [CREATE STONE ACTORS] Failed to create actor ${i + 1}/${count}: ${actorName}`, error);
            }
        }
    }
    else {
        console.log(`Mastery System | [CREATE STONE ACTORS] All ${count} ${kindName} stone actors already exist, reusing them`);
    }
    // If we have more existing actors than needed, log a warning but use what we have
    if (existingActors.length > count) {
        console.warn(`Mastery System | [CREATE STONE ACTORS] Found ${existingActors.length} existing ${kindName} stone actors but only need ${count}. Using first ${count}.`);
    }
    console.log(`Mastery System | [CREATE STONE ACTORS] Final result: ${actors.length}/${count} ${kindName} stone actors (${actors.length - actorsToCreate} reused, ${actorsToCreate} created)`);
    return actors.slice(0, count); // Ensure we only return the exact count needed
}
/**
 * Ensure player stone actor exists (one per user, per kind)
 * First tries to find existing stone actors, then creates new ones if needed
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _ensurePlayerStoneActor(user, kind) {
    const actorName = `DC Stone (${kind === 'power' ? 'Power' : 'Vitality'}) - ${user.name}`;
    const kindName = kind === 'power' ? 'Power' : 'Vitality';
    console.log(`Mastery System | [ENSURE STONE ACTOR] Looking for ${kindName} stone actor for user ${user.name}`);
    // Strategy 0: Check for configured base stone actor (global basisstein)
    const baseActorId = kind === 'power'
        ? game.settings.get('mastery-system', 'divineClashBasePowerStoneActorId')
        : game.settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
    if (baseActorId && baseActorId.trim() !== '') {
        const baseActor = game.actors?.get(baseActorId);
        if (baseActor) {
            console.log(`Mastery System | [ENSURE STONE ACTOR] Using configured base stone actor: ${baseActor.name} (${baseActorId})`);
            // Ensure user has OWNER permission (so they can move their stone tokens)
            const currentOwnership = baseActor.ownership || {};
            const userPermission = currentOwnership[user.id] || CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
            if (userPermission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                const newOwnership = { ...currentOwnership, [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
                await baseActor.update({ ownership: newOwnership });
                console.log(`Mastery System | [ENSURE STONE ACTOR] Granted OWNER permission to user ${user.name}`);
            }
            return baseActor;
        }
        else {
            console.warn(`Mastery System | [ENSURE STONE ACTOR] Configured base stone actor ID ${baseActorId} not found, falling back to per-user actors`);
        }
    }
    // Strategy 1: Check for exact name match
    let existing = game.actors?.find((a) => {
        const name = a.name;
        const type = a.type;
        return name === actorName && type === 'npc';
    });
    if (existing) {
        console.log(`Mastery System | [ENSURE STONE ACTOR] Found exact match: ${existing.name}`);
        // Ensure ownership
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await existing.update({ ownership });
        return existing;
    }
    // Strategy 2: Find any stone actor owned by this user that matches the kind
    // In Foundry VTT, game.actors is a Collection, not an array
    const actorsCollection = game.actors;
    const allActors = actorsCollection ? (Array.isArray(actorsCollection) ? actorsCollection : Array.from(actorsCollection.values())) : [];
    const userOwnedActors = allActors.filter((a) => {
        const hasOwnership = a.testUserPermission?.(user, 'OWNER') ||
            a.ownership?.[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        return hasOwnership && a.type === 'npc';
    });
    console.log(`Mastery System | [ENSURE STONE ACTOR] Found ${userOwnedActors.length} NPC actors owned by ${user.name}`);
    // Look for actors with stone-related names
    const stoneKeywords = kind === 'power'
        ? ['power', 'stone', 'dc stone']
        : ['vitality', 'stone', 'dc stone'];
    existing = userOwnedActors.find((a) => {
        const name = (a.name || '').toLowerCase();
        return stoneKeywords.some(keyword => name.includes(keyword)) &&
            (kind === 'power' ? !name.includes('vitality') : name.includes('vitality'));
    });
    if (existing) {
        console.log(`Mastery System | [ENSURE STONE ACTOR] Found existing stone actor by name pattern: ${existing.name}`);
        // Ensure ownership
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await existing.update({ ownership });
        return existing;
    }
    // Strategy 3: If user has exactly one stone actor of the right kind, use it
    // (This handles cases where the user has manually created stone actors)
    const stoneActors = userOwnedActors.filter((a) => {
        const name = (a.name || '').toLowerCase();
        return name.includes('stone');
    });
    if (stoneActors.length === 1 && kind === 'power') {
        // If only one stone actor exists and we need power, use it
        console.log(`Mastery System | [ENSURE STONE ACTOR] Using single existing stone actor: ${stoneActors[0].name}`);
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await stoneActors[0].update({ ownership });
        return stoneActors[0];
    }
    // Strategy 4: Create new actor if none found
    console.log(`Mastery System | [ENSURE STONE ACTOR] No existing stone actor found, creating new one: ${actorName}`);
    const actorData = {
        name: actorName,
        type: 'npc',
        ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        img: kind === 'power'
            ? (game.settings.get('mastery-system', 'divineClashPowerStoneImg') || 'systems/mastery-system/icons/svg/power-stone.svg')
            : (game.settings.get('mastery-system', 'divineClashVitalityStoneImg') || 'systems/mastery-system/icons/svg/vitality-stone.svg')
    };
    try {
        const actor = await Actor.create(actorData);
        console.log(`Mastery System | [ENSURE STONE ACTOR] Created new stone actor: ${actorName}`);
        return actor;
    }
    catch (error) {
        console.error(`Mastery System | [ENSURE STONE ACTOR] Failed to create stone actor: ${actorName}`, error);
        return null;
    }
}
/**
 * Check if an image path is a valid non-placeholder image
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
function _isValidImage(img) {
    if (!img || img.trim() === '')
        return false;
    // Check for common placeholder patterns (but allow default SVG files as they are valid images)
    const placeholderPatterns = [
        'placeholder',
        'default-',
        'mystery-man', // Foundry default placeholder
        'icons/svg/mystery-man.svg'
    ];
    const imgLower = img.toLowerCase();
    // Only reject if it's clearly a placeholder, not a valid default image
    return !placeholderPatterns.some(pattern => imgLower.includes(pattern));
}
/**
 * Find existing stone tokens for a seat that match the given actors
 * Returns a map of actorId -> token for reuse
 */
function findExistingStoneTokensForSeat(scene, seatIndex, stoneActors, stoneKind) {
    const tokens = scene.tokens || [];
    const existingTokens = new Map();
    const actorIds = new Set(stoneActors.map(a => a.id));
    for (const token of tokens) {
        const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
        const tokenActorId = token.actorId || token.document?.actorId;
        if (tokenFlags?.isStone &&
            tokenFlags.seatIndex === seatIndex &&
            tokenFlags.stoneKind === stoneKind &&
            tokenActorId &&
            actorIds.has(tokenActorId)) {
            existingTokens.set(tokenActorId, token);
            console.log(`Mastery System | [FIND EXISTING TOKENS] Found existing token for actor ${tokenActorId}: ${token.name || token.document?.name}`);
        }
    }
    console.log(`Mastery System | [FIND EXISTING TOKENS] Found ${existingTokens.size}/${stoneActors.length} existing ${stoneKind} stone tokens for seat ${seatIndex}`);
    return existingTokens;
}
/**
 * Clean up orphaned stone tokens for a seat (tokens without matching actors)
 */
async function cleanupOrphanedStonesForSeat(scene, seatIndex, validActorIds) {
    const tokens = scene.tokens || [];
    const tokensToDelete = [];
    for (const token of tokens) {
        const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
        const tokenActorId = token.actorId || token.document?.actorId;
        if (tokenFlags?.isStone &&
            tokenFlags.seatIndex === seatIndex &&
            tokenActorId &&
            !validActorIds.has(tokenActorId)) {
            // This token belongs to a stone actor that no longer exists
            tokensToDelete.push(token.id || token.document?.id);
        }
    }
    if (tokensToDelete.length > 0) {
        console.log(`Mastery System | [CLEANUP ORPHANED] Removing ${tokensToDelete.length} orphaned stone token(s) for seat ${seatIndex}`);
        await scene.deleteEmbeddedDocuments('Token', tokensToDelete);
    }
}
/**
 * Spawn stone tokens for a seat
 * @deprecated Not used in new implementation - only creates actors now
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _spawnStonesForSeat(scene, seatIndex, _actor, user, powerStoneCount, vitalityStoneCount) {
    console.log(`Mastery System | [SPAWN STONES] Starting for seat ${seatIndex}:`, {
        powerCount: powerStoneCount,
        vitalityCount: vitalityStoneCount,
        hasUser: !!user,
        userId: user?.id
    });
    const seatRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
    if (!seatRegion) {
        console.error(`Mastery System | [SPAWN STONES] Seat ${seatIndex} READY region not found - cannot spawn stones`);
        return;
    }
    console.log(`Mastery System | [SPAWN STONES] Found READY region for seat ${seatIndex}:`, seatRegion);
    // Create folder for player's stones (always, even if no stones to spawn)
    let folderId = null;
    if (user) {
        folderId = await ensurePlayerStoneFolder(user);
        if (!folderId) {
            console.error(`Mastery System | [SPAWN STONES] Failed to create/get folder for user ${user.name}`);
            // Continue anyway - folder creation is not critical
        }
    }
    // Spawn power stones
    if (powerStoneCount > 0 && user && folderId) {
        console.log(`Mastery System | [SPAWN STONES] Spawning ${powerStoneCount} power stones for user ${user.name}`);
        // Create individual stone actors (one per stone) - reuses existing if available
        const stoneActors = await createStoneActorsForPlayer(user, 'power', powerStoneCount, folderId);
        if (stoneActors.length !== powerStoneCount) {
            console.error(`Mastery System | [SPAWN STONES] Expected ${powerStoneCount} power stone actors, but got ${stoneActors.length}`);
        }
        // Find existing tokens for these actors
        const existingTokens = findExistingStoneTokensForSeat(scene, seatIndex, stoneActors, 'power');
        const validActorIds = new Set(stoneActors.map(a => a.id));
        // Clean up orphaned tokens (tokens for actors that no longer exist)
        await cleanupOrphanedStonesForSeat(scene, seatIndex, validActorIds);
        // Create tokens only for actors that don't have tokens yet
        let createdCount = 0;
        let reusedCount = 0;
        for (let i = 0; i < stoneActors.length; i++) {
            const stoneActor = stoneActors[i];
            const actorId = stoneActor.id;
            // Check if token already exists for this actor
            const existingToken = existingTokens.get(actorId);
            if (existingToken) {
                console.log(`Mastery System | [SPAWN STONES] Reusing existing power stone token ${i + 1}/${stoneActors.length} for actor ${actorId}: ${existingToken.name || existingToken.document?.name}`);
                reusedCount++;
                continue;
            }
            // Create new token
            const pos = getRandomPointInRegion(seatRegion);
            const tokenData = {
                name: stoneActor.name,
                actorId: actorId,
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
                        }
                    }
                },
                actorLink: true, // Linked to individual stone actor
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                locked: false
            };
            console.log(`Mastery System | [SPAWN STONES] Creating new power stone token ${i + 1}/${stoneActors.length}:`, {
                name: tokenData.name,
                actorId: tokenData.actorId,
                actorName: stoneActor.name,
                actorImg: stoneActor.img,
                position: { x: tokenData.x, y: tokenData.y },
                actorLink: tokenData.actorLink
            });
            try {
                const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                const createdToken = created[0];
                if (createdToken) {
                    console.log(`Mastery System | [SPAWN STONES] Created new power stone token ${i + 1}/${stoneActors.length}:`, {
                        id: createdToken.id,
                        name: createdToken.name,
                        actorId: createdToken.actorId,
                        position: { x: createdToken.x || createdToken.document?.x, y: createdToken.y || createdToken.document?.y },
                        actorLink: createdToken.document?.actorLink || createdToken.actorLink
                    });
                    createdCount++;
                }
                else {
                    console.error(`Mastery System | [SPAWN STONES] Created array is empty for power stone ${i + 1}`);
                }
            }
            catch (error) {
                console.error(`Mastery System | [SPAWN STONES] Failed to spawn power stone token ${i + 1}:`, error);
            }
        }
        console.log(`Mastery System | [SPAWN STONES] Power stones summary: ${reusedCount} reused, ${createdCount} created, ${stoneActors.length} total`);
    }
    else {
        console.log(`Mastery System | [SPAWN STONES] Skipping power stones:`, {
            powerCount: powerStoneCount,
            hasUser: !!user
        });
    }
    // Spawn vitality stones
    if (vitalityStoneCount > 0 && user && folderId) {
        console.log(`Mastery System | [SPAWN STONES] Spawning ${vitalityStoneCount} vitality stones for user ${user.name}`);
        // Folder already created above, reuse folderId
        // Create individual stone actors (one per stone) - reuses existing if available
        const stoneActors = await createStoneActorsForPlayer(user, 'vitality', vitalityStoneCount, folderId);
        if (stoneActors.length !== vitalityStoneCount) {
            console.error(`Mastery System | [SPAWN STONES] Expected ${vitalityStoneCount} vitality stone actors, but got ${stoneActors.length}`);
        }
        const vitalityRegion = findRegion(scene, getRegionName(seatIndex, 'VITALITY'));
        if (!vitalityRegion) {
            console.error(`Mastery System | [SPAWN STONES] VITALITY region not found for seat ${seatIndex}`);
            return;
        }
        console.log(`Mastery System | [SPAWN STONES] Found VITALITY region for seat ${seatIndex}:`, vitalityRegion);
        // Find existing tokens for these actors
        const existingTokens = findExistingStoneTokensForSeat(scene, seatIndex, stoneActors, 'vitality');
        const validActorIds = new Set(stoneActors.map(a => a.id));
        // Clean up orphaned tokens (tokens for actors that no longer exist)
        await cleanupOrphanedStonesForSeat(scene, seatIndex, validActorIds);
        // Create tokens only for actors that don't have tokens yet
        let createdCount = 0;
        let reusedCount = 0;
        for (let i = 0; i < stoneActors.length; i++) {
            const stoneActor = stoneActors[i];
            const actorId = stoneActor.id;
            // Check if token already exists for this actor
            const existingToken = existingTokens.get(actorId);
            if (existingToken) {
                console.log(`Mastery System | [SPAWN STONES] Reusing existing vitality stone token ${i + 1}/${stoneActors.length} for actor ${actorId}: ${existingToken.name || existingToken.document?.name}`);
                reusedCount++;
                continue;
            }
            // Create new token
            const pos = getRandomPointInRegion(vitalityRegion);
            const tokenData = {
                name: stoneActor.name,
                actorId: actorId,
                x: pos.x,
                y: pos.y,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            isStone: true,
                            stoneKind: 'vitality',
                            seatIndex,
                            seatUserId: user.id,
                            state: 'vitality'
                        }
                    }
                },
                actorLink: true, // Linked to individual stone actor
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                locked: false
            };
            console.log(`Mastery System | [SPAWN STONES] Creating new vitality stone token ${i + 1}/${stoneActors.length}:`, {
                name: tokenData.name,
                actorId: tokenData.actorId,
                actorName: stoneActor.name,
                actorImg: stoneActor.img,
                position: { x: tokenData.x, y: tokenData.y },
                actorLink: tokenData.actorLink
            });
            try {
                const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                const createdToken = created[0];
                if (createdToken) {
                    console.log(`Mastery System | [SPAWN STONES] Created new vitality stone token ${i + 1}/${stoneActors.length}:`, {
                        id: createdToken.id,
                        name: createdToken.name,
                        actorId: createdToken.actorId,
                        position: { x: createdToken.x || createdToken.document?.x, y: createdToken.y || createdToken.document?.y },
                        actorLink: createdToken.document?.actorLink || createdToken.actorLink
                    });
                    createdCount++;
                }
                else {
                    console.error(`Mastery System | [SPAWN STONES] Created array is empty for vitality stone ${i + 1}`);
                }
            }
            catch (error) {
                console.error(`Mastery System | [SPAWN STONES] Failed to spawn vitality stone token ${i + 1}:`, error);
            }
        }
        console.log(`Mastery System | [SPAWN STONES] Vitality stones summary: ${reusedCount} reused, ${createdCount} created, ${stoneActors.length} total`);
    }
    else {
        console.log(`Mastery System | [SPAWN STONES] Skipping vitality stones:`, {
            count: vitalityStoneCount,
            hasUser: !!user
        });
    }
    console.log(`Mastery System | [SPAWN STONES] Completed spawning for seat ${seatIndex}`);
}
/**
 * Spawn avatar token for a seat
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _spawnAvatarForSeat(scene, seatIndex, actor) {
    console.log(`Mastery System | [SPAWN AVATAR] Starting for seat ${seatIndex}:`, {
        actorId: actor.id,
        actorName: actor.name,
        actorType: actor.type
    });
    // Find avatar position (use READY region center as fallback)
    const regionName = getRegionName(seatIndex, 'READY');
    console.log(`Mastery System | [SPAWN AVATAR] Looking for region: ${regionName}`);
    const seatRegion = findRegion(scene, regionName);
    if (!seatRegion) {
        console.warn(`Mastery System | [SPAWN AVATAR] Seat ${seatIndex} region "${regionName}" not found for avatar`);
        return;
    }
    console.log(`Mastery System | [SPAWN AVATAR] Found region:`, {
        id: seatRegion.id,
        x: seatRegion.x,
        y: seatRegion.y,
        width: seatRegion.width,
        height: seatRegion.height
    });
    const pos = {
        x: seatRegion.x + seatRegion.width / 2,
        y: seatRegion.y + seatRegion.height / 2
    };
    console.log(`Mastery System | [SPAWN AVATAR] Calculated position:`, pos);
    const tokenData = {
        name: actor.name,
        actorId: actor.id,
        x: pos.x,
        y: pos.y,
        flags: {
            'mastery-system': {
                divineClash: {
                    isAvatar: true,
                    seatIndex
                }
            }
        },
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        locked: false
    };
    console.log(`Mastery System | [SPAWN AVATAR] Token data:`, tokenData);
    try {
        console.log(`Mastery System | [SPAWN AVATAR] Creating token document...`);
        const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
        console.log(`Mastery System | [SPAWN AVATAR] Successfully created avatar token for seat ${seatIndex}:`, {
            count: created.length,
            tokenIds: created.map((t) => t.id),
            tokenNames: created.map((t) => t.name),
            tokenPositions: created.map((t) => ({ x: t.x, y: t.y }))
        });
        // Wait a moment for token to render
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify token is visible on canvas
        const canvasToken = canvas?.tokens?.placeables.find((t) => t.id === created[0].id);
        if (canvasToken) {
            console.log(`Mastery System | [SPAWN AVATAR] Token is visible on canvas at:`, {
                x: canvasToken.x,
                y: canvasToken.y,
                visible: canvasToken.visible
            });
        }
        else {
            console.warn(`Mastery System | [SPAWN AVATAR] Token created but not found on canvas yet`);
        }
    }
    catch (error) {
        console.error(`Mastery System | [SPAWN AVATAR] Failed to spawn avatar for seat ${seatIndex}:`, error);
        console.error(`Mastery System | [SPAWN AVATAR] Error details:`, {
            message: error.message,
            stack: error.stack
        });
    }
}
/**
 * Pull users to scene (via socket or direct activation)
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _pullUsersToScene(scene, userIds) {
    for (const userId of userIds) {
        try {
            const user = game.users?.get(userId);
            if (!user || !user.active) {
                console.warn(`Mastery System | User ${userId} not found or not active`);
                continue;
            }
            // Try socket method first (if available)
            if (game.socket && typeof game.socket.emit === 'function') {
                try {
                    game.socket.emit('pullToScene', scene.id, userId);
                    console.log(`Mastery System | Pulled user ${user.name} to scene via socket`);
                }
                catch (socketError) {
                    // Fallback to direct activation
                    console.warn('Mastery System | Socket pull failed, using direct activation', socketError);
                    await scene.activate({ user });
                }
            }
            else {
                // Direct activation (only works for local user)
                if (user.id === game.user?.id) {
                    await scene.activate();
                }
                else {
                    console.warn(`Mastery System | Cannot directly activate scene for user ${user.name} (not local)`);
                    // Try to broadcast via socket if available
                    if (game.socket) {
                        game.socket.emit('pullToScene', scene.id, userId);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Mastery System | Failed to pull user ${userId} to scene`, error);
        }
    }
}
/**
 * Calculate power stone count from actor (using system.stones)
 * @deprecated Not used in new implementation - calculation is done inline
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
function _calculatePowerStoneCount(actor) {
    const system = actor.system || {};
    const stones = system.stones || {};
    console.log(`Mastery System | [CALCULATE POWER STONES] Starting calculation for actor:`, {
        actorId: actor.id,
        actorName: actor.name,
        hasStones: !!stones,
        stonesData: stones
    });
    // Use system.stones if available (new system)
    if (stones.total !== undefined && stones.vitality !== undefined) {
        // Power stones = total - vitality (or current - vitality if current is set)
        const totalStones = stones.current !== undefined ? stones.current : stones.total;
        const vitality = stones.vitality || 0;
        const powerStones = Math.max(0, totalStones - vitality);
        console.log(`Mastery System | [CALCULATE POWER STONES] Using system.stones:`, {
            total: stones.total,
            current: stones.current,
            vitality: vitality,
            powerStones: powerStones
        });
        return powerStones;
    }
    // Fallback to old stonePools system for backwards compatibility
    console.log(`Mastery System | [CALCULATE POWER STONES] Falling back to stonePools`);
    const stonePools = system.stonePools || {};
    let total = 0;
    for (const [key, pool] of Object.entries(stonePools)) {
        if (key === 'vitality') {
            console.log(`Mastery System | [CALCULATE POWER STONES] Skipping vitality pool`);
            continue;
        }
        const poolData = pool;
        const current = poolData.current || 0;
        total += current;
        console.log(`Mastery System | [CALCULATE POWER STONES] Pool "${key}": current=${current}, runningTotal=${total}`);
    }
    console.log(`Mastery System | [CALCULATE POWER STONES] Final total: ${total}`);
    return total;
}
/**
 * Calculate vitality stone count from actor (using system.stones)
 * @deprecated Not used in new implementation - calculation is done inline
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
function _calculateVitalityStoneCount(actor) {
    // Check flag first
    const flagValue = actor.getFlag('mastery-system', 'divineClash.vitality');
    if (flagValue !== undefined && flagValue !== null) {
        console.log(`Mastery System | [CALCULATE VITALITY STONES] Using flag value: ${flagValue}`);
        return flagValue;
    }
    const system = actor.system || {};
    const stones = system.stones || {};
    // Use system.stones if available (new system)
    if (stones.vitality !== undefined) {
        const vitality = stones.vitality || 0;
        console.log(`Mastery System | [CALCULATE VITALITY STONES] Using system.stones.vitality: ${vitality}`);
        return vitality;
    }
    // Fallback to old stonePools system for backwards compatibility
    console.log(`Mastery System | [CALCULATE VITALITY STONES] Falling back to stonePools`);
    const stonePools = system.stonePools || {};
    const vitalityPool = stonePools.vitality || {};
    const fallback = vitalityPool.max || 10;
    console.log(`Mastery System | [CALCULATE VITALITY STONES] Using stonePools.vitality.max: ${fallback}`);
    return fallback;
}
// Guard to prevent multiple simultaneous calls
let isStartingDivineClash = false;
/**
 * START: Initialize Divine Clash from selected tokens
 */
/**
 * Get the folder that contains an actor
 */
function getActorFolder(actor) {
    const folderId = actor.folder;
    if (!folderId) {
        return null;
    }
    const folder = game.folders?.get(folderId);
    return folder || null;
}
/**
 * Create or get the "Stones for Actor Name" folder inside the actor's folder
 */
async function ensureStonesFolderForActor(actor) {
    const actorName = actor.name || 'Unknown Actor';
    const actorId = actor.id;
    const folderName = `Stones for ${actorName}`;
    console.log(`Mastery System | [ENSURE STONES FOLDER] ===== START Creating folder "${folderName}" =====`);
    // Get the actor's current folder
    const actorFolder = getActorFolder(actor);
    const parentFolderId = actorFolder ? actorFolder.id : null;
    console.log(`Mastery System | [ENSURE STONES FOLDER] Actor folder info:`, {
        actorName,
        actorId: actorId,
        actorFolderId: actor.folder,
        parentFolderId,
        parentFolderName: actorFolder?.name,
        parentFolderType: actorFolder?.type,
        hasParentFolder: !!actorFolder
    });
    // Check if folder already exists
    // In Foundry VTT, game.folders is a Collection, not an array
    const foldersCollection = game.folders;
    const allFolders = foldersCollection ? (Array.isArray(foldersCollection) ? foldersCollection : Array.from(foldersCollection.values())) : [];
    console.log(`Mastery System | [ENSURE STONES FOLDER] Total folders in game: ${allFolders.length}`);
    const existingFolder = allFolders.find((f) => {
        const matches = f.name === folderName &&
            f.type === 'Actor' &&
            f.folder === parentFolderId;
        if (matches) {
            console.log(`Mastery System | [ENSURE STONES FOLDER] Found matching folder:`, {
                id: f.id,
                name: f.name,
                type: f.type,
                folder: f.folder,
                parentFolderId: parentFolderId
            });
        }
        return matches;
    });
    if (existingFolder) {
        console.log(`Mastery System | [ENSURE STONES FOLDER] Found existing folder: ${folderName} (${existingFolder.id})`);
        console.log(`Mastery System | [ENSURE STONES FOLDER] ===== COMPLETED (existing) =====`);
        return existingFolder.id;
    }
    // Create new folder
    console.log(`Mastery System | [ENSURE STONES FOLDER] Creating new folder: ${folderName} in parent ${parentFolderId || 'root'}`);
    try {
        const folderData = {
            name: folderName,
            type: 'Actor',
            folder: parentFolderId, // One level deeper than the actor
            color: null,
            sorting: 'a',
            flags: {
                'mastery-system': {
                    divineClash: {
                        actorId: actorId,
                        actorName: actorName
                    }
                }
            }
        };
        console.log(`Mastery System | [ENSURE STONES FOLDER] Folder data to create:`, folderData);
        console.log(`Mastery System | [ENSURE STONES FOLDER] Calling Folder.create...`);
        const folder = await Folder.create(folderData);
        console.log(`Mastery System | [ENSURE STONES FOLDER] Folder.create returned:`, {
            id: folder.id,
            name: folder.name,
            type: folder.type,
            folder: folder.folder
        });
        console.log(`Mastery System | [ENSURE STONES FOLDER] Successfully created folder: ${folderName} (${folder.id})`);
        console.log(`Mastery System | [ENSURE STONES FOLDER] ===== COMPLETED (created) =====`);
        return folder.id;
    }
    catch (error) {
        console.error(`Mastery System | [ENSURE STONES FOLDER] Failed to create folder: ${folderName}`, error);
        console.error(`Mastery System | [ENSURE STONES FOLDER] Error details:`, {
            message: error.message,
            stack: error.stack,
            error: error
        });
        console.log(`Mastery System | [ENSURE STONES FOLDER] ===== COMPLETED (error) =====`);
        return null;
    }
}
/**
 * Copy a base stone actor multiple times into a folder
 */
async function copyStoneActor(baseActor, count, folderId, actorName) {
    console.log(`Mastery System | [COPY STONE ACTOR] ===== START Copying "${actorName}" ${count} times =====`);
    console.log(`Mastery System | [COPY STONE ACTOR] Parameters:`, {
        baseActorId: baseActor.id,
        baseActorName: baseActor.name,
        count: count,
        folderId: folderId,
        actorName: actorName
    });
    if (!baseActor) {
        console.error(`Mastery System | [COPY STONE ACTOR] Base actor not found`);
        return [];
    }
    if (!folderId) {
        console.error(`Mastery System | [COPY STONE ACTOR] No folder ID provided`);
        return [];
    }
    const actors = [];
    // Check for existing copies first
    // In Foundry VTT, game.actors is a Collection, not an array
    const actorsCollection = game.actors;
    const allActors = actorsCollection ? (Array.isArray(actorsCollection) ? actorsCollection : Array.from(actorsCollection.values())) : [];
    console.log(`Mastery System | [COPY STONE ACTOR] Total actors in game: ${allActors.length}`);
    // Also check folder by getting it directly from game.folders
    const folder = game.folders?.get(folderId);
    console.log(`Mastery System | [COPY STONE ACTOR] Folder lookup:`, {
        folderId: folderId,
        folderExists: !!folder,
        folderName: folder?.name,
        folderIdType: typeof folderId
    });
    // CRITICAL: Check if folder actually contains actors by querying the folder's contents
    // In Foundry VTT, folders have a `contents` property that lists all documents in the folder
    if (folder && folder.contents) {
        const folderContents = folder.contents;
        console.log(`Mastery System | [COPY STONE ACTOR] Folder contents (from folder.contents):`, {
            total: folderContents?.length || 0,
            actors: folderContents?.filter((c) => c?.documentName === 'Actor')?.length || 0
        });
    }
    // Debug: Log all actors in the folder to see what we're working with
    // CRITICAL: actor.folder can be either a string ID or a Folder object
    const actorsInFolder = allActors.filter((a) => {
        const aFolderRaw = a.folder;
        const aFolderId = typeof aFolderRaw === 'string' ? aFolderRaw : (aFolderRaw?.id || null);
        const matches = aFolderId === folderId;
        if (matches) {
            console.log(`Mastery System | [COPY STONE ACTOR] Found actor in folder:`, {
                id: a.id,
                name: a.name,
                folderRaw: aFolderRaw,
                folderId: aFolderId,
                expectedFolderId: folderId,
                folderMatch: aFolderId === folderId,
                folderRawType: typeof aFolderRaw,
                folderIdType: typeof folderId
            });
        }
        return matches;
    });
    console.log(`Mastery System | [COPY STONE ACTOR] Total actors in folder ${folderId}: ${actorsInFolder.length}`);
    if (actorsInFolder.length > 0) {
        console.log(`Mastery System | [COPY STONE ACTOR] Actors in folder:`, actorsInFolder.map((a) => ({
            id: a.id,
            name: a.name,
            folder: a.folder,
            type: a.type
        })));
    }
    else {
        console.warn(`Mastery System | [COPY STONE ACTOR] WARNING: No actors found in folder ${folderId}!`);
        console.warn(`Mastery System | [COPY STONE ACTOR] This might mean actors were created in a different folder or the folder ID is wrong.`);
    }
    // CRITICAL: actor.folder can be either a string ID or a Folder object
    const existingActors = allActors.filter((a) => {
        const aFolderRaw = a.folder;
        const aFolderId = typeof aFolderRaw === 'string' ? aFolderRaw : (aFolderRaw?.id || null);
        const aName = a.name || '';
        const matches = aFolderId === folderId && aName.startsWith(actorName);
        if (matches) {
            console.log(`Mastery System | [COPY STONE ACTOR] Found existing actor:`, {
                id: a.id,
                name: aName,
                folderRaw: aFolderRaw,
                folderId: aFolderId,
                expectedFolderId: folderId,
                folderMatch: aFolderId === folderId,
                nameMatch: aName.startsWith(actorName),
                actorName: actorName
            });
        }
        else if (aFolderId === folderId) {
            // Log actors in the folder that don't match to help debug
            console.log(`Mastery System | [COPY STONE ACTOR] Actor in folder but doesn't match:`, {
                id: a.id,
                name: aName,
                folderRaw: aFolderRaw,
                folderId: aFolderId,
                expectedFolderId: folderId,
                startsWith: aName.startsWith(actorName),
                actorName: actorName
            });
        }
        return matches;
    });
    console.log(`Mastery System | [COPY STONE ACTOR] Found ${existingActors.length} existing copies in folder ${folderId}`);
    console.log(`Mastery System | [COPY STONE ACTOR] Required count: ${count}, Existing count: ${existingActors.length}`);
    console.log(`Mastery System | [COPY STONE ACTOR] Comparison: ${existingActors.length} >= ${count} = ${existingActors.length >= count}`);
    // If we already have enough or more actors, just return the first 'count' ones
    if (existingActors.length >= count) {
        console.log(`Mastery System | [COPY STONE ACTOR] ===== SKIPPING CREATION - ENOUGH ACTORS EXIST =====`);
        console.log(`Mastery System | [COPY STONE ACTOR] Already have ${existingActors.length} actors, which is >= ${count} required. Reusing first ${count}.`);
        for (let i = 0; i < count; i++) {
            console.log(`Mastery System | [COPY STONE ACTOR] Reusing existing copy ${i + 1}/${count}: ${existingActors[i].name} (${existingActors[i].id})`);
            actors.push(existingActors[i]);
        }
        console.log(`Mastery System | [COPY STONE ACTOR] Final result: ${actors.length}/${count} actors (all reused, 0 created)`);
        console.log(`Mastery System | [COPY STONE ACTOR] ===== COMPLETED (no new actors needed) =====`);
        return actors.slice(0, count);
    }
    // Reuse existing copies
    for (let i = 0; i < existingActors.length; i++) {
        console.log(`Mastery System | [COPY STONE ACTOR] Reusing existing copy ${i + 1}: ${existingActors[i].name} (${existingActors[i].id})`);
        actors.push(existingActors[i]);
    }
    // Create missing copies
    const copiesToCreate = count - actors.length;
    console.log(`Mastery System | [COPY STONE ACTOR] Need to create ${copiesToCreate} new copies`);
    if (copiesToCreate > 0) {
        console.log(`Mastery System | [COPY STONE ACTOR] Creating ${copiesToCreate} new copies`);
        // Get base actor data
        console.log(`Mastery System | [COPY STONE ACTOR] Getting base actor data...`);
        const baseData = baseActor.toObject();
        console.log(`Mastery System | [COPY STONE ACTOR] Base actor data keys:`, Object.keys(baseData));
        for (let i = actors.length; i < count; i++) {
            const copyName = `${actorName} ${i + 1}`;
            console.log(`Mastery System | [COPY STONE ACTOR] Creating copy ${i + 1}/${count}: ${copyName}`);
            // Create copy data
            const copyData = (foundry.utils?.duplicate || ((obj) => JSON.parse(JSON.stringify(obj))))(baseData);
            copyData.name = copyName;
            // CRITICAL: folder must be a string ID, not an object
            // Ensure folderId is a string, not null/undefined
            copyData.folder = folderId || null;
            // Remove ID so a new one is generated
            delete copyData._id;
            console.log(`Mastery System | [COPY STONE ACTOR] Copy data:`, {
                name: copyData.name,
                folder: copyData.folder,
                folderType: typeof copyData.folder,
                folderId: folderId,
                folderIdType: typeof folderId,
                hasId: !!copyData._id,
                type: copyData.type
            });
            try {
                console.log(`Mastery System | [COPY STONE ACTOR] Calling Actor.create...`);
                const copiedActor = await Actor.create(copyData);
                console.log(`Mastery System | [COPY STONE ACTOR] Actor.create returned:`, {
                    id: copiedActor.id,
                    name: copiedActor.name,
                    folder: copiedActor.folder
                });
                console.log(`Mastery System | [COPY STONE ACTOR] Created copy ${i + 1}/${count}: ${copyName} (${copiedActor.id})`);
                actors.push(copiedActor);
                // IMPORTANT: After creating an actor, verify it's in the collection and has the correct folder
                // This helps debug why actors aren't found on subsequent runs
                const verifyActor = game.actors?.get(copiedActor.id);
                if (verifyActor) {
                    // In Foundry VTT, actor.folder can be either a string ID or a Folder object
                    // We need to handle both cases
                    const verifyFolderRaw = verifyActor.folder;
                    const verifyFolderId = typeof verifyFolderRaw === 'string' ? verifyFolderRaw : (verifyFolderRaw?.id || null);
                    console.log(`Mastery System | [COPY STONE ACTOR] Verified: Created actor is now in collection`, {
                        id: verifyActor.id,
                        name: verifyActor.name,
                        folderRaw: verifyFolderRaw,
                        folderId: verifyFolderId,
                        folderRawType: typeof verifyFolderRaw,
                        expectedFolder: folderId,
                        folderMatch: verifyFolderId === folderId
                    });
                    if (verifyFolderId !== folderId) {
                        console.error(`Mastery System | [COPY STONE ACTOR] ERROR: Actor folder mismatch! Expected ${folderId}, got ${verifyFolderId} (raw: ${verifyFolderRaw})`);
                    }
                }
                else {
                    console.warn(`Mastery System | [COPY STONE ACTOR] WARNING: Created actor not yet in collection (may need refresh)`);
                }
            }
            catch (error) {
                console.error(`Mastery System | [COPY STONE ACTOR] Failed to create copy ${i + 1}/${count}: ${copyName}`, error);
                console.error(`Mastery System | [COPY STONE ACTOR] Error details:`, {
                    message: error.message,
                    stack: error.stack,
                    error: error
                });
            }
        }
    }
    else {
        console.log(`Mastery System | [COPY STONE ACTOR] All ${count} copies already exist, reusing them`);
    }
    console.log(`Mastery System | [COPY STONE ACTOR] Final result: ${actors.length}/${count} actors (${actors.length - copiesToCreate} reused, ${copiesToCreate} created)`);
    console.log(`Mastery System | [COPY STONE ACTOR] ===== COMPLETED =====`);
    return actors.slice(0, count);
}
/**
 * Process a player actor: create stones folder and copy stone actors
 */
async function processPlayerActor(actor) {
    const actorName = actor.name || 'Unknown';
    const actorId = actor.id;
    console.log(`Mastery System | [PROCESS PLAYER] ===== START Processing actor: ${actorName} (${actorId}) =====`);
    // Check system.stones
    const system = actor.system || {};
    const stones = system.stones || {};
    console.log(`Mastery System | [PROCESS PLAYER] Actor system data:`, {
        hasSystem: !!system,
        hasStones: !!stones,
        stonesKeys: Object.keys(stones),
        fullStones: stones
    });
    const powerCount = Math.max(0, (stones.current !== undefined ? stones.current : stones.total || 0) - (stones.vitality || 0));
    const vitalityCount = stones.vitality || 0;
    console.log(`Mastery System | [PROCESS PLAYER] Stone counts for ${actorName}:`, {
        total: stones.total,
        current: stones.current,
        vitality: vitalityCount,
        power: powerCount,
        stonesData: stones,
        calculation: {
            totalOrCurrent: stones.current !== undefined ? stones.current : stones.total || 0,
            minusVitality: stones.vitality || 0,
            result: powerCount
        }
    });
    if (powerCount === 0 && vitalityCount === 0) {
        console.log(`Mastery System | [PROCESS PLAYER] No stones for ${actorName}, skipping`);
        return;
    }
    // Get actor's folder
    const actorFolder = getActorFolder(actor);
    console.log(`Mastery System | [PROCESS PLAYER] Actor folder:`, {
        hasFolder: !!actorFolder,
        folderId: actorFolder?.id,
        folderName: actorFolder?.name,
        actorFolderId: actor.folder
    });
    // Create stones folder
    console.log(`Mastery System | [PROCESS PLAYER] Creating stones folder...`);
    const stonesFolderId = await ensureStonesFolderForActor(actor);
    console.log(`Mastery System | [PROCESS PLAYER] Stones folder result:`, {
        folderId: stonesFolderId,
        success: !!stonesFolderId
    });
    if (!stonesFolderId) {
        console.error(`Mastery System | [PROCESS PLAYER] Failed to create stones folder for ${actorName}`);
        return;
    }
    // Get base stone actors from settings
    const basePowerStoneId = game.settings.get('mastery-system', 'divineClashBasePowerStoneActorId');
    const baseVitalityStoneId = game.settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
    console.log(`Mastery System | [PROCESS PLAYER] Base stone actor IDs:`, {
        powerStoneId: basePowerStoneId,
        vitalityStoneId: baseVitalityStoneId,
        hasPowerStone: !!basePowerStoneId && basePowerStoneId.trim() !== '',
        hasVitalityStone: !!baseVitalityStoneId && baseVitalityStoneId.trim() !== ''
    });
    // Copy power stones
    if (powerCount > 0) {
        console.log(`Mastery System | [PROCESS PLAYER] Processing ${powerCount} power stones...`);
        if (!basePowerStoneId || basePowerStoneId.trim() === '') {
            console.warn(`Mastery System | [PROCESS PLAYER] No base Power Stone actor configured, skipping power stones`);
        }
        else {
            const basePowerActor = game.actors?.get(basePowerStoneId);
            console.log(`Mastery System | [PROCESS PLAYER] Base Power Stone actor lookup:`, {
                actorId: basePowerStoneId,
                found: !!basePowerActor,
                actorName: basePowerActor?.name
            });
            if (!basePowerActor) {
                console.error(`Mastery System | [PROCESS PLAYER] Base Power Stone actor ${basePowerStoneId} not found`);
            }
            else {
                console.log(`Mastery System | [PROCESS PLAYER] Copying ${powerCount} power stones...`);
                const copiedActors = await copyStoneActor(basePowerActor, powerCount, stonesFolderId, `Power Stone`);
                console.log(`Mastery System | [PROCESS PLAYER] Power stones copied:`, {
                    requested: powerCount,
                    copied: copiedActors.length,
                    actorIds: copiedActors.map((a) => a.id)
                });
            }
        }
    }
    // Copy vitality stones
    if (vitalityCount > 0) {
        console.log(`Mastery System | [PROCESS PLAYER] Processing ${vitalityCount} vitality stones...`);
        if (!baseVitalityStoneId || baseVitalityStoneId.trim() === '') {
            console.warn(`Mastery System | [PROCESS PLAYER] No base Vitality Stone actor configured, skipping vitality stones`);
        }
        else {
            const baseVitalityActor = game.actors?.get(baseVitalityStoneId);
            console.log(`Mastery System | [PROCESS PLAYER] Base Vitality Stone actor lookup:`, {
                actorId: baseVitalityStoneId,
                found: !!baseVitalityActor,
                actorName: baseVitalityActor?.name
            });
            if (!baseVitalityActor) {
                console.error(`Mastery System | [PROCESS PLAYER] Base Vitality Stone actor ${baseVitalityStoneId} not found`);
            }
            else {
                console.log(`Mastery System | [PROCESS PLAYER] Copying ${vitalityCount} vitality stones...`);
                const copiedActors = await copyStoneActor(baseVitalityActor, vitalityCount, stonesFolderId, `Vitality Stone`);
                console.log(`Mastery System | [PROCESS PLAYER] Vitality stones copied:`, {
                    requested: vitalityCount,
                    copied: copiedActors.length,
                    actorIds: copiedActors.map((a) => a.id)
                });
            }
        }
    }
    console.log(`Mastery System | [PROCESS PLAYER] ===== COMPLETED Processing ${actorName} =====`);
}
export async function startDivineClash() {
    console.log('Mastery System | [DIVINE CLASH START] ===== NEW VERSION - ACTOR STRUCTURE ONLY =====');
    console.log('Mastery System | [DIVINE CLASH START] Beginning startDivineClash');
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start Divine Clash');
        return;
    }
    // Prevent multiple simultaneous calls
    if (isStartingDivineClash) {
        console.warn('Mastery System | [DIVINE CLASH START] Already in progress, ignoring duplicate call');
        return;
    }
    isStartingDivineClash = true;
    try {
        // Switch to Divine Clash scene first
        console.log(`Mastery System | [DIVINE CLASH START] ===== SCENE SWITCH START =====`);
        const sceneId = game.settings.get('mastery-system', 'divineClashSceneId');
        console.log(`Mastery System | [DIVINE CLASH START] Scene ID from settings:`, { sceneId, hasValue: !!sceneId, trimmed: sceneId?.trim() });
        let divineClashScene = null;
        // In Foundry VTT, game.scenes is a Collection, not an array
        const scenesCollection = game.scenes;
        const allScenes = scenesCollection ? (Array.isArray(scenesCollection) ? scenesCollection : Array.from(scenesCollection.values())) : [];
        console.log(`Mastery System | [DIVINE CLASH START] Total scenes available: ${allScenes.length}`);
        console.log(`Mastery System | [DIVINE CLASH START] Scene names:`, allScenes.map((s) => ({ id: s.id, name: s.name })));
        if (sceneId && sceneId.trim() !== '') {
            divineClashScene = game.scenes?.get(sceneId);
            console.log(`Mastery System | [DIVINE CLASH START] Looking for scene by ID: ${sceneId}`, {
                found: !!divineClashScene,
                sceneName: divineClashScene?.name,
                sceneId: divineClashScene?.id
            });
        }
        else {
            console.log(`Mastery System | [DIVINE CLASH START] No scene ID configured in settings`);
        }
        // Fallback: find by name
        if (!divineClashScene) {
            const scenes = Array.from(allScenes.values ? allScenes.values() : allScenes);
            console.log(`Mastery System | [DIVINE CLASH START] Searching ${scenes.length} scenes by name "Divine Clash"`);
            divineClashScene = scenes.find((s) => s.name === 'Divine Clash') || null;
            console.log(`Mastery System | [DIVINE CLASH START] Looking for scene by name "Divine Clash"`, {
                found: !!divineClashScene,
                sceneName: divineClashScene?.name,
                sceneId: divineClashScene?.id
            });
        }
        if (divineClashScene) {
            const currentScene = canvas?.scene;
            const currentSceneId = currentScene?.id;
            const targetSceneId = divineClashScene.id;
            console.log(`Mastery System | [DIVINE CLASH START] Found Divine Clash scene:`, {
                id: targetSceneId,
                name: divineClashScene.name,
                active: divineClashScene.active,
                currentSceneId: currentSceneId,
                currentSceneName: currentScene?.name
            });
            console.log(`Mastery System | [DIVINE CLASH START] Scene comparison:`, {
                currentSceneId: currentSceneId,
                targetSceneId: targetSceneId,
                areEqual: currentSceneId === targetSceneId,
                currentSceneName: currentScene?.name,
                targetSceneName: divineClashScene.name
            });
            if (currentSceneId === targetSceneId) {
                console.log(`Mastery System | [DIVINE CLASH START] Already on Divine Clash scene, no need to switch`);
            }
            else {
                console.log(`Mastery System | [DIVINE CLASH START] Switching to Divine Clash scene: ${divineClashScene.name} (${targetSceneId})`);
                console.log(`Mastery System | [DIVINE CLASH START] Current scene before switch: ${currentScene?.name} (${currentSceneId})`);
                try {
                    // Try multiple methods to switch scenes
                    console.log(`Mastery System | [DIVINE CLASH START] Attempting scene switch with multiple methods...`);
                    // Method 1: Try game.scenes.view() if available
                    if (game.scenes?.view) {
                        console.log(`Mastery System | [DIVINE CLASH START] Method 1: Using game.scenes.view()`);
                        try {
                            game.scenes.view(targetSceneId);
                            console.log(`Mastery System | [DIVINE CLASH START] game.scenes.view() called successfully`);
                        }
                        catch (viewError) {
                            console.warn(`Mastery System | [DIVINE CLASH START] game.scenes.view() failed:`, viewError);
                        }
                    }
                    // Method 2: Try ui.webrtc.viewScene() if available
                    if (ui.webrtc?.viewScene) {
                        console.log(`Mastery System | [DIVINE CLASH START] Method 2: Using ui.webrtc.viewScene()`);
                        try {
                            ui.webrtc.viewScene(targetSceneId);
                            console.log(`Mastery System | [DIVINE CLASH START] ui.webrtc.viewScene() called successfully`);
                        }
                        catch (webrtcError) {
                            console.warn(`Mastery System | [DIVINE CLASH START] ui.webrtc.viewScene() failed:`, webrtcError);
                        }
                    }
                    // Method 3: Try ui.nav if available (most reliable for scene navigation)
                    if (ui.nav) {
                        console.log(`Mastery System | [DIVINE CLASH START] Method 3: Using ui.nav`);
                        try {
                            ui.nav.activateScene(targetSceneId);
                            console.log(`Mastery System | [DIVINE CLASH START] ui.nav.activateScene() called successfully`);
                        }
                        catch (navError) {
                            console.warn(`Mastery System | [DIVINE CLASH START] ui.nav.activateScene() failed:`, navError);
                        }
                    }
                    // Method 4: Try scene.activate() as fallback
                    console.log(`Mastery System | [DIVINE CLASH START] Method 4: Using scene.activate()`);
                    try {
                        await divineClashScene.activate();
                        console.log(`Mastery System | [DIVINE CLASH START] scene.activate() completed`);
                    }
                    catch (activateError) {
                        console.warn(`Mastery System | [DIVINE CLASH START] scene.activate() failed:`, activateError);
                    }
                    // Wait for scene to actually switch - poll until it changes
                    let attempts = 0;
                    const maxAttempts = 30; // 3 seconds max wait
                    while (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        const newCurrentScene = canvas?.scene;
                        const newCurrentSceneId = newCurrentScene?.id;
                        if (newCurrentSceneId === targetSceneId) {
                            console.log(`Mastery System | [DIVINE CLASH START] ✓ Scene successfully switched after ${attempts * 100}ms`);
                            break;
                        }
                        attempts++;
                    }
                    const finalCurrentScene = canvas?.scene;
                    const finalCurrentSceneId = finalCurrentScene?.id;
                    console.log(`Mastery System | [DIVINE CLASH START] Final scene after activation:`, {
                        id: finalCurrentSceneId,
                        name: finalCurrentScene?.name,
                        targetId: targetSceneId,
                        matches: finalCurrentSceneId === targetSceneId,
                        switched: finalCurrentSceneId !== currentSceneId
                    });
                    if (finalCurrentSceneId !== targetSceneId) {
                        console.error(`Mastery System | [DIVINE CLASH START] ✗ ERROR: Scene did not switch after ${maxAttempts * 100}ms!`);
                        console.error(`Mastery System | [DIVINE CLASH START] Expected: ${targetSceneId} (${divineClashScene.name})`);
                        console.error(`Mastery System | [DIVINE CLASH START] Got: ${finalCurrentSceneId} (${finalCurrentScene?.name})`);
                        console.error(`Mastery System | [DIVINE CLASH START] This is a critical error - scene switching failed`);
                        console.error(`Mastery System | [DIVINE CLASH START] Available methods:`, {
                            hasGameScenesView: !!game.scenes?.view,
                            hasWebrtcViewScene: !!ui.webrtc?.viewScene,
                            hasSceneActivate: typeof divineClashScene.activate === 'function'
                        });
                    }
                }
                catch (error) {
                    console.error(`Mastery System | [DIVINE CLASH START] Failed to activate scene:`, error);
                    console.error(`Mastery System | [DIVINE CLASH START] Error details:`, {
                        message: error.message,
                        stack: error.stack
                    });
                }
            }
        }
        else {
            console.warn(`Mastery System | [DIVINE CLASH START] Divine Clash scene not found. Continuing anyway.`);
            console.warn(`Mastery System | [DIVINE CLASH START] Available scenes:`, Array.from(allScenes.values ? allScenes.values() : allScenes).map((s) => s.name));
        }
        console.log(`Mastery System | [DIVINE CLASH START] ===== SCENE SWITCH END =====`);
        const controlled = canvas?.tokens?.controlled || [];
        console.log('Mastery System | [DIVINE CLASH START] Controlled tokens:', controlled.length);
        if (controlled.length === 0) {
            ui.notifications?.warn('Please select at least one character token to start Divine Clash');
            return;
        }
        // Identify player actors (character type)
        const playerActors = [];
        for (const token of controlled) {
            if (!token.actor) {
                console.log('Mastery System | [DIVINE CLASH START] Token has no actor, skipping:', token.id);
                continue;
            }
            if (token.actor.type === 'character') {
                playerActors.push(token.actor);
                console.log('Mastery System | [DIVINE CLASH START] Added player actor:', {
                    id: token.actor.id,
                    name: token.actor.name
                });
            }
        }
        if (playerActors.length === 0) {
            ui.notifications?.warn('Please select at least one character token');
            return;
        }
        console.log(`Mastery System | [DIVINE CLASH START] Processing ${playerActors.length} player actor(s)`);
        console.log('Mastery System | [DIVINE CLASH START] NO TOKENS WILL BE CREATED - ONLY ACTOR STRUCTURE');
        // Process each player actor
        for (const actor of playerActors) {
            console.log(`Mastery System | [DIVINE CLASH START] Calling processPlayerActor for: ${actor.name}`);
            await processPlayerActor(actor);
        }
        ui.notifications?.info(`Divine Clash: Created stone actors for ${playerActors.length} player(s)`);
        console.log('Mastery System | [DIVINE CLASH START] ===== COMPLETED - NO TOKENS CREATED =====');
    }
    finally {
        isStartingDivineClash = false;
    }
}
/**
 * REVEAL: Reveal attack/defense and move stones to exhausted
 */
export async function revealDivineClash() {
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
    const summary = [];
    // Process each seat
    for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
        const seatIndex = parseInt(seatIndexStr);
        const actor = seat.actorId ? game.actors?.get(seat.actorId) : null;
        const actorName = actor?.name || `Seat ${seatIndex}`;
        // Find all stone tokens for this seat
        const tokens = scene.tokens || [];
        const seatTokens = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
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
                                    ...(token.getFlag('mastery-system', 'divineClash') || {}),
                                    state: 'exhausted'
                                }
                            }
                        }
                    });
                    exhausted++;
                }
            }
            else if (zone === 'defense') {
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
                                    ...(token.getFlag('mastery-system', 'divineClash') || {}),
                                    state: 'exhausted'
                                }
                            }
                        }
                    });
                    exhausted++;
                }
            }
            else if (zone === 'ready') {
                ready++;
            }
            else if (zone === 'exhausted') {
                exhausted++;
            }
        }
        // Count vitality stones
        const vitalityTokens = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
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
export async function endRoundDivineClash() {
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
    const regenMessages = [];
    // Process each seat
    for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
        const seatIndex = parseInt(seatIndexStr);
        const actor = seat.actorId ? game.actors?.get(seat.actorId) : null;
        if (!actor)
            continue;
        // Get Mastery Rank
        const system = actor.system || {};
        const masteryRank = system.mastery?.rank || 2;
        const regen = Math.max(1, masteryRank);
        // Find exhausted power stones for this seat
        const tokens = scene.tokens || [];
        const exhaustedStones = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
            return tokenFlags?.isStone &&
                tokenFlags.seatIndex === seatIndex &&
                tokenFlags.stoneKind === 'power' &&
                tokenFlags.state === 'exhausted' &&
                token.document?.locked;
        });
        // Move up to regen stones to ready
        const readyRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
        if (!readyRegion)
            continue;
        let moved = 0;
        for (let i = 0; i < Math.min(regen, exhaustedStones.length); i++) {
            const token = exhaustedStones[i];
            const pos = getRandomPointInRegion(readyRegion);
            await token.document.update({
                x: pos.x,
                y: pos.y,
                locked: false,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            ...(token.document?.getFlag('mastery-system', 'divineClash') || {}),
                            state: 'ready'
                        }
                    }
                }
            });
            moved++;
        }
        if (moved > 0) {
            regenMessages.push(`${actor.name}: +${moved} Ready`);
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
 * Cleanup player's Divine Clash folder and actors
 */
async function cleanupPlayerStoneFolder(user) {
    const folderName = `Divine Clash - ${user.name}`;
    const folder = game.folders?.find((f) => f.name === folderName && f.type === 'Actor');
    if (!folder) {
        console.log(`Mastery System | [CLEANUP FOLDER] No folder found for ${user.name}`);
        return;
    }
    // Find all actors in this folder
    const actorsInFolder = game.actors?.filter((a) => {
        const aFolder = a.folder;
        return aFolder === folder.id;
    }) || [];
    console.log(`Mastery System | [CLEANUP FOLDER] Found ${actorsInFolder.length} actors in folder "${folderName}"`);
    // Delete all actors in folder
    if (actorsInFolder.length > 0) {
        const actorIds = actorsInFolder.map((a) => a.id);
        await Actor.deleteDocuments(actorIds);
        console.log(`Mastery System | [CLEANUP FOLDER] Deleted ${actorIds.length} actors from folder`);
    }
    // Delete folder
    await folder.delete();
    console.log(`Mastery System | [CLEANUP FOLDER] Deleted folder "${folderName}"`);
}
/**
 * RESET: Cleanup all Divine Clash tokens, actors, and folders
 */
export async function resetDivineClash() {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can reset Divine Clash');
        return;
    }
    const scene = canvas?.scene;
    if (!scene) {
        ui.notifications?.warn('No active scene');
        return;
    }
    const cleanupAvatars = game.settings.get('mastery-system', 'divineClashCleanupAvatars');
    // Find all Divine Clash tokens
    const tokens = scene.tokens || [];
    const tokensToDelete = [];
    const userIds = new Set();
    for (const token of tokens) {
        const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
        if (tokenFlags?.isStone) {
            tokensToDelete.push(token.id);
            // Collect user IDs for folder cleanup
            if (tokenFlags.seatUserId) {
                userIds.add(tokenFlags.seatUserId);
            }
        }
        else if (tokenFlags?.isAvatar && cleanupAvatars) {
            tokensToDelete.push(token.id);
        }
    }
    if (tokensToDelete.length > 0) {
        await scene.deleteEmbeddedDocuments('Token', tokensToDelete);
        console.log(`Mastery System | [RESET] Deleted ${tokensToDelete.length} token(s)`);
    }
    // Cleanup folders and actors for each user
    for (const userId of userIds) {
        const user = game.users?.get(userId);
        if (user) {
            await cleanupPlayerStoneFolder(user);
        }
    }
    // Clear scene flags
    await scene.unsetFlag('mastery-system', 'divineClash');
    ui.notifications?.info(`Divine Clash reset. Removed ${tokensToDelete.length} token(s) and cleaned up folders.`);
}
/**
 * Get current phase
 */
export function getDivineClashPhase() {
    const scene = canvas?.scene;
    if (!scene)
        return null;
    const flags = getSceneFlags(scene);
    return flags.phase;
}
/**
 * Check if current scene is Divine Clash scene
 */
export function isDivineClashScene() {
    const scene = canvas?.scene;
    if (!scene)
        return false;
    const flags = getSceneFlags(scene);
    return flags.started;
}
//# sourceMappingURL=divine-clash.js.map