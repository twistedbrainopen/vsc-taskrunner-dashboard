import { TaskConfig } from '../types';
import { getIconHtml } from '../utils/iconUtils';

export class ReportButton {
    private static readonly DEFAULT_CONFIG: TaskConfig = {
        id: "generate-report",
        label: "Generate Report",
        command: "generateReport",
        icon: "graph",
        color: "#CF9178"
    };

    public static render(config: TaskConfig = ReportButton.DEFAULT_CONFIG): string {
        return `
            <div class="report-section">
                <button 
                    class="report-button"
                    onclick="handleTaskClick('${config.id}', '${config.command}')"
                    title="${config.label}"
                >
                    <span class="task-icon">${getIconHtml(config.icon)}</span>
                    <span class="task-label">Generate Report</span>
                </button>
            </div>
        `;
    }
} 