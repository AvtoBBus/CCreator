import * as assert from 'assert';
import { validateStructureCore } from '../core';

suite('Validation Tests', () => {

    test('Empty string is valid', () => {
        assert.strictEqual(validateStructureCore(''), null);
        assert.strictEqual(validateStructureCore('   '), null);
    });

    // Угловые скобки
    test('Balance < >: extra closing', () => {
        const result = validateStructureCore('file.txt>');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:angleBalanceBelow');
    });

    test('Balance < >: extra opening', () => {
        const result = validateStructureCore('<folder|file.txt');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:angleBalanceAbove');
    });

    test('Balance < >: balanced is valid', () => {
        assert.strictEqual(validateStructureCore('<folder|file.txt>'), null);
    });

    // Квадратные скобки
    test('Balance []: extra closing', () => {
        const result = validateStructureCore('file.txt]');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:squareBalanceBelow');
    });

    test('Balance []: extra opening', () => {
        const result = validateStructureCore('[file.txt');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:squareBalanceAbove');
    });

    test('Balance []: balanced is valid', () => {
        assert.strictEqual(validateStructureCore('[A,B].ts'), null);
    });

    // Фигурные скобки
    test('Balance {}: extra closing', () => {
        const result = validateStructureCore('file.txt}');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:curlyBalanceBelow');
    });

    test('Balance {}: extra opening', () => {
        const result = validateStructureCore('{YEAR');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:curlyBalanceAbove');
    });

    // Пустые скобки
    test('Empty array []', () => {
        const result = validateStructureCore('[]');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:emptyArray');
    });

    test('Empty snippet {}', () => {
        const result = validateStructureCore('{}');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:emptySnippet');
    });

    // Двойные символы
    test('Double comma ,,', () => {
        const result = validateStructureCore('file1,,file2');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:doubleComma');
    });

    test('Comma before ]', () => {
        const result = validateStructureCore('[A,]');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:commaBeforeSquare');
    });

    test('Comma after [', () => {
        const result = validateStructureCore('[,A]');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:commaAfterSquare');
    });

    // Расширение после ]
    test('Missing dot after ]', () => {
        const result = validateStructureCore('[A,B]ts');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:extentionAfterSquare');
    });

    test('Correct extension after ]', () => {
        assert.strictEqual(validateStructureCore('[A,B].ts'), null);
    });

    // Запятая вне [...]
    test('Comma outside square brackets', () => {
        const result = validateStructureCore('file1,file2');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:commaOutsideSquare');
    });

    // Пересечение скобок
    test('Curly inside square: unclosed curly detected first', () => {
        // {YEAR внутри [...] не закрыта, поэтому curlyBalanceAbove срабатывает раньше enclosureError
        const result = validateStructureCore('[{YEAR,A].ts');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:curlyBalanceAbove');
    });

    // Начало и конец строки
    test('Starts with colon', () => {
        const result = validateStructureCore(':file');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongStart');
    });

    test('Starts with pipe', () => {
        const result = validateStructureCore('|file');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongStart');
    });

    test('Starts with dot', () => {
        const result = validateStructureCore('.file');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongStart');
    });

    test('Starts with comma', () => {
        // commaOutsideSquare срабатывает раньше wrongStart
        const result = validateStructureCore(',file');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:commaOutsideSquare');
    });

    test('Ends with colon', () => {
        const result = validateStructureCore('file:');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongEnd');
    });

    test('Ends with pipe', () => {
        const result = validateStructureCore('file|');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongEnd');
    });

    test('Ends with dot', () => {
        const result = validateStructureCore('file.');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongEnd');
    });

    test('Ends with comma', () => {
        // commaOutsideSquare срабатывает раньше wrongEnd
        const result = validateStructureCore('file,');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:commaOutsideSquare');
    });

    // Двойные разделители
    test('Double colon ::', () => {
        const result = validateStructureCore('file::other');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:squareDots');
    });

    test('Double pipe ||', () => {
        const result = validateStructureCore('file||other');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:doubleVertical');
    });

    // Запрещённые символы
    test('Backslash in name', () => {
        const result = validateStructureCore('file\\name');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongName');
    });

    test('Asterisk in name', () => {
        const result = validateStructureCore('file*name');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongName');
    });

    test('Question mark in name', () => {
        const result = validateStructureCore('file?name');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongName');
    });

    test('Double quote in name', () => {
        const result = validateStructureCore('file"name');
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.code, 'validation:wrongName');
    });

    test('Forbidden chars in snippet are ignored', () => {
        // Внутри {} символы *? не проверяются
        assert.strictEqual(validateStructureCore('{YEAR}'), null);
    });

    // Валидные сложные случаи
    test('Valid: simple structure', () => {
        assert.strictEqual(validateStructureCore('index.ts'), null);
    });

    test('Valid: folder with files', () => {
        assert.strictEqual(validateStructureCore('<src|index.ts:style.css>'), null);
    });

    test('Valid: nested folders', () => {
        assert.strictEqual(validateStructureCore('<project|<src|main.js>:<tests|test.js>>'), null);
    });

    test('Valid: enumeration', () => {
        assert.strictEqual(validateStructureCore('<components|[Header,Footer].svelte>'), null);
    });

    test('Valid: snippet', () => {
        assert.strictEqual(validateStructureCore('Component_{YEAR}.ts'), null);
    });

    test('Valid: mixed structure', () => {
        assert.strictEqual(validateStructureCore('index.ts:<src|[App,main].tsx>'), null);
    });

    test('Valid: noTemplate flag', () => {
        assert.strictEqual(validateStructureCore('<src|!empty.ts:file.ts>'), null);
    });

    test('Valid: deeply nested', () => {
        assert.strictEqual(validateStructureCore('<a|<b|<c|<d|e.ts>>>>'), null);
    });

    test('Valid: multiple enumerations', () => {
        assert.strictEqual(validateStructureCore('<src|[A,B].ts>:<lib|[C,D].js>'), null);
    });
});
