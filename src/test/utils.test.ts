import * as assert from 'assert';
import { upperFirstLetter, getHistoryString } from '../shared/utils';

suite('Utils Tests', () => {

    test('upperFirstLetter capitalizes first letter', () => {
        assert.strictEqual(upperFirstLetter('hello'), 'Hello');
        assert.strictEqual(upperFirstLetter('world'), 'World');
    });

    test('upperFirstLetter handles single char', () => {
        assert.strictEqual(upperFirstLetter('a'), 'A');
    });

    test('upperFirstLetter handles already uppercase', () => {
        assert.strictEqual(upperFirstLetter('Hello'), 'Hello');
    });

    test('getHistoryString: react', () => {
        const result = getHistoryString({
            framework: 'react',
            script: 'ts',
            style: undefined,
            componentType: 'function',
        });
        assert.strictEqual(result, 'react (function + ts)');
    });

    test('getHistoryString: react class', () => {
        const result = getHistoryString({
            framework: 'react',
            script: 'js',
            style: undefined,
            componentType: 'class',
        });
        assert.strictEqual(result, 'react (class + js)');
    });

    test('getHistoryString: angular', () => {
        const result = getHistoryString({
            framework: 'angular',
            script: undefined,
            style: undefined,
        });
        assert.strictEqual(result, 'angular');
    });

    test('getHistoryString: svelte', () => {
        const result = getHistoryString({
            framework: 'svelte',
            script: 'ts',
            style: 'scss',
        });
        assert.strictEqual(result, 'svelte (ts + scss)');
    });

    test('getHistoryString: vue', () => {
        const result = getHistoryString({
            framework: 'vue',
            script: 'js',
            style: 'less',
        });
        assert.strictEqual(result, 'vue (js + less)');
    });

    test('getHistoryString: null framework', () => {
        const result = getHistoryString({
            framework: null,
            script: undefined,
            style: undefined,
        });
        assert.strictEqual(result, 'null (undefined + undefined)');
    });
});
