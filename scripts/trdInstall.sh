#!/bin/bash

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fejlhåndteringsfunktion
handle_error() {
    echo -e "${RED}Fejl: $1${NC}"
    echo -e "${YELLOW}Prøver at rydde op...${NC}"
    rm -rf .task-runner task-runner-files.zip
    exit 1
}

echo -e "${BLUE}Setting up Task Runner...${NC}"

# Opret .vscode mappe hvis den ikke findes
mkdir -p .vscode || handle_error "Kunne ikke oprette .vscode mappe"

# Download og verificer zip fil
echo -e "${GREEN}Downloading files...${NC}"
curl -L -o task-runner-files.zip https://github.com/twistedbrainopen/vsc-taskrunner-dashboard/releases/latest/download/task-runner-files.zip || handle_error "Download fejlede"

# Verificer at zip filen eksisterer og har indhold
if [ ! -s task-runner-files.zip ]; then
    handle_error "Zip filen er tom eller eksisterer ikke"
fi

# Udpak filer
echo -e "${GREEN}Extracting files...${NC}"
mkdir -p .task-runner || handle_error "Kunne ikke oprette midlertidig mappe"
unzip -o task-runner-files.zip -d .task-runner/ || handle_error "Kunne ikke udpakke zip fil"

# Verificer at nødvendige filer og mapper eksisterer
required_files=("out" "node_modules" "media" "package.json" "HOWTO.md")
for file in "${required_files[@]}"; do
    if [ ! -e ".task-runner/$file" ]; then
        handle_error "Manglende fil/mappe: $file"
    fi
done

# Kopier filer
echo -e "${GREEN}Installing files...${NC}"
for file in "${required_files[@]}"; do
    cp -r ".task-runner/$file" ./ || handle_error "Kunne ikke kopiere $file"
done

# Oprydning
echo -e "${GREEN}Cleaning up...${NC}"
rm -rf .task-runner task-runner-files.zip

echo -e "${BLUE}Installation complete!${NC}"
echo -e "${YELLOW}Restart VSCode to activate Task Runner Dashboard${NC}"
echo -e "${GREEN}See HOWTO.md for usage instructions${NC}" 