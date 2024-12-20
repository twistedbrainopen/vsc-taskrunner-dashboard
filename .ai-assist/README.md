# .ai-assist

Denne mappe indeholder AI-relaterede projektfiler der arbejder sammen med den beskyttede `.vscode` konfiguration:

## Indhold
- `project.pdsl`: Project Domain Specific Language fil der definerer projekt struktur og status
- `README.md`: Denne dokumentationsfil

## Formål
- Optimere samarbejde mellem mennesker og AI
- Holde styr på projekt status og fremskridt
- Facilitere effektiv kommunikation med AI assistenter

## Sikkerhed og Kontrol
- PDSL filer læses af AI, men ændringer kræver menneskelig godkendelse
- Task konfiguration beskyttes i `.vscode` mappen
- Dette sikrer at AI ikke utilsigtet ændrer projekt setup

## Workflow
1. AI læser PDSL for at forstå projekt kontekst
2. AI foreslår ændringer baseret på PDSL status
3. Mennesker godkender og implementerer ændringer
4. Task Runner Dashboard opdaterer PDSL automatisk

## Bemærk
- Denne mappe og dens indhold skal være inkluderet i Git
- PDSL filer opdateres automatisk af Task Runner Dashboard
- Undgå manuel redigering medmindre det er nødvendigt
- AI kan foreslå ændringer, men ikke implementere dem direkte