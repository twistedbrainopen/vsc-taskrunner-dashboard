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
    // Konverter vores icon navne til Codicon navne
    const codiconMap: { [key: string]: string } = {
        'package': 'package',
        'tools': 'tools',
        'eye': 'eye',
        'play': 'play',
        'books': 'book',
        'check': 'check',
        'report': 'graph',
        'docs': 'book',
        'clean': 'clear-all',
        'update': 'sync',
        'lint': 'wand',
        'pdsl': 'file-code'
    };

    const codiconName = codiconMap[iconName] || 'symbol-misc'; // Fallback ikon
    return `<i class="codicon codicon-${codiconName}"></i>`;
}

export function getAllIcons(): { [key: string]: string } {
    return { ...icons };
}

export function isValidIcon(iconName: string): boolean {
    return iconName in icons;
} 