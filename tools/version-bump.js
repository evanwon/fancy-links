#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'src', 'manifest.json');
const PACKAGE_PATH = path.resolve(__dirname, '..', 'package.json');

/**
 * Parse a version string like "1.5.0" or "1.5.0-rc1" into components.
 */
function parseVersion(str) {
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)(?:-(rc|beta|alpha)([1-9]\d*))?$/);
  if (!match) {
    throw new Error(`Invalid version string: "${str}"`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    suffix: match[4] || null,
    suffixNum: match[5] ? parseInt(match[5], 10) : null,
    isPrerelease: !!match[4],
  };
}

/**
 * Given a manifest object, return the current stable version (X.Y.Z).
 * - If version is 3 segments (stable), return as-is.
 * - If version is 4 segments (pre-release like "1.4.5.1"), strip the last segment.
 */
function getCurrentStableVersion(manifest) {
  const v = manifest.version;
  const parts = v.split('.');
  if (parts.length === 3) {
    return v;
  }
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.');
  }
  throw new Error(`Unexpected manifest version format: "${v}"`);
}

/**
 * Compute the 4-segment pre-release version for manifest.version.
 * e.g., computePreReleaseVersion("1.4.5", 1) => "1.4.5.1"
 */
function computePreReleaseVersion(previousStable, suffixNum) {
  return `${previousStable}.${suffixNum}`;
}

/**
 * Apply a semver bump (patch/minor/major) to a parsed version.
 */
function bumpVersion(currentVersion, bumpType) {
  const v = parseVersion(currentVersion);
  switch (bumpType) {
    case 'patch':
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    case 'minor':
      return `${v.major}.${v.minor + 1}.0`;
    case 'major':
      return `${v.major + 1}.0.0`;
    default:
      throw new Error(`Unknown bump type: "${bumpType}"`);
  }
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(a => a !== '--dry-run');

  if (positional.length === 0) {
    printUsage();
    process.exit(1);
  }

  const manifest = readJSON(MANIFEST_PATH);
  const pkg = readJSON(PACKAGE_PATH);

  const versionName = manifest.version_name || manifest.version;
  const currentStable = getCurrentStableVersion(manifest);
  let parsed;
  try {
    parsed = parseVersion(versionName);
  } catch (e) {
    console.warn(`Warning: Could not parse version_name "${versionName}" (${e.message}). Treating as stable.`);
    parsed = null;
  }

  const isCurrentlyPrerelease = parsed && parsed.isPrerelease;

  let newVersionName; // display version, e.g. "1.5.0-rc1" or "1.5.0"
  let newManifestVersion; // numeric version for Firefox, e.g. "1.4.5.1" or "1.5.0"

  // Check if first arg is an explicit version (contains a dot)
  if (positional.length === 1 && positional[0].includes('.')) {
    const explicit = positional[0];
    const explicitParsed = parseVersion(explicit);
    newVersionName = explicit;
    if (explicitParsed.isPrerelease) {
      // Validate that target base version is strictly greater than current stable
      const targetBase = `${explicitParsed.major}.${explicitParsed.minor}.${explicitParsed.patch}`;
      const stableParsed = parseVersion(currentStable);
      const targetTuple = [explicitParsed.major, explicitParsed.minor, explicitParsed.patch];
      const stableTuple = [stableParsed.major, stableParsed.minor, stableParsed.patch];
      const isGreater = targetTuple[0] > stableTuple[0] ||
        (targetTuple[0] === stableTuple[0] && targetTuple[1] > stableTuple[1]) ||
        (targetTuple[0] === stableTuple[0] && targetTuple[1] === stableTuple[1] && targetTuple[2] > stableTuple[2]);
      if (!isGreater) {
        console.error(`Error: Pre-release target "${targetBase}" must be greater than current stable "${currentStable}".`);
        console.error(`A 4-segment version like "${currentStable}.${explicitParsed.suffixNum}" would not sort below "${targetBase}" in Firefox.`);
        process.exit(1);
      }
      // For explicit pre-release, compute 4-segment from current stable
      newManifestVersion = computePreReleaseVersion(currentStable, explicitParsed.suffixNum);
    } else {
      newManifestVersion = explicit;
    }
  } else if (positional[0] === 'stable') {
    // Promote pre-release to stable
    if (!isCurrentlyPrerelease) {
      console.error('Error: "stable" command only valid from a pre-release state.');
      console.error(`Current version_name is "${versionName}" which is not a pre-release.`);
      process.exit(1);
    }
    newVersionName = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    newManifestVersion = newVersionName;
  } else if (positional[0] === 'rc' || positional[0] === 'beta' || positional[0] === 'alpha') {
    const suffix = positional[0];
    if (isCurrentlyPrerelease && positional.length === 1) {
      // Increment the suffix number (e.g., rc1 -> rc2)
      if (parsed.suffix !== suffix) {
        console.error(`Error: Current pre-release suffix is "${parsed.suffix}" but you asked to bump "${suffix}".`);
        console.error(`First promote to stable with "stable", then use "${suffix} patch|minor|major".`);
        process.exit(1);
      }
      const nextNum = parsed.suffixNum + 1;
      newVersionName = `${parsed.major}.${parsed.minor}.${parsed.patch}-${suffix}${nextNum}`;
      newManifestVersion = computePreReleaseVersion(currentStable, nextNum);
    } else if (positional.length === 2) {
      // Start new pre-release series: rc patch, rc minor, rc major
      const bumpType = positional[1];
      if (!['patch', 'minor', 'major'].includes(bumpType)) {
        console.error(`Error: Invalid bump type "${bumpType}". Use patch, minor, or major.`);
        process.exit(1);
      }
      if (isCurrentlyPrerelease) {
        console.error(`Error: Cannot start a new pre-release series while already in pre-release ("${versionName}").`);
        console.error('First promote to stable with "stable", or increment with just "rc".');
        process.exit(1);
      }
      const targetVersion = bumpVersion(currentStable, bumpType);
      newVersionName = `${targetVersion}-${suffix}1`;
      newManifestVersion = computePreReleaseVersion(currentStable, 1);
    } else {
      console.error(`Error: Invalid arguments for "${suffix}" command.`);
      console.error(`From stable: "${suffix} patch|minor|major"  From pre-release: "${suffix}"`);
      process.exit(1);
    }
  } else if (['patch', 'minor', 'major'].includes(positional[0])) {
    if (isCurrentlyPrerelease) {
      console.error(`Error: Cannot do a "${positional[0]}" bump while in pre-release ("${versionName}").`);
      console.error('First promote to stable with "stable", then bump.');
      process.exit(1);
    }
    newVersionName = bumpVersion(currentStable, positional[0]);
    newManifestVersion = newVersionName;
  } else {
    console.error(`Error: Unknown command "${positional[0]}".`);
    printUsage();
    process.exit(1);
  }

  // Print summary
  console.log(`Version bump: ${versionName} -> ${newVersionName}`);
  console.log('');
  console.log('  src/manifest.json:');
  console.log(`    version:      "${manifest.version}" -> "${newManifestVersion}"`);
  console.log(`    version_name:  "${versionName}" -> "${newVersionName}"`);
  console.log('  package.json:');
  console.log(`    version:      "${pkg.version}" -> "${newManifestVersion}"`);

  if (dryRun) {
    console.log('');
    console.log('(dry run — no files changed)');
    return;
  }

  // Write changes
  manifest.version = newManifestVersion;
  manifest.version_name = newVersionName;
  writeJSON(MANIFEST_PATH, manifest);

  pkg.version = newManifestVersion;
  writeJSON(PACKAGE_PATH, pkg);

  console.log('');
  console.log('Files updated. Suggested next steps:');
  console.log('');
  console.log(`  git add src/manifest.json package.json`);
  console.log(`  git commit -m "Prepare v${newVersionName}"`);
  console.log(`  git tag v${newVersionName}`);
  console.log(`  git push origin v${newVersionName}`);
}

function printUsage() {
  console.log('Usage: node tools/version-bump.js <command> [options]');
  console.log('');
  console.log('From stable state:');
  console.log('  patch                Bump patch version (1.4.5 -> 1.4.6)');
  console.log('  minor                Bump minor version (1.4.5 -> 1.5.0)');
  console.log('  major                Bump major version (1.4.5 -> 2.0.0)');
  console.log('  rc patch             Start RC for next patch (1.4.5 -> 1.4.6-rc1)');
  console.log('  rc minor             Start RC for next minor (1.4.5 -> 1.5.0-rc1)');
  console.log('  rc major             Start RC for next major (1.4.5 -> 2.0.0-rc1)');
  console.log('');
  console.log('From pre-release state:');
  console.log('  rc                   Increment RC number (1.5.0-rc1 -> 1.5.0-rc2)');
  console.log('  stable               Promote to stable (1.5.0-rc1 -> 1.5.0)');
  console.log('');
  console.log('Escape hatch:');
  console.log('  1.5.0-rc1            Set explicit version');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run            Print changes without writing files');
}

// Support both CLI and testing
if (require.main === module) {
  main();
}

module.exports = { parseVersion, getCurrentStableVersion, computePreReleaseVersion, bumpVersion };
