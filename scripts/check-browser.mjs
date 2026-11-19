import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, firefox, webkit } from 'playwright';
import { exerciseFields, exerciseOverlays, exerciseDisplay, exerciseExpandedAccessibility, exerciseFocusGuards, exerciseComboboxDismissal } from './browser-suites.mjs';
import { exerciseNativeDialogForm } from '../tests/browser/exercise-native-dialog-form.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '.site');
const engines = { chromium, firefox, webkit };
const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(engines);
assert(names.every(name => Object.hasOwn(engines, name)), 'Use chromium, firefox, or webkit.');
const output = join(root, 'output/browser');
const fixture = await mkdtemp(join(tmpdir(), 'hds-browser-'));
const results = [];
const browserVersions = {};
const accessibilityChecks = [];
const verifiedFocusGuardEngines = new Set();
const verifiedComboboxEngines = new Set();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const consumer = pathname.startsWith('/__consumer/');
    const directory = consumer ? fixture : site;
    const local = consumer ? pathname.slice('/__consumer/'.length) : pathname.slice(1);
    const path = resolve(directory, local || 'index.html');
    if (!path.startsWith(directory + sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'text/plain', 'Cache-Control': 'no-store' }).end(data);
  } catch { response.writeHead(404).end('Not found'); }
});

async function fingerprint() {
  const hash = createHash('sha256');
  for (const directory of ['dist', '.site/assets']) {
    for (const file of (await readdir(join(root, directory))).sort()) {
      hash.update(directory + '/' + file).update(await readFile(join(root, directory, file)));
    }
  }
  for (const file of ['.site/index.html', '.site/showcase.css', 'tests/browser/consumer.tsx', 'tests/browser/native-alternatives.tsx', 'tests/browser/native-dialog-form.tsx', 'tests/browser/focus-guard-isolation.tsx', 'tests/browser/exercise-native-dialog-form.mjs', 'scripts/check-browser.mjs', 'scripts/browser-suites.mjs']) hash.update(file).update(await readFile(join(root, file)));
  return hash.digest('hex');
}

async function prepareConsumer() {
  await build({ absWorkingDir: root, entryPoints: ['tests/browser/consumer.tsx'], outfile: join(fixture, 'consumer.js'), bundle: true, minify: true, platform: 'browser', format: 'esm', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' });
  await writeFile(join(fixture, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HDS consumer checks</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/dist/tokens.css"><link rel="stylesheet" href="/dist/components.css"><style>body{margin:16px;color:var(--ink);background:var(--paper);font-family:system-ui}main{max-width:600px}form{display:grid;gap:12px}.actions,.statuses{display:flex;flex-wrap:wrap;gap:12px}section{margin-top:20px}output[data-settings]{display:block;overflow-wrap:anywhere}fieldset{min-width:0}</style></head><body><div id="consumer"></div><div id="settings-A"></div><div id="settings-B"></div><script type="module" src="./consumer.js"></script></body></html>`);
  for (const name of ['native-alternatives', 'native-dialog-form', 'focus-guard-isolation']) {
    await build({ absWorkingDir: root, entryPoints: [`tests/browser/${name}.tsx`], outfile: join(fixture, `${name}.js`), bundle: true, minify: true, platform: 'browser', format: 'esm', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' });
    await writeFile(join(fixture, `${name}.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HDS ${name}</title><link rel="stylesheet" href="/dist/tokens.css"><link rel="stylesheet" href="/dist/components.css"><style>body{margin:16px;color:var(--ink);background:var(--paper);font-family:system-ui}main{max-width:600px}form{display:grid;gap:12px}</style></head><body><div id="consumer"></div><script type="module" src="./${name}.js"></script></body></html>`);
  }
}

async function a11y(page, selector = 'body') {
  await page.addScriptTag({ path: join(root, 'node_modules/axe-core/axe.min.js') });
  const report = await page.evaluate(async selector => {
    const result = await window.axe.run(document.querySelector(selector), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    const summarize = items => items.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary, checks: [...node.any, ...node.all, ...node.none].map(check => ({ id: check.id, data: check.data, message: check.message })) })) }));
    return { violations: summarize(result.violations), incomplete: summarize(result.incomplete) };
  }, selector);
  // Keep raw axe findings. ACT 6cfa84 explicitly permits a sentinel which redirects
  // focus. The same engine must first pass the independent live guard scenarios.
  const reviewedViolations = [];
  const unresolvedViolations = [];
  for (const item of report.violations) {
    for (const node of item.nodes) {
      const guard = item.id === 'aria-hidden-focus' && verifiedFocusGuardEngines.has(page.context().browser().browserType().name()) && await page.evaluate(target => {
        if (target.length !== 1 || typeof target[0] !== 'string') return false;
        const element = document.querySelector(target[0]);
        return element?.matches('span[data-base-ui-focus-guard][aria-hidden="true"]') && element.textContent === '' && element.children.length === 0;
      }, node.target);
      const temporaryComboboxBoundary = !guard && item.id === 'aria-hidden-focus' && verifiedComboboxEngines.has(page.context().browser().browserType().name()) && await page.evaluate(target => {
        if (target.length !== 1 || typeof target[0] !== 'string') return false;
        const element = document.querySelector(target[0]);
        const input = document.querySelector('.hds-field__comboInput[aria-expanded="true"]');
        return Boolean(element && input && window.__hdsA11yHiddenBeforeCombo && element.getAttribute('aria-hidden') === 'true' && !window.__hdsA11yHiddenBeforeCombo.has(element) && !element.contains(input));
      }, node.target);
      if (guard) reviewedViolations.push({ rule: item.id, target: node.target, kind: 'redirecting-focus-guard', evidence: 'focus-guard-navigation', pass: true });
      else if (temporaryComboboxBoundary) reviewedViolations.push({ rule: item.id, target: node.target, kind: 'temporary-combobox-boundary', evidence: 'combobox-dismissal', pass: true });
      else {
        // Base UI exposes empty role=button sentinels to VoiceOver on WebKit.
        // DOM focus redirection does not prove the virtual cursor behavior: keep
        // these violations unresolved while allowing the remaining cases to run.
        const voiceOverGuard = item.id === 'aria-command-name' && page.context().browser().browserType().name() === 'webkit' && verifiedFocusGuardEngines.has('webkit') && await page.evaluate(target => {
          if (target.length !== 1 || typeof target[0] !== 'string') return false;
          const element = document.querySelector(target[0]);
          return element?.matches('span[data-base-ui-focus-guard][role="button"]') && !element.hasAttribute('aria-hidden') && element.textContent === '' && element.children.length === 0;
        }, node.target);
        unresolvedViolations.push({ rule: item.id, ...node, ...(voiceOverGuard ? { manualReview: 'base-ui-webkit-voiceover-focus-guard' } : {}) });
      }
    }
  }
  const supplementalChecks = [];
  for (const item of report.incomplete) {
    for (const node of item.nodes) {
      const check = await page.evaluate(({ rule, target, checks, guardsVerified, comboVerified }) => {
        if (target.length !== 1 || typeof target[0] !== 'string') return null;
        const element = document.querySelector(target[0]);
        if (!element) return null;
        if (rule === 'aria-hidden-focus' && guardsVerified && element.matches('span[data-base-ui-focus-guard][aria-hidden="true"]') && element.textContent === '' && element.children.length === 0) {
          return { kind: 'redirecting-focus-guard', evidence: 'focus-guard-navigation', pass: true };
        }
        if (rule === 'aria-hidden-focus' && guardsVerified && checks.length === 1 && checks[0].id === 'focusable-modal-open') {
          const modal = document.querySelector('.hds-dialog__popup[data-open][role="dialog"], .hds-dialog__popup[data-open][role="alertdialog"]');
          if (modal?.closest('.hds-dialog__portal')?.querySelector('.hds-dialog__backdrop') && element.getAttribute('aria-hidden') === 'true' && !element.contains(modal)) return { kind: 'modal-focus-boundary', evidence: 'focus-guard-navigation', pass: true };
        }
        if (rule === 'aria-hidden-focus' && comboVerified && window.__hdsA11yHiddenBeforeCombo && element.getAttribute('aria-hidden') === 'true' && !window.__hdsA11yHiddenBeforeCombo.has(element)) {
          const input = document.querySelector('.hds-field__comboInput[aria-expanded="true"]');
          if (input && !element.contains(input)) return { kind: 'temporary-combobox-boundary', evidence: 'combobox-dismissal', pass: true };
        }
        if (rule === 'aria-valid-attr-value' && checks.length === 1 && checks[0].data?.messageKey === 'controlsWithinPopup') {
          const ids = element.getAttribute('aria-controls')?.trim().split(/\s+/) ?? [];
          const popupRole = element.getAttribute('aria-haspopup') === 'true' ? 'menu' : element.getAttribute('aria-haspopup');
          const targets = ids.map(id => document.getElementById(id));
          const pass = ids.length > 0 && ids.every((id, index) => [...document.querySelectorAll('[id]')].filter(node => node.id === id).length === 1 && targets[index]?.getAttribute('role') === popupRole && (element.getAttribute('aria-expanded') !== 'true' || targets[index].getClientRects().length > 0));
          return { kind: 'popup-control-reference', ids, popupRole, pass };
        }
        const iconButton = element.matches('.hds-field__iconButton, .hds-field__stepper, .hds-field__chipRemove, .hds-dialog__close, .hds-toast__close, .hds-pagination button');
        const icon = iconButton && element.querySelector('[aria-hidden="true"]');
        const namedIconButton = Boolean(icon && element.getAttribute('aria-label')?.trim() && element.textContent.trim() === icon.textContent.trim());
        if (rule === 'label-content-name-mismatch' && namedIconButton) {
          return { kind: 'icon-only-button', pass: true, accessibleName: element.getAttribute('aria-label') };
        }
        if (rule === 'label-content-name-mismatch' && element.matches('.specimen-footer a[href="#tokens"]')) {
          const icon = element.querySelector('[aria-hidden="true"]');
          return { kind: 'icon-only-link', pass: element.getAttribute('aria-label') === '토큰 탐색으로 이동' && icon?.textContent === '↗' && element.textContent === icon.textContent };
        }
        if (rule !== 'color-contrast') return null;
        const swatch = element.matches('.hds-swatch[aria-hidden="true"]');
        const navigation = element.matches('.catalog-sidebar nav a, .catalog-sidebar nav a > span:first-child');
        const fieldText = element.matches('.hds-field__label, .hds-field__chip, .hds-dialog__body > p, .hds-demoOverlays__controls > .hds-button, .import-note > a[href="./docs/components.md"]');
        const controlIcon = namedIconButton || element.matches('.hds-field__chevron[aria-hidden="true"], .hds-field__option [data-selected][aria-hidden="true"], .hds-field__iconButton > [aria-hidden="true"], .hds-field__stepper > [aria-hidden="true"], .hds-field__chipRemove > [aria-hidden="true"], .hds-dialog__close > [aria-hidden="true"], .hds-toast__close > [aria-hidden="true"], .hds-menu__check, .hds-menu__check *, .hds-pagination button > [aria-hidden="true"]');
        if (!swatch && !navigation && !controlIcon && !fieldText) return null;
        const rgb = value => {
          if (!/^rgba?\(/.test(value)) return null;
          const [r, g, b, alpha = 1] = value.match(/[\d.]+/g).map(Number);
          return { channels: [r, g, b], alpha };
        };
        const foreground = rgb(getComputedStyle(element).color);
        let background;
        for (let parent = element; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.backgroundImage !== 'none' || Number(style.opacity) !== 1) return null;
          const color = rgb(style.backgroundColor);
          if (!color || (color.alpha !== 0 && color.alpha !== 1)) return null;
          if (!background && color.alpha === 1) background = color;
        }
        if (!foreground || foreground.alpha !== 1 || !background) return null;
        const luminance = channels => channels.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const values = [luminance(foreground.channels), luminance(background.channels)].sort((a, b) => a - b);
        const ratio = (values[1] + 0.05) / (values[0] + 0.05);
        const minimum = swatch || controlIcon ? 3 : 4.5;
        return { kind: swatch ? 'selection-mark-contrast' : controlIcon ? 'control-icon-contrast' : fieldText ? 'field-text-contrast' : 'scrollable-navigation-contrast', foreground: foreground.channels, background: background.channels, ratio, minimum, pass: ratio >= minimum };
      }, { rule: item.id, target: node.target, checks: node.checks, guardsVerified: verifiedFocusGuardEngines.has(page.context().browser().browserType().name()), comboVerified: verifiedComboboxEngines.has(page.context().browser().browserType().name()) });
      supplementalChecks.push({ rule: item.id, target: node.target, ...check });
    }
  }
  const display = await page.evaluate(() => ({ width: innerWidth, theme: document.documentElement.dataset.theme, accent: document.documentElement.dataset.accent }));
  accessibilityChecks.push({ engine: page.context().browser().browserType().name(), path: new URL(page.url()).pathname, selector, display, ...report, reviewedViolations, unresolvedViolations, supplementalChecks });
}

async function runCase(browser, engine, name, options, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce', ...options });
  const page = await context.newPage();
  const firstAccessibilityCheck = accessibilityChecks.length;
  page.setDefaultTimeout(12_000);
  const errors = [];
  const observe = observed => {
    observed.on('pageerror', error => errors.push(error.message));
    observed.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    observed.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
  };
  context.on('page', observe);
  observe(page);
  try {
    const detail = await run(page, context);
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    const unresolved = accessibilityChecks.slice(firstAccessibilityCheck).flatMap(check => [
      ...check.unresolvedViolations.map(issue => ({ display: check.display, type: 'violation', ...issue })),
      ...check.supplementalChecks.filter(issue => issue.pass !== true).map(issue => ({ display: check.display, type: 'incomplete', ...issue })),
    ]);
    const manualReviewRequired = unresolved.filter(issue => issue.type === 'violation' && issue.manualReview === 'base-ui-webkit-voiceover-focus-guard');
    assert.deepEqual(unresolved.filter(issue => !manualReviewRequired.includes(issue)), [], 'Unresolved accessibility findings (raw findings retained in result JSON)');
    const pass = manualReviewRequired.length === 0;
    results.push({ engine, name, pass, functionalPass: true, detail, ...(pass ? {} : { manualReviewRequired }) });
    console.log(`${pass ? 'PASS' : 'REVIEW'} ${engine}: ${name}${pass ? '' : ` (${manualReviewRequired.length} unresolved VoiceOver focus-guard findings)`}`);
    if (!pass) process.exitCode = 1;
  } catch (error) {
    const focus = await page.evaluate(() => ({ active: document.activeElement?.outerHTML.slice(0, 2000), tooltips: [...document.querySelectorAll('[role="tooltip"], .hds-tooltip__popup')].map(element => element.outerHTML) })).catch(() => null);
    await page.screenshot({ path: join(output, `${engine}-${name}-failure.png`), fullPage: false }).catch(() => {});
    results.push({ engine, name, pass: false, error: error.message, runtimeErrors: errors });
    throw new Error(`${engine}: ${name}: ${error.stack}\nFocus diagnostic: ${JSON.stringify(focus)}`, { cause: error });
  } finally { await context.close(); }
}

async function exerciseFocusGuardIsolation(page, base, engine) {
  // Base UI exposes role=button only on WebKit with VoiceOver available.
  // Linux WebKit keeps the guards aria-hidden, so exercise the naming adapter
  // with a fixture-only role transition after recording the native state.
  async function exposeGuardsForIsolation(locator) {
    const native = await locator.evaluateAll(elements => elements.map(element => ({ role: element.getAttribute('role'), hidden: element.getAttribute('aria-hidden') })));
    const voiceOverMode = native.every(element => element.role === 'button' && element.hidden === null);
    const hiddenMode = native.every(element => element.role === null && element.hidden === 'true');
    assert(voiceOverMode || hiddenMode, `Unexpected Base UI guard state: ${JSON.stringify(native)}`);
    if (engine !== 'webkit') assert(hiddenMode, `${engine} must retain Base UI's aria-hidden guards`);
    if (hiddenMode) await locator.evaluateAll(elements => elements.forEach(element => {
      element.removeAttribute('aria-hidden');
      element.setAttribute('role', 'button');
    }));
    return voiceOverMode;
  }

  await page.goto(base + '__consumer/focus-guard-isolation.html');
  const raw = page.getByRole('combobox', { name: 'Unrelated team', exact: true });
  await raw.click();
  const guards = page.locator('[data-base-ui-focus-guard]');
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length === 4);
  await exposeGuardsForIsolation(guards);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  assert.deepEqual(await guards.evaluateAll(elements => elements.map(element => element.getAttribute('aria-label'))), [null, null, null, null], 'Unrelated Base UI guards remain untouched');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length === 0);

  const hds = page.getByRole('combobox', { name: 'HDS team', exact: true });
  await hds.click();
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length === 4);
  const nativeVoiceOverMode = await exposeGuardsForIsolation(guards);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-base-ui-focus-guard]')].every(element => element.getAttribute('aria-label') === 'Popup focus navigation'));
  assert.deepEqual(await guards.evaluateAll(elements => elements.map(element => ({ role: element.getAttribute('role'), hidden: element.getAttribute('aria-hidden') }))), Array(4).fill({ role: 'button', hidden: null }), 'Naming keeps exposed Base UI focus semantics');
  await page.evaluate(() => { document.documentElement.lang = 'ko'; });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-base-ui-focus-guard]')].every(element => element.getAttribute('aria-label') === '팝업 초점 이동'));
  await guards.first().evaluate(element => element.setAttribute('aria-label', 'Caller label'));
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-base-ui-focus-guard]')].slice(1).every(element => element.getAttribute('aria-label') === 'Popup focus navigation'));
  assert.equal(await guards.first().getAttribute('aria-label'), 'Caller label', 'Caller-provided label is preserved');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length === 0);
  await page.locator('#raw-menu').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length >= 4);
  await exposeGuardsForIsolation(guards);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  assert((await page.locator('[data-base-ui-focus-guard]').evaluateAll(elements => elements.every(element => !element.hasAttribute('aria-label')))), 'Raw outside guards next to a closed HDS trigger stay unnamed');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('[data-base-ui-focus-guard]').length === 0);
  await page.getByRole('button', { name: 'Show adjacent menus', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.raw-menu-popup') && document.querySelector('.hds-menu__popup'));
  await exposeGuardsForIsolation(guards);
  await page.waitForFunction(() => [...document.querySelectorAll('.hds-menu__positioner [data-base-ui-focus-guard]')].every(element => element.getAttribute('aria-label') === 'Popup focus navigation'));
  {
    const menuGuards = await page.locator('[data-base-ui-focus-guard]').evaluateAll(elements => elements.map(guard => {
      const parent = guard.parentElement;
      const directlyNextTo = id => guard.previousElementSibling?.id === id || guard.nextElementSibling?.id === id;
      const spacer = [guard.previousElementSibling, guard.nextElementSibling].find(sibling => sibling?.matches('span[aria-owns]'));
      const owns = spacer && document.getElementById(spacer.getAttribute('aria-owns') || '');
      const owner = parent?.matches('.hds-menu__positioner') || directlyNextTo('hds-menu') || owns?.matches('[data-hds-focus-portal]') ? 'hds'
        : parent?.matches('.raw-menu-positioner') || directlyNextTo('raw-menu') || owns?.matches('[data-base-ui-portal]') ? 'raw' : 'unknown';
      return { owner, label: guard.getAttribute('aria-label') };
    }));
    assert(menuGuards.some(guard => guard.owner === 'hds'), 'HDS menu guards rendered');
    assert(menuGuards.some(guard => guard.owner === 'raw'), 'Adjacent raw Base UI menu guards rendered');
    assert.deepEqual(menuGuards.filter(guard => guard.owner === 'raw').map(guard => guard.label), menuGuards.filter(guard => guard.owner === 'raw').map(() => null), 'Adjacent raw menu guards remain untouched');
    assert(menuGuards.filter(guard => guard.owner === 'hds').every(guard => guard.label === 'Popup focus navigation'), 'Adjacent HDS menu guards are named');
    assert.equal(menuGuards.filter(guard => guard.owner === 'unknown').length, 0, 'Every adjacent guard has a known owner');
  }
  return { unrelatedGuardsUntouched: true, adjacentMenusIsolated: true, namingAdapterExercised: true, nativeVoiceOverMode, languageSwitch: true };
}

async function exerciseNativeAlternatives(page, base) {
  const waitForFocus = async locator => page.waitForFunction(element => element === document.activeElement, await locator.elementHandle());
  await page.goto(base + '__consumer/native-alternatives.html');
  const team = page.getByRole('combobox', { name: 'Team', exact: true });
  await team.waitFor();
  await a11y(page);
  assert.equal(await team.inputValue(), '');
  await team.selectOption('operations');
  assert.equal(await page.locator('#native-form').evaluate(form => new FormData(form).get('team')), 'operations');
  const controlledTeam = page.getByRole('combobox', { name: 'Controlled team' });
  await controlledTeam.selectOption('operations');
  assert.equal(await controlledTeam.inputValue(), 'operations');
  const synchronousReset = await controlledTeam.evaluate(select => {
    select.form.reset();
    return { value: select.value, submitted: new FormData(select.form).get('controlledTeam') };
  });
  assert.deepEqual(synchronousReset, { value: 'operations', submitted: 'operations' }, 'Controlled select stays consistent through synchronous form reset');
  await page.getByRole('button', { name: 'Reset fields' }).click();
  assert.equal(await team.inputValue(), '');
  await page.waitForFunction(() => document.querySelector('select[name="controlledTeam"]')?.value === 'operations');
  assert.equal(await controlledTeam.inputValue(), 'operations', 'Reset preserves caller-controlled native value');
  assert.equal(await page.locator('#native-form').evaluate(form => new FormData(form).get('controlledTeam')), 'operations');
  await team.focus();
  const fullKeyboardTab = page.context().browser().browserType().name() === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(fullKeyboardTab);
  assert.equal(await controlledTeam.evaluate(element => element === document.activeElement), true);
  await page.keyboard.press(fullKeyboardTab);
  assert.equal(await page.getByRole('button', { name: 'Reset fields' }).evaluate(element => element === document.activeElement), true);
  await page.keyboard.press(fullKeyboardTab === 'Alt+Tab' ? 'Shift+Alt+Tab' : 'Shift+Tab');
  assert.equal(await controlledTeam.evaluate(element => element === document.activeElement), true);
  await page.keyboard.press(fullKeyboardTab === 'Alt+Tab' ? 'Shift+Alt+Tab' : 'Shift+Tab');
  assert.equal(await team.evaluate(element => element === document.activeElement), true);
  const trigger = page.getByRole('button', { name: 'Open native dialog' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Native settings' });
  await dialog.waitFor();
  const snapshot = await dialog.ariaSnapshot();
  assert.match(snapshot, /dialog "Native settings"/);
  assert.match(snapshot, /combobox "Visibility"/);
  assert.equal(await page.locator('[data-base-ui-focus-guard]').count(), 0, 'Native path has no Base UI focus guards');
  await a11y(page);
  const visibility = dialog.getByRole('combobox', { name: 'Visibility' });
  assert.equal(await visibility.inputValue(), 'private');
  await visibility.selectOption('public');
  assert.equal(await visibility.inputValue(), 'public');
  const standard = dialog.getByRole('radio', { name: 'Standard' });
  const advanced = dialog.getByRole('radio', { name: 'Advanced' });
  await standard.focus();
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelector('dialog[open]')?.contains(document.activeElement));
  assert.equal(await advanced.evaluate(element => element === document.activeElement), false, 'Tab skips the unchecked radio in a group');
  const notes = dialog.getByRole('textbox', { name: 'Notes' });
  await notes.focus();
  await page.keyboard.type('!');
  assert.match(await notes.innerText(), /!/);
  const insideAction = dialog.getByRole('button', { name: 'Inside action' });
  await page.keyboard.press(fullKeyboardTab);
  await waitForFocus(insideAction);
  assert.equal(await insideAction.evaluate(element => element === document.activeElement), true, 'Tab leaves contenteditable for the next action');
  await notes.focus();
  await page.keyboard.press(fullKeyboardTab === 'Alt+Tab' ? 'Shift+Alt+Tab' : 'Shift+Tab');
  await waitForFocus(standard);
  assert.equal(await standard.evaluate(element => element === document.activeElement), true, 'Shift+Tab leaves contenteditable for the checked radio');
  await insideAction.focus();
  await insideAction.evaluate(element => element.addEventListener('keydown', event => {
    if (event.key === 'Tab') event.preventDefault();
  }, { once: true }));
  await page.keyboard.press('Tab');
  assert.equal(await insideAction.evaluate(element => element === document.activeElement), true, 'A canceled Tab stays on its current action');
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let index = 0; index < 10; index++) {
      const previousFocus = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 180));
      await page.keyboard.press(key);
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, `${key} step ${index} from ${previousFocus} to ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 180))} must keep focus in the modal before the next paint`);
      await page.waitForFunction(() => document.querySelector('dialog[open]')?.contains(document.activeElement));
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, `${key} step ${index}: ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 200))}`);
    }
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await waitForFocus(trigger);
  await trigger.click();
  await dialog.getByRole('button', { name: 'Close native dialog' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await waitForFocus(trigger);
  await trigger.click();
  const box = await dialog.boundingBox();
  assert(box);
  await page.mouse.click(Math.max(0, box.x - 10), Math.max(0, box.y - 10));
  await dialog.waitFor({ state: 'hidden' });
  await waitForFocus(trigger);
  const controlled = page.getByRole('button', { name: 'Open controlled dialog' });
  await controlled.click();
  const controlledDialog = page.getByRole('dialog', { name: 'Controlled settings' });
  await controlledDialog.waitFor();
  await page.keyboard.press('Escape');
  await controlledDialog.waitFor({ state: 'hidden' });
  await waitForFocus(controlled);
  return { nativeDialogAX: snapshot, modalKeyboardSteps: 20, radioGroupTab: true, contentEditable: true, dismissals: ['Escape', 'close', 'outside', 'controlled-Escape'], resetAndFormData: true, focusRestored: true };
}

async function exerciseShowcase(page, base, engine) {
  await page.goto(base);
  const formExample = page.locator('#component-textfield');
  const input = formExample.getByRole('textbox', { name: '프로젝트 이름', exact: true });
  await input.waitFor();
  await page.waitForFunction(() => !document.querySelector('.demo-fields').disabled);
  // macOS WebKit uses Option-Tab for links unless full keyboard navigation is enabled.
  await page.keyboard.press(engine === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  assert.equal(await page.getByRole('link', { name: '본문으로 건너뛰기' }).evaluate(element => element === document.activeElement), true, 'Skip link is first keyboard stop');
  await page.keyboard.press('Enter');
  assert(new URL(page.url()).hash === '#main');
  const button = page.locator('#component-button').getByRole('button', { name: '변경 사항 저장' });
  await button.focus();
  assert.notEqual(await button.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
  await page.keyboard.press('Enter');
  await page.locator('#component-button .demo-status').filter({ hasText: '1번 동작' }).waitFor();
  await page.getByRole('checkbox', { name: '로딩 상태', exact: true }).check();
  assert.equal(await page.getByRole('button', { name: '저장 중…', exact: true }).isDisabled(), true);
  await page.getByRole('checkbox', { name: '로딩 상태', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: '비활성 상태', exact: true }).check();
  assert.equal(await button.isDisabled(), true);
  await page.getByRole('checkbox', { name: '비활성 상태', exact: true }).uncheck();
  await formExample.getByRole('button', { name: '프로젝트 확인' }).click();
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  assert.equal(await input.evaluate(element => element === document.activeElement), true);
  await input.fill('Browser check');
  const shared = formExample.getByRole('checkbox', { name: '팀과 공유하기', exact: true });
  await shared.focus();
  await page.keyboard.press('Space');
  assert.equal(await shared.isChecked(), true);
  await formExample.getByRole('button', { name: '프로젝트 확인' }).click();
  assert.match(await page.locator('#component-textfield .demo-status').innerText(), /팀 공유/);
  assert.notEqual(await input.getAttribute('aria-invalid'), 'true');
  const workbench = page.getByRole('group', { name: '디자인 시스템 컴포넌트 작업대', exact: true });
  const specimenInput = workbench.getByRole('textbox', { name: '프로젝트 이름', exact: true });
  const specimenConfirm = workbench.getByRole('button', { name: '상태 확인', exact: true });
  await specimenInput.fill('Browser specimen');
  await specimenConfirm.click();
  assert.match(await workbench.getByRole('status').innerText(), /Browser specimen/);
  assert.equal(await input.inputValue(), 'Browser check', 'Workbench does not change the form example');
  await specimenInput.fill('');
  assert.equal(await specimenConfirm.isDisabled(), true, 'Workbench rejects an empty name');
  await specimenInput.fill('Browser specimen');
  assert.equal(await specimenConfirm.isDisabled(), false);
  const variant = page.locator('#component-button').getByRole('combobox', { name: '모양', exact: true });
  await variant.selectOption('secondary');
  assert.match(await page.locator('#component-button pre').innerText(), /variant="secondary"/);
  const tokenGroup = page.locator('#tokens').getByRole('combobox', { name: '종류', exact: true });
  await tokenGroup.selectOption('color');
  assert.equal(await page.locator('.token-identity > code').filter({ hasText: '--shadow-' }).count(), 0);
  await tokenGroup.selectOption('shadow');
  const shadows = await page.locator('.token-symbol').evaluateAll(items => items.map(item => getComputedStyle(item).boxShadow));
  assert.equal(shadows.length, 2);
  assert(shadows.every(shadow => shadow !== 'none'));
  await tokenGroup.selectOption('all');
  await page.getByRole('searchbox', { name: '토큰 검색' }).fill('forest');
  assert((await page.locator('.token-row').count()) > 0);
  await page.getByRole('searchbox', { name: '토큰 검색' }).fill('no-such-token-893');
  await page.locator('#tokens .empty-state').waitFor();
  await page.locator('#tokens').getByRole('button', { name: '검색 초기화', exact: true }).click();
  await page.getByRole('searchbox', { name: 'API 검색' }).fill('TextField');
  assert.equal(await page.locator('.api-entry').count(), 1);
  await page.locator('#api-TextField summary').focus();
  await page.keyboard.press('Enter');
  await page.locator('#api-TextField table').waitFor();
  await page.getByRole('searchbox', { name: 'API 검색' }).fill('');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedText = text; } } }));
  await page.getByRole('button', { name: 'Button 예제 복사', exact: true }).click();
  await page.waitForFunction(() => window.__copiedText?.includes('<Button'));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await page.getByRole('button', { name: 'Button 예제 복사', exact: true }).click();
  await page.locator('#component-button .copy-status').filter({ hasText: '직접 선택' }).waitFor();
}

async function exerciseConsumer(page, base) {
  await page.goto(base + '__consumer/index.html');
  await page.waitForFunction(() => document.body.dataset.consumerReady === 'true');
  const structure = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return { duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index), unlabelled: [...document.querySelectorAll('#native-form input')].filter(element => !element.labels?.length).map(element => element.id), missingDescriptions: [...document.querySelectorAll('[aria-describedby]')].flatMap(element => element.getAttribute('aria-describedby').split(/\s+/).filter(id => !document.getElementById(id))) };
  });
  assert.deepEqual(structure, { duplicateIds: [], unlabelled: [], missingDescriptions: [] });
  for (const label of ['Second project', 'Third project']) await page.getByRole('textbox', { name: label, exact: true }).waitFor();
  for (const label of ['Second checkbox', 'Third checkbox']) await page.getByRole('checkbox', { name: label, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Action', exact: true }).click();
  assert.equal(await page.locator('#actions').innerText(), '1');
  assert.equal(await page.locator('#submits').innerText(), '0');
  const project = page.getByRole('textbox', { name: 'Project', exact: true });
  await project.fill('edited');
  await page.getByRole('checkbox', { name: 'Editable checkbox', exact: true }).check();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  assert.equal(await page.locator('#submits').innerText(), '1');
  const readonly = page.getByRole('checkbox', { name: 'Readonly checkbox', exact: true });
  await readonly.click();
  assert.equal(await readonly.isChecked(), true);
  await readonly.focus();
  await page.keyboard.press('Space');
  assert.equal(await readonly.isChecked(), true);
  assert.equal(await page.locator('#readonly-changes').innerText(), '0');
  const fields = await page.locator('#native-form').evaluate(form => Object.fromEntries(new FormData(form)));
  assert.equal(fields.project, 'edited');
  assert.equal(fields.readonly, 'yes');
  assert.equal(fields.disabled, undefined);
  assert.equal(fields.fieldset, undefined);
  await page.getByRole('button', { name: 'Reset form', exact: true }).click();
  assert.equal(await project.inputValue(), 'initial');
  assert.equal(await page.getByRole('checkbox', { name: 'Editable checkbox', exact: true }).isChecked(), false);
  await page.getByRole('checkbox', { name: 'Set loading', exact: true }).check();
  assert.equal(await page.getByRole('button', { name: 'Saving changes', exact: true }).isDisabled(), true);
  await page.getByRole('checkbox', { name: 'Set loading', exact: true }).uncheck();
  assert.equal(await page.getByRole('button', { name: 'Save changes', exact: true }).getAttribute('aria-labelledby'), 'save-name');
}

let failure;
let digest;
try {
  await mkdir(output, { recursive: true });
  digest = await fingerprint();
  await prepareConsumer();
  await new Promise((ready, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', ready); });
  const base = `http://127.0.0.1:${server.address().port}/`;
  for (const name of names) {
    const browser = await engines[name].launch();
    browserVersions[name] = browser.version();
    try {
      await runCase(browser, name, 'showcase', {}, page => exerciseShowcase(page, base, name));
      await runCase(browser, name, 'native-consumer', {}, page => exerciseConsumer(page, base));
      await runCase(browser, name, 'native-alternatives', {}, page => exerciseNativeAlternatives(page, base));
      await runCase(browser, name, 'native-dialog-form', {}, page => exerciseNativeDialogForm(page, base));
      await runCase(browser, name, 'focus-guard-isolation', {}, page => exerciseFocusGuardIsolation(page, base, name));
      await runCase(browser, name, 'expanded-overlays', { viewport: { width: 390, height: 844 }, colorScheme: 'dark' }, page => exerciseOverlays(page, base));
      await runCase(browser, name, 'expanded-display', { viewport: { width: 390, height: 844 } }, page => exerciseDisplay(page, base));
      await runCase(browser, name, 'focus-guard-navigation', {}, async page => { const result = await exerciseFocusGuards(page, base); verifiedFocusGuardEngines.add(name); return result; });
      await runCase(browser, name, 'combobox-dismissal', {}, async page => { const result = await exerciseComboboxDismissal(page, base); verifiedComboboxEngines.add(name); return result; });
      await runCase(browser, name, 'expanded-accessibility', {}, page => exerciseExpandedAccessibility(page, base, a11y, (page, label) => page.screenshot({ path: join(output, `${name}-${label}.png`) })));
      await runCase(browser, name, 'expanded-fields', {}, page => exerciseFields(page, base));
      // Keep the unmodified fixture and every axe rule. Firefox can crash when
      // axe and Playwright role queries inspect this labelled button in one document.
      await runCase(browser, name, 'native-accessibility', {}, async page => {
        await page.goto(base + '__consumer/index.html');
        await page.waitForFunction(() => document.body.dataset.consumerReady === 'true');
        await a11y(page, 'main');
      });
      await runCase(browser, name, 'display-matrix', {}, async page => {
        await page.goto(base);
        await page.waitForFunction(() => !document.querySelector('.demo-fields').disabled);
        const conditions = [];
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const theme of ['light', 'dark']) {
            await page.locator(`input[type="radio"][name$="-theme"][value="${theme}"]`).check();
            for (const accent of ['코발트', '포레스트', '코랄']) {
              await page.locator(`.hds-accentButton[aria-label^="${accent} 강조 색상"]`).click();
              if (width === 390) {
                await page.locator('input[type="radio"][name$="-density"][value="compact"]').check();
                await page.locator('input[type="radio"][name$="-corners"][value="soft"]').check();
              }
              assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}/${theme}/${accent} overflow`);
              await a11y(page);
              conditions.push({ width, theme, accent });
            }
          }
        }
        const minHeights = await page.locator('.hds-button, .hds-textField__input, .hds-checkbox__label').evaluateAll(elements => elements.filter(element => element.getClientRects().length).map(element => element.getBoundingClientRect().height));
        assert(minHeights.every(height => height >= 28), 'Smallest desktop size survives compact mode (28px)');
        assert.equal(await page.locator('.hds-button').first().evaluate(element => getComputedStyle(element).transitionDuration), '0s');
        await page.setViewportSize({ width: 320, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '320px reflow');
        await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Text spacing reflow');
        await page.locator('#components').scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(output, `${name}-text-spacing.png`) });
        return conditions;
      });
      await runCase(browser, name, 'settings-sync', {}, async (page, context) => {
        await page.goto(base + '__consumer/index.html');
        const a = page.getByRole('region', { name: 'Settings A', exact: true });
        const b = page.getByRole('region', { name: 'Settings B', exact: true });
        await a.getByRole('radio', { name: 'Dark', exact: true }).check();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-settings="B"]').textContent).theme === 'dark');
        await b.getByRole('button', { name: /^Forest accent color/ }).click();
        await page.waitForFunction(() => { const a = JSON.parse(document.querySelector('[data-settings="A"]').textContent); return a.theme === 'dark' && a.accent === 'forest'; });
        const other = await context.newPage();
        await other.goto(base + '__consumer/index.html');
        await other.getByRole('region', { name: 'Settings A', exact: true }).getByRole('radio', { name: 'Rounded', exact: true }).check();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-settings="B"]').textContent).corners === 'soft');
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.accent === 'forest' && document.documentElement.dataset.corners === 'soft');
        await page.getByRole('region', { name: 'Settings A', exact: true }).getByRole('radio', { name: 'System', exact: true }).check();
        await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.motion === 'reduced');
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      });
      await runCase(browser, name, 'blocked-storage', {}, async (page, context) => {
        await context.addInitScript(() => {
          Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
          Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
        });
        await page.goto(base + '__consumer/index.html');
        await page.getByRole('region', { name: 'Settings A', exact: true }).getByRole('radio', { name: 'Dark', exact: true }).check();
        await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: sessionStorage })));
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-settings="B"]').textContent).theme === 'dark');
        await page.getByRole('region', { name: 'Settings B', exact: true }).getByRole('button', { name: /^Coral accent color/ }).click();
        await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.accent === 'coral');
      });
      await runCase(browser, name, 'no-javascript', { javaScriptEnabled: false, viewport: { width: 390, height: 844 }, colorScheme: 'dark' }, async page => {
        await page.goto(base);
        assert.equal(await page.getByRole('heading', { level: 1 }).isVisible(), true);
        assert.equal(await page.getByRole('button', { name: '프로젝트 확인' }).isDisabled(), true);
        await page.getByRole('link', { name: '컴포넌트 사용해 보기', exact: true }).click();
        assert.equal(new URL(page.url()).hash, '#components');
        await page.locator('#api-Button summary').click();
        assert.equal(await page.locator('#api-Button table').isVisible(), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      });
    } finally { await browser.close(); }
  }
} catch (error) {
  failure = error;
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(fixture, { recursive: true, force: true });
  const versionOf = async name => JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
  await writeFile(join(output, `result-${names.join('-')}.json`), JSON.stringify({
    generatedAt: new Date().toISOString(),
    packageVersion: JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version,
    artifactSha256: digest,
    environment: { node: process.version, platform: process.platform, arch: process.arch, playwright: await versionOf('playwright'), axe: await versionOf('axe-core'), browserVersions },
    browsers: names,
    passed: !failure && results.every(result => result.pass),
    results,
    accessibilityChecks,
  }, null, 2) + '\n');
}
