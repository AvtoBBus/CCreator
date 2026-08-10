import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ComponentInfoType, ContextItem, FileNode, FolderNode, Frameworks, Node, ReactComponentType, Scripts, Styles, Template } from './shared/types';
import { templates } from './templates';
import { checkForUpdates } from './autoUpdate';
import { readState, writeState } from './shared/context';
import { getHistoryString } from './shared/utils';

const CREATE_NEW_FOLDER = "=== CREATE NEW FOLDER ===";
const CREATE_NEW_TEMPLATE = "=== CREATE NEW TEMPLATE ===";

/**
 * Парсит строку с описанием структуры папок и файлов.
 * @param input - строка в формате, описанном выше.
 * @returns массив узлов верхнего уровня.
 * @throws Error при синтаксической ошибке.
 */
export function parseStructure(input: string): Node[] {
    const str = input.trim();
    if (str === '') { return []; }

    let i = 0;

    /**
     * Парсит последовательность элементов на текущем уровне вложенности.
     * @param stopChar - символ, при встрече которого парсинг останавливается (для внутренностей папки это '>').
     * @returns массив узлов.
     */
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
                    throw new Error(`Expected '|' after folder name at position ${i}`);
                }
                i++;

                const children = parseElements('>');
                if (i >= str.length || str[i] !== '>') {
                    throw new Error(`Expected '>' at position ${i}`);
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

                let files: FileNode[] = [];
                while (str[i] !== ']') {
                    let name = '';
                    
                    while (i < str.length && str[i] !== ',' && str[i] !== ']') {
                        name += str[i];
                        i++;
                    }

                    if (str[i] !== ']') {
                        i++;
                    }
                    
                    const checkNoTemplate = name.startsWith('!');
                    files.push({
                        type: 'file',
                        name: checkNoTemplate ? name.trim().slice(1) : name.trim(),
                        noTemplate: checkNoTemplate
                    } as FileNode);
                }

                i++;

                let ext = '';
                while (i < str.length && str[i] !== ':' && str[i] !== stopChar) {
                    ext += str[i];
                    i++;
                }

                files.forEach(file => {
                    result.push({
                        type: 'file',
                        noTemplate: file.noTemplate,
                        name: file.name + ext.trim()
                    });
                });

            }
            else {
                let name = '';
                while (i < str.length && str[i] !== ':' && str[i] !== stopChar) {
                    name += str[i];
                    i++;
                }
                if (name.trim() === '') {
                    throw new Error(`Empty file name at position ${i}`);
                }
                const checkNoTemplate = name.startsWith('!');
                result.push({
                    type: 'file',
                    name: checkNoTemplate ? name.trim().slice(1) : name.trim(),
                    noTemplate: checkNoTemplate
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

    // Запускаем парсинг верхнего уровня
    const result = parseElements(undefined);
    if (i !== str.length) {
        throw new Error(`Unexpected character '${str[i]}' at position ${i}`);
    }
    return result;
}

async function getSubdirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (err) {
    console.error('Ошибка чтения директории:', err);
    return [];
  }
}

function getGenerateTemplateFunction(infoAboutComponent: ComponentInfoType): Template | undefined {
    switch (infoAboutComponent.framework) {
        case 'svelte':
        case 'vue':
            return templates[`${infoAboutComponent.framework}-${infoAboutComponent.script}-${infoAboutComponent.style}`];
        case 'react':
            return templates[`${infoAboutComponent.framework}-${infoAboutComponent.componentType}`];
        case 'angular':
            return templates['angular'];
    };
    return undefined;
};

function checkFormatAndGetTeplateFunction(format: string): Template | undefined {
    if (format === '.svelte') { return getGenerateTemplateFunction({ framework: 'svelte', script: 'ts', style: 'scss'}); };
    if (format === '.vue') { return getGenerateTemplateFunction({ framework: 'vue', script: 'ts', style: 'scss'}); };
    if (format === '.react') { return getGenerateTemplateFunction({ framework: 'react', script: 'ts', style: 'scss', componentType: 'function' }); };
    if (format === '.component.ts') { return getGenerateTemplateFunction({ framework: 'angular', script: 'ts', style: 'scss'}); };
    return undefined;
}

function getFileFormat(infoAboutComponent: ComponentInfoType): string {
    switch (infoAboutComponent.framework) {
        case 'svelte':
            return '.svelte';
        case 'vue':
            return '.vue';
        case 'react':
            return '.' + infoAboutComponent.script + 'x';
        case 'angular':
            return '.component.ts';
    };
    return '';
}

async function createFromTree(rootPath: string, nodes: Node[], infoAboutComponent: ComponentInfoType): Promise<void> {
    for (const node of nodes) {
        const fullPath = path.join(rootPath, node.name);
        if (node.type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            await createFromTree(fullPath, (node as FolderNode).children, infoAboutComponent);
        } else {
            const hasExtension = path.extname(fullPath) !== '';
            const filePath = hasExtension ? fullPath : `${fullPath}${getFileFormat(infoAboutComponent)}`;
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            const templateFunction = node.noTemplate ? undefined : getGenerateTemplateFunction(infoAboutComponent);
            const checkFormatTemplate = node.noTemplate ? undefined : checkFormatAndGetTeplateFunction(path.extname(fullPath));
            const content = !hasExtension ? (templateFunction ? templateFunction(node.name) : '') : (checkFormatTemplate ? checkFormatTemplate(node.name) : '');
            await fs.writeFile(filePath, content, 'utf8');
        }
    }
}

async function getFramework(): Promise<Frameworks | undefined> {  
    return await vscode.window.showQuickPick(
        ['svelte', 'react', 'vue', 'angular'],
        {
            placeHolder: 'Выберите фрейморк',
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Frameworks | undefined;
}

async function getScript(): Promise<Scripts | undefined> {  
    return await vscode.window.showQuickPick(
        ['ts', 'js'] as Scripts[],
        {
            placeHolder: 'Выберите язык скрипта (ts - по умолчанию)',
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Scripts | undefined;
}

async function getStyles(): Promise<Styles | undefined> {  
    return await vscode.window.showQuickPick(
        ['scss', 'less', 'css'],
        {
            placeHolder: 'Выберите язык стилей (scss - по умолчанию)',
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Styles | undefined;
}

async function getComponentType(): Promise<ReactComponentType | undefined> {  
    return await vscode.window.showQuickPick(
        ['class', 'function'],
        {
            placeHolder: 'Выберите тип React-компоненты (function - по умолчанию)',
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as ReactComponentType | undefined;
}

async function selectFromHistory(history: ContextItem[]): Promise<string | undefined> {
    return await vscode.window.showQuickPick(
        [
            CREATE_NEW_TEMPLATE,
            ...history.map((item, index) => {
                return `${index + 1}: ${getHistoryString(item.componentInfo)} - ${item.structureString}`;
            })
        ],
        {
            placeHolder: 'Выберите элемент из истории или создайте новый',
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as string | undefined;
};

function showError(text: string) {
    vscode.window.showErrorMessage(text);
}

export function activate(context: vscode.ExtensionContext) {

    checkForUpdates(context);

	const disposable = vscode.commands.registerCommand('ccreator.createStructure', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			showError('Откройте папку проекта');
			return;
		}
		const rootPath = workspaceFolders[0].uri.fsPath;
        
        let folderPath = '';
        let select = true;

        const infoAboutComponent: ComponentInfoType = {
            framework: undefined,
            script: undefined,
            style: undefined
        };

        const createNewFolder = async () => {
            return await vscode.window.showInputBox({
                prompt: 'Введите имя папки',
            });
        };

        while (select) {
            let selectedFolder = null;
		    const folders = await getSubdirectories(folderPath.length ? path.join(rootPath, folderPath) : rootPath );

            if (!folders.length) {
                select = false;
                selectedFolder = await createNewFolder();
            }
            else {
                selectedFolder = await vscode.window.showQuickPick(
                    [CREATE_NEW_FOLDER, ...folders],
                    {
                        placeHolder: 'Выберите папку, в которой необходимо создать компоненту',
                        canPickMany: false,
                        ignoreFocusOut: true
                    }
                );
            }

            if (selectedFolder === CREATE_NEW_FOLDER) {
                select = false;
                selectedFolder = await createNewFolder();
                folderPath = path.join(folderPath, selectedFolder as string);
            }
            else {
                if (!selectedFolder) {
                    showError('Необходимо выбрать папку');
                    return;
                }
                folderPath = path.join(folderPath, selectedFolder as string);
            }
        }

        const history = readState(context);

        if (history.length) {
            const selectedFromHistory: string = await selectFromHistory(history) ?? CREATE_NEW_TEMPLATE;

            if (selectedFromHistory !== CREATE_NEW_TEMPLATE) {
                let index = Number.parseInt(selectedFromHistory.split(": ")[0]);
                if (index) {
                    index--;
                    infoAboutComponent.framework = history[index].componentInfo.framework;
                    infoAboutComponent.script = history[index].componentInfo.script;
                    infoAboutComponent.style = history[index].componentInfo.style;
                    infoAboutComponent.componentType = history[index].componentInfo.componentType;
                    try {
                        const tree = parseStructure(history[index].structureString);
                        await createFromTree(path.join(rootPath, folderPath), tree, infoAboutComponent);
                    } catch (error) {
                        showError('Ошибка парсинга:' + (error as Record<string, unknown>).message);
                        return;
                    } finally {
                        return;
                    }
                };
            };
        };

        infoAboutComponent.framework = await getFramework();

        if (!infoAboutComponent.framework) {
            showError('Необходимо выбрать фреймворк');
            return;
        }

        switch (infoAboutComponent.framework) {
            case 'svelte':
            case 'vue':
                infoAboutComponent.script = await getScript() ?? 'ts';
                infoAboutComponent.style = await getStyles() ?? 'scss';
                break;
            case 'react':
                infoAboutComponent.componentType = await getComponentType() ?? 'function';
                infoAboutComponent.script = await getScript() ?? 'ts';
                break;
            case 'angular':
                break;
        }

		const structureString = await vscode.window.showInputBox({
			prompt: 'Введите структуру',
			placeHolder: 'Пример: <folder1-name|file1:file2:file3>'
		});

		if (!structureString) {
			showError('Необходимо ввести структуру');
			return;
		}

		try {
    		const tree = parseStructure(structureString);
			await createFromTree(path.join(rootPath, folderPath), tree, infoAboutComponent);
            writeState(context, { componentInfo: infoAboutComponent, structureString });
		} catch (err) {
   			showError('Ошибка парсинга:' + (err as Record<string, unknown>).message);
            return;
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
