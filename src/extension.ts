import * as vscode from 'vscode';
import { checkForUpdates } from './autoUpdate';
import { createStructure, editUserSnippets, editUserTemplates } from './commands';

export function activate(context: vscode.ExtensionContext) {

    checkForUpdates(context);

    const commands = [
        vscode.commands.registerCommand('ccreator.createStructure', async () => await createStructure(context)),
        vscode.commands.registerCommand('ccreator.editUserTemplates', async () => await editUserTemplates(context)),
        vscode.commands.registerCommand('ccreator.snippets', async () => await editUserSnippets(context)),
    ];

	commands.forEach(c => context.subscriptions.push(c));
}

export function deactivate() {}
