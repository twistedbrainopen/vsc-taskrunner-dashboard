"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskButton = void 0;
const iconUtils_1 = require("../utils/iconUtils");
class TaskButton {
    static _getTooltipText(task) {
        const parts = [];
        parts.push(task.label);
        if (task.tooltip) {
            parts.push(task.tooltip);
        }
        return parts.join('\n');
    }
    static render(task) {
        const tooltipText = this._getTooltipText(task);
        return `
            <button 
                class="task-button" 
                onclick="handleTaskClick('${task.id}', '${task.command}')"
                style="background-color: ${task.color}"
                data-tooltip="${tooltipText}"
            >
                <span class="task-icon">${(0, iconUtils_1.getIconHtml)(task.icon)}</span>
            </button>
        `;
    }
}
exports.TaskButton = TaskButton;
//# sourceMappingURL=TaskButton.js.map