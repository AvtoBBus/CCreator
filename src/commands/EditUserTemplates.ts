import * as vscode from 'vscode';
import { getLocalizationText, showError } from "../shared/utils";
import { UserTemplate } from '../shared/types';

export async function editUserTemplates(context: vscode.ExtensionContext) {
        const panel = vscode.window.createWebviewPanel(
            'ccreatoreditUserTemplates',
            await getLocalizationText("templates:webViewTitle"),
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const config = vscode.workspace.getConfiguration('ccreator');
        const currentTemplates = config.get<UserTemplate[]>('userTemplates', []);

        panel.webview.html = await getWebviewContent(currentTemplates);

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'saveTemplates') {
                    try {
                        await vscode.workspace.getConfiguration('ccreator').update(
                            'userTemplates', 
                            message.data, 
                            vscode.ConfigurationTarget.Global
                        );
                        vscode.window.showInformationMessage(await getLocalizationText("templates:successSave"));
                    } catch (err) {
                        showError(await getLocalizationText("errors:saveError"));
                    }
                }
                if (message.command === 'deleteTemplate') {
                    try {
                        await vscode.workspace.getConfiguration('ccreator').update(
                            'userTemplates', 
                            message.data.newPresets, 
                            vscode.ConfigurationTarget.Global
                        );
                        vscode.window.showInformationMessage(`${await getLocalizationText("templates:successDelete")}: ${message.data.deleted}`);
                    } catch (err) {
                        showError(await getLocalizationText("errors:saveError"));
                    }
                }
            },
            undefined,
            context.subscriptions
        );
}

async function getWebviewContent(templates: UserTemplate[]) {
    const templatesJson = JSON.stringify(templates).replace(/</g, '\\u003c');

    return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 20px; }
            h2 { color: var(--vscode-settings-headerForeground); }
            .template-box { border: 1px solid var(--vscode-panel-border); padding: 15px; margin-bottom: 15px; background: var(--vscode-editor-background); }
            input, textarea { width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px; margin-top: 5px; box-sizing: border-box; }
            textarea { height: 100px; font-family: monospace; }
            button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 15px; cursor: pointer; margin-top: 10px; }
            button:hover { background: var(--vscode-button-hoverBackground); }
            .btn-save { background: #28a745; font-weight: bold; }
            .btn-save:hover { background: #218838; }
            #deleteBtn { display: inline-flex; margin-left: 3rem; }
        </style>
    </head>
    <body>
        <h2>${await getLocalizationText("templates:webViewHeader")}</h2>
        <div id="container"></div>
        <button id="addPresetBtn">+ ${await getLocalizationText("templates:webViewAddPreset")}</button>
        <hr/>
        <button class="btn-save" id="saveBtn">${await getLocalizationText("templates:webViewSavePresets")}</button>

        <script>
            const vscode = acquireVsCodeApi();
            let templates = ${templatesJson};

            function render() {
                const container = document.getElementById('container');
                container.innerHTML = '';

                templates.forEach((tpl, tplIdx) => {
                    const box = document.createElement('div');
                    box.className = 'template-box';

                    box.innerHTML = \`
                    <h3 class="preset-title">\${tpl.templateName || '${await getLocalizationText("templates:webViewPresetNoname")}'}<button id="deleteBtn" preset-id=\${tplIdx} onclick="deleteTemplate(\${tplIdx})">${await getLocalizationText("templates:webViewDeletePreset")}</button></h3>
                    <label>${await getLocalizationText("templates:webViewPresetName")}:
                        <input type="text" value="\${tpl.templateName}" onchange="updateTemplate(\${tplIdx}, 'templateName', this.value)">
                    </label>
                    <br/><br/>
                    <label>${await getLocalizationText("templates:webViewPresetStructureString")}:
                        <input type="text" value="\${tpl.structureString || ''}" onchange="updateTemplate(\${tplIdx}, 'structureString', this.value)">
                    </label>
                    <h4>${await getLocalizationText("templates:webViewPresetFiles")}:</h4>
                    <div id="files-\${tplIdx}"></div>
                    <button onclick="addFile(\${tplIdx})">+ ${await getLocalizationText("templates:webViewPresetAddFile")}</button>
                    \`;

                    container.appendChild(box);

                    const filesContainer = box.querySelector(\`#files-\${tplIdx}\`);
                    Object.entries(tpl.fileContent || {}).forEach(([mask, content]) => {
                        const fileRow = document.createElement('div');
                        fileRow.style.marginBottom = '10px';
                        fileRow.innerHTML = \`
                            <input type="text" value="\${mask}" style="width: 25%; display:inline-block;" placeholder="*.svelte" onchange="updateFileKey(\${tplIdx}, '\${mask}', this.value)">
                            <textarea placeholder="${await getLocalizationText("templates:webViewFileContentPlaceholder")}..." style="width: 70%; display:inline-block; vertical-align: top; margin-left: 5px;" onchange="updateFileContent(\${tplIdx}, '\${mask}', this.value)">\${content}</textarea>
                        \`;
                        filesContainer.appendChild(fileRow);
                    });
                });
            }

            window.updateTemplate = (idx, field, val) => { templates[idx][field] = val; };
            window.updateFileContent = (tplIdx, mask, val) => { templates[tplIdx].fileContent[mask] = val; };
            
            window.updateFileKey = (tplIdx, oldMask, newMask) => {
                if (oldMask === newMask) return;
                templates[tplIdx].fileContent[newMask] = templates[tplIdx].fileContent[oldMask];
                delete templates[tplIdx].fileContent[oldMask];
                render();
            };

            window.addFile = (tplIdx) => {
                if (!templates[tplIdx].fileContent) templates[tplIdx].fileContent = {};
                const placeholderKey = 'new_file_' + Date.now() + '.ts';
                templates[tplIdx].fileContent[placeholderKey] = '';
                render();
            };

            window.deleteTemplate = (tplIdx) => {
                const presetName = templates[tplIdx].templateName || ${await getLocalizationText("templates:webViewPresetNoname")};
                templates.splice(tplIdx, 1);
                
                render();
                
                vscode.postMessage({ command: 'deleteTemplate', data: { deleted: presetName, newPresets: templates } });
            };

            document.getElementById('addPresetBtn').addEventListener('click', () => {
                templates.push({ templateName: '${await getLocalizationText("templates:webViewNewPresetName")}', structureString: '', fileContent: {} });
                render();
            });

            document.getElementById('saveBtn').addEventListener('click', () => {
                vscode.postMessage({ command: 'saveTemplates', data: templates });
            });

            render();
        </script>
    </body>
    </html>
    `;
}