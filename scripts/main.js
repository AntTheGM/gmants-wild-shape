import { MODULE_ID } from "./const.js";
import { registerSettings } from "./settings.js";
import { canWildShape, getFormRules, formatCR } from "./druid-rules.js";
import { TransformationDialog } from "./dialog/TransformationDialog.js";

// NOTE: Eladrin Season functionality was migrated to standalone module "gmants-eladrin"
// (GMAnt's Eladrin) — https://github.com/AntTheGM/gmants-eladrin

let dialogInstance = null;

// ─── Initialization ──────────────────────────────────────────────────────────

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready`);
});


// ─── Scene Control Button ────────────────────────────────────────────────────

Hooks.on("getSceneControlButtons", (controls) => {
  // Show if player forced the setting on, or if the current user owns a Wild Shape actor
  const settingOn = game.settings.get(MODULE_ID, "showControlButton");
  const ownsWildShaper = game.actors?.some(
    (a) => a.isOwner && canWildShape(a)
  );
  if (!settingOn && !ownsWildShaper) return;

  const tokenControls = controls.tokens;
  if (!tokenControls) return;

  tokenControls.tools.wildShape = {
    name: "wildShape",
    title: game.i18n.localize("WILDSHAPE.ControlButton"),
    icon: "fa-solid fa-paw",
    onClick: () => openTransformationDialog(),
    button: true,
  };
});

// ─── Settings Page Promo ─────────────────────────────────────────────────────

Hooks.on("renderSettingsConfig", (app, html) => {
  const tab =
    html[0]?.querySelector?.(`.tab[data-tab="${MODULE_ID}"]`) ??
    html.querySelector?.(`.tab[data-tab="${MODULE_ID}"]`);
  if (!tab || tab.querySelector(".wild-shape-settings-promo")) return;
  const note = document.createElement("p");
  note.className = "wild-shape-settings-promo";
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
    ui.notifications.warn(game.i18n.localize("WILDSHAPE.Error.NoActor"));
    return;
  }

  // If the actor is polymorphed, we still allow opening (shows transformed view).
  // Only check canWildShape for non-polymorphed actors.
  if (!actor.isPolymorphed && !canWildShape(actor)) {
    ui.notifications.warn(game.i18n.localize("WILDSHAPE.Error.NotDruid"));
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

// ─── Public API ──────────────────────────────────────────────────────────────

// Expose for macros
Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = {
    open: openTransformationDialog,
  };
});
