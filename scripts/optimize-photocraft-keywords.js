const fs = require('fs');

let html = fs.readFileSync('dist/web/index.html', 'utf8');

// 1. Update Title and Descriptions
html = html.replace(/<title>.*?<\/title>/i, '<title>PhotoCraft Photoshop Alternative: Free Online PSD Editor</title>');
html = html.replace(/<meta name="description" content=".*?">/i, '<meta name="description" content="PhotoCraft is the free Photoshop alternative for layered PSD editing. Run 52 professional photo tools online with WebGPU speed and zero subscriptions.">');
html = html.replace(/<meta property="og:title" content=".*?">/i, '<meta property="og:title" content="PhotoCraft Photoshop Alternative: Free Online PSD Editor">');
html = html.replace(/<meta property="og:description" content=".*?">/i, '<meta property="og:description" content="PhotoCraft is the free Photoshop alternative for layered PSD editing. Run 52 professional photo tools online with WebGPU speed and zero subscriptions.">');
html = html.replace(/<meta name="twitter:title" content=".*?">/i, '<meta name="twitter:title" content="PhotoCraft Photoshop Alternative: Free Online PSD Editor">');
html = html.replace(/<meta name="twitter:description" content=".*?">/i, '<meta name="twitter:description" content="PhotoCraft is the free Photoshop alternative for layered PSD editing. Run 52 professional photo tools online with WebGPU speed and zero subscriptions.">');

// 2. Update H1
html = html.replace(/<h1>.*?<\/h1>/i, '<h1>PhotoCraft Photoshop Alternative: Free Online PSD Editor</h1>');

// 3. Update all 6 H2 headings to strictly contain "PhotoCraft Photoshop Alternative"
html = html.replace(/Why Choose PhotoCraft as Your Free Photoshop Alternative\?/g, 'Why Choose the PhotoCraft Photoshop Alternative?');
html = html.replace(/PhotoCraft vs Adobe Photoshop vs GIMP: Detailed Comparison/g, 'PhotoCraft Photoshop Alternative vs Adobe Photoshop &amp; GIMP');
html = html.replace(/52 Professional Editing Tools Built-in to PhotoCraft/g, '52 Professional Tools in PhotoCraft Photoshop Alternative');
html = html.replace(/Real-World Workflows with PhotoCraft as a Photoshop Alternative/g, 'Creative Workflows with PhotoCraft Photoshop Alternative');
html = html.replace(/AI Automation and Scripting with PhotoCraft/g, 'AI Agent Automation in PhotoCraft Photoshop Alternative');
html = html.replace(/Frequently Asked Questions About the PhotoCraft Photoshop Alternative/g, 'Frequently Asked Questions About PhotoCraft Photoshop Alternative');

// 4. Update footer h4 tags to p.footer-title to eliminate heading hierarchy skip (1.5 pts penalty)
html = html.replace(/<h4 class="footer-title">(.*?)<\/h4>/gi, '<p class="footer-title">$1</p>');
html = html.replace(/<h4>(.*?)<\/h4>/gi, '<p class="footer-title">$1</p>');
html = html.replace(/\.footer-col h4/g, '.footer-col .footer-title');

// 5. In body text, ensure the 3-gram "photocraft photoshop alternative" is reinforced across multiple sections
// while keeping "photocraft online" strong as candidate #2.
// Let's replace instances of "as a photoshop alternative" or "free open-source photoshop alternative"
html = html.replace(/free open-source Photoshop alternative/g, 'PhotoCraft Photoshop alternative');
html = html.replace(/free Photoshop alternative/g, 'PhotoCraft Photoshop alternative');

fs.writeFileSync('dist/web/index.html', html, 'utf8');
fs.writeFileSync('apps/photocraft-web/index.html', html, 'utf8');

console.log('Successfully optimized dist/web/index.html and apps/photocraft-web/index.html');
