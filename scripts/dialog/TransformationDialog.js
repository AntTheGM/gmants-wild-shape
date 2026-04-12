import { MODULE_ID, FLAGS } from "../const.js";
import { canWildShape, getDruidLevel, getFormRules, formatCR } from "../druid-rules.js";
import { scanForBeasts, loadActorFromUuid } from "../compendium-scanner.js";
import { getWildShapeUses, decrementWildShapeUse } from "../resource-tracker.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TransformationDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "wild-shape-dialog",
    classes: ["wild-shape"],
    window: {
      title: "WILDSHAPE.Dialog.Title",
      icon: "fas fa-paw",
      resizable: false,
    },
    position: { width: 420, height: "auto" },
    actions: {
      selectForm: TransformationDialog.#onSelectForm,
      deselectForm: TransformationDialog.#onDeselectForm,
      confirmForms: TransformationDialog.#onConfirmForms,
      transform: TransformationDialog.#onTransform,
      revert: TransformationDialog.#onRevert,
      previewForm: TransformationDialog.#onPreviewForm,
      editForms: TransformationDialog.#onEditForms,
    },
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/transformation-dialog.hbs`,
    },
  };

  /** @type {Actor5e} */
  #actor;

  /** @type {"onboarding"|"transform"|"transformed"} */
  #viewState;

  /** @type {Array} Cached compendium scan results */
  #availableBeasts = [];

  /** @type {Set<string>} UUIDs selected during onboarding */
  #selectedFormUuids = new Set();

  /** @type {boolean} */
  #isLoading = false;

  constructor(actor) {
    super();
    this.#actor = actor;
    this.#determineViewState();
  }

  /**
   * Determine view state from actor flags and transformation status.
   */
  #determineViewState() {
    if (this.#actor.isPolymorphed) {
      this.#viewState = "transformed";
    } else {
      const knownForms = this.#actor.getFlag(MODULE_ID, FLAGS.KNOWN_FORMS);
      this.#viewState = knownForms?.length > 0 ? "transform" : "onboarding";
    }
  }

  /**
   * Resolve the original (non-polymorphed) actor for reading flags.
   */
  #getOriginalActor() {
    if (!this.#actor.isPolymorphed) return this.#actor;
    const originalId = this.#actor.getFlag("dnd5e", "originalActor");
    return originalId ? game.actors.get(originalId) : this.#actor;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.viewState = this.#viewState;

    const originalActor = this.#getOriginalActor();
    const rules = getFormRules(originalActor);
    context.rules = rules
      ? { ...rules, maxCRDisplay: formatCR(rules.maxCR) }
      : { maxForms: 4, maxCR: 0.25, maxCRDisplay: "1/4", allowFly: false, allowElemental: false };

    if (this.#viewState === "onboarding") {
      // Scan compendiums if we haven't yet
      if (this.#availableBeasts.length === 0 && !this.#isLoading) {
        this.#isLoading = true;
        this.#availableBeasts = await scanForBeasts(rules);
        this.#isLoading = false;
      }

      context.availableBeasts = this.#availableBeasts.map((beast) => ({
        ...beast,
        crDisplay: formatCR(beast.cr),
        selected: this.#selectedFormUuids.has(beast.uuid),
      }));
      context.selectedCount = this.#selectedFormUuids.size;
      context.isLoading = this.#isLoading;
      context.canConfirm =
        this.#selectedFormUuids.size > 0 &&
        this.#selectedFormUuids.size <= (rules?.maxForms ?? 4);
      context.noCompendiums = this.#availableBeasts.length === 0 && !this.#isLoading;
    } else if (this.#viewState === "transform") {
      const knownForms = originalActor.getFlag(MODULE_ID, FLAGS.KNOWN_FORMS) ?? [];
      context.knownForms = knownForms.map((f) => ({
        ...f,
        crDisplay: formatCR(f.cr),
      }));
      const uses = getWildShapeUses(originalActor);
      context.uses = uses;
      context.hasUses = uses ? uses.current > 0 : false;
      context.noResource = !uses;
    } else if (this.#viewState === "transformed") {
      // Current form info from the polymorphed actor
      context.currentForm = {
        name: this.#actor.name,
        img: this.#actor.img,
      };

      const knownForms = originalActor.getFlag(MODULE_ID, FLAGS.KNOWN_FORMS) ?? [];
      context.knownForms = knownForms.map((f) => ({
        ...f,
        crDisplay: formatCR(f.cr),
      }));

      const uses = getWildShapeUses(originalActor);
      context.uses = uses;
      context.hasUses = uses ? uses.current > 0 : false;
    }

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#injectBranding();
    this.#restorePosition();
    this.#bindCardClicks();
    this.#wireConfig();
  }

  /**
   * Bind click listeners on form cards and beast entries.
   * ApplicationV2 data-action delegation only fires on interactive elements
   * (buttons, anchors), so divs need manual binding.
   */
  #bindCardClicks() {
    // Onboarding beast entries (click row to preview)
    for (const entry of this.element.querySelectorAll(".wild-shape-beast-entry[data-uuid]")) {
      entry.addEventListener("click", async (event) => {
        if (event.target.closest(".wild-shape-beast-check")) return;
        const uuid = entry.dataset.uuid;
        if (!uuid) return;
        await this.#safePreview(uuid);
      });
    }

    // Onboarding checkboxes (toggle selection)
    for (const check of this.element.querySelectorAll(".wild-shape-beast-check")) {
      check.addEventListener("click", (event) => {
        event.stopPropagation();
        const uuid = check.dataset.uuid;
        if (!uuid) return;
        if (check.checked) {
          const rules = getFormRules(this.#getOriginalActor());
          if (this.#selectedFormUuids.size >= (rules?.maxForms ?? 4)) {
            ui.notifications.warn(
              game.i18n.format("WILDSHAPE.Error.MaxForms", { max: rules.maxForms })
            );
            check.checked = false;
            return;
          }
          this.#selectedFormUuids.add(uuid);
        } else {
          this.#selectedFormUuids.delete(uuid);
        }
        this.render();
      });
    }
  }

  /**
   * Wire the config towel — resize on toggle, noConsume enables/disables cards.
   */
  #wireConfig() {
    const config = this.element.querySelector(".wild-shape-config");
    if (config) {
      config.addEventListener("toggle", () => {
        this.setPosition({ height: "auto" });
      });
    }

    const noConsumeCb = this.element.querySelector('[name="noConsume"]');
    if (noConsumeCb) {
      noConsumeCb.addEventListener("change", () => {
        const cards = this.element.querySelectorAll(".wild-shape-form-card");
        for (const card of cards) {
          if (noConsumeCb.checked) {
            card.classList.remove("wild-shape-disabled");
          } else {
            // Re-check actual uses to decide disabled state
            const uses = getWildShapeUses(this.#getOriginalActor());
            if (!uses || uses.current <= 0) card.classList.add("wild-shape-disabled");
          }
        }
      });
    }
  }

  #injectBranding() {
    const header = this.element.querySelector(".window-header");
    if (!header || header.querySelector(".wild-shape-branding")) return;
    const brand = document.createElement("a");
    brand.className = "wild-shape-branding";
    brand.textContent = "VTTools by GM Ant";
    brand.href = "https://roleplayr.com/gmant";
    brand.target = "_blank";
    brand.rel = "noopener";
    header.insertBefore(brand, header.lastElementChild);
  }

  async close(options) {
    const pos = this.position;
    if (pos?.left != null && pos?.top != null) {
      await game.settings.set(MODULE_ID, "dialogPosition", {
        left: pos.left,
        top: pos.top,
      });
    }
    return super.close(options);
  }

  #restorePosition() {
    const saved = game.settings.get(MODULE_ID, "dialogPosition");
    if (saved?.left != null && saved?.top != null) {
      this.setPosition({ left: saved.left, top: saved.top });
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Toggle a beast form selection ON.
   */
  static #onSelectForm(event, target) {
    event.stopPropagation();
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;

    const rules = getFormRules(this.#getOriginalActor());
    if (this.#selectedFormUuids.size >= (rules?.maxForms ?? 4)) {
      ui.notifications.warn(
        game.i18n.format("WILDSHAPE.Error.MaxForms", { max: rules.maxForms })
      );
      return;
    }
    this.#selectedFormUuids.add(uuid);
    this.render();
  }

  /**
   * Toggle a beast form selection OFF.
   */
  static #onDeselectForm(event, target) {
    event.stopPropagation();
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    this.#selectedFormUuids.delete(uuid);
    this.render();
  }

  /**
   * Confirm selected forms and save to actor flags.
   */
  static async #onConfirmForms() {
    if (this.#selectedFormUuids.size === 0) return;

    const formData = [];
    for (const uuid of this.#selectedFormUuids) {
      const beast = this.#availableBeasts.find((b) => b.uuid === uuid);
      if (beast) {
        formData.push({
          uuid: beast.uuid,
          name: beast.name,
          img: beast.img,
          cr: beast.cr,
        });
      }
    }

    await this.#actor.setFlag(MODULE_ID, FLAGS.KNOWN_FORMS, formData);
    this.#viewState = "transform";
    this.render();
  }

  /**
   * Transform into a selected beast form (static action handler delegate).
   */
  static async #onTransform(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (uuid) await this.#handleTransform(uuid);
  }

  /**
   * Core transformation logic.
   */
  async #handleTransform(uuid) {
    const originalActor = this.#getOriginalActor();

    // Decrement Wild Shape use (unless "no consume" is checked)
    const noConsume = this.element.querySelector('[name="noConsume"]')?.checked;
    if (!noConsume) {
      const success = await decrementWildShapeUse(originalActor);
      if (!success) {
        ui.notifications.warn(game.i18n.localize("WILDSHAPE.Error.NoUses"));
        return;
      }
    }

    // Load the full beast actor from compendium
    const sourceActor = await loadActorFromUuid(uuid);
    if (!sourceActor) {
      ui.notifications.error(game.i18n.localize("WILDSHAPE.Error.BeastNotFound"));
      return;
    }

    // Build Wild Shape transformation settings
    const presetSettings = CONFIG.DND5E?.transformation?.presets?.wildshape?.settings;
    let settings;
    if (presetSettings) {
      settings = new dnd5e.dataModels.settings.TransformationSetting({
        ...presetSettings,
        preset: "wildshape",
      });
    } else {
      settings = new dnd5e.dataModels.settings.TransformationSetting({
        preset: "wildshape",
      });
    }

    // Calculate Wild Shape temp HP grant: druid level × multiplier
    const druidLevel = getDruidLevel(originalActor);
    const multiplier = game.settings.get(MODULE_ID, "tempHpMultiplier") ?? 1;
    const wildShapeTempHp = druidLevel * multiplier;

    // Capture current temp HP before transformation replaces it
    const originalTempHp = this.#actor.system.attributes.hp.temp ?? 0;

    // Intercept the transform data before the new actor is created — this is
    // far more reliable than trying to find the actor after the fact.
    Hooks.once("dnd5e.transformActor", (host, source, d) => {
      const beastTempHp = d.system.attributes.hp?.temp ?? 0;
      d.system.attributes.hp.temp = Math.max(originalTempHp, wildShapeTempHp, beastTempHp);
      foundry.utils.setProperty(d, `flags.${MODULE_ID}.${FLAGS.PRE_TRANSFORM_TEMP_HP}`, originalTempHp);
      foundry.utils.setProperty(d, `flags.${MODULE_ID}.${FLAGS.WILD_SHAPE_TEMP_HP}`, wildShapeTempHp);
    });

    // Perform transformation
    await this.#actor.transformInto(sourceActor, settings);

    await this.close();
  }

  /**
   * Revert to original form.
   */
  static async #onRevert() {
    const beastTempHp = this.#actor.system.attributes.hp.temp ?? 0;
    const wildShapeTempHp = this.#actor.getFlag(MODULE_ID, FLAGS.WILD_SHAPE_TEMP_HP) ?? 0;
    const preTransformTempHp = this.#actor.getFlag(MODULE_ID, FLAGS.PRE_TRANSFORM_TEMP_HP) ?? 0;
    const persist = game.settings.get(MODULE_ID, "tempHpPersist");
    const original = game.actors.get(this.#actor.getFlag("dnd5e", "originalActor"));

    await this.#actor.revertOriginalForm({ renderSheet: true });

    // Calculate what temp HP the reverted actor should have.
    // Persist ON:  beast form's current temp HP carries over fully.
    // Persist OFF: subtract only the temp HP that wild shape actually added
    //   (if you already had more temp HP than wild shape grants, it added nothing).
    let revertedTempHp;
    if (persist) {
      revertedTempHp = beastTempHp;
    } else {
      const actualGain = Math.max(0, wildShapeTempHp - preTransformTempHp);
      revertedTempHp = Math.max(0, beastTempHp - actualGain);
    }

    if (original) {
      const postRevertTempHp = original.system.attributes.hp.temp ?? 0;
      if (postRevertTempHp !== revertedTempHp) {
        await original.update({ "system.attributes.hp.temp": revertedTempHp });
      }
    }

    await this.close();
  }

  /**
   * Preview a beast form by opening its actor sheet.
   */
  static async #onPreviewForm(event, target) {
    event.stopPropagation();
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    await this.#safePreview(uuid);
  }

  /**
   * Safely preview a compendium actor, handling permission errors gracefully.
   */
  async #safePreview(uuid) {
    try {
      const actor = await loadActorFromUuid(uuid);
      if (!actor) return;
      if (!actor.testUserPermission(game.user, "LIMITED")) {
        ui.notifications.info(game.i18n.localize("WILDSHAPE.Error.NoPermission"));
        return;
      }
      actor.sheet.render(true);
    } catch (err) {
      console.warn(`gmants-wild-shape | Cannot preview ${uuid}:`, err.message);
      ui.notifications.info(game.i18n.localize("WILDSHAPE.Error.NoPermission"));
    }
  }

  /**
   * Go back to onboarding to edit known forms.
   */
  static #onEditForms() {
    // Pre-populate selections from current known forms
    const knownForms = this.#actor.getFlag(MODULE_ID, FLAGS.KNOWN_FORMS) ?? [];
    this.#selectedFormUuids = new Set(knownForms.map((f) => f.uuid));
    this.#availableBeasts = []; // Force rescan
    this.#viewState = "onboarding";
    this.render();
  }
}
