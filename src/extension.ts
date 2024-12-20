import * as vscode from 'vscode';
import { TaskRunnerPanel } from './TaskRunnerPanel';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Task Runner Dashboard: Aktivering starter');

    // Registrer view provider
    const provider = new TaskRunnerViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'taskRunnerDashboard',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Registrer focus kommando
    context.subscriptions.push(
        vscode.commands.registerCommand('taskRunnerDashboard.focus', () => {
            vscode.commands.executeCommand('workbench.view.extension.task-runner-dashboard');
        })
    );

    // Gem state når VS Code lukkes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async () => {
            await provider.saveState();
        })
    );

    console.log('Task Runner Dashboard: Aktivering færdig');
}

class TaskRunnerViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _taskRunnerPanel?: TaskRunnerPanel;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        // Konfigurer webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Opret eller gendan panel
        if (!this._taskRunnerPanel) {
            this._taskRunnerPanel = await TaskRunnerPanel.createOrShow(this._extensionUri, webviewView.webview);
        } else {
            await this._taskRunnerPanel.update();
        }
    }

    public async saveState() {
        if (this._taskRunnerPanel) {
            await this._taskRunnerPanel.saveState();
        }
    }
}

export function deactivate() {
    // Clean up resources
}
