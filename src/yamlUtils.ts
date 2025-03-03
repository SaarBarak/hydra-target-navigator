import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

/**
 * Finds the Hydra `_target_` value (a string like "src.models.isar.IsarClassifier")
 * based on where the user has clicked in the YAML file.
 */
export function findHydraTargetValue(document: vscode.TextDocument, position: vscode.Position): string | undefined {
    const text = document.getText();

    // Parse the entire YAML file.
    let parsed: any;
    try {
        parsed = yaml.load(text);
    } catch (err) {
        return undefined;
    }
    if (typeof parsed !== 'object' || parsed === null) {
        return undefined;
    }

    // Check if the clicked line contains a likely target reference.
    const clickedLineText = document.lineAt(position.line).text;
    if (!clickedLineText.includes('_target_') && !clickedLineText.match(/[A-Za-z_0-9]+\.[A-Za-z_0-9]+/)) {
        return undefined;
    }

    // Recursively search for all _target_ values.
    const allTargets: string[] = [];
    collectTargets(parsed, allTargets);

    if (allTargets.length === 0) {
        return undefined;
    }

    // If only one target is found, return it.
    if (allTargets.length === 1) {
        return allTargets[0];
    }

    // If multiple targets exist, try to match one with the clicked line.
    for (const t of allTargets) {
        if (clickedLineText.includes(t)) {
            return t;
        }
    }

    // Fallback: return the first one.
    return allTargets[0];
}

/**
 * Recursively collects all `_target_` values from the parsed YAML object.
 */
function collectTargets(obj: any, acc: string[]) {
    if (obj && typeof obj === 'object') {
        if (obj['_target_'] && typeof obj['_target_'] === 'string') {
            acc.push(obj['_target_']);
        }
        if (Array.isArray(obj)) {
            for (const item of obj) {
                collectTargets(item, acc);
            }
        } else {
            for (const key of Object.keys(obj)) {
                collectTargets(obj[key], acc);
            }
        }
    }
}
