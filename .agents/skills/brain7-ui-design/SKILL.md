---
name: brain7-ui-design
description: Design and review BRAIN/7 screens as one coherent award-oriented game product. Use for page structure, visual hierarchy, UI continuity, prototype work, and design review before implementation or promotion.
license: Project-adapted guidance; upstream references include Apache-2.0 full-stack-skills/design-skills.
---

# BRAIN/7 UI Design

## Purpose

Use this skill to keep BRAIN/7 from drifting back into a generic utility or quiz website. Treat every screen as part of one authored game.

This project-adapted skill is informed by:
- full-stack-skills/design-skills: ui-design-spec
- full-stack-skills/design-skills: ui-design-review
- full-stack-skills/design-skills: ui-design-visual
- full-stack-skills/design-skills: ui-design-continuity

Upstream repository: https://github.com/full-stack-skills/design-skills
Upstream license: Apache-2.0.

## 1. Define the design contract before changing UI

For each visual change, state:
- target screen or interaction;
- user action;
- required states;
- immutable game behavior;
- what is allowed to change;
- success criteria.

Do not use visual redesign as permission to alter scoring, question logic, or game rules unless explicitly requested.

## 2. Preserve BRAIN/7 continuity

The product identity is:
- BRAIN/7;
- seven independent challenges;
- one complete seven-game session;
- dark editorial / arcade visual language;
- restrained high-contrast accent system;
- compact, immediate game feedback.

Preserve:
- typography hierarchy;
- spacing rhythm;
- HUD language;
- button behavior;
- motion language;
- score presentation;
- seven-game numbering and identity.

A new game screen may have its own interaction, but it must still look like BRAIN/7.

## 3. Visual review

Before promotion, review:
- hierarchy: what is seen first, second, third;
- density: remove dashboard-like clutter;
- game feel: does the screen feel playable, not administrative;
- identity: does it look distinct from a generic AI-generated landing page;
- touch ergonomics: mobile targets and spacing;
- contrast and legibility;
- continuity with existing approved BRAIN/7 screens.

Classify findings:
- PASS
- FAIL
- NOT VERIFIED
- NEEDS DECISION

Do not silently repair unrelated areas during a scoped task.

## 4. Prototype discipline

For large redesigns:
1. preserve game logic;
2. change layout and visual language first;
3. verify browser behavior;
4. only then add extra motion or effects.

Prefer real HTML/CSS prototypes over static descriptions because this project ships as a browser game.

## 5. Award-oriented bar

Reject designs that look like:
- an admin dashboard;
- a generic SaaS landing page;
- a quiz form with decorative styling;
- seven unrelated demos;
- a template with excessive cards, gradients, and badges.

Prefer:
- one strong visual idea;
- intentional typography;
- clear pacing;
- visible game state;
- memorable transitions;
- restraint.

## 6. Cloud verification

Every promoted UI change must preserve:
- Playwright flow;
- Axe accessibility;
- Lighthouse median performance >= 90;
- reduced-motion support;
- GitHub Pages deployment for the same SHA.
