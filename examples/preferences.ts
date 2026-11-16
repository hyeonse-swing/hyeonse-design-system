import { createPreferenceScript } from '@hyeonse/design-system/preferences';
import type { Preferences } from '@hyeonse/design-system/preferences';

// Share these values between the document head and the client Provider.
export const storageKey = 'example-display-preferences';
export const siteDefaults = { corners: 'soft' } satisfies Partial<Preferences>;
export const initialPreferenceScript = createPreferenceScript(storageKey, siteDefaults);

// Insert initialPreferenceScript in a <script> in the document head before CSS.
// Use your framework's script/HTML API; do not concatenate user input into HTML.
