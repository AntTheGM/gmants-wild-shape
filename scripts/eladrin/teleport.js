import { MODULE_ID } from "../const.js";

/**
 * Register the Fey Step teleport handler.
 * Hooks into dnd5e.postUseActivity to intercept Fey Step usage
 * and provide interactive teleportation with range indicator.
 */
export function registerTeleportHandler() {
  Hooks.on("dnd5e.postUseActivity", async (activity, config, results) => {
    if (!activity?.item?.name?.startsWith("Fey Step")) return;

    const actName = activity.name ?? "";
    const isTeleport = actName.includes("Teleport") || actName.includes("Spring");
    if (!isTeleport) return;

    // Find the token
    const actor = activity.item.actor;
    const token =
      canvas.tokens.controlled[0] ??
      canvas.tokens.placeables.find((t) => t.actor?.id === actor?.id);
    if (!token) return;

    await teleportToken(token, 30);
  });
}

/**
 * Show a range indicator circle and let the player click to teleport.
 * @param {Token} token - The token to teleport
 * @param {number} rangeInFeet - Maximum teleport range in feet
 * @returns {Promise<boolean>} true if teleported, false if cancelled
 */
async function teleportToken(token, rangeInFeet) {
  const gridSize = canvas.grid.size;
  const gridDistance = canvas.grid.distance;
  const rangePixels = (rangeInFeet / gridDistance) * gridSize;
  const tokenWidthPx = token.document.width * gridSize;
  const tokenHeightPx = token.document.height * gridSize;

  // Token center in canvas coordinates
  const originX = token.center.x;
  const originY = token.center.y;

  // Draw range indicator on the grid layer
  const rangeCircle = new PIXI.Graphics();
  rangeCircle.lineStyle(2, 0x4a90d9, 0.8);
  rangeCircle.beginFill(0x4a90d9, 0.08);
  rangeCircle.drawCircle(originX, originY, rangePixels);
  rangeCircle.endFill();
  canvas.controls.addChild(rangeCircle);

  // Ghost token outline that follows the cursor
  const ghost = new PIXI.Graphics();
  ghost.visible = false;
  canvas.controls.addChild(ghost);

  function getCanvasPos(event) {
    const transform = canvas.stage.worldTransform;
    return {
      x: (event.global.x - transform.tx) / transform.a,
      y: (event.global.y - transform.ty) / transform.d,
    };
  }

  function snapToGrid(pos) {
    // Snap to top-left corner of grid cell
    const col = Math.floor(pos.x / gridSize);
    const row = Math.floor(pos.y / gridSize);
    return { x: col * gridSize, y: row * gridSize };
  }

  function drawGhost(gridPos, inRange) {
    ghost.clear();
    const color = inRange ? 0x44aa44 : 0xaa4444;

    // Ghost outline at grid position
    ghost.lineStyle(2, color, 0.7);
    ghost.beginFill(color, 0.15);
    ghost.drawRoundedRect(gridPos.x, gridPos.y, tokenWidthPx, tokenHeightPx, 4);
    ghost.endFill();

    ghost.visible = true;
  }

  function isInRange(gridPos) {
    // Check distance from token center to ghost center
    const ghostCenterX = gridPos.x + tokenWidthPx / 2;
    const ghostCenterY = gridPos.y + tokenHeightPx / 2;
    const dx = ghostCenterX - originX;
    const dy = ghostCenterY - originY;
    return Math.sqrt(dx * dx + dy * dy) <= rangePixels;
  }

  // Minimize character sheet if open
  if (token.actor?.sheet?.rendered) token.actor.sheet.minimize();

  return new Promise((resolve) => {
    let lastGridPos = null;

    function onMouseMove(event) {
      const canvasPos = getCanvasPos(event);
      const gridPos = snapToGrid(canvasPos);
      lastGridPos = gridPos;
      drawGhost(gridPos, isInRange(gridPos));
    }

    async function onClick(event) {
      if (!lastGridPos) return;

      if (!isInRange(lastGridPos)) {
        ui.notifications.warn("Target is out of range.");
        return;
      }

      cleanup();

      // Teleport with visual effects
      await performTeleport(token, lastGridPos);

      if (token.actor?.sheet?.rendered) token.actor.sheet.maximize();
      resolve(true);
    }

    function onRightClick(event) {
      event.preventDefault();
      event.stopPropagation();
      cleanup();
      if (token.actor?.sheet?.rendered) token.actor.sheet.maximize();
      resolve(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        cleanup();
        if (token.actor?.sheet?.rendered) token.actor.sheet.maximize();
        resolve(false);
      }
    }

    function cleanup() {
      canvas.controls.removeChild(rangeCircle);
      canvas.controls.removeChild(ghost);
      rangeCircle.destroy();
      ghost.destroy();
      canvas.stage.off("pointermove", onMouseMove);
      canvas.stage.off("pointerdown", onClick);
      canvas.stage.off("rightdown", onRightClick);
      document.removeEventListener("keydown", onKeyDown);
    }

    canvas.stage.on("pointermove", onMouseMove);
    canvas.stage.on("pointerdown", onClick);
    canvas.stage.on("rightdown", onRightClick);
    document.addEventListener("keydown", onKeyDown);
  });
}

/**
 * Perform the teleport with visual effects.
 * Uses Sequencer + JB2A if available, falls back to simple fade.
 * @param {Token} token
 * @param {{x: number, y: number}} destPos - Grid-snapped destination (top-left)
 */
async function performTeleport(token, destPos) {
  const gridSize = canvas.grid.size;
  const originCenter = { x: token.center.x, y: token.center.y };
  const destCenter = {
    x: destPos.x + (token.document.width * gridSize) / 2,
    y: destPos.y + (token.document.height * gridSize) / 2,
  };

  const hasSequencer = typeof Sequencer !== "undefined" && typeof Sequence !== "undefined";

  if (hasSequencer) {
    await teleportWithSequencer(token, originCenter, destCenter, destPos);
  } else {
    await teleportSimple(token, destPos);
  }
}

/**
 * Teleport using Sequencer + JB2A animations.
 */
async function teleportWithSequencer(token, originCenter, destCenter, destPos) {
  // Determine which animation files to use
  // JB2A free has misty step and generic teleport
  const mistyStep1 = "jb2a.misty_step.01.blue";
  const mistyStep2 = "jb2a.misty_step.02.blue";

  await new Sequence()
    // Origin effect: misty step departure
    .effect()
      .file(mistyStep1)
      .atLocation(originCenter)
      .scaleToObject(1.5)
      .waitUntilFinished(-1500)

    // Fade out token at origin
    .animation()
      .on(token)
      .fadeOut(200)

    // Brief pause while "in transit"
    .wait(200)

    // Move token instantly
    .thenDo(async () => {
      await token.document.update(
        { x: destPos.x, y: destPos.y },
        { animation: { duration: 0 } }
      );
    })

    .wait(100)

    // Destination effect: misty step arrival
    .effect()
      .file(mistyStep2)
      .atLocation(destCenter)
      .scaleToObject(1.5)

    // Fade token back in at destination
    .animation()
      .on(token)
      .fadeIn(300)

    .play();
}

/**
 * Simple teleport fallback without Sequencer.
 */
async function teleportSimple(token, destPos) {
  // Fade out
  await animateAlpha(token.mesh, 0, 150);

  // Move instantly
  await token.document.update(
    { x: destPos.x, y: destPos.y },
    { animation: { duration: 0 } }
  );

  // Fade in
  await animateAlpha(token.mesh, 1, 200);
}

/**
 * Simple alpha animation helper.
 */
function animateAlpha(target, toAlpha, durationMs) {
  if (!target) return Promise.resolve();
  return new Promise((resolve) => {
    const startAlpha = target.alpha;
    const delta = toAlpha - startAlpha;
    const startTime = performance.now();

    function tick() {
      const progress = Math.min((performance.now() - startTime) / durationMs, 1);
      target.alpha = startAlpha + delta * progress;
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}
