import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { execSync } from 'child_process';

/**
 * Convert a Python dotted path (e.g. "src.models.isar.IsarClassifier" or "pathlib.Path")
 * into a .py file path.
 *
 * - First, it attempts to locate the file relative to the workspace.
 * - If not found there, it falls back to calling Python (or python3) to import the module
 *   and retrieve its __file__ attribute.
 *
 * Returns `undefined` if the file cannot be found.
 */
export function pythonPathToFilePath(
  pyPath: string,
  workspace: vscode.WorkspaceFolder | undefined
): string | undefined {
  // Optional: if you want fallback resolution even when no workspace is open,
  // you can remove this check.
  let workspacePath: string | undefined;
  if (workspace) {
    workspacePath = workspace.uri.fsPath;
  }

  // Split the dotted path.
  const parts = pyPath.split('.');
  if (parts.length < 2) {
    return undefined;
  }

  // Assume the last part is the symbol name; the rest form the module path.
  const moduleParts = parts.slice(0, parts.length - 1);
  const modulePath = path.join(...moduleParts) + '.py';

  // First, try resolving the module path relative to the workspace.
  if (workspacePath) {
    const localPath = path.join(workspacePath, modulePath);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  }

  // Fallback: use Python to retrieve the module's __file__ attribute.
  const moduleName = moduleParts.join('.');
  
  // Determine which Python command to use. Try the one configured in VS Code first.
  let pythonCommand = 'python';
  const pythonConfig = vscode.workspace.getConfiguration('python');
  const interpreterPath = pythonConfig.get<string>('defaultInterpreterPath');
  if (interpreterPath && interpreterPath.trim() !== '') {
    pythonCommand = interpreterPath;
  }

  // Helper: try to get the module file using the given command.
  function getModuleFile(command: string): string | undefined {
    try {
      const cmd = `${command} -c "import ${moduleName}; print(getattr(${moduleName}, '__file__', ''))"`;
      const output = execSync(cmd, { encoding: 'utf8' }).trim();
      if (output) {
        // Sometimes the returned file is a compiled .pyc.
        if (output.endsWith('.pyc')) {
          const pyFile = output.slice(0, -1);
          return pyFile;
        }
        return output;
      }
    } catch (err) {
      console.error(`Error retrieving module file for ${moduleName} using ${command}:`, err);
    }
    return undefined;
  }

  let moduleFile = getModuleFile(pythonCommand);
  // If not found with the primary command, try 'python3'
  if (!moduleFile) {
    moduleFile = getModuleFile('python3');
  }

  // Optionally, check if the file exists on disk.
  if (moduleFile && fs.existsSync(moduleFile)) {
    return moduleFile;
  }
  // If fs.existsSync returns false, you might still return the moduleFile (if you're confident it exists).
  if (moduleFile) {
    return moduleFile;
  }
  return undefined;
}

/**
 * Given a file path and a symbol name, returns the line number where the symbol is defined.
 * It looks for lines starting with `class SymbolName` or `def SymbolName`.
 * Returns 0 (the top of the file) if not found.
 */
export function findSymbolDefinitionLine(filePath: string, symbolName: string): number {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith(`class ${symbolName}`) || trimmed.startsWith(`def ${symbolName}`)) {
      return i;
    }
  }
  return 0;
}
