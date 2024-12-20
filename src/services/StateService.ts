import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ViewState {
    lastViewedPdslFile?: string;
    lastScrollPosition: number;
    pdslViewWasOpen: boolean;
}

export class StateService {
    private readonly _stateFileName = 'task-runner-state.json';
    private readonly _defaultState: ViewState = {
        lastScrollPosition: 0,
        pdslViewWasOpen: false
    };

    constructor(private readonly _workspaceRoot?: string) {}

    public async loadState(): Promise<ViewState> {
        if (!this._workspaceRoot) {
            return this._defaultState;
        }

        const statePath = path.join(
            this._workspaceRoot,
            '.vscode',
            this._stateFileName
        );

        try {
            const content = await fs.promises.readFile(statePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Fejl ved indlæsning af state:', error);
            return this._defaultState;
        }
    }

    public async saveState(state: ViewState): Promise<void> {
        if (!this._workspaceRoot) {
            throw new Error('Ingen workspace root angivet');
        }

        const vscodeDir = path.join(this._workspaceRoot, '.vscode');
        const statePath = path.join(vscodeDir, this._stateFileName);
        
        try {
            // Sikr at .vscode mappe eksisterer
            await fs.promises.mkdir(vscodeDir, { recursive: true });
            
            // Gem state
            await fs.promises.writeFile(
                statePath,
                JSON.stringify(state, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('Fejl ved gemning af state:', error);
            throw error;
        }
    }

    public static getWorkspaceRoot(): string | undefined {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
} 