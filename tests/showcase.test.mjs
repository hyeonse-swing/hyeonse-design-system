import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { showcaseCharacters } from '../scripts/ensure-fonts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, '.site');
const html = readFileSync(join(output, 'index.html'), 'utf8');

test('showcase ships readable HTML, linked references and real form semantics before hydration', () => {
  const dom = new JSDOM(html, { url: 'https://showcase.invalid/' });
  try {
    const { document } = dom.window;
    assert.equal(document.documentElement.lang, 'ko');
    assert.equal(document.querySelectorAll('h1').length, 1);
    for (const id of ['overview', 'tokens', 'components', 'preferences', 'start', 'api']) assert(document.getElementById(id), id);
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    assert.equal(ids.length, new Set(ids).size, 'SSR-generated field IDs must be unique');
    for (const label of document.querySelectorAll('label[for]')) assert(document.getElementById(label.htmlFor), `Missing label target: ${label.htmlFor}`);
    for (const element of document.querySelectorAll('[aria-describedby], [aria-labelledby]')) {
      for (const name of ['aria-describedby', 'aria-labelledby']) {
        for (const id of (element.getAttribute(name) || '').split(/\s+/).filter(Boolean)) assert(document.getElementById(id), `Missing description: ${id}`);
      }
    }
    assert(document.querySelector('.demo-form fieldset[disabled]'), 'Demo must not submit input data before JS is available');
    assert(document.querySelector('.hds-button'), 'Uses packaged buttons');
    assert(document.querySelector('.hds-panel'), 'Uses packaged settings panel');
    for (const element of document.querySelectorAll('a[href], link[href], script[src]')) {
      const href = element.getAttribute('href') || element.getAttribute('src');
      const url = new URL(href, dom.window.location.href);
      if (url.origin !== dom.window.location.origin) continue;
      if (url.pathname === '/') {
        if (url.hash) assert(document.getElementById(decodeURIComponent(url.hash.slice(1))), href);
      } else assert(existsSync(join(output, decodeURIComponent(url.pathname))), `Missing published reference: ${href}`);
    }
    assert(!existsSync(join(output, '.render.mjs')), 'Server build artifact is not public');
    assert(!existsSync(join(output, 'node_modules')), 'Development dependencies are not public');
    assert(readdirSync(join(output, 'assets')).some(file => /^showcase-[A-Z0-9]+\.js$/.test(file)));
  } finally { dom.window.close(); }
});

test('showcase applies stored and device preferences before its stylesheets', () => {
  const dom = new JSDOM(html, { url: 'https://showcase.invalid/', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    const script = window.document.querySelector('script:not([src])');
    assert(script);
    assert(html.indexOf(script.outerHTML) < html.indexOf('href="./dist/tokens.css"'));
    window.matchMedia = query => ({ matches: query.includes('reduced-motion') || query.includes('color-scheme') });
    window.localStorage.setItem('hyeonse-site-preferences', JSON.stringify({ theme: 'system', accent: 'forest', corners: 'soft', density: 'compact', motion: 'full' }));
    window.eval(script.textContent);
    assert.deepEqual({ ...window.document.documentElement.dataset }, {
      theme: 'dark', themePreference: 'system', accent: 'forest', density: 'compact', corners: 'soft', motion: 'reduced',
    });
  } finally { dom.window.close(); }
});

test('showcase font coverage matches the checked asset and current UI copy', async () => {
  const coverage = JSON.parse(readFileSync(join(root, 'scripts/font-coverage.json'), 'utf8'));
  const font = readFileSync(join(output, 'docs/assets/fonts/noto-kr-subset.woff2'));
  assert.equal(createHash('sha256').update(font).digest('hex'), coverage.sha256);
  const required = await showcaseCharacters(root);
  assert.deepEqual([...required].filter(character => !coverage.characters.includes(character)), []);
});
