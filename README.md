# GMAnt's Wild Shape

> One-click Wild Shape for D&D 5e druids — pick known beast forms, transform instantly, and revert with ease.

![License](https://img.shields.io/github/license/AntTheGM/gmants-wild-shape)
![Foundry](https://img.shields.io/badge/Foundry-v13-informational)
![Release](https://img.shields.io/github/v/release/AntTheGM/gmants-wild-shape)
![Downloads](https://img.shields.io/github/downloads/AntTheGM/gmants-wild-shape/total)

A **VTTools by GM Ant** module.

## Features

### One-Click Wild Shape
Select your druid's token and open the Wild Shape dialog from the scene controls or the compendium macro. Pick a beast form and transform instantly — no dragging actors, no fiddling with settings.

### Known Forms Library
Choose which beast forms your druid knows during onboarding. Forms are filtered by your druid's level and subclass rules so you only see what's legal. Your known forms are saved per-character and persist across sessions.

### Druid Level Rules
The module automatically enforces Wild Shape restrictions based on druid level:

| Level | Known Forms | Max CR | Fly |
|-------|-------------|--------|-----|
| 2 | 4 | 1/4 | No |
| 4 | 6 | 1/2 | No |
| 8 | 8 | 1 | Yes |

**Circle of the Moon** druids get enhanced rules: CR 1 at level 2, scaling CR at higher levels, and elemental forms at level 10.

### Three Dialog States
The Wild Shape dialog adapts to your current state:

1. **Onboarding** — Browse and pick known beast forms from configured compendiums, filtered by level rules
2. **Transform** — See your known forms at a glance and click to Wild Shape (costs a resource use)
3. **Transformed** — View your current form, revert to your original form, or shift into a different beast

### Resource Tracking
Wild Shape uses are automatically tracked and decremented when you transform. The module finds your character's Wild Shape resource and manages it for you.

### Configurable Compendiums
GMs can configure which compendium packs are scanned for beast forms. Defaults to the core `dnd5e.monsters` pack, but supports any number of comma-separated compendium IDs — including third-party monster packs.

## Installation

### Method 1: Manifest URL (Recommended)
In Foundry, go to **Add-on Modules** → **Install Module** and paste:

```
https://github.com/AntTheGM/gmants-wild-shape/releases/latest/download/module.json
```

### Method 2: Manual Download
Download the latest release from [GitHub Releases](https://github.com/AntTheGM/gmants-wild-shape/releases) and extract to your `Data/modules/gmants-wild-shape/` directory.

## Usage

1. **Enable the module** in your world's Module Management screen
2. **Select a druid token** and click the paw icon in the scene controls (or use the compendium macro)
3. **Pick known forms** during onboarding — the module filters beasts by your druid's level rules
4. **Click a form to transform** — the module handles the 5e transformation API and resource tracking
5. **Revert** when done — one click returns you to your original form

## Configuration

| Setting | Scope | Description |
|---------|-------|-------------|
| Beast Compendiums | World | Comma-separated compendium pack IDs to scan for beast forms (default: `dnd5e.monsters`) |
| Show Control Button | World | Show the Wild Shape paw icon in the scene controls toolbar |

## Public API

Open the Wild Shape dialog from a macro or script:

```javascript
game.modules.get("gmants-wild-shape").api.open()
```

## Compatibility

- **Foundry VTT:** v13+
- **D&D 5e System:** v5.0.0+
- **Other Systems:** Not supported

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- **Issues:** [GitHub Issues](https://github.com/AntTheGM/gmants-wild-shape/issues)
- **More tools:** [roleplayr.com/gmant](https://roleplayr.com/gmant)

## License

This module is licensed under the [MIT License](LICENSE).

## Credits

**VTTools by GM Ant** — virtual tabletop tools for GMs and players.
