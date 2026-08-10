import * as vscode from 'vscode';
import { ComponentInfoType, UserTemplate } from "./types";

export function upperFirstLetter(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
};

export function getHistoryString(infoAboutComponent: ComponentInfoType): string {
    const resultBase = `${infoAboutComponent.framework} (`
    if (infoAboutComponent.framework === 'react') { return `${resultBase}${infoAboutComponent.componentType} + ${infoAboutComponent.script})`; };
    if (infoAboutComponent.framework === 'angular') { return `${infoAboutComponent.framework}`; };

    return `${resultBase}${infoAboutComponent.script} + ${infoAboutComponent.style})`;
};

export function getConfigurationParam(paramKey: 'historyLength' | 'userTemplates') {
    const configuration = vscode.workspace.getConfiguration('ccreator');
    const paramValue = configuration.get(paramKey);

    if (paramKey === 'historyLength') { return (paramValue ?? 5) as number; };
    if (paramKey === 'userTemplates') { return (paramValue ?? []) as UserTemplate[]; };
}

export function showError(text: string) {
    vscode.window.showErrorMessage(text);
}