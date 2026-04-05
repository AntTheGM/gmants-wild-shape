import { MODULE_ID } from "./const.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "beastCompendiums", {
    name: "WILDSHAPE.Settings.BeastCompendiums",
    hint: "WILDSHAPE.Settings.BeastCompendiumsHint",
    scope: "world",
    config: true,
    type: String,
    default: "dnd5e.monsters",
  });

  game.settings.register(MODULE_ID, "showControlButton", {
    name: "WILDSHAPE.Settings.ShowControlButton",
    hint: "WILDSHAPE.Settings.ShowControlButtonHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  game.settings.register(MODULE_ID, "tempHpMultiplier", {
    name: "WILDSHAPE.Settings.TempHpMultiplier",
    hint: "WILDSHAPE.Settings.TempHpMultiplierHint",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    range: { min: 0, max: 10, step: 1 },
  });

  game.settings.register(MODULE_ID, "tempHpPersist", {
    name: "WILDSHAPE.Settings.TempHpPersist",
    hint: "WILDSHAPE.Settings.TempHpPersistHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
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
