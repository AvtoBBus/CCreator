import * as vscode from 'vscode';
import { ContextItem } from './types';

const contextKey = 'CCreator_history_';

export function writeState(context: vscode.ExtensionContext, newItem: ContextItem): void {
    let prevState = context.globalState.get<ContextItem[]>(contextKey) ?? [];
    if (prevState.length > 5) {
        prevState = prevState.slice(0,-1);
    }
    context.globalState.update(contextKey, [newItem, ...prevState]);
}

export function readState(context: vscode.ExtensionContext): ContextItem[] {
    return context.globalState.get<ContextItem[]>(contextKey) ?? [];
}