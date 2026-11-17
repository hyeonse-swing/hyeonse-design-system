import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '.site');
const output = join(root, 'output/browser-sizing');
const engines = { chromium, firefox, webkit };
const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(engines);
assert(names.every(name => Object.hasOwn(engines, name)), 'Use chromium, firefox, or webkit.');
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
const heights = [28, 32, 36, 40, 48];
const gaps = [4, 8, 12, 16, 24];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(site, pathname.slice(1) || 'index.html');
    if (!file.startsWith(site + sep)) return void response.writeHead(403).end();
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'text/plain', 'Cache-Control': 'no-store' }).end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});
const results = [];
let assertions = 0;
function check(actual, expected, message) { assertions++; assert.deepEqual(actual, expected, message); }
function near(actual, expected, message) { assertions++; assert(Math.abs(actual - expected) <= 1, `${message}: expected ${expected}px, got ${actual}px`); }
async function metrics(page) {
  return page.locator('#component-sizing').evaluate(section => {
    const surface = section.querySelector('.sizing-surface');
    const button = [...surface.querySelectorAll('.hds-button')].find(node => node.textContent === '변경 사항 저장');
    const override = [...surface.querySelectorAll('.hds-button')].find(node => node.textContent === '항상 XS');
    const field = surface.querySelector('.hds-textField__input');
    const select = surface.querySelector('.hds-field__trigger');
    const card = surface.querySelector('.hds-card');
    const table = surface.querySelector('.hds-table');
    const stack = surface.querySelector('.hds-stack');
    const grid = surface.querySelector('.hds-grid');
    const cells = [...grid.children].map(node => node.getBoundingClientRect());
    const height = node => node.getBoundingClientRect().height;
    return {
      size: surface.dataset.hdsSize,
      button: height(button), buttonWidth: button.getBoundingClientRect().width, override: height(override), overrideWidth: override.getBoundingClientRect().width, overrideSize: override.dataset.hdsSize,
      field: height(field), select: height(select), cardSize: card.dataset.hdsSize,
      cardPadding: parseFloat(getComputedStyle(card).paddingTop),
      tableSize: table.closest('[data-hds-size]')?.dataset.hdsSize,
      cellPadding: parseFloat(getComputedStyle(table.querySelector('th')).paddingLeft),
      gap: parseFloat(getComputedStyle(stack).rowGap),
      tabsTabWidth: surface.querySelector('.hds-tabs__tab').getBoundingClientRect().width,
      gridColumns: Math.abs(cells[0].top - cells[1].top) <= 1 ? 2 : 1,
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
}
async function exercise(page, engine, width, touch = false) {
  const context = page.context();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
  await page.goto(base);
  await page.locator('#component-sizing .sizing-surface').waitFor();
  const section = page.locator('#component-sizing');
  const row = section.locator('.sizing-button-row .hds-button');
  check(await row.count(), 5, `${engine} ${width}: five comparison buttons`);
  for (let i = 0; i < sizes.length; i++) {
    const height = await row.nth(i).evaluate(node => node.getBoundingClientRect().height);
    touch ? check(height >= 44, true, `${engine} touch ${sizes[i]} comparison target`) : near(height, heights[i], `${engine} ${sizes[i]} comparison button`);
  }
  const detail = [];
  const sizeMismatches = [];
  const recordNear = (actual, expected, message) => {
    assertions++;
    if (Math.abs(actual - expected) > 1) sizeMismatches.push(`${message}: expected ${expected}px, got ${actual}px`);
  };
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    await section.getByRole('radio', { name: size.toUpperCase(), exact: true }).check();
    const m = await metrics(page);
    check(m.size, size, `${engine} ${width}: surface ${size}`);
    check(m.cardSize, size, `${engine} ${width}: card ${size}`);
    check(m.tableSize, size, `${engine} ${width}: table ${size}`);
    check(m.overrideSize, 'xs', `${engine} ${width}: explicit xs override`);
    near(m.gap, gaps[i], `${engine} ${width}: stack gap ${size}`);
    check(m.pageOverflow, false, `${engine} ${width}: no page overflow ${size}`);
    check(m.gridColumns, width === 1440 ? 2 : 1, `${engine} ${width}: grid columns ${size}`);
    if (touch) {
      for (const [label, value] of [['button height', m.button], ['button width', m.buttonWidth], ['field height', m.field], ['select height', m.select], ['override height', m.override], ['override width', m.overrideWidth], ['tab width', m.tabsTabWidth]]) check(value >= 44, true, `${engine} touch ${size}: ${label} target`);
    } else if (width === 1440) {
      near(m.button, heights[i], `${engine} ${size}: inherited button`);
      near(m.field, heights[i], `${engine} ${size}: inherited field`);
      recordNear(m.select, heights[i], `${engine} ${size}: inherited select`);
      near(m.override, 28, `${engine} ${size}: xs override height`);
    }
    // A choice must still update the controlled surface after each size change.
    const range = section.locator('.sizing-surface .hds-field__trigger');
    if (touch) await range.tap(); else await range.click();
    const positioner = page.locator('.hds-field__positioner').filter({ visible: true });
    check(await positioner.getAttribute('data-hds-size'), size, `${engine} ${width}: Select portal ${size}`);
    const desired = i % 2 ? '나만 보기' : '팀과 공유';
    if (touch) await page.getByRole('option', { name: desired, exact: true }).tap();
    else await page.getByRole('option', { name: desired, exact: true }).click();
    const selectedText = await range.innerText();
    check(selectedText.includes(desired), true, `${engine} ${width}: Select remains interactive ${size}; expected ${desired}, saw ${selectedText}`);
    if (width === 1440 || width === 390 || width === 320) {
      if (touch) await section.getByRole('button', { name: '크기별 모달 열기' }).tap();
      else await section.getByRole('button', { name: '크기별 모달 열기' }).click();
      const dialog = page.getByRole('dialog', { name: '변경 사항 미리보기' });
      await dialog.waitFor();
      check(await page.locator('.hds-dialog__portal').getAttribute('data-hds-size'), size, `${engine}: dialog portal ${size}`);
      const dialogWidth = await dialog.evaluate(node => node.getBoundingClientRect().width);
      near(dialogWidth, Math.min([320, 400, 520, 680, 840][i], width < 480 ? width - 24 : width - 32), `${engine}: dialog width ${size} at ${width}`);
      check(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${engine}: modal page overflow ${size} at ${width}`);
      const nestedHeight = await dialog.getByRole('button', { name: '확인' }).evaluate(node => node.getBoundingClientRect().height);
      touch ? check(nestedHeight >= 44, true, `${engine}: touch nested button ${size}`) : width === 1440 ? near(nestedHeight, heights[i], `${engine}: nested button ${size}`) : check(nestedHeight >= heights[i], true, `${engine}: mobile nested button ${size}`);
      if (width === 1440) {
        const nestedSelect = dialog.locator('.hds-field__trigger');
        await nestedSelect.click();
        check(await page.locator('.hds-field__positioner').filter({ visible: true }).getAttribute('data-hds-size'), size, `${engine}: nested Select portal ${size}`);
        await page.getByRole('option', { name: '팀과 공유', exact: true }).click();
        check((await nestedSelect.innerText()).includes('팀과 공유'), true, `${engine}: nested Select works ${size}`);
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    }
    detail.push({ size, ...m });
    if (size === 'sm' && width === 1440 && !touch) await section.screenshot({ path: join(output, `${engine}-1440-sm.png`) });
    if (size === 'sm' && width === 390 && !touch) await page.screenshot({ path: join(output, `${engine}-390-sm.png`) });
  }
  if (width === 1440 && !touch) {
    await section.getByRole('radio', { name: 'SM', exact: true }).check();
    const densityMeasurements = async () => {
      const card = await section.locator('.sizing-surface .hds-card').first().evaluate(node => parseFloat(getComputedStyle(node).paddingTop));
      await section.locator('.sizing-surface .hds-field__trigger').click();
      const option = await page.getByRole('option', { name: '팀과 공유', exact: true }).evaluate(node => parseFloat(getComputedStyle(node).paddingLeft));
      await page.keyboard.press('Escape');
      await section.getByRole('button', { name: '크기별 모달 열기' }).click();
      const dialog = await page.getByRole('dialog', { name: '변경 사항 미리보기' }).evaluate(node => parseFloat(getComputedStyle(node).paddingTop));
      await page.keyboard.press('Escape');
      return { card, option, dialog };
    };
    await page.evaluate(() => { document.documentElement.dataset.density = 'comfortable'; });
    const comfortable = await densityMeasurements();
    await page.evaluate(() => { document.documentElement.dataset.density = 'compact'; });
    const compact = await densityMeasurements();
    for (const key of ['card', 'option', 'dialog']) {
      check(compact[key] < comfortable[key], true, `${engine}: compact ${key} padding shrinks`);
      near(compact[key], comfortable[key] * .8, `${engine}: compact ${key} ratio`);
    }
    await page.evaluate(() => { document.documentElement.dataset.density = 'comfortable'; });
  }
  check(sizeMismatches, [], `${engine} ${width}: measured control heights`);
  check(errors, [], `${engine} ${width}: browser errors`);
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
      for (const [width, touch] of [[1440, false], [390, false], [320, false], [390, true]]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        try {
          const detail = await exercise(page, name, width, touch);
          results.push({ engine: name, width, touch, pass: true, detail });
          console.log(`PASS ${name} ${width}${touch ? ' touch' : ''}`);
        } catch (error) {
          failed = true;
          results.push({ engine: name, width, touch, pass: false, error: error.stack });
          console.error(`FAIL ${name} ${width}${touch ? ' touch' : ''}: ${error.stack}`);
          await page.screenshot({ path: join(output, `${name}-${width}${touch ? '-touch' : ''}-failure.png`) }).catch(() => {});
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
