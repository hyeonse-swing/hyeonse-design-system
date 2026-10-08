import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
mkdirSync(resolve(root, 'dist'), { recursive: true });
execFileSync(resolve(root, 'node_modules/.bin/tsc'), ['-p', resolve(root, 'tsconfig.json')], { stdio: 'inherit' });
for (const name of ['tokens.css', 'components.css']) {
  cpSync(resolve(root, 'src', name), resolve(root, 'dist', name));
}
