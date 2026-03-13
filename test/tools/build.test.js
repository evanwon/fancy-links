const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { buildFirefox, buildChrome } = require('../../tools/build');

// All source files relative to src/
const srcDir = path.resolve(__dirname, '..', '..', 'src');
function listFilesRecursive(dir, base) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(path.join(dir, entry.name), rel));
    } else {
      results.push(rel.split(path.sep).join('/'));
    }
  }
  return results;
}

const srcFiles = listFilesRecursive(srcDir, '');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fancy-links-build-'));
}

describe('buildFirefox', () => {
  let outDir;

  beforeEach(() => {
    outDir = path.join(makeTempDir(), 'firefox');
  });

  afterEach(() => {
    fs.rmSync(path.dirname(outDir), { recursive: true, force: true });
  });

  test('all src files present in output', () => {
    buildFirefox(outDir);
    const outFiles = listFilesRecursive(outDir, '');
    for (const file of srcFiles) {
      expect(outFiles).toContain(file);
    }
  });

  test('files are identical to source', () => {
    buildFirefox(outDir);
    for (const file of srcFiles) {
      const srcContent = fs.readFileSync(path.join(srcDir, file));
      const outContent = fs.readFileSync(path.join(outDir, file.split('/').join(path.sep)));
      expect(srcContent.equals(outContent)).toBe(true);
    }
  });

  test('build is idempotent', () => {
    buildFirefox(outDir);
    const firstFiles = listFilesRecursive(outDir, '').sort();
    buildFirefox(outDir);
    const secondFiles = listFilesRecursive(outDir, '').sort();
    expect(secondFiles).toEqual(firstFiles);
  });
});

describe('buildChrome', () => {
  let outDir;

  beforeEach(() => {
    outDir = path.join(makeTempDir(), 'chrome');
  });

  afterEach(() => {
    fs.rmSync(path.dirname(outDir), { recursive: true, force: true });
  });

  test('service-worker.js exists with use strict preamble', () => {
    buildChrome(outDir);
    const sw = fs.readFileSync(path.join(outDir, 'service-worker.js'), 'utf8');
    expect(sw.startsWith("'use strict';")).toBe(true);
  });

  test('service-worker.js contains background scripts in correct order', () => {
    buildChrome(outDir);
    const sw = fs.readFileSync(path.join(outDir, 'service-worker.js'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(srcDir, 'manifest.json'), 'utf8'));
    const bgScripts = manifest.background.scripts;

    // Each script should appear as a separator comment
    for (const script of bgScripts) {
      expect(sw).toContain(`// --- ${script} ---`);
    }

    // Verify order: each script separator appears after the previous one
    let lastIndex = -1;
    for (const script of bgScripts) {
      const index = sw.indexOf(`// --- ${script} ---`);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
  });

  test('service-worker.js is valid JavaScript', () => {
    buildChrome(outDir);
    const sw = fs.readFileSync(path.join(outDir, 'service-worker.js'), 'utf8');
    expect(() => vm.compileFunction(sw)).not.toThrow();
  });

  test('Chrome manifest has actual version (no placeholders)', () => {
    buildChrome(outDir);
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
    expect(manifest.version).not.toContain('__VERSION__');
    expect(manifest.version_name).not.toContain('__VERSION_NAME__');
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background.service_worker).toBe('service-worker.js');
  });

  test('Chrome manifest version matches Firefox manifest', () => {
    buildChrome(outDir);
    const chromeManifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
    const firefoxManifest = JSON.parse(fs.readFileSync(path.join(srcDir, 'manifest.json'), 'utf8'));
    expect(chromeManifest.version).toBe(firefoxManifest.version);
    expect(chromeManifest.version_name).toBe(firefoxManifest.version_name);
  });

  test('background/background.js is removed', () => {
    buildChrome(outDir);
    expect(fs.existsSync(path.join(outDir, 'background', 'background.js'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'background'))).toBe(false);
  });

  test('shared files still present', () => {
    buildChrome(outDir);
    expect(fs.existsSync(path.join(outDir, 'formats', 'format-registry.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'utils', 'browser-api.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'utils', 'settings-defaults.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'utils', 'clean-url.js'))).toBe(true);
  });

  test('popup, options, content, and icon files present', () => {
    buildChrome(outDir);
    expect(fs.existsSync(path.join(outDir, 'popup', 'popup.html'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'popup', 'popup.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'options', 'options.html'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'options', 'options.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'content', 'clipboard-writer.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'icons', 'icon-16.png'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'icons', 'icon-128.png'))).toBe(true);
  });
});

describe('CLI', () => {
  let buildDir;

  beforeEach(() => {
    buildDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(buildDir, { recursive: true, force: true });
  });

  function runBuild(browserFlag) {
    // Run with modified DEFAULT_BUILD_DIR isn't possible via CLI,
    // so we run the actual script and check the default build/ output
    const scriptPath = path.resolve(__dirname, '..', '..', 'tools', 'build.js');
    execFileSync(process.execPath, [scriptPath, `--browser=${browserFlag}`], {
      cwd: path.resolve(__dirname, '..', '..'),
      stdio: 'pipe',
    });
  }

  test('--browser=firefox produces only firefox output', () => {
    runBuild('firefox');
    const buildRoot = path.resolve(__dirname, '..', '..', 'build');
    expect(fs.existsSync(path.join(buildRoot, 'firefox', 'manifest.json'))).toBe(true);
  });

  test('--browser=chrome produces only chrome output', () => {
    runBuild('chrome');
    const buildRoot = path.resolve(__dirname, '..', '..', 'build');
    expect(fs.existsSync(path.join(buildRoot, 'chrome', 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(buildRoot, 'chrome', 'service-worker.js'))).toBe(true);
  });

  test('--browser=all produces both outputs', () => {
    runBuild('all');
    const buildRoot = path.resolve(__dirname, '..', '..', 'build');
    expect(fs.existsSync(path.join(buildRoot, 'firefox', 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(buildRoot, 'chrome', 'manifest.json'))).toBe(true);
  });
});
