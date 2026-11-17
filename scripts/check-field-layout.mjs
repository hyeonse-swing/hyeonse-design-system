import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

// Run after `npm run build:site`. Size changes below exercise CSS only; React
// component props and portal size propagation are covered by check-sizing.mjs.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '.site');
const output = join(root, 'output/browser-field-layout');
const engines = { chromium, firefox, webkit };
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines);
assert(names.every(name => Object.hasOwn(engines, name)), 'Use chromium, firefox, or webkit.');
const heights = { xs: 28, sm: 32, md: 36, lg: 40, xl: 48 };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(site, pathname.slice(1) || 'index.html');
    if (!file.startsWith(site + sep)) return void response.writeHead(403).end();
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'text/plain', 'Cache-Control': 'no-store' }).end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});

let assertions = 0;
const results = [];
function near(actual, expected, message) {
  assertions++;
  assert(Math.abs(actual - expected) <= 1, `${message}: expected ${expected}px, got ${actual}px`);
}
function check(value, message) { assertions++; assert(value, message); }

async function measure(page) {
  return page.locator('[data-suite="fields"]').evaluate(scope => {
    const rect = node => {
      const { top, right, bottom, left, width, height } = node.getBoundingClientRect();
      return { top, right, bottom, left, width, height };
    };
    const find = label => {
      const field = [...scope.querySelectorAll('.hds-field')].find(node => node.querySelector('.hds-field__label')?.textContent === label);
      if (!field) throw new Error(`Missing field: ${label}`);
      return field;
    };
    const controls = {
      Input: find('표시 이름').querySelector('.hds-field__control'),
      Select: find('소속 팀').querySelector('.hds-field__trigger'),
      Combobox: find('담당 팀 검색').querySelector('.hds-field__inputGroup'),
      NumberField: find('초대 수').querySelector('.hds-field__numberGroup'),
      DateField: find('예정 날짜').querySelector('.hds-field__control'),
      FileInput: find('참고 파일').querySelector('.hds-field__control'),
      PasswordField: find('접속 코드').querySelector('.hds-field__passwordGroup'),
    };
    const buttons = [...scope.querySelectorAll('.hds-field__iconButton, .hds-field__passwordToggle')].map(node => {
      const outer = node.closest('.hds-field__inputGroup, .hds-field__passwordGroup');
      const style = getComputedStyle(node);
      return { kind: node.className, border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth], rect: rect(node), outer: rect(outer) };
    });
    return {
      controls: Object.fromEntries(Object.entries(controls).map(([name, node]) => [name, rect(node).height])),
      textarea: rect(find('추가 설명').querySelector('textarea')).height,
      multiSelect: rect(find('협업 팀').querySelector('.hds-field__multiGroup')).height,
      buttons,
    };
  });
}

async function exercise(page, engine, width, theme, touch, base) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
  await page.goto(base);
  await page.locator('[data-library-category="fields"]').click();
  await page.locator('[data-suite="fields"] fieldset:not([disabled])').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  const detail = [];
  for (const [size, height] of Object.entries(heights)) {
    // The showcase has one bare Input and FieldShell wrappers for the rest.
    await page.locator('[data-suite="fields"]').evaluate((scope, value) => {
      scope.querySelectorAll('.hds-field').forEach(field => { field.dataset.hdsSize = value; });
      scope.querySelector('#fields-alias').dataset.hdsSize = value;
    }, size);
    const m = await measure(page);
    const expected = Math.max(height, await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hds-target-min')) || 24));
    for (const [name, actual] of Object.entries(m.controls)) near(actual, expected, `${engine} ${width} ${theme} ${size} ${name}`);
    check(m.textarea > expected * 1.5, `${engine} ${width} ${theme} ${size}: Textarea stays multiline (${m.textarea}px)`);
    check(m.multiSelect >= expected - 1, `${engine} ${width} ${theme} ${size}: MultiSelect may grow but cannot shrink (${m.multiSelect}px)`);
    check(m.buttons.length >= 3, `${engine} ${width} ${theme} ${size}: embedded triggers found`);
    for (const button of m.buttons) {
      check(button.border.every(value => parseFloat(value) === 0), `${engine} ${width} ${theme} ${size} ${button.kind}: no overlapping input border; got ${button.border}`);
      check(button.rect.left >= button.outer.left - 1 && button.rect.right <= button.outer.right + 1 && button.rect.top >= button.outer.top - 1 && button.rect.bottom <= button.outer.bottom + 1,
        `${engine} ${width} ${theme} ${size} ${button.kind}: trigger stays inside control`);
      if (touch) {
        check(button.rect.width >= 44, `${engine} ${width} touch ${theme} ${size} ${button.kind}: trigger width ${button.rect.width}px is below 44px`);
        check(button.rect.height >= 44, `${engine} ${width} touch ${theme} ${size} ${button.kind}: trigger height ${button.rect.height}px is below 44px`);
      }
    }
    detail.push({ size, expected, ...m });
    if (size === 'md') await page.locator('[data-suite="fields"]').screenshot({ path: join(output, `${engine}-${width}${touch ? '-touch' : ''}-${theme}.png`) });
  }
  check(errors.length === 0, `${engine} ${width} ${theme}: browser errors: ${errors.join('; ')}`);
  return detail;
}

let base;
let failed = false;
await mkdir(output, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
base = `http://127.0.0.1:${server.address().port}/`;
try {
  for (const name of names) {
    const browser = await engines[name].launch({ headless: true });
    try {
      const viewports = [[1440, false], [390, false], ...(name === 'firefox' ? [] : [[390, true]])];
      for (const [width, touch] of viewports) for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        try {
          const detail = await exercise(page, name, width, theme, touch, base);
          results.push({ engine: name, width, theme, touch, pass: true, detail });
          console.log(`PASS ${name} ${width}${touch ? ' touch' : ''} ${theme}`);
        } catch (error) {
          failed = true;
          results.push({ engine: name, width, theme, touch, pass: false, error: error.stack });
          console.error(`FAIL ${name} ${width}${touch ? ' touch' : ''} ${theme}: ${error.stack}`);
          await page.screenshot({ path: join(output, `${name}-${width}${touch ? '-touch' : ''}-${theme}-failure.png`) }).catch(() => {});
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await writeFile(join(output, `result-${names.join('-')}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), browsers: names, assertions, passed: !failed, results }, null, 2) + '\n');
}
if (failed) process.exitCode = 1;
