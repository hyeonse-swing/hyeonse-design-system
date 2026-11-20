import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const gh = promisify(execFile);
const owner = 'hyeonse-swing';
const consumers = ['hyeonse-portfolio', 'return-review-console', 'flow-qa', 'harukotoba'];
const packageName = '@hyeonse/design-system';
const base = 'https://design-system.hyeonse.dev/releases/';
const local = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const descriptorName = 'hyeonse-design-system-' + local.version;
const release = JSON.parse(await readFile(new URL('../releases/' + descriptorName + '.json', import.meta.url), 'utf8'));

async function download(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
  return response;
}

assert.deepEqual(await (await download(base + 'manifest.json')).json(), release);
assert.equal(release.name, packageName);
assert.equal(release.version, local.version);
assert.equal(release.url, base + descriptorName + '.tgz');
const archive = Buffer.from(await (await download(release.url)).arrayBuffer());
assert.equal(archive.length, release.size);
assert.equal(createHash('sha256').update(archive).digest('hex'), release.sha256);
assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), release.integrity);

function dependency(manifest) {
  return manifest.dependencies?.[packageName] ?? manifest.devDependencies?.[packageName];
}

async function inspect(repo) {
  const prefix = 'repos/' + owner + '/' + repo;
  const options = { maxBuffer: 8 * 1024 * 1024 };
  const head = await gh('gh', ['api', prefix + '/commits/HEAD', '--jq', '.sha'], options);
  const commit = head.stdout.trim();
  async function file(name) {
    const path = prefix + '/contents/' + name + '?ref=' + commit;
    const { stdout } = await gh('gh', ['api', '-H', 'Accept: application/vnd.github.raw+json', path], options);
    return JSON.parse(stdout);
  }
  const [pkg, lock] = await Promise.all([file('package.json'), file('package-lock.json')]);
  const installed = lock.packages?.['node_modules/' + packageName];
  const current = dependency(pkg) === release.url && dependency(lock.packages?.[''] ?? {}) === release.url &&
    installed?.version === release.version && installed.resolved === release.url && installed.integrity === release.integrity;
  return { repo, commit, declared: dependency(pkg) ?? null, lockedVersion: installed?.version ?? null,
    status: current ? 'current' : 'needs-update' };
}

const results = await Promise.allSettled(consumers.map(inspect));
const projects = results.map((result, i) => result.status === 'fulfilled'
  ? result.value : { repo: consumers[i], status: 'unavailable', error: result.reason.message });
console.log(JSON.stringify({ version: release.version, sha256: release.sha256, projects }, null, 2));
if (projects.some(project => project.status !== 'current')) process.exitCode = 1;
