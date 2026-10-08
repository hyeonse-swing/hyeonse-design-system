# Migrate a screen or app

Inventory routes, existing theme storage, CSS variables, fonts, and controls. Compare the target's current behavior with [the package contract](api.md). Migrate in the requested unit of work: introduce tokens and CSS, connect preferences only where needed, then replace local styling in a bounded area. Keep the target app's data flow, routes, and product language intact.

If preference persistence already exists, plan the storage key and event integration so existing users do not silently lose a choice. Check first paint, cross-tab changes, system theme, narrow layout, keyboard access, and reduced motion where affected. Record remaining unmigrated areas explicitly rather than claiming complete adoption.
