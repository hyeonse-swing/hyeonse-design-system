# Build or extend

Inspect the target route, its neighboring patterns, and [the package contract](api.md). Name the screen's purpose and primary action. Use `--paper`, `--ink`, `--surface`, `--line`, and role-appropriate accent tokens before adding new values. Keep typography and whitespace hierarchy recognizable: large editorial heading, compact labels, clear content measure, crisp controls.

For a new control, define its actual states: idle, hover, focus, selected, disabled, and any loading or error state that the behavior needs. Use semantic HTML and keyboard behavior. Do not describe a visual CSS sample as a packaged React component. Extend the package only when the requested use case needs a reusable contract; otherwise implement a local screen.

Verify the changed screen in light/dark, relevant accents, narrow/wide widths, keyboard focus, and reduced motion when those states are affected. Compare the rendered result with the purpose and user request, not a generic aesthetic score.
