# 5e Transformations — CLAUDE.md

## Overview

Wild Shape and transformation manager for D&D 5e. Lets druids pick known beast forms from compendiums, transform with one click, and revert easily. Designed to eventually support Polymorph and other transformation effects beyond just Wild Shape.

**Module ID:** `5e-transformations`
**System:** D&D 5e (dnd5e)
**Status:** Active development
**Brand:** VTTools by GM Ant

## Architecture

Single ApplicationV2 dialog (`TransformationDialog`) with three view states:

1. **Onboarding** — Pick known beast forms filtered by druid level rules
2. **Transform** — Click a known form to Wild Shape (costs a resource use)
3. **Transformed** — See current form, revert, or change to another form

### Key Files

| File | Purpose |
|------|---------|
| `scripts/main.js` | Entry point, hooks, scene control button, public API |
| `scripts/const.js` | MODULE_ID, FLAGS, DRUID_RULES level table |
| `scripts/settings.js` | Settings registration (beast compendiums, dialog position) |
| `scripts/druid-rules.js` | Level/subclass rule engine (CR limits, form counts, fly) |
| `scripts/compendium-scanner.js` | Query compendiums for beasts using pack index |
| `scripts/resource-tracker.js` | Find & decrement Wild Shape resource on character |
| `scripts/dialog/TransformationDialog.js` | Main ApplicationV2 dialog (all 3 views) |

### Data Storage

Known forms stored as actor flags:
```
flags['5e-transformations'].knownForms = [{ uuid, name, img, cr }, ...]
```

### 5e System API Usage

- `actor.transformInto(sourceActor, settings)` — applies Wild Shape
- `actor.revertOriginalForm()` — reverts transformation
- `actor.isPolymorphed` — check transformation state
- `CONFIG.DND5E.transformation.presets.wildshape.settings` — preset values
- `fromUuid()` — loads compendium actors without world import

### Druid Level Rules

| Level | Known Forms | Max CR | Fly |
|-------|-------------|--------|-----|
| 2 | 4 | 1/4 | No |
| 4 | 6 | 1/2 | No |
| 8 | 8 | 1 | Yes |

Moon Druid: CR 1 at level 2, floor(level/3) at 4+, elementals at 10.

## Eladrin Season Transformations

Separate dialog for Eladrin characters to change their season (Spring, Summer, Autumn, Winter). Swaps token image, character portrait, Fey Step racial feature, and Eladrin Season tracker item.

### Eladrin Key Files

| File | Purpose |
|------|---------|
| `scripts/eladrin/eladrin-dialog.js` | `EladrinSeasonDialog` — ApplicationV2 dialog |
| `scripts/eladrin/season-data.js` | Season definitions, `isEladrin()` detection, getters/setters |
| `scripts/eladrin/image-manager.js` | Save/load per-season token + portrait from actor flags |
| `scripts/eladrin/compendium-seeder.js` | Item lookup and swap logic (pulls from pre-built compendium) |
| `templates/eladrin-dialog.hbs` | Dialog template |

### Eladrin Data Storage

```
flags['5e-transformations'].eladrinSeason = "spring"
flags['5e-transformations'].eladrinImages = {
  spring:  { token: "path/to/token.webp", portrait: "path/to/portrait.webp" },
  summer:  { ... }, autumn: { ... }, winter: { ... }
}
flags['5e-transformations'].eladrinOptIn = true  // manual opt-in for non-Eladrin actors
```

### Eladrin Detection

Two paths in `isEladrin(actor)`:
1. Auto-detect: checks race item name or `system.details.race` for "Eladrin"
2. Manual opt-in: `eladrinOptIn` flag (toggled via actor sheet header button)

### Season Change Flow

1. Swap token/portrait images from saved flags
2. Update `eladrinSeason` flag
3. Remove old Fey Step + Eladrin Season items from actor
4. Add new season's items from `5e-transformations-eladrin` compendium (preserves spent uses)
5. Post chat message

### Eladrin Compendium

Pre-built LevelDB pack `5e-transformations-eladrin` with 8 items (4 Fey Step variants + 4 season trackers). Source JSON in `packs/_source/5e-transformations-eladrin/`.

### Eladrin Public API

```javascript
game.modules.get("5e-transformations").api.eladrin()
```

## Deployment

```bash
bash deploy.sh
```
Copies to `R:\Foundry\Data\modules\5e-transformations\`

## Public API (for macros)

```javascript
game.modules.get("5e-transformations").api.open()
```
