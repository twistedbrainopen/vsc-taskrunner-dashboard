"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskMatrixView = void 0;
const iconUtils_1 = require("../utils/iconUtils");
class TaskMatrixView {
    constructor() {
        this._reportTask = {
            id: "generate-report",
            label: "Generate Report",
            command: "generateReport",
            icon: "graph",
            color: "#CF9178"
        };
    }
    render(categories) {
        return `
            <div class="task-matrix-container">
                ${this._renderCategories(categories)}
                ${this._renderReportSection()}
            </div>
        `;
    }
    _renderCategories(categories) {
        return Object.entries(categories)
            .map(([key, category]) => `
                <div class="category-section">
                    <h2 class="category-title">${category.label}</h2>
                    <div class="task-grid">
                        ${category.tasks.map(task => this._renderTaskButton(task)).join('')}
                    </div>
                </div>
            `)
            .join('');
    }
    _renderTaskButton(task) {
        return `
            <button 
                class="task-button" 
                onclick="handleTaskClick('${task.id}', '${task.command}')"
                style="background-color: ${task.color}"
                title="${task.tooltip || task.label}"
            >
                <span class="task-icon">${(0, iconUtils_1.getIconHtml)(task.icon)}</span>
                <span class="task-label">${task.label}</span>
            </button>
        `;
    }
    _renderReportSection() {
        return `
            <div class="report-section">
                <button 
                    class="report-button"
                    onclick="handleTaskClick('${this._reportTask.id}', '${this._reportTask.command}')"
                    title="${this._reportTask.label}"
                >
                    <span class="task-icon">${(0, iconUtils_1.getIconHtml)(this._reportTask.icon)}</span>
                    <span class="task-label">${this._reportTask.label}</span>
                </button>
            </div>
        `;
    }
    getStyles() {
        return `
            /* Task Matrix Container */
            .task-matrix-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: var(--grid-gap);
            }

            /* Category Styling */
            .category-section {
                margin-bottom: 16px;
                background: var(--vscode-editor-background);
                border-radius: 6px;
                padding: 12px;
            }

            .category-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            /* Task Grid */
            .task-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 8px;
                margin-bottom: 12px;
            }
            
            /* Task Button */
            .task-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 50px;
                padding: 8px;
                border: none;
                border-radius: 4px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
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
                margin-bottom: 4px;
            }
            
            .task-label {
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            }

            /* Report Section */
            .report-section {
                margin-top: 32px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border);
                text-align: center;
            }

            .report-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 200px;
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

            /* Responsive Design */
            @media (max-width: 1200px) {
                .task-grid {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                }
            }

            @media (max-width: 768px) {
                .task-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }
            }
        `;
    }
    getClientScript() {
        return `
            function handleTaskClick(taskId, command) {
                vscode.postMessage({
                    command: taskId === 'generate-report' ? 'generateReport' : 'runTask',
                    taskId: taskId,
                    taskCommand: command
                });
            }
        `;
    }
}
exports.TaskMatrixView = TaskMatrixView;
//# sourceMappingURL=TaskMatrixView.js.map