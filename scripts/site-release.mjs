import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Keep this directory in source control: installation URLs are immutable even
// when the generated site is rebuilt or an older package is no longer current.
export function prepareRelease(root, store = resolve(root, 'releases')) {
  const temporary = mkdtempSync(join(tmpdir(), 'hds-site-release-'));
  try {
    const [packed] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], { cwd: root, encoding: 'utf8' }));
    if (!/^hyeonse-design-system-[\w.+-]+\.tgz$/.test(packed.filename)) throw new Error('Unexpected package archive filename');
    const bytes = readFileSync(join(temporary, packed.filename));
    const manifest = {
      name: packed.name, version: packed.version, file: packed.filename,
      url: `https://design-system.hyeonse.dev/releases/${packed.filename}`,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
      size: bytes.byteLength,
    };
    if (manifest.integrity !== packed.integrity) throw new Error('Archive integrity does not match npm pack');
    mkdirSync(store, { recursive: true });
    const destination = join(store, packed.filename);
    const manifestPath = join(store, packed.filename.replace(/\.tgz$/, '.json'));
    if (existsSync(destination)) {
      if (!lstatSync(destination).isFile() || !readFileSync(destination).equals(bytes)) {
        throw new Error(`Immutable release ${packed.version} changed. Bump the package version; never replace a published archive.`);
      }
    } else {
      writeFileSync(destination, bytes, { flag: 'wx' });
    }
    const serialized = JSON.stringify(manifest, null, 2) + '\n';
    if (existsSync(manifestPath)) {
      if (!lstatSync(manifestPath).isFile() || readFileSync(manifestPath, 'utf8') !== serialized) throw new Error(`Immutable manifest ${packed.version} changed`);
    } else {
      writeFileSync(manifestPath, serialized, { flag: 'wx' });
    }
    return manifest;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export function copyReleases(store, output, current) {
  mkdirSync(output, { recursive: true });
  for (const name of readdirSync(store)) {
    if (!/^hyeonse-design-system-[\w.+-]+\.(tgz|json)$/.test(name)) throw new Error(`Unexpected release store entry: ${name}`);
    const source = join(store, name);
    if (!lstatSync(source).isFile()) throw new Error(`Release must be a regular file: ${name}`);
    if (name.endsWith('.json')) {
      const manifest = JSON.parse(readFileSync(source, 'utf8'));
      if (manifest.file !== name.replace(/\.json$/, '.tgz')) throw new Error(`Invalid release manifest: ${name}`);
      const archive = join(store, manifest.file);
      if (!lstatSync(archive).isFile()) throw new Error(`Release must be a regular file: ${manifest.file}`);
      const bytes = readFileSync(archive);
      if (manifest.sha256 !== createHash('sha256').update(bytes).digest('hex') || manifest.integrity !== `sha512-${createHash('sha512').update(bytes).digest('base64')}` || manifest.size !== bytes.byteLength) throw new Error(`Stored release integrity mismatch: ${name}`);
    } else if (!existsSync(join(store, name.replace(/\.tgz$/, '.json')))) {
      throw new Error(`Release manifest missing: ${name}`);
    }
    copyFileSync(source, join(output, name));
  }
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(current, null, 2) + '\n');
}
