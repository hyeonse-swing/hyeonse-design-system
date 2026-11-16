'use client';

import { PreferencesPanel, PreferencesProvider, ThemeToggle, usePreferences } from '@hyeonse/design-system/react';
import '@hyeonse/design-system/tokens.css';
import '@hyeonse/design-system/components.css';
import { siteDefaults, storageKey } from './preferences.js';

function ReadingPreference() {
  const { preferences, setPreference } = usePreferences();
  return <label>
    <input type="checkbox" checked={preferences.motion === 'reduced'}
      onChange={event => setPreference('motion', event.target.checked ? 'reduced' : 'full')} />
    움직임 줄이기
  </label>;
}

export function DisplaySettings() {
  return <PreferencesProvider storageKey={storageKey} defaults={siteDefaults}>
    <ThemeToggle locale="ko" />
    <PreferencesPanel locale="ko" />
    <ReadingPreference />
  </PreferencesProvider>;
}
