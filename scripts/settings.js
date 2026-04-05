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

  game.settings.register(MODULE_ID, "showControlButton", {
    name: "TRANSFORMATIONS.Settings.ShowControlButton",
    hint: "TRANSFORMATIONS.Settings.ShowControlButtonHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  game.settings.register(MODULE_ID, "dialogPosition", {
    scope: "client",
    config: false,
    default: {},
    type: Object,
  });

  // --- Eladrin Settings ---

  game.settings.register(MODULE_ID, "showEladrinButton", {
    name: "TRANSFORMATIONS.Settings.ShowEladrinButton",
    hint: "TRANSFORMATIONS.Settings.ShowEladrinButtonHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  game.settings.register(MODULE_ID, "eladrinDialogPosition", {
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
