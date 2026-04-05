import { MODULE_ID, FLAGS } from "../const.js";

const UPLOAD_DIR = "eladrin-seasons";

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
 * Copy an image file to a season-specific path so it won't be overwritten
 * by tools like Tokenizer that reuse the same filename.
 * @param {string} sourcePath - Current image path (may include query params)
 * @param {string} actorId - Actor ID for namespacing
 * @param {string} seasonId - Season identifier
 * @param {string} imageType - "token" or "portrait"
 * @returns {Promise<string>} The new persistent path
 */
async function copyImageForSeason(sourcePath, actorId, seasonId, imageType) {
  try {
    // Strip query params to get the clean path for fetching
    const cleanPath = sourcePath.split("?")[0];

    // Determine file extension
    const ext = cleanPath.split(".").pop() || "webp";

    // Fetch the image data
    const response = await fetch(sourcePath);
    if (!response.ok) {
      console.warn(`${MODULE_ID} | Failed to fetch image: ${sourcePath}`);
      return sourcePath;
    }
    const blob = await response.blob();

    // Build destination filename
    const filename = `${actorId}_${seasonId}_${imageType}.${ext}`;

    // Ensure the upload directory exists
    const targetDir = `${UPLOAD_DIR}/${actorId}`;
    const FP = CONFIG.ux.FilePicker ?? FilePicker;
    try {
      await FP.browse("data", targetDir);
    } catch {
      await FP.createDirectory("data", UPLOAD_DIR).catch(() => {});
      await FP.createDirectory("data", targetDir).catch(() => {});
    }

    // Upload the copy
    const file = new File([blob], filename, { type: blob.type });
    const result = await FP.upload("data", targetDir, file);

    if (result?.path) {
      console.log(`${MODULE_ID} | Copied ${imageType} for ${seasonId}: ${result.path}`);
      return result.path;
    }
    return sourcePath;
  } catch (err) {
    console.warn(`${MODULE_ID} | Could not copy image for ${seasonId} ${imageType}:`, err);
    return sourcePath;
  }
}

/**
 * Save the actor's current token and portrait as a season's look.
 * Copies images to season-specific paths to prevent overwriting.
 * @param {Actor5e} actor
 * @param {string} seasonId
 */
export async function saveCurrentAsSeason(actor, seasonId) {
  let portrait = actor.img;
  let token = actor.prototypeToken?.texture?.src;

  // Get token image from active canvas token if available
  const activeToken = canvas.tokens?.placeables?.find(
    (t) => t.actor?.id === actor.id
  );
  if (activeToken) {
    token = activeToken.document.texture.src;
  }

  // Copy images to season-specific paths so they persist
  if (token) {
    token = await copyImageForSeason(token, actor.id, seasonId, "token");
  }
  if (portrait) {
    portrait = await copyImageForSeason(portrait, actor.id, seasonId, "portrait");
  }

  const existing = foundry.utils.deepClone(
    actor.getFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES) ?? {}
  );
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

/**
 * Delete saved images for a single season.
 * Removes copied files from disk (only from our upload dir) and clears the flag entry.
 * Does NOT touch the actor's current token or portrait.
 * @param {Actor5e} actor
 * @param {string} seasonId
 */
export async function deleteSeasonImages(actor, seasonId) {
  const allImages = foundry.utils.deepClone(
    actor.getFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES) ?? {}
  );
  const season = allImages[seasonId];
  if (!season) return;

  const currentToken = actor.prototypeToken?.texture?.src;
  const currentPortrait = actor.img;

  // Delete copied files (only from our upload dir, skip if currently in use)
  for (const filePath of [season.token, season.portrait]) {
    if (!filePath || !filePath.includes(UPLOAD_DIR)) continue;
    if (filePath === currentToken || filePath === currentPortrait) continue;
    try {
      await foundry.utils.fetchJsonWithTimeout(
        foundry.utils.getRoute("files"),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "data", path: filePath }),
        }
      ).catch(() => {});
      console.log(`${MODULE_ID} | Deleted season image: ${filePath}`);
    } catch (err) {
      console.warn(`${MODULE_ID} | Could not delete ${filePath}:`, err);
    }
  }

  // Remove this season from flag data
  delete allImages[seasonId];
  if (Object.keys(allImages).length === 0) {
    await actor.unsetFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES);
  } else {
    await actor.setFlag(MODULE_ID, FLAGS.ELADRIN_IMAGES, allImages);
  }
  console.log(`${MODULE_ID} | Cleared ${seasonId} images for ${actor.name}`);
}
