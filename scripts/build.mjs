import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildCatalog } from './build-catalog.mjs';
import { renderFullReference, renderIndex } from './catalog-format.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
mkdirSync(resolve(root, 'dist'), { recursive: true });
execFileSync(resolve(root, 'node_modules/.bin/tsc'), ['-p', resolve(root, 'tsconfig.json')], { stdio: 'inherit' });
cpSync(resolve(root, 'src/tokens.css'), resolve(root, 'dist/tokens.css'));
writeFileSync(resolve(root, 'dist/components.css'), ['sizing.css', 'components.css', 'primitives.css', 'fields.css', 'overlays.css', 'display.css'].map(name => readFileSync(resolve(root, 'src', name), 'utf8').trimEnd()).join('\n\n') + '\n');

const catalog = buildCatalog(root);
writeFileSync(resolve(root, 'dist/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
writeFileSync(resolve(root, 'llms.txt'), renderIndex(catalog));
writeFileSync(resolve(root, 'llms-full.txt'), renderFullReference(catalog));
