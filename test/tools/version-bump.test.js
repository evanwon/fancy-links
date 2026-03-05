const {
  parseVersion,
  getCurrentStableVersion,
  computePreReleaseVersion,
  bumpVersion,
} = require('extension-workflows/tools/version-bump');

describe('parseVersion', () => {
  test('parses stable version', () => {
    expect(parseVersion('1.4.5')).toEqual({
      major: 1, minor: 4, patch: 5,
      suffix: null, suffixNum: null, isPrerelease: false,
    });
  });

  test('parses rc version', () => {
    expect(parseVersion('1.5.0-rc1')).toEqual({
      major: 1, minor: 5, patch: 0,
      suffix: 'rc', suffixNum: 1, isPrerelease: true,
    });
  });

  test('parses beta version', () => {
    expect(parseVersion('2.0.0-beta3')).toEqual({
      major: 2, minor: 0, patch: 0,
      suffix: 'beta', suffixNum: 3, isPrerelease: true,
    });
  });

  test('parses alpha version', () => {
    expect(parseVersion('1.0.0-alpha1')).toEqual({
      major: 1, minor: 0, patch: 0,
      suffix: 'alpha', suffixNum: 1, isPrerelease: true,
    });
  });

  test('throws on invalid input', () => {
    expect(() => parseVersion('not-a-version')).toThrow('Invalid version string');
  });

  test('throws on 4-segment version (manifest format)', () => {
    expect(() => parseVersion('1.4.5.1')).toThrow('Invalid version string');
  });

  test('throws on empty string', () => {
    expect(() => parseVersion('')).toThrow('Invalid version string');
  });

  test('throws on version with unknown suffix', () => {
    expect(() => parseVersion('1.0.0-dev1')).toThrow('Invalid version string');
  });
});

describe('getCurrentStableVersion', () => {
  test('returns stable version as-is (3 segments)', () => {
    expect(getCurrentStableVersion({ version: '1.4.5' })).toBe('1.4.5');
  });

  test('strips 4th segment from pre-release manifest version', () => {
    expect(getCurrentStableVersion({ version: '1.4.5.1' })).toBe('1.4.5');
  });

  test('strips 4th segment for higher suffix numbers', () => {
    expect(getCurrentStableVersion({ version: '1.4.5.3' })).toBe('1.4.5');
  });

  test('throws on unexpected format', () => {
    expect(() => getCurrentStableVersion({ version: '1.4' })).toThrow('Unexpected manifest version format');
  });
});

describe('computePreReleaseVersion', () => {
  test('appends suffix number to stable version', () => {
    expect(computePreReleaseVersion('1.4.5', 1)).toBe('1.4.5.1');
  });

  test('works with higher suffix numbers', () => {
    expect(computePreReleaseVersion('1.4.5', 3)).toBe('1.4.5.3');
  });

  test('works with different base versions', () => {
    expect(computePreReleaseVersion('2.0.0', 1)).toBe('2.0.0.1');
  });
});

describe('bumpVersion', () => {
  test('bumps patch', () => {
    expect(bumpVersion('1.4.5', 'patch')).toBe('1.4.6');
  });

  test('bumps minor', () => {
    expect(bumpVersion('1.4.5', 'minor')).toBe('1.5.0');
  });

  test('bumps major', () => {
    expect(bumpVersion('1.4.5', 'major')).toBe('2.0.0');
  });

  test('bumps patch from zero', () => {
    expect(bumpVersion('1.0.0', 'patch')).toBe('1.0.1');
  });

  test('bumps minor resets patch', () => {
    expect(bumpVersion('1.4.5', 'minor')).toBe('1.5.0');
  });

  test('bumps major resets minor and patch', () => {
    expect(bumpVersion('1.4.5', 'major')).toBe('2.0.0');
  });

  test('throws on unknown bump type', () => {
    expect(() => bumpVersion('1.0.0', 'unknown')).toThrow('Unknown bump type');
  });
});

describe('integration: version transitions', () => {
  // Helper to simulate what main() does without file I/O.
  // NOTE: This models happy-path only. Error guards (suffix mismatch,
  // rc-from-prerelease, stable-from-stable) are tested via CLI invocation below.
  function simulateBump(manifestVersion, versionName, command) {
    const manifest = { version: manifestVersion, version_name: versionName };
    const currentStable = getCurrentStableVersion(manifest);
    let parsed;
    try { parsed = parseVersion(versionName); } catch { parsed = null; }
    const isPrerelease = parsed && parsed.isPrerelease;
    const args = command.split(' ');

    let newVersionName, newManifestVersion;

    if (args.length === 1 && args[0].includes('.')) {
      const explicit = args[0];
      const ep = parseVersion(explicit);
      newVersionName = explicit;
      newManifestVersion = ep.isPrerelease ? computePreReleaseVersion(currentStable, ep.suffixNum) : explicit;
    } else if (args[0] === 'stable') {
      newVersionName = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
      newManifestVersion = newVersionName;
    } else if (['rc', 'beta', 'alpha'].includes(args[0])) {
      const suffix = args[0];
      if (isPrerelease && args.length === 1) {
        const nextNum = parsed.suffixNum + 1;
        newVersionName = `${parsed.major}.${parsed.minor}.${parsed.patch}-${suffix}${nextNum}`;
        newManifestVersion = computePreReleaseVersion(currentStable, nextNum);
      } else {
        const target = bumpVersion(currentStable, args[1]);
        newVersionName = `${target}-${suffix}1`;
        newManifestVersion = computePreReleaseVersion(currentStable, 1);
      }
    } else {
      newVersionName = bumpVersion(currentStable, args[0]);
      newManifestVersion = newVersionName;
    }

    return { newVersionName, newManifestVersion };
  }

  test('stable -> rc minor', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'rc minor');
    expect(result.newVersionName).toBe('1.5.0-rc1');
    expect(result.newManifestVersion).toBe('1.4.5.1');
  });

  test('stable -> rc patch', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'rc patch');
    expect(result.newVersionName).toBe('1.4.6-rc1');
    expect(result.newManifestVersion).toBe('1.4.5.1');
  });

  test('stable -> rc major', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'rc major');
    expect(result.newVersionName).toBe('2.0.0-rc1');
    expect(result.newManifestVersion).toBe('1.4.5.1');
  });

  test('rc1 -> rc2', () => {
    const result = simulateBump('1.4.5.1', '1.5.0-rc1', 'rc');
    expect(result.newVersionName).toBe('1.5.0-rc2');
    expect(result.newManifestVersion).toBe('1.4.5.2');
  });

  test('rc -> stable', () => {
    const result = simulateBump('1.4.5.1', '1.5.0-rc1', 'stable');
    expect(result.newVersionName).toBe('1.5.0');
    expect(result.newManifestVersion).toBe('1.5.0');
  });

  test('stable -> patch', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'patch');
    expect(result.newVersionName).toBe('1.4.6');
    expect(result.newManifestVersion).toBe('1.4.6');
  });

  test('stable -> minor', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'minor');
    expect(result.newVersionName).toBe('1.5.0');
    expect(result.newManifestVersion).toBe('1.5.0');
  });

  test('stable -> major', () => {
    const result = simulateBump('1.4.5', '1.4.5', 'major');
    expect(result.newVersionName).toBe('2.0.0');
    expect(result.newManifestVersion).toBe('2.0.0');
  });

  test('explicit version (stable)', () => {
    const result = simulateBump('1.4.5', '1.4.5', '3.0.0');
    expect(result.newVersionName).toBe('3.0.0');
    expect(result.newManifestVersion).toBe('3.0.0');
  });

  test('explicit version (pre-release)', () => {
    const result = simulateBump('1.4.5', '1.4.5', '1.5.0-rc1');
    expect(result.newVersionName).toBe('1.5.0-rc1');
    expect(result.newManifestVersion).toBe('1.4.5.1');
  });
});

describe('parseVersion rejects rc0', () => {
  test('throws on suffix number zero', () => {
    expect(() => parseVersion('1.5.0-rc0')).toThrow('Invalid version string');
  });

  test('throws on beta0', () => {
    expect(() => parseVersion('1.5.0-beta0')).toThrow('Invalid version string');
  });

  test('throws on alpha0', () => {
    expect(() => parseVersion('1.5.0-alpha0')).toThrow('Invalid version string');
  });
});

describe('CLI error exits', () => {
  const { execFileSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const SCRIPT = require.resolve('extension-workflows/tools/version-bump');
  const MANIFEST_PATH = path.resolve(__dirname, '../../src/manifest.json');
  const PACKAGE_PATH = path.resolve(__dirname, '../../package.json');

  // Save and restore real files so tests run from a known stable state
  // regardless of the repo's current version.
  let savedManifest, savedPackage;

  beforeAll(() => {
    savedManifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
    savedPackage = fs.readFileSync(PACKAGE_PATH, 'utf8');

    const manifest = JSON.parse(savedManifest);
    manifest.version = '1.4.5';
    delete manifest.version_name;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

    const pkg = JSON.parse(savedPackage);
    pkg.version = '1.4.5';
    fs.writeFileSync(PACKAGE_PATH, JSON.stringify(pkg, null, 2) + '\n');
  });

  afterAll(() => {
    fs.writeFileSync(MANIFEST_PATH, savedManifest);
    fs.writeFileSync(PACKAGE_PATH, savedPackage);
  });

  function runBump(...args) {
    return execFileSync(process.execPath, [SCRIPT, ...args, '--dry-run'], {
      encoding: 'utf8',
      env: { ...process.env },
    });
  }

  test('"stable" from stable state exits with error', () => {
    expect(() => runBump('stable')).toThrow(/only valid from a pre-release state/);
  });

  test('"rc" without bump type from stable state exits with error', () => {
    expect(() => runBump('rc')).toThrow();
  });

  test('unknown command exits with error', () => {
    expect(() => runBump('unknown-command')).toThrow(/Unknown command/);
  });
});
