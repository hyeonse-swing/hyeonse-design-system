import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../scripts/audit-tokens.mjs', import.meta.url));

async function withFixture(check) {
  const root = await mkdtemp(join(tmpdir(), 'hds-audit-'));
  const css = join(root, 'src', 'sample.css');
  try {
    await mkdir(join(root, 'src'));
    await writeFile(css, '.card { color: var(--ink) }');
    const writeConfig = config => writeFile(join(root, 'design-system.audit.json'), JSON.stringify(config));
    const run = (configPath) => spawnSync(process.execPath, [cli, root, ...(configPath ? [configPath] : [])], { encoding: 'utf8' });
    await writeConfig({ paths: ['src'] });
    await check({ root, css, writeConfig, run });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function fails(result, pattern) {
  assert.equal(result.status, 1, `expected failure; stdout=${result.stdout}; stderr=${result.stderr}`);
  assert.match(result.stderr, pattern);
  assert.doesNotMatch(result.stderr, /\n\s+at /, 'expected config and filesystem errors should not print a stack');
}

test('CSS audit catches new drift and bounds documented color exceptions by count', async () => {
  await withFixture(async ({ root, css, writeConfig, run }) => {
    await writeFile(css, '.card {color:var(--ink);background:var(--paper)} /* #abcdef is a note */');
    assert.equal(run().status, 0);

    await writeFile(css, '.card {color:#ff00ff}');
    fails(run(), /sample\.css: raw color #ff00ff \(1 uses; allowed 0\)/);

    await writeConfig({ exceptions: { 'src/sample.css': { reason: 'Illustration material', colors: { '#ff00ff': 1 } } } });
    assert.equal(run().status, 0);
    await writeFile(css, '.card {color:#ff00ff; border-color:#ff00ff}');
    fails(run(), /sample\.css: raw color #ff00ff \(2 uses; allowed 1\)/);

    await writeFile(css, ':root {--ink:var(--accent-text)}');
    fails(run(), /shared token --ink/);
    await writeConfig({ overrideTokens: { 'src/sample.css': ['--ink'] } });
    assert.equal(run().status, 0);

    await writeFile(css, '.card {color:var(--ink)}');
    await writeFile(join(root, 'src', 'new-file.css'), '.new {background:rgb(0 0 0)}');
    fails(run(), /new-file\.css: raw color/);
  });
});

test('rejects empty scan inputs and malformed config instead of passing zero files', async () => {
  await withFixture(async ({ root, css, writeConfig, run }) => {
    await writeFile(css, '.card {color:#ff00ff}');
    for (const config of [null, [], 'src']) {
      await writeConfig(config);
      fails(run(), /config must be a JSON object/);
    }
    for (const paths of [[], 'src', [null], [''], ['   ']]) {
      await writeConfig({ paths });
      fails(run(), /config\.paths must be a nonempty array/);
    }
    await writeConfig({ paths: ['missing'] });
    fails(run(), /config\.paths entry .* cannot be resolved/);
    await writeConfig({ paths: ['src/sample.css'] });
    fails(run(), /must be a directory/);
    await writeFile(join(root, 'design-system.audit.json'), '{');
    fails(run(), /config file is not valid JSON/);

    await rm(css);
    await writeConfig({}); // Omitted paths still defaults to src.
    fails(run(), /no CSS files found in configured paths/);
    await writeFile(css, '.card {color:var(--ink)}');
    assert.match(run().stdout, /passed: 1 files/);
  });
});

test('rejects paths, config files, and CSS symlinks that escape the consumer root', async () => {
  await withFixture(async ({ root, writeConfig, run }) => {
    const outside = await mkdtemp(join(tmpdir(), 'hds-audit-outside-'));
    try {
      await writeFile(join(outside, 'bad.css'), '.bad {color:#ff00ff}');
      await writeFile(join(outside, 'audit.json'), '{}');
      await writeConfig({ paths: [relative(root, outside)] });
      fails(run(), /must stay inside consumer root/);
      fails(run(relative(root, join(outside, 'audit.json'))), /config file must stay inside consumer root/);

      await symlink(outside, join(root, 'linked-dir'));
      await writeConfig({ paths: ['linked-dir'] });
      fails(run(), /resolves outside consumer root/);

      await symlink(join(outside, 'audit.json'), join(root, 'linked-config.json'));
      fails(run('linked-config.json'), /config file resolves outside consumer root/);

      await writeConfig({ paths: ['src'] });
      await symlink(join(outside, 'bad.css'), join(root, 'src', 'linked.css'));
      fails(run(), /symlink in audited path is not allowed/);
      await rm(join(root, 'src', 'linked.css'));

      await symlink(outside, join(root, 'src', 'external-dir'));
      fails(run(), /symlink in audited path is not allowed/);
      await rm(join(root, 'src', 'external-dir'));
      await symlink(join(root, 'src'), join(root, 'src', 'cycle'));
      fails(run(), /symlink in audited path is not allowed/);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});

test('overlapping scan roots count each CSS file once', async () => {
  await withFixture(async ({ root, writeConfig, run }) => {
    await mkdir(join(root, 'src', 'nested'));
    await writeFile(join(root, 'src', 'nested', 'second.css'), '.nested {color:var(--ink)}');
    await writeConfig({ paths: ['src', 'src/nested', 'src'] });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /passed: 2 files/);
  });
});

test('rejects malformed exception counts and token override lists even for unmatched files', async () => {
  await withFixture(async ({ root, writeConfig, run }) => {
    for (const config of [
      { exceptions: [] },
      { exceptions: { 'future.css': null } },
      { exceptions: { 'future.css': { reason: ' ', colors: {} } } },
      { exceptions: { 'future.css': { reason: 'material' } } },
      ...[-1, 0.5, '1', null].map(count => ({ exceptions: { 'future.css': { reason: 'material', colors: { '#ff00ff': count } } } })),
      { overrideTokens: [] },
      { overrideTokens: { 'future.css': '--ink' } },
      { overrideTokens: { 'future.css': ['--ink', 1] } },
    ]) {
      await writeConfig(config);
      fails(run(), /exceptions|overrideTokens/);
    }
    await writeFile(join(root, 'design-system.audit.json'), '{"exceptions":{"future.css":{"reason":"material","colors":{"#ff00ff":1e999}}}}');
    fails(run(), /nonnegative finite integer/);
    await writeConfig({ exceptions: { 'src/sample.css': { reason: 'No raw colors permitted', colors: { '#ff00ff': 0 } } }, overrideTokens: { 'src/sample.css': ['--ink'] } });
    assert.equal(run().status, 0);
  });
});
