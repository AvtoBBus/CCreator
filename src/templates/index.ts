import type { ReactComponentType, Scripts, Styles, Template } from "../shared/types";
import { upperFirstLetter } from "../shared/utils";

const helloStr = "Hello from CCreator!";

const generateSvelteComp = (script: Scripts, style: Styles) => {
    return `<script${script === 'ts' ? ' lang="ts"' : ''}>
</script>

<div>
    ${helloStr}
</div>

<style${style === 'css' ? '' : ` lang="${style}"`}>
</style>`;
};

const generateReactComponent = (fileName: string, componentType: ReactComponentType) => {
    const componentName = upperFirstLetter(fileName);

    if (componentType === 'class') {
        return `import React, { Component } from 'react';

class ${componentName} extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() { }

    componentWillUnmount() { }

    render() {
        return (
            <div>
                ${helloStr}
            </div>
        );
    }
}

export default MyComponent;`;
    }
    
    return `import React from 'react';

const ${componentName} = () => {
    return <>
        ${helloStr}
    </>
};

export default ${componentName}`;
};

const generateVueComponent = (fileName: string, script: Scripts, style: Styles) => {
    return `<template>
    <div class="${fileName}">
        ${helloStr}
    </div>
</template>

<script setup${script === 'ts' ? ' lang="ts"' : ''}>
    import { ref } from 'vue'

    defineProps({ })
</script>

<style scoped${style === 'css' ? '' : ` lang="${style}"`}>
    .my-component {
        padding: 20px;
    }
</style>`;
};

const generateAngularComponent = (fileName: string) => {
    const componentName = upperFirstLetter(fileName);
    return `import { Component, Input } from '@angular/core';

@Component({
    selector: '${componentName}',
    standalone: true,
    imports: [],
    template: '<div class="${componentName}">${helloStr}</div>',
    styles: []
})
export class ${componentName} {}`; 
};

export const templates: Record<string, Template> = {
    "svelte-ts-scss": () => generateSvelteComp('ts', 'scss'),
    "svelte-ts-less": () => generateSvelteComp('ts', 'less'),
    "svelte-ts-css": () => generateSvelteComp('ts', 'css'),
    "svelte-js-scss": () => generateSvelteComp('js', 'scss'),
    "svelte-js-less": () => generateSvelteComp('js', 'less'),
    "svelte-js-css": () => generateSvelteComp('js', 'css'),

    "react-class": (fileName: string) => generateReactComponent(fileName, 'class'),
    "react-function": (fileName: string) => generateReactComponent(fileName, 'function'),

    'vue-ts-scss': (fileName: string) => generateVueComponent(fileName, 'ts', 'scss'),
    'vue-ts-less': (fileName: string) => generateVueComponent(fileName, 'ts', 'less'),
    'vue-ts-css': (fileName: string) => generateVueComponent(fileName, 'ts', 'css'),
    'vue-js-scss': (fileName: string) => generateVueComponent(fileName, 'js', 'scss'),
    'vue-js-less': (fileName: string) => generateVueComponent(fileName, 'js', 'less'),
    'vue-js-css': (fileName: string) => generateVueComponent(fileName, 'js', 'css'),

    'angular': (fileName: string) => generateAngularComponent(fileName),
};