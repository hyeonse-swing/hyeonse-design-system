import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('..', import.meta.url));
const execute = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 60_000 });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  return result.stdout;
};

test('packed package exposes its own CLI/catalog/docs and usable React examples without build tools', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hds-consumer-'));
  try {
    const [packed] = JSON.parse(execute('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], root));
    const files = new Set(packed.files.map(file => file.path));
    for (const path of ['dist/catalog.json', 'dist/primitives.js', 'dist/primitives.d.ts', 'dist/components.css', 'schemas/catalog.schema.json', 'scripts/hds.mjs', 'scripts/catalog-format.mjs', 'llms.txt', 'llms-full.txt', 'docs/ai.md', 'docs/api.md', 'skills/hyeonse-design-system/SKILL.md', 'examples/display-settings.tsx', 'examples/form-controls.tsx', 'examples/expanded-forms.tsx', 'examples/overlay-patterns.tsx', 'examples/display-patterns.tsx']) assert(files.has(path), path);
    for (const module of ['fields', 'overlays', 'display', 'layout', 'sizing']) {
      for (const extension of ['js', 'd.ts']) assert(files.has(`dist/${module}.${extension}`), `${module}.${extension}`);
    }
    assert(![...files].some(path => /\.(woff2?|ttf|otf)$/.test(path)), 'fonts remain consumer-owned assets');
    assert(!files.has('metadata/catalog.mjs'), 'runtime does not depend on authoring tools');
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'hds-consumer-check', private: true, type: 'module' }));
    execute('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(directory, packed.filename)], directory);
    const installedRoot = join(directory, 'node_modules/@hyeonse/design-system');
    const installedPackage = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'));
    assert.equal(installedPackage.version, packed.version);
    assert.equal(installedPackage.dependencies['@base-ui/react'], '1.9.0');
    assert.equal(JSON.parse(readFileSync(join(directory, 'node_modules/@base-ui/react/package.json'), 'utf8')).version, '1.9.0');
    for (const name of ['typescript', 'esbuild', 'jsdom']) {
      assert(!existsSync(join(directory, 'node_modules', name)), `installed package must not need ${name}`);
    }
    const catalogText = readFileSync(join(installedRoot, 'dist/catalog.json'), 'utf8');
    assert(!catalogText.includes(root), 'catalog metadata must not expose the author workspace');
    assert.doesNotMatch(catalogText, /(?:\/Users\/|\/home\/|\/var\/folders\/|[A-Z]:\\Users\\)/, 'catalog metadata must use package paths');
    const catalog = JSON.parse(catalogText);
    for (const [module, count] of [['fields', 12], ['overlays', 9], ['display', 36], ['layout', 5]]) {
      const importPath = `@hyeonse/design-system/${module}`;
      assert.equal(installedPackage.exports[`./${module}`].default, `./dist/${module}.js`);
      assert.equal(installedPackage.exports[`./${module}`].types, `./dist/${module}.d.ts`);
      const names = catalog.entries.filter(entry => entry.importPath === importPath).map(entry => entry.id).sort();
      assert.equal(names.length, count, `${module} catalog entries`);
      const runtime = JSON.parse(execute(process.execPath, ['--input-type=module', '-e', `const module = await import('${importPath}'); console.log(JSON.stringify(Object.keys(module).sort()));`], directory));
      assert.deepEqual(runtime, names, `${module} runtime exports match the installed catalog`);
    }
    assert.match(execute(process.execPath, ['--input-type=module', '-e', "console.log(import.meta.resolve('@base-ui/react/menu'));"], directory), /node_modules\/@base-ui\/react\//);
    const manifest = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'manifest', '--json'], directory));
    assert.equal(manifest.package.name, '@hyeonse/design-system');
    const declarations = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'show', 'PreferencesProvider', '--json'], directory));
    assert(declarations.data.entry.props.some(prop => prop.name === 'defaults'));
    const primitive = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'show', 'TextField', '--json'], directory));
    assert.equal(primitive.data.entry.importPath, '@hyeonse/design-system/primitives');
    assert.deepEqual(primitive.data.entry.props.map(prop => prop.name), ['size', 'inputSize', 'label', 'type', 'hint', 'error']);
    assert.match(primitive.data.typeContext.declarations, /ComponentPropsWithRef<'input'>/);
    const imported = execute(process.execPath, ['--input-type=module', '-e', "const c = await import('@hyeonse/design-system/catalog.json', {with:{type:'json'}}); const s = await import('@hyeonse/design-system/catalog.schema.json', {with:{type:'json'}}); console.log(JSON.stringify({version:c.default.schemaVersion,schema:s.default.$schema}));"], directory);
    assert.equal(JSON.parse(imported).version, 1);
    assert.match(JSON.parse(imported).schema, /2020-12/);

    // The example is compiled as a separate consumer, with only its React peer/types.
    mkdirSync(join(directory, 'node_modules/@types'), { recursive: true });
    for (const name of ['react', 'react-dom', 'csstype', '@types/react']) {
      if (!existsSync(join(directory, 'node_modules', name))) symlinkSync(join(root, 'node_modules', name), join(directory, 'node_modules', name), 'dir');
    }
    assert.deepEqual(catalog.examples.map(example => example.id).sort(), ['display-settings', 'token-card', 'form-controls', 'expanded-forms', 'overlay-patterns', 'display-patterns', 'layout-sizing'].sort());
    for (const id of catalog.examples.map(example => example.id)) {
      const example = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'example', id, '--json'], directory)).data;
      for (const file of example.files) {
        assert.equal(file.code, readFileSync(join(installedRoot, file.path), 'utf8'), `${id} catalog code matches packaged example`);
        mkdirSync(dirname(join(directory, file.path)), { recursive: true });
        writeFileSync(join(directory, file.path), file.code);
      }
    }
    writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true }, include: ['examples/*.ts', 'examples/*.tsx'] }));
    execute(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(directory, 'tsconfig.json')], directory);
    execute(join(root, 'node_modules/esbuild/bin/esbuild'), [...['display-settings', 'form-controls', 'expanded-forms', 'overlay-patterns', 'display-patterns', 'layout-sizing'].map(id => `examples/${id}.tsx`), 'examples/preferences.ts', '--bundle', '--platform=browser', '--format=esm', '--outdir=build'], directory);
    for (const id of ['display-settings', 'form-controls', 'expanded-forms', 'overlay-patterns', 'display-patterns', 'layout-sizing', 'preferences']) {
      assert(existsSync(join(directory, 'build', `${id}.js`)), `${id} browser bundle`);
    }
    const render = execute(process.execPath, ['--input-type=module', '-e', "import React from 'react'; import {renderToString} from 'react-dom/server'; import {PreferencesProvider, PreferencesPanel} from '@hyeonse/design-system/react'; console.log(renderToString(React.createElement(PreferencesProvider, {defaults:{corners:'soft'}}, React.createElement(PreferencesPanel,{locale:'en'}))));"], directory);
    assert.match(render, /rounded corners/);
    assert.match(render, /Display settings/);
    const primitivesRender = execute(process.execPath, ['--input-type=module', '-e', "import React from 'react'; import {renderToString} from 'react-dom/server'; import {Button,TextField,Checkbox,Badge} from '@hyeonse/design-system/primitives'; console.log(renderToString(React.createElement('div',null,React.createElement(Button,{loading:true,loadingLabel:'Saving'},'Save'),React.createElement(TextField,{id:'email',label:'Email',type:'email',hint:'Work address',error:'Required'}),React.createElement(Checkbox,{id:'terms',label:'Terms',defaultChecked:true}),React.createElement(Badge,{tone:'success'},'Ready'))));"], directory);
    assert.match(primitivesRender, /type="button"/);
    assert.match(primitivesRender, /aria-busy="true"/);
    assert.match(primitivesRender, /disabled=""/);
    assert.match(primitivesRender, /<label[^>]+for="email"/);
    const primitivesDom = new JSDOM(primitivesRender);
    const email = primitivesDom.window.document.getElementById('email');
    assert.deepEqual(email.getAttribute('aria-describedby').split(' ').map(id => primitivesDom.window.document.getElementById(id)?.textContent), ['Work address', 'Required']);
    assert.equal(email.labels[0].control, email);
    primitivesDom.window.close();
    assert.match(primitivesRender, /aria-invalid="true"/);
    assert.match(primitivesRender, /type="checkbox"/);
    assert.match(primitivesRender, /hds-badge--success/);
    const componentCSS = readFileSync(join(installedRoot, 'dist/components.css'), 'utf8');
    assert.match(componentCSS, /\.hds-button--primary/);
    assert.match(componentCSS, /\.hds-badge--success/);
    assert.match(componentCSS, /\.hds-field__control/);
    assert.match(componentCSS, /\.hds-dialog__popup/);
    assert.match(componentCSS, /\.hds-tabs__list/);
    assert.match(readFileSync(join(directory, 'node_modules/@hyeonse/design-system/llms.txt'), 'utf8'), /docs\/ai.md/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
