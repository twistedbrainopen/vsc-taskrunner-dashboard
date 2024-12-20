"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const vscode = require("vscode");
class GitService {
    constructor() {
        this._initializeGit();
    }
    async _initializeGit() {
        const extension = vscode.extensions.getExtension('vscode.git');
        if (extension) {
            this._gitExtension = extension.exports;
            const api = this._gitExtension.getAPI(1);
            this._repository = api.repositories[0];
        }
    }
    async getRecentCommits(limit = 5) {
        if (!this._repository) {
            return [];
        }
        try {
            const commits = await this._repository.log();
            return commits.slice(0, limit).map((commit) => ({
                message: commit.message,
                hash: commit.hash,
                author: commit.author
            }));
        }
        catch (error) {
            console.error('Fejl ved hentning af git commits:', error);
            return [];
        }
    }
    async getStatusFromCommits() {
        const commits = await this.getRecentCommits();
        return commits
            .map(commit => {
            const match = commit.message.match(/\[(DONE|IN_PROGRESS|PENDING)\]/);
            return match ? match[1] : null;
        })
            .filter((status) => status !== null);
    }
    isInitialized() {
        return !!this._repository;
    }
}
exports.GitService = GitService;
//# sourceMappingURL=GitService.js.map