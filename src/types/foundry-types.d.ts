/**
 * Helper type declarations for Foundry VTT v13
 * These extend the base types to avoid TypeScript errors
 */

declare global {
  interface Actor {
    type: string;
    system: any;
    update(data: any): Promise<any>;
  }

  interface Item {
    type: string;
    system: any;
    update(data: any): Promise<any>;
  }

  namespace foundry {
    namespace utils {
      function mergeObject(original: any, other: any, options?: any): any;
      function deepClone(original: any): any;
      function duplicate(original: any): any;
    }
  }

  const CONFIG: any;
  const game: any;
}

export {};













































