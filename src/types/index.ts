export interface StatusStats {
    total: number;
    done: number;
    inProgress: number;
    pending: number;
    iterations: Set<string>;
    recentUpdates: Array<{
        name: string;
        status: string;
        path: string;
    }>;
}

export interface GitCommit {
    message: string;
    hash: string;
    author: string;
}

export interface PdslFile {
    id: string;
    path: string;
    selected: boolean;
    content: any;
}

export interface PdslValue {
    status?: string;
    name?: string;
    tasks?: string[];
    [key: string]: any;
}

export interface TaskConfig {
    id: string;
    label: string;
    command: string;
    tooltip?: string;
    icon: string;
    color: string;
}

export interface CategoryConfig {
    name: string;
    tasks: TaskConfig[];
}

export interface TaskRunnerConfig {
    taskRunner: {
        categories: {
            [key: string]: CategoryConfig;
        };
    };
} 