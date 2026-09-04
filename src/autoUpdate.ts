import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export async function checkForUpdates(context: vscode.ExtensionContext) {
    const currentVersion = context.extension.packageJSON.version;
    const repo = 'AvtoBBus/CCreator';
    let vsixPath = ''; 

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (!response.ok) {
            console.warn('GitHub API error:', response.status);
            return;
        }
        const release = await response.json() as Record<string, unknown>;
        const latestVersion = (release.tag_name as string)?.replace('v', '') || '0.0.0';
        if (latestVersion !== currentVersion) {
            const action = await vscode.window.showInformationMessage(
                `A new version is available: ${latestVersion}. Install?`,
                'Update', 'Later'
            );
            
            if (action === 'Update') {
                const assets = release.assets as Array<Record<string, unknown>>;
                const asset = assets?.find((a: any) => (a.name as string)?.endsWith('.vsix'));
                
                if (asset) {
                    const downloadUrl = asset.browser_download_url as string;
                    const tempDir = os.tmpdir();
                    vsixPath = path.join(tempDir, `ccreator-update-${Date.now()}.vsix`);
                    
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Update CCreator",
                        cancellable: false
                    }, async (progress) => {
                        progress.report({ message: "Download new version..." });
                        await downloadFile(downloadUrl, vsixPath);
                        
                        progress.report({ message: "Install extension..." });
                        const vsixUri = vscode.Uri.file(vsixPath);
                        
                        await vscode.commands.executeCommand('workbench.extensions.installExtension', vsixUri);
                    });

                    const reloadAction = await vscode.window.showInformationMessage(
                        'The extension has been successfully updated. Reload the window to apply the changes?',
                        'Reload'
                    );
                    
                    if (reloadAction === 'Reload') {
                        await vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                } else {
                    vscode.window.showErrorMessage('The .vsix file was not found in the release.');
                }
            }
        }

        } catch (err) {
            console.error('Update check error:', err);
            vscode.window.showErrorMessage(`Update check error: ${(err as Record<string, unknown>).message}`);
        } finally {
            if (vsixPath) {
            try {
                await fs.rm(vsixPath, { force: true });
            } catch (error) {
                console.error('The temporary VSIX file could not be deleted:', error);
            }
        }
    }

}

async function downloadFile(url: string, dest: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(dest, buffer);
}
