import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildCatalog } from './build-catalog.mjs';
import { renderFullReference, renderIndex } from './catalog-format.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
mkdirSync(resolve(root, 'dist'), { recursive: true });
execFileSync(resolve(root, 'node_modules/.bin/tsc'), ['-p', resolve(root, 'tsconfig.json')], { stdio: 'inherit' });
for (const name of ['tokens.css', 'components.css']) {
  cpSync(resolve(root, 'src', name), resolve(root, 'dist', name));
}

const catalog = buildCatalog(root);
writeFileSync(resolve(root, 'dist/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
writeFileSync(resolve(root, 'llms.txt'), renderIndex(catalog));
writeFileSync(resolve(root, 'llms-full.txt'), renderFullReference(catalog));
