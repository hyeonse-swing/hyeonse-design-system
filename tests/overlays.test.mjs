import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../dist/primitives.js';

// Base UI determines DOM availability on import. Keep the interaction checks in
// a DOM-enabled module while SSR contracts still use renderToStaticMarkup.
const clientDom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.test/', pretendToBeVisual: true,
});
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'MutationObserver']) {
  globalThis[key] = clientDom.window[key];
}
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: clientDom.window.navigator });
globalThis.requestAnimationFrame = clientDom.window.requestAnimationFrame.bind(clientDom.window);
globalThis.cancelAnimationFrame = clientDom.window.cancelAnimationFrame.bind(clientDom.window);
globalThis.getComputedStyle = clientDom.window.getComputedStyle.bind(clientDom.window);
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const overlays = await import('../dist/overlays.js');
const { createRoot } = await import('react-dom/client');

const el = React.createElement;
const trigger = (name, id) => el(Button, { type: 'button', variant: 'secondary', id }, name);
const items = [
  { kind: 'action', id: 'open', label: '열기', onSelect() {} },
  { kind: 'checkbox', id: 'pin', label: '고정', checked: true, onCheckedChange() {} },
  { kind: 'separator', id: 'divider' },
  { kind: 'submenu', id: 'more', label: '더 보기', items: [{ kind: 'action', id: 'copy', label: '복사', onSelect() {} }] },
];

test('all overlay APIs are public named runtime functions', () => {
  assert.deepEqual(Object.keys(overlays).sort(), [
    'AlertDialog', 'ContextMenu', 'Dialog', 'DropdownMenu', 'Popover', 'Sheet', 'ToastProvider', 'Tooltip', 'useToast',
  ]);
  assert.ok(Object.values(overlays).every(value => typeof value === 'function'));
});

test('composed triggers keep one native button and caller attributes in SSR', () => {
  const components = [
    [overlays.DropdownMenu, { items }],
    [overlays.ContextMenu, { items }],
    [overlays.Dialog, { title: '설정' }],
    [overlays.AlertDialog, { title: '삭제', confirmLabel: '삭제', cancelLabel: '취소', onConfirm() {} }],
    [overlays.Sheet, { title: '상세', side: 'left', size: 'sm' }],
    [overlays.Popover, { title: '도움말' }],
    [overlays.Tooltip, { content: '단축키 도움말' }],
  ];
  for (const [Component, props] of components) {
    const name = Component.name;
    const dom = new JSDOM(renderToStaticMarkup(el(Component, { ...props, trigger: trigger(name, `trigger-${name}`) })));
    const buttons = dom.window.document.querySelectorAll('button');
    assert.equal(buttons.length, 1, `${name} must not nest or duplicate trigger buttons`);
    assert.equal(buttons[0].id, `trigger-${name}`);
    assert.equal(buttons[0].type, 'button');
    assert.equal(buttons[0].textContent, name);
    assert.match(buttons[0].className, /hds-button/);
    dom.window.close();
  }
});

test('ToastProvider scopes useToast and renders a viewport without initial notifications', () => {
  function Consumer() {
    const toast = overlays.useToast();
    assert.equal(typeof toast.add, 'function');
    assert.equal(typeof toast.close, 'function');
    return el('span', null, '알림 준비');
  }
  const dom = new JSDOM(renderToStaticMarkup(el(overlays.ToastProvider, null, el(Consumer))));
  assert.match(dom.window.document.body.textContent, /알림 준비/);
  assert.equal(dom.window.document.querySelectorAll('.hds-toast').length, 0);
  dom.window.close();
});

test('AlertDialog confirmation is a required, separate callback in the declaration', async () => {
  const { readFile } = await import('node:fs/promises');
  const declaration = await readFile(new URL('../dist/overlays.d.ts', import.meta.url), 'utf8');
  assert.match(declaration, /confirmLabel: string/);
  assert.match(declaration, /cancelLabel: string/);
  assert.match(declaration, /onConfirm: \(\) => void \| Promise<void>/);
  assert.match(declaration, /pending\?: boolean/);
  assert.match(declaration, /confirmDisabled\?: boolean/);
});

async function mountAlert(props) {
  const mount = document.createElement('div');
  document.body.append(mount);
  const root = createRoot(mount);
  await act(async () => root.render(el(overlays.AlertDialog, {
    trigger: trigger('열기', 'alert-trigger'), title: '삭제할까요?', confirmLabel: '삭제', cancelLabel: '취소',
    defaultOpen: true, ...props,
  })));
  const dialog = () => document.querySelector('[role="alertdialog"]');
  const button = label => [...document.querySelectorAll('button')].find(node => node.textContent === label);
  return { dialog, button, async cleanup() { await act(async () => root.unmount()); mount.remove(); } };
}

test('AlertDialog cancel never confirms and closes', async () => {
  let confirms = 0;
  const view = await mountAlert({ onConfirm() { confirms++; } });
  try {
    assert(view.dialog());
    await act(async () => view.button('취소').click());
    assert.equal(confirms, 0);
    assert.equal(view.dialog(), null);
  } finally { await view.cleanup(); }
});

test('AlertDialog guards duplicate confirm and dismissal while async work is pending', async () => {
  let confirms = 0;
  let finish;
  const work = new Promise(resolve => { finish = resolve; });
  const view = await mountAlert({ onConfirm() { confirms++; return work; } });
  try {
    await act(async () => { view.button('삭제').click(); view.button('삭제').click(); });
    assert.equal(confirms, 1);
    assert.equal(view.button('삭제').disabled, true);
    assert.equal(view.button('취소').disabled, true);
    assert(view.dialog());
    await act(async () => finish());
    assert.equal(view.dialog(), null);
  } finally { await view.cleanup(); }
});

test('AlertDialog disabled confirm and rejected confirmation keep it open', async () => {
  let confirms = 0;
  const blocked = await mountAlert({ confirmDisabled: true, onConfirm() { confirms++; } });
  try {
    assert.equal(blocked.button('삭제').disabled, true);
    await act(async () => blocked.button('삭제').click());
    assert.equal(confirms, 0);
    assert(blocked.dialog());
  } finally { await blocked.cleanup(); }

  let reported;
  const failed = await mountAlert({ onConfirm() { throw new Error('save failed'); }, onError(error) { reported = error; } });
  try {
    await act(async () => failed.button('삭제').click());
    assert.equal(reported?.message, 'save failed');
    assert(failed.dialog());
    assert.equal(failed.button('삭제').disabled, false);
  } finally { await failed.cleanup(); }
});

test('DropdownMenu preserves trigger handler/ref and executes the chosen action once', async () => {
  const mount = document.createElement('div');
  document.body.append(mount);
  const root = createRoot(mount);
  const ref = React.createRef();
  let triggerClicks = 0;
  let actions = 0;
  try {
    await act(async () => root.render(el(overlays.DropdownMenu, {
      trigger: el(Button, { ref, onClick() { triggerClicks++; } }, '작업 열기'),
      items: [{ kind: 'action', id: 'run', label: '실행', onSelect() { actions++; } }],
    })));
    const button = mount.querySelector('button');
    assert.equal(ref.current, button);
    await act(async () => button.click());
    assert.equal(triggerClicks, 1);
    const item = [...document.querySelectorAll('[role="menuitem"]')].find(node => node.textContent === '실행');
    assert(item);
    await act(async () => item.click());
    assert.equal(actions, 1);
  } finally {
    await act(async () => root.unmount());
    mount.remove();
  }
});

test('useToast adds a scoped announcement with a close control', async () => {
  const mount = document.createElement('div');
  document.body.append(mount);
  const root = createRoot(mount);
  function Consumer() {
    const toast = overlays.useToast();
    return el('button', { type: 'button', onClick() { toast.add({ title: '저장 완료', description: '변경 사항이 저장됐어요.', tone: 'success' }); } }, '알림 만들기');
  }
  try {
    await act(async () => root.render(el(overlays.ToastProvider, { closeLabel: '알림 닫기', viewportLabel: '작업 알림' }, el(Consumer))));
    await act(async () => mount.querySelector('button').click());
    const notice = document.querySelector('.hds-toast');
    assert(notice);
    assert.equal(notice.getAttribute('data-type'), 'success');
    assert.match(notice.textContent, /저장 완료/);
    assert.match(notice.textContent, /변경 사항이 저장됐어요/);
    const close = notice.querySelector('button[aria-label="알림 닫기"]');
    assert(close);
    assert.equal(close.getAttribute('aria-hidden'), 'false', 'The visible close control is accessible before hover or keyboard entry');
    assert.equal(document.querySelector('.hds-toast__viewport').getAttribute('aria-label'), '작업 알림');
    assert.equal(close.firstElementChild.getAttribute('aria-hidden'), 'true', 'The decorative glyph does not replace the button name');
    await act(async () => close.click());
    assert.equal(document.querySelector('.hds-toast'), null);
  } finally {
    await act(async () => root.unmount());
    mount.remove();
  }
});

test('portaled dialog and menu use resolved root size', async () => {
  const { SizeContext } = await import('../dist/sizing.js');
  const mount = document.createElement('div');
  document.body.append(mount);
  const root = createRoot(mount);
  try {
    await act(async () => root.render(el(SizeContext.Provider, { value: 'sm' },
      el(overlays.Dialog, { trigger: trigger('설정 열기', 'sized-dialog'), title: '설정', defaultOpen: true }, '본문')
    )));
    assert.equal(document.querySelector('.hds-dialog__portal').getAttribute('data-hds-size'), 'sm');
    await act(async () => root.render(el(SizeContext.Provider, { value: 'sm' },
      el(overlays.DropdownMenu, { trigger: trigger('메뉴 열기', 'sized-menu'), items, defaultOpen: true, size: 'xl' })
    )));
    assert.equal(document.querySelector('.hds-menu__positioner').getAttribute('data-hds-size'), 'xl');
  } finally {
    await act(async () => root.unmount());
    mount.remove();
  }
});
