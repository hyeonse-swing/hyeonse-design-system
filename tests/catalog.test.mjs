import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as preferenceRuntime from '../dist/preferences.js';
import * as reactRuntime from '../dist/react.js';
import * as primitiveRuntime from '../dist/primitives.js';
import { buildCatalog, parseTokenCss } from '../scripts/build-catalog.mjs';
import catalogMetadata from '../metadata/catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = buildCatalog(root);
const runtimeModules = new Map(await Promise.all(catalog.modules.map(async module => [
  module.subpath, await import(new URL(`../dist/${module.subpath.slice(2)}.js`, import.meta.url)),
])));
const byId = id => catalog.entries.find(entry => entry.id === id);
const byToken = name => catalog.tokens.find(token => token.name === name);

function assertSchemaShape(value, schema, document, location = '$') {
  if (schema.$ref) {
    const target = schema.$ref.split('/').slice(1).reduce((node, key) => node[key], document);
    assert.ok(target, `${location}: unresolved ${schema.$ref}`);
    return assertSchemaShape(value, target, document, location);
  }
  if (Object.hasOwn(schema, 'const')) assert.deepEqual(value, schema.const, location);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${location}: invalid enum`);
  if (schema.type) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    assert.ok(expected.includes(actual), `${location}: expected ${expected.join('|')}, got ${actual}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined) assert.ok(value.length >= schema.minLength, `${location}: short string`);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern), location);
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) assertSchemaShape(value[index], schema.items, document, `${location}[${index}]`);
  } else if (value && typeof value === 'object') {
    for (const key of schema.required ?? []) assert.ok(Object.hasOwn(value, key), `${location}: missing ${key}`);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(schema.properties, key), `${location}: extra ${key}`);
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) assertSchemaShape(value[key], child, document, `${location}.${key}`);
    }
  }
}

test('catalog is JSON-safe and conforms to its published schema', () => {
  const schema = JSON.parse(readFileSync(resolve(root, 'schemas/catalog.schema.json'), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assertSchemaShape(catalog, schema, schema);
  assert.deepEqual(JSON.parse(JSON.stringify(catalog)), catalog);
  assert.deepEqual(buildCatalog(root), catalog);
  assert.equal(catalog.package.name, '@hyeonse/design-system');
  assert.equal(catalog.package.version, JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version);
});

test('every shipped runtime export has an authored entry and declarations include supporting types', () => {
  const runtime = runtimeModules;
  assert.deepEqual([...runtime.keys()], ['./preferences', './react', './primitives', './fields', './overlays', './display', './layout']);
  assert.deepEqual(catalog.modules.map(module => module.subpath), [...runtime.keys()]);
  for (const module of catalog.modules) {
    const shipped = runtime.get(module.subpath);
    assert.deepEqual(module.exports.filter(item => item.kind === 'value').map(item => item.name).sort(), Object.keys(shipped).sort());
    assert.equal(module.declarations, readFileSync(resolve(root, `dist/${module.subpath.slice(2)}.d.ts`), 'utf8'));
    for (const name of Object.keys(shipped)) {
      const entry = byId(name);
      assert.ok(entry, `missing entry ${name}`);
      assert.equal(entry.importPath, `@hyeonse/design-system/${module.subpath.slice(2)}`);
      assert.equal(entry.signature, module.exports.find(item => item.name === name).signature);
    }
  }
  assert.match(catalog.modules.find(module => module.subpath === './react').declarations, /type PreferenceContext =/);
  assert.ok(catalog.modules.find(module => module.subpath === './preferences').exports.some(item => item.name === 'Preferences' && item.kind === 'type'));
  assert.ok(catalog.modules.find(module => module.subpath === './primitives').exports.some(item => item.name === 'ButtonProps' && item.kind === 'type'));
  assert.deepEqual(catalog.entries.map(entry => entry.id).sort(), [...runtime.values()].flatMap(module => Object.keys(module)).sort());
});

test('current archive API table lists every shipped component export', () => {
  const rows = readFileSync(resolve(root, 'docs/api.md'), 'utf8').split('\n');
  for (const name of ['layout', 'fields', 'overlays', 'display']) {
    const importPath = `@hyeonse/design-system/${name}`;
    const row = rows.find(line => line.startsWith(`| \`${importPath}\` |`));
    assert.ok(row, `missing public API row for ${importPath}`);
    const listed = [...row.matchAll(/`([^`]+)`/g)].map(match => match[1]).slice(1).sort();
    assert.deepEqual(listed, Object.keys(runtimeModules.get(`./${name}`)).sort(), `${importPath} table does not match its runtime exports`);
  }
});

test('React props come from declarations and utility defaults match runtime', () => {
  assert.deepEqual(byId('PreferencesProvider').props, [
    { name: 'children', type: 'ReactNode', required: true },
    { name: 'storageKey', type: 'string', required: false },
    { name: 'eventName', type: 'string', required: false },
    { name: 'defaults', type: 'Partial<Preferences>', required: false },
  ]);
  for (const id of ['ThemeToggle', 'PreferencesPanel']) {
    assert.deepEqual(byId(id).props, [{ name: 'locale', type: 'Locale', required: false }]);
  }
  assert.equal(byId('usePreferences').props, undefined);
  assert.equal(preferenceRuntime.preferencesKey, 'hyeonse-site-preferences');
  assert.deepEqual(preferenceRuntime.defaultPreferences, {
    theme: 'system', accent: 'cobalt', density: 'comfortable', corners: 'crisp', motion: 'full',
  });
  assert.match(byId('defaultPreferences').summary, /system.*cobalt.*comfortable.*crisp.*full/);
  assert.match(byId('PreferencesProvider').states.join(' '), /storage events/);
  assert.match(byId('effectiveMotion').accessibility.join(' '), /reduced motion/);
  assert.deepEqual(byId('Button').props.map(prop => prop.name), ['variant', 'size', 'loading', 'loadingLabel']);
  assert.deepEqual(byId('TextField').props.map(prop => [prop.name, prop.required]), [['size', false], ['inputSize', false], ['label', true], ['type', false], ['hint', false], ['error', false]]);
  assert.deepEqual(byId('Checkbox').props.map(prop => [prop.name, prop.required]), [['size', false], ['inputSize', false], ['label', true], ['hint', false], ['error', false]]);
  assert.deepEqual(byId('Badge').props.map(prop => prop.name), ['size', 'tone']);
  for (const id of ['Button', 'TextField', 'Checkbox', 'Badge']) {
    assert.equal(byId(id).importPath, '@hyeonse/design-system/primitives');
    assert.match(byId(id).usage.join(' '), /attributes.*ref are forwarded/);
    assert(!byId(id).props.some(prop => ['onClick', 'ref', 'className'].includes(prop.name)), `${id} should summarize local props only`);
  }
  assert.match(byId('Button').props.find(prop => prop.name === 'variant').type, /primary.*secondary.*ghost/);
  assert.match(byId('TextField').signature, /TextFieldProps/);
  assert.match(catalog.modules.find(module => module.subpath === './primitives').declarations, /ComponentPropsWithRef<'input'>/);
});

test('component summaries preserve portable public type references', () => {
  assert.equal(byId('Dialog').props.find(prop => prop.name === 'trigger').type, 'ReactElement');
  assert.equal(byId('Tabs').props.find(prop => prop.name === 'className').type, 'string');
  for (const module of catalog.modules) assert(!module.declarations.includes(root), module.importPath);
  assert(!JSON.stringify(catalog).includes(root), 'Catalog must not expose the checkout directory');
  assert(!JSON.stringify(catalog).includes('/node_modules/'), 'Types use public module references');
});

test('all base CSS custom properties have roles and conditional values retain selectors and media', () => {
  const css = readFileSync(resolve(root, 'src/tokens.css'), 'utf8');
  const parsed = parseTokenCss(css);
  assert.deepEqual(catalog.tokens.map(token => ({ name: token.name, value: token.value, overrides: token.overrides })), parsed);
  assert.deepEqual(catalog.tokens.map(token => token.name).sort(), Object.keys(catalogMetadata.tokenRoles).sort());
  assert.equal(byToken('--blue').value, 'var(--accent-text)');
  assert.equal(byToken('--gutter').value, 'clamp(22px, 4.1vw, 72px)');
  assert.deepEqual(byToken('--gutter').overrides, [{ selector: ':root', media: '(max-width: 700px)', value: '22px' }]);
  assert.ok(byToken('--ink').overrides.some(override => override.selector === ":root[data-theme='dark']" && override.media === null && override.value === '#f2f4f8'));
  assert.ok(byToken('--ink').overrides.some(override => override.selector === ':root:not([data-theme])' && override.media === '(prefers-color-scheme: dark)' && override.value === '#f2f4f8'));
  assert.ok(byToken('--accent-text').overrides.some(override => override.selector === ":root[data-theme='dark'][data-accent='forest']" && override.value === '#68dfb1'));
  assert.ok(byToken('--accent-text').overrides.some(override => override.selector === ":root:not([data-theme])[data-accent='forest']" && override.media === '(prefers-color-scheme: dark)' && override.value === '#68dfb1'));
  assert.deepEqual(byToken('--space-factor').overrides, [{ selector: ":root[data-density='compact']", media: null, value: '.8' }]);
  assert.deepEqual(byToken('--radius-card').overrides, [{ selector: ":root[data-corners='soft']", media: null, value: '20px' }]);
  assert.equal(byToken('--duration-fast').value, '140ms');
  assert.equal(byToken('--leading-body').value, '1.6');
  assert.equal(byToken('--focus-ring').value, 'var(--accent-text)');
  assert.ok(byToken('--success-surface').overrides.some(override => override.selector === ":root[data-theme='dark']" && override.media === null && override.value === '#142b23'));
  assert.ok(byToken('--success-surface').overrides.some(override => override.selector === ':root:not([data-theme])' && override.media === '(prefers-color-scheme: dark)' && override.value === '#142b23'));
  for (const [index, pixels] of [4, 8, 12, 16, 24, 32, 48, 64].entries()) {
    assert.match(byToken(`--space-${index + 1}`).value, new RegExp(`${pixels}px`));
  }
  assert.ok(byToken('--focus-ring').role.includes('focus'));
  assert.ok(byToken('--danger-text').role.includes('error'));
});

test('catalog rejects stale or missing authored API and token descriptions', () => {
  const withoutEntry = structuredClone(catalogMetadata);
  delete withoutEntry.entries.ThemeToggle;
  assert.throws(() => buildCatalog(root, withoutEntry), /runtime entries metadata mismatch.*ThemeToggle/);
  const staleEntry = structuredClone(catalogMetadata);
  staleEntry.entries.FictionalButton = staleEntry.entries.ThemeToggle;
  assert.throws(() => buildCatalog(root, staleEntry), /runtime entries metadata mismatch.*FictionalButton/);
  const withoutRole = structuredClone(catalogMetadata);
  delete withoutRole.tokenRoles['--ink'];
  assert.throws(() => buildCatalog(root, withoutRole), /token roles metadata mismatch.*--ink/);
  const staleRole = structuredClone(catalogMetadata);
  staleRole.tokenRoles['--fictional'] = 'Fictional';
  assert.throws(() => buildCatalog(root, staleRole), /token roles metadata mismatch.*--fictional/);
  assert.throws(() => parseTokenCss(':root { --ink: #000; } @supports (display: grid) { :root { --ink: #fff; } }'), /unhandled CSS at-rule/);
  assert.throws(() => parseTokenCss(":root { --ink: #000; } :root[data-theme='dark'] { --new: #fff; }"), /no base :root value/);
});

test('examples are embedded from files, with stable IDs and public imports', () => {
  assert.deepEqual(catalog.examples.map(example => example.id), ['layout-sizing', 'display-settings', 'token-card', 'form-controls', 'expanded-forms', 'overlay-patterns', 'display-patterns']);
  for (const example of catalog.examples) {
    for (const file of example.files) assert.equal(file.code, readFileSync(resolve(root, file.path), 'utf8'));
  }
  const display = catalog.examples.find(example => example.id === 'display-settings');
  assert.match(display.files.map(file => file.code).join('\n'), /@hyeonse\/design-system\/react/);
  assert.match(display.files.map(file => file.code).join('\n'), /@hyeonse\/design-system\/preferences/);
  const form = catalog.examples.find(example => example.id === 'form-controls');
  assert.match(form.files.map(file => file.code).join('\n'), /@hyeonse\/design-system\/primitives/);
  const tokenCard = catalog.examples.find(example => example.id === 'token-card');
  assert.match(tokenCard.description, /unpacked package/);
  assert.match(tokenCard.files.find(file => file.path.endsWith('.html')).code, /preview only.*public package path/);
  assert.ok(catalog.setup.some(step => step.includes('tokens.css') && step.includes('components.css')));
  assert.ok(catalog.boundaries.notProvided.some(item => /Font files/.test(item)));
});
