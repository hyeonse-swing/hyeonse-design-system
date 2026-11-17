import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import subsetFont from 'subset-font';

export async function showcaseCharacters(root) {
  const files = ['index.html'];
  for (const directory of ['src', 'showcase']) {
    for (const file of await readdir(join(root, directory))) {
      if (/\.(ts|tsx)$/.test(file)) files.push(`${directory}/${file}`);
    }
  }
  const texts = await Promise.all(files.map(file => readFile(join(root, file), 'utf8')));
  return [...new Set([...texts.join('')].filter(character => character.codePointAt(0) > 0xff))].sort().join('');
}

export async function ensureFonts(root) {
  const characters = await showcaseCharacters(root);
  const coveragePath = join(root, 'scripts/font-coverage.json');
  const coverage = await readFile(coveragePath, 'utf8').then(JSON.parse).catch(() => null);
  const outputPath = join(root, 'docs/assets/fonts/noto-kr-subset.woff2');
  const currentFont = await readFile(outputPath).catch(() => null);
  const hash = data => createHash('sha256').update(data).digest('hex');
  if (coverage && currentFont && coverage.sha256 === hash(currentFont) && [...characters].every(character => coverage.characters.includes(character))) {
    console.log('Showcase font coverage is current.');
    return;
  }
  const sourcePath = join(root, 'scripts/.font-cache/NotoSansKR.ttf');
  const expectedHash = '194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252';
  let source = await readFile(sourcePath).catch(() => null);
  if (!source || hash(source) !== expectedHash) {
    const url = 'https://raw.githubusercontent.com/google/fonts/4efc2774c63917927efe769ca845def6bd6debae/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf';
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Showcase font download failed: ${response.status}`);
    source = Buffer.from(await response.arrayBuffer());
    if (hash(source) !== expectedHash) throw new Error('Showcase font source integrity mismatch');
    await mkdir(join(root, 'scripts/.font-cache'), { recursive: true });
    await writeFile(sourcePath, source);
  }
  const font = await subsetFont(source, characters, { targetFormat: 'woff2' });
  await writeFile(outputPath, font);
  await writeFile(coveragePath, JSON.stringify({ characters, sha256: hash(font) }, null, 2) + '\n');
  console.log(`Showcase font regenerated: ${characters.length} non-Latin characters, ${font.length} bytes.`);
}
