import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Convert a Python dotted path (e.g. "src.models.isar.IsarClassifier")
 * into a .py file path within the current workspace
 * (e.g. "<workspace>/src/models/isar.py").
 * Returns `undefined` if the file does not exist or if no workspace is available.
 */
export function pythonPathToFilePath(
  pyPath: string,
  workspace: vscode.WorkspaceFolder | undefined
): string | undefined {
  if (!workspace) {
    return undefined;
  }

  // Split the dotted path: e.g. "src.models.isar.IsarClassifier" 
  // becomes ["src", "models", "isar", "IsarClassifier"].
  const parts = pyPath.split('.');
  if (parts.length < 2) {
    return undefined;
  }

  // Assume the last part is the symbol name; the rest form the module path.
  const moduleParts = parts.slice(0, parts.length - 1);
  const modulePath = path.join(...moduleParts) + '.py';

  const fullPath = path.join(workspace.uri.fsPath, modulePath);
  if (!fs.existsSync(fullPath)) {
    return undefined;
  }

  return fullPath;
}

/**
 * Given a file path and a symbol name, returns the line number where the symbol is defined.
 * It looks for lines starting with `class SymbolName` or `def SymbolName`.
 * Returns 0 (the top of the file) if not found.
 */
export function findSymbolDefinitionLine(filePath: string, symbolName: string): number {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split(/\r?\n/);

  // Naively find the definition line.
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith(`class ${symbolName}`) || trimmed.startsWith(`def ${symbolName}`)) {
      return i; // zero-based index
    }
  }

  // Fallback: return the top of the file.
  return 0;
}
