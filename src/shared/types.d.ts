/**
 * Тип описывающий функцию-шаблон, которая возвращает содержимое файла 
 */
export type Template = (fileName: string) => string;


// Типы для результата парсинга

export interface FileNode {
    type: 'file';
    name: string;
    noTemplate: boolean
}

export interface FolderNode {
    type: 'folder';
    name: string;
    children: Node[];
}

export type Node = FileNode | FolderNode;

export type Frameworks = 'svelte' | 'react' | 'vue' | 'angular';
export type Scripts = 'ts' | 'js';
export type Styles = 'scss' | 'less' | 'css';
export type ReactComponentType = 'class' | 'function';

export type ComponentInfoType = {
    framework: Frameworks | null | undefined,
    script: Scripts | undefined,
    style: Styles | undefined,
    componentType?: ReactComponentType
}

export type ContextItem = {
    componentInfo: ComponentInfoType,
    structureString: string
}

export type UserTemplate = {
    templateName: string,
    structureString: string,
    fileContent: Record<string, string>
}