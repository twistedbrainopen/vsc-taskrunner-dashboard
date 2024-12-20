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