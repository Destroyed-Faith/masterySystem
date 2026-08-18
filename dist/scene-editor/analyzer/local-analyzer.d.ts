/**
 * Conservative local map analysis. No external library, no Auto-Wall, no network.
 * Long, strong edges become unconfirmed wall suggestions. Doors and windows are
 * only proposed when a hint of that kind sits on the line.
 */
import type { Analyzer } from '../types.js';
export declare const LOCAL_ANALYZER_ID = "local-edges";
export declare const LOCAL_ANALYZER_VERSION = "1.0.0";
export declare const localAnalyzer: Analyzer;
export declare function loadSceneImage(src: string): Promise<HTMLImageElement>;
//# sourceMappingURL=local-analyzer.d.ts.map