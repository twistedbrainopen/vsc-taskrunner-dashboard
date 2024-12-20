# Task Runner Dashboard: Sådan Gør Du

## Kom Godt I Gang

### 1. Projekt Setup
Task Runner Dashboard er en integreret del af projekt setup'et og skal ikke installeres separat.

Når du kloner et projekt der bruger Task Runner Dashboard:
```bash
# 1. Klon projektet
git clone <project-url>

# 2. Installer projekt dependencies
npm install

# 3. VSCode vil automatisk genkende Task Runner Dashboard konfigurationen
# i .vscode/task-runner.config.json
```

### 2. Åbn Dashboard
Task Runner Dashboard er nu integreret i VSCode's aktivitetsbar (venstre side):
1. Klik på Task Runner ikonet i aktivitetsbar
2. Dashboard åbner i sidepanelet
3. Klik på "PDSL View" for at åbne PDSL visningen

## Daglig Brug

### Grid Layout
Task Runner Dashboard viser alle tasks i et responsivt grid layout:
- Hver kategori vises som en sektion med task knapper
- Tasks er organiseret i kategorier med konsistente farver
- Grid tilpasser sig automatisk vinduets størrelse
- Hover effekter viser tooltips med task detaljer
- Moderne VS Code Codicons for alle knapper og funktioner

### Konfigurer Tasks
1. Åbn `.vscode/task-runner.config.json`
2. Tilføj tasks i relevante kategorier:

## Task Runner Config Eksempler

### JavaScript/Node.js Projekt
```json
{
    "taskRunner": {
        "categories": {
            "dev": {
                "name": "Development",
                "tasks": [
                    {
                        "id": "start",
                        "label": "Start Dev Server",
                        "command": "npm run dev",
                        "icon": "play",
                        "tooltip": "Start development server",
                        "color": "#4CAF50"
                    },
                    {
                        "id": "lint",
                        "label": "Lint Code",
                        "command": "npm run lint",
                        "icon": "wand",
                        "tooltip": "Run ESLint",
                        "color": "#FFC107"
                    }
                ]
            }
        }
    }
}
```

### Tilgængelige Codicons
VS Code's officielle ikoner bruges nu i hele interfacet. Nogle anbefalede ikoner:

**Development:**
- `play`: Start/kør kommandoer
- `debug`: Debug sessioner
- `refresh`: Genstart/reload
- `terminal`: Terminal kommandoer

**Build & Deploy:**
- `package`: Build/kompilering
- `cloud-upload`: Deploy
- `archive`: Pakker/archives
- `desktop-download`: Downloads

**Testing:**
- `beaker`: Test kommandoer
- `check`: Validering
- `bug`: Debug/fejlfinding
- `pass`: Tests passed

**Monitoring:**
- `eye`: Watch/monitor
- `pulse`: Status/aktivitet
- `graph`: Statistik/metrics
- `output`: Logs/output

**Tools:**
- `tools`: Værktøjer
- `settings-gear`: Konfiguration
- `extensions`: Plugins/addons
- `symbol-namespace`: Namespaces

**Files:**
- `file-code`: Kode filer
- `file-binary`: Kompilerede filer
- `library`: Libraries/modules
- `json`: JSON filer

### Farve Guide
Brug VS Code's standard farver for konsistens:
- Primary Actions: `var(--vscode-button-background)`
- Secondary: `var(--vscode-button-secondaryBackground)`
- Success: `var(--vscode-testing-iconPassed)` 
- Warning: `var(--vscode-testing-iconSkipped)`
- Error: `var(--vscode-testing-iconFailed)`

### UI Elementer
Task Runner Dashboard bruger nu VS Code's native UI komponenter:
- Knapper følger VS Code's button styling
- Tooltips matcher VS Code's native tooltips
- Ikoner bruger VS Code's Codicon system
- Farver følger VS Code's tema

### Keyboard Navigation
- Tab: Naviger mellem knapper
- Space/Enter: Aktiver knap
- Escape: Luk tooltips

## Tips & Tricks

### Effektiv Task Organisering
- Brug konsistente ikoner for lignende tasks
- Vælg ikoner der tydeligt indikerer funktionen
- Organiser tasks i logiske kategorier
- Hold tooltips korte og informative

### Bedste Praksis
1. **Ikonvalg**
   - Vælg ikoner der matcher funktionen
   - Brug samme ikon for lignende tasks
   - Hold det simpelt og intuitivt

2. **Tooltips**
   - Kort beskrivelse af funktionen
   - Inkluder kommandoen der køres
   - Tilføj relevante noter/advarsler

3. **Layout**
   - Grupper relaterede tasks
   - Brug konsistente farver
   - Hold grid layout rent og organiseret

## Fejlfinding

### Problem: Ikoner Vises Ikke
1. Tjek VS Code version (kræver 1.74.0+)
2. Verificer at Codicons er tilgængelige
3. Prøv at genstarte VS Code

### Problem: Styling Issues
1. Tjek VS Code tema kompatibilitet
2. Verificer CSS variabler
3. Reload VS Code vindue