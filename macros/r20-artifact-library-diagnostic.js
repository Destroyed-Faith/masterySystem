/**
 * Mastery System – R-20 Artifact Library Diagnostic (READ-ONLY)
 * ---------------------------------------------------------------------------
 * IMPORTANT: Macro type MUST be "script" (not "chat").
 * If type is "chat", Foundry posts this text as a chat message — that is not a bug.
 *
 * Prefer the console (no macro needed):
 *   await game.masterySystem.diagnoseArtifactLibrary()
 *
 * Or create a Macro: type = script, then paste ONLY the execute block below.
 */
/* ===== execute (Script macro body) ===== */
(async () => {
  if (!game?.user?.isGM) {
    ui.notifications?.error?.('R-20: GM only.');
    return;
  }
  const api = game.masterySystem?.diagnoseArtifactLibrary;
  if (typeof api !== 'function') {
    ui.notifications?.error?.(
      'R-20: game.masterySystem.diagnoseArtifactLibrary missing — reload the world / update to ≥0.9.830.',
    );
    return;
  }
  await api();
})();
