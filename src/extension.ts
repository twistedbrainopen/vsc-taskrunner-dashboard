import * as vscode from 'vscode';
import { TaskRunnerPanel } from './TaskRunnerPanel';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FILE_PATTERNS = [
    '**/task-runner.config.json',
    '**/.vscode/task-runner.config.json'
];

const PDSL_FILE_PATTERNS = [
    '**/.ai-assist/*.pdsl'
];

async function findPdslFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
    let pdslFiles: vscode.Uri[] = [];
    
    for (const pattern of PDSL_FILE_PATTERNS) {
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, pattern)
        );
        pdslFiles = pdslFiles.concat(files);
    }
    
    return pdslFiles;
}

async function loadPdslContent(uri: vscode.Uri): Promise<any> {
    try {
        const content = await fs.promises.readFile(uri.fsPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Fejl ved indlæsning af PDSL fil ${uri.fsPath}:`, error);
        return null;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Task Runner Dashboard er nu aktiveret');

    let disposable = vscode.commands.registerCommand('taskRunnerDashboard.open', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Ingen aktiv workspace fundet');
            return;
        }

        // Find og load PDSL filer
        const pdslFiles = await findPdslFiles(workspaceFolder);
        const pdslContents = await Promise.all(
            pdslFiles.map(async uri => ({
                path: vscode.workspace.asRelativePath(uri),
                content: await loadPdslContent(uri)
            }))
        );

        // Opret eller opdater panel med PDSL data
        TaskRunnerPanel.createOrShow(context.extensionUri, pdslContents);
    });

    context.subscriptions.push(disposable);

    // Tjek om der er en aktiv workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        console.warn('Ingen aktiv workspace fundet');
        return;
    }

    // Opret file watchers for config files
    const configWatchers = CONFIG_FILE_PATTERNS.map(pattern => 
        vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(
                workspaceFolder,
                pattern
            )
        )
    );

    // Tilføj watchers for PDSL filer
    const pdslWatchers = PDSL_FILE_PATTERNS.map(pattern => 
        vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(
                workspaceFolder,
                pattern
            )
        )
    );

    [...configWatchers, ...pdslWatchers].forEach(watcher => {
        watcher.onDidChange(() => {
            TaskRunnerPanel.currentPanel?.update();
        });
        context.subscriptions.push(watcher);
    });
}

export function deactivate() {
    // Clean up resources
}
