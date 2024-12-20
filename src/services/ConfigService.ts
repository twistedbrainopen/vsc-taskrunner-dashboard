import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TaskRunnerConfig } from '../types';

export class ConfigService {
    private readonly _configFileName = 'task-runner.config.json';

    constructor(private readonly _workspaceRoot?: string) {}

    public async loadConfig(): Promise<TaskRunnerConfig> {
        if (!this._workspaceRoot) {
            throw new Error('Ingen workspace root angivet');
        }

        const configPath = path.join(
            this._workspaceRoot,
            '.vscode',
            'task-runner',
            this._configFileName
        );

        try {
            const configContent = await fs.promises.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            throw new Error(`Kunne ikke indlæse konfigurationsfil fra ${configPath}: ${error}`);
        }
    }

    public async saveConfig(config: TaskRunnerConfig): Promise<void> {
        if (!this._workspaceRoot) {
            throw new Error('Ingen workspace root angivet');
        }

        const taskRunnerDir = path.join(this._workspaceRoot, '.vscode', 'task-runner');
        const configPath = path.join(taskRunnerDir, this._configFileName);
        
        try {
            // Sikr at .vscode/task-runner mappe eksisterer
            await fs.promises.mkdir(taskRunnerDir, { recursive: true });
            
            // Gem config
            await fs.promises.writeFile(
                configPath, 
                JSON.stringify(config, null, 4),
                'utf8'
            );
        } catch (error) {
            throw new Error(`Fejl ved gemning af config: ${error}`);
        }
    }

    public static getWorkspaceRoot(): string | undefined {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
} 