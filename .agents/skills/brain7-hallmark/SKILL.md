---
name: brain7-hallmark
description: Audit and refine BRAIN/7 against AI-generated UI tells and structural sameness while preserving the game's own brand, mechanics, accessibility, performance, and cloud-only workflow. Use before promoting major UI, homepage, transition, typography, or interaction changes.
license: Project-adapted guidance derived from MIT-licensed Nutlope/hallmark.
---

# BRAIN/7 Hallmark

## Role

This is an audit and refinement layer, not permission to rebuild the game.

BRAIN/7's existing product rules remain authoritative:
- seven independent games;
- one complete seven-game session;
- bright editorial / playful arcade identity;
- color-block navigation;
- purposeful motion and sound;
- mobile-first interaction;
- no medical, IQ, or diagnostic claims.

Hallmark is used to remove generic AI-generated design tells while keeping those rules intact.

Upstream:
- https://github.com/Nutlope/hallmark
- MIT License
- Hallmark 1.1.0 concepts used here: anti-pattern audit, structure variety, responsive gates, motion restraint, interaction states, typography discipline, pre-emit critique.

## 1. Pre-flight before a visual edit

Read:
- `adult-brain-training/index.html`
- `.agents/skills/brain7-ui-design/SKILL.md`
- `.agents/skills/ui-motion/SKILL.md`
- `.agents/skills/award-game-design/SKILL.md`
- latest cloud QA evidence

State:
- exact screen / interaction being changed;
- immutable gameplay behavior;
- intended visual or interaction gain;
- success criteria.

Never use a visual redesign as permission to alter scoring or puzzle logic.

## 2. BRAIN/7 anti-slop audit

Flag these as failures unless the project has an explicit, justified exception:

### Structural
- generic SaaS hero → feature cards → CTA rhythm;
- seven identical cards that differ only by color;
- nested cards without semantic need;
- all sections using identical spacing and containment;
- homepage that reads as a dashboard rather than a game;
- visual changes that do not change hierarchy or game feel.

### Visual
- purple/blue AI gradients;
- gradient headline text;
- decorative pills everywhere;
- invented metrics, testimonials, or proof;
- excessive shadows/glows;
- pure white or pure black used without a deliberate reason;
- one accent treatment repeated mechanically on every component;
- color used as the only carrier of meaning.

### Interaction
- hover-only behavior with no touch/focus equivalent;
- more than one or two simultaneous hover tricks on a control;
- animations that delay repeated gameplay;
- celebratory effects on routine actions;
- focus rings that animate in;
- touch targets under 44×44 CSS px.

### Motion
- random motion scattered across the page;
- bounce / elastic easing for normal UI;
- continuous decorative loops without gameplay meaning;
- layout-property animation where transform/opacity would work;
- more than three unrelated animation primitives on one screen.

## 3. Pre-emit critique

Before promoting a major UI change, score 1–5:

- Philosophy — is there a clear design position?
- Hierarchy — can the user understand the screen in two seconds?
- Execution — are spacing, contrast, focus, states, and details finished?
- Specificity — does this look like BRAIN/7 rather than a generic generated site?
- Restraint — is every effect earning its place?
- Variety — does the screen avoid mechanically repeating the previous screen?

Anything below 3 requires revision.

Record the result in the relevant design note or commit description. Do not add noisy comments to production HTML solely to satisfy the score.

## 4. Responsive hard floor

Verify at:
- 320 px
- 375 px
- 414 px
- 768 px
- desktop baseline

Requirements:
- no horizontal scroll;
- interactive text does not wrap awkwardly;
- no desktop-only interaction;
- touch controls >= 44 px;
- long headings can wrap safely;
- game targets remain reachable;
- the primary action remains obvious;
- coarse pointer and hover-capable pointer both have intentional states.

Use pointer / hover media queries for capability, not viewport width alone.

## 5. Interaction states

For production interactive controls, deliberately cover the states that apply:

- default
- hover
- focus-visible
- active / pressed
- disabled
- loading / in-progress when relevant
- error when relevant
- success when relevant

Not every game button needs all eight visible variants at once, but no state required by its behavior may be undefined.

Focus indicators must appear immediately and remain visible.

## 6. Motion language

BRAIN/7 already has a motion grammar. Preserve it.

Use:
- micro: 100–150 ms;
- minor: 200–300 ms;
- major: 300–500 ms;
- exponential ease-out for entry;
- transform + opacity whenever possible.

The current color-block entry transition is allowed because it communicates entering a circuit:
- short click sound;
- geometric burst;
- transition color wash;
- landing thump;
- then gameplay.

Do not reuse the same celebration for routine answers.

Reduced motion must collapse spatial effects to a short, functional transition.

## 7. Typography

Typography must feel intentional.

Current system fonts are allowed only as an explicit performance / CJK coverage choice, not by accident.

If typography is upgraded:
- preserve Traditional Chinese quality first;
- use no more than 2 main families + 1 optional outlier;
- keep display and body roles distinct;
- avoid decorative italic headings;
- do not add external font weight that materially harms Lighthouse without a strong design gain.

## 8. Audit output

For a Hallmark-style audit, produce:

- PASS — intentional and coherent;
- FAIL — concrete AI/slop tell or usability problem;
- NOT VERIFIED — evidence missing;
- NEEDS DECISION — valid design tradeoff.

Rank findings:
1. identity / structure;
2. interaction / game feel;
3. mobile usability;
4. accessibility;
5. visual polish.

Do not silently edit unrelated areas during an audit.

## 9. Promotion gate

A Hallmark-sensitive UI change is complete only when:

- BRAIN/7 product identity is preserved;
- no critical anti-slop finding remains;
- 320 / 375 / 414 / 768 behavior is acceptable;
- Playwright flows pass;
- Axe critical/serious violations = 0;
- Lighthouse median gates pass;
- reduced-motion behavior works;
- same-SHA GitHub Pages deploy succeeds.

Hallmark cannot override a failing gameplay or accessibility gate.
