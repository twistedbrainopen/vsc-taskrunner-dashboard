import * as vscode from 'vscode';
import { GitCommit } from '../types';

export class GitService {
    private _gitExtension: any;
    private _repository: any;

    constructor() {
        this._initializeGit();
    }

    private async _initializeGit(): Promise<void> {
        const extension = vscode.extensions.getExtension('vscode.git');
        if (extension) {
            this._gitExtension = extension.exports;
            const api = this._gitExtension.getAPI(1);
            this._repository = api.repositories[0];
        }
    }

    public async getRecentCommits(limit: number = 5): Promise<GitCommit[]> {
        if (!this._repository) {
            return [];
        }

        try {
            const commits = await this._repository.log();
            return commits.slice(0, limit).map((commit: any) => ({
                message: commit.message,
                hash: commit.hash,
                author: commit.author
            }));
        } catch (error) {
            console.error('Fejl ved hentning af git commits:', error);
            return [];
        }
    }

    public async getStatusFromCommits(): Promise<string[]> {
        const commits = await this.getRecentCommits();
        return commits
            .map(commit => {
                const match = commit.message.match(/\[(DONE|IN_PROGRESS|PENDING)\]/);
                return match ? match[1] : null;
            })
            .filter((status): status is string => status !== null);
    }

    public isInitialized(): boolean {
        return !!this._repository;
    }
} 