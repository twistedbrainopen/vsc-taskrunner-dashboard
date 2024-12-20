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
    return exports.icons[iconName] || '▶️';
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