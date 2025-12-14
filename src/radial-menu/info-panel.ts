/**
 * Info Panel for Radial Menu
 */

import type { RadialCombatOption } from './types';
import { getSegmentIdForOption } from './options';

/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
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
function getOrCreateInfoDiv(): HTMLElement {
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
export function showRadialInfoPanel(token: any, option: RadialCombatOption): void {
  const info = getOrCreateInfoDiv();
  info.classList.remove('hidden');
  
  const screenPos = worldToScreen(token.center.x, token.center.y);
  // Position to the right of the token center
  info.style.left = `${screenPos.x + 200}px`;
  info.style.top = `${screenPos.y - 100}px`;
  
  const segmentId = getSegmentIdForOption(option);
  const category = segmentId === 'active-buff' ? 'attack' : segmentId;
  const rangeText = option.range !== undefined ? `${option.range}m` : '–';
  
  // Get weapon damage if this is a weapon attack
  let damageText = '';
  let reachText = '';
  let specialText = '';
  
  if (option.slot === 'attack' && token.actor) {
    // Try to get equipped weapon
    const actor = token.actor;
    const items = (actor as any).items || [];
    const equippedWeapon = items.find((item: any) => 
      item.type === 'weapon' && (item.system as any)?.equipped === true
    );
    
    if (equippedWeapon) {
      const weaponSystem = equippedWeapon.system as any;
      damageText = weaponSystem.damage || weaponSystem.weaponDamage || '';
      
      // Get reach from weapon
      const innateAbilities = weaponSystem.innateAbilities || [];
      const reachAbility = innateAbilities.find((a: string) => a.includes('Reach'));
      if (reachAbility) {
        // Match new format: "Reach (+1 m)" or "Reach (+2 m)"
        const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
        if (bonusMatch) {
          const bonus = parseInt(bonusMatch[1], 10);
          const totalReach = 2 + bonus; // 2m base + bonus
          reachText = `Reach: ${totalReach}m`;
        } else {
          // Legacy support: Match old format: "Reach (2 m)" or "Reach (3 m)"
          const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
          if (legacyMatch) {
            reachText = `Reach: ${legacyMatch[1]}m`;
          }
        }
      }
      
      // Get special ability
      if (weaponSystem.special && weaponSystem.special !== '—') {
        specialText = weaponSystem.special;
      }
    }
  }
  
  // Build info HTML
  let infoHTML = `
    <div class="ms-info-title">${option.name}</div>
    <div class="ms-info-meta">
      <span class="ms-info-source">${option.source}</span> · <span class="ms-info-slot">${category}</span>
    </div>
  `;
  
  if (damageText) {
    infoHTML += `<div class="ms-info-damage"><strong>Damage:</strong> ${damageText}</div>`;
  }
  
  if (reachText) {
    infoHTML += `<div class="ms-info-reach">${reachText}</div>`;
  } else {
    infoHTML += `<div class="ms-info-range">Range: ${rangeText}</div>`;
  }
  
  if (specialText) {
    infoHTML += `<div class="ms-info-special"><strong>Special:</strong> ${specialText}</div>`;
  }
  
  infoHTML += `<div class="ms-info-desc">${option.description || 'No description available'}</div>`;
  
  info.innerHTML = infoHTML;
}

/**
 * Hide the info panel
 */
export function hideRadialInfoPanel(): void {
  const info = document.getElementById('ms-radial-info');
  if (info) {
    info.classList.add('hidden');
  }
}

