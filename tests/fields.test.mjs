import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';

const fields = await import(process.env.HDS_FIELDS_BUILD ?? '../dist/fields.js');
const e = React.createElement;
const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', disabled: true }];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderForm() {
  return e('form', { id: 'field-form' },
    e('p', { id: 'external-help' }, 'External guidance'),
    e(fields.Input, { 'aria-label': 'Alias', name: 'alias', defaultValue: 'Ada' }),
    e(fields.Textarea, { label: 'Notes', name: 'notes', defaultValue: 'First', hint: 'Write details', error: 'Check details', 'aria-describedby': 'external-help' }),
    e(fields.Select, { label: 'Team', name: 'team', options, defaultValue: 'a', hint: 'One team', error: 'Choose again' }),
    e(fields.Combobox, { label: 'Member', name: 'member', options, defaultValue: 'a', hint: 'Search a member' }),
    e(fields.MultiSelect, { label: 'Members', name: 'members', options, defaultValue: ['a'], hint: 'Search members' }),
    e(fields.Switch, { label: 'Enabled', name: 'enabled', defaultChecked: true, hint: 'Toggle it' }),
    e(fields.RadioGroup, { label: 'Scope', name: 'scope', options, defaultValue: 'a', hint: 'One scope' }),
    e(fields.Slider, { label: 'Amount', name: 'amount', min: 0, max: 10, defaultValue: 4, hint: 'Between 0 and 10' }),
    e(fields.NumberField, { label: 'Count', name: 'count', defaultValue: 3, hint: 'Whole number' }),
    e(fields.DateField, { label: 'Date', name: 'date', defaultValue: '2026-11-16', hint: 'Choose a date' }),
    e(fields.FileInput, { label: 'Attachment', name: 'attachment', hint: 'PDF only', accept: '.pdf' }),
    e(fields.PasswordField, { label: 'Secret', name: 'secret', defaultValue: 'hidden', hint: 'Keep private' }),
  );
}

function getNamedControl(document, name) {
  if (name === 'team') return document.querySelector('button[role="combobox"][aria-label="Team"]');
  if (name === 'member' || name === 'members') return [...document.querySelectorAll('input[role="combobox"]')].find(node => node.closest('.hds-field')?.querySelector('.hds-field__label')?.textContent === (name === 'member' ? 'Member' : 'Members'));
  if (name === 'enabled') return document.querySelector('[role="switch"]');
  if (name === 'scope') return document.querySelector('[role="radiogroup"]');
  if (name === 'count') return document.querySelector('.hds-field__numberInput');
  return document.querySelector(`[name="${name}"]`);
}

test('all twelve field families render named controls and linked descriptions in SSR', () => {
  const dom = new JSDOM(renderToStaticMarkup(renderForm()));
  const { document } = dom.window;
  const helperIds = [...document.querySelectorAll('.hds-field [id]')].map(node => node.id);
  assert.equal(new Set(helperIds).size, helperIds.length);

  for (const [name, label] of [
    ['alias', 'Alias'], ['notes', 'Notes'], ['team', 'Team'], ['member', 'Member'],
    ['members', 'Members'], ['enabled', 'Enabled'], ['scope', 'Scope'], ['amount', 'Amount'],
    ['count', 'Count'], ['date', 'Date'], ['attachment', 'Attachment'], ['secret', 'Secret'],
  ]) {
    const control = getNamedControl(document, name);
    assert.ok(control, `missing ${name}`);
    const accessibleName = control.getAttribute('aria-label') ??
      (control.getAttribute('aria-labelledby') ? document.getElementById(control.getAttribute('aria-labelledby'))?.textContent : null) ??
      control.labels?.[0]?.textContent;
    assert.equal(accessibleName, label, `${name} name`);
    if (name === 'alias') continue;
    const describedBy = control.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
    assert.ok(describedBy.some(id => document.getElementById(id)?.textContent), `${name} hint`);
    assert.ok(describedBy.every(id => document.getElementById(id)), `${name} description links`);
  }
  const notes = getNamedControl(document, 'notes');
  assert.deepEqual(notes.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id)?.textContent), ['External guidance', 'Write details', 'Check details']);
  assert.equal(notes.getAttribute('aria-invalid'), 'true');
  assert.equal(getNamedControl(document, 'team').getAttribute('aria-invalid'), 'true');
  const chip = document.querySelector('.hds-field__chip');
  assert.equal(chip.getAttribute('role'), 'group');
  assert.equal(chip.getAttribute('aria-label'), 'Alpha');
  assert.ok(chip.getAttribute('aria-description'));
  assert.equal(getNamedControl(document, 'attachment').type, 'file');
  assert.equal(getNamedControl(document, 'date').type, 'date');
  dom.window.close();
});

test('fields resolve five sizes without passing them to native input size', () => {
  const families = [
    [fields.Input, { 'aria-label': 'Alias', inputSize: 17 }],
    [fields.Textarea, { label: 'Notes' }],
    [fields.Select, { label: 'Team', options }],
    [fields.Combobox, { label: 'Member', options }],
    [fields.MultiSelect, { label: 'Members', options }],
    [fields.Switch, { label: 'Enabled' }],
    [fields.RadioGroup, { label: 'Scope', options }],
    [fields.Slider, { label: 'Amount' }],
    [fields.NumberField, { label: 'Count' }],
    [fields.DateField, { label: 'Date' }],
    [fields.FileInput, { label: 'Attachment' }],
    [fields.PasswordField, { label: 'Secret', inputSize: 23 }],
  ];
  for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const document = new JSDOM(renderToStaticMarkup(e(React.Fragment, null,
      ...families.map(([Component, props]) => e(Component, { ...props, size })),
    ))).window.document;
    const shells = [...document.querySelectorAll('.hds-field, input[aria-label="Alias"]')];
    assert.equal(shells.length, families.length);
    assert.ok(shells.every(shell => shell.dataset.hdsSize === size), size);
    assert.equal(document.querySelector('input[aria-label="Alias"]').getAttribute('size'), '17');
    assert.equal(document.querySelector('input[type="password"]').getAttribute('size'), '23');
    assert.equal(document.querySelector('input[type="date"]').hasAttribute('size'), false);
  }
  const defaultInput = new JSDOM(renderToStaticMarkup(e(fields.Input, { 'aria-label': 'Default' }))).window.document.querySelector('input');
  assert.equal(defaultInput.dataset.hdsSize, 'md');
  assert.equal(defaultInput.hasAttribute('size'), false);
});

test('selected values use option IDs in native form submission, not search text', () => {
  const dom = new JSDOM(renderToStaticMarkup(renderForm()), { url: 'https://example.test/' });
  const data = new dom.window.FormData(dom.window.document.querySelector('form'));
  assert.equal(data.get('team'), 'a');
  assert.equal(data.get('member'), 'a');
  assert.deepEqual(data.getAll('members'), ['a']);
  assert.equal(data.get('enabled'), 'on');
  assert.equal(data.get('scope'), 'a');
  assert.equal(data.get('count'), '3');
  assert.equal(data.get('secret'), 'hidden');
  assert.equal(data.get('date'), '2026-11-16');
  assert.equal(data.get('alias'), 'Ada');
  dom.window.close();
});

async function withClient(view, run) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://example.test/' });
  const names = ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'getComputedStyle'];
  const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
  for (const name of names) globalThis[name] = name === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[name];
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('app'));
  try {
    await act(async () => root.render(view));
    await run({ document: dom.window.document, window: dom.window, root });
  } finally {
    await act(async () => root.unmount());
    for (const name of names) globalThis[name] = previous[name];
    dom.window.close();
  }
}

test('native fields and password reveal preserve value through form reset', async () => {
  const inputRef = React.createRef();
  await withClient(e('form', null,
    e(fields.Input, { 'aria-label': 'Alias', name: 'alias', defaultValue: 'Ada', ref: inputRef }),
    e(fields.Textarea, { label: 'Notes', name: 'notes', defaultValue: 'First' }),
    e(fields.DateField, { label: 'Date', name: 'date', defaultValue: '2026-11-16' }),
    e(fields.PasswordField, { label: 'Secret', name: 'secret', defaultValue: 'hidden' }),
  ), async ({ document }) => {
    const form = document.querySelector('form');
    const alias = form.elements.namedItem('alias');
    const notes = form.elements.namedItem('notes');
    const date = form.elements.namedItem('date');
    const secret = form.elements.namedItem('secret');
    assert.equal(inputRef.current, alias);
    await act(async () => document.querySelector('button[aria-label="비밀번호 표시"]').click());
    assert.equal(secret.type, 'text');
    assert.equal(secret.value, 'hidden');
    alias.value = 'Grace'; notes.value = 'Changed'; date.value = '2026-12-01'; secret.value = 'changed';
    form.reset();
    assert.deepEqual([alias.value, notes.value, date.value, secret.value], ['Ada', 'First', '2026-11-16', 'hidden']);
  });
});

test('Base UI choices participate in client FormData and uncontrolled reset', async () => {
  const numberRef = React.createRef();
  await withClient(e('form', null,
    e(fields.Select, { label: 'Team', name: 'team', options, defaultValue: 'a' }),
    e(fields.Combobox, { label: 'Member', name: 'member', options, defaultValue: 'a' }),
    e(fields.MultiSelect, { label: 'Members', name: 'members', options, defaultValue: ['a'] }),
    e(fields.Switch, { label: 'Enabled', name: 'enabled', defaultChecked: true }),
    e(fields.RadioGroup, { label: 'Scope', name: 'scope', options: [{ value: 'a', label: 'Alpha' }, { value: 'c', label: 'Charlie' }], defaultValue: 'a' }),
    e(fields.NumberField, { label: 'Count', name: 'count', defaultValue: 3, ref: numberRef }),
  ), async ({ document, window }) => {
    const form = document.querySelector('form');
    const data = () => new window.FormData(form);
    assert.deepEqual(['team', 'member', 'members', 'enabled', 'scope', 'count'].map(name => data().get(name)), ['a', 'a', 'a', 'on', 'a', '3']);
    const selectLabel = [...document.querySelectorAll('.hds-field__label')].find(node => node.textContent === 'Team');
    const selectTrigger = document.querySelector('button[role="combobox"][aria-label="Team"]');
    await act(async () => selectLabel.click());
    assert.equal(document.activeElement, selectTrigger, 'visible Select label focuses its trigger');
    const toggle = document.querySelector('[role="switch"]');
    const numberInput = document.querySelector('.hds-field__numberInput');
    const increment = document.querySelector('button[aria-label="값 증가"]');
    await act(async () => toggle.click());
    assert.equal(data().get('enabled'), null);
    assert.equal(toggle.getAttribute('aria-checked'), 'false');
    await act(async () => increment.click());
    assert.equal(numberInput.value, '4');
    assert.equal(data().get('count'), '4');
    await act(async () => numberInput.focus());
    await act(async () => form.reset());
    assert.equal(data().get('enabled'), 'on');
    assert.equal(toggle.getAttribute('aria-checked'), 'true');
    assert.equal(data().get('team'), 'a');
    assert.deepEqual(data().getAll('members'), ['a']);
    assert.equal(data().get('count'), '3');
    const resetNumberInput = document.querySelector('.hds-field__numberInput');
    assert.equal(resetNumberInput.value, '3');
    assert.equal(numberRef.current, resetNumberInput, 'visible input ref follows reset');
    assert.equal(document.activeElement, resetNumberInput, 'reset preserves focus in number field');
    await act(async () => document.querySelector('button[aria-label="값 증가"]').click());
    assert.equal(resetNumberInput.value, '4');
    assert.equal(data().get('count'), '4');
  });
});

test('external form reset waits for cancellation and restores visible uncontrolled state', async () => {
  let cancel = true;
  const switchRef = React.createRef();
  const numberRef = React.createRef();
  const radioRef = React.createRef();
  await withClient(e(React.Fragment, null,
    e('form', { id: 'outside', onReset(event) { if (cancel) event.preventDefault(); } }),
    e(fields.Switch, { label: 'Enabled', name: 'enabled', form: 'outside', defaultChecked: true, ref: switchRef }),
    e(fields.RadioGroup, { label: 'Scope', name: 'scope', form: 'outside', options: [{ value: 'a', label: 'Alpha' }, { value: 'c', label: 'Charlie' }], defaultValue: 'a', ref: radioRef }),
    e(fields.NumberField, { label: 'Count', name: 'count', form: 'outside', defaultValue: 2, ref: numberRef }),
  ), async ({ document, window }) => {
    const form = document.getElementById('outside');
    const data = () => new window.FormData(form);
    const toggle = document.querySelector('[role="switch"]');
    const charlie = [...document.querySelectorAll('[role="radio"]')].find(node => node.closest('label')?.textContent === 'Charlie');
    await act(async () => { toggle.click(); charlie.click(); document.querySelector('button[aria-label="값 증가"]').click(); });
    assert.deepEqual(['enabled', 'scope', 'count'].map(name => data().get(name)), [null, 'c', '3']);
    assert.equal(toggle.getAttribute('aria-checked'), 'false');
    assert.equal(charlie.getAttribute('aria-checked'), 'true');
    assert.equal(numberRef.current.value, '3');
    await act(async () => form.reset());
    assert.deepEqual(['enabled', 'scope', 'count'].map(name => data().get(name)), [null, 'c', '3']);
    assert.equal(toggle.getAttribute('aria-checked'), 'false');
    assert.equal(charlie.getAttribute('aria-checked'), 'true');
    assert.equal(numberRef.current.value, '3');
    cancel = false;
    await act(async () => form.reset());
    assert.deepEqual(['enabled', 'scope', 'count'].map(name => data().get(name)), ['on', 'a', '2']);
    assert.equal(toggle.getAttribute('aria-checked'), 'true');
    assert.equal(charlie.getAttribute('aria-checked'), 'false');
    assert.equal(numberRef.current.value, '2');
    assert.equal(switchRef.current?.form, form);
    assert.equal(radioRef.current?.form, form);
    assert.equal(numberRef.current?.isConnected, true);
  });
});

test('accepted reset preserves caller-controlled values and does not report a value change', async () => {
  let current = { team: 'a', member: 'a', members: ['a'], enabled: true, scope: 'a', count: 5 };
  let changes = 0;
  const choices = [{ value: 'a', label: 'Alpha' }, { value: 'c', label: 'Charlie' }];
  const numberRef = React.createRef();
  const view = () => e('form', null,
    e(fields.Select, { label: 'Team', name: 'team', options: choices, value: current.team, onValueChange() { changes++; } }),
    e(fields.Combobox, { label: 'Member', name: 'member', options: choices, value: current.member, onValueChange() { changes++; } }),
    e(fields.MultiSelect, { label: 'Members', name: 'members', options: choices, value: current.members, onValueChange() { changes++; } }),
    e(fields.Switch, { label: 'Enabled', name: 'enabled', checked: current.enabled, onCheckedChange() { changes++; } }),
    e(fields.RadioGroup, { label: 'Scope', name: 'scope', options: choices, value: current.scope, onValueChange() { changes++; } }),
    e(fields.NumberField, { label: 'Count', name: 'count', value: current.count, onValueChange() { changes++; }, ref: numberRef }),
  );
  await withClient(view(), async ({ document, window, root }) => {
    const form = document.querySelector('form');
    const data = () => new window.FormData(form);
    current = { team: 'c', member: 'c', members: ['a', 'c'], enabled: false, scope: 'c', count: 5 };
    await act(async () => root.render(view()));
    assert.deepEqual(['team', 'member', 'enabled', 'scope', 'count'].map(name => data().get(name)), ['c', 'c', null, 'c', '5']);
    assert.deepEqual(data().getAll('members'), ['a', 'c']);
    assert.equal(document.querySelector('[role="switch"]').getAttribute('aria-checked'), 'false');
    assert.equal(numberRef.current.value, '5');
    await act(async () => form.reset());
    assert.deepEqual(['team', 'member', 'enabled', 'scope', 'count'].map(name => data().get(name)), ['c', 'c', null, 'c', '5']);
    assert.deepEqual(data().getAll('members'), ['a', 'c']);
    assert.equal(document.querySelector('.hds-field__numberInput').value, '5');
    assert.equal(document.querySelector('[role="switch"]').getAttribute('aria-checked'), 'false');
    assert.equal(numberRef.current, document.querySelector('.hds-field__numberInput'));
    assert.equal(changes, 0);
  });
});
