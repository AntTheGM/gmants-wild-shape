import { MODULE_ID, SEASONS } from "../const.js";
import {
  isEladrin,
  getCurrentSeason,
  setCurrentSeason,
  getSeasonLabel,
  getAllSeasons,
} from "./season-data.js";
import {
  getAllSeasonImages,
  saveCurrentAsSeason,
  applySeasonImages,
  deleteSeasonImages,
} from "./image-manager.js";
import { swapSeasonItems } from "./compendium-seeder.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EladrinSeasonDialog extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "eladrin-season-dialog",
    classes: ["transformations", "eladrin-season"],
    window: {
      title: "TRANSFORMATIONS.Eladrin.DialogTitle",
      icon: "fas fa-leaf",
      resizable: false,
    },
    position: { width: 380, height: "auto" },
    actions: {
      changeSeason: EladrinSeasonDialog.#onChangeSeason,
      saveSeason: EladrinSeasonDialog.#onSaveSeason,
      deleteSeason: EladrinSeasonDialog.#onDeleteSeason,
    },
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/eladrin-dialog.hbs`,
    },
  };

  /** @type {Actor5e} */
  #actor;

  constructor(actor) {
    super();
    this.#actor = actor;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const currentSeason = getCurrentSeason(this.#actor);
    const allImages = getAllSeasonImages(this.#actor);

    context.currentSeason = currentSeason;
    context.seasons = getAllSeasons().map((s) => ({
      ...s,
      isCurrent: s.id === currentSeason,
      images: allImages[s.id] ?? { token: null, portrait: null },
      hasImages: !!(allImages[s.id]?.token || allImages[s.id]?.portrait),
    }));
    context.hasAnyImages = context.seasons.some((s) => s.hasImages);

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#injectBranding();
    this.#restorePosition();
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Change to a different season.
   */
  static async #onChangeSeason(event, target) {
    const seasonId = target.dataset.season;
    if (!seasonId || !SEASONS[seasonId]) return;

    const currentSeason = getCurrentSeason(this.#actor);
    if (seasonId === currentSeason) return;

    // Apply saved images (warn if none saved)
    const applied = await applySeasonImages(this.#actor, seasonId);
    if (!applied) {
      ui.notifications.info(
        game.i18n.format("TRANSFORMATIONS.Eladrin.NoImagesForSeason", {
          season: getSeasonLabel(seasonId),
        })
      );
    }

    // Update season flag
    await setCurrentSeason(this.#actor, seasonId);

    // Swap Fey Step and Eladrin Season items
    await swapSeasonItems(this.#actor, seasonId);

    // Chat message
    await ChatMessage.create({
      content: game.i18n.format("TRANSFORMATIONS.Eladrin.ChatChange", {
        name: this.#actor.name,
        season: getSeasonLabel(seasonId),
      }),
      speaker: ChatMessage.getSpeaker({ actor: this.#actor }),
    });

    ui.notifications.info(
      game.i18n.format("TRANSFORMATIONS.Eladrin.SeasonChanged", {
        season: getSeasonLabel(seasonId),
      })
    );

    await this.close();
  }

  /**
   * Save the actor's current look as a season's images.
   */
  static async #onSaveSeason(event, target) {
    const seasonId = target.dataset.season;
    if (!seasonId || !SEASONS[seasonId]) return;

    await saveCurrentAsSeason(this.#actor, seasonId);

    ui.notifications.info(
      game.i18n.format("TRANSFORMATIONS.Eladrin.ImageSaved", {
        season: getSeasonLabel(seasonId),
      })
    );

    this.render();
  }

  /**
   * Delete saved images for a single season.
   */
  static async #onDeleteSeason(event, target) {
    const seasonId = target.dataset.season;
    if (!seasonId || !SEASONS[seasonId]) return;

    const label = getSeasonLabel(seasonId);
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.format("TRANSFORMATIONS.Eladrin.DeleteImagesTitle", { season: label }) },
      content: game.i18n.format("TRANSFORMATIONS.Eladrin.DeleteImagesConfirm", { season: label }),
    });
    if (!confirmed) return;

    await deleteSeasonImages(this.#actor, seasonId);
    ui.notifications.info(
      game.i18n.format("TRANSFORMATIONS.Eladrin.ImagesDeleted", { season: label })
    );
    this.render();
  }

  // ── Branding & Position ─────────────────────────────────────────────────

  #injectBranding() {
    const header = this.element.querySelector(".window-header");
    if (!header || header.querySelector(".transformations-branding")) return;
    const brand = document.createElement("a");
    brand.className = "transformations-branding";
    brand.textContent = "VTTools by GM Ant";
    brand.href = "https://roleplayr.com/gmant";
    brand.target = "_blank";
    brand.rel = "noopener";
    header.insertBefore(brand, header.lastElementChild);
  }

  async close(options) {
    const pos = this.position;
    if (pos?.left != null && pos?.top != null) {
      await game.settings.set(MODULE_ID, "eladrinDialogPosition", {
        left: pos.left,
        top: pos.top,
      });
    }
    return super.close(options);
  }

  #restorePosition() {
    const saved = game.settings.get(MODULE_ID, "eladrinDialogPosition");
    if (saved?.left != null && saved?.top != null) {
      this.setPosition({ left: saved.left, top: saved.top });
    }
  }
}
