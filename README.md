# Task Runner Dashboard VSCode Extension

## Projekt Struktur
Task Runner Dashboard er en VSCode extension designet til at visualisere og interagere med DSL (Domain Specific Language) filer, der bruges i AI-assisteret udvikling. Extensionen fungerer som en bro mellem AI assistenter (som Cursor AI) og udvikleren ved at:

- Vise projekt status og fremskridt defineret i PDSL filer
- Tilbyde interaktiv task styring gennem en intuitiv sidebar
- Automatisk opdatere status baseret på Git commits
- Generere status rapporter for projekt iterationer

Extensionen er specifikt udviklet til at understøtte workflow mellem AI og udvikler, hvor AI'en opdaterer PDSL filer, og Task Runner Dashboard visualiserer ændringerne i realtid.

### Vigtige Filer
- `.vscode/task-runner.config.json`: Konfigurationsfil for tasks
- `.ai-assist/*.pdsl`: PDSL projekt filer der definerer AI-udvikler samarbejdet
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

## Installation i Nyt Projekt

### Metode 1: Via PDSL Init (AI-Automatiseret Installation)
Denne metode er designet til at blive udført af en AI assistent som del af projekt setup:

1. AI'en opretter `.ai-assist` mappe i projektet
2. AI'en genererer `ai-project-init.pdsl` med:
```json
{
    "vscode": {
        "extensions": [
            {
                "name": "task-runner-dashboard",
                "source": "github:twistedbrainopen/vsc-taskrunner-dashboard",
                "autoInstall": true
            }
        ]
    }
}
```

AI'en vil automatisk:
- Oprette nødvendige mapper
- Konfigurere Task Runner
- Tilføje relevante tasks baseret på projekt type

### Metode 2: Manuel Installation (For Udviklere)
1. Download VSIX fra GitHub:
   - Gå til https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/actions
   - Vælg seneste successful build
   - Download VSIX artifact
2. Installer i VSCode:
   - Cmd+Shift+P → "Extensions: Install from VSIX"
   - Vælg downloaded VSIX fil

### Konfiguration
1. Opret `.vscode/task-runner.config.json`:
```json
{
    "taskRunner": {
        "categories": {
            "build": {
                "name": "Build",
                "tasks": [
                    {
                        "id": "build",
                        "label": "Build Project",
                        "command": "npm run build",
                        "icon": "package",
                        "color": "#4EC9B0"
                    }
                ]
            }
        }
    }
}
```

2. Åbn Task Runner:
   - Cmd+Shift+P → "Task Runner: Åbn Dashboard"

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
