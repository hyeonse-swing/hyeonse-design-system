# Package contract

The public package is `@hyeonse/design-system` with `./tokens.css`, `./components.css`, `./preferences`, and `./react` exports. Import the two CSS files for tokens and the current React preference UI styles. `.hds-*` currently styles `ThemeToggle` and `PreferencesPanel`; the package does not export general Button or Input React components.

`./preferences` exports `preferencesKey`, `defaultPreferences`, validation/parse/serialize helpers, `resolvedTheme`, `effectiveMotion`, `createPreferenceScript(storageKey?)`, and `preferenceScript`. Place the initial script in the document head before CSS paints. Its default storage key is `hyeonse-site-preferences`.

`./react` exports `PreferencesProvider`, `usePreferences`, `ThemeToggle`, and `PreferencesPanel`. The Provider accepts `storageKey?` and `eventName?` (default `hyeonse:preferences`) and offers `preferences`, `setPreference`, and `resetPreferences` through the hook. The two controls accept `locale='ko'|'en'`. Match a custom initial-script storage key with the Provider key. Inspect installed package types and actual target framework integration before coding against this contract.
