#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Audit CSS values, including new files. Material colors need counted, documented exceptions.
const root = resolve(process.argv[2] || '.');
const configPath = resolve(root, process.argv[3] || 'design-system.audit.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const tokenPath = fileURLToPath(new URL('../dist/tokens.css', import.meta.url));
const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '');
const tokenSource = withoutComments(await readFile(tokenPath, 'utf8'));
const systemTokens = new Set([...tokenSource.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
const rawColors = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)/gi;
const errors = [];
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.css')) files.push(path);
  }
}
for (const directory of config.paths || ['src']) await walk(resolve(root, directory));
for (const file of files) {
  const path = relative(root, file).replaceAll('\\', '/');
  const source = withoutComments(await readFile(file, 'utf8'));
  const exception = config.exceptions?.[path];
  if (exception && !exception.reason?.trim()) errors.push(`${path}: exception needs a reason`);
  const counts = {};
  for (const match of source.matchAll(rawColors)) {
    const value = match[0].toLowerCase().replace(/\s+/g, ' ');
    counts[value] = (counts[value] || 0) + 1;
  }
  for (const [value, count] of Object.entries(counts)) {
    if (count > (exception?.colors?.[value] || 0)) errors.push(`${path}: raw color ${value} (${count} uses; allowed ${exception?.colors?.[value] || 0})`);
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
