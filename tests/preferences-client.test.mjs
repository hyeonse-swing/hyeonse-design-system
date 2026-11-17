import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { defaultPreferences, preferencesKey } from '../dist/preferences.js';
import { PreferencesPanel, PreferencesProvider } from '../dist/react.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function withClient(run, { matchMedia, beforeMount, providerProps } = {}) {
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
    await act(async () => root.render(React.createElement(PreferencesProvider, providerProps ?? null,
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

test('two roots share same-key updates without event feedback or mutable event detail', async () => {
  await withClient(async window => {
    const secondContainer = window.document.createElement('div');
    secondContainer.id = 'second';
    window.document.body.append(secondContainer);
    const { createRoot } = await import('react-dom/client');
    const second = createRoot(secondContainer, { identifierPrefix: 'second-' });
    try {
      await act(async () => second.render(React.createElement(PreferencesProvider, null,
        React.createElement(PreferencesPanel, { locale: 'en' }))));
      const events = [];
      window.addEventListener('hyeonse:preferences', event => {
        events.push({ ...event.detail });
        event.detail.theme = 'light';
      });
      await click(window, window.document.querySelector('#app input[name$="-theme"][value="dark"]'));
      assert.equal(events.length, 1);
      await click(window, window.document.querySelector('#second button[aria-label^="Forest accent color"]'));
      assert.equal(events.length, 2);
      const expected = { ...defaultPreferences, theme: 'dark', accent: 'forest' };
      assert.deepEqual(events.at(-1), expected);
      assert.deepEqual(JSON.parse(window.localStorage.getItem(preferencesKey)), expected);
      assert.equal(window.document.documentElement.dataset.theme, 'dark');
      for (const container of ['#app', '#second']) {
        assert.equal(window.document.querySelector(`${container} input[name$="-theme"][value="dark"]`).checked, true);
        assert.equal(window.document.querySelector(`${container} button[aria-label^="Forest accent color"]`).getAttribute('aria-pressed'), 'true');
      }
    } finally {
      await act(async () => second.unmount());
    }
  });
});

test('same-key roots notify each distinct registered event name on save, reset, and storage', async () => {
  await withClient(async window => {
    const { createRoot } = await import('react-dom/client');
    const roots = ['second', 'third'].map(id => {
      const container = window.document.createElement('div');
      container.id = id;
      window.document.body.append(container);
      return createRoot(container, { identifierPrefix: `${id}-` });
    });
    const render = (eventName, storageKey = preferencesKey) => React.createElement(
      PreferencesProvider, { eventName, storageKey }, React.createElement(PreferencesPanel, { locale: 'en' }));
    const events = new Map(['prefs-0', 'prefs-1', 'prefs-2'].map(name => [name, []]));
    let thirdMounted = true;
    try {
      await act(async () => {
        roots[0].render(render('prefs-1'));
        roots[1].render(render('prefs-1'));
      });
      for (const [name, snapshots] of events) window.addEventListener(name, event => {
        snapshots.push({
          detail: { ...event.detail },
          stored: JSON.parse(window.localStorage.getItem(preferencesKey)),
          theme: window.document.documentElement.dataset.theme,
        });
        event.detail.theme = 'light';
      });
      const expectEvents = (expected, names) => {
        for (const [name, snapshots] of events) {
          assert.equal(snapshots.length, names.includes(name) ? 1 : 0, name);
          if (names.includes(name)) assert.deepEqual(snapshots[0], {
            detail: expected, stored: expected,
            theme: expected.theme === 'dark' ? 'dark' : 'light',
          });
          snapshots.length = 0;
        }
      };

      await click(window, window.document.querySelector('#app input[name$="-theme"][value="dark"]'));
      expectEvents({ ...defaultPreferences, theme: 'dark' }, ['prefs-0', 'prefs-1']);
      await click(window, window.document.querySelector('#second button[aria-label^="Forest accent color"]'));
      expectEvents({ ...defaultPreferences, theme: 'dark', accent: 'forest' }, ['prefs-0', 'prefs-1']);
      await click(window, [...window.document.querySelectorAll('#third button')].find(button => button.textContent === 'Reset to defaults'));
      expectEvents(defaultPreferences, ['prefs-0', 'prefs-1']);

      const external = { ...defaultPreferences, theme: 'dark', corners: 'soft' };
      window.localStorage.setItem(preferencesKey, JSON.stringify(external));
      await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey, storageArea: window.localStorage })));
      expectEvents(external, ['prefs-0', 'prefs-1']);

      await act(async () => roots[0].render(render('prefs-2')));
      events.get('prefs-2').length = 0; // A changed name emits its mount snapshot.
      await click(window, window.document.querySelector('#app button[aria-label^="Coral accent color"]'));
      expectEvents({ ...external, accent: 'coral' }, ['prefs-0', 'prefs-1', 'prefs-2']);

      await act(async () => roots[1].unmount());
      thirdMounted = false;
      await click(window, window.document.querySelector('#app input[name$="-density"][value="compact"]'));
      expectEvents({ ...external, accent: 'coral', density: 'compact' }, ['prefs-0', 'prefs-2']);

      await act(async () => roots[0].render(render('prefs-2', 'other-preferences')));
      events.get('prefs-2').length = 0;
      await click(window, window.document.querySelector('#app input[name$="-motion"][value="reduced"]'));
      expectEvents({ ...external, accent: 'coral', density: 'compact', motion: 'reduced' }, ['prefs-0']);
    } finally {
      await act(async () => {
        roots[0].unmount();
        if (thirdMounted) roots[1].unmount();
      });
    }
  }, { providerProps: { eventName: 'prefs-0' } });
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
    const secondContainer = window.document.createElement('div');
    secondContainer.id = 'second';
    window.document.body.append(secondContainer);
    const { createRoot } = await import('react-dom/client');
    const second = createRoot(secondContainer, { identifierPrefix: 'second-' });
    try {
      await act(async () => second.render(React.createElement(PreferencesProvider, null,
        React.createElement(PreferencesPanel, { locale: 'en' }))));
      assert.equal(window.document.querySelector('#second input[name$="-theme"][value="dark"]').checked, true);
      await click(window, window.document.querySelector('#second button[aria-label^="Forest accent color"]'));
      assert.equal(window.document.querySelector('#app button[aria-label^="Forest accent color"]').getAttribute('aria-pressed'), 'true');
      const count = events.length;
      await act(async () => {
        window.dispatchEvent(new window.StorageEvent('storage', { key: 'unrelated' }));
        window.dispatchEvent(new window.StorageEvent('storage', { key: null, storageArea: window.sessionStorage }));
        window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey }));
      });
      assert.equal(events.length, count);
      assert.equal(window.document.documentElement.dataset.theme, 'dark');
      assert.equal(window.document.querySelector('#app input[name$="-theme"][value="dark"]').checked, true);
      assert.equal(window.document.querySelector('#second input[name$="-theme"][value="dark"]').checked, true);
      await click(window, [...window.document.querySelector('#app').querySelectorAll('button')].find(button => button.textContent === 'Reset to defaults'));
      assert.equal(window.document.documentElement.dataset.theme, 'light');
      assert.equal(window.document.querySelector('#app input[name$="-theme"][value="system"]').checked, true);
      assert.equal(window.document.querySelector('#second input[name$="-theme"][value="system"]').checked, true);
    } finally {
      await act(async () => second.unmount());
    }
  }, { beforeMount(window) {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem() { throw new Error('read blocked'); },
      setItem() { throw new Error('write blocked'); },
    } });
  } });
});

test('changing a Provider key removes its old subscription and rejoins on remount', async () => {
  await withClient(async window => {
    const secondContainer = window.document.createElement('div');
    secondContainer.id = 'second';
    window.document.body.append(secondContainer);
    const { createRoot } = await import('react-dom/client');
    const second = createRoot(secondContainer, { identifierPrefix: 'second-' });
    const renderSecond = storageKey => React.createElement(PreferencesProvider, { storageKey },
      React.createElement(PreferencesPanel, { locale: 'en' }));
    try {
      await act(async () => second.render(renderSecond(preferencesKey)));
      await click(window, window.document.querySelector('#app input[name$="-theme"][value="dark"]'));
      await act(async () => second.render(renderSecond('other-preferences')));
      assert.equal(window.document.querySelector('#second input[name$="-theme"][value="system"]').checked, true);

      await click(window, window.document.querySelector('#app button[aria-label^="Forest accent color"]'));
      assert.equal(window.document.querySelector('#second button[aria-label^="Cobalt accent color"]').getAttribute('aria-pressed'), 'true');
      await click(window, window.document.querySelector('#second input[name$="-corners"][value="soft"]'));
      assert.equal(window.document.querySelector('#app input[name$="-corners"][value="crisp"]').checked, true);
      assert.deepEqual(JSON.parse(window.localStorage.getItem(preferencesKey)),
        { ...defaultPreferences, theme: 'dark', accent: 'forest' });
      assert.deepEqual(JSON.parse(window.localStorage.getItem('other-preferences')),
        { ...defaultPreferences, corners: 'soft' });

      await act(async () => second.render(renderSecond(preferencesKey)));
      assert.equal(window.document.querySelector('#second input[name$="-theme"][value="dark"]').checked, true);
      assert.equal(window.document.querySelector('#second button[aria-label^="Forest accent color"]').getAttribute('aria-pressed'), 'true');
    } finally {
      await act(async () => second.unmount());
    }
  });
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
    window.localStorage.clear();
    await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: null, storageArea: window.localStorage })));
    assert.equal(window.document.documentElement.dataset.theme, 'light');
    assert.equal(window.document.querySelector('input[name$="-theme"][value="system"]').checked, true);
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
