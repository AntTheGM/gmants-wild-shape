import { getCompendiumIds } from "./settings.js";

/**
 * Scan configured compendiums for beast (and optionally elemental) actors
 * that match the given Wild Shape rules.
 *
 * @param {object} rules - { maxCR, allowFly, allowElemental }
 * @returns {Promise<Array<{uuid, name, img, cr, fly}>>} Sorted by CR then name
 */
export async function scanForBeasts(rules) {
  const packIds = getCompendiumIds();
  if (!packIds.length) return [];

  const results = [];

  for (const packId of packIds) {
    const pack = game.packs.get(packId);
    if (!pack) {
      console.warn(`gmants-wild-shape | Compendium "${packId}" not found`);
      continue;
    }

    const index = await pack.getIndex({
      fields: [
        "system.details.type.value",
        "system.details.cr",
        "system.attributes.movement.fly",
        "img",
      ],
    });

    for (const entry of index) {
      const type = entry.system?.details?.type?.value;
      if (!type) continue;

      // Must be beast, or elemental if allowed
      const isBeast = type === "beast";
      const isElemental = type === "elemental" && rules.allowElemental;
      if (!isBeast && !isElemental) continue;

      const cr = entry.system?.details?.cr ?? 0;
      if (cr > rules.maxCR) continue;

      const fly = entry.system?.attributes?.movement?.fly ?? 0;
      if (fly > 0 && !rules.allowFly) continue;

      results.push({
        uuid: entry.uuid,
        name: entry.name,
        img: entry.img || "icons/svg/mystery-man.svg",
        cr,
        fly,
      });
    }
  }

  // Sort by CR ascending, then name alphabetically
  results.sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));
  return results;
}

/**
 * Load a full Actor document from a compendium UUID.
 * Works without importing to the world.
 */
export async function loadActorFromUuid(uuid) {
  return fromUuid(uuid);
}
