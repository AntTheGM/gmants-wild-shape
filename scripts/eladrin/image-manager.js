import { MODULE_ID, FLAGS } from "../const.js";

/**
 * Get saved images for a specific season.
 * @param {Actor5e} actor
 * @param {string} seasonId
 * @returns {{token: string|null, portrait: string|null}}
 */
export function getSeasonImages(actor, seasonId) {
  const all = actor.getFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES) ?? {};
  return all[seasonId] ?? { token: null, portrait: null };
}

/**
 * Get saved images for all seasons.
 * @param {Actor5e} actor
 * @returns {Object<string, {token: string|null, portrait: string|null}>}
 */
export function getAllSeasonImages(actor) {
  return actor.getFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES) ?? {};
}

/**
 * Save the actor's current token and portrait as a season's look.
 * Captures from the active canvas token (if any) and actor portrait.
 * @param {Actor5e} actor
 * @param {string} seasonId
 */
export async function saveCurrentAsseason(actor, seasonId) {
  const portrait = actor.img;

  // Get token image from selected/active token, or fall back to prototype
  let token = actor.prototypeToken?.texture?.src;
  const activeToken = canvas.tokens?.placeables?.find(
    (t) => t.actor?.id === actor.id
  );
  if (activeToken) {
    token = activeToken.document.texture.src;
  }

  const existing = actor.getFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES) ?? {};
  existing[seasonId] = { token: token ?? null, portrait: portrait ?? null };

  await actor.setFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES, existing);
}

/**
 * Apply a season's saved images to the actor (portrait + all canvas tokens).
 * @param {Actor5e} actor
 * @param {string} seasonId
 * @returns {boolean} true if images were applied
 */
export async function applySeasonImages(actor, seasonId) {
  const images = getSeasonImages(actor, seasonId);
  if (!images.token && !images.portrait) return false;

  const updates = {};
  if (images.portrait) updates.img = images.portrait;
  if (images.token) updates["prototypeToken.texture.src"] = images.token;

  if (Object.keys(updates).length > 0) {
    await actor.update(updates);
  }

  // Update all active tokens on the canvas for this actor
  if (images.token && canvas.tokens?.placeables) {
    const tokens = canvas.tokens.placeables.filter(
      (t) => t.actor?.id === actor.id
    );
    for (const tok of tokens) {
      await tok.document.update({ "texture.src": images.token });
    }
  }

  return true;
}
