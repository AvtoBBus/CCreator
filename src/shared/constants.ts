export const contextKey = 'CCreator_history_';

export const jsonConfigFile = 'ccreator.config.json';
export const INIT_CONFIG_FILE = 'Создать конфиг-файл';
export const WRITE_CONFIG_FILE = 'Перезаписать текущие конфиг-файл согласно параметрам';
export const baseConfigData = {
    "historyLength": 5,
    "showLivePreview": true,
    "useLinter": true,
    "snippets": [],
    "userTemplates": [
        {
            "templateName": "default",
            "structureString": "Comp.svelte:Comp.vue:Comp.tsx:Comp.jsx:Comp.component.ts",
            "fileContent": {
                "*.svelte": "<script lang='ts'>\n</script>\n\n<div></div>\n\n<style lang='scss'>\n</style>",
                "*.vue": "<template>\n<div>\n\n</div>\n</template>\n<script setup lang='ts'>\nimport { ref } from 'vue'\n\ndefineProps({ })\n</script>\n\n<style scoped lang='scss'}>\n.my-component {\npadding: 20px;\n}\n</style>",
                "*.tsx": "import React from 'react';\n\nconst Comp = () => {\nreturn <>\n</>\n};\n\nexport default Comp",
                "*.jsx": "import React from 'react';\n\nconst Comp = () => {\nreturn <>\n</>\n};\n\nexport default Comp",
                "*.component.ts": "import { Component, Input } from '@angular/core';\n\n@Component({\nselector: 'Comp',\nstandalone: true,\nimports: [],\ntemplate: '<div class='Comp'></div>',\nstyles: []\n})\nexport class Comp {}"
            }
        }
    ]
};