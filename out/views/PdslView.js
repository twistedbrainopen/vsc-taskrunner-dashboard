"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdslView = void 0;
class PdslView {
    constructor() {
        this._statusColors = {
            'DONE': '#4EC9B0',
            'IN_PROGRESS': '#007ACC',
            'PENDING': '#CF9178' // Varm orange
        };
    }
    render(files) {
        return `
            <div class="pdsl-content">
                <select class="pdsl-dropdown" onchange="showPdslContent(this.value)">
                    <option value="">Select a PDSL file to view</option>
                    ${this.renderFileOptions(files)}
                </select>
                <div id="pdsl-content-view"></div>
            </div>
        `;
    }
    renderFileOptions(files) {
        return files
            .filter(file => file.selected)
            .map(file => `
                <option value="${file.path}">
                    ${file.path}
                </option>
            `).join('');
    }
    getClientScript(lastScrollPosition, lastViewedFile) {
        return `
            // Initialiser state
            const state = {
                scrollPosition: ${lastScrollPosition},
                currentFile: '${lastViewedFile || ''}'
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
        `;
    }
    getStyles() {
        return `
            .pdsl-content {
                height: 100%;
            }

            .pdsl-dropdown {
                width: 100%;
                padding: 8px;
                margin-bottom: 16px;
                background: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
                border: 1px solid var(--vscode-dropdown-border);
                border-radius: 4px;
                outline: none;
            }

            #pdsl-content-view {
                height: calc(100vh - 140px);
                overflow-y: auto;
                padding: 16px;
            }

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
        `;
    }
    formatContent(content) {
        return `
            <div class="pdsl-formatted-content">
                ${this._formatValue(content)}
            </div>
        `;
    }
    _getStatusBadge(status) {
        const color = this._statusColors[status] || 'var(--vscode-badge-foreground)';
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
    }
    _formatValue(value, level = 0) {
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
                const statusBadge = status ? this._getStatusBadge(status) : '';
                // Automatisk fold baseret på status
                const shouldFold = status === 'DONE' || status === 'PENDING';
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
                                    ${this._formatValue(val, level + 1)}
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
    }
}
exports.PdslView = PdslView;
//# sourceMappingURL=PdslView.js.map