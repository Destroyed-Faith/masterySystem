#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

function cutBetween(text, startMarker, endMarkerInclusiveStart) {
  const a = text.indexOf(startMarker);
  const b = text.indexOf(endMarkerInclusiveStart);
  if (a < 0 || b < 0 || b < a) {
    throw new Error(`cutBetween failed for markers:\n${startMarker}\n---\n${endMarkerInclusiveStart}`);
  }
  return text.slice(0, a) + text.slice(b);
}

function cutExact(text, chunk) {
  if (!text.includes(chunk)) throw new Error(`chunk not found:\n${chunk.slice(0, 120)}`);
  return text.replace(chunk, '');
}

// --- stone-powers-dialog.ts ---
let stone = readFileSync('src/stones/stone-powers-dialog.ts', 'utf8');

stone = cutBetween(
  stone,
  '/**\n * Konsole nach `StoneDnD` filtern.\n',
  '/** Physische Zahlungs-Lanes im Cluster: 1 + 2 + 4 + 8. */\n',
);

stone = cutExact(
  stone,
  `/** Warum ein leeres Feld nicht \`slot-active\` ist (Debug / Drop-Warn). */
function explainLaneInactiveReason(
  laneIndex: number,
  occ: number[],
  allowed: Set<number>,
  spendableNet: number,
  planLocked: boolean
): string {
  const o = new Set(occ);
  if (planLocked) return 'stonePlanLocked';
  if (o.has(laneIndex)) return 'filled';
  if (spendableNet < 1) {
    return \`spendableNet=\${spendableNet} (kein freier Pool-Stein; reservierte Felder zählen gegen den Pool)\`;
  }
  if (!allowed.has(laneIndex)) {
    const seg = segmentIndexForLane(laneIndex);
    for (let s = 0; s < seg; s++) {
      if (!isStoneSegmentComplete(o, s)) {
        return \`Segment \${s} noch unvollständig — erst vorherigen Block voll belegen (Freigabe 1→2→4→8)\`;
      }
    }
    return \`Lane \${laneIndex} nicht in allowed=[\${[...allowed].sort((a, b) => a - b)}]\`;
  }
  return 'sollte_active_sein';
}

`,
);

stone = cutExact(
  stone,
  `
    if (DEBUG_STONE_PAYMENT) {
      const poolSnapPay = this.#debugPaymentNetwork();
    }

    if (DEBUG_STONE_LANES) {
      const accDump = Object.fromEntries(
        [...this._stoneDropAccumulators.entries()].map(([k, v]) => {
          if (isGenericUnifiedAccKey(k) && isGenericLaneOccArray(v as StoneAccumulatorValue)) {
            return [k, [...(v as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane)];
          }
          return [k, [...(v as number[])].sort((a, b) => a - b)];
        })
      );
    }
`,
);

stone = cutExact(stone, '\n    if (DEBUG_STONE_LANES) this.#logStoneLanesDom(appWindow);\n');

stone = cutBetween(
  stone,
  '  /** Debug/Diagnose: Pool brutto, reserviert im Dialog, netto — pro Attribut + Summe. */\n',
  '  /** Gleicher Owner wie Stein-Nutzung (unverlinkter Token → Prototyp-Actor). */\n',
);

stone = cutBetween(
  stone,
  '  /** Nur bei CONFIG.masterySystemDebugStoneLanes: Lane 0–2 Klassen im gerenderten DOM. */\n',
  '  #reservedStonesNonFamiliar(attr: string): number {\n',
);

stone = stone.replace(
  `      if (!slot) {
        const doc = (ev.view?.document ?? (typeof document !== 'undefined' ? document : null)) as Document | null;
        let underStack: string[] = [];
        try {
          if (doc?.elementsFromPoint) {
            underStack = doc.elementsFromPoint(ev.clientX, ev.clientY).slice(0, 10).map((e) => {
              const h = e as HTMLElement;
              return \`\${h.tagName}.\${(h.className?.toString?.() || '').slice(0, 72)}\`;
            });
          }
        } catch {
          /* ignore */
        }
        console.warn('Mastery System | [StonePayment] Drop ohne erkanntes Ablagefeld', {
          clientX: ev.clientX,
          clientY: ev.clientY,
          elementsFromPoint: underStack
        });
        if (msLastDraggedStoneAttribute) ev.preventDefault();
        return;
      }`,
  `      if (!slot) {
        if (msLastDraggedStoneAttribute) ev.preventDefault();
        return;
      }`,
);

stone = stone.replace(
  `      if (!slot.classList.contains('slot-active')) {
        const inactiveDiag = this.#slotInactiveDropDiag(slot);
        console.warn('Mastery System | [StonePayment] Drop abgelehnt (Feld nicht slot-active)', inactiveDiag);
        return;
      }`,
  `      if (!slot.classList.contains('slot-active')) {
        return;
      }`,
);

writeFileSync('src/stones/stone-powers-dialog.ts', stone);

// --- damage-dialog.ts ---
let dmg = readFileSync('src/dice/damage-dialog.ts', 'utf8');
const marker = '\n// DamageDialog class removed - now using chat messages instead\n';
const idx = dmg.indexOf(marker);
if (idx < 0) throw new Error('damage-dialog marker missing');
writeFileSync('src/dice/damage-dialog.ts', dmg.slice(0, idx) + '\n');

// --- module.ts ---
let mod = readFileSync('src/module.ts', 'utf8');
const dbgStart = mod.indexOf('\n  // Debug mode\n');
const dbgEnd = mod.indexOf('\n  // Mastery Rank - Global default\n');
if (dbgStart < 0 || dbgEnd < 0) throw new Error('module debug settings markers missing');
mod = mod.slice(0, dbgStart) + mod.slice(dbgEnd);
writeFileSync('src/module.ts', mod);

console.log('finish-debug-cleanup: ok');
