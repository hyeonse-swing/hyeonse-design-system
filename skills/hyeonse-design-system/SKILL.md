---
name: hyeonse-design-system
description: Build, extend, map, migrate, review, or document interfaces using Hyeonse Design System in personal projects. Use for design-system work; skip unrelated routine code edits.
---

# Hyeonse Design System

Use the installed package and this skill's [visual contract](references/foundations.md) for personal-project design-system work. Inspect the target app and requested scope first. Preserve existing behavior and purpose; a screen request does not authorize an app-wide migration.

For package API, token values, or examples, query the installed version with `npm exec --no -- hds list`, `hds show <export-name>`, `hds tokens [name]`, or `hds example <id>` (use `npm run hds -- ...` inside this repository). Check its public TypeScript declarations before coding. Read [package integration](references/api.md) only when integrating CSS, preferences, or React. The copied skill text is guidance, not a versioned API catalog.

## Route the request

- New screen or system foundation: read [build](references/build.md).
- Extend an existing pattern or component: read [build](references/build.md) and the affected source/call sites.
- Map hardcoded values to tokens: read [mapping](references/mapping.md).
- Move an app onto the system: read [migration](references/migration.md).
- Review a screen or document a component: read [review and docs](references/review-docs.md).

Read only the relevant reference. Start from the role and purpose of each element, then select tokens and states. Check the rendered result at relevant widths and input states when a browser is available. Report what was actually checked and any unavailable proof. Commit, push, publish, deploy, install a global skill, or message others only when the user explicitly authorizes that action.
