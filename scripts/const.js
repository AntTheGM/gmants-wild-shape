export const MODULE_ID = "gmants-wild-shape";

export const FLAGS = {
  KNOWN_FORMS: "knownForms",
  PRE_TRANSFORM_TEMP_HP: "preTransformTempHp",
  WILD_SHAPE_TEMP_HP: "wildShapeTempHp",
};

/**
 * Druid Wild Shape rules by level tier.
 * Each entry: { minLevel, maxCR, maxForms, allowFly }
 * Evaluated top-down — highest matching minLevel wins.
 */
export const DRUID_RULES = {
  base: [
    { minLevel: 2, maxCR: 0.25, maxForms: 4, allowFly: false, allowElemental: false },
    { minLevel: 4, maxCR: 0.5, maxForms: 6, allowFly: false, allowElemental: false },
    { minLevel: 8, maxCR: 1, maxForms: 8, allowFly: true, allowElemental: false },
  ],
  moon: [
    { minLevel: 2, maxCR: 1, maxForms: 4, allowFly: false, allowElemental: false },
    { minLevel: 4, maxCR: "dynamic", maxForms: 6, allowFly: false, allowElemental: false },
    { minLevel: 8, maxCR: "dynamic", maxForms: 8, allowFly: true, allowElemental: false },
    { minLevel: 10, maxCR: "dynamic", maxForms: 8, allowFly: true, allowElemental: true },
  ],
};
