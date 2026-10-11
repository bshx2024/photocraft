/**
 * PhotoCraft Cloudflare Worker & SEO/GEO 监控拦截器
 * 
 * 核心指标与设计完全对齐：
 * 1. 爬虫足迹监控（北京时间，只算 IP 验证为真的）
 *    - 精准解耦首次访问动作 (robots.txt / sitemap / IndexNow) 与首次抓页面时间 (同时 / 实际时间)
 *    - 细分 AI 爬虫 (OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, PerplexityBot)
 * 2. 真实引流访客 (只算真人浏览器)
 *    - 来源精准归因 (Google, ChatGPT, 直接访问, Bing、Perplexity 等)
 *    - 记录首个真实访客：时间 + 国家地区 + 首次着陆页面
 *    - 每日访客 UV 去重统计
 * 3. 1:1 像素级还原可视化看板 (/__stats) 及 JSON 接口
 */

const KNOWN_BOTS = [
  { id: 'googlebot', name: 'Googlebot', match: /googlebot/i, orgMatch: /google/i },
  { id: 'oai-searchbot', name: 'OAI-SearchBot（ChatGPT 搜索索引）', match: /oai-searchbot/i, orgMatch: /openai|microsoft/i },
  { id: 'bingbot', name: 'Bingbot', match: /bingbot/i, orgMatch: /microsoft/i },
  { id: 'applebot', name: 'Applebot', match: /applebot/i, orgMatch: /apple/i },
  { id: 'claudebot', name: 'ClaudeBot', match: /claudebot|anthropic-ai/i, orgMatch: /anthropic|amazon/i },
  { id: 'chatgpt-user', name: 'ChatGPT-User（ChatGPT 替用户读网页）', match: /chatgpt-user/i, orgMatch: /openai|microsoft/i },
  { id: 'gptbot', name: 'GPTBot', match: /gptbot/i, orgMatch: /openai|microsoft/i },
  { id: 'perplexity', name: 'PerplexityBot', match: /perplexitybot/i, orgMatch: /perplexity/i }
];

const STATIC_EXT_REGEX = /\.(wasm|js|mjs|css|png|jpg|jpeg|gif|svg|ico|ttf|otf|woff|woff2|map)$/i;

// 格式化北京时间 YYYY-MM-DD HH:mm
function getBeijingTime(date = new Date()) {
  const beijingTime = new Date(date.getTime() + (8 * 60 + date.getTimezoneOffset()) * 60000);
  const m = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const d = String(beijingTime.getDate()).padStart(2, '0');
  const h = String(beijingTime.getHours()).padStart(2, '0');
  const min = String(beijingTime.getMinutes()).padStart(2, '0');
  return {
    full: `${m}-${d} ${h}:${min}`,
    day: `${m}-${d}`,
    dateStr: `${beijingTime.getFullYear()}-${m}-${d}`
  };
}

let memoryStore = {
  bots: {},
  visitors: {},
  visitorIps: {},
  initTime: null
};

async function loadStats(env) {
  if (env && env.STATS_KV) {
    try {
      const data = await env.STATS_KV.get('photocraft_crawler_analytics', 'json');
      if (data) {
        if (!data.bots) data.bots = {};
        if (!data.visitors) data.visitors = {};
        if (!data.visitorIps) data.visitorIps = {};
        if (!data.initTime) data.initTime = getBeijingTime().full;
        return data;
      }
    } catch (e) {
      console.error('Failed to read from STATS_KV', e);
    }
  }
  if (!memoryStore.initTime) {
    memoryStore.initTime = getBeijingTime().full;
  }
  return memoryStore;
}

async function saveStats(env, stats) {
  if (!stats.initTime) {
    stats.initTime = getBeijingTime().full;
  }
  memoryStore = stats;
  if (env && env.STATS_KV) {
    try {
      await env.STATS_KV.put('photocraft_crawler_analytics', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to write to STATS_KV', e);
    }
  }
}

// 验证真实搜索引擎与 AI 爬虫（只算 IP/ASN 验证为真的）
function identifyVerifiedBot(ua, cf, headers) {
  const debugMock = headers?.get('x-mock-bot');
  if (debugMock) {
    const found = KNOWN_BOTS.find(b => b.id === debugMock.toLowerCase());
    if (found) return { ...found, isAuthentic: true };
  }

  const isVerified = cf?.botManagement?.verifiedBot === true;
  const asOrg = (cf?.asOrganization || '').toLowerCase();

  for (const bot of KNOWN_BOTS) {
    if (bot.match.test(ua)) {
      const isAuthentic = isVerified || (bot.orgMatch && bot.orgMatch.test(asOrg));
      return {
        ...bot,
        isAuthentic: Boolean(isAuthentic),
        asOrg
      };
    }
  }
  return null;
}

// 识别引流来源（对齐原版表格类别）
function identifyReferrer(referrerUrl) {
  if (!referrerUrl) return '直接访问';
  try {
    const url = new URL(referrerUrl);
    const host = url.hostname.toLowerCase();
    if (host.includes('google.')) return 'Google';
    if (host.includes('chatgpt.com') || host.includes('openai.com')) return 'ChatGPT';
    if (host.includes('bing.com') || host.includes('perplexity.ai')) return 'Bing、Perplexity';
    return host;
  } catch {
    return '直接访问';
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. 监控看板页面 (/__stats) 及 JSON 接口
    if (pathname === '/__stats' || pathname === '/api/crawler-stats') {
      const stats = await loadStats(env);
      if (url.searchParams.get('format') === 'json') {
        return new Response(JSON.stringify(stats, null, 2), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
      return renderDashboard(stats);
    }

    // 2. 静态资源直通 (wasm/js/css/图片等不计入主指标)
    if (STATIC_EXT_REGEX.test(pathname)) {
      if (env && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Assets not configured', { status: 404 });
    }

    // 3. 统计拦截与异步记录
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(trackRequest(request, env));
    } else {
      await trackRequest(request, env);
    }

    // 4. 返回实际页面内容
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('PhotoCraft Web Running', { status: 200 });
  }
};

async function trackRequest(request, env) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const ua = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const cf = request.cf || {};
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const bj = getBeijingTime();

    const isRobots = pathname === '/robots.txt';
    const isSitemap = pathname === '/sitemap.xml';
    const isIndexNow = pathname.toLowerCase().includes('indexnow') || /[a-f0-9]{32}\.txt/i.test(pathname);
    const isPage = !isRobots && !isSitemap && !isIndexNow && (pathname === '/' || pathname.endsWith('.html') || !pathname.includes('.'));

    const botInfo = identifyVerifiedBot(ua, cf, request.headers);

    // A. 记录合规真爬虫
    if (botInfo && botInfo.isAuthentic) {
      const stats = await loadStats(env);
      if (!stats.bots) stats.bots = {};
      
      let actionTag = '';
      if (isRobots) actionTag = '（只读 robots.txt）';
      else if (isSitemap) actionTag = '（只读 sitemap）';
      else if (isIndexNow) actionTag = '（只读 IndexNow key 文件）';

      if (!stats.bots[botInfo.id]) {
        stats.bots[botInfo.id] = {
          name: botInfo.name,
          firstSeen: bj.full,
          actionNote: actionTag,
          firstPageSeen: isPage ? '同时' : null,
          dailyPages: {}
        };
      }

      const botRecord = stats.bots[botInfo.id];

      if (isPage) {
        if (!botRecord.firstPageSeen) {
          botRecord.firstPageSeen = (botRecord.firstSeen === bj.full && !botRecord.actionNote) ? '同时' : bj.full;
        }
        botRecord.dailyPages[bj.day] = (botRecord.dailyPages[bj.day] || 0) + 1;
      } else {
        if (!botRecord.firstPageSeen && !botRecord.actionNote) {
          botRecord.actionNote = actionTag;
        }
      }

      await saveStats(env, stats);
      return;
    }

    // B. 记录真人浏览器访客 (UV 去重)
    const isBrowser = /mozilla/i.test(ua) && !/bot|spider|crawl|slurp|curl|wget|python|headless/i.test(ua);
    if (isBrowser && isPage && !botInfo) {
      const stats = await loadStats(env);
      if (!stats.visitors) stats.visitors = {};
      if (!stats.visitorIps) stats.visitorIps = {};

      const source = identifyReferrer(referrer);
      const country = cf.country || '海外';
      const landingPath = pathname === '/' ? '首页' : pathname;

      if (!stats.visitors[source]) {
        stats.visitors[source] = {
          firstVisitor: {
            time: bj.full,
            country: country,
            path: landingPath
          },
          dailyCounts: {}
        };
      }

      const uvKey = `${source}:${bj.day}`;
      if (!stats.visitorIps[uvKey]) {
        stats.visitorIps[uvKey] = [];
      }

      if (!stats.visitorIps[uvKey].includes(ip)) {
        stats.visitorIps[uvKey].push(ip);
        const visitorRecord = stats.visitors[source];
        visitorRecord.dailyCounts[bj.day] = (visitorRecord.dailyCounts[bj.day] || 0) + 1;
        await saveStats(env, stats);
      }
    }
  } catch (err) {
    console.error('Error tracking request:', err);
  }
}

function renderDashboard(stats) {
  const bots = stats.bots || {};
  const visitors = stats.visitors || {};

  const allDaysSet = new Set();
  Object.values(bots).forEach(b => Object.keys(b.dailyPages || {}).forEach(d => allDaysSet.add(d)));
  Object.values(visitors).forEach(v => Object.keys(v.dailyCounts || {}).forEach(d => allDaysSet.add(d)));
  const sortedDays = Array.from(allDaysSet).sort();
  if (sortedDays.length === 0) {
    sortedDays.push(getBeijingTime().day);
  }

  const crawlerOrder = ['googlebot', 'oai-searchbot', 'bingbot', 'applebot', 'claudebot', 'chatgpt-user', 'gptbot', 'perplexity'];
  const orderedBots = [];
  crawlerOrder.forEach(id => {
    if (bots[id]) orderedBots.push(bots[id]);
  });
  Object.keys(bots).forEach(id => {
    if (!crawlerOrder.includes(id)) orderedBots.push(bots[id]);
  });

  const crawlerRows = orderedBots.map(b => {
    const dailyStr = sortedDays.map(d => `${d}: ${b.dailyPages?.[d] || 0}`).join('， ');
    const firstSeenText = b.firstSeen ? `${b.firstSeen} ${b.actionNote ? b.actionNote : ''}` : '-';
    const firstPageText = b.firstPageSeen ? b.firstPageSeen : '还没有';
    return `
      <tr>
        <td class="name-col"><strong>${escapeHtml(b.name)}</strong></td>
        <td>${escapeHtml(firstSeenText)}</td>
        <td><strong>${escapeHtml(firstPageText)}</strong></td>
        <td>${escapeHtml(dailyStr || '0')}</td>
      </tr>
    `;
  }).join('');

  const defaultSources = ['Google', 'ChatGPT', '直接访问', 'Bing、Perplexity'];
  const allSources = Array.from(new Set([...defaultSources, ...Object.keys(visitors)]));

  const visitorRows = allSources.map(source => {
    const v = visitors[source];
    let firstInfo = '—';
    let dayCounts = sortedDays.map(() => '0').join(' / ');

    if (v) {
      if (v.firstVisitor) {
        firstInfo = `<strong>${escapeHtml(v.firstVisitor.time)}</strong>（${escapeHtml(v.firstVisitor.country)}，${escapeHtml(v.firstVisitor.path)}）`;
      }
      dayCounts = sortedDays.map(d => v.dailyCounts?.[d] || 0).join(' / ');
    }

    return `
      <tr>
        <td class="name-col"><strong>${escapeHtml(source)}</strong></td>
        <td>${firstInfo}</td>
        <td>${dayCounts}</td>
      </tr>
    `;
  }).join('');

  const initDate = stats.initTime ? stats.initTime.split(' ')[0] : getBeijingTime().day;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>PhotoCraft 爬虫与真实引流监控</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 980px;
      padding: 0 24px;
      background: #ffffff;
      color: #111827;
      line-height: 1.5;
    }
    h2 {
      font-size: 1.12rem;
      font-weight: 600;
      margin: 32px 0 14px 0;
      color: #111827;
    }
    .table-container {
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      overflow-x: auto;
      background: #fafafa;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.92rem;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      background: #ffffff;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .name-col {
      color: #0f172a;
      width: 28%;
    }
    .note {
      font-size: 0.86rem;
      color: #64748b;
      margin-top: 10px;
      margin-bottom: 28px;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .btn {
      font-size: 0.82rem;
      padding: 6px 14px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div></div>
    <div>
      <a class="btn" href="?format=json" target="_blank">导出 JSON 格式</a>
    </div>
  </div>

  <h2>爬虫什么时候来的（北京时间，只算 IP 验证为真的）</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>爬虫</th>
          <th>第一次来</th>
          <th>第一次抓页面</th>
          <th>每天抓的页面数</th>
        </tr>
      </thead>
      <tbody>
        ${crawlerRows || '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:24px;">暂无合规爬虫抓取记录</td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="note">注意：爬虫记录是 ${initDate} 下午同步这个功能后才开始的，在那之前来过的爬虫没有记录。</div>

  <h2>什么时候带来真实访客（只算真人浏览器）</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>来源</th>
          <th>第一个真实访客</th>
          <th>每天访客数（${sortedDays.join(' / ')}）</th>
        </tr>
      </thead>
      <tbody>
        ${visitorRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
