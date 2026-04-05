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
 * Register a context menu option on actor sheets to toggle Eladrin opt-in.
 */
export function registerEladrinOptIn() {
  Hooks.on("dnd5e.getActorSheetHeaderButtons", (sheet, buttons) => {
    if (sheet.actor?.type !== "character") return;
    // Only show for GMs or the actor's owner
    if (!sheet.actor.isOwner) return;

    const actor = sheet.actor;
    const isOptedIn = actor.getFlag(MODULE_ID, "eladrinOptIn");

    buttons.unshift({
      class: "eladrin-opt-in",
      icon: isOptedIn ? "fas fa-leaf" : "far fa-leaf",
      label: isOptedIn ? "Eladrin: On" : "Eladrin: Off",
      onclick: async () => {
        await actor.setFlag(MODULE_ID, "eladrinOptIn", !isOptedIn);
        sheet.render(false);
        ui.notifications.info(
          `Eladrin Season ${!isOptedIn ? "enabled" : "disabled"} for ${actor.name}.`
        );
      },
    });
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
