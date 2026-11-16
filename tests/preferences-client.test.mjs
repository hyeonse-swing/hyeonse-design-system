import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { defaultPreferences, preferencesKey } from '../dist/preferences.js';
import { PreferencesPanel, PreferencesProvider } from '../dist/react.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function withClient(run, { matchMedia, beforeMount } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://example.test/' });
  const previous = { window: globalThis.window, document: globalThis.document, CustomEvent: globalThis.CustomEvent };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.CustomEvent = dom.window.CustomEvent;
  if (matchMedia) dom.window.matchMedia = matchMedia;
  if (beforeMount) beforeMount(dom.window);
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('app'));
  try {
    await act(async () => root.render(React.createElement(PreferencesProvider, null,
      React.createElement(PreferencesPanel, { locale: 'en' }))));
    await run(dom.window);
  } finally {
    await act(async () => root.unmount());
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.CustomEvent = previous.CustomEvent;
    dom.window.close();
  }
}

async function click(window, element) {
  await act(async () => element.click());
}

test('set and reset events observe the same persisted values as the root', async () => {
  await withClient(async window => {
    const snapshots = [];
    window.addEventListener('hyeonse:preferences', event => snapshots.push({
      detail: event.detail,
      stored: JSON.parse(window.localStorage.getItem(preferencesKey)),
      theme: window.document.documentElement.dataset.theme,
    }));
    await click(window, window.document.querySelector('input[name$="-theme"][value="dark"]'));
    assert.deepEqual(snapshots.at(-1), {
      detail: { ...defaultPreferences, theme: 'dark' },
      stored: { ...defaultPreferences, theme: 'dark' },
      theme: 'dark',
    });
    await click(window, [...window.document.querySelectorAll('button')].find(button => button.textContent === 'Reset to defaults'));
    assert.deepEqual(snapshots.at(-1), {
      detail: defaultPreferences,
      stored: defaultPreferences,
      theme: 'light',
    });
    assert.equal(window.document.querySelector('input[name$="-theme"][value="system"]').checked, true);
  });
});

test('storage read and write errors leave current-tab controls usable', async () => {
  await withClient(async window => {
    const events = [];
    window.addEventListener('hyeonse:preferences', event => events.push(event.detail));
    await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey })));
    await click(window, window.document.querySelector('input[name$="-theme"][value="dark"]'));
    assert.equal(window.document.documentElement.dataset.theme, 'dark');
    assert.equal(window.document.querySelector('input[name$="-theme"][value="dark"]').checked, true);
    assert.deepEqual(events.at(-1), { ...defaultPreferences, theme: 'dark' });
    await click(window, [...window.document.querySelectorAll('button')].find(button => button.textContent === 'Reset to defaults'));
    assert.equal(window.document.documentElement.dataset.theme, 'light');
    assert.equal(window.document.querySelector('input[name$="-theme"][value="system"]').checked, true);
  }, { beforeMount(window) {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem() { throw new Error('read blocked'); },
      setItem() { throw new Error('write blocked'); },
    } });
  } });
});

test('missing matchMedia still mounts and applies storage changes', async () => {
  await withClient(async window => {
    assert.equal(window.matchMedia, undefined);
    assert.equal(window.document.documentElement.dataset.theme, 'light');
    window.localStorage.setItem(preferencesKey, JSON.stringify({ ...defaultPreferences, theme: 'dark', motion: 'reduced' }));
    await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey })));
    assert.equal(window.document.documentElement.dataset.theme, 'dark');
    assert.equal(window.document.documentElement.dataset.motion, 'reduced');
    assert.equal(window.document.querySelector('input[name$="-theme"][value="dark"]').checked, true);
  });
});

test('media changes update the root and both listeners are cleaned up', async () => {
  const queries = new Map();
  const matchMedia = query => {
    if (queries.has(query)) return queries.get(query);
    const listeners = new Set();
    const media = {
      matches: false,
      addEventListener(type, listener) { assert.equal(type, 'change'); listeners.add(listener); },
      removeEventListener(type, listener) { assert.equal(type, 'change'); listeners.delete(listener); },
      emit() { for (const listener of listeners) listener(); },
      get listenerCount() { return listeners.size; },
    };
    queries.set(query, media);
    return media;
  };
  await withClient(async window => {
    const dark = queries.get('(prefers-color-scheme: dark)');
    const reduced = queries.get('(prefers-reduced-motion: reduce)');
    assert.equal(dark.listenerCount, 1);
    assert.equal(reduced.listenerCount, 1);
    dark.matches = true;
    reduced.matches = true;
    await act(async () => { dark.emit(); reduced.emit(); });
    assert.equal(window.document.documentElement.dataset.theme, 'dark');
    assert.equal(window.document.documentElement.dataset.motion, 'reduced');
    const description = window.document.querySelector('fieldset[aria-describedby]');
    assert.match(window.document.getElementById(description.getAttribute('aria-describedby')).textContent, /device’s reduced motion setting takes priority/);
  }, { matchMedia });
  assert.equal(queries.get('(prefers-color-scheme: dark)').listenerCount, 0);
  assert.equal(queries.get('(prefers-reduced-motion: reduce)').listenerCount, 0);
});
