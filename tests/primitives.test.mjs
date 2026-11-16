import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge, Button, Checkbox, TextField } from '../dist/primitives.js';

const element = React.createElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function withClient(render, run) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://example.test/' });
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('app'));
  try {
    await act(async () => root.render(render()));
    await run({ document: dom.window.document, window: dom.window, root });
  } finally {
    await act(async () => root.unmount());
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    dom.window.close();
  }
}

test('SSR labels and descriptions are unique, linked, and retain input attributes', () => {
  const html = renderToStaticMarkup(element(React.Fragment, null,
    element(TextField, { label: 'Email', name: 'email', required: true, autoComplete: 'email', hint: 'Work address', error: 'Check address', 'aria-describedby': 'outside' }),
    element(TextField, { label: 'Name', id: 'person-name', readOnly: true, 'aria-invalid': false }),
    element(Checkbox, { label: 'News', name: 'news', hint: 'Monthly', error: 'Required', 'aria-describedby': 'policy' }),
    element(Checkbox, { label: 'Terms', name: 'terms', defaultChecked: true }),
  ));
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const inputs = [...document.querySelectorAll('input')];
  assert.equal(new Set(inputs.map(input => input.id)).size, 4);
  assert.ok(inputs.every(input => input.id && input.labels.length === 1));
  assert.deepEqual(inputs.map(input => input.labels[0].textContent), ['Email', 'Name', 'News', 'Terms']);
  assert.equal(inputs[0].getAttribute('autocomplete'), 'email');
  assert.equal(inputs[0].required, true);
  assert.equal(inputs[1].id, 'person-name');
  assert.equal(inputs[1].readOnly, true);
  assert.equal(inputs[1].getAttribute('aria-invalid'), 'false');
  assert.equal(inputs[3].defaultChecked, true);

  for (const [input, externalId, helperText] of [
    [inputs[0], 'outside', ['Work address', 'Check address']],
    [inputs[2], 'policy', ['Monthly', 'Required']],
  ]) {
    const ids = input.getAttribute('aria-describedby').split(' ');
    assert.equal(ids[0], externalId);
    assert.deepEqual(ids.slice(1).map(id => document.getElementById(id)?.textContent), helperText);
    assert.equal(input.getAttribute('aria-invalid'), 'true');
  }
  dom.window.close();
});

test('Button uses a safe default type and loading blocks click and submit', async () => {
  const actionRef = React.createRef();
  const submitRef = React.createRef();
  let actionCount = 0;
  let submitCount = 0;
  let loading = false;
  const render = () => element('form', { onSubmit(event) { event.preventDefault(); submitCount++; } },
    element(Button, { ref: actionRef, onClick() { actionCount++; }, loading, loadingLabel: 'Saving', 'aria-label': 'Save now' }, 'Save'),
    element(Button, { ref: submitRef, type: 'submit', loading, loadingLabel: 'Sending' }, 'Send'),
  );

  await withClient(render, async ({ document, root }) => {
    const [action, submit] = document.querySelectorAll('button');
    assert.equal(actionRef.current, action);
    assert.equal(submitRef.current, submit);
    assert.equal(action.type, 'button');
    assert.equal(submit.type, 'submit');
    await act(async () => action.click());
    assert.equal(actionCount, 1);
    assert.equal(submitCount, 0);
    await act(async () => submit.click());
    assert.equal(submitCount, 1);

    loading = true;
    await act(async () => root.render(render()));
    assert.equal(action.disabled, true);
    assert.equal(submit.disabled, true);
    assert.equal(action.getAttribute('aria-busy'), 'true');
    assert.equal(action.getAttribute('aria-label'), 'Saving');
    assert.equal(action.textContent, 'Saving');
    await act(async () => { action.click(); submit.click(); });
    assert.equal(actionCount, 1);
    assert.equal(submitCount, 1);
  });
});

test('TextField keeps the native input ref and value behavior', async () => {
  const ref = React.createRef();
  await withClient(() => element(TextField, { label: 'Search', type: 'search', name: 'query', defaultValue: 'initial', ref, className: 'custom-input' }), async ({ document }) => {
    const input = document.querySelector('input');
    assert.equal(ref.current, input);
    assert.equal(input.type, 'search');
    assert.equal(input.name, 'query');
    assert.equal(input.value, 'initial');
    assert.equal(input.classList.contains('custom-input'), true);
    assert.equal(input.labels[0].textContent, 'Search');
    input.value = 'changed';
    assert.equal(input.value, 'changed');
  });
});

test('Checkbox preserves native uncontrolled and controlled form behavior', async () => {
  const ref = React.createRef();
  const changes = [];
  function Controlled() {
    const [checked, setChecked] = React.useState(false);
    return element(Checkbox, { label: 'Controlled', name: 'controlled', checked, onChange(event) {
      changes.push(event.currentTarget.checked);
      setChecked(event.currentTarget.checked);
    } });
  }

  await withClient(() => element('form', null,
    element(Checkbox, { label: 'Uncontrolled', name: 'uncontrolled', value: 'yes', defaultChecked: false, ref }),
    element(Controlled),
  ), async ({ document, window }) => {
    const form = document.querySelector('form');
    const [uncontrolled, controlled] = form.querySelectorAll('input');
    assert.equal(ref.current, uncontrolled);
    assert.equal(uncontrolled.type, 'checkbox');
    assert.equal(new window.FormData(form).get('uncontrolled'), null);
    await act(async () => uncontrolled.labels[0].click());
    assert.equal(uncontrolled.checked, true);
    assert.equal(new window.FormData(form).get('uncontrolled'), 'yes');
    await act(async () => controlled.click());
    assert.deepEqual(changes, [true]);
    assert.equal(controlled.checked, true);
    await act(async () => controlled.click());
    assert.deepEqual(changes, [true, false]);
    assert.equal(controlled.checked, false);
  });
});

test('Checkbox readonly cancels activation but remains in form data; disabled does not', async () => {
  let changes = 0;
  await withClient(() => element('form', null,
    element(Checkbox, { label: 'Readonly', name: 'readonly', value: 'yes', defaultChecked: true, readOnly: true, onChange() { changes++; } }),
    element(Checkbox, { label: 'Disabled', name: 'disabled', value: 'yes', defaultChecked: true, disabled: true }),
  ), async ({ document, window }) => {
    const form = document.querySelector('form');
    const [readonly, disabled] = form.querySelectorAll('input');
    assert.equal(readonly.getAttribute('aria-readonly'), 'true');
    assert.equal(readonly.disabled, false);
    await act(async () => readonly.labels[0].click());
    assert.equal(readonly.checked, true);
    assert.equal(changes, 0);
    assert.equal(new window.FormData(form).get('readonly'), 'yes');
    assert.equal(disabled.disabled, true);
    assert.equal(new window.FormData(form).get('disabled'), null);
  });
});

test('Badge is plain text with native span attributes and no implicit alert role', () => {
  const html = renderToStaticMarkup(element(Badge, { tone: 'warning', title: 'Pending review', className: 'custom-badge' }, 'Pending'));
  const dom = new JSDOM(html);
  const badge = dom.window.document.querySelector('span');
  assert.equal(badge.textContent, 'Pending');
  assert.equal(badge.title, 'Pending review');
  assert.equal(badge.getAttribute('role'), null);
  assert.equal(badge.classList.contains('hds-badge--warning'), true);
  assert.equal(badge.classList.contains('custom-badge'), true);
  dom.window.close();
});
