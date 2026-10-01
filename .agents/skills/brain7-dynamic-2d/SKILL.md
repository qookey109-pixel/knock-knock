---
name: brain7-dynamic-2d
description: Design and implement moving 2D gameplay for BRAIN/7, especially Dynamic Schulte and future motion-heavy mini-games. Use when DOM layout is no longer sufficient and precise animation, hit-testing, motion, or 60fps behavior matters.
license: Project-adapted guidance; upstream references include MIT-licensed pixijs/pixijs-skills.
---

# BRAIN/7 Dynamic 2D

## Purpose

Use this skill for gameplay where many objects move continuously and must remain responsive on mobile.

Primary current target:
- Dynamic Schulte / Search Drift.

This project-adapted skill is informed by PixiJS skills covering:
- application lifecycle;
- pointer and touch events;
- coordinates and hit testing;
- ticker/render loops;
- performance;
- accessibility.

Upstream repository: https://github.com/pixijs/pixijs-skills
Upstream license: MIT.

## 1. Choose DOM or PixiJS deliberately

Stay with DOM/CSS when:
- movement is sparse;
- fewer than roughly a few dozen elements move;
- accessibility requires native controls;
- the interaction is primarily form-like.

Consider PixiJS when:
- many objects drift continuously;
- positions update every frame;
- collision avoidance or constrained movement matters;
- hit-testing must stay accurate during motion;
- CSS layout becomes the performance bottleneck.

Do not migrate an entire game to PixiJS just because one effect looks interesting.

## 2. Dynamic Schulte rules

For moving-number modes:
- targets drift slowly and continuously;
- targets must never become impossible to tap;
- motion must stay inside a safe playfield;
- avoid overlapping targets;
- each correct answer may trigger a position refresh;
- wrong answers must not advance the sequence;
- the next target must always be explicit.

Supported challenge patterns may include:
- ascending: 1 → 25, 1 → 50;
- descending: 50 → 1;
- ranged ascending: 18 → 68;
- ranged descending;
- randomized valid start/end ranges.

## 3. Motion quality

Movement should feel alive, not chaotic:
- low acceleration;
- bounded speed;
- no teleporting unless a deliberate post-answer reshuffle occurs;
- no high-frequency shaking;
- avoid motion that causes visual discomfort.

On each correct answer:
- acknowledge the tapped target;
- remove or mark it;
- update the next target;
- optionally reshuffle remaining targets;
- resume drift immediately.

## 4. Input

Pointer/touch hit areas must be larger than the visible number when needed.

Verify:
- touch;
- mouse;
- no stale hitbox after movement;
- no target can move under UI chrome;
- one tap produces one answer.

## 5. Performance

Target smooth mobile behavior:
- use one shared ticker/render loop;
- avoid per-object timers;
- reuse objects when practical;
- avoid expensive filters and blur;
- stop rendering when the game screen is inactive;
- respect device pixel ratio conservatively.

Do not add PixiJS if a simple CSS transform solution already meets performance and interaction goals.

## 6. Accessibility fallback

Canvas gameplay must still expose:
- game instructions;
- current target;
- progress;
- results;
- a reduced-motion alternative.

If a moving-canvas version is not reasonably accessible, provide a static DOM mode rather than pretending it is equivalent.

## 7. Verification

Before promotion:
- mobile Playwright flow passes;
- hit-testing remains correct during movement;
- no overlap makes a target unreachable;
- reduced-motion mode is usable;
- Lighthouse performance median remains >= 90;
- no console errors or runaway animation loops.
