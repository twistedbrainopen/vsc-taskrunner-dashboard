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
    console.log('==========================================');
    console.log('Task Runner Dashboard: Aktivering starter');
    console.log('Task Runner Dashboard er nu aktiveret');
    let disposable = vscode.commands.registerCommand('taskRunnerDashboard.open', async () => {
        console.log('Task Runner Dashboard: Kommando udføres');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Ingen aktiv workspace fundet');
            return;
        }
        TaskRunnerPanel_1.TaskRunnerPanel.createOrShow(context.extensionUri);
    });
    context.subscriptions.push(disposable);
    console.log('Task Runner Dashboard: Aktivering færdig');
    console.log('==========================================');
}
exports.activate = activate;
function deactivate() {
    // Clean up resources
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map