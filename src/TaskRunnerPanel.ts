import * as vscode from 'vscode';
import * as path from 'path';
import { PdslView } from './views/PdslView';
import { TaskMatrixView } from './views/TaskMatrixView';
import { ConfigService } from './services/ConfigService';
import { StateService, ViewState } from './services/StateService';
import { GitService } from './services/GitService';
import { PdslFile, StatusStats } from './types';
import * as fs from 'fs';

// Hjælpefunktioner til PDSL fil håndtering
async function findPdslFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
    console.log('Søger efter PDSL filer i workspace:', workspaceFolder.uri.fsPath);
    
    // Søg kun i .ai-assist mappen
    const aiAssistPattern = new vscode.RelativePattern(workspaceFolder, '.ai-assist/**/*.pdsl');
    
    console.log('Søgemønster:', aiAssistPattern.pattern);
    
    const files = await vscode.workspace.findFiles(aiAssistPattern);
    
    console.log('Fundne filer:', files.map(f => f.fsPath));
    
    return files;
}

async function loadPdslContent(uri: vscode.Uri): Promise<any> {
    try {
        console.log('Indlæser PDSL fil:', uri.fsPath);
        const content = await vscode.workspace.fs.readFile(uri);
        const contentStr = content.toString();
        console.log('Rå indhold:', contentStr);
        
        try {
            const parsed = JSON.parse(contentStr);
            console.log('Parsed indhold:', parsed);
            return parsed;
        } catch (parseError) {
            console.error(`Fejl ved parsing af PDSL fil ${uri.fsPath}:`, parseError);
            console.log('Indhold der ikke kunne parses:', contentStr);
            return null;
        }
    } catch (error) {
        console.error(`Fejl ved læsning af PDSL fil ${uri.fsPath}:`, error);
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
        if (!workspaceFolder) {
            console.log('Ingen workspace folder fundet');
            return;
        }

        console.log('Søger efter PDSL filer i:', workspaceFolder.uri.fsPath);
        const files = await findPdslFiles(workspaceFolder);
        console.log('Fandt PDSL filer:', files.map(f => f.fsPath));

        this._pdslFiles = await Promise.all(
            files.map(async (uri, index) => {
                const content = await loadPdslContent(uri);
                console.log('Indlæst PDSL fil:', uri.fsPath, 'indhold:', content);
                return {
                    id: `pdsl-${index}`,
                    path: vscode.workspace.asRelativePath(uri),
                    selected: true,
                    content: content
                };
            })
        );
        console.log('Initialiserede PDSL filer:', this._pdslFiles);
    }

    public async update() {
        const config = await this._configService.loadConfig();
        const taskGrid = this._taskMatrixView.render(config.taskRunner.categories);
        this._webview.html = this._getHtmlForWebview(taskGrid);
    }

    private _getHtmlForWebview(taskGrid: string): string {
        const scriptUri = this._webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, '.vscode', 'task-runner', 'main.js')
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
                    .action-button {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        background: none;
                        border: none;
                        padding: 5px;
                        cursor: pointer;
                        color: var(--vscode-foreground);
                    }
                    .action-button:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .action-icon {
                        width: 16px;
                        height: 16px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .action-icon svg {
                        width: 14px;
                        height: 14px;
                        fill: currentColor;
                    }
                    .button-container {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="button-container">
                    <button class="action-button" onclick="vscode.postMessage({command: 'openPdslView'})">
                        <span class="action-icon">
                            <svg viewBox="0 0 16 16">
                                <path d="M13.5 1h-11l-.5.5v13l.5.5h11l.5-.5v-13l-.5-.5zM13 14H3V2h10v12zM4 3h8v1H4V3zm0 3h8v1H4V6zm0 3h8v1H4V9zm0 3h8v1H4v-1z"/>
                            </svg>
                        </span>
                        PDSL View
                    </button>
                    <button class="action-button" onclick="vscode.postMessage({command: 'generateReport'})">
                        <span class="action-icon">
                            <svg viewBox="0 0 16 16">
                                <path d="M14 1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm1 3h10v1H3V3zm0 3h10v1H3V6zm0 3h10v1H3V9z"/>
                            </svg>
                        </span>
                        Generate Report
                    </button>
                </div>
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
            // Hent aktuel konfiguration
            const config = await this._configService.loadConfig();
            
            // Generer rapport indhold
            let report = '# Task Runner Dashboard Rapport\n\n';
            
            // Tilføj tidspunkt
            const now = new Date();
            report += `Genereret: ${now.toLocaleString('da-DK')}\n\n`;
            
            // Tilføj kategorier og tasks
            report += '## Konfigurerede Tasks\n\n';
            Object.entries(config.taskRunner.categories).forEach(([key, category]) => {
                report += `### ${category.label}\n\n`;
                if (category.description) {
                    report += `${category.description}\n\n`;
                }
                category.tasks.forEach(task => {
                    report += `- **${task.label}** (${task.id})\n`;
                    report += `  - Kommando: \`${task.command}\`\n`;
                    if (task.tooltip) {
                        report += `  - Beskrivelse: ${task.tooltip}\n`;
                    }
                    report += '\n';
                });
            });
            
            // Tilføj PDSL filer hvis de findes
            if (this._pdslFiles.length > 0) {
                report += '## PDSL Filer\n\n';
                this._pdslFiles.forEach(file => {
                    report += `- ${file.path}\n`;
                });
                report += '\n';
            }

            // Opret rapport fil i .vscode/task-runner mappen
            const workspaceRoot = ConfigService.getWorkspaceRoot();
            if (!workspaceRoot) {
                throw new Error('Ingen workspace root fundet');
            }

            const reportDir = path.join(workspaceRoot, '.vscode', 'task-runner', 'reports');
            const reportPath = path.join(reportDir, `task-runner-report-${now.getTime()}.md`);
            
            // Sikr at reports mappen eksisterer
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(reportDir));
            
            // Gem rapport
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(reportPath),
                Buffer.from(report, 'utf8')
            );
            
            // Åbn rapport i editor
            const doc = await vscode.workspace.openTextDocument(reportPath);
            await vscode.window.showTextDocument(doc, { preview: false });
            
            vscode.window.showInformationMessage('Rapport er genereret og gemt i .vscode/task-runner/reports/');
        } catch (error) {
            console.error('Fejl ved generering af rapport:', error);
            vscode.window.showErrorMessage(`Fejl ved generering af rapport: ${error}`);
        }
    }

    private async _handleShowPdslContent(path: string) {
        console.log('Viser PDSL indhold for:', path);
        console.log('Tilgængelige PDSL filer:', this._pdslFiles);
        
        const selectedFile = this._pdslFiles.find(f => f.path === path);
        console.log('Fundet fil:', selectedFile);
        
        if (selectedFile && TaskRunnerPanel.pdslPanel) {
            this._lastViewedPdslFile = path;
            await this.saveState();
            
            const formattedContent = this._pdslView.formatContent(selectedFile.content);
            console.log('Formateret indhold:', formattedContent);
            
            TaskRunnerPanel.pdslPanel.webview.postMessage({
                command: 'updatePdslView',
                content: formattedContent,
                scrollPosition: this._lastScrollPosition
            });
        } else {
            console.log('Kunne ikke vise PDSL indhold - ingen fil eller panel');
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
            light: vscode.Uri.joinPath(this._extensionUri, '.vscode', 'task-runner', 'preview-light.svg'),
            dark: vscode.Uri.joinPath(this._extensionUri, '.vscode', 'task-runner', 'preview-dark.svg')
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
