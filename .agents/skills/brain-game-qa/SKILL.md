---
name: brain-game-qa
description: Review, modify, and validate the adult-brain-training web game. Use for any change to its puzzles, scoring, interaction flow, accessibility, performance, or deployment.
---

# Adult Brain Training QA

Use this workflow for changes under `adult-brain-training/`.

## Authority and execution

- GitHub `main` is the project authority.
- This project is CLOUD_ONLY. Do not depend on the user's local machine, local files, desktop apps, or a powered-on computer.
- Before editing, read the latest `main` SHA, open pull requests, relevant workflow status, and the files needed for the change.
- Preserve the existing standalone Quick Math game unless the user explicitly asks to change it.

## Puzzle quality gate

For every logic-puzzle change:

1. Translate the visible clues into an independent formal model.
2. Enumerate or solve all candidate states.
3. Require exactly one valid solution.
4. Verify the displayed answer matches that unique solution.
5. Verify the explanation is consistent with every clue.
6. Update `qa/brain-game-qa.mjs` so the automated model matches the visible puzzle text.
7. Do not accept a puzzle merely because the intended answer seems plausible.

## Browser behavior gate

Use the cloud workflow in `.github/workflows/adult-brain-qa.yml`.

The browser QA must continue to cover:

- mobile viewport
- desktop viewport
- no horizontal overflow
- Quick Math input and correct-answer progression
- Memory display, hide, recall, and submission
- Logic choice, submission, and feedback
- critical/serious Axe accessibility violations

Keep primary controls operable by click/tap and keyboard where applicable.

## Lighthouse gate

Run Lighthouse in GitHub Actions against the locally served static site.

Minimum category scores:

- Performance: 90
- Accessibility: 90
- Best Practices: 90
- SEO: 90

Keep the JSON report as a workflow artifact.

## Completion gate

A change is not considered complete until:

- Brain Game Logic QA passes.
- Browser + Accessibility QA passes.
- Lighthouse Quality Gate passes.
- GitHub Pages deployment for the same latest SHA succeeds.

If any gate fails, inspect the cloud job logs, fix the concrete cause, and rerun through a new commit.

## Scope discipline

- Prefer small, compatible changes over rewrites.
- Do not remove working game modes or validated difficulty behavior without an explicit request.
- Keep the adult brain training page independent at `/adult-brain-training/`.
- Do not turn entertainment scores into IQ, medical, or cognitive-diagnostic claims.
