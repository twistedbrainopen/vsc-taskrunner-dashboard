"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerPanel = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
// Importer hjælpefunktioner
async function findPdslFiles(workspaceFolder) {
    const pattern = new vscode.RelativePattern(workspaceFolder, '**/.ai-assist/*.pdsl');
    return await vscode.workspace.findFiles(pattern);
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
class TaskRunnerPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._pdslFiles = [];
        this._lastScrollPosition = 0;
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Gendan state fra fil
        this.loadState().then(state => {
            this._lastViewedPdslFile = state.lastViewedPdslFile;
            this._lastScrollPosition = state.lastScrollPosition;
            this.update(); // Opdater view med gendannet state
        });
        // Initialiser PDSL files
        this.initializePdslFiles();
        // Start med at opdatere panelet
        this.update();
        // Lyt efter WebView beskeder
        this._panel.webview.onDidReceiveMessage(async (message) => {
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
                        this._lastViewedPdslFile = message.path;
                        await this.saveState();
                        const formattedContent = this._formatPdslContent(selectedFile.content);
                        this._panel.webview.postMessage({
                            command: 'updatePdslView',
                            content: formattedContent,
                            scrollPosition: this._lastScrollPosition
                        });
                    }
                    break;
                case 'saveScrollPosition':
                    this._lastScrollPosition = message.position;
                    await this.saveState();
                    break;
            }
        }, null, this._disposables);
        // Lyt efter panel lukning
        this._panel.onDidDispose(async () => {
            await this.saveState();
            this.dispose();
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (TaskRunnerPanel.currentPanel) {
            TaskRunnerPanel.currentPanel._panel.reveal(column);
            TaskRunnerPanel.currentPanel.update();
            return;
        }
        const panel = vscode.window.createWebviewPanel('taskRunner', 'Task Runner Dashboard', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri],
            retainContextWhenHidden: true // Behold webview state når panel er skjult
        });
        TaskRunnerPanel.currentPanel = new TaskRunnerPanel(panel, extensionUri);
    }
    async update() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        // Genindlæs PDSL filer
        const pdslFiles = await findPdslFiles(workspaceFolder);
        this._pdslFiles = await Promise.all(pdslFiles.map(async (uri, index) => ({
            id: `pdsl-${index}`,
            path: vscode.workspace.asRelativePath(uri),
            selected: true,
            content: await loadPdslContent(uri)
        })));
        // Opdater webview med både config og PDSL data
        const taskGrid = await this._renderTaskGrid();
        this._panel.webview.html = this._getHtmlForWebview(taskGrid);
    }
    _formatPdslContent(content) {
        const getStatusBadge = (status) => {
            const statusColors = {
                'DONE': '#4EC9B0',
                'IN_PROGRESS': '#007ACC',
                'PENDING': '#CF9178' // Varm orange
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
        const formatValue = (value, level = 0) => {
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
                    const pdslVal = val;
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
        `;
    }
    _getHtmlForWebview(taskGrid = '') {
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

                    /* Task Matrix Styles */
                    .task-matrix-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: var(--grid-gap);
                    }

                    .task-matrix {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: var(--grid-gap);
                        margin-bottom: 20px;
                    }

                    @media (max-width: 1000px) {
                        .task-matrix {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }

                    @media (max-width: 700px) {
                        .task-matrix {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    
                    .task-button {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: var(--button-height);
                        padding: 12px;
                        border: none;
                        border-radius: var(--card-radius);
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                    }
                    
                    .task-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .task-button:active {
                        transform: translateY(0);
                    }
                    
                    .task-icon {
                        font-size: 24px;
                        margin-bottom: 8px;
                    }
                    
                    .task-label {
                        font-size: 12px;
                        font-weight: 500;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        width: 100%;
                    }

                    .report-section {
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid var(--vscode-panel-border);
                    }

                    .report-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 200px;
                        margin: 0 auto;
                        padding: 10px 20px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: var(--card-radius);
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .report-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }

                    .report-button .task-icon {
                        margin: 0 8px 0 0;
                        font-size: 16px;
                    }

                    /* PDSL View Styles */
                    #pdsl-content-view {
                        height: calc(100vh - 60px);
                        overflow-y: auto;
                        padding: 20px;
                    }
                </style>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Initialiser state
                    const state = {
                        scrollPosition: ${this._lastScrollPosition},
                        currentFile: '${this._lastViewedPdslFile || ''}'
                    };

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
                                const contentView = document.getElementById('pdsl-content-view');
                                contentView.innerHTML = message.content;
                                // Vent på at indholdet er renderet før vi scroller
                                setTimeout(() => {
                                    contentView.scrollTop = state.scrollPosition;
                                }, 100);
                                break;
                        }
                    });

                    function switchView(viewName) {
                        const contentView = document.getElementById('pdsl-content-view');
                        
                        if (viewName === 'tasks') {
                            // Gem scroll position før vi skifter væk
                            state.scrollPosition = contentView.scrollTop;
                            vscode.postMessage({
                                command: 'saveScrollPosition',
                                position: state.scrollPosition
                            });
                        }

                        document.querySelectorAll('.view').forEach(view => {
                            view.classList.remove('active');
                        });
                        document.querySelectorAll('.nav-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        
                        document.getElementById(viewName + '-view').classList.add('active');
                        document.querySelector('.nav-item[onclick*="' + viewName + '"]').classList.add('active');
                        
                        // Vis/skjul PDSL dropdown
                        document.body.classList.toggle('pdsl-view', viewName === 'pdsl');

                        if (viewName === 'pdsl') {
                            // Gendan scroll position når vi kommer tilbage
                            if (state.currentFile) {
                                const pdslSelect = document.querySelector('.pdsl-dropdown');
                                pdslSelect.value = state.currentFile;
                                showPdslContent(state.currentFile);
                                setTimeout(() => {
                                    contentView.scrollTop = state.scrollPosition;
                                }, 100);
                            }
                        }
                    }

                    function handleTaskClick(taskId, command) {
                        vscode.postMessage({
                            command: taskId === 'generate-report' ? 'generateReport' : 'runTask',
                            taskId: taskId,
                            taskCommand: command
                        });
                    }

                    function showPdslContent(path) {
                        if (!path) return;
                        state.currentFile = path;
                        vscode.postMessage({
                            command: 'showPdslContent',
                            path: path
                        });
                    }

                    // Scroll event handler med debounce
                    let scrollTimeout;
                    document.addEventListener('DOMContentLoaded', () => {
                        const contentView = document.getElementById('pdsl-content-view');
                        if (contentView) {
                            contentView.addEventListener('scroll', function() {
                                clearTimeout(scrollTimeout);
                                scrollTimeout = setTimeout(() => {
                                    state.scrollPosition = this.scrollTop;
                                    vscode.postMessage({
                                        command: 'saveScrollPosition',
                                        position: state.scrollPosition
                                    });
                                }, 100);
                            });
                        }

                        // Initialiser dropdown hvis der er en gemt fil
                        const pdslSelect = document.querySelector('.pdsl-dropdown');
                        if (state.currentFile) {
                            pdslSelect.value = state.currentFile;
                            showPdslContent(state.currentFile);
                        }
                    });
                </script>
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
    async _renderTaskGrid() {
        // Separer rapport task fra andre tasks
        const reportTask = {
            id: "generate-report",
            label: "Generate Report",
            command: "generateReport",
            icon: "graph",
            color: "#CF9178"
        };
        // Saml alle andre tasks i en flad liste
        const config = await this._loadConfig();
        const allTasks = Object.values(config?.taskRunner?.categories || {})
            .flatMap(category => category.tasks || [])
            .filter(task => task.id !== 'generate-report');
        return `
            <div class="task-matrix">
                ${allTasks.map(task => `
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
            <div class="report-section">
                <button 
                    class="report-button"
                    onclick="handleTaskClick('${reportTask.id}', '${reportTask.command}')"
                    title="${reportTask.label}"
                >
                    <span class="task-icon">${this._getIconHtml(reportTask.icon)}</span>
                    <span class="task-label">${reportTask.label}</span>
                </button>
            </div>
        `;
    }
    _getIconHtml(iconName) {
        const icons = {
            'debug': '🐛',
            'package': '📦',
            'beaker': '🧪',
            'checklist': '✅',
            'graph': '📊'
        };
        return icons[iconName] || '▶️';
    }
    async _loadConfig() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {
                taskRunner: {
                    categories: {}
                }
            };
        }
        const configPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'task-runner.config.json');
        try {
            const configContent = await fs.promises.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        }
        catch (error) {
            return {
                taskRunner: {
                    categories: {}
                }
            };
        }
    }
    async _executeTask(taskId) {
        const config = await this._loadConfig();
        let task;
        // Find task i konfigurationen
        for (const category of Object.values(config.taskRunner.categories)) {
            const found = category.tasks.find((t) => t.id === taskId);
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
    async _updatePDSLStatus(status) {
        // Implementation af PDSL status opdatering
        // Dette skal implementeres baseret på hvordan vi vil opdatere PDSL filerne
        console.log(`Updating PDSL status to: ${status}`);
    }
    async _updateFromGit() {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0];
            if (repo) {
                const commits = await repo.log();
                const recentCommits = commits.slice(0, 5);
                // Analysér commits for status updates
                recentCommits.forEach((commit) => {
                    const statusMatches = commit.message.match(/\[(DONE|IN_PROGRESS|PENDING)\]/);
                    if (statusMatches) {
                        // Opdater relevant PDSL status
                        this._updatePDSLStatus(statusMatches[1]);
                    }
                });
            }
        }
    }
    _renderPdslFileList() {
        return this._pdslFiles.map((file) => `
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
    async findAllPdslFiles() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return [];
        return await vscode.workspace.findFiles('**/*.pdsl', '**/node_modules/**');
    }
    async initializePdslFiles() {
        const files = await this.findAllPdslFiles();
        this._pdslFiles = await Promise.all(files.map(async (uri, index) => ({
            id: `pdsl-${index}`,
            path: vscode.workspace.asRelativePath(uri),
            selected: true,
            content: await loadPdslContent(uri)
        })));
    }
    _renderPdslFileOptions() {
        return this._pdslFiles
            .filter(file => file.selected)
            .map(file => `
                <option value="${file.path}">
                    ${file.path}
                </option>
            `).join('');
    }
    async loadState() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { lastScrollPosition: 0 };
        }
        const statePath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'task-runner-state.json');
        try {
            const content = await fs.promises.readFile(statePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            return { lastScrollPosition: 0 };
        }
    }
    async saveState() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return;
        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const statePath = path.join(vscodeDir, 'task-runner-state.json');
        try {
            // Sikr at .vscode mappe eksisterer
            await fs.promises.mkdir(vscodeDir, { recursive: true });
            const state = {
                lastViewedPdslFile: this._lastViewedPdslFile,
                lastScrollPosition: this._lastScrollPosition
            };
            await fs.promises.writeFile(statePath, JSON.stringify(state, null, 2));
        }
        catch (error) {
            console.error('Kunne ikke gemme task runner state:', error);
        }
    }
}
exports.TaskRunnerPanel = TaskRunnerPanel;
//# sourceMappingURL=TaskRunnerPanel.js.map