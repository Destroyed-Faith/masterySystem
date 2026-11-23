/** Printed Split Attack targets: 2 at PL 1–6, 3 at PL 7–12, 4 at PL 13–16. */
export function splitTargetsForPowerLevel(powerLevel) {
    const pl = Math.max(1, Math.min(16, Math.floor(Number(powerLevel) || 1)));
    if (pl >= 13)
        return 4;
    if (pl >= 7)
        return 3;
    return 2;
}
//# sourceMappingURL=split-attack-targets.js.map