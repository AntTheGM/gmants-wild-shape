import { MODULE_ID, FLAGS, SEASONS } from "../const.js";

/**
 * Check whether an actor qualifies as an Eladrin (auto-detect or opt-in).
 * @param {Actor5e} actor
 * @returns {boolean}
 */
export function isEladrin(actor) {
  if (!actor) return false;

  // Manual opt-in flag
  if (actor.getFlag(MODULE_ID, FLAGS.ELADRIN_OPT_IN)) return true;

  // Auto-detect: check race item
  const raceItem = actor.items.find(
    (i) => i.type === "race" && /eladrin/i.test(i.name)
  );
  if (raceItem) return true;

  // Auto-detect: check system.details.race (string in older 5e versions)
  const raceStr = actor.system?.details?.race;
  if (typeof raceStr === "string" && /eladrin/i.test(raceStr)) return true;

  return false;
}

/**
 * Get the actor's current season.
 * @param {Actor5e} actor
 * @returns {string|null} Season ID or null if none set
 */
export function getCurrentSeason(actor) {
  return actor.getFlag(MODULE_ID, FLAGS.ELADRIN_SEASON) ?? null;
}

/**
 * Set the actor's current season flag.
 * @param {Actor5e} actor
 * @param {string} seasonId
 */
export async function setCurrentSeason(actor, seasonId) {
  await actor.setFlag(MODULE_ID, FLAGS.ELADRIN_SEASON, seasonId);
}

/**
 * Get the localized display name for a season.
 * @param {string} seasonId
 * @returns {string}
 */
export function getSeasonLabel(seasonId) {
  return game.i18n.localize(`TRANSFORMATIONS.Eladrin.Season.${seasonId}`);
}

/**
 * Get all season definitions with localized labels.
 * @returns {Array<{id: string, label: string, icon: string, color: string}>}
 */
export function getAllSeasons() {
  return Object.values(SEASONS).map((s) => ({
    ...s,
    label: getSeasonLabel(s.id),
  }));
}
