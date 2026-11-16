import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { relative, resolve } from 'node:path';
import { build } from 'esbuild';
import { createPreferenceScript } from '../dist/preferences.js';
import { ensureFonts } from './ensure-fonts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, '.site');
await ensureFonts(root);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

// Publish the showcase and its references, without development/output directories.
const publicPaths = [
  'showcase.css', 'favicon.svg', 'dist', 'docs', 'examples',
  'schemas', 'skills', 'llms.txt', 'llms-full.txt', 'README.md',
  'LICENSE', 'THIRD_PARTY_NOTICES.md', 'licenses',
];
for (const path of publicPaths) {
  cpSync(resolve(root, path), resolve(output, path), { recursive: true });
}
// Render the same package-backed tree used by the browser. The references and
// native disclosure elements remain available before hydration and without JS.
const serverModule = resolve(output, '.render.mjs');
await build({
  absWorkingDir: root, entryPoints: ['showcase/render.tsx'], outfile: serverModule,
  bundle: true, format: 'esm', platform: 'node', target: 'node22',
  packages: 'external', logLevel: 'warning', logOverride: { 'ignored-directives': 'silent' },
  define: { 'process.env.NODE_ENV': '"production"' },
});
const { renderShowcase } = await import(pathToFileURL(serverModule).href);
const content = renderShowcase();
rmSync(serverModule);
const client = await build({
  absWorkingDir: root, entryPoints: { showcase: 'showcase/client.tsx' }, outdir: output,
  entryNames: 'assets/[name]-[hash]', bundle: true, minify: true, format: 'esm',
  platform: 'browser', target: 'es2020', metafile: true, logLevel: 'warning',
  logOverride: { 'ignored-directives': 'silent' },
  define: { 'process.env.NODE_ENV': '"production"' },
});
const entry = Object.entries(client.metafile.outputs).find(([, meta]) => meta.entryPoint)?.[0];
if (!entry) throw new Error('Showcase browser entry is missing');
const clientPath = relative(output, resolve(root, entry)).split('\\').join('/');
const template = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const marker of ['preferences', 'content', 'client']) {
  if (!template.includes(`<!-- hds:${marker} -->`)) throw new Error(`Missing showcase template marker: ${marker}`);
}
const html = template
  .replace('<!-- hds:preferences -->', `<script>${createPreferenceScript()}</script>`)
  .replace('<!-- hds:content -->', content)
  .replace('<!-- hds:client -->', `<script type="module" src="./${clientPath}"></script>`);
writeFileSync(resolve(output, 'index.html'), html);
console.log(`Static showcase rendered; browser bundle ${clientPath}; ${publicPaths.length} reference paths.`);
