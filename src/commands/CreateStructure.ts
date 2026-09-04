import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readState, writeState } from '../shared/state';
import { ComponentInfoType, ContextItem, FileNode, FolderNode, Frameworks, Node, ReactComponentType, Scripts, Styles, Template, UserSnippets, UserTemplate } from '../shared/types';
import { templates } from '../templates';
import { formatGeneratedFile, getConfigurationParam, getHistoryString, getLocalizationText, showError, validateStructure } from '../shared/utils';

const CREATE_NEW_FOLDER = "=== CREATE NEW FOLDER ===";
const CREATE_NEW_TEMPLATE = "=== CREATE NEW TEMPLATE ===";

/**
 * Парсит строку с описанием структуры папок и файлов.
 * @param input - строка в формате, описанном выше.
 * @returns массив узлов верхнего уровня.
 * @throws Error при синтаксической ошибке.
 */
export async function parseStructure(input: string): Promise<Node[]> {
    let str = input.trim();
    if (str === '') { return []; }

    const snippets = await getConfigurationParam('snippets') as UserSnippets[];

    if (snippets.length) {
        const results: Record<string, string | number | boolean> = {};
        snippets.forEach(snippet => {
            if (str.includes(`{${snippet.snippetName}}`)) {
                try {
                    results[snippet.snippetName] = eval(snippet.value)();
                } catch (error) { }
            };
        });

        Object.keys(results).forEach(key => {
            str = str.replaceAll(`{${key}}`, results[key].toString());
        });
    }

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
                    throw new Error();
                }
                i++;

                const children = parseElements('>');
                if (i >= str.length || str[i] !== '>') {
                    throw new Error();
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
                    throw new Error();
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
        throw new Error();
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
    showError(await getLocalizationText("errors:readDirError"));
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

function getInfoAboutComponentByFormat(format: string): ComponentInfoType {
    const base = { script: 'ts', style: 'scss' } as Pick<ComponentInfoType, 'style'> & Pick<ComponentInfoType, 'script'>;
    if (format === ".svelte") { return { framework: 'svelte', ...base }; }
    if (format === ".tsx" || format === ".jsx") { return { framework: 'react', ...base, componentType: 'function' }; }
    if (format === ".component.ts") { return { framework: 'angular', ...base }; }

    return { framework: 'svelte', ...base };
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
            await formatGeneratedFile(filePath);
        }
    }
}

async function createFromTreeByTemplate(rootPath: string, nodes: Node[], filesInfo: UserTemplate['fileContent']): Promise<void> {
    for (const node of nodes) {
        const fullPath = path.join(rootPath, node.name);
        const extName = path.extname(fullPath);
        if (node.type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            await createFromTreeByTemplate(fullPath, (node as FolderNode).children, filesInfo);
        } else {
            const hasExtension = extName !== '';
            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            if (!hasExtension) { await fs.writeFile(fullPath, '', 'utf8'); }
            else {
                let lastFound: string | null = null;
                const curFound = Object.keys(filesInfo).find(key => {
                    if (key.startsWith("*.")) {
                        if (extName === key.slice(1) && !lastFound) {
                            lastFound = key;
                            return false;
                        }
                    }
                    else if (node.name === key && !node.noTemplate) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });

                if (!curFound) {
                    if (lastFound) {
                        await fs.writeFile(fullPath, filesInfo[lastFound], 'utf8');
                        await formatGeneratedFile(fullPath);
                    }
                    else {
                        const templateFunction = node.noTemplate ? undefined : getGenerateTemplateFunction(getInfoAboutComponentByFormat(extName));
                        const checkFormatTemplate = node.noTemplate ? undefined : checkFormatAndGetTeplateFunction(extName);
                        const content = !hasExtension ? (templateFunction ? templateFunction(node.name) : '') : (checkFormatTemplate ? checkFormatTemplate(node.name) : '');
                        await fs.writeFile(fullPath, content, 'utf8');
                        await formatGeneratedFile(fullPath);
                    }
                } else {
                        await fs.writeFile(fullPath, filesInfo[curFound], 'utf8');
                        await formatGeneratedFile(fullPath);
                }
            }
        }
    }
}

async function getFramework(): Promise<Frameworks | undefined> {  
    return await vscode.window.showQuickPick(
        ['svelte', 'react', 'vue', 'angular'],
        {
            placeHolder: await getLocalizationText("createStructure:selectFramework"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Frameworks | undefined;
}

async function getScript(): Promise<Scripts | undefined> {  
    return await vscode.window.showQuickPick(
        ['ts', 'js'] as Scripts[],
        {
            placeHolder: await getLocalizationText("createStructure:selectScript"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Scripts | undefined;
}

async function getStyles(): Promise<Styles | undefined> {  
    return await vscode.window.showQuickPick(
        ['scss', 'less', 'css'],
        {
            placeHolder: await getLocalizationText("createStructure:selectStyle"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as Styles | undefined;
}

async function getComponentType(): Promise<ReactComponentType | undefined> {  
    return await vscode.window.showQuickPick(
        ['class', 'function'],
        {
            placeHolder: await getLocalizationText("createStructure:selectComponentType"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as ReactComponentType | undefined;
}

async function selectFromHistory(history: ContextItem[], userTemplates: UserTemplate[]): Promise<string | undefined> {
    let i = 0;
    return await vscode.window.showQuickPick(
        [
            CREATE_NEW_TEMPLATE,
            ...userTemplates.map(item => {
                i++;
                return `${i}: ${item.templateName}`;
            }),
            ...history.map(item => {
                i++;
                return `${i}: ${getHistoryString(item.componentInfo)} - ${item.structureString}`;
            })
        ],
        {
            placeHolder: await getLocalizationText("createStructure:selectFromHistory"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    ) as string | undefined;
};

export async function afterSelectFolder(context: vscode.ExtensionContext, rootPath: string, folderPath: string) {
    const infoAboutComponent: ComponentInfoType = {
        framework: undefined,
        script: undefined,
        style: undefined
    };
    
    const history = readState(context);
    const userTemplates = await getConfigurationParam('userTemplates') as UserTemplate[];

    if (history.length) {
        const selectedFromHistory: string = await selectFromHistory(history, userTemplates) ?? CREATE_NEW_TEMPLATE;

        if (selectedFromHistory !== CREATE_NEW_TEMPLATE) {
            let index = Number.parseInt(selectedFromHistory.split(": ")[0]);
            if (index) {
                index--;
                if (index <= userTemplates.length - 1) {
                    try {
                        const tree = await parseStructure(userTemplates[index].structureString);
                        await createFromTreeByTemplate(path.join(rootPath, folderPath), tree, userTemplates[index].fileContent);
                    } catch (error) {
                        showError(await getLocalizationText("errors:parsingError"));
                        return;
                    } finally {
                        return;
                    }
                } else {
                    index -= userTemplates.length;
                    infoAboutComponent.framework = history[index].componentInfo.framework;
                    infoAboutComponent.script = history[index].componentInfo.script;
                    infoAboutComponent.style = history[index].componentInfo.style;
                    infoAboutComponent.componentType = history[index].componentInfo.componentType;
                    try {
                        const tree = await parseStructure(history[index].structureString);
                        await createFromTree(path.join(rootPath, folderPath), tree, infoAboutComponent);
                    } catch (error) {
                        showError(await getLocalizationText("errors:parsingError"));
                        return;
                    } finally {
                        return;
                    }
                }
            };
        };
    };

    infoAboutComponent.framework = await getFramework();

    if (!infoAboutComponent.framework) {
        showError(await getLocalizationText("errors:needSelectFramework"));
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

    let previewPanel = null;
    if (await getConfigurationParam('showLivePreview')) {
        previewPanel = vscode.window.createWebviewPanel(
            'livePreview',
            await getLocalizationText("createStructure:livePreviewTitle"),
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        const language = await getConfigurationParam('language') as string;
        const htmlPath = path.join(context.extensionPath, `src/shared/WebviewHTML/inputPreview_${language}.html`);
        previewPanel.webview.html = await fs.readFile(htmlPath, 'utf-8');
    }

    const inputBox = vscode.window.createInputBox();
    inputBox.title = await getLocalizationText("createStructure:inputStructureTitle");
    inputBox.placeholder = "<folder1-name|file1:file2:file3>";
    inputBox.ignoreFocusOut = true;

    inputBox.onDidChangeValue(async text => {
        inputBox.validationMessage = await validateStructure(text);

        if (!previewPanel) { return; }
        try {
            const tree = await parseStructure(text);
            previewPanel.webview.postMessage({
                command: 'previewText',
                value: tree
            });
        } catch (error) { }
    });

    inputBox.onDidAccept(async () => {
        inputBox.hide();

        if (!inputBox.value) {
            showError(await getLocalizationText("errors:needInputStructure"));
            return;
        }
        
        try {
            const tree = await parseStructure(inputBox.value);
            await createFromTree(path.join(rootPath, folderPath), tree, infoAboutComponent);
            await writeState(context, { componentInfo: infoAboutComponent, structureString: inputBox.value });
        } catch (err) {
            showError(await getLocalizationText("errors:parsingError"));
            return;
        }

    });

    inputBox.onDidHide(() => {
        inputBox.dispose();
        previewPanel?.dispose();
    });


    inputBox.show();
}

export async function createStructure(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        showError(await getLocalizationText("errors:needSelectDir"));
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    
    let folderPath = '';
    let select = true;

    const createNewFolder = async () => {
        return await vscode.window.showInputBox({
            prompt: await getLocalizationText("createStructure:inputFolderName"),
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
                    placeHolder: await getLocalizationText("createStructure:selectFolder"),
                    canPickMany: false,
                    ignoreFocusOut: true
                }
            );
        }

        if (selectedFolder === CREATE_NEW_FOLDER) {
            select = false;
            selectedFolder = await createNewFolder();
            if (!selectedFolder) {
                showError(await getLocalizationText("errors:needDirName"));
                return;
            }
            folderPath = path.join(folderPath, selectedFolder as string);
        }
        else {
            if (!selectedFolder) {
                showError(await getLocalizationText("errors:needSelectDir"));
                return;
            }
            folderPath = path.join(folderPath, selectedFolder as string);
        }
    }

    await afterSelectFolder(context, rootPath, folderPath);
}