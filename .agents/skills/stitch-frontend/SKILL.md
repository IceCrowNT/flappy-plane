---
name: stitch-frontend
description: Turn product or UI requests into a Stitch with Google design workflow, then translate the selected direction into build-ready frontend changes for this repo. Use when asked to redesign pages, create landing/dashboard/game UI concepts, modernize layout, improve visual hierarchy, or prepare prompts and implementation plans around Stitch-generated web or mobile screens.
---

# Stitch Frontend

Use Stitch as the design ideation step, then map the chosen concept back into the existing codebase instead of rebuilding the app structure blindly.

## Workflow

1. Read `references/flappy-plane-map.md` before changing layout, route structure, or visual language.
2. Convert the user's ask into a short Stitch prompt:
   - define the surface: `dashboard`, `game page`, `mobile menu`, or `component set`
   - define the mood with 3 to 5 concrete adjectives
   - define the product goal and the primary user action
   - define constraints from the current repo
3. Propose 2 directions when the request is broad:
   - one close to the current visual language
   - one bolder direction that still fits the project
4. After a direction is chosen, implement it in the existing HTML/CSS/JS structure with minimal route churn.

## Stitch Prompt Pattern

Use this format for prompt drafting:

```text
Design a [web/mobile] [surface] for "Sky Arcade", a small browser game collection that currently includes Flappy Plane and Wisp Forest.

Goal:
- [what this screen must help users do]

Visual direction:
- [3 to 5 concrete adjectives]
- [material, atmosphere, or genre cues]

Content requirements:
- [required sections or components]

Interaction requirements:
- [required CTA, navigation, states, or responsive behavior]

Constraints:
- Keep it practical to build with semantic HTML, CSS, and lightweight JS.
- Preserve separate routes for each game.
- Avoid generic SaaS styling and keep an arcade / handcrafted feel.
```

## Implementation Rules

- Preserve existing routes unless the user explicitly wants an IA change.
- Prefer editing `index.html`, `css/dashboard.css`, and the specific game page files before introducing new entry points.
- Keep typography, color, and motion intentional; do not drift into default white-card SaaS UI.
- Translate Stitch output into reusable classes and CSS variables, not one-off inline styles.
- If Stitch suggests components that conflict with the current game shell, adapt the component rather than forcing a full rewrite.
- When the user only asks to "use Stitch", deliver:
  - a cleaned-up Stitch prompt
  - the concrete implementation plan
  - the code changes in this repo

## Repo-Specific Targets

- Dashboard work usually maps to `index.html`, `css/dashboard.css`, and `js/dashboard.js`.
- Flappy Plane game shell usually maps to `games/flappy-plane/index.html` and `css/style.css`.
- Wisp Forest work usually maps to `games/wisp-forest/index.html`, `games/wisp-forest/style.css`, and `games/wisp-forest/main.js`.

## Decision Heuristics

- If the user wants a faster iteration, keep the existing DOM and restyle first.
- If the user wants a major redesign, rewrite the section structure but preserve route-level boundaries.
- If the request is ambiguous, bias toward a web dashboard concept because the repo entry point is the arcade dashboard.
