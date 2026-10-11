#!/usr/bin/env node
/**
 * 爬虫与真实引流数据查看 CLI 工具
 * 用法:
 *   node scripts/check-stats.js
 *   node scripts/check-stats.js https://your-domain.workers.dev
 */

const https = require('https');
const http = require('http');

const targetUrl = process.argv[2] || 'http://127.0.0.1:8765/__stats?format=json';

function fetchJson(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`解析 JSON 失败: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log(`\n============================================================`);
  console.log(`🔍 正在拉取统计数据: ${targetUrl}`);
  console.log(`============================================================\n`);

  try {
    const stats = await fetchJson(targetUrl);
    const bots = stats.bots || {};
    const visitors = stats.visitors || {};

    console.log(`📊 【爬虫抓取足迹】（北京时间，只算 IP 验证为真的）`);
    console.log(`-----------------------------------------------------------------------------------------`);
    console.log(`爬虫名称                                  | 第一次来           | 第一次抓页面       | 每日抓取页面数`);
    console.log(`-----------------------------------------------------------------------------------------`);
    const botKeys = Object.keys(bots);
    if (botKeys.length === 0) {
      console.log(`(暂无已验证爬虫访问记录)`);
    } else {
      for (const k of botKeys) {
        const b = bots[k];
        const name = (b.name || k).padEnd(40, ' ');
        const firstSeen = (b.firstSeen || '-').padEnd(18, ' ');
        const firstPage = (b.firstPageSeen || '还没有').padEnd(18, ' ');
        const daily = Object.entries(b.dailyPages || {}).map(([d, c]) => `${d}: ${c}`).join(', ') || '0';
        console.log(`${name} | ${firstSeen} | ${firstPage} | ${daily}`);
      }
    }
    console.log(`-----------------------------------------------------------------------------------------\n`);

    console.log(`👥 【真实引流访客】（只算真人浏览器）`);
    console.log(`-----------------------------------------------------------------------------------------`);
    console.log(`流量来源        | 第一个真实访客                         | 每日访问量`);
    console.log(`-----------------------------------------------------------------------------------------`);
    const visitorKeys = Object.keys(visitors);
    if (visitorKeys.length === 0) {
      console.log(`(暂无真实引流访客记录)`);
    } else {
      for (const src of visitorKeys) {
        const v = visitors[src];
        const sourceName = src.padEnd(15, ' ');
        const f = v.firstVisitor ? `${v.firstVisitor.time} (${v.firstVisitor.country}, ${v.firstVisitor.path})` : '—';
        const firstStr = f.padEnd(38, ' ');
        const daily = Object.entries(v.dailyCounts || {}).map(([d, c]) => `${d}: ${c}`).join(' / ') || '0';
        console.log(`${sourceName} | ${firstStr} | ${daily}`);
      }
    }
    console.log(`-----------------------------------------------------------------------------------------\n`);
  } catch (err) {
    console.error(`❌ 获取统计数据失败:`, err.message);
    console.log(`提示: 如果是本地测试，请先启动 node scripts/serve-web.js`);
  }
}

run();
