export const icons: { [key: string]: string } = {
    'debug': '🐛',
    'package': '📦',
    'beaker': '🧪',
    'checklist': '✅',
    'graph': '📊',
    'play': '▶️',
    'eye': '👁️',
    'tools': '🔧',
    'book': '📚',
    'check': '✔️'
};

export function getIconHtml(iconName: string): string {
    return icons[iconName] || '▶️';
}

export function getAllIcons(): { [key: string]: string } {
    return { ...icons };
}

export function isValidIcon(iconName: string): boolean {
    return iconName in icons;
} 