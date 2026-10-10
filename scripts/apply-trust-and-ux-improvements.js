const fs = require('fs');

let html = fs.readFileSync('dist/web/index.html', 'utf8');

// 1. Update CSS to include mockup styles and loading improvements
const extraCss = `
    /* Editor Mockup Showcase */
    .editor-mockup-wrapper {
      max-width: 1040px;
      margin: 32px auto 64px;
      padding: 0 20px;
    }
    .mockup-window {
      background: #181d28;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.15);
    }
    .mockup-titlebar {
      background: #11151f;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .mockup-dots { display: flex; gap: 6px; }
    .mockup-dots span { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .mockup-dots .red { background: #ef4444; }
    .mockup-dots .yellow { background: #f59e0b; }
    .mockup-dots .green { background: #10b981; }
    .mockup-title { font-size: 12px; color: #94a3b8; font-family: monospace; }
    .badge-tag { background: rgba(56, 189, 248, 0.15); color: var(--accent); font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    
    .mockup-menubar {
      background: #141924;
      padding: 6px 16px;
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .mockup-menubar span:hover { color: #fff; cursor: pointer; }
    
    .mockup-body {
      display: flex;
      min-height: 380px;
      background: #0f131c;
      position: relative;
    }
    .mockup-toolbar {
      width: 44px;
      background: #141924;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
      gap: 8px;
    }
    .mockup-toolbar span {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: 4px;
      color: #94a3b8;
      cursor: pointer;
    }
    .mockup-toolbar span.active, .mockup-toolbar span:hover {
      background: rgba(56, 189, 248, 0.2);
      color: var(--accent);
    }
    
    .mockup-canvas-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #1b2333 0%, #0d121c 100%);
      padding: 24px;
      position: relative;
      cursor: pointer;
    }
    .mockup-canvas-art {
      width: 85%;
      max-width: 460px;
      height: 220px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .art-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .art-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .art-subtitle { font-size: 12px; color: var(--accent); margin-top: 4px; }
    .mockup-canvas-cta {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .mockup-panels {
      width: 220px;
      background: #141924;
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
    }
    .mockup-panel-box {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 10px 12px;
    }
    .panel-header { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; }
    .adjustments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .adjustments-grid span {
      background: rgba(255,255,255,0.04);
      padding: 4px 6px;
      font-size: 11px;
      border-radius: 4px;
      color: #94a3b8;
      text-align: center;
    }
    .layers-list { display: flex; flex-direction: column; gap: 4px; }
    .layer-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      font-size: 11px;
      border-radius: 4px;
      color: #cbd5e1;
      background: rgba(255,255,255,0.02);
    }
    .layer-item.active { background: rgba(56, 189, 248, 0.15); color: #fff; }
    .layer-type { font-size: 10px; background: rgba(0,0,0,0.4); padding: 1px 4px; border-radius: 3px; }

    /* Transparency Matrix Cards */
    .status-matrix {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }
    .matrix-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
    }
    .matrix-card.stable { border-top: 3px solid #10b981; }
    .matrix-card.alpha { border-top: 3px solid #f59e0b; }
    .matrix-card.roadmap { border-top: 3px solid #38bdf8; }
    .matrix-tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .tag-stable { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .tag-alpha { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .tag-roadmap { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .matrix-list { list-style: none; font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px; }
    .matrix-list li { display: flex; align-items: flex-start; gap: 8px; }

    /* Privacy Banner */
    .privacy-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: var(--radius);
      padding: 32px;
      margin: 0 auto;
      max-width: 1000px;
    }

    @media (max-width: 840px) {
      .mockup-panels { display: none; }
      .mockup-toolbar { width: 36px; }
    }
`;

html = html.replace('</style>', extraCss + '\n  </style>');

// 2. Update Nav link
html = html.replace('<li><a href="#mcp">AI Automation</a></li>', '<li><a href="#privacy">Privacy Guarantee</a></li>');

// 3. Update Hero Section
const newHero = `
      <!-- Hero Section -->
      <section class="hero">
        <div class="tag-pill">
          ⚡ Open-Source in Pure Rust · WebGPU Acceleration · Public Alpha
        </div>
        <h1>PhotoCraft Photoshop Alternative: Free Online PSD Editor</h1>
        <p class="lead">
          <strong>Edit PSD Files. Create Without Limits.</strong><br>
          A free, open-source image editor inspired by Photoshop — right in your browser. Open multi-layer PSD files, adjust colors, work with masks, and export your creations with zero subscriptions or tracking.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" style="padding: 14px 28px; font-size: 16px;" onclick="launchEditor()">
            🚀 Launch PhotoCraft Online (Free)
          </button>
          <a class="btn btn-secondary" style="padding: 14px 24px; font-size: 16px;" href="https://github.com/bshx2024/photocraft" target="_blank" rel="noopener">
            ⭐ View on GitHub (v0.6.0 Alpha)
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 14px;">
          🔒 100% Client-Side Privacy: Your files never leave your device · Clean-room reimplementation, not affiliated with Adobe Inc.
        </p>
      </section>

      <!-- Interactive Editor Showcase & Live Preview Mockup -->
      <section class="editor-mockup-wrapper">
        <div class="mockup-window">
          <div class="mockup-titlebar">
            <div class="mockup-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="mockup-title">PhotoCraft Web v0.6.0 — [demo-artwork.psd @ 100% (RGB/8)]</div>
            <div><span class="badge-tag">WebGPU Active</span></div>
          </div>
          <div class="mockup-menubar">
            <span>File</span><span>Edit</span><span>Image</span><span>Layer</span><span>Select</span><span>Filter</span><span>View</span><span>Window</span><span>Help</span>
          </div>
          <div class="mockup-body">
            <div class="mockup-toolbar">
              <span title="Move (V)" class="active">↖</span>
              <span title="Marquee (M)">⬚</span>
              <span title="Lasso (L)">⚲</span>
              <span title="Crop (C)">⧉</span>
              <span title="Brush (B)">🖌️</span>
              <span title="Clone Stamp (S)">⎘</span>
              <span title="Eraser (E)">⌫</span>
              <span title="Pen (P)">✒️</span>
              <span title="Text (T)">T</span>
              <span title="Zoom (Z)">🔍</span>
            </div>
            <div class="mockup-canvas-area" onclick="launchEditor()">
              <div class="mockup-canvas-art">
                <span class="art-badge">100% Rust WASM Engine</span>
                <div class="art-title">PhotoCraft</div>
                <div class="art-subtitle">Multi-Layer PSD &amp; PSB Canvas</div>
              </div>
              <div class="mockup-canvas-cta">
                <button class="btn btn-primary" onclick="launchEditor()">🚀 Open Interactive Canvas</button>
                <span style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Click to launch or drag &amp; drop any PSD, PSB, PNG, or JPEG</span>
              </div>
            </div>
            <div class="mockup-panels">
              <div class="mockup-panel-box">
                <div class="panel-header">ADJUSTMENT LAYERS</div>
                <div class="adjustments-grid">
                  <span>Curves</span><span>Levels</span><span>Hue/Sat</span><span>Vibrance</span>
                </div>
              </div>
              <div class="mockup-panel-box" style="flex: 1;">
                <div class="panel-header">LAYERS (4)</div>
                <div class="layers-list">
                  <div class="layer-item active"><span class="layer-type">T</span> PhotoCraft Title</div>
                  <div class="layer-item"><span class="layer-type">fx</span> Layer Styles</div>
                  <div class="layer-item"><span class="layer-type">🖼️</span> Subject [Screen]</div>
                  <div class="layer-item"><span class="layer-type">🔒</span> Background</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
`;

// Replace existing hero & dropzone
html = html.replace(/<!-- Hero Section -->[\s\S]*?<!-- Key Capabilities Section -->/, newHero + '\n      <!-- Key Capabilities Section -->');

// 4. Update Features section with Transparent Feature Matrix
const newFeatures = `      <!-- Key Capabilities & Transparent Support Matrix -->
      <section id="features" style="max-width: 1200px; margin: 0 auto 90px; padding: 0 24px;">
        <h2 class="section-title">Why Choose the PhotoCraft Photoshop Alternative?</h2>
        <p class="section-desc">PhotoCraft delivers the creative freedom of a professional Photoshop alternative with zero subscriptions. As an open-source alpha, we believe in radical transparency regarding current capabilities and our engineering roadmap.</p>
        
        <div class="status-matrix">
          <div class="matrix-card stable">
            <span class="matrix-tag tag-stable">🟢 Supported &amp; Stable</span>
            <h3 style="font-size: 17px; color: #fff; margin-bottom: 10px;">Production-Ready Core</h3>
            <ul class="matrix-list">
              <li>✓ Multi-layer PSD and PSB import and pixel-accurate export</li>
              <li>✓ 27 ISO 32000 layer blend modes (Multiply, Screen, Overlay)</li>
              <li>✓ 16 non-destructive live adjustment layers (Curves, Levels, LUTs)</li>
              <li>✓ 52 native tools including Marquee, Magic Wand, and Brushes</li>
              <li>✓ 100% client-side privacy with on-device WebGPU rendering</li>
            </ul>
          </div>

          <div class="matrix-card alpha">
            <span class="matrix-tag tag-alpha">🟡 Active Alpha Development</span>
            <h3 style="font-size: 17px; color: #fff; margin-bottom: 10px;">In Progress (Current Focus)</h3>
            <ul class="matrix-list">
              <li>⚙ Advanced text warping and paragraph typographic metrics</li>
              <li>⚙ Complex multi-subpath bezier editing for vector shapes</li>
              <li>⚙ Smart Object embedded nested document transformation</li>
              <li>⚙ Additional third-party filter and plugin wrappers</li>
            </ul>
          </div>

          <div class="matrix-card roadmap">
            <span class="matrix-tag tag-roadmap">🔵 Upcoming Milestones</span>
            <h3 style="font-size: 17px; color: #fff; margin-bottom: 10px;">Future Architecture</h3>
            <ul class="matrix-list">
              <li>✦ Sandboxed WebAssembly plug-in marketplace</li>
              <li>✦ Native Model Context Protocol (MCP) server for AI coding agents</li>
              <li>✦ High-throughput headless CLI batch rendering engine</li>
              <li>✦ Native packaging for iOS and Android tablets</li>
            </ul>
          </div>
        </div>
      </section>
`;

html = html.replace(/<!-- Key Capabilities Section -->[\s\S]*?<!-- Comparison Section -->/, newFeatures + '\n      <!-- Comparison Section -->');

// 5. Replace AI automation standalone H2 with Dedicated Privacy Guarantee H2
const privacySection = `      <!-- Dedicated 100% Client-Side Privacy Guarantee -->
      <section class="compare-section" id="privacy">
        <h2 class="section-title">100% Client-Side Privacy in PhotoCraft Photoshop Alternative</h2>
        <p class="section-desc">Your creative files represent confidential work. PhotoCraft is engineered from the ground up to protect your privacy through architecture, not just promises.</p>
        
        <div class="privacy-box">
          <div class="grid-3" style="margin: 0; padding: 0;">
            <div style="padding: 12px;">
              <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
              <h3 style="font-size: 17px; color: #fff; margin-bottom: 8px;">Zero Cloud Uploads</h3>
              <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">When you open or drop a PSD file into PhotoCraft, exactly zero bytes are transmitted to any server. All processing runs entirely inside local browser memory.</p>
            </div>
            <div style="padding: 12px;">
              <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
              <h3 style="font-size: 17px; color: #fff; margin-bottom: 8px;">Offline-Ready WASM</h3>
              <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">The Rust engine compiles to WebAssembly and WebGPU shaders. Once cached, you can disconnect your Wi-Fi and continue editing without network connectivity.</p>
            </div>
            <div style="padding: 12px;">
              <div style="font-size: 32px; margin-bottom: 10px;">🛡️</div>
              <h3 style="font-size: 17px; color: #fff; margin-bottom: 8px;">No File Telemetry</h3>
              <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">We do not collect artwork telemetry, cookies, or tracking pixels. Your images, adjustment settings, and export assets belong exclusively to you.</p>
            </div>
          </div>
        </div>
      </section>
`;

html = html.replace(/<!-- AI Automation Section -->[\s\S]*?<!-- FAQ Section -->/, privacySection + '\n      <!-- FAQ Section -->');

// 6. Update WASM Loading overlay with diagnostics and progressive status
const newLoading = `    <div id="photocraft_loading">
      <div style="font-size: 36px; margin-bottom: 12px;">🎨</div>
      <p id="loading_status_text" style="font-weight: 700; font-size: 18px; color: #fff; margin-bottom: 6px;">Initializing PhotoCraft Web Engine&hellip;</p>
      <p id="loading_step_text" style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Fetching WebAssembly binary and configuring WebGPU hardware shaders...</p>
      
      <div id="photocraft_stalled" style="display: none; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 18px; max-width: 460px; margin: 0 auto; text-align: left;">
        <p style="font-weight: 700; color: #f87171; margin-bottom: 6px;">Taking longer than usual to start?</p>
        <p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 14px;">PhotoCraft requires WebGPU (available in Chrome 113+, Edge, Safari 18+). If your hardware does not support WebGPU or the connection was interrupted, reload or use our native desktop app.</p>
        <div style="display: flex; gap: 10px; justify-content: flex-start;">
          <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 14px;" onclick="location.reload()">Reload Browser</button>
          <a class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;" href="https://github.com/bshx2024/photocraft/releases" target="_blank" rel="noopener">Download Native App</a>
        </div>
      </div>
    </div>
`;

html = html.replace(/<div id="photocraft_loading">[\s\S]*?<\/div>\s*<\/div>\s*<!-- WASM Runner/, newLoading + '  </div>\n\n  <!-- WASM Runner');

// 7. Enhance JS with diagnostic timer
const loadingScriptSnippet = `
    let wasmLoaded = false;
    let loadingTimer = null;

    async function initPhotoCraft() {
      if (wasmLoaded) return;
      const stepEl = document.getElementById('loading_step_text');
      const stalledEl = document.getElementById('photocraft_stalled');
      
      if (stalledEl) {
        clearTimeout(loadingTimer);
        loadingTimer = setTimeout(() => {
          if (!wasmLoaded && stalledEl) {
            stalledEl.style.display = 'block';
          }
        }, 5000);
      }

      try {
        if (stepEl) stepEl.innerText = "Requesting WebAssembly bindings...";
        const { default: init, ...bindings } = await import('./photocraft-web-d0310536049c6524.js');
        if (stepEl) stepEl.innerText = "Compiling WebGPU pipeline...";
        const wasm = await init({ module_or_path: './photocraft-web-d0310536049c6524_bg.wasm' });
        window.wasmBindings = bindings;
        window.dispatchEvent(new CustomEvent("TrunkApplicationStarted", { detail: { wasm } }));
        wasmLoaded = true;
        const loader = document.getElementById('photocraft_loading');
        if (loader) loader.style.display = 'none';
      } catch (err) {
        console.error("Failed to initialize PhotoCraft Web:", err);
        if (stalledEl) stalledEl.style.display = 'block';
      }
    }
`;

html = html.replace(/let wasmLoaded = false;[\s\S]*?async function initPhotoCraft\(\) \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\s*\}/, loadingScriptSnippet);

fs.writeFileSync('dist/web/index.html', html, 'utf8');
fs.writeFileSync('apps/photocraft-web/index.html', html, 'utf8');

console.log('Successfully applied trust, visual mockup, privacy guarantee, and diagnostic recovery!');
