import * as vscode from 'vscode';
import * as fs from 'fs';
import { showError } from '$shared/utils';
import { baseConfigData, INIT_CONFIG_FILE, jsonConfigFile, WRITE_CONFIG_FILE } from '$shared/constants';
import { getConfigurationParam } from '$shared/utils';
import { ConfigurationParamKey } from '$shared/types';

async function writeFile(configData: Record<string, unknown>, configUri: vscode.Uri) {
    const configString = JSON.stringify(configData, null, 4);
    const uint8Array = Buffer.from(configString, 'utf8');

    await vscode.workspace.fs.writeFile(configUri, uint8Array);
}

async function initConfig(configUri: vscode.Uri) {
    await writeFile(baseConfigData, configUri);
};

async function writeConfig(configUri: vscode.Uri) {
    const newConfig = {};
    [
        "historyLength",
        "showLivePreview",
        "useLinter",
        "snippets",
        "userTemplates"
    ].forEach(async key => {
        Object.assign(newConfig, { [`${key}`]: await getConfigurationParam(key as ConfigurationParamKey) });
    });

    await writeFile(newConfig, configUri);
};

export async function getValueFromConfig(paramKey: ConfigurationParamKey): Promise<ReturnType<typeof getConfigurationParam>> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return undefined; }
    
    const rootUri = workspaceFolders[0].uri;
    const configUri = vscode.Uri.joinPath(rootUri, jsonConfigFile);
    const isConfigExist = fs.existsSync(configUri.path.slice(1));

    if (!isConfigExist) { return undefined; }

    const uint8Array = await vscode.workspace.fs.readFile(configUri);
    const configString = Buffer.from(uint8Array.toString(), 'utf-8').toString();
    const configData: Record<string, ReturnType<typeof getConfigurationParam>> = JSON.parse(configString);

    return configData[paramKey];
};

export async function workWithConfigFile() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        showError('Необходимо открыть директорию для работы');
        return;
    }

    const rootUri = workspaceFolders[0].uri;
    const configUri = vscode.Uri.joinPath(rootUri, jsonConfigFile);
    const isConfigExist = fs.existsSync(configUri.path.slice(1));

    const quickPickCommand = [INIT_CONFIG_FILE];

    if (isConfigExist) {
        quickPickCommand.push(WRITE_CONFIG_FILE);
    }

    const pickedCommand = await vscode.window.showQuickPick(
        quickPickCommand,
        {
            placeHolder: 'Выберите, что сделать с конфигом',
            canPickMany: false,
            ignoreFocusOut: true
        }
    );

    if (!pickedCommand) {
        return;
    }

    switch (pickedCommand) {
        case INIT_CONFIG_FILE:
            initConfig(configUri);
            return;
        case WRITE_CONFIG_FILE:
            if (!isConfigExist) {
                showError(`Сначало необходимо создать файл с конфигом`);
                return;
            }
            writeConfig(configUri);
            return;
        default:
            showError(`Команда ${pickedCommand} не поддерживается`);
            return;
    }
};
