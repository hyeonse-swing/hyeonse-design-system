import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { renderIndex, renderFullReference } from '../scripts/catalog-format.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../scripts/hds.mjs', import.meta.url));
const raw = readFileSync(new URL('../dist/catalog.json', import.meta.url), 'utf8');
const catalog = JSON.parse(raw);
const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--json'], { encoding: 'utf8', cwd: tmpdir() });
const success = (...args) => {
  const result = run(...args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const response = JSON.parse(result.stdout);
  assert.equal(response.schemaVersion, 1);
  assert.deepEqual(response.package, catalog.package);
  return response;
};

test('CLI finds actual APIs and preserves props/type context and token conditions', () => {
  const list = success('list').data;
  assert(list.some(entry => entry.id === 'PreferencesProvider'));
  assert(list.some(entry => entry.id === 'Button' && entry.command === 'hds show Button'));
  const detail = success('show', 'PreferencesProvider').data;
  assert.equal(detail.entry.importPath, '@hyeonse/design-system/react');
  assert(detail.entry.props.some(prop => prop.name === 'defaults' && prop.type.includes('Partial<Preferences>') && !prop.required));
  assert.match(detail.typeContext.declarations, /PreferenceContext/);
  const button = success('show', 'Button').data;
  assert.equal(button.entry.importPath, '@hyeonse/design-system/primitives');
  assert.deepEqual(button.entry.props.map(prop => prop.name), ['variant', 'size', 'loading', 'loadingLabel']);
  assert.match(button.typeContext.declarations, /ComponentPropsWithRef<'button'>/);
  assert(button.entry.usage.some(item => /attributes and ref are forwarded/.test(item)));
  const token = success('tokens', '--accent-text').data;
  assert.equal(token.value, '#204cfc');
  assert(token.overrides.some(value => value.selector.includes("data-accent='forest'") && value.selector.includes("data-theme='dark'")));
  assert(token.overrides.some(value => value.media?.includes('prefers-color-scheme: dark')));
  assert.deepEqual(success('tokens', 'accent-text').data, token);
  assert.equal(success('tokens', '--blue').data.value, 'var(--accent-text)');
  assert.equal(success('tokens', '--duration-fast').data.value, '140ms');
});

test('CLI gives discoverable Korean/English results, examples, and stable errors', () => {
  assert(success('search', 'theme').data.results.some(result => result.id === 'ThemeToggle'));
  assert(success('search', '테마').data.results.some(result => result.id === 'ThemeToggle'));
  assert.equal(success('search', '--accent-text').data.results[0].id, '--accent-text');
  assert(success('search', 'fieldset legends').data.results.some(result => result.id === 'PreferencesPanel'));
  assert(success('search', 'storage events').data.results.some(result => result.id === 'PreferencesProvider'));
  assert(success('search', 'storage writes may fail').data.results.some(result => result.id === 'PreferencesProvider'));
  assert(success('search', 'resetPreferences restores').data.results.some(result => result.id === 'usePreferences'));
  assert(success('search', 'prefers-color-scheme --ink').data.results.some(result => result.id === '--ink'));
  assert(success('search', "data-density='compact'").data.results.some(result => result.id === '--space-factor'));
  assert(success('search', '#68dfb1').data.results.some(result => result.id === '--accent-text'));
  assert(success('search', 'unpacked package').data.results.some(result => result.id === 'token-card'));
  assert.equal(success('search', 'no-such-hds-entry').data.total, 0);
  const example = success('example', 'display-settings').data;
  assert(example.files.some(file => file.code.includes('defaults={siteDefaults}')));
  assert(example.files.some(file => file.code.includes('createPreferenceScript(storageKey, siteDefaults)')));
  const form = success('example', 'form-controls').data;
  assert(form.files.some(file => file.code.includes("@hyeonse/design-system/primitives")));
  for (const [args, code] of [
    [['show', 'FictionalButton'], 'UNKNOWN_ENTRY'],
    [['tokens', '--unknown-token'], 'UNKNOWN_TOKEN'],
    [['example', '../../package.json'], 'UNKNOWN_EXAMPLE'],
    [['show'], 'INVALID_ARGUMENT'],
    [['list', 'extra'], 'INVALID_ARGUMENT'],
    [['search', ''], 'INVALID_ARGUMENT'],
    [['list', '--write'], 'INVALID_ARGUMENT'],
    [['init'], 'UNKNOWN_COMMAND'],
  ]) {
    const response = run(...args);
    assert.notEqual(response.status, 0);
    assert.equal(JSON.parse(response.stdout).error.code, code);
  }
  const manifest = success('manifest').data;
  assert.equal(manifest.readOnly, true);
  assert.equal(manifest.catalogSha256, createHash('sha256').update(raw).digest('hex'));
});

test('generated human reference stays synchronized and reading examples never scaffolds files', () => {
  assert.equal(readFileSync(join(root, 'llms.txt'), 'utf8'), renderIndex(catalog));
  assert.equal(readFileSync(join(root, 'llms-full.txt'), 'utf8'), renderFullReference(catalog));
  const directory = mkdtempSync(join(tmpdir(), 'hds-read-only-'));
  try {
    const result = spawnSync(process.execPath, [cli, 'example', 'token-card'], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /var\(--accent-text\)/);
    assert.deepEqual(readdirSync(directory), []);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
