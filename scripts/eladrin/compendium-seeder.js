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
 * In MIDI QOL mode: renames the existing Fey Step item to preserve automation.
 * In clean mode: replaces items from the module compendium.
 * @param {Actor5e} actor
 * @param {string} newSeasonId
 */
export async function swapSeasonItems(actor, newSeasonId) {
  const useMidi = game.settings.get(MODULE_ID, "useMidiQol");

  if (useMidi) {
    await _swapMidiMode(actor, newSeasonId);
  } else {
    await _swapCleanMode(actor, newSeasonId);
  }
}

/**
 * MIDI QOL mode: rename the existing Fey Step to match the new season.
 * Preserves all activities, effects, and MIDI QOL automation.
 */
async function _swapMidiMode(actor, newSeasonId) {
  const seasonLabel = _capitalize(newSeasonId);

  // Rename existing Fey Step (keep everything else intact)
  const existingFeyStep = actor.items.find(
    (i) => /^Fey Step/i.test(i.name) && i.type === "feat"
  );
  if (existingFeyStep) {
    // Preserve the ability modifier suffix if present (e.g., "- Wisdom")
    const suffixMatch = existingFeyStep.name.match(/\s*-\s*(Wisdom|Intelligence|Charisma)$/i);
    const suffix = suffixMatch ? ` - ${suffixMatch[1]}` : "";
    const newName = `Fey Step: ${seasonLabel}${suffix}`;
    await existingFeyStep.update({ name: newName });
  }

  // Still swap the Eladrin Season tracker item from compendium
  await _swapSeasonTracker(actor, newSeasonId);
}

/**
 * Clean mode: replace Fey Step and Season tracker from module compendium.
 */
async function _swapCleanMode(actor, newSeasonId) {
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
    return;
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
}

/**
 * Swap just the Eladrin Season tracker item (used by both modes).
 */
async function _swapSeasonTracker(actor, newSeasonId) {
  const existingSeason = actor.items.find(
    (i) => /^Eladrin Season/i.test(i.name) && i.type === "feat"
  );

  const newSeason = await getSeasonTrackerItemData(newSeasonId);
  if (!newSeason) return;

  if (existingSeason) {
    await actor.deleteEmbeddedDocuments("Item", [existingSeason.id]);
  }

  delete newSeason._id;
  await actor.createEmbeddedDocuments("Item", [newSeason]);
}

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
