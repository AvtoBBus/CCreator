import type { FileNode, FolderNode, Node } from '../shared/types';

/** Ошибка парсера */
export class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParseError';
    }
}

/**
 * Парсит строку с описанием структуры папок и файлов.
 * Не зависит от VS Code API.
 *
 * Формат:
 * - `<name|child1:child2>` — папка
 * - `file.ext` — файл
 * - `[A,B,C].ext` — расширение до A.ext, B.ext, C.ext
 * - `!name` — файл без boilerplate
 *
 * @param input — строка структуры
 * @returns массив узлов верхнего уровня
 * @throws ParseError при синтаксической ошибке
 */
export function parseStructureCore(input: string): Node[] {
    let str = input.trim();
    if (str === '') {
        return [];
    }

    let i = 0;

    function parseElements(stopChar?: string): Node[] {
        const result: Node[] = [];

        while (i < str.length && str[i] !== stopChar) {
            if (str[i] === '<') {
                i++;

                let name = '';
                while (i < str.length && str[i] !== '|') {
                    name += str[i];
                    i++;
                }
                if (i >= str.length || str[i] !== '|') {
                    throw new ParseError('Missing "|" in folder syntax: <name|...>');
                }
                i++;

                const children = parseElements('>');
                if (i >= str.length || str[i] !== '>') {
                    throw new ParseError('Missing ">" closing folder tag');
                }
                i++;

                result.push({
                    type: 'folder',
                    name: name.trim(),
                    children,
                } as FolderNode);
            }
            else if (str[i] === '[') {
                i++;

                const files: { name: string; noTemplate: boolean }[] = [];
                while (str[i] !== ']') {
                    let name = '';

                    while (i < str.length && str[i] !== ',' && str[i] !== ']') {
                        name += str[i];
                        i++;
                    }

                    if (str[i] !== ']') {
                        i++;
                    }

                    const noTemplate = name.startsWith('!');
                    files.push({
                        name: noTemplate ? name.trim().slice(1) : name.trim(),
                        noTemplate,
                    });
                }

                i++;

                let ext = '';
                while (i < str.length && str[i] !== ':' && str[i] !== stopChar) {
                    ext += str[i];
                    i++;
                }

                for (const file of files) {
                    result.push({
                        type: 'file',
                        noTemplate: file.noTemplate,
                        name: file.name + ext.trim(),
                    } as FileNode);
                }
            }
            else {
                let name = '';
                while (i < str.length && str[i] !== ':' && str[i] !== stopChar) {
                    name += str[i];
                    i++;
                }
                if (name.trim() === '') {
                    throw new ParseError('Empty file/folder name');
                }
                const noTemplate = name.startsWith('!');
                result.push({
                    type: 'file',
                    name: noTemplate ? name.trim().slice(1) : name.trim(),
                    noTemplate,
                } as FileNode);
            }

            if (i < str.length && str[i] === ':' && str[i] !== stopChar) {
                i++;
            } else if (i < str.length && str[i] === stopChar) {
                break;
            }
        }

        return result;
    }

    const result = parseElements(undefined);
    if (i !== str.length) {
        throw new ParseError('Unexpected trailing characters');
    }
    return result;
}
