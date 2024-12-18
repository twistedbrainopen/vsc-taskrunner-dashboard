"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const TaskRunnerPanel_1 = require("./TaskRunnerPanel");
const fs = require("fs");
const CONFIG_FILE_PATTERNS = [
    '**/task-runner.config.json',
    '**/.vscode/task-runner.config.json'
];
const PDSL_FILE_PATTERNS = [
    '**/.ai-assist/*.pdsl'
];
async function findPdslFiles(workspaceFolder) {
    let pdslFiles = [];
    for (const pattern of PDSL_FILE_PATTERNS) {
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, pattern));
        pdslFiles = pdslFiles.concat(files);
    }
    return pdslFiles;
}
async function loadPdslContent(uri) {
    try {
        const content = await fs.promises.readFile(uri.fsPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`Fejl ved indlæsning af PDSL fil ${uri.fsPath}:`, error);
        return null;
    }
}
function activate(context) {
    console.log('Task Runner Dashboard er nu aktiveret');
    let disposable = vscode.commands.registerCommand('taskRunnerDashboard.open', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Ingen aktiv workspace fundet');
            return;
        }
        // Find og load PDSL filer
        const pdslFiles = await findPdslFiles(workspaceFolder);
        const pdslContents = await Promise.all(pdslFiles.map(async (uri) => ({
            path: vscode.workspace.asRelativePath(uri),
            content: await loadPdslContent(uri)
        })));
        // Opret eller opdater panel med PDSL data
        TaskRunnerPanel_1.TaskRunnerPanel.createOrShow(context.extensionUri, pdslContents);
    });
    context.subscriptions.push(disposable);
    // Tjek om der er en aktiv workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        console.warn('Ingen aktiv workspace fundet');
        return;
    }
    // Opret file watchers for config files
    const configWatchers = CONFIG_FILE_PATTERNS.map(pattern => vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, pattern)));
    // Tilføj watchers for PDSL filer
    const pdslWatchers = PDSL_FILE_PATTERNS.map(pattern => vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, pattern)));
    [...configWatchers, ...pdslWatchers].forEach(watcher => {
        watcher.onDidChange(() => {
            TaskRunnerPanel_1.TaskRunnerPanel.currentPanel?.update();
        });
        context.subscriptions.push(watcher);
    });
}
exports.activate = activate;
function deactivate() {
    // Clean up resources
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map