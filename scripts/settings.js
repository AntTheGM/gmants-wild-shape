import { MODULE_ID } from "./const.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "beastCompendiums", {
    name: "TRANSFORMATIONS.Settings.BeastCompendiums",
    hint: "TRANSFORMATIONS.Settings.BeastCompendiumsHint",
    scope: "world",
    config: true,
    type: String,
    default: "dnd5e.monsters",
  });

  game.settings.register(MODULE_ID, "dialogPosition", {
    scope: "client",
    config: false,
    default: {},
    type: Object,
  });
}

/**
 * Returns an array of compendium pack IDs configured for beast scanning.
 */
export function getCompendiumIds() {
  const raw = game.settings.get(MODULE_ID, "beastCompendiums");
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
