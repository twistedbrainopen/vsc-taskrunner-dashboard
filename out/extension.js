"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const TaskRunnerPanel_1 = require("./TaskRunnerPanel");
function activate(context) {
    console.log('Task Runner Dashboard: Aktivering starter');
    // Registrer view provider
    const provider = new TaskRunnerViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('taskRunnerDashboard', provider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    // Registrer focus kommando
    context.subscriptions.push(vscode.commands.registerCommand('taskRunnerDashboard.focus', () => {
        vscode.commands.executeCommand('workbench.view.extension.task-runner-dashboard');
    }));
    // Gem state når VS Code lukkes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async () => {
        await provider.saveState();
    }));
    console.log('Task Runner Dashboard: Aktivering færdig');
}
exports.activate = activate;
class TaskRunnerViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Konfigurer webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        // Opret eller gendan panel
        if (!this._taskRunnerPanel) {
            this._taskRunnerPanel = await TaskRunnerPanel_1.TaskRunnerPanel.createOrShow(this._extensionUri, webviewView.webview);
        }
        else {
            await this._taskRunnerPanel.update();
        }
    }
    async saveState() {
        if (this._taskRunnerPanel) {
            await this._taskRunnerPanel.saveState();
        }
    }
}
function deactivate() {
    // Clean up resources
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map