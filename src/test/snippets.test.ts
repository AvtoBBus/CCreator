import * as assert from 'assert';
import { applySnippets } from '../core';

suite('Snippets Tests', () => {

    test('No snippets returns same string', () => {
        assert.strictEqual(applySnippets('index.ts', []), 'index.ts');
    });

    test('No matching snippets returns same string', () => {
        assert.strictEqual(applySnippets('index.ts', [{ snippetName: 'YEAR', value: '() => 2024' }]), 'index.ts');
    });

    test('Replaces single snippet', () => {
        const snippets = [{ snippetName: 'YEAR', value: '() => new Date().getFullYear()' }];
        const result = applySnippets('file_{YEAR}.ts', snippets);
        const year = new Date().getFullYear();
        assert.strictEqual(result, `file_${year}.ts`);
    });

    test('Replaces multiple occurrences', () => {
        const snippets = [{ snippetName: 'X', value: '() => "hello"' }];
        assert.strictEqual(applySnippets('{X}:{X}', snippets), 'hello:hello');
    });

    test('Replaces multiple different snippets', () => {
        const snippets = [
            { snippetName: 'FIRST', value: '() => "one"' },
            { snippetName: 'SECOND', value: '() => "two"' },
        ];
        assert.strictEqual(applySnippets('{FIRST}:{SECOND}', snippets), 'one:two');
    });

    test('Invalid snippet expression is skipped', () => {
        const snippets = [{ snippetName: 'BAD', value: 'invalid syntax }' }];
        // eval throws, snippet is not replaced
        assert.strictEqual(applySnippets('file_{BAD}.ts', snippets), 'file_{BAD}.ts');
    });

    test('Snippet returning number is converted to string', () => {
        const snippets = [{ snippetName: 'NUM', value: '() => 42' }];
        assert.strictEqual(applySnippets('file_{NUM}.ts', snippets), 'file_42.ts');
    });

    test('Snippet returning boolean is converted to string', () => {
        const snippets = [{ snippetName: 'FLAG', value: '() => true' }];
        assert.strictEqual(applySnippets('file_{FLAG}.ts', snippets), 'file_true.ts');
    });

    test('Empty string with snippets returns empty string', () => {
        const snippets = [{ snippetName: 'X', value: '() => "val"' }];
        assert.strictEqual(applySnippets('', snippets), '');
    });
});
