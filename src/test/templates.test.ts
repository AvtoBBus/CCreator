import * as assert from 'assert';
import { templates } from '../templates';

suite('Templates Tests', () => {

    test('All expected keys exist', () => {
        const expectedKeys = [
            'svelte-ts-scss', 'svelte-ts-less', 'svelte-ts-css',
            'svelte-js-scss', 'svelte-js-less', 'svelte-js-css',
            'react-class', 'react-function',
            'vue-ts-scss', 'vue-ts-less', 'vue-ts-css',
            'vue-js-scss', 'vue-js-less', 'vue-js-css',
            'angular',
        ];
        for (const key of expectedKeys) {
            assert.ok(templates[key], `Template "${key}" is missing`);
        }
    });

    test('Svelte ts-scss contains lang="ts" and lang="scss"', () => {
        const content = templates['svelte-ts-scss']('Comp');
        assert.ok(content.includes('lang="ts"'));
        assert.ok(content.includes('lang="scss"'));
    });

    test('Svelte js-css has no lang attributes', () => {
        const content = templates['svelte-js-css']('Comp');
        assert.ok(!content.includes('lang='));
    });

    test('Svelte ts-less has lang="ts" and lang="less"', () => {
        const content = templates['svelte-ts-less']('Comp');
        assert.ok(content.includes('lang="ts"'));
        assert.ok(content.includes('lang="less"'));
    });

    test('React function component uses fileName', () => {
        const content = templates['react-function']('MyButton');
        assert.ok(content.includes('const MyButton'));
        assert.ok(content.includes('export default MyButton'));
        assert.ok(content.includes('import React'));
    });

    test('React class component uses fileName', () => {
        const content = templates['react-class']('MyButton');
        assert.ok(content.includes('class MyButton extends Component'));
        assert.ok(content.includes('render()'));
    });

    test('Vue ts-scss contains lang="ts" and lang="scss"', () => {
        const content = templates['vue-ts-scss']('MyComp');
        assert.ok(content.includes('lang="ts"'));
        assert.ok(content.includes('lang="scss"'));
        assert.ok(content.includes('<template>'));
    });

    test('Vue js-css has no lang attributes', () => {
        const content = templates['vue-js-css']('MyComp');
        assert.ok(!content.includes('lang='));
    });

    test('Angular component uses fileName', () => {
        const content = templates['angular']('myComp');
        assert.ok(content.includes('@Component'));
        assert.ok(content.includes('export class MyComp'));
        assert.ok(content.includes("selector: 'MyComp'"));
    });

    test('Hello string present in all templates', () => {
        for (const [key, fn] of Object.entries(templates)) {
            const content = fn('Test');
            assert.ok(content.includes('Hello from CCreator!'), `"${key}" missing hello string`);
        }
    });
});
