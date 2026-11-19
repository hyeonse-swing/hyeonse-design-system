import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'output/consumer-compat');
const npmEnv = { ...process.env, npm_config_userconfig: '/dev/null', npm_config_registry: 'https://registry.npmjs.org/' };
delete npmEnv.NODE_AUTH_TOKEN;
delete npmEnv.NPM_TOKEN;

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env: npmEnv, encoding: 'utf8', timeout: 120_000 });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  return result.stdout;
}

function serve(directory) {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(directory, pathname === '/' ? 'index.html' : '.' + pathname);
      if (!file.startsWith(directory + sep)) {
        response.writeHead(403).end();
        return;
      }
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'text/plain' }).end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
}

async function withServer(directory, visit) {
  const server = serve(directory);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    return await visit('http://127.0.0.1:' + server.address().port + '/');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const app = [
  "import React, { useEffect, useRef, useState } from 'react';",
  "import { Button } from '@hyeonse/design-system/primitives';",
  "import { NativeSelect } from '@hyeonse/design-system/fields';",
  "import { NativeDialog } from '@hyeonse/design-system/overlays';",
  "import { Card } from '@hyeonse/design-system/display';",
  "import { PreferencesProvider } from '@hyeonse/design-system/react';",
  "const h = React.createElement;",
  "export function App() {",
  "  const buttonRef = useRef(null);",
  "  const selectRef = useRef(null);",
  "  const [count, setCount] = useState(0);",
  "  const [team, setTeam] = useState(null);",
  "  useEffect(() => { window.__consumerReady = buttonRef.current instanceof HTMLButtonElement && selectRef.current instanceof HTMLSelectElement; }, []);",
  "  return h(PreferencesProvider, null, h(Card, { title: 'Packed consumer' },",
  "    h(Button, { id: 'action', ref: buttonRef, onClick: () => setCount(value => value + 1) }, 'Action'),",
  "    h('output', { id: 'count' }, count),",
  "    h(NativeSelect, { label: 'Team', ref: selectRef, options: [{ value: 'ops', label: 'Operations' }], value: team, onValueChange: setTeam }),",
  "    h(NativeDialog, { trigger: h('button', { type: 'button', id: 'open-dialog' }, 'Open dialog'), title: 'Settings' },",
  "      h('button', { type: 'button', id: 'inside' }, 'Inside'))));",
  "}",
].join('\n');

await mkdir(output, { recursive: true });
const fixture = await mkdtemp(join(tmpdir(), 'hds-compat-'));
const evidence = { node: process.version, package: null, react: [], cssOnly: null };
try {
  const [packed] = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', fixture], root));
  const archive = join(fixture, packed.filename);
  evidence.package = packed.version;

  for (const version of ['19.0.0', '19.3.0']) {
    const consumer = join(fixture, 'react-' + version);
    await mkdir(consumer);
    await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive, 'react@' + version, 'react-dom@' + version], consumer);
    for (const name of ['react', 'react-dom']) {
      const manifest = JSON.parse(await readFile(join(consumer, 'node_modules', name, 'package.json'), 'utf8'));
      assert.equal(manifest.version, version, name + ' installed version');
    }
    await writeFile(join(consumer, 'app.mjs'), app);
    await writeFile(join(consumer, 'client.mjs'), "import React from 'react'; import { hydrateRoot } from 'react-dom/client'; import { App } from './app.mjs'; hydrateRoot(document.getElementById('root'), React.createElement(App));");
    const html = run(process.execPath, ['--input-type=module', '-e', "import React from 'react'; import { renderToString } from 'react-dom/server'; import { App } from './app.mjs'; console.log(renderToString(React.createElement(App)));"], consumer);
    assert.match(html, /Packed consumer/);
    await writeFile(join(consumer, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/node_modules/@hyeonse/design-system/dist/tokens.css"><link rel="stylesheet" href="/node_modules/@hyeonse/design-system/dist/components.css"></head><body><div id="root">' + html + '</div><script type="module" src="/client.js"></script></body></html>');
    await build({ absWorkingDir: consumer, entryPoints: ['client.mjs'], outfile: join(consumer, 'client.js'), bundle: true, platform: 'browser', format: 'esm', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' });
    const result = { version, ssr: true, browsers: {} };
    await withServer(consumer, async url => {
      for (const [name, engine] of Object.entries({ chromium, webkit })) {
        const browser = await engine.launch();
        try {
          const page = await browser.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          await page.goto(url);
          await page.waitForFunction(() => window.__consumerReady === true);
          await page.locator('#action').click();
          assert.equal(await page.locator('#count').textContent(), '1');
          await page.getByRole('combobox', { name: 'Team' }).selectOption('ops');
          assert.equal(await page.getByRole('combobox', { name: 'Team' }).inputValue(), 'ops');
          await page.locator('#open-dialog').click();
          const dialog = page.getByRole('dialog', { name: 'Settings' });
          await dialog.waitFor();
          await dialog.getByRole('button', { name: 'Inside' }).focus();
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
          await page.waitForFunction(() => document.activeElement?.id === 'open-dialog');
          assert.deepEqual(errors, [], version + ' ' + name + ' browser errors');
          result.browsers[name] = { hydration: true, forwardedRefs: true, controlledSelect: true, modalEscapeAndFocus: true };
        } finally {
          await browser.close();
        }
      }
    });
    evidence.react.push(result);
    console.log('PASS React ' + version + ' packed SSR/hydration and controls in Chromium and WebKit');
  }

  const css = join(fixture, 'css-only');
  await mkdir(css);
  await writeFile(join(css, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--omit=peer', '--ignore-scripts', '--no-audit', '--no-fund', archive], css);
  assert.equal(existsSync(join(css, 'node_modules/react')), false, 'CSS-only install should have no React runtime');
  assert.equal(existsSync(join(css, 'node_modules/react-dom')), false, 'CSS-only install should have no React DOM runtime');
  await writeFile(join(css, 'entry.css'), "@import '@hyeonse/design-system/tokens.css';\n@import '@hyeonse/design-system/components.css';\n");
  await build({ absWorkingDir: css, entryPoints: ['entry.css'], outfile: join(css, 'consumer.css'), bundle: true, logLevel: 'silent' });
  const bundle = await readFile(join(css, 'consumer.css'), 'utf8');
  assert.match(bundle, /\.hds-button--primary/);
  assert.match(bundle, /--accent-solid: #204cfc/);
  await writeFile(join(css, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/consumer.css"></head><body><button class="hds-button hds-button--primary">Action</button></body></html>');
  await withServer(css, async url => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(url);
      const style = await page.locator('button').evaluate(element => ({
        token: getComputedStyle(document.documentElement).getPropertyValue('--accent-solid').trim(),
        background: getComputedStyle(element).backgroundColor,
        padding: getComputedStyle(element).paddingInlineStart,
      }));
      assert.deepEqual(style, { token: '#204cfc', background: 'rgb(32, 76, 252)', padding: '12px' });
      evidence.cssOnly = { noReactInstalled: true, browser: 'chromium', appliedStyles: style };
    } finally {
      await browser.close();
    }
  });
  console.log('PASS CSS-only package with omitted peers and browser styles');
  await writeFile(join(output, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
