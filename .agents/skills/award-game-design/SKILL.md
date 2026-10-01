---
name: award-game-design
description: Design and refine Adult Brain Training toward portfolio- and competition-ready game quality. Use for gameplay, progression, scoring, first-time experience, audiovisual feedback, visual identity, replayability, and holistic product decisions.
---

# Adult Brain Training — Award Game Design

## North star

Treat this as a designed game, not a collection of web utilities. Every decision should strengthen a coherent daily brain-training ritual with seven distinct challenges.

## Current game set

1. 快速心算 — processing speed / arithmetic
2. 瞬間記憶 — short-term and working memory
3. 邏輯推理 — constraint reasoning
4. 規則切換 — inhibition and cognitive flexibility
5. 舒爾特方格 — visual search and sustained attention
6. Stroop 顏色衝突 — interference control
7. 表裡不一 — selective attention under conflict

Daily Training runs all seven games as one complete session.

## Design priorities

### Game feel
- Input latency should feel immediate.
- Feedback should be legible within a glance.
- Avoid long explanations during active play.
- Preserve flow between rounds.

### Difficulty
- Increase reasoning depth, interference, memory load, switching cost, or reaction pressure.
- Do not rely only on larger numbers or more items.
- Early rounds establish the rule; later rounds stress execution.

### Scoring
- Score must reward both accuracy and speed without making random fast tapping optimal.
- Wrong answers must have a meaningful cost.
- Scores across modes should be broadly comparable but may use mode-specific formulas.
- Results should show useful performance facts, not diagnostic claims.

### Replayability
- Randomization must preserve fairness and solvability.
- Daily Training should preserve a coherent seven-game sequence while each individual game still contains fair randomized variation.
- Avoid repeating identical first-round states too often.

### Product identity
- One typography system, one spacing system, one motion language, one sound language.
- Each mini-game may have a distinct interaction, but should still feel part of the same product.
- Avoid generic AI-dashboard visuals and excessive cards, gradients, or decorative animation.

### First-session quality
A new player should understand:
1. what the game is;
2. how to start;
3. what each challenge expects;
4. why a result changed;
without reading a manual.

## Submission gate

Before declaring the project competition-ready:

- complete seven-game QA;
- complete Daily Training end-to-end QA;
- verify mobile-first ergonomics;
- verify keyboard support where appropriate;
- verify reduced-motion mode;
- pass Axe and Lighthouse gates;
- verify no ambiguous logic puzzles;
- review all scoring formulas;
- review sound and motion as a single system;
- run a final visual-craft and game-feel pass;
- verify the public build and same-SHA deployment evidence.

Do not call the product award-ready merely because it is technically complete.


## Supporting project skills

Use the project skill stack deliberately:

- `karpathy-guidelines`: constrain implementation scope, avoid speculative abstractions, and require verifiable success criteria.
- `brain7-ui-design`: define and review visual hierarchy, continuity, and award-oriented interface quality.
- `ui-motion` plus vendored motion skills: implement restrained transitions and interaction feedback.
- `brain7-dynamic-2d`: govern motion-heavy 2D gameplay such as Dynamic Schulte and future moving-object challenges.
- `brain-game-qa`: preserve unique solutions, browser flow, accessibility, performance, and deployment gates.

For a visual gameplay change, preferred sequence is:

1. Define the game/design contract.
2. Make the smallest implementation that satisfies it.
3. Review visual continuity and game feel.
4. Verify motion/performance if applicable.
5. Run cloud QA and only promote when the same SHA passes.


### Hallmark anti-slop gate

Before promoting a major homepage, navigation, visual-system, typography, or transition redesign, run the project skill `brain7-hallmark`.

Its role is to catch generic AI-generated UI tells, structural sameness, excessive cardification, scattered motion, mobile-only failures, and weak interaction states. It must preserve BRAIN/7 mechanics and brand rather than replacing them.

A visual change that passes gameplay QA but still looks templated is not considered submission-ready.
