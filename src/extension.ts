import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findSymbolDefinitionLine, pythonPathToFilePath } from './utils';
import { getPythonDefinitionFromLS } from './lsGoToDef'; // your new helper
import { findHydraTargetValue } from './yamlUtils';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('Hydra Target Go-to extension activated.');

    diagnosticCollection = vscode.languages.createDiagnosticCollection('hydraTarget');
    context.subscriptions.push(diagnosticCollection);

    // Definition Provider (unchanged)
    const definitionProvider: vscode.DefinitionProvider = {
        async provideDefinition(document, position, token) {
            // 1) Check if this is a YAML doc and we actually have a hydraTarget
            if (document.languageId !== 'yaml') {
                return undefined;
            }
            // Suppose you have a function findHydraTargetValue(document, position)
            // that returns a dotted path like "torch.optim.lr_scheduler.ReduceLROnPlateau"
            const hydraTarget = findHydraTargetValue(document, position);
            if (!hydraTarget) {
                return undefined;
            }
            // 3) Ask the Python extension to find the real definition(s)
            const locations = await getPythonDefinitionFromLS(hydraTarget);
            if (!locations) {      // Optional: Show an error or add a diagnostic
                vscode.window.showErrorMessage(`No definition found for: ${hydraTarget}`);
                return undefined;
            }

            // 4) You can return the first location or all of them
            //    If multiple definitions exist, you might want to open a peek.
            return locations;
        }
    };


    // Hover Provider (unchanged)
    const hoverProvider: vscode.HoverProvider = {
        async provideHover(document, position, token) {
            // Only handle YAML
            if (document.languageId !== 'yaml') {
                return undefined;
            }
    
            // Extract the Hydra dotted path from your YAML
            const hydraTarget = findHydraTargetValue(document, position);
            if (!hydraTarget) {
                return undefined;
            }
    
            // 1) Get real location(s) via in-memory snippet + Python LS
            const locations = await getPythonDefinitionFromLS(hydraTarget);
            if (!locations || locations.length === 0) {
                // If Python LS can’t find it
                return new vscode.Hover(`**Target not found:** ${hydraTarget}`);
            }
    
            // Typically there's 1 location; if more, pick the first or handle them all
            const loc = locations[0];
    
            // 2) Convert the URI to a local filesystem path
            const filePath = loc.uri.fsPath;
            if (!filePath) {
                return new vscode.Hover(`**Target not found:** ${hydraTarget}`);
            }
    
            // 3) We have a real .py file now. Let’s parse out the docstring, parameters, etc.
            //    In your current code, you do "extractSignature" and "getDocString" – re-use them:
            const symbolName = hydraTarget.split('.').pop() || '';
            // If you want the actual line from `loc.range`, you can do:
            const definitionLineNumber = loc.range.start.line;
    
            // Read the file
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            // Reuse your existing approach to find the signature line. 
            // You can either trust `definitionLineNumber`, or run `findSymbolDefinitionLine(filePath, symbolName)`.
            // In practice, the LS location might point exactly at the definition, so let's do a fresh search:
            const lineNumber = findSymbolDefinitionLine(filePath, symbolName);
    
            // Extract signature
            const parameters = extractSignature(fileContent, symbolName);
    
            // Extract docstring
            const docString = getDocString(filePath, lineNumber);
    
            // 4) Build a Markdown Hover
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**Signature for ${symbolName}:**\n\n`);
    
            if (parameters.length > 0) {
                markdown.appendCodeblock(`(${parameters.join(', ')})`, 'python');
            } else {
                markdown.appendMarkdown('_No parameters detected._');
            }
    
            if (docString) {
                markdown.appendMarkdown(`\n\n**Documentation:**\n\n`);
                markdown.appendMarkdown(docString);
            }
    
            markdown.isTrusted = true;
            return new vscode.Hover(markdown);
        }
    };
    



    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider({ language: 'yaml' }, definitionProvider)
    );
    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ language: 'yaml' }, hoverProvider)
    );

    // Register the new custom command "Copy Target as Hydra"
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.copyTargetAsHydra', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No active editor");
                return;
            }
            if (editor.document.languageId !== 'python') {
                vscode.window.showErrorMessage("This command works only on Python files.");
                return;
            }
            // Get the symbol name from the selection or the word under the cursor.
            const selection = editor.selection;
            const wordRange = editor.document.getWordRangeAtPosition(selection.active, /[A-Za-z_0-9]+/);
            const symbolName = editor.document.getText(selection) || (wordRange && editor.document.getText(wordRange));
            if (!symbolName) {
                vscode.window.showErrorMessage("No symbol selected.");
                return;
            }
            const filePath = editor.document.uri.fsPath;
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if (!workspaceFolder) {
                vscode.window.showErrorMessage("Workspace folder not found.");
                return;
            }
            // Compute the relative file path and convert it to a dotted module path.
            const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
            const modulePath = relativePath
                .replace(/\\/g, '/')
                .replace(/\.py$/, '')
                .split('/')
                .join('.');
            const fullDottedPath = `${modulePath}.${symbolName}`;

            // Read the file content.
            const content = fs.readFileSync(filePath, 'utf8');

            // Extract signature (parameters) from the symbol.
            const parameters = extractSignature(content, symbolName);

            // Optionally, extract documentation.
            const lineNumber = findSymbolDefinitionLine(filePath, symbolName);

            // Build the Hydra YAML snippet.
            let snippet = `_target_: ${fullDottedPath}\n`;
            if (parameters.length > 0) {
                parameters.forEach(param => {
                    snippet += `${param}: \n`;
                });
            } else {
                snippet += `# No parameters detected...\n`;
            }

            // Copy the snippet to the clipboard.
            await vscode.env.clipboard.writeText(snippet);
            vscode.window.showInformationMessage("Hydra config snippet copied to clipboard!");
        })
    );


}

export function deactivate() {
    diagnosticCollection.clear();
    diagnosticCollection.dispose();
}

function addDiagnostic(document: vscode.TextDocument, position: vscode.Position, message: string) {
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_0-9\.]+/);
    if (!range) {
        return;
    }
    // Get existing diagnostics for this file.
    const currentDiagnostics = diagnosticCollection.get(document.uri) || [];
    // Only add the diagnostic if it hasn't already been added.
    if (!currentDiagnostics.some(diag => diag.message === message)) {
        const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diagnosticCollection.set(document.uri, [...currentDiagnostics, diagnostic]);
    }
}



function getDocString(filePath: string, symbolLine: number): string | undefined {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);
        let docStarted = false;
        let docLines: string[] = [];
        let delimiter = '';
        for (let i = symbolLine + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!docStarted && line === '') {
                continue;
            }
            if (!docStarted) {
                if (line.startsWith('"""') || line.startsWith("'''")) {
                    docStarted = true;
                    delimiter = line.startsWith('"""') ? '"""' : "'''";
                    if (line.length > delimiter.length * 2 && line.endsWith(delimiter)) {
                        return line.substring(delimiter.length, line.length - delimiter.length).trim();
                    }
                    docLines.push(line.substring(delimiter.length).trim());
                } else {
                    break;
                }
            } else {
                if (line.endsWith(delimiter)) {
                    docLines.push(line.substring(0, line.length - delimiter.length).trim());
                    break;
                } else {
                    docLines.push(line);
                }
            }
        }
        if (docLines.length > 0) {
            return docLines.join('\n').trim();
        }
    } catch (error) {
        console.error('Error reading file for docstring:', error);
    }
    return undefined;
}

/**
 * Extracts the parameter names from the signature of a class or function.
 * For classes, it looks for the __init__ method.
 * This implementation uses regex to handle multi-line signatures and annotations.
 */
function extractSignature(fileContent: string, symbolName: string): string[] {
    // Try to match a class definition and its __init__ method signature.
    const classRegex = new RegExp(`class\\s+${symbolName}\\b[\\s\\S]*?def\\s+__init__\\(([^)]*)\\):`, 'm');
    let match = fileContent.match(classRegex);
    if (match && match[1]) {
        return processParams(match[1]);
    }
    // If not found, try to match a standalone function definition.
    const funcRegex = new RegExp(`def\\s+${symbolName}\\s*\\(([^)]*)\\):`, 'm');
    match = fileContent.match(funcRegex);
    if (match && match[1]) {
        return processParams(match[1]);
    }
    return [];
}

/**
 * Splits the parameter string into an array, filters out common parameters
 * (like 'self' or 'cls'), and strips default values and annotations.
 */
function processParams(paramStr: string): string[] {
    // Split on commas, and trim each parameter.
    const params = paramStr.split(',').map(p => p.trim());
    // Filter out 'self', 'cls' and empty strings.
    return params.filter(p => p && p !== 'self' && p !== 'cls').map(p => {
        // Remove default values.
        const eqIndex = p.indexOf('=');
        if (eqIndex !== -1) {
            p = p.substring(0, eqIndex).trim();
        }
        // Remove annotations (everything after colon).
        const colonIndex = p.indexOf(':');
        if (colonIndex !== -1) {
            p = p.substring(0, colonIndex).trim();
        }
        return p;
    });
}
