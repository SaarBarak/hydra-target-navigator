// lsGoToDef.ts
import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// If you don't already have a UUID library, install one or make a simple random suffix.
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a short Python snippet in a temp file like:
 *     import llama_index.core.node_parser.text.semantic_splitter as mod
 *     mod.SemanticSplitterNodeParser
 * Then asks the Python language server to run "Go to Definition" on `SemanticSplitterNodeParser`.
 *
 * We never show this file to the user, and we delete it immediately afterwards.
 * If the environment has the module installed, the Python extension returns the real
 * definition location(s).
 */
export async function getPythonDefinitionFromLS(dottedPath: string): Promise<vscode.Location[] | undefined> {
    const parts = dottedPath.split('.');
    if (parts.length < 2) {
        return undefined;
    }

    // The module we import is everything except the last segment:
    const moduleName = parts.slice(0, -1).join('.');
    // The symbol is the last segment:
    const symbolName = parts[parts.length - 1];
    // We'll do: import <moduleName> as mod
    //          mod.<symbolName>
    const aliasName = 'mod';
    const tempPyCode = `import ${moduleName} as ${aliasName}
${aliasName}.${symbolName}
`;

    // Create a temporary .py file in the OS temp directory
    const tempFileName = `hydraDef-${uuidv4()}.py`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    fs.writeFileSync(tempFilePath, tempPyCode, 'utf8');

    try {
        // 1) Open this file as a VS Code document, but do *not* show it in an editor
        const doc = await vscode.workspace.openTextDocument(tempFilePath);

        // 2) Figure out where to place the cursor for "mod.SomeSymbol"
        const symbolLine = 1; // line #1 (0-based) is: "mod.SomeSymbol"
        const lineText = doc.lineAt(symbolLine).text;
        const symbolPos = lineText.indexOf(symbolName);
        if (symbolPos < 0) {
            return undefined;
        }
        const position = new vscode.Position(symbolLine, symbolPos);

        // 3) Ask the built-in Python extension to run "Go to Definition" on that symbol
        const locations = (await vscode.commands.executeCommand(
            'vscode.executeDefinitionProvider',
            doc.uri,
            position
        )) as vscode.Location[] | undefined;

        // Return results if found
        return locations && locations.length > 0 ? locations : undefined;
    } finally {
        // 4) Clean up the temp file so user never sees it
        fs.unlinkSync(tempFilePath);
    }
}
