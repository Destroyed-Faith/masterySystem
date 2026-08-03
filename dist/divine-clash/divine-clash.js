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
    // In Foundry V13, regions are placeables on the canvas
    let regions = [];
    // Try canvas.regions.placeables first (V13 API)
    if (canvas?.regions?.placeables) {
        regions = Array.from(canvas.regions.placeables.values());
    }
    else {
        // Fallback: try scene.regions collection
        if (scene.regions) {
            if (scene.regions instanceof Map || scene.regions.size !== undefined) {
                regions = Array.from(scene.regions.values());
            }
            else if (Array.isArray(scene.regions)) {
                regions = scene.regions;
            }
        }
    }
    if (regions.length === 0) {
        console.warn(`Mastery System | [FIND REGION] No regions found in any expected location`);
        return null;
    }
    for (const region of regions) {
        // In V13, region name is in region.document.name
        const regionName = region.document?.name || region.name || region.document?.label || region.label || region.document?.id || region.id || '';
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
            }
            // Try region.document.shape
            else if (region.document?.shape) {
                const shape = region.document.shape;
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
                else if (shape.center) {
                    x = shape.center.x - (shape.radius || 50);
                    y = shape.center.y - (shape.radius || 50);
                    width = (shape.radius || 50) * 2;
                    height = (shape.radius || 50) * 2;
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
            }
            const result = {
                id: region.document?.id || region.id || region._id || '',
                name: regionName,
                x,
                y,
                width,
                height
            };
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
    // Check if folder already exists
    const allFolders = game.folders || [];
    const existingFolder = allFolders.find((f) => {
        const matches = f.name === folderName && f.type === 'Actor';
        return matches;
    });
    if (existingFolder) {
        return existingFolder.id;
    }
    // Create new folder
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
        const folder = await Folder.create(folderData);
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
        ? 'systems/mastery-system/assets/icons/stones/power-stone.svg'
        : 'systems/mastery-system/assets/icons/stones/vitality-stone.svg';
    const stoneImg = (settingsImg && settingsImg.trim() !== '') ? settingsImg : defaultImg;
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
    const actors = [];
    // Reuse existing actors first
    for (let i = 0; i < Math.min(existingActors.length, count); i++) {
        const existingActor = existingActors[i];
        actors.push(existingActor);
    }
    // Create missing actors
    const actorsToCreate = count - actors.length;
    if (actorsToCreate > 0) {
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
                actors.push(actor);
            }
            catch (error) {
                console.error(`Mastery System | [CREATE STONE ACTORS] Failed to create actor ${i + 1}/${count}: ${actorName}`, error);
            }
        }
    }
    else {
    }
    // If we have more existing actors than needed, log a warning but use what we have
    if (existingActors.length > count) {
        console.warn(`Mastery System | [CREATE STONE ACTORS] Found ${existingActors.length} existing ${kindName} stone actors but only need ${count}. Using first ${count}.`);
    }
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
    // Strategy 0: Check for configured base stone actor (global basisstein)
    const baseActorId = kind === 'power'
        ? game.settings.get('mastery-system', 'divineClashBasePowerStoneActorId')
        : game.settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
    if (baseActorId && baseActorId.trim() !== '') {
        const baseActor = game.actors?.get(baseActorId);
        if (baseActor) {
            // Ensure user has OWNER permission (so they can move their stone tokens)
            const currentOwnership = baseActor.ownership || {};
            const userPermission = currentOwnership[user.id] || CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
            if (userPermission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                const newOwnership = { ...currentOwnership, [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
                await baseActor.update({ ownership: newOwnership });
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
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await stoneActors[0].update({ ownership });
        return stoneActors[0];
    }
    // Strategy 4: Create new actor if none found
    const actorData = {
        name: actorName,
        type: 'npc',
        ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        img: kind === 'power'
            ? (game.settings.get('mastery-system', 'divineClashPowerStoneImg') || 'systems/mastery-system/assets/icons/stones/power-stone.svg')
            : (game.settings.get('mastery-system', 'divineClashVitalityStoneImg') || 'systems/mastery-system/assets/icons/stones/vitality-stone.svg')
    };
    try {
        const actor = await Actor.create(actorData);
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
        }
    }
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
    const seatRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
    if (!seatRegion) {
        console.error(`Mastery System | [SPAWN STONES] Seat ${seatIndex} READY region not found - cannot spawn stones`);
        return;
    }
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
            try {
                const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                const createdToken = created[0];
                if (createdToken) {
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
    }
    else {
    }
    // Spawn vitality stones
    if (vitalityStoneCount > 0 && user && folderId) {
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
            try {
                const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                const createdToken = created[0];
                if (createdToken) {
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
    }
    else {
    }
}
/**
 * Spawn avatar token for a seat
 * @deprecated Not used in new implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _spawnAvatarForSeat(scene, seatIndex, actor) {
    // Find avatar position (use READY region center as fallback)
    const regionName = getRegionName(seatIndex, 'READY');
    const seatRegion = findRegion(scene, regionName);
    if (!seatRegion) {
        console.warn(`Mastery System | [SPAWN AVATAR] Seat ${seatIndex} region "${regionName}" not found for avatar`);
        return;
    }
    const pos = {
        x: seatRegion.x + seatRegion.width / 2,
        y: seatRegion.y + seatRegion.height / 2
    };
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
    try {
        const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
        // Wait a moment for token to render
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify token is visible on canvas
        const canvasToken = canvas?.tokens?.placeables.find((t) => t.id === created[0].id);
        if (canvasToken) {
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
    // Use system.stones if available (new system)
    if (stones.total !== undefined && stones.vitality !== undefined) {
        // Power stones = total - vitality (or current - vitality if current is set)
        const totalStones = stones.current !== undefined ? stones.current : stones.total;
        const vitality = stones.vitality || 0;
        const powerStones = Math.max(0, totalStones - vitality);
        return powerStones;
    }
    // Fallback to old stonePools system for backwards compatibility
    const stonePools = system.stonePools || {};
    let total = 0;
    for (const [key, pool] of Object.entries(stonePools)) {
        if (key === 'vitality') {
            continue;
        }
        const poolData = pool;
        const current = poolData.current || 0;
        total += current;
    }
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
        return flagValue;
    }
    const system = actor.system || {};
    const stones = system.stones || {};
    // Use system.stones if available (new system)
    if (stones.vitality !== undefined) {
        const vitality = stones.vitality || 0;
        return vitality;
    }
    // Fallback to old stonePools system for backwards compatibility
    const stonePools = system.stonePools || {};
    const vitalityPool = stonePools.vitality || {};
    const fallback = vitalityPool.max || 10;
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
    // Get the actor's current folder
    const actorFolder = getActorFolder(actor);
    const parentFolderId = actorFolder ? actorFolder.id : null;
    // Check if folder already exists
    // In Foundry VTT, game.folders is a Collection, not an array
    const foldersCollection = game.folders;
    const allFolders = foldersCollection ? (Array.isArray(foldersCollection) ? foldersCollection : Array.from(foldersCollection.values())) : [];
    const existingFolder = allFolders.find((f) => {
        const matches = f.name === folderName &&
            f.type === 'Actor' &&
            f.folder === parentFolderId;
        return matches;
    });
    if (existingFolder) {
        return existingFolder.id;
    }
    // Create new folder
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
        const folder = await Folder.create(folderData);
        return folder.id;
    }
    catch (error) {
        console.error(`Mastery System | [ENSURE STONES FOLDER] Failed to create folder: ${folderName}`, error);
        console.error(`Mastery System | [ENSURE STONES FOLDER] Error details:`, {
            message: error.message,
            stack: error.stack,
            error: error
        });
        return null;
    }
}
/**
 * Copy a base stone actor multiple times into a folder
 * The image is taken from settings, not from the base actor (to avoid placeholder images)
 */
async function copyStoneActor(baseActor, count, folderId, actorName) {
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
    // Also check folder by getting it directly from game.folders
    const folder = game.folders?.get(folderId);
    // CRITICAL: Check if folder actually contains actors by querying the folder's contents
    // In Foundry VTT, folders have a `contents` property that lists all documents in the folder
    if (folder && folder.contents) {
        const folderContents = folder.contents;
    }
    // Debug: Log all actors in the folder to see what we're working with
    // CRITICAL: actor.folder can be either a string ID or a Folder object
    const actorsInFolder = allActors.filter((a) => {
        const aFolderRaw = a.folder;
        const aFolderId = typeof aFolderRaw === 'string' ? aFolderRaw : (aFolderRaw?.id || null);
        const matches = aFolderId === folderId;
        return matches;
    });
    if (actorsInFolder.length > 0) {
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
        return matches;
    });
    // If we already have enough or more actors, just return the first 'count' ones
    if (existingActors.length >= count) {
        for (let i = 0; i < count; i++) {
            actors.push(existingActors[i]);
        }
        return actors.slice(0, count);
    }
    // Reuse existing copies
    for (let i = 0; i < existingActors.length; i++) {
        actors.push(existingActors[i]);
    }
    // Create missing copies
    const copiesToCreate = count - actors.length;
    if (copiesToCreate > 0) {
        // Get base actor data
        const baseData = baseActor.toObject();
        for (let i = actors.length; i < count; i++) {
            const copyName = `${actorName} ${i + 1}`;
            // Create copy data
            const copyData = (foundry.utils?.duplicate || ((obj) => JSON.parse(JSON.stringify(obj))))(baseData);
            copyData.name = copyName;
            // CRITICAL: folder must be a string ID, not an object
            // Ensure folderId is a string, not null/undefined
            copyData.folder = folderId || null;
            // Remove ID so a new one is generated
            delete copyData._id;
            // CRITICAL: Override image from settings (not from base actor) to avoid placeholder images
            // Determine stone kind from actor name or flags
            const isPowerStone = actorName.toLowerCase().includes('power');
            const settingsImg = isPowerStone
                ? game.settings.get('mastery-system', 'divineClashPowerStoneImg')
                : game.settings.get('mastery-system', 'divineClashVitalityStoneImg');
            const defaultImg = isPowerStone
                ? 'systems/mastery-system/assets/icons/stones/power-stone.svg'
                : 'systems/mastery-system/assets/icons/stones/vitality-stone.svg';
            const finalImg = (settingsImg && settingsImg.trim() !== '') ? settingsImg : defaultImg;
            copyData.img = finalImg;
            try {
                const copiedActor = await Actor.create(copyData);
                actors.push(copiedActor);
                // IMPORTANT: After creating an actor, verify it's in the collection and has the correct folder
                // This helps debug why actors aren't found on subsequent runs
                const verifyActor = game.actors?.get(copiedActor.id);
                if (verifyActor) {
                    // In Foundry VTT, actor.folder can be either a string ID or a Folder object
                    // We need to handle both cases
                    const verifyFolderRaw = verifyActor.folder;
                    const verifyFolderId = typeof verifyFolderRaw === 'string' ? verifyFolderRaw : (verifyFolderRaw?.id || null);
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
    }
    return actors.slice(0, count);
}
/**
 * Spawn tokens for a player on the Divine Clash scene
 * Layout: Vitality Stone to the right, Power Stones in a row in front
 * Uses existing player token position as anchor
 */
async function spawnTokensForPlayer(scene, playerToken, // The selected token on the scene
playerActor, stoneActors, playerIndex) {
    const playerName = playerActor.name || 'Unknown';
    // Use existing token position as anchor
    const baseX = playerToken.x || (playerToken.document?.x || 0);
    const baseY = playerToken.y || (playerToken.document?.y || 0);
    const gridSize = scene.grid?.size || 100;
    // Add flags to existing player token if needed
    const tokenFlags = playerToken.document?.getFlag('mastery-system', 'divineClash');
    if (!tokenFlags?.isPlayer) {
        await playerToken.document?.setFlag('mastery-system', 'divineClash', {
            isPlayer: true,
            playerIndex: playerIndex
        });
    }
    // 2. Place vitality stone token to the right of player
    if (stoneActors.vitalityStoneActors.length > 0) {
        const vitalityActor = stoneActors.vitalityStoneActors[0];
        const vitalityActorImg = vitalityActor.img || vitalityActor.prototypeToken?.texture?.src || '';
        const vitalityX = baseX + gridSize * 1.5; // 1.5 grid units to the right
        const vitalityY = baseY;
        const vitalityTokenData = {
            name: vitalityActor.name,
            actorId: vitalityActor.id,
            x: vitalityX,
            y: vitalityY,
            actorLink: true,
            texture: {
                src: vitalityActorImg
            },
            disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            flags: {
                'mastery-system': {
                    divineClash: {
                        isStone: true,
                        stoneKind: 'vitality',
                        playerIndex: playerIndex
                    }
                }
            }
        };
        try {
            const vitalityTokens = await scene.createEmbeddedDocuments('Token', [vitalityTokenData]);
        }
        catch (error) {
            console.error(`Mastery System | [SPAWN TOKENS] Failed to create vitality stone token:`, error);
        }
    }
    // 3. Place power stone tokens in a row in front of player
    if (stoneActors.powerStoneActors.length > 0) {
        const powerStoneCount = stoneActors.powerStoneActors.length;
        const powerStoneSpacing = gridSize * 1.2; // 1.2 grid units between power stones
        const totalWidth = (powerStoneCount - 1) * powerStoneSpacing;
        const startPowerX = baseX - totalWidth / 2;
        const powerY = baseY - gridSize * 2; // 2 grid units in front of player
        const powerStoneTokens = [];
        for (let i = 0; i < stoneActors.powerStoneActors.length; i++) {
            const powerActor = stoneActors.powerStoneActors[i];
            const powerActorImg = powerActor.img || powerActor.prototypeToken?.texture?.src || '';
            const powerX = startPowerX + (i * powerStoneSpacing);
            const powerTokenData = {
                name: powerActor.name,
                actorId: powerActor.id,
                x: powerX,
                y: powerY,
                actorLink: true,
                texture: {
                    src: powerActorImg
                },
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            isStone: true,
                            stoneKind: 'power',
                            playerIndex: playerIndex,
                            stoneIndex: i
                        }
                    }
                }
            };
            powerStoneTokens.push(powerTokenData);
        }
        try {
            const createdPowerTokens = await scene.createEmbeddedDocuments('Token', powerStoneTokens);
        }
        catch (error) {
            console.error(`Mastery System | [SPAWN TOKENS] Failed to create power stone tokens:`, error);
        }
    }
    // 4. Create drawing rectangles around stones
    await createStoneAreaDrawings(scene, baseX, baseY, gridSize, stoneActors, playerIndex);
}
/**
 * Create drawing rectangles around Power Stones and Vitality Stone
 */
async function createStoneAreaDrawings(scene, baseX, baseY, gridSize, stoneActors, playerIndex) {
    try {
        const drawings = [];
        const tokenSize = gridSize * 0.8; // Approximate token size
        const padding = gridSize * 0.3; // Padding around tokens
        // 1. Create rectangle around Power Stones (if any)
        if (stoneActors.powerStoneActors.length > 0) {
            const powerStoneCount = stoneActors.powerStoneActors.length;
            const powerStoneSpacing = gridSize * 1.2;
            const totalWidth = (powerStoneCount - 1) * powerStoneSpacing;
            const startPowerX = baseX - totalWidth / 2;
            const powerY = baseY - gridSize * 2;
            // Rectangle dimensions
            const powerRectX = startPowerX - padding;
            const powerRectY = powerY - padding;
            const powerRectWidth = totalWidth + tokenSize + (padding * 2);
            const powerRectHeight = tokenSize + (padding * 2);
            drawings.push({
                type: 'r', // Rectangle
                x: powerRectX,
                y: powerRectY,
                width: powerRectWidth,
                height: powerRectHeight,
                rotation: 0,
                z: 100, // Below tokens
                fillType: 1, // Solid fill (required for validation)
                fillColor: '#00ff00', // Green for Power Stones
                fillAlpha: 0.1, // Very transparent fill
                strokeWidth: 4, // Increased width to ensure visibility
                strokeColor: '#00ff00', // Green for Power Stones
                strokeAlpha: 1.0, // Fully visible
                text: '',
                fontFamily: 'Signika',
                fontSize: 16,
                textColor: '#ffffff',
                textAlpha: 0, // No text
                hidden: false,
                locked: false,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            isStoneArea: true,
                            stoneKind: 'power',
                            playerIndex: playerIndex
                        }
                    }
                }
            });
        }
        // 2. Create rectangle around Vitality Stone (if any)
        if (stoneActors.vitalityStoneActors.length > 0) {
            const vitalityX = baseX + gridSize * 1.5;
            const vitalityY = baseY;
            // Rectangle dimensions
            const vitalityRectX = vitalityX - padding;
            const vitalityRectY = vitalityY - padding;
            const vitalityRectWidth = tokenSize + (padding * 2);
            const vitalityRectHeight = tokenSize + (padding * 2);
            drawings.push({
                type: 'r', // Rectangle
                x: vitalityRectX,
                y: vitalityRectY,
                width: vitalityRectWidth,
                height: vitalityRectHeight,
                rotation: 0,
                z: 100, // Below tokens
                fillType: 1, // Solid fill (required for validation)
                fillColor: '#ff0000', // Red for Vitality Stone
                fillAlpha: 0.1, // Very transparent fill
                strokeWidth: 4, // Increased width to ensure visibility
                strokeColor: '#ff0000', // Red for Vitality Stone
                strokeAlpha: 1.0, // Fully visible
                text: '',
                fontFamily: 'Signika',
                fontSize: 16,
                textColor: '#ffffff',
                textAlpha: 0, // No text
                hidden: false,
                locked: false,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            isStoneArea: true,
                            stoneKind: 'vitality',
                            playerIndex: playerIndex
                        }
                    }
                }
            });
        }
        if (drawings.length > 0) {
            const createdDrawings = await scene.createEmbeddedDocuments('Drawing', drawings);
        }
    }
    catch (error) {
        console.error(`Mastery System | [STONE AREAS] Failed to create stone area drawings:`, error);
    }
}
/**
 * Process a player actor: create stones folder and copy stone actors
 * Returns the created stone actors for token placement
 */
async function processPlayerActor(actor) {
    const actorName = actor.name || 'Unknown';
    const actorId = actor.id;
    // Check system.stones
    const system = actor.system || {};
    const stones = system.stones || {};
    const powerCount = Math.max(0, (stones.current !== undefined ? stones.current : stones.total || 0) - (stones.vitality || 0));
    const vitalityCount = stones.vitality || 0;
    if (powerCount === 0 && vitalityCount === 0) {
        return null;
    }
    // Get actor's folder
    const actorFolder = getActorFolder(actor);
    // Create stones folder
    const stonesFolderId = await ensureStonesFolderForActor(actor);
    if (!stonesFolderId) {
        console.error(`Mastery System | [PROCESS PLAYER] Failed to create stones folder for ${actorName}`);
        return null;
    }
    // Get base stone actors from settings
    const basePowerStoneId = game.settings.get('mastery-system', 'divineClashBasePowerStoneActorId');
    const baseVitalityStoneId = game.settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
    // Copy power stones
    let powerStoneActors = [];
    if (powerCount > 0) {
        if (!basePowerStoneId || basePowerStoneId.trim() === '') {
            console.warn(`Mastery System | [PROCESS PLAYER] No base Power Stone actor configured, skipping power stones`);
        }
        else {
            const basePowerActor = game.actors?.get(basePowerStoneId);
            if (!basePowerActor) {
                console.error(`Mastery System | [PROCESS PLAYER] Base Power Stone actor ${basePowerStoneId} not found`);
            }
            else {
                powerStoneActors = await copyStoneActor(basePowerActor, powerCount, stonesFolderId, `Power Stone`);
            }
        }
    }
    // Copy vitality stones
    let vitalityStoneActors = [];
    if (vitalityCount > 0) {
        if (!baseVitalityStoneId || baseVitalityStoneId.trim() === '') {
            console.warn(`Mastery System | [PROCESS PLAYER] No base Vitality Stone actor configured, skipping vitality stones`);
        }
        else {
            const baseVitalityActor = game.actors?.get(baseVitalityStoneId);
            if (!baseVitalityActor) {
                console.error(`Mastery System | [PROCESS PLAYER] Base Vitality Stone actor ${baseVitalityStoneId} not found`);
            }
            else {
                vitalityStoneActors = await copyStoneActor(baseVitalityActor, vitalityCount, stonesFolderId, `Vitality Stone`);
            }
        }
    }
    // Return the created stone actors for token placement
    return {
        playerActor: actor,
        powerStoneActors: powerStoneActors,
        vitalityStoneActors: vitalityStoneActors
    };
}
export async function startDivineClash() {
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
        // Use current scene (no scene switching - user must be on Divine Clash scene already)
        const currentScene = canvas?.scene;
        if (!currentScene) {
            ui.notifications?.warn('No active scene. Please switch to the Divine Clash scene first.');
            return;
        }
        // Get selected tokens (user must select tokens on the scene)
        const selectedTokens = canvas?.tokens?.controlled || [];
        if (selectedTokens.length === 0) {
            ui.notifications?.warn('Please select at least one character token to start Divine Clash.');
            return;
        }
        // Filter to only character tokens
        const characterTokens = [];
        const playerActors = [];
        for (const token of selectedTokens) {
            const actor = token.actor || (token.document?.actor ? token.document.actor : null);
            if (actor && actor.type === 'character') {
                characterTokens.push(token);
                // Avoid duplicates
                if (!playerActors.find(a => a.id === actor.id)) {
                    playerActors.push(actor);
                }
            }
            else {
            }
        }
        if (characterTokens.length === 0) {
            ui.notifications?.warn('No character tokens selected. Please select character tokens.');
            return;
        }
        // Initialize scene flags if needed
        const flags = getSceneFlags(currentScene);
        if (!flags.started) {
            // Initialize seats
            const seats = {};
            for (let i = 0; i < playerActors.length; i++) {
                const actor = playerActors[i];
                const userId = actor.ownership?.default ? Object.keys(actor.ownership).find((uid) => actor.ownership[uid] === 1) : null;
                seats[i + 1] = {
                    seatIndex: i + 1,
                    actorId: actor.id,
                    userId: userId || null,
                    isEnemy: false
                };
            }
            await updateSceneFlags(currentScene, {
                started: true,
                phase: 'planning',
                seats: seats
            });
        }
        // Process each selected token and place stones
        for (let playerIndex = 0; playerIndex < characterTokens.length; playerIndex++) {
            const token = characterTokens[playerIndex];
            const actor = token.actor || (token.document?.actor ? token.document.actor : null);
            if (!actor) {
                console.warn(`Mastery System | [DIVINE CLASH START] Token ${token.id} has no actor, skipping`);
                continue;
            }
            const result = await processPlayerActor(actor);
            if (result) {
                await spawnTokensForPlayer(currentScene, token, actor, result, playerIndex);
            }
        }
        ui.notifications?.info(`Divine Clash: Created stone tokens for ${characterTokens.length} player(s)`);
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
        return;
    }
    // Find all actors in this folder
    const actorsInFolder = game.actors?.filter((a) => {
        const aFolder = a.folder;
        return aFolder === folder.id;
    }) || [];
    // Delete all actors in folder
    if (actorsInFolder.length > 0) {
        const actorIds = actorsInFolder.map((a) => a.id);
        await Actor.deleteDocuments(actorIds);
    }
    // Delete folder
    await folder.delete();
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