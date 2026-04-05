import { MODULE_ID } from "./const.js";
import { registerSettings, registerEladrinOptIn } from "./settings.js";
import { canWildShape, getFormRules, formatCR } from "./druid-rules.js";
import { TransformationDialog } from "./dialog/TransformationDialog.js";
import { EladrinSeasonDialog } from "./eladrin/eladrin-dialog.js";
import { isEladrin } from "./eladrin/season-data.js";
import { registerTeleportHandler } from "./eladrin/teleport.js";

let dialogInstance = null;
let eladrinDialogInstance = null;

// ─── Initialization ──────────────────────────────────────────────────────────

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready`);
  registerEladrinOptIn();
  registerTeleportHandler();
});


// ─── Scene Control Button ────────────────────────────────────────────────────

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.settings.get(MODULE_ID, "showControlButton")) return;

  const tokenControls = controls.tokens;
  if (!tokenControls) return;

  tokenControls.tools.wildShape = {
    name: "wildShape",
    title: game.i18n.localize("TRANSFORMATIONS.ControlButton"),
    icon: "fa-solid fa-paw",
    onClick: () => openTransformationDialog(),
    button: true,
  };

  if (game.settings.get(MODULE_ID, "showEladrinButton")) {
    tokenControls.tools.eladrinSeason = {
      name: "eladrinSeason",
      title: game.i18n.localize("TRANSFORMATIONS.Eladrin.ControlButton"),
      icon: "fa-solid fa-leaf",
      onClick: () => openEladrinDialog(),
      button: true,
    };
  }
});

// ─── Settings Page Promo ─────────────────────────────────────────────────────

Hooks.on("renderSettingsConfig", (app, html) => {
  const tab =
    html[0]?.querySelector?.(`.tab[data-tab="${MODULE_ID}"]`) ??
    html.querySelector?.(`.tab[data-tab="${MODULE_ID}"]`);
  if (!tab || tab.querySelector(".transformations-settings-promo")) return;
  const note = document.createElement("p");
  note.className = "transformations-settings-promo";
  note.style.cssText =
    "text-align:center; font-style:italic; opacity:0.6; font-size:0.8rem; margin-top:0.5rem;";
  note.innerHTML =
    'Visit <a href="https://roleplayr.com/gmant" target="_blank" rel="noopener">roleplayr.com/gmant</a> for updates, more virtual tabletop tools, and online RPG tools.';
  tab.appendChild(note);
});

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Open the Transformation Dialog for the currently selected/assigned actor.
 */
function openTransformationDialog() {
  const actor = resolveActor();
  if (!actor) {
    ui.notifications.warn(game.i18n.localize("TRANSFORMATIONS.Error.NoActor"));
    return;
  }

  // If the actor is polymorphed, we still allow opening (shows transformed view).
  // Only check canWildShape for non-polymorphed actors.
  if (!actor.isPolymorphed && !canWildShape(actor)) {
    ui.notifications.warn(game.i18n.localize("TRANSFORMATIONS.Error.NotDruid"));
    return;
  }

  if (dialogInstance) {
    dialogInstance.close();
    dialogInstance = null;
  }

  dialogInstance = new TransformationDialog(actor);
  dialogInstance.render(true);
}

/**
 * Resolve the actor to use: selected token's actor, or assigned character.
 */
function resolveActor() {
  return canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
}

// ─── Eladrin Season Dialog ───────────────────────────────────────────────────

/**
 * Open the Eladrin Season Dialog for the currently selected/assigned actor.
 */
function openEladrinDialog() {
  const actor = resolveActor();
  if (!actor) {
    ui.notifications.warn(game.i18n.localize("TRANSFORMATIONS.Error.NoActor"));
    return;
  }

  if (!isEladrin(actor)) {
    ui.notifications.warn(
      game.i18n.localize("TRANSFORMATIONS.Error.NotEladrin")
    );
    return;
  }

  if (eladrinDialogInstance) {
    eladrinDialogInstance.close();
    eladrinDialogInstance = null;
  }

  eladrinDialogInstance = new EladrinSeasonDialog(actor);
  eladrinDialogInstance.render(true);
}

// ─── Public API ──────────────────────────────────────────────────────────────

// Expose for macros
Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = {
    open: openTransformationDialog,
    eladrin: openEladrinDialog,
  };
});
