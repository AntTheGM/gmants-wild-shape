# Eladrin Season Transformations

**Status**: Complete
**Last Updated**: 2026-04-04

---

## Overview

Eladrin Season Transformations extends the 5e Transformations module with support for Eladrin characters changing their season (Spring, Summer, Autumn, Winter). Unlike Wild Shape — which uses the dnd5e `transformInto()` API to fully swap the actor — an Eladrin season change is cosmetic + feature-level: the character stays themselves but their token image, character portrait, and Fey Step racial ability swap to match the new season.

The feature adds a dedicated `EladrinSeasonDialog` (ApplicationV2) with its own scene control button, compendium macro, and settings toggle. Players or GMs configure season images by posing the character (setting token/portrait to the desired look) and clicking "Save as [Season]." Changing season is free — no resource cost, no rest requirement.

---

## Goals

1. **One-click season swap** — Change an Eladrin's season from a simple dialog: swap token, portrait, and Fey Step ability in one action
2. **Visual configuration** — Players/GMs capture their own per-season token and portrait art via a "save current look" workflow
3. **Feature item swap** — Remove the old season's Fey Step variant and Eladrin Season tracker, add the new season's versions from the module compendium
4. **Optional MIDI QOL support** — Setting to toggle whether Fey Step items include MIDI QOL automation fields (clean 5e items by default)
5. **Independent from Wild Shape** — Separate dialog, button, macro, and settings — does not interfere with the existing druid workflow

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `scripts/eladrin/eladrin-dialog.js` | `EladrinSeasonDialog` — ApplicationV2 dialog |
| `scripts/eladrin/season-data.js` | Season definitions, detection logic, item swap helpers |
| `scripts/eladrin/image-manager.js` | Save/load per-season token + portrait from actor flags |
| `templates/eladrin-dialog.hbs` | Handlebars template for the season dialog |

### Modified Files

| File | Changes |
|------|---------|
| `scripts/main.js` | Add eladrin scene control button, eladrin API endpoint, eladrin settings toggle hook |
| `scripts/settings.js` | Add `showEladrinButton`, `eladrinDialogPosition`, `useMidiQol` settings |
| `scripts/const.js` | Add `ELADRIN_FLAGS`, `SEASONS` constants |
| `lang/en.json` | Add all eladrin i18n strings |
| `styles/module.css` | Add eladrin dialog styles |
| `module.json` | Add eladrin item compendium pack |

### Data Storage

Per-season images stored as actor flags:
```
flags['5e-transformations'].eladrinSeason = "spring"
flags['5e-transformations'].eladrinImages = {
  spring:  { token: "path/to/token.webp", portrait: "path/to/portrait.webp" },
  summer:  { token: "...", portrait: "..." },
  autumn:  { token: "...", portrait: "..." },
  winter:  { token: "...", portrait: "..." }
}
flags['5e-transformations'].eladrinOptIn = true  // manual opt-in for non-Eladrin actors
```

### Dialog Layout

```
┌──────────────────────────────────────┐
│  🍂 Eladrin Season    VTTools by GM  │
├──────────────────────────────────────┤
│  ┌────────┐ ┌────────┐              │
│  │ Spring │ │ Summer │              │
│  └────────┘ └────────┘              │
│  ┌────────┐ ┌────────┐              │
│  │ Autumn │ │ Winter │  ← current   │
│  │ (glow) │ │        │    has gold  │
│  └────────┘ └────────┘    border    │
│                                      │
│  ▸ Season Configuration              │
│  ┌──────────────────────────────────┐│
│  │ Spring:  [token img] [portrait] ││
│  │          [Save Current as Spring]││
│  │ Summer:  [token img] [portrait] ││
│  │          [Save Current as Summer]││
│  │ ...                              ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### Season Change Flow

1. Player clicks a season button (e.g., "Autumn")
2. Module reads saved images for Autumn from actor flags
3. Updates `actor.prototypeToken.texture.src` and `actor.img` (portrait)
4. Updates the active token on canvas: `token.document.update({ texture: { src } })`
5. Searches actor items for existing Fey Step variant (by name pattern `Fey Step:`) and `Eladrin Season:` tracker
6. Removes old items, adds new season's items from module compendium
7. Updates `eladrinSeason` flag to "autumn"
8. Posts a chat card: "[Character] shifts to their Autumn aspect."

### Eladrin Detection

Two-path detection in `season-data.js`:
1. **Auto-detect**: Check `actor.system.details.race` or `actor.items` for race item with name containing "Eladrin"
2. **Manual opt-in**: Check `actor.getFlag(MODULE_ID, 'eladrinOptIn')`
3. Function: `isEladrin(actor)` returns `true` if either path matches

---

## Key Decisions

1. **Separate dialog, not a tab** — Wild Shape and Eladrin Season are fundamentally different features (full actor swap vs. cosmetic + item swap). A combined dialog would add complexity for no benefit. Each gets its own button and macro.

2. **"Save current look" workflow** — Rather than requiring users to provide file paths or browse a file picker, they set up their character visually, then click "Save as [Season]." This is intuitive and avoids filepath UX issues.

3. **Create our own Fey Step items** — The core dnd5e system doesn't have per-season Fey Step items. Chris-Premades has them but bundles all seasons as sub-activities on one item, which is confusing. We create clean, separate items per season in a module compendium.

4. **MIDI QOL as optional toggle** — Many users run MIDI QOL for automation; others don't. A world-level setting controls whether swapped Fey Step items include MIDI QOL fields. Clean items by default.

5. **No resource tracking** — Per the 2024 rules and user preference, Eladrin can change season freely at any time. No rest restriction enforced.

6. **Both auto-detect and opt-in** — Auto-detect covers standard Eladrin characters; opt-in flag allows homebrew characters (e.g., reflavored races) to use the feature.

---

## Fey Step Rules Reference

**Base ability (all seasons):** Bonus action, teleport up to 30 ft to unoccupied space you can see. Uses = proficiency bonus, recharges on long rest.

**3rd-level season effects** (DC = 8 + proficiency + Int/Wis/Cha, chosen at race selection):

| Season | Effect |
|--------|--------|
| **Autumn** | After teleport, up to 2 creatures within 10 ft must WIS save or be charmed for 1 minute (or until you/companions deal damage) |
| **Winter** | Before teleport, 1 creature within 5 ft must WIS save or be frightened until end of your next turn |
| **Spring** | Touch 1 willing creature within 5 ft; they teleport instead, appearing in unoccupied space within 30 ft of you |
| **Summer** | After teleport, each creature within 5 ft takes fire damage = your proficiency bonus |

---

## Implementation Phases

### Phase 1: Foundation — COMPLETE

Core infrastructure: constants, settings, detection logic, and the basic dialog that displays seasons.

- [x] Add eladrin constants to `scripts/const.js` (`SEASONS` enum, `ELADRIN_FLAGS`)
- [x] Add eladrin settings to `scripts/settings.js` (`showEladrinButton`, `eladrinDialogPosition`, `useMidiQol`)
- [x] Create `scripts/eladrin/season-data.js` with `isEladrin(actor)` detection and season definitions
- [x] Create `scripts/eladrin/image-manager.js` with save/load image flag helpers
- [x] Create `scripts/eladrin/eladrin-dialog.js` — basic ApplicationV2 dialog showing 4 season buttons with current season highlighted
- [x] Create `templates/eladrin-dialog.hbs` — template with season buttons and collapsible config section
- [x] Add eladrin i18n strings to `lang/en.json`
- [x] Add eladrin CSS to `styles/module.css`
- [x] Wire up scene control button and API in `scripts/main.js`

> **Watch out:** The scene control button hook (`getSceneControlButtons`) is already used for Wild Shape. Both buttons need to coexist — use the existing pattern but with a separate settings check.

### Phase 2: Image Management — COMPLETE

**Depends on:** Phase 1

The "save current look" workflow and image swapping on season change.

- [x] Implement "Save Current as [Season]" — captures `actor.img` and active token's `texture.src`, saves to actor flags
- [x] Show token + portrait thumbnails in the config section for each season (placeholder if not yet saved)
- [x] Implement season change image swap — update `actor.img`, `prototypeToken.texture.src`, and active canvas token
- [x] Post chat card on season change: "[Name] shifts to their [Season] aspect."
- [x] Handle edge cases: no images saved for target season (warn but allow), no active token on canvas (skip token update)

> **Watch out:** Updating `actor.img` is straightforward, but token texture requires both prototype token update (for future tokens) AND active token update (for the current scene). Use `token.document.update()` for the active token.

### Phase 3: Fey Step Item Swap — COMPLETE

**Depends on:** Phase 2

Create compendium items and implement the feature swap logic.

- [x] Create 4 Fey Step item JSON source files (Spring, Summer, Autumn, Winter) in `packs/_source/`
- [x] Create 4 Eladrin Season tracker item JSON source files
- [x] Add the items compendium pack to `module.json`
- [x] Build the LevelDB compendium from source JSON
- [x] Implement item swap logic in `season-data.js`: find existing Fey Step/Season items on actor, remove them, add new season's items from compendium
- [x] Wire item swap into the season change flow in the dialog
- [x] Add MIDI QOL toggle setting — when enabled, use alternate item versions with automation fields (stretch goal, can be a later phase)

> **Watch out:** Item UUIDs in compendiums are generated at build time. Use name-based lookup (`actor.items.find(i => i.name.startsWith("Fey Step:"))`) rather than UUID matching for finding existing items on the actor.

### Phase 4: Macro & Polish — COMPLETE

**Depends on:** Phase 3

Compendium macro, final polish, deployment.

- [x] Create "Change Season" macro JSON in `packs/_source/5e-transformations-macros/`
- [x] Rebuild the macros compendium to include the new macro
- [x] Add eladrin opt-in toggle (for non-Eladrin characters) — either via dialog config or right-click actor option
- [x] Update `CLAUDE.md` with eladrin architecture documentation
- [x] Update `README.md` with eladrin feature documentation
- [x] Deploy and test end-to-end

---

## Risks & Considerations

1. **Token update permissions** — Players may not have permission to update their own token texture via `token.document.update()`. May need to check `token.document.canUserModify()` and fall back to a GM socket call. Severity: Medium. Mitigation: test with player permissions early in Phase 2.

2. **Chris-Premades conflict** — Users with Chris-Premades may have its Eladrin items on their character already. Our item swap should handle finding and removing those gracefully (search by name pattern, not exact match). Severity: Low. Mitigation: use flexible name matching in Phase 3.

3. **MIDI QOL item format** — MIDI QOL item automation fields change between versions. Creating fully automated items is complex and version-dependent. Severity: Medium. Mitigation: ship clean items first, add MIDI QOL as a separate follow-up if needed.

4. **Race detection fragility** — The `system.details.race` field format varies (string in older 5e, item reference in newer 5e). Need to check both paths. Severity: Low. Mitigation: check race item name AND details.race string.

5. **Multiple tokens for same actor** — If an actor has multiple tokens on the canvas, all should update. Severity: Low. Mitigation: iterate `canvas.tokens.placeables.filter(t => t.actor?.id === actor.id)`.

---

## Open Questions

- [x] Should the Eladrin Season tracker items be passive features with no mechanical effect, or should they grant some system-level tag? (Likely passive — just a label)
- [x] Do we need to handle the ability modifier choice (Int/Wis/Cha) in the Fey Step items, or is that baked into the DC formula? (Check 5e system item schema)
- [x] Are per-season Fey Step items in the SRD? — No, only in Chris-Premades as sub-activities on one item
