# Task Runner Dashboard

En VSCode extension til at køre og administrere tasks i dit projekt.

## Installation

1. Klon dette repository
2. Kør installationsscriptet:
```bash
chmod +x .vscode/task-runner/scripts/trdInstall.sh
.vscode/task-runner/scripts/trdInstall.sh
```

## Mappestruktur

```
.vscode/
  ├── task-runner/
  │   ├── dist/           # VSCode extension pakke
  │   ├── scripts/        # Installation og opdateringsscripts
  │   ├── reports/        # Genererede rapporter
  │   └── README.md       # Denne fil
  └── .ai-assist/         # PDSL filer
```

## Brug

1. Åbn Task Runner Dashboard fra VSCode's aktivitetslinje
2. Vælg en task fra matrixen for at køre den
3. Brug PDSL View til at se projektets status og dokumentation

For mere detaljeret information, se HOWTO.md i .vscode/task-runner mappen.
