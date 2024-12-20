import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Importer hjælpefunktioner
async function findPdslFiles(workspaceFolder: vscode.WorkspaceFolder): Promise<vscode.Uri[]> {
    const pattern = new vscode.RelativePattern(workspaceFolder, '**/.ai-assist/*.pdsl');
    return await vscode.workspace.findFiles(pattern);
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

interface StatusStats {
    total: number;
    done: number;
    inProgress: number;
    pending: number;
    iterations: Set<string>;
    recentUpdates: Array<{
        name: string;
        status: string;
        path: string;
    }>;
}

interface GitCommit {
    message: string;
    hash: string;
    author: string;
}

interface PdslFile {
    id: string;
    path: string;
    selected: boolean;
    content: any;
}

interface PdslValue {
    status?: string;
    name?: string;
    tasks?: string[];
    [key: string]: any;
}

export class TaskRunnerPanel {
    public static currentPanel: TaskRunnerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _pdslFiles: PdslFile[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        
        // Initialiser PDSL files
        this.initializePdslFiles();
        
        // Start med at opdatere panelet
        this.update();

        // Lyt efter WebView beskeder
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'runTask':
                        await this._executeTask(message.taskId);
                        break;
                    case 'generateReport':
                        console.log('Generating report...'); // Debug log
                        const report = await this._generateStatusReport();
                        console.log('Report generated:', report); // Debug log
                        
                        // Vis rapport i en garanteret ny tab
                        const doc = await vscode.workspace.openTextDocument({
                            content: report,
                            language: 'markdown'
                        });
                        await vscode.window.showTextDocument(doc, {
                            preview: false,
                            viewColumn: vscode.ViewColumn.Nine,
                            preserveFocus: false
                        });
                        break;
                    case 'refreshTasks':
                        await this.update();
                        break;
                    case 'showPdslContent':
                        const selectedFile = this._pdslFiles.find(f => f.path === message.path);
                        if (selectedFile) {
                            const formattedContent = this._formatPdslContent(selectedFile.content);
                            this._panel.webview.postMessage({
                                command: 'updatePdslView',
                                content: formattedContent
                            });
                        }
                        break;
                }
            },
            null,
            this._disposables
        );

        // Lyt efter panel lukning
        this._panel.onDidDispose(
            () => this.dispose(),
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TaskRunnerPanel.currentPanel) {
            TaskRunnerPanel.currentPanel._panel.reveal(column);
            TaskRunnerPanel.currentPanel.update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskRunner',
            'Task Runner Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(panel, extensionUri);
    }

    public async update() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        // Genindlæs PDSL filer
        const pdslFiles = await findPdslFiles(workspaceFolder);
        this._pdslFiles = await Promise.all(
            pdslFiles.map(async (uri, index) => ({
                id: `pdsl-${index}`,
                path: vscode.workspace.asRelativePath(uri),
                selected: true,
                content: await loadPdslContent(uri)
            }))
        );

        // Opdater webview med både config og PDSL data
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _formatPdslContent(content: any): string {
        const getStatusBadge = (status: string): string => {
            const statusColors: { [key: string]: string } = {
                'DONE': '#4EC9B0',      // Blød grøn
                'IN_PROGRESS': '#007ACC', // VSCode blå
                'PENDING': '#CF9178'      // Varm orange
            };
            const color = statusColors[status] || 'var(--vscode-badge-foreground)';
            return `
                <span class="status-badge" style="
                    background-color: ${color};
                    color: #000;
                    padding: 2px 8px;
                    border-radius: 4px;
                    float: right;
                    font-size: 12px;
                    font-weight: 500;
                ">${status}</span>
            `;
        };

        const formatValue = (value: any, level: number = 0): string => {
            if (Array.isArray(value)) {
                return `
                    <ul class="pdsl-list" style="
                        list-style-type: disc;
                        padding-left: 20px;
                        margin: 8px 0;
                    ">
                        ${value.map(item => `
                            <li style="
                                color: var(--vscode-foreground);
                                margin: 4px 0;
                            ">${item}</li>
                        `).join('')}
                    </ul>
                `;
            }
            
            if (typeof value === 'object' && value !== null) {
                return Object.entries(value)
                    .map(entry => {
                        const [key, val] = entry;
                        const pdslVal = val as PdslValue;
                        const status = pdslVal?.status || '';
                        const statusBadge = status ? getStatusBadge(status) : '';
                        
                        // Automatisk fold baseret på status
                        const shouldFold = status === 'DONE' || status === 'PENDING';
                        const uniqueId = `section-${level}-${key}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        if (typeof val === 'object' && val !== null) {
                            return `
                                <div class="pdsl-section" data-level="${level}" data-status="${status}">
                                    <div class="section-header" 
                                         style="
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                            padding: 8px;
                                            margin-left: ${level * 16}px;
                                            background-color: ${shouldFold ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};
                                         "
                                    >
                                        <div style="display: flex; align-items: center;">
                                            <div class="fold-toggle" 
                                                 onclick="toggleFold(this)"
                                                 style="
                                                    cursor: pointer;
                                                    width: 20px;
                                                    height: 20px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    margin-right: 4px;
                                                 "
                                            >
                                                <span class="fold-icon">${shouldFold ? '▶' : '▼'}</span>
                                            </div>
                                            <span style="
                                                color: ${level === 0 ? '#4EC9B0' : '#007ACC'};
                                                font-weight: ${level === 0 ? '600' : '500'};
                                                font-size: ${level === 0 ? '18px' : '16px'};
                                                ${status === 'DONE' ? 'text-decoration: line-through;' : ''}
                                            ">${key}:</span>
                                        </div>
                                        ${statusBadge}
                                    </div>
                                    <div class="section-content" style="display: ${shouldFold ? 'none' : 'block'};">
                                        ${formatValue(val, level + 1)}
                                    </div>
                                </div>
                            `;
                        }
                        
                        return `
                            <div class="pdsl-item" style="
                                margin-left: ${level * 16}px;
                                ${status === 'DONE' ? 'text-decoration: line-through; opacity: 0.7;' : ''}
                            ">
                                <span style="color: var(--vscode-foreground); opacity: 0.8;">
                                    ${key}:
                                </span>
                                <span style="margin-left: 8px; color: var(--vscode-foreground);">
                                    ${val}
                                </span>
                            </div>
                        `;
                    })
                    .join('\n');
            }
            
            return `<span style="color: var(--vscode-foreground)">${String(value)}</span>`;
        };

        return `
            <style>
                .fold-toggle {
                    border-radius: 3px;
                    transition: background-color 0.2s;
                }
                .fold-toggle:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .fold-icon {
                    user-select: none;
                }
                .section-header {
                    transition: all 0.2s;
                }
                .section-header:hover {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                .pdsl-section[data-status="DONE"] .section-header {
                    opacity: 0.7;
                }
                .pdsl-section[data-status="PENDING"] .section-header {
                    opacity: 0.5;
                }
            </style>
            <div class="pdsl-content">
                ${formatValue(content)}
            </div>
            <script>
                function toggleFold(element) {
                    const section = element.closest('.pdsl-section');
                    const content = section.querySelector('.section-content');
                    const icon = element.querySelector('.fold-icon');
                    
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.textContent = '▼';
                    } else {
                        content.style.display = 'none';
                        icon.textContent = '▶';
                    }
                }
            </script>
        `;
    }

    private _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Global funktion til fold/unfold
                    window.toggleFold = function(element) {
                        const section = element.closest('.pdsl-section');
                        const content = section.querySelector('.section-content');
                        const icon = element.querySelector('.fold-icon');
                        
                        if (content.style.display === 'none') {
                            content.style.display = 'block';
                            icon.textContent = '▼';
                        } else {
                            content.style.display = 'none';
                            icon.textContent = '▶';
                        }
                    };

                    // Lyt efter beskeder fra extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updatePdslView':
                                document.getElementById('pdsl-content-view').innerHTML = message.content;
                                break;
                        }
                    });

                    // Switch view funktion
                    window.switchView = function(viewName) {
                        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                        
                        document.getElementById(viewName + '-view').classList.add('active');
                        document.querySelector(\`[onclick="switchView('\${viewName}')"]\`).classList.add('active');
                        
                        const dropdown = document.querySelector('.pdsl-dropdown');
                        dropdown.style.display = viewName === 'pdsl' ? 'block' : 'none';
                    };

                    // Show PDSL content funktion
                    window.showPdslContent = function(path) {
                        if (!path) return;
                        vscode.postMessage({
                            command: 'showPdslContent',
                            path: path
                        });
                    };
                </script>
                <style>
                    :root {
                        --grid-gap: 12px;
                        --card-radius: 6px;
                    }
                    
                    body {
                        padding: var(--grid-gap);
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                        background: var(--vscode-editor-background);
                    }
                    
                    .task-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: var(--grid-gap);
                        padding: var(--grid-gap);
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .category-section {
                        background: var(--vscode-sideBar-background);
                        border-radius: var(--card-radius);
                        padding: var(--grid-gap);
                        border: 1px solid var(--vscode-panel-border);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .category-title {
                        font-size: 13px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: var(--vscode-foreground);
                        padding-bottom: 8px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .task-button {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 8px 12px;
                        margin: 6px 0;
                        border: none;
                        border-radius: 4px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-size: 12px;
                    }
                    
                    .task-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    
                    .task-button:active {
                        transform: translateY(0);
                    }
                    
                    .task-icon {
                        font-size: 16px;
                        margin-right: 8px;
                        opacity: 0.9;
                    }
                    
                    .task-label {
                        flex: 1;
                        text-align: left;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .pdsl-selector {
                        position: fixed;
                        top: 0;
                        right: 0;
                        background: var(--vscode-editor-background);
                        padding: 12px;
                        border-left: 1px solid var(--vscode-panel-border);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        border-bottom-left-radius: var(--card-radius);
                        box-shadow: -2px 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .pdsl-selector-toggle {
                        position: fixed;
                        top: 12px;
                        right: 12px;
                        padding: 6px;
                        background: var(--vscode-button-background);
                        border: none;
                        border-radius: 4px;
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        z-index: 1000;
                    }
                    
                    .pdsl-file-list {
                        max-height: 300px;
                        overflow-y: auto;
                        margin-top: 8px;
                    }
                    
                    .pdsl-file-item {
                        display: flex;
                        align-items: center;
                        padding: 4px 0;
                    }
                    
                    .pdsl-checkbox {
                        margin-right: 8px;
                    }
                    
                    .pdsl-filename {
                        font-size: 12px;
                        color: var(--vscode-foreground);
                    }
                    
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
                </style>
            </head>
            <body>
                <nav class="nav-menu">
                    <div class="nav-item active" onclick="switchView('tasks')">Tasks</div>
                    <div class="nav-item" onclick="switchView('pdsl')">PDSL Files</div>
                    <select class="pdsl-dropdown" onchange="showPdslContent(this.value)">
                        <option value="">Select a PDSL file to view</option>
                        ${this._renderPdslFileOptions()}
                    </select>
                </nav>
                
                <div class="content-area">
                    <div id="tasks-view" class="view active">
                        <div class="task-grid">
                            ${this._renderTaskGrid()}
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

    private _renderTaskGrid(): string {
        const config = {
            taskRunner: {
                categories: {
                    "status": {
                        name: "Status",
                        tasks: [
                            {
                                id: "generate-report",
                                label: "Generate Report",
                                command: "generateReport",
                                icon: "graph",
                                color: "#CF9178"
                            }
                        ]
                    },
                    "build": {
                        name: "Build",
                        tasks: [
                            {
                                id: "build",
                                label: "Build Project",
                                command: "npm run build",
                                icon: "package",
                                color: "#4EC9B0"
                            }
                        ]
                    },
                    "test": {
                        name: "Test",
                        tasks: [
                            {
                                id: "test",
                                label: "Run Tests",
                                command: "npm test",
                                icon: "beaker",
                                color: "#007ACC"
                            }
                        ]
                    }
                }
            }
        };

        return Object.entries(config.taskRunner.categories)
            .map(([categoryId, category]: [string, any]) => `
                <div class="category-section">
                    <div class="category-title">${category.name}</div>
                    ${category.tasks.map((task: any) => `
                        <button 
                            class="task-button" 
                            onclick="handleTaskClick('${task.id}', '${task.command}')"
                            style="background-color: ${task.color}"
                            title="${task.label}"
                        >
                            <span class="task-icon">${this._getIconHtml(task.icon)}</span>
                            <span class="task-label">${task.label}</span>
                        </button>
                    `).join('')}
                </div>
            `).join('');
    }

    private _getIconHtml(iconName: string): string {
        const icons: { [key: string]: string } = {
            'debug': '🐛',
            'package': '📦',
            'beaker': '🧪',
            'checklist': '✅',
            'graph': '📊'
        };
        return icons[iconName] || '▶️';
    }

    private async _loadConfig(): Promise<any> {
        if (!vscode.workspace.workspaceFolders) {
            return null;
        }

        // Ændret sti til at pege på .vscode mappen
        const configPath = path.join(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            '.vscode',
            'task-runner.config.json'
        );

        try {
            const configContent = await fs.promises.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            vscode.window.showErrorMessage('Kunne ikke indlæse task runner config fra .vscode mappe');
            return {
                taskRunner: {
                    categories: {
                        "build": {
                            name: "Build",
                            tasks: [
                                {
                                    id: "build",
                                    label: "Build Project",
                                    command: "npm run build",
                                    icon: "package",
                                    color: "#4EC9B0"
                                }
                            ]
                        },
                        "test": {
                            name: "Test",
                            tasks: [
                                {
                                    id: "test",
                                    label: "Run Tests",
                                    command: "npm test",
                                    icon: "beaker",
                                    color: "#007ACC"
                                }
                            ]
                        }
                    }
                }
            };
        }
    }

    private async _executeTask(taskId: string) {
        const config = await this._loadConfig();
        let task: any;

        // Find task i konfigurationen
        for (const category of Object.values(config.taskRunner.categories)) {
            const found = (category as any).tasks.find((t: any) => t.id === taskId);
            if (found) {
                task = found;
                break;
            }
        }

        if (!task) {
            vscode.window.showErrorMessage(`Task ${taskId} not found`);
            return;
        }

        // Kør kommandoen
        const terminal = vscode.window.createTerminal(`Task: ${task.label}`);
        terminal.show();
        terminal.sendText(task.command);

        // Send besked til WebView
        this._panel.webview.postMessage({
            type: 'taskOutput',
            taskId: taskId,
            output: `Running: ${task.command}`
        });

        // Simuler task completion (i en rigtig implementation ville vi vente på terminalen)
        setTimeout(() => {
            this._panel.webview.postMessage({
                type: 'taskComplete',
                taskId: taskId
            });
        }, 1000);
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

        return `
            # Project Status Report
            Generated: ${new Date().toLocaleString()}

            ## Overview
            - Total Tasks: ${stats.total}
            - Completed: ${stats.done} (${Math.round(stats.done/stats.total*100)}%)
            - In Progress: ${stats.inProgress}
            - Pending: ${stats.pending}
            
            ## Iterations
            Total Iterations: ${stats.iterations.size}
            ${Array.from(stats.iterations).join(', ')}

            ## Recent Updates
            ${stats.recentUpdates.slice(-5).map(update => 
                `- ${update.name}: ${update.status} (${update.path})`
            ).join('\n')}
        `;
    }

    private async _updatePDSLStatus(status: string): Promise<void> {
        // Implementation af PDSL status opdatering
        // Dette skal implementeres baseret på hvordan vi vil opdatere PDSL filerne
        console.log(`Updating PDSL status to: ${status}`);
    }

    private async _updateFromGit(): Promise<void> {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0];
            
            if (repo) {
                const commits = await repo.log();
                const recentCommits = commits.slice(0, 5);
                
                // Analysér commits for status updates
                recentCommits.forEach((commit: GitCommit) => {
                    const statusMatches = commit.message.match(/\[(DONE|IN_PROGRESS|PENDING)\]/);
                    if (statusMatches) {
                        // Opdater relevant PDSL status
                        this._updatePDSLStatus(statusMatches[1]);
                    }
                });
            }
        }
    }

    private _renderPdslFileList(): string {
        return this._pdslFiles.map((file: PdslFile) => `
            <div class="pdsl-file-item">
                <input 
                    type="checkbox" 
                    class="pdsl-checkbox"
                    id="pdsl-${file.id}"
                    ${file.selected ? 'checked' : ''}
                    onchange="togglePdslFile('${file.path}')"
                >
                <label class="pdsl-filename" for="pdsl-${file.id}">
                    ${file.path}
                </label>
            </div>
        `).join('');
    }

    private async findAllPdslFiles(): Promise<vscode.Uri[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return [];
        
        return await vscode.workspace.findFiles('**/*.pdsl', '**/node_modules/**');
    }

    private async initializePdslFiles(): Promise<void> {
        const files = await this.findAllPdslFiles();
        this._pdslFiles = await Promise.all(
            files.map(async (uri, index) => ({
                id: `pdsl-${index}`,
                path: vscode.workspace.asRelativePath(uri),
                selected: true,
                content: await loadPdslContent(uri)
            }))
        );
    }

    private _renderPdslFileOptions(): string {
        return this._pdslFiles
            .filter(file => file.selected)
            .map(file => `
                <option value="${file.path}">
                    ${file.path}
                </option>
            `).join('');
    }
}
