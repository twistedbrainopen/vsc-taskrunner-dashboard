"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerPanel = void 0;
const vscode = require("vscode");
const PdslView_1 = require("./views/PdslView");
const TaskMatrixView_1 = require("./views/TaskMatrixView");
const ConfigService_1 = require("./services/ConfigService");
const StateService_1 = require("./services/StateService");
const GitService_1 = require("./services/GitService");
// Hjælpefunktioner til PDSL fil håndtering
async function findPdslFiles(workspaceFolder) {
    // Søg i .ai-assist mappen i roden af workspace
    const pattern = new vscode.RelativePattern(workspaceFolder, '.ai-assist/*.pdsl');
    return await vscode.workspace.findFiles(pattern);
}
async function loadPdslContent(uri) {
    try {
        const content = await vscode.workspace.fs.readFile(uri);
        return JSON.parse(content.toString());
    }
    catch (error) {
        console.error(`Fejl ved indlæsning af PDSL fil ${uri.fsPath}:`, error);
        return null;
    }
}
class TaskRunnerPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._pdslFiles = [];
        this._lastScrollPosition = 0;
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Initialiser services og views
        const workspaceRoot = ConfigService_1.ConfigService.getWorkspaceRoot();
        this._configService = new ConfigService_1.ConfigService(workspaceRoot);
        this._stateService = new StateService_1.StateService(workspaceRoot);
        this._gitService = new GitService_1.GitService();
        this._pdslView = new PdslView_1.PdslView();
        this._taskMatrixView = new TaskMatrixView_1.TaskMatrixView();
        // Initialiser alt asynkront
        this._initialize();
        // Lyt efter WebView beskeder
        this._panel.webview.onDidReceiveMessage(async (message) => {
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
        }, null, this._disposables);
        // Lyt efter panel lukning
        this._panel.onDidDispose(async () => {
            await this._saveState();
            this.dispose();
        }, null, this._disposables);
    }
    static async createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (TaskRunnerPanel.currentPanel) {
            TaskRunnerPanel.currentPanel._panel.reveal(column);
            await TaskRunnerPanel.currentPanel.update();
            return;
        }
        const panel = vscode.window.createWebviewPanel('taskRunner', 'Task Runner Dashboard', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri],
            retainContextWhenHidden: true
        });
        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(panel, extensionUri);
    }
    async _initialize() {
        // Gendan state
        await this._initializeState();
        // Initialiser PDSL files
        await this._initializePdslFiles();
        // Start med at opdatere panelet
        await this.update();
    }
    async _initializeState() {
        const state = await this._stateService.loadState();
        this._lastViewedPdslFile = state.lastViewedPdslFile;
        this._lastScrollPosition = state.lastScrollPosition;
    }
    async _saveState() {
        const state = {
            lastViewedPdslFile: this._lastViewedPdslFile,
            lastScrollPosition: this._lastScrollPosition
        };
        await this._stateService.saveState(state);
    }
    async _initializePdslFiles() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        const files = await findPdslFiles(workspaceFolder);
        this._pdslFiles = await Promise.all(files.map(async (uri, index) => ({
            id: `pdsl-${index}`,
            path: vscode.workspace.asRelativePath(uri),
            selected: true,
            content: await loadPdslContent(uri)
        })));
    }
    async update() {
        const config = await this._configService.loadConfig();
        const taskGrid = this._taskMatrixView.render(config.taskRunner.categories);
        this._panel.webview.html = this._getHtmlForWebview(taskGrid);
    }
    _getHtmlForWebview(taskGrid) {
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
                        --button-min-width: 100px;
                        --button-height: 60px;
                    }
                    
                    body {
                        padding: var(--grid-gap);
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
                    
                    .pdsl-dropdown {
                        flex: 1;
                        padding: 4px 8px;
                        background: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        border-radius: 4px;
                        display: none;
                    }
                    
                    .pdsl-view .pdsl-dropdown {
                        display: block;
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
                </style>
                <script>
                    const vscode = acquireVsCodeApi();
                    ${this._taskMatrixView.getClientScript()}
                    ${this._pdslView.getClientScript(this._lastScrollPosition, this._lastViewedPdslFile)}
                </script>
            </head>
            <body>
                <nav class="nav-menu">
                    <div class="nav-item active" onclick="switchView('tasks')">Tasks</div>
                    <div class="nav-item" onclick="switchView('pdsl')">PDSL Files</div>
                    <select class="pdsl-dropdown" onchange="showPdslContent(this.value)">
                        <option value="">Select a PDSL file to view</option>
                        ${this._pdslView.renderFileOptions(this._pdslFiles)}
                    </select>
                </nav>
                
                <div class="content-area">
                    <div id="tasks-view" class="view active">
                        <div class="task-matrix-container">
                            ${taskGrid}
                        </div>
                    </div>
                    
                    <div id="pdsl-view" class="view">
                        <div id="pdsl-content-view"></div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    async _executeTask(taskId, command) {
        const terminal = vscode.window.createTerminal(`Task: ${taskId}`);
        terminal.show();
        terminal.sendText(command);
    }
    async _handleGenerateReport() {
        console.log('Generating report...'); // Debug log
        const report = await this._generateStatusReport();
        console.log('Report generated:', report); // Debug log
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: vscode.ViewColumn.Nine,
            preserveFocus: false
        });
    }
    async _handleShowPdslContent(path) {
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
    async _handleSaveScrollPosition(position) {
        this._lastScrollPosition = position;
        await this._saveState();
    }
    async _generateStatusReport() {
        const stats = {
            total: 0,
            done: 0,
            inProgress: 0,
            pending: 0,
            iterations: new Set(),
            recentUpdates: []
        };
        // Analyser PDSL data
        this._pdslFiles.forEach(pdsl => {
            const traverse = (obj, path = []) => {
                if (obj?.status) {
                    stats.total++;
                    const status = obj.status.toLowerCase();
                    if (status === 'done')
                        stats.done++;
                    if (status === 'in_progress')
                        stats.inProgress++;
                    if (status === 'pending')
                        stats.pending++;
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
        return `
            # Project Status Report
            Generated: ${new Date().toLocaleString()}

            ## Overview
            - Total Tasks: ${stats.total}
            - Completed: ${stats.done} (${Math.round(stats.done / stats.total * 100)}%)
            - In Progress: ${stats.inProgress}
            - Pending: ${stats.pending}
            
            ## Iterations
            Total Iterations: ${stats.iterations.size}
            ${Array.from(stats.iterations).join(', ')}

            ## Recent Updates
            ${stats.recentUpdates.slice(-5).map(update => `- ${update.name}: ${update.status} (${update.path})`).join('\n')}
        `;
    }
    dispose() {
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
exports.TaskRunnerPanel = TaskRunnerPanel;
//# sourceMappingURL=TaskRunnerPanel.js.map