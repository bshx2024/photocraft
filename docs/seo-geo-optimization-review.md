# PhotoCraft SEO & GEO (Generative Engine Optimization) 优化复盘与追踪记录

## 一、 背景与基准数据快照（Baseline - 2026-10-20）

### 1. 核心页面表现（Google Search Console）
* **Landing Page**: `https://photocraft.work/`
* **Clicks (点击数)**: 135
* **Impressions (曝光数)**: 2,681
* **Average CTR (平均点击率)**: 5.0%
* **Average Position (平均排名)**: 9.7

### 2. Top Queries 数据切片分析
| 搜索词 (Query) | Clicks | Impressions | CTR | Position | 意图与现状分析 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `photoshop craft` | 14 | 175 | 8.0% | 8.3 | 核心流量词，高意图 |
| `craft photoshop` | 8 | 150 | 5.3% | 7.4 | 核心流量词 |
| `photocraft web` | 6 | 170 | 3.5% | 7.7 | 在线版搜索词，CTR 偏低 |
| `photo craft software` | 4 | 37 | 10.8% | 9.4 | 软件意图强烈，点击转化率极高 |
| `photocraft photoshop` | 3 | 54 | 5.6% | 7.4 | 品牌+类目词 |
| `photocraft` | 2 | 206 | 1.0% | 26.2 | **核心品牌词受阻**（在第 3 页，最大失血点） |
| `autocraft photoshop` | 2 | 25 | 8.0% | 8.0 | 关联词 |
| `photocraft photoshop alternative` | 2 | 17 | 11.8% | 6.4 | 替代品刚需，高意向 |
| `adobe alternative photocraft` | 2 | 3 | 66.7% | 2.3 | 高排名高转化 |
| `photocraft online` | 1 | 33 | 3.0% | 10.5 | 在线工具词，需打消使用门槛 |

---

## 二、 核心优化策略与实施落地清单

### 1. 自然搜索 CTR 提升策略（打消阻力与心理刺激）
* **Title Tag 升级**：
  * 原标题：`PhotoCraft: Free Online Photoshop Alternative & Web PSD Editor`
  * 现标题：`PhotoCraft: Free Online Photoshop Alternative & Web PSD Editor (No Login)`
  * Rationale：植入 `(No Login)` 爽点触发词，打消用户“找工具必须注册/试用期绑定信用卡”的最大抗拒点。
* **Meta Description 升级**：
  * 引入直接行动召唤与痛点清单：*“Looking for a free Photoshop alternative? Open, edit & save multi-layer PSD files online in your browser. 1:1 PS shortcuts, 52 tools, zero subscriptions, no install or login required. Try PhotoCraft now!”*
  * 同步更新 Open Graph (`og:title`, `og:description`) 与 Twitter Cards。
* **Hero 区域文案与 CTA 强化**：
  * 按钮文案升级为：`🚀 Launch Free Online (No Login)`；
  * 第一段注入权威直接定义句（Definition sentence），方便大模型直接抽取引用。

### 2. GEO（生成式引擎与大模型搜索）优化
* **结构化数据与对话式 Q&A 增强**：
  * 在 Schema.org `FAQPage` 和页面 `<details class="faq-item">` 中，将问题强化为大模型高频提问的长句（Conversational Prompts）：
    * *“How can I open and edit a PSD file online for free without Photoshop?”*
    * *“Why is PhotoCraft considered the best free Photoshop alternative?”*
    * *“Can PhotoCraft open and save multi-layer PSD files with layer styles?”*
    * *“Is PhotoCraft completely free to use without subscriptions or login?”*
    * *“How is PhotoCraft different from Photopea and GIMP?”*
    * *“Are my images and PSD files uploaded to a remote server?”*
* **升级 `llms.txt` 与 `llms-full.txt` 规范**：
  * 增加核心评测对比矩阵（Markdown Table）：覆盖价格、账号门槛、快捷键一致性、PSD 还原度、性能运行时、隐私与 MCP 支持；
  * 增加极简四步操作指南（Step-by-Step How-To）；
  * 强化 AI Coding Agent（Claude, Cursor, Windsurf, Antigravity）通过 MCP Protocol 自动化调用 PhotoCraft 的说明；
  * 在页面 `<head>` 中新增 `<meta name="llms-txt" content="https://photocraft.work/llms.txt">`。

### 3. 架构层：Cloudflare Worker Markdown 智能内容协商（Content Negotiation）
* 在 `worker.js` 中新增逻辑：当客户端请求带 `Accept: text/markdown` 请求首页时，Worker 自动以 `text/markdown; charset=utf-8` 返回 clean markdown（`llms.txt`），降低大模型爬虫抓取延迟与 Token 消耗，杜绝 JS/Wasm 渲染超时。

---

## 三、 复盘与后续监控指标（Next Steps）

1. **第 1 周监控（2026-10-27）**：
   * 观察 GSC 中的 Impressions 与 CTR 是否从 5.0% 提升至 7%~10%；
   * 观察 `(No Login)` 是否在 Google SERP 正常展现；
   * 观察 Cloudflare 看板（`/__stats`）中来自 `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot` 的抓取与页面爬取频次。
2. **第 2~4 周监控（2026-11-10）**：
   * 跟踪核心品牌词 `photocraft` 排名是否从 26.2 位向第一页逼近；
   * 测试在 Perplexity, ChatGPT Search, Bing Copilot 中询问 *“free web photoshop alternative”* 或 *“edit psd online without photoshop”* 时，PhotoCraft 的引用比例与链接露出情况。
