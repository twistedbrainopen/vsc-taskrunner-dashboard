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
1. Cmd + Shift + P
2. Søg: "Task Runner: Åbn Dashboard"
3. Dashboard åbner i en sidebar

**Bemærk:** Task Runner Dashboard er en del af projekt setup'et og kræver ikke separat installation.

## Daglig Brug

### Grid Layout
Task Runner Dashboard viser nu alle tasks i et responsivt grid layout:
- Hver kategori vises som et kort
- Tasks er organiseret i kategorier
- Grid tilpasser sig automatisk vinduets størrelse
- Hover effekter viser interaktive muligheder

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
                        "color": "#4CAF50"
                    },
                    {
                        "id": "lint",
                        "label": "Lint Code",
                        "command": "npm run lint",
                        "icon": "check",
                        "color": "#FFC107"
                    }
                ]
            },
            "test": {
                "name": "Test",
                "tasks": [
                    {
                        "id": "test",
                        "label": "Run Tests",
                        "command": "npm test",
                        "icon": "beaker",
                        "color": "#2196F3"
                    },
                    {
                        "id": "test-watch",
                        "label": "Test Watch",
                        "command": "npm run test:watch",
                        "icon": "eye",
                        "color": "#03A9F4"
                    }
                ]
            },
            "build": {
                "name": "Build",
                "tasks": [
                    {
                        "id": "build",
                        "label": "Production Build",
                        "command": "npm run build",
                        "icon": "package",
                        "color": "#9C27B0"
                    },
                    {
                        "id": "analyze",
                        "label": "Bundle Analysis",
                        "command": "npm run analyze",
                        "icon": "graph",
                        "color": "#E91E63"
                    }
                ]
            }
        }
    }
}
```

### Web Projekt Setup
```json
{
    "taskRunner": {
        "categories": {
            "server": {
                "name": "Server",
                "tasks": [
                    {
                        "id": "serve",
                        "label": "Start Server",
                        "command": "python -m http.server 8000",
                        "icon": "server",
                        "color": "#9C27B0"
                    }
                ]
            },
            "build": {
                "name": "Build",
                "tasks": [
                    {
                        "id": "sass",
                        "label": "Compile SASS",
                        "command": "sass src/styles:dist/css --watch",
                        "icon": "brush",
                        "color": "#FF4081"
                    }
                ]
            }
        }
    }
}
```

### TypeScript Projekt
```json
{
    "taskRunner": {
        "categories": {
            "compile": {
                "name": "Compile",
                "tasks": [
                    {
                        "id": "tsc",
                        "label": "Compile TypeScript",
                        "command": "tsc",
                        "icon": "gear",
                        "color": "#3F51B5"
                    },
                    {
                        "id": "tsc-watch",
                        "label": "Watch TypeScript",
                        "command": "tsc -w",
                        "icon": "eye",
                        "color": "#7986CB"
                    }
                ]
            },
            "test": {
                "name": "Test",
                "tasks": [
                    {
                        "id": "jest",
                        "label": "Run Tests",
                        "command": "jest",
                        "icon": "beaker",
                        "color": "#4CAF50"
                    }
                ]
            }
        }
    }
}
```

### HAXE Projekt
```json
{
    "taskRunner": {
        "categories": {
            "build": {
                "name": "Build",
                "tasks": [
                    {
                        "id": "haxe-build",
                        "label": "Build HAXE",
                        "command": "haxe build.hxml",
                        "icon": "package",
                        "color": "#FF8F00"
                    }
                ]
            },
            "test": {
                "name": "Test",
                "tasks": [
                    {
                        "id": "test",
                        "label": "Run Tests",
                        "command": "haxe test.hxml",
                        "icon": "beaker",
                        "color": "#00BCD4"
                    }
                ]
            }
        }
    }
}
```

### Tilgængelige Ikoner
- `play`: ▶️ Start/kør kommandoer
- `package`: 📦 Build/kompilering
- `beaker`: 🧪 Test kommandoer
- `eye`: 👁️ Watch/monitor
- `gear`: ⚙️ Konfiguration/setup
- `graph`: 📊 Rapporter/statistik
- `server`: 🖥️ Server operationer
- `brush`: 🎨 Style/design tasks
- `check`: ✅ Lint/validering
- `graph`: 📊 Analyse/rapporter
- `server`: 🖥️ Server
- `brush`: 🎨 Styling

### Farve Guide
- Development: `#4CAF50` (Grøn)
- Test: `#2196F3` (Blå)
- Build: `#9C27B0` (Lilla)
- Lint: `#FFC107` (Gul)
- Watch: `#03A9F4` (Lys blå)
- Analyse: `#E91E63` (Pink)
- Rapport: `#795548` (Brun)

### Kør Tasks
1. Klik på task ikonet i sidebaren
2. Se output i VSCode's integrerede terminal
3. Status opdateres automatisk

### Status Tracking
Brug Git commits til at tracke status:
```bash
# Marker task som færdig
git commit -m "[DONE] Implementeret login flow"

# Marker task som i gang
git commit -m "[IN_PROGRESS] Arbejder på database setup"

# Marker task som afventende
git commit -m "[PENDING] OAuth integration mangler"
```

### Generer Status Rapport
1. Klik på rapport ikonet i sidebaren
2. Rapport åbnes i ny editor
3. Indeholder:
   - Samlet status
   - Færdige tasks
   - Igangværende arbejde
   - Kommende opgaver

## Tips & Tricks

### Effektiv Task Organisering
- Grupper relaterede tasks i kategorier
- Brug beskrivende labels
- Vælg intuitive ikoner
- Brug konsistente farver for lignende tasks

### Keyboard Shortcuts
- `Cmd + Shift + P`: Åbn Command Palette
- `Cmd + K`: Fold/unfold sektioner
- `Cmd + S`: Gem rapport

### Bedste Praksis
1. **Task Navngivning**
   - Brug handling + objekt format
   - Hold det kort og præcist
   - Eksempel: "Build Project" vs "Kør build process"

2. **Kategorier**
   - Hold antallet overskueligt
   - Brug logisk gruppering
   - Eksempel kategorier:
     - Development
     - Build
     - Deploy
     - Test

3. **Git Integration**
   - Brug konsistente status tags
   - Skriv beskrivende commit messages
   - Hold commits fokuserede

## Fejlfinding

### Problem: Task Kører Ikke
1. Tjek terminal output
2. Verificer kommando eksisterer
3. Tjek rettigheder

### Problem: Status Opdateres Ikke
1. Tjek Git er initialiseret
2. Verificer commit format
3. Prøv at genstarte VSCode

### Problem: Dashboard Vises Ikke
1. Tjek config fil eksisterer
2. Verificer JSON syntax
3. Reload VSCode vindue 