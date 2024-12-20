#!/bin/bash

# Farver til output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konstanter
REPO_URL="https://raw.githubusercontent.com/twistedbrainopen/vsc-taskrunner-dashboard/main"
TEMP_DIR=".task-runner-temp"
VSC_DIR=".vscode"
REQUIRED_FILES=(
    "out/extension.js"
    "out/TaskRunnerPanel.js"
    "out/components/TaskButton.js"
    "out/components/ReportButton.js"
    "out/views/TaskMatrixView.js"
    "out/views/PdslView.js"
    "out/services/StateService.js"
    "out/services/GitService.js"
    "out/services/ConfigService.js"
    "out/utils/iconUtils.js"
    "media/icon.svg"
    "media/preview-dark.svg"
    "media/preview-light.svg"
    "package.json"
    "HOWTO.md"
)

# Debug funktion
debug_info() {
    echo -e "${YELLOW}DEBUG: $1${NC}"
}

# Fejlhåndteringsfunktion
handle_error() {
    echo -e "${RED}Fejl: $1${NC}"
    echo -e "${YELLOW}Rydder op...${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
}

# Funktion til at tjekke om Task Runner er installeret
check_installation() {
    if [ -d "$VSC_DIR/task-runner" ] && [ -f "$VSC_DIR/task-runner/package.json" ]; then
        local current_version=$(grep '"version":' "$VSC_DIR/task-runner/package.json" | cut -d'"' -f4)
        echo "$current_version"
        return 0
    fi
    echo "none"
    return 1
}

# Funktion til at hente seneste version fra package.json
get_latest_version() {
    local temp_file="$TEMP_DIR/package.json"
    mkdir -p "$TEMP_DIR"
    if ! curl -s "$REPO_URL/package.json" -o "$temp_file"; then
        echo "none"
        return 1
    fi
    local version=$(grep '"version":' "$temp_file" | cut -d'"' -f4)
    rm -f "$temp_file"
    echo "$version"
}

# Funktion til at downloade en fil
download_file() {
    local file="$1"
    local target_dir="$TEMP_DIR/$(dirname "$file")"
    mkdir -p "$target_dir"
    debug_info "Henter $file..."
    if ! curl -s "$REPO_URL/$file" -o "$TEMP_DIR/$file"; then
        handle_error "Kunne ikke hente $file"
    fi
}

# Funktion til at downloade og installere
install_or_update() {
    local mode=$1
    echo -e "${BLUE}${mode} Task Runner...${NC}"

    # Opret midlertidig mappe
    mkdir -p "$TEMP_DIR" || handle_error "Kunne ikke oprette midlertidig mappe"

    # Download alle filer
    echo -e "${GREEN}Henter filer...${NC}"
    for file in "${REQUIRED_FILES[@]}"; do
        download_file "$file"
    done

    # Verificer filer
    echo -e "${GREEN}Verificerer filer...${NC}"
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$TEMP_DIR/$file" ]; then
            handle_error "Manglende fil: $file"
        fi
    done

    # Backup eksisterende konfiguration hvis det er en opdatering
    if [ "$mode" = "Opdaterer" ] && [ -d "$VSC_DIR/task-runner" ]; then
        echo -e "${YELLOW}Laver backup af eksisterende konfiguration...${NC}"
        cp -r "$VSC_DIR/task-runner" "$VSC_DIR/task-runner.backup" || handle_error "Kunne ikke lave backup"
    fi

    # Installer filer
    echo -e "${GREEN}Installerer filer...${NC}"
    mkdir -p "$VSC_DIR/task-runner" || handle_error "Kunne ikke oprette task-runner mappe"
    
    # Kopier filer og opret nødvendige mapper
    for file in "${REQUIRED_FILES[@]}"; do
        local target_dir="$VSC_DIR/task-runner/$(dirname "$file")"
        mkdir -p "$target_dir"
        cp -r "$TEMP_DIR/$file" "$target_dir/$(basename "$file")" || handle_error "Kunne ikke kopiere $file"
    done

    # Oprydning
    echo -e "${GREEN}Rydder op...${NC}"
    rm -rf "$TEMP_DIR"

    # Gendan konfiguration hvis det er en opdatering
    if [ "$mode" = "Opdaterer" ] && [ -d "$VSC_DIR/task-runner.backup" ]; then
        cp -r "$VSC_DIR/task-runner.backup/task-runner.config.json" "$VSC_DIR/task-runner/" 2>/dev/null || true
        rm -rf "$VSC_DIR/task-runner.backup"
    fi
}

# Hovedprogram
echo -e "${BLUE}Task Runner Dashboard Setup${NC}"

# Tjek nuværende installation
current_version=$(check_installation)
latest_version=$(get_latest_version)

debug_info "Nuværende version: $current_version"
debug_info "Seneste version: $latest_version"

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
echo -e "${GREEN}Se $VSC_DIR/task-runner/HOWTO.md for brugsanvisning${NC}" 