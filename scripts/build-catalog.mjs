import { existsSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import catalogMetadata from '../metadata/catalog.mjs';

function fail(message) {
  throw new Error(`catalog: ${message}`);
}

function read(root, path) {
  const absolute = resolve(root, path);
  if (relative(root, absolute).startsWith('..')) fail(`path escapes package: ${path}`);
  if (!existsSync(absolute)) fail(`missing file: ${path}`);
  return readFileSync(absolute, 'utf8');
}

function exportNamesFromJavaScript(source, path) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (file.parseDiagnostics.length) fail(`invalid JavaScript: ${path}`);
  const names = [];
  for (const statement of file.statements) {
    const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
        fail(`unsupported JavaScript re-export in ${path}`);
      }
      names.push(...statement.exportClause.elements.map(element => element.name.text));
    } else if (exported && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) fail(`unsupported JavaScript export binding in ${path}`);
        names.push(declaration.name.text);
      }
    } else if (exported && (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement))) {
      if (!statement.name) fail(`unnamed JavaScript export in ${path}`);
      names.push(statement.name.text);
    } else if (exported || ts.isExportAssignment(statement)) {
      fail(`unsupported JavaScript export in ${path}`);
    }
  }
  if (new Set(names).size !== names.length) fail(`duplicate JavaScript export in ${path}`);
  return names;
}

function declarationText(declaration, sourceFile) {
  if (ts.isVariableDeclaration(declaration) && ts.isVariableDeclarationList(declaration.parent)) {
    return declaration.parent.parent.getText(sourceFile);
  }
  return declaration.getText(sourceFile);
}

function declarationExports(root, paths) {
  const absolutePaths = paths.map(path => resolve(root, path));
  const program = ts.createProgram(absolutePaths, {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    noEmit: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(diagnostic =>
    diagnostic.file && absolutePaths.includes(resolve(diagnostic.file.fileName)));
  if (diagnostics.length) fail(`invalid declaration: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, '\n')}`);
  const checker = program.getTypeChecker();
  return paths.map((path, index) => {
    const sourceFile = program.getSourceFile(absolutePaths[index]);
    if (!sourceFile) fail(`declaration unavailable: ${path}`);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) fail(`not a declaration module: ${path}`);
    const symbols = checker.getExportsOfModule(moduleSymbol);
    const exports = symbols.map(symbol => {
      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      const declarations = target.getDeclarations()?.filter(declaration => declaration.getSourceFile() === sourceFile) ?? [];
      if (!declarations.length) fail(`cannot locate declaration for ${symbol.name} in ${path}`);
      const kind = target.flags & ts.SymbolFlags.Value ? 'value' : target.flags & ts.SymbolFlags.Type ? 'type' : null;
      if (!kind) fail(`unsupported declaration kind for ${symbol.name} in ${path}`);
      return {
        name: symbol.name,
        kind,
        signature: declarations.map(declaration => declarationText(declaration, sourceFile)).join('\n'),
        position: declarations[0].getStart(sourceFile),
        declaration: declarations.find(ts.isFunctionDeclaration),
        sourceFile,
      };
    }).sort((a, b) => a.position - b.position);
    return { path, sourceFile, exports, checker };
  });
}

function reactProps(declaration, checker) {
  if (!declaration || !declaration.parameters.length) fail('React entry must have a declared props parameter');
  const parameter = declaration.parameters[0];
  const type = checker.getTypeAtLocation(parameter);
  const properties = checker.getPropertiesOfType(type);
  if (!properties.length) fail(`React props unavailable for ${declaration.name?.text}`);
  return properties.map(property => ({
    name: property.name,
    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(property, parameter), parameter, ts.TypeFormatFlags.NoTruncation),
    required: !(property.flags & ts.SymbolFlags.Optional),
  }));
}

function splitDeclarations(body, context) {
  const result = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === '{' || char === '}' || depth < 0) fail(`unhandled CSS syntax in ${context}`);
    else if (char === ';' && depth === 0) {
      result.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }
  if (quote || depth !== 0) fail(`unclosed CSS value in ${context}`);
  if (body.slice(start).trim()) result.push(body.slice(start).trim());
  return result.filter(Boolean);
}

export function parseTokenCss(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (withoutComments.includes('/*') || withoutComments.includes('*/')) fail('unclosed CSS comment');
  const tokens = new Map();
  const selectorPattern = /^:root(?:\[data-(?:theme|accent|density|corners)='[a-z]+'\]|:not\(\[data-theme\]\))*$/;

  function parseRules(input, media = null) {
    let position = 0;
    while (position < input.length) {
      while (/\s/.test(input[position] ?? '') && position < input.length) position++;
      if (position >= input.length) break;
      const open = input.indexOf('{', position);
      if (open < 0) fail('CSS rule missing opening brace');
      const header = input.slice(position, open).trim();
      if (!header || /[{};]/.test(header)) fail(`invalid CSS rule: ${header}`);
      let depth = 1;
      let close = open + 1;
      let quote = null;
      for (; close < input.length && depth > 0; close++) {
        const char = input[close];
        if (quote) {
          if (char === '\\') close++;
          else if (char === quote) quote = null;
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '{') depth++;
        else if (char === '}') depth--;
      }
      if (depth !== 0) fail(`CSS rule missing closing brace: ${header}`);
      const body = input.slice(open + 1, close - 1);
      if (header.startsWith('@')) {
        if (media || !/^@media \([^{};]+\)$/.test(header)) fail(`unhandled CSS at-rule: ${header}`);
        parseRules(body, header.slice('@media '.length));
      } else {
        if (!selectorPattern.test(header)) fail(`unhandled CSS selector: ${header}`);
        for (const declaration of splitDeclarations(body, header)) {
          const colon = declaration.indexOf(':');
          if (colon < 1) fail(`invalid CSS declaration in ${header}: ${declaration}`);
          const name = declaration.slice(0, colon).trim();
          const value = declaration.slice(colon + 1).trim();
          if (!value) fail(`empty CSS value for ${name}`);
          if (name === 'color-scheme') continue;
          if (!/^--[a-z][a-z0-9-]*$/.test(name)) fail(`unhandled CSS declaration: ${name}`);
          if (!tokens.has(name)) tokens.set(name, { name, value: null, overrides: [] });
          const token = tokens.get(name);
          if (header === ':root' && media === null) {
            if (token.value !== null) fail(`duplicate base token: ${name}`);
            token.value = value;
          } else {
            if (token.overrides.some(override => override.selector === header && override.media === media)) {
              fail(`duplicate token override: ${name} in ${header}`);
            }
            token.overrides.push({ selector: header, media, value });
          }
        }
      }
      position = close;
    }
  }

  parseRules(withoutComments);
  for (const token of tokens.values()) if (token.value === null) fail(`token has no base :root value: ${token.name}`);
  return [...tokens.values()];
}

function validateCoverage(actual, authored, noun) {
  const actualSet = new Set(actual);
  const authoredSet = new Set(authored);
  if (actualSet.size !== actual.length) fail(`duplicate ${noun}`);
  if (authoredSet.size !== authored.length) fail(`duplicate authored ${noun}`);
  const missing = actual.filter(name => !authoredSet.has(name));
  const stale = authored.filter(name => !actualSet.has(name));
  if (missing.length || stale.length) fail(`${noun} metadata mismatch (missing: ${missing.join(', ') || 'none'}; stale: ${stale.join(', ') || 'none'})`);
}

function resolveSource(root, jsPath) {
  const normalized = jsPath.startsWith('./') ? jsPath.slice(2) : jsPath;
  if (!normalized.startsWith('dist/') || !normalized.endsWith('.js')) fail(`unexpected module path: ${jsPath}`);
  const stem = normalized.slice('dist/'.length, -'.js'.length);
  const candidates = [`src/${stem}.ts`, `src/${stem}.tsx`].filter(path => existsSync(join(root, path)));
  if (candidates.length !== 1) fail(`cannot resolve one source for ${jsPath}`);
  return candidates[0];
}

const languageByExtension = { '.ts': 'typescript', '.tsx': 'tsx', '.css': 'css', '.html': 'html' };

/** Build a JSON-safe catalog from the package's shipped declarations, JS, CSS and examples. */
export function buildCatalog(root, metadata = catalogMetadata) {
  root = resolve(root);
  const packageInfo = JSON.parse(read(root, 'package.json'));
  if (typeof packageInfo.name !== 'string' || typeof packageInfo.version !== 'string') fail('package name/version missing');
  const publicModules = Object.entries(packageInfo.exports).filter(([, target]) =>
    target && typeof target === 'object' && typeof target.types === 'string' && typeof target.default === 'string');
  if (!publicModules.length) fail('no public JavaScript modules');
  const declarationPaths = publicModules.map(([, target]) => target.types.startsWith('./') ? target.types.slice(2) : target.types);
  for (const path of declarationPaths) read(root, path);
  const parsedDeclarations = declarationExports(root, declarationPaths);
  const modules = [];
  const runtimeEntries = [];
  for (let index = 0; index < publicModules.length; index++) {
    const [subpath, target] = publicModules[index];
    const jsPath = target.default.startsWith('./') ? target.default.slice(2) : target.default;
    const source = resolveSource(root, jsPath);
    read(root, source);
    const runtimeNames = exportNamesFromJavaScript(read(root, jsPath), jsPath);
    const parsed = parsedDeclarations[index];
    const declaredValues = parsed.exports.filter(item => item.kind === 'value').map(item => item.name);
    validateCoverage(runtimeNames, declaredValues, `runtime/declaration exports for ${subpath}`);
    const importPath = `${packageInfo.name}/${subpath.startsWith('./') ? subpath.slice(2) : subpath}`;
    modules.push({
      subpath, importPath, source, declarations: read(root, parsed.path),
      exports: parsed.exports.map(({ name, kind, signature }) => ({ name, kind, signature })),
    });
    for (const item of parsed.exports.filter(item => item.kind === 'value')) {
      runtimeEntries.push({ item, importPath, source, checker: parsed.checker });
    }
  }
  validateCoverage(runtimeEntries.map(({ item }) => item.name), Object.keys(metadata.entries), 'runtime entries');
  const examples = metadata.examples.map(example => ({
    id: example.id,
    description: example.description,
    files: example.files.map(path => {
      const language = languageByExtension[extname(path)];
      if (!language) fail(`unknown example language: ${path}`);
      return { path, language, code: read(root, path) };
    }),
  }));
  const exampleIds = new Set(examples.map(example => example.id));
  if (exampleIds.size !== examples.length) fail('duplicate example ID');
  const entries = runtimeEntries.map(({ item, importPath, source, checker }) => {
    const authored = metadata.entries[item.name];
    if (!['component', 'provider', 'hook', 'utility'].includes(authored.kind)) fail(`invalid entry kind: ${item.name}`);
    for (const id of authored.examples) if (!exampleIds.has(id)) fail(`unknown example ${id} for ${item.name}`);
    const entry = {
      id: item.name, kind: authored.kind, summary: authored.summary, importPath, source,
      signature: item.signature,
      usage: authored.usage, states: authored.states, accessibility: authored.accessibility,
      limitations: authored.limitations, examples: authored.examples, keywords: authored.keywords,
    };
    if (authored.kind === 'component' || authored.kind === 'provider') entry.props = reactProps(item.declaration, checker);
    return entry;
  });
  const tokens = parseTokenCss(read(root, 'src/tokens.css'));
  validateCoverage(tokens.map(token => token.name), Object.keys(metadata.tokenRoles), 'token roles');
  for (const token of tokens) token.role = metadata.tokenRoles[token.name];
  return {
    schemaVersion: 1,
    package: { name: packageInfo.name, version: packageInfo.version },
    boundaries: metadata.boundaries,
    setup: metadata.setup,
    modules, entries, tokens: tokens.map(({ name, role, value, overrides }) => ({ name, role, value, overrides })),
    examples,
  };
}
