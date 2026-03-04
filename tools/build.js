#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DEFAULT_BUILD_DIR = path.join(ROOT, 'build');
const CHROME_TEMPLATE_PATH = path.join(ROOT, 'manifests', 'chrome', 'manifest.json');

/**
 * Recursively copy a directory.
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove a directory.
 */
function rmDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Remove a file and its parent directory if the directory is empty.
 */
function removeFileAndEmptyParent(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  const dir = path.dirname(filePath);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

/**
 * Build Firefox extension — copy src/ as-is.
 * @param {string} [outputDir] - Output directory (default: build/firefox)
 */
function buildFirefox(outputDir) {
  const outDir = outputDir || path.join(DEFAULT_BUILD_DIR, 'firefox');
  rmDirSync(outDir);
  copyDirSync(SRC_DIR, outDir);
  console.log(`Firefox build complete: ${outDir}`);
}

/**
 * Build Chrome extension — copy src/, generate service worker, apply Chrome manifest.
 * @param {string} [outputDir] - Output directory (default: build/chrome)
 */
function buildChrome(outputDir) {
  const outDir = outputDir || path.join(DEFAULT_BUILD_DIR, 'chrome');
  rmDirSync(outDir);
  copyDirSync(SRC_DIR, outDir);

  // Read background scripts list from Firefox manifest (source of truth)
  const firefoxManifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.json'), 'utf8'));
  const bgScripts = firefoxManifest.background.scripts;

  // Concatenate background scripts into service-worker.js
  const parts = ["'use strict';"];
  for (const scriptPath of bgScripts) {
    // manifest uses forward slashes; convert to OS path for reading
    const filePath = path.join(SRC_DIR, scriptPath.split('/').join(path.sep));
    const content = fs.readFileSync(filePath, 'utf8');
    parts.push(`\n// --- ${scriptPath} ---`);
    parts.push(content);
  }
  fs.writeFileSync(path.join(outDir, 'service-worker.js'), parts.join('\n'), 'utf8');

  // Process Chrome manifest template — replace version placeholders
  const chromeTemplate = fs.readFileSync(CHROME_TEMPLATE_PATH, 'utf8');
  const processedManifest = chromeTemplate
    .replace(/__VERSION__/g, firefoxManifest.version)
    .replace(/__VERSION_NAME__/g, firefoxManifest.version_name || firefoxManifest.version);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), processedManifest, 'utf8');

  // Remove background/background.js (it's fully contained in service-worker.js)
  removeFileAndEmptyParent(path.join(outDir, 'background', 'background.js'));

  console.log(`Chrome build complete: ${outDir}`);
}

function main() {
  const args = process.argv.slice(2);
  const browserArg = args.find(a => a.startsWith('--browser='));
  const browser = browserArg ? browserArg.split('=')[1] : 'all';

  if (!['firefox', 'chrome', 'all'].includes(browser)) {
    console.error(`Unknown browser: ${browser}. Use --browser=firefox|chrome|all`);
    process.exit(1);
  }

  fs.mkdirSync(DEFAULT_BUILD_DIR, { recursive: true });

  if (browser === 'firefox' || browser === 'all') {
    buildFirefox();
  }
  if (browser === 'chrome' || browser === 'all') {
    buildChrome();
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildFirefox, buildChrome };
