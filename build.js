#!/usr/bin/env node
/**
 * BudgetSheet Build Script
 *
 * Bundles the frontend for Google Apps Script (GAS) deployment.
 * - Reads frontend/index.html as the shell template
 * - Inlines all JS files into a single <script> block
 * - Writes output to Index.html (root, for clasp) and dist/Index.html (backup)
 *
 * Uses only Node.js built-in modules (fs, path).
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const FRONTEND = path.join(ROOT, 'frontend');
const DIST     = path.join(ROOT, 'dist');

// JS files to inline, in order
const JS_FILES = [
  'utils/format.js',
  'utils/api.js',
  'utils/icons.js',
  'components/toast.js',
  'components/modal.js',
  'components/charts.js',
  'pages/login.js',
  'pages/dashboard.js',
  'pages/transaksi.js',
  'pages/dompet.js',
  'pages/kategori.js',
  'pages/anggaran.js',
  'pages/langganan.js',
  'pages/laporan.js',
  'pages/pengaturan.js',
  'pages/legal.js',
  'app.js',
];

function build() {
  console.log('\n🔨 BudgetSheet Build\n');

  // 1. Clean and ensure dist/ exists
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
    console.log('  × Cleaned dist/');
  }
  fs.mkdirSync(DIST, { recursive: true });

  // 2. Copy all .gs files from root to dist/
  const files = fs.readdirSync(ROOT);
  files.forEach(file => {
    if (file.endsWith('.gs')) {
      fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
      console.log(`  + Copied: ${file} → dist/`);
    }
  });

  // 3. Copy appsscript.json to dist/
  const manifestPath = path.join(ROOT, 'appsscript.json');
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(DIST, 'appsscript.json'));
    console.log('  + Copied: appsscript.json → dist/');
  }

  // 4. Bundle HTML files
  const htmlFiles = ['index.html', 'setup.html'];
  
  htmlFiles.forEach(filename => {
    const srcPath = path.join(FRONTEND, filename);
    if (!fs.existsSync(srcPath)) {
      if (filename === 'index.html') {
        console.error(`  ❌ Error: ${srcPath} not found!`);
        process.exit(1);
      }
      return; // Skip setup.html if not present
    }

    let html = fs.readFileSync(srcPath, 'utf8');

    // Inline JS if index.html
    if (filename === 'index.html') {
      const inlinedParts = [];
      for (const relPath of JS_FILES) {
        const absPath = path.join(FRONTEND, relPath);
        if (!fs.existsSync(absPath)) {
          console.warn(`  ⚠ Warning: JS file not found: ${relPath}`);
          continue;
        }
        const content = fs.readFileSync(absPath, 'utf8');
        inlinedParts.push(`/* ── ${relPath} ── */\n${content}`);
        console.log(`  + Inlined: ${relPath}`);
      }

      const inlinedScript = `<script>\n${inlinedParts.join('\n\n')}\n</script>`;

      // Replace local script tags
      let replaced = false;
      html = html.replace(/<script\s+src="(?!https?:\/\/)([^"]+)"\s*><\/script>/g, (match, src) => {
        if (!replaced) {
          replaced = true;
          return inlinedScript;
        }
        return '';
      });
    }

    const outputName = filename.charAt(0).toUpperCase() + filename.slice(1); // index.html -> Index.html
    const outPath = path.join(DIST, outputName);
    fs.writeFileSync(outPath, html, 'utf8');
    
    const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`  ✓ ${outputName} → dist/ (${kb} KB)`);
  });

  console.log('\n✅ Build complete!\n');
}

build();
