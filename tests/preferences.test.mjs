import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createPreferenceScript, defaultPreferences, effectiveMotion, parsePreferences,
  preferenceScript, preferencesKey, resolvedTheme, serializePreferences, validatePreferences,
} from '../dist/preferences.js';
import { PreferencesPanel, PreferencesProvider, ThemeToggle } from '../dist/react.js';

test('malformed and untrusted preferences fall back field by field', () => {
  assert.deepEqual(parsePreferences('{bad'), defaultPreferences);
  assert.deepEqual(parsePreferences('[]'), defaultPreferences);
  assert.deepEqual(validatePreferences({ theme: 'dark', accent: 'unknown', motion: 'reduced' }), {
    ...defaultPreferences, theme: 'dark', motion: 'reduced',
  });
  assert.deepEqual(JSON.parse(serializePreferences({ ...defaultPreferences, theme: 'dark', accent: 'bad' })), {
    ...defaultPreferences, theme: 'dark',
  });
  assert.equal(resolvedTheme('system', true), 'dark');
  assert.equal(resolvedTheme('system', false), 'light');
  assert.equal(resolvedTheme('light', true), 'light');
  assert.equal(effectiveMotion('full', true), 'reduced');
  assert.equal(effectiveMotion('full', false), 'full');
});

function runInitialScript({ key = preferencesKey, stored, dark = false, reduced = false, storageThrows = false } = {}) {
  const dataset = {};
  const requestedKeys = [];
  const context = {
    document: { documentElement: { dataset } },
    localStorage: { getItem(requested) {
      requestedKeys.push(requested);
      if (storageThrows) throw new Error('blocked');
      return stored ?? null;
    } },
    window: { matchMedia(query) {
      return { matches: query.includes('color-scheme') ? dark : reduced };
    } },
  };
  vm.runInNewContext(createPreferenceScript(key), context);
  return { dataset, requestedKeys };
}

test('initial script uses the same defaults, validation and OS overrides', () => {
  assert.equal(preferenceScript, createPreferenceScript());
  const stored = JSON.stringify({ theme: 'system', accent: 'forest', density: 'invalid', corners: 'soft', motion: 'full' });
  assert.deepEqual(runInitialScript({ stored, dark: true, reduced: true }).dataset, {
    theme: 'dark', themePreference: 'system', accent: 'forest', density: 'comfortable', corners: 'soft', motion: 'reduced',
  });
  assert.deepEqual(runInitialScript({ stored: '{bad', dark: true }).dataset, {
    theme: 'dark', themePreference: 'system', accent: 'cobalt', density: 'comfortable', corners: 'crisp', motion: 'full',
  });
  assert.deepEqual(runInitialScript({ storageThrows: true }).dataset, {
    theme: 'light', themePreference: 'system', accent: 'cobalt', density: 'comfortable', corners: 'crisp', motion: 'full',
  });
});

test('custom storage key is honored and safe inside inline HTML', () => {
  const key = '</script><script>alert(1)</script>\u2028';
  const script = createPreferenceScript(key);
  assert.equal(script.includes('</script>'), false);
  assert.equal(script.includes('<script>'), false);
  assert.equal(script.includes('\u2028'), false);
  assert.deepEqual(runInitialScript({ key }).requestedKeys, [key]);
});

test('SSR retains localized semantics and isolates multiple panels', () => {
  const html = renderToStaticMarkup(React.createElement(PreferencesProvider, null,
    React.createElement(React.Fragment, null,
      React.createElement(ThemeToggle, { locale: 'en' }),
      React.createElement(PreferencesPanel, { locale: 'ko' }),
      React.createElement(PreferencesPanel, { locale: 'en' }),
    )));
  assert.match(html, /Current theme: System\. Switch to Light mode/);
  assert.match(html, /화면 설정/);
  assert.match(html, /Display settings/);
  const ids = [...html.matchAll(/<h2 id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(ids.every(id => html.includes(`aria-labelledby="${id}"`)));
  const themeNames = [...html.matchAll(/name="([^"]+-theme)"/g)].map(match => match[1]);
  assert.equal(new Set(themeNames).size, 2);
  assert.match(html, /hds-panel/);
});
