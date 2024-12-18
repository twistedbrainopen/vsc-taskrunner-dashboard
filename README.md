# Task Runner Dashboard VSCode Extension

## Projekt Struktur
Dette er en VSCode extension der viser en interaktiv dashboard for projekt tasks defineret i `task-runner.config.json`.

### Vigtige Filer
- `.vscode/task-runner.config.json`: Konfigurationsfil for tasks
- `.ai-assist/*.pdsl`: PDSL projekt filer
- `src/extension.ts`: Hoved extension fil
- `src/TaskRunnerPanel.ts`: WebView implementation
- `.vscode/launch.json` & `.vscode/tasks.json`: Debug konfiguration

## Features
- Interaktiv sidebar med projekt tasks
- Status tracking (DONE/IN_PROGRESS/PENDING)
- Automatisk status rapport generering
- Integration med PDSL projekt filer
- Git commit status tracking
- Fold/unfold sektioner for bedre overblik

## Setup & Udvikling

1. **Installation**
```bash
npm install
npm run compile
```

2. **Debug/Test**
- Åbn projektet i VSCode
- Tryk `Cmd + Shift + P`
- Vælg "Debug: Start Debugging" eller "Run Extension"

3. **Konfiguration**
Tasks kan defineres på to måder:

1. I projekt-roden: `task-runner.config.json`
2. I `.vscode` mappen: `.vscode/task-runner.config.json` (anbefalet)

### Eksempel på struktur
```json
{
    "taskRunner": {
        "categories": {
            "category-id": {
                "name": "Category Name",
                "tasks": [
                    {
                        "id": "task-id",
                        "label": "Task Label",
                        "command": "command to run",
                        "tooltip": "beskrivelse",
                        "icon": "icon-name",
                        "color": "#HEX-COLOR"
                    }
                ]
            }
        }
    }
}
```

### Placering
Det anbefales at placere konfigurationsfilen i `.vscode` mappen for at holde projekt-roden ren og for at gruppere den med andre VSCode-specifikke konfigurationer.

## Næste Skridt
1. Implementer bedre task output håndtering
2. Tilføj flere ikoner
3. Implementer task dependencies
4. Tilføj progress tracking
5. Integrer med VSCode's built-in task system

## Noter til Fremtidige AI Assistenter
- Projektet bruger TypeScript og VSCode Extension API
- WebView UI er implementeret med vanilla HTML/CSS/JS
- Task execution sker via VSCode's terminal API
- Konfiguration læses dynamisk fra workspace root
- Der er sat file-watching op for auto-refresh ved config ændringer

## Kendte Issues
- Task completion er pt. simuleret (setTimeout)
- Mangler proper error handling for task execution
- Kunne bruge bedre UI feedback under task execution

## Tips
- Brug VSCode's built-in debugging tools
- Test med forskellige task typer
- Husk at recompile efter ændringer
- Check extension logs i Output panel under "Task Runner"
# vsc-taskrunner-dashboard
