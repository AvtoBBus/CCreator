import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkForUpdates(context: vscode.ExtensionContext) {
    const currentVersion = context.extension.packageJSON.version;
    const repo = 'AvtoBBus/CCreator';

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        const release = await response.json() as Record<string, unknown>;
        const latestVersion = (release.tag_name as string).replace('v', '');

        if (latestVersion !== currentVersion) {
            const action = await vscode.window.showInformationMessage(
                `Доступна новая версия ${latestVersion}. Установить?`,
                'Обновить', 'Позже'
            );
            if (action === 'Обновить') {
                const asset = (release.assets  as Record<string, unknown>[]).find((a: any) => a.name.endsWith('.vsix')) as Record<string, unknown>;
                if (asset) {
                    const downloadUrl = asset.browser_download_url as string;
                    const vsixPath = path.join(context.extensionPath, '..', 'update.vsix');
                    await downloadFile(downloadUrl, vsixPath);
                    await execAsync(`code --install-extension "${vsixPath}" --force`);
                    await fs.rm(vsixPath);
                    vscode.window.showInformationMessage('Обновление установлено. Перезагрузите окно.');
                }
            }
        }
    } catch (err) {
        console.error('Ошибка проверки обновлений:', err);
    }
}

async function downloadFile(url: string, dest: string): Promise<void> {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(dest, buffer);
}