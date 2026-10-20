/**
 * Passive-only wizard choice labels — strip the catalogue type prefix when
 * the UI context already makes "Passive" implicit.
 */
/** Strip exactly one leading `Passive: ` (case-insensitive). Does not alter other text. */
export function passiveWizardChoiceLabel(name) {
    const raw = String(name ?? '').trim();
    if (!raw)
        return '';
    return raw.replace(/^Passive:\s*/i, '');
}
//# sourceMappingURL=tower-wizard-passive-labels.js.map