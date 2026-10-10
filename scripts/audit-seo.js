const fs = require('fs');

const html = fs.readFileSync('dist/web/index.html', 'utf8');

// Title
const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
const title = titleMatch ? titleMatch[1].trim() : '';
console.log('Title (' + title.length + ' chars):', title);

// Description
const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
const desc = descMatch ? descMatch[1].trim() : '';
console.log('Description (' + desc.length + ' chars):', desc);

// H1
const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
console.log('H1:', h1Match ? h1Match[1].trim() : 'NONE');

// H2s
const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].trim());
console.log('H2 Count (' + h2Matches.length + '):', h2Matches);

// H3s
const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1].trim());
console.log('H3 Count (' + h3Matches.length + '):', h3Matches.length);

// Word count of text body
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyHtml = bodyMatch ? bodyMatch[1] : html;
const cleanText = bodyHtml
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const words = cleanText.split(/\s+/).filter(w => w.length > 0);
console.log('Clean Text Word Count:', words.length);
