import * as vscode from 'vscode';
import { showError } from "../shared/utils";
import { UserSnippets } from '../shared/types';

export async function editUserSnippets(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'ccreatorsnippets',
        'CCreator - Редактировать сниппеты',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const config = vscode.workspace.getConfiguration('ccreator');
    const currentTemplates = config.get<UserSnippets[]>('snippets', []);

    panel.webview.html = getWebviewContent(currentTemplates);

    panel.webview.onDidReceiveMessage(
        async (message) => {
            if (message.command === 'saveSnippets') {
                try {
                    await vscode.workspace.getConfiguration('ccreator').update(
                        'snippets', 
                        message.data, 
                        vscode.ConfigurationTarget.Global
                    );
                    vscode.window.showInformationMessage('Сниппеты CCreator успешно сохранены!');
                } catch (err) {
                    showError(`Ошибка сохранения: ${(err as Record<string, unknown>).message}`);
                }
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent(snippets: UserSnippets[]) {
    const snippetsJson = JSON.stringify(snippets).replace(/</g, '\\u003c');

    return `
    <!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 20px; padding-bottom: 80px; }
        h2 { color: var(--vscode-settings-headerForeground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; margin-top: 0; }
        .description { margin-bottom: 20px; font-size: 13px; opacity: 0.8; line-height: 1.4; }
        .code-tip { font-family: monospace; background: var(--vscode-textBlockQuote-background); padding: 2px 6px; border-radius: 3px; }
        .snippets-box { border: 1px solid var(--vscode-panel-border); padding: 15px; background: var(--vscode-editor-background); margin-bottom: 15px; }
        .snippet-row { display: flex; gap: 15px; align-items: flex-end; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed var(--vscode-panel-border); }
        .snippet-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .field-group { display: flex; flex-direction: column; gap: 5px; }
        .field-name { width: 30%; }
        .field-value { width: 60%; }
        .field-action { width: 10%; text-align: right; }
        input { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px; box-sizing: border-box; width: 100%; font-family: var(--vscode-font-family); }
        input.code-font { font-family: var(--vscode-editor-font-family, monospace); }
        label { font-size: 12px; font-weight: bold; color: var(--vscode-settings-checkboxForeground); }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 15px; cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .btn-delete { background: var(--vscode-errorForeground, #f44336); color: white; padding: 8px 12px; }
        .btn-delete:hover { opacity: 0.9; }
        .btn-save { background: #28a745; font-weight: bold; position: fixed; bottom: 20px; right: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        .btn-save:hover { background: #218838; }
        .empty-message { font-style: italic; opacity: 0.7; padding: 10px 0; }
    </style>
</head>
<body>
    <h2>Управление сниппетами CCreator</h2>
    <p class="description">
        Создайте переменные, которые можно использовать при генерации структуры папок и файлов. <br/>
        Пример использования в шаблоне: <span class="code-tip">&lt;ui|Component_{CURRENT_YEAR}&gt;</span>
    </p>

    <div id="snippets-container" class="snippets-box"></div>
    <button id="addSnippetBtn">+ Добавить новый сниппет</button>

    <button class="btn-save" id="saveBtn">Сохранить сниппеты в настройки VS Code</button>

    <script>
        const vscode = acquireVsCodeApi();
        let userSnippets = ${snippetsJson} || [];

        function render() {
            const container = document.getElementById('snippets-container');
            container.innerHTML = '';

            if (userSnippets.length === 0) {
                container.innerHTML = '<div class="empty-message">Список сниппетов пуст. Нажмите кнопку ниже, чтобы добавить первый сниппет.</div>';
                return;
            }

            userSnippets.forEach((snip, idx) => {
                const row = document.createElement('div');
                row.className = 'snippet-row';

                row.innerHTML = \`
                    <div class="field-group field-name">
                        <label>Имя переменной:</label>
                        <input type="text" placeholder="CURRENT_YEAR" value="\${snip.snippetName || ''}" onchange="updateSnippet(\${idx}, 'snippetName', this.value)">
                    </div>
                    <div class="field-group field-value">
                        <label>JS Код функции (value):</label>
                        <input type="text" class="code-font" placeholder="() => new Date().getFullYear()" value="\${snip.value || ''}" onchange="updateSnippet(\${idx}, 'value', this.value)">
                    </div>
                    <div class="field-action">
                        <button class="btn-delete" onclick="deleteSnippet(\${idx})" title="Удалить сниппет">✕</button>
                    </div>
                \`;
                container.appendChild(row);
            });
        }

        window.updateSnippet = (idx, field, val) => {
            userSnippets[idx][field] = val;
        };

        window.deleteSnippet = (idx) => {
            userSnippets.splice(idx, 1);
            render();
        };

        document.getElementById('addSnippetBtn').addEventListener('click', () => {
            userSnippets.push({ snippetName: 'NEW_VAR', value: '() => ""' });
            render();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'saveSnippets', data: userSnippets });
        });

        render();
    </script>
</body>
</html>`;
}