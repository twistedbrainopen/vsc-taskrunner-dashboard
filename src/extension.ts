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
    console.log('==========================================');
    console.log('Task Runner Dashboard: Aktivering starter');
    console.log('Task Runner Dashboard er nu aktiveret');

    let disposable = vscode.commands.registerCommand('taskRunnerDashboard.open', async () => {
        await TaskRunnerPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);
    console.log('Task Runner Dashboard: Aktivering færdig');
    console.log('==========================================');
}

export function deactivate() {
    // Clean up resources
}
