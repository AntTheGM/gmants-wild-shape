# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-04-05

### Added
- One-click Wild Shape transformation from a single dialog
- Known Forms library — pick beast forms during onboarding, saved per-character
- Druid level rules enforcement (CR limits, form counts, fly restrictions)
- Circle of the Moon support (enhanced CR scaling, elemental forms at level 10)
- Resource tracking — automatically finds and decrements Wild Shape uses
- Configurable compendium scanning (supports multiple beast packs)
- Three dialog states: Onboarding, Transform, and Transformed views
- Revert to original form with one click
- Change form while already transformed (costs an additional use)
- Scene control toolbar button (toggleable in settings)
- Public API for macro access: `game.modules.get("gmants-wild-shape").api.open()`
- Compendium macro for hotbar drag-and-drop

### Changed
- Renamed from "5e Transformations" to "GMAnt's Wild Shape"
- Eladrin Season functionality extracted to standalone module (GMAnt's Eladrin)

[Unreleased]: https://github.com/AntTheGM/gmants-wild-shape/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AntTheGM/gmants-wild-shape/releases/tag/v1.0.0
