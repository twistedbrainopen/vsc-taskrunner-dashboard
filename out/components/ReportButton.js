"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportButton = void 0;
class ReportButton {
    static render() {
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
exports.ReportButton = ReportButton;
//# sourceMappingURL=ReportButton.js.map