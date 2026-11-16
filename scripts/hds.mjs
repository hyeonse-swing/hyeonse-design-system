#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { formatEntry, formatExample, formatSetup, formatToken } from './catalog-format.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const positional = args.filter(arg => arg !== '--json');
const commands = [
  { name: 'list', usage: 'hds list', description: 'List every exported runtime API.' },
  { name: 'show', usage: 'hds show <name>', description: 'Read one exported API, its props, states, limits and type context.' },
  { name: 'tokens', usage: 'hds tokens [name]', description: 'List CSS token roles or inspect a token and its conditional values.' },
  { name: 'example', usage: 'hds example <id>', description: 'Print a complete consumer example without writing files.' },
  { name: 'search', usage: 'hds search <words>', description: 'Find APIs, tokens and examples; return follow-up commands.' },
  { name: 'docs', usage: 'hds docs', description: 'Read setup guidance and the package boundaries.' },
  { name: 'manifest', usage: 'hds manifest', description: 'Read the CLI command and response contract.' },
];
let packageInfo;

function fail(code, message, suggestions = []) {
  const error = { code, message, ...(suggestions.length ? { suggestions } : {}) };
  if (json) process.stdout.write(JSON.stringify({ schemaVersion: 1, ...(packageInfo ? { package: packageInfo } : {}), error }, null, 2) + '\n');
  else process.stderr.write(`${code}: ${message}${suggestions.length ? `\n${suggestions.join('\n')}` : ''}\n`);
  process.exitCode = 1;
}

function output(type, data, markdown) {
  process.stdout.write((json ? JSON.stringify({ schemaVersion: 1, package: packageInfo, type, data }, null, 2) : markdown) + '\n');
}

try {
  const packageJSON = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  packageInfo = { name: packageJSON.name, version: packageJSON.version };
  const raw = readFileSync(new URL('../dist/catalog.json', import.meta.url), 'utf8');
  const catalog = JSON.parse(raw);
  if (catalog.schemaVersion !== 1 || catalog.package.name !== packageInfo.name || catalog.package.version !== packageInfo.version) {
    throw new Error('Catalog/package version mismatch. Rebuild the package.');
  }
  const [command = 'help', ...values] = positional;
  const help = `# hds — ${packageInfo.name} ${packageInfo.version}\n\nRead-only reference for the installed package. No network, installation or file changes.\n\n${commands.map(item => `- \`${item.usage}\` — ${item.description}`).join('\n')}\n\nEvery command accepts --json. Use \`hds show PreferencesProvider\` to start.\n`;
  const allowed = new Map(commands.map(item => [item.name, item]));
  const invalidOption = positional.find((value, index) => value.startsWith('--') && value !== '--help'
    && !(command === 'tokens' && index === 1 && /^--[a-z][a-z0-9-]*$/.test(value))
    && !(command === 'search' && index > 0 && catalog.tokens.some(token => token.name === value)));
  const arities = { list: [0, 0], show: [1, 1], tokens: [0, 1], example: [1, 1], search: [1, Infinity], docs: [0, 0], manifest: [0, 0] };
  const normalized = value => value.normalize('NFKC').toLocaleLowerCase('en');
  const search = query => {
    const terms = normalized(query).split(/\s+/).filter(Boolean);
    const candidates = [
      ...catalog.entries.map(entry => ({ id: entry.id, kind: entry.kind, summary: entry.summary, keywords: entry.keywords, command: `hds show ${entry.id}` })),
      ...catalog.tokens.map(token => ({ id: token.name, kind: 'token', summary: token.role, keywords: [], command: `hds tokens ${token.name}` })),
      ...catalog.examples.map(example => ({ id: example.id, kind: 'example', summary: example.description, keywords: [], command: `hds example ${example.id}` })),
    ];
    return candidates.map(item => {
      const id = normalized(item.id);
      const haystack = normalized([item.id, item.summary, ...item.keywords].join(' '));
      return { ...item, score: terms.every(term => haystack.includes(term)) ? (id === normalized(query) ? 100 : terms.reduce((score, term) => score + (id.includes(term) ? 10 : 1), 0)) : 0 };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).map(({ keywords, score, ...item }) => item);
  };

  if (invalidOption) fail('INVALID_ARGUMENT', `Unknown option: ${invalidOption}`, ['hds --help']);
  else if (command === 'help' || command === '--help' || (allowed.has(command) && values.includes('--help'))) {
    output('help', { commands, options: ['--json', '--help'] }, help);
  } else if (!allowed.has(command)) fail('UNKNOWN_COMMAND', `Unknown command: ${command}`, commands.map(item => item.usage));
  else if (values.length < arities[command][0] || values.length > arities[command][1]) fail('INVALID_ARGUMENT', `Usage: ${allowed.get(command).usage}`);
  else if (command === 'list') {
    const data = catalog.entries.map(({ id, kind, summary }) => ({ id, kind, summary, command: `hds show ${id}` }));
    output('entry.list', data, data.map(item => `- ${item.id} [${item.kind}] — ${item.summary}\n  ${item.command}`).join('\n'));
  } else if (command === 'show') {
    const entry = catalog.entries.find(item => normalized(item.id) === normalized(values[0]));
    if (!entry) fail('UNKNOWN_ENTRY', `No exported API named ${values[0]}.`, ['hds list', ...search(values[0]).slice(0, 3).map(item => item.command)]);
    else {
      const module = catalog.modules.find(item => item.importPath === entry.importPath);
      output('entry.detail', { entry, typeContext: { importPath: module.importPath, declarations: module.declarations } }, `${formatEntry(entry)}\n\n### Module type context\n\n\`\`\`typescript\n${module.declarations.trimEnd()}\n\`\`\``);
    }
  } else if (command === 'tokens') {
    const name = values[0]?.startsWith('--') ? values[0] : values[0] ? `--${values[0]}` : undefined;
    const token = name && catalog.tokens.find(item => item.name === name);
    if (name && !token) fail('UNKNOWN_TOKEN', `No token named ${name}.`, ['hds tokens']);
    else if (token) output('token.detail', token, formatToken(token));
    else output('token.list', catalog.tokens.map(({ name, role, value }) => ({ name, role, value })), catalog.tokens.map(token => `- \`${token.name}\`: \`${token.value}\` — ${token.role}`).join('\n'));
  } else if (command === 'example') {
    const example = catalog.examples.find(item => item.id === values[0]);
    if (!example) fail('UNKNOWN_EXAMPLE', `No example named ${values[0]}.`, catalog.examples.map(item => `hds example ${item.id}`));
    else output('example.detail', example, formatExample(example));
  } else if (command === 'search') {
    const query = values.join(' ').trim();
    if (!query) fail('INVALID_ARGUMENT', 'Search needs a non-empty query.');
    else {
      const matches = search(query);
      const results = matches.slice(0, 20);
      output('search', { query, total: matches.length, results }, results.length ? results.map(item => `- ${item.id} [${item.kind}] — ${item.summary}\n  ${item.command}`).join('\n') : `No matches for ${query}. Try hds list or hds tokens.`);
    }
  } else if (command === 'docs') {
    output('docs', { setup: catalog.setup, boundaries: catalog.boundaries }, formatSetup(catalog));
  } else if (command === 'manifest') {
    const data = { commands, options: ['--json', '--help'], readOnly: true, catalog: '@hyeonse/design-system/catalog.json', catalogSchema: '@hyeonse/design-system/catalog.schema.json', catalogSha256: createHash('sha256').update(raw).digest('hex'), response: { success: '{schemaVersion: 1, package: {name, version}, type, data}', error: '{schemaVersion: 1, package?: {name, version}, error: {code, message, suggestions?}}' }, errorCodes: ['INVALID_ARGUMENT', 'UNKNOWN_COMMAND', 'UNKNOWN_ENTRY', 'UNKNOWN_TOKEN', 'UNKNOWN_EXAMPLE', 'INVALID_CATALOG'] };
    output('manifest', data, help + '\nCatalog schema: @hyeonse/design-system/catalog.schema.json\nCatalog: @hyeonse/design-system/catalog.json\nJSON errors return a nonzero exit code; branch on error.code.');
  }
} catch (error) {
  fail('INVALID_CATALOG', error instanceof Error ? error.message : 'Unable to read this package catalog.');
}
