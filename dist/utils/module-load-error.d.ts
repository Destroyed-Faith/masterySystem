/**
 * Distinguish dynamic-import / module-load failures from gameplay mechanic errors.
 * Used so combat try/catch blocks can keep loading soft-fails while surfacing
 * real mechanic failures during gameplay testing.
 */
export declare function isModuleLoadError(err: unknown): boolean;
//# sourceMappingURL=module-load-error.d.ts.map