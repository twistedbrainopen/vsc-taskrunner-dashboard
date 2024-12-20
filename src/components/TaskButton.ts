import { TaskConfig } from '../types';
import { getIconHtml } from '../utils/iconUtils';

export class TaskButton {
    private static _getTooltipText(task: TaskConfig): string {
        const parts = [];
        parts.push(task.label);
        if (task.tooltip) {
            parts.push(task.tooltip);
        }
        return parts.join('\n');
    }

    public static render(task: TaskConfig): string {
        const tooltipText = this._getTooltipText(task);
        return `
            <button 
                class="task-button" 
                onclick="handleTaskClick('${task.id}', '${task.command}')"
                style="background-color: ${task.color}"
                data-tooltip="${tooltipText}"
            >
                <span class="task-icon">${getIconHtml(task.icon)}</span>
            </button>
        `;
    }
} 