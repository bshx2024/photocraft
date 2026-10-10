const fs = require('fs');

const html = fs.readFileSync('dist/web/index.html', 'utf8');
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyHtml = bodyMatch ? bodyMatch[1] : html;
const cleanText = bodyHtml
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const words = cleanText.split(/\s+/).filter(w => w.length > 0);
console.log('Total Words:', words.length);

function getNGrams(n) {
  const map = {};
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(' ');
    map[gram] = (map[gram] || 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

console.log('Top 1-word:', getNGrams(1));
console.log('Top 2-words:', getNGrams(2));
console.log('Top 3-words:', getNGrams(3));
console.log('Top 4-words:', getNGrams(4));
