const fs = require('fs');

let html = fs.readFileSync('dist/web/index.html', 'utf8');

// Check footer h4
html = html.replace(/<h4>(.*?)<\/h4>/g, '<p class="footer-title">$1</p>');
html = html.replace(/\.footer-col h4/g, '.footer-col .footer-title');

// Check headings
const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
let match;
let list = [];
while ((match = regex.exec(html)) !== null) {
  list.push({ level: parseInt(match[1]), text: match[2].replace(/<[^>]+>/g, '').trim() });
}
console.log('Total headings:', list.length);
list.forEach((h, i) => console.log(i + 1, 'H' + h.level, h.text));
