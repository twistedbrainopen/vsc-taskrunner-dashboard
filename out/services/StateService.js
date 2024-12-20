"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateService = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
class StateService {
    constructor(_workspaceRoot) {
        this._workspaceRoot = _workspaceRoot;
        this._stateFileName = 'task-runner-state.json';
        this._defaultState = {
            lastScrollPosition: 0
        };
    }
    async loadState() {
        if (!this._workspaceRoot) {
            return this._defaultState;
        }
        const statePath = path.join(this._workspaceRoot, '.vscode', this._stateFileName);
        try {
            const content = await fs.promises.readFile(statePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Fejl ved indlæsning af state:', error);
            return this._defaultState;
        }
    }
    async saveState(state) {
        if (!this._workspaceRoot) {
            throw new Error('Ingen workspace root angivet');
        }
        const vscodeDir = path.join(this._workspaceRoot, '.vscode');
        const statePath = path.join(vscodeDir, this._stateFileName);
        try {
            // Sikr at .vscode mappe eksisterer
            await fs.promises.mkdir(vscodeDir, { recursive: true });
            // Gem state
            await fs.promises.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Fejl ved gemning af state:', error);
            throw error;
        }
    }
    static getWorkspaceRoot() {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
}
exports.StateService = StateService;
//# sourceMappingURL=StateService.js.map