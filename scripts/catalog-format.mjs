const bullets = items => items.map(item => `- ${item}`).join('\n');
const section = (title, items) => items?.length ? `\n\n### ${title}\n\n${bullets(items)}` : '';

export function formatEntry(entry) {
  let text = `## ${entry.id}\n\n${entry.summary}\n\nKind: ${entry.kind} · Import: \`${entry.importPath}\`\n\n\`\`\`typescript\n${entry.signature}\n\`\`\``;
  if (entry.props?.length) {
    text += '\n\n### Locally declared props\n\n' + bullets(entry.props.map(prop => `\`${prop.name}${prop.required ? '' : '?'}\`: \`${prop.type}\``));
  }
  text += section('Usage', entry.usage) + section('States', entry.states) + section('Accessibility', entry.accessibility) + section('Limits', entry.limitations);
  if (entry.examples.length) text += '\n\nExamples: ' + entry.examples.map(id => `\`hds example ${id}\``).join(', ');
  return text;
}

export function formatToken(token) {
  let text = `## ${token.name}\n\n${token.role}\n\nDefault: \`${token.value}\``;
  if (token.overrides.length) text += '\n\n' + bullets(token.overrides.map(value => `${value.media ? `@media ${value.media} · ` : ''}\`${value.selector}\` → \`${value.value}\``));
  return text;
}

export function formatExample(example) {
  return `## ${example.id}\n\n${example.description}\n\n` + example.files.map(file => `### ${file.path}\n\n\`\`\`${file.language}\n${file.code.trimEnd()}\n\`\`\``).join('\n\n');
}

export function formatSetup(catalog) {
  return `# ${catalog.package.name}\n\nInstalled package version: ${catalog.package.version}\n\n## Setup\n\n${bullets(catalog.setup)}\n\n## Provided\n\n${bullets(catalog.boundaries.provided)}\n\n## Not provided\n\n${bullets(catalog.boundaries.notProvided)}`;
}

export function renderFullReference(catalog) {
  return `${formatSetup(catalog)}\n\nGenerated from the package declarations, CSS and authored usage metadata. Do not edit this output. Props summaries contain locally declared props; module declarations preserve inherited native attributes and refs.\n\n# API\n\n${catalog.entries.map(formatEntry).join('\n\n')}\n\n# Type context\n\n${catalog.modules.map(module => `## ${module.importPath}\n\n\`\`\`typescript\n${module.declarations.trimEnd()}\n\`\`\``).join('\n\n')}\n\n# CSS tokens\n\nValues are CSS expressions, with their original selector and media-query conditions. This is the package catalog format, not a DTCG token interchange file.\n\n${catalog.tokens.map(formatToken).join('\n\n')}\n\n# Examples\n\n${catalog.examples.map(formatExample).join('\n\n')}\n`;
}

export function renderIndex(catalog) {
  return `# Hyeonse Design System\n\n> ${catalog.package.name} ${catalog.package.version}: semantic CSS tokens, React preferences, forms, overlays, navigation, layout, and feedback for personal projects.\n\nUse the installed package reference. Existing primitives are in /primitives; input and selection controls are in /fields; menus, dialogs and notifications are in /overlays; navigation, tables, cards and feedback are in /display. Check the installed version before using an export.\n\n## Start here\n\n- [AI usage](./docs/ai.md): local CLI, JSON lookups and integration workflow.\n- [Setup and API](./docs/api.md): supported imports and first-paint preferences.\n- [Foundations](./docs/foundations.md): token roles and visual principles.\n- [Full generated reference](./llms-full.txt): exact API signatures, token conditions and examples.\n\n## Machine-readable references\n\n- [Catalog](./dist/catalog.json): API, locally declared props, tokens, states and examples from this package.\n- [Catalog schema](./schemas/catalog.schema.json): version 1 format.\n\n## Tools\n\n- [Agent skill](./skills/hyeonse-design-system/SKILL.md): task-specific use of this system.\n- [CSS audit](./docs/audit.md): consumer token checks and limitations.\n\nRun the local binary with \`npm exec --no -- hds list\`, then \`npm exec --no -- hds show Button --json\`. In this repository, use \`npm run hds -- list\`. Commands only read the installed package and never fetch or install another package.\n`;
}
