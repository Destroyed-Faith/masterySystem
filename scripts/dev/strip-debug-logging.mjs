#!/usr/bin/env node
/**
 * Remove dedicated debug/trace call statements under src/ via ts-morph.
 *
 * Deletes ExpressionStatements for known debug callees. Nested snapshot builders
 * inside debug payloads are not preserved (they were diagnostic-only).
 * Also removes if-statements that become debug-only after stripping.
 */
import { Project, SyntaxKind, Node } from 'ts-morph';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const project = new Project({
  tsConfigFilePath: join(root, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(join(root, 'src/**/*.ts'));

const DEBUG_CALLEES = new Set([
  'log.debug',
  'log.info',
  'logCombatTrace',
  'logInitiativeOrderDebug',
  'logDrDebug',
  'logActorItemSummary',
  'dlogStoneDnD',
  'dlogStoneReturn',
  'dlogStoneWave',
  'dlogStoneLanes',
  'dlogStonePayment',
]);

function calleeKey(call) {
  const expr = call.getExpression();
  if (Node.isIdentifier(expr)) return expr.getText();
  if (Node.isPropertyAccessExpression(expr)) {
    return `${expr.getExpression().getText()}.${expr.getName()}`;
  }
  return null;
}

function isDebugCallExpression(expr) {
  if (!Node.isCallExpression(expr)) return false;
  const key = calleeKey(expr);
  return key != null && DEBUG_CALLEES.has(key);
}

function isDebugOnlyStatement(stmt) {
  if (!stmt || stmt.wasForgotten?.()) return true;
  if (Node.isExpressionStatement(stmt)) {
    return isDebugCallExpression(stmt.getExpression());
  }
  if (Node.isBlock(stmt)) {
    const body = stmt.getStatements();
    if (body.length === 0) return true;
    return body.every((s) => isDebugOnlyStatement(s));
  }
  if (Node.isIfStatement(stmt)) {
    return (
      isDebugOnlyStatement(stmt.getThenStatement()) &&
      isDebugOnlyStatement(stmt.getElseStatement())
    );
  }
  return false;
}

function removeDebugOnlyIfs(sourceFile) {
  let removed = 0;
  let changed = true;
  while (changed) {
    changed = false;
    const ifs = sourceFile
      .getDescendantsOfKind(SyntaxKind.IfStatement)
      .sort((a, b) => b.getStart() - a.getStart());
    for (const ifStmt of ifs) {
      if (ifStmt.wasForgotten()) continue;
      if (!isDebugOnlyStatement(ifStmt)) continue;
      ifStmt.remove();
      removed += 1;
      changed = true;
      break;
    }
  }
  return removed;
}

function removeDebugCallStatements(sourceFile) {
  let removed = 0;
  let changed = true;
  while (changed) {
    changed = false;
    const stmts = sourceFile
      .getDescendantsOfKind(SyntaxKind.ExpressionStatement)
      .filter((stmt) => !stmt.wasForgotten() && isDebugCallExpression(stmt.getExpression()))
      .sort((a, b) => b.getStart() - a.getStart());

    for (const stmt of stmts) {
      if (stmt.wasForgotten()) continue;
      const parent = stmt.getParent();
      if (Node.isIfStatement(parent) && isDebugOnlyStatement(parent)) {
        parent.remove();
        removed += 1;
        changed = true;
        break;
      }
      stmt.remove();
      removed += 1;
      changed = true;
      break;
    }
  }
  return removed;
}

function cleanImports(sourceFile) {
  for (const imp of [...sourceFile.getImportDeclarations()]) {
    if (imp.wasForgotten()) continue;
    const spec = imp.getModuleSpecifierValue().replace(/\\/g, '/');
    if (/logger\.js$|debug-helpers\.js$|combat-trace-debug\.js$|dr-debug\.js$/.test(spec)) {
      imp.remove();
    }
  }

  const dropNames = new Set([
    'log',
    'logCombatTrace',
    'logInitiativeOrderDebug',
    'logDrDebug',
    'logActorItemSummary',
    'buildCombatTurnSnapshot',
    'buildCombatantsIteratorOrder',
  ]);

  for (const imp of [...sourceFile.getImportDeclarations()]) {
    if (imp.wasForgotten()) continue;
    for (const n of [...imp.getNamedImports()]) {
      const name = n.getName();
      if (!dropNames.has(name)) continue;
      const refs = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).filter((id) => {
        if (id.wasForgotten() || id.getText() !== name) return false;
        if (Node.isImportSpecifier(id.getParent())) return false;
        return true;
      });
      if (refs.length === 0) n.remove();
    }
    if (
      !imp.wasForgotten() &&
      imp.getNamedImports().length === 0 &&
      !imp.getDefaultImport() &&
      !imp.getNamespaceImport()
    ) {
      imp.remove();
    }
  }
}

function removeEmptyLocalFunctions(sourceFile) {
  let removed = 0;
  for (const fn of [...sourceFile.getFunctions()]) {
    if (fn.wasForgotten() || fn.isExported()) continue;
    const body = fn.getBody();
    if (!body || !Node.isBlock(body)) continue;
    if (body.getStatements().length !== 0) continue;
    const name = fn.getName();
    if (!name) continue;
    for (const c of sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const e = call.getExpression();
        return Node.isIdentifier(e) && e.getText() === name;
      })
      .sort((a, b) => b.getStart() - a.getStart())) {
      const stmt = c.getParent();
      if (Node.isExpressionStatement(stmt)) stmt.remove();
    }
    if (!fn.wasForgotten()) fn.remove();
    removed += 1;
  }
  return removed;
}

let totalRemoved = 0;
let filesTouched = 0;

for (const sf of project.getSourceFiles()) {
  const before = sf.getFullText();
  let removed = 0;
  removed += removeDebugOnlyIfs(sf);
  removed += removeDebugCallStatements(sf);
  removed += removeDebugOnlyIfs(sf);
  removed += removeEmptyLocalFunctions(sf);
  cleanImports(sf);
  if (sf.getFullText() !== before) {
    filesTouched += 1;
    totalRemoved += removed;
  }
}

await project.save();
console.log(`strip-debug-logging: removed ${totalRemoved} debug constructs across ${filesTouched} files`);
