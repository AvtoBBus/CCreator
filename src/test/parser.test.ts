import * as assert from 'assert';
import { parseStructureCore, ParseError } from '../core';

suite('Parser Tests', () => {

    test('Empty string returns empty array', () => {
        assert.deepStrictEqual(parseStructureCore(''), []);
        assert.deepStrictEqual(parseStructureCore('   '), []);
    });

    test('Single file without extension', () => {
        const result = parseStructureCore('index');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].type, 'file');
        assert.strictEqual((result[0] as any).name, 'index');
        assert.strictEqual((result[0] as any).noTemplate, false);
    });

    test('Single file with extension', () => {
        const result = parseStructureCore('index.ts');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].type, 'file');
        assert.strictEqual((result[0] as any).name, 'index.ts');
    });

    test('NoTemplate flag', () => {
        const result = parseStructureCore('!empty');
        assert.strictEqual(result.length, 1);
        assert.strictEqual((result[0] as any).name, 'empty');
        assert.strictEqual((result[0] as any).noTemplate, true);
    });

    test('Multiple files separated by colon', () => {
        const result = parseStructureCore('file1:file2:file3');
        assert.strictEqual(result.length, 3);
        assert.strictEqual((result[0] as any).name, 'file1');
        assert.strictEqual((result[1] as any).name, 'file2');
        assert.strictEqual((result[2] as any).name, 'file3');
    });

    test('Single folder', () => {
        const result = parseStructureCore('<src|index.ts>');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].type, 'folder');
        assert.strictEqual((result[0] as any).name, 'src');
        assert.strictEqual((result[0] as any).children.length, 1);
    });

    test('Folder with multiple files', () => {
        const result = parseStructureCore('<src|index.ts:style.css>');
        assert.strictEqual(result.length, 1);
        const folder = result[0] as any;
        assert.strictEqual(folder.type, 'folder');
        assert.strictEqual(folder.children.length, 2);
        assert.strictEqual(folder.children[0].name, 'index.ts');
        assert.strictEqual(folder.children[1].name, 'style.css');
    });

    test('Nested folders', () => {
        const result = parseStructureCore('<project|<src|main.js>:<tests|test.js>>');
        assert.strictEqual(result.length, 1);
        const project = result[0] as any;
        assert.strictEqual(project.name, 'project');
        assert.strictEqual(project.children.length, 2);
        assert.strictEqual(project.children[0].name, 'src');
        assert.strictEqual(project.children[1].name, 'tests');
    });

    test('Enumeration [A,B].ext', () => {
        const result = parseStructureCore('<components|[Header,Footer].svelte>');
        assert.strictEqual(result.length, 1);
        const folder = result[0] as any;
        assert.strictEqual(folder.children.length, 2);
        assert.strictEqual(folder.children[0].name, 'Header.svelte');
        assert.strictEqual(folder.children[1].name, 'Footer.svelte');
    });

    test('NoTemplate in enumeration', () => {
        const result = parseStructureCore('<src|[!empty,normal].ts>');
        const folder = result[0] as any;
        assert.strictEqual(folder.children.length, 2);
        // noTemplate убирает boilerplate, но расширение добавляется ко всем
        assert.strictEqual(folder.children[0].name, 'empty.ts');
        assert.strictEqual(folder.children[0].noTemplate, true);
        assert.strictEqual(folder.children[1].name, 'normal.ts');
        assert.strictEqual(folder.children[1].noTemplate, false);
    });

    test('Mixed folders and files at root level', () => {
        const result = parseStructureCore('index.ts:<lib|helper.ts>');
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].type, 'file');
        assert.strictEqual(result[1].type, 'folder');
    });

    test('Error: missing closing |', () => {
        assert.throws(() => parseStructureCore('<src index.ts>'), ParseError);
    });

    test('Error: missing closing >', () => {
        assert.throws(() => parseStructureCore('<src|index.ts'), ParseError);
    });

    test('Error: empty name', () => {
        assert.throws(() => parseStructureCore(':file'), ParseError);
    });

    test('Error: trailing characters', () => {
        // Пробел не является разделителем, поэтому "file.txt extra" — одно имя файла
        const result = parseStructureCore('file.txt extra');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].type, 'file');
        assert.strictEqual((result[0] as any).name, 'file.txt extra');
    });

    test('Three levels of nesting', () => {
        const result = parseStructureCore('<a|<b|<c|deep.ts>>>');
        const level1 = result[0] as any;
        const level2 = level1.children[0] as any;
        const level3 = level2.children[0] as any;
        assert.strictEqual(level1.name, 'a');
        assert.strictEqual(level2.name, 'b');
        assert.strictEqual(level3.name, 'c');
        assert.strictEqual(level3.children[0].name, 'deep.ts');
    });

    test('Complex mixed structure', () => {
        const input = '<src|index.ts:<components|[App,Header].tsx>>';
        const result = parseStructureCore(input);
        assert.strictEqual(result.length, 1);
        const src = result[0] as any;
        assert.strictEqual(src.name, 'src');
        assert.strictEqual(src.children.length, 2);
        assert.strictEqual(src.children[0].name, 'index.ts');
        assert.strictEqual(src.children[1].name, 'components');
        assert.strictEqual(src.children[1].children.length, 2);
        assert.strictEqual(src.children[1].children[0].name, 'App.tsx');
        assert.strictEqual(src.children[1].children[1].name, 'Header.tsx');
    });

    test('Empty folder is valid', () => {
        const result = parseStructureCore('<empty|>');
        assert.strictEqual(result.length, 1);
        const folder = result[0] as any;
        assert.strictEqual(folder.name, 'empty');
        assert.strictEqual(folder.children.length, 0);
    });

    test('Whitespace in names is trimmed', () => {
        const result = parseStructureCore('<  src  |  index.ts  >');
        assert.strictEqual((result[0] as any).name, 'src');
        assert.strictEqual((result[0] as any).children[0].name, 'index.ts');
    });
});
