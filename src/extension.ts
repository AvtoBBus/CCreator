import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

// Типы для результата парсинга
export interface FileNode {
    type: 'file';
    name: string;
}

export interface FolderNode {
    type: 'folder';
    name: string;
    children: Node[];
}

export type Node = FileNode | FolderNode;

/**
 * Парсит строку с описанием структуры папок и файлов.
 * @param input - строка в формате, описанном выше.
 * @returns массив узлов верхнего уровня.
 * @throws Error при синтаксической ошибке.
 */
export function parseStructure(input: string): Node[] {
    const str = input.trim();
    if (str === '') return [];

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
                // === ПАРСИМ ПАПКУ ===
                i++; // пропускаем '<'

                // 1. Имя папки до '|'
                let name = '';
                while (i < str.length && str[i] !== '|') {
                    name += str[i];
                    i++;
                }
                if (i >= str.length || str[i] !== '|') {
                    throw new Error(`Expected '|' after folder name at position ${i}`);
                }
                i++; // пропускаем '|'

                // 2. Содержимое папки до '>'
                const children = parseElements('>');
                if (i >= str.length || str[i] !== '>') {
                    throw new Error(`Expected '>' at position ${i}`);
                }
                i++; // пропускаем '>'

                result.push({
                    type: 'folder',
                    name: name.trim(),
                    children,
                });
            } else {
                // === ПАРСИМ ИМЯ ФАЙЛА ===
                let name = '';
                while (i < str.length && str[i] !== ':' && str[i] !== stopChar) {
                    name += str[i];
                    i++;
                }
                if (name.trim() === '') {
                    throw new Error(`Empty file name at position ${i}`);
                }
                result.push({
                    type: 'file',
                    name: name.trim(),
                });
            }

            // Если следующий символ ':' и мы не на stopChar, пропускаем разделитель
            if (i < str.length && str[i] === ':' && str[i] !== stopChar) {
                i++; // пропускаем ':'
            } else if (i < str.length && str[i] === stopChar) {
                // остановка, не поглощаем stopChar – его обработает вызвавший код
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
    // Читаем содержимое директории с опцией { withFileTypes: true }
    // чтобы получить объекты Dirent, у которых есть метод isDirectory()
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Фильтруем только папки и возвращаем их имена
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (err) {
    console.error('Ошибка чтения директории:', err);
    return [];
  }
}

async function createFromTree(rootPath: string, nodes: Node[], format: string): Promise<void> {
    for (const node of nodes) {
        const fullPath = path.join(rootPath, node.name);
        if (node.type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            await createFromTree(fullPath, node.children, format);
        } else {
            const hasExtension = path.extname(fullPath) !== '';
            await fs.writeFile(!hasExtension ? `${fullPath}.${format}` :  fullPath, '', 'utf8');
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('ccreator.createStructure', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('Откройте папку проекта');
			return;
		}
		const rootPath = workspaceFolders[0].uri.fsPath;


        let folderPath = '';
        let select = true;
        const CREATE_NEW_FOLDER = "CREATE NEW FOLDER";

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
                vscode.window.showInformationMessage(`${selectedFolder}`);
            }

            if (selectedFolder === CREATE_NEW_FOLDER) {
                select = false;
                selectedFolder = await createNewFolder();
                folderPath = path.join(folderPath, selectedFolder as string);
            }
            else folderPath = path.join(folderPath, selectedFolder as string);
        }

        const format = await vscode.window.showQuickPick(
            ['svelte', 'tsx', 'jsx'],
            {
                placeHolder: 'Выберите расширение для основных файлов',
                canPickMany: false,
                ignoreFocusOut: true
            }
        )

        if (!format) {
			vscode.window.showErrorMessage('Необходимо выбрать расширение основных файлов');
            return
        }

		const structureString = await vscode.window.showInputBox({
			prompt: 'Введите структуру',
			placeHolder: 'Пример: <folder1-name|file1:file2:file3>'
		});

		if (!structureString) {
			vscode.window.showErrorMessage('Необходимо ввести строку');
			return;
		}

		try {
    		const tree = parseStructure(structureString);
			await createFromTree(path.join(rootPath, folderPath), tree, format);
		} catch (err) {
   			vscode.window.showErrorMessage('Ошибка парсинга:' + (err as Record<string, unknown>).message);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
