/**
 * Handlebars Helpers for Mastery System
 * Custom helper functions for templates
 */

/**
 * Register all Handlebars helpers
 */
export function registerHandlebarsHelpers(): void {
  // Calculate stones from attribute value (value / 8)
  Handlebars.registerHelper('calculateStones', function(value: number): number {
    return Math.floor(value / 8);
  });
  
  // Times loop helper (for repeating elements)
  Handlebars.registerHelper('times', function(n: number, block: any): string {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn(i);
    }
    return result;
  });
  
  // Subtract helper
  Handlebars.registerHelper('subtract', function(a: number, b: number): number {
    return a - b;
  });
  
  // Capitalize helper
  Handlebars.registerHelper('capitalize', function(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  
  // Check if value equals another
  Handlebars.registerHelper('eq', function(a: any, b: any): boolean {
    return a === b;
  });
  
  // Check if value is in list (or)
  Handlebars.registerHelper('or', function(...args: any[]): boolean {
    // Last arg is the options object from Handlebars - remove it
    const values = args.slice(0, -1);
    
    for (let i = 0; i < values.length; i++) {
      if (values[i]) return true;
    }
    return false;
  });
  
  // Math helpers
  Handlebars.registerHelper('add', function(a: number, b: number): number {
    return a + b;
  });
  
  Handlebars.registerHelper('multiply', function(a: number, b: number): number {
    return a * b;
  });
  
  Handlebars.registerHelper('divide', function(a: number, b: number): number {
    return b !== 0 ? Math.floor(a / b) : 0;
  });
  
  // Greater than
  Handlebars.registerHelper('gt', function(a: number, b: number): boolean {
    return a > b;
  });
  
  // Less than
  Handlebars.registerHelper('lt', function(a: number, b: number): boolean {
    return a < b;
  });
  
  // Default value helper
  Handlebars.registerHelper('default', function(value: any, defaultValue: any): any {
    return value !== undefined && value !== null ? value : defaultValue;
  });
  
  console.log('Mastery System | Handlebars helpers registered');
}

