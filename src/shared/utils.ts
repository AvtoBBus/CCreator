import * as vscode from 'vscode';
import type { ComponentInfoType, UserTemplate, UserSnippets, ConfigurationParamKey } from "./types";
import { getValueFromConfig } from '../commands/CreateOrLoadConfiig';
import { validateStructureCore } from '../core';

const supportedLanguages: string[] = ['eng', 'rus'];
const defaultLanguage = 'eng';


export function upperFirstLetter(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
};

export function getHistoryString(infoAboutComponent: ComponentInfoType): string {
    const resultBase = `${infoAboutComponent.framework} (`;
    if (infoAboutComponent.framework === 'react') { return `${resultBase}${infoAboutComponent.componentType} + ${infoAboutComponent.script})`; };
    if (infoAboutComponent.framework === 'angular') { return `${infoAboutComponent.framework}`; };

    return `${resultBase}${infoAboutComponent.script} + ${infoAboutComponent.style})`;
};

export async function getConfigurationParam(paramKey: ConfigurationParamKey): Promise<number | boolean | string | UserTemplate[] | UserSnippets[] | undefined> {
    const configuration = vscode.workspace.getConfiguration('ccreator');
    const tryGetFromConfig = await getValueFromConfig(paramKey);
    const paramValue = tryGetFromConfig !== undefined ? tryGetFromConfig : configuration.get(paramKey);

    if (paramKey === 'historyLength') { return (paramValue ?? 5) as number; };
    if (paramKey === 'userTemplates') { return (paramValue ?? []) as UserTemplate[]; };
    if (paramKey === 'snippets') { return (paramValue ?? []) as UserSnippets[]; };
    if (paramKey === 'showLivePreview') { return (paramValue ?? false) as boolean; };
    if (paramKey === 'useLinter') { return (paramValue ?? false) as boolean; };
    if (paramKey === 'language') { return (paramValue ?? "eng") as string; };
    return undefined;
};

export function showError(text: string) {
    vscode.window.showErrorMessage(text);
};

export async function validateStructure(text: string): Promise<string | undefined> {
    const error = validateStructureCore(text);
    if (!error) {
        return undefined;
    }
    return await getLocalizationText(error.code);
};

export async function formatGeneratedFile(filePath: string) {
    const useLinter = await getConfigurationParam('useLinter') as boolean;

    if (!useLinter) { return; }

    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document, { preview: false });
        await vscode.commands.executeCommand('editor.action.formatDocument');
        await document.save();
    } catch (error) {
        showError(`${await getLocalizationText('errors:linterError')} ${filePath}: ${error}`);
    }
};

export async function getLocalizationText(path: string): Promise<string> {
    const selectedLanguage = await getConfigurationParam('language') as string | undefined;
    // require собирается esbuild в статический glob, поэтому неизвестное значение уронило бы расширение
    const language = supportedLanguages.includes(selectedLanguage ?? '') ? selectedLanguage as string : defaultLanguage;
    const localizationJson = require(`./localization/${language}.json`);

    const getValueByPath = (path: string, obj: Record<string, any>): string | undefined => {
        const keys = path.split(':');
        
        let current: any = obj;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        return current;
    };

    return getValueByPath(path, localizationJson) ?? "";
}