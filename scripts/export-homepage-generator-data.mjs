#!/usr/bin/env node
/**
 * Dump the character-creation data catalogs as JSON for the homepage
 * character generator (docs/homepage-character-generator/data/*.json).
 *
 * Reads the compiled dist/ modules so the exported data is exactly what the
 * Foundry system uses. Run `npm run build` first.
 *
 * Usage: node scripts/export-homepage-generator-data.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'homepage-character-generator', 'data');
mkdirSync(outDir, { recursive: true });

function write(name, data) {
  const path = join(outDir, name);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`wrote ${name}`);
}

// --- Creation rules -------------------------------------------------------
const constants = await import('../dist/utils/constants.js');
write('creation-rules.json', {
  attributeDistribution: constants.CREATION.ATTRIBUTE_DISTRIBUTION,
  attributeAllowedValues: constants.CREATION.ATTRIBUTE_ALLOWED_VALUES,
  skillPoints: constants.CREATION.SKILL_POINTS,
  maxAttributeAtCreation: constants.CREATION.MAX_ATTRIBUTE_AT_CREATION,
  maxSkillAtCreation: constants.CREATION.MAX_SKILL_AT_CREATION,
  minDisadvantagePoints: constants.CREATION.MIN_DISADVANTAGE_POINTS,
  maxDisadvantagePoints: constants.CREATION.MAX_DISADVANTAGE_POINTS,
});

// --- Skills ---------------------------------------------------------------
const skills = await import('../dist/utils/skills.js');
write('skills.json', {
  categories: skills.SKILL_CATEGORIES,
  skills: skills.SKILLS,
});

// --- Echoes ---------------------------------------------------------------
const echos = await import('../dist/utils/echos/index.js');
write('echoes.json', {
  order: echos.ECHO_KEY_ORDER,
  cardSlotUnlockRanks: echos.ECHO_CARD_SLOT_UNLOCK_RANKS,
  echoes: echos.ALL_ECHOS,
});

const unbound = await import('../dist/utils/echos/unbound-identities.js');
write('unbound-identities.json', {
  identities: unbound.UNBOUND_IDENTITIES,
  predatorShapes: unbound.UNBOUND_PREDATOR_SHAPES,
  predatorStones: unbound.UNBOUND_PREDATOR_STONES,
});

// --- Languages --------------------------------------------------------------
const languages = await import('../dist/utils/languages.js');
write('languages.json', {
  languages: languages.LANGUAGES,
  echoLockedLanguages: languages.ECHO_LOCKED_LANGUAGES,
  commonLanguageKey: languages.COMMON_LANGUAGE_KEY,
  startingPickedLanguages: languages.STARTING_PICKED_LANGUAGES,
});

// --- Disadvantages -----------------------------------------------------------
const disadvantages = await import('../dist/system/disadvantages.js');
write('disadvantages.json', {
  disadvantages: disadvantages.DISADVANTAGES,
});

// --- Echo Artifacts (echo dialog shows these per echo) -----------------------
const artifacts = await import('../dist/utils/echo-artifacts.js');
write('echo-artifacts.json', {
  rules: artifacts.ECHO_ARTIFACT_RULES,
  artifacts: artifacts.ECHO_ARTIFACTS,
});

// --- Combat Package Wizard ---------------------------------------------------
// May pull in Foundry-flavored modules; tolerate failure and report it.
try {
  const copy = await import('../dist/creation/tower-wizard/tower-wizard-copy.js');
  write('tower-wizard-copy.json', copy.TOWER_WIZARD_COPY);

  const packages = await import('../dist/creation/tower-wizard/tower-wizard-packages.js');
  write('tower-wizard-packages.json', {
    stepOrder: packages.WIZARD_STEP_ORDER,
    hiddenOffenseIds: packages.WIZARD_HIDDEN_OFFENSE_IDS,
    defensePackages: packages.TOWER_WIZARD_DEFENSE_PACKAGES,
    offensePackages: packages.TOWER_WIZARD_OFFENSE_PACKAGES,
    offensiveActiveBuffs: packages.WIZARD_OFFENSIVE_ACTIVE_BUFFS,
  });

  // Guided-flow option catalog: everything the in-game wizard computes from the
  // power catalog, precomputed so the homepage generator shows the exact same
  // steps and cards (passive-1 variants, second-passive groups, buff groups,
  // core attack per delivery, special-focus groups).
  const echos = await import('../dist/utils/echos/index.js');
  const echoKeys = echos.ECHO_KEY_ORDER;
  const deliveryModes = ['melee', 'ranged', 'spell', 'natural'];

  const stable = (v) => JSON.stringify(v);
  /** default + per-echo variants, storing echo entries only when they differ. */
  const withEchoVariants = (compute) => {
    const fallback = compute(null);
    const byEcho = {};
    for (const echoKey of echoKeys) {
      const forEcho = compute(echoKey);
      if (stable(forEcho) !== stable(fallback)) byEcho[echoKey] = forEcho;
    }
    return Object.keys(byEcho).length > 0 ? { default: fallback, byEcho } : { default: fallback };
  };

  const coreAttacks = {};
  for (const mode of deliveryModes) {
    const resolved = packages.resolveGuidedCoreAttackPick(mode);
    if (!resolved) continue;
    const grant = packages.resolveGrant({
      templateId: resolved.pick.templateId,
      special: resolved.pick.special ?? null,
      rank: 2,
    });
    coreAttacks[mode] = {
      pickId: resolved.pick.pickId,
      templateId: resolved.pick.templateId,
      special: resolved.pick.special ?? null,
      delivery: resolved.delivery,
      coreIsSpell: resolved.coreIsSpell,
      displayName: grant.displayName,
      playerName: packages.playerFacingPowerName(
        { templateId: resolved.pick.templateId, special: resolved.pick.special ?? null, rank: 2 },
        grant,
      ),
    };
  }

  const defense = {};
  for (const pkg of packages.TOWER_WIZARD_DEFENSE_PACKAGES) {
    const variants = packages.getPassive1VariantOptions(pkg.id);
    const secondPassiveGroups = {};
    const previews = {};
    for (const variant of variants) {
      secondPassiveGroups[variant.templateId] = withEchoVariants((echoKey) =>
        packages.getSecondPassiveIntentGroups(pkg.id, variant.templateId, echoKey),
      );
      previews[variant.templateId] = packages.buildDefensePackagePreview({
        defenseId: pkg.id,
        passive1TemplateId: variant.templateId,
        activeBuffMode: 'defensive',
      });
    }
    const reactionGrant = packages.resolveGrant(pkg.grants.reaction);
    const buffGrant = packages.resolveGrant(pkg.grants.activeBuff);
    defense[pkg.id] = {
      passive1Variants: variants,
      defensiveActiveBuffChoiceBody: packages.getDefensiveActiveBuffChoiceBody(pkg.id),
      defaultActiveBuffPreview: packages.getDefaultActiveBuffPreview(pkg.id),
      defaultActiveBuffName: buffGrant.displayName,
      reactionName: reactionGrant.displayName,
      supportActiveBuffGroups: packages.getSupportActiveBuffGroups(pkg.id),
      previews,
      secondPassiveGroups,
    };
  }

  const specialFocusGroups = {};
  for (const mode of deliveryModes) {
    specialFocusGroups[mode] = withEchoVariants((echoKey) =>
      packages.getGuidedSpecialFocusGroups(mode, echoKey),
    );
  }

  write('tower-wizard-guided.json', {
    stepOrder: packages.WIZARD_STEP_ORDER,
    passive2Subtitle: copy.TOWER_WIZARD_COPY.passive2.subtitleForCategory(),
    guidedDeliveryOptions: packages.GUIDED_DELIVERY_OPTIONS,
    coreAttacks,
    defense,
    offensiveActiveBuffGroups: packages.getOffensiveActiveBuffGroups(),
    specialFocusGroups,
  });
} catch (error) {
  console.error('tower-wizard export failed (Foundry dependency?):', error);
  process.exitCode = 1;
}
