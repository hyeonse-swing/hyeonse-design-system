#!/usr/bin/env node
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Audit CSS values, including new files. Material colors need counted, documented exceptions.
class AuditError extends Error {}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const within = (root, path) => {
  const fromRoot = relative(root, path);
  return fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`) && !isAbsolute(fromRoot);
};

async function resolveWithin(root, path, description) {
  const absolute = resolve(root, path);
  if (!within(root, absolute)) throw new AuditError(`${description} must stay inside consumer root: ${path}`);
  let actual;
  try {
    actual = await realpath(absolute);
  } catch (error) {
    throw new AuditError(`${description} cannot be resolved: ${path} (${error.message})`);
  }
  if (!within(root, actual)) throw new AuditError(`${description} resolves outside consumer root: ${path}`);
  return actual;
}

async function requireType(path, type, description) {
  let info;
  try {
    info = await stat(path);
  } catch (error) {
    throw new AuditError(`${description} cannot be read: ${path} (${error.message})`);
  }
  if (!(type === 'directory' ? info.isDirectory() : info.isFile())) {
    throw new AuditError(`${description} must be a ${type}: ${path}`);
  }
}

function validateConfig(config) {
  if (!isObject(config)) throw new AuditError('config must be a JSON object');
  const paths = Object.hasOwn(config, 'paths') ? config.paths : ['src'];
  if (!Array.isArray(paths) || paths.length === 0 || paths.some(path => typeof path !== 'string' || !path.trim())) {
    throw new AuditError('config.paths must be a nonempty array of nonempty path strings');
  }
  if (Object.hasOwn(config, 'exceptions')) {
    if (!isObject(config.exceptions)) throw new AuditError('config.exceptions must be an object');
    for (const [path, exception] of Object.entries(config.exceptions)) {
      if (!isObject(exception)) throw new AuditError(`exceptions[${JSON.stringify(path)}] must be an object`);
      if (typeof exception.reason !== 'string' || !exception.reason.trim()) {
        throw new AuditError(`exceptions[${JSON.stringify(path)}].reason must be a nonempty string`);
      }
      if (!isObject(exception.colors)) {
        throw new AuditError(`exceptions[${JSON.stringify(path)}].colors must be an object`);
      }
      for (const [color, count] of Object.entries(exception.colors)) {
        if (typeof count !== 'number' || !Number.isFinite(count) || !Number.isInteger(count) || count < 0) {
          throw new AuditError(`exceptions[${JSON.stringify(path)}].colors[${JSON.stringify(color)}] must be a nonnegative finite integer`);
        }
      }
    }
  }
  if (Object.hasOwn(config, 'overrideTokens')) {
    if (!isObject(config.overrideTokens)) throw new AuditError('config.overrideTokens must be an object');
    for (const [path, tokens] of Object.entries(config.overrideTokens)) {
      if (!Array.isArray(tokens) || tokens.some(token => typeof token !== 'string')) {
        throw new AuditError(`overrideTokens[${JSON.stringify(path)}] must be an array of strings`);
      }
    }
  }
  return paths;
}

async function main() {
  const rootInput = resolve(process.argv[2] || '.');
  let root;
  try {
    root = await realpath(rootInput);
  } catch (error) {
    throw new AuditError(`consumer root cannot be resolved: ${rootInput} (${error.message})`);
  }
  await requireType(root, 'directory', 'consumer root');

  const configName = process.argv[3] === undefined ? 'design-system.audit.json' : process.argv[3];
  if (!configName.trim()) throw new AuditError('config path must be nonempty');
  const configPath = await resolveWithin(root, configName, 'config file');
  await requireType(configPath, 'file', 'config file');
  let config;
  try {
    config = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new AuditError(`config file is not valid JSON: ${configPath} (${error.message})`);
    throw error;
  }
  const paths = validateConfig(config);

  const directories = [];
  for (const path of paths) {
    const directory = await resolveWithin(root, path, `config.paths entry ${JSON.stringify(path)}`);
    await requireType(directory, 'directory', `config.paths entry ${JSON.stringify(path)}`);
    directories.push(directory);
  }

  const files = [];
  const visitedDirectories = new Set();
  const visitedFiles = new Set();
  async function walk(directory) {
    if (visitedDirectories.has(directory)) return;
    visitedDirectories.add(directory);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) throw new AuditError(`symlink in audited path is not allowed: ${path}`);
      if (entry.isDirectory()) {
        const actual = await resolveWithin(root, path, 'CSS directory');
        await walk(actual);
      } else if (entry.name.endsWith('.css')) {
        const actual = await resolveWithin(root, path, 'CSS file');
        await requireType(actual, 'file', 'CSS file');
        if (!visitedFiles.has(actual)) {
          visitedFiles.add(actual);
          files.push(actual);
        }
      }
    }
  }
  for (const directory of directories) await walk(directory);
  if (!files.length) throw new AuditError('no CSS files found in configured paths; check config.paths');

  const tokenPath = fileURLToPath(new URL('../dist/tokens.css', import.meta.url));
  const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokenSource = withoutComments(await readFile(tokenPath, 'utf8'));
  const systemTokens = new Set([...tokenSource.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  const rawColors = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)/gi;
  const errors = [];
  for (const file of files) {
    const path = relative(root, file).replaceAll('\\', '/');
    const source = withoutComments(await readFile(file, 'utf8'));
    const exception = config.exceptions?.[path];
    const counts = {};
    for (const match of source.matchAll(rawColors)) {
      const value = match[0].toLowerCase().replace(/\s+/g, ' ');
      counts[value] = (counts[value] || 0) + 1;
    }
    for (const [value, count] of Object.entries(counts)) {
      const allowed = exception?.colors[value] ?? 0;
      if (count > allowed) errors.push(`${path}: raw color ${value} (${count} uses; allowed ${allowed})`);
    }
    for (const match of source.matchAll(/(--[\w-]+)\s*:/g)) {
      if (systemTokens.has(match[1]) && !config.overrideTokens?.[path]?.includes(match[1])) {
        errors.push(`${path}: shared token ${match[1]} must be changed in the design system`);
      }
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log(`Design-system CSS audit passed: ${files.length} files, ${systemTokens.size} shared tokens.`);
}

main().catch(error => {
  if (!(error instanceof AuditError) && !error?.code) throw error;
  console.error(`hds-audit: ${error.message}`);
  process.exitCode = 1;
});
