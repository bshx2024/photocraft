const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8765;
const HOST = '127.0.0.1';
const ROOT_DIR = path.resolve(__dirname, '..', 'dist', 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const localStats = {
  bots: {},
  visitors: {}
};

function getBjTime() {
  const d = new Date();
  const beijing = new Date(d.getTime() + (8 * 60 + d.getTimezoneOffset()) * 60000);
  const m = String(beijing.getMonth() + 1).padStart(2, '0');
  const day = String(beijing.getDate()).padStart(2, '0');
  const h = String(beijing.getHours()).padStart(2, '0');
  const min = String(beijing.getMinutes()).padStart(2, '0');
  return {
    full: `${m}-${day} ${h}:${min}`,
    day: `${m}-${day}`
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  let reqPath = decodeURIComponent(parsedUrl.pathname);

  // 本地端点：查看爬虫与访客监控
  if (reqPath === '/__stats' || reqPath === '/api/crawler-stats') {
    if (parsedUrl.searchParams.get('format') === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(localStats, null, 2));
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>本地统计</title></head><body style="font-family:sans-serif;padding:20px;"><h2>PhotoCraft 本地开发监控</h2><pre>${JSON.stringify(localStats, null, 2)}</pre></body></html>`);
    return;
  }

  // 模拟请求记录
  const ua = req.headers['user-agent'] || '';
  const ref = req.headers['referer'] || '';
  const bj = getBjTime();
  if (/googlebot/i.test(ua)) {
    if (!localStats.bots['googlebot']) localStats.bots['googlebot'] = { name: 'Googlebot', firstSeen: bj.full, firstPageSeen: bj.full, dailyPages: {} };
    localStats.bots['googlebot'].dailyPages[bj.day] = (localStats.bots['googlebot'].dailyPages[bj.day] || 0) + 1;
  } else if (/oai-searchbot/i.test(ua)) {
    if (!localStats.bots['oai-searchbot']) localStats.bots['oai-searchbot'] = { name: 'OAI-SearchBot', firstSeen: bj.full, firstPageSeen: bj.full, dailyPages: {} };
    localStats.bots['oai-searchbot'].dailyPages[bj.day] = (localStats.bots['oai-searchbot'].dailyPages[bj.day] || 0) + 1;
  } else if (!/bot|spider|crawl/i.test(ua) && (reqPath === '/' || reqPath.endsWith('.html'))) {
    const src = ref.includes('google') ? 'Google' : (ref.includes('chatgpt') ? 'ChatGPT' : '直接访问');
    if (!localStats.visitors[src]) localStats.visitors[src] = { firstVisitor: { time: bj.full, country: '本地测试', path: reqPath }, dailyCounts: {} };
    localStats.visitors[src].dailyCounts[bj.day] = (localStats.visitors[src].dailyCounts[bj.day] || 0) + 1;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(ROOT_DIR, reqPath));

  // Security check: ensure path stays within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`PhotoCraft web server running at http://${HOST}:${PORT}/ (serving ${ROOT_DIR})`);
});
