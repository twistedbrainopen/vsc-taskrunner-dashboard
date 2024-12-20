import * as vscode from 'vscode';
import * as path from 'path';
import { PdslView } from './views/PdslView';
import { TaskMatrixView } from './views/TaskMatrixView';
import { ConfigService } from './services/ConfigService';
import { StateService, ViewState } from './services/StateService';
import { GitService } from './services/GitService';
import { PdslFile, StatusStats } from './types';

// Hjælpefunktioner til PDSL fil håndtering
async function findPdslFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
    // Søg i .ai-assist mappen i roden af workspace
    const pattern = new vscode.RelativePattern(workspaceFolder, '.ai-assist/*.pdsl');
    return await vscode.workspace.findFiles(pattern);
}

async function loadPdslContent(uri: vscode.Uri): Promise<any> {
    try {
        const content = await vscode.workspace.fs.readFile(uri);
        return JSON.parse(content.toString());
    } catch (error) {
        console.error(`Fejl ved indlæsning af PDSL fil ${uri.fsPath}:`, error);
        return null;
    }
}

export class TaskRunnerPanel {
    public static currentPanel: TaskRunnerPanel | undefined;
    private static pdslPanel: vscode.WebviewPanel | undefined;

    private readonly _webview: vscode.Webview;
    private readonly _extensionUri: vscode.Uri;
    private readonly _pdslView: PdslView;
    private readonly _taskMatrixView: TaskMatrixView;
    private readonly _configService: ConfigService;
    private readonly _stateService: StateService;
    private readonly _gitService: GitService;
    
    private _disposables: vscode.Disposable[] = [];
    private _pdslFiles: PdslFile[] = [];
    private _lastViewedPdslFile?: string;
    private _lastScrollPosition: number = 0;
    private _pdslViewWasOpen: boolean = false;

    private constructor(webview: vscode.Webview, extensionUri: vscode.Uri) {
        this._webview = webview;
        this._extensionUri = extensionUri;
        
        // Initialiser services og views
        const workspaceRoot = ConfigService.getWorkspaceRoot();
        this._configService = new ConfigService(workspaceRoot);
        this._stateService = new StateService(workspaceRoot);
        this._gitService = new GitService();
        this._pdslView = new PdslView();
        this._taskMatrixView = new TaskMatrixView();
        
        // Initialiser alt asynkront
        this._initialize();

        // Lyt efter WebView beskeder
        this._webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'runTask':
                        await this._executeTask(message.taskId, message.taskCommand);
                        break;
                    case 'generateReport':
                        await this._handleGenerateReport();
                        break;
                    case 'showPdslContent':
                        await this._handleShowPdslContent(message.path);
                        break;
                    case 'saveScrollPosition':
                        await this._handleSaveScrollPosition(message.position);
                        break;
                    case 'openPdslView':
                        await this._openPdslView();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static async createOrShow(extensionUri: vscode.Uri, webview: vscode.Webview) {
        if (TaskRunnerPanel.currentPanel) {
            await TaskRunnerPanel.currentPanel.update();
            return TaskRunnerPanel.currentPanel;
        }

        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(webview, extensionUri);
        return TaskRunnerPanel.currentPanel;
    }

    private async _initialize(): Promise<void> {
        // Gendan state
        await this._initializeState();
        
        // Initialiser PDSL files
        await this._initializePdslFiles();
        
        // Genåbn PDSL View hvis det var åbent
        if (this._pdslViewWasOpen) {
            await this._openPdslView();
        }
        
        // Start med at opdatere panelet
        await this.update();
    }

    private async _initializeState(): Promise<void> {
        const state = await this._stateService.loadState();
        this._lastViewedPdslFile = state.lastViewedPdslFile;
        this._lastScrollPosition = state.lastScrollPosition;
        this._pdslViewWasOpen = state.pdslViewWasOpen || false;
    }

    public async saveState(): Promise<void> {
        const state: ViewState = {
            lastViewedPdslFile: this._lastViewedPdslFile,
            lastScrollPosition: this._lastScrollPosition,
            pdslViewWasOpen: TaskRunnerPanel.pdslPanel !== undefined
        };
        await this._stateService.saveState(state);
    }

    private async _initializePdslFiles(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const files = await findPdslFiles(workspaceFolder);
        this._pdslFiles = await Promise.all(
            files.map(async (uri, index) => ({
                id: `pdsl-${index}`,
                path: vscode.workspace.asRelativePath(uri),
                selected: true,
                content: await loadPdslContent(uri)
            }))
        );
    }

    public async update() {
        const config = await this._configService.loadConfig();
        const taskGrid = this._taskMatrixView.render(config.taskRunner.categories);
        this._webview.html = this._getHtmlForWebview(taskGrid);
    }

    private _getHtmlForWebview(taskGrid: string): string {
        const scriptUri = this._webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Task Runner Dashboard</title>
                <style>
                    ${this._taskMatrixView.getStyles()}
                    ${this._pdslView.getStyles()}
                </style>
            </head>
            <body>
                ${taskGrid}
                <script>
                    const vscode = acquireVsCodeApi();
                    ${this._taskMatrixView.getClientScript()}
                    ${this._pdslView.getClientScript(this._lastScrollPosition, this._lastViewedPdslFile)}
                </script>
            </body>
            </html>
        `;
    }

    private async _executeTask(taskId: string, command: string) {
        try {
            const terminal = vscode.window.createTerminal(`Task: ${taskId}`);
            terminal.show();
            terminal.sendText(command);
        } catch (error) {
            vscode.window.showErrorMessage(`Fejl ved kørsel af task: ${error}`);
        }
    }

    private async _handleGenerateReport() {
        try {
            // TODO: Implementer rapport generering
            vscode.window.showInformationMessage('Rapport generering er ikke implementeret endnu');
        } catch (error) {
            vscode.window.showErrorMessage(`Fejl ved generering af rapport: ${error}`);
        }
    }

    private async _handleShowPdslContent(path: string) {
        const selectedFile = this._pdslFiles.find(f => f.path === path);
        if (selectedFile && TaskRunnerPanel.pdslPanel) {
            this._lastViewedPdslFile = path;
            await this.saveState();
            
            const formattedContent = this._pdslView.formatContent(selectedFile.content);
            TaskRunnerPanel.pdslPanel.webview.postMessage({
                command: 'updatePdslView',
                content: formattedContent,
                scrollPosition: this._lastScrollPosition
            });
        }
    }

    private async _handleSaveScrollPosition(position: number) {
        this._lastScrollPosition = position;
        await this.saveState();
    }

    private async _openPdslView() {
        // Hvis panel allerede eksisterer, vis det
        if (TaskRunnerPanel.pdslPanel) {
            TaskRunnerPanel.pdslPanel.reveal();
            return;
        }

        // Opret nyt panel som preview
        TaskRunnerPanel.pdslPanel = vscode.window.createWebviewPanel(
            'pdslView',
            'PDSL View',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri],
                enableFindWidget: true,
                enableCommandUris: true
            }
        );

        // Sæt preview ikon og titel
        TaskRunnerPanel.pdslPanel.iconPath = {
            light: vscode.Uri.joinPath(this._extensionUri, 'media', 'preview-light.svg'),
            dark: vscode.Uri.joinPath(this._extensionUri, 'media', 'preview-dark.svg')
        };

        // Opdater HTML
        const pdslContent = this._pdslView.render(this._pdslFiles);
        TaskRunnerPanel.pdslPanel.webview.html = this._getPdslHtmlForWebview(pdslContent);

        // Lyt efter beskeder fra PDSL view
        TaskRunnerPanel.pdslPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'showPdslContent':
                        await this._handleShowPdslContent(message.path);
                        break;
                    case 'saveScrollPosition':
                        await this._handleSaveScrollPosition(message.position);
                        break;
                }
            },
            null,
            this._disposables
        );

        // Håndter lukning
        TaskRunnerPanel.pdslPanel.onDidDispose(
            async () => {
                TaskRunnerPanel.pdslPanel = undefined;
                await this.saveState(); // Gem state når panel lukkes
            },
            null,
            this._disposables
        );

        // Gem state når panel åbnes
        await this.saveState();
    }

    private _getPdslHtmlForWebview(pdslContent: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PDSL View</title>
                <style>
                    ${this._pdslView.getStyles()}
                </style>
            </head>
            <body>
                ${pdslContent}
                <script>
                    const vscode = acquireVsCodeApi();
                    ${this._pdslView.getClientScript(this._lastScrollPosition, this._lastViewedPdslFile)}
                </script>
            </body>
            </html>
        `;
    }

    public dispose() {
        TaskRunnerPanel.currentPanel = undefined;

        // Clean up our resources
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
