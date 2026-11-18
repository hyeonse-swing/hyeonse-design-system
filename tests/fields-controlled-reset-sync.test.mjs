import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';

import { Switch, RadioGroup } from '../dist/fields.js';
const e = React.createElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('controlled switch and radio values survive synchronous native form reset', async () => {
  const dom = new JSDOM('<div id="app"></div>', { url: 'https://example.test/' });
  const names = ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'getComputedStyle'];
  const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
  for (const name of names) globalThis[name] = name === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[name];
  const root = createRoot(dom.window.document.getElementById('app'));
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  let changes = 0;
  const view = (enabled, scope) => e('form', null,
    e(Switch, { label: 'Enabled', name: 'enabled', checked: enabled, onCheckedChange() { changes++; } }),
    e(RadioGroup, { label: 'Scope', name: 'scope', options, value: scope, onValueChange() { changes++; } }),
  );
  try {
    await act(async () => root.render(view(true, 'a')));
    await act(async () => root.render(view(false, 'b')));
    const form = dom.window.document.querySelector('form');
    const values = () => {
      const data = new dom.window.FormData(form);
      return [data.get('enabled'), data.get('scope')];
    };
    assert.deepEqual(values(), [null, 'b']);
    form.reset();
    assert.deepEqual(values(), [null, 'b'], 'FormData read immediately after reset uses controlled values');
    await act(async () => {});
    assert.deepEqual(values(), [null, 'b']);
    assert.equal(changes, 0, 'reset does not notify a caller-owned value change');
  } finally {
    await act(async () => root.unmount());
    for (const name of names) globalThis[name] = previous[name];
    dom.window.close();
  }
});
