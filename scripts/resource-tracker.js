const RESOURCE_KEYS = ["primary", "secondary", "tertiary"];
const WILD_SHAPE_NAMES = ["wild shape", "wild companion"];

/**
 * Find Wild Shape as an item with uses on the actor (class feature, feat, etc.).
 * This is how 5e system v5+ tracks it — as an item with system.uses.
 *
 * @param {Actor} actor
 * @returns {Item | null}
 */
function findWildShapeItem(actor) {
  return actor.items.find((item) => {
    const name = item.name?.toLowerCase() ?? "";
    return WILD_SHAPE_NAMES.some((ws) => name.includes(ws)) && item.system?.uses?.max;
  }) ?? null;
}

/**
 * Find the Wild Shape resource slot on an actor (legacy approach).
 * Searches primary/secondary/tertiary for a label containing "wild shape".
 *
 * @param {Actor} actor
 * @returns {{ key: string, resource: object } | null}
 */
function findWildShapeResourceSlot(actor) {
  for (const key of RESOURCE_KEYS) {
    const resource = actor.system?.resources?.[key];
    if (resource?.label && WILD_SHAPE_NAMES.some((ws) => resource.label.toLowerCase().includes(ws))) {
      return { key, resource };
    }
  }
  return null;
}

/**
 * Get current and max Wild Shape uses.
 * Checks item uses first (5e v5+), falls back to resource slots.
 * @returns {{ current: number, max: number, source: "item"|"resource" } | null}
 */
export function getWildShapeUses(actor) {
  // Try item-based uses first (modern 5e)
  const item = findWildShapeItem(actor);
  if (item) {
    const uses = item.system.uses;
    return {
      current: uses.value ?? 0,
      max: uses.max ?? 0,
      source: "item",
    };
  }

  // Fall back to resource slots (legacy / manual setup)
  const slot = findWildShapeResourceSlot(actor);
  if (slot) {
    return {
      current: slot.resource.value ?? 0,
      max: slot.resource.max ?? 0,
      source: "resource",
    };
  }

  return null;
}

/**
 * Decrement one Wild Shape use. Returns true if successful.
 */
export async function decrementWildShapeUse(actor) {
  // Try item first
  const item = findWildShapeItem(actor);
  if (item) {
    const uses = item.system.uses;
    if ((uses.value ?? 0) <= 0) return false;
    await item.update({ "system.uses.value": uses.value - 1 });
    return true;
  }

  // Fall back to resource slot
  const slot = findWildShapeResourceSlot(actor);
  if (!slot || (slot.resource.value ?? 0) <= 0) return false;
  await actor.update({
    [`system.resources.${slot.key}.value`]: slot.resource.value - 1,
  });
  return true;
}
