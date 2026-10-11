/**
 * PhotoCraft Cloudflare Worker & Analytics Interceptor
 * 
 * 功能：
 * 1. 代理静态资源 (env.ASSETS)
 * 2. 精准统计合法爬虫 (只算 Cloudflare 官方 IP/Bot 校验为真的爬虫)
 * 3. 统计真人浏览器访客与引流渠道 (Google, ChatGPT, Bing, Perplexity, Direct)
 * 4. 提供与原版报表 1:1 对齐的可视化仪表盘 (/__stats) 及 JSON 接口
 */

const KNOWN_BOTS = [
  { id: 'googlebot', name: 'Googlebot', match: /googlebot/i, orgMatch: /google/i },
  { id: 'oai-searchbot', name: 'OAI-SearchBot（ChatGPT 搜索索引）', match: /oai-searchbot/i, orgMatch: /openai/i },
  { id: 'chatgpt-user', name: 'ChatGPT-User（ChatGPT 替用户读网页）', match: /chatgpt-user/i, orgMatch: /openai/i },
  { id: 'gptbot', name: 'GPTBot（数据抓取）', match: /gptbot/i, orgMatch: /openai/i },
  { id: 'bingbot', name: 'Bingbot', match: /bingbot/i, orgMatch: /microsoft/i },
  { id: 'claudebot', name: 'ClaudeBot', match: /claudebot|anthropic-ai/i, orgMatch: /anthropic/i },
  { id: 'applebot', name: 'Applebot', match: /applebot/i, orgMatch: /apple/i },
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

// 内存降级缓存（当 KV 未绑定时保证正常运行与临时聚合）
let memoryStore = {
  bots: {},
  visitors: {},
  initTime: getBeijingTime().full
};

async function loadStats(env) {
  if (env.STATS_KV) {
    try {
      const data = await env.STATS_KV.get('photocraft_crawler_analytics', 'json');
      if (data) return data;
    } catch (e) {
      console.error('Failed to read from STATS_KV', e);
    }
  }
  return memoryStore;
}

async function saveStats(env, stats) {
  memoryStore = stats;
  if (env.STATS_KV) {
    try {
      await env.STATS_KV.put('photocraft_crawler_analytics', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to write to STATS_KV', e);
    }
  }
}

// 判断真实爬虫
function identifyVerifiedBot(ua, cf) {
  const isVerified = cf?.botManagement?.verifiedBot === true;
  const asOrg = cf?.asOrganization || '';

  for (const bot of KNOWN_BOTS) {
    if (bot.match.test(ua)) {
      // 满足 Cloudflare verifiedBot，或者组织 ASN 校验通过
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

// 识别引流来源
function identifyReferrer(referrerUrl) {
  if (!referrerUrl) return '直接访问';
  try {
    const url = new URL(referrerUrl);
    const host = url.hostname.toLowerCase();
    if (host.includes('google.')) return 'Google';
    if (host.includes('chatgpt.com') || host.includes('openai.com')) return 'ChatGPT';
    if (host.includes('bing.com')) return 'Bing';
    if (host.includes('perplexity.ai')) return 'Perplexity';
    if (host.includes('claude.ai')) return 'Claude';
    return host;
  } catch {
    return '其他外部来源';
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. 仪表盘与接口展示
    if (pathname === '/__stats' || pathname === '/api/crawler-stats') {
      const stats = await loadStats(env);
      if (url.searchParams.get('format') === 'json') {
        return new Response(JSON.stringify(stats, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      return renderDashboard(stats);
    }

    // 2. 静态资源直通 (wasm/js/css/图片等不计入爬虫与真实访客主指标)
    if (STATIC_EXT_REGEX.test(pathname)) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Assets not configured', { status: 404 });
    }

    // 3. 统计拦截与异步记录
    ctx.waitUntil(trackRequest(request, env));

    // 4. 返回实际页面内容
    if (env.ASSETS) {
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
    const bj = getBeijingTime();

    const isRobots = pathname === '/robots.txt';
    const isSitemap = pathname === '/sitemap.xml';
    const isIndexNow = pathname.toLowerCase().includes('indexnow');
    const isPage = !isRobots && !isSitemap && !isIndexNow && (pathname === '/' || pathname.endsWith('.html') || !pathname.includes('.'));

    const botInfo = identifyVerifiedBot(ua, cf);

    // 记录合规的真爬虫 (只算 IP 验证为真的)
    if (botInfo && botInfo.isAuthentic) {
      const stats = await loadStats(env);
      if (!stats.bots) stats.bots = {};
      if (!stats.bots[botInfo.id]) {
        stats.bots[botInfo.id] = {
          name: botInfo.name,
          firstSeen: bj.full,
          firstPageSeen: null,
          note: isRobots ? '（只读 robots.txt）' : (isSitemap ? '（只读 sitemap）' : (isIndexNow ? '（只读 IndexNow key 文件）' : '同时')),
          dailyPages: {}
        };
      }

      const botRecord = stats.bots[botInfo.id];

      if (isPage) {
        if (!botRecord.firstPageSeen) {
          botRecord.firstPageSeen = bj.full;
          botRecord.note = '同时';
        }
        botRecord.dailyPages[bj.day] = (botRecord.dailyPages[bj.day] || 0) + 1;
      } else {
        if (!botRecord.firstPageSeen) {
          if (isRobots) botRecord.note = '（只读 robots.txt）';
          else if (isSitemap) botRecord.note = '（只读 sitemap）';
          else if (isIndexNow) botRecord.note = '（只读 IndexNow key 文件）';
        }
      }

      await saveStats(env, stats);
      return;
    }

    // 记录真实真人浏览器访客 (排除常见机器人 UA)
    const isBrowser = /mozilla/i.test(ua) && !/bot|spider|crawl|slurp|curl|wget|python|headless/i.test(ua);
    if (isBrowser && isPage && !botInfo) {
      const stats = await loadStats(env);
      if (!stats.visitors) stats.visitors = {};

      const source = identifyReferrer(referrer);
      const country = cf.country || '未知国家';

      if (!stats.visitors[source]) {
        stats.visitors[source] = {
          firstVisitor: {
            time: bj.full,
            country: country,
            path: pathname
          },
          dailyCounts: {}
        };
      }

      const visitorRecord = stats.visitors[source];
      visitorRecord.dailyCounts[bj.day] = (visitorRecord.dailyCounts[bj.day] || 0) + 1;

      await saveStats(env, stats);
    }
  } catch (err) {
    console.error('Error tracking request:', err);
  }
}

// 渲染与原图一模一样的仪表盘
function renderDashboard(stats) {
  const bots = stats.bots || {};
  const visitors = stats.visitors || {};

  // 获取最近的日期列表
  const allDaysSet = new Set();
  Object.values(bots).forEach(b => Object.keys(b.dailyPages || {}).forEach(d => allDaysSet.add(d)));
  Object.values(visitors).forEach(v => Object.keys(v.dailyCounts || {}).forEach(d => allDaysSet.add(d)));
  const sortedDays = Array.from(allDaysSet).sort();
  if (sortedDays.length === 0) {
    sortedDays.push(getBeijingTime().day);
  }

  // 构造爬虫行
  const crawlerRows = Object.values(bots).map(b => {
    const dailyStr = sortedDays.map(d => `${d}: ${b.dailyPages[d] || 0}`).join('， ');
    return `
      <tr>
        <td class="name-col"><strong>${escapeHtml(b.name)}</strong></td>
        <td>${escapeHtml(b.firstSeen)} ${escapeHtml(b.note || '')}</td>
        <td><strong>${escapeHtml(b.firstPageSeen || '还没有')}</strong></td>
        <td>${escapeHtml(dailyStr || '0')}</td>
      </tr>
    `;
  }).join('');

  // 构造真实访客行
  const visitorRows = Object.entries(visitors).map(([source, v]) => {
    const firstInfo = v.firstVisitor ? `<strong>${v.firstVisitor.time}</strong>（${v.firstVisitor.country}，${v.firstVisitor.path}）` : '—';
    const dayCounts = sortedDays.map(d => v.dailyCounts[d] || 0).join(' / ');
    return `
      <tr>
        <td class="name-col"><strong>${escapeHtml(source)}</strong></td>
        <td>${firstInfo}</td>
        <td>${dayCounts}</td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>PhotoCraft 爬虫与真实引流监控仪表盘</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 980px;
      padding: 0 20px;
      background: #f8fafc;
      color: #1e293b;
    }
    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 28px 0 12px 0;
      color: #0f172a;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.92rem;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .name-col {
      color: #0f172a;
      width: 25%;
    }
    .note {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 8px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.78rem;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <h2>爬虫什么时候来的（北京时间，只算 IP 验证为真的）</h2>
  <div class="card">
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
  <div class="note">注意：爬虫记录通过 Cloudflare verifiedBot / 权威组织 ASN 反向校验，伪造 User-Agent 的扫描流量已被剔除。</div>

  <h2>什么时候带来真实访客（只算真人浏览器）</h2>
  <div class="card">
    <table>
      <thead>
        <tr>
          <th>来源</th>
          <th>第一个真实访客</th>
          <th>每天访客数（${sortedDays.join(' / ')}）</th>
        </tr>
      </thead>
      <tbody>
        ${visitorRows || '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:24px;">暂无真实引流访客记录</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
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
