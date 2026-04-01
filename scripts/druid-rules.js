import { DRUID_RULES } from "./const.js";

/**
 * Get the druid class level for an actor.
 */
export function getDruidLevel(actor) {
  return actor.classes?.druid?.system?.levels ?? 0;
}

/**
 * Check if the actor has the Circle of the Moon subclass.
 */
export function isMoonDruid(actor) {
  return !!actor.subclasses?.moon;
}

/**
 * Returns true if the actor can Wild Shape (druid level >= 2).
 */
export function canWildShape(actor) {
  return getDruidLevel(actor) >= 2;
}

/**
 * Compute the Moon Druid dynamic CR cap: floor(level / 3), minimum 1.
 */
function moonDynamicCR(druidLevel) {
  return Math.max(1, Math.floor(druidLevel / 3));
}

/**
 * Get the Wild Shape rules for an actor based on druid level and subclass.
 * Returns { maxCR, maxForms, allowFly, allowElemental } or null if can't wild shape.
 */
export function getFormRules(actor) {
  const level = getDruidLevel(actor);
  if (level < 2) return null;

  const moon = isMoonDruid(actor);
  const tiers = moon ? DRUID_RULES.moon : DRUID_RULES.base;

  // Find highest applicable tier (last one where level >= minLevel)
  let tier = null;
  for (const t of tiers) {
    if (level >= t.minLevel) tier = t;
  }
  if (!tier) return null;

  const maxCR = tier.maxCR === "dynamic" ? moonDynamicCR(level) : tier.maxCR;

  return {
    maxCR,
    maxForms: tier.maxForms,
    allowFly: tier.allowFly,
    allowElemental: tier.allowElemental,
  };
}

/**
 * Format a CR number for display (0.25 -> "1/4", 0.5 -> "1/2", etc.)
 */
export function formatCR(cr) {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}
