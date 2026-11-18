/**
 * Attack Power classification (docs/Rules/Canonical/Actives.md, Power Use Limit).
 *
 * Attack Powers are the Single Target, AoE, Split, Autofire, Single Target
 * Special and AoE Special templates. They may be used repeatedly in the same
 * Round while Attack Actions remain. Every other Active (Support, Barrier,
 * Power Image, Mental, Persistent Special Zones, Control, Limited, …) keeps the
 * once-per-Round-per-instance rule.
 */
/**
 * True for the six Attack Power templates. The legacy Damage + Special family
 * (`active-*-damage-t*`) counts as Single Target until the v0.9.9.6 migration
 * moves it to Single Target Special.
 */
export declare function isAttackPowerTemplateId(templateId: string | null | undefined): boolean;
/** Embedded power item (learned or granted) whose template is an Attack Power. */
export declare function isAttackPowerItem(item: {
    type?: string;
    system?: any;
} | null | undefined): boolean;
//# sourceMappingURL=attack-power.d.ts.map