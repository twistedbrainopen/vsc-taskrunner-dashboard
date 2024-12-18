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

export class TaskRunnerPanel {
    public static currentPanel: TaskRunnerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _pdslContents: any[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, pdslContents: any[]) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._pdslContents = pdslContents;

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

    public static createOrShow(extensionUri: vscode.Uri, pdslContents: any[] = []) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TaskRunnerPanel.currentPanel) {
            TaskRunnerPanel.currentPanel._pdslContents = pdslContents;
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

        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(panel, extensionUri, pdslContents);
    }

    public async update() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        // Genindlæs PDSL filer
        const pdslFiles = await findPdslFiles(workspaceFolder);
        this._pdslContents = await Promise.all(
            pdslFiles.map(async uri => ({
                path: vscode.workspace.asRelativePath(uri),
                content: await loadPdslContent(uri)
            }))
        );

        // Opdater webview med både config og PDSL data
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _formatPdslContent(content: any): string {
        type StatusType = 'DONE' | 'IN_PROGRESS' | 'PENDING';
        
        const getStatusBadge = (obj: any): string => {
            if (obj && obj.status) {
                const statusColors: Record<StatusType, string> = {
                    'DONE': '#4EC9B0',      // Klar grøn
                    'IN_PROGRESS': '#007ACC', // VSCode blå
                    'PENDING': '#CF9178'      // Varm orange
                };
                const status = obj.status as StatusType;
                const color = statusColors[status] || 'var(--vscode-badge-foreground)';
                return `<span class="status-badge" style="background-color: ${color}">${status}</span>`;
            }
            return '';
        };

        const formatValue = (value: any, level: number = 0): string => {
            if (Array.isArray(value)) {
                return `<ul class="dsl-list">
                    ${value.map(item => `<li>${item}</li>`).join('')}
                </ul>`;
            }
            
            if (typeof value === 'object' && value !== null) {
                return Object.entries(value)
                    .map(([key, val]) => {
                        const statusBadge = getStatusBadge(val);
                        const folderId = `fold-${Math.random().toString(36).substr(2, 9)}`;
                        
                        if (level === 0) {
                            return `
                                <div class="dsl-section">
                                    <h2 class="foldable" onclick="toggleFold('${folderId}')">
                                        <span class="fold-icon">▼</span>
                                        <span class="section-title">${key}</span>
                                        ${statusBadge}
                                    </h2>
                                    <div id="${folderId}" class="content">
                                        ${formatValue(val, level + 1)}
                                    </div>
                                </div>`;
                        }
                        if (level === 1) {
                            return `
                                <div class="dsl-subsection">
                                    <h3 class="foldable" onclick="toggleFold('${folderId}')">
                                        <span class="fold-icon">▼</span>
                                        <span class="section-title">${key}</span>
                                        ${statusBadge}
                                    </h3>
                                    <div id="${folderId}" class="content">
                                        ${formatValue(val, level + 1)}
                                    </div>
                                </div>`;
                        }
                        return `
                            <div class="dsl-item">
                                <strong>${key}:</strong>
                                ${typeof val === 'object' ? 
                                    `<div class="nested-content">${formatValue(val, level + 1)}</div>` : 
                                    `<span class="dsl-value">${val}</span>`}
                                ${statusBadge}
                            </div>`;
                    })
                    .join('\n');
            }
            return `<span class="dsl-value">${String(value)}</span>`;
        };

        return `<div class="dsl-content">${formatValue(content)}</div>`;
    }

    private _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Task Runner Dashboard</title>
                <style>
                    body {
                        padding: 0;
                        margin: 0;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .nav-menu {
                        background: var(--vscode-editor-background);
                        padding: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    .main-container {
                        display: flex;
                        flex: 1;
                        overflow: hidden;
                        position: relative;
                    }
                    .task-sidebar {
                        width: 125px;
                        min-width: 80px;
                        max-width: 300px;
                        background: var(--vscode-sideBar-background);
                        border-right: 1px solid var(--vscode-panel-border);
                        overflow-y: auto;
                        padding: 8px;
                        flex-shrink: 0;
                    }
                    .resize-handle {
                        width: 5px;
                        cursor: ew-resize;
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 125px;
                        background: transparent;
                        transition: background 0.2s;
                    }
                    .resize-handle:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }
                    .resize-handle.dragging {
                        background: var(--vscode-scrollbarSlider-activeBackground);
                    }
                    .task-category {
                        margin-bottom: 15px;
                    }
                    .category-title {
                        font-size: 11px;
                        font-weight: bold;
                        padding: 4px;
                        color: var(--vscode-sideBarTitle-foreground);
                        text-transform: uppercase;
                    }
                    .task-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: calc(100% - 4px);
                        height: 28px;
                        margin: 2px;
                        padding: 0;
                        border: none;
                        border-radius: 3px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        overflow: hidden;
                    }
                    .task-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .task-icon {
                        font-size: 14px;
                    }
                    .task-label {
                        display: none;
                        font-size: 11px;
                        margin-left: 4px;
                    }
                    .task-sidebar:hover .task-label {
                        display: inline;
                    }
                    .content-area {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    .nav-menu a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                        padding: 5px 15px;
                        margin: 0 5px;
                        border-radius: 3px;
                    }
                    .nav-menu a:hover {
                        background: var(--vscode-textLink-activeForeground);
                        color: var(--vscode-editor-background);
                    }
                    .controls {
                        position: sticky;
                        top: 42px;
                        background: var(--vscode-editor-background);
                        padding: 8px 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        gap: 8px;
                        z-index: 99;
                    }
                    .control-button {
                        padding: 4px 10px;
                        color: var(--vscode-editor-background);
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .control-button:hover {
                        opacity: 0.9;
                    }
                    .control-button.all {
                        background: var(--vscode-button-background);
                    }
                    .control-button.done {
                        background: #4EC9B0;
                    }
                    .control-button.pending {
                        background: #CF9178;
                    }
                    .control-button.in-progress {
                        background: #007ACC;
                    }
                    .pdsl-file {
                        display: none;
                        padding: 20px;
                    }
                    .pdsl-file.active {
                        display: block;
                    }
                    .pdsl-content {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .section {
                        margin: 10px 0;
                    }
                    h2, h3 {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 0;
                        padding: 8px 0;
                    }
                    h2 {
                        color: var(--vscode-textLink-foreground);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        margin-top: 20px;
                    }
                    h3 {
                        color: var(--vscode-textPreformat-foreground);
                        margin-top: 15px;
                    }
                    .section-item {
                        margin: 8px 0;
                        padding-left: 20px;
                        position: relative;
                    }
                    .section-item strong {
                        color: var(--vscode-symbolIcon-variableForeground);
                    }
                    .status-badge {
                        padding: 2px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        font-weight: bold;
                        color: var(--vscode-editor-background);
                        text-transform: uppercase;
                    }
                    .fold-icon {
                        display: inline-block;
                        margin-right: 8px;
                        transition: transform 0.2s;
                        font-size: 0.8em;
                        color: var(--vscode-textLink-foreground);
                    }
                    .foldable {
                        cursor: pointer;
                        user-select: none;
                    }
                    .foldable:hover {
                        opacity: 0.8;
                    }
                    .folded .fold-icon {
                        transform: rotate(-90deg);
                    }
                    .folded + .content {
                        display: none;
                    }
                    .content {
                        padding-left: 20px;
                    }
                    .dsl-content {
                        font-family: var(--vscode-editor-font-family);
                        line-height: 1.6;
                    }
                    .dsl-section, .dsl-subsection {
                        margin: 1em 0;
                    }
                    .dsl-list {
                        list-style-type: none;
                        padding-left: 1.5em;
                        margin: 0.5em 0;
                    }
                    .dsl-list li {
                        position: relative;
                        padding: 0.2em 0;
                    }
                    .dsl-list li:before {
                        content: "•";
                        color: var(--vscode-textLink-foreground);
                        position: absolute;
                        left: -1em;
                    }
                    .dsl-item {
                        padding: 0.3em 0;
                        margin-left: 1em;
                    }
                    .dsl-value {
                        color: var(--vscode-textPreformat-foreground);
                        margin-left: 0.5em;
                    }
                    .nested-content {
                        margin-left: 1em;
                        margin-top: 0.5em;
                        padding-left: 1em;
                        border-left: 1px solid var(--vscode-panel-border);
                    }
                    .section-title {
                        flex: 1;
                        margin-right: 1em;
                    }
                    .task-page {
                        display: none;
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .task-page.active {
                        display: block;
                    }
                    .task-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    .task-item {
                        display: flex;
                        align-items: center;
                        padding: 12px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .task-item:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .task-icon {
                        font-size: 18px;
                        margin-right: 12px;
                    }
                    .task-content {
                        flex: 1;
                    }
                    .task-title {
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    .task-description {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .task-status {
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .task-actions {
                        display: flex;
                        gap: 8px;
                        margin-left: 12px;
                    }
                    .task-action-button {
                        padding: 4px 8px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    .task-action-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="nav-menu">
                    ${this._pdslContents.map((pdsl, index) => `
                        <a href="#" onclick="showFile(${index})">${path.basename(pdsl.path)}</a>
                    `).join('')}
                </div>
                
                <div class="main-container">
                    <div class="task-sidebar">
                        ${this._renderTaskSidebar()}
                    </div>
                    <div class="resize-handle"></div>
                    <div class="content-area">
                        ${this._pdslContents.map((pdsl, index) => `
                            <div class="pdsl-file" id="file-${index}">
                                <div class="pdsl-content">
                                    ${this._formatPdslContent(pdsl.content)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    let allFolded = false;
                    let statusFoldState = {
                        'DONE': false,
                        'IN_PROGRESS': false,
                        'PENDING': false
                    };

                    function toggleFold(id) {
                        const header = document.querySelector(\`[onclick="toggleFold('\${id}')"\`);
                        header.classList.toggle('folded');
                    }

                    function toggleFoldAll() {
                        allFolded = !allFolded;
                        document.querySelectorAll('.foldable').forEach(header => {
                            if (allFolded) {
                                header.classList.add('folded');
                            } else {
                                header.classList.remove('folded');
                            }
                        });
                    }

                    function toggleByStatus(status) {
                        statusFoldState[status] = !statusFoldState[status];
                        
                        // Find alle sektioner med den givne status
                        document.querySelectorAll('.dsl-section, .dsl-subsection').forEach(section => {
                            const badge = section.querySelector('.status-badge');
                            if (badge && badge.textContent.trim() === status) {
                                const header = section.querySelector('.foldable');
                                if (statusFoldState[status]) {
                                    header.classList.add('folded');
                                } else {
                                    header.classList.remove('folded');
                                }
                            }
                        });

                        // Opdater knappens udseende
                        const button = document.querySelector(\`.control-button.\${status.toLowerCase()}\`);
                        button.textContent = statusFoldState[status] ? 
                            \`Vis \${status}\` : 
                            \`Skjul \${status}\`;
                    }

                    function showFile(index) {
                        document.querySelectorAll('.pdsl-file').forEach(el => {
                            el.classList.remove('active');
                        });
                        document.getElementById('file-' + index).classList.add('active');
                        
                        // Reset status fold state når vi skifter fil
                        statusFoldState = {
                            'DONE': false,
                            'IN_PROGRESS': false,
                            'PENDING': false
                        };
                    }

                    function showTasks() {
                        document.querySelectorAll('.pdsl-file, .task-page').forEach(el => {
                            el.classList.remove('active');
                        });
                        document.getElementById('tasks-view').classList.add('active');
                    }

                    function runTask(taskId) {
                        // Implementer task kørsel her
                    }

                    // Initialiser første visning
                    showFile(0);

                    // Tilføj resize functionality
                    const resizeHandle = document.querySelector('.resize-handle');
                    const sidebar = document.querySelector('.task-sidebar');
                    let isResizing = false;

                    resizeHandle.addEventListener('mousedown', (e) => {
                        isResizing = true;
                        resizeHandle.classList.add('dragging');
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', stopResize);
                        e.preventDefault();
                    });

                    function handleMouseMove(e) {
                        if (!isResizing) return;
                        
                        const newWidth = e.clientX;
                        if (newWidth >= 80 && newWidth <= 300) {
                            sidebar.style.width = newWidth + 'px';
                            resizeHandle.style.left = newWidth + 'px';
                        }
                    }

                    function stopResize() {
                        isResizing = false;
                        resizeHandle.classList.remove('dragging');
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', stopResize);
                    }

                    async function handleTaskClick(taskId, command) {
                        console.log('Task clicked:', taskId, command); // Debug log
                        
                        if (command === 'generateReport') {
                            console.log('Sending generateReport command...'); // Debug log
                            vscode.postMessage({
                                command: 'generateReport'
                            });
                        } else {
                            vscode.postMessage({
                                command: 'runTask',
                                taskId: taskId
                            });
                        }
                    }
                </script>
            </body>
            </html>
        `;
    }

    private _renderTaskSidebar(): string {
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
                <div class="task-category">
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
        this._pdslContents.forEach(pdsl => {
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
}
