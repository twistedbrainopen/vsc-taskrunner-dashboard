# Task Runner Dashboard

![Task Runner Dashboard](media/Task%20Runner%20Dashboard.png)

En moderne, visuel task runner integreret i VS Code der gør det nemt at organisere og køre udviklings-tasks.

## PDSL: Project Domain Specific Language

### Hvorfor PDSL?
PDSL (Project Domain Specific Language) er designet specifikt til at optimere samarbejdet mellem mennesker og AI i softwareudvikling. Det løser flere kritiske udfordringer:

1. **Struktureret Kommunikation**
   - Giver AI'en præcis kontekst om projekt status
   - Eliminerer tvetydighed i projekt beskrivelser
   - Sikrer konsistent forståelse mellem menneske og AI

2. **Projekt Overblik**
   - Holder styr på komponenter og deres relationer
   - Tracker fremskridt og afhængigheder
   - Giver både mennesker og AI samme "mentale model"

3. **Effektiv AI Integration**
   - AI kan nemt parse og forstå projekt strukturen
   - Muliggør intelligent task prioritering
   - Faciliterer kontekst-aware kodegenerering

### AI Samarbejde
PDSL er specifikt designet til at forbedre AI-menneske interaktioner ved at:

1. **Reducere Kontekst-Switching**
   - AI'en har altid adgang til fuld projekt kontekst
   - Mennesker slipper for at gentage projekt detaljer
   - Automatisk synkronisering af forståelse

2. **Optimere Workflow**
   - AI kan foreslå næste skridt baseret på status
   - Automatisk generering af tasks og dependencies
   - Intelligent prioritering af arbejde

3. **Forbedre Kvalitet**
   - AI kan validere ændringer mod projekt mål
   - Automatisk konsistenstjek af implementation
   - Bedre code reviews med fuld kontekst

### Praktiske Fordele
1. **For Udviklere**
   - Mindre tid brugt på at forklare kontekst
   - Bedre AI-genereret kode der matcher projektet
   - Automatisk dokumentation og status tracking

2. **For Teams**
   - Fælles forståelse af projekt status
   - Lettere onboarding af nye team medlemmer
   - Effektiv vidensdeling mellem mennesker og AI

3. **For Projekter**
   - Hurtigere iteration og udvikling
   - Færre misforståelser og fejl
   - Bedre projekt dokumentation

## Vigtig Bemærkning om Installation
Task Runner Dashboard er designet som en **projekt-specifik** extension - ikke en global VS Code extension. Dette er et bevidst valg for at:

1. **Sikre Projekt Autonomi**
   - Hver projekt har sin egen konfiguration
   - Ingen afhængighed af globale VS Code indstillinger
   - Fuld kontrol over task runner versionen i hvert projekt

2. **Forbedre Samarbejde**
   - Alle teammedlemmer bruger samme version
   - Konfiguration følger med i Git
   - Ingen behov for manuel synkronisering af indstillinger

3. **Øge Stabilitet**
   - Undgå konflikter mellem forskellige projekters behov
   - Lettere at teste og verificere funktionalitet
   - Sikker udrulning af opdateringer per projekt

Dette betyder at:
- Task Runner Dashboard skal installeres separat for hvert projekt
- Installationen er automatiseret via medfølgende scripts
- Opdateringer håndteres per projekt, ikke globalt i VS Code

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

### Via trdInstall.sh (Anbefalet Metode)
1. Download install script:
```bash
curl -O https://raw.githubusercontent.com/twistedbrainopen/vsc-taskrunner-dashboard/main/scripts/trdInstall.sh
chmod +x trdInstall.sh
```

2. Kør scriptet:
```bash
./trdInstall.sh
```

## Opdatering

### Via trdUpdate.sh (Anbefalet Metode)
1. Download update script:
```bash
curl -O https://raw.githubusercontent.com/twistedbrainopen/vsc-taskrunner-dashboard/main/scripts/trdUpdate.sh
chmod +x trdUpdate.sh
```

2. Kør scriptet:
```bash
./trdUpdate.sh
```

### Script Reference
Begge scripts er tilgængelige direkte fra GitHub:
- [trdInstall.sh](https://raw.githubusercontent.com/twistedbrainopen/vsc-taskrunner-dashboard/main/scripts/trdInstall.sh)
- [trdUpdate.sh](https://raw.githubusercontent.com/twistedbrainopen/vsc-taskrunner-dashboard/main/scripts/trdUpdate.sh)

For reference, her er indholdet af scriptsne:

<details>
<summary>trdInstall.sh</summary>

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
mkdir -p .task-runner

# Download og udpak Task Runner filer
echo -e "${GREEN}Downloading Task Runner files...${NC}"
curl -L https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/releases/latest/download/task-runner-files.zip -o task-runner-files.zip
unzip -o task-runner-files.zip -d .task-runner/

# Kopier nødvendige filer
echo -e "${GREEN}Setting up Task Runner...${NC}"
cp -r .task-runner/out .task-runner/node_modules .task-runner/media ./
cp .task-runner/package.json ./
cp .task-runner/HOWTO.md ./

# Opret task-runner.config.json hvis den ikke findes
if [ ! -f .vscode/task-runner.config.json ]; then
    echo -e "${GREEN}Creating default config...${NC}"
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
fi

# Oprydning
echo -e "${GREEN}Cleaning up...${NC}"
rm -rf task-runner-files.zip .task-runner

echo -e "${BLUE}Installation complete!${NC}"
echo -e "${BLUE}Restart VSCode to activate Task Runner Dashboard${NC}"
echo -e "${GREEN}See HOWTO.md for usage instructions${NC}"
```
</details>

<details>
<summary>trdUpdate.sh</summary>

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

# Backup eksisterende HOWTO
if [ -f HOWTO.md ]; then
    cp HOWTO.md HOWTO.md.backup
    echo -e "${GREEN}HOWTO backup created at HOWTO.md.backup${NC}"
fi

# Download og udpak nye filer
echo -e "${GREEN}Downloading new version...${NC}"
curl -L https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/releases/latest/download/task-runner-files.zip -o task-runner-files.zip
mkdir -p .task-runner
unzip -o task-runner-files.zip -d .task-runner/

# Fjern gamle filer
echo -e "${YELLOW}Removing old files...${NC}"
rm -rf out node_modules media

# Kopier nye filer
echo -e "${GREEN}Installing new files...${NC}"
cp -r .task-runner/out .task-runner/node_modules .task-runner/media ./
cp .task-runner/package.json ./
cp .task-runner/HOWTO.md ./

# Oprydning
echo -e "${GREEN}Cleaning up...${NC}"
rm -rf task-runner-files.zip .task-runner

echo -e "${BLUE}Update complete!${NC}"
echo -e "${YELLOW}Note: Your existing config has been preserved${NC}"
echo -e "${YELLOW}Note: HOWTO.md has been updated (backup at HOWTO.md.backup)${NC}"
echo -e "${BLUE}Restart VSCode to apply changes${NC}"
```
</details>

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

## PDSL Format
PDSL (Project Domain Specific Language) er et JSON-baseret format der bruges til at definere og tracke projekt status:

### Basis Struktur
```json
{
    "PROJECTS": {
        "ProjectName": {
            "name": "Projekt Navn",
            "status": "IN_PROGRESS",
            "description": "Projekt beskrivelse",
            "components": {
                "ComponentName": {
                    "name": "Komponent Navn",
                    "status": "IN_PROGRESS",
                    "features": [
                        "Feature 1",
                        "Feature 2"
                    ]
                }
            }
        }
    }
}
```

### Status Typer
- `IN_PROGRESS`: Aktivt under udvikling
- `DONE`: Færdiggjort og testet
- `PENDING`: Venter på at blive påbegyndt
- `BLOCKED`: Blokeret af andre tasks
- `REVIEW`: Under code review
- `TESTING`: Under test

### Komponenter
Projekter kan opdeles i komponenter for bedre organisering:
```json
"components": {
    "Frontend": {
        "name": "Frontend",
        "status": "IN_PROGRESS",
        "features": [
            "Responsive design",
            "Dark mode support"
        ]
    },
    "Backend": {
        "name": "API Server",
        "status": "DONE",
        "features": [
            "REST endpoints",
            "Database integration"
        ]
    }
}
```

### Design Principper
Projekter kan inkludere design principper og tech stack:
```json
{
    "PROJECTS": {
        "ProjectName": {
            // ... andre felter ...
            "design_principles": [
                "Mobile first design",
                "Accessibility focus",
                "Performance optimization"
            ],
            "tech_stack": {
                "frontend": [
                    "React",
                    "TypeScript"
                ],
                "backend": [
                    "Node.js",
                    "PostgreSQL"
                ]
            }
        }
    }
}
```

### Integration med Task Runner
PDSL filer integreres automatisk med Task Runner Dashboard:
- Status vises i sidebar med farve-kodning
- Komponenter kan foldes/unfoldes
- Tasks kan knyttes til komponenter
- Rapporter genereres baseret på PDSL status

## Features
+- Moderne grid-baseret task interface
+- Responsivt design der tilpasser sig VSCode layout
 - Status tracking (DONE/IN_PROGRESS/PENDING)
 - Automatisk status rapport generering
 - Integration med PDSL projekt filer
