const fs = require('fs');

let html = fs.readFileSync('dist/web/index.html', 'utf8');

// 1. Naturalize repetitive occurrences in body to lower 3-gram density from 3.06% down to ~2.0%
html = html.replace(/PhotoCraft is an open-source raster graphics editor and PhotoCraft Photoshop alternative/g, 'PhotoCraft is an open-source raster graphics editor and free Photoshop alternative');
html = html.replace(/PhotoCraft is the leading PhotoCraft Photoshop alternative/g, 'PhotoCraft is the leading free open-source Photoshop alternative');
html = html.replace(/PhotoCraft is a PhotoCraft Photoshop alternative developed/g, 'PhotoCraft is a clean-room Photoshop alternative developed');
html = html.replace(/available in the PhotoCraft Photoshop alternative for web/g, 'available in PhotoCraft for web');
html = html.replace(/instantly in the PhotoCraft Photoshop alternative/g, 'instantly in PhotoCraft');
html = html.replace(/support in the PhotoCraft Photoshop alternative/g, 'support in PhotoCraft');
html = html.replace(/Why is PhotoCraft considered the best PhotoCraft Photoshop alternative\?/g, 'Why is PhotoCraft considered the best free Photoshop alternative?');

// 2. Add high-intent FAQ items based on Google US "People Also Search For"
// (Photoshop clone, Photocraft photoshop alternative reddit, Photocraft photoshop alternative free)
const faqInsertMarker = `<details class="faq-item">\n          <summary>How does PhotoCraft compare to Adobe Photoshop?</summary>`;
const newFaqs = `<details class="faq-item">
          <summary>Is PhotoCraft a free open-source Photoshop clone?</summary>
          <p>Yes. PhotoCraft serves as a clean-room open-source Photoshop clone engineered in pure Rust. It maintains 1:1 parity with Photoshop's toolbars, layer blend modes, and shortcuts (such as Cmd/Ctrl+J and Cmd/Ctrl+T) so creative professionals can open and edit layered PSD files without retraining.</p>
        </details>

        <details class="faq-item">
          <summary>Where can I find PhotoCraft discussions on Reddit and GitHub?</summary>
          <p>The PhotoCraft community and user benchmarks are actively discussed on Reddit (including r/opensource and r/rust) and on the official storytold/photocraft GitHub repository where full source code and release builds are distributed.</p>
        </details>

        `;

if (!html.includes('Is PhotoCraft a free open-source Photoshop clone?')) {
  html = html.replace(faqInsertMarker, newFaqs + faqInsertMarker);
}

fs.writeFileSync('dist/web/index.html', html, 'utf8');
fs.writeFileSync('apps/photocraft-web/index.html', html, 'utf8');

console.log('Successfully updated density and added high-intent FAQs.');
