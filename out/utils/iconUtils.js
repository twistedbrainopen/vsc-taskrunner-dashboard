"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIcon = exports.getAllIcons = exports.getIconHtml = exports.icons = void 0;
exports.icons = {
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
function getIconHtml(iconName) {
    // Konverter vores icon navne til Codicon navne
    const codiconMap = {
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
exports.getIconHtml = getIconHtml;
function getAllIcons() {
    return { ...exports.icons };
}
exports.getAllIcons = getAllIcons;
function isValidIcon(iconName) {
    return iconName in exports.icons;
}
exports.isValidIcon = isValidIcon;
//# sourceMappingURL=iconUtils.js.map