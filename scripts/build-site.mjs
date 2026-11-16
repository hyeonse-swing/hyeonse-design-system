import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, '.site');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

// Publish the showcase and its references, without development/output directories.
const publicPaths = [
  'index.html', 'showcase.css', 'showcase.mjs', 'dist', 'docs', 'examples',
  'schemas', 'skills', 'llms.txt', 'llms-full.txt', 'README.md',
  'LICENSE', 'THIRD_PARTY_NOTICES.md', 'licenses',
];
for (const path of publicPaths) {
  cpSync(resolve(root, path), resolve(output, path), { recursive: true });
}
console.log(`Static showcase and references ready: ${publicPaths.length} public paths.`);
