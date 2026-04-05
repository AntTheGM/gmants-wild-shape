# GMAnt's Wild Shape — CLAUDE.md

## Overview

Wild Shape manager for D&D 5e. Lets druids pick known beast forms from compendiums, transform with one click, and revert easily. Designed to eventually support Polymorph and other transformation effects beyond just Wild Shape.

> **Note:** Eladrin Season functionality was migrated to standalone module
> [`gmants-eladrin`](https://github.com/AntTheGM/gmants-eladrin) (GMAnt's Eladrin).

**Module ID:** `gmants-wild-shape`
**System:** D&D 5e (dnd5e)
**Status:** Released (v1.0.0)
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
flags['gmants-wild-shape'].knownForms = [{ uuid, name, img, cr }, ...]
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

## Deployment

```bash
bash deploy.sh
```
Copies to `R:\Foundry\Data\modules\gmants-wild-shape\`

## Compendium Packs

Packs are static pre-built LevelDB. If content needs to change, rebuild the pack in Foundry and copy the folder back.

## Public API (for macros)

```javascript
game.modules.get("gmants-wild-shape").api.open()
```
