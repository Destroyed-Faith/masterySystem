/**
 * Conservative local map analysis. No external library, no Auto-Wall, no network.
 * Long, strong edges become unconfirmed wall suggestions. Doors and windows are
 * only proposed when a hint of that kind sits on the line.
 */
import { distance, newId, pointInRect, projectPointOnSegment, rectFromPoints, segmentHitsRect } from '../geometry.js';
export const LOCAL_ANALYZER_ID = 'local-edges';
export const LOCAL_ANALYZER_VERSION = '1.0.0';
function drawSource(image, w, h) {
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx)
        throw new Error('Could not open an analysis canvas.');
    ctx.drawImage(image, 0, 0, w, h);
    return canvas;
}
function sobelMask(data, w, h) {
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i += 1) {
        const o = i * 4;
        gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }
    const mag = new Float32Array(w * h);
    let sum = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y += 1) {
        for (let x = 1; x < w - 1; x += 1) {
            const i = y * w + x;
            const gx = -gray[i - w - 1] +
                gray[i - w + 1] -
                2 * gray[i - 1] +
                2 * gray[i + 1] -
                gray[i + w - 1] +
                gray[i + w + 1];
            const gy = -gray[i - w - 1] -
                2 * gray[i - w] -
                gray[i - w + 1] +
                gray[i + w - 1] +
                2 * gray[i + w] +
                gray[i + w + 1];
            const m = Math.hypot(gx, gy);
            mag[i] = m;
            sum += m;
            count += 1;
        }
    }
    const mean = count ? sum / count : 0;
    const threshold = Math.max(48, mean * 2.4);
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < mag.length; i += 1) {
        mask[i] = mag[i] >= threshold ? 1 : 0;
    }
    return { mag, mask };
}
function extractSegments(mask, w, h, minLen) {
    const visited = new Uint8Array(w * h);
    const segs = [];
    const dirs = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
    ];
    for (const [dx, dy] of dirs) {
        for (let y = 1; y < h - 1; y += 1) {
            for (let x = 1; x < w - 1; x += 1) {
                const i = y * w + x;
                if (!mask[i] || visited[i])
                    continue;
                let cx = x;
                let cy = y;
                let steps = 0;
                const start = { x, y };
                while (cx >= 1 && cy >= 1 && cx < w - 1 && cy < h - 1) {
                    const j = cy * w + cx;
                    if (!mask[j])
                        break;
                    visited[j] = 1;
                    cx += dx;
                    cy += dy;
                    steps += 1;
                    if (steps > Math.max(w, h))
                        break;
                }
                if (steps >= minLen) {
                    segs.push({
                        a: { x: start.x + 0.5, y: start.y + 0.5 },
                        b: { x: start.x + dx * steps + 0.5, y: start.y + dy * steps + 0.5 },
                    });
                }
            }
        }
    }
    return mergeCollinear(segs, 3, 8);
}
function mergeCollinear(segs, angleEps, distEps) {
    const used = new Array(segs.length).fill(false);
    const out = [];
    for (let i = 0; i < segs.length; i += 1) {
        if (used[i])
            continue;
        let cur = segs[i];
        used[i] = true;
        let changed = true;
        while (changed) {
            changed = false;
            for (let j = 0; j < segs.length; j += 1) {
                if (used[j])
                    continue;
                const other = segs[j];
                const ends = [cur.a, cur.b, other.a, other.b];
                const near = distance(cur.a, other.a) <= distEps ||
                    distance(cur.a, other.b) <= distEps ||
                    distance(cur.b, other.a) <= distEps ||
                    distance(cur.b, other.b) <= distEps;
                if (!near)
                    continue;
                const dirA = { x: cur.b.x - cur.a.x, y: cur.b.y - cur.a.y };
                const dirB = { x: other.b.x - other.a.x, y: other.b.y - other.a.y };
                const la = Math.hypot(dirA.x, dirA.y) || 1;
                const lb = Math.hypot(dirB.x, dirB.y) || 1;
                const dot = Math.abs((dirA.x / la) * (dirB.x / lb) + (dirA.y / la) * (dirB.y / lb));
                if (dot < Math.cos(angleEps))
                    continue;
                let a = ends[0];
                let b = ends[0];
                let best = 0;
                for (const p of ends) {
                    for (const q of ends) {
                        const d = distance(p, q);
                        if (d > best) {
                            best = d;
                            a = p;
                            b = q;
                        }
                    }
                }
                cur = { a, b };
                used[j] = true;
                changed = true;
            }
        }
        out.push(cur);
    }
    return out;
}
function toScene(p, input, aw, ah) {
    return {
        x: input.sceneOrigin.x + (p.x / aw) * input.sceneSize.x,
        y: input.sceneOrigin.y + (p.y / ah) * input.sceneSize.y,
    };
}
function ignoreRects(hints) {
    return hints.filter((h) => h.kind === 'ignore').map((h) => rectFromPoints(h.a, h.b));
}
function classifyKind(seg, hints) {
    let best = null;
    let bestD = 36;
    for (const hint of hints) {
        if (hint.kind === 'ignore')
            continue;
        const d = Math.min(projectPointOnSegment(hint.a, seg).distance, projectPointOnSegment(hint.b, seg).distance, projectPointOnSegment(seg.a, { a: hint.a, b: hint.b }).distance);
        if (d <= bestD) {
            bestD = d;
            best = hint;
        }
    }
    if (best && best.kind !== 'ignore') {
        return { kind: best.kind, hintIds: [best.id], assisted: true };
    }
    return { kind: 'wall', hintIds: [], assisted: false };
}
export const localAnalyzer = {
    id: LOCAL_ANALYZER_ID,
    version: LOCAL_ANALYZER_VERSION,
    async analyze(input, signal) {
        const max = Math.max(64, Math.floor(input.maxResolution || 800));
        const scale = Math.min(1, max / Math.max(input.imageWidth, input.imageHeight, 1));
        const aw = Math.max(8, Math.round(input.imageWidth * scale));
        const ah = Math.max(8, Math.round(input.imageHeight * scale));
        if (signal?.aborted)
            throw new DOMException('Aborted', 'AbortError');
        const canvas = drawSource(input.image, aw, ah);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx)
            throw new Error('Could not read the analysis canvas.');
        const pixels = ctx.getImageData(0, 0, aw, ah);
        const { mask } = sobelMask(pixels.data, aw, ah);
        const minPx = Math.max(10, Math.round((input.minSegmentLength || 48) * scale));
        const raw = extractSegments(mask, aw, ah, minPx);
        const ignores = ignoreRects(input.hints);
        const suggestions = [];
        let uncertainCount = 0;
        const debugLines = [];
        for (const line of raw) {
            if (signal?.aborted)
                throw new DOMException('Aborted', 'AbortError');
            const sceneSeg = { a: toScene(line.a, input, aw, ah), b: toScene(line.b, input, aw, ah) };
            debugLines.push(sceneSeg);
            if (ignores.some((rect) => segmentHitsRect(sceneSeg, rect)))
                continue;
            if (input.region) {
                const r = input.region;
                if (!segmentHitsRect(sceneSeg, r) && !pointInRect(sceneSeg.a, r) && !pointInRect(sceneSeg.b, r))
                    continue;
            }
            const tooCloseToConfirmed = input.confirmed.some((wall) => {
                const d1 = projectPointOnSegment(sceneSeg.a, wall).distance;
                const d2 = projectPointOnSegment(sceneSeg.b, wall).distance;
                return d1 < 10 && d2 < 10;
            });
            if (tooCloseToConfirmed)
                continue;
            const cls = classifyKind(sceneSeg, input.hints);
            const len = distance(sceneSeg.a, sceneSeg.b);
            const uncertain = len < (input.minSegmentLength || 48) * 1.4;
            if (uncertain)
                uncertainCount += 1;
            suggestions.push({
                id: newId('sug'),
                kind: cls.kind,
                a: sceneSeg.a,
                b: sceneSeg.b,
                confidence: uncertain ? 0.35 : cls.assisted ? 0.8 : 0.55,
                origin: cls.assisted ? 'hint-assisted' : 'local',
                rejected: false,
                uncertain,
                hintIds: cls.hintIds,
            });
        }
        return {
            suggestions,
            uncertainCount,
            warnings: suggestions.length ? [] : ['No strong structure found. Draw walls by hand or add a hint and analyse again.'],
            debug: { width: aw, height: ah, mask, lines: debugLines },
            analyzer: LOCAL_ANALYZER_ID,
            analyzerVersion: LOCAL_ANALYZER_VERSION,
        };
    },
};
export async function loadSceneImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('The scene background could not be loaded for analysis.'));
        img.src = src;
    });
}
//# sourceMappingURL=local-analyzer.js.map