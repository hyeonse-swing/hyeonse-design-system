# Build or extend

Inspect the target route, its neighboring patterns, and [the installed package contract](api.md). Name the screen's purpose and primary action. Use semantic role tokens before adding values. Keep typography and whitespace hierarchy clear.

For a new control, define its actual states: idle, hover, focus, selected, disabled, and loading or error when needed. Use semantic HTML and keyboard behavior. With v0.3.0 or later, prefer the packaged `Button`, `TextField`, `Checkbox`, and `Badge` for those basic roles; check the consumer's installed version first. `Badge` is a text status, not an automatic live alert. Keep cards and more complex controls in the app unless a reusable package contract is requested.

Verify the changed screen in affected light/dark themes, accents, narrow/wide widths, keyboard focus, and reduced motion. Compare the rendered result with the task and actual interaction, not a generic aesthetic score.
