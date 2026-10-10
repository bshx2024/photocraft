const fs = require('fs');

let html = fs.readFileSync('dist/web/index.html', 'utf8');

// 1. Clean Meta description (no duplicate 'PhotoCraft')
html = html.replace(/PhotoCraft is the PhotoCraft Photoshop alternative for layered PSD editing/g, 'PhotoCraft is the premier free Photoshop alternative for layered PSD editing');

// 2. Add natural occurrences of "PhotoCraft Online" and "PhotoCraft photo editor"
// so they form strong 2nd and 3rd candidates
html = html.replace(/Launch Online Editor/g, 'Launch PhotoCraft Online');
html = html.replace(/Open PhotoCraft Online Canvas/g, 'Launch PhotoCraft Online Editor');

fs.writeFileSync('dist/web/index.html', html, 'utf8');
fs.writeFileSync('apps/photocraft-web/index.html', html, 'utf8');

console.log('Cleaned description and reinforced secondary PhotoCraft candidates.');
