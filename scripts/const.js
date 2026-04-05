export const MODULE_ID = "5e-transformations";

export const FLAGS = {
  KNOWN_FORMS: "knownForms",
  ELADRIN_SEASON: "eladrinSeason",
  ELADRIN_IMAGES: "eladrinImages",
  ELADRIN_OPT_IN: "eladrinOptIn",
};

export const SEASONS = {
  spring: {
    id: "spring",
    icon: "fa-solid fa-seedling",
    color: "#5a9e4b",
  },
  summer: {
    id: "summer",
    icon: "fa-solid fa-sun",
    color: "#d4842a",
  },
  autumn: {
    id: "autumn",
    icon: "fa-solid fa-leaf",
    color: "#b8510d",
  },
  winter: {
    id: "winter",
    icon: "fa-solid fa-snowflake",
    color: "#5b8fbd",
  },
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
