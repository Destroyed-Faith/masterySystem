/**
 * Distinguish dynamic-import / module-load failures from gameplay mechanic errors.
 * Used so combat try/catch blocks can keep loading soft-fails while surfacing
 * real mechanic failures during gameplay testing.
 */
export function isModuleLoadError(err) {
    const msg = err instanceof Error ? err.message : String(err ?? '');
    const name = err instanceof Error ? err.name : '';
    return ((name === 'TypeError' &&
        /Failed to fetch|dynamically imported module|Importing a module script failed/i.test(msg)) ||
        /Cannot find module|Cannot find package|Failed to resolve module|ERR_MODULE_NOT_FOUND/i.test(msg));
}
//# sourceMappingURL=module-load-error.js.map