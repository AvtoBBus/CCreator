import * as vscode from 'vscode';
import { ContextItem } from './types';
import { getConfigurationParam } from './utils';

const contextKey = 'CCreator_history_';

export function writeState(context: vscode.ExtensionContext, newItem: ContextItem): void {
    let prevState = context.globalState.get<ContextItem[]>(contextKey) ?? [];
    const historyLengthFromParams = getConfigurationParam('historyLength') as number;
    if (prevState.length > historyLengthFromParams) {
        prevState = prevState.slice(0, historyLengthFromParams - 1);
    }
    context.globalState.update(contextKey, [newItem, ...prevState]);
}

export function readState(context: vscode.ExtensionContext): ContextItem[] {
    return context.globalState.get<ContextItem[]>(contextKey) ?? [];
}