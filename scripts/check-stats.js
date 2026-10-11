#!/usr/bin/env node
/**
 * 爬虫与真实引流数据查询 CLI 工具
 * 用法:
 *   node scripts/check-stats.js
 *   node scripts/check-stats.js https://your-domain.workers.dev
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

function getVisualWidth(str) {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef) || (code >= 0x3000 && code <= 0x303f)) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

function padEndVisual(str, targetWidth) {
  const current = getVisualWidth(str);
  if (current >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - current);
}

function renderConsoleReport(stats) {
  const bots = stats.bots || {};
  const visitors = stats.visitors || {};

  console.log(`📊 【爬虫抓取足迹】（北京时间，只算 IP 验证为真的）`);
  console.log(`---------------------------------------------------------------------------------------------------`);
  console.log(`${padEndVisual('爬虫名称', 38)} | ${padEndVisual('第一次来', 28)} | ${padEndVisual('第一次抓页面', 18)} | 每天抓的页面数`);
  console.log(`---------------------------------------------------------------------------------------------------`);
  const botKeys = Object.keys(bots);
  if (botKeys.length === 0) {
    console.log(`(暂无已验证合规爬虫抓取记录)`);
  } else {
    for (const k of botKeys) {
      const b = bots[k];
      const name = padEndVisual(b.name || k, 38);
      const firstSeenRaw = `${b.firstSeen || '-'} ${b.actionNote || ''}`.trim();
      const firstSeen = padEndVisual(firstSeenRaw, 28);
      const firstPage = padEndVisual(b.firstPageSeen || '还没有', 18);
      const daily = Object.entries(b.dailyPages || {}).map(([d, c]) => `${d}: ${c}`).join(', ') || '0';
      console.log(`${name} | ${firstSeen} | ${firstPage} | ${daily}`);
    }
  }
  console.log(`---------------------------------------------------------------------------------------------------\n`);

  console.log(`👥 【真实引流访客】（只算真人浏览器）`);
  console.log(`---------------------------------------------------------------------------------------------------`);
  console.log(`${padEndVisual('来源', 18)} | ${padEndVisual('第一个真实访客', 45)} | 每天访客数 (UV)`);
  console.log(`---------------------------------------------------------------------------------------------------`);
  const defaultSources = ['Google', 'ChatGPT', '直接访问', 'Bing、Perplexity'];
  const allSources = Array.from(new Set([...defaultSources, ...Object.keys(visitors)]));

  for (const src of allSources) {
    const v = visitors[src];
    const sourceName = padEndVisual(src, 18);
    let firstStr = '—';
    let daily = '0';
    if (v) {
      if (v.firstVisitor) {
        firstStr = `${v.firstVisitor.time} (${v.firstVisitor.country}，${v.firstVisitor.path})`;
      }
      daily = Object.entries(v.dailyCounts || {}).map(([d, c]) => `${d}: ${c}`).join(' / ') || '0';
    }
    console.log(`${sourceName} | ${padEndVisual(firstStr, 45)} | ${daily}`);
  }
  console.log(`---------------------------------------------------------------------------------------------------\n`);
}

async function run() {
  console.log(`\n============================================================`);
  console.log(`🔍 正在拉取监控数据: ${targetUrl}`);
  console.log(`============================================================\n`);

  try {
    let stats;
    if (fs.existsSync(targetUrl)) {
      stats = JSON.parse(fs.readFileSync(targetUrl, 'utf8'));
    } else {
      stats = await fetchJson(targetUrl);
    }
    renderConsoleReport(stats);
  } catch (err) {
    const localFile = path.resolve(__dirname, 'stats-local.json');
    if (fs.existsSync(localFile)) {
      console.log(`ℹ️ 服务尚未连接，自动展示本地缓存数据 (${localFile}):\n`);
      try {
        const stats = JSON.parse(fs.readFileSync(localFile, 'utf8'));
        renderConsoleReport(stats);
        return;
      } catch (e) {}
    }
    console.error(`❌ 获取统计数据失败:`, err.message);
    console.log(`提示: 若在本地调试，请确保服务已启动 (node scripts/serve-web.js)；若在线上请指定 Worker 完整域名。\n`);
  }
}

run();
