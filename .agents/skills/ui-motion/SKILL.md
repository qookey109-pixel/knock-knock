---
name: ui-motion
description: Design, implement, and review motion for the adult brain training game. Use for screen transitions, button feedback, score reveals, game-state changes, micro-interactions, and animation-performance work.
---

# Adult Brain Training Motion

## Goal

Motion must make the game feel authored, responsive, and coherent without slowing repeated play.

## Execution

- CLOUD_ONLY. Use repository code and GitHub Actions; never require the user's local machine.
- Preserve the seven independent game modes and their validated behavior.
- Prefer the cheapest mechanism that achieves the interaction: CSS first, View Transitions when supported, JavaScript only when interaction requires it.
- Do not add a runtime animation dependency for simple fades, presses, or screen changes.

## Motion language

- Frequent actions: immediate or near-immediate. Do not delay answers for decorative animation.
- Screen changes: short directional/fade transition, approximately 100–200 ms.
- Tap feedback: subtle scale/opacity feedback, approximately 80–150 ms.
- Correct answer: crisp positive confirmation; do not cover the next task.
- Incorrect answer: clear but restrained feedback; never shake the whole screen aggressively.
- Result reveal: may use slightly more expressive motion because it is infrequent.
- Prefer transform and opacity. Avoid continuous layout animation and expensive filters.

## Accessibility

- Every motion change must support `prefers-reduced-motion: reduce`.
- Reduced-motion mode must preserve information and state changes without requiring animation.
- Motion cannot be the only indicator of correct/incorrect state.

## Performance gate

- Browser QA must cover mobile and desktop.
- Lighthouse performance median must remain >= 90.
- Avoid layout-thrashing, unbounded requestAnimationFrame loops, scroll-linked JavaScript animation, and large blur/filter effects.

## Review gate

Before considering motion complete:

1. Explain what information or feedback the motion communicates.
2. Confirm it is appropriate for how frequently the action occurs.
3. Verify no keyboard/touch interaction is blocked by the animation.
4. Run Playwright + Axe.
5. Run Lighthouse cloud gate.
6. Verify reduced-motion behavior.

## References

Project motion choices may be informed by Emil Kowalski's public animation skills, UI Skills motion-performance guidance, and motion references such as 60fps. Do not copy third-party product identity or proprietary motion assets.
