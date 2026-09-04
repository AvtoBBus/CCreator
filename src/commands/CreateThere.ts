import * as vscode from 'vscode';
import { afterSelectFolder } from './CreateStructure';
import * as path from 'path';

export async function createThere(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders![0].uri.fsPath;

    await afterSelectFolder(context, rootPath, path.basename(uri.fsPath));
}