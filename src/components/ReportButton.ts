import { TaskConfig } from '../types';
import { getIconHtml } from '../utils/iconUtils';

export class ReportButton {
    public static render(): string {
        return `
            <div class="report-section">
                <button class="report-button" onclick="handleTaskClick('generate-report', '')">
                    <i class="codicon codicon-graph"></i>
                    <span class="task-label">Generate Report</span>
                </button>
            </div>
        `;
    }
} 