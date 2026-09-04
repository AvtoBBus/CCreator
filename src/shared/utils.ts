import * as vscode from 'vscode';
import type { ComponentInfoType, UserTemplate, UserSnippets, ConfigurationParamKey } from "./types";
import { getValueFromConfig } from '$commands/CreateOrLoadConfiig';

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
    if (!text.trim()) {
        return undefined;
    }

    // 1. Проверка правильного порядка и баланса угловых скобок < >
    let angleBalance = 0;
    let prevChar = '';
    for (const char of text) {
        if (char === '<') {
            angleBalance++;
        } else if (char === '>') {
            angleBalance--;
            if (angleBalance < 0) {
                return await getLocalizationText("validation:angleBalanceBelow");
            }
        }
        prevChar = char;
    }
    if (angleBalance > 0) {
        return await getLocalizationText("validation:angleBalanceAbove");
    }

    // 2. Проверка правильного порядка и баланса квадратных скобок [ ]
    let squareBalance = 0;
    for (const char of text) {
        if (char === '[') { squareBalance++; }
        if (char === ']') { squareBalance--; }
        if (squareBalance < 0) {
            return await getLocalizationText("validation:squareBalanceBelow");
        }
    }
    if (squareBalance > 0) { return await getLocalizationText("validation:squareBalanceAbove"); }

    // 3. Проверка правильного порядка и баланса фигурных скобок { }
    let curlyBalance = 0;
    for (const char of text) {
        if (char === '{') { curlyBalance++; }
        if (char === '}') { curlyBalance--; }
        if (curlyBalance < 0) {
            return await getLocalizationText("validation:curlyBalanceBelow");
        }
    }
    if (curlyBalance > 0) { return await getLocalizationText("validation:curlyBalanceAbove"); }

    // 4. Проверки на пустые скобки и некорректное содержимое
    if (text.includes('[]')) {
        return await getLocalizationText("validation:emptyArray");
    }
    if (text.includes('{}')) {
        return await getLocalizationText("validation:emptySnippet");
    }
    if (text.includes(',,')) { // Общая проверка на двойную запятую
        return await getLocalizationText("validation:doubleComma");
    }
    if (text.includes(',]')) {
        return await getLocalizationText("validation:commaBeforeSquare");
    }
    if (text.includes('[,')) {
        return await getLocalizationText("validation:commaAfterSquare");
    }

    // 5. Проверка синтаксиса перечислений: [file1,file2].ext
    const squareCloseIndex = text.indexOf(']');
    if (squareCloseIndex !== -1 && squareCloseIndex < text.length - 1) {
        if (text[squareCloseIndex + 1] !== '.') {
            return await getLocalizationText("validation:extentionAfterSquare");
        }
    }
    
    // Запятая разрешена ТОЛЬКО внутри квадратных скобок
    const hasCommaOutsideSquare = text.replace(/\[[^\]]*\]/g, '').includes(',');
    if (hasCommaOutsideSquare) {
        return await getLocalizationText("validation:commaOutsideSquare");
    }

    // Проверка на пересечение скобок (например, [index_{YEAR, utils].ts)
    if (/\{[^}]*\]/.test(text)) {
        return await getLocalizationText("validation:enclosureError");
    }

    // 6. Базовые проверки стыков и окончаний строки
    const symbolsCheckStartEnd = [':', '|', '.', ','];
    if (text && symbolsCheckStartEnd.some((s) => { return text.startsWith(s); })) {
        return (await getLocalizationText("validation:wrongStart")) + symbolsCheckStartEnd.join(', ');
    }
    if (text && symbolsCheckStartEnd.some((s) => { return text.endsWith(s); })) {
        return (await getLocalizationText("validation:wrongEnd")) + symbolsCheckStartEnd.join(', ');
    }

    if (text.includes('::')) {
        return await getLocalizationText("validation:squareDots");
    }
    if (text.includes('||')) {
        return await getLocalizationText("validation:doubleVertical");
    }

    // 7. Запрещенные системные символы для имен файлов (ИГНОРИРУЯ содержимое сниппетов)
    const textWithoutSnippets = text.replace(/\{[^}]*\}/g, ''); 
    if (/[\\"*?]/g.test(textWithoutSnippets)) {
        return await getLocalizationText("validation:wrongName");
    }

    return undefined; 
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
        showError(`${getLocalizationText('errors:linterError')} ${filePath}: ${error}`);
    }
};

export async function getLocalizationText(path: string): Promise<string> {
    const selectedLanguage = await getConfigurationParam('language') as string;
    const localizationJson = require(`./localization/${selectedLanguage}.json`);

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