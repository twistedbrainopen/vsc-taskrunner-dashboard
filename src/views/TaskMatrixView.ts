import { TaskConfig, CategoryConfig } from '../types';
import { TaskButton } from '../components/TaskButton';
import { ReportButton } from '../components/ReportButton';

export class TaskMatrixView {
    constructor() {}

    public render(categories: { [key: string]: CategoryConfig }): string {
        return `
            <div class="task-matrix-container">
                ${this._renderCategories(categories)}
                ${ReportButton.render()}
            </div>
        `;
    }

    private _renderCategories(categories: { [key: string]: CategoryConfig }): string {
        return Object.entries(categories)
            .map(([key, category]) => `
                <div class="category-section">
                    <div class="task-grid">
                        ${category.tasks.map(task => TaskButton.render(task)).join('')}
                    </div>
                </div>
            `)
            .join('');
    }

    public getStyles(): string {
        return `
            /* Task Matrix Container */
            .task-matrix-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            /* Category Styling */
            .category-section {
                margin-bottom: 4px;
                padding: 4px;
                position: relative;
            }

            /* Task Grid */
            .task-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                align-items: start;
                position: relative;
            }
            
            /* Task Button */
            .task-button {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                width: 32px;
                padding: 6px;
                border: none;
                border-radius: 4px;
                color: var(--vscode-button-foreground);
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .task-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            /* Custom Tooltip */
            .task-button:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                white-space: pre;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                border: 1px solid var(--vscode-panel-border);
                z-index: 100000;
                min-width: 150px;
                max-width: 250px;
                text-align: left;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                pointer-events: none;
                margin-bottom: 8px;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                background: rgba(30, 30, 30, 0.95);
            }

            /* Ensure tooltip stays within viewport */
            .task-button:first-child:hover::after {
                left: 0;
                transform: none;
            }

            .task-button:last-child:hover::after {
                left: auto;
                right: 0;
                transform: none;
            }

            .task-button:active {
                transform: translateY(0);
            }
            
            .task-icon {
                font-size: 14px;
            }

            /* Report Section */
            .report-section {
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid var(--vscode-panel-border);
            }

            .report-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                height: 32px;
                padding: 0 12px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
            }

            .report-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .report-button .task-icon {
                font-size: 14px;
            }

            .report-button .task-label {
                font-weight: 500;
            }

            /* Responsive Design */
            @media (max-width: 600px) {
                .task-grid {
                    justify-content: flex-start;
                }
            }
        `;
    }

    public getClientScript(): string {
        return `
            function handleTaskClick(taskId, command) {
                vscode.postMessage({
                    command: taskId === 'generate-report' ? 'generateReport' : 'runTask',
                    taskId: taskId,
                    taskCommand: command
                });
            }

            // Track mouse position for tooltips
            document.addEventListener('mousemove', function(e) {
                document.documentElement.style.setProperty('--tooltip-x', e.clientX + 'px');
                document.documentElement.style.setProperty('--tooltip-y', e.clientY + 'px');
            });
        `;
    }
} 