# Visual contract

The default is white paper (`--paper`), dark ink (`--ink`), and cobalt accent. Forest and coral are alternate accents. Dark mode uses a dark paper and separate lighter `--accent-text` for readable text and focus. Use `--accent-solid` with `--on-accent` for filled actions; use `--accent-text` for links and selected outlines. `--surface` groups content, `--surface-raised` elevates, `--line` divides, and `--muted` carries supporting text. Query the installed version with `hds tokens` for exact values and overrides.

`v0.3.0` adds control, focus, disabled, success, warning, and danger role tokens; `--space-1` through `--space-8`; type sizes; body leading; and a fast duration token. These additions are not in the `v0.2.0` contract. Use roles rather than copying one raw color across different meanings. Never convey status only by color.

Use DM Sans for English and Noto Sans KR for Korean when those assets are available in the consumer app. The package does not ship fonts. Prefer clear heading, label, and body hierarchy. Base radii are crisp; the soft preference rounds cards and controls. Density changes spacing through `--space-factor` while packaged controls keep at least a 44px target.

Preferences: theme `system/light/dark`, accent `cobalt/forest/coral`, density `comfortable/compact`, corners `crisp/soft`, motion `full/reduced`. The root receives resolved `data-theme` plus `data-accent`, `data-density`, `data-corners`, and effective `data-motion`. System reduced motion takes priority even when a user chose full motion. Preserve keyboard access, visible focus, and text labels.
