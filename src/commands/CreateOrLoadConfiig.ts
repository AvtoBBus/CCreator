import * as vscode from 'vscode';
import * as fs from 'fs';
import { getLocalizationText, showError } from '$shared/utils';
import { baseConfigData, INIT_CONFIG_FILE, jsonConfigFile, WRITE_CONFIG_FILE } from '$shared/constants';
import { getConfigurationParam } from '$shared/utils';
import { ConfigurationParamKey } from '$shared/types';

// show-once flag: разорвать flood error-тостов при битом конфиг-файле
let configErrorShown = false;

async function writeFile(configData: Record<string, unknown>, configUri: vscode.Uri) {
    const configString = JSON.stringify(configData, null, 4);
    const uint8Array = Buffer.from(configString, 'utf8');

    await vscode.workspace.fs.writeFile(configUri, uint8Array);
}

async function initConfig(configUri: vscode.Uri) {
    await writeFile(baseConfigData, configUri);
};

async function writeConfig(configUri: vscode.Uri) {
    const configuration = vscode.workspace.getConfiguration('ccreator');
    const newConfig: Record<string, unknown> = {};
    const keys: ConfigurationParamKey[] = [
        "historyLength",
        "showLivePreview",
        "useLinter",
        "language",
        "snippets",
        "userTemplates"
    ];

    // forEach с async-колбэком не дожидается промисов, поэтому используется for...of.
    // Читаем настройки VS Code напрямую, а не через getConfigurationParam: тот приоритетно
    // возвращает значения из этого же конфиг-файла, и команда перезаписывала бы файл им самим
    for (const key of keys) {
        Object.assign(newConfig, { [key]: configuration.get(key) });
    }

    await writeFile(newConfig, configUri);
};

export async function getValueFromConfig(paramKey: ConfigurationParamKey): Promise<Awaited<ReturnType<typeof getConfigurationParam>>> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return undefined; }
    
    const rootUri = workspaceFolders[0].uri;
    const configUri = vscode.Uri.joinPath(rootUri, jsonConfigFile);

    try {
        const uint8Array = await vscode.workspace.fs.readFile(configUri);
        // readFile возвращает Uint8Array: Uint8Array.toString() даёт список байт через запятую,
        // поэтому декодировать нужно сами байты
        const configString = Buffer.from(uint8Array).toString('utf-8');
        const configData: Record<string, unknown> = JSON.parse(configString);
        configErrorShown = false;

        return configData[paramKey] as Awaited<ReturnType<typeof getConfigurationParam>>;
    } catch (error) {
        // Отсутствующий конфиг — штатная ситуация, значения берутся из настроек VS Code
        if ((error as vscode.FileSystemError).code === 'FileNotFound') { return undefined; }

        // English fallback без getLocalizationText, чтобы разорвать рекурсию:
        // getLocalizationText → getConfigurationParam('language') → getValueFromConfig → ошибка → getLocalizationText → …
        if (!configErrorShown) {
            configErrorShown = true;
            showError(`CCreator: failed to read config file: ${configUri.fsPath}`);
        }
        return undefined;
    }
};

export async function workWithConfigFile() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        showError(await getLocalizationText("errors:needSelectDir"));
        return;
    }

    const rootUri = workspaceFolders[0].uri;
    const configUri = vscode.Uri.joinPath(rootUri, jsonConfigFile);
    const isConfigExist = fs.existsSync(configUri.fsPath);

    // Метки кэшируются: повторные await в case-выражениях перевызывают локализацию и лишний раз
    // читают конфиг-файл
    const initLabel = await INIT_CONFIG_FILE();
    const writeLabel = await WRITE_CONFIG_FILE();

    const quickPickCommand = [
        initLabel
    ];

    if (isConfigExist) {
        quickPickCommand.push(writeLabel);
    }

    const pickedCommand = await vscode.window.showQuickPick(
        quickPickCommand,
        {
            placeHolder: await getLocalizationText("configFile:pickCommand"),
            canPickMany: false,
            ignoreFocusOut: true
        }
    );

    if (!pickedCommand) {
        return;
    }

    switch (pickedCommand) {
        case initLabel:
            await initConfig(configUri);
            return;
        case writeLabel:
            if (!isConfigExist) {
                showError(await getLocalizationText("configFile:needCreateConfig"));
                return;
            }
            await writeConfig(configUri);
            return;
        default:
            showError(`${pickedCommand} - ${await getLocalizationText("configFile:commandNotSuppot")}`);
            return;
    }
};
