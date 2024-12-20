#!/bin/bash

# Opret nødvendige mapper
mkdir -p .vscode/task-runner/dist
mkdir -p .vscode/task-runner/scripts
mkdir -p .vscode/task-runner/reports
mkdir -p .vscode/.ai-assist

# Installer extension
code --install-extension .vscode/task-runner/dist/task-runner-dashboard-1.0.0.vsix

echo "Task Runner Dashboard er installeret!" 