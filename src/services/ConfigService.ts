import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TaskRunnerConfig } from '../types';

export class ConfigService {
    private readonly _configFileName = 'task-runner.config.json';
    private readonly _defaultConfig: TaskRunnerConfig = {
        taskRunner: {
            categories: {
                "haxe": {
                    "label": "HAXE Udvikling",
                    "tasks": [
                        {
                            "id": "haxe-build",
                            "label": "Build HAXE",
                            "command": "haxe build.hxml",
                            "tooltip": "Bygger HAXE projektet",
                            "icon": "package",
                            "color": "#ea8220"
                        },
                        {
                            "id": "haxe-test",
                            "label": "Test HAXE",
                            "command": "haxe test.hxml",
                            "tooltip": "Kører HAXE tests",
                            "icon": "beaker",
                            "color": "#ea8220"
                        },
                        {
                            "id": "haxe-watch",
                            "label": "Watch HAXE",
                            "command": "haxe --wait 6000",
                            "tooltip": "Starter HAXE i watch mode",
                            "icon": "eye",
                            "color": "#ea8220"
                        },
                        {
                            "id": "haxe-docs",
                            "label": "HAXE Docs",
                            "command": "haxe --gen-hx-classes",
                            "tooltip": "Genererer HAXE dokumentation",
                            "icon": "book",
                            "color": "#ea8220"
                        }
                    ]
                },
                "ink": {
                    "label": "Ink Scripts",
                    "tasks": [
                        {
                            "id": "ink-compile",
                            "label": "Compile Ink",
                            "command": "inklecate -o output.json story.ink",
                            "tooltip": "Kompilerer Ink script til JSON",
                            "icon": "tools",
                            "color": "#6b82a8"
                        },
                        {
                            "id": "ink-play",
                            "label": "Play Story",
                            "command": "inklecate -p story.ink",
                            "tooltip": "Afspiller Ink historie i terminal",
                            "icon": "play",
                            "color": "#6b82a8"
                        },
                        {
                            "id": "ink-watch",
                            "label": "Watch Ink",
                            "command": "inklecate -w story.ink",
                            "tooltip": "Overvåger Ink fil for ændringer",
                            "icon": "eye",
                            "color": "#6b82a8"
                        }
                    ]
                },
                "web": {
                    "label": "Web Tools",
                    "tasks": [
                        {
                            "id": "web-serve",
                            "label": "Start Server",
                            "command": "npx http-server ./dist",
                            "tooltip": "Starter lokal web server",
                            "icon": "play",
                            "color": "#4CAF50"
                        },
                        {
                            "id": "web-build",
                            "label": "Build Web",
                            "command": "npm run build:web",
                            "tooltip": "Bygger web version",
                            "icon": "package",
                            "color": "#4CAF50"
                        },
                        {
                            "id": "web-watch",
                            "label": "Watch Web",
                            "command": "npm run watch:web",
                            "tooltip": "Watch mode for web build",
                            "icon": "eye",
                            "color": "#4CAF50"
                        }
                    ]
                },
                "tools": {
                    "label": "Værktøjer",
                    "tasks": [
                        {
                            "id": "clean",
                            "label": "Clean All",
                            "command": "npm run clean",
                            "tooltip": "Rydder op i alle build filer",
                            "icon": "tools",
                            "color": "#607D8B"
                        },
                        {
                            "id": "update-deps",
                            "label": "Update Deps",
                            "command": "npm update",
                            "tooltip": "Opdaterer alle dependencies",
                            "icon": "package",
                            "color": "#607D8B"
                        },
                        {
                            "id": "lint",
                            "label": "Lint All",
                            "command": "npm run lint",
                            "tooltip": "Kører linting på alle filer",
                            "icon": "check",
                            "color": "#607D8B"
                        },
                        {
                            "id": "docs",
                            "label": "Generate Docs",
                            "command": "npm run docs",
                            "tooltip": "Genererer projekt dokumentation",
                            "icon": "book",
                            "color": "#607D8B"
                        }
                    ]
                }
            }
        }
    };

    constructor(private readonly _workspaceRoot?: string) {}

    public async loadConfig(): Promise<TaskRunnerConfig> {
        if (!this._workspaceRoot) {
            return this._defaultConfig;
        }

        const configPath = path.join(
            this._workspaceRoot,
            '.vscode',
            this._configFileName
        );

        try {
            const configContent = await fs.promises.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.log('Ingen config fil fundet, bruger default config');
            return this._defaultConfig;
        }
    }

    public async saveConfig(config: TaskRunnerConfig): Promise<void> {
        if (!this._workspaceRoot) {
            throw new Error('Ingen workspace root angivet');
        }

        const vscodeDir = path.join(this._workspaceRoot, '.vscode');
        const configPath = path.join(vscodeDir, this._configFileName);
        
        try {
            // Sikr at .vscode mappe eksisterer
            await fs.promises.mkdir(vscodeDir, { recursive: true });
            
            // Gem config
            await fs.promises.writeFile(
                configPath, 
                JSON.stringify(config, null, 4),
                'utf8'
            );
        } catch (error) {
            console.error('Fejl ved gemning af config:', error);
            throw error;
        }
    }

    public static getWorkspaceRoot(): string | undefined {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
} 