#!/bin/bash

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konstanter
REPO_URL="https://github.com/twistedbrainopen/vsc-taskrunner-dashboard"
TEMP_DIR=".task-runner-temp"
REQUIRED_FILES=("out" "media" "package.json" "HOWTO.md")

# Fejlhåndteringsfunktion
handle_error() {
    echo -e "${RED}Fejl: $1${NC}"
    echo -e "${YELLOW}Rydder op...${NC}"
    rm -rf "$TEMP_DIR" task-runner-files.zip
    exit 1
}

# Funktion til at tjekke om Task Runner er installeret
check_installation() {
    if [ -d ".vscode" ] && [ -f "package.json" ]; then
        local current_version=$(grep '"version":' package.json | cut -d'"' -f4)
        echo "$current_version"
        return 0
    fi
    echo "none"
    return 1
}

# Funktion til at hente seneste version fra GitHub
get_latest_version() {
    local latest_version=$(curl -s "$REPO_URL/releases/latest" | grep -o 'tag/v[0-9.]*' | cut -d'v' -f2)
    if [ -z "$latest_version" ]; then
        handle_error "Kunne ikke hente seneste version"
    fi
    echo "$latest_version"
}

# Funktion til at downloade og installere
install_or_update() {
    local mode=$1
    echo -e "${BLUE}${mode} Task Runner...${NC}"

    # Opret midlertidig mappe
    mkdir -p "$TEMP_DIR" || handle_error "Kunne ikke oprette midlertidig mappe"

    # Download og verificer zip fil
    echo -e "${GREEN}Henter filer...${NC}"
    curl -L -o task-runner-files.zip "$REPO_URL/releases/latest/download/task-runner-files.zip" || handle_error "Download fejlede"

    # Verificer zip fil
    if [ ! -s task-runner-files.zip ]; then
        handle_error "Zip filen er tom eller eksisterer ikke"
    fi

    # Udpak filer
    echo -e "${GREEN}Udpakker filer...${NC}"
    unzip -o task-runner-files.zip -d "$TEMP_DIR/" || handle_error "Kunne ikke udpakke zip fil"

    # Verificer filer
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -e "$TEMP_DIR/$file" ]; then
            handle_error "Manglende fil/mappe: $file"
        fi
    done

    # Backup eksisterende konfiguration hvis det er en opdatering
    if [ "$mode" = "Opdaterer" ] && [ -d ".vscode" ]; then
        echo -e "${YELLOW}Laver backup af eksisterende konfiguration...${NC}"
        cp -r .vscode .vscode.backup || handle_error "Kunne ikke lave backup"
    fi

    # Installer filer
    echo -e "${GREEN}Installerer filer...${NC}"
    mkdir -p .vscode || handle_error "Kunne ikke oprette .vscode mappe"
    for file in "${REQUIRED_FILES[@]}"; do
        cp -r "$TEMP_DIR/$file" ./ || handle_error "Kunne ikke kopiere $file"
    done

    # Oprydning
    echo -e "${GREEN}Rydder op...${NC}"
    rm -rf "$TEMP_DIR" task-runner-files.zip

    # Gendan konfiguration hvis det er en opdatering
    if [ "$mode" = "Opdaterer" ] && [ -d ".vscode.backup" ]; then
        cp -r .vscode.backup/* .vscode/ 2>/dev/null || true
        rm -rf .vscode.backup
    fi
}

# Hovedprogram
echo -e "${BLUE}Task Runner Dashboard Setup${NC}"

# Tjek nuværende installation
current_version=$(check_installation)
latest_version=$(get_latest_version)

if [ "$current_version" = "none" ]; then
    # Ny installation
    install_or_update "Installerer"
    echo -e "${BLUE}Installation færdig!${NC}"
else
    # Sammenlign versioner
    if [ "$current_version" = "$latest_version" ]; then
        echo -e "${GREEN}Du har allerede den seneste version ($current_version)${NC}"
        echo -e "${YELLOW}Brug --force for at geninstallere${NC}"
        exit 0
    else
        # Opdatering
        echo -e "${YELLOW}Opdaterer fra version $current_version til $latest_version${NC}"
        install_or_update "Opdaterer"
        echo -e "${BLUE}Opdatering færdig!${NC}"
    fi
fi

echo -e "${YELLOW}Genstart VSCode for at aktivere Task Runner Dashboard${NC}"
echo -e "${GREEN}Se HOWTO.md for brugsanvisning${NC}" 