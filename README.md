# Task Runner Dashboard

![Task Runner Dashboard](media/Task%20Runner%20Dashboard.png)

En moderne, visuel task runner integreret i VS Code der gør det nemt at organisere og køre udviklings-tasks.

## Projekt Struktur
Task Runner Dashboard er en VSCode extension designet til at visualisere og interagere med DSL (Domain Specific Language) filer, der bruges i AI-assisteret udvikling. Extensionen fungerer som en bro mellem AI assistenter (som Cursor AI) og udvikleren ved at:

- Vise projekt status og fremskridt defineret i PDSL filer
- Tilbyde interaktiv task styring gennem en intuitiv sidebar
- Automatisk opdatere status baseret på Git commits
- Generere status rapporter for projekt iterationer

### Vigtige Filer
- `.vscode/task-runner.config.json`: Konfigurationsfil for tasks
- `.ai-assist/*.pdsl`: PDSL projekt filer der definerer AI-udvikler samarbejdet

## Installation

### Via install.sh (Anbefalet Metode)
1. Opret `install.sh` i dit projekt:
```bash
#!/bin/bash

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installing Task Runner Dashboard...${NC}"

# Opret nødvendige mapper
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p .vscode
mkdir -p .ai-assist

# Download seneste VSIX fra GitHub
echo -e "${GREEN}Downloading latest VSIX...${NC}"
curl -L https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/releases/latest/download/task-runner-dashboard.vsix -o task-runner-dashboard.vsix

# Installer extension
echo -e "${GREEN}Installing VSCode extension...${NC}"
code --install-extension task-runner-dashboard.vsix

# Opret task-runner.config.json
echo -e "${GREEN}Creating task runner config...${NC}"
cat > .vscode/task-runner.config.json << 'EOL'
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
EOL

# Oprydning
echo -e "${GREEN}Cleaning up...${NC}"
rm task-runner-dashboard.vsix

echo -e "${BLUE}Installation complete!${NC}"
echo -e "${BLUE}Open VSCode and run 'Task Runner: Open Dashboard' to get started${NC}"
```

2. Gør scriptet eksekverbart:
```bash
chmod +x install.sh
```

3. Kør scriptet:
```bash
./install.sh
```

## Opdatering

### Via update.sh
1. Opret `update.sh` i dit projekt:
```bash
#!/bin/bash

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Updating Task Runner Dashboard...${NC}"

# Backup eksisterende config
echo -e "${YELLOW}Backing up existing config...${NC}"
if [ -f .vscode/task-runner.config.json ]; then
    cp .vscode/task-runner.config.json .vscode/task-runner.config.backup.json
    echo -e "${GREEN}Config backup created at .vscode/task-runner.config.backup.json${NC}"
fi

# Download seneste VSIX fra GitHub
echo -e "${GREEN}Downloading latest VSIX...${NC}"
curl -L https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/releases/latest/download/task-runner-dashboard.vsix -o task-runner-dashboard.vsix

# Afinstaller gammel version
echo -e "${YELLOW}Removing old version...${NC}"
code --uninstall-extension twistedbrainopen.task-runner-dashboard

# Installer ny version
echo -e "${GREEN}Installing new version...${NC}"
code --install-extension task-runner-dashboard.vsix

# Oprydning
echo -e "${GREEN}Cleaning up...${NC}"
rm task-runner-dashboard.vsix

echo -e "${BLUE}Update complete!${NC}"
echo -e "${YELLOW}Note: Your existing config has been preserved${NC}"
echo -e "${BLUE}Restart VSCode to apply changes${NC}"
```

2. Gør scriptet eksekverbart:
```bash
chmod +x update.sh
```

3. Kør scriptet:
```bash
./update.sh
```

4. Genstart VSCode for at aktivere den nye version

### Manuelle Opdateringer
Hvis du foretrækker at opdatere manuelt:

1. Åbn VSCode
2. Gå til Extensions (Ctrl+Shift+X)
3. Søg efter "Task Runner Dashboard"
4. Klik på "Uninstall"
5. Download den seneste VSIX fra GitHub releases
6. Installer den nye version via VSIX filen

## Konfiguration
Task Runner Dashboard konfigureres via `.vscode/task-runner.config.json`. Her er et eksempel:

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

## Brug af Task Runner
1. Åbn VSCode Command Palette (Cmd + Shift + P)
2. Søg efter "Task Runner: Åbn Dashboard"
3. Brug sidebaren til at køre tasks og se projekt status

## Troubleshooting

### Almindelige Problemer

1. **Task Runner Dashboard vises ikke**
   - Tjek at `.vscode/task-runner.config.json` eksisterer og er korrekt formateret
   - Prøv at genstarte VSCode

2. **Tasks kører ikke**
   - Verificer at kommandoerne i config filen er tilgængelige i dit miljø
   - Tjek terminaloutput for fejlbeskeder

3. **Status tracking virker ikke**
   - Tjek at Git er initialiseret i projektet
   - Verificer at commit messages følger det korrekte format med [STATUS] tags

## Features
+- Moderne grid-baseret task interface
+- Responsivt design der tilpasser sig VSCode layout
 - Status tracking (DONE/IN_PROGRESS/PENDING)
 - Automatisk status rapport generering
 - Integration med PDSL projekt filer
