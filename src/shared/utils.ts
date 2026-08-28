import * as vscode from 'vscode';
import type { ComponentInfoType, UserTemplate, UserSnippets } from "./types";

export function upperFirstLetter(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
};

export function getHistoryString(infoAboutComponent: ComponentInfoType): string {
    const resultBase = `${infoAboutComponent.framework} (`;
    if (infoAboutComponent.framework === 'react') { return `${resultBase}${infoAboutComponent.componentType} + ${infoAboutComponent.script})`; };
    if (infoAboutComponent.framework === 'angular') { return `${infoAboutComponent.framework}`; };

    return `${resultBase}${infoAboutComponent.script} + ${infoAboutComponent.style})`;
};

export function getConfigurationParam(paramKey: 'historyLength' | 'userTemplates' | 'snippets' | 'showLivePreview') {
    const configuration = vscode.workspace.getConfiguration('ccreator');
    const paramValue = configuration.get(paramKey);

    if (paramKey === 'historyLength') { return (paramValue ?? 5) as number; };
    if (paramKey === 'userTemplates') { return (paramValue ?? []) as UserTemplate[]; };
    if (paramKey === 'snippets') { return paramValue ?? [] as UserSnippets[]; };
    if (paramKey === 'showLivePreview') { return paramValue ?? false as boolean; };
};

export function showError(text: string) {
    vscode.window.showErrorMessage(text);
};

export function validateStructure(text: string): string | undefined {
    if (!text.trim()) {
        return undefined;
    }

    // 1. Проверка правильного порядка и баланса угловых скобок < >
    let angleBalance = 0;
    for (const char of text) {
        if (char === '<') { angleBalance++; }
        if (char === '>') { angleBalance--; }
        if (angleBalance < 0) {
            return '👉 Ошибка: закрывающая ">" идет раньше открывающей "<"';
        }
    }
    if (angleBalance > 0) { return '👉 Ожидается закрывающая скобка ">"'; }

    // 2. Проверка правильного порядка и баланса квадратных скобок [ ]
    let squareBalance = 0;
    for (const char of text) {
        if (char === '[') { squareBalance++; }
        if (char === ']') { squareBalance--; }
        if (squareBalance < 0) {
            return '👉 Ошибка: закрывающая "]" идет раньше открывающей "["';
        }
    }
    if (squareBalance > 0) { return '👉 Ожидается закрывающая скобка "]" для перечисления'; }

    // 3. Проверка правильного порядка и баланса фигурных скобок { }
    let curlyBalance = 0;
    for (const char of text) {
        if (char === '{') { curlyBalance++; }
        if (char === '}') { curlyBalance--; }
        if (curlyBalance < 0) {
            return '👉 Ошибка: закрывающая "}" идет раньше открывающей "{"';
        }
    }
    if (curlyBalance > 0) { return '👉 Ожидается закрывающая скобка "}" для переменной'; }

    // 4. Проверки на пустые скобки и некорректное содержимое
    if (text.includes('[]')) {
        return '👉 Перечисление [...] не может быть пустым';
    }
    if (text.includes('{}')) {
        return '👉 Имя переменной {...} не может быть пустым';
    }
    if (text.includes(', Helen,')) { // Общая проверка на двойную запятую
        return '👉 Обнаружена двойная запятая ",,". Удалите лишнюю';
    }
    if (text.includes(',,')) {
        return '👉 Обнаружена двойная запятая ",,". Удалите лишнюю';
    }
    if (text.includes(',]')) {
        return '👉 Лишняя запятая перед закрывающей квадратной скобкой "]"';
    }
    if (text.includes('[,')) {
        return '👉 Лишняя запятая после открывающей квадратной скобки "["';
    }

    // 5. Проверка синтаксиса перечислений: [file1,file2].ext
    const squareCloseIndex = text.indexOf(']');
    if (squareCloseIndex !== -1 && squareCloseIndex < text.length - 1) {
        if (text[squareCloseIndex + 1] !== '.') {
            return '👉 После закрывающей квадратной скобки "]" должно идти расширение файла (например: .ts)';
        }
    }
    
    // Запятая разрешена ТОЛЬКО внутри квадратных скобок
    const hasCommaOutsideSquare = text.replace(/\[[^\]]*\]/g, '').includes(',');
    if (hasCommaOutsideSquare) {
        return '👉 Запятая "," разрешена только внутри квадратных скобок [file1,file2]';
    }

    // Проверка на пересечение скобок (например, [index_{YEAR, utils].ts)
    if (/\{[^}]*\]/.test(text)) {
        return '👉 Нарушена вложенность: фигурная скобка "{" должна закрыться внутри перечисления';
    }

    // 6. Базовые проверки стыков и окончаний строки
    if (text.startsWith(':') || text.startsWith('|')) {
        return '👉 Строка не может начинаться с символов ":" или "|"';
    }
    if (text.endsWith(':') || text.endsWith('|') || text.endsWith(',')) {
        return '👉 Строка не может заканчиваться на символ ":", "|" или ","';
    }
    if (text.includes('::')) {
        return '👉 Обнаружено двойное двоеточие "::". Удалите лишнее';
    }
    if (text.includes('||')) {
        return '👉 Обнаружен двойной разделитель "||". Удалите лишнее';
    }

    // 7. Запрещенные системные символы для имен файлов (ИГНОРИРУЯ содержимое сниппетов)
    const textWithoutSnippets = text.replace(/\{[^}]*\}/g, ''); 
    if (/[\\"*?]/g.test(textWithoutSnippets)) {
        return '👉 Имя файла или папки содержит запрещенные символы (например: \\, ", *, ?)';
    }

    return undefined; 
};

export async function formatGeneratedFile(filePath: string) {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document, { preview: false });
        await vscode.commands.executeCommand('editor.action.formatDocument');
        await document.save();
    } catch (error) {
        showError(`Ошибка Prettier для файла ${filePath}: ${error}`);
    }
};
