import { MODULE_ID } from "../const.js";

const ELADRIN_PACK = `${MODULE_ID}.5e-transformations-eladrin`;

/**
 * Get a Fey Step item from the compendium for a given season.
 * @param {string} seasonId
 * @returns {Promise<Object|null>} Item data (plain object) or null
 */
export async function getFeyStepItemData(seasonId) {
  const pack = game.packs.get(ELADRIN_PACK);
  if (!pack) return null;

  const index = await pack.getIndex();
  const entry = index.find((e) => e.name === `Fey Step: ${_capitalize(seasonId)}`);
  if (!entry) return null;

  const doc = await pack.getDocument(entry._id);
  return doc?.toObject() ?? null;
}

/**
 * Get an Eladrin Season tracker item from the compendium.
 * @param {string} seasonId
 * @returns {Promise<Object|null>} Item data (plain object) or null
 */
export async function getSeasonTrackerItemData(seasonId) {
  const pack = game.packs.get(ELADRIN_PACK);
  if (!pack) return null;

  const index = await pack.getIndex();
  const entry = index.find((e) => e.name === `Eladrin Season: ${_capitalize(seasonId)}`);
  if (!entry) return null;

  const doc = await pack.getDocument(entry._id);
  return doc?.toObject() ?? null;
}

/**
 * Swap the Fey Step and Eladrin Season items on an actor to match a new season.
 * Preserves Fey Step uses (spent count) across the swap.
 * @param {Actor5e} actor
 * @param {string} newSeasonId
 */
export async function swapSeasonItems(actor, newSeasonId) {
  const existingFeyStep = actor.items.find(
    (i) => /^Fey Step/i.test(i.name) && i.type === "feat"
  );
  const existingSeason = actor.items.find(
    (i) => /^Eladrin Season/i.test(i.name) && i.type === "feat"
  );

  // Preserve Fey Step uses
  const spentUses = existingFeyStep?.system?.uses?.spent ?? 0;

  // Get new items from compendium
  const newFeyStep = await getFeyStepItemData(newSeasonId);
  const newSeason = await getSeasonTrackerItemData(newSeasonId);

  if (!newFeyStep || !newSeason) {
    console.warn(`${MODULE_ID} | Could not find compendium items for season: ${newSeasonId}`);
    ui.notifications.warn("Could not find season items in compendium. Try reloading the world.");
    return false;
  }

  // Carry over spent uses
  newFeyStep.system.uses.spent = spentUses;

  // Remove old items
  const toDelete = [];
  if (existingFeyStep) toDelete.push(existingFeyStep.id);
  if (existingSeason) toDelete.push(existingSeason.id);
  if (toDelete.length > 0) {
    await actor.deleteEmbeddedDocuments("Item", toDelete);
  }

  // Remove IDs so Foundry generates new ones
  delete newFeyStep._id;
  delete newSeason._id;

  // Add new items
  await actor.createEmbeddedDocuments("Item", [newFeyStep, newSeason]);
  return true;
}

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
