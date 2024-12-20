# .vscode

Denne mappe indeholder VS Code specifikke konfigurationsfiler for Task Runner Dashboard. Placeringen i `.vscode` er et bevidst valg for at:

1. **Beskytte mod uønskede AI-ændringer**
   - AI-assistenter har som standard ikke tilladelse til at ændre `.vscode` konfiguration
   - Dette sikrer at task runner setup forbliver stabilt
   - Ændringer kræver eksplicit menneskelig godkendelse

2. **Følge VS Code Best Practices**
   - Projekt-specifik konfiguration hører til i `.vscode`
   - Adskiller konfiguration fra kildekode
   - Gør det nemt at identificere projekt setup

## Indhold
- `task-runner.config.json`: Hoved-konfigurationsfil for tasks og kategorier
- `README.md`: Denne dokumentationsfil

## Bemærk
- Denne mappe og dens indhold skal være inkluderet i Git
- Undgå at tilføje personlige VS Code indstillinger her
- Hold konfigurationen projekt-specifik
- Kræv altid eksplicit godkendelse for AI-ændringer i denne mappe