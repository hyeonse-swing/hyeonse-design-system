import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
    for (const path of ['dist/catalog.json', 'dist/primitives.js', 'dist/primitives.d.ts', 'dist/components.css', 'schemas/catalog.schema.json', 'scripts/hds.mjs', 'scripts/catalog-format.mjs', 'llms.txt', 'llms-full.txt', 'docs/ai.md', 'docs/api.md', 'skills/hyeonse-design-system/SKILL.md', 'examples/display-settings.tsx', 'examples/form-controls.tsx']) assert(files.has(path), path);
    assert(![...files].some(path => /\.(woff2?|ttf|otf)$/.test(path)), 'fonts remain consumer-owned assets');
    assert(!files.has('metadata/catalog.mjs'), 'runtime does not depend on authoring tools');
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'hds-consumer-check', private: true, type: 'module' }));
    execute('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(directory, packed.filename)], directory);
    for (const name of ['typescript', 'esbuild', 'jsdom']) {
      assert(!existsSync(join(directory, 'node_modules', name)), `installed package must not need ${name}`);
    }
    const manifest = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'manifest', '--json'], directory));
    assert.equal(manifest.package.name, '@hyeonse/design-system');
    const declarations = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'show', 'PreferencesProvider', '--json'], directory));
    assert(declarations.data.entry.props.some(prop => prop.name === 'defaults'));
    const primitive = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'show', 'TextField', '--json'], directory));
    assert.equal(primitive.data.entry.importPath, '@hyeonse/design-system/primitives');
    assert.deepEqual(primitive.data.entry.props.map(prop => prop.name), ['label', 'type', 'hint', 'error']);
    assert.match(primitive.data.typeContext.declarations, /ComponentPropsWithRef<'input'>/);
    const imported = execute(process.execPath, ['--input-type=module', '-e', "const c = await import('@hyeonse/design-system/catalog.json', {with:{type:'json'}}); const s = await import('@hyeonse/design-system/catalog.schema.json', {with:{type:'json'}}); console.log(JSON.stringify({version:c.default.schemaVersion,schema:s.default.$schema}));"], directory);
    assert.equal(JSON.parse(imported).version, 1);
    assert.match(JSON.parse(imported).schema, /2020-12/);

    // The example is compiled as a separate consumer, with only its React peer/types.
    mkdirSync(join(directory, 'node_modules/@types'), { recursive: true });
    for (const name of ['react', 'react-dom', 'csstype', '@types/react']) {
      if (!existsSync(join(directory, 'node_modules', name))) symlinkSync(join(root, 'node_modules', name), join(directory, 'node_modules', name), 'dir');
    }
    for (const id of ['display-settings', 'form-controls']) {
      const example = JSON.parse(execute('npm', ['exec', '--offline', '--no', '--', 'hds', 'example', id, '--json'], directory)).data;
      for (const file of example.files) {
        mkdirSync(join(directory, 'examples'), { recursive: true });
        writeFileSync(join(directory, file.path), file.code);
      }
    }
    writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true }, include: ['examples/*.ts', 'examples/*.tsx'] }));
    execute(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(directory, 'tsconfig.json')], directory);
    const render = execute(process.execPath, ['--input-type=module', '-e', "import React from 'react'; import {renderToString} from 'react-dom/server'; import {PreferencesProvider, PreferencesPanel} from '@hyeonse/design-system/react'; console.log(renderToString(React.createElement(PreferencesProvider, {defaults:{corners:'soft'}}, React.createElement(PreferencesPanel,{locale:'en'}))));"], directory);
    assert.match(render, /rounded corners/);
    assert.match(render, /Display settings/);
    const primitivesRender = execute(process.execPath, ['--input-type=module', '-e', "import React from 'react'; import {renderToString} from 'react-dom/server'; import {Button,TextField,Checkbox,Badge} from '@hyeonse/design-system/primitives'; console.log(renderToString(React.createElement('div',null,React.createElement(Button,{loading:true,loadingLabel:'Saving'},'Save'),React.createElement(TextField,{id:'email',label:'Email',type:'email',hint:'Work address',error:'Required'}),React.createElement(Checkbox,{id:'terms',label:'Terms',defaultChecked:true}),React.createElement(Badge,{tone:'success'},'Ready'))));"], directory);
    assert.match(primitivesRender, /type="button"/);
    assert.match(primitivesRender, /aria-busy="true"/);
    assert.match(primitivesRender, /disabled=""/);
    assert.match(primitivesRender, /<label[^>]+for="email"/);
    assert.match(primitivesRender, /aria-describedby="email-hint email-error"/);
    assert.match(primitivesRender, /aria-invalid="true"/);
    assert.match(primitivesRender, /type="checkbox"/);
    assert.match(primitivesRender, /hds-badge--success/);
    const componentCSS = readFileSync(join(directory, 'node_modules/@hyeonse/design-system/dist/components.css'), 'utf8');
    assert.match(componentCSS, /\.hds-button--primary/);
    assert.match(componentCSS, /\.hds-badge--success/);
    assert.match(readFileSync(join(directory, 'node_modules/@hyeonse/design-system/llms.txt'), 'utf8'), /docs\/ai.md/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
