/** Результат валидации структуры */
export interface ValidationError {
    /** Ключ ошибки (для маппинга на локализованный текст) */
    code: string;
    /** Детали ошибки (если есть) */
    details?: string;
}

/**
 * Валидирует строку структуры.
 * Не зависит от VS Code API и локализации.
 *
 * @param input — строка структуры
 * @returns `null` если валидно, иначе объект ошибки
 */
export function validateStructureCore(input: string): ValidationError | null {
    const text = input.trim();
    if (!text) {
        return null;
    }

    // 1. Баланс угловых скобок < >
    let angleBalance = 0;
    for (const char of text) {
        if (char === '<') {
            angleBalance++;
        } else if (char === '>') {
            angleBalance--;
            if (angleBalance < 0) {
                return { code: 'validation:angleBalanceBelow' };
            }
        }
    }
    if (angleBalance > 0) {
        return { code: 'validation:angleBalanceAbove' };
    }

    // 2. Баланс квадратных скобок [ ]
    let squareBalance = 0;
    for (const char of text) {
        if (char === '[') { squareBalance++; }
        if (char === ']') { squareBalance--; }
        if (squareBalance < 0) {
            return { code: 'validation:squareBalanceBelow' };
        }
    }
    if (squareBalance > 0) {
        return { code: 'validation:squareBalanceAbove' };
    }

    // 3. Баланс фигурных скобок { }
    let curlyBalance = 0;
    for (const char of text) {
        if (char === '{') { curlyBalance++; }
        if (char === '}') { curlyBalance--; }
        if (curlyBalance < 0) {
            return { code: 'validation:curlyBalanceBelow' };
        }
    }
    if (curlyBalance > 0) {
        return { code: 'validation:curlyBalanceAbove' };
    }

    // 4. Пустые скобки и некорректное содержимое
    if (text.includes('[]')) {
        return { code: 'validation:emptyArray' };
    }
    if (text.includes('{}')) {
        return { code: 'validation:emptySnippet' };
    }
    if (text.includes(',,')) {
        return { code: 'validation:doubleComma' };
    }
    if (text.includes(',]')) {
        return { code: 'validation:commaBeforeSquare' };
    }
    if (text.includes('[,')) {
        return { code: 'validation:commaAfterSquare' };
    }

    // 5. Расширение после ] должно начинаться с точки
    const squareCloseIndex = text.indexOf(']');
    if (squareCloseIndex !== -1 && squareCloseIndex < text.length - 1) {
        if (text[squareCloseIndex + 1] !== '.') {
            return { code: 'validation:extentionAfterSquare' };
        }
    }

    // 6. Запятая только внутри [...]
    const hasCommaOutsideSquare = text.replace(/\[[^\]]*\]/g, '').includes(',');
    if (hasCommaOutsideSquare) {
        return { code: 'validation:commaOutsideSquare' };
    }

    // 7. Пересечение скобок {... внутри [...]}
    if (/\{[^}]*\]/.test(text)) {
        return { code: 'validation:enclosureError' };
    }

    // 8. Начало и конец строки
    const forbiddenStartEnd = [':', '|', '.', ','];
    for (const s of forbiddenStartEnd) {
        if (text.startsWith(s)) {
            return { code: 'validation:wrongStart', details: s };
        }
        if (text.endsWith(s)) {
            return { code: 'validation:wrongEnd', details: s };
        }
    }

    // 9. Двойные разделители
    if (text.includes('::')) {
        return { code: 'validation:squareDots' };
    }
    if (text.includes('||')) {
        return { code: 'validation:doubleVertical' };
    }

    // 10. Запрещённые символы в именах (игнорируя сниппеты)
    const textWithoutSnippets = text.replace(/\{[^}]*\}/g, '');
    if (/[\\"*?]/g.test(textWithoutSnippets)) {
        return { code: 'validation:wrongName' };
    }

    return null;
}
