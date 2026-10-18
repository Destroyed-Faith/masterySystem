import { behaviorTypeId, EFFECT_NATURAL_FIRE, typeLabelKey } from "./constants.mjs";

/**
 * Foundry v14 region behavior. Fields live on RegionBehavior.system and use the
 * standard behavior sheet. No token events are subscribed; the fire is always-on
 * while the behavior is enabled.
 */
export class ParticleEffectsBehavior extends foundry.data.regionBehaviors.RegionBehaviorType {
  static LOCALIZATION_PREFIXES = ["DF_PARTICLE_EFFECTS"];

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      enabled: new fields.BooleanField({
        required: true,
        initial: true,
        label: "DF_PARTICLE_EFFECTS.FIELDS.enabled.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.enabled.hint",
      }),
      effectType: new fields.StringField({
        required: true,
        blank: false,
        initial: EFFECT_NATURAL_FIRE,
        choices: {
          naturalFire: "DF_PARTICLE_EFFECTS.EFFECTS.naturalFire",
        },
        label: "DF_PARTICLE_EFFECTS.FIELDS.effectType.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.effectType.hint",
      }),
      density: new fields.NumberField({
        required: true,
        integer: true,
        initial: 40,
        min: 0,
        max: 100,
        step: 1,
        label: "DF_PARTICLE_EFFECTS.FIELDS.density.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.density.hint",
      }),
      flameScale: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0.25,
        max: 2,
        step: 0.05,
        label: "DF_PARTICLE_EFFECTS.FIELDS.flameScale.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.flameScale.hint",
      }),
      flameSpeed: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: "DF_PARTICLE_EFFECTS.FIELDS.flameSpeed.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.flameSpeed.hint",
      }),
      opacity: new fields.NumberField({
        required: true,
        initial: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
        label: "DF_PARTICLE_EFFECTS.FIELDS.opacity.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.opacity.hint",
      }),
      emberAmount: new fields.NumberField({
        required: true,
        integer: true,
        initial: 20,
        min: 0,
        max: 100,
        step: 1,
        label: "DF_PARTICLE_EFFECTS.FIELDS.emberAmount.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.emberAmount.hint",
      }),
      edgeFade: new fields.NumberField({
        required: true,
        integer: true,
        initial: 5,
        min: 0,
        max: 100,
        step: 1,
        label: "DF_PARTICLE_EFFECTS.FIELDS.edgeFade.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.edgeFade.hint",
      }),
      randomSeed: new fields.StringField({
        required: false,
        nullable: true,
        blank: true,
        initial: "",
        trim: true,
        label: "DF_PARTICLE_EFFECTS.FIELDS.randomSeed.label",
        hint: "DF_PARTICLE_EFFECTS.FIELDS.randomSeed.hint",
      }),
    };
  }
}

export function registerBehaviorType() {
  const config = globalThis.CONFIG?.RegionBehavior;
  if (!config?.dataModels) {
    console.warn(
      "df-particle-effects | CONFIG.RegionBehavior.dataModels is missing. DF: Particle Effects was not registered.",
    );
    return false;
  }

  const behaviorType = behaviorTypeId();
  config.dataModels[behaviorType] = ParticleEffectsBehavior;
  if (config.typeIcons) config.typeIcons[behaviorType] = "fa-solid fa-fire";
  if (config.typeLabels) config.typeLabels[behaviorType] = typeLabelKey();
  if (config.typeHints) config.typeHints[behaviorType] = "DF_PARTICLE_EFFECTS.TypeHint";
  return true;
}
