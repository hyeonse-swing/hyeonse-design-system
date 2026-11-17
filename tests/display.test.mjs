import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
const { Card, Breadcrumb, Pagination, Stepper, Table, TableCaption, TableHeader, TableBody, TableRow, TableHead, TableCell, Progress, Spinner, Skeleton, Avatar, Label, VisuallyHidden, Tabs, TabsList, TabsTab, TabsPanel } = await import(process.env.HDS_DISPLAY_TEST_MODULE ?? '../dist/display.js');
const h = React.createElement;
const documentOf = element => new JSDOM(renderToStaticMarkup(element)).window.document;

test('navigation renders current location, finite pages, and current process step', () => {
  const document = documentOf(h(React.Fragment, null,
    h(Breadcrumb, { items: [{ label: '홈', href: '/' }, { label: '결과', href: '/wrong' }] }),
    h(Pagination, { page: 5, pageCount: 10, onPageChange() {} }),
    h(Stepper, { currentStep: 2, steps: [{ label: '시작' }, { label: '진행' }, { label: '완료' }] })
  ));
  assert.equal(document.querySelector('.hds-breadcrumb [aria-current="page"]').textContent, '결과');
  assert.equal(document.querySelector('.hds-breadcrumb a').getAttribute('href'), '/');
  assert.equal(document.querySelectorAll('.hds-breadcrumb a').length, 1);
  assert.equal(document.querySelector('.hds-pagination [aria-current="page"]').textContent, '5');
  assert.equal(document.querySelectorAll('.hds-pagination button').length, 7);
  assert.equal(document.querySelector('.hds-stepper [aria-current="step"]').textContent, '2진행');
  assert.equal(document.querySelectorAll('.hds-stepper li[data-status="complete"]').length, 1);
});

test('invalid page and progress values are rejected, bounded progress is clamped', () => {
  assert.throws(() => renderToStaticMarkup(h(Pagination, { page: 0, pageCount: 3, onPageChange() {} })), RangeError);
  assert.throws(() => renderToStaticMarkup(h(Pagination, { page: 1, pageCount: Infinity, onPageChange() {} })), RangeError);
  assert.throws(() => renderToStaticMarkup(h(Progress, { value: NaN, label: '진행' })), RangeError);
  const document = documentOf(h(React.Fragment, null, h(Progress, { value: 120, label: '진행' }), h(Progress, { label: '대기' })));
  const bars = document.querySelectorAll('[role="progressbar"]');
  assert.equal(bars[0].getAttribute('aria-valuenow'), '100');
  assert.equal(bars[0].firstElementChild.style.width, '100%');
  assert.equal(bars[1].hasAttribute('aria-valuenow'), false);
});

test('semantic table, status and helper primitives retain native structure', () => {
  const document = documentOf(h(React.Fragment, null,
    h(Table, { scrollLabel: '주문 표 스크롤' }, h(TableCaption, null, '합계'), h(TableHeader, null, h(TableRow, null, h(TableHead, null, '품목'))), h(TableBody, null, h(TableRow, null, h(TableCell, null, '노트')))),
    h(Spinner), h(Skeleton), h(Avatar, { alt: '현세', fallback: '현' }), h(Label, { htmlFor: 'name' }, '이름'), h('input', { id: 'name' }), h(VisuallyHidden, null, '보조 문구')
  ));
  assert.equal(document.querySelector('table caption').textContent, '합계');
  assert.equal(document.querySelector('th').getAttribute('scope'), 'col');
  assert.equal(document.querySelector('td').textContent, '노트');
  assert.equal(document.querySelector('.hds-tableScroll').getAttribute('tabindex'), '0');
  assert.equal(document.querySelector('.hds-tableScroll').getAttribute('aria-label'), '주문 표 스크롤');
  assert.equal(document.querySelector('.hds-spinner').getAttribute('aria-label'), '불러오는 중');
  assert.equal(document.querySelector('.hds-skeleton').getAttribute('aria-hidden'), 'true');
  assert.equal(document.querySelector('.hds-avatar span').textContent, '현');
  assert.equal(document.querySelector('.hds-avatar [role="img"]').getAttribute('aria-label'), '현세');
  assert.equal(document.querySelector('input').labels[0].textContent, '이름');
  assert.equal(document.querySelector('.hds-visuallyHidden').textContent, '보조 문구');
});

test('avatar shows named image, named fallback on failure, and new image after src changes', async () => {
  const dom = new JSDOM('<div id="app"></div>', { url: 'https://example.test/' });
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('app'));
  try {
    await act(async () => root.render(h(Avatar, { src: '/broken.png', alt: '현세', fallback: '현' })));
    const first = dom.window.document.querySelector('.hds-avatar img');
    assert.equal(first.getAttribute('alt'), '현세');
    await act(async () => first.dispatchEvent(new dom.window.Event('error')));
    assert.equal(dom.window.document.querySelector('.hds-avatar img'), null);
    assert.equal(dom.window.document.querySelector('.hds-avatar [role="img"]').getAttribute('aria-label'), '현세');
    await act(async () => root.render(h(Avatar, { src: '/working.png', alt: '현세', fallback: '현' })));
    assert.equal(dom.window.document.querySelector('.hds-avatar img').getAttribute('src'), '/working.png');
    assert.equal(dom.window.document.querySelector('.hds-avatar [role="img"]'), null);
  } finally {
    await act(async () => root.unmount());
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    dom.window.close();
  }
});

test('tabs expose selected state and panel in server output', () => {
  const document = documentOf(h(Tabs, { defaultValue: 'a' }, h(TabsList, null, h(TabsTab, { value: 'a' }, 'A'), h(TabsTab, { value: 'b' }, 'B')), h(TabsPanel, { value: 'a' }, 'Content A'), h(TabsPanel, { value: 'b' }, 'Content B')));
  const active = document.querySelector('[role="tab"][aria-selected="true"]');
  assert(active);
  assert.equal(active.textContent, 'A');
  assert.equal(document.querySelector('[role="tabpanel"]').textContent, 'Content A');
});

test('display roots inherit a size and allow a nested override', async () => {
  const { SizeContext } = await import('../dist/sizing.js');
  const document = documentOf(h(SizeContext.Provider, { value: 'sm' },
    h(Card, { title: '카드' },
      h(Avatar, { alt: '사용자', fallback: '사' }),
      h(Pagination, { size: 'xl', page: 1, pageCount: 2, onPageChange() {} })
    )
  ));
  assert.equal(document.querySelector('.hds-card').getAttribute('data-hds-size'), 'sm');
  assert.equal(document.querySelector('.hds-avatar').getAttribute('data-hds-size'), 'sm');
  assert.equal(document.querySelector('.hds-avatar').classList.contains('hds-avatar--sm'), true);
  assert.equal(document.querySelector('.hds-pagination').getAttribute('data-hds-size'), 'xl');
});
