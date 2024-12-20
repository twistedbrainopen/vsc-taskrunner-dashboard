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

    private readonly _panel: vscode.WebviewPanel;
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

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
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
        this._panel.webview.onDidReceiveMessage(
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
                }
            },
            null,
            this._disposables
        );

        // Lyt efter panel lukning
        this._panel.onDidDispose(
            async () => {
                await this._saveState();
                this.dispose();
            },
            null,
            this._disposables
        );
    }

    public static async createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TaskRunnerPanel.currentPanel) {
            TaskRunnerPanel.currentPanel._panel.reveal(column);
            await TaskRunnerPanel.currentPanel.update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskRunner',
            'Task Runner Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(panel, extensionUri);
    }

    private async _initialize(): Promise<void> {
        // Gendan state
        await this._initializeState();
        
        // Initialiser PDSL files
        await this._initializePdslFiles();
        
        // Start med at opdatere panelet
        await this.update();
    }

    private async _initializeState(): Promise<void> {
        const state = await this._stateService.loadState();
        this._lastViewedPdslFile = state.lastViewedPdslFile;
        this._lastScrollPosition = state.lastScrollPosition;
    }

    private async _saveState(): Promise<void> {
        const state: ViewState = {
            lastViewedPdslFile: this._lastViewedPdslFile,
            lastScrollPosition: this._lastScrollPosition
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
        this._panel.webview.html = this._getHtmlForWebview(taskGrid);
    }

    private _getHtmlForWebview(taskGrid: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root {
                        --grid-gap: 12px;
                        --card-radius: 6px;
                    }
                    
                    body {
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                        background: var(--vscode-editor-background);
                    }
                    
                    /* Navigation Styles */
                    .nav-menu {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 40px;
                        background: var(--vscode-editor-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        padding: 0 16px;
                        z-index: 1000;
                        gap: 16px;
                    }
                    
                    .nav-item {
                        padding: 8px 16px;
                        cursor: pointer;
                        color: var(--vscode-foreground);
                        border-radius: 4px;
                    }
                    
                    .nav-item.active {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    
                    /* Content Area Styles */
                    .content-area {
                        margin-top: 48px;
                        padding: 16px;
                    }
                    
                    .view {
                        display: none;
                    }
                    
                    .view.active {
                        display: block;
                    }

                    ${this._taskMatrixView.getStyles()}
                    ${this._pdslView.getStyles()}
                </style>
            </head>
            <body>
                <nav class="nav-menu">
                    <div class="nav-item active" data-view="tasks">Tasks</div>
                    <div class="nav-item" data-view="pdsl">PDSL Files</div>
                </nav>
                <div class="content-area">
                    <div id="tasks-view" class="view active">
                        ${taskGrid}
                    </div>
                    <div id="pdsl-view" class="view">
                        ${this._pdslView.render(this._pdslFiles)}
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // View switching
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const viewId = item.dataset.view;
                            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                            
                            document.getElementById(viewId + '-view').classList.add('active');
                            item.classList.add('active');
                        });
                    });

                    ${this._taskMatrixView.getClientScript()}
                    ${this._pdslView.getClientScript(this._lastScrollPosition, this._lastViewedPdslFile)}
                </script>
            </body>
            </html>
        `;
    }

    private async _executeTask(taskId: string, command: string) {
        const terminal = vscode.window.createTerminal(`Task: ${taskId}`);
        terminal.show();
        terminal.sendText(command);
    }

    private async _handleGenerateReport() {
        console.log('Generating report...'); // Debug log
        const report = await this._generateStatusReport();
        console.log('Report generated:', report); // Debug log
        
        const workspaceRoot = ConfigService.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('Ingen workspace fundet!');
            return;
        }
        
        // Vis save dialog
        const defaultPath = path.join(
            workspaceRoot,
            `project-status-${new Date().toISOString().split('T')[0]}.md`
        );
        
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultPath),
            filters: {
                'Markdown': ['md']
            },
            title: 'Gem Status Rapport'
        });

        if (uri) {
            const reportBuffer = Buffer.from(report, 'utf8');
            await vscode.workspace.fs.writeFile(uri, reportBuffer);
            vscode.window.showInformationMessage('Status rapport gemt!');
        }
    }

    private async _handleShowPdslContent(path: string) {
        const selectedFile = this._pdslFiles.find(f => f.path === path);
        if (selectedFile) {
            this._lastViewedPdslFile = path;
            await this._saveState();
            
            const formattedContent = this._pdslView.formatContent(selectedFile.content);
            this._panel.webview.postMessage({
                command: 'updatePdslView',
                content: formattedContent,
                scrollPosition: this._lastScrollPosition
            });
        }
    }

    private async _handleSaveScrollPosition(position: number) {
        this._lastScrollPosition = position;
        await this._saveState();
    }

    private async _generateStatusReport(): Promise<string> {
        const stats: StatusStats = {
            total: 0,
            done: 0,
            inProgress: 0,
            pending: 0,
            iterations: new Set<string>(),
            recentUpdates: []
        };

        // Analyser PDSL data
        this._pdslFiles.forEach(pdsl => {
            const traverse = (obj: any, path: string[] = []) => {
                if (obj?.status) {
                    stats.total++;
                    const status = obj.status.toLowerCase();
                    if (status === 'done') stats.done++;
                    if (status === 'in_progress') stats.inProgress++;
                    if (status === 'pending') stats.pending++;
                    
                    if (obj.name) {
                        stats.recentUpdates.push({
                            name: obj.name,
                            status: obj.status,
                            path: path.join(' > ')
                        });
                    }
                }
                if (obj?.ITERATIONS) {
                    stats.iterations = new Set([...stats.iterations, ...Object.keys(obj.ITERATIONS)]);
                }
                if (typeof obj === 'object' && obj !== null) {
                    Object.entries(obj).forEach(([key, val]) => {
                        traverse(val, [...path, key]);
                    });
                }
            };
            traverse(pdsl.content);
        });

        const completionPercentage = Math.round((stats.done / stats.total) * 100);
        const date = new Date().toLocaleString('da-DK', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `# Projekt Status Rapport
Genereret: ${date}

## 📊 Overblik
- **Total Tasks:** ${stats.total}
- **Færdige:** ${stats.done} (${completionPercentage}%)
- **I Gang:** ${stats.inProgress}
- **Afventer:** ${stats.pending}

## 🎯 Iterationer
**Antal Iterationer:** ${stats.iterations.size}
${Array.from(stats.iterations).map(it => `- ${it}`).join('\n')}

## 📝 Seneste Opdateringer
${stats.recentUpdates.slice(-5).map(update => 
    `- **${update.name}** (${update.status})\n  _Sti: ${update.path}_`
).join('\n')}

## 📈 Fremskridt
- **Færdiggørelsesgrad:** ${completionPercentage}%
- **Resterende Tasks:** ${stats.total - stats.done}
- **Aktive Tasks:** ${stats.inProgress}
`;
    }

    public dispose() {
        TaskRunnerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
