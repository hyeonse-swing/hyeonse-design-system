---
name: hyeonse-design-system
description: Integrate, build, extend, map, migrate, review, or document interfaces using Hyeonse Design System in personal projects. Use for design-system work in an existing app; skip unrelated routine code edits.
---

# Hyeonse Design System

Use the target app's installed package and this skill's [visual contract](references/foundations.md). Inspect the app, its framework, and the requested scope first. Preserve existing behavior and purpose; a screen request does not authorize an app-wide migration.

For package API, token values, or examples, query the target app's installed version with `npm exec --no -- hds list --json`, `npm exec --no -- hds show <export-name> --json`, `npm exec --no -- hds tokens [name] --json`, or `npm exec --no -- hds example <id> --json` (use `npm run hds -- ...` inside this repository). Check `package.version` in the response and the package's public TypeScript declarations before coding. Read [package integration](references/api.md) when adding CSS, preferences, or React components. If the CLI is unavailable, inspect the installed package's `package.json` exports and `dist/*.d.ts`; do not infer exports from this copied skill. The older GitHub v0.3.0 tag lacks the `layout`, `fields`, `overlays`, and `display` subpaths added in the v0.4.0 website archive and retained in later website archives.

## Route the request

- New screen or first integration into an existing app: read [package integration](references/api.md) and [build](references/build.md).
- Extend an existing pattern or component: read [build](references/build.md) and the affected source/call sites.
- Map hardcoded values to tokens: read [mapping](references/mapping.md).
- Move an app onto the system: read [migration](references/migration.md).
- Review a screen or document a component: read [review and docs](references/review-docs.md).

Read only the relevant reference. Start from the role and purpose of each element, then select tokens and states. Check the rendered result at relevant widths and input states when a browser is available. Report what was actually checked and any unavailable proof. Commit, push, publish, deploy, install a global skill, or message others only when the user explicitly authorizes that action.
