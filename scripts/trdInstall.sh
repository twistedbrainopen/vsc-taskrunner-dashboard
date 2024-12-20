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