import { TaskConfig, CategoryConfig } from '../types';
import { TaskButton } from '../components/TaskButton';
import { ReportButton } from '../components/ReportButton';

export class TaskMatrixView {
    constructor() {}

    public render(categories: { [key: string]: CategoryConfig }): string {
        return `
            <div class="task-matrix-container">
                <div class="header-section">
                    <button class="pdsl-button" onclick="openPdslView()">
                        <i class="codicon codicon-file-code"></i>
                        <span class="button-label">PDSL View</span>
                    </button>
                </div>
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
            @import url("https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css");

            /* Task Matrix Container */
            .task-matrix-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            /* Header Section */
            .header-section {
                margin-bottom: 16px;
            }

            .pdsl-button {
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

            .pdsl-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .pdsl-button .button-label {
                font-weight: 500;
            }

            /* Codicon Styling */
            .codicon {
                font-size: 16px;
                line-height: 16px;
                display: inline-block;
                vertical-align: middle;
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
            .tooltip {
                position: absolute;
                white-space: pre;
                background: var(--vscode-editor-background);
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
                background-color: rgba(30, 30, 30, 0.98);
            }
            
            .task-button:active {
                transform: translateY(0);
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

            function openPdslView() {
                vscode.postMessage({
                    command: 'openPdslView'
                });
            }

            // Intelligent tooltip positionering
            document.querySelectorAll('.task-button').forEach(button => {
                button.addEventListener('mouseenter', (e) => {
                    const tooltip = button.querySelector('.tooltip');
                    if (!tooltip) {
                        const newTooltip = document.createElement('div');
                        newTooltip.className = 'tooltip';
                        newTooltip.textContent = button.getAttribute('data-tooltip');
                        
                        // Tilføj tooltip til container i stedet for knappen
                        const container = document.querySelector('.task-matrix-container');
                        container.appendChild(newTooltip);

                        // Beregn positioner
                        const buttonRect = button.getBoundingClientRect();
                        const tooltipRect = newTooltip.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();

                        // Beregn position relativt til container
                        let top = buttonRect.top - containerRect.top - tooltipRect.height - 8;
                        let left = buttonRect.left - containerRect.left + (buttonRect.width - tooltipRect.width) / 2;

                        // Tjek om tooltip går ud over venstre kant
                        if (left < 8) {
                            left = 8;
                        }
                        
                        // Tjek om tooltip går ud over højre kant
                        if (left + tooltipRect.width > containerRect.width - 8) {
                            left = containerRect.width - tooltipRect.width - 8;
                        }

                        // Tjek om tooltip går ud over top
                        if (top < 8) {
                            // Vis tooltip under knappen i stedet
                            top = buttonRect.top - containerRect.top + buttonRect.height + 8;
                        }

                        newTooltip.style.top = top + 'px';
                        newTooltip.style.left = left + 'px';
                    }
                });

                button.addEventListener('mouseleave', () => {
                    const tooltip = document.querySelector('.tooltip');
                    if (tooltip) {
                        tooltip.remove();
                    }
                });
            });
        `;
    }
} 