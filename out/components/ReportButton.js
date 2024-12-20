"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportButton = void 0;
const iconUtils_1 = require("../utils/iconUtils");
class ReportButton {
    static render(config = ReportButton.DEFAULT_CONFIG) {
        return `
            <div class="report-section">
                <button 
                    class="report-button"
                    onclick="handleTaskClick('${config.id}', '${config.command}')"
                    title="${config.label}"
                >
                    <span class="task-icon">${(0, iconUtils_1.getIconHtml)(config.icon)}</span>
                    <span class="task-label">Generate Report</span>
                </button>
            </div>
        `;
    }
}
exports.ReportButton = ReportButton;
ReportButton.DEFAULT_CONFIG = {
    id: "generate-report",
    label: "Generate Report",
    command: "generateReport",
    icon: "graph",
    color: "#CF9178"
};
//# sourceMappingURL=ReportButton.js.map